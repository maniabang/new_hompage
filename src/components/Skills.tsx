import { skillGroups } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";

export function Skills() {
  return (
    <section id="skills" className="px-5 py-20 sm:py-28" aria-labelledby="skills-title">
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

        <div className="mt-10 grid gap-5 md:grid-cols-2" data-stagger>
          {skillGroups.map((group) => (
            <div
              key={group.title}
              data-stagger-item
              data-cursor="drop"
              className="glass glass-interactive rounded-[var(--radius)] p-5 sm:p-6"
            >
              <h3 className="relative z-[1] font-[family-name:var(--font-display)] text-xl font-semibold">
                {group.title}
              </h3>
              <ul className="relative z-[1] mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item.name} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
