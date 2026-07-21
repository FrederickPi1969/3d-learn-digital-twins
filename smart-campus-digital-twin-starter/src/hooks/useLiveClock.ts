import { useEffect, useMemo, useState } from 'react'

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return useMemo(
    () => ({
      date: new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now),
      time: new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now),
      weekday: new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(now),
    }),
    [now],
  )
}
