import { experiences } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";

export function Experience() {
  return (
    <section id="work" className="px-5 py-20 sm:py-28" aria-labelledby="work-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <h2
            id="work-title"
            className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Work
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--text-soft)] sm:text-base">
            경력과 주요 프로젝트를 시간순으로 정리했습니다.
          </p>
        </ScrollReveal>

        <div className="mt-12 space-y-14">
          {experiences.map((exp) => (
            <div key={exp.company}>
              <ScrollReveal>
                <div className="mb-6 flex flex-col gap-1 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{exp.company}</h3>
                    <p className="mt-1 text-sm text-[var(--text-soft)]">{exp.role}</p>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{exp.period}</p>
                </div>
              </ScrollReveal>

              <div className="space-y-4" data-stagger>
                {exp.projects.map((project) => (
                  <article
                    key={project.title}
                    data-stagger-item
                    data-cursor="drop"
                    className="glass glass-interactive rounded-[var(--radius)] p-5 sm:p-6"
                  >
                    <h4 className="relative z-[1] text-lg font-semibold tracking-tight">{project.title}</h4>
                    <p className="relative z-[1] mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
                      {project.summary}
                    </p>
                    <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
                      {project.stack.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[var(--text-soft)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <ul className="relative z-[1] mt-4 space-y-2 text-sm text-[var(--text-muted)]">
                      {project.achievements.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {project.note ? (
                      <p className="relative z-[1] mt-3 text-xs text-[var(--text-muted)]">{project.note}</p>
                    ) : null}
                    {project.link ? (
                      <a
                        href={project.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="drop"
                        className="relative z-[1] mt-4 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                      >
                        {project.link.label} ↗
                      </a>
                    ) : null}
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
