import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cleanCode, codeProblem, formatCode } from '../lib/code';
import { MockMediaService } from '../services/mockMedia';
import { DEVICE_OPTIONS } from '../services/mockMedia';
import { BrowserMediaService } from '../services/browserMedia';
import { LIVE, LiveRoomService } from '../services/liveRoom';
import { MockRoomService } from '../services/mockRoom';
import { DIAG_KEYS, runSimulatedCheck } from '../services/mockDiagnostics';
import type { DiagKey, DiagScenario, DiagStatus } from '../services/mockDiagnostics';
import { ShareAdapter } from '../services/shareAdapter';
import type { ShareOutcome } from '../services/shareAdapter';
import type { RoomScenario } from '../services/mockRoom';
import type { DeviceKind, DeviceOptions, MediaService, Participant, PersonColor, Room } from '../services/types';
import { NamePreference } from './namePreference';

export type Route =
  | 'welcome' | 'validating' | 'check' | 'blocked' | 'connecting'
  | 'call'
  | 'ended'
  | 'diag'
  | 'cannot' | 'notfound' | 'full';
export type Intent = 'create' | 'join';

/** real = your actual camera and mic; simulated = placeholders, no permission asked; blocked = pretend permission was refused. */
export type MediaMode = 'real' | 'simulated' | 'blocked';

export interface Demo { cam: MediaMode; room: RoomScenario['room']; connect: RoomScenario['connect']; present: number; remoteCams: boolean; dx: DiagScenario }

export type Corner = 'tl' | 'tr' | 'bl' | 'br';
export interface Toast { id: number; text: string }

/** The people who can appear in a simulated call, in the order they arrive. */
export const POOL: Pick<Participant, 'id' | 'displayName' | 'avatarColor'>[] = [
  { id: 'jr', displayName: 'Priya Raman', avatarColor: 'rose' },
  { id: 'am', displayName: 'Alex Chen', avatarColor: 'sage' },
  { id: 'er', displayName: 'Sam Taylor', avatarColor: 'dusk' },
  { id: 'lm', displayName: 'Jordan Lee', avatarColor: 'plum' },
];

export type ConnState = 'healthy' | 'weak' | 'reconnecting' | 'failed';

/** What rejoin needs: the room, and who was still in it when you left (an empty room has closed). */
export interface LastRoom { room: Room; remotes: Participant[] }

const mmss = (sec: number) => String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');

export type Panel = 'chat' | 'invite' | 'settings' | null;

/** In memory only. Delivered to whoever is present when it is sent; never replayed to latecomers. */
export interface ChatMessage { id: number; fromLocal: boolean; name: string; color: PersonColor; text: string; time: string }

const LINES = ['Lovely to see everyone!', 'Coffee is ready.', 'Can you hear me okay?', 'Back in two minutes.', 'Mum says hello!', 'The dog wants to say hi.'];
const clock = () => { const d = new Date(); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };

export interface ShareMessage { text: string; ok: boolean }

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
  diag: Record<DiagKey, DiagStatus>;
  diagRunning: boolean;
  rejoining: boolean;
  lastRoom: LastRoom | null;
  endedDuration: string;
  devices: Record<DeviceKind, string>;
  deviceOptions: DeviceOptions;
  /** Your own camera and microphone stream. Null when simulated or off. */
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  /** A plain-language problem with your camera or microphone, shown on the pre-call screens. */
  mediaNote: string;
  spotlightId: string | null;
  messages: ChatMessage[];
  unread: number;
  draft: string;
  shareMsg: ShareMessage | null;
  demo: Demo;
}

/** Remote people arrive with the second person muted, so the muted state is visible straight away. */
const makeRemote = (p: (typeof POOL)[number], i: number, cams: boolean): Participant => ({ ...p, micEnabled: i !== 1, cameraEnabled: cams });

const idleDiag = (): Record<DiagKey, DiagStatus> => ({ camera: 'idle', microphone: 'idle', direct: 'idle', relay: 'idle' });

/** /test (or #test) opens the connection check directly. */
const opensDiagnostics = () => location.pathname.replace(/\/+$/, '') === '/test' || location.hash.replace(/^#\/?/, '') === 'test';

const initial = (): AppState => {
  const name = NamePreference.get();
  return {
    route: opensDiagnostics() ? 'diag' : 'welcome', intent: 'create', codeInput: '', codeError: '', pendingCode: '',
    name, remembered: name, micOn: true, camOn: true, blockedNote: '', room: null,
    startedAt: 0, remotes: [], speakingId: null, corner: 'tr', selfHidden: false, toasts: [], panel: null, moreOpen: false, sharing: false, conn: 'healthy', diag: idleDiag(), diagRunning: false, rejoining: false, lastRoom: null, endedDuration: '00:00',
    devices: { camera: DEVICE_OPTIONS.camera[0].id, microphone: DEVICE_OPTIONS.microphone[0].id, speaker: DEVICE_OPTIONS.speaker[0].id },
    deviceOptions: DEVICE_OPTIONS, localStream: null, screenStream: null, mediaNote: '',
    spotlightId: null, messages: [], unread: 0, draft: '', shareMsg: null,
    demo: { cam: 'real', room: 'ok', connect: 'ok', present: 0, remoteCams: false, dx: { camera: true, microphone: true, direct: false, relay: true } },
  };
};

export function useApp() {
  const [st, setSt] = useState<AppState>(initial);
  const S = useRef(st);
  S.current = st;
  const set = useCallback((p: Partial<AppState>) => setSt(s => ({ ...s, ...p })), []);

  const real = useRef(new BrowserMediaService()).current;
  const mock = useRef(new MockMediaService()).current;
  const pick = (): MediaService => (S.current.demo.cam === 'real' ? real : mock);
  const live = useRef(new LiveRoomService()).current;
  const releaseAll = () => { live.leave(); real.release(); mock.release(); };
  const mediaState = (m: MediaService) => ({ localStream: m.stream(), deviceOptions: m.devices(), devices: m.selected() });
  // Camera light off and tracks stopped when the app closes or unmounts.
  useEffect(() => {
    const release = () => { nav.current++; live.leave(); real.release(); mock.release(); };
    window.addEventListener('pagehide', release);
    return () => { release(); window.removeEventListener('pagehide', release); };
  }, [real, mock, live]);
  const rooms = useRef(new MockRoomService()).current;
  // Each navigation bumps this so a slow, superseded request can't move the user.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastId = useRef(0);
  const msgId = useRef(0);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const nav = useRef(0);
  const guard = () => ++nav.current;
  const stale = (token: number) => token !== nav.current;

  useEffect(() => {
    mock.permissionScenario = st.demo.cam === 'blocked' ? 'blocked' : 'allowed';
    rooms.scenario = { room: st.demo.room, connect: st.demo.connect, present: st.demo.present };
  }, [st.demo, mock, rooms]);

  useEffect(() => {
    live.onPeople = remotes => setSt(s => s.route === 'call' ? ({ ...s, remotes,
      spotlightId: remotes.some(p => p.id === s.spotlightId) ? s.spotlightId : null }) : s);
    live.onConnection = conn => setSt(s => s.route === 'call' ? { ...s, conn } : s);
    live.onChat = (p, text) => {
      const message: ChatMessage = { id: ++msgId.current, fromLocal: false, name: p.displayName, color: p.avatarColor, text, time: clock() };
      setSt(s => s.route === 'call' ? { ...s, messages: [...s.messages, message], unread: s.panel === 'chat' ? 0 : s.unread + 1 } : s);
    };
    real.onShareEnded = () => set({ sharing: false, screenStream: null });
  }, [live, real, set]);
  useEffect(() => {
    if (!LIVE || st.route !== 'call') return;
    const audio = st.localStream?.getAudioTracks() ?? [];
    const video = (st.sharing ? st.screenStream : st.localStream)?.getVideoTracks() ?? [];
    live.updateMedia(new MediaStream([...audio, ...video]), st.micOn, st.camOn || st.sharing);
  }, [live, st.route, st.localStream, st.screenStream, st.sharing, st.micOn, st.camOn]);

  const enterCheck = useCallback(async (token: number) => {
    const m = pick();
    const res = await m.preview();
    if (stale(token)) return;
    const mic = m.hasMic();
    set({
      ...mediaState(m), route: res.ok ? 'check' : 'blocked', camOn: res.ok, micOn: mic, blockedNote: '',
      mediaNote: mic ? '' : res.ok ? 'No microphone found, so your mic is off.' : 'Your microphone isn’t available either, so others won’t hear you.',
    });
  }, [set]);

  const actions = useMemo(() => {
    const a = {
      set,
      goHome: () => { guard(); releaseAll(); clearHash(); set({ route: 'welcome', codeError: '', blockedNote: '', room: null, shareMsg: null, remotes: [], speakingId: null, toasts: [], panel: null, moreOpen: false, sharing: false, conn: 'healthy', rejoining: false, lastRoom: null, spotlightId: null, messages: [], unread: 0, draft: '', localStream: null, screenStream: null, mediaNote: '' }); },
      startCall: () => { const t = guard(); set({ intent: 'create', room: null, rejoining: false }); void enterCheck(t); },
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
        set({ intent: 'join', pendingCode: formatted, route: 'validating', room: null, rejoining, localStream: null, screenStream: null, sharing: false });
        let result;
        try { result = await (LIVE ? live : rooms).validateRoom(formatted); }
        catch { if (!stale(t)) set({ route: 'cannot' }); return; }
        if (stale(t)) return;
        // A room closes when it is empty, so rejoining only works if someone was still there when you left.
        if (!LIVE && rejoining && result === 'ok' && !S.current.lastRoom?.remotes.length) result = 'missing';
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
        const res = LIVE ? await live.enter(s.intent, s.pendingCode, name, pick().stream(), s.micOn, s.camOn) : s.intent === 'create' ? await rooms.createRoom() : await rooms.joinRoom(s.pendingCode, name);
        if (stale(t)) return;
        if (res.status === 'ok') {
          const others = 'others' in res ? (res.others as number) : 0;
          return set({
            route: 'call', room: res.room, startedAt: Date.now(), shareMsg: null, speakingId: null, selfHidden: false, toasts: [], panel: null, moreOpen: false, sharing: false, spotlightId: null, messages: [], unread: 0, draft: '',
            remotes: LIVE ? live.people() : s.rejoining && S.current.lastRoom ? S.current.lastRoom.remotes.map(r => ({ ...r })) : POOL.slice(0, others).map((p, i) => makeRemote(p, i, S.current.demo.remoteCams)),
            conn: 'healthy',
          });
        }
        set({ route: res.status === 'failed' ? 'cannot' : res.status === 'missing' ? 'notfound' : 'full' });
      },
      joinWithoutCamera: () => { set({ camOn: false }); void a.confirmEntry(); },
      retryCamera: async () => {
        const t = guard();
        const m = pick();
        const res = await m.preview();
        if (stale(t)) return;
        if (res.ok) set({ ...mediaState(m), route: 'check', camOn: true, micOn: m.hasMic(), blockedNote: '', mediaNote: '' });
        else set({ ...mediaState(m), camOn: false, micOn: m.hasMic(), blockedNote: 'The camera is still blocked. Check your browser’s site settings.' });
      },
      // Retry keeps the name, media choices and create/join intent.
      retryConnect: () => { void a.confirmEntry(); },
      shareInvite: async () => { const r = S.current.room; if (r) set({ shareMsg: shareMessage('invite', await ShareAdapter.shareInvite(r)) }); },
      copyLink: async () => { const r = S.current.room; if (r) set({ shareMsg: shareMessage('link', await ShareAdapter.copyLink(r)) }); },
      copyCode: async () => { const r = S.current.room; if (r) set({ shareMsg: shareMessage('code', await ShareAdapter.copyCode(r)) }); },
      // Simulated arrivals and departures. Real ones will come from the room service.
      setRemoteCount: (n: number) => {
        const s = S.current;
        if (s.route !== 'call') return;
        const target = Math.max(0, Math.min(POOL.length, n));
        const toasts: string[] = [];
        let remotes = s.remotes;
        while (remotes.length < target) {
          const p = POOL[remotes.length];
          remotes = [...remotes, makeRemote(p, remotes.length, s.demo.remoteCams)];
          toasts.push(p.displayName + ' joined');
        }
        while (remotes.length > target) {
          toasts.push(remotes[remotes.length - 1].displayName + ' left');
          remotes = remotes.slice(0, -1);
        }
        set({ remotes, spotlightId: remotes.some(r => r.id === s.spotlightId) ? s.spotlightId : null, speakingId: remotes.some(r => r.id === s.speakingId) ? s.speakingId : null });
        toasts.forEach(t => a.toast(t));
      },
      toast: (text: string) => {
        const id = ++toastId.current;
        setSt(s => ({ ...s, toasts: [...s.toasts, { id, text }].slice(-3) }));
        timers.current.push(setTimeout(() => setSt(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) })), 3500));
      },
      nextSpeaker: () => setSt(s => {
        // The self-view has no speaking glow, so you only get a turn when you are alone on the stage.
        const ids: (string | null)[] = [null, ...(s.remotes.length ? s.remotes.map(r => r.id) : ['local'])];
        return { ...s, speakingId: ids[(ids.indexOf(s.speakingId) + 1) % ids.length] };
      }),
      setRemoteCams: (on: boolean) => setSt(s => ({ ...s, demo: { ...s.demo, remoteCams: on }, remotes: s.remotes.map(r => ({ ...r, cameraEnabled: on })) })),
      // Layout, panel and chat are independent: opening one never resets another.
      togglePanel: (p: Exclude<Panel, null>) => setSt(s => ({ ...s, panel: s.panel === p ? null : p, moreOpen: false, unread: p === 'chat' && s.panel !== 'chat' ? 0 : s.unread, shareMsg: null })),
      closePanel: () => set({ panel: null }),
      leave: () => {
        const s = S.current;
        if (s.route !== 'call') return;
        guard();
        releaseAll();
        set({
          route: 'ended', lastRoom: s.room ? { room: s.room, remotes: s.remotes } : null, room: null,
          endedDuration: mmss(Math.floor((Date.now() - s.startedAt) / 1000)),
          // Leaving clears this user's chat and releases media.
          messages: [], unread: 0, draft: '', panel: null, moreOpen: false, sharing: false, spotlightId: null, conn: 'healthy', remotes: [], speakingId: null, toasts: [], shareMsg: null, localStream: null, screenStream: null, mediaNote: '',
        });
      },
      rejoin: () => { const lr = S.current.lastRoom; if (lr) void a.openInvite(lr.room.code, true); },
      setConn: (conn: ConnState) => { if (S.current.route === 'call') set({ conn }); },
      // Retry shows reconnecting, then recovers. Mic and camera stay exactly as you left them.
      retryConn: () => {
        if (LIVE) return live.retry();
        set({ conn: 'reconnecting' });
        timers.current.push(setTimeout(() => setSt(s => (s.route === 'call' && s.conn === 'reconnecting' ? { ...s, conn: 'healthy' } : s)), 1800));
      },
      runDiag: () => {
        if (S.current.diagRunning) return;
        set({ diagRunning: true, diag: idleDiag() });
        DIAG_KEYS.forEach((k, i) => {
          timers.current.push(setTimeout(() => setSt(s => ({ ...s, diag: { ...s.diag, [k]: 'running' } })), i * 900));
          timers.current.push(setTimeout(async () => {
            const ok = await runSimulatedCheck(k, S.current.demo.dx);
            setSt(s => ({ ...s, diag: { ...s.diag, [k]: ok ? 'pass' : 'fail' }, diagRunning: i < DIAG_KEYS.length - 1 }));
          }, i * 900 + 50));
        });
      },
      openDiag: () => { guard(); releaseAll(); set({ route: 'diag', diag: idleDiag(), diagRunning: false, localStream: null, screenStream: null, sharing: false }); },
      setDx: (k: DiagKey, ok: boolean) => setSt(s => ({ ...s, demo: { ...s.demo, dx: { ...s.demo.dx, [k]: ok } } })),
      setMore: (moreOpen: boolean) => set({ moreOpen }),
      selectDevice: async (kind: DeviceKind, id: string) => {
        const m = pick(), t = nav.current;
        try { await m.selectDevice(kind, id); }
        catch { if (!stale(t)) a.toast('That device couldn’t start. Try another device.'); }
        if (stale(t)) return;
        m.setMic(S.current.micOn && m.hasMic());
        set({ ...mediaState(m), camOn: m.hasCamera(), micOn: S.current.micOn && m.hasMic() });
      },
      startShare: async () => {
        const t = nav.current, m = pick();
        set({ moreOpen: false });
        try {
          await m.startScreenShare();
          if (stale(t) || S.current.route !== 'call') return m.stopScreenShare();
          set({ sharing: true, screenStream: m === real ? real.screenStream() : null, spotlightId: null });
        } catch { if (!stale(t)) a.toast('Screen sharing wasn’t started. You can try again from More options.'); }
      },
      stopShare: () => { pick().stopScreenShare(); set({ sharing: false, screenStream: null, moreOpen: false }); },
      setSpotlight: (id: string | null) => set({ spotlightId: id }),
      sendChat: async () => {
        const s = S.current, text = s.draft.trim(), t = nav.current;
        if (!text || text.length > 4000) return;
        set({ draft: '' });
        try {
          if (LIVE) await live.chat(text);
          if (stale(t)) return;
          const m: ChatMessage = { id: ++msgId.current, fromLocal: true, name: s.name, color: 'amber', text, time: clock() };
          setSt(s => ({ ...s, messages: [...s.messages, m] }));
        } catch {
          if (!stale(t)) { setSt(s => ({ ...s, draft: s.draft || text })); a.toast('Your message wasn’t sent. Please try again.'); }
        }
      },
      incomingChat: () => setSt(s => {
        if (s.route !== 'call' || !s.remotes.length) return s;
        const p = s.remotes[Math.floor(Math.random() * s.remotes.length)];
        const m: ChatMessage = { id: ++msgId.current, fromLocal: false, name: p.displayName, color: p.avatarColor, text: LINES[Math.floor(Math.random() * LINES.length)], time: clock() };
        return { ...s, messages: [...s.messages, m], unread: s.panel === 'chat' ? 0 : s.unread + 1 };
      }),
      setCorner: (corner: Corner) => set({ corner }),
      setDemo: (p: Partial<Demo>) => {
        // Changing how the camera behaves starts from nothing: stop whatever is open.
        if (p.cam !== undefined && p.cam !== S.current.demo.cam) { releaseAll(); set({ localStream: null }); }
        setSt(s => ({ ...s, demo: { ...s.demo, ...p } }));
      },
    };
    return a;
  }, [enterCheck, rooms, set]);

  // Invite links: #r/XXXXXXXX opens straight to validation.
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace(/^#\/?/, '');
      if (h === 'test' || h === 'components') { actions.openDiag(); return; }
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
  if (location.pathname !== '/') { history.replaceState(null, '', '/'); return; }
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
}

/** Plain-language result. Success is only ever reported after the browser confirmed it; cancelling says nothing. */
function shareMessage(what: 'invite' | 'link' | 'code', o: ShareOutcome & { fellBack?: boolean }): ShareMessage | null {
  if (o.kind === 'cancelled') return null;
  if (o.kind === 'shared') return { ok: true, text: 'Invite handed to your share sheet.' };
  if (o.kind === 'copied') {
    if (o.fellBack) return { ok: true, text: 'Sharing isn’t available here, so the link was copied instead. Paste it into the people you want to invite.' };
    return { ok: true, text: what === 'code' ? 'Code copied.' : 'Link copied.' };
  }
  if (what === 'code') return { ok: false, text: 'Couldn’t copy the code. Read it out instead.' };
  if (what === 'link') return { ok: false, text: 'Couldn’t copy the link. Try Copy code, or read the code out.' };
  return { ok: false, text: 'Sharing and copying aren’t available here. Read the room code out instead.' };
}
