import Image from "next/image";
import { sideProjects } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";

export function SideProjects() {
  return (
    <section id="projects" className="px-5 py-20 sm:py-28" aria-labelledby="projects-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <h2
            id="projects-title"
            className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Side Projects
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--text-soft)] sm:text-base">
            서비스 감각과 스택 실험을 이어가는 개인 프로젝트입니다.
          </p>
        </ScrollReveal>

        <div className="mt-10 space-y-8" data-stagger>
          {sideProjects.map((project) => (
            <article
              key={project.title}
              data-stagger-item
              data-cursor="drop"
              className="overflow-hidden rounded-[var(--radius)] border border-white/12 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                      {project.title}
                    </h3>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{project.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.stack.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[var(--text-soft)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="drop"
                    className="mt-5 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                  >
                    GitHub ↗
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-black/20 p-3 sm:p-4">
                  {project.images.slice(0, 4).map((src) => (
                    <div key={src} className="relative aspect-[9/16] overflow-hidden rounded-xl">
                      <Image src={src} alt="" fill className="object-cover object-top" sizes="200px" />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
