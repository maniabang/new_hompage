import { site } from "@/data/portfolio";

const nav = [
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(12,18,24,0.55)] backdrop-blur-xl">
      <div
        className="mx-auto flex h-[var(--header-h)] items-center justify-between gap-4 px-5"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <a href="#top" className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
          {site.brand}
        </a>
        <nav className="hidden items-center gap-6 text-sm text-[var(--text-soft)] sm:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-[var(--text)]">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={site.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold tracking-wide text-[var(--text)] transition hover:bg-white/10"
        >
          이력서
        </a>
      </div>
    </header>
  );
}
