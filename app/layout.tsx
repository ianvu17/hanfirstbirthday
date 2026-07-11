import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro } from "next/font/google";

import "./globals.css";

const display = Baloo_2({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  display: "swap"
});

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "WHO IS TURNING ONE?!",
  description: "Han Birthday Experience scaffold"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
