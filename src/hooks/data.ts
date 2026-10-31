import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, listCategories, listExpensesBetween } from '../db/repo'
import type { Category, Expense, Settings } from '../db/types'
import { weekEnd } from '../lib/dates'

/** All expenses in the week starting `weekStart`; undefined while loading. */
export function useWeekExpenses(weekStart: string): Expense[] | undefined {
  return useLiveQuery(() => listExpensesBetween(weekStart, weekEnd(weekStart)), [weekStart])
}

export interface Categories {
  /** Non-archived, in display order: what the add sheet offers. */
  active: Category[]
  /** Every category, archived included, so old expenses always resolve. */
  byId: Map<string, Category>
}

export function useCategories(): Categories | undefined {
  return useLiveQuery(async () => {
    const all = await listCategories()
    return { active: all.filter((c) => !c.archived), byId: new Map(all.map((c) => [c.id, c])) }
  })
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(getSettings)
}
