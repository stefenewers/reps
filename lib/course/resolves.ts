import { dayType } from '@/data/course/calendar'
import { addDays } from '@/lib/dates'
import type { SolveEntry } from '@/lib/solve-log'
import type { LeetcodeItem } from '@/lib/types'

/**
 * Outside problems in the course, without the 90-day calendar: today's new
 * problems (from the course queue), spaced re-solves +3 / +10 / +30 days after
 * the first solve, and a redo on the next training day after any re-solve that
 * needed help. Same solve-log ids as before, so history carries over.
 */

export type CourseLcItem = LeetcodeItem & { solveId: string; redoDue?: string; rebuild?: boolean }

const REVIEWS = [
  { type: 'review1', gap: 3 },
  { type: 'review2', gap: 10 },
  { type: 'review3', gap: 30 },
] as const
const isResolve = (k: SolveEntry['kind']) => k === 'review1' || k === 'review2' || k === 'review3' || k === 'redo'

/** The next training day on or after a date (rest and Saturdays skipped). */
export function nextTrainingDay(date: string): string {
  let d = date
  while (dayType(d) !== 'training') d = addDays(d, 1)
  return d
}

export function courseLeetcode(today: string, entries: SolveEntry[], newToday: number[], meta: (lc: number) => LeetcodeItem | undefined): CourseLcItem[] {
  const logged = new Map(entries.map((e) => [e.id, e]))
  const out: CourseLcItem[] = []
  const add = (lc: number, type: LeetcodeItem['type'], solveId: string, redoDue?: string, rebuild?: boolean) => {
    const m = meta(lc)
    if (m && !out.some((x) => x.solveId === solveId)) out.push({ ...m, type, mode: type === 'new' ? m.mode : null, solveId, redoDue, ...(rebuild ? { rebuild: true } : {}) })
  }
  // Rebuilds first: a solve where the solution was seen comes back from the next training day until it is
  // rebuilt from blank (and stays visible on the day it was rebuilt).
  for (const e of entries) {
    if (!e.lc || e.result !== 'solution') continue
    const from = nextTrainingDay(addDays(e.date, 1))
    if (from <= today && (!e.rebuiltOn || e.rebuiltOn === today)) add(e.lc, e.kind === 'outside' ? 'new' : e.kind, e.id, undefined, true)
  }
  // Redos first: a re-solve that needed help comes back on the next training day.
  for (const e of entries) {
    // A seen solution comes back as a rebuild (below), not as a redo.
    if (!e.lc || !isResolve(e.kind) || e.result === 'unaided' || e.result === 'solution') continue
    const due = nextTrainingDay(addDays(e.date, 1))
    const id = `redo:${e.lc}:${due}`
    const done = logged.get(id)
    if (due <= today && (!done || done.date === today)) add(e.lc, 'redo', id, due)
  }
  // Spaced re-solves: the earliest unlogged round that is due.
  for (const first of entries.filter((e) => e.kind === 'new' && e.lc)) {
    for (const r of REVIEWS) {
      const id = `lc:${first.lc}:${r.type}`
      const done = logged.get(id)
      if (done && done.date !== today) continue
      if (nextTrainingDay(addDays(first.date, r.gap)) <= today) add(first.lc!, r.type, id)
      break
    }
  }
  for (const lc of newToday) {
    const id = `lc:${lc}:new`
    const done = logged.get(id)
    if (!done || done.date === today) add(lc, 'new', id)
  }
  return out
}
