import type { ReactNode } from 'react'

interface Props {
  /** Defaults to the pebbles drawing. */
  art?: ReactNode
  title: string
  hint: string
  /** Softly tinted with the accent colour, for positive states. */
  positive?: boolean
  children?: ReactNode
}

/** Centered message that fills the space left on screen. */
export function EmptyState({ art = <PebblesArt />, title, hint, positive = false, children }: Props) {
  return (
    <div className={`empty-state${positive ? ' is-positive' : ''}`}>
      <div className="empty-state-art" aria-hidden="true">
        {art}
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-hint">{hint}</p>
      {children}
    </div>
  )
}

/** A small stack of pebbles: calm, and neutral about whether money was spent. */
function PebblesArt() {
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" fill="currentColor" opacity="0.55">
      <ellipse cx="24" cy="38" rx="16" ry="6" />
      <ellipse cx="24" cy="26.5" rx="11" ry="5" />
      <ellipse cx="24" cy="16.5" rx="7" ry="4" />
    </svg>
  )
}
