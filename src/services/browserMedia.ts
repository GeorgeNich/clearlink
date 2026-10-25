import type { DeviceInfo, DeviceKind, DeviceOptions, MediaService, PreviewResult } from './types';

/** Owns local capture. Request generations prevent late permission results from reviving a released camera. */
export class BrowserMediaService implements MediaService {
  private tracks: MediaStreamTrack[] = [];
  private current: MediaStream | null = null;
  private options: DeviceOptions = { camera: [], microphone: [], speaker: [] };
  private chosen: Record<DeviceKind, string> = { camera: '', microphone: '', speaker: '' };
  private generation = 0;
  private requests = { video: 0, audio: 0 };
  private micOn = true;
  private cameraWanted = true;
  sharing = false;
  private display: MediaStream | null = null;
  private shareGeneration = 0;
  onShareEnded?: () => void;

  private constraint(kind: 'video' | 'audio'): MediaTrackConstraints | boolean {
    const id = this.chosen[kind === 'video' ? 'camera' : 'microphone'];
    return id ? { deviceId: { exact: id } } : true;
  }
  private setTracks(tracks: MediaStreamTrack[]) {
    this.tracks = tracks;
    this.current = tracks.length ? new MediaStream(tracks) : null;
  }
  private live(kind: 'video' | 'audio') {
    return this.tracks.filter((t) => t.kind === kind && t.readyState === 'live');
  }
  private async loadDevices() {
    const list = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const pick = (k: MediaDeviceKind, fallback: string): DeviceInfo[] =>
      list
        .filter((d) => d.kind === k)
        .map((d, i) => ({ id: d.deviceId, label: d.label || `${fallback} ${i + 1}` }));
    this.options = {
      camera: pick('videoinput', 'Camera'),
      microphone: pick('audioinput', 'Microphone'),
      speaker: pick('audiooutput', 'Speaker'),
    };
    this.chosen.camera =
      this.live('video')[0]?.getSettings().deviceId ||
      this.chosen.camera ||
      this.options.camera[0]?.id ||
      '';
    this.chosen.microphone =
      this.live('audio')[0]?.getSettings().deviceId ||
      this.chosen.microphone ||
      this.options.microphone[0]?.id ||
      '';
  }
  private async acquire(kind: 'video' | 'audio'): Promise<boolean> {
    const generation = this.generation,
      request = ++this.requests[kind];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ [kind]: this.constraint(kind) });
      if (generation !== this.generation || request !== this.requests[kind]) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      // Keep a working device until its replacement has actually opened.
      this.live(kind).forEach((t) => t.stop());
      stream.getAudioTracks().forEach((t) => {
        t.enabled = this.micOn;
      });
      this.setTracks([...this.tracks.filter((t) => t.kind !== kind), ...stream.getTracks()]);
      await this.loadDevices();
      return generation === this.generation && request === this.requests[kind];
    } catch {
      return false;
    }
  }
  async preview(): Promise<PreviewResult> {
    this.release();
    this.micOn = true;
    this.cameraWanted = true;
    // Independent acquisition allows either device to work when the other is absent or denied.
    await Promise.all([this.acquire('video'), this.acquire('audio')]);
    return this.hasCamera() ? { ok: true } : { ok: false, reason: 'blocked' };
  }
  release() {
    this.generation++;
    this.tracks.forEach((t) => t.stop());
    this.setTracks([]);
    this.stopScreenShare();
  }
  stream() {
    return this.current;
  }
  hasCamera() {
    return this.live('video').length > 0;
  }
  hasMic() {
    return this.live('audio').length > 0;
  }
  setMic(on: boolean) {
    this.micOn = on;
    this.live('audio').forEach((t) => {
      t.enabled = on;
    });
  }
  async setCamera(on: boolean): Promise<boolean> {
    this.cameraWanted = on;
    if (!on) {
      this.requests.video++;
      this.live('video').forEach((t) => t.stop());
      this.setTracks(this.tracks.filter((t) => t.kind !== 'video'));
      return true;
    }
    return this.hasCamera() || this.acquire('video');
  }
  devices() {
    return this.options;
  }
  selected() {
    return { ...this.chosen };
  }
  async selectDevice(kind: DeviceKind, id: string) {
    const previous = this.chosen[kind];
    this.chosen[kind] = id;
    if (kind === 'speaker' || (kind === 'camera' && !this.cameraWanted)) return;
    if (!(await this.acquire(kind === 'camera' ? 'video' : 'audio'))) {
      this.chosen[kind] = previous;
      throw new Error(
        'That device could not be opened. Your previous device is kept where available.',
      );
    }
  }
  screenStream() {
    return this.display;
  }
  async startScreenShare() {
    const generation = ++this.shareGeneration;
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    if (generation !== this.shareGeneration) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    this.display?.getTracks().forEach((t) => t.stop());
    this.display = stream;
    this.sharing = true;
    stream.getVideoTracks()[0].onended = () => {
      this.stopScreenShare();
      this.onShareEnded?.();
    };
  }
  stopScreenShare() {
    this.shareGeneration++;
    this.display?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    this.display = null;
    this.sharing = false;
  }
}
