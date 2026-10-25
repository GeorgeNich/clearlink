import type { ReactNode, SVGProps } from 'react';

export type IconName = 'mic' | 'mic-off' | 'camera' | 'camera-off' | 'chat' | 'invite' | 'share-screen' | 'settings' | 'leave' | 'menu' | 'close' | 'send' | 'copy' | 'check' | 'alert' | 'signal-weak' | 'share';

// Paths follow Lucide (ISC licence), 24×24 grid, 2px round stroke.
const P: Record<IconName, ReactNode> = {
  mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></>,
  'mic-off': <><path d="m2 2 20 20"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M12 19v3"/></>,
  camera: <><path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.75-.43L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></>,
  'camera-off': <><path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.25-3.06a.5.5 0 0 1 .75.43v8.2"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="m2 2 20 20"/></>,
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>,
  invite: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></>,
  'share-screen': <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m9 10 3-3 3 3"/><path d="M12 13V7"/><path d="M12 17v4"/><path d="M8 21h8"/></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  leave: <><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><path d="M22 2 2 22"/></>,
  menu: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  close: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  copy: <><rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>,
  check: <path d="M20 6 9 17l-5-5"/>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
  'signal-weak': <><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8" opacity=".3"/><path d="M17 20V8" opacity=".3"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/></>,
};

export const ICON_NAMES = Object.keys(P) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Px. 24 default; 16–18 in chips; 26 in phone controls. */
  size?: number;
  strokeWidth?: number;
  /** Accessible name. Omit when a visible text label sits next to the icon. */
  label?: string;
  color?: string;
}

/** Single consistent line icon set. Decorative by default; pass `label` to make it announce. */
export function Icon({ name, size = 24, strokeWidth = 2, label, color = 'currentColor', style, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" role={label ? 'img' : undefined}
      aria-label={label} aria-hidden={label ? undefined : 'true'} focusable="false"
      style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      {P[name] || null}
    </svg>
  );
}
