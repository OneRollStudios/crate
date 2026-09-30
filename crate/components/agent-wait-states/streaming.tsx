import { cx, type WaitStateProps } from "./types";

export type StreamingProps = WaitStateProps & { children?: React.ReactNode; text?: string };

export function Streaming({ className, accent = false, children, text }: StreamingProps) {
  return (
    <span className={cx("text-sm leading-7 text-foreground", className)} aria-live="polite" aria-label="Response streaming">
      {children ?? text}
      <span aria-hidden="true" className={cx("ml-1 inline-block h-[1.05em] w-[3px] translate-y-[2px] rounded-full motion-safe:animate-pulse motion-reduce:opacity-80", accent ? "bg-primary shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_60%,transparent)]" : "bg-foreground")} />
    </span>
  );
}
