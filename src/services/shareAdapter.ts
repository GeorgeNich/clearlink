import type { Room } from './types';

export type ShareOutcome =
  | { kind: 'shared' }       // the share sheet completed
  | { kind: 'copied' }       // clipboard write succeeded
  | { kind: 'cancelled' }    // the person closed the share sheet; not an error
  | { kind: 'failed' };      // nothing worked

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the older route */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Share and copy actions. Each resolves only after the browser says it worked. */
export const ShareAdapter = {
  async shareInvite(room: Room): Promise<ShareOutcome & { fellBack?: boolean }> {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Clearlink', text: 'Join me on Clearlink. Room code ' + room.code, url: room.inviteUrl });
        return { kind: 'shared' };
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return { kind: 'cancelled' };
        // any other share error falls through to copying the link
      }
    }
    const ok = await writeClipboard(room.inviteUrl);
    return ok ? { kind: 'copied', fellBack: true } : { kind: 'failed', fellBack: true };
  },
  async copyLink(room: Room): Promise<ShareOutcome> {
    return (await writeClipboard(room.inviteUrl)) ? { kind: 'copied' } : { kind: 'failed' };
  },
  async copyCode(room: Room): Promise<ShareOutcome> {
    return (await writeClipboard(room.code)) ? { kind: 'copied' } : { kind: 'failed' };
  },
};
