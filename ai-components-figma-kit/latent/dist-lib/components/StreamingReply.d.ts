export interface StreamingReplyProps {
    /** Full text to reveal token-by-token. */
    text: string;
    /** ms per character (jittered). Set 0 to render instantly. */
    speed?: number;
    /** Show the blinking caret while streaming. */
    caret?: boolean;
    /** Loop the animation (handy for demos). */
    loop?: boolean;
    /** Pause before restarting a loop, ms. */
    loopDelay?: number;
    onDone?: () => void;
    className?: string;
}
/**
 * CMP-011 — Streaming reply.
 * Reveals text progressively with a caret; respects reduced-motion
 * (renders the full text at once) and can loop for showcase use.
 */
export declare function StreamingReply({ text, speed, caret, loop, loopDelay, onDone, className, }: StreamingReplyProps): import("react").JSX.Element;
