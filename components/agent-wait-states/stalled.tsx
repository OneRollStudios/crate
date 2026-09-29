import { Clock3 } from "lucide-react";
import { cx, duoBackground, type WaitStateProps } from "./types";

export type StalledProps = WaitStateProps & { message?: string };

export function Stalled({ className, duotone = false, message = "Still working…" }: StalledProps) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2.5 rounded-[16px] border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-[0_12px_30px_-22px_color-mix(in_srgb,var(--primary)_40%,transparent)]",
        className,
      )}
      aria-live="polite"
    >
      <span
        className="grid size-6 place-items-center rounded-lg bg-muted text-primary motion-safe:animate-pulse motion-reduce:opacity-80"
        style={duotone ? { background: duoBackground, color: "white" } : undefined}
        aria-hidden="true"
      >
        <Clock3 className="size-3.5" />
      </span>
      {message}
    </div>
  );
}
