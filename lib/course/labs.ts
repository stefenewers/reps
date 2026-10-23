import type { Lab } from '@/data/course/types'
import { masteryEvidence, validAttempt } from '@/lib/course/credit'
import type { Attempt } from '@/lib/types'

/** A lab's saved work (study state `lab:<id>`): design answers, review checks, and whether it was marked done. */
export interface LabState {
  design: Record<number, string>
  review: Record<number, boolean>
  doneAt?: string
}

export const labKey = (id: string) => `lab:${id}`

/** A design answer has to say something: a sentence, not a placeholder. */
export const DESIGN_MIN_CHARS = 20

export interface LabProgress {
  designDone: boolean
  buildPassed: boolean
  changePassed: boolean
  reviewDone: boolean
  /** Everything needed to mark it done. */
  canFinish: boolean
  done: boolean
  /** The local date it was marked done, when it is. */
  doneOn?: string
}

/** A build counts when it passes as the learner's own work: not a revealed solution or a rebuild of one. Hints are fine. */
export function builtOwnWork(exerciseId: string, attempts: Attempt[]): boolean {
  const mine = attempts.filter((a) => a.exerciseId === exerciseId)
  return mine.some((a) => {
    const e = masteryEvidence(a, mine)
    return e !== 'failed' && e !== 'revealed' && e !== 'reconstructed'
  })
}

/** Labs are binary: done, or not done. Done needs a real design, both builds as the learner's own work, and the review. */
export function labProgress(lab: Lab, state: LabState | undefined, attempts: Attempt[]): LabProgress {
  const designDone = lab.designQuestions.every((_, i) => typeof state?.design?.[i] === 'string' && state.design[i].trim().length >= DESIGN_MIN_CHARS)
  const buildPassed = builtOwnWork(lab.buildExerciseId, attempts)
  const changePassed = builtOwnWork(lab.changeRequest.exerciseId, attempts)
  const reviewDone = lab.review.every((_, i) => state?.review?.[i])
  const canFinish = designDone && buildPassed && changePassed && reviewDone
  const done = Boolean(typeof state?.doneAt === 'string' && Number.isFinite(Date.parse(state.doneAt))) && canFinish
  // Imported state can predate a later build/change pass. Never rewrite history
  // to claim that the lab was finished before its own-work evidence existed.
  const firstOwnDay = (id: string) =>
    attempts
      .filter((a) => a.exerciseId === id && validAttempt(a) && !['failed', 'revealed', 'reconstructed'].includes(masteryEvidence(a, attempts)))
      .map((a) => a.date)
      .sort()[0]
  const doneOn = done ? [localDay(state!.doneAt!), firstOwnDay(lab.buildExerciseId), firstOwnDay(lab.changeRequest.exerciseId)].sort().at(-1) : undefined
  return { designDone, buildPassed, changePassed, reviewDone, canFinish, done, doneOn }
}

/** The local calendar date of an ISO timestamp (labs are stamped with toISOString). */
function localDay(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
