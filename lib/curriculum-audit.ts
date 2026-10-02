import type { DayModule, Exercise } from '@/lib/types'
import { SKILL_BY_ID } from '@/data/skills'
import { BLANK } from '@/lib/answers'

/**
 * Curriculum audit: how much of the planned study time is spent actually
 * writing and repairing Python. Classification looks at what the learner must
 * produce, not at labels: a "code" rep where you type one line is guided, a
 * fill with one tiny blank is passive.
 */

export type Bucket = 'choice' | 'output' | 'fill' | 'reorder' | 'write' | 'debug' | 'capstone' | 'explain'
export type Engagement = 'active' | 'guided' | 'passive'

export const BUCKETS: Bucket[] = ['choice', 'output', 'fill', 'reorder', 'write', 'debug', 'capstone', 'explain']
export const BUCKET_LABEL: Record<Bucket, string> = {
  choice: 'Multiple choice',
  output: 'Predict output',
  fill: 'Fill in blank',
  reorder: 'Reorder code',
  write: 'Write code',
  debug: 'Debug/fix',
  capstone: 'Capstone',
  explain: 'Explain/interview',
}

/** Thresholds the curriculum must keep. Encoded philosophy, enforced by tests. */
export const GUARDRAILS = {
  overallActiveTime: 0.75,
  dayActiveTime: 0.65,
  finalDayActiveTime: 0.7,
  maxConsecutivePassive: 3,
  overallActiveReps: 0.55,
  minDebugRepsPerDay: 4,
  maxCapstoneMinutes: 35,
}

/** Skills that are about talking, not typing: exempt from the from-scratch rule. */
const NON_CODE_SKILLS = new Set(['complexity', 'explanation', 'edge_cases'])

function codeLines(src: string): string[] {
  return src
    .split('\n')
    .map((l) => l.replace(/#.*$/, '').trimEnd())
    .filter((l) => l.trim() && l.trim() !== 'pass' && l.trim() !== '...')
}

/** Lines of the solution the learner has to produce (not already in the starter). */
export function productionLines(e: Exercise): number {
  if (!e.solution) return 0
  const given = new Map<string, number>()
  for (const l of codeLines((e.starterCode ?? '').replaceAll(BLANK, '\u0000'))) given.set(l.trim(), (given.get(l.trim()) ?? 0) + 1)
  let n = 0
  for (const l of codeLines(e.solution)) {
    const k = l.trim()
    const left = given.get(k) ?? 0
    if (left > 0) given.set(k, left - 1)
    else n++
  }
  return n
}

/** Characters typed into blanks, roughly: solution size minus the scaffold around the blanks. */
function blankChars(e: Exercise): number {
  const starter = e.starterCode ?? ''
  const blanks = starter.split(BLANK).length - 1
  const scaffold = starter.replaceAll(BLANK, '').replace(/\s+/g, '').length
  const sol = (e.solution ?? '').replace(/\s+/g, '').length
  return blanks ? Math.max(0, sol - scaffold) : 0
}

/**
 * An independent estimate of how long a rep takes, from what it asks you to do.
 * Used to keep authored minutes honest: estimates can't be inflated to hit a
 * coding-time target.
 */
export function modeledMinutes(e: Exercise): number {
  const b = bucketOf(e)
  const shown = codeLines(e.code ?? e.starterCode ?? '').length
  switch (b) {
    case 'choice':
      return 0.75
    case 'output':
      return Math.min(3, 1 + 0.15 * shown)
    case 'explain':
      return 4
    case 'reorder':
      return 1 + 0.3 * (e.lines?.length ?? 0)
    case 'fill':
      return 1 + blankChars(e) / 40
    case 'debug':
      return Math.min(14, 2 + 0.35 * shown + 0.8 * Math.max(1, productionLines(e)))
    case 'write':
      return Math.min(15, 1.5 + 0.8 * productionLines(e))
    case 'capstone':
      return Math.min(GUARDRAILS.maxCapstoneMinutes, e.minutes)
  }
}

/** Authored minutes may exceed the model (a learner is slower), but not wildly. */
export function inflated(e: Exercise): boolean {
  if (e.repType === 'capstone' || e.problemId) return e.minutes > GUARDRAILS.maxCapstoneMinutes
  const m = modeledMinutes(e)
  return e.minutes > Math.max(m * 1.75, m + 2.5)
}

export function bucketOf(e: Exercise): Bucket {
  switch (e.kind) {
    case 'choice':
      return 'choice'
    case 'output':
      return 'output'
    case 'explain':
      return 'explain'
    case 'reorder':
      return 'reorder'
    case 'code':
      if (e.repType === 'capstone') return 'capstone'
      if (e.style === 'debug') return 'debug'
      if ((e.starterCode ?? '').includes(BLANK)) return 'fill'
      return 'write'
  }
}

export function engagementOf(e: Exercise): Engagement {
  const b = bucketOf(e)
  if (b === 'choice' || b === 'output' || b === 'explain') return 'passive'
  if (b === 'capstone' || b === 'debug') return 'active'
  if (b === 'reorder') return (e.lines?.length ?? 0) >= 4 ? 'guided' : 'passive'
  if (b === 'fill') return blankChars(e) >= 25 ? 'guided' : 'passive'
  // write: judged by how much you produce
  const lines = productionLines(e)
  if (lines >= 2) return 'active'
  if (lines === 1) return 'guided'
  return 'passive'
}

/** Implementation from a blank editor or a bare signature. */
export function isFromScratch(e: Exercise): boolean {
  const b = bucketOf(e)
  if (b !== 'write' && b !== 'capstone') return false
  const scaffold = codeLines(e.starterCode ?? '').filter((l) => !/^\s*def\s|^\s*class\s|^\s*(from|import)\s/.test(l))
  return scaffold.length === 0 && productionLines(e) >= 2
}

export interface DayAudit {
  date: string
  short: string
  reps: number
  minutes: number
  byBucket: Record<Bucket, { reps: number; minutes: number }>
  byEngagement: Record<Engagement, { reps: number; minutes: number }>
  activeRepShare: number
  activeTimeShare: number
  guidedTimeShare: number
  passiveTimeShare: number
  /** Active share using modeled minutes instead of authored ones. */
  modeledActiveTimeShare: number
  modeledMinutes: number
  longestPassiveRun: { length: number; startsAt: string | null }
}

function emptyBuckets() {
  return Object.fromEntries(BUCKETS.map((b) => [b, { reps: 0, minutes: 0 }])) as Record<Bucket, { reps: number; minutes: number }>
}
function emptyEngagement() {
  return { active: { reps: 0, minutes: 0 }, guided: { reps: 0, minutes: 0 }, passive: { reps: 0, minutes: 0 } } as Record<Engagement, { reps: number; minutes: number }>
}

export function auditExercises(list: Exercise[], meta: { date: string; short: string }): DayAudit {
  const byBucket = emptyBuckets()
  const byEngagement = emptyEngagement()
  let minutes = 0
  let modeled = 0
  let modeledActive = 0
  let run = 0
  let runStart: string | null = null
  let longest = { length: 0, startsAt: null as string | null }
  for (const e of list) {
    const b = bucketOf(e)
    const g = engagementOf(e)
    byBucket[b].reps++
    byBucket[b].minutes += e.minutes
    byEngagement[g].reps++
    byEngagement[g].minutes += e.minutes
    minutes += e.minutes
    const mm = modeledMinutes(e)
    modeled += mm
    if (g === 'active') modeledActive += mm
    if (g === 'passive') {
      if (run === 0) runStart = e.id
      run++
      if (run > longest.length) longest = { length: run, startsAt: runStart }
    } else run = 0
  }
  const share = (x: number, of: number) => (of ? x / of : 0)
  return {
    ...meta,
    reps: list.length,
    minutes,
    byBucket,
    byEngagement,
    activeRepShare: share(byEngagement.active.reps, list.length),
    activeTimeShare: share(byEngagement.active.minutes, minutes),
    guidedTimeShare: share(byEngagement.guided.minutes, minutes),
    passiveTimeShare: share(byEngagement.passive.minutes, minutes),
    modeledActiveTimeShare: share(modeledActive, modeled),
    modeledMinutes: modeled,
    longestPassiveRun: longest,
  }
}

export function auditDays(days: DayModule[]): { days: DayAudit[]; overall: DayAudit } {
  const out = days.map((d) => auditExercises(d.sections.flatMap((s) => s.exercises), { date: d.date, short: d.short }))
  const overall = auditExercises(
    days.flatMap((d) => d.sections.flatMap((s) => s.exercises)),
    { date: 'overall', short: 'All days' },
  )
  // A passive run never spans days.
  overall.longestPassiveRun = out.reduce((m, d) => (d.longestPassiveRun.length > m.length ? d.longestPassiveRun : m), { length: 0, startsAt: null as string | null })
  return { days: out, overall }
}

/** Guardrail violations; empty means the curriculum is code-first enough. */
export function guardrailViolations(days: DayModule[]): string[] {
  const problems: string[] = []
  const { days: audits, overall } = auditDays(days)
  if (overall.activeTimeShare < GUARDRAILS.overallActiveTime)
    problems.push(`overall active coding time ${pct(overall.activeTimeShare)} < ${pct(GUARDRAILS.overallActiveTime)}`)
  if (overall.modeledActiveTimeShare < GUARDRAILS.overallActiveTime)
    problems.push(`overall modeled active coding time ${pct(overall.modeledActiveTimeShare)} < ${pct(GUARDRAILS.overallActiveTime)}`)
  if (overall.activeRepShare < GUARDRAILS.overallActiveReps)
    problems.push(`overall active rep share ${pct(overall.activeRepShare)} < ${pct(GUARDRAILS.overallActiveReps)}`)
  audits.forEach((a, i) => {
    if (a.byBucket.debug.reps < GUARDRAILS.minDebugRepsPerDay) problems.push(`${a.date}: only ${a.byBucket.debug.reps} debug reps (min ${GUARDRAILS.minDebugRepsPerDay})`)
    const min = i === audits.length - 1 ? GUARDRAILS.finalDayActiveTime : GUARDRAILS.dayActiveTime
    if (a.activeTimeShare < min) problems.push(`${a.date}: active coding time ${pct(a.activeTimeShare)} < ${pct(min)}`)
    if (a.modeledActiveTimeShare < min) problems.push(`${a.date}: modeled active coding time ${pct(a.modeledActiveTimeShare)} < ${pct(min)}`)
    if (a.longestPassiveRun.length > GUARDRAILS.maxConsecutivePassive)
      problems.push(`${a.date}: ${a.longestPassiveRun.length} passive reps in a row starting at ${a.longestPassiveRun.startsAt}`)
  })

  const all = days.flatMap((d) => d.sections.flatMap((s) => s.exercises))
  const skills = new Set(all.flatMap((e) => e.skills))
  for (const s of skills) {
    if (NON_CODE_SKILLS.has(s) || !SKILL_BY_ID[s]) continue
    if (!all.some((e) => e.skills.includes(s) && isFromScratch(e))) problems.push(`skill ${s} has no from-scratch implementation rep`)
  }
  for (const e of all) {
    if (e.repType === 'capstone' && e.kind !== 'code') problems.push(`[${e.id}] capstone is not an implementation rep`)
    if (inflated(e)) problems.push(`[${e.id}] ${e.minutes} min looks inflated (model: ${modeledMinutes(e).toFixed(1)} min for ${bucketOf(e)}, ${productionLines(e)} line(s) to write)`)
  }
  return problems
}

export const pct = (x: number) => `${Math.round(x * 100)}%`
