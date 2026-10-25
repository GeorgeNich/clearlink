import { Button, Icon, TextInput } from '../components';
import type { AppActions, AppState } from '../state/useApp';
import { Card, HallShell, cardBody, cardTitle } from './Shell';

export function CameraBlocked({ st, a }: { st: AppState; a: AppActions }) {
  return (
    <HallShell>
      <Card>
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-danger-subtle text-danger-text">
          <Icon name="camera-off" size={26} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className={cardTitle}>Camera blocked</h2>
          <p className={cardBody}>
            Your browser isn’t letting Clearlink use the camera. Allow it in your browser’s site
            settings and retry, or join without video. Others will see your initials.
          </p>
        </div>
        <form
          className="flex flex-col gap-[18px]"
          onSubmit={(e) => {
            e.preventDefault();
            a.joinWithoutCamera();
          }}
        >
          <TextInput
            label="Your name"
            placeholder="Your name"
            maxLength={24}
            value={st.name}
            onChange={(e) => a.set({ name: e.target.value })}
          />
          <Button type="submit" block size="phone" disabled={!st.name.trim()}>
            Join without camera
          </Button>
        </form>
        <div className="grid grid-cols-2 gap-[10px]">
          <Button variant="secondary" onClick={() => void a.retryCamera()}>
            Retry camera
          </Button>
          <Button variant="ghost" onClick={a.goHome}>
            Cancel
          </Button>
        </div>
        {st.mediaNote && (
          <span role="status" className="text-xs text-danger-text">
            {st.mediaNote}
          </span>
        )}
        {st.blockedNote && (
          <span role="status" className="text-xs text-danger-text">
            {st.blockedNote}
          </span>
        )}
      </Card>
    </HallShell>
  );
}
