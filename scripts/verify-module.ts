/**
 * Verifies one topic module on its own after a teaching pass:
 *   npx tsx scripts/verify-module.ts oct04 <baseline.json>
 * - nothing that affects the schedule, the tests or the answers changed (ids, order, minutes, solutions, tests…);
 * - every solution still passes in real Python;
 * - the module's briefs (data/briefs/<module>.ts) are valid and cover the reps that need one;
 * - transfer reps do not name their technique; each scheduled capstone has one before it;
 * - no prompt leans on code from another rep.
 */
import { readFileSync } from 'node:fs'
import type { Brief } from '@/data/briefs'
import { patternLeaks } from '@/data/pattern-words'
import { SKILL_BY_ID } from '@/data/skills'
import { verifyExercises } from '@/lib/content-check'
import { isFromScratch } from '@/lib/curriculum-audit'
import type { DayModule, Exercise } from '@/lib/types'

const [name, baselinePath] = process.argv.slice(2)
if (!name || !baselinePath) throw new Error('usage: npx tsx scripts/verify-module.ts <oct03> <baseline.json>')
const date = `2026-10-${name.slice(3)}`

interface Baseline {
  order: string[]
  sections: { id: string; reps: string[] }[]
  frozen: Record<string, string>
  scheduled: string[]
  gateReps: string[]
  capstones: string[]
  firstExposure: { skill: string; rep: string }[]
  needBrief: string[]
}

async function main() {
  const { day } = (await import(`@/data/exercises/${name}`)) as { day: DayModule }
  const { briefs } = (await import(`@/data/briefs/${name}`)) as { briefs: Record<string, Brief> }
  const base = (JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, Baseline>)[date]
  const problems: string[] = []
  const warnings: string[] = []
  const reps = day.sections.flatMap((s) => s.exercises)
  const byId = new Map(reps.map((e) => [e.id, e]))
  const freeze = (e: Exercise) => JSON.stringify([e.kind, e.minutes, e.skills, e.stage, e.repType, e.solution ?? null, e.tests ?? null, e.starterCode ?? null, e.code ?? null, e.expectedOutput ?? null, e.options ?? null, e.answer ?? null, e.lines ?? null, e.problemId ?? null, e.difficulty, e.style ?? null])

  // ── what must not move
  if (JSON.stringify(day.sections.map((s) => ({ id: s.id, reps: s.exercises.map((e) => e.id) }))) !== JSON.stringify(base.sections)) problems.push('sections or rep order changed: ids, their order and their sections are frozen (no reps added, removed or moved)')
  for (const e of reps) if (base.frozen[e.id] && freeze(e) !== base.frozen[e.id]) problems.push(`[${e.id}] a frozen field changed (kind, minutes, skills, stage, repType, solution, tests, starterCode, code, expectedOutput, options, answer, lines, difficulty, style). Only title, prompt, note, hints, explanation, examples and transfer may change.`)
  problems.push(...verifyExercises(reps))

  // ── standalone
  for (const e of reps) {
    const m = /\byour `([a-z_]+)`/i.exec(e.prompt) ?? /\b(you just wrote|previous rep|last rep|rep before|as before|from before)\b/i.exec(e.prompt)
    if (!m) continue
    const shown = `${e.code ?? ''}\n${e.starterCode ?? ''}\n${e.prompt.replace(m[0], '')}`
    if (!(m[1] && new RegExp(`\\b${m[1]}\\b`).test(shown)) && !e.code) problems.push(`[${e.id}] "${m[0]}" points at something the rep does not show`)
  }

  // ── briefs
  for (const [id, b] of Object.entries(briefs)) {
    const e = byId.get(id)
    if (!e) {
      problems.push(`brief for a rep that is not in this module: ${id}`)
      continue
    }
    const src = e.starterCode ?? e.code ?? ''
    for (const i of b.inputs ?? []) if (!new RegExp(`\\b${i.name}\\b`).test(src)) problems.push(`[${id}] brief input ${i.name} is not in the rep's code`)
    if (!b.task && !b.returns) problems.push(`[${id}] brief says neither what to do nor what to return`)
    const text = [b.task, b.returns, b.catch, ...(b.inputs ?? []).map((i) => i.is)].filter(Boolean).join('\n')
    for (const line of (e.solution ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length >= 12 && !l.startsWith('def ') && !l.startsWith('return ')))
      if (text.includes(line)) problems.push(`[${id}] brief contains the solution line "${line}"`)
  }
  for (const id of base.needBrief) if (!briefs[id]) problems.push(`[${id}] needs a brief (scheduled teaching rep, or the first rep of a new skill)`)
  for (const f of base.firstExposure) {
    const e = byId.get(f.rep)
    if (e && !e.note && !briefs[f.rep] && e.kind === 'code' && !base.needBrief.includes(f.rep)) warnings.push(`[${f.rep}] first rep to carry ${f.skill} (${SKILL_BY_ID[f.skill]?.name}) has no note or brief`)
  }

  // ── unlabeled transfer
  const scheduled = new Set(base.scheduled)
  for (const e of reps.filter((x) => x.transfer)) {
    if (e.kind !== 'code' || !isFromScratch(e)) problems.push(`[${e.id}] a transfer rep is written from a bare signature`)
    if (!scheduled.has(e.id)) problems.push(`[${e.id}] a transfer rep must be one the plan schedules (see "scheduled" in the baseline)`)
    if (e.repType === 'capstone' || base.gateReps.includes(e.id)) problems.push(`[${e.id}] a capstone or mastery-check rep is not the transfer rep: pick a rep before it`)
    const leaks = patternLeaks(`${e.title}\n${e.prompt}`, e.skills)
    if (leaks.length) problems.push(`[${e.id}] transfer rep names its technique in the title or prompt: ${leaks.map((w) => `"${w}"`).join(', ')}`)
  }
  let since = 0
  for (const id of base.order) {
    const e = byId.get(id)!
    if (e.transfer) since++
    if (base.capstones.includes(id)) {
      if (!since) warnings.push(`[${id}] no transfer rep between the previous capstone and this one`)
      since = 0
    }
  }
  // Mastery-check reps are cold: they should not name the technique either (warning: some name it legitimately).
  for (const id of base.gateReps) {
    const e = byId.get(id)!
    const leaks = patternLeaks(`${e.title}\n${e.prompt}`, e.skills)
    if (leaks.length) warnings.push(`[${id}] mastery-check rep names its technique: ${leaks.map((w) => `"${w}"`).join(', ')}`)
  }

  console.log(`${name}: ${reps.length} reps, ${Object.keys(briefs).length} briefs (${base.needBrief.length} required), ${reps.filter((e) => e.transfer).length} transfer reps for ${base.capstones.length} scheduled capstones`)
  const changed = reps.filter((e) => base.frozen[e.id]).length
  void changed
  if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => `- ${w}`).join('\n')}`)
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `- ${p}`).join('\n\n')}`)
    process.exit(1)
  }
  console.log('\nModule verified.')
}
void main()
