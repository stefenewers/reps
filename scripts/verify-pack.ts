/**
 * Verifies one bridge pack on its own, without loading the others:
 *   npx tsx scripts/verify-pack.ts hashing-pointers
 * Runs every solution, starter and primer program through real Python and
 * checks the pack's own structure (blocks, briefs, tests, estimates).
 */
import type { Pack } from '@/data/exercises/bridges/types'
import { day as oct02 } from '@/data/exercises/oct02'
import { day as oct03 } from '@/data/exercises/oct03'
import { day as oct04 } from '@/data/exercises/oct04'
import { day as oct05 } from '@/data/exercises/oct05'
import { day as oct06 } from '@/data/exercises/oct06'
import { day as oct07 } from '@/data/exercises/oct07'
import { day as oct08 } from '@/data/exercises/oct08'
import { day as oct09 } from '@/data/exercises/oct09'
import { day as oct10 } from '@/data/exercises/oct10'
import { day as oct11 } from '@/data/exercises/oct11'
import { HASHING_PRIMERS } from '@/data/primers/hashing'
import { PYTHON_PRIMERS } from '@/data/primers/python'
import { PATTERN_PRIMERS } from '@/data/primers/patterns'
import { SKILL_BY_ID } from '@/data/skills'
import { verifyExercises, verifyPrimers } from '@/lib/content-check'
import { bucketOf, engagementOf, inflated, isFromScratch, modeledMinutes } from '@/lib/curriculum-audit'

const name = process.argv[2]
if (!name) throw new Error('usage: npx tsx scripts/verify-pack.ts <pack file name without .ts>')

async function main() {
  const { pack } = (await import(`@/data/exercises/bridges/${name}`)) as { pack: Pack }
  const BASE = [oct02, oct03, oct04, oct05, oct06, oct07, oct08, oct09, oct10, oct11]
  const base = new Map(BASE.flatMap((m) => m.sections.flatMap((s) => s.exercises)).map((e) => [e.id, e]))
  const baseSections = new Set(BASE.flatMap((m) => m.sections.map((s) => s.id)))
  const covered = new Set([...PYTHON_PRIMERS, ...HASHING_PRIMERS, ...PATTERN_PRIMERS].flatMap((p) => p.skills))
  const problems: string[] = []
  const warnings: string[] = []

  const reps = pack.sections.flatMap((s) => s.exercises)
  const own = new Map(reps.map((e) => [e.id, e]))
  problems.push(...verifyExercises(reps), ...verifyPrimers(pack.primers))

  for (const s of pack.sections) {
    if (baseSections.has(s.id)) problems.push(`[${s.id}] section id already exists in a module`)
    if (!BASE.some((m) => m.date === s.module)) problems.push(`[${s.id}] unknown module ${s.module}`)
    if (!s.exercises.length) problems.push(`[${s.id}] empty section`)
    let run = 0
    for (const e of s.exercises) {
      run = engagementOf(e) === 'passive' ? run + 1 : 0
      if (run > 2) problems.push(`[${e.id}] more than 2 passive reps in a row in ${s.id}`)
    }
    if (s.gate) {
      for (const e of s.exercises) if (e.kind !== 'code') problems.push(`[${e.id}] a mastery check is code only`)
      const scratch = s.exercises.filter(isFromScratch).length
      if (scratch / s.exercises.length < 0.75) problems.push(`[${s.id}] a mastery check is mostly from-scratch reps (${scratch}/${s.exercises.length})`)
    }
  }
  for (const e of reps) {
    if (base.has(e.id)) problems.push(`[${e.id}] id already used in a module`)
    if (inflated(e)) problems.push(`[${e.id}] ${e.minutes} min looks inflated (model ${modeledMinutes(e).toFixed(1)} for ${bucketOf(e)})`)
    if (e.kind === 'code') {
      if (!e.tests?.some((t) => !t.hidden)) problems.push(`[${e.id}] needs a visible test`)
      if (!e.tests?.some((t) => t.hidden)) problems.push(`[${e.id}] needs a hidden test`)
      if (!e.hints?.length) problems.push(`[${e.id}] needs at least one hint`)
      if (!pack.briefs[e.id]) problems.push(`[${e.id}] needs a brief`)
    }
  }

  // briefs: a real rep, real input names, never the answer
  for (const [id, b] of Object.entries(pack.briefs)) {
    const e = own.get(id)
    if (!e) {
      problems.push(`brief for unknown rep ${id}`)
      continue
    }
    const src = e.starterCode ?? e.code ?? ''
    for (const i of b.inputs ?? []) if (!new RegExp(`\\b${i.name}\\b`).test(src)) problems.push(`[${id}] brief input ${i.name} is not in the rep's code`)
    if (!b.task && !b.returns) problems.push(`[${id}] brief says neither what to do nor what to return`)
    const text = [b.task, b.returns, b.catch, ...(b.inputs ?? []).map((i) => i.is)].filter(Boolean).join('\n')
    for (const line of (e.solution ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length >= 12 && !l.startsWith('def ') && !l.startsWith('return ')))
      if (text.includes(line)) problems.push(`[${id}] brief contains the solution line "${line}"`)
  }

  // bridges: every bridge rep sits in exactly one block; evidence is real
  const seenLc = new Set<number>()
  for (const b of pack.bridges) {
    const where = `[bridge LC ${b.lc}]`
    if (seenLc.has(b.lc)) problems.push(`${where} listed twice`)
    seenLc.add(b.lc)
    const section = pack.sections.find((s) => s.id === b.section)
    if (!section) {
      problems.push(`${where} unknown section ${b.section}`)
      continue
    }
    if (section.gate) problems.push(`${where} a bridge section is not a mastery check`)
    for (const s of [...b.prerequisiteSkills, ...b.blocks.flatMap((k) => k.skills)]) if (!SKILL_BY_ID[s]) problems.push(`${where} unknown skill ${s}`)
    const inBlocks = b.blocks.flatMap((k) => k.reps ?? [])
    for (const e of section.exercises) {
      const n = inBlocks.filter((id) => id === e.id).length
      if (n !== 1) problems.push(`${where} ${e.id} appears in ${n} blocks (must be exactly 1)`)
    }
    for (const id of inBlocks) if (!section.exercises.some((e) => e.id === id)) problems.push(`${where} block rep ${id} is not in ${b.section}`)
    for (const k of b.blocks) {
      if (!(k.reps?.length || k.evidence?.length)) problems.push(`${where} block "${k.label}" has no reps and no evidence`)
      if (!k.skills.length) problems.push(`${where} block "${k.label}" names no skill`)
      for (const id of k.evidence ?? []) {
        const e = base.get(id) ?? own.get(id)
        if (!e) problems.push(`${where} unknown evidence rep ${id}`)
        else if (e.kind !== 'code') problems.push(`${where} evidence rep ${id} is not a code rep`)
      }
    }
    if (!b.blocks.some((k) => k.evidence?.length) && b.blocks.length < 2) warnings.push(`${where} has a single block and no evidence from the pattern ladder`)
    const last = section.exercises[section.exercises.length - 1]
    if (!isFromScratch(last)) warnings.push(`${where} the last bridge rep (${last.id}) is not written from a bare signature`)
    if (section.exercises.length > 8) warnings.push(`${where} ${section.exercises.length} bridge reps: longer than a bridge should be`)
  }
  for (const s of pack.sections) if (s.id.startsWith('br-') && !pack.bridges.some((b) => b.section === s.id)) problems.push(`[${s.id}] bridge section has no bridge entry`)

  // primers: new skills only, each with a from-scratch rep somewhere in the pack
  for (const p of pack.primers) {
    if (!(p.what.length > 40 && p.what.length < 600)) problems.push(`[primer ${p.id}] "what" must be 40-600 characters (${p.what.length})`)
    if (!(p.syntax.length >= 3 && p.syntax.length <= 7)) problems.push(`[primer ${p.id}] 3-7 syntax lines`)
    if (!(p.gotchas.length >= 2 && p.gotchas.length <= 5)) problems.push(`[primer ${p.id}] 2-5 gotchas`)
    for (const r of p.recipes ?? []) {
      if (!/^def /m.test(r.code)) problems.push(`[primer ${p.id}] recipe "${r.when}" must sit inside a function`)
      for (const line of r.code.split('\n')) if (line.length > 40) problems.push(`[primer ${p.id}] recipe "${r.when}" line over 40 characters: ${line}`)
    }
    for (const s of p.skills) {
      if (!SKILL_BY_ID[s]) problems.push(`[primer ${p.id}] unknown skill ${s}`)
      if (covered.has(s)) problems.push(`[primer ${p.id}] skill ${s} already has a primer`)
      if (!reps.some((e) => e.skills.includes(s) && isFromScratch(e))) problems.push(`[primer ${p.id}] skill ${s} has no from-scratch rep in this pack`)
    }
  }
  const primed = new Set(pack.primers.flatMap((p) => p.skills))
  for (const s of new Set(reps.flatMap((e) => e.skills))) if (!covered.has(s) && !primed.has(s) && SKILL_BY_ID[s]) problems.push(`skill ${s} is used but no primer in this pack covers it`)

  const minutes = Math.round(reps.reduce((n, e) => n + e.minutes, 0))
  const kinds = reps.reduce<Record<string, number>>((acc, e) => ((acc[bucketOf(e)] = (acc[bucketOf(e)] ?? 0) + 1), acc), {})
  console.log(`${name}: ${pack.sections.length} sections, ${reps.length} reps (~${minutes} authored min), ${pack.bridges.length} bridges, ${pack.primers.length} primers, ${Object.keys(pack.briefs).length} briefs`)
  console.log(JSON.stringify(kinds))
  for (const b of pack.bridges) console.log(`  LC ${b.lc} ${b.title}: ${pack.sections.find((s) => s.id === b.section)?.exercises.length ?? 0} bridge reps, ${b.blocks.length} blocks`)
  if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => `- ${w}`).join('\n')}`)
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `- ${p}`).join('\n\n')}`)
    process.exit(1)
  }
  console.log('\nPack verified against Python.')
}
void main()
