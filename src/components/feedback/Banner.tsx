import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/Icon';
import { Spinner } from './Spinner';

type BannerTone = 'info' | 'warning' | 'danger' | 'success';
type ToneStyle = { bd: string; fg: string; icon: IconName | null };
const TONE: Record<BannerTone, ToneStyle> = {
  info: { bd: 'var(--cl-line-strong)', fg: 'var(--cl-text)', icon: null },
  warning: { bd: 'var(--cl-line)', fg: 'var(--cl-accent)', icon: 'signal-weak' },
  danger: { bd: 'var(--cl-danger-text)', fg: 'var(--cl-danger-text)', icon: 'alert' },
  success: { bd: 'rgba(127,191,138,.45)', fg: 'var(--cl-ok-text)', icon: 'check' },
};

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** info · warning (weak connection) · danger · success. */
  tone?: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Right-aligned action, e.g. <Button size="laptop">Try again</Button>. */
  action?: ReactNode;
  /** Swap the icon for a Spinner (reconnecting). */
  loading?: boolean;
  icon?: IconName | null;
}

/** Persistent calm notice over the call (weak, reconnecting) or inline in a card. */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  loading = false,
  icon,
  style,
  ...rest
}: BannerProps) {
  const t = TONE[tone] || TONE.info;
  const ic = icon === undefined ? t.icon : icon;
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className="cl-motion"
      {...rest}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cl-space-3)',
        padding: '12px 16px',
        borderRadius: 'var(--cl-radius-lg)',
        background: 'var(--cl-surface)',
        border: '1px solid ' + t.bd,
        boxShadow: 'var(--cl-shadow)',
        animation: 'cl-fade-in var(--cl-duration-slow) var(--cl-ease-gentle) both',
        ...style,
      }}
    >
      {loading ? (
        <Spinner size={28} label={typeof title === 'string' ? title : 'Working'} />
      ) : (
        ic && (
          <span style={{ color: t.fg, display: 'flex', flexShrink: 0 }}>
            <Icon name={ic} size={22} />
          </span>
        )
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {title && (
          <span
            style={{
              font: 'var(--cl-weight-semibold) var(--cl-size-md)/var(--cl-leading-md) var(--cl-font-sans)',
              color: 'var(--cl-text)',
            }}
          >
            {title}
          </span>
        )}
        {children && (
          <span
            style={{
              font: 'var(--cl-weight-regular) var(--cl-size-sm)/var(--cl-leading-sm) var(--cl-font-sans)',
              color: 'var(--cl-text-2)',
            }}
          >
            {children}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
