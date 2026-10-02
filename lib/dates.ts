/** Local-date helpers. Study days are calendar dates in the learner's timezone. */

export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as local midnight. */
export function parseLocal(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: string, n: number): string {
  const d = parseLocal(date)
  d.setDate(d.getDate() + n)
  return localDate(d)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseLocal(to).getTime() - parseLocal(from).getTime()) / 86_400_000)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** "Oct 2" */
export function shortDate(date: string): string {
  const d = parseLocal(date)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "Friday, Oct 2" */
export function longDate(date: string): string {
  const d = parseLocal(date)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function clampDate(date: string, min: string, max: string): string {
  return date < min ? min : date > max ? max : date
}

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h} h ${r} min` : `${h} h`
}

export function relativeDue(iso: string, now: Date = new Date()): string {
  const due = new Date(iso)
  const today = localDate(now)
  const dueDay = localDate(due)
  if (due <= now) return 'Due now'
  if (dueDay === today) return 'Later today'
  const diff = daysBetween(today, dueDay)
  if (diff === 1) return 'Tomorrow'
  return shortDate(dueDay)
}
