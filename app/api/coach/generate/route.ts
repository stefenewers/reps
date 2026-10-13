import { handle, callModel } from '@/lib/coach/server'
import { generateRequestSchema, generateResponseSchema } from '@/lib/coach/schemas'
import { SKILL_BY_ID } from '@/data/skills'
import { generationSystem } from '@/lib/coach/guidance'

/** Another rep / Harder / Easier / repair: structured reps inside the given skills, scaffolded for what the rep is for. */
export async function POST(req: Request) {
  return handle(req, generateRequestSchema, async (b) => {
    const skills = b.skills.filter((s) => SKILL_BY_ID[s])
    const skillLines = skills.map((s) => `- ${s}: ${SKILL_BY_ID[s].definition}`).join('\n')
    const tier = b.desiredDifficulty >= 4 || b.type === 'pattern' ? 'reasoning' : 'fast'
    const system = generationSystem(b)
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
