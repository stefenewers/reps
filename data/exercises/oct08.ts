import type { DayModule } from '@/lib/types'
import { capstone, choice, code, explain, fill, output, reorder, t } from './build'

/**
 * October 8: Graphs.
 * edge list → adjacency list → graph DFS (recursive + stack) → graph BFS
 * → visited reasoning → Path Exists → components → Provinces
 * → directed cycles (three-state DFS) → Course Schedule.
 */

const warmup = {
  id: 'o8-warmup',
  title: 'Warm-up',
  summary: 'Cold reps on grids, level BFS, sets, windows, linked lists and tree DFS.',
  exercises: [
    code({
      id: 'o8-wu-open-neighbors',
      title: 'Open neighbors',
      skills: ['grid_neighbors', 'grid_nested'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Ints grid: `0` open, `1` wall. Write `open_neighbors(grid, r, c)` returning the open 4-neighbors of `(r, c)` as `(r, c)` tuples, in the order up, down, left, right.',
      solution: `def open_neighbors(grid, r, c):
    rows, cols = len(grid), len(grid[0])
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
            out.append((nr, nc))
    return out
`,
      tests: [
        t.eq('open_neighbors([[0, 1], [0, 0]], 0, 0)', '[(1, 0)]'),
        t.hidden('open_neighbors([[0, 0, 0], [0, 0, 0], [0, 0, 0]], 1, 1)', '[(0, 1), (2, 1), (1, 0), (1, 2)]'),
        t.hidden('open_neighbors([[0]], 0, 0)', '[]'),
      ],
      hints: ['Directions list, nr/nc, bounds check, then the cell check.'],
      signature: 'neighbors:list',
      minutes: 4,
    }),
    code({
      id: 'o8-wu-level-max',
      title: 'Largest value per level',
      skills: ['bfs_levels', 'queue_deque'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `level_maxes(root)`: the largest value on each level of a binary tree, top to bottom. Empty tree → `[]`.',
      solution: `from collections import deque

def level_maxes(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        best = None
        for _ in range(len(q)):
            node = q.popleft()
            if best is None or node.val > best:
                best = node.val
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(best)
    return out
`,
      tests: [
        t.eq('level_maxes(build_tree([1, 3, 2, 5, 3, None, 9]))', '[1, 3, 9]'),
        t.hidden('level_maxes(None)', '[]'),
        t.hidden('level_maxes(build_tree([-5, -7, -2]))', '[-5, -2]'),
      ],
      hints: ['for _ in range(len(q)) handles exactly one level. Values can be negative, so do not start best at 0.'],
      signature: 'tree-bfs:level-max',
      minutes: 5,
    }),
    code({
      id: 'o8-wu-first-dup',
      title: 'First repeat',
      skills: ['set_add', 'set_membership', 'early_return'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `first_repeat(nums)`: the first value whose second occurrence comes earliest, or `None` if all values are distinct.',
      solution: `def first_repeat(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return x
        seen.add(x)
    return None
`,
      tests: [
        t.eq('first_repeat([3, 1, 4, 1, 3])', '1'),
        t.hidden('first_repeat([])', 'None'),
        t.hidden('first_repeat([1, 2, 3])', 'None'),
        t.hidden('first_repeat([7, 7])', '7'),
      ],
      hints: ['Check membership before adding.'],
      signature: 'set:first-repeat',
      minutes: 3,
    }),
    code({
      id: 'o8-wu-longest-unique',
      title: 'Longest run without repeats',
      skills: ['sliding_window', 'window_state'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Write `longest_unique(s)`: the length of the longest substring with no repeated character. Variable-size window with a set.',
      solution: `def longest_unique(s):
    window = set()
    left = 0
    best = 0
    for right, ch in enumerate(s):
        while ch in window:
            window.remove(s[left])
            left += 1
        window.add(ch)
        best = max(best, right - left + 1)
    return best
`,
      tests: [
        t.eq('longest_unique("abcabcbb")', '3'),
        t.hidden('longest_unique("")', '0'),
        t.hidden('longest_unique("bbbb")', '1'),
        t.hidden('longest_unique("pwwkew")', '3'),
        t.hidden('longest_unique("abba")', '2'),
      ],
      hints: ['While the new character is already inside, shrink from the left.'],
      signature: 'window:longest-unique',
      minutes: 6,
    }),
    code({
      id: 'o8-wu-reverse-list',
      title: 'Reverse a linked list',
      skills: ['linked_list_reassignment', 'linked_list_traversal'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `reverse(head)` returning the head of the reversed list. Iterative, O(1) extra space.',
      solution: `def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
`,
      tests: [
        t.eq('list_to_array(reverse(build_list([1, 2, 3])))', '[3, 2, 1]'),
        t.hidden('list_to_array(reverse(build_list([])))', '[]'),
        t.hidden('list_to_array(reverse(build_list([5])))', '[5]'),
      ],
      hints: ['Save next, point cur back at prev, then advance both.'],
      signature: 'linked-list:reverse',
      minutes: 4,
    }),
    code({
      id: 'o8-wu-path-sum',
      title: 'Root-to-leaf sum',
      skills: ['tree_dfs', 'recursion_base_case'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `has_path_sum(root, target)`: `True` if some root-to-leaf path adds up to `target`. Empty tree → `False`.',
      solution: `def has_path_sum(root, target):
    if root is None:
        return False
    if root.left is None and root.right is None:
        return root.val == target
    rest = target - root.val
    return has_path_sum(root.left, rest) or has_path_sum(root.right, rest)
`,
      tests: [
        t.eq('has_path_sum(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2]), 22)', 'True'),
        t.eq('has_path_sum(build_tree([1, 2, 3]), 5)', 'False'),
        t.hidden('has_path_sum(None, 0)', 'False'),
        t.hidden('has_path_sum(build_tree([1, 2]), 1)', 'False'),
        t.hidden('has_path_sum(build_tree([-2, None, -3]), -5)', 'True'),
      ],
      hints: ['Subtract as you go down; check equality only at a leaf.'],
      signature: 'tree-dfs:path-sum',
      minutes: 4,
    }),
  ],
}

const adjacency = {
  id: 'o8-adjacency',
  title: 'Adjacency lists',
  summary: 'Turn an edge list into a dict of neighbor lists, including nodes with no edges.',
  exercises: [
    choice({
      id: 'o8-a-what',
      title: 'Edge list vs adjacency list',
      skills: ['graph_adjacency'],
      prompt: 'An undirected graph on nodes 0..3 has edges `[[0, 1], [1, 2]]`. As an adjacency list, what is `graph[1]`?',
      options: ['[0, 2]', '[2]', '[0]', '[[0, 1], [1, 2]]'],
      answer: 0,
      note: 'Adjacency list: `graph[node]` is the list of nodes it connects to. Undirected edges go into both lists.',
      explanation: 'Node 1 appears in both edges, so its neighbors are 0 and 2. The edge list answers "is there an edge?" slowly; the adjacency list answers "what are my neighbors?" instantly.',
      signature: 'adjacency:what',
    }),
    output({
      id: 'o8-a-trace-build',
      title: 'Trace a build',
      skills: ['graph_adjacency', 'dict_items'],
      prompt: 'What prints?',
      code: `n = 4
edges = [[0, 1], [0, 2], [2, 1]]
graph = {i: [] for i in range(n)}
for a, b in edges:
    graph[a].append(b)
    graph[b].append(a)
for node, nbrs in graph.items():
    print(node, nbrs)
`,
      expectedOutput: '0 [1, 2]\n1 [0, 2]\n2 [0, 1]\n3 []',
      explanation: 'Each undirected edge is appended twice, once per endpoint. Node 3 has no edges but still has an entry because the dict was pre-filled for every node.',
      signature: 'trace:adjacency-build',
      minutes: 2,
    }),
    output({
      id: 'o8-a-trace-missing',
      title: 'The missing node',
      skills: ['graph_adjacency', 'dict_get'],
      prompt: 'This build only creates entries for nodes that appear in an edge. There are 4 nodes. What prints?',
      code: `edges = [[0, 1], [1, 2]]
graph = {}
for a, b in edges:
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)
print(len(graph))
print(graph.get(3, []))
print(3 in graph)
`,
      expectedOutput: '3\n[]\nFalse',
      note: 'Pre-fill with `{i: [] for i in range(n)}` when nodes are 0..n-1, or always read with `graph.get(node, [])`.',
      explanation: 'Node 3 is isolated, so it never got a key. A loop over graph would skip it entirely, which silently breaks component counts. graph[3] would raise KeyError.',
      signature: 'trace:adjacency-missing-node',
      minutes: 2,
      important: true,
    }),
    choice({
      id: 'o8-a-directed',
      title: 'Directed edges',
      skills: ['graph_adjacency'],
      prompt: 'Edge `[a, b]` in a **directed** graph means a → b. What do you append?',
      options: ['graph[a].append(b) only', 'graph[a].append(b) and graph[b].append(a)', 'graph[b].append(a) only', 'graph[a] = b'],
      answer: 0,
      explanation: 'Directed edges go one way. Adding both directions would turn a one-way street into a two-way one and invent cycles.',
      signature: 'adjacency:directed',
    }),
    fill({
      id: 'o8-a-fill',
      title: 'Both directions',
      skills: ['graph_adjacency', 'list_append'],
      prompt: 'Fill the two blanks to build an undirected adjacency list.',
      starterCode: `def build(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        ____
        ____
    return graph
`,
      solution: `def build(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    return graph
`,
      tests: [t.eq('build(3, [[0, 1], [1, 2]])', '{0: [1], 1: [0, 2], 2: [1]}'), t.hidden('build(2, [])', '{0: [], 1: []}')],
      signature: 'adjacency:fill-both',
    }),
    code({
      id: 'o8-a-one-line',
      title: 'Pre-fill every node',
      skills: ['graph_adjacency', 'dict_create'],
      stage: 'recall',
      prompt: 'Replace `graph = None` with one line: a dict mapping each node `0..n-1` to its own empty list.',
      starterCode: 'n = 5\ngraph = None\n',
      solution: 'n = 5\ngraph = {i: [] for i in range(n)}\n',
      tests: [
        t.check('every node present', 'assert graph == {0: [], 1: [], 2: [], 3: [], 4: []}'),
        t.check('lists are separate', 'graph[0].append(9)\nassert graph[1] == []'),
      ],
      hints: ['Dict comprehension: {key: value for ...}. dict.fromkeys(range(n), []) would share one list.'],
      signature: 'adjacency:prefill',
      minutes: 2,
      important: true,
    }),
    code({
      id: 'o8-a-build-undirected',
      title: 'Build undirected',
      skills: ['graph_adjacency'],
      prompt: 'Write `build_undirected(n, edges)` for nodes `0..n-1`. Every node gets a key, even with no edges. Append neighbors in edge order.',
      starterCode: 'def build_undirected(n, edges):\n    pass\n',
      solution: `def build_undirected(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    return graph
`,
      tests: [
        t.eq('build_undirected(4, [[0, 1], [2, 0]])', '{0: [1, 2], 1: [0], 2: [0], 3: []}'),
        t.hidden('build_undirected(0, [])', '{}'),
        t.hidden('build_undirected(1, [])', '{0: []}'),
        t.hidden('build_undirected(3, [[0, 1], [0, 1]])', '{0: [1, 1], 1: [0, 0], 2: []}'),
      ],
      hints: ['Pre-fill, then two appends per edge.'],
      signature: 'adjacency:build-undirected',
      minutes: 4,
      important: true,
    }),
    code({
      id: 'o8-a-build-directed',
      title: 'Build directed',
      skills: ['graph_adjacency'],
      prompt: 'Write `build_directed(n, edges)` where `[a, b]` means a → b. Every node `0..n-1` gets a key.',
      starterCode: 'def build_directed(n, edges):\n    pass\n',
      solution: `def build_directed(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
    return graph
`,
      tests: [
        t.eq('build_directed(3, [[0, 1], [1, 2], [2, 0]])', '{0: [1], 1: [2], 2: [0]}'),
        t.hidden('build_directed(3, [[2, 0]])', '{0: [], 1: [], 2: [0]}'),
      ],
      signature: 'adjacency:build-directed',
      minutes: 3,
    }),
    code({
      id: 'o8-a-in-degree',
      title: 'In-degrees',
      skills: ['graph_adjacency', 'list_index'],
      prompt: 'Directed edges `[a, b]` mean a → b. Write `in_degrees(n, edges)`: a list where entry `i` is how many edges point **into** node `i`.',
      starterCode: 'def in_degrees(n, edges):\n    pass\n',
      solution: `def in_degrees(n, edges):
    deg = [0] * n
    for a, b in edges:
        deg[b] += 1
    return deg
`,
      tests: [
        t.eq('in_degrees(3, [[0, 1], [0, 2], [1, 2]])', '[0, 1, 2]'),
        t.hidden('in_degrees(2, [])', '[0, 0]'),
        t.hidden('in_degrees(1, [[0, 0]])', '[1]'),
      ],
      hints: ['Only the target of each edge gains in-degree.'],
      explanation: 'A node with in-degree 0 has no prerequisites. That idea powers Kahn\'s algorithm, the alternative to DFS for cycle detection.',
      signature: 'adjacency:in-degree',
      minutes: 3.5,
    }),
    code({
      id: 'o8-a-named',
      title: 'Named nodes',
      skills: ['graph_adjacency', 'dict_create'],
      stage: 'combine',
      repType: 'combine',
      prompt: 'Nodes are strings. Write `build_named(names, pairs)`: an undirected adjacency dict with a key for every name in `names` (even friendless ones), built from `pairs` like `[["ann", "bo"]]`.',
      starterCode: 'def build_named(names, pairs):\n    pass\n',
      solution: `def build_named(names, pairs):
    graph = {name: [] for name in names}
    for a, b in pairs:
        graph[a].append(b)
        graph[b].append(a)
    return graph
`,
      tests: [
        t.eq('build_named(["ann", "bo", "cy"], [["ann", "bo"]])', '{"ann": ["bo"], "bo": ["ann"], "cy": []}'),
        t.hidden('build_named([], [])', '{}'),
        t.hidden('build_named(["x", "y", "z"], [["x", "y"], ["z", "x"]])', '{"x": ["y", "z"], "y": ["x"], "z": ["x"]}'),
      ],
      hints: ['Same as ints: pre-fill from names instead of range(n).'],
      signature: 'adjacency:named',
      minutes: 5,
    }),
    code({
      id: 'o8-a-matrix',
      title: 'Matrix to adjacency list',
      skills: ['graph_adjacency', 'grid_nested'],
      stage: 'combine',
      repType: 'combine',
      prompt: 'Some problems give an n x n matrix where `m[i][j] == 1` means i and j are connected. Write `matrix_to_adj(m)`: a dict from each node to its neighbors in increasing order. Ignore the diagonal (`m[i][i]`).',
      starterCode: 'def matrix_to_adj(m):\n    pass\n',
      solution: `def matrix_to_adj(m):
    n = len(m)
    graph = {i: [] for i in range(n)}
    for i in range(n):
        for j in range(n):
            if i != j and m[i][j] == 1:
                graph[i].append(j)
    return graph
`,
      tests: [
        t.eq('matrix_to_adj([[1, 1, 0], [1, 1, 0], [0, 0, 1]])', '{0: [1], 1: [0], 2: []}'),
        t.hidden('matrix_to_adj([[1]])', '{0: []}'),
        t.hidden('matrix_to_adj([[1, 1, 1], [1, 1, 0], [1, 0, 1]])', '{0: [1, 2], 1: [0], 2: [0]}'),
      ],
      hints: ['The matrix is already a neighbor table: row i lists who i is connected to.'],
      explanation: 'You often do not need to convert: inside a traversal you can loop for j in range(n) and check m[i][j] == 1. That costs O(n) per node, O(n²) total, same as reading the matrix.',
      signature: 'adjacency:from-matrix',
      minutes: 5,
    }),
  ],
}

const graphDfs = {
  id: 'o8-dfs',
  title: 'Graph DFS',
  summary: 'Recursive and stack DFS over an adjacency list, with a visited set.',
  exercises: [
    choice({
      id: 'o8-d-why-visited',
      title: 'Why visited here, not in trees?',
      skills: ['graph_dfs', 'visited_set'],
      prompt: 'Tree DFS never needed a visited set. Why does DFS on the undirected graph `0 - 1` need one?',
      options: [
        'Without it, 0 visits 1, 1 visits 0, 0 visits 1… forever: graphs can lead back to where you came from',
        'Graph nodes do not have a .left and .right',
        'Visited sets make DFS faster but are optional',
        'Python limits recursion only on graphs',
      ],
      answer: 0,
      note: 'Tree: each node has one way in. Graph: many ways in, including back the way you came. Visited makes each node processed once.',
      explanation: 'Undirected edges are stored both ways, so every edge is a 2-cycle. Any cycle makes unguarded DFS loop forever.',
      signature: 'graph-dfs:why-visited',
      important: true,
    }),
    output({
      id: 'o8-d-trace-recursive',
      title: 'Trace recursive DFS',
      skills: ['graph_dfs'],
      prompt: 'What order are nodes visited?',
      code: `graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}
visited = set()
order = []

def dfs(node):
    if node in visited:
        return
    visited.add(node)
    order.append(node)
    for nxt in graph[node]:
        dfs(nxt)

dfs(0)
print(order)
`,
      expectedOutput: '[0, 1, 3, 2]',
      explanation: 'DFS follows 0 → 1 → 3 as deep as possible; from 3 it reaches 2 before backtracking. By the time 0 tries 2, it is already visited.',
      signature: 'trace:graph-dfs-recursive',
      minutes: 2.5,
    }),
    fill({
      id: 'o8-d-fill',
      title: 'Recursive DFS guard',
      skills: ['graph_dfs', 'visited_set'],
      prompt: 'Fill the blanks: the guard and the mark.',
      starterCode: `def reach_count(graph, start):
    visited = set()

    def dfs(node):
        if ____:
            return
        ____
        for nxt in graph[node]:
            dfs(nxt)

    dfs(start)
    return len(visited)
`,
      solution: `def reach_count(graph, start):
    visited = set()

    def dfs(node):
        if node in visited:
            return
        visited.add(node)
        for nxt in graph[node]:
            dfs(nxt)

    dfs(start)
    return len(visited)
`,
      tests: [t.eq('reach_count({0: [1], 1: [0, 2], 2: [1], 3: []}, 0)', '3'), t.hidden('reach_count({0: []}, 0)', '1')],
      signature: 'graph-dfs:fill-guard',
    }),
    code({
      id: 'o8-d-order',
      title: 'DFS order (recursive)',
      skills: ['graph_dfs', 'recursion_base_case'],
      prompt: 'Write `dfs_order(graph, start)` returning nodes in the order a recursive DFS first visits them, trying neighbors in list order. Use an inner function.',
      starterCode: 'def dfs_order(graph, start):\n    pass\n',
      solution: `def dfs_order(graph, start):
    visited = set()
    order = []

    def dfs(node):
        visited.add(node)
        order.append(node)
        for nxt in graph[node]:
            if nxt not in visited:
                dfs(nxt)

    dfs(start)
    return order
`,
      tests: [
        t.eq('dfs_order({0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}, 0)', '[0, 1, 3, 2]'),
        t.eq('dfs_order({"a": ["b", "c"], "b": ["a"], "c": ["a"]}, "a")', '["a", "b", "c"]'),
        t.hidden('dfs_order({0: []}, 0)', '[0]'),
        t.hidden('dfs_order({0: [1], 1: [2], 2: [0], 3: [0]}, 0)', '[0, 1, 2]'),
      ],
      hints: [
        'An inner def can read and mutate visited and order from the outer function.',
        'Check before recursing (if nxt not in visited) or at the top (if node in visited: return). Pick one.',
      ],
      signature: 'graph-dfs:order-recursive',
      minutes: 5,
      important: true,
    }),
    output({
      id: 'o8-d-trace-stack',
      title: 'Trace stack DFS',
      skills: ['graph_dfs', 'stack_push_pop'],
      prompt: 'An iterative DFS that marks nodes when pushing. What prints?',
      code: `graph = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}
visited = {0}
stack = [0]
order = []
while stack:
    node = stack.pop()
    order.append(node)
    for nxt in graph[node]:
        if nxt not in visited:
            visited.add(nxt)
            stack.append(nxt)
print(order)
`,
      expectedOutput: '[0, 2, 3, 1]',
      explanation: 'The stack pops the most recently pushed neighbor, so 2 comes before 1. Same reachable set as recursive DFS, different order. For yes/no and counting questions the order does not matter.',
      signature: 'trace:graph-dfs-stack',
      minutes: 2.5,
    }),
    code({
      id: 'o8-d-stack',
      title: 'Reachable set (stack)',
      skills: ['graph_dfs', 'stack_push_pop', 'visited_set'],
      prompt: 'Write `reachable(graph, start)` with an explicit stack (no recursion). Return the reachable nodes as a sorted list.',
      starterCode: 'def reachable(graph, start):\n    pass\n',
      solution: `def reachable(graph, start):
    visited = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return sorted(visited)
`,
      tests: [
        t.eq('reachable({0: [1], 1: [0, 2], 2: [1], 3: [4], 4: [3]}, 0)', '[0, 1, 2]'),
        t.eq('reachable({0: [1], 1: [0, 2], 2: [1], 3: [4], 4: [3]}, 4)', '[3, 4]'),
        t.hidden('reachable({0: []}, 0)', '[0]'),
        t.hidden('reachable({0: [1], 1: [2], 2: [], 3: [0]}, 0)', '[0, 1, 2]'),
      ],
      hints: ['Exactly the grid BFS shape with a list and pop() instead of deque and popleft().'],
      explanation: 'Iterative DFS avoids Python\'s recursion limit (about 1000 frames), which matters on long path-like graphs.',
      signature: 'graph-dfs:reachable-stack',
      minutes: 5,
      important: true,
    }),
    reorder({
      id: 'o8-d-reorder',
      title: 'Rebuild stack DFS',
      skills: ['graph_dfs', 'stack_push_pop'],
      prompt: 'Order the lines: count nodes reachable from `start`.',
      lines: [
        'def count_reachable(graph, start):',
        '    visited = {start}',
        '    stack = [start]',
        '    while stack:',
        '        node = stack.pop()',
        '        for nxt in graph[node]:',
        '            if nxt not in visited:',
        '                visited.add(nxt)',
        '                stack.append(nxt)',
        '    return len(visited)',
      ],
      tests: [t.eq('count_reachable({0: [1], 1: [0], 2: []}, 0)', '2'), t.hidden('count_reachable({0: [1], 1: [0], 2: []}, 2)', '1')],
      signature: 'reorder:graph-dfs-stack',
      minutes: 3,
    }),
    code({
      id: 'o8-d-directed-reach',
      title: 'One-way reachability',
      skills: ['graph_adjacency', 'graph_dfs'],
      stage: 'combine',
      repType: 'combine',
      prompt: 'Nodes `0..n-1`, directed edges `[a, b]` meaning a → b. Write `can_reach(n, edges, src, dst)`: `True` if you can follow edges from `src` to `dst`. Build the graph yourself; DFS either way.',
      starterCode: 'def can_reach(n, edges, src, dst):\n    pass\n',
      solution: `def can_reach(n, edges, src, dst):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
    visited = {src}
    stack = [src]
    while stack:
        node = stack.pop()
        if node == dst:
            return True
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return False
`,
      tests: [
        t.eq('can_reach(3, [[0, 1], [1, 2]], 0, 2)', 'True'),
        t.eq('can_reach(3, [[0, 1], [1, 2]], 2, 0)', 'False'),
        t.hidden('can_reach(1, [], 0, 0)', 'True'),
        t.hidden('can_reach(4, [[0, 1], [2, 3]], 0, 3)', 'False'),
        t.hidden('can_reach(4, [[0, 1], [1, 0], [1, 3]], 0, 3)', 'True'),
      ],
      hints: [
        'Directed: one append per edge.',
        'Return True as soon as you pop dst; return False after the loop.',
      ],
      signature: 'graph-dfs:directed-reach',
      minutes: 7,
    }),
    code({
      id: 'o8-d-path',
      title: 'Return an actual path',
      skills: ['graph_dfs', 'recursion_return', 'backtracking_state'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Write recursive `find_path(graph, start, target)` returning a list of nodes from `start` to `target` (any valid path, found by trying neighbors in list order), or `None` if unreachable.',
      starterCode: `def find_path(graph, start, target):
    visited = set()

    def dfs(node):
        # return a path from node to target, or None
        pass

    return dfs(start)
`,
      solution: `def find_path(graph, start, target):
    visited = set()

    def dfs(node):
        if node == target:
            return [node]
        visited.add(node)
        for nxt in graph[node]:
            if nxt not in visited:
                rest = dfs(nxt)
                if rest is not None:
                    return [node] + rest
        return None

    return dfs(start)
`,
      tests: [
        t.eq('find_path({0: [1, 2], 1: [3], 2: [3], 3: []}, 0, 3)', '[0, 1, 3]'),
        t.eq('find_path({0: [1], 1: [], 2: []}, 0, 2)', 'None'),
        t.hidden('find_path({0: []}, 0, 0)', '[0]'),
        t.hidden('find_path({0: [1], 1: [0, 2], 2: [1]}, 2, 0)', '[2, 1, 0]'),
      ],
      hints: [
        'A recursive call answers: "is there a path from here, and what is it?"',
        'If a child returns a path, prepend the current node and pass it up. If none do, return None.',
      ],
      explanation: 'Same skeleton as tree DFS returning a value: base case at the target, combine child results on the way back up.',
      signature: 'graph-dfs:path',
      minutes: 9,
    }),
  ],
}

const graphBfs = {
  id: 'o8-bfs',
  title: 'Graph BFS',
  summary: 'Queue-based traversal over an adjacency list; the tool for fewest edges.',
  exercises: [
    choice({
      id: 'o8-b-when',
      title: 'BFS or DFS?',
      skills: ['graph_bfs', 'graph_dfs'],
      prompt: 'Which question **needs** BFS rather than DFS?',
      options: [
        'Fewest edges from A to B in an unweighted graph',
        'Is B reachable from A?',
        'How many connected components are there?',
        'Does the directed graph contain a cycle?',
      ],
      answer: 0,
      explanation: 'BFS explores in order of distance, so the first time it reaches B is along a shortest path. The others only need "visit everything once"; either traversal works (cycle detection uses DFS states).',
      signature: 'graph-bfs:when',
    }),
    output({
      id: 'o8-b-trace',
      title: 'Trace graph BFS',
      skills: ['graph_bfs'],
      prompt: 'Same graph as the DFS trace. What order now?',
      code: `from collections import deque
graph = {0: [1, 2], 1: [0, 3], 2: [0, 4], 3: [1], 4: [2]}
visited = {0}
q = deque([0])
order = []
while q:
    node = q.popleft()
    order.append(node)
    for nxt in graph[node]:
        if nxt not in visited:
            visited.add(nxt)
            q.append(nxt)
print(order)
`,
      expectedOutput: '[0, 1, 2, 3, 4]',
      explanation: 'Distance 0: node 0. Distance 1: 1 and 2. Distance 2: 3 (via 1) and 4 (via 2).',
      signature: 'trace:graph-bfs',
      minutes: 2,
    }),
    fill({
      id: 'o8-b-fill',
      title: 'Graph BFS core',
      skills: ['graph_bfs', 'queue_deque'],
      prompt: 'Fill the blanks: pop from the correct end, and mark on enqueue.',
      starterCode: `from collections import deque

def bfs_order(graph, start):
    visited = {start}
    q = deque([start])
    order = []
    while q:
        node = ____
        order.append(node)
        for nxt in graph[node]:
            if nxt not in visited:
                ____
                q.append(nxt)
    return order
`,
      solution: `from collections import deque

def bfs_order(graph, start):
    visited = {start}
    q = deque([start])
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                q.append(nxt)
    return order
`,
      tests: [t.eq('bfs_order({0: [1, 2], 1: [3], 2: [3], 3: []}, 0)', '[0, 1, 2, 3]'), t.hidden('bfs_order({5: []}, 5)', '[5]')],
      signature: 'graph-bfs:fill',
    }),
    code({
      id: 'o8-b-order',
      title: 'BFS order from scratch',
      skills: ['graph_bfs', 'queue_deque'],
      prompt: 'Write `bfs_order(graph, start)` returning nodes in BFS order, neighbors in list order.',
      solution: `from collections import deque

def bfs_order(graph, start):
    visited = {start}
    q = deque([start])
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                q.append(nxt)
    return order
`,
      tests: [
        t.eq('bfs_order({0: [1, 2], 1: [0, 3], 2: [0, 4], 3: [1], 4: [2]}, 0)', '[0, 1, 2, 3, 4]'),
        t.hidden('bfs_order({"a": ["b"], "b": ["a", "c"], "c": ["b"]}, "c")', '["c", "b", "a"]'),
        t.hidden('bfs_order({0: [1], 1: [0], 2: []}, 2)', '[2]'),
      ],
      hints: ['Import deque. Seed visited and the queue with start.'],
      signature: 'graph-bfs:order',
      minutes: 5,
      important: true,
    }),
    code({
      id: 'o8-b-distances',
      title: 'Distance to every node',
      skills: ['graph_bfs', 'dict_assign'],
      prompt: 'Write `distances(graph, start)`: a dict from each reachable node to its fewest-edges distance from `start`. The dict can double as the visited set.',
      starterCode: 'from collections import deque\n\ndef distances(graph, start):\n    pass\n',
      solution: `from collections import deque

def distances(graph, start):
    dist = {start: 0}
    q = deque([start])
    while q:
        node = q.popleft()
        for nxt in graph[node]:
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                q.append(nxt)
    return dist
`,
      tests: [
        t.eq('distances({0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2]}, 0)', '{0: 0, 1: 1, 2: 1, 3: 2}'),
        t.hidden('distances({0: [], 1: []}, 1)', '{1: 0}'),
        t.hidden('distances({0: [1], 1: [2], 2: [3], 3: []}, 0)', '{0: 0, 1: 1, 2: 2, 3: 3}'),
      ],
      hints: ['if nxt not in dist plays the role of if nxt not in visited.'],
      signature: 'graph-bfs:distances',
      minutes: 5,
    }),
    code({
      id: 'o8-b-shortest',
      title: 'Fewest edges between two nodes',
      skills: ['graph_bfs', 'graph_adjacency', 'early_return'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Nodes `0..n-1`, undirected edges. Write `fewest_edges(n, edges, src, dst)`: the minimum number of edges on a path from `src` to `dst`, or `-1` if there is none. Build the graph, then BFS.',
      starterCode: 'from collections import deque\n\ndef fewest_edges(n, edges, src, dst):\n    pass\n',
      solution: `from collections import deque

def fewest_edges(n, edges, src, dst):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    dist = {src: 0}
    q = deque([src])
    while q:
        node = q.popleft()
        if node == dst:
            return dist[node]
        for nxt in graph[node]:
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                q.append(nxt)
    return -1
`,
      tests: [
        t.eq('fewest_edges(5, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3]], 0, 3)', '2'),
        t.eq('fewest_edges(4, [[0, 1], [2, 3]], 0, 3)', '-1'),
        t.hidden('fewest_edges(1, [], 0, 0)', '0'),
        t.hidden('fewest_edges(3, [[0, 1], [1, 2], [0, 2]], 0, 2)', '1'),
        t.hidden('fewest_edges(6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], 5, 0)', '5'),
      ],
      hints: [
        'Unweighted fewest edges → BFS.',
        'Track distance per node in a dict seeded with {src: 0}.',
        'Return when you pop dst; after the loop return -1.',
      ],
      complexity: { time: 'O(V + E)', space: 'O(V + E)' },
      signature: 'graph-bfs:fewest-edges',
      minutes: 8,
      important: true,
    }),
    code({
      id: 'o8-b-within-k',
      title: 'Everyone within k hops',
      skills: ['graph_bfs', 'bfs_levels'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Write `within_k(graph, start, k)`: a sorted list of nodes whose distance from `start` is between 1 and `k` (the start itself excluded). Use the level-snapshot trick from trees and stop after `k` levels.',
      starterCode: 'from collections import deque\n\ndef within_k(graph, start, k):\n    pass\n',
      solution: `from collections import deque

def within_k(graph, start, k):
    visited = {start}
    q = deque([start])
    for _ in range(k):
        for _ in range(len(q)):
            node = q.popleft()
            for nxt in graph[node]:
                if nxt not in visited:
                    visited.add(nxt)
                    q.append(nxt)
    visited.discard(start)
    return sorted(visited)
`,
      tests: [
        t.eq('within_k({0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}, 0, 2)', '[1, 2]'),
        t.eq('within_k({0: [1, 2], 1: [0], 2: [0]}, 1, 1)', '[0]'),
        t.hidden('within_k({0: [1], 1: [0]}, 0, 0)', '[]'),
        t.hidden('within_k({0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}, 0, 10)', '[1, 2, 3]'),
        t.hidden('within_k({0: []}, 0, 3)', '[]'),
      ],
      hints: ['An outer loop of k passes, each draining exactly one level (snapshot len(q)). If the queue empties early, the inner loop just does nothing.'],
      signature: 'graph-bfs:within-k',
      minutes: 8,
    }),
    reorder({
      id: 'o8-b-reorder',
      title: 'Rebuild graph BFS',
      skills: ['graph_bfs', 'queue_deque'],
      prompt: 'Order the lines to return the set of nodes reachable from `start` as a sorted list.',
      lines: [
        'from collections import deque',
        'def bfs_reach(graph, start):',
        '    visited = {start}',
        '    q = deque([start])',
        '    while q:',
        '        node = q.popleft()',
        '        for nxt in graph[node]:',
        '            if nxt not in visited:',
        '                visited.add(nxt)',
        '                q.append(nxt)',
        '    return sorted(visited)',
      ],
      tests: [t.eq('bfs_reach({0: [1], 1: [0], 2: []}, 0)', '[0, 1]')],
      signature: 'reorder:graph-bfs',
      minutes: 3,
    }),
  ],
}

const visitedReasoning = {
  id: 'o8-visited',
  title: 'Visited reasoning',
  summary: 'When to mark, what visited protects against, and why it is a set.',
  exercises: [
    output({
      id: 'o8-v-trace-late',
      title: 'Marking on pop in a graph',
      skills: ['visited_set', 'graph_bfs'],
      prompt: 'This BFS marks a node when it is popped (and skips repeats). How many pushes happen?',
      code: `from collections import deque
graph = {0: [1, 2, 3], 1: [0, 4], 2: [0, 4], 3: [0, 4], 4: [1, 2, 3]}
seen = set()
q = deque([0])
pushes = 1
while q:
    node = q.popleft()
    if node in seen:
        continue
    seen.add(node)
    for nxt in graph[node]:
        if nxt not in seen:
            q.append(nxt)
            pushes += 1
print(len(seen), pushes)
`,
      expectedOutput: '5 7',
      explanation: 'Node 4 gets pushed by 1, 2 and 3 because none of them had marked it. Marking on enqueue would push each node exactly once: 5 pushes. In dense graphs the late version can push O(E) items.',
      signature: 'trace:visited-late-graph',
      minutes: 3,
      difficulty: 3,
    }),
    choice({
      id: 'o8-v-set-not-list',
      title: 'Set, not list',
      skills: ['visited_set', 'set_membership'],
      prompt: 'Why keep visited in a set instead of a list?',
      options: [
        '`x in set` is O(1) on average; `x in list` scans the list, O(n)',
        'Lists cannot hold integers',
        'Sets keep insertion order for the traversal',
        'A list would visit nodes twice',
      ],
      answer: 0,
      explanation: 'The membership check runs once per edge. With a list, a V-node graph traversal becomes O(V * E) instead of O(V + E).',
      signature: 'visited:set-not-list',
    }),
    choice({
      id: 'o8-v-shared',
      title: 'One visited set for many starts',
      skills: ['visited_set', 'connected_components'],
      prompt: 'You loop over every node and start a traversal from each one that is not yet visited, sharing **one** visited set. What is the total cost on a graph with V nodes and E edges?',
      options: [
        'O(V + E): each node is visited once overall, each edge looked at a constant number of times',
        'O(V * (V + E)): one full traversal per node',
        'O(V²) always',
        'O(E log V)',
      ],
      answer: 0,
      explanation: 'Because visited is shared, a later traversal never re-enters nodes an earlier one covered. Summed over all starts, the work is one pass over the graph.',
      signature: 'visited:shared-across-starts',
      important: true,
    }),
    choice({
      id: 'o8-v-mark-what',
      title: 'Directed graphs and plain visited',
      skills: ['visited_set', 'cycle_detection'],
      prompt: 'Directed edges 0 → 1, 0 → 2, 1 → 3, 2 → 3. A DFS from 0 reaches 3 a second time (via 2) and sees it is already visited. Does that mean there is a cycle?',
      options: [
        'No: 3 was finished earlier on another branch; a cycle needs an edge back to a node still on the current path',
        'Yes: reaching a visited node always means a cycle',
        'Yes, but only in undirected graphs',
        'It depends on the order of neighbors',
      ],
      answer: 0,
      explanation: 'This diamond has no cycle. Plain visited cannot tell "finished" from "on my current path", which is why directed cycle detection uses three states. You will build that later today.',
      signature: 'visited:diamond-not-cycle',
    }),
    code({
      id: 'o8-v-fix-bounce',
      title: 'Fix the bouncing DFS',
      skills: ['visited_set', 'graph_dfs'],
      stage: 'reconstruct',
      prompt: 'This recursive DFS should return how many nodes are reachable from `start` in an undirected graph, but on any edge it bounces back and forth until Python raises `RecursionError`. Fix it with a visited set; keep it recursive.',
      starterCode: `def count_from(graph, start):
    def dfs(node):
        total = 1
        for nxt in graph[node]:
            total += dfs(nxt)
        return total

    return dfs(start)
`,
      solution: `def count_from(graph, start):
    visited = set()

    def dfs(node):
        visited.add(node)
        total = 1
        for nxt in graph[node]:
            if nxt not in visited:
                total += dfs(nxt)
        return total

    return dfs(start)
`,
      tests: [
        t.eq('count_from({0: [1], 1: [0, 2], 2: [1]}, 0)', '3'),
        t.eq('count_from({0: [1, 2], 1: [0, 2], 2: [0, 1], 3: []}, 1)', '3'),
        t.hidden('count_from({0: []}, 0)', '1'),
        t.hidden('count_from({0: [1], 1: [0], 2: [3], 3: [2]}, 3)', '2'),
      ],
      hints: ['Mark the node on entry, and only recurse into neighbors not yet marked.'],
      explanation: 'In the triangle, without "if nxt not in visited" node 2 would be counted twice (via 0 and via 1) even if the recursion stopped. Visited both terminates the search and prevents double counting.',
      signature: 'graph-dfs:fix-visited',
      minutes: 5,
    }),
  ],
}

const pathExistsCap = {
  id: 'o8-cap-path-exists',
  title: 'Path Exists',
  summary: 'Capstone: build the graph, traverse from the source, answer reachability.',
  exercises: [
    capstone({
      id: 'cap-path-exists',
      title: 'Is there a path?',
      problemId: 'path-exists',
      skills: ['graph_adjacency', 'graph_dfs', 'visited_set'],
      prompt: 'There are `n` nodes labeled `0..n-1` and a list of undirected `edges`, each `[a, b]`. Return `True` if you can travel from `source` to `destination` along edges, otherwise `False`. A node can always reach itself.',
      starterCode: `from typing import List

def valid_path(n: int, edges: List[List[int]], source: int, destination: int) -> bool:
    pass
`,
      solution: `from typing import List

def valid_path(n: int, edges: List[List[int]], source: int, destination: int) -> bool:
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    visited = {source}
    stack = [source]
    while stack:
        node = stack.pop()
        if node == destination:
            return True
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return False
`,
      examples: [
        { input: 'n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2', output: 'True' },
        { input: 'n = 6, edges = [[0,1],[0,2],[3,5],[5,4],[4,3]], source = 0, destination = 5', output: 'False', note: 'two separate groups' },
        { input: 'n = 1, edges = [], source = 0, destination = 0', output: 'True' },
      ],
      tests: [
        t.eq('valid_path(3, [[0, 1], [1, 2], [2, 0]], 0, 2)', 'True'),
        t.eq('valid_path(6, [[0, 1], [0, 2], [3, 5], [5, 4], [4, 3]], 0, 5)', 'False'),
        t.eq('valid_path(1, [], 0, 0)', 'True'),
        t.hidden('valid_path(2, [], 0, 1)', 'False'),
        t.hidden('valid_path(2, [[1, 0]], 0, 1)', 'True'),
        t.hidden('valid_path(5, [[0, 1], [1, 2], [2, 3], [3, 4]], 4, 0)', 'True'),
        t.hidden('valid_path(4, [[0, 1], [0, 1], [2, 3]], 1, 2)', 'False'),
        t.hidden('valid_path(10, [[0, 7], [0, 8], [6, 1], [2, 0], [0, 4], [5, 8], [4, 7], [1, 3], [3, 5], [6, 5]], 7, 5)', 'True'),
        t.hidden('valid_path(3, [[0, 0], [1, 2]], 0, 2)', 'False'),
      ],
      hints: [
        'Reachability: start at source and see whether a traversal ever touches destination.',
        'Edges are undirected, so build a dict of lists with both directions, including isolated nodes.',
        'DFS (stack or recursion) or BFS with a visited set; return True the moment you reach destination.',
        'Build graph; visited = {source}; stack = [source]; pop, if node == destination return True, push unvisited neighbors marking them; return False.',
      ],
      complexity: { time: 'O(V + E)', space: 'O(V + E) for the adjacency list and visited set' },
      explanation: 'The traversal visits exactly the nodes in source\'s connected component. destination is reachable iff it is in that component, and each node and edge is processed at most once.',
      signature: 'capstone:path-exists',
      minutes: 25,
    }),
    explain({
      id: 'o8-explain-path-exists',
      title: 'Explain path exists',
      skills: ['explanation', 'complexity', 'edge_cases'],
      prompt: 'Explain your solution as in an interview: representation, traversal, why it terminates, complexity, edge cases. Also say why you chose DFS or BFS.',
      rubric: [
        'Build an adjacency list from the edge list, adding both directions, with an entry for every node',
        'Traverse from source with a visited set; return True on reaching destination, False when the traversal ends',
        'Visited guarantees termination despite cycles; each node processed once',
        'O(V + E) time and space',
        'Edges: source == destination, no edges, duplicate edges or self-loops; DFS vs BFS does not matter for yes/no (iterative avoids recursion limits)',
      ],
      signature: 'explain:path-exists',
      minutes: 6,
    }),
  ],
}

const components = {
  id: 'o8-components',
  title: 'Components',
  summary: 'Count groups: start a traversal from every node not yet visited.',
  exercises: [
    choice({
      id: 'o8-c-islands-link',
      title: 'Islands are components',
      skills: ['connected_components'],
      prompt: 'Yesterday\'s islands problem was connected components in disguise. What were the nodes and edges?',
      options: [
        'Nodes: land cells. Edges: between land cells that are up/down/left/right neighbors',
        'Nodes: rows. Edges: columns',
        'Nodes: all cells. Edges: diagonal neighbors',
        'Nodes: islands. Edges: water between them',
      ],
      answer: 0,
      explanation: 'The grid is an implicit graph: neighbors are computed with the directions list instead of stored in an adjacency list. The outer loop over cells is the outer loop over nodes.',
      signature: 'components:islands-link',
    }),
    output({
      id: 'o8-c-trace',
      title: 'Trace component starts',
      skills: ['connected_components', 'graph_dfs'],
      prompt: 'Which nodes start a new traversal, and how many components are there?',
      code: `graph = {0: [1], 1: [0], 2: [], 3: [4], 4: [3], 5: []}
visited = set()

def dfs(node):
    visited.add(node)
    for nxt in graph[node]:
        if nxt not in visited:
            dfs(nxt)

count = 0
for node in graph:
    if node not in visited:
        print("start", node)
        dfs(node)
        count += 1
print(count)
`,
      expectedOutput: 'start 0\nstart 2\nstart 3\nstart 5\n4',
      explanation: 'Node 1 and 4 are already visited by the time the loop reaches them. Isolated nodes 2 and 5 are components of size one, which is why every node needs a key.',
      signature: 'trace:components',
      minutes: 2.5,
    }),
    fill({
      id: 'o8-c-fill',
      title: 'The outer loop',
      skills: ['connected_components', 'visited_set'],
      prompt: 'Fill the blanks in the outer loop.',
      starterCode: `def count_groups(graph):
    visited = set()

    def dfs(node):
        visited.add(node)
        for nxt in graph[node]:
            if nxt not in visited:
                dfs(nxt)

    count = 0
    for node in graph:
        if ____:
            dfs(node)
            ____
    return count
`,
      solution: `def count_groups(graph):
    visited = set()

    def dfs(node):
        visited.add(node)
        for nxt in graph[node]:
            if nxt not in visited:
                dfs(nxt)

    count = 0
    for node in graph:
        if node not in visited:
            dfs(node)
            count += 1
    return count
`,
      tests: [t.eq('count_groups({0: [1], 1: [0], 2: []})', '2'), t.hidden('count_groups({})', '0')],
      signature: 'components:fill-outer',
    }),
    code({
      id: 'o8-c-count',
      title: 'Count components',
      skills: ['connected_components', 'graph_adjacency', 'graph_dfs'],
      stage: 'microbuild',
      difficulty: 3,
      prompt: 'Nodes `0..n-1`, undirected `edges`. Write `count_components(n, edges)`. Build the graph, then the outer loop with a shared visited set. Use an iterative stack for the inner traversal.',
      starterCode: 'def count_components(n, edges):\n    pass\n',
      solution: `def count_components(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    visited = set()
    count = 0
    for start in range(n):
        if start in visited:
            continue
        count += 1
        visited.add(start)
        stack = [start]
        while stack:
            node = stack.pop()
            for nxt in graph[node]:
                if nxt not in visited:
                    visited.add(nxt)
                    stack.append(nxt)
    return count
`,
      tests: [
        t.eq('count_components(5, [[0, 1], [1, 2], [3, 4]])', '2'),
        t.eq('count_components(4, [])', '4'),
        t.hidden('count_components(0, [])', '0'),
        t.hidden('count_components(1, [])', '1'),
        t.hidden('count_components(4, [[0, 1], [1, 2], [2, 3], [3, 0]])', '1'),
        t.hidden('count_components(6, [[0, 1], [2, 3], [4, 5], [1, 0]])', '3'),
      ],
      hints: [
        'Every node not yet visited begins a new component.',
        'Loop for start in range(n) so isolated nodes are counted.',
        'Inside, a full stack traversal that marks the whole component.',
      ],
      complexity: { time: 'O(V + E)', space: 'O(V + E)' },
      signature: 'components:count',
      minutes: 8,
      important: true,
    }),
    code({
      id: 'o8-c-connected',
      title: 'Is the graph connected?',
      skills: ['connected_components', 'graph_bfs'],
      prompt: 'Write `is_connected(n, edges)` (undirected, nodes `0..n-1`): `True` if every node can reach every other. One traversal is enough. Treat `n == 0` as connected.',
      starterCode: 'from collections import deque\n\ndef is_connected(n, edges):\n    pass\n',
      solution: `from collections import deque

def is_connected(n, edges):
    if n == 0:
        return True
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    visited = {0}
    q = deque([0])
    while q:
        node = q.popleft()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                q.append(nxt)
    return len(visited) == n
`,
      tests: [
        t.eq('is_connected(3, [[0, 1], [1, 2]])', 'True'),
        t.eq('is_connected(3, [[0, 1]])', 'False'),
        t.hidden('is_connected(0, [])', 'True'),
        t.hidden('is_connected(1, [])', 'True'),
        t.hidden('is_connected(4, [[0, 1], [2, 3]])', 'False'),
      ],
      hints: ['Traverse from node 0 and compare len(visited) with n.'],
      signature: 'components:is-connected',
      minutes: 6,
    }),
    code({
      id: 'o8-c-sizes',
      title: 'Component sizes',
      skills: ['connected_components', 'graph_dfs', 'sorting'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'Write `component_sizes(n, edges)`: the size of each connected component, sorted from largest to smallest. Recursive DFS this time; have it return the size of what it explored.',
      starterCode: 'def component_sizes(n, edges):\n    pass\n',
      solution: `def component_sizes(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    visited = set()

    def dfs(node):
        visited.add(node)
        size = 1
        for nxt in graph[node]:
            if nxt not in visited:
                size += dfs(nxt)
        return size

    sizes = []
    for node in range(n):
        if node not in visited:
            sizes.append(dfs(node))
    return sorted(sizes, reverse=True)
`,
      tests: [
        t.eq('component_sizes(6, [[0, 1], [1, 2], [3, 4]])', '[3, 2, 1]'),
        t.eq('component_sizes(3, [])', '[1, 1, 1]'),
        t.hidden('component_sizes(0, [])', '[]'),
        t.hidden('component_sizes(4, [[0, 1], [1, 2], [2, 0], [3, 3]])', '[3, 1]'),
      ],
      hints: [
        'dfs returns 1 for itself plus what each unvisited neighbor returns, the same shape as counting tree nodes.',
        'Collect one size per outer-loop start, then sorted(..., reverse=True).',
      ],
      signature: 'components:sizes',
      minutes: 9,
    }),
    code({
      id: 'o8-c-friend-groups',
      title: 'Friend groups by name',
      skills: ['connected_components', 'graph_adjacency', 'graph_bfs'],
      stage: 'pattern',
      repType: 'pattern',
      difficulty: 3,
      prompt: 'Write `friend_groups(names, pairs)`: group people into friend circles (friendship is mutual and transitive through friends of friends). Return a list of groups, each a sorted list of names. Any group order is accepted.',
      solution: `from collections import deque

def friend_groups(names, pairs):
    graph = {name: [] for name in names}
    for a, b in pairs:
        graph[a].append(b)
        graph[b].append(a)
    visited = set()
    groups = []
    for name in names:
        if name in visited:
            continue
        visited.add(name)
        q = deque([name])
        group = []
        while q:
            person = q.popleft()
            group.append(person)
            for other in graph[person]:
                if other not in visited:
                    visited.add(other)
                    q.append(other)
        groups.append(sorted(group))
    return groups
`,
      tests: [
        t.eq('friend_groups(["ann", "bo", "cy", "di"], [["ann", "bo"], ["cy", "bo"]])', '[["ann", "bo", "cy"], ["di"]]', { compare: 'sorted-inner' }),
        t.hidden('friend_groups([], [])', '[]', { compare: 'sorted-inner' }),
        t.hidden('friend_groups(["a", "b"], [])', '[["a"], ["b"]]', { compare: 'sorted-inner' }),
        t.hidden('friend_groups(["a", "b", "c", "d"], [["d", "a"], ["b", "c"]])', '[["a", "d"], ["b", "c"]]', { compare: 'sorted-inner' }),
      ],
      hints: [
        'Same outer loop, but collect the members of each traversal instead of just counting.',
        'Build from names so friendless people still form a group of one.',
      ],
      signature: 'components:groups-named',
      minutes: 10,
    }),
  ],
}

const provincesCap = {
  id: 'o8-cap-provinces',
  title: 'Number of Provinces',
  summary: 'Capstone: components when the graph arrives as a matrix.',
  exercises: [
    capstone({
      id: 'cap-number-of-provinces',
      title: 'Count the provinces',
      problemId: 'number-of-provinces',
      skills: ['connected_components', 'graph_dfs', 'visited_set'],
      prompt: 'There are `n` cities. `is_connected` is an n x n matrix where `is_connected[i][j] == 1` means cities i and j have a direct road (the matrix is symmetric and `is_connected[i][i] == 1`). Cities linked directly or through other cities form one province. Return the number of provinces.',
      starterCode: `from typing import List

def find_circle_num(is_connected: List[List[int]]) -> int:
    pass
`,
      solution: `from typing import List

def find_circle_num(is_connected: List[List[int]]) -> int:
    n = len(is_connected)
    visited = set()
    count = 0
    for city in range(n):
        if city in visited:
            continue
        count += 1
        visited.add(city)
        stack = [city]
        while stack:
            cur = stack.pop()
            for other in range(n):
                if is_connected[cur][other] == 1 and other not in visited:
                    visited.add(other)
                    stack.append(other)
    return count
`,
      examples: [
        { input: 'is_connected = [[1,1,0],[1,1,0],[0,0,1]]', output: '2' },
        { input: 'is_connected = [[1,0,0],[0,1,0],[0,0,1]]', output: '3' },
        { input: 'is_connected = [[1]]', output: '1' },
      ],
      tests: [
        t.eq('find_circle_num([[1, 1, 0], [1, 1, 0], [0, 0, 1]])', '2'),
        t.eq('find_circle_num([[1, 0, 0], [0, 1, 0], [0, 0, 1]])', '3'),
        t.eq('find_circle_num([[1]])', '1'),
        t.hidden('find_circle_num([[1, 1], [1, 1]])', '1'),
        t.hidden('find_circle_num([[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1]])', '1'),
        t.hidden('find_circle_num([[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]])', '2'),
        t.hidden('find_circle_num([[1, 0, 0, 0, 1], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [1, 0, 0, 0, 1]])', '4'),
        t.hidden('find_circle_num([[1, 1, 1], [1, 1, 1], [1, 1, 1]])', '1'),
      ],
      hints: [
        'A province is a connected component. Count traversal starts.',
        'You do not need an adjacency list: row cur of the matrix already lists its neighbors.',
        'Outer loop over cities with a shared visited set; inner traversal loops for other in range(n) and follows is_connected[cur][other] == 1.',
        'For each unvisited city: count += 1, push it, pop and push every unvisited other with a 1 in the row, marking as you push. Return count.',
      ],
      complexity: { time: 'O(n²): each city\'s row is scanned once', space: 'O(n) for visited and the stack' },
      explanation: 'Each outer-loop start marks one whole province, so the number of starts equals the number of provinces. Reading the matrix row by row is O(n²), which is the input size.',
      signature: 'capstone:number-of-provinces',
      minutes: 25,
    }),
    explain({
      id: 'o8-explain-provinces',
      title: 'Explain provinces',
      skills: ['explanation', 'complexity'],
      prompt: 'Explain your provinces solution, and compare it with counting islands and with an edge-list components problem.',
      rubric: [
        'Provinces are connected components; count how many traversals the outer loop starts',
        'Shared visited set across starts so each city is processed once',
        'Neighbors come from scanning row i of the matrix (no adjacency list needed)',
        'O(n²) time because the matrix has n² entries; O(n) extra space',
        'Same skeleton as islands (cells as nodes) and edge-list components (adjacency list), only "get neighbors" changes',
      ],
      signature: 'explain:number-of-provinces',
      minutes: 6,
    }),
  ],
}

const cycles = {
  id: 'o8-cycles',
  title: 'Directed cycles',
  summary: 'Three states: unvisited (0), on the current path (1), done (2). Reaching a 1 means a cycle.',
  exercises: [
    choice({
      id: 'o8-y-states',
      title: 'The three states',
      skills: ['cycle_detection'],
      prompt: 'In three-state DFS, what does state `1` (visiting) mean for a node?',
      options: [
        'Its DFS call has started but not returned: it is on the current path',
        'It has been fully explored and is known safe',
        'It has never been reached',
        'It has exactly one outgoing edge',
      ],
      answer: 0,
      note: '```python\n# 0 = unvisited, 1 = visiting (on path), 2 = done\nstate[node] = 1\nfor nxt in graph[node]: ...\nstate[node] = 2\n```',
      explanation: 'A node is 1 from entering its DFS call until returning. If DFS meets a 1, it has walked back onto its own path: a cycle. Meeting a 2 is fine, that branch was already fully checked.',
      signature: 'cycle:states',
      important: true,
    }),
    output({
      id: 'o8-y-trace-naive',
      title: 'The two-state bug',
      skills: ['cycle_detection', 'visited_set'],
      prompt: 'A naive detector says "cycle" whenever it meets a visited node. The graph is the diamond 0 → 1, 0 → 2, 1 → 3, 2 → 3 (no cycle). What prints?',
      code: `graph = {0: [1, 2], 1: [3], 2: [3], 3: []}
visited = set()

def naive(node):
    if node in visited:
        return True
    visited.add(node)
    for nxt in graph[node]:
        if naive(nxt):
            return True
    return False

print(naive(0))
`,
      expectedOutput: 'True',
      explanation: '3 is visited via 1, finished, then reached again via 2. The naive version cannot tell "finished on another branch" from "on my current path", so it reports a false cycle.',
      signature: 'trace:cycle-naive',
      minutes: 2,
    }),
    output({
      id: 'o8-y-trace-states',
      title: 'Trace three states',
      skills: ['cycle_detection', 'graph_dfs'],
      prompt: 'Same diamond plus a printout. What prints?',
      code: `graph = {0: [1, 2], 1: [3], 2: [3], 3: []}
state = [0] * 4

def dfs(node):
    if state[node] == 1:
        return True
    if state[node] == 2:
        return False
    state[node] = 1
    for nxt in graph[node]:
        if dfs(nxt):
            return True
    state[node] = 2
    print("done", node)
    return False

print(dfs(0))
`,
      expectedOutput: 'done 3\ndone 1\ndone 2\ndone 0\nFalse',
      explanation: 'When 2 reaches 3, state[3] is 2 (done), not 1, so no cycle. Nodes finish in post-order: children before parents.',
      signature: 'trace:cycle-states',
      minutes: 3,
      difficulty: 2,
    }),
    choice({
      id: 'o8-y-direction',
      title: 'Which way do prerequisite edges point?',
      skills: ['cycle_detection', 'graph_adjacency'],
      prompt: 'Pairs `[a, b]` mean "take b before a". You build edges b → a. A friend builds a → b instead. For the question "is there a cycle?", who is right?',
      options: [
        'Both: reversing every edge keeps every cycle a cycle',
        'Only b → a works',
        'Only a → b works',
        'Neither: prerequisite graphs must be undirected',
      ],
      answer: 0,
      explanation: 'A cycle reversed is still a cycle, so either convention answers "is it possible?". Direction does matter if you need an actual order, so pick one and say it out loud.',
      signature: 'cycle:edge-direction',
    }),
    fill({
      id: 'o8-y-fill',
      title: 'Fill the state checks',
      skills: ['cycle_detection'],
      prompt: 'Fill the three blanks: the cycle check, entering the path, and leaving it.',
      starterCode: `def has_cycle(graph, n):
    state = [0] * n

    def dfs(node):
        if ____:
            return True
        if state[node] == 2:
            return False
        ____
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        ____
        return False

    return any(dfs(i) for i in range(n))
`,
      solution: `def has_cycle(graph, n):
    state = [0] * n

    def dfs(node):
        if state[node] == 1:
            return True
        if state[node] == 2:
            return False
        state[node] = 1
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        state[node] = 2
        return False

    return any(dfs(i) for i in range(n))
`,
      tests: [
        t.eq('has_cycle({0: [1], 1: [2], 2: [0]}, 3)', 'True'),
        t.eq('has_cycle({0: [1, 2], 1: [3], 2: [3], 3: []}, 4)', 'False'),
        t.hidden('has_cycle({0: [0]}, 1)', 'True'),
      ],
      signature: 'cycle:fill-states',
      minutes: 2.5,
      important: true,
    }),
    reorder({
      id: 'o8-y-reorder',
      title: 'Rebuild three-state DFS',
      skills: ['cycle_detection', 'graph_dfs'],
      prompt: 'Order the lines of a directed cycle check over nodes `0..n-1`.',
      lines: [
        'def cyclic(graph, n):',
        '    state = [0] * n',
        '    def dfs(node):',
        '        if state[node] == 1:',
        '            return True',
        '        if state[node] == 2:',
        '            return False',
        '        state[node] = 1',
        '        for nxt in graph[node]:',
        '            if dfs(nxt):',
        '                return True',
        '        state[node] = 2',
        '        return False',
        '    for i in range(n):',
        '        if dfs(i):',
        '            return True',
        '    return False',
      ],
      tests: [t.eq('cyclic({0: [1], 1: [0]}, 2)', 'True'), t.hidden('cyclic({0: [1], 1: []}, 2)', 'False')],
      signature: 'reorder:cycle-states',
      minutes: 3,
    }),
    code({
      id: 'o8-y-has-cycle',
      title: 'Directed cycle from edges',
      skills: ['cycle_detection', 'graph_adjacency', 'graph_dfs'],
      stage: 'microbuild',
      difficulty: 3,
      prompt: 'Nodes `0..n-1`, directed edges `[a, b]` meaning a → b. Write `has_cycle(n, edges)` with three-state DFS. Start a DFS from every node, since the graph may be disconnected.',
      starterCode: 'def has_cycle(n, edges):\n    pass\n',
      solution: `def has_cycle(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
    state = [0] * n

    def dfs(node):
        if state[node] == 1:
            return True
        if state[node] == 2:
            return False
        state[node] = 1
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        state[node] = 2
        return False

    for i in range(n):
        if dfs(i):
            return True
    return False
`,
      tests: [
        t.eq('has_cycle(3, [[0, 1], [1, 2], [2, 0]])', 'True'),
        t.eq('has_cycle(4, [[0, 1], [0, 2], [1, 3], [2, 3]])', 'False'),
        t.hidden('has_cycle(1, [])', 'False'),
        t.hidden('has_cycle(1, [[0, 0]])', 'True'),
        t.hidden('has_cycle(5, [[0, 1], [3, 4], [4, 3]])', 'True'),
        t.hidden('has_cycle(2, [[0, 1], [0, 1]])', 'False'),
      ],
      hints: [
        'Directed: one append per edge.',
        'state list of 0s; dfs returns True if it finds a cycle.',
        'Hit a 1 → cycle. Hit a 2 → already checked, return False. Otherwise mark 1, recurse, mark 2.',
      ],
      complexity: { time: 'O(V + E)', space: 'O(V + E)' },
      signature: 'cycle:has-cycle-edges',
      minutes: 9,
      important: true,
    }),
    code({
      id: 'o8-y-reachable-cycle',
      title: 'Can this start loop forever?',
      skills: ['cycle_detection', 'graph_dfs'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      prompt: 'A state machine is a directed graph given as a dict of lists (keys are strings). Write `can_loop(graph, start)`: `True` if following edges from `start` can lead into a cycle. Use a dict for states instead of a list.',
      starterCode: 'def can_loop(graph, start):\n    pass\n',
      solution: `def can_loop(graph, start):
    state = {}

    def dfs(node):
        s = state.get(node, 0)
        if s == 1:
            return True
        if s == 2:
            return False
        state[node] = 1
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        state[node] = 2
        return False

    return dfs(start)
`,
      tests: [
        t.eq('can_loop({"idle": ["run"], "run": ["stop"], "stop": []}, "idle")', 'False'),
        t.eq('can_loop({"a": ["b"], "b": ["c"], "c": ["b"]}, "a")', 'True'),
        t.hidden('can_loop({"a": ["b"], "b": [], "c": ["c"]}, "a")', 'False'),
        t.hidden('can_loop({"x": ["x"]}, "x")', 'True'),
        t.hidden('can_loop({"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}, "a")', 'False'),
      ],
      hints: ['state.get(node, 0) gives "unvisited" for nodes you have not seen yet.'],
      signature: 'cycle:reachable-from-start',
      minutes: 8,
    }),
    choice({
      id: 'o8-y-kahn',
      title: 'The in-degree alternative',
      skills: ['cycle_detection', 'graph_bfs'],
      prompt: 'Kahn\'s algorithm repeatedly removes nodes with in-degree 0 (using a queue) and lowers their neighbors\' in-degrees. How does it reveal a cycle?',
      options: [
        'Fewer than n nodes ever get removed: nodes on a cycle never reach in-degree 0',
        'The queue becomes infinite',
        'Some node\'s in-degree goes negative',
        'It removes the same node twice',
      ],
      answer: 0,
      explanation: 'Every node on a cycle waits on another node of the same cycle, so none of them reaches in-degree 0. Good to name in an interview as the BFS alternative; today\'s main tool is three-state DFS.',
      signature: 'cycle:kahn-idea',
    }),
  ],
}

const courseCap = {
  id: 'o8-cap-course-schedule',
  title: 'Course Schedule',
  summary: 'Capstone: prerequisites form a directed graph; finishing is possible iff there is no cycle.',
  exercises: [
    capstone({
      id: 'cap-course-schedule',
      title: 'Can every course be finished?',
      problemId: 'course-schedule',
      skills: ['cycle_detection', 'graph_adjacency', 'graph_dfs'],
      difficulty: 4,
      prompt: 'You must take `num_courses` courses labeled `0..num_courses-1`. Each pair `[a, b]` in `prerequisites` says course `b` must be completed before course `a`. Return `True` if there is some order that completes every course, `False` if the requirements make that impossible.',
      starterCode: `from typing import List

def can_finish(num_courses: int, prerequisites: List[List[int]]) -> bool:
    pass
`,
      solution: `from typing import List

def can_finish(num_courses: int, prerequisites: List[List[int]]) -> bool:
    graph = {i: [] for i in range(num_courses)}
    for a, b in prerequisites:
        graph[b].append(a)
    state = [0] * num_courses

    def dfs(node):
        if state[node] == 1:
            return True
        if state[node] == 2:
            return False
        state[node] = 1
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        state[node] = 2
        return False

    for course in range(num_courses):
        if dfs(course):
            return False
    return True
`,
      examples: [
        { input: 'num_courses = 2, prerequisites = [[1,0]]', output: 'True', note: 'take 0, then 1' },
        { input: 'num_courses = 2, prerequisites = [[1,0],[0,1]]', output: 'False', note: 'each waits on the other' },
        { input: 'num_courses = 3, prerequisites = []', output: 'True' },
      ],
      tests: [
        t.eq('can_finish(2, [[1, 0]])', 'True'),
        t.eq('can_finish(2, [[1, 0], [0, 1]])', 'False'),
        t.eq('can_finish(3, [])', 'True'),
        t.hidden('can_finish(1, [])', 'True'),
        t.hidden('can_finish(1, [[0, 0]])', 'False'),
        t.hidden('can_finish(4, [[1, 0], [2, 0], [3, 1], [3, 2]])', 'True'),
        t.hidden('can_finish(4, [[1, 0], [2, 1], [3, 2], [1, 3]])', 'False'),
        t.hidden('can_finish(5, [[1, 0], [0, 1], [3, 4]])', 'False'),
        t.hidden('can_finish(3, [[0, 1], [0, 2], [1, 2]])', 'True'),
        t.hidden('can_finish(6, [[1, 0], [2, 1], [3, 2], [4, 3], [5, 4]])', 'True'),
      ],
      hints: [
        'Model courses as nodes and "b before a" as a directed edge. When is an order impossible?',
        'It is impossible exactly when the directed graph has a cycle. Build an adjacency list with one append per pair.',
        'Three-state DFS: 0 unvisited, 1 on the current path, 2 done. Reaching a 1 means a cycle.',
        'Build graph; state = [0] * n; dfs marks 1, recurses into neighbors (cycle → True), marks 2. Run dfs from every course; any cycle → return False; else True.',
      ],
      complexity: { time: 'O(V + E): each course finishes once, each edge followed once', space: 'O(V + E) for the graph, states and recursion' },
      explanation: 'An order exists iff the prerequisite graph is acyclic. A node in state 1 is on the current DFS path, so an edge into it closes a loop; state 2 nodes are already proven cycle-free and are skipped, keeping the whole check linear.',
      signature: 'capstone:course-schedule',
      minutes: 30,
    }),
    explain({
      id: 'o8-explain-course-schedule',
      title: 'Explain course schedule',
      skills: ['explanation', 'cycle_detection', 'complexity'],
      prompt: 'Explain your course schedule solution as in an interview. Include why a plain visited set is not enough, and mention the alternative approach.',
      rubric: [
        'Reduce to cycle detection: an ordering exists iff the directed prerequisite graph has no cycle',
        'Three states: visiting means on the current path; reaching a visiting node is a back edge = cycle; done nodes are skipped',
        'A plain visited set gives false positives on diamonds (a node reached by two branches)',
        'O(V + E) time and space; DFS from every node because the graph may be disconnected',
        'Alternative: Kahn\'s algorithm with in-degrees and a queue; cycle iff fewer than n nodes are processed',
      ],
      signature: 'explain:course-schedule',
      minutes: 6,
    }),
  ],
}

const cold = {
  id: 'o8-cold',
  title: 'Cold reps',
  summary: 'Today\'s graph primitives from a blank editor.',
  exercises: [
    code({
      id: 'o8-cold-build',
      title: 'Adjacency from memory',
      skills: ['graph_adjacency'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `adj(n, edges, directed)`: an adjacency dict for nodes `0..n-1`. If `directed` is `False`, add both directions.',
      solution: `def adj(n, edges, directed):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        if not directed:
            graph[b].append(a)
    return graph
`,
      tests: [
        t.eq('adj(3, [[0, 1]], False)', '{0: [1], 1: [0], 2: []}'),
        t.eq('adj(3, [[0, 1]], True)', '{0: [1], 1: [], 2: []}'),
        t.hidden('adj(0, [], True)', '{}'),
      ],
      signature: 'adjacency:build-flag',
      minutes: 4,
    }),
    code({
      id: 'o8-cold-components',
      title: 'Components, cold',
      skills: ['connected_components', 'graph_dfs', 'visited_set'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Write `num_groups(n, edges)`: the number of connected components of an undirected graph on `0..n-1`. Any traversal.',
      solution: `def num_groups(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    visited = set()
    count = 0
    for s in range(n):
        if s in visited:
            continue
        count += 1
        visited.add(s)
        stack = [s]
        while stack:
            node = stack.pop()
            for nxt in graph[node]:
                if nxt not in visited:
                    visited.add(nxt)
                    stack.append(nxt)
    return count
`,
      tests: [
        t.eq('num_groups(4, [[0, 1], [2, 3]])', '2'),
        t.hidden('num_groups(3, [])', '3'),
        t.hidden('num_groups(0, [])', '0'),
        t.hidden('num_groups(5, [[0, 1], [1, 2], [2, 3], [3, 4]])', '1'),
      ],
      signature: 'components:count',
      minutes: 7,
    }),
    code({
      id: 'o8-cold-cycle',
      title: 'Cycle check, cold',
      skills: ['cycle_detection'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Directed graph as a dict of lists over nodes `0..n-1` (every node has a key). Write `cyclic(graph)`: `True` if it has a cycle. Three states.',
      solution: `def cyclic(graph):
    state = {node: 0 for node in graph}

    def dfs(node):
        if state[node] == 1:
            return True
        if state[node] == 2:
            return False
        state[node] = 1
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        state[node] = 2
        return False

    return any(dfs(node) for node in graph)
`,
      tests: [
        t.eq('cyclic({0: [1], 1: [2], 2: [0]})', 'True'),
        t.eq('cyclic({0: [1, 2], 1: [2], 2: []})', 'False'),
        t.hidden('cyclic({})', 'False'),
        t.hidden('cyclic({0: [], 1: [1]})', 'True'),
      ],
      signature: 'cycle:has-cycle-dict',
      minutes: 7,
    }),
    choice({
      id: 'o8-cold-which-tool',
      title: 'Pick the tool',
      skills: ['graph_bfs', 'cycle_detection', 'connected_components'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: '"Given a list of one-way flights, can a traveler starting anywhere end up flying in circles forever?" Which technique?',
      options: [
        'Directed cycle detection (three-state DFS or Kahn\'s in-degrees)',
        'BFS shortest path',
        'Counting connected components with a plain visited set',
        'Binary search on the flight list',
      ],
      answer: 0,
      explanation: 'One-way flights form a directed graph; flying in circles forever is a directed cycle.',
      signature: 'graph:pick-tool',
    }),
    code({
      id: 'o8-cold-grid-steps',
      title: 'Grid BFS, two days later',
      skills: ['bfs', 'grid_neighbors', 'visited_set'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Yesterday\'s skill, cold. Strings grid with `"."` open and `"#"` wall. Write `steps(grid, start, goal)` where `start`/`goal` are `(r, c)` tuples: fewest 4-directional moves, or `-1`. Assume `start` is open.',
      solution: `from collections import deque

def steps(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    visited = {start}
    q = deque([(start[0], start[1], 0)])
    while q:
        r, c, d = q.popleft()
        if (r, c) == goal:
            return d
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in visited:
                visited.add((nr, nc))
                q.append((nr, nc, d + 1))
    return -1
`,
      tests: [
        t.eq('steps([".#.", "...", ".#."], (0, 0), (0, 2))', '4'),
        t.hidden('steps(["."], (0, 0), (0, 0))', '0'),
        t.hidden('steps([".#", "#."], (0, 0), (1, 1))', '-1'),
        t.hidden('steps(["....", "##.#", "...."], (0, 0), (2, 0))', '6'),
      ],
      signature: 'grid-bfs:shortest-steps',
      minutes: 9,
    }),
  ],
}

export const day: DayModule = {
  date: '2026-10-08',
  short: 'Graphs',
  title: 'Graphs: adjacency, DFS, BFS',
  focus: 'Turn edge lists into adjacency lists, traverse with DFS and BFS using a visited set, count components, and detect directed cycles with three-state DFS.',
  sections: [warmup, adjacency, graphDfs, graphBfs, visitedReasoning, pathExistsCap, components, provincesCap, cycles, courseCap, cold],
  capstones: ['path-exists', 'number-of-provinces', 'course-schedule'],
}
