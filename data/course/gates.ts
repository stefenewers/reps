import type { SkillId } from '@/lib/types'

/**
 * Hard prerequisite gates (REPS_2_MASTER_SPEC.md §12). A gate is a cold
 * checkpoint: no lesson panel, no solution, no named technique. It is cleared
 * by `need` clean passes of different reps from its pool (equivalent variants).
 *
 * A failed gate is diagnostic: the smallest broken skill gets 2–4 repair reps,
 * then a different variant from the pool. The exact failed rep is not replayed
 * next. Units that list the gate's unit as a prerequisite stay locked until it
 * is cleared; the calendar never overrides that.
 *
 * Pools reference existing cold reps where the October modules have them, and
 * course reps (data/exercises/course) where they did not.
 */

export interface MasteryGate {
  id: string
  title: string
  unitId: string
  /** What the gate proves, in one line. */
  proves: string
  /** Equivalent cold variants. */
  pool: string[]
  /** Clean passes of different variants needed to clear it. */
  need: number
  /** Skills it checks: repairs target the ones a failure touched. */
  skills: SkillId[]
}

export const GATES: MasteryGate[] = [
  // Week 1
  { id: 'g-loop-control', title: 'Loop control', unitId: 'w1-loop-control', proves: 'You can write a loop that stops at the right time and changes the right state.', pool: ['c1-g-countdown-steps', 'c1-g-until-total', 'c1-g-double-until', 'c1-g-halve-count'], need: 2, skills: ['while_loop', 'state_tracking'] },
  { id: 'g-index-scan', title: 'Index scan', unitId: 'w1-loop-control', proves: 'You can walk a list by index and stop at the right place.', pool: ['c1-g-first-over', 'c1-g-last-even-index', 'c1-g-count-before-stop', 'c1-g-index-of-max'], need: 2, skills: ['while_loop', 'list_index', 'range'] },
  { id: 'g-running-state', title: 'Running state', unitId: 'w1-running-state', proves: 'You can carry a best-so-far, a count or a previous value through one pass.', pool: ['c1-g-longest-rise', 'c1-g-max-gap', 'c1-g-new-lows', 'c1-g-streak-of'], need: 2, skills: ['state_tracking', 'accumulator'] },
  { id: 'g-mutation-references', title: 'Mutation and references', unitId: 'w1-mutation-references', proves: 'You know when two names share one list, and you can change a list in place on purpose.', pool: ['c1-g-alias-trace', 'c1-g-remove-in-place', 'c1-g-copy-not-alias', 'c1-g-swap-ends'], need: 2, skills: ['list_append', 'functions', 'list_index'] },
  // Week 2
  { id: 'g-contract', title: 'Contract', unitId: 'w2-contract', proves: 'You can state inputs, output and edge cases before writing code.', pool: ['c2-g-contract-a', 'c2-g-contract-b', 'c2-g-contract-c', 'c2-g-contract-d'], need: 2, skills: ['edge_cases', 'explanation'] },
  { id: 'g-decomposition', title: 'Decomposition', unitId: 'w2-manual', proves: 'You can turn a hand-worked example into subgoals and code.', pool: ['c2-g-decompose-a', 'c2-g-decompose-b', 'c2-g-decompose-c', 'c2-g-decompose-d'], need: 2, skills: ['functions', 'conditionals'] },
  { id: 'g-testing', title: 'Testing', unitId: 'w2-testing', proves: 'You can pick the inputs that would break a function.', pool: ['c2-g-test-a', 'c2-g-test-b', 'c2-g-test-c', 'c2-g-test-d'], need: 2, skills: ['edge_cases'] },
  { id: 'g-solve-map', title: 'Solve Map', unitId: 'w2-solve-map', proves: 'You can take an unfamiliar prompt from contract to verified code on your own.', pool: ['c2-g-solve-a', 'c2-g-solve-b', 'c2-g-solve-c', 'c2-g-solve-d'], need: 2, skills: ['complexity', 'edge_cases'] },
  { id: 'g-hashing', title: 'Hashing', unitId: 'w2-hashing', proves: 'Sets and dictionaries, cold: counting, positions and complements.', pool: ['o2-cold-letter-counts', 'o2-cold-tally', 'o2-cold-first-index', 'o2-cold-last-index', 'o2-cold-has-repeat', 'o2-cold-over-k', 'o2-cold-anagram', 'o2-cold-two-sum'], need: 3, skills: ['frequency_map', 'index_map', 'set_membership', 'complement'] },
  // Week 3
  { id: 'g-pointer-mechanics', title: 'Pointer mechanics', unitId: 'w3-two-pointers', proves: 'Two indexes that move toward each other, cold.', pool: ['d3-cold-pair-exists', 'd3-cold-letter-pal', 'c3-g-pointer-a', 'c3-g-pointer-b'], need: 2, skills: ['two_pointer', 'pointer_update'] },
  { id: 'g-pointer-movement', title: 'Pointer movement', unitId: 'w3-two-pointers', proves: 'You can say which pointer moves and why the discarded region cannot hold the answer.', pool: ['c3-g-movement-a', 'c3-g-movement-b', 'c3-g-movement-c'], need: 2, skills: ['pointer_update', 'two_pointer'] },
  { id: 'g-prefix-suffix', title: 'Prefix and suffix', unitId: 'w3-running-prefix', proves: 'You can precompute left and right summaries and combine them.', pool: ['c3-g-prefix-a', 'c3-g-prefix-b', 'c3-g-prefix-c', 'd3-cold-sell-today'], need: 2, skills: ['prefix_suffix', 'state_tracking'] },
  // Week 4
  { id: 'g-fixed-window', title: 'Fixed window', unitId: 'w4-windows', proves: 'A window of fixed size, updated at both edges.', pool: ['d4w-ck-quietest-start', 'd4-cold-avg-window'], need: 1, skills: ['sliding_window', 'state_tracking'] },
  { id: 'g-variable-window', title: 'Variable window', unitId: 'w4-windows', proves: 'Enter, repair while invalid, measure.', pool: ['d4w-ck-few-misses', 'd4w-ck-shortest-reaching', 'd4w-ck-all-different', 'd4w-ck-fresh-streak', 'd4-cold-longest-unique', 'd4-cold-shortest'], need: 2, skills: ['sliding_window', 'window_state'] },
  { id: 'g-stack', title: 'Stack', unitId: 'w4-stacks', proves: 'The most recent unfinished item, first.', pool: ['d4-cold-valid', 'd4-cold-backspace-equal'], need: 1, skills: ['stack_push_pop', 'matching_pairs'] },
  // Week 5
  { id: 'g-search-invariant', title: 'Search invariant', unitId: 'w5-binary-search', proves: 'The answer is still inside the region, every step.', pool: ['d05s-ck-page-of', 'd05s-ck-count-below', 'd05s-ck-last-affordable', 'd05s-ck-staircase', 'd05-cold-index-of', 'd05-cold-first-at-least'], need: 2, skills: ['binary_search', 'search_invariant'] },
  { id: 'g-safe-rewiring', title: 'Safe rewiring', unitId: 'w5-linked-lists', proves: 'Save what you still need, change the reference, advance.', pool: ['d05-cold-reverse', 'd05-cold-merge', 'd05-cold-append'], need: 2, skills: ['linked_list_reassignment', 'dummy_node'] },
  // Week 6
  { id: 'g-fast-slow', title: 'Fast and slow', unitId: 'w6-fast-slow', proves: 'Two speeds on one chain.', pool: ['c6-g-fast-slow-a', 'c6-g-fast-slow-b', 'c6-g-fast-slow-c'], need: 2, skills: ['fast_slow'] },
  { id: 'g-recursion', title: 'Recursion', unitId: 'w6-recursion', proves: 'Base case, smaller call, use what comes back.', pool: ['d06-cold-digits', 'c6-g-recursion-a', 'c6-g-recursion-b', 'c6-g-recursion-c'], need: 2, skills: ['recursion_base_case', 'recursion_return'] },
  // Week 7
  { id: 'g-tree-contract', title: 'Tree contract', unitId: 'w7-trees', proves: 'What the function promises about each subtree.', pool: ['d06-cold-tree-sum', 'd06-cold-height', 'd06-cold-same', 'd06-cold-mirror', 'd06-cold-postorder'], need: 2, skills: ['tree_dfs', 'recursion_return'] },
  // Week 8
  { id: 'g-queue', title: 'Queue', unitId: 'w8-queue-bfs', proves: 'First in, first out, one level at a time.', pool: ['o7-c-last-level', 'c8-g-queue-a', 'c8-g-queue-b'], need: 2, skills: ['queue_deque', 'bfs_levels'] },
  { id: 'g-grid', title: 'Grid traversal', unitId: 'w8-grids', proves: 'Cells as nodes, neighbours as edges, visited.', pool: ['o7-c-blobs', 'o8-cold-grid-steps', 'o7-c-neighbors'], need: 2, skills: ['grid_neighbors', 'visited_set'] },
  { id: 'g-graph-traversal', title: 'Graph traversal', unitId: 'w8-graphs', proves: 'Model it, then reach everything reachable once.', pool: ['o8-cold-build', 'o8-cold-components', 'c8-g-graph-a'], need: 2, skills: ['graph_adjacency', 'graph_dfs', 'connected_components'] },
  // Week 9
  { id: 'g-directed-cycle', title: 'Directed cycle', unitId: 'w9-cycles', proves: 'Unseen, visiting, done.', pool: ['o8-cold-cycle', 'c9-g-cycle-a', 'c9-g-cycle-b'], need: 2, skills: ['cycle_detection'] },
  { id: 'g-heap', title: 'Heap invariant', unitId: 'w9-heaps', proves: 'The heap holds the best k so far.', pool: ['d9h-c-cheapest-first', 'd9h-c-rank-teams', 'd9h-c-under-limit', 'd9h-c-k-tallest', 'd9h-c-busiest-hours', 'd9-cold-kth-smallest', 'd9-cold-last-rock'], need: 2, skills: ['heap_push_pop', 'top_k', 'sort_key'] },
  // Week 10
  { id: 'g-intervals', title: 'Intervals', unitId: 'w10-intervals', proves: 'Sort, then decide locally: overlap, merge, insert.', pool: ['d9-cold-any-overlap', 'c10-g-interval-a', 'c10-g-interval-b'], need: 2, skills: ['interval_overlap', 'interval_insert'] },
  // Week 11
  { id: 'g-backtracking', title: 'Backtracking', unitId: 'w11-backtracking', proves: 'Choose, explore, undo.', pool: ['d10b-step-plans', 'd10b-selections', 'd10b-seatings', 'd10b-quiet-codes', 'd10-cold-letter-subsets', 'd10-cold-pick-k'], need: 2, skills: ['backtracking_state'] },
  { id: 'g-dp', title: 'DP state and recurrence', unitId: 'w11-dp', proves: 'State, base, recurrence, order.', pool: ['d10-cold-pieces', 'd10-cold-cache-stairs', 'c11-g-dp-a'], need: 2, skills: ['recurrence', 'memoization', 'dp_table'] },
  // Week 12
  { id: 'g-dp-greedy', title: 'DP and greedy', unitId: 'w12-dp-greedy', proves: 'Pick DP or a running best, and say why.', pool: ['c12-g-dp-greedy-a', 'c12-g-dp-greedy-b', 'c12-g-dp-greedy-c'], need: 2, skills: ['dp_min_choice', 'kadane', 'greedy_reach'] },
  { id: 'g-matrix', title: 'Matrix mechanics', unitId: 'w12-matrix-tries', proves: 'Transpose, layers and markers without losing a cell.', pool: ['mx-c-swap-axes', 'mx-c-half-turn', 'mx-c-frame', 'mx-c-warm-up'], need: 2, skills: ['matrix_transform', 'matrix_layers', 'matrix_marking'] },
]

export const GATE_BY_ID: Record<string, MasteryGate> = Object.fromEntries(GATES.map((g) => [g.id, g]))

/** Every rep that is a gate variant, with its gate. */
export const GATE_OF_EXERCISE: Record<string, string> = Object.fromEntries(GATES.flatMap((g) => g.pool.map((id) => [id, g.id] as const)))
