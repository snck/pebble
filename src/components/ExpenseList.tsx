import type { Category, Expense } from '../db/types'
import { formatDate, relativeDayName, visibleDays } from '../lib/dates'
import { formatAmount } from '../lib/money'

interface DayActions {
  onAdd(date: string): void
  onEdit(expense: Expense): void
  onMarkNoSpend(date: string): void
  onUnmarkNoSpend(date: string): void
}

interface Props extends DayActions {
  weekStart: string
  today: string
  expenses: Expense[]
  noSpendDates: Set<string>
  categoriesById: Map<string, Category>
  currency: string
}

function groupByDate(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>()
  for (const e of expenses) {
    const group = groups.get(e.date)
    if (group) group.push(e)
    else groups.set(e.date, [e])
  }
  for (const group of groups.values()) group.sort((a, b) => b.createdAt - a.createdAt)
  return groups
}

export function ExpenseList({ weekStart, today, expenses, noSpendDates, ...rest }: Props) {
  const byDate = groupByDate(expenses)

  return (
    <div className="days">
      {visibleDays(weekStart, today).map((date) => (
        <DaySection
          key={date}
          date={date}
          today={today}
          expenses={byDate.get(date) ?? []}
          isNoSpend={noSpendDates.has(date)}
          {...rest}
        />
      ))}
    </div>
  )
}

interface DaySectionProps extends DayActions {
  date: string
  today: string
  expenses: Expense[]
  isNoSpend: boolean
  categoriesById: Map<string, Category>
  currency: string
}

function DaySection({
  date,
  today,
  expenses,
  isNoSpend,
  categoriesById,
  currency,
  onAdd,
  onEdit,
  onMarkNoSpend,
  onUnmarkNoSpend,
}: DaySectionProps) {
  const relative = relativeDayName(date, today)

  return (
    <section className="day" id={`day-${date}`} aria-labelledby={`day-${date}-heading`}>
      <h2 className="day-heading" id={`day-${date}-heading`}>
        <span>{relative ?? formatDate(date, { weekday: 'long' })}</span>
        <span className="day-date">{formatDate(date, { day: 'numeric', month: 'short' })}</span>
      </h2>
      {expenses.length > 0 ? (
        <ul className="expense-list">
          {expenses.map((e) => (
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
        <div className="day-empty is-no-spend">
          <span>
            <span aria-hidden="true">🌿</span> No-spend day
          </span>
          <div className="day-actions">
            <button type="button" className="pill-button" onClick={() => onAdd(date)}>
              Add expense
            </button>
            <button type="button" className="text-button" onClick={() => onUnmarkNoSpend(date)}>
              Unmark
            </button>
          </div>
        </div>
      ) : (
        <div className="day-empty">
          <span>Nothing here yet</span>
          <div className="day-actions">
            <button type="button" className="pill-button" onClick={() => onAdd(date)}>
              Add expense
            </button>
            <button type="button" className="pill-button" onClick={() => onMarkNoSpend(date)}>
              Mark as no-spend day
            </button>
          </div>
        </div>
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
