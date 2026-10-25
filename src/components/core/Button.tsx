import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Default 'primary'. One primary per view. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 'phone' = 52px tall, 18px label. 'laptop' = 48px, 16px label. */
  size?: 'phone' | 'laptop';
  /** Full width. */
  block?: boolean;
  /** Leading icon. */
  icon?: IconName;
  /** Square icon-only button — requires aria-label. */
  iconOnly?: boolean;
  children?: ReactNode;
}

/** Text button: primary, secondary, ghost or danger. */
export function Button({
  variant = 'primary',
  size = 'laptop',
  block = false,
  icon,
  iconOnly = false,
  children,
  className = '',
  type = 'button',
  style,
  ...rest
}: ButtonProps) {
  const cls = [
    'cl-btn',
    'cl-btn--' + variant,
    size === 'phone' && 'cl-btn--phone',
    block && 'cl-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const iconSize = size === 'phone' ? 22 : 20;
  const sq = iconOnly ? { width: size === 'phone' ? 52 : 48, padding: 0 } : null;
  return (
    <button type={type} className={cls} style={{ ...sq, ...style }} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {iconOnly ? null : children}
    </button>
  );
}
