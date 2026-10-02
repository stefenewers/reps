import type { DayModule } from '@/lib/types'
import { choice, output, fill, code, reorder, capstone, explain, t } from '@/data/exercises/build'

// October 10: backtracking (include/exclude, path append/pop) and intro 1-D DP.

const warmup = [
  code({
    id: 'd10-warm-sort-by-end',
    title: 'Warm-up: sort by end, then start',
    skills: ['sort_key', 'tuples'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 5,
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
  code({
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
  code({
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
  code({
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
  code({
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
  code({
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
  choice({
    id: 'd10-dt-leaf-count',
    title: 'How many leaves?',
    skills: ['backtracking_state', 'recurrence'],
    prompt: 'A recursive function walks a list of `n` items and, for each item, makes two calls: one that **includes** it and one that **excludes** it. How many base-case calls (leaves) happen?',
    options: ['n', 'n * 2', '2 ** n', 'n ** 2'],
    answer: 2,
    note: 'Include/exclude: two branches per item, so 2^n leaves, one for each subset.',
    explanation: 'Each level doubles the number of paths. That is why subset generation is O(n * 2^n): 2^n subsets, each up to n long to copy.',
    important: true,
    signature: 'backtrack:recognize-2-pow-n',
  }),
  output({
    id: 'd10-dt-include-exclude',
    title: 'Include first, then exclude',
    skills: ['backtracking_state', 'recursion_base_case'],
    prompt: 'Predict the output. Here the path is passed as a new list each time (`picked + [x]`), so nothing has to be undone.',
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
    note: 'Decision tree: at index i, branch 1 takes items[i], branch 2 skips it. The base case is i == len(items).',
    explanation: 'The include branch is explored fully before the exclude branch, so the first leaf takes everything and the last takes nothing.',
    important: true,
    minutes: 2.5,
    signature: 'trace:include-exclude-immutable',
  }),
  fill({
    id: 'd10-dt-fill-count-sums',
    title: 'Count subsets that hit a target',
    skills: ['backtracking_state', 'recursion_return'],
    prompt: 'Fill the blank so the include branch adds `nums[i]` to the running total.',
    starterCode: `def count_sums(nums, target):
    def go(i, total):
        if i == len(nums):
            return 1 if total == target else 0
        take = go(i + 1, ____)
        skip = go(i + 1, total)
        return take + skip
    return go(0, 0)`,
    solution: `def count_sums(nums, target):
    def go(i, total):
        if i == len(nums):
            return 1 if total == target else 0
        take = go(i + 1, total + nums[i])
        skip = go(i + 1, total)
        return take + skip
    return go(0, 0)`,
    tests: [t.eq('count_sums([1, 2, 3], 3)', '2'), t.eq('count_sums([], 0)', '1'), t.hidden('count_sums([2, 2], 2)', '2')],
    hints: ['The state is (index, total so far). Taking an item changes the total.'],
    signature: 'backtrack:fill-include-total',
  }),
  code({
    id: 'd10-dt-all-sums',
    title: 'Every subset sum',
    skills: ['backtracking_state', 'recursion_base_case'],
    difficulty: 2,
    minutes: 6,
    prompt: 'Write `all_sums(nums)` returning a list with the sum of every subset of `nums` (one entry per subset, so `2 ** len(nums)` entries, duplicates allowed). Use include/exclude recursion carrying the running total.',
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
    hints: ['Base case: i == len(nums), record total.', 'Two calls: one with total + nums[i], one with total.'],
    signature: 'backtrack:collect-subset-sums',
  }),
  code({
    id: 'd10-dt-can-reach',
    title: 'Can some subset reach the target?',
    skills: ['backtracking_state', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: 'Write `can_reach(nums, target)` returning `True` if some subset of `nums` sums exactly to `target` (the empty subset sums to 0). Return as soon as one branch succeeds.',
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
  code({
    id: 'd10-dt-signs',
    title: 'Plus or minus each number',
    skills: ['backtracking_state', 'recursion_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: 'Put a `+` or `-` in front of every number in `nums`. Write `sign_ways(nums, target)` returning how many sign choices make the total equal `target`. The two branches here are "add" and "subtract", not include/exclude.',
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
  code({
    id: 'd10-dt-binary-strings',
    title: 'All bit strings of length n',
    skills: ['backtracking_state', 'recursion_base_case'],
    difficulty: 2,
    minutes: 4,
    prompt: "Write `bit_strings(n)` returning every string of length `n` made of `'0'` and `'1'`, in order with `'0'` branches first (so `n = 2` gives `['00', '01', '10', '11']`). Pass the string built so far as a parameter.",
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
]

const pathState = [
  choice({
    id: 'd10-ps-why-pop',
    title: 'Why pop after the call?',
    skills: ['backtracking_state'],
    prompt: 'In a backtracking function that shares one `path` list, why is there a `path.pop()` right after the recursive call?',
    code: `path.append(nums[i])
dfs(i + 1)
path.pop()`,
    options: [
      'To free memory',
      'To undo the choice so the next branch starts from the same path',
      'To return the last item to the caller',
      'Because recursion requires it',
    ],
    answer: 1,
    note: 'Choose, explore, un-choose: path.append(x); dfs(...); path.pop().',
    explanation: 'One list is shared by every call. Without the pop, items from finished branches would leak into sibling branches.',
    important: true,
    signature: 'backtrack:recognize-pop',
  }),
  output({
    id: 'd10-ps-alias-bug',
    title: 'The aliasing bug',
    skills: ['backtracking_state'],
    prompt: 'Predict the output. Look closely at what gets appended to `res`.',
    code: `res = []
path = []

def dfs(i):
    if i == 2:
        res.append(path)
        return
    path.append(i)
    dfs(i + 1)
    path.pop()
    dfs(i + 1)

dfs(0)
print(res)`,
    expectedOutput: `[[], [], [], []]`,
    explanation: 'res holds four references to the same list object. By the end every append has been popped, so all four show the empty list.',
    important: true,
    minutes: 2.5,
    signature: 'trace:backtrack-alias-bug',
  }),
  choice({
    id: 'd10-ps-copy-fix',
    title: 'Fix the aliasing bug',
    skills: ['backtracking_state', 'slicing'],
    prompt: 'Which change makes `res` record each path as it was at the leaf?',
    options: ['res.append(path)', 'res.append(path[:])', 'res = res + path', 'res.extend(path)'],
    answer: 1,
    note: 'Record a snapshot: res.append(path[:]) (or list(path)).',
    explanation: 'path[:] makes a shallow copy, so later appends and pops on path no longer change what was recorded.',
    signature: 'backtrack:recognize-copy',
  }),
  output({
    id: 'd10-ps-copy-trace',
    title: 'Same tree, with a copy',
    skills: ['backtracking_state'],
    prompt: 'Same code as before, but the leaf records `path[:]`. Predict the output.',
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
    explanation: 'Include 0 and 1, then drop 1, then drop 0 and include 1, then nothing. Same order as the immutable version.',
    minutes: 2,
    signature: 'trace:backtrack-copy',
  }),
  fill({
    id: 'd10-ps-fill-subsequences',
    title: 'Fill: choose, explore, un-choose',
    skills: ['backtracking_state', 'string_methods'],
    prompt: 'Fill the two blanks. `pickings(s)` returns every subsequence of `s` as a string.',
    starterCode: `def pickings(s):
    res = []
    path = []
    def dfs(i):
        if i == len(s):
            res.append(''.join(path))
            return
        path.append(s[i])
        dfs(i + 1)
        ____
        dfs(____)
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
    hints: ['Undo the append, then explore the branch that skips s[i].'],
    explanation: "''.join(path) builds a new string, so here no explicit copy is needed.",
    important: true,
    signature: 'backtrack:fill-append-pop',
  }),
  code({
    id: 'd10-ps-dice',
    title: 'Every roll sequence',
    skills: ['backtracking_state', 'range'],
    difficulty: 3,
    minutes: 7,
    prompt: 'Write `rolls(n, sides)` returning every sequence of `n` die rolls (values `1..sides`) as lists, in increasing order (`[1, 1]` before `[1, 2]`). Use one shared `path` with append / recurse / pop, branching with a `for` loop instead of include/exclude.',
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
  code({
    id: 'd10-ps-combos',
    title: 'Groups of exactly k',
    skills: ['backtracking_state', 'range'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 10,
    prompt: 'Write `groups(nums, k)` returning every way to choose `k` items from `nums` (distinct values), ignoring order inside a group. Use a `start` index so each item is only considered after the previous pick, which prevents `[1, 2]` and `[2, 1]` both appearing.',
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
  code({
    id: 'd10-ps-letter-combos',
    title: 'Keypad letter combinations',
    skills: ['backtracking_state', 'dict_lookup'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 10,
    prompt: "Each digit maps to some letters (the mapping is in the starter). Write `spell(digits)` returning every string you get by picking one letter per digit, in order. An empty `digits` gives `[]`.",
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
  code({
    id: 'd10-ps-orderings',
    title: 'Every ordering',
    skills: ['backtracking_state', 'set_membership'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 4,
    minutes: 13,
    prompt: 'Write `orderings(nums)` returning every ordering of the distinct values in `nums`. Track which indexes are already in the path (a `used` list or set) so each value appears once per ordering.',
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
  code({
    id: 'd10-ps-tree-paths',
    title: 'Root-to-leaf paths',
    skills: ['backtracking_state', 'tree_dfs'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 10,
    prompt: 'Write `leaf_paths(root)` returning every root-to-leaf path as a list of values, left subtree paths before right. Use one shared `path` list: append the node, recurse, pop.',
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
  reorder({
    id: 'd10-sub-reorder-loop-style',
    title: 'Rebuild: subsets, loop style',
    skills: ['backtracking_state', 'range'],
    prompt: 'Put the lines in order. This version records the path at **every** call, then extends it with each later item.',
    lines: [
      'def all_groups(nums):',
      '    res = []',
      '    path = []',
      '    def dfs(start):',
      '        res.append(path[:])',
      '        for i in range(start, len(nums)):',
      '            path.append(nums[i])',
      '            dfs(i + 1)',
      '            path.pop()',
      '    dfs(0)',
      '    return res',
    ],
    tests: [
      t.eq('all_groups([1, 2])', '[[], [1], [1, 2], [2]]', { compare: 'sorted-inner' }),
      t.eq('all_groups([])', '[[]]', { compare: 'sorted-inner' }),
    ],
    minutes: 4,
    important: true,
    signature: 'backtrack:reorder-subsets-loop',
  }),
  code({
    id: 'd10-sub-target-subsets',
    title: 'Subsets that hit a sum',
    skills: ['backtracking_state', 'recursion_base_case'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: 'Write `hitting(nums, target)` returning every subset (as a list, in any order) whose values add to `target`. Values are distinct.',
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
    hints: ['Carry the total alongside the shared path.', 'At the leaf, record path[:] only if total == target.'],
    signature: 'backtrack:subsets-filtered',
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
  choice({
    id: 'd10-rec-stairs',
    title: 'Which recurrence?',
    skills: ['recurrence'],
    prompt: 'You climb `n` steps taking 1 or 2 steps at a time. Let `f(n)` be the number of distinct ways. Which is right?',
    options: ['f(n) = f(n - 1) * 2', 'f(n) = f(n - 1) + f(n - 2)', 'f(n) = f(n - 2) + 2', 'f(n) = n * f(n - 1)'],
    answer: 1,
    note: 'Recurrence: write the answer in terms of smaller answers. The last move was a 1-step (from n - 1) or a 2-step (from n - 2).',
    explanation: 'Every way to reach n ends with exactly one of the two moves, and those groups do not overlap, so the counts add.',
    important: true,
    signature: 'recurrence:recognize-stairs',
  }),
  output({
    id: 'd10-rec-fib-calls',
    title: 'How many calls?',
    skills: ['recurrence', 'recursion_return'],
    prompt: 'Predict the output.',
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
    explanation: 'fib(3) is computed twice, fib(2) three times... The call count grows exponentially. Memoization fixes exactly this.',
    minutes: 2.5,
    signature: 'trace:fib-call-count',
  }),
  code({
    id: 'd10-rec-fib-naive',
    title: 'Fibonacci, plain recursion',
    skills: ['recurrence', 'recursion_base_case'],
    difficulty: 1,
    minutes: 3,
    prompt: 'Write `fib(n)` recursively with `fib(0) = 0`, `fib(1) = 1`, and `fib(n) = fib(n - 1) + fib(n - 2)`.',
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
  choice({
    id: 'd10-rec-why-slow',
    title: 'Why is it slow?',
    skills: ['recurrence', 'complexity'],
    prompt: 'Why does the plain recursive `fib(40)` take seconds?',
    options: [
      'Python recursion is slow in general',
      'The same subproblems are recomputed over and over, giving exponential calls',
      'The recursion is too deep',
      'Integer addition is expensive for big numbers',
    ],
    answer: 1,
    explanation: 'Overlapping subproblems: about 2^n calls for only n distinct inputs. Caching each answer once makes it O(n).',
    signature: 'recurrence:recognize-overlap',
  }),
  code({
    id: 'd10-rec-three-steps',
    title: 'Steps of 1, 2 or 3',
    skills: ['recurrence', 'recursion_base_case'],
    difficulty: 2,
    minutes: 4,
    prompt: 'You may climb 1, 2 or 3 steps at a time. Write recursive `ways3(n)` counting the ways to reach exactly step `n`. Use base cases `n == 0` (one way: do nothing) and `n < 0` (no way).',
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
  code({
    id: 'd10-rec-grid-paths',
    title: 'Paths through a grid',
    skills: ['recurrence', 'recursion_base_case'],
    difficulty: 2,
    minutes: 5,
    prompt: 'On a `rows` x `cols` grid you start top-left and may only move right or down. Write recursive `grid_paths(rows, cols)` counting the routes to the bottom-right. A grid with one row or one column has exactly one route.',
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
]

const memo = [
  choice({
    id: 'd10-memo-key',
    title: 'What is the memo key?',
    skills: ['memoization'],
    prompt: 'You memoize `grid_paths(rows, cols)` in a dict. What should the key be?',
    options: ['rows', 'cols', 'the tuple (rows, cols)', 'rows * cols'],
    answer: 2,
    note: 'Memoization: before computing, check the dict; after computing, store. The key is every argument that changes.',
    explanation: 'The key must identify the subproblem exactly. rows * cols collides: (2, 3) and (3, 2) happen to match, but (1, 6) and (2, 3) do not.',
    signature: 'memo:recognize-key',
  }),
  fill({
    id: 'd10-memo-fill-check',
    title: 'Fill: check the cache first',
    skills: ['memoization', 'dict_membership'],
    prompt: 'Fill the blank so a cached answer is returned immediately.',
    starterCode: `memo = {}

def fib(n):
    if n < 2:
        return n
    if ____:
        return memo[n]
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]`,
    solution: `memo = {}

def fib(n):
    if n < 2:
        return n
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]`,
    tests: [t.eq('fib(10)', '55'), t.eq('fib(80)', '23416728348467685')],
    hints: ['Dict membership test.'],
    important: true,
    signature: 'memo:fill-check',
  }),
  fill({
    id: 'd10-memo-fill-store',
    title: 'Fill: store before returning',
    skills: ['memoization'],
    prompt: 'Fill the blank so each answer is saved before it is returned.',
    starterCode: `def ways(n, memo):
    if n <= 1:
        return 1
    if n in memo:
        return memo[n]
    result = ways(n - 1, memo) + ways(n - 2, memo)
    ____
    return result`,
    solution: `def ways(n, memo):
    if n <= 1:
        return 1
    if n in memo:
        return memo[n]
    result = ways(n - 1, memo) + ways(n - 2, memo)
    memo[n] = result
    return result`,
    tests: [t.eq('ways(5, {})', '8'), t.eq('ways(45, {})', '1836311903')],
    hints: ['Assign into the dict.'],
    signature: 'memo:fill-store',
  }),
  output({
    id: 'd10-memo-trace',
    title: 'What ends up in the memo?',
    skills: ['memoization', 'dict_items'],
    prompt: 'Predict the output.',
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
    explanation: 'Base cases are returned directly and never stored, so the memo holds 2 through 6: each computed exactly once.',
    minutes: 2,
    signature: 'trace:memo-contents',
  }),
  code({
    id: 'd10-memo-fib',
    title: 'Memoized Fibonacci',
    skills: ['memoization', 'recurrence'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `fast_fib(n)` (same definition as `fib`) using a dict memo inside the function. It must handle `n = 90` instantly.',
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
  code({
    id: 'd10-memo-grid',
    title: 'Memoized grid paths',
    skills: ['memoization', 'recurrence', 'tuples'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: 'Speed up `grid_paths(rows, cols)` (right/down moves only) with a dict memo keyed by `(rows, cols)`. A 16 x 16 grid must finish instantly.',
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
  choice({
    id: 'd10-memo-cache',
    title: 'functools.cache',
    skills: ['memoization'],
    prompt: 'What does the decorator do here?',
    code: `from functools import cache

@cache
def f(n):
    if n < 2:
        return n
    return f(n - 1) + f(n - 2)`,
    options: [
      'Stores each f(n) result so repeated calls with the same n are not recomputed',
      'Makes f run in a background thread',
      'Limits recursion depth',
      'Stores only the last result',
    ],
    answer: 0,
    note: '`from functools import cache` then `@cache` on the function memoizes it by its arguments (which must be hashable). `lru_cache(maxsize=None)` is the older spelling.',
    explanation: 'It is a dict memo you do not have to write. In an interview, say what it does; some interviewers want the manual dict.',
    signature: 'memo:recognize-functools-cache',
  }),
  code({
    id: 'd10-memo-cache-ways3',
    title: '@cache on 1/2/3 steps',
    skills: ['memoization', 'recurrence'],
    difficulty: 2,
    minutes: 4,
    prompt: 'Write `ways3(n)` (steps of 1, 2 or 3; `ways3(0) = 1`) using `@cache` from `functools`. It must handle `n = 40`.',
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
  reorder({
    id: 'd10-memo-reorder',
    title: 'Rebuild: memoized stair count',
    skills: ['memoization', 'recurrence'],
    prompt: 'Put the lines in order: `count_ways(n)` counts 1/2-step climbs with a dict memo.',
    lines: [
      'def count_ways(n):',
      '    memo = {}',
      '    def go(i):',
      '        if i <= 1:',
      '            return 1',
      '        if i in memo:',
      '            return memo[i]',
      '        memo[i] = go(i - 1) + go(i - 2)',
      '        return memo[i]',
      '    return go(n)',
    ],
    tests: [t.eq('count_ways(5)', '8'), t.eq('count_ways(45)', '1836311903')],
    minutes: 3,
    important: true,
    signature: 'memo:reorder',
  }),
]

const bottomUp = [
  choice({
    id: 'd10-bu-meaning',
    title: 'What does dp[i] mean?',
    skills: ['dp_table'],
    prompt: 'In a bottom-up solution for "ways to climb n steps with 1 or 2 at a time", what should `dp[i]` hold?',
    options: ['The step size used at step i', 'The number of ways to reach step i', 'The total of all ways up to step i', 'Whether step i is reachable'],
    answer: 1,
    note: 'Bottom-up DP: dp = [0] * (n + 1); set the base entries; fill i = 2..n from earlier entries; answer is dp[n].',
    explanation: 'Define dp[i] in words first. Then dp[i] = dp[i - 1] + dp[i - 2] follows straight from the recurrence.',
    signature: 'dp:recognize-meaning',
  }),
  output({
    id: 'd10-bu-trace',
    title: 'Fill the table',
    skills: ['dp_table'],
    prompt: 'Predict the output.',
    code: `n = 6
dp = [0] * (n + 1)
dp[1] = 1
for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]
print(dp)
print(dp[n])`,
    expectedOutput: `[0, 1, 1, 2, 3, 5, 8]
8`,
    explanation: 'Each entry depends only on entries already filled to its left. That order is what makes it "bottom-up".',
    minutes: 2,
    signature: 'trace:dp-fib-table',
  }),
  fill({
    id: 'd10-bu-fill',
    title: 'Fill: the transition',
    skills: ['dp_table', 'recurrence'],
    prompt: 'Fill the blank with the transition for 1/2-step stair climbing.',
    starterCode: `def stairs_table(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        dp[i] = dp[i - 1]
        if i >= 2:
            dp[i] += ____
    return dp[n]`,
    solution: `def stairs_table(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        dp[i] = dp[i - 1]
        if i >= 2:
            dp[i] += dp[i - 2]
    return dp[n]`,
    tests: [t.eq('stairs_table(5)', '8'), t.eq('stairs_table(1)', '1'), t.hidden('stairs_table(10)', '89')],
    hints: ['The ways that end with a 2-step.'],
    important: true,
    signature: 'dp:fill-transition',
  }),
  code({
    id: 'd10-bu-three-steps',
    title: 'Table for 1/2/3 steps',
    skills: ['dp_table', 'recurrence'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `ways3_table(n)` bottom-up with a list: steps of 1, 2 or 3, `ways3_table(0) = 1`. No recursion.',
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
  code({
    id: 'd10-bu-any-steps',
    title: 'Any set of step sizes',
    skills: ['dp_table', 'recurrence'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: 'Generalize: `steps` is a list of allowed step sizes (positive, distinct). Write `ways_with(n, steps)` counting the ways to reach exactly step `n` (order of moves matters).',
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
    hints: ['dp[i] = sum of dp[i - s] for every allowed s that fits.', 'Base: dp[0] = 1.'],
    signature: 'dp:general-steps',
  }),
  code({
    id: 'd10-bu-min-cost',
    title: 'Cheapest climb',
    skills: ['dp_table', 'recurrence'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    minutes: 11,
    prompt: 'Step `i` costs `cost[i]` to stand on. You may start on step 0 or step 1, and from any step move up 1 or 2. The top is just past the last step and costs nothing. Write `cheapest(cost)` returning the minimum total cost to reach the top. Assume `len(cost) >= 2`.',
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
    hints: [
      'Define dp[i] = cheapest total cost to be standing on step i.',
      'You arrive on i from i - 1 or i - 2.',
      'dp[i] = cost[i] + min(dp[i - 1], dp[i - 2]).',
      'The top can be reached from either of the last two steps: min(dp[-1], dp[-2]).',
    ],
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
]

const rolling = [
  choice({
    id: 'd10-roll-why',
    title: 'Why can the list go?',
    skills: ['state_tracking', 'dp_table'],
    prompt: 'In `dp[i] = dp[i - 1] + dp[i - 2]`, why can you replace the whole list with two variables?',
    options: [
      'Because the answer is always small',
      'Because each step only reads the previous two values',
      'Because lists are slow in Python',
      'Because dp[0] is always 1',
    ],
    answer: 1,
    note: 'Rolling state: keep only what the transition reads. prev2, prev1 = prev1, prev1 + prev2.',
    explanation: 'Older entries are never read again, so O(n) space drops to O(1).',
    signature: 'rolling:recognize',
  }),
  output({
    id: 'd10-roll-trace',
    title: 'Two variables marching forward',
    skills: ['state_tracking'],
    prompt: 'Predict the output.',
    code: `a, b = 0, 1
for _ in range(5):
    a, b = b, a + b
    print(a, b)`,
    expectedOutput: `1 1
1 2
2 3
3 5
5 8`,
    explanation: 'The right side is evaluated fully, using the old a and b, before either name is reassigned.',
    important: true,
    minutes: 2,
    signature: 'trace:rolling-pair',
  }),
  output({
    id: 'd10-roll-bug',
    title: 'The two-line bug',
    skills: ['state_tracking'],
    prompt: 'Same idea, but written as two separate assignments. Predict the output.',
    code: `a, b = 0, 1
for _ in range(4):
    a = b
    b = a + b
print(a, b)`,
    expectedOutput: `8 16`,
    explanation: 'After a = b, the old a is gone, so b = a + b doubles b. Use tuple assignment (or a temp variable).',
    minutes: 2,
    signature: 'trace:rolling-bug',
  }),
  fill({
    id: 'd10-roll-fill',
    title: 'Fill: roll the pair',
    skills: ['state_tracking', 'recurrence'],
    prompt: 'Fill the blank. `prev1` is the ways to reach the current step, `prev2` the step before it.',
    starterCode: `def stairs_rolling(n):
    prev2, prev1 = 1, 1
    for _ in range(2, n + 1):
        prev2, prev1 = prev1, ____
    return prev1`,
    solution: `def stairs_rolling(n):
    prev2, prev1 = 1, 1
    for _ in range(2, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1`,
    tests: [t.eq('stairs_rolling(5)', '8'), t.eq('stairs_rolling(1)', '1'), t.hidden('stairs_rolling(45)', '1836311903')],
    hints: ['The new value is the sum of the two you are holding.'],
    important: true,
    signature: 'rolling:fill-pair',
  }),
  code({
    id: 'd10-roll-fib',
    title: 'Fibonacci in O(1) space',
    skills: ['state_tracking', 'recurrence'],
    difficulty: 2,
    minutes: 3,
    prompt: 'Write `fib2(n)` (`fib2(0) = 0`, `fib2(1) = 1`) with a loop and two variables, no list and no recursion.',
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
  choice({
    id: 'd10-roll-robber-recurrence',
    title: 'Take it or skip it',
    skills: ['recurrence', 'state_tracking'],
    prompt: 'You pick numbers from a list but may never pick two neighbours. Let `best[i]` be the largest total using only `nums[0..i]`. Which transition is right?',
    options: [
      'best[i] = best[i - 1] + nums[i]',
      'best[i] = max(best[i - 1], best[i - 2] + nums[i])',
      'best[i] = max(nums[i], nums[i - 1])',
      'best[i] = best[i - 2] + nums[i]',
    ],
    answer: 1,
    note: 'Skip i: keep best[i - 1]. Take i: you must skip i - 1, so best[i - 2] + nums[i]. Take the max.',
    explanation: 'Each index is a two-way decision, like include/exclude, but you keep only the best outcome instead of exploring both trees.',
    important: true,
    signature: 'recurrence:recognize-take-skip',
  }),
  output({
    id: 'd10-roll-robber-trace',
    title: 'Trace the take-or-skip table',
    skills: ['dp_table', 'recurrence'],
    prompt: 'Predict the output.',
    code: `nums = [2, 7, 9, 3, 1]
best = [0] * len(nums)
best[0] = nums[0]
best[1] = max(nums[0], nums[1])
for i in range(2, len(nums)):
    best[i] = max(best[i - 1], best[i - 2] + nums[i])
print(best)`,
    expectedOutput: `[2, 7, 11, 11, 12]`,
    explanation: 'At index 2: skip gives 7, take gives 2 + 9 = 11. At index 4: 11 vs 11 + 1 = 12.',
    minutes: 2.5,
    signature: 'trace:take-skip-table',
  }),
  code({
    id: 'd10-roll-robber-memo',
    title: 'Take or skip, top-down',
    skills: ['memoization', 'recurrence'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 9,
    prompt: 'Write `best_no_neighbours(nums)` top-down: `go(i)` is the best total from index `i` to the end, either skipping `i` (`go(i + 1)`) or taking it (`nums[i] + go(i + 2)`). Memoize with a dict. Values are non-negative.',
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
  choice({
    id: 'd10-cold-copy',
    title: 'Cold: record the path',
    skills: ['backtracking_state'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'At a leaf of a backtracking function sharing `path`, which line records it correctly?',
    options: ['res.append(path)', 'res.append(path[:])', 'res += path', 'res.append(path.pop())'],
    answer: 1,
    signature: 'cold:backtrack-copy',
  }),
  code({
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
  code({
    id: 'd10-cold-pieces',
    title: 'Cold: pieces of length 1 and 3',
    skills: ['recurrence', 'state_tracking', 'dp_table'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
    prompt: 'A strip of length `n` is covered left to right with pieces of length 1 or 3. Write `cover(n)` counting the ways (`cover(0) = 1`). Use bottom-up DP or rolling variables, not plain recursion.',
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
  code({
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
  choice({
    id: 'd10-cold-top-down-vs-bottom-up',
    title: 'Cold: top-down vs bottom-up',
    skills: ['memoization', 'dp_table'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Which statement is true?',
    options: [
      'Memoization only works for Fibonacci',
      'Top-down recursion + memo and a bottom-up table compute the same subproblems; bottom-up avoids recursion depth',
      'Bottom-up DP is always exponential',
      'A memo dict must be global',
    ],
    answer: 1,
    explanation: 'Both solve each subproblem once. Top-down is often easier to write from the recurrence; bottom-up avoids recursion limits and can roll its state.',
    signature: 'cold:topdown-vs-bottomup',
  }),
]

export const day: DayModule = {
  date: '2026-10-10',
  short: 'Backtracking',
  title: 'Backtracking + intro DP',
  focus: 'Make choose / explore / un-choose automatic, then turn a recurrence into memo, a table and two rolling variables.',
  sections: [
    { id: 'd10-warmup', title: 'Warm-up', summary: 'Cold reps on sorting, heaps, intervals, trees, grids and sets.', exercises: warmup },
    { id: 'd10-decisions', title: 'Decision trees', summary: 'Include / exclude recursion with the state passed as parameters.', exercises: decisions },
    { id: 'd10-path', title: 'Path state', summary: 'One shared path: append, recurse, pop, and copy with path[:].', exercises: pathState },
    { id: 'd10-subsets', title: 'Subsets', summary: 'Two subset styles, then the subsets capstone.', exercises: subsets },
    { id: 'd10-recurrence', title: 'Recurrences', summary: 'Answers in terms of smaller answers, and why plain recursion is slow.', exercises: recurrence },
    { id: 'd10-memo', title: 'Memoization', summary: 'Check, compute, store with a dict; functools.cache.', exercises: memo },
    { id: 'd10-bottom-up', title: 'Bottom-up DP', summary: 'A dp list filled left to right, then climbing stairs.', exercises: bottomUp },
    { id: 'd10-rolling', title: 'Rolling state', summary: 'Two variables instead of a list, then house robber.', exercises: rolling },
    { id: 'd10-cold', title: 'Cold reps', summary: 'From memory, no scaffolding.', exercises: cold },
  ],
  capstones: ['subsets', 'climbing-stairs', 'house-robber'],
}
