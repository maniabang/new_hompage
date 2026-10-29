import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(145deg, #12202c 0%, #0c1218 100%)",
          border: "1px solid rgba(62, 207, 186, 0.35)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#3ecfba",
            letterSpacing: -1,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          K
        </div>
      </div>
    ),
    { ...size },
  );
}
