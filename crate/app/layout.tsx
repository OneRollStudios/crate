import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/manifest.webmanifest",
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
