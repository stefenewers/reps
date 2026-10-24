import type { UnitStatus } from '@/lib/course/routing'

/** A Road to Ready week's state, from its units and its contract (shared by the Road and Today's mini road). */

export type WeekState = 'locked' | 'ready' | 'active' | 'complete' | 'repair'

export const WEEK_STATE_LABEL: Record<WeekState, string> = { locked: 'Locked', ready: 'Ready', active: 'Active', complete: 'Complete', repair: 'Repair required' }
export function weekState(units: UnitStatus[], n: number, current: number, complete: boolean): WeekState {
  if (complete) return 'complete'
  if (units.some((u) => u.state === 'gate-blocked')) return 'repair'
  // The current week, and any earlier week not finished yet, is where the work is.
  if (n <= current) return 'active'
  // Next week is ready once its first units are unlocked; anything further waits its turn.
  if (n === current + 1 && units.some((u) => !u.locked)) return 'ready'
  return 'locked'
}
