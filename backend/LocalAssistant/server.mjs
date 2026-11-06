import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ReviewSession, BoundaryError, FOUNDATION, POLICY_HASH, exactObject, text } from './policy.mjs';
import { createOllama } from './ollama.mjs';

const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/assistant.html', ['index.html', 'text/html; charset=utf-8']],
  ['/assistant.mjs', ['assistant.mjs', 'text/javascript; charset=utf-8']],
  ['/assistant.css', ['assistant.css', 'text/css; charset=utf-8']],
]);
const sameSecret = (a, b) => typeof a === 'string' && /^[a-f0-9]{64}$/.test(a) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const secret = () => randomBytes(32).toString('hex');
async function readBody(request) {
  if (request.headers['content-type'] !== 'application/json') throw new BoundaryError(415, 'application/json is required.');
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new BoundaryError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new BoundaryError(400, 'Invalid JSON request.'); }
}

/** Fixed loopback listener. Injectable provider is for tests, never an HTTP parameter. */
export function createServer({model = process.env.GENESIS_MODEL, provider, clock = Date.now} = {}) {
  const inference = provider ?? (model ? createOllama(model) : null);
  const sessions = new Map(); let inferenceBusy = false;
  const server = http.createServer(async (request, response) => {
    const send = (status, data, type = 'application/json; charset=utf-8') => {
      response.writeHead(status, {'Content-Type': type});
      response.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
    };
    // Static CSP also prevents the hosted review page from contacting localhost.
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    try {
      const address = server.address();
      const host = `127.0.0.1:${address.port}`;
      if (request.headers.host !== host) throw new BoundaryError(403, 'Open this application using its exact 127.0.0.1 address.');
      const origin = `http://${host}`;
      const topLevelNavigation = request.method === 'GET' && ['/', '/assistant.html'].includes(request.url) &&
        request.headers['sec-fetch-mode'] === 'navigate' && request.headers['sec-fetch-dest'] === 'document';
      if (!topLevelNavigation && ((request.headers.origin && request.headers.origin !== origin) || request.headers['sec-fetch-site'] === 'cross-site'))
        throw new BoundaryError(403, 'Cross-origin access is denied.');
      if (request.method === 'GET' && ASSETS.has(request.url)) {
        const [file, type] = ASSETS.get(request.url);
        return send(200, await readFile(new URL(`./public/${file}`, import.meta.url)), type);
      }
      if (!['/api/local/state', '/api/local/chat', '/api/local/proposals', '/api/local/decision', '/api/local/execute'].includes(request.url))
        throw new BoundaryError(404, 'No such operation. Policy editing and arbitrary execution are unavailable.');
      if ((request.url === '/api/local/state' && request.method !== 'GET') ||
          (request.url !== '/api/local/state' && request.method !== 'POST'))
        throw new BoundaryError(405, 'Method is not allowed.');
      for (const [id, session] of sessions) if (clock() >= session.expiresAt) sessions.delete(id);
      const id = /(?:^|;\s*)genesis_local=([a-f0-9]{64})(?:;|$)/.exec(request.headers.cookie ?? '')?.[1];
      let session = sessions.get(id);
      if (request.method === 'GET' && !session) {
        if (sessions.size >= 32) throw new BoundaryError(429, 'Local session limit reached.');
        const token = secret(); session = new ReviewSession(clock); session.csrf = secret();
        sessions.set(token, session);
        response.setHeader('Set-Cookie', `genesis_local=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900`);
      }
      if (!session) throw new BoundaryError(401, 'Session expired. Reload before making another request.');
      session.alive();
      if (request.method === 'GET') return send(200, {mode: 'local-prototype', foundation: FOUNDATION,
        policyHash: POLICY_HASH, csrf: session.csrf, model: model ?? null,
        aiConfigured: Boolean(inference), state: session.snapshot(), messages: session.turns});
      if (request.headers.origin !== origin || !sameSecret(request.headers['x-genesis-csrf'], session.csrf))
        throw new BoundaryError(403, 'An exact-origin human interface session is required.');
      const body = await readBody(request);
      // The session may have expired while a slow request was arriving.
      session.alive();
      if (request.url === '/api/local/chat') {
        exactObject(body, ['message']); text(body.message, FOUNDATION.maxMessageChars);
        if (!inference) throw new BoundaryError(503, 'No local model configured. Set GENESIS_MODEL to an installed Ollama model and restart.');
        if (session.turns.length >= FOUNDATION.maxTurns) throw new BoundaryError(429, 'Conversation limit reached. Reload to start a new session.');
        if (inferenceBusy || session.chatBusy) throw new BoundaryError(429, 'Local inference is busy. Wait for its current result.');
        inferenceBusy = true; session.chatBusy = true;
        try {
          const turns = [...session.turns, {role: 'user', content: body.message}];
          const reply = text(await inference.reply(turns), FOUNDATION.maxDraftChars);
          session.alive();
          session.turns = [...turns, {role: 'assistant', content: reply}];
          session.record('reply_generated', 'model', 'Untrusted text returned. No proposal, approval, or execution was triggered.');
          return send(200, {reply, state: session.snapshot()});
        } finally { inferenceBusy = false; session.chatBusy = false; }
      }
      let state;
      if (request.url === '/api/local/proposals') {
        exactObject(body, ['text']); state = session.propose(body.text);
      } else if (request.url === '/api/local/decision') {
        exactObject(body, ['id', 'fingerprint', 'decision']);
        state = session.decide(body.id, body.fingerprint, body.decision);
      } else {
        exactObject(body, ['id', 'fingerprint', 'grantId', 'attemptId']);
        state = session.execute(body.id, body.fingerprint, body.grantId, body.attemptId);
      }
      return send(200, {state});
    } catch (error) {
      if (!response.headersSent) send(error instanceof BoundaryError ? error.status : 500,
        {error: error instanceof BoundaryError ? error.message : 'Local service error. No successful outcome is confirmed.'});
      else response.end();
    }
  });
  server.requestTimeout = 20_000; server.headersTimeout = 10_000; server.timeout = 135_000;
  server.maxHeadersCount = 64; server.maxConnections = 64;
  // Do not expose listen-host configuration: tests and CLI both use loopback.
  return {server, listen: (port = 4318) => new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(port, '127.0.0.1', () => {server.removeListener('error', reject); resolve(server.address());});
  })};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.GENESIS_PORT ?? 4318);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) { console.error('GENESIS_PORT must be 1024–65535.'); process.exitCode = 1; }
  else {
    try {
      const app = createServer(); await app.listen(port);
      console.log(`Genesis local assistant: http://127.0.0.1:${port}`);
      console.log('Experimental local prototype. Test documents and evidence exist only in memory.');
      console.log(process.env.GENESIS_MODEL ? 'Local model configured; availability checked on first message.' : 'No model configured. Chat fails closed; human review demonstration remains available.');
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
        app.server.close(); app.server.closeAllConnections();
      });
    } catch { console.error('Unable to start Genesis. Check the selected port and GENESIS_MODEL.'); process.exitCode = 1; }
  }
}
