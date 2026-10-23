/**
 * Reps 2.0 migration audit (REPS_2_MASTER_SPEC.md §41, §52, §57).
 * Classifies every authored rep by week, unit, purpose and action, and reports
 * what the course added. No rep is silently discarded: unmapped reps fail the run.
 *
 *   npm run audit:migration      # writes planning/reps-v2-migration.{json,md} and planning/reps-v2-content-gaps.md
 */
import { writeFileSync } from 'node:fs'
import { MODULES, DAY_OF_EXERCISE } from '@/data/curriculum'
import { COURSE_SECTIONS } from '@/data/exercises/course'
import { GATES, GATE_OF_EXERCISE, GATE_BY_ID } from '@/data/course/gates'
import { LABS, LESSONS, WORKED_EXAMPLES } from '@/data/course/lessons'
import { UNITS, UNIT_BY_ID } from '@/data/course/units'
import { WEEKS } from '@/data/course/weeks'
import { PLAIN_ENGLISH } from '@/data/plain-english'
import { wordingProblems } from '@/lib/wording'
import type { Exercise } from '@/lib/types'

type Action = 'keep' | 'move' | 'reword' | 'reclassify' | 'bridge' | 'retrieval' | 'optional' | 'retire'
type Purpose = 'learn' | 'guided' | 'drill' | 'combine' | 'transfer' | 'gate' | 'capstone' | 'retrieval'

interface CurriculumMapping {
  exerciseId: string
  title: string
  section: string
  module: string
  stage: Exercise['stage']
  skills: string[]
  /** Where the 90-day plan had it, if anywhere. */
  planDate: string | null
  action: Action
  week: number
  unitId: string
  purpose: Purpose
  note?: string
}

/** Which course weeks each October module's topics belong to. */
const NATURAL: Record<string, number[]> = {
  '2026-10-02': [1, 2],
  '2026-10-03': [2, 3],
  '2026-10-04': [4],
  '2026-10-05': [1, 5, 6],
  '2026-10-06': [6, 7, 12],
  '2026-10-07': [8, 12],
  '2026-10-08': [8, 9],
  '2026-10-09': [9, 10],
  '2026-10-10': [11, 12],
  '2026-10-11': [13, 14],
}

const sectionUnit = new Map<string, { unit: string; optional: boolean }>()
for (const u of UNITS) {
  for (const s of u.sections) if (!sectionUnit.has(s)) sectionUnit.set(s, { unit: u.id, optional: false })
  for (const s of u.optional ?? []) if (!sectionUnit.has(s)) sectionUnit.set(s, { unit: u.id, optional: true })
}
const plain = new Set(PLAIN_ENGLISH)

function purposeOf(e: Exercise): Purpose {
  if (e.repType === 'capstone') return 'capstone'
  if (e.transfer || e.stage === 'pattern' || e.stage === 'interview') return 'transfer'
  if (e.stage === 'recognize' || e.stage === 'trace') return 'learn'
  if (e.stage === 'complete' || e.stage === 'recall') return 'guided'
  if (e.stage === 'combine' || e.stage === 'reconstruct') return 'combine'
  if (e.repType === 'cold' || e.stage === 'retrieval') return 'retrieval'
  return 'drill'
}

const rows: CurriculumMapping[] = []
const unmapped: string[] = []
for (const m of MODULES)
  for (const s of m.sections)
    for (const e of s.exercises) {
      const base = { exerciseId: e.id, title: e.title, section: s.id, module: m.date, stage: e.stage, skills: e.skills, planDate: DAY_OF_EXERCISE[e.id] ?? null }
      const gate = GATE_OF_EXERCISE[e.id]
      const home = sectionUnit.get(s.id)
      if (gate) {
        const unit = UNIT_BY_ID[GATE_BY_ID[gate].unitId]
        rows.push({ ...base, action: 'reclassify', week: unit.week, unitId: unit.id, purpose: 'gate', note: `variant of ${gate}` })
        continue
      }
      if (home) {
        const unit = UNIT_BY_ID[home.unit]
        let action: Action = home.optional ? 'optional' : s.id.startsWith('br-') ? 'bridge' : NATURAL[m.date]?.includes(unit.week) ? 'keep' : 'move'
        if ((action === 'keep' || action === 'move') && !plain.has(e.id) && wordingProblems(e).length) action = 'reword'
        rows.push({ ...base, action, week: unit.week, unitId: unit.id, purpose: purposeOf(e) })
        continue
      }
      // Warm-ups and cold reps that are not gate variants come back through spaced retrieval of their skills.
      if (/(^|-)warmup$|(^|-)cold$/.test(s.id)) {
        const unit = UNITS.find((u) => u.retrievalSkills.some((k) => e.skills.includes(k))) ?? UNITS.find((u) => NATURAL[m.date]?.includes(u.week))!
        rows.push({ ...base, action: 'retrieval', week: unit.week, unitId: unit.id, purpose: 'retrieval', note: 'served by spaced review' })
        continue
      }
      unmapped.push(e.id)
    }

const count = (a: Action) => rows.filter((r) => r.action === a).length
const courseReps = COURSE_SECTIONS.flatMap((s) => s.exercises)
const byPrefix = (p: RegExp) => courseReps.filter((e) => p.test(e.id)).length
const summary = {
  existingReps: rows.length + unmapped.length,
  reused: count('keep'),
  moved: count('move'),
  reworded: count('reword'),
  reclassifiedAsGates: count('reclassify'),
  bridges: count('bridge'),
  retrieval: count('retrieval'),
  optional: count('optional'),
  retired: count('retire'),
  unmapped: unmapped.length,
  newReps: courseReps.filter((e) => !e.lab).length,
  newWeek1Reps: byPrefix(/^c1-(?!g-)/),
  newWeek2Reps: byPrefix(/^c2-(?!g-)/),
  newGateVariants: courseReps.filter((e) => e.gate).length,
  newTransferProblems: byPrefix(/^c13-t-/),
  newLabExercises: courseReps.filter((e) => e.lab).length,
  newLessons: LESSONS.length,
  newWorkedExamples: WORKED_EXAMPLES.length,
  labs: LABS.length,
  gates: GATES.length,
}

writeFileSync('planning/reps-v2-migration.json', JSON.stringify({ summary, unmapped, mappings: rows }, null, 1) + '\n')

const perWeek = WEEKS.map((w) => {
  const rs = rows.filter((r) => r.week === w.number)
  const fresh = courseReps.filter((e) => UNITS.some((u) => u.week === w.number && u.sections.some((sid) => COURSE_SECTIONS.find((s) => s.id === sid)?.exercises.includes(e)))).length
  const gates = GATES.filter((g) => UNIT_BY_ID[g.unitId].week === w.number)
  return `| ${w.number} | ${w.title} | ${rs.filter((r) => r.action !== 'optional' && r.action !== 'retrieval').length} | ${rs.filter((r) => r.action === 'optional').length} | ${fresh} | ${gates.length} | ${LABS.filter((l) => l.week === w.number).length} |`
}).join('\n')

const md = `# Reps 2.0 — migration audit

Generated by \`npm run audit:migration\` from \`data/course\`. Every authored rep is classified; the full machine-readable map is \`planning/reps-v2-migration.json\`.

## Summary

| | |
|---|---:|
| Existing reps | ${summary.existingReps} |
| Reused where they were (keep) | ${summary.reused} |
| Moved to a different week | ${summary.moved} |
| Reused, flagged for a plain-English rewording | ${summary.reworded} |
| Reclassified as checkpoint variants | ${summary.reclassifiedAsGates} |
| Problem bridges | ${summary.bridges} |
| Retrieval only (spaced review) | ${summary.retrieval} |
| Optional (offered when ahead) | ${summary.optional} |
| Retired | ${summary.retired} |
| **Unmapped** | **${summary.unmapped}** |

## What the course added

| | |
|---|---:|
| New reps (not counting lab builds) | ${summary.newReps} |
| · Week 1 teaching reps | ${summary.newWeek1Reps} |
| · Week 2 teaching reps | ${summary.newWeek2Reps} |
| · Checkpoint variants | ${summary.newGateVariants} |
| · Week 13 transfer problems | ${summary.newTransferProblems} |
| Lab exercises (build + change request) | ${summary.newLabExercises} |
| Labs | ${summary.labs} |
| Lessons | ${summary.newLessons} |
| Worked examples | ${summary.newWorkedExamples} |
| Gates | ${summary.gates} |

## By week

| Week | Title | Existing reps required | Existing optional | New reps | Gates | Labs |
|---|---|---:|---:|---:|---:|---:|
${perWeek}

## Actions

- **keep**: the rep's topic sits in the same place in the course as in the October modules.
- **move**: the rep serves a different week now (for example \`d05-while\` moved from binary search to Week 1).
- **reword**: kept, and flagged by \`lib/wording.ts\` for the plain-English pass (it still works as is).
- **reclassify**: now a checkpoint variant (cold, no lesson panel, no solution).
- **bridge**: a problem bridge, kept with its target.
- **retrieval**: a warm-up or cold rep that is not a checkpoint variant; spaced review brings it back.
- **optional**: offered when ahead, never required (stretch topics: rotated search, tree construction, LIS/LCS, minimum window…).
- **retire**: none. No rep was discarded.
${unmapped.length ? `\n## Unmapped (must be zero)\n\n${unmapped.map((x) => `- ${x}`).join('\n')}\n` : ''}`
writeFileSync('planning/reps-v2-migration.md', md)

const gaps = `# Reps 2.0 — content gap manifest

What the course needed that the October modules did not have, and where it stands. Generated with the migration audit.

| Need (spec §42, §57) | Status |
|---|---|
| Week 1: state, while, loop control, running state, mutation, references, decomposition | ${summary.newWeek1Reps} new reps, 6 lessons, 4 worked examples: done |
| Week 2: contract, manual solving, testing, brute force → improve, Solve Map | ${summary.newWeek2Reps} new reps, 5 lessons, 3 worked examples: done |
| Checkpoints: four per early week, two variants per clean pass | ${GATES.length} gates, ${summary.newGateVariants} new variants plus existing cold reps: done |
| Labs (junior SWE and Applied AI / FDE) | ${LABS.length} labs, ${summary.newLabExercises} exercises: done |
| Week 13 transfer bank | ${summary.newTransferProblems} unlabeled problems (24 small, 12 full fresh, 6 debug/test, 6 explanation): done |
| Week 14 interview bank | the October interview module (speed round, debug sprint, cold capstones, mixed) plus the 5 mock problems: reused |
| Worked examples for Weeks 3–12 | not written: those weeks teach through the 24 concept guides and their ladders; worth adding where checkpoints fail most |
| Plain-English pass beyond the first 130 reps | ${summary.reworded} reused reps flagged; reword in two-week batches ahead of the learner |
`
writeFileSync('planning/reps-v2-content-gaps.md', gaps)

console.log(JSON.stringify(summary, null, 1))
if (unmapped.length) {
  console.error(`\n${unmapped.length} unmapped rep(s)`)
  process.exit(1)
}
console.log('\nEvery rep is mapped. Wrote planning/reps-v2-migration.{json,md} and planning/reps-v2-content-gaps.md')
