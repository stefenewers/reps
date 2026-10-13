import { patternLeaks } from '@/data/pattern-words'
import type { GenerateRequest, GeneratedRep } from '@/lib/coach/schemas'

/**
 * How the coach teaches. Generated reps follow the same rule as authored ones
 * (docs/authoring.md): the scaffolding a rep carries depends on what the rep is
 * for. Teach on first exposure, shrink as the skill is learned, show none when
 * recall or recognition is the thing being tested.
 */

export const LEARNER =
  'The learner is building toward SWE I / new-grad coding interviews in Python. They understand general programming; fluent Python, data structures, algorithms and pattern recognition are still developing. Never assume a concept is known just because it is common in interview prep.'

/** The shared rules for every coach call, kept short on purpose. */
export const TEACHING_RULES = [
  LEARNER,
  'Be concise. No praise, no filler. Never reveal a full solution unless asked.',
  'Stay inside the given skills.',
  'Scaffolding depends on the purpose of the rep: explain a concept the first time it is met, shrink the explanation as it is practised, and give none when recall or pattern recognition is what is being tested.',
  'A learner should never be confused about what a question is asking: say what each input is and what to return. They should still have to work out the solution.',
  'Distinguish Python recall problems from algorithm problems.',
  'Deterministic tests decide correctness, not you. Never invent Python behavior.',
  'Reply with JSON only, matching the requested shape.',
].join(' ')

type RepKind = GenerateRequest['type']

/** What each kind of generated rep must do, and must not do. */
export const GENERATION_GUIDANCE: Record<RepKind, string> = {
  foundation:
    'FOUNDATION (learn / first exposure): teach or reinforce ONE primitive. Fill "teaching": {"concept": 2-4 plain sentences on what the idea is, why it exists and the one rule to hold on to; "example": a tiny Python snippet, 2-6 lines, that shows the mechanic on its own data and does NOT solve this rep}. In "prompt", say what every input is (its type and meaning) and what to return, define any term a beginner would not know, and include one small worked example. Give at least one entry in "examples". Not an essay: the learner should reach the editor quickly.',
  combine:
    'COMBINE: use two to four skills the learner already has, together. No "teaching" (set it to null). The prompt states the contract clearly: inputs, output, constraints, the edge behaviour the tests check. Less instruction than a foundation rep: do not walk through the algorithm.',
  pattern:
    'PATTERN / TRANSFER: a clean, small, interview-quality problem. No "teaching" (null). State inputs, output and edge behaviour precisely. Do not explain how to solve it.',
  cold: 'COLD (maintain / retrieval): minimal scaffolding. No "teaching" (null), no "examples" unless the contract is ambiguous without one. A one- or two-sentence prompt that names the function, its inputs and what it returns. The learner should produce it from memory.',
}

/** The system prompt for /api/coach/generate. */
export function generationSystem(b: Pick<GenerateRequest, 'count' | 'type' | 'hidePattern'>): string {
  const hide = b.hidePattern || b.type === 'pattern'
  return `Generate ${b.count} Python practice rep(s) as {"reps":[...]}. Each rep:
{"title","type":"${b.type}","format":"code"|"output","difficulty":1-5,"skills":[skill ids],"teaching":{"concept","example"}|null,"prompt","starterCode","code","expectedOutput","examples":[{"input","output"}],"visibleTests":[{"call","expected","compare"?}],"hiddenTests":[...],"canonicalSolution","explanation","hints":[4 progressive: nudge, structure, operation, outline],"complexity":{"time","space"},"signature"}
Purpose of this rep:
- ${GENERATION_GUIDANCE[b.type]}
Rules:
- format "code": a function the learner writes. "call" is a Python expression like "count_votes(['a','b','a'])", "expected" a Python literal. 2-3 visible + 3-6 hidden tests incl. edge cases. starterCode = def line + "pass". canonicalSolution must pass every test.
- format "output": short code that prints; "code" + exact "expectedOutput"; tests empty; canonicalSolution = code.
- No input(), randomness, time, or printing sets. Standard library only; import what you use.
- prompt: markdown with \`inline code\`. Never a vague one-line mini-LeetCode: the learner must know what every input is and exactly what to return. Do not reveal the solution.${hide ? ' Do not name the algorithm, the pattern or the data structure to use, in the title or the prompt: recognising it is what is being tested.' : ''}
- "signature": structural tag of the code shape, e.g. "freq-map:argmax", not the story. Must be structurally different from the recent signatures.
- skills: only ids from the target list.`
}

/**
 * The pedagogy check on a generated rep, run with the deterministic ones before it is shown:
 * a foundation rep must teach, a cold rep must not over-scaffold, and a rep that tests
 * recognition must not name its pattern. Returns why it fails, or null.
 */
export function pedagogyProblem(rep: GeneratedRep, opts: { hidePattern?: boolean } = {}): string | null {
  const concept = rep.teaching?.concept?.trim() ?? ''
  if (rep.type === 'foundation') {
    if (concept.length < 40) return 'a foundation rep must teach: "teaching.concept" is missing or too thin (say what the idea is and the one rule to hold on to)'
    if (concept.length > 700) return 'the teaching is too long: 2-4 sentences, not an essay'
    if (rep.format === 'code' && !rep.examples.length && !/→|->|returns? `?[\[\{"'\d]/.test(rep.prompt)) return 'a foundation rep needs one small worked example'
    if (rep.teaching?.example && rep.canonicalSolution.trim() === rep.teaching.example.trim()) return 'the teaching example must not be the solution'
  }
  if (rep.type === 'cold') {
    if (concept) return 'a cold rep is retrieval: no teaching'
    if (rep.prompt.length > 420) return 'a cold rep is over-scaffolded: keep the prompt to a sentence or two'
  }
  if (rep.type === 'pattern' || opts.hidePattern) {
    const leaks = patternLeaks(`${rep.title}\n${rep.prompt}`, rep.skills)
    if (leaks.length) return `the rep names its technique (${leaks.slice(0, 3).join(', ')}): recognising it is what is being tested`
  }
  if (rep.format === 'code' && rep.prompt.trim().length < 40) return 'the prompt is too thin: say what the inputs are and what to return'
  return null
}
