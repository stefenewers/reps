import type { DayModule } from '@/lib/types'
import { capstone, choice, debug, explain, output, t, write } from './build'

/**
 * October 7: BFS + grid traversal.
 * deque → grids → neighbors & bounds → visited + grid BFS → tree BFS by level
 * → Level Order capstone → flood fill / islands → Number of Islands capstone.
 *
 * Code-first: each construct gets at most one trace, then several write reps in
 * different shapes, Debug Reps on the classic BFS slips, and a cold rewrite.
 */

const warmup = {
  id: 'o7-warmup',
  title: 'Warm-up',
  summary: 'Cold reps on dicts, two pointers, stacks and tree DFS.',
  exercises: [
    write({
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
      minutes: 4,
    }),
    write({
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
      minutes: 6,
    }),
    write({
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
      minutes: 6,
    }),
    write({
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
    write({
      id: 'o7-dq-drain',
      title: 'Drain a queue',
      skills: ['queue_deque', 'while_loop'],
      prompt: 'Write `drain(items)`: put `items` into a deque, then pop from the front until it is empty, collecting what comes out. Import `deque` yourself.',
      starterCode: 'def drain(items):\n    pass\n',
      solution: `from collections import deque

def drain(items):
    q = deque(items)
    out = []
    while q:
        out.append(q.popleft())
    return out
`,
      tests: [t.eq('drain([3, 1, 2])', '[3, 1, 2]'), t.hidden('drain([])', '[]'), t.hidden('drain(["a"])', '["a"]')],
      hints: ['from collections import deque. while q: out.append(q.popleft())'],
      signature: 'deque:drain',
      minutes: 4,
      important: true,
    }),
    debug({
      id: 'o7-dq-dbg-pop-end',
      title: 'Debug: wrong end of the queue',
      skills: ['queue_deque', 'bfs'],
      prompt: 'Think of the numbers as a tree where `x` has children `2x` and `2x + 1`. `bfs_numbers(limit)` should visit them breadth-first starting at 1, which simply gives `[1, 2, 3, …, limit]`. It returns a jumbled order. Make the tests pass.',
      brokenCode: `from collections import deque

def bfs_numbers(limit):
    q = deque([1])
    order = []
    while q:
        x = q.pop()
        order.append(x)
        for child in (2 * x, 2 * x + 1):
            if child <= limit:
                q.append(child)
    return order
`,
      solution: `from collections import deque

def bfs_numbers(limit):
    q = deque([1])
    order = []
    while q:
        x = q.popleft()
        order.append(x)
        for child in (2 * x, 2 * x + 1):
            if child <= limit:
                q.append(child)
    return order
`,
      tests: [t.eq('bfs_numbers(7)', '[1, 2, 3, 4, 5, 6, 7]'), t.eq('bfs_numbers(1)', '[1]'), t.hidden('bfs_numbers(10)', 'list(range(1, 11))')],
      hints: ['Which end does the oldest item come out of?', 'deque.pop() takes the newest item (stack). A queue needs popleft().'],
      explanation: 'pop() turns the deque into a stack and the traversal into DFS. Every BFS needs popleft().',
      signature: 'debug:deque-pop-end',
      minutes: 4,
    }),
    write({
      id: 'o7-dq-recent',
      title: 'Recent events counter',
      skills: ['queue_deque', 'while_loop'],
      stage: 'microbuild',
      style: 'finish',
      prompt: 'Times arrive in increasing order. For each time `t`, report how many events (including this one) happened in `[t - window + 1, t]`. Finish `recent_counts(times, window)`. Keep a deque; drop expired times from the left.',
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
    write({
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
      note: '`grid[r]` is a whole row. `grid[r][c]` is one cell: r goes down, c goes across.',
      explanation: 'len(grid) counts rows; len(grid[0]) counts cells in a row. grid[-1] is the last row.',
      signature: 'trace:grid-dims',
    }),
    write({
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
      minutes: 5,
      important: true,
    }),
    debug({
      id: 'o7-g-dbg-dims',
      title: 'Debug: row maximums',
      skills: ['grid_nested', 'len'],
      prompt: '`row_maxes(grid)` should return the largest value in each row, top to bottom. It works on square grids but not on others. Make the tests pass.',
      brokenCode: `def row_maxes(grid):
    rows, cols = len(grid[0]), len(grid)
    out = []
    for r in range(rows):
        best = grid[r][0]
        for c in range(cols):
            best = max(best, grid[r][c])
        out.append(best)
    return out
`,
      solution: `def row_maxes(grid):
    rows, cols = len(grid), len(grid[0])
    out = []
    for r in range(rows):
        best = grid[r][0]
        for c in range(cols):
            best = max(best, grid[r][c])
        out.append(best)
    return out
`,
      tests: [
        t.eq('row_maxes([[1, 5], [7, 0]])', '[5, 7]'),
        t.eq('row_maxes([[1, 5, 2], [7, 0, 3]])', '[5, 7]'),
        t.hidden('row_maxes([[4], [9], [-1]])', '[4, 9, -1]'),
      ],
      hints: ['How many rows does a 2 x 3 grid have, and which len() gives it?'],
      explanation: 'rows = len(grid), cols = len(grid[0]). Square test grids hide a swap, so always test a non-square grid.',
      signature: 'debug:grid-dims-swapped',
      minutes: 4,
    }),
    write({
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
      minutes: 5,
    }),
    debug({
      id: 'o7-g-dbg-alias',
      title: 'Debug: identity grid',
      skills: ['grid_nested', 'list_comprehension'],
      prompt: '`identity(n)` should return an n x n grid of zeros with ones on the main diagonal, like `[[1, 0], [0, 1]]`. Make the tests pass.',
      brokenCode: `def identity(n):
    grid = [[0] * n] * n
    for i in range(n):
        grid[i][i] = 1
    return grid
`,
      solution: `def identity(n):
    grid = [[0] * n for _ in range(n)]
    for i in range(n):
        grid[i][i] = 1
    return grid
`,
      tests: [
        t.eq('identity(2)', '[[1, 0], [0, 1]]'),
        t.eq('identity(1)', '[[1]]'),
        t.hidden('identity(3)', '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]'),
      ],
      hints: ['Print the grid after setting only grid[0][0]. How many rows changed?', '`* n` on the outer list copies a reference to the same row.'],
      note: 'Build grids with a comprehension: `[[0] * cols for _ in range(rows)]`.',
      explanation: '`[[0] * n] * n` is n references to one row object. The comprehension builds a new row each iteration.',
      signature: 'debug:grid-alias',
      minutes: 4,
      important: true,
    }),
    debug({
      id: 'o7-g-dbg-strings',
      title: 'Debug: count the land',
      skills: ['grid_nested', 'accumulator'],
      prompt: 'Grids in interview problems often hold strings. `count_land(grid)` should count the cells holding `"1"`. Make the tests pass.',
      brokenCode: `def count_land(grid):
    total = 0
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] == 1:
                total += 1
    return total
`,
      solution: `def count_land(grid):
    total = 0
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] == "1":
                total += 1
    return total
`,
      tests: [
        t.eq('count_land([["1", "0"], ["1", "1"]])', '3'),
        t.hidden('count_land([["0"]])', '0'),
        t.hidden('count_land([["1", "1", "1"]])', '3'),
      ],
      hints: ['"1" == 1 is False in Python.'],
      explanation: 'A string never equals an int. Check the input type in the examples before writing the comparison.',
      signature: 'debug:grid-string-cells',
      minutes: 3,
    }),
  ],
}

const neighbors = {
  id: 'o7-neighbors',
  title: 'Neighbors',
  summary: 'A directions list plus a bounds check generates every valid neighbor.',
  exercises: [
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
      note: '`DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]`, then `nr, nc = r + dr, c + dc` and `0 <= nr < rows and 0 <= nc < cols`.',
      explanation: '(-1, 1) fails 0 <= nr. The rest are inside the grid and printed in directions-list order.',
      signature: 'trace:neighbors',
      minutes: 2,
    }),
    write({
      id: 'o7-n-list',
      title: 'List the neighbors',
      skills: ['grid_neighbors', 'tuples'],
      style: 'finish',
      prompt: 'Finish `neighbors(grid, r, c)`: return valid neighbor coordinates as tuples in the order up, down, left, right.',
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
    write({
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
      minutes: 6,
      important: true,
    }),
    debug({
      id: 'o7-n-dbg-bounds',
      title: 'Debug: neighbors off the edge',
      skills: ['grid_neighbors'],
      prompt: '`neighbors4(rows, cols, r, c)` should return the in-grid 4-neighbors of `(r, c)` (up, down, left, right) for a grid of size rows x cols. Make the tests pass.',
      brokenCode: `def neighbors4(rows, cols, r, c):
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr <= rows and 0 <= nc <= cols:
            out.append((nr, nc))
    return out
`,
      solution: `def neighbors4(rows, cols, r, c):
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            out.append((nr, nc))
    return out
`,
      tests: [
        t.eq('neighbors4(2, 2, 1, 1)', '[(0, 1), (1, 0)]'),
        t.eq('neighbors4(3, 3, 1, 1)', '[(0, 1), (2, 1), (1, 0), (1, 2)]'),
        t.hidden('neighbors4(1, 1, 0, 0)', '[]'),
      ],
      hints: ['What is the largest valid row index in a grid with `rows` rows?'],
      explanation: 'Valid indexes are 0..rows-1, so the check is nr < rows. With <= the last row index plus one sneaks in.',
      signature: 'debug:bounds-off-by-one',
      minutes: 4,
    }),
    debug({
      id: 'o7-n-dbg-dirs',
      title: 'Debug: a missing direction',
      skills: ['grid_neighbors', 'tuples'],
      prompt: '`open_neighbors(grid, r, c)` should count the 4-neighbors (up, down, left, right) of `(r, c)` that hold `"."`. Make the tests pass.',
      brokenCode: `def open_neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (1, 0)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == ".":
            count += 1
    return count
`,
      solution: `def open_neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == ".":
            count += 1
    return count
`,
      tests: [
        t.eq('open_neighbors([[".", "."], ["#", "#"]], 0, 0)', '1'),
        t.eq('open_neighbors([["#", ".", "#"], [".", ".", "."], ["#", ".", "#"]], 1, 1)', '4'),
        t.hidden('open_neighbors([["."]], 0, 0)', '0'),
        t.hidden('open_neighbors([[".", ".", "."]], 0, 1)', '2'),
      ],
      hints: ['Read the four (dr, dc) pairs out loud: up, down, left, …?'],
      explanation: 'Each direction changes one coordinate by one: (-1, 0), (1, 0), (0, -1), (0, 1). Type it the same way every time so a typo stands out.',
      signature: 'debug:dirs-missing',
      minutes: 4,
    }),
    write({
      id: 'o7-n-wt-wrap',
      title: 'Break it: negative indexes',
      skills: ['grid_neighbors', 'list_index'],
      style: 'write-test',
      prompt: '`land_count_buggy` only checks `nr < rows and nc < cols`. In Python `grid[-1]` does not raise, it quietly reads the last row. Write `breaking_input()` returning a `(grid, r, c)` triple (a `"1"`/`"0"` strings grid) on which `land_count_buggy` returns the wrong count.',
      starterCode: `def land_count_buggy(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if nr < rows and nc < cols and grid[nr][nc] == "1":
            count += 1
    return count

def breaking_input():
    pass
`,
      solution: `def land_count_buggy(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if nr < rows and nc < cols and grid[nr][nc] == "1":
            count += 1
    return count

def breaking_input():
    grid = [["0"], ["1"]]
    return grid, 0, 0
`,
      tests: [
        t.check(
          'buggy count is wrong on your input',
          `g, r, c = breaking_input()
def _ok(grid, r, c):
    n = 0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] == "1":
            n += 1
    return n
assert land_count_buggy(g, r, c) != _ok(g, r, c), "the buggy function still gets this one right"`,
        ),
      ],
      hints: ['Pick a cell on the top row or the left column.', 'Put land on the opposite edge so the wrap-around read lands on a "1".'],
      explanation: 'Going off the bottom or right raises IndexError, but going off the top or left wraps silently. That is why both halves of 0 <= nr < rows matter.',
      signature: 'write-test:negative-wrap',
      minutes: 4,
    }),
    write({
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
      minutes: 9,
    }),
  ],
}

const gridBfs = {
  id: 'o7-grid-bfs',
  title: 'Grid BFS',
  summary: 'Queue + directions + bounds + visited set, marked when enqueuing.',
  exercises: [
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
      note: 'Mark on enqueue: `visited.add(nxt)` and `q.append(nxt)` always travel together.',
      explanation: 'BFS pops cells in order of distance from the start: (0,0) at 0, then (1,0) and (0,1) at 1, then (0,2) at 2, then (1,2) at 3.',
      signature: 'trace:grid-bfs-order',
      minutes: 3,
      difficulty: 2,
    }),
    write({
      id: 'o7-v-finish',
      title: 'Finish the grid BFS',
      skills: ['bfs', 'visited_set', 'grid_neighbors'],
      style: 'finish',
      prompt: 'Ints grid, `1` is open. `reachable(grid, sr, sc)` counts the open cells reachable from the open start. The skeleton is there; write the neighbor loop: in bounds, open, not visited → mark and enqueue.',
      starterCode: `from collections import deque

def reachable(grid, sr, sc):
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        pass
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
      tests: [
        t.eq('reachable([[1, 1, 0], [0, 1, 0], [1, 0, 1]], 0, 0)', '3'),
        t.eq('reachable([[1, 1], [1, 0]], 0, 0)', '3'),
        t.hidden('reachable([[1, 0, 1]], 0, 0)', '1'),
        t.hidden('reachable([[1]], 0, 0)', '1'),
      ],
      hints: ['Directions loop, nr/nc, one combined if, then visited.add and q.append together.'],
      signature: 'grid-bfs:finish-neighbors',
      minutes: 6,
      important: true,
    }),
    write({
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
        'Same shape as the rep you just finished.',
        'Seed both visited and the queue with the start.',
        'Neighbor condition: in bounds, "1", not in visited.',
        'Mark and enqueue together; return len(visited).',
      ],
      signature: 'grid-bfs:reachable-count',
      minutes: 9,
      important: true,
    }),
    debug({
      id: 'o7-v-dbg-late-mark',
      title: 'Debug: cells visited twice',
      skills: ['bfs', 'visited_set'],
      prompt: '`visit_order(grid)` should return each open cell (`1`) reachable from `(0, 0)` exactly once, in the order BFS pops them. Directions are down, right, up, left. Make the tests pass.',
      brokenCode: `from collections import deque

def visit_order(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    q = deque([(0, 0)])
    order = []
    while q:
        r, c = q.popleft()
        visited.add((r, c))
        order.append((r, c))
        for dr, dc in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:
                q.append((nr, nc))
    return order
`,
      solution: `from collections import deque

def visit_order(grid):
    rows, cols = len(grid), len(grid[0])
    visited = {(0, 0)}
    q = deque([(0, 0)])
    order = []
    while q:
        r, c = q.popleft()
        order.append((r, c))
        for dr, dc in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
    return order
`,
      tests: [
        t.eq('visit_order([[1, 1], [1, 1]])', '[(0, 0), (1, 0), (0, 1), (1, 1)]'),
        t.eq('visit_order([[1, 0], [1, 0]])', '[(0, 0), (1, 0)]'),
        t.hidden('visit_order([[1, 1, 1], [1, 1, 1]])', '[(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2)]'),
      ],
      hints: [
        'Which cell shows up twice? Who enqueued it each time?',
        'When a cell is still waiting in the queue, nothing stops another cell from enqueuing it again.',
        'Mark a cell at the moment you append it, and seed visited with the start.',
      ],
      explanation: 'Marking on pop leaves a gap: between enqueue and pop, other cells can enqueue the same cell. Marking on enqueue gives exactly one push per cell.',
      signature: 'debug:bfs-mark-late',
      minutes: 6,
      important: true,
    }),
    debug({
      id: 'o7-v-dbg-tuple',
      title: 'Debug: what goes in visited',
      skills: ['visited_set', 'tuples'],
      prompt: '`open_area(grid, sr, sc)` should count the `"."` cells reachable from the start (which is `"."`), moving in 4 directions. Make the tests pass.',
      brokenCode: `from collections import deque

def open_area(grid, sr, sc):
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in visited:
                visited.add([nr, nc])
                q.append((nr, nc))
    return len(visited)
`,
      solution: `from collections import deque

def open_area(grid, sr, sc):
    rows, cols = len(grid), len(grid[0])
    visited = {(sr, sc)}
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc))
    return len(visited)
`,
      tests: [
        t.eq('open_area([[".", "."], ["#", "."]], 0, 0)', '3'),
        t.eq('open_area([["."]], 0, 0)', '1'),
        t.hidden('open_area([[".", "#", "."]], 0, 2)', '1'),
      ],
      hints: ['Read the error message: what type is unhashable?'],
      explanation: 'Set members must be hashable. A tuple (nr, nc) is; a list [nr, nc] is not.',
      signature: 'debug:visited-list-not-tuple',
      minutes: 4,
    }),
    write({
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
      explanation: 'All distance-d cells are enqueued before any distance-(d+1) cell, so the first pop of the target is along a shortest path. DFS could reach it first via a detour.',
      signature: 'grid-bfs:shortest-steps',
      minutes: 12,
      important: true,
    }),
    write({
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
      minutes: 11,
      important: true,
    }),
    write({
      id: 'o7-v-dfs-stack',
      title: 'Translate: queue to stack',
      skills: ['stack_push_pop', 'visited_set', 'grid_neighbors'],
      stage: 'combine',
      repType: 'combine',
      style: 'translate',
      difficulty: 3,
      prompt: 'Below is the BFS `land_reachable`. Under it, write `land_reachable_dfs(grid, sr, sc)` with the same behaviour as an iterative DFS: a plain list used as a stack (`append` / `pop()`), no deque, no recursion.',
      starterCode: `from collections import deque

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


def land_reachable_dfs(grid, sr, sc):
    pass
`,
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


def land_reachable_dfs(grid, sr, sc):
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
      minutes: 10,
    }),
    write({
      id: 'o7-v-multi-source',
      title: 'Distance to nearest exit',
      skills: ['bfs', 'grid_neighbors', 'queue_deque', 'grid_nested'],
      stage: 'pattern',
      repType: 'pattern',
      style: 'finish',
      difficulty: 4,
      prompt: 'Ints grid: `0` marks an exit, `1` an ordinary cell. Finish `nearest_exit(grid)`: return a new grid where each cell holds the fewest 4-directional steps to any exit. There is at least one exit. Start the BFS from **all** exits at once.',
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
      minutes: 11,
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
      id: 'o7-t-trace-levels',
      title: 'Trace levels',
      skills: ['bfs_levels', 'treenode'],
      prompt: '`build_tree` makes a tree from a level-order list (None = no node). What prints?',
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
      note: '`range(len(q))` is evaluated once, when the level starts: at that moment the queue holds exactly one level. Trees need no visited set.',
      explanation: 'Each pass of the outer loop drains exactly one level and enqueues the next.',
      signature: 'trace:tree-bfs-levels',
      minutes: 2,
    }),
    write({
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
      minutes: 9,
    }),
    debug({
      id: 'o7-t-dbg-none-child',
      title: 'Debug: counting leaves',
      skills: ['bfs', 'treenode'],
      prompt: '`count_leaves(root)` should count the nodes with no children, using BFS. Empty tree → 0. Make the tests pass.',
      brokenCode: `from collections import deque

def count_leaves(root):
    if root is None:
        return 0
    leaves = 0
    q = deque([root])
    while q:
        node = q.popleft()
        if node.left is None and node.right is None:
            leaves += 1
        q.append(node.left)
        q.append(node.right)
    return leaves
`,
      solution: `from collections import deque

def count_leaves(root):
    if root is None:
        return 0
    leaves = 0
    q = deque([root])
    while q:
        node = q.popleft()
        if node.left is None and node.right is None:
            leaves += 1
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
    return leaves
`,
      tests: [
        t.eq('count_leaves(build_tree([1, 2, 3, 4]))', '2'),
        t.eq('count_leaves(None)', '0'),
        t.hidden('count_leaves(build_tree([1]))', '1'),
        t.hidden('count_leaves(build_tree([1, 2, 3, 4, 5, 6, 7]))', '4'),
      ],
      hints: ['What is in the queue after you pop a leaf?'],
      explanation: 'Only enqueue children that exist. Otherwise a None is popped next and None.left raises AttributeError.',
      signature: 'debug:tree-bfs-none-child',
      minutes: 4,
    }),
    write({
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
      minutes: 10,
      important: true,
    }),
    write({
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
      minutes: 11,
    }),
    debug({
      id: 'o7-t-dbg-snapshot',
      title: 'Debug: levels run together',
      skills: ['bfs_levels', 'queue_deque'],
      prompt: '`level_mins(root)` should return the smallest value on each level, top to bottom. Make the tests pass.',
      brokenCode: `from collections import deque

def level_mins(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        smallest = q[0].val
        done = 0
        while done < len(q):
            node = q.popleft()
            done += 1
            smallest = min(smallest, node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(smallest)
    return out
`,
      solution: `from collections import deque

def level_mins(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        smallest = q[0].val
        for _ in range(len(q)):
            node = q.popleft()
            smallest = min(smallest, node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(smallest)
    return out
`,
      tests: [
        t.eq('level_mins(build_tree([5, 3, 8, 9, 1]))', '[5, 3, 1]'),
        t.eq('level_mins(build_tree([2]))', '[2]'),
        t.hidden('level_mins(None)', '[]'),
        t.hidden('level_mins(build_tree([1, 7, 4, 6, 5, 3, 2]))', '[1, 4, 2]'),
      ],
      hints: [
        'Print how many nodes each inner loop pops.',
        'len(q) changes while children are appended. When should the level size be read?',
        'Read the size once before the inner loop: for _ in range(len(q)).',
      ],
      explanation: 'The level size must be a snapshot taken before the inner loop starts. Re-reading len(q) each pass lets children of this level leak into it.',
      signature: 'debug:level-snapshot',
      minutes: 6,
      important: true,
    }),
    write({
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
      minutes: 12,
    }),
    write({
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
      minutes: 11,
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
      minutes: 5,
    }),
  ],
}

const islands = {
  id: 'o7-islands',
  title: 'Number of Islands',
  summary: 'Count connected regions: scan every cell, start a traversal at each unvisited land cell.',
  exercises: [
    write({
      id: 'o7-i-sink-dfs',
      title: 'Sink an island (DFS)',
      skills: ['grid_neighbors', 'tree_dfs', 'recursion_base_case'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 3,
      prompt: 'Strings grid of `"1"`/`"0"`. Write recursive `sink(grid, r, c)`: if `(r, c)` is out of bounds or not `"1"`, return 0. Otherwise set it to `"0"`, recurse into the 4 neighbors, and return the number of cells you sank. Overwriting with `"0"` replaces the visited set.',
      starterCode: 'def sink(grid, r, c):\n    pass\n',
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
      minutes: 5,
      important: true,
    }),
    write({
      id: 'o7-i-sink-iter',
      title: 'Translate: recursion to a stack',
      skills: ['grid_neighbors', 'stack_push_pop'],
      stage: 'combine',
      repType: 'combine',
      style: 'translate',
      difficulty: 3,
      prompt: 'Rewrite the recursive `sink` below as `sink_iter(grid, r, c)`: same result (sink the island, return its size), but with an explicit stack and no recursion, so a huge island cannot hit Python\'s recursion limit.',
      starterCode: `def sink(grid, r, c):
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != "1":
        return 0
    grid[r][c] = "0"
    return 1 + sink(grid, r + 1, c) + sink(grid, r - 1, c) + sink(grid, r, c + 1) + sink(grid, r, c - 1)


def sink_iter(grid, r, c):
    pass
`,
      solution: `def sink(grid, r, c):
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != "1":
        return 0
    grid[r][c] = "0"
    return 1 + sink(grid, r + 1, c) + sink(grid, r - 1, c) + sink(grid, r, c + 1) + sink(grid, r, c - 1)


def sink_iter(grid, r, c):
    if grid[r][c] != "1":
        return 0
    rows, cols = len(grid), len(grid[0])
    grid[r][c] = "0"
    stack = [(r, c)]
    size = 0
    while stack:
        cr, cc = stack.pop()
        size += 1
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                grid[nr][nc] = "0"
                stack.append((nr, nc))
    return size
`,
      tests: [
        t.eq('sink_iter([["1", "1"], ["0", "1"]], 0, 0)', '3'),
        t.check('grid is cleared', 'g = [["1", "1", "0"], ["1", "0", "1"]]\nassert sink_iter(g, 0, 0) == 3\nassert g == [["0", "0", "0"], ["0", "0", "1"]]'),
        t.hidden('sink_iter([["0"]], 0, 0)', '0'),
        t.hidden('sink_iter([["1"] * 50 for _ in range(50)], 10, 10)', '2500'),
      ],
      hints: [
        'The recursive base case becomes the condition for pushing a neighbor.',
        'Sink a cell at the moment you push it, so it is never pushed twice.',
        'Count one per pop.',
      ],
      explanation: 'Each recursive call becomes a push; the call stack becomes your list. Marking on push plays the role of marking before recursing.',
      signature: 'grid-dfs:translate-recursive-to-stack',
      minutes: 12,
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
      minutes: 5,
    }),
    debug({
      id: 'o7-i-dbg-count-every',
      title: 'Debug: too many islands',
      skills: ['visited_set', 'grid_nested', 'bfs'],
      prompt: 'A teammate\'s `count_lakes(grid)` should count 4-connected groups of `"W"` cells (other cells are `"."`). It reports far too many on any lake bigger than one cell. Make the tests pass.',
      brokenCode: `from collections import deque

def count_lakes(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "W":
                count += 1
                visited.add((r, c))
                q = deque([(r, c)])
                while q:
                    cr, cc = q.popleft()
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "W" and (nr, nc) not in visited:
                            visited.add((nr, nc))
                            q.append((nr, nc))
    return count
`,
      solution: `from collections import deque

def count_lakes(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "W" and (r, c) not in visited:
                count += 1
                visited.add((r, c))
                q = deque([(r, c)])
                while q:
                    cr, cc = q.popleft()
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "W" and (nr, nc) not in visited:
                            visited.add((nr, nc))
                            q.append((nr, nc))
    return count
`,
      tests: [
        t.eq('count_lakes([["W", "W"], [".", "W"]])', '1'),
        t.eq('count_lakes([["W", ".", "W"]])', '2'),
        t.hidden('count_lakes([["."]])', '0'),
        t.hidden('count_lakes([["W", "W", "."], [".", ".", "."], [".", "W", "W"]])', '2'),
      ],
      hints: ['Which cells start a new count? Should a cell an earlier BFS already reached start one?'],
      explanation: 'The outer scan must skip cells that an earlier traversal already marked; otherwise every cell of a lake starts its own count.',
      signature: 'debug:components-outer-skip',
      minutes: 6,
    }),
    write({
      id: 'o7-i-max-area',
      title: 'Largest island area',
      skills: ['grid_nested', 'grid_neighbors', 'visited_set', 'bfs'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 3,
      prompt: 'Ints grid of `1` (land) and `0` (water). Write `max_area(grid)`: the size of the largest island, or 0 if there is no land.',
      starterCode: 'def max_area(grid):\n    pass\n',
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
      minutes: 14,
      important: true,
    }),
  ],
}

const cold = {
  id: 'o7-cold',
  title: 'Cold reps',
  summary: 'Today\'s primitives from a bare signature.',
  exercises: [
    write({
      id: 'o7-c-neighbors',
      title: 'Neighbors from memory',
      skills: ['grid_neighbors', 'tuples'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `neighbors4(rows, cols, r, c)` returning valid neighbor tuples in the order up, down, left, right.',
      starterCode: 'def neighbors4(rows, cols, r, c):\n    pass\n',
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
      minutes: 5,
    }),
    write({
      id: 'o7-c-last-level',
      title: 'Deepest level',
      skills: ['bfs_levels', 'queue_deque'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `deepest_values(root)`: the values on the bottom level, left to right. Empty tree → `[]`.',
      starterCode: 'def deepest_values(root):\n    pass\n',
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
      minutes: 12,
    }),
    write({
      id: 'o7-c-blobs',
      title: 'Count blobs in strings',
      skills: ['grid_nested', 'grid_neighbors', 'visited_set', 'bfs'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'This grid is a list of strings, like `["#.#", "##."]`. `grid[r][c]` still works on strings, but you cannot assign to them. Write `count_blobs(grid)`: the number of 4-connected groups of `"#"`.',
      starterCode: 'def count_blobs(grid):\n    pass\n',
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
      minutes: 14,
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
