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
    siteName: site.name,
    locale: "ko_KR",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name} Portfolio` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.description,
    images: ["/twitter-image"],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1218" },
  ],
  colorScheme: "dark light" as const,
  width: "device-width" as const,
  initialScale: 1,
  viewportFit: "cover" as const,
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
    const bg = resolved === 'light' ? '#eef3f7' : '#0c1218';
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.dataset.theme = theme;
    root.style.colorScheme = resolved;
    root.style.backgroundColor = bg;
    if (document.body) document.body.style.backgroundColor = bg;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', bg);
  } catch (_) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#0c1218';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${roboto.variable} ${noto.variable} h-full bg-[var(--bg-deep)] antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh flex flex-col bg-[var(--bg-deep)] font-sans">
        <ThemeProvider>
          <CursorFX />
          <ScrollProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
