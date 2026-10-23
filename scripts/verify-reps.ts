/**
 * Verify a slice of content quickly: tests against Python, prompt examples, plain English.
 *   npx tsx scripts/verify-reps.ts <section-or-rep-id> [...]
 *   npx tsx scripts/verify-reps.ts --prefix c1- lab-savings
 */
import { ALL_EXERCISES } from '@/data/curriculum'
import { COURSE_SECTIONS } from '@/data/exercises/course'
import { SECTION_BY_ID } from '@/data/course'
import { verifyExercises, verifyPromptExamples } from '@/lib/content-check'
import { wordingProblems } from '@/lib/wording'
import type { Exercise } from '@/lib/types'

const args = process.argv.slice(2)
const byId = new Map(ALL_EXERCISES.map((e) => [e.id, e]))
// `--prefix c1-` checks every course rep whose id starts with it.
const picked: Exercise[] =
  args[0] === '--prefix'
    ? COURSE_SECTIONS.flatMap((s) => s.exercises).filter((e) => args.slice(1).some((p) => e.id.startsWith(p)))
    : args.flatMap((a) => SECTION_BY_ID[a]?.exercises ?? (byId.get(a) ? [byId.get(a)!] : []))
if (!picked.length) {
  console.error('nothing matched')
  process.exit(1)
}
const problems = [...verifyExercises(picked), ...verifyPromptExamples(picked)]
for (const e of picked) for (const w of wordingProblems(e)) problems.push(`[${e.id}] wording: ${w}`)
const ids = new Map<string, number>()
for (const e of [...ALL_EXERCISES]) ids.set(e.id, (ids.get(e.id) ?? 0) + 1)
for (const e of picked) if ((ids.get(e.id) ?? 0) > 1) problems.push(`[${e.id}] id used more than once`)
console.log(`${picked.length} reps checked (${COURSE_SECTIONS.length} course sections loaded)`)
if (problems.length) {
  for (const p of problems) console.error(`- ${p}`)
  console.error(`\n${problems.length} problem(s)`)
  process.exit(1)
}
console.log('All verified: tests pass against Python, examples true, plain English.')
