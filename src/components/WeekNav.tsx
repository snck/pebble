import { formatWeekRange, isCurrentWeek, relativeWeekName } from '../lib/dates'

interface Props {
  weekStart: string
  today: string
  onPrev(): void
  onNext(): void
}

export function WeekNav({ weekStart, today, onPrev, onNext }: Props) {
  const range = formatWeekRange(weekStart)
  const name = relativeWeekName(weekStart, today)

  return (
    <div className="week-nav">
      <button type="button" className="icon-button" aria-label="Previous week" onClick={onPrev}>
        ‹
      </button>
      <div className="week-label" aria-live="polite">
        <span className="week-title">{name ?? range}</span>
        {name && <span className="week-range">{range}</span>}
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label="Next week"
        disabled={isCurrentWeek(weekStart, today)}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  )
}
