/**
 * Plain-English check for named reps (or a file of ids):
 *   npx tsx scripts/check-wording.ts d3-tp-mismatches d3-rs-records
 * Prints each rep's wording problems and checks its prompt examples against the solution.
 */
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { verifyPromptExamples } from '@/lib/content-check'
import { promptExamples, wordingProblems } from '@/lib/wording'

const ids = process.argv.slice(2)
let bad = 0
for (const id of ids) {
  const e = EXERCISE_BY_ID[id]
  if (!e) {
    console.log(`${id}: unknown rep`)
    bad++
    continue
  }
  const p = wordingProblems(e)
  if (p.length) bad++
  console.log(`${p.length ? '✗' : '✓'} ${id} (${promptExamples(e).length} examples)${p.map((x) => `\n    - ${x}`).join('')}`)
}
const ex = verifyPromptExamples(ids.map((id) => EXERCISE_BY_ID[id]).filter(Boolean))
for (const x of ex) console.log(`✗ ${x}`)
console.log(bad + ex.length ? `\n${bad} rep(s) with wording problems, ${ex.length} wrong example(s)` : '\nAll plain, all examples true.')
process.exit(bad + ex.length ? 1 : 0)
