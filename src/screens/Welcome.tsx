import { useState } from 'react';
import { Button, Icon, TextInput, VideoTile, Wordmark } from '../components';
import type { AppActions, AppState } from '../state/useApp';
import { ThemeToggle } from '../state/theme';
interface Props {
  st: AppState;
  a: AppActions;
  phone: boolean;
}
export function Welcome({ st, a }: Props) {
  const [joining, setJoining] = useState(false);
  return (
    <div className="cl-page">
      <header className="cl-header">
        <Wordmark />
        <div className="flex min-h-target items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      {joining ? (
        <main className="flex flex-1 items-center justify-center px-5 pb-12">
          <form
            className="flex w-full max-w-[420px] flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              a.submitCode();
            }}
          >
            <Button
              variant="ghost"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setJoining(false)}
            >
              ← Back
            </Button>
            <div>
              <h1 className="cl-title">Join a room</h1>
              <p className="mt-3 text-fg-2">
                Enter the 8-character code from your invitation. Invite links skip this step.
              </p>
            </div>
            <TextInput
              label="Room code"
              code
              placeholder="XXXX-XXXX"
              value={st.codeInput}
              onChange={(e) => a.onCode(e.target.value)}
              error={st.codeError || undefined}
              hint="Letters and numbers. Dashes are added for you."
            />
            <Button type="submit" block size="phone">
              Continue
            </Button>
            <p className="text-xs text-fg-3">
              Rooms stay open while at least one person is in them.
            </p>
          </form>
        </main>
      ) : (
        <main className="cl-welcome">
          <div className="cl-hero">
            <div>
              <h1>Video calls that start with a link.</h1>
              <p className="cl-lead">
                Create a room, send the link, and talk in your browser. Up to five people per room.
              </p>
              <div className="cl-hero-actions flex gap-3">
                <Button size="phone" icon="camera" onClick={a.startCall}>
                  Create room
                </Button>
                <Button size="phone" variant="secondary" onClick={() => setJoining(true)}>
                  Join room
                </Button>
              </div>
              <div className="cl-facts">
                {['No account needed', 'Nothing to install', 'Self-hostable'].map((t) => (
                  <span key={t}>
                    <Icon name="check" size={17} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="cl-preview" aria-hidden="true">
              <div className="cl-preview-grid">
                {(['Priya Raman', 'Alex Chen', 'Sam Taylor', 'You'] as const).map((name, i) => (
                  <VideoTile
                    key={name}
                    name={name}
                    color={(['rose', 'sage', 'dusk', 'amber'] as const)[i]}
                    cameraOff={i !== 0}
                    micOff={i === 2}
                    size="phone"
                  />
                ))}
              </div>
              <div className="flex justify-center gap-2 pt-3">
                {(['mic', 'camera', 'share-screen', 'leave'] as const).map((icon) => (
                  <span
                    key={icon}
                    className={
                      'flex h-10 w-10 items-center justify-center rounded-md ' +
                      (icon === 'leave' ? 'bg-danger text-white' : 'bg-raised')
                    }
                  >
                    <Icon name={icon} size={19} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}
      <footer className="cl-footer">
        <span>Audio and video use WebRTC, encrypted in transit.</span>
      </footer>
    </div>
  );
}
