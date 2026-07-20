"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { site } from "@/data/portfolio";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero='brand']", { y: 40, autoAlpha: 0, duration: 1 })
        .from("[data-hero='line']", { y: 28, autoAlpha: 0, duration: 0.8 }, "-=0.55")
        .from("[data-hero='desc']", { y: 20, autoAlpha: 0, duration: 0.7 }, "-=0.45")
        .from("[data-hero='cta']", { y: 16, autoAlpha: 0, duration: 0.6 }, "-=0.4")
        .from("[data-hero='visual']", { scale: 1.06, autoAlpha: 0, duration: 1.1 }, "-=0.9");
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      className="relative min-h-[100svh] overflow-hidden"
      aria-label="Hero"
    >
      <div className="absolute inset-0" data-hero="visual">
        <Image
          src="/images/IMG_1505.JPG"
          alt=""
          fill
          priority
          className="object-cover object-[center_20%] opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(12,18,24,0.35)] via-[rgba(12,18,24,0.55)] to-[var(--bg-deep)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(62,207,186,0.18),transparent_55%)]" />
      </div>

      <div
        className="relative mx-auto flex min-h-[100svh] flex-col justify-end px-5 pb-16 pt-[calc(var(--header-h)+2rem)] sm:pb-24"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <p
          data-hero="brand"
          className="mb-4 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl"
        >
          {site.brand}
        </p>
        <h1
          data-hero="line"
          className="max-w-2xl text-xl font-medium leading-snug tracking-tight text-white/95 sm:text-2xl md:text-3xl"
        >
          {site.headline}
        </h1>
        <p data-hero="desc" className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)] sm:text-base">
          {site.description}
        </p>
        <div data-hero="cta" className="mt-8 flex flex-wrap gap-3">
          <a
            href="#work"
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#06221e] transition hover:brightness-110"
          >
            경력 보기
          </a>
          <a
            href={site.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
          >
            이력서 노션
          </a>
        </div>
      </div>
    </section>
  );
}
