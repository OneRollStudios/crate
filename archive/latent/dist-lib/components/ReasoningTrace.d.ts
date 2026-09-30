export interface ReasoningStep {
    label: string;
    /** e.g. "0.4s" — optional per-step timing. */
    duration?: string;
}
export interface ReasoningTraceProps {
    /** Summary line shown collapsed, e.g. "reasoning · reading 42 slides". */
    summary: string;
    steps?: ReasoningStep[];
    /** Is the model still thinking? Shows the pulse. */
    live?: boolean;
    defaultOpen?: boolean;
    className?: string;
}
/**
 * CMP-018 — Reasoning trace.
 * Collapsible chain-of-thought with a live status pulse and per-step timing.
 */
export declare function ReasoningTrace({ summary, steps, live, defaultOpen, className, }: ReasoningTraceProps): import("react").JSX.Element;
