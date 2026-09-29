export type Rating = 'up' | 'down' | null;
export interface FeedbackProps {
    value?: Rating;
    onRate?: (rating: Rating) => void;
    onRegenerate?: () => void;
    onCopy?: () => void;
    className?: string;
}
/**
 * CMP-066 — Feedback + eval.
 * Thumbs up/down, regenerate and copy for inline correction capture.
 */
export declare function Feedback({ value, onRate, onRegenerate, onCopy, className, }: FeedbackProps): import("react").JSX.Element;
