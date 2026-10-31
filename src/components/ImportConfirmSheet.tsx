import type { BackupData } from '../lib/backup'
import { Sheet } from './Sheet'

interface Props {
  current: { expenses: number; categories: number }
  incoming: BackupData
  exportedAt: string
  onExportFirst(): void
  onConfirm(): void
  onClose(): void
}

const expenses = (n: number) => `${n} ${n === 1 ? 'expense' : 'expenses'}`
const categories = (n: number) => `${n} ${n === 1 ? 'category' : 'categories'}`

/** The app's one confirm step: replacing everything can't be undone. */
export function ImportConfirmSheet({ current, incoming, exportedAt, onExportFirst, onConfirm, onClose }: Props) {
  const exported = exportedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(exportedAt))
    : null

  return (
    <Sheet
      title="Replace all data?"
      start={
        <button type="button" className="text-button" onClick={onClose}>
          Cancel
        </button>
      }
      onClose={onClose}
    >
      <div className="sheet-form">
        <p className="confirm-text">
          Your {expenses(current.expenses)} and {categories(current.categories)} on this device will be replaced
          with {expenses(incoming.expenses.length)} and {categories(incoming.categories.length)} from this backup
          {exported ? ` (exported ${exported})` : ''}. This can't be undone.
        </p>
        <button type="button" className="primary-button" onClick={onConfirm}>
          Replace with backup
        </button>
        <button type="button" className="text-button" onClick={onExportFirst}>
          Export current data first
        </button>
      </div>
    </Sheet>
  )
}
