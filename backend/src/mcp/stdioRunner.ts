import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createNarrativeMcpServer } from './mcpServer.js';

async function main() {
  // CRITICAL MCP RULE: All diagnostic logs MUST go to stderr (console.error).
  // Writing to stdout corrupts JSON-RPC protocol messages and breaks the client.
  console.error('[NarrativeEngine-MCP] Initializing stdio transport...');

  const server = createNarrativeMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('[NarrativeEngine-MCP] Server successfully connected to stdio.');
}

main().catch((err) => {
  console.error('[NarrativeEngine-MCP] Fatal error in stdio runner:', err);
  process.exit(1);
});
