import type { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'amber' | 'ghost';
    size?: 'md' | 'sm';
}
export declare function Button({ variant, size, className, ...rest }: ButtonProps): import("react").JSX.Element;
