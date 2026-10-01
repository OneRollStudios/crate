"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { cx, type WaitStateProps } from "./types";

export type ApprovalProps = WaitStateProps & {
  title?: string;
  preview: React.ReactNode;
  onAllow?: () => void;
  onDeny?: () => void;
  expiresIn?: number;
};

export function Approval({ className, accent = false, title = "The agent wants to send this email", preview, onAllow, onDeny, expiresIn }: ApprovalProps) {
  const [remaining, setRemaining] = useState(expiresIn);

  useEffect(() => {
    setRemaining(expiresIn);
    if (expiresIn === undefined) return;
    const timer = window.setInterval(() => setRemaining((value) => value === undefined ? value : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [expiresIn]);

  return (
    <div className={cx("w-full max-w-md rounded-sm border border-border bg-background p-4 text-foreground", className)} role="group" aria-label="Approval required">
      <div className="flex items-start gap-3">
        <span className={cx("grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground", accent && "text-primary")} aria-hidden="true"><ShieldCheck className="size-4" /></span>
        <div className="min-w-0 flex-1"><p className="m-0 text-sm font-medium">{title}</p>{remaining !== undefined ? <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">Expires in {remaining}s</p> : null}</div>
      </div>
      <div className="my-3 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{preview}</div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDeny} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Deny</button>
        <button type="button" onClick={onAllow} className={cx("rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", accent && "border-primary bg-primary text-primary-foreground hover:opacity-90")}>Allow</button>
      </div>
    </div>
  );
}
