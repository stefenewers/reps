/**
 * Pre-sprint identity: everything the course engine says about the days before
 * SPRINT_START, as JSON. Generated once on untouched main and committed
 * (lib/course/__fixtures__/pre-sprint-snapshot.json); lib/course/sprint.test.ts
 * proves the branch produces the same output.
 *   npx tsx scripts/pre-sprint-snapshot.ts lib/course/__fixtures__/progress-nov16.json > out.json
 */
import { readFileSync } from 'node:fs'
import { SECTION_BY_ID } from '@/data/course'
import { LABS } from '@/data/course/lessons'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { SKILLS } from '@/data/skills'
import { createContracts } from '@/lib/course/contract'
import { courseDailyPlan } from '@/lib/course/daily-plan'
import { labKey } from '@/lib/course/labs'
import { courseQueue, courseStatus } from '@/lib/course/routing'
import { solvedDates } from '@/lib/course/contract'
import { computeAllMastery } from '@/lib/mastery'
import type { Attempt } from '@/lib/types'

const bundle = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const attempts = bundle.attempts as Attempt[]
const state = new Map<string, unknown>((bundle.study_state as { id: string; value: unknown }[]).map((r) => [r.id, r.value]))
const entries = [...state].filter(([k]) => k.startsWith('solve:')).map(([, v]) => v as never)
const exercises = { ...EXERCISE_BY_ID }
for (const g of bundle.generated_reps ?? []) if (!exercises[g.payload.id]) exercises[g.payload.id] = g.payload
const mastery = computeAllMastery(SKILLS.map((s) => s.id), attempts)
const labStates = Object.fromEntries(LABS.map((l) => [l.id, state.get(labKey(l.id)) as never]))
const input = { attempts, entries, mastery, labStates, exercises, sections: SECTION_BY_ID }
const contracts = createContracts(input)

const DATES = ['2026-10-26', '2026-10-28', '2026-10-31', '2026-11-03', '2026-11-06', '2026-11-08', '2026-11-10', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']
const out: Record<string, unknown> = {}
for (const today of DATES) {
  const ctx = { attempts: attempts.filter((a) => a.date <= today), mastery, exercises, sections: SECTION_BY_ID, today }
  const statuses = courseStatus(ctx)
  const solved = new Set(solvedDates(attempts.filter((a) => a.date <= today), entries.filter((e: { date: string }) => e.date <= today)).keys())
  out[today] = {
    statuses: statuses.map((s) => ({
      id: s.unit.id,
      state: s.state,
      route: s.route,
      locked: s.locked,
      blockedBy: s.blockedBy,
      done: s.done,
      total: s.total,
      path: s.path.map((e) => e.id),
      priorEvidence: s.priorEvidence,
      gates: s.gates.map((g) => ({ id: g.gate.id, cleared: g.cleared, clearedOn: g.clearedOn, clean: g.clean, failed: g.failed, next: g.next, repair: g.repair }))
    })),
    queue: courseQueue(statuses, ctx, solved).map((q) => `${q.key}|${q.purpose}|${q.required}|${q.unitId}`),
    day: { ...contracts.dayContract(today), plan: undefined },
    weeks: [1, 2, 3].map((w) => contracts.weekContract(w, today)),
    streak: contracts.streak(today),
    dailyPlan: courseDailyPlan(today, input).map((q) => `${q.key}|${q.purpose}|${q.required}`)
  }
}
console.log(JSON.stringify(out, null, 1))
