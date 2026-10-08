"use client";

import { Keyboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

// The docs nav. Each item has a one-key shortcut, shown as a key badge. Keys
// only work outside text fields and without modifier keys, and the toggle
// turns them off (WCAG 2.1.4), remembered in this browser.
const items = [
  { key: "d", label: "Docs", href: "/docs/" },
  { key: "c", label: "Components", href: "/#crates" },
  { key: "a", label: "Agents", href: "/docs/crate-skill/" },
  { key: "g", label: "GitHub", href: "https://github.com/OneRollStudios/crate", external: true },
];

const STORAGE_KEY = "crate-docs-shortcuts";
const listeners = new Set<() => void>();
function readEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}
function setEnabled(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    // Storage can be blocked; the toggle then lasts for this page only.
  }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function DocsNav() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true);

  useEffect(() => {
    if (!enabled) return;
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])")) return;
      const item = items.find((entry) => entry.key === event.key.toLowerCase());
      if (!item) return;
      event.preventDefault();
      if (item.external) window.open(item.href, "_blank", "noopener,noreferrer");
      else window.location.assign(item.href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  return (
    <nav className="docs-nav" aria-label="Docs navigation">
      {items.map((item) => {
        const content = (
          <>
            <kbd aria-hidden="true">{item.key.toUpperCase()}</kbd>
            <span>{item.label}</span>
          </>
        );
        return item.external ? (
          <a key={item.key} href={item.href} target="_blank" rel="noreferrer" aria-keyshortcuts={enabled ? item.key : undefined}>{content}</a>
        ) : (
          <Link key={item.key} href={item.href} aria-keyshortcuts={enabled ? item.key : undefined}>{content}</Link>
        );
      })}
      <button
        type="button"
        className="docs-shortcuts"
        aria-pressed={enabled}
        title={enabled ? "Keyboard shortcuts on" : "Keyboard shortcuts off"}
        onClick={() => setEnabled(!enabled)}
      >
        <Keyboard size={16} aria-hidden="true" />
        <span className="sr-only">Keyboard shortcuts</span>
      </button>
    </nav>
  );
}
