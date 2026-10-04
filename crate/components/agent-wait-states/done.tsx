"use client";

import { Check } from "lucide-react";
import { useCrate } from "./crate-provider";
import { cx, type WaitStateProps } from "./types";

export type DoneProps = WaitStateProps & { label?: string };

export function Done({ className, accent = false, label, labels }: DoneProps) {
  const { labels: l } = useCrate(labels);
  return (
    <span className={cx("crate-done inline-flex items-center gap-2 text-sm text-muted-foreground motion-reduce:opacity-70", className)} aria-live="polite">
      <span className={cx("grid size-6 place-items-center rounded-full bg-muted", accent ? "text-primary" : "text-muted-foreground")} aria-hidden="true"><Check className="size-3.5" strokeWidth={2.5} /></span>
      {label ?? l.done}
      <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes crate-done-fade { 0% { opacity: 0 } 18%, 72% { opacity: 1 } 100% { opacity: .25 } } .crate-done { animation: crate-done-fade 2.4s ease both; } }`}</style>
    </span>
  );
}
