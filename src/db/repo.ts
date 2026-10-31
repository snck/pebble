// The data-access layer. Components and hooks go through these functions and
// never touch Dexie directly.

import { newId } from '../lib/id'
import { db } from './db'
import { defaultCurrency } from './defaultCurrency'
import type { Category, Expense, ExpenseInput, Settings } from './types'

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
  await db.expenses.add(expense)
  return expense
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  // Dexie deletes a property whose new value is undefined, which clears the note.
  await db.expenses.update(id, {
    amount: input.amount,
    categoryId: input.categoryId,
    date: input.date,
    note: normalizeNote(input.note),
    updatedAt: Date.now(),
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
  await db.expenses.put(expense)
}

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('app')
  return { currency: row?.currency ?? defaultCurrency() }
}
