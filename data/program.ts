/**
 * What Reps is preparing for, what "ready" means, and the ten topic stages on
 * the way there. Copy lives here, not in JSX. Rep counts, sections and
 * capstones are never duplicated: they are derived from the curriculum
 * (data/curriculum.ts) by lib/progress.ts.
 */

export const INTERVIEW_TARGET = {
  company: 'Google',
  role: 'Software Engineering Internship',
  short: 'Google SWE',
  rounds: 2,
  minutes: 45,
  language: 'Python',
  medium: 'Google Meet',
  focus: 'Data structures & algorithms',
  /** Compact header chip, deliberately without a date. */
  chip: { full: ['Google SWE', '2×45m', 'Python'], compact: '2×45m' },
}

/** The finish line. 635 reps is training volume; this is the goal. */
export const FINISH_LINE =
  'Solve unfamiliar DS&A problems in Python from a blank editor, reason aloud, test and debug the implementation, and explain the time and space tradeoffs under interview conditions.'

/** What has to be automatic in the room. */
export const INTERVIEW_BEHAVIOURS: { id: string; label: string; detail: string }[] = [
  { id: 'clarify', label: 'Clarify', detail: 'Restate the problem, ask about inputs, constraints and edge cases.' },
  { id: 'reason', label: 'Reason', detail: 'Think aloud: brute force first when useful, then improve it.' },
  { id: 'structure', label: 'Choose structure', detail: 'Pick the data structure that makes the hard part cheap.' },
  { id: 'implement', label: 'Implement', detail: 'Write working Python from a blank editor.' },
  { id: 'test', label: 'Test', detail: 'Walk an example and the edge cases through your code.' },
  { id: 'debug', label: 'Debug', detail: 'Find and repair the failure calmly, out loud.' },
  { id: 'complexity', label: 'Complexity', detail: 'State time and space, and why.' },
  { id: 'communicate', label: 'Communicate', detail: 'Answer follow-ups and tradeoff questions clearly.' },
]

export interface ProgramStage {
  /** The curriculum day that carries this stage. */
  dayDate: string
  title: string
  shortTitle: string
  description: string
  outcomes: string[]
  /** The final stage also requires the mock interviews. */
  requiresMocks?: boolean
}

export const PROGRAM_STAGES: ProgramStage[] = [
  {
    dayDate: '2026-10-02',
    title: 'Python + Hashing',
    shortTitle: 'Hashing',
    description: 'Python recall made automatic, then sets and dicts as tools: frequency maps, index maps, complements.',
    outcomes: ['Lists, loops, range, enumerate', 'Sets and dictionaries, .get()', 'Frequency maps, index maps, complements'],
  },
  {
    dayDate: '2026-10-03',
    title: 'Strings + Two Pointers',
    shortTitle: 'Pointers',
    description: 'String indexing and slicing, then left/right pointers that scan an array in one pass.',
    outcomes: ['String iteration, indexing, slicing', 'Left/right pointers and pointer movement', 'Running min / best-so-far'],
  },
  {
    dayDate: '2026-10-04',
    title: 'Sliding Window + Stack',
    shortTitle: 'Windows',
    description: 'Windows that grow and shrink with state inside them; stacks for matching and undo.',
    outcomes: ['Moving window boundaries', 'Sets and maps inside a window', 'Stack push/pop, matching pairs'],
  },
  {
    dayDate: '2026-10-05',
    title: 'Search + Linked Lists',
    shortTitle: 'Search',
    description: 'Binary search with a clear invariant; linked lists rewired safely with references.',
    outcomes: ['Midpoint and search invariants', 'Linked-list traversal', 'Pointer reassignment, dummy head'],
  },
  {
    dayDate: '2026-10-06',
    title: 'Recursion + Trees',
    shortTitle: 'Trees',
    description: 'Base cases and recursive returns, then depth-first traversal over TreeNode.',
    outcomes: ['Base cases, recursive return', 'TreeNode, left/right children', 'DFS and recursive state'],
  },
  {
    dayDate: '2026-10-07',
    title: 'BFS + Grids',
    shortTitle: 'BFS',
    description: 'Queues with deque, level-by-level BFS, and grids with neighbours, bounds and visited state.',
    outcomes: ['deque, enqueue/dequeue', 'Level-order traversal', 'Grid neighbours, bounds, visited'],
  },
  {
    dayDate: '2026-10-08',
    title: 'Graphs',
    shortTitle: 'Graphs',
    description: 'Adjacency lists, DFS and BFS over graphs, connected components and cycle detection.',
    outcomes: ['Adjacency lists', 'Graph DFS / BFS, visited sets', 'Components and directed cycles'],
  },
  {
    dayDate: '2026-10-09',
    title: 'Heaps + Intervals',
    shortTitle: 'Heaps',
    description: 'Sorting with keys, heapq for top-k, and interval ordering with overlap reasoning.',
    outcomes: ['sorted with custom keys', 'heapq, top-k', 'Interval sorting and merging'],
  },
  {
    dayDate: '2026-10-10',
    title: 'Backtracking + Basic DP',
    shortTitle: 'Backtracking',
    description: 'Decision trees with choose/explore/un-choose, then memoization and simple recurrences.',
    outcomes: ['Recursive decision trees, path state', 'Memoization', 'Recurrences and bottom-up DP'],
  },
  {
    dayDate: '2026-10-11',
    title: 'Interview Execution',
    shortTitle: 'Interview',
    description: 'From knowing the topics to performing them: cold solves, mixed problems, edge cases, complexity, two 45-minute mocks.',
    outcomes: ['Cold, blank-editor implementations', 'Edge cases, complexity, explanation', 'Two 45-minute mock interviews'],
    requiresMocks: true,
  },
]
