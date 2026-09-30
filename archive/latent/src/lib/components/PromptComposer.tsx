import {
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../utils/cn'

export interface PromptComposerProps {
  placeholder?: string
  /** Called with the trimmed prompt when the user submits. */
  onSubmit?: (value: string) => void
  /** Controlled value (optional). */
  value?: string
  onChange?: (value: string) => void
  /** Disables submit + shows a stop affordance instead. */
  busy?: boolean
  onStop?: () => void
  /** Left-aligned toolbar affordances (attach, model chip, slash, …). */
  toolbar?: ReactNode
  className?: string
  autoFocus?: boolean
}

/**
 * CMP-004 — Prompt composer.
 * Auto-growing multiline input with a send/stop state, Enter-to-send
 * (Shift+Enter for newline) and an optional toolbar row.
 */
export function PromptComposer({
  placeholder = 'Ask anything…',
  onSubmit,
  value,
  onChange,
  busy = false,
  onStop,
  toolbar,
  className,
  autoFocus,
}: PromptComposerProps) {
  const [internal, setInternal] = useState('')
  const val = value ?? internal
  const taRef = useRef<HTMLTextAreaElement>(null)

  const setVal = (v: string) => {
    if (value === undefined) setInternal(v)
    onChange?.(v)
    const ta = taRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
    }
  }

  const submit = () => {
    const trimmed = val.trim()
    if (!trimmed || busy) return
    onSubmit?.(trimmed)
    if (value === undefined) setInternal('')
    const ta = taRef.current
    if (ta) ta.style.height = 'auto'
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = val.trim().length > 0

  return (
    <div className={cn('lt-composer', className)}>
      <div className="lt-composer__row">
        <textarea
          ref={taRef}
          rows={1}
          value={val}
          placeholder={placeholder}
          aria-label="Prompt"
          autoFocus={autoFocus}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {busy ? (
          <button
            className="lt-composer__send"
            aria-label="Stop generating"
            onClick={onStop}
            style={{ background: 'var(--lt-line-2)', color: 'var(--lt-text)' }}
          >
            ■
          </button>
        ) : (
          <button
            className="lt-composer__send"
            aria-label="Send"
            disabled={!canSend}
            onClick={submit}
          >
            ↑
          </button>
        )}
      </div>
      {toolbar && <div className="lt-composer__bar">{toolbar}</div>}
    </div>
  )
}

export interface AttachButtonProps {
  label: string
  icon?: ReactNode
  onClick?: () => void
}
export function AttachButton({ label, icon = '＋', onClick }: AttachButtonProps) {
  return (
    <button className="lt-composer__attach" onClick={onClick} type="button">
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  )
}
