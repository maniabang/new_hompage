import type { Metadata } from "next";
import { Roboto, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { site } from "@/data/portfolio";
import { CursorFX } from "@/components/CursorFX";
import { ScrollProvider } from "@/components/ScrollProvider";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.role}`,
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.description,
    type: "website",
    images: [{ url: site.ogImage, width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${roboto.variable} ${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CursorFX />
        <ScrollProvider />
        {children}
      </body>
    </html>
  );
}
