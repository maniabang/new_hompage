import type { Metadata } from "next";
import "./workbench.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://kwanghoon.dev"),
  title: "컷 작업실 | theTent",
  description: "컷, 에셋, 프롬프트를 함께 관리하는 제작 작업실",
  robots: { index: false, follow: false },
  referrer: "same-origin",
  icons: { icon: "/brand/thetent-icon.png", apple: "/brand/thetent-icon.png" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
