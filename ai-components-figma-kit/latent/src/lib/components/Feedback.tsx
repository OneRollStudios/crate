import { useState } from 'react'
import { cn } from '../utils/cn'

export type Rating = 'up' | 'down' | null

export interface FeedbackProps {
  value?: Rating
  onRate?: (rating: Rating) => void
  onRegenerate?: () => void
  onCopy?: () => void
  className?: string
}

/**
 * CMP-066 — Feedback + eval.
 * Thumbs up/down, regenerate and copy for inline correction capture.
 */
export function Feedback({
  value,
  onRate,
  onRegenerate,
  onCopy,
  className,
}: FeedbackProps) {
  const [internal, setInternal] = useState<Rating>(null)
  const rating = value !== undefined ? value : internal

  const rate = (r: Rating) => {
    const next = rating === r ? null : r
    if (value === undefined) setInternal(next)
    onRate?.(next)
  }

  return (
    <div className={cn('lt-feedback', className)}>
      <button
        className="lt-fb-btn"
        aria-pressed={rating === 'up'}
        aria-label="Good response"
        onClick={() => rate('up')}
        type="button"
      >
        ▲ good
      </button>
      <button
        className="lt-fb-btn"
        aria-pressed={rating === 'down'}
        aria-label="Bad response"
        onClick={() => rate('down')}
        type="button"
      >
        ▼
      </button>
      {onRegenerate && (
        <button className="lt-fb-btn" onClick={onRegenerate} type="button">
          ↻ retry
        </button>
      )}
      {onCopy && (
        <button className="lt-fb-btn" onClick={onCopy} type="button">
          ⧉ copy
        </button>
      )}
    </div>
  )
}
