import { cn } from '../utils/cn'
import { Button } from './Button'

export interface DiffLine {
  type: 'add' | 'del' | 'ctx'
  text: string
}

export interface DiffSuggestionProps {
  title?: string
  lines: DiffLine[]
  onAccept?: () => void
  onReject?: () => void
  className?: string
}

/**
 * CMP-052 — Diff / suggestion.
 * Accept-reject block for an AI-proposed edit.
 */
export function DiffSuggestion({
  title = 'Suggested edit',
  lines,
  onAccept,
  onReject,
  className,
}: DiffSuggestionProps) {
  return (
    <div className={cn('lt-diff', className)}>
      <div className="lt-diff__body">
        {title && (
          <div
            className="lt-mono"
            style={{ color: 'var(--lt-faint)', fontSize: 11, marginBottom: 6 }}
          >
            {title}
          </div>
        )}
        {lines.map((l, i) => (
          <span
            key={i}
            className={cn(
              'lt-diff__line',
              l.type === 'add' && 'lt-diff__line--add',
              l.type === 'del' && 'lt-diff__line--del',
            )}
          >
            {l.type === 'add' ? '+ ' : l.type === 'del' ? '- ' : '  '}
            {l.text}
          </span>
        ))}
      </div>
      <div className="lt-diff__foot">
        <Button variant="amber" size="sm" onClick={onAccept}>
          ✓ Accept
        </Button>
        <Button variant="ghost" size="sm" onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  )
}
