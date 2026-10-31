import { describe, expect, it } from 'vitest'
import type { Category, Expense } from '../db/types'
import { computeReport, largestRemainder } from './report'

const cat = (id: string, order: number, isFixed = false, archived = false): Category => ({
  id,
  name: id,
  isFixed,
  order,
  archived,
})

const categories = new Map(
  [cat('food', 0), cat('transport', 1), cat('fun', 2), cat('rent', 3, true), cat('old', 4, false, true)].map(
    (c) => [c.id, c],
  ),
)

let n = 0
const exp = (categoryId: string, amount: number): Expense => ({
  id: `e${n++}`,
  amount,
  categoryId,
  date: '2026-10-15',
  createdAt: n,
  updatedAt: n,
})

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('largestRemainder', () => {
  it('always sums to 100', () => {
    for (const values of [[1, 1, 1], [1, 2, 3, 4, 5, 6, 7], [999, 1], [33, 33, 34], [1, 1, 1, 1, 1, 1]]) {
      expect(sum(largestRemainder(values)), String(values)).toBe(100)
    }
  })

  it('gives leftover points to the largest remainders', () => {
    expect(largestRemainder([1, 1, 1])).toEqual([34, 33, 33])
    expect(largestRemainder([2, 1])).toEqual([67, 33])
  })

  it('returns zeros when there is nothing to share', () => {
    expect(largestRemainder([])).toEqual([])
    expect(largestRemainder([0, 0])).toEqual([0, 0])
  })
})

describe('computeReport', () => {
  it('sorts categories by share, largest first, with percents summing to 100', () => {
    const r = computeReport([exp('food', 300), exp('transport', 600), exp('food', 300), exp('fun', 100)], categories, false)
    expect(r.rows.map((x) => x.category.id)).toEqual(['food', 'transport', 'fun'])
    expect(r.rows.map((x) => x.percent)).toEqual([46, 46, 8])
    expect(sum(r.rows.map((x) => x.percent))).toBe(100)
    expect(r.expenseCount).toBe(4)
  })

  it('breaks ties by category order so the chart is stable', () => {
    const r = computeReport([exp('fun', 100), exp('food', 100)], categories, false)
    expect(r.rows.map((x) => x.category.id)).toEqual(['food', 'fun'])
  })

  it('excludes fixed categories by default and counts what was hidden', () => {
    const expenses = [exp('food', 100), exp('rent', 10000), exp('rent', 500)]
    const r = computeReport(expenses, categories, false)
    expect(r.rows.map((x) => x.category.id)).toEqual(['food'])
    expect(r.rows[0]?.percent).toBe(100)
    expect(r.expenseCount).toBe(1)
    expect(r.hiddenFixedCount).toBe(2)
  })

  it('includes fixed categories when asked', () => {
    const r = computeReport([exp('food', 100), exp('rent', 300)], categories, true)
    expect(r.rows.map((x) => [x.category.id, x.percent])).toEqual([
      ['rent', 75],
      ['food', 25],
    ])
    expect(r.expenseCount).toBe(2)
    expect(r.hiddenFixedCount).toBe(0)
  })

  it('shows <1% for a share that rounds to zero', () => {
    const r = computeReport([exp('food', 100000), exp('fun', 100)], categories, false)
    expect(r.rows.map((x) => x.label)).toEqual(['100%', '<1%'])
    expect(r.rows[1]?.fraction).toBeGreaterThan(0)
  })

  it('gives exact fractions for bar widths', () => {
    const r = computeReport([exp('food', 200), exp('fun', 100)], categories, false)
    expect(r.rows.map((x) => x.fraction)).toEqual([2 / 3, 1 / 3])
  })

  it('keeps archived categories', () => {
    const r = computeReport([exp('old', 100)], categories, false)
    expect(r.rows[0]?.category.name).toBe('old')
  })

  it('handles an empty month', () => {
    expect(computeReport([], categories, false)).toEqual({ rows: [], expenseCount: 0, hiddenFixedCount: 0 })
  })

  it('handles a month with only fixed costs', () => {
    const r = computeReport([exp('rent', 1000)], categories, false)
    expect(r.rows).toEqual([])
    expect(r.hiddenFixedCount).toBe(1)
  })

  it('never exposes amounts', () => {
    const r = computeReport([exp('food', 1234), exp('fun', 5678)], categories, true)
    const json = JSON.stringify(r)
    expect(json).not.toContain('1234')
    expect(json).not.toContain('5678')
    expect(json).not.toContain('6912')
  })
})
