import { handle, callModel } from '@/lib/coach/server'
import { planRequestSchema, planResponseSchema } from '@/lib/coach/schemas'
import { SKILLS } from '@/data/skills'

/** Challenge me: turn a free-text request into bounded practice on known skills. */
export async function POST(req: Request) {
  return handle(req, planRequestSchema, async (b) => {
    const plan = await callModel({
      tier: 'fast',
      system: `Map the learner's request onto existing skills only. Skill ids: ${SKILLS.map((s) => s.id).join(',')}.
{"skills": 1-4 ids, "count": 1-15, "difficulty": 1-5, "type": "foundation"|"combine"|"pattern"|"cold", "hidePattern": boolean, "fresh": true if they want new generated problems, false if curriculum reps suffice}. If they mention weakest skills, use: ${b.weakest.join(',') || 'none known'}.`,
      user: b.request,
      schema: planResponseSchema,
      maxTokens: 800,
    })
    const known = new Set(SKILLS.map((s) => s.id))
    return { ...plan, skills: plan.skills.filter((s) => known.has(s)) }
  })
}
