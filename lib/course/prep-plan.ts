import { SECTION_BY_ID } from '@/data/course'
import { courseWeekOf, dayType } from '@/data/course/calendar'
import { LAB_BY_ID, LESSON_BY_ID } from '@/data/course/lessons'
import { FORMAT_ROTATION, SQL_CHECKLIST, STORY_PROMPTS, type StoryPrompt } from '@/data/course/prep-content'
import type { DayPlan } from '@/data/course/schedule'
import { DP_LIGHT, DP_WEEK, isBigTech, MOCK_UNITS, MOCKS_FROM, PREP_START, REVIEW_PER_DAY, SPRINT_START } from '@/data/course/sprint'
import { labProgress } from '@/lib/course/labs'
import { courseStatus, unitInventory, type UnitStatus } from '@/lib/course/routing'
import { orderedReview, type ReviewPick, type SprintDay } from '@/lib/course/sprint-plan'
import { sprintDayOn, type OverlayInput } from '@/lib/course/sprint-day'
import { addDays, daysBetween, parseLocal } from '@/lib/dates'
import type { Attempt } from '@/lib/types'

/**
 * Prep mode, from Dec 1: a fixed daily template filled from units already
 * ready. It does not depend on weeks 6–13 of the old course.
 *  1. Timed: two problems, 30 minutes each, mixed and unlabeled. A miss comes back three days later.
 *  2. Format practice, rotating Mon–Sat: a CodeSignal-style 4-level build, API integration, debugging, SQL.
 *  3. The AI project ramp: structured output → tools → retrieval → evals → write-up.
 *  4. Behavioral: one STAR or project deep-dive prompt, saved under `story:<id>`.
 *  5. 1D DP: three reps a day in the week of Dec 14.
 *  6. Review: up to four pending review-queue items.
 * Sprint work that spilled (Dec 1–5) comes first. Derived every time; nothing stored.
 */

export const storyKey = (id: string) => `story:${id}`
export const TIMED_MINUTES = 30
export const TIMED_PER_DAY = 2

export interface PrepFormat {
  kind: 'codesignal' | 'api' | 'debug' | 'sql'
  title: string
  minutes: number
  note: string
  /** A lab (codesignal), a rep (api / debug), or a checklist session done outside the app (sql). */
  labId?: string
  exerciseId?: string
  checklist?: { id: string; title: string; items: string[] }
}

export interface AiStep {
  key: string
  title: string
  lessonId?: string
  labId?: string
  /** Needs a real model call: build it outside the app with the same scaffold. */
  outside?: boolean
}

export const AI_RAMP: AiStep[] = [
  { key: 'structured', title: 'Structured output + validation', lessonId: 'ae-model-boundary', labId: 'lab-support-router' },
  { key: 'tools', title: 'Tools: the model proposes, code executes', lessonId: 'ae-tools-workflows' },
  { key: 'retrieval', title: 'Retrieval: grounded answers', lessonId: 'ae-retrieval', labId: 'lab-grounded-answer' },
  { key: 'evals', title: 'Evals: tests for AI behaviour', lessonId: 'ae-evals' },
  { key: 'write-up', title: 'Write-up: the customer workflow, end to end', labId: 'lab-fde-workflow', outside: true }
]

export interface PrepDay {
  date: string
  plan: DayPlan
  /** Reps the day asks for: timed problems, review, 1D DP, and any sprint carry-over. */
  target: number
  timed: string[]
  format?: PrepFormat
  ai?: AiStep
  story?: StoryPrompt
  dp: string[]
  review: ReviewPick[]
  /** Sprint work spilled into Dec 1–5 (required, first). */
  carry?: SprintDay
}

const passedOk = (a: Attempt) => a.passed && a.completedAt && !a.solutionViewed

/** Ready units only (state ready or maintenance), as of the start of the date. */
function readyStatuses(date: string, input: OverlayInput): UnitStatus[] {
  const before = input.attempts.filter((a) => a.date < date)
  return courseStatus({ attempts: before, mastery: input.mastery, exercises: input.exercises, sections: input.sections, today: date }).filter(
    (s) => s.state === 'ready' || s.state === 'maintenance'
  )
}

/**
 * Two timed problems from ready units, unlabeled: first any timed miss now three or more days old and not passed
 * since, then problems never passed, then those passed longest ago; at most one per unit.
 */
export function timedPicks(date: string, input: OverlayInput, ready: UnitStatus[]): string[] {
  const before = input.attempts.filter((a) => a.date < date)
  const lastPass = new Map<string, string>()
  const lastMiss = new Map<string, string>()
  for (const a of before) {
    if (passedOk(a)) lastPass.set(a.exerciseId, a.date > (lastPass.get(a.exerciseId) ?? '') ? a.date : lastPass.get(a.exerciseId)!)
    else if (!a.passed) lastMiss.set(a.exerciseId, a.date > (lastMiss.get(a.exerciseId) ?? '') ? a.date : lastMiss.get(a.exerciseId)!)
  }
  const candidates = ready.flatMap((s) =>
    [...s.path, ...unitInventory(s.unit, input)]
      .filter((e) => e.kind === 'code' && !e.lab && !e.gate && (e.repType === 'capstone' || e.stage === 'pattern' || e.stage === 'interview' || e.minutes >= 10))
      .map((e) => ({ id: e.id, unitId: s.unit.id }))
  )
  const rank = (id: string) => {
    const miss = lastMiss.get(id)
    if (miss && (!lastPass.has(id) || lastPass.get(id)! < miss)) return daysBetween(miss, date) >= 3 ? 0 : 9
    return lastPass.has(id) ? 2 : 1
  }
  const ordered = [...new Map(candidates.map((c) => [c.id, c])).values()]
    .filter((c) => rank(c.id) < 9)
    .sort((a, b) => rank(a.id) - rank(b.id) || (lastPass.get(a.id) ?? '').localeCompare(lastPass.get(b.id) ?? '') || a.id.localeCompare(b.id))
  const out: string[] = []
  const units = new Set<string>()
  for (const c of ordered) {
    if (out.length >= TIMED_PER_DAY) break
    if (units.has(c.unitId)) continue
    out.push(c.id)
    units.add(c.unitId)
  }
  return out
}

/** Today's format practice (Mon–Sat rotation), pointing at the next unfinished piece of it. */
export function formatFor(date: string, input: OverlayInput): PrepFormat | undefined {
  const dow = parseLocal(date).getDay()
  const f = FORMAT_ROTATION.find((x) => x.dow === dow)
  if (!f) return undefined
  const passed = new Set(input.attempts.filter((a) => a.date < date && passedOk(a)).map((a) => a.exerciseId))
  const base: PrepFormat = { kind: f.kind, title: f.title, minutes: f.minutes, note: f.note }
  if (f.kind === 'codesignal') {
    const labId = ['lab-bank-system', 'lab-inmemory-db'].find((id) => LAB_BY_ID[id] && !labProgress(LAB_BY_ID[id], input.labStates[id], input.attempts).done) ?? 'lab-inmemory-db'
    return { ...base, labId }
  }
  if (f.kind === 'sql') {
    const n = Math.floor(daysBetween(PREP_START, date) / 7)
    return { ...base, checklist: SQL_CHECKLIST[n % SQL_CHECKLIST.length] }
  }
  const reps = SECTION_BY_ID[f.kind === 'api' ? 'prep-api' : 'prep-debug']?.exercises ?? []
  const next = reps.find((e) => !passed.has(e.id)) ?? reps[Math.floor(daysBetween(PREP_START, date) / 7) % Math.max(1, reps.length)]
  return { ...base, exerciseId: next?.id }
}

/** The next AI-ramp step not done yet (its lesson read and, where it has one, its lab done). */
export function aiStepFor(input: OverlayInput & { state?: (key: string) => unknown }): AiStep | undefined {
  const read = (id: string) => Boolean(input.state?.(`lesson:${id}`))
  return AI_RAMP.find((s) => (s.lessonId && LESSON_BY_ID[s.lessonId] && !read(s.lessonId)) || (s.labId && LAB_BY_ID[s.labId] && !labProgress(LAB_BY_ID[s.labId], input.labStates[s.labId], input.attempts).done))
}

/** One story prompt a day: the first not answered yet, else rotate. */
export function storyFor(date: string, state?: (key: string) => unknown): StoryPrompt {
  const open = STORY_PROMPTS.filter((p) => !state?.(storyKey(p.id)))
  const list = open.length ? open : STORY_PROMPTS
  return list[Math.max(0, daysBetween(PREP_START, date)) % list.length] ?? list[0]
}

/** 1D DP in the week of Dec 14: the next three unpassed reps of DP_LIGHT. */
export function dpFor(date: string, input: OverlayInput): string[] {
  if (date < DP_WEEK.from || date > DP_WEEK.to) return []
  const passed = new Set(input.attempts.filter((a) => a.date < date && passedOk(a)).map((a) => a.exerciseId))
  return DP_LIGHT.filter((id) => input.exercises[id] && !passed.has(id)).slice(0, DP_WEEK.perDay)
}

const cache = new WeakMap<object, Map<string, PrepDay | null>>()

/** The Prep day for a date from PREP_START (undefined before it or on rest). */
export function prepDayOn(date: string, input: OverlayInput & { state?: (key: string) => unknown }): PrepDay | undefined {
  if (date < PREP_START || dayType(date) !== 'training') return undefined
  let byDate = cache.get(input)
  if (!byDate) cache.set(input, (byDate = new Map()))
  if (byDate.has(date)) return byDate.get(date) ?? undefined
  const ready = readyStatuses(date, input)
  const carry = sprintDayOn(date, input)
  const timed = timedPicks(date, input, ready)
  const dp = dpFor(date, input)
  const before = input.attempts.filter((a) => a.date < date)
  const taken = new Set([...timed, ...dp, ...(carry?.newReps.map((r) => r.exerciseId) ?? [])])
  const review = orderedReview({ review: input.review ?? [], exercises: input.exercises, mastery: input.mastery, attempts: before })
    .filter((r) => !taken.has(r.exerciseId))
    .slice(0, REVIEW_PER_DAY)
  const format = formatFor(date, input)
  const ai = aiStepFor(input)
  const story = storyFor(date, input.state)
  const carryReps = carry ? carry.target : 0
  const plan: DayPlan = {
    date,
    week: courseWeekOf(date),
    focusUnits: carry?.focusUnits ?? [],
    gatesDue: carry?.gatesDue ?? [],
    labsDue: carry?.labsDue ?? [],
    targetsDue: [],
    theme: `Prep: ${TIMED_PER_DAY} timed problems, ${format?.title ?? 'review'}${ai ? `, AI: ${ai.title}` : ''}${dp.length ? ', 1D DP' : ''}`
  }
  const day: PrepDay = { date, plan, target: timed.length + review.length + dp.length + carryReps, timed, format, ai, story, dp, review, carry }
  byDate.set(date, day)
  return day
}

/** Prep mocks: from MOCKS_FROM, only when every unit the mock draws on is ready (big-tech units only once their checkpoint is cleared). */
export function prepMockAllowed(date: string, mockId: string, statuses: UnitStatus[]): boolean {
  if (date < MOCKS_FROM) return false
  const units = MOCK_UNITS[mockId]
  if (!units) return false
  return units.every((id) => {
    const s = statuses.find((x) => x.unit.id === id)
    if (!s || (s.state !== 'ready' && s.state !== 'maintenance')) return false
    return !isBigTech(id) || (s.gates.length > 0 && s.gates.every((g) => g.cleared))
  })
}

/** Prep is open on a date (interview mode, regardless of w13-transfer). */
export const prepOpen = (date: string) => date >= PREP_START

export { SPRINT_START, addDays }
