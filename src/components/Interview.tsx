"use client";

import { useState } from "react";
import { interviews } from "@/data/portfolio";
import { ScrollReveal } from "@/components/ScrollReveal";

export function Interview() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-4 py-12 sm:px-5 sm:py-28" aria-labelledby="interview-title">
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

        {/* 모바일: 아코디언 */}
        <div className="mt-8 space-y-2 md:hidden" data-stagger>
          {interviews.map((item, i) => {
            const open = openIndex === i;
            return (
              <div
                key={item.q}
                data-stagger-item
                className="glass rounded-[var(--radius)] overflow-hidden"
              >
                <button
                  type="button"
                  data-cursor="drop"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-semibold text-[var(--accent)]">Q. {item.q}</span>
                  <span className="shrink-0 text-[var(--text-muted)]" aria-hidden>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open ? (
                  <p className="border-t border-[var(--line)] px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--text-soft)]">
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 데스크톱: 기존 3열 */}
        <div className="mt-10 hidden gap-4 md:grid md:grid-cols-3" data-stagger>
          {interviews.map((item) => (
            <article
              key={item.q}
              data-stagger-item
              data-cursor="drop"
              className="glass glass-interactive h-full rounded-[var(--radius)] p-5 sm:p-6"
            >
              <h3 className="relative z-[1] text-sm font-semibold text-[var(--accent)]">Q. {item.q}</h3>
              <p className="relative z-[1] mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
