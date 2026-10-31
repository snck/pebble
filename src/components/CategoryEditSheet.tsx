import { useId, useState, type FormEvent } from 'react'
import { addCategory, archiveCategory, updateCategory } from '../db/repo'
import type { Category } from '../db/types'
import {
  CATEGORY_ERROR_MESSAGE,
  lastGrapheme,
  MAX_CATEGORY_NAME,
  normalizeCategoryName,
  type CategoryError,
} from '../lib/categories'
import { Sheet } from './Sheet'

interface Props {
  /** The category to edit, or undefined to add a new one. */
  category?: Category
  onClose(): void
}

export function CategoryEditSheet({ category, onClose }: Props) {
  const formId = useId()
  const [name, setName] = useState(category?.name ?? '')
  const [emoji, setEmoji] = useState(category?.emoji ?? '')
  const [isFixed, setIsFixed] = useState(category?.isFixed ?? false)
  const [error, setError] = useState<CategoryError | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const input = { name, emoji, isFixed }
    const result = category ? await updateCategory(category.id, input) : await addCategory(input)
    if (result) setError(result)
    else onClose()
  }

  async function handleArchive() {
    if (!category) return
    const result = await archiveCategory(category.id)
    if (result) setError(result)
    else onClose()
  }

  return (
    <Sheet
      title={category ? 'Edit category' : 'New category'}
      start={
        <button type="button" className="text-button" onClick={onClose}>
          Cancel
        </button>
      }
      end={
        <button type="submit" form={formId} className="text-button" disabled={!normalizeCategoryName(name)}>
          Save
        </button>
      }
      onClose={onClose}
    >
      <form id={formId} className="sheet-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label className="field emoji-field">
            <span className="field-label">Emoji</span>
            <input
              className="text-input"
              value={emoji}
              placeholder="🙂"
              autoComplete="off"
              onChange={(e) => setEmoji(lastGrapheme(e.target.value))}
            />
          </label>
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="text-input"
              value={name}
              maxLength={MAX_CATEGORY_NAME}
              autoComplete="off"
              autoFocus={!category}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          </label>
        </div>

        <label className="switch-row">
          <span className="switch-text">
            <span>Fixed cost</span>
            <span className="field-hint">
              Rent, bills and the like. Left out of the report unless you include fixed costs. Applies to all
              months.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="switch"
            checked={isFixed}
            onChange={(e) => setIsFixed(e.target.checked)}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {CATEGORY_ERROR_MESSAGE[error]}
          </p>
        )}

        {category && !category.archived && (
          <div className="sheet-footer">
            <button type="button" className="text-button" onClick={handleArchive}>
              Archive category
            </button>
            <p className="field-hint">Its past expenses stay as they are. You can restore it any time.</p>
          </div>
        )}
      </form>
    </Sheet>
  )
}
