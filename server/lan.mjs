import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { isIP } from 'node:net';
import { createClearlinkServer } from './server.mjs';
const dir = fileURLToPath(new URL('../.local-tls/', import.meta.url));
const { ip } = JSON.parse(readFileSync(join(dir, 'config.json'), 'utf8'));
if (isIP(ip) !== 4) throw Error('Invalid local IP. Run npm run lan:setup again.');
const origin = `https://${ip}:3443`;
const app = createClearlinkServer({ publicOrigin: origin });
const tls = httpsServer({ key: readFileSync(join(dir, 'server-key.pem')), cert: readFileSync(join(dir, 'server.pem')) }, (req, res) => app.emit('request', req, res));
const certificate = readFileSync(join(dir, 'clearlink-ca.cer'));
const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clearlink phone setup</title><style>body{font:18px/1.6 system-ui;background:#0D131C;color:#E9EEF4;max-width:620px;margin:auto;padding:24px}a{color:#5BC4CC}li{margin:16px 0}h1{line-height:1.2}a.button{display:block;padding:14px;border:1px solid;border-radius:10px;text-align:center}</style><h1>Connect your phone</h1><p>Keep your phone on the same home Wi-Fi as this computer.</p><ol><li><a href="/clearlink-ca.cer">Download the Clearlink test certificate</a>.</li><li>Open Android <strong>Settings</strong>. Search for <strong>Install a certificate</strong> or <strong>Encryption &amp; credentials</strong>. Choose <strong>CA certificate</strong> and select the downloaded file. Confirm using your phone’s PIN.</li><li>Return to Chrome and open the call link below. Allow camera and microphone access when asked.</li></ol><p>This adds <strong>Clearlink Local Test CA</strong> to your phone’s trusted certificates. Its private key stays on this computer. It is for this local test; remove it from your user certificates when you finish.</p><a class="button" href="${origin}">Open Clearlink</a><p>On the computer, open <strong>http://localhost:3080</strong>, start a call, then enter its room code on your phone.</p><p><a href="https://support.google.com/pixelphone/answer/2844832?hl=en">Android certificate instructions</a> (menu names vary by phone).</p></html>`;
const http = httpServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/clearlink-ca.cer') {
    res.writeHead(200, { 'Content-Type': 'application/x-x509-ca-cert', 'Content-Disposition': 'attachment; filename="clearlink-ca.cer"', 'Cache-Control': 'no-store' }); return res.end(certificate);
  }
  if (path === '/setup') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(page); }
  // The desktop can use the browser's localhost secure-context exception. Both listeners share the same rooms.
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (loopback && /^(localhost|127\.0\.0\.1):3080$/.test(req.headers.host || '')) return app.emit('request', req, res);
  res.writeHead(302, { Location: path === '/' ? '/setup' : origin + req.url }); res.end();
});
for (const s of [http, tls]) s.on('error', error => { console.error(error.message); process.exit(1); });
tls.listen(3443, '0.0.0.0', () => console.log(`Phone call: ${origin}`));
http.listen(3080, '0.0.0.0', () => console.log(`Phone setup: http://${ip}:3080/setup\nComputer: http://localhost:3080`));
const stop = () => { http.closeAllConnections(); tls.closeAllConnections(); http.close(); tls.close(); app.emit('close'); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
