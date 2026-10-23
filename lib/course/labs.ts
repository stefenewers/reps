import type { Lab } from '@/data/course/types'

/** A lab's saved work (study state `lab:<id>`): design answers, review checks, and whether it was marked done. */
export interface LabState {
  design: Record<number, string>
  review: Record<number, boolean>
  doneAt?: string
}

export const labKey = (id: string) => `lab:${id}`

export interface LabProgress {
  designDone: boolean
  buildPassed: boolean
  changePassed: boolean
  reviewDone: boolean
  /** Everything needed to mark it done. */
  canFinish: boolean
  done: boolean
}

/** Labs are binary: done, or not done. Done needs the design written, both builds passing and the review checked. */
export function labProgress(lab: Lab, state: LabState | undefined, passed: Set<string>): LabProgress {
  const designDone = lab.designQuestions.every((_, i) => (state?.design[i] ?? '').trim().length >= 3)
  const buildPassed = passed.has(lab.buildExerciseId)
  const changePassed = passed.has(lab.changeRequest.exerciseId)
  const reviewDone = lab.review.every((_, i) => state?.review[i])
  const canFinish = designDone && buildPassed && changePassed && reviewDone
  return { designDone, buildPassed, changePassed, reviewDone, canFinish, done: Boolean(state?.doneAt) && canFinish }
}
