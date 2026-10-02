import type { DayModule } from '@/lib/types'
import { capstone, choice, code, explain, fill, output, reorder, t } from './build'

/**
 * October 7: BFS + grid traversal.
 * deque → grids → neighbors & bounds → visited + grid BFS → tree BFS by level
 * → Level Order capstone → flood fill / islands → Number of Islands capstone.
 */

const warmup = {
  id: 'o7-warmup',
  title: 'Warm-up',
  summary: 'Cold reps on dicts, two pointers, windows, stacks, binary search and tree DFS.',
  exercises: [
    code({
      id: 'o7-wu-word-counts',
      title: 'Count words',
      skills: ['frequency_map', 'dict_get'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `word_counts(words)` returning a dict from each word to how many times it appears. Use `.get()`.',
      starterCode: 'def word_counts(words):\n    pass\n',
      solution: `def word_counts(words):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    return counts
`,
      tests: [
        t.eq('word_counts(["a", "b", "a"])', '{"a": 2, "b": 1}'),
        t.hidden('word_counts([])', '{}'),
        t.hidden('word_counts(["x", "x", "x"])', '{"x": 3}'),
      ],
      hints: ['counts[w] = counts.get(w, 0) + 1'],
      signature: 'freq-map:count-words',
      minutes: 3,
    }),
    code({
      id: 'o7-wu-pair-sorted',
      title: 'Pair in sorted list',
      skills: ['two_pointer', 'pointer_update'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: '`nums` is sorted ascending. Write `has_pair(nums, target)` returning `True` if two different positions sum to `target`. Use two pointers, O(1) extra space.',
      starterCode: 'def has_pair(nums, target):\n    pass\n',
      solution: `def has_pair(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return True
        if s < target:
            lo += 1
        else:
            hi -= 1
    return False
`,
      tests: [
        t.eq('has_pair([1, 3, 4, 6], 7)', 'True'),
        t.eq('has_pair([1, 2, 3], 10)', 'False'),
        t.hidden('has_pair([], 0)', 'False'),
        t.hidden('has_pair([5], 10)', 'False'),
        t.hidden('has_pair([-3, 0, 2, 3], 0)', 'True'),
      ],
      hints: ['Sum too small → move the left pointer right. Too big → move the right pointer left.'],
      signature: 'two-pointer:pair-sum-sorted',
      minutes: 4,
    }),
    code({
      id: 'o7-wu-window-sum',
      title: 'Best window of size k',
      skills: ['sliding_window'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `max_window_sum(nums, k)`: the largest sum of any `k` consecutive numbers. Assume `1 <= k <= len(nums)`. Slide the window in O(n).',
      starterCode: 'def max_window_sum(nums, k):\n    pass\n',
      solution: `def max_window_sum(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]
        best = max(best, window)
    return best
`,
      tests: [
        t.eq('max_window_sum([1, 4, 2, 10, 2], 2)', '12'),
        t.hidden('max_window_sum([-1, -2, -3], 1)', '-1'),
        t.hidden('max_window_sum([5], 1)', '5'),
        t.hidden('max_window_sum([1, 2, 3], 3)', '6'),
      ],
      hints: ['Add the entering number, subtract the leaving one: nums[right - k].'],
      signature: 'window:fixed-max-sum',
      minutes: 4,
    }),
    code({
      id: 'o7-wu-balanced',
      title: 'Balanced brackets',
      skills: ['stack_push_pop', 'matching_pairs'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `is_balanced(s)` for strings made of `()[]{}`. Return `True` if every closer matches the most recent unmatched opener.',
      starterCode: 'def is_balanced(s):\n    pass\n',
      solution: `def is_balanced(s):
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
        t.eq('is_balanced("([]{})")', 'True'),
        t.eq('is_balanced("(]")', 'False'),
        t.hidden('is_balanced("")', 'True'),
        t.hidden('is_balanced("((")', 'False'),
        t.hidden('is_balanced(")")', 'False'),
      ],
      hints: ['Map closers to openers. On a closer, the stack top must be its opener. At the end the stack must be empty.'],
      signature: 'stack:balanced-brackets',
      minutes: 4,
    }),
    code({
      id: 'o7-wu-binary-search',
      title: 'Binary search',
      skills: ['binary_search', 'mid_calc'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `search(nums, target)` for a sorted list: return the index of `target`, or `-1`.',
      starterCode: 'def search(nums, target):\n    pass\n',
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
        t.eq('search([1, 3, 5, 7, 9], 7)', '3'),
        t.eq('search([1, 3, 5], 4)', '-1'),
        t.hidden('search([], 1)', '-1'),
        t.hidden('search([2], 2)', '0'),
        t.hidden('search([1, 3, 5, 7, 9], 1)', '0'),
        t.hidden('search([1, 3, 5, 7, 9], 9)', '4'),
      ],
      hints: ['while lo <= hi, mid = (lo + hi) // 2, then move lo = mid + 1 or hi = mid - 1.'],
      signature: 'binary-search:exact',
      minutes: 4,
    }),
    code({
      id: 'o7-wu-max-depth',
      title: 'Tree depth (DFS)',
      skills: ['tree_dfs', 'recursion_return'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write recursive `max_depth(root)`: the number of nodes on the longest root-to-leaf path. An empty tree has depth 0. Today you will compute the same thing with BFS, so remember this version.',
      starterCode: 'def max_depth(root):\n    pass\n',
      solution: `def max_depth(root):
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
`,
      tests: [
        t.eq('max_depth(build_tree([3, 9, 20, None, None, 15, 7]))', '3'),
        t.hidden('max_depth(None)', '0'),
        t.hidden('max_depth(build_tree([1]))', '1'),
        t.hidden('max_depth(build_tree([1, 2, None, 3, None, 4]))', '4'),
      ],
      hints: ['Base case None → 0. Otherwise 1 + the deeper child.'],
      signature: 'tree-dfs:max-depth',
      minutes: 3,
    }),
  ],
}

const queues = {
  id: 'o7-deque',
  title: 'deque',
  summary: 'A FIFO queue: append on the right, popleft from the left, both O(1).',
  exercises: [
    choice({
      id: 'o7-dq-why-not-pop0',
      title: 'Why not list.pop(0)?',
      skills: ['queue_deque'],
      prompt: 'You use a plain list as a queue and remove from the front with `items.pop(0)`. What does that cost on a list of n items?',
      options: [
        'O(n): every remaining item shifts one slot left',
        'O(1): lists remember where the front is',
        'O(log n): the list is rebalanced',
        'O(1) amortized, same as append',
      ],
      answer: 0,
      note: 'A list is a contiguous array. Removing index 0 shifts everything after it. `deque.popleft()` is O(1).',
      explanation: 'pop(0) moves n-1 items, so a BFS over n nodes using pop(0) can become O(n²). deque is a doubly linked block structure with O(1) operations at both ends.',
      signature: 'deque:why-not-pop0',
      important: true,
    }),
    output({
      id: 'o7-dq-trace-basic',
      title: 'Trace append / popleft',
      skills: ['queue_deque'],
      prompt: 'What does this print?',
      code: `from collections import deque
q = deque([1, 2])
q.append(3)
print(q.popleft())
q.append(4)
print(q.popleft())
print(list(q))
`,
      expectedOutput: '1\n2\n[3, 4]',
      explanation: 'append adds at the right, popleft removes from the left: first in, first out.',
      signature: 'trace:deque-basic',
    }),
    output({
      id: 'o7-dq-stack-vs-queue',
      title: 'Stack end vs queue end',
      skills: ['queue_deque', 'stack_push_pop'],
      prompt: 'Same items, two containers. What prints?',
      code: `from collections import deque
items = [1, 2, 3]
stack = list(items)
queue = deque(items)
print(stack.pop(), queue.popleft())
stack.append(9)
queue.append(9)
print(stack.pop(), queue.popleft())
`,
      expectedOutput: '3 1\n9 2',
      explanation: 'A stack hands back the newest item (LIFO); a queue hands back the oldest (FIFO). That difference is DFS vs BFS.',
      signature: 'trace:stack-vs-queue',
    }),
    fill({
      id: 'o7-dq-fill-popleft',
      title: 'Drain a queue',
      skills: ['queue_deque'],
      prompt: 'Fill the blank so items come out in the order they went in.',
      starterCode: `from collections import deque

def drain(items):
    q = deque(items)
    out = []
    while q:
        out.append(q.____())
    return out
`,
      solution: `from collections import deque

def drain(items):
    q = deque(items)
    out = []
    while q:
        out.append(q.popleft())
    return out
`,
      tests: [t.eq('drain([3, 1, 2])', '[3, 1, 2]'), t.hidden('drain([])', '[]')],
      signature: 'deque:fill-popleft',
    }),
    code({
      id: 'o7-dq-one-line',
      title: 'Seed a queue',
      skills: ['queue_deque', 'tuples'],
      stage: 'recall',
      prompt: 'Replace `q = None` with one line: a deque containing just the coordinate `start`.',
      starterCode: `from collections import deque
start = (0, 0)
q = None
`,
      solution: `from collections import deque
start = (0, 0)
q = deque([start])
`,
      tests: [t.check('q holds start', 'assert isinstance(q, deque) and list(q) == [(0, 0)]')],
      hints: ['deque takes an iterable. deque(start) would give deque([0, 0]), not one tuple.'],
      note: '`deque([start])` wraps the single item in a list first.',
      explanation: 'deque(iterable) unpacks its argument, so a tuple must be wrapped: deque([(0, 0)]).',
      signature: 'deque:seed',
      minutes: 2,
      important: true,
    }),
    output({
      id: 'o7-dq-trace-expand',
      title: 'Queue that grows',
      skills: ['queue_deque', 'bfs'],
      prompt: 'Each popped number may enqueue two more. What prints?',
      code: `from collections import deque
q = deque([1])
order = []
while q:
    x = q.popleft()
    order.append(x)
    if x < 4:
        q.append(2 * x)
        q.append(2 * x + 1)
print(order)
`,
      expectedOutput: '[1, 2, 3, 4, 5, 6, 7]',
      explanation: 'This is BFS on an implicit tree (children of x are 2x and 2x+1): everything at one depth comes out before anything deeper.',
      signature: 'trace:deque-expand',
      minutes: 2.5,
    }),
    code({
      id: 'o7-dq-recent',
      title: 'Recent events counter',
      skills: ['queue_deque', 'while_loop'],
      stage: 'microbuild',
      prompt: 'Times arrive in increasing order. For each time `t`, report how many events (including this one) happened in `[t - window + 1, t]`. Write `recent_counts(times, window)` returning the list of counts. Keep a deque; drop expired times from the left.',
      starterCode: `from collections import deque

def recent_counts(times, window):
    q = deque()
    out = []
    for t in times:
        # add t, drop expired from the left, record len(q)
        pass
    return out
`,
      solution: `from collections import deque

def recent_counts(times, window):
    q = deque()
    out = []
    for t in times:
        q.append(t)
        while q[0] < t - window + 1:
            q.popleft()
        out.append(len(q))
    return out
`,
      tests: [
        t.eq('recent_counts([1, 2, 3, 10], 3)', '[1, 2, 3, 1]'),
        t.eq('recent_counts([1, 100, 3001, 3002], 3000)', '[1, 2, 2, 3]'),
        t.hidden('recent_counts([], 5)', '[]'),
        t.hidden('recent_counts([5, 5, 5], 1)', '[1, 2, 3]'),
      ],
      hints: ['q[0] peeks at the oldest time without removing it.', 'while q[0] < t - window + 1: q.popleft()'],
      explanation: 'Each time is appended once and popped at most once, so the whole scan is O(n). Peeking with q[0] is O(1) on a deque.',
      signature: 'deque:expire-old',
      minutes: 5,
      difficulty: 2,
    }),
    code({
      id: 'o7-dq-rotate-elim',
      title: 'Pass and eliminate',
      skills: ['queue_deque', 'while_loop'],
      stage: 'combine',
      repType: 'combine',
      prompt: 'Players stand in a queue. Repeat until one remains: move the front player to the back `k - 1` times, then remove the front player. Write `last_standing(names, k)` returning the survivor. Assume `names` is non-empty and `k >= 1`.',
      starterCode: 'from collections import deque\n\ndef last_standing(names, k):\n    pass\n',
      solution: `from collections import deque

def last_standing(names, k):
    q = deque(names)
    while len(q) > 1:
        for _ in range(k - 1):
            q.append(q.popleft())
        q.popleft()
    return q[0]
`,
      tests: [
        t.eq('last_standing(["a", "b", "c", "d"], 2)', '"a"'),
        t.eq('last_standing(["a", "b", "c"], 1)', '"c"'),
        t.hidden('last_standing(["solo"], 3)', '"solo"'),
        t.hidden('last_standing(["a", "b", "c", "d", "e"], 3)', '"d"'),
      ],
      hints: ['Rotating one step is q.append(q.popleft()).', 'Outer loop while len(q) > 1; inner loop k - 1 rotations; then one popleft.'],
      signature: 'deque:rotate-eliminate',
      minutes: 6,
    }),
  ],
}

const grids = {
  id: 'o7-grids',
  title: 'Grids',
  summary: 'Nested lists: grid[r][c], rows = len(grid), cols = len(grid[0]).',
  exercises: [
    choice({
      id: 'o7-g-index',
      title: 'Row first, then column',
      skills: ['grid_nested'],
      prompt: 'What is `grid[1][0]`?',
      code: `grid = [["a", "b", "c"],
        ["d", "e", "f"]]`,
      options: ['"d"', '"b"', '"e"', 'IndexError'],
      answer: 0,
      note: '`grid[r]` is a whole row (a list). `grid[r][c]` is one cell. r goes down, c goes across.',
      explanation: 'grid[1] is the second row ["d", "e", "f"], and [0] takes its first cell.',
      signature: 'grid:index',
    }),
    output({
      id: 'o7-g-trace-dims',
      title: 'Rows, cols, cells',
      skills: ['grid_nested', 'len'],
      prompt: 'What prints?',
      code: `grid = [[1, 0, 1, 1],
        [0, 0, 1, 0],
        [1, 1, 0, 0]]
rows = len(grid)
cols = len(grid[0])
print(rows, cols)
print(grid[2][1], grid[0][3])
print(grid[-1])
`,
      expectedOutput: '3 4\n1 1\n[1, 1, 0, 0]',
      explanation: 'len(grid) counts rows; len(grid[0]) counts cells in a row. grid[-1] is the last row.',
      signature: 'trace:grid-dims',
    }),
    output({
      id: 'o7-g-trace-scan',
      title: 'Scan every cell',
      skills: ['grid_nested', 'range'],
      prompt: 'The grid holds strings, like LeetCode grids. What prints?',
      code: `grid = [["1", "0"],
        ["0", "1"],
        ["1", "1"]]
for r in range(len(grid)):
    for c in range(len(grid[0])):
        if grid[r][c] == "1":
            print(r, c)
`,
      expectedOutput: '0 0\n1 1\n2 0\n2 1',
      explanation: 'The outer loop walks rows top to bottom, the inner loop walks columns left to right: row-major order. Compare with the string "1", not the int 1.',
      signature: 'trace:grid-scan',
      important: true,
    }),
    output({
      id: 'o7-g-trace-alias',
      title: 'The [[0] * 3] * 2 trap',
      skills: ['grid_nested', 'list_comprehension'],
      prompt: 'Two ways to build a 2x3 grid of zeros. What prints?',
      code: `bad = [[0] * 3] * 2
good = [[0] * 3 for _ in range(2)]
bad[0][0] = 1
good[0][0] = 1
print(bad)
print(good)
`,
      expectedOutput: '[[1, 0, 0], [1, 0, 0]]\n[[1, 0, 0], [0, 0, 0]]',
      note: 'Build grids with a comprehension: `[[0] * cols for _ in range(rows)]`.',
      explanation: '`* 2` copies the reference to the same inner list, so both rows are one object. The comprehension creates a new row each iteration.',
      signature: 'trace:grid-alias',
      minutes: 2,
    }),
    fill({
      id: 'o7-g-fill-dims',
      title: 'Grid size',
      skills: ['grid_nested', 'len'],
      prompt: 'Fill both blanks. Assume the grid has at least one row.',
      starterCode: `def cell_count(grid):
    rows = ____
    cols = ____
    return rows * cols
`,
      solution: `def cell_count(grid):
    rows = len(grid)
    cols = len(grid[0])
    return rows * cols
`,
      tests: [t.eq('cell_count([[1, 2, 3], [4, 5, 6]])', '6'), t.hidden('cell_count([["1"]])', '1'), t.hidden('cell_count([[0], [0], [0]])', '3')],
      signature: 'grid:fill-dims',
    }),
    code({
      id: 'o7-g-make',
      title: 'Build a grid',
      skills: ['grid_nested', 'list_comprehension'],
      stage: 'recall',
      prompt: 'Write `make_grid(rows, cols, value)` returning a rows x cols grid filled with `value`, where each row is a separate list.',
      starterCode: 'def make_grid(rows, cols, value):\n    pass\n',
      solution: `def make_grid(rows, cols, value):
    return [[value] * cols for _ in range(rows)]
`,
      tests: [
        t.eq('make_grid(2, 3, 0)', '[[0, 0, 0], [0, 0, 0]]'),
        t.check('rows are independent', 'g = make_grid(2, 2, 0)\ng[0][0] = 5\nassert g[1][0] == 0'),
        t.hidden('make_grid(0, 3, 0)', '[]'),
        t.hidden('make_grid(1, 1, "x")', '[["x"]]'),
      ],
      hints: ['One new row per iteration: [[value] * cols for _ in range(rows)].'],
      signature: 'grid:make',
      minutes: 3,
    }),
    code({
      id: 'o7-g-count',
      title: 'Count a value',
      skills: ['grid_nested', 'accumulator'],
      prompt: 'Write `count_value(grid, target)`: how many cells equal `target`. Use `rows`/`cols` and `grid[r][c]`.',
      starterCode: 'def count_value(grid, target):\n    pass\n',
      solution: `def count_value(grid, target):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == target:
                count += 1
    return count
`,
      tests: [
        t.eq('count_value([["1", "0"], ["1", "1"]], "1")', '3'),
        t.hidden('count_value([[0, 0], [0, 0]], 1)', '0'),
        t.hidden('count_value([[7]], 7)', '1'),
        t.hidden('count_value([["1", "0", "1"]], "0")', '1'),
      ],
      hints: ['Two nested range loops; compare grid[r][c] to target.'],
      signature: 'grid:count-value',
      minutes: 4,
    }),
    code({
      id: 'o7-g-col-sums',
      title: 'Column sums',
      skills: ['grid_nested', 'range'],
      prompt: 'Write `column_sums(grid)` for a grid of ints: a list whose i-th entry is the sum of column i. Columns outer, rows inner this time.',
      starterCode: 'def column_sums(grid):\n    pass\n',
      solution: `def column_sums(grid):
    rows, cols = len(grid), len(grid[0])
    out = []
    for c in range(cols):
        total = 0
        for r in range(rows):
            total += grid[r][c]
        out.append(total)
    return out
`,
      tests: [
        t.eq('column_sums([[1, 2, 3], [4, 5, 6]])', '[5, 7, 9]'),
        t.hidden('column_sums([[1], [2], [3]])', '[6]'),
        t.hidden('column_sums([[-1, 1]])', '[-1, 1]'),
      ],
      hints: ['The index you loop over outside decides what you sum: for c in range(cols), then for r in range(rows).'],
      signature: 'grid:column-sums',
      minutes: 4,
    }),
    code({
      id: 'o7-g-find-all',
      title: 'Coordinates of a value',
      skills: ['grid_nested', 'tuples', 'list_append'],
      prompt: 'Write `find_all(grid, ch)` returning a list of `(r, c)` tuples where the cell equals `ch`, in row-major order.',
      starterCode: 'def find_all(grid, ch):\n    pass\n',
      solution: `def find_all(grid, ch):
    out = []
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] == ch:
                out.append((r, c))
    return out
`,
      tests: [
        t.eq('find_all([["1", "0"], ["0", "1"]], "1")', '[(0, 0), (1, 1)]'),
        t.hidden('find_all([["0"]], "1")', '[]'),
        t.hidden('find_all([["x", "x", "x"]], "x")', '[(0, 0), (0, 1), (0, 2)]'),
      ],
      hints: ['Append a tuple: out.append((r, c)) with double parentheses.'],
      explanation: 'Tuples are how BFS and visited sets represent cells: they are hashable, lists are not.',
      signature: 'grid:find-coords',
      minutes: 4,
    }),
  ],
}

const neighbors = {
  id: 'o7-neighbors',
  title: 'Neighbors',
  summary: 'A directions list plus a bounds check generates every valid neighbor.',
  exercises: [
    choice({
      id: 'o7-n-dirs',
      title: 'The directions list',
      skills: ['grid_neighbors', 'tuples'],
      prompt: 'Which list gives exactly the four up/down/left/right moves as `(dr, dc)`?',
      options: [
        '[(-1, 0), (1, 0), (0, -1), (0, 1)]',
        '[(1, 1), (-1, -1), (1, -1), (-1, 1)]',
        '[(0, 0), (1, 0), (0, 1)]',
        '[(-1, 0), (1, 0), (0, -1), (0, 1), (1, 1)]',
      ],
      answer: 0,
      note: '`DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]`, then `nr, nc = r + dr, c + dc`.',
      explanation: 'Each move changes exactly one coordinate by 1. Diagonals change both.',
      signature: 'neighbors:dirs',
    }),
    choice({
      id: 'o7-n-negative-wrap',
      title: 'Why bounds-check -1?',
      skills: ['grid_neighbors', 'list_index'],
      prompt: 'At cell `(0, 2)` you look up without a bounds check: `grid[0 - 1][2]`. What happens?',
      options: [
        'It silently reads the last row, grid[-1][2], which is wrong',
        'It raises IndexError, so the bug is easy to spot',
        'It returns None',
        'It reads grid[0][2] again',
      ],
      answer: 0,
      explanation: 'Negative indexes wrap in Python. Going off the bottom raises IndexError, but going off the top or left quietly reads the far edge. Always check 0 <= nr < rows and 0 <= nc < cols.',
      signature: 'neighbors:negative-wrap',
      important: true,
    }),
    output({
      id: 'o7-n-trace',
      title: 'Trace a neighbor loop',
      skills: ['grid_neighbors'],
      prompt: 'Which neighbors of `(0, 1)` survive the bounds check?',
      code: `grid = [[5, 6, 7],
        [8, 9, 4]]
rows, cols = len(grid), len(grid[0])
r, c = 0, 1
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        print(nr, nc, grid[nr][nc])
`,
      expectedOutput: '1 1 9\n0 2 7\n0 0 5',
      explanation: '(-1, 1) fails 0 <= nr. The rest are inside the grid and printed in directions-list order.',
      signature: 'trace:neighbors',
      minutes: 2,
    }),
    fill({
      id: 'o7-n-fill-bounds',
      title: 'Bounds check',
      skills: ['grid_neighbors'],
      prompt: 'Fill the blanks with chained comparisons.',
      starterCode: `def in_bounds(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    return 0 <= r < ____ and 0 <= c < ____
`,
      solution: `def in_bounds(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    return 0 <= r < rows and 0 <= c < cols
`,
      tests: [
        t.eq('in_bounds([[1, 2], [3, 4]], 1, 1)', 'True'),
        t.eq('in_bounds([[1, 2], [3, 4]], -1, 0)', 'False'),
        t.hidden('in_bounds([[1, 2, 3]], 0, 3)', 'False'),
        t.hidden('in_bounds([[1, 2, 3]], 1, 0)', 'False'),
      ],
      signature: 'neighbors:fill-bounds',
      important: true,
    }),
    code({
      id: 'o7-n-list',
      title: 'List the neighbors',
      skills: ['grid_neighbors', 'tuples'],
      prompt: 'Write `neighbors(grid, r, c)` returning valid neighbor coordinates as tuples in the order up, down, left, right.',
      starterCode: `def neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        pass
    return out
`,
      solution: `def neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            out.append((nr, nc))
    return out
`,
      tests: [
        t.eq('neighbors([[0, 0, 0], [0, 0, 0]], 0, 0)', '[(1, 0), (0, 1)]'),
        t.eq('neighbors([[0, 0, 0], [0, 0, 0], [0, 0, 0]], 1, 1)', '[(0, 1), (2, 1), (1, 0), (1, 2)]'),
        t.hidden('neighbors([[0]], 0, 0)', '[]'),
        t.hidden('neighbors([[0, 0, 0]], 0, 2)', '[(0, 1)]'),
      ],
      hints: ['nr, nc = r + dr, c + dc, then the bounds check, then append (nr, nc).'],
      signature: 'neighbors:list',
      minutes: 4,
      important: true,
    }),
    code({
      id: 'o7-n-land',
      title: 'Count land neighbors',
      skills: ['grid_neighbors', 'accumulator'],
      prompt: 'The grid holds `"1"` (land) and `"0"` (water) strings. Write `land_neighbors(grid, r, c)`: how many of the 4 neighbors of `(r, c)` are land.',
      starterCode: 'def land_neighbors(grid, r, c):\n    pass\n',
      solution: `def land_neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
            count += 1
    return count
`,
      tests: [
        t.eq('land_neighbors([["1", "1"], ["1", "0"]], 0, 0)', '2'),
        t.eq('land_neighbors([["0", "1", "0"], ["1", "1", "1"], ["0", "1", "0"]], 1, 1)', '4'),
        t.hidden('land_neighbors([["1"]], 0, 0)', '0'),
        t.hidden('land_neighbors([["1", "0", "1"]], 0, 1)', '2'),
      ],
      hints: ['Bounds check first, then the cell check, joined with and: short-circuiting prevents bad indexes.'],
      signature: 'neighbors:count-matching',
      minutes: 4,
    }),
    code({
      id: 'o7-n-eight',
      title: 'Eight neighbors',
      skills: ['grid_neighbors', 'range'],
      stage: 'combine',
      repType: 'combine',
      prompt: 'Minesweeper style: the grid holds `"*"` for mines and `"."` for empty. Write `count_mines(grid, r, c)`: mines among all 8 surrounding cells (diagonals included). Build the 8 directions with two loops instead of typing them.',
      starterCode: 'def count_mines(grid, r, c):\n    pass\n',
      solution: `def count_mines(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "*":
                count += 1
    return count
`,
      tests: [
        t.eq('count_mines([["*", ".", "*"], [".", ".", "."], ["*", ".", "*"]], 1, 1)', '4'),
        t.eq('count_mines([["*", "*"], ["*", "."]], 1, 1)', '3'),
        t.hidden('count_mines([["*"]], 0, 0)', '0'),
        t.hidden('count_mines([[".", "*", "."]], 0, 0)', '1'),
      ],
      hints: ['for dr in (-1, 0, 1): for dc in (-1, 0, 1): skip (0, 0).'],
      signature: 'neighbors:eight-dirs',
      minutes: 6,
    }),
    code({
      id: 'o7-n-perimeter',
      title: 'Island perimeter',
      skills: ['grid_neighbors', 'grid_nested', 'accumulator'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Ints this time: `1` is land, `0` is water, and there is one island. Write `perimeter(grid)`: each land cell contributes one unit of edge for every side that touches water or the grid border.',
      starterCode: 'def perimeter(grid):\n    pass\n',
      solution: `def perimeter(grid):
    rows, cols = len(grid), len(grid[0])
    total = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1:
                continue
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if not (0 <= nr < rows and 0 <= nc < cols) or grid[nr][nc] == 0:
                    total += 1
    return total
`,
      tests: [
        t.eq('perimeter([[1]])', '4'),
        t.eq('perimeter([[0, 1, 0], [1, 1, 1], [0, 1, 0]])', '12'),
        t.hidden('perimeter([[1, 1], [1, 1]])', '8'),
        t.hidden('perimeter([[1, 0]])', '4'),
        t.hidden('perimeter([[0, 1, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]])', '16'),
      ],
      hints: [
        'Visit every land cell and look at its 4 sides.',
        'A side counts if the neighbor is out of bounds or is water.',
        'if not (0 <= nr < rows and 0 <= nc < cols) or grid[nr][nc] == 0: total += 1',
      ],
      explanation: 'Here out-of-bounds is not "skip" but "count". The or short-circuits, so grid[nr][nc] is only read when in bounds.',
      signature: 'neighbors:perimeter',
      minutes: 8,
    }),
    reorder({
      id: 'o7-n-reorder',
      title: 'Rebuild the neighbor loop',
      skills: ['grid_neighbors'],
      prompt: 'Put the lines in order to return the valid 4-neighbors of `(r, c)`.',
      lines: [
        'def valid_neighbors(rows, cols, r, c):',
        '    out = []',
        '    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:',
        '        nr, nc = r + dr, c + dc',
        '        if 0 <= nr < rows and 0 <= nc < cols:',
        '            out.append((nr, nc))',
        '    return out',
      ],
      tests: [t.eq('valid_neighbors(2, 2, 0, 0)', '[(1, 0), (0, 1)]'), t.hidden('valid_neighbors(1, 1, 0, 0)', '[]')],
      signature: 'reorder:neighbors',
      minutes: 3,
    }),
  ],
}

const gridBfs = {
  id: 'o7-grid-bfs',
  title: 'Grid BFS',
  summary: 'Queue + directions + bounds + visited set, marked when enqueuing.',
  exercises: [
    choice({
      id: 'o7-v-tuple',
      title: 'What goes in visited?',
      skills: ['visited_set', 'tuples'],
      prompt: 'Which line stores the cell `(r, c)` in a set correctly?',
      options: ['visited.add((r, c))', 'visited.add([r, c])', 'visited.add(r, c)', 'visited[r][c] = True  # visited = set()'],
      answer: 0,
      note: 'Set members must be hashable. Tuples are, lists are not.',
      explanation: 'add([r, c]) raises TypeError: unhashable type: list. add(r, c) passes two arguments, which add does not accept.',
      signature: 'visited:tuple',
    }),
    choice({
      id: 'o7-v-when',
      title: 'When to mark visited',
      skills: ['visited_set', 'bfs'],
      prompt: 'In BFS, when should a cell be added to `visited`?',
      options: [
        'Right when it is appended to the queue',
        'Right after it is popped from the queue',
        'After all its neighbors have been processed',
        'Only for the start cell',
      ],
      answer: 0,
      note: 'Mark on enqueue: `visited.add(nxt); q.append(nxt)` together.',
      explanation: 'If you wait until popping, two cells already in the queue can both enqueue the same neighbor, so it gets processed twice and the queue bloats.',
      signature: 'visited:when-mark',
      important: true,
    }),
    output({
      id: 'o7-v-trace-late-mark',
      title: 'Cost of marking late',
      skills: ['visited_set', 'bfs'],
      prompt: 'This BFS marks cells when popping (and skips repeats). How many distinct cells are seen, and how many pushes happen in total?',
      code: `from collections import deque
q = deque([(0, 0)])
seen = set()
pushes = 1
while q:
    r, c = q.popleft()
    if (r, c) in seen:
        continue
    seen.add((r, c))
    for dr, dc in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < 2 and 0 <= nc < 2 and (nr, nc) not in seen:
            q.append((nr, nc))
            pushes += 1
print(len(seen), pushes)
`,
      expectedOutput: '4 5',
      explanation: '(1, 1) is pushed by both (1, 0) and (0, 1) because neither had marked it yet. On a big open grid these duplicates multiply. Marking on enqueue gives exactly one push per cell.',
      signature: 'trace:visited-late',
      minutes: 3,
      difficulty: 3,
    }),
    reorder({
      id: 'o7-v-reorder',
      title: 'Grid BFS template',
      skills: ['bfs', 'visited_set', 'grid_neighbors', 'queue_deque'],
      prompt: 'Order the lines: count the open cells (`1`) reachable from `(sr, sc)`, which is open. Ints grid.',
      lines: [
        'from collections import deque',
        'def reachable(grid, sr, sc):',
        '    rows, cols = len(grid), len(grid[0])',
        '    visited = {(sr, sc)}',
        '    q = deque([(sr, sc)])',
        '    while q:',
        '        r, c = q.popleft()',
        '        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:',
        '            nr, nc = r + dr, c + dc',
        '            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:',
        '                visited.add((nr, nc))',
        '                q.append((nr, nc))',
        '    return len(visited)',
      ],
      tests: [t.eq('reachable([[1, 1, 0], [0, 1, 0], [1, 0, 1]], 0, 0)', '3'), t.hidden('reachable([[1]], 0, 0)', '1')],
      signature: 'reorder:grid-bfs',
      minutes: 4,
      important: true,
    }),
    fill({
      id: 'o7-v-fill',
      title: 'Mark and enqueue',
      skills: ['bfs', 'visited_set'],
      prompt: 'Fill the two blanks inside the neighbor check.',
      starterCode: `from collections import deque

def reachable(grid, sr, sc):
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:
                ____
                ____
    return len(visited)
`,
      solution: `from collections import deque

def reachable(grid, sr, sc):
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
    return len(visited)
`,
      tests: [t.eq('reachable([[1, 1], [1, 0]], 0, 0)', '3'), t.hidden('reachable([[1, 0, 1]], 0, 0)', '1')],
      signature: 'grid-bfs:fill-mark',
    }),
    code({
      id: 'o7-v-reachable-strings',
      title: 'Reachable land, from scratch',
      skills: ['bfs', 'visited_set', 'grid_neighbors', 'queue_deque'],
      stage: 'microbuild',
      difficulty: 3,
      prompt: 'Strings grid of `"1"`/`"0"`. Write `land_reachable(grid, sr, sc)`: how many land cells are connected to `(sr, sc)` (including it). If the start is water, return 0. Use BFS with a visited set; do not modify the grid.',
      starterCode: 'from collections import deque\n\ndef land_reachable(grid, sr, sc):\n    pass\n',
      solution: `from collections import deque

def land_reachable(grid, sr, sc):
    if grid[sr][sc] != "1":
        return 0
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
    return len(visited)
`,
      tests: [
        t.eq('land_reachable([["1", "1", "0"], ["0", "1", "0"], ["1", "0", "1"]], 0, 0)', '3'),
        t.eq('land_reachable([["1", "0"], ["0", "1"]], 1, 1)', '1'),
        t.hidden('land_reachable([["0"]], 0, 0)', '0'),
        t.hidden('land_reachable([["1", "1"], ["1", "1"]], 1, 0)', '4'),
        t.hidden('land_reachable([["1", "1", "1", "1", "1"]], 0, 4)', '5'),
      ],
      hints: [
        'Same shape as the template you just ordered.',
        'Seed both visited and the queue with the start.',
        'Neighbor condition: in bounds, "1", not in visited.',
        'Mark and enqueue together; return len(visited).',
      ],
      signature: 'grid-bfs:reachable-count',
      minutes: 7,
      important: true,
    }),
    output({
      id: 'o7-v-trace-order',
      title: 'BFS visit order',
      skills: ['bfs', 'grid_neighbors'],
      prompt: 'Directions are down, right, up, left. In what order are cells popped?',
      code: `from collections import deque
grid = [[1, 1, 1],
        [1, 0, 1]]
visited = {(0, 0)}
q = deque([(0, 0)])
while q:
    r, c = q.popleft()
    print(r, c)
    for dr, dc in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < 2 and 0 <= nc < 3 and grid[nr][nc] == 1 and (nr, nc) not in visited:
            visited.add((nr, nc))
            q.append((nr, nc))
`,
      expectedOutput: '0 0\n1 0\n0 1\n0 2\n1 2',
      explanation: 'BFS pops cells in order of distance from the start: (0,0) at 0, then (1,0) and (0,1) at 1, then (0,2) at 2, then (1,2) at 3.',
      signature: 'trace:grid-bfs-order',
      minutes: 3,
      difficulty: 2,
    }),
    choice({
      id: 'o7-v-bfs-shortest',
      title: 'Why BFS for shortest steps?',
      skills: ['bfs'],
      prompt: 'In a grid where every move costs 1, why does BFS find the fewest steps to a target?',
      options: [
        'It pops cells in nondecreasing distance order, so the first time it reaches the target is via a shortest path',
        'It explores the deepest path first',
        'It tries every possible path and keeps the minimum',
        'It only works if the grid has no walls',
      ],
      answer: 0,
      explanation: 'All distance-d cells are enqueued before any distance-(d+1) cell. DFS can reach the target first via a long detour.',
      signature: 'bfs:why-shortest',
    }),
    code({
      id: 'o7-v-shortest',
      title: 'Fewest steps to the corner',
      skills: ['bfs', 'visited_set', 'grid_neighbors', 'tuples'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Ints grid: `0` is open, `1` is a wall. Write `shortest_steps(grid)`: the fewest 4-directional moves from the top-left to the bottom-right, or `-1` if impossible (including when either corner is a wall). Store `(r, c, dist)` in the queue.',
      starterCode: 'from collections import deque\n\ndef shortest_steps(grid):\n    pass\n',
      solution: `from collections import deque

def shortest_steps(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows - 1][cols - 1] == 1:
        return -1
    visited = {(0, 0)}
    q = deque([(0, 0, 0)])
    while q:
        r, c, dist = q.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return dist
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc, dist + 1))
    return -1
`,
      tests: [
        t.eq('shortest_steps([[0, 0, 0], [1, 1, 0], [0, 0, 0]])', '4'),
        t.eq('shortest_steps([[0, 1], [1, 0]])', '-1'),
        t.hidden('shortest_steps([[0]])', '0'),
        t.hidden('shortest_steps([[1]])', '-1'),
        t.hidden('shortest_steps([[0, 0], [0, 1]])', '-1'),
        t.hidden('shortest_steps([[0, 0, 0], [0, 1, 0], [0, 1, 0], [0, 0, 0]])', '5'),
        t.hidden('shortest_steps([[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0]])', '10'),
      ],
      hints: [
        'BFS pops in distance order, so the first time you pop the target, its dist is the answer.',
        'Carry the distance with the cell: q.append((nr, nc, dist + 1)).',
        'Check walls at both corners before starting.',
        'Pop (r, c, dist); if target return dist; else enqueue unvisited open neighbors; after the loop return -1.',
      ],
      complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
      signature: 'grid-bfs:shortest-steps',
      minutes: 10,
      important: true,
    }),
    code({
      id: 'o7-v-flood-fill',
      title: 'Flood fill (BFS)',
      skills: ['bfs', 'grid_neighbors', 'queue_deque'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 3,
      prompt: 'An image is a grid of ints (colors). Write `flood_fill(image, sr, sc, color)`: repaint the start pixel and every pixel connected to it (4 directions) that has the same original color. Modify in place and return `image`. Watch out: what if `color` already equals the original color?',
      starterCode: 'from collections import deque\n\ndef flood_fill(image, sr, sc, color):\n    pass\n',
      solution: `from collections import deque

def flood_fill(image, sr, sc, color):
    old = image[sr][sc]
    if old == color:
        return image
    rows, cols = len(image), len(image[0])
    image[sr][sc] = color
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and image[nr][nc] == old:
                image[nr][nc] = color
                q.append((nr, nc))
    return image
`,
      tests: [
        t.eq('flood_fill([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2)', '[[2, 2, 2], [2, 2, 0], [2, 0, 1]]'),
        t.eq('flood_fill([[0, 0], [0, 0]], 0, 0, 0)', '[[0, 0], [0, 0]]'),
        t.hidden('flood_fill([[5]], 0, 0, 3)', '[[3]]'),
        t.hidden('flood_fill([[1, 2, 1]], 0, 0, 9)', '[[9, 2, 1]]'),
        t.hidden('flood_fill([[3, 3], [3, 4]], 1, 1, 3)', '[[3, 3], [3, 3]]'),
      ],
      hints: [
        'Repainting a pixel can serve as marking it visited.',
        'Remember old = image[sr][sc] before painting anything.',
        'Paint when enqueuing, and only enqueue neighbors still equal to old.',
        'If old == color, painting does not change anything, so nothing would ever be marked and the loop would never end. Return early.',
      ],
      explanation: 'The grid itself is the visited set: a repainted cell no longer matches old. That trick breaks exactly when color == old, hence the early return.',
      signature: 'grid-bfs:flood-fill',
      minutes: 9,
      important: true,
    }),
    code({
      id: 'o7-v-dfs-stack',
      title: 'Same traversal, stack instead',
      skills: ['stack_push_pop', 'visited_set', 'grid_neighbors'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Swap the deque for a plain list used as a stack (`append` / `pop()`) and the BFS becomes an iterative DFS. Write `land_reachable_dfs(grid, sr, sc)` on a `"1"`/`"0"` strings grid: the number of land cells connected to the start (0 if the start is water). No deque, no recursion.',
      starterCode: 'def land_reachable_dfs(grid, sr, sc):\n    pass\n',
      solution: `def land_reachable_dfs(grid, sr, sc):
    if grid[sr][sc] != "1":
        return 0
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    stack = [(sr, sc)]
    while stack:
        r, c = stack.pop()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in visited:
                visited.add((nr, nc))
                stack.append((nr, nc))
    return len(visited)
`,
      tests: [
        t.eq('land_reachable_dfs([["1", "1", "0"], ["0", "1", "1"], ["1", "0", "1"]], 0, 0)', '5'),
        t.eq('land_reachable_dfs([["0", "1"]], 0, 0)', '0'),
        t.hidden('land_reachable_dfs([["1"]], 0, 0)', '1'),
        t.hidden('land_reachable_dfs([["1", "0", "1"], ["1", "0", "1"], ["1", "1", "1"]], 0, 2)', '7'),
      ],
      hints: ['Only the container changes: stack = [start], stack.pop(). Visited logic is identical.'],
      explanation: 'For "what can I reach" questions, BFS and DFS give the same set; only the visiting order differs. For "fewest steps" you need BFS.',
      signature: 'grid-dfs:iterative-stack',
      minutes: 5,
    }),
    code({
      id: 'o7-v-multi-source',
      title: 'Distance to nearest exit',
      skills: ['bfs', 'grid_neighbors', 'queue_deque', 'grid_nested'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 4,
      prompt: 'Ints grid: `0` marks an exit, `1` an ordinary cell. Write `nearest_exit(grid)` returning a new grid where each cell holds the fewest 4-directional steps to any exit. There is at least one exit. Start the BFS from **all** exits at once.',
      starterCode: `from collections import deque

def nearest_exit(grid):
    rows, cols = len(grid), len(grid[0])
    dist = [[-1] * cols for _ in range(rows)]
    q = deque()
    # 1. every exit: distance 0, enqueue it
    # 2. BFS: an unset neighbor gets dist + 1
    return dist
`,
      solution: `from collections import deque

def nearest_exit(grid):
    rows, cols = len(grid), len(grid[0])
    dist = [[-1] * cols for _ in range(rows)]
    q = deque()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0:
                dist[r][c] = 0
                q.append((r, c))
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist
`,
      tests: [
        t.eq('nearest_exit([[0, 1, 1], [1, 1, 1]])', '[[0, 1, 2], [1, 2, 3]]'),
        t.eq('nearest_exit([[1, 1, 1], [1, 0, 1], [1, 1, 1]])', '[[2, 1, 2], [1, 0, 1], [2, 1, 2]]'),
        t.hidden('nearest_exit([[0]])', '[[0]]'),
        t.hidden('nearest_exit([[0, 1, 1, 1, 0]])', '[[0, 1, 2, 1, 0]]'),
        t.hidden('nearest_exit([[1], [1], [0]])', '[[2], [1], [0]]'),
      ],
      hints: [
        'Running BFS from each cell separately is O((rows*cols)²). Reverse it: spread outward from the exits.',
        'Seed the queue with every exit before the loop. The dist grid doubles as the visited set (-1 = unvisited).',
        'When you reach an unvisited neighbor: dist[nr][nc] = dist[r][c] + 1, then enqueue it.',
        'Seed all zeros at distance 0, then a standard BFS where "not visited" means dist == -1.',
      ],
      explanation: 'Multi-source BFS behaves like one BFS from an imaginary super-source joined to every exit, so cells are still popped in order of distance to the nearest exit. One pass, O(rows * cols).',
      complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
      signature: 'grid-bfs:multi-source',
      minutes: 9,
      important: true,
    }),
  ],
}

const treeLevels = {
  id: 'o7-tree-bfs',
  title: 'BFS by level',
  summary: 'Snapshot size = len(q) and pop exactly that many to handle one level.',
  exercises: [
    output({
      id: 'o7-t-trace-flat',
      title: 'Tree BFS order',
      skills: ['bfs', 'treenode', 'queue_deque'],
      prompt: '`build_tree` makes a tree from a level-order list (None = no node). What prints?',
      code: `from collections import deque
root = build_tree([1, 2, 3, 4, None, 5])
q = deque([root])
out = []
while q:
    node = q.popleft()
    out.append(node.val)
    if node.left:
        q.append(node.left)
    if node.right:
        q.append(node.right)
print(out)
`,
      expectedOutput: '[1, 2, 3, 4, 5]',
      note: 'Trees need no visited set: each node has one parent, so it is enqueued once.',
      explanation: 'BFS on a tree visits nodes top to bottom, left to right: exactly the level-order list without the Nones.',
      signature: 'trace:tree-bfs-flat',
    }),
    choice({
      id: 'o7-t-why-snapshot',
      title: 'Why snapshot len(q)?',
      skills: ['bfs_levels'],
      prompt: 'Inside `while q:` we write `for _ in range(len(q)):`. Why read the length before the inner loop?',
      options: [
        'At that moment the queue holds exactly one full level; children added during the loop belong to the next level',
        'len(q) is O(n) on a deque, so it must be cached',
        'range needs a constant to avoid an infinite loop, any number works',
        'It makes popleft faster',
      ],
      answer: 0,
      note: '```python\nwhile q:\n    level = []\n    for _ in range(len(q)):\n        node = q.popleft()\n        ...\n```',
      explanation: 'range(len(q)) is evaluated once, so the inner loop pops only the nodes that were in the queue at the start of the level, even though the queue grows during it.',
      signature: 'bfs-levels:why-snapshot',
      important: true,
    }),
    output({
      id: 'o7-t-trace-levels',
      title: 'Trace levels',
      skills: ['bfs_levels', 'treenode'],
      prompt: 'What prints?',
      code: `from collections import deque
root = build_tree([1, 2, 3, 4, None, 5, 6])
q = deque([root])
while q:
    row = []
    for _ in range(len(q)):
        node = q.popleft()
        row.append(node.val)
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
    print(row)
`,
      expectedOutput: '[1]\n[2, 3]\n[4, 5, 6]',
      explanation: 'Each pass of the outer loop drains exactly one level and enqueues the next.',
      signature: 'trace:tree-bfs-levels',
      minutes: 2,
    }),
    choice({
      id: 'o7-t-no-snapshot-bug',
      title: 'Forgot the snapshot',
      skills: ['bfs_levels'],
      prompt: 'Someone writes the inner loop as `while q:` instead of `for _ in range(len(q)):`. What does their level-order function return for a 3-level tree?',
      options: [
        'One list containing every value',
        'The correct list of levels',
        'An infinite loop',
        'Only the root level',
      ],
      answer: 0,
      explanation: 'The inner while keeps popping children as they arrive, so the first "level" swallows the whole tree.',
      signature: 'bfs-levels:no-snapshot-bug',
    }),
    fill({
      id: 'o7-t-fill-snapshot',
      title: 'Level sizes',
      skills: ['bfs_levels', 'queue_deque'],
      prompt: 'Return how many nodes are on each level. Fill the blanks.',
      starterCode: `from collections import deque

def level_sizes(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        out.append(____)
        for _ in range(____):
            node = q.popleft()
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return out
`,
      solution: `from collections import deque

def level_sizes(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        out.append(len(q))
        for _ in range(len(q)):
            node = q.popleft()
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return out
`,
      tests: [t.eq('level_sizes(build_tree([1, 2, 3, 4, None, 5, 6]))', '[1, 2, 3]'), t.hidden('level_sizes(None)', '[]')],
      signature: 'bfs-levels:fill-sizes',
    }),
    code({
      id: 'o7-t-flat',
      title: 'BFS values',
      skills: ['bfs', 'queue_deque', 'treenode'],
      prompt: 'Write `bfs_values(root)` returning all values in BFS order as one flat list. Empty tree → `[]`.',
      starterCode: 'from collections import deque\n\ndef bfs_values(root):\n    pass\n',
      solution: `from collections import deque

def bfs_values(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        node = q.popleft()
        out.append(node.val)
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
    return out
`,
      tests: [
        t.eq('bfs_values(build_tree([3, 9, 20, None, None, 15, 7]))', '[3, 9, 20, 15, 7]'),
        t.hidden('bfs_values(None)', '[]'),
        t.hidden('bfs_values(build_tree([1, None, 2, None, 3]))', '[1, 2, 3]'),
      ],
      hints: ['Guard the empty tree first, or deque([None]) will crash on node.val.'],
      signature: 'tree-bfs:flat',
      minutes: 4,
    }),
    code({
      id: 'o7-t-depth',
      title: 'Depth by BFS',
      skills: ['bfs_levels', 'accumulator'],
      prompt: 'Write `depth_bfs(root)`: the number of levels, computed with BFS (count outer-loop passes). Compare with the recursive warm-up.',
      starterCode: 'from collections import deque\n\ndef depth_bfs(root):\n    pass\n',
      solution: `from collections import deque

def depth_bfs(root):
    if root is None:
        return 0
    depth = 0
    q = deque([root])
    while q:
        depth += 1
        for _ in range(len(q)):
            node = q.popleft()
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return depth
`,
      tests: [
        t.eq('depth_bfs(build_tree([3, 9, 20, None, None, 15, 7]))', '3'),
        t.hidden('depth_bfs(None)', '0'),
        t.hidden('depth_bfs(build_tree([1]))', '1'),
        t.hidden('depth_bfs(build_tree([1, 2, None, 3, None, 4]))', '4'),
      ],
      hints: ['One outer-loop pass = one level. Increment a counter per pass.'],
      signature: 'tree-bfs:depth',
      minutes: 4,
    }),
    code({
      id: 'o7-t-sums',
      title: 'Level sums',
      skills: ['bfs_levels', 'accumulator'],
      prompt: 'Write `level_sums(root)`: a list with the sum of each level, top to bottom.',
      starterCode: 'from collections import deque\n\ndef level_sums(root):\n    pass\n',
      solution: `from collections import deque

def level_sums(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        total = 0
        for _ in range(len(q)):
            node = q.popleft()
            total += node.val
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(total)
    return out
`,
      tests: [
        t.eq('level_sums(build_tree([1, 2, 3, 4, 5, None, 6]))', '[1, 5, 15]'),
        t.hidden('level_sums(None)', '[]'),
        t.hidden('level_sums(build_tree([-1, 1, -1]))', '[-1, 0]'),
      ],
      hints: ['Reset the total at the start of each outer pass; append it after the inner loop.'],
      signature: 'tree-bfs:level-sums',
      minutes: 5,
    }),
    code({
      id: 'o7-t-right-view',
      title: 'Right side view',
      skills: ['bfs_levels', 'treenode'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Looking at the tree from the right, you see the last node of each level. Write `right_view(root)` returning those values top to bottom.',
      starterCode: 'from collections import deque\n\ndef right_view(root):\n    pass\n',
      solution: `from collections import deque

def right_view(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        size = len(q)
        for i in range(size):
            node = q.popleft()
            if i == size - 1:
                out.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return out
`,
      tests: [
        t.eq('right_view(build_tree([1, 2, 3, None, 5, None, 4]))', '[1, 3, 4]'),
        t.eq('right_view(build_tree([1, 2, 3, 4]))', '[1, 3, 4]'),
        t.hidden('right_view(None)', '[]'),
        t.hidden('right_view(build_tree([1, 2]))', '[1, 2]'),
        t.hidden('right_view(build_tree([1, None, 3]))', '[1, 3]'),
      ],
      hints: [
        'Process one level at a time; the answer for a level is its last popped node.',
        'Save size = len(q) and loop with an index i.',
        'Record node.val when i == size - 1.',
      ],
      explanation: 'The rightmost visible node is not always a right child, as [1, 2, 3, 4] shows: 4 hangs on the left subtree. Level BFS gets that right for free.',
      signature: 'tree-bfs:right-view',
      minutes: 7,
    }),
    code({
      id: 'o7-t-widest',
      title: 'Most crowded level',
      skills: ['bfs_levels', 'state_tracking'],
      prompt: 'Write `widest_level(root)`: return the 0-based index of the level with the most nodes (earliest on ties). Empty tree → `-1`.',
      starterCode: 'from collections import deque\n\ndef widest_level(root):\n    pass\n',
      solution: `from collections import deque

def widest_level(root):
    if root is None:
        return -1
    best, best_level, level = 0, -1, 0
    q = deque([root])
    while q:
        if len(q) > best:
            best, best_level = len(q), level
        for _ in range(len(q)):
            node = q.popleft()
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        level += 1
    return best_level
`,
      tests: [
        t.eq('widest_level(build_tree([1, 2, 3, 4, 5, 6]))', '2'),
        t.eq('widest_level(build_tree([1, 2, 3, 4, 5]))', '1'),
        t.eq('widest_level(build_tree([1, 2, 3, 4]))', '1'),
        t.hidden('widest_level(None)', '-1'),
        t.hidden('widest_level(build_tree([7]))', '0'),
      ],
      hints: ['At the top of each outer pass, len(q) is the size of the current level.'],
      signature: 'tree-bfs:widest',
      minutes: 6,
    }),
    code({
      id: 'o7-t-min-depth',
      title: 'Shallowest leaf',
      skills: ['bfs_levels', 'early_return'],
      stage: 'combine',
      repType: 'combine',
      prompt: 'Write `min_depth(root)`: the number of levels down to the nearest leaf (a node with no children). Empty tree → 0. With BFS you can return the moment you pop the first leaf.',
      starterCode: 'from collections import deque\n\ndef min_depth(root):\n    pass\n',
      solution: `from collections import deque

def min_depth(root):
    if root is None:
        return 0
    depth = 0
    q = deque([root])
    while q:
        depth += 1
        for _ in range(len(q)):
            node = q.popleft()
            if node.left is None and node.right is None:
                return depth
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return depth
`,
      tests: [
        t.eq('min_depth(build_tree([3, 9, 20, None, None, 15, 7]))', '2'),
        t.eq('min_depth(build_tree([1, 2]))', '2'),
        t.hidden('min_depth(None)', '0'),
        t.hidden('min_depth(build_tree([1]))', '1'),
        t.hidden('min_depth(build_tree([1, None, 2, None, 3]))', '3'),
      ],
      hints: ['A leaf has both children None. The first leaf BFS pops is on the shallowest level.'],
      explanation: 'BFS stops at the first leaf without exploring deeper levels; the recursive version must look at every path. Note [1, 2] has depth 2: the root is not a leaf.',
      signature: 'tree-bfs:min-depth',
      minutes: 5,
    }),
    code({
      id: 'o7-t-zigzag',
      title: 'Zigzag levels',
      skills: ['bfs_levels', 'slicing'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Write `zigzag(root)`: like grouping by level, but every second level (the 2nd, 4th, …) is listed right to left. Keep the BFS itself unchanged; flip the level list when needed.',
      starterCode: 'from collections import deque\n\ndef zigzag(root):\n    pass\n',
      solution: `from collections import deque

def zigzag(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    left_to_right = True
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level if left_to_right else level[::-1])
        left_to_right = not left_to_right
    return out
`,
      tests: [
        t.eq('zigzag(build_tree([3, 9, 20, None, None, 15, 7]))', '[[3], [20, 9], [15, 7]]'),
        t.eq('zigzag(build_tree([1, 2, 3, 4, 5, 6, 7]))', '[[1], [3, 2], [4, 5, 6, 7]]'),
        t.hidden('zigzag(None)', '[]'),
        t.hidden('zigzag(build_tree([1]))', '[[1]]'),
        t.hidden('zigzag(build_tree([1, 2, 3, 4, None, None, 5, 6, 7]))', '[[1], [3, 2], [4, 5], [7, 6]]'),
      ],
      hints: [
        'Do not change the order children are enqueued; that would break the next level.',
        'Toggle a boolean each level and append level or level[::-1].',
      ],
      signature: 'tree-bfs:zigzag',
      minutes: 7,
    }),
    reorder({
      id: 'o7-t-reorder',
      title: 'Rebuild level grouping',
      skills: ['bfs_levels', 'queue_deque'],
      prompt: 'Order the lines to return a list of levels, each a list of values.',
      lines: [
        'from collections import deque',
        'def levels(root):',
        '    if root is None:',
        '        return []',
        '    out = []',
        '    q = deque([root])',
        '    while q:',
        '        level = []',
        '        for _ in range(len(q)):',
        '            node = q.popleft()',
        '            level.append(node.val)',
        '            if node.left:',
        '                q.append(node.left)',
        '            if node.right:',
        '                q.append(node.right)',
        '        out.append(level)',
        '    return out',
      ],
      tests: [t.eq('levels(build_tree([1, 2, 3]))', '[[1], [2, 3]]'), t.hidden('levels(None)', '[]')],
      signature: 'reorder:tree-levels',
      minutes: 4,
      important: true,
    }),
  ],
}

const levelOrderCap = {
  id: 'o7-cap-level-order',
  title: 'Level Order',
  summary: 'Capstone: group a binary tree by level, then explain it.',
  exercises: [
    capstone({
      id: 'cap-level-order',
      title: 'Level order traversal',
      problemId: 'level-order',
      skills: ['bfs', 'bfs_levels', 'queue_deque', 'treenode'],
      prompt: 'Given the root of a binary tree, return its values grouped by depth: a list of lists, the first holding the root, the next holding the root\'s children left to right, and so on. An empty tree gives `[]`.',
      starterCode: `from collections import deque
from typing import List, Optional

def level_order(root: Optional[TreeNode]) -> List[List[int]]:
    pass
`,
      solution: `from collections import deque
from typing import List, Optional

def level_order(root: Optional[TreeNode]) -> List[List[int]]:
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level)
    return out
`,
      examples: [
        { input: 'root = [3, 9, 20, None, None, 15, 7]', output: '[[3], [9, 20], [15, 7]]' },
        { input: 'root = [1]', output: '[[1]]' },
        { input: 'root = []', output: '[]' },
      ],
      tests: [
        t.eq('level_order(build_tree([3, 9, 20, None, None, 15, 7]))', '[[3], [9, 20], [15, 7]]'),
        t.eq('level_order(build_tree([1]))', '[[1]]'),
        t.eq('level_order(None)', '[]'),
        t.hidden('level_order(build_tree([1, 2, 3, 4, 5, 6, 7]))', '[[1], [2, 3], [4, 5, 6, 7]]'),
        t.hidden('level_order(build_tree([1, 2, None, 3, None, 4]))', '[[1], [2], [3], [4]]'),
        t.hidden('level_order(build_tree([1, None, 2, None, 3]))', '[[1], [2], [3]]'),
        t.hidden('level_order(build_tree([0, -1, 1]))', '[[0], [-1, 1]]'),
        t.hidden('level_order(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2, None, None, 5, 1]))', '[[5], [4, 8], [11, 13, 4], [7, 2, 5, 1]]'),
        t.hidden('level_order(build_tree([2, 2, 2]))', '[[2], [2, 2]]'),
      ],
      hints: [
        'Visiting by depth is BFS. The extra work is knowing where one level ends.',
        'A deque seeded with the root; an outer while q loop; one inner loop per level.',
        'At the start of each outer pass, len(q) is exactly the size of the current level: for _ in range(len(q)).',
        'Guard None. Per level: new list, pop len(q) nodes, append each value, enqueue non-None children, then append the level list to the result.',
      ],
      complexity: { time: 'O(n): each node is enqueued and popped once', space: 'O(w) for the queue, w = widest level (up to n/2), plus O(n) output' },
      explanation: 'The len(q) snapshot is the invariant: when an outer pass begins the queue holds exactly one level and nothing else, so draining that many nodes groups them correctly while their children line up for the next pass.',
      signature: 'capstone:level-order',
      minutes: 25,
    }),
    explain({
      id: 'o7-explain-level-order',
      title: 'Explain level order',
      skills: ['explanation', 'bfs_levels', 'complexity'],
      prompt: 'Out loud or in writing, as in an interview: explain your level-order solution. Cover the approach, the invariant that makes grouping correct, complexity, and the edge cases you checked.',
      rubric: [
        'BFS with a deque, because levels are visited in order of depth (and popleft is O(1), unlike list.pop(0))',
        'Invariant: at the start of each outer pass the queue holds exactly one level, so snapshot len(q)',
        'O(n) time; O(w) queue space where w is the widest level, plus the output',
        'Edge cases: empty tree returns [], single node, skewed tree (one node per level)',
      ],
      signature: 'explain:level-order',
      minutes: 6,
    }),
  ],
}

const islands = {
  id: 'o7-islands',
  title: 'Number of Islands',
  summary: 'Count connected regions: scan every cell, start a traversal at each unvisited land cell.',
  exercises: [
    code({
      id: 'o7-i-sink-dfs',
      title: 'Sink an island (DFS)',
      skills: ['grid_neighbors', 'tree_dfs', 'recursion_base_case'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 3,
      prompt: 'Strings grid of `"1"`/`"0"`. Write recursive `sink(grid, r, c)`: if `(r, c)` is out of bounds or not `"1"`, return 0. Otherwise set it to `"0"`, recurse into the 4 neighbors, and return the number of cells you sank. Overwriting with `"0"` replaces the visited set.',
      starterCode: `def sink(grid, r, c):
    # base case: out of bounds or not land
    # mark, then recurse in 4 directions
    pass
`,
      solution: `def sink(grid, r, c):
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != "1":
        return 0
    grid[r][c] = "0"
    return 1 + sink(grid, r + 1, c) + sink(grid, r - 1, c) + sink(grid, r, c + 1) + sink(grid, r, c - 1)
`,
      tests: [
        t.eq('sink([["1", "1"], ["0", "1"]], 0, 0)', '3'),
        t.check('grid is cleared', 'g = [["1", "1", "0"], ["1", "0", "1"]]\nassert sink(g, 0, 0) == 3\nassert g == [["0", "0", "0"], ["0", "0", "1"]]'),
        t.hidden('sink([["0"]], 0, 0)', '0'),
        t.hidden('sink([["1", "0", "1"]], 0, 2)', '1'),
      ],
      hints: [
        'Recursion like tree DFS: the "None" base case becomes "off the grid or not land".',
        'Mark the cell before recursing, or neighbors will recurse back into it forever.',
      ],
      explanation: 'Grid DFS is tree DFS with four children per cell and a base case that rejects out-of-bounds and already-visited cells. Marking before recursing is what prevents infinite recursion.',
      signature: 'grid-dfs:sink',
      minutes: 8,
      important: true,
    }),
    code({
      id: 'o7-i-size-bfs',
      title: 'Region size without mutation',
      skills: ['bfs', 'visited_set', 'grid_neighbors'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Grid of single letters. Write `region_size(grid, r, c)`: how many cells are 4-connected to `(r, c)` through cells with the same letter as `(r, c)`. Use BFS and a visited set; leave the grid unchanged.',
      starterCode: 'from collections import deque\n\ndef region_size(grid, r, c):\n    pass\n',
      solution: `from collections import deque

def region_size(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    target = grid[r][c]
    visited = {(r, c)}
    q = deque([(r, c)])
    while q:
        cr, cc = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == target and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
    return len(visited)
`,
      tests: [
        t.eq('region_size([["a", "a", "b"], ["b", "a", "b"], ["a", "b", "b"]], 0, 0)', '3'),
        t.eq('region_size([["a", "a", "b"], ["b", "a", "b"], ["a", "b", "b"]], 0, 2)', '4'),
        t.check('grid unchanged', 'g = [["x", "x"], ["y", "x"]]\nregion_size(g, 0, 0)\nassert g == [["x", "x"], ["y", "x"]]'),
        t.hidden('region_size([["z"]], 0, 0)', '1'),
        t.hidden('region_size([["a", "b", "a"]], 0, 0)', '1'),
      ],
      hints: [
        'Same BFS as reachable land, but "land" now means "same letter as the start".',
        'Do not reuse r, c as loop variables if you still need the start; name the popped cell cr, cc.',
      ],
      signature: 'grid-bfs:region-same-value',
      minutes: 8,
    }),
    choice({
      id: 'o7-i-why-count',
      title: 'What gets counted?',
      skills: ['visited_set', 'grid_nested'],
      prompt: 'To count islands you scan every cell. When exactly do you add 1 to the count?',
      options: [
        'When the cell is land and not yet visited; then traverse its whole island so its other cells are marked',
        'For every land cell',
        'For every land cell with no land neighbors',
        'Whenever a traversal ends at the grid border',
      ],
      answer: 0,
      explanation: 'Each traversal marks an entire island, so later land cells of that island are already visited and do not start a new count. One count per traversal start.',
      signature: 'islands:what-counts',
    }),
    reorder({
      id: 'o7-i-reorder',
      title: 'Outer scan',
      skills: ['grid_nested', 'visited_set'],
      prompt: 'Assume `sink(grid, r, c)` from earlier exists. Order the lines to count land regions.',
      lines: [
        'def count_regions(grid):',
        '    count = 0',
        '    for r in range(len(grid)):',
        '        for c in range(len(grid[0])):',
        '            if grid[r][c] == "1":',
        '                sink(grid, r, c)',
        '                count += 1',
        '    return count',
        'def sink(grid, r, c):',
        '    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != "1":',
        '        return 0',
        '    grid[r][c] = "0"',
        '    return 1 + sink(grid, r + 1, c) + sink(grid, r - 1, c) + sink(grid, r, c + 1) + sink(grid, r, c - 1)',
      ],
      tests: [t.eq('count_regions([["1", "0", "1"], ["1", "0", "0"], ["0", "0", "1"]])', '3'), t.hidden('count_regions([["0"]])', '0')],
      signature: 'reorder:islands-scan',
      minutes: 4,
    }),
    capstone({
      id: 'cap-number-of-islands',
      title: 'Number of islands',
      problemId: 'number-of-islands',
      skills: ['grid_nested', 'grid_neighbors', 'visited_set', 'bfs'],
      prompt: 'A map is a grid of strings: `"1"` is land and `"0"` is water. Land cells that touch horizontally or vertically (not diagonally) belong to the same island. Everything outside the grid is water. Return how many islands there are.',
      starterCode: `from collections import deque
from typing import List

def num_islands(grid: List[List[str]]) -> int:
    pass
`,
      solution: `from collections import deque
from typing import List

def num_islands(grid: List[List[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or (r, c) in visited:
                continue
            count += 1
            visited.add((r, c))
            q = deque([(r, c)])
            while q:
                cr, cc = q.popleft()
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        q.append((nr, nc))
    return count
`,
      examples: [
        { input: 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]', output: '2' },
        { input: 'grid = [["1","0","1","0","1"]]', output: '3', note: 'diagonals do not connect' },
        { input: 'grid = [["0","0"],["0","0"]]', output: '0' },
      ],
      tests: [
        t.eq('num_islands([["1", "1", "0"], ["1", "0", "0"], ["0", "0", "1"]])', '2'),
        t.eq('num_islands([["1", "0", "1", "0", "1"]])', '3'),
        t.eq('num_islands([["0", "0"], ["0", "0"]])', '0'),
        t.hidden('num_islands([["1"]])', '1'),
        t.hidden('num_islands([["0"]])', '0'),
        t.hidden('num_islands([["1", "0"], ["0", "1"]])', '2'),
        t.hidden('num_islands([["1", "1", "1"], ["1", "0", "1"], ["1", "1", "1"]])', '1'),
        t.hidden('num_islands([["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]])', '3'),
        t.hidden('num_islands([["1"], ["1"], ["0"], ["1"]])', '2'),
        t.hidden('num_islands([])', '0'),
      ],
      hints: [
        'An island is a connected region. Count how many times you have to start a fresh traversal.',
        'Nested loops over every cell, plus a visited set of (r, c) tuples (or overwrite land with "0").',
        'When you find land that is not yet visited: count += 1, then BFS or DFS from it marking every connected land cell.',
        'Scan r, c; skip water and visited; count += 1; seed a deque with (r, c) marked; pop, try 4 directions with bounds check, enqueue unvisited "1" cells marking them as you enqueue.',
      ],
      complexity: { time: 'O(rows * cols): each cell is scanned once and enqueued at most once', space: 'O(rows * cols) for the visited set (the queue is at most O(min(rows, cols)) for BFS)' },
      explanation: 'Each traversal marks one whole island, so the outer scan only starts a new traversal on land that belongs to an island not yet seen. The count of traversal starts is the number of islands.',
      signature: 'capstone:number-of-islands',
      minutes: 30,
    }),
    explain({
      id: 'o7-explain-islands',
      title: 'Explain number of islands',
      skills: ['explanation', 'complexity', 'edge_cases'],
      prompt: 'Explain your islands solution as you would to an interviewer, then say what changes if you used DFS recursion instead of BFS.',
      rubric: [
        'Scan every cell; each unvisited land cell starts a new island and a traversal that marks the whole island',
        'Mark visited when enqueuing (or overwrite with "0"), with a bounds check before reading neighbors',
        'O(rows * cols) time and space',
        'Edge cases: all water, single cell, diagonal-only touching counts as separate islands, strings "1" not ints',
        'Recursive DFS works too but can hit Python\'s recursion limit on a huge all-land grid; BFS avoids that',
      ],
      signature: 'explain:number-of-islands',
      minutes: 6,
    }),
    code({
      id: 'o7-i-max-area',
      title: 'Largest island area',
      skills: ['grid_nested', 'grid_neighbors', 'visited_set', 'bfs'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 3,
      prompt: 'Ints grid of `1` (land) and `0` (water). Write `max_area(grid)`: the size of the largest island, or 0 if there is no land. No starter this time.',
      solution: `from collections import deque

def max_area(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1 or (r, c) in visited:
                continue
            visited.add((r, c))
            q = deque([(r, c)])
            size = 0
            while q:
                cr, cc = q.popleft()
                size += 1
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        q.append((nr, nc))
            best = max(best, size)
    return best
`,
      tests: [
        t.eq('max_area([[1, 1, 0], [0, 1, 0], [0, 0, 1]])', '3'),
        t.eq('max_area([[0, 0], [0, 0]])', '0'),
        t.hidden('max_area([[1]])', '1'),
        t.hidden('max_area([[1, 0, 1, 1], [1, 0, 1, 1], [0, 0, 0, 0], [1, 1, 1, 0]])', '4'),
        t.hidden('max_area([[1, 1, 1, 1, 1]])', '5'),
      ],
      hints: [
        'Islands, but instead of counting traversals, measure each one.',
        'Count pops inside the BFS (or return a size from DFS), then keep the max.',
      ],
      signature: 'grid-bfs:max-area',
      minutes: 10,
      important: true,
    }),
    code({
      id: 'o7-i-enclosed',
      title: 'Land that cannot reach the edge',
      skills: ['grid_neighbors', 'visited_set', 'bfs', 'grid_nested'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 4,
      prompt: 'Ints grid of `1` (land) and `0` (water). Write `enclosed_land(grid)`: how many land cells have no 4-directional land path to the border of the grid. Hint of the trick: start from the border, not from the inside.',
      solution: `from collections import deque

def enclosed_land(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    q = deque()
    for r in range(rows):
        for c in range(cols):
            on_border = r == 0 or c == 0 or r == rows - 1 or c == cols - 1
            if on_border and grid[r][c] == 1:
                visited.add((r, c))
                q.append((r, c))
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
    total = sum(row.count(1) for row in grid)
    return total - len(visited)
`,
      tests: [
        t.eq('enclosed_land([[0, 0, 0, 0], [1, 0, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]])', '3'),
        t.eq('enclosed_land([[0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]])', '0'),
        t.hidden('enclosed_land([[1]])', '0'),
        t.hidden('enclosed_land([[0, 0, 0], [0, 1, 0], [0, 0, 0]])', '1'),
        t.hidden('enclosed_land([[1, 1, 1], [1, 1, 1], [1, 1, 1]])', '0'),
        t.hidden('enclosed_land([[0, 0, 0, 0, 0], [0, 1, 1, 0, 1], [0, 1, 0, 0, 1], [0, 0, 0, 0, 0]])', '3'),
      ],
      hints: [
        'Asking "can this cell escape?" for every cell is slow. Ask instead: what can the border reach?',
        'Multi-source BFS seeded with every border land cell.',
        'Everything the BFS marks can escape; the rest of the land cannot.',
        'Seed border land, BFS through land, then answer = total land - len(visited).',
      ],
      explanation: 'Reversing the question (spread from the border inward) turns many searches into one O(rows * cols) multi-source traversal.',
      signature: 'grid-bfs:border-reach',
      minutes: 10,
    }),
  ],
}

const cold = {
  id: 'o7-cold',
  title: 'Cold reps',
  summary: 'Today\'s primitives from a blank editor.',
  exercises: [
    choice({
      id: 'o7-c-pop0',
      title: 'Queue cost recall',
      skills: ['queue_deque'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'A BFS over n nodes uses `queue.pop(0)` on a list. Worst-case total cost of all the pops?',
      options: ['O(n²)', 'O(n)', 'O(n log n)', 'O(1)'],
      answer: 0,
      explanation: 'Each pop(0) is O(n) because it shifts the list; n pops gives O(n²). deque.popleft keeps BFS O(n).',
      signature: 'deque:why-not-pop0',
    }),
    code({
      id: 'o7-c-neighbors',
      title: 'Neighbors from memory',
      skills: ['grid_neighbors', 'tuples'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `neighbors4(rows, cols, r, c)` returning valid neighbor tuples in the order up, down, left, right.',
      solution: `def neighbors4(rows, cols, r, c):
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            out.append((nr, nc))
    return out
`,
      tests: [
        t.eq('neighbors4(3, 3, 0, 0)', '[(1, 0), (0, 1)]'),
        t.hidden('neighbors4(3, 3, 2, 2)', '[(1, 2), (2, 1)]'),
        t.hidden('neighbors4(1, 1, 0, 0)', '[]'),
      ],
      signature: 'neighbors:list',
      minutes: 4,
    }),
    code({
      id: 'o7-c-last-level',
      title: 'Deepest level',
      skills: ['bfs_levels', 'queue_deque'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `deepest_values(root)`: the values on the bottom level, left to right. Empty tree → `[]`.',
      solution: `from collections import deque

def deepest_values(root):
    if root is None:
        return []
    q = deque([root])
    level = []
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return level
`,
      tests: [
        t.eq('deepest_values(build_tree([1, 2, 3, 4, None, None, 5]))', '[4, 5]'),
        t.hidden('deepest_values(None)', '[]'),
        t.hidden('deepest_values(build_tree([9]))', '[9]'),
        t.hidden('deepest_values(build_tree([1, 2, 3, None, None, 6]))', '[6]'),
      ],
      hints: ['Overwrite level on every outer pass; after the loop it holds the last one.'],
      signature: 'tree-bfs:deepest-level',
      minutes: 5,
    }),
    code({
      id: 'o7-c-blobs',
      title: 'Count blobs in strings',
      skills: ['grid_nested', 'grid_neighbors', 'visited_set', 'bfs'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'This grid is a list of strings, like `["#.#", "##."]`. `grid[r][c]` still works on strings, but you cannot assign to them. Write `count_blobs(grid)`: the number of 4-connected groups of `"#"`.',
      solution: `from collections import deque

def count_blobs(grid):
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "#" or (r, c) in visited:
                continue
            count += 1
            visited.add((r, c))
            q = deque([(r, c)])
            while q:
                cr, cc = q.popleft()
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "#" and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        q.append((nr, nc))
    return count
`,
      tests: [
        t.eq('count_blobs(["#.#", "##."])', '2'),
        t.eq('count_blobs(["...", "..."])', '0'),
        t.hidden('count_blobs([])', '0'),
        t.hidden('count_blobs(["#"])', '1'),
        t.hidden('count_blobs(["#.#.#", ".#.#.", "#.#.#"])', '8'),
        t.hidden('count_blobs(["###", "#.#", "###"])', '1'),
      ],
      hints: ['Strings are immutable, so you need a visited set rather than overwriting cells.'],
      signature: 'grid-bfs:count-components',
      minutes: 10,
    }),
  ],
}

export const day: DayModule = {
  date: '2026-10-07',
  short: 'BFS',
  title: 'BFS + grid traversal',
  focus: 'Use deque as a queue, move around a grid safely with directions and bounds checks, and run BFS over grids and trees by level.',
  sections: [warmup, queues, grids, neighbors, gridBfs, treeLevels, levelOrderCap, islands, cold],
  capstones: ['level-order', 'number-of-islands'],
}
