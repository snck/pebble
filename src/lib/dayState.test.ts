import { describe, expect, it } from 'vitest'
import { dayState } from './dayState'

const today = '2026-10-31'

describe('dayState', () => {
  it('reports logged, no-spend and unlogged past days', () => {
    expect(dayState('2026-10-28', today, true, false)).toBe('logged')
    expect(dayState('2026-10-28', today, false, true)).toBe('noSpend')
    expect(dayState('2026-10-28', today, false, false)).toBe('unlogged')
  })

  it('gives today the same states as any past day', () => {
    expect(dayState(today, today, true, false)).toBe('logged')
    expect(dayState(today, today, false, true)).toBe('noSpend')
    expect(dayState(today, today, false, false)).toBe('unlogged')
  })

  it('treats future days as future, whatever is stored', () => {
    expect(dayState('2026-11-01', today, false, false)).toBe('future')
    expect(dayState('2026-11-01', today, true, true)).toBe('future')
  })

  it('lets expenses win if a day somehow has both', () => {
    expect(dayState('2026-10-28', today, true, true)).toBe('logged')
  })
})
