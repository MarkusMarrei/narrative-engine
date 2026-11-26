# Contributing to Narrative Engine 🤝

Thank you for your interest in contributing to **Narrative Engine**! We welcome contributions, bug fixes, feature proposals, and translations from the community.

---

## 🛠 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### Steps
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/narrative-engine.git
   cd narrative-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build shared types:
   ```bash
   npm run build:shared
   ```

4. Launch development servers:
   ```bash
   # Both frontend & backend simultaneously:
   npm run dev

   # Or in separate terminal sessions:
   npm run dev:backend
   npm run dev:frontend
   ```

5. Open `http://localhost:5173` in your browser.

---

## 📐 Project Structure

- `frontend/`: React 19 visual canvas IDE, Tailwind CSS, Zustand store, and i18n locales.
- `backend/`: Fastify web server, media streaming pipeline, and native MCP server (stdio & SSE transports).
- `shared/`: TypeScript interfaces and Zod validation schemas shared across the stack.
- `test_assets/`: Sample audio and visual assets for local testing.

---

## 📜 Pull Request Guidelines

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Verify that all workspaces build without errors before opening a PR:
   ```bash
   npm run build
   ```
3. Commit your changes using conventional commit messages (`feat: ...`, `fix: ...`, `docs: ...`).
4. Push to your fork and submit a Pull Request targeting `main`.
