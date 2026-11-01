import { useEffect } from 'react'

let locks = 0

/**
 * Stops the page behind an open sheet from scrolling (including the scrolling
 * iOS does when an input gets focus). Counted, so stacked sheets work.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (locks++ === 0) document.documentElement.classList.add('scroll-locked')
    return () => {
      if (--locks === 0) document.documentElement.classList.remove('scroll-locked')
    }
  }, [active])
}
