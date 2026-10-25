import { useState } from 'react';
import { Button } from './components';
import { DIAG_COPY, DIAG_KEYS } from './services/mockDiagnostics';
import type { AppActions, AppState, Demo } from './state/useApp';

type Option<K extends keyof Demo> = [Demo[K], string];

/** Demo-mode tool, not part of the live app. Forces the scenarios that are hard to hit by hand. */
export function DemoDrawer({ st, a }: { st: AppState; a: AppActions }) {
  const [open, setOpen] = useState(false);
  const group = <K extends keyof Demo>(title: string, key: K, options: Option<K>[]) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-fg-2">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, label]) => (
          <Button key={String(v)} size="laptop" variant={st.demo[key] === v ? 'primary' : 'secondary'} aria-pressed={st.demo[key] === v}
            onClick={() => a.setDemo({ [key]: v } as Partial<Demo>)}>{label}</Button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="absolute bottom-0 left-3 z-[60] flex flex-col items-start gap-2">
      {open && (
        <div role="region" aria-label="Demo scenarios" className="flex max-h-[70vh] w-[300px] max-w-[calc(100vw-24px)] flex-col gap-4 overflow-y-auto rounded-xl border border-line bg-panel p-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-fg-2">Go to</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={a.goHome}>Welcome</Button>
              <Button variant="secondary" onClick={a.openDiag}>Connection check</Button>
              <Button variant="secondary" onClick={() => { location.hash = '#components'; }}>Welcome screen</Button>
            </div>
          </div>
          {st.route === 'diag' && (
            <div className="flex flex-col gap-2 border-t border-line-subtle pt-3">
              <span className="text-xs font-semibold text-fg-2">Simulated check results</span>
              <div className="flex flex-wrap gap-2">
                {DIAG_KEYS.map(k => (
                  <Button key={k} variant={st.demo.dx[k] ? 'secondary' : 'danger'} aria-pressed={st.demo.dx[k]} onClick={() => a.setDx(k, !st.demo.dx[k])}>
                    {DIAG_COPY[k].label}: {st.demo.dx[k] ? 'passes' : 'fails'}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {group('Camera', 'cam', [['real', 'My camera'], ['simulated', 'Simulated'], ['blocked', 'Blocked']])}
          {group('Invite code finds', 'room', [['ok', 'A room'], ['missing', 'Nothing'], ['full', 'Full']])}
          {group('Connecting', 'connect', [['ok', 'Works'], ['fail', 'Fails']])}
          {group('Already in the room when you join', 'present', [[0, 'Nobody'], [1, 'One'], [2, 'Two'], [3, 'Three'], [4, 'Four']])}
          {st.route === 'call' && (
            <div className="flex flex-col gap-2 border-t border-line-subtle pt-3">
              <span className="text-xs font-semibold text-fg-2">In this call</span>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4].map(n => (
                  <Button key={n} variant={st.remotes.length === n ? 'primary' : 'secondary'} aria-pressed={st.remotes.length === n} onClick={() => a.setRemoteCount(n)}>{n === 0 ? 'Alone' : n + ' here'}</Button>
                ))}
              </div>
              <span className="text-xs font-semibold text-fg-2">Connection</span>
              <div className="flex flex-wrap gap-2">
                {(['healthy', 'weak', 'reconnecting', 'failed'] as const).map(c => (
                  <Button key={c} variant={st.conn === c ? 'primary' : 'secondary'} aria-pressed={st.conn === c} onClick={() => a.setConn(c)}>{c[0].toUpperCase() + c.slice(1)}</Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={a.nextSpeaker}>Next speaker</Button>
                <Button variant="secondary" disabled={st.remotes.length === 0} onClick={a.incomingChat}>Incoming message</Button>
                <Button variant={st.demo.remoteCams ? 'primary' : 'secondary'} aria-pressed={st.demo.remoteCams} onClick={() => a.setRemoteCams(!st.demo.remoteCams)}>Their cameras {st.demo.remoteCams ? 'on' : 'off'}</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Small on purpose: the demo tab stays clear of the call controls. */}
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}
        className="h-5 rounded-t-md border border-b-0 border-line bg-panel px-3 text-xs leading-none text-fg-2 hover:text-fg">
        {open ? 'Hide demo' : 'Demo · simulated'}
      </button>
    </div>
  );
}
