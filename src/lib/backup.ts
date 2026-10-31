// Backup file format: serialize everything, and validate a file completely
// before anything is written, so a bad file can never half-replace the data.

import type { Category, Expense, NoSpendDay, Settings } from '../db/types'
import { isValidISODate } from './dates'

export const BACKUP_VERSION = 1

export interface BackupData {
  expenses: Expense[]
  categories: Category[]
  noSpendDays: NoSpendDay[]
  settings: Settings
}

export type ParsedBackup = { ok: true; data: BackupData; exportedAt: string } | { ok: false; error: string }

export function serializeBackup(data: BackupData, exportedAt: Date): string {
  return JSON.stringify({ app: 'pebble', version: BACKUP_VERSION, exportedAt: exportedAt.toISOString(), data }, null, 2)
}

export function backupFileName(today: string): string {
  return `pebble-backup-${today}.json`
}

/** Thrown inside parsing with a path like "expense 3: date"; turned into a message. */
class Invalid extends Error {}

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

function field<T>(o: Obj, key: string, where: string, ok: (v: unknown) => v is T): T {
  const v = o[key]
  if (!ok(v)) throw new Invalid(`${where}: ${key}`)
  return v
}

const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isPositiveInt = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0
const isOptionalString = (v: unknown): v is string | undefined => v === undefined || typeof v === 'string'

function isCurrency(v: unknown): v is string {
  if (typeof v !== 'string' || !/^[A-Z]{3}$/.test(v)) return false
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: v })
    return true
  } catch {
    return false
  }
}

function list(o: Obj, key: string): unknown[] {
  const v = o[key]
  if (!Array.isArray(v)) throw new Invalid(key)
  return v
}

function parseCategory(v: unknown, i: number): Category {
  const where = `category ${i + 1}`
  if (!isObj(v)) throw new Invalid(where)
  const category: Category = {
    id: field(v, 'id', where, isNonEmpty),
    name: field(v, 'name', where, isNonEmpty).trim(),
    isFixed: field(v, 'isFixed', where, isBool),
    order: field(v, 'order', where, isFiniteNum),
    archived: field(v, 'archived', where, isBool),
  }
  const emoji = field(v, 'emoji', where, isOptionalString)
  if (emoji) category.emoji = emoji
  return category
}

function parseExpense(v: unknown, i: number): Expense {
  const where = `expense ${i + 1}`
  if (!isObj(v)) throw new Invalid(where)
  const expense: Expense = {
    id: field(v, 'id', where, isNonEmpty),
    amount: field(v, 'amount', where, isPositiveInt),
    categoryId: field(v, 'categoryId', where, isNonEmpty),
    date: field(v, 'date', where, isValidISODate),
    createdAt: field(v, 'createdAt', where, isFiniteNum),
    updatedAt: field(v, 'updatedAt', where, isFiniteNum),
  }
  const note = field(v, 'note', where, isOptionalString)?.trim()
  if (note) expense.note = note
  return expense
}

function parseNoSpendDay(v: unknown, i: number): NoSpendDay {
  const where = `no-spend day ${i + 1}`
  if (!isObj(v)) throw new Invalid(where)
  return { date: field(v, 'date', where, isValidISODate) }
}

function assertUnique(values: string[], what: string) {
  if (new Set(values).size !== values.length) throw new Invalid(`duplicate ${what}`)
}

export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: "This file isn't a Pebble backup." }
  }
  if (!isObj(json) || json.app !== 'pebble' || !isObj(json.data)) {
    return { ok: false, error: "This file isn't a Pebble backup." }
  }
  if (typeof json.version !== 'number' || json.version > BACKUP_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of Pebble. Update the app and try again.' }
  }

  try {
    const d = json.data
    const categories = list(d, 'categories').map(parseCategory)
    const expenses = list(d, 'expenses').map(parseExpense)
    const allNoSpend = list(d, 'noSpendDays').map(parseNoSpendDay)
    if (!isObj(d.settings)) throw new Invalid('settings')
    const settings: Settings = { currency: field(d.settings, 'currency', 'settings', isCurrency) }

    assertUnique(categories.map((c) => c.id), 'category ids')
    assertUnique(expenses.map((e) => e.id), 'expense ids')
    if (!categories.some((c) => !c.archived)) throw new Invalid('no active categories')
    const categoryIds = new Set(categories.map((c) => c.id))
    expenses.forEach((e, i) => {
      if (!categoryIds.has(e.categoryId)) throw new Invalid(`expense ${i + 1}: unknown category`)
    })

    // Apply the app's rule rather than reject: a day with expenses isn't a no-spend day.
    const expenseDates = new Set(expenses.map((e) => e.date))
    const noSpendDays = [...new Map(allNoSpend.map((n) => [n.date, n])).values()].filter(
      (n) => !expenseDates.has(n.date),
    )

    return {
      ok: true,
      data: { expenses, categories, noSpendDays, settings },
      exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : '',
    }
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: `This backup looks damaged (${e.message}), so nothing was imported.` }
    throw e
  }
}
