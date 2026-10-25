import { Button, CodeDisplay, TextInput } from '../components';
import type { AppActions, AppState } from '../state/useApp';

/** Big room code plus Share invite, Copy link and Copy code, with an honest result line underneath. */
export function ShareBlock({ st, a, phone }: { st: AppState; a: AppActions; phone: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <TextInput
        label="Invite link"
        readOnly
        value={st.room?.inviteUrl || ''}
        style={{ minWidth: 0 }}
      />
      <CodeDisplay code={st.room ? st.room.code : ''} size={phone ? 'phone' : 'laptop'} />
      <Button
        icon="share"
        block
        size={phone ? 'phone' : 'laptop'}
        onClick={() => void a.shareInvite()}
      >
        Share invite
      </Button>
      <div className="grid grid-cols-2 gap-[10px]">
        <Button variant="secondary" icon="copy" onClick={() => void a.copyLink()}>
          Copy link
        </Button>
        <Button variant="secondary" icon="copy" onClick={() => void a.copyCode()}>
          Copy code
        </Button>
      </div>
      {/* Always rendered so screen readers announce changes. */}
      <span
        role="status"
        className={
          'min-h-[20px] text-center text-xs ' +
          (st.shareMsg?.ok ? 'text-success' : 'text-danger-text')
        }
      >
        {st.shareMsg?.text}
      </span>
    </div>
  );
}
