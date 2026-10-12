/**
 * Exports what planning/gen.py schedules:
 * - planning/reps-sections.json: every authored section (id, title, module, reps with minutes);
 * - planning/bridges.json: each target problem's bridge section and mode, and the ladders and
 *   mastery checks the bridge packs add to a unit.
 *   npx tsx scripts/export-ladders.ts
 */
import { writeFileSync } from 'node:fs'
import { MODULES } from '@/data/curriculum'
import { bucketOf, isFromScratch } from '@/lib/curriculum-audit'
import { PACK_BRIDGES, PACK_UNITS } from '@/data/exercises/bridges'

const out = MODULES.flatMap((m) =>
  m.sections.map((s) => ({
    module: m.date,
    id: s.id,
    title: s.title,
    summary: s.summary,
    gate: Boolean(s.gate),
    reps: s.exercises.map((e) => ({ id: e.id, title: e.title, minutes: e.minutes, kind: e.kind, bucket: bucketOf(e), scratch: isFromScratch(e), stage: e.stage, difficulty: e.difficulty, capstone: e.repType === 'capstone', problemId: e.problemId ?? null })),
  })),
)
writeFileSync('planning/reps-sections.json', JSON.stringify(out, null, 1))
console.log(`${out.length} sections, ${out.reduce((n, s) => n + s.reps.length, 0)} reps`)

const bridges = { units: PACK_UNITS, bridges: PACK_BRIDGES.map((b) => ({ lc: b.lc, title: b.title, unit: b.unit, section: b.section, mode: b.mode, evidence: [...new Set(b.blocks.flatMap((k) => k.evidence ?? []))] })) }
writeFileSync('planning/bridges.json', JSON.stringify(bridges, null, 1) + '\n')
console.log(`${bridges.bridges.length} bridges, ${Object.keys(bridges.units).length} units with new ladders or checks`)
