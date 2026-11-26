#!/usr/bin/env bash
# =====================================================================
#              NARRATIVE ENGINE v3 - UNIVERSAL LAUNCHER
#       Cross-Platform Runner for Linux (Ubuntu/Debian/Arch) & macOS
# =====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "====================================================================="
echo "             NARRATIVE ENGINE v3 - UNIVERSAL LAUNCHER"
echo "           Narrative-to-Code Orchestrator & Visual IDE"
echo "====================================================================="
echo ""

# 1. Check Node.js and npm
echo "[1/3] Checking Node.js and npm environment..."
if ! command -v node >/dev/null 2>&1; then
    echo "❌ ERROR: Node.js is not installed on this system!"
    echo "Please install Node.js 18+ from https://nodejs.org/ or via your package manager."
    echo "On Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs npm"
    echo "On macOS: brew install node"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ ERROR: npm package manager is not installed!"
    exit 1
fi

echo "  Found Node.js: $(node --version)"
echo "  Found npm:     $(npm --version)"

# 2. Setup Dependencies
echo ""
echo "[2/3] Preparing project dependencies..."
cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
    echo "  Installing root workspace packages (first run only)..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "  Installing frontend packages..."
    npm --workspace=frontend install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "  Installing backend packages..."
    npm --workspace=backend install
fi

# Build shared types package if needed
if [ ! -d "shared/dist" ]; then
    echo "  Building shared package..."
    npm run build:shared || true
fi

# 3. Process Cleanup on Exit
cleanup() {
    echo ""
    echo "Shutting down Narrative Engine services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Launch Servers
echo ""
echo "====================================================================="
echo "  Starting Narrative Engine Services:"
echo "  - Backend API & MCP: http://127.0.0.1:3001"
echo "  - Frontend Web IDE:  http://127.0.0.1:5173"
echo "====================================================================="
echo ""

# Start Backend in background
npm run dev:backend &
BACKEND_PID=$!

# Wait briefly for backend port to bind
sleep 1.5

# Start Frontend in background
npm run dev:frontend &
FRONTEND_PID=$!

# Wait briefly for Vite to initialize
sleep 1.5

echo "Narrative Engine is running. Press [Ctrl+C] to stop."
wait
