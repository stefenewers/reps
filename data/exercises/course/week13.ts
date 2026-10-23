import type { Section } from '@/lib/types'
import { t, write } from '@/data/exercises/build'

/**
 * Week 13 (Independent Transfer): the unlabeled bank. 48 reps that never name
 * their technique in the title or prompt (spec §17 Week 13, §45): small transfer
 * problems, fresh full problems, debugging and test-writing reps, and reps that ask
 * for a docstring stating the running time. Neighbouring reps use different ideas.
 * `skills` stays as metadata for scoring after the attempt; it is never shown before it.
 */
const transfer = { transfer: true, repType: 'pattern' as const }

export const sections: Section[] = [
  {
    id: 'c13-transfer',
    title: 'Transfer bank',
    summary: 'Mixed problems with no labels: read the situation, choose an approach, write it and test it.',
    exercises: [
      write({
        id: 'c13-t-01',
        title: "First one-time visitor",
        ...transfer,
        stage: 'pattern',
        skills: ['frequency_map', 'dict_get'],
        difficulty: 2,
        minutes: 6,
        prompt: "`visitors` is a list of names in the order people walked in.\n\nReturn the first name that appears exactly once in the whole list. Return `\"\"` if every name repeats. Must run in O(n).\n\n`first_single([\"ana\", \"bo\", \"ana\", \"cy\", \"bo\"])` → `\"cy\"`\n`first_single([\"ana\", \"ana\"])` → `\"\"` (nobody came only once)",
        starterCode: `def first_single(visitors):
    pass
`,
        solution: `def first_single(visitors):
    counts = {}
    for v in visitors:
        counts[v] = counts.get(v, 0) + 1
    for v in visitors:
        if counts[v] == 1:
            return v
    return ""
`,
        tests: [
          t.eq("first_single([\"ana\", \"bo\", \"ana\", \"cy\", \"bo\"])", "\"cy\""),
          t.eq("first_single([\"ana\", \"ana\"])", "\"\""),
          t.eq("first_single([])", "\"\""),
          t.eq("first_single([\"zed\"])", "\"zed\""),
          t.eq("first_single([\"a\", \"b\", \"a\"])", "\"b\""),
          t.hidden("first_single([\"x\", \"y\", \"z\"])", "\"x\""),
          t.hidden("first_single([str(i % 5000) for i in range(20000)] + [\"last\"])", "\"last\""),
        ],
        explanation: "Count every name in one pass, then walk the list again and return the first name whose count is 1. Two passes, O(n) time.",
      }),
      write({
        id: 'c13-t-02',
        title: "Two sorted feeds",
        ...transfer,
        stage: 'pattern',
        skills: ['two_pointer', 'pointer_update', 'sorted_dedupe'],
        difficulty: 2,
        minutes: 15,
        prompt: "`a` and `b` are lists of timestamps. Each list is sorted from smallest to largest.\n\nReturn one sorted list with every timestamp from both lists. A timestamp that appears more than once, in either list, appears once in the result. Must run in O(len(a) + len(b)), so don't sort.\n\n`merge_feeds([1, 4, 4, 9], [2, 4, 10])` → `[1, 2, 4, 9, 10]`\n`merge_feeds([], [3, 3])` → `[3]`",
        starterCode: `def merge_feeds(a, b):
    pass
`,
        solution: `def merge_feeds(a, b):
    out = []
    i = j = 0
    while i < len(a) or j < len(b):
        if j == len(b) or (i < len(a) and a[i] <= b[j]):
            x = a[i]
            i += 1
        else:
            x = b[j]
            j += 1
        if not out or out[-1] != x:
            out.append(x)
    return out
`,
        tests: [
          t.eq("merge_feeds([1, 4, 4, 9], [2, 4, 10])", "[1, 2, 4, 9, 10]"),
          t.eq("merge_feeds([], [3, 3])", "[3]"),
          t.eq("merge_feeds([], [])", "[]"),
          t.eq("merge_feeds([5], [1])", "[1, 5]"),
          t.eq("merge_feeds([1, 2, 3], [1, 2, 3])", "[1, 2, 3]"),
          t.hidden("merge_feeds([-3, 0], [-5, -3, 8])", "[-5, -3, 0, 8]"),
          t.hidden("merge_feeds([7, 7, 7], [])", "[7]"),
          t.hidden("merge_feeds(list(range(0, 40000, 2)), list(range(1, 40000, 2)))", "list(range(40000))"),
        ],
        explanation: "Walk both lists at once, always taking the smaller front item, and skip it if it equals the last item written. Each item is looked at once.",
      }),
      write({
        id: 'c13-t-03',
        title: "Way out of the warehouse",
        ...transfer,
        stage: 'pattern',
        skills: ['bfs', 'grid_neighbors', 'visited_set'],
        difficulty: 3,
        minutes: 10,
        prompt: "`grid` is a list of equal-length strings. `'.'` is floor and `'#'` is a wall.\n\nYou start at the top-left cell and want to reach the bottom-right cell. Each move goes one cell up, down, left or right, onto floor. Return the fewest moves needed. Return `-1` if you can't get there, or if either corner is a wall.\n\n`steps_to_exit([\"..#\", \"#..\", \"#..\"])` → `4`\n`steps_to_exit([\".#\", \"#.\"])` → `-1` (walls block every way)",
        starterCode: `def steps_to_exit(grid):
    pass
`,
        solution: `from collections import deque

def steps_to_exit(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == "#" or grid[rows - 1][cols - 1] == "#":
        return -1
    dist = {(0, 0): 0}
    todo = deque([(0, 0)])
    while todo:
        r, c = todo.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return dist[(r, c)]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1
                todo.append((nr, nc))
    return -1
`,
        tests: [
          t.eq("steps_to_exit([\"..#\", \"#..\", \"#..\"])", "4"),
          t.eq("steps_to_exit([\".#\", \"#.\"])", "-1"),
          t.eq("steps_to_exit([\".\"])", "0"),
          t.eq("steps_to_exit([\"#\"])", "-1"),
          t.eq("steps_to_exit([\"...\", \"##.\", \"...\"])", "4"),
          t.hidden("steps_to_exit([\"....\", \"###.\", \"....\", \".###\", \"....\"])", "13"),
          t.hidden("steps_to_exit([\"..\", \".#\"])", "-1"),
          t.hidden("steps_to_exit([\".\" * 150] * 150)", "298"),
        ],
        explanation: "Spread out from the start one move at a time, recording the move count when a cell is first reached. The first time you reach the exit is the fewest moves.",
      }),
      write({
        id: 'c13-t-04',
        title: "Merged slots go wrong",
        ...transfer,
        stage: 'pattern',
        style: 'write-test',
        skills: ['interval_overlap', 'edge_cases'],
        difficulty: 3,
        minutes: 5,
        prompt: "`merge(slots)` should take a list of `[start, end]` pairs and combine the ones that overlap or touch. It returns the combined pairs sorted by start. A teammate wrote this, and it is wrong on some inputs:\n\n```python\ndef merge(slots):\n    slots = sorted(slots)\n    out = []\n    for start, end in slots:\n        if out and start <= out[-1][1]:\n            out[-1][1] = end\n        else:\n            out.append([start, end])\n    return out\n```\n\nWrite `breaking_input()`. It takes nothing and returns one list of `[start, end]` pairs on which the code above gives the wrong answer. Every pair must have `start <= end`.",
        starterCode: `def breaking_input():
    pass
`,
        solution: `def breaking_input():
    slots = [[1, 10], [2, 3]]
    return slots
`,
        tests: [
          t.check("your input breaks it", `import copy
def _bad(slots):
    slots = sorted(slots)
    out = []
    for start, end in slots:
        if out and start <= out[-1][1]:
            out[-1][1] = end
        else:
            out.append([start, end])
    return out
def _good(slots):
    out = []
    for s, e in sorted(slots):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
x = breaking_input()
assert isinstance(x, list) and x, "return a non-empty list of pairs"
assert all(len(p) == 2 and p[0] <= p[1] for p in x), "every pair is [start, end] with start <= end"
assert _bad(copy.deepcopy(x)) != _good(copy.deepcopy(x)), "the code above gives the right answer on this input"`),
        ],
        explanation: "When a later slot sits entirely inside an earlier one, like [1, 10] and [2, 3], the code shrinks the end to 3. The end must be the larger of the two ends.",
      }),
      write({
        id: 'c13-t-05',
        title: "Worst slide in price",
        ...transfer,
        stage: 'pattern',
        skills: ['state_tracking', 'accumulator'],
        difficulty: 2,
        minutes: 6,
        prompt: "`prices` is a list of daily prices.\n\nReturn the largest drop from one day's price to a later, lower price. Return `0` if the price never falls. Must run in O(n).\n\n`largest_drop([8, 10, 4, 7, 2, 6])` → `8` (from 10 down to 2)\n`largest_drop([1, 2, 3])` → `0`",
        starterCode: `def largest_drop(prices):
    pass
`,
        solution: `def largest_drop(prices):
    best = 0
    high = None
    for p in prices:
        if high is None or p > high:
            high = p
        best = max(best, high - p)
    return best
`,
        tests: [
          t.eq("largest_drop([8, 10, 4, 7, 2, 6])", "8"),
          t.eq("largest_drop([1, 2, 3])", "0"),
          t.eq("largest_drop([])", "0"),
          t.eq("largest_drop([5])", "0"),
          t.eq("largest_drop([5, 1, 9, 0])", "9"),
          t.hidden("largest_drop([3, 3, 3])", "0"),
          t.hidden("largest_drop([-2, -9])", "7"),
          t.hidden("largest_drop(list(range(20000, 0, -1)))", "19999"),
        ],
        explanation: "Keep the highest price so far. Each day, the drop from that high is a candidate answer. One pass.",
      }),
      write({
        id: 'c13-t-06',
        title: "Recording studios",
        ...transfer,
        stage: 'interview',
        skills: ['min_rooms', 'heap_push_pop', 'sort_key'],
        difficulty: 3,
        minutes: 20,
        prompt: "`bookings` is a list of `[start, end]` pairs in minutes. A booking holds a studio from `start` up to, but not including, `end`.\n\nA studio freed at minute 30 can take a booking that starts at minute 30. Return the fewest studios that can hold every booking. Must run in O(n log n).\n\n`studios_needed([[0, 30], [5, 10], [15, 20]])` → `2`\n`studios_needed([[10, 20], [20, 30]])` → `1` (the second starts as the first ends)",
        starterCode: `def studios_needed(bookings):
    pass
`,
        solution: `import heapq

def studios_needed(bookings):
    ends = []
    for start, end in sorted(bookings):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)
`,
        tests: [
          t.eq("studios_needed([[0, 30], [5, 10], [15, 20]])", "2"),
          t.eq("studios_needed([[10, 20], [20, 30]])", "1"),
          t.eq("studios_needed([])", "0"),
          t.eq("studios_needed([[1, 5]])", "1"),
          t.eq("studios_needed([[1, 10], [2, 9], [3, 8]])", "3"),
          t.hidden("studios_needed([[9, 10], [4, 9], [4, 17]])", "2"),
          t.hidden("studios_needed([[1, 2], [1, 2], [1, 2], [2, 3]])", "3"),
          t.hidden("studios_needed([[i, i + 100] for i in range(20000)])", "100"),
        ],
        explanation: "Sort by start. Keep the end times of studios in use in a min-heap; if the earliest end is at or before the next start, reuse that studio. The heap's size at the end is the answer.",
      }),
      write({
        id: 'c13-t-07',
        title: "Badge scanned twice",
        ...transfer,
        stage: 'pattern',
        skills: ['index_map', 'complexity', 'explanation'],
        difficulty: 2,
        minutes: 9,
        prompt: "`badge_ids` is the list of badge scans at a door, in order. `k` is a whole number, 0 or more.\n\nReturn `True` if the same badge appears at two positions that are at most `k` apart. Otherwise return `False`. Must run in O(n).\n\n`close_repeat([7, 3, 9, 7], 3)` → `True` (positions 0 and 3)\n`close_repeat([7, 3, 9, 7], 2)` → `False`\n\nGive the function a docstring. In it, state the running time in big-O and say in one sentence why it holds.",
        starterCode: `def close_repeat(badge_ids, k):
    pass
`,
        solution: `def close_repeat(badge_ids, k):
    """Remember the last position of each badge in a dict while scanning once.
    Each scan does O(1) work, so the whole run is O(n) time and O(n) space."""
    last = {}
    for i, b in enumerate(badge_ids):
        if b in last and i - last[b] <= k:
            return True
        last[b] = i
    return False
`,
        tests: [
          t.eq("close_repeat([7, 3, 9, 7], 3)", "True"),
          t.eq("close_repeat([7, 3, 9, 7], 2)", "False"),
          t.eq("close_repeat([], 1)", "False"),
          t.eq("close_repeat([1, 1], 0)", "False"),
          t.eq("close_repeat([1, 1], 1)", "True"),
          t.hidden("close_repeat([5, 6, 5, 6], 1)", "False"),
          t.hidden("close_repeat([1, 2, 3, 1, 2, 3], 3)", "True"),
          t.hidden("close_repeat(list(range(30000)) + [0], 30000)", "True"),
          t.check("the docstring states the running time", `doc = close_repeat.__doc__ or ""
assert len(doc.split()) >= 12, "add a docstring of at least 12 words"
assert "O(" in doc, "state the running time in big-O, like O(n)"`),
        ],
        explanation: "Only the most recent position of each badge matters: an older one is farther away. A dict from badge to last position answers each scan in O(1).",
      }),
      write({
        id: 'c13-t-08',
        title: "Skip every k-th stop",
        ...transfer,
        stage: 'pattern',
        skills: ['linked_list_reassignment', 'dummy_node', 'linked_list_traversal'],
        difficulty: 2,
        minutes: 8,
        prompt: "`head` is the first node of a linked list, or `None`. Each node has `.val` and `.next`. `k` is at least 1.\n\nRemove the nodes at positions `k`, `2k`, `3k` and so on, counting the head as position 1. Return the head of what is left.\n\n`drop_every_kth(build_list([1, 2, 3, 4, 5, 6, 7]), 3)` → `1 -> 2 -> 4 -> 5 -> 7`\n`drop_every_kth(build_list([4, 5]), 1)` → `None` (every node goes)",
        starterCode: `def drop_every_kth(head, k):
    pass
`,
        solution: `def drop_every_kth(head, k):
    front = ListNode(0, head)
    prev, node, count = front, head, 0
    while node:
        count += 1
        if count % k == 0:
            prev.next = node.next
        else:
            prev = node
        node = node.next
    return front.next
`,
        tests: [
          t.eq("list_to_array(drop_every_kth(build_list([1, 2, 3, 4, 5, 6, 7]), 3))", "[1, 2, 4, 5, 7]"),
          t.eq("list_to_array(drop_every_kth(build_list([4, 5]), 1))", "[]"),
          t.eq("list_to_array(drop_every_kth(None, 2))", "[]"),
          t.eq("list_to_array(drop_every_kth(build_list([1, 2]), 5))", "[1, 2]"),
          t.eq("list_to_array(drop_every_kth(build_list([1, 2, 3, 4]), 2))", "[1, 3]"),
          t.hidden("list_to_array(drop_every_kth(build_list([9]), 1))", "[]"),
          t.hidden("list_to_array(drop_every_kth(build_list([1, 2, 3]), 3))", "[1, 2]"),
          t.hidden("list_to_array(drop_every_kth(build_list(list(range(1, 10001))), 2))", "list(range(1, 10001, 2))"),
        ],
        explanation: "Walk with a node before the current one (start from a placeholder in front of the head, so removing the head needs no special case). On every k-th node, link around it.",
      }),
      write({
        id: 'c13-t-09',
        title: "Closing tags",
        ...transfer,
        stage: 'pattern',
        skills: ['stack_push_pop', 'matching_pairs'],
        difficulty: 2,
        minutes: 6,
        prompt: "`tags` is a list of strings. Each one opens a section, like `\"<b>\"`, or closes one, like `\"</b>\"`.\n\nReturn `True` if every section is closed. A closing tag must match the most recently opened section that is still open. Otherwise return `False`.\n\n`tags_balanced([\"<b>\", \"<i>\", \"</i>\", \"</b>\"])` → `True`\n`tags_balanced([\"<b>\", \"<i>\", \"</b>\", \"</i>\"])` → `False` (`<i>` is still open when `</b>` arrives)",
        starterCode: `def tags_balanced(tags):
    pass
`,
        solution: `def tags_balanced(tags):
    open_names = []
    for tag in tags:
        if tag.startswith("</"):
            if not open_names or open_names[-1] != tag[2:-1]:
                return False
            open_names.pop()
        else:
            open_names.append(tag[1:-1])
    return not open_names
`,
        tests: [
          t.eq("tags_balanced([\"<b>\", \"<i>\", \"</i>\", \"</b>\"])", "True"),
          t.eq("tags_balanced([\"<b>\", \"<i>\", \"</b>\", \"</i>\"])", "False"),
          t.eq("tags_balanced([])", "True"),
          t.eq("tags_balanced([\"</b>\"])", "False"),
          t.eq("tags_balanced([\"<b>\"])", "False"),
          t.hidden("tags_balanced([\"<p>\", \"<p>\", \"</p>\", \"</p>\"])", "True"),
          t.hidden("tags_balanced([\"<a>\", \"</a>\", \"<b>\", \"</a>\"])", "False"),
          t.hidden("tags_balanced([\"<d>\"] * 10000 + [\"</d>\"] * 10000)", "True"),
        ],
        explanation: "Keep the names of open sections in a list used as a stack. A closing tag must match the last one; at the end nothing may be left open.",
      }),
      write({
        id: 'c13-t-10',
        title: "Days that net to a target",
        ...transfer,
        stage: 'interview',
        skills: ['prefix_suffix', 'frequency_map', 'hash_reasoning'],
        difficulty: 4,
        minutes: 20,
        prompt: "`changes` is a list of daily balance changes. They can be negative. A **run** is one or more days in a row.\n\nReturn how many runs add up to exactly `target`. Must run in O(n).\n\n`count_target_runs([3, 4, -7, 3, 1, 3], 7)` → `3` (`[3, 4]`, `[3, 1, 3]` and the whole list)\n`count_target_runs([0, 0], 0)` → `3` (each zero, and both together)",
        starterCode: `def count_target_runs(changes, target):
    pass
`,
        solution: `def count_target_runs(changes, target):
    totals = {0: 1}
    running = 0
    count = 0
    for c in changes:
        running += c
        count += totals.get(running - target, 0)
        totals[running] = totals.get(running, 0) + 1
    return count
`,
        tests: [
          t.eq("count_target_runs([3, 4, -7, 3, 1, 3], 7)", "3"),
          t.eq("count_target_runs([0, 0], 0)", "3"),
          t.eq("count_target_runs([], 5)", "0"),
          t.eq("count_target_runs([5], 5)", "1"),
          t.eq("count_target_runs([1, 2, 3], 10)", "0"),
          t.eq("count_target_runs([1, -1, 1, -1], 0)", "4"),
          t.hidden("count_target_runs([2, 2, 2], 4)", "2"),
          t.hidden("count_target_runs([-3, 3], 0)", "1"),
          t.hidden("count_target_runs([0] * 20000, 0)", "200010000"),
        ],
        explanation: "A run from day i+1 to day j sums to target when total(j) - total(i) == target. Count, as you go, how many earlier running totals equal running - target. Negatives rule out a shrinking-range approach.",
      }),
      write({
        id: 'c13-t-11',
        title: "Filling a shelf",
        ...transfer,
        stage: 'pattern',
        skills: ['recurrence', 'dp_table'],
        difficulty: 3,
        minutes: 8,
        prompt: "A shelf is `n` units long. You fill it with boxes of length 1, 2 or 3, placed end to end with no gaps.\n\nTwo fillings are different if their sequences of box lengths differ. Return how many fillings there are. `n` can be as large as 70, and the answer must come back instantly.\n\n`ways_to_tile(3)` → `4` (1+1+1, 1+2, 2+1 and 3)\n`ways_to_tile(0)` → `1` (an empty shelf has one filling: no boxes)",
        starterCode: `def ways_to_tile(n):
    pass
`,
        solution: `def ways_to_tile(n):
    ways = [1] + [0] * n
    for i in range(1, n + 1):
        ways[i] = sum(ways[i - s] for s in (1, 2, 3) if i - s >= 0)
    return ways[n]
`,
        tests: [
          t.eq("ways_to_tile(3)", "4"),
          t.eq("ways_to_tile(0)", "1"),
          t.eq("ways_to_tile(1)", "1"),
          t.eq("ways_to_tile(2)", "2"),
          t.eq("ways_to_tile(4)", "7"),
          t.eq("ways_to_tile(5)", "13"),
          t.hidden("ways_to_tile(10)", "274"),
          t.hidden("ways_to_tile(70)", "2073693258389777176"),
        ],
        explanation: "The last box is 1, 2 or 3 long, so ways(n) = ways(n-1) + ways(n-2) + ways(n-3). Fill the answers from 0 up to n.",
      }),
      write({
        id: 'c13-t-12',
        title: "Tests for a dedupe",
        ...transfer,
        stage: 'pattern',
        style: 'write-test',
        skills: ['sorted_dedupe', 'edge_cases'],
        difficulty: 2,
        minutes: 7,
        prompt: "`dedupe_sorted(nums)` takes a sorted list of whole numbers. It should return the same numbers in order, with each value kept once. Here is one attempt:\n\n```python\ndef dedupe_sorted(nums):\n    out = []\n    last = 0\n    for x in nums:\n        if x != last:\n            out.append(x)\n            last = x\n    return out\n```\n\nWrite `test_dedupe(dedupe_sorted)`. Its argument is the **function being tested**. The checker calls your `test_dedupe` twice: once with a correct version and once with the version above.\n\nInside, write at least three lines like `assert dedupe_sorted(...) == ...`. Every assert must pass for a correct version. At least one must fail for the version above.",
        starterCode: `def test_dedupe(dedupe_sorted):
    pass
`,
        solution: `def test_dedupe(dedupe_sorted):
    assert dedupe_sorted([]) == []
    assert dedupe_sorted([1, 1, 2]) == [1, 2]
    assert dedupe_sorted([0, 0, 3]) == [0, 3]
    assert dedupe_sorted([-2, -2, 5, 5, 5]) == [-2, 5]
`,
        tests: [
          t.check("passes on a correct version", `def _good(nums):
    out = []
    for x in nums:
        if not out or out[-1] != x:
            out.append(x)
    return out
test_dedupe(_good)`),
          t.check("fails on the version above", `def _bad(nums):
    out = []
    last = 0
    for x in nums:
        if x != last:
            out.append(x)
            last = x
    return out
caught = False
try:
    test_dedupe(_bad)
except AssertionError:
    caught = True
assert caught, "every assert passed on the version above; add a case it gets wrong"`),
        ],
        explanation: "`last` starts at 0, so a list that begins with 0 loses its zeros: [0, 0, 3] gives [3]. A test that starts with 0 catches it.",
      }),
      write({
        id: 'c13-t-13',
        title: "Busiest stretch of minutes",
        ...transfer,
        stage: 'pattern',
        skills: ['sliding_window', 'window_state'],
        difficulty: 2,
        minutes: 7,
        prompt: "`counts[i]` is how many orders arrived in minute `i`. `k` is between 1 and `len(counts)`.\n\nReturn the first minute of the `k` back-to-back minutes with the most orders in total. If there is a tie, return the earliest start. Must run in O(n).\n\n`busiest_stretch([1, 5, 2, 6, 0, 6], 2)` → `2` (minutes 2 and 3 total 8)\n`busiest_stretch([4, 4, 4], 3)` → `0`",
        starterCode: `def busiest_stretch(counts, k):
    pass
`,
        solution: `def busiest_stretch(counts, k):
    total = sum(counts[:k])
    best, best_start = total, 0
    for i in range(k, len(counts)):
        total += counts[i] - counts[i - k]
        if total > best:
            best, best_start = total, i - k + 1
    return best_start
`,
        tests: [
          t.eq("busiest_stretch([1, 5, 2, 6, 0, 6], 2)", "2"),
          t.eq("busiest_stretch([4, 4, 4], 3)", "0"),
          t.eq("busiest_stretch([9], 1)", "0"),
          t.eq("busiest_stretch([1, 2, 3], 1)", "2"),
          t.eq("busiest_stretch([3, 1, 3], 1)", "0"),
          t.hidden("busiest_stretch([0, 0, 5, 5, 0], 2)", "2"),
          t.hidden("busiest_stretch([5, 1, 1, 5], 2)", "0"),
          t.hidden("busiest_stretch(list(range(50000)), 100)", "49900"),
        ],
        explanation: "Add the minute entering the span and subtract the one leaving it, instead of re-adding k numbers each time. Only replace the best on a strictly larger total to keep the earliest start.",
      }),
      write({
        id: 'c13-t-14',
        title: "Infected rack",
        ...transfer,
        stage: 'interview',
        skills: ['bfs', 'grid_neighbors', 'queue_deque'],
        difficulty: 4,
        minutes: 22,
        prompt: "`grid` is a list of equal-length strings showing a server rack. `'X'` is an infected server, `'o'` is a healthy server and `'.'` is an empty slot.\n\nEach minute, every infected server infects the healthy servers directly above, below, left and right of it. Return the number of minutes until no healthy server is left. Return `-1` if some healthy server can never be reached. Return `0` if there are no healthy servers.\n\n`spread_time([\"Xo.\", \"oo.\", \".oo\"])` → `4`\n`spread_time([\"X.o\"])` → `-1` (the empty slot blocks it)",
        starterCode: `def spread_time(grid):
    pass
`,
        solution: `from collections import deque

def spread_time(grid):
    rows, cols = len(grid), len(grid[0])
    todo = deque()
    healthy = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "X":
                todo.append((r, c, 0))
            elif grid[r][c] == "o":
                healthy += 1
    infected = {(r, c) for r, c, _ in todo}
    minutes = 0
    while todo:
        r, c, t = todo.popleft()
        minutes = max(minutes, t)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "o" and (nr, nc) not in infected:
                infected.add((nr, nc))
                healthy -= 1
                todo.append((nr, nc, t + 1))
    return minutes if healthy == 0 else -1
`,
        tests: [
          t.eq("spread_time([\"Xo.\", \"oo.\", \".oo\"])", "4"),
          t.eq("spread_time([\"X.o\"])", "-1"),
          t.eq("spread_time([\"...\"])", "0"),
          t.eq("spread_time([\"X\"])", "0"),
          t.eq("spread_time([\"oX\"])", "1"),
          t.eq("spread_time([\"Xoooo\"])", "4"),
          t.hidden("spread_time([\"o..X\"])", "-1"),
          t.hidden("spread_time([\"XoX\"])", "1"),
          t.hidden("spread_time([\"oo\"])", "-1"),
          t.hidden("spread_time([\"o\" * 99 + \"X\"] * 100)", "99"),
        ],
        explanation: "Start from every infected server at once and spread one minute at a time; the minute of the last newly infected server is the answer. Count healthy servers first so you can tell when some were never reached.",
      }),
      write({
        id: 'c13-t-15',
        title: "Busiest day of a launch",
        ...transfer,
        stage: 'pattern',
        skills: ['binary_search', 'search_invariant', 'complexity'],
        difficulty: 3,
        minutes: 10,
        prompt: "`visits` is a list of daily visitor counts. The counts rise strictly to one highest day, then fall strictly. They may only rise, or only fall.\n\nReturn the index of the highest day. Must run in O(log n): the list can be very long.\n\n`peak_day([1, 4, 9, 7, 2])` → `2`\n`peak_day([5])` → `0`\n\nGive the function a docstring. In it, state the running time in big-O and say in one sentence why it holds.",
        starterCode: `def peak_day(visits):
    pass
`,
        solution: `def peak_day(visits):
    """Each step compares a day with the next one and drops the side that cannot
    hold the top, so the range shrinks by half every time: O(log n) time, O(1) space."""
    low, high = 0, len(visits) - 1
    while low < high:
        m = (low + high) // 2
        if visits[m] < visits[m + 1]:
            low = m + 1
        else:
            high = m
    return low
`,
        tests: [
          t.eq("peak_day([1, 4, 9, 7, 2])", "2"),
          t.eq("peak_day([5])", "0"),
          t.eq("peak_day([1, 2, 3])", "2"),
          t.eq("peak_day([3, 2, 1])", "0"),
          t.eq("peak_day([1, 3, 2])", "1"),
          t.hidden("peak_day([0, 10, 20, 30, 25])", "3"),
          t.hidden("peak_day(list(range(100000)) + [5])", "99999"),
          t.check("the docstring states the running time", `doc = peak_day.__doc__ or ""
assert len(doc.split()) >= 12, "add a docstring of at least 12 words"
assert "O(" in doc, "state the running time in big-O, like O(n)"`),
        ],
        explanation: "If a day is lower than the next one, the top is to its right; otherwise it is this day or to its left. Each comparison discards half the range.",
      }),
      write({
        id: 'c13-t-16',
        title: "Boxes inside boxes",
        ...transfer,
        stage: 'pattern',
        skills: ['recursion_base_case', 'recursion_return'],
        difficulty: 2,
        minutes: 7,
        prompt: "`box` is a list. Each item is a whole number or another list, nested to any depth.\n\nA number directly inside `box` is at depth 1. A number inside a list inside `box` is at depth 2, and so on. Return the sum of each number times its depth.\n\n`depth_score([1, [2, [3]], 4])` → `18` (1 + 2·2 + 3·3 + 4)\n`depth_score([[], [[]]])` → `0` (no numbers at all)",
        starterCode: `def depth_score(box):
    pass
`,
        solution: `def depth_score(box):
    def score(items, depth):
        total = 0
        for item in items:
            if isinstance(item, list):
                total += score(item, depth + 1)
            else:
                total += item * depth
        return total
    return score(box, 1)
`,
        tests: [
          t.eq("depth_score([1, [2, [3]], 4])", "18"),
          t.eq("depth_score([[], [[]]])", "0"),
          t.eq("depth_score([])", "0"),
          t.eq("depth_score([5])", "5"),
          t.eq("depth_score([[5]])", "10"),
          t.hidden("depth_score([1, [1], [[1]]])", "6"),
          t.hidden("depth_score([[-2, [3]], 1])", "6"),
          t.hidden("depth_score([[[[[[1]]]]]])", "6"),
        ],
        explanation: "A helper that takes a list and its depth handles numbers directly and calls itself on inner lists with depth + 1.",
      }),
      write({
        id: 'c13-t-17',
        title: "Shorter activity log",
        ...transfer,
        stage: 'pattern',
        skills: ['state_tracking', 'while_loop', 'string_methods'],
        difficulty: 2,
        minutes: 15,
        prompt: "`events` is a list of event names in the order they happened.\n\nCollapse each run of the same name in a row into one entry. A run of one stays as the plain name. A longer run becomes the name, a space, `x`, and the count, like `\"save x3\"`. Return the list of entries.\n\n`compress_log([\"open\", \"save\", \"save\", \"save\", \"close\", \"open\"])` → `[\"open\", \"save x3\", \"close\", \"open\"]`\n`compress_log([])` → `[]`",
        starterCode: `def compress_log(events):
    pass
`,
        solution: `def compress_log(events):
    out = []
    i = 0
    while i < len(events):
        j = i
        while j < len(events) and events[j] == events[i]:
            j += 1
        n = j - i
        out.append(events[i] if n == 1 else f"{events[i]} x{n}")
        i = j
    return out
`,
        tests: [
          t.eq("compress_log([\"open\", \"save\", \"save\", \"save\", \"close\", \"open\"])", "[\"open\", \"save x3\", \"close\", \"open\"]"),
          t.eq("compress_log([])", "[]"),
          t.eq("compress_log([\"a\"])", "[\"a\"]"),
          t.eq("compress_log([\"a\", \"a\"])", "[\"a x2\"]"),
          t.eq("compress_log([\"a\", \"b\", \"a\"])", "[\"a\", \"b\", \"a\"]"),
          t.hidden("compress_log([\"z\"] * 12)", "[\"z x12\"]"),
          t.hidden("compress_log([\"a\", \"a\", \"b\", \"b\", \"b\"])", "[\"a x2\", \"b x3\"]"),
        ],
        explanation: "Find the end of each run, then write one entry for it. The same name later in the list starts a new run.",
      }),
      write({
        id: 'c13-t-18',
        title: "Friend circles",
        ...transfer,
        stage: 'pattern',
        skills: ['connected_components', 'graph_adjacency'],
        difficulty: 3,
        minutes: 9,
        prompt: "There are `n` people, numbered 0 to `n - 1`. `pairs` is a list of `[a, b]` meaning `a` and `b` know each other.\n\nPeople who know each other are in the same circle. So is anyone linked through a chain of people who know each other. Return the number of circles.\n\n`friend_groups(5, [[0, 1], [1, 2], [3, 4]])` → `2`\n`friend_groups(3, [])` → `3` (everyone is alone)",
        starterCode: `def friend_groups(n, pairs):
    pass
`,
        solution: `def friend_groups(n, pairs):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    groups = n
    for a, b in pairs:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            groups -= 1
    return groups
`,
        tests: [
          t.eq("friend_groups(5, [[0, 1], [1, 2], [3, 4]])", "2"),
          t.eq("friend_groups(3, [])", "3"),
          t.eq("friend_groups(1, [])", "1"),
          t.eq("friend_groups(4, [[0, 1], [2, 3], [1, 2]])", "1"),
          t.eq("friend_groups(4, [[0, 0]])", "4"),
          t.hidden("friend_groups(6, [[0, 1], [0, 1], [4, 5]])", "4"),
          t.hidden("friend_groups(0, [])", "0"),
          t.hidden("friend_groups(20000, [[i, i + 1] for i in range(0, 20000, 2)])", "10000"),
        ],
        explanation: "Each circle is a connected group. Either walk from every person not yet reached and count the walks, or merge groups pair by pair and count the merges.",
      }),
      write({
        id: 'c13-t-19',
        title: "Splitting a tag into words",
        ...transfer,
        stage: 'interview',
        skills: ['dp_prefix_words', 'dp_table', 'set_membership'],
        difficulty: 4,
        minutes: 22,
        prompt: "`tag` is a lowercase string with no spaces, like `\"bestcoffeeshop\"`. `words` is a list of lowercase words.\n\nReturn `True` if `tag` can be cut into pieces that are all in `words`. A word can be used any number of times. An empty `tag` gives `True`. `tag` can be 300 characters long, so don't try every way of cutting it.\n\n`can_split_tag(\"bestcoffeeshop\", [\"best\", \"coffee\", \"shop\", \"bes\"])` → `True`\n`can_split_tag(\"aaab\", [\"a\", \"aa\"])` → `False` (nothing covers the `b`)",
        starterCode: `def can_split_tag(tag, words):
    pass
`,
        solution: `def can_split_tag(tag, words):
    vocab = set(words)
    longest = max((len(w) for w in vocab), default=0)
    ok = [True] + [False] * len(tag)
    for i in range(1, len(tag) + 1):
        for size in range(1, min(longest, i) + 1):
            if ok[i - size] and tag[i - size:i] in vocab:
                ok[i] = True
                break
    return ok[len(tag)]
`,
        tests: [
          t.eq("can_split_tag(\"bestcoffeeshop\", [\"best\", \"coffee\", \"shop\", \"bes\"])", "True"),
          t.eq("can_split_tag(\"aaab\", [\"a\", \"aa\"])", "False"),
          t.eq("can_split_tag(\"\", [\"x\"])", "True"),
          t.eq("can_split_tag(\"cat\", [])", "False"),
          t.eq("can_split_tag(\"catcat\", [\"cat\"])", "True"),
          t.hidden("can_split_tag(\"penpineapple\", [\"pen\", \"pine\", \"apple\", \"pineapple\"])", "True"),
          t.hidden("can_split_tag(\"dogsand\", [\"dogs\", \"dog\", \"sandy\"])", "False"),
          t.hidden("can_split_tag(\"a\" * 300 + \"b\", [\"a\", \"aa\", \"aaa\"])", "False"),
          t.hidden("can_split_tag(\"a\" * 300, [\"aa\", \"aaa\"])", "True"),
        ],
        explanation: "ok[i] says whether the first i characters can be cut into words. ok[i] is true when some word ends at i and ok[start of that word] is true. Each prefix is solved once.",
      }),
      write({
        id: 'c13-t-20',
        title: "A list that never ends",
        ...transfer,
        stage: 'pattern',
        skills: ['fast_slow', 'linked_list_traversal', 'edge_cases'],
        difficulty: 3,
        minutes: 8,
        prompt: "`head` is the first node of a linked list, or `None`. Each node has `.val` and `.next`. In a broken list, following `.next` comes back around to an earlier node and never reaches `None`.\n\n`has_loop(head)` should return `True` for a broken list and `False` for a list that ends. A teammate wrote this, and it crashes on some inputs:\n\n```python\ndef has_loop(head):\n    slow = head\n    fast = head.next\n    while fast and fast.next:\n        if slow == fast:\n            return True\n        slow = slow.next\n        fast = fast.next.next\n    return False\n```\n\nWrite a correct `has_loop(head)` from scratch. Use O(1) extra space.\n\n`has_loop(build_list([1, 2, 3]))` → `False`\n`has_loop(None)` → `False` (an empty list ends at once)",
        starterCode: `def has_loop(head):
    pass
`,
        solution: `def has_loop(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
`,
        tests: [
          t.eq("has_loop(build_list([1, 2, 3]))", "False"),
          t.eq("has_loop(None)", "False"),
          t.eq("has_loop(build_list([1]))", "False"),
          t.hidden("has_loop(build_list(list(range(5000))))", "False"),
          t.check("a loop back to the second node", `nodes = [ListNode(v) for v in range(4)]
for a, b in zip(nodes, nodes[1:]):
    a.next = b
nodes[-1].next = nodes[1]
assert has_loop(nodes[0]) is True, "the last node points back to node 1: that is a loop"`),
          t.check("a single node pointing at itself", `nodes = [ListNode(v) for v in range(1)]
for a, b in zip(nodes, nodes[1:]):
    a.next = b
nodes[-1].next = nodes[0]
assert has_loop(nodes[0]) is True, "the last node points back to node 0: that is a loop"`),
          t.check("a long loop back to the head", `nodes = [ListNode(v) for v in range(5001)]
for a, b in zip(nodes, nodes[1:]):
    a.next = b
nodes[-1].next = nodes[0]
assert has_loop(nodes[0]) is True, "the last node points back to node 0: that is a loop"`, true),
        ],
        explanation: "The original crashes on an empty list because it reads head.next before checking head. Start both walkers at head and check fast and fast.next before each move.",
      }),
      write({
        id: 'c13-t-21',
        title: "Entries in a time range",
        ...transfer,
        stage: 'pattern',
        skills: ['binary_search', 'search_invariant'],
        difficulty: 3,
        minutes: 8,
        prompt: "`times` is a list of timestamps sorted from smallest to largest. It may have repeats.\n\nReturn how many timestamps are at least `start` and at most `end`. If `start > end`, return `0`. Must run in O(log n): `times` can hold millions of entries.\n\n`count_between([1, 3, 3, 5, 8], 3, 5)` → `3`\n`count_between([1, 2], 5, 9)` → `0`",
        starterCode: `def count_between(times, start, end):
    pass
`,
        solution: `from bisect import bisect_left, bisect_right

def count_between(times, start, end):
    if start > end:
        return 0
    return bisect_right(times, end) - bisect_left(times, start)
`,
        tests: [
          t.eq("count_between([1, 3, 3, 5, 8], 3, 5)", "3"),
          t.eq("count_between([1, 2], 5, 9)", "0"),
          t.eq("count_between([], 0, 10)", "0"),
          t.eq("count_between([4], 4, 4)", "1"),
          t.eq("count_between([1, 3, 3, 5, 8], 0, 100)", "5"),
          t.eq("count_between([1, 3, 3, 5, 8], 6, 7)", "0"),
          t.hidden("count_between([2, 2, 2], 2, 2)", "3"),
          t.hidden("count_between([1, 5], 5, 1)", "0"),
          t.hidden("count_between(list(range(0, 200000, 2)), 1001, 2000)", "500"),
        ],
        explanation: "Find the first position holding a value >= start and the first position holding a value > end, each in O(log n). Their difference is the count. Python's bisect module does both.",
      }),
      write({
        id: 'c13-t-22',
        title: "Minutes in meetings",
        ...transfer,
        stage: 'pattern',
        skills: ['interval_overlap', 'sort_key'],
        difficulty: 2,
        minutes: 8,
        prompt: "`meetings` is a list of `[start, end]` pairs in minutes, in no particular order. Each meeting covers the time from `start` to `end`. Meetings may overlap.\n\nReturn how many minutes are covered by at least one meeting. Times can be as large as a billion.\n\n`total_busy([[1, 4], [2, 6], [8, 10]])` → `7` (1 to 6, then 8 to 10)\n`total_busy([])` → `0`",
        starterCode: `def total_busy(meetings):
    pass
`,
        solution: `def total_busy(meetings):
    total = 0
    cur_start = cur_end = None
    for s, e in sorted(meetings):
        if cur_end is None or s > cur_end:
            if cur_end is not None:
                total += cur_end - cur_start
            cur_start, cur_end = s, e
        else:
            cur_end = max(cur_end, e)
    if cur_end is not None:
        total += cur_end - cur_start
    return total
`,
        tests: [
          t.eq("total_busy([[1, 4], [2, 6], [8, 10]])", "7"),
          t.eq("total_busy([])", "0"),
          t.eq("total_busy([[0, 5]])", "5"),
          t.eq("total_busy([[5, 5]])", "0"),
          t.eq("total_busy([[1, 3], [3, 5]])", "4"),
          t.eq("total_busy([[1, 10], [2, 3]])", "9"),
          t.hidden("total_busy([[8, 10], [1, 4], [2, 6]])", "7"),
          t.hidden("total_busy([[0, 1000000000]])", "1000000000"),
          t.hidden("total_busy([[i, i + 2] for i in range(40000)])", "40001"),
        ],
        explanation: "Sort by start and merge as you go, extending the current block while the next meeting starts before it ends. Add each finished block's length.",
      }),
      write({
        id: 'c13-t-23',
        title: "Ticket number runs",
        ...transfer,
        stage: 'interview',
        skills: ['sequence_start', 'set_membership', 'hash_reasoning'],
        difficulty: 3,
        minutes: 18,
        prompt: "`ids` is a list of ticket numbers in no particular order, possibly with repeats.\n\nReturn the length of the longest run of consecutive numbers that all appear, like 4, 5, 6, 7. Must run in O(n), so sorting is too slow.\n\n`longest_id_run([10, 4, 20, 1, 3, 2])` → `4` (1, 2, 3, 4)\n`longest_id_run([])` → `0`",
        starterCode: `def longest_id_run(ids):
    pass
`,
        solution: `def longest_id_run(ids):
    present = set(ids)
    best = 0
    for x in present:
        if x - 1 not in present:
            y = x
            while y + 1 in present:
                y += 1
            best = max(best, y - x + 1)
    return best
`,
        tests: [
          t.eq("longest_id_run([10, 4, 20, 1, 3, 2])", "4"),
          t.eq("longest_id_run([])", "0"),
          t.eq("longest_id_run([7])", "1"),
          t.eq("longest_id_run([1, 1, 1])", "1"),
          t.eq("longest_id_run([5, 6, 8, 9, 10])", "3"),
          t.eq("longest_id_run([-1, 0, 1])", "3"),
          t.hidden("longest_id_run([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])", "9"),
          t.hidden("longest_id_run(list(range(100000, 0, -1)))", "100000"),
          t.hidden("longest_id_run([i * 2 for i in range(50000)])", "1"),
        ],
        explanation: "Put the numbers where membership is O(1). Only count upward from a number whose predecessor is missing; that way each run is walked once.",
      }),
      write({
        id: 'c13-t-24',
        title: "Cheapest walk across a field",
        ...transfer,
        stage: 'pattern',
        skills: ['dp_grid', 'complexity', 'explanation'],
        difficulty: 3,
        minutes: 11,
        prompt: "`costs` is a grid of non-negative numbers, given as a list of rows. You start at the top-left cell and finish at the bottom-right cell. Each step moves one cell right or one cell down.\n\nA route costs the sum of every cell it touches, both ends included. Return the cheapest route's cost. The grid can be 60 by 60, so trying every route is too slow.\n\n`cheapest_route([[2, 9, 1], [1, 4, 1], [6, 1, 3]])` → `11` (2, 1, 4, 1, 3)\n`cheapest_route([[5]])` → `5`\n\nGive the function a docstring. In it, state the running time in big-O and say in one sentence why it is not exponential.",
        starterCode: `def cheapest_route(costs):
    pass
`,
        solution: `def cheapest_route(costs):
    """Each cell's cheapest cost depends only on the cell above it and the cell to its
    left, so every cell is solved once: O(rows * cols) time, not every route."""
    rows, cols = len(costs), len(costs[0])
    best = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:
                best[r][c] = costs[0][0]
            elif r == 0:
                best[r][c] = best[r][c - 1] + costs[r][c]
            elif c == 0:
                best[r][c] = best[r - 1][c] + costs[r][c]
            else:
                best[r][c] = min(best[r - 1][c], best[r][c - 1]) + costs[r][c]
    return best[-1][-1]
`,
        tests: [
          t.eq("cheapest_route([[2, 9, 1], [1, 4, 1], [6, 1, 3]])", "11"),
          t.eq("cheapest_route([[5]])", "5"),
          t.eq("cheapest_route([[1, 2, 3]])", "6"),
          t.eq("cheapest_route([[1], [2], [3]])", "6"),
          t.eq("cheapest_route([[0, 0], [0, 0]])", "0"),
          t.hidden("cheapest_route([[1, 100], [1, 1]])", "3"),
          t.hidden("cheapest_route([[1] * 60 for _ in range(60)])", "119"),
          t.check("the docstring states the running time", `doc = cheapest_route.__doc__ or ""
assert len(doc.split()) >= 12, "add a docstring of at least 12 words"
assert "O(" in doc, "state the running time in big-O, like O(n)"`),
        ],
        explanation: "The cheapest way into a cell comes from the cheaper of its two neighbours above and left. Fill the grid row by row; each cell is computed once.",
      }),
      write({
        id: 'c13-t-25',
        title: "Snacks on an exact budget",
        ...transfer,
        stage: 'pattern',
        skills: ['backtracking_state', 'combination_start'],
        difficulty: 3,
        minutes: 11,
        prompt: "`prices` is a list of different positive whole numbers, one per snack. `budget` is a positive whole number.\n\nReturn every way to choose snacks whose prices add up to exactly `budget`, using each snack at most once. Write each choice as a list of prices from smallest to largest. Return the choices in sorted order. Return `[]` if there is no way.\n\n`snack_combos([2, 3, 5, 7], 10)` → `[[2, 3, 5], [3, 7]]`\n`snack_combos([4], 3)` → `[]`",
        starterCode: `def snack_combos(prices, budget):
    pass
`,
        solution: `def snack_combos(prices, budget):
    prices = sorted(prices)
    out = []
    chosen = []

    def pick(start, left):
        if left == 0:
            out.append(chosen[:])
            return
        for i in range(start, len(prices)):
            if prices[i] > left:
                break
            chosen.append(prices[i])
            pick(i + 1, left - prices[i])
            chosen.pop()

    pick(0, budget)
    return out
`,
        tests: [
          t.eq("snack_combos([2, 3, 5, 7], 10)", "[[2, 3, 5], [3, 7]]"),
          t.eq("snack_combos([4], 3)", "[]"),
          t.eq("snack_combos([1, 2, 3], 3)", "[[1, 2], [3]]"),
          t.eq("snack_combos([5], 5)", "[[5]]"),
          t.eq("snack_combos([], 4)", "[]"),
          t.hidden("snack_combos([6, 1, 4, 3], 7)", "[[1, 6], [3, 4]]"),
          t.hidden("snack_combos([1, 2, 3, 4, 5], 15)", "[[1, 2, 3, 4, 5]]"),
          t.hidden("snack_combos([10, 20], 5)", "[]"),
        ],
        explanation: "Sort the prices, then build choices one snack at a time, only looking at snacks after the last one chosen. Stop a branch when the next price is more than what is left.",
      }),
      write({
        id: 'c13-t-26',
        title: "Waiting for a better price",
        ...transfer,
        stage: 'pattern',
        skills: ['stack_push_pop', 'state_tracking'],
        difficulty: 3,
        minutes: 10,
        prompt: "`prices` is a list of daily prices.\n\nFor each day, count the days you wait until a strictly higher price. Use `0` if no later day is higher. Return the list of counts. Must run in O(n).\n\n`days_until_higher([5, 3, 4, 8, 2])` → `[3, 1, 1, 0, 0]`\n`days_until_higher([])` → `[]`",
        starterCode: `def days_until_higher(prices):
    pass
`,
        solution: `def days_until_higher(prices):
    out = [0] * len(prices)
    waiting = []
    for i, p in enumerate(prices):
        while waiting and prices[waiting[-1]] < p:
            j = waiting.pop()
            out[j] = i - j
        waiting.append(i)
    return out
`,
        tests: [
          t.eq("days_until_higher([5, 3, 4, 8, 2])", "[3, 1, 1, 0, 0]"),
          t.eq("days_until_higher([])", "[]"),
          t.eq("days_until_higher([7])", "[0]"),
          t.eq("days_until_higher([1, 2, 3])", "[1, 1, 0]"),
          t.eq("days_until_higher([3, 3, 3])", "[0, 0, 0]"),
          t.hidden("days_until_higher([2, 1, 1, 5])", "[3, 2, 1, 0]"),
          t.hidden("days_until_higher(list(range(20000, 0, -1)))", "[0] * 20000"),
        ],
        explanation: "Keep the days still waiting for a higher price, with their prices falling from bottom to top. A new price settles every waiting day that is lower, newest first. Each day goes in and out once.",
      }),
      write({
        id: 'c13-t-27',
        title: "Change-making shortcut",
        ...transfer,
        stage: 'pattern',
        style: 'write-test',
        skills: ['dp_min_choice', 'edge_cases'],
        difficulty: 3,
        minutes: 5,
        prompt: "`fewest_coins(coins, amount)` should return the fewest coins that add up to exactly `amount`. `coins` lists the coin values, and each value can be used any number of times. It returns `-1` if no mix works. A teammate wrote this:\n\n```python\ndef fewest_coins(coins, amount):\n    count = 0\n    for c in sorted(coins, reverse=True):\n        count += amount // c\n        amount = amount % c\n    return count if amount == 0 else -1\n```\n\nIt is wrong on some inputs. Write `breaking_input()`. It takes nothing and returns a pair `(coins, amount)` on which the code above gives the wrong answer. Use at most 5 different coin values from 1 to 20, and an `amount` from 1 to 100.",
        starterCode: `def breaking_input():
    pass
`,
        solution: `def breaking_input():
    coins = [1, 3, 4]
    return (coins, 6)
`,
        tests: [
          t.check("your input breaks it", `def _bad(coins, amount):
    count = 0
    for c in sorted(coins, reverse=True):
        count += amount // c
        amount = amount % c
    return count if amount == 0 else -1
def _good(coins, amount):
    best = [0] + [None] * amount
    for a in range(1, amount + 1):
        options = [best[a - c] for c in coins if c <= a and best[a - c] is not None]
        best[a] = min(options) + 1 if options else None
    return -1 if best[amount] is None else best[amount]
x = breaking_input()
assert isinstance(x, tuple) and len(x) == 2, "return a pair (coins, amount)"
coins, amount = x
assert 1 <= len(set(coins)) <= 5 and all(isinstance(c, int) and 1 <= c <= 20 for c in coins), "use 1 to 5 coin values, each from 1 to 20"
assert isinstance(amount, int) and 1 <= amount <= 100, "amount must be from 1 to 100"
assert _bad(list(coins), amount) != _good(list(coins), amount), "the code above gives the right answer on this input"`),
        ],
        explanation: "Taking the biggest coin first is not always best: with coins 1, 3, 4 and amount 6 it uses 4 + 1 + 1 (three coins) instead of 3 + 3 (two). With 3 and 5 for amount 9 it even gives -1.",
      }),
      write({
        id: 'c13-t-28',
        title: "Turn the photo",
        ...transfer,
        stage: 'pattern',
        skills: ['matrix_transform', 'list_comprehension'],
        difficulty: 2,
        minutes: 5,
        prompt: "`image` is a list of rows of pixel values, all rows the same length.\n\nReturn a new image turned 90 degrees clockwise. The first column, read from bottom to top, becomes the first row. Don't change `image`.\n\n`rotate_clockwise([[1, 2, 3], [4, 5, 6]])` → `[[4, 1], [5, 2], [6, 3]]`\n`rotate_clockwise([[7]])` → `[[7]]`",
        starterCode: `def rotate_clockwise(image):
    pass
`,
        solution: `def rotate_clockwise(image):
    rows, cols = len(image), len(image[0])
    return [[image[rows - 1 - r][c] for r in range(rows)] for c in range(cols)]
`,
        tests: [
          t.eq("rotate_clockwise([[1, 2, 3], [4, 5, 6]])", "[[4, 1], [5, 2], [6, 3]]"),
          t.eq("rotate_clockwise([[7]])", "[[7]]"),
          t.eq("rotate_clockwise([[1, 2], [3, 4]])", "[[3, 1], [4, 2]]"),
          t.eq("rotate_clockwise([[1], [2], [3]])", "[[3, 2, 1]]"),
          t.eq("rotate_clockwise([[1, 2, 3]])", "[[1], [2], [3]]"),
          t.hidden("rotate_clockwise([[1, 2, 3], [4, 5, 6], [7, 8, 9]])", "[[7, 4, 1], [8, 5, 2], [9, 6, 3]]"),
          t.check("the input is not changed", `img = [[1, 2], [3, 4], [5, 6]]
rotate_clockwise(img)
assert img == [[1, 2], [3, 4], [5, 6]], "build a new image; don't change the one you were given"`, true),
        ],
        explanation: "New row c is old column c read from the last row up: new[c][r] = old[rows - 1 - r][c].",
      }),
      write({
        id: 'c13-t-29',
        title: "Job run order",
        ...transfer,
        stage: 'interview',
        skills: ['cycle_detection', 'graph_adjacency', 'heap_push_pop'],
        difficulty: 4,
        minutes: 24,
        prompt: "There are `n` jobs, numbered 0 to `n - 1`. `needs` is a list of `[a, b]` pairs meaning job `a` can only start after job `b` is done.\n\nReturn an order to run all the jobs. When more than one job is ready, run the smallest-numbered one first. Return `[]` if no order works. Must run in O((n + e) log n), where e is `len(needs)`.\n\n`build_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])` → `[0, 1, 2, 3]`\n`build_order(2, [[0, 1], [1, 0]])` → `[]` (each waits for the other)",
        starterCode: `def build_order(n, needs):
    pass
`,
        solution: `import heapq

def build_order(n, needs):
    waiting_on = [0] * n
    unlocks = [[] for _ in range(n)]
    for a, b in needs:
        waiting_on[a] += 1
        unlocks[b].append(a)
    ready = [j for j in range(n) if waiting_on[j] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        j = heapq.heappop(ready)
        order.append(j)
        for k in unlocks[j]:
            waiting_on[k] -= 1
            if waiting_on[k] == 0:
                heapq.heappush(ready, k)
    return order if len(order) == n else []
`,
        tests: [
          t.eq("build_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])", "[0, 1, 2, 3]"),
          t.eq("build_order(2, [[0, 1], [1, 0]])", "[]"),
          t.eq("build_order(1, [])", "[0]"),
          t.eq("build_order(3, [])", "[0, 1, 2]"),
          t.eq("build_order(3, [[0, 2]])", "[1, 2, 0]"),
          t.eq("build_order(3, [[0, 0]])", "[]"),
          t.hidden("build_order(5, [[0, 4], [1, 4], [4, 3]])", "[2, 3, 4, 0, 1]"),
          t.hidden("build_order(4, [[1, 0], [2, 1], [0, 2]])", "[]"),
          t.hidden("build_order(2000, [[i + 1, i] for i in range(1999)])", "list(range(2000))"),
        ],
        explanation: "Count what each job still waits for. Repeatedly run the smallest ready job (a min-heap of ready jobs) and release the jobs it unlocks. If some jobs never become ready, there is a loop of waits.",
      }),
      write({
        id: 'c13-t-30',
        title: "Two gifts under a budget",
        ...transfer,
        stage: 'pattern',
        skills: ['two_pointer', 'pointer_update'],
        difficulty: 2,
        minutes: 8,
        prompt: "`prices` is a list of positive item prices, sorted from smallest to largest. You buy exactly two different items.\n\nReturn the largest total of two items that is at most `budget`. Return `-1` if no two items fit. Must run in O(n) with O(1) extra space.\n\n`best_pair_under([2, 5, 7, 11, 15], 19)` → `18` (7 + 11)\n`best_pair_under([10], 50)` → `-1` (there is only one item)",
        starterCode: `def best_pair_under(prices, budget):
    pass
`,
        solution: `def best_pair_under(prices, budget):
    i, j = 0, len(prices) - 1
    best = -1
    while i < j:
        total = prices[i] + prices[j]
        if total <= budget:
            best = max(best, total)
            i += 1
        else:
            j -= 1
    return best
`,
        tests: [
          t.eq("best_pair_under([2, 5, 7, 11, 15], 19)", "18"),
          t.eq("best_pair_under([10], 50)", "-1"),
          t.eq("best_pair_under([1, 2], 2)", "-1"),
          t.eq("best_pair_under([1, 1], 2)", "2"),
          t.eq("best_pair_under([1, 2, 3], 100)", "5"),
          t.hidden("best_pair_under([3, 4, 9], 10)", "7"),
          t.hidden("best_pair_under([], 10)", "-1"),
          t.hidden("best_pair_under(list(range(1, 40001)), 50001)", "50001"),
        ],
        explanation: "Start with the cheapest and the dearest. If they fit, record the total and try a dearer partner for the cheap end; if not, drop the dearest. Each step rules out one item.",
      }),
      write({
        id: 'c13-t-31',
        title: "Runner-up scores",
        ...transfer,
        stage: 'pattern',
        skills: ['top_k', 'heap_push_pop', 'complexity'],
        difficulty: 3,
        minutes: 10,
        prompt: "`scores` is a list of whole numbers. `k` is between 1 and `len(scores)`.\n\nReturn the `k`-th highest score, counting repeats. Must run in O(n log k), which is faster than sorting when `k` is small.\n\n`kth_highest_score([40, 90, 70, 90, 10], 2)` → `90` (the two 90s are 1st and 2nd)\n`kth_highest_score([5], 1)` → `5`\n\nGive the function a docstring. In it, state the running time and the extra space in big-O.",
        starterCode: `def kth_highest_score(scores, k):
    pass
`,
        solution: `import heapq

def kth_highest_score(scores, k):
    """Keep the k highest scores so far, smallest of them on top. Each of the n
    scores costs O(log k), so the total is O(n log k) time and O(k) extra space."""
    top = []
    for s in scores:
        if len(top) < k:
            heapq.heappush(top, s)
        elif s > top[0]:
            heapq.heapreplace(top, s)
    return top[0]
`,
        tests: [
          t.eq("kth_highest_score([40, 90, 70, 90, 10], 2)", "90"),
          t.eq("kth_highest_score([5], 1)", "5"),
          t.eq("kth_highest_score([3, 1, 2], 3)", "1"),
          t.eq("kth_highest_score([3, 1, 2], 1)", "3"),
          t.eq("kth_highest_score([-1, -1, -2], 2)", "-1"),
          t.hidden("kth_highest_score([7, 7, 7, 7], 4)", "7"),
          t.hidden("kth_highest_score(list(range(100000)), 10)", "99990"),
          t.check("the docstring states the running time", `doc = kth_highest_score.__doc__ or ""
assert len(doc.split()) >= 12, "add a docstring of at least 12 words"
assert "O(" in doc, "state the running time in big-O, like O(n)"`),
        ],
        explanation: "Hold only the k best scores in a min-heap; its top is the k-th best. A new score replaces the top only if it beats it.",
      }),
      write({
        id: 'c13-t-32',
        title: "Stepping stones",
        ...transfer,
        stage: 'pattern',
        skills: ['greedy_reach', 'state_tracking'],
        difficulty: 3,
        minutes: 7,
        prompt: "Stones are numbered 0 to `len(hops) - 1`. `hops[i]` is the farthest you can jump forward from stone `i`; you may also jump shorter.\n\nYou start on stone 0. Return `True` if you can reach the last stone. Must run in O(n).\n\n`can_cross([2, 0, 3, 0, 0, 1])` → `True` (0 to 2, then 2 to 5)\n`can_cross([1, 0, 4])` → `False` (stuck on stone 1)",
        starterCode: `def can_cross(hops):
    pass
`,
        solution: `def can_cross(hops):
    reach = 0
    for i, h in enumerate(hops):
        if i > reach:
            return False
        reach = max(reach, i + h)
    return True
`,
        tests: [
          t.eq("can_cross([2, 0, 3, 0, 0, 1])", "True"),
          t.eq("can_cross([1, 0, 4])", "False"),
          t.eq("can_cross([0])", "True"),
          t.eq("can_cross([3, 0, 0, 0])", "True"),
          t.eq("can_cross([0, 1])", "False"),
          t.eq("can_cross([1, 1, 1])", "True"),
          t.hidden("can_cross([2, 0, 0, 1])", "False"),
          t.hidden("can_cross([1, 2, 0, 1])", "True"),
          t.hidden("can_cross([1] * 50000)", "True"),
          t.hidden("can_cross([2] * 30000 + [0, 0, 1])", "False"),
        ],
        explanation: "Track the farthest stone reachable so far. If you ever stand past it, you are stuck; otherwise extend it with i + hops[i].",
      }),
      write({
        id: 'c13-t-33',
        title: "Badges never scanned",
        ...transfer,
        stage: 'pattern',
        skills: ['set_membership', 'hash_reasoning', 'sorting'],
        difficulty: 1,
        minutes: 15,
        prompt: "`issued` is a list of different badge ids handed out at a conference. `scans` is the door log. It can repeat ids, and it can include ids that were never issued.\n\nReturn the issued ids that never appear in `scans`, sorted from smallest to largest. Must run in O(n log n) or better.\n\n`unscanned_badges([12, 7, 30, 4], [7, 7, 99, 4])` → `[12, 30]`\n`unscanned_badges([], [1, 2])` → `[]`",
        starterCode: `def unscanned_badges(issued, scans):
    pass
`,
        solution: `def unscanned_badges(issued, scans):
    scanned = set(scans)
    return sorted(b for b in issued if b not in scanned)
`,
        tests: [
          t.eq("unscanned_badges([12, 7, 30, 4], [7, 7, 99, 4])", "[12, 30]"),
          t.eq("unscanned_badges([], [1, 2])", "[]"),
          t.eq("unscanned_badges([1], [])", "[1]"),
          t.eq("unscanned_badges([1, 2], [2, 1])", "[]"),
          t.eq("unscanned_badges([5, 3, 9], [0])", "[3, 5, 9]"),
          t.hidden("unscanned_badges([8], [8, 8, 8])", "[]"),
          t.hidden("unscanned_badges(list(range(20000)), list(range(0, 20000, 2)))", "list(range(1, 20000, 2))"),
        ],
        explanation: "Put the scans where lookup is O(1), keep the issued ids that are missing, then sort. Checking `b in scans` against the list itself would be O(n·m).",
      }),
      write({
        id: 'c13-t-34',
        title: "Heavy routes in a tree",
        ...transfer,
        stage: 'pattern',
        skills: ['tree_dfs', 'treenode'],
        difficulty: 3,
        minutes: 9,
        prompt: "`root` is the root of a binary tree of whole numbers, or `None`. Each node has `.val`, `.left` and `.right`. A **route** runs from the root down to a leaf, a node with no children.\n\nReturn how many routes have a total strictly greater than `limit`.\n\n`paths_over(build_tree([5, 4, 8, 11, None, 13, 4]), 20)` → `1` (5+8+13 = 26; the others are 20 and 17)\n`paths_over(None, 0)` → `0` (an empty tree has no routes)",
        starterCode: `def paths_over(root, limit):
    pass
`,
        solution: `def paths_over(root, limit):
    count = 0
    todo = [(root, 0)] if root else []
    while todo:
        node, total = todo.pop()
        total += node.val
        if not node.left and not node.right:
            if total > limit:
                count += 1
        for child in (node.left, node.right):
            if child:
                todo.append((child, total))
    return count
`,
        tests: [
          t.eq("paths_over(build_tree([5, 4, 8, 11, None, 13, 4]), 20)", "1"),
          t.eq("paths_over(None, 0)", "0"),
          t.eq("paths_over(build_tree([1]), 0)", "1"),
          t.eq("paths_over(build_tree([1]), 1)", "0"),
          t.eq("paths_over(build_tree([1, 2, 3]), 2)", "2"),
          t.eq("paths_over(build_tree([-1, -2, -3]), -4)", "1"),
          t.hidden("paths_over(build_tree([10, None, 5, None, 5]), 19)", "1"),
          t.hidden("paths_over(build_tree([0, 1, 1]), 0)", "2"),
          t.hidden("paths_over(build_tree([1, 2, 2, 3, 3, 3, 3]), 5)", "4"),
        ],
        explanation: "Carry the total so far down each branch. At a leaf, compare it with the limit. Only leaves end a route.",
      }),
      write({
        id: 'c13-t-35',
        title: "Playlist with few artists",
        ...transfer,
        stage: 'interview',
        skills: ['sliding_window', 'window_counts', 'frequency_map'],
        difficulty: 4,
        minutes: 20,
        prompt: "`artists` lists the artist of each song in a playlist, in play order. `k` is at least 1.\n\nReturn the length of the longest run of back-to-back songs with at most `k` different artists. Must run in O(n).\n\n`longest_mix([\"ana\", \"bo\", \"ana\", \"cy\", \"cy\", \"cy\", \"bo\"], 2)` → `4` (`\"ana\", \"cy\", \"cy\", \"cy\"`)\n`longest_mix([], 3)` → `0`",
        starterCode: `def longest_mix(artists, k):
    pass
`,
        solution: `def longest_mix(artists, k):
    counts = {}
    left = 0
    best = 0
    for right, a in enumerate(artists):
        counts[a] = counts.get(a, 0) + 1
        while len(counts) > k:
            b = artists[left]
            counts[b] -= 1
            if counts[b] == 0:
                del counts[b]
            left += 1
        best = max(best, right - left + 1)
    return best
`,
        tests: [
          t.eq("longest_mix([\"ana\", \"bo\", \"ana\", \"cy\", \"cy\", \"cy\", \"bo\"], 2)", "4"),
          t.eq("longest_mix([], 3)", "0"),
          t.eq("longest_mix([\"a\"], 1)", "1"),
          t.eq("longest_mix([\"a\", \"b\", \"c\"], 3)", "3"),
          t.eq("longest_mix([\"a\", \"b\", \"a\", \"b\"], 1)", "1"),
          t.eq("longest_mix([\"a\", \"a\", \"b\", \"b\", \"c\", \"c\"], 2)", "4"),
          t.hidden("longest_mix([\"x\", \"y\", \"x\", \"z\", \"x\", \"z\"], 2)", "4"),
          t.hidden("longest_mix([\"a\", \"b\"] * 20000 + [\"c\"], 2)", "40000"),
          t.hidden("longest_mix([str(i) for i in range(30000)], 1)", "1"),
        ],
        explanation: "Grow the run on the right and count artists inside it. When there are more than k artists, drop songs from the left until there are k again. Each song enters and leaves once.",
      }),
      write({
        id: 'c13-t-36',
        title: "Hanging lookup",
        ...transfer,
        stage: 'pattern',
        skills: ['binary_search', 'search_invariant', 'edge_cases'],
        difficulty: 3,
        minutes: 8,
        prompt: "`nums` is a list sorted from smallest to largest. `first_at_least(nums, x)` should return the index of the first item that is `>= x`. If there is none, it returns `len(nums)`. A teammate's version never finishes on some inputs:\n\n```python\ndef first_at_least(nums, x):\n    low, high = 0, len(nums)\n    while low < high:\n        m = (low + high) // 2\n        if nums[m] < x:\n            low = m\n        else:\n            high = m\n    return low\n```\n\nWrite a correct `first_at_least(nums, x)` from scratch. Must run in O(log n).\n\n`first_at_least([1, 3, 3, 8], 3)` → `1`\n`first_at_least([1, 3], 9)` → `2` (nothing is big enough)",
        starterCode: `def first_at_least(nums, x):
    pass
`,
        solution: `def first_at_least(nums, x):
    low, high = 0, len(nums)
    while low < high:
        m = (low + high) // 2
        if nums[m] < x:
            low = m + 1
        else:
            high = m
    return low
`,
        tests: [
          t.eq("first_at_least([1, 3, 3, 8], 3)", "1"),
          t.eq("first_at_least([1, 3], 9)", "2"),
          t.eq("first_at_least([], 5)", "0"),
          t.eq("first_at_least([4], 1)", "0"),
          t.eq("first_at_least([1, 2], 2)", "1"),
          t.hidden("first_at_least([2, 2, 2], 2)", "0"),
          t.hidden("first_at_least([1, 5, 9], 6)", "2"),
          t.hidden("first_at_least(list(range(0, 200000, 2)), 100001)", "50001"),
        ],
        explanation: "When nums[m] < x, m itself can't be the answer, so the range must move past it: low = m + 1. Setting low = m leaves the range unchanged when high = low + 1, and the loop never ends.",
      }),
      write({
        id: 'c13-t-37',
        title: "Balancing a beam",
        ...transfer,
        stage: 'pattern',
        skills: ['prefix_suffix', 'accumulator'],
        difficulty: 2,
        minutes: 7,
        prompt: "`weights` is a list of numbers along a beam. A cut goes between two neighbouring items. It splits the list into a non-empty left part and a non-empty right part.\n\nReturn how many cuts leave both parts with the same total. Must run in O(n).\n\n`balanced_cuts([2, 1, 3, 0, 6])` → `2` (after the 3, and after the 0)\n`balanced_cuts([5])` → `0` (there is nowhere to cut)",
        starterCode: `def balanced_cuts(weights):
    pass
`,
        solution: `def balanced_cuts(weights):
    total = sum(weights)
    left = 0
    count = 0
    for i in range(len(weights) - 1):
        left += weights[i]
        if left * 2 == total:
            count += 1
    return count
`,
        tests: [
          t.eq("balanced_cuts([2, 1, 3, 0, 6])", "2"),
          t.eq("balanced_cuts([5])", "0"),
          t.eq("balanced_cuts([])", "0"),
          t.eq("balanced_cuts([1, 1])", "1"),
          t.eq("balanced_cuts([1, 2])", "0"),
          t.eq("balanced_cuts([0, 0, 0])", "2"),
          t.hidden("balanced_cuts([-1, 1, -1, 1])", "1"),
          t.hidden("balanced_cuts([1] * 20000)", "1"),
          t.hidden("balanced_cuts([3, -3] * 10000)", "9999"),
        ],
        explanation: "The right part's total is the whole total minus the left part's. Keep the left total as you move the cut, and compare it with total - left.",
      }),
      write({
        id: 'c13-t-38',
        title: "Setup steps",
        ...transfer,
        stage: 'pattern',
        skills: ['cycle_detection', 'graph_adjacency'],
        difficulty: 3,
        minutes: 11,
        prompt: "There are `n` setup steps, numbered 0 to `n - 1`. `rules` is a list of `[a, b]` pairs meaning step `b` must happen before step `a`.\n\nReturn `True` if all the steps can be done in some order that follows every rule. Otherwise return `False`.\n\n`setup_possible(3, [[1, 0], [2, 1]])` → `True` (0, then 1, then 2)\n`setup_possible(2, [[0, 1], [1, 0]])` → `False` (each must come before the other)",
        starterCode: `def setup_possible(n, rules):
    pass
`,
        solution: `def setup_possible(n, rules):
    blockers = [0] * n
    unlocks = [[] for _ in range(n)]
    for a, b in rules:
        blockers[a] += 1
        unlocks[b].append(a)
    ready = [s for s in range(n) if blockers[s] == 0]
    done = 0
    while ready:
        s = ready.pop()
        done += 1
        for t in unlocks[s]:
            blockers[t] -= 1
            if blockers[t] == 0:
                ready.append(t)
    return done == n
`,
        tests: [
          t.eq("setup_possible(3, [[1, 0], [2, 1]])", "True"),
          t.eq("setup_possible(2, [[0, 1], [1, 0]])", "False"),
          t.eq("setup_possible(1, [])", "True"),
          t.eq("setup_possible(1, [[0, 0]])", "False"),
          t.eq("setup_possible(4, [[1, 0], [2, 0], [3, 1], [3, 2]])", "True"),
          t.eq("setup_possible(3, [[0, 1], [1, 2], [2, 0]])", "False"),
          t.hidden("setup_possible(5, [[1, 0], [2, 1], [0, 2], [4, 3]])", "False"),
          t.hidden("setup_possible(4, [[1, 0], [1, 0]])", "True"),
          t.hidden("setup_possible(800, [[i + 1, i] for i in range(799)])", "True"),
        ],
        explanation: "An order exists exactly when the rules have no loop. Either repeatedly take a step with nothing left blocking it, or walk the rules and look for a step you reach again while still inside it.",
      }),
      write({
        id: 'c13-t-39',
        title: "Drop a stop near the end",
        ...transfer,
        stage: 'pattern',
        skills: ['linked_list_reassignment', 'dummy_node', 'complexity'],
        difficulty: 3,
        minutes: 10,
        prompt: "`head` is the first node of a linked list, or `None`. Each node has `.val` and `.next`. `k` is between 1 and the length of the list.\n\nRemove the `k`-th node counting from the end, where the last node is 1. Return the head of the result. Go through the list once, with O(1) extra space.\n\n`remove_kth_from_end(build_list([3, 6, 9, 12]), 1)` → `3 -> 6 -> 9`\n`remove_kth_from_end(build_list([5]), 1)` → `None` (the only node goes)\n\nGive the function a docstring. In it, state the running time and the extra space in big-O.",
        starterCode: `def remove_kth_from_end(head, k):
    pass
`,
        solution: `def remove_kth_from_end(head, k):
    """Move a lead node k steps ahead, then move both until the lead is on the last node.
    One pass over the list: O(n) time and O(1) extra space."""
    front = ListNode(0, head)
    lead = front
    for _ in range(k):
        lead = lead.next
    trail = front
    while lead.next:
        lead = lead.next
        trail = trail.next
    trail.next = trail.next.next
    return front.next
`,
        tests: [
          t.eq("list_to_array(remove_kth_from_end(build_list([3, 6, 9, 12]), 1))", "[3, 6, 9]"),
          t.eq("list_to_array(remove_kth_from_end(build_list([5]), 1))", "[]"),
          t.eq("list_to_array(remove_kth_from_end(build_list([1, 2, 3, 4, 5]), 2))", "[1, 2, 3, 5]"),
          t.eq("list_to_array(remove_kth_from_end(build_list([1, 2]), 2))", "[2]"),
          t.eq("list_to_array(remove_kth_from_end(build_list([1, 2]), 1))", "[1]"),
          t.hidden("list_to_array(remove_kth_from_end(build_list([1, 2, 3]), 3))", "[2, 3]"),
          t.hidden("list_to_array(remove_kth_from_end(build_list(list(range(1, 10001))), 10000))", "list(range(2, 10001))"),
          t.check("the docstring states the running time", `doc = remove_kth_from_end.__doc__ or ""
assert len(doc.split()) >= 12, "add a docstring of at least 12 words"
assert "O(" in doc, "state the running time in big-O, like O(n)"`),
        ],
        explanation: "Keep two walkers k nodes apart. When the front one reaches the last node, the back one sits just before the node to remove. A placeholder in front of the head covers removing the head.",
      }),
      write({
        id: 'c13-t-40',
        title: "Scrambled tags",
        ...transfer,
        stage: 'pattern',
        skills: ['grouping_key', 'sorting'],
        difficulty: 2,
        minutes: 7,
        prompt: "`tags` is a list of lowercase words. Two words belong together if one is a rearrangement of the other's letters, like `\"listen\"` and `\"silent\"`.\n\nReturn the groups. Sort the words inside each group, then sort the list of groups. Don't compare every pair of words: the list can be long.\n\n`group_scrambled([\"tea\", \"ate\", \"bat\", \"eat\", \"tab\"])` → `[[\"ate\", \"eat\", \"tea\"], [\"bat\", \"tab\"]]`\n`group_scrambled([])` → `[]`",
        starterCode: `def group_scrambled(tags):
    pass
`,
        solution: `def group_scrambled(tags):
    groups = {}
    for w in tags:
        key = "".join(sorted(w))
        groups.setdefault(key, []).append(w)
    return sorted(sorted(g) for g in groups.values())
`,
        tests: [
          t.eq("group_scrambled([\"tea\", \"ate\", \"bat\", \"eat\", \"tab\"])", "[[\"ate\", \"eat\", \"tea\"], [\"bat\", \"tab\"]]"),
          t.eq("group_scrambled([])", "[]"),
          t.eq("group_scrambled([\"a\"])", "[[\"a\"]]"),
          t.eq("group_scrambled([\"ab\", \"ba\", \"ab\"])", "[[\"ab\", \"ab\", \"ba\"]]"),
          t.eq("group_scrambled([\"abc\", \"def\"])", "[[\"abc\"], [\"def\"]]"),
          t.hidden("group_scrambled([\"\", \"\"])", "[[\"\", \"\"]]"),
          t.hidden("group_scrambled([\"dog\", \"god\", \"odg\", \"cat\"])", "[[\"cat\"], [\"dog\", \"god\", \"odg\"]]"),
          t.hidden("len(group_scrambled([str(i) for i in range(20000)]))", "1712"),
        ],
        explanation: "Words that are rearrangements of each other have the same letters in sorted order. Use that sorted string as a dict key and collect words under it.",
      }),
      write({
        id: 'c13-t-41',
        title: "Shared manager",
        ...transfer,
        stage: 'interview',
        skills: ['tree_dfs', 'treenode', 'tree_global_best'],
        difficulty: 4,
        minutes: 20,
        prompt: "`root` is the root of an org chart stored as a binary tree. Each node has `.val`, `.left` and `.right`. Values are unique, and the tree is not sorted in any way. `a` and `b` are two values in the tree.\n\nReturn the value of the lowest node that has both `a` and `b` at or below it. A node counts as being at or below itself.\n\n`shared_manager(build_tree([1, 2, 3, 4, 5, 6, 7]), 4, 5)` → `2`\n`shared_manager(build_tree([1, 2, 3, 4, 5, 6, 7]), 2, 4)` → `2` (2 is at or below itself)",
        starterCode: `def shared_manager(root, a, b):
    pass
`,
        solution: `def shared_manager(root, a, b):
    boss = {root.val: None}
    todo = [root]
    while todo:
        node = todo.pop()
        for child in (node.left, node.right):
            if child:
                boss[child.val] = node.val
                todo.append(child)
    above_a = set()
    x = a
    while x is not None:
        above_a.add(x)
        x = boss[x]
    y = b
    while y not in above_a:
        y = boss[y]
    return y
`,
        tests: [
          t.eq("shared_manager(build_tree([1, 2, 3, 4, 5, 6, 7]), 4, 5)", "2"),
          t.eq("shared_manager(build_tree([1, 2, 3, 4, 5, 6, 7]), 2, 4)", "2"),
          t.eq("shared_manager(build_tree([1, 2, 3, 4, 5, 6, 7]), 4, 7)", "1"),
          t.eq("shared_manager(build_tree([1, 2, 3]), 3, 3)", "3"),
          t.eq("shared_manager(build_tree([1, 2, None, 3]), 3, 1)", "1"),
          t.hidden("shared_manager(build_tree([5, 9, 2, None, 8, 4, 1]), 8, 9)", "9"),
          t.hidden("shared_manager(build_tree([5, 9, 2, None, 8, 4, 1]), 8, 1)", "5"),
          t.hidden("shared_manager(build_tree([1, 2, 3, 4, 5, 6, 7]), 6, 7)", "3"),
        ],
        explanation: "Either record each node's parent and walk up from both, or ask each subtree whether it holds a or b: the first node where the answers come from both sides (or the node is a or b itself) is the answer.",
      }),
      write({
        id: 'c13-t-42',
        title: "Most reported bugs",
        ...transfer,
        stage: 'pattern',
        skills: ['top_k', 'frequency_map', 'sort_key'],
        difficulty: 2,
        minutes: 8,
        prompt: "`reports` is a list of bug ids, one per report, and ids may repeat. `k` is at least 1.\n\nReturn the `k` ids reported most often, most reported first. Break ties by putting the smaller id first. If there are fewer than `k` different ids, return them all.\n\n`most_reported([4, 1, 4, 2, 1, 4], 2)` → `[4, 1]`\n`most_reported([9, 3], 5)` → `[3, 9]` (a tie, so the smaller id comes first)",
        starterCode: `def most_reported(reports, k):
    pass
`,
        solution: `import heapq

def most_reported(reports, k):
    counts = {}
    for r in reports:
        counts[r] = counts.get(r, 0) + 1
    return heapq.nsmallest(k, counts, key=lambda r: (-counts[r], r))
`,
        tests: [
          t.eq("most_reported([4, 1, 4, 2, 1, 4], 2)", "[4, 1]"),
          t.eq("most_reported([9, 3], 5)", "[3, 9]"),
          t.eq("most_reported([], 2)", "[]"),
          t.eq("most_reported([7], 1)", "[7]"),
          t.eq("most_reported([1, 2, 2, 3, 3], 2)", "[2, 3]"),
          t.hidden("most_reported([5, 5, 1], 1)", "[5]"),
          t.hidden("most_reported([3, 1, 2], 3)", "[1, 2, 3]"),
          t.hidden("most_reported([i % 100 for i in range(50000)] + [42], 1)", "[42]"),
        ],
        explanation: "Count each id, then take the k best by (count descending, id ascending). Sorting the distinct ids is fine; a size-k selection makes it O(n log k).",
      }),
      write({
        id: 'c13-t-43',
        title: "Tests for the best block",
        ...transfer,
        stage: 'pattern',
        style: 'write-test',
        skills: ['window_state', 'edge_cases'],
        difficulty: 2,
        minutes: 7,
        prompt: "`best_total(nums, k)` should return the largest total of `k` neighbouring items in `nums`. `k` is between 1 and `len(nums)`. Here is one attempt:\n\n```python\ndef best_total(nums, k):\n    total = sum(nums[:k])\n    best = total\n    for i in range(k, len(nums) - 1):\n        total += nums[i] - nums[i - k]\n        best = max(best, total)\n    return best\n```\n\nWrite `test_best_total(best_total)`. Its argument is the **function being tested**. The checker calls your `test_best_total` twice: once with a correct version and once with the version above.\n\nInside, write at least three lines like `assert best_total(...) == ...`. Every assert must pass for a correct version. At least one must fail for the version above.",
        starterCode: `def test_best_total(best_total):
    pass
`,
        solution: `def test_best_total(best_total):
    assert best_total([5], 1) == 5
    assert best_total([1, 2, 3], 1) == 3
    assert best_total([4, 0, 0, 9], 2) == 9
    assert best_total([2, 2], 2) == 4
`,
        tests: [
          t.check("passes on a correct version", `def _good(nums, k):
    return max(sum(nums[i:i + k]) for i in range(len(nums) - k + 1))
test_best_total(_good)`),
          t.check("fails on the version above", `def _bad(nums, k):
    total = sum(nums[:k])
    best = total
    for i in range(k, len(nums) - 1):
        total += nums[i] - nums[i - k]
        best = max(best, total)
    return best
caught = False
try:
    test_best_total(_bad)
except AssertionError:
    caught = True
assert caught, "every assert passed on the version above; add a case it gets wrong"`),
        ],
        explanation: "The loop stops one item early, so the block that ends on the last item is never counted. Any test whose best block is at the very end catches it, like [1, 2, 3] with k = 1.",
      }),
      write({
        id: 'c13-t-44',
        title: "Bracket depth",
        ...transfer,
        stage: 'pattern',
        skills: ['matching_pairs', 'accumulator'],
        difficulty: 1,
        minutes: 15,
        prompt: "`formula` is a string that may contain `(` and `)` among other characters.\n\nReturn the deepest level of brackets: `\"(a)\"` has depth 1 and `\"((a))\"` has depth 2. Return `-1` if the brackets don't match up. That means a `)` with no open `(` before it, or a `(` that is never closed.\n\n`max_nesting(\"(1+(2*3))+(4)\")` → `2`\n`max_nesting(\")(\")` → `-1` (the `)` comes first)",
        starterCode: `def max_nesting(formula):
    pass
`,
        solution: `def max_nesting(formula):
    depth = best = 0
    for ch in formula:
        if ch == "(":
            depth += 1
            best = max(best, depth)
        elif ch == ")":
            depth -= 1
            if depth < 0:
                return -1
    return best if depth == 0 else -1
`,
        tests: [
          t.eq("max_nesting(\"(1+(2*3))+(4)\")", "2"),
          t.eq("max_nesting(\")(\")", "-1"),
          t.eq("max_nesting(\"\")", "0"),
          t.eq("max_nesting(\"abc\")", "0"),
          t.eq("max_nesting(\"(()\")", "-1"),
          t.eq("max_nesting(\"()()\")", "1"),
          t.hidden("max_nesting(\"((()))\")", "3"),
          t.hidden("max_nesting(\"(a))(\")", "-1"),
          t.hidden("max_nesting(\"(\" * 5000 + \")\" * 5000)", "5000"),
        ],
        explanation: "Only one kind of bracket, so a counter is enough: +1 on `(`, -1 on `)`. It must never go below 0 and must end at 0; the largest value it reaches is the depth.",
      }),
      write({
        id: 'c13-t-45',
        title: "Longest calm stretch",
        ...transfer,
        stage: 'pattern',
        skills: ['sliding_window', 'window_state'],
        difficulty: 3,
        minutes: 8,
        prompt: "`levels` is a list of non-negative noise readings, one per second.\n\nReturn the length of the longest run of back-to-back seconds whose readings add up to at most `limit`. Return `0` if no single second fits. Must run in O(n).\n\n`longest_calm([3, 1, 2, 7, 1, 1], 6)` → `3` (3 + 1 + 2)\n`longest_calm([9], 4)` → `0`",
        starterCode: `def longest_calm(levels, limit):
    pass
`,
        solution: `def longest_calm(levels, limit):
    left = 0
    total = 0
    best = 0
    for right, x in enumerate(levels):
        total += x
        while total > limit:
            total -= levels[left]
            left += 1
        best = max(best, right - left + 1)
    return best
`,
        tests: [
          t.eq("longest_calm([3, 1, 2, 7, 1, 1], 6)", "3"),
          t.eq("longest_calm([9], 4)", "0"),
          t.eq("longest_calm([], 5)", "0"),
          t.eq("longest_calm([0, 0, 0], 0)", "3"),
          t.eq("longest_calm([5, 5], 5)", "1"),
          t.eq("longest_calm([1, 1, 1, 9, 1, 1, 1, 1], 4)", "4"),
          t.hidden("longest_calm([2, 2, 2, 2], 7)", "3"),
          t.hidden("longest_calm([1] * 50000, 1000)", "1000"),
        ],
        explanation: "Readings are never negative, so adding a second never lowers the total. Grow the run on the right; while it is over the limit, drop seconds from the left.",
      }),
      write({
        id: 'c13-t-46',
        title: "Row totals",
        ...transfer,
        stage: 'pattern',
        skills: ['bfs_levels', 'treenode'],
        difficulty: 2,
        minutes: 7,
        prompt: "`root` is the root of a binary tree of numbers, or `None`. Each node has `.val`, `.left` and `.right`. The root is row 0, its children are row 1, and so on.\n\nReturn a list with the total of each row, from the top row down.\n\n`row_totals(build_tree([1, 2, 3, None, 5, 6]))` → `[1, 5, 11]`\n`row_totals(None)` → `[]`",
        starterCode: `def row_totals(root):
    pass
`,
        solution: `def row_totals(root):
    out = []
    row = [root] if root else []
    while row:
        out.append(sum(n.val for n in row))
        row = [c for n in row for c in (n.left, n.right) if c]
    return out
`,
        tests: [
          t.eq("row_totals(build_tree([1, 2, 3, None, 5, 6]))", "[1, 5, 11]"),
          t.eq("row_totals(None)", "[]"),
          t.eq("row_totals(build_tree([7]))", "[7]"),
          t.eq("row_totals(build_tree([1, 2]))", "[1, 2]"),
          t.eq("row_totals(build_tree([1, None, 2, None, 3]))", "[1, 2, 3]"),
          t.hidden("row_totals(build_tree([1, 2, 3, 4, 5, 6, 7]))", "[1, 5, 22]"),
          t.hidden("row_totals(build_tree([-1, 1, 1]))", "[-1, 2]"),
          t.hidden("row_totals(build_tree([0, 0, 0, 0]))", "[0, 0, 0]"),
        ],
        explanation: "Handle the tree one row at a time: total the current row, then build the next row from its children.",
      }),
      write({
        id: 'c13-t-47',
        title: "One clean network",
        ...transfer,
        stage: 'pattern',
        skills: ['graph_tree_check', 'connected_components', 'complexity'],
        difficulty: 3,
        minutes: 11,
        prompt: "There are `n` computers, numbered 0 to `n - 1`, with `n` at least 1. `links` is a list of `[a, b]` cables. Each cable joins two different computers, and works both ways.\n\nReturn `True` if every computer can reach every other one and no cable is extra. A cable is extra if removing it still leaves everyone connected. Otherwise return `False`.\n\n`is_one_network(4, [[0, 1], [1, 2], [1, 3]])` → `True`\n`is_one_network(3, [[0, 1], [1, 2], [2, 0]])` → `False` (any one cable could go)\n\nGive the function a docstring. In it, state the running time in big-O and name one input that returns `False`.",
        starterCode: `def is_one_network(n, links):
    pass
`,
        solution: `def is_one_network(n, links):
    """A clean network has exactly n - 1 cables and reaches everyone from computer 0.
    Listing neighbours and one walk take O(n + e) time. False example: n = 2, no cables."""
    if len(links) != n - 1:
        return False
    nbrs = [[] for _ in range(n)]
    for a, b in links:
        nbrs[a].append(b)
        nbrs[b].append(a)
    reached = {0}
    todo = [0]
    while todo:
        x = todo.pop()
        for y in nbrs[x]:
            if y not in reached:
                reached.add(y)
                todo.append(y)
    return len(reached) == n
`,
        tests: [
          t.eq("is_one_network(4, [[0, 1], [1, 2], [1, 3]])", "True"),
          t.eq("is_one_network(3, [[0, 1], [1, 2], [2, 0]])", "False"),
          t.eq("is_one_network(1, [])", "True"),
          t.eq("is_one_network(2, [])", "False"),
          t.eq("is_one_network(2, [[0, 1]])", "True"),
          t.eq("is_one_network(4, [[0, 1], [2, 3]])", "False"),
          t.hidden("is_one_network(5, [[0, 1], [0, 2], [0, 3], [1, 4]])", "True"),
          t.hidden("is_one_network(4, [[0, 1], [1, 2], [2, 0]])", "False"),
          t.hidden("is_one_network(2000, [[i, i + 1] for i in range(1999)])", "True"),
          t.check("the docstring states the running time", `doc = is_one_network.__doc__ or ""
assert len(doc.split()) >= 12, "add a docstring of at least 12 words"
assert "O(" in doc, "state the running time in big-O, like O(n)"`),
        ],
        explanation: "Connected with nothing extra means exactly n - 1 cables and everyone reachable from computer 0. Check the count first, then walk once from 0.",
      }),
      write({
        id: 'c13-t-48',
        title: "Truck capacity",
        ...transfer,
        stage: 'pattern',
        skills: ['binary_search', 'search_invariant'],
        difficulty: 4,
        minutes: 12,
        prompt: "`packages` lists package weights in the order they must ship. Each day the truck takes the next packages in order, as many as fit within its capacity.\n\nReturn the smallest whole-number capacity that ships everything within `days` days. Must run in O(n log S), where S is the total weight.\n\n`min_daily_load([3, 2, 2, 4, 1, 4], 3)` → `6` (3+2, then 2+4, then 1+4)\n`min_daily_load([5, 5], 5)` → `5` (no truck can be smaller than the heaviest package)",
        starterCode: `def min_daily_load(packages, days):
    pass
`,
        solution: `def min_daily_load(packages, days):
    def days_needed(cap):
        used, load = 1, 0
        for p in packages:
            if load + p > cap:
                used += 1
                load = 0
            load += p
        return used

    low, high = max(packages), sum(packages)
    while low < high:
        m = (low + high) // 2
        if days_needed(m) <= days:
            high = m
        else:
            low = m + 1
    return low
`,
        tests: [
          t.eq("min_daily_load([3, 2, 2, 4, 1, 4], 3)", "6"),
          t.eq("min_daily_load([5, 5], 5)", "5"),
          t.eq("min_daily_load([1], 1)", "1"),
          t.eq("min_daily_load([1, 2, 3], 1)", "6"),
          t.eq("min_daily_load([1, 2, 3], 3)", "3"),
          t.eq("min_daily_load([7, 2, 5, 10, 8], 2)", "18"),
          t.hidden("min_daily_load([1, 1, 1, 1], 2)", "2"),
          t.hidden("min_daily_load([1] * 50000, 1)", "50000"),
          t.hidden("min_daily_load([1] * 50000, 7)", "7143"),
        ],
        explanation: "If a capacity works, every bigger one works too. So search the capacities between the heaviest package and the total, checking each guess with one pass that counts days.",
      }),
    ],
  },
]
