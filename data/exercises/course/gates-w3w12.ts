import type { Section } from '@/lib/types'
import { t, write } from '@/data/exercises/build'

/**
 * Reps 2.0 gate variants for Weeks 3–12 (REPS_2_MASTER_SPEC.md §12, data/course/gates.ts).
 * Cold checkpoints: a bare signature, a plain prompt, no hints, no note, and the
 * technique is never named. Variants in one pool are equivalent in difficulty.
 */

const gate = { stage: 'retrieval' as const, repType: 'cold' as const, gate: true }

const HEAD = '`head` is the first node of a linked list, or `None` if it is empty. Each node has `.val` and `.next`.'
const ROOT = '`root` is the top node of a binary tree, or `None` if the tree is empty.'
const NESTED = '`items` is a list. Each entry is a whole number or another list built the same way.'

export const sections: Section[] = [
  // ── Week 3 ────────────────────────────────────────────────────────────────
  {
    id: 'c3-gates',
    title: 'Week 3 checkpoints',
    summary: 'Cold variants: two indexes on a sorted list or string, which one moves, and left and right summaries.',
    exercises: [
      write({
        id: 'c3-g-pointer-a',
        title: 'Pair positions in a sorted list',
        skills: ['two_pointer', 'pointer_update'],
        ...gate,
        difficulty: 2,
        minutes: 6,
        prompt:
          '`nums` is a list of numbers sorted from smallest to largest. Return `[i, j]` with `i < j` where `nums[i] + nums[j] == target`. At most one pair works. Return `[]` if none does. Use O(1) extra space.\n\n`pair_at(nums=[1, 3, 4, 6, 9], target=13)` → `[2, 4]`\n\n`pair_at(nums=[2, 5], target=4)` → `[]`',
        starterCode: 'def pair_at(nums, target):\n    pass\n',
        solution: `def pair_at(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1
    return []
`,
        tests: [
          t.eq('pair_at([1, 3, 4, 6, 9], 13)', '[2, 4]'),
          t.eq('pair_at([2, 5], 4)', '[]'),
          t.eq('pair_at([2, 5], 7)', '[0, 1]'),
          t.hidden('pair_at([], 3)', '[]'),
          t.hidden('pair_at([5], 10)', '[]'),
          t.hidden('pair_at([-4, -1, 0, 2, 7], -5)', '[0, 1]'),
        ],
        signature: 'gate:sorted-pair-indexes',
      }),
      write({
        id: 'c3-g-pointer-b',
        title: 'Reverse only the letters',
        skills: ['two_pointer', 'pointer_update'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`s` is a string. Return a new string where the letters appear in reverse order. Every other character stays where it was. Use `ch.isalpha()` to test for a letter.\n\n`reverse_letters(s="ab-cd")` → `\'dc-ba\'`\n\n`reverse_letters(s="1-2")` → `\'1-2\'` (no letters)',
        starterCode: 'def reverse_letters(s):\n    pass\n',
        solution: `def reverse_letters(s):
    chars = list(s)
    left, right = 0, len(chars) - 1
    while left < right:
        if not chars[left].isalpha():
            left += 1
        elif not chars[right].isalpha():
            right -= 1
        else:
            chars[left], chars[right] = chars[right], chars[left]
            left += 1
            right -= 1
    return ''.join(chars)
`,
        tests: [
          t.eq('reverse_letters("ab-cd")', "'dc-ba'"),
          t.eq('reverse_letters("1-2")', "'1-2'"),
          t.eq('reverse_letters("a,b$c")', "'c,b$a'"),
          t.hidden('reverse_letters("")', "''"),
          t.hidden('reverse_letters("x")', "'x'"),
          t.hidden('reverse_letters("Ab!!cD9")', "'Dc!!bA9'"),
        ],
        signature: 'gate:reverse-letters-only',
      }),
      write({
        id: 'c3-g-movement-a',
        title: 'Pair sum closest to a target',
        skills: ['pointer_update', 'two_pointer'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`nums` is a sorted list with at least two numbers. Pick two different positions. Return the sum of the pair that is closest to `target`. If two sums are equally close, return the smaller sum.\n\n`closest_sum(nums=[1, 4, 6, 9], target=12)` → `13` (4 + 9)\n\n`closest_sum(nums=[1, 3], target=0)` → `4` (the only pair)',
        starterCode: 'def closest_sum(nums, target):\n    pass\n',
        solution: `def closest_sum(nums, target):
    left, right = 0, len(nums) - 1
    best = nums[left] + nums[right]
    while left < right:
        total = nums[left] + nums[right]
        if abs(total - target) < abs(best - target) or (abs(total - target) == abs(best - target) and total < best):
            best = total
        if total == target:
            return total
        if total < target:
            left += 1
        else:
            right -= 1
    return best
`,
        tests: [
          t.eq('closest_sum([1, 4, 6, 9], 12)', '13'),
          t.eq('closest_sum([1, 3], 0)', '4'),
          t.eq('closest_sum([2, 5, 8, 11], 13)', '13'),
          t.hidden('closest_sum([1, 2, 5, 6], 9)', '8'),
          t.hidden('closest_sum([-5, -2, 0, 3], -6)', '-7'),
          t.hidden('closest_sum([1, 1, 1, 10], 100)', '11'),
        ],
        signature: 'gate:closest-pair-sum',
      }),
      write({
        id: 'c3-g-movement-b',
        title: 'Squares in order',
        skills: ['pointer_update', 'two_pointer'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`nums` is a sorted list of whole numbers. It may hold negatives. Return the squares of the numbers, sorted from smallest to largest. Do it in one pass without calling `sort`.\n\n`sorted_squares(nums=[-3, -1, 2])` → `[1, 4, 9]`\n\n`sorted_squares(nums=[])` → `[]`',
        starterCode: 'def sorted_squares(nums):\n    pass\n',
        solution: `def sorted_squares(nums):
    out = [0] * len(nums)
    left, right = 0, len(nums) - 1
    write_at = len(nums) - 1
    while left <= right:
        if abs(nums[left]) > abs(nums[right]):
            out[write_at] = nums[left] * nums[left]
            left += 1
        else:
            out[write_at] = nums[right] * nums[right]
            right -= 1
        write_at -= 1
    return out
`,
        tests: [
          t.eq('sorted_squares([-3, -1, 2])', '[1, 4, 9]'),
          t.eq('sorted_squares([])', '[]'),
          t.eq('sorted_squares([-4, -2, 0, 1, 5])', '[0, 1, 4, 16, 25]'),
          t.hidden('sorted_squares([-7])', '[49]'),
          t.hidden('sorted_squares([-5, -3, -1])', '[1, 9, 25]'),
          t.hidden('sorted_squares([-2, -2, 2, 2])', '[4, 4, 4, 4]'),
        ],
        signature: 'gate:sorted-squares',
      }),
      write({
        id: 'c3-g-movement-c',
        title: 'Biggest tank between two walls',
        skills: ['pointer_update', 'two_pointer'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`heights` is a list of wall heights, one per position. Two walls at positions `i < j` hold water up to the shorter wall. The amount is `min(heights[i], heights[j]) * (j - i)`. Return the largest amount any two walls can hold. Return `0` with fewer than two walls.\n\n`best_tank(heights=[1, 8, 6, 2, 5, 4, 8, 3, 7])` → `49`\n\n`best_tank(heights=[4])` → `0`',
        starterCode: 'def best_tank(heights):\n    pass\n',
        solution: `def best_tank(heights):
    left, right = 0, len(heights) - 1
    best = 0
    while left < right:
        amount = min(heights[left], heights[right]) * (right - left)
        best = max(best, amount)
        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1
    return best
`,
        tests: [
          t.eq('best_tank([1, 8, 6, 2, 5, 4, 8, 3, 7])', '49'),
          t.eq('best_tank([4])', '0'),
          t.eq('best_tank([1, 1])', '1'),
          t.hidden('best_tank([])', '0'),
          t.hidden('best_tank([4, 3, 2, 1, 4])', '16'),
          t.hidden('best_tank([1, 2, 4, 3])', '4'),
        ],
        signature: 'gate:best-tank',
      }),
      write({
        id: 'c3-g-prefix-a',
        title: 'Balance index',
        skills: ['prefix_suffix', 'state_tracking'],
        ...gate,
        difficulty: 2,
        minutes: 6,
        prompt:
          '`nums` is a list of whole numbers. Return the first index `i` where the sum of everything left of `i` equals the sum of everything right of `i`. An empty side sums to 0. Return `-1` if there is no such index.\n\n`balance_index(nums=[1, 7, 3, 6, 5, 6])` → `3`\n\n`balance_index(nums=[1, 2])` → `-1`',
        starterCode: 'def balance_index(nums):\n    pass\n',
        solution: `def balance_index(nums):
    total = sum(nums)
    left = 0
    for i, x in enumerate(nums):
        if left == total - left - x:
            return i
        left += x
    return -1
`,
        tests: [
          t.eq('balance_index([1, 7, 3, 6, 5, 6])', '3'),
          t.eq('balance_index([1, 2])', '-1'),
          t.eq('balance_index([2, 1, -1])', '0'),
          t.hidden('balance_index([])', '-1'),
          t.hidden('balance_index([5])', '0'),
          t.hidden('balance_index([0, 0, 0])', '0'),
        ],
        signature: 'gate:balance-index',
      }),
      write({
        id: 'c3-g-prefix-b',
        title: 'Product of the others',
        skills: ['prefix_suffix', 'state_tracking'],
        ...gate,
        difficulty: 3,
        minutes: 8,
        prompt:
          '`nums` is a list of whole numbers. Return a list where position `i` holds the product of every number except `nums[i]`. Do not use division.\n\n`others_product(nums=[1, 2, 3, 4])` → `[24, 12, 8, 6]`\n\n`others_product(nums=[3, 0, 2])` → `[0, 6, 0]` (one zero)',
        starterCode: 'def others_product(nums):\n    pass\n',
        solution: `def others_product(nums):
    n = len(nums)
    out = [1] * n
    left = 1
    for i in range(n):
        out[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= nums[i]
    return out
`,
        tests: [
          t.eq('others_product([1, 2, 3, 4])', '[24, 12, 8, 6]'),
          t.eq('others_product([3, 0, 2])', '[0, 6, 0]'),
          t.eq('others_product([5, 2])', '[2, 5]'),
          t.hidden('others_product([0, 4, 0])', '[0, 0, 0]'),
          t.hidden('others_product([-1, 2, -3])', '[-6, 3, -2]'),
          t.hidden('others_product([7])', '[1]'),
        ],
        signature: 'gate:product-of-others',
      }),
      write({
        id: 'c3-g-prefix-c',
        title: 'Walled-in positions',
        skills: ['prefix_suffix', 'state_tracking'],
        ...gate,
        difficulty: 3,
        minutes: 8,
        prompt:
          '`heights` is a list of numbers. A position is **walled in** when something strictly taller sits somewhere to its left and somewhere to its right. Return how many positions are walled in. Aim for O(n) time.\n\n`walled_in(heights=[3, 1, 2, 5])` → `2` (the 1 and the 2)\n\n`walled_in(heights=[1, 2, 3])` → `0`',
        starterCode: 'def walled_in(heights):\n    pass\n',
        solution: `def walled_in(heights):
    n = len(heights)
    right_max = [float('-inf')] * n
    tallest = float('-inf')
    for i in range(n - 1, -1, -1):
        right_max[i] = tallest
        tallest = max(tallest, heights[i])
    count = 0
    left_max = float('-inf')
    for i in range(n):
        if left_max > heights[i] and right_max[i] > heights[i]:
            count += 1
        left_max = max(left_max, heights[i])
    return count
`,
        tests: [
          t.eq('walled_in([3, 1, 2, 5])', '2'),
          t.eq('walled_in([1, 2, 3])', '0'),
          t.eq('walled_in([5, 2, 6, 1, 4])', '2'),
          t.hidden('walled_in([])', '0'),
          t.hidden('walled_in([4, 4, 4])', '0'),
          t.hidden('walled_in([9, 3, 9, 3, 9])', '2'),
        ],
        signature: 'gate:walled-in',
      }),
    ],
  },
  // ── Week 6 ────────────────────────────────────────────────────────────────
  {
    id: 'c6-gates',
    title: 'Week 6 checkpoints',
    summary: 'Cold variants: two walkers on one linked list, and functions that call themselves on a smaller piece.',
    exercises: [
      write({
        id: 'c6-g-fast-slow-a',
        title: 'Value k from the end',
        skills: ['fast_slow', 'linked_list_traversal'],
        ...gate,
        difficulty: 3,
        minutes: 6,
        prompt: `${HEAD} \`k\` is at least 1 and at most the length. Return the value of the \`k\`-th node from the end in one pass. The last node is \`k = 1\`.\n\n\`from_end(head=build_list([4, 5, 6, 7]), k=3)\` → \`5\`\n\n\`from_end(head=build_list([9]), k=1)\` → \`9\``,
        starterCode: 'def from_end(head, k):\n    pass\n',
        solution: `def from_end(head, k):
    lead = head
    for _ in range(k):
        lead = lead.next
    trail = head
    while lead:
        lead = lead.next
        trail = trail.next
    return trail.val
`,
        tests: [
          t.eq('from_end(build_list([4, 5, 6, 7]), 3)', '5'),
          t.eq('from_end(build_list([9]), 1)', '9'),
          t.eq('from_end(build_list([1, 2, 3]), 1)', '3'),
          t.hidden('from_end(build_list([1, 2, 3]), 3)', '1'),
          t.hidden('from_end(build_list([8, -2]), 2)', '8'),
        ],
        signature: 'gate:ll-kth-from-end',
      }),
      write({
        id: 'c6-g-fast-slow-b',
        title: 'The first middle',
        skills: ['fast_slow', 'linked_list_traversal'],
        ...gate,
        difficulty: 3,
        minutes: 6,
        prompt: `${HEAD} The list is not empty. Return the value at position \`(length - 1) // 2\`, counting from 0. Walk the list only once.\n\n\`first_middle(head=build_list([1, 2, 3, 4]))\` → \`2\`\n\n\`first_middle(head=build_list([7]))\` → \`7\``,
        starterCode: 'def first_middle(head):\n    pass\n',
        solution: `def first_middle(head):
    slow = head
    fast = head
    while fast.next and fast.next.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val
`,
        tests: [
          t.eq('first_middle(build_list([1, 2, 3, 4]))', '2'),
          t.eq('first_middle(build_list([7]))', '7'),
          t.eq('first_middle(build_list([1, 2, 3, 4, 5]))', '3'),
          t.hidden('first_middle(build_list([1, 2]))', '1'),
          t.hidden('first_middle(build_list([1, 2, 3, 4, 5, 6]))', '3'),
        ],
        signature: 'gate:ll-first-middle',
      }),
      write({
        id: 'c6-g-fast-slow-c',
        title: 'Does the chain loop back?',
        skills: ['fast_slow', 'linked_list_traversal'],
        ...gate,
        difficulty: 3,
        minutes: 6,
        prompt: `${HEAD} The last node may point back to an earlier node instead of \`None\`. Return \`True\` if the list loops back, otherwise \`False\`. Use O(1) extra space.`,
        starterCode: 'def loops_back(head):\n    pass\n',
        solution: `def loops_back(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
`,
        tests: [
          t.eq('loops_back(build_list([1, 2, 3]))', 'False'),
          t.check('3 -> 4 -> 5 -> back to 4', 'h = build_list([3, 4, 5])\nh.next.next.next = h.next\nassert loops_back(h) is True'),
          t.check('1 -> back to 1', 'h = build_list([1])\nh.next = h\nassert loops_back(h) is True'),
          t.hidden('loops_back(None)', 'False'),
          t.hidden('loops_back(build_list([1, 2]))', 'False'),
          t.check('a long loop back to the head', 'h = build_list(list(range(10)))\nn = h\nwhile n.next:\n    n = n.next\nn.next = h\nassert loops_back(h) is True', true),
        ],
        signature: 'gate:ll-loops-back',
      }),
      write({
        id: 'c6-g-recursion-a',
        title: 'Sum of a nested list',
        skills: ['recursion_base_case', 'recursion_return'],
        ...gate,
        difficulty: 2,
        minutes: 6,
        prompt: `${NESTED} Return the sum of every number, however deep it sits. Use \`isinstance(x, list)\` to tell a list from a number.\n\n\`nested_sum(items=[1, [2, [3]], 4])\` → \`10\`\n\n\`nested_sum(items=[[], []])\` → \`0\``,
        starterCode: 'def nested_sum(items):\n    pass\n',
        solution: `def nested_sum(items):
    total = 0
    for x in items:
        if isinstance(x, list):
            total += nested_sum(x)
        else:
            total += x
    return total
`,
        tests: [
          t.eq('nested_sum([1, [2, [3]], 4])', '10'),
          t.eq('nested_sum([[], []])', '0'),
          t.eq('nested_sum([5, 6])', '11'),
          t.hidden('nested_sum([])', '0'),
          t.hidden('nested_sum([[[[-7]]], 2])', '-5'),
        ],
        signature: 'gate:nested-sum',
      }),
      write({
        id: 'c6-g-recursion-b',
        title: 'How deep is the nesting?',
        skills: ['recursion_base_case', 'recursion_return'],
        ...gate,
        difficulty: 2,
        minutes: 6,
        prompt: `${NESTED} A list with no lists inside has depth 1. Each level of lists inside adds 1. Return the depth of \`items\`. Use \`isinstance(x, list)\` to tell a list from a number.\n\n\`depth(items=[1, [2, [3]]])\` → \`3\`\n\n\`depth(items=[])\` → \`1\``,
        starterCode: 'def depth(items):\n    pass\n',
        solution: `def depth(items):
    deepest = 0
    for x in items:
        if isinstance(x, list):
            deepest = max(deepest, depth(x))
    return 1 + deepest
`,
        tests: [
          t.eq('depth([1, [2, [3]]])', '3'),
          t.eq('depth([])', '1'),
          t.eq('depth([1, 2, 3])', '1'),
          t.hidden('depth([[], [[]], 4])', '3'),
          t.hidden('depth([[[[[]]]]])', '5'),
        ],
        signature: 'gate:nested-depth',
      }),
      write({
        id: 'c6-g-recursion-c',
        title: 'Flatten a nested list',
        skills: ['recursion_base_case', 'recursion_return'],
        ...gate,
        difficulty: 2,
        minutes: 6,
        prompt: `${NESTED} Return one flat list of all the numbers, in the order they appear. Use \`isinstance(x, list)\` to tell a list from a number.\n\n\`flatten(items=[1, [2, [3, 4]], 5])\` → \`[1, 2, 3, 4, 5]\`\n\n\`flatten(items=[[], [[]]])\` → \`[]\``,
        starterCode: 'def flatten(items):\n    pass\n',
        solution: `def flatten(items):
    out = []
    for x in items:
        if isinstance(x, list):
            out.extend(flatten(x))
        else:
            out.append(x)
    return out
`,
        tests: [
          t.eq('flatten([1, [2, [3, 4]], 5])', '[1, 2, 3, 4, 5]'),
          t.eq('flatten([[], [[]]])', '[]'),
          t.eq('flatten([7, 8])', '[7, 8]'),
          t.hidden('flatten([])', '[]'),
          t.hidden('flatten([[[[-1]]], [0, [2]], 3])', '[-1, 0, 2, 3]'),
        ],
        signature: 'gate:nested-flatten',
      }),
    ],
  },
  // ── Week 8 ────────────────────────────────────────────────────────────────
  {
    id: 'c8-gates',
    title: 'Week 8 checkpoints',
    summary: 'Cold variants: a tree one row at a time, and reaching every node of a graph once.',
    exercises: [
      write({
        id: 'c8-g-queue-a',
        title: 'Sum of each row',
        skills: ['queue_deque', 'bfs_levels'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt: `${ROOT} Each node has \`.val\`, \`.left\` and \`.right\`. Return a list with the sum of each row, top row first.\n\n\`row_sums(root=build_tree([1, 2, 3, 4, None, None, 5]))\` → \`[1, 5, 9]\`\n\n\`row_sums(root=None)\` → \`[]\``,
        starterCode: 'def row_sums(root):\n    pass\n',
        solution: `from collections import deque

def row_sums(root):
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
          t.eq('row_sums(build_tree([1, 2, 3, 4, None, None, 5]))', '[1, 5, 9]'),
          t.eq('row_sums(None)', '[]'),
          t.eq('row_sums(build_tree([6]))', '[6]'),
          t.hidden('row_sums(build_tree([1, 2, None, 3, None, 4]))', '[1, 2, 3, 4]'),
          t.hidden('row_sums(build_tree([0, -1, 1, -2, 2, -3, 3]))', '[0, 0, 0]'),
        ],
        signature: 'gate:tree-row-sums',
      }),
      write({
        id: 'c8-g-queue-b',
        title: 'First value of each row',
        skills: ['queue_deque', 'bfs_levels'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt: `${ROOT} Each node has \`.val\`, \`.left\` and \`.right\`. Return the leftmost value of each row, top row first.\n\n\`row_starts(root=build_tree([1, 2, 3, None, 4, 5]))\` → \`[1, 2, 4]\`\n\n\`row_starts(root=None)\` → \`[]\``,
        starterCode: 'def row_starts(root):\n    pass\n',
        solution: `from collections import deque

def row_starts(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        out.append(q[0].val)
        for _ in range(len(q)):
            node = q.popleft()
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return out
`,
        tests: [
          t.eq('row_starts(build_tree([1, 2, 3, None, 4, 5]))', '[1, 2, 4]'),
          t.eq('row_starts(None)', '[]'),
          t.eq('row_starts(build_tree([8]))', '[8]'),
          t.hidden('row_starts(build_tree([1, None, 2, None, 3]))', '[1, 2, 3]'),
          t.hidden('row_starts(build_tree([5, 4, 7, None, None, 6, 9]))', '[5, 4, 6]'),
        ],
        signature: 'gate:tree-row-starts',
      }),
      write({
        id: 'c8-g-graph-a',
        title: 'Can you get there?',
        skills: ['graph_adjacency', 'graph_dfs', 'visited_set'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`graph` is a dict. Each key is a node and its value is the list of nodes it links to. Links go both ways. A node may appear only inside other lists. Return `True` if you can walk from `start` to `goal`, otherwise `False`.\n\n`can_reach(graph={1: [2], 2: [1, 3], 3: [2]}, start=1, goal=3)` → `True`\n\n`can_reach(graph={1: [2], 2: [1], 3: []}, start=1, goal=3)` → `False`',
        starterCode: 'def can_reach(graph, start, goal):\n    pass\n',
        solution: `def can_reach(graph, start, goal):
    seen = {start}
    todo = [start]
    while todo:
        node = todo.pop()
        if node == goal:
            return True
        for nxt in graph.get(node, []):
            if nxt not in seen:
                seen.add(nxt)
                todo.append(nxt)
    return False
`,
        tests: [
          t.eq('can_reach({1: [2], 2: [1, 3], 3: [2]}, 1, 3)', 'True'),
          t.eq('can_reach({1: [2], 2: [1], 3: []}, 1, 3)', 'False'),
          t.eq('can_reach({}, 5, 5)', 'True'),
          t.hidden('can_reach({"a": ["b"], "b": ["a", "c"], "c": ["b", "a"], "d": ["e"]}, "a", "e")', 'False'),
          t.hidden('can_reach({0: [1, 2], 1: [0, 3], 2: [0], 3: [1, 4], 4: [3]}, 2, 4)', 'True'),
          t.hidden('can_reach({0: [1], 1: [0, 2]}, 0, 2)', 'True'),
        ],
        signature: 'gate:graph-can-reach',
      }),
    ],
  },
  // ── Week 9 ────────────────────────────────────────────────────────────────
  {
    id: 'c9-gates',
    title: 'Week 9 checkpoints',
    summary: 'Cold variants: spot a loop in a one-way graph.',
    exercises: [
      write({
        id: 'c9-g-cycle-a',
        title: 'Can every task be finished?',
        skills: ['cycle_detection'],
        ...gate,
        difficulty: 3,
        minutes: 8,
        prompt:
          'There are `n` tasks numbered `0` to `n - 1`. Each pair `[a, b]` in `rules` means task `b` must be done before task `a`. Return `True` if every task can be finished, otherwise `False`.\n\n`can_finish(n=3, rules=[[1, 0], [2, 1]])` → `True`\n\n`can_finish(n=2, rules=[[0, 1], [1, 0]])` → `False` (each waits on the other)',
        starterCode: 'def can_finish(n, rules):\n    pass\n',
        solution: `def can_finish(n, rules):
    graph = {i: [] for i in range(n)}
    for a, b in rules:
        graph[b].append(a)
    state = [0] * n

    def loops(node):
        if state[node] == 1:
            return True
        if state[node] == 2:
            return False
        state[node] = 1
        for nxt in graph[node]:
            if loops(nxt):
                return True
        state[node] = 2
        return False

    return not any(loops(i) for i in range(n))
`,
        tests: [
          t.eq('can_finish(3, [[1, 0], [2, 1]])', 'True'),
          t.eq('can_finish(2, [[0, 1], [1, 0]])', 'False'),
          t.eq('can_finish(4, [[1, 0], [2, 0], [3, 1], [3, 2]])', 'True'),
          t.hidden('can_finish(1, [])', 'True'),
          t.hidden('can_finish(1, [[0, 0]])', 'False'),
          t.hidden('can_finish(5, [[1, 0], [2, 1], [3, 2], [1, 3], [4, 0]])', 'False'),
        ],
        signature: 'gate:can-finish',
      }),
      write({
        id: 'c9-g-cycle-b',
        title: 'Stuck waiting',
        skills: ['cycle_detection'],
        ...gate,
        difficulty: 3,
        minutes: 8,
        prompt:
          '`waits` is a dict. Each key is a job name and its value is the list of jobs it waits for. A job may appear only inside other lists, and then it waits for nothing. Return `True` if some jobs wait on each other in a circle, otherwise `False`.\n\n`stuck(waits={"a": ["b"], "b": ["c"], "c": ["a"]})` → `True`\n\n`stuck(waits={"a": ["b", "c"], "b": ["c"]})` → `False`',
        starterCode: 'def stuck(waits):\n    pass\n',
        solution: `def stuck(waits):
    state = {}

    def circles(job):
        if state.get(job) == 1:
            return True
        if state.get(job) == 2:
            return False
        state[job] = 1
        for nxt in waits.get(job, []):
            if circles(nxt):
                return True
        state[job] = 2
        return False

    return any(circles(job) for job in waits)
`,
        tests: [
          t.eq('stuck({"a": ["b"], "b": ["c"], "c": ["a"]})', 'True'),
          t.eq('stuck({"a": ["b", "c"], "b": ["c"]})', 'False'),
          t.eq('stuck({})', 'False'),
          t.hidden('stuck({"x": ["x"]})', 'True'),
          t.hidden('stuck({"a": ["b"], "c": ["b"], "b": ["d"], "d": []})', 'False'),
          t.hidden('stuck({"a": ["b"], "b": [], "c": ["d"], "d": ["e"], "e": ["c"]})', 'True'),
        ],
        signature: 'gate:jobs-stuck',
      }),
    ],
  },
  // ── Week 10 ───────────────────────────────────────────────────────────────
  {
    id: 'c10-gates',
    title: 'Week 10 checkpoints',
    summary: 'Cold variants: sort the ranges, then join or insert them one at a time.',
    exercises: [
      write({
        id: 'c10-g-interval-a',
        title: 'Join overlapping ranges',
        skills: ['interval_overlap', 'sort_key'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`intervals` is an unsorted list of `[start, end]` ranges. Ranges that overlap or touch join into one. Return the joined ranges sorted by start.\n\n`join_ranges(intervals=[[8, 10], [1, 3], [2, 6]])` → `[[1, 6], [8, 10]]`\n\n`join_ranges(intervals=[[1, 4], [4, 5]])` → `[[1, 5]]` (touching joins)',
        starterCode: 'def join_ranges(intervals):\n    pass\n',
        solution: `def join_ranges(intervals):
    out = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if out and start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out
`,
        tests: [
          t.eq('join_ranges([[8, 10], [1, 3], [2, 6]])', '[[1, 6], [8, 10]]'),
          t.eq('join_ranges([[1, 4], [4, 5]])', '[[1, 5]]'),
          t.eq('join_ranges([[5, 6], [1, 2]])', '[[1, 2], [5, 6]]'),
          t.hidden('join_ranges([])', '[]'),
          t.hidden('join_ranges([[1, 10], [2, 3], [4, 5]])', '[[1, 10]]'),
          t.hidden('join_ranges([[3, 3]])', '[[3, 3]]'),
        ],
        signature: 'gate:join-ranges',
      }),
      write({
        id: 'c10-g-interval-b',
        title: 'Add one range',
        skills: ['interval_insert', 'interval_overlap'],
        ...gate,
        difficulty: 3,
        minutes: 8,
        prompt:
          '`intervals` is a list of `[start, end]` ranges, sorted by start, with no overlaps. Add the range `new` to it. Join any ranges that overlap or touch. Return the sorted result.\n\n`add_range(intervals=[[1, 3], [6, 9]], new=[2, 5])` → `[[1, 5], [6, 9]]`\n\n`add_range(intervals=[], new=[4, 7])` → `[[4, 7]]`',
        starterCode: 'def add_range(intervals, new):\n    pass\n',
        solution: `def add_range(intervals, new):
    out = []
    start, end = new
    i = 0
    while i < len(intervals) and intervals[i][1] < start:
        out.append(intervals[i])
        i += 1
    while i < len(intervals) and intervals[i][0] <= end:
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    out.append([start, end])
    out.extend(intervals[i:])
    return out
`,
        tests: [
          t.eq('add_range([[1, 3], [6, 9]], [2, 5])', '[[1, 5], [6, 9]]'),
          t.eq('add_range([], [4, 7])', '[[4, 7]]'),
          t.eq('add_range([[1, 2], [3, 5], [6, 7], [8, 10]], [4, 8])', '[[1, 2], [3, 10]]'),
          t.hidden('add_range([[5, 6]], [1, 2])', '[[1, 2], [5, 6]]'),
          t.hidden('add_range([[1, 2]], [5, 6])', '[[1, 2], [5, 6]]'),
          t.hidden('add_range([[1, 3], [5, 7]], [3, 5])', '[[1, 7]]'),
        ],
        signature: 'gate:add-range',
      }),
    ],
  },
  // ── Week 11 ───────────────────────────────────────────────────────────────
  {
    id: 'c11-gates',
    title: 'Week 11 checkpoints',
    summary: 'Cold variant: name the state, the start and how each answer builds on earlier ones.',
    exercises: [
      write({
        id: 'c11-g-dp-a',
        title: 'Coins, never two in a row',
        skills: ['recurrence', 'dp_table'],
        ...gate,
        difficulty: 3,
        minutes: 7,
        prompt:
          '`coins` is a list of non-negative coin values lying in a row. You may take any coins, but never two that sit next to each other. Return the largest total you can take.\n\n`best_take(coins=[2, 7, 9, 3, 1])` → `12` (2 + 9 + 1)\n\n`best_take(coins=[])` → `0`',
        starterCode: 'def best_take(coins):\n    pass\n',
        solution: `def best_take(coins):
    skip, take = 0, 0
    for c in coins:
        skip, take = max(skip, take), skip + c
    return max(skip, take)
`,
        tests: [
          t.eq('best_take([2, 7, 9, 3, 1])', '12'),
          t.eq('best_take([])', '0'),
          t.eq('best_take([1, 2, 3, 1])', '4'),
          t.hidden('best_take([5])', '5'),
          t.hidden('best_take([2, 1, 1, 2])', '4'),
          t.hidden('best_take([0, 0, 0])', '0'),
        ],
        signature: 'gate:no-adjacent-max',
      }),
    ],
  },
  // ── Week 12 ───────────────────────────────────────────────────────────────
  {
    id: 'c12-gates',
    title: 'Week 12 checkpoints',
    summary: 'Cold variants: decide whether a best-so-far is enough or every smaller answer is needed.',
    exercises: [
      write({
        id: 'c12-g-dp-greedy-a',
        title: 'Fewest coins',
        skills: ['dp_min_choice', 'recurrence'],
        ...gate,
        difficulty: 3,
        minutes: 8,
        prompt:
          '`coins` is a list of positive coin values. You have as many of each as you like. Return the fewest coins that add up to exactly `amount`. Return `-1` if it cannot be done.\n\n`fewest_coins(coins=[1, 3, 4], amount=6)` → `2` (3 + 3)\n\n`fewest_coins(coins=[2], amount=3)` → `-1`',
        starterCode: 'def fewest_coins(coins, amount):\n    pass\n',
        solution: `def fewest_coins(coins, amount):
    best = [0] + [float('inf')] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and best[a - c] + 1 < best[a]:
                best[a] = best[a - c] + 1
    return best[amount] if best[amount] != float('inf') else -1
`,
        tests: [
          t.eq('fewest_coins([1, 3, 4], 6)', '2'),
          t.eq('fewest_coins([2], 3)', '-1'),
          t.eq('fewest_coins([1, 5, 10], 18)', '5'),
          t.hidden('fewest_coins([7], 0)', '0'),
          t.hidden('fewest_coins([5, 2], 11)', '4'),
          t.hidden('fewest_coins([3, 7], 5)', '-1'),
        ],
        signature: 'gate:fewest-coins',
      }),
      write({
        id: 'c12-g-dp-greedy-b',
        title: 'Best run of changes',
        skills: ['kadane', 'state_tracking'],
        ...gate,
        difficulty: 3,
        minutes: 6,
        prompt:
          '`changes` is a non-empty list of daily gains and losses. A run is one or more days in a row. Return the largest total of any run.\n\n`best_run(changes=[-2, 3, -1, 4, -5])` → `6` (3, -1, 4)\n\n`best_run(changes=[-3, -1, -2])` → `-1` (the run must hold a day)',
        starterCode: 'def best_run(changes):\n    pass\n',
        solution: `def best_run(changes):
    current = best = changes[0]
    for x in changes[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best
`,
        tests: [
          t.eq('best_run([-2, 3, -1, 4, -5])', '6'),
          t.eq('best_run([-3, -1, -2])', '-1'),
          t.eq('best_run([5])', '5'),
          t.hidden('best_run([1, 2, 3])', '6'),
          t.hidden('best_run([4, -10, 3, 3])', '6'),
          t.hidden('best_run([0, -1, 0])', '0'),
        ],
        signature: 'gate:best-run',
      }),
      write({
        id: 'c12-g-dp-greedy-c',
        title: 'Hop to the last stone',
        skills: ['greedy_reach', 'state_tracking'],
        ...gate,
        difficulty: 3,
        minutes: 6,
        prompt:
          '`hops` is a non-empty list. From position `i` you can move forward by up to `hops[i]` places. You start at position 0. Return `True` if you can reach the last position, otherwise `False`.\n\n`reach_last(hops=[2, 3, 1, 1, 4])` → `True`\n\n`reach_last(hops=[3, 2, 1, 0, 4])` → `False` (every path stops at the 0)',
        starterCode: 'def reach_last(hops):\n    pass\n',
        solution: `def reach_last(hops):
    farthest = 0
    for i, h in enumerate(hops):
        if i > farthest:
            return False
        farthest = max(farthest, i + h)
    return True
`,
        tests: [
          t.eq('reach_last([2, 3, 1, 1, 4])', 'True'),
          t.eq('reach_last([3, 2, 1, 0, 4])', 'False'),
          t.eq('reach_last([0])', 'True'),
          t.hidden('reach_last([0, 1])', 'False'),
          t.hidden('reach_last([1, 0, 1])', 'False'),
          t.hidden('reach_last([5, 0, 0, 0, 0, 0])', 'True'),
        ],
        signature: 'gate:reach-last',
      }),
    ],
  },
]
