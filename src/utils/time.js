export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatLongDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function padTwo(n) {
  return String(n).padStart(2, '0')
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${padTwo(m)}:${padTwo(s)}`
}

export function initialsFromEmail(email) {
  return (email || '?').slice(0, 2).toUpperCase()
}
