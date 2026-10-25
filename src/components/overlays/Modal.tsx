import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../core/Button';

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open?: boolean;
  title: ReactNode;
  children?: ReactNode;
  /** Stacked full-width buttons, primary first. */
  actions?: ReactNode;
  /** Shows a close button. Omit for decisions that must be answered. */
  onClose?: () => void;
  /** role=alertdialog — for Connection lost etc. */
  alert?: boolean;
}

/** Centred dialog over a scrim. Fills its nearest positioned ancestor (the app shell). */
export function Modal({ open = true, title, children, actions, onClose, alert = false, style, ...rest }: ModalProps) {
  const hid = 'cl-m-' + useId().replace(/:/g, '');
  if (!open) return null;
  return (
    <div className="cl-motion" style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--cl-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--cl-space-4)', animation: 'cl-fade-in var(--cl-duration-base) var(--cl-ease-gentle) both' }}>
      <div role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={hid} {...rest}
        style={{ width: '100%', maxWidth: 'var(--cl-modal-width)', background: 'var(--cl-surface)', border: '1px solid var(--cl-line)', borderRadius: 'var(--cl-radius-xl)', boxShadow: 'var(--cl-shadow), var(--cl-bevel)', overflow: 'hidden', animation: 'cl-rise-in var(--cl-duration-slow) var(--cl-ease-out) both', ...style }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cl-space-2)', padding: '12px 12px 12px 24px', borderBottom: '1px solid var(--cl-line)' }}>
          <h2 id={hid} style={{ flex: 1, margin: 0, font: 'var(--cl-weight-medium) var(--cl-size-xl)/var(--cl-leading-xl) var(--cl-font-sans)', color: 'var(--cl-text)' }}>{title}</h2>
          {onClose && <Button variant="ghost" icon="close" iconOnly aria-label="Close" onClick={onClose} />}
        </div>
        <div style={{ padding: '20px 24px', font: 'var(--cl-weight-regular) var(--cl-size-md)/var(--cl-leading-md) var(--cl-font-sans)', color: 'var(--cl-text-2)' }}>{children}</div>
        {actions && <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cl-space-3)', padding: '0 24px 24px' }}>{actions}</div>}
      </div>
    </div>
  );
}
