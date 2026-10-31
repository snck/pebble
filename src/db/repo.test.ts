import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  addExpense,
  deleteExpense,
  getSettings,
  listCategories,
  listExpensesBetween,
  restoreExpense,
  updateExpense,
} from './repo'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

async function someCategoryId(): Promise<string> {
  const [first] = await listCategories()
  if (!first) throw new Error('no categories seeded')
  return first.id
}

describe('seeding', () => {
  it('creates the starter categories in order, with fixed costs flagged', async () => {
    const categories = await listCategories()
    expect(categories.map((c) => c.name)).toEqual([
      'Food & drinks',
      'Transport',
      'Shopping',
      'Entertainment',
      'Health',
      'Bills & utilities',
      'Housing',
      'Other',
    ])
    expect(categories.filter((c) => c.isFixed).map((c) => c.name)).toEqual(['Bills & utilities', 'Housing'])
    expect(categories.every((c) => !c.archived)).toBe(true)
  })

  it('stores a default currency', async () => {
    expect((await getSettings()).currency).toMatch(/^[A-Z]{3}$/)
  })
})

describe('expenses', () => {
  it('adds an expense with ids and timestamps, trimming the note', async () => {
    const categoryId = await someCategoryId()
    const e = await addExpense({ amount: 1250, categoryId, date: '2026-10-28', note: '  lunch ' })
    expect(e.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(e.note).toBe('lunch')
    expect(e.createdAt).toBe(e.updatedAt)
    expect(await db.expenses.get(e.id)).toEqual(e)
  })

  it('omits a blank note', async () => {
    const e = await addExpense({ amount: 100, categoryId: await someCategoryId(), date: '2026-10-28', note: '  ' })
    expect('note' in e).toBe(false)
  })

  it('lists expenses within an inclusive date range', async () => {
    const categoryId = await someCategoryId()
    for (const date of ['2026-10-25', '2026-10-26', '2026-10-29', '2026-11-01', '2026-11-02']) {
      await addExpense({ amount: 100, categoryId, date })
    }
    const week = await listExpensesBetween('2026-10-26', '2026-11-01')
    expect(week.map((e) => e.date).sort()).toEqual(['2026-10-26', '2026-10-29', '2026-11-01'])
  })

  it('updates fields and clears the note', async () => {
    const categoryId = await someCategoryId()
    const e = await addExpense({ amount: 100, categoryId, date: '2026-10-28', note: 'coffee' })
    await updateExpense(e.id, { amount: 450, categoryId, date: '2026-10-27', note: '' })
    const updated = await db.expenses.get(e.id)
    expect(updated).toMatchObject({ amount: 450, date: '2026-10-27', createdAt: e.createdAt })
    expect(updated && 'note' in updated).toBe(false)
  })

  it('deletes and restores the exact same record', async () => {
    const e = await addExpense({ amount: 999, categoryId: await someCategoryId(), date: '2026-10-28', note: 'x' })
    const deleted = await deleteExpense(e.id)
    expect(deleted).toEqual(e)
    expect(await db.expenses.get(e.id)).toBeUndefined()
    await restoreExpense(deleted!)
    expect(await db.expenses.get(e.id)).toEqual(e)
  })

  it('deleting a missing id returns undefined', async () => {
    expect(await deleteExpense('nope')).toBeUndefined()
  })
})
