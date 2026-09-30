import type { ReactNode } from 'react';
export interface GuardrailProps {
    title?: string;
    children: ReactNode;
    onRetry?: () => void;
    onLearnMore?: () => void;
    className?: string;
}
/**
 * CMP-061 — Guardrail / refusal.
 * On-brand safe-completion / refusal pattern with retry affordances.
 */
export declare function Guardrail({ title, children, onRetry, onLearnMore, className, }: GuardrailProps): import("react").JSX.Element;
