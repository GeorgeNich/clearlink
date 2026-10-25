import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../core/Button';

export interface SidePanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  open?: boolean;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}

/** Laptop panel docked to the right of the call (chat, invite, settings). Sits in the flex row; pushes the stage. */
export function SidePanel({ open = true, title, children, footer, onClose, style, ...rest }: SidePanelProps) {
  const hid = 'cl-p-' + useId().replace(/:/g, '');
  if (!open) return null;
  return (
    <aside aria-labelledby={hid} className="cl-motion" {...rest}
      style={{ width: 'var(--cl-panel-width)', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cl-surface)',
        borderLeft: '1px solid var(--cl-line)', animation: 'cl-panel-in var(--cl-duration-base) var(--cl-ease-out) both', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cl-space-2)', padding: '12px 12px 12px 24px', borderBottom: '1px solid var(--cl-line)' }}>
        <h2 id={hid} style={{ flex: 1, margin: 0, font: 'var(--cl-weight-medium) var(--cl-size-xl)/var(--cl-leading-xl) var(--cl-font-sans)', color: 'var(--cl-text)' }}>{title}</h2>
        {onClose && <Button variant="ghost" icon="close" iconOnly aria-label="Close panel" onClick={onClose} />}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>{children}</div>
      {footer && <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--cl-line)' }}>{footer}</div>}
    </aside>
  );
}
