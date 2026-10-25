import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cleanCode, codeProblem, formatCode } from '../lib/code';
import { BrowserMediaService } from '../services/browserMedia';
import { LiveRoomService } from '../services/liveRoom';
import { ShareAdapter } from '../services/shareAdapter';
import type { ShareOutcome } from '../services/shareAdapter';
import type {
  DeviceKind,
  DeviceOptions,
  MediaService,
  Participant,
  PersonColor,
  Room,
} from '../services/types';
import { NamePreference } from './namePreference';

export type Route =
  | 'welcome'
  | 'validating'
  | 'check'
  | 'blocked'
  | 'connecting'
  | 'call'
  | 'ended'
  | 'cannot'
  | 'notfound'
  | 'full';
export type Intent = 'create' | 'join';

export type Corner = 'tl' | 'tr' | 'bl' | 'br';
export interface Toast {
  id: number;
  text: string;
}

export type ConnState = 'healthy' | 'weak' | 'reconnecting' | 'failed';

/** What rejoin needs: the room, and who was still in it when you left (an empty room has closed). */
export interface LastRoom {
  room: Room;
  remotes: Participant[];
}

const mmss = (sec: number) =>
  String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');

export type Panel = 'chat' | 'invite' | 'settings' | null;

/** In memory only. Delivered to whoever is present when it is sent; never replayed to latecomers. */
export interface ChatMessage {
  id: number;
  fromLocal: boolean;
  name: string;
  color: PersonColor;
  text: string;
  time: string;
}

const clock = () => {
  const d = new Date();
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
};

export interface ShareMessage {
  text: string;
  ok: boolean;
}

export interface AppState {
  route: Route;
  intent: Intent;
  codeInput: string;
  codeError: string;
  pendingCode: string;
  name: string;
  remembered: string;
  micOn: boolean;
  camOn: boolean;
  blockedNote: string;
  room: Room | null;
  startedAt: number;
  remotes: Participant[];
  speakingId: string | null;
  corner: Corner;
  selfHidden: boolean;
  toasts: Toast[];
  panel: Panel;
  moreOpen: boolean;
  sharing: boolean;
  conn: ConnState;
  rejoining: boolean;
  lastRoom: LastRoom | null;
  endedDuration: string;
  devices: Record<DeviceKind, string>;
  deviceOptions: DeviceOptions;
  /** Your own camera and microphone stream. Null when off. */
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  /** A plain-language problem with your camera or microphone, shown on the pre-call screens. */
  mediaNote: string;
  spotlightId: string | null;
  messages: ChatMessage[];
  unread: number;
  draft: string;
  shareMsg: ShareMessage | null;
}

const noDevices = (): DeviceOptions => ({ camera: [], microphone: [], speaker: [] });

const initial = (): AppState => {
  const name = NamePreference.get();
  return {
    route: 'welcome',
    intent: 'create',
    codeInput: '',
    codeError: '',
    pendingCode: '',
    name,
    remembered: name,
    micOn: true,
    camOn: true,
    blockedNote: '',
    room: null,
    startedAt: 0,
    remotes: [],
    speakingId: null,
    corner: 'tr',
    selfHidden: false,
    toasts: [],
    panel: null,
    moreOpen: false,
    sharing: false,
    conn: 'healthy',
    rejoining: false,
    lastRoom: null,
    endedDuration: '00:00',
    devices: { camera: '', microphone: '', speaker: '' },
    deviceOptions: noDevices(),
    localStream: null,
    screenStream: null,
    mediaNote: '',
    spotlightId: null,
    messages: [],
    unread: 0,
    draft: '',
    shareMsg: null,
  };
};

export function useApp() {
  const [st, setSt] = useState<AppState>(initial);
  const S = useRef(st);
  S.current = st;
  const set = useCallback((p: Partial<AppState>) => setSt((s) => ({ ...s, ...p })), []);

  const real = useRef(new BrowserMediaService()).current;
  const pick = (): MediaService => real;
  const live = useRef(new LiveRoomService()).current;
  const releaseAll = () => {
    live.leave();
    real.release();
  };
  const mediaState = (m: MediaService) => ({
    localStream: m.stream(),
    deviceOptions: m.devices(),
    devices: m.selected(),
  });
  // Camera light off and tracks stopped when the app closes or unmounts.
  useEffect(() => {
    const release = () => {
      nav.current++;
      live.leave();
      real.release();
    };
    window.addEventListener('pagehide', release);
    return () => {
      release();
      window.removeEventListener('pagehide', release);
    };
  }, [real, live]);
  // Each navigation bumps this so a slow, superseded request can't move the user.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastId = useRef(0);
  const msgId = useRef(0);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const nav = useRef(0);
  const guard = () => ++nav.current;
  const stale = (token: number) => token !== nav.current;

  useEffect(() => {
    live.onPeople = (remotes) =>
      setSt((s) =>
        s.route === 'call'
          ? {
              ...s,
              remotes,
              spotlightId: remotes.some((p) => p.id === s.spotlightId) ? s.spotlightId : null,
            }
          : s,
      );
    live.onConnection = (conn) => setSt((s) => (s.route === 'call' ? { ...s, conn } : s));
    live.onChat = (p, text) => {
      const message: ChatMessage = {
        id: ++msgId.current,
        fromLocal: false,
        name: p.displayName,
        color: p.avatarColor,
        text,
        time: clock(),
      };
      setSt((s) =>
        s.route === 'call'
          ? {
              ...s,
              messages: [...s.messages, message],
              unread: s.panel === 'chat' ? 0 : s.unread + 1,
            }
          : s,
      );
    };
    real.onShareEnded = () => set({ sharing: false, screenStream: null });
  }, [live, real, set]);
  useEffect(() => {
    if (st.route !== 'call') return;
    const audio = st.localStream?.getAudioTracks() ?? [];
    const video = (st.sharing ? st.screenStream : st.localStream)?.getVideoTracks() ?? [];
    live.updateMedia(new MediaStream([...audio, ...video]), st.micOn, st.camOn || st.sharing);
  }, [live, st.route, st.localStream, st.screenStream, st.sharing, st.micOn, st.camOn]);

  const enterCheck = useCallback(
    async (token: number) => {
      const m = pick();
      const res = await m.preview();
      if (stale(token)) return;
      const mic = m.hasMic();
      set({
        ...mediaState(m),
        route: res.ok ? 'check' : 'blocked',
        camOn: res.ok,
        micOn: mic,
        blockedNote: '',
        mediaNote: mic
          ? ''
          : res.ok
            ? 'No microphone found, so your mic is off.'
            : 'Your microphone isn’t available either, so others won’t hear you.',
      });
    },
    [set],
  );

  const actions = useMemo(() => {
    const a = {
      set,
      goHome: () => {
        guard();
        releaseAll();
        clearHash();
        set({
          route: 'welcome',
          codeError: '',
          blockedNote: '',
          room: null,
          shareMsg: null,
          remotes: [],
          speakingId: null,
          toasts: [],
          panel: null,
          moreOpen: false,
          sharing: false,
          conn: 'healthy',
          rejoining: false,
          lastRoom: null,
          spotlightId: null,
          messages: [],
          unread: 0,
          draft: '',
          localStream: null,
          screenStream: null,
          mediaNote: '',
        });
      },
      startCall: () => {
        const t = guard();
        set({ intent: 'create', room: null, rejoining: false });
        void enterCheck(t);
      },
      onCode: (value: string) => set({ codeInput: formatCode(cleanCode(value)), codeError: '' }),
      submitCode: () => {
        const problem = codeProblem(S.current.codeInput);
        if (problem) return set({ codeError: problem });
        a.openInvite(S.current.codeInput);
      },
      openInvite: async (code: string, rejoining = false) => {
        const t = guard();
        releaseAll();
        const formatted = formatCode(cleanCode(code));
        set({
          intent: 'join',
          pendingCode: formatted,
          route: 'validating',
          room: null,
          rejoining,
          localStream: null,
          screenStream: null,
          sharing: false,
        });
        let result;
        try {
          result = await live.validateRoom(formatted);
        } catch {
          if (!stale(t)) set({ route: 'cannot' });
          return;
        }
        if (stale(t)) return;
        if (result === 'missing') return set({ route: 'notfound' });
        if (result === 'full') return set({ route: 'full' });
        void enterCheck(t);
      },
      toggleMic: () => {
        const m = pick();
        const next = !S.current.micOn;
        if (next && !m.hasMic()) {
          const msg = 'No microphone found, so your mic can’t be turned on.';
          return S.current.route === 'call' ? a.toast(msg) : set({ mediaNote: msg });
        }
        m.setMic(next);
        set({ micOn: next, mediaNote: '' });
      },
      // Camera off stops the camera (its light goes out); on asks for it again, which can fail.
      toggleCam: async () => {
        const m = pick();
        const next = !S.current.camOn;
        const t = nav.current;
        const ok = await m.setCamera(next);
        if (stale(t)) return;
        if (!ok) {
          const msg = 'We couldn’t start your camera. Check your browser’s site settings.';
          return S.current.route === 'call' ? a.toast(msg) : set({ mediaNote: msg });
        }
        set({ ...mediaState(m), camOn: next, mediaNote: '' });
      },
      confirmEntry: async () => {
        const s = S.current;
        const name = s.name.trim();
        if (!name) return;
        NamePreference.set(name);
        const t = guard();
        set({ name, remembered: name, route: 'connecting' });
        const res = await live.enter(
          s.intent,
          s.pendingCode,
          name,
          pick().stream(),
          s.micOn,
          s.camOn,
        );
        if (stale(t)) return;
        if (res.status === 'ok') {
          return set({
            route: 'call',
            room: res.room,
            startedAt: Date.now(),
            shareMsg: null,
            speakingId: null,
            selfHidden: false,
            toasts: [],
            panel: null,
            moreOpen: false,
            sharing: false,
            spotlightId: null,
            messages: [],
            unread: 0,
            draft: '',
            remotes: live.people(),
            conn: 'healthy',
          });
        }
        set({
          route:
            res.status === 'failed' ? 'cannot' : res.status === 'missing' ? 'notfound' : 'full',
        });
      },
      joinWithoutCamera: () => {
        set({ camOn: false });
        void a.confirmEntry();
      },
      retryCamera: async () => {
        const t = guard();
        const m = pick();
        const res = await m.preview();
        if (stale(t)) return;
        if (res.ok)
          set({
            ...mediaState(m),
            route: 'check',
            camOn: true,
            micOn: m.hasMic(),
            blockedNote: '',
            mediaNote: '',
          });
        else
          set({
            ...mediaState(m),
            camOn: false,
            micOn: m.hasMic(),
            blockedNote: 'The camera is still blocked. Check your browser’s site settings.',
          });
      },
      // Retry keeps the name, media choices and create/join intent.
      retryConnect: () => {
        void a.confirmEntry();
      },
      shareInvite: async () => {
        const r = S.current.room;
        if (r) set({ shareMsg: shareMessage('invite', await ShareAdapter.shareInvite(r)) });
      },
      copyLink: async () => {
        const r = S.current.room;
        if (r) set({ shareMsg: shareMessage('link', await ShareAdapter.copyLink(r)) });
      },
      copyCode: async () => {
        const r = S.current.room;
        if (r) set({ shareMsg: shareMessage('code', await ShareAdapter.copyCode(r)) });
      },
      toast: (text: string) => {
        const id = ++toastId.current;
        setSt((s) => ({ ...s, toasts: [...s.toasts, { id, text }].slice(-3) }));
        timers.current.push(
          setTimeout(
            () => setSt((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
            3500,
          ),
        );
      },
      // Layout, panel and chat are independent: opening one never resets another.
      togglePanel: (p: Exclude<Panel, null>) =>
        setSt((s) => ({
          ...s,
          panel: s.panel === p ? null : p,
          moreOpen: false,
          unread: p === 'chat' && s.panel !== 'chat' ? 0 : s.unread,
          shareMsg: null,
        })),
      closePanel: () => set({ panel: null }),
      leave: () => {
        const s = S.current;
        if (s.route !== 'call') return;
        guard();
        releaseAll();
        set({
          route: 'ended',
          lastRoom: s.room ? { room: s.room, remotes: s.remotes } : null,
          room: null,
          endedDuration: mmss(Math.floor((Date.now() - s.startedAt) / 1000)),
          // Leaving clears this user's chat and releases media.
          messages: [],
          unread: 0,
          draft: '',
          panel: null,
          moreOpen: false,
          sharing: false,
          spotlightId: null,
          conn: 'healthy',
          remotes: [],
          speakingId: null,
          toasts: [],
          shareMsg: null,
          localStream: null,
          screenStream: null,
          mediaNote: '',
        });
      },
      rejoin: () => {
        const lr = S.current.lastRoom;
        if (lr) void a.openInvite(lr.room.code, true);
      },
      // Retry restarts the connection search. Mic and camera stay exactly as you left them.
      retryConn: () => {
        live.retry();
      },
      setMore: (moreOpen: boolean) => set({ moreOpen }),
      selectDevice: async (kind: DeviceKind, id: string) => {
        const m = pick(),
          t = nav.current;
        try {
          await m.selectDevice(kind, id);
        } catch {
          if (!stale(t)) a.toast('That device couldn’t start. Try another device.');
        }
        if (stale(t)) return;
        m.setMic(S.current.micOn && m.hasMic());
        set({ ...mediaState(m), camOn: m.hasCamera(), micOn: S.current.micOn && m.hasMic() });
      },
      startShare: async () => {
        const t = nav.current,
          m = pick();
        set({ moreOpen: false });
        try {
          await m.startScreenShare();
          if (stale(t) || S.current.route !== 'call') return m.stopScreenShare();
          set({ sharing: true, screenStream: real.screenStream(), spotlightId: null });
        } catch {
          if (!stale(t))
            a.toast('Screen sharing wasn’t started. You can try again from More options.');
        }
      },
      stopShare: () => {
        pick().stopScreenShare();
        set({ sharing: false, screenStream: null, moreOpen: false });
      },
      setSpotlight: (id: string | null) => set({ spotlightId: id }),
      sendChat: async () => {
        const s = S.current,
          text = s.draft.trim(),
          t = nav.current;
        if (!text || text.length > 4000) return;
        set({ draft: '' });
        try {
          await live.chat(text);
          if (stale(t)) return;
          const m: ChatMessage = {
            id: ++msgId.current,
            fromLocal: true,
            name: s.name,
            color: 'amber',
            text,
            time: clock(),
          };
          setSt((s) => ({ ...s, messages: [...s.messages, m] }));
        } catch {
          if (!stale(t)) {
            setSt((s) => ({ ...s, draft: s.draft || text }));
            a.toast('Your message wasn’t sent. Please try again.');
          }
        }
      },
      setCorner: (corner: Corner) => set({ corner }),
    };
    return a;
  }, [enterCheck, set]);

  // Invite links: #r/XXXXXXXX opens straight to validation.
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace(/^#\/?/, '');
      if (!/^r\//i.test(h)) return;
      const raw = cleanCode(h.slice(2));
      if (raw.length === 8) void actions.openInvite(raw);
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [actions]);

  return [st, actions] as const;
}

export type AppActions = ReturnType<typeof useApp>[1];

function clearHash() {
  if (location.pathname !== '/') {
    history.replaceState(null, '', '/');
    return;
  }
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
}

/** Plain-language result. Success is only ever reported after the browser confirmed it; cancelling says nothing. */
function shareMessage(
  what: 'invite' | 'link' | 'code',
  o: ShareOutcome & { fellBack?: boolean },
): ShareMessage | null {
  if (o.kind === 'cancelled') return null;
  if (o.kind === 'shared') return { ok: true, text: 'Invite handed to your share sheet.' };
  if (o.kind === 'copied') {
    if (o.fellBack)
      return {
        ok: true,
        text: 'Sharing isn’t available here, so the link was copied instead. Paste it into the people you want to invite.',
      };
    return { ok: true, text: what === 'code' ? 'Code copied.' : 'Link copied.' };
  }
  if (what === 'code') return { ok: false, text: 'Couldn’t copy the code. Read it out instead.' };
  if (what === 'link')
    return { ok: false, text: 'Couldn’t copy the link. Try Copy code, or read the code out.' };
  return {
    ok: false,
    text: 'Sharing and copying aren’t available here. Read the room code out instead.',
  };
}
