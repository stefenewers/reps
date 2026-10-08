import type { DayModule, Exercise } from '@/lib/types'
import { choice, debug, explain, output, t, write } from './build'
import { modeledMinutes } from '@/lib/curriculum-audit'
import { day as oct02 } from './oct02'
import { day as oct03 } from './oct03'
import { day as oct04 } from './oct04'
import { day as oct05 } from './oct05'
import { day as oct06 } from './oct06'
import { day as oct07 } from './oct07'
import { day as oct08 } from './oct08'
import { day as oct09 } from './oct09'
import { day as oct10 } from './oct10'

/*
 * October 11: the day before the interview. No new concepts. Cold retrieval,
 * mixed practice, edge cases, complexity and saying the approach out loud.
 */

const R = { stage: 'retrieval', repType: 'cold' } as const

// ---------------------------------------------------------------------------
// Cold capstones: derived from the earlier days' capstones, scaffolding removed.
// ---------------------------------------------------------------------------

const EARLIER_DAYS = [oct02, oct03, oct04, oct05, oct06, oct07, oct08, oct09, oct10]

/** The first `def name(...) -> ...:` header in a starter, parens balanced across lines. */
function defLine(starter: string | undefined): string | undefined {
  if (!starter) return undefined
  const m = /^[ \t]*def[ \t]+\w+[ \t]*\(/m.exec(starter)
  if (!m) return undefined
  let i = m.index + m[0].length
  let depth = 1
  while (i < starter.length && depth > 0) {
    const ch = starter[i]
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') depth--
    i++
  }
  if (depth !== 0) return undefined
  const colon = starter.indexOf(':', i)
  if (colon === -1) return undefined
  return starter.slice(m.index, colon + 1).trim()
}

function coldCapstones(problemIds: string[]): Exercise[] {
  const all = EARLIER_DAYS.flatMap((d) => d.sections.flatMap((s) => s.exercises))
  const out: Exercise[] = []
  for (const id of problemIds) {
    const cap = all.find((e) => e.repType === 'capstone' && e.problemId === id)
    if (!cap) continue
    const header = defLine(cap.starterCode)
    const cold: Exercise = {
      ...cap,
      id: 'cold-' + id,
      title: cap.title + ' (cold)',
      stage: 'retrieval',
      repType: 'cold',
      // Keep the link to the canonical problem: it is what makes this a capstone-class
      // rep for the audit (and for progress on the problems page).
      problemId: cap.problemId ?? id,
      note: undefined,
      signature: cap.signature,
      prompt: 'Cold rep. No scaffolding — write it from a blank editor.\n\n' + cap.prompt,
      starterCode: header ? header + '\n    pass\n' : cap.starterCode,
      review: { important: true },
    }
    // Minutes follow the amount of code actually written (timed, but honest): ~1.6x the
    // modeled time, at least 8 and never more than the original capstone or 20.
    cold.minutes = Math.min(cap.minutes, 20, Math.max(8, Math.round(modeledMinutes(cold) * 1.6)))
    out.push(cold)
  }
  return out
}

const COLD_IDS = [
  'two-sum',
  'longest-substring',
  'valid-parentheses',
  'reverse-linked-list',
  'number-of-islands',
  'level-order',
  'course-schedule',
  'top-k-frequent',
  'merge-intervals',
  'subsets',
  'house-robber',
]

// ---------------------------------------------------------------------------
// Python speed round
// ---------------------------------------------------------------------------

const speed: Exercise[] = [
  write({
    id: 'o11-speed-count',
    title: 'Count with .get',
    skills: ['frequency_map', 'dict_get'],
    ...R,
    prompt: 'Write `count_words(words)` returning a dict that maps each word to how many times it appears. Use `.get`, no `Counter`.',
    starterCode: `def count_words(words):
    pass
`,
    solution: `def count_words(words):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    return counts
`,
    tests: [
      t.eq('count_words(["go", "py", "go", "go", "py", "js"])', '{"go": 3, "py": 2, "js": 1}'),
      t.eq('count_words([])', '{}'),
      t.hidden('count_words(["a"])', '{"a": 1}'),
      t.hidden('count_words(["x", "x", "x"])', '{"x": 3}'),
    ],
    hints: ['Default to 0 when the word is new, then add one.', '`counts[w] = counts.get(w, 0) + 1`'],
    explanation: '`.get(w, 0)` returns 0 for a missing key, so the same line handles first sightings and repeats.',
    signature: 'freq-map:count-words',
    minutes: 2.5,
  }),
  output({
    id: 'o11-speed-first-seen',
    title: 'Trace first-seen indexes',
    skills: ['enumerate', 'index_map', 'dict_membership'],
    ...R,
    prompt: 'What does this print?',
    code: `nums = [4, 7, 4, 9]
first = {}
for i, n in enumerate(nums):
    if n not in first:
        first[n] = i
print(first)`,
    expectedOutput: '{4: 0, 7: 1, 9: 3}',
    explanation: 'The second 4 at index 2 is skipped because 4 is already a key. Dicts print in insertion order.',
    signature: 'trace:index-map-first-seen',
  }),
  write({
    id: 'o11-speed-last-seen',
    title: 'Last index of each value',
    skills: ['enumerate', 'index_map'],
    ...R,
    prompt: 'Write `last_seen(nums)` returning a dict that maps each value to the **last** index where it appears.',
    starterCode: `def last_seen(nums):
    pass
`,
    solution: `def last_seen(nums):
    out = {}
    for i, n in enumerate(nums):
        out[n] = i
    return out
`,
    tests: [
      t.eq('last_seen([5, 1, 5])', '{5: 2, 1: 1}'),
      t.eq('last_seen([])', '{}'),
      t.hidden('last_seen([7])', '{7: 0}'),
      t.hidden('last_seen([2, 2, 2])', '{2: 2}'),
    ],
    hints: ['Later writes overwrite earlier ones.', 'Loop with `enumerate` and assign `out[n] = i` every time.'],
    explanation: 'Unconditional assignment keeps the latest index; adding `if n not in out` would keep the first one instead.',
    signature: 'index-map:last-seen',
    minutes: 2,
  }),
  write({
    id: 'o11-speed-deque',
    title: 'Pass the parcel',
    skills: ['queue_deque', 'range'],
    ...R,
    prompt:
      'Players sit in a circle in the order of `names`. Each pass moves the front player to the back. Return who is at the front after `passes` passes. Use a `deque`.',
    starterCode: `from collections import deque

def pass_parcel(names, passes):
    pass
`,
    solution: `from collections import deque

def pass_parcel(names, passes):
    q = deque(names)
    for _ in range(passes):
        q.append(q.popleft())
    return q[0]
`,
    tests: [
      t.eq('pass_parcel(["a", "b", "c"], 1)', '"b"'),
      t.eq('pass_parcel(["a", "b", "c"], 4)', '"b"'),
      t.hidden('pass_parcel(["solo"], 5)', '"solo"'),
      t.hidden('pass_parcel(["a", "b"], 0)', '"a"'),
    ],
    hints: ['`popleft()` takes from the front in O(1).', '`q.append(q.popleft())` is one pass.'],
    explanation: '`deque.popleft()` is O(1); `list.pop(0)` would shift every element on each pass.',
    signature: 'deque:rotate',
    minutes: 2.5,
  }),
  write({
    id: 'o11-speed-heap-small',
    title: 'k smallest with heapq',
    skills: ['heap_push_pop', 'list_comprehension'],
    ...R,
    prompt: 'Write `k_smallest(nums, k)` returning the `k` smallest values in ascending order, using `heapq` push and pop. Assume `0 <= k <= len(nums)`.',
    starterCode: `import heapq

def k_smallest(nums, k):
    pass
`,
    solution: `import heapq

def k_smallest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
    return [heapq.heappop(heap) for _ in range(k)]
`,
    tests: [
      t.eq('k_smallest([5, 1, 4, 2], 2)', '[1, 2]'),
      t.eq('k_smallest([3, 3, 1], 3)', '[1, 3, 3]'),
      t.hidden('k_smallest([9], 1)', '[9]'),
      t.hidden('k_smallest([-1, -5, 0], 2)', '[-5, -1]'),
      t.hidden('k_smallest([4, 2], 0)', '[]'),
    ],
    hints: ['heapq is a min-heap: `heappop` always returns the smallest.', 'Push everything, then pop k times.'],
    explanation: 'Each pop returns the current minimum, so k pops give the k smallest in order.',
    signature: 'heap:k-smallest',
    minutes: 2.5,
  }),
  output({
    id: 'o11-speed-heap-tuples',
    title: 'Trace a heap of tuples',
    skills: ['heap_push_pop', 'tuples'],
    ...R,
    prompt: 'What does this print?',
    code: `import heapq
h = []
heapq.heappush(h, (2, "b"))
heapq.heappush(h, (1, "z"))
heapq.heappush(h, (1, "a"))
while h:
    count, word = heapq.heappop(h)
    print(count, word)`,
    expectedOutput: '1 a\n1 z\n2 b',
    explanation: 'Tuples compare by the first item, then the second on a tie, so (1, "a") comes before (1, "z").',
    signature: 'trace:heap-tuples',
  }),
  write({
    id: 'o11-speed-sort-key',
    title: 'Sort by length, then alphabet',
    skills: ['sort_key', 'tuples'],
    ...R,
    prompt: 'Write `by_length(words)` returning the words sorted shortest first, ties broken alphabetically. One line.',
    starterCode: `def by_length(words):
    pass
`,
    solution: `def by_length(words):
    return sorted(words, key=lambda w: (len(w), w))
`,
    tests: [
      t.eq('by_length(["bb", "a", "ab", "c"])', '["a", "c", "ab", "bb"]'),
      t.hidden('by_length([])', '[]'),
      t.hidden('by_length(["ccc", "bb", "aaa"])', '["bb", "aaa", "ccc"]'),
    ],
    hints: ['A tuple key sorts by its first item, then its second.'],
    explanation: '`key=lambda w: (len(w), w)` sorts by length and uses the word itself as the tie-breaker.',
    signature: 'sort-key:tuple',
    minutes: 2,
  }),
  choice({
    id: 'o11-speed-slicing',
    title: 'Slices',
    skills: ['slicing'],
    ...R,
    prompt: 'What does this print?',
    code: `s = "interview"
print(s[1:4], s[-3:], s[::-1][:2])`,
    options: ['nte iew we', 'int iew we', 'nter view wi', 'nte vie we'],
    answer: 0,
    explanation: '`s[1:4]` is indexes 1–3, `s[-3:]` is the last three, and `s[::-1]` is "weivretni" whose first two are "we".',
    signature: 'slicing:mixed',
  }),
  write({
    id: 'o11-speed-leaderboard',
    title: 'Leaderboard',
    skills: ['sort_key', 'dict_lookup'],
    ...R,
    prompt: '`scores` maps name → score. Return the names, highest score first; equal scores in alphabetical order.',
    starterCode: `def leaderboard(scores):
    pass
`,
    solution: `def leaderboard(scores):
    return sorted(scores, key=lambda name: (-scores[name], name))
`,
    tests: [
      t.eq('leaderboard({"ana": 5, "bo": 9, "cy": 5})', '["bo", "ana", "cy"]'),
      t.eq('leaderboard({})', '[]'),
      t.hidden('leaderboard({"z": 1, "a": 1})', '["a", "z"]'),
      t.hidden('leaderboard({"x": -2, "y": 0})', '["y", "x"]'),
    ],
    hints: ['Sorting a dict sorts its keys.', 'Negate the score so the larger one sorts first while names still sort ascending.'],
    explanation: '`reverse=True` would also reverse the name order, so negating the number is the clean way to mix directions.',
    signature: 'sort-key:negate-desc',
    minutes: 2.5,
  }),
  write({
    id: 'o11-speed-neighbors',
    title: 'In-bounds neighbors',
    skills: ['grid_neighbors', 'grid_nested'],
    ...R,
    prompt: 'Return the in-bounds neighbors of `(r, c)` as a list of tuples in the order up, down, left, right.',
    starterCode: `def neighbors(grid, r, c):
    pass
`,
    solution: `def neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    out = []
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            out.append((nr, nc))
    return out
`,
    tests: [
      t.eq('neighbors([[0, 0], [0, 0]], 0, 0)', '[(1, 0), (0, 1)]'),
      t.eq('neighbors([[0] * 3 for _ in range(3)], 1, 1)', '[(0, 1), (2, 1), (1, 0), (1, 2)]'),
      t.hidden('neighbors([[5]], 0, 0)', '[]'),
      t.hidden('neighbors([[1, 2, 3]], 0, 1)', '[(0, 0), (0, 2)]'),
    ],
    hints: ['A directions list of (dr, dc) pairs.', 'Check `0 <= nr < rows and 0 <= nc < cols`.'],
    explanation: 'This exact loop is the inner step of every grid BFS/DFS; write it without thinking.',
    signature: 'grid:neighbors',
    minutes: 3,
  }),
]

// ---------------------------------------------------------------------------
// Debug sprint: the classic bug from every day, fast. Fix, run, next.
// ---------------------------------------------------------------------------

const D = { stage: 'debug', repType: 'cold' } as const

const bugs: Exercise[] = [
  debug({
    id: 'o11-bug-get',
    title: 'Character counts',
    skills: ['frequency_map', 'dict_get'],
    ...D,
    prompt: 'Return a dict mapping each character of `s` to how many times it appears.',
    brokenCode: `def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch) + 1
    return counts
`,
    solution: `def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts
`,
    tests: [
      t.eq('char_counts("aab")', '{"a": 2, "b": 1}'),
      t.eq('char_counts("")', '{}'),
      t.hidden('char_counts("zzz")', '{"z": 3}'),
      t.hidden('char_counts("abc")', '{"a": 1, "b": 1, "c": 1}'),
    ],
    hints: ['Read the error message: what is `None + 1`?'],
    explanation: '`.get(ch)` returns `None` for a missing key. The default argument is what makes the counting idiom work.',
    signature: 'debug:get-default',
    minutes: 2,
  }),
  debug({
    id: 'o11-bug-dict-direction',
    title: 'Pair sum, one pass',
    skills: ['index_map', 'complement', 'enumerate'],
    ...D,
    prompt: 'Return the indexes `[i, j]` (with `i < j`) of two numbers that add to `target`, in one pass. Return `[]` if there is no pair.',
    brokenCode: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[i] = n
    return []
`,
    solution: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []
`,
    tests: [
      t.eq('two_sum([2, 7, 11, 15], 9)', '[0, 1]'),
      t.eq('two_sum([3, 3], 6)', '[0, 1]'),
      t.hidden('two_sum([3, 2, 4], 6)', '[1, 2]'),
      t.hidden('two_sum([1, 2], 10)', '[]'),
      t.hidden('two_sum([-1, 5, 4], 3)', '[0, 2]'),
    ],
    hints: ['What do you look up in `seen`: a value or an index?', 'The key must be the thing you search for.'],
    explanation: 'You look up values (`target - n in seen`), so values must be the keys and indexes the values: `seen[n] = i`.',
    signature: 'debug:dict-direction',
    minutes: 3,
  }),
  debug({
    id: 'o11-bug-bsearch-hi',
    title: 'Search the sorted list',
    skills: ['binary_search', 'search_invariant', 'mid_calc'],
    ...D,
    prompt: 'Return the index of `target` in the sorted list `nums`, or -1 if it is absent. O(log n).',
    brokenCode: `def search(nums, target):
    lo, hi = 0, len(nums)
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    tests: [
      t.eq('search([1, 3, 5], 3)', '1'),
      t.eq('search([1, 3, 5], 9)', '-1'),
      t.hidden('search([], 4)', '-1'),
      t.hidden('search([1, 3, 5], 0)', '-1'),
      t.hidden('search([2], 2)', '0'),
      t.hidden('search([1, 3, 5, 7], 7)', '3'),
    ],
    hints: ['Which index does `mid` reach when the target is bigger than everything?', 'Inclusive bounds: is `len(nums)` a valid index?'],
    explanation: '`while lo <= hi` with `hi = mid - 1` is the inclusive convention, so `hi` must start at the last valid index, `len(nums) - 1`.',
    signature: 'debug:bsearch-bounds',
    minutes: 3,
  }),
  debug({
    id: 'o11-bug-reverse-order',
    title: 'Reverse a linked list',
    skills: ['linked_list_reassignment', 'linked_list_traversal'],
    ...D,
    prompt: 'Reverse the linked list in place and return the new head.',
    brokenCode: `def reverse(head):
    prev, curr = None, head
    while curr:
        curr.next = prev
        prev = curr
        curr = curr.next
    return prev
`,
    solution: `def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
`,
    tests: [
      t.eq('list_to_array(reverse(build_list([1, 2, 3])))', '[3, 2, 1]'),
      t.eq('list_to_array(reverse(build_list([])))', '[]'),
      t.hidden('list_to_array(reverse(build_list([7])))', '[7]'),
      t.hidden('list_to_array(reverse(build_list([1, 2])))', '[2, 1]'),
    ],
    hints: ['After `curr.next = prev`, where does `curr.next` point?', 'Save the rest of the list before you cut the link.'],
    explanation: 'Overwriting `curr.next` loses the rest of the list. Save `nxt = curr.next` first: save, reverse, advance prev, advance curr.',
    signature: 'debug:reverse-pointer-order',
    minutes: 3,
  }),
  debug({
    id: 'o11-bug-base-case',
    title: 'Sum a tree',
    skills: ['recursion_base_case', 'tree_dfs', 'recursion_return'],
    ...D,
    prompt: 'Return the sum of all node values in the binary tree. An empty tree sums to 0.',
    brokenCode: `def tree_sum(root):
    if root.left is None and root.right is None:
        return root.val
    return root.val + tree_sum(root.left) + tree_sum(root.right)
`,
    solution: `def tree_sum(root):
    if root is None:
        return 0
    return root.val + tree_sum(root.left) + tree_sum(root.right)
`,
    tests: [
      t.eq('tree_sum(build_tree([1, 2, 3]))', '6'),
      t.eq('tree_sum(build_tree([1, 2]))', '3'),
      t.hidden('tree_sum(build_tree([]))', '0'),
      t.hidden('tree_sum(build_tree([5]))', '5'),
      t.hidden('tree_sum(build_tree([1, None, 2, None, 3]))', '6'),
      t.hidden('tree_sum(build_tree([-1, 4, -2]))', '1'),
    ],
    hints: ['What happens when a node has exactly one child?', 'The smallest tree is no tree at all.'],
    explanation: 'A leaf check is not a base case for `None`: a node with one child still recurses into the missing side. `if root is None: return 0` covers leaves, one-child nodes and the empty tree.',
    signature: 'debug:missing-base-case',
    minutes: 3,
  }),
  debug({
    id: 'o11-bug-visited-late',
    title: 'Count reachable cells',
    skills: ['bfs', 'visited_set', 'grid_neighbors', 'queue_deque'],
    ...D,
    difficulty: 3,
    prompt: '`grid` has `0` for open cells and `1` for walls. Starting from the open cell `(r, c)`, return how many open cells can be reached moving up, down, left or right (including the start). Each cell must be counted once.',
    brokenCode: `from collections import deque

def reachable(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    queue = deque([(r, c)])
    seen = set()
    count = 0
    while queue:
        cr, cc = queue.popleft()
        seen.add((cr, cc))
        count += 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in seen:
                queue.append((nr, nc))
    return count
`,
    solution: `from collections import deque

def reachable(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    queue = deque([(r, c)])
    seen = {(r, c)}
    count = 0
    while queue:
        cr, cc = queue.popleft()
        count += 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc))
    return count
`,
    tests: [
      t.eq('reachable([[0, 0], [0, 0]], 0, 0)', '4'),
      t.eq('reachable([[0, 1], [1, 0]], 0, 0)', '1'),
      t.hidden('reachable([[0, 0, 0]], 0, 1)', '3'),
      t.hidden('reachable([[0, 0, 0], [0, 0, 0], [0, 0, 0]], 1, 1)', '9'),
      t.hidden('reachable([[0, 1, 0], [0, 1, 0]], 1, 2)', '2'),
    ],
    hints: ['On the 2x2 grid, how many times does `(1, 1)` enter the queue?', 'A cell should be marked the moment it is queued.'],
    explanation: 'Marking on pop lets two neighbors queue the same cell before either is processed. Mark when you enqueue (and seed `seen` with the start) so every cell enters the queue once.',
    signature: 'debug:visited-late',
    minutes: 4,
  }),
  debug({
    id: 'o11-bug-path-copy',
    title: 'All subsets',
    skills: ['backtracking_state', 'recursion_base_case'],
    ...D,
    prompt: 'Return every subset of `nums` (distinct numbers). The order of subsets does not matter.',
    brokenCode: `def subsets(nums):
    out, path = [], []
    def dfs(i):
        if i == len(nums):
            out.append(path)
            return
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return out
`,
    solution: `def subsets(nums):
    out, path = [], []
    def dfs(i):
        if i == len(nums):
            out.append(path[:])
            return
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return out
`,
    tests: [
      t.eq('subsets([1, 2])', '[[], [1], [2], [1, 2]]', { compare: 'sorted-inner' }),
      t.eq('subsets([])', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('subsets([5])', '[[], [5]]', { compare: 'sorted-inner' }),
      t.hidden('subsets([1, 2, 3])', '[[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]', { compare: 'sorted-inner' }),
    ],
    hints: ['Print `out` at the end: why are all the lists the same?', 'You need a snapshot, not the live list.'],
    explanation: '`out.append(path)` stores the same list object every time, and backtracking empties it. `path[:]` records a copy of the current state.',
    signature: 'debug:path-copy',
    minutes: 2.5,
  }),
  debug({
    id: 'o11-bug-heap-trim',
    title: 'k largest',
    skills: ['heap_push_pop', 'top_k'],
    ...D,
    prompt: 'Return the `k` largest values, largest first, using a min-heap that never holds more than `k` items (O(n log k)). `1 <= k <= len(nums)`.',
    brokenCode: `import heapq

def k_largest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
    return sorted(heap, reverse=True)
`,
    solution: `import heapq

def k_largest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True)
`,
    tests: [
      t.eq('k_largest([3, 1, 5, 2], 2)', '[5, 3]'),
      t.eq('k_largest([4], 1)', '[4]'),
      t.hidden('k_largest([1, 1, 1], 2)', '[1, 1]'),
      t.hidden('k_largest([-3, -1, -2], 1)', '[-1]'),
      t.hidden('k_largest([9, 8, 7, 6], 4)', '[9, 8, 7, 6]'),
    ],
    hints: ['How big does `heap` get?', 'A min-heap pops its smallest item, exactly the one you want to evict.'],
    explanation: 'Popping whenever the heap exceeds k keeps the k largest seen so far and holds the cost at O(log k) per item.',
    signature: 'debug:heap-trim',
    minutes: 3,
  }),
  debug({
    id: 'o11-bug-unsorted',
    title: 'Merge meetings',
    skills: ['interval_overlap', 'sorting', 'sort_key'],
    ...D,
    prompt: 'Merge overlapping (or touching) intervals given in any order. Return the merged intervals sorted by start. Input is non-empty.',
    brokenCode: `def merge(intervals):
    out = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out
`,
    solution: `def merge(intervals):
    intervals = sorted(intervals, key=lambda x: x[0])
    out = [list(intervals[0])]
    for start, end in intervals[1:]:
        if start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out
`,
    tests: [
      t.eq('merge([[1, 3], [2, 6], [8, 10]])', '[[1, 6], [8, 10]]'),
      t.eq('merge([[2, 6], [1, 3]])', '[[1, 6]]'),
      t.hidden('merge([[8, 10], [1, 3], [2, 6]])', '[[1, 6], [8, 10]]'),
      t.hidden('merge([[5, 6], [1, 2]])', '[[1, 2], [5, 6]]'),
      t.hidden('merge([[1, 4]])', '[[1, 4]]'),
    ],
    hints: ['The scan only compares with the last merged interval. When is that enough?'],
    explanation: 'The one-pass merge relies on sorted starts: only then can an interval overlap nothing but the last merged one. Sorting is the O(n log n) step.',
    signature: 'debug:intervals-unsorted',
    minutes: 2.5,
  }),
  debug({
    id: 'o11-bug-dummy',
    title: 'Merge two sorted lists',
    skills: ['dummy_node', 'linked_list_traversal', 'linked_list_reassignment'],
    ...D,
    prompt: 'Merge two sorted linked lists into one sorted list and return its head.',
    brokenCode: `def merge_lists(a, b):
    dummy = ListNode(0)
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a or b
    return dummy
`,
    solution: `def merge_lists(a, b):
    dummy = ListNode(0)
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
`,
    tests: [
      t.eq('list_to_array(merge_lists(build_list([1, 3]), build_list([2])))', '[1, 2, 3]'),
      t.eq('list_to_array(merge_lists(build_list([]), build_list([])))', '[]'),
      t.hidden('list_to_array(merge_lists(build_list([]), build_list([4])))', '[4]'),
      t.hidden('list_to_array(merge_lists(build_list([1, 1]), build_list([1])))', '[1, 1, 1]'),
    ],
    hints: ['Look at the first value of the output.'],
    explanation: 'The dummy node is a placeholder in front of the real head; the answer starts at `dummy.next`.',
    signature: 'debug:dummy-next',
    minutes: 2.5,
  }),
  debug({
    id: 'o11-bug-window-left',
    title: 'Longest run without repeats',
    skills: ['sliding_window', 'window_state', 'index_map'],
    ...D,
    difficulty: 3,
    prompt: 'Return the length of the longest substring of `s` with no repeated characters, in one pass.',
    brokenCode: `def longest_unique(s):
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
`,
    solution: `def longest_unique(s):
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last:
            left = max(left, last[ch] + 1)
        last[ch] = right
        best = max(best, right - left + 1)
    return best
`,
    tests: [
      t.eq('longest_unique("abcabcbb")', '3'),
      t.eq('longest_unique("abba")', '2'),
      t.hidden('longest_unique("")', '0'),
      t.hidden('longest_unique("bbbb")', '1'),
      t.hidden('longest_unique("pwwkew")', '3'),
      t.hidden('longest_unique("tmmzuxt")', '5'),
    ],
    hints: ['Trace `"abba"`: where is `left` after the last `a`?', 'Can `left` ever move backwards in a sliding window?'],
    explanation: 'The stored index may be left of the window already. `left = max(left, last[ch] + 1)` keeps the window from sliding backwards.',
    signature: 'debug:window-left-backwards',
    minutes: 3.5,
  }),
]

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

const W = { stage: 'retrieval', repType: 'cold', style: 'write-test' } as const

const edges: Exercise[] = [
  write({
    id: 'o11-wt-profit',
    title: 'Break it: profit',
    skills: ['edge_cases', 'state_tracking'],
    ...W,
    prompt:
      '`max_profit(prices)` should return the best profit from buying once and selling on a later day, or 0 if no profit is possible. `prices` is never empty.\n\nDo not fix it yet. Write `edge_cases()` returning a list of at least two `(prices, expected)` pairs with correct expected values, where at least one makes `max_profit` crash or answer wrong.',
    starterCode: `def max_profit(prices):
    best = prices[1] - prices[0]
    low = min(prices[0], prices[1])
    for p in prices[2:]:
        best = max(best, p - low)
        low = min(low, p)
    return best

def edge_cases():
    pass
`,
    solution: `def max_profit(prices):
    best = prices[1] - prices[0]
    low = min(prices[0], prices[1])
    for p in prices[2:]:
        best = max(best, p - low)
        low = min(low, p)
    return best

def edge_cases():
    return [
        ([7], 0),
        ([5, 3], 0),
    ]
`,
    tests: [
      t.check(
        'at least two correct cases, one breaks max_profit',
        `cases = edge_cases()
assert isinstance(cases, list) and len(cases) >= 2, "return a list of at least two (prices, expected) pairs"
def _ref(p):
    best, low = 0, p[0]
    for x in p:
        best = max(best, x - low)
        low = min(low, x)
    return best
for prices, want in cases:
    assert len(prices) >= 1, "prices is never empty"
    assert want == _ref(prices), f"expected value for {prices} should be {_ref(prices)}"
def _breaks(prices, want):
    try:
        return max_profit(list(prices)) != want
    except Exception:
        return True
assert any(_breaks(p, w) for p, w in cases), "none of your cases break max_profit"`,
      ),
    ],
    hints: ['What does the first line assume about the length?', 'Also try prices that only go down: what should the answer be, and what does this return?'],
    explanation: 'Two separate bugs: one price raises IndexError on `prices[1]`, and falling prices return a negative number. Writing the cases first is how you catch both before the interviewer does.',
    signature: 'write-test:profit',
    minutes: 4,
  }),
  debug({
    id: 'o11-dbg-profit',
    title: 'Fix it: profit',
    skills: ['edge_cases', 'state_tracking'],
    ...R,
    prompt: 'Now make it correct: return the best profit from one buy followed by a later sell, or 0 if no profit is possible. `prices` is never empty.',
    brokenCode: `def max_profit(prices):
    best = prices[1] - prices[0]
    low = min(prices[0], prices[1])
    for p in prices[2:]:
        best = max(best, p - low)
        low = min(low, p)
    return best
`,
    solution: `def max_profit(prices):
    best = 0
    low = prices[0]
    for p in prices:
        best = max(best, p - low)
        low = min(low, p)
    return best
`,
    tests: [
      t.eq('max_profit([7])', '0'),
      t.eq('max_profit([7, 1, 5, 3, 6, 4])', '5'),
      t.eq('max_profit([5, 3])', '0'),
      t.hidden('max_profit([1, 2])', '1'),
      t.hidden('max_profit([9, 7, 4, 1])', '0'),
      t.hidden('max_profit([2, 4, 1, 3])', '2'),
    ],
    hints: ['Your edge cases from the last rep are the tests.', 'Start from "no trade" and the first price, then look at every price.'],
    explanation: '`best = 0` encodes "you may choose not to trade", and starting `low` at `prices[0]` with a loop over all prices removes the length assumption.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    signature: 'debug:profit-init',
    minutes: 4,
  }),
  write({
    id: 'o11-wt-bsearch',
    title: 'Break it: binary search',
    skills: ['edge_cases', 'search_invariant'],
    ...W,
    prompt:
      '`search(nums, target)` should return the index of `target` in the sorted, distinct list `nums`, or -1.\n\nWrite `edge_cases()` returning at least two `(nums, target, expected)` triples with correct expected values, where at least one makes `search` answer wrong.',
    starterCode: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

def edge_cases():
    pass
`,
    solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

def edge_cases():
    return [
        ([5], 5, 0),
        ([1, 3, 5, 7], 7, 3),
    ]
`,
    tests: [
      t.check(
        'at least two correct cases, one breaks search',
        `cases = edge_cases()
assert isinstance(cases, list) and len(cases) >= 2, "return a list of at least two (nums, target, expected) triples"
for nums, target, want in cases:
    assert list(nums) == sorted(set(nums)), f"{nums} must be sorted with no repeats"
    right = nums.index(target) if target in nums else -1
    assert want == right, f"expected value for search({nums}, {target}) should be {right}"
def _breaks(nums, target, want):
    try:
        return search(list(nums), target) != want
    except Exception:
        return True
assert any(_breaks(n, x, w) for n, x, w in cases), "none of your cases break search"`,
      ),
    ],
    hints: ['Bounds are inclusive. Which ranges does `while lo < hi` never look inside?', 'Try a one-element list, or the target at the very end.'],
    explanation: 'With inclusive bounds the loop stops while one candidate is still unchecked, so a single-element list or a target at the last position is missed.',
    signature: 'write-test:bsearch',
    minutes: 4,
  }),
  debug({
    id: 'o11-edge-bsearch-fix',
    title: 'Fix the binary search',
    skills: ['binary_search', 'search_invariant', 'edge_cases'],
    ...R,
    difficulty: 2,
    prompt: 'This is the search you just broke. Make it return the index of `target` in sorted `nums`, or -1.',
    brokenCode: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    tests: [
      t.eq('search([5], 5)', '0'),
      t.eq('search([1, 3, 5, 7], 7)', '3'),
      t.hidden('search([], 1)', '-1'),
      t.hidden('search([1, 3, 5, 7], 1)', '0'),
      t.hidden('search([1, 3, 5, 7], 4)', '-1'),
      t.hidden('search([2, 4], 4)', '1'),
      t.hidden('search([-5, -2, 0], -5)', '0'),
    ],
    hints: ['Is `hi` an index you still need to check?', 'Inclusive bounds need the loop to run while the range has one element.', 'Change one character.'],
    explanation: 'Inclusive `[lo, hi]` pairs with `lo <= hi` and `hi = mid - 1`. Mixing conventions is the classic off-by-one.',
    signature: 'edge:bsearch-fix',
    minutes: 3,
  }),
  debug({
    id: 'o11-dbg-brackets',
    title: 'Fix it: brackets',
    skills: ['edge_cases', 'matching_pairs', 'stack_push_pop'],
    ...R,
    prompt: 'Return `True` if every bracket in `s` is closed by the matching type in the right order, and nothing is left open.',
    brokenCode: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return True
`,
    solution: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
`,
    tests: [
      t.eq('is_valid("()[]")', 'True'),
      t.eq('is_valid("((")', 'False'),
      t.hidden('is_valid("")', 'True'),
      t.hidden('is_valid(")")', 'False'),
      t.hidden('is_valid("([)]")', 'False'),
      t.hidden('is_valid("{[()]}")', 'True'),
      t.hidden('is_valid("[")', 'False'),
    ],
    hints: ['Run it on `"(("` in your head.', 'What is still on the stack at the end?'],
    explanation: 'Unclosed openers are left on the stack, so the final answer is `not stack`, not `True`.',
    signature: 'debug:stack-leftover',
    minutes: 3,
  }),
  write({
    id: 'o11-edge-second',
    title: 'Second largest distinct',
    skills: ['edge_cases', 'state_tracking', 'conditionals'],
    ...R,
    prompt: 'Return the second largest **distinct** value in `nums`, or `None` if there is not one. Think about empty lists, one value, and repeats before you type.',
    starterCode: `def second_largest(nums):
    pass
`,
    solution: `def second_largest(nums):
    first = second = None
    for n in nums:
        if first is None or n > first:
            first, second = n, first
        elif n != first and (second is None or n > second):
            second = n
    return second
`,
    tests: [
      t.eq('second_largest([4, 1, 3])', '3'),
      t.eq('second_largest([7, 7])', 'None'),
      t.hidden('second_largest([])', 'None'),
      t.hidden('second_largest([5])', 'None'),
      t.hidden('second_largest([-1, -2])', '-2'),
      t.hidden('second_largest([2, 9, 9, 4])', '4'),
      t.hidden('second_largest([1, 2])', '1'),
    ],
    hints: [
      'Repeats of the largest value must not count as the second.',
      'Either dedupe with a set and sort, or track two running values.',
      'When a new max arrives, the old max becomes the second.',
      'Skip values equal to the current max; otherwise update the second if bigger.',
    ],
    explanation: '`sorted(set(nums))` works in O(n log n); the two-variable scan is O(n). Using `None` rather than 0 keeps negatives correct.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    signature: 'edge:second-largest',
    minutes: 4,
  }),
  debug({
    id: 'o11-dbg-touching',
    title: 'Fix it: touching intervals',
    skills: ['edge_cases', 'interval_overlap', 'sorting'],
    ...R,
    prompt: 'Merge overlapping intervals and return them sorted by start. Intervals that only touch, like `[1, 3]` and `[3, 5]`, count as overlapping. Input is non-empty.',
    brokenCode: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    out = [intervals[0]]
    for start, end in intervals[1:]:
        if start < out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out
`,
    solution: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    out = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out
`,
    tests: [
      t.eq('merge([[1, 4], [2, 3]])', '[[1, 4]]'),
      t.eq('merge([[1, 3], [3, 5]])', '[[1, 5]]'),
      t.hidden('merge([[5, 6], [1, 2]])', '[[1, 2], [5, 6]]'),
      t.hidden('merge([[1, 2], [2, 3], [3, 4]])', '[[1, 4]]'),
      t.hidden('merge([[4, 4]])', '[[4, 4]]'),
      t.hidden('merge([[1, 10], [2, 3], [4, 5]])', '[[1, 10]]'),
    ],
    hints: ['Try `[[1, 3], [3, 5]]` by hand.', 'What should happen when the start equals the last end?'],
    explanation: 'Touching means `start == end` must merge, so the test is `<=`. Always ask the interviewer whether touching intervals overlap.',
    signature: 'debug:interval-touching',
    minutes: 3,
  }),
  debug({
    id: 'o11-dbg-empty-grid',
    title: 'Fix it: empty grid',
    skills: ['edge_cases', 'grid_nested'],
    ...R,
    prompt: 'Return the total of all values in `grid`, a list of equal-length rows of numbers. An empty grid (`[]`) has total 0.',
    brokenCode: `def grid_total(grid):
    rows, cols = len(grid), len(grid[0])
    return sum(grid[r][c] for r in range(rows) for c in range(cols))
`,
    solution: `def grid_total(grid):
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    return sum(grid[r][c] for r in range(rows) for c in range(cols))
`,
    tests: [
      t.eq('grid_total([[1, 1], [0, 1]])', '3'),
      t.eq('grid_total([])', '0'),
      t.hidden('grid_total([[5]])', '5'),
      t.hidden('grid_total([[0, 0, 0]])', '0'),
      t.hidden('grid_total([[1], [2], [3]])', '6'),
    ],
    hints: ['Which line touches `grid[0]`?', 'Guard before indexing.'],
    explanation: '`grid[0]` on an empty grid raises IndexError. A one-line guard is cheap; ask whether empty input is allowed.',
    signature: 'debug:empty-grid',
    minutes: 2.5,
  }),
  write({
    id: 'o11-edge-kth-end',
    title: 'k-th node from the end',
    skills: ['edge_cases', 'linked_list_traversal', 'two_pointer'],
    ...R,
    difficulty: 3,
    prompt:
      'Return the value of the k-th node from the end of a linked list (`k = 1` is the last node). Return `None` if the list is shorter than `k`. One pass if you can.',
    starterCode: `def kth_from_end(head, k):
    pass
`,
    solution: `def kth_from_end(head, k):
    lead = head
    for _ in range(k):
        if lead is None:
            return None
        lead = lead.next
    trail = head
    while lead:
        lead = lead.next
        trail = trail.next
    return trail.val
`,
    tests: [
      t.eq('kth_from_end(build_list([1, 2, 3, 4]), 1)', '4'),
      t.eq('kth_from_end(build_list([1, 2, 3, 4]), 2)', '3'),
      t.hidden('kth_from_end(build_list([1, 2, 3]), 3)', '1'),
      t.hidden('kth_from_end(build_list([1, 2, 3]), 4)', 'None'),
      t.hidden('kth_from_end(build_list([]), 1)', 'None'),
      t.hidden('kth_from_end(build_list([9]), 1)', '9'),
    ],
    hints: [
      'Two pointers a fixed distance apart.',
      'Move a lead pointer k steps first; if it falls off early, the list is too short.',
      'Then move both until the lead is None.',
      'lead = head; k steps (return None if lead is None); trail = head; advance both; return trail.val.',
    ],
    explanation: 'Keeping a gap of k means the trail lands on the k-th from the end when the lead runs off. Checking before each lead step handles k larger than the list.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    signature: 'edge:kth-from-end',
    minutes: 5,
  }),
  write({
    id: 'o11-wt-two-sum',
    title: 'Break it: pair sum',
    skills: ['edge_cases', 'index_map', 'complement'],
    ...W,
    prompt:
      '`two_sum(nums, target)` should return two **different** indexes whose values add to `target` (an answer always exists).\n\nWrite `edge_cases()` returning at least two `(nums, target)` pairs that each have an answer, where at least one makes `two_sum` return something invalid.',
    starterCode: `def two_sum(nums, target):
    pos = {n: i for i, n in enumerate(nums)}
    for i, n in enumerate(nums):
        if target - n in pos:
            return [i, pos[target - n]]
    return []

def edge_cases():
    pass
`,
    solution: `def two_sum(nums, target):
    pos = {n: i for i, n in enumerate(nums)}
    for i, n in enumerate(nums):
        if target - n in pos:
            return [i, pos[target - n]]
    return []

def edge_cases():
    return [
        ([3, 2, 4], 6),
        ([2, 7, 11], 9),
    ]
`,
    tests: [
      t.check(
        'at least two solvable cases, one breaks two_sum',
        `cases = edge_cases()
assert isinstance(cases, list) and len(cases) >= 2, "return a list of at least two (nums, target) pairs"
for nums, target in cases:
    ok = any(nums[i] + nums[j] == target for i in range(len(nums)) for j in range(i + 1, len(nums)))
    assert ok, f"{nums} has no pair adding to {target}"
def _breaks(nums, target):
    try:
        r = two_sum(list(nums), target)
        i, j = r
        return i == j or nums[i] + nums[j] != target
    except Exception:
        return True
assert any(_breaks(n, x) for n, x in cases), "none of your cases break two_sum"`,
      ),
    ],
    hints: ['Can a number be paired with itself here?', 'Look for a target that is exactly twice one of the values.'],
    explanation: 'With every value preloaded, `3` finds `6 - 3 = 3` at its own index and returns `[0, 0]`. The one-pass version checks the map before inserting, so self-pairing is impossible.',
    signature: 'write-test:self-pair',
    minutes: 3.5,
  }),
]

// ---------------------------------------------------------------------------
// Complexity
// ---------------------------------------------------------------------------

const BIG_O = { stage: 'retrieval', repType: 'cold' } as const

const complexity: Exercise[] = [
  write({
    id: 'o11-opt-common',
    title: 'Make it linear',
    skills: ['hash_reasoning', 'set_membership', 'complexity'],
    ...R,
    style: 'optimize',
    difficulty: 2,
    prompt:
      'This returns the items of `a` that also appear in `b`, in the order of `a` (repeats in `a` kept). It is O(n·m) because `x in b` scans a list. Rewrite it to run in O(n + m) with the same output.',
    starterCode: `def common(a, b):
    out = []
    for x in a:
        if x in b:
            out.append(x)
    return out
`,
    solution: `def common(a, b):
    lookup = set(b)
    out = []
    for x in a:
        if x in lookup:
            out.append(x)
    return out
`,
    tests: [
      t.eq('common([1, 2, 3, 2], [2, 3])', '[2, 3, 2]'),
      t.check(
        'never scans b with `in`',
        `class _NoScan(list):
    def __contains__(self, x):
        raise AssertionError("x in b scans the whole list: build a set from b first")
assert common([1, 2, 3, 2], _NoScan([2, 3])) == [2, 3, 2]
assert common([], _NoScan([1])) == []`,
      ),
      t.hidden('common([4, 5], [])', '[]'),
      t.hidden('common(["a", "b"], ["b", "b"])', '["b"]'),
    ],
    hints: ['Which operation runs n times and costs O(m) each?', 'Build a set from `b` once, before the loop.'],
    explanation: 'One O(m) pass builds the set and each lookup is then O(1) on average: O(n + m) time, O(m) extra space. Spot "`in` on a list inside a loop" on sight.',
    complexity: { time: 'O(n + m)', space: 'O(m)' },
    signature: 'optimize:list-to-set',
    minutes: 3,
  }),
  choice({
    id: 'o11-cx-heap-k',
    title: 'Size-k heap',
    skills: ['complexity', 'top_k'],
    ...BIG_O,
    prompt: 'You just kept a size-k heap for the closest points. Same shape here: n numbers, heap capped at size k. Time complexity?',
    code: `import heapq

def k_largest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap`,
    options: ['O(n log n)', 'O(n log k)', 'O(k log n)', 'O(n * k)'],
    answer: 1,
    explanation: 'Each of n items costs a push and maybe a pop on a heap of at most k + 1 items: O(log k) each.',
    signature: 'complexity:heap-size-k',
  }),
  choice({
    id: 'o11-cx-subsets',
    title: 'All subsets',
    skills: ['complexity', 'backtracking_state'],
    ...BIG_O,
    prompt: 'You just generated every subset. Time complexity of this version for n numbers?',
    code: `def subsets(nums):
    out, path = [], []
    def dfs(i):
        if i == len(nums):
            out.append(path[:])
            return
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return out`,
    options: ['O(n^2)', 'O(n * 2^n)', 'O(n!)', 'O(n log n)'],
    answer: 1,
    explanation: 'There are 2^n subsets and copying each `path[:]` costs up to n.',
    signature: 'complexity:subsets',
  }),
  choice({
    id: 'o11-cx-memo',
    title: 'Memoized recursion',
    skills: ['complexity', 'memoization'],
    ...BIG_O,
    prompt: 'You just solved a one-dimensional DP bottom-up. Here is the top-down version of a similar recurrence: time complexity of `ways(n)`?',
    code: `def ways(n):
    memo = {}
    def go(i):
        if i <= 1:
            return 1
        if i in memo:
            return memo[i]
        memo[i] = go(i - 1) + go(i - 2)
        return memo[i]
    return go(n)`,
    options: ['O(2^n)', 'O(n)', 'O(n^2)', 'O(log n)'],
    answer: 1,
    explanation: 'Each i from 2 to n is computed once and every later request is a dict hit. Without the memo it would be O(2^n).',
    signature: 'complexity:memo-linear',
  }),
  choice({
    id: 'o11-cx-tree-space',
    title: 'Space of tree recursion',
    skills: ['complexity', 'tree_dfs'],
    ...BIG_O,
    prompt: 'Your path-sum solution recursed down the tree with no extra data structure. Extra space used by this function (n nodes, height h)?',
    code: `def depth(root):
    if root is None:
        return 0
    return 1 + max(depth(root.left), depth(root.right))`,
    options: ['O(1)', 'O(h): O(log n) balanced, O(n) for a chain', 'O(n log n)', 'O(2^h)'],
    answer: 1,
    explanation: 'The call stack holds one frame per level on the current path. "O(1) because I made no data structure" is the trap.',
    signature: 'complexity:recursion-stack',
  }),
  choice({
    id: 'o11-cx-grid-bfs',
    title: 'Grid traversal',
    skills: ['complexity', 'bfs'],
    ...BIG_O,
    prompt: 'You just counted islands. Assume a traversal from every unvisited land cell, marking cells visited when queued. Time complexity on an R × C grid?',
    code: `for r in range(rows):
    for c in range(cols):
        if grid[r][c] == "1" and (r, c) not in seen:
            seen.add((r, c))
            bfs(r, c)   # visits each reachable cell once, using seen`,
    options: ['O(R * C)', 'O((R * C)^2)', 'O(R + C)', 'O(4^(R * C))'],
    answer: 0,
    explanation: 'The outer loops look at each cell once and the shared `seen` set means each cell is queued at most once across all BFS calls, with 4 neighbor checks each.',
    signature: 'complexity:grid-traversal',
  }),
  choice({
    id: 'o11-cx-pop-front',
    title: 'pop(0) in a loop',
    skills: ['complexity', 'queue_deque'],
    ...BIG_O,
    prompt: 'You just rotated a deque with `popleft()`. Why not a list? Time complexity of this for n numbers?',
    code: `def drain(nums):
    total = 0
    while nums:
        total += nums.pop(0)
    return total`,
    options: ['O(n)', 'O(n^2)', 'O(n log n)', 'O(1)'],
    answer: 1,
    explanation: '`pop(0)` shifts every remaining element left, O(n) each time. That is why BFS uses `deque.popleft()`.',
    signature: 'complexity:list-pop-front',
  }),
  explain({
    id: 'o11-cx-window-explain',
    title: 'Justify the window',
    skills: ['complexity', 'sliding_window', 'explanation'],
    prompt: 'The interviewer says: "There is a loop inside a loop, so this is O(n^2), right?" Answer out loud, then write your answer: time and space, and why.',
    code: `def longest_unique(s):
    seen = set()
    left = best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best`,
    rubric: [
      'Time is O(n), not O(n^2).',
      '`left` only moves forward, so across the whole run the inner while executes at most n times in total (amortized).',
      'Each character is added once and removed at most once.',
      'Space is O(min(n, alphabet size)) for the set.',
    ],
    explanation: 'Counting total pointer movement, not loop nesting, is the move that shows you understand amortized analysis.',
    signature: 'explain:complexity-window',
    minutes: 4,
  }),
  explain({
    id: 'o11-cx-graph-explain',
    title: 'Justify a graph traversal',
    skills: ['complexity', 'graph_adjacency', 'explanation'],
    prompt: 'State the time and space of this function in terms of n courses and e prerequisite pairs, and justify each term.',
    code: `from collections import deque

def can_finish(n, prereqs):
    graph = {i: [] for i in range(n)}
    indeg = [0] * n
    for course, pre in prereqs:
        graph[pre].append(course)
        indeg[course] += 1
    queue = deque(i for i in range(n) if indeg[i] == 0)
    done = 0
    while queue:
        node = queue.popleft()
        done += 1
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    return done == n`,
    rubric: [
      'Time O(n + e).',
      'Building the graph touches each edge once; the n term comes from creating the lists and in-degree array.',
      'Each node enters the queue at most once, and each edge is decremented once when its source is popped.',
      'Space O(n + e) for the adjacency lists, plus O(n) for the queue and in-degrees.',
    ],
    explanation: 'For any graph traversal the answer is "every vertex once, every edge once": O(V + E).',
    signature: 'explain:complexity-graph',
    minutes: 4,
  }),
]

// ---------------------------------------------------------------------------
// Mixed pattern reps: the prompt does not name the pattern.
// ---------------------------------------------------------------------------

const P = { stage: 'pattern', repType: 'pattern' } as const

const mixed: Exercise[] = [
  write({
    id: 'o11-mix-nearby-repeat',
    title: 'Nearby repeat',
    skills: ['index_map', 'enumerate', 'early_return'],
    ...P,
    difficulty: 3,
    prompt: 'Return `True` if some value appears at two different positions `i` and `j` with `abs(i - j) <= k`.',
    starterCode: `def nearby_repeat(nums, k):
    pass
`,
    solution: `def nearby_repeat(nums, k):
    last = {}
    for i, n in enumerate(nums):
        if n in last and i - last[n] <= k:
            return True
        last[n] = i
    return False
`,
    tests: [
      t.eq('nearby_repeat([1, 2, 3, 1], 3)', 'True'),
      t.eq('nearby_repeat([1, 2, 3, 1], 2)', 'False'),
      t.hidden('nearby_repeat([], 1)', 'False'),
      t.hidden('nearby_repeat([5, 5], 0)', 'False'),
      t.hidden('nearby_repeat([5, 5], 1)', 'True'),
      t.hidden('nearby_repeat([1, 0, 1, 1], 1)', 'True'),
      t.hidden('nearby_repeat([4], 3)', 'False'),
    ],
    hints: [
      'For each value you only care about where you saw it most recently.',
      'A dict from value to index.',
      'Check the distance to the stored index, then overwrite it with the current one.',
      'for i, n in enumerate(nums): if n in last and i - last[n] <= k: return True; last[n] = i.',
    ],
    explanation: 'Keeping the most recent index is enough: an older occurrence is always farther away.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    signature: 'index-map:nearby-repeat',
    minutes: 5,
  }),
  write({
    id: 'o11-mix-sorted-squares',
    title: 'Squares in order',
    skills: ['two_pointer', 'pointer_update', 'range'],
    ...P,
    difficulty: 3,
    prompt: '`nums` is sorted ascending and may contain negatives. Return the squares of the numbers, sorted ascending, in O(n) without calling sort.',
    starterCode: `def sorted_squares(nums):
    pass
`,
    solution: `def sorted_squares(nums):
    out = [0] * len(nums)
    lo, hi = 0, len(nums) - 1
    for pos in range(len(nums) - 1, -1, -1):
        if abs(nums[lo]) > abs(nums[hi]):
            out[pos] = nums[lo] ** 2
            lo += 1
        else:
            out[pos] = nums[hi] ** 2
            hi -= 1
    return out
`,
    tests: [
      t.eq('sorted_squares([-4, -1, 0, 3, 10])', '[0, 1, 9, 16, 100]'),
      t.eq('sorted_squares([-3, -2])', '[4, 9]'),
      t.hidden('sorted_squares([])', '[]'),
      t.hidden('sorted_squares([2])', '[4]'),
      t.hidden('sorted_squares([-5, -5, 5])', '[25, 25, 25]'),
      t.hidden('sorted_squares([0, 1, 2])', '[0, 1, 4]'),
    ],
    hints: [
      'Where can the largest square be?',
      'It is at one of the two ends.',
      'Compare `abs` of both ends, place the bigger square at the back of the output, move that end inward.',
      'Fill `out` from the last position down to 0 with two indexes closing in.',
    ],
    explanation: 'The biggest magnitudes sit at the ends, so two pointers moving inward produce squares from largest to smallest.',
    complexity: { time: 'O(n)', space: 'O(n) for the output' },
    signature: 'two-pointer:sorted-squares',
    minutes: 6,
  }),
  write({
    id: 'o11-mix-two-kinds',
    title: 'At most two kinds',
    skills: ['sliding_window', 'window_state', 'frequency_map'],
    ...P,
    difficulty: 3,
    prompt: 'Return the length of the longest contiguous stretch of `items` that contains at most two distinct values.',
    starterCode: `def longest_two_kinds(items):
    pass
`,
    solution: `def longest_two_kinds(items):
    counts = {}
    left = best = 0
    for right, x in enumerate(items):
        counts[x] = counts.get(x, 0) + 1
        while len(counts) > 2:
            y = items[left]
            counts[y] -= 1
            if counts[y] == 0:
                del counts[y]
            left += 1
        best = max(best, right - left + 1)
    return best
`,
    tests: [
      t.eq('longest_two_kinds([1, 2, 1])', '3'),
      t.eq('longest_two_kinds([0, 1, 2, 2])', '3'),
      t.hidden('longest_two_kinds([])', '0'),
      t.hidden('longest_two_kinds([7])', '1'),
      t.hidden('longest_two_kinds([1, 2, 3, 2, 2])', '4'),
      t.hidden('longest_two_kinds([3, 3, 3, 1, 2, 1, 1, 2, 3, 3, 4])', '5'),
      t.hidden('longest_two_kinds([1, 2, 1, 2, 1, 2])', '6'),
    ],
    hints: [
      'Contiguous + "longest" + a validity rule.',
      'Keep counts of what is inside the current stretch.',
      'When more than two keys are present, shrink from the left, deleting keys whose count hits 0.',
      'Grow right each step, shrink while invalid, record right - left + 1.',
    ],
    explanation: 'A set is not enough here because a value can appear several times inside the window; counts tell you when it fully leaves.',
    complexity: { time: 'O(n)', space: 'O(1) (at most 3 keys)' },
    signature: 'window:at-most-k-distinct',
    minutes: 7,
  }),
  write({
    id: 'o11-mix-first-at-least',
    title: 'First position at least target',
    skills: ['binary_search', 'mid_calc', 'search_invariant'],
    ...P,
    difficulty: 3,
    prompt: '`nums` is sorted ascending (duplicates allowed). Return the first index `i` with `nums[i] >= target`, or `len(nums)` if there is none. O(log n).',
    starterCode: `def first_at_least(nums, target):
    pass
`,
    solution: `def first_at_least(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
`,
    tests: [
      t.eq('first_at_least([1, 3, 5, 6], 5)', '2'),
      t.eq('first_at_least([1, 3, 5, 6], 2)', '1'),
      t.hidden('first_at_least([1, 3, 5, 6], 7)', '4'),
      t.hidden('first_at_least([1, 3, 5, 6], 0)', '0'),
      t.hidden('first_at_least([], 3)', '0'),
      t.hidden('first_at_least([2, 2, 2], 2)', '0'),
      t.hidden('first_at_least([1, 2, 2, 3], 3)', '3'),
    ],
    hints: [
      'Sorted input + O(log n).',
      'The answer can be `len(nums)`, so let `hi` start there (half-open range).',
      'If `nums[mid] < target`, the answer is right of mid; otherwise mid itself might be the answer.',
      'while lo < hi: mid; lo = mid + 1 or hi = mid; return lo.',
    ],
    explanation: 'The half-open `[lo, hi)` version never skips a candidate: `hi = mid` keeps mid in play, and the loop ends when one position is left.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    signature: 'bsearch:lower-bound',
    minutes: 6,
  }),
  write({
    id: 'o11-mix-path-sum',
    title: 'Root-to-leaf total',
    skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
    ...P,
    difficulty: 3,
    prompt: 'Return `True` if some path from the root down to a **leaf** has values adding up to `target`. An empty tree has no paths.',
    starterCode: `def has_path_sum(root, target):
    pass
`,
    solution: `def has_path_sum(root, target):
    if root is None:
        return False
    if root.left is None and root.right is None:
        return root.val == target
    rest = target - root.val
    return has_path_sum(root.left, rest) or has_path_sum(root.right, rest)
`,
    tests: [
      t.eq('has_path_sum(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2, None, None, None, 1]), 22)', 'True'),
      t.eq('has_path_sum(build_tree([1, 2, 3]), 5)', 'False'),
      t.hidden('has_path_sum(build_tree([]), 0)', 'False'),
      t.hidden('has_path_sum(build_tree([1, 2]), 1)', 'False'),
      t.hidden('has_path_sum(build_tree([-2, None, -3]), -5)', 'True'),
      t.hidden('has_path_sum(build_tree([7]), 7)', 'True'),
      t.hidden('has_path_sum(build_tree([1, 2, 3]), 4)', 'True'),
    ],
    hints: [
      'Each child faces the same question with a smaller target.',
      'Two base cases: None, and a leaf.',
      'Subtract the current value and ask the children; combine with `or`.',
      'None → False; leaf → val == target; else recurse on both children with target - val.',
    ],
    explanation: 'The leaf check matters: in [1, 2] with target 1, the root alone is not a root-to-leaf path because it has a child.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    signature: 'tree-dfs:path-sum',
    minutes: 6,
  }),
  write({
    id: 'o11-mix-groups',
    title: 'Count friend groups',
    skills: ['connected_components', 'graph_adjacency', 'visited_set'],
    ...P,
    difficulty: 3,
    prompt: 'There are `n` people labeled `0..n-1`. Each pair in `edges` are friends (both ways). Friends of friends are in the same group. How many groups are there?',
    starterCode: `def count_groups(n, edges):
    pass
`,
    solution: `def count_groups(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    seen = set()
    groups = 0
    for start in range(n):
        if start in seen:
            continue
        groups += 1
        seen.add(start)
        stack = [start]
        while stack:
            node = stack.pop()
            for nxt in graph[node]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
    return groups
`,
    tests: [
      t.eq('count_groups(5, [[0, 1], [1, 2], [3, 4]])', '2'),
      t.eq('count_groups(3, [])', '3'),
      t.hidden('count_groups(1, [])', '1'),
      t.hidden('count_groups(4, [[0, 1], [1, 2], [2, 3], [3, 0]])', '1'),
      t.hidden('count_groups(0, [])', '0'),
      t.hidden('count_groups(6, [[0, 1], [2, 3], [4, 5], [1, 0]])', '3'),
    ],
    hints: [
      'People are nodes, friendships are edges.',
      'Build an adjacency list for every label, including people with no friends.',
      'Each time you find an unvisited person, that is a new group: flood it.',
      'for each start not seen: groups += 1; DFS/BFS marking everything reachable.',
    ],
    explanation: 'Every traversal started from an unvisited node discovers exactly one new component. Initializing the dict for all n keeps isolated people.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    signature: 'graph:count-components',
    minutes: 7,
  }),
  write({
    id: 'o11-mix-k-closest',
    title: 'Closest k points',
    skills: ['top_k', 'heap_push_pop', 'tuples'],
    ...P,
    difficulty: 3,
    prompt:
      'Given points `[x, y]`, return the `k` points closest to `(0, 0)` as a list of `[x, y]` lists, in any order. Aim for better than sorting everything when k is small. Assume there are no distance ties at the cut-off.',
    starterCode: `def k_closest(points, k):
    pass
`,
    solution: `import heapq

def k_closest(points, k):
    heap = []
    for x, y in points:
        heapq.heappush(heap, (-(x * x + y * y), x, y))
        if len(heap) > k:
            heapq.heappop(heap)
    return [[x, y] for _, x, y in heap]
`,
    tests: [
      t.eq('k_closest([[1, 3], [-2, 2]], 1)', '[[-2, 2]]', { compare: 'unordered' }),
      t.eq('k_closest([[3, 3], [5, -1], [-2, 4]], 2)', '[[3, 3], [-2, 4]]', { compare: 'unordered' }),
      t.hidden('k_closest([[0, 0]], 1)', '[[0, 0]]', { compare: 'unordered' }),
      t.hidden('k_closest([[1, 1], [2, 2], [3, 3]], 3)', '[[1, 1], [2, 2], [3, 3]]', { compare: 'unordered' }),
      t.hidden('k_closest([[5, 5], [1, 0], [0, -2], [4, 4]], 2)', '[[1, 0], [0, -2]]', { compare: 'unordered' }),
      t.hidden('k_closest([[1, 2]], 0)', '[]', { compare: 'unordered' }),
    ],
    hints: [
      'You never need the square root to compare distances.',
      'Keep only k candidates; evict the worst one.',
      'heapq is a min-heap, so push the negated distance to make the farthest point pop first.',
      'push (-dist, x, y); if len > k pop; return the remaining points.',
    ],
    explanation: 'A size-k max-heap (negated min-heap) gives O(n log k). Sorting by `x*x + y*y` is O(n log n) and a fine first answer to state.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    signature: 'heap:k-closest',
    minutes: 6,
  }),
  write({
    id: 'o11-mix-cheapest-climb',
    title: 'Cheapest climb',
    skills: ['recurrence', 'dp_table', 'state_tracking'],
    ...P,
    difficulty: 3,
    prompt:
      'You stand before a staircase. `cost[i]` is what you pay when you step **off** step `i`. You may start on step 0 or step 1, and each move goes up 1 or 2 steps. Return the minimum total cost to reach the top, just past the last step. `len(cost) >= 2`.',
    starterCode: `def cheapest_climb(cost):
    pass
`,
    solution: `def cheapest_climb(cost):
    a, b = 0, 0
    for i in range(2, len(cost) + 1):
        a, b = b, min(b + cost[i - 1], a + cost[i - 2])
    return b
`,
    tests: [
      t.eq('cheapest_climb([10, 15, 20])', '15'),
      t.eq('cheapest_climb([1, 100, 1, 1, 1, 100, 1, 1, 100, 1])', '6'),
      t.hidden('cheapest_climb([5, 3])', '3'),
      t.hidden('cheapest_climb([0, 0, 0])', '0'),
      t.hidden('cheapest_climb([2, 2, 2, 2])', '4'),
      t.hidden('cheapest_climb([1, 2])', '1'),
    ],
    hints: [
      'What is the cheapest way to arrive at step i?',
      'You arrive at i from i - 1 or from i - 2.',
      'best[i] = min(best[i-1] + cost[i-1], best[i-2] + cost[i-2]), with best[0] = best[1] = 0.',
      'Fill best up to index len(cost); you only need the last two values.',
    ],
    explanation: 'Same shape as counting stair paths, but min-plus-cost instead of a sum. Two rolling variables replace the table.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    signature: 'dp:min-cost-stairs',
    minutes: 6,
  }),
  write({
    id: 'o11-mix-choose',
    title: 'Pick k of n',
    skills: ['backtracking_state', 'recursion_base_case'],
    ...P,
    difficulty: 3,
    prompt: 'Return every way to choose `k` distinct numbers from `1..n`, each as an ascending list. The order of the lists does not matter.',
    starterCode: `def choose(n, k):
    pass
`,
    solution: `def choose(n, k):
    out, path = [], []
    def dfs(start):
        if len(path) == k:
            out.append(path[:])
            return
        for x in range(start, n + 1):
            path.append(x)
            dfs(x + 1)
            path.pop()
    dfs(1)
    return out
`,
    tests: [
      t.eq('choose(4, 2)', '[[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]', { compare: 'sorted-inner' }),
      t.eq('choose(1, 1)', '[[1]]', { compare: 'sorted-inner' }),
      t.hidden('choose(3, 3)', '[[1, 2, 3]]', { compare: 'sorted-inner' }),
      t.hidden('choose(3, 0)', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('choose(5, 4)', '[[1, 2, 3, 4], [1, 2, 3, 5], [1, 2, 4, 5], [1, 3, 4, 5], [2, 3, 4, 5]]', { compare: 'sorted-inner' }),
      t.hidden('choose(2, 1)', '[[1], [2]]', { compare: 'sorted-inner' }),
    ],
    hints: [
      'Build each answer one number at a time and undo the choice afterwards.',
      'Pass a start value so you only pick larger numbers (no duplicates like [2, 1]).',
      'Base case: the path has k numbers; append a copy.',
      'for x in range(start, n + 1): path.append(x); dfs(x + 1); path.pop().',
    ],
    explanation: 'Choose, recurse, un-choose. `path[:]` is required because `path` keeps changing after you record it.',
    complexity: { time: 'O(k * C(n, k))', space: 'O(k) recursion plus output' },
    signature: 'backtrack:combinations',
    minutes: 7,
  }),
  write({
    id: 'o11-mix-fewest-steps',
    title: 'Fewest steps through a maze',
    skills: ['bfs', 'grid_neighbors', 'visited_set', 'queue_deque'],
    ...P,
    difficulty: 4,
    prompt:
      '`grid` has `0` for open cells and `1` for walls. Moving up, down, left or right, return the fewest moves from the top-left cell to the bottom-right cell, or `-1` if it cannot be reached (including when either corner is a wall).',
    starterCode: `def fewest_steps(grid):
    pass
`,
    solution: `from collections import deque

def fewest_steps(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows - 1][cols - 1] == 1:
        return -1
    queue = deque([(0, 0, 0)])
    seen = {(0, 0)}
    while queue:
        r, c, d = queue.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return d
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc, d + 1))
    return -1
`,
    tests: [
      t.eq('fewest_steps([[0, 0], [0, 0]])', '2'),
      t.eq('fewest_steps([[0, 1], [1, 0]])', '-1'),
      t.hidden('fewest_steps([[0]])', '0'),
      t.hidden('fewest_steps([[1]])', '-1'),
      t.hidden('fewest_steps([[0, 0, 0], [1, 1, 0], [0, 0, 0]])', '4'),
      t.hidden('fewest_steps([[0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 0]])', '10'),
      t.hidden('fewest_steps([[0, 1, 0], [0, 1, 0], [0, 1, 0]])', '-1'),
    ],
    hints: [
      '"Fewest moves" on an unweighted grid.',
      'A queue explores cells in order of distance; store the distance with each cell.',
      'Mark a cell seen when you enqueue it, not when you pop it.',
      'deque([(0, 0, 0)]); pop; return d at the target; push open unseen neighbors with d + 1; -1 at the end.',
    ],
    explanation: 'BFS reaches every cell first by a shortest path, so the first time the target is popped its distance is the answer. DFS would not guarantee that.',
    complexity: { time: 'O(R * C)', space: 'O(R * C)' },
    signature: 'bfs:grid-shortest-path',
    minutes: 8,
  }),
]

// ---------------------------------------------------------------------------
// Say it out loud
// ---------------------------------------------------------------------------

const sayIt: Exercise[] = [
  explain({
    id: 'o11-say-pair-sum',
    title: 'Brute force to optimal',
    skills: ['explanation', 'hash_reasoning', 'complexity'],
    prompt:
      'Prompt: "Given an unsorted list of numbers and a target, return the indexes of two numbers that add to the target." Before any code, say out loud how you get from the obvious solution to the best one. Then write it down.',
    rubric: [
      'States the brute force (check every pair) and its O(n^2) cost first.',
      'Names the bottleneck: for each number, searching for its complement is slow.',
      'Proposes a dict from value to index, checked before inserting, giving O(n) time and O(n) space.',
      'Mentions an edge case: a number paired with itself, or no answer.',
      'Mentions the alternative (sort + two pointers) and why it loses the original indexes.',
    ],
    explanation: 'Interviewers grade the path, not just the destination. Brute force first, then the bottleneck, then the data structure that removes it.',
    signature: 'explain:brute-to-optimal',
    minutes: 4,
  }),
  explain({
    id: 'o11-say-clarify',
    title: 'Clarifying questions',
    skills: ['explanation', 'edge_cases'],
    prompt:
      'You just merged intervals from a blank editor. In the real interview the first two minutes come before the code: write the clarifying questions you would ask for "combine overlapping time ranges", and the inputs you would test with.',
    rubric: [
      'Asks whether the input is sorted.',
      'Asks whether touching ranges like [1, 3] and [3, 5] count as overlapping.',
      'Asks about empty input and a single range.',
      'Asks whether the input may be modified in place, and the output format.',
      'Lists concrete test inputs: nested range, chain of overlaps, disjoint ranges.',
    ],
    explanation: 'Two minutes of questions prevents the one bug you would otherwise ship. It also shows the interviewer how you think.',
    signature: 'explain:clarifying-questions',
    minutes: 4,
  }),
  explain({
    id: 'o11-say-dry-run',
    title: 'Dry-run out loud',
    skills: ['explanation', 'sliding_window', 'window_state'],
    prompt: 'A set-based version of the window you just wrote. Trace it on `"abba"` the way you would for an interviewer: after each character, say `left`, the set, and `best`.',
    code: `def longest_unique(s):
    seen = set()
    left = best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best`,
    rubric: [
      'After "a": left 0, {a}, best 1. After first "b": left 0, {a, b}, best 2.',
      'Second "b": removes "a" then "b", left 2, set {b}, best 2.',
      'Last "a": not in the set, so {a, b}, left 2, window "ba", best stays 2.',
      'Returns 2 and states that the trace confirms the shrink loop.',
    ],
    explanation: 'Tracing a small tricky input after coding catches bugs before the interviewer does, and it shows discipline.',
    signature: 'explain:dry-run',
    minutes: 5,
  }),
  explain({
    id: 'o11-say-stuck',
    title: 'When you are stuck',
    skills: ['explanation', 'complexity'],
    prompt:
      'You have a working O(n^2) solution and no idea how to improve it. Write what you would say and do in the next three minutes instead of going silent.',
    rubric: [
      'States the current solution and its complexity out loud so the interviewer can follow.',
      'Names what is repeated in the inner loop (a search, a sum, a max) and asks what structure would answer it faster.',
      'Runs through the toolkit: hash map/set, sorting, two pointers, window, heap, prefix state.',
      'Offers to code the working solution first if time is short, then optimize.',
      'Welcomes a hint rather than stalling.',
    ],
    explanation: 'Silence is the worst signal. A working solution plus a clear search for the bottleneck scores better than a silent attempt at the optimum.',
    signature: 'explain:stuck-recovery',
    minutes: 4,
  }),
]

// ---------------------------------------------------------------------------
// Assembly. Complexity and "say it out loud" reps are follow-ups placed right
// after the implementation they talk about, never more than two in a row.
// ---------------------------------------------------------------------------

const POOL = new Map([...speed, ...bugs, ...edges, ...complexity, ...mixed, ...sayIt].map((e) => [e.id, e]))

function pick(ids: string[]): Exercise[] {
  return ids.map((id) => {
    const e = POOL.get(id)
    if (!e) throw new Error(`oct11: unknown rep ${id}`)
    return e
  })
}

/** Cold capstones, each followed by its (short) talk-about-it reps. */
const COLD_FOLLOW_UPS: Record<string, string[]> = {
  'two-sum': ['o11-say-pair-sum'],
  'longest-substring': ['o11-cx-window-explain', 'o11-say-dry-run'],
  'number-of-islands': ['o11-cx-grid-bfs'],
  'course-schedule': ['o11-cx-graph-explain'],
  'merge-intervals': ['o11-say-clarify'],
  subsets: ['o11-cx-subsets'],
  'house-robber': ['o11-cx-memo'],
}

function coldSection(): Exercise[] {
  return coldCapstones(COLD_IDS).flatMap((e) => [e, ...pick(COLD_FOLLOW_UPS[e.problemId ?? ''] ?? [])])
}

export const day: DayModule = {
  date: '2026-10-11',
  short: 'Interview',
  title: 'Interview Reps',
  focus: 'No new concepts, maximum reps: fast recall, a debug sprint over every day\'s classic bugs, edge cases written as code, cold capstones from a bare signature, mixed patterns, then two timed mocks.',
  sections: [
    {
      id: 'o11-speed',
      title: 'Python speed round',
      summary: 'Fast mixed primitives from a signature: .get counting, enumerate, deque, heapq, sort keys, grid neighbors.',
      exercises: pick([
        'o11-speed-count',
        'o11-speed-first-seen',
        'o11-speed-last-seen',
        'o11-speed-deque',
        'o11-cx-pop-front',
        'o11-speed-heap-small',
        'o11-speed-heap-tuples',
        'o11-speed-sort-key',
        'o11-speed-slicing',
        'o11-speed-leaderboard',
        'o11-speed-neighbors',
      ]),
    },
    { id: 'o11-debug', title: 'Debug sprint', summary: 'One classic bug from every day. Read the failing test, fix, run, next.', exercises: bugs },
    {
      id: 'o11-edges',
      title: 'Edge cases',
      summary: 'Write the input that breaks the code, then fix the code so it survives it.',
      exercises: edges,
    },
    { id: 'o11-cold', title: 'Cold capstones', summary: 'Core problems from a bare signature, timed, then a short complexity or approach follow-up.', exercises: coldSection() },
    {
      id: 'o11-mixed',
      title: 'Mixed patterns',
      summary: 'Fresh short problems; recognizing the pattern is part of the rep.',
      exercises: pick([
        'o11-mix-nearby-repeat',
        'o11-opt-common',
        'o11-mix-sorted-squares',
        'o11-mix-two-kinds',
        'o11-mix-first-at-least',
        'o11-mix-path-sum',
        'o11-cx-tree-space',
        'o11-mix-k-closest',
        'o11-cx-heap-k',
        'o11-mix-groups',
        'o11-mix-cheapest-climb',
        'o11-mix-choose',
        'o11-mix-fewest-steps',
        'o11-say-stuck',
      ]),
    },
    {
      id: 'o11-name-it',
      title: 'Name the pattern',
      summary: 'No labels: read the problem, find the expensive repeated work, and pick the pattern that makes it cheap.',
      exercises: [
        write({
          id: 'o11-ni-shared',
          title: 'Both playlists',
          skills: ['set_create', 'set_membership', 'list_append', 'hash_reasoning'],
          difficulty: 2,
          prompt: '`a` and `b` are lists of song ids (ints), possibly with repeats. Return the songs that appear in **both**, in the order they first appear in `a`, each listed once. Lists can hold tens of thousands of songs.',
          starterCode: `def in_both(a, b):
    pass
`,
          solution: `def in_both(a, b):
    other = set(b)
    seen = set()
    out = []
    for x in a:
        if x in other and x not in seen:
            seen.add(x)
            out.append(x)
    return out
`,
          tests: [
            t.eq('in_both([3, 1, 3, 2], [2, 3, 9])', '[3, 2]'),
            t.eq('in_both([], [1])', '[]'),
            t.hidden('in_both([1, 2], [3])', '[]'),
            t.hidden('in_both([5, 5, 5], [5])', '[5]'),
            t.hidden('len(in_both(list(range(20000)), list(range(10000, 30000))))', '10000'),
          ],
          hints: ['For each song in `a` you ask "is it in `b`?" How expensive is that question with a list?', 'Make the repeated question O(1).', 'A set of `b`, plus a second set for what you already output.'],
          explanation: 'The repeated work is membership testing. A set turns each check from O(len(b)) into O(1): O(n + m) instead of O(n·m), which matters at this size.',
          complexity: { time: 'O(n + m)', space: 'O(n + m)' },
          signature: 'mixed:set-intersection-ordered',
          minutes: 5,
        }),
        write({
          id: 'o11-ni-two-hops',
          title: 'Friends of friends',
          skills: ['graph_adjacency', 'graph_bfs', 'set_membership'],
          difficulty: 3,
          prompt: 'People are numbered `0..n-1`. `pairs` lists friendships `[a, b]` (friendship goes both ways). Return, sorted, everyone who is a friend of one of `p`\'s friends but is neither `p` nor already `p`\'s friend.',
          starterCode: `def two_away(n, pairs, p):
    pass
`,
          solution: `def two_away(n, pairs, p):
    graph = {i: [] for i in range(n)}
    for a, b in pairs:
        graph[a].append(b)
        graph[b].append(a)
    direct = set(graph[p])
    out = set()
    for f in direct:
        for g in graph[f]:
            if g != p and g not in direct:
                out.add(g)
    return sorted(out)
`,
          tests: [
            t.eq('two_away(5, [[0, 1], [1, 2], [1, 3], [3, 4]], 0)', '[2, 3]'),
            t.eq('two_away(3, [[0, 1], [0, 2], [1, 2]], 0)', '[]'),
            t.hidden('two_away(1, [], 0)', '[]'),
            t.hidden('two_away(4, [[0, 1], [1, 2], [2, 3]], 0)', '[2]'),
            t.hidden('two_away(5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]], 0)', '[3]'),
          ],
          hints: ['Draw the friendships. What shape is this data?', 'You keep asking "who are X\'s friends?" Store the answer for every person once.', 'Adjacency list, then look one ring further out than the direct friends.'],
          explanation: 'The pairs describe a graph. An adjacency list makes "friends of X" a lookup; "exactly two away" is the second BFS ring, minus `p` and the first ring.',
          complexity: { time: 'O(n + e)', space: 'O(n + e)' },
          signature: 'mixed:graph-second-ring',
          minutes: 7,
        }),
        write({
          id: 'o11-ni-streak',
          title: 'Longest streak with one slip',
          skills: ['sliding_window', 'window_state', 'enumerate'],
          difficulty: 3,
          prompt: '`days` is a list of `1` (practiced) and `0` (missed). One missed day can be forgiven. Return the length of the longest run of **consecutive** days that contains at most one `0`.',
          starterCode: `def best_streak(days):
    pass
`,
          solution: `def best_streak(days):
    left = 0
    zeros = 0
    best = 0
    for right, d in enumerate(days):
        if d == 0:
            zeros += 1
        while zeros > 1:
            if days[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
`,
          tests: [
            t.eq('best_streak([1, 1, 0, 1, 1, 1, 0, 1])', '6'),
            t.eq('best_streak([0, 0, 0])', '1'),
            t.hidden('best_streak([])', '0'),
            t.hidden('best_streak([1, 1, 1])', '3'),
            t.hidden('best_streak([0, 1, 0, 1, 0])', '3'),
            t.hidden('best_streak([1, 0, 0, 1])', '2'),
          ],
          hints: ['Checking every start and end re-scans the same days again and again.', 'Keep one stretch and extend it to the right; what makes it invalid?', 'Track how many zeros the stretch holds; while it is more than one, move the left edge.'],
          explanation: 'A contiguous run with a limit on what it may contain is a variable sliding window: each day enters once and leaves once, O(n) instead of O(n²).',
          complexity: { time: 'O(n)', space: 'O(1)' },
          signature: 'mixed:window-at-most-one-zero',
          minutes: 7,
        }),
        write({
          id: 'o11-ni-latest-at-or-before',
          title: 'Latest reading at or before',
          skills: ['binary_search', 'search_invariant'],
          difficulty: 3,
          prompt: '`times` holds distinct reading times in increasing order. For each time in `queries`, return the **index** of the latest reading at or before it, or `-1` if there is none. There can be hundreds of thousands of readings and thousands of queries.',
          starterCode: `def latest_before(times, queries):
    pass
`,
          solution: `def latest_before(times, queries):
    out = []
    for q in queries:
        lo, hi = 0, len(times) - 1
        ans = -1
        while lo <= hi:
            mid = (lo + hi) // 2
            if times[mid] <= q:
                ans = mid
                lo = mid + 1
            else:
                hi = mid - 1
        out.append(ans)
    return out
`,
          tests: [
            t.eq('latest_before([1, 4, 9], [0, 4, 5, 10])', '[-1, 1, 1, 2]'),
            t.eq('latest_before([], [3])', '[-1]'),
            t.hidden('latest_before([2], [2, 1])', '[0, -1]'),
            t.hidden('latest_before(list(range(0, 400000, 2)), list(range(0, 400000, 80)))[-1]', '199960'),
          ],
          hints: ['A scan per query repeats a lot of work. What do you know about `times`?', 'Sorted data and a yes/no question about each position: "is this reading at or before q?"', 'Binary search for the last index where `times[mid] <= q`, remembering the best index so far.'],
          explanation: 'The input is sorted, and the question is monotonic (true, then false), so each query is O(log n). A dict does not help: queries rarely match a reading exactly.',
          complexity: { time: 'O(q log n)', space: 'O(q)' },
          signature: 'mixed:binary-search-last-at-most',
          minutes: 7,
        }),
      ],
    },
  ],
  capstones: [],
  mocks: ['mock-1', 'mock-2'],
}
