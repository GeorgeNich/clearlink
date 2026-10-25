import type { HTMLAttributes } from "react";
import { IconButton } from "../core/IconButton";
import { UnreadBadge } from "../chat/UnreadBadge";
export interface ControlBarProps extends HTMLAttributes<HTMLDivElement> {
  size?: "phone" | "laptop";
  micOn?: boolean;
  cameraOn?: boolean;
  chatOpen?: boolean;
  inviteOpen?: boolean;
  unread?: number;
  showLabels?: boolean;
  sharing?: boolean;
  settingsOpen?: boolean;
  moreOpen?: boolean;
  onMic?: () => void;
  onCamera?: () => void;
  onChat?: () => void;
  onInvite?: () => void;
  onLeave?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onMore?: () => void;
}
export function ControlBar({
  size = "laptop",
  micOn = true,
  cameraOn = true,
  chatOpen = false,
  inviteOpen = false,
  unread = 0,
  showLabels = false,
  sharing = false,
  settingsOpen = false,
  moreOpen = false,
  onMic,
  onCamera,
  onChat,
  onInvite,
  onLeave,
  onShare,
  onSettings,
  onMore,
  ...rest
}: ControlBarProps) {
  const phone = size === "phone";
  return (
    <div
      role="toolbar"
      aria-label="Call controls"
      className="cl-toolbar"
      {...rest}
    >
      <IconButton
        size={size}
        showLabel={showLabels}
        icon={micOn ? "mic" : "mic-off"}
        label={micOn ? "Mute microphone" : "Unmute microphone"}
        state={micOn ? "default" : "off"}
        aria-pressed={!micOn}
        onClick={onMic}
      />
      <IconButton
        size={size}
        showLabel={showLabels}
        icon={cameraOn ? "camera" : "camera-off"}
        label={cameraOn ? "Turn camera off" : "Turn camera on"}
        state={cameraOn ? "default" : "off"}
        aria-pressed={!cameraOn}
        onClick={onCamera}
      />
      {!phone && onShare && (
        <IconButton
          showLabel={showLabels}
          icon="share-screen"
          label={sharing ? "Stop sharing" : "Share screen"}
          state={sharing ? "active" : "default"}
          aria-pressed={sharing}
          onClick={onShare}
        />
      )}
      {!phone && <span className="cl-divider" />}
      <IconButton
        size={size}
        showLabel={showLabels}
        icon="chat"
        label="Chat"
        state={chatOpen ? "active" : "default"}
        aria-expanded={chatOpen}
        onClick={onChat}
        badge={
          unread > 0 && !chatOpen ? (
            <UnreadBadge
              count={unread}
              style={{ position: "absolute", top: -6, right: -6 }}
            />
          ) : null
        }
      />
      <IconButton
        size={size}
        showLabel={showLabels}
        icon="invite"
        label="Invite"
        state={inviteOpen ? "active" : "default"}
        aria-expanded={inviteOpen}
        onClick={onInvite}
      />
      {phone ? (
        <IconButton
          size={size}
          showLabel={false}
          icon="menu"
          label="More options"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          onClick={onMore}
        />
      ) : (
        onSettings && (
          <IconButton
            showLabel={showLabels}
            icon="settings"
            label="Settings"
            state={settingsOpen ? "active" : "default"}
            aria-expanded={settingsOpen}
            onClick={onSettings}
          />
        )
      )}
      {!phone && <span className="cl-divider" />}
      <IconButton
        size={size}
        showLabel={showLabels}
        icon="leave"
        label="Leave"
        state="leave"
        onClick={onLeave}
      />
    </div>
  );
}
