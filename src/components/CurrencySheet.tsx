import { useMemo, useState } from 'react'
import { setCurrency } from '../db/repo'
import { filterCurrencies, listCurrencies } from '../lib/currencies'
import { Sheet } from './Sheet'

interface Props {
  current: string
  onClose(): void
}

export function CurrencySheet({ current, onClose }: Props) {
  const all = useMemo(() => listCurrencies(), [])
  const [query, setQuery] = useState('')
  // The current currency is listed first, so it's visible without searching.
  const options = filterCurrencies(
    [...all.filter((c) => c.code === current), ...all.filter((c) => c.code !== current)],
    query,
  )

  async function choose(code: string) {
    await setCurrency(code)
    onClose()
  }

  return (
    <Sheet
      title="Currency"
      end={
        <button type="button" className="text-button" onClick={onClose}>
          Done
        </button>
      }
      onClose={onClose}
      className="tall-sheet"
    >
      <input
        type="search"
        className="text-input"
        placeholder="Search currencies"
        aria-label="Search currencies"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="field-hint sheet-note">
        Amounts you've logged keep the numbers you typed. Switching to a currency without decimals rounds
        them to whole numbers.
      </p>
      <ul className="settings-list sheet-scroll">
        {options.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              className="settings-row"
              aria-pressed={c.code === current}
              onClick={() => void choose(c.code)}
            >
              <span className="settings-row-main">{c.name}</span>
              <span className="settings-row-detail">{c.code}</span>
              <span className="settings-row-check" aria-hidden="true">
                {c.code === current ? '✓' : ''}
              </span>
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="settings-row settings-row-empty">No currency matches “{query}”.</li>}
      </ul>
    </Sheet>
  )
}
