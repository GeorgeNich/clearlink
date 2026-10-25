import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { Avatar } from './Avatar';
import type { PersonColor } from './Avatar';

export interface SelfViewProps extends HTMLAttributes<HTMLDivElement> {
  /** Used for initials when camera is off. */
  name?: string;
  color?: PersonColor;
  cameraOff?: boolean;
  micOff?: boolean;
  /** phone 104×140, laptop 200×124. */
  size?: 'phone' | 'laptop';
  /** Shows a hide button (48px hit area). Pair with a "Show my preview" Button in the same corner. */
  onHide?: () => void;
  /** Your mirrored <video>. */
  children?: ReactNode;
}

/** Small floating preview of yourself. Parent positions it in a corner; drag handling is the parent's job. */
export function SelfView({ name = 'You', color = 'amber', cameraOff = false, micOff = false, size = 'laptop', onHide, children, style, ...rest }: SelfViewProps) {
  const phone = size === 'phone';
  return (
    <div aria-label={'Your preview' + (micOff ? ', mic off' : '') + (cameraOff ? ', camera off' : '')} {...rest}
      style={{ position: 'relative', width: phone ? 96 : 216, height: phone ? 128 : 136, borderRadius: 'var(--cl-radius-md)', overflow: 'hidden',
        background: 'var(--cl-tile)', border: '1px solid var(--cl-line)', boxShadow: 'var(--cl-shadow)', touchAction: 'none', cursor: 'grab', ...style }}>
      {!cameraOff && (children || <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(110% 90% at 50% 30%, rgba(91,196,204,.16), var(--cl-tile) 75%)' }} />)}
      {cameraOff && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Avatar name={name} color={color} size={phone ? 44 : 48} /></div>}
      <span style={{ position: 'absolute', left: 8, bottom: 8, height: 24, padding: '0 8px', display: 'flex', alignItems: 'center', borderRadius: 'var(--cl-radius-sm)', background: 'var(--cl-surface-label)', color: '#E9EEF4', font: 'var(--cl-weight-medium) var(--cl-size-xs)/1 var(--cl-font-sans)'  }}>You</span>
      {micOff && <span title="Your mic is off" style={{ position: 'absolute', right: 8, bottom: 8, width: 24, height: 24, borderRadius: '50%', background: 'var(--cl-danger)', color: 'var(--cl-accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="mic-off" size={14} /></span>}
      {onHide && (
        <button type="button" onClick={onHide} onPointerDown={e => e.stopPropagation()} aria-label="Hide your preview"
          style={{ position: 'absolute', top: 0, right: 0, width: 48, height: 48, padding: 0, border: 0, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <span style={{ margin: 6, width: 28, height: 28, borderRadius: 'var(--cl-radius-sm)', background: 'var(--cl-surface-label)', color: '#E9EEF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={16} /></span>
        </button>
      )}
    </div>
  );
}
