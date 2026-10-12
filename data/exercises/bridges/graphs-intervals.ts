import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { debug, output, write, t } from '@/data/exercises/build'

const GRAPHS = '2026-10-08'
const HEAPS = '2026-10-09'

const NODE = `class Node:
    def __init__(self, val):
        self.val = val
        self.neighbors = []
`

// ── LC 133 Clone Graph ───────────────────────────────────────────────────────
const cloneGraph = [
  write({
    id: 'b133-copy-lists',
    title: 'Copy an adjacency dict',
    skills: ['graph_clone', 'graph_adjacency', 'dict_assign'],
    prompt:
      '`graph` is an adjacency dict: node → list of neighbours.\n\nWrite `copy_graph(graph)` that returns a **new** dict with a **new** list for every node, so changing the copy never changes the original.\n\n`copy_graph({1: [2], 2: [1]})` → `{1: [2], 2: [1]}` (equal, but none of the lists are shared)',
    starterCode: `def copy_graph(graph):
    pass`,
    solution: `def copy_graph(graph):
    out = {}
    for node, nbrs in graph.items():
        out[node] = list(nbrs)
    return out`,
    tests: [
      t.eq("copy_graph({'a': ['b'], 'b': ['a']})", "{'a': ['b'], 'b': ['a']}"),
      t.check(
        'changing the copy leaves the original alone',
        `g = {1: [2], 2: [1]}
c = copy_graph(g)
c[1].append(9)
assert g == {1: [2], 2: [1]}, 'appending to the copy changed the original'`,
      ),
      t.hidden('copy_graph({})', '{}'),
      t.check('no list is shared', `g = {0: [], 1: [0, 0]}
c = copy_graph(g)
assert c == g and c is not g
assert all(c[k] is not g[k] for k in g)`, true),
    ],
    hints: ['A new dict is not enough: each value is a list, and a list can be shared by two dicts.', '`list(x)` builds a new list with the same items.'],
    explanation: 'Copying a graph means copying every container in it. `dict(graph)` would give a new dict whose values are still the old lists.',
    signature: 'clone:adjacency-fresh-lists',
    minutes: 4,
  }),
  write({
    id: 'b133-copy-reachable',
    title: 'Copy only what you can reach',
    skills: ['graph_clone', 'graph_dfs', 'dict_membership'],
    difficulty: 3,
    prompt:
      '`graph` is an adjacency dict and `start` is one of its nodes.\n\nWrite `copy_from(graph, start)` that returns a new adjacency dict holding **only the nodes reachable from `start`**, each with its own new neighbour list. Let the dict you are building double as the visited set: a node is "seen" once it has an entry.\n\n`copy_from({1: [2], 2: [1, 3], 3: [2], 4: [5], 5: [4]}, 1)` → `{1: [2], 2: [1, 3], 3: [2]}`',
    starterCode: `def copy_from(graph, start):
    pass`,
    solution: `def copy_from(graph, start):
    copies = {}

    def visit(node):
        copies[node] = []
        for nxt in graph[node]:
            if nxt not in copies:
                visit(nxt)
            copies[node].append(nxt)

    visit(start)
    return copies`,
    tests: [
      t.eq('copy_from({1: [2], 2: [1, 3], 3: [2], 4: [5], 5: [4]}, 1)', '{1: [2], 2: [1, 3], 3: [2]}'),
      t.eq('copy_from({0: [1], 1: [2], 2: [0]}, 0)', '{0: [1], 1: [2], 2: [0]}'),
      t.hidden('copy_from({7: []}, 7)', '{7: []}'),
      t.hidden('copy_from({0: [0]}, 0)', '{0: [0]}'),
      t.hidden("copy_from({'a': ['b'], 'b': [], 'c': ['a']}, 'a')", "{'a': ['b'], 'b': []}"),
      t.check('new lists', `g = {0: [1], 1: [0]}
c = copy_from(g, 0)
assert c == g
assert c[0] is not g[0] and c[1] is not g[1]`, true),
    ],
    hints: [
      'One dict does two jobs: it is the result, and `node in copies` tells you a node was already started.',
      'Give the node its (still empty) entry **first**, then go through its neighbours.',
      'For each neighbour: visit it if it has no entry yet, then append it to this node’s new list.',
    ],
    explanation: 'The entry is created before the recursion, so when a cycle leads back to a node it is already "in" and the walk stops. That ordering is the whole trick of copying a graph.',
    signature: 'clone:reachable-dict-as-visited',
    minutes: 9,
    important: true,
  }),
  write({
    id: 'b133-twins-wire',
    title: 'Twins first, wires second',
    skills: ['graph_clone', 'dict_assign', 'dict_lookup'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt:
      'Now the nodes are objects. `nodes` is a list of **every** `Node` in a graph; each has `.val` and `.neighbors` (a list of other `Node` objects).\n\nWrite `clone_all(nodes)` that returns a list of copies in the same order. Pass 1: a dict from each original to a brand-new `Node` with the same `val`. Pass 2: fill each copy’s `neighbors` with **copies**, found through the dict.\n\nFor a ↔ b: `clone_all([a, b])` → `[a2, b2]` where `a2.neighbors == [b2]`, and neither is `a` or `b`.',
    starterCode: `${NODE}

def clone_all(nodes):
    pass`,
    solution: `${NODE}

def clone_all(nodes):
    twin = {}
    for node in nodes:
        twin[node] = Node(node.val)
    for node in nodes:
        for nbr in node.neighbors:
            twin[node].neighbors.append(twin[nbr])
    return [twin[node] for node in nodes]`,
    tests: [
      t.check(
        'a star of three nodes',
        `a, b, c = Node(1), Node(2), Node(3)
a.neighbors = [b, c]
b.neighbors = [a]
c.neighbors = [a]
out = clone_all([a, b, c])
assert [n.val for n in out] == [1, 2, 3], 'values or order are off'
assert [m.val for m in out[0].neighbors] == [2, 3], 'neighbour values are off'
assert out[0].neighbors[0] is out[1], 'a copy must point at copies, not at originals'
assert out[1].neighbors[0] is out[0]
assert all(n is not a and n is not b and n is not c for n in out), 'an original was returned'`,
      ),
      t.check(
        'the originals are untouched',
        `a, b = Node(1), Node(2)
a.neighbors = [b]
b.neighbors = [a]
clone_all([a, b])
assert a.neighbors == [b] and b.neighbors == [a]`,
      ),
      t.hidden('clone_all([])', '[]'),
      t.check('a node that points at itself', `a = Node(5)
a.neighbors = [a]
out = clone_all([a])
assert out[0] is not a and out[0].val == 5
assert out[0].neighbors == [out[0]]`, true),
    ],
    hints: [
      'A `Node` object can be a dict key. The dict answers: "which copy belongs to this original?"',
      'Make **all** the copies before wiring any of them, so every lookup in pass 2 succeeds.',
      'Wiring: for each neighbour of the original, append the neighbour’s twin to the twin’s list.',
    ],
    explanation: 'The dict original → copy is the heart of the move. With it, "wire my copy to my neighbour’s copy" is one lookup. When you are only handed one node, you cannot do pass 1 up front, so you create each copy on first visit instead.',
    signature: 'clone:two-pass-twins',
    minutes: 9,
  }),
  debug({
    id: 'b133-dbg-late-register',
    title: 'Debug: the clone that never returns',
    skills: ['graph_clone', 'graph_dfs', 'recursion_base_case'],
    difficulty: 3,
    prompt:
      '`clone_graph(node)` gets one `Node` of a connected graph and should return its copy: same values, same shape, built only from new nodes. It works for a single node with no neighbours. Fix it for everything else.',
    brokenCode: `${NODE}

def clone(node, copies):
    if node in copies:
        return copies[node]
    copy = Node(node.val)
    for nbr in node.neighbors:
        copy.neighbors.append(clone(nbr, copies))
    copies[node] = copy
    return copy


def clone_graph(node):
    return clone(node, {})`,
    solution: `${NODE}

def clone(node, copies):
    if node in copies:
        return copies[node]
    copy = Node(node.val)
    copies[node] = copy
    for nbr in node.neighbors:
        copy.neighbors.append(clone(nbr, copies))
    return copy


def clone_graph(node):
    return clone(node, {})`,
    tests: [
      t.check(
        'two nodes joined both ways',
        `a, b = Node(1), Node(2)
a.neighbors = [b]
b.neighbors = [a]
c = clone_graph(a)
assert c is not a and c.val == 1
assert [n.val for n in c.neighbors] == [2]
assert c.neighbors[0] is not b
assert c.neighbors[0].neighbors[0] is c, 'the copy of b must point back at the copy of a'`,
      ),
      t.check('one node alone', `a = Node(7)
c = clone_graph(a)
assert c is not a and c.val == 7 and c.neighbors == []`),
      t.check('a triangle', `a, b, c = Node(1), Node(2), Node(3)
a.neighbors = [b, c]
b.neighbors = [a, c]
c.neighbors = [a, b]
x = clone_graph(a)
y, z = x.neighbors
assert [x.val, y.val, z.val] == [1, 2, 3]
assert y.neighbors[0] is x and y.neighbors[1] is z
assert z.neighbors[0] is x and z.neighbors[1] is y
assert all(n is not m for n in (x, y, z) for m in (a, b, c))`, true),
      t.check('a self loop', `a = Node(4)
a.neighbors = [a]
c = clone_graph(a)
assert c is not a and c.neighbors == [c]`, true),
    ],
    hints: [
      'Follow a ↔ b by hand: when the walk comes back to `a`, is `a` in `copies` yet?',
      'Every line you need is already there. Look at their order.',
    ],
    explanation: 'The copy must be in the dict **before** the recursion, or a cycle never finds it and the calls go round forever. Create, register, then recurse.',
    signature: 'debug:clone-register-after-recursing',
    minutes: 4,
  }),
  write({
    id: 'b133-copy-chain-mini',
    title: 'Copy a chain that may loop',
    skills: ['graph_clone', 'dict_membership', 'listnode', 'recursion_base_case'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    important: true,
    prompt:
      '`head` is a `ListNode` chain (or `None`). Unlike a normal list, the last node’s `next` may point **back at an earlier node**, so the chain can loop.\n\nWrite `copy_chain(head)` that returns the head of a full copy made of new `ListNode`s, with the same values and the same loop (if any).\n\n1 → 2 → 3 → back to 1 gives a new ring 1 → 2 → 3 → back to the new 1.',
    starterCode: `def copy_chain(head):
    pass`,
    solution: `def copy_chain(head):
    copies = {}

    def clone(node):
        if node is None:
            return None
        if node in copies:
            return copies[node]
        copy = ListNode(node.val)
        copies[node] = copy
        copy.next = clone(node.next)
        return copy

    return clone(head)`,
    tests: [
      t.check('a straight chain', `h = build_list([1, 2, 3])
c = copy_chain(h)
assert list_to_array(c) == [1, 2, 3]
assert c is not h and c.next is not h.next, 'the copy reuses original nodes'`),
      t.check('a ring of three', `a, b, c = ListNode(1), ListNode(2), ListNode(3)
a.next, b.next, c.next = b, c, a
r = copy_chain(a)
assert [r.val, r.next.val, r.next.next.val] == [1, 2, 3]
assert r.next.next.next is r, 'the copy should loop back to its own first node'
assert r is not a and r.next is not b and r.next.next is not c`),
      t.hidden('copy_chain(None)', 'None'),
      t.check('one node pointing at itself', `a = ListNode(9)
a.next = a
r = copy_chain(a)
assert r is not a and r.val == 9 and r.next is r`, true),
      t.check('the tail loops into the middle', `a, b, c = ListNode(1), ListNode(2), ListNode(3)
a.next, b.next, c.next = b, c, b
r = copy_chain(a)
assert [r.val, r.next.val, r.next.next.val] == [1, 2, 3]
assert r.next.next.next is r.next
assert r.next is not b`, true),
    ],
    hints: [
      'A plain walk would never end on a ring. What do you need to remember about each node you have copied?',
      'A dict: original node → its copy. Seeing a node that is already a key means: hand back its copy, do not make another.',
      'Order: make the copy, store it in the dict, and only then deal with `.next`.',
    ],
    explanation: 'The same three steps as any graph copy, with one neighbour instead of many: look up, or else create + register, then wire through the dict.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    signature: 'clone:chain-with-loop',
    minutes: 11,
  }),
]

// ── LC 417 Pacific Atlantic Water Flow ───────────────────────────────────────
const waterFlow = [
  write({
    id: 'b417-border-cells',
    title: 'Collect the top and left edge',
    skills: ['border_reach', 'grid_nested', 'set_add', 'range'],
    prompt:
      'A grid has `rows` rows and `cols` columns (both at least 1).\n\nWrite `edge_cells(rows, cols)` that returns every `(r, c)` cell on the **top row or the left column**, each once, as a sorted list.\n\n`edge_cells(2, 3)` → `[(0, 0), (0, 1), (0, 2), (1, 0)]`',
    starterCode: `def edge_cells(rows, cols):
    pass`,
    solution: `def edge_cells(rows, cols):
    cells = set()
    for c in range(cols):
        cells.add((0, c))
    for r in range(rows):
        cells.add((r, 0))
    return sorted(cells)`,
    tests: [
      t.eq('edge_cells(2, 3)', '[(0, 0), (0, 1), (0, 2), (1, 0)]'),
      t.eq('edge_cells(1, 1)', '[(0, 0)]'),
      t.hidden('edge_cells(3, 1)', '[(0, 0), (1, 0), (2, 0)]'),
      t.hidden('len(edge_cells(3, 3))', '5'),
      t.hidden('edge_cells(1, 4)', '[(0, 0), (0, 1), (0, 2), (0, 3)]'),
    ],
    hints: ['Two short loops: one along the top row, one down the left column.', 'The corner belongs to both. What keeps it from appearing twice?'],
    explanation: 'An edge is one loop with one coordinate pinned: row `0` for the top, column `0` for the left (and `rows - 1`, `cols - 1` for the other two).',
    signature: 'border:collect-top-left',
    minutes: 6,
  }),
  write({
    id: 'b417-spread-many',
    title: 'Many starts, one visited set',
    skills: ['border_reach', 'visited_set', 'grid_neighbors', 'recursion_base_case'],
    difficulty: 3,
    prompt:
      'Ints grid: `0` is open, `1` is a wall. `starts` is a list of open `(r, c)` cells.\n\nWrite `open_reach(grid, starts)` that returns **how many** open cells can be reached from at least one start (4 directions, the starts count too). Use one walk function and **one** visited set shared by all the starts.\n\nWith `grid = [[0, 1, 0], [0, 1, 0], [1, 1, 0]]`: `open_reach(grid, [(0, 0)])` → `2`, `open_reach(grid, [(0, 0), (0, 2)])` → `5`',
    starterCode: `def open_reach(grid, starts):
    pass`,
    solution: `def open_reach(grid, starts):
    rows, cols = len(grid), len(grid[0])
    seen = set()

    def walk(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if grid[r][c] == 1 or (r, c) in seen:
            return
        seen.add((r, c))
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            walk(r + dr, c + dc)

    for r, c in starts:
        walk(r, c)
    return len(seen)`,
    tests: [
      t.eq('open_reach([[0, 1, 0], [0, 1, 0], [1, 1, 0]], [(0, 0)])', '2'),
      t.eq('open_reach([[0, 1, 0], [0, 1, 0], [1, 1, 0]], [(0, 0), (0, 2)])', '5'),
      t.hidden('open_reach([[0, 1, 0], [0, 1, 0], [1, 1, 0]], [(0, 0), (1, 0)])', '2'),
      t.hidden('open_reach([[0, 0], [0, 0]], [])', '0'),
      t.hidden('open_reach([[0]], [(0, 0)])', '1'),
      t.hidden('open_reach([[0, 0, 0], [1, 1, 0], [0, 0, 0]], [(2, 0), (0, 0), (2, 2)])', '7'),
    ],
    hints: [
      'This is the grid walk you know, called once per start instead of once.',
      'Create the visited set **outside** the walk and never reset it, so a cell reached from two starts is counted once.',
    ],
    explanation: 'A walk from many starts into one set costs one pass over the grid in total: whatever an earlier start already covered is skipped by the later ones.',
    complexity: { time: 'O(rows × cols)', space: 'O(rows × cols)' },
    signature: 'border:multi-start-shared-visited',
    minutes: 11,
  }),
  write({
    id: 'b417-higher-neighbors',
    title: 'Which neighbours are uphill?',
    skills: ['border_reach', 'grid_neighbors', 'conditionals'],
    prompt:
      '`heights` is a grid of numbers. Write `higher_neighbors(heights, r, c)` that returns the in-bounds neighbours of `(r, c)`, in the order up, down, left, right, whose height is **greater than or equal to** the height at `(r, c)`.\n\nWith `heights = [[1, 2, 2], [3, 2, 1], [0, 5, 2]]`: `higher_neighbors(heights, 1, 1)` → `[(0, 1), (2, 1), (1, 0)]`',
    starterCode: `def higher_neighbors(heights, r, c):
    pass`,
    solution: `def higher_neighbors(heights, r, c):
    rows, cols = len(heights), len(heights[0])
    out = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and heights[nr][nc] >= heights[r][c]:
            out.append((nr, nc))
    return out`,
    tests: [
      t.eq('higher_neighbors([[1, 2, 2], [3, 2, 1], [0, 5, 2]], 1, 1)', '[(0, 1), (2, 1), (1, 0)]'),
      t.eq('higher_neighbors([[1, 2, 2], [3, 2, 1], [0, 5, 2]], 0, 0)', '[(1, 0), (0, 1)]'),
      t.hidden('higher_neighbors([[1, 2, 2], [3, 2, 1], [0, 5, 2]], 2, 1)', '[]'),
      t.hidden('higher_neighbors([[4]], 0, 0)', '[]'),
      t.hidden('higher_neighbors([[-1, -1], [-2, -3]], 0, 1)', '[(0, 0)]'),
    ],
    hints: ['The bounds check comes first; only then is it safe to read the neighbour’s height.', 'Compare the **neighbour** with the cell you are standing on. Equal heights count.'],
    explanation: 'Water runs from a cell to an equal or lower neighbour. Walking the other way, from where the water ends up back to where it came from, means stepping to an equal or **higher** neighbour.',
    signature: 'border:uphill-neighbors',
    minutes: 7,
  }),
  debug({
    id: 'b417-dbg-downhill',
    title: 'Debug: which cells drain left?',
    skills: ['border_reach', 'visited_set', 'grid_neighbors'],
    difficulty: 3,
    prompt:
      'Rain on a cell runs to any neighbour that is **equal or lower**, and off the grid once it is in the left column. `drains_left(heights)` should return every cell whose water can run off the left side, as a sorted list of `[r, c]`. It starts from the left column and works inward.\n\n`drains_left([[1, 2, 3]])` should be `[[0, 0], [0, 1], [0, 2]]`. Fix it.',
    brokenCode: `def drains_left(heights):
    rows, cols = len(heights), len(heights[0])
    seen = set()

    def walk(r, c):
        seen.add((r, c))
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                if heights[nr][nc] <= heights[r][c]:
                    walk(nr, nc)

    for r in range(rows):
        if (r, 0) not in seen:
            walk(r, 0)
    return sorted([r, c] for r, c in seen)`,
    solution: `def drains_left(heights):
    rows, cols = len(heights), len(heights[0])
    seen = set()

    def walk(r, c):
        seen.add((r, c))
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                if heights[nr][nc] >= heights[r][c]:
                    walk(nr, nc)

    for r in range(rows):
        if (r, 0) not in seen:
            walk(r, 0)
    return sorted([r, c] for r, c in seen)`,
    tests: [
      t.eq('drains_left([[1, 2, 3]])', '[[0, 0], [0, 1], [0, 2]]'),
      t.eq('drains_left([[3, 2, 1]])', '[[0, 0]]'),
      t.hidden('drains_left([[5]])', '[[0, 0]]'),
      t.hidden('drains_left([[2, 2], [1, 3]])', '[[0, 0], [0, 1], [1, 0], [1, 1]]'),
      t.hidden('drains_left([[1, 3, 2], [4, 1, 1]])', '[[0, 0], [0, 1], [1, 0]]'),
    ],
    hints: ['The walk goes from the edge **into** the grid, but water goes from the grid **to** the edge.', 'Standing on a cell the water can leave from: which neighbours could have sent their water here?'],
    explanation: 'The walk runs against the water. Water moves to equal-or-lower cells, so the walk from the edge moves to equal-or-higher ones.',
    signature: 'debug:border-walk-wrong-direction',
    minutes: 4,
  }),
  write({
    id: 'b417-both-edges-mini',
    title: 'Plots that drain north and south',
    skills: ['border_reach', 'visited_set', 'grid_neighbors', 'set_membership'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 4,
    important: true,
    prompt:
      '`field` is a grid of heights. Rain on a plot runs to any neighbour that is equal or lower. It leaves the field to the **north** from row `0` and to the **south** from the last row.\n\nWrite `drains_both(field)` that returns the plots whose water can leave **both** ways, as a sorted list of `[r, c]`.\n\n`drains_both([[1], [2], [1]])` → `[[1, 0]]` (only the ridge in the middle runs both ways)',
    starterCode: `def drains_both(field):
    pass`,
    solution: `def drains_both(field):
    rows, cols = len(field), len(field[0])

    def climb(r, c, seen):
        seen.add((r, c))
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and field[nr][nc] >= field[r][c]:
                climb(nr, nc, seen)

    north, south = set(), set()
    for c in range(cols):
        climb(0, c, north)
        climb(rows - 1, c, south)
    return sorted([r, c] for r, c in north & south)`,
    tests: [
      t.eq('drains_both([[1], [2], [1]])', '[[1, 0]]'),
      t.eq('drains_both([[3, 3], [3, 3]])', '[[0, 0], [0, 1], [1, 0], [1, 1]]'),
      t.eq('drains_both([[1, 2], [2, 1], [3, 0]])', '[[0, 1], [1, 0], [2, 0]]'),
      t.hidden('drains_both([[5]])', '[[0, 0]]'),
      t.hidden('drains_both([[1, 2, 3]])', '[[0, 0], [0, 1], [0, 2]]'),
      t.hidden('drains_both([[1, 1], [9, 0], [1, 1]])', '[[1, 0]]'),
      t.hidden('drains_both([[2, 1], [1, 2]])', '[[0, 0], [1, 1]]'),
    ],
    hints: [
      'Testing every plot separately is slow. Which plots do you know the answer for without any search?',
      'Two visited sets: everything that can reach the north edge, everything that can reach the south edge. Fill each by walking uphill from its edge.',
      'The same walk function can fill either set if the set is a parameter.',
      'A plot is in the answer when it is in both sets: `a & b` gives the cells two sets share.',
    ],
    explanation: 'Start where the answer is certain (the edge) and walk against the water. One pass per edge, then the intersection: O(rows × cols) instead of a search from every cell.',
    complexity: { time: 'O(rows × cols)', space: 'O(rows × cols)' },
    signature: 'border:two-edges-intersect',
    minutes: 13,
  }),
]

// ── LC 323 Number of Connected Components ────────────────────────────────────
const components = [
  write({
    id: 'b323-walk-starts',
    title: 'Who starts a new walk?',
    skills: ['connected_components', 'graph_dfs', 'visited_set'],
    difficulty: 3,
    prompt:
      '`graph` is an undirected adjacency dict in which every node is a key. Scan the keys in order; a node that no earlier walk has visited **starts** a new walk that visits everything connected to it.\n\nWrite `walk_starts(graph)` that returns the list of starting nodes.\n\n`walk_starts({0: [1], 1: [0], 2: [], 3: [4], 4: [3]})` → `[0, 2, 3]`',
    starterCode: `def walk_starts(graph):
    pass`,
    solution: `def walk_starts(graph):
    seen = set()
    starts = []
    for node in graph:
        if node in seen:
            continue
        starts.append(node)
        seen.add(node)
        stack = [node]
        while stack:
            cur = stack.pop()
            for nxt in graph[cur]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
    return starts`,
    tests: [
      t.eq('walk_starts({0: [1], 1: [0], 2: [], 3: [4], 4: [3]})', '[0, 2, 3]'),
      t.eq("walk_starts({'a': ['b'], 'b': ['a', 'c'], 'c': ['b']})", "['a']"),
      t.hidden('walk_starts({})', '[]'),
      t.hidden('walk_starts({5: [], 6: []})', '[5, 6]'),
      t.hidden('walk_starts({0: [2], 1: [3], 2: [0], 3: [1]})', '[0, 1]'),
    ],
    hints: [
      'An outer loop over every node, and inside it the traversal you already know.',
      'The visited set is created once, before the outer loop. Each walk adds to it.',
      'A node already in the set is skipped: an earlier walk owns it.',
    ],
    explanation: 'One start per group. The number of starts is the number of groups, and a node with no neighbours is a start of its own.',
    signature: 'components:list-starts',
    minutes: 11,
    important: true,
  }),
  debug({
    id: 'b323-dbg-isolated',
    title: 'Debug: the missing teams',
    skills: ['connected_components', 'graph_adjacency', 'dict_get'],
    difficulty: 3,
    prompt:
      'Players are numbered `0` to `n - 1`. Each pair in `pairs` knows each other, and everyone connected through people they know forms one team. A player who knows nobody is a team of one. `count_teams(n, pairs)` should return the number of teams.\n\n`count_teams(5, [[0, 1], [3, 4]])` should be `3`. Fix it.',
    brokenCode: `def count_teams(n, pairs):
    graph = {}
    for a, b in pairs:
        graph[a] = graph.get(a, []) + [b]
        graph[b] = graph.get(b, []) + [a]
    seen = set()
    teams = 0
    for start in graph:
        if start in seen:
            continue
        teams += 1
        seen.add(start)
        stack = [start]
        while stack:
            cur = stack.pop()
            for nxt in graph[cur]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
    return teams`,
    solution: `def count_teams(n, pairs):
    graph = {i: [] for i in range(n)}
    for a, b in pairs:
        graph[a] = graph.get(a, []) + [b]
        graph[b] = graph.get(b, []) + [a]
    seen = set()
    teams = 0
    for start in graph:
        if start in seen:
            continue
        teams += 1
        seen.add(start)
        stack = [start]
        while stack:
            cur = stack.pop()
            for nxt in graph[cur]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
    return teams`,
    tests: [
      t.eq('count_teams(5, [[0, 1], [3, 4]])', '3'),
      t.eq('count_teams(3, [])', '3'),
      t.eq('count_teams(4, [[0, 1], [1, 2], [2, 3]])', '1'),
      t.hidden('count_teams(0, [])', '0'),
      t.hidden('count_teams(1, [])', '1'),
      t.hidden('count_teams(3, [[0, 1], [1, 0]])', '2'),
    ],
    hints: ['Which player is the code never told about in the failing test?', 'The outer loop can only start from nodes the graph has a key for.'],
    explanation: 'A graph built from the edge list alone has no key for a node without edges, so that node never starts a walk. Give all `n` nodes a key first.',
    signature: 'debug:components-isolated-nodes',
    minutes: 4,
  }),
  write({
    id: 'b323-circle-sizes-mini',
    title: 'Sizes of the friend circles',
    skills: ['connected_components', 'graph_adjacency', 'graph_dfs', 'visited_set'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    important: true,
    prompt:
      'People are numbered `0` to `n - 1`, and each `[a, b]` in `links` says `a` and `b` are friends. A circle is everyone connected through friends; someone with no friends is a circle of one.\n\nWrite `circle_sizes(n, links)` that returns the size of every circle, smallest first.\n\n`circle_sizes(6, [[0, 1], [1, 2], [4, 5]])` → `[1, 2, 3]`',
    starterCode: `def circle_sizes(n, links):
    pass`,
    solution: `def circle_sizes(n, links):
    graph = {i: [] for i in range(n)}
    for a, b in links:
        graph[a].append(b)
        graph[b].append(a)
    seen = set()

    def size(node):
        seen.add(node)
        total = 1
        for nxt in graph[node]:
            if nxt not in seen:
                total += size(nxt)
        return total

    sizes = []
    for node in range(n):
        if node not in seen:
            sizes.append(size(node))
    return sorted(sizes)`,
    tests: [
      t.eq('circle_sizes(6, [[0, 1], [1, 2], [4, 5]])', '[1, 2, 3]'),
      t.eq('circle_sizes(3, [])', '[1, 1, 1]'),
      t.hidden('circle_sizes(0, [])', '[]'),
      t.hidden('circle_sizes(1, [])', '[1]'),
      t.hidden('circle_sizes(4, [[0, 1], [1, 2], [2, 0], [2, 3]])', '[4]'),
      t.hidden('circle_sizes(5, [[3, 4], [4, 3], [0, 2]])', '[1, 2, 2]'),
    ],
    hints: [
      'Three parts: build the graph, walk one circle, loop over everyone.',
      'Person 3 in the example has no links. Where does 3 get a key in your graph?',
      'Each new start is one circle; the walk from it can count how many people it visits.',
    ],
    explanation: 'Build for all `n`, share one visited set, start a walk from each unvisited node. Counting the starts instead of measuring them gives the number of groups.',
    complexity: { time: 'O(n + links)', space: 'O(n + links)' },
    signature: 'components:sizes',
    minutes: 14,
  }),
]

// ── LC 261 Graph Valid Tree ──────────────────────────────────────────────────
const REACHED = `def reached(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    seen = {0}
    stack = [0]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return len(seen)
`

const validTree = [
  write({
    id: 'b261-reach-all',
    title: 'Does node 0 reach everyone?',
    skills: ['graph_tree_check', 'graph_adjacency', 'graph_dfs', 'visited_set'],
    difficulty: 3,
    prompt:
      'Nodes are numbered `0` to `n - 1` (`n` is at least 1) and `edges` is a list of undirected `[a, b]` pairs.\n\nWrite `reaches_all(n, edges)` that returns `True` if a walk starting at node `0` visits all `n` nodes.\n\n`reaches_all(4, [[0, 1], [1, 2], [2, 3]])` → `True`, `reaches_all(4, [[0, 1], [2, 3]])` → `False`',
    starterCode: `def reaches_all(n, edges):
    pass`,
    solution: `def reaches_all(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    seen = {0}
    stack = [0]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return len(seen) == n`,
    tests: [
      t.eq('reaches_all(4, [[0, 1], [1, 2], [2, 3]])', 'True'),
      t.eq('reaches_all(4, [[0, 1], [2, 3]])', 'False'),
      t.hidden('reaches_all(1, [])', 'True'),
      t.hidden('reaches_all(3, [[1, 2]])', 'False'),
      t.hidden('reaches_all(3, [[0, 1], [1, 2], [2, 0]])', 'True'),
      t.hidden('reaches_all(2, [])', 'False'),
    ],
    hints: ['One traversal from node 0, then one comparison.', 'How many nodes did the walk visit, and how many are there?'],
    explanation: 'A graph is in one piece exactly when a single walk reaches every node. Comparing `len(seen)` with `n` avoids a second loop.',
    signature: 'tree-check:reach-all-from-zero',
    minutes: 10,
  }),
  debug({
    id: 'b261-dbg-edges-only',
    title: 'Debug: counting edges is not enough',
    skills: ['graph_tree_check', 'graph_dfs', 'conditionals'],
    difficulty: 3,
    prompt:
      'A graph on nodes `0` to `n - 1` is a **tree** when it is in one piece and has no cycle. `is_tree(n, edges)` should return `True` only for trees. The helper `reached(n, edges)` is correct: it returns how many nodes a walk from node `0` visits.\n\n`is_tree(4, [[0, 1], [1, 2], [2, 0]])` should be `False`. Fix `is_tree`.',
    brokenCode: `${REACHED}

def is_tree(n, edges):
    return len(edges) == n - 1`,
    solution: `${REACHED}

def is_tree(n, edges):
    return len(edges) == n - 1 and reached(n, edges) == n`,
    tests: [
      t.eq('is_tree(4, [[0, 1], [1, 2], [2, 0]])', 'False'),
      t.eq('is_tree(4, [[0, 1], [0, 2], [0, 3]])', 'True'),
      t.hidden('is_tree(1, [])', 'True'),
      t.hidden('is_tree(3, [[0, 1], [1, 2], [2, 0]])', 'False'),
      t.hidden('is_tree(4, [[0, 1], [2, 3]])', 'False'),
      t.hidden('is_tree(5, [[0, 1], [1, 2], [2, 0], [3, 4]])', 'False'),
      t.hidden('is_tree(5, [[0, 1], [0, 2], [2, 3], [2, 4]])', 'True'),
    ],
    hints: ['Draw the failing graph: a triangle and one node on its own. How many edges, how many nodes?', 'The edge count is right and it is still not a tree. What else must be true?'],
    explanation: '`n - 1` edges alone can hide a cycle next to a cut-off node. Reaching all nodes alone can hide a cycle (a connected graph with an extra edge). Together they leave only trees.',
    signature: 'debug:tree-check-edge-count-only',
    minutes: 4,
  }),
  write({
    id: 'b261-spare-cables-mini',
    title: 'How many cables are spare?',
    skills: ['graph_tree_check', 'graph_adjacency', 'graph_dfs', 'visited_set'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    important: true,
    prompt:
      'An office has computers `0` to `n - 1` (`n` is at least 1) and a list of `cables`, each an `[a, b]` pair. No cable is listed twice.\n\nWrite `spare_cables(n, cables)`. If some computer cannot be reached from computer `0`, return `-1`. Otherwise return how many cables could be unplugged while everyone stays connected.\n\n`spare_cables(3, [[0, 1], [1, 2], [2, 0]])` → `1`, `spare_cables(4, [[0, 1], [1, 2], [2, 0]])` → `-1`',
    starterCode: `def spare_cables(n, cables):
    pass`,
    solution: `def spare_cables(n, cables):
    graph = {i: [] for i in range(n)}
    for a, b in cables:
        graph[a].append(b)
        graph[b].append(a)
    seen = {0}
    stack = [0]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    if len(seen) != n:
        return -1
    return len(cables) - (n - 1)`,
    tests: [
      t.eq('spare_cables(3, [[0, 1], [1, 2], [2, 0]])', '1'),
      t.eq('spare_cables(4, [[0, 1], [1, 2], [2, 0]])', '-1'),
      t.eq('spare_cables(4, [[0, 1], [1, 2], [2, 3]])', '0'),
      t.hidden('spare_cables(1, [])', '0'),
      t.hidden('spare_cables(2, [])', '-1'),
      t.hidden('spare_cables(4, [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3]])', '2'),
      t.hidden('spare_cables(5, [[3, 4], [0, 1], [1, 2], [2, 3]])', '0'),
    ],
    hints: [
      'Two separate facts: is everyone connected, and how many cables does a connected office really need?',
      'Connecting `n` computers with nothing to spare takes a fixed number of cables. Try `n = 2, 3, 4` on paper.',
      'Zero spare cables and everyone connected: that network is a tree.',
    ],
    explanation: 'A connected graph on `n` nodes needs exactly `n - 1` edges; every edge beyond that closes a cycle. So "connected and `n - 1` edges" is the same as "connected and no cycle": a tree.',
    complexity: { time: 'O(n + cables)', space: 'O(n + cables)' },
    signature: 'tree-check:spare-edges',
    minutes: 12,
  }),
]

// ── Sorting + heaps check ────────────────────────────────────────────────────
const heapCheck = [
  write({
    id: 'd9h-c-cheapest-first',
    title: 'Menu, cheapest first',
    skills: ['sort_key', 'tuples', 'list_comprehension'],
    stage: 'retrieval',
    repType: 'cold',
    prompt:
      '`menu` is a list of `(name, price)` tuples. Write `cheapest_first(menu)` that returns just the names, cheapest first. Equal prices stay in their original order.\n\n`cheapest_first([(\'tea\', 3), (\'cake\', 6), (\'water\', 1)])` → `[\'water\', \'tea\', \'cake\']`',
    starterCode: `def cheapest_first(menu):
    pass`,
    solution: `def cheapest_first(menu):
    ordered = sorted(menu, key=lambda item: item[1])
    return [name for name, price in ordered]`,
    tests: [
      t.eq("cheapest_first([('tea', 3), ('cake', 6), ('water', 1)])", "['water', 'tea', 'cake']"),
      t.hidden('cheapest_first([])', '[]'),
      t.hidden("cheapest_first([('z', 2), ('b', 1), ('a', 2)])", "['b', 'z', 'a']"),
      t.hidden("cheapest_first([('refund', -4), ('gift', 0)])", "['refund', 'gift']"),
    ],
    hints: ['Sorting the tuples as they are would order them by name. What should the order depend on?'],
    signature: 'check:sort-key-field',
    minutes: 4,
  }),
  write({
    id: 'd9h-c-rank-teams',
    title: 'League table',
    skills: ['sort_key', 'sorting', 'dict_lookup'],
    stage: 'retrieval',
    repType: 'cold',
    prompt:
      '`teams` is a list of dicts like `{\'name\': \'owls\', \'wins\': 5, \'losses\': 2}`. Write `rank_teams(teams)` that returns the team names: most wins first, and among equal wins, fewest losses first.\n\nOwls 5–2, Bats 7–1, Cats 5–1 → `[\'bats\', \'cats\', \'owls\']`',
    starterCode: `def rank_teams(teams):
    pass`,
    solution: `def rank_teams(teams):
    ordered = sorted(teams, key=lambda team: (-team['wins'], team['losses']))
    return [team['name'] for team in ordered]`,
    tests: [
      t.eq(
        "rank_teams([{'name': 'owls', 'wins': 5, 'losses': 2}, {'name': 'bats', 'wins': 7, 'losses': 1}, {'name': 'cats', 'wins': 5, 'losses': 1}])",
        "['bats', 'cats', 'owls']",
      ),
      t.hidden('rank_teams([])', '[]'),
      t.hidden("rank_teams([{'name': 'solo', 'wins': 0, 'losses': 0}])", "['solo']"),
      t.hidden(
        "rank_teams([{'name': 'a', 'wins': 1, 'losses': 9}, {'name': 'b', 'wins': 1, 'losses': 3}, {'name': 'c', 'wins': 0, 'losses': 0}])",
        "['b', 'a', 'c']",
      ),
    ],
    hints: ['One sort can order by two things at once if each item is turned into a pair.'],
    signature: 'check:sort-two-criteria',
    minutes: 4,
  }),
  write({
    id: 'd9h-c-under-limit',
    title: 'Pop while it is small',
    skills: ['heap_push_pop', 'while_loop', 'list_append'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    prompt:
      'Write `under_limit(nums, limit)` that returns every value **smaller than** `limit`, in ascending order. Use a heap from `heapq` and stop popping as soon as the smallest remaining value is too big. No `sorted` or `.sort()`. Nothing is pre-imported, and `nums` must not change.\n\n`under_limit([8, 3, 5, 1, 9], 6)` → `[1, 3, 5]`',
    starterCode: `def under_limit(nums, limit):
    pass`,
    solution: `import heapq

def under_limit(nums, limit):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
    out = []
    while heap and heap[0] < limit:
        out.append(heapq.heappop(heap))
    return out`,
    tests: [
      t.eq('under_limit([8, 3, 5, 1, 9], 6)', '[1, 3, 5]'),
      t.eq('under_limit([4, 4, 2], 4)', '[2]'),
      t.hidden('under_limit([], 3)', '[]'),
      t.hidden('under_limit([7, 8], 1)', '[]'),
      t.hidden('under_limit([-2, 0, -5, 3], 1)', '[-5, -2, 0]'),
      t.hidden('under_limit([2, 2, 1], 10)', '[1, 2, 2]'),
      t.check('input unchanged', `nums = [8, 3, 5]
under_limit(nums, 6)
assert nums == [8, 3, 5]`, true),
    ],
    hints: ['Where does a heap keep its smallest value, and can you look at it without removing it?'],
    signature: 'check:heap-pop-while',
    minutes: 8,
  }),
  write({
    id: 'd9h-c-k-tallest',
    title: 'The k tallest',
    skills: ['top_k', 'heap_push_pop', 'sorting'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    prompt:
      'Write `k_tallest(heights, k)` that returns the `k` largest values in ascending order (all of them if there are fewer than `k`). Scan once and never hold more than `k` values in memory besides the input. Nothing is pre-imported.\n\n`k_tallest([150, 180, 165, 172], 2)` → `[172, 180]`',
    starterCode: `def k_tallest(heights, k):
    pass`,
    solution: `import heapq

def k_tallest(heights, k):
    heap = []
    for h in heights:
        heapq.heappush(heap, h)
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap)`,
    tests: [
      t.eq('k_tallest([150, 180, 165, 172], 2)', '[172, 180]'),
      t.eq('k_tallest([5], 3)', '[5]'),
      t.hidden('k_tallest([], 2)', '[]'),
      t.hidden('k_tallest([4, 4, 1], 2)', '[4, 4]'),
      t.hidden('k_tallest([-3, -1, -2], 1)', '[-1]'),
      t.hidden('k_tallest([1, 2, 3], 0)', '[]'),
      t.hidden('k_tallest([1, 2, 3, 4, 5], 5)', '[1, 2, 3, 4, 5]'),
    ],
    hints: ['When you hold one value too many, which one can never be part of the answer?'],
    signature: 'check:k-largest-min-heap',
    minutes: 8,
  }),
  write({
    id: 'd9h-c-busiest-hours',
    title: 'Busiest hours',
    skills: ['frequency_map', 'top_k', 'heap_push_pop', 'sort_key'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    prompt:
      '`log` has one entry per customer: the hour (0–23) they arrived. Write `busiest_hours(log, k)` that returns the `k` hours with the most customers, listed from earliest to latest. If two hours are equally busy, the earlier hour wins the place. Fewer than `k` different hours: return them all.\n\n`busiest_hours([9, 14, 9, 17, 14, 9], 2)` → `[9, 14]`',
    starterCode: `def busiest_hours(log, k):
    pass`,
    solution: `import heapq

def busiest_hours(log, k):
    counts = {}
    for hour in log:
        counts[hour] = counts.get(hour, 0) + 1
    heap = []
    for hour, n in counts.items():
        heapq.heappush(heap, (n, -hour))
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(-neg for n, neg in heap)`,
    tests: [
      t.eq('busiest_hours([9, 14, 9, 17, 14, 9], 2)', '[9, 14]'),
      t.eq('busiest_hours([20, 8, 8], 1)', '[8]'),
      t.hidden('busiest_hours([], 1)', '[]'),
      t.hidden('busiest_hours([3, 5], 1)', '[3]'),
      t.hidden('busiest_hours([7, 7, 7], 5)', '[7]'),
      t.hidden('busiest_hours([22, 6, 22, 6, 13, 13, 13, 1], 2)', '[6, 13]'),
      t.hidden('busiest_hours([1, 2, 3], 0)', '[]'),
    ],
    hints: ['Two steps: how busy is each hour, then which hours win.'],
    signature: 'check:frequency-top-k',
    minutes: 10,
  }),
]

// ── LC 252 Meeting Rooms ─────────────────────────────────────────────────────
const meetingRooms = [
  write({
    id: 'b252-first-clash',
    title: 'The first meeting that clashes',
    skills: ['interval_overlap', 'sort_key', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    prompt:
      '`meetings` is a list of `[start, end]` pairs in any order, all with different starts. A meeting may begin exactly when another ends.\n\nWrite `first_clash(meetings)`: going through the day in start order, return the first meeting that begins while the one before it is still running, or `None` if there is none.\n\n`first_clash([[0, 30], [15, 20], [5, 10]])` → `[5, 10]`',
    starterCode: `def first_clash(meetings):
    pass`,
    solution: `def first_clash(meetings):
    ordered = sorted(meetings, key=lambda m: m[0])
    for i in range(1, len(ordered)):
        if ordered[i][0] < ordered[i - 1][1]:
            return ordered[i]
    return None`,
    tests: [
      t.eq('first_clash([[0, 30], [15, 20], [5, 10]])', '[5, 10]'),
      t.eq('first_clash([[7, 10], [2, 4]])', 'None'),
      t.hidden('first_clash([])', 'None'),
      t.hidden('first_clash([[3, 9]])', 'None'),
      t.hidden('first_clash([[1, 5], [5, 8]])', 'None'),
      t.hidden('first_clash([[6, 9], [1, 3], [8, 10]])', '[8, 10]'),
    ],
    hints: ['In start order, a meeting can only clash with the one just before it.', 'Touching is allowed here: is the test `<` or `<=`?'],
    explanation: 'Sort by start, then one comparison per meeting: this start against the previous end.',
    signature: 'interval:first-clash',
    minutes: 6,
  }),
  write({
    id: 'b252-one-oven-mini',
    title: 'One oven, many bakes',
    skills: ['interval_overlap', 'sorting', 'tuples'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    prompt:
      '`bakes` is a list of `(start, minutes)` tuples: when a tray goes in and how long it stays. The oven holds one tray. A tray may go in at the very minute the previous one comes out.\n\nWrite `one_oven(bakes)` that returns `True` if a single oven can do every bake.\n\n`one_oven([(10, 30), (0, 15), (20, 5)])` → `False` (the tray from minute 0 is still in at minute 10)',
    starterCode: `def one_oven(bakes):
    pass`,
    solution: `def one_oven(bakes):
    ordered = sorted(bakes)
    for i in range(1, len(ordered)):
        prev_start, prev_minutes = ordered[i - 1]
        if ordered[i][0] < prev_start + prev_minutes:
            return False
    return True`,
    tests: [
      t.eq('one_oven([(10, 30), (0, 15), (20, 5)])', 'False'),
      t.eq('one_oven([(0, 30), (30, 20)])', 'True'),
      t.hidden('one_oven([])', 'True'),
      t.hidden('one_oven([(5, 10)])', 'True'),
      t.hidden('one_oven([(40, 10), (0, 20), (20, 20)])', 'True'),
      t.hidden('one_oven([(0, 50), (10, 5), (60, 5)])', 'False'),
    ],
    hints: ['You are not given an end time. Can you work one out?', 'Put the bakes in start order and compare neighbours.'],
    explanation: 'The same scan as any "can one person attend everything" question; the only new step is computing each end from start + length.',
    signature: 'interval:one-resource-start-length',
    minutes: 7,
  }),
]

// ── LC 57 Insert Interval ────────────────────────────────────────────────────
const insertInterval = [
  write({
    id: 'b57-before-after',
    title: 'Entirely before, entirely after',
    skills: ['interval_insert', 'interval_overlap', 'list_append'],
    prompt:
      '`intervals` is a list of `[start, end]` pairs and `new` is one more pair. Touching counts as overlapping.\n\nWrite `split_around(intervals, new)` that returns `[before, after]`: the intervals that end before `new` starts, and the ones that start after `new` ends. Intervals that overlap `new` go in neither list.\n\n`split_around([[1, 2], [3, 5], [8, 9]], [4, 6])` → `[[[1, 2]], [[8, 9]]]`',
    starterCode: `def split_around(intervals, new):
    pass`,
    solution: `def split_around(intervals, new):
    before = []
    after = []
    for iv in intervals:
        if iv[1] < new[0]:
            before.append(iv)
        elif iv[0] > new[1]:
            after.append(iv)
    return [before, after]`,
    tests: [
      t.eq('split_around([[1, 2], [3, 5], [8, 9]], [4, 6])', '[[[1, 2]], [[8, 9]]]'),
      t.eq('split_around([[1, 4], [6, 9]], [4, 6])', '[[], []]'),
      t.hidden('split_around([], [1, 2])', '[[], []]'),
      t.hidden('split_around([[1, 2], [3, 4]], [10, 11])', '[[[1, 2], [3, 4]], []]'),
      t.hidden('split_around([[5, 6]], [1, 2])', '[[], [[5, 6]]]'),
      t.hidden('split_around([[-9, -7], [-3, 0], [2, 2]], [-4, 1])', '[[[-9, -7]], [[2, 2]]]'),
    ],
    hints: ['"Entirely before" compares one interval’s **end** with the new **start**.', '"Entirely after" is the mirror image. Anything else overlaps.'],
    explanation: 'Every interval is in exactly one of three states relative to `new`: before it, after it, or overlapping it. Two comparisons decide which.',
    signature: 'insert:classify-before-after',
    minutes: 7,
  }),
  write({
    id: 'b57-absorb',
    title: 'Widen the new interval',
    skills: ['interval_insert', 'interval_overlap', 'state_tracking'],
    prompt:
      '`intervals` is sorted by start and none of them overlap each other. `new` is one more `[start, end]` pair; touching counts as overlapping.\n\nWrite `absorb(intervals, new)` that returns the single `[start, end]` you get by merging `new` with **every** interval it overlaps. Do not change `new` itself.\n\n`absorb([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])` → `[3, 10]`',
    starterCode: `def absorb(intervals, new):
    pass`,
    solution: `def absorb(intervals, new):
    start, end = new
    for lo, hi in intervals:
        if lo <= end and hi >= start:
            start = min(start, lo)
            end = max(end, hi)
    return [start, end]`,
    tests: [
      t.eq('absorb([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])', '[3, 10]'),
      t.eq('absorb([[1, 2]], [5, 6])', '[5, 6]'),
      t.hidden('absorb([], [1, 1])', '[1, 1]'),
      t.hidden('absorb([[1, 3], [6, 9]], [3, 6])', '[1, 9]'),
      t.hidden('absorb([[1, 10]], [4, 5])', '[1, 10]'),
      t.hidden('absorb([[-5, -2], [0, 3]], [-3, -1])', '[-5, -1]'),
      t.check('new is unchanged', `n = [4, 8]
absorb([[3, 5]], n)
assert n == [4, 8]`, true),
    ],
    hints: ['Keep two running numbers: the start and the end of the growing interval.', 'An overlap can stretch it on **either** side: the smaller start, the larger end.'],
    explanation: 'Merging into `new` means widening it: `min` of the starts, `max` of the ends, once for each interval it touches.',
    signature: 'insert:widen-over-overlaps',
    minutes: 7,
  }),
  debug({
    id: 'b57-dbg-one-side',
    title: 'Debug: the booking that shrank',
    skills: ['interval_insert', 'interval_overlap', 'while_loop'],
    difficulty: 3,
    prompt:
      '`slots` is sorted by start with no overlaps. `insert_slot(slots, new)` should return the list with `new` added, still sorted, with anything it overlaps merged into it (touching merges).\n\n`insert_slot([[1, 3], [6, 9]], [2, 5])` should be `[[1, 5], [6, 9]]`. Fix it.',
    brokenCode: `def insert_slot(slots, new):
    start, end = new
    out = []
    i = 0
    while i < len(slots) and slots[i][1] < start:
        out.append(slots[i])
        i += 1
    while i < len(slots) and slots[i][0] <= end:
        end = max(end, slots[i][1])
        i += 1
    out.append([start, end])
    while i < len(slots):
        out.append(slots[i])
        i += 1
    return out`,
    solution: `def insert_slot(slots, new):
    start, end = new
    out = []
    i = 0
    while i < len(slots) and slots[i][1] < start:
        out.append(slots[i])
        i += 1
    while i < len(slots) and slots[i][0] <= end:
        start = min(start, slots[i][0])
        end = max(end, slots[i][1])
        i += 1
    out.append([start, end])
    while i < len(slots):
        out.append(slots[i])
        i += 1
    return out`,
    tests: [
      t.eq('insert_slot([[1, 3], [6, 9]], [2, 5])', '[[1, 5], [6, 9]]'),
      t.eq('insert_slot([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])', '[[1, 2], [3, 10], [12, 16]]'),
      t.hidden('insert_slot([], [5, 7])', '[[5, 7]]'),
      t.hidden('insert_slot([[1, 5]], [6, 8])', '[[1, 5], [6, 8]]'),
      t.hidden('insert_slot([[3, 4]], [1, 2])', '[[1, 2], [3, 4]]'),
      t.hidden('insert_slot([[1, 5]], [2, 3])', '[[1, 5]]'),
      t.hidden('insert_slot([[1, 2], [4, 6]], [2, 4])', '[[1, 6]]'),
    ],
    hints: ['Three loops, three jobs. Which loop handled `[1, 3]` in the failing test?', 'Compare what came out with what should have: which number of the merged slot is wrong?'],
    explanation: 'Three phases share one index: copy what ends before the new one, widen the new one over everything that overlaps (both sides), append it once, copy the rest.',
    signature: 'debug:insert-widen-end-only',
    minutes: 5,
  }),
  write({
    id: 'b57-add-pages-mini',
    title: 'Add a page range to a print job',
    skills: ['interval_insert', 'interval_overlap', 'while_loop', 'list_append'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    important: true,
    prompt:
      'A print job is a sorted list of page `ranges` like `[[1, 2], [6, 8]]`: whole page numbers, each range `[first, last]`, with a gap between any two. `new` is one more range.\n\nWrite `add_pages(ranges, new)` that returns the new sorted list. Ranges that overlap **or sit right next to each other** (one ends on page 2, the next begins on page 3) become one range.\n\n`add_pages([[1, 2], [6, 8]], [3, 4])` → `[[1, 4], [6, 8]]`',
    starterCode: `def add_pages(ranges, new):
    pass`,
    solution: `def add_pages(ranges, new):
    start, end = new
    out = []
    i = 0
    while i < len(ranges) and ranges[i][1] < start - 1:
        out.append(ranges[i])
        i += 1
    while i < len(ranges) and ranges[i][0] <= end + 1:
        start = min(start, ranges[i][0])
        end = max(end, ranges[i][1])
        i += 1
    out.append([start, end])
    while i < len(ranges):
        out.append(ranges[i])
        i += 1
    return out`,
    tests: [
      t.eq('add_pages([[1, 2], [6, 8]], [3, 4])', '[[1, 4], [6, 8]]'),
      t.eq('add_pages([[1, 2], [8, 9]], [4, 5])', '[[1, 2], [4, 5], [8, 9]]'),
      t.eq('add_pages([[1, 2], [5, 6]], [3, 4])', '[[1, 6]]'),
      t.hidden('add_pages([], [3, 3])', '[[3, 3]]'),
      t.hidden('add_pages([[4, 5]], [1, 2])', '[[1, 2], [4, 5]]'),
      t.hidden('add_pages([[1, 3]], [5, 9])', '[[1, 3], [5, 9]]'),
      t.hidden('add_pages([[2, 9]], [4, 5])', '[[2, 9]]'),
      t.hidden('add_pages([[1, 1], [3, 3], [5, 5], [9, 9]], [2, 6])', '[[1, 6], [9, 9]]'),
    ],
    hints: [
      'Three kinds of range: safely before the new one, joined with it, safely after it.',
      'Take them in that order with one index that only moves forward.',
      '"Safely before" now needs a gap of at least one page. How does that change the comparison?',
      'Add the widened range exactly once, between the second and third kind.',
    ],
    explanation: 'The three-phase scan again, with the overlap test loosened by one page on each side. Because the input is sorted, each phase is a simple while loop and the whole thing is O(n).',
    complexity: { time: 'O(n)', space: 'O(n)' },
    signature: 'insert:three-phase-adjacent',
    minutes: 12,
  }),
]

// ── LC 435 Non-overlapping Intervals ─────────────────────────────────────────
const nonOverlapping = [
  write({
    id: 'b435-keep-talks',
    title: 'Keep what fits after the last one',
    skills: ['interval_greedy', 'interval_overlap', 'list_append'],
    prompt:
      '`talks` is a list of `[start, end]` pairs **already sorted by end time**. One room; a talk may start exactly when the previous one ends.\n\nWrite `keep_talks(talks)`: go through them in order and keep a talk whenever it starts at or after the end of the last talk you kept. Return the kept talks.\n\n`keep_talks([[1, 3], [2, 4], [3, 5]])` → `[[1, 3], [3, 5]]`',
    starterCode: `def keep_talks(talks):
    pass`,
    solution: `def keep_talks(talks):
    kept = []
    for start, end in talks:
        if not kept or start >= kept[-1][1]:
            kept.append([start, end])
    return kept`,
    tests: [
      t.eq('keep_talks([[1, 3], [2, 4], [3, 5]])', '[[1, 3], [3, 5]]'),
      t.eq('keep_talks([[2, 3], [4, 5], [1, 10]])', '[[2, 3], [4, 5]]'),
      t.hidden('keep_talks([])', '[]'),
      t.hidden('keep_talks([[1, 2], [1, 2]])', '[[1, 2]]'),
      t.hidden('keep_talks([[-5, -1], [-3, 0], [-1, 2]])', '[[-5, -1], [-1, 2]]'),
      t.hidden('keep_talks([[0, 1]])', '[[0, 1]]'),
    ],
    hints: ['The first talk is always kept. After that, the only thing that matters is where the last kept talk ends.'],
    explanation: 'In end order, the talk that finishes first leaves the most room for everything after it, so keeping it is never a mistake.',
    signature: 'greedy:keep-compatible-presorted',
    minutes: 6,
  }),
  write({
    id: 'b435-pick-shows',
    title: 'Fill one stage',
    skills: ['interval_greedy', 'sort_key', 'tuples'],
    difficulty: 3,
    prompt:
      '`shows` is a list of `(name, start, end)` tuples in any order, all with different end times. One stage; a show may start the moment another ends.\n\nWrite `pick_shows(shows)` that fits in as many shows as possible by always taking the one that **ends earliest** among those that still fit. Return the chosen names in the order they play.\n\n`pick_shows([(\'long\', 1, 10), (\'a\', 2, 3), (\'b\', 4, 5)])` → `[\'a\', \'b\']`',
    starterCode: `def pick_shows(shows):
    pass`,
    solution: `def pick_shows(shows):
    names = []
    last_end = float('-inf')
    for name, start, end in sorted(shows, key=lambda s: s[2]):
        if start >= last_end:
            names.append(name)
            last_end = end
    return names`,
    tests: [
      t.eq("pick_shows([('long', 1, 10), ('a', 2, 3), ('b', 4, 5)])", "['a', 'b']"),
      t.eq("pick_shows([('p', 3, 5), ('q', 1, 3), ('r', 2, 4)])", "['q', 'p']"),
      t.hidden('pick_shows([])', '[]'),
      t.hidden("pick_shows([('x', 0, 5)])", "['x']"),
      t.hidden("pick_shows([('late', 8, 9), ('early', -4, -2), ('mid', -3, 8)])", "['early', 'late']"),
      t.hidden("pick_shows([('a', 1, 4), ('b', 2, 5), ('c', 3, 6)])", "['a']"),
    ],
    hints: ['Which field decides the order you look at the shows in?', 'Remember one number as you go: when the stage becomes free.', 'A starting value that every real start beats: `float(\'-inf\')`.'],
    explanation: 'Sort by end, then one pass with a single piece of state, `last_end`. Update it only when a show is taken.',
    signature: 'greedy:sort-by-end-names',
    minutes: 8,
    important: true,
  }),
  debug({
    id: 'b435-dbg-sort-start',
    title: 'Debug: the greedy that picks the long one',
    skills: ['interval_greedy', 'sort_key', 'interval_overlap'],
    difficulty: 3,
    prompt:
      '`bookings` is a list of `[start, end]` pairs in any order. `most_bookings(bookings)` should return the largest number of bookings one room can take (a booking may start when another ends).\n\n`most_bookings([[1, 10], [2, 3], [4, 5]])` should be `2`. Fix it.',
    brokenCode: `def most_bookings(bookings):
    count = 0
    last_end = float('-inf')
    for start, end in sorted(bookings):
        if start >= last_end:
            count += 1
            last_end = end
    return count`,
    solution: `def most_bookings(bookings):
    count = 0
    last_end = float('-inf')
    for start, end in sorted(bookings, key=lambda b: b[1]):
        if start >= last_end:
            count += 1
            last_end = end
    return count`,
    tests: [
      t.eq('most_bookings([[1, 10], [2, 3], [4, 5]])', '2'),
      t.eq('most_bookings([[1, 2], [2, 3]])', '2'),
      t.hidden('most_bookings([])', '0'),
      t.hidden('most_bookings([[1, 100], [11, 22], [1, 11], [2, 12]])', '2'),
      t.hidden('most_bookings([[1, 2], [1, 2], [1, 2]])', '1'),
      t.hidden('most_bookings([[0, 2], [1, 3], [2, 4]])', '2'),
    ],
    hints: ['Which booking does the loop take first in the failing test, and what does that cost?', 'The keep rule is fine. Look at the order the bookings arrive in.'],
    explanation: 'Sorted by start, an early booking that runs all day is taken first and blocks everything. Sorted by end, the booking that frees the room soonest is taken first, which can never hurt.',
    signature: 'debug:greedy-sorted-by-start',
    minutes: 4,
  }),
  write({
    id: 'b435-refused-mini',
    title: 'How many court requests to refuse',
    skills: ['interval_greedy', 'sort_key', 'interval_overlap', 'tuples'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    important: true,
    prompt:
      'A tennis court gets `requests` as `(start, hours)` tuples: the hour play begins and how long it lasts. A game may begin the moment the previous one finishes.\n\nWrite `refused(requests)` that returns the **fewest** requests that must be turned down so that the rest never overlap.\n\n`refused([(1, 9), (2, 1), (4, 1)])` → `1` (turn down the nine-hour one)',
    starterCode: `def refused(requests):
    pass`,
    solution: `def refused(requests):
    spans = [(start + hours, start) for start, hours in requests]
    spans.sort()
    kept = 0
    last_end = float('-inf')
    for end, start in spans:
        if start >= last_end:
            kept += 1
            last_end = end
    return len(requests) - kept`,
    tests: [
      t.eq('refused([(1, 9), (2, 1), (4, 1)])', '1'),
      t.eq('refused([(1, 1), (2, 1), (3, 1)])', '0'),
      t.hidden('refused([])', '0'),
      t.hidden('refused([(0, 2), (0, 2), (0, 2)])', '2'),
      t.hidden('refused([(1, 2), (2, 2), (3, 2)])', '1'),
      t.hidden('refused([(5, 1)])', '0'),
      t.hidden('refused([(0, 10), (1, 1), (3, 1), (5, 1), (4, 5)])', '2'),
    ],
    hints: [
      'Turning down as few as possible is the same as accepting as many as possible.',
      'You are given a length, not an end. The order you need depends on the end.',
      'Count what you keep, then subtract from the total.',
    ],
    explanation: 'Fewest removed = total − most kept, and most kept is the sort-by-end greedy.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    signature: 'greedy:min-removals-start-length',
    minutes: 10,
  }),
]

// ── LC 253 Meeting Rooms II ──────────────────────────────────────────────────
const meetingRoomsTwo = [
  output({
    id: 'b253-trace-heap',
    title: 'Trace the heap of end times',
    skills: ['min_rooms', 'heap_push_pop'],
    prompt: 'Each line prints the meeting’s start, the earliest end time still in the heap, and the heap’s size. What is printed?',
    code: `import heapq

meetings = [[0, 30], [5, 10], [15, 20]]
ends = []
for start, end in sorted(meetings):
    if ends and ends[0] <= start:
        heapq.heappop(ends)
    heapq.heappush(ends, end)
    print(start, ends[0], len(ends))
`,
    expectedOutput: '0 30 1\n5 10 2\n15 20 2',
    note: 'The heap holds one end time per room in use. `ends[0]` is the room that frees up first: if even that one is still busy, every room is.',
    explanation: 'At 5 the earliest end is 30, so a second room opens. At 15 the room that ended at 10 is free: its end is popped and replaced by 20, and the size stays 2.',
    signature: 'trace:min-rooms-heap',
    minutes: 3,
  }),
  write({
    id: 'b253-book',
    title: 'Book one meeting',
    skills: ['min_rooms', 'heap_push_pop', 'conditionals'],
    prompt:
      '`ends` is a min-heap (a list managed by `heapq`) holding the end time of every room in use. A meeting from `start` to `end` arrives. A room that ends at 10 is free for a meeting starting at 10.\n\nWrite `book(ends, start, end)`: if the room that frees up **earliest** is free by `start`, reuse it (remove its end time); either way record the new end time. Return the number of rooms now in use. Nothing is pre-imported.\n\n`book([10, 30], 12, 20)` → `2`, `book([10, 30], 5, 8)` → `3`',
    starterCode: `def book(ends, start, end):
    pass`,
    solution: `import heapq

def book(ends, start, end):
    if ends and ends[0] <= start:
        heapq.heappop(ends)
    heapq.heappush(ends, end)
    return len(ends)`,
    tests: [
      t.eq('book([10, 30], 12, 20)', '2'),
      t.eq('book([10, 30], 5, 8)', '3'),
      t.hidden('book([], 1, 2)', '1'),
      t.hidden('book([10], 10, 11)', '1'),
      t.check('the heap itself is updated', `ends = [10, 30]
book(ends, 15, 40)
assert sorted(ends) == [30, 40]
assert ends[0] == 30`, true),
    ],
    hints: ['You only ever need to look at one room: the one that ends first. Where does a min-heap keep it?', 'Guard against an empty heap before peeking.', 'At most one room is reused per meeting, and the new end time always goes in.'],
    explanation: 'Pop at most once, push exactly once. The heap’s size is the number of rooms in use right now.',
    signature: 'rooms:book-one',
    minutes: 6,
    important: true,
  }),
  debug({
    id: 'b253-dbg-drain',
    title: 'Debug: the desks that vanished',
    skills: ['min_rooms', 'heap_push_pop', 'while_loop'],
    difficulty: 3,
    prompt:
      '`shifts` is a list of `[start, end]` pairs in any order. Each worker needs a desk for their whole shift; a desk can be handed over at the minute a shift ends. `desks_needed(shifts)` should return the smallest number of desks that covers everyone.\n\n`desks_needed([[1, 5], [2, 6], [7, 8]])` should be `2`. Fix it.',
    brokenCode: `import heapq

def desks_needed(shifts):
    ends = []
    for start, end in sorted(shifts):
        while ends and ends[0] <= start:
            heapq.heappop(ends)
        heapq.heappush(ends, end)
    return len(ends)`,
    solution: `import heapq

def desks_needed(shifts):
    ends = []
    for start, end in sorted(shifts):
        if ends and ends[0] <= start:
            heapq.heappop(ends)
        heapq.heappush(ends, end)
    return len(ends)`,
    tests: [
      t.eq('desks_needed([[1, 5], [2, 6], [7, 8]])', '2'),
      t.eq('desks_needed([[0, 30], [5, 10], [15, 20]])', '2'),
      t.hidden('desks_needed([])', '0'),
      t.hidden('desks_needed([[1, 2], [2, 3], [3, 4]])', '1'),
      t.hidden('desks_needed([[1, 10], [2, 9], [3, 8], [20, 21]])', '3'),
      t.hidden('desks_needed([[5, 6]])', '1'),
    ],
    hints: ['Print `len(ends)` after each shift for the failing test. When does it drop, and should the answer ever drop?', 'The return value is the heap’s size at the very end. What must be true of the heap for that to be the answer?'],
    explanation: 'With `if`, each shift removes at most one end and adds one, so the heap never shrinks and its final size is the peak. With `while`, the heap shows only who is at a desk right now, and the final size forgets the busiest moment (you would need to track the largest size seen).',
    signature: 'debug:min-rooms-pop-all',
    minutes: 4,
  }),
  write({
    id: 'b253-reuses',
    title: 'How many meetings reused a room?',
    skills: ['min_rooms', 'heap_push_pop', 'sorting', 'accumulator'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt:
      '`meetings` is a list of `[start, end]` pairs in any order. Rooms are handed out in start order: a meeting takes over the room that freed up earliest if that room is free by its start (ending at 10 is free at 10), otherwise it opens a new room.\n\nWrite `reuses(meetings)` that returns how many meetings **took over** a room instead of opening one. Nothing is pre-imported.\n\n`reuses([[0, 30], [5, 10], [15, 20]])` → `1`',
    starterCode: `def reuses(meetings):
    pass`,
    solution: `import heapq

def reuses(meetings):
    ends = []
    count = 0
    for start, end in sorted(meetings):
        if ends and ends[0] <= start:
            heapq.heappop(ends)
            count += 1
        heapq.heappush(ends, end)
    return count`,
    tests: [
      t.eq('reuses([[0, 30], [5, 10], [15, 20]])', '1'),
      t.eq('reuses([[1, 2], [2, 3], [3, 4]])', '2'),
      t.hidden('reuses([])', '0'),
      t.hidden('reuses([[1, 5], [2, 6], [3, 7]])', '0'),
      t.hidden('reuses([[9, 10], [1, 2]])', '1'),
      t.hidden('reuses([[1, 10], [2, 3], [3, 4], [4, 5], [11, 12]])', '3'),
    ],
    hints: ['The meetings must be looked at in the order they begin.', 'One heap of end times; one counter that goes up each time an end time is removed.'],
    explanation: 'Every meeting either reuses a room or opens one, so rooms opened = meetings − reuses. That is the same number as the heap’s final size.',
    signature: 'rooms:count-reuses',
    minutes: 9,
  }),
  write({
    id: 'b253-platforms-mini',
    title: 'Platforms at a station',
    skills: ['min_rooms', 'heap_push_pop', 'sorting', 'interval_overlap'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    important: true,
    prompt:
      'Train `i` arrives at minute `arrivals[i]` and leaves at minute `departures[i]`. The two lists have the same length and are in no particular order. A platform can take a train arriving in the very minute the previous train leaves.\n\nWrite `platforms(arrivals, departures)` that returns the smallest number of platforms the station needs.\n\n`platforms([900, 940, 950], [910, 1200, 1120])` → `2`',
    starterCode: `def platforms(arrivals, departures):
    pass`,
    solution: `import heapq

def platforms(arrivals, departures):
    leaving = []
    for arrive, depart in sorted(zip(arrivals, departures)):
        if leaving and leaving[0] <= arrive:
            heapq.heappop(leaving)
        heapq.heappush(leaving, depart)
    return len(leaving)`,
    tests: [
      t.eq('platforms([900, 940, 950], [910, 1200, 1120])', '2'),
      t.eq('platforms([1, 2, 3], [2, 3, 4])', '1'),
      t.hidden('platforms([], [])', '0'),
      t.hidden('platforms([1, 1, 1], [5, 5, 5])', '3'),
      t.hidden('platforms([10, 1], [20, 5])', '1'),
      t.hidden('platforms([1, 2, 3, 10], [10, 9, 8, 11])', '3'),
      t.hidden('platforms([7], [8])', '1'),
    ],
    hints: [
      'First turn the two lists into one list of trains, and put the trains in the order they arrive.',
      'When a train arrives, the only platform worth asking about is the one whose train leaves soonest.',
      'What structure hands you the smallest of a changing collection of departure times?',
      'Nothing is pre-imported.',
    ],
    explanation: 'Sort by arrival; keep a min-heap of departure times, one per occupied platform. Reuse the earliest-leaving platform when you can, otherwise add one. The heap’s final size is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    signature: 'rooms:platforms-two-lists',
    minutes: 9,
  }),
]

const sections: PackSection[] = [
  { id: 'br-133', module: GRAPHS, title: 'Toward Clone Graph', summary: 'A dict from each original to its copy, filled in before you recurse.', exercises: cloneGraph },
  { id: 'br-417', module: GRAPHS, title: 'Toward Pacific Atlantic Water Flow', summary: 'Start at the edges, walk uphill into a visited set, intersect two sets.', exercises: waterFlow },
  { id: 'br-323', module: GRAPHS, title: 'Toward Number of Connected Components in an Undirected Graph', summary: 'A key for all n nodes, one shared visited set, one walk per unvisited node.', exercises: components },
  { id: 'br-261', module: GRAPHS, title: 'Toward Graph Valid Tree', summary: 'n - 1 edges and one walk that reaches everyone: both, never just one.', exercises: validTree },
  { id: 'd9h-check', module: HEAPS, title: 'Sorting + heaps check', summary: 'Sort keys, heap push/pop and top-k, cold from a signature.', exercises: heapCheck, gate: true },
  { id: 'br-252', module: HEAPS, title: 'Toward Meeting Rooms', summary: 'Sort by start, compare each start with the previous end.', exercises: meetingRooms },
  { id: 'br-57', module: HEAPS, title: 'Toward Insert Interval', summary: 'Three phases with one index: copy, widen, copy.', exercises: insertInterval },
  { id: 'br-435', module: HEAPS, title: 'Toward Non-overlapping Intervals', summary: 'Sort by end, keep what starts after the last kept end.', exercises: nonOverlapping },
  { id: 'br-253', module: HEAPS, title: 'Toward Meeting Rooms II', summary: 'A min-heap of end times: reuse the earliest-ending room or open another.', exercises: meetingRoomsTwo },
]

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'

export const pack: Pack = {
  sections,
  units: { 'Sorting + heaps': { check: 'd9h-check' } },
  bridges: [
    {
      lc: 133,
      title: 'Clone Graph',
      unit: 'Graphs',
      section: 'br-133',
      mode: 'bridge-first',
      prerequisiteSkills: ['graph_dfs', 'visited_set', 'dict_membership', 'graph_clone'],
      blocks: [
        { label: 'walk a graph without going round in circles', skills: ['graph_dfs', 'visited_set'], evidence: ['o8-d-order', 'cap-path-exists'] },
        { label: 'give every node a fresh neighbour list', skills: ['graph_clone', 'graph_adjacency'], reps: ['b133-copy-lists'] },
        { label: 'map each original to its copy', skills: ['graph_clone', 'dict_membership'], reps: ['b133-copy-reachable', 'b133-twins-wire'] },
        { label: 'register the copy before recursing', skills: ['graph_clone', 'graph_dfs'], reps: ['b133-dbg-late-register', 'b133-copy-chain-mini'] },
      ],
    },
    {
      lc: 417,
      title: 'Pacific Atlantic Water Flow',
      unit: 'Graphs',
      section: 'br-417',
      mode: 'bridge-first',
      prerequisiteSkills: ['grid_neighbors', 'visited_set', 'border_reach', 'set_membership'],
      blocks: [
        { label: 'walk a grid with a visited set', skills: ['grid_neighbors', 'visited_set'], evidence: ['o7-v-flood-fill', 'cap-number-of-islands'] },
        { label: 'collect the cells on an edge', skills: ['border_reach', 'grid_nested'], reps: ['b417-border-cells'] },
        { label: 'spread from many starts into one set', skills: ['border_reach', 'visited_set'], reps: ['b417-spread-many'] },
        { label: 'walk uphill from the edge', skills: ['border_reach', 'grid_neighbors'], reps: ['b417-higher-neighbors', 'b417-dbg-downhill'] },
        { label: 'keep the cells both walks reached', skills: ['border_reach', 'set_membership'], reps: ['b417-both-edges-mini'] },
      ],
    },
    {
      lc: 323,
      title: 'Number of Connected Components in an Undirected Graph',
      unit: 'Graphs',
      section: 'br-323',
      mode: 'bridge-first',
      prerequisiteSkills: ['graph_adjacency', 'graph_dfs', 'visited_set', 'connected_components'],
      blocks: [
        { label: 'build the adjacency list from edges', skills: ['graph_adjacency'], evidence: ['o8-a-build-undirected'] },
        { label: 'walk one whole group', skills: ['graph_dfs', 'visited_set'], evidence: ['o8-d-stack', 'o8-d-order'] },
        { label: 'start a walk from each unvisited node', skills: ['connected_components', 'visited_set'], reps: ['b323-walk-starts'] },
        { label: 'give nodes with no edges a key', skills: ['connected_components', 'graph_adjacency'], reps: ['b323-dbg-isolated'] },
        { label: 'count or measure the groups', skills: ['connected_components'], reps: ['b323-circle-sizes-mini'] },
      ],
    },
    {
      lc: 261,
      title: 'Graph Valid Tree',
      unit: 'Graphs',
      section: 'br-261',
      mode: 'bridge-first',
      prerequisiteSkills: ['graph_adjacency', 'graph_dfs', 'visited_set', 'graph_tree_check'],
      blocks: [
        { label: 'build the adjacency list from edges', skills: ['graph_adjacency'], evidence: ['o8-a-build-undirected'] },
        { label: 'reach every node from node 0', skills: ['graph_tree_check', 'graph_dfs'], reps: ['b261-reach-all'], evidence: ['o8-d-stack'] },
        { label: 'check the edge count and the reach together', skills: ['graph_tree_check'], reps: ['b261-dbg-edges-only'] },
        { label: 'count the edges a connected graph needs', skills: ['graph_tree_check', 'graph_dfs'], reps: ['b261-spare-cables-mini'] },
      ],
    },
    {
      lc: 252,
      title: 'Meeting Rooms',
      unit: 'Intervals',
      section: 'br-252',
      mode: 'attempt-first',
      prerequisiteSkills: ['sort_key', 'interval_overlap'],
      blocks: [
        { label: 'sort the intervals by start', skills: ['sort_key'], evidence: ['cap-merge-intervals'] },
        { label: 'compare each start with the previous end', skills: ['interval_overlap'], evidence: ['d9-iv-can-attend'] },
        { label: 'stop at the first clash', skills: ['interval_overlap', 'sort_key'], reps: ['b252-first-clash'] },
        { label: 'check a whole schedule', skills: ['interval_overlap'], reps: ['b252-one-oven-mini'] },
      ],
    },
    {
      lc: 57,
      title: 'Insert Interval',
      unit: 'Intervals',
      section: 'br-57',
      mode: 'bridge-first',
      prerequisiteSkills: ['interval_overlap', 'while_loop', 'interval_insert'],
      blocks: [
        { label: 'merge overlapping intervals', skills: ['interval_overlap'], evidence: ['d9-iv-merge-sorted', 'cap-merge-intervals'] },
        { label: 'tell before, overlapping and after apart', skills: ['interval_insert', 'interval_overlap'], reps: ['b57-before-after'] },
        { label: 'widen the new interval over every overlap', skills: ['interval_insert'], reps: ['b57-absorb', 'b57-dbg-one-side'] },
        { label: 'run the three phases in order', skills: ['interval_insert', 'while_loop'], reps: ['b57-add-pages-mini'] },
      ],
    },
    {
      lc: 435,
      title: 'Non-overlapping Intervals',
      unit: 'Intervals',
      section: 'br-435',
      mode: 'bridge-first',
      prerequisiteSkills: ['sort_key', 'interval_overlap', 'interval_greedy'],
      blocks: [
        { label: 'sort records by a chosen field', skills: ['sort_key'], evidence: ['d9-key-records'] },
        { label: 'keep what starts after the last kept end', skills: ['interval_greedy', 'interval_overlap'], reps: ['b435-keep-talks'] },
        { label: 'sort by end, not by start', skills: ['interval_greedy', 'sort_key'], reps: ['b435-pick-shows', 'b435-dbg-sort-start'] },
        { label: 'turn the most kept into the fewest removed', skills: ['interval_greedy'], reps: ['b435-refused-mini'] },
      ],
    },
    {
      lc: 253,
      title: 'Meeting Rooms II',
      unit: 'Intervals',
      section: 'br-253',
      mode: 'bridge-first',
      prerequisiteSkills: ['sorting', 'heap_push_pop', 'interval_overlap', 'min_rooms'],
      blocks: [
        { label: 'push and pop a min-heap', skills: ['heap_push_pop'], evidence: ['d9-heap-ropes', 'cap-kth-largest'] },
        { label: 'sort the meetings by start', skills: ['sorting', 'interval_overlap'], evidence: ['d9-iv-can-attend'] },
        { label: 'reuse the earliest-ending room or open a new one', skills: ['min_rooms', 'heap_push_pop'], reps: ['b253-trace-heap', 'b253-book'] },
        { label: 'read the answer from the heap size', skills: ['min_rooms'], reps: ['b253-dbg-drain', 'b253-reuses'] },
        { label: 'count the rooms for a whole schedule', skills: ['min_rooms', 'sorting'], reps: ['b253-platforms-mini'] },
      ],
    },
  ],
  briefs: {
    // ── LC 133 ───────────────────────────────────────────────────────────────
    'b133-copy-lists': {
      inputs: [{ name: 'graph', is: 'a dict: node → list of its neighbours' }],
      returns: 'a **new** dict with the same keys, where every value is a **new** list holding the same neighbours.',
      catch: 'If you append to a list in your result, does the list in `graph` grow too?',
    },
    'b133-copy-reachable': {
      inputs: [
        { name: 'graph', is: 'a dict: node → list of its neighbours. It may contain cycles and parts that `start` cannot reach.' },
        { name: 'start', is: 'the node to begin from (always a key of `graph`)' },
      ],
      returns: 'a new dict with an entry for every node you can reach from `start`, each with its own new neighbour list.',
      catch: 'A cycle brings you back to a node you already started on. How will you know, the moment you arrive?',
    },
    'b133-twins-wire': {
      inputs: [{ name: 'nodes', is: 'a list of every `Node` in the graph. Each has `.val` and `.neighbors` (a list of `Node` objects from the same list).' }],
      returns: 'a list of brand-new `Node` objects, one per original and in the same order, connected to each other the way the originals are.',
      catch: 'A copy’s neighbours must be **copies**. Given an original, how do you find the copy that stands for it?',
    },
    'b133-dbg-late-register': {
      task: 'It should hand back a full copy of the graph that `node` belongs to. It only manages a node with no neighbours. Fix it.',
      inputs: [{ name: 'node', is: 'one `Node` of a connected graph; its `.neighbors` lead to the others, and back again' }],
      returns: 'the copy of `node`: a new `Node` whose neighbours are new nodes too, wired like the originals.',
      catch: 'Run the first test and read the error. Which question does the code keep answering "no" to?',
    },
    'b133-copy-chain-mini': {
      inputs: [{ name: 'head', is: 'the first `ListNode` of a chain, or `None`. Following `.next` either ends at `None` or comes back to a node you have already passed.' }],
      returns: 'the first node of a copy: all new `ListNode`s, same values, and looping back at the same place if the original loops.',
      catch: 'On a ring, "keep going until `None`" never stops. What tells you that you have been here before, and what should you hand back then?',
    },

    // ── LC 417 ───────────────────────────────────────────────────────────────
    'b417-border-cells': {
      inputs: [
        { name: 'rows', is: 'how many rows the grid has (at least 1)' },
        { name: 'cols', is: 'how many columns it has (at least 1)' },
      ],
      returns: 'a sorted list of `(r, c)` tuples: every cell in row 0 or column 0, each listed once.',
      catch: 'Which cell sits on both edges?',
    },
    'b417-spread-many': {
      inputs: [
        { name: 'grid', is: 'a list of rows of ints: `0` is open, `1` is a wall' },
        { name: 'starts', is: 'a list of `(r, c)` tuples, all open cells. It can be empty.' },
      ],
      returns: 'a number: how many open cells can be reached from at least one of the starts, moving up, down, left or right.',
      catch: 'Two starts in the same open area reach the same cells. How do you avoid counting them twice?',
    },
    'b417-higher-neighbors': {
      inputs: [
        { name: 'heights', is: 'a grid (list of rows) of numbers' },
        { name: 'r', is: 'the row of the cell you are standing on' },
        { name: 'c', is: 'its column' },
      ],
      returns: 'a list of `(row, col)` tuples: the neighbours inside the grid that are at least as high as your cell, in the order up, down, left, right.',
      catch: 'Same height counts. And which must you check first: the height or the bounds?',
    },
    'b417-dbg-downhill': {
      task: 'It should list every cell whose rain can run off the left side of the grid. It finds the wrong cells. Fix it.',
      inputs: [{ name: 'heights', is: 'a grid of numbers. Water moves from a cell to a neighbour of equal or lower height.' }],
      returns: 'a sorted list of `[r, c]` pairs.',
      catch: 'The code starts at the left column and moves away from it. Is that the direction the water moves?',
    },
    'b417-both-edges-mini': {
      inputs: [{ name: 'field', is: 'a grid of heights with at least one row and one column. Water moves to a neighbour of equal or lower height.' }],
      returns: 'a sorted list of `[r, c]` pairs: the plots whose water can get off the top edge **and** off the bottom edge.',
      catch: 'Plots in row 0 certainly drain north. Can you work outward from the plots you are sure about, instead of testing each plot?',
    },

    // ── LC 323 ───────────────────────────────────────────────────────────────
    'b323-walk-starts': {
      inputs: [{ name: 'graph', is: 'a dict: node → list of neighbours. Every node is a key, and every link appears in both directions.' }],
      returns: 'a list: the first node of each connected group, in the order the keys appear.',
      catch: 'How does a later node know an earlier walk has already been through it?',
    },
    'b323-dbg-isolated': {
      task: 'It should count the teams. It misses some. Fix it.',
      inputs: [
        { name: 'n', is: 'how many players there are, numbered `0` to `n - 1`' },
        { name: 'pairs', is: 'a list of `[a, b]`: these two players know each other' },
      ],
      returns: 'a number: how many separate teams there are. A player who knows nobody is a team.',
      catch: 'In the failing test, which player never appears in `pairs`?',
    },
    'b323-circle-sizes-mini': {
      inputs: [
        { name: 'n', is: 'how many people there are, numbered `0` to `n - 1`. Can be 0.' },
        { name: 'links', is: 'a list of `[a, b]` friendships. The same friendship may be listed twice.' },
      ],
      returns: 'a list of numbers: the size of each circle of connected people, smallest first.',
      catch: 'Someone who appears in no link is still a circle. Will your code ever look at them?',
    },

    // ── LC 261 ───────────────────────────────────────────────────────────────
    'b261-reach-all': {
      inputs: [
        { name: 'n', is: 'how many nodes there are, numbered `0` to `n - 1` (at least 1)' },
        { name: 'edges', is: 'a list of `[a, b]` pairs, each a two-way link' },
      ],
      returns: '`True` if starting at node `0` and following links gets you to every node, otherwise `False`.',
      catch: 'You do not need to check the nodes one by one at the end. What single number tells you whether the walk got everywhere?',
    },
    'b261-dbg-edges-only': {
      task: 'It should say `True` only when the graph is a tree: one piece, no cycle. It says `True` too often. Fix `is_tree`; the helper is fine.',
      inputs: [
        { name: 'n', is: 'how many nodes there are, numbered `0` to `n - 1` (at least 1)' },
        { name: 'edges', is: 'a list of `[a, b]` two-way links, none listed twice' },
      ],
      returns: '`True` or `False`.',
      catch: 'Draw the failing graph. It passes the test the code makes. What is wrong with it anyway?',
    },
    'b261-spare-cables-mini': {
      inputs: [
        { name: 'n', is: 'how many computers there are, numbered `0` to `n - 1` (at least 1)' },
        { name: 'cables', is: 'a list of `[a, b]` pairs: a cable between two computers. No pair twice.' },
      ],
      returns: '`-1` if some computer is cut off from computer `0`. Otherwise the number of cables beyond the bare minimum needed to keep everyone connected.',
      catch: 'What is the bare minimum for 2 computers? For 3? For `n`?',
    },

    // ── Sorting + heaps check ────────────────────────────────────────────────
    'd9h-c-cheapest-first': {
      inputs: [{ name: 'menu', is: "a list of `(name, price)` tuples, like `[('tea', 3), ('cake', 6)]`" }],
      returns: 'a list of names only, lowest price first. Items with the same price keep the order they came in.',
      catch: 'What do tuples sort by when you do not say?',
    },
    'd9h-c-rank-teams': {
      inputs: [{ name: 'teams', is: "a list of dicts, each with the keys `'name'`, `'wins'` and `'losses'`" }],
      returns: 'a list of team names: most wins first; when wins are equal, fewer losses first.',
      catch: 'One of the two orderings runs high-to-low and the other low-to-high.',
    },
    'd9h-c-under-limit': {
      inputs: [
        { name: 'nums', is: 'a list of numbers in any order. Leave it as it is.' },
        { name: 'limit', is: 'a number' },
      ],
      returns: 'a new list: the values strictly below `limit`, smallest first.',
      catch: 'A value equal to `limit` is not below it. And what if nothing is left to look at?',
    },
    'd9h-c-k-tallest': {
      inputs: [
        { name: 'heights', is: 'a list of numbers in any order' },
        { name: 'k', is: 'how many to return. It can be 0, or more than there are.' },
      ],
      returns: 'a list of the `k` largest values, smallest of them first.',
      catch: 'You may hold at most `k` values at a time. Which one leaves when a better one arrives?',
    },
    'd9h-c-busiest-hours': {
      inputs: [
        { name: 'log', is: 'a list of hours (ints 0–23), one per customer, in any order' },
        { name: 'k', is: 'how many hours to return' },
      ],
      returns: 'a list of the `k` hours that appear most often in `log`, earliest hour first.',
      catch: 'The order you pick the winners in (busiest first) is not the order you return them in. And who wins a tie?',
    },

    // ── LC 252 ───────────────────────────────────────────────────────────────
    'b252-first-clash': {
      inputs: [{ name: 'meetings', is: 'a list of `[start, end]` pairs in any order; no two start at the same time' }],
      returns: 'the first meeting, in start order, that begins before the previous one has ended. `None` if that never happens.',
      catch: 'A meeting that starts exactly when the previous one ends is fine.',
    },
    'b252-one-oven-mini': {
      inputs: [{ name: 'bakes', is: 'a list of `(start, minutes)` tuples in any order: when a tray goes in, and how long it bakes' }],
      returns: '`True` if no tray ever needs the oven while another is still in it, otherwise `False`.',
      catch: 'The second number is a length, not a time of day.',
    },

    // ── LC 57 ────────────────────────────────────────────────────────────────
    'b57-before-after': {
      inputs: [
        { name: 'intervals', is: 'a list of `[start, end]` pairs' },
        { name: 'new', is: 'one more `[start, end]` pair' },
      ],
      returns: 'a list of two lists: first the intervals that finish before `new` begins, then the ones that begin after `new` finishes. Order inside each list as in the input.',
      catch: 'An interval that ends exactly where `new` starts touches it. Which list does it belong in?',
    },
    'b57-absorb': {
      inputs: [
        { name: 'intervals', is: 'a list of `[start, end]` pairs, sorted by start, none overlapping each other' },
        { name: 'new', is: 'one more `[start, end]` pair. Do not modify it.' },
      ],
      returns: 'one `[start, end]` pair: `new` stretched to cover every interval it overlaps or touches.',
      catch: 'An overlapping interval can stick out on the left, on the right, or on both sides.',
    },
    'b57-dbg-one-side': {
      task: 'It should add `new` to the sorted list and merge it with anything it overlaps. The merged slot comes out wrong. Fix it.',
      inputs: [
        { name: 'slots', is: 'a list of `[start, end]` pairs, sorted by start, none overlapping' },
        { name: 'new', is: 'the `[start, end]` pair to add' },
      ],
      returns: 'a new sorted list with no overlaps.',
      catch: 'In the failing test, `[1, 3]` overlaps `[2, 5]`. What should the merged slot be, and which half of it is missing?',
    },
    'b57-add-pages-mini': {
      inputs: [
        { name: 'ranges', is: 'a sorted list of `[first, last]` page ranges (whole numbers), with at least one page missing between any two' },
        { name: 'new', is: 'the `[first, last]` range to add' },
      ],
      returns: 'the new sorted list of ranges, where ranges that overlap or are directly adjacent have become one.',
      catch: '`[1, 2]` and `[3, 4]` share no page but leave no gap either. They must join.',
    },

    // ── LC 435 ───────────────────────────────────────────────────────────────
    'b435-keep-talks': {
      inputs: [{ name: 'talks', is: 'a list of `[start, end]` pairs, already in order of end time' }],
      returns: 'a list of the talks you keep: each one starts at or after the end of the one kept before it.',
      catch: 'Compare with the last talk you **kept**, not the last talk you looked at.',
    },
    'b435-pick-shows': {
      inputs: [{ name: 'shows', is: 'a list of `(name, start, end)` tuples in any order; all end times differ' }],
      returns: 'a list of names: the shows chosen by repeatedly taking the earliest-ending show that still fits, in playing order.',
      catch: 'The tuples start with a name. What would a plain sort order them by?',
    },
    'b435-dbg-sort-start': {
      task: 'It should return the most bookings one room can take without overlap. It sometimes returns fewer. Fix it.',
      inputs: [{ name: 'bookings', is: 'a list of `[start, end]` pairs in any order' }],
      returns: 'a number: the largest count of bookings that fit one after another.',
      catch: 'Follow the failing test by hand. Which booking is accepted first, and was that a good choice?',
    },
    'b435-refused-mini': {
      inputs: [{ name: 'requests', is: 'a list of `(start, hours)` tuples in any order: the hour a game begins and how long it lasts' }],
      returns: 'a number: the fewest requests to turn down so that no two accepted games overlap.',
      catch: 'It is easier to count the games you can accept. Then what?',
    },

    // ── LC 253 ───────────────────────────────────────────────────────────────
    'b253-trace-heap': {
      task: PREDICT,
      catch: 'Write the heap down after every meeting. A pop only happens when the smallest end time is not after the new start.',
    },
    'b253-book': {
      inputs: [
        { name: 'ends', is: 'a min-heap list: one end time for each room in use. It may be empty. Change it in place.' },
        { name: 'start', is: 'when the new meeting begins' },
        { name: 'end', is: 'when the new meeting finishes' },
      ],
      returns: 'a number: how many rooms are in use once this meeting is booked.',
      catch: 'If the room that frees up first is still busy, is there any point checking the others?',
    },
    'b253-dbg-drain': {
      task: 'It should return the smallest number of desks that covers every shift. For some inputs the answer comes out too small. Fix it.',
      inputs: [{ name: 'shifts', is: 'a list of `[start, end]` pairs in any order' }],
      returns: 'a number of desks.',
      catch: 'The answer is the busiest moment of the day. Does the heap still remember that moment when the loop ends?',
    },
    'b253-reuses': {
      inputs: [{ name: 'meetings', is: 'a list of `[start, end]` pairs in any order' }],
      returns: 'a number: how many meetings moved into a room that an earlier meeting had finished with.',
      catch: 'Each meeting can take over at most one room, and it should be the one that became free first.',
    },
    'b253-platforms-mini': {
      inputs: [
        { name: 'arrivals', is: 'a list of arrival minutes, one per train, in no particular order' },
        { name: 'departures', is: 'the matching departure minutes: `departures[i]` belongs to the train that arrives at `arrivals[i]`' },
      ],
      returns: 'a number: the fewest platforms so that no two trains ever share one.',
      catch: 'Sorting the two lists separately would break the link between a train’s arrival and its departure.',
    },
  },
  primers: [
    {
      id: 'graph-clone',
      title: 'Copying a graph',
      skills: ['graph_clone'],
      what: 'To copy a structure whose pieces point at each other, every original needs **exactly one** copy, and every pointer in the copy must lead to another copy. A dict from **original → copy** gives you both: it tells you whether a node has been copied yet, and it finds the copy when you need to point at it.',
      model: 'A guest list at the door: the first time a node shows up it gets a twin and is written down; every later time you just look up its twin.',
      syntax: [
        { code: 'copies = {}', note: 'original → its copy. Also your visited set.' },
        { code: 'if node in copies:\n    return copies[node]', note: 'Seen before: hand back the same copy, never a second one.' },
        { code: 'copy = Node(node.val)', note: 'First visit: make the copy, empty for now.' },
        { code: 'copies[node] = copy', note: 'Write it down **before** following any pointer.' },
        { code: 'copy.neighbors.append(copies[nbr])', note: 'Wire copy to copy, through the dict.' },
      ],
      example: {
        code: `class Dancer:
    def __init__(self, name):
        self.name = name
        self.partner = None

ana, ben = Dancer('ana'), Dancer('ben')
ana.partner, ben.partner = ben, ana   # they point at each other

twin = {}                             # original -> copy
for d in [ana, ben]:
    twin[d] = Dancer(d.name)          # every copy exists first
for d in [ana, ben]:
    twin[d].partner = twin[d.partner] # then copy points at copy

ana2 = twin[ana]
print(ana2.name, ana2.partner.name)
print(ana2 is ana, ana2.partner is ben)
print(ana2.partner.partner is ana2)`,
        output: `ana ben
False False
True`,
      },
      gotchas: [
        'Storing the copy in the dict **after** recursing into its neighbours never ends on a cycle: the walk comes back and finds no entry.',
        'Pointing a copy at an **original** neighbour looks right when you print values. Check with `is`.',
        '`dict(graph)` or `list(nodes)` only copies the outer container; the inner lists and objects are still shared.',
        'Objects work as dict keys out of the box: two different nodes with the same `val` are still different keys.',
      ],
    },
    {
      id: 'border-reach',
      title: 'Reaching inward from the borders',
      skills: ['border_reach'],
      what: 'Some questions ask "from which cells can you get **to the edge**?". Searching from every cell repeats the same work again and again. Turn it around: the edge cells certainly qualify, so start from **all of them at once** and walk backwards (against the rule of movement) into one visited set. Everything the walk touches qualifies. For two edges, do it twice and keep the cells in both sets.',
      model: 'Instead of asking every house whether it can reach the sea, start at the shore and mark every house the sea could have been reached from.',
      syntax: [
        { code: 'for c in range(cols):\n    walk(0, c, seen)', note: 'Every cell of the top row is a start.' },
        { code: 'for r in range(rows):\n    walk(r, cols - 1, seen)', note: 'Every cell of the right column.' },
        { code: 'if h[nr][nc] >= h[r][c]:', note: 'Reversed rule: water runs down, so the walk goes up.' },
        { code: 'both = first & second', note: 'Cells that are in both visited sets.' },
        { code: 'sorted([r, c] for r, c in both)', note: 'A set of tuples as a sorted list of pairs.' },
      ],
      example: {
        code: `# A strip of roof tiles. Rain runs to a tile that is equal or lower.
tiles = [2, 3, 5, 4, 1]

left = {0}                  # the left end drains by definition
i = 0
while i + 1 < len(tiles) and tiles[i + 1] >= tiles[i]:
    i += 1                  # walk UPHILL, away from the edge
    left.add(i)

right = {len(tiles) - 1}
i = len(tiles) - 1
while i - 1 >= 0 and tiles[i - 1] >= tiles[i]:
    i -= 1
    right.add(i)

print(sorted(left))
print(sorted(right))
print(sorted(left & right))`,
        output: `[0, 1, 2]
[2, 3, 4]
[2]`,
      },
      gotchas: [
        'Walking from the edge with the forward rule (to lower cells) answers a different question: where water **from the edge** would go.',
        'Equal heights count. `>` instead of `>=` cuts flat ground off.',
        'One visited set **per edge**. Sharing a single set between the two walks makes every reached cell look like it reached both.',
        'A corner cell is on two edges; a set keeps it from being started twice.',
      ],
    },
    {
      id: 'graph-tree-check',
      title: 'Is this graph a tree?',
      skills: ['graph_tree_check'],
      what: 'A **tree** is an undirected graph that is in one piece and has no cycle. For `n` nodes there is a shortcut that needs no cycle detection: it is a tree exactly when it has **`n - 1` edges** and **one walk reaches all `n` nodes**. Fewer edges cannot connect everything; more edges must close a cycle.',
      model: 'Connecting n towns takes n - 1 roads if none is wasted. Count the roads, then check nobody is cut off.',
      syntax: [
        { code: 'if len(edges) != n - 1:\n    return False', note: 'The cheap test first.' },
        { code: 'graph = {i: [] for i in range(n)}', note: 'A key for every node, even one with no edges.' },
        { code: 'seen = {0}\nstack = [0]', note: 'One walk, from any single node.' },
        { code: 'return len(seen) == n', note: 'In one piece: the walk visited everyone.' },
      ],
      example: {
        code: `def reach_count(graph, start):
    seen = {start}
    stack = [start]
    while stack:
        for nxt in graph[stack.pop()]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return len(seen)

shapes = {
    'line': {0: [1], 1: [0, 2], 2: [1, 3], 3: [2]},
    'loop+loner': {0: [1, 2], 1: [0, 2], 2: [0, 1], 3: []},
    'square': {0: [1, 3], 1: [0, 2], 2: [1, 3], 3: [0, 2]},
}
for name, g in shapes.items():
    n = len(g)
    edges = sum(len(v) for v in g.values()) // 2
    print(name, edges == n - 1, reach_count(g, 0) == n)`,
        output: `line True True
loop+loner True False
square False True`,
      },
      gotchas: [
        'The edge count alone is fooled by a cycle plus a cut-off node: 4 nodes, 3 edges, not a tree.',
        'Reaching everyone alone is fooled by an extra edge: a square is connected but has a cycle.',
        'Building the graph only from the edge list leaves isolated nodes without a key.',
        'One node and no edges is a tree: `0 == 1 - 1`, and the walk reaches the one node.',
      ],
    },
    {
      id: 'interval-insert',
      title: 'Inserting into sorted intervals',
      skills: ['interval_insert'],
      what: 'When a list of intervals is **already sorted and non-overlapping**, adding one more does not need a re-sort. Relative to the new interval, every existing one is either entirely **before** it, **overlapping** it, or entirely **after** it, and because the list is sorted those three groups come in that order. So: copy the first group, widen the new interval over the second, add it once, copy the third.',
      model: 'Sliding a book onto a sorted shelf: skip the ones that go before it, absorb the ones it replaces, leave the rest as they are.',
      syntax: [
        { code: 'while i < n and ivs[i][1] < start:', note: 'Phase 1: ends before the new one starts. Copy it.' },
        { code: 'while i < n and ivs[i][0] <= end:', note: 'Phase 2: starts before the new one ends. Overlap.' },
        { code: 'start = min(start, ivs[i][0])\nend = max(end, ivs[i][1])', note: 'Widen on both sides.' },
        { code: 'out.append([start, end])', note: 'Exactly once, after phase 2.' },
        { code: 'while i < n:', note: 'Phase 3: everything left is after. Copy it.' },
      ],
      example: {
        code: `new = [10, 14]
shifts = [[1, 3], [8, 11], [13, 15], [20, 22]]
for s in shifts:
    if s[1] < new[0]:
        print(s, 'before')
    elif s[0] > new[1]:
        print(s, 'after')
    else:
        print(s, 'overlaps')
        new = [min(new[0], s[0]), max(new[1], s[1])]
print(new)`,
        output: `[1, 3] before
[8, 11] overlaps
[13, 15] overlaps
[20, 22] after
[8, 15]`,
      },
      gotchas: [
        'Widening only the end loses the left part of an interval that starts earlier than the new one.',
        'Appending the new interval inside a loop adds it several times, or never when the list is empty. Append it once, between the loops.',
        'Every `while` needs the `i < n` guard first, or the last phase reads past the end.',
        'Phase 2 compares with the **widened** end, which is why it uses the running `end`, not the original.',
      ],
    },
    {
      id: 'interval-greedy',
      title: 'Greedy by end time',
      skills: ['interval_greedy'],
      what: 'To fit the **most** non-overlapping intervals into one resource, sort them by **end** and take each one that starts at or after the end of the last one taken. The interval that finishes first leaves the most room for the rest, so taking it can never cost you. "Fewest to remove" is the same question: total minus the most you can keep.',
      model: 'At a buffet with one plate, always take the dish that is ready soonest; it never blocks more than any other choice would.',
      syntax: [
        { code: 'ivs.sort(key=lambda iv: iv[1])', note: 'By END, not by start.' },
        { code: "last_end = float('-inf')", note: 'Nothing kept yet: any start is late enough.' },
        { code: 'if start >= last_end:', note: 'Fits after the last kept one (touching is fine).' },
        { code: '    kept += 1\n    last_end = end', note: 'Keep it, and move the boundary.' },
        { code: 'removed = len(ivs) - kept', note: 'The flip side of the same count.' },
      ],
      example: {
        code: `def kept_in(order):
    kept = []
    last_end = float('-inf')
    for start, end in order:
        if start >= last_end:
            kept.append([start, end])
            last_end = end
    return kept

films = [[1, 9], [2, 4], [5, 7], [8, 10]]
print(kept_in(sorted(films)))
print(kept_in(sorted(films, key=lambda f: f[1])))`,
        output: `[[1, 9]]
[[2, 4], [5, 7], [8, 10]]`,
      },
      gotchas: [
        'Sorting by start lets one early, long interval block everything behind it.',
        'Update `last_end` only when you keep an interval, never when you skip one.',
        '`>=` or `>`: decide whether an interval may start exactly when the previous one ends.',
        'A plain `sorted()` on pairs sorts by start. Sorting by end needs a `key`.',
      ],
    },
    {
      id: 'min-rooms',
      title: 'Rooms from end times',
      skills: ['min_rooms'],
      what: 'How many rooms (or desks, or platforms) do overlapping bookings need? Take the bookings in **start order** and keep a **min-heap of end times**, one per room in use. For each booking look only at `heap[0]`, the room that frees up first: if it is free by now, pop it (reuse); either way push the new end. Because each booking pops at most one and pushes one, the heap never shrinks, and its final size is the most rooms ever in use at once.',
      model: 'A receptionist who only watches the clock of the room that empties next: if that one is not free, none is.',
      syntax: [
        { code: 'import heapq', note: 'Nothing is pre-imported.' },
        { code: 'for start, end in sorted(meetings):', note: 'Start order is essential.' },
        { code: 'if ends and ends[0] <= start:', note: 'The earliest-ending room is free (guard the empty heap).' },
        { code: '    heapq.heappop(ends)', note: 'Reuse it: at most ONE pop per booking.' },
        { code: 'heapq.heappush(ends, end)', note: 'This booking’s room, new or reused.' },
        { code: 'return len(ends)', note: 'Rooms ever needed.' },
      ],
      example: {
        code: `import heapq

# Laptops lent out at a library desk: (taken, returned)
loans = [(9, 12), (10, 11), (11, 13), (12, 14)]
due = []                        # return times of laptops that are out
for taken, back in sorted(loans):
    if due and due[0] <= taken:
        heapq.heappop(due)      # one is back: lend that one again
    heapq.heappush(due, back)
    print(taken, sorted(due))
print(len(due), 'laptops needed')`,
        output: `9 [12]
10 [11, 12]
11 [12, 13]
12 [13, 14]
2 laptops needed`,
      },
      gotchas: [
        'Popping with `while` empties out every free room, so the final heap size is no longer the peak. Use `if`, or track the largest size seen.',
        'Without sorting by start, a room can look free for a booking that actually began earlier.',
        '`ends[0]` on an empty heap is an IndexError: check `ends` first.',
        '`<=` or `<`: decide whether a room that ends at 10 can host a meeting starting at 10.',
      ],
    },
  ],
}
