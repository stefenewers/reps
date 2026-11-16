import { CAPSTONE_LC } from '@/data/course/capstones'
import { COURSE_START, courseWeekOf, dailyTarget, dailyTargetOn, dayType, trainingDays, weekDates, weekTarget, type DayType } from '@/data/course/calendar'
import { inSprint, SPRINT_START } from '@/data/course/sprint'
import { sprintDayOn, sprintDueDates, type OverlayInput } from '@/lib/course/sprint-day'
import { prepDayOn } from '@/lib/course/prep-plan'
import { GATE_BY_ID } from '@/data/course/gates'
import { LABS } from '@/data/course/lessons'
import { DAY_PLAN, GATE_DUE, LAB_DUE, SCHEDULE, TARGET_DUE, type DayPlan } from '@/data/course/schedule'
import { UNIT_BY_ID, UNITS } from '@/data/course/units'
import { PROBLEM_URLS } from '@/data/problem-urls'
import { dailyCredits, outsideCredit, validAttempt, masteryEvidence } from '@/lib/course/credit'
import { labProgress, type LabState } from '@/lib/course/labs'
import { courseStatus, type CourseContext, type UnitStatus } from '@/lib/course/routing'
import type { SkillMastery } from '@/lib/mastery'
import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * The one authoritative definition of "done for today" and "done for the week"
 * (REPS_2_1_SPEC.md §7). Today, the week card, the streak, the flame, Saturday's
 * copy, Progress and readiness all read this module; none decides on its own.
 *
 * A day is complete when its rep target is met AND everything due that day is
 * done: labs, checkpoints (cleared, or failed today and repaired), target
 * problems that are open, and any outstanding repair. A week is complete when
 * its output target is met AND its required labs, checkpoints and targets are
 * done. Items not done carry forward (no hidden backlog). Planned rest owes nothing.
 */

export interface ContractInput {
  /** Optional: the review queue (from the Sprint, Today's review block). Targets never depend on it. */
  review?: import('@/lib/types').ReviewItem[]
  attempts: Attempt[]
  entries: SolveEntry[]
  mastery: Record<string, SkillMastery>
  labStates: Record<string, LabState | undefined>
  exercises: Record<string, Exercise>
  sections: Record<string, { exercises: Exercise[] }>
}

export type GateState = 'cleared' | 'open' | 'locked' | 'repair' | 'handled'

export interface ContractLab {
  id: string
  title: string
  unitId: string
  state: 'done' | 'open'
  dueDate: string
  carried: boolean
}
export interface ContractGate {
  id: string
  title: string
  unitId: string
  state: GateState
  dueDate: string
  carried: boolean
  /** Variants still to pass today (when open). */
  next: string[]
  repair: string[]
}
export interface ContractTarget {
  lc: number
  title: string
  unitId: string
  state: 'done' | 'open' | 'locked'
  dueDate: string
  carried: boolean
}
export interface ContractRepair {
  gateId: string
  title: string
  reps: string[]
}

export interface DayContract {
  date: string
  week: number
  type: DayType
  plan?: DayPlan
  reps: { done: number; target: number; met: boolean }
  labs: ContractLab[]
  gates: ContractGate[]
  targets: ContractTarget[]
  repair: ContractRepair[]
  /** Everything required today is done (always true on planned rest and optional Saturdays). */
  complete: boolean
  /** Human-readable list of what is still required today. */
  remaining: string[]
}

export type WeekState = 'upcoming' | 'on-track' | 'recoverable' | 'off-track' | 'complete'

export interface WeekContract {
  week: number
  output: { done: number; target: number }
  labs: { id: string; title: string; optional: boolean; done: boolean; dueDate?: string }[]
  gates: { id: string; title: string; cleared: boolean; dueDate?: string }[]
  targets: { lc: number; title: string; solved: boolean; dueDate?: string }[]
  trainingDays: number
  daysComplete: number
  shortfall: number
  overdue: string[]
  complete: boolean
  status: WeekState
}

const time = (a: Attempt) => a.completedAt ?? a.startedAt

/** Everything as of the end of a date: attempts made by then, outside credits earned by then, labs finished by then. */
interface Snapshot {
  date: string
  statuses: UnitStatus[]
  byUnit: Map<string, UnitStatus>
  credits: number
  labsDone: Map<string, string>
  solved: Map<number, string>
}

/** First date each target problem was solved (outside credit, or its Reps capstone passed without the solution). */
export function solvedDates(attempts: Attempt[], entries: SolveEntry[]): Map<number, string> {
  const out = new Map<number, string>()
  const note = (lc: number, d: string) => {
    if (!out.has(lc) || d < out.get(lc)!) out.set(lc, d)
  }
  for (const e of entries) {
    const c = outsideCredit(e, entries)
    if (c && e.lc) note(e.lc, c.date)
  }
  for (const a of attempts) {
    const lc = CAPSTONE_LC[a.exerciseId]
    if (
      lc &&
      validAttempt(a) &&
      a.passed &&
      a.completedAt &&
      !['failed', 'revealed'].includes(masteryEvidence(a, attempts)) &&
      !attempts.some((h) => h.exerciseId === a.exerciseId && h.solutionViewed && h.date === a.date && Date.parse(time(h)) <= Date.parse(time(a)))
    )
      note(lc, a.date)
  }
  return out
}

export function createContracts(input: ContractInput) {
  const cache = new Map<string, Snapshot>()
  const sorted = input.attempts.filter(validAttempt).sort((x, y) => time(x).localeCompare(time(y)))
  const allSolved = solvedDates(input.attempts, input.entries)
  // From SPRINT_START: sprint checkpoints and labs are due the training day after their path finishes (lib/course/sprint-day.ts).
  const overlayDue = sprintDueDates(input)
  const labDoneOn = new Map<string, string>()
  for (const lab of LABS) {
    const p = labProgress(lab, input.labStates[lab.id], input.attempts)
    if (p.done && p.doneOn) labDoneOn.set(lab.id, p.doneOn)
  }

  function snapshot(date: string): Snapshot {
    const hit = cache.get(date)
    if (hit) return hit
    const attempts = sorted.filter((a) => a.date <= date)
    const ctx: CourseContext = { attempts, mastery: input.mastery, exercises: input.exercises, sections: input.sections, today: date }
    const statuses = courseStatus(ctx)
    const snap: Snapshot = {
      date,
      statuses,
      byUnit: new Map(statuses.map((s) => [s.unit.id, s])),
      credits: dailyCredits(date, input.attempts, input.entries, input.exercises).length,
      labsDone: new Map([...labDoneOn].filter(([, d]) => d <= date)),
      solved: new Map([...allSolved].filter(([, d]) => d <= date))
    }
    cache.set(date, snap)
    return snap
  }

  function gateOf(id: string, snap: Snapshot) {
    const g = GATE_BY_ID[id]
    const unit = snap.byUnit.get(g.unitId)
    return { g, unit, status: unit?.gates.find((x) => x.gate.id === id) }
  }

  function gateState(id: string, date: string, snap: Snapshot): ContractGate {
    const { g, unit, status } = gateOf(id, snap)
    const base = { id, title: g.title, unitId: g.unitId, dueDate: dueOf('gate', id) ?? date, carried: false, next: status?.next ?? [], repair: status?.repair ?? [] }
    if (!status || status.available.length === 0) return { ...base, state: 'cleared' }
    if (status.cleared) return { ...base, state: 'cleared' }
    if (status.failed && status.repair.length) return { ...base, state: 'repair' }
    if (status.failed && status.failedOn === date) return { ...base, state: 'handled' }
    // Due, but its unit's path is not done (or the unit is still locked): required, and the CTA points at the reps first.
    if (!unit || unit.locked || (unit.done < unit.total && unit.route !== 'placement')) return { ...base, state: 'locked' }
    return { ...base, state: 'open' }
  }

  /** When an item is due: the old schedule before SPRINT_START, the sprint's due rule from it. */
  function dueOf(kind: 'gate' | 'lab', id: string): string | undefined {
    const old = kind === 'gate' ? GATE_DUE[id] : LAB_DUE[id]
    if (old && old < SPRINT_START) return old
    return (kind === 'gate' ? overlayDue.gates : overlayDue.labs).get(id)
  }

  /** Items due by `date`: this week's schedule through the date, plus anything earlier in the course still not done. From SPRINT_START the old schedule's later days no longer apply. */
  function dueIds(date: string) {
    const gates: string[] = []
    const labs: string[] = []
    const targets: number[] = []
    for (const [id, d] of overlayDue.gates) if (d <= date) gates.push(id)
    for (const [id, d] of overlayDue.labs) if (d <= date) labs.push(id)
    for (const w of SCHEDULE)
      for (const d of w.days) {
        if (d.date > date || d.date >= SPRINT_START) continue
        gates.push(...d.gatesDue)
        labs.push(...d.labsDue)
        targets.push(...d.targetsDue)
      }
    return { gates: [...new Set(gates)], labs: [...new Set(labs)], targets: [...new Set(targets)] }
  }

  function dayContract(date: string): DayContract {
    const week = Math.min(14, Math.max(1, courseWeekOf(date)))
    const type = date < COURSE_START ? 'training' : dayType(date)
    const sprintDay = date >= SPRINT_START && (inSprint(date) || date > SPRINT_START) ? sprintDayOn(date, input as OverlayInput) : undefined
    const prepDay = date >= SPRINT_START && !inSprint(date) ? prepDayOn(date, input as OverlayInput) : undefined
    const plan = date >= SPRINT_START ? (sprintDay ?? prepDay?.plan) : DAY_PLAN[date]
    const snap = snapshot(date)
    // Before the Sprint: the week's target, as always. Sprint: what is left over the days left. Prep: the day's template.
    const target = type !== 'training' ? 0 : date < SPRINT_START ? dailyTarget(week) : inSprint(date) ? (sprintDay?.target ?? dailyTargetOn(date)) : (prepDay?.target ?? dailyTargetOn(date))
    const reps = { done: snap.credits, target, met: snap.credits >= target }
    const weekStart = weekDates(week)[0]
    const due = dueIds(date)
    const carried = (dueDate: string) => dueDate < weekStart

    const labs: ContractLab[] = due.labs
      .map((id) => LABS.find((l) => l.id === id)!)
      .filter((l) => l && !l.optional)
      .map((l) => ({
        id: l.id,
        title: l.title,
        unitId: l.unitId,
        state: snap.labsDone.has(l.id) ? ('done' as const) : ('open' as const),
        dueDate: dueOf('lab', l.id)!,
        carried: carried(dueOf('lab', l.id)!)
      }))
      // Done labs from earlier days are not today's business; today's and carried open ones are.
      .filter((l) => l.state === 'open' || l.dueDate === date)

    const attemptedGates = snap.statuses.flatMap((s) => s.gates.filter((g) => g.attempted && !g.cleared).map((g) => g.gate.id))
    const gates: ContractGate[] = [...new Set([...due.gates, ...attemptedGates])]
      .map((id) => ({ ...gateState(id, date, snap), carried: carried(dueOf('gate', id) ?? date) }))
      .filter((g) => g.state !== 'cleared' || g.dueDate === date)
      // A checkpoint tried early that still waits on its reps is not today's business until it is due.
      .filter((g) => g.state !== 'locked' || due.gates.includes(g.id))
    // A failed checkpoint, repaired today, retries next training day. Checkpoints that can only open after it have nothing to do until then.
    const retrying = new Set(gates.filter((g) => g.state === 'handled').map((g) => g.unitId))
    const waitsOnRetry = (unitId: string): boolean => {
      const s = snap.byUnit.get(unitId)
      return Boolean(s?.locked) && s!.blockedBy.some((p) => retrying.has(p) || waitsOnRetry(p))
    }

    const targets: ContractTarget[] = due.targets
      .map((lc) => {
        const unit = UNITS.find((u) => u.targets.includes(lc))
        const s = unit ? snap.byUnit.get(unit.id) : undefined
        const state: ContractTarget['state'] = snap.solved.has(lc) ? 'done' : s && (s.state === 'ready' || s.state === 'maintenance') ? 'open' : 'locked'
        return { lc, title: PROBLEM_URLS[lc]?.title ?? `LC ${lc}`, unitId: unit?.id ?? '', state, dueDate: TARGET_DUE[lc], carried: carried(TARGET_DUE[lc]) }
      })
      .filter((t) => t.state !== 'done' || t.dueDate === date)

    // Repair is required as soon as a checkpoint fails, whichever day it was due.
    const repair: ContractRepair[] = snap.statuses.flatMap((s) =>
      s.gates.filter((g) => g.failed && g.repair.length).map((g) => ({ gateId: g.gate.id, title: g.gate.title, reps: g.repair }))
    )

    let complete = true
    const remaining: string[] = []
    if (type === 'training') {
      if (!reps.met) remaining.push(`${target - reps.done} more qualifying rep${target - reps.done === 1 ? '' : 's'}`)
      for (const r of repair) remaining.push(`Repair for ${r.title} (${r.reps.length} rep${r.reps.length === 1 ? '' : 's'})`)
      for (const l of labs) if (l.state !== 'done') remaining.push(`Lab: ${l.title}${l.carried ? ' (carried over)' : ''}`)
      for (const g of gates)
        if (g.state !== 'cleared' && g.state !== 'handled' && !(g.state === 'locked' && waitsOnRetry(g.unitId)))
          remaining.push(`Checkpoint: ${g.title}${g.state === 'locked' ? ' (finish the reps before it first)' : ''}`)
      for (const t of targets) if (t.state === 'open') remaining.push(`Target: LC ${t.lc} ${t.title}`)
      complete = remaining.length === 0
    }
    return { date, week, type, plan, reps, labs, gates, targets, repair, complete, remaining }
  }

  function weekContract(week: number, date: string): WeekContract {
    const dates = weekDates(week)
    const days = trainingDays(week)
    const end = dates[6]
    const asOf = date < end ? date : end
    const snap = snapshot(asOf)
    let done = 0
    for (const d of dates) if (d <= asOf) done += snapshot(d).credits
    const overlay = dates[0] >= SPRINT_START
    // Sprint and Prep weeks: the week's target is the sum of its days' targets; its checkpoints and labs are those due in it.
    const target = overlay ? days.reduce((n, d) => n + dayContract(d).reps.target, 0) : weekTarget(week)
    if (overlay) return overlayWeek(week, date, dates, days, target)
    const units = UNITS.filter((u) => u.week === week)
    const labs = LABS.filter((l) => l.week === week).map((l) => ({
      id: l.id,
      title: l.title,
      optional: Boolean(l.optional),
      done: snap.labsDone.has(l.id),
      dueDate: LAB_DUE[l.id]
    }))
    const gates = units
      .flatMap((u) => u.gateIds)
      .filter((id) => GATE_BY_ID[id])
      .map((id) => {
        const s = gateOf(id, snap).status
        return { id, title: GATE_BY_ID[id].title, cleared: !s || s.available.length === 0 || s.cleared, dueDate: GATE_DUE[id] }
      })
    const targets = units
      .flatMap((u) => u.targets)
      .map((lc) => ({ lc, title: PROBLEM_URLS[lc]?.title ?? `LC ${lc}`, solved: snap.solved.has(lc), dueDate: TARGET_DUE[lc] }))
    const daysComplete = days.filter((d) => d <= asOf && dayContract(d).complete).length
    const rate = dailyTarget(week)
    const pastDays = days.filter((d) => d < date)
    const todayDone = days.includes(date) && dayContract(date).complete
    const expected = Math.min(target, (pastDays.length + (todayDone ? 1 : 0)) * rate)
    const shortfall = Math.max(0, (date > end ? target : expected) - done)
    const overdue = [
      ...labs.filter((l) => !l.optional && !l.done && l.dueDate && l.dueDate < date).map((l) => `Lab: ${l.title}`),
      ...gates.filter((g) => !g.cleared && g.dueDate && g.dueDate < date).map((g) => `Checkpoint: ${g.title}`),
      ...targets.filter((t) => !t.solved && t.dueDate && t.dueDate < date).map((t) => `Target: LC ${t.lc} ${t.title}`)
    ]
    const complete = done >= target && labs.every((l) => l.optional || l.done) && gates.every((g) => g.cleared) && targets.every((t) => t.solved)
    let status: WeekState
    if (date < dates[0]) status = 'upcoming'
    else if (complete) status = 'complete'
    else if (shortfall === 0 && overdue.length === 0) status = 'on-track'
    else if (shortfall <= rate && overdue.length <= 1 && date <= end) status = 'recoverable'
    else status = 'off-track'
    return { week, output: { done, target }, labs, gates, targets, trainingDays: days.length, daysComplete, shortfall, overdue, complete, status }
  }

  function overlayWeek(week: number, date: string, dates: string[], days: string[], target: number): WeekContract {
    const end = dates[6]
    const asOf = date < end ? date : end
    const snap = snapshot(asOf)
    let done = 0
    for (const d of dates) if (d <= asOf) done += snapshot(d).credits
    const inWeek = (d?: string) => Boolean(d && d >= dates[0] && d <= end)
    const labs = LABS.filter((l) => inWeek(dueOf('lab', l.id))).map((l) => ({ id: l.id, title: l.title, optional: Boolean(l.optional), done: snap.labsDone.has(l.id), dueDate: dueOf('lab', l.id) }))
    const gates = [...overlayDue.gates]
      .filter(([, d]) => inWeek(d))
      .map(([id, d]) => {
        const s = gateOf(id, snap).status
        return { id, title: GATE_BY_ID[id].title, cleared: !s || s.available.length === 0 || s.cleared, dueDate: d }
      })
    const pastDays = days.filter((d) => d < date)
    const todayDone = days.includes(date) && dayContract(date).complete
    const expected = Math.min(target, [...pastDays, ...(todayDone ? [date] : [])].reduce((n, d) => n + dayContract(d).reps.target, 0))
    const shortfall = Math.max(0, (date > end ? target : expected) - done)
    const daysComplete = days.filter((d) => d <= asOf && dayContract(d).complete).length
    const overdue = [
      ...labs.filter((l) => !l.optional && !l.done && l.dueDate && l.dueDate < date).map((l) => `Lab: ${l.title}`),
      ...gates.filter((g) => !g.cleared && g.dueDate < date).map((g) => `Checkpoint: ${g.title}`)
    ]
    const rate = Math.max(1, ...days.map((d) => dayContract(d).reps.target))
    const complete = done >= target && labs.every((l) => l.optional || l.done) && gates.every((g) => g.cleared)
    let status: WeekState
    if (date < dates[0]) status = 'upcoming'
    else if (complete) status = 'complete'
    else if (shortfall === 0 && overdue.length === 0) status = 'on-track'
    else if (shortfall <= rate && overdue.length <= 1 && date <= end) status = 'recoverable'
    else status = 'off-track'
    return { week, output: { done, target }, labs, gates, targets: [], trainingDays: days.length, daysComplete, shortfall, overdue, complete, status }
  }

  /** Consecutive required training days completed, counting back from `date` (rest and Saturdays protect it). */
  function streak(date: string): number {
    let n = 0
    for (const d of [...SCHEDULE.flatMap((w) => w.days.map((x) => x.date))].filter((d) => d <= date).reverse()) {
      if (dayType(d) !== 'training') continue
      if (dayContract(d).complete) n++
      else if (d === date) continue
      else break
    }
    return n
  }

  return { dayContract, weekContract, streak, snapshot }
}

export type Contracts = ReturnType<typeof createContracts>

/** Units reference for callers that need titles. */
export { UNIT_BY_ID }
