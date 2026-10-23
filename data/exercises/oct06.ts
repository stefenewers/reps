import type { DayModule } from '@/lib/types'
import { capstone, debug, explain, output, t, write } from './build'

const cold = { stage: 'retrieval' as const, repType: 'cold' as const }
const combine = { stage: 'combine' as const, repType: 'combine' as const }
const pattern = { stage: 'pattern' as const, repType: 'pattern' as const }

export const day: DayModule = {
  date: '2026-10-06',
  short: 'Trees',
  title: 'Recursion + trees',
  focus: 'Trust the recursive call: write the base case first, return and combine the children’s answers, and break and fix tree DFS until it feels like a template.',
  sections: [
    // ───────────────────────────── Warm-up ─────────────────────────────
    {
      id: 'd06-warmup',
      title: 'Warm-up',
      summary: 'Cold reps on yesterday’s search and pointers, plus maps, running state and windows.',
      exercises: [
        write({
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
          tests: [t.eq('find([1, 4, 6, 9, 13], 9)', '3'), t.eq('find([1, 4, 6, 9, 13], 5)', '-1'), t.hidden('find([], 1)', '-1'), t.hidden('find([2], 2)', '0'), t.hidden('find([1, 4, 6, 9, 13], 13)', '4')],
          hints: ['lo <= hi; mid + 1 / mid - 1.'],
          signature: 'bs:cold',
          minutes: 6,
        }),
        write({
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
        write({
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
        write({
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
        write({
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
        write({
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
      summary: 'Return values, mutation vs rebinding, inner helpers: the parts recursion is made of.',
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
          note: '`return` hands a value back to whoever called the function. `print` only shows text on the screen. A function with no `return` hands back `None`.',
          explanation: 'f prints 6 but returns nothing, so x is None. Later today every function you write has to **return** its answer so the caller can use it: a result that vanishes like this is the most common bug.',
          signature: 'trace:fn-print-return',
          important: true,
        }),
        write({
          id: 'd06-fn-tuple',
          title: 'Return two things',
          skills: ['functions', 'tuples'],
          prompt: '`nums` is a non-empty list of numbers. Write `low_high(nums)` returning one tuple `(smallest, largest)`, found in a single pass over the list. No `min`/`max` on the whole list.\n\n`low_high([3, 9, 1, 4])` is `(1, 9)`. With one number, both are that number: `low_high([7])` is `(7, 7)`.',
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
        debug({
          id: 'd06-fn-dbg-return',
          title: 'Debug: the average disappears',
          skills: ['functions'],
          prompt: '`nums` is a list of numbers. `average(nums)` should return their mean (0 for an empty list) so callers can use it: `average([2, 4])` should be `3.0`. Callers get `None`. Fix it.',
          brokenCode: `def average(nums):
    if not nums:
        return 0
    total = 0
    for x in nums:
        total += x
    print(total / len(nums))
`,
          solution: `def average(nums):
    if not nums:
        return 0
    total = 0
    for x in nums:
        total += x
    return total / len(nums)
`,
          tests: [t.eq('average([2, 4])', '3.0'), t.eq('average([])', '0'), t.hidden('average([5])', '5.0')],
          hints: ['Look at what the function hands back, not what it shows.'],
          signature: 'debug:fn-print-not-return',
          minutes: 3,
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
        write({
          id: 'd06-fn-helper',
          title: 'Inner helper + shared list',
          style: 'finish',
          skills: ['functions', 'list_append'],
          prompt: '`nums` is a list of numbers and `limit` is a number. Finish `collect_big(nums, limit)` so it returns a list of the numbers greater than `limit`, in their original order: the inner function `visit(x)` should append `x` to the outer list `out` when `x > limit`.\n\n`collect_big([1, 8, 3, 9], 5)` is `[8, 9]`. You will use this shape, a helper that writes into an outer list, later today to collect values from a tree.',
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
          minutes: 4,
        }),
      ],
    },

    // ───────────────────────────── Recursion ─────────────────────────────
    {
      id: 'd06-recursion',
      title: 'Recursion',
      summary: 'Base case, smaller call, return the combination. Write it, break it, fix it.',
      exercises: [
        output({
          id: 'd06-rec-fact-stack',
          title: 'Call stack: factorial',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: '`fact` calls itself: that is **recursion**. `fact(4)` cannot finish until `fact(3)` hands back its answer, so the calls pile up, each one waiting for the next (that pile of unfinished calls is the **call stack**). Then they finish in reverse order, each one **returning** its answer to the call that was waiting for it.\n\nPredict the output. On paper, write each call on a new line, indented one level deeper.',
          code: `def fact(n):
    print("call", n)
    if n <= 1:
        return 1
    result = n * fact(n - 1)
    print("return", result)
    return result

print(fact(4))`,
          expectedOutput: 'call 4\ncall 3\ncall 2\ncall 1\nreturn 2\nreturn 6\nreturn 24\n24',
          note: '**Recursion**: a function that calls itself on a smaller input. **Base case**: the smallest input, answered directly with no further call; it is what stops the chain. **Recursive case**: everything else: call yourself on something smaller, combine that answer with your own part, and `return` it.\nShape: `if <smallest input>: return <direct answer>` then `return <combine>(f(smaller))`. Base case first, always.',
          explanation: 'All four calls are open at once. fact(1) hits the base case and returns 1 without printing "return"; then each waiting call multiplies and returns.',
          signature: 'trace:rec-factorial-stack',
          minutes: 2.5,
          important: true,
        }),
        write({
          id: 'd06-rec-sum-to',
          title: 'Sum 1..n recursively',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: '`n` is a whole number, 0 or more. Write `sum_to(n)` returning `1 + 2 + ... + n` using recursion: the function calls itself, with no loop and no formula.\n\n`sum_to(4)` is `10`. `sum_to(0)` is `0`: there is nothing to add, and that is the input you can answer without another call. For anything bigger, ask: if `sum_to(3)` already hands back the right answer, what is `sum_to(4)`?',
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
        write({
          id: 'd06-rec-power',
          title: 'Power, recursively',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: '`b` is an integer and `e` is a whole number, 0 or more. Write `power(b, e)` returning `b` to the power `e` (`b` multiplied by itself `e` times), recursively. No `**` and no loop.\n\n`power(2, 5)` is `32`; `power(7, 0)` is `1`.',
          starterCode: `def power(b, e):\n    pass\n`,
          solution: `def power(b, e):
    if e == 0:
        return 1
    return b * power(b, e - 1)
`,
          tests: [t.eq('power(2, 5)', '32'), t.eq('power(7, 0)', '1'), t.hidden('power(3, 1)', '3'), t.hidden('power(-2, 3)', '-8')],
          hints: ['What is anything to the power 0?', 'b^e = b * b^(e - 1).'],
          signature: 'rec:power',
          minutes: 4,
        }),
        debug({
          id: 'd06-rec-dbg-base',
          title: 'Debug: factorial blows up',
          skills: ['recursion_base_case'],
          prompt: '`fact(n)` should return `n!` (n factorial: `n * (n - 1) * ... * 1`) for every whole number `n >= 0`, where `0!` is 1. It crashes on one input. Fix it.',
          brokenCode: `def fact(n):
    if n == 1:
        return 1
    return n * fact(n - 1)
`,
          solution: `def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)
`,
          tests: [t.eq('fact(5)', '120'), t.eq('fact(0)', '1'), t.hidden('fact(1)', '1')],
          hints: ['Trace fact(0): which n values does it visit?', 'The base case must catch the smallest input you accept.'],
          signature: 'debug:rec-base-case',
        }),
        debug({
          id: 'd06-rec-dbg-no-return',
          title: 'Debug: the result vanishes',
          skills: ['recursion_return'],
          prompt: '`nums` is a list of numbers. `total(nums)` should return their sum recursively: the first item plus the total of the rest (`nums[1:]`), and 0 for an empty list. It crashes on any non-empty list. Fix it.',
          brokenCode: `def total(nums):
    if not nums:
        return 0
    nums[0] + total(nums[1:])
`,
          solution: `def total(nums):
    if not nums:
        return 0
    return nums[0] + total(nums[1:])
`,
          tests: [t.eq('total([2, 5, 1])', '8'), t.eq('total([])', '0'), t.hidden('total([-3])', '-3')],
          hints: ['What does total([1]) return? What does its caller do with that?'],
          explanation: 'Computing a value is not returning it. A recursive case without `return` hands None to its caller, and the caller then does None + int.',
          signature: 'debug:rec-missing-return',
          minutes: 3,
          important: true,
        }),
        write({
          id: 'd06-rec-index-param',
          title: 'Recursion with an index parameter',
          skills: ['recursion_base_case', 'recursion_return', 'list_index'],
          prompt: '`nums` is a list of numbers and `i` is an index from 0 up to `len(nums)`. Write `sum_from(nums, i)` returning the sum of the items from index `i` to the end, recursively, by moving the index forward instead of slicing the list.\n\n`sum_from([3, 4, 5], 0)` is `12` (the whole list); `sum_from([3, 4, 5], 2)` is `5`. When `i` is `len(nums)` there is nothing left, so the sum is 0.',
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
        write({
          id: 'd06-rec-fib',
          title: 'Two recursive calls: fib',
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: '`n` is a whole number, 0 or more. Write `fib(n)` returning the `n`th number of the sequence `0, 1, 1, 2, 3, 5, 8, 13, ...`, where every number after the first two is the sum of the two before it. `fib(0)` is 0, `fib(1)` is 1, `fib(7)` is 13. Plain recursion is fine here, even though it is slow.',
          starterCode: `def fib(n):\n    pass\n`,
          solution: `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
`,
          tests: [t.eq('fib(0)', '0'), t.eq('fib(1)', '1'), t.eq('fib(7)', '13'), t.hidden('fib(15)', '610')],
          hints: ['Two base cases, or one: n < 2 returns n.', 'Combine two smaller answers with +.'],
          explanation: 'Two recursive calls combined with +: the same shape as combining a left and a right subtree.',
          signature: 'rec:fib',
          minutes: 4,
        }),
        write({
          id: 'd06-rec-reverse-str',
          title: 'Reverse a string recursively',
          skills: ['recursion_base_case', 'recursion_return', 'slicing'],
          prompt: '`s` is a string; it may be empty. Write `rev(s)` returning `s` reversed, using recursion: no `[::-1]`, no `reversed`, no loop.\n\n`rev("abc")` is `"cba"`; `rev("")` is `""`. Two questions to answer: which strings are so short that they are already their own reverse, and how does the reverse of `"abc"` use the reverse of `"bc"`?',
          starterCode: `def rev(s):\n    pass\n`,
          solution: `def rev(s):
    if len(s) <= 1:
        return s
    return rev(s[1:]) + s[0]
`,
          tests: [t.eq('rev("abc")', '"cba"'), t.eq('rev("")', '""'), t.hidden('rev("x")', '"x"'), t.hidden('rev("racecars")', '"sracecar"')],
          hints: ['Base case: a string of length 0 or 1 is its own reverse.', 'Reverse the rest (`s[1:]`), then put the first character at the end.'],
          signature: 'rec:reverse-string',
          minutes: 5,
        }),
        write({
          id: 'd06-rec-list-len',
          title: 'Linked list length, recursively',
          ...combine,
          skills: ['recursion_base_case', 'recursion_return', 'listnode'],
          prompt: '`head` is the first node of a linked list, or `None` for an empty list. Write `size(head)` returning the number of nodes, recursively (no loop). An empty list has size 0.\n\nA linked list is "one node, then a smaller linked list" (`head.next`).',
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
        write({
          id: 'd06-rec-translate',
          title: 'Translate: loop → recursion',
          ...combine,
          style: 'translate',
          skills: ['recursion_base_case', 'recursion_return', 'linked_list_traversal'],
          prompt: '`head` is the first node of a linked list (or `None`) and `x` is a number. Here is a loop that counts the nodes whose value is greater than `x`:\n\n```python\ndef count_greater(head, x):\n    count = 0\n    node = head\n    while node:\n        if node.val > x:\n            count += 1\n        node = node.next\n    return count\n```\n\nWrite `count_greater(head, x)` again **recursively**: no `while`, no `for`. Same answers, including 0 for an empty list.',
          starterCode: `def count_greater(head, x):\n    pass\n`,
          solution: `def count_greater(head, x):
    if head is None:
        return 0
    rest = count_greater(head.next, x)
    if head.val > x:
        return rest + 1
    return rest
`,
          tests: [t.eq('count_greater(build_list([5, 1, 7, 3]), 4)', '2'), t.eq('count_greater(None, 0)', '0'), t.hidden('count_greater(build_list([1, 1]), 1)', '0'), t.hidden('count_greater(build_list([-1, 0, 2]), -5)', '3')],
          hints: ['The loop’s stop condition becomes the base case.', 'Ask the rest of the list for its count, then add 1 if this node qualifies.'],
          signature: 'rec:translate-loop',
          minutes: 5,
        }),
        write({
          id: 'd06-rec-pal',
          title: 'Palindrome, recursively',
          ...combine,
          skills: ['recursion_base_case', 'recursion_return', 'two_pointer'],
          prompt: '`s` is a string; `i` and `j` are indexes into it. Write `pal(s, i, j)` returning `True` if the part of `s` from index `i` through index `j` (both included) is a **palindrome**, meaning it reads the same forwards and backwards, otherwise `False`.\n\nDo it by recursion, like two pointers closing in: compare the two end characters, then ask the same question with `i` and `j` each moved one step inward. The caller starts with `pal(s, 0, len(s) - 1)`, so `pal("level", 0, 4)` is `True` and `pal("levels", 0, 5)` is `False`. Once `i >= j` there is at most one character left, which counts as a palindrome; that also covers the empty string, called as `pal("", 0, -1)`.',
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
      ],
    },

    // ───────────────────────────── TreeNode ─────────────────────────────
    {
      id: 'd06-treenode',
      title: 'TreeNode',
      summary: 'val, left, right, and None where a child is missing.',
      exercises: [
        output({
          id: 'd06-tn-level-order',
          title: 'Read a level-order list',
          skills: ['treenode'],
          prompt: "A **binary tree** is made of **nodes**. Each node holds a value (`.val`) and has up to two **children**, `.left` and `.right`; each is another node, or `None` when that child is missing. The single node at the top is the **root**.\n\n`build_tree(values)` is provided for you. It builds a tree from a list in **level order** and returns the root. The list starts with the root. For each node, top to bottom and left to right, list its left child, then its right child. Use `None` for a missing child.\n\n```python\n#     1                           1\n#    / \\                           \\\n#   2   3                           3\n#   build_tree([1, 2, 3])           build_tree([1, None, 3])\n```\n\nDraw the tree for the list below, then predict the output.",
          code: `root = build_tree([5, 3, 8, None, 4])
print(root.left.val, root.right.val)
print(root.left.left, root.left.right.val)`,
          expectedOutput: '3 8\nNone 4',
          note: '`TreeNode` is provided, with three fields: `val`, `left`, `right`. `TreeNode(7)` is one node with no children; `TreeNode(7, a, b)` has left child `a` and right child `b`. A missing child is `None`, and an empty tree is `root = None`.\nA **leaf** is a node with no children (both are `None`). A **level** is all the nodes the same number of steps below the root.',
          explanation: 'Level by level, left to right: 5 is the root; 3 and 8 are its children; the next two entries are 3’s children, `None` (no left child) and 4. Printing a missing child shows `None`.',
          signature: 'trace:tree-level-order',
          minutes: 2,
        }),
        write({
          id: 'd06-tn-is-leaf',
          title: 'is_leaf',
          skills: ['treenode', 'conditionals'],
          prompt: '`node` is a `TreeNode`, or `None`. A **leaf** is a node with no children: its `.left` and `.right` are both `None`. Write `is_leaf(node)` returning `True` if `node` is a leaf, otherwise `False`.\n\n`TreeNode(1)` makes a single node with no children, so `is_leaf(TreeNode(1))` is `True`. The root of `build_tree([1, 2])` has a left child, so it is not a leaf. `is_leaf(None)` is `False`: no node at all is not a leaf.',
          starterCode: `def is_leaf(node):\n    pass\n`,
          solution: `def is_leaf(node):
    if node is None:
        return False
    return node.left is None and node.right is None
`,
          tests: [t.eq('is_leaf(TreeNode(1))', 'True'), t.eq('is_leaf(build_tree([1, 2]))', 'False'), t.hidden('is_leaf(None)', 'False'), t.hidden('is_leaf(build_tree([1, None, 2]))', 'False')],
          hints: ['Check node first, then both children.'],
          signature: 'tree:is-leaf',
          minutes: 4,
        }),
        write({
          id: 'd06-tn-children-sum',
          title: 'Sum the children',
          skills: ['treenode', 'conditionals'],
          prompt: '`node` is a `TreeNode` (never `None`). Write `children_sum(node)` returning the sum of the values of its two direct children, `node.left` and `node.right` only, nothing deeper. A missing child adds 0.\n\nFor the root of `build_tree([1, 2, 3])` (1 with left child 2 and right child 3) the answer is `5`. For `build_tree([1, None, 7])` (only a right child) it is `7`. For a node with no children it is `0`.',
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
        debug({
          id: 'd06-tn-dbg-none',
          title: 'Debug: left leaf check',
          skills: ['treenode', 'conditionals'],
          prompt: '`node` is a `TreeNode` (never `None`). `has_left_leaf(node)` should return `True` when `node` has a left child and that child is a leaf (a node with no children of its own), otherwise `False`. It crashes on some trees. Fix it.',
          brokenCode: `def has_left_leaf(node):
    return node.left.left is None and node.left.right is None
`,
          solution: `def has_left_leaf(node):
    if node.left is None:
        return False
    return node.left.left is None and node.left.right is None
`,
          tests: [t.eq('has_left_leaf(build_tree([1, 2, 3]))', 'True'), t.eq('has_left_leaf(build_tree([1, None, 3]))', 'False'), t.hidden('has_left_leaf(build_tree([1, 2, None, 4]))', 'False'), t.hidden('has_left_leaf(TreeNode(5))', 'False')],
          hints: ['What is node.left when there is no left child? What does .left on that do?'],
          signature: 'debug:tree-none-child',
          minutes: 3,
        }),
      ],
    },

    // ───────────────────────────── DFS ─────────────────────────────
    {
      id: 'd06-dfs',
      title: 'Tree DFS',
      summary: 'Visit, return and combine children’s answers, carry state down, and fix the classic bugs.',
      exercises: [
        output({
          id: 'd06-dfs-pre-trace',
          title: 'Preorder trace',
          skills: ['tree_dfs'],
          prompt: 'The tree is:\n\n```python\n#       1\n#      / \\\n#     2   3\n#    / \\\n#   4   5\n```\n\n`pre` visits every node once; visiting every node is called a **traversal**. Notice the order it goes in: all the way down one branch before it starts the next. That is **depth-first search** (**DFS**). Predict the output.',
          code: `def pre(node):
    if node is None:
        return
    print(node.val)
    pre(node.left)
    pre(node.right)

pre(build_tree([1, 2, 3, 4, 5]))`,
          expectedOutput: '1\n2\n4\n5\n3',
          note: 'A node together with everything below it is a **subtree**: `node.left` is the root of the node’s **left subtree**, `node.right` of its **right subtree**. **DFS** finishes one whole subtree before starting the other, and its base case is `None`, the empty subtree.\nThree orders, named for when the node itself is handled. **Preorder**: node, left, right. **Inorder**: left, node, right. **Postorder**: left, right, node. An answer that needs both children’s answers first (how many nodes, how tall) is postorder.',
          explanation: 'Preorder handles a node before diving into its children, finishing the whole left subtree before the right.',
          signature: 'trace:dfs-preorder',
          minutes: 2,
          important: true,
        }),
        write({
          id: 'd06-dfs-preorder',
          title: 'Preorder into a list',
          style: 'finish',
          skills: ['tree_dfs', 'list_append', 'functions'],
          prompt: '`root` is the top node of a binary tree, or `None` for an empty tree. Finish `preorder(root)` so it returns a list of the values in **preorder**: a node’s own value first, then everything in its left subtree, then everything in its right subtree.\n\nFill in the inner helper `visit(node)`, which appends to the outer list `out`. `node` can be `None` (a missing child): then there is nothing to do.\n\nFor `build_tree([1, 2, 3, 4, 5])` (1 has children 2 and 3; 2 has children 4 and 5) the answer is `[1, 2, 4, 5, 3]`. An empty tree gives `[]`.',
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
          hints: ['Base case: `None` → return, there is nothing to record.', 'Append this value, then visit the left child, then the right child.'],
          signature: 'dfs:preorder-shared-list',
          minutes: 6,
          important: true,
        }),
        write({
          id: 'd06-dfs-count',
          title: 'Count nodes',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None` if the tree is empty. Each node has `.left` and `.right`, which are themselves nodes or `None`. Write `count_nodes(root)` returning how many nodes the tree has. An empty tree has 0.\n\nUse recursion. Calling `count_nodes(root.left)` hands back the count for the **whole left subtree** (trust it), and `count_nodes(root.right)` does the same on the right. A tree is this node, plus everything in its left subtree, plus everything in its right subtree.\n\n`build_tree([1, 2, 3, None, 5])` has 4 nodes:\n\n```python\n#     1\n#    / \\\n#   2   3\n#    \\\n#     5\n```',
          note: 'The tree-recursion contract: first decide what the function returns for a whole tree. Then `f(root.left)` is that same answer for the left subtree and `f(root.right)` for the right subtree, already worked out.\nYou write only two things: the answer for `None` (the empty tree), and how to combine the two subtree answers with this node.',
          starterCode: `def count_nodes(root):\n    pass\n`,
          solution: `def count_nodes(root):
    if root is None:
        return 0
    return 1 + count_nodes(root.left) + count_nodes(root.right)
`,
          tests: [t.eq('count_nodes(build_tree([1, 2, 3, None, 5]))', '4'), t.eq('count_nodes(None)', '0'), t.hidden('count_nodes(TreeNode(1))', '1')],
          hints: ['What is the count for an empty tree (`None`)? That is the base case.', 'Otherwise: 1 for this node + the left count + the right count.'],
          signature: 'dfs:count-nodes',
          minutes: 4,
        }),
        write({
          id: 'd06-dfs-modify-count',
          title: 'Modify: count only big values',
          style: 'modify',
          skills: ['tree_dfs', 'recursion_return', 'conditionals'],
          prompt: '`root` is the top node of a binary tree (or `None`) and `x` is a number. The code below counts **every** node. Change it so `count_above(root, x)` counts only the nodes whose value is greater than `x`. An empty tree still gives 0.\n\nIn `build_tree([5, 1, 8, None, 6])`, three values are above 4.',
          starterCode: `def count_above(root, x):
    if root is None:
        return 0
    return 1 + count_above(root.left, x) + count_above(root.right, x)
`,
          solution: `def count_above(root, x):
    if root is None:
        return 0
    here = 1 if root.val > x else 0
    return here + count_above(root.left, x) + count_above(root.right, x)
`,
          tests: [t.eq('count_above(build_tree([5, 1, 8, None, 6]), 4)', '3'), t.eq('count_above(build_tree([1, 2]), 9)', '0'), t.hidden('count_above(None, 0)', '0'), t.hidden('count_above(build_tree([-1, -2, 0]), -2)', '2')],
          hints: ['Only this node’s contribution changes; the children still get asked.'],
          signature: 'dfs:count-filtered',
          minutes: 4,
        }),
        debug({
          id: 'd06-dfs-dbg-ignore',
          title: 'Debug: tree sum',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None`. `tree_sum(root)` should return the sum of every value in the tree (0 for an empty tree): `build_tree([1, 2, 3, 4])` should give `10`. It only gets one value right. Fix it.',
          brokenCode: `def tree_sum(root):
    if root is None:
        return 0
    tree_sum(root.left)
    tree_sum(root.right)
    return root.val
`,
          solution: `def tree_sum(root):
    if root is None:
        return 0
    left = tree_sum(root.left)
    right = tree_sum(root.right)
    return root.val + left + right
`,
          tests: [t.eq('tree_sum(build_tree([1, 2, 3, 4]))', '10'), t.eq('tree_sum(None)', '0'), t.hidden('tree_sum(TreeNode(-5))', '-5')],
          hints: ['The recursive calls run. Where do their answers go?'],
          signature: 'debug:dfs-ignored-result',
          minutes: 4,
          important: true,
        }),
        write({
          id: 'd06-dfs-max',
          title: 'Largest value',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None`. Write `tree_max(root)` returning the largest value anywhere in the tree. Values may be negative. For an empty tree return `float("-inf")`, negative infinity, which is smaller than every number.\n\n`build_tree([3, 9, 1, None, 4])` gives `9`; `build_tree([-5, -2, -9])` gives `-2`.',
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
        write({
          id: 'd06-dfs-leaves',
          title: 'Count leaves',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: '`root` is the top node of a binary tree, or `None`. Write `count_leaves(root)` returning how many **leaves** the tree has. A leaf is a node with no children. A node with at least one child is not a leaf and is not counted itself: its leaves are the leaves of its left subtree plus the leaves of its right subtree.\n\n`build_tree([1, 2, 3, 4, 5])` (1 has children 2 and 3; 2 has children 4 and 5) has 3 leaves: 4, 5 and 3. An empty tree has 0.\n\nThis time there are **two** inputs you can answer directly, without a recursive call. Find both.',
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
        debug({
          id: 'd06-dfs-dbg-leaf-base',
          title: 'Debug: leaf values',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: '`root` is the top node of a binary tree, or `None`. `leaf_sum(root)` should return the sum of the values of all the leaves (nodes with no children), and 0 for an empty tree. It crashes on some trees. Fix it.',
          brokenCode: `def leaf_sum(root):
    if root.left is None and root.right is None:
        return root.val
    return leaf_sum(root.left) + leaf_sum(root.right)
`,
          solution: `def leaf_sum(root):
    if root is None:
        return 0
    if root.left is None and root.right is None:
        return root.val
    return leaf_sum(root.left) + leaf_sum(root.right)
`,
          tests: [t.eq('leaf_sum(build_tree([1, 2, 3]))', '5'), t.eq('leaf_sum(build_tree([1, 2, 3, 4]))', '7'), t.eq('leaf_sum(None)', '0'), t.hidden('leaf_sum(TreeNode(6))', '6')],
          hints: ['Which call receives None when a node has only one child?'],
          signature: 'debug:dfs-missing-none-base',
        }),
        write({
          id: 'd06-dfs-contains',
          title: 'Is the value in the tree?',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None` for an empty tree. The values are in no particular order. Write `has(root, x)` returning `True` if any node in the tree holds the value `x`, otherwise `False`. An empty tree holds nothing, so its answer is `False`.\n\n```python\n#     5\n#    / \\\n#   1   8\n#    \\\n#     3\n```\n\nFor this tree, `build_tree([5, 1, 8, None, 3])`, `has(root, 3)` is `True` and `has(root, 4)` is `False`.',
          transfer: true,
          starterCode: `def has(root, x):\n    pass\n`,
          solution: `def has(root, x):
    if root is None:
        return False
    if root.val == x:
        return True
    return has(root.left, x) or has(root.right, x)
`,
          tests: [t.eq('has(build_tree([5, 1, 8, None, 3]), 3)', 'True'), t.eq('has(build_tree([5, 1, 8]), 4)', 'False'), t.hidden('has(None, 1)', 'False'), t.hidden('has(TreeNode(2), 2)', 'True')],
          hints: ['If you already knew whether the left subtree holds `x`, and whether the right subtree does, what would be left to check?', 'Recursion: `has(root.left, x)` answers the question for the whole left subtree. What does an empty tree answer?', 'Base case: `None` → `False`. This node holds `x` → `True`.', 'Otherwise combine the two children’s answers with `or` (it stops early if the left side already found it).'],
          signature: 'dfs:contains',
          minutes: 5,
        }),
        write({
          id: 'd06-dfs-inorder-return',
          title: 'Inorder by returning lists',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None`. Write `inorder(root)` returning a list of the values in **inorder**: everything in the left subtree first, then the node’s own value, then everything in the right subtree.\n\nThis time use **no** shared outer list and no helper: each call returns its own list, built from the lists its two recursive calls hand back. An empty tree returns `[]`.\n\nFor `build_tree([1, 2, 3, 4, 5])` (1 has children 2 and 3; 2 has children 4 and 5) the answer is `[4, 2, 5, 1, 3]`.',
          starterCode: `def inorder(root):\n    pass\n`,
          solution: `def inorder(root):
    if root is None:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)
`,
          tests: [t.eq('inorder(build_tree([1, 2, 3, 4, 5]))', '[4, 2, 5, 1, 3]'), t.eq('inorder(None)', '[]'), t.hidden('inorder(build_tree([2, 1, 3]))', '[1, 2, 3]')],
          hints: ['Base case: the empty tree returns an empty list.', '`inorder(root.left)` is already the finished list for the left subtree. Lists join with `+`.', 'left list + [this value] + right list.'],
          explanation: 'Two styles: share one list (state) or combine returned values. Both are O(n) visits; the shared list avoids the extra list copies.',
          signature: 'dfs:inorder-return-combine',
          minutes: 6,
        }),
        write({
          id: 'd06-dfs-at-depth',
          title: 'Values at depth d',
          ...pattern,
          skills: ['tree_dfs', 'list_append'],
          prompt: '`root` is the top node of a binary tree (or `None`) and `d` is a whole number, 0 or more. A node’s **depth** here is how many steps it is below the root: the root is at depth 0, its children at depth 1, their children at depth 2. Write `at_depth(root, d)` returning a list of the values at depth `d`, left to right. If no node is that deep, or the tree is empty, return `[]`.\n\nFor `build_tree([1, 2, 3, 4, 5, None, 6])`, depth 2 holds `[4, 5, 6]` and depth 0 holds `[1]`.\n\nCarry the depth down as a parameter of an inner helper, so each call knows how deep it is.',
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
        write({
          id: 'd06-dfs-path-sum',
          title: 'Root-to-leaf sum',
          ...pattern,
          difficulty: 3,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree (or `None`) and `target` is an integer. A **root-to-leaf path** starts at the root and steps down one child at a time until it reaches a **leaf** (a node with no children). Write `has_path_sum(root, target)` returning `True` if the values along some root-to-leaf path add up to `target`, otherwise `False`. An empty tree has no paths, so it is `False`.\n\nIn `build_tree([5, 4, 8, 11, None, 13, 4, 7, 2])` the path 5 → 4 → 11 → 2 adds up to 22, so the answer for 22 is `True`. A path may not stop early: in `build_tree([1, 2])` the only path is 1 → 2, so `target = 1` is `False`.',
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
        debug({
          id: 'd06-dfs-dbg-path',
          title: 'Debug: path sum stops too early',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: '`path_to_leaf(root, target)` should return `True` only if the values along some path from the root down to a **leaf** (a node with no children) add up to `target`; an empty tree is `False`. It says `True` for paths that stop at a node with one child. Fix it.',
          brokenCode: `def path_to_leaf(root, target):
    if root is None:
        return target == 0
    remaining = target - root.val
    return path_to_leaf(root.left, remaining) or path_to_leaf(root.right, remaining)
`,
          solution: `def path_to_leaf(root, target):
    if root is None:
        return False
    remaining = target - root.val
    if root.left is None and root.right is None:
        return remaining == 0
    return path_to_leaf(root.left, remaining) or path_to_leaf(root.right, remaining)
`,
          tests: [t.eq('path_to_leaf(build_tree([1, 2]), 1)', 'False'), t.eq('path_to_leaf(build_tree([1, 2]), 3)', 'True'), t.hidden('path_to_leaf(None, 0)', 'False'), t.hidden('path_to_leaf(build_tree([5, 4, 8, 11, None, 13, 4, 7, 2]), 22)', 'True')],
          hints: ['In [1, 2], node 1 has an empty right side. What does that None call return when target is 1?', 'A path may only end at a leaf, so the check belongs there.'],
          signature: 'debug:dfs-path-leaf-check',
          minutes: 5,
        }),
        write({
          id: 'd06-dfs-translate-stack',
          title: 'Translate: recursion → explicit stack',
          ...combine,
          style: 'translate',
          difficulty: 3,
          skills: ['tree_dfs', 'stack_push_pop'],
          prompt: 'Recursion keeps its unfinished calls on the call stack. Write `preorder_iter(root)` that returns the same preorder list (node, then its left subtree, then its right subtree) using your **own** list as a stack and a loop, with no recursion. An empty tree (`None`) returns `[]`.\n\n```python\ndef preorder(node):\n    if node is None:\n        return []\n    return [node.val] + preorder(node.left) + preorder(node.right)\n```',
          starterCode: `def preorder_iter(root):\n    pass\n`,
          solution: `def preorder_iter(root):
    out = []
    stack = [root] if root else []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return out
`,
          tests: [t.eq('preorder_iter(build_tree([1, 2, 3, 4, 5]))', '[1, 2, 4, 5, 3]'), t.eq('preorder_iter(None)', '[]'), t.hidden('preorder_iter(build_tree([1, None, 2, 3]))', '[1, 2, 3]'), t.hidden('preorder_iter(TreeNode(9))', '[9]')],
          hints: ['Start with the root on the stack; pop, record, push children.', 'The stack is last-in first-out: push right before left so left comes out first.'],
          signature: 'dfs:iterative-preorder',
          minutes: 8,
        }),
        debug({
          id: 'd06-dfs-dbg-depth',
          title: 'Debug: height is too small',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None`. `height(root)` should return the number of **nodes** on the longest path from the root down to a leaf: 0 for an empty tree, 1 for a single node, 2 for a root with one child. Some answers are too small. Fix it.',
          brokenCode: `def height(root):
    if root is None:
        return 0
    return max(1 + height(root.left), height(root.right))
`,
          solution: `def height(root):
    if root is None:
        return 0
    return 1 + max(height(root.left), height(root.right))
`,
          tests: [t.eq('height(build_tree([1, None, 2]))', '2'), t.eq('height(build_tree([1, 2]))', '2'), t.hidden('height(None)', '0'), t.hidden('height(build_tree([1, 2, 3, None, None, 4, None, 5]))', '4')],
          hints: ['Trace the tree [1, None, 2]. Who adds the 1 for the root?', 'The current node counts once, no matter which child is deeper.'],
          signature: 'debug:dfs-depth-plus-one',
          minutes: 4,
          important: true,
        }),
      ],
    },

    // ───────────────────────────── Capstone: depth ─────────────────────────────
    {
      id: 'd06-cap-depth',
      title: 'Capstone: Max Depth',
      summary: 'Postorder combine from a bare signature, then explain it.',
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
        write({
          id: 'd06-fu-min-depth',
          title: 'Follow-up: shallowest leaf',
          style: 'modify',
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: '**Interviewer follow-up.** Your maximum-depth solution works: it is in the editor, already renamed `min_depth`. Now make it return the depth of the **shallowest leaf**: the fewest nodes on any path from the root down to a leaf. A node with only one child is not a leaf. An empty tree has depth 0. Then test the one-child case.',
          starterCode: `def min_depth(root):
    if root is None:
        return 0
    return 1 + max(min_depth(root.left), min_depth(root.right))
`,
          solution: `def min_depth(root):
    if root is None:
        return 0
    if root.left is None:
        return 1 + min_depth(root.right)
    if root.right is None:
        return 1 + min_depth(root.left)
    return 1 + min(min_depth(root.left), min_depth(root.right))
`,
          tests: [t.eq('min_depth(build_tree([3, 9, 20, None, None, 15, 7]))', '2'), t.eq('min_depth(build_tree([2, None, 3, None, 4]))', '3'), t.hidden('min_depth(None)', '0'), t.hidden('min_depth(build_tree([1]))', '1'), t.hidden('min_depth(build_tree([1, 2]))', '2')],
          hints: ['Swapping `max` for `min` is close. Now try a root with only one child.', 'A missing child is not a leaf: if one side is None, the answer has to come from the other side.'],
          explanation: 'Plain `min` treats an empty side as a depth-0 leaf. Handling the one-child case first fixes it; time stays O(n).',
          signature: 'followup:max-depth-to-min-depth',
          minutes: 5,
        }),
      ],
    },

    // ───────────────────────────── Two trees ─────────────────────────────
    {
      id: 'd06-pairs',
      title: 'Two trees at once',
      summary: 'Recurse on a pair of nodes: base cases for None on either side, then values.',
      exercises: [
        write({
          id: 'd06-pair-lists',
          title: 'Equal linked lists, recursively',
          ...combine,
          skills: ['recursion_base_case', 'recursion_return', 'listnode'],
          prompt: '`a` and `b` are each the first node of a linked list, or `None` for an empty list. Write `same_list(a, b)` returning `True` if the two lists hold the same values in the same order (so they are also the same length), otherwise `False`. Two empty lists are the same; an empty list and a non-empty one are not.\n\nUse recursion on the **pair**: deal with the two front nodes, then ask the same question about the pair `(a.next, b.next)`.',
          starterCode: `def same_list(a, b):\n    pass\n`,
          solution: `def same_list(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return a.val == b.val and same_list(a.next, b.next)
`,
          tests: [t.eq('same_list(build_list([1, 2]), build_list([1, 2]))', 'True'), t.eq('same_list(build_list([1, 2]), build_list([1]))', 'False'), t.hidden('same_list(None, None)', 'True'), t.hidden('same_list(build_list([1, 3]), build_list([1, 2]))', 'False'), t.hidden('same_list(None, build_list([1]))', 'False')],
          note: 'Pair base cases, in this order:\nif a is None and b is None: return True\nif a is None or b is None: return False\nOnly then is it safe to read .val on both.',
          hints: ['Pair base cases first: both None, then exactly one None.', 'Then: values equal and the rest equal.'],
          signature: 'rec:pair-linked-lists',
          minutes: 6,
        }),
        debug({
          id: 'd06-pair-dbg-order',
          title: 'Debug: same shape',
          skills: ['recursion_base_case', 'tree_dfs'],
          prompt: '`a` and `b` are the roots of two binary trees; either may be `None`. `same_shape(a, b)` should return `True` when the two trees have exactly the same **shape**: wherever one has a node, so does the other. The values are ignored, and two empty trees have the same shape. It never returns `True`. Fix it.',
          brokenCode: `def same_shape(a, b):
    if a is None or b is None:
        return False
    if a is None and b is None:
        return True
    return same_shape(a.left, b.left) and same_shape(a.right, b.right)
`,
          solution: `def same_shape(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return same_shape(a.left, b.left) and same_shape(a.right, b.right)
`,
          tests: [t.eq('same_shape(build_tree([1, 2]), build_tree([9, 8]))', 'True'), t.eq('same_shape(build_tree([1, 2]), build_tree([1, None, 2]))', 'False'), t.hidden('same_shape(None, None)', 'True'), t.hidden('same_shape(TreeNode(1), None)', 'False')],
          hints: ['Can the second `if` ever run?', 'Every recursion ends at a pair of Nones. What does that pair return here?'],
          signature: 'debug:pair-base-case-order',
          minutes: 3,
        }),
        write({
          id: 'd06-pair-bigger',
          title: 'Every node bigger?',
          ...pattern,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: '`a` and `b` are the roots of two binary trees; either may be `None`. Write `all_bigger(a, b)` returning `True` if the trees have the same shape **and** every node of `a` holds a strictly larger value than the node in the same position in `b`. Otherwise return `False`: a different shape is `False`, and so is an equal value. Two empty trees → `True`.\n\n`all_bigger(build_tree([5, 3, 9]), build_tree([4, 1, 8]))` is `True`. Against `build_tree([4, 3, 8])` it is `False`, because 3 is not larger than 3.',
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
          hints: ['Same two base cases as any pair of trees: both `None`, then exactly one `None`.', 'Check this pair of values, then both child pairs with `and`.'],
          signature: 'dfs:pair-compare-values',
          minutes: 7,
        }),
        debug({
          id: 'd06-pair-dbg-values',
          title: 'Debug: values match, trees don’t',
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: '`a` and `b` are the roots of two binary trees; either may be `None`. `trees_equal(a, b)` should return `True` only when both trees have the same shape **and** the same value in every matching position. It says `True` for some trees that differ. Fix it.',
          brokenCode: `def trees_equal(a, b):
    if a is None or b is None:
        return True
    if a.val != b.val:
        return False
    return trees_equal(a.left, b.left) and trees_equal(a.right, b.right)
`,
          solution: `def trees_equal(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    if a.val != b.val:
        return False
    return trees_equal(a.left, b.left) and trees_equal(a.right, b.right)
`,
          tests: [t.eq('trees_equal(build_tree([1, 2]), build_tree([1]))', 'False'), t.eq('trees_equal(build_tree([1, 2, 3]), build_tree([1, 2, 3]))', 'True'), t.hidden('trees_equal(None, TreeNode(4))', 'False'), t.hidden('trees_equal(build_tree([1, 2]), build_tree([1, 3]))', 'False')],
          hints: ['Compare [1, 2] with [1]. Which pair of nodes reaches the first `if`?', 'Only both-None is a match.'],
          signature: 'debug:pair-structure-check',
          minutes: 4,
        }),
        write({
          id: 'd06-pair-mirror',
          title: 'Mirror images',
          ...pattern,
          difficulty: 3,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: '`a` and `b` are the roots of two binary trees; either may be `None`. Write `is_mirror(a, b)` returning `True` if `b` is the **mirror image** of `a`: what you would see holding `a` up to a mirror. The two roots hold the same value, and whatever hangs on the left of a node in `a` hangs on the right of the matching node in `b`, all the way down. Otherwise return `False`. Two empty trees are mirror images; an empty tree and a non-empty one are not.\n\n```python\n#     1        1\n#    / \\      / \\\n#   2   3    3   2\n```\n\n`is_mirror(build_tree([1, 2, 3]), build_tree([1, 3, 2]))` is `True`. `is_mirror(build_tree([1, 2, 3]), build_tree([1, 2, 3]))` is `False`.',
          transfer: true,
          starterCode: `def is_mirror(a, b):\n    pass\n`,
          solution: `def is_mirror(a, b):
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    if a.val != b.val:
        return False
    return is_mirror(a.left, b.right) and is_mirror(a.right, b.left)
`,
          tests: [t.eq('is_mirror(build_tree([1, 2, 3]), build_tree([1, 3, 2]))', 'True'), t.eq('is_mirror(build_tree([1, 2, 3]), build_tree([1, 2, 3]))', 'False'), t.hidden('is_mirror(None, None)', 'True'), t.hidden('is_mirror(build_tree([1, 2, None, 4]), build_tree([1, None, 2, None, 4]))', 'True'), t.hidden('is_mirror(build_tree([1, 2]), build_tree([1, 2]))', 'False')],
          hints: ['You have compared two trees node by node. What changes when one of them is flipped left to right?', 'The same pair base cases: both `None`, then exactly one `None`, then the two values.', 'Which child of `a` lines up with which child of `b`?', 'Pair (a.left, b.right) and (a.right, b.left).'],
          signature: 'dfs:pair-mirror',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────── Capstone: same tree ─────────────────────────────
    {
      id: 'd06-cap-same',
      title: 'Capstone: Same Tree',
      summary: 'Pair recursion from a bare signature, then explain it.',
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
      summary: 'Swap children safely, mutate in place, build new trees, and return the root.',
      exercises: [
        output({
          id: 'd06-mut-swap',
          title: 'Tuple swap',
          skills: ['treenode'],
          prompt: '`tree_to_array(root)` is provided: it is the reverse of `build_tree`, turning a tree back into its level-order list. Predict the output.',
          note: 'Python works out the whole right-hand side before it assigns anything, so `a, b = b, a` swaps two things without a temporary variable.',
          code: `root = build_tree([1, 2, 3])
root.left, root.right = root.right, root.left
print(tree_to_array(root))`,
          expectedOutput: '[1, 3, 2]',
          explanation: 'The right-hand side is evaluated completely first, so both old children are saved before either is overwritten.',
          signature: 'trace:tree-swap-tuple',
        }),
        debug({
          id: 'd06-mut-dbg-swap',
          title: 'Debug: swap the root’s children',
          skills: ['treenode', 'linked_list_reassignment'],
          prompt: '`root` is the top node of a binary tree, or `None`. `swap_top(root)` should swap the root’s two children with each other (only those two; nothing deeper changes) and return `root`. `None` stays `None`. So the tree `[1, 2, 3]` becomes `[1, 3, 2]`. The result has a child missing. Fix it.',
          brokenCode: `def swap_top(root):
    if root:
        root.left = root.right
        root.right = root.left
    return root
`,
          solution: `def swap_top(root):
    if root:
        root.left, root.right = root.right, root.left
    return root
`,
          tests: [t.eq('tree_to_array(swap_top(build_tree([1, 2, 3])))', '[1, 3, 2]'), t.eq('swap_top(None)', 'None'), t.hidden('tree_to_array(swap_top(build_tree([1, 2])))', '[1, None, 2]')],
          hints: ['After the first assignment, where is the old left child?', 'Same rule as linked lists: save it before you overwrite it.'],
          signature: 'debug:tree-swap-no-temp',
          minutes: 3,
        }),
        write({
          id: 'd06-mut-add-one',
          title: 'Add one everywhere',
          ...combine,
          skills: ['tree_dfs', 'recursion_base_case'],
          prompt: '`root` is the top node of a binary tree, or `None` for an empty tree. Every node holds a number in `.val`. Write `add_one(root)` that adds 1 to every value in the tree **in place**, meaning it changes the existing nodes instead of building new ones, and returns the same `root`. For an empty tree return `None`.\n\n`build_tree([1, 2, 3, None, 5])` becomes the tree `[2, 3, 4, None, 6]`: the same shape, every value one larger.',
          transfer: true,
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
          hints: ['Every node needs the same small change. Who takes care of the nodes below this one?', 'Recursion: change this node, then call `add_one` on each child. What should an empty tree do?', 'Base case: `None` → return `None`. The calls on the children change those nodes; you do not need what they return.', 'Return root so the caller gets the tree back.'],
          signature: 'dfs:mutate-values',
          minutes: 5,
        }),
        write({
          id: 'd06-mut-copy',
          title: 'Copy a tree',
          ...combine,
          skills: ['tree_dfs', 'recursion_return', 'treenode'],
          prompt: '`root` is the top node of a binary tree, or `None`. Write `copy_tree(root)` returning the root of a **brand-new** tree with the same shape and values. Every node of the copy is a new `TreeNode`, so changing the copy never changes the original; this is the opposite of working in place. The copy of an empty tree is `None`.\n\n`TreeNode(val, left, right)` makes a new node with those two children. A recursive call on `root.left` hands back the root of a finished copy of the whole left subtree.',
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
          minutes: 6,
        }),
        debug({
          id: 'd06-mut-dbg-mirror',
          title: 'Debug: mirrored copy',
          skills: ['tree_dfs', 'recursion_return'],
          prompt: '`root` is the top node of a binary tree, or `None`. `mirror(root)` should turn the tree into its **mirror image** in place (at every node the left and right subtrees trade places; no new nodes) and return the root. The tree `[2, 1, 3]` should become `[2, 3, 1]`. Instead the result has duplicated subtrees. Fix it.',
          brokenCode: `def mirror(root):
    if root is None:
        return None
    root.left = mirror(root.right)
    root.right = mirror(root.left)
    return root
`,
          solution: `def mirror(root):
    if root is None:
        return None
    left = mirror(root.left)
    right = mirror(root.right)
    root.left = right
    root.right = left
    return root
`,
          tests: [t.eq('tree_to_array(mirror(build_tree([2, 1, 3])))', '[2, 3, 1]'), t.eq('tree_to_array(mirror(build_tree([4, 2, 7, 1, 3, 6, 9])))', '[4, 7, 2, 9, 6, 3, 1]'), t.hidden('mirror(None)', 'None'), t.hidden('tree_to_array(mirror(build_tree([1, 2])))', '[1, None, 2]')],
          hints: ['When the second line runs, what is root.left?', 'Compute both mirrored children before overwriting either one (temps or tuple assignment).'],
          signature: 'debug:tree-invert-overwrite',
          minutes: 4,
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
      summary: 'No scaffolding: recursion and tree DFS from a bare signature.',
      exercises: [
        write({
          id: 'd06-cold-digits',
          title: 'Digit sum, recursively',
          ...cold,
          skills: ['recursion_base_case', 'recursion_return'],
          prompt: 'Write `digit_sum(n)` for `n >= 0` recursively: `digit_sum(4096)` is 19. Use `% 10` and `// 10`.',
          starterCode: `def digit_sum(n):\n    pass\n`,
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
        write({
          id: 'd06-cold-tree-sum',
          title: 'Tree sum, cold',
          ...cold,
          skills: ['tree_dfs', 'recursion_return'],
          prompt: 'Write `total(root)`: the sum of all values in a binary tree.',
          starterCode: `def total(root):\n    pass\n`,
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
        write({
          id: 'd06-cold-postorder',
          title: 'Postorder, cold',
          ...cold,
          skills: ['tree_dfs', 'list_append'],
          prompt: 'Write `postorder(root)` returning the values in postorder (left, right, node).',
          starterCode: `def postorder(root):\n    pass\n`,
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
        write({
          id: 'd06-cold-height',
          title: 'Height, cold',
          ...cold,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Write `height(root)`: number of nodes on the longest root-to-leaf path (0 for empty).',
          starterCode: `def height(root):\n    pass\n`,
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
        write({
          id: 'd06-cold-same',
          title: 'Same tree, cold',
          ...cold,
          skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
          prompt: 'Write `equal(a, b)`: `True` if the two trees have the same shape and the same values.',
          starterCode: `def equal(a, b):\n    pass\n`,
          solution: `def equal(a, b):
    if not a and not b:
        return True
    if not a or not b:
        return False
    return a.val == b.val and equal(a.left, b.left) and equal(a.right, b.right)
`,
          tests: [t.eq('equal(build_tree([1, 2, 3]), build_tree([1, 2, 3]))', 'True'), t.eq('equal(build_tree([1, 2]), build_tree([1, None, 2]))', 'False'), t.hidden('equal(None, None)', 'True'), t.hidden('equal(build_tree([1]), None)', 'False')],
          hints: ['Both None, then one None, then values and both child pairs.'],
          signature: 'dfs:same-tree-cold',
          minutes: 5,
        }),
        write({
          id: 'd06-cold-mirror',
          title: 'Mirror, cold',
          ...cold,
          skills: ['tree_dfs', 'treenode'],
          prompt: 'Write `flip_tree(root)` that inverts a binary tree in place and returns the root.',
          starterCode: `def flip_tree(root):\n    pass\n`,
          solution: `def flip_tree(root):
    if root:
        root.left, root.right = root.right, root.left
        flip_tree(root.left)
        flip_tree(root.right)
    return root
`,
          tests: [t.eq('tree_to_array(flip_tree(build_tree([1, 2, 3, 4])))', '[1, 3, 2, None, None, None, 4]'), t.hidden('flip_tree(None)', 'None'), t.hidden('tree_to_array(flip_tree(build_tree([4, 2, 7, 1, 3, 6, 9])))', '[4, 7, 2, 9, 6, 3, 1]')],
          hints: ['Swap, then recurse into both.'],
          signature: 'dfs:invert-cold',
          minutes: 6,
        }),
      ],
    },
  ],
  capstones: ['max-depth', 'same-tree', 'invert-tree'],
}
