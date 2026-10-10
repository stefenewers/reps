import type { DayModule, LeetcodeItem } from '@/lib/types'

/**
 * The solve log: one entry per problem solved outside the Reps editor
 * (LeetCode problems from the plan, their re-solves and redos, and anything
 * logged by hand). Deterministic: the redo queue, the unaided rate and the
 * next review date are all derived from the entries and the plan.
 *
 * Stored in the synced study state under `solve:<id>`, so no schema change.
 */

export type SolveResult = 'unaided' | 'hinted' | 'failed'
export type SolveKind = LeetcodeItem['type'] | 'outside'

export interface SolveEntry {
  /** `lc:<number>:<kind>` for a plan item, `redo:<number>:<due date>` for a redo, `out:<uuid>` for an outside problem. */
  id: string
  lc?: number
  title: string
  /** Local date (YYYY-MM-DD) it was solved. */
  date: string
  kind: SolveKind
  result: SolveResult
  minutes?: number
  approach?: string
  complexity?: string
  mistake?: string
  /** ISO timestamp of the last edit. */
  at: string
}

export const SOLVE_PREFIX = 'solve:'
export const solveKey = (id: string) => `${SOLVE_PREFIX}${id}`
export const planSolveId = (item: Pick<LeetcodeItem, 'lc' | 'type'>, redoDue?: string) => (item.type === 'redo' ? `redo:${item.lc}:${redoDue}` : `lc:${item.lc}:${item.type}`)

const isResolve = (k: SolveKind) => k === 'review1' || k === 'review2' || k === 'review3' || k === 'redo'

/** The next plan day after `date` that is a working day (never a Sunday off or a day off). */
export function nextWorkingDay(date: string, days: DayModule[]): string | null {
  return days.find((d) => d.date > date && d.planDay && d.phase !== 'off')?.date ?? null
}

export interface Redo {
  lc: number
  title: string
  /** The working day it is due. */
  due: string
  /** The entry that triggered it. */
  from: string
  /** The solve entry id the redo is logged under. */
  id: string
}

/**
 * A re-solve (or a redo) that needed help comes back on the next working day.
 * A redo stays pending until it is logged; if the redo itself needs help, it
 * triggers another one.
 */
export function redoQueue(entries: SolveEntry[], days: DayModule[]): Redo[] {
  const logged = new Set(entries.map((e) => e.id))
  const out: Redo[] = []
  for (const e of entries) {
    if (!e.lc || !isResolve(e.kind) || e.result === 'unaided') continue
    const due = nextWorkingDay(e.date, days)
    if (!due) continue
    const id = `redo:${e.lc}:${due}`
    if (!logged.has(id)) out.push({ lc: e.lc, title: e.title, due, from: e.id, id })
  }
  return out.sort((a, b) => a.due.localeCompare(b.due) || a.lc - b.lc)
}

/** The day's LeetCode list: the plan's items plus every redo due on or before that day. */
export function leetcodeFor(day: DayModule, entries: SolveEntry[], days: DayModule[], meta: (lc: number) => LeetcodeItem | undefined): (LeetcodeItem & { solveId: string; redoDue?: string })[] {
  const plan = (day.leetcode ?? []).map((i) => ({ ...i, solveId: planSolveId(i) }))
  if (day.phase === 'off') return plan
  const redos = redoQueue(entries, days)
    .filter((r) => r.due <= day.date)
    .flatMap((r) => {
      const m = meta(r.lc)
      return m ? [{ ...m, type: 'redo' as const, mode: null, solveId: r.id, redoDue: r.due }] : []
    })
  // A redo logged on this day stays visible on it.
  const done = entries
    .filter((e) => e.kind === 'redo' && e.date === day.date && e.lc)
    .flatMap((e) => {
      const m = meta(e.lc!)
      return m && !redos.some((r) => r.solveId === e.id) ? [{ ...m, type: 'redo' as const, mode: null, solveId: e.id, redoDue: e.id.split(':')[2] }] : []
    })
  return [...redos, ...done, ...plan]
}

/** Share of re-solves and redos done without help. New problems do not count: needing help on first contact is expected. */
export function unaidedRate(entries: SolveEntry[], through?: string): { unaided: number; total: number; rate: number | null } {
  const rs = entries.filter((e) => isResolve(e.kind) && (!through || e.date <= through))
  const unaided = rs.filter((e) => e.result === 'unaided').length
  return { unaided, total: rs.length, rate: rs.length ? unaided / rs.length : null }
}

/** When this problem comes back next: a pending redo, else its next scheduled re-solve in the plan. */
export function nextReview(entry: SolveEntry, entries: SolveEntry[], days: DayModule[]): string | null {
  if (!entry.lc) return null
  const redo = redoQueue(entries, days).find((r) => r.lc === entry.lc)
  const planned = days.find((d) => d.date > entry.date && d.leetcode?.some((x) => x.lc === entry.lc && x.type !== 'new' && !entries.some((e) => e.id === planSolveId(x))))?.date ?? null
  if (redo && (!planned || redo.due <= planned)) return redo.due
  return planned
}

/** Upcoming re-solves: pending redos, then the plan's re-solves not yet logged, soonest first. */
export function resolveQueue(entries: SolveEntry[], days: DayModule[], from: string, limit = 12): { date: string; lc: number; title: string; type: LeetcodeItem['type']; overdue: boolean }[] {
  const logged = new Set(entries.map((e) => e.id))
  const redos = redoQueue(entries, days).map((r) => ({ date: r.due, lc: r.lc, title: r.title, type: 'redo' as const, overdue: r.due < from }))
  const planned = days.flatMap((d) => (d.leetcode ?? []).filter((x) => x.type !== 'new' && !logged.has(planSolveId(x))).map((x) => ({ date: d.date, lc: x.lc, title: x.title, type: x.type, overdue: d.date < from })))
  return [...redos, ...planned].sort((a, b) => a.date.localeCompare(b.date) || a.lc - b.lc).slice(0, limit)
}

/** Minutes logged per local date, for the activity views. */
export function solveMinutesByDate(entries: SolveEntry[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of entries) out[e.date] = (out[e.date] ?? 0) + (e.minutes ?? 0)
  return out
}
