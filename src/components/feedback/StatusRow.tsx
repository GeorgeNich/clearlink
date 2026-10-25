import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/Icon';
import { Spinner } from './Spinner';

type Status = 'pass' | 'fail' | 'running' | 'idle';
const S: Record<Status, { word: string; bg: string; fg: string; icon: IconName | null }> = {
  pass: { word: 'Pass', bg: 'var(--cl-ok-soft)', fg: 'var(--cl-ok-text)', icon: 'check' },
  fail: { word: 'Fail', bg: 'var(--cl-danger-soft)', fg: 'var(--cl-danger-text)', icon: 'alert' },
  running: { word: 'Checking', bg: 'var(--cl-accent-soft)', fg: 'var(--cl-accent)', icon: null },
  idle: { word: 'Not run', bg: 'rgba(245,235,221,.06)', fg: 'var(--cl-text-2)', icon: null },
};

export interface StatusRowProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  status?: Status;
  /** One plain-language sentence explaining the result. */
  children?: ReactNode;
}

/** Diagnostics row: status chip (icon + word, never colour alone) + label + plain-language detail. */
export function StatusRow({ label, status = 'idle', children, style, ...rest }: StatusRowProps) {
  const s = S[status] || S.idle;
  return (
    <div {...rest} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--cl-space-4)', padding: '16px 18px', background: 'var(--cl-surface)', borderBottom: '1px solid var(--cl-line)', ...style }}>
      <span style={{ flexShrink: 0, minWidth: 104, height: 32, padding: '0 10px', borderRadius: 'var(--cl-radius-sm)', background: s.bg, color: s.fg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: 'var(--cl-weight-semibold) var(--cl-size-xs)/1 var(--cl-font-sans)' }}>
        {status === 'running' ? <Spinner size={18} label="Checking" /> : s.icon && <Icon name={s.icon} size={16} />}
        {s.word}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ font: 'var(--cl-weight-semibold) var(--cl-size-lg)/var(--cl-leading-lg) var(--cl-font-sans)' }}>{label}</span>
        {children && <span style={{ font: 'var(--cl-weight-regular) var(--cl-size-sm)/var(--cl-leading-sm) var(--cl-font-sans)', color: 'var(--cl-text-2)', textWrap: 'pretty' }}>{children}</span>}
      </div>
    </div>
  );
}
