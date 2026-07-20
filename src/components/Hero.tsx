"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>("[data-hero-word]");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-hero='brand']", { y: 56, autoAlpha: 0, duration: 1.1 })
        .from(
          words,
          { y: 28, autoAlpha: 0, rotateX: 40, stagger: 0.045, duration: 0.7 },
          "-=0.55",
        )
        .from("[data-hero='desc']", { y: 22, autoAlpha: 0, duration: 0.7 }, "-=0.35")
        .from("[data-hero='cta'] a", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, "-=0.35")
        .from("[data-hero='visual']", { scale: 1.1, autoAlpha: 0, duration: 1.25 }, "-=1.05");

      gsap.to("[data-hero='visual-img']", {
        yPercent: 22,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to("[data-hero='content']", {
        y: -48,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const headlineWords = site.headline.split(" ");

  return (
    <section id="top" ref={rootRef} className="relative min-h-[100svh] overflow-hidden" aria-label="Hero">
      <div className="absolute inset-0" data-hero="visual">
        <div className="absolute inset-0 overflow-hidden" data-hero="visual-img">
          <Image
            src="/images/IMG_1505.JPG"
            alt=""
            fill
            priority
            className="scale-105 object-cover object-[58%_28%] sm:object-[54%_24%] lg:object-[50%_22%]"
            style={{ opacity: "var(--hero-image-opacity)" }}
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--hero-veil-from), var(--hero-veil-via), var(--bg-deep))",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 35% 35%, var(--hero-glow), transparent 55%)",
          }}
        />
      </div>

      <div
        data-hero="content"
        className="relative mx-auto flex min-h-[100svh] w-full flex-col justify-end px-4 pb-14 pt-[calc(var(--header-h)+1.5rem)] sm:px-5 sm:pb-24"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <p
          data-hero="brand"
          className="hero-brand mb-3 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-[-0.04em] sm:mb-5 sm:text-7xl md:text-[7.5rem] md:leading-[0.95]"
        >
          {site.brand}
        </p>
        <h1 className="max-w-2xl text-lg font-medium leading-snug tracking-tight text-[var(--text)] sm:text-2xl md:text-3xl">
          {headlineWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              data-hero-word
              className="mr-[0.28em] inline-block will-change-transform"
            >
              {word}
            </span>
          ))}
        </h1>
        <p
          data-hero="desc"
          className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-soft)] sm:mt-4 sm:text-base"
        >
          {site.description}
        </p>
        <div data-hero="cta" className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <a href="#work" data-cursor="drop" className="btn-primary">
            경력 보기
          </a>
          <a href="#contact" data-cursor="drop" className="btn-ghost">
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}
