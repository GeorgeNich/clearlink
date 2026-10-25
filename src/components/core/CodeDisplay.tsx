import type { HTMLAttributes, ReactNode } from 'react';

export interface CodeDisplayProps extends HTMLAttributes<HTMLDivElement> {
  /** 8 characters from ABCDEFGHJKLMNPQRSTUVWXYZ23456789; hyphen optional. */
  code: string;
  /** Default "Room code". Pass null to hide. */
  label?: string | null;
  /** phone = 32px, laptop = 40px. */
  size?: 'phone' | 'laptop';
  /** Optional action row under the code, e.g. a Copy code button. */
  action?: ReactNode;
}

/** Large room code, shown as XXXX-XXXX in monospace. Selectable; spelled out for screen readers. */
export function CodeDisplay({ code = '', label = 'Room code', size = 'laptop', action, style, ...rest }: CodeDisplayProps) {
  const raw = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(8, '·').slice(0, 8);
  const a = raw.slice(0, 4), b = raw.slice(4);
  const fs = size === 'phone' ? 'var(--cl-code-size-phone)' : 'var(--cl-code-size-laptop)';
  return (
    <div {...rest} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--cl-space-2)', padding: 'var(--cl-space-4) var(--cl-space-5)', background: 'var(--cl-sunken)', border: '1px solid var(--cl-line)', borderRadius: 'var(--cl-radius-lg)', boxShadow: 'var(--cl-bevel-sunken)', ...style }}>
      {label && <span style={{ font: 'var(--cl-weight-medium) var(--cl-size-xs)/var(--cl-leading-xs) var(--cl-font-sans)', color: 'var(--cl-text-2)' }}>{label}</span>}
      <span aria-label={raw.split('').join(' ')} style={{ display: 'flex', alignItems: 'center', gap: '0.12em', fontFamily: 'var(--cl-font-mono)' , fontWeight: 600, fontSize: fs, lineHeight: 1, letterSpacing: 'var(--cl-code-tracking)', color: 'var(--cl-text)', userSelect: 'all', fontVariantNumeric: 'tabular-nums' }}>
        <span aria-hidden="true">{a}</span>
        <span aria-hidden="true" style={{ color: 'var(--cl-accent)', fontWeight: 400 }}>-</span>
        <span aria-hidden="true">{b}</span>
      </span>
      {action}
    </div>
  );
}
