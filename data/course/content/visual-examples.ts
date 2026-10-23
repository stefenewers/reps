import type { WorkedExample } from '@/data/course/types'
import type { TestCase } from '@/lib/types'
import { t } from '@/data/exercises/build'

export interface VisualWorkedExample extends WorkedExample {
  skills: string[]
  starterCode: string
  tests: TestCase[]
}
export const visualWorkedExamples: VisualWorkedExample[] = [
  {
    id: 'we-pair',
    title: 'Find a pair in sorted numbers',
    unitId: 'w3-two-pointers',
    demoId: 'two-pointers',
    skills: ['two_pointer', 'pointer_update'],
    problem:
      'Write `pair_positions(nums, target)` for an ascending list of integers. Return the zero-based indexes of any two distinct values that add to target, or `[]` if none do. Use constant extra space.',
    manualReasoning: [
      'For [1, 3, 5, 8] and target 8, try 1 + 8 = 9: the largest value is too large even with the smallest partner.',
      'Discard 8. Now 1 + 5 = 6 is too small even with the largest remaining partner.',
      'Discard 1. The remaining pair 3 + 5 = 8 gives indexes [1, 2].'
    ],
    subgoals: [
      { title: 'Keep the possible region', explanation: 'Put one index at each end of the sorted list.' },
      { title: 'Choose a safe discard', explanation: 'A small total rules out the left value; a large total rules out the right value.' },
      {
        title: 'Stop without reusing a value',
        explanation: 'Only compare while left is strictly smaller than right. Return an empty list when the region closes.'
      }
    ],
    starterCode: 'def pair_positions(nums, target):\n    pass\n',
    solution:
      'def pair_positions(nums, target):\n    left, right = 0, len(nums) - 1\n    while left < right:\n        total = nums[left] + nums[right]\n        if total == target:\n            return [left, right]\n        if total < target:\n            left += 1\n        else:\n            right -= 1\n    return []',
    reconstructionExerciseId: 'c3-rebuild-pair',
    tests: [
      t.eq('pair_positions([1, 3, 5, 8], 8)', '[1, 2]'),
      t.eq('pair_positions([], 0)', '[]'),
      t.hidden('pair_positions([2], 4)', '[]'),
      t.hidden('pair_positions([2, 2], 4)', '[0, 1]'),
      t.hidden('pair_positions([1, 4, 9], 6)', '[]')
    ]
  },
  {
    id: 'we-window',
    title: 'Remember a window total',
    unitId: 'w4-windows',
    demoId: 'sliding-window',
    skills: ['sliding_window', 'window_state'],
    problem:
      'Write `longest_within(nums, limit)` for a list of nonnegative integers and a nonnegative limit. Return the length of the longest consecutive part whose sum is at most limit. An empty list returns 0.',
    manualReasoning: [
      'For [2, 1, 4, 1] and limit 5, [2, 1] has length 2 and total 3.',
      'Adding 4 makes total 7. Remove 2 from the left to get total 5.',
      'Adding 1 makes total 6. Remove the outgoing 1; [4, 1] is valid with length 2.'
    ],
    subgoals: [
      { title: 'Enter and remember', explanation: 'Add the incoming value to total.' },
      {
        title: 'Repair until valid',
        explanation: 'While total exceeds the limit, subtract the outgoing value and move left. Nonnegative inputs make this safe.'
      },
      { title: 'Measure the valid region', explanation: 'After repair, right - left + 1 is a candidate length.' }
    ],
    starterCode: 'def longest_within(nums, limit):\n    pass\n',
    solution:
      'def longest_within(nums, limit):\n    left = total = best = 0\n    for right, value in enumerate(nums):\n        total += value\n        while total > limit:\n            total -= nums[left]\n            left += 1\n        best = max(best, right - left + 1)\n    return best',
    reconstructionExerciseId: 'c4-rebuild-window',
    tests: [
      t.eq('longest_within([2, 1, 4, 1], 5)', '2'),
      t.eq('longest_within([], 5)', '0'),
      t.hidden('longest_within([0, 0, 0], 0)', '3'),
      t.hidden('longest_within([8, 9], 2)', '0'),
      t.hidden('longest_within([1, 1, 1, 1], 3)', '3')
    ]
  },
  {
    id: 'we-search',
    title: 'Keep the answer inside the search region',
    unitId: 'w5-binary-search',
    demoId: 'binary-search',
    skills: ['binary_search', 'search_invariant'],
    problem:
      'Write `locate(nums, target)` for an ascending list of distinct integers. Return the index of target, or -1 if it is absent. Halve the remaining search region after each mismatch.',
    manualReasoning: [
      'In [1, 3, 5, 7, 9], target 7 is larger than the middle value 5.',
      'Everything at or before that middle is too small. Only indexes 3 through 4 remain.',
      'The new middle is index 3, whose value is 7.'
    ],
    subgoals: [
      { title: 'Define an inclusive region', explanation: 'The answer, if present, lies between lo and hi, including both ends.' },
      { title: 'Compare at the middle', explanation: 'A mismatch discards mid too, so use mid + 1 or mid - 1.' },
      { title: 'Recognize an empty region', explanation: 'lo > hi proves absence.' }
    ],
    starterCode: 'def locate(nums, target):\n    pass\n',
    solution:
      'def locate(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1',
    reconstructionExerciseId: 'c5-rebuild-search',
    tests: [
      t.eq('locate([1, 3, 5, 7, 9], 7)', '3'),
      t.eq('locate([], 1)', '-1'),
      t.hidden('locate([4], 4)', '0'),
      t.hidden('locate([1, 2, 3], 4)', '-1'),
      t.hidden('locate([1, 2, 3], 1)', '0')
    ]
  },
  {
    id: 'we-rewire',
    title: 'Reverse references without losing the chain',
    unitId: 'w5-linked-lists',
    demoId: 'linked-list',
    skills: ['linked_list_reassignment', 'linked_list_traversal'],
    problem:
      'Write `reverse_chain(head)`. The head is a ListNode with `.val` and `.next`, or None. Reverse the existing links in place and return the new head. Do not create replacement nodes. `build_list` and `list_to_array` in the tests build and inspect a chain.',
    manualReasoning: [
      'For 4 → 7 → 2 → None, first save the node holding 7.',
      'Point 4.next at None, then move prev to 4 and curr to the saved 7.',
      'Save 2, point 7.next at 4, and repeat. The last processed node becomes the head.'
    ],
    subgoals: [
      { title: 'Save the unprocessed chain', explanation: 'Keep curr.next before changing it.' },
      { title: 'Attach to the reversed prefix', explanation: 'Change curr.next to prev.' },
      { title: 'Advance both names', explanation: 'prev becomes curr; curr becomes the saved next node.' }
    ],
    starterCode: 'def reverse_chain(head):\n    pass\n',
    solution:
      'def reverse_chain(head):\n    prev, curr = None, head\n    while curr is not None:\n        next_node = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_node\n    return prev',
    reconstructionExerciseId: 'c5-rebuild-rewire',
    tests: [
      t.eq('list_to_array(reverse_chain(build_list([4, 7, 2])))', '[2, 7, 4]'),
      t.eq('reverse_chain(None)', 'None'),
      t.hidden('list_to_array(reverse_chain(build_list([9])))', '[9]'),
      t.check(
        'uses the original nodes',
        'head = build_list([1, 2, 3])\ntail = head.next.next\nassert reverse_chain(head) is tail\nassert tail.next.next is head\nassert head.next is None'
      )
    ]
  },
  {
    id: 'we-call-stack',
    title: 'A caller waits for a return value',
    unitId: 'w6-recursion',
    demoId: 'recursion',
    skills: ['recursion_base_case', 'recursion_return'],
    problem: 'Write `sum_to(n)` for a nonnegative integer n. Return 1 + 2 + ... + n using recursion. For n = 0 return 0.',
    manualReasoning: [
      'sum_to(3) leaves 3 waiting and asks for sum_to(2).',
      'sum_to(2) asks for sum_to(1); sum_to(1) asks for sum_to(0).',
      'Zero returns 0. The waiting frames return 1, then 3, then 6.'
    ],
    subgoals: [
      { title: 'State the promise', explanation: 'Each call returns the sum through its own n.' },
      { title: 'Stop at the empty sum', explanation: 'Returning 0 for n = 0 gives the first finished answer.' },
      { title: 'Use the child answer', explanation: 'Return n plus the result of the smaller call.' }
    ],
    starterCode: 'def sum_to(n):\n    pass\n',
    solution: 'def sum_to(n):\n    if n == 0:\n        return 0\n    return n + sum_to(n - 1)',
    reconstructionExerciseId: 'c6-rebuild-recursion',
    tests: [t.eq('sum_to(3)', '6'), t.eq('sum_to(0)', '0'), t.hidden('sum_to(1)', '1'), t.hidden('sum_to(8)', '36')]
  },
  {
    id: 'we-subtree',
    title: 'Combine two subtree answers',
    unitId: 'w7-trees',
    demoId: 'trees',
    skills: ['tree_dfs', 'recursion_return'],
    problem:
      'Write `height(root)` for a binary tree. Each TreeNode has `.val`, `.left` and `.right`. Return the number of nodes on its longest root-to-leaf path. An empty tree has height 0. `build_tree` in the tests builds a tree from values listed level by level, with None for missing nodes.',
    manualReasoning: [
      'A missing child has height 0. A leaf has height 1.',
      'For a node with child heights 2 and 1, the longer route below it uses 2 nodes.',
      'Count this node as well: its height is 1 + max(2, 1) = 3.'
    ],
    subgoals: [
      { title: 'Give every call the same promise', explanation: 'Return the height of the subtree rooted at this node.' },
      { title: 'Ask each child', explanation: 'Left and right calls own different subtrees and return their heights.' },
      { title: 'Combine once', explanation: 'Choose the larger child answer, then add this node.' }
    ],
    starterCode: 'def height(root):\n    pass\n',
    solution:
      'def height(root):\n    if root is None:\n        return 0\n    left = height(root.left)\n    right = height(root.right)\n    return 1 + max(left, right)',
    reconstructionExerciseId: 'c7-rebuild-tree',
    tests: [
      t.eq('height(build_tree([8, 3, 10, 1, 6]))', '3'),
      t.eq('height(None)', '0'),
      t.hidden('height(build_tree([1]))', '1'),
      t.hidden('height(build_tree([1, None, 2, None, 3]))', '3')
    ]
  },
  {
    id: 'we-levels',
    title: 'Keep one queue level separate from the next',
    unitId: 'w8-queue-bfs',
    demoId: 'trees',
    skills: ['queue_deque', 'bfs_levels'],
    problem:
      'Write `levels(root)` for a binary tree of TreeNodes with `.val`, `.left` and `.right`. Return one list of values per level, left to right. Return [] for an empty tree. `build_tree` in the tests accepts values in level order, with None for gaps.',
    manualReasoning: [
      'Start with only the root in the queue: that is level 0.',
      'Snapshot the queue length. Remove exactly that many nodes, collecting their values and appending their children.',
      'The children now in the queue form the next level. Repeat until the queue is empty.'
    ],
    subgoals: [
      { title: 'Initialize the frontier', explanation: 'A deque holds discovered nodes in arrival order.' },
      { title: 'Snapshot a level', explanation: 'len(queue) before processing is the number of nodes in this level, not the next.' },
      { title: 'Return grouped values', explanation: 'Append each finished level as its own list.' }
    ],
    starterCode: 'def levels(root):\n    pass\n',
    solution:
      'from collections import deque\n\ndef levels(root):\n    if root is None:\n        return []\n    queue, result = deque([root]), []\n    while queue:\n        row = []\n        for _ in range(len(queue)):\n            node = queue.popleft()\n            row.append(node.val)\n            if node.left is not None:\n                queue.append(node.left)\n            if node.right is not None:\n                queue.append(node.right)\n        result.append(row)\n    return result',
    reconstructionExerciseId: 'c8-rebuild-bfs',
    tests: [
      t.eq('levels(build_tree([1, 2, 3, 4, 5]))', '[[1], [2, 3], [4, 5]]'),
      t.eq('levels(None)', '[]'),
      t.hidden('levels(build_tree([9]))', '[[9]]'),
      t.hidden('levels(build_tree([1, None, 2, 3]))', '[[1], [2], [3]]')
    ]
  },
  {
    id: 'we-reachable',
    title: 'Visit each reachable node once',
    unitId: 'w8-graphs',
    demoId: 'graphs',
    skills: ['graph_adjacency', 'graph_dfs', 'visited_set'],
    problem:
      'Write `reachable_count(adj, start)`. adj is a dictionary mapping every integer node to its list of neighbors; every neighbor is also a key. Edges may be directed. Return how many distinct nodes are reachable from start, including start. Return 0 when start is not a key.',
    manualReasoning: [
      'In {0: [1, 2], 1: [2], 2: [0]}, begin with node 0 marked.',
      'Discover 1 and 2 and put them on the frontier.',
      'Edges back to 0 or to an already discovered 2 add no work. Three distinct nodes are reachable.'
    ],
    subgoals: [
      { title: 'Name nodes and relationships', explanation: 'Dictionary keys are nodes and each neighbor entry is an edge.' },
      { title: 'Remember discovery', explanation: 'Mark when adding a node to the frontier so cycles cannot add it repeatedly.' },
      { title: 'Process the frontier', explanation: 'Pop a node, inspect its neighbors, and stop when no work remains.' }
    ],
    starterCode: 'def reachable_count(adj, start):\n    pass\n',
    solution:
      'def reachable_count(adj, start):\n    if start not in adj:\n        return 0\n    visited, stack = {start}, [start]\n    while stack:\n        node = stack.pop()\n        for neighbor in adj[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                stack.append(neighbor)\n    return len(visited)',
    reconstructionExerciseId: 'c8-rebuild-graph',
    tests: [
      t.eq('reachable_count({0: [1, 2], 1: [2], 2: [0]}, 0)', '3'),
      t.eq('reachable_count({}, 0)', '0'),
      t.hidden('reachable_count({0: [], 1: []}, 0)', '1'),
      t.hidden('reachable_count({0: [1], 1: [2], 2: [], 3: []}, 1)', '2')
    ]
  },
  {
    id: 'we-decisions',
    title: 'Build subsets and undo each choice',
    unitId: 'w11-backtracking',
    demoId: 'backtracking',
    skills: ['backtracking_state', 'recursion_base_case'],
    problem:
      'Write `subsets(nums)` for a list of distinct integers. Return all subsets as lists. Explore the include branch before the skip branch for each value; keep values in their original order inside each subset. The empty input returns [[]].',
    manualReasoning: [
      'For [2, 5], choose 2 and then 5: save [2, 5].',
      'Undo 5 and skip it: save [2]. Then undo 2.',
      'In the branch that skips 2, save [5] and finally [].'
    ],
    subgoals: [
      { title: 'Give each call one decision', explanation: 'Index i identifies the next value to include or skip.' },
      { title: 'Copy completed paths', explanation: 'At the end, save a copy so later mutations do not change earlier answers.' },
      { title: 'Undo before the sibling branch', explanation: 'Pop the included value before exploring the branch that skips it.' }
    ],
    starterCode: 'def subsets(nums):\n    pass\n',
    solution:
      'def subsets(nums):\n    answers, path = [], []\n    def explore(i):\n        if i == len(nums):\n            answers.append(path.copy())\n            return\n        path.append(nums[i])\n        explore(i + 1)\n        path.pop()\n        explore(i + 1)\n    explore(0)\n    return answers',
    reconstructionExerciseId: 'c11-rebuild-backtracking',
    tests: [
      t.eq('subsets([2, 5])', '[[2, 5], [2], [5], []]'),
      t.eq('subsets([])', '[[]]'),
      t.hidden('subsets([9])', '[[9], []]'),
      t.hidden('len(subsets([1, 2, 3, 4]))', '16')
    ]
  },
  {
    id: 'we-states',
    title: 'Turn repeated stair questions into a table',
    unitId: 'w11-dp',
    demoId: 'dynamic-programming',
    skills: ['recurrence', 'dp_table', 'memoization'],
    problem:
      'Write `climb_ways(n)` for a nonnegative integer n. Return how many ordered sequences of 1-step and 2-step moves climb exactly n steps. There is one way to climb zero steps: take no moves.',
    manualReasoning: [
      'To finish 3 steps, the last move is either 1 or 2.',
      'A last move of 1 follows any way to finish 2 steps; a last move of 2 follows any way to finish 1 step.',
      'The answers for 0, 1, 2, 3 steps are 1, 1, 2, 3. Each later answer adds the previous two.'
    ],
    subgoals: [
      { title: 'Define the state', explanation: 'dp[k] counts sequences that finish exactly k steps.' },
      { title: 'Set the base cases', explanation: 'dp[0] and dp[1] are both 1.' },
      { title: 'Fill in dependency order', explanation: 'Increasing k ensures dp[k - 1] and dp[k - 2] already exist.' }
    ],
    starterCode: 'def climb_ways(n):\n    pass\n',
    solution:
      'def climb_ways(n):\n    if n <= 1:\n        return 1\n    dp = [0] * (n + 1)\n    dp[0] = dp[1] = 1\n    for k in range(2, n + 1):\n        dp[k] = dp[k - 1] + dp[k - 2]\n    return dp[n]',
    reconstructionExerciseId: 'c11-rebuild-dp',
    tests: [
      t.eq('climb_ways(3)', '3'),
      t.eq('climb_ways(0)', '1'),
      t.hidden('climb_ways(1)', '1'),
      t.hidden('climb_ways(5)', '8'),
      t.hidden('climb_ways(8)', '34')
    ]
  }
]
