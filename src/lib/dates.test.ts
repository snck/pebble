import { describe, expect, it } from 'vitest'
import {
  addDays,
  fromISO,
  isCurrentWeek,
  isFuture,
  isInWeek,
  msUntilNextDay,
  relativeDayName,
  relativeWeekName,
  startOfWeek,
  toISO,
  visibleDays,
  weekDays,
} from './dates'

describe('test environment', () => {
  it('runs in a DST-observing zone', () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).not.toBe(new Date(2026, 6, 1).getTimezoneOffset())
  })
})

describe('toISO / fromISO', () => {
  it('round-trips local dates', () => {
    expect(toISO(fromISO('2026-03-29'))).toBe('2026-03-29')
    expect(toISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toISO(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05')
  })

  it('rejects malformed strings', () => {
    expect(() => fromISO('2026-3-1')).toThrow()
    expect(() => fromISO('')).toThrow()
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
  })

  it('is unaffected by DST transitions', () => {
    // Europe/London: clocks go forward 2026-03-29, back 2026-10-25.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addDays('2026-10-26', -7)).toBe('2026-10-19')
  })
})

describe('startOfWeek', () => {
  it('returns Monday for every day of the week', () => {
    for (const d of weekDays('2026-10-26')) expect(startOfWeek(d)).toBe('2026-10-26')
  })

  it('treats Sunday as the last day of the week, not the first', () => {
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26')
    expect(startOfWeek('2026-11-02')).toBe('2026-11-02')
  })

  it('handles weeks spanning a year boundary', () => {
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28')
  })
})

describe('weekDays', () => {
  it('lists 7 consecutive days from Monday, across a DST change', () => {
    expect(weekDays('2026-10-19')).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })
})

describe('week membership', () => {
  it('isInWeek includes both ends', () => {
    expect(isInWeek('2026-10-26', '2026-10-26')).toBe(true)
    expect(isInWeek('2026-11-01', '2026-10-26')).toBe(true)
    expect(isInWeek('2026-11-02', '2026-10-26')).toBe(false)
    expect(isInWeek('2026-10-25', '2026-10-26')).toBe(false)
  })

  it('isCurrentWeek', () => {
    expect(isCurrentWeek('2026-10-26', '2026-10-31')).toBe(true)
    expect(isCurrentWeek('2026-10-19', '2026-10-31')).toBe(false)
  })

  it('isFuture', () => {
    expect(isFuture('2026-11-01', '2026-10-31')).toBe(true)
    expect(isFuture('2026-10-31', '2026-10-31')).toBe(false)
  })
})

describe('visibleDays', () => {
  it('hides future days and lists newest first', () => {
    expect(visibleDays('2026-10-26', '2026-10-28')).toEqual(['2026-10-28', '2026-10-27', '2026-10-26'])
  })

  it('shows the whole week for past weeks', () => {
    const days = visibleDays('2026-10-19', '2026-10-31')
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-10-25')
  })
})

describe('relative names', () => {
  it('names today and yesterday only', () => {
    expect(relativeDayName('2026-10-31', '2026-10-31')).toBe('Today')
    expect(relativeDayName('2026-10-30', '2026-10-31')).toBe('Yesterday')
    expect(relativeDayName('2026-10-29', '2026-10-31')).toBeNull()
  })

  it('names this week and last week only', () => {
    expect(relativeWeekName('2026-10-26', '2026-11-01')).toBe('This week')
    expect(relativeWeekName('2026-10-19', '2026-11-01')).toBe('Last week')
    expect(relativeWeekName('2026-10-12', '2026-11-01')).toBeNull()
  })
})

describe('msUntilNextDay', () => {
  it('counts to local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 9, 31, 23, 0))).toBe(60 * 60 * 1000)
  })

  it('accounts for a 25-hour day when clocks go back', () => {
    expect(msUntilNextDay(new Date(2026, 9, 25, 0, 0))).toBe(25 * 60 * 60 * 1000)
  })
})
