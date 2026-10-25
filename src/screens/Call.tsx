import { RemoteAudio } from '../components/call/RemoteMedia';
import { useEffect, useState } from 'react';
import { BottomSheet, Button, ControlBar, Modal, SidePanel, Wordmark } from '../components';
import type { AppActions, AppState } from '../state/useApp';
import { ChatPanelBody, Composer } from './ChatPanel';
import { InvitePanelBody } from './InvitePanel';
import { cleanCode, formatCode } from '../lib/code';
import { SettingsPanelBody } from './SettingsPanel';
import { Stage } from './Stage';

const fmt = (sec: number) =>
  String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');

/** The connected call. With nobody else here it is the waiting screen; the layout follows the head-count. */
export function Call({ st, a, phone }: { st: AppState; a: AppActions; phone: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!st.panel && !st.moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (st.moreOpen) a.setMore(false);
        else a.closePanel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st.panel, st.moreOpen, a]);
  // Sharing is a laptop action; if the window narrows to phone width, stop it rather than leave it half-shown.
  useEffect(() => {
    if (phone && st.sharing) a.stopShare();
  }, [phone, st.sharing, a]);

  const sec = Math.max(0, Math.floor((now - st.startedAt) / 1000));
  const title = st.panel === 'chat' ? 'Chat' : st.panel === 'invite' ? 'Invite' : 'Settings';
  const body =
    st.panel === 'chat' ? (
      <ChatPanelBody st={st} />
    ) : st.panel === 'invite' ? (
      <InvitePanelBody st={st} a={a} phone={phone} />
    ) : (
      <SettingsPanelBody st={st} a={a} />
    );
  const footer = st.panel === 'chat' ? <Composer st={st} a={a} phone={phone} /> : null;

  return (
    <div className="absolute inset-0 flex bg-bg">
      <div
        className="relative flex min-w-0 flex-1 flex-col"
        style={{
          gap: phone ? 8 : 12,
          padding: phone ? '10px 10px 12px' : '16px 20px 18px',
        }}
      >
        <div className="flex min-h-[48px] shrink-0 items-center gap-[10px]">
          <Wordmark compact className="min-w-0" />
          {!phone && (
            <span className="ml-3 flex flex-col text-xs text-fg-3">
              Room
              <span className="cl-code text-sm text-fg">
                {formatCode(cleanCode(st.room?.code || ''))}
              </span>
            </span>
          )}
          <span className="flex-1" />
          <span
            className="cl-status"
            data-state={st.conn}
            role="status"
            aria-label={
              st.conn === 'healthy'
                ? 'Connected'
                : st.conn === 'weak'
                  ? 'Weak connection'
                  : st.conn === 'reconnecting'
                    ? 'Reconnecting'
                    : 'Disconnected'
            }
          >
            <span aria-hidden="true">●</span>
            <span className="cl-status-text">
              {st.conn === 'healthy'
                ? 'Connected'
                : st.conn === 'weak'
                  ? 'Weak connection'
                  : st.conn === 'reconnecting'
                    ? 'Reconnecting'
                    : 'Disconnected'}
            </span>
          </span>
          <span className="flex h-8 shrink-0 items-center gap-2 rounded-full border border-line px-3 text-xs">
            <span className="cl-code">{fmt(sec)}</span>
            <span className="text-fg-2">{st.remotes.length + 1} of 5</span>
          </span>
        </div>
        <div className="absolute left-3 top-16 z-30">
          {st.remotes.map(
            (p) =>
              p.stream && (
                <RemoteAudio
                  key={p.id}
                  stream={p.stream}
                  name={p.displayName}
                  speaker={st.devices.speaker}
                />
              ),
          )}
        </div>
        <Stage st={st} a={a} phone={phone} />
        <div className="flex shrink-0 justify-center">
          <ControlBar
            size={phone ? 'phone' : 'laptop'}
            micOn={st.micOn}
            cameraOn={st.camOn}
            chatOpen={st.panel === 'chat'}
            inviteOpen={st.panel === 'invite'}
            unread={st.unread}
            sharing={st.sharing}
            settingsOpen={st.panel === 'settings'}
            moreOpen={st.moreOpen}
            onShare={() => (st.sharing ? a.stopShare() : void a.startShare())}
            onSettings={() => a.togglePanel('settings')}
            onMore={() => a.setMore(!st.moreOpen)}
            onMic={a.toggleMic}
            onCamera={a.toggleCam}
            onChat={() => a.togglePanel('chat')}
            onInvite={() => a.togglePanel('invite')}
            onLeave={a.leave}
            style={phone ? { width: '100%' } : undefined}
          />
        </div>
      </div>
      <Modal
        open={st.conn === 'failed'}
        alert
        title="Connection lost"
        actions={
          <>
            <Button block size="phone" onClick={a.retryConn}>
              Try again
            </Button>
            <Button block variant="secondary" onClick={a.leave}>
              Leave call
            </Button>
          </>
        }
      >
        We couldn’t reconnect you to the call. Check your internet and try again.
      </Modal>
      {st.moreOpen && (
        <>
          <div className="absolute inset-0 z-[38]" onClick={() => a.setMore(false)} />
          <div
            role="menu"
            className="absolute z-[39] flex w-[240px] flex-col gap-0.5 rounded-lg border border-line-strong bg-panel p-[6px] shadow-lg"
            style={{ bottom: 90, right: phone ? 10 : 20 }}
          >
            <Button
              role="menuitem"
              variant="ghost"
              icon="settings"
              block
              style={{
                justifyContent: 'flex-start',
                color: 'var(--cl-text)',
              }}
              onClick={() => a.togglePanel('settings')}
            >
              Settings
            </Button>
            <Button
              role="menuitem"
              variant="ghost"
              onClick={() => {
                a.set({ selfHidden: !st.selfHidden });
                a.setMore(false);
              }}
            >
              {st.selfHidden ? 'Show my preview' : 'Hide my preview'}
            </Button>
            {!phone && (
              <Button
                role="menuitem"
                variant="ghost"
                icon="share-screen"
                block
                style={{
                  justifyContent: 'flex-start',
                  color: 'var(--cl-text)',
                }}
                onClick={() => (st.sharing ? a.stopShare() : void a.startShare())}
              >
                {st.sharing ? 'Stop sharing' : 'Share screen'}
              </Button>
            )}
          </div>
        </>
      )}
      {!phone && st.panel && (
        <SidePanel title={title} onClose={a.closePanel} footer={footer}>
          {body}
        </SidePanel>
      )}
      {phone && st.panel && (
        <BottomSheet title={title} onClose={a.closePanel} footer={footer}>
          {body}
        </BottomSheet>
      )}
    </div>
  );
}
