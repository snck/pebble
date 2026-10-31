import { describe, expect, it } from 'vitest'
import type { Category } from '../db/types'
import { lastGrapheme, nextOrder, normalizeCategoryName, validateCategoryName } from './categories'

const cat = (id: string, name: string, archived = false, order = 0): Category => ({
  id,
  name,
  isFixed: false,
  order,
  archived,
})

describe('normalizeCategoryName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeCategoryName('  Eating   out ')).toBe('Eating out')
  })
})

describe('lastGrapheme', () => {
  it('keeps the last character, treating emoji sequences as one', () => {
    expect(lastGrapheme('🍜')).toBe('🍜')
    expect(lastGrapheme('🍜🚌')).toBe('🚌')
    expect(lastGrapheme('👩‍👩‍👧')).toBe('👩‍👩‍👧')
    expect(lastGrapheme('🏳️‍🌈')).toBe('🏳️‍🌈')
    expect(lastGrapheme('👍🏽')).toBe('👍🏽')
    expect(lastGrapheme('ab')).toBe('b')
    expect(lastGrapheme('  ')).toBe('')
  })
})

describe('validateCategoryName', () => {
  const categories = [cat('a', 'Food'), cat('b', 'Old', true)]

  it('requires a name', () => {
    expect(validateCategoryName('', categories)).toBe('empty-name')
  })

  it('rejects a duplicate of an active category, ignoring case', () => {
    expect(validateCategoryName('food', categories)).toBe('duplicate-name')
  })

  it('allows keeping your own name, and reusing an archived name', () => {
    expect(validateCategoryName('Food', categories, 'a')).toBeNull()
    expect(validateCategoryName('Old', categories)).toBeNull()
  })
})

describe('nextOrder', () => {
  it('goes after every category, archived included', () => {
    expect(nextOrder([cat('a', 'A', false, 3), cat('b', 'B', true, 7)])).toBe(8)
    expect(nextOrder([])).toBe(0)
  })
})
