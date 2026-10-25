import type { AppActions, AppState } from '../state/useApp';
import { ShareBlock } from './ShareBlock';

export function InvitePanelBody({ st, a, phone }: { st: AppState; a: AppActions; phone: boolean }) {
  return (
    <div className="flex flex-col gap-[14px]">
      <p className="m-0 text-sm text-fg-2">Send the link or code to the people you want to invite. {st.remotes.length + 1} of 5 places are taken.</p>
      <ShareBlock st={st} a={a} phone={phone} />
    </div>
  );
}
