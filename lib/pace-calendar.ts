import type { Attempt, DayModule, LeetcodeItem, Section } from '@/lib/types'
import type { SolveEntry } from '@/lib/solve-log'
import { addDays, parseLocal } from '@/lib/dates'
import { buildQueue, firstSolves, forecast, isDone, paceStatus, resolvesFor, type Done, type PaceModel, type PaceStatus, type QueueItem, type Resolve } from '@/lib/pacing'

/**
 * The calendar as the app shows it, built from progress instead of fixed dates:
 *   - a past day is a record: the reps you passed and the problems you logged on it;
 *   - today is what you have done so far plus the stretch today's pace suggests;
 *   - a future day is a forecast: what the pace reaches by then.
 * Re-solves sit on the day they fall due, counted from when each problem was
 * actually (or, for the future, is forecast to be) first solved.
 */

export interface CalendarInput {
  planDays: DayModule[]
  pace: PaceModel
  attempts: Attempt[]
  entries: SolveEntry[]
  today: string
  capstoneNumber: Record<string, number>
  /** Rep ids that count as done. */
  passed: Set<string>
  cleanPass: (exerciseId: string) => boolean
  sectionSlice: (sectionId: string, repIds: string[]) => Section | null
  lcMeta: (lc: number) => LeetcodeItem | undefined
  /** Most re-solves a day carries, by phase: [weekday, Saturday]. */
  resolveCaps: Record<string, readonly number[]>
}

export interface PaceCalendar {
  days: DayModule[]
  byDate: Record<string, DayModule>
  queue: QueueItem[]
  status: PaceStatus
  /** The date the queue finishes at the plan's pace, from where you are. */
  finish: string | null
  /** Days the finish sits after (+) or before (−) the plan's last day. */
  finishDelta: number
  /** Re-solves due on or before today and not logged, most overdue first (all of them, before the daily cap). */
  due: Resolve[]
  /** Real minutes of queue work done today. */
  doneTodayMinutes: number
  /** Minutes of new work today's pace suggests. */
  todayBudget: number
}

const daysBetween = (a: string, b: string) => Math.round((parseLocal(b).getTime() - parseLocal(a).getTime()) / 86_400_000)

export function buildCalendar(input: CalendarInput): PaceCalendar {
  const { planDays, pace, attempts, entries, today, capstoneNumber, passed } = input
  const queue = buildQueue(planDays, pace, capstoneNumber)
  const done: Done = { reps: passed, lc: new Set(entries.filter((e) => e.lc && e.kind === 'new').map((e) => e.lc!)) }
  const status = paceStatus(queue, done, today, planDays)
  const start = planDays[0].date
  const end = planDays[planDays.length - 1].date
  const byKey = new Map(queue.map((q) => [q.key, q]))

  // What was done, by date: the first pass of each queue rep.
  const passedOn = new Map<string, string>()
  for (const a of [...attempts].sort((x, y) => (x.completedAt ?? '').localeCompare(y.completedAt ?? ''))) {
    if (!a.passed || !a.completedAt || !byKey.has(a.exerciseId) || !passed.has(a.exerciseId)) continue
    if (a.solutionViewed && input.cleanPass(a.exerciseId)) continue
    if (!passedOn.has(a.exerciseId)) passedOn.set(a.exerciseId, a.date)
  }
  const doneToday = queue.filter((q) => (q.kind === 'rep' ? passedOn.get(q.key) === today : entries.some((e) => e.id === `lc:${q.lc!.lc}:new` && e.date === today)))
  const doneTodayMinutes = Math.round(doneToday.reduce((n, q) => n + q.minutes, 0))
  const fc = forecast(queue, done, today, planDays, pace, doneTodayMinutes)
  const planned = new Map(fc.days.map((d) => [d.date, d]))

  // Re-solves: anchored to the real first solve, or the forecast one, or (for problems solved before the plan) their slot in week 1.
  const anchors = firstSolves(entries, attempts, capstoneNumber, input.cleanPass)
  for (const d of fc.days) for (const q of d.items) {
    const lc = q.kind === 'lc' ? q.lc!.lc : q.capstoneLc
    if (lc && !anchors.has(lc)) anchors.set(lc, d.date)
  }
  const firstInPlan = new Set(queue.flatMap((q) => (q.kind === 'lc' ? [q.lc!.lc] : q.capstoneLc ? [q.capstoneLc] : [])))
  for (const d of planDays) for (const x of d.leetcode ?? []) if (x.type === 'review1' && !firstInPlan.has(x.lc) && !anchors.has(x.lc)) anchors.set(x.lc, addDays(d.date, -pace.resolveGaps[0]))
  const resolves = resolvesFor(anchors, entries, planDays, pace.resolveGaps)
  const open = resolves.filter((r) => !r.doneOn)
  const due = open.filter((r) => r.due <= today)

  const item = (lc: number, type: LeetcodeItem['type'], mode: LeetcodeItem['mode'] = null): LeetcodeItem | null => {
    const m = input.lcMeta(lc)
    return m ? { ...m, type, mode } : null
  }
  const last = fc.finish && fc.finish > end ? fc.finish : end
  const days: DayModule[] = []
  for (let date = start, n = 1; date <= last; date = addDays(date, 1), n++) {
    const base = planDays.find((d) => d.date === date)
    const weekday = parseLocal(date).getDay()
    const phase = base?.phase ?? (weekday === 0 ? 'off' : 'full')
    const f = planned.get(date)
    const repIds = [...(date <= today ? queue.filter((q) => q.kind === 'rep' && passedOn.get(q.key) === date).map((q) => q.key) : []), ...(f?.items.filter((q) => q.kind === 'rep').map((q) => q.key) ?? [])]
    // Group into sections, in queue order.
    const sections: Section[] = []
    for (const id of queue.filter((q) => q.kind === 'rep' && repIds.includes(q.key)).map((q) => q.sectionId!)) {
      if (sections.some((s) => s.id === id)) continue
      const sec = input.sectionSlice(id, repIds)
      if (sec) sections.push(sec)
    }
    const lc: LeetcodeItem[] = []
    if (date <= today) for (const e of entries) if (e.date === date && e.lc && (e.kind === 'new' || e.kind.startsWith('review'))) lc.push(item(e.lc, e.kind as LeetcodeItem['type'], null)!)
    if (date === today) {
      const [weekdayCap, saturdayCap] = input.resolveCaps[phase] ?? [5, 3]
      const cap = Math.max(0, (weekday === 6 ? saturdayCap : weekdayCap) - lc.filter((x) => x.type !== 'new').length)
      for (const r of due.slice(0, cap)) lc.push(item(r.lc, `review${r.round}`)!)
    } else if (date > today) {
      for (const r of open) if (r.due === date) lc.push(item(r.lc, `review${r.round}`)!)
    }
    for (const q of f?.items ?? []) if (q.kind === 'lc') lc.push({ ...q.lc!, type: 'new' })
    const leetcode = lc.filter(Boolean)
    const here = queue.filter((q) => (q.kind === 'rep' ? repIds.includes(q.key) : leetcode.some((x) => x.type === 'new' && x.lc === q.lc!.lc)))
    const units = [...new Set(here.map((q) => q.unit))]
    const shorts = [...new Set(here.map((q) => q.unitShort))]
    const news = leetcode.filter((x) => x.type === 'new').length
    const others = leetcode.length - news
    const work = repIds.length + leetcode.length
    const title = units.join(' → ') || (others ? 'Re-solves' : phase === 'off' ? 'Off day' : date < today ? 'No practice' : 'Open')
    const parts = [sections.length ? `Reps: ${[...new Set(sections.map((s) => s.title))].join(' → ')}` : '', news ? `${news} new on LeetCode` : '', others ? `${others} re-solve${others === 1 ? '' : 's'}` : ''].filter(Boolean)
    days.push({
      date,
      short: shorts.join(' → ') || title,
      title,
      focus: work ? `${parts.join(' · ')}.` : phase === 'off' ? 'Rest. Nothing is planned.' : date < today ? 'Nothing was logged this day.' : 'Nothing is forecast for this day at the current pace.',
      sections,
      capstones: sections.flatMap((s) => s.exercises.filter((e) => e.repType === 'capstone' && e.problemId).map((e) => e.problemId!)),
      modules: [],
      leetcode,
      phase: phase as DayModule['phase'],
      planDay: n,
      planWeek: base?.planWeek ?? (planDays[planDays.length - 1].planWeek ?? 13) + Math.ceil(daysBetween(end, date) / 7),
      planMinutes: (f?.minutes ?? 0) + (date === today ? doneTodayMinutes : 0),
    })
  }
  const todayBudget = (() => {
    const b = planDays.find((d) => d.date === today)
    if (!b) return 0
    return pace.budgets[b.phase ?? 'off'][parseLocal(today).getDay() === 6 ? 1 : 0]
  })()
  return { days, byDate: Object.fromEntries(days.map((d) => [d.date, d])), queue, status, finish: fc.finish, finishDelta: fc.finish ? daysBetween(end, fc.finish) : 0, due, doneTodayMinutes, todayBudget }
}

/** The next rep to do, in the order of the work, or null when every rep is done. */
export function nextRep(queue: QueueItem[], passed: Set<string>): QueueItem | null {
  return queue.find((q) => q.kind === 'rep' && !passed.has(q.key)) ?? null
}

export { isDone }
