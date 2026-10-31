import { formatDate, weekDays } from '../lib/dates'
import { dayState, type DayState } from '../lib/dayState'

interface Props {
  weekStart: string
  today: string
  loggedDates: Set<string>
  noSpendDates: Set<string>
  onSelect(date: string): void
}

const STATE_LABEL: Record<DayState, string> = {
  future: 'upcoming',
  logged: 'logged',
  noSpend: 'no-spend day',
  unlogged: 'nothing logged',
}

export function WeekStrip({ weekStart, today, loggedDates, noSpendDates, onSelect }: Props) {
  return (
    <nav className="week-strip" aria-label="Days of the week">
      {weekDays(weekStart).map((date) => {
        const state = dayState(date, today, loggedDates.has(date), noSpendDates.has(date))
        const isToday = date === today
        const label = formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })
        return (
          <button
            key={date}
            type="button"
            className={`strip-day state-${state}${isToday ? ' is-today' : ''}`}
            disabled={state === 'future'}
            aria-current={isToday ? 'date' : undefined}
            aria-label={`${isToday ? 'Today, ' : ''}${label}, ${STATE_LABEL[state]}`}
            onClick={() => onSelect(date)}
          >
            <span className="strip-weekday">{formatDate(date, { weekday: 'narrow' })}</span>
            <span className="strip-date">{formatDate(date, { day: 'numeric' })}</span>
            <span className="strip-mark">{state === 'noSpend' && '🌿'}</span>
          </button>
        )
      })}
    </nav>
  )
}
