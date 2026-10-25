/**
 * One-command sharing: Cloudflare STUN for direct media routes, and a temporary
 * Cloudflare Tunnel as the public HTTPS gateway to the local Node room server.
 * Usage: npm run share   (builds first; requires `cloudflared` on PATH)
 */
import { spawn } from 'node:child_process';
import { createServer as probe } from 'node:net';
import { createClearlinkServer } from './server.mjs';

const CLOUDFLARE_STUN = [{ urls: 'stun:stun.cloudflare.com:3478' }];
const host = '127.0.0.1';
process.env.ICE_SERVERS_JSON ??= JSON.stringify(CLOUDFLARE_STUN);

const free = (port) =>
  new Promise((ok) => {
    const s = probe()
      .once('error', () => ok(false))
      .once('listening', () => s.close(() => ok(true)));
    s.listen(port, host);
  });
async function pickPort(start) {
  for (let port = start; port < start + 20; port++) if (await free(port)) return port;
  throw Error(`No free port between ${start} and ${start + 19}.`);
}

const port = await pickPort(Number(process.env.PORT || 3001));
const tunnel = spawn(
  process.env.CLOUDFLARED || 'cloudflared',
  ['tunnel', '--no-autoupdate', '--url', `http://${host}:${port}`],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

tunnel.on('error', (error) => {
  if (error.code === 'ENOENT')
    console.error('cloudflared is not installed. On macOS: brew install cloudflared');
  else console.error(`cloudflared failed: ${error.message}`);
  process.exit(1);
});

const publicOrigin = await new Promise((ok, fail) => {
  let log = '';
  const timer = setTimeout(
    () => fail(Error(`No tunnel address from cloudflared after 30s.\n${log}`)),
    30000,
  );
  const read = (chunk) => {
    log += chunk;
    const match = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      clearTimeout(timer);
      ok(match[0]);
    }
  };
  tunnel.stdout.on('data', read);
  tunnel.stderr.on('data', read);
  tunnel.once('exit', (code) => {
    clearTimeout(timer);
    fail(Error(`cloudflared exited (${code}).\n${log}`));
  });
}).catch((error) => {
  console.error(error.message);
  tunnel.kill();
  process.exit(1);
});

const app = createClearlinkServer({ publicOrigin });
app.on('error', (error) => {
  console.error(error.message);
  tunnel.kill();
  process.exit(1);
});
app.listen(port, host, () => {
  console.log(
    `\nClearlink is shared.\n  Public (send this): ${publicOrigin}\n  Local:              http://localhost:${port}\n  STUN:               ${JSON.parse(
      process.env.ICE_SERVERS_JSON,
    )
      .map((s) => s.urls)
      .join(', ')}\n\nKeep this terminal open. Press Ctrl+C to stop sharing.`,
  );
});

tunnel.once('exit', (code) => {
  console.error(`\nTunnel closed (${code}). Stopping.`);
  app.close();
  process.exit(1);
});
const stop = () => {
  tunnel.kill();
  app.closeAllConnections?.();
  app.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
