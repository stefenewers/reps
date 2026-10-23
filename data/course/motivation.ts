/**
 * The affirmation engine (REPS_2_MASTER_SPEC.md §26–28). Deterministic copy chosen
 * from objective evidence, never from an LLM. It connects real work to becoming
 * a software engineer, and it never says more than the evidence supports:
 * no "on track" when the week is off track, no guilt on planned rest, no
 * celebration of skipped work.
 */

export type MotivationEvent =
  | 'day-start'
  | 'day-progress'
  | 'day-halfway'
  | 'day-complete'
  | 'day-incomplete'
  | 'planned-rest'
  | 'recovery-day'
  | 'week-progress'
  | 'week-complete'
  | 'gate-cleared'
  | 'gate-failed'
  | 'repair-success'
  | 'streak-increment'
  | 'milestone'
  | 'trajectory'
  | 'transfer-breakthrough'
  | 'mock-complete'
  | 'ready'
  | 'ready-with-gaps'
  | 'not-ready'

export interface MotivationContext {
  repsDone?: number
  repsTarget?: number
  week?: number
  streak?: number
  gateTitle?: string
  nextUnit?: string
  skillImproved?: string
  coldIndependentCount?: number
  assistedCount?: number
  weekDone?: number
  weekTarget?: number
  weekStatus?: 'on-track' | 'recoverable' | 'off-track'
  shortfall?: number
  milestone?: number
  holiday?: string
  /** Used only to vary wording from day to day, never the facts. */
  seed?: string
}

export interface Motivation {
  event: MotivationEvent
  text: string
  /** Visual weight: celebrations get the flame treatment. */
  tone: 'neutral' | 'warm' | 'celebrate' | 'rest' | 'repair'
}

function pick(options: string[], seed = ''): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return options[h % options.length]
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function motivate(event: MotivationEvent, c: MotivationContext = {}): Motivation {
  const done = c.repsDone ?? 0
  const target = c.repsTarget ?? 0
  const left = Math.max(0, target - done)
  switch (event) {
    case 'day-start':
      return {
        event,
        tone: 'neutral',
        text: pick(
          [
            `Today's work is clear: ${target} meaningful reps. Finish the work, and you move the plan forward.`,
            `You're building software-engineering fluency one production at a time. Today's target is ${target}.`,
            `${target} reps today. Each one is something you produced, not something you watched.`,
          ],
          c.seed,
        ),
      }
    case 'day-progress':
      return { event, tone: 'neutral', text: `${done} of ${target} done. ${plural(left, 'more rep')} and today counts.` }
    case 'day-halfway':
      return { event, tone: 'warm', text: `${done} of ${target} done. You're past the warm-up. ${left === 1 ? 'One more' : `${left} more`} and the day is complete. Keep the quality high.` }
    case 'day-complete': {
      const leaned = (c.assistedCount ?? 0) > done / 2
      if (leaned)
        return { event, tone: 'warm', text: `Day complete: ${done}/${target}. A lot of today needed help, so the next session starts with a short repair before moving on. That is the system working, not a setback.` }
      return {
        event,
        tone: 'celebrate',
        text: pick(
          [
            `Good work today. You completed ${done} meaningful reps. This is the kind of output that moves you toward becoming a software engineer.`,
            `Day complete. You did the work the plan asked for today. That's how this becomes real.`,
            `${done}/${target}. Another day of evidence, not just study time.`,
          ],
          c.seed,
        ),
      }
    }
    case 'day-incomplete':
      return {
        event,
        tone: 'repair',
        text: `${done}/${target} complete.${c.skillImproved ? ` Today exposed a clear gap in ${c.skillImproved}.` : ''} ${left ? `${plural(left, 'rep')} short.` : ''}${c.weekStatus === 'off-track' ? ' The week needs a recovery plan; Saturday is the place to start.' : ' The week is still recoverable, and Saturday can close the rest.'}`.replace(/\s+/g, ' ').trim(),
      }
    case 'planned-rest':
      return { event, tone: 'rest', text: `${c.holiday ? `${c.holiday}. ` : ''}Rest day. Nothing is due. Your plan is intact.` }
    case 'recovery-day':
      return c.shortfall
        ? { event, tone: 'neutral', text: `Saturday is optional. ${plural(c.shortfall, 'rep')} would close week ${c.week ?? ''}; nothing is owed.`.replace(' ;', ';') }
        : { event, tone: 'rest', text: `Saturday is optional, and week ${c.week ?? ''} is already covered. Rest is part of the plan.`.replace('  ', ' ') }
    case 'week-progress': {
      const wd = c.weekDone ?? 0
      const wt = c.weekTarget ?? 0
      if (c.weekStatus === 'off-track') return { event, tone: 'repair', text: `Week ${c.week}: ${wd} of ${wt}. Behind what this week needs. The shortest way back is today's target, then Saturday. No guilt, just the next rep.` }
      if (c.weekStatus === 'recoverable') return { event, tone: 'neutral', text: `Week ${c.week}: ${wd} of ${wt}. ${plural(c.shortfall ?? 0, 'rep')} short so far, which is recoverable.` }
      return { event, tone: 'warm', text: `Week ${c.week}: ${wd} of ${wt}. On track for February 1 if this output continues.` }
    }
    case 'week-complete':
      return { event, tone: 'celebrate', text: `Week ${c.week} complete: ${c.weekDone} qualifying problems. You're building the evidence required to become interview-ready. You don't need to do more tonight.` }
    case 'gate-cleared':
      return {
        event,
        tone: 'celebrate',
        text: pick(
          [`Checkpoint cleared: ${c.gateTitle}.${c.nextUnit ? ` You can move into ${c.nextUnit} because the prerequisite is producing cold.` : ''}`, `You earned the next unit. This wasn't unlocked by time spent. You proved ${c.gateTitle?.toLowerCase() ?? 'the skill'}.`],
          c.seed,
        ),
      }
    case 'gate-failed':
      return { event, tone: 'repair', text: `Not ready yet: ${c.gateTitle}. The failure points at one small piece. A short repair, then a fresh checkpoint.` }
    case 'repair-success':
      return { event, tone: 'warm', text: `You found the weak link and repaired it. That's better than hiding it behind another solution. Now prove it on a fresh checkpoint.` }
    case 'streak-increment':
      return { event, tone: 'celebrate', text: `${plural(c.streak ?? 0, 'training day')} in a row.` }
    case 'milestone':
      return { event, tone: 'celebrate', text: c.milestone === 1 ? 'First training day complete. The course has started.' : `${c.milestone} qualifying problems. Each one was produced, not watched.` }
    case 'trajectory':
      return { event, tone: 'warm', text: `Two weeks in, you've built stronger control over program state and a repeatable way to approach unfamiliar problems. You're on track for February 1 if this output continues.` }
    case 'transfer-breakthrough':
      return { event, tone: 'celebrate', text: 'Cold Medium solved independently. That is one of the strongest signals Reps can record.' }
    case 'mock-complete':
      return { event, tone: 'warm', text: 'Mock complete. The review comes now, while it is fresh: what went well, what to repair.' }
    case 'ready':
      return { event, tone: 'celebrate', text: "The evidence says you're ready to start interviewing. You won't know every problem, and you don't need to. You can reason, implement, test and recover independently enough for real loops to be useful." }
    case 'ready-with-gaps':
      return { event, tone: 'warm', text: 'Ready to start interviewing, with targeted gaps. Keep repairing those while the first loops happen.' }
    case 'not-ready':
      return { event, tone: 'repair', text: 'Not ready yet, and the report says exactly why. Transfer and repair first; mocks when they will be useful.' }
  }
}

/** The line Today shows, from the day and week as they stand. */
export function todayLine(c: MotivationContext & { dayType: 'training' | 'recovery' | 'rest' }): Motivation {
  if (c.dayType === 'rest') return motivate('planned-rest', c)
  if (c.dayType === 'recovery') return motivate('recovery-day', c)
  const done = c.repsDone ?? 0
  const target = c.repsTarget ?? 0
  if (target && done >= target) return motivate('day-complete', c)
  if (done === 0) return motivate('day-start', c)
  if (done >= Math.ceil(target / 2)) return motivate('day-halfway', c)
  return motivate('day-progress', c)
}

/** Milestones worth a celebration: first day, 50, then 250 / 500 / 750 / 950 qualifying problems. */
export const MILESTONES = [50, 250, 500, 750, 950]
export function milestoneReached(before: number, after: number): number | null {
  return MILESTONES.find((m) => before < m && after >= m) ?? null
}
