import type { Metadata } from "next";
import { Roboto, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { site } from "@/data/portfolio";
import { CursorFX } from "@/components/CursorFX";
import { ScrollProvider } from "@/components/ScrollProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  metadataBase: new URL("https://kwanghoon.dev"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon" }],
  },
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.description,
    type: "website",
    url: "https://kwanghoon.dev",
    images: [{ url: site.ogImage, width: 1200, height: 630 }],
  },
};

const themeInitScript = `
(() => {
  try {
    const key = 'portfolio-theme';
    const stored = localStorage.getItem(key);
    const theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.dataset.theme = theme;
    root.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${roboto.variable} ${noto.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <CursorFX />
          <ScrollProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
