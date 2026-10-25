import type { HTMLAttributes } from 'react';

export interface UnreadBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Renders nothing at 0. */
  count: number;
  /** Above this shows "9+". Default 9. */
  max?: number;
}

/** Small accent count pill. Hidden when count is 0. */
export function UnreadBadge({ count = 0, max = 9, style, ...rest }: UnreadBadgeProps) {
  if (!count) return null;
  const text = count > max ? max + '+' : String(count);
  return (
    <span aria-label={count + (count === 1 ? ' unread message' : ' unread messages')} {...rest}
      style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 'var(--cl-radius-full)', background: 'var(--cl-accent)', color: 'var(--cl-accent-ink)',
        border: '2px solid var(--cl-surface)', boxSizing: 'content-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        font: 'var(--cl-weight-bold) 13px/1 var(--cl-font-sans)', fontVariantNumeric: 'tabular-nums', ...style }}>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
