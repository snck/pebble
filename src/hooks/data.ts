import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, listCategories, listExpensesBetween, listNoSpendBetween } from '../db/repo'
import type { Category, Expense, Settings } from '../db/types'
import { endOfMonth, startOfMonth, weekEnd } from '../lib/dates'

/**
 * A live query whose result is tagged with the period it was fetched for.
 * useLiveQuery keeps returning the previous result while a new one loads, so
 * without this a screen would briefly show last week's (or month's) data
 * under the new heading.
 */
function useLiveQueryFor<T>(period: string, query: () => Promise<T>): T | undefined {
  const result = useLiveQuery(async () => ({ period, value: await query() }), [period])
  return result?.period === period ? result.value : undefined
}

/** All expenses in the week starting `weekStart`; undefined while loading. */
export function useWeekExpenses(weekStart: string): Expense[] | undefined {
  return useLiveQueryFor(weekStart, () => listExpensesBetween(weekStart, weekEnd(weekStart)))
}

/** All expenses in a `YYYY-MM` month; undefined while loading. */
export function useMonthExpenses(month: string): Expense[] | undefined {
  return useLiveQueryFor(month, () => listExpensesBetween(startOfMonth(month), endOfMonth(month)))
}

/** Dates marked as no-spend in the week starting `weekStart`; undefined while loading. */
export function useWeekNoSpend(weekStart: string): Set<string> | undefined {
  return useLiveQueryFor(
    weekStart,
    async () => new Set((await listNoSpendBetween(weekStart, weekEnd(weekStart))).map((d) => d.date)),
  )
}

export interface Categories {
  /** Non-archived, in display order: what the add sheet offers. */
  active: Category[]
  /** Archived, in display order. */
  archived: Category[]
  /** Every category, archived included, so old expenses always resolve. */
  byId: Map<string, Category>
}

export function useCategories(): Categories | undefined {
  return useLiveQuery(async () => {
    const all = await listCategories()
    return {
      active: all.filter((c) => !c.archived),
      archived: all.filter((c) => c.archived),
      byId: new Map(all.map((c) => [c.id, c])),
    }
  })
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(getSettings)
}
