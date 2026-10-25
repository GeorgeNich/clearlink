import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/Icon';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Visible label (and accessible name). Required — never icon-only in a call. */
  label: string;
  /** default · active (panel open, accent tint) · off (mic/camera off, danger tint) · leave (danger). */
  state?: 'default' | 'active' | 'off' | 'leave';
  /** 'phone' = 56px disc, 'laptop' = 52px disc. */
  size?: 'phone' | 'laptop';
  /** Default true. Only hide on laptop where a tooltip is provided. */
  showLabel?: boolean;
  /** e.g. <UnreadBadge count={2} /> — positioned top-right of the disc. */
  badge?: ReactNode;
  shape?: 'round' | 'square';
}

/** Round call control with an always-visible label underneath. */
export function IconButton({ icon, label, state = 'default', size = 'laptop', showLabel = true, badge, shape = 'round', className = '', type = 'button', ...rest }: IconButtonProps) {
  const cls = ['cl-ctl', state !== 'default' && 'cl-ctl--' + state, size === 'phone' && 'cl-ctl--phone', shape === 'square' && 'cl-ctl--square', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} title={label} aria-label={showLabel ? undefined : label} {...rest}>
      <span className="cl-ctl__disc">
        <Icon name={icon} size={size === 'phone' ? 26 : 24} />
        {badge}
      </span>
      {showLabel && <span>{label}</span>}
    </button>
  );
}
