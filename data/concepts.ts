import { CONCEPT_VIDEOS, type ConceptVideo } from '@/data/concept-videos'
import { PRIMERS } from '@/data/primers'
import type { Primer } from '@/data/primers/types'
import type { Exercise, SkillId } from '@/lib/types'

/**
 * The Learn layer: one guide per concept the program trains (a data structure,
 * an algorithm, a pattern). The explanation itself is NOT written here: it is
 * composed from the primers (data/primers), which stay the one source of truth.
 * This file only adds what a primer does not carry: why the concept matters in
 * interviews, its usual shape, and concept-level videos.
 *
 * Concept videos teach the idea. Problem walkthroughs (data/walkthroughs.ts and
 * the plan's LeetCode rows) explain one problem's solution and are a different
 * resource, offered after a real attempt.
 */

interface ConceptSpec {
  id: string
  title: string
  /** The plan unit it belongs to, when it is a pattern of the 90-day plan. */
  pattern?: string
  /** Primer ids, the lead primer first. Every skill of these primers belongs to this concept. */
  primers: string[]
  whyItMatters: string
  /** The usual shape of the code, step by step, when the concept is a technique. */
  shape?: string[]
}

const SPECS: ConceptSpec[] = [
  {
    id: 'python-basics',
    title: 'Python basics: lists and loops',
    primers: ['lists', 'for-range', 'conditionals', 'accumulators', 'functions', 'enumerate-tuples', 'list-comprehension', 'while-loops'],
    whyItMatters: 'Every interview solution is built from these: walk a list, keep a running value, branch on a condition, return early. When they are automatic, your attention goes to the problem instead of the syntax.',
  },
  {
    id: 'strings',
    title: 'Strings and slicing',
    pattern: 'Strings + two pointers',
    primers: ['strings', 'slicing', 'string-framing'],
    whyItMatters: 'A large share of interview inputs are strings. You need to index, slice, clean and compare them without thinking about the syntax.',
  },
  {
    id: 'sets',
    title: 'Sets: "have I seen this before?"',
    pattern: 'Hashing',
    primers: ['sets', 'hashing'],
    whyItMatters: 'Asking "is x in here?" of a list means scanning it. A set answers in one step on average, which turns many O(n²) brute-force solutions into O(n).',
    shape: ['Make an empty set before the loop.', 'For each item: check whether it is already in the set (and act on that).', 'Then add it, so later items can find it.'],
  },
  {
    id: 'dictionaries',
    title: 'Dictionaries: key → value',
    pattern: 'Hashing',
    primers: ['dicts', 'dict-get-items'],
    whyItMatters: 'Interview problems keep asking for fast lookup: "have I seen this?", "how many times?", "where was it?". A dictionary answers each in one step, keyed by the thing you are looking for.',
  },
  {
    id: 'frequency-maps',
    title: 'Frequency maps: counting',
    pattern: 'Hashing',
    primers: ['frequency-maps', 'grouping-key'],
    whyItMatters: 'Anagrams, duplicates, "most common", "first unique", grouping: all of them are counting with a dictionary, or collecting items under a key you compute.',
    shape: ['Start with an empty dict.', 'For each item: `counts[x] = counts.get(x, 0) + 1`.', 'Then answer the question from the counts (compare, find the biggest, find a 1).'],
  },
  {
    id: 'index-maps',
    title: 'Index maps and complements',
    pattern: 'Hashing',
    primers: ['index-maps', 'run-starts'],
    whyItMatters: 'Remembering WHERE you saw a value (value → index) is how one pass replaces a nested loop. "What do I still need?" (the complement) plus "have I seen it, and where?" is the shape of Two Sum and many problems like it.',
    shape: ['Make an empty dict: value → index.', 'For each index i and value x: work out what you need (e.g. target − x).', 'If that is already in the dict, you have your answer: the stored index and i.', 'Only then store x → i, so x never pairs with itself.'],
  },
  {
    id: 'two-pointers',
    title: 'Two pointers',
    pattern: 'Strings + two pointers',
    primers: ['two-pointers', 'sorted-dedupe', 'expand-around-center'],
    whyItMatters: 'On sorted data, or when comparing the two ends of something, two indexes moving through it replace checking every pair: O(n) instead of O(n²), with no extra memory.',
    shape: ['Put one index at each end (or both at the start).', 'While they have not met: compare what they point at.', 'Move exactly one of them, chosen by that comparison.', 'Record the answer when the comparison says so.'],
  },
  {
    id: 'running-state',
    title: 'Running state: one pass, remember the best',
    pattern: 'Strings + two pointers',
    primers: ['running-state', 'prefix-suffix', 'best-ending-here', 'farthest-reach'],
    whyItMatters: 'Many problems that look like "check every pair" only need one pass that carries a little state forward: the lowest price so far, the best sum ending here, the farthest you can reach, a running product.',
    shape: ['Decide what to carry: the best so far, the lowest so far, a running total.', 'Start it before the loop (often with the first item, or infinity).', 'In the loop: use it to update the answer, then update it with the current item.'],
  },
  {
    id: 'sliding-window',
    title: 'Sliding window',
    pattern: 'Sliding window',
    primers: ['sliding-window', 'window-counts'],
    whyItMatters: '"Longest / shortest / count of contiguous stretches that satisfy a condition" is a window. Instead of rebuilding every stretch, keep one and move its edges: O(n) instead of O(n²).',
    shape: ['Move `right` forward one step and add `s[right]` to the window state.', 'While the window is invalid: remove `s[left]` from the state and move `left` forward.', 'The window is valid again: record the answer (its length, its contents).'],
  },
  {
    id: 'stacks',
    title: 'Stacks',
    pattern: 'Stacks',
    primers: ['stacks'],
    whyItMatters: 'Whenever the most recent unmatched thing is what matters (brackets, undo, nested structure, "next greater"), a stack keeps exactly that on top.',
    shape: ['Start with an empty list as the stack.', 'Push what is still waiting to be matched.', 'When something arrives that closes or resolves the top, pop and check it.', 'At the end, anything left on the stack was never matched.'],
  },
  {
    id: 'binary-search',
    title: 'Binary search',
    pattern: 'Binary search',
    primers: ['binary-search', 'rotated-search'],
    whyItMatters: 'Sorted input, or an answer where "too small, too small, OK, OK" flips once, can be searched in O(log n): a million items in about 20 steps.',
    shape: ['Set `lo, hi` to the ends of the search space.', 'While the range is not empty: look at `mid = (lo + hi) // 2`.', 'Decide which half cannot hold the answer and move `lo` or `hi` past `mid`.', 'When the loop ends, `lo` (or the recorded answer) is the result.'],
  },
  {
    id: 'linked-lists',
    title: 'Linked lists',
    pattern: 'Linked lists',
    primers: ['linked-lists', 'fast-slow-pointers'],
    whyItMatters: 'Linked-list questions test whether you can move references around without losing the rest of the list: reverse, merge, remove, find the middle, detect a loop.',
    shape: ['Walk with `node = head`, `while node: ...`, `node = node.next`.', 'Before you change `node.next`, save what it pointed to.', 'Use a dummy node in front of the head when the head itself might change.'],
  },
  {
    id: 'recursion',
    title: 'Recursion',
    pattern: 'Recursion + trees',
    primers: ['recursion'],
    whyItMatters: 'Trees, graphs, backtracking and much of dynamic programming are written recursively: solve a smaller version of the same problem and build the answer from it.',
    shape: ['Handle the smallest input first: the base case returns directly.', 'Otherwise, call the same function on something smaller.', 'Combine what those calls return into this call’s answer.'],
  },
  {
    id: 'trees',
    title: 'Binary trees and depth-first search',
    pattern: 'Recursion + trees',
    primers: ['trees-dfs', 'bst-ordering', 'tree-inorder', 'tree-build', 'tree-global-best'],
    whyItMatters: 'Almost every tree question is one recursive function: what to return for `None`, and how to combine the answers from the left and right subtrees.',
    shape: ['If `root` is `None`, return the empty answer (0, `True`, `[]`...).', 'Ask the left subtree for its answer, and the right subtree for its answer.', 'Combine the two with this node’s value and return it.'],
  },
  {
    id: 'tries',
    title: 'Tries (prefix trees)',
    pattern: 'Tries',
    primers: ['tries', 'trie-wildcard'],
    whyItMatters: 'When many words share prefixes and you need "is this a word?" or "does any word start with this?", a trie answers in the length of the word, not the number of words.',
    shape: ['Each node holds a dict of children (one per next letter) and an `end` flag.', 'To insert or search, walk the word letter by letter from the root.', 'Create missing children when inserting; stop with `False` when searching.', 'At the end of the word, check (or set) the `end` flag.'],
  },
  {
    id: 'bfs',
    title: 'Queues and breadth-first search',
    pattern: 'BFS + grids',
    primers: ['deque-bfs'],
    whyItMatters: 'BFS visits everything one step away before anything two steps away, so it finds the fewest steps (shortest path in an unweighted graph or grid) and processes trees level by level.',
    shape: ['Put the start in a `deque` and mark it visited.', 'While the queue is not empty: `popleft` the next item.', 'For each neighbor not yet visited: mark it visited, then append it.', 'For levels: take `len(queue)` items at a time.'],
  },
  {
    id: 'grids',
    title: 'Grids as graphs',
    pattern: 'BFS + grids',
    primers: ['grids', 'border-reach'],
    whyItMatters: 'Islands, flood fill, shortest path in a maze: a grid is a graph whose nodes are cells and whose edges are the four neighbors. The same DFS/BFS applies.',
    shape: ['`rows, cols = len(grid), len(grid[0])`.', 'For a cell `(r, c)`, try the four directions and skip anything out of bounds.', 'Keep a visited set (or mark the cell) so no cell is processed twice.', 'Start a search from every cell that begins a new region.'],
  },
  {
    id: 'graphs',
    title: 'Graphs: adjacency lists, DFS and BFS',
    pattern: 'Graphs',
    primers: ['graphs', 'cycle-detection', 'graph-clone', 'graph-tree-check'],
    whyItMatters: 'Courses and prerequisites, networks, connected groups: build an adjacency list from the edges, then the same DFS or BFS answers reachability, components and cycles.',
    shape: ['Build `graph = {node: [neighbors]}` from the edge list (both directions if undirected).', 'Keep a visited set; start a DFS or BFS from a node.', 'For components: start from every node not yet visited and count the starts.', 'For cycles in a directed graph: track nodes still on the current path.'],
  },
  {
    id: 'heaps',
    title: 'Sorting and heaps',
    pattern: 'Sorting + heaps',
    primers: ['heaps', 'sorting'],
    whyItMatters: 'Sorting with the right key solves a surprising number of problems. When you only need the smallest or the k largest, a heap does it without sorting everything: O(n log k).',
    shape: ['To keep the k largest: push each value onto a min-heap.', 'If the heap grows past k, pop (that removes the smallest).', 'At the end the heap holds the k largest, and `heap[0]` is the k-th largest.'],
  },
  {
    id: 'intervals',
    title: 'Intervals',
    pattern: 'Intervals',
    primers: ['intervals', 'interval-insert', 'interval-greedy', 'min-rooms'],
    whyItMatters: 'Meetings, bookings, ranges: sorting intervals by start (or end) turns "which of these overlap?" into one pass that compares each interval with the last one kept.',
    shape: ['Sort the intervals by start.', 'Keep the last interval you kept (or the merged one so far).', 'If the next one starts before it ends, they overlap: merge (or count the clash).', 'Otherwise, start a new one.'],
  },
  {
    id: 'backtracking',
    title: 'Backtracking',
    pattern: 'Backtracking',
    primers: ['backtracking', 'combination-start', 'grid-backtracking'],
    whyItMatters: '"All subsets", "all combinations", "every arrangement", "does a path spell this word": you build answers one choice at a time and undo each choice to try the next.',
    shape: ['Keep a `path` of the choices made so far.', 'If the path is a complete answer, save a copy of it.', 'For each next option: add it to the path, recurse, then remove it again.'],
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic programming',
    pattern: 'Dynamic programming',
    primers: ['memo-dp', 'dp-min-over-choices', 'dp-look-back', 'dp-over-prefixes', 'dp-two-dimensions', 'circle-as-two-lines'],
    whyItMatters: 'When a problem asks for the number of ways, or the best total, and the same smaller question comes up again and again, write each small answer down once and build the big one from them.',
    shape: ['Say in words what `dp[i]` means (the state).', 'Write how `dp[i]` comes from earlier entries (the recurrence).', 'Fill in the smallest cases directly (the base cases).', 'Fill the table in order, or memoize the recursion, and return the entry you need.'],
  },
  {
    id: 'matrix',
    title: 'Matrices',
    pattern: 'Matrix',
    primers: ['matrix-transform', 'matrix-layers', 'matrix-marking'],
    whyItMatters: 'Rotate, spiral, zero out: matrix questions test careful index work in two dimensions: which cell goes where, and in what order to change them.',
    shape: ['Name the bounds: rows, cols (or top, bottom, left, right).', 'Change cells in an order that never overwrites something you still need.', 'When a change depends on the original values, record first and change after.'],
  },
  {
    id: 'complexity',
    title: 'Complexity and talking it through',
    primers: ['interview-craft'],
    whyItMatters: 'Interviewers grade how you reason, not only whether the tests pass: the approach, why it is correct, the edge cases, and the time and space it uses.',
  },
]

const PRIMER = new Map(PRIMERS.map((p) => [p.id, p]))

export interface Concept {
  id: string
  title: string
  pattern?: string
  skills: SkillId[]
  /** From the lead primer: what it is, and the mental model. */
  concept: string
  mentalModel: string
  whyItMatters: string
  coreMoves: { code: string; note: string }[]
  shape?: string[]
  commonMistakes: string[]
  /** A small runnable example and what it prints (the lead primer's). */
  example: { code: string; output: string }
  /** Every primer behind it, for the full detail. */
  primers: Primer[]
  /** Concept-level videos only. Problem walkthroughs are a separate resource. */
  videos: ConceptVideo[]
}

function compose(spec: ConceptSpec): Concept {
  const primers = spec.primers.map((id) => {
    const p = PRIMER.get(id)
    if (!p) throw new Error(`concept ${spec.id}: unknown primer ${id}`)
    return p
  })
  const lead = primers[0]
  // Core moves: the lead primer's lines first, then one line from each related primer, at most seven.
  const coreMoves = [...lead.syntax.slice(0, 4), ...primers.slice(1).map((p) => p.syntax[0])].slice(0, 7)
  const commonMistakes = [...lead.gotchas.slice(0, 3), ...primers.slice(1).map((p) => p.gotchas[0])].slice(0, 5)
  return {
    id: spec.id,
    title: spec.title,
    pattern: spec.pattern,
    skills: primers.flatMap((p) => p.skills),
    concept: lead.what,
    mentalModel: lead.model,
    whyItMatters: spec.whyItMatters,
    coreMoves,
    shape: spec.shape,
    commonMistakes,
    example: lead.example,
    primers,
    videos: CONCEPT_VIDEOS[spec.id] ?? [],
  }
}

export const CONCEPTS: Concept[] = SPECS.map(compose)
export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]))
const CONCEPT_OF_SKILL = new Map(CONCEPTS.flatMap((c) => c.skills.map((s) => [s, c] as const)))

export function conceptOfSkill(skill: SkillId): Concept | undefined {
  return CONCEPT_OF_SKILL.get(skill)
}

/**
 * The concept a rep is about: the one covering most of its skills, preferring the
 * more specific pattern over Python basics when they tie (a rep that uses a for
 * loop to build a frequency map is about frequency maps).
 */
export function conceptFor(skills: SkillId[], prefer: SkillId[] = []): Concept | undefined {
  const order = new Map(CONCEPTS.map((c, i) => [c.id, i]))
  const score = new Map<string, number>()
  for (const s of [...prefer, ...prefer, ...skills]) {
    const c = CONCEPT_OF_SKILL.get(s)
    if (c && c.id !== 'complexity') score.set(c.id, (score.get(c.id) ?? 0) + 1)
  }
  const best = [...score.entries()].sort((a, b) => b[1] - a[1] || (a[0] === 'python-basics' ? 1 : b[0] === 'python-basics' ? -1 : order.get(b[0])! - order.get(a[0])!))[0]
  // Talking through an approach (complexity, edge cases, explaining) is the Complexity concept, used only when nothing more specific fits.
  return best ? CONCEPT_BY_ID[best[0]] : skills.some((k) => CONCEPT_OF_SKILL.get(k)?.id === 'complexity') ? CONCEPT_BY_ID.complexity : undefined
}

export type GuideMode = 'learn' | 'practice' | 'prove' | 'hidden'

/**
 * How the Learn layer shows on a rep: open on first exposure, collapsed on
 * drill and combine, collapsed-and-counts-as-help on anything that proves
 * (capstone, cold, check, transfer, clean pass), and absent in interview mode.
 */
export function guideMode(e: Pick<Exercise, 'repType' | 'stage' | 'transfer' | 'cleanPass'>, opts: { firstExposure: boolean; interview: boolean }): GuideMode {
  if (opts.interview) return 'hidden'
  if (opts.firstExposure) return 'learn'
  const proving = e.repType === 'capstone' || e.repType === 'cold' || e.repType === 'interview' || e.stage === 'retrieval' || Boolean(e.transfer) || Boolean(e.cleanPass)
  return proving ? 'prove' : 'practice'
}

/** Whether the guide starts open, and whether opening it counts as help. */
export const GUIDE_BEHAVIOUR: Record<Exclude<GuideMode, 'hidden'>, { open: boolean; assisted: boolean }> = {
  learn: { open: true, assisted: false },
  practice: { open: false, assisted: false },
  prove: { open: false, assisted: true },
}
