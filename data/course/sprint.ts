/**
 * The Sprint (Nov 16–30) and Prep (from Dec 1): a date-gated overlay on the
 * 14-week course. Static data only; everything about the learner is still
 * derived from attempts. Before SPRINT_START nothing here applies, so every
 * earlier day keeps its old plan, targets and scoring.
 *
 * - Sprint: finish the must-know material for mid-size, startup, enterprise and
 *   AI-company interviews. Weeks 1–3 are done and come back only as review.
 * - Big-tech pack: deferred, never deleted. Optional from SPRINT_START; any
 *   progress on it still counts.
 * - Prep: interview mode from PREP_START, independent of weeks 6–13.
 *
 * This file must not import the calendar (the calendar imports it).
 */

export const SPRINT_START = '2026-11-16'
export const SPRINT_END = '2026-11-30'
export const PREP_START = '2026-12-01'
/** Mocks open in Prep from this date, on ready units only. */
export const MOCKS_FROM = '2026-12-07'
/** Behind-by spill-over lands in Prep's first week. */
export const SPILL_END = '2026-12-05'

/** Sprint rest on top of Sundays (Thanksgiving); SPRINT_TRAINING_SUNDAYS are the exception. Saturdays in the sprint are lighter training days. */
export const SPRINT_REST: { date: string; label: string }[] = [
  { date: '2026-11-26', label: 'Thanksgiving' },
  { date: '2026-11-27', label: 'Day after Thanksgiving' },
]

/** Sprint Sundays turned into full training days (Nov 17 and Nov 19 were missed): the rest of the sprint fits by Nov 30. */
export const SPRINT_TRAINING_SUNDAYS: { date: string; label: string }[] = [
  { date: '2026-11-22', label: 'Make-up Sunday' },
  { date: '2026-11-29', label: 'Make-up Sunday' },
]

/** Sprint days planned as doubles (a missed day made up the next day): on by default, the learner can turn one back to a single day. */
export const SPRINT_DOUBLE_DAYS: { date: string; makesUp: string }[] = [{ date: '2026-11-18', makesUp: '2026-11-17' }]

/** Prep rest on top of Sundays. Saturdays are Prep training days (format practice rotates Mon–Sat). */
export const PREP_REST: { date: string; label: string }[] = [
  { date: '2026-12-24', label: 'Christmas Eve' },
  { date: '2026-12-25', label: 'Christmas Day' },
  { date: '2026-12-26', label: 'Boxing Day' },
  { date: '2026-12-31', label: 'New Year’s Eve' },
  { date: '2027-01-01', label: 'New Year’s Day' },
]

export const inSprint = (date: string) => date >= SPRINT_START && date <= SPRINT_END
export const inPrep = (date: string) => date >= PREP_START

/** Sprint and Prep weekday target bounds; Saturdays get about 60% of the day's number. */
export const SPRINT_FLOOR = 20
export const SPRINT_CAP = 24
export const SATURDAY_SHARE = 0.6
/** Review-queue items worked into each training day, before new work. */
export const REVIEW_PER_DAY = 4

/** The must-know units, in sprint order (existing ids unless marked new). */
export const SPRINT_UNITS = [
  'w4-windows',
  'w4-stacks',
  'w9-heaps',
  'w10-intervals',
  's-design-class', // new
  'w5-binary-search',
  'w5-linked-lists',
  's-queue-basics', // new
  'w8-grids',
  's-course-schedule', // new
] as const

/** Units that exist only from SPRINT_START (new ids; absent from every earlier day's status). */
export const SPRINT_ONLY_UNITS = ['s-design-class', 's-queue-basics', 's-course-schedule'] as const

/**
 * Sprint paths for long units: a subset of the existing path ids, in learning order
 * (trace → write → debug → capstone). units.ts `path` is untouched; the rest of the unit
 * becomes optional inventory during the sprint.
 */
export const SPRINT_PATHS: Record<string, string[]> = {
  // Sorting with key= first: sorting is a weak skill and intervals and top-K stand on it.
  'w9-heaps': [
    'd9-sort-returns-none',
    'd9-sort-inplace-desc',
    'd9-sort-tuples',
    'd9-key-len-stable',
    'd9-key-len-then-alpha',
    'd9-key-records',
    'd9-key-dbg-reverse-ties',
    'd9-key-dict-by-value',
    'd9-freq-topk-by-sort',
    'd9-heap-push-trace',
    'd9-heap-smallest-k',
    'd9-heap-dbg-slice',
    'd9-maxheap-trace',
    'd9-maxheap-k-largest-desc',
    'd9-topk-trace',
    'd9-topk-optimize',
    'd9-topk-keys-by-count',
    'cap-top-k-frequent',
  ],
  'w10-intervals': [
    'd9-iv-overlaps-line',
    'd9-iv-intersection',
    'd9-iv-merge-trace',
    'd9-iv-merge-sorted',
    'd9-iv-dbg-overwrite-end',
    'd9-iv-can-attend',
    'd9-iv-dbg-unsorted',
    'b252-first-clash',
    'cap-merge-intervals',
    'b57-before-after',
    'b57-absorb',
    'b435-keep-talks',
    'b435-dbg-sort-start',
    'b435-refused-mini',
  ],
  // Light: reverse, merge two sorted, remove from the end, cycle check.
  'w5-linked-lists': [
    'd05-ll-walk',
    'd05-ll-to-array',
    'd05-rw-reverse-trace',
    'd05-rw-finish-reverse',
    'd05-rw-dbg-lose-next',
    'cap-reverse-linked-list',
    'd05-dummy-trace',
    'd05-dummy-dbg-leftover',
    'cap-merge-two-lists',
    'b19-kth-from-end',
    'b19-dbg-chop',
    'b141-jump-loop',
  ],
  // BFS first: islands, multi-source, shortest path. The DFS stack translation stays (explicit stack, no recursion);
  // o7-i-sink-dfs is optional inventory.
  'w8-grids': [
    'o7-g-trace-dims',
    'o7-g-find-all',
    'o7-n-trace',
    'o7-n-list',
    'o7-n-dbg-bounds',
    'o7-n-land',
    'o7-v-trace-order',
    'o7-v-finish',
    'o7-v-dbg-late-mark',
    'o7-v-shortest',
    'o7-v-flood-fill',
    'o7-v-multi-source',
    'o7-v-dfs-stack',
    'cap-number-of-islands',
    'o7-i-dbg-count-every',
    'o7-i-max-area',
  ],
}

/** From SPRINT_START only: prerequisites that replace units.ts for these units. */
export const SPRINT_PREREQS: Record<string, string[]> = {
  'w8-grids': ['s-queue-basics'],
  's-course-schedule': ['s-queue-basics', 'w2-hashing'],
  's-design-class': ['w2-hashing'],
  's-queue-basics': ['w1-loop-control'],
  'w10-intervals': ['w9-heaps'],
}

/** From SPRINT_START only: the lab each sprint unit owns, where it differs from units.ts. */
export const SPRINT_LABS: Record<string, string[]> = {
  'w5-linked-lists': [], // lab-playlist is optional in the sprint
  's-design-class': ['lab-bank-system'],
  's-course-schedule': ['lab-dependency-planner'],
}

/** Deferred, kept: only for an Amazon/Microsoft/Meta/Bloomberg-style interview. Never required from SPRINT_START. */
export const BIG_TECH_PACK = [
  'w6-fast-slow',
  'w6-recursion',
  'w7-trees',
  'w7-bst',
  'w8-queue-bfs',
  'w8-graphs',
  'w9-cycles',
  'w11-backtracking',
  'w12-matrix-tries',
] as const
/** The 2D-DP parts of w11-dp / w12-dp-greedy: big-tech pack as well (reps, not whole units). */
export const BIG_TECH_DP_REPS = ['d10-rec-grid-paths', 'd10-memo-grid', 'd10-memo-dbg-key']
export const BIG_TECH_LABEL = 'Big-tech pack (only if you get a big-tech interview)'

/**
 * 1D DP only, required in Prep (3 a day in the week of Dec 14): climbing stairs and house robber from
 * w11-dp's path, Kadane and coin change from w12-dp-greedy's path (where those reps live).
 */
export const DP_LIGHT = [
  'd10-bu-trace',
  'd10-bu-three-steps',
  'cap-climbing-stairs',
  'd10-roll-trace',
  'd10-roll-fib',
  'd10-roll-robber-trace',
  'd10-roll-robber-table',
  'cap-house-robber',
  'b53-trace-ending',
  'b53-ending-sums',
  'b53-worst-stretch',
  'b322-trace-inf',
  'b322-makeable',
  'b322-fewest-each',
]
export const DP_WEEK = { from: '2026-12-14', to: '2026-12-19', perDay: 3 }

/** Weak and sprint-relevant skills: their review items come right after `shaky` ones. */
export const SPRINT_SKILLS = ['sorting', 'tuples', 'complement', 'grouping_key', 'sequence_start', 'prefix_suffix', 'two_pointer', 'hash_reasoning', 'frequency_map', 'index_map']

/** Saturday redo: one unaided outside solve of each until it has one. */
export const SATURDAY_REDOS = [
  { lc: 49, title: 'Group Anagrams' },
  { lc: 128, title: 'Longest Consecutive Sequence' },
]

/** Lowest priority first: what spills into Dec 1–5 when the sprint cannot hold everything. */
export const SPILL_ORDER = ['w5-linked-lists', 'w5-binary-search']

/** Which units each mock draws on. A mock opens in Prep (from MOCKS_FROM) only when all of them are ready. */
export const MOCK_UNITS: Record<string, string[]> = {
  'mock-1': ['w2-hashing', 'w8-grids'],
  'mock-2': ['w4-stacks', 'w7-trees', 'w11-backtracking'],
}

export const isBigTech = (unitId: string) => (BIG_TECH_PACK as readonly string[]).includes(unitId)
export const isSprintUnit = (unitId: string) => (SPRINT_UNITS as readonly string[]).includes(unitId)

/** The goal from Nov 16: interviews in January, an offer by Jan 31, Feb 28 the hard cutoff. */
export const OFFER_GOAL = '2027-01-31'
export const HARD_CUTOFF = '2027-02-28'

/**
 * From SPRINT_START, Applied / design lessons whose old unit is in the big-tech pack are taught with a sprint unit
 * instead, so nothing a sprint lab relies on is stranded. The model-facing lessons move to Prep's AI ramp.
 */
export const SPRINT_APPLIED: Record<string, string> = {
  'ae-reliability': 'w10-intervals',
  'sd-auth-permissions': 's-design-class',
  'ae-observability': 'w8-grids',
  'sd-production-awareness': 's-course-schedule',
}
/** Lessons Prep's AI ramp teaches (lib/course/prep-plan.ts AI_RAMP). */
export const PREP_LESSONS = ['ae-discovery', 'ae-model-boundary', 'ae-tools-workflows', 'ae-retrieval', 'ae-evals']

/** What the countdown counts toward on a date: the Feb 1 checkpoint before the Sprint, then the Jan 31 offer goal, then the Feb 28 cutoff. */
export function goalOn(date: string): { date: string; label: string; short: string } {
  if (date < SPRINT_START) return { date: '2027-02-01', label: 'February 1', short: 'Feb 1' }
  if (date <= OFFER_GOAL) return { date: OFFER_GOAL, label: 'an offer by Jan 31', short: 'the Jan 31 offer goal' }
  return { date: HARD_CUTOFF, label: 'the Feb 28 cutoff', short: 'the Feb 28 cutoff' }
}
