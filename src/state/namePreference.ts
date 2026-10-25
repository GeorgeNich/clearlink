const KEY = 'clearlink.name';

/** The only thing remembered between visits. Storage can be blocked, so every access is guarded. */
export const NamePreference = {
  get(): string {
    try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
  },
  set(name: string) {
    try { localStorage.setItem(KEY, name); } catch { /* not remembered; nothing else breaks */ }
  },
};
