import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export interface GpuDevice {
  vendor: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'Unknown';
  name: string;
  type: 'discrete' | 'integrated' | 'unified' | 'unknown';
  vramMb?: number;
  driver?: string;
  accelerator: 'cuda' | 'vulkan' | 'metal' | 'cpu';
}

export interface HardwareDiagnostics {
  os: string;
  platform: NodeJS.Platform;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryMb: number;
  freeMemoryMb: number;
  gpus: GpuDevice[];
  activeAccelerator: {
    backend: 'cuda' | 'vulkan' | 'metal' | 'cpu';
    name: string;
    description: string;
    targetDevice: string;
  };
  vulkanSupported: boolean;
}

export class HardwareDetector {
  private static cachedDiagnostics: HardwareDiagnostics | null = null;

  public static isIntegratedGpu(name: string): boolean {
    const lower = name.toLowerCase();
    return (
      lower.includes('graphics') ||
      lower.includes('uhd') ||
      lower.includes('iris') ||
      lower.includes('vega') ||
      lower.includes('780m') ||
      lower.includes('680m') ||
      lower.includes('890m') ||
      lower.includes('660m') ||
      lower.includes('apu') ||
      lower.includes('integrated')
    );
  }

  public static checkVulkanSupport(): boolean {
    const platform = process.platform;
    if (platform === 'win32') {
      const winDir = process.env.SystemRoot || 'C:\\Windows';
      const vulkanDll = path.join(winDir, 'System32', 'vulkan-1.dll');
      return fs.existsSync(vulkanDll);
    } else if (platform === 'linux') {
      const paths = [
        '/usr/lib/libvulkan.so',
        '/usr/lib/x86_64-linux-gnu/libvulkan.so.1',
        '/usr/lib64/libvulkan.so',
      ];
      if (paths.some((p) => fs.existsSync(p))) return true;
      try {
        execSync('command -v vulkaninfo', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    } else if (platform === 'darwin') {
      return false; // macOS uses native Metal API
    }
    return false;
  }

  public static detectGpus(): GpuDevice[] {
    const gpus: GpuDevice[] = [];
    const platform = process.platform;

    // 1. Check NVIDIA via nvidia-smi (all platforms)
    try {
      const nvidiaCmd = platform === 'win32'
        ? (fs.existsSync('C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe')
            ? '"C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe"'
            : 'nvidia-smi')
        : 'nvidia-smi';

      const output = execSync(
        `${nvidiaCmd} --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits`,
        { timeout: 2500, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      );

      for (const line of output.trim().split('\n')) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts[0]) {
          gpus.push({
            vendor: 'NVIDIA',
            name: parts[0],
            type: 'discrete',
            vramMb: parts[1] ? parseInt(parts[1], 10) : undefined,
            driver: parts[2] || undefined,
            accelerator: 'cuda',
          });
        }
      }
    } catch {
      // nvidia-smi not available or no NVIDIA GPU
    }

    // 2. Windows Video Controllers (AMD, Intel, etc.)
    if (platform === 'win32') {
      try {
        const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM"';
        const out = execSync(cmd, { timeout: 3500, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        
        for (const line of out.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('Name') || trimmed.startsWith('----')) continue;

          // Win32_VideoController output formats Name and AdapterRAM
          const match = trimmed.match(/^(.+?)\s+(\d+)$/);
          const name = match ? match[1].trim() : trimmed;
          const ramBytes = match && match[2] ? parseInt(match[2], 10) : 0;
          const vramMb = ramBytes > 0 ? Math.round(ramBytes / (1024 * 1024)) : undefined;

          const lower = name.toLowerCase();
          let vendor: GpuDevice['vendor'] = 'Unknown';
          if (lower.includes('amd') || lower.includes('radeon')) {
            vendor = 'AMD';
          } else if (lower.includes('intel') || lower.includes('iris') || lower.includes('arc')) {
            vendor = 'Intel';
          } else if (lower.includes('nvidia') || lower.includes('geforce')) {
            vendor = 'NVIDIA';
          }

          if (vendor === 'NVIDIA' && gpus.some((g) => g.vendor === 'NVIDIA')) {
            continue; // Already detected with exact VRAM via nvidia-smi
          }

          if (vendor !== 'Unknown') {
            const isIntegrated = this.isIntegratedGpu(name);
            gpus.push({
              vendor,
              name,
              type: isIntegrated ? 'integrated' : 'discrete',
              vramMb,
              accelerator: 'vulkan',
            });
          }
        }
      } catch {
        // Fallback or ignore
      }
    }

    // 3. Linux via lspci
    else if (platform === 'linux') {
      try {
        const out = execSync('lspci', { timeout: 2000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        for (const line of out.split('\n')) {
          const lower = line.toLowerCase();
          if (lower.includes('vga compatible controller') || lower.includes('3d controller') || lower.includes('display controller')) {
            const devName = line.split(':').pop()?.trim() || line;
            if (lower.includes('amd') || lower.includes('radeon')) {
              gpus.push({
                vendor: 'AMD',
                name: devName,
                type: this.isIntegratedGpu(devName) ? 'integrated' : 'discrete',
                accelerator: 'vulkan',
              });
            } else if (lower.includes('intel')) {
              gpus.push({
                vendor: 'Intel',
                name: devName,
                type: this.isIntegratedGpu(devName) ? 'integrated' : 'discrete',
                accelerator: 'vulkan',
              });
            } else if (lower.includes('nvidia') && !gpus.some((g) => g.vendor === 'NVIDIA')) {
              gpus.push({
                vendor: 'NVIDIA',
                name: devName,
                type: 'discrete',
                accelerator: 'cuda',
              });
            }
          }
        }
      } catch {
        // lspci not found
      }
    }

    // 4. macOS Apple Silicon or Intel Mac
    else if (platform === 'darwin') {
      if (process.arch === 'arm64') {
        gpus.push({
          vendor: 'Apple',
          name: 'Apple Silicon GPU (Metal Unified Memory)',
          type: 'unified',
          accelerator: 'metal',
        });
      } else {
        try {
          const out = execSync('system_profiler SPDisplaysDataType', {
            timeout: 2500,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          });
          const match = out.match(/Chipset Model:\s*(.+)/i);
          if (match && match[1]) {
            const name = match[1].trim();
            const lower = name.toLowerCase();
            const vendor = lower.includes('amd') || lower.includes('radeon') ? 'AMD' : 'Intel';
            gpus.push({
              vendor,
              name,
              type: this.isIntegratedGpu(name) ? 'integrated' : 'discrete',
              accelerator: 'metal',
            });
          }
        } catch {
          // ignore
        }
      }
    }

    return gpus;
  }

  public static getDiagnostics(): HardwareDiagnostics {
    if (this.cachedDiagnostics) {
      return this.cachedDiagnostics;
    }

    const gpus = this.detectGpus();
    const vulkanSupported = this.checkVulkanSupport();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Standard CPU';
    const cpuCores = cpus.length;

    // Determine best hardware accelerator
    let activeAccelerator: HardwareDiagnostics['activeAccelerator'];

    // Priority 1: macOS Apple Silicon -> Metal
    if (process.platform === 'darwin' && process.arch === 'arm64') {
      activeAccelerator = {
        backend: 'metal',
        name: 'Apple Metal (Unified Memory)',
        description: 'Native Apple Silicon GPU Acceleration with Unified RAM pool',
        targetDevice: 'Apple Silicon M-Series',
      };
    }
    // Priority 2: NVIDIA discrete GPU -> CUDA
    else if (gpus.some((g) => g.vendor === 'NVIDIA' && g.accelerator === 'cuda')) {
      const nv = gpus.find((g) => g.vendor === 'NVIDIA')!;
      activeAccelerator = {
        backend: 'cuda',
        name: `NVIDIA CUDA (${nv.name})`,
        description: `Dedicated NVIDIA CUDA Acceleration (${nv.vramMb ? nv.vramMb + ' MB VRAM' : 'High Performance'})`,
        targetDevice: nv.name,
      };
    }
    // Priority 3: AMD / Intel (dGPU or iGPU) with Vulkan
    else if (gpus.some((g) => g.vendor === 'AMD' || g.vendor === 'Intel') || vulkanSupported) {
      const gpu = gpus.find((g) => g.vendor === 'AMD' || g.vendor === 'Intel') || {
        vendor: 'AMD',
        name: 'Vulkan Compatible GPU',
        type: 'integrated',
        accelerator: 'vulkan',
      };

      const typeLabel = gpu.type === 'integrated' ? 'Integrated iGPU/APU' : 'Discrete dGPU';
      activeAccelerator = {
        backend: 'vulkan',
        name: `Vulkan Hardware Acceleration (${gpu.vendor} ${gpu.type === 'integrated' ? 'iGPU' : 'dGPU'})`,
        description: `Cross-platform Vulkan Pipeline on ${gpu.name} (${typeLabel})`,
        targetDevice: gpu.name,
      };
    }
    // Priority 4: CPU Fallback
    else {
      activeAccelerator = {
        backend: 'cpu',
        name: `CPU Multithreaded AVX2 (${cpuModel})`,
        description: `Multithreaded vector CPU fallback (${cpuCores} threads)`,
        targetDevice: cpuModel,
      };
    }

    this.cachedDiagnostics = {
      os: `${os.type()} ${os.release()}`,
      platform: process.platform,
      arch: process.arch,
      cpuModel,
      cpuCores,
      totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
      gpus,
      activeAccelerator,
      vulkanSupported,
    };

    return this.cachedDiagnostics;
  }
}
