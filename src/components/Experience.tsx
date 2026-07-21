"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { careerSpan, experiences } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MobileCollapse } from "@/components/MobileCollapse";

gsap.registerPlugin(ScrollTrigger);

export function Experience() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const progress = root.querySelector<HTMLElement>("[data-timeline-progress]");
      if (progress) {
        gsap.fromTo(
          progress,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root.querySelector("[data-timeline]"),
              start: "top 70%",
              end: "bottom 55%",
              scrub: 0.65,
            },
          },
        );
      }

      gsap.utils.toArray<HTMLElement>("[data-timeline-node]").forEach((node) => {
        const dot = node.querySelector<HTMLElement>("[data-timeline-dot]");
        const body = node.querySelector<HTMLElement>("[data-timeline-body]");
        const meta = node.querySelector<HTMLElement>("[data-timeline-meta]");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: node,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });

        if (dot) {
          tl.fromTo(
            dot,
            { scale: 0.35, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2.2)" },
            0,
          );
        }
        if (meta) {
          tl.fromTo(
            meta,
            { autoAlpha: 0, x: -18 },
            { autoAlpha: 1, x: 0, duration: 0.55, ease: "power3.out" },
            0.05,
          );
        }
        if (body) {
          tl.fromTo(
            body,
            { autoAlpha: 0, y: 28 },
            { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" },
            0.12,
          );
        }

        const cards = node.querySelectorAll<HTMLElement>("[data-timeline-card]");
        if (cards.length) {
          tl.fromTo(
            cards,
            { autoAlpha: 0, y: 22, scale: 0.985 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              stagger: 0.08,
              ease: "power2.out",
            },
            0.28,
          );
        }
      });

      gsap.fromTo(
        "[data-timeline-rail] a, [data-timeline-rail] span",
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-timeline-rail]",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="work"
      ref={rootRef}
      className="px-4 py-12 sm:px-5 sm:py-28"
      aria-labelledby="work-title"
    >
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            {careerSpan.label}
          </p>
          <h2
            id="work-title"
            className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Work
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[var(--text-soft)] sm:text-base">
            {careerSpan.from}부터 {careerSpan.to}까지, 회사별 핵심 프로젝트를 타임라인으로
            정리했습니다.
          </p>
        </ScrollReveal>

        {/* At-a-glance career rail */}
        <nav
          data-timeline-rail
          className="timeline-rail mt-8 flex gap-2 overflow-x-auto pb-1 sm:mt-10 sm:flex-wrap sm:overflow-visible"
          aria-label="경력 한눈에 보기"
        >
          {experiences.map((exp, index) => (
            <a
              key={exp.company}
              href={`#career-${index}`}
              data-cursor="drop"
              className="timeline-rail-item shrink-0"
            >
              <span className="timeline-rail-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="timeline-rail-company">{exp.company}</span>
              <span className="timeline-rail-period">{exp.period}</span>
            </a>
          ))}
        </nav>

        <div data-timeline className="timeline relative mt-10 sm:mt-14">
          <div className="timeline-line" aria-hidden>
            <div data-timeline-progress className="timeline-line-progress" />
          </div>

          <ol className="relative space-y-10 sm:space-y-16">
            {experiences.map((exp, companyIndex) => (
              <li
                key={exp.company}
                id={`career-${companyIndex}`}
                data-timeline-node
                className="timeline-node scroll-mt-[calc(var(--header-h)+1rem)]"
              >
                <div data-timeline-dot className="timeline-dot" aria-hidden>
                  <span className="timeline-dot-core" />
                </div>

                <div className="timeline-grid">
                  <aside data-timeline-meta className="timeline-meta">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                      Case {String(companyIndex + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text)] sm:text-base">
                      {exp.period}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{exp.role}</p>
                  </aside>

                  <div data-timeline-body className="timeline-body min-w-0">
                    <header className="mb-4 sm:mb-5">
                      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-2xl">
                        {exp.company}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-soft)] sm:text-[15px]">
                        {exp.focus}
                      </p>
                    </header>

                    <div className="space-y-3 sm:space-y-4">
                      {exp.projects.map((project, projectIndex) => (
                        <article
                          key={project.title}
                          data-timeline-card
                          data-cursor="drop"
                          className="glass glass-interactive rounded-[var(--radius)] p-4 sm:p-6"
                        >
                          <div className="relative z-[1] flex items-start gap-3">
                            <span className="mt-0.5 font-[family-name:var(--font-display)] text-sm font-bold text-[var(--accent)]">
                              {String(projectIndex + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-semibold tracking-tight sm:text-lg">
                                {project.title}
                              </h4>
                              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-soft)] md:line-clamp-none">
                                {project.summary}
                              </p>

                              {project.link ? (
                                <a
                                  href={project.link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-cursor="drop"
                                  className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                                >
                                  {project.link.label} ↗
                                </a>
                              ) : null}

                              <MobileCollapse moreLabel="상세 보기" lessLabel="접기">
                                <p className="mt-3 hidden text-sm leading-relaxed text-[var(--text-soft)] max-md:block md:hidden">
                                  {project.summary}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {project.stack.map((tag) => (
                                    <span key={tag} className="chip">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
                                  {project.achievements.map((item) => (
                                    <li key={item} className="flex gap-2">
                                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                                {project.note ? (
                                  <p className="mt-3 text-xs text-[var(--text-muted)]">{project.note}</p>
                                ) : null}
                              </MobileCollapse>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
