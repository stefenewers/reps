import type { DayModule } from '@/lib/types'

/**
 * How a day of the 90-day plan is laid out: four blocks with clock times.
 *
 *   A  New work     the day's ladder reps in Reps, or its new LeetCode problems
 *   B  Re-solves    the day's LeetCode re-solves and redos, cold
 *   C  Afternoon    one track a day, rotating by weekday (not in week 1, not on Saturdays)
 *   D  Log          record how each problem went
 *
 * Lengths come from the plan itself (the day's estimated minutes and its
 * re-solve count), so the blocks always match the work. Times are a suggested
 * shape for the day, not an alarm: the hours are a ceiling, never a quota.
 */

export type BlockId = 'A' | 'B' | 'C' | 'D'

export interface DayBlock {
  id: BlockId
  title: string
  /** What to do, in one line. */
  what: string
  /** "09:00" (24 h). */
  start: string
  end: string
  minutes: number
  /** Where the block's work lives. */
  href?: string
}

export const PHASE_LABEL: Record<NonNullable<DayModule['phase']>, string> = {
  soft: 'Soft start',
  build: 'Build',
  full: 'Full',
  buffer: 'Buffer week',
  final: 'Final week',
  off: 'Off day',
}

/** When block A starts, and the break after each block, in minutes. */
const SHAPE: Record<Exclude<NonNullable<DayModule['phase']>, 'off'>, { start: string; breakAfterA: number; breakAfterB: number; c: number }> = {
  soft: { start: '09:30', breakAfterA: 15, breakAfterB: 0, c: 0 },
  build: { start: '09:00', breakAfterA: 60, breakAfterB: 15, c: 40 },
  full: { start: '09:00', breakAfterA: 60, breakAfterB: 15, c: 45 },
  buffer: { start: '09:30', breakAfterA: 60, breakAfterB: 15, c: 45 },
  final: { start: '09:00', breakAfterA: 60, breakAfterB: 15, c: 90 },
}

/** Block C by weekday (0 = Sunday). Saturdays and week 1 have none. */
export const AFTERNOON_TRACK: Record<number, { title: string; what: string; href: string } | undefined> = {
  1: { title: 'Design', what: 'This week’s design item: classes, contracts, one trade-off', href: '/interview#design-h' },
  2: { title: 'Mock', what: 'A 45-minute mock, talking out loud, then log it', href: '/interview#mocklog-h' },
  3: { title: 'Stories', what: 'Draft or rehearse two stories to a 2-minute timer', href: '/interview#stories-h' },
  4: { title: 'Applications', what: 'Five full-time SWE I applications', href: '/plan' },
  5: { title: 'Mock or timed set', what: 'A second mock, or two problems in 70 minutes', href: '/interview#mocklog-h' },
}

const RESOLVE_MINUTES = 15
const LOG_MINUTES = 5

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
const toClock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** "09:00" → "9:00 am". */
export function clock12(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2))
  return `${((h + 11) % 12) + 1}:${hhmm.slice(3)} ${h < 12 ? 'am' : 'pm'}`
}

/**
 * The blocks for a plan day. `resolves` is how many re-solves and redos the day
 * carries (pass the live number so a redo shows up in block B's length).
 */
export function blocksFor(day: DayModule, resolves?: number): DayBlock[] {
  if (!day.planDay || !day.phase || day.phase === 'off') return []
  const shape = SHAPE[day.phase]
  const weekday = new Date(`${day.date}T12:00:00`).getDay()
  const reps = day.sections.filter((s) => !s.optional).reduce((n, s) => n + s.exercises.length, 0)
  const news = (day.leetcode ?? []).filter((x) => x.type === 'new').length
  const nResolves = resolves ?? (day.leetcode ?? []).filter((x) => x.type !== 'new').length
  const track = shape.c && weekday !== 6 ? AFTERNOON_TRACK[weekday] : undefined

  const out: DayBlock[] = []
  let at = toMin(shape.start)
  const add = (id: BlockId, title: string, what: string, minutes: number, href: string | undefined, breakAfter: number) => {
    if (minutes <= 0) return
    out.push({ id, title, what, start: toClock(at), end: toClock(at + minutes), minutes, href })
    at += minutes + breakAfter
  }
  const aWhat = [reps ? `${reps} ladder rep${reps === 1 ? '' : 's'} in Reps` : '', news ? `${news} new problem${news === 1 ? '' : 's'} on LeetCode` : ''].filter(Boolean).join(' · ')
  // Round new work to five minutes so the clock times read cleanly.
  add('A', 'New work', aWhat, Math.round((day.planMinutes ?? 0) / 5) * 5, '#now', shape.breakAfterA)
  add('B', 'Re-solves', `${nResolves} on LeetCode, cold, about ${RESOLVE_MINUTES} minutes each`, nResolves * RESOLVE_MINUTES, '#lc-heading', shape.breakAfterB)
  if (track) add('C', track.title, track.what, shape.c, track.href, 0)
  add('D', 'Log', 'Tap Unaided or Needed help on each problem; one line on any mistake', LOG_MINUTES, '/log', 0)
  return out
}

/** The block the clock is in, or the next one to start; null once the day's blocks are over. */
export function blockAt(blocks: DayBlock[], nowMinutes: number): { current: DayBlock | null; next: DayBlock | null } {
  const current = blocks.find((b) => toMin(b.start) <= nowMinutes && nowMinutes < toMin(b.end)) ?? null
  const next = blocks.find((b) => toMin(b.start) > nowMinutes) ?? null
  return { current, next }
}

/** Planned minutes still ahead today, by the clock. */
export function minutesRemaining(blocks: DayBlock[], nowMinutes: number): number {
  return blocks.reduce((n, b) => n + Math.max(0, toMin(b.end) - Math.max(nowMinutes, toMin(b.start))), 0)
}

export const CHECKPOINTS = [
  { date: '2026-11-09', label: 'Day 30', patterns: 5, problems: 18, unaided: 0.65, mocks: 5 },
  { date: '2026-12-09', label: 'Day 60', patterns: 9, problems: 38, unaided: 0.75, mocks: 12 },
  { date: '2027-01-08', label: 'Day 90', patterns: 15, problems: 67, unaided: 0.8, mocks: 22 },
] as const
