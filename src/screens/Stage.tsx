import { RemoteVideo } from '../components/call/RemoteMedia';
import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import {
  Banner,
  Button,
  LocalVideo,
  SelfView,
  Toast,
  VideoTile,
  hasLiveVideo,
} from '../components';
import type { AppActions, AppState, Corner } from '../state/useApp';
import { Card, cardBody, cardTitle } from './Shell';
import { ShareBlock } from './ShareBlock';

/** Grid shape for 1–4 remote people. Two people sit side by side on laptop and stacked on phone. */
function gridFor(n: number, phone: boolean): { cols: string; rows: string } {
  if (n === 2) return phone ? { cols: '1fr', rows: '1fr 1fr' } : { cols: '1fr 1fr', rows: '1fr' };
  if (n === 3) return { cols: '1fr 1fr', rows: '1.3fr 1fr' };
  if (n === 4) return { cols: '1fr 1fr', rows: '1fr 1fr' };
  return { cols: '1fr', rows: '1fr' };
}

/** `lift` keeps bottom corners clear of the thumbnail strip. */
function cornerStyle(corner: Corner, lift = 0): CSSProperties {
  return {
    [corner[0] === 't' ? 'top' : 'bottom']: corner[0] === 't' ? 10 : 10 + lift,
    [corner[1] === 'l' ? 'left' : 'right']: 10,
  };
}

/** The main video area: waiting card when alone, otherwise the remote grid with a floating self-view. */
export function Stage({ st, a, phone }: { st: AppState; a: AppActions; phone: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const n = st.remotes.length;
  const size = phone ? 'phone' : 'laptop';
  const me = st.name.trim() || 'You';
  const { cols, rows } = gridFor(n, phone);
  // Screen sharing is laptop-only; on phone it is never started, so this is just a guard.
  const sharing = st.sharing && !phone;
  const spot = !sharing && n > 1 ? st.remotes.find((p) => p.id === st.spotlightId) : undefined;
  const strip = sharing ? st.remotes : spot ? st.remotes.filter((p) => p.id !== spot.id) : [];
  const thumbW = phone ? 96 : 156,
    thumbH = phone ? 76 : 98;
  const lift = strip.length ? thumbH + 10 : 0;
  // Spotlight is only offered when there is someone else to put in the strip.
  const pick = (id: string) => (n > 1 && !sharing ? () => a.setSpotlight(id) : undefined);

  // Dragging snaps the self-view to whichever corner it is released nearest.
  const onDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const sx = e.clientX,
      sy = e.clientY;
    setDrag({ dx: 0, dy: 0 });
    const move = (ev: PointerEvent) => setDrag({ dx: ev.clientX - sx, dy: ev.clientY - sy });
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const r = stageRef.current?.getBoundingClientRect();
      if (r)
        a.setCorner(
          ((ev.clientY < r.top + r.height / 2 ? 't' : 'b') +
            (ev.clientX < r.left + r.width / 2 ? 'l' : 'r')) as Corner,
        );
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      ref={stageRef}
      className="relative flex min-h-0 flex-1 select-none flex-col"
      style={{
        gap: 10,
        opacity: st.conn === 'reconnecting' ? 0.6 : 1,
        transition: 'opacity var(--cl-duration-slow) var(--cl-ease-gentle)',
      }}
    >
      {sharing ? (
        <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-lg border-2 border-accent bg-tile">
          {st.screenStream ? (
            <RemoteVideo stream={st.screenStream} />
          ) : (
            <span className="text-xs text-fg-3">Starting screen share…</span>
          )}
          <Banner
            tone="warning"
            icon="share-screen"
            title="You’re sharing your screen"
            action={<Button onClick={a.stopShare}>Stop sharing</Button>}
            className="absolute left-1/2 top-3 -translate-x-1/2"
            style={{ width: 'min(520px, calc(100% - 24px))' }}
          />
        </div>
      ) : n === 0 ? (
        <div className="relative min-h-0 flex-1">
          <VideoTile
            name={me + ' (you)'}
            color="amber"
            cameraOff={!st.camOn}
            micOff={!st.micOn}
            speaking={st.speakingId === 'local'}
            size={size}
          >
            {hasLiveVideo(st.localStream) ? <LocalVideo stream={st.localStream} /> : undefined}
          </VideoTile>
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-[14px]">
            <Card width={400}>
              <div className="flex flex-col gap-1 text-center">
                <h2 className={cardTitle} style={{ fontSize: 26 }}>
                  Waiting for others
                </h2>
                <span className={cardBody} style={{ fontSize: 15 }}>
                  Anyone with the link or code can join while the room is open.
                </span>
              </div>
              <ShareBlock st={st} a={a} phone={phone} />
            </Card>
          </div>
        </div>
      ) : spot ? (
        <div className="relative min-h-0 flex-1">
          <VideoTile
            name={spot.displayName}
            color={spot.avatarColor}
            cameraOff={!spot.cameraEnabled}
            micOff={!spot.micEnabled}
            speaking={st.speakingId === spot.id}
            size={size}
          >
            {spot.stream && <RemoteVideo stream={spot.stream} />}
          </VideoTile>
          <Button
            variant="secondary"
            icon="close"
            className="absolute left-[10px] top-[10px] z-[11]"
            onClick={() => a.setSpotlight(null)}
          >
            Back to everyone
          </Button>
        </div>
      ) : (
        <div
          className="grid min-h-0 flex-1"
          style={{ gridTemplateColumns: cols, gridTemplateRows: rows, gap: phone ? 8 : 12 }}
        >
          {st.remotes.map((p, i) => (
            <div
              key={p.id}
              className="min-h-0 min-w-0"
              style={{ gridColumn: n === 3 && i === 0 ? '1 / span 2' : 'auto' }}
            >
              <VideoTile
                name={p.displayName}
                color={p.avatarColor}
                cameraOff={!p.cameraEnabled}
                micOff={!p.micEnabled}
                speaking={st.speakingId === p.id}
                size={size}
                onSelect={pick(p.id)}
              >
                {p.stream && <RemoteVideo stream={p.stream} />}
              </VideoTile>
            </div>
          ))}
        </div>
      )}

      {strip.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto">
          {strip.map((p) => (
            <div key={p.id} className="shrink-0" style={{ width: thumbW, height: thumbH }}>
              <VideoTile
                name={p.displayName}
                color={p.avatarColor}
                cameraOff={!p.cameraEnabled}
                micOff={!p.micEnabled}
                speaking={st.speakingId === p.id}
                size="phone"
                onSelect={sharing ? undefined : () => a.setSpotlight(p.id)}
              >
                {p.stream && <RemoteVideo stream={p.stream} />}
              </VideoTile>
            </div>
          ))}
        </div>
      )}

      {n > 0 && !st.selfHidden && (
        <div
          onPointerDown={onDown}
          className="absolute z-[12]"
          style={{
            ...cornerStyle(st.corner, lift),
            transform: drag ? `translate(${drag.dx}px, ${drag.dy}px)` : 'none',
            transition: drag ? 'none' : 'top .24s, bottom .24s, left .24s, right .24s',
          }}
        >
          <SelfView
            name={me}
            cameraOff={!st.camOn}
            micOff={!st.micOn}
            size={size}
            onHide={() => a.set({ selfHidden: true })}
          >
            {hasLiveVideo(st.localStream) ? <LocalVideo stream={st.localStream} /> : undefined}
          </SelfView>
        </div>
      )}
      {n > 0 && st.selfHidden && (
        <Button
          variant="secondary"
          className="absolute z-[12]"
          style={cornerStyle(st.corner, lift)}
          onClick={() => a.set({ selfHidden: false })}
        >
          Show my preview
        </Button>
      )}

      {/* Weak and reconnecting sit calmly over the layout, which stays as it was. */}
      {(st.conn === 'weak' || st.conn === 'reconnecting') && (
        <div className="pointer-events-none absolute inset-x-0 top-[10px] z-20 flex justify-center px-[10px]">
          {st.conn === 'weak' ? (
            <Banner tone="warning" title="Your connection is weak">
              Video may pause.
            </Banner>
          ) : (
            <Banner loading title="Reconnecting…">
              Hold on, your call is still here.
            </Banner>
          )}
        </div>
      )}

      {/* Quiet join and leave notices; they never take focus or block the call. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[15] flex flex-col items-center gap-[6px]">
        {st.toasts.map((t) => (
          <Toast key={t.id}>{t.text}</Toast>
        ))}
      </div>
    </div>
  );
}
