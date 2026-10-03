/**
 * Runs every rep through the same Python the browser uses (Pyodide), not just
 * local CPython: solutions must pass, broken/starter code must not, predicted
 * outputs must match, and nothing may be slow enough to hit the 5 s browser
 * timeout.
 *   npm run verify:pyodide            # all days
 *   npm run verify:pyodide -- 2026-10-09
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { loadPyodide } from 'pyodide'
import { ALL_EXERCISES, MODULES as DAYS, allDayExercises as dayExercises } from '@/data/curriculum'
import { MOCK_EXERCISES } from '@/data/mocks'
import { PRIMERS } from '@/data/primers'
import { hasBlanks, outputMatches } from '@/lib/answers'
import type { Exercise, TestCase } from '@/lib/types'

const SLOW_MS = 2500

async function main() {
  const only = process.argv[2]
  const list: Exercise[] = only ? (only === 'mocks' ? MOCK_EXERCISES : dayExercises(DAYS.find((d) => d.date === only)!)) : ALL_EXERCISES
  const py = await loadPyodide({ indexURL: path.join(process.cwd(), 'node_modules/pyodide') })
  py.runPython(readFileSync(path.join(process.cwd(), 'public/python/harness.py'), 'utf8'))
  const main = py.globals.get('__reps_main')

  type R = { stdout: string; error: string | null; tests: { passed: boolean; name: string; error: string | null; expected: string | null; actual: string | null }[] }
  const run = (code: string, tests: TestCase[] = []): { r: R; ms: number } => {
    const t = performance.now()
    const r = JSON.parse(main(code, JSON.stringify(tests))) as R
    return { r, ms: performance.now() - t }
  }

  const problems: string[] = []
  const slow: string[] = []
  let checked = 0
  for (const e of list) {
    if (e.kind === 'output' && e.code) {
      const { r, ms } = run(e.code)
      checked++
      if (r.error || !outputMatches(r.stdout, e.expectedOutput ?? '')) problems.push(`[${e.id}] output differs in Pyodide: ${r.error ?? r.stdout.slice(0, 120)}`)
      if (ms > SLOW_MS) slow.push(`[${e.id}] output ${Math.round(ms)} ms`)
    }
    if ((e.kind === 'code' || e.kind === 'reorder') && e.solution && e.tests?.length) {
      const { r, ms } = run(e.solution, e.tests)
      checked++
      const bad = r.tests.filter((t) => !t.passed)
      if (r.error || bad.length) problems.push(`[${e.id}] solution fails in Pyodide: ${r.error ?? bad.map((t) => `${t.name}: ${t.error ?? `expected ${t.expected} got ${t.actual}`}`).join('; ').slice(0, 300)}`)
      if (ms > SLOW_MS) slow.push(`[${e.id}] solution ${Math.round(ms)} ms`)
      if (e.starterCode && !hasBlanks(e.starterCode)) {
        const s = run(e.starterCode, e.tests)
        if (!s.r.error && s.r.tests.length && s.r.tests.every((t) => t.passed)) problems.push(`[${e.id}] starter passes every test in Pyodide`)
        if (s.ms > SLOW_MS) slow.push(`[${e.id}] starter ${Math.round(s.ms)} ms (browser stops at 5000 ms)`)
      }
    }
  }
  if (!only) {
    for (const p of PRIMERS) {
      const { r } = run(p.example.code)
      checked++
      if (r.error || !outputMatches(r.stdout, p.example.output)) problems.push(`[primer ${p.id}] example differs in Pyodide: ${r.error ?? r.stdout.slice(0, 120)}`)
    }
  }
  console.log(`Pyodide ${py.version}: checked ${checked} runs across ${list.length} reps${only ? '' : ` and ${PRIMERS.length} primers`}.`)
  if (slow.length) console.log(`\nSlow (> ${SLOW_MS} ms):\n  ${slow.join('\n  ')}`)
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`)
    process.exit(1)
  }
  console.log('All reps behave the same in Pyodide.')
}

void main()
