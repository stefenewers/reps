import { formatMinutes, shortDate } from '@/lib/dates'
import type { PaceStatus } from '@/lib/pacing'

/**
 * Today, classified: what is the target, what is maintenance, what is bonus,
 * how much is left, and whether the day is done. See docs/today-ux-refactor.md.
 *
 * This reads the pacing engine's output (today's stretch of the canonical
 * queue, the pace status, the forecast). It schedules nothing.
 */

export type Category = 'target' | 'maintenance' | 'bonus'
export type ItemState = 'done' | 'now' | 'todo'

export interface ChecklistItem {
  key: 'warm' | 'redo' | 'plan' | 'problem' | 'resolves' | 'cold' | 'bonus'
  category: Category
  /** Prep sits with the target and is recommended first, but is not counted toward it. */
  prep?: boolean
  label: string
  detail: string
  done: number
  total: number
  /** Real minutes still to go. */
  minutesLeft: number
  state: ItemState
}

export interface TodayInput {
  today: string
  /** A day off, or outside the plan. */
  rest: boolean
  /** Coming into today (lib/pacing `paceStatus`). */
  status: Pick<PaceStatus, 'state' | 'days'>
  finish: string | null
  finishDelta: number
  planEnd: string
  /** The plan's reps in today's stretch: done today and still to do, in queue order. */
  reps: { id: string; minutes: number; done: boolean; baseline: string; section: string }[]
  /** New LeetCode problems the queue reaches today. */
  problems: { lc: number; title: string; minutes: number; done: boolean; baseline: string }[]
  /** Warm-up and "again, cold" reps the planner puts first. */
  prep: { key: 'warm' | 'redo'; label: string; detail: string; total: number; done: number; minutes: number }[]
  /** Re-solves and redos due today, and how many are logged. */
  resolves: { total: number; logged: number }
  /** Cold reps: due now, how many a day carries, and how many were done today. */
  cold: { due: number; cap: number; doneToday: number }
  /** What comes after the target, if you keep going. */
  ahead: string | null
}

export interface TodayTarget {
  day: 'rest' | 'target' | 'maintenance' | 'complete'
  start: { state: PaceStatus['state']; label: string }
  target: { repsDone: number; repsTotal: number; problemsDone: number; problemsTotal: number; percent: number; minutesLeft: number; minutesTotal: number }
  maintenance: { left: number; minutesLeft: number; summary: string }
  items: ChecklistItem[]
  /** The first thing not done: target (with its prep) before maintenance. */
  next: ChecklistItem | null
  headline: string
  message: string
}

const RESOLVE_MINUTES = 15
const COLD_MINUTES = 5
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "On track" is about how you came into today. It never means today is finished. */
export function startLabel(status: Pick<PaceStatus, 'state' | 'days'>): string {
  if (status.state === 'behind') return `${plural(status.days, 'working day')} behind`
  if (status.state === 'ahead') return `${plural(status.days, 'working day')} ahead`
  if (status.state === 'complete') return 'Plan complete'
  if (status.state === 'not-started') return 'Not started yet'
  return 'On track'
}

export function todayTarget(input: TodayInput): TodayTarget {
  const { today } = input
  // The target is what the original line expected by today. Anything in today's stretch from later than that is bonus.
  const due = <T extends { baseline: string; done: boolean }>(x: T) => x.baseline <= today
  const reps = input.reps.filter(due)
  const problems = input.problems.filter(due)
  const bonusReps = input.reps.filter((x) => !due(x))
  const bonusProblems = input.problems.filter((x) => !due(x))

  const minutesTotal = Math.round([...reps, ...problems].reduce((n, x) => n + x.minutes, 0))
  const minutesLeft = Math.round([...reps, ...problems].filter((x) => !x.done).reduce((n, x) => n + x.minutes, 0))
  const repsDone = reps.filter((x) => x.done).length
  const problemsDone = problems.filter((x) => x.done).length
  const targetLeft = reps.length - repsDone + (problems.length - problemsDone)
  const percent = minutesTotal ? Math.round((100 * (minutesTotal - minutesLeft)) / minutesTotal) : 0
  const hasTarget = reps.length + problems.length > 0

  const resolvesLeft = Math.max(0, input.resolves.total - input.resolves.logged)
  // Today's share of the due cold reps: what was done today plus what is still due, up to the daily number.
  const coldTotal = Math.min(input.cold.cap, input.cold.doneToday + input.cold.due)
  const coldLeft = Math.max(0, coldTotal - input.cold.doneToday)
  const maintenanceLeft = resolvesLeft + coldLeft
  const maintenanceMinutes = resolvesLeft * RESOLVE_MINUTES + coldLeft * COLD_MINUTES
  const summary = [resolvesLeft ? plural(resolvesLeft, 're-solve') : '', coldLeft ? plural(coldLeft, 'cold rep') : ''].filter(Boolean).join(' · ')

  const items: ChecklistItem[] = []
  const add = (i: Omit<ChecklistItem, 'state'>) => items.push({ ...i, state: i.total > 0 && i.done >= i.total ? 'done' : 'todo' })
  if (!input.rest) {
    // Prep is only shown while there is a target for it to prepare.
    if (hasTarget) for (const p of input.prep) add({ key: p.key, category: 'target', prep: true, label: p.label, detail: p.detail, done: p.done, total: p.total, minutesLeft: p.total ? Math.round((p.minutes * (p.total - p.done)) / p.total) : 0 })
    if (reps.length) {
      const sections = [...new Set(reps.map((r) => r.section))]
      add({
        key: 'plan',
        category: 'target',
        label: sections.length > 2 ? `${sections[0]} → ${sections[sections.length - 1]}` : sections.join(' → '),
        detail: "the plan's reps for today",
        done: repsDone,
        total: reps.length,
        minutesLeft: Math.round(reps.filter((x) => !x.done).reduce((n, x) => n + x.minutes, 0)),
      })
    }
    for (const p of problems) add({ key: 'problem', category: 'target', label: `LC ${p.lc} · ${p.title}`, detail: 'new problem, on LeetCode', done: p.done ? 1 : 0, total: 1, minutesLeft: p.done ? 0 : Math.round(p.minutes) })
    if (input.resolves.total) add({ key: 'resolves', category: 'maintenance', label: 'LeetCode re-solves', detail: 'problems you have solved before, cold', done: input.resolves.logged, total: input.resolves.total, minutesLeft: resolvesLeft * RESOLVE_MINUTES })
    if (coldTotal) add({ key: 'cold', category: 'maintenance', label: 'Cold reps', detail: 'skills due to be written again', done: input.cold.doneToday, total: coldTotal, minutesLeft: coldLeft * COLD_MINUTES })
    // Beyond the target: stretch work from later in the plan, or simply the next thing in the queue.
    const bonusLeft = bonusReps.filter((x) => !x.done).length + bonusProblems.filter((x) => !x.done).length
    if (bonusLeft || (targetLeft === 0 && input.ahead))
      add({
        key: 'bonus',
        category: 'bonus',
        label: bonusLeft ? `${plural(bonusLeft, 'more item')} from later in the plan` : `Keep going: ${input.ahead}`,
        detail: 'not needed today',
        done: bonusReps.filter((x) => x.done).length + bonusProblems.filter((x) => x.done).length,
        total: 0,
        minutesLeft: Math.round([...bonusReps, ...bonusProblems].filter((x) => !x.done).reduce((n, x) => n + x.minutes, 0)),
      })
  }
  // Exactly one "now": the first thing not done, target (prep first) before maintenance. Bonus is never "now".
  const next = items.find((i) => i.state !== 'done' && i.category !== 'bonus') ?? null
  if (next) next.state = 'now'

  // A rest day is a day off, or a day with nothing in it at all (no target, no maintenance, nothing to keep going with).
  const nothing = !hasTarget && !input.resolves.total && !coldTotal && !input.reps.length && !input.problems.length
  const day: TodayTarget['day'] = input.rest || nothing ? 'rest' : targetLeft > 0 ? 'target' : maintenanceLeft > 0 ? 'maintenance' : 'complete'
  const finish = input.finish ? shortDate(input.finish) : null
  const where = !finish ? '' : input.finishDelta > 0 ? `${finish}, ${plural(input.finishDelta, 'day')} after ${shortDate(input.planEnd)}` : input.finishDelta < 0 ? `${finish}, ahead of ${shortDate(input.planEnd)}` : `${finish}, the last day of the plan`

  const headline =
    day === 'rest'
      ? 'Rest day.'
      : day === 'target'
        ? `${[repsDone < reps.length ? plural(reps.length - repsDone, 'rep') : '', problemsDone < problems.length ? plural(problems.length - problemsDone, 'problem') : ''].filter(Boolean).join(' and ')} of today’s target remaining`
        : day === 'maintenance'
          ? 'Today’s target reached.'
          : 'Everything due today is complete.'
  const message =
    day === 'rest'
      ? 'Nothing is scheduled today. Rest is part of the plan.'
      : day === 'target'
        ? input.status.state === 'behind'
          ? `You came into today ${startLabel(input.status)}. Finishing today’s target keeps the forecast at ${where}; the buffer weeks take up the slack.`
          : `Finish this target to stay on track${where ? ` for ${where}` : ''}.`
        : day === 'maintenance'
          ? `${input.status.state === 'behind' ? `Today’s pace is done; the forecast is ${where}.` : `You are on track${where ? ` for ${where}` : ''}.`} Maintenance remaining: ${summary} · about ${formatMinutes(maintenanceMinutes)}. It keeps what you have; it is not needed for pace.`
          : `${input.status.state === 'behind' ? `The forecast is ${where}.` : `You are on track${where ? ` for ${where}` : ''}.`} Anything else today is bonus.`

  return {
    day,
    start: { state: input.status.state, label: startLabel(input.status) },
    target: { repsDone, repsTotal: reps.length, problemsDone, problemsTotal: problems.length, percent: day === 'rest' ? 0 : hasTarget ? percent : 100, minutesLeft, minutesTotal },
    maintenance: { left: maintenanceLeft, minutesLeft: maintenanceMinutes, summary },
    items,
    next,
    headline,
    message,
  }
}
