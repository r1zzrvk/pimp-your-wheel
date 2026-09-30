import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { meta, SITE_NAME } from "@/components/meta";
import { SoundClicks } from "@/components/sound-clicks";
import "./globals.css";

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const display = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  ...meta(),
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
};

export const viewport: Viewport = {
  themeColor: "#12100c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full antialiased">
        <SoundClicks />
        {children}
      </body>
    </html>
  );
}
