export interface Citation {
    /** Source label, e.g. "board-deck.pdf · p.14". */
    label: string;
    /** Hover preview text. */
    preview?: string;
    href?: string;
}
export interface CitationsProps {
    items: Citation[];
    className?: string;
}
/**
 * CMP-027 — Citations.
 * Inline source chips with hover previews.
 */
export declare function Citations({ items, className }: CitationsProps): import("react").JSX.Element;
