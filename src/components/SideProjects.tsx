import Image from "next/image";
import { sideProjects } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MobileCollapse } from "@/components/MobileCollapse";

export function SideProjects() {
  return (
    <section id="projects" className="px-4 py-12 sm:px-5 sm:py-28" aria-labelledby="projects-title">
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

        <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-8" data-stagger>
          {sideProjects.map((project) => (
            <article
              key={project.title}
              data-stagger-item
              data-cursor="drop"
              className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--chip-bg)] transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)]"
            >
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-4 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
                      {project.title}
                    </h3>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--text-soft)] md:line-clamp-none">
                    {project.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 md:mt-4">
                    {project.stack.slice(0, 4).map((tag) => (
                      <span key={tag} className="chip md:hidden">
                        {tag}
                      </span>
                    ))}
                    {project.stack.map((tag) => (
                      <span key={`d-${tag}`} className="chip hidden md:inline-flex">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="drop"
                    className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline sm:mt-5"
                  >
                    GitHub ↗
                  </a>

                  <MobileCollapse moreLabel="미리보기 더보기" lessLabel="미리보기 접기">
                    <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
                      {project.images.slice(0, 4).map((src) => (
                        <div key={src} className="relative aspect-[9/16] overflow-hidden rounded-xl">
                          <Image src={src} alt="" fill className="object-cover object-top" sizes="160px" />
                        </div>
                      ))}
                    </div>
                  </MobileCollapse>
                </div>

                <div className="hidden grid-cols-2 gap-2 bg-[color-mix(in_srgb,var(--text)_8%,transparent)] p-3 sm:p-4 md:grid">
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
