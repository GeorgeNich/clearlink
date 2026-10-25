import { Button, LocalVideo, TextInput, VideoTile, Wordmark, hasLiveVideo } from '../components';
import type { AppActions, AppState } from '../state/useApp';
import { DeviceFields, MicMeter } from './SettingsPanel';
export function CameraCheck({ st, a, phone }: { st: AppState; a: AppActions; phone: boolean }) {
  const create = st.intent === 'create';
  return (
    <div className="cl-page">
      <header className="cl-header">
        <Wordmark />
        <Button variant="ghost" onClick={a.goHome}>
          Cancel
        </Button>
      </header>
      <main className="cl-setup">
        <div className="flex flex-col gap-4">
          <div className="cl-setup-preview">
            <VideoTile
              name={st.name.trim() || 'You'}
              color="amber"
              cameraOff={!st.camOn}
              micOff={!st.micOn}
              size={phone ? 'phone' : 'laptop'}
            >
              {hasLiveVideo(st.localStream) ? <LocalVideo stream={st.localStream} /> : undefined}
            </VideoTile>
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3">
              <Button
                variant={st.micOn ? 'secondary' : 'danger'}
                icon={st.micOn ? 'mic' : 'mic-off'}
                iconOnly
                aria-label={st.micOn ? 'Mute microphone' : 'Unmute microphone'}
                aria-pressed={!st.micOn}
                onClick={a.toggleMic}
              />
              <Button
                variant={st.camOn ? 'secondary' : 'danger'}
                icon={st.camOn ? 'camera' : 'camera-off'}
                iconOnly
                aria-label={st.camOn ? 'Turn camera off' : 'Turn camera on'}
                aria-pressed={!st.camOn}
                onClick={() => void a.toggleCam()}
              />
            </div>
          </div>
          <MicMeter st={st} />
          {st.mediaNote && (
            <p role="status" className="rounded-md bg-danger-subtle p-3 text-sm text-danger-text">
              {st.mediaNote}
            </p>
          )}
        </div>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void a.confirmEntry();
          }}
        >
          <span className="cl-tag">{create ? 'New room' : 'Invitation · ' + st.pendingCode}</span>
          <div>
            <h1 className="cl-title">{create ? 'Set up your call' : 'Ready to join?'}</h1>
            <p className="mt-3 text-fg-2">
              {create
                ? 'Check your camera and microphone. Your room is created when you continue.'
                : 'Check how you look and sound before going in.'}
            </p>
          </div>
          <TextInput
            label="Your name"
            placeholder="Enter your name"
            maxLength={24}
            value={st.name}
            onChange={(e) => a.set({ name: e.target.value })}
            hint={
              'Shown to others in the call.' +
              (st.remembered && st.name === st.remembered ? ' Remembered on this device.' : '')
            }
          />
          <DeviceFields st={st} a={a} />
          <Button type="submit" block size="phone" disabled={!st.name.trim()}>
            {create ? 'Create room' : 'Join room'}
          </Button>
          <p className="text-xs text-fg-3">
            {create
              ? 'You’ll get a link and code to share once the room is open.'
              : 'You can change devices at any time during the call.'}
          </p>
        </form>
      </main>
    </div>
  );
}
