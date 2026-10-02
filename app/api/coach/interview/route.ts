import { handle, callModel } from '@/lib/coach/server'
import { interviewRequestSchema, followupResponseSchema, reviewResponseSchema } from '@/lib/coach/schemas'
import { SKILLS } from '@/data/skills'

/** Interview follow-ups (fast) and post-mock review (reasoning). */
export async function POST(req: Request) {
  return handle(req, interviewRequestSchema, async (b) => {
    if (b.mode === 'followup') {
      return callModel({
        tier: 'fast',
        system: 'Act as a Google interviewer after a working solution. Ask 2-3 short follow-ups: complexity, an edge case, a variation or constraint change. {"questions": [string]}',
        user: JSON.stringify({ title: b.title, prompt: b.prompt, code: b.code }),
        schema: followupResponseSchema,
        maxTokens: 1200,
      })
    }
    return callModel({
      tier: 'reasoning',
      system: `Review a 45-minute mock interview like a fair Google interviewer. Tests already determined correctness. Judge communication, complexity reasoning, edge cases, code clarity. Be specific and brief.
{"summary": 2-3 sentences, "strengths": [up to 3], "improvements": [up to 4, actionable], "nextReps": [up to 4 skill ids from: ${SKILLS.map((s) => s.id).join(',')}]}`,
      user: JSON.stringify(b),
      schema: reviewResponseSchema,
      maxTokens: 6000,
    })
  })
}
