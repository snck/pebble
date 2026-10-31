import { useState } from 'react'
import { TabBar } from './components/TabBar'
import { useCategories, useSettings } from './hooks/data'
import { useHashRoute } from './hooks/useHashRoute'
import { useToday } from './hooks/useToday'
import { monthOf } from './lib/dates'
import { ReportScreen } from './screens/ReportScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WeekScreen } from './screens/WeekScreen'

export default function App() {
  const today = useToday()
  const route = useHashRoute()
  const categories = useCategories()
  const settings = useSettings()

  // Kept here so each screen remembers its place when switching tabs.
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(() => monthOf(today))
  const [includeFixed, setIncludeFixed] = useState(false)
  const [prevToday, setPrevToday] = useState(today)

  // If the app stays open past midnight while showing "today" or "this
  // month", follow along.
  if (today !== prevToday) {
    setPrevToday(today)
    if (selectedDate === prevToday) setSelectedDate(today)
    if (month === monthOf(prevToday)) setMonth(monthOf(today))
  }

  if (!categories || !settings) return null

  return (
    <>
      {route === 'settings' ? (
        <SettingsScreen categories={categories} settings={settings} />
      ) : route === 'report' ? (
        <ReportScreen
          today={today}
          month={month}
          onMonthChange={setMonth}
          includeFixed={includeFixed}
          onIncludeFixedChange={setIncludeFixed}
          categoriesById={categories.byId}
          settings={settings}
        />
      ) : (
        <WeekScreen
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          categories={categories}
          settings={settings}
        />
      )}
      <TabBar route={route} />
    </>
  )
}
