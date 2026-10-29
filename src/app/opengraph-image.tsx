import { ImageResponse } from "next/og";

export const alt = "이광훈 — 프론트엔드 개발자 | kwanghoon.dev";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #0c1218 0%, #121c26 48%, #0e1620 100%)",
          color: "#e8eef4",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#3ecfba",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#3ecfba",
            }}
          />
          kwanghoon.dev
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1,
              backgroundImage: "linear-gradient(135deg, #ffffff 20%, #3ecfba 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            이광훈
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, color: "#e8eef4", letterSpacing: -1 }}>
            프론트엔드 개발자
          </div>
          <div style={{ fontSize: 26, color: "#a8b4c0", maxWidth: 820, lineHeight: 1.45 }}>
            실시간 제품의 속도와 구조를 설계합니다
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "#7a8794",
          }}
        >
          <div>Next.js · GSAP · Liquid Glass</div>
          <div style={{ color: "#3ecfba", fontWeight: 700 }}>Portfolio 2026</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
