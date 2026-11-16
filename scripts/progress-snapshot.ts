/**
 * Read-only progress snapshot: `npx tsx scripts/progress-snapshot.ts private/progress.json [YYYY-MM-DD]`.
 * Loads an export (RepsRepository.exportData() format) and prints what the
 * course engine derives from it. It never writes anything.
 */
import { readFileSync } from 'node:fs'
import { LABS } from '@/data/course/lessons'
import { addDays } from '@/lib/dates'
import { creditsByDate, masteryEvidence, validAttempt } from '@/lib/course/credit'
import { exportInput, type ExportLike } from '@/lib/course/export-input'
import { labProgress } from '@/lib/course/labs'
import { courseStatus } from '@/lib/course/routing'

const file = process.argv[2] ?? 'private/progress.json'
const today = process.argv[3] ?? '2026-11-16'
const bundle = JSON.parse(readFileSync(file, 'utf8')) as ExportLike
const input = exportInput(bundle)
const out: string[] = []
const p = (s = '') => out.push(s)

const valid = input.attempts.filter(validAttempt)
p(`# Progress snapshot as of ${today}`)
p(`attempts ${input.attempts.length} (valid ${valid.length}, passed ${input.attempts.filter((a) => a.passed).length}), ${input.attempts.map((a) => a.date).sort()[0]} → ${input.attempts.map((a) => a.date).sort().at(-1)}`)
const unknown = [...new Set(input.attempts.map((a) => a.exerciseId).filter((id) => !input.exercises[id]))]
p(`attempts on reps not in the catalogue: ${unknown.length ? unknown.join(', ') : 'none'}`)
const ev: Record<string, number> = {}
for (const a of input.attempts) {
  const e = masteryEvidence(a, input.attempts.filter((h) => h.exerciseId === a.exerciseId))
  ev[e] = (ev[e] ?? 0) + 1
}
p(`evidence: ${Object.entries(ev).sort().map(([k, v]) => `${k} ${v}`).join(', ')}`)

p('\n## Units')
const statuses = courseStatus({ attempts: input.attempts, mastery: input.mastery, exercises: input.exercises, sections: input.sections, today })
for (const s of statuses) {
  const gates = s.gates.map((g) => `${g.gate.id}${g.cleared ? ` ✓${g.clean.length}` : g.failed ? ' ✗' : g.attempted ? ' …' : ''}`).join(' ')
  const lock = s.locked ? ` LOCKED by ${s.blockedBy.join(',')}` : ''
  p(`${s.unit.id.padEnd(24)} ${s.state.padEnd(12)} ${s.route.padEnd(11)} ${String(s.done).padStart(2)}/${String(s.total).padEnd(3)} ${gates}${lock}`)
}

p('\n## Labs')
for (const lab of LABS) {
  const pr = labProgress(lab, input.labStates[lab.id], input.attempts)
  if (!pr.done && !pr.buildPassed && !pr.designDone && !input.labStates[lab.id]) continue
  p(`${lab.id.padEnd(30)} done=${pr.done}${pr.doneOn ? ` on ${pr.doneOn}` : ''} design=${pr.designDone} build=${pr.buildPassed} change=${pr.changePassed} review=${pr.reviewDone}`)
}
p(`(${LABS.length - out.filter((l) => l.startsWith('lab-')).length} other labs untouched)`)

p('\n## Solve log (outside problems)')
for (const e of [...input.entries].sort((a, b) => (a.lc ?? 0) - (b.lc ?? 0) || a.date.localeCompare(b.date)))
  p(`LC ${String(e.lc ?? '-').padEnd(4)} ${e.kind.padEnd(8)} ${e.date} ${e.result.padEnd(8)} ${e.result === 'unaided' ? 'unaided' : 'aided'}  ${e.title}`)

p('\n## Weak skills (score < 70 or status weak/introduced/practicing)')
for (const [id, m] of Object.entries(input.mastery).sort((a, b) => a[1].score - b[1].score))
  if (m.attempts > 0 && (m.score < 70 || ['weak', 'introduced', 'practicing'].includes(m.status))) p(`${id.padEnd(18)} ${m.status.padEnd(11)} score ${m.score} attempts ${m.attempts}`)
p('stored skill_mastery rows (as exported):')
for (const r of (bundle.skill_mastery ?? []) as unknown as { id: string; status: string; score: number; solutionViews: number }[])
  if (['weak', 'introduced', 'practicing'].includes(r.status)) p(`  ${r.id.padEnd(16)} ${r.status.padEnd(11)} score ${r.score} solutionViews ${r.solutionViews}`)

p('\n## Review queue')
const pending = input.review.filter((r) => r.status === 'pending')
const cutoff = `${today}T23:59:59`
p(`rows ${input.review.length}, pending ${pending.length}, overdue ${pending.filter((r) => r.dueAt < cutoff).length}, shaky ${pending.filter((r) => r.reason === 'shaky').length}, last due ${pending.map((r) => r.dueAt).sort().at(-1)?.slice(0, 10)}`)
p(`shaky: ${pending.filter((r) => r.reason === 'shaky').map((r) => r.exerciseId ?? `skill:${r.skillId}`).join(', ')}`)

p('\n## Credits, last 14 days')
const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i - 14))
const credits = creditsByDate(dates, input.attempts, input.entries, input.exercises)
p(dates.map((d) => `${d.slice(5)} ${credits[d] ?? 0}`).join(' · '))

console.log(out.join('\n'))
