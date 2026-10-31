import type { ReactNode } from 'react'
import { ROUTE_HREF, type Route } from '../hooks/useHashRoute'

const TABS: Array<{ route: Route; label: string; icon: ReactNode }> = [
  {
    route: 'week',
    label: 'Week',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    route: 'report',
    label: 'Report',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 6.5h14M5 12h9M5 17.5h5" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    route: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h9M19 7h1M4 17h3M13 17h7" strokeLinecap="round" />
        <circle cx="16" cy="7" r="2.5" />
        <circle cx="10" cy="17" r="2.5" />
      </svg>
    ),
  },
]

export function TabBar({ route }: { route: Route }) {
  return (
    <nav className="tab-bar" aria-label="Screens">
      {TABS.map((t) => (
        <a
          key={t.route}
          href={ROUTE_HREF[t.route]}
          className={`tab${t.route === route ? ' is-active' : ''}`}
          aria-current={t.route === route ? 'page' : undefined}
        >
          <span aria-hidden="true">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </a>
      ))}
    </nav>
  )
}
