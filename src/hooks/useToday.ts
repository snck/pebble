import { useEffect, useState } from 'react'
import { msUntilNextDay, todayISO } from '../lib/dates'

/** Today's date, kept current across midnight and when the app is resumed. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const refresh = () => setToday(todayISO())
    const timer = setTimeout(refresh, msUntilNextDay() + 1000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [today])

  return today
}
