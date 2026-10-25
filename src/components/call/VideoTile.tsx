import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { Avatar } from './Avatar';
import type { PersonColor } from './Avatar';
import { Spinner } from '../feedback/Spinner';

const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  padding: '0 10px',
  borderRadius: 'var(--cl-radius-sm)',
  background: 'var(--cl-surface-label)',
  color: '#E9EEF4',
  font: 'var(--cl-weight-medium) var(--cl-size-xs)/1 var(--cl-font-sans)',
  whiteSpace: 'nowrap',
};

export interface VideoTileProps extends HTMLAttributes<HTMLElement> {
  name: string;
  color?: PersonColor;
  /** Shows Avatar instead of video. */
  cameraOff?: boolean;
  /** Danger chip with slashed mic + "Mic off" label. */
  micOff?: boolean;
  /** Accent ring + "Speaking" chip, 600ms fade. */
  speaking?: boolean;
  /** live (default) · connecting (spinner, no video) · weak (badge, video kept). */
  status?: 'live' | 'connecting' | 'weak';
  size?: 'phone' | 'laptop';
  /** The <video> element. Should be object-fit: cover, absolutely filling the tile. */
  children?: ReactNode;
  /** Makes the tile a button (e.g. enlarge to spotlight). */
  onSelect?: () => void;
}

/** One participant's video. States compose: speaking, mic off, camera off, connecting, weak. */
export function VideoTile({
  name,
  color = 'amber',
  cameraOff = false,
  micOff = false,
  speaking = false,
  status = 'live',
  size = 'laptop',
  children,
  onSelect,
  style,
  ...rest
}: VideoTileProps) {
  const phone = size === 'phone';
  const connecting = status === 'connecting';
  const showVideo = !cameraOff && !connecting;
  const desc = [
    name,
    speaking && 'speaking',
    micOff && 'mic off',
    cameraOff && 'camera off',
    connecting && 'connecting',
    status === 'weak' && 'weak connection',
  ]
    .filter(Boolean)
    .join(', ');
  const Tag = onSelect ? 'button' : 'div';
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      onClick={onSelect}
      aria-label={desc}
      {...(rest as HTMLAttributes<HTMLElement>)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
        width: '100%',
        height: '100%',
        padding: 0,
        border: 0,
        font: 'inherit',
        color: 'inherit',
        textAlign: 'left',
        borderRadius: 'var(--cl-radius-lg)',
        background: 'var(--cl-tile)',
        cursor: onSelect ? 'pointer' : 'default',
        boxShadow: speaking ? 'var(--cl-glow-accent)' : '0 0 0 1px var(--cl-line)',
        transition: 'box-shadow var(--cl-duration-glow) var(--cl-ease-gentle)',
        display: 'block',
        ...style,
      }}
    >
      {showVideo &&
        (children || (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(110% 90% at 50% 30%, color-mix(in srgb, var(--cl-person-${color}) 32%, transparent), var(--cl-tile) 75%)`,
            }}
          />
        ))}
      {!showVideo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--cl-space-3)',
            background: 'var(--cl-backdrop-glow)',
          }}
        >
          {connecting ? (
            <>
              <Spinner size={phone ? 40 : 52} label={'Connecting ' + name} />
              <span
                style={{
                  font: 'var(--cl-weight-medium) var(--cl-size-sm)/1 var(--cl-font-sans)',
                  color: 'var(--cl-text-2)',
                }}
              >
                Connecting…
              </span>
            </>
          ) : (
            <>
              <Avatar name={name} color={color} size={phone ? 52 : 84} />
              {!phone && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--cl-tile-text)',
                    fontSize: 13,
                  }}
                >
                  <Icon name="camera-off" size={16} />
                  Camera off
                </span>
              )}
            </>
          )}
        </div>
      )}
      {status === 'weak' && (
        <span
          style={{
            ...chip,
            position: 'absolute',
            top: 10,
            left: 10,
            color: 'var(--cl-accent)',
          }}
        >
          <Icon name="signal-weak" size={18} /> Weak connection
        </span>
      )}
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            ...chip,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        {speaking && (
          <span
            style={{
              ...chip,
              background: 'var(--cl-accent)',
              color: 'var(--cl-accent-ink)',
              fontWeight: 600,
            }}
          >
            Speaking
          </span>
        )}
        <span style={{ flex: 1 }} />
        {micOff && (
          <span
            title="Mic off"
            style={{
              ...chip,
              background: 'var(--cl-danger)',
              color: 'var(--cl-accent-ink)',
              padding: phone ? '0 6px' : '0 10px 0 8px',
            }}
          >
            <Icon name="mic-off" size={16} />
            {!phone && 'Mic off'}
          </span>
        )}
      </div>
    </Tag>
  );
}
