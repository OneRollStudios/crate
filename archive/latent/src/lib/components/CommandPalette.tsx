import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../utils/cn'

export interface Command {
  id: string
  label: string
  group?: string
  icon?: ReactNode
  hint?: string
  run?: () => void
}

export interface CommandPaletteProps {
  commands: Command[]
  open: boolean
  onClose: () => void
  placeholder?: string
  className?: string
}

/**
 * CMP-057 — Command palette.
 * ⌘K-style launcher with fuzzy-ish filtering, grouped results,
 * full keyboard navigation and an accessible overlay.
 */
export function CommandPalette({
  commands,
  open,
  onClose,
  placeholder = 'Type a command or search…',
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // focus after paint
      const id = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[active]
        if (cmd) {
          cmd.run?.()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, active, onClose])

  if (!open) return null

  // group while preserving order
  const groups: { name: string; items: Command[] }[] = []
  for (const c of filtered) {
    const name = c.group ?? ''
    let g = groups.find((x) => x.name === name)
    if (!g) {
      g = { name, items: [] }
      groups.push(g)
    }
    g.items.push(c)
  }

  return (
    <div
      className="lt-cmdk-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn('lt-cmdk', className)} role="dialog" aria-modal="true">
        <input
          ref={inputRef}
          className="lt-cmdk__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Command"
        />
        <div className="lt-cmdk__list">
          {filtered.length === 0 && (
            <div className="lt-cmdk__group">No results</div>
          )}
          {groups.map((g) => (
            <div key={g.name || '_'}>
              {g.name && <div className="lt-cmdk__group">{g.name}</div>}
              {g.items.map((c) => {
                const idx = filtered.indexOf(c)
                return (
                  <div
                    key={c.id}
                    className="lt-cmdk__item"
                    data-active={idx === active}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      c.run?.()
                      onClose()
                    }}
                  >
                    <span className="lt-ico" aria-hidden>
                      {c.icon ?? '›'}
                    </span>
                    <span>{c.label}</span>
                    {c.hint && <span className="lt-hint">{c.hint}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Convenience hook: binds ⌘K / Ctrl+K to toggle a palette.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return { open, setOpen, close: () => setOpen(false) }
}
