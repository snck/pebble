// Intl has no locale → currency lookup, so map the locale's region ourselves.

const EURO_REGIONS = [
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT',
  'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
]

const REGION_CURRENCY: Record<string, string> = {
  ...Object.fromEntries(EURO_REGIONS.map((r) => [r, 'EUR'])),
  AE: 'AED', AR: 'ARS', AU: 'AUD', BR: 'BRL', CA: 'CAD', CH: 'CHF', CL: 'CLP',
  CN: 'CNY', CO: 'COP', CZ: 'CZK', DK: 'DKK', EG: 'EGP', GB: 'GBP', HK: 'HKD',
  HU: 'HUF', ID: 'IDR', IL: 'ILS', IN: 'INR', JP: 'JPY', KE: 'KES', KR: 'KRW',
  MX: 'MXN', MY: 'MYR', NG: 'NGN', NO: 'NOK', NZ: 'NZD', PH: 'PHP', PL: 'PLN',
  RU: 'RUB', SA: 'SAR', SE: 'SEK', SG: 'SGD', TH: 'THB', TR: 'TRY', TW: 'TWD',
  UA: 'UAH', US: 'USD', VN: 'VND', ZA: 'ZAR',
}

export function defaultCurrency(locale: string = globalThis.navigator?.language ?? 'en-US'): string {
  try {
    const region = new Intl.Locale(locale).maximize().region
    return (region && REGION_CURRENCY[region]) || 'USD'
  } catch {
    return 'USD'
  }
}
