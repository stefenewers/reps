import type { Attempt, DayModule, LeetcodeItem } from '@/lib/types'
import type { SolveEntry } from '@/lib/solve-log'
import { addDays, parseLocal } from '@/lib/dates'

/**
 * Pacing, not daily goals.
 *
 * The plan is one ordered queue of work: for each pattern, its ladder, its
 * mastery check, then its LeetCode problems. "Next up" is always the first
 * thing in the queue you have not done, whatever the date.
 *
 * The calendar is only a gauge laid over that queue:
 *   - the baseline is where the original 90-day schedule put each item;
 *   - the pace status compares what you have done with what the baseline
 *     expected by now (ahead, on pace, behind, in working days);
 *   - the forecast re-lays what is left over the days ahead, so every date you
 *     look at shows what today's pace would reach by then.
 *
 * A missed day moves the gauge. It never breaks the plan, and nothing has to
 * be rebuilt. Everything here is deterministic and derived from progress.
 */

export interface PaceModel {
  budgets: Record<string, readonly number[]>
  repsFactor: number
  lcMinutes: Record<string, number>
  studyFirstExtra: number
  maxNewLeetcode: number
  resolveGaps: readonly number[]
  overfill: number
}

export interface QueueItem {
  /** The rep id, or `lc:<number>` for a new LeetCode problem. */
  key: string
  kind: 'rep' | 'lc'
  /** For reps: the section it belongs to, and whether that section is a mastery check. */
  sectionId?: string
  gate?: boolean
  /** For new LeetCode problems. */
  lc?: LeetcodeItem
  /** A Reps capstone that is the first solve of this LeetCode number. */
  capstoneLc?: number
  /** Real minutes at the plan's pace. */
  minutes: number
  /** The pattern it belongs to, and its short name. */
  unit: string
  unitShort: string
  /** The date the original schedule put it on. */
  baseline: string
}

/** The whole plan as one ordered queue, in the order the original schedule does the work. */
export function buildQueue(planDays: DayModule[], pace: PaceModel, capstoneNumber: Record<string, number>): QueueItem[] {
  const out: QueueItem[] = []
  for (const d of planDays) {
    const units = d.title.split(' → ')
    const shorts = d.short.split(' → ')
    const required = d.sections.filter((s) => !s.optional)
    // Units in the order the day reaches them; a rep belongs to the last unit started, a problem to the one it finishes.
    const reps: QueueItem[] = required.flatMap((s) =>
      s.exercises.map((e) => ({ key: e.id, kind: 'rep' as const, sectionId: s.id, gate: Boolean(s.gate), capstoneLc: capstoneNumber[e.id], minutes: e.minutes * pace.repsFactor, unit: d.title, unitShort: d.short, baseline: d.date })),
    )
    const lcs: QueueItem[] = (d.leetcode ?? [])
      .filter((x) => x.type === 'new')
      .map((x) => ({ key: `lc:${x.lc}`, kind: 'lc' as const, lc: x, minutes: (pace.lcMinutes[x.difficulty] ?? 40) + (x.mode === 'study-first' ? pace.studyFirstExtra : 0), unit: d.title, unitShort: d.short, baseline: d.date }))
    const all = new Map([...reps, ...lcs].map((q) => [q.key, q]))
    // The schedule records the order the day's work is done in; fall back to reps then problems.
    const ordered = (d.planOrder ?? []).map((k) => all.get(k)).filter((q): q is QueueItem => Boolean(q))
    const day = ordered.length === all.size ? ordered : [...reps, ...lcs]
    // Name each item's pattern: problems finish the day's first pattern, a new ladder starts its last.
    const firstRep = day.findIndex((q) => q.kind === 'rep')
    const lastLc = day.map((q) => q.kind).lastIndexOf('lc')
    for (const [k, q] of day.entries()) {
      const later = units.length > 1 && (q.kind === 'rep' ? firstRep > 0 || lastLc < 0 || k > lastLc : false)
      q.unit = units[later ? units.length - 1 : 0] ?? d.title
      q.unitShort = shorts[later ? shorts.length - 1 : 0] ?? d.short
    }
    out.push(...day)
  }
  return out
}

export interface Done {
  /** Rep ids passed (mastery-check reps only when passed without the solution). */
  reps: Set<string>
  /** LeetCode numbers logged as a first solve. */
  lc: Set<number>
}

export const isDone = (item: QueueItem, done: Done) => (item.kind === 'rep' ? done.reps.has(item.key) : done.lc.has(item.lc!.lc))

/** Minutes of new work a date's pace allows. After the plan's last day the full pace simply continues. */
export function budgetOn(date: string, planDays: DayModule[], pace: PaceModel): number {
  const day = planDays.find((d) => d.date === date)
  const weekday = parseLocal(date).getDay()
  if (!day) return weekday === 0 || date < (planDays[0]?.date ?? date) ? 0 : pace.budgets.full[weekday === 6 ? 1 : 0]
  return pace.budgets[day.phase ?? 'off'][weekday === 6 ? 1 : 0]
}

export interface PaceStatus {
  state: 'not-started' | 'ahead' | 'on-pace' | 'behind' | 'complete'
  /** Working days ahead or behind (0 when on pace). */
  days: number
  /** Minutes of queue work done, and the minutes the baseline expected before today. */
  doneMinutes: number
  expectedMinutes: number
  /** How far through the queue, 0–1, by minutes. */
  fraction: number
  /** The next thing to do, or null when the queue is finished. */
  next: QueueItem | null
}

/**
 * Where you are against the original line. Today's own work never counts
 * against you: you are on pace if everything the baseline expected before
 * today is done, and ahead once you are past the end of today's.
 */
export function paceStatus(queue: QueueItem[], done: Done, today: string, planDays: DayModule[]): PaceStatus {
  const total = queue.reduce((n, q) => n + q.minutes, 0)
  const doneMinutes = queue.filter((q) => isDone(q, done)).reduce((n, q) => n + q.minutes, 0)
  const next = queue.find((q) => !isDone(q, done)) ?? null
  const expectedMinutes = queue.filter((q) => q.baseline < today).reduce((n, q) => n + q.minutes, 0)
  const base = { doneMinutes, expectedMinutes, fraction: total ? doneMinutes / total : 0, next }
  if (!next) return { ...base, state: 'complete', days: 0 }
  const start = planDays[0]?.date
  if (start && today < start && doneMinutes === 0) return { ...base, state: 'not-started', days: 0 }

  const working = planDays.filter((d) => d.phase !== 'off').map((d) => d.date)
  // The baseline day you are "on": the day the original schedule put your next item.
  const onDay = next.baseline
  if (onDay < today) {
    // Behind: working days before today that still have unfinished work.
    return { ...base, state: 'behind', days: Math.max(1, working.filter((d) => d >= onDay && d < today).length) }
  }
  // Ahead: whole working days after today whose work is already finished.
  const days = working.filter((d) => d > today && d < onDay).length
  return { ...base, state: days > 0 ? 'ahead' : 'on-pace', days }
}

export interface ForecastDay {
  date: string
  /** New work the pace reaches on this date (today: what is left of today's stretch). */
  items: QueueItem[]
  minutes: number
}

/**
 * Re-lay what is left of the queue over the days from `today` on, at the
 * plan's pace. Buffer days with nothing planned stay empty unless you are
 * behind, in which case they absorb the deficit: that is what they are for.
 */
export function forecast(queue: QueueItem[], done: Done, today: string, planDays: DayModule[], pace: PaceModel, usedToday = 0): { days: ForecastDay[]; finish: string | null } {
  const left = queue.filter((q) => !isDone(q, done))
  const start = planDays[0]?.date ?? today
  let deficit = Math.max(0, queue.filter((q) => q.baseline < today && !isDone(q, done)).reduce((n, q) => n + q.minutes, 0))
  const out: ForecastDay[] = []
  let date = today < start ? start : today
  let finish: string | null = null
  for (let guard = 0; left.length && guard < 400; guard++, date = addDays(date, 1)) {
    const planDay = planDays.find((d) => d.date === date)
    let budget = budgetOn(date, planDays, pace)
    if (planDay?.phase === 'buffer' && (planDay.planMinutes ?? 0) === 0) {
      budget = Math.min(budget, deficit)
      deficit -= budget
    }
    if (date === today) budget = Math.max(0, budget - usedToday)
    if (budget <= 0) continue
    const items: QueueItem[] = []
    let used = 0
    let newLc = 0
    while (left.length) {
      // Once the day has its new LeetCode problems, carry on with the next ladder rep behind them.
      const j = left[0].kind !== 'lc' || newLc < pace.maxNewLeetcode ? 0 : left.findIndex((x) => x.kind === 'rep')
      if (j < 0) break
      if (!(used === 0 || used + left[j].minutes <= budget * pace.overfill)) break
      const [it] = left.splice(j, 1)
      if (it.kind === 'lc') newLc++
      used += it.minutes
      items.push(it)
    }
    if (items.length) {
      out.push({ date, items, minutes: Math.round(used) })
      finish = date
    }
  }
  return { days: out, finish }
}

/** The next working date on or after `date` (never a Sunday off or a day off; after the plan, never a Sunday). */
export function workingOnOrAfter(date: string, planDays: DayModule[]): string {
  let d = date
  for (let i = 0; i < 14; i++, d = addDays(d, 1)) {
    const p = planDays.find((x) => x.date === d)
    if (p ? p.phase !== 'off' : parseLocal(d).getDay() !== 0) return d
  }
  return d
}

export interface Resolve {
  lc: number
  round: 1 | 2 | 3
  due: string
  /** The date it was logged, if it has been. */
  doneOn?: string
}

/**
 * Every re-solve, anchored to the day each problem was actually first solved:
 * +3, +10 and +30 days, slid forward only to miss a day off. `anchors` maps a
 * LeetCode number to its first-solve date (real, or forecast for problems not
 * solved yet).
 */
export function resolvesFor(anchors: Map<number, string>, entries: SolveEntry[], planDays: DayModule[], gaps: readonly number[]): Resolve[] {
  const logged = new Map(entries.map((e) => [e.id, e]))
  const out: Resolve[] = []
  for (const [lc, anchor] of anchors) {
    let notBefore = anchor
    gaps.forEach((gap, i) => {
      const round = (i + 1) as 1 | 2 | 3
      const hit = logged.get(`lc:${lc}:review${round}`)
      const target = addDays(anchor, gap)
      // A late re-solve pushes the next one out too: at least two days between rounds.
      const due = workingOnOrAfter(target > notBefore ? target : notBefore, planDays)
      out.push({ lc, round, due, doneOn: hit?.date })
      notBefore = addDays(hit?.date ?? due, 2)
    })
  }
  return out.sort((a, b) => a.due.localeCompare(b.due) || a.lc - b.lc)
}

/** The first date each LeetCode problem was solved: logged as new on LeetCode, or its capstone passed in Reps. */
export function firstSolves(entries: SolveEntry[], attempts: Attempt[], capstoneNumber: Record<string, number>, cleanPass: (exerciseId: string) => boolean): Map<number, string> {
  const out = new Map<number, string>()
  const put = (lc: number, date: string) => {
    if (!out.has(lc) || date < out.get(lc)!) out.set(lc, date)
  }
  for (const e of entries) if (e.lc && e.kind === 'new') put(e.lc, e.date)
  for (const a of attempts) {
    const lc = capstoneNumber[a.exerciseId]
    if (lc && a.passed && a.completedAt && !(a.solutionViewed && cleanPass(a.exerciseId))) put(lc, a.date)
  }
  return out
}
