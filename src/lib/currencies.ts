export interface CurrencyOption {
  code: string
  name: string
}

// Used only if the browser can't list currencies (Intl.supportedValuesOf).
const FALLBACK_CODES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'IDR', 'ILS', 'INR',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'SEK', 'SGD', 'THB', 'TRY', 'TWD',
  'USD', 'VND', 'ZAR',
]

/** Every currency the browser knows, with localized names, sorted by name. */
export function listCurrencies(locale?: string): CurrencyOption[] {
  const codes = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('currency') : FALLBACK_CODES
  const names = new Intl.DisplayNames(locale, { type: 'currency' })
  return codes
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}

/** Case-insensitive match on code or name. */
export function filterCurrencies(options: CurrencyOption[], query: string): CurrencyOption[] {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return options
  return options.filter((o) => o.code.toLocaleLowerCase().includes(q) || o.name.toLocaleLowerCase().includes(q))
}
