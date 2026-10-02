/**
 * Verifies curriculum content with local python3.
 *   npm run verify:content              # everything
 *   npm run verify:content -- 2026-10-03  # one day (or "mocks")
 */
import { DAYS, ALL_EXERCISES, dayExercises } from '@/data/curriculum'
import { MOCK_EXERCISES, MOCKS } from '@/data/mocks'
import { verifyDays, verifyExercises } from '@/lib/content-check'

const only = process.argv[2]
const days = only && only !== 'mocks' ? DAYS.filter((d) => d.date === only) : only === 'mocks' ? [] : DAYS
const exercises = only === 'mocks' ? MOCK_EXERCISES : only ? days.flatMap(dayExercises) : ALL_EXERCISES

const problems = [...verifyDays(days), ...verifyExercises(exercises)]

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

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`- ${p}\n`)
  process.exit(1)
}
console.log('\nAll content verified against Python.')
