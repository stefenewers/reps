import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { SECTION_BY_ID } from '@/data/course'
import { GATE_BY_ID, GATE_OF_EXERCISE } from '@/data/course/gates'
import { LAB_BY_ID, LABS } from '@/data/course/lessons'
import {
  BIG_TECH_DP_REPS,
  BIG_TECH_PACK,
  DP_LIGHT,
  isBigTech,
  MOCK_UNITS,
  SPRINT_END,
  SPRINT_PATHS,
  SPRINT_PREREQS,
  SPRINT_START,
  SPRINT_UNITS
} from '@/data/course/sprint'
import { UNIT_BY_ID, UNITS } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { MOCKS } from '@/data/mocks'
import { SKILLS } from '@/data/skills'
import { createContracts } from '@/lib/course/contract'
import { courseDailyPlan } from '@/lib/course/daily-plan'
import { exportInput, type ExportLike } from '@/lib/course/export-input'
import { labProgress } from '@/lib/course/labs'
import { prepDayOn, prepMockAllowed, storyKey } from '@/lib/course/prep-plan'
import { mockPolicy, transferGrade } from '@/lib/course/readiness'
import { courseQueue, courseStatus, type UnitStatus } from '@/lib/course/routing'
import { fadeFor, fadeSequence, nextFade, scaffoldKey, scaffoldProgress } from '@/lib/course/scaffold'
import { sprintDayOn, sprintPlanAsOf } from '@/lib/course/sprint-day'
import { trainingDaysBetween } from '@/lib/course/sprint-plan'
import { addDays, parseLocal } from '@/lib/dates'
import { MemoryLocalStore } from '@/lib/storage/local'
import { RepsRepository } from '@/lib/storage/repository'
import { SyncEngine } from '@/lib/storage/sync'
import { TABLES, type Table } from '@/lib/storage/types'
import { DAY_BY_DATE, LAST_DAY } from '@/data/curriculum'
import type { Attempt } from '@/lib/types'

/**
 * Sprint (Nov 16–30) and Prep (from Dec 1) on progress shaped like the learner's real export: a sanitized copy
 * (lib/course/__fixtures__/progress-nov16.json: code and free text redacted), or private/progress.json when present.
 */
const FIXTURE = existsSync('private/progress.json') ? 'private/progress.json' : 'lib/course/__fixtures__/progress-nov16.json'
const load = (file = FIXTURE) => JSON.parse(readFileSync(file, 'utf8')) as ExportLike & Record<Table, { id: string }[]> & { app: 'reps'; version: 1; exportedAt: string }
const bundle = load()
const input = exportInput(bundle)
const at = (date: string) => ({ attempts: input.attempts, mastery: input.mastery, exercises: input.exercises, sections: input.sections, today: date })
const FAST = { flushDelayMs: { attempts: 0, skill_mastery: 0, daily_progress: 0, review_queue: 0, generated_reps: 0, study_state: 0 }, retryDelaysMs: [20] }

function freshRepo() {
  const engine = new SyncEngine(new MemoryLocalStore(), null, FAST)
  const repo = new RepsRepository(engine, { skillIds: SKILLS.map((s) => s.id), dayFor: (d) => DAY_BY_DATE[d], lastDay: LAST_DAY })
  return { engine, repo }
}

const overlayDates = () => {
  const out: string[] = []
  for (let d = SPRINT_START; d <= '2026-12-31'; d = addDays(d, 1)) out.push(d)
  return out
}

test('1. progress is preserved: rows round-trip exactly, every new function runs on it, nothing is written', async () => {
  const { engine, repo } = freshRepo()
  await engine.start()
  // Load every table as stored (no recomputation), as a synced device holds it.
  for (const t of TABLES) await engine.save(t, bundle[t] as never)
  const before = Object.fromEntries(TABLES.map((t) => [t, structuredClone(engine.all(t))]))
  const out = repo.exportData()
  for (const t of TABLES) assert.deepEqual(out[t], bundle[t], `${t}: export gives back every row as it was`)
  assert.deepEqual(out.rowCounts, Object.fromEntries(TABLES.map((t) => [t, bundle[t].length])))

  // The generated rep (gen-*) resolves through generated_reps; nothing drops or crashes on it.
  const gen = input.attempts.find((a) => a.exerciseId.startsWith('gen-'))
  assert.ok(gen && input.exercises[gen.exerciseId], 'the generated rep resolves')

  // Every new function, over the whole overlay window.
  const live = { ...input, review: repo.reviews(), state: (k: string) => repo.state(k) }
  for (const date of overlayDates()) {
    courseStatus(at(date))
    courseQueue(courseStatus(at(date)), at(date), new Set())
    courseDailyPlan(date, live)
    createContracts(live).dayContract(date)
    sprintDayOn(date, live)
    prepDayOn(date, live)
  }
  for (const lab of LABS.filter((l) => l.scaffold)) {
    scaffoldProgress(lab, repo.state(scaffoldKey(lab.id)))
    fadeFor(lab, LABS, input.labStates, {}, input.attempts)
  }
  for (const t of TABLES) assert.deepEqual(engine.all(t), before[t], `${t}: no row added, removed or changed`)

  // New study-state keys are only scaffold:* and story:*, and they never collide with an existing key.
  const keys = new Set(bundle.study_state.map((r) => r.id))
  for (const lab of LABS) assert.ok(!keys.has(scaffoldKey(lab.id)) || scaffoldKey(lab.id).startsWith('scaffold:'))
  assert.ok([...keys].every((k) => !k.startsWith('scaffold:') && !k.startsWith('story:')), 'the export has no keys in the new namespaces')
  assert.ok(storyKey('star-hard-bug').startsWith('story:'))

  // Import into a fresh device: the imported tables come back row for row (mastery and daily progress are derived and recomputed, as before).
  const other = freshRepo()
  await other.engine.start()
  await other.repo.importData(bundle)
  const back = other.repo.exportData()
  for (const t of ['attempts', 'review_queue', 'generated_reps', 'study_state'] as const)
    assert.deepEqual(
      [...back[t]].sort((a, b) => a.id.localeCompare(b.id)),
      [...bundle[t]].sort((a, b) => a.id.localeCompare(b.id)),
      `${t}: importData → exportData is lossless`
    )
  // A version-1 bundle without the new export fields still imports.
  const old = structuredClone(bundle) as Record<string, unknown>
  delete old.rowCounts
  delete old.syncStatus
  await assert.doesNotReject(freshRepo().repo.importData(old))
})

test('2. credit carries over: on Nov 16 weeks 1–3 add no teaching, the sprint starts with windows, review leads with shaky items, and ends by Nov 30', () => {
  const plan = sprintPlanAsOf('2026-11-16', input)
  const day = plan.days[0]
  assert.equal(day.date, '2026-11-16')
  const allNew = plan.days.flatMap((d) => d.newReps)
  assert.ok(allNew.every((r) => UNIT_BY_ID[r.unitId].week > 3 || UNIT_BY_ID[r.unitId].sprintOnly), 'no weeks 1–3 teaching')
  assert.equal(day.newReps[0].unitId, 'w4-windows')
  assert.ok(day.review.length > 0 && day.review[0].why === 'shaky', 'shaky review items come first')
  assert.ok(day.review.length <= 4)
  assert.equal(plan.behindBy, 0)
  assert.ok(plan.endsOn && plan.endsOn <= SPRINT_END, `ends ${plan.endsOn}`)
  // A passed rep never comes back as new work.
  const passed = new Set(input.attempts.filter((a) => a.passed && a.completedAt && !a.solutionViewed).map((a) => a.exerciseId))
  assert.ok(allNew.every((r) => !passed.has(r.exerciseId)))

  // Half the heaps sprint path already passed: less left, and the sprint ends no later.
  const half = SPRINT_PATHS['w9-heaps'].slice(0, 9)
  const extra: Attempt[] = half.map((id, i) => ({
    ...input.attempts[0],
    id: `half-${i}`,
    exerciseId: id,
    date: '2026-11-15',
    skills: EXERCISE_BY_ID[id].skills,
    stage: EXERCISE_BY_ID[id].stage,
    passed: true,
    solutionViewed: false,
    hintsUsed: 0,
    attemptsBeforePass: 0,
    startedAt: '2026-11-15T15:00:00Z',
    completedAt: '2026-11-15T15:05:00Z'
  }))
  const faster = sprintPlanAsOf('2026-11-16', { ...input, attempts: [...input.attempts, ...extra] })
  assert.equal(faster.remaining, plan.remaining - half.length)
  assert.ok(faster.endsOn! <= plan.endsOn!, `${faster.endsOn} <= ${plan.endsOn}`)
})

test('3. pre-sprint identity: every day before Nov 16 is exactly what main computed', async () => {
  const { execFileSync } = await import('node:child_process')
  const now = execFileSync('npx', ['tsx', 'scripts/pre-sprint-snapshot.ts', 'lib/course/__fixtures__/progress-nov16.json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.deepEqual(JSON.parse(now), JSON.parse(readFileSync('lib/course/__fixtures__/pre-sprint-snapshot.json', 'utf8')))
})

test('4. from Nov 16 grids wait on queue basics, not trees; the big-tech pack is never required', () => {
  const nov28 = courseStatus(at('2026-11-28'))
  const grids = nov28.find((s) => s.unit.id === 'w8-grids')!
  assert.ok(!grids.blockedBy.includes('w7-trees') && !grids.blockedBy.includes('w8-queue-bfs'), `grids blocked by ${grids.blockedBy}`)
  assert.deepEqual(UNIT_BY_ID['w8-grids'].prerequisites, ['w8-queue-bfs'], 'units.ts itself is untouched')
  for (const date of overlayDates()) {
    const statuses = courseStatus(at(date))
    assert.ok(
      courseQueue(statuses, at(date), new Set()).every((q) => !q.required || !isBigTech(q.unitId)),
      `${date}: a big-tech unit is required`
    )
    const day = sprintDayOn(date, input)
    if (day) assert.ok([...day.newReps.map((r) => r.unitId), ...day.gates.map((g) => g.unitId)].every((u) => !isBigTech(u)), `${date}: big-tech in the sprint plan`)
  }
})

test('5. target math: weekdays 15–24, Saturdays lower; an impossible backlog says "behind by N" and spills into Dec 1–5', () => {
  const plan = sprintPlanAsOf('2026-11-16', input)
  for (const d of plan.days) {
    const sat = parseLocal(d.date).getDay() === 6
    // The last day with work asks only for what is left; every full day sits in the band.
    assert.ok(d.target <= 24, `${d.date}: ${d.target}`)
    if (!sat && d.newReps.length && d.date < plan.endsOn!) assert.ok(d.target >= 15, `${d.date}: ${d.target}`)
    if (sat) assert.ok(d.target < 20, `${d.date} (Saturday): ${d.target}`)
  }
  // Nothing done from Nov 16 to Nov 27: two training days left cannot hold the sprint.
  const late = sprintPlanAsOf('2026-11-28', input)
  assert.ok(late.behindBy > 0, 'behind')
  assert.ok(late.days.every((d) => d.behindBy === late.behindBy))
  const spill = late.days.filter((d) => d.kind === 'spill')
  assert.ok(spill.length && spill.every((d) => d.date > SPRINT_END && d.date <= '2026-12-05'), 'spills into Dec 1–5')
  assert.ok(late.days.filter((d) => d.kind === 'weekday').every((d) => d.target === 24), 'at the cap')
  // The lowest priority goes first: linked lists before anything above it.
  const spilledUnits = new Set(spill.flatMap((d) => d.newReps.map((r) => r.unitId)))
  assert.ok(spilledUnits.has('w5-linked-lists'))
  // Rest days owe nothing.
  for (const d of ['2026-11-22', '2026-11-26', '2026-11-27', '2026-11-29']) assert.equal(createContracts(input).dayContract(d).reps.target, 0, d)
})

test('6. Dec 1 unlock: closed on Nov 30, the Prep template on Dec 1, mocks refused Dec 6 and allowed Dec 7 on ready units only', () => {
  const transfer = transferGrade(input.attempts, input.exercises, (SECTION_BY_ID['c13-transfer']?.exercises ?? []).map((e) => e.id))
  assert.equal(mockPolicy(transfer.grade).mocksAllowed, 0, 'Nov 30: the old readiness policy, closed')
  assert.equal(prepDayOn('2026-11-30', input), undefined)
  const dec1 = prepDayOn('2026-12-01', input)!
  assert.ok(dec1, 'Prep on Dec 1')
  assert.equal(dec1.timed.length, 2)
  assert.ok(dec1.timed.every((id) => !isBigTech(UNITS.find((u) => u.path?.includes(id))?.id ?? '')))
  assert.ok(dec1.format && dec1.story && dec1.review.length <= 4)
  assert.ok(dec1.carry, 'unfinished sprint work comes first on Dec 1')

  const status = (id: string, state: UnitStatus['state'], cleared = true) => ({ unit: UNIT_BY_ID[id], state, gates: [{ cleared }] }) as unknown as UnitStatus
  const allReady = Object.keys(UNIT_BY_ID).map((id) => status(id, 'ready'))
  assert.equal(prepMockAllowed('2026-12-06', 'mock-1', allReady), false)
  assert.equal(prepMockAllowed('2026-12-07', 'mock-1', allReady), true)
  const gridsNotReady = allReady.map((s) => (s.unit.id === 'w8-grids' ? status('w8-grids', 'practicing') : s))
  assert.equal(prepMockAllowed('2026-12-07', 'mock-1', gridsNotReady), false, 'a mock waits on its units')
  const treesUncleared = allReady.map((s) => (s.unit.id === 'w7-trees' ? status('w7-trees', 'ready', false) : s))
  assert.equal(prepMockAllowed('2026-12-07', 'mock-2', treesUncleared), false, 'a big-tech unit needs its checkpoint cleared')
  for (const m of MOCKS) assert.ok(MOCK_UNITS[m.id], `${m.id} maps to units`)
})

test('7. fading: full, full, partial, partial, minimal; a reveal sends the next lab back to full', () => {
  const clean = { revealed: false }
  assert.deepEqual(fadeSequence([clean, clean, clean, clean, clean]), ['full', 'full', 'partial', 'partial', 'minimal'])
  assert.equal(nextFade([]), 'full')
  assert.equal(nextFade([clean, clean, clean, clean, clean]), 'minimal')
  assert.deepEqual(fadeSequence([clean, clean, { revealed: true }, clean]), ['full', 'full', 'partial', 'full'])
  assert.equal(nextFade([clean, clean, clean, clean, { revealed: true }]), 'full')
  // The six labs finished before the Sprint are unscaffolded and do not count: the first sprint lab starts at full.
  const first = LAB_BY_ID['lab-activity-window']
  assert.equal(fadeFor(first, LABS, input.labStates, {}, input.attempts), 'full')
  const done = LABS.filter((l) => labProgress(l, input.labStates[l.id], input.attempts).done)
  assert.equal(done.length, 6)
  assert.ok(done.every((l) => !l.scaffold))
})

test('8. content integrity: every sprint id exists once, scaffolds name real exercises, new units sit in the right weeks', () => {
  for (const id of [...SPRINT_UNITS, ...BIG_TECH_PACK]) assert.ok(UNIT_BY_ID[id], id)
  assert.equal(new Set(SPRINT_UNITS).size, SPRINT_UNITS.length)
  for (const [unit, path] of Object.entries(SPRINT_PATHS)) {
    assert.equal(new Set(path).size, path.length, `${unit}: duplicate`)
    for (const id of path) {
      assert.ok(EXERCISE_BY_ID[id], `${unit}: missing ${id}`)
      // Existing path ids only. The light linked-list path also takes "remove from the end" and "cycle check" from
      // w6-fast-slow's path (the brief asks for them; w5-linked-lists' own path has neither).
      const own = [...UNIT_BY_ID[unit].path!, ...(unit === 'w5-linked-lists' ? UNIT_BY_ID['w6-fast-slow'].path! : [])]
      assert.ok(own.includes(id), `${unit}: ${id} is an existing path id`)
      assert.ok(!GATE_OF_EXERCISE[id])
    }
  }
  for (const [unit, pre] of Object.entries(SPRINT_PREREQS)) for (const p of [unit, ...pre]) assert.ok(UNIT_BY_ID[p], p)
  for (const id of [...DP_LIGHT, ...BIG_TECH_DP_REPS]) assert.ok(EXERCISE_BY_ID[id], id)
  for (const u of UNITS.filter((x) => x.sprintOnly)) {
    for (const id of u.path!) assert.ok(EXERCISE_BY_ID[id], `${u.id}: missing ${id}`)
    for (const g of u.gateIds) {
      assert.ok(GATE_BY_ID[g], g)
      assert.ok(GATE_BY_ID[g].pool.length >= 2 && GATE_BY_ID[g].pool.every((id) => EXERCISE_BY_ID[id]?.gate), `${g}: cold variants`)
    }
    for (const l of u.labIds) assert.ok(LAB_BY_ID[l], l)
  }
  const scaffolded = ['lab-activity-window', 'lab-undo-redo', 'lab-priority-queue', 'lab-calendar-conflicts', 'lab-bank-system', 'lab-product-catalog', 'lab-evacuation-map', 'lab-dependency-planner', 'lab-inmemory-db', 'lab-support-router']
  for (const id of scaffolded) {
    const lab = LAB_BY_ID[id]
    assert.ok(lab?.scaffold, `${id}: scaffold`)
    for (const s of lab.scaffold!.steps) assert.ok(EXERCISE_BY_ID[s.checkpoint.exerciseId ?? lab.buildExerciseId])
    assert.equal(lab.scaffold!.referenceSolution, EXERCISE_BY_ID[lab.buildExerciseId].solution, `${id}: reference is the build's solution`)
  }
  assert.ok(LAB_BY_ID['lab-inmemory-db'].optional, 'the Prep build is optional in the course')
  // Training days in the sprint: weekdays and the two Saturdays, not Thanksgiving.
  assert.deepEqual(trainingDaysBetween(SPRINT_START, SPRINT_END), [
    '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21',
    '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-28', '2026-11-30'
  ])
})

test('9. from Nov 16 the week, readiness and builds read the sprint: planned checkpoints, behind-by not calendar weeks, a reveal needs a later pass', async () => {
  const { readiness, evidenceSummary } = await import('@/lib/course/readiness')
  const { builtOwnWork } = await import('@/lib/course/labs')
  // The Nov 16 week lists the checkpoints and builds the sprint plan puts in it, none from the old Week 4 schedule alone.
  const c = createContracts({ ...input, review: input.review })
  const week = c.weekContract(4, '2026-11-16')
  const planned = sprintPlanAsOf('2026-11-16', input).days.filter((d) => d.date <= '2026-11-22')
  assert.deepEqual(new Set(week.gates.map((g) => g.id)), new Set(planned.flatMap((d) => d.gatesDue)))
  assert.deepEqual(new Set(week.labs.map((l) => l.id)), new Set(planned.flatMap((d) => d.labsDue)))
  assert.ok(week.gates.every((g) => !isBigTech(GATE_BY_ID[g.id].unitId)))
  assert.equal(week.status, 'on-track')
  // Readiness: on Dec 1 the frontier unit's week no longer makes it "weeks behind"; the sprint's own measure does.
  const base = { statuses: courseStatus(at('2026-12-01')), finishedWeeks: [] as never[], evidence: evidenceSummary(input.attempts, input.entries, input.exercises, '2026-12-01'), labs: [], mocksDone: 0, today: '2026-12-01' }
  assert.ok(readiness({ ...base, sprintBehind: 0 }).why.every((w) => !w.includes('behind the calendar')))
  assert.ok(readiness({ ...base }).why.some((w) => w.includes('behind the calendar')), 'without the sprint measure it would say weeks behind')
  assert.ok(readiness({ ...base, sprintBehind: 30 }).why.some((w) => w.includes('Sprint is behind by 30')))
  // A scaffold reveal: a build passed the same day is not own work; passed on a later day it is.
  const lab = LAB_BY_ID['lab-activity-window']
  const pass = (date: string): Attempt => ({ ...input.attempts[0], id: `rv-${date}`, exerciseId: lab.buildExerciseId, date, passed: true, solutionViewed: false, hintsUsed: 0, attemptsBeforePass: 0, startedAt: `${date}T15:00:00Z`, completedAt: `${date}T15:05:00Z` })
  assert.equal(builtOwnWork(lab.buildExerciseId, [pass('2026-11-17')], '2026-11-17'), false)
  assert.equal(builtOwnWork(lab.buildExerciseId, [pass('2026-11-18')], '2026-11-17'), true)
  assert.equal(labProgress(lab, undefined, [pass('2026-11-17')], { explainDone: true, revealedOn: '2026-11-17' }).buildPassed, false)
  assert.equal(labProgress(lab, undefined, [pass('2026-11-17')]).buildPassed, true, 'unscaffolded rules unchanged')
})

test('10. the whole program reads the Sprint: no lesson is stranded on a big-tech unit, library items say where they sit, the goal is the offer', async () => {
  const { appliedByUnitOn, APPLIED_BY_UNIT, APPLIED_SCHEDULE } = await import('@/data/course/applied')
  const { planPlace } = await import('@/lib/course/library')
  const { goalOn, PREP_LESSONS } = await import('@/data/course/sprint')
  const { STORY_PROMPTS: checklist } = await import('@/data/stories')
  const { STORY_PROMPTS: prepStories } = await import('@/data/course/prep-content')
  // Before the Sprint the applied schedule is untouched; from it, every applied lesson has a sprint, weeks 1–3 or Prep home.
  assert.equal(appliedByUnitOn('2026-11-10'), APPLIED_BY_UNIT)
  const now = appliedByUnitOn('2026-11-16')
  const placed = new Set(Object.values(now).flat())
  for (const { lessonId } of APPLIED_SCHEDULE) assert.ok(placed.has(lessonId) || PREP_LESSONS.includes(lessonId), `${lessonId} has a home`)
  assert.ok(Object.keys(now).every((u) => !isBigTech(u)), 'no applied lesson waits on a big-tech unit')
  assert.deepEqual(
    [planPlace('l-while', 'lesson'), planPlace('lab-evacuation-map', 'lab'), planPlace('ae-evals', 'lesson'), planPlace('trees', 'lesson')].map((p) => p?.label),
    ['Week 1', 'Sprint 9', 'Prep · Dec 1', 'Big-tech pack · optional']
  )
  assert.equal(planPlace('lab-dependency-planner', 'lab')?.label, 'Sprint 10')
  assert.deepEqual([goalOn('2026-11-10').short, goalOn('2026-11-16').short, goalOn('2027-02-05').short], ['Feb 1', 'the Jan 31 offer goal', 'the Feb 28 cutoff'])
  // story:<id> is shared by the Interview checklist and Prep's daily prompt: their ids never collide.
  const ids = new Set(checklist.map((s) => s.id))
  assert.ok(prepStories.every((s) => !ids.has(s.id)))
})

test('11. a doubled day takes the next training day’s reps and review; checkpoints keep their cold, next-day timing', () => {
  const day = '2026-11-17'
  const normal = sprintPlanAsOf(day, { ...input, doubleDays: [] })
  const doubled = sprintPlanAsOf(day, { ...input, doubleDays: [day] })
  const [today, tomorrow] = normal.days
  const twice = doubled.days[0]
  assert.equal(twice.target, today.target + tomorrow.target)
  assert.equal(twice.review.length, Math.min(8, today.review.length + tomorrow.review.length))
  assert.ok(today.newReps.every((r) => twice.newReps.some((x) => x.exerciseId === r.exerciseId)), 'today’s own reps stay')
  assert.ok(twice.newReps.length > today.newReps.length, 'tomorrow’s reps move in')
  assert.deepEqual(twice.gates, today.gates, 'no checkpoint is pulled forward onto the day its unit finishes')
  assert.ok(doubled.behindBy <= normal.behindBy)
  // Only the doubled date changes: the next day is planned from what was actually done.
  assert.deepEqual(sprintPlanAsOf('2026-11-18', { ...input, doubleDays: [day] }).days[0], sprintPlanAsOf('2026-11-18', { ...input, doubleDays: [] }).days[0])
})
