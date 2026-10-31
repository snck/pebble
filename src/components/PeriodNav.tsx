interface Props {
  title: string
  subtitle?: string
  /** e.g. "week", for the arrows' accessible names. */
  unit: string
  canNext: boolean
  onPrev(): void
  onNext(): void
}

/** "‹ This week / 27 Oct – 2 Nov ›" header, shared by the week and report screens. */
export function PeriodNav({ title, subtitle, unit, canNext, onPrev, onNext }: Props) {
  return (
    <div className="period-nav">
      <button type="button" className="icon-button" aria-label={`Previous ${unit}`} onClick={onPrev}>
        ‹
      </button>
      <div className="period-label" aria-live="polite">
        <span className="period-title">{title}</span>
        {subtitle && <span className="period-subtitle">{subtitle}</span>}
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={`Next ${unit}`}
        disabled={!canNext}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  )
}
