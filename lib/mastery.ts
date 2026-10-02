import type { Attempt, RetrievalType, SkillId, Stage } from '@/lib/types'

/**
 * Deterministic mastery. No model ever assigns these numbers.
 *
 * Each attempt is a piece of evidence with a weight and a quality:
 *
 *   weight  = stage weight × retrieval weight
 *   quality = 0 if failed, else  hint factor × solution factor × retry factor
 *
 *   accuracy = recency-weighted mean quality over the last 15 attempts
 *   evidence = 1 − e^(−Σ weight × quality / 4)        (saturates with clean reps)
 *   score    = 100 × accuracy × evidence
 *
 * A single correct rep scores ~22. Recognition alone (choice/trace) caps at 55,
 * so "I recognise it" never reads as "I can write it". Fluent additionally
 * needs a clean cold rep and three clean reps in a row.
 */

export type MasteryStatus = 'unseen' | 'introduced' | 'practicing' | 'competent' | 'fluent' | 'weak'

export interface SkillMastery {
  skillId: SkillId
  score: number
  status: MasteryStatus
  attempts: number
  correct: number
  failures: number
  consecutiveCorrect: number
  hintsUsed: number
  solutionViews: number
  coldAttempts: number
  coldCorrect: number
  lastPracticed?: string
  accuracy: number
  evidence: number
  /** Only recognition-level evidence so far. */
  recognitionOnly: boolean
}

export const STAGE_WEIGHT: Record<Stage, number> = {
  recognize: 0.5,
  trace: 0.7,
  recall: 0.9,
  complete: 0.8,
  reconstruct: 1,
  microbuild: 1,
  combine: 1.1,
  pattern: 1.2,
  capstone: 1.3,
  interview: 1.2,
  retrieval: 1.2,
}

export const RETRIEVAL_WEIGHT: Record<RetrievalType, number> = {
  'first-exposure': 1,
  'immediate-reconstruction': 0.6,
  cold: 1.5,
}

const RECOGNITION_STAGES: Stage[] = ['recognize', 'trace']
export const RECOGNITION_CAP = 55
const WINDOW = 15
const RECENCY = 0.88
const EVIDENCE_SCALE = 4

/** Attempts that count: completed ones, plus abandoned ones that had failed submissions. */
export function countsAsEvidence(a: Attempt): boolean {
  return Boolean(a.completedAt) || a.attemptsBeforePass > 0
}

export function attemptQuality(a: Attempt): number {
  if (!a.passed) return 0
  const hint = Math.max(0.4, 1 - 0.15 * a.hintsUsed)
  const solution = a.solutionViewed ? 0.3 : 1
  const retry = Math.max(0.5, 1 - 0.1 * a.attemptsBeforePass)
  return hint * solution * retry
}

export function attemptWeight(a: Attempt): number {
  return STAGE_WEIGHT[a.stage] * RETRIEVAL_WEIGHT[a.retrievalType]
}

function isClean(a: Attempt): boolean {
  return a.passed && a.attemptsBeforePass === 0 && a.hintsUsed === 0 && !a.solutionViewed
}

function attemptTime(a: Attempt): string {
  return a.completedAt ?? a.startedAt
}

export function computeSkillMastery(skillId: SkillId, allAttempts: Attempt[]): SkillMastery {
  const attempts = allAttempts
    .filter((a) => a.skills.includes(skillId) && countsAsEvidence(a))
    .sort((x, y) => attemptTime(x).localeCompare(attemptTime(y)))

  const base: SkillMastery = {
    skillId,
    score: 0,
    status: 'unseen',
    attempts: attempts.length,
    correct: 0,
    failures: 0,
    consecutiveCorrect: 0,
    hintsUsed: 0,
    solutionViews: 0,
    coldAttempts: 0,
    coldCorrect: 0,
    accuracy: 0,
    evidence: 0,
    recognitionOnly: true,
  }
  if (!attempts.length) return base

  let evidenceSum = 0
  for (const a of attempts) {
    if (a.passed) base.correct++
    else base.failures++
    base.hintsUsed += a.hintsUsed
    if (a.solutionViewed) base.solutionViews++
    if (a.retrievalType === 'cold') {
      base.coldAttempts++
      if (a.passed) base.coldCorrect++
    }
    if (a.passed && !RECOGNITION_STAGES.includes(a.stage)) base.recognitionOnly = false
    evidenceSum += attemptWeight(a) * attemptQuality(a)
  }
  base.lastPracticed = attemptTime(attempts[attempts.length - 1])

  for (let i = attempts.length - 1; i >= 0 && isClean(attempts[i]); i--) base.consecutiveCorrect++

  const recent = attempts.slice(-WINDOW)
  let num = 0
  let den = 0
  recent.forEach((a, i) => {
    const age = recent.length - 1 - i
    const w = attemptWeight(a) * Math.pow(RECENCY, age)
    num += w * attemptQuality(a)
    den += w
  })
  base.accuracy = den ? num / den : 0
  base.evidence = 1 - Math.exp(-evidenceSum / EVIDENCE_SCALE)

  let score = 100 * base.accuracy * base.evidence
  if (base.recognitionOnly) score = Math.min(score, RECOGNITION_CAP)
  base.score = Math.round(score)
  base.status = statusFor(base, attempts)
  return base
}

export function statusFor(m: SkillMastery, attempts: Attempt[]): MasteryStatus {
  if (!attempts.length) return 'unseen'
  const lastTwo = attempts.slice(-2)
  const lastCold = [...attempts].reverse().find((a) => a.retrievalType === 'cold')
  const weak =
    (attempts.length >= 3 && m.accuracy < 0.55) ||
    (lastTwo.length === 2 && lastTwo.every((a) => !a.passed)) ||
    (lastCold !== undefined && !lastCold.passed)
  if (weak) return 'weak'
  const cleanCold = attempts.some((a) => a.retrievalType === 'cold' && isClean(a))
  if (m.score >= 85 && m.consecutiveCorrect >= 3 && cleanCold) return 'fluent'
  if (m.score >= 65) return 'competent'
  if (m.score >= 30) return 'practicing'
  return 'introduced'
}

export function computeAllMastery(skillIds: SkillId[], attempts: Attempt[]): Record<SkillId, SkillMastery> {
  return Object.fromEntries(skillIds.map((id) => [id, computeSkillMastery(id, attempts)]))
}

export function explainMastery(m: SkillMastery): string {
  if (m.status === 'unseen') return 'No reps yet.'
  const parts = [
    `Score ${m.score} = accuracy ${Math.round(m.accuracy * 100)}% × evidence ${Math.round(m.evidence * 100)}%.`,
    'Evidence grows with each clean rep; cold reps count 1.5×, capstones 1.3×, recognition reps 0.5–0.7×.',
    'Hints reduce a rep’s credit by 15% each; a rep after viewing the solution earns 30%.',
  ]
  if (m.recognitionOnly) parts.push(`Only recognition evidence so far, so the score is capped at ${RECOGNITION_CAP} until you write it.`)
  if (m.status !== 'fluent' && m.score >= 85) parts.push('Fluent needs three clean reps in a row and a clean cold rep.')
  return parts.join(' ')
}

export const STATUS_LABEL: Record<MasteryStatus, string> = {
  unseen: 'unseen',
  introduced: 'introduced',
  practicing: 'practicing',
  competent: 'competent',
  fluent: 'fluent',
  weak: 'weak',
}
