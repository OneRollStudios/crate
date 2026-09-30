import { useEffect, useRef, useState } from 'react'
import { cn } from '../utils/cn'

export interface StreamingReplyProps {
  /** Full text to reveal token-by-token. */
  text: string
  /** ms per character (jittered). Set 0 to render instantly. */
  speed?: number
  /** Show the blinking caret while streaming. */
  caret?: boolean
  /** Loop the animation (handy for demos). */
  loop?: boolean
  /** Pause before restarting a loop, ms. */
  loopDelay?: number
  onDone?: () => void
  className?: string
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * CMP-011 — Streaming reply.
 * Reveals text progressively with a caret; respects reduced-motion
 * (renders the full text at once) and can loop for showcase use.
 */
export function StreamingReply({
  text,
  speed = 20,
  caret = true,
  loop = false,
  loopDelay = 4200,
  onDone,
  className,
}: StreamingReplyProps) {
  const [shown, setShown] = useState('')
  const [streaming, setStreaming] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const instant = speed === 0 || prefersReduced()
    if (instant) {
      setShown(text)
      setStreaming(false)
      onDone?.()
      return
    }

    let i = 0
    const step = () => {
      i += 1
      setShown(text.slice(0, i))
      if (i < text.length) {
        timer.current = setTimeout(step, speed + Math.random() * (speed * 2))
      } else {
        setStreaming(false)
        onDone?.()
        if (loop) {
          timer.current = setTimeout(() => {
            i = 0
            setShown('')
            setStreaming(true)
            step()
          }, loopDelay)
        }
      }
    }
    setShown('')
    setStreaming(true)
    step()

    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, loop, loopDelay])

  return (
    <p className={cn('lt-stream', className)} aria-live="polite">
      {shown}
      {caret && streaming && <span className="lt-caret" aria-hidden />}
    </p>
  )
}
