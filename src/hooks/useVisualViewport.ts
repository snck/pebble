import { useEffect, useState, type CSSProperties } from 'react'

export interface VisualViewportState {
  /** Height of the on-screen keyboard covering the bottom of the layout viewport. */
  keyboardInset: number
  /** Height of the area the user can actually see (above the keyboard). */
  visibleHeight: number
}

function read(): VisualViewportState {
  const vv = window.visualViewport
  // Pinch-zoom also shrinks the visual viewport; don't mistake it for a keyboard.
  if (!vv || vv.scale > 1.01) return { keyboardInset: 0, visibleHeight: window.innerHeight }
  return {
    keyboardInset: Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)),
    visibleHeight: Math.round(vv.height),
  }
}

/**
 * Tracks the visual viewport so bottom sheets can sit above the on-screen
 * keyboard and fit in the space left. iOS Safari doesn't resize the layout
 * viewport for the keyboard, so the inset is needed there; Android resizes
 * content (via `interactive-widget`), so the inset stays 0 and only the
 * visible height shrinks.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState(read)

  useEffect(() => {
    const update = () =>
      setState((prev) => {
        const next = read()
        return prev.keyboardInset === next.keyboardInset && prev.visibleHeight === next.visibleHeight ? prev : next
      })
    update() // in case it changed between render and now
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return state
}

/** CSS variables for `.sheet`: `--kb` (keyboard inset) and `--vvh` (visible height). */
export function sheetViewportStyle({ keyboardInset, visibleHeight }: VisualViewportState): CSSProperties {
  return { '--kb': `${keyboardInset}px`, '--vvh': `${visibleHeight}px` } as CSSProperties
}
