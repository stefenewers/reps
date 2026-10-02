import type { DayModule } from '@/lib/types'
import { capstone, choice, code, explain, fill, output, reorder, t } from './build'

const cold = { stage: 'retrieval' as const, repType: 'cold' as const }
const combine = { stage: 'combine' as const, repType: 'combine' as const }
const pattern = { stage: 'pattern' as const, repType: 'pattern' as const }

export const day: DayModule = {
  date: '2026-10-06',
  short: 'Trees',
  title: 'Recursion + trees',
  focus: 'Trust the recursive call: write the base case first, combine the children’s answers, and trace the call stack until tree DFS feels like a template.',
  sections: [
    // ───────────────────────────── Warm-up ─────────────────────────────
    {
      id: 'd06-warmup',
      title: 'Warm-up',
      summary: 'Cold reps on yesterday’s search and pointers, plus maps, pointers and windows.',
      exercises: [
        code({
          id: 'd06-warm-bs',
          title: 'Binary search, cold',
          ...cold,
          skills: ['binary_search', 'mid_calc', 'search_invariant'],
          prompt: 'Write `find(nums, x)` for a sorted list: index of `x` or -1, in O(log n).',
          starterCode: `def find(nums, x):\n    pass\n`,
          solution: `def find(nums, x):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == x:
            return mid
        if nums[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          tests: [t.eq('find([1, 4, 6, 9, 13], 9)', '3'), t.eq('find([1, 4, 6, 9, 13], 5)', '-1'), t.hidden('find([], 1)', '-1'), t.hidden('find([2], 2)', '0')],
          hints: ['lo <= hi; mid + 1 / mid - 1.'],
          signature: 'bs:cold',
          minutes: 6,
        }),
        code({
          id: 'd06-warm-reverse',
          title: 'Reverse a linked list, cold',
          ...cold,
          skills: ['linked_list_reassignment', 'linked_list_traversal'],
          prompt: 'Write `reverse(head)` that reverses a linked list in place and returns the new head.',
          starterCode: `def reverse(head):\n    pass\n`,
          solution: `def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
`,
          tests: [t.eq('list_to_array(reverse(build_list([1, 2, 3])))', '[3, 2, 1]'), t.hidden('reverse(None)', 'None'), t.hidden('list_to_array(reverse(build_list([8])))', '[8]')],
          hints: ['prev, curr, nxt. Save, flip, advance.'],
          signature: 'll:reverse-cold',
          minutes: 6,
        }),
        code({
          id: 'd06-warm-from-values',
          title: 'Dummy head, cold',
          ...cold,
          skills: ['dummy_node', 'linked_list_traversal'],
          prompt: 'Write `doubled(head)` returning a **new** linked list whose values are each original value times two. Use a dummy node.',
          starterCode: `def doubled(head):\n    pass\n`,
          solution: `def doubled(head):
    dummy = tail = ListNode()
    while head:
        tail.next = ListNode(head.val * 2)
        tail = tail.next
        head = head.next
    return dummy.next
`,
          tests: [t.eq('list_to_array(doubled(build_list([1, 2, 3])))', '[2, 4, 6]'), t.hidden('doubled(None)', 'None')],
          hints: ['dummy + tail; attach new node; advance both pointers; return dummy.next.'],
          signature: 'dummy:map-copy',
          minutes: 6,
        }),
        code({
          id: 'd06-warm-anagram',
          title: 'Same letters (frequency map)',
          ...cold,
          skills: ['frequency_map', 'dict_get'],
          prompt: 'Write `same_letters(a, b)` returning `True` if the two strings use exactly the same letters the same number of times. Build counts with `.get()`; no `sorted` or `Counter`.',
          starterCode: `def same_letters(a, b):\n    pass\n`,
          solution: `def same_letters(a, b):
    if len(a) != len(b):
        return False
    counts = {}
    for ch in a:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in b:
        counts[ch] = counts.get(ch, 0) - 1
        if counts[ch] < 0:
            return False
    return True
`,
          tests: [t.eq('same_letters("listen", "silent")', 'True'), t.eq('same_letters("aab", "abb")', 'False'), t.hidden('same_letters("", "")', 'True'), t.hidden('same_letters("a", "ab")', 'False')],
          hints: ['Count one string up, the other down.', 'counts[ch] = counts.get(ch, 0) + 1.'],
          signature: 'freq-map:anagram',
          minutes: 6,
        }),
        code({
          id: 'd06-warm-profit',
          title: 'Best single trade (running min)',
          ...cold,
          skills: ['state_tracking', 'for_loop'],
          prompt: 'Write `best_gain(prices)`: the largest `prices[j] - prices[i]` with `i < j`, or 0 if no gain is possible.',
          starterCode: `def best_gain(prices):\n    pass\n`,
          solution: `def best_gain(prices):
    low = float("inf")
    best = 0
    for p in prices:
        low = min(low, p)
        best = max(best, p - low)
    return best
`,
          tests: [t.eq('best_gain([7, 1, 5, 3, 6, 4])', '5'), t.eq('best_gain([5, 4, 3])', '0'), t.hidden('best_gain([])', '0'), t.hidden('best_gain([2, 9])', '7')],
          hints: ['Track the lowest price seen so far.', 'Each day: update low, then best = max(best, p - low).'],
          signature: 'state:running-min',
          minutes: 5,
        }),
        code({
          id: 'd06-warm-unique-window',
          title: 'Longest run without repeats',
          ...cold,
          difficulty: 3,
          skills: ['sliding_window', 'window_state', 'set_membership'],
          prompt: 'Write `longest_unique(s)`: the length of the longest substring with no repeated character. Variable-size window with a set.',
          starterCode: `def longest_unique(s):\n    pass\n`,
          solution: `def longest_unique(s):
    seen = set()
    left = 0
    best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best
`,
          tests: [t.eq('longest_unique("abcabcbb")', '3'), t.eq('longest_unique("bbbb")', '1'), t.hidden('longest_unique("")', '0'), t.hidden('longest_unique("pwwkew")', '3'), t.hidden('longest_unique("abcdef")', '6')],
          hints: ['Grow right; shrink left while the new char is a duplicate.', 'Window size is right - left + 1.'],
          signature: 'window:longest-unique',
          minutes: 8,
        }),
      ],
    },

    // ───────────────────────────── Functions ─────────────────────────────
    {
      id: 'd06-functions',
      title: 'Functions',
      summary: 'Parameters, return values and helpers: the parts recursion is made of.',
      exercises: [
        output({
          id: 'd06-fn-print-vs-return',
          title: 'print is not return',
          skills: ['functions'],
          prompt: 'Predict the output.',
          code: `def f(n):
    print(n * 2)

x = f(3)
print(x)`,
          expectedOutput: '6\nNone',
          note: 'A function without a `return` gives back None. Recursive functions must **return** their answer so the caller can use it.',
          explanation: 'f prints 6 but returns nothing, so x is None. A recursive call whose result vanishes like this is the #1 tree-recursion bug.',
          signature: 'trace:fn-print-return',
          important: true,
        }),
        output({
          id: 'd06-fn-compose',
          title: 'Functions calling functions',
          skills: ['functions'],
          prompt: 'Predict the output.',
          code: `def double(n):
    return n * 2

def add_then_double(a, b):
    return double(a + b)

print(add_then_double(2, 3), double(double(1)))`,
          expectedOutput: '10 4',
          explanation: 'Inner calls finish first and hand their return value outward. Recursion is the same thing, with the function calling itself.',
          signature: 'trace:fn-compose',
        }),
        output({
          id: 'd06-fn-params',
          title: 'What a parameter can change',
          skills: ['functions', 'list_append'],
          prompt: 'Predict the output.',
          code: `def change(nums, k):
    nums.append(k)
    k = 100
    nums = [0]

vals = [1]
k = 5
change(vals, k)
print(vals, k)`,
          expectedOutput: '[1, 5] 5',
          explanation: 'Mutating the list the caller passed (append) is visible outside. Re-assigning a parameter name (k = 100, nums = [0]) only changes the local name. That is why a shared `out` list works across recursive calls.',
          signature: 'trace:fn-mutate-vs-rebind',
          minutes: 2,
          important: true,
        }),
        fill({
          id: 'd06-fn-fill-return',
          title: 'Fill: return a value',
          skills: ['functions', 'conditionals'],
          prompt: 'Fill in the return so `last(nums)` gives the last item, or `None` for an empty list.',
          starterCode: `def last(nums):
    return ____
`,
          solution: `def last(nums):
    return nums[-1] if nums else None
`,
          tests: [t.eq('last([4, 5, 6])', '6'), t.eq('last([])', 'None')],
          hints: ['A conditional expression: A if cond else B.'],
          signature: 'fill:fn-return-expr',
        }),
        code({
          id: 'd06-fn-tuple',
          title: 'Return two things',
          skills: ['functions', 'tuples'],
          prompt: 'Write `low_high(nums)` returning a tuple `(smallest, largest)` in one pass. `nums` is non-empty. No `min`/`max` on the whole list.',
          starterCode: `def low_high(nums):\n    pass\n`,
          solution: `def low_high(nums):
    low = high = nums[0]
    for x in nums:
        if x < low:
            low = x
        if x > high:
            high = x
    return low, high
`,
          tests: [t.eq('low_high([3, 9, 1, 4])', '(1, 9)'), t.eq('low_high([7])', '(7, 7)'), t.hidden('low_high([-2, -8, -1])', '(-8, -1)')],
          hints: ['Start both at nums[0].', '`return low, high` builds a tuple.'],
          signature: 'fn:return-tuple',
          minutes: 5,
        }),
        code({
          id: 'd06-fn-helper',
          title: 'Inner helper + shared list',
          skills: ['functions', 'list_append'],
          prompt: 'Write `collect_big(nums, limit)` that defines an inner function `visit(x)` which appends `x` to an outer list `out` when `x > limit`. Call `visit` on every number and return `out`.\n\nThis "helper that writes into an outer list" is exactly how tree traversals collect values.',
          starterCode: `def collect_big(nums, limit):
    out = []

    def visit(x):
        pass

    for x in nums:
        visit(x)
    return out
`,
          solution: `def collect_big(nums, limit):
    out = []

    def visit(x):
        if x > limit:
            out.append(x)

    for x in nums:
        visit(x)
    return out
`,
          tests: [t.eq('collect_big([1, 8, 3, 9], 5)', '[8, 9]'), t.eq('collect_big([1, 2], 5)', '[]'), t.hidden('collect_big([6, 5, 7], 5)', '[6, 7]')],
          hints: ['The inner function can see `out` and `limit`.', 'out.append(x) mutates the list; no return needed.'],
          signature: 'fn:inner-helper-collect',
          minutes: 5,
        }),
      ],
    },

    // ───────────────────────────── Recursion ─────────────────────────────
    {
      id: 'd06-recursion',
      title: 'Recursion',
      summary: 'Base case, smaller call, combine. Trace the call stack until it is boring.',
      exercises: [
        choice({
          id: 'd06-rec-base',
          title: 'What is a base case?',
          skills: ['recursion_base_case'],
          prompt: 'In a recursive function, what is the base case?',
          options: [
            'An input small enough to answer directly, without another recursive call',
            'The first call made by the user',
            'The largest input the function can handle',
            'The line that calls the function again',
          ],
          answer: 0,
          note: 'Recursive shape: `if <smallest input>: return <direct answer>` then `return <combine>(f(smaller))`.',
          signature: 'choice:rec-base-case',
        }),
        output({
          id: 'd06-rec-countdown',
          title: 'Work before the call',
          skills: ['recursion_base_case'],
          prompt: 'Predict the output.',
          code: `def countdown(n):
    if n == 0:
        print("go")
        return
    print(n)
    countdown(n - 1)

countdown(3)`,
          expectedOutput: '3\n2\n1\ngo',
          explanation: 'Each call prints first, then goes deeper. Printing before the recursive call happens on the way down.',
          signature: 'trace:rec-before-call',
        }),
        output({
          id: 'd06-rec-unwind',
          title: 'Work after the call',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: 'Predict the output. The print is now **after** the recursive call.',
          code: `def up(n):
    if n == 0:
        return
    up(n - 1)
    print(n)

up(3)`,
          expectedOutput: '1\n2\n3',
          explanation: 'up(3) waits for up(2), which waits for up(1), which waits for up(0). They print as the stack unwinds, deepest first. This is why postorder visits children before the parent.',
          signature: 'trace:rec-after-call',
          minutes: 2,
          important: true,
        }),
        output({
          id: 'd06-rec-fact-stack',
          title: 'Call stack: factorial',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: 'Predict the output. Write each call on a new line of paper, indented one level deeper.',
          code: `def fact(n):
    print("call", n)
    if n <= 1:
        return 1
    result = n * fact(n - 1)
    print("return", result)
    return result

print(fact(4))`,
          expectedOutput: 'call 4\ncall 3\ncall 2\ncall 1\nreturn 2\nreturn 6\nreturn 24\n24',
          explanation: 'All four calls are open at once. fact(1) hits the base case and returns 1 without printing "return"; then each waiting call multiplies and returns.',
          signature: 'trace:rec-factorial-stack',
          minutes: 2.5,
          important: true,
        }),
        output({
          id: 'd06-rec-sum-stack',
          title: 'Call stack: sum of a list',
          skills: ['recursion_return'],
          prompt: 'Predict the output.',
          code: `def total(nums):
    if not nums:
        return 0
    rest = total(nums[1:])
    print(nums[0], "+", rest)
    return nums[0] + rest

print(total([2, 5, 1]))`,
          expectedOutput: '1 + 0\n5 + 1\n2 + 6\n8',
          explanation: 'Each call trusts total(rest) to be correct and adds its own first item. The prints happen deepest first.',
          signature: 'trace:rec-sum-list',
          minutes: 2.5,
        }),
        choice({
          id: 'd06-rec-no-base',
          title: 'No base case',
          skills: ['recursion_base_case'],
          prompt: 'What happens when you call `count(3)`?',
          code: `def count(n):
    return 1 + count(n - 1)`,
          options: ['RecursionError: it never stops calling itself', 'Returns 3', 'Returns 4', 'Returns 0'],
          answer: 0,
          explanation: 'Nothing stops at 0, so n goes 3, 2, 1, 0, -1, ... until Python’s recursion limit. Write the base case first, always.',
          signature: 'choice:rec-missing-base',
        }),
        fill({
          id: 'd06-rec-fill-base',
          title: 'Fill: base case value',
          skills: ['recursion_base_case'],
          prompt: '`power(b, e)` computes `b` to the power `e` for `e >= 0`. Fill in the base case result.',
          starterCode: `def power(b, e):
    if e == 0:
        return ____
    return b * power(b, e - 1)
`,
          solution: `def power(b, e):
    if e == 0:
        return 1
    return b * power(b, e - 1)
`,
          tests: [t.eq('power(2, 5)', '32'), t.eq('power(7, 0)', '1'), t.hidden('power(3, 1)', '3')],
          hints: ['Anything to the power 0 is...'],
          signature: 'fill:rec-base-value',
        }),
        fill({
          id: 'd06-rec-fill-combine',
          title: 'Fill: the recursive return',
          skills: ['recursion_return'],
          prompt: 'Fill in the recursive combination.',
          starterCode: `def fact(n):
    if n <= 1:
        return 1
    return n * ____
`,
          solution: `def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)
`,
          tests: [t.eq('fact(5)', '120'), t.eq('fact(1)', '1'), t.hidden('fact(0)', '1')],
          hints: ['Call yourself on a smaller input.'],
          signature: 'fill:rec-combine',
        }),
        code({
          id: 'd06-rec-sum-to',
          title: 'Sum 1..n recursively',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: 'Write `sum_to(n)` returning `1 + 2 + ... + n` recursively (no loop, no formula). `sum_to(0)` is 0.',
          starterCode: `def sum_to(n):\n    pass\n`,
          solution: `def sum_to(n):
    if n == 0:
        return 0
    return n + sum_to(n - 1)
`,
          tests: [t.eq('sum_to(4)', '10'), t.eq('sum_to(0)', '0'), t.hidden('sum_to(1)', '1'), t.hidden('sum_to(100)', '5050')],
          hints: ['Base case: n == 0.', 'sum_to(n) = n + sum_to(n - 1).'],
          signature: 'rec:sum-to-n',
          minutes: 4,
        }),
        code({
          id: 'd06-rec-index-param',
          title: 'Recursion with an index parameter',
          skills: ['recursion_base_case', 'recursion_return', 'list_index'],
          prompt: 'Write `sum_from(nums, i)` returning the sum of `nums[i:]` recursively, by moving the index instead of slicing. `sum_from(nums, 0)` is the whole sum.',
          starterCode: `def sum_from(nums, i):\n    pass\n`,
          solution: `def sum_from(nums, i):
    if i == len(nums):
        return 0
    return nums[i] + sum_from(nums, i + 1)
`,
          tests: [t.eq('sum_from([3, 4, 5], 0)', '12'), t.eq('sum_from([3, 4, 5], 2)', '5'), t.hidden('sum_from([], 0)', '0'), t.hidden('sum_from([1, -1, 1], 0)', '1')],
          hints: ['Base case: i has run off the end.', 'Combine nums[i] with the answer for i + 1.'],
          explanation: 'An index parameter avoids copying a slice on every call (slicing makes the slice version O(n^2)). Extra parameters that carry state downward are the "recursive state" you will use in trees.',
          signature: 'rec:index-param',
          minutes: 5,
        }),
        code({
          id: 'd06-rec-reverse-str',
          title: 'Reverse a string recursively',
          skills: ['recursion_base_case', 'recursion_return', 'slicing'],
          prompt: 'Write `rev(s)` recursively (no `[::-1]`, no loop).',
          starterCode: `def rev(s):\n    pass\n`,
          solution: `def rev(s):
    if len(s) <= 1:
        return s
    return rev(s[1:]) + s[0]
`,
          tests: [t.eq('rev("abc")', '"cba"'), t.eq('rev("")', '""'), t.hidden('rev("x")', '"x"'), t.hidden('rev("racecars")', '"sracecar"')],
          hints: ['Reverse the rest, then put the first character at the end.'],
          signature: 'rec:reverse-string',
          minutes: 5,
        }),
        code({
          id: 'd06-rec-pal',
          title: 'Palindrome, recursively',
          ...combine,
          skills: ['recursion_base_case', 'recursion_return', 'two_pointer'],
          prompt: 'Write `pal(s, i, j)` that checks whether `s[i..j]` is a palindrome by recursion, moving `i` and `j` inward like two pointers. The caller uses `pal(s, 0, len(s) - 1)`.',
          starterCode: `def pal(s, i, j):\n    pass\n`,
          solution: `def pal(s, i, j):
    if i >= j:
        return True
    if s[i] != s[j]:
        return False
    return pal(s, i + 1, j - 1)
`,
          tests: [t.eq('pal("level", 0, 4)', 'True'), t.eq('pal("levels", 0, 5)', 'False'), t.hidden('pal("", 0, -1)', 'True'), t.hidden('pal("ab", 0, 1)', 'False'), t.hidden('pal("a", 0, 0)', 'True')],
          hints: ['Two base cases: pointers met (True) or a mismatch (False).', 'Otherwise recurse with i + 1, j - 1.'],
          signature: 'rec:two-pointer-palindrome',
          minutes: 7,
        }),
        code({
          id: 'd06-rec-list-len',
          title: 'Linked list length, recursively',
          ...combine,
          skills: ['recursion_base_case', 'recursion_return', 'listnode'],
          prompt: 'Write `size(head)` returning the number of nodes in a linked list, recursively. A linked list is "a node, then a smaller linked list".',
          starterCode: `def size(head):\n    pass\n`,
          solution: `def size(head):
    if head is None:
        return 0
    return 1 + size(head.next)
`,
          tests: [t.eq('size(build_list([4, 5, 6]))', '3'), t.eq('size(None)', '0'), t.hidden('size(build_list([1]))', '1')],
          hints: ['Base case: the empty list, None.', 'This node counts 1, plus the size of the rest.'],
          explanation: 'Base case on None, then 1 + recurse on the child: exactly the shape of counting tree nodes, with one child instead of two.',
          signature: 'rec:linked-list-length',
          minutes: 5,
          important: true,
        }),
        reorder({
          id: 'd06-rec-reorder-fib',
          title: 'Reassemble fib',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: 'Put `fib` in order: `fib(0) = 0`, `fib(1) = 1`, otherwise the sum of the previous two.',
          lines: [
            'def fib(n):',
            '    if n < 2:',
            '        return n',
            '    return fib(n - 1) + fib(n - 2)',
          ],
          tests: [t.eq('fib(0)', '0'), t.eq('fib(1)', '1'), t.eq('fib(7)', '13')],
          explanation: 'Two recursive calls combined with +: the same shape as combining a left and a right subtree.',
          minutes: 3,
          signature: 'reorder:rec-fib',
        }),
      ],
    },

    // ───────────────────────────── TreeNode ─────────────────────────────
    {
      id: 'd06-treenode',
      title: 'TreeNode',
      summary: 'val, left, right, and None where a child is missing.',
      exercises: [
        choice({
          id: 'd06-tn-leaf',
          title: 'What is a leaf?',
          skills: ['treenode'],
          prompt: 'Which node is a leaf?',
          options: ['A node whose left and right are both None', 'The root', 'Any node with exactly one child', 'A node whose val is 0'],
          answer: 0,
          note: 'class TreeNode: val, left, right. Missing children are None. An empty tree is just root = None.',
          signature: 'choice:tree-leaf',
        }),
        output({
          id: 'd06-tn-manual',
          title: 'Build by hand',
          skills: ['treenode'],
          prompt: 'Predict the output. `TreeNode(val, left, right)` already exists.',
          code: `root = TreeNode(1, TreeNode(2), TreeNode(3, TreeNode(4)))
print(root.val, root.left.val, root.right.val)
print(root.right.left.val, root.left.left)`,
          expectedOutput: '1 2 3\n4 None',
          explanation: 'TreeNode(3, TreeNode(4)) gives 3 a left child 4. Node 2 was created with no children, so its left is None.',
          signature: 'trace:tree-manual',
        }),
        output({
          id: 'd06-tn-level-order',
          title: 'Read a level-order list',
          skills: ['treenode'],
          prompt: 'Tests describe trees as level-order lists with `None` for gaps. Predict the output.',
          code: `root = build_tree([5, 3, 8, None, 4])
print(root.left.val, root.right.val)
print(root.left.left, root.left.right.val)`,
          expectedOutput: '3 8\nNone 4',
          explanation: 'Level by level, left to right: 5; then 3 and 8; then 3’s children are None and 4.',
          signature: 'trace:tree-level-order',
          minutes: 2,
        }),
        code({
          id: 'd06-tn-one-line',
          title: 'One line: a three-node tree',
          stage: 'recall',
          skills: ['treenode'],
          prompt: 'Write one line that sets `root` to a tree with 2 at the top, 1 on the left and 3 on the right, using `TreeNode(...)`.',
          starterCode: `root = None\n`,
          solution: `root = TreeNode(2, TreeNode(1), TreeNode(3))\n`,
          tests: [t.check('tree is [2, 1, 3]', 'assert tree_to_array(root) == [2, 1, 3], tree_to_array(root)')],
          hints: ['TreeNode(val, left, right).'],
          signature: 'recall:treenode-nested',
          minutes: 2,
        }),
        code({
          id: 'd06-tn-is-leaf',
          title: 'is_leaf',
          skills: ['treenode', 'conditionals'],
          prompt: 'Write `is_leaf(node)` returning `True` if `node` exists and has no children. `is_leaf(None)` is `False`.',
          starterCode: `def is_leaf(node):\n    pass\n`,
          solution: `def is_leaf(node):
    return node is not None and node.left is None and node.right is None
`,
          tests: [t.eq('is_leaf(TreeNode(1))', 'True'), t.eq('is_leaf(build_tree([1, 2]))', 'False'), t.hidden('is_leaf(None)', 'False'), t.hidden('is_leaf(build_tree([1, None, 2]))', 'False')],
          hints: ['Check node first, then both children.'],
          signature: 'tree:is-leaf',
          minutes: 4,
        }),
        code({
          id: 'd06-tn-children-sum',
          title: 'Sum the children',
          skills: ['treenode', 'conditionals'],
          prompt: 'Write `children_sum(node)` returning the sum of the values of `node`’s direct children (0 for a missing child). `node` is not None.',
          starterCode: `def children_sum(node):\n    pass\n`,
          solution: `def children_sum(node):
    total = 0
    if node.left:
        total += node.left.val
    if node.right:
        total += node.right.val
    return total
`,
          tests: [t.eq('children_sum(build_tree([1, 2, 3]))', '5'), t.eq('children_sum(build_tree([1, None, 7]))', '7'), t.hidden('children_sum(TreeNode(9))', '0')],
          hints: ['Reading .val on None crashes; check each child first.'],
          signature: 'tree:children-sum',
          minutes: 4,
        }),
      ],
    },

    // ───────────────────────────── DFS ─────────────────────────────
    {
      id: 'd06-dfs',
      title: 'Tree DFS',
      summary: 'Preorder, inorder, postorder, then combine children’s answers and carry state down.',
      exercises: [
        output({
          id: 'd06-dfs-pre-trace',
          title: 'Preorder trace',
          skills: ['tree_dfs'],
          prompt: 'The tree is 1 with children 2 and 3; 2 has children 4 and 5. Predict the output.',
          code: `def pre(node):
    if node is None:
        return
    print(node.val)
    pre(node.left)
    pre(node.right)

pre(build_tree([1, 2, 3, 4, 5]))`,
          expectedOutput: '1\n2\n4\n5\n3',
          note: 'Preorder: node, left, right. Inorder: left, node, right. Postorder: left, right, node.',
          explanation: 'Preorder handles a node before diving into its children, finishing the whole left subtree before the right.',
          signature: 'trace:dfs-preorder',
          minutes: 2,
          important: true,
        }),
        output({
          id: 'd06-dfs-in-post-trace',
          title: 'Inorder and postorder',
          skills: ['tree_dfs'],
          prompt: 'Same tree. Predict the output.',
          code: `def ino(node, out):
    if node is None:
        return
    ino(node.left, out)
    out.append(node.val)
    ino(node.right, out)

def post(node, out):
    if node is None:
        return
    post(node.left, out)
    post(node.right, out)
    out.append(node.val)

root = build_tree([1, 2, 3, 4, 5])
a, b = [], []
ino(root, a)
post(root, b)
print(a)
print(b)`,
          expectedOutput: '[4, 2, 5, 1, 3]\n[4, 5, 2, 3, 1]',
          explanation: 'Moving one line (the append) changes the order. Postorder puts the root last because both children must finish first.',
          signature: 'trace:dfs-in-post',
          minutes: 4,
        }),
        choice({
          id: 'd06-dfs-which-order',
          title: 'Which order?',
          skills: ['tree_dfs'],
          prompt: 'To compute a node’s height you need both children’s heights first. Which traversal order does that computation follow?',
          options: ['Postorder', 'Preorder', 'Inorder', 'Level order'],
          answer: 0,
          explanation: 'Children first, then combine at the node: postorder. Most "return a value from each subtree" problems (depth, size, balanced) are postorder.',
          signature: 'choice:dfs-order',
        }),
        fill({
          id: 'd06-dfs-fill-base',
          title: 'Fill: the tree base case',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: 'Fill in what an empty tree contributes to the node count.',
          starterCode: `def count(root):
    if root is None:
        return ____
    return 1 + count(root.left) + count(root.right)
`,
          solution: `def count(root):
    if root is None:
        return 0
    return 1 + count(root.left) + count(root.right)
`,
          tests: [t.eq('count(build_tree([1, 2, 3, 4]))', '4'), t.eq('count(None)', '0')],
          hints: ['How many nodes are in nothing?'],
          signature: 'fill:dfs-base',
        }),
        code({
          id: 'd06-dfs-preorder',
          title: 'Preorder into a list',
          skills: ['tree_dfs', 'list_append', 'functions'],
          prompt: 'Write `preorder(root)` returning the values in preorder. Use an inner helper `visit(node)` that appends to an outer list.',
          starterCode: `def preorder(root):
    out = []

    def visit(node):
        pass

    visit(root)
    return out
`,
          solution: `def preorder(root):
    out = []

    def visit(node):
        if node is None:
            return
        out.append(node.val)
        visit(node.left)
        visit(node.right)

    visit(root)
    return out
`,
          tests: [t.eq('preorder(build_tree([1, 2, 3, 4, 5]))', '[1, 2, 4, 5, 3]'), t.eq('preorder(None)', '[]'), t.hidden('preorder(build_tree([1, None, 2, 3]))', '[1, 2, 3]')],
          hints: ['Base case: None → return.', 'Append, then visit left, then right.'],
          signature: 'dfs:preorder-shared-list',
          minutes: 6,
          important: true,
        }),
        code({
          id: 'd06-dfs-inorder-return',
          title: 'Inorder by returning lists',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Write `inorder(root)` **without** a shared list: each call returns its own list, built from the children’s lists.',
          starterCode: `def inorder(root):\n    pass\n`,
          solution: `def inorder(root):
    if root is None:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)
`,
          tests: [t.eq('inorder(build_tree([1, 2, 3, 4, 5]))', '[4, 2, 5, 1, 3]'), t.eq('inorder(None)', '[]'), t.hidden('inorder(build_tree([2, 1, 3]))', '[1, 2, 3]')],
          hints: ['Empty tree → empty list.', 'left list + [val] + right list.'],
          explanation: 'Two styles: share one list (state) or combine returned values. Both are O(n) visits; the shared list avoids the extra list copies.',
          signature: 'dfs:inorder-return-combine',
          minutes: 6,
        }),
        code({
          id: 'd06-dfs-count',
          title: 'Count nodes',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Write `count_nodes(root)` from scratch.',
          starterCode: `def count_nodes(root):\n    pass\n`,
          solution: `def count_nodes(root):
    if root is None:
        return 0
    return 1 + count_nodes(root.left) + count_nodes(root.right)
`,
          tests: [t.eq('count_nodes(build_tree([1, 2, 3, None, 5]))', '4'), t.eq('count_nodes(None)', '0'), t.hidden('count_nodes(TreeNode(1))', '1')],
          hints: ['None → 0. Otherwise 1 + left count + right count.'],
          signature: 'dfs:count-nodes',
          minutes: 4,
        }),
        code({
          id: 'd06-dfs-max',
          title: 'Largest value',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Write `tree_max(root)` returning the largest value in the tree, or `float("-inf")` for an empty tree. Values may be negative.',
          starterCode: `def tree_max(root):\n    pass\n`,
          solution: `def tree_max(root):
    if root is None:
        return float("-inf")
    return max(root.val, tree_max(root.left), tree_max(root.right))
`,
          tests: [t.eq('tree_max(build_tree([3, 9, 1, None, 4]))', '9'), t.eq('tree_max(build_tree([-5, -2, -9]))', '-2'), t.hidden('tree_max(None)', 'float("-inf")'), t.hidden('tree_max(build_tree([1, None, 2, None, 30]))', '30')],
          hints: ['The empty tree must not win a max: what value never wins?', 'max of three things: this val, left max, right max.'],
          signature: 'dfs:tree-max',
          minutes: 6,
        }),
        code({
          id: 'd06-dfs-leaves',
          title: 'Count leaves',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: 'Write `count_leaves(root)`. Two base cases this time.',
          starterCode: `def count_leaves(root):\n    pass\n`,
          solution: `def count_leaves(root):
    if root is None:
        return 0
    if root.left is None and root.right is None:
        return 1
    return count_leaves(root.left) + count_leaves(root.right)
`,
          tests: [t.eq('count_leaves(build_tree([1, 2, 3, 4, 5]))', '3'), t.eq('count_leaves(None)', '0'), t.hidden('count_leaves(TreeNode(7))', '1'), t.hidden('count_leaves(build_tree([1, 2, None, 3]))', '1')],
          hints: ['None → 0. A leaf → 1.', 'Otherwise add the leaves of both sides (do not count this node).'],
          signature: 'dfs:count-leaves',
          minutes: 6,
        }),
        code({
          id: 'd06-dfs-contains',
          title: 'Search the tree',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Write `has(root, x)` returning `True` if any node holds `x`. The tree is **not** sorted, so check everywhere.',
          starterCode: `def has(root, x):\n    pass\n`,
          solution: `def has(root, x):
    if root is None:
        return False
    if root.val == x:
        return True
    return has(root.left, x) or has(root.right, x)
`,
          tests: [t.eq('has(build_tree([5, 1, 8, None, 3]), 3)', 'True'), t.eq('has(build_tree([5, 1, 8]), 4)', 'False'), t.hidden('has(None, 1)', 'False'), t.hidden('has(TreeNode(2), 2)', 'True')],
          hints: ['Combine the children’s booleans with `or`.', '`or` stops early if the left side already found it.'],
          signature: 'dfs:contains',
          minutes: 5,
        }),
        output({
          id: 'd06-dfs-depth-param',
          title: 'Carrying depth down',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: 'Predict the output.',
          code: `def show(node, depth):
    if node is None:
        return
    print(node.val, depth)
    show(node.left, depth + 1)
    show(node.right, depth + 1)

show(build_tree([1, 2, 3, None, 4]), 0)`,
          expectedOutput: '1 0\n2 1\n4 2\n3 1',
          explanation: 'Each call gets its own `depth`. Passing depth + 1 down never changes the parent’s depth, so no undo is needed.',
          signature: 'trace:dfs-depth-param',
          minutes: 2,
        }),
        code({
          id: 'd06-dfs-at-depth',
          title: 'Values at depth d',
          ...pattern,
          skills: ['tree_dfs', 'list_append'],
          prompt: 'Write `at_depth(root, d)` returning the values at depth `d` (root is depth 0), left to right. Carry the depth down as a parameter.',
          starterCode: `def at_depth(root, d):\n    pass\n`,
          solution: `def at_depth(root, d):
    out = []

    def go(node, depth):
        if node is None:
            return
        if depth == d:
            out.append(node.val)
            return
        go(node.left, depth + 1)
        go(node.right, depth + 1)

    go(root, 0)
    return out
`,
          tests: [t.eq('at_depth(build_tree([1, 2, 3, 4, 5, None, 6]), 2)', '[4, 5, 6]'), t.eq('at_depth(build_tree([1, 2, 3]), 0)', '[1]'), t.hidden('at_depth(build_tree([1, 2, 3]), 5)', '[]'), t.hidden('at_depth(None, 0)', '[]')],
          hints: ['Helper with (node, depth).', 'When depth == d, record and stop going deeper.', 'Visit left before right so the order is left to right.'],
          signature: 'dfs:depth-param-collect',
          minutes: 8,
        }),
        code({
          id: 'd06-dfs-path-sum',
          title: 'Root-to-leaf sum',
          ...pattern,
          difficulty: 3,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Write `has_path_sum(root, target)`: `True` if some path from the root down to a **leaf** has values adding up to `target`. Empty tree → `False`.',
          starterCode: `def has_path_sum(root, target):\n    pass\n`,
          solution: `def has_path_sum(root, target):
    if root is None:
        return False
    remaining = target - root.val
    if root.left is None and root.right is None:
        return remaining == 0
    return has_path_sum(root.left, remaining) or has_path_sum(root.right, remaining)
`,
          tests: [
            t.eq('has_path_sum(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2]), 22)', 'True'),
            t.eq('has_path_sum(build_tree([1, 2, 3]), 5)', 'False'),
            t.hidden('has_path_sum(None, 0)', 'False'),
            t.hidden('has_path_sum(build_tree([1, 2]), 1)', 'False'),
            t.hidden('has_path_sum(build_tree([-2, None, -3]), -5)', 'True'),
          ],
          hints: ['Pass down how much is still needed.', 'Subtract this node’s value before going deeper.', 'Only a leaf can finish a path: check remaining == 0 there.', 'Otherwise: left path or right path.'],
          signature: 'dfs:path-sum',
          minutes: 10,
        }),
        reorder({
          id: 'd06-dfs-reorder-sum',
          title: 'Reassemble tree sum',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Put `tree_sum` in order.',
          lines: [
            'def tree_sum(root):',
            '    if root is None:',
            '        return 0',
            '    left = tree_sum(root.left)',
            '    right = tree_sum(root.right)',
            '    return root.val + left + right',
          ],
          tests: [t.eq('tree_sum(build_tree([1, 2, 3, 4]))', '10'), t.eq('tree_sum(None)', '0')],
          minutes: 3,
          signature: 'reorder:dfs-sum',
        }),
        output({
          id: 'd06-dfs-height-trace',
          title: 'Trace a height computation',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Predict the output.',
          code: `def height(node):
    if node is None:
        return 0
    l = height(node.left)
    r = height(node.right)
    print(node.val, l, r)
    return 1 + max(l, r)

print(height(build_tree([1, 2, 3, None, 4])))`,
          expectedOutput: '4 0 0\n2 0 1\n3 0 0\n1 2 1\n3',
          explanation: 'Postorder: 4 reports first (both children empty). 2 sees heights 0 and 1, returns 2. The root combines 2 and 1 into 3.',
          signature: 'trace:dfs-height',
          minutes: 3,
          important: true,
        }),
      ],
    },

    // ───────────────────────────── Capstone: depth ─────────────────────────────
    {
      id: 'd06-cap-depth',
      title: 'Capstone: Max Depth',
      summary: 'Postorder combine from a blank editor, then explain it.',
      exercises: [
        capstone({
          id: 'cap-max-depth',
          problemId: 'max-depth',
          title: 'Maximum Depth of Binary Tree',
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Given the root of a binary tree, return how many nodes lie on the longest path from the root down to any leaf. An empty tree has depth 0.',
          starterCode: `def max_depth(root: Optional[TreeNode]) -> int:\n    pass\n`,
          solution: `def max_depth(root: Optional[TreeNode]) -> int:
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
`,
          examples: [
            { input: '[3, 9, 20, None, None, 15, 7]', output: '3', note: '3 → 20 → 15 is a longest path' },
            { input: '[1, None, 2]', output: '2' },
            { input: '[]', output: '0' },
          ],
          tests: [
            t.eq('max_depth(build_tree([3, 9, 20, None, None, 15, 7]))', '3'),
            t.eq('max_depth(build_tree([1, None, 2]))', '2'),
            t.eq('max_depth(None)', '0'),
            t.hidden('max_depth(build_tree([1]))', '1'),
            t.hidden('max_depth(build_tree([1, 2, None, 3, None, 4]))', '4'),
            t.hidden('max_depth(build_tree([1, 2, 3, 4, 5, 6, 7]))', '3'),
            t.hidden('max_depth(build_tree([1, 2, 3, None, None, None, 4, None, 5]))', '4'),
            t.hidden('max_depth(build_tree([0, -1, -2]))', '2'),
          ],
          hints: [
            'The depth of a tree depends only on the depths of its two subtrees.',
            'Base case: an empty tree (None) has depth 0.',
            'This node adds 1 on top of the deeper of its two subtrees.',
            'if root is None: return 0; return 1 + max(depth(left), depth(right)).',
          ],
          complexity: { time: 'O(n)', space: 'O(h) call stack, h = tree height (O(n) worst case)' },
          explanation: 'Postorder DFS: each node asks both children for their depth and adds one for itself. Every node is visited once; the recursion stack holds one frame per level on the current path.',
          signature: 'capstone:max-depth',
          minutes: 25,
        }),
        explain({
          id: 'd06-explain-depth',
          title: 'Explain max depth',
          skills: ['explanation', 'tree_dfs', 'complexity'],
          prompt: 'Explain your max-depth solution: base case, what each call returns, how answers combine, and the time and space cost (including the call stack).',
          rubric: [
            'Base case: None has depth 0',
            'Each call returns the depth of its subtree; combine with 1 + max(left, right)',
            'Names it as postorder DFS (children before parent)',
            'O(n) time; O(h) space for the call stack, O(n) for a skewed tree',
            'Edge cases: empty tree, single node, completely one-sided tree',
          ],
          minutes: 5,
          signature: 'explain:max-depth',
        }),
      ],
    },

    // ───────────────────────────── Two trees ─────────────────────────────
    {
      id: 'd06-pairs',
      title: 'Two trees at once',
      summary: 'Recurse on a pair of nodes: base cases for None on either side.',
      exercises: [
        choice({
          id: 'd06-pair-base',
          title: 'Base cases for a pair',
          skills: ['recursion_base_case', 'tree_dfs'],
          prompt: 'You recurse on two nodes `a` and `b` at once. Which base-case pair is right?',
          options: [
            'Both None → True; exactly one None → False',
            'a is None → True; b is None → True',
            'Both None → False; one None → True',
            'Only check a.val == b.val',
          ],
          answer: 0,
          note: 'if a is None and b is None: return True\nif a is None or b is None: return False',
          explanation: 'Two empty trees match. One empty and one not cannot match. Only after both checks is it safe to read .val on both.',
          signature: 'choice:pair-base-cases',
        }),
        output({
          id: 'd06-pair-shape-trace',
          title: 'Same shape?',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'This compares shapes only, not values. Predict the output.',
          code: `def same_shape(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return same_shape(a.left, b.left) and same_shape(a.right, b.right)

print(same_shape(build_tree([1, 2]), build_tree([9, 8])))
print(same_shape(build_tree([1, 2]), build_tree([1, None, 2])))`,
          expectedOutput: 'True\nFalse',
          explanation: 'Values never get compared. [1, 2] has a left child; [1, None, 2] has a right child, so the left pair is (node, None) → False.',
          signature: 'trace:pair-shape',
          minutes: 2,
        }),
        fill({
          id: 'd06-pair-fill',
          title: 'Fill: one side missing',
          skills: ['recursion_base_case'],
          prompt: 'Fill in the second base case.',
          starterCode: `def same_shape(a, b):
    if a is None and b is None:
        return True
    if ____:
        return False
    return same_shape(a.left, b.left) and same_shape(a.right, b.right)
`,
          solution: `def same_shape(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return same_shape(a.left, b.left) and same_shape(a.right, b.right)
`,
          tests: [t.eq('same_shape(build_tree([1, 2]), build_tree([1]))', 'False'), t.eq('same_shape(None, None)', 'True'), t.hidden('same_shape(None, TreeNode(1))', 'False')],
          hints: ['Both-None was already handled above.'],
          signature: 'fill:pair-one-none',
        }),
        code({
          id: 'd06-pair-lists',
          title: 'Equal linked lists, recursively',
          ...combine,
          skills: ['recursion_base_case', 'recursion_return', 'listnode'],
          prompt: 'Write `same_list(a, b)` that returns `True` if two linked lists hold the same values in the same order. Recursive, with the same pair base cases.',
          starterCode: `def same_list(a, b):\n    pass\n`,
          solution: `def same_list(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return a.val == b.val and same_list(a.next, b.next)
`,
          tests: [t.eq('same_list(build_list([1, 2]), build_list([1, 2]))', 'True'), t.eq('same_list(build_list([1, 2]), build_list([1]))', 'False'), t.hidden('same_list(None, None)', 'True'), t.hidden('same_list(build_list([1, 3]), build_list([1, 2]))', 'False')],
          hints: ['Pair base cases first.', 'Then: values equal and the rest equal.'],
          signature: 'rec:pair-linked-lists',
          minutes: 6,
        }),
        code({
          id: 'd06-pair-bigger',
          title: 'Every node bigger?',
          ...pattern,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Two trees with the same shape. Write `all_bigger(a, b)`: `True` if every node of `a` holds a larger value than the node at the same spot in `b`. Two empty trees → `True`; if the shapes differ, return `False`.',
          starterCode: `def all_bigger(a, b):\n    pass\n`,
          solution: `def all_bigger(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    if a.val <= b.val:
        return False
    return all_bigger(a.left, b.left) and all_bigger(a.right, b.right)
`,
          tests: [t.eq('all_bigger(build_tree([5, 3, 9]), build_tree([4, 1, 8]))', 'True'), t.eq('all_bigger(build_tree([5, 3, 9]), build_tree([4, 3, 8]))', 'False'), t.hidden('all_bigger(None, None)', 'True'), t.hidden('all_bigger(build_tree([5, 3]), build_tree([4]))', 'False')],
          hints: ['Same two base cases.', 'Check this pair, then both child pairs with `and`.'],
          signature: 'dfs:pair-compare-values',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────── Capstone: same tree ─────────────────────────────
    {
      id: 'd06-cap-same',
      title: 'Capstone: Same Tree',
      summary: 'Pair recursion from a blank editor, then explain it.',
      exercises: [
        capstone({
          id: 'cap-same-tree',
          problemId: 'same-tree',
          title: 'Same Tree',
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Given the roots of two binary trees, decide whether they are identical: the same shape, with equal values in every matching position. Return `True` or `False`.',
          starterCode: `def is_same_tree(p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:\n    pass\n`,
          solution: `def is_same_tree(p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None:
        return False
    if p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
`,
          examples: [
            { input: 'p = [1, 2, 3], q = [1, 2, 3]', output: 'True' },
            { input: 'p = [1, 2], q = [1, None, 2]', output: 'False', note: 'same values, different shape' },
            { input: 'p = [1, 2, 1], q = [1, 1, 2]', output: 'False' },
          ],
          tests: [
            t.eq('is_same_tree(build_tree([1, 2, 3]), build_tree([1, 2, 3]))', 'True'),
            t.eq('is_same_tree(build_tree([1, 2]), build_tree([1, None, 2]))', 'False'),
            t.eq('is_same_tree(build_tree([1, 2, 1]), build_tree([1, 1, 2]))', 'False'),
            t.hidden('is_same_tree(None, None)', 'True'),
            t.hidden('is_same_tree(TreeNode(1), None)', 'False'),
            t.hidden('is_same_tree(None, TreeNode(1))', 'False'),
            t.hidden('is_same_tree(build_tree([5, 4, 8, 11, None, 13, 4]), build_tree([5, 4, 8, 11, None, 13, 4]))', 'True'),
            t.hidden('is_same_tree(build_tree([5, 4, 8, 11, None, 13, 4]), build_tree([5, 4, 8, 11, None, 13, 5]))', 'False'),
            t.hidden('is_same_tree(build_tree([0]), build_tree([0, 0]))', 'False'),
          ],
          hints: [
            'Two trees are the same if their roots match and both pairs of subtrees are the same.',
            'Handle None first: both None is a match, exactly one None is not.',
            'Only after both nodes exist, compare p.val with q.val.',
            'Return the `and` of the recursive results for (left, left) and (right, right).',
          ],
          complexity: { time: 'O(n) where n is the smaller tree size', space: 'O(h) call stack' },
          explanation: 'The recursion walks both trees in lockstep. The None checks come first so `.val` is never read on a missing node, and `and` stops as soon as one mismatch is found.',
          signature: 'capstone:same-tree',
          minutes: 25,
        }),
        explain({
          id: 'd06-explain-same',
          title: 'Explain Same Tree',
          skills: ['explanation', 'recursion_base_case', 'complexity'],
          prompt: 'Explain your solution: the base cases and why their order matters, the recursive step, and the complexity.',
          rubric: [
            'Both None → True; exactly one None → False; checked before reading .val',
            'Compares values at the current pair, then recurses on (left, left) and (right, right)',
            'Combines with `and`, which short-circuits on the first mismatch',
            'O(n) time, O(h) recursion stack',
            'Edge cases: both empty, one empty, same values but different shape',
          ],
          minutes: 5,
          signature: 'explain:same-tree',
        }),
      ],
    },

    // ───────────────────────────── Changing trees ─────────────────────────────
    {
      id: 'd06-mutate',
      title: 'Changing trees',
      summary: 'Swap children safely, mutate in place, and return the root.',
      exercises: [
        output({
          id: 'd06-mut-swap',
          title: 'Tuple swap',
          skills: ['treenode'],
          prompt: 'Predict the output.',
          code: `root = build_tree([1, 2, 3])
root.left, root.right = root.right, root.left
print(tree_to_array(root))`,
          expectedOutput: '[1, 3, 2]',
          explanation: 'The right-hand side is evaluated completely first, so both old children are saved before either is overwritten.',
          signature: 'trace:tree-swap-tuple',
        }),
        output({
          id: 'd06-mut-bad-swap',
          title: 'Swap without saving',
          skills: ['treenode', 'linked_list_reassignment'],
          prompt: 'Predict the output.',
          code: `root = build_tree([1, 2, 3])
root.left = root.right
root.right = root.left
print(tree_to_array(root))`,
          expectedOutput: '[1, 3, 3]',
          explanation: 'Same bug as linked-list rewiring: after the first line, the old left child (2) is gone, so both sides end up pointing to 3. Save it in a temp or use tuple assignment.',
          signature: 'trace:tree-swap-bug',
          minutes: 2,
        }),
        code({
          id: 'd06-mut-swap-top',
          title: 'Swap the root’s children',
          skills: ['treenode'],
          prompt: 'Write `swap_top(root)` that swaps only the root’s two children (not deeper ones) and returns `root`. Handle `None`.',
          starterCode: `def swap_top(root):\n    pass\n`,
          solution: `def swap_top(root):
    if root:
        root.left, root.right = root.right, root.left
    return root
`,
          tests: [t.eq('tree_to_array(swap_top(build_tree([1, 2, 3, 4])))', '[1, 3, 2, None, None, 4]'), t.eq('swap_top(None)', 'None'), t.hidden('tree_to_array(swap_top(build_tree([1, 2])))', '[1, None, 2]')],
          hints: ['One tuple assignment, guarded by `if root`.'],
          signature: 'tree:swap-children',
          minutes: 4,
        }),
        code({
          id: 'd06-mut-add-one',
          title: 'Add one everywhere',
          ...combine,
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: 'Write `add_one(root)` that adds 1 to every value **in place** and returns `root`.',
          starterCode: `def add_one(root):\n    pass\n`,
          solution: `def add_one(root):
    if root is None:
        return None
    root.val += 1
    add_one(root.left)
    add_one(root.right)
    return root
`,
          tests: [t.eq('tree_to_array(add_one(build_tree([1, 2, 3, None, 5])))', '[2, 3, 4, None, 6]'), t.eq('add_one(None)', 'None')],
          hints: ['Change this node, then recurse on both children.', 'Return root so the caller gets the tree back.'],
          signature: 'dfs:mutate-values',
          minutes: 5,
        }),
        code({
          id: 'd06-mut-copy',
          title: 'Copy a tree',
          ...combine,
          skills: ['tree_dfs', 'recursion_return', 'treenode'],
          prompt: 'Write `copy_tree(root)` returning a brand-new tree with the same shape and values. Changing the copy must not change the original.',
          starterCode: `def copy_tree(root):\n    pass\n`,
          solution: `def copy_tree(root):
    if root is None:
        return None
    return TreeNode(root.val, copy_tree(root.left), copy_tree(root.right))
`,
          tests: [
            t.eq('tree_to_array(copy_tree(build_tree([1, 2, 3, None, 4])))', '[1, 2, 3, None, 4]'),
            t.check('copy is independent', 'r = build_tree([1, 2])\nc = copy_tree(r)\nassert c is not r and c.left is not r.left\nc.left.val = 99\nassert r.left.val == 2'),
            t.hidden('copy_tree(None)', 'None'),
          ],
          hints: ['A recursive call returns a whole copied subtree.', 'Build a new TreeNode from this val plus the two copied children.'],
          explanation: 'The recursive return *is* a subtree. Building trees by returning nodes is the move behind invert, construct-from-traversals and many others.',
          signature: 'dfs:copy-tree',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────── Capstone: invert ─────────────────────────────
    {
      id: 'd06-cap-invert',
      title: 'Capstone: Invert Tree',
      summary: 'Swap at every node, then explain it.',
      exercises: [
        capstone({
          id: 'cap-invert-tree',
          problemId: 'invert-tree',
          title: 'Invert Binary Tree',
          skills: ['tree_dfs', 'recursion_base_case', 'treenode'],
          prompt: 'Turn a binary tree into its mirror image: at every node, the left and right subtrees trade places. Return the root of the mirrored tree.',
          starterCode: `def invert_tree(root: Optional[TreeNode]) -> Optional[TreeNode]:\n    pass\n`,
          solution: `def invert_tree(root: Optional[TreeNode]) -> Optional[TreeNode]:
    if root is None:
        return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
`,
          examples: [
            { input: '[4, 2, 7, 1, 3, 6, 9]', output: '[4, 7, 2, 9, 6, 3, 1]' },
            { input: '[2, 1, 3]', output: '[2, 3, 1]' },
            { input: '[]', output: '[]' },
          ],
          tests: [
            t.eq('tree_to_array(invert_tree(build_tree([4, 2, 7, 1, 3, 6, 9])))', '[4, 7, 2, 9, 6, 3, 1]'),
            t.eq('tree_to_array(invert_tree(build_tree([2, 1, 3])))', '[2, 3, 1]'),
            t.eq('invert_tree(None)', 'None'),
            t.hidden('tree_to_array(invert_tree(build_tree([1])))', '[1]'),
            t.hidden('tree_to_array(invert_tree(build_tree([1, 2])))', '[1, None, 2]'),
            t.hidden('tree_to_array(invert_tree(build_tree([1, None, 2])))', '[1, 2]'),
            t.hidden('tree_to_array(invert_tree(build_tree([1, 2, 3, 4])))', '[1, 3, 2, None, None, None, 4]'),
            t.hidden('tree_to_array(invert_tree(build_tree([5, 5, 5, 5])))', '[5, 5, 5, None, None, None, 5]'),
          ],
          hints: [
            'The mirror of a tree is: same root, mirrored right subtree on the left, mirrored left subtree on the right.',
            'Base case: an empty tree mirrors to an empty tree.',
            'Swap the two children at this node, saving both before overwriting (tuple assignment).',
            'Recurse into both children (before or after the swap), then return root.',
          ],
          complexity: { time: 'O(n)', space: 'O(h) call stack' },
          explanation: 'Every node gets its children swapped exactly once; the order (pre or post) does not matter as long as each subtree is inverted once. Tuple assignment evaluates both recursive calls before writing, so no child is lost.',
          signature: 'capstone:invert-tree',
          minutes: 25,
        }),
        explain({
          id: 'd06-explain-invert',
          title: 'Explain inversion',
          skills: ['explanation', 'tree_dfs', 'complexity'],
          prompt: 'Explain your inversion: the base case, what happens at each node, why no child gets lost, what you return, and the complexity.',
          rubric: [
            'Base case: None returns None',
            'At each node swap left and right, and invert both subtrees',
            'Uses tuple assignment or a temp so the old child is not overwritten before it is used',
            'Returns root so callers (and the parent) get the subtree back',
            'O(n) time, O(h) recursion stack; works for empty and one-sided trees',
          ],
          minutes: 5,
          signature: 'explain:invert-tree',
        }),
      ],
    },

    // ───────────────────────────── Cold reps ─────────────────────────────
    {
      id: 'd06-cold',
      title: 'Cold reps',
      summary: 'No scaffolding: recursion and tree DFS from a blank editor.',
      exercises: [
        code({
          id: 'd06-cold-digits',
          title: 'Digit sum, recursively',
          ...cold,
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: 'Write `digit_sum(n)` for `n >= 0` recursively: `digit_sum(4096)` is 19. Use `% 10` and `// 10`.',
          starterCode: ``,
          solution: `def digit_sum(n):
    if n < 10:
        return n
    return n % 10 + digit_sum(n // 10)
`,
          tests: [t.eq('digit_sum(4096)', '19'), t.eq('digit_sum(7)', '7'), t.hidden('digit_sum(0)', '0'), t.hidden('digit_sum(1000)', '1')],
          hints: ['A one-digit number is its own digit sum.'],
          signature: 'rec:digit-sum',
          minutes: 5,
        }),
        code({
          id: 'd06-cold-tree-sum',
          title: 'Tree sum, cold',
          ...cold,
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Write `total(root)`: the sum of all values in a binary tree.',
          starterCode: ``,
          solution: `def total(root):
    if root is None:
        return 0
    return root.val + total(root.left) + total(root.right)
`,
          tests: [t.eq('total(build_tree([1, 2, 3, None, 4]))', '10'), t.hidden('total(None)', '0'), t.hidden('total(build_tree([-1, -2]))', '-3')],
          hints: ['None → 0.'],
          signature: 'dfs:tree-sum-cold',
          minutes: 4,
        }),
        code({
          id: 'd06-cold-postorder',
          title: 'Postorder, cold',
          ...cold,
          skills: ['tree_dfs', 'list_append'],
          prompt: 'Write `postorder(root)` returning the values in postorder (left, right, node).',
          starterCode: ``,
          solution: `def postorder(root):
    out = []

    def go(node):
        if node is None:
            return
        go(node.left)
        go(node.right)
        out.append(node.val)

    go(root)
    return out
`,
          tests: [t.eq('postorder(build_tree([1, 2, 3, 4, 5]))', '[4, 5, 2, 3, 1]'), t.hidden('postorder(None)', '[]'), t.hidden('postorder(build_tree([1, None, 2]))', '[2, 1]')],
          hints: ['Helper + outer list; append after both recursive calls.'],
          signature: 'dfs:postorder-cold',
          minutes: 6,
        }),
        code({
          id: 'd06-cold-height',
          title: 'Height, cold',
          ...cold,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Write `height(root)`: number of nodes on the longest root-to-leaf path (0 for empty).',
          starterCode: ``,
          solution: `def height(root):
    if not root:
        return 0
    return 1 + max(height(root.left), height(root.right))
`,
          tests: [t.eq('height(build_tree([1, 2, 3, 4]))', '3'), t.hidden('height(None)', '0'), t.hidden('height(build_tree([1, None, 2, None, 3]))', '3')],
          hints: ['1 + the deeper child.'],
          signature: 'dfs:height-cold',
          minutes: 5,
        }),
        code({
          id: 'd06-cold-mirror',
          title: 'Mirror, cold',
          ...cold,
          skills: ['tree_dfs', 'treenode'],
          prompt: 'Write `mirror(root)` that inverts a binary tree in place and returns the root.',
          starterCode: ``,
          solution: `def mirror(root):
    if root:
        root.left, root.right = root.right, root.left
        mirror(root.left)
        mirror(root.right)
    return root
`,
          tests: [t.eq('tree_to_array(mirror(build_tree([1, 2, 3, 4])))', '[1, 3, 2, None, None, None, 4]'), t.hidden('mirror(None)', 'None'), t.hidden('tree_to_array(mirror(build_tree([4, 2, 7, 1, 3, 6, 9])))', '[4, 7, 2, 9, 6, 3, 1]')],
          hints: ['Swap, then recurse into both.'],
          signature: 'dfs:invert-cold',
          minutes: 6,
        }),
      ],
    },
  ],
  capstones: ['max-depth', 'same-tree', 'invert-tree'],
}
