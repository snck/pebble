// The data-access layer. Components and hooks go through these functions and
// never touch Dexie directly.

import {
  nextOrder,
  normalizeCategoryName,
  validateCategoryName,
  type CategoryError,
} from '../lib/categories'
import type { BackupData } from '../lib/backup'
import { isFuture } from '../lib/dates'
import { newId } from '../lib/id'
import { fractionDigits, rescaleMinor } from '../lib/money'
import { db } from './db'
import { defaultCurrency } from './defaultCurrency'
import type { Category, CategoryInput, Expense, ExpenseInput, NoSpendDay, Settings } from './types'

function normalizeNote(note: string | undefined): string | undefined {
  const trimmed = note?.trim()
  return trimmed ? trimmed : undefined
}

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray()
}

// Categories are archived, never deleted, so old expenses keep their category.
// Writes return a CategoryError instead of saving when a rule would break.

export async function addCategory(input: CategoryInput): Promise<CategoryError | null> {
  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.toArray()
    const name = normalizeCategoryName(input.name)
    const error = validateCategoryName(name, all)
    if (error) return error
    const category: Category = {
      id: newId(),
      name,
      isFixed: input.isFixed,
      order: nextOrder(all),
      archived: false,
    }
    if (input.emoji) category.emoji = input.emoji
    await db.categories.add(category)
    return null
  })
}

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryError | null> {
  return db.transaction('rw', db.categories, async () => {
    const name = normalizeCategoryName(input.name)
    const error = validateCategoryName(name, await db.categories.toArray(), id)
    if (error) return error
    // An undefined emoji deletes the property.
    await db.categories.update(id, { name, emoji: input.emoji || undefined, isFixed: input.isFixed })
    return null
  })
}

export async function archiveCategory(id: string): Promise<CategoryError | null> {
  return db.transaction('rw', db.categories, async () => {
    const active = (await db.categories.toArray()).filter((c) => !c.archived)
    if (active.length <= 1 && active.some((c) => c.id === id)) return 'last-active'
    await db.categories.update(id, { archived: true })
    return null
  })
}

/** Brings an archived category back, at the end of the list. */
export async function restoreCategory(id: string): Promise<CategoryError | null> {
  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.toArray()
    const category = all.find((c) => c.id === id)
    if (!category) return null
    const error = validateCategoryName(category.name, all, id)
    if (error) return error
    await db.categories.update(id, { archived: false, order: nextOrder(all) })
    return null
  })
}

/** Swaps an active category with its neighbour above (-1) or below (+1). */
export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    const active = (await db.categories.orderBy('order').toArray()).filter((c) => !c.archived)
    const index = active.findIndex((c) => c.id === id)
    const current = active[index]
    const neighbour = active[index + direction]
    if (!current || !neighbour) return
    await db.categories.update(current.id, { order: neighbour.order })
    await db.categories.update(neighbour.id, { order: current.order })
  })
}

export async function listExpensesBetween(start: string, end: string): Promise<Expense[]> {
  return db.expenses.where('date').between(start, end, true, true).toArray()
}

export async function addExpense(input: ExpenseInput): Promise<Expense> {
  const now = Date.now()
  const expense: Expense = {
    id: newId(),
    amount: input.amount,
    categoryId: input.categoryId,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  }
  const note = normalizeNote(input.note)
  if (note) expense.note = note
  await db.transaction('rw', db.expenses, db.noSpendDays, async () => {
    await db.expenses.add(expense)
    await db.noSpendDays.delete(expense.date)
  })
  return expense
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  await db.transaction('rw', db.expenses, db.noSpendDays, async () => {
    // Dexie deletes a property whose new value is undefined, which clears the note.
    await db.expenses.update(id, {
      amount: input.amount,
      categoryId: input.categoryId,
      date: input.date,
      note: normalizeNote(input.note),
      updatedAt: Date.now(),
    })
    await db.noSpendDays.delete(input.date)
  })
}

/** Deletes and returns the expense, so the caller can offer undo. */
export async function deleteExpense(id: string): Promise<Expense | undefined> {
  return db.transaction('rw', db.expenses, async () => {
    const expense = await db.expenses.get(id)
    if (expense) await db.expenses.delete(id)
    return expense
  })
}

/** Undo for `deleteExpense`: puts the exact record back. */
export async function restoreExpense(expense: Expense): Promise<void> {
  await db.transaction('rw', db.expenses, db.noSpendDays, async () => {
    await db.expenses.put(expense)
    await db.noSpendDays.delete(expense.date)
  })
}

// No-spend rules: a day with expenses is never a no-spend day (every write that
// puts an expense on a date above clears its mark), and future days can't be
// marked.

export async function listNoSpendBetween(start: string, end: string): Promise<NoSpendDay[]> {
  return db.noSpendDays.where('date').between(start, end, true, true).toArray()
}

/** Returns false, without marking, for a future day or a day with expenses. */
export async function markNoSpend(date: string, today: string): Promise<boolean> {
  if (isFuture(date, today)) return false
  return db.transaction('rw', db.expenses, db.noSpendDays, async () => {
    if ((await db.expenses.where('date').equals(date).count()) > 0) return false
    await db.noSpendDays.put({ date })
    return true
  })
}

export async function unmarkNoSpend(date: string): Promise<void> {
  await db.noSpendDays.delete(date)
}

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('app')
  return { currency: row?.currency ?? defaultCurrency() }
}

/**
 * Changes the display currency. Amounts aren't converted; they keep the
 * numbers the user typed, so when the new currency has a different number of
 * decimals the stored minor units are rescaled to match.
 */
export async function setCurrency(currency: string): Promise<void> {
  await db.transaction('rw', db.settings, db.expenses, async () => {
    const from = (await db.settings.get('app'))?.currency ?? defaultCurrency()
    if (from === currency) return
    const fromDigits = fractionDigits(from)
    const toDigits = fractionDigits(currency)
    if (fromDigits !== toDigits) {
      await db.expenses.toCollection().modify((e) => {
        e.amount = rescaleMinor(e.amount, fromDigits, toDigits)
      })
    }
    await db.settings.put({ key: 'app', currency })
  })
}

// Backup

export async function exportAll(): Promise<BackupData> {
  return db.transaction('r', [db.expenses, db.categories, db.noSpendDays, db.settings], async () => ({
    expenses: await db.expenses.toArray(),
    categories: await db.categories.toArray(),
    noSpendDays: await db.noSpendDays.toArray(),
    settings: await getSettings(),
  }))
}

/** Replaces everything with a (validated) backup, all or nothing. */
export async function replaceAll(data: BackupData): Promise<void> {
  await db.transaction('rw', [db.expenses, db.categories, db.noSpendDays, db.settings], async () => {
    await Promise.all([db.expenses.clear(), db.categories.clear(), db.noSpendDays.clear(), db.settings.clear()])
    await db.categories.bulkAdd(data.categories)
    await db.expenses.bulkAdd(data.expenses)
    await db.noSpendDays.bulkAdd(data.noSpendDays)
    await db.settings.put({ key: 'app', ...data.settings })
  })
}
