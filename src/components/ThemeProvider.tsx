"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  resolved: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
};

const STORAGE_KEY = "portfolio-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: ThemeMode) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  const bg = resolved === "light" ? "#eef3f7" : "#0c1218";
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.dataset.theme = theme;
  root.style.colorScheme = resolved;
  root.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", bg);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setThemeState(initial);
    const next = resolveTheme(initial);
    setResolved(next);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (theme !== "system") return;
      const next = getSystemTheme();
      setResolved(next);
      applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    setResolved(resolveTheme(next));
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, cycleTheme }),
    [theme, resolved, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
