import { useEffect, useState } from 'react'

export type Route = 'week' | 'report'

export const ROUTE_HREF: Record<Route, string> = {
  week: '#/',
  report: '#/report',
}

function parse(hash: string): Route {
  return hash === ROUTE_HREF.report ? 'report' : 'week'
}

/**
 * The current screen, from the URL hash. Hash links mean the phone's back
 * gesture works and an installed app reopens on the same screen, without a
 * router library or server rewrites.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
