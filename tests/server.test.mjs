import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClearlinkServer } from '../server/server.mjs';

test('rooms enforce membership, capacity, signalling isolation, chat and lifecycle', async t => {
  const server = createClearlinkServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api/`;
  async function request(path, body, token) {
    const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  }
  const enter = (intent, code, name = 'Sam') => request('session', { intent, code, name, mic: true, camera: true }).then(r => r.body);
  const host = await enter('create'); assert.equal(host.status, 'ok'); assert.deepEqual(host.iceServers, [{ urls: 'stun:stun.cloudflare.com:3478' }]); assert.match(host.code, /^[A-HJ-NP-Z2-9]{8}$/);
  const guest = await enter('join', host.code, 'Guest'); assert.equal(guest.peers.length, 1); assert.deepEqual(guest.iceServers, host.iceServers);
  assert.equal((await request('events', undefined, host.token)).body[0].type, 'joined');
  await request('signal', { to: guest.id, signal: { description: { type: 'offer', sdp: 'test' } } }, host.token);
  assert.equal((await request('events', undefined, guest.token)).body[0].from, host.id);
  const outsider = await enter('create');
  assert.equal((await request('signal', { to: outsider.id, signal: {} }, host.token)).status, 404);
  assert.equal((await request('chat', { text: 'hello' }, 'invalid')).status, 401);
  await request('chat', { text: 'hello', person: { displayName: 'Impostor' } }, host.token);
  const message = (await request('events', undefined, guest.token)).body[0];
  assert.equal(message.text, 'hello'); assert.equal(message.person.displayName, 'Sam');
  const more = await Promise.all([enter('join', host.code), enter('join', host.code), enter('join', host.code), enter('join', host.code)]);
  assert.equal(more.filter(p => p.status === 'ok').length, 3); assert.equal(more.filter(p => p.status === 'full').length, 1);
  assert.equal((await request('room?code=' + host.code)).body.status, 'full');
  for (const p of [host, guest, ...more.filter(p => p.token)]) await request('leave', {}, p.token);
  assert.equal((await request('room?code=' + host.code)).body.status, 'missing');
  assert.equal((await enter('join', host.code)).status, 'missing');
  await request('leave', {}, outsider.token);
});
