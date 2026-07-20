import { site } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";

export function Contact() {
  return (
    <section id="contact" className="px-5 py-20 sm:py-28" aria-labelledby="contact-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <div className="glass rounded-[var(--radius)] px-6 py-10 text-center sm:px-10 sm:py-14" data-cursor="drop">
            <h2
              id="contact-title"
              className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl"
            >
              Contact
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-[var(--text-soft)] sm:text-base">
              협업·포지션 제안은 언제든 환영합니다.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${site.email}`}
                data-cursor="drop"
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#06221e] transition hover:brightness-110"
              >
                {site.email}
              </a>
              <a
                href={site.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="drop"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                GitHub
              </a>
              <a
                href={site.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="drop"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                이력서
              </a>
            </div>
          </div>
        </ScrollReveal>
        <p className="mt-10 text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} {site.name}. Built with Next.js · GSAP · Liquid Glass.
        </p>
      </div>
    </section>
  );
}
