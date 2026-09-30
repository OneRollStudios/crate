import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'amber' | 'ghost'
  size?: 'md' | 'sm'
}

export function Button({
  variant = 'ghost',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'lt-btn',
        variant === 'amber' ? 'lt-btn--amber' : 'lt-btn--ghost',
        size === 'sm' && 'lt-btn--sm',
        className,
      )}
      {...rest}
    />
  )
}
