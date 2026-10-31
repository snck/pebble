import { describe, expect, it } from 'vitest'
import { formatAmount, fractionDigits, parseAmount, rescaleMinor, toAmountInput } from './money'

describe('fractionDigits', () => {
  it('reads minor-unit digits from Intl', () => {
    expect(fractionDigits('USD')).toBe(2)
    expect(fractionDigits('THB')).toBe(2)
    expect(fractionDigits('JPY')).toBe(0)
  })
})

describe('parseAmount', () => {
  it('parses whole and decimal amounts into minor units', () => {
    expect(parseAmount('12', 'USD')).toBe(1200)
    expect(parseAmount('12.5', 'USD')).toBe(1250)
    expect(parseAmount('12.50', 'USD')).toBe(1250)
    expect(parseAmount('0.05', 'USD')).toBe(5)
    expect(parseAmount('.5', 'USD')).toBe(50)
    expect(parseAmount('12.', 'USD')).toBe(1200)
  })

  it('accepts a comma as the decimal separator', () => {
    expect(parseAmount('12,50', 'EUR')).toBe(1250)
    expect(parseAmount('12,5', 'EUR')).toBe(1250)
  })

  it('treats a three-digit group as thousands, not decimals', () => {
    expect(parseAmount('1,000', 'USD')).toBe(100000)
    expect(parseAmount('1.000', 'EUR')).toBe(100000)
    expect(parseAmount('1,000.50', 'USD')).toBe(100050)
    expect(parseAmount('1.000,50', 'EUR')).toBe(100050)
    expect(parseAmount('1,500', 'JPY')).toBe(1500)
  })

  it('handles zero-decimal currencies', () => {
    expect(parseAmount('500', 'JPY')).toBe(500)
    expect(parseAmount('500.5', 'JPY')).toBeNull()
  })

  it('ignores whitespace', () => {
    expect(parseAmount(' 12.50 ', 'USD')).toBe(1250)
  })

  it('rejects empty, zero, negative and malformed input', () => {
    for (const input of ['', '.', ',', '0', '0.00', '-5', 'abc', '12a', '1.2345', '1e3']) {
      expect(parseAmount(input, 'USD'), input).toBeNull()
    }
  })
})

describe('toAmountInput', () => {
  it('produces strings parseAmount reads back', () => {
    expect(toAmountInput(1250, 'USD')).toBe('12.50')
    expect(toAmountInput(5, 'USD')).toBe('0.05')
    expect(toAmountInput(1500, 'JPY')).toBe('1500')
    for (const [minor, cur] of [[1250, 'USD'], [5, 'THB'], [100000, 'EUR'], [1500, 'JPY']] as const) {
      expect(parseAmount(toAmountInput(minor, cur), cur)).toBe(minor)
    }
  })
})

describe('formatAmount', () => {
  it('formats minor units with the currency', () => {
    expect(formatAmount(1250, 'USD', 'en-US')).toBe('$12.50')
    expect(formatAmount(1500, 'JPY', 'en-US')).toBe('¥1,500')
  })
})

describe('rescaleMinor', () => {
  it('keeps the typed number when decimals change', () => {
    expect(rescaleMinor(150000, 2, 0)).toBe(1500) // 1,500.00 -> 1,500
    expect(rescaleMinor(1500, 0, 2)).toBe(150000) // 1,500 -> 1,500.00
    expect(rescaleMinor(1250, 2, 2)).toBe(1250)
    expect(rescaleMinor(12345, 3, 2)).toBe(1235)
  })

  it('rounds when dropping decimals, but never to zero', () => {
    expect(rescaleMinor(1250, 2, 0)).toBe(13)
    expect(rescaleMinor(1249, 2, 0)).toBe(12)
    expect(rescaleMinor(5, 2, 0)).toBe(1)
  })
})
