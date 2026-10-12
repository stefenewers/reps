import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BRIDGE_SECTION_IDS, DAY_BY_DATE, EXERCISE_BY_ID, MODULES, PLAN_DAYS, dayLabel } from '@/data/curriculum'
import { PACK_BRIDGES, PACK_PRIMERS, PACK_SECTIONS } from '@/data/exercises/bridges'
import { PLAN_TARGETS, TARGETS, TARGET_BY_LC, targetOfRep } from '@/data/problem-bridges'
import { PRIMER_BY_SKILL } from '@/data/primers'
import { CHECKPOINTS } from '@/data/program-90day'
import { PACE, PLAN_90, PLAN_CAPSTONES, PLAN_UNITS, PLAN_WHEN_AHEAD } from '@/data/schedule-90'
import { SKILL_BY_ID, SKILLS } from '@/data/skills'
import { bridgeCycles, readiness } from '@/lib/bridges'
import { bucketOf, isFromScratch } from '@/lib/curriculum-audit'
import { buildQueue } from '@/lib/pacing'
import { PROBLEMS } from '@/data/problems'

/**
 * The teaching model of the 90-day plan: a LeetCode problem is the final
 * integration test of a prerequisite graph. Every pattern has a ladder and a
 * cold mastery check; every first-contact target has its building blocks, and
 * what teaches them comes before it.
 */

const SECTION = new Map(MODULES.flatMap((m) => m.sections.map((s) => [s.id, s] as const)))
const CAPS: Record<string, number> = Object.fromEntries(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p.number]))
const queue = buildQueue(PLAN_DAYS, PACE, CAPS)
const position = new Map(queue.map((q, i) => [q.key, i]))
const done = new Set<string>(JSON.parse(readFileSync('planning/done.json', 'utf8')))
const newProblems = PLAN_90.flatMap((d) => d.leetcode.filter((x) => x.type === 'new'))
const csv = (file: string) => {
  const [head, ...rows] = readFileSync(file, 'utf8').trim().split('\n')
  const cols = head.split(',')
  return rows.map((r) => Object.fromEntries(r.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.slice(0, cols.length).map((c, i) => [cols[i], c.replace(/,$/, '').replace(/^"|"$/g, '')])))
}

test('the plan dates: Oct 12 is Day 1, Nov 10 Day 30, Dec 10 Day 60, Jan 9 Day 90', () => {
  for (const [date, n] of [['2026-10-12', 1], ['2026-11-10', 30], ['2026-12-10', 60], ['2027-01-09', 90]] as const) {
    assert.equal(DAY_BY_DATE[date].planDay, n, date)
    assert.equal(dayLabel(DAY_BY_DATE[date]), `Day ${n} of 90`)
  }
  assert.equal(DAY_BY_DATE['2026-10-11'].planDay, undefined, 'Oct 11 is before the plan')
  assert.deepEqual(CHECKPOINTS.map((c) => [c.label, c.date]), [['Day 30', '2026-11-10'], ['Day 60', '2026-12-10'], ['Day 90', '2027-01-09']])
})

test('a seed re-solve due before the plan starts rolls into the first study day instead of vanishing', () => {
  const firstDay = PLAN_90[0].leetcode
  assert.ok(firstDay.some((x) => x.lc === 217 && x.type === 'review1'), 'LC 217 (seeded for Oct 11) lands on Oct 12')
  // Every seed is placed exactly once, in its original order, and never beyond the day's cap.
  const seeds = [217, 387, 169, 383, 219]
  const placed = PLAN_90.flatMap((d) => d.leetcode.filter((x) => seeds.includes(x.lc) && x.type === 'review1').map((x) => ({ lc: x.lc, date: d.date })))
  assert.deepEqual(placed.map((p) => p.lc), seeds)
  assert.deepEqual(placed.map((p) => p.date), [...placed.map((p) => p.date)].sort())
  assert.equal(firstDay.filter((x) => x.type !== 'new').length, 2, 'Oct 12 carries the rolled seed and its own, inside the soft-start cap of 2')
})

test('every 90-day unit has a ladder and a cold mastery check made of production', () => {
  assert.equal(PLAN_UNITS.length, 15)
  const scheduled = new Set(PLAN_90.flatMap((d) => d.sections.flatMap((s) => s.reps)))
  for (const u of PLAN_UNITS) {
    assert.ok(u.sections.length > 0, `${u.name} has a ladder`)
    const ladder = u.sections.flatMap((id) => SECTION.get(id)!.exercises)
    assert.ok(ladder.filter((e) => e.kind === 'code').length >= 8, `${u.name}: the ladder is real work, not a video`)
    const check = SECTION.get(u.check)
    assert.ok(check, `${u.name} has a mastery check`)
    const reps = check.exercises.filter((e) => scheduled.has(e.id))
    assert.ok(reps.length >= 3, `${u.name}: ${reps.length} check reps scheduled`)
    for (const e of reps) assert.equal(e.kind, 'code', `${e.id}: a check is written, never multiple choice or a trace`)
    assert.ok(reps.filter(isFromScratch).length / reps.length >= 0.75, `${u.name}: the check is from memory`)
    assert.ok(PLAN_90.some((d) => d.sections.some((s) => s.id === u.check && s.gate)), `${u.name}: the check gates what follows`)
  }
  // The six that were missing, and the two patterns that had no ladder at all.
  for (const id of ['d4w-check', 'd05s-check', 'd9h-check', 'd10b-check', 'tr-check', 'mx-check']) assert.ok(PACK_SECTIONS.find((s) => s.id === id)?.gate, id)
  for (const name of ['Tries', 'Matrix']) assert.ok(PLAN_UNITS.find((u) => u.name === name)!.sections.every((id) => BRIDGE_SECTION_IDS.has(id)), `${name} has an authored ladder`)
})

test('every first-contact target has a prerequisite graph', () => {
  for (const x of newProblems) {
    const t = TARGET_BY_LC.get(x.lc)
    assert.ok(t, `LC ${x.lc} ${x.title} has no bridge`)
    assert.equal(t.source, 'leetcode')
    assert.ok(t.section && SECTION.get(t.section)?.exercises.length, `LC ${x.lc}: bridge section`)
    assert.ok(t.blocks.length >= 3, `LC ${x.lc}: ${t.blocks.length} building blocks`)
    assert.ok(t.blocks.some((b) => b.reps?.length), `LC ${x.lc}: at least one block is taught by its bridge`)
    assert.ok(t.prerequisiteSkills.length > 0)
    assert.equal(x.mode, t.mode)
  }
  for (const [lc, id] of Object.entries(PLAN_CAPSTONES)) {
    const t = TARGET_BY_LC.get(Number(lc))
    assert.ok(t && t.source === 'reps' && t.exerciseId === id, `capstone ${id}`)
    assert.ok(t.blocks.length >= 1 && t.blocks.every((b) => b.evidence?.length), `${id}: its ladder sections are its building blocks`)
  }
  assert.equal(PLAN_TARGETS.length, newProblems.length + Object.keys(PLAN_CAPSTONES).length)
  // Problems waiting for "when ahead" keep their graphs too.
  assert.equal(TARGETS.length - PLAN_TARGETS.length, PLAN_WHEN_AHEAD.length)
  assert.equal(PACK_BRIDGES.length, newProblems.length + PLAN_WHEN_AHEAD.length, 'every authored bridge is either scheduled or waiting')
})

test('every referenced rep exists, and every bridge rep belongs to exactly one block', () => {
  for (const t of TARGETS) {
    for (const b of t.blocks) {
      assert.ok(b.label && b.skills.length, `LC ${t.lc}: a block names a move and its skills`)
      for (const s of b.skills) assert.ok(SKILL_BY_ID[s], `LC ${t.lc}: skill ${s}`)
      for (const id of [...(b.reps ?? []), ...(b.evidence ?? [])]) assert.ok(EXERCISE_BY_ID[id], `LC ${t.lc}: unknown rep ${id}`)
      // Evidence from the ladder is something written in code; a bridge may open with one trace.
      for (const id of b.evidence ?? []) assert.equal(EXERCISE_BY_ID[id].kind, 'code', `LC ${t.lc}: ${id} is evidence written in code`)
    }
    if (!t.section) continue
    const inBlocks = t.blocks.flatMap((b) => b.reps ?? [])
    assert.deepEqual([...inBlocks].sort(), SECTION.get(t.section)!.exercises.map((e) => e.id).sort(), `LC ${t.lc}: the bridge section and its blocks agree`)
    for (const id of inBlocks) assert.equal(targetOfRep(id)?.lc, t.lc)
  }
})

test('no bridge depends on itself or on a later one', () => {
  assert.deepEqual(bridgeCycles(TARGETS), [])
})

test('what teaches a target comes before it: the bridge sits directly ahead of its problem', () => {
  for (const t of PLAN_TARGETS) {
    const at = position.get(t.source === 'reps' ? t.exerciseId! : `lc:${t.lc}`)
    assert.ok(at !== undefined, `LC ${t.lc} is in the queue`)
    for (const b of t.blocks)
      for (const id of [...(b.reps ?? []), ...(b.evidence ?? [])]) {
        if (id === t.exerciseId) continue
        const p = position.get(id)
        assert.ok(p !== undefined || done.has(id), `LC ${t.lc}: ${id} is neither scheduled nor already passed`)
        if (p !== undefined) assert.ok(p < at, `LC ${t.lc}: ${id} comes after the problem it prepares`)
      }
    if (t.source !== 'leetcode') continue
    // Nothing from a later problem's bridge is wedged between this bridge and its target on the baseline day order.
    const bridge = t.blocks.flatMap((b) => b.reps ?? []).map((id) => position.get(id)!)
    const first = Math.min(...bridge)
    const foreign = queue.slice(first, at).filter((q) => q.kind === 'rep' && q.sectionId?.startsWith('br-') && q.sectionId !== t.section && position.get(`lc:${q.sectionId.slice(3)}`)! < at === false)
    // A later bridge may start only once the day's two new problems are used up.
    for (const q of foreign) assert.ok(q.baseline >= queue[Math.max(...bridge)].baseline, `LC ${t.lc}: ${q.key} interrupts its bridge`)
  }
})

test('with nothing done, no target reports ready; the bridge reps alone are never enough without the ladder', () => {
  for (const t of PLAN_TARGETS) assert.equal(readiness(t, new Set()).ready, false, `LC ${t.lc}`)
  const t = TARGET_BY_LC.get(128)!
  const bridgeOnly = new Set(t.blocks.flatMap((b) => b.reps ?? []))
  assert.equal(readiness(t, bridgeOnly).ready, false)
  const everything = new Set(t.blocks.flatMap((b) => [...(b.reps ?? []), ...(b.evidence ?? [])]))
  assert.equal(readiness(t, everything).ready, true)
  // Strong mastery of a ladder block's skills stands in for its evidence reps.
  const ladderSkills = new Set(t.blocks.filter((b) => !b.reps?.length).flatMap((b) => b.skills))
  assert.equal(readiness(t, bridgeOnly, (s) => ladderSkills.has(s)).ready, true)
})

test('video metadata survives generation: every scheduled new problem keeps its verified walkthrough', () => {
  const source = new Map(csv('archive/first-plan/problems.csv').map((r) => [Number(r.lc), r.neetcode_video]))
  assert.ok(newProblems.length >= 28)
  for (const x of newProblems) {
    assert.ok(x.video, `LC ${x.lc} has no walkthrough`)
    assert.equal(x.video, source.get(x.lc), `LC ${x.lc}: the link changed`)
    assert.match(x.video!, /^https:\/\/www\.youtube\.com\/watch\?v=/)
  }
  for (const x of PLAN_WHEN_AHEAD) assert.equal(x.video, source.get(x.lc), `LC ${x.lc} (when ahead)`)
  const planned = csv('planning/problems.csv').filter((r) => r.type === 'new')
  assert.equal(planned.filter((r) => r.neetcode_video).length, planned.length)
})

test('the skill graph caught up: each new skill is defined, primed and produced from scratch', () => {
  const all = MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises))
  const added = [...new Set(PACK_PRIMERS.flatMap((p) => p.skills))]
  assert.ok(added.length >= 30, `${added.length} new skills`)
  for (const id of added) {
    const k = SKILL_BY_ID[id]
    assert.ok(k && k.definition.length > 30, `${id}: definition`)
    for (const p of k.prerequisites) assert.ok(SKILL_BY_ID[p], `${id}: prerequisite ${p}`)
    assert.ok(PRIMER_BY_SKILL[id], `${id}: primer`)
    assert.ok(all.some((e) => e.skills.includes(id) && isFromScratch(e)), `${id}: a from-scratch rep`)
    assert.ok(TARGETS.some((t) => t.prerequisiteSkills.includes(id) || t.blocks.some((b) => b.skills.includes(id))) || PLAN_UNITS.some((u) => u.sections.some((sid) => SECTION.get(sid)!.exercises.some((e) => e.skills.includes(id)))), `${id}: needed by a scheduled problem or ladder`)
  }
  // No skill was added that nothing uses.
  for (const k of SKILLS) assert.ok(all.some((e) => e.skills.includes(k.id) || e.prerequisites.includes(k.id)), `${k.id} is used`)
})

test('bridges are code-first and end on a miniature analogue written from a signature', () => {
  for (const b of PACK_BRIDGES) {
    const reps = SECTION.get(b.section)!.exercises
    assert.ok(reps.length >= 1 && reps.length <= 8, `LC ${b.lc}: ${reps.length} bridge reps`)
    assert.ok(reps.filter((e) => e.kind !== 'code').length <= 1, `LC ${b.lc}: at most one passive rep`)
    assert.ok(isFromScratch(reps[reps.length - 1]), `LC ${b.lc}: ends on a from-signature rep`)
    assert.ok(reps.every((e) => !e.problemId && bucketOf(e) !== 'capstone'), `LC ${b.lc}: the bridge is not the target`)
  }
})

test('LeetCode Premium problems link to their free version, so no problem link is a locked page', () => {
  const PREMIUM = [252, 253, 261, 271, 323]
  const all = [...PLAN_90.flatMap((d) => d.leetcode), ...PLAN_WHEN_AHEAD]
  for (const x of all) {
    if (PREMIUM.includes(x.lc)) assert.match(x.url, /^https:\/\/neetcode\.io\/problems\/[a-z-]+\/question$/, `LC ${x.lc}`)
    else assert.match(x.url, /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/, `LC ${x.lc}`)
  }
  for (const lc of PREMIUM) assert.ok(all.some((x) => x.lc === lc), `LC ${lc} is in the plan or waiting`)
})
