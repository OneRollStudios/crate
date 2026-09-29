export type Theme = 'light' | 'dark';
/**
 * Reads/sets the Latent color mode by stamping `data-theme` on <html>,
 * which the token layer keys off. Persists the user's choice.
 */
export declare function useTheme(): {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
};
