import { Button, Emblem } from '../components';
import type { AppActions, AppState } from '../state/useApp';
import { Card, HallShell, cardBody, cardTitle } from './Shell';

/** After Leave. Rejoin rechecks the room, so it can still end at "can't find that room". */
export function Ended({ st, a }: { st: AppState; a: AppActions }) {
  return (
    <HallShell>
      <Card ornate>
        <div className="flex flex-col items-center gap-[10px] pt-[6px] text-center">
          <Emblem size={52} />
          <h2 className={cardTitle}>You left the call</h2>
          <p className={cardBody}>Call lasted {st.endedDuration}. Chat from this call has been cleared from this device.</p>
        </div>
        {st.lastRoom && <Button block size="phone" onClick={a.rejoin}>Rejoin {st.lastRoom.room.code}</Button>}
        <Button block variant="secondary" onClick={a.goHome}>Home</Button>
      </Card>
    </HallShell>
  );
}
