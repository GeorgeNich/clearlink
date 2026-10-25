import { cleanCode, formatCode } from '../lib/code';
import type { Participant, Room, ValidateResult } from './types';

type Signal = { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; restart?: boolean };
type Peer = { pc: RTCPeerConnection; person: Participant; stream: MediaStream; queue: Promise<void>; candidates: RTCIceCandidateInit[]; timer?: ReturnType<typeof setTimeout> };
type Event = { type: 'joined' | 'state'; person: Participant } | { type: 'left'; id: string } | { type: 'signal'; from: string; signal: Signal } | { type: 'chat'; person: Participant; text: string };
export const LIVE = !new URLSearchParams(location.search).has('demo');

/** One peer connection per participant. Server handles membership/signalling and transient chat only. */
export class LiveRoomService {
  private token = '';
  private id = '';
  private generation = 0;
  private peers = new Map<string, Peer>();
  private iceServers: RTCIceServer[] = [];
  private media: MediaStream | null = null;
  private polling = false;
  private pollAbort?: AbortController;
  private mic = false;
  private camera = false;
  private signalHealthy = true;
  onPeople: (people: Participant[]) => void = () => {};
  onChat: (person: Participant, text: string) => void = () => {};
  onConnection: (state: 'healthy' | 'reconnecting' | 'failed') => void = () => {};

  private async request(path: string, body?: unknown, token = this.token, signal?: AbortSignal) {
    // no-store skips the HTTP cache, whose per-URL lock otherwise stalls a second tab's long-poll for up to 20s.
    const res = await fetch('/api/' + path, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: signal ?? AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error('Room service unavailable (' + res.status + ')');
    return res.json();
  }
  async validateRoom(code: string): Promise<ValidateResult> { return (await this.request('room?code=' + cleanCode(code))).status; }
  async enter(intent: 'create' | 'join', code: string, name: string, stream: MediaStream | null, mic: boolean, camera: boolean): Promise<{ status: 'ok'; room: Room } | { status: 'missing' | 'full' | 'failed' }> {
    this.leave();
    const generation = this.generation;
    try {
      const result = await this.request('session', { intent, code: cleanCode(code), name, mic, camera });
      if (generation !== this.generation) { if (result.token) void this.request('leave', {}, result.token).catch(() => {}); return { status: 'failed' }; }
      if (result.status !== 'ok') return { status: result.status };
      this.token = result.token; this.id = result.id; this.iceServers = result.iceServers;
      this.media = stream; this.mic = mic; this.camera = camera; this.signalHealthy = true;
      for (const person of result.peers) this.addPeer(person);
      void this.poll(generation);
      const formatted = formatCode(result.code);
      return { status: 'ok', room: { code: formatted, inviteUrl: (result.inviteOrigin || location.origin) + '/#r/' + result.code, capacity: 5 } };
    } catch { if (generation === this.generation) this.leave(); return { status: 'failed' }; }
  }
  people() { return [...this.peers.values()].map(p => ({ ...p.person, stream: p.stream })); }
  private emitPeople() { this.onPeople(this.people()); }
  private connection() {
    const states = [...this.peers.values()].map(p => p.pc.connectionState);
    this.onConnection(!this.signalHealthy || states.includes('failed') ? 'failed' : states.some(s => s !== 'connected') ? 'reconnecting' : 'healthy');
  }
  private enqueue(p: Peer, fn: () => Promise<void>) {
    p.queue = p.queue.then(async () => { if (p.pc.signalingState !== 'closed') await fn(); }).catch(() => {
      if (p.pc.signalingState !== 'closed') this.onConnection('failed');
    });
  }
  private async send(id: string, signal: Signal) { await this.request('signal', { to: id, signal }); }
  private async attach(p: Peer) {
    for (const t of p.pc.getTransceivers()) {
      t.direction = 'sendrecv';
      const kind = t.receiver.track.kind;
      const track = this.media?.getTracks().find(t => t.kind === kind && t.readyState === 'live') ?? null;
      await t.sender.replaceTrack(track);
    }
  }
  private addPeer(person: Participant) {
    if (this.peers.has(person.id)) return;
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    const p: Peer = { pc, person, stream: new MediaStream(), queue: Promise.resolve(), candidates: [] };
    this.peers.set(person.id, p);
    pc.ontrack = ({ track }) => {
      if (!p.stream.getTracks().some(t => t.id === track.id)) p.stream.addTrack(track);
      track.onunmute = () => this.emitPeople();
      this.emitPeople();
    };
    pc.onicecandidate = ({ candidate }) => { if (candidate) void this.send(person.id, { candidate: candidate.toJSON() }).catch(() => { if (pc.signalingState !== 'closed') this.onConnection('failed'); }); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') clearTimeout(p.timer);
      this.connection();
    };
    p.timer = setTimeout(() => { if (pc.connectionState !== 'connected' && pc.connectionState !== 'closed') this.onConnection('failed'); }, 30000);
    // Stable ordering gives each pair exactly one offerer, avoiding offer collisions.
    if (this.id < person.id) {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });
      this.enqueue(p, () => this.offer(p));
    }
    this.emitPeople();
  }
  private async offer(p: Peer, restart = false) {
    if (p.pc.signalingState !== 'stable') return;
    await this.attach(p);
    await p.pc.setLocalDescription(await p.pc.createOffer({ iceRestart: restart }));
    await this.send(p.person.id, { description: p.pc.localDescription!.toJSON() });
  }
  private async handle(event: Event) {
    if (event.type === 'joined') this.addPeer(event.person);
    else if (event.type === 'left') {
      const p = this.peers.get(event.id);
      if (p) { clearTimeout(p.timer); p.pc.close(); this.peers.delete(event.id); }
      this.emitPeople(); this.connection();
    } else if (event.type === 'state') {
      const p = this.peers.get(event.person.id);
      if (p) { p.person = event.person; this.emitPeople(); }
    } else if (event.type === 'chat') this.onChat(event.person, event.text);
    else if (event.type === 'signal') {
      const p = this.peers.get(event.from);
      if (!p) return;
      this.enqueue(p, async () => {
        const s = event.signal;
        if (s.restart && this.id < event.from) await this.offer(p, true);
        if (s.description) {
          await p.pc.setRemoteDescription(s.description);
          if (s.description.type === 'offer') {
            await this.attach(p);
            await p.pc.setLocalDescription(await p.pc.createAnswer());
            await this.send(event.from, { description: p.pc.localDescription!.toJSON() });
          }
          for (const c of p.candidates.splice(0)) await p.pc.addIceCandidate(c);
        }
        if (s.candidate) {
          if (p.pc.remoteDescription) await p.pc.addIceCandidate(s.candidate);
          else p.candidates.push(s.candidate);
        }
      });
    }
  }
  private async poll(generation: number) {
    if (this.polling) return;
    this.polling = true;
    const controller = new AbortController(); this.pollAbort = controller;
    try {
      while (this.token && generation === this.generation) {
        const events: Event[] = await this.request('events', undefined, this.token, AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]));
        if (generation !== this.generation) return;
        for (const event of events) await this.handle(event);
        this.signalHealthy = true;
        this.connection();
      }
    } catch { if (generation === this.generation) { this.signalHealthy = false; this.onConnection('failed'); } }
    finally { if (this.pollAbort === controller) this.polling = false; }
  }
  updateMedia(stream: MediaStream | null, mic: boolean, camera: boolean) {
    this.media = stream; this.mic = mic; this.camera = camera;
    if (!this.token) return;
    for (const p of this.peers.values()) this.enqueue(p, () => this.attach(p));
    void this.request('state', { mic, camera }).catch(() => { if (this.token) this.onConnection('failed'); });
  }
  async chat(text: string) { await this.request('chat', { text }); }
  retry() {
    if (!this.token) return this.onConnection('failed');
    this.signalHealthy = true; this.onConnection('reconnecting');
    void this.poll(this.generation);
    for (const p of this.peers.values()) this.enqueue(p, async () => {
      if (this.id < p.person.id) await this.offer(p, true);
      else await this.send(p.person.id, { restart: true });
    });
    this.updateMedia(this.media, this.mic, this.camera);
    for (const p of this.peers.values()) {
      clearTimeout(p.timer);
      p.timer = setTimeout(() => { if (p.pc.connectionState !== 'connected' && p.pc.connectionState !== 'closed') this.onConnection('failed'); }, 30000);
    }
  }
  leave() {
    const token = this.token;
    this.generation++; this.token = ''; this.pollAbort?.abort(); this.pollAbort = undefined; this.polling = false;
    for (const p of this.peers.values()) { clearTimeout(p.timer); p.pc.close(); }
    this.peers.clear(); this.media = null;
    if (token) void fetch('/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: '{}', keepalive: true }).catch(() => {});
  }
}
