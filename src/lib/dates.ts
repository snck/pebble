// All date logic lives here. Dates in the data model are local calendar dates
// as `YYYY-MM-DD` strings; `Date` objects only exist transiently inside this
// module (and for display formatting).

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Local date at noon, so adding days never lands on a DST gap. */
export function fromISO(iso: string): Date {
  const m = ISO_RE.exec(iso)
  if (!m) throw new Error(`Invalid ISO date: ${iso}`)
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
}

/** True for a `YYYY-MM-DD` string naming a real calendar date (not 2026-02-30). */
export function isValidISODate(value: unknown): value is string {
  return typeof value === 'string' && ISO_RE.test(value) && toISO(fromISO(value)) === value
}

export function todayISO(now: Date = new Date()): string {
  return toISO(now)
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const offset = (fromISO(iso).getDay() + 6) % 7
  return addDays(iso, -offset)
}

/** The 7 dates of the week starting at `weekStart`, Monday first. */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function weekEnd(weekStart: string): string {
  return addDays(weekStart, 6)
}

export function isInWeek(iso: string, weekStart: string): boolean {
  return iso >= weekStart && iso <= weekEnd(weekStart)
}

export function isFuture(iso: string, today: string): boolean {
  return iso > today
}

export function isCurrentWeek(weekStart: string, today: string): boolean {
  return weekStart === startOfWeek(today)
}

/** The same weekday `weeks` weeks away, moved back to today if that's in the future. */
export function shiftWeeks(iso: string, weeks: number, today: string): string {
  const shifted = addDays(iso, weeks * 7)
  return isFuture(shifted, today) ? today : shifted
}

/** Milliseconds until the next local midnight. */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

export function relativeDayName(iso: string, today: string): string | null {
  if (iso === today) return 'Today'
  if (iso === addDays(today, -1)) return 'Yesterday'
  return null
}

export function relativeWeekName(weekStart: string, today: string): string | null {
  const current = startOfWeek(today)
  if (weekStart === current) return 'This week'
  if (weekStart === addDays(current, -7)) return 'Last week'
  return null
}

export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, options).format(fromISO(iso))
}

/** e.g. "27 Oct – 2 Nov" (order and dash follow the locale). */
export function formatWeekRange(weekStart: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).formatRange(
    fromISO(weekStart),
    fromISO(weekEnd(weekStart)),
  )
}

// Months are `YYYY-MM` strings.

export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

export function startOfMonth(month: string): string {
  return `${month}-01`
}

export function endOfMonth(month: string): string {
  const first = fromISO(startOfMonth(month))
  // Day 0 of the next month is the last day of this one.
  return toISO(new Date(first.getFullYear(), first.getMonth() + 1, 0, 12))
}

export function addMonths(month: string, n: number): string {
  const first = fromISO(startOfMonth(month))
  return monthOf(toISO(new Date(first.getFullYear(), first.getMonth() + n, 1, 12)))
}

export function isCurrentMonth(month: string, today: string): boolean {
  return month === monthOf(today)
}

export function relativeMonthName(month: string, today: string): string | null {
  const current = monthOf(today)
  if (month === current) return 'This month'
  if (month === addMonths(current, -1)) return 'Last month'
  return null
}

/** e.g. "October 2026". */
export function formatMonth(month: string, locale?: string): string {
  return formatDate(startOfMonth(month), { month: 'long', year: 'numeric' }, locale)
}
