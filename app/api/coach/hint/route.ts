import { handle, callModel } from '@/lib/coach/server'
import { hintRequestSchema, hintResponseSchema } from '@/lib/coach/schemas'

const LEVEL = ['', 'a conceptual nudge only', 'the relevant structure or Python primitive', 'the specific operation to use', 'an algorithm outline in 3-5 steps, no code']

/** One hint, one level at a time, tailored to the learner's current code. */
export async function POST(req: Request) {
  return handle(req, hintRequestSchema, async (b) =>
    callModel({
      tier: 'fast',
      system: `Give ONE hint at level ${b.level}: ${LEVEL[b.level]}. Point at the smallest missing piece in their code. Max 2 sentences. Do not repeat earlier hints. {"hint": string}`,
      user: JSON.stringify({ title: b.title, prompt: b.prompt, skills: b.skills, code: b.code, failure: b.failure, earlierHints: b.previousHints }),
      schema: hintResponseSchema,
      maxTokens: 1200,
    }),
  )
}
