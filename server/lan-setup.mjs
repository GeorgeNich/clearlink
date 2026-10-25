import { networkInterfaces } from 'node:os';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isIP } from 'node:net';
process.umask(0o077);
const interfaces = networkInterfaces();
const candidates = [...(interfaces.en0 || []), ...Object.values(interfaces).flat()].filter(p => p && p.family === 'IPv4' && !p.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(p.address));
const ip = process.argv[2] || candidates[0]?.address;
if (!ip || isIP(ip) !== 4) throw Error('Pass the computer’s LAN IPv4 address: npm run lan:setup -- 192.168.1.20');
const dir = fileURLToPath(new URL('../.local-tls/', import.meta.url));
mkdirSync(dir, { recursive: true, mode: 0o700 });
function openssl(...args) {
  const r = spawnSync('openssl', args, { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw Error(r.stderr || r.error?.message || 'OpenSSL failed');
}
// Reuse the test CA so restarting or changing IP does not require another phone installation.
if (!existsSync(join(dir, 'ca.pem'))) {
  openssl('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '30', '-keyout', 'ca-key.pem', '-out', 'ca.pem', '-subj', '/CN=Clearlink Local Test CA', '-addext', 'basicConstraints=critical,CA:TRUE,pathlen:0', '-addext', 'keyUsage=critical,keyCertSign,cRLSign');
}
openssl('x509', '-in', 'ca.pem', '-checkend', '86400', '-noout');
writeFileSync(join(dir, 'server.ext'), `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=IP:${ip},IP:127.0.0.1,DNS:localhost\n`);
openssl('req', '-new', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-keyout', 'server-key.pem', '-out', 'server.csr', '-subj', '/CN=Clearlink local test');
openssl('x509', '-req', '-in', 'server.csr', '-CA', 'ca.pem', '-CAkey', 'ca-key.pem', '-CAcreateserial', '-out', 'server.pem', '-days', '7', '-sha256', '-extfile', 'server.ext');
openssl('x509', '-in', 'ca.pem', '-outform', 'DER', '-out', 'clearlink-ca.cer');
writeFileSync(join(dir, 'config.json'), JSON.stringify({ ip }, null, 2));
console.log(`Ready. Run npm run build, then npm run lan.\nPhone setup: http://${ip}:3080/setup\nPhone call: https://${ip}:3443\nComputer call: http://localhost:3080\nCertificate is for local testing; remove it from your phone after testing.`);
