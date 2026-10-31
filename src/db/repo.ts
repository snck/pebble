// The data-access layer. Components and hooks go through these functions and
// never touch Dexie directly.

import { isFuture } from '../lib/dates'
import { newId } from '../lib/id'
import { db } from './db'
import { defaultCurrency } from './defaultCurrency'
import type { Category, Expense, ExpenseInput, NoSpendDay, Settings } from './types'

function normalizeNote(note: string | undefined): string | undefined {
  const trimmed = note?.trim()
  return trimmed ? trimmed : undefined
}

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray()
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
