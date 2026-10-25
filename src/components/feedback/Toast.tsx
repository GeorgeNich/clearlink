import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/Icon';

type ToneStyle = { bd: string; fg: string; icon: IconName | null };
const TONE: Record<'neutral' | 'success' | 'danger', ToneStyle> = {
  neutral: { bd: 'var(--cl-line-strong)', fg: 'var(--cl-text)', icon: null },
  success: { bd: 'rgba(127,191,138,.45)', fg: 'var(--cl-ok-text)', icon: 'check' },
  danger: { bd: 'var(--cl-danger-text)', fg: 'var(--cl-danger-text)', icon: 'alert' },
};

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'neutral' | 'success' | 'danger';
  /** Override the tone's icon; pass null for none. */
  icon?: IconName | null;
  children: ReactNode;
}

/** Brief, quiet notice (e.g. "Priya Raman joined"). Non-interactive; auto-dismiss is the caller's job (~3.5s). */
export function Toast({ tone = 'neutral', icon, children, style, ...rest }: ToastProps) {
  const t = TONE[tone] || TONE.neutral;
  const ic = icon === undefined ? t.icon : icon;
  return (
    <div role="status" className="cl-motion" {...rest}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--cl-space-2)', minHeight: 44, padding: '10px 16px', borderRadius: 'var(--cl-radius-lg)',
        background: 'var(--cl-surface)', border: '1px solid ' + t.bd, boxShadow: 'var(--cl-shadow)', color: 'var(--cl-text)',
        font: 'var(--cl-weight-medium) var(--cl-size-sm)/var(--cl-leading-sm) var(--cl-font-sans)', animation: 'cl-rise-in var(--cl-duration-base) var(--cl-ease-out) both', ...style }}>
      {ic && <span style={{ color: t.fg, display: 'flex' }}><Icon name={ic} size={18} /></span>}
      <span>{children}</span>
    </div>
  );
}
