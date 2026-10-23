import { dailyTarget, trainingDays, weekDates, weekStart, weekTarget, HOLIDAYS } from '@/data/course/calendar'
import { UNITS } from '@/data/course/units'

/** The 14 weeks as milestones (REPS_2_MASTER_SPEC.md §16, §32). Targets and days are derived from the calendar. */
export interface CurriculumWeek {
  number: number
  title: string
  short: string
  focus: string
  purpose: string
  startsOn: string
  endsOn: string
  dailyTarget: number
  targetProblems: number
  requiredTrainingDays: string[]
  plannedOffDays: { date: string; label: string; debt: false }[]
  units: string[]
  gates: string[]
  requiredLabs: string[]
  /** Week 13: no labels before an attempt. */
  unlabeled?: boolean
  /** Week 14: what it asks depends on readiness. */
  readinessAdaptive?: boolean
}

const COPY: { title: string; short: string; focus: string; purpose: string }[] = [
  { title: 'Foundations', short: 'Foundations', focus: 'State, while, mutation, references', purpose: 'Make program state, while loops, indexes, mutation and references understandable enough that later pointer work stands on solid ground.' },
  { title: 'Problem Solving', short: 'Solve Map', focus: 'Contract, examples, tests, improve', purpose: 'The bridge between knowing syntax and turning an unfamiliar prompt into code on your own.' },
  { title: 'Pointers + State', short: 'Pointers', focus: 'Two pointers, running state, prefix/suffix', purpose: 'Coordinate positions and keep only the history that future work needs.' },
  { title: 'Windows + Stacks', short: 'Windows', focus: 'Sliding window, stacks', purpose: 'Maintain a valid window as it moves; let the most recent unfinished item go first.' },
  { title: 'Search + Linked Lists', short: 'Search', focus: 'Binary search, linked lists', purpose: 'Eliminate half the region with an invariant; rewire references safely.' },
  { title: 'Recursion', short: 'Recursion', focus: 'Fast/slow pointers, recursion', purpose: 'Chains of references, then calls that pause and use the answer that comes back.' },
  { title: 'Trees', short: 'Trees', focus: 'Trees, BST', purpose: 'What a function promises about the subtree rooted at each node.' },
  { title: 'Graph Modeling', short: 'Graphs', focus: 'Tree BFS, grids, graphs', purpose: 'From queues to levels to cells to nodes and edges.' },
  { title: 'Dependencies + Heaps', short: 'Heaps', focus: 'Graph cycles, heaps', purpose: 'Order dependencies and always know the next priority item.' },
  { title: 'Intervals', short: 'Intervals', focus: 'Intervals', purpose: 'Sorting turns a global relationship into local decisions.' },
  { title: 'Backtracking + DP', short: 'DP', focus: 'Backtracking, basic DP', purpose: 'Choose, explore, undo; then remember repeated subproblems.' },
  { title: 'Consolidation', short: 'Consolidate', focus: 'DP, greedy, matrix, Tier-A cleanup', purpose: 'The last new content: consolidate, repair, and build a small AI workflow.' },
  { title: 'Independent Transfer', short: 'Transfer', focus: 'Unlabeled problems', purpose: 'No labels: choose the approach yourself and prove it on fresh problems.' },
  { title: 'Interview Execution', short: 'Interview', focus: 'Timed problems, follow-ups, mocks', purpose: 'Perform under interview conditions, gated by readiness.' },
]

export const WEEKS: CurriculumWeek[] = COPY.map((c, i) => {
  const n = i + 1
  const dates = weekDates(n)
  const units = UNITS.filter((u) => u.week === n)
  return {
    number: n,
    ...c,
    startsOn: weekStart(n),
    endsOn: dates[6],
    dailyTarget: dailyTarget(n),
    targetProblems: weekTarget(n),
    requiredTrainingDays: trainingDays(n),
    plannedOffDays: HOLIDAYS.filter((h) => dates.includes(h.date)),
    units: units.map((u) => u.id),
    gates: units.flatMap((u) => u.gateIds),
    requiredLabs: units.flatMap((u) => u.labIds),
    unlabeled: n === 13 || undefined,
    readinessAdaptive: n === 14 || undefined,
  }
})

export const WEEK_BY_NUMBER: Record<number, CurriculumWeek> = Object.fromEntries(WEEKS.map((w) => [w.number, w]))
