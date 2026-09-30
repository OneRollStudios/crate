import type { ReactNode } from 'react'
import { cn } from '../utils/cn'
import { Button } from './Button'

export interface GuardrailProps {
  title?: string
  children: ReactNode
  onRetry?: () => void
  onLearnMore?: () => void
  className?: string
}

/**
 * CMP-061 — Guardrail / refusal.
 * On-brand safe-completion / refusal pattern with retry affordances.
 */
export function Guardrail({
  title = "I can't help with that",
  children,
  onRetry,
  onLearnMore,
  className,
}: GuardrailProps) {
  return (
    <div className={cn('lt-guard', className)} role="alert">
      <span className="lt-guard__icon" aria-hidden>
        ⚠
      </span>
      <div>
        <div className="lt-guard__title">{title}</div>
        <div className="lt-guard__body">{children}</div>
        {(onRetry || onLearnMore) && (
          <div className="lt-guard__actions">
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                ↻ Rephrase
              </Button>
            )}
            {onLearnMore && (
              <Button variant="ghost" size="sm" onClick={onLearnMore}>
                Why?
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
