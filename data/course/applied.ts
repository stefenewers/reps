import type { Lesson } from '@/data/course/types'
import { appliedLessons as w1w5 } from '@/data/course/content/applied-w1w5'
import { appliedLessons as w6w10 } from '@/data/course/content/applied-w6w10'
import { appliedLessons as w11w12 } from '@/data/course/content/applied-w11w12'

/**
 * The Applied Engineering / FDE and junior system design threads (docs/applied-engineering.md).
 * Woven into the 14-week course, never a second course: each lesson is short teaching attached to
 * the unit whose week it belongs in, so it appears in Today's "Learn first" on that unit's days.
 * Lessons and their checks are never qualifying reps and never change a day's target.
 *
 * Order matters: software as a system first, then application boundaries, reliability, production,
 * and only then the model as one component of the system.
 */
export const APPLIED_LESSONS: Lesson[] = [...w1w5, ...w6w10, ...w11w12]
export const APPLIED_LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(APPLIED_LESSONS.map((l) => [l.id, l]))

/** Where each lesson is taught: the unit whose focus days surface it (before any lab that relies on it). */
export const APPLIED_SCHEDULE: { lessonId: string; unitId: string }[] = [
  // Stage A: software as a system (program design)
  { lessonId: 'sd-program-design', unitId: 'w1-loop-control' },
  { lessonId: 'ae-contracts-validation', unitId: 'w2-contract' },
  { lessonId: 'ae-requirements-change', unitId: 'w2-testing' },
  // Stage B: application boundaries
  { lessonId: 'sd-apis', unitId: 'w3-two-pointers' },
  { lessonId: 'sd-persistence', unitId: 'w4-stacks' },
  { lessonId: 'ae-external-dependencies', unitId: 'w5-binary-search' },
  // Stage C: reliability
  { lessonId: 'ae-reliability', unitId: 'w6-fast-slow' },
  { lessonId: 'ae-observability', unitId: 'w7-trees' },
  { lessonId: 'sd-auth-permissions', unitId: 'w8-queue-bfs' },
  // Production awareness and junior design cases
  { lessonId: 'sd-production-awareness', unitId: 'w9-cycles' },
  { lessonId: 'sd-design-cases', unitId: 'w10-intervals' },
  // Stage D: customer first, then the model as one component
  { lessonId: 'ae-discovery', unitId: 'w11-backtracking' },
  { lessonId: 'ae-model-boundary', unitId: 'w11-dp' },
  { lessonId: 'ae-tools-workflows', unitId: 'w12-dp-greedy' },
  { lessonId: 'ae-evals', unitId: 'w12-dp-greedy' },
  { lessonId: 'ae-retrieval', unitId: 'w12-matrix-tries' }
]

export const APPLIED_BY_UNIT: Record<string, string[]> = APPLIED_SCHEDULE.reduce<Record<string, string[]>>((acc, x) => {
  ;(acc[x.unitId] ??= []).push(x.lessonId)
  return acc
}, {})

/** What each lab's design questions assume, and where it is taught: spine lessons, concept guides, applied lessons. */
export const LAB_PREREQUISITES: Record<string, string[]> = {
  'lab-savings-goal': ['sd-program-design', 'l-loop-control'],
  'lab-inventory': ['sd-program-design', 'l-decomposition', 'l-mutation-references'],
  'lab-pricing-engine': ['ae-contracts-validation', 'l-contract'],
  'lab-shipping-eligibility': ['ae-contracts-validation', 'l-testing'],
  'lab-sorted-match': ['two-pointers', 'sd-program-design'],
  'lab-trend-analyzer': ['running-state', 'sd-program-design'],
  'lab-activity-window': ['sliding-window', 'sd-program-design'],
  'lab-undo-redo': ['stacks', 'sd-persistence'],
  'lab-product-catalog': ['binary-search', 'ae-external-dependencies'],
  'lab-playlist': ['linked-lists', 'sd-program-design'],
  'lab-route-walker': ['linked-lists', 'sd-program-design'],
  'lab-nested-analyzer': ['recursion', 'sd-program-design'],
  'lab-org-hierarchy': ['trees', 'sd-program-design'],
  'lab-category-tree': ['trees', 'sd-program-design'],
  'lab-evacuation-map': ['grids', 'bfs', 'sd-program-design'],
  'lab-social-network': ['graphs', 'bfs', 'sd-program-design'],
  'lab-dependency-planner': ['graphs', 'sd-production-awareness'],
  'lab-priority-queue': ['heaps', 'sd-production-awareness'],
  'lab-calendar-conflicts': ['intervals', 'sd-design-cases'],
  'lab-package-configurator': ['backtracking', 'sd-program-design'],
  'lab-minimum-cost': ['dynamic-programming', 'sd-program-design'],
  'lab-support-router': ['ae-model-boundary', 'ae-tools-workflows', 'ae-evals', 'ae-reliability', 'ae-observability', 'sd-auth-permissions'],
  'lab-fde-workflow': ['ae-discovery', 'ae-model-boundary', 'ae-evals', 'ae-requirements-change', 'ae-observability'],
  'lab-grounded-answer': ['ae-retrieval', 'ae-model-boundary', 'ae-evals']
}

export type CapabilityStatus = 'not-introduced' | 'learning' | 'practiced' | 'applied'

/** Evidence views on Progress: what each capability rests on. Status comes from real evidence only. */
export interface Capability {
  id: string
  title: string
  lane: 'applied' | 'design'
  lessonIds: string[]
  /** Labs that apply it (done = applied). */
  labIds: string[]
}

export const CAPABILITIES: Capability[] = [
  // Applied Engineering
  { id: 'contracts', title: 'Application contracts', lane: 'applied', lessonIds: ['ae-contracts-validation', 'sd-apis'], labIds: ['lab-pricing-engine', 'lab-shipping-eligibility'] },
  { id: 'api', title: 'API integration', lane: 'applied', lessonIds: ['sd-apis', 'ae-external-dependencies'], labIds: ['lab-product-catalog'] },
  { id: 'reliability', title: 'Reliability', lane: 'applied', lessonIds: ['ae-reliability', 'ae-observability'], labIds: ['lab-support-router'] },
  { id: 'ai-output', title: 'AI output handling', lane: 'applied', lessonIds: ['ae-model-boundary'], labIds: ['lab-support-router', 'lab-fde-workflow'] },
  { id: 'tools', title: 'Tool use', lane: 'applied', lessonIds: ['ae-tools-workflows'], labIds: ['lab-support-router'] },
  { id: 'retrieval', title: 'Retrieval', lane: 'applied', lessonIds: ['ae-retrieval'], labIds: ['lab-grounded-answer'] },
  { id: 'evals', title: 'Evaluation', lane: 'applied', lessonIds: ['ae-evals'], labIds: ['lab-fde-workflow'] },
  { id: 'permissions', title: 'Permissions', lane: 'applied', lessonIds: ['sd-auth-permissions', 'ae-tools-workflows'], labIds: ['lab-support-router'] },
  { id: 'customer', title: 'Customer iteration', lane: 'applied', lessonIds: ['ae-discovery', 'ae-requirements-change'], labIds: ['lab-fde-workflow'] },
  // Junior system design
  { id: 'program-design', title: 'Program design', lane: 'design', lessonIds: ['sd-program-design'], labIds: ['lab-savings-goal', 'lab-inventory'] },
  { id: 'app-design', title: 'Application design', lane: 'design', lessonIds: ['sd-apis', 'sd-persistence', 'sd-design-cases'], labIds: ['lab-undo-redo', 'lab-product-catalog'] },
  { id: 'failure', title: 'Failure reasoning', lane: 'design', lessonIds: ['ae-external-dependencies', 'ae-reliability'], labIds: ['lab-inventory', 'lab-dependency-planner'] },
  { id: 'production', title: 'Production awareness', lane: 'design', lessonIds: ['sd-production-awareness', 'ae-observability'], labIds: ['lab-priority-queue'] },
  { id: 'ai-system', title: 'AI system design', lane: 'design', lessonIds: ['ae-model-boundary', 'ae-tools-workflows', 'ae-retrieval'], labIds: ['lab-support-router', 'lab-fde-workflow'] }
]

/** The study-state key that records a lesson's checks as answered (think-then-reveal, self-checked). */
export const checksKey = (lessonId: string) => `checks:${lessonId}`

/**
 * A capability's status, from evidence only: not introduced (no lesson done), learning (a lesson done),
 * practiced (its lessons' checks answered), applied (a lab that uses it is done). Never a percentage.
 */
export function capabilityStatus(
  c: Capability,
  evidence: { lessonDone: (id: string) => boolean; checksDone: (id: string) => boolean; labDone: (id: string) => boolean }
): CapabilityStatus {
  const lessons = c.lessonIds.filter((id) => evidence.lessonDone(id))
  if (!lessons.length) return 'not-introduced'
  if (c.labIds.some((id) => evidence.labDone(id))) return 'applied'
  if (lessons.length === c.lessonIds.length && c.lessonIds.every((id) => evidence.checksDone(id))) return 'practiced'
  return 'learning'
}
