import { useCallback, useLayoutEffect, useRef } from 'react'
import { axisLock, dragOffset, swipeOutcome, type Axis } from '../lib/swipe'

interface Options {
  canNext: boolean
  canPrev: boolean
  /** Finger moved right-to-left. */
  onNext(): void
  /** Finger moved left-to-right. */
  onPrev(): void
}

const SETTLE = 'transform 200ms ease-out, opacity 200ms ease-out'
const ENTER_OFFSET_PX = 48

/**
 * Horizontal swipe on touch (and pen) input. The element follows the finger,
 * then either springs back or calls onNext/onPrev and slides the new content
 * in from that side. Vertical movement is left to the browser via
 * `touch-action: pan-y`, which the element must have in CSS. Mouse input is
 * ignored, so desktop text selection is unaffected.
 *
 * Returns a ref callback for the element.
 */
export function useHorizontalSwipe(options: Options) {
  const latest = useRef(options)
  useLayoutEffect(() => {
    latest.current = options
  })

  return useCallback((el: HTMLElement | null) => {
    if (!el) return

    let start: { x: number; y: number; t: number; id: number } | null = null
    let axis: Axis | null = null
    let dx = 0

    const setOffset = (px: number, animate: boolean) => {
      el.style.transition = animate ? SETTLE : 'none'
      el.style.transform = px ? `translateX(${px}px)` : ''
    }

    const enterFrom = (side: 1 | -1) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setOffset(0, false)
        return
      }
      el.style.transition = 'none'
      el.style.transform = `translateX(${side * ENTER_OFFSET_PX}px)`
      el.style.opacity = '0'
      // Two frames: let the new content render at the offset before animating in.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.style.transition = SETTLE
          el.style.transform = ''
          el.style.opacity = ''
        }),
      )
    }

    // A swipe that starts on a button must not also count as a tap on it.
    const swallowClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const suppressNextClick = () => {
      el.addEventListener('click', swallowClick, { capture: true, once: true })
      setTimeout(() => el.removeEventListener('click', swallowClick, { capture: true }), 400)
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !e.isPrimary) return
      start = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId }
      axis = null
      dx = 0
    }

    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const mx = e.clientX - start.x
      axis ??= axisLock(mx, e.clientY - start.y)
      if (axis !== 'x') return
      dx = mx
      const { canNext, canPrev } = latest.current
      setOffset(dragOffset(dx, dx < 0 ? canNext : canPrev), false)
    }

    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const duration = e.timeStamp - start.t
      start = null
      if (axis !== 'x') return
      suppressNextClick()
      const { canNext, canPrev, onNext, onPrev } = latest.current
      const outcome = swipeOutcome(dx, duration)
      if (outcome === 'next' && canNext) {
        onNext()
        enterFrom(1)
      } else if (outcome === 'prev' && canPrev) {
        onPrev()
        enterFrom(-1)
      } else {
        setOffset(0, true)
      }
    }

    const onCancel = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      start = null
      if (axis === 'x') setOffset(0, true)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
    }
  }, [])
}
