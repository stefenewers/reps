import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BRIEFS } from '@/data/briefs'
import { BRIDGE_SECTION_IDS, MODULES } from '@/data/curriculum'
import { PACK_BRIDGES, PACK_SECTIONS } from '@/data/exercises/bridges'
import { patternLeaks } from '@/data/pattern-words'
import { PRIMER_BY_SKILL } from '@/data/primers'
import { PLAN_90, PLAN_CAPSTONES, PLAN_UNITS } from '@/data/schedule-90'
import { SKILL_BY_ID } from '@/data/skills'
import { VOCABULARY } from '@/data/vocabulary'
import { isFromScratch } from '@/lib/curriculum-audit'
import { attempt } from '@/lib/test-helpers'
import { SCAFFOLDING, firstExposure, practiceBySkill } from '@/lib/training-state'
import type { Exercise } from '@/lib/types'

/**
 * The teaching standard (docs/authoring.md), as tests. They protect the shape of
 * the instruction, not its length: a first exposure must be taught before it is
 * judged, a question must stand on its own, a term must be defined where it is
 * introduced, retrieval may be terse, and transfer must not name its pattern.
 */

const ALL = MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises.map((e) => ({ e, s, m }))))
const BY_ID = new Map(ALL.map((x) => [x.e.id, x.e]))
const SECTION = new Map(MODULES.flatMap((m) => m.sections.map((s) => [s.id, s] as const)))
const SCHEDULED = new Set(PLAN_90.flatMap((d) => d.sections.flatMap((s) => s.reps)))
const GATE = new Set(PLAN_90.flatMap((d) => d.sections.filter((s) => s.gate).flatMap((s) => s.reps)))
const ORDER = PLAN_90.flatMap((d) => d.order.filter((k) => !k.startsWith('lc:')))
const isRetrieval = (e: Exercise, sectionId: string) => e.repType === 'cold' || e.stage === 'retrieval' || /(^|-)(warmup|cold|check)$/.test(sectionId) || /^o11-/.test(sectionId) || GATE.has(e.id)
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

/** The first rep, in curriculum order, to carry each skill: a first exposure. */
const FIRST = (() => {
  const out = new Map<string, { e: Exercise; sectionId: string }>()
  for (const { e, s } of ALL) for (const k of e.skills) if (!out.has(k)) out.set(k, { e, sectionId: s.id })
  return out
})()

// ── first exposure ───────────────────────────────────────────────────────────

test('a new skill is taught before it is judged: its first rep has the concept and the contract on hand', () => {
  for (const [skill, { e, sectionId }] of FIRST) {
    if (!SKILL_BY_ID[skill]) continue
    assert.ok(PRIMER_BY_SKILL[skill], `${skill}: no primer to show before ${e.id}`)
    if (BRIDGE_SECTION_IDS.has(sectionId) || /(^|-)(warmup|cold)$/.test(sectionId)) continue
    // A trace or a choice shows its code; a rep you write needs the idea (note) or the plain-English contract (brief).
    if (e.kind === 'code') assert.ok(e.note || BRIEFS[e.id], `${e.id} is the first rep to carry ${skill} and has neither a note nor a brief`)
  }
})

test('the workspace teaches on first exposure only, and never on a rep that proves or retrieves', () => {
  const learn = BY_ID.get('d06-dfs-count')!
  assert.ok(firstExposure(learn, new Map()).length > 0, 'nothing produced yet: its skills are first exposures')
  // Once the skill has been produced (a passed, written rep), the teaching is no longer shown automatically.
  const produced = practiceBySkill(learn.skills.map((k, i) => attempt({ id: `p${i}`, skills: [k], stage: 'microbuild' })))
  assert.deepEqual(firstExposure(learn, produced), [])
  // Recognising or tracing it is not producing it.
  const traced = practiceBySkill(learn.skills.map((k, i) => attempt({ id: `t${i}`, skills: [k], stage: 'trace' })))
  assert.ok(firstExposure(learn, traced).length > 0)
  // Capstones, cold reps, mastery checks and transfer reps open with no lecture, whatever the history.
  for (const id of ['cap-max-depth', 'd06-cold-tree-sum']) assert.deepEqual(firstExposure({ ...BY_ID.get(id)!, cleanPass: true }, new Map()), [], id)
  assert.deepEqual(firstExposure(BY_ID.get('cap-max-depth')!, new Map()), [])
  const transfer = ALL.find((x) => x.e.transfer)!.e
  assert.deepEqual(firstExposure(transfer, new Map()), [])
  assert.deepEqual([SCAFFOLDING.learn.teach, SCAFFOLDING.drill.teach, SCAFFOLDING.combine.teach, SCAFFOLDING.prove.teach, SCAFFOLDING.maintain.teach], [true, false, false, false, false])
  assert.deepEqual([SCAFFOLDING.prove.namesTechnique, SCAFFOLDING.maintain.namesTechnique], [false, false])
})

test('the plan never trims a first exposure out of a ladder: what a section teaches first is scheduled with it', () => {
  // (Reps passed before the plan began are not rescheduled; those are skipped here.)
  const laddered = new Set(PLAN_UNITS.flatMap((u) => u.sections))
  const passedBefore = new Set<string>(JSON.parse(readFileSync('planning/done.json', 'utf8')))
  for (const [skill, { e, sectionId }] of FIRST) {
    if (!laddered.has(sectionId) || passedBefore.has(e.id)) continue
    const section = SECTION.get(sectionId)!
    const anyScheduled = section.exercises.some((x) => SCHEDULED.has(x.id))
    const laterScheduled = section.exercises.slice(section.exercises.indexOf(e) + 1).some((x) => SCHEDULED.has(x.id))
    if (anyScheduled && laterScheduled && section.exercises.slice(0, section.exercises.indexOf(e)).every((x) => SCHEDULED.has(x.id))) assert.ok(SCHEDULED.has(e.id), `${e.id} (first rep for ${skill}) was trimmed from ${sectionId} while later reps in it were kept`)
  }
})

// ── standalone contracts ─────────────────────────────────────────────────────

test('a question stands on its own: nothing leans on yesterday, the previous rep or code that is not on the page', () => {
  for (const { e } of ALL) {
    const lean = /\b(yesterday|this morning|earlier today|the previous rep|the last rep|the rep before|you just finished|as before|from before|same as (the )?(last|previous))\b/i.exec(e.prompt)
    assert.ok(!lean, `${e.id}: the prompt leans on "${lean?.[0]}"`)
    const your = /\byour `([a-z_]+)`/i.exec(e.prompt)
    if (your) assert.ok(new RegExp(`\\b${your[1]}\\b`).test(`${e.starterCode ?? ''}\n${e.code ?? ''}\n${e.prompt.replace(your[0], '')}`), `${e.id}: "${your[0]}" is not on the page`)
  }
})

test('every scheduled teaching rep has a plain-English brief; retrieval, checks and capstones do not need one', () => {
  const missing = ALL.filter(({ e, s }) => e.kind === 'code' && SCHEDULED.has(e.id) && e.repType !== 'capstone' && !isRetrieval(e, s.id) && !BRIEFS[e.id]).map((x) => x.e.id)
  assert.deepEqual(missing, [])
  // Briefs name real inputs and never contain the answer (checked rep by rep in briefs.test.ts); here: none on a capstone.
  for (const id of Object.values(PLAN_CAPSTONES)) assert.ok(!BRIEFS[id], `${id}: a capstone statement is not decoded for you`)
})

// ── vocabulary ───────────────────────────────────────────────────────────────

test('each term Reps introduces is defined by the primer of the skill that introduces it', () => {
  assert.ok(VOCABULARY.length >= 30)
  for (const v of VOCABULARY) {
    const p = PRIMER_BY_SKILL[v.skill]
    assert.ok(p, `${v.term}: ${v.skill} has no primer`)
    const text = [p.title, p.what, p.model, ...p.syntax.map((x) => x.note), ...p.gotchas].join('\n')
    assert.match(text, v.says, `"${v.term}" is not defined in the ${p.id} primer`)
  }
})

// ── scaffolding by purpose ───────────────────────────────────────────────────

test('scaffolding shrinks with the purpose: first exposures say more than drills, and retrieval is allowed to be terse', () => {
  const firstIds = new Set([...FIRST.values()].map((x) => x.e.id))
  const words = (e: Exercise) => `${e.prompt} ${e.note ?? ''}`.split(/\s+/).length
  const learn = ALL.filter((x) => firstIds.has(x.e.id) && x.e.kind === 'code' && !BRIDGE_SECTION_IDS.has(x.s.id) && !isRetrieval(x.e, x.s.id)).map((x) => words(x.e))
  const retrieval = ALL.filter((x) => x.e.kind === 'code' && isRetrieval(x.e, x.s.id) && x.e.repType !== 'capstone').map((x) => words(x.e))
  assert.ok(learn.length >= 15 && retrieval.length > 100)
  assert.ok(median(learn) > median(retrieval) * 1.5, `first exposures (median ${median(learn)} words) carry clearly more than retrieval (median ${median(retrieval)})`)
  // There is no minimum length: plenty of retrieval prompts are a sentence, and that is correct.
  assert.ok(retrieval.filter((n) => n <= 25).length >= 20, 'terse retrieval reps exist and are allowed')
  // Retrieval reps carry no concept note: they are recall, not a lesson.
  const lectured = ALL.filter((x) => (x.e.repType === 'cold' || GATE.has(x.e.id)) && (x.e.note ?? '').length > 0 && !BRIDGE_SECTION_IDS.has(x.s.id)).map((x) => x.e.id)
  assert.ok(lectured.length <= 6, `cold and mastery-check reps with a concept note: ${lectured.join(', ')}`)
})

// ── unlabeled transfer ───────────────────────────────────────────────────────

test('a transfer rep is written from a signature and does not name its technique', () => {
  const transfers = ALL.filter((x) => x.e.transfer)
  assert.ok(transfers.length >= 60, `${transfers.length} transfer reps`)
  for (const { e } of transfers) {
    assert.equal(e.kind, 'code', e.id)
    assert.ok(isFromScratch(e), `${e.id}: a transfer rep starts from a bare signature`)
    assert.ok(e.repType !== 'capstone', `${e.id}: the transfer rep comes before the capstone, it is not the capstone`)
    assert.deepEqual(patternLeaks(`${e.title}\n${e.prompt}`, e.skills), [], `${e.id}: the title or prompt names the technique`)
  }
  // The check has teeth: the same words in a teaching prompt are found.
  assert.deepEqual(patternLeaks('Use two pointers from both ends.', ['two_pointer']), ['two pointers', 'pointers', 'from both ends'])
  assert.deepEqual(patternLeaks('Keep a size-k min-heap.', ['top_k']), ['heap'])
  assert.deepEqual(patternLeaks('`nums` is sorted. Return the indexes of the pair.', ['two_pointer']), [], 'vocabulary the problem needs is not a leak')
})

test('before each target there is an unlabeled step: every problem bridge ends on one, and so does the run-up to each capstone', () => {
  for (const b of PACK_BRIDGES) {
    const reps = PACK_SECTIONS.find((s) => s.id === b.section)!.exercises
    assert.ok(reps[reps.length - 1].transfer, `LC ${b.lc}: the bridge's last rep is the unlabeled transfer`)
  }
  // Capstones: a scheduled transfer rep since the previous capstone, in the order the plan does the work.
  // Two capstones share the transfer rep of the capstone just before them (no bare-signature rep sits between).
  const SHARED = new Set(['cap-top-k-frequent'])
  const caps = new Set(Object.values(PLAN_CAPSTONES))
  let since = 0
  const lacking: string[] = []
  for (const id of ORDER) {
    const e = BY_ID.get(id)
    if (e?.transfer) since++
    if (caps.has(id)) {
      if (!since && !SHARED.has(id)) lacking.push(id)
      since = 0
    }
  }
  assert.deepEqual(lacking, [])
})

test('mastery checks stay cold: the ones added with the packs do not name their technique', () => {
  for (const s of PACK_SECTIONS.filter((x) => x.gate)) for (const e of s.exercises) assert.deepEqual(patternLeaks(`${e.title}\n${e.prompt}`, e.skills), [], `${e.id} (${s.id})`)
})
