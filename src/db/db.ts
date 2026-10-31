// Only `repo.ts` should import this module.

import Dexie, { type EntityTable } from 'dexie'
import { newId } from '../lib/id'
import { defaultCurrency } from './defaultCurrency'
import type { Category, Expense, NoSpendDay, Settings } from './types'

export interface SettingsRow extends Settings {
  key: 'app'
}

const STARTER_CATEGORIES: Array<Pick<Category, 'name' | 'emoji' | 'isFixed'>> = [
  { name: 'Food & drinks', emoji: '🍜', isFixed: false },
  { name: 'Transport', emoji: '🚌', isFixed: false },
  { name: 'Shopping', emoji: '🛍️', isFixed: false },
  { name: 'Entertainment', emoji: '🎬', isFixed: false },
  { name: 'Health', emoji: '💊', isFixed: false },
  { name: 'Bills & utilities', emoji: '💡', isFixed: true },
  { name: 'Housing', emoji: '🏠', isFixed: true },
  { name: 'Other', emoji: '📦', isFixed: false },
]

export class PebbleDB extends Dexie {
  declare expenses: EntityTable<Expense, 'id'>
  declare categories: EntityTable<Category, 'id'>
  declare noSpendDays: EntityTable<NoSpendDay, 'date'>
  declare settings: EntityTable<SettingsRow, 'key'>

  constructor(name = 'pebble') {
    super(name)
    this.version(1).stores({
      expenses: 'id, date, categoryId',
      categories: 'id, order',
      noSpendDays: 'date',
      settings: 'key',
    })
    this.on('populate', async (tx) => {
      await tx.table<Category, string>('categories').bulkAdd(
        STARTER_CATEGORIES.map((c, i) => ({ ...c, id: newId(), order: i, archived: false })),
      )
      await tx.table<SettingsRow, string>('settings').add({ key: 'app', currency: defaultCurrency() })
    })
  }
}

export const db = new PebbleDB()
