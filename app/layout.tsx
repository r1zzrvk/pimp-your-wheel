import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
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
  title: "Pimp your wheel",
  description: "Крути рулетку, копи монеты и собирай свою рулетку.",
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
