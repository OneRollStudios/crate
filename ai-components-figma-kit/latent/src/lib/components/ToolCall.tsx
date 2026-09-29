import { cn } from '../utils/cn'

export type ToolState = 'running' | 'done' | 'error'

export interface ToolCallProps {
  /** Function name, e.g. "retrieve". */
  name: string
  /** Argument string shown inline, e.g. '"q3_board_deck.pdf"'. */
  args?: string
  state?: ToolState
  /** Returned payload preview (rendered in a monospace block). */
  payload?: string
  className?: string
}

const STATE_LABEL: Record<ToolState, string> = {
  running: 'running',
  done: 'done',
  error: 'error',
}

/**
 * CMP-023 — Tool call.
 * Function name + arguments, a run-state chip and an optional payload preview.
 */
export function ToolCall({
  name,
  args = '',
  state = 'done',
  payload,
  className,
}: ToolCallProps) {
  return (
    <div className={cn('lt-tool', className)}>
      <div className="lt-tool__head">
        <span className="lt-k" aria-hidden>⚙ tool</span>
        <span>
          {name}({args})
        </span>
        <span className="lt-tool__state" data-state={state}>
          {STATE_LABEL[state]}
        </span>
      </div>
      {payload && <div className="lt-tool__payload">{payload}</div>}
    </div>
  )
}
