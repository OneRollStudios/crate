import type { ReactNode } from 'react';
export interface ConversationThreadProps {
    /** Optional window chrome path label, e.g. "latent://playground". */
    path?: string;
    children: ReactNode;
    /** Footer slot — typically a PromptComposer + TokenMeter. */
    footer?: ReactNode;
    className?: string;
    /** Fixed height for the scrolling thread area. */
    threadHeight?: number | string;
}
/**
 * A composite shell that frames a message thread with window chrome and
 * a pinned footer — the "conversation" surface primitives live inside.
 */
export declare function ConversationThread({ path, children, footer, className, threadHeight, }: ConversationThreadProps): import("react").JSX.Element;
export interface MessageProps {
    role: 'user' | 'ai';
    children: ReactNode;
    className?: string;
}
/** A single message bubble within a ConversationThread. */
export declare function Message({ role, children, className }: MessageProps): import("react").JSX.Element;
