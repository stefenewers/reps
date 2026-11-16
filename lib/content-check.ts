import { spawnSync } from 'node:child_process'
import path from 'node:path'
import type { DayModule, Exercise } from '@/lib/types'
import { SKILL_BY_ID } from '@/data/skills'
import { PROBLEM_BY_ID } from '@/data/problems'
import { outputMatches, hasBlanks } from '@/lib/answers'
import { primerPrograms } from '@/data/primers'
import type { Primer } from '@/data/primers/types'
import { promptExamples } from '@/lib/wording'

/**
 * Verifies curriculum content against real Python (local python3, same
 * harness as the browser). Used by `npm run verify:content` and the tests.
 */

interface Job {
  id: string
  code: string
  tests: Exercise['tests']
}

interface HarnessTest {
  name: string
  passed: boolean
  error: string | null
  expected: string | null
  actual: string | null
}

interface HarnessResult {
  stdout: string
  error: string | null
  tests: HarnessTest[]
}

export function runPythonBatch(jobs: Job[]): Map<string, HarnessResult> {
  const driver = path.join(process.cwd(), 'scripts', 'verify_driver.py')
  const res = spawnSync('python3', [driver], { input: JSON.stringify(jobs), maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' })
  if (res.status !== 0) throw new Error(`python3 failed: ${res.stderr}`)
  const parsed = JSON.parse(res.stdout) as { id: string; result: HarnessResult }[]
  return new Map(parsed.map((r) => [r.id, r.result]))
}

function describe(r: HarnessResult): string {
  if (r.error) return r.error
  const bad = r.tests.filter((x) => !x.passed)
  return bad.map((x) => `${x.name}: expected ${x.expected} got ${x.actual}${x.error ? ` (${x.error})` : ''}`).join('; ')
}

export function verifyExercises(exercises: Exercise[]): string[] {
  const problems: string[] = []
  const jobs: Job[] = []
  const seen = new Set<string>()

  for (const e of exercises) {
    const where = `[${e.id}]`
    if (seen.has(e.id)) problems.push(`${where} duplicate id`)
    seen.add(e.id)
    for (const s of e.skills) if (!SKILL_BY_ID[s]) problems.push(`${where} unknown skill ${s}`)
    for (const s of e.prerequisites) if (!SKILL_BY_ID[s]) problems.push(`${where} unknown prerequisite ${s}`)
    if (!e.skills.length) problems.push(`${where} no skills`)
    if (e.problemId && !PROBLEM_BY_ID[e.problemId]) problems.push(`${where} unknown problem ${e.problemId}`)
    if (!e.prompt.trim()) problems.push(`${where} empty prompt`)

    switch (e.kind) {
      case 'choice':
        if (!e.options || e.options.length < 2) problems.push(`${where} choice needs 2+ options`)
        else if (e.answer === undefined || e.answer < 0 || e.answer >= e.options.length) problems.push(`${where} answer index out of range`)
        else if (new Set(e.options).size !== e.options.length) problems.push(`${where} duplicate options`)
        break
      case 'output':
        if (!e.code || e.expectedOutput === undefined) problems.push(`${where} output needs code and expectedOutput`)
        else jobs.push({ id: `${e.id}::output`, code: e.code, tests: [] })
        break
      case 'code':
      case 'reorder':
        if (!e.solution) problems.push(`${where} missing solution`)
        if (!e.tests?.length) problems.push(`${where} needs at least one test`)
        if (e.kind === 'reorder' && (e.lines?.length ?? 0) < 3) problems.push(`${where} reorder needs 3+ lines`)
        if (e.solution && e.tests?.length) jobs.push({ id: `${e.id}::solution`, code: e.solution, tests: e.tests })
        if (e.starterCode && e.tests?.length && !hasBlanks(e.starterCode)) jobs.push({ id: `${e.id}::starter`, code: e.starterCode, tests: e.tests })
        if (e.repType === 'capstone' && !e.tests?.some((x) => x.hidden)) problems.push(`${where} capstone should have hidden tests`)
        break
      case 'explain':
        if (!e.rubric?.length) problems.push(`${where} explain needs a rubric`)
        break
    }
  }

  if (!jobs.length) return problems
  const results = runPythonBatch(jobs)
  const byId = new Map(exercises.map((e) => [e.id, e]))
  for (const job of jobs) {
    const [id, what] = job.id.split('::')
    const e = byId.get(id)!
    const r = results.get(job.id)
    if (!r) {
      problems.push(`[${id}] no result`)
      continue
    }
    if (what === 'output') {
      if (r.error) problems.push(`[${id}] trace code raised: ${r.error}`)
      else if (!outputMatches(r.stdout, e.expectedOutput!)) problems.push(`[${id}] expectedOutput mismatch. Python printed:\n${r.stdout}\n--- but expected:\n${e.expectedOutput}`)
    } else if (what === 'solution') {
      if (r.error || r.tests.some((x) => !x.passed)) problems.push(`[${id}] solution fails: ${describe(r)}`)
    } else if (what === 'starter') {
      if (!r.error && r.tests.length && r.tests.every((x) => x.passed)) problems.push(`[${id}] starter code already passes every test`)
      if (e.style === 'debug' && !r.error) {
        const visible = r.tests.filter((_, i) => !e.tests?.[i]?.hidden)
        if (visible.length && visible.every((x) => x.passed)) problems.push(`[${id}] debug rep: the broken code must fail at least one visible test (or raise)`)
      }
    }
  }
  return problems
}

export function verifyDays(days: DayModule[]): string[] {
  const problems: string[] = []
  for (const d of days) {
    const total = d.sections.reduce((n, s) => n + s.exercises.length, 0)
    if (!total) problems.push(`[${d.date}] has no exercises`)
    for (const pid of d.capstones) {
      if (!PROBLEM_BY_ID[pid]) problems.push(`[${d.date}] unknown capstone ${pid}`)
      const has = d.sections.some((s) => s.exercises.some((e) => e.problemId === pid && e.repType === 'capstone'))
      if (!has) problems.push(`[${d.date}] capstone ${pid} has no cap- exercise in the day`)
    }
  }
  return problems
}

/** Primers: real skills, one primer per skill, and examples that print exactly what they claim. */
export function verifyPrimers(primers: Primer[]): string[] {
  const problems: string[] = []
  const owner = new Map<string, string>()
  for (const p of primers) {
    for (const s of p.skills) {
      if (!SKILL_BY_ID[s]) problems.push(`[primer ${p.id}] unknown skill ${s}`)
      if (owner.has(s)) problems.push(`[primer ${p.id}] skill ${s} already covered by ${owner.get(s)}`)
      owner.set(s, p.id)
    }
  }
  const programs = primerPrograms(primers as Primer[])
  const results = runPythonBatch(programs.map((x) => ({ id: x.id, code: x.code, tests: [] })))
  for (const x of programs) {
    const r = results.get(x.id)
    if (!r) problems.push(`[primer ${x.id}] no result`)
    else if (r.error) problems.push(`[primer ${x.id}] raised: ${r.error}`)
    else if (!outputMatches(r.stdout, x.output)) problems.push(`[primer ${x.id}] output mismatch. Python printed:\n${r.stdout}\n--- but expected:\n${x.output}`)
  }
  return problems
}


/** The worked examples in prompts (`f(args)` → `value`) must be true of the reference solution. */
export function verifyPromptExamples(exercises: Exercise[]): string[] {
  const jobs = exercises.map((e) => ({ id: e.id, solution: e.solution ?? '', examples: promptExamples(e) })).filter((j) => j.examples.length)
  if (!jobs.length) return []
  const driver = path.join(process.cwd(), 'scripts', 'verify_examples.py')
  const res = spawnSync('python3', [driver], { input: JSON.stringify(jobs), maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' })
  if (res.status !== 0) throw new Error(`python3 failed: ${res.stderr}`)
  const out = JSON.parse(res.stdout) as { id: string; errors: string[] }[]
  return out.flatMap((r) => r.errors.map((err) => `[${r.id}] prompt example: ${err}`))
}

/** Lesson code blocks are Python and must run; when a lesson states the output, Python must print exactly that. */
export function verifyLessons(lessons: { id: string; sections: { heading: string; code?: string; output?: string }[] }[]): string[] {
  const problems: string[] = []
  const jobs = lessons.flatMap((l) => l.sections.flatMap((s, i) => (s.code ? [{ id: `${l.id}#${i}`, code: s.code, output: s.output, heading: s.heading }] : [])))
  const results = runPythonBatch(jobs.map((j) => ({ id: j.id, code: j.code, tests: [] })))
  for (const j of jobs) {
    const r = results.get(j.id)
    if (!r) problems.push(`[lesson ${j.id}] no result`)
    else if (r.error) problems.push(`[lesson ${j.id} "${j.heading}"] raised: ${r.error}`)
    else if (j.output !== undefined && !outputMatches(r.stdout, j.output))
      problems.push(`[lesson ${j.id} "${j.heading}"] output mismatch. Python printed:\n${r.stdout}\n--- but the lesson says:\n${j.output}`)
  }
  return problems
}

/**
 * Lab scaffolds: the worked example's solution runs; every step's checkpoint tests pass on the reference
 * solution (or on the solution of the exercise the step names); a step count of 4–7, a hint ladder per step,
 * and 2–3 explain-back prompts. The starter code of the step's exercise must not already pass the step.
 */
export function verifyScaffolds(
  labs: { id: string; buildExerciseId: string; changeRequest: { exerciseId: string }; scaffold?: import('@/data/course/types').LabScaffold }[],
  exercises: Record<string, Exercise>
): string[] {
  const problems: string[] = []
  const jobs: Job[] = []
  for (const lab of labs) {
    const s = lab.scaffold
    if (!s) continue
    const where = `[scaffold ${lab.id}]`
    if (s.steps.length < 4 || s.steps.length > 7) problems.push(`${where} needs 4–7 steps, has ${s.steps.length}`)
    if (s.explainBack.length < 2 || s.explainBack.length > 3) problems.push(`${where} needs 2–3 explain-back prompts`)
    if (!s.workedExample.walkthrough.length) problems.push(`${where} worked example has no walkthrough`)
    if (!s.referenceSolution.trim()) problems.push(`${where} empty reference solution`)
    jobs.push({ id: `${lab.id}::example`, code: s.workedExample.solution, tests: [] })
    s.steps.forEach((step, i) => {
      if (!step.hints.length) problems.push(`${where} step ${i + 1} has no hints`)
      const exId = step.checkpoint.exerciseId ?? lab.buildExerciseId
      const ex = exercises[exId]
      if (!ex) problems.push(`${where} step ${i + 1} names unknown exercise ${exId}`)
      if (!step.checkpoint.tests?.length) return
      const reference = exId === lab.buildExerciseId ? s.referenceSolution : ex?.solution
      if (reference) jobs.push({ id: `${lab.id}::step${i}::ref`, code: reference, tests: step.checkpoint.tests })
      if (ex?.starterCode && !hasBlanks(ex.starterCode)) jobs.push({ id: `${lab.id}::step${i}::starter`, code: ex.starterCode, tests: step.checkpoint.tests })
    })
  }
  if (!jobs.length) return problems
  const results = runPythonBatch(jobs)
  for (const job of jobs) {
    const r = results.get(job.id)
    const [labId, what, kind] = job.id.split('::')
    if (!r) problems.push(`[scaffold ${labId}] ${what}: no result`)
    else if (what === 'example') {
      if (r.error) problems.push(`[scaffold ${labId}] worked example raised: ${r.error}`)
    } else if (kind === 'ref') {
      if (r.error || r.tests.some((x) => !x.passed)) problems.push(`[scaffold ${labId}] ${what} fails on the reference: ${describe(r)}`)
    } else if (kind === 'starter') {
      if (!r.error && r.tests.length && r.tests.every((x) => x.passed)) problems.push(`[scaffold ${labId}] ${what}: the starter code already passes this checkpoint`)
    }
  }
  return problems
}
