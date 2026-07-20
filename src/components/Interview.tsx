import { interviews } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";

export function Interview() {
  return (
    <section className="px-5 py-20 sm:py-28" aria-labelledby="interview-title">
      <div className="mx-auto" style={{ maxWidth: "var(--page-max)" }}>
        <ScrollReveal>
          <h2
            id="interview-title"
            className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Interview
          </h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--text-soft)] sm:text-base">
            일하는 방식과 집중하는 문제를 짧게 정리했습니다.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {interviews.map((item, i) => (
            <ScrollReveal key={item.q} delay={i * 0.08}>
              <article className="glass glass-interactive h-full rounded-[var(--radius)] p-5 sm:p-6">
                <h3 className="relative z-[1] text-sm font-semibold text-[var(--accent)]">Q. {item.q}</h3>
                <p className="relative z-[1] mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{item.a}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
