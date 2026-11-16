import { courseWeekOf, dayType } from '@/data/course/calendar'
import { GATE_BY_ID } from '@/data/course/gates'
import { LAB_BY_ID } from '@/data/course/lessons'
import type { DayPlan } from '@/data/course/schedule'
import {
  REVIEW_PER_DAY,
  SATURDAY_REDOS,
  SATURDAY_SHARE,
  SPILL_END,
  SPILL_ORDER,
  SPRINT_CAP,
  SPRINT_END,
  SPRINT_FLOOR,
  SPRINT_PREREQS,
  SPRINT_SKILLS,
  SPRINT_START,
  SPRINT_UNITS
} from '@/data/course/sprint'
import { addDays, parseLocal } from '@/lib/dates'
import type { UnitStatus } from '@/lib/course/routing'
import type { SkillMastery } from '@/lib/mastery'
import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise, ReviewItem } from '@/lib/types'

/**
 * The Sprint, Nov 16–30, generated from what is actually left (pure; nothing stored).
 *
 * Required work is the unpassed sprint-path reps of every unfinished sprint unit,
 * its uncleared checkpoints and its unfinished labs. A checkpoint is due the
 * training day after its path finishes (cold); repairs come first. Ready units
 * (weeks 1–3) add no teaching: they come back only as review-queue items.
 *
 * Every training day opens with a review block (up to four pending items:
 * `shaky` first, then items on sprint-relevant skills, then the oldest overdue)
 * and, on Saturdays, one unaided redo of LC 49 / LC 128 until each has one.
 *
 * Daily target = ceil(remaining required ÷ remaining training days) + the review
 * block, floor 20 and cap 24 on weekdays, Saturdays about 60%. When even 24 a day
 * cannot hold it, the plan says "behind by N" and spills the lowest-priority items
 * (linked lists, then binary search) into Dec 1–5. Recomputed from attempts every
 * time: finish faster and the sprint ends early.
 */

export interface ReviewPick {
  reviewId: string
  /** The rep to do (for a skill item, a passed rep that trains the skill). */
  exerciseId: string
  skillId?: string
  why: 'shaky' | 'sprint-skill' | 'overdue'
}

export interface SprintDay extends DayPlan {
  kind: 'weekday' | 'saturday' | 'spill'
  /** Reps the day asks for: review block + repairs + checkpoint variants + new reps. */
  target: number
  review: ReviewPick[]
  /** Saturday: one unaided redo of an outside problem that has none yet. */
  redo?: { lc: number; title: string }
  repairs: string[]
  gates: { gateId: string; unitId: string; variants: number }[]
  newReps: { exerciseId: string; unitId: string; minutes: number }[]
  /** Required work the sprint cannot hold at 24 a day (0 when on plan). */
  behindBy: number
  /** Estimated minutes: Exercise.minutes, plus 45–60 per lab. */
  minutes: { low: number; high: number }
}

export interface SprintPlan {
  days: SprintDay[]
  /** Required reps (path reps, repairs and checkpoint variants) left as of the start of the first day. */
  remaining: number
  behindBy: number
  /** The last day with required work, when the plan holds it all. */
  endsOn?: string
  /** Required work deferred into Dec 1–5. */
  spilled: number
}

export interface SprintPlanInput {
  /** courseStatus(ctx) as of the START of `date` (attempts before it). */
  statuses: UnitStatus[]
  review: ReviewItem[]
  attempts: Attempt[]
  entries: SolveEntry[]
  exercises: Record<string, Exercise>
  mastery: Record<string, SkillMastery>
  labsDone: Set<string>
}

type Item =
  | { kind: 'repair'; id: string; unitId: string; minutes: number }
  | { kind: 'rep'; id: string; unitId: string; minutes: number }
  | { kind: 'gate'; id: string; unitId: string; variants: number; minutes: number }
  | { kind: 'lab'; id: string; unitId: string }

const isSaturday = (d: string) => parseLocal(d).getDay() === 6
const weight = (d: string) => (isSaturday(d) ? SATURDAY_SHARE : 1)
const repCount = (x: Item) => (x.kind === 'gate' ? x.variants : x.kind === 'lab' ? 0 : 1)

/** Training days from `from` through `to` (sprint Saturdays included). */
export function trainingDaysBetween(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) if (dayType(d) === 'training') out.push(d)
  return out
}

/** The next training day strictly after a date. */
export function nextTrainingDay(date: string): string {
  let d = addDays(date, 1)
  for (let i = 0; i < 14 && dayType(d) !== 'training'; i++) d = addDays(d, 1)
  return d
}

/** Weekday target for `remaining` reps over these days (weighted), plus the review block. */
export function weekdayTarget(remaining: number, days: string[]): number {
  if (!remaining) return REVIEW_PER_DAY
  const effective = days.reduce((n, d) => n + weight(d), 0) || 1
  return Math.min(SPRINT_CAP, Math.max(SPRINT_FLOOR, Math.ceil(remaining / effective) + REVIEW_PER_DAY))
}

const dayTarget = (weekday: number, d: string) => (isSaturday(d) ? Math.round(weekday * SATURDAY_SHARE) : weekday)

/** The sprint's required work in order (repairs, then each unit's unpassed path, checkpoints and labs). */
export function requiredWork(input: SprintPlanInput): Item[] {
  const passed = new Set(input.attempts.filter((a) => a.passed && a.completedAt && !a.solutionViewed).map((a) => a.exerciseId))
  const mins = (id: string) => input.exercises[id]?.minutes ?? 5
  const byId = new Map(input.statuses.map((s) => [s.unit.id, s]))
  const out: Item[] = []
  // Catch-up first: a weeks 1–3 unit that is not ready yet is what every sprint unit stands on.
  const catchUp = input.statuses.filter((s) => s.unit.week <= 3 && !s.unit.sprintOnly && s.state !== 'ready' && s.state !== 'maintenance').map((s) => s.unit.id)
  for (const id of [...catchUp, ...SPRINT_UNITS]) {
    const s = byId.get(id)
    if (!s) continue
    const ready = s.state === 'ready' || s.state === 'maintenance'
    if (!ready) {
      for (const g of s.gates) for (const r of g.repair) out.push({ kind: 'repair', id: r, unitId: id, minutes: mins(r) })
      if (s.route !== 'placement') for (const e of s.path) if (!passed.has(e.id)) out.push({ kind: 'rep', id: e.id, unitId: id, minutes: e.minutes })
      for (const g of s.gates) {
        const variants = Math.max(0, Math.min(g.gate.need, g.available.length) - g.clean.length)
        if (!g.cleared && variants && !g.repair.length)
          out.push({ kind: 'gate', id: g.gate.id, unitId: id, variants, minutes: variants * Math.max(...g.available.map(mins), 10) })
      }
    }
    for (const lab of s.unit.labIds) if (LAB_BY_ID[lab] && !LAB_BY_ID[lab].optional && !input.labsDone.has(lab)) out.push({ kind: 'lab', id: lab, unitId: id })
  }
  return out
}

/** Pending review items in sprint order: shaky, then sprint-relevant skills, then oldest due. Pure-syntax fluent items wait for Prep. */
export function orderedReview(input: Pick<SprintPlanInput, 'review' | 'exercises' | 'mastery' | 'attempts'>): ReviewPick[] {
  const passedReps = new Map<string, string>()
  for (const a of input.attempts) if (a.passed && a.completedAt && !a.solutionViewed) if (!passedReps.has(a.exerciseId) || a.date < passedReps.get(a.exerciseId)!) passedReps.set(a.exerciseId, a.date)
  const used = new Set<string>()
  const sprintSkill = (skills: string[]) => skills.some((s) => SPRINT_SKILLS.includes(s))
  const fluent = (skills: string[]) => skills.every((s) => input.mastery[s]?.status === 'fluent')
  const rows = input.review
    .filter((r) => r.status === 'pending')
    .map((r) => {
      if (r.reviewType === 'exercise') {
        const e = r.exerciseId ? input.exercises[r.exerciseId] : undefined
        return e ? { r, exerciseId: e.id, skills: e.skills } : null
      }
      // A skill item is worked by a passed rep that trains it (the one passed longest ago), not one already picked.
      const skill = r.skillId!
      const rep = [...passedReps]
        .filter(([id]) => input.exercises[id]?.skills.includes(skill) && ['code', 'output'].includes(input.exercises[id].kind) && !input.exercises[id].lab)
        .sort((a, b) => a[1].localeCompare(b[1]))[0]?.[0]
      return rep ? { r, exerciseId: rep, skills: [skill], skillId: skill } : null
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
  const rank = (x: (typeof rows)[number]) => (x.r.reason === 'shaky' ? 0 : sprintSkill(x.skills) ? 1 : x.exerciseId.startsWith('o2-') && fluent(x.skills) ? 3 : 2)
  return rows
    .sort((a, b) => rank(a) - rank(b) || a.r.dueAt.localeCompare(b.r.dueAt))
    .filter((x) => !used.has(x.exerciseId) && used.add(x.exerciseId))
    .map((x) => ({ reviewId: x.r.id, exerciseId: x.exerciseId, skillId: x.skillId, why: x.r.reason === 'shaky' ? 'shaky' : rank(x) === 1 ? 'sprint-skill' : 'overdue' }))
}

/** Outside problems still owed an unaided redo (Saturdays). */
function redosOwed(entries: SolveEntry[]): { lc: number; title: string }[] {
  return SATURDAY_REDOS.filter((p) => !entries.some((e) => e.lc === p.lc && e.result === 'unaided'))
}

/** The sprint plan from `date` (inclusive) to SPRINT_END, with any spill into Dec 1–5. */
export function sprintPlan(input: SprintPlanInput, date: string): SprintPlan {
  const start = date < SPRINT_START ? SPRINT_START : date
  const days = trainingDaysBetween(start, SPRINT_END)
  const work = requiredWork(input)
  let queue = [...work]
  const total = queue.reduce((n, x) => n + repCount(x), 0)

  // Capacity at the cap: if it cannot hold everything, defer the lowest-priority units' work (from the end of their paths).
  const reviewAll = orderedReview(input)
  const capacity = days.reduce((n, d) => n + dayTarget(SPRINT_CAP, d) - Math.min(REVIEW_PER_DAY, reviewAll.length), 0)
  const deferred: Item[] = []
  let over = total - capacity
  for (const unitId of SPILL_ORDER) {
    if (over <= 0) break
    const mine = queue.filter((x) => x.unitId === unitId)
    // Whole units go last-first: their labs and checkpoint, then path reps from the end.
    for (const x of [...mine].reverse()) {
      if (over <= 0) break
      deferred.unshift(x)
      over -= repCount(x)
    }
  }
  const deferredSet = new Set(deferred)
  queue = queue.filter((x) => !deferredSet.has(x))

  const pathLeft = new Map<string, number>()
  for (const x of queue) if (x.kind === 'rep') pathLeft.set(x.unitId, (pathLeft.get(x.unitId) ?? 0) + 1)
  const statusById = new Map(input.statuses.map((s) => [s.unit.id, s]))
  const pathDoneBefore = new Map<string, string>() // unit → the day its path finished (in the plan), or '' if done before
  for (const s of input.statuses) if (!pathLeft.get(s.unit.id)) pathDoneBefore.set(s.unit.id, '')
  const readyOn = new Map<string, string>() // unit → day it becomes ready in the plan ('' = already)
  for (const s of input.statuses) if (s.state === 'ready' || s.state === 'maintenance') readyOn.set(s.unit.id, '')

  const prereqs = (unitId: string) => SPRINT_PREREQS[unitId] ?? statusById.get(unitId)?.unit.prerequisites ?? []
  const unlocked = (unitId: string, d: string) => prereqs(unitId).every((p) => readyOn.has(p) && readyOn.get(p)! <= d)

  const review = [...reviewAll]
  let owed = redosOwed(input.entries)
  const out: SprintDay[] = []

  /** Fill one day from `list` with `room` reps: repairs, checkpoints whose path finished on an earlier day (cold), labs, then path reps of unlocked units, in order. */
  const fill = (d: string, list: Item[], start: number) => {
    let room = start
    const taken: Item[] = []
    const take = (x: Item) => {
      taken.push(x)
      room -= repCount(x)
    }
    for (const x of list) if (x.kind === 'repair' && room > 0) take(x)
    for (const x of list)
      if (x.kind === 'gate' && room >= x.variants && pathDoneBefore.has(x.unitId) && pathDoneBefore.get(x.unitId)! < d && unlocked(x.unitId, d)) take(x)
    for (const x of list) if (x.kind === 'lab' && pathDoneBefore.has(x.unitId) && pathDoneBefore.get(x.unitId)! < d) take(x)
    // Units cleared today unlock their dependents for the rest of the day.
    for (const x of taken) if (x.kind === 'gate' && !list.some((y) => y !== x && y.kind === 'gate' && y.unitId === x.unitId && !taken.includes(y))) readyOn.set(x.unitId, d)
    for (const x of list) {
      if (room <= 0) break
      if (x.kind !== 'rep' || taken.includes(x) || !unlocked(x.unitId, d)) continue
      take(x)
      const n = (pathLeft.get(x.unitId) ?? 1) - 1
      pathLeft.set(x.unitId, n)
      if (n === 0) {
        pathDoneBefore.set(x.unitId, d)
        // A unit with no checkpoint is ready when its path is.
        if (!list.some((y) => y.kind === 'gate' && y.unitId === x.unitId)) readyOn.set(x.unitId, d)
      }
    }
    return { taken, room }
  }

  let left = queue.reduce((n, x) => n + repCount(x), 0)
  days.forEach((d, i) => {
    const weekday = weekdayTarget(left, days.slice(i))
    const target = dayTarget(weekday, d)
    const picks = review.splice(0, Math.min(REVIEW_PER_DAY, target))
    const redo = isSaturday(d) && owed.length ? owed[0] : undefined
    if (redo) owed = owed.slice(1)
    const { taken, room } = fill(d, queue, Math.max(0, target - picks.length - (redo ? 1 : 0)))
    queue = queue.filter((x) => !taken.includes(x))
    left = queue.reduce((n, x) => n + repCount(x), 0)
    // New work ran out today (the rest waits on a checkpoint tomorrow, or the sprint is done): more review fills the day;
    // with no review left either, the day asks only for what exists.
    const more = room > 0 && left > 0 ? review.splice(0, room) : []
    out.push(dayOf(d, isSaturday(d) ? 'saturday' : 'weekday', target - Math.max(0, room - more.length), [...picks, ...more], redo, taken, input, 0))
  })

  // Anything the sprint days could not hold (deferred, or held back by timing) goes into Dec 1–5, in required-work order
  // (catch-up and prerequisites first) and with the same locks and checkpoint timing.
  let rest = work.filter((x) => deferredSet.has(x) || queue.includes(x))
  const behindBy = rest.reduce((n, x) => n + repCount(x), 0)
  if (rest.length) {
    const from = start > SPRINT_END ? start : addDays(SPRINT_END, 1)
    let spillDays = trainingDaysBetween(from, SPILL_END)
    // Past Dec 5 with sprint work still open: it stays first in line, a day's cap at a time.
    if (!spillDays.length && dayType(start) === 'training') spillDays = [start]
    const per = spillDays.length === 1 && start > SPILL_END ? SPRINT_CAP : Math.min(SPRINT_CAP, Math.ceil(behindBy / Math.max(1, spillDays.length)))
    for (const d of spillDays) {
      const { taken } = fill(d, rest, per)
      rest = rest.filter((x) => !taken.includes(x))
      out.push(dayOf(d, 'spill', taken.reduce((n, x) => n + repCount(x), 0), [], undefined, taken, input, behindBy))
    }
    for (const day of out) day.behindBy = behindBy
  }
  const lastWork = [...out].reverse().find((d) => d.newReps.length || d.gates.length || d.repairs.length || d.labsDue.length)
  return { days: out, remaining: total, behindBy, endsOn: behindBy ? undefined : lastWork?.date, spilled: behindBy }
}

function dayOf(
  date: string,
  kind: SprintDay['kind'],
  target: number,
  review: ReviewPick[],
  redo: SprintDay['redo'],
  taken: Item[],
  input: SprintPlanInput,
  behindBy: number
): SprintDay {
  const newReps = taken.filter((x): x is Extract<Item, { kind: 'rep' }> => x.kind === 'rep').map((x) => ({ exerciseId: x.id, unitId: x.unitId, minutes: x.minutes }))
  const gates = taken.filter((x): x is Extract<Item, { kind: 'gate' }> => x.kind === 'gate').map((x) => ({ gateId: x.id, unitId: x.unitId, variants: x.variants }))
  const repairs = taken.filter((x) => x.kind === 'repair').map((x) => x.id)
  const labs = taken.filter((x) => x.kind === 'lab').map((x) => x.id)
  const repMinutes =
    review.reduce((n, r) => n + (input.exercises[r.exerciseId]?.minutes ?? 5), 0) +
    (redo ? 25 : 0) +
    taken.reduce((n, x) => n + (x.kind === 'lab' ? 0 : x.minutes), 0)
  const focusUnits = [...new Set([...newReps.map((r) => r.unitId), ...gates.map((g) => g.unitId)])]
  const titles = focusUnits.map((id) => input.statuses.find((s) => s.unit.id === id)?.unit.title ?? id)
  return {
    date,
    week: courseWeekOf(date),
    kind,
    focusUnits,
    gatesDue: gates.map((g) => g.gateId),
    labsDue: labs,
    targetsDue: [],
    theme: kind === 'spill' ? `Sprint carry-over: ${titles.join(' + ')}` : titles.length ? `Sprint: ${titles.join(' + ')}` : 'Sprint work done: review, then the big-tech pack is optional',
    target,
    review,
    redo,
    repairs,
    gates,
    newReps,
    behindBy,
    minutes: { low: Math.round(repMinutes + labs.length * 45), high: Math.round(repMinutes + labs.length * 60) }
  }
}

/** Every gate a sprint unit owns (for callers that need titles). */
export const sprintGateTitle = (id: string) => GATE_BY_ID[id]?.title ?? id
