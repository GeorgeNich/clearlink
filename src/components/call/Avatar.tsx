import type { HTMLAttributes } from 'react';


export type PersonColor = 'amber' | 'rose' | 'sage' | 'dusk' | 'plum';
export const PERSON_COLORS: PersonColor[] = ['amber', 'rose', 'sage', 'dusk', 'plum'];

export function initialsOf(name = ''): string {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Full display name — initials are derived (first + last word). */
  name: string;
  /** Stable per-person colour. Assign once per participant and never change mid-call. */
  color?: PersonColor;
  /** Disc diameter in px. Default 64. */
  size?: number;
}

/** Stable per-person initials disc. */
export function Avatar({ name, color = 'amber', size = 64, style, ...rest }: AvatarProps) {
  const c = 'var(--cl-person-' + color + ')';
  const disc = (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: 'none', color: '#0D131C', background: c,
      fontFamily: 'var(--cl-font-sans)', fontWeight: 500, fontSize: Math.round(size * 0.38), lineHeight: 1, letterSpacing: '0.02em' }}>
      {initialsOf(name)}
    </span>
  );
  return (
    <span role="img" aria-label={name} {...rest} style={{ display: 'inline-flex', ...style }}>
      {disc}
    </span>
  );
}
