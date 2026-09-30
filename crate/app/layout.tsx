import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "crate | ai wait states",
  description: "12 free wait states for ai apps. they switch on their own. one command.",
  openGraph: {
    title: "crate | ai wait states",
    description: "12 free wait states for ai apps. they switch on their own. one command.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
