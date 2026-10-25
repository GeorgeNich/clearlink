import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createClearlinkServer } from '../server/server.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const server = createClearlinkServer();
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
const output = process.env.TEST_OUTPUT_DIR || '/tmp/clearlink-browser-test';
await mkdir(output, { recursive: true });
try {
  browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  const contexts = await Promise.all([
    browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['camera', 'microphone'],
    }),
    browser.newContext({
      viewport: { width: 360, height: 800 },
      permissions: ['camera', 'microphone'],
    }),
  ]);
  for (const context of contexts)
    await context.addInitScript(() => {
      window.testPeers = [];
      window.testTracks = [];
      const Native = window.RTCPeerConnection;
      window.RTCPeerConnection = class extends Native {
        constructor(config) {
          super(config);
          window.testPeers.push(this);
        }
      };
      const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await get(constraints);
        window.testTracks.push(...stream.getTracks());
        return stream;
      };
    });
  const [host, guest] = await Promise.all(contexts.map((c) => c.newPage()));
  for (const page of [host, guest]) {
    page.setDefaultTimeout(12000);
    page.on('pageerror', (error) => errors.push(error.message));
  }
  await host.goto(base);
  await host.screenshot({ path: output + '/welcome-laptop.png' });
  await host.getByRole('button', { name: 'Switch to light theme' }).click();
  await host.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await host.screenshot({ path: output + '/welcome-light-laptop.png' });
  await host.getByRole('button', { name: 'Switch to dark theme' }).click();
  await host.getByRole('button', { name: 'Join room', exact: true }).click();
  await host.getByLabel('Room code').fill('ABC');
  await host.getByRole('button', { name: 'Continue', exact: true }).click();
  await host.getByRole('alert').waitFor();
  await host.getByRole('button', { name: '← Back', exact: true }).click();
  await host.getByRole('button', { name: 'Create room', exact: true }).click();
  await host.getByLabel('Your name').fill('George');
  await host.getByRole('button', { name: 'Create room', exact: true }).click();
  await host.getByRole('heading', { name: 'Waiting for others' }).waitFor();
  const code = await host
    .locator('span[aria-label]')
    .evaluateAll((nodes) =>
      nodes
        .map((n) => n.getAttribute('aria-label').replaceAll(' ', ''))
        .find((s) => /^[A-HJ-NP-Z2-9]{8}$/.test(s)),
    );
  assert.ok(code);
  await guest.goto(base + '/#r/' + code);
  await guest.getByLabel('Your name').fill('Sam');
  await guest.screenshot({ path: output + '/camera-phone.png' });
  await guest.getByRole('button', { name: 'Join room', exact: true }).click();
  for (const page of [host, guest]) {
    await page.waitForFunction(
      () => window.testPeers.some((p) => p.connectionState === 'connected'),
      { timeout: 20000 },
    );
    await page.waitForFunction(
      async () => {
        const pc = window.testPeers.find((p) => p.connectionState === 'connected');
        if (!pc) return false;
        const stats = [...(await pc.getStats()).values()].filter((s) => s.type === 'inbound-rtp');
        return ['audio', 'video'].every((kind) =>
          stats.some((s) => s.kind === kind && s.bytesReceived > 0),
        );
      },
      { timeout: 20000 },
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  console.log('PASS two independent browser sessions receive WebRTC audio and video');
  await host.screenshot({ path: output + '/call-laptop.png' });
  await guest.screenshot({ path: output + '/call-phone.png' });
  await host.getByRole('button', { name: /Chat$/ }).click();
  await host.getByRole('textbox', { name: 'Write a message' }).fill('Hello from George');
  await host.getByRole('button', { name: 'Send', exact: true }).click();
  await guest.getByRole('button', { name: /Chat$/ }).click();
  await guest.getByText('Hello from George', { exact: true }).waitFor();
  await guest.getByRole('textbox', { name: 'Write a message' }).fill('Hello back');
  await guest.getByRole('button', { name: 'Send', exact: true }).click();
  await host.getByText('Hello back', { exact: true }).waitFor();
  await guest.screenshot({ path: output + '/chat-phone.png' });
  await guest.getByRole('button', { name: 'Close', exact: true }).click();
  console.log('PASS chat travels in both directions');
  await host.getByRole('button', { name: 'Settings', exact: true }).click();
  await host.getByLabel('Camera', { exact: true }).waitFor();
  await host.getByRole('button', { name: 'Light', exact: true }).click();
  await host.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await host.screenshot({ path: output + '/settings-light-laptop.png' });
  await host.getByRole('button', { name: 'Dark', exact: true }).click();
  await host.getByRole('button', { name: 'Close panel', exact: true }).click();
  await guest.getByRole('button', { name: 'More options', exact: true }).click();
  await guest.getByRole('menuitem', { name: 'Settings', exact: true }).click();
  await guest.getByLabel('Microphone', { exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Close', exact: true }).click();
  await guest.getByRole('button', { name: 'Invite', exact: true }).click();
  assert.ok((await guest.getByLabel('Invite link', { exact: true }).inputValue()).includes('/#r/'));
  await guest.getByRole('button', { name: 'Close', exact: true }).click();
  console.log('PASS themes, join validation, desktop/mobile settings and invitation URL');
  await host.getByRole('button', { name: 'Mute microphone', exact: true }).click();
  await guest.locator('[aria-label="George, mic off"]').waitFor();
  await host.getByRole('button', { name: 'Turn camera off', exact: true }).click();
  await guest.locator('[aria-label="George, mic off, camera off"]').waitFor();
  assert.ok(
    await host.evaluate(() =>
      window.testTracks.filter((t) => t.kind === 'video').every((t) => t.readyState === 'ended'),
    ),
  );
  await host.getByRole('button', { name: 'Turn camera on', exact: true }).click();
  await guest.locator('[aria-label="George, mic off"]').waitFor();
  console.log('PASS camera/microphone changes reach the other participant');
  const extras = [];
  for (let i = 0; i < 3; i++) {
    const page = await contexts[0].newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '/#r/' + code);
    await page.getByLabel('Your name').fill('Guest ' + (i + 1));
    await page.getByRole('button', { name: 'Join room', exact: true }).click();
    extras.push(page);
  }
  for (const page of [host, guest, ...extras]) {
    await page.waitForFunction(
      () => window.testPeers.filter((p) => p.connectionState === 'connected').length === 4,
      { timeout: 20000 },
    );
    await page.waitForFunction(
      async () => {
        const connections = window.testPeers.filter((p) => p.connectionState === 'connected');
        return (
          connections.length === 4 &&
          (
            await Promise.all(
              connections.map(async (p) =>
                [...(await p.getStats()).values()].some(
                  (s) => s.type === 'inbound-rtp' && s.kind === 'video' && s.bytesReceived > 0,
                ),
              ),
            )
          ).every(Boolean)
        );
      },
      { timeout: 20000 },
    );
  }
  await host.screenshot({ path: output + '/five-people-laptop.png' });
  await guest.screenshot({ path: output + '/five-people-phone.png' });
  const sixth = await contexts[0].newPage();
  await sixth.goto(base + '/#r/' + code);
  await sixth.getByRole('heading', { name: 'This room is full' }).waitFor();
  await sixth.close();
  for (const page of extras) {
    await page.getByRole('button', { name: 'Leave', exact: true }).click();
    await page.close();
  }
  console.log('PASS five browsers exchange video; a sixth is refused');
  await guest.getByRole('button', { name: 'Leave', exact: true }).click();
  await guest.getByRole('heading', { name: 'You left the call' }).waitFor();
  assert.ok(await guest.evaluate(() => window.testTracks.every((t) => t.readyState === 'ended')));
  await host.getByRole('heading', { name: 'Waiting for others' }).waitFor();
  await guest.getByRole('button', { name: /^Rejoin / }).click();
  await guest.getByRole('button', { name: 'Join room', exact: true }).click();
  await guest.waitForFunction(() =>
    window.testPeers.some((p) => p.connectionState === 'connected'),
  );
  await guest.getByRole('button', { name: /Chat$/ }).click();
  assert.equal(await guest.getByText('Hello from George', { exact: true }).count(), 0);
  await guest.getByRole('button', { name: 'Close', exact: true }).click();
  await guest.getByRole('button', { name: 'Leave', exact: true }).click();
  await host.getByRole('button', { name: 'Leave', exact: true }).click();
  await host.getByRole('button', { name: /^Rejoin / }).click();
  await host.getByRole('heading', { name: 'We can’t find that room' }).waitFor();
  console.log('PASS leaving stops capture, rejoin works while occupied, empty rooms close');
  assert.deepEqual(errors, []);
  console.log('PASS no browser runtime errors; screenshots in ' + output);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
