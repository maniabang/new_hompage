"use client";

import { useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  moreLabel?: string;
  lessLabel?: string;
  className?: string;
};

/** 모바일에서만 접고, md 이상에서는 항상 펼침 */
export function MobileCollapse({
  children,
  moreLabel = "자세히 보기",
  lessLabel = "접기",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <div className={open ? "block" : "hidden md:block"}>{children}</div>
      <button
        type="button"
        data-cursor="drop"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[1] mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline md:hidden"
      >
        {open ? lessLabel : moreLabel}
        <span aria-hidden className="text-xs">
          {open ? "▴" : "▾"}
        </span>
      </button>
    </div>
  );
}
