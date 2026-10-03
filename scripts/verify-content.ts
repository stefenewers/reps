/**
 * Verifies curriculum content with local python3.
 *   npm run verify:content              # everything
 *   npm run verify:content -- 2026-10-03  # one day (or "mocks")
 */
import { MODULES as DAYS, ALL_EXERCISES, allDayExercises as dayExercises } from '@/data/curriculum'
import { MOCK_EXERCISES, MOCKS } from '@/data/mocks'
import { verifyDays, verifyExercises, verifyPrimers } from '@/lib/content-check'
import { PRIMERS } from '@/data/primers'

const only = process.argv[2]
const days = only && only !== 'mocks' && only !== 'primers' ? DAYS.filter((d) => d.date === only) : only ? [] : DAYS
const exercises = only === 'mocks' ? MOCK_EXERCISES : only === 'primers' ? [] : only ? days.flatMap(dayExercises) : ALL_EXERCISES

const problems = [...verifyDays(days), ...verifyExercises(exercises), ...(only === 'primers' || !only ? verifyPrimers(PRIMERS) : [])]

// Ids must be unique across the whole curriculum, not just the filtered slice.
const counts = new Map<string, number>()
for (const e of ALL_EXERCISES) counts.set(e.id, (counts.get(e.id) ?? 0) + 1)
for (const [id, n] of counts) if (n > 1) problems.push(`[${id}] id used ${n} times across the curriculum`)
for (const m of MOCKS) for (const id of m.exerciseIds) if (!ALL_EXERCISES.some((e) => e.id === id)) problems.push(`[mock ${m.id}] unknown exercise ${id}`)

for (const d of days) {
  const ex = dayExercises(d)
  const byKind = ex.reduce<Record<string, number>>((acc, e) => ((acc[e.kind] = (acc[e.kind] ?? 0) + 1), acc), {})
  const minutes = Math.round(ex.reduce((n, e) => n + e.minutes, 0))
  console.log(`${d.date}  ${ex.length} reps  ~${minutes} min  ${JSON.stringify(byKind)}`)
}
if (only === 'mocks') console.log(`mocks: ${MOCKS.length} sessions, ${MOCK_EXERCISES.length} problems`)
if (only === 'primers' || !only) console.log(`primers: ${PRIMERS.length} covering ${PRIMERS.reduce((n, p) => n + p.skills.length, 0)} skills`)

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`- ${p}\n`)
  process.exit(1)
}
console.log('\nAll content verified against Python.')
