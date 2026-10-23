import type { DayModule } from '@/lib/types'
import { output, write, debug, capstone, explain, t } from '@/data/exercises/build'

// October 10: backtracking (include/exclude, path append/pop) and intro 1-D DP. Code-first: write, break, fix.

const warmup = [
  write({
    id: 'd10-warm-sort-by-end',
    title: 'Warm-up: sort by end, then start',
    skills: ['sort_key', 'tuples'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 3,
    prompt: 'Write `by_end(intervals)` that returns the `[start, end]` intervals sorted by end; equal ends are ordered by start.',
    starterCode: `def by_end(intervals):
    pass`,
    solution: `def by_end(intervals):
    return sorted(intervals, key=lambda iv: (iv[1], iv[0]))`,
    tests: [
      t.eq('by_end([[1, 9], [4, 5], [2, 5]])', '[[2, 5], [4, 5], [1, 9]]'),
      t.hidden('by_end([])', '[]'),
      t.hidden('by_end([[0, 1]])', '[[0, 1]]'),
    ],
    signature: 'cold:sort-key-tuple-end',
  }),
  write({
    id: 'd10-warm-k-largest-sum',
    title: 'Warm-up: sum of the k largest',
    skills: ['top_k', 'heap_push_pop'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 7,
    prompt: 'Write `sum_top_k(nums, k)` returning the sum of the `k` largest values, using a min-heap trimmed to size `k`. Assume `0 <= k <= len(nums)`.',
    starterCode: `def sum_top_k(nums, k):
    pass`,
    solution: `import heapq

def sum_top_k(nums, k):
    if k == 0:
        return 0
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return sum(heap)`,
    tests: [
      t.eq('sum_top_k([5, 1, 9, 3], 2)', '14'),
      t.eq('sum_top_k([4], 1)', '4'),
      t.hidden('sum_top_k([2, 2, 2], 3)', '6'),
      t.hidden('sum_top_k([-1, -5, 0], 2)', '-1'),
      t.hidden('sum_top_k([3, 1], 0)', '0'),
    ],
    hints: ['Push, and heappop when len(heap) > k. Remember import heapq.'],
    signature: 'cold:top-k-heap-sum',
  }),
  write({
    id: 'd10-warm-merge-count',
    title: 'Warm-up: how many blocks after merging?',
    skills: ['interval_overlap', 'sort_key'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 7,
    prompt: 'Write `block_count(intervals)` that returns how many separate ranges remain after merging all overlapping (or touching) `[start, end]` ranges. Input is unsorted.',
    starterCode: `def block_count(intervals):
    pass`,
    solution: `def block_count(intervals):
    count = 0
    cur_end = None
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if cur_end is not None and start <= cur_end:
            cur_end = max(cur_end, end)
        else:
            count += 1
            cur_end = end
    return count`,
    tests: [
      t.eq('block_count([[8, 10], [1, 3], [2, 6]])', '2'),
      t.eq('block_count([])', '0'),
      t.hidden('block_count([[1, 2], [2, 3], [3, 4]])', '1'),
      t.hidden('block_count([[5, 6], [1, 2]])', '2'),
      t.hidden('block_count([[1, 10], [2, 3], [11, 12]])', '2'),
    ],
    hints: ['You only need the current block end, not the whole merged list.'],
    signature: 'cold:interval-merge-count',
  }),
  write({
    id: 'd10-warm-tree-sum',
    title: 'Warm-up: sum a tree',
    skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 1,
    minutes: 3,
    prompt: 'Write `tree_sum(root)` returning the sum of all node values (0 for an empty tree).',
    starterCode: `def tree_sum(root):
    pass`,
    solution: `def tree_sum(root):
    if root is None:
        return 0
    return root.val + tree_sum(root.left) + tree_sum(root.right)`,
    tests: [
      t.eq('tree_sum(build_tree([1, 2, 3]))', '6'),
      t.eq('tree_sum(None)', '0'),
      t.hidden('tree_sum(build_tree([5, -2, None, 4]))', '7'),
    ],
    signature: 'cold:tree-sum',
  }),
  write({
    id: 'd10-warm-grid-steps',
    title: 'Warm-up: fewest steps through a grid',
    skills: ['bfs', 'queue_deque', 'grid_neighbors', 'visited_set'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 11,
    prompt: '`grid` is a list of lists with `0` for open and `1` for wall. Moving up, down, left or right, write `fewest_steps(grid)` returning the fewest moves from the top-left to the bottom-right cell, or `-1` if impossible (including when either corner is a wall).',
    starterCode: `def fewest_steps(grid):
    pass`,
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
    return -1`,
    tests: [
      t.eq('fewest_steps([[0, 0, 0], [1, 1, 0], [0, 0, 0]])', '4'),
      t.eq('fewest_steps([[0, 1], [1, 0]])', '-1'),
      t.hidden('fewest_steps([[0]])', '0'),
      t.hidden('fewest_steps([[1, 0], [0, 0]])', '-1'),
      t.hidden('fewest_steps([[0, 0, 1], [1, 0, 1], [1, 0, 0]])', '4'),
    ],
    hints: ['BFS from (0, 0) with a deque; store the distance in the queue.', 'Mark cells seen when you enqueue them.'],
    signature: 'cold:grid-bfs-shortest',
  }),
  write({
    id: 'd10-warm-first-repeat',
    title: 'Warm-up: first repeated value',
    skills: ['set_membership', 'set_add'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 1,
    minutes: 3,
    prompt: 'Write `first_repeat(nums)` returning the first value that appears for a second time while scanning left to right, or `None` if nothing repeats.',
    starterCode: `def first_repeat(nums):
    pass`,
    solution: `def first_repeat(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return x
        seen.add(x)
    return None`,
    tests: [
      t.eq('first_repeat([3, 1, 4, 1, 3])', '1'),
      t.eq('first_repeat([1, 2])', 'None'),
      t.hidden('first_repeat([])', 'None'),
      t.hidden('first_repeat([7, 7])', '7'),
    ],
    signature: 'cold:first-repeat-set',
  }),
]

const decisions = [
  output({
    id: 'd10-dt-call-order',
    title: 'Down and back up',
    skills: ['recursion_base_case', 'recursion_return'],
    prompt: 'Predict the output. Watch what happens after each recursive call returns.',
    note: 'A function that calls itself pauses at that line. When the inner call returns, the outer one carries on from the very next line. So code written after a recursive call runs "on the way back up".',
    code: `def walk(i, n):
    if i == n:
        print('leaf')
        return
    print('enter', i)
    walk(i + 1, n)
    print('exit', i)

walk(0, 2)`,
    expectedOutput: `enter 0
enter 1
leaf
exit 1
exit 0`,
    explanation: 'Code after a recursive call runs on the way back up, in reverse order. Backtracking puts its "undo" exactly there.',
    minutes: 2,
    signature: 'trace:recursion-enter-exit',
  }),
  output({
    id: 'd10-dt-include-exclude',
    title: 'Include first, then exclude',
    skills: ['backtracking_state', 'recursion_base_case'],
    prompt: 'Predict the output. `choose` decides about one item per call: `i` is the index of the item being decided and `picked` is the list of items taken so far. Each call is handed a **new** list (`picked + [x]` builds one), so nothing has to be undone.',
    code: `def choose(items, i, picked):
    if i == len(items):
        print(picked)
        return
    choose(items, i + 1, picked + [items[i]])
    choose(items, i + 1, picked)

choose(['a', 'b'], 0, [])`,
    expectedOutput: `['a', 'b']
['a']
['b']
[]`,
    note: 'Decision tree: at index i, branch 1 takes items[i], branch 2 skips it. The base case (where the recursion stops) is i == len(items): every item has been decided. Two branches per item means 2^n leaves.',
    explanation: 'The include branch is explored fully before the exclude branch, so the first leaf takes everything and the last takes nothing.',
    important: true,
    minutes: 2.5,
    signature: 'trace:include-exclude-immutable',
  }),
  write({
    id: 'd10-dt-all-sums',
    title: 'Every subset sum',
    skills: ['backtracking_state', 'recursion_base_case'],
    style: 'finish',
    difficulty: 2,
    minutes: 5,
    prompt: '`nums` is a list of numbers. A **subset** of it is any selection of its items: each item is either taken or left out. `[1, 2]` has four subsets: `[1, 2]`, `[1]`, `[2]` and `[]` (taking nothing counts).\n\nFinish `all_sums(nums)`: return a list with the sum of every subset, one entry per subset, in any order. `all_sums([1, 2])` → `[3, 1, 2, 0]`, and `all_sums([])` → `[0]`. Two subsets with the same sum give two entries.\n\nThe helper `go(i, total)` decides about one item per call: `i` is the index of the item being decided and `total` is the sum of the items taken so far. Write its body: if there is no item left to decide, record `total` in `out`; otherwise call `go` twice, once taking `nums[i]` and once leaving it out.',
    note: 'A **decision tree**: one take-it-or-leave-it decision per item, from the top down. Every route from the top to a bottom end (a **leaf**) is one complete set of decisions, so one subset. `n` items give `2 ** n` leaves. Trying every route like this is called **backtracking**.',
    starterCode: `def all_sums(nums):
    out = []
    def go(i, total):
        pass
    go(0, 0)
    return out`,
    solution: `def all_sums(nums):
    out = []
    def go(i, total):
        if i == len(nums):
            out.append(total)
            return
        go(i + 1, total + nums[i])
        go(i + 1, total)
    go(0, 0)
    return out`,
    tests: [
      t.eq('all_sums([1, 2])', '[3, 1, 2, 0]', { compare: 'unordered' }),
      t.eq('all_sums([])', '[0]', { compare: 'unordered' }),
      t.hidden('all_sums([5, 5, -1])', '[9, 10, 4, 5, 4, 5, -1, 0]', { compare: 'unordered' }),
    ],
    hints: ['Base case: every item has been decided when `i` has run off the end of `nums`. Record `total` and return.', 'Otherwise two calls, both moving on to the next index: one with `total + nums[i]`, one with `total` unchanged.'],
    signature: 'backtrack:collect-subset-sums',
  }),
  write({
    id: 'd10-dt-bit-strings',
    title: 'All bit strings of length n',
    skills: ['backtracking_state', 'recursion_base_case'],
    difficulty: 2,
    minutes: 5,
    prompt: '`n` is a whole number, 0 or more. Write `bit_strings(n)` returning a list of every string of length `n` made only of `\'0\'` and `\'1\'`. Order matters here: at each position try `\'0\'` before `\'1\'`, so `bit_strings(2)` → `[\'00\', \'01\', \'10\', \'11\']`. `bit_strings(0)` → `[\'\']` (the one string of length 0).\n\nUse an inner helper that takes the string built so far as a parameter and adds one character per call.',
    starterCode: `def bit_strings(n):
    pass`,
    solution: `def bit_strings(n):
    out = []
    def go(s):
        if len(s) == n:
            out.append(s)
            return
        go(s + '0')
        go(s + '1')
    go('')
    return out`,
    tests: [
      t.eq('bit_strings(2)', "['00', '01', '10', '11']"),
      t.eq('bit_strings(0)', "['']"),
      t.hidden('bit_strings(1)', "['0', '1']"),
      t.hidden('len(bit_strings(5))', '32'),
    ],
    hints: ['Base case: the string has reached length n.', "Branch with s + '0' first, then s + '1'."],
    signature: 'backtrack:bit-strings',
  }),
  debug({
    id: 'd10-dt-dbg-base',
    title: 'Debug: count subsets hitting a target',
    skills: ['backtracking_state', 'recursion_base_case'],
    minutes: 3.5,
    prompt: '`nums` is a list of integers and `target` is an integer. `count_sums(nums, target)` should return how many subsets of `nums` (take or leave each item) add up to exactly `target`. The empty subset adds up to 0. `count_sums([1, 2, 3], 3)` → `2` (`[1, 2]` and `[3]`). Fix it.',
    brokenCode: `def count_sums(nums, target):
    def go(i, total):
        if i == len(nums) - 1:
            return 1 if total == target else 0
        return go(i + 1, total + nums[i]) + go(i + 1, total)
    return go(0, 0)`,
    solution: `def count_sums(nums, target):
    def go(i, total):
        if i == len(nums):
            return 1 if total == target else 0
        return go(i + 1, total + nums[i]) + go(i + 1, total)
    return go(0, 0)`,
    tests: [
      t.eq('count_sums([1, 2, 3], 3)', '2'),
      t.eq('count_sums([], 0)', '1'),
      t.hidden('count_sums([2, 2], 2)', '2'),
      t.hidden('count_sums([4], 4)', '1'),
    ],
    hints: ['When has every item been decided?'],
    explanation: 'The leaf is reached once all len(nums) items have been decided, i.e. i == len(nums). Stopping one early never decides the last item.',
    signature: 'debug:backtrack-base-case',
  }),
  write({
    id: 'd10-dt-can-reach',
    title: 'Can some subset reach the target?',
    skills: ['backtracking_state', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 6,
    prompt: '`nums` is a list of integers (negatives allowed) and `target` is an integer. Write `can_reach(nums, target)` returning `True` if some subset of `nums` adds up to exactly `target`, otherwise `False`. The empty subset adds up to 0, so `can_reach([], 0)` is `True`. `can_reach([3, 34, 4, 12, 5, 2], 9)` → `True` (4 + 5). Stop as soon as one branch succeeds.',
    starterCode: `def can_reach(nums, target):
    pass`,
    solution: `def can_reach(nums, target):
    def go(i, total):
        if i == len(nums):
            return total == target
        return go(i + 1, total + nums[i]) or go(i + 1, total)
    return go(0, 0)`,
    tests: [
      t.eq('can_reach([3, 34, 4, 12, 5, 2], 9)', 'True'),
      t.eq('can_reach([3, 34, 4], 30)', 'False'),
      t.hidden('can_reach([], 0)', 'True'),
      t.hidden('can_reach([], 1)', 'False'),
      t.hidden('can_reach([-2, 5], 3)', 'True'),
    ],
    hints: ['Same include/exclude tree; the leaf returns a bool.', '`or` short-circuits: if the include branch succeeds, the exclude branch never runs.'],
    signature: 'backtrack:subset-sum-bool',
  }),
  write({
    id: 'd10-dt-signs',
    title: 'Plus or minus each number',
    skills: ['backtracking_state', 'recursion_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 6,
    prompt: '`nums` is a list of integers. Put a `+` or a `-` in front of **every** number, then add them up. Write `sign_ways(nums, target)` returning how many different sign choices make the total equal `target`. `sign_ways([1, 1], 0)` → `2` (`+1 -1` and `-1 +1`). With no numbers the total is 0, so `sign_ways([], 0)` → `1`.\n\nThe two branches at each index are "add" and "subtract" this time, not take/leave.',
    starterCode: `def sign_ways(nums, target):
    pass`,
    solution: `def sign_ways(nums, target):
    def go(i, total):
        if i == len(nums):
            return 1 if total == target else 0
        return go(i + 1, total + nums[i]) + go(i + 1, total - nums[i])
    return go(0, 0)`,
    tests: [
      t.eq('sign_ways([1, 1, 1, 1, 1], 3)', '5'),
      t.eq('sign_ways([1], 1)', '1'),
      t.hidden('sign_ways([], 0)', '1'),
      t.hidden('sign_ways([2, 3], 4)', '0'),
      t.hidden('sign_ways([0, 1], 1)', '2'),
    ],
    hints: ['State: (index, total). Two branches per index.', 'Count leaves where total == target and add the counts up.'],
    signature: 'backtrack:two-branch-count',
  }),
]

const pathState = [
  output({
    id: 'd10-ps-copy-trace',
    title: 'One shared path',
    skills: ['backtracking_state'],
    prompt: 'Predict the output. One `path` list is shared by every call: `path.append(i)` takes `i`, the call after it explores with `i` taken, and `path.pop()` removes it again. `path[:]` makes a copy of the list as it is right now.',
    code: `res = []
path = []

def dfs(i):
    if i == 2:
        res.append(path[:])
        return
    path.append(i)
    dfs(i + 1)
    path.pop()
    dfs(i + 1)

dfs(0)
print(res)`,
    expectedOutput: `[[0, 1], [0], [1], []]`,
    note: 'Choose / explore / un-choose: `path.append(x)`, recurse, `path.pop()`. `path` holds the choices made so far on the current route. At a leaf, save a **copy** (`path[:]`): `path` itself keeps changing and ends up empty, and anything saved without a copy would change with it.',
    explanation: 'Include 0 and 1, then drop 1, then drop 0 and include 1, then nothing. Same order as the immutable version.',
    important: true,
    minutes: 2,
    signature: 'trace:backtrack-copy',
  }),
  write({
    id: 'd10-ps-subsequences-finish',
    title: 'Finish: choose, explore, un-choose',
    skills: ['backtracking_state', 'string_methods'],
    style: 'finish',
    difficulty: 2,
    minutes: 4,
    prompt: '`s` is a string. A **subsequence** keeps some of its characters (possibly none, possibly all) in their original order: `\'ab\'` has `\'ab\'`, `\'a\'`, `\'b\'` and `\'\'`. `pickings(s)` should return a list of every subsequence of `s` as a string, in any order.\n\nThe base case is written: it joins the characters in `path` into one string. Replace the comment with the four lines that take `s[i]`, explore, undo the take, and explore without it.',
    starterCode: `def pickings(s):
    res = []
    path = []
    def dfs(i):
        if i == len(s):
            res.append(''.join(path))
            return
        # include s[i], explore, undo, explore without it
    dfs(0)
    return res`,
    solution: `def pickings(s):
    res = []
    path = []
    def dfs(i):
        if i == len(s):
            res.append(''.join(path))
            return
        path.append(s[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return res`,
    tests: [
      t.eq("pickings('ab')", "['ab', 'a', 'b', '']", { compare: 'unordered' }),
      t.eq("pickings('')", "['']"),
      t.hidden("len(pickings('abcd'))", '16'),
    ],
    hints: ['The first two lines choose and explore: put `s[i]` on `path`, then move on to index `i + 1`.', 'The last two un-choose and explore again: take it back off `path`, then move on to `i + 1` without it.'],
    explanation: "''.join(path) builds a new string, so here no explicit copy is needed.",
    important: true,
    signature: 'backtrack:finish-append-pop',
  }),
  write({
    id: 'd10-ps-dice',
    title: 'Every roll sequence',
    skills: ['backtracking_state', 'range'],
    style: 'finish',
    difficulty: 3,
    minutes: 6,
    prompt: '`n` is how many times a die is rolled and `sides` is how many faces it has (values `1` to `sides`). Write `rolls(n, sides)` returning every possible sequence of `n` rolls, each as a list, smallest first: `rolls(2, 2)` → `[[1, 1], [1, 2], [2, 1], [2, 2]]`. `rolls(0, 6)` → `[[]]`.\n\nUse the shared `path` with append / recurse / pop. There are `sides` branches per roll, not two, so branch with a `for` loop over the values.',
    starterCode: `def rolls(n, sides):
    res = []
    path = []
    def dfs():
        pass
    dfs()
    return res`,
    solution: `def rolls(n, sides):
    res = []
    path = []
    def dfs():
        if len(path) == n:
            res.append(path[:])
            return
        for v in range(1, sides + 1):
            path.append(v)
            dfs()
            path.pop()
    dfs()
    return res`,
    tests: [
      t.eq('rolls(2, 2)', '[[1, 1], [1, 2], [2, 1], [2, 2]]'),
      t.eq('rolls(1, 3)', '[[1], [2], [3]]'),
      t.hidden('rolls(0, 6)', '[[]]'),
      t.hidden('len(rolls(3, 4))', '64'),
    ],
    hints: ['Base case: len(path) == n. Record a copy.', 'For each value: append, recurse, pop.'],
    signature: 'backtrack:loop-branch-sequences',
  }),
  debug({
    id: 'd10-ps-dbg-alias',
    title: 'Debug: every 0/1 list',
    skills: ['backtracking_state', 'slicing'],
    minutes: 3,
    prompt: '`bit_lists(n)` should return every list of `n` values chosen from `0` and `1`, zeros first (so `n = 2` gives `[[0, 0], [0, 1], [1, 0], [1, 1]]`). Fix it.',
    brokenCode: `def bit_lists(n):
    res = []
    path = []
    def dfs():
        if len(path) == n:
            res.append(path)
            return
        for b in (0, 1):
            path.append(b)
            dfs()
            path.pop()
    dfs()
    return res`,
    solution: `def bit_lists(n):
    res = []
    path = []
    def dfs():
        if len(path) == n:
            res.append(path[:])
            return
        for b in (0, 1):
            path.append(b)
            dfs()
            path.pop()
    dfs()
    return res`,
    tests: [
      t.eq('bit_lists(2)', '[[0, 0], [0, 1], [1, 0], [1, 1]]'),
      t.eq('bit_lists(1)', '[[0], [1]]'),
      t.hidden('bit_lists(0)', '[[]]'),
    ],
    hints: ['Print res right after the first append. Then print it at the end.', 'How many different list objects does res hold?'],
    explanation: 'res held four references to the same list, which ends empty. path[:] (or list(path)) stores a snapshot.',
    signature: 'debug:backtrack-alias',
  }),
  write({
    id: 'd10-ps-combos',
    title: 'Groups of exactly k',
    skills: ['backtracking_state', 'range'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 9,
    prompt: '`nums` is a list of distinct values and `k` is a whole number, 0 or more. A **combination** is a choice of items where order does not matter: `[1, 2]` and `[2, 1]` are the same group. Write `groups(nums, k)` returning every group of exactly `k` items, each group once. `groups([1, 2, 3], 2)` → `[[1, 2], [1, 3], [2, 3]]` (the groups may come in any order). `k = 0` gives `[[]]`; a `k` bigger than `len(nums)` gives `[]`.\n\nBranch with a `for` loop over the items you could pick next, and pass a `start` index down: each call only looks at items **after** the previous pick. That is what stops `[2, 1]` appearing as well as `[1, 2]`.',
    starterCode: `def groups(nums, k):
    pass`,
    solution: `def groups(nums, k):
    res = []
    path = []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
    dfs(0)
    return res`,
    tests: [
      t.eq('groups([1, 2, 3], 2)', '[[1, 2], [1, 3], [2, 3]]', { compare: 'sorted-inner' }),
      t.eq('groups([4], 1)', '[[4]]', { compare: 'sorted-inner' }),
      t.hidden('groups([1, 2, 3], 0)', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('groups([1, 2], 3)', '[]', { compare: 'sorted-inner' }),
      t.hidden('len(groups([1, 2, 3, 4, 5], 3))', '10'),
    ],
    hints: [
      'The path grows one pick at a time; stop when it has k items.',
      'dfs(start) loops i from start to the end.',
      'append nums[i], recurse with i + 1, pop.',
      'Record path[:] at the base case.',
    ],
    signature: 'backtrack:combinations-k',
  }),
  debug({
    id: 'd10-ps-dbg-no-pop',
    title: 'Debug: increasing picks from 1..n',
    skills: ['backtracking_state'],
    minutes: 3.5,
    prompt: '`choose(n, k)` should return every increasing list of `k` numbers taken from `1..n` (so `choose(3, 2)` gives `[[1, 2], [1, 3], [2, 3]]`). Fix it.',
    brokenCode: `def choose(n, k):
    res = []
    path = []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        for v in range(start, n + 1):
            path.append(v)
            dfs(v + 1)
    dfs(1)
    return res`,
    solution: `def choose(n, k):
    res = []
    path = []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        for v in range(start, n + 1):
            path.append(v)
            dfs(v + 1)
            path.pop()
    dfs(1)
    return res`,
    tests: [
      t.eq('choose(3, 2)', '[[1, 2], [1, 3], [2, 3]]'),
      t.eq('choose(2, 1)', '[[1], [2]]'),
      t.hidden('len(choose(5, 3))', '10'),
      t.hidden('choose(2, 0)', '[[]]'),
    ],
    hints: ['Print path at the top of dfs. Does it ever shrink?'],
    explanation: 'Every choice must be undone after exploring it, or it leaks into the sibling branches.',
    signature: 'debug:backtrack-missing-pop',
  }),
  write({
    id: 'd10-ps-letter-combos',
    title: 'Keypad letter combinations',
    skills: ['backtracking_state', 'dict_lookup'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 9,
    prompt: '`digits` is a string of digits from `2` to `9`, like `\'23\'`. On a phone keypad each digit stands for some letters; the mapping `KEYS` is in the starter. Write `spell(digits)` returning every string made by picking one letter for each digit, keeping the digits\' order: `spell(\'23\')` → `[\'ad\', \'ae\', \'af\', \'bd\', \'be\', \'bf\', \'cd\', \'ce\', \'cf\']` (the strings may come in any order). An empty `digits` gives `[]`.',
    starterCode: `KEYS = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}

def spell(digits):
    pass`,
    solution: `KEYS = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}

def spell(digits):
    if not digits:
        return []
    res = []
    path = []
    def dfs(i):
        if i == len(digits):
            res.append(''.join(path))
            return
        for ch in KEYS[digits[i]]:
            path.append(ch)
            dfs(i + 1)
            path.pop()
    dfs(0)
    return res`,
    tests: [
      t.eq("spell('23')", "['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf']", { compare: 'unordered' }),
      t.eq("spell('')", '[]'),
      t.hidden("spell('7')", "['p', 'q', 'r', 's']", { compare: 'unordered' }),
      t.hidden("len(spell('79'))", '16'),
    ],
    hints: ['One level of recursion per digit.', 'Loop over KEYS[digits[i]]: append, recurse, pop.', 'Handle empty input before recursing.'],
    signature: 'backtrack:keypad',
  }),
  write({
    id: 'd10-ps-orderings',
    title: 'Every ordering',
    skills: ['backtracking_state', 'set_membership'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 4,
    minutes: 12,
    prompt: '`nums` is a list of distinct values. An **ordering** (also called a **permutation**) uses every value exactly once; two orderings differ only in the order. Write `orderings(nums)` returning every ordering as a list. `orderings([1, 2])` → `[[1, 2], [2, 1]]` (the orderings may come in any order). `orderings([])` → `[[]]`.\n\nUnlike a subset, nothing is left out, and any value not yet placed can go next. Keep track of which indexes are already in the path (a `used` list of booleans, or a set) so no value is placed twice.',
    starterCode: `def orderings(nums):
    pass`,
    solution: `def orderings(nums):
    res = []
    path = []
    used = [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            dfs()
            path.pop()
            used[i] = False
    dfs()
    return res`,
    tests: [
      t.eq('orderings([1, 2, 3])', '[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]', { compare: 'unordered' }),
      t.eq('orderings([7])', '[[7]]'),
      t.hidden('orderings([])', '[[]]'),
      t.hidden('len(orderings([1, 2, 3, 4]))', '24'),
    ],
    hints: [
      'Unlike subsets, every value must be placed, and any unused one can go next.',
      'Loop over all indexes each level; skip ones already used.',
      'Mark used and append before recursing; pop and unmark after.',
      'Base case: len(path) == len(nums), record path[:].',
    ],
    explanation: 'Two pieces of state are undone together: the path and the used flags. n! orderings, O(n * n!) time.',
    signature: 'backtrack:permutations',
  }),
  debug({
    id: 'd10-ps-dbg-used',
    title: 'Debug: arrangements',
    skills: ['backtracking_state'],
    minutes: 4,
    prompt: '`arrangements(items)` should return every ordering of the distinct `items` (any order of orderings). It returns far too few. Fix it.',
    brokenCode: `def arrangements(items):
    res = []
    path = []
    used = [False] * len(items)
    def dfs():
        if len(path) == len(items):
            res.append(path[:])
            return
        for i in range(len(items)):
            if used[i]:
                continue
            used[i] = True
            path.append(items[i])
            dfs()
            path.pop()
    dfs()
    return res`,
    solution: `def arrangements(items):
    res = []
    path = []
    used = [False] * len(items)
    def dfs():
        if len(path) == len(items):
            res.append(path[:])
            return
        for i in range(len(items)):
            if used[i]:
                continue
            used[i] = True
            path.append(items[i])
            dfs()
            path.pop()
            used[i] = False
    dfs()
    return res`,
    tests: [
      t.eq("arrangements(['a', 'b'])", "[['a', 'b'], ['b', 'a']]", { compare: 'unordered' }),
      t.eq("len(arrangements(['x', 'y', 'z']))", '6'),
      t.hidden('arrangements([])', '[[]]'),
    ],
    hints: ['Two things change before the recursive call. How many are undone after it?'],
    signature: 'debug:backtrack-used-not-reset',
  }),
  write({
    id: 'd10-ps-tree-paths',
    title: 'Root-to-leaf paths',
    skills: ['backtracking_state', 'tree_dfs'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 9,
    prompt: '`root` is the top node of a binary tree, or `None` for an empty tree. Each node has `.val`, `.left` and `.right`. A **leaf** is a node with no children, and a root-to-leaf path is the list of values you pass going from the root down to one leaf. Write `leaf_paths(root)` returning every root-to-leaf path, leftmost first. For the tree with `1` on top, children `2` and `3`, and `5` as the right child of `2`, that is `[[1, 2, 5], [1, 3]]`. An empty tree gives `[]`.\n\nUse one shared `path` list: append the node\'s value, explore below it, pop.',
    starterCode: `def leaf_paths(root):
    pass`,
    solution: `def leaf_paths(root):
    res = []
    path = []
    def dfs(node):
        if node is None:
            return
        path.append(node.val)
        if node.left is None and node.right is None:
            res.append(path[:])
        else:
            dfs(node.left)
            dfs(node.right)
        path.pop()
    dfs(root)
    return res`,
    tests: [
      t.eq('leaf_paths(build_tree([1, 2, 3, None, 5]))', '[[1, 2, 5], [1, 3]]'),
      t.eq('leaf_paths(None)', '[]'),
      t.hidden('leaf_paths(build_tree([4]))', '[[4]]'),
      t.hidden('leaf_paths(build_tree([1, 2, None, 3, 4]))', '[[1, 2, 3], [1, 2, 4]]'),
    ],
    hints: ['A leaf has no children; that is where you record.', 'The pop must run whether or not the node was a leaf.'],
    signature: 'backtrack:tree-paths',
  }),
]

const subsets = [
  write({
    id: 'd10-sub-loop-style',
    title: 'Subsets, loop style',
    skills: ['backtracking_state', 'range'],
    difficulty: 3,
    minutes: 7,
    prompt: '`nums` is a list of distinct values. Write `all_groups(nums)` returning every subset of `nums` as a list (subsets in any order): `all_groups([1, 2])` → `[[], [1], [1, 2], [2]]`, and `all_groups([])` → `[[]]`.\n\nUse the **loop style** this time instead of take/leave. `dfs(start)` saves a copy of `path` on **every** call, not only at the bottom, because every partial path is itself a subset. Then, for each index `i` from `start` onward, it appends `nums[i]`, recurses with `i + 1`, and pops.',
    starterCode: `def all_groups(nums):
    pass`,
    solution: `def all_groups(nums):
    res = []
    path = []
    def dfs(start):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
    dfs(0)
    return res`,
    tests: [
      t.eq('all_groups([1, 2])', '[[], [1], [1, 2], [2]]', { compare: 'sorted-inner' }),
      t.eq('all_groups([])', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('len(all_groups([1, 2, 3, 4]))', '16'),
    ],
    hints: ['Every node of this tree is a subset, so record at the top of dfs.', 'Same loop as groups of k, minus the length check.'],
    important: true,
    signature: 'backtrack:subsets-loop-style',
  }),
  write({
    id: 'd10-sub-target-subsets',
    title: 'Subsets that hit a sum',
    skills: ['backtracking_state', 'recursion_base_case'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: '`nums` is a list of distinct integers (negatives allowed) and `target` is an integer. Write `hitting(nums, target)` returning every subset of `nums` whose values add up to exactly `target`.\n\nEach subset is a list. The subsets may come in any order, and so may the values inside each one. If no subset works, return `[]`. The empty subset adds up to 0, so `hitting([], 0)` → `[[]]`.\n\n`hitting([1, 2, 3, 4], 5)` → `[[1, 4], [2, 3]]`',
    transfer: true,
    starterCode: `def hitting(nums, target):
    pass`,
    solution: `def hitting(nums, target):
    res = []
    path = []
    def dfs(i, total):
        if i == len(nums):
            if total == target:
                res.append(path[:])
            return
        path.append(nums[i])
        dfs(i + 1, total + nums[i])
        path.pop()
        dfs(i + 1, total)
    dfs(0, 0)
    return res`,
    tests: [
      t.eq('hitting([1, 2, 3, 4], 5)', '[[1, 4], [2, 3]]', { compare: 'sorted-inner' }),
      t.eq('hitting([5], 1)', '[]', { compare: 'sorted-inner' }),
      t.hidden('hitting([], 0)', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('hitting([-1, 1, 2], 1)', '[[1], [-1, 2]]', { compare: 'sorted-inner' }),
    ],
    hints: ['Every value is either in a subset or not. How did you list every such selection before?', 'Carry the running total alongside the shared path.', 'At the leaf, record path[:] only if total == target.'],
    signature: 'backtrack:subsets-filtered',
  }),
  write({
    id: 'd10-sub-write-test',
    title: 'Write the test that catches subset bugs',
    skills: ['backtracking_state', 'edge_cases'],
    style: 'write-test',
    difficulty: 2,
    minutes: 4,
    prompt: 'This time you write the test. `test_subsets(subsets)` receives a **function** `subsets`: calling `subsets(nums)` with a list of distinct numbers is supposed to return every subset of `nums`, as a list of lists. Call it on inputs you choose and `assert` that the results are right.\n\nWhen `subsets` is correct, your function must finish without an error. It must raise an `AssertionError` for each of three buggy versions: one saves `path` instead of `path[:]`, one forgets `path.pop()`, one never explores the leave-it-out branch.\n\nA correct `subsets` may return the subsets in any order, with the values inside each in any order, so normalize before comparing, e.g. `sorted(sorted(s) for s in result)`.',
    starterCode: `def test_subsets(subsets):
    pass`,
    solution: `def test_subsets(subsets):
    result = subsets([1, 2])
    assert sorted(sorted(s) for s in result) == [[], [1], [1, 2], [2]]
    assert subsets([]) == [[]]`,
    tests: [
      t.check(
        'a correct version passes',
        "def _good(nums):\n    res, path = [], []\n    def dfs(i):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        path.append(nums[i])\n        dfs(i + 1)\n        path.pop()\n        dfs(i + 1)\n    dfs(0)\n    return res\ntest_subsets(_good)",
      ),
      t.check(
        'catches the missing copy',
        "def _alias(nums):\n    res, path = [], []\n    def dfs(i):\n        if i == len(nums):\n            res.append(path)\n            return\n        path.append(nums[i])\n        dfs(i + 1)\n        path.pop()\n        dfs(i + 1)\n    dfs(0)\n    return res\ntry:\n    test_subsets(_alias)\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('the res.append(path) version passed your tests')",
      ),
      t.check(
        'catches the missing pop',
        "def _nopop(nums):\n    res, path = [], []\n    def dfs(i):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        path.append(nums[i])\n        dfs(i + 1)\n        dfs(i + 1)\n    dfs(0)\n    return res\ntry:\n    test_subsets(_nopop)\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('the version without path.pop() passed your tests')",
      ),
      t.check(
        'catches the missing exclude branch',
        "def _noskip(nums):\n    res, path = [], []\n    def dfs(i):\n        if i == len(nums):\n            res.append(path[:])\n            return\n        path.append(nums[i])\n        dfs(i + 1)\n        path.pop()\n    dfs(0)\n    return res\ntry:\n    test_subsets(_noskip)\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('the version without the exclude call passed your tests')",
      ),
    ],
    hints: ['One normalized comparison against the full expected answer for a 2-item input catches all three.'],
    explanation: 'Comparing the whole normalized result is the strongest test for backtracking: every classic bug changes either the count or the contents.',
    signature: 'backtrack:write-tests',
  }),
  capstone({
    id: 'cap-subsets',
    title: 'Every subset',
    problemId: 'subsets',
    skills: ['backtracking_state', 'recursion_base_case'],
    difficulty: 3,
    minutes: 25,
    prompt: 'Given a list `nums` of distinct integers, return every possible subset (the power set), including the empty one and `nums` itself. No subset may appear twice. The subsets may come in any order, and so may the values inside each subset.',
    starterCode: `def subsets(nums: List[int]) -> List[List[int]]:
    pass`,
    solution: `def subsets(nums: List[int]) -> List[List[int]]:
    res = []
    path = []
    def dfs(i):
        if i == len(nums):
            res.append(path[:])
            return
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return res`,
    examples: [
      { input: 'nums = [1, 2, 3]', output: '[[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]' },
      { input: 'nums = [0]', output: '[[], [0]]' },
      { input: 'nums = []', output: '[[]]', note: 'The empty set still has one subset.' },
    ],
    tests: [
      t.eq('subsets([1, 2, 3])', '[[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]', { compare: 'sorted-inner' }),
      t.eq('subsets([0])', '[[], [0]]', { compare: 'sorted-inner' }),
      t.hidden('subsets([])', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('subsets([-1, 5])', '[[], [-1], [5], [-1, 5]]', { compare: 'sorted-inner' }),
      t.hidden('len(subsets([1, 2, 3, 4, 5]))', '32'),
      t.hidden('len({tuple(sorted(s)) for s in subsets([1, 2, 3, 4, 5, 6])})', '64'),
      t.hidden('subsets([9, 3])', '[[], [3], [9], [3, 9]]', { compare: 'sorted-inner' }),
    ],
    hints: [
      'Every value is either in a subset or not: a two-way decision per index.',
      'Use one shared path list and a dfs(i) that decides about nums[i].',
      'Include: path.append(nums[i]); dfs(i + 1); path.pop(). Exclude: dfs(i + 1).',
      'Base case i == len(nums): res.append(path[:]). Call dfs(0), return res.',
    ],
    complexity: { time: 'O(n * 2^n)', space: 'O(n) recursion + O(n * 2^n) output' },
    explanation: 'The include/exclude tree has 2^n leaves, one per subset. A single shared path is mutated and restored, and a copy is taken at each leaf so later changes do not alter recorded subsets.',
    signature: 'capstone:subsets',
  }),
  explain({
    id: 'd10-explain-subsets',
    title: 'Explain: subsets',
    minutes: 5,
    skills: ['explanation', 'complexity', 'backtracking_state'],
    prompt: 'Explain your subsets solution as you would in an interview: the decision tree, the shared path, why the copy, complexity.',
    rubric: [
      'Decision per index: include or exclude, base case at i == len(nums)',
      'Choose / explore / un-choose with append, recurse, pop',
      'Record path[:] because path keeps changing after the leaf',
      '2^n subsets, O(n * 2^n) time; recursion depth O(n)',
      'Edge case: empty input returns [[]]',
    ],
    signature: 'explain:subsets',
  }),
]

const recurrence = [
  output({
    id: 'd10-rec-fib-calls',
    title: 'How many calls?',
    skills: ['recurrence', 'recursion_return'],
    prompt: 'Predict the output. `fib(n)` is the n-th Fibonacci number: each one is the sum of the two before it (`0, 1, 1, 2, 3, 5, ...`). `calls` counts how many times `fib` runs.',
    code: `calls = 0

def fib(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(5))
print(calls)`,
    expectedOutput: `5
15`,
    note: 'A **recurrence** writes the answer in terms of answers to smaller inputs: `fib(n) = fib(n - 1) + fib(n - 2)`. The **base cases** are the smallest inputs, answered directly. Plain recursion solves the same smaller problem again and again (**overlapping subproblems**), so the number of calls explodes.',
    explanation: 'fib(3) is computed twice, fib(2) three times... The call count grows exponentially. Memoization fixes exactly this.',
    minutes: 2.5,
    signature: 'trace:fib-call-count',
  }),
  write({
    id: 'd10-rec-fib-naive',
    title: 'Fibonacci, plain recursion',
    skills: ['recurrence', 'recursion_base_case'],
    difficulty: 1,
    minutes: 3,
    prompt: 'The Fibonacci numbers are `0, 1, 1, 2, 3, 5, 8, ...`: each is the sum of the two before it. `n` is a whole number, 0 or more. Write `fib(n)` recursively, straight from the recurrence: `fib(0) = 0`, `fib(1) = 1`, and `fib(n) = fib(n - 1) + fib(n - 2)`. `fib(10)` → `55`.',
    starterCode: `def fib(n):
    pass`,
    solution: `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)`,
    tests: [t.eq('fib(0)', '0'), t.eq('fib(1)', '1'), t.eq('fib(10)', '55'), t.hidden('fib(2)', '1')],
    hints: ['Two base cases can be folded into one: if n < 2: return n.'],
    signature: 'recurrence:fib-naive',
  }),
  write({
    id: 'd10-rec-three-steps',
    title: 'Steps of 1, 2 or 3',
    skills: ['recurrence', 'recursion_base_case'],
    difficulty: 2,
    minutes: 4,
    prompt: 'You stand at the bottom of a staircase (step 0) and each move climbs 1, 2 or 3 steps. `n` is the step you want to land on exactly. Write recursive `ways3(n)` returning how many different sequences of moves get there. Order matters: `ways3(3)` → `4` (`1+1+1`, `1+2`, `2+1`, `3`).\n\nFind the recurrence by asking what the **last** move was: 1, 2 or 3 steps, so the answer is built from `ways3(n - 1)`, `ways3(n - 2)` and `ways3(n - 3)`. Base cases: `n == 0` has one way (make no move), and a negative `n` has none (you overshot).',
    starterCode: `def ways3(n):
    pass`,
    solution: `def ways3(n):
    if n == 0:
        return 1
    if n < 0:
        return 0
    return ways3(n - 1) + ways3(n - 2) + ways3(n - 3)`,
    tests: [t.eq('ways3(4)', '7'), t.eq('ways3(0)', '1'), t.hidden('ways3(1)', '1'), t.hidden('ways3(5)', '13')],
    hints: ['The last move was 1, 2 or 3 steps.', 'Overshooting (n < 0) contributes 0.'],
    signature: 'recurrence:three-steps',
  }),
  write({
    id: 'd10-rec-grid-paths',
    title: 'Paths through a grid',
    skills: ['recurrence', 'recursion_base_case'],
    difficulty: 2,
    minutes: 4,
    prompt: 'A grid has `rows` rows and `cols` columns (both at least 1). You start in the top-left cell and each move goes one cell right or one cell down. Write recursive `grid_paths(rows, cols)` returning how many different routes reach the bottom-right cell. `grid_paths(2, 2)` → `2` (right then down, or down then right). A grid with one row or one column has exactly one route.',
    starterCode: `def grid_paths(rows, cols):
    pass`,
    solution: `def grid_paths(rows, cols):
    if rows == 1 or cols == 1:
        return 1
    return grid_paths(rows - 1, cols) + grid_paths(rows, cols - 1)`,
    tests: [t.eq('grid_paths(3, 3)', '6'), t.eq('grid_paths(1, 5)', '1'), t.hidden('grid_paths(3, 7)', '28')],
    hints: ['The first move goes right (a smaller grid with one fewer column) or down (one fewer row).'],
    signature: 'recurrence:grid-paths',
  }),
  debug({
    id: 'd10-rec-dbg-base',
    title: 'Debug: stair count base cases',
    skills: ['recurrence', 'recursion_base_case'],
    minutes: 3,
    prompt: '`climb(n)` should count the ways to climb `n` steps taking 1 or 2 at a time. There is exactly one way to climb 0 steps (do nothing) and one way to climb 1 step. Fix it.',
    brokenCode: `def climb(n):
    if n <= 1:
        return n
    return climb(n - 1) + climb(n - 2)`,
    solution: `def climb(n):
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)`,
    tests: [t.eq('climb(2)', '2'), t.eq('climb(0)', '1'), t.eq('climb(1)', '1'), t.hidden('climb(5)', '8')],
    hints: ['Work out climb(0) and climb(1) by hand, then compare.'],
    explanation: 'Copying the Fibonacci base case gives climb(0) = 0, which shifts every answer. Decide what the smallest inputs mean before writing them.',
    signature: 'debug:recurrence-base-case',
  }),
]

const memo = [
  output({
    id: 'd10-memo-trace',
    title: 'What ends up in the memo?',
    skills: ['memoization', 'dict_items'],
    prompt: 'Predict the output. `memo` is a dict: `n` → the answer already worked out for `fib(n)`.',
    code: `memo = {}

def fib(n):
    if n in memo:
        return memo[n]
    if n < 2:
        return n
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]

print(fib(6))
print(sorted(memo.items()))`,
    expectedOutput: `8
[(2, 1), (3, 2), (4, 3), (5, 5), (6, 8)]`,
    note: '**Memoization**: remember each answer the first time you compute it, in a dict, and look it up after that. Four moves: check the dict, compute, store, return. The key is every argument that changes. The dict must outlive a single call, so create it outside the recursive function.',
    explanation: 'Base cases are returned directly and never stored, so the memo holds 2 through 6: each computed exactly once.',
    minutes: 2,
    signature: 'trace:memo-contents',
  }),
  write({
    id: 'd10-memo-optimize',
    title: 'Optimize: add a memo',
    skills: ['memoization', 'recurrence'],
    style: 'optimize',
    difficulty: 2,
    minutes: 5,
    prompt: '`climb(n)` counts the ways to climb `n` steps taking 1 or 2 at a time. It is correct but slow: it works out the same `n` again and again, and `calls` counts how often it runs. Add a dict `memo` (`n` → answer), created once, outside the function, so each `n` is computed only once. A test resets `calls` and requires `climb(25)` to make at most 60 calls.',
    starterCode: `calls = 0

def climb(n):
    global calls
    calls += 1
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)`,
    solution: `calls = 0
memo = {}

def climb(n):
    global calls
    calls += 1
    if n <= 1:
        return 1
    if n in memo:
        return memo[n]
    memo[n] = climb(n - 1) + climb(n - 2)
    return memo[n]`,
    tests: [
      t.eq('climb(5)', '8'),
      t.check('linear number of calls', "calls = 0\nresult = climb(25)\nassert result == 121393, result\nassert calls <= 60, f'{calls} calls: cache each answer'"),
    ],
    hints: ['Check the memo before recursing.', 'Store the computed value under memo[n], then return it.'],
    important: true,
    signature: 'memo:optimize-add-memo',
  }),
  write({
    id: 'd10-memo-fib',
    title: 'Memoized Fibonacci',
    skills: ['memoization', 'recurrence'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `fast_fib(n)` returning the n-th Fibonacci number: `fast_fib(0) = 0`, `fast_fib(1) = 1`, and after that each number is the sum of the two before it (`fast_fib(10)` → `55`). Memoize it: create a dict inside `fast_fib` and do the recursion in an inner helper function that can see that dict. `n = 80` must come back instantly.',
    starterCode: `def fast_fib(n):
    pass`,
    solution: `def fast_fib(n):
    memo = {}
    def go(k):
        if k < 2:
            return k
        if k in memo:
            return memo[k]
        memo[k] = go(k - 1) + go(k - 2)
        return memo[k]
    return go(n)`,
    tests: [t.eq('fast_fib(10)', '55'), t.eq('fast_fib(0)', '0'), t.hidden('fast_fib(80)', '23416728348467685'), t.hidden('fast_fib(1)', '1')],
    hints: ['Put memo = {} in the outer function and recurse with an inner helper.', 'Check memo, compute, store, return.'],
    signature: 'memo:fib-dict',
  }),
  debug({
    id: 'd10-memo-dbg-inside',
    title: 'Debug: the memo that never remembers',
    skills: ['memoization'],
    minutes: 4,
    prompt: '`tri(n)` returns `1` for `n < 3`, otherwise `tri(n - 1) + tri(n - 2) + tri(n - 3)`. It is supposed to be memoized, but `calls` shows it is still exponential. A test resets `calls` and requires `tri(20)` to take at most 80 calls. Fix it.',
    brokenCode: `calls = 0

def tri(n):
    global calls
    calls += 1
    memo = {}
    if n < 3:
        return 1
    if n in memo:
        return memo[n]
    memo[n] = tri(n - 1) + tri(n - 2) + tri(n - 3)
    return memo[n]`,
    solution: `calls = 0
memo = {}

def tri(n):
    global calls
    calls += 1
    if n < 3:
        return 1
    if n in memo:
        return memo[n]
    memo[n] = tri(n - 1) + tri(n - 2) + tri(n - 3)
    return memo[n]`,
    tests: [
      t.eq('tri(5)', '9'),
      t.check('linear number of calls', "calls = 0\nresult = tri(20)\nassert result == 85525, result\nassert calls <= 80, f'{calls} calls: the memo is not being reused'"),
    ],
    hints: ['How long does each memo dict live?'],
    explanation: 'A dict created inside the recursive function is a brand-new empty dict on every call, so nothing is ever found. The memo must outlive the calls.',
    signature: 'debug:memo-inside-function',
  }),
  write({
    id: 'd10-memo-grid',
    title: 'Memoized grid paths',
    skills: ['memoization', 'recurrence', 'tuples'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 6,
    prompt: 'A grid has `rows` rows and `cols` columns (both at least 1). Starting top-left and moving only right or down, `grid_paths(rows, cols)` returns how many routes reach the bottom-right; one row or one column means exactly one route. `grid_paths(3, 3)` → `6`.\n\nPlain recursion is far too slow for a 16 x 16 grid, so memoize it. A subproblem now has **two** changing numbers, so the dict key is the pair `(rows, cols)`.',
    starterCode: `def grid_paths(rows, cols):
    pass`,
    solution: `def grid_paths(rows, cols):
    memo = {}
    def go(r, c):
        if r == 1 or c == 1:
            return 1
        if (r, c) in memo:
            return memo[(r, c)]
        memo[(r, c)] = go(r - 1, c) + go(r, c - 1)
        return memo[(r, c)]
    return go(rows, cols)`,
    tests: [t.eq('grid_paths(3, 3)', '6'), t.eq('grid_paths(1, 1)', '1'), t.hidden('grid_paths(3, 7)', '28'), t.hidden('grid_paths(16, 16)', '155117520')],
    hints: ['Tuples can be dict keys.', 'Same check / compute / store shape as fib, with two arguments.'],
    signature: 'memo:grid-tuple-key',
  }),
  debug({
    id: 'd10-memo-dbg-key',
    title: 'Debug: memoized paths with a bad cache',
    skills: ['memoization', 'tuples'],
    minutes: 4,
    prompt: '`paths(rows, cols)` should count right/down routes from the top-left to the bottom-right of a `rows` x `cols` grid, memoized. Its answers are wrong. Fix it.',
    brokenCode: `def paths(rows, cols):
    memo = {}
    def go(r, c):
        if r == 1 or c == 1:
            return 1
        if r in memo:
            return memo[r]
        memo[r] = go(r - 1, c) + go(r, c - 1)
        return memo[r]
    return go(rows, cols)`,
    solution: `def paths(rows, cols):
    memo = {}
    def go(r, c):
        if r == 1 or c == 1:
            return 1
        if (r, c) in memo:
            return memo[(r, c)]
        memo[(r, c)] = go(r - 1, c) + go(r, c - 1)
        return memo[(r, c)]
    return go(rows, cols)`,
    tests: [t.eq('paths(3, 3)', '6'), t.eq('paths(1, 4)', '1'), t.hidden('paths(3, 7)', '28')],
    hints: ['Two different subproblems must never share a memo entry.'],
    explanation: 'The key must identify the subproblem exactly: every argument that changes. Keyed by r alone, go(2, 3) and go(2, 2) overwrite each other.',
    signature: 'debug:memo-wrong-key',
  }),
  write({
    id: 'd10-memo-cache-ways3',
    title: '@cache on 1/2/3 steps',
    skills: ['memoization', 'recurrence'],
    difficulty: 2,
    minutes: 4,
    prompt: 'Each move climbs 1, 2 or 3 steps. Write `ways3(n)` returning how many sequences of moves land exactly on step `n` (`ways3(0) = 1`, `ways3(4)` → `7`). This time let Python do the remembering: `@cache` from `functools`, written on the line above `def`, memoizes a function by its arguments. It must handle `n = 40`.',
    starterCode: `def ways3(n):
    pass`,
    solution: `from functools import cache

@cache
def ways3(n):
    if n == 0:
        return 1
    if n < 0:
        return 0
    return ways3(n - 1) + ways3(n - 2) + ways3(n - 3)`,
    tests: [t.eq('ways3(4)', '7'), t.hidden('ways3(30)', '53798080'), t.hidden('ways3(40)', '23837527729')],
    hints: ['Import it: from functools import cache. Then put @cache on the line above def.'],
    signature: 'memo:functools-cache',
  }),
]

const bottomUp = [
  output({
    id: 'd10-bu-trace',
    title: 'Fill the table',
    skills: ['dp_table'],
    prompt: 'Predict the output. `dp` is a list where `dp[i]` holds the i-th Fibonacci number (`dp[0] = 0`, `dp[1] = 1`).',
    code: `n = 6
dp = [0] * (n + 1)
dp[1] = 1
for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]
print(dp)
print(dp[n])`,
    expectedOutput: `[0, 1, 1, 2, 3, 5, 8]
8`,
    note: '**Bottom-up DP**: instead of recursing down from `n` (top-down, with a memo), fill a list (the **table**) upward from the smallest inputs. First say in words what `dp[i]` means (the **state**). Then: `dp = [0] * (n + 1)`, set the base entries, fill `i` upward from earlier entries, and the answer is `dp[n]`.',
    explanation: 'Each entry depends only on entries already filled to its left. That order is what makes it "bottom-up".',
    minutes: 2,
    signature: 'trace:dp-fib-table',
  }),
  write({
    id: 'd10-bu-translate',
    title: 'Translate: memo → table',
    skills: ['dp_table', 'recurrence'],
    style: 'translate',
    difficulty: 2,
    minutes: 5,
    prompt: "This memoized `count_ways(n)` counts the ways to climb `n` steps taking 1 or 2 at a time. It is O(n), but it recurses `n` levels deep and crashes for `n = 3000`. Rewrite it **bottom-up**, without recursion. Build a list `dp` where `dp[i]` is the number of ways to climb `i` steps, just like `go(i)`. Fill it from the smallest `i` upward and return `dp[n]`.",
    starterCode: `def count_ways(n):
    memo = {}
    def go(i):
        if i <= 1:
            return 1
        if i in memo:
            return memo[i]
        memo[i] = go(i - 1) + go(i - 2)
        return memo[i]
    return go(n)`,
    solution: `def count_ways(n):
    dp = [1] * (n + 1)
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
    tests: [
      t.eq('count_ways(5)', '8'),
      t.eq('count_ways(1)', '1'),
      t.check('handles n = 3000', 'a, b = 1, 1\nfor _ in range(3000):\n    a, b = b, a + b\nassert count_ways(3000) == a'),
    ],
    hints: ['dp[i] means the same thing as go(i).', 'Base entries dp[0] = dp[1] = 1, then fill i = 2..n.'],
    signature: 'dp:translate-memo-to-table',
  }),
  write({
    id: 'd10-bu-three-steps',
    title: 'Table for 1/2/3 steps',
    skills: ['dp_table', 'recurrence'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Each move climbs 1, 2 or 3 steps. Write `ways3_table(n)` returning how many sequences of moves land exactly on step `n` (`n` is 0 or more), bottom-up with no recursion. Build a list `dp` where `dp[i]` is the number of ways to land on step `i`; `dp[0]` is `1` (make no move). `ways3_table(4)` → `7`. Watch the small `i`: a 3-step move cannot land on step 1 or 2.',
    starterCode: `def ways3_table(n):
    pass`,
    solution: `def ways3_table(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        for step in (1, 2, 3):
            if i - step >= 0:
                dp[i] += dp[i - step]
    return dp[n]`,
    tests: [t.eq('ways3_table(4)', '7'), t.eq('ways3_table(0)', '1'), t.hidden('ways3_table(30)', '53798080'), t.hidden('ways3_table(2)', '2')],
    hints: ['dp[0] = 1, then add dp[i - step] for each step that does not go below 0.'],
    signature: 'dp:three-steps-table',
  }),
  write({
    id: 'd10-bu-any-steps',
    title: 'Any set of step sizes',
    skills: ['dp_table', 'recurrence'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: 'A staircase has `n` steps (`n` is 0 or more) and you start on the ground. `steps` is a list of distinct positive whole numbers: the sizes of move you are allowed to make. Write `ways_with(n, steps)` returning how many different sequences of moves land exactly on step `n`.\n\nOrder matters: with `steps = [1, 2]`, "1 then 2" and "2 then 1" are two different ways. Making no move is the one way to climb 0 steps, so `ways_with(0, [3])` → `1`. If no sequence lands exactly on step `n`, return `0`: `ways_with(5, [2])` → `0`.\n\n`ways_with(4, [1, 2])` → `5`',
    transfer: true,
    starterCode: `def ways_with(n, steps):
    pass`,
    solution: `def ways_with(n, steps):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        for s in steps:
            if s <= i:
                dp[i] += dp[i - s]
    return dp[n]`,
    tests: [
      t.eq('ways_with(4, [1, 2])', '5'),
      t.eq('ways_with(5, [2])', '0'),
      t.hidden('ways_with(0, [3])', '1'),
      t.hidden('ways_with(7, [1, 3])', '9'),
      t.hidden('ways_with(30, [1, 3])', '58425'),
    ],
    hints: ['Think about the last move. Which smaller staircases could it have started from?', 'Let dp[i] be the number of ways to land on step i, and fill a list from 0 up to n.', 'dp[i] = sum of dp[i - s] for every allowed s that fits (s <= i).', 'Base: dp[0] = 1.'],
    signature: 'dp:general-steps',
  }),
  debug({
    id: 'd10-bu-dbg-range',
    title: 'Debug: domino tilings',
    skills: ['dp_table'],
    minutes: 3,
    prompt: '`tilings(n)` counts the ways to cover a 2 x `n` strip with 2 x 1 dominoes. `dp[i]` is the number of ways to cover a 2 x `i` strip: `dp[0] = dp[1] = 1` and `dp[i] = dp[i - 1] + dp[i - 2]`. `tilings(3)` should be `3`. Its answers are wrong. Fix it.',
    brokenCode: `def tilings(n):
    dp = [1] * (n + 1)
    for i in range(2, n):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
    solution: `def tilings(n):
    dp = [1] * (n + 1)
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
    tests: [t.eq('tilings(3)', '3'), t.eq('tilings(1)', '1'), t.hidden('tilings(0)', '1'), t.hidden('tilings(10)', '89')],
    hints: ['Which index does the function return? Does the loop ever write it?'],
    signature: 'debug:dp-range-off-by-one',
  }),
  write({
    id: 'd10-bu-min-cost',
    title: 'Cheapest climb',
    skills: ['dp_table', 'recurrence'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    minutes: 10,
    prompt: '`cost` is a list of at least two non-negative numbers: `cost[i]` is what you pay for standing on step `i`. You may start on step 0 or step 1, and from any step you move up 1 or 2. The top is just past the last step and costs nothing. Write `cheapest(cost)` returning the smallest total you can pay to reach the top. `cheapest([10, 15, 20])` → `15` (start on step 1, pay 15, jump 2 to the top).\n\nThis is a table again, but each entry keeps the **smaller** of two options instead of adding them. Let `dp[i]` be the cheapest total paid to be standing on step `i`.',
    starterCode: `def cheapest(cost):
    pass`,
    solution: `def cheapest(cost):
    n = len(cost)
    dp = [0] * n
    dp[0], dp[1] = cost[0], cost[1]
    for i in range(2, n):
        dp[i] = cost[i] + min(dp[i - 1], dp[i - 2])
    return min(dp[n - 1], dp[n - 2])`,
    tests: [
      t.eq('cheapest([10, 15, 20])', '15'),
      t.eq('cheapest([1, 100, 1, 1, 1, 100, 1, 1, 100, 1])', '6'),
      t.hidden('cheapest([0, 0])', '0'),
      t.hidden('cheapest([5, 3])', '3'),
      t.hidden('cheapest([2, 2, 2, 2])', '4'),
    ],
    hints: ['You arrive on step i from step i - 1 or step i - 2. Which would you rather have come from?', 'dp[0] and dp[1] are just their own costs: you may start on either.', 'dp[i] = cost[i] + min(dp[i - 1], dp[i - 2]).', 'The top can be reached from either of the last two steps: min(dp[-1], dp[-2]).'],
    signature: 'dp:min-cost-stairs',
  }),
  capstone({
    id: 'cap-climbing-stairs',
    title: 'Ways up a staircase',
    problemId: 'climbing-stairs',
    skills: ['recurrence', 'memoization', 'dp_table'],
    difficulty: 2,
    minutes: 20,
    prompt: 'A staircase has `n` steps (`n >= 1`). Each move climbs either one step or two. Return how many different sequences of moves get you from the bottom to exactly the top.',
    starterCode: `def climb_stairs(n: int) -> int:
    pass`,
    solution: `def climb_stairs(n: int) -> int:
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
    examples: [
      { input: 'n = 2', output: '2', note: '1+1 or 2' },
      { input: 'n = 3', output: '3', note: '1+1+1, 1+2, 2+1' },
      { input: 'n = 1', output: '1' },
    ],
    tests: [
      t.eq('climb_stairs(2)', '2'),
      t.eq('climb_stairs(3)', '3'),
      t.hidden('climb_stairs(1)', '1'),
      t.hidden('climb_stairs(4)', '5'),
      t.hidden('climb_stairs(5)', '8'),
      t.hidden('climb_stairs(10)', '89'),
      t.hidden('climb_stairs(45)', '1836311903'),
    ],
    hints: [
      'Think about the very last move onto step n.',
      'ways(n) = ways(n - 1) + ways(n - 2), with ways(0) = ways(1) = 1.',
      'Plain recursion is exponential; memoize it or fill a list from the bottom.',
      'dp = [0] * (n + 1); dp[0] = dp[1] = 1; for i in 2..n: dp[i] = dp[i - 1] + dp[i - 2]; return dp[n].',
    ],
    complexity: { time: 'O(n)', space: 'O(n), or O(1) with two variables' },
    explanation: 'Every route to step n ends with a 1-step from n - 1 or a 2-step from n - 2, so the counts add. Computing each step once bottom-up is O(n); only the last two values are ever needed.',
    signature: 'capstone:climbing-stairs',
  }),
  explain({
    id: 'd10-explain-climbing-stairs',
    title: 'Explain: climbing stairs',
    minutes: 5,
    skills: ['explanation', 'complexity', 'recurrence'],
    prompt: 'Explain climbing stairs in an interview: the recurrence and why it is correct, the progression from recursion to memo to table, and complexity.',
    rubric: [
      'Recurrence f(n) = f(n - 1) + f(n - 2) from the last move',
      'Base cases f(0) = f(1) = 1 (or f(1) = 1, f(2) = 2)',
      'Naive recursion is exponential because of overlapping subproblems',
      'Memo or bottom-up table makes it O(n) time',
      'Space can drop to O(1) with two rolling variables',
    ],
    signature: 'explain:climbing-stairs',
  }),
  write({
    id: 'd10-fu-broken-steps',
    title: 'Follow-up: broken steps',
    style: 'modify',
    skills: ['dp_table', 'recurrence', 'set_membership'],
    prompt: '**Interviewer follow-up.** Same staircase, 1 or 2 steps per move, but some steps are **broken** and you can never land on them. `broken` is a set of step numbers from 1 to `n`. Return how many ways reach step `n` exactly (0 if the top itself is broken). Adapt it as `climb_avoiding(n, broken)`.',
    starterCode: `def climb_avoiding(n, broken):
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
`,
    solution: `def climb_avoiding(n, broken):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        if i in broken:
            continue
        dp[i] = dp[i - 1] + (dp[i - 2] if i >= 2 else 0)
    return dp[n]
`,
    tests: [t.eq('climb_avoiding(4, {2})', '1'), t.eq('climb_avoiding(5, set())', '8'), t.hidden('climb_avoiding(3, {3})', '0'), t.hidden('climb_avoiding(1, set())', '1'), t.hidden('climb_avoiding(1, {1})', '0'), t.hidden('climb_avoiding(6, {3})', '4')],
    hints: ['A broken step can be reached in 0 ways, and that 0 flows forward on its own.', 'Step 1 needs care now: it might be broken, so build it inside the loop instead of hard-coding it.'],
    explanation: 'The recurrence is unchanged; a broken step just has 0 ways, and the table propagates that. Still O(n) time, and could be O(1) space with two variables.',
    signature: 'followup:stairs-broken-steps',
    minutes: 5,
  }),
]

const rolling = [
  output({
    id: 'd10-roll-trace',
    title: 'Two variables marching forward',
    skills: ['state_tracking'],
    prompt: 'Predict the output. `a` and `b` always hold two neighbouring Fibonacci numbers.',
    code: `a, b = 0, 1
for _ in range(5):
    a, b = b, a + b
    print(a, b)`,
    expectedOutput: `1 1
1 2
2 3
3 5
5 8`,
    note: '**Rolling variables**: when `dp[i]` only ever reads the previous two entries, the rest of the list is dead weight. Keep just the last two values in two variables and move them forward together: `prev2, prev1 = prev1, prev1 + prev2`. The right side is worked out with the old values first.',
    explanation: 'The right side is evaluated fully, using the old a and b, before either name is reassigned.',
    important: true,
    minutes: 2,
    signature: 'trace:rolling-pair',
  }),
  write({
    id: 'd10-roll-fib',
    title: 'Fibonacci in O(1) space',
    skills: ['state_tracking', 'recurrence'],
    difficulty: 2,
    minutes: 3,
    prompt: 'Write `fib2(n)` returning the n-th Fibonacci number (`0, 1, 1, 2, 3, 5, ...`, so `fib2(0) = 0` and `fib2(1) = 1`) with a loop and two rolling variables: no list and no recursion.',
    starterCode: `def fib2(n):
    pass`,
    solution: `def fib2(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`,
    tests: [t.eq('fib2(0)', '0'), t.eq('fib2(10)', '55'), t.hidden('fib2(1)', '1'), t.hidden('fib2(80)', '23416728348467685')],
    hints: ['Start a, b = 0, 1 and step n times; a ends as fib(n).'],
    signature: 'rolling:fib',
  }),
  debug({
    id: 'd10-roll-dbg-two-lines',
    title: 'Debug: rolling Fibonacci',
    skills: ['state_tracking'],
    minutes: 3,
    prompt: '`fib_fast(n)` should return the n-th Fibonacci number (`0, 1, 1, 2, 3, 5, ...`) using two rolling variables. Fix it.',
    brokenCode: `def fib_fast(n):
    a, b = 0, 1
    for _ in range(n):
        a = b
        b = a + b
    return a`,
    solution: `def fib_fast(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`,
    tests: [t.eq('fib_fast(10)', '55'), t.eq('fib_fast(1)', '1'), t.hidden('fib_fast(0)', '0'), t.hidden('fib_fast(30)', '832040')],
    hints: ['Trace a and b by hand for three iterations.', 'Which value of a does the second line use?'],
    explanation: 'After a = b the old a is gone, so b = a + b doubles b. Tuple assignment evaluates the right side with the old values first.',
    signature: 'debug:rolling-two-assignments',
  }),
  write({
    id: 'd10-roll-trib',
    title: 'Three rolling variables',
    skills: ['state_tracking', 'recurrence'],
    difficulty: 2,
    minutes: 4,
    prompt: 'Tribonacci: `t(0) = 0`, `t(1) = 1`, `t(2) = 1`, and `t(n) = t(n - 1) + t(n - 2) + t(n - 3)`. Write `trib(n)` with three rolling variables, no list and no recursion.',
    starterCode: `def trib(n):
    pass`,
    solution: `def trib(n):
    a, b, c = 0, 1, 1
    for _ in range(n):
        a, b, c = b, c, a + b + c
    return a`,
    tests: [t.eq('trib(4)', '4'), t.eq('trib(0)', '0'), t.hidden('trib(2)', '1'), t.hidden('trib(25)', '1389537')],
    hints: ['Same shape as fib2 with one more name.', 'a, b, c = b, c, a + b + c'],
    signature: 'rolling:tribonacci',
  }),
  output({
    id: 'd10-roll-robber-trace',
    title: 'Trace the take-or-skip table',
    skills: ['dp_table', 'recurrence'],
    prompt: 'Predict the output. You may take values from `nums`, but never two that are next to each other. `best[i]` is the largest total you can take using only `nums[0]` to `nums[i]`.',
    code: `nums = [2, 7, 9, 3, 1]
best = [0] * len(nums)
best[0] = nums[0]
best[1] = max(nums[0], nums[1])
for i in range(2, len(nums)):
    best[i] = max(best[i - 1], best[i - 2] + nums[i])
print(best)`,
    expectedOutput: `[2, 7, 11, 11, 12]`,
    note: 'Take or skip: skipping i keeps best[i - 1]; taking i means skipping i - 1, so best[i - 2] + nums[i]. Keep the max.',
    explanation: 'At index 2: skip gives 7, take gives 2 + 9 = 11. At index 4: 11 vs 11 + 1 = 12.',
    important: true,
    minutes: 2.5,
    signature: 'trace:take-skip-table',
  }),
  write({
    id: 'd10-roll-robber-memo',
    title: 'Take or skip, top-down',
    skills: ['memoization', 'recurrence'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: '`nums` is a list of non-negative numbers. You may take any of them, but never two that are **adjacent** (next to each other in the list: indexes `i` and `i + 1`). Write `best_no_neighbours(nums)` returning the largest total you can take. `[2, 7, 9, 3, 1]` → `12` (2 + 9 + 1). An empty list gives `0`.\n\nWork top-down: let `go(i)` be the best total using only the values from index `i` to the end. At index `i` there are two choices: skip it (`go(i + 1)`), or take it, which rules out `i + 1` (`nums[i] + go(i + 2)`). Keep the larger, and memoize `go` with a dict so each `i` is solved once.',
    note: 'Take or skip: at each index, either skip it (the answer is whatever the rest gives) or take it (its value plus the best of what is still allowed after it). The answer is the larger of the two. Two values are **adjacent** when their indexes differ by 1.',
    starterCode: `def best_no_neighbours(nums):
    pass`,
    solution: `def best_no_neighbours(nums):
    memo = {}
    def go(i):
        if i >= len(nums):
            return 0
        if i in memo:
            return memo[i]
        memo[i] = max(go(i + 1), nums[i] + go(i + 2))
        return memo[i]
    return go(0)`,
    tests: [
      t.eq('best_no_neighbours([2, 7, 9, 3, 1])', '12'),
      t.eq('best_no_neighbours([])', '0'),
      t.hidden('best_no_neighbours([5])', '5'),
      t.hidden('best_no_neighbours([1, 2, 3, 1])', '4'),
      t.hidden('best_no_neighbours([10] * 300)', '1500'),
    ],
    hints: ['Base case: i past the end gives 0.', 'max(skip, take); store in memo[i].'],
    explanation: 'Same decision tree as include/exclude, but the memo collapses it to n distinct subproblems: O(n).',
    signature: 'memo:take-skip',
  }),
  write({
    id: 'd10-roll-robber-table',
    title: 'Never two days in a row',
    skills: ['dp_table', 'recurrence', 'edge_cases'],
    difficulty: 3,
    minutes: 7,
    prompt: '`nums[i]` is what a job on day `i` pays (never negative). You may work any days you like, but never two days in a row. Write `best_table(nums)` returning the most you can earn.\n\n`best_table([2, 7, 9, 3, 1])` → `12` (days 0, 2 and 4). With no days at all the answer is `0`; with one day it is that day\'s pay.',
    transfer: true,
    starterCode: `def best_table(nums):
    pass`,
    solution: `def best_table(nums):
    if not nums:
        return 0
    if len(nums) == 1:
        return nums[0]
    best = [0] * len(nums)
    best[0] = nums[0]
    best[1] = max(nums[0], nums[1])
    for i in range(2, len(nums)):
        best[i] = max(best[i - 1], best[i - 2] + nums[i])
    return best[-1]`,
    tests: [
      t.eq('best_table([2, 7, 9, 3, 1])', '12'),
      t.eq('best_table([])', '0'),
      t.eq('best_table([4])', '4'),
      t.hidden('best_table([2, 1, 1, 2])', '4'),
      t.hidden('best_table([3, 10])', '10'),
    ],
    hints: ['On the last day you either work or you rest. What is the best total in each case?', 'Let best[i] be the most you can earn from days 0 to i, and build it in a list from left to right. Handle zero days and one day first.', 'best[1] is the better of the first two values.', 'best[i] = max(best[i - 1], best[i - 2] + nums[i]).'],
    signature: 'dp:take-skip-table',
  }),
  debug({
    id: 'd10-roll-dbg-adjacent',
    title: 'Debug: no neighbours allowed',
    skills: ['state_tracking', 'recurrence'],
    minutes: 3.5,
    prompt: '`nums` is a list of non-negative numbers. `best_total(nums)` should return the largest sum you can make without ever taking two values that are next to each other (`[2, 7, 9, 3, 1]` → `12`, an empty list → `0`). It uses two rolling variables instead of a list: after each value, `prev1` is the best total so far and `prev2` is the best total as of one value earlier. Fix it.',
    brokenCode: `def best_total(nums):
    prev2, prev1 = 0, 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev1 + x)
    return prev1`,
    solution: `def best_total(nums):
    prev2, prev1 = 0, 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1`,
    tests: [t.eq('best_total([2, 7, 9, 3, 1])', '12'), t.eq('best_total([])', '0'), t.hidden('best_total([5, 5, 5])', '10')],
    hints: ['If you take x, which earlier best total are you allowed to add it to?'],
    explanation: 'Taking x means the previous house was skipped, so x adds to prev2 (best up to two houses back), never prev1.',
    signature: 'debug:take-skip-adjacent',
  }),
  capstone({
    id: 'cap-house-robber',
    title: 'No two neighbours',
    problemId: 'house-robber',
    skills: ['recurrence', 'dp_table', 'state_tracking'],
    difficulty: 3,
    minutes: 25,
    prompt: 'A row of houses each holds some non-negative amount of cash, given as `nums`. You may collect from any houses you like, except that you may never collect from two houses that are next to each other. Return the largest total you can collect.\n\nTry to finish with O(1) extra space.',
    starterCode: `def rob(nums: List[int]) -> int:
    pass`,
    solution: `def rob(nums: List[int]) -> int:
    prev2, prev1 = 0, 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1`,
    examples: [
      { input: 'nums = [1, 2, 3, 1]', output: '4', note: 'Houses 0 and 2.' },
      { input: 'nums = [2, 7, 9, 3, 1]', output: '12', note: 'Houses 0, 2 and 4.' },
      { input: 'nums = [2, 1, 1, 2]', output: '4', note: 'Houses 0 and 3: skipping two in a row is allowed.' },
    ],
    tests: [
      t.eq('rob([1, 2, 3, 1])', '4'),
      t.eq('rob([2, 7, 9, 3, 1])', '12'),
      t.eq('rob([2, 1, 1, 2])', '4'),
      t.hidden('rob([])', '0'),
      t.hidden('rob([5])', '5'),
      t.hidden('rob([3, 10])', '10'),
      t.hidden('rob([0, 0, 0])', '0'),
      t.hidden('rob([4, 1, 2, 7, 5, 3, 1])', '14'),
      t.hidden('rob([1] * 1000)', '500'),
    ],
    hints: [
      'At each house you either take it or skip it.',
      'best(i) = max(best(i - 1), best(i - 2) + nums[i]).',
      'Only the previous two best values are ever read.',
      'prev2, prev1 = 0, 0; for x in nums: prev2, prev1 = prev1, max(prev1, prev2 + x); return prev1.',
    ],
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: 'Skipping house i keeps the best total so far; taking it adds nums[i] to the best total that ends at least two houses back. Keeping just those two running values gives O(n) time and O(1) space, and empty or single-house inputs fall out of the starting zeros.',
    signature: 'capstone:house-robber',
  }),
  explain({
    id: 'd10-explain-house-robber',
    title: 'Explain: house robber',
    minutes: 5,
    skills: ['explanation', 'complexity', 'recurrence', 'state_tracking'],
    prompt: 'Explain your house robber solution: the take-or-skip recurrence, what the two variables mean, complexity, and edge cases.',
    rubric: [
      'Recurrence best[i] = max(best[i - 1], best[i - 2] + nums[i])',
      'prev1 = best up to the previous house, prev2 = best up to the one before',
      'Tuple assignment updates both from old values',
      'O(n) time, O(1) space (vs O(n) for the table or memo)',
      'Edge cases: empty list, one house, two houses',
    ],
    signature: 'explain:house-robber',
  }),
]

const cold = [
  write({
    id: 'd10-cold-letter-subsets',
    title: 'Cold: every subsequence of a word',
    skills: ['backtracking_state', 'recursion_base_case'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
    prompt: 'From memory: `subsequences(word)` returns every subsequence of `word` as a string (letters keep their order), in any order.',
    starterCode: `def subsequences(word):
    pass`,
    solution: `def subsequences(word):
    res = []
    path = []
    def dfs(i):
        if i == len(word):
            res.append(''.join(path))
            return
        path.append(word[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return res`,
    tests: [
      t.eq("subsequences('abc')", "['abc', 'ab', 'ac', 'a', 'bc', 'b', 'c', '']", { compare: 'unordered' }),
      t.hidden("subsequences('')", "['']"),
      t.hidden("len(subsequences('abcde'))", '32'),
    ],
    signature: 'cold:subsequences',
  }),
  write({
    id: 'd10-cold-pick-k',
    title: 'Cold: choose k items',
    skills: ['backtracking_state', 'range'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 7,
    prompt: 'From memory: `pick_k(nums, k)` returns every group of `k` items from the distinct values in `nums`, with no group repeated in a different order.',
    starterCode: `def pick_k(nums, k):
    pass`,
    solution: `def pick_k(nums, k):
    res = []
    path = []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        for i in range(start, len(nums)):
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
    dfs(0)
    return res`,
    tests: [
      t.eq('pick_k([1, 2, 3], 2)', '[[1, 2], [1, 3], [2, 3]]', { compare: 'sorted-inner' }),
      t.hidden('pick_k([5, 6], 0)', '[[]]', { compare: 'sorted-inner' }),
      t.hidden('len(pick_k([1, 2, 3, 4, 5, 6], 3))', '20'),
    ],
    signature: 'cold:combinations-k',
  }),
  write({
    id: 'd10-cold-pieces',
    title: 'Cold: pieces of length 1 and 3',
    skills: ['recurrence', 'state_tracking', 'dp_table'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
    prompt: 'A strip of length `n` is covered left to right with pieces of length 1 or 3. Write `cover(n)` counting the ways (`cover(0) = 1`). No recursion.',
    starterCode: `def cover(n):
    pass`,
    solution: `def cover(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        dp[i] = dp[i - 1]
        if i >= 3:
            dp[i] += dp[i - 3]
    return dp[n]`,
    tests: [t.eq('cover(4)', '3'), t.eq('cover(0)', '1'), t.hidden('cover(7)', '9'), t.hidden('cover(30)', '58425')],
    signature: 'cold:dp-pieces-1-3',
  }),
  write({
    id: 'd10-cold-cache-stairs',
    title: 'Cold: stairs with @cache',
    skills: ['memoization', 'recurrence'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 4,
    prompt: 'Write `stairs(n)` (1 or 2 steps, `stairs(0) = stairs(1) = 1`) top-down with `functools.cache`.',
    starterCode: `def stairs(n):
    pass`,
    solution: `from functools import cache

@cache
def stairs(n):
    if n <= 1:
        return 1
    return stairs(n - 1) + stairs(n - 2)`,
    tests: [t.eq('stairs(5)', '8'), t.hidden('stairs(45)', '1836311903')],
    signature: 'cold:cache-stairs',
  }),
]

export const day: DayModule = {
  date: '2026-10-10',
  short: 'Backtracking',
  title: 'Backtracking + intro DP',
  focus: 'Write, break and fix choose / explore / un-choose, then turn a recurrence into a memo, a table and rolling variables.',
  sections: [
    { id: 'd10-warmup', title: 'Warm-up', summary: 'Cold reps on sorting, heaps, intervals, trees, grids and sets.', exercises: warmup },
    { id: 'd10-decisions', title: 'Decision trees', summary: 'Include / exclude recursion with the state passed as parameters.', exercises: decisions },
    { id: 'd10-path', title: 'Path state', summary: 'One shared path: append, recurse, pop, and copy with path[:].', exercises: pathState },
    { id: 'd10-subsets', title: 'Subsets', summary: 'Two subset styles, a test that catches the classic bugs, then the subsets capstone.', exercises: subsets },
    { id: 'd10-recurrence', title: 'Recurrences', summary: 'Answers in terms of smaller answers, and getting the base cases right.', exercises: recurrence },
    { id: 'd10-memo', title: 'Memoization', summary: 'Check, compute, store with a dict; where the dict lives; the key; functools.cache.', exercises: memo },
    { id: 'd10-bottom-up', title: 'Bottom-up DP', summary: 'Memo to table, then climbing stairs.', exercises: bottomUp },
    { id: 'd10-rolling', title: 'Rolling state', summary: 'Two variables instead of a list, take-or-skip three ways, then house robber.', exercises: rolling },
    { id: 'd10-cold', title: 'Cold reps', summary: 'From a signature, no scaffolding.', exercises: cold },
  ],
  capstones: ['subsets', 'climbing-stairs', 'house-robber'],
}
