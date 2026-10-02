import { handle, callModel } from '@/lib/coach/server'
import { diagnoseRequestSchema, diagnoseResponseSchema, MISTAKE_CATEGORIES } from '@/lib/coach/schemas'
import { SKILLS } from '@/data/skills'

/** Explain mistake: classify, name the missing prerequisite, recommend the next action. */
export async function POST(req: Request) {
  return handle(req, diagnoseRequestSchema, async (b) => {
    // Hard cases (capstones, repeated failures) go to the stronger model.
    const hard = ['capstone', 'pattern', 'interview'].includes(b.exercise.stage) || b.failedSubmissions >= 3
    const skillIds = SKILLS.map((s) => s.id).join(',')
    return callModel({
      tier: hard ? 'reasoning' : 'fast',
      system: `Diagnose why the code fails. The test result is ground truth.
Return {"category": one of ${MISTAKE_CATEGORIES.join('|')}, "diagnosis": 1-2 sentences naming the exact line/construct, "missingPrerequisite": skill id or null, "nextAction": "syntax-reps"|"pattern-reps"|"retry"|"review-edge-cases", "repairSkills": up to 4 skill ids, most primitive first}.
If the algorithm is right but Python is shaky: syntax-reps. If Python is fine but reasoning is off: pattern-reps. Skill ids: ${skillIds}`,
      user: JSON.stringify(b),
      schema: diagnoseResponseSchema,
      maxTokens: hard ? 5000 : 1500,
    })
  })
}
