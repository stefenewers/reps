import { handle, callModel } from '@/lib/coach/server'
import { generateRequestSchema, generateResponseSchema } from '@/lib/coach/schemas'
import { SKILL_BY_ID } from '@/data/skills'

/** Another rep / Harder / Easier / repair: structured reps inside the given skills. */
export async function POST(req: Request) {
  return handle(req, generateRequestSchema, async (b) => {
    const skills = b.skills.filter((s) => SKILL_BY_ID[s])
    const skillLines = skills.map((s) => `- ${s}: ${SKILL_BY_ID[s].definition}`).join('\n')
    const tier = b.desiredDifficulty >= 4 || b.type === 'pattern' ? 'reasoning' : 'fast'
    const system = `Generate ${b.count} Python practice rep(s) as {"reps":[...]}. Each rep:
{"title","type":"${b.type}","format":"code"|"output","difficulty":1-5,"skills":[skill ids],"prompt","starterCode","code","expectedOutput","examples":[{"input","output"}],"visibleTests":[{"call","expected","compare"?}],"hiddenTests":[...],"canonicalSolution","explanation","hints":[4 progressive: nudge, structure, operation, outline],"complexity":{"time","space"},"signature"}
Rules:
- format "code": a function the learner writes. "call" is a Python expression like "count_votes(['a','b','a'])", "expected" a Python literal. 2-3 visible + 3-6 hidden tests incl. edge cases. starterCode = def line + "pass". canonicalSolution must pass every test.
- format "output": short code that prints; "code" + exact "expectedOutput"; tests empty; canonicalSolution = code.
- No input(), randomness, time, or printing sets. Standard library only; import what you use.
- prompt: 1-4 short sentences, markdown with \`inline code\`. Do not reveal the solution.${b.hidePattern ? ' Do not name the algorithm or pattern.' : ''}
- "signature": structural tag of the code shape, e.g. "freq-map:argmax", not the story. Must be structurally different from the recent signatures.
- skills: only ids from the target list.`
    const user = JSON.stringify({
      targetSkills: skillLines,
      mastery: b.mastery,
      desiredDifficulty: b.desiredDifficulty,
      format: b.format,
      recentSignatures: b.recentSignatures,
      recentMistakes: b.recentMistakes,
      basedOn: b.basedOn,
      previousAttemptWasInvalid: b.previousFailure,
    })
    return callModel({ tier, system, user, schema: generateResponseSchema.passthrough(), maxTokens: tier === 'reasoning' ? 7000 : 4000 })
  })
}
