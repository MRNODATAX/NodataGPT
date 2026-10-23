import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeChat — Chat cerdas dengan auto-responder AI",
  description:
    "VibeChat: aplikasi chat bergaya WhatsApp dengan penyimpanan JSON dan auto-responder AI berbasis Gemini atau endpoint AI pribadi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b141a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
