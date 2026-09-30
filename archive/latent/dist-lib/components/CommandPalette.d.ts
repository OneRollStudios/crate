import { type ReactNode } from 'react';
export interface Command {
    id: string;
    label: string;
    group?: string;
    icon?: ReactNode;
    hint?: string;
    run?: () => void;
}
export interface CommandPaletteProps {
    commands: Command[];
    open: boolean;
    onClose: () => void;
    placeholder?: string;
    className?: string;
}
/**
 * CMP-057 — Command palette.
 * ⌘K-style launcher with fuzzy-ish filtering, grouped results,
 * full keyboard navigation and an accessible overlay.
 */
export declare function CommandPalette({ commands, open, onClose, placeholder, className, }: CommandPaletteProps): import("react").JSX.Element | null;
/**
 * Convenience hook: binds ⌘K / Ctrl+K to toggle a palette.
 */
export declare function useCommandPalette(): {
    open: boolean;
    setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    close: () => void;
};
