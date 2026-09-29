export interface TokenMeterProps {
    used: number;
    max: number;
    label?: string;
    /** Fraction (0–1) above which the bar turns to a warning color. */
    warnAt?: number;
    /** Optional cost readout, e.g. "$0.04". */
    cost?: string;
    className?: string;
}
/**
 * CMP-038 — Token / usage meter.
 * Context fill with a warning threshold and optional cost readout.
 */
export declare function TokenMeter({ used, max, label, warnAt, cost, className, }: TokenMeterProps): import("react").JSX.Element;
