/**
 * Mocks done outside the app (self-recorded, with a partner, on a peer
 * platform), logged by hand with a 1–4 rubric. Stored under `mocklog:<id>`.
 */
export const MOCK_TYPES = ['Self-recorded', 'With a partner', 'Peer platform', 'Paid or anonymous', 'Online assessment', 'Behavioral', 'Design'] as const
export type MockType = (typeof MOCK_TYPES)[number]

/** The seven things a mock is scored on, 1 (missing) to 4 (strong). */
export const RUBRIC = ['Clarify', 'Approach', 'Code', 'Test', 'Complexity', 'Communication', 'Follow-up'] as const
export type RubricKey = (typeof RUBRIC)[number]

export interface MockLogEntry {
  id: string
  date: string
  type: MockType
  /** Minutes the session ran. */
  duration?: number
  scores: Partial<Record<RubricKey, number>>
  notes?: string
  at: string
}

export const MOCKLOG_PREFIX = 'mocklog:'

/** Mean of the rubric scores that were filled in, or null when none were. */
export function rubricAverage(e: Pick<MockLogEntry, 'scores'>): number | null {
  const v = Object.values(e.scores).filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 4)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

/** Mocks logged on or before `through`, and the mean of their averages. */
export function mockSummary(entries: MockLogEntry[], through?: string): { count: number; average: number | null } {
  const es = entries.filter((e) => !through || e.date <= through)
  const avgs = es.map(rubricAverage).filter((n): n is number => n !== null)
  return { count: es.length, average: avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null }
}
