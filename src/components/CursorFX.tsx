"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Ripple = {
  el: HTMLSpanElement;
  x: number;
  y: number;
};

export function CursorFX() {
  const blobRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blob = blobRef.current;
    const ring = ringRef.current;
    if (!blob || !ring) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) {
      blob.style.display = "none";
      ring.style.display = "none";
      return;
    }

    document.documentElement.classList.add("has-cursor-fx");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const blobPos = { x: pos.x, y: pos.y };
    const ripples: Ripple[] = [];
    let hovering = false;

    const moveBlob = () => {
      blobPos.x += (pos.x - blobPos.x) * 0.18;
      blobPos.y += (pos.y - blobPos.y) * 0.18;
      gsap.set(blob, { x: blobPos.x, y: blobPos.y });
      gsap.set(ring, { x: pos.x, y: pos.y });
      raf = requestAnimationFrame(moveBlob);
    };
    let raf = requestAnimationFrame(moveBlob);

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest("a, button, .glass-interactive, [data-cursor='drop']");
      hovering = Boolean(interactive);
      gsap.to(blob, {
        scale: hovering ? 1.55 : 1,
        opacity: hovering ? 0.55 : 0.28,
        duration: 0.35,
        ease: "power2.out",
      });
      gsap.to(ring, {
        scale: hovering ? 1.8 : 1,
        opacity: hovering ? 0.9 : 0.45,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const spawnRipple = (x: number, y: number) => {
      const el = document.createElement("span");
      el.className = "cursor-ripple";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      document.body.appendChild(el);
      ripples.push({ el, x, y });

      gsap.fromTo(
        el,
        { scale: 0.2, opacity: 0.55 },
        {
          scale: 2.4,
          opacity: 0,
          duration: 0.75,
          ease: "power2.out",
          onComplete: () => {
            el.remove();
          },
        },
      );
    };

    const onDown = (e: PointerEvent) => {
      spawnRipple(e.clientX, e.clientY);
      gsap.fromTo(blob, { scale: hovering ? 1.2 : 0.85 }, { scale: hovering ? 1.55 : 1, duration: 0.45 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor-fx");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      ripples.forEach((r) => r.el.remove());
    };
  }, []);

  return (
    <>
      <div ref={blobRef} className="cursor-blob" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
    </>
  );
}
