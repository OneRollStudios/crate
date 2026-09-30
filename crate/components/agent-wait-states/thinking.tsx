import { cx, type WaitStateProps } from "./types";

export type ThinkingProps = WaitStateProps & {
  elapsedMs?: number;
  onCancel?: () => void;
  label?: string;
};

export function Thinking({ className, accent = false, elapsedMs = 0, onCancel, label }: ThinkingProps) {
  const message = label ?? (elapsedMs >= 8000 ? "Still thinking…" : "Thinking…");
  const visibleLabel = elapsedMs >= 2000 || Boolean(label);
  const canCancel = elapsedMs >= 20000 && Boolean(onCancel);

  return (
    <div className={cx("inline-flex min-h-10 items-center gap-3 rounded-[16px] border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-[0_12px_30px_-20px_color-mix(in_srgb,var(--primary)_30%,transparent)]", className)} aria-live="polite" aria-label={message}>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => <span key={index} className={cx("size-1.5 rounded-full motion-safe:animate-bounce motion-reduce:opacity-70", accent ? "bg-primary" : "bg-muted-foreground")} style={{ animationDelay: `${index * 140}ms` }} />)}
      </span>
      {visibleLabel ? <span>{message}</span> : <span className="sr-only">{message}</span>}
      {canCancel ? <button type="button" onClick={onCancel} className="ml-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Cancel</button> : null}
    </div>
  );
}
