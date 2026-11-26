# Narrative Engine — Model Context Protocol (MCP) Integration Guide 🧠

**Narrative Engine** implements a native, bidirectional Model Context Protocol (MCP) server. It enables leading AI agents (**Google Antigravity**, **Claude Code / Claude Desktop**, **Codex**, **Cursor**, **Roo Code**, **Windsurf**, and **OpenCode**) to reason about, structure, audit, and compile interactive story graphs directly.

---

## 1. Architecture: Dual Transport

Narrative Engine supports both standard MCP transport mechanisms:

1. **`stdio` Transport (Standalone CLI / Agent-Spawned):**
   - Host agent spawns the Node.js runner process directly.
   - Ideal for command-line agents and offline analysis pipelines.
   - Entrypoint: `backend/dist/mcp/stdioRunner.js`.
   - *Rule:* Diagnostic logs are written strictly to `stderr` (`console.error`), preserving pure JSON-RPC over `stdout`.

2. **`SSE` Transport (Live Web Sync):**
   - When the local visual studio is running on `http://127.0.0.1:3001`, an SSE connection is available at `http://127.0.0.1:3001/sse`.
   - Any modification made by the external agent is instantly reflected on the user's React Flow canvas in real time via WebSockets.

---

## 2. Configuration Recipes

### A. Google Antigravity & Claude Desktop Configuration
Add the server definition to your `mcp.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "narrative-engine": {
      "command": "node",
      "args": [
        "<PATH_TO_NARRATIVE_ENGINE>/backend/dist/mcp/stdioRunner.js"
      ]
    }
  }
}
```

### B. Cursor / Roo Code / Windsurf (SSE Mode)
When running `start_windows.bat`, connect directly to the active live server:

```json
{
  "mcpServers": {
    "narrative-engine-live": {
      "url": "http://127.0.0.1:3001/sse",
      "transport": "sse"
    }
  }
}
```

---

## 3. Registered Tools (API Reference)

| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| **`narrative_get_project`** | None | Returns the complete master manifest: story metadata, acts, variable registry, all scene nodes, sequence stacks, and choices. |
| **`narrative_audit_project`** | None | Performs rigorous graph analysis: detects dead ends, orphan nodes, cycle loops without state mutations, undeclared variables, type mismatches, and missing asset files. Returns a 0–100% Maturity Score. |
| **`narrative_import_draft`** | `raw_text` *(string)*, `project_title` *(optional)* | Accepts a raw story draft or script (up to 50,000+ characters), splits it into scenes across the 3-act structure (Exposition, Conflict, Resolution), parses dialogue/speakers, links scenes, and visualizes them on the canvas. |
| **`narrative_create_scene`** | `node_id`, `title`, `act_id`, `dialogue_text`, `speaker`, `background_asset_id`, `music_asset_id`, `is_terminal` | Creates a new action-based scene node in a specific act with initial dialogue, background, or music. |
| **`narrative_update_scene`** | `node_id`, `title`, `append_dialogue`, `is_terminal` | Updates an existing scene, appends dialogue lines, or marks the node as terminal. |
| **`narrative_link_scenes`** | `from_node_id`, `to_node_id`, `label`, `condition`, `effects` | Links two scenes with a choice button, optional state condition, and state mutation effects. |
| **`narrative_export_bundle`** | `target_engine`: `"generic"` \| `"unity"` \| `"godot"` | Sanitizes file paths, resolves assets, compiles `manifest.json` and `AGENT_INSTRUCTIONS.md`, and outputs a ready-to-use `Agent_Export_Build.zip`. |

---

## 4. Example Prompts to give your AI Agent

- **Audit & Logic Check:**
  > *"Use the `narrative_audit_project` tool to analyze my story graph. Tell me if there are any forgotten dead ends or undeclared state variables."*

- **Raw Text Ingestion (Chunking):**
  > *"I have a 30,000 character draft for Chapter 2. Use `narrative_import_draft` to break it down into scenes, extract speakers, and arrange it on the canvas."*

- **Autonomous Game Generation:**
  > *"Execute `narrative_export_bundle` with target 'godot'. Read the exported `manifest.json` and generate GDScript scenes and a DialogueManager controller."*
