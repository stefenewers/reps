import type { DayModule, Exercise } from '@/lib/types'
import { choice, code, explain, fill, output, t } from './build'
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
    out.push({
      ...cap,
      id: 'cold-' + id,
      title: cap.title + ' (cold)',
      stage: 'retrieval',
      repType: 'cold',
      note: undefined,
      minutes: Math.min(cap.minutes, 20),
      signature: cap.signature,
      prompt: 'Cold rep. No scaffolding — write it from a blank editor.\n\n' + cap.prompt,
      starterCode: header ? header + '\n    pass\n' : cap.starterCode,
      review: { important: true },
    })
  }
  return out
}

const COLD_IDS = [
  'two-sum',
  'longest-substring',
  'valid-parentheses',
  'reverse-linked-list',
  'number-of-islands',
  'course-schedule',
  'top-k-frequent',
  'merge-intervals',
  'subsets',
]

// ---------------------------------------------------------------------------
// Python speed round
// ---------------------------------------------------------------------------

const speed: Exercise[] = [
  fill({
    id: 'o11-speed-count',
    title: 'Count with .get',
    skills: ['frequency_map', 'dict_get'],
    ...R,
    prompt: 'Fill the blank so `counts` maps each word to how many times it appears.',
    starterCode: `words = ["go", "py", "go", "go", "py", "js"]
counts = {}
for w in words:
    counts[w] = ____
`,
    solution: `words = ["go", "py", "go", "go", "py", "js"]
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
`,
    tests: [t.check('counts', 'assert counts == {"go": 3, "py": 2, "js": 1}')],
    hints: ['Default to 0 when the word is new, then add one.'],
    explanation: '`.get(w, 0)` returns 0 for a missing key, so the same line handles first sightings and repeats.',
    signature: 'freq-map:count-words',
    minutes: 1,
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
// Edge cases
// ---------------------------------------------------------------------------

const edges: Exercise[] = [
  choice({
    id: 'o11-edge-profit',
    title: 'Breaking input: profit',
    skills: ['edge_cases', 'state_tracking'],
    ...R,
    prompt: 'Which input breaks this function?',
    code: `def max_profit(prices):
    best = prices[1] - prices[0]
    low = min(prices[0], prices[1])
    for p in prices[2:]:
        best = max(best, p - low)
        low = min(low, p)
    return best`,
    options: ['[1, 5]', '[3, 8, 2, 9]', '[7]', '[1, 2, 3]'],
    answer: 2,
    explanation: 'A single price raises IndexError on `prices[1]`. It also returns a negative number for falling prices; start with `best = 0` and `low = prices[0]` and loop over everything.',
    signature: 'edge:index-assumption',
  }),
  choice({
    id: 'o11-edge-bsearch',
    title: 'Breaking input: binary search',
    skills: ['edge_cases', 'search_invariant'],
    ...R,
    prompt: 'Which call returns the wrong answer?',
    code: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    options: ['search([1, 3, 5], 3)', 'search([5], 5)', 'search([], 1)', 'search([1, 3, 5], 4)'],
    answer: 1,
    explanation: 'With `hi = len - 1` the range is inclusive, so the loop must be `while lo <= hi`. With `<`, a one-element range is never checked.',
    signature: 'edge:bsearch-loop-condition',
  }),
  code({
    id: 'o11-edge-bsearch-fix',
    title: 'Fix the binary search',
    skills: ['binary_search', 'search_invariant', 'edge_cases'],
    ...R,
    difficulty: 2,
    prompt: 'The starter is the buggy search from the last rep. Fix it so it returns the index of `target` in sorted `nums`, or -1.',
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
  choice({
    id: 'o11-edge-brackets',
    title: 'Breaking input: brackets',
    skills: ['edge_cases', 'matching_pairs'],
    ...R,
    prompt: 'Which input does this checker get wrong?',
    code: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return True`,
    options: ['"()[]"', '"(]"', '"(("', '")"'],
    answer: 2,
    explanation: 'Unclosed openers are left on the stack. The final line must be `return not stack`.',
    signature: 'edge:stack-leftover',
  }),
  choice({
    id: 'o11-edge-intervals',
    title: 'Breaking input: intervals',
    skills: ['edge_cases', 'interval_overlap'],
    ...R,
    prompt: 'Input is non-empty, and touching intervals count as overlapping. Which input gives the wrong answer?',
    code: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    out = [intervals[0]]
    for start, end in intervals[1:]:
        if start < out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out`,
    options: ['[[1, 4], [2, 3]]', '[[1, 3], [3, 5]]', '[[5, 6], [1, 2]]', '[[1, 10], [2, 3], [4, 5]]'],
    answer: 1,
    explanation: 'Touching means `start == end` must merge, so the test is `start <= out[-1][1]`. Always ask the interviewer whether touching intervals overlap.',
    signature: 'edge:interval-touching',
  }),
  code({
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
  choice({
    id: 'o11-edge-grid',
    title: 'Breaking input: grid',
    skills: ['edge_cases', 'grid_nested'],
    ...R,
    prompt: 'Which input makes the first line raise?',
    code: `def count_land(grid):
    rows, cols = len(grid), len(grid[0])
    return sum(grid[r][c] for r in range(rows) for c in range(cols))`,
    options: ['[[0]]', '[]', '[[1, 1], [0, 1]]', '[[0, 0, 0]]'],
    answer: 1,
    explanation: '`grid[0]` on an empty grid raises IndexError. Guard with `if not grid: return 0` when empty input is allowed.',
    signature: 'edge:empty-grid',
  }),
  code({
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
  choice({
    id: 'o11-edge-two-sum',
    title: 'Breaking input: pair sum',
    skills: ['edge_cases', 'index_map', 'complement'],
    ...R,
    prompt: 'This returns two indexes whose values add to `target`. Which call returns a wrong answer?',
    code: `def two_sum(nums, target):
    pos = {n: i for i, n in enumerate(nums)}
    for i, n in enumerate(nums):
        if target - n in pos:
            return [i, pos[target - n]]
    return []`,
    options: ['two_sum([2, 7, 11], 9)', 'two_sum([3, 2, 4], 6)', 'two_sum([3, 3], 6)', 'two_sum([1, 5], 6)'],
    answer: 1,
    explanation: 'For 3 it finds 6 - 3 = 3 at its own index and returns [0, 0]. Checking the map before inserting the current number (one pass) makes self-pairing impossible.',
    signature: 'edge:self-pair',
  }),
]

// ---------------------------------------------------------------------------
// Complexity
// ---------------------------------------------------------------------------

const BIG_O = { stage: 'retrieval', repType: 'cold' } as const

const complexity: Exercise[] = [
  choice({
    id: 'o11-cx-list-in',
    title: 'Membership in a list',
    skills: ['complexity', 'hash_reasoning'],
    ...BIG_O,
    prompt: '`a` and `b` both have n items. Time complexity?',
    code: `def common(a, b):
    out = []
    for x in a:
        if x in b:
            out.append(x)
    return out`,
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'],
    answer: 2,
    explanation: '`x in b` scans the list, O(n) per check. Converting `b` to a set first makes the whole thing O(n).',
    signature: 'complexity:list-membership',
  }),
  choice({
    id: 'o11-cx-sort-scan',
    title: 'Sort then scan',
    skills: ['complexity', 'sorting'],
    ...BIG_O,
    prompt: 'Time complexity?',
    code: `def has_close_pair(nums):
    nums = sorted(nums)
    for i in range(1, len(nums)):
        if nums[i] - nums[i - 1] <= 1:
            return True
    return False`,
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
    answer: 1,
    explanation: 'Sorting costs O(n log n) and dominates the O(n) scan.',
    signature: 'complexity:sort-then-scan',
  }),
  choice({
    id: 'o11-cx-heap-k',
    title: 'Size-k heap',
    skills: ['complexity', 'top_k'],
    ...BIG_O,
    prompt: 'n numbers, heap capped at size k. Time complexity?',
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
    prompt: 'Time complexity for n numbers?',
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
    prompt: 'Time complexity of `ways(n)`?',
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
    prompt: 'Extra space used by this function (n nodes, height h)?',
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
    prompt: 'A BFS from every unvisited land cell, marking cells visited when queued. Time complexity on an R × C grid?',
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
    prompt: 'Time complexity for a list of n numbers?',
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
      'Prompt: "Combine overlapping time ranges." Write the clarifying questions you would ask in the first two minutes, and the inputs you would test with.',
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
    id: 'o11-say-ordering',
    title: 'Is an order possible?',
    skills: ['explanation', 'cycle_detection', 'graph_adjacency'],
    prompt:
      'Prompt: "You have n tasks and pairs [a, b] meaning b must happen before a. Can all tasks be done?" Explain your approach out loud, then write it: how you model it, the algorithm, and the complexity.',
    rubric: [
      'Models tasks as nodes and each pair as a directed edge b → a.',
      'Says the answer is "no" exactly when there is a cycle.',
      'Describes one detection method: in-degree queue (count processed nodes) or DFS with visiting/done states.',
      'States O(n + e) time and space.',
      'Mentions tasks with no pairs and a task depending on itself.',
    ],
    explanation: 'Translating the story into "directed graph, cycle?" is the whole problem. Say that sentence early.',
    signature: 'explain:model-as-graph',
    minutes: 4,
  }),
  explain({
    id: 'o11-say-dry-run',
    title: 'Dry-run out loud',
    skills: ['explanation', 'sliding_window', 'window_state'],
    prompt: 'You just wrote this. Trace it on `"abba"` the way you would for an interviewer: after each character, say `left`, the set, and `best`.',
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

export const day: DayModule = {
  date: '2026-10-11',
  short: 'Interview',
  title: 'Interview Reps',
  focus: 'No new concepts: cold retrieval across every pattern, edge cases, complexity, saying the approach out loud, and two timed mocks.',
  sections: [
    { id: 'o11-speed', title: 'Python speed round', summary: 'Fast mixed primitives: .get counting, enumerate, deque, heapq, sort keys, slicing.', exercises: speed },
    { id: 'o11-cold', title: 'Cold capstones', summary: 'Core problems from a blank editor, no notes, ~20 minutes each.', exercises: coldCapstones(COLD_IDS) },
    { id: 'o11-edges', title: 'Edge cases', summary: 'Spot the input that breaks the code, then handle it.', exercises: edges },
    { id: 'o11-complexity', title: 'Complexity', summary: 'State time and space from the code, and justify it.', exercises: complexity },
    { id: 'o11-mixed', title: 'Mixed patterns', summary: 'Fresh short problems; recognizing the pattern is part of the rep.', exercises: mixed },
    { id: 'o11-say', title: 'Say it out loud', summary: 'Approach, questions, dry runs and recovery before code.', exercises: sayIt },
  ],
  capstones: [],
  mocks: ['mock-1', 'mock-2'],
}
