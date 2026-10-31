import { describe, expect, it } from 'vitest'
import { defaultCurrency } from './defaultCurrency'

describe('defaultCurrency', () => {
  it('maps the locale region to its currency', () => {
    expect(defaultCurrency('th-TH')).toBe('THB')
    expect(defaultCurrency('en-GB')).toBe('GBP')
    expect(defaultCurrency('de-DE')).toBe('EUR')
    expect(defaultCurrency('ja')).toBe('JPY')
  })

  it('falls back to USD', () => {
    expect(defaultCurrency('en')).toBe('USD')
    expect(defaultCurrency('xx-AQ')).toBe('USD')
    expect(defaultCurrency('not a locale')).toBe('USD')
  })
})
