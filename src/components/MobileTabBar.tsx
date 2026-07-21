"use client";

import { useEffect, useState } from "react";
import { navItems } from "@/data/nav";
import { useTheme, type ThemeMode } from "@/components/ThemeProvider";

const themeLabels: Record<ThemeMode, string> = {
  system: "Sys",
  light: "Light",
  dark: "Dark",
};

export function MobileTabBar() {
  const [active, setActive] = useState<string>("work");
  const { theme, cycleTheme } = useTheme();

  useEffect(() => {
    const ids = ["top", ...navItems.map((n) => n.id)];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topMost = visible[0]?.target.id;
        if (topMost && topMost !== "top") setActive(topMost);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="모바일 하단 내비게이션"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch gap-1 rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-strong)] p-1.5 shadow-[var(--shadow)] backdrop-blur-[28px] saturate-[1.45] [-webkit-backdrop-filter:blur(28px)_saturate(1.45)]">
        <a
          href="#top"
          data-cursor="drop"
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 py-2 text-[10px] font-bold tracking-wide text-[var(--text-muted)] transition hover:text-[var(--text)]"
          aria-label="Home"
        >
          <HomeIcon />
          <span>Home</span>
        </a>
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.href}
              href={item.href}
              data-cursor="drop"
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 py-2 text-[10px] font-bold tracking-wide transition ${
                isActive
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_1px_0_var(--glass-highlight)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <NavIcon name={item.id} active={isActive} />
              <span className="truncate">{item.label}</span>
            </a>
          );
        })}
        <button
          type="button"
          data-cursor="drop"
          onClick={cycleTheme}
          aria-label={`테마 변경 (현재: ${themeLabels[theme]})`}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 py-2 text-[10px] font-bold tracking-wide text-[var(--text-muted)] transition hover:text-[var(--text)]"
        >
          <ThemeGlyph theme={theme} />
          <span>{themeLabels[theme]}</span>
        </button>
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 2 : 1.8;
  if (name === "skills") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={stroke} aria-hidden>
        <path d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z" />
        <path d="M12 12 4.5 7.5M12 12l7.5-4.5M12 12v9" />
      </svg>
    );
  }
  if (name === "work") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={stroke} aria-hidden>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  if (name === "projects") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={stroke} aria-hidden>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={stroke} aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  );
}

function ThemeGlyph({ theme }: { theme: ThemeMode }) {
  if (theme === "light") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
