import type { Category, Expense } from '../db/types'
import { formatDate } from '../lib/dates'
import { formatAmount } from '../lib/money'
import { Sheet } from './Sheet'

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
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  return (
    <Sheet
      title={
        <>
          {category.emoji && <span aria-hidden="true">{category.emoji} </span>}
          {category.name}
        </>
      }
      end={
        <button type="button" className="text-button" onClick={onClose}>
          Done
        </button>
      }
      onClose={onClose}
      className="tall-sheet"
    >
      <p className="sheet-subtitle">{monthLabel}</p>
      <ul className="expense-list sheet-scroll">
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
    </Sheet>
  )
}
