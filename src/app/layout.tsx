import type { Metadata } from "next";
import { Noto_Sans_KR, Roboto_Mono } from "next/font/google";
import "./workbench.css";
const sans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});
export const metadata: Metadata = {
  metadataBase: new URL("https://kwanghoon.dev"),
  title: "CUT DESK — 제작 작업실",
  description: "컷, 에셋, 프롬프트를 함께 관리하는 제작 작업실",
  robots: { index: false, follow: false },
  referrer: "same-origin",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
