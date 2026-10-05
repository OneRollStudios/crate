"use client";

import { Clock3 } from "lucide-react";
import { useCrate } from "./crate-provider";
import { cx, type WaitStateProps } from "./types";

export type StalledProps = WaitStateProps & {
  message?: string;
  /** The reply so far. It stays visible above the notice while the stream is quiet. */
  text?: string;
};

export function Stalled({ className, accent = false, message, text, labels }: StalledProps) {
  const { labels: l } = useCrate(labels);
  const notice = (
    <div className={cx("inline-flex items-center gap-2.5 rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-[0_12px_30px_-22px_color-mix(in_srgb,var(--primary)_35%,transparent)]", !text && className)} aria-live="polite">
      <span className={cx("grid size-6 place-items-center rounded-lg bg-muted motion-safe:animate-pulse motion-reduce:opacity-80", accent ? "text-primary" : "text-muted-foreground")} aria-hidden="true"><Clock3 className="size-3.5" /></span>
      {message ?? l.stalled}
    </div>
  );
  if (!text) return notice;
  return (
    <div className={cx("flex flex-col items-start gap-2", className)}>
      <p className="m-0 text-sm leading-7 text-foreground">{text}</p>
      {notice}
    </div>
  );
}
