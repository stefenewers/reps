/**
 * How code-first is the curriculum?
 *   npm run audit:curriculum            # report + guardrails
 *   npm run audit:curriculum -- --json  # machine-readable
 */
import { DAYS } from '@/data/curriculum'
import { auditDays, BUCKET_LABEL, BUCKETS, guardrailViolations, pct, type DayAudit } from '@/lib/curriculum-audit'

const { days, overall } = auditDays(DAYS)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ days, overall, violations: guardrailViolations(DAYS) }, null, 2))
  process.exit(0)
}

const pad = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)

function line(a: DayAudit) {
  const b = a.byBucket
  return [
    padR(a.date === 'overall' ? 'OVERALL' : a.date.slice(5), 8),
    pad(a.reps, 5),
    pad(Math.round(a.minutes), 6),
    ...BUCKETS.map((k) => pad(b[k].reps, 6)),
    pad(pct(a.activeRepShare), 7),
    pad(pct(a.activeTimeShare), 7),
    pad(pct(a.guidedTimeShare), 7),
    pad(pct(a.passiveTimeShare), 7),
    pad(pct(a.modeledActiveTimeShare), 7),
    pad(Math.round(a.modeledMinutes), 6),
    pad(a.longestPassiveRun.length, 5),
  ].join(' ')
}

const header = [
  padR('Day', 8),
  pad('Reps', 5),
  pad('Min', 6),
  ...BUCKETS.map((k) => pad({ choice: 'MC', output: 'Trace', fill: 'Fill', reorder: 'Order', write: 'Write', debug: 'Debug', capstone: 'Cap', explain: 'Expl' }[k], 6)),
  pad('Act#', 7),
  pad('ActT', 7),
  pad('GuidT', 7),
  pad('PassT', 7),
  pad('ModAct', 7),
  pad('ModMin', 6),
  pad('Run', 5),
].join(' ')

console.log('\nReps curriculum audit\n')
console.log(header)
console.log('─'.repeat(header.length))
for (const r of days) console.log(line(r))
console.log('─'.repeat(header.length))
console.log(line(overall))
console.log(`
Columns: ${BUCKETS.map((k) => BUCKET_LABEL[k]).join(' · ')}
Act# = share of reps that are active coding · ActT/GuidT/PassT = share of estimated TIME
active, guided and passive (authored minutes) · ModAct/ModMin = active share and total
using modeled minutes (a cross-check against inflated estimates) · Run = longest
stretch of consecutive passive reps.

Active coding time overall: ${pct(overall.activeTimeShare)} (${Math.round(overall.byEngagement.active.minutes)} of ${Math.round(overall.minutes)} min)`)

const only = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a))
const dayIds = only ? new Set(DAYS.find((d) => d.date === only)?.sections.flatMap((s) => s.exercises.map((e) => e.id)) ?? []) : null
const v = guardrailViolations(DAYS).filter((x) => !dayIds || x.startsWith(only!) || [...dayIds].some((id) => x.startsWith(`[${id}]`)) || x.startsWith('skill '))
if (v.length) {
  console.log(`\n${v.length} guardrail violation(s):`)
  for (const x of v.slice(0, 60)) console.log(`  - ${x}`)
  if (v.length > 60) console.log(`  … and ${v.length - 60} more`)
  if (process.argv.includes('--strict')) process.exit(1)
} else console.log('\nAll guardrails pass.')
