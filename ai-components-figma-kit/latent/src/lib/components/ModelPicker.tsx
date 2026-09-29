import { cn } from '../utils/cn'

export interface ModelOption {
  id: string
  name: string
  /** Optional sub-label, e.g. "200K · $15/M". */
  meta?: string
}

export interface ModelPickerProps {
  models: ModelOption[]
  value: string
  onChange?: (id: string) => void
  className?: string
}

/**
 * CMP-031 — Model picker.
 * Segmented model/provider selector with optional context/pricing meta.
 */
export function ModelPicker({
  models,
  value,
  onChange,
  className,
}: ModelPickerProps) {
  return (
    <div className={cn('lt-models', className)} role="radiogroup" aria-label="Model">
      {models.map((m) => (
        <button
          key={m.id}
          className="lt-model"
          role="radio"
          aria-checked={m.id === value}
          aria-pressed={m.id === value}
          onClick={() => onChange?.(m.id)}
          type="button"
        >
          {m.name}
          {m.meta && <small>{m.meta}</small>}
        </button>
      ))}
    </div>
  )
}
