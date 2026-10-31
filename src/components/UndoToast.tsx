import { useEffect } from 'react'

interface Props {
  message: string
  onUndo(): void
  onDismiss(): void
}

const TOAST_MS = 5000

export function UndoToast({ message, onUndo, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" className="text-button" onClick={onUndo}>
        Undo
      </button>
    </div>
  )
}
