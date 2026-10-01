"use client";

import { useEffect, useState } from "react";
import { Clock3, Users } from "lucide-react";
import { cx, type WaitStateProps } from "./types";

export type QueueProps = WaitStateProps & { variant?: "line" | "rate-limit"; position?: number; retryIn?: number };

export function Queue({ className, accent = false, variant = "line", position = 3, retryIn = 20 }: QueueProps) {
  const [value, setValue] = useState(variant === "line" ? position : retryIn);
  useEffect(() => {
    setValue(variant === "line" ? position : retryIn);
    const timer = window.setInterval(() => setValue((current) => Math.max(0, current - 1)), variant === "line" ? 3500 : 1000);
    return () => window.clearInterval(timer);
  }, [position, retryIn, variant]);
  const message = variant === "line" ? `You’re #${Math.max(1, value)} in line` : `Slow down. Try again in ${value}s`;
  const Icon = variant === "line" ? Users : Clock3;
  return <div className={cx("inline-flex items-center gap-3 rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground", className)} aria-live="polite"><span className={cx("grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground", accent && "text-primary")} aria-hidden="true"><Icon className="size-4" /></span><span>{message}</span></div>;
}
