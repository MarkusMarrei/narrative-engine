import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Terminal,
  Copy,
  Check,
  Radio,
  ExternalLink,
  BookOpen,
  Code2,
  Layers,
  Sparkles,
  Zap,
  Gauge,
} from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const theme = useStoryStore((s) => s.theme);
  const wsConnected = useStoryStore((s) => s.wsConnected);
  const hardware = useStoryStore((s) => s.hardware);
  const lowSpecMode = useStoryStore((s) => s.lowSpecMode);
  const toggleLowSpecMode = useStoryStore((s) => s.toggleLowSpecMode);
  const fetchHardware = useStoryStore((s) => s.fetchHardware);
  const isDark = theme === 'dark';

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !hardware) {
      fetchHardware();
    }
  }, [isOpen, hardware, fetchHardware]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const antigravityConfig = JSON.stringify(
    {
      mcpServers: {
        "narrative-engine": {
          url: "http://127.0.0.1:3001/sse"
        }
      }
    },
    null,
    2
  );

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        "narrative-engine": {
          command: "node",
          args: [
            "C:/Users/Маркус/OneDrive/Desktop/Narrative Engine/Narrative Engine v3/backend/dist/mcp/stdioRunner.js"
          ]
        }
      }
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      name: "narrative-engine",
      type: "sse",
      url: "http://127.0.0.1:3001/sse"
    },
    null,
    2
  );

  const tools = [
    {
      name: 'narrative_get_graph',
      description: 'narrative_get_graph',
    },
    {
      name: 'narrative_update_node',
      description: 'narrative_update_node',
    },
    {
      name: 'narrative_add_node',
      description: 'narrative_add_node',
    },
    {
      name: 'narrative_delete_node',
      description: 'narrative_delete_node',
    },
    {
      name: 'narrative_audit_scene',
      description: 'narrative_audit_scene',
    },
    {
      name: 'narrative_compile',
      description: 'narrative_compile',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark
            ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 shadow-yellow-500/5'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/60'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md font-bold ${
                isDark
                  ? 'bg-yellow-400 text-black shadow-yellow-400/20'
                  : 'bg-rose-600 text-white shadow-rose-600/20'
              }`}
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide font-mono whitespace-nowrap shrink-0">
                  {t.mcpModal.modalTitle}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${
                    wsConnected
                      ? isDark
                        ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  <Radio className={`w-2.5 h-2.5 ${wsConnected ? 'animate-pulse' : ''}`} />
                  {wsConnected ? t.mcpModal.liveSyncActiveDesc : t.mcpModal.liveSyncConnectingDesc}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t.mcpModal.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#25252b]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* 0. Hardware & GPU Acceleration Diagnostics Card */}
          <div
            className={`p-4 rounded-xl border space-y-3.5 ${
              isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
                {t.nav?.brandSubtitle ? 'Аппаратное ускорение и Графика' : 'Hardware & GPU Acceleration'}
              </h4>
              {hardware && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                      hardware.activeAccelerator.backend === 'vulkan'
                        ? isDark
                          ? 'bg-amber-400/10 text-yellow-400 border-yellow-400/30'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        : hardware.activeAccelerator.backend === 'cuda'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : isDark
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {hardware.activeAccelerator.name}
                  </span>
                </div>
              )}
            </div>

            {hardware ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* GPU Info */}
                  <div
                    className={`p-3 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                      isDark ? 'bg-[#18181b] border-[#2c2c32]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] opacity-60 uppercase flex items-center justify-between">
                      <span>GPU Ускоритель</span>
                      <span className="text-[9px] uppercase px-1 rounded bg-zinc-700/50 text-zinc-300">
                        {hardware.gpus[0]?.type || 'gpu'}
                      </span>
                    </div>
                    <div className="font-bold my-1 text-xs text-amber-500 dark:text-yellow-400 truncate" title={hardware.gpus[0]?.name || 'N/A'}>
                      {hardware.gpus[0]?.name || 'Universal WebGL/CPU'}
                    </div>
                    <div className="text-[11px] opacity-75 font-sans">
                      {hardware.gpus[0]?.vramMb ? `${hardware.gpus[0].vramMb} MB VRAM` : 'Shared System RAM'} • {hardware.vulkanSupported ? 'Vulkan 1.3 Active' : 'Fallback'}
                    </div>
                  </div>

                  {/* CPU & Memory */}
                  <div
                    className={`p-3 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                      isDark ? 'bg-[#18181b] border-[#2c2c32]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] opacity-60 uppercase">Процессор и Память</div>
                    <div className="font-bold my-1 text-xs text-zinc-200 truncate" title={hardware.cpuModel}>
                      {hardware.cpuModel.trim()}
                    </div>
                    <div className="text-[11px] opacity-75 font-sans">
                      {hardware.cpuCores} Cores • {(hardware.totalMemoryMb / 1024).toFixed(1)} GB RAM ({(hardware.freeMemoryMb / 1024).toFixed(1)} GB Free)
                    </div>
                  </div>

                  {/* OS & Architecture */}
                  <div
                    className={`p-3 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                      isDark ? 'bg-[#18181b] border-[#2c2c32]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] opacity-60 uppercase">Кроссплатформенность</div>
                    <div className="font-bold my-1 text-xs text-zinc-200 truncate">
                      {hardware.platform === 'win32' ? 'Windows' : hardware.platform === 'darwin' ? 'macOS' : 'Linux'} ({hardware.arch})
                    </div>
                    <div className="text-[11px] opacity-75 font-sans truncate">
                      {hardware.platform === 'win32' ? 'start_windows.bat' : './start_linux_mac.sh'}
                    </div>
                  </div>
                </div>

                {/* iGPU / Low-Spec Eco Mode Toggle */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                    isDark ? 'bg-[#151518] border-[#26262b]' : 'bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gauge className={`w-4 h-4 shrink-0 ${lowSpecMode ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <div>
                      <span className="font-semibold">Режим iGPU Eco / Энергосбережение:</span>{' '}
                      <span className="opacity-75 text-[11px]">
                        {lowSpecMode
                          ? 'Включен (тяжелые CSS-фильтры размытия отключены для плавных 60 FPS на слабом/встроенном видео)'
                          : 'Стандартный (полные графические эффекты стекла и размытия)'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleLowSpecMode}
                    className={`px-3 py-1 rounded text-xs font-semibold shrink-0 transition ${
                      lowSpecMode
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {lowSpecMode ? 'Включен' : 'Включить'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-xs opacity-60 font-mono animate-pulse">
                Считывание аппаратных датчиков и GPU...
              </div>
            )}
          </div>

          {/* 1. Connection Endpoints Card */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
              {t.mcpModal.configTitle}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                  isDark ? 'bg-[#18181b] border-[#2c2c32]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-[10px] opacity-60 uppercase">MCP SSE Transport</div>
                <div className="font-bold my-1 text-xs select-all text-amber-500 dark:text-yellow-400">
                  http://127.0.0.1:3001/sse
                </div>
                <button
                  onClick={() => handleCopy('http://127.0.0.1:3001/sse', 'sse')}
                  className={`mt-1 py-1 px-2 rounded text-[11px] font-sans font-semibold flex items-center justify-center gap-1 transition ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedKey === 'sse' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'sse' ? t.mcpModal.copiedBtn : t.mcpModal.copyBtn}
                </button>
              </div>

              <div
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                  isDark ? 'bg-[#18181b] border-[#2c2c32]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-[10px] opacity-60 uppercase">Live Canvas WebSocket</div>
                <div className="font-bold my-1 text-xs select-all text-amber-500 dark:text-yellow-400">
                  ws://127.0.0.1:3001/ws
                </div>
                <button
                  onClick={() => handleCopy('ws://127.0.0.1:3001/ws', 'ws')}
                  className={`mt-1 py-1 px-2 rounded text-[11px] font-sans font-semibold flex items-center justify-center gap-1 transition ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedKey === 'ws' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'ws' ? t.mcpModal.copiedBtn : t.mcpModal.copyBtn}
                </button>
              </div>

              <div
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                  isDark ? 'bg-[#18181b] border-[#2c2c32]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-[10px] opacity-60 uppercase">REST API Endpoint</div>
                <div className="font-bold my-1 text-xs select-all text-amber-500 dark:text-yellow-400">
                  http://127.0.0.1:3001/api
                </div>
                <button
                  onClick={() => handleCopy('http://127.0.0.1:3001/api', 'api')}
                  className={`mt-1 py-1 px-2 rounded text-[11px] font-sans font-semibold flex items-center justify-center gap-1 transition ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedKey === 'api' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'api' ? t.mcpModal.copiedBtn : t.mcpModal.copyBtn}
                </button>
              </div>
            </div>
          </div>

          {/* 2. Ready-to-use Configurations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2">
              <Code2 className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
              {t.mcpModal.configTitle}
            </h4>

            {/* Antigravity & Web SSE Config */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono">1. {t.mcpModal.antigravityTab}</span>
                <button
                  onClick={() => handleCopy(antigravityConfig, 'antigravity')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                    isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                >
                  {copiedKey === 'antigravity' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'antigravity' ? t.mcpModal.copiedBtn : t.mcpModal.copyBtn}
                </button>
              </div>
              <pre
                className={`p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                  isDark ? 'bg-[#18181b] text-yellow-300' : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                {antigravityConfig}
              </pre>
            </div>

            {/* Cursor SSE Config */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono">2. Cursor & Windsurf (SSE Config)</span>
                <button
                  onClick={() => handleCopy(cursorConfig, 'cursor')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                    isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                >
                  {copiedKey === 'cursor' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'cursor' ? t.mcpModal.copiedBtn : t.mcpModal.copyBtn}
                </button>
              </div>
              <pre
                className={`p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                  isDark ? 'bg-[#18181b] text-yellow-300' : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                {cursorConfig}
              </pre>
            </div>
          </div>

          {/* 3. Instructions */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
              {t.mcpModal.instructionsHeading}
            </h4>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              <li>{t.mcpModal.instruction1}</li>
              <li>{t.mcpModal.instruction2}</li>
              <li>{t.mcpModal.instruction3}</li>
              <li>{t.mcpModal.instruction4}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            {t.mcpModal.modalSubtitle}
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isDark
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {t.mcpModal.modalBadge}
          </button>
        </div>
      </div>
    </div>
  );
};
