import { useEffect, useState } from 'react'

/**
 * Height of the on-screen keyboard overlapping the layout viewport. iOS Safari
 * doesn't resize the layout viewport for the keyboard, so a bottom sheet needs
 * this to sit above it. (Android resizes content via `interactive-widget`.)
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
