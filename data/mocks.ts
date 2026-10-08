import type { Exercise } from '@/lib/types'
import { code, t } from '@/data/exercises/build'

/** A 45-minute mock interview: an ordered set of problems, no hints by default. */
export interface MockInterview {
  id: string
  title: string
  minutes: number
  exerciseIds: string[]
  note: string
}

const M = { stage: 'interview', repType: 'interview', minutes: 20 } as const

export const MOCK_EXERCISES: Exercise[] = [
  // ---------------------------------------------------------------- mock 1
  code({
    id: 'mock-1-a',
    title: 'Most active user',
    skills: ['frequency_map', 'dict_get', 'dict_items', 'edge_cases'],
    ...M,
    difficulty: 3,
    prompt:
      'A service logs one entry per request: the id of the user who made it. Given the log `events` (a non-empty list of strings, oldest first), return the user with the most requests. If several users tie, return the one whose **first** request appears earliest in the log.',
    starterCode: `def most_active(events):
    pass
`,
    solution: `def most_active(events):
    counts = {}
    for user in events:
        counts[user] = counts.get(user, 0) + 1
    best = events[0]
    for user in counts:
        if counts[user] > counts[best]:
            best = user
    return best
`,
    tests: [
      t.eq('most_active(["ann", "bob", "ann"])', '"ann"'),
      t.eq('most_active(["bob", "ann", "ann", "bob"])', '"bob"'),
      t.hidden('most_active(["x"])', '"x"'),
      t.hidden('most_active(["a", "b", "c"])', '"a"'),
      t.hidden('most_active(["c", "b", "b", "c", "a", "a", "a"])', '"a"'),
      t.hidden('most_active(["z", "y", "y", "z"])', '"z"'),
      t.hidden('most_active(["p", "q", "q"])', '"q"'),
      t.hidden('most_active(["m"] * 5 + ["n"] * 5)', '"m"'),
    ],
    examples: [
      { input: 'events = ["ann", "bob", "ann"]', output: '"ann"' },
      { input: 'events = ["bob", "ann", "ann", "bob"]', output: '"bob"', note: 'Both have 2; bob appeared first.' },
    ],
    hints: [
      'You need a count per user, and a fair way to break ties.',
      'Build a frequency dict in one pass.',
      'Python dicts remember insertion order, which is first-appearance order here.',
      'Count with .get, then scan the dict keys in order keeping the best with a strict > comparison.',
    ],
    explanation:
      'Counting is O(n). Because dict keys come out in first-insertion order, a strict `>` while scanning keeps the earliest user on ties without storing first indexes separately (storing them is also a fine answer).',
    complexity: { time: 'O(n)', space: 'O(u) for u distinct users' },
    signature: 'mock:freq-map-argmax-tiebreak',
  }),
  code({
    id: 'mock-1-b',
    title: 'Spreading outage',
    skills: ['bfs', 'bfs_levels', 'queue_deque', 'grid_neighbors', 'edge_cases'],
    ...M,
    difficulty: 4,
    prompt:
      'A data center is a grid of racks: `0` is an empty slot, `1` a healthy server and `2` a failed server. Every minute, each failed server causes its healthy neighbors (up, down, left, right) to fail. Return the number of minutes until no healthy server remains, or `-1` if some healthy server can never fail. The grid has at least one cell.',
    starterCode: `def minutes_to_fail(grid):
    pass
`,
    solution: `from collections import deque

def minutes_to_fail(grid):
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    healthy = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                healthy += 1
    minutes = 0
    while queue and healthy:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    healthy -= 1
                    queue.append((nr, nc))
        minutes += 1
    return minutes if healthy == 0 else -1
`,
    tests: [
      t.eq('minutes_to_fail([[2, 1, 1], [1, 1, 0], [0, 1, 1]])', '4'),
      t.eq('minutes_to_fail([[2, 1, 1], [0, 1, 1], [1, 0, 1]])', '-1'),
      t.hidden('minutes_to_fail([[0, 2]])', '0'),
      t.hidden('minutes_to_fail([[1]])', '-1'),
      t.hidden('minutes_to_fail([[2]])', '0'),
      t.hidden('minutes_to_fail([[0]])', '0'),
      t.hidden('minutes_to_fail([[2, 1, 1, 1, 2]])', '2'),
      t.hidden('minutes_to_fail([[1, 1], [1, 2]])', '2'),
      t.hidden('minutes_to_fail([[2, 0, 1]])', '-1'),
    ],
    examples: [
      { input: 'grid = [[2, 1, 1], [1, 1, 0], [0, 1, 1]]', output: '4' },
      { input: 'grid = [[2, 1, 1], [0, 1, 1], [1, 0, 1]]', output: '-1', note: 'The bottom-left server is cut off.' },
    ],
    hints: [
      'Failure spreads outward from all failed servers at the same time, one ring per minute.',
      'Start a queue with every failed server at once, and count the healthy ones up front.',
      'Process the queue one level at a time (snapshot its length); each level is one minute. Mark a server failed when you enqueue it.',
      'Seed queue + healthy count; while queue and healthy: process one level, minutes += 1; return minutes if healthy == 0 else -1.',
    ],
    explanation:
      'This is a multi-source BFS: putting every failed server in the queue first makes each level exactly one minute. Counting healthy servers up front turns the unreachable case into a single check at the end and avoids an off-by-one extra minute.',
    complexity: { time: 'O(R * C)', space: 'O(R * C)' },
    signature: 'mock:multi-source-bfs-grid',
  }),

  // ---------------------------------------------------------------- mock 2
  code({
    id: 'mock-2-a',
    title: 'Cancel adjacent twins',
    skills: ['stack_push_pop', 'string_iterate', 'string_methods', 'edge_cases'],
    ...M,
    minutes: 10,
    difficulty: 3,
    prompt:
      'Given a string `s` of lowercase letters, repeatedly delete any two **adjacent equal** letters until no such pair is left, and return what remains. For example `"abbaca"`: removing `"bb"` gives `"aaca"`, then removing `"aa"` gives `"ca"`.',
    starterCode: `def collapse(s):
    pass
`,
    solution: `def collapse(s):
    stack = []
    for ch in s:
        if stack and stack[-1] == ch:
            stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)
`,
    tests: [
      t.eq('collapse("abbaca")', '"ca"'),
      t.eq('collapse("azxxzy")', '"ay"'),
      t.hidden('collapse("")', '""'),
      t.hidden('collapse("a")', '"a"'),
      t.hidden('collapse("aa")', '""'),
      t.hidden('collapse("aaa")', '"a"'),
      t.hidden('collapse("abccba")', '""'),
      t.hidden('collapse("abcd")', '"abcd"'),
    ],
    examples: [
      { input: 's = "abbaca"', output: '"ca"' },
      { input: 's = "azxxzy"', output: '"ay"', note: 'xx goes, then zz, leaving "ay".' },
    ],
    hints: [
      'Repeating the scan until nothing changes is O(n^2). What do you need to remember as you read left to right?',
      'Only the most recent surviving letter can pair with the next one.',
      'Keep survivors in a list: if the new letter equals the last survivor, pop it; otherwise push.',
      'Loop over s with push/pop on a list, then "".join(list).',
    ],
    explanation:
      'A deletion can expose an older letter to the next one, which is exactly last-in-first-out behavior. One pass with a list as a stack is O(n), versus O(n^2) for repeated rescans.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    signature: 'mock:stack-cancel-pairs',
  }),
  code({
    id: 'mock-2-route',
    title: 'Budgeted route',
    skills: ['tree_dfs', 'recursion_base_case', 'recursion_return', 'edge_cases'],
    ...M,
    minutes: 15,
    difficulty: 3,
    prompt:
      'A tree of road segments: each node holds the toll for that segment (tolls can be negative, they are rebates). A route goes from the root down to a **leaf** (a node with no children). Given the root and a `budget`, return `True` if some route costs exactly `budget`. An empty tree has no routes.',
    starterCode: `def has_route(root, budget):
    pass
`,
    solution: `def has_route(root, budget):
    if root is None:
        return False
    if root.left is None and root.right is None:
        return root.val == budget
    rest = budget - root.val
    return has_route(root.left, rest) or has_route(root.right, rest)
`,
    tests: [
      t.eq('has_route(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2, None, None, None, 1]), 22)', 'True'),
      t.eq('has_route(build_tree([1, 2, 3]), 5)', 'False'),
      t.hidden('has_route(None, 0)', 'False'),
      t.hidden('has_route(build_tree([1]), 1)', 'True'),
      t.hidden('has_route(build_tree([1, 2]), 1)', 'False'),
      t.hidden('has_route(build_tree([-2, None, -3]), -5)', 'True'),
      t.hidden('has_route(build_tree([1, 2, 3]), 4)', 'True'),
    ],
    examples: [
      { input: 'root = [5, 4, 8, 11, None, 13, 4, 7, 2, None, None, None, 1], budget = 22', output: 'True', note: '5 → 4 → 11 → 2' },
      { input: 'root = [1, 2, 3], budget = 5', output: 'False', note: 'The routes cost 3 and 4.' },
    ],
    hints: [
      'Clarify: must a route end at a leaf? Can tolls be negative? What does an empty tree return?',
      'At each node, what is left of the budget for the rest of the route?',
      'Recurse into both children with `budget - root.val`; a leaf checks whether its own value is exactly what remains.',
      'Base cases: None → False; leaf → val == remaining. Otherwise left or right.',
    ],
    explanation:
      'Passing the remaining budget down turns a path question into a local check at each leaf. Negative tolls mean you cannot stop early when the running total passes the budget. O(n) time, O(h) stack.',
    complexity: { time: 'O(n)', space: 'O(h) for tree height h' },
    signature: 'mock:tree-path-sum',
  }),
  code({
    id: 'mock-2-routes',
    title: 'Every budgeted route',
    skills: ['tree_dfs', 'backtracking_state', 'list_append', 'edge_cases'],
    ...M,
    minutes: 20,
    difficulty: 4,
    prompt:
      '**Interviewer follow-up.** Same tree and budget, but now return **every** route (root to leaf) that costs exactly `budget`, each as the list of tolls along it, in left-to-right order of their leaves. Reuse the idea from your last answer; think about what extra state the recursion must carry.',
    starterCode: `def all_routes(root, budget):
    pass
`,
    solution: `def all_routes(root, budget):
    out = []
    path = []

    def dfs(node, remaining):
        if node is None:
            return
        path.append(node.val)
        if node.left is None and node.right is None and node.val == remaining:
            out.append(list(path))
        dfs(node.left, remaining - node.val)
        dfs(node.right, remaining - node.val)
        path.pop()

    dfs(root, budget)
    return out
`,
    tests: [
      t.eq('all_routes(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2, None, None, 5, 1]), 22)', '[[5, 4, 11, 2], [5, 8, 4, 5]]'),
      t.eq('all_routes(build_tree([1, 2, 3]), 5)', '[]'),
      t.hidden('all_routes(None, 0)', '[]'),
      t.hidden('all_routes(build_tree([1]), 1)', '[[1]]'),
      t.hidden('all_routes(build_tree([1, 2, 2]), 3)', '[[1, 2], [1, 2]]'),
      t.hidden('all_routes(build_tree([-2, None, -3]), -5)', '[[-2, -3]]'),
    ],
    examples: [
      { input: 'root = [5, 4, 8, 11, None, 13, 4, 7, 2, None, None, 5, 1], budget = 22', output: '[[5, 4, 11, 2], [5, 8, 4, 5]]' },
      { input: 'root = [1, 2, 3], budget = 5', output: '[]' },
    ],
    hints: [
      'A yes/no answer no longer works: you need to remember the route you took to get here.',
      'Carry one list of the current route through the recursion.',
      'Append the node before exploring its children, and pop it after: choose, explore, undo.',
      'At a matching leaf, save a **copy** of the path (`list(path)`), or every saved route will change later.',
    ],
    explanation:
      'The follow-up turns a search into an enumeration: the recursion must carry the path. Appending before recursing and popping after (choose / explore / undo) keeps one list valid at every step; copying at the leaf avoids every result aliasing the same list. O(n·h) to build the outputs.',
    complexity: { time: 'O(n · h)', space: 'O(h) plus the output' },
    signature: 'mock:tree-all-path-sums',
  }),
]

export const MOCKS: MockInterview[] = [
  {
    id: 'mock-1',
    title: 'Mock interview 1',
    minutes: 45,
    exerciseIds: ['mock-1-a', 'mock-1-b'],
    note: 'Counting warm-up, then a grid problem where something spreads over time.',
  },
  {
    id: 'mock-2',
    title: 'Mock interview 2',
    minutes: 45,
    exerciseIds: ['mock-2-a', 'mock-2-route', 'mock-2-routes'],
    note: 'A string clean-up warm-up, then a tree problem and the interviewer’s follow-up: from “is there a route?” to “return every route”.',
  },
]
