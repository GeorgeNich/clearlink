export type PersonColor = 'amber' | 'rose' | 'sage' | 'dusk' | 'plum';

export interface Participant {
  id: string;
  displayName: string;
  /** Assigned once and kept for tiles, avatars and chat. */
  avatarColor: PersonColor;
  micEnabled: boolean;
  cameraEnabled: boolean;
  stream?: MediaStream;
}

export interface Room {
  code: string;
  inviteUrl: string;
  capacity: 5;
}

export type PreviewResult = { ok: true } | { ok: false; reason: 'blocked' };
export type ValidateResult = 'ok' | 'missing' | 'full';

export type DeviceKind = 'camera' | 'microphone' | 'speaker';
export interface DeviceInfo {
  id: string;
  label: string;
}
export type DeviceOptions = Record<DeviceKind, DeviceInfo[]>;

/** Local camera, microphone and screen share, implemented by BrowserMediaService. */
export interface MediaService {
  /** Asks for camera and microphone. Resolves blocked when there is no usable camera. A microphone may still have been granted. */
  preview(): Promise<PreviewResult>;
  /** Stops every track so the camera light goes off. */
  release(): void;
  /** Your own video and audio. A new object whenever the tracks change; null when there are none. */
  stream(): MediaStream | null;
  hasCamera(): boolean;
  hasMic(): boolean;
  setMic(on: boolean): void;
  /** Off stops the camera (its light goes out); on asks for it again. Resolves false if it couldn't start. */
  setCamera(on: boolean): Promise<boolean>;
  devices(): DeviceOptions;
  /** The id currently chosen for each kind. */
  selected(): Record<DeviceKind, string>;
  selectDevice(kind: DeviceKind, id: string): Promise<void>;
  /** Laptop only. Resolves once sharing has started. */
  startScreenShare(): Promise<void>;
  stopScreenShare(): void;
}
