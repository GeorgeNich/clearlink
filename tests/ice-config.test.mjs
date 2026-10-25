import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readIceServers } from '../server/ice-config.mjs';

test('unset configuration enables public STUN', () => {
  assert.deepEqual(readIceServers(), [{ urls: 'stun:stun.cloudflare.com:3478' }]);
});
test('explicit empty array and custom STUN/TURN configuration replace defaults', () => {
  assert.deepEqual(readIceServers('[]'), []);
  const custom = [{ urls: ['stun:stun.example.com:3478', 'turns:turn.example.com:443?transport=tcp'], username: 'test', credential: 'temporary' }];
  assert.deepEqual(readIceServers(JSON.stringify(custom)), custom);
});
test('invalid configuration fails at startup instead of producing unjoinable rooms', () => {
  for (const raw of ['broken', '{}', '[null]', '[{}]', '[{"urls":[]}]', '[{"urls":"https://example.com"}]']) {
    assert.throws(() => readIceServers(raw), /ICE_SERVERS_JSON/);
  }
});
