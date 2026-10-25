import { Banner, Button, StatusRow, Wordmark } from '../components';
import { DIAG_COPY, DIAG_KEYS } from '../services/mockDiagnostics';
import type { AppActions, AppState } from '../state/useApp';

/** The /test page. Results are simulated and labelled as such; it never claims to have tested the network. */
export function Diagnostics({ st, a }: { st: AppState; a: AppActions }) {
  const ran = DIAG_KEYS.some(k => st.diag[k] !== 'idle');
  return (
    <div className="absolute inset-0 flex justify-center overflow-y-auto bg-bg px-[18px] py-7" style={{ backgroundImage: 'var(--cl-backdrop-glow)' }}>
      <div className="flex w-full max-w-[620px] flex-col gap-5">
        <Wordmark />
        <div className="flex flex-col gap-[10px]">
          <h1 className="m-0 font-display text-[36px] font-semibold leading-[1.05] tracking-display text-fg">Connection check</h1>
          <Banner icon="alert" title="Simulated results">This check doesn’t test your network yet. These results are simulated to show what it will look like. A passing relay result here does not mean TURN is configured.</Banner>
        </div>
        <div className="overflow-hidden rounded-lg border border-line">
          {DIAG_KEYS.map(k => {
            const s = st.diag[k];
            return (
              <StatusRow key={k} label={DIAG_COPY[k].label} status={s}>
                {s === 'pass' ? DIAG_COPY[k].pass : s === 'fail' ? DIAG_COPY[k].fail : s === 'running' ? 'Checking…' : 'Press Run check to start.'}
              </StatusRow>
            );
          })}
        </div>
        <p className="text-xs text-fg-3">STUN discovers addresses and does not relay media. TURN is optional and is not configured by default.</p>
        <div className="grid grid-cols-2 gap-[10px]">
          <Button size="phone" onClick={a.runDiag} disabled={st.diagRunning}>{st.diagRunning ? 'Checking…' : ran ? 'Run again' : 'Run check'}</Button>
          <Button size="phone" variant="secondary" onClick={a.goHome}>Home</Button>
        </div>
      </div>
    </div>
  );
}
