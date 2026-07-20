import { ThemeToggle } from "@/components/ThemeToggle";
import { navItems } from "@/data/nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-xl">
      <div
        className="mx-auto flex h-[var(--header-h)] items-center justify-center px-4 md:justify-between md:px-5"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <a
          href="#top"
          data-cursor="drop"
          className="font-[family-name:var(--font-display)] text-[15px] font-bold tracking-[-0.02em] text-[var(--text)] md:hidden"
        >
          Portfolio
        </a>

        <nav className="hidden items-center gap-10 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-cursor="drop"
              className="group relative font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--text)]/70 transition-colors duration-300 hover:text-[var(--text)]"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 md:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
