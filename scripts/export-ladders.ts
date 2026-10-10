/**
 * Exports every authored section (id, title, module, reps with minutes) to
 * planning/reps-sections.json, for planning/gen.py to schedule as ladders.
 *   npx tsx scripts/export-ladders.ts
 */
import { writeFileSync } from 'node:fs'
import { MODULES } from '@/data/curriculum'

const out = MODULES.flatMap((m) =>
  m.sections.map((s) => ({
    module: m.date,
    id: s.id,
    title: s.title,
    summary: s.summary,
    gate: Boolean(s.gate),
    reps: s.exercises.map((e) => ({ id: e.id, title: e.title, minutes: e.minutes, kind: e.kind, capstone: e.repType === 'capstone', problemId: e.problemId ?? null })),
  })),
)
writeFileSync('planning/reps-sections.json', JSON.stringify(out, null, 1))
console.log(`${out.length} sections, ${out.reduce((n, s) => n + s.reps.length, 0)} reps`)
