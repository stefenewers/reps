import type { DayModule } from '@/lib/types'
import { capstone, debug, explain, output, t, write } from './build'

/**
 * October 8: Graphs.
 * edge list → adjacency list → graph DFS (recursive + stack) → graph BFS
 * → Path Exists → components → Provinces
 * → directed cycles (three-state DFS, Kahn) → Course Schedule.
 *
 * Code-first: one trace per construct, then write reps in different shapes,
 * Debug Reps on the classic graph slips, and cold rewrites from signatures.
 */

const warmup = {
  id: 'o8-warmup',
  title: 'Warm-up',
  summary: 'Cold reps on grids, windows, linked lists and tree DFS.',
  exercises: [
    write({
      id: 'o8-wu-open-neighbors',
      title: 'Open neighbors',
      skills: ['grid_neighbors', 'grid_nested'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Ints grid: `0` open, `1` wall. Write `open_neighbors(grid, r, c)` returning the open 4-neighbors of `(r, c)` as `(r, c)` tuples, in the order up, down, left, right.',
      starterCode: 'def open_neighbors(grid, r, c):\n    pass\n',
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
      minutes: 6,
    }),
    write({
      id: 'o8-wu-longest-unique',
      title: 'Longest run without repeats',
      skills: ['sliding_window', 'window_state'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Write `longest_unique(s)`: the length of the longest substring with no repeated character. Variable-size window with a set.',
      starterCode: 'def longest_unique(s):\n    pass\n',
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
      minutes: 7,
    }),
    write({
      id: 'o8-wu-reverse-list',
      title: 'Reverse a linked list',
      skills: ['linked_list_reassignment', 'linked_list_traversal'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `reverse(head)` returning the head of the reversed list. Iterative, O(1) extra space.',
      starterCode: 'def reverse(head):\n    pass\n',
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
      minutes: 5,
    }),
    write({
      id: 'o8-wu-path-sum',
      title: 'Root-to-leaf sum',
      skills: ['tree_dfs', 'recursion_base_case'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `has_path_sum(root, target)`: `True` if some root-to-leaf path adds up to `target`. Empty tree → `False`.',
      starterCode: 'def has_path_sum(root, target):\n    pass\n',
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
      minutes: 5,
    }),
  ],
}

const adjacency = {
  id: 'o8-adjacency',
  title: 'Adjacency lists',
  summary: 'Turn an edge list into a dict of neighbor lists, including nodes with no edges.',
  exercises: [
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
      note: 'Adjacency list: `graph[node]` is the list of nodes it connects to. Undirected edges go into both lists; directed edges only into `graph[a]`.',
      explanation: 'Each undirected edge is appended twice, once per endpoint. Node 3 has no edges but still has an entry because the dict was pre-filled for every node.',
      signature: 'trace:adjacency-build',
      minutes: 2,
    }),
    write({
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
      hints: ['Pre-fill with {i: [] for i in range(n)}, then two appends per edge.'],
      signature: 'adjacency:build-undirected',
      minutes: 5,
      important: true,
    }),
    debug({
      id: 'o8-a-dbg-one-way',
      title: 'Debug: friends of a node',
      skills: ['graph_adjacency'],
      prompt: 'Edges are **undirected**. `neighbors_of(n, edges, node)` should return the sorted neighbors of `node` in a graph on `0..n-1`. Make the tests pass.',
      brokenCode: `def neighbors_of(n, edges, node):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
    return sorted(graph[node])
`,
      solution: `def neighbors_of(n, edges, node):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    return sorted(graph[node])
`,
      tests: [
        t.eq('neighbors_of(3, [[0, 1], [1, 2]], 1)', '[0, 2]'),
        t.eq('neighbors_of(3, [[0, 1], [1, 2]], 0)', '[1]'),
        t.hidden('neighbors_of(4, [[3, 0], [0, 2]], 0)', '[2, 3]'),
      ],
      hints: ['Edge [0, 1] means 1 is a neighbor of 0 and 0 is a neighbor of 1.'],
      explanation: 'An undirected edge belongs in both lists. Forgetting the second append silently turns the graph directed.',
      signature: 'debug:adjacency-one-way',
      minutes: 3,
    }),
    write({
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
      explanation: 'Directed edges go one way. Adding both directions would turn a one-way street into a two-way one and invent cycles.',
      signature: 'adjacency:build-directed',
      minutes: 4,
    }),
    debug({
      id: 'o8-a-dbg-shared-list',
      title: 'Debug: everyone has the same friends',
      skills: ['graph_adjacency', 'dict_create'],
      prompt: '`build(n, edges)` should return an undirected adjacency dict for nodes `0..n-1`, every node with its own list. Make the tests pass.',
      brokenCode: `def build(n, edges):
    graph = dict.fromkeys(range(n), [])
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    return graph
`,
      solution: `def build(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    return graph
`,
      tests: [
        t.eq('build(3, [[0, 1]])', '{0: [1], 1: [0], 2: []}'),
        t.eq('build(2, [])', '{0: [], 1: []}'),
        t.hidden('build(3, [[0, 1], [1, 2]])', '{0: [1], 1: [0, 2], 2: [1]}'),
      ],
      hints: ['How many list objects does dict.fromkeys(range(n), []) create?'],
      explanation: 'dict.fromkeys uses the same default object for every key, so all nodes share one list. The comprehension creates a new list per key.',
      signature: 'debug:adjacency-shared-list',
      minutes: 3,
    }),
    write({
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
      explanation: 'A node with in-degree 0 has no prerequisites. That idea powers Kahn\'s algorithm, which you will write later today.',
      signature: 'adjacency:in-degree',
      minutes: 4,
    }),
    write({
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
      minutes: 6,
    }),
  ],
}

const graphDfs = {
  id: 'o8-dfs',
  title: 'Graph DFS',
  summary: 'Recursive and stack DFS over an adjacency list, with a visited set.',
  exercises: [
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
      note: 'Unlike trees, graphs can lead back to where you came from (every undirected edge is a 2-cycle). The visited set makes each node processed once.',
      explanation: 'DFS follows 0 → 1 → 3 as deep as possible; from 3 it reaches 2 before backtracking. By the time 0 tries 2, it is already visited.',
      signature: 'trace:graph-dfs-recursive',
      minutes: 2.5,
    }),
    write({
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
      minutes: 8,
      important: true,
    }),
    debug({
      id: 'o8-v-fix-bounce',
      title: 'Debug: the bouncing DFS',
      skills: ['visited_set', 'graph_dfs'],
      prompt: '`count_from(graph, start)` should return how many nodes are reachable from `start` in an undirected graph, counting each node once. Keep it recursive. Make the tests pass.',
      brokenCode: `def count_from(graph, start):
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
      hints: ['Follow the calls on the first test: 0 → 1 → 0 → 1 …', 'Mark the node on entry, and only recurse into neighbors not yet marked.'],
      explanation: 'In the triangle, without "if nxt not in visited" node 2 would be counted twice (via 0 and via 1) even if the recursion stopped. Visited both terminates the search and prevents double counting.',
      signature: 'graph-dfs:fix-visited',
      minutes: 5,
      important: true,
    }),
    write({
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
      minutes: 8,
      important: true,
    }),
    write({
      id: 'o8-d-translate',
      title: 'Translate: stack to recursion',
      skills: ['graph_dfs', 'recursion_base_case', 'visited_set'],
      style: 'translate',
      prompt: 'Below is an iterative DFS. Under it, write `component_of_rec(graph, start)` that returns the same sorted list using a recursive inner `dfs(node)` instead of a stack.',
      starterCode: `def component_of(graph, start):
    visited = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return sorted(visited)


def component_of_rec(graph, start):
    pass
`,
      solution: `def component_of(graph, start):
    visited = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return sorted(visited)


def component_of_rec(graph, start):
    visited = set()

    def dfs(node):
        visited.add(node)
        for nxt in graph[node]:
            if nxt not in visited:
                dfs(nxt)

    dfs(start)
    return sorted(visited)
`,
      tests: [
        t.eq('component_of_rec({0: [1], 1: [0, 2], 2: [1], 3: []}, 0)', '[0, 1, 2]'),
        t.eq('component_of_rec({0: [1], 1: [0], 2: []}, 2)', '[2]'),
        t.hidden('component_of_rec({"a": ["b"], "b": ["a", "c"], "c": ["b"]}, "c")', '["a", "b", "c"]'),
      ],
      hints: ['The stack disappears: each push becomes a recursive call.', 'Mark on entry to dfs; recurse only into unvisited neighbors.'],
      explanation: 'The call stack does the job of the explicit stack. Same set of nodes; the recursive version is shorter, the iterative one is safe on very deep graphs.',
      signature: 'graph-dfs:translate-stack-to-recursive',
      minutes: 7,
    }),
    write({
      id: 'o8-v-optimize-list',
      title: 'Optimize: visited as a list',
      skills: ['visited_set', 'set_membership', 'graph_dfs'],
      style: 'optimize',
      prompt: '`count_reachable_slow` is correct, but `visited` is a list, so every `nxt not in visited` scans it: O(V) per check, O(V · E) overall. Below it, write `count_reachable(graph, start)` with the same result in O(V + E).',
      starterCode: `def count_reachable_slow(graph, start):
    visited = [start]
    stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.append(nxt)
                stack.append(nxt)
    return len(visited)


def count_reachable(graph, start):
    pass
`,
      solution: `def count_reachable_slow(graph, start):
    visited = [start]
    stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.append(nxt)
                stack.append(nxt)
    return len(visited)


def count_reachable(graph, start):
    visited = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return len(visited)
`,
      tests: [
        t.eq('count_reachable({0: [1], 1: [0, 2], 2: [1], 3: []}, 0)', '3'),
        t.eq('count_reachable({0: [1], 1: [0], 2: []}, 2)', '1'),
        t.hidden('count_reachable({i: [i + 1] for i in range(3000)} | {3000: []}, 0)', '3001'),
      ],
      hints: ['A set gives O(1) average membership. Seed it with {start} and use .add().'],
      explanation: 'The membership check runs once per edge, so its cost multiplies everything. With a set, the traversal is O(V + E).',
      signature: 'optimize:visited-set',
      minutes: 5,
    }),
    write({
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
      minutes: 11,
    }),
    debug({
      id: 'o8-d-dbg-directed-both',
      title: 'Debug: downstream count',
      skills: ['graph_adjacency', 'graph_dfs'],
      prompt: 'Pipes are **one-way**: `[a, b]` means water flows from a to b. `downstream(n, pipes, src)` should count the nodes water can reach from `src` (including `src`). Make the tests pass.',
      brokenCode: `def downstream(n, pipes, src):
    graph = {i: [] for i in range(n)}
    for a, b in pipes:
        graph[a].append(b)
        graph[b].append(a)
    visited = {src}
    stack = [src]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return len(visited)
`,
      solution: `def downstream(n, pipes, src):
    graph = {i: [] for i in range(n)}
    for a, b in pipes:
        graph[a].append(b)
    visited = {src}
    stack = [src]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    return len(visited)
`,
      tests: [
        t.eq('downstream(3, [[0, 1], [1, 2]], 0)', '3'),
        t.eq('downstream(3, [[0, 1], [1, 2]], 2)', '1'),
        t.hidden('downstream(4, [[0, 1], [2, 1], [1, 3]], 2)', '3'),
      ],
      hints: ['Can water at node 2 flow back up pipe [1, 2]?'],
      explanation: 'A directed edge gets exactly one append. Adding the reverse edge invents paths that do not exist.',
      signature: 'debug:directed-built-both-ways',
      minutes: 4,
    }),
    write({
      id: 'o8-d-path',
      title: 'Return an actual path',
      skills: ['graph_dfs', 'recursion_return', 'backtracking_state'],
      stage: 'combine',
      repType: 'combine',
      style: 'finish',
      difficulty: 3,
      prompt: 'Finish recursive `find_path(graph, start, target)`: return a list of nodes from `start` to `target` (any valid path, found by trying neighbors in list order), or `None` if unreachable.',
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
    write({
      id: 'o8-b-order',
      title: 'BFS order from scratch',
      skills: ['graph_bfs', 'queue_deque'],
      prompt: 'Write `bfs_order(graph, start)` returning nodes in BFS order, neighbors in list order. Same shape as yesterday\'s grid BFS, with `graph[node]` as the neighbors.',
      starterCode: 'def bfs_order(graph, start):\n    pass\n',
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
      hints: ['Import deque. Seed visited and the queue with start; mark on enqueue.'],
      signature: 'graph-bfs:order',
      minutes: 9,
      important: true,
    }),
    debug({
      id: 'o8-b-dbg-pop-end',
      title: 'Debug: nearest first?',
      skills: ['graph_bfs', 'queue_deque'],
      prompt: '`by_distance(graph, start)` should list the nodes reachable from `start` in BFS order: all nodes 1 edge away before any node 2 edges away, neighbors in list order. Make the tests pass.',
      brokenCode: `from collections import deque

def by_distance(graph, start):
    visited = {start}
    q = deque([start])
    order = []
    while q:
        node = q.pop()
        order.append(node)
        for nxt in graph[node]:
            if nxt not in visited:
                visited.add(nxt)
                q.append(nxt)
    return order
`,
      solution: `from collections import deque

def by_distance(graph, start):
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
        t.eq('by_distance({0: [1, 2], 1: [0, 3], 2: [0, 4], 3: [1], 4: [2]}, 0)', '[0, 1, 2, 3, 4]'),
        t.eq('by_distance({0: [1], 1: [0]}, 1)', '[1, 0]'),
        t.hidden('by_distance({"a": ["b", "c"], "b": ["a", "d"], "c": ["a"], "d": ["b"]}, "a")', '["a", "b", "c", "d"]'),
      ],
      hints: ['Which item does deque.pop() hand back: the oldest or the newest?'],
      explanation: 'pop() takes the newest item, turning the queue into a stack and BFS into DFS. Distance order needs popleft().',
      signature: 'debug:deque-pop-end',
      minutes: 4,
    }),
    write({
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
      minutes: 8,
    }),
    debug({
      id: 'o8-b-dbg-late-mark',
      title: 'Debug: distances that grow',
      skills: ['graph_bfs', 'visited_set'],
      prompt: '`hop_counts(graph, start)` should return a dict from each reachable node to its fewest-edges distance from `start`. Make the tests pass.',
      brokenCode: `from collections import deque

def hop_counts(graph, start):
    dist = {}
    q = deque([(start, 0)])
    while q:
        node, d = q.popleft()
        dist[node] = d
        for nxt in graph[node]:
            if nxt not in dist:
                q.append((nxt, d + 1))
    return dist
`,
      solution: `from collections import deque

def hop_counts(graph, start):
    dist = {start: 0}
    q = deque([(start, 0)])
    while q:
        node, d = q.popleft()
        for nxt in graph[node]:
            if nxt not in dist:
                dist[nxt] = d + 1
                q.append((nxt, d + 1))
    return dist
`,
      tests: [
        t.eq('hop_counts({0: [1, 2], 1: [0, 2], 2: [0, 1]}, 0)', '{0: 0, 1: 1, 2: 1}'),
        t.eq('hop_counts({0: [1], 1: [0]}, 0)', '{0: 0, 1: 1}'),
        t.hidden('hop_counts({0: [1, 2, 3], 1: [0, 4], 2: [0, 4], 3: [0, 4], 4: [1, 2, 3]}, 0)', '{0: 0, 1: 1, 2: 1, 3: 1, 4: 2}'),
      ],
      hints: [
        'In the triangle, how many times is node 2 enqueued, and with which distances?',
        'A node waiting in the queue is not in dist yet, so others enqueue it again.',
        'Record the distance when you enqueue, not when you pop.',
      ],
      explanation: 'Marking on pop lets a node be enqueued several times, and the later copy overwrites the shortest distance. Marking on enqueue keeps one copy, the first and shortest.',
      signature: 'debug:bfs-mark-late',
      minutes: 5,
      important: true,
    }),
    write({
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
      explanation: 'BFS explores in order of distance, so the first time it pops dst is along a shortest path. Reachability alone would not need BFS; "fewest" does.',
      signature: 'graph-bfs:fewest-edges',
      minutes: 13,
      important: true,
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
      minutes: 5,
    }),
  ],
}

const components = {
  id: 'o8-components',
  title: 'Components',
  summary: 'Count groups: start a traversal from every node not yet visited.',
  exercises: [
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
      note: 'Islands were components in disguise: cells were nodes and the directions list computed the edges. One shared visited set keeps the whole scan O(V + E).',
      explanation: 'Node 1 and 4 are already visited by the time the loop reaches them. Isolated nodes 2 and 5 are components of size one, which is why every node needs a key.',
      signature: 'trace:components',
      minutes: 2.5,
    }),
    write({
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
      minutes: 14,
      important: true,
    }),
    debug({
      id: 'o8-c-dbg-visited-reset',
      title: 'Debug: every node is its own group',
      skills: ['connected_components', 'visited_set'],
      prompt: '`count_groups(n, edges)` should count the connected components of an undirected graph on `0..n-1`. Make the tests pass.',
      brokenCode: `def count_groups(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    count = 0
    for start in range(n):
        visited = set()
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
      solution: `def count_groups(n, edges):
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
        t.eq('count_groups(3, [[0, 1]])', '2'),
        t.eq('count_groups(2, [])', '2'),
        t.hidden('count_groups(5, [[0, 1], [1, 2], [3, 4]])', '2'),
      ],
      hints: ['When node 1 comes up in the outer loop, does the code still remember that node 0\'s traversal reached it?'],
      explanation: 'The visited set must be shared across all starts. Recreating it per start forgets earlier traversals, so every node starts its own component (and the cost becomes O(V · (V + E))).',
      signature: 'debug:visited-reset-in-loop',
      minutes: 6,
      important: true,
    }),
    debug({
      id: 'o8-c-dbg-missing-isolated',
      title: 'Debug: the lonely nodes',
      skills: ['connected_components', 'graph_adjacency'],
      prompt: '`num_clusters(n, edges)` should count the connected components of an undirected graph on nodes `0..n-1`, where a node with no edges is a component by itself. Make the tests pass.',
      brokenCode: `def num_clusters(n, edges):
    graph = {}
    for a, b in edges:
        graph.setdefault(a, []).append(b)
        graph.setdefault(b, []).append(a)
    visited = set()
    count = 0
    for start in graph:
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
      solution: `def num_clusters(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    visited = set()
    count = 0
    for start in graph:
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
        t.eq('num_clusters(4, [[0, 1]])', '3'),
        t.eq('num_clusters(2, [[0, 1]])', '1'),
        t.hidden('num_clusters(3, [])', '3'),
        t.hidden('num_clusters(0, [])', '0'),
      ],
      hints: ['Which nodes end up as keys in graph?'],
      explanation: 'Building keys only from edges drops isolated nodes, and the outer loop never sees them. Pre-fill every node (or loop over range(n)).',
      signature: 'debug:adjacency-missing-isolated',
      minutes: 6,
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
      minutes: 5,
    }),
  ],
}

const cycles = {
  id: 'o8-cycles',
  title: 'Directed cycles',
  summary: 'Three states: unvisited (0), on the current path (1), done (2). Reaching a 1 means a cycle.',
  exercises: [
    output({
      id: 'o8-y-trace-states',
      title: 'Trace three states',
      skills: ['cycle_detection', 'graph_dfs'],
      prompt: 'A diamond: 0 → 1, 0 → 2, 1 → 3, 2 → 3 (no cycle). What prints?',
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
      note: '```python\n# 0 = unvisited, 1 = visiting (on path), 2 = done\nstate[node] = 1\nfor nxt in graph[node]: ...\nstate[node] = 2\n```',
      explanation: 'When 2 reaches 3, state[3] is 2 (done), not 1, so no cycle. Only meeting a node that is still on the current path (state 1) means a cycle.',
      signature: 'trace:cycle-states',
      minutes: 3,
      difficulty: 2,
    }),
    write({
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
      minutes: 14,
      important: true,
    }),
    debug({
      id: 'o8-y-dbg-no-visiting',
      title: 'Debug: the cycle nobody saw',
      skills: ['cycle_detection', 'visited_set'],
      prompt: '`has_loop(graph)` takes a directed graph (dict of lists, every node is a key) and should return `True` if it contains a cycle. Make the tests pass.',
      brokenCode: `def has_loop(graph):
    visited = set()

    def dfs(node):
        if node in visited:
            return False
        visited.add(node)
        for nxt in graph[node]:
            if dfs(nxt):
                return True
        return False

    for node in graph:
        if dfs(node):
            return True
    return False
`,
      solution: `def has_loop(graph):
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

    for node in graph:
        if dfs(node):
            return True
    return False
`,
      tests: [
        t.eq('has_loop({0: [1], 1: [0]})', 'True'),
        t.eq('has_loop({0: [1, 2], 1: [3], 2: [3], 3: []})', 'False'),
        t.hidden('has_loop({0: [0]})', 'True'),
        t.hidden('has_loop({"a": ["b"], "b": ["c"], "c": ["a"], "d": []})', 'True'),
      ],
      hints: [
        'A plain visited set answers "have I ever seen this node?". A cycle needs "is this node on my current path?".',
        'Track three states: unvisited, visiting (on the path), done.',
      ],
      explanation: 'With only "visited", reaching a node on the current path looks the same as reaching a finished one, so this version can never report a cycle. The visiting state is what detects the back edge.',
      signature: 'debug:cycle-no-visiting-state',
      minutes: 6,
      important: true,
    }),
    debug({
      id: 'o8-y-dbg-never-done',
      title: 'Debug: cycles that are not there',
      skills: ['cycle_detection', 'graph_dfs'],
      prompt: '`cyclic(n, edges)` should return `True` exactly when the directed graph on `0..n-1` (`[a, b]` = a → b) has a cycle. It reports cycles in some graphs that have none. Make the tests pass.',
      brokenCode: `def cyclic(n, edges):
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
        return False

    for i in range(n):
        if dfs(i):
            return True
    return False
`,
      solution: `def cyclic(n, edges):
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
        t.eq('cyclic(4, [[0, 1], [0, 2], [1, 3], [2, 3]])', 'False'),
        t.eq('cyclic(3, [[0, 1], [1, 2], [2, 0]])', 'True'),
        t.hidden('cyclic(2, [[0, 1]])', 'False'),
        t.hidden('cyclic(3, [[0, 1], [1, 2]])', 'False'),
      ],
      hints: ['In the diamond, what is state[3] when the branch through 2 reaches it?', 'When does a node stop being "on the current path"?'],
      explanation: 'A node must leave the visiting state (become done) when its DFS call returns. Otherwise any node reached twice looks like a back edge.',
      signature: 'debug:cycle-never-done',
      minutes: 5,
    }),
    write({
      id: 'o8-y-wt-diamond',
      title: 'Break it: the naive detector',
      skills: ['cycle_detection', 'visited_set'],
      style: 'write-test',
      prompt: '`naive_cycle` says "cycle" whenever it meets a node it has seen before. Write `breaking_graph()` returning a directed graph (dict of lists, every node a key) that has **no** cycle but on which `naive_cycle` returns `True`.',
      starterCode: `def naive_cycle(graph):
    seen = set()

    def dfs(node):
        if node in seen:
            return True
        seen.add(node)
        return any(dfs(nxt) for nxt in graph[node])

    return any(dfs(node) for node in graph if node not in seen)


def breaking_graph():
    pass
`,
      solution: `def naive_cycle(graph):
    seen = set()

    def dfs(node):
        if node in seen:
            return True
        seen.add(node)
        return any(dfs(nxt) for nxt in graph[node])

    return any(dfs(node) for node in graph if node not in seen)


def breaking_graph():
    graph = {0: [1, 2], 1: [3], 2: [3], 3: []}
    return graph
`,
      tests: [
        t.check(
          'acyclic, but the naive check says cycle',
          `g = breaking_graph()
def _true_cycle(graph):
    state = {k: 0 for k in graph}
    def dfs(u):
        if state[u] == 1:
            return True
        if state[u] == 2:
            return False
        state[u] = 1
        if any(dfs(v) for v in graph[u]):
            return True
        state[u] = 2
        return False
    return any(dfs(k) for k in graph)
assert isinstance(g, dict), "return a dict of lists"
assert not _true_cycle(g), "your graph really has a cycle"
assert naive_cycle(g), "the naive check gets this graph right"`,
        ),
      ],
      hints: ['Make one node reachable along two different paths.', 'A diamond: 0 → 1, 0 → 2, both → 3.'],
      explanation: 'Reaching a finished node again is not a cycle. Diamonds are the classic false positive for two-state detection.',
      signature: 'write-test:cycle-diamond',
      minutes: 4,
    }),
    write({
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
      minutes: 11,
    }),
    write({
      id: 'o8-y-kahn-write',
      title: 'Kahn\'s algorithm',
      skills: ['cycle_detection', 'graph_bfs', 'queue_deque'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 4,
      prompt: 'The BFS alternative to three-state DFS. Directed edges `[a, b]` mean a → b on nodes `0..n-1`. Write `can_order(n, edges)`: repeatedly remove a node with in-degree 0 (queue them), lowering its neighbors\' in-degrees. Return `True` if every node gets removed (no cycle).',
      starterCode: 'def can_order(n, edges):\n    pass\n',
      solution: `from collections import deque

def can_order(n, edges):
    graph = {i: [] for i in range(n)}
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    removed = 0
    while q:
        node = q.popleft()
        removed += 1
        for nxt in graph[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return removed == n
`,
      tests: [
        t.eq('can_order(4, [[0, 1], [0, 2], [1, 3], [2, 3]])', 'True'),
        t.eq('can_order(3, [[0, 1], [1, 2], [2, 0]])', 'False'),
        t.hidden('can_order(1, [])', 'True'),
        t.hidden('can_order(1, [[0, 0]])', 'False'),
        t.hidden('can_order(5, [[0, 1], [3, 4], [4, 3]])', 'False'),
        t.hidden('can_order(3, [[0, 1], [0, 1], [1, 2]])', 'True'),
      ],
      hints: [
        'Count in-degrees while building the graph.',
        'Seed the queue with every node whose in-degree is 0.',
        'Pop, count it, decrement each neighbor; a neighbor that drops to 0 joins the queue.',
        'Nodes on a cycle never reach in-degree 0, so removed < n means a cycle.',
      ],
      explanation: 'Every node on a cycle waits on another node of the same cycle, so none of them is ever freed. Removing nodes in queue order also yields a valid topological order.',
      complexity: { time: 'O(V + E)', space: 'O(V + E)' },
      signature: 'cycle:kahn',
      minutes: 15,
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
      minutes: 5,
    }),
  ],
}

const cold = {
  id: 'o8-cold',
  title: 'Cold reps',
  summary: 'Today\'s graph primitives from a bare signature.',
  exercises: [
    write({
      id: 'o8-cold-build',
      title: 'Adjacency from memory',
      skills: ['graph_adjacency'],
      stage: 'retrieval',
      repType: 'cold',
      prompt: 'Write `adj(n, edges, directed)`: an adjacency dict for nodes `0..n-1`. If `directed` is `False`, add both directions.',
      starterCode: 'def adj(n, edges, directed):\n    pass\n',
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
      minutes: 5,
    }),
    write({
      id: 'o8-cold-components',
      title: 'Components, cold',
      skills: ['connected_components', 'graph_dfs', 'visited_set'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Write `num_groups(n, edges)`: the number of connected components of an undirected graph on `0..n-1`. Any traversal.',
      starterCode: 'def num_groups(n, edges):\n    pass\n',
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
      minutes: 12,
    }),
    write({
      id: 'o8-cold-cycle',
      title: 'Cycle check, cold',
      skills: ['cycle_detection'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Directed graph as a dict of lists over nodes `0..n-1` (every node has a key). Write `cyclic(graph)`: `True` if it has a cycle. Three states.',
      starterCode: 'def cyclic(graph):\n    pass\n',
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
      minutes: 10,
    }),
    write({
      id: 'o8-cold-grid-steps',
      title: 'Grid BFS, a day later',
      skills: ['bfs', 'grid_neighbors', 'visited_set'],
      stage: 'retrieval',
      repType: 'cold',
      difficulty: 3,
      prompt: 'Yesterday\'s skill, cold. Strings grid with `"."` open and `"#"` wall. Write `steps(grid, start, goal)` where `start`/`goal` are `(r, c)` tuples: fewest 4-directional moves, or `-1`. Assume `start` is open.',
      starterCode: 'def steps(grid, start, goal):\n    pass\n',
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
      minutes: 13,
    }),
  ],
}

export const day: DayModule = {
  date: '2026-10-08',
  short: 'Graphs',
  title: 'Graphs: adjacency, DFS, BFS',
  focus: 'Turn edge lists into adjacency lists, traverse with DFS and BFS using a visited set, count components, and detect directed cycles with three-state DFS.',
  sections: [warmup, adjacency, graphDfs, graphBfs, pathExistsCap, components, provincesCap, cycles, courseCap, cold],
  capstones: ['path-exists', 'number-of-provinces', 'course-schedule'],
}
