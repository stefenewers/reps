import type { Target } from '@/lib/bridges'
import { daysBetween } from '@/lib/dates'
import type { SkillMastery } from '@/lib/mastery'
import { countsAsEvidence } from '@/lib/mastery'
import { REPAIR_SHAPE, classifyFailure, freshnessOf, phaseEmphasis, practiceBySkill, repPurpose, targetTraining, type Failure, type RepairCategory, type TargetTraining, type TrainingContext, type TrainingState } from '@/lib/training-state'
import type { Attempt, Exercise, SkillId } from '@/lib/types'

/**
 * The training session planner: what to do first today.
 *
 * The canonical queue (lib/pacing.ts) still decides the long-term order and
 * what counts as done. This is a routing layer over it: it takes today's
 * stretch of the queue and wraps it in what makes that stretch land:
 *
 *   1. reactivate  stale prerequisites of today's work, and due retrieval that today's work relies on
 *   2. the stretch itself, in queue order, labelled by purpose: learn, drill, combine, prove
 *      (an open mastery check sits where the queue puts it: first)
 *   3. prove       the target problem, only when its building blocks are in place
 *   4. maintain    other due retrieval and re-solves: never a blocker
 *
 * Reactivation and maintenance repeat reps already passed. That creates new
 * attempt evidence and refreshes the skill; it never changes what the queue
 * counts as complete. Everything is deterministic and derived from attempts.
 */

export type BlockKind = 'reactivate' | TrainingState

export interface SessionBlock {
  kind: BlockKind
  title: string
  /** Exercise ids, in order. Empty for a problem solved outside the editor. */
  reps: string[]
  /** Authored minutes. */
  minutes: number
  /** One line on why this block is here. */
  why: string
  /** A problem solved on LeetCode. */
  lc?: number
  /** Set when the block only opens once something earlier is done. */
  onlyIf?: string
  /** Repeats of reps already passed (not part of the canonical queue). */
  extra?: boolean
  /** Re-solves on LeetCode carried by a maintain block. */
  resolves?: number
}

export interface SessionPlan {
  goal: string
  target: { lc: number; title: string } | null
  training: TargetTraining | null
  blocks: SessionBlock[]
}

export interface StretchRep {
  id: string
  sectionId: string
  sectionTitle: string
  gate: boolean
}

export interface PlannerInput {
  /** Today's stretch of the canonical queue: the undone reps, in order. */
  stretch: StretchRep[]
  /** New problems the queue reaches today, solved on LeetCode. */
  problems: { lc: number; title: string; ready: boolean }[]
  /** Every authored exercise, by id and as a pool to draw repeats from. */
  exercises: Record<string, Exercise>
  attempts: Attempt[]
  mastery: Record<SkillId, SkillMastery>
  today: string
  planDay?: number
  /** What the stretch builds toward. */
  target: Target | null
  targetSolved: boolean
  /** Skills whose spaced review is due now. */
  dueSkills: SkillId[]
  /** LeetCode re-solves due today. */
  dueResolves: number
  strong: (skill: SkillId) => boolean
  /** Depth in the prerequisite graph, primitives first. */
  depth: (skill: SkillId) => number
  skillName: (skill: SkillId) => string
  /** A reactivation session already prescribed (the one-time return session): it stands in for the computed one. */
  pending?: { title: string; reps: string[]; why: string }
}

const minutes = (ids: string[], ex: Record<string, Exercise>) => Math.round(ids.reduce((n, id) => n + (ex[id]?.minutes ?? 0), 0))
const list = (xs: string[], max = 3) => (xs.length <= max ? xs.join(', ') : `${xs.slice(0, max).join(', ')} and ${xs.length - max} more`)

/** One small rep per skill, already passed before, never a capstone or a check: the cheapest way to produce the skill again. */
export function pickRepeats(skills: SkillId[], input: Pick<PlannerInput, 'exercises'>, passed: Set<string>, exclude: Set<string>, limit: number): string[] {
  const pool = Object.values(input.exercises)
    .filter((e) => e.kind === 'code' && passed.has(e.id) && !exclude.has(e.id) && e.repType !== 'capstone' && e.repType !== 'cold' && e.stage !== 'retrieval' && !e.generated)
    .sort((a, b) => a.minutes - b.minutes || a.skills.length - b.skills.length || a.id.localeCompare(b.id))
  const picked: string[] = []
  const covered = new Set<SkillId>()
  for (const s of skills) {
    if (picked.length >= limit) break
    if (covered.has(s)) continue
    const e = pool.find((x) => x.skills.includes(s) && !picked.includes(x.id))
    if (!e) continue
    picked.push(e.id)
    for (const k of e.skills) covered.add(k)
  }
  return picked
}

/**
 * Reps from the last session that were passed only with the solution open or on three or more hints, worst first,
 * returned in the order they were done. A clean pass on a later day (today included) settles a rep.
 */
export function shakyReps(attempts: Attempt[], today: string, exercises: Record<string, Exercise>, limit: number): string[] {
  const last = [...new Set(attempts.filter((a) => a.date < today && a.completedAt).map((a) => a.date))].sort().pop()
  if (!last) return []
  const settled = new Set(attempts.filter((a) => a.date > last && a.passed && a.completedAt && !a.solutionViewed && a.hintsUsed === 0).map((a) => a.exerciseId))
  const worst = new Map<string, { score: number; at: string }>()
  for (const a of attempts) {
    const e = exercises[a.exerciseId]
    if (a.date !== last || !a.passed || !a.completedAt || !e || e.kind !== 'code' || e.generated || settled.has(a.exerciseId)) continue
    const score = (a.solutionViewed ? 10 : 0) + a.hintsUsed
    if (score < 3) continue
    const prev = worst.get(a.exerciseId)
    if (!prev || score > prev.score) worst.set(a.exerciseId, { score, at: prev?.at ?? a.completedAt })
  }
  return [...worst.entries()]
    .sort((a, b) => b[1].score - a[1].score || a[1].at.localeCompare(b[1].at))
    .slice(0, limit)
    .sort((a, b) => a[1].at.localeCompare(b[1].at))
    .map(([id]) => id)
}

export function planTrainingSession(input: PlannerInput): SessionPlan {
  const { exercises, today } = input
  const passed = new Set(input.attempts.filter((a) => a.passed && a.completedAt).map((a) => a.exerciseId))
  const practice = practiceBySkill(input.attempts)
  const ctx: TrainingContext = { passed, mastery: input.mastery, practice, today, strong: input.strong }
  const phase = phaseEmphasis(input.planDay)
  const training = input.target ? targetTraining(input.target, input.targetSolved, ctx) : null
  const blocks: SessionBlock[] = []
  const inStretch = new Set(input.stretch.map((r) => r.id))

  // ── what today's work relies on
  const relies = new Set<SkillId>()
  for (const r of input.stretch) for (const s of [...(exercises[r.id]?.prerequisites ?? []), ...(exercises[r.id]?.skills ?? [])]) relies.add(s)
  for (const s of training?.staleSkills ?? []) relies.add(s)
  const learned = (s: SkillId) => (practice.get(s)?.productive ?? 0) > 0
  // A due review that today's work relies on comes first, unless the skill was produced in the last day anyway:
  // then it is not what stands between you and today's work, and it waits with the other retrieval.
  const justDone = (s: SkillId) => daysBetween(practice.get(s)?.last ?? '2000-01-01', today) <= 1
  const dueRelevant = input.dueSkills.filter((s) => relies.has(s) && learned(s) && !justDone(s))
  const dueOther = input.dueSkills.filter((s) => learned(s) && !dueRelevant.includes(s))
  const stale = [...relies].filter((s) => learned(s) && freshnessOf(practice.get(s), today) === 'stale')

  // ── 1. reactivate: you already learned this; it is being warmed back up
  if (input.pending) {
    blocks.push({ kind: 'reactivate', title: input.pending.title, reps: input.pending.reps, minutes: minutes(input.pending.reps, exercises), why: input.pending.why, extra: true })
  } else {
    const wanted = [...new Set([...dueRelevant, ...stale])].sort((a, b) => input.depth(a) - input.depth(b) || a.localeCompare(b))
    const reps = pickRepeats(wanted, input, passed, inStretch, phase.reactivate)
    if (reps.length) {
      const names = [...new Set(reps.flatMap((id) => exercises[id].skills.filter((s) => wanted.includes(s))))].map(input.skillName)
      blocks.push({
        kind: 'reactivate',
        title: list(names),
        reps,
        minutes: minutes(reps, exercises),
        why: `You already learned ${names.length === 1 ? 'this' : 'these'}. ${reps.length === 1 ? 'One quick rep warms it' : `${reps.length} quick reps warm them`} back up before today's work leans on ${names.length === 1 ? 'it' : 'them'}.`,
        extra: true,
      })
    }
  }

  // ── 1b. what only just held last session: passed, but with the solution open or on several hints. Written again
  // cold before anything is built on it. (Passing it again straight after, the same day, does not settle it.)
  const taken = new Set([...inStretch, ...blocks.flatMap((b) => b.reps)])
  const redo = input.pending ? [] : shakyReps(input.attempts, today, exercises, 3).filter((id) => !taken.has(id))
  if (redo.length) {
    blocks.push({
      kind: 'drill',
      title: 'Again, cold: what needed help last session',
      reps: redo,
      minutes: minutes(redo, exercises),
      why: `You got through ${redo.length === 1 ? 'this' : 'these'} with the solution or several hints. Write ${redo.length === 1 ? 'it' : 'them'} again from blank before building on ${redo.length === 1 ? 'it' : 'them'}.`,
      extra: true,
    })
  }

  // ── 2. the stretch, in queue order, grouped by what each rep is for
  for (const r of input.stretch) {
    const e = exercises[r.id]
    if (!e) continue
    const kind = repPurpose(e, r, ctx)
    const last = blocks[blocks.length - 1]
    if (last && !last.extra && !last.lc && last.kind === kind && (kind !== 'prove' || last.title === r.sectionTitle)) {
      last.reps.push(r.id)
      last.minutes = minutes(last.reps, exercises)
      if (!last.title.split(' → ').includes(r.sectionTitle) && last.title.split(' → ').length < 3) last.title += ` → ${r.sectionTitle}`
      continue
    }
    blocks.push({ kind, title: r.sectionTitle, reps: [r.id], minutes: minutes([r.id], exercises), why: WHY[kind](r, input.target) })
  }

  // A lone rep of another kind inside a ladder run (one combining rep among drills) stays with its run: a block is a
  // stretch of work with one purpose, not a label per rep. Bridges and anything that proves keep their own block.
  for (let i = blocks.length - 1; i > 0; i--) {
    const b = blocks[i]
    const prev = blocks[i - 1]
    const own = (x: SessionBlock) => x.extra || x.kind === 'prove' || x.reps.some((id) => input.stretch.find((r) => r.id === id)?.sectionId.startsWith('br-'))
    if (own(b) || own(prev)) continue
    if (b.kind !== prev.kind && b.reps.length > 1) continue
    prev.reps.push(...b.reps)
    prev.minutes = minutes(prev.reps, exercises)
    for (const t of b.title.split(' → ')) if (!prev.title.split(' → ').includes(t) && prev.title.split(' → ').length < 3) prev.title += ` → ${t}`
    blocks.splice(i, 1)
  }
  // Absorbing a lone rep can leave two runs of the same kind side by side: they are one block.
  for (let i = blocks.length - 1; i > 0; i--) {
    const b = blocks[i]
    const prev = blocks[i - 1]
    if (b.extra || prev.extra || b.kind !== prev.kind || b.kind === 'prove' || b.why !== prev.why) continue
    prev.reps.push(...b.reps)
    prev.minutes = minutes(prev.reps, exercises)
    for (const t of b.title.split(' → ')) if (!prev.title.split(' → ').includes(t) && prev.title.split(' → ').length < 3) prev.title += ` → ${t}`
    blocks.splice(i, 1)
  }

  // ── 3. prove: the target problem, only when its building blocks are in place
  for (const p of input.problems) {
    const mine = input.target?.lc === p.lc ? training : null
    const warm = mine && mine.stale.length > 0
    blocks.push({
      kind: 'prove',
      title: p.title,
      reps: [],
      minutes: 30,
      lc: p.lc,
      why: 'Every move it needs is one you have already written. Now assemble them.',
      onlyIf: p.ready ? (warm ? 'once the blocks above are warm again' : undefined) : 'only after its building blocks are in place',
    })
  }

  // ── 4. maintain: other due retrieval. Never ahead of what you are building toward.
  const used = new Set([...inStretch, ...blocks.flatMap((b) => b.reps)])
  const keep = pickRepeats([...dueOther].sort((a, b) => input.depth(a) - input.depth(b) || a.localeCompare(b)), input, passed, used, phase.maintain)
  if (keep.length || input.dueResolves) {
    blocks.push({
      kind: 'maintain',
      title: [keep.length ? `${keep.length} cold rep${keep.length === 1 ? '' : 's'}` : '', input.dueResolves ? `${input.dueResolves} re-solve${input.dueResolves === 1 ? '' : 's'} on LeetCode` : ''].filter(Boolean).join(' · '),
      reps: keep,
      minutes: minutes(keep, exercises) + input.dueResolves * 15,
      why: 'Brought back before it fades. If one does not come back, it goes back to a short drill, not to the start.',
      extra: true,
      resolves: input.dueResolves || undefined,
    })
  }

  return { goal: goalFor(input, training, blocks), target: input.target ? { lc: input.target.lc, title: input.target.title } : null, training, blocks }
}

const WHY: Record<TrainingState, (r: StretchRep, t: Target | null) => string> = {
  learn: () => 'New here: see it once, then type it straight away.',
  drill: () => 'Understood, not yet automatic. Small productions until the mechanics stop costing attention.',
  combine: (r, t) => (t && r.sectionId === t.section ? `The moves ${t.title} needs that the ladder did not teach, put together.` : 'The pieces exist. This is where they are put together.'),
  prove: (r) => (r.gate ? 'Cold, from a signature, without the solution: the check that the pattern is yours.' : 'Every move it needs is one you have already written. Now assemble them.'),
  maintain: () => 'Brought back before it fades.',
}

function goalFor(input: PlannerInput, training: TargetTraining | null, blocks: SessionBlock[]): string {
  if (input.pending) return 'Restore fluency before continuing the plan.'
  const work = blocks.filter((b) => !b.extra)
  const t = input.target
  if (!work.length) return blocks.length ? 'Keep what you have: retrieval only today.' : 'Nothing is scheduled today.'
  const titles = [...new Set(work.filter((b) => !b.lc).flatMap((b) => b.title.split(' → ')))]
  if (t && training?.state === 'prove') return `Prove ${t.title}: every building block is in place.`
  if (t && training?.state === 'combine') return `Combine toward ${t.title}.`
  if (work.every((b) => b.kind === 'prove')) return `Prove it: ${list(titles, 2)}.`
  const first = work.find((b) => b.kind === 'learn' || b.kind === 'drill' || b.kind === 'combine') ?? work[0]
  const what = first.title.split(' → ').slice(0, 2).join(' and ').toLowerCase()
  return t && what !== t.title.toLowerCase() ? `Get ${what} automatic, on the way to ${t.title}.` : `Get ${what} automatic.`
}

// ── repair: the smallest broken thing ────────────────────────────────────────

export interface Repair {
  category: RepairCategory
  reps: string[]
  /** What the reps go after, in plain words. */
  focus: string
}

/** A failed rep earns a repair offer after this many failed submissions. */
export const REPAIR_AFTER = 2

/**
 * After a rep keeps failing: a short set that steps back only as far as the
 * failure calls for, then returns to the rep. Authored reps only.
 */
export function planRepair(e: Exercise, failure: Failure, input: Pick<PlannerInput, 'exercises' | 'mastery' | 'depth' | 'skillName'> & { target: Target | null; order: (id: string) => number }): Repair {
  const category = classifyFailure(e, failure)
  const shape = REPAIR_SHAPE[category]
  const none = { category, reps: [], focus: 'the code in front of you' }
  if (shape.from === 'stay') return none
  const at = input.order(e.id)
  // Reps that come before this one in the plan (or anywhere, for reps outside it): small first.
  const earlier = Object.values(input.exercises)
    .filter((x) => x.id !== e.id && x.kind === 'code' && x.repType !== 'capstone' && x.repType !== 'cold' && !x.generated && input.order(x.id) < at)
    .sort((a, b) => a.minutes - b.minutes || a.skills.length - b.skills.length || a.id.localeCompare(b.id))
  const on = (skill: SkillId, n: number, debugFirst = false) => {
    const mine = earlier.filter((x) => x.skills.includes(skill))
    const debug = mine.filter((x) => x.style === 'debug')
    const rest = mine.filter((x) => x.style !== 'debug')
    return (debugFirst ? [...debug, ...rest] : [...rest.slice(0, Math.max(1, n - 1)), ...debug.slice(0, 1), ...rest.slice(Math.max(1, n - 1))]).slice(0, n).map((x) => x.id)
  }
  const all = [...new Set([...e.skills, ...e.prerequisites])]
  const weakest = (skills: SkillId[]) => [...skills].sort((a, b) => (input.mastery[a]?.score ?? 0) - (input.mastery[b]?.score ?? 0) || a.localeCompare(b))[0]

  if (shape.from === 'block' && input.target) {
    const block = input.target.blocks.find((b) => b.reps?.includes(e.id) || b.evidence?.includes(e.id)) ?? input.target.blocks[input.target.blocks.length - 1]
    const reps = [...(block.reps ?? []), ...(block.evidence ?? [])].filter((id) => id !== e.id && input.exercises[id]).slice(0, shape.reps)
    if (reps.length) return { category, reps, focus: block.label }
  }
  // Syntax goes to the most primitive skill involved; everything else to the weakest skill the rep trains.
  const skill = shape.from === 'primitive' ? [...all].sort((a, b) => input.depth(a) - input.depth(b) || a.localeCompare(b))[0] : weakest(e.skills)
  if (!skill) return none
  const reps = on(skill, shape.reps, shape.from === 'debug')
  return reps.length ? { category, reps, focus: input.skillName(skill) } : none
}

/**
 * Acceleration inside a session: an extra rep (reactivation, repair) is skipped
 * once every skill it would exercise has come back clean three times since the
 * session began. Canonical reps are never skipped.
 */
export function nextInSession(ids: string[], current: string, extras: Set<string>, exercises: Record<string, Exercise>, since: Attempt[]): string | null {
  const clean = new Map<SkillId, number>()
  for (const a of since) if (a.passed && a.completedAt && a.attemptsBeforePass === 0 && a.hintsUsed === 0 && !a.solutionViewed) for (const s of a.skills) clean.set(s, (clean.get(s) ?? 0) + 1)
  const done = new Set(since.filter((a) => a.passed && a.completedAt).map((a) => a.exerciseId))
  for (const id of ids.slice(ids.indexOf(current) + 1)) {
    if (done.has(id)) continue
    const e = exercises[id]
    if (extras.has(id) && e && e.skills.length > 0 && e.skills.every((s) => (clean.get(s) ?? 0) >= 3)) continue
    return id
  }
  return null
}

// ── narrative: where you were, and what changed ──────────────────────────────

/** The last day with productive work before today, and what it was on. */
export function lastSession(attempts: Attempt[], today: string, sectionTitle: (exerciseId: string) => string | undefined): { date: string; on: string[] } | null {
  const days = [...new Set(attempts.filter((a) => a.passed && a.completedAt && a.date < today).map((a) => a.date))].sort()
  const date = days[days.length - 1]
  if (!date) return null
  const count = new Map<string, number>()
  for (const a of attempts) {
    if (a.date !== date || !a.passed) continue
    const t = sectionTitle(a.exerciseId)
    if (t) count.set(t, (count.get(t) ?? 0) + 1)
  }
  return { date, on: [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t) }
}

export interface SessionReview {
  /** Had evidence before today and every rep on it today was clean. */
  clean: SkillId[]
  /** The score moved up today (or it was produced for the first time). */
  improved: SkillId[]
  /** Failed, or needed hints, the solution or several tries today. */
  developing: SkillId[]
  reps: number
}

const RANK = { unseen: 0, weak: 1, introduced: 1, practicing: 2, competent: 3, fluent: 4 } as const

/** What changed because of today's training, by skill. */
export function sessionReview(attempts: Attempt[], today: string, before: Record<SkillId, SkillMastery>, now: Record<SkillId, SkillMastery>): SessionReview {
  const mine = attempts.filter((a) => a.date === today && countsAsEvidence(a))
  const bySkill = new Map<SkillId, Attempt[]>()
  for (const a of mine) for (const s of a.skills) bySkill.set(s, [...(bySkill.get(s) ?? []), a])
  const out: SessionReview = { clean: [], improved: [], developing: [], reps: mine.filter((a) => a.passed).length }
  for (const [s, as] of [...bySkill.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
    if (!now[s]) continue
    const allClean = as.every((a) => a.passed && a.attemptsBeforePass === 0 && a.hintsUsed === 0 && !a.solutionViewed)
    if (!allClean) out.developing.push(s)
    // Improved: produced for the first time, or the mastery status stepped up. A score that only crept is "came back clean".
    else if (!(before[s]?.attempts ?? 0) || RANK[now[s].status] > RANK[before[s].status]) out.improved.push(s)
    else out.clean.push(s)
  }
  return out
}
