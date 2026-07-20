"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = Number(el.dataset.parallax || 0.2);
        gsap.to(el, {
          yPercent: speed * 30,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") ?? el,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-fade-up]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>("[data-stagger-item]");
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 36, scale: 0.98 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: group,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      // Skills chips stagger
      gsap.utils.toArray<HTMLElement>("[data-skill-chips]").forEach((group) => {
        const chips = group.querySelectorAll<HTMLElement>("[data-skill-chip]");
        gsap.fromTo(
          chips,
          { autoAlpha: 0, y: 14, scale: 0.92 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.035,
            ease: "power2.out",
            scrollTrigger: {
              trigger: group,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      // Contact glass highlight sweep
      gsap.utils.toArray<HTMLElement>("[data-contact-glass]").forEach((el) => {
        const shine = el.querySelector<HTMLElement>("[data-contact-shine]");
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 36 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
              onEnter: () => {
                if (!shine) return;
                gsap.fromTo(
                  shine,
                  { xPercent: -120, opacity: 0 },
                  { xPercent: 120, opacity: 1, duration: 1.15, ease: "power2.inOut" },
                );
              },
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
