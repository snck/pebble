import type { Category, Expense } from '../db/types'
import { formatDate, relativeDayName } from '../lib/dates'
import { formatAmount } from '../lib/money'
import { EmptyState } from './EmptyState'

interface Props {
  /** The selected day. */
  date: string
  today: string
  /** That day's expenses, in any order. */
  expenses: Expense[]
  isNoSpend: boolean
  categoriesById: Map<string, Category>
  currency: string
  onEdit(expense: Expense): void
  onMarkNoSpend(date: string): void
  onUnmarkNoSpend(date: string): void
}

export function ExpenseList({
  date,
  today,
  expenses,
  isNoSpend,
  categoriesById,
  currency,
  onEdit,
  onMarkNoSpend,
  onUnmarkNoSpend,
}: Props) {
  const relative = relativeDayName(date, today)
  const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <section className="day" aria-labelledby="day-heading">
      <h2 className="day-heading" id="day-heading">
        <span>{relative ?? formatDate(date, { weekday: 'long' })}</span>
        <span className="day-date">{formatDate(date, { day: 'numeric', month: 'short' })}</span>
      </h2>
      {sorted.length > 0 ? (
        <ul className="expense-list">
          {sorted.map((e) => (
            <li key={e.id}>
              <ExpenseRow
                expense={e}
                category={categoriesById.get(e.categoryId)}
                currency={currency}
                onEdit={onEdit}
              />
            </li>
          ))}
        </ul>
      ) : isNoSpend ? (
        <EmptyState art="🌿" title="No-spend day" hint="Nothing spent on this day." positive>
          <button type="button" className="text-button" onClick={() => onUnmarkNoSpend(date)}>
            Unmark
          </button>
        </EmptyState>
      ) : (
        <EmptyState title="Nothing here yet" hint="Add an expense with +, or mark this as a no-spend day.">
          <button type="button" className="primary-button" onClick={() => onMarkNoSpend(date)}>
            Mark as no-spend day
          </button>
        </EmptyState>
      )}
    </section>
  )
}

interface ExpenseRowProps {
  expense: Expense
  category: Category | undefined
  currency: string
  onEdit(expense: Expense): void
}

function ExpenseRow({ expense, category, currency, onEdit }: ExpenseRowProps) {
  return (
    <button type="button" className="expense-row" onClick={() => onEdit(expense)}>
      <span className="expense-emoji" aria-hidden="true">
        {category?.emoji ?? '•'}
      </span>
      <span className="expense-text">
        <span className="expense-category">{category?.name ?? 'Uncategorized'}</span>
        {expense.note && <span className="expense-note">{expense.note}</span>}
      </span>
      <span className="expense-amount">{formatAmount(expense.amount, currency)}</span>
    </button>
  )
}

