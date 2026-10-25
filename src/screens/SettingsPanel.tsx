import { Appearance } from "../state/theme";
import { useEffect, useState } from "react";
import type { DeviceKind } from "../services/types";
import type { AppActions, AppState } from "../state/useApp";

const FIELDS: [DeviceKind, string][] = [
  ["camera", "Camera"],
  ["microphone", "Microphone"],
  ["speaker", "Speaker"],
];

/** Level 0–100, measured from your microphone. */
function useMicLevel(stream: MediaStream | null, enabled: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setLevel(0);
      return;
    }
    const audio =
      stream?.getAudioTracks().filter((t) => t.readyState === "live") ?? [];
    if (!audio.length) {
      setLevel(0);
      return;
    }
    // Measure only. The analyser is never connected to the speakers, so you never hear yourself.
    const ctx = new AudioContext();
    void ctx.resume();
    const src = ctx.createMediaStreamSource(new MediaStream(audio));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const t = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) {
        const x = (v - 128) / 128;
        sum += x * x;
      }
      setLevel(Math.min(100, Math.round(Math.sqrt(sum / buf.length) * 400)));
    }, 100);
    return () => {
      clearInterval(t);
      src.disconnect();
      void ctx.close();
    };
  }, [stream, enabled]);
  return level;
}

export function DeviceFields({ st, a }: { st: AppState; a: AppActions }) {
  const unsupported = !("setSinkId" in HTMLMediaElement.prototype);
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold">Devices</legend>
      {FIELDS.map(([kind, label]) => {
        const options = st.deviceOptions[kind];
        return (
          <div key={kind} className="flex flex-col gap-1">
            <label htmlFor={"dev-" + kind} className="text-xs text-fg-2">
              {label}
            </label>
            <select
              id={"dev-" + kind}
              className="cl-input"
              value={st.devices[kind]}
              disabled={!options.length || (kind === "speaker" && unsupported)}
              onChange={(e) => void a.selectDevice(kind, e.target.value)}
            >
              {kind === "speaker" && unsupported ? (
                <option value={st.devices.speaker}>System default</option>
              ) : options.length ? (
                options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))
              ) : (
                <option value="">None found</option>
              )}
            </select>
          </div>
        );
      })}
      {unsupported && (
        <p className="text-xs text-fg-3">
          Sound uses your system output. This browser doesn’t support choosing a
          speaker.
        </p>
      )}
    </fieldset>
  );
}
export function MicMeter({ st }: { st: AppState }) {
  const level = useMicLevel(st.localStream, st.micOn);
  const shown = st.micOn ? level : 0;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-fg-2">
        {st.micOn
          ? "Microphone level"
          : "You’re muted, so others can’t hear you."}
      </span>
      <div
        role="meter"
        aria-label="Microphone level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        className="h-2 overflow-hidden rounded-full bg-sunken"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: shown + "%" }}
        />
      </div>
    </div>
  );
}
export function SettingsPanelBody({ st, a }: { st: AppState; a: AppActions }) {
  return (
    <div className="flex flex-col gap-6">
      <DeviceFields st={st} a={a} />
      <MicMeter st={st} />
      <Appearance />
      <p className="border-t border-line pt-4 text-xs text-fg-3">
        {"Audio and video use WebRTC and are encrypted in transit. Chat passes through the room server and isn’t stored as history. Calls aren’t recorded."}
      </p>
    </div>
  );
}
