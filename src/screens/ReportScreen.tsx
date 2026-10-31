import { useState } from 'react'
import { CategorySheet } from '../components/CategorySheet'
import { EmptyState } from '../components/EmptyState'
import { PeriodNav } from '../components/PeriodNav'
import type { Category, Settings } from '../db/types'
import { useMonthExpenses } from '../hooks/data'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { addMonths, formatMonth, isCurrentMonth, relativeMonthName } from '../lib/dates'
import { computeReport, type ReportRow } from '../lib/report'

interface Props {
  today: string
  month: string
  onMonthChange(month: string): void
  includeFixed: boolean
  onIncludeFixedChange(include: boolean): void
  categoriesById: Map<string, Category>
  settings: Settings
}

export function ReportScreen({
  today,
  month,
  onMonthChange,
  includeFixed,
  onIncludeFixedChange,
  categoriesById,
  settings,
}: Props) {
  const expenses = useMonthExpenses(month)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)

  const canNext = !isCurrentMonth(month, today)
  function goToMonth(next: string) {
    onMonthChange(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const swipeRef = useHorizontalSwipe({
    canNext,
    canPrev: true,
    onNext: () => goToMonth(addMonths(month, 1)),
    onPrev: () => goToMonth(addMonths(month, -1)),
  })

  const label = formatMonth(month)
  const relative = relativeMonthName(month, today)
  const report = expenses && computeReport(expenses, categoriesById, includeFixed)
  const openRow = report?.rows.find((r) => r.category.id === openCategoryId)

  return (
    <>
      <header className="screen-header">
        <PeriodNav
          title={relative ?? label}
          subtitle={relative ? label : undefined}
          unit="month"
          canNext={canNext}
          onPrev={() => goToMonth(addMonths(month, -1))}
          onNext={() => goToMonth(addMonths(month, 1))}
        />
      </header>

      <main ref={swipeRef} className="report">
        <h1 className="report-title">Where is my money going?</h1>

        {report && expenses.length > 0 && (
          <label className="switch-row">
            <span>Include fixed costs</span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={includeFixed}
              onChange={(e) => onIncludeFixedChange(e.target.checked)}
            />
          </label>
        )}

        {report &&
          (report.rows.length > 0 ? (
            <>
              <ul className="report-bars">
                {report.rows.map((row) => (
                  <li key={row.category.id}>
                    <ReportBar row={row} onOpen={() => setOpenCategoryId(row.category.id)} />
                  </li>
                ))}
              </ul>
              <p className="report-count">
                Based on {report.expenseCount} {report.expenseCount === 1 ? 'expense' : 'expenses'}
              </p>
            </>
          ) : report.hiddenFixedCount > 0 ? (
            <EmptyState
              title="Only fixed costs so far"
              hint="Turn on “Include fixed costs” to see how they're shared out."
            />
          ) : (
            <EmptyState
              title="Nothing logged this month"
              hint="As you add expenses, you'll see which categories take the biggest share."
            />
          ))}
      </main>

      {openRow && expenses && (
        <CategorySheet
          category={openRow.category}
          monthLabel={label}
          expenses={expenses.filter((e) => e.categoryId === openRow.category.id)}
          currency={settings.currency}
          onClose={() => setOpenCategoryId(null)}
        />
      )}
    </>
  )
}

function ReportBar({ row, onOpen }: { row: ReportRow; onOpen(): void }) {
  const { category, label, fraction } = row
  return (
    <button
      type="button"
      className="report-row"
      aria-label={`${category.name}, ${label} of spending. Show expenses`}
      onClick={onOpen}
    >
      <span className="report-row-top">
        <span className="report-category">
          {category.emoji && <span aria-hidden="true">{category.emoji}</span>}
          {category.name}
          {category.isFixed && <span className="report-tag">Fixed</span>}
        </span>
        <span className="report-percent">{label}</span>
      </span>
      <span className="report-track" aria-hidden="true">
        <span className="report-fill" style={{ width: `${fraction * 100}%` }} />
      </span>
    </button>
  )
}
