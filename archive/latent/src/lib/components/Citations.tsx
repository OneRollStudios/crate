import { cn } from '../utils/cn'

export interface Citation {
  /** Source label, e.g. "board-deck.pdf · p.14". */
  label: string
  /** Hover preview text. */
  preview?: string
  href?: string
}

export interface CitationsProps {
  items: Citation[]
  className?: string
}

/**
 * CMP-027 — Citations.
 * Inline source chips with hover previews.
 */
export function Citations({ items, className }: CitationsProps) {
  return (
    <div className={cn('lt-cites', className)}>
      {items.map((c, i) => {
        const inner = (
          <>
            {c.label}
            {c.preview && <span className="lt-cite__pop">{c.preview}</span>}
          </>
        )
        return c.href ? (
          <a
            key={i}
            className="lt-cite"
            href={c.href}
            target="_blank"
            rel="noreferrer"
          >
            {inner}
          </a>
        ) : (
          <span className="lt-cite" key={i} tabIndex={0}>
            {inner}
          </span>
        )
      })}
    </div>
  )
}
