import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import { ProjectStore } from './projectStore.js';
import { AuditService } from './auditService.js';
import { DraftImporter } from './draftImporter.js';
import { CompilerService } from './compilerService.js';
import { HardwareDetector } from './hardwareDetector.js';
import { createNarrativeMcpServer } from './mcp/mcpServer.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = '127.0.0.1';

const app = fastify({
  logger: false,
});

await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await app.register(fastifyWebsocket);

const store = ProjectStore.getInstance();

// ------------------------------------------------------------------
// 1. WEBSOCKET: Realtime Live Sync with Frontend Canvas
// ------------------------------------------------------------------
const activeClients = new Set<any>();

app.get('/ws', { websocket: true }, (socket) => {
  activeClients.add(socket);

  // Send initial state upon connection
  socket.send(
    JSON.stringify({
      type: 'INIT',
      manifest: store.getManifest(),
    })
  );

  socket.on('close', () => {
    activeClients.delete(socket);
  });
});

// Broadcast changes whenever store updates (e.g. from MCP agent actions or UI saves)
store.on('project_updated', (updatedManifest) => {
  const payload = JSON.stringify({
    type: 'PROJECT_UPDATED',
    manifest: updatedManifest,
  });

  for (const client of activeClients) {
    try {
      client.send(payload);
    } catch {
      activeClients.delete(client);
    }
  }
});

// ------------------------------------------------------------------
// 2. REST API: Project, Audit, Draft Import, Export
// ------------------------------------------------------------------
app.get('/api/project', async () => {
  return store.getManifest();
});

app.get('/api/system/hardware', async () => {
  return HardwareDetector.getDiagnostics();
});

app.post('/api/project', async (request, reply) => {
  const body = request.body as any;
  if (!body || !body.meta || !body.nodes) {
    return reply.status(400).send({ error: 'Неверный формат манифеста' });
  }
  store.setManifest(body);
  return { success: true };
});

app.get('/api/audit', async () => {
  const manifest = store.getManifest();
  return AuditService.audit(manifest);
});

app.post('/api/import-draft', async (request, reply) => {
  const body = request.body as { raw_text: string; project_title?: string };
  if (!body?.raw_text) {
    return reply.status(400).send({ error: 'Поле raw_text обязательно' });
  }

  const existing = store.getManifest();
  const result = DraftImporter.importDraft(body, existing);
  store.setManifest(result.manifest);

  return result;
});

app.post('/api/export', async (request) => {
  const body = (request.body as { target_engine?: 'generic' | 'unity' | 'godot' }) || {};
  const manifest = store.getManifest();
  return await CompilerService.exportBundle(manifest, body.target_engine || 'generic');
});

// ------------------------------------------------------------------
// 3. MEDIA STREAMER: Safe Local File Proxy (CORS Bypass)
// ------------------------------------------------------------------
app.get('/api/media/stream', async (request, reply) => {
  const query = request.query as { path?: string };
  if (!query?.path) {
    return reply.status(400).send({ error: 'Query parameter "path" is required' });
  }

  let filePath = path.normalize(decodeURIComponent(query.path));

  // If path doesn't exist directly, check fallback locations for relative or project paths
  if (!fs.existsSync(filePath)) {
    const candidates = [
      path.resolve(process.cwd(), filePath),
      path.resolve(process.cwd(), '..', filePath),
      path.resolve(process.cwd(), '..', 'frontend', 'public', filePath),
    ];
    const found = candidates.find((c) => fs.existsSync(c));
    if (found) {
      filePath = found;
    } else {
      return reply.status(404).send({ error: `File not found: ${filePath}` });
    }
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    return reply.status(400).send({ error: 'Path is not a regular file' });
  }

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  reply.header('Content-Type', mimeType);
  reply.header('Accept-Ranges', 'bytes');

  // Support range requests for video/audio streaming
  const range = request.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;

    reply.status(206);
    reply.header('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    reply.header('Content-Length', chunksize);

    return fs.createReadStream(filePath, { start, end });
  }

  reply.header('Content-Length', stat.size);
  return fs.createReadStream(filePath);
});

// ------------------------------------------------------------------
// 4. MODEL CONTEXT PROTOCOL (MCP) SSE TRANSPORT
// ------------------------------------------------------------------
const sseTransports = new Map<string, SSEServerTransport>();

app.get('/sse', async (request, reply) => {
  console.error('[MCP-SSE] New incoming agent connection to /sse');
  reply.raw.setHeader('Access-Control-Allow-Origin', '*');

  const transport = new SSEServerTransport('/messages', reply.raw);
  const server = createNarrativeMcpServer();

  sseTransports.set(transport.sessionId, transport);

  transport.onclose = () => {
    console.error(`[MCP-SSE] Agent session ${transport.sessionId} closed`);
    sseTransports.delete(transport.sessionId);
  };

  await server.connect(transport);
});

app.post('/messages', async (request, reply) => {
  const query = request.query as { sessionId?: string };
  const sessionId = query?.sessionId;

  if (!sessionId || !sseTransports.has(sessionId)) {
    return reply.status(400).send({ error: `Unknown or missing sessionId: ${sessionId}` });
  }

  const transport = sseTransports.get(sessionId)!;
  await transport.handlePostMessage(request.raw, reply.raw, request.body);
});

// ------------------------------------------------------------------
// 5. BOOTSTRAP SERVER
// ------------------------------------------------------------------
async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.error(`\n🚀 [Narrative Engine Backend] Running at: http://${HOST}:${PORT}`);
    console.error(`📡 [MCP SSE Endpoint] Available at: http://${HOST}:${PORT}/sse`);
    console.error(`⚡ [Live WebSocket] Connected at: ws://${HOST}:${PORT}/ws\n`);
  } catch (err) {
    console.error('[Narrative Engine Backend] Failed to start:', err);
    process.exit(1);
  }
}

start();
