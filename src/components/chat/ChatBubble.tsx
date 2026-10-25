import type { HTMLAttributes, ReactNode } from 'react';
import { Avatar } from '../call/Avatar';
import type { PersonColor } from '../call/Avatar';

export interface ChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  /** Your own message — right-aligned, accent tint, labelled "You". */
  self?: boolean;
  /** Sender display name (ignored when self). */
  name?: string;
  color?: PersonColor;
  /** Pre-formatted, e.g. "9:14". */
  time?: string;
  children: ReactNode;
}

/** One chat message. Self = right, accent tint, "You". Other = left, avatar + name in their colour. */
export function ChatBubble({ self = false, name = '', color = 'amber', time, children, style, ...rest }: ChatBubbleProps) {
  return (
    <div {...rest} style={{ display: 'flex', gap: 'var(--cl-space-3)', alignItems: 'flex-end', flexDirection: self ? 'row-reverse' : 'row', ...style }}>
      {!self && <Avatar name={name} color={color} size={36} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '80%', alignItems: self ? 'flex-end' : 'flex-start' }}>
        <span style={{ font: 'var(--cl-weight-medium) var(--cl-size-xs)/var(--cl-leading-xs) var(--cl-font-sans)', color: 'var(--cl-text-2)' }}>
          <span style={{ color: self ? 'var(--cl-text-2)' : 'var(--cl-person-' + color + ')', fontWeight: 600 }}>{self ? 'You' : name}</span>
          {time && <span> · {time}</span>}
        </span>
        <div style={{ padding: '10px 14px', borderRadius: self ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: self ? 'var(--cl-accent-soft)' : 'var(--cl-raised)',
          border: '1px solid ' + (self ? 'var(--cl-line)' : 'var(--cl-line)'),
          color: 'var(--cl-text)', font: 'var(--cl-weight-regular) var(--cl-text-chat)/var(--cl-leading-md) var(--cl-font-sans)', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
