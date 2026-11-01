import { useImperativeHandle, useRef, useState, type FormEvent, type Ref } from 'react'
import type { Category, Expense, ExpenseInput } from '../db/types'
import { useScrollLock } from '../hooks/useScrollLock'
import { sheetViewportStyle, useVisualViewport } from '../hooks/useVisualViewport'
import { currencySymbol, parseAmount, toAmountInput } from '../lib/money'

export type SheetTarget = { mode: 'add'; date: string } | { mode: 'edit'; expense: Expense }

export interface ExpenseSheetHandle {
  open(target: SheetTarget): void
}

interface Props {
  ref: Ref<ExpenseSheetHandle>
  categories: Category[]
  categoriesById: Map<string, Category>
  currency: string
  today: string
  onSave(input: ExpenseInput, id?: string): void
  onDelete(id: string): void
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function ExpenseSheet({ ref, categories, categoriesById, currency, today, onSave, onDelete }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<SheetTarget>({ mode: 'add', date: today })
  const [amountText, setAmountText] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')

  const sheetRef = useRef<HTMLDivElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const viewport = useVisualViewport()
  useScrollLock(isOpen)

  // The sheet stays mounted so `open` can focus the amount field synchronously
  // inside the tap handler; iOS only raises the keyboard for a focus that
  // happens during a user gesture.
  useImperativeHandle(ref, () => ({
    open(next) {
      setTarget(next)
      if (next.mode === 'add') {
        setAmountText('')
        setCategoryId(null)
        setDate(next.date)
        setNote('')
      } else {
        setAmountText(toAmountInput(next.expense.amount, currency))
        setCategoryId(next.expense.categoryId)
        setDate(next.expense.date)
        setNote(next.expense.note ?? '')
      }
      setIsOpen(true)
      bodyRef.current?.scrollTo(0, 0) // it stays mounted, so undo last time's scroll
      if (sheetRef.current) sheetRef.current.inert = false
      if (next.mode === 'add') amountRef.current?.focus({ preventScroll: true })
    },
  }))

  function close() {
    setIsOpen(false)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  const amount = parseAmount(amountText, currency)
  const dateValid = ISO_DATE.test(date) && date <= today
  const canSave = amount !== null && categoryId !== null && dateValid

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    onSave({ amount, categoryId, date, note }, target.mode === 'edit' ? target.expense.id : undefined)
    close()
  }

  // An archived category stays selectable when editing an expense that uses it.
  const editingCategory = target.mode === 'edit' ? categoriesById.get(target.expense.categoryId) : undefined
  const chips = editingCategory?.archived ? [...categories, editingCategory] : categories

  return (
    <>
      <div className={`backdrop${isOpen ? ' is-open' : ''}`} onClick={close} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`sheet expense-sheet${isOpen ? ' is-open' : ''}${viewport.keyboardInset > 0 ? ' has-keyboard' : ''}`}
        style={sheetViewportStyle(viewport)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        inert={!isOpen}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <form onSubmit={handleSubmit}>
          <div className="sheet-header">
            <button type="button" className="text-button" onClick={close}>
              Cancel
            </button>
            <h2 id="sheet-title">{target.mode === 'add' ? 'New expense' : 'Edit expense'}</h2>
            {target.mode === 'edit' ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onDelete(target.expense.id)
                  close()
                }}
              >
                Delete
              </button>
            ) : (
              <span className="sheet-header-spacer" />
            )}
          </div>

          <label className="amount-field">
            <span className="amount-symbol">{currencySymbol(currency)}</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              aria-label="Amount"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </label>

          {/* Header, amount and Save stay put; this part scrolls if the keyboard leaves too little room. */}
          <div ref={bodyRef} className="sheet-body">
            <div className="chips" role="radiogroup" aria-label="Category">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === categoryId}
                  className={`chip${c.id === categoryId ? ' is-selected' : ''}`}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.emoji && <span aria-hidden="true">{c.emoji}</span>} {c.name}
                </button>
              ))}
            </div>

            <div className="sheet-row">
              <input
                type="date"
                aria-label="Date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                type="text"
                aria-label="Note"
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="save-button" disabled={!canSave}>
            Save
          </button>
        </form>
      </div>
    </>
  )
}
