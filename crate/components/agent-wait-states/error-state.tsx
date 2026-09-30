import { AlertCircle, RotateCcw } from "lucide-react";
import { cx, type WaitStateProps } from "./types";

export type ErrorStateProps = WaitStateProps & {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  className,
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className={cx(
        "flex w-full max-w-sm items-center gap-3 rounded-[16px] border border-border bg-background p-3 text-sm shadow-[0_12px_30px_-22px_color-mix(in_srgb,var(--primary)_35%,transparent)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <AlertCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-foreground">{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <RotateCcw className="size-3" aria-hidden="true" /> Retry
        </button>
      ) : null}
    </div>
  );
}

export { ErrorState as Error };
