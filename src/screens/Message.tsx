import type { ReactNode } from 'react';
import { Card, HallShell, cardBody, cardTitle } from './Shell';

/** A calm one-message card: what happened, then what to do. */
export function Message({ title, children, actions, top }: { title: string; children: ReactNode; actions: ReactNode; top?: ReactNode }) {
  return (
    <HallShell>
      <Card>
        {top}
        <div className="flex flex-col gap-2"><h2 className={cardTitle}>{title}</h2><div className={cardBody}>{children}</div></div>
        <div className="flex flex-col gap-[10px]">{actions}</div>
      </Card>
    </HallShell>
  );
}
