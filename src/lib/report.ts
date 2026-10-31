// Report maths: each category's *share* of spending. Per-category sums are
// computed here only to derive shares; nothing returned carries an amount, so
// no total can end up on screen.

import type { Category, Expense } from '../db/types'

export interface ReportRow {
  category: Category
  /** Whole percent; the rows' percents always add up to exactly 100. */
  percent: number
  /** What to display: "45%", or "<1%" for a non-zero share that rounds to 0. */
  label: string
  /** Exact share in 0..1, for drawing the bar. */
  fraction: number
}

export interface Report {
  /** Largest share first. Empty when nothing is included. */
  rows: ReportRow[]
  /** Expenses the chart is based on. */
  expenseCount: number
  /** Expenses left out because their category is fixed and fixed costs are hidden. */
  hiddenFixedCount: number
}

const UNKNOWN_CATEGORY: Category = {
  id: '',
  name: 'Uncategorized',
  isFixed: false,
  order: Number.MAX_SAFE_INTEGER,
  archived: true,
}

/**
 * Rounds shares to whole percents that add up to exactly `total`, by flooring
 * each and giving the leftover points to the largest remainders (ties go to
 * the earlier item).
 */
export function largestRemainder(values: number[], total = 100): number[] {
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum <= 0) return values.map(() => 0)
  const exact = values.map((v) => (v / sum) * total)
  const floored = exact.map(Math.floor)
  let leftover = total - floored.reduce((a, b) => a + b, 0)
  const byRemainder = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
  for (const { i } of byRemainder) {
    if (leftover-- <= 0) break
    floored[i]! += 1
  }
  return floored
}

export function computeReport(
  expenses: Expense[],
  categoriesById: Map<string, Category>,
  includeFixed: boolean,
): Report {
  const byCategory = new Map<string, { category: Category; value: number }>()
  let expenseCount = 0
  let hiddenFixedCount = 0

  for (const e of expenses) {
    const category = categoriesById.get(e.categoryId) ?? { ...UNKNOWN_CATEGORY, id: e.categoryId }
    if (category.isFixed && !includeFixed) {
      hiddenFixedCount++
      continue
    }
    expenseCount++
    const entry = byCategory.get(category.id)
    if (entry) entry.value += e.amount
    else byCategory.set(category.id, { category, value: e.amount })
  }

  const sorted = [...byCategory.values()].sort(
    (a, b) => b.value - a.value || a.category.order - b.category.order,
  )
  const sum = sorted.reduce((a, b) => a + b.value, 0)
  const percents = largestRemainder(sorted.map((s) => s.value))

  return {
    rows: sorted.map((s, i) => {
      const percent = percents[i]!
      return {
        category: s.category,
        percent,
        label: percent === 0 ? '<1%' : `${percent}%`,
        fraction: s.value / sum,
      }
    }),
    expenseCount,
    hiddenFixedCount,
  }
}

/**
 * "vs last month" notes per category id, comparing the displayed percentages:
 * "up from 32%", "down from 50%", "same as last month" or "new this month".
 * Empty (show nothing) when last month has no data under the same settings.
 */
export function compareShares(current: Report, previous: Report): Map<string, string> {
  const notes = new Map<string, string>()
  if (previous.rows.length === 0) return notes
  const before = new Map(previous.rows.map((r) => [r.category.id, r]))
  for (const row of current.rows) {
    const id = row.category.id
    const prev = before.get(id)
    if (!prev) notes.set(id, 'new this month')
    else if (prev.percent === row.percent) notes.set(id, 'same as last month')
    else notes.set(id, `${row.percent > prev.percent ? 'up' : 'down'} from ${prev.label}`)
  }
  return notes
}
