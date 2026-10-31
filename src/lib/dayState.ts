import { isFuture } from './dates'

/**
 * What the calendar strip shows for a day. It reflects whether the day was
 * logged, never how much was spent. "Today" is a separate flag, combined with
 * any of these states.
 */
export type DayState = 'future' | 'logged' | 'noSpend' | 'unlogged'

export function dayState(date: string, today: string, hasExpenses: boolean, isNoSpend: boolean): DayState {
  if (isFuture(date, today)) return 'future'
  // The repo keeps these exclusive; if they ever disagree, the expenses win.
  if (hasExpenses) return 'logged'
  if (isNoSpend) return 'noSpend'
  return 'unlogged'
}
