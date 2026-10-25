import { useEffect, useRef } from "react";
import { Button, ChatBubble, TextInput } from "../components";
import type { AppActions, AppState } from "../state/useApp";

export function ChatPanelBody({ st }: { st: AppState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [st.messages.length]);
  return (
    <div ref={ref} className="flex h-full flex-col gap-4 overflow-y-auto">
      <span className="text-center text-xs text-fg-3">
        Only people in the call now see messages. Chat clears when you leave.
      </span>
      {st.messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <h3 className="text-lg font-semibold">No messages yet</h3>
          <p className="text-sm text-fg-2">
            Messages go to people here now. They aren’t saved as history, and
            anyone who joins later won’t see earlier messages.
          </p>
        </div>
      )}
      {st.messages.map((m) => (
        <ChatBubble
          key={m.id}
          self={m.fromLocal}
          name={m.name}
          color={m.color}
          time={m.time}
        >
          {m.text}
        </ChatBubble>
      ))}
    </div>
  );
}

/** On laptop the box takes focus when chat opens, so you can type straight away. On phone it doesn't, to avoid an unasked keyboard. */
export function Composer({
  st,
  a,
  phone,
}: {
  st: AppState;
  a: AppActions;
  phone: boolean;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        a.sendChat();
      }}
    >
      <TextInput
        maxLength={4000}
        autoFocus={!phone}
        aria-label="Write a message"
        placeholder="Write a message"
        value={st.draft}
        onChange={(e) => a.set({ draft: e.target.value })}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Button
        type="submit"
        icon="send"
        iconOnly
        size="phone"
        aria-label="Send"
        disabled={!st.draft.trim()}
      />
    </form>
  );
}
