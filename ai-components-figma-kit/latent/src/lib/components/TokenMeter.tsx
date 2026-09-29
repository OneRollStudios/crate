import { cn } from '../utils/cn'

export interface TokenMeterProps {
  used: number
  max: number
  label?: string
  /** Fraction (0–1) above which the bar turns to a warning color. */
  warnAt?: number
  /** Optional cost readout, e.g. "$0.04". */
  cost?: string
  className?: string
}

const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * CMP-038 — Token / usage meter.
 * Context fill with a warning threshold and optional cost readout.
 */
export function TokenMeter({
  used,
  max,
  label = 'tokens',
  warnAt = 0.85,
  cost,
  className,
}: TokenMeterProps) {
  const frac = max > 0 ? Math.min(used / max, 1) : 0
  const warn = frac >= warnAt
  return (
    <div className={cn('lt-meter', className)}>
      <div className="lt-meter__row">
        <span>{label}</span>
        <span className="lt-meter__bar">
          <i style={{ width: `${frac * 100}%` }} data-warn={warn} />
        </span>
        <span>
          {fmt(used)} / {fmt(max)}
        </span>
        {cost && <span style={{ color: 'var(--lt-faint)' }}>· {cost}</span>}
      </div>
    </div>
  )
}
