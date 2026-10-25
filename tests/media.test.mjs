import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const js = ts.transpile(readFileSync(new URL('../src/services/browserMedia.ts', import.meta.url), 'utf8'), { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 });
const { BrowserMediaService } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
class Stream { constructor(tracks) { this.tracks = tracks; } getTracks() { return this.tracks; } getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); } getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); } }
globalThis.MediaStream = Stream;
const track = kind => ({ kind, enabled: true, readyState: 'live', stop() { this.readyState = 'ended'; }, getSettings() { return { deviceId: kind }; } });
function browser(getUserMedia) { Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia, enumerateDevices: async () => [] } } }); }
test('late preview results stop all capture after release', async () => {
  const resolve = [], tracks = [track('video'), track('audio')];
  browser(() => new Promise(r => resolve.push(r)));
  const service = new BrowserMediaService(), pending = service.preview();
  service.release(); resolve.forEach((r, i) => r(new Stream([tracks[i]]))); await pending;
  assert.equal(service.stream(), null); assert.ok(tracks.every(t => t.readyState === 'ended'));
});
test('camera works without a microphone', async () => {
  browser(async c => { if (c.audio) throw Error(); return new Stream([track('video')]); });
  const service = new BrowserMediaService(); assert.deepEqual(await service.preview(), { ok: true }); assert.equal(service.hasMic(), false); service.release();
});
test('microphone works without a camera', async () => {
  browser(async c => { if (c.video) throw Error(); return new Stream([track('audio')]); });
  const service = new BrowserMediaService(); assert.deepEqual(await service.preview(), { ok: false, reason: 'blocked' }); assert.equal(service.hasMic(), true); service.release();
});
test('failed switch preserves microphone and later selection recovers', async () => {
  let fail = false;
  browser(async c => { if (fail) throw Error(); return new Stream([track(c.video ? 'video' : 'audio')]); });
  const service = new BrowserMediaService(); await service.preview(); service.setMic(false);
  const original = service.stream().getAudioTracks()[0]; fail = true;
  await assert.rejects(service.selectDevice('microphone', 'busy'));
  assert.equal(original.readyState, 'live'); assert.equal(service.selected().microphone, 'audio');
  fail = false; await service.selectDevice('microphone', 'working');
  assert.equal(service.hasMic(), true); assert.equal(service.stream().getAudioTracks()[0].enabled, false); service.release();
});
test('turning camera off cancels an in-flight camera request', async () => {
  let resolve; browser(() => new Promise(r => { resolve = r; }));
  const service = new BrowserMediaService(), pending = service.setCamera(true), video = track('video');
  await service.setCamera(false); resolve(new Stream([video])); await pending;
  assert.equal(video.readyState, 'ended'); assert.equal(service.hasCamera(), false);
});
test('leaving during a device switch stops the late replacement', async () => {
  browser(async c => new Stream([track(c.video ? 'video' : 'audio')]));
  const service = new BrowserMediaService(); await service.preview();
  let resolve; navigator.mediaDevices.getUserMedia = () => new Promise(r => { resolve = r; });
  const pending = service.selectDevice('microphone', 'new'); service.release();
  const replacement = track('audio'); resolve(new Stream([replacement]));
  await assert.rejects(pending); assert.equal(replacement.readyState, 'ended'); assert.equal(service.stream(), null);
});
test('leaving while the screen picker is open stops the late screen stream', async () => {
  browser(async () => new Stream([]));
  let resolve; navigator.mediaDevices.getDisplayMedia = () => new Promise(r => { resolve = r; });
  const service = new BrowserMediaService(), pending = service.startScreenShare();
  service.release(); const video = track('video'); resolve(new Stream([video])); await pending;
  assert.equal(video.readyState, 'ended'); assert.equal(service.screenStream(), null); assert.equal(service.sharing, false);
});
test('browser Stop sharing releases the screen and reports the change', async () => {
  browser(async () => new Stream([])); const video = track('video');
  navigator.mediaDevices.getDisplayMedia = async () => new Stream([video]);
  const service = new BrowserMediaService(); let ended = false;
  service.onShareEnded = () => { ended = true; }; await service.startScreenShare(); video.onended();
  assert.equal(ended, true); assert.equal(service.screenStream(), null); assert.equal(service.sharing, false);
});
