import { cn } from '../utils/cn'

export type StepStatus = 'done' | 'active' | 'pending'

export interface TimelineStep {
  title: string
  meta?: string
  status?: StepStatus
}

export interface AgentTimelineProps {
  steps: TimelineStep[]
  className?: string
}

/**
 * CMP-044 — Agent timeline.
 * Multi-step run with plan → actions → outcomes and per-step status.
 */
export function AgentTimeline({ steps, className }: AgentTimelineProps) {
  return (
    <div className={cn('lt-timeline', className)}>
      {steps.map((s, i) => {
        const status = s.status ?? 'pending'
        return (
          <div className="lt-tl-step" key={i}>
            <div className="lt-tl-step__rail">
              <span className="lt-tl-step__dot" data-status={status} aria-hidden>
                {status === 'done' ? '✓' : ''}
              </span>
              <span className="lt-tl-step__line" />
            </div>
            <div className="lt-tl-step__body">
              <div className="lt-tl-step__title">{s.title}</div>
              {s.meta && <div className="lt-tl-step__meta">{s.meta}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
