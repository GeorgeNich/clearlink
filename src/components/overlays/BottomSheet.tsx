import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../core/Button';

export interface BottomSheetProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  open?: boolean;
  title: ReactNode;
  children?: ReactNode;
  /** Pinned area, e.g. chat composer. */
  footer?: ReactNode;
  /** Tapping the scrim or the close button. */
  onClose?: () => void;
  /** CSS height. Default 74%, capped at 80%. */
  height?: string;
}

/** Phone panel that rises from the bottom (chat, invite, settings). Fills nearest positioned ancestor. */
export function BottomSheet({
  open = true,
  title,
  children,
  footer,
  onClose,
  height = '74%',
  style,
  ...rest
}: BottomSheetProps) {
  const hid = 'cl-s-' + useId().replace(/:/g, '');
  if (!open) return null;
  return (
    <div className="cl-motion" style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--cl-scrim)',
          animation: 'cl-fade-in var(--cl-duration-base) var(--cl-ease-gentle) both',
        }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={hid}
        {...rest}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height,
          maxHeight: 'var(--cl-sheet-max)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--cl-surface)',
          borderRadius: 'var(--cl-radius-2xl) var(--cl-radius-2xl) 0 0',
          borderTop: '1px solid var(--cl-line)',
          boxShadow: 'var(--cl-shadow)',
          animation: 'cl-sheet-in var(--cl-duration-slow) var(--cl-ease-out) both',
          ...style,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            alignSelf: 'center',
            width: 40,
            height: 5,
            borderRadius: 3,
            background: 'var(--cl-line-strong)',
            marginTop: 8,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--cl-space-2)',
            padding: '12px 12px 12px 24px',
            borderBottom: '1px solid var(--cl-line)',
          }}
        >
          <h2
            id={hid}
            style={{
              flex: 1,
              margin: 0,
              font: 'var(--cl-weight-medium) var(--cl-size-xl)/var(--cl-leading-xl) var(--cl-font-sans)',
              color: 'var(--cl-text)',
            }}
          >
            {title}
          </h2>
          {onClose && (
            <Button variant="ghost" icon="close" iconOnly aria-label="Close" onClick={onClose} />
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: '12px 16px 20px', borderTop: '1px solid var(--cl-line)' }}>
            {footer}
          </div>
        )}
      </section>
    </div>
  );
}
