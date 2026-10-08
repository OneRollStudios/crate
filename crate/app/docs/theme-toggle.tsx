"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

// Light by default. The choice is stored per visitor in localStorage, and the
// docs layout applies it before the page paints. If storage is blocked, the
// toggle still works for the current page.
export const THEME_KEY = "crate-docs-theme";
const listeners = new Set<() => void>();

const read = () => (document.documentElement.dataset.docsTheme === "dark" ? "dark" : "light");
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function setTheme(theme: "light" | "dark") {
  if (theme === "dark") document.documentElement.dataset.docsTheme = "dark";
  else delete document.documentElement.dataset.docsTheme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the theme lasts until the next page load.
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light");
  // After a client-side navigation into the docs, the layout's inline script
  // hasn't run, so apply the saved choice here too.
  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === "dark" && read() !== "dark") setTheme("dark");
    } catch {
      // Storage blocked: stay light.
    }
  }, []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="docs-theme-toggle" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
