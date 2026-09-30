export interface DiffLine {
    type: 'add' | 'del' | 'ctx';
    text: string;
}
export interface DiffSuggestionProps {
    title?: string;
    lines: DiffLine[];
    onAccept?: () => void;
    onReject?: () => void;
    className?: string;
}
/**
 * CMP-052 — Diff / suggestion.
 * Accept-reject block for an AI-proposed edit.
 */
export declare function DiffSuggestion({ title, lines, onAccept, onReject, className, }: DiffSuggestionProps): import("react").JSX.Element;
