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
    id: 'mock-2-b',
    title: 'Rooms for the day',
    skills: ['sort_key', 'heap_push_pop', 'interval_overlap', 'edge_cases'],
    ...M,
    difficulty: 4,
    prompt:
      'Each meeting is `[start, end]` with `start < end`. A room is free again at the moment its meeting ends, so `[1, 5]` and `[5, 8]` can share a room. Return the minimum number of rooms needed to hold every meeting. The list may be empty and is not sorted.',
    starterCode: `def min_rooms(meetings):
    pass
`,
    solution: `import heapq

def min_rooms(meetings):
    meetings = sorted(meetings, key=lambda m: m[0])
    ends = []
    for start, end in meetings:
        if ends and ends[0] <= start:
            heapq.heappop(ends)
        heapq.heappush(ends, end)
    return len(ends)
`,
    tests: [
      t.eq('min_rooms([[0, 30], [5, 10], [15, 20]])', '2'),
      t.eq('min_rooms([[7, 10], [2, 4]])', '1'),
      t.hidden('min_rooms([])', '0'),
      t.hidden('min_rooms([[1, 5]])', '1'),
      t.hidden('min_rooms([[1, 5], [5, 10]])', '1'),
      t.hidden('min_rooms([[1, 10], [2, 9], [3, 8]])', '3'),
      t.hidden('min_rooms([[1, 3], [2, 4], [3, 5], [4, 6]])', '2'),
      t.hidden('min_rooms([[5, 8], [1, 3], [2, 6], [6, 9], [8, 10]])', '2'),
    ],
    examples: [
      { input: 'meetings = [[0, 30], [5, 10], [15, 20]]', output: '2' },
      { input: 'meetings = [[7, 10], [2, 4]]', output: '1' },
    ],
    hints: [
      'Process meetings in the order they start.',
      'When a meeting starts, you only care about the room that frees up soonest.',
      'Keep a min-heap of end times for rooms in use; if the smallest end is <= this start, reuse that room.',
      'Sort by start; for each: pop if ends[0] <= start; push end; answer is len(ends).',
    ],
    explanation:
      'Sorting by start and keeping a min-heap of end times means the heap holds the rooms in use. Each meeting either reuses the earliest-freed room (pop then push) or opens a new one (push), so the heap size only grows when a new room is truly needed. Using `<=` encodes the "free at the moment it ends" rule.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    signature: 'mock:intervals-min-heap',
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
    exerciseIds: ['mock-2-a', 'mock-2-b'],
    note: 'A string clean-up warm-up, then a scheduling problem over unsorted time ranges.',
  },
]
