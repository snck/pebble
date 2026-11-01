import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { sheetViewportStyle, useVisualViewport } from '../hooks/useVisualViewport'

interface Props {
  title: ReactNode
  /** Header slot before the title, e.g. Cancel. */
  start?: ReactNode
  /** Header slot after the title, e.g. Save or Done. */
  end?: ReactNode
  onClose(): void
  className?: string
  children: ReactNode
}

/**
 * A bottom sheet that is mounted while open (it slides in on mount). Closes on
 * backdrop tap or Escape. It stays above the on-screen keyboard and never gets
 * taller than the space left: the header stays put and the body scrolls.
 */
export function Sheet({ title, start, end, onClose, className = '', children }: Props) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const viewport = useVisualViewport()
  useScrollLock(true)

  useEffect(() => {
    // Move focus into the sheet, unless a child (an autofocused input) already has it.
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true })
  }, [])

  const spacer = <span className="sheet-header-spacer" />

  return (
    <>
      <div className="backdrop is-open fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        className={`sheet is-open slide-in${viewport.keyboardInset > 0 ? ' has-keyboard' : ''} ${className}`}
        style={sheetViewportStyle(viewport)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="sheet-header">
          {start ?? spacer}
          <h2 id={titleId}>{title}</h2>
          {end ?? spacer}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}
