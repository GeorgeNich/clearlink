import { createServer } from 'node:http';
import { readIceServers } from './ice-config.mjs';
import { randomBytes, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const colors = ['amber', 'rose', 'sage', 'dusk', 'plum'];
const clean = (value) =>
  String(value ?? '')
    .toUpperCase()
    .replaceAll('-', '');
const validCode = (value) => /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(value);
const publicPerson = (p) => ({
  id: p.id,
  displayName: p.displayName,
  avatarColor: p.avatarColor,
  micEnabled: p.micEnabled,
  cameraEnabled: p.cameraEnabled,
});

/** Ephemeral signalling and chat; no recordings, database, or message history. */
export function createClearlinkServer({
  iceServers = readIceServers(),
  sessionTTL = 70000,
  maxRooms = 200,
  publicOrigin,
} = {}) {
  const rooms = new Map(),
    sessions = new Map(),
    limits = new Map();
  const json = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  const deliver = (p, event) => {
    if (p.waiter) {
      const finish = p.waiter;
      p.waiter = null;
      finish([event]);
    } else if (p.queue.length < 256) p.queue.push(event);
    else remove(p);
  };
  const broadcast = (room, event, except) => {
    for (const p of room.values()) if (p.id !== except) deliver(p, event);
  };
  const remove = (p) => {
    if (!sessions.delete(p.token)) return;
    const room = rooms.get(p.code);
    room?.delete(p.id);
    if (p.waiter) {
      p.waiter([]);
      p.waiter = null;
    }
    if (room?.size) broadcast(room, { type: 'left', id: p.id });
    else rooms.delete(p.code);
  };
  const timer = setInterval(
    () => {
      for (const p of sessions.values()) if (Date.now() - p.lastSeen > sessionTTL) remove(p);
      for (const [ip, limit] of limits) if (Date.now() > limit.until) limits.delete(ip);
    },
    Math.min(10000, sessionTTL),
  );
  timer.unref();
  const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD')
          return json(res, 405, { error: 'Method not allowed' });
        const path = resolve(
          root,
          '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname),
        );
        if (!path.startsWith(root + '/')) return json(res, 404, {});
        let data;
        try {
          data = await readFile(path);
        } catch {
          return json(res, 404, {});
        }
        res.writeHead(200, {
          'Content-Type':
            {
              '.html': 'text/html',
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.svg': 'image/svg+xml',
              '.jpg': 'image/jpeg',
            }[extname(path)] || 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
        });
        return res.end(req.method === 'HEAD' ? undefined : data);
      }
      // No CORS. Browsers must use the app's own origin, including through a reverse proxy.
      if (req.headers['sec-fetch-site'] === 'cross-site')
        return json(res, 403, { error: 'Use the app origin' });
      let body = {};
      if (req.method === 'POST') {
        if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, {});
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 65536) return json(res, 413, {});
        }
        try {
          body = JSON.parse(raw);
        } catch {
          return json(res, 400, {});
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, {});
      }
      if (url.pathname === '/api/session' || url.pathname === '/api/room') {
        const ip = req.socket.remoteAddress;
        let limit = limits.get(ip);
        if (!limit || Date.now() > limit.until) {
          limit = { count: 0, until: Date.now() + 60000 };
          limits.set(ip, limit);
        }
        if (++limit.count > 60) return json(res, 429, { error: 'Try again shortly' });
      }
      if (url.pathname === '/api/room' && req.method === 'GET') {
        const code = clean(url.searchParams.get('code')),
          room = rooms.get(code);
        return json(res, 200, {
          status: !validCode(code) || !room ? 'missing' : room.size >= 5 ? 'full' : 'ok',
        });
      }
      if (url.pathname === '/api/session' && req.method === 'POST') {
        const name = typeof body.name === 'string' ? body.name.trim().slice(0, 24) : '';
        if (!name || !['create', 'join'].includes(body.intent)) return json(res, 400, {});
        let code = clean(body.code);
        if (body.intent === 'create') {
          if (rooms.size >= maxRooms) return json(res, 503, { status: 'failed' });
          do {
            code = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
          } while (rooms.has(code));
          rooms.set(code, new Map());
        }
        const room = rooms.get(code);
        if (!validCode(code) || !room) return json(res, 200, { status: 'missing' });
        if (room.size >= 5) return json(res, 200, { status: 'full' });
        const p = {
          id: randomBytes(12).toString('hex'),
          token: randomBytes(32).toString('hex'),
          code,
          displayName: name,
          avatarColor:
            colors.find((c) => ![...room.values()].some((p) => p.avatarColor === c)) || 'amber',
          micEnabled: body.mic === true,
          cameraEnabled: body.camera === true,
          queue: [],
          waiter: null,
          lastSeen: Date.now(),
        };
        const peers = [...room.values()].map(publicPerson);
        room.set(p.id, p);
        sessions.set(p.token, p);
        broadcast(room, { type: 'joined', person: publicPerson(p) }, p.id);
        return json(res, 200, {
          status: 'ok',
          id: p.id,
          token: p.token,
          code,
          peers,
          iceServers,
          ...(publicOrigin ? { inviteOrigin: publicOrigin } : {}),
        });
      }
      const token = req.headers.authorization?.replace(/^Bearer /, ''),
        p = sessions.get(token);
      if (!p) return json(res, 401, { error: 'Session ended' });
      p.lastSeen = Date.now();
      const room = rooms.get(p.code);
      if (url.pathname === '/api/events' && req.method === 'GET') {
        if (p.waiter) return json(res, 409, {});
        if (p.queue.length) return json(res, 200, p.queue.splice(0));
        const finish = (events) => {
          clearTimeout(timeout);
          p.waiter = null;
          if (!res.destroyed) json(res, 200, events);
        };
        const timeout = setTimeout(() => finish([]), 25000);
        p.waiter = finish;
        res.on('close', () => {
          clearTimeout(timeout);
          if (p.waiter === finish) p.waiter = null;
        });
        return;
      }
      if (req.method !== 'POST') return json(res, 405, {});
      if (url.pathname === '/api/leave') {
        remove(p);
        return json(res, 200, {});
      }
      if (url.pathname === '/api/signal') {
        const target = room.get(body.to);
        if (!target || target === p) return json(res, 404, {});
        if (!body.signal || typeof body.signal !== 'object') return json(res, 400, {});
        deliver(target, { type: 'signal', from: p.id, signal: body.signal });
      } else if (url.pathname === '/api/state') {
        p.micEnabled = body.mic === true;
        p.cameraEnabled = body.camera === true;
        broadcast(room, { type: 'state', person: publicPerson(p) }, p.id);
      } else if (url.pathname === '/api/chat') {
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000)
          return json(res, 400, {});
        broadcast(room, { type: 'chat', person: publicPerson(p), text: body.text.trim() }, p.id);
      } else return json(res, 404, {});
      json(res, 200, {});
    } catch {
      if (!res.headersSent) json(res, 500, { error: 'Request failed' });
      else res.end();
    }
  });
  server.on('close', () => clearInterval(timer));
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001),
    host = process.env.HOST || '127.0.0.1';
  createClearlinkServer().listen(port, host, () =>
    console.log(
      host === '127.0.0.1'
        ? `\nClearlink is running on this computer only.\n  Open: http://localhost:${port}\n\nTo let people on other devices join, press Ctrl+C and run: npm run share`
        : `Clearlink server: http://${host}:${port}`,
    ),
  );
}
