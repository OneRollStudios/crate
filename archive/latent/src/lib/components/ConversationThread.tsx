import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface ConversationThreadProps {
  /** Optional window chrome path label, e.g. "latent://playground". */
  path?: string
  children: ReactNode
  /** Footer slot — typically a PromptComposer + TokenMeter. */
  footer?: ReactNode
  className?: string
  /** Fixed height for the scrolling thread area. */
  threadHeight?: number | string
}

/**
 * A composite shell that frames a message thread with window chrome and
 * a pinned footer — the "conversation" surface primitives live inside.
 */
export function ConversationThread({
  path = 'latent://playground',
  children,
  footer,
  className,
  threadHeight,
}: ConversationThreadProps) {
  return (
    <div className={cn('lt-demo', className)}>
      <div className="lt-demo-top">
        <span className="lt-path">{path}</span>
        <span className="lt-lights" aria-hidden>
          <i />
          <i />
          <i />
        </span>
      </div>
      <div
        className="lt-thread"
        style={threadHeight ? { height: threadHeight } : undefined}
      >
        {children}
      </div>
      {footer && <div>{footer}</div>}
    </div>
  )
}

export interface MessageProps {
  role: 'user' | 'ai'
  children: ReactNode
  className?: string
}

/** A single message bubble within a ConversationThread. */
export function Message({ role, children, className }: MessageProps) {
  return (
    <div
      className={cn(
        'lt-msg',
        role === 'user' ? 'lt-msg--user' : 'lt-msg--ai',
        className,
      )}
    >
      {children}
    </div>
  )
}
