import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: { icon: "/favicon.svg" },
  title: "Crate | Ready-made components for AI products.",
  description: "Ready-made UI components for AI products. Explore 12 wait states, install with one command, and make every small moment count.",
  openGraph: {
    title: "Crate | Ready-made components for AI products.",
    description: "Ready-made UI components for AI products. Explore 12 wait states, install with one command, and make every small moment count.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
