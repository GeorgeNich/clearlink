import { useEffect, useRef } from 'react';

/** True when the stream carries a live camera track worth showing. */
export function hasLiveVideo(stream: MediaStream | null): stream is MediaStream {
  return !!stream && stream.getVideoTracks().some(t => t.readyState === 'live');
}

/**
 * Your own camera, mirrored like a mirror. Always muted: this is only a preview of you, so your microphone
 * is never played back through the speakers.
 */
export function LocalVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.srcObject = stream;
    void v.play().catch(() => { /* autoplay can be refused; the next user action will start it */ });
    return () => { v.srcObject = null; };
  }, [stream]);
  return <video ref={ref} muted playsInline autoPlay aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />;
}
