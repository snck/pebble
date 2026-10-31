import { useRef, useState, type ChangeEvent } from 'react'
import { CategoryEditSheet } from '../components/CategoryEditSheet'
import { CurrencySheet } from '../components/CurrencySheet'
import { ImportConfirmSheet } from '../components/ImportConfirmSheet'
import { exportAll, moveCategory, replaceAll, restoreCategory } from '../db/repo'
import type { Category, Settings } from '../db/types'
import type { Categories } from '../hooks/data'
import { backupFileName, parseBackup, serializeBackup, type BackupData } from '../lib/backup'
import { CATEGORY_ERROR_MESSAGE, type CategoryError } from '../lib/categories'
import { todayISO } from '../lib/dates'
import { saveFile } from '../lib/saveFile'

interface Props {
  categories: Categories
  settings: Settings
}

interface PendingImport {
  data: BackupData
  exportedAt: string
  current: { expenses: number; categories: number }
}

export function SettingsScreen({ categories, settings }: Props) {
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [reordering, setReordering] = useState(false)
  const [choosingCurrency, setChoosingCurrency] = useState(false)
  const [restoreError, setRestoreError] = useState<CategoryError | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [dataMessage, setDataMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currencyName = new Intl.DisplayNames(undefined, { type: 'currency' }).of(settings.currency)

  async function handleRestore(id: string) {
    setRestoreError(await restoreCategory(id))
  }

  async function handleExport() {
    const json = serializeBackup(await exportAll(), new Date())
    await saveFile(new File([json], backupFileName(todayISO()), { type: 'application/json' }))
  }

  async function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again still fires
    if (!file) return
    setDataMessage(null)
    const parsed = parseBackup(await file.text())
    if (!parsed.ok) {
      setDataMessage(parsed.error)
      return
    }
    const current = await exportAll()
    setPendingImport({
      data: parsed.data,
      exportedAt: parsed.exportedAt,
      current: { expenses: current.expenses.length, categories: current.categories.length },
    })
  }

  async function handleConfirmImport() {
    if (!pendingImport) return
    await replaceAll(pendingImport.data)
    const n = pendingImport.data.expenses.length
    setPendingImport(null)
    setDataMessage(`Backup restored: ${n} ${n === 1 ? 'expense' : 'expenses'}.`)
  }

  return (
    <>
      <header className="screen-header">
        <div className="screen-title-bar">
          <h1 className="period-title">Settings</h1>
        </div>
      </header>

      <main className="settings">
        <section className="settings-section" aria-labelledby="categories-heading">
          <div className="section-head">
            <h2 id="categories-heading">Categories</h2>
            <button type="button" className="text-button" onClick={() => setReordering(!reordering)}>
              {reordering ? 'Done' : 'Reorder'}
            </button>
          </div>
          <ul className="settings-list">
            {categories.active.map((c, i) => (
              <li key={c.id}>
                {reordering ? (
                  <div className="settings-row">
                    <CategoryLabel category={c} />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${c.name} up`}
                      disabled={i === 0}
                      onClick={() => void moveCategory(c.id, -1)}
                    >
                      <Chevron up />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${c.name} down`}
                      disabled={i === categories.active.length - 1}
                      onClick={() => void moveCategory(c.id, 1)}
                    >
                      <Chevron />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="settings-row" onClick={() => setEditing(c)}>
                    <CategoryLabel category={c} />
                    <span className="settings-row-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                )}
              </li>
            ))}
            {!reordering && (
              <li>
                <button type="button" className="settings-row settings-row-add" onClick={() => setEditing('new')}>
                  + Add category
                </button>
              </li>
            )}
          </ul>

          {categories.archived.length > 0 && (
            <details className="archived">
              <summary>Archived ({categories.archived.length})</summary>
              <ul className="settings-list">
                {categories.archived.map((c) => (
                  <li key={c.id} className="settings-row">
                    <CategoryLabel category={c} />
                    <button type="button" className="text-button" onClick={() => void handleRestore(c.id)}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
              {restoreError && (
                <p className="form-error" role="alert">
                  {CATEGORY_ERROR_MESSAGE[restoreError]} Rename one of them first.
                </p>
              )}
            </details>
          )}
        </section>

        <section className="settings-section" aria-labelledby="currency-heading">
          <div className="section-head">
            <h2 id="currency-heading">Currency</h2>
          </div>
          <ul className="settings-list">
            <li>
              <button type="button" className="settings-row" onClick={() => setChoosingCurrency(true)}>
                <span className="settings-row-main">{currencyName}</span>
                <span className="settings-row-detail">{settings.currency}</span>
                <span className="settings-row-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          </ul>
        </section>

        <section className="settings-section" aria-labelledby="data-heading">
          <div className="section-head">
            <h2 id="data-heading">Your data</h2>
          </div>
          <ul className="settings-list">
            <li>
              <button type="button" className="settings-row" onClick={() => void handleExport()}>
                <span className="settings-row-main">Export backup</span>
              </button>
            </li>
            <li>
              <button type="button" className="settings-row" onClick={() => fileInputRef.current?.click()}>
                <span className="settings-row-main">Import backup</span>
              </button>
            </li>
          </ul>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => void handleFileChosen(e)}
          />
          <p className="field-hint section-note">
            Everything is stored only on this device. Export a backup now and then, and keep it somewhere safe.
          </p>
          <p className="form-error" role="status" hidden={!dataMessage}>
            {dataMessage}
          </p>
        </section>
      </main>

      {editing && (
        <CategoryEditSheet category={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {choosingCurrency && <CurrencySheet current={settings.currency} onClose={() => setChoosingCurrency(false)} />}
      {pendingImport && (
        <ImportConfirmSheet
          current={pendingImport.current}
          incoming={pendingImport.data}
          exportedAt={pendingImport.exportedAt}
          onExportFirst={() => void handleExport()}
          onConfirm={() => void handleConfirmImport()}
          onClose={() => setPendingImport(null)}
        />
      )}
    </>
  )
}

function CategoryLabel({ category }: { category: Category }) {
  return (
    <span className="settings-row-main">
      <span className="settings-row-emoji" aria-hidden="true">
        {category.emoji ?? '•'}
      </span>
      {category.name}
      {category.isFixed && <span className="report-tag">Fixed</span>}
    </span>
  )
}

function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
