const nav = [
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Work" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(12,18,24,0.55)] backdrop-blur-xl">
      <div
        className="mx-auto flex h-[var(--header-h)] items-center justify-center gap-4 px-5 sm:justify-between"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-[var(--text-soft)] sm:gap-7">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-cursor="drop"
              className="relative transition-colors hover:text-[var(--text)] after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--accent)] after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
