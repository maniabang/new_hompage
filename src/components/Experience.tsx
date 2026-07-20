"use client";

import { experiences } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MobileCollapse } from "@/components/MobileCollapse";

export function Experience() {
  return (
    <section id="work" className="px-4 py-12 sm:px-5 sm:py-28" aria-labelledby="work-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <h2
            id="work-title"
            className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Work
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--text-soft)] sm:text-base">
            경력과 주요 프로젝트를 케이스 스터디로 정리했습니다.
          </p>
        </ScrollReveal>

        <div className="mt-8 space-y-12 sm:mt-12 sm:space-y-16">
          {experiences.map((exp, companyIndex) => (
            <div key={exp.company} className="relative">
              <div className="sticky top-[calc(var(--header-h)+0.35rem)] z-20 mb-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-deep)_78%,transparent)] px-4 py-3 shadow-[var(--shadow)] backdrop-blur-xl sm:mb-6 sm:px-5 sm:py-4 md:top-[calc(var(--header-h)+0.75rem)]">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                      Case {String(companyIndex + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-2xl">
                      {exp.company}
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--text-soft)]">{exp.role}</p>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-muted)]">{exp.period}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4" data-stagger>
                {exp.projects.map((project, projectIndex) => (
                  <article
                    key={project.title}
                    data-stagger-item
                    data-cursor="drop"
                    className="glass glass-interactive rounded-[var(--radius)] p-4 sm:p-6"
                  >
                    <div className="relative z-[1] flex items-start gap-3">
                      <span className="mt-0.5 font-[family-name:var(--font-display)] text-sm font-bold text-[var(--accent)]">
                        {String(projectIndex + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-semibold tracking-tight sm:text-lg">{project.title}</h4>
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
          ))}
        </div>
      </div>
    </section>
  );
}
