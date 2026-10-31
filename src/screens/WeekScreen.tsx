import { useCallback, useRef, useState } from 'react'
import { ExpenseList } from '../components/ExpenseList'
import { ExpenseSheet, type ExpenseSheetHandle } from '../components/ExpenseSheet'
import { PeriodNav } from '../components/PeriodNav'
import { UndoToast } from '../components/UndoToast'
import { WeekStrip } from '../components/WeekStrip'
import {
  addExpense,
  deleteExpense,
  markNoSpend,
  restoreExpense,
  unmarkNoSpend,
  updateExpense,
} from '../db/repo'
import type { Expense, ExpenseInput, Settings } from '../db/types'
import { useWeekExpenses, useWeekNoSpend, type Categories } from '../hooks/data'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import {
  addDays,
  formatWeekRange,
  isCurrentWeek,
  relativeWeekName,
  shiftWeeks,
  startOfWeek,
} from '../lib/dates'

interface Props {
  today: string
  selectedDate: string
  onSelectDate(date: string): void
  categories: Categories
  settings: Settings
}

export function WeekScreen({ today, selectedDate, onSelectDate, categories, settings }: Props) {
  const [deleted, setDeleted] = useState<Expense | null>(null)
  const sheetRef = useRef<ExpenseSheetHandle>(null)

  const weekStart = startOfWeek(selectedDate)
  const expenses = useWeekExpenses(weekStart)
  const noSpendDates = useWeekNoSpend(weekStart)

  function selectDate(date: string) {
    onSelectDate(date)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  async function handleSave(input: ExpenseInput, id?: string) {
    if (id) await updateExpense(id, input)
    else await addExpense(input)
    selectDate(input.date)
  }

  async function handleDelete(id: string) {
    const expense = await deleteExpense(id)
    if (expense) setDeleted(expense)
  }

  async function handleUndo() {
    if (!deleted) return
    setDeleted(null)
    await restoreExpense(deleted)
    selectDate(deleted.date)
  }

  const dismissToast = useCallback(() => setDeleted(null), [])

  // Swipe the day content to move a day, or the strip to move a week.
  const daySwipeRef = useHorizontalSwipe({
    canNext: selectedDate < today,
    canPrev: true,
    onNext: () => selectDate(addDays(selectedDate, 1)),
    onPrev: () => selectDate(addDays(selectedDate, -1)),
  })
  const weekSwipeRef = useHorizontalSwipe({
    canNext: !isCurrentWeek(weekStart, today),
    canPrev: true,
    onNext: () => selectDate(shiftWeeks(selectedDate, 1, today)),
    onPrev: () => selectDate(shiftWeeks(selectedDate, -1, today)),
  })

  const weekLoaded = expenses && noSpendDates
  const range = formatWeekRange(weekStart)
  const relative = relativeWeekName(weekStart, today)

  return (
    <>
      <header className="screen-header">
        <PeriodNav
          title={relative ?? range}
          subtitle={relative ? range : undefined}
          unit="week"
          canNext={!isCurrentWeek(weekStart, today)}
          onPrev={() => selectDate(shiftWeeks(selectedDate, -1, today))}
          onNext={() => selectDate(shiftWeeks(selectedDate, 1, today))}
        />
        {/* Always mounted, so the header keeps its height; marks appear once loaded. */}
        <WeekStrip
          ref={weekSwipeRef}
          weekStart={weekStart}
          today={today}
          selectedDate={selectedDate}
          loggedDates={new Set(weekLoaded ? expenses.map((e) => e.date) : [])}
          noSpendDates={weekLoaded ? noSpendDates : new Set()}
          onSelect={selectDate}
        />
      </header>

      <main ref={daySwipeRef}>
        {weekLoaded && (
          <ExpenseList
            date={selectedDate}
            today={today}
            expenses={expenses.filter((e) => e.date === selectedDate)}
            isNoSpend={noSpendDates.has(selectedDate)}
            categoriesById={categories.byId}
            currency={settings.currency}
            onEdit={(expense) => sheetRef.current?.open({ mode: 'edit', expense })}
            onMarkNoSpend={(date) => void markNoSpend(date, today)}
            onUnmarkNoSpend={(date) => void unmarkNoSpend(date)}
          />
        )}
      </main>

      <button
        type="button"
        className="fab"
        aria-label="Add expense"
        onClick={() => sheetRef.current?.open({ mode: 'add', date: selectedDate })}
      >
        +
      </button>

      {deleted && (
        <UndoToast key={deleted.id} message="Expense deleted" onUndo={handleUndo} onDismiss={dismissToast} />
      )}

      <ExpenseSheet
        ref={sheetRef}
        categories={categories.active}
        categoriesById={categories.byId}
        currency={settings.currency}
        today={today}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  )
}
