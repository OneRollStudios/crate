import { cx, duoBackground, type WaitStateProps } from "./types";

export type StreamingProps = WaitStateProps & {
  children?: React.ReactNode;
  text?: string;
};

export function Streaming({ className, duotone = false, children, text }: StreamingProps) {
  return (
    <span
      className={cx("text-sm leading-7 text-foreground", className)}
      aria-live="polite"
      aria-label="Response streaming"
    >
      {children ?? text}
      <span
        aria-hidden="true"
        className="ml-1 inline-block h-[1.05em] w-[3px] translate-y-[2px] rounded-full bg-primary shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_60%,transparent)] motion-safe:animate-pulse motion-reduce:opacity-80"
        style={{ background: duotone ? duoBackground : undefined }}
      />
    </span>
  );
}
