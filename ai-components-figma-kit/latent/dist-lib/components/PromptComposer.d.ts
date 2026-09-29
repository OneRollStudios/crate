import { type ReactNode } from 'react';
export interface PromptComposerProps {
    placeholder?: string;
    /** Called with the trimmed prompt when the user submits. */
    onSubmit?: (value: string) => void;
    /** Controlled value (optional). */
    value?: string;
    onChange?: (value: string) => void;
    /** Disables submit + shows a stop affordance instead. */
    busy?: boolean;
    onStop?: () => void;
    /** Left-aligned toolbar affordances (attach, model chip, slash, …). */
    toolbar?: ReactNode;
    className?: string;
    autoFocus?: boolean;
}
/**
 * CMP-004 — Prompt composer.
 * Auto-growing multiline input with a send/stop state, Enter-to-send
 * (Shift+Enter for newline) and an optional toolbar row.
 */
export declare function PromptComposer({ placeholder, onSubmit, value, onChange, busy, onStop, toolbar, className, autoFocus, }: PromptComposerProps): import("react").JSX.Element;
export interface AttachButtonProps {
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
}
export declare function AttachButton({ label, icon, onClick }: AttachButtonProps): import("react").JSX.Element;
