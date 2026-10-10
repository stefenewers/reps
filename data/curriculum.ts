import type { DayModule, Exercise, Section } from '@/lib/types'
import { day as oct02 } from '@/data/exercises/oct02'
import { day as oct03 } from '@/data/exercises/oct03'
import { day as oct04 } from '@/data/exercises/oct04'
import { day as oct05 } from '@/data/exercises/oct05'
import { day as oct06 } from '@/data/exercises/oct06'
import { day as oct07 } from '@/data/exercises/oct07'
import { day as oct08 } from '@/data/exercises/oct08'
import { day as oct09 } from '@/data/exercises/oct09'
import { day as oct10 } from '@/data/exercises/oct10'
import { day as oct11 } from '@/data/exercises/oct11'
import { MOCK_EXERCISES } from '@/data/mocks'
import { OPTIONAL_SECTIONS, PICKS, REQUIRED_COLD_CAPSTONES, SCHEDULE, TRIM_FROM } from '@/data/schedule'
import { PLAN_90, PLAN_START } from '@/data/schedule-90'
import { PROGRAM_STAGES } from '@/data/program'

/**
 * Two views of the same content:
 *
 * - MODULES: the ten authored topic modules (data/exercises/*). Content checks,
 *   guardrails and Road to Ready measure these.
 * - DAYS: the calendar, assembled from MODULES by data/schedule.ts. Today, the
 *   day pages, the progress rail and review scheduling use these.
 *
 * Required vs extra is decided here, deterministically, and never changes an
 * exercise itself: extras simply sit in sections marked `optional`.
 */

export const MODULES: DayModule[] = [oct02, oct03, oct04, oct05, oct06, oct07, oct08, oct09, oct10, oct11]

export const INTERVIEW_DATE = '2026-10-12'

// ── required vs extra ────────────────────────────────────────────────────────

const INTERVIEW_MODULE = oct11.date

/** Whole sections that are extra: module warm-ups and end-of-module cold reps (spaced review covers them). */
function sectionIsOptional(moduleDate: string, s: Section): boolean {
  if (OPTIONAL_SECTIONS.includes(s.id)) return true
  return moduleDate !== INTERVIEW_MODULE && /(^|-)warmup$|(^|-)cold$/.test(s.id)
}

/**
 * The priority cut (tightened Oct 7): the reps a section cannot do without.
 * The first rep (it introduces the idea), the first write rep (so every
 * section has you produce code), and every capstone.
 */
export function isCoreRep(s: Section, index: number): boolean {
  const e = s.exercises[index]
  if (e.repType === 'capstone' || index === 0) return true
  return index === s.exercises.findIndex((x) => x.kind === 'code' && x.repType !== 'capstone')
}

/** Within a required section: capstone explain reps and variants after the last capstone are extra, and past TRIM_FROM anything outside the core. */
function exerciseIsOptional(moduleDate: string, s: Section, index: number, trim: boolean): boolean {
  const e = s.exercises[index]
  if (moduleDate === INTERVIEW_MODULE) return s.id === 'o11-cold' && !REQUIRED_COLD_CAPSTONES.includes(e.id)
  if (e.repType === 'capstone') return false
  if (trim && !isCoreRep(s, index)) return true
  const lastCap = s.exercises.reduce((at, x, i) => (x.repType === 'capstone' ? i : at), -1)
  if (lastCap < 0) return false
  return e.kind === 'explain' || index > lastCap
}

function splitSection(moduleDate: string, s: Section, trim = false): { required: Section | null; extra: Section | null } {
  // A pick list names exactly which reps of a section the calendar requires, overriding every other rule.
  const picks = trim ? PICKS[s.id] : undefined
  if (picks) {
    const req = s.exercises.filter((e) => picks.includes(e.id))
    const opt = s.exercises.filter((e) => !picks.includes(e.id))
    return {
      required: req.length ? { ...s, exercises: req } : null,
      extra: opt.length ? { ...s, id: `${s.id}-extra`, title: `${s.title} · more`, exercises: opt, optional: true } : null,
    }
  }
  if (sectionIsOptional(moduleDate, s)) return { required: null, extra: { ...s, optional: true } }
  const req = s.exercises.filter((_, i) => !exerciseIsOptional(moduleDate, s, i, trim))
  const opt = s.exercises.filter((_, i) => exerciseIsOptional(moduleDate, s, i, trim))
  return {
    required: req.length ? { ...s, exercises: req } : null,
    extra: opt.length ? { ...s, id: `${s.id}-extra`, title: `${s.title} · more`, exercises: opt, optional: true } : null,
  }
}

const SECTION_HOME = new Map<string, { module: DayModule; section: Section }>()
for (const m of MODULES) for (const s of m.sections) SECTION_HOME.set(s.id, { module: m, section: s })

// ── calendar days ────────────────────────────────────────────────────────────

const STAGE_BY_MODULE = Object.fromEntries(PROGRAM_STAGES.map((s) => [s.dayDate, s]))

/** Every rep the 90-day plan schedules, and the ones inside its mastery checks. */
const PLAN_REP_IDS = new Set(PLAN_90.flatMap((d) => d.sections.flatMap((s) => s.reps)))
const PLAN_GATE_IDS = new Set(PLAN_90.flatMap((d) => d.sections.filter((s) => s.gate).flatMap((s) => s.reps)))

/** A section without the reps the 90-day plan has taken over; null when nothing is left. */
function withoutPlanReps(s: Section): Section | null {
  const exercises = s.exercises.filter((e) => !PLAN_REP_IDS.has(e.id))
  return exercises.length ? { ...s, exercises } : null
}

function buildDays(): DayModule[] {
  const scheduledIds = new Set(SCHEDULE.flatMap((d) => d.sections))
  // A module's leftover sections (warm-ups, anything neither calendar uses) land as extras on the last day the module appears.
  const lastDayOfModule = new Map<string, string>()
  for (const d of SCHEDULE) for (const id of d.sections) lastDayOfModule.set(SECTION_HOME.get(id)!.module.date, d.date)
  for (const d of PLAN_90) for (const s of d.sections) lastDayOfModule.set(SECTION_HOME.get(s.id)!.module.date, d.date)
  const leftoversFor = (date: string): Section[] =>
    MODULES.filter((m) => lastDayOfModule.get(m.date) === date).flatMap((m) =>
      m.sections.flatMap((s) => {
        if (scheduledIds.has(s.id)) return []
        const rest = withoutPlanReps(s)
        return rest ? [{ ...rest, id: rest.exercises.length === s.exercises.length ? s.id : `${s.id}-extra`, optional: true }] : []
      }),
    )

  // ── the October sprint (Oct 2–10), as it happened
  const sprint: DayModule[] = SCHEDULE.map(({ date, sections: ids, short: shortName, title: titleName }) => {
    // A day with nothing scheduled is an off day.
    if (!ids.length) return { date, short: 'Off day', title: 'Off day', focus: 'No reps planned.', sections: leftoversFor(date), capstones: [], modules: [] }
    const required: Section[] = []
    const extra: Section[] = []
    const modules: string[] = []
    for (const id of ids) {
      const home = SECTION_HOME.get(id)
      if (!home) throw new Error(`schedule: unknown section ${id}`)
      if (!modules.includes(home.module.date)) modules.push(home.module.date)
      const { required: r, extra: x } = splitSection(home.module.date, home.section, date >= TRIM_FROM)
      // Reps the 90-day plan re-schedules leave the sprint day they were first planned on.
      const rr = r && withoutPlanReps(r)
      const xx = x && withoutPlanReps(x)
      if (rr) required.push(rr)
      if (xx) extra.push(xx)
    }
    extra.push(...leftoversFor(date))

    const module0 = MODULES.find((m) => m.date === modules[0])!
    const stages = modules.map((m) => STAGE_BY_MODULE[m]).filter(Boolean)
    const spans = modules.map((m) => {
      const secs = required.filter((s) => SECTION_HOME.get(s.id)?.module.date === m)
      const stage = STAGE_BY_MODULE[m]
      return secs.length ? `${stage?.title ?? m}: ${secs[0].title}${secs.length > 1 ? ` → ${secs[secs.length - 1].title}` : ''}` : ''
    })
    const capstones = required.flatMap((s) => s.exercises.filter((e) => e.repType === 'capstone' && e.problemId).map((e) => e.problemId!))
    return {
      date,
      short: shortName ?? (date === INTERVIEW_MODULE ? module0.short : stages.map((s) => s.shortTitle).join(' → ')),
      title: titleName ?? (date === INTERVIEW_MODULE ? module0.title : stages.map((s) => s.title).join(' → ')),
      focus: date === INTERVIEW_MODULE ? module0.focus : `${spans.filter(Boolean).join('. Then ')}.`,
      sections: [...required, ...extra],
      capstones,
      mocks: modules.includes(INTERVIEW_MODULE) ? module0.mocks : undefined,
      modules,
    }
  })

  // ── the 90-day ladder plan (from Oct 11): each pattern is a ladder, a mastery check, then its LeetCode problems
  const plan: DayModule[] = PLAN_90.map((d, i) => {
    const planDay = i + 1
    if (d.phase === 'off') return { date: d.date, short: 'Off day', title: 'Off day', focus: 'Rest. Nothing is planned.', sections: leftoversFor(d.date), capstones: [], modules: [], phase: 'off', planDay, planWeek: d.week, planMinutes: 0 }
    const modules: string[] = []
    const required: Section[] = d.sections.map((item) => {
      const home = SECTION_HOME.get(item.id)
      if (!home) throw new Error(`plan: unknown section ${item.id}`)
      if (!modules.includes(home.module.date)) modules.push(home.module.date)
      const exercises = item.reps.map((id) => {
        const e = home.section.exercises.find((x) => x.id === id)
        if (!e) throw new Error(`plan: ${id} is not in ${item.id}`)
        return e
      })
      return {
        ...home.section,
        // A mastery check keeps its own label; a section split across days says so.
        title: item.label ?? home.section.title,
        summary: item.gate ? 'The mastery check for this pattern: cold reps, passed without opening the solution, before what follows unlocks.' : home.section.summary,
        exercises,
        gate: item.gate || undefined,
      }
    })
    const news = d.leetcode.filter((x) => x.type === 'new').length
    const resolves = d.leetcode.length - news
    const parts = [
      required.length ? `Reps: ${required.map((s) => s.title).filter((t, k, a) => a.indexOf(t) === k).join(' → ')}` : '',
      news ? `${news} new on LeetCode` : '',
      resolves ? `${resolves} re-solve${resolves === 1 ? '' : 's'}` : '',
    ].filter(Boolean)
    return {
      date: d.date,
      short: d.short || 'Re-solves',
      title: d.unit || 'Re-solves',
      focus: `${parts.join(' · ')}.`,
      sections: [...required, ...leftoversFor(d.date)],
      capstones: required.flatMap((s) => s.exercises.filter((e) => e.repType === 'capstone' && e.problemId).map((e) => e.problemId!)),
      modules,
      leetcode: d.leetcode,
      phase: d.phase,
      planDay,
      planWeek: d.week,
      planMinutes: d.minutes,
    }
  })
  return [...sprint, ...plan]
}

/** The calendar: the October sprint (Oct 2–10) followed by the 90-day ladder plan (Oct 11 → Jan 8). */
export const DAYS: DayModule[] = buildDays()

export const FIRST_DAY = DAYS[0].date
export const LAST_DAY = DAYS[DAYS.length - 1].date

export const DAY_BY_DATE: Record<string, DayModule> = Object.fromEntries(DAYS.map((d) => [d.date, d]))

/** Every curriculum exercise (each exactly once), in module order, plus mock problems. */
export const ALL_EXERCISES: Exercise[] = [
  // Reps inside a plan mastery check only count when passed without the solution.
  ...MODULES.flatMap((d) => d.sections.flatMap((s) => s.exercises)).map((e) => (PLAN_GATE_IDS.has(e.id) ? { ...e, cleanPass: true } : e)),
  ...MOCK_EXERCISES,
]

/** Where the 90-day plan begins. */
export { PLAN_START }

/** "Day 12 of 90" inside the plan; the days before it carry no label, only their date. */
export function dayLabel(day: DayModule): string {
  return day.planDay ? `Day ${day.planDay} of ${PLAN_90.length}` : ''
}

/** Days in the 90-day plan, in order. */
export const PLAN_DAYS: DayModule[] = DAYS.filter((d) => d.planDay)

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(ALL_EXERCISES.map((e) => [e.id, e]))

/** The calendar day an exercise is scheduled on (required or extra). */
export const DAY_OF_EXERCISE: Record<string, string> = Object.fromEntries(DAYS.flatMap((d) => d.sections.flatMap((s) => s.exercises.map((e) => [e.id, d.date] as const))))

/** The topic module an exercise belongs to. */
export const MODULE_OF_EXERCISE: Record<string, string> = Object.fromEntries(MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises.map((e) => [e.id, m.date] as const))))

/** Required (non-extra) sections of a day or module. */
export function requiredSections(day: DayModule): Section[] {
  return day.sections.filter((s) => !s.optional)
}

/** The required reps of a day or module, in order. */
export function dayExercises(day: DayModule): Exercise[] {
  return requiredSections(day).flatMap((s) => s.exercises)
}

/** Every rep on a day or in a module, extras included. */
export function allDayExercises(day: DayModule): Exercise[] {
  return day.sections.flatMap((s) => s.exercises)
}

/** Modules reduced to the reps the calendar requires (after the priority cut): what Road to Ready measures. */
const CALENDAR_REQUIRED = new Set(DAYS.flatMap((d) => dayExercises(d).map((e) => e.id)))
export const REQUIRED_MODULES: DayModule[] = MODULES.map((m) => ({
  ...m,
  sections: m.sections.flatMap((s) => {
    const exercises = s.exercises.filter((e) => CALENDAR_REQUIRED.has(e.id))
    return exercises.length ? [{ ...s, exercises }] : []
  }),
}))

// Every authored section is scheduled exactly once, either directly or as a module extra.
{
  const seen = new Map<string, number>()
  for (const d of DAYS) for (const e of allDayExercises(d)) seen.set(e.id, (seen.get(e.id) ?? 0) + 1)
  for (const m of MODULES)
    for (const e of allDayExercises(m)) if (seen.get(e.id) !== 1) throw new Error(`schedule: ${e.id} scheduled ${seen.get(e.id) ?? 0} times`)
}
