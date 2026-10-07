import { skillGroups } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MobileCollapse } from "@/components/MobileCollapse";

export function Skills() {
  return (
    <section id="skills" className="px-3 py-10 sm:px-5 sm:py-28" aria-labelledby="skills-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <h2
            id="skills-title"
            className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Skills
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--text-soft)] sm:text-base">
            실무에서 반복적으로 검증한 스택과 역할입니다.
          </p>
        </ScrollReveal>

        <div className="mt-7 grid gap-3 md:mt-10 md:grid-cols-2 md:gap-5" data-stagger>
          {skillGroups.map((group) => (
            <div
              key={group.title}
              data-stagger-item
              data-cursor="drop"
              className="glass glass-interactive rounded-[var(--radius)] p-3.5 sm:p-6"
            >
              <h3 className="relative z-[1] font-[family-name:var(--font-display)] text-lg font-semibold sm:text-xl">
                {group.title}
              </h3>

              <div className="relative z-[1] mt-3 flex flex-wrap gap-2 md:hidden" data-skill-chips>
                {group.items.map((item) => (
                  <span key={item.name} data-skill-chip className="chip">
                    {item.name}
                  </span>
                ))}
              </div>

              <div className="relative z-[1] mt-4 hidden flex-wrap gap-2 md:flex" data-skill-chips>
                {group.items.map((item) => (
                  <span key={item.name} data-skill-chip className="chip">
                    {item.name}
                  </span>
                ))}
              </div>

              <MobileCollapse moreLabel="설명 보기" lessLabel="설명 접기">
                <ul className="relative z-[1] mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.name} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                      <div className="text-sm font-semibold text-[var(--text)]">{item.name}</div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </MobileCollapse>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
