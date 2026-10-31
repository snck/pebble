import { describe, expect, it } from 'vitest'
import { axisLock, dragOffset, swipeOutcome } from './swipe'

describe('axisLock', () => {
  it('waits until the finger has moved a little', () => {
    expect(axisLock(0, 0)).toBeNull()
    expect(axisLock(6, 6)).toBeNull()
  })

  it('locks to the dominant direction', () => {
    expect(axisLock(15, 4)).toBe('x')
    expect(axisLock(-15, 4)).toBe('x')
    expect(axisLock(4, 15)).toBe('y')
    expect(axisLock(10, 10)).toBe('y') // a true diagonal stays with scrolling
  })
})

describe('swipeOutcome', () => {
  it('maps direction like turning a page', () => {
    expect(swipeOutcome(-80, 400)).toBe('next')
    expect(swipeOutcome(80, 400)).toBe('prev')
  })

  it('commits a slow drag only past the distance threshold', () => {
    expect(swipeOutcome(-59, 1000)).toBeNull()
    expect(swipeOutcome(-60, 1000)).toBe('next')
  })

  it('commits a short quick flick', () => {
    expect(swipeOutcome(-30, 60)).toBe('next')
    expect(swipeOutcome(30, 60)).toBe('prev')
  })

  it('ignores tiny or slow short movements', () => {
    expect(swipeOutcome(-20, 20)).toBeNull()
    expect(swipeOutcome(-30, 300)).toBeNull()
    expect(swipeOutcome(-40, 0)).toBeNull()
  })
})

describe('dragOffset', () => {
  it('follows the finger when allowed and resists when not', () => {
    expect(dragOffset(-100, true)).toBe(-100)
    expect(dragOffset(-100, false)).toBe(-25)
  })
})
