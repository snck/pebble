import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { parseBackup, serializeBackup } from '../lib/backup'
import { db } from './db'
import {
  addCategory,
  addExpense,
  archiveCategory,
  deleteExpense,
  exportAll,
  getSettings,
  listCategories,
  listExpensesBetween,
  listNoSpendBetween,
  markNoSpend,
  moveCategory,
  replaceAll,
  restoreCategory,
  restoreExpense,
  setCurrency,
  unmarkNoSpend,
  updateCategory,
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

describe('no-spend days', () => {
  const today = '2026-10-31'
  const isMarked = async (date: string) => (await db.noSpendDays.get(date)) !== undefined

  it('marks and unmarks a day', async () => {
    expect(await markNoSpend('2026-10-29', today)).toBe(true)
    expect(await isMarked('2026-10-29')).toBe(true)
    await unmarkNoSpend('2026-10-29')
    expect(await isMarked('2026-10-29')).toBe(false)
  })

  it('can mark today but not a future day', async () => {
    expect(await markNoSpend(today, today)).toBe(true)
    expect(await markNoSpend('2026-11-01', today)).toBe(false)
    expect(await isMarked('2026-11-01')).toBe(false)
  })

  it('refuses to mark a day that has expenses', async () => {
    await addExpense({ amount: 100, categoryId: await someCategoryId(), date: '2026-10-29' })
    expect(await markNoSpend('2026-10-29', today)).toBe(false)
    expect(await isMarked('2026-10-29')).toBe(false)
  })

  it('adding an expense removes the mark', async () => {
    await markNoSpend('2026-10-29', today)
    await addExpense({ amount: 100, categoryId: await someCategoryId(), date: '2026-10-29' })
    expect(await isMarked('2026-10-29')).toBe(false)
  })

  it('moving an expense onto a no-spend day removes the mark', async () => {
    const categoryId = await someCategoryId()
    const e = await addExpense({ amount: 100, categoryId, date: '2026-10-28' })
    await markNoSpend('2026-10-29', today)
    await markNoSpend('2026-10-27', today)
    await updateExpense(e.id, { amount: 100, categoryId, date: '2026-10-29' })
    expect(await isMarked('2026-10-29')).toBe(false)
    expect(await isMarked('2026-10-27')).toBe(true)
  })

  it('restoring a deleted expense onto a no-spend day removes the mark', async () => {
    const e = await addExpense({ amount: 100, categoryId: await someCategoryId(), date: '2026-10-29' })
    await deleteExpense(e.id)
    expect(await markNoSpend('2026-10-29', today)).toBe(true)
    await restoreExpense(e)
    expect(await isMarked('2026-10-29')).toBe(false)
  })

  it('deleting the last expense does not mark the day', async () => {
    const e = await addExpense({ amount: 100, categoryId: await someCategoryId(), date: '2026-10-29' })
    await deleteExpense(e.id)
    expect(await isMarked('2026-10-29')).toBe(false)
  })

  it('lists marks within an inclusive date range', async () => {
    for (const date of ['2026-10-25', '2026-10-26', '2026-10-30', '2026-11-02']) {
      await markNoSpend(date, '2026-11-02')
    }
    const week = await listNoSpendBetween('2026-10-26', '2026-11-01')
    expect(week.map((d) => d.date).sort()).toEqual(['2026-10-26', '2026-10-30'])
  })
})

describe('categories', () => {
  const activeNames = async () => (await listCategories()).filter((c) => !c.archived).map((c) => c.name)
  const byName = async (name: string) => (await listCategories()).find((c) => c.name === name)!

  it('adds a category at the end, with a normalized name', async () => {
    expect(await addCategory({ name: '  Pets  ', emoji: '🐶', isFixed: false })).toBeNull()
    const names = await activeNames()
    expect(names.at(-1)).toBe('Pets')
    expect((await byName('Pets')).emoji).toBe('🐶')
  })

  it('refuses empty and duplicate names', async () => {
    expect(await addCategory({ name: ' ', isFixed: false })).toBe('empty-name')
    expect(await addCategory({ name: 'transport', isFixed: false })).toBe('duplicate-name')
  })

  it('renames, changes emoji and fixed, and can clear the emoji', async () => {
    const food = await byName('Food & drinks')
    expect(await updateCategory(food.id, { name: 'Eating', emoji: '', isFixed: true })).toBeNull()
    const updated = await byName('Eating')
    expect(updated.isFixed).toBe(true)
    expect('emoji' in updated).toBe(false)
    expect(await updateCategory(food.id, { name: 'Health', isFixed: false })).toBe('duplicate-name')
  })

  it('archives instead of deleting, keeping expenses linked', async () => {
    const other = await byName('Other')
    const e = await addExpense({ amount: 100, categoryId: other.id, date: '2026-10-28' })
    expect(await archiveCategory(other.id)).toBeNull()
    expect(await activeNames()).not.toContain('Other')
    expect((await db.expenses.get(e.id))?.categoryId).toBe(other.id)
    expect((await byName('Other')).archived).toBe(true)
  })

  it('never archives the last active category', async () => {
    const all = await listCategories()
    for (const c of all.slice(1)) expect(await archiveCategory(c.id)).toBeNull()
    expect(await archiveCategory(all[0]!.id)).toBe('last-active')
    expect(await activeNames()).toEqual([all[0]!.name])
  })

  it('restores at the end, unless the name is now taken', async () => {
    const shopping = await byName('Shopping')
    await archiveCategory(shopping.id)
    expect(await restoreCategory(shopping.id)).toBeNull()
    expect((await activeNames()).at(-1)).toBe('Shopping')

    await archiveCategory(shopping.id)
    await addCategory({ name: 'Shopping', isFixed: false })
    expect(await restoreCategory(shopping.id)).toBe('duplicate-name')
  })

  it('moves categories up and down, skipping archived ones', async () => {
    await archiveCategory((await byName('Shopping')).id)
    await moveCategory((await byName('Entertainment')).id, -1)
    expect((await activeNames()).slice(0, 4)).toEqual(['Food & drinks', 'Entertainment', 'Transport', 'Health'])
    await moveCategory((await byName('Food & drinks')).id, -1) // already first: no-op
    await moveCategory((await byName('Other')).id, 1) // already last: no-op
    expect((await activeNames())[0]).toBe('Food & drinks')
    expect((await activeNames()).at(-1)).toBe('Other')
  })
})

describe('setCurrency', () => {
  it('keeps typed numbers when the number of decimals changes', async () => {
    await setCurrency('USD')
    const categoryId = await someCategoryId()
    const a = await addExpense({ amount: 150000, categoryId, date: '2026-10-28' }) // 1,500.00
    const b = await addExpense({ amount: 1250, categoryId, date: '2026-10-28' }) // 12.50
    await setCurrency('JPY')
    expect((await getSettings()).currency).toBe('JPY')
    expect((await db.expenses.get(a.id))?.amount).toBe(1500)
    expect((await db.expenses.get(b.id))?.amount).toBe(13)
    await setCurrency('THB')
    expect((await db.expenses.get(a.id))?.amount).toBe(150000)
  })

  it('only relabels when decimals match', async () => {
    await setCurrency('USD')
    const e = await addExpense({ amount: 1250, categoryId: await someCategoryId(), date: '2026-10-28' })
    await setCurrency('EUR')
    expect((await db.expenses.get(e.id))?.amount).toBe(1250)
  })
})

describe('backup', () => {
  it('exports and re-imports everything unchanged', async () => {
    const categoryId = await someCategoryId()
    await addExpense({ amount: 1250, categoryId, date: '2026-10-28', note: 'lunch' })
    await addExpense({ amount: 300, categoryId, date: '2026-10-27' })
    await markNoSpend('2026-10-26', '2026-10-31')
    await addCategory({ name: 'Pets', emoji: '🐶', isFixed: false })
    await setCurrency('THB')
    const before = await exportAll()

    const parsed = parseBackup(serializeBackup(before, new Date()))
    if (!parsed.ok) throw new Error(parsed.error)
    await db.delete()
    await db.open() // fresh database with only the starter data
    await replaceAll(parsed.data)

    const after = await exportAll()
    const byId = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id))
    expect(byId(after.expenses)).toEqual(byId(before.expenses))
    expect(byId(after.categories)).toEqual(byId(before.categories))
    expect(after.noSpendDays).toEqual(before.noSpendDays)
    expect(after.settings).toEqual({ currency: 'THB' })
  })

  it('replaces rather than merges', async () => {
    await addExpense({ amount: 100, categoryId: await someCategoryId(), date: '2026-10-28' })
    await replaceAll({
      expenses: [],
      categories: [{ id: 'only', name: 'Only', isFixed: false, order: 0, archived: false }],
      noSpendDays: [],
      settings: { currency: 'EUR' },
    })
    const after = await exportAll()
    expect(after.expenses).toEqual([])
    expect(after.categories.map((c) => c.name)).toEqual(['Only'])
  })
})
