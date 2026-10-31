// Pure swipe-gesture rules, kept out of the hook so they can be unit-tested.

/** Movement needed before deciding whether a gesture is horizontal or vertical. */
export const AXIS_SLOP_PX = 10
/** A slow drag commits once it travels this far. */
export const SWIPE_DISTANCE_PX = 60
/** A quick flick commits from this distance if it's fast enough. */
export const FLICK_DISTANCE_PX = 24
/** px per ms. */
export const FLICK_VELOCITY = 0.35

export type Axis = 'x' | 'y'
export type SwipeOutcome = 'next' | 'prev'

/** Which axis a gesture belongs to, or null while it's still too small to tell. */
export function axisLock(dx: number, dy: number): Axis | null {
  if (Math.hypot(dx, dy) < AXIS_SLOP_PX) return null
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}

/**
 * Whether a horizontal gesture should move to the next or previous item.
 * Finger moving right-to-left (dx < 0) goes forward, like turning a page.
 */
export function swipeOutcome(dx: number, durationMs: number): SwipeOutcome | null {
  const distance = Math.abs(dx)
  const fast = durationMs > 0 && distance / durationMs >= FLICK_VELOCITY
  if (distance >= SWIPE_DISTANCE_PX || (distance >= FLICK_DISTANCE_PX && fast)) {
    return dx < 0 ? 'next' : 'prev'
  }
  return null
}

/** How far content follows the finger: 1:1 when allowed, resisting when not. */
export function dragOffset(dx: number, allowed: boolean): number {
  return allowed ? dx : dx / 4
}
