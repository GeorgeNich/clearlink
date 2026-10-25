import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
type Theme = "dark" | "light" | "system";
const Context = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "dark", setTheme: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const t = localStorage.getItem("clearlink.theme");
      return t === "light" || t === "system" ? t : "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved =
        theme === "system" ? (query.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    query.addEventListener("change", apply);
    try {
      localStorage.setItem("clearlink.theme", theme);
    } catch {
      /* Storage may be blocked. */
    }
    return () => query.removeEventListener("change", apply);
  }, [theme]);
  return (
    <Context.Provider value={{ theme, setTheme }}>{children}</Context.Provider>
  );
}
export function ThemeToggle() {
  const { theme, setTheme } = useContext(Context);
  return (
    <button
      className="cl-theme"
      aria-label={
        theme === "light" ? "Switch to dark theme" : "Switch to light theme"
      }
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "◐" : "☼"}
    </button>
  );
}
export function Appearance() {
  const { theme, setTheme } = useContext(Context);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">Appearance</span>
      <div className="cl-appearance" role="group" aria-label="Appearance">
        {(["dark", "light", "system"] as Theme[]).map((t) => (
          <button
            key={t}
            aria-pressed={theme === t}
            onClick={() => setTheme(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
