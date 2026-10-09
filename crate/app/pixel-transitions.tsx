"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Wraps the docs' client-side page changes (docs to docs, docs to landing) in a
// View Transition, which globals.css turns into a quick pixel dissolve. The
// landing page links to the docs with plain links: those are full page loads
// and get the same dissolve from @view-transition in globals.css. Browsers
// without View Transitions, and reduced motion, keep the plain instant switch.
export function PixelTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  // The new page has rendered: let the transition capture it.
  useEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!location.pathname.startsWith("/docs") || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      // Only other pages of this site: not in-page anchors, not files like /llms.txt.
      if (url.origin !== location.origin || url.pathname === location.pathname || /\.[a-z0-9]+$/i.test(url.pathname)) return;
      event.preventDefault();
      event.stopPropagation();
      document.startViewTransition(() => new Promise<void>((resolve) => {
        settle.current = resolve;
        window.setTimeout(resolve, 1500);
        router.push(url.pathname + url.search + url.hash);
      }));
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
