import { handle, callModel } from '@/lib/coach/server'
import { verifyRequestSchema, verifyResponseSchema } from '@/lib/coach/schemas'

/** Check a written explanation against its rubric. Only on request. */
export async function POST(req: Request) {
  return handle(req, verifyRequestSchema, async (b) =>
    callModel({
      tier: 'fast',
      system: `For each rubric item, decide if the explanation clearly covers it. Strict but fair. {"met": [boolean per rubric item, same order], "feedback": one or two sentences on the most important gap, or what to tighten}`,
      user: JSON.stringify(b),
      schema: verifyResponseSchema,
      maxTokens: 1200,
    }),
  )
}
