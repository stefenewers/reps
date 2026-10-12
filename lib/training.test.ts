import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isStrong, type Target } from '@/lib/bridges'
import { computeAllMastery } from '@/lib/mastery'
import { REPAIR_AFTER, lastSession, nextInSession, planRepair, planTrainingSession, sessionReview, type PlannerInput } from '@/lib/session-planner'
import { classifyFailure, freshnessOf, practiceBySkill, repPurpose, skillTrainingState, targetTraining, type TrainingContext } from '@/lib/training-state'
import { attempt, exercise } from '@/lib/test-helpers'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * The training layer: what kind of practice helps now (training state), what is
 * available today (freshness), and what to do first (the session planner).
 */

const TODAY = '2026-11-20'
const SKILLS = ['for_loop', 'enumerate', 'dict_assign', 'dict_get', 'index_map', 'complement', 'two_pointer', 'sorting']
const ex = (id: string, skills: string[], over: Partial<Exercise> = {}) => exercise({ id, title: id, skills, prerequisites: [], minutes: 3, ...over })
const EX: Record<string, Exercise> = Object.fromEntries(
  [
    ex('loop-a', ['for_loop']),
    ex('enum-a', ['enumerate']),
    ex('enum-b', ['enumerate']),
    ex('enum-dbg', ['enumerate'], { style: 'debug', stage: 'debug' }),
    ex('dict-a', ['dict_assign']),
    ex('get-a', ['dict_get']),
    ex('imap-trace', ['index_map'], { kind: 'output', stage: 'trace' }),
    ex('imap-a', ['index_map'], { prerequisites: ['enumerate', 'dict_assign'] }),
    ex('imap-b', ['index_map'], { prerequisites: ['enumerate', 'dict_assign'] }),
    ex('comp-a', ['complement']),
    ex('pair-mini', ['index_map', 'complement'], { stage: 'combine', repType: 'combine', prerequisites: ['enumerate'] }),
    ex('cap-pair', ['index_map', 'complement'], { stage: 'capstone', repType: 'capstone' }),
    ex('sort-a', ['sorting']),
    ex('ptr-a', ['two_pointer']),
  ].map((e) => [e.id, e]),
)
const TARGET: Target = {
  lc: 1,
  title: 'Two Sum',
  unit: 'Hashing',
  source: 'reps',
  exerciseId: 'cap-pair',
  section: 'br-1',
  mode: 'bridge-first',
  prerequisiteSkills: ['index_map', 'complement'],
  blocks: [
    { label: 'map each value to its index', skills: ['index_map'], evidence: ['imap-a'] },
    { label: 'work out what is still needed', skills: ['complement'], evidence: ['comp-a'] },
    { label: 'look the partner up as you go', skills: ['index_map', 'complement'], reps: ['pair-mini'] },
  ],
}
/** Clean passes of a rep on a date; `cold` marks the last one as a cold rep. */
const did = (id: string, date: string, n = 1, over: Partial<Attempt> = {}): Attempt[] =>
  Array.from({ length: n }, (_, i) => attempt({ id: `${id}-${date}-${i}`, exerciseId: id, date, skills: EX[id].skills, stage: EX[id].stage, completedAt: `${date}T1${i}:00:00.000Z`, ...over }))
const ctxOf = (attempts: Attempt[], today = TODAY): TrainingContext => {
  const mastery = computeAllMastery(SKILLS, attempts)
  return { passed: new Set(attempts.filter((a) => a.passed).map((a) => a.exerciseId)), mastery, practice: practiceBySkill(attempts), today, strong: (s) => isStrong(mastery[s]) }
}
const plan = (attempts: Attempt[], over: Partial<PlannerInput> = {}) => {
  const mastery = computeAllMastery(SKILLS, attempts)
  return planTrainingSession({
    stretch: [],
    problems: [],
    exercises: EX,
    attempts,
    mastery,
    today: TODAY,
    planDay: 12,
    target: TARGET,
    targetSolved: false,
    dueSkills: [],
    dueResolves: 0,
    strong: (s) => isStrong(mastery[s]),
    depth: (s) => SKILLS.indexOf(s),
    skillName: (s) => s,
    ...over,
  })
}
const rep = (id: string, sectionId = 'sec', gate = false) => ({ id, sectionId, sectionTitle: sectionId, gate })
const kinds = (p: ReturnType<typeof plan>) => p.blocks.map((b) => b.kind)

// ── training state ───────────────────────────────────────────────────────────

test('an unseen skill is LEARN; recognising it without producing it is still LEARN', () => {
  const none = ctxOf([])
  assert.equal(skillTrainingState(none.mastery.index_map, none.practice.get('index_map')), 'learn')
  const traced = ctxOf(did('imap-trace', '2026-11-19', 3))
  assert.equal(skillTrainingState(traced.mastery.index_map, traced.practice.get('index_map')), 'learn', 'a trace is not production')
  assert.equal(repPurpose(EX['imap-trace'], {}, none), 'learn')
})

test('an introduced skill with weak productive evidence is DRILL; owned with a clean cold rep is MAINTAIN', () => {
  const weak = ctxOf(did('imap-a', '2026-11-19'))
  assert.equal(skillTrainingState(weak.mastery.index_map, weak.practice.get('index_map')), 'drill')
  assert.equal(repPurpose(EX['imap-b'], {}, weak), 'drill')
  const owned = ctxOf([...did('imap-a', '2026-11-10', 6), ...did('imap-b', '2026-11-19', 2, { retrievalType: 'cold' })])
  assert.equal(skillTrainingState(owned.mastery.index_map, owned.practice.get('index_map')), 'maintain')
})

test('several strong primitives but an unfinished bridge is COMBINE', () => {
  const c = ctxOf([...did('imap-a', '2026-11-19', 2), ...did('comp-a', '2026-11-19', 2)])
  const t = targetTraining(TARGET, false, c)
  assert.deepEqual([t.state, t.learned, t.total, t.nextRep], ['combine', 2, 3, 'pair-mini'])
  assert.equal(repPurpose(EX['pair-mini'], { sectionId: 'br-1' }, c), 'combine')
  // Before the ladder blocks are in: the next block has been produced somewhere but its rep is still owed → drill.
  const produced = [...did('imap-a', '2026-11-19'), attempt({ exerciseId: 'elsewhere', skills: ['complement'], date: '2026-11-19' })]
  assert.equal(targetTraining(TARGET, false, ctxOf(produced)).state, 'drill')
  // ...and never produced at all → learn.
  assert.equal(targetTraining(TARGET, false, ctxOf(did('imap-a', '2026-11-19'))).state, 'learn')
  assert.equal(targetTraining(TARGET, false, ctxOf([])).state, 'learn')
})

test('every block learned and fresh is PROVE; a target already solved is MAINTAIN', () => {
  const all = [...did('imap-a', '2026-11-19'), ...did('comp-a', '2026-11-19'), ...did('pair-mini', '2026-11-19')]
  const t = targetTraining(TARGET, false, ctxOf(all))
  assert.deepEqual([t.state, t.learned, t.readyToday, t.stale.length], ['prove', 3, 3, 0])
  assert.equal(repPurpose(EX['cap-pair'], {}, ctxOf(all)), 'prove')
  assert.equal(repPurpose(EX['imap-a'], { gate: true }, ctxOf(all)), 'prove', 'a mastery check proves')
  assert.equal(targetTraining(TARGET, true, ctxOf(all)).state, 'maintain')
})

// ── freshness ────────────────────────────────────────────────────────────────

test('freshness is separate from mastery: history stays, availability today does not', () => {
  const old = [...did('imap-a', '2026-10-20', 6), ...did('imap-b', '2026-10-21', 1, { retrievalType: 'cold' })]
  const c = ctxOf(old)
  assert.ok(c.mastery.index_map.score >= 65, 'the score has not decayed')
  assert.equal(freshnessOf(c.practice.get('index_map'), TODAY), 'stale')
  assert.equal(freshnessOf(c.practice.get('index_map'), '2026-10-24'), 'fresh')
  assert.equal(freshnessOf(undefined, TODAY), 'unpracticed')
  // Each clean cold rep lengthens the window: 3 days with none, 6 with one.
  const once = practiceBySkill(did('get-a', '2026-11-15'))
  assert.equal(freshnessOf(once.get('dict_get'), '2026-11-18'), 'fresh')
  assert.equal(freshnessOf(once.get('dict_get'), '2026-11-19'), 'stale')
  const cold = practiceBySkill(did('get-a', '2026-11-15', 1, { retrievalType: 'cold' }))
  assert.equal(freshnessOf(cold.get('dict_get'), '2026-11-21'), 'fresh')
})

test('only production refreshes a skill: a trace, a failed run or a passive answer does not', () => {
  const base = did('imap-a', '2026-11-01')
  const passive = [...base, ...did('imap-trace', '2026-11-19', 2), ...did('imap-b', '2026-11-19', 1, { passed: false, completedAt: undefined })]
  assert.equal(practiceBySkill(passive).get('index_map')!.last, '2026-11-01')
  assert.equal(freshnessOf(practiceBySkill(passive).get('index_map'), TODAY), 'stale')
  assert.equal(freshnessOf(practiceBySkill([...base, ...did('imap-b', '2026-11-19')]).get('index_map'), TODAY), 'fresh')
})

test('learned blocks versus ready today: a stale prerequisite is warmed up before PROVE', () => {
  const all = [...did('imap-a', '2026-10-20'), ...did('comp-a', '2026-11-19'), ...did('pair-mini', '2026-11-19', 1, { skills: ['complement'] })]
  const t = targetTraining(TARGET, false, ctxOf(all))
  assert.deepEqual([t.state, t.learned, t.readyToday], ['prove', 3, 1], 'learned 3 of 3, ready today 1 of 3')
  assert.deepEqual(t.staleSkills, ['index_map'])
  const p = plan(all, { stretch: [rep('cap-pair', 'Two Sum')] })
  assert.deepEqual(kinds(p), ['reactivate', 'prove'])
  assert.deepEqual(p.blocks[0].reps, ['imap-a'], 'one small rep already passed before, not the whole ladder')
  assert.match(p.blocks[0].why, /already learned/)
  assert.ok(p.blocks[0].extra)
})

// ── the planner ──────────────────────────────────────────────────────────────

test("today's blocks follow the queue and say what each stretch is for", () => {
  const p = plan([...did('enum-a', '2026-11-19'), ...did('dict-a', '2026-11-19')], {
    stretch: [rep('imap-trace', 'Index maps'), rep('imap-a', 'Index maps'), rep('imap-b', 'Index maps'), rep('comp-a', 'Complements'), rep('pair-mini', 'br-1'), rep('cap-pair', 'Two Sum')],
  })
  assert.deepEqual(kinds(p), ['learn', 'drill', 'combine', 'prove'])
  assert.deepEqual(p.blocks.map((b) => b.reps), [['imap-trace'], ['imap-a', 'imap-b', 'comp-a'], ['pair-mini'], ['cap-pair']])
  assert.equal(p.blocks[1].title, 'Index maps → Complements')
  // The queue order is never rearranged.
  assert.deepEqual(p.blocks.filter((b) => !b.extra).flatMap((b) => b.reps), ['imap-trace', 'imap-a', 'imap-b', 'comp-a', 'pair-mini', 'cap-pair'])
  assert.match(p.goal, /Two Sum/)
})

test('a problem on LeetCode is offered only once its building blocks are in place', () => {
  const notYet = plan(did('imap-a', '2026-11-19'), { stretch: [rep('comp-a', 'Complements'), rep('pair-mini', 'br-1')], problems: [{ lc: 1, title: 'Two Sum', ready: false }] })
  const prove = notYet.blocks[notYet.blocks.length - 1]
  assert.deepEqual([prove.kind, prove.lc, prove.onlyIf], ['prove', 1, 'only after its building blocks are in place'])
  const ready = plan([...did('imap-a', '2026-11-19'), ...did('comp-a', '2026-11-19'), ...did('pair-mini', '2026-11-19')], { problems: [{ lc: 1, title: 'Two Sum', ready: true }] })
  assert.equal(ready.blocks.find((b) => b.lc === 1)!.onlyIf, undefined)
  assert.match(ready.goal, /^Prove Two Sum/)
})

test('an unrelated overdue review never blocks the target; a relevant one comes before it', () => {
  const history = [...did('enum-a', '2026-11-19'), ...did('dict-a', '2026-11-19'), ...did('sort-a', '2026-11-19'), ...did('ptr-a', '2026-11-19')]
  const p = plan(history, { stretch: [rep('imap-a', 'Index maps'), rep('imap-b', 'Index maps')], dueSkills: ['sorting', 'two_pointer', 'enumerate'], dueResolves: 2 })
  assert.deepEqual(kinds(p), ['reactivate', 'drill', 'maintain'])
  assert.deepEqual(p.blocks[0].reps, ['enum-a'], 'enumerate is a prerequisite of index maps: it is retrieved first')
  const maintain = p.blocks[2]
  assert.deepEqual([...maintain.reps].sort(), ['ptr-a', 'sort-a'], 'the unrelated reviews wait at the end')
  assert.equal(maintain.resolves, 2)
  assert.ok(p.blocks.findIndex((b) => b.kind === 'drill') < p.blocks.findIndex((b) => b.kind === 'maintain'))
})

test('clean recent performance is not asked for again: no warm-up for what is already fresh', () => {
  const fresh = [...did('enum-a', '2026-11-19', 3), ...did('dict-a', '2026-11-19', 3)]
  assert.deepEqual(kinds(plan(fresh, { stretch: [rep('imap-a', 'Index maps')] })), ['drill'])
  // The same history two weeks on: now it is stale, and it is warmed up, bottom first.
  const later = plan(fresh, { stretch: [rep('imap-a', 'Index maps')], today: '2026-12-05' })
  assert.deepEqual(kinds(later), ['reactivate', 'drill'])
  assert.deepEqual(later.blocks[0].reps, ['enum-a', 'dict-a'])
  // Never more than the phase allows, and never a rep that has not been passed before.
  assert.ok(later.blocks[0].reps.length <= 6)
})

test('inside a session, extras are skipped once the skill has come back clean three times; canonical reps never are', () => {
  const ids = ['enum-a', 'enum-b', 'enum-dbg', 'imap-a']
  const extras = new Set(['enum-a', 'enum-b', 'enum-dbg'])
  const one = did('enum-a', TODAY)
  assert.equal(nextInSession(ids, 'enum-a', extras, EX, one), 'enum-b')
  const three = [...did('enum-a', TODAY), ...did('enum-b', TODAY, 2)]
  assert.equal(nextInSession(ids, 'enum-b', extras, EX, three), 'imap-a', 'the third enumerate warm-up is skipped')
  assert.equal(nextInSession(ids, 'enum-b', new Set(), EX, three), 'enum-dbg', 'a canonical rep is not')
  // A shaky rep does not count toward the three.
  const shaky = [...did('enum-a', TODAY), ...did('enum-b', TODAY, 2, { hintsUsed: 2 })]
  assert.equal(nextInSession(ids, 'enum-b', extras, EX, shaky), 'enum-dbg')
  assert.equal(nextInSession(ids, 'imap-a', extras, EX, three), null)
})

test('a pending reactivation session stands in for the computed warm-up, and comes first', () => {
  const p = plan(did('enum-a', '2026-10-01'), { stretch: [rep('imap-a', 'Index maps')], pending: { title: 'Python → dictionaries → hashing', reps: ['loop-a', 'dict-a'], why: 'x' } })
  assert.deepEqual(kinds(p), ['reactivate', 'drill'])
  assert.deepEqual(p.blocks[0].reps, ['loop-a', 'dict-a'])
  assert.equal(p.goal, 'Restore fluency before continuing the plan.')
})

// ── repair ───────────────────────────────────────────────────────────────────

test('a failure is classified by the smallest thing that broke', () => {
  const f = (errors: string[], visibleFailed = 1, hiddenFailed = 0) => ({ errors, visibleFailed, hiddenFailed })
  assert.equal(classifyFailure(EX['imap-a'], f(['SyntaxError: invalid syntax'])), 'syntax')
  assert.equal(classifyFailure(EX['imap-a'], f(["AttributeError: 'dict' object has no attribute 'add'"])), 'python_api')
  assert.equal(classifyFailure(EX['imap-a'], f(["KeyError: 3"])), 'data_structure_operation')
  assert.equal(classifyFailure(EX['imap-a'], f(['IndexError: list index out of range'])), 'boundary')
  assert.equal(classifyFailure(EX['imap-a'], f([], 0, 2)), 'edge_case')
  assert.equal(classifyFailure(EX['pair-mini'], f([])), 'pattern')
  assert.equal(classifyFailure(EX['imap-a'], f([])), 'implementation')
  assert.equal(classifyFailure(EX['imap-a'], { ...f([]), diagnosed: 'off_by_one' }), 'boundary', 'a coach diagnosis is used when there is one')
})

test('a failure in one block inserts that block: repair steps back only as far as it must', () => {
  const order = (id: string) => Object.keys(EX).indexOf(id)
  const input = { exercises: EX, mastery: computeAllMastery(SKILLS, []), depth: (s: string) => SKILLS.indexOf(s), skillName: (s: string) => s, target: TARGET, order }
  assert.equal(REPAIR_AFTER, 2)
  // The combination broke: back to the block that teaches it, not to the start of the ladder.
  const pattern = planRepair(EX['cap-pair'], { errors: [], visibleFailed: 1, hiddenFailed: 0 }, input)
  assert.deepEqual([pattern.category, pattern.reps, pattern.focus], ['pattern', ['pair-mini'], 'look the partner up as you go'])
  // Syntax: tiny reps on the most primitive skill involved.
  const syntax = planRepair(EX['imap-b'], { errors: ['IndentationError: unexpected indent'], visibleFailed: 1, hiddenFailed: 0 }, input)
  assert.deepEqual([syntax.category, syntax.focus], ['syntax', 'enumerate'])
  assert.deepEqual(syntax.reps, ['enum-a', 'enum-b', 'enum-dbg'], 'two writes and a debug, all earlier in the plan')
  // The wrong operation: drill that skill.
  assert.deepEqual(planRepair(EX['imap-b'], { errors: ['KeyError: 4'], visibleFailed: 1, hiddenFailed: 0 }, input).reps, ['imap-a'])
  // Plain wrong code at the right level: stay and repair it.
  assert.deepEqual(planRepair(EX['imap-b'], { errors: [], visibleFailed: 1, hiddenFailed: 0 }, input).reps, [])
  // Never the rep itself, a capstone, or something later in the plan.
  for (const r of [pattern, syntax]) for (const id of r.reps) assert.ok(id !== 'cap-pair' && order(id) < order('cap-pair'))
})

// ── narrative ────────────────────────────────────────────────────────────────

test('the briefing knows where you left off; the review says what changed today', () => {
  const history = [...did('enum-a', '2026-11-10', 6), ...did('enum-b', '2026-11-12', 2, { retrievalType: 'cold' }), ...did('dict-a', '2026-11-12', 3), ...did('imap-a', '2026-11-14', 1)]
  const title = (id: string) => (id.startsWith('imap') ? 'Index maps' : 'Python recall')
  assert.deepEqual(lastSession(history, TODAY, title), { date: '2026-11-14', on: ['Index maps'] })
  assert.equal(lastSession([], TODAY, title), null)

  const today = [...did('enum-b', TODAY), ...did('imap-b', TODAY, 2), ...did('comp-a', TODAY, 1, { hintsUsed: 2, attemptsBeforePass: 2 })]
  const all = [...history, ...today]
  const r = sessionReview(all, TODAY, computeAllMastery(SKILLS, history), computeAllMastery(SKILLS, all))
  assert.deepEqual(r.clean, ['enumerate'], 'had it before, came back clean')
  assert.deepEqual(r.improved, ['index_map'])
  assert.deepEqual(r.developing, ['complement'])
  assert.equal(r.reps, 4)
  assert.equal(sessionReview(history, TODAY, {}, {}).reps, 0, 'nothing today, nothing claimed')
})

test('repeating an old rep adds evidence and freshness; what was complete stays complete', () => {
  const before = did('imap-a', '2026-10-20', 4)
  const again = [...before, ...did('imap-a', TODAY, 1, { retrievalType: 'cold' })]
  const passedBefore = new Set(before.filter((a) => a.passed).map((a) => a.exerciseId))
  const passedAfter = new Set(again.filter((a) => a.passed).map((a) => a.exerciseId))
  assert.deepEqual([...passedAfter], [...passedBefore], 'the canonical record is unchanged')
  assert.equal(again.length, before.length + 1, 'the repeat is a new attempt, not an edit')
  assert.equal(freshnessOf(practiceBySkill(before).get('index_map'), TODAY), 'stale')
  assert.equal(freshnessOf(practiceBySkill(again).get('index_map'), TODAY), 'fresh')
  // A failed repeat does not undo the earlier pass either.
  const failed = [...before, ...did('imap-a', TODAY, 1, { passed: false, completedAt: undefined, attemptsBeforePass: 2 })]
  assert.ok(new Set(failed.filter((a) => a.passed).map((a) => a.exerciseId)).has('imap-a'))
})
