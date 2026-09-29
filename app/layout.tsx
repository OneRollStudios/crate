import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Crate — AI wait states that handle themselves",
  description:
    "Open-source React components that follow your AI stream from thinking to done.",
  openGraph: {
    title: "Crate — AI wait states that handle themselves",
    description:
      "Open-source React components that follow your AI stream from thinking to done.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
