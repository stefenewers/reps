import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { debug, output, write, t } from '@/data/exercises/build'

const combine = { stage: 'combine' as const, repType: 'combine' as const }
const pattern = { stage: 'pattern' as const, repType: 'pattern' as const, important: true }

const MODULE = '2026-10-06'

/** The BST used across the BST reps:  8 / (3: 1, (6: 4, 7)) / (10: -, 14) */
const BST = 'build_tree([8, 3, 10, 1, 6, None, 14, None, None, 4, 7])'
const BST_PICTURE = '```python\n#        8\n#      /   \\\n#     3     10\n#    / \\      \\\n#   1   6      14\n#      / \\\n#     4   7\n```'

const SAME_SHAPE = `def same_shape(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return same_shape(a.left, b.left) and same_shape(a.right, b.right)
`

// ── LC 572 · Subtree of Another Tree ─────────────────────────────────────────
const br572: PackSection = {
  id: 'br-572',
  module: MODULE,
  title: 'Toward Subtree of Another Tree',
  summary: 'Try every node as a possible root: a DFS that calls a pair-comparison helper at each node.',
  exercises: [
    write({
      id: 'b572-count-starts',
      title: 'Count the nodes where a shape starts',
      style: 'finish',
      skills: ['tree_dfs', 'recursion_return', 'recursion_base_case'],
      prompt:
        '`root` and `shape` are the roots of two binary trees (`root` can be `None`: an empty tree has no nodes). `same_shape(a, b)` is given: it says whether two trees have exactly the same shape (values ignored).\n\nWrite `count_shape(root, shape)`: how many nodes of `root` have a subtree (that node and **everything** below it) with the same shape as `shape`? `shape` is never empty.\n\nExample: in `[1, 2, 3, 4, 5, 6, 7]` the shape `[0, 0, 0]` (a node with two leaf children) starts at node 2 and at node 3, so the answer is `2`.',
      starterCode: `${SAME_SHAPE}

def count_shape(root, shape):
    pass
`,
      solution: `${SAME_SHAPE}

def count_shape(root, shape):
    if root is None:
        return 0
    here = 1 if same_shape(root, shape) else 0
    return here + count_shape(root.left, shape) + count_shape(root.right, shape)
`,
      tests: [
        t.eq('count_shape(build_tree([1, 2, 3, 4, 5, 6, 7]), build_tree([0, 0, 0]))', '2'),
        t.eq('count_shape(build_tree([1, 2, 3]), build_tree([9]))', '2'),
        t.hidden('count_shape(None, build_tree([0]))', '0'),
        t.hidden('count_shape(TreeNode(1), TreeNode(5))', '1'),
        t.hidden('count_shape(build_tree([1, 2]), build_tree([0, None, 0]))', '0'),
        t.hidden('count_shape(build_tree([1, 2, None, 3, None, 4]), build_tree([0, 0]))', '1'),
      ],
      note: 'Two recursions with two jobs:\n- the **helper** walks a pair of trees in lockstep\n- the **outer** DFS visits every node and asks the helper "does it start here?"',
      hints: [
        'This is a plain counting DFS. The only new part is what "this node counts" means.',
        'An empty `root` has no nodes, so it contributes 0.',
        'This node contributes 1 when the helper says yes for `(root, shape)`. Then add what the left and right subtrees count.',
      ],
      explanation: 'The outer function never compares children itself. It asks the helper one question per node and adds up the answers from the whole tree.',
      signature: 'dfs:helper-at-every-node-count',
      minutes: 5,
    }),
    debug({
      id: 'b572-dbg-two-levels',
      title: 'Debug: the shape is deeper down',
      skills: ['tree_dfs', 'recursion_return', 'recursion_base_case'],
      prompt:
        '`has_shape(root, shape)` should return `True` when **any** node of `root`, however deep, has a subtree with the same shape as `shape`. It misses some trees. Fix it.',
      brokenCode: `${SAME_SHAPE}

def has_shape(root, shape):
    if root is None:
        return False
    return same_shape(root, shape) or same_shape(root.left, shape) or same_shape(root.right, shape)
`,
      solution: `${SAME_SHAPE}

def has_shape(root, shape):
    if root is None:
        return False
    return same_shape(root, shape) or has_shape(root.left, shape) or has_shape(root.right, shape)
`,
      tests: [
        t.eq('has_shape(build_tree([1, 2, 3]), build_tree([0, 0, 0]))', 'True'),
        t.eq('has_shape(build_tree([1, 2, 3, 4, None, None, None, 5, 6]), build_tree([0, 0, 0]))', 'True'),
        t.eq('has_shape(build_tree([1, 2]), build_tree([0, None, 0]))', 'False'),
        t.hidden('has_shape(None, build_tree([0]))', 'False'),
        t.hidden('has_shape(build_tree([1, None, 2, None, 3, None, 4, 5]), build_tree([0, 0]))', 'True'),
        t.hidden('has_shape(TreeNode(1), TreeNode(2))', 'True'),
      ],
      hints: [
        'In the failing test, at which depth does the matching node sit? Which nodes does the code ever hand to the helper?',
        'Which function knows how to look at **every** node below `root.left`?',
      ],
      explanation: 'Calling the helper on the children only tests three starting points. Recursing with the outer function tests every node, because each call repeats the same question one level down.',
      signature: 'debug:helper-instead-of-recursing',
      minutes: 4,
    }),
    write({
      id: 'b572-mirror-inside',
      title: 'A mirror image somewhere inside',
      ...pattern,
      difficulty: 3,
      skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
      transfer: true,
      prompt:
        '`root` and `other` are the roots of two binary trees; either can be `None`.\n\nWrite `has_mirror_of(root, other)`: `True` if some node of `root` has a subtree (that node and everything below it) that is the **mirror image** of `other`: same values, left and right swapped at every level.\n\nExample: `root = [1, 2, 3, None, None, 5, 4]`, `other = [3, 4, 5]` → `True` (the subtree at node 3 is `[3, 5, 4]`).\n\nAn empty `other` is the mirror of an empty subtree, and every tree has one of those.',
      starterCode: `def has_mirror_of(root, other):
    pass
`,
      solution: `def is_mirror(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    if a.val != b.val:
        return False
    return is_mirror(a.left, b.right) and is_mirror(a.right, b.left)


def has_mirror_of(root, other):
    if is_mirror(root, other):
        return True
    if root is None:
        return False
    return has_mirror_of(root.left, other) or has_mirror_of(root.right, other)
`,
      tests: [
        t.eq('has_mirror_of(build_tree([1, 2, 3, None, None, 5, 4]), build_tree([3, 4, 5]))', 'True'),
        t.eq('has_mirror_of(build_tree([1, 2, 3, None, None, 5, 4]), build_tree([3, 5, 4]))', 'False'),
        t.eq('has_mirror_of(build_tree([1, 2, 3]), build_tree([1, 3, 2]))', 'True'),
        t.hidden('has_mirror_of(None, None)', 'True'),
        t.hidden('has_mirror_of(None, TreeNode(1))', 'False'),
        t.hidden('has_mirror_of(build_tree([1, 2]), None)', 'True'),
        t.hidden('has_mirror_of(build_tree([1, 2, 3, None, None, 5, 4]), build_tree([3, 4]))', 'False'),
        t.hidden('has_mirror_of(build_tree([7, 7, None, 7]), build_tree([7, None, 7]))', 'True'),
        t.hidden('has_mirror_of(build_tree([4, 1, 2, 9]), TreeNode(9))', 'True'),
      ],
      hints: [
        'Two functions: one compares a pair of trees, the other decides where to start comparing.',
        'The pair helper has the usual base cases: both None, exactly one None, then values. Which children line up in a mirror?',
        'The outer function: does it match starting here? If not, and there is a node here, try the left subtree, then the right.',
        'Ask the helper **before** the `root is None` check, or an empty `other` is never matched.',
      ],
      explanation: 'A match must cover a whole subtree, so the helper compares all the way down to the Nones. The outer DFS only chooses the starting node, and stops at the first one that works.',
      signature: 'dfs:helper-at-every-node-mirror',
      minutes: 10,
    }),
  ],
}

// ── LC 235 · Lowest Common Ancestor of a BST ─────────────────────────────────
const br235: PackSection = {
  id: 'br-235',
  module: MODULE,
  title: 'Toward Lowest Common Ancestor of a BST',
  summary: 'In a search tree every node tells you which way to go: walk one path, and notice where two values part ways.',
  exercises: [
    write({
      id: 'b235-bst-has',
      title: 'Search a BST, one way only',
      skills: ['bst_property', 'while_loop', 'treenode'],
      prompt:
        `A **binary search tree** (BST) keeps everything smaller than a node in its left subtree and everything bigger in its right subtree.\n\n${BST_PICTURE}\n\nWrite \`bst_has(root, x)\`: \`True\` if \`x\` is in the BST. Walk down **one** path with a loop: at each node go left or right, never both.\n\nExample: looking for \`7\` visits 8, 3, 6, 7 → \`True\`.`,
      starterCode: `def bst_has(root, x):
    pass
`,
      solution: `def bst_has(root, x):
    node = root
    while node:
        if x == node.val:
            return True
        if x < node.val:
            node = node.left
        else:
            node = node.right
    return False
`,
      tests: [
        t.eq(`bst_has(${BST}, 7)`, 'True'),
        t.eq(`bst_has(${BST}, 5)`, 'False'),
        t.eq(`bst_has(${BST}, 8)`, 'True'),
        t.hidden('bst_has(None, 1)', 'False'),
        t.hidden('bst_has(TreeNode(2), 2)', 'True'),
        t.hidden(`bst_has(${BST}, 14)`, 'True'),
        t.hidden('bst_has(build_tree([0, -5, 3]), -5)', 'True'),
        t.hidden('bst_has(build_tree([0, -5, 3]), -6)', 'False'),
      ],
      note: 'Walking a BST looks like walking a linked list, except the next step is chosen:\nnode = node.left   # x is smaller\nnode = node.right  # x is bigger',
      hints: [
        'You wrote `has(root, x)` for an unsorted tree by checking both sides. Here one comparison rules a whole side out.',
        'Keep one variable `node`, starting at the root, and loop while it is not None.',
        'Equal: found. Smaller than `node.val`: step left. Otherwise: step right. Falling off the tree means it is not there.',
      ],
      explanation: 'Each comparison throws away one whole subtree, so the walk costs O(height) instead of O(n).',
      signature: 'bst:search-one-way',
      minutes: 6,
    }),
    write({
      id: 'b235-floor',
      title: 'The biggest value that is not above x',
      skills: ['bst_property', 'while_loop', 'state_tracking'],
      prompt:
        `Write \`floor_in_bst(root, x)\`: the **largest** value in the BST that is \`<= x\`, or \`None\` if every value is bigger than \`x\`.\n\n${BST_PICTURE}\n\nExample: \`x = 5\` → \`4\`. The walk is 8 (too big, go left), 3 (fits, remember it, look for something bigger on the right), 6 (too big, go left), 4 (fits, remember it), then off the tree.`,
      starterCode: `def floor_in_bst(root, x):
    pass
`,
      solution: `def floor_in_bst(root, x):
    best = None
    node = root
    while node:
        if node.val == x:
            return x
        if node.val < x:
            best = node.val
            node = node.right
        else:
            node = node.left
    return best
`,
      tests: [
        t.eq(`floor_in_bst(${BST}, 5)`, '4'),
        t.eq(`floor_in_bst(${BST}, 9)`, '8'),
        t.eq(`floor_in_bst(${BST}, 0)`, 'None'),
        t.hidden(`floor_in_bst(${BST}, 14)`, '14'),
        t.hidden(`floor_in_bst(${BST}, 100)`, '14'),
        t.hidden('floor_in_bst(None, 3)', 'None'),
        t.hidden('floor_in_bst(TreeNode(2), 2)', '2'),
        t.hidden('floor_in_bst(build_tree([0, -5, 3]), -1)', '-5'),
      ],
      hints: [
        'Same one-way walk as a search, plus one variable that remembers the best candidate so far.',
        'A node whose value is not above `x` is a candidate. Anything better than it can only be on one side. Which?',
        'A node that is too big is not a candidate, and neither is anything to its right.',
      ],
      explanation: 'Each later candidate is found to the right of the previous one, so it is always bigger: the last one remembered is the answer.',
      signature: 'bst:floor-walk',
      minutes: 7,
    }),
    debug({
      id: 'b235-dbg-or',
      title: 'Debug: the first node between two values',
      skills: ['bst_property', 'conditionals', 'while_loop'],
      prompt:
        `\`first_between(root, a, b)\` walks down a BST from the root and should return the value of the **first** node it meets that lies between \`a\` and \`b\` (inclusive, and \`a\`, \`b\` can come in either order). While both numbers are on the same side of the node, it follows them. If it falls off the tree, it returns \`None\`.\n\n${BST_PICTURE}\n\nExample: \`first_between(root, 4, 7)\` → \`6\`. Fix it.`,
      brokenCode: `def first_between(root, a, b):
    node = root
    while node:
        if a < node.val or b < node.val:
            node = node.left
        elif a > node.val or b > node.val:
            node = node.right
        else:
            return node.val
    return None
`,
      solution: `def first_between(root, a, b):
    node = root
    while node:
        if a < node.val and b < node.val:
            node = node.left
        elif a > node.val and b > node.val:
            node = node.right
        else:
            return node.val
    return None
`,
      tests: [
        t.eq(`first_between(${BST}, 4, 7)`, '6'),
        t.eq(`first_between(${BST}, 1, 14)`, '8'),
        t.eq(`first_between(${BST}, 11, 13)`, 'None'),
        t.hidden(`first_between(${BST}, 7, 4)`, '6'),
        t.hidden(`first_between(${BST}, 3, 3)`, '3'),
        t.hidden(`first_between(${BST}, 1, 6)`, '3'),
        t.hidden('first_between(None, 1, 2)', 'None'),
        t.hidden('first_between(build_tree([0, -5, 3]), -9, -2)', '-5'),
      ],
      hints: [
        'Trace `(4, 7)` by hand: 8, then 3, then 6. What does the code do at 6?',
        'When is it safe to leave a node behind and go left? What must be true of **both** numbers?',
      ],
      explanation: 'You may only step left when both numbers are smaller, and right when both are bigger. If neither is true the two numbers are on different sides of the node (or one of them is the node): that is the split point.',
      signature: 'debug:bst-split-or-vs-and',
      minutes: 4,
    }),
    write({
      id: 'b235-shared-steps',
      title: 'How long do two searches travel together?',
      ...pattern,
      difficulty: 3,
      skills: ['bst_property', 'while_loop', 'conditionals'],
      transfer: true,
      prompt:
        `\`root\` is the root of a BST: at every node, smaller values are in its left subtree and bigger values in its right. \`a\` and \`b\` are two values that are both in it (they can be equal). Searching for each one starts at the root, and for a while the two searches visit the same nodes.\n\nWrite \`shared_steps(root, a, b)\`: how many nodes do the two search paths have **in common**?\n\n${BST_PICTURE}\n\nExample: \`a = 4\`, \`b = 7\` → \`3\` (both searches visit 8, 3, 6, then part ways). \`a = 1\`, \`b = 14\` → \`1\` (they part at the root).`,
      starterCode: `def shared_steps(root, a, b):
    pass
`,
      solution: `def shared_steps(root, a, b):
    steps = 0
    node = root
    while node:
        steps += 1
        if a < node.val and b < node.val:
            node = node.left
        elif a > node.val and b > node.val:
            node = node.right
        else:
            break
    return steps
`,
      tests: [
        t.eq(`shared_steps(${BST}, 4, 7)`, '3'),
        t.eq(`shared_steps(${BST}, 1, 14)`, '1'),
        t.eq(`shared_steps(${BST}, 4, 6)`, '3'),
        t.hidden(`shared_steps(${BST}, 7, 4)`, '3'),
        t.hidden(`shared_steps(${BST}, 14, 14)`, '3'),
        t.hidden(`shared_steps(${BST}, 1, 7)`, '2'),
        t.hidden('shared_steps(TreeNode(5), 5, 5)', '1'),
        t.hidden('shared_steps(build_tree([0, -5, 3, -8]), -8, -5)', '2'),
      ],
      hints: ['The two searches stay together exactly as long as they make the same choice at each node.'],
      explanation: 'Both searches go the same way while both values are on the same side. The first node where that stops being true is the last one they share: the lowest node that has both values beneath it (or is one of them).',
      signature: 'bst:split-point-count',
      minutes: 8,
    }),
  ],
}

// ── LC 98 · Validate Binary Search Tree ──────────────────────────────────────
const br98: PackSection = {
  id: 'br-98',
  module: MODULE,
  title: 'Toward Validate Binary Search Tree',
  summary: 'The BST rule is about whole subtrees, so carry a low and a high bound down and tighten one of them at every step.',
  exercises: [
    write({
      id: 'b98-all-between',
      title: 'Is every value inside the bounds?',
      skills: ['bst_property', 'tree_dfs', 'recursion_return'],
      prompt:
        'Write `all_between(root, low, high)`: `True` if **every** value in the tree is strictly between `low` and `high`. Any tree, not just a BST. An empty tree is fine.\n\nExample: `all_between([5, 3, 8], 0, 10)` → `True`; `all_between([5, 3, 12], 0, 10)` → `False`.',
      starterCode: `def all_between(root, low, high):
    pass
`,
      solution: `def all_between(root, low, high):
    if root is None:
        return True
    if not (low < root.val < high):
        return False
    return all_between(root.left, low, high) and all_between(root.right, low, high)
`,
      tests: [
        t.eq('all_between(build_tree([5, 3, 8]), 0, 10)', 'True'),
        t.eq('all_between(build_tree([5, 3, 12]), 0, 10)', 'False'),
        t.hidden('all_between(None, 0, 1)', 'True'),
        t.hidden('all_between(TreeNode(5), 5, 10)', 'False'),
        t.hidden('all_between(TreeNode(10), 5, 10)', 'False'),
        t.hidden('all_between(build_tree([-3, -7, -1]), -10, 0)', 'True'),
        t.hidden('all_between(build_tree([5, 3, 8, 1, None, None, 9, 0]), 0, 10)', 'False'),
      ],
      note: 'Python lets you chain comparisons: `low < x < high` means `low < x and x < high`.',
      hints: [
        'The bounds are extra parameters that ride along on every call.',
        'Empty tree: nothing breaks the rule. A node outside the bounds: stop with False. Otherwise both subtrees must pass.',
      ],
      explanation: 'The bounds travel down unchanged here. For a search tree the only difference is that each step tightens one of them.',
      signature: 'bst:bounds-passed-down',
      minutes: 5,
    }),
    write({
      id: 'b98-window',
      title: 'The window a value has to live in',
      skills: ['bst_property', 'while_loop', 'tuples'],
      prompt:
        `Every step of a BST search narrows what the values further down can be: going **left** from 8 means everything below is under 8; going **right** from 3 means everything below is over 3.\n\nWrite \`window_at(root, x)\`. \`x\` is in the BST. Walk to it and return the tuple \`(low, high)\`: the tightest bounds collected on the way. Start from \`float('-inf')\` and \`float('inf')\`.\n\n${BST_PICTURE}\n\nExample: \`x = 6\` → \`(3, 8)\`. \`x = 14\` → \`(10, float('inf'))\`.`,
      starterCode: `def window_at(root, x):
    pass
`,
      solution: `def window_at(root, x):
    low, high = float('-inf'), float('inf')
    node = root
    while node.val != x:
        if x < node.val:
            high = node.val
            node = node.left
        else:
            low = node.val
            node = node.right
    return (low, high)
`,
      tests: [
        t.eq(`window_at(${BST}, 6)`, '(3, 8)'),
        t.eq(`window_at(${BST}, 14)`, "(10, float('inf'))"),
        t.eq(`window_at(${BST}, 4)`, '(3, 6)'),
        t.hidden(`window_at(${BST}, 8)`, "(float('-inf'), float('inf'))"),
        t.hidden(`window_at(${BST}, 1)`, "(float('-inf'), 3)"),
        t.hidden(`window_at(${BST}, 7)`, '(6, 8)'),
        t.hidden('window_at(build_tree([0, -5, 3, None, -2]), -2)', '(-5, 0)'),
      ],
      hints: [
        'Two variables, `low` and `high`, start as wide as possible. The walk itself is the search you already wrote.',
        'Stepping left: the node you leave becomes a ceiling. Stepping right: it becomes a floor.',
        'Only one of the two bounds changes per step. The other keeps what an ancestor higher up set.',
      ],
      explanation: 'A bound set by an ancestor far above still applies deep in the tree. That is exactly what looking only at a parent misses.',
      signature: 'bst:window-walk',
      minutes: 7,
    }),
    debug({
      id: 'b98-dbg-children',
      title: 'Debug: is this a search tree?',
      difficulty: 3,
      skills: ['bst_property', 'tree_dfs', 'recursion_return'],
      prompt:
        '`is_ordered(root)` should return `True` only when the tree is a valid search tree: for **every** node, everything in its left subtree is smaller and everything in its right subtree is bigger (no duplicates). It accepts some trees it should reject. Fix it.\n\n```python\n#     5\n#    / \\\n#   3   8\n#    \\\n#     6      <- inside the left subtree of 5, but bigger than 5\n```',
      brokenCode: `def is_ordered(root):
    if root is None:
        return True
    if root.left and root.left.val >= root.val:
        return False
    if root.right and root.right.val <= root.val:
        return False
    return is_ordered(root.left) and is_ordered(root.right)
`,
      solution: `def is_ordered(root, low=float('-inf'), high=float('inf')):
    if root is None:
        return True
    if not (low < root.val < high):
        return False
    return is_ordered(root.left, low, root.val) and is_ordered(root.right, root.val, high)
`,
      tests: [
        t.eq('is_ordered(build_tree([5, 3, 8, 1, 4]))', 'True'),
        t.eq('is_ordered(build_tree([5, 3, 8, None, 6]))', 'False'),
        t.eq('is_ordered(build_tree([5, 8, 3]))', 'False'),
        t.hidden('is_ordered(None)', 'True'),
        t.hidden('is_ordered(TreeNode(1))', 'True'),
        t.hidden('is_ordered(build_tree([5, 5]))', 'False'),
        t.hidden('is_ordered(build_tree([5, 3, 8, None, None, 4]))', 'False'),
        t.hidden('is_ordered(build_tree([0, -5, 3, -8, -2]))', 'True'),
        t.hidden('is_ordered(build_tree([8, 3, 10, 1, 6, None, 14, None, None, 4, 9]))', 'False'),
      ],
      note: 'Extra parameters with defaults let the first call stay `is_ordered(root)`:\ndef f(node, low=float(\'-inf\'), high=float(\'inf\')):',
      hints: [
        'In the failing tree every parent and child pair looks fine. Which pair of nodes is actually out of order?',
        'A node has to answer to every ancestor, not just its parent. What did `window_at` collect on the way down?',
        'Give the function a `low` and a `high`. Check the node against them, then pass a tighter window to each child.',
        'Going left, this node becomes the ceiling. Going right, it becomes the floor. The other bound is passed on as it is.',
      ],
      explanation: 'Comparing a node with its children checks one level. Carrying the window down checks each node against every ancestor at once, still in one O(n) pass.',
      signature: 'debug:bst-validate-children-only',
      minutes: 6,
    }),
    write({
      id: 'b98-descending',
      title: 'A search tree sorted the other way',
      ...pattern,
      difficulty: 3,
      skills: ['bst_property', 'tree_dfs', 'recursion_base_case', 'recursion_return'],
      transfer: true,
      prompt:
        'A **flipped** search tree puts the bigger values on the left: for every node, everything in its left subtree is **bigger** and everything in its right subtree is **smaller**. No duplicates.\n\nWrite `is_flipped(root)` returning `True` if the whole tree follows that rule. `root` is the top node, or `None` for an empty tree, which follows it.\n\n```python\n#     5            5\n#    / \\          / \\\n#   8   3        8   3\n#  / \\            \\\n# 9   6            4     <- left of 5, but smaller than 5\n#   True          False\n```',
      starterCode: `def is_flipped(root):
    pass
`,
      solution: `def is_flipped(root, low=float('-inf'), high=float('inf')):
    if root is None:
        return True
    if not (low < root.val < high):
        return False
    return is_flipped(root.left, root.val, high) and is_flipped(root.right, low, root.val)
`,
      tests: [
        t.eq('is_flipped(build_tree([5, 8, 3, 9, 6]))', 'True'),
        t.eq('is_flipped(build_tree([5, 8, 3, None, 4]))', 'False'),
        t.eq('is_flipped(build_tree([5, 3, 8]))', 'False'),
        t.hidden('is_flipped(None)', 'True'),
        t.hidden('is_flipped(TreeNode(0))', 'True'),
        t.hidden('is_flipped(build_tree([5, 5]))', 'False'),
        t.hidden('is_flipped(build_tree([5, 8, 3, 9, 6, 4, 1]))', 'True'),
        t.hidden('is_flipped(build_tree([5, 8, 3, 9, 6, 6, 1]))', 'False'),
        t.hidden('is_flipped(build_tree([0, 3, -5, None, None, -2, -8]))', 'True'),
      ],
      hints: ['Checking each node against its two children is not enough. What does a node deep in the tree have to answer to?'],
      explanation: 'Same window, opposite updates: going left the node becomes the floor, going right it becomes the ceiling.',
      signature: 'bst:validate-flipped-bounds',
      minutes: 8,
    }),
  ],
}

// ── LC 230 · Kth Smallest Element in a BST ───────────────────────────────────
const br230: PackSection = {
  id: 'br-230',
  module: MODULE,
  title: 'Toward Kth Smallest Element in a BST',
  summary: 'Left, node, right visits a search tree in sorted order. Collect the values, then stop early by counting.',
  exercises: [
    output({
      id: 'b230-trace-inorder',
      title: 'Trace: left, node, right',
      skills: ['tree_inorder', 'tree_dfs'],
      prompt: 'Predict the output. The tree is a search tree. Follow the calls: a value is printed only after everything to its left is done.',
      code: `#       5
#      / \\
#     2   9
#      \\  /
#      4 7
root = TreeNode(5, TreeNode(2, None, TreeNode(4)), TreeNode(9, TreeNode(7)))

def visit(node):
    if node is None:
        return
    visit(node.left)
    print(node.val)
    visit(node.right)

visit(root)`,
      expectedOutput: `2
4
5
7
9`,
      note: 'In-order = left subtree, then the node, then the right subtree. On a search tree that is smallest to largest.',
      explanation: 'Everything smaller than a node is in its left subtree and is printed first, so the values come out sorted.',
      signature: 'trace:inorder-bst-sorted',
      minutes: 2,
    }),
    write({
      id: 'b230-smallest-k',
      title: 'The k smallest values',
      skills: ['tree_inorder', 'tree_dfs', 'list_append'],
      prompt:
        `Write \`smallest_k(root, k)\`: a list of the \`k\` smallest values of a BST, smallest first. If the tree has fewer than \`k\` values, return all of them. Do not call \`sorted\`: visit in order, collect into one shared list, and stop adding once it holds \`k\`.\n\n${BST_PICTURE}\n\nExample: \`k = 3\` → \`[1, 3, 4]\`.`,
      starterCode: `def smallest_k(root, k):
    pass
`,
      solution: `def smallest_k(root, k):
    out = []

    def visit(node):
        if node is None or len(out) == k:
            return
        visit(node.left)
        if len(out) < k:
            out.append(node.val)
        visit(node.right)

    visit(root)
    return out
`,
      tests: [
        t.eq(`smallest_k(${BST}, 3)`, '[1, 3, 4]'),
        t.eq(`smallest_k(${BST}, 1)`, '[1]'),
        t.eq('smallest_k(build_tree([2, 1, 3]), 5)', '[1, 2, 3]'),
        t.hidden(`smallest_k(${BST}, 0)`, '[]'),
        t.hidden('smallest_k(None, 2)', '[]'),
        t.hidden(`smallest_k(${BST}, 8)`, '[1, 3, 4, 6, 7, 8, 10, 14]'),
        t.hidden('smallest_k(build_tree([0, -5, 3]), 2)', '[-5, 0]'),
        t.hidden('smallest_k(TreeNode(4), 1)', '[4]'),
      ],
      hints: [
        'An inner helper that appends to a list made in the outer function, like your `preorder` with a shared list.',
        'The order of the three steps inside the helper decides the order of the list.',
        'The list’s own length tells you when you have enough. Check it before adding.',
      ],
      explanation: 'The list is the counter here: once it holds k values, nothing more is added and later calls return straight away.',
      signature: 'inorder:collect-first-k',
      minutes: 7,
    }),
    debug({
      id: 'b230-dbg-counter',
      title: 'Debug: counting while visiting',
      skills: ['tree_inorder', 'tree_dfs', 'accumulator'],
      prompt:
        `\`position_of(root, x)\` should return the position of \`x\` when the BST’s values are read in sorted order, starting at 1, or \`0\` if \`x\` is not in the tree. It counts nodes as it visits them in order. It crashes. Fix it.\n\n${BST_PICTURE}\n\nExample: \`x = 6\` → \`4\` (the order is 1, 3, 4, 6, ...).`,
      brokenCode: `def position_of(root, x):
    count = 0
    found = 0

    def visit(node):
        if node is None:
            return
        visit(node.left)
        count += 1
        if node.val == x:
            found = count
        visit(node.right)

    visit(root)
    return found
`,
      solution: `def position_of(root, x):
    count = 0
    found = 0

    def visit(node):
        nonlocal count, found
        if node is None:
            return
        visit(node.left)
        count += 1
        if node.val == x:
            found = count
        visit(node.right)

    visit(root)
    return found
`,
      tests: [
        t.eq(`position_of(${BST}, 6)`, '4'),
        t.eq(`position_of(${BST}, 1)`, '1'),
        t.hidden(`position_of(${BST}, 14)`, '8'),
        t.hidden(`position_of(${BST}, 5)`, '0'),
        t.hidden('position_of(None, 1)', '0'),
        t.hidden('position_of(build_tree([0, -5, 3]), 0)', '2'),
      ],
      note: 'An inner function can **read** an outer variable freely, and can call methods on it (`out.append(x)`). To **assign** to it (`count += 1`, `found = ...`) it must first say:\nnonlocal count, found',
      hints: [
        'Read the error: which variable, on which line?',
        'Assigning to a name inside a function makes Python treat it as a new local variable of that function, unless you say otherwise.',
        'One declaration at the top of `visit` fixes it. Check that **both** assigned names are covered, or the answer stays 0.',
      ],
      explanation: 'Appending to a shared list needs no declaration because the name is never reassigned. A counter is reassigned on every visit, so the helper must declare it `nonlocal`.',
      signature: 'debug:inorder-counter-nonlocal',
      minutes: 4,
    }),
    write({
      id: 'b230-kth-largest',
      title: 'The k-th largest value',
      ...pattern,
      difficulty: 3,
      skills: ['tree_inorder', 'tree_dfs', 'accumulator', 'recursion_base_case'],
      transfer: true,
      prompt:
        `Write \`kth_largest(root, k)\`: the \`k\`-th **largest** value of a BST (\`k = 1\` is the largest). \`k\` is between 1 and the number of nodes. Do not sort, and do not collect every value first: stop as soon as you have the answer.\n\n${BST_PICTURE}\n\nExample: \`k = 3\` → \`8\` (the order is 14, 10, 8, ...).`,
      starterCode: `def kth_largest(root, k):
    pass
`,
      solution: `def kth_largest(root, k):
    count = 0
    answer = None

    def visit(node):
        nonlocal count, answer
        if node is None or answer is not None:
            return
        visit(node.right)
        count += 1
        if count == k:
            answer = node.val
        visit(node.left)

    visit(root)
    return answer
`,
      tests: [
        t.eq(`kth_largest(${BST}, 1)`, '14'),
        t.eq(`kth_largest(${BST}, 3)`, '8'),
        t.eq('kth_largest(build_tree([2, 1, 3]), 2)', '2'),
        t.hidden(`kth_largest(${BST}, 8)`, '1'),
        t.hidden(`kth_largest(${BST}, 5)`, '6'),
        t.hidden('kth_largest(TreeNode(4), 1)', '4'),
        t.hidden('kth_largest(build_tree([0, -5, 3]), 3)', '-5'),
        t.hidden('kth_largest(build_tree([5, 3, None, 2, None, 1]), 2)', '3'),
      ],
      hints: ['Which visiting order hands you the values from the largest down?'],
      explanation: 'Right, node, left is in-order backwards: largest first. The counter says which visit you are on, and once the answer is set every remaining call returns immediately.',
      signature: 'inorder:reverse-kth-counter',
      minutes: 9,
    }),
  ],
}

// ── LC 105 · Construct Binary Tree from Preorder and Inorder ─────────────────
const br105: PackSection = {
  id: 'br-105',
  module: MODULE,
  title: 'Toward Construct Binary Tree from Preorder and Inorder Traversal',
  summary: 'Build a node, split the lists around it, and let recursion build each side from its own piece.',
  exercises: [
    write({
      id: 'b105-join',
      title: 'A root over two finished subtrees',
      skills: ['tree_build', 'treenode'],
      prompt:
        'Write `join(val, left, right)`: make a new node holding `val`, hang the already-built trees `left` and `right` under it (either can be `None`), and return the new root.\n\nExample: `join(1, build_tree([2, 4]), build_tree([3]))` is the tree `[1, 2, 3, 4]`.',
      starterCode: `def join(val, left, right):
    pass
`,
      solution: `def join(val, left, right):
    root = TreeNode(val)
    root.left = left
    root.right = right
    return root
`,
      tests: [
        t.eq('tree_to_array(join(1, build_tree([2, 4]), build_tree([3])))', '[1, 2, 3, 4]'),
        t.eq('tree_to_array(join(7, None, None))', '[7]'),
        t.hidden('tree_to_array(join(5, None, build_tree([7])))', '[5, None, 7]'),
        t.hidden('tree_to_array(join(0, build_tree([-1]), None))', '[0, -1]'),
        t.check('the subtrees are attached, not copied', 'a = TreeNode(2)\nb = TreeNode(3)\nr = join(1, a, b)\nassert r.left is a and r.right is b', true),
      ],
      hints: ['Make the node, set its two children, hand the node back.'],
      explanation: 'Every tree-building function ends this way: one new node, two subtrees attached, the node returned to whoever asked for it.',
      signature: 'build:join-node',
      minutes: 3,
    }),
    write({
      id: 'b105-split-inorder',
      title: 'Split an in-order list around the root',
      skills: ['tree_build', 'slicing', 'tuples'],
      prompt:
        'An **in-order** list is written left subtree, root, right subtree. So once you know the root’s value, everything before it belongs to the left subtree and everything after it to the right.\n\nWrite `split_around(inorder, root_val)` returning the tuple `(left_part, right_part)`. Values are all different.\n\nExample: `split_around([4, 2, 5, 1, 3], 1)` → `([4, 2, 5], [3])`.',
      starterCode: `def split_around(inorder, root_val):
    pass
`,
      solution: `def split_around(inorder, root_val):
    mid = inorder.index(root_val)
    return (inorder[:mid], inorder[mid + 1:])
`,
      tests: [
        t.eq('split_around([4, 2, 5, 1, 3], 1)', '([4, 2, 5], [3])'),
        t.eq('split_around([1, 2], 1)', '([], [2])'),
        t.hidden('split_around([7], 7)', '([], [])'),
        t.hidden('split_around([3, 2, 1], 1)', '([3, 2], [])'),
        t.hidden('split_around([-4, 0, 9, 6], 0)', '([-4], [9, 6])'),
      ],
      note: '`lst.index(x)` gives the position of `x`. That position is also **how many items come before it**.',
      hints: ['Find where the root sits with `.index`.', 'Two slices: up to that position, and from one past it.'],
      explanation: 'The root’s index does double duty: it is where to cut, and it is the size of the left subtree.',
      signature: 'build:split-inorder',
      minutes: 3,
    }),
    write({
      id: 'b105-preorder-halves',
      title: 'Cut a pre-order list by the left size',
      skills: ['tree_build', 'slicing', 'tuples'],
      prompt:
        'A **pre-order** list is written root, then the whole left subtree, then the whole right subtree. It does not say where the left part ends, unless you know how many nodes the left subtree has.\n\nWrite `preorder_halves(preorder, left_size)` returning `(left_part, right_part)`: the left subtree’s values and the right subtree’s values, without the root.\n\nExample: `preorder_halves([1, 2, 4, 5, 3], 3)` → `([2, 4, 5], [3])`.',
      starterCode: `def preorder_halves(preorder, left_size):
    pass
`,
      solution: `def preorder_halves(preorder, left_size):
    left = preorder[1:1 + left_size]
    right = preorder[1 + left_size:]
    return (left, right)
`,
      tests: [
        t.eq('preorder_halves([1, 2, 4, 5, 3], 3)', '([2, 4, 5], [3])'),
        t.eq('preorder_halves([1, 2], 0)', '([], [2])'),
        t.hidden('preorder_halves([7], 0)', '([], [])'),
        t.hidden('preorder_halves([1, 2, 3], 2)', '([2, 3], [])'),
        t.hidden('preorder_halves([3, 9, 20, 15, 7], 1)', '([9], [20, 15, 7])'),
      ],
      hints: ['Index 0 is the root. Where does the left part start, and how long is it?', 'The right part starts where the left part stops.'],
      explanation: 'Skip one for the root, take `left_size` values, and the rest is the right subtree.',
      signature: 'build:slice-preorder-by-size',
      minutes: 3.5,
    }),
    debug({
      id: 'b105-dbg-slices',
      title: 'Debug: the four pieces',
      ...combine,
      skills: ['tree_build', 'slicing', 'list_index'],
      prompt:
        '`four_pieces(preorder, inorder)` takes the pre-order list and the in-order list of the same tree (all values different) and should return `(left_pre, left_in, right_pre, right_in)`: the pre-order and in-order lists of the left subtree, then of the right subtree. Two of the pieces come out wrong. Fix it.\n\nExample: `four_pieces([1, 2, 4, 5, 3], [4, 2, 5, 1, 3])` → `([2, 4, 5], [4, 2, 5], [3], [3])`.',
      brokenCode: `def four_pieces(preorder, inorder):
    root_val = preorder[0]
    mid = inorder.index(root_val)
    left_in = inorder[:mid]
    right_in = inorder[mid + 1:]
    left_pre = preorder[:mid]
    right_pre = preorder[mid:]
    return (left_pre, left_in, right_pre, right_in)
`,
      solution: `def four_pieces(preorder, inorder):
    root_val = preorder[0]
    mid = inorder.index(root_val)
    left_in = inorder[:mid]
    right_in = inorder[mid + 1:]
    left_pre = preorder[1:mid + 1]
    right_pre = preorder[mid + 1:]
    return (left_pre, left_in, right_pre, right_in)
`,
      tests: [
        t.eq('four_pieces([1, 2, 4, 5, 3], [4, 2, 5, 1, 3])', '([2, 4, 5], [4, 2, 5], [3], [3])'),
        t.eq('four_pieces([3, 9, 20, 15, 7], [9, 3, 15, 20, 7])', '([9], [9], [20, 15, 7], [15, 20, 7])'),
        t.hidden('four_pieces([7], [7])', '([], [], [], [])'),
        t.hidden('four_pieces([1, 2], [1, 2])', '([], [], [2], [2])'),
        t.hidden('four_pieces([1, 2], [2, 1])', '([2], [2], [], [])'),
      ],
      hints: [
        'Compare the two left pieces in the output: they should hold the same values. Which value is in one and should not be?',
        'Where is the root in a pre-order list? Is it part of either subtree?',
      ],
      explanation: 'In the in-order list the root sits in the middle and is skipped with `mid + 1`. In the pre-order list it sits at the front, so both pre-order slices shift right by one.',
      signature: 'debug:build-preorder-slice-off-by-one',
      minutes: 4,
    }),
    write({
      id: 'b105-from-sorted',
      title: 'A search tree from a sorted list',
      ...combine,
      difficulty: 3,
      skills: ['tree_build', 'slicing', 'recursion_base_case', 'recursion_return'],
      prompt:
        'Write `from_sorted(nums)`: build a BST from a sorted list of different numbers and return its root. The root is the middle value, `nums[len(nums) // 2]`; the values before it build the left subtree the same way, and the values after it build the right subtree. An empty list builds `None`.\n\nExample: `[1, 2, 3, 4, 5, 6, 7]` → the tree `[4, 2, 6, 1, 3, 5, 7]`.',
      starterCode: `def from_sorted(nums):
    pass
`,
      solution: `def from_sorted(nums):
    if not nums:
        return None
    mid = len(nums) // 2
    root = TreeNode(nums[mid])
    root.left = from_sorted(nums[:mid])
    root.right = from_sorted(nums[mid + 1:])
    return root
`,
      tests: [
        t.eq('tree_to_array(from_sorted([1, 2, 3, 4, 5, 6, 7]))', '[4, 2, 6, 1, 3, 5, 7]'),
        t.eq('tree_to_array(from_sorted([1, 2, 3]))', '[2, 1, 3]'),
        t.hidden('tree_to_array(from_sorted([]))', '[]'),
        t.hidden('tree_to_array(from_sorted([5]))', '[5]'),
        t.hidden('tree_to_array(from_sorted([1, 2]))', '[2, 1]'),
        t.hidden('tree_to_array(from_sorted([1, 2, 3, 4]))', '[3, 2, 4, 1]'),
        t.hidden('tree_to_array(from_sorted([-9, -3, 0, 4]))', '[0, -3, 4, -9]'),
      ],
      hints: [
        'The function returns a **node** (or None). Trust that calling it on a smaller list returns the finished subtree.',
        'Base case: nothing in the list, nothing to build.',
        'Make the root from the middle value, then assign the result of each recursive call to `root.left` and `root.right`.',
      ],
      explanation: 'The whole pattern in its smallest form: pick the root, cut the input into a left piece and a right piece, build each piece recursively, attach, return.',
      signature: 'build:bst-from-sorted-middle',
      minutes: 7,
    }),
    write({
      id: 'b105-from-post-in',
      title: 'Rebuild a tree from post-order and in-order',
      ...pattern,
      difficulty: 4,
      skills: ['tree_build', 'slicing', 'recursion_base_case', 'recursion_return'],
      transfer: true,
      prompt:
        'A **post-order** list is written left subtree, right subtree, root: the root comes **last**. An in-order list is left subtree, root, right subtree. All values are different.\n\nWrite `from_post_in(postorder, inorder)`: rebuild the tree both lists describe and return its root (`None` when the lists are empty).\n\nExample: `postorder = [4, 5, 2, 3, 1]`, `inorder = [4, 2, 5, 1, 3]` → the tree `[1, 2, 3, 4, 5]`.',
      starterCode: `def from_post_in(postorder, inorder):
    pass
`,
      solution: `def from_post_in(postorder, inorder):
    if not postorder:
        return None
    root = TreeNode(postorder[-1])
    mid = inorder.index(root.val)
    root.left = from_post_in(postorder[:mid], inorder[:mid])
    root.right = from_post_in(postorder[mid:-1], inorder[mid + 1:])
    return root
`,
      tests: [
        t.eq('tree_to_array(from_post_in([4, 5, 2, 3, 1], [4, 2, 5, 1, 3]))', '[1, 2, 3, 4, 5]'),
        t.eq('tree_to_array(from_post_in([9, 15, 7, 20, 3], [9, 3, 15, 20, 7]))', '[3, 9, 20, None, None, 15, 7]'),
        t.hidden('tree_to_array(from_post_in([], []))', '[]'),
        t.hidden('tree_to_array(from_post_in([7], [7]))', '[7]'),
        t.hidden('tree_to_array(from_post_in([3, 2, 1], [3, 2, 1]))', '[1, 2, None, 3]'),
        t.hidden('tree_to_array(from_post_in([3, 2, 1], [1, 2, 3]))', '[1, None, 2, None, 3]'),
        t.hidden('tree_to_array(from_post_in([-4, 6, 0], [-4, 0, 6]))', '[0, -4, 6]'),
      ],
      hints: [
        'One list tells you **which value** is the root. The other tells you **how many** values are on each side of it.',
        'The root’s position in the in-order list is the size of the left subtree.',
        'The left subtree’s values sit together in both lists, and so do the right subtree’s. Slice the same count out of each.',
        'Four slices, two recursive calls, attach, return the root. Remember the root is not part of either post-order slice.',
      ],
      explanation: 'The recipe never changes: take the root from the traversal that exposes it, find it in the in-order list to learn the left size, slice both lists by that size, and recurse on each pair.',
      signature: 'build:from-postorder-inorder',
      minutes: 10,
    }),
  ],
}

// ── LC 124 · Binary Tree Maximum Path Sum ────────────────────────────────────
const br124: PackSection = {
  id: 'br-124',
  module: MODULE,
  title: 'Toward Binary Tree Maximum Path Sum',
  summary: 'One DFS, two quantities: return what a parent can extend, and record the best path that bends through this node.',
  exercises: [
    output({
      id: 'b124-trace-two-values',
      title: 'Trace: what is returned, what is recorded',
      skills: ['tree_global_best', 'tree_dfs', 'recursion_return'],
      prompt:
        'Each call prints three numbers for its node: the value, what it **returns** to its parent, and what it **records** as a candidate for `best`. Predict the whole output, including the last line.',
      code: `#       1
#      /
#     2
#    / \\
#   4   5
#  /     \\
# 6       7
root = TreeNode(1, TreeNode(2, TreeNode(4, TreeNode(6)), TreeNode(5, None, TreeNode(7))))

def longest(root):
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right)
        print(node.val, 1 + max(left, right), left + right)
        return 1 + max(left, right)

    height(root)
    return best

print(longest(root))`,
      expectedOutput: `6 1 0
4 2 1
7 1 0
5 2 1
2 3 4
1 4 3
4`,
      note: 'An **arm** is a straight line of nodes going down from a node. A parent can only continue **one** arm of a path, so the function returns the longer arm. A path that uses **both** arms bends here and cannot be extended upward, so it is only recorded.\n`nonlocal best` is what lets the inner function assign to the outer function’s `best`.',
      explanation: 'The longest path (6-4-2-5-7, four edges) bends at node 2, not at the root. The root only learns that node 2 is 3 nodes tall; the answer survives because node 2 recorded it.',
      signature: 'trace:return-height-record-through',
      minutes: 3,
    }),
    write({
      id: 'b124-diameter',
      title: 'The longest path between any two nodes',
      difficulty: 3,
      skills: ['tree_global_best', 'tree_dfs', 'recursion_return', 'state_tracking'],
      note: 'An inner function can read an outer variable freely. To **assign** to it (`best = ...`) it must first declare `nonlocal best`; without that line Python quietly makes a new local variable instead.',
      prompt:
        '`root` is the top node of a binary tree, or `None`.\n\nWrite `diameter(root)`: the number of **edges** on the longest path between any two nodes of the tree (an edge is one parent-to-child link). The path may or may not pass through the root. An empty tree and a single node both give `0`.\n\nExample: `[1, 2, 3, 4, 5]` → `3` (the path 4-2-1-3).',
      starterCode: `def diameter(root):
    pass
`,
      solution: `def diameter(root):
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right)
        return 1 + max(left, right)

    height(root)
    return best
`,
      tests: [
        t.eq('diameter(build_tree([1, 2, 3, 4, 5]))', '3'),
        t.eq('diameter(build_tree([1, 2, None, 4, 5, 6, None, None, 7]))', '4'),
        t.hidden('diameter(None)', '0'),
        t.hidden('diameter(TreeNode(1))', '0'),
        t.hidden('diameter(build_tree([1, 2]))', '1'),
        t.hidden('diameter(build_tree([1, 2, None, 3, None, 4]))', '3'),
        t.hidden('diameter(build_tree([1, 2, 3, 4, None, None, 5, 6, None, None, 7]))', '6'),
      ],
      hints: [
        'The longest path has a highest node, where it bends. At that node it is the left height plus the right height.',
        'A helper that returns the **height** of a node, like the one you wrote for max depth.',
        'Before returning, the helper compares `left + right` with the best seen so far, kept in the outer function.',
        'The outer function calls the helper once and returns the best, not what the helper returned.',
      ],
      explanation: 'Height is what a parent needs; left + right is what the answer needs. One pass computes both, O(n).',
      signature: 'global-best:diameter',
      minutes: 9,
    }),
    debug({
      id: 'b124-dbg-return-recorded',
      title: 'Debug: the widest chain of nodes',
      difficulty: 3,
      skills: ['tree_global_best', 'tree_dfs', 'recursion_return'],
      prompt:
        '`widest(root)` should return the number of **nodes** on the longest path between any two nodes of the tree (a single node counts as a path of 1; an empty tree gives 0). It reports numbers that are too big. Fix it.\n\nExample: `[1, 2, 3, 4, 5]` → `4` (the path 4-2-1-3).',
      brokenCode: `def widest(root):
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right + 1)
        return left + right + 1

    height(root)
    return best
`,
      solution: `def widest(root):
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right + 1)
        return 1 + max(left, right)

    height(root)
    return best
`,
      tests: [
        t.eq('widest(build_tree([1, 2, 3, 4, 5]))', '4'),
        t.eq('widest(build_tree([1, 2, None, 4, 5, 6, None, None, 7]))', '5'),
        t.hidden('widest(None)', '0'),
        t.hidden('widest(TreeNode(1))', '1'),
        t.hidden('widest(build_tree([1, 2, None, 3]))', '3'),
        t.hidden('widest(build_tree([1, 2, 3, 4, 5, 6, 7]))', '5'),
      ],
      hints: [
        'For `[1, 2, 3, 4, 5]` it answers 5. Can one path really visit 4, 5, 2, 1 and 3 without using a node twice?',
        'What does the parent do with the number it gets back? What does that number have to mean for the parent’s sum to be a real path?',
      ],
      explanation: 'A path that bends at a node uses both of its arms and cannot also climb to the parent. So the bent path is recorded, and only the longer single arm is returned.',
      signature: 'debug:global-best-returns-recorded',
      minutes: 4,
    }),
    write({
      id: 'b124-best-down',
      title: 'The best path straight down',
      skills: ['tree_global_best', 'tree_dfs', 'recursion_return'],
      prompt:
        'Values can be negative. Write `best_down(root)`: the largest sum of a path that **starts at the root** and goes downward, one child at a time, stopping wherever it likes. The root is always included. An empty tree gives `0`.\n\nExample: `[1, -2, 3, 10]` → `9` (1, -2, 10). `[5, -2, -3]` → `5` (stop at the root: both children only make it worse).',
      starterCode: `def best_down(root):
    pass
`,
      solution: `def best_down(root):
    if root is None:
        return 0
    left = max(0, best_down(root.left))
    right = max(0, best_down(root.right))
    return root.val + max(left, right)
`,
      tests: [
        t.eq('best_down(build_tree([1, -2, 3, 10]))', '9'),
        t.eq('best_down(build_tree([5, -2, -3]))', '5'),
        t.eq('best_down(build_tree([1, 2, 3]))', '4'),
        t.hidden('best_down(None)', '0'),
        t.hidden('best_down(TreeNode(-3))', '-3'),
        t.hidden('best_down(build_tree([-4, -1, -9]))', '-4'),
        t.hidden('best_down(build_tree([2, -1, None, -1, None, 10]))', '10'),
        t.hidden('best_down(build_tree([0, 0, 0]))', '0'),
      ],
      note: '`max(0, x)` is "take it only if it helps": a negative arm is worth less than no arm at all.',
      hints: [
        'Ask each child for its own best downward sum. Trust the answer.',
        'Going into a child is optional. When is it better not to?',
        'A path is a single line, so the root can continue into at most **one** child.',
      ],
      explanation: 'Clamping each child’s answer at 0 is how "stop here" is expressed. The root’s own value is never clamped, because the path must contain it.',
      signature: 'global-best:down-sum-clamp',
      minutes: 6,
    }),
    write({
      id: 'b124-through-root',
      title: 'The best path that bends at the root',
      ...combine,
      difficulty: 3,
      skills: ['tree_global_best', 'tree_dfs', 'recursion_return', 'functions'],
      prompt:
        'Write `best_through_root(root)`: the largest sum of a path whose **highest node is the root**. It may run down into the left subtree, down into the right subtree, both, or neither. The tree is not empty and values can be negative.\n\nExample: `[1, -2, 3, 10]` → `12` (10, -2, 1, 3). `[5, -2, 3]` → `8` (5, 3). `[-4, -1, -9]` → `-4` (the root alone).\n\nYou will need a helper for "the best path straight down from this node".',
      starterCode: `def best_through_root(root):
    pass
`,
      solution: `def best_down(node):
    if node is None:
        return 0
    return node.val + max(0, best_down(node.left), best_down(node.right))


def best_through_root(root):
    left = max(0, best_down(root.left))
    right = max(0, best_down(root.right))
    return root.val + left + right
`,
      tests: [
        t.eq('best_through_root(build_tree([1, -2, 3, 10]))', '12'),
        t.eq('best_through_root(build_tree([5, -2, 3]))', '8'),
        t.eq('best_through_root(build_tree([-4, -1, -9]))', '-4'),
        t.hidden('best_through_root(TreeNode(7))', '7'),
        t.hidden('best_through_root(TreeNode(-7))', '-7'),
        t.hidden('best_through_root(build_tree([1, 2, 3]))', '6'),
        t.hidden('best_through_root(build_tree([-5, 4, 6, None, None, 3, -2]))', '8'),
        t.hidden('best_through_root(build_tree([1, 2, None, 3, 4]))', '7'),
      ],
      hints: [
        'The path is two arms joined at the root. Each arm is a straight-down path starting at a child.',
        'An arm that would make the sum smaller is simply left out.',
        'Inside an arm, a node can continue into only one child. At the root, both arms count.',
      ],
      explanation: 'The two formulas side by side: an arm adds the **better** child (that is what gets returned upward), the bend adds **both** (that is what gets recorded). The real problem computes both at every node in one pass.',
      signature: 'global-best:bend-at-root-sum',
      minutes: 8,
    }),
    write({
      id: 'b124-longest-same',
      title: 'The longest path of equal values',
      ...pattern,
      difficulty: 4,
      skills: ['tree_global_best', 'tree_dfs', 'recursion_return', 'state_tracking'],
      transfer: true,
      prompt:
        'Write `longest_same(root)`: the number of **edges** on the longest path in which every node holds the same value. The path can bend at a node and does not have to pass through the root. An empty tree gives `0`.\n\n```python\n#       7\n#      / \\\n#     2   7\n#    / \\   \\\n#   1   1   7      -> 2   (7 - 7 - 7)\n```',
      starterCode: `def longest_same(root):
    pass
`,
      solution: `def longest_same(root):
    best = 0

    def arm(node):
        nonlocal best
        if node is None:
            return 0
        left = arm(node.left)
        right = arm(node.right)
        left = left + 1 if node.left and node.left.val == node.val else 0
        right = right + 1 if node.right and node.right.val == node.val else 0
        best = max(best, left + right)
        return max(left, right)

    arm(root)
    return best
`,
      tests: [
        t.eq('longest_same(build_tree([7, 2, 7, 1, 1, None, 7]))', '2'),
        t.eq('longest_same(build_tree([9, 4, 5, 4, 4]))', '2'),
        t.eq('longest_same(build_tree([1, 2, 3]))', '0'),
        t.hidden('longest_same(None)', '0'),
        t.hidden('longest_same(TreeNode(3))', '0'),
        t.hidden('longest_same(build_tree([1, 1, 1, 1, 1, 1, 1]))', '4'),
        t.hidden('longest_same(build_tree([3, 3, None, 3]))', '2'),
        t.hidden('longest_same(build_tree([5, 5, 5, 8, None, None, 5, 8]))', '3'),
        t.hidden('longest_same(build_tree([-1, -1, 2, None, -1]))', '2'),
      ],
      hints: [
        'Same two-quantity shape as the diameter. Decide first: what does a node hand its parent, and what does it record?',
        'An arm through a child only counts when the child holds the same value as this node. Otherwise that arm is worth nothing here.',
        'Still visit both children whatever their values: a long path may live entirely below.',
        'Record left arm + right arm. Return only the longer arm.',
      ],
      explanation: 'A child with a different value cuts the arm to 0, the same job `max(0, ...)` does for negative sums. The best path bends somewhere, and the node where it bends records it.',
      signature: 'global-best:longest-same-value-path',
      minutes: 12,
    }),
  ],
}

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'

export const pack: Pack = {
  sections: [br572, br235, br98, br230, br105, br124],
  bridges: [
    {
      lc: 572,
      title: 'Subtree of Another Tree',
      unit: 'Recursion + trees',
      section: 'br-572',
      mode: 'bridge-first',
      prerequisiteSkills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
      blocks: [
        { label: 'compare two trees node by node', skills: ['tree_dfs', 'recursion_base_case'], evidence: ['cap-same-tree', 'd06-pair-mirror'] },
        { label: 'visit every node and combine the answers', skills: ['tree_dfs', 'recursion_return'], evidence: ['d06-dfs-contains'] },
        { label: 'ask the helper at every node', skills: ['tree_dfs', 'recursion_return'], reps: ['b572-count-starts', 'b572-dbg-two-levels'] },
        { label: 'handle the empty cases and stop at the first match', skills: ['recursion_base_case', 'tree_dfs'], reps: ['b572-mirror-inside'] },
      ],
    },
    {
      lc: 235,
      title: 'Lowest Common Ancestor of a Binary Search Tree',
      unit: 'Recursion + trees',
      section: 'br-235',
      mode: 'bridge-first',
      prerequisiteSkills: ['treenode', 'while_loop', 'bst_property'],
      blocks: [
        { label: 'search an unsorted tree everywhere', skills: ['tree_dfs', 'recursion_return'], evidence: ['d06-dfs-contains'] },
        { label: 'walk a search tree one way', skills: ['bst_property', 'while_loop'], reps: ['b235-bst-has'] },
        { label: 'remember a candidate while walking', skills: ['bst_property', 'state_tracking'], reps: ['b235-floor'] },
        { label: 'find where two values part ways', skills: ['bst_property', 'conditionals'], reps: ['b235-dbg-or', 'b235-shared-steps'] },
      ],
    },
    {
      lc: 98,
      title: 'Validate Binary Search Tree',
      unit: 'Recursion + trees',
      section: 'br-98',
      mode: 'bridge-first',
      prerequisiteSkills: ['tree_dfs', 'recursion_return', 'bst_property'],
      blocks: [
        { label: 'check every node and combine with and', skills: ['tree_dfs', 'recursion_return'], evidence: ['d06-pair-bigger', 'cap-same-tree'] },
        { label: 'pass bounds down the tree', skills: ['bst_property', 'tree_dfs'], reps: ['b98-all-between'] },
        { label: 'tighten one bound at each step', skills: ['bst_property', 'while_loop'], reps: ['b98-window'] },
        { label: 'check each node against every ancestor', skills: ['bst_property', 'recursion_return'], reps: ['b98-dbg-children', 'b98-descending'] },
      ],
    },
    {
      lc: 230,
      title: 'Kth Smallest Element in a BST',
      unit: 'Recursion + trees',
      section: 'br-230',
      mode: 'bridge-first',
      prerequisiteSkills: ['tree_dfs', 'bst_property', 'tree_inorder'],
      blocks: [
        { label: 'visit left, node, right', skills: ['tree_dfs', 'recursion_return'], evidence: ['d06-dfs-inorder-return'] },
        { label: 'read a search tree in sorted order', skills: ['tree_inorder'], reps: ['b230-trace-inorder', 'b230-smallest-k'] },
        { label: 'count visits in a shared counter', skills: ['tree_inorder', 'accumulator'], reps: ['b230-dbg-counter'] },
        { label: 'stop as soon as the count is reached', skills: ['tree_inorder', 'recursion_base_case'], reps: ['b230-kth-largest'] },
      ],
    },
    {
      lc: 105,
      title: 'Construct Binary Tree from Preorder and Inorder Traversal',
      unit: 'Recursion + trees',
      section: 'br-105',
      mode: 'bridge-first',
      prerequisiteSkills: ['treenode', 'slicing', 'recursion_return', 'tree_build'],
      blocks: [
        { label: 'make a node and attach its subtrees', skills: ['tree_build', 'treenode'], reps: ['b105-join'] },
        { label: 'split the in-order list around the root', skills: ['tree_build', 'slicing'], reps: ['b105-split-inorder'] },
        { label: 'cut the pre-order list by the left size', skills: ['tree_build', 'slicing'], reps: ['b105-preorder-halves', 'b105-dbg-slices'] },
        { label: 'build each side recursively and return the root', skills: ['tree_build', 'recursion_return'], reps: ['b105-from-sorted'] },
        { label: 'rebuild a tree from two traversals', skills: ['tree_build', 'slicing', 'recursion_base_case'], reps: ['b105-from-post-in'] },
      ],
    },
    {
      lc: 124,
      title: 'Binary Tree Maximum Path Sum',
      unit: 'Recursion + trees',
      section: 'br-124',
      mode: 'bridge-first',
      prerequisiteSkills: ['tree_dfs', 'recursion_return', 'state_tracking', 'tree_global_best'],
      blocks: [
        { label: 'return the height of a subtree', skills: ['tree_dfs', 'recursion_return'], evidence: ['cap-max-depth'] },
        { label: 'return one arm and record the bend', skills: ['tree_global_best', 'state_tracking'], reps: ['b124-trace-two-values', 'b124-diameter', 'b124-dbg-return-recorded'] },
        { label: 'drop an arm that makes the sum worse', skills: ['tree_global_best', 'recursion_return'], reps: ['b124-best-down'] },
        { label: 'join two arms at one node', skills: ['tree_global_best', 'tree_dfs'], reps: ['b124-through-root'] },
        { label: 'do both at every node in one pass', skills: ['tree_global_best', 'state_tracking'], reps: ['b124-longest-same'] },
      ],
    },
  ],
  briefs: {
    // ── LC 572 ───────────────────────────────────────────────────────────────
    'b572-count-starts': {
      inputs: [
        { name: 'root', is: 'the root of the big tree to look through. It can be `None`.' },
        { name: 'shape', is: 'the root of a small tree. Only its shape matters, and it is never empty.' },
      ],
      returns: 'a number: how many nodes of the big tree have, hanging from them, a subtree shaped exactly like `shape`.',
      catch: 'The helper compares **all the way down**. A node with extra children below the shape does not count. Who should decide that, you or the helper?',
    },
    'b572-dbg-two-levels': {
      task: 'It finds the shape near the top of the tree but not deeper down. Make it look at every node.',
      inputs: [
        { name: 'root', is: 'the root of the tree to look through. It can be `None`.' },
        { name: 'shape', is: 'the root of the small tree whose shape you are looking for' },
      ],
      returns: '`True` if any node, at any depth, starts a subtree with that shape. Otherwise `False`.',
      catch: 'Count how many different nodes ever get handed to `same_shape`.',
    },
    'b572-mirror-inside': {
      inputs: [
        { name: 'root', is: 'the root of the big tree. It can be `None`.' },
        { name: 'other', is: 'the root of the tree whose mirror image you are looking for. It can be `None`.' },
      ],
      returns: '`True` if some node’s whole subtree is the mirror image of `other`. Otherwise `False`.',
      catch: 'What should happen when the big tree runs out (`None`) and `other` is `None` too? And when only the big tree has run out?',
    },

    // ── LC 235 ───────────────────────────────────────────────────────────────
    'b235-bst-has': {
      inputs: [
        { name: 'root', is: 'the root of a search tree: smaller values on the left of every node, bigger on the right. It can be `None`.' },
        { name: 'x', is: 'the number to look for' },
      ],
      returns: '`True` if `x` is in the tree, otherwise `False`.',
      catch: 'At each node you learn which side `x` cannot be on. Do you ever need to look there?',
    },
    'b235-floor': {
      inputs: [
        { name: 'root', is: 'the root of a search tree. It can be `None`.' },
        { name: 'x', is: 'a number. It may or may not be in the tree.' },
      ],
      returns: 'the largest value in the tree that is not bigger than `x`, or `None` if every value is bigger.',
      catch: 'When a node fits, you cannot stop yet: a closer one may still exist. On which side would it be?',
    },
    'b235-dbg-or': {
      task: 'It walks past the node it should stop at. Make it stop at the first node that lies between the two numbers.',
      inputs: [
        { name: 'root', is: 'the root of a search tree. It can be `None`.' },
        { name: 'a', is: 'one end of the range' },
        { name: 'b', is: 'the other end of the range. It can be smaller or bigger than `a`.' },
      ],
      returns: 'the value of the first node on the way down that is between `a` and `b` (the ends count), or `None`.',
      catch: 'Say the rule for stepping left out loud, using the word "both" or the word "either". Which one does the code use?',
    },
    'b235-shared-steps': {
      inputs: [
        { name: 'root', is: 'the root of a search tree' },
        { name: 'a', is: 'a value that is in the tree' },
        { name: 'b', is: 'another value that is in the tree. It can equal `a`, and either one can be the smaller.' },
      ],
      returns: 'a number: how many nodes a search for `a` and a search for `b` both visit, counting the root.',
      catch: 'What if one of the two values is itself on the way to the other?',
    },

    // ── LC 98 ────────────────────────────────────────────────────────────────
    'b98-all-between': {
      inputs: [
        { name: 'root', is: 'the root of any tree. It can be `None`.' },
        { name: 'low', is: 'every value must be bigger than this' },
        { name: 'high', is: 'every value must be smaller than this' },
      ],
      returns: '`True` if every value in the tree is strictly between the two bounds, otherwise `False`.',
      catch: 'A value equal to a bound is **not** inside. And what should an empty tree answer?',
    },
    'b98-window': {
      inputs: [
        { name: 'root', is: 'the root of a search tree' },
        { name: 'x', is: 'a value that is in the tree' },
      ],
      returns: 'a tuple `(low, high)`: the biggest ancestor value that `x` had to be above, and the smallest ancestor value it had to be below. A side that was never limited stays at minus or plus infinity.',
      catch: 'Each step changes only one of the two. Which step changes which?',
    },
    'b98-dbg-children': {
      task: 'It accepts trees where each child looks right next to its parent but a node deeper down is on the wrong side of a higher ancestor. Make it reject those.',
      inputs: [{ name: 'root', is: 'the root of a tree. It can be `None`.' }],
      returns: '`True` only if, for every node, the whole left subtree is smaller and the whole right subtree is bigger.',
      catch: 'The rule is about **whole subtrees**, not about children. How can a node know about ancestors it cannot see?',
    },
    'b98-descending': {
      inputs: [{ name: 'root', is: 'the root of a tree. It can be `None`.' }],
      returns: '`True` if, for every node, everything in its left subtree is bigger and everything in its right subtree is smaller. Otherwise `False`.',
      catch: 'A grandchild has to respect its grandparent too. And equal values are not allowed on either side.',
    },

    // ── LC 230 ───────────────────────────────────────────────────────────────
    'b230-trace-inorder': {
      task: PREDICT,
      catch: 'Nothing is printed on the way down. Which node is the first one that has nothing left to do on its left?',
    },
    'b230-smallest-k': {
      inputs: [
        { name: 'root', is: 'the root of a search tree. It can be `None`.' },
        { name: 'k', is: 'how many values you want. It can be `0`, or more than the tree holds.' },
      ],
      returns: 'a list of the `k` smallest values, smallest first (or all of them if there are fewer).',
      catch: 'In which order do you have to do the three things at a node for the smallest value to arrive first?',
    },
    'b230-dbg-counter': {
      task: 'It crashes before it can count anything. Read the error, then make the counting work.',
      inputs: [
        { name: 'root', is: 'the root of a search tree. It can be `None`.' },
        { name: 'x', is: 'the value whose position you want' },
      ],
      returns: 'a number: where `x` comes when the values are read smallest first (the smallest is 1), or `0` if it is not there.',
      catch: 'The helper changes two variables that belong to the outer function. Is it allowed to?',
    },
    'b230-kth-largest': {
      inputs: [
        { name: 'root', is: 'the root of a search tree with at least one node' },
        { name: 'k', is: 'which one you want: `1` is the largest, `2` the next largest, and so on' },
      ],
      returns: 'the `k`-th largest value in the tree.',
      catch: 'Smallest first is left, node, right. What changes if you want the biggest first?',
    },

    // ── LC 105 ───────────────────────────────────────────────────────────────
    'b105-join': {
      inputs: [
        { name: 'val', is: 'the value for the new root' },
        { name: 'left', is: 'the root of a finished tree, or `None`' },
        { name: 'right', is: 'the root of another finished tree, or `None`' },
      ],
      returns: 'the new root node, with the two trees hanging under it.',
      catch: 'Attach the trees you were given. Do not rebuild them.',
    },
    'b105-split-inorder': {
      inputs: [
        { name: 'inorder', is: 'the values of a tree in in-order (left subtree, root, right subtree), all different' },
        { name: 'root_val', is: 'the value at the root. It is somewhere in the list.' },
      ],
      returns: 'a tuple of two lists: the values before the root, and the values after it. The root is in neither.',
      catch: 'The root can be the first or the last item. What does a slice give you then?',
    },
    'b105-preorder-halves': {
      inputs: [
        { name: 'preorder', is: 'the values of a tree in pre-order (root, left subtree, right subtree)' },
        { name: 'left_size', is: 'how many nodes the left subtree has. It can be `0`.' },
      ],
      returns: 'a tuple of two lists: the left subtree’s values, then the right subtree’s values. The root is in neither.',
      catch: 'Where does the root sit in this list, and which slice has to step over it?',
    },
    'b105-dbg-slices': {
      task: 'The two in-order pieces are right. The two pre-order pieces are not. Fix the slices.',
      inputs: [
        { name: 'preorder', is: 'the tree’s values in pre-order: root first' },
        { name: 'inorder', is: 'the same tree’s values in in-order: root in the middle' },
      ],
      returns: 'a tuple of four lists: left subtree in pre-order, left subtree in in-order, right subtree in pre-order, right subtree in in-order.',
      catch: 'The left pieces must hold the same values as each other, just in a different order. Do they?',
    },
    'b105-from-sorted': {
      inputs: [{ name: 'nums', is: 'a sorted list of different numbers. It can be empty.' }],
      returns: 'the root node of the tree (or `None` for an empty list). The tests turn it back into a list with `tree_to_array`.',
      catch: 'The middle value becomes the root, so it must not appear again in either half.',
    },
    'b105-from-post-in': {
      inputs: [
        { name: 'postorder', is: 'the tree’s values in post-order: left subtree, right subtree, root' },
        { name: 'inorder', is: 'the same tree’s values in in-order: left subtree, root, right subtree' },
      ],
      returns: 'the root node of the rebuilt tree (or `None` when the lists are empty).',
      catch: 'Each list tells you something the other cannot. Which one names the root, and which one tells you how big the left subtree is?',
    },

    // ── LC 124 ───────────────────────────────────────────────────────────────
    'b124-trace-two-values': {
      task: PREDICT,
      catch: 'A node prints only after both of its children have finished. Work out the leaves first, then climb.',
    },
    'b124-diameter': {
      inputs: [{ name: 'root', is: 'the root of a tree. It can be `None`.' }],
      returns: 'a number: how many edges are on the longest path between any two nodes.',
      catch: 'The longest path does not have to go through the root. Where else could its highest point be?',
    },
    'b124-dbg-return-recorded': {
      task: 'Its answers are too big: it counts shapes that are not a single path. Make every number it adds up stand for a real path.',
      inputs: [{ name: 'root', is: 'the root of a tree. It can be `None`.' }],
      returns: 'a number: how many nodes are on the longest path between any two nodes.',
      catch: 'A path cannot fork. If it already uses both arms below a node, can it also continue up to that node’s parent?',
    },
    'b124-best-down': {
      inputs: [{ name: 'root', is: 'the root of a tree whose values can be negative. It can be `None`.' }],
      returns: 'a number: the largest sum of a path that starts at the root and only goes down. `0` for an empty tree.',
      catch: 'The root must be on the path even when it is negative. Going further down is a choice.',
    },
    'b124-through-root': {
      inputs: [{ name: 'root', is: 'the root of a tree with at least one node. Values can be negative.' }],
      returns: 'a number: the largest sum of a path whose highest node is the root.',
      catch: 'At the root the path may use both sides. One level lower, inside an arm, may it still use both?',
    },
    'b124-longest-same': {
      inputs: [{ name: 'root', is: 'the root of a tree. It can be `None`.' }],
      returns: 'a number: how many edges are on the longest path where every node holds the same value.',
      catch: 'What a node tells its parent and what it writes down as a possible answer are two different numbers. Which is which?',
    },
  },
  primers: [
    {
      id: 'bst-ordering',
      title: 'Binary search trees',
      skills: ['bst_property'],
      what: 'A **binary search tree** (BST) is a binary tree with one rule: for **every** node, everything in its left subtree is smaller and everything in its right subtree is bigger. So one comparison at a node tells you which side to go to, and the other side can be ignored. The rule is about whole subtrees, which means a node deep down is limited by **every** ancestor above it: a `low` and a `high` bound that tighten on the way down.',
      model: 'Binary search, but the tree has already picked every `mid` for you.',
      syntax: [
        { code: 'node = root\nwhile node:', note: 'Walk one path with a loop. No recursion needed.' },
        { code: '    if x < node.val:\n        node = node.left', note: 'Smaller: the answer can only be on the left.' },
        { code: '    elif x > node.val:\n        node = node.right', note: 'Bigger: only on the right.' },
        { code: '    else:\n        return node', note: 'Neither: this is the node.' },
        { code: 'if a < node.val and b < node.val:', note: 'Two values at once: move only while **both** are on the same side.' },
        { code: "def check(node, low, high):\n    ...\n    check(node.left, low, node.val)\n    check(node.right, node.val, high)", note: 'Carrying bounds: going left lowers the ceiling, going right raises the floor.' },
      ],
      example: {
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#        50
#       /  \\
#     30    70
#    /  \\     \\
#  20    40    90
root = TreeNode(50, TreeNode(30, TreeNode(20), TreeNode(40)), TreeNode(70, None, TreeNode(90)))

def path_to(root, x):
    path = []
    node = root
    while node:
        path.append(node.val)
        if x < node.val:
            node = node.left
        elif x > node.val:
            node = node.right
        else:
            break
    return path

def smallest(root):
    node = root
    while node.left:
        node = node.left
    return node.val

print(path_to(root, 40))
print(path_to(root, 60))       # not there: the walk falls off the tree
print(smallest(root))`,
        output: `[50, 30, 40]
[50, 70]
20`,
      },
      gotchas: [
        'Searching both sides (`f(left) or f(right)`) still works but throws the ordering away: O(n) instead of O(height).',
        'A tree can pass "left child < node < right child" at every node and still not be a BST. A grandchild can be on the wrong side of its grandparent.',
        'With two values, `or` in the direction test walks past the split point. You may only move when **both** are on the same side.',
        'Bounds are usually strict: a value equal to an ancestor is a duplicate, and a plain BST has none.',
      ],
    },
    {
      id: 'tree-inorder',
      title: 'In-order traversal',
      skills: ['tree_inorder'],
      what: '**In-order** means: finish the whole left subtree, then handle the node, then do the right subtree. On a search tree that visits the values from **smallest to largest**, so "the k-th smallest" is just "the k-th node visited". To count visits (or stop early) the helper needs state shared across all the calls: a list it appends to, or a counter declared `nonlocal`.',
      model: 'Reading the tree left to right, as if every node dropped straight down onto a line.',
      syntax: [
        { code: 'def visit(node):\n    if node is None:\n        return', note: 'Base case, as in every DFS.' },
        { code: '    visit(node.left)', note: 'Everything smaller first.' },
        { code: '    out.append(node.val)', note: 'Then this node. The position of this line is what makes it in-order.' },
        { code: '    visit(node.right)', note: 'Then everything bigger.' },
        { code: '    nonlocal count\n    count += 1', note: 'A counter owned by the outer function must be declared before the helper assigns to it.' },
        { code: '    if done:\n        return', note: 'Stopping early: check a shared flag or count at the top of each call.' },
      ],
      example: {
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#        50
#       /  \\
#     30    70
#    /  \\     \\
#  20    40    90
root = TreeNode(50, TreeNode(30, TreeNode(20), TreeNode(40)), TreeNode(70, None, TreeNode(90)))

def running_totals(root):
    total = 0
    out = []

    def visit(node):
        nonlocal total
        if node is None:
            return
        visit(node.left)
        total += node.val          # smallest values are added first
        out.append((node.val, total))
        visit(node.right)

    visit(root)
    return out

for val, total in running_totals(root):
    print(val, total)`,
        output: `20 20
30 50
40 90
50 140
70 210
90 300`,
      },
      gotchas: [
        '`count += 1` inside a helper without `nonlocal count` raises `UnboundLocalError`. Appending to a shared list needs no declaration.',
        'Passing a counter down as a plain argument does not work: each call gets its own copy, and the caller never sees the change.',
        'Moving the "handle the node" line changes the traversal: before both calls is pre-order, after both is post-order.',
        'The sorted order only holds for a search tree. On any other tree in-order is just one more visiting order.',
      ],
    },
    {
      id: 'tree-build',
      title: 'Building a tree from lists',
      skills: ['tree_build'],
      what: 'A function that **builds** a tree returns a node: it makes the root, calls itself to build the left and right subtrees from smaller pieces of the input, attaches them, and returns the root. With traversals the pieces come from two facts: **pre-order** starts with the root (post-order ends with it), and in the **in-order** list everything before the root is the left subtree. The root’s index in the in-order list is therefore the size of the left subtree, which tells you where to cut the other list.',
      model: 'Name the root, count how many nodes go left, cut both lists at that count, and hand each pair of pieces to a recursive call.',
      syntax: [
        { code: 'if not preorder:\n    return None', note: 'Nothing left to build: an empty subtree.' },
        { code: 'root = TreeNode(preorder[0])', note: 'Pre-order names the root first.' },
        { code: 'mid = inorder.index(root.val)', note: 'Where the root sits in-order = how many nodes are on its left.' },
        { code: 'inorder[:mid]\ninorder[mid + 1:]', note: 'In-order pieces: before the root, after the root.' },
        { code: 'preorder[1:mid + 1]\npreorder[mid + 1:]', note: 'Pre-order pieces: skip the root, take `mid` values, then the rest.' },
        { code: 'root.left = build(...)\nroot.right = build(...)\nreturn root', note: 'Attach what the recursive calls return, then return the root.' },
      ],
      example: {
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# A tree written as nested lists: [value, left, right], None for a gap
plan = ['tea', ['green', None, None], ['black', ['assam', None, None], None]]

def build(spec):
    if spec is None:
        return None
    root = TreeNode(spec[0])
    root.left = build(spec[1])       # a smaller piece builds the left subtree
    root.right = build(spec[2])
    return root

root = build(plan)
print(root.val, root.left.val, root.right.val)
print(root.right.left.val, root.right.right)

inorder = ['d', 'b', 'e', 'a', 'c']
mid = inorder.index('a')
print(mid, inorder[:mid], inorder[mid + 1:])`,
        output: `tea green black
assam None
3 ['d', 'b', 'e'] ['c']`,
      },
      gotchas: [
        'Forgetting `return root` (or the `return None` base case) leaves every parent with `None` children.',
        'The root is at the **front** of pre-order but in the **middle** of in-order, so the two lists are sliced differently. Off-by-one here puts the root inside a subtree.',
        'The two pieces handed to one recursive call must have the same length and hold the same values.',
        '`.index` and slicing each cost O(n), so this simple version is O(n²). A value-to-index dict removes the search.',
      ],
    },
    {
      id: 'tree-global-best',
      title: 'Return one thing, record another',
      skills: ['tree_global_best'],
      what: 'Some tree answers are a path that goes up one side of a node and down the other. A parent cannot extend a path like that, so a single return value is not enough. The DFS keeps **two** quantities: it **returns** what a parent can use (one arm: a height, or the best sum going straight down), and it **records** in an outer variable the best result that bends at the current node (left arm + right arm). The final answer is the recorded value, not what the helper returned.',
      model: 'Every node reports "my best single arm" upward, and quietly writes down "the best thing whose top is me".',
      syntax: [
        { code: 'best = 0', note: 'In the outer function: the answer so far.' },
        { code: 'def arm(node):\n    nonlocal best', note: 'The helper will assign to it.' },
        { code: '    left = arm(node.left)\n    right = arm(node.right)', note: 'Ask both children first (post-order).' },
        { code: '    best = max(best, left + right)', note: 'Record: both arms meet here.' },
        { code: '    return 1 + max(left, right)', note: 'Return: only the better arm can continue upward.' },
        { code: '    left = max(0, left)', note: 'With sums: an arm that would subtract is left out.' },
        { code: 'arm(root)\nreturn best', note: 'Run the helper once; the answer is the recorded value.' },
      ],
      example: {
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#        a
#       / \\
#      b   c
#     / \\
#    d   e
#   /
#  f
root = TreeNode('a', TreeNode('b', TreeNode('d', TreeNode('f')), TreeNode('e')), TreeNode('c'))

def most_lopsided(root):
    worst = 0

    def size(node):
        nonlocal worst
        if node is None:
            return 0
        left = size(node.left)
        right = size(node.right)
        worst = max(worst, abs(left - right))   # recorded: about this node only
        return 1 + left + right                 # returned: what the parent needs

    total = size(root)
    return total, worst

print(most_lopsided(root))`,
        output: `(6, 3)`,
      },
      gotchas: [
        'Returning the recorded value (`left + right`) lets a parent build a "path" that forks. Return one arm only.',
        'Returning what the helper returned from the outer function gives the root’s arm, not the best over the whole tree.',
        'Without `nonlocal best`, the first `best = ...` inside the helper raises `UnboundLocalError`.',
        'With negative values, start `best` at `float(\'-inf\')` (or the root’s value), not `0`: the best path may itself be negative.',
        'Clamp the **children’s** arms with `max(0, ...)`, never the node’s own value: the node must be on its own path.',
      ],
    },
  ],
}
