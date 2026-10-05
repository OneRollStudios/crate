"use client";

import { useEffect, useState } from "react";
import { Clock3, Users } from "lucide-react";
import { useCrate } from "./crate-provider";
import { cx, type WaitStateProps } from "./types";

export type QueueProps = WaitStateProps & { variant?: "line" | "rate-limit"; position?: number; retryIn?: number };

export function Queue({ className, accent = false, variant = "line", position, retryIn, labels }: QueueProps) {
  const { labels: l, format } = useCrate(labels);
  const [secondsLeft, setSecondsLeft] = useState(retryIn);
  // A new retryIn restarts the countdown (adjusted during render, not in an effect).
  const [startedFrom, setStartedFrom] = useState(retryIn);
  if (startedFrom !== retryIn) {
    setStartedFrom(retryIn);
    setSecondsLeft(retryIn);
  }
  useEffect(() => {
    if (variant !== "rate-limit" || retryIn === undefined) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => current === undefined ? current : Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryIn, variant]);
  const message = variant === "line"
    ? position === undefined ? l.queueWaiting : l.queuePosition(Math.max(1, position), format)
    : secondsLeft === undefined ? l.rateLimitedUnknown : l.rateLimited(secondsLeft, format);
  const Icon = variant === "line" ? Users : Clock3;
  return <div className={cx("inline-flex items-center gap-3 rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground", className)} aria-live="polite"><span className={cx("grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground", accent && "text-primary")} aria-hidden="true"><Icon className="size-4" /></span><span>{message}</span></div>;
}
