import { useEffect, useRef } from 'react'
import type { Category, Expense } from '../db/types'
import { formatDate } from '../lib/dates'
import { formatAmount } from '../lib/money'

interface Props {
  category: Category
  monthLabel: string
  /** This category's expenses for the month, in any order. */
  expenses: Expense[]
  currency: string
  onClose(): void
}

/** Read-only list of one category's expenses for a month. Individual amounts only, never a sum. */
export function CategorySheet({ category, monthLabel, expenses, currency, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus({ preventScroll: true }), [])

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  return (
    <>
      <div className="backdrop is-open fade-in" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet is-open slide-in category-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-sheet-title"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="sheet-header">
          <span className="sheet-header-spacer" />
          <h2 id="category-sheet-title">
            {category.emoji && <span aria-hidden="true">{category.emoji} </span>}
            {category.name}
          </h2>
          <button ref={closeRef} type="button" className="text-button" onClick={onClose}>
            Done
          </button>
        </div>
        <p className="category-sheet-month">{monthLabel}</p>
        <ul className="expense-list category-sheet-list">
          {sorted.map((e) => (
            <li key={e.id} className="expense-row">
              <span className="expense-text">
                <span>{formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                {e.note && <span className="expense-note">{e.note}</span>}
              </span>
              <span className="expense-amount">{formatAmount(e.amount, currency)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
