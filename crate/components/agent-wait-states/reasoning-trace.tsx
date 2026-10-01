"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx, type WaitStateProps } from "./types";

export type ReasoningTraceProps = WaitStateProps & {
  text?: string;
  done?: boolean;
  durationSeconds?: number;
  defaultOpen?: boolean;
};

export function ReasoningTrace({ className, accent = false, text = "", done = false, durationSeconds = 12, defaultOpen }: ReasoningTraceProps) {
  const [open, setOpen] = useState(defaultOpen ?? !done);
  const label = done ? `Thought for ${durationSeconds}s` : "Show thinking";

  return (
    <div className={cx("w-full max-w-md rounded-sm border border-border bg-background text-sm text-foreground", className)}>
      <button type="button" className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={cx("size-2 rounded-full bg-muted-foreground", accent && !done && "bg-primary motion-safe:animate-pulse")} aria-hidden="true" />
        <span className="flex-1">{label}</span>
        <ChevronDown className={cx("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? <div className="border-t border-border px-4 py-3 leading-6 text-muted-foreground" aria-live="polite">{text || "Working through the details…"}{!done ? <span className={cx("ml-1 inline-block size-1.5 rounded-full motion-safe:animate-pulse", accent ? "bg-primary" : "bg-muted-foreground")} aria-hidden="true" /> : null}</div> : null}
    </div>
  );
}
