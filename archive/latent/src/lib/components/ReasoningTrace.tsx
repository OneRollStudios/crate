import { useState } from 'react'
import { cn } from '../utils/cn'

export interface ReasoningStep {
  label: string
  /** e.g. "0.4s" — optional per-step timing. */
  duration?: string
}

export interface ReasoningTraceProps {
  /** Summary line shown collapsed, e.g. "reasoning · reading 42 slides". */
  summary: string
  steps?: ReasoningStep[]
  /** Is the model still thinking? Shows the pulse. */
  live?: boolean
  defaultOpen?: boolean
  className?: string
}

/**
 * CMP-018 — Reasoning trace.
 * Collapsible chain-of-thought with a live status pulse and per-step timing.
 */
export function ReasoningTrace({
  summary,
  steps = [],
  live = false,
  defaultOpen = false,
  className,
}: ReasoningTraceProps) {
  const [open, setOpen] = useState(defaultOpen)
  const hasSteps = steps.length > 0

  return (
    <div className={cn('lt-trace', className)} data-open={open}>
      <button
        className="lt-trace__head"
        onClick={() => hasSteps && setOpen((o) => !o)}
        aria-expanded={hasSteps ? open : undefined}
        type="button"
        style={{ cursor: hasSteps ? 'pointer' : 'default' }}
      >
        {live && <span className="lt-pulse" aria-hidden />}
        <span>{summary}</span>
        {hasSteps && <span className="lt-chev" aria-hidden>▶</span>}
      </button>
      {open && hasSteps && (
        <div className="lt-trace__body">
          {steps.map((s, i) => (
            <div className="lt-trace__step" key={i}>
              <span>{i + 1}. {s.label}</span>
              {s.duration && <span className="lt-t">{s.duration}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
