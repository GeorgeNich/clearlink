import { Button, Spinner } from '../components';
import type { AppActions, AppState } from '../state/useApp';
import { Card, HallShell, cardBody, cardTitle } from './Shell';

/** Shown while checking an invite and while connecting. */
export function Loading({ st, a }: { st: AppState; a: AppActions }) {
  const validating = st.route === 'validating';
  return (
    <HallShell>
      <Card width={400}>
        <div className="flex flex-col items-center gap-[14px] py-[18px] text-center">
          <Spinner size={64} label={validating ? 'Checking the room' : 'Joining'} />
          <h2 className={cardTitle}>
            {validating
              ? 'Checking the room'
              : st.intent === 'create'
                ? 'Creating your room'
                : 'Joining the room'}
          </h2>
          <span className={cardBody} style={{ fontSize: 15 }}>
            {validating ? 'Room ' + st.pendingCode : 'Getting your call ready…'}
          </span>
        </div>
        <Button variant="ghost" onClick={a.goHome}>
          Cancel
        </Button>
      </Card>
    </HallShell>
  );
}
