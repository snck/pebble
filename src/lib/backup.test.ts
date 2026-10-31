import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, backupFileName, parseBackup, serializeBackup, type BackupData } from './backup'

const sample = (): BackupData => ({
  categories: [
    { id: 'c1', name: 'Food', emoji: '🍜', isFixed: false, order: 0, archived: false },
    { id: 'c2', name: 'Rent', isFixed: true, order: 1, archived: true },
  ],
  expenses: [
    { id: 'e1', amount: 1250, categoryId: 'c1', date: '2026-10-30', note: 'lunch', createdAt: 1, updatedAt: 2 },
    { id: 'e2', amount: 90000, categoryId: 'c2', date: '2026-10-01', createdAt: 3, updatedAt: 3 },
  ],
  noSpendDays: [{ date: '2026-10-29' }],
  settings: { currency: 'THB' },
})

const withData = (mutate: (d: Record<string, any>) => void) => {
  const file = JSON.parse(serializeBackup(sample(), new Date('2026-10-31T12:00:00Z')))
  mutate(file.data)
  return JSON.stringify(file)
}

const errorOf = (text: string) => {
  const r = parseBackup(text)
  return r.ok ? null : r.error
}

describe('backup round trip', () => {
  it('parses what it serializes, unchanged', () => {
    const r = parseBackup(serializeBackup(sample(), new Date('2026-10-31T12:00:00Z')))
    expect(r).toEqual({ ok: true, data: sample(), exportedAt: '2026-10-31T12:00:00.000Z' })
  })

  it('names the file by date', () => {
    expect(backupFileName('2026-10-31')).toBe('pebble-backup-2026-10-31.json')
  })
})

describe('parseBackup rejects', () => {
  it('files that are not Pebble backups', () => {
    expect(errorOf('not json')).toMatch(/isn't a Pebble backup/)
    expect(errorOf('{"app":"other","version":1,"data":{}}')).toMatch(/isn't a Pebble backup/)
    expect(errorOf('[]')).toMatch(/isn't a Pebble backup/)
  })

  it('backups from a newer version', () => {
    const text = JSON.stringify({ app: 'pebble', version: BACKUP_VERSION + 1, data: {} })
    expect(errorOf(text)).toMatch(/newer version/)
  })

  it('damaged fields, saying where', () => {
    const cases: Array<[(d: Record<string, any>) => void, string]> = [
      [(d) => (d.expenses[0].amount = 0), 'expense 1: amount'],
      [(d) => (d.expenses[0].amount = 12.5), 'expense 1: amount'],
      [(d) => (d.expenses[1].date = '2026-02-30'), 'expense 2: date'],
      [(d) => (d.expenses[0].categoryId = 'nope'), 'expense 1: unknown category'],
      [(d) => (d.expenses[1].id = 'e1'), 'duplicate expense ids'],
      [(d) => (d.categories[0].name = '  '), 'category 1: name'],
      [(d) => (d.categories[0].archived = true), 'no active categories'],
      [(d) => (d.noSpendDays[0].date = 'yesterday'), 'no-spend day 1: date'],
      [(d) => (d.settings.currency = 'XYZW'), 'settings: currency'],
      [(d) => delete d.expenses, 'expenses'],
    ]
    for (const [mutate, where] of cases) {
      expect(errorOf(withData(mutate)), where).toBe(`This backup looks damaged (${where}), so nothing was imported.`)
    }
  })
})

describe('parseBackup cleans up', () => {
  it('drops unknown fields and empty notes', () => {
    const r = parseBackup(
      withData((d) => {
        d.expenses[0].note = '  '
        d.expenses[0].extra = 'x'
        d.categories[0].color = 'red'
      }),
    )
    if (!r.ok) throw new Error(r.error)
    expect('note' in r.data.expenses[0]!).toBe(false)
    expect('extra' in r.data.expenses[0]!).toBe(false)
    expect('color' in r.data.categories[0]!).toBe(false)
  })

  it('drops no-spend marks on days that have expenses, and duplicates', () => {
    const r = parseBackup(withData((d) => (d.noSpendDays = [{ date: '2026-10-30' }, { date: '2026-10-29' }, { date: '2026-10-29' }])))
    if (!r.ok) throw new Error(r.error)
    expect(r.data.noSpendDays).toEqual([{ date: '2026-10-29' }])
  })
})
