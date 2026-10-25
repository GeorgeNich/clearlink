import type { DeviceInfo, DeviceKind, DeviceOptions, MediaService, PreviewResult } from './types';

export type CameraScenario = 'allowed' | 'blocked';

const info = (names: string[]): DeviceInfo[] => names.map(n => ({ id: n, label: n }));

export const DEVICE_OPTIONS: DeviceOptions = {
  camera: info(['FaceTime HD Camera', 'USB Webcam']),
  microphone: info(['MacBook Microphone', 'AirPods', 'USB Microphone']),
  speaker: info(['MacBook Speakers', 'AirPods', 'Living room speaker']),
};

/** Simulated devices and screen share. No real hardware is opened or switched; the interface shows placeholders. */
export class MockMediaService implements MediaService {
  permissionScenario: CameraScenario = 'allowed';
  private chosen: Record<DeviceKind, string> = { camera: DEVICE_OPTIONS.camera[0].id, microphone: DEVICE_OPTIONS.microphone[0].id, speaker: DEVICE_OPTIONS.speaker[0].id };
  private granted = false;
  sharing = false;

  async preview(): Promise<PreviewResult> {
    await new Promise(r => setTimeout(r, 250));
    this.granted = this.permissionScenario !== 'blocked';
    return this.granted ? { ok: true } : { ok: false, reason: 'blocked' };
  }

  stream() { return null; }
  hasCamera() { return this.granted; }
  hasMic() { return true; }
  setMic() {}
  async setCamera() { return true; }
  devices() { return DEVICE_OPTIONS; }
  selected() { return this.chosen; }
  async selectDevice(kind: DeviceKind, id: string) { this.chosen[kind] = id; }

  async startScreenShare() {
    await new Promise(r => setTimeout(r, 200));
    this.sharing = true;
  }
  stopScreenShare() { this.sharing = false; }

  release() { this.sharing = false; this.granted = false; }
}
