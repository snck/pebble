import type { Category } from '../db/types'

export type CategoryError = 'empty-name' | 'duplicate-name' | 'last-active'

export const CATEGORY_ERROR_MESSAGE: Record<CategoryError, string> = {
  'empty-name': 'Give the category a name.',
  'duplicate-name': 'Another category already has this name.',
  'last-active': 'Keep at least one category, so there is somewhere to log expenses.',
}

export const MAX_CATEGORY_NAME = 40

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** Trims and collapses whitespace. */
export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * The last character the user typed (emoji-aware), so typing a new emoji
 * into the field replaces the old one.
 */
export function lastGrapheme(text: string): string {
  let last = ''
  for (const { segment } of graphemes.segment(text.trim())) last = segment
  return last
}

/** Checks a (normalized) name against the active categories other than `exceptId`. */
export function validateCategoryName(
  name: string,
  categories: Category[],
  exceptId?: string,
): CategoryError | null {
  if (!name) return 'empty-name'
  const key = name.toLocaleLowerCase()
  const taken = categories.some(
    (c) => !c.archived && c.id !== exceptId && c.name.toLocaleLowerCase() === key,
  )
  return taken ? 'duplicate-name' : null
}

/** Order value that puts a category after all others. */
export function nextOrder(categories: Category[]): number {
  return categories.reduce((max, c) => Math.max(max, c.order), -1) + 1
}
