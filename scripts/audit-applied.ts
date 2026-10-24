/**
 * The Applied Engineering / system design audit (docs/applied-engineering.md).
 *   npm run audit:applied
 * Teach before testing, and no hidden daily work. Exits non-zero on any problem.
 */
import { appliedReport, auditApplied } from '@/lib/course/applied-audit'

for (const r of appliedReport()) console.log(`W${String(r.week).padStart(2)}  ${r.thread.padEnd(7)}  ${r.lessonId.padEnd(26)} first on Today ${r.firstDay}   ${r.labs}`)
const problems = auditApplied()
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error(`- ${p}`)
  process.exit(1)
}
console.log('\nApplied thread: every idea is taught before a lab relies on it, and no hidden daily work was added.')
