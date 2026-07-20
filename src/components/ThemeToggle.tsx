"use client";

import { useTheme, type ThemeMode } from "@/components/ThemeProvider";

const labels: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      data-cursor="drop"
      aria-label={`테마 변경 (현재: ${labels[theme]})`}
      title={`Theme: ${labels[theme]}`}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--chip-bg-hover)]"
    >
      <span className="relative h-3.5 w-3.5" aria-hidden>
        {theme === "light" ? (
          <SunIcon />
        ) : theme === "dark" ? (
          <MoonIcon />
        ) : (
          <SystemIcon />
        )}
      </span>
      <span className="hidden sm:inline">{labels[theme]}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
