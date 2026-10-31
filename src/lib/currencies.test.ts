import { describe, expect, it } from 'vitest'
import { filterCurrencies, listCurrencies } from './currencies'

describe('listCurrencies', () => {
  const all = listCurrencies('en')

  it('lists common currencies with readable names', () => {
    expect(all.find((c) => c.code === 'THB')?.name).toBe('Thai Baht')
    expect(all.find((c) => c.code === 'USD')?.name).toBe('US Dollar')
    expect(all.length).toBeGreaterThan(100)
  })

  it('sorts by name', () => {
    const names = all.map((c) => c.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')))
  })
})

describe('filterCurrencies', () => {
  const all = listCurrencies('en')

  it('matches code or name, ignoring case', () => {
    expect(filterCurrencies(all, 'thb').map((c) => c.code)).toEqual(['THB'])
    expect(filterCurrencies(all, 'baht').map((c) => c.code)).toContain('THB')
  })

  it('returns everything for an empty query', () => {
    expect(filterCurrencies(all, '  ')).toHaveLength(all.length)
  })
})
