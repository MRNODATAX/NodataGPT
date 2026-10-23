import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeChat — Obrolan dengan asisten AI",
  description:
    "VibeChat: klien chat bergaya WhatsApp dengan penyimpanan JSON dan auto-responder AI berbasis Gemini atau endpoint AI pribadi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d1d7db" },
    { media: "(prefers-color-scheme: dark)", color: "#0b141a" },
  ],
};

/** Terapkan tema sebelum paint agar tidak ada kedipan warna. */
const themeScript = `(function(){try{var t=localStorage.getItem('vibechat-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
