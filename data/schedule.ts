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
 * Re-planned again Oct 3, 6pm: the rest of Oct 3 is dictionaries only (the
 * Dictionary check, .get, iterating, frequency maps, and the end-of-day
 * "Dictionaries from scratch" mastery check, which gates everything after it).
 * Everything else planned for Oct 3 moved to the front of Oct 4, and Oct 4–10
 * were re-split contiguously, in order, to minimise the heaviest day
 * (~314–363 planned minutes each).
 *
 * Oct 3, 11:40pm: Oct 3 closed with everything through "Dictionaries from
 * scratch" cleared. The Dictionary ladder opens Oct 4 (still a mastery check,
 * so the rest of Oct 4 waits for it), and Oct 4–10 were re-split in order to
 * minimise the heaviest day (~325–363 planned minutes).
 *
 * Oct 5, 12:30am: Oct 4 went to the Dictionary ladder (26/30 cleared; the
 * rest carry over on Today until cleared). Oct 5 finishes hashing: Valid
 * Anagram, Index maps, Complements, Two Sum.
 *
 * Oct 5, 8:20pm: the dictionary chapter is closed. The ladder is no longer a
 * lock (26/30 cleared; the rest stay open on Oct 4). Valid Anagram, Index
 * maps, Complements and Two Sum come off the calendar: the ladder's LeetCode
 * rungs covered them, and Two Sum returns as a required cold capstone on
 * Oct 11. Oct 5 evening is the string block, Slicing first, untrimmed.
 *
 * Priority cut for Oct 6–10 (measured pace ~2.5–4× planned): from TRIM_FROM
 * on, each section keeps only its core reps (see `isCoreRep` in
 * data/curriculum.ts): the first rep, the reps marked important, the first
 * write rep, and every capstone. Lower-yield topics are off the calendar
 * entirely: two-pointer variants, binary-search variants, components /
 * provinces (Islands teaches it), directed cycles / Course Schedule, the
 * separate max-heap drill, backtracking path state. ~190–210 planned min/day.
 *
 * Frozen on purpose: editing a module later must not silently reshuffle days.
 */

export const SCHEDULE: { date: string; sections: string[] }[] = [
  { date: '2026-10-02', sections: ['o2-python-recall', 'o2-loops'] },
  {
    date: '2026-10-03',
    sections: ['o2-enumerate', 'o2-sets', 'o2-contains-duplicate', 'o2-dictionaries', 'o2-dict-revision', 'o2-get', 'o2-iter-dicts', 'o2-frequency', 'o2-dict-mastery'],
  },
  { date: '2026-10-04', sections: ['o2-dict-ladder'] },
  { date: '2026-10-05', sections: ['d3-slicing', 'd3-strings', 'd3-methods'] },
  {
    date: '2026-10-06',
    sections: ['d3-two-pointers', 'd3-pointer-updates', 'd3-running-state', 'd3-valid-palindrome', 'd3-stock', 'd3-two-sum-ii', 'd4-windows', 'd4-window-state', 'd4-longest-substring'],
  },
  {
    date: '2026-10-07',
    sections: ['d4-stacks', 'd4-matching', 'd4-valid-parentheses', 'd05-while', 'd05-bs', 'd05-cap-search', 'd05-listnode', 'd05-rewire', 'd05-cap-reverse', 'd05-dummy', 'd05-cap-merge', 'd06-functions', 'd06-recursion'],
  },
  {
    date: '2026-10-08',
    sections: ['d06-treenode', 'd06-dfs', 'd06-cap-depth', 'd06-pairs', 'd06-cap-same', 'd06-mutate', 'd06-cap-invert', 'o7-deque', 'o7-grids', 'o7-neighbors', 'o7-grid-bfs'],
  },
  {
    date: '2026-10-09',
    sections: ['o7-tree-bfs', 'o7-cap-level-order', 'o7-islands', 'o8-adjacency', 'o8-dfs', 'o8-bfs', 'o8-cap-path-exists', 'd9-sorting', 'd9-keys', 'd9-freq-sort', 'd9-heapq'],
  },
  { date: '2026-10-10', sections: ['d9-top-k', 'd9-intervals', 'd10-decisions', 'd10-subsets', 'd10-recurrence', 'd10-memo', 'd10-bottom-up', 'd10-rolling'] },
  { date: '2026-10-11', sections: ['o11-speed', 'o11-debug', 'o11-edges', 'o11-cold', 'o11-mixed'] },
]

/** From this date on, sections keep only their core reps (the priority cut). */
export const TRIM_FROM = '2026-10-06'

/** Interview day: these cold capstones are required; the rest of that section are extras. */
export const REQUIRED_COLD_CAPSTONES = ['cold-two-sum', 'cold-longest-substring', 'cold-valid-parentheses', 'cold-reverse-linked-list', 'cold-number-of-islands', 'cold-merge-intervals']

/** Interview day sections that are entirely extra. */
export const OPTIONAL_SECTIONS = ['o11-mixed']
