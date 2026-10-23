import { trainingDays } from '@/data/course/calendar'
import { GATE_BY_ID } from '@/data/course/gates'
import { LABS } from '@/data/course/lessons'
import { UNITS } from '@/data/course/units'
import { WEEKS } from '@/data/course/weeks'

/**
 * The course's day-by-day plan (REPS_2_1_SPEC.md §5, §7): for every training
 * day, which units are taught and which checkpoints, labs and target problems
 * are due. This is what makes a day's contract explicit: "done for today" means
 * the rep target AND everything due that day.
 *
 * Curated per week in CURATED (from the spec's daily themes and the arithmetic
 * of each week's required path). A week without a curated plan falls back to
 * a derived one: units spread over the days in order, every checkpoint and
 * target on the last training day, labs mid-week and at the end.
 */

export interface DayPlan {
  date: string
  week: number
  /** The unit(s) being taught that day, in order. */
  focusUnits: string[]
  gatesDue: string[]
  labsDue: string[]
  targetsDue: number[]
  /** One line: what the day is about. */
  theme: string
}

export interface WeekPlan {
  week: number
  days: DayPlan[]
}

/** Curated weeks (filled from the Phase A curation). */
const CURATED: Record<number, Omit<DayPlan, 'week'>[]> = {
  '1': [
    {
      date: '2026-10-26',
      focusUnits: ['w1-state-while'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'State and while from first principles: state traces, the while cycle, the countdown rebuild, the state-reset and never-ending-loop debugs (spec theme).'
    },
    {
      date: '2026-10-27',
      focusUnits: ['w1-state-while', 'w1-loop-control'],
      gatesDue: [],
      labsDue: ['lab-savings-goal'],
      targetsDue: [],
      theme:
        'Controlling a loop: opens with the last while rep (halve until below k), then index walks, range, two exits and walking backward. Savings Goal Simulator (spec theme).'
    },
    {
      date: '2026-10-28',
      focusUnits: ['w1-running-state'],
      gatesDue: ['g-index-scan'],
      labsDue: [],
      targetsDue: [],
      theme: 'Running state: best so far, previous value, runs (spec theme). The index-scan gate is taken cold, the day after loop control (moved from Friday).'
    },
    {
      date: '2026-10-29',
      focusUnits: ['w1-mutation-references'],
      gatesDue: ['g-running-state'],
      labsDue: [],
      targetsDue: [],
      theme:
        'Mutation and references: aliasing, copies, changing a list in place (spec theme). The running-state gate is taken cold, the day after running state (moved from Friday).'
    },
    {
      date: '2026-10-30',
      focusUnits: ['w1-integration'],
      gatesDue: ['g-loop-control', 'g-mutation-references'],
      labsDue: ['lab-inventory'],
      targetsDue: [],
      theme:
        'Decomposition and integration after the loop-control and mutation/reference cold gates, then the Inventory Processor (spec theme, with 2 of its 4 gates).'
    }
  ],
  '2': [
    {
      date: '2026-11-02',
      focusUnits: ['w2-contract', 'w2-manual'],
      gatesDue: ['g-contract'],
      labsDue: [],
      targetsDue: [],
      theme:
        "Understand the contract: inputs, output, edge cases, examples before code, then the Contract checkpoint (the last slot opens Tuesday's hand table)"
    },
    {
      date: '2026-11-03',
      focusUnits: ['w2-manual', 'w2-testing'],
      gatesDue: ['g-decomposition'],
      labsDue: ['lab-pricing-engine'],
      targetsDue: [],
      theme: 'Solve it by hand first: hand table, subgoals, helper functions; Decomposition checkpoint; Pricing Engine lab'
    },
    {
      date: '2026-11-04',
      focusUnits: ['w2-testing', 'w2-improve'],
      gatesDue: ['g-testing'],
      labsDue: [],
      targetsDue: [],
      theme:
        'Learner-owned testing: break it at the boundary, the empty input and the tie, then write tests that catch hidden bugs; Testing checkpoint; first look at brute-force cost'
    },
    {
      date: '2026-11-05',
      focusUnits: ['w2-improve', 'w2-solve-map'],
      gatesDue: [],
      labsDue: ['lab-shipping-eligibility'],
      targetsDue: [],
      theme: 'Brute force, find the repeated work, improve it with a dict or a set; then the guided Solve Map; Shipping Eligibility lab'
    },
    {
      date: '2026-11-06',
      focusUnits: ['w2-solve-map', 'w2-hashing'],
      gatesDue: ['g-solve-map', 'g-hashing'],
      labsDue: [],
      targetsDue: [],
      theme: 'Complete an independent Solve Map, then prove hashing cold: index map, Two Sum, Solve Map and Hashing checkpoints'
    }
  ],
  '3': [
    {
      date: '2026-11-09',
      focusUnits: ['w3-two-pointers'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Trace two pointers, then choose which pointer moves'
    },
    {
      date: '2026-11-10',
      focusUnits: ['w3-two-pointers'],
      gatesDue: [],
      labsDue: ['lab-sorted-match'],
      targetsDue: [],
      theme: 'Combine pointer movement in the Sorted Match Engine'
    },
    {
      date: '2026-11-11',
      focusUnits: ['w3-two-pointers', 'w3-running-prefix'],
      gatesDue: ['g-pointer-mechanics', 'g-pointer-movement'],
      labsDue: [],
      targetsDue: [],
      theme: 'Prove pointer movement; carry the best value through a scan'
    },
    {
      date: '2026-11-12',
      focusUnits: ['w3-running-prefix'],
      gatesDue: [],
      labsDue: ['lab-trend-analyzer'],
      targetsDue: [],
      theme: 'Prefix and suffix state; build the Trend Analyzer'
    },
    {
      date: '2026-11-13',
      focusUnits: ['w3-running-prefix'],
      gatesDue: ['g-prefix-suffix'],
      labsDue: [],
      targetsDue: [],
      theme: 'Prove prefix and suffix reasoning; retrieve earlier skills'
    }
  ],
  '4': [
    {
      date: '2026-11-16',
      focusUnits: ['w4-windows'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Fixed windows: enter a value and remove the outgoing value'
    },
    {
      date: '2026-11-17',
      focusUnits: ['w4-windows'],
      gatesDue: ['g-fixed-window'],
      labsDue: ['lab-activity-window'],
      targetsDue: [],
      theme: 'Variable windows: shrink until valid; build the Activity Window Analyzer'
    },
    {
      date: '2026-11-18',
      focusUnits: ['w4-windows', 'w4-stacks'],
      gatesDue: ['g-variable-window'],
      labsDue: [],
      targetsDue: [],
      theme: 'Prove window state, then trace stack operations'
    },
    {
      date: '2026-11-19',
      focusUnits: ['w4-stacks'],
      gatesDue: [],
      labsDue: ['lab-undo-redo'],
      targetsDue: [],
      theme: 'Match nested pairs and build Editor Undo/Redo'
    },
    {
      date: '2026-11-20',
      focusUnits: ['w4-stacks'],
      gatesDue: ['g-stack'],
      labsDue: [],
      targetsDue: [],
      theme: 'Prove stack matching; retrieve windows and pointer movement'
    }
  ],
  '5': [
    {
      date: '2026-11-23',
      focusUnits: ['w5-binary-search'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Binary search as elimination: trace lo/hi/mid, write the loop, break it (lo < hi) and write the test that catches it, linear scan -> O(log n), Binary Search capstone (LC 704). Then list boundaries: insert position and its half-open lower-bound twin, first/last occurrence.'
    },
    {
      date: '2026-11-24',
      focusUnits: ['w5-binary-search', 'w5-linked-lists'],
      gatesDue: ['g-search-invariant'],
      labsDue: ['lab-product-catalog'],
      targetsDue: [],
      theme:
        'Search beyond a list (floor sqrt on the answer range, first True), then the search-invariant checkpoint and the Product Catalog lab. Then linked lists: walking nodes, names as references, for -> while node, the while node.next trap, k-th and middle value.'
    },
    {
      date: '2026-11-25',
      focusUnits: ['w5-linked-lists'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Rewiring and reversal: insert after the head, skip a node, the rewire-order bug; reversal trace -> finish -> debug -> reorder -> backwards copy; Reverse Linked List capstone (LC 206). Dummy-head intro: trace, build_list, keep evens.'
    },
    {
      date: '2026-11-26',
      focusUnits: ['w5-linked-lists'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Dummy nodes and merge: remove every x with a dummy before the head, merge two sorted Python lists, the merge-leftover bug, Merge Two Sorted Lists capstone (LC 21). 8 spare slots for repair or retrieval.'
    },
    {
      date: '2026-11-27',
      focusUnits: ['w5-linked-lists'],
      gatesDue: ['g-safe-rewiring'],
      labsDue: ['lab-playlist'],
      targetsDue: [],
      theme:
        'Integration: Playlist Editor lab (with the move-song change request) and the safe-rewiring checkpoint (cold reverse/merge/append). No new path reps; 10 spare slots for repair, retrieval or stretch.'
    }
  ],
  '6': [
    {
      date: '2026-11-30',
      focusUnits: ['w6-fast-slow'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Fast/slow: two speeds on one chain (middle in one pass, loop check)'
    },
    {
      date: '2026-12-01',
      focusUnits: ['w6-fast-slow'],
      gatesDue: [],
      labsDue: ['lab-route-walker'],
      targetsDue: [],
      theme: 'Fixed pointer gap: lead by k, trail from a dummy; then the Route Walker lab'
    },
    {
      date: '2026-12-02',
      focusUnits: ['w6-recursion'],
      gatesDue: ['g-fast-slow'],
      labsDue: [],
      targetsDue: [141],
      theme: 'Call stack: each call owns its locals and waits for a smaller call (DOWN); fast/slow checkpoint, then Linked List Cycle'
    },
    {
      date: '2026-12-03',
      focusUnits: ['w6-recursion'],
      gatesDue: [],
      labsDue: ['lab-nested-analyzer'],
      targetsDue: [],
      theme: 'Recursive returns: use what comes back (UP); then the Nested Structure Analyzer lab'
    },
    {
      date: '2026-12-04',
      focusUnits: ['w6-fast-slow', 'w6-recursion'],
      gatesDue: ['g-recursion'],
      labsDue: [],
      targetsDue: [19],
      theme: 'Integration and gates: recursion checkpoint, Remove Nth Node From End'
    }
  ],
  '7': [
    {
      date: '2026-12-07',
      focusUnits: ['w7-trees'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Tree structure: TreeNode fields, level-order lists, None children, children as references, DFS order (preorder trace and fill, depth carried down), then the first return contract (count).'
    },
    {
      date: '2026-12-08',
      focusUnits: ['w7-trees'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Subtree return contracts: what each call promises (max, leaves, contains, in-order lists, root-to-leaf sum). Max Depth capstone (LC 104) and min-depth follow-up. Recursion as an explicit stack. Pair recursion begins.'
    },
    {
      date: '2026-12-09',
      focusUnits: ['w7-trees'],
      gatesDue: [],
      labsDue: ['lab-org-hierarchy'],
      targetsDue: [],
      theme:
        'Comparing and transforming trees: Same Tree capstone (LC 100), mirror images, in place vs copy, Invert Tree capstone (LC 226), a check at every node. Organization Hierarchy Analyzer lab.'
    },
    {
      date: '2026-12-10',
      focusUnits: ['w7-bst'],
      gatesDue: ['g-tree-contract'],
      labsDue: [],
      targetsDue: [],
      theme: 'Checkpoint first: Tree contract (2 cold variants) unlocks BSTs. Then BST ordering, one-way search, floor, split point, bounds and validation.'
    },
    {
      date: '2026-12-11',
      focusUnits: ['w7-bst'],
      gatesDue: [],
      labsDue: ['lab-category-tree'],
      targetsDue: [235],
      theme:
        'In-order on a BST (nonlocal counter, k-th largest). LCA of a BST (LC 235). Searchable Category Tree lab. Validate BST, Kth Smallest and Subtree of Another Tree only if readiness is clean.'
    }
  ],
  '8': [
    {
      date: '2026-12-14',
      focusUnits: ['w8-queue-bfs'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Queue + tree BFS: deque mechanics, BFS by level, Level Order (LC 102 via cap-level-order)'
    },
    {
      date: '2026-12-15',
      focusUnits: ['w8-grids'],
      gatesDue: ['g-queue'],
      labsDue: [],
      targetsDue: [],
      theme: 'Grid modeling: rows and columns, (r, c) cells, neighbors and bounds. Starts with the g-queue checkpoint, which unlocks grids'
    },
    {
      date: '2026-12-16',
      focusUnits: ['w8-grids'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Visited + grid BFS/DFS: mark on enqueue, distances, flood fill, multi-source BFS, DFS, Number of Islands (LC 200 via cap-number-of-islands)'
    },
    {
      date: '2026-12-17',
      focusUnits: ['w8-graphs'],
      gatesDue: ['g-grid'],
      labsDue: ['lab-evacuation-map'],
      targetsDue: [],
      theme:
        'Graph representation and DFS: edge list and matrix to adjacency, directed vs undirected, recursive and stack DFS. Grid close-out: the g-grid checkpoint (unlocks graphs) and the Evacuation Map lab'
    },
    {
      date: '2026-12-18',
      focusUnits: ['w8-graphs'],
      gatesDue: ['g-graph-traversal'],
      labsDue: ['lab-social-network'],
      targetsDue: [],
      theme:
        'Reachability + connected components: graph BFS distances, Path Exists (LC 1971 via cap-path-exists), components. Social Network lab, then the g-graph-traversal checkpoint'
    }
  ],
  '9': [
    {
      date: '2026-12-21',
      focusUnits: ['w9-cycles', 'w9-heaps'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Dependency modeling and directed cycles: all 7 w9-cycles path reps (UNSEEN/VISITING/DONE trace, has_cycle, debug, naive-detector break, reachable cycle, Course Schedule capstone, Kahn), then the first 5 w9-heaps sorting reps (returns-none trace through group-anagrams)'
    },
    {
      date: '2026-12-22',
      focusUnits: ['w9-heaps'],
      gatesDue: ['g-directed-cycle'],
      labsDue: [],
      targetsDue: [],
      theme: 'Directed-cycle checkpoint (Course Schedule solved yesterday in Reps), then sort keys (7) and frequency + sort (3)'
    },
    {
      date: '2026-12-23',
      focusUnits: ['w9-heaps'],
      gatesDue: [],
      labsDue: ['lab-dependency-planner'],
      targetsDue: [],
      theme:
        'Topological ordering applied in the Dependency Planner lab, plus heap foundations: heapq (5), max-heap by negation (4), and the top-k opening (size-k trace, sorting baseline, optimize to heap)'
    },
    {
      date: '2026-12-24',
      focusUnits: ['w9-heaps'],
      gatesDue: ['g-heap'],
      labsDue: [],
      targetsDue: [],
      theme: 'Top-k: no-trim debug, keys-by-count combine, the Kth Largest and Top K Frequent capstones, then the heap-invariant checkpoint'
    }
  ],
  '10': [
    {
      date: '2026-12-28',
      focusUnits: ['w10-intervals'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Overlap + merge: path reps 1-12 (overlap test, intersection, merge trace, merge sorted, overwrite-end debug, can-attend, unsorted debug, write-test, first-clash, cap-merge-intervals = LC 56, touching follow-up, one-oven pattern)'
    },
    {
      date: '2026-12-29',
      focusUnits: ['w10-intervals'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Insert (path reps 13-16, br-57), then light interval greedy pulled forward (path reps 17-20, br-435). The unit path finishes today.'
    },
    {
      date: '2026-12-30',
      focusUnits: ['w10-intervals'],
      gatesDue: ['g-intervals'],
      labsDue: ['lab-calendar-conflicts'],
      targetsDue: [],
      theme:
        'Ordering + mixed interval transfer: the g-intervals checkpoint (need 2) and the Calendar Conflict Engine lab. The rest of the day is retrieval (d9-cold), optional br-253 (toward Meeting Rooms II) and repair.'
    }
  ],
  '11': [
    {
      date: '2027-01-04',
      focusUnits: ['w11-backtracking'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Reversible state: decision trees, then the shared path, choose/explore/undo, and the copy and pop bugs (path reps 1-12)'
    },
    {
      date: '2027-01-05',
      focusUnits: ['w11-backtracking', 'w11-dp'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Subsets and constrained choices: permutations, subsets, cap-subsets (LC78) and Toward Combination Sum; ends with the first DP recurrence traces (path reps 13-24)'
    },
    {
      date: '2027-01-06',
      focusUnits: ['w11-dp'],
      gatesDue: ['g-backtracking'],
      labsDue: ['lab-package-configurator'],
      targetsDue: [],
      theme:
        'Memoization through repeated subproblems: recurrence debug, the whole memo ladder, first bottom-up table; backtracking checkpoint and Package Configurator lab (path reps 25-34)'
    },
    {
      date: '2027-01-07',
      focusUnits: ['w11-dp'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Bottom-up to House Robber: cap-climbing-stairs (LC70), then rolling state and take-or-skip, memo and table (path reps 35-46)'
    },
    {
      date: '2027-01-08',
      focusUnits: ['w11-dp'],
      gatesDue: ['g-dp'],
      labsDue: ['lab-minimum-cost'],
      targetsDue: [],
      theme:
        'Minimum-choice DP and gates: finish House Robber (cap-house-robber, LC198), cheapest climb, DP checkpoint, Minimum-Cost Plan lab (path reps 47-49)'
    }
  ],
  '12': [
    {
      date: '2027-01-11',
      focusUnits: ['w12-dp-greedy'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: "DP consolidation (min-choice DP), then running state and greedy. All 12 dp-greedy path reps fit today's capacity of 12."
    },
    {
      date: '2027-01-12',
      focusUnits: ['w12-dp-greedy', 'w12-matrix-tries'],
      gatesDue: ['g-dp-greedy'],
      labsDue: [],
      targetsDue: [53, 55],
      theme: 'Greedy and running state: DP/greedy checkpoint, then Maximum Subarray and Jump Game outside; begin matrix transforms'
    },
    {
      date: '2027-01-13',
      focusUnits: ['w12-matrix-tries'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Matrix mechanics: edges, spiral fill, mark-then-change; begin tries'
    },
    {
      date: '2027-01-14',
      focusUnits: ['w12-matrix-tries'],
      gatesDue: [],
      labsDue: ['lab-support-router'],
      targetsDue: [322],
      theme: 'Tries finished; adaptive Tier-A repair (Coin Change) and the first AI/FDE build (Support Router)'
    },
    {
      date: '2027-01-15',
      focusUnits: ['w12-matrix-tries'],
      gatesDue: ['g-matrix'],
      targetsDue: [54, 208],
      labsDue: [],
      theme:
        'Final curriculum gates and unlabeled selection: matrix checkpoint, Spiral Matrix, Implement Trie, and o11-name-it / tr-check retrieval in the slack'
    }
  ],
  '13': [
    {
      date: '2027-01-19',
      focusUnits: ['w13-transfer'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Unlabeled transfer I (after MLK): path reps 1-12. Easier mix of hashing, state, two pointers, stack, window, recursion, linked list, set and intervals. Test-writing: t-12. Full problems: t-06, t-23. Plus 2 cold retrieval + 1 wildcard from the allowance.'
    },
    {
      date: '2027-01-20',
      focusUnits: ['w13-transfer'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Unlabeled transfer II: path reps 13-24. Opens with state + while (t-17, a known weak area), then merge, prefix, monotonic stack, fast/slow, tree DFS, components, DP, matrix. Debug: t-04, t-20. Full problems: t-10, t-35. FDE Customer Workflow build starts.'
    },
    {
      date: '2027-01-21',
      focusUnits: ['w13-transfer'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Unlabeled transfer III: path reps 25-36. Binary search, brackets, grouping, window, linked list, grid BFS, heap, backtracking, greedy. Debug: t-36. Full problems: t-14, t-19. FDE build continues with its mid-build requirement change.'
    },
    {
      date: '2027-01-22',
      focusUnits: ['w13-transfer'],
      gatesDue: [],
      labsDue: ['lab-fde-workflow'],
      targetsDue: [],
      theme:
        'Unlabeled transfer IV: path reps 37-48. Index map, top-k, binary search on the answer, tree BFS, topo/cycle, graph-is-tree, grid DP. Test/debug: t-43, t-27. Full problems: t-29, t-41. FDE Customer Workflow due. Final GREEN/YELLOW/RED state decided.'
    }
  ],
  '14': [
    {
      date: '2027-01-25',
      focusUnits: ['w14-interview'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Generous-timer full problems: speed-round warm-up (9) + cold Two Sum, Valid Parentheses, Reverse Linked List (path #1-12, ~57 min)'
    },
    {
      date: '2027-01-26',
      focusUnits: ['w14-interview'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Timed singles: cold Longest Substring, Merge Intervals, Top-K Frequent, House Robber, Subsets + mixed patterns nearby-repeat..k-closest (path #13-24, ~106 min)'
    },
    {
      date: '2027-01-27',
      focusUnits: ['w14-interview'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Timed singles and follow-ups: cold Islands, Level Order, Course Schedule + follow-up variants (groups, cheapest climb, choose k, fewest steps) + first 5 debug reps; project/system explanation off-path (path #25-36, ~102 min)'
    },
    {
      date: '2027-01-28',
      focusUnits: ['w14-interview'],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme: 'Mock #1 -> diagnose -> repair: last 6 debug-sprint reps (path #37-42, ~18 min) plus the mock (readiness-gated, off-path)'
    },
    {
      date: '2027-01-29',
      focusUnits: [],
      gatesDue: [],
      labsDue: [],
      targetsDue: [],
      theme:
        'Mock #2 + final readiness status (READY / READY WITH TARGETED GAPS / NOT YET READY); no path reps, allowance used for targeted repair and re-solves'
    }
  ]
}

function derived(week: number): DayPlan[] {
  const days = trainingDays(week)
  const units = UNITS.filter((u) => u.week === week)
  const labs = LABS.filter((l) => l.week === week && !l.optional)
  const last = days.length - 1
  return days.map((date, i) => {
    // Units in order, spread evenly over the days.
    const focusUnits = units.filter((_, k) => Math.min(last, Math.floor((k * days.length) / Math.max(1, units.length))) === i).map((u) => u.id)
    const carry = focusUnits.length ? focusUnits : [units[Math.min(units.length - 1, Math.floor((i * units.length) / days.length))]?.id].filter(Boolean)
    return {
      date,
      week,
      focusUnits: carry as string[],
      gatesDue: i === last ? units.flatMap((u) => u.gateIds).filter((g) => GATE_BY_ID[g]) : [],
      labsDue: labs.filter((_, k) => (labs.length === 1 ? last : k === 0 ? Math.max(0, Math.floor(last / 2)) : last) === i).map((l) => l.id),
      targetsDue: i === last ? units.flatMap((u) => u.targets) : [],
      theme: (carry as string[]).map((id) => UNITS.find((u) => u.id === id)?.title ?? id).join(' + ')
    }
  })
}

export const SCHEDULE: WeekPlan[] = WEEKS.map((w) => ({
  week: w.number,
  days: CURATED[w.number] ? CURATED[w.number].map((d) => ({ ...d, week: w.number })) : derived(w.number)
}))

export const DAY_PLAN: Record<string, DayPlan> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.map((d) => [d.date, d])))

/** When each checkpoint, lab and target is due (the first scheduled day). */
export const GATE_DUE: Record<string, string> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.flatMap((d) => d.gatesDue.map((g) => [g, d.date] as const))))
export const LAB_DUE: Record<string, string> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.flatMap((d) => d.labsDue.map((l) => [l, d.date] as const))))
export const TARGET_DUE: Record<number, string> = Object.fromEntries(
  SCHEDULE.flatMap((w) => w.days.flatMap((d) => d.targetsDue.map((lc) => [lc, d.date] as const)))
)
