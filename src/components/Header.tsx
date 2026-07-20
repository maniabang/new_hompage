import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Work" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-xl">
      <div
        className="mx-auto flex h-[var(--header-h)] items-center gap-3 px-4 sm:gap-4 sm:px-5"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-4 overflow-x-auto px-1 text-sm text-[var(--text-soft)] [scrollbar-width:none] sm:gap-7 [&::-webkit-scrollbar]:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-cursor="drop"
              className="relative shrink-0 transition-colors hover:text-[var(--text)] after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--accent)] after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
