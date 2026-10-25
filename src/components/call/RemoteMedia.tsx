import { useEffect, useRef, useState } from 'react';
import { Button } from '../core/Button';

/** Audio lives outside the tile layout, so hiding or spotlighting a tile never mutes anyone. */
export function RemoteAudio({ stream, name, speaker }: { stream: MediaStream; name: string; speaker: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [speakerError, setSpeakerError] = useState(false);
  useEffect(() => {
    const audio = ref.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (audio?.setSinkId) void audio.setSinkId(speaker).then(() => setSpeakerError(false)).catch(() => setSpeakerError(true));
  }, [speaker]);
  useEffect(() => {
    const audio = ref.current!;
    audio.srcObject = stream;
    void audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    return () => { audio.srcObject = null; };
  }, [stream]);
  return <><audio ref={ref} autoPlay />{speakerError && <span role="status">Couldn’t use the selected speaker. Choose another in Settings.</span>}{blocked && <Button onClick={() => void ref.current?.play().then(() => setBlocked(false)).catch(() => setBlocked(true))}>Play sound from {name}</Button>}</>;
}
export function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current!; video.srcObject = stream;
    void video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-contain" />;
}
