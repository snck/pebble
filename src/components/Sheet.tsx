import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { useKeyboardInset } from '../hooks/useKeyboardInset'

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
 * backdrop tap or Escape, and stays above the on-screen keyboard.
 */
export function Sheet({ title, start, end, onClose, className = '', children }: Props) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const keyboardInset = useKeyboardInset()

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
        className={`sheet is-open slide-in ${className}`}
        style={{ '--kb': `${keyboardInset}px` } as CSSProperties}
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
        {children}
      </div>
    </>
  )
}
