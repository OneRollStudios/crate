export interface ModelOption {
    id: string;
    name: string;
    /** Optional sub-label, e.g. "200K · $15/M". */
    meta?: string;
}
export interface ModelPickerProps {
    models: ModelOption[];
    value: string;
    onChange?: (id: string) => void;
    className?: string;
}
/**
 * CMP-031 — Model picker.
 * Segmented model/provider selector with optional context/pricing meta.
 */
export declare function ModelPicker({ models, value, onChange, className, }: ModelPickerProps): import("react").JSX.Element;
