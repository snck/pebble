// Amounts are integers in minor units (e.g. 12.50 → 1250). Conversion to and
// from decimal strings happens only here, at the input/display edges.

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, locale?: string): Intl.NumberFormat {
  const key = `${locale ?? ''}|${currency}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, { style: 'currency', currency })
    formatters.set(key, f)
  }
  return f
}

/** Number of minor-unit digits for a currency (USD/THB 2, JPY 0). */
export function fractionDigits(currency: string): number {
  return formatter(currency, 'en').resolvedOptions().maximumFractionDigits ?? 2
}

export function formatAmount(minor: number, currency: string, locale?: string): string {
  return formatter(currency, locale).format(minor / 10 ** fractionDigits(currency))
}

export function currencySymbol(currency: string, locale?: string): string {
  const part = formatter(currency, locale)
    .formatToParts(0)
    .find((p) => p.type === 'currency')
  return part?.value ?? currency
}

/**
 * Parse what the user typed into minor units. Accepts `.` or `,` as the
 * decimal separator, and treats a separator followed by exactly three digits
 * as a thousands separator when the currency can't have three decimals
 * (so "1,000" is 1000, not 1.000). Returns null for anything invalid or ≤ 0.
 */
export function parseAmount(input: string, currency: string): number | null {
  const s = input.replace(/\s/g, '')
  if (!/^[\d.,]+$/.test(s)) return null

  const digits = fractionDigits(currency)
  const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','))
  let intPart = s
  let fracPart = ''
  if (lastSep !== -1) {
    intPart = s.slice(0, lastSep)
    fracPart = s.slice(lastSep + 1)
    if (fracPart.length > digits) {
      if (fracPart.length !== 3) return null
      intPart += fracPart
      fracPart = ''
    }
  }
  intPart = intPart.replace(/[.,]/g, '')
  if (intPart === '' && fracPart === '') return null

  const minor = Number((intPart || '0') + fracPart.padEnd(digits, '0'))
  if (!Number.isSafeInteger(minor) || minor <= 0) return null
  return minor
}

/** Minor units → an editable string, e.g. 1250 → "12.50". */
export function toAmountInput(minor: number, currency: string): string {
  const digits = fractionDigits(currency)
  if (digits === 0) return String(minor)
  const unit = 10 ** digits
  return `${Math.trunc(minor / unit)}.${String(minor % unit).padStart(digits, '0')}`
}

/**
 * Re-expresses minor units for a currency with a different number of decimals,
 * keeping the number the user typed: 150000 (1,500.00) at 2 digits becomes
 * 1500 at 0 digits. Going to fewer digits rounds, and never below 1.
 */
export function rescaleMinor(minor: number, fromDigits: number, toDigits: number): number {
  if (toDigits >= fromDigits) return minor * 10 ** (toDigits - fromDigits)
  return Math.max(1, Math.round(minor / 10 ** (fromDigits - toDigits)))
}
