export type DiagKey = 'camera' | 'microphone' | 'direct' | 'relay';
export type DiagStatus = 'idle' | 'running' | 'pass' | 'fail';
export const DIAG_KEYS: DiagKey[] = ['camera', 'microphone', 'direct', 'relay'];

/** Label, then the plain-language line for a pass and for a fail. */
export const DIAG_COPY: Record<DiagKey, { label: string; pass: string; fail: string }> = {
  camera: { label: 'Camera', pass: 'Your camera is working.', fail: 'Your browser isn’t letting Clearlink use the camera. Check its site permissions.' },
  microphone: { label: 'Microphone', pass: 'We can hear your microphone.', fail: 'No sound from your microphone. Check it isn’t muted or in use by another app.' },
  direct: { label: 'Direct connection', pass: 'Your device can connect straight to other people’s browsers.', fail: 'A direct connection wasn’t possible on this network. A configured TURN relay may be needed.' },
  relay: { label: 'Relay connection', pass: 'The backup relay route is reachable.', fail: 'The relay route couldn’t be reached. Calls may fail on this network.' },
};

export type DiagScenario = Record<DiagKey, boolean>;

/** Simulated. Nothing here touches the camera, microphone or network, and the screen says so. */
export async function runSimulatedCheck(key: DiagKey, scenario: DiagScenario): Promise<boolean> {
  await new Promise(r => setTimeout(r, 800));
  return scenario[key];
}
