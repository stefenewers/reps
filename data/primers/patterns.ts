import type { Primer } from '@/data/primers/types'

/** The algorithm patterns: pointers, windows, stacks, search, lists, trees, BFS, graphs, heaps, backtracking, DP. */
export const PATTERN_PRIMERS: Primer[] = [
  {
    id: 'two-pointers',
    title: 'Two pointers',
    skills: ['two_pointer', 'pointer_update'],
    what: 'Instead of comparing every pair (O(n²)), keep two indexes, often `i` and `j`, and move them through the data in **one pass**. Each step you compare what the pointers see and advance **exactly one** of them, chosen by that comparison. They either start at both ends and walk inward, or both start at the front.',
    model: 'Two fingers on the data; every comparison tells you which finger can safely move on.',
    syntax: [
      { code: 'left, right = 0, len(nums) - 1', note: 'Opposite ends, walking toward each other.' },
      { code: 'while left < right:', note: 'Stop when they meet (or cross).' },
      { code: 'i, j = 0, 0', note: 'Or one pointer per list, both from the front.' },
      { code: 'while i < len(a) and j < len(b):', note: 'Stop as soon as either list runs out.' },
      { code: 'if a[i] < b[j]:\n    i += 1\nelse:\n    j += 1', note: 'Move the one that is behind. One move per step.' },
    ],
    example: {
      code: `# Values that appear in BOTH sorted lists
a = [1, 3, 4, 7, 9]
b = [2, 3, 7, 8, 9]
i, j = 0, 0
common = []
while i < len(a) and j < len(b):
    if a[i] == b[j]:
        common.append(a[i])
        i += 1
        j += 1
    elif a[i] < b[j]:
        i += 1          # a is behind: move it
    else:
        j += 1          # b is behind: move it
print(common)`,
      output: `[3, 7, 9]`,
    },
    gotchas: [
      'Forgetting to move a pointer in some branch gives an infinite loop. Every branch must move at least one.',
      '`right = len(nums)` is one past the end; `nums[right]` crashes. Start at `len(nums) - 1`.',
      '`while left <= right` lets both point at the same element; use `<` when you need two different items.',
      'Most two-pointer tricks rely on the data being **sorted**. Sort first if it is not (and if order does not matter).',
    ],
  },
  {
    id: 'running-state',
    title: 'Running state',
    skills: ['state_tracking'],
    what: 'Many "best / longest / smallest" questions can be answered in **one pass** by keeping a few variables that summarise everything seen so far, e.g. `best`, `current`, `lowest`. Each element updates them; at the end they hold the answer.',
    model: 'Walk the line once with a notepad, updating a couple of numbers as you go, never looking back.',
    syntax: [
      { code: "best = float('-inf')", note: 'Start below anything real (or use the first element).' },
      { code: 'for x in nums:', note: 'One pass.' },
      { code: '    best = max(best, x)', note: 'Update the best-so-far.' },
      { code: '    current = current + 1 if ok else 0', note: 'A streak: extend it or reset it.' },
      { code: '    best_run = max(best_run, current)', note: 'Remember the longest streak ever seen.' },
    ],
    example: {
      code: `# Longest streak of days that were warmer than the day before
temps = [10, 12, 15, 11, 13, 14, 16, 9]
current = 0
best_run = 0
for i in range(1, len(temps)):
    if temps[i] > temps[i - 1]:
        current += 1
    else:
        current = 0
    best_run = max(best_run, current)
print(best_run)
print(max(temps), temps.index(max(temps)))`,
      output: `3
16 6`,
    },
    gotchas: [
      'Starting `best = 0` breaks when every value is negative. Use `float(\'-inf\')` or the first element.',
      'Update the best **inside** the loop, not only after it, or a streak that ends early is lost.',
      'Order of updates matters: if the answer depends on the *previous* state, read it before you overwrite it.',
    ],
  },
  {
    id: 'sliding-window',
    title: 'Sliding window',
    skills: ['sliding_window', 'window_state'],
    what: 'A **window** is a stretch `nums[left:right+1]` of consecutive items. Move `right` forward one step at a time to grow it; whenever the window breaks your rule, move `left` forward to shrink it until it is valid again. Keep a dict or set of **what is inside** and update it on both edges, so you never rescan the window.',
    model: 'A caterpillar: the head always steps forward, the tail catches up only when the body breaks the rule.',
    syntax: [
      { code: 'left = 0', note: 'The tail of the window.' },
      { code: 'for right in range(len(items)):', note: 'The head: grows one step each loop.' },
      { code: '    inside[x] = inside.get(x, 0) + 1', note: 'Add the new right item to the window state.' },
      { code: '    while window_is_invalid:', note: '`while`, not `if`: may need several shrinks.' },
      { code: '        inside[items[left]] -= 1\n        left += 1', note: 'Remove the left item, then move the tail.' },
      { code: '    best = max(best, right - left + 1)', note: 'Window is valid here: measure it.' },
    ],
    example: {
      code: `# Longest run of songs where no artist plays more than twice
songs = ['A', 'B', 'A', 'C', 'A', 'B', 'B', 'C']
inside = {}
left = 0
best = 0
for right in range(len(songs)):
    artist = songs[right]
    inside[artist] = inside.get(artist, 0) + 1
    while inside[artist] > 2:
        inside[songs[left]] -= 1
        left += 1
    best = max(best, right - left + 1)
print(best)
print(left, inside)`,
      output: `6
2 {'A': 2, 'B': 2, 'C': 2}`,
    },
    gotchas: [
      'Window length is `right - left + 1`, not `right - left`.',
      'Using `if` instead of `while` to shrink leaves the window invalid when one shrink is not enough.',
      'Remove `items[left]` from the state **before** doing `left += 1`, or you remove the wrong item.',
      'Measure the answer only after the window is valid again.',
    ],
  },
  {
    id: 'stacks',
    title: 'Stacks',
    skills: ['stack_push_pop', 'matching_pairs'],
    what: 'A **stack** is last-in, first-out: you only touch the top. In Python a plain list is a stack: `append` pushes on the top, `pop()` takes the top off. It shines when the most recent unfinished thing must be closed first, like nested tags: map each **closer to its opener** and check the top of the stack.',
    model: 'A pile of plates: you add and remove only at the top, so the newest plate leaves first.',
    syntax: [
      { code: 'stack = []', note: 'Empty stack.' },
      { code: 'stack.append(x)', note: 'Push onto the top.' },
      { code: 'top = stack.pop()', note: 'Remove and return the top. Crashes on an empty list.' },
      { code: 'stack[-1]', note: 'Peek at the top without removing it.' },
      { code: "opener_for = {'</b>': '<b>'}", note: 'Closer → the opener it must match.' },
      { code: 'if not stack or stack[-1] != opener_for[t]:', note: 'Nothing open, or the wrong thing open: mismatch.' },
    ],
    example: {
      code: `opener_for = {'</b>': '<b>', '</i>': '<i>'}

def tags_ok(tags):
    stack = []
    for t in tags:
        if t in opener_for:                  # a closer
            if not stack or stack[-1] != opener_for[t]:
                return False
            stack.pop()
        else:                                # an opener
            stack.append(t)
    return len(stack) == 0                   # nothing left open

print(tags_ok(['<b>', '<i>', '</i>', '</b>']))
print(tags_ok(['<b>', '<i>', '</b>', '</i>']))
print(tags_ok(['<b>', '<i>', '</i>']))`,
      output: `True
False
False`,
    },
    gotchas: [
      '`stack.pop()` or `stack[-1]` on an empty list crashes. Check `if stack` (or `not stack`) first.',
      'Forgetting the final check: leftover openers mean something was never closed.',
      '`stack.pop(0)` removes the **bottom**, not the top, and is slow.',
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary search',
    skills: ['binary_search', 'mid_calc', 'search_invariant'],
    what: 'When the data is **sorted** (or answers go "no, no, no, yes, yes"), look at the middle and throw away the half that cannot hold the answer. Each step halves the range, so even a million items take about 20 steps: **O(log n)**. You track the range with `lo` and `hi` and know exactly what is true about them on every loop.',
    model: 'Guessing a number between 1 and 100: guess the middle, hear "higher" or "lower", and half the options vanish.',
    syntax: [
      { code: 'lo, hi = 0, len(nums) - 1', note: 'Invariant: if the answer exists, it is in `lo..hi` (inclusive).' },
      { code: 'while lo <= hi:', note: '`<=`: a range of one item still needs checking.' },
      { code: 'mid = (lo + hi) // 2', note: 'Integer division: the middle index, rounded down.' },
      { code: 'lo = mid + 1', note: 'Answer is to the right; `mid` is ruled out, so skip it.' },
      { code: 'hi = mid - 1', note: 'Answer is to the left; skip `mid` too.' },
      { code: '# loop ends: lo > hi', note: 'Range is empty; `lo` is where the value would be inserted.' },
    ],
    example: {
      code: `secret = 70
lo, hi = 1, 100
guesses = 0
while lo <= hi:
    mid = (lo + hi) // 2
    guesses += 1
    print('guess', mid)
    if mid == secret:
        break
    elif mid < secret:
        lo = mid + 1      # too low: drop mid and everything below
    else:
        hi = mid - 1      # too high: drop mid and everything above
print(guesses, 'guesses')`,
      output: `guess 50
guess 75
guess 62
guess 68
guess 71
guess 69
guess 70
7 guesses`,
    },
    gotchas: [
      '`lo = mid` (instead of `mid + 1`) can loop forever when `lo` and `hi` are next to each other.',
      '`while lo < hi` with inclusive bounds skips checking the last remaining item. Pick one style and keep its rules.',
      '`mid = (lo + hi) / 2` gives a float in Python 3. Use `//`.',
      'It only works if the data is sorted (or the yes/no answer flips just once).',
    ],
  },
  {
    id: 'linked-lists',
    title: 'Linked lists',
    skills: ['listnode', 'linked_list_traversal', 'linked_list_reassignment', 'dummy_node'],
    what: 'A **linked list** is a chain of nodes; each `ListNode` holds a `val` and a `next` pointing to the following node, and `None` marks the end. There are no indexes: you walk it with `node = node.next`. Changing the list means **rewiring `.next`**, and a throwaway **dummy** node at the front saves you from special-casing the head.',
    model: 'A treasure hunt: each clue holds a value and tells you where the next clue is; nothing points backwards.',
    syntax: [
      { code: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next', note: 'The node. Reps provide this; plain Python needs it defined.' },
      { code: 'node = head\nwhile node:\n    node = node.next', note: 'Walk to the end; stops when `node` is `None`.' },
      { code: 'nxt = node.next', note: 'Save the rest of the chain **before** rewiring.' },
      { code: 'node.next = new_node', note: 'Rewire: the old link is gone after this line.' },
      { code: 'dummy = ListNode()\ntail = dummy', note: 'Build a list by attaching to `tail`; the real head is `dummy.next`.' },
    ],
    example: {
      code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def show(head):
    out = []
    node = head
    while node:
        out.append(node.val)
        node = node.next
    print(out)

dummy = ListNode()            # build 5 -> 6 -> 8 with a dummy
tail = dummy
for v in [5, 6, 8]:
    tail.next = ListNode(v)
    tail = tail.next
head = dummy.next
show(head)

node = head.next              # the 6
nxt = node.next               # save the 8 first
node.next = ListNode(7)       # 6 -> 7
node.next.next = nxt          # 7 -> 8
show(head)`,
      output: `[5, 6, 8]
[5, 6, 7, 8]`,
    },
    gotchas: [
      'Overwriting `node.next` before saving it loses the rest of the list forever.',
      'Walking with `head = head.next` loses the start. Walk with a separate variable like `node`.',
      'Returning `dummy` instead of `dummy.next` puts a fake `0` at the front.',
      '`node.next.val` crashes when `node.next` is `None`. Check before you reach two steps ahead.',
    ],
  },
  {
    id: 'recursion',
    title: 'Recursion',
    skills: ['recursion_base_case', 'recursion_return'],
    what: 'A **recursive** function solves a problem by calling itself on a *smaller* version of it. It needs a **base case**, the smallest input it answers directly, and it must **return** a value built from the smaller call\'s result.',
    model: 'Trust that the call on the smaller input already works; your job is just one step plus the stopping point.',
    syntax: [
      { code: 'def f(n):', note: 'One function, calling itself.' },
      { code: '    if n == 0:\n        return 0', note: 'Base case first: stops the chain of calls.' },
      { code: '    rest = f(n - 1)', note: 'Recurse on something strictly smaller.' },
      { code: '    return n + rest', note: 'Combine your part with the smaller answer, and **return** it.' },
    ],
    example: {
      code: `def digit_sum(n):
    if n < 10:                 # base case: one digit
        return n
    return n % 10 + digit_sum(n // 10)

def count_down(n):
    if n == 0:
        return ['go']
    return [n] + count_down(n - 1)

print(digit_sum(4096))         # 6 + digit_sum(409) ...
print(count_down(3))`,
      output: `19
[3, 2, 1, 'go']`,
    },
    gotchas: [
      'No base case (or one that is never reached) means `RecursionError: maximum recursion depth exceeded`.',
      'Calling `f(n - 1)` without `return`ing anything makes the caller get `None`.',
      '`print` inside the function is not a return value. The caller only sees what you `return`.',
      'Each call must move toward the base case: `f(n)` calling `f(n)` never ends.',
    ],
  },
  {
    id: 'trees-dfs',
    title: 'Binary trees and DFS',
    skills: ['treenode', 'tree_dfs'],
    what: 'A **binary tree** is built from `TreeNode`s, each with a `val` and up to two children, `left` and `right` (`None` when missing). **Depth-first search** handles a node by recursing into its left subtree and its right subtree, with `None` as the base case. Almost every tree question is "what do I return for `None`, and how do I combine left and right?"',
    model: 'Ask each child for its subtree\'s answer, then combine the two answers with your own value.',
    syntax: [
      { code: 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right', note: 'Reps provide this; plain Python needs it defined.' },
      { code: 'def dfs(node):', note: 'One call per node.' },
      { code: '    if node is None:\n        return 0', note: 'Base case: the empty tree.' },
      { code: '    a = dfs(node.left)\n    b = dfs(node.right)', note: 'Answers for each subtree.' },
      { code: '    return node.val + a + b', note: 'Combine them into this subtree\'s answer.' },
    ],
    example: {
      code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#        4
#       / \\
#      2   9
#     /
#    7
root = TreeNode(4, TreeNode(2, TreeNode(7)), TreeNode(9))

def total(node):
    if node is None:
        return 0
    return node.val + total(node.left) + total(node.right)

def preorder(node, out):
    if node is None:
        return
    out.append(node.val)
    preorder(node.left, out)
    preorder(node.right, out)

print(total(root))
order = []
preorder(root, order)
print(order)`,
      output: `22
[4, 2, 7, 9]`,
    },
    gotchas: [
      'Reading `node.val` before checking `node is None` crashes on missing children.',
      'Recursing into only `left` (or only `right`) silently skips half the tree.',
      'Forgetting to `return` the combined value: the parent gets `None`.',
      'The base case for `None` usually returns the "neutral" value: `0` for sums, `True` for "all ok" checks.',
    ],
  },
  {
    id: 'deque-bfs',
    title: 'Queues and BFS',
    skills: ['queue_deque', 'bfs', 'bfs_levels'],
    what: 'A **queue** is first-in, first-out; in Python use `collections.deque`, which adds on the right and removes from the left in O(1). **Breadth-first search** uses one to explore outward in rings: everything 1 step away, then 2, and so on. Snapshot `len(queue)` to handle **one level** at a time, which gives you the step count for free.',
    model: 'Ripples on a pond: each ring finishes before the next, wider one starts.',
    syntax: [
      { code: 'from collections import deque', note: 'Import once at the top.' },
      { code: 'queue = deque([start])\nseen = {start}', note: 'Mark the start as seen right away.' },
      { code: 'node = queue.popleft()', note: 'Take from the front (FIFO).' },
      { code: 'if nxt not in seen:\n    seen.add(nxt)\n    queue.append(nxt)', note: 'Mark visited **when enqueuing**, not when popping.' },
      { code: 'for _ in range(len(queue)):', note: 'Process exactly the nodes of the current level.' },
    ],
    example: {
      code: `from collections import deque

# Fewest moves from 3 to 10 if each move is +1 or *2
def fewest_moves(start, goal):
    queue = deque([start])
    seen = {start}
    steps = 0
    while queue:
        level = []
        for _ in range(len(queue)):    # one ring at a time
            x = queue.popleft()
            if x == goal:
                return steps
            level.append(x)
            for nxt in (x + 1, x * 2):
                if nxt <= goal and nxt not in seen:
                    seen.add(nxt)      # mark when enqueuing
                    queue.append(nxt)
        print(steps, level)
        steps += 1
    return -1

print('fewest moves:', fewest_moves(3, 10))`,
      output: `0 [3]
1 [4, 6]
2 [5, 8, 7]
fewest moves: 3`,
    },
    gotchas: [
      '`list.pop(0)` works but is O(n) per pop. Use `deque.popleft()`.',
      'Marking visited only when popping lets the same node be queued many times.',
      'Reading `len(queue)` inside the loop condition instead of snapshotting it mixes levels together.',
      'BFS finds the fewest *steps*; DFS does not.',
    ],
  },
  {
    id: 'grids',
    title: 'Grids',
    skills: ['grid_nested', 'grid_neighbors', 'visited_set'],
    what: 'A **grid** is a list of rows, so a cell is `grid[r][c]` (row first, then column). To move around, loop over a list of **directions** and **bounds-check** each neighbor before touching it. A **visited set** of `(r, c)` tuples stops you from walking in circles.',
    model: 'A spreadsheet: row number, then column number, and four doors out of every cell.',
    syntax: [
      { code: 'rows, cols = len(grid), len(grid[0])', note: 'Height, then width.' },
      { code: 'directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]', note: 'Down, up, right, left.' },
      { code: 'for dr, dc in directions:\n    nr, nc = r + dr, c + dc', note: 'The neighbor\'s coordinates.' },
      { code: 'if 0 <= nr < rows and 0 <= nc < cols:', note: 'Bounds check **before** `grid[nr][nc]`.' },
      { code: 'seen = set()\nseen.add((r, c))', note: 'Store cells as tuples.' },
    ],
    example: {
      code: `grid = ['aab',
        'bab',
        'aaa']
rows, cols = len(grid), len(grid[0])
directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]

# Which cells touch (0, 0) through a chain of 'a's?
seen = {(0, 0)}
stack = [(0, 0)]
while stack:
    r, c = stack.pop()
    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            if grid[nr][nc] == 'a' and (nr, nc) not in seen:
                seen.add((nr, nc))
                stack.append((nr, nc))
print(len(seen))
print(sorted(seen))`,
      output: `6
[(0, 0), (0, 1), (1, 1), (2, 0), (2, 1), (2, 2)]`,
    },
    gotchas: [
      '`grid[c][r]` (column first) is a silent bug on square grids and a crash on others.',
      'Bounds-check before indexing: `grid[-1][c]` does not crash in Python, it quietly wraps to the last row.',
      'Mark a cell visited when you push it, not when you pop it, or it gets pushed twice.',
      '`len(grid[0])` crashes on an empty grid; check `if not grid` first.',
    ],
  },
  {
    id: 'graphs',
    title: 'Graphs',
    skills: ['graph_adjacency', 'graph_dfs', 'graph_bfs', 'connected_components'],
    what: 'A **graph** is nodes joined by edges. You usually get a list of edges and turn it into an **adjacency list**: a dict from each node to the list of its neighbors (both directions if the edges are undirected). Walk it with DFS (stack or recursion) or BFS (queue), always with a **visited set**. Starting a fresh walk from every node not yet visited counts the **connected components**.',
    model: 'A map of towns and roads: the dict answers "where can I drive from here?", and each fresh walk finds one separate island of towns.',
    syntax: [
      { code: 'graph = {}', note: 'node → list of neighbors.' },
      { code: 'for a, b in edges:\n    graph.setdefault(a, []).append(b)\n    graph.setdefault(b, []).append(a)', note: 'Undirected: add both directions.' },
      { code: 'def dfs(node):\n    seen.add(node)\n    for n in graph.get(node, []):\n        if n not in seen:\n            dfs(n)', note: 'Recursive DFS. `.get` covers nodes with no edges.' },
      { code: 'queue = deque([start])', note: 'BFS: same idea with a queue and `popleft()`.' },
      { code: 'for node in all_nodes:\n    if node not in seen:\n        groups += 1\n        dfs(node)', note: 'Each new walk = one more component.' },
    ],
    example: {
      code: `edges = [('ash', 'bay'), ('bay', 'cove'), ('dale', 'elm')]
towns = ['ash', 'bay', 'cove', 'dale', 'elm', 'fir']

graph = {}
for a, b in edges:
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)
print(graph['bay'])

seen = set()
def dfs(town, group):
    seen.add(town)
    group.append(town)
    for n in graph.get(town, []):
        if n not in seen:
            dfs(n, group)

for t in towns:
    if t not in seen:
        group = []
        dfs(t, group)
        print(group)`,
      output: `['ash', 'cove']
['ash', 'bay', 'cove']
['dale', 'elm']
['fir']`,
    },
    gotchas: [
      'For undirected edges, adding only `a → b` makes some nodes unreachable from the other side.',
      'Nodes with no edges never appear in the dict: loop over the full node list, and use `graph.get(n, [])`.',
      'Without a visited set, any loop in the graph means infinite recursion.',
      'One shared `seen` set across all walks; a fresh set per walk counts the same group twice.',
    ],
  },
  {
    id: 'cycle-detection',
    title: 'Cycle detection',
    skills: ['cycle_detection'],
    what: 'In a **directed** graph (A depends on B), a cycle means something depends on itself. During DFS give each node one of three states: **unvisited**, **visiting** (on the current path), or **done**. Reaching a node that is still *visiting* means you walked in a circle. A node that is *done* was already proven safe.',
    model: 'Leave breadcrumbs as you walk down a path and pick them up when you back out; stepping on your own breadcrumb means a loop.',
    syntax: [
      { code: 'state = {}', note: 'Missing = unvisited; 1 = visiting; 2 = done.' },
      { code: 'if state.get(node) == 1:\n    return True', note: 'Back on the current path: cycle.' },
      { code: 'if state.get(node) == 2:\n    return False', note: 'Already fully explored: safe, skip it.' },
      { code: 'state[node] = 1', note: 'Mark visiting before exploring neighbors.' },
      { code: 'state[node] = 2', note: 'Mark done after all neighbors finished.' },
    ],
    example: {
      code: `def has_cycle(graph):
    state = {}                      # 1 = visiting, 2 = done
    def visit(node):
        if state.get(node) == 1:
            return True
        if state.get(node) == 2:
            return False
        state[node] = 1
        for n in graph.get(node, []):
            if visit(n):
                return True
        state[node] = 2
        return False
    for node in graph:
        if visit(node):
            return True
    return False

# Spreadsheet cells: A1 uses B1, and so on
ok = {'A1': ['B1', 'C1'], 'B1': ['C1'], 'C1': []}
loop = {'A1': ['B1'], 'B1': ['C1'], 'C1': ['A1']}
print(has_cycle(ok))
print(has_cycle(loop))`,
      output: `False
True`,
    },
    gotchas: [
      'A plain `seen` set is not enough for directed graphs: in `ok` above, `C1` is reached twice with no cycle.',
      'Forgetting `state[node] = 2` at the end makes every revisit look like a cycle.',
      'Start a walk from **every** node, not just one: a cycle may be in a part you never reached.',
    ],
  },
  {
    id: 'heaps',
    title: 'Heaps',
    skills: ['heap_push_pop', 'top_k'],
    what: 'A **heap** keeps the *smallest* item instantly available at `heap[0]`; push and pop cost O(log n). Python\'s `heapq` turns a plain list into a **min-heap**. To keep the **k largest** of a stream, hold a heap of size k and pop the smallest whenever it grows past k: whatever survives is the top k.',
    model: 'A bouncer at a k-person club: when it is over capacity, the weakest member is thrown out.',
    syntax: [
      { code: 'import heapq', note: 'Functions that work on a normal list.' },
      { code: 'heapq.heappush(h, x)', note: 'Add `x`, keeping heap order.' },
      { code: 'smallest = heapq.heappop(h)', note: 'Remove and return the smallest.' },
      { code: 'h[0]', note: 'Peek at the smallest without removing it.' },
      { code: 'if len(h) > k:\n    heapq.heappop(h)', note: 'Top-k: drop the smallest once over size k.' },
      { code: 'heapq.heappush(h, -x)', note: 'Max-heap trick: store negatives.' },
    ],
    example: {
      code: `import heapq

h = []
for x in [5, 1, 8, 3]:
    heapq.heappush(h, x)
print(h[0])
print(heapq.heappop(h), heapq.heappop(h))

# Keep the 3 longest jumps seen so far
best = []
for jump in [4.1, 6.3, 5.0, 7.2, 3.9, 6.8]:
    heapq.heappush(best, jump)
    if len(best) > 3:
        heapq.heappop(best)          # throw out the shortest
print(sorted(best, reverse=True))
print(best[0])                       # the weakest of the top 3`,
      output: `1
1 3
[7.2, 6.8, 6.3]
6.3`,
    },
    gotchas: [
      '`heapq` is a **min**-heap only. For "biggest first", push `-x` and negate when you pop.',
      'The heap list is not sorted: only `h[0]` is guaranteed. Use `sorted(h)` for an ordered view.',
      'For top-k largest, use a **min**-heap of size k (pop the small ones), not a max-heap.',
      'Pushing tuples compares the first item, then the second on ties: `(priority, name)`.',
    ],
  },
  {
    id: 'intervals',
    title: 'Intervals',
    skills: ['interval_overlap'],
    what: 'An **interval** is a `[start, end]` pair, like a booking. **Sort by start** and each interval only has to be compared with the one before it: they overlap exactly when `next.start <= current.end`. In general, two intervals overlap when `max(starts) <= min(ends)`.',
    model: 'Line the bookings up by start time; a clash can only happen with whatever is still running when the next one begins.',
    syntax: [
      { code: 'spans.sort()', note: 'Lists of pairs sort by start (then end).' },
      { code: 'spans.sort(key=lambda s: s[0])', note: 'The same, said explicitly.' },
      { code: 'prev, cur = spans[i - 1], spans[i]', note: 'Compare neighbors after sorting.' },
      { code: 'if cur[0] <= prev[1]:', note: 'Starts before the previous one ends: overlap.' },
      { code: 'max(a[0], b[0]) <= min(a[1], b[1])', note: 'Overlap test for any two intervals.' },
    ],
    example: {
      code: `def overlaps(a, b):
    return max(a[0], b[0]) <= min(a[1], b[1])

print(overlaps([1, 4], [3, 6]))
print(overlaps([1, 4], [5, 6]))

# Which bookings clash with the one just before them?
rooms = [[9, 10], [14, 16], [9, 12], [12, 13]]
rooms.sort()
print(rooms)
for i in range(1, len(rooms)):
    prev, cur = rooms[i - 1], rooms[i]
    if cur[0] <= prev[1]:
        print('clash', prev, cur)`,
      output: `True
False
[[9, 10], [9, 12], [12, 13], [14, 16]]
clash [9, 10] [9, 12]
clash [9, 12] [12, 13]`,
    },
    gotchas: [
      'Comparing neighbors only works **after sorting** by start.',
      '`<=` vs `<`: does `[9, 12]` clash with `[12, 13]`? Ask whether touching ends count.',
      'After sorting, a long interval can overlap several later ones; comparing only adjacent pairs can miss `[1, 10]` vs `[3, 4]` vs `[5, 6]` (track the furthest end so far).',
    ],
  },
  {
    id: 'backtracking',
    title: 'Backtracking',
    skills: ['backtracking_state'],
    what: '**Backtracking** builds every possible answer one choice at a time. Keep a `path` of choices so far: **choose** (append), **recurse** to make the next choice, then **un-choose** (pop) so the path is clean for the next option. When the path is complete, save a **copy** of it.',
    model: 'Exploring a maze with a ball of string: go down a corridor, and wind the string back before trying the next one.',
    syntax: [
      { code: 'path, results = [], []', note: 'Current choices, and finished answers.' },
      { code: 'if len(path) == n:\n    results.append(path[:])\n    return', note: 'Complete: save a **copy**.' },
      { code: 'for option in options:', note: 'Try each choice at this step.' },
      { code: '    path.append(option)', note: 'Choose.' },
      { code: '    explore(i + 1)', note: 'Recurse to the next decision.' },
      { code: '    path.pop()', note: 'Un-choose, so the next option starts clean.' },
    ],
    example: {
      code: `# Every word you can make taking one letter from each slot
slots = [['b', 'c'], ['a', 'o'], ['t']]
path = []
words = []

def build(i):
    if i == len(slots):
        words.append(''.join(path))
        return
    for letter in slots[i]:
        path.append(letter)     # choose
        build(i + 1)            # explore
        path.pop()              # un-choose

build(0)
print(words)
print(path)                     # empty again afterwards`,
      output: `['bat', 'bot', 'cat', 'cot']
[]`,
    },
    gotchas: [
      '`results.append(path)` saves the *same* list every time; it ends up empty. Use `path[:]` (or `\'\'.join(path)`).',
      'Forgetting `path.pop()` leaves old choices in the path, so answers grow too long.',
      'The pop must undo exactly what the append did, at the same level of the loop.',
    ],
  },
  {
    id: 'memo-dp',
    title: 'Memoization and DP',
    skills: ['recurrence', 'memoization', 'dp_table'],
    what: 'Dynamic programming starts with a **recurrence**: write the answer for `n` in terms of answers for smaller inputs. Plain recursion recomputes the same small answers over and over, so either **memoize** (cache each result in a dict the first time) or fill a **table** bottom-up, where `dp[i]` is built from entries already filled.',
    model: 'Never solve the same small problem twice: write each answer down, and look it up next time.',
    syntax: [
      { code: '# t(n) = t(n-1) + t(n-2) + t(n-3)', note: 'The recurrence, plus base cases for the smallest `n`.' },
      { code: 'memo = {}', note: 'n → answer, filled as you go.' },
      { code: 'if n in memo:\n    return memo[n]', note: 'Already solved: reuse it.' },
      { code: 'memo[n] = answer\nreturn answer', note: 'Store before returning.' },
      { code: 'from functools import cache\n@cache\ndef t(n): ...', note: 'The same caching, done for you.' },
      { code: 'dp = [0] * (n + 1)\nfor i in range(3, n + 1):\n    dp[i] = dp[i-1] + dp[i-2] + dp[i-3]', note: 'Bottom-up: earlier entries are always ready.' },
    ],
    example: {
      code: `# "Tribonacci": each number is the sum of the three before it
calls = 0
memo = {}
def trib(n):
    global calls
    calls += 1
    if n < 3:
        return [0, 0, 1][n]          # base cases
    if n in memo:
        return memo[n]
    memo[n] = trib(n - 1) + trib(n - 2) + trib(n - 3)
    return memo[n]

print(trib(20), calls)

dp = [0] * 21
dp[2] = 1
for i in range(3, 21):
    dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]
print(dp[20])
print(dp[:8])`,
      output: `35890 55
35890
[0, 0, 1, 1, 2, 4, 7, 13]`,
    },
    gotchas: [
      'Wrong or missing base cases poison every answer built on top of them.',
      'Check the memo **before** recursing, and store into it **before** returning.',
      'A mutable default like `def f(n, memo={})` is shared between separate calls; fine for one problem, surprising across tests.',
      'The table needs `n + 1` slots to have a `dp[n]`.',
    ],
  },
]
