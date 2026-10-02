import type { GeneratedRep } from '@/lib/coach/schemas'
import { generatedRepSchema } from '@/lib/coach/schemas'
import { outputMatches, hasBlanks } from '@/lib/answers'
import type { RunResult } from '@/lib/python/runner'
import type { TestCase } from '@/lib/types'
import { SKILL_BY_ID } from '@/data/skills'

/**
 * Never trust a generated coding rep. Before it is shown:
 *   schema → known skills → canonical solution passes every test
 *   → starter code does not already pass → (output reps) printed output matches.
 */

export type Run = (code: string, tests: TestCase[]) => Promise<RunResult>

export interface Verdict {
  ok: boolean
  reason?: string
}

export async function verifyGeneratedRep(raw: unknown, run: Run, allowedSkills?: string[]): Promise<Verdict & { rep?: GeneratedRep }> {
  const parsed = generatedRepSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, reason: `schema: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ').slice(0, 300)}` }
  const rep = parsed.data
  const unknown = rep.skills.filter((s) => !SKILL_BY_ID[s])
  if (unknown.length) return { ok: false, reason: `unknown skills: ${unknown.join(', ')}` }
  if (allowedSkills && !rep.skills.some((s) => allowedSkills.includes(s))) return { ok: false, reason: 'rep does not target the requested skills' }

  if (rep.format === 'output') {
    const r = await run(rep.code ?? '', [])
    if (r.infraError) return { ok: false, reason: `python unavailable: ${r.infraError}` }
    if (r.timedOut || r.error) return { ok: false, reason: `trace code raised: ${r.error}` }
    if (!outputMatches(r.stdout, rep.expectedOutput ?? '')) return { ok: false, reason: `expectedOutput is wrong; Python printed: ${r.stdout.slice(0, 200)}` }
    return { ok: true, rep: { ...rep, expectedOutput: r.stdout } }
  }

  const tests: TestCase[] = [...rep.visibleTests, ...rep.hiddenTests.map((t) => ({ ...t, hidden: true }))]
  const sol = await run(rep.canonicalSolution, tests)
  if (sol.infraError) return { ok: false, reason: `python unavailable: ${sol.infraError}` }
  if (sol.timedOut) return { ok: false, reason: 'canonical solution timed out' }
  if (sol.error) return { ok: false, reason: `canonical solution raised: ${sol.error}` }
  const failing = sol.tests.filter((t) => !t.passed)
  if (failing.length)
    return { ok: false, reason: `canonical solution fails ${failing.length} test(s), e.g. ${failing[0].call}: expected ${failing[0].expected}, got ${failing[0].actual ?? failing[0].error}` }

  if (rep.starterCode && !hasBlanks(rep.starterCode)) {
    const st = await run(rep.starterCode, tests)
    if (!st.error && !st.timedOut && st.tests.length && st.tests.every((t) => t.passed)) return { ok: false, reason: 'starter code already passes every test' }
  }
  return { ok: true, rep }
}
