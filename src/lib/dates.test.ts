import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  endOfMonth,
  formatMonth,
  isCurrentMonth,
  monthOf,
  relativeMonthName,
  startOfMonth,
  fromISO,
  isCurrentWeek,
  isFuture,
  isInWeek,
  isValidISODate,
  msUntilNextDay,
  relativeDayName,
  relativeWeekName,
  shiftWeeks,
  startOfWeek,
  toISO,
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

describe('shiftWeeks', () => {
  it('keeps the weekday when moving between weeks', () => {
    expect(shiftWeeks('2026-10-29', -1, '2026-10-31')).toBe('2026-10-22')
    expect(shiftWeeks('2026-10-22', 1, '2026-10-31')).toBe('2026-10-29')
    expect(shiftWeeks('2026-10-29', -3, '2026-10-31')).toBe('2026-10-08')
  })

  it('moves back to today rather than landing in the future', () => {
    // Sunday of last week -> Sunday this week is tomorrow.
    expect(shiftWeeks('2026-10-25', 1, '2026-10-31')).toBe('2026-10-31')
    expect(shiftWeeks('2026-10-31', 1, '2026-10-31')).toBe('2026-10-31')
  })

  it('crosses a year boundary', () => {
    expect(shiftWeeks('2027-01-01', -1, '2027-01-05')).toBe('2026-12-25')
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

describe('months', () => {
  it('derives the month of a date', () => {
    expect(monthOf('2026-10-31')).toBe('2026-10')
  })

  it('finds month boundaries, including leap-year February', () => {
    expect(startOfMonth('2026-10')).toBe('2026-10-01')
    expect(endOfMonth('2026-10')).toBe('2026-10-31')
    expect(endOfMonth('2026-11')).toBe('2026-11-30')
    expect(endOfMonth('2026-02')).toBe('2026-02-28')
    expect(endOfMonth('2028-02')).toBe('2028-02-29')
    expect(endOfMonth('2026-12')).toBe('2026-12-31')
    // Month containing a DST change (Europe/London, 29 Mar 2026).
    expect(endOfMonth('2026-03')).toBe('2026-03-31')
  })

  it('adds months across year boundaries', () => {
    expect(addMonths('2026-10', -1)).toBe('2026-09')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-10', -14)).toBe('2025-08')
  })

  it('names this month and last month only', () => {
    expect(isCurrentMonth('2026-10', '2026-10-31')).toBe(true)
    expect(isCurrentMonth('2026-09', '2026-10-31')).toBe(false)
    expect(relativeMonthName('2026-10', '2026-10-31')).toBe('This month')
    expect(relativeMonthName('2026-09', '2026-10-01')).toBe('Last month')
    expect(relativeMonthName('2025-12', '2026-01-15')).toBe('Last month')
    expect(relativeMonthName('2026-08', '2026-10-31')).toBeNull()
  })

  it('formats a month label', () => {
    expect(formatMonth('2026-10', 'en-US')).toBe('October 2026')
  })
})

describe('isValidISODate', () => {
  it('accepts real dates only', () => {
    expect(isValidISODate('2026-10-31')).toBe(true)
    expect(isValidISODate('2028-02-29')).toBe(true)
    expect(isValidISODate('2026-02-29')).toBe(false)
    expect(isValidISODate('2026-02-30')).toBe(false)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('2026-1-01')).toBe(false)
    expect(isValidISODate('2026-10-31T00:00')).toBe(false)
    expect(isValidISODate(20261031)).toBe(false)
  })
})
