import { site } from "@/data/portfolio";

export function Contact() {
  return (
    <section id="contact" className="px-4 py-16 sm:px-5 sm:py-28" aria-labelledby="contact-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <div
          data-contact-glass
          data-cursor="drop"
          className="contact-glass glass relative rounded-[var(--radius)] px-5 py-9 text-center sm:px-10 sm:py-14"
        >
          <div
            data-contact-shine
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-0"
            style={{
              background:
                "linear-gradient(105deg, transparent 10%, color-mix(in srgb, var(--accent) 28%, transparent) 50%, transparent 90%)",
            }}
            aria-hidden
          />
          <h2
            id="contact-title"
            className="relative z-[1] font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl"
          >
            Contact
          </h2>
          <p className="relative z-[1] mx-auto mt-4 max-w-md text-sm text-[var(--text-soft)] sm:text-base">
            협업·포지션 제안은 언제든 환영합니다.
          </p>
          <div className="relative z-[1] mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* <a href={`mailto:${site.email}`} data-cursor="drop" className="btn-primary btn-email max-w-full">
              {site.email}
            </a> */}
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="drop"
              className="btn-ghost"
            >
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} {site.name}. Built with Next.js · GSAP · Liquid Glass.
        </p>
      </div>
    </section>
  );
}
