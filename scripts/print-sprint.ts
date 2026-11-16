/**
 * Read-only: the Nov 16–30 plan (and any spill into Dec 1–5) from an export, plus Prep Today for given dates.
 *   npx tsx scripts/print-sprint.ts private/progress.json [as-of date] [prep dates...]
 */
import { readFileSync } from 'node:fs'
import { dayType } from '@/data/course/calendar'
import { LAB_BY_ID } from '@/data/course/lessons'
import { exportInput, type ExportLike } from '@/lib/course/export-input'
import { prepDayOn } from '@/lib/course/prep-plan'
import { sprintPlanAsOf } from '@/lib/course/sprint-day'
import { parseLocal } from '@/lib/dates'

const [file = 'private/progress.json', asOf = '2026-11-16', ...prepDates] = process.argv.slice(2)
const bundle = JSON.parse(readFileSync(file, 'utf8')) as ExportLike
const input = { ...exportInput(bundle), review: bundle.review_queue }
const plan = sprintPlanAsOf(asOf, input)
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const h = (m: number) => (m / 60).toFixed(1)

console.log(`Sprint plan as of ${asOf}: ${plan.remaining} required reps left, ${plan.behindBy ? `BEHIND BY ${plan.behindBy}` : `on plan, ends ${plan.endsOn}`}\n`)
console.log('| date | day type | review items | new reps | gates due | labs due | target | est. hours |')
console.log('|---|---|---|---|---|---|---|---|')
for (let d = asOf; d <= (plan.days.at(-1)?.date ?? asOf); d = new Date(parseLocal(d).getTime() + 86_400_000 * 1.5).toISOString().slice(0, 10)) {
  const day = plan.days.find((x) => x.date === d)
  const label = `${d} ${DOW[parseLocal(d).getDay()]}`
  if (!day) {
    console.log(`| ${label} | ${dayType(d)} | | | | | 0 | |`)
    continue
  }
  const review = day.review.length + (day.redo ? ` + LC ${day.redo.lc} redo` : '')
  const reps = `${day.newReps.length}${day.repairs.length ? ` (+${day.repairs.length} repair)` : ''}: ${[...new Set(day.newReps.map((r) => r.unitId))].join(', ')}`
  const gates = day.gates.map((g) => `${g.gateId}×${g.variants}`).join(', ')
  const labs = day.labsDue.map((l) => LAB_BY_ID[l]?.title ?? l).join(', ')
  console.log(`| ${label} | ${day.kind === 'spill' ? 'spill' : day.kind === 'saturday' ? 'training (Sat, light)' : 'training'} | ${review} | ${reps} | ${gates} | ${labs} | ${day.target} | ${h(day.minutes.low)}–${h(day.minutes.high)} |`)
}

for (const date of prepDates) {
  const p = prepDayOn(date, { ...input })
  console.log(`\nPrep Today ${date} (${DOW[parseLocal(date).getDay()]}):`)
  if (!p) {
    console.log('  rest')
    continue
  }
  if (p.carry) console.log(`  0. Sprint carry-over (required first): ${p.carry.newReps.length} reps, gates ${p.carry.gatesDue.join(', ') || '-'}, labs ${p.carry.labsDue.join(', ') || '-'}`)
  console.log(`  1. Timed (30 min each, unlabeled): ${p.timed.map((id) => `${id} (${input.exercises[id]?.title})`).join('; ') || '-'}`)
  console.log(`  2. Format: ${p.format?.title} (${p.format?.minutes} min) → ${p.format?.labId ?? p.format?.exerciseId ?? p.format?.checklist?.title ?? '-'}`)
  console.log(`  3. AI ramp: ${p.ai ? `${p.ai.title} (${[p.ai.lessonId, p.ai.labId].filter(Boolean).join(' + ')}${p.ai.outside ? ', outside the app' : ''})` : 'done'}`)
  console.log(`  4. Story: ${p.story?.id}: ${p.story?.prompt}`)
  console.log(`  5. 1D DP: ${p.dp.join(', ') || '- (week of Dec 14 only)'}`)
  console.log(`  6. Review: ${p.review.map((r) => r.exerciseId).join(', ') || '-'}`)
  console.log(`  target: ${p.target} reps`)
}
