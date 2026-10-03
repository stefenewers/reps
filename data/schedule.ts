/**
 * The calendar plan: which sections of the authored topic modules are done on
 * which day. Re-planned on Oct 2 evening from real progress and pace:
 *
 * - Oct 2 is closed out with what was actually completed (Python recall,
 *   Loops & range). Practice resumes Oct 3 at enumerate, in the original order.
 * - Remaining required sections are split contiguously across Oct 3 – Oct 10
 *   so no day is heavier than it has to be (~285–335 planned minutes each,
 *   roughly 5–5.6 h; aggressive at the measured ~1.5–2× pace, not fantasy).
 * - Oct 11 stays Interview Execution, lighter, with both 45-minute mocks.
 *
 * Nothing is deleted. Reps outside the required plan become Extra reps on the
 * day they belong to (see OPTIONAL rules in data/curriculum.ts):
 * module warm-ups and end-of-module cold reps (the spaced review queue already
 * resurfaces those skills as cold reps), capstone explain reps, and variants
 * after a section's last capstone. Capstones themselves are always required.
 *
 * Frozen on purpose: editing a module later must not silently reshuffle days.
 */

export const SCHEDULE: { date: string; sections: string[] }[] = [
  { date: '2026-10-02', sections: ['o2-python-recall', 'o2-loops'] },
  {
    date: '2026-10-03',
    sections: ['o2-enumerate', 'o2-sets', 'o2-contains-duplicate', 'o2-dictionaries', 'o2-dict-revision', 'o2-get', 'o2-iter-dicts', 'o2-frequency', 'o2-valid-anagram', 'o2-index-maps', 'o2-complements', 'o2-two-sum', 'd3-strings', 'd3-slicing', 'd3-methods'],
  },
  {
    date: '2026-10-04',
    sections: ['d3-two-pointers', 'd3-pointer-updates', 'd3-pointer-patterns', 'd3-running-state', 'd3-valid-palindrome', 'd3-stock', 'd3-two-sum-ii', 'd4-windows', 'd4-window-state', 'd4-longest-substring'],
  },
  { date: '2026-10-05', sections: ['d4-stacks', 'd4-matching', 'd4-valid-parentheses', 'd05-while', 'd05-bs', 'd05-variants', 'd05-cap-search', 'd05-listnode', 'd05-rewire'] },
  { date: '2026-10-06', sections: ['d05-cap-reverse', 'd05-dummy', 'd05-cap-merge', 'd06-functions', 'd06-recursion', 'd06-treenode', 'd06-dfs', 'd06-cap-depth', 'd06-pairs'] },
  { date: '2026-10-07', sections: ['d06-cap-same', 'd06-mutate', 'd06-cap-invert', 'o7-deque', 'o7-grids', 'o7-neighbors', 'o7-grid-bfs', 'o7-tree-bfs', 'o7-cap-level-order'] },
  { date: '2026-10-08', sections: ['o7-islands', 'o8-adjacency', 'o8-dfs', 'o8-bfs', 'o8-cap-path-exists', 'o8-components', 'o8-cap-provinces', 'o8-cycles'] },
  { date: '2026-10-09', sections: ['o8-cap-course-schedule', 'd9-sorting', 'd9-keys', 'd9-freq-sort', 'd9-heapq', 'd9-max-heap', 'd9-top-k', 'd9-intervals'] },
  { date: '2026-10-10', sections: ['d10-decisions', 'd10-path', 'd10-subsets', 'd10-recurrence', 'd10-memo', 'd10-bottom-up', 'd10-rolling'] },
  { date: '2026-10-11', sections: ['o11-speed', 'o11-debug', 'o11-edges', 'o11-cold', 'o11-mixed'] },
]

/** Interview day: these cold capstones are required; the rest of that section are extras. */
export const REQUIRED_COLD_CAPSTONES = ['cold-two-sum', 'cold-longest-substring', 'cold-valid-parentheses', 'cold-reverse-linked-list', 'cold-number-of-islands', 'cold-merge-intervals']

/** Interview day sections that are entirely extra. */
export const OPTIONAL_SECTIONS = ['o11-mixed']
