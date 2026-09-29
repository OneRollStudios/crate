export type StepStatus = 'done' | 'active' | 'pending';
export interface TimelineStep {
    title: string;
    meta?: string;
    status?: StepStatus;
}
export interface AgentTimelineProps {
    steps: TimelineStep[];
    className?: string;
}
/**
 * CMP-044 — Agent timeline.
 * Multi-step run with plan → actions → outcomes and per-step status.
 */
export declare function AgentTimeline({ steps, className }: AgentTimelineProps): import("react").JSX.Element;
