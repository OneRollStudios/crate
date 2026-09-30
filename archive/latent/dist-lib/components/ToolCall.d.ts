export type ToolState = 'running' | 'done' | 'error';
export interface ToolCallProps {
    /** Function name, e.g. "retrieve". */
    name: string;
    /** Argument string shown inline, e.g. '"q3_board_deck.pdf"'. */
    args?: string;
    state?: ToolState;
    /** Returned payload preview (rendered in a monospace block). */
    payload?: string;
    className?: string;
}
/**
 * CMP-023 — Tool call.
 * Function name + arguments, a run-state chip and an optional payload preview.
 */
export declare function ToolCall({ name, args, state, payload, className, }: ToolCallProps): import("react").JSX.Element;
