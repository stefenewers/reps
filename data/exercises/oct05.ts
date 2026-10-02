import type { DayModule } from '@/lib/types'
import { capstone, choice, code, explain, fill, output, reorder, t } from './build'

const cold = { stage: 'retrieval' as const, repType: 'cold' as const }
const combine = { stage: 'combine' as const, repType: 'combine' as const }
const pattern = { stage: 'pattern' as const, repType: 'pattern' as const }

export const day: DayModule = {
  date: '2026-10-05',
  short: 'Search',
  title: 'Binary search + linked lists',
  focus: 'Make lo/hi/mid and prev/curr/nxt automatic: halve a sorted range without off-by-one bugs, and rewire .next pointers without losing the list.',
  sections: [
    // ───────────────────────────── Warm-up ─────────────────────────────
    {
      id: 'd05-warmup',
      title: 'Warm-up',
      summary: 'Cold reps on sets, index maps, two pointers, windows and stacks.',
      exercises: [
        code({
          id: 'd05-warm-first-dup',
          title: 'First repeated value',
          ...cold,
          skills: ['set_membership', 'set_add', 'early_return'],
          prompt: "Write `first_repeat(nums)` that returns the first value that appears a second time while scanning left to right, or `None` if every value is unique.",
          starterCode: `def first_repeat(nums):\n    pass\n`,
          solution: `def first_repeat(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return x
        seen.add(x)
    return None
`,
          tests: [t.eq('first_repeat([3, 1, 4, 1, 3])', '1'), t.eq('first_repeat([1, 2, 3])', 'None'), t.hidden('first_repeat([])', 'None'), t.hidden('first_repeat([5, 5])', '5')],
          hints: ['Remember what you have already seen.', 'A set gives O(1) membership checks: check, then add.'],
          signature: 'set:first-repeat',
          minutes: 5,
        }),
        code({
          id: 'd05-warm-two-sum',
          title: 'Two Sum, cold',
          ...cold,
          skills: ['index_map', 'complement', 'enumerate'],
          prompt: "Write `two_sum(nums, target)` returning the indexes `[i, j]` (i < j) of the two numbers that add to `target`. Exactly one answer exists. One pass.",
          starterCode: `def two_sum(nums, target):\n    pass\n`,
          solution: `def two_sum(nums, target):
    index_of = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in index_of:
            return [index_of[need], i]
        index_of[x] = i
`,
          tests: [t.eq('two_sum([2, 7, 11, 15], 9)', '[0, 1]'), t.eq('two_sum([3, 2, 4], 6)', '[1, 2]'), t.hidden('two_sum([3, 3], 6)', '[0, 1]'), t.hidden('two_sum([-1, -2, -3, -4], -7)', '[2, 3]')],
          hints: ['For each number, what partner do you need?', 'Map value -> index for everything seen so far; check the complement before storing.'],
          signature: 'index-map:two-sum',
          minutes: 6,
          important: true,
        }),
        code({
          id: 'd05-warm-pal',
          title: 'Palindrome with two pointers',
          ...cold,
          skills: ['two_pointer', 'string_index', 'while_loop'],
          prompt: "Write `is_pal(s)` with two indexes moving inward (no slicing, no reversing). Return `True` if `s` reads the same both ways.",
          starterCode: `def is_pal(s):\n    pass\n`,
          solution: `def is_pal(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i += 1
        j -= 1
    return True
`,
          tests: [t.eq('is_pal("racecar")', 'True'), t.eq('is_pal("ab")', 'False'), t.hidden('is_pal("")', 'True'), t.hidden('is_pal("a")', 'True'), t.hidden('is_pal("abca")', 'False')],
          hints: ['Compare the outermost pair, then step both inward.', 'while i < j: compare s[i] and s[j], then i += 1 and j -= 1.'],
          signature: 'two-pointer:palindrome',
          minutes: 5,
        }),
        code({
          id: 'd05-warm-window',
          title: 'Best window of size k',
          ...cold,
          skills: ['sliding_window', 'window_state'],
          prompt: "Write `max_window(nums, k)` returning the largest sum of any `k` consecutive numbers. Assume `1 <= k <= len(nums)`. Slide the window: add the new item, drop the old one.",
          starterCode: `def max_window(nums, k):\n    pass\n`,
          solution: `def max_window(nums, k):
    total = sum(nums[:k])
    best = total
    for i in range(k, len(nums)):
        total += nums[i] - nums[i - k]
        best = max(best, total)
    return best
`,
          tests: [t.eq('max_window([1, 4, 2, 10, 2], 2)', '12'), t.eq('max_window([5], 1)', '5'), t.hidden('max_window([-3, -1, -2], 2)', '-3'), t.hidden('max_window([2, 2, 2, 2], 4)', '8')],
          hints: ['Start with the sum of the first k items.', 'Each step: total += nums[i] - nums[i - k].'],
          signature: 'window:fixed-max-sum',
          minutes: 6,
        }),
        code({
          id: 'd05-warm-brackets',
          title: 'Balanced brackets',
          ...cold,
          skills: ['stack_push_pop', 'matching_pairs', 'dict_lookup'],
          prompt: "Write `balanced(s)` for strings of `()[]{}`. Return `True` if every bracket closes in the right order.",
          starterCode: `def balanced(s):\n    pass\n`,
          solution: `def balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
`,
          tests: [t.eq('balanced("([]{})")', 'True'), t.eq('balanced("(]")', 'False'), t.hidden('balanced("")', 'True'), t.hidden('balanced("((")', 'False'), t.hidden('balanced(")(")', 'False')],
          hints: ['Openers wait on a stack; closers must match the top.', 'Map closer -> opener. At the end the stack must be empty.'],
          signature: 'stack:balanced',
          minutes: 6,
        }),
      ],
    },

    // ───────────────────────────── While + indexes ─────────────────────────────
    {
      id: 'd05-while',
      title: 'While + indexes',
      summary: 'Loops that move an index on purpose and stop for a reason.',
      exercises: [
        choice({
          id: 'd05-while-progress',
          title: 'Does it stop?',
          skills: ['while_loop'],
          prompt: 'What happens when this runs?',
          code: `i = 0
while i < 5:
    print(i)`,
          options: ['Prints 0 to 4', 'Never stops: i never changes', 'Prints nothing', 'IndexError'],
          answer: 1,
          note: 'Every while loop needs progress: something in the body must move toward making the condition False.',
          explanation: 'Nothing changes i, so `i < 5` stays True forever. Binary search has the same risk if lo or hi fails to move.',
          signature: 'choice:while-progress',
        }),
        output({
          id: 'd05-while-halve',
          title: 'Halving trace',
          skills: ['while_loop'],
          prompt: 'Predict the output.',
          code: `n = 20
steps = 0
while n > 1:
    n = n // 2
    steps += 1
    print(n, steps)`,
          expectedOutput: '10 1\n5 2\n2 3\n1 4',
          explanation: 'Integer halving reaches 1 in about log2(n) steps. That is exactly why binary search is O(log n).',
          signature: 'trace:while-halve',
        }),
        output({
          id: 'd05-while-meet',
          title: 'Two indexes closing in',
          skills: ['while_loop', 'two_pointer'],
          prompt: 'Predict the output.',
          code: `lo, hi = 0, 6
while lo <= hi:
    print(lo, hi)
    lo += 2
    hi -= 1`,
          expectedOutput: '0 6\n2 5\n4 4',
          explanation: 'The loop still runs when lo == hi (4 4). Next lo is 6 and hi is 3, so lo > hi and it stops.',
          signature: 'trace:while-lo-hi',
        }),
        fill({
          id: 'd05-while-fill-neg',
          title: 'Scan until a condition',
          skills: ['while_loop', 'list_index'],
          prompt: 'Fill the blank so the loop walks forward while the current value is **not** negative. The function returns the index of the first negative value, or -1.',
          starterCode: `def first_negative(nums):
    i = 0
    while i < len(nums) and ____:
        i += 1
    return i if i < len(nums) else -1
`,
          solution: `def first_negative(nums):
    i = 0
    while i < len(nums) and nums[i] >= 0:
        i += 1
    return i if i < len(nums) else -1
`,
          tests: [t.eq('first_negative([3, 0, -2, 5])', '2'), t.eq('first_negative([1, 2])', '-1'), t.hidden('first_negative([])', '-1'), t.hidden('first_negative([-1])', '0')],
          hints: ['Keep going while nums[i] is still fine.'],
          note: 'Put the bounds check first: `i < len(nums) and nums[i] ...` so nums[i] is never read out of range.',
          signature: 'fill:while-scan',
        }),
        code({
          id: 'd05-while-halvings',
          title: 'Count the halvings',
          skills: ['while_loop', 'accumulator'],
          prompt: 'Write `halvings(n)` returning how many times you can do `n = n // 2` before `n` becomes 1. `n >= 1`.',
          starterCode: `def halvings(n):\n    pass\n`,
          solution: `def halvings(n):
    count = 0
    while n > 1:
        n //= 2
        count += 1
    return count
`,
          tests: [t.eq('halvings(8)', '3'), t.eq('halvings(20)', '4'), t.hidden('halvings(1)', '0'), t.hidden('halvings(1000)', '9')],
          hints: ['Loop while n > 1.', 'Inside: halve n, count one step.'],
          signature: 'while:count-halvings',
          minutes: 4,
        }),
        code({
          id: 'd05-while-first-at-least',
          title: 'First index at least target (slow way)',
          skills: ['while_loop', 'list_index'],
          prompt: '`nums` is sorted ascending. Write `first_at_least(nums, target)` with a while loop that returns the first index `i` with `nums[i] >= target`, or `len(nums)` if there is none.\n\nThis is O(n). By the end of the next section you will do the same thing in O(log n).',
          starterCode: `def first_at_least(nums, target):\n    pass\n`,
          solution: `def first_at_least(nums, target):
    i = 0
    while i < len(nums) and nums[i] < target:
        i += 1
    return i
`,
          tests: [t.eq('first_at_least([1, 3, 5, 7], 4)', '2'), t.eq('first_at_least([1, 3, 5, 7], 9)', '4'), t.hidden('first_at_least([], 1)', '0'), t.hidden('first_at_least([2, 2, 2], 2)', '0')],
          hints: ['Walk forward while the value is too small.', 'Bounds check first, then nums[i] < target.'],
          signature: 'while:lower-bound-linear',
          minutes: 4,
        }),
      ],
    },

    // ───────────────────────────── Binary search ─────────────────────────────
    {
      id: 'd05-bs',
      title: 'Binary search',
      summary: 'lo, hi, mid: trace it, fill it, then write it cold.',
      exercises: [
        choice({
          id: 'd05-bs-sorted',
          title: 'What binary search needs',
          skills: ['binary_search'],
          prompt: 'Binary search compares the target with the middle value and throws away half the list. What must be true about the list?',
          options: ['It must be sorted', 'It must have no negative numbers', 'Its length must be a power of 2', 'It must have no duplicates'],
          answer: 0,
          note: 'Sorted order is what lets one comparison rule out a whole half.',
          explanation: 'If nums[mid] < target and the list is sorted, everything left of mid is also < target, so that half can go. Without order, no half can be ruled out.',
          signature: 'choice:bs-precondition',
        }),
        output({
          id: 'd05-bs-trace-found',
          title: 'Trace: target found',
          skills: ['binary_search', 'mid_calc'],
          prompt: 'Predict the output. Track lo, hi and mid on paper.',
          code: `nums = [1, 3, 5, 7, 9, 11, 13]
target = 11
lo, hi = 0, len(nums) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    print(lo, hi, mid)
    if nums[mid] == target:
        print("found", mid)
        break
    elif nums[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1`,
          expectedOutput: '0 6 3\n4 6 5\nfound 5',
          explanation: 'nums[3] = 7 < 11, so the target is right of mid: lo = 4. Then mid = 5 and nums[5] = 11.',
          signature: 'trace:bs-found',
          minutes: 2,
          important: true,
        }),
        output({
          id: 'd05-bs-trace-missing',
          title: 'Trace: target missing',
          skills: ['binary_search', 'search_invariant'],
          prompt: 'Predict the output. Pay attention to where lo and hi end up.',
          code: `nums = [2, 4, 6, 8, 10]
target = 5
lo, hi = 0, len(nums) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    print(lo, hi, mid)
    if nums[mid] == target:
        break
    elif nums[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
print("end", lo, hi)`,
          expectedOutput: '0 4 2\n0 1 0\n1 1 1\nend 2 1',
          explanation: 'The loop ends with lo = hi + 1. lo (2) is exactly where 5 would be inserted: everything left of lo is < 5, everything from lo on is > 5.',
          signature: 'trace:bs-missing',
          minutes: 2,
          important: true,
        }),
        choice({
          id: 'd05-bs-why-lte',
          title: 'Why lo <= hi?',
          skills: ['search_invariant'],
          prompt: 'With `hi = len(nums) - 1`, why is the loop `while lo <= hi` rather than `while lo < hi`?',
          options: [
            'When lo == hi there is still one index left to check',
            'It makes the loop run faster',
            'lo < hi would raise IndexError',
            'They behave the same',
          ],
          answer: 0,
          note: 'Invariant: if the target exists, it is inside nums[lo..hi] (both ends included). The range is empty only when lo > hi.',
          explanation: 'Both ends are inclusive, so lo == hi is a one-element range. Stopping there would skip it: search([5], 5) would return -1.',
          signature: 'choice:bs-loop-condition',
        }),
        choice({
          id: 'd05-bs-stuck',
          title: 'Forgetting the +1',
          skills: ['mid_calc', 'search_invariant'],
          prompt: 'Someone wrote `lo = mid` instead of `lo = mid + 1`. With `nums = [1, 3]` and `target = 3`, what happens?',
          code: `lo, hi = 0, 1
while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target:
        break
    elif nums[mid] < target:
        lo = mid
    else:
        hi = mid - 1`,
          options: ['It loops forever: mid stays 0', 'It finds 3 at index 1', 'IndexError', 'It returns -1'],
          answer: 0,
          explanation: 'mid = 0, nums[0] = 1 < 3, so lo = mid = 0 again. Nothing changes. mid was already checked, so always step past it: mid + 1 or mid - 1.',
          signature: 'choice:bs-infinite-loop',
        }),
        fill({
          id: 'd05-bs-fill-mid',
          title: 'Fill: mid',
          skills: ['mid_calc', 'binary_search'],
          prompt: 'Fill in the middle index.',
          starterCode: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = ____
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          tests: [t.eq('search([1, 3, 5, 7], 5)', '2'), t.eq('search([1, 3, 5, 7], 4)', '-1'), t.hidden('search([9], 9)', '0')],
          hints: ['Floor division of lo + hi.'],
          signature: 'fill:bs-mid',
        }),
        fill({
          id: 'd05-bs-fill-move',
          title: 'Fill: move lo',
          skills: ['mid_calc', 'search_invariant'],
          prompt: 'The middle value is too small. Fill in where `lo` goes.',
          starterCode: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = ____
        else:
            hi = mid - 1
    return -1
`,
          solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          tests: [t.eq('search([1, 3, 5, 7], 7)', '3'), t.eq('search([1, 3], 3)', '1'), t.hidden('search([1, 3, 5, 7], 8)', '-1')],
          hints: ['mid is already ruled out. Step one past it.'],
          signature: 'fill:bs-move-lo',
        }),
        code({
          id: 'd05-bs-one-line',
          title: 'One line: discard a half',
          stage: 'recall',
          skills: ['mid_calc'],
          prompt: 'The target is **smaller** than `nums[mid]`. Write the one line that throws away mid and everything to its right.',
          starterCode: `lo, hi, mid = 0, 9, 4\n# your line here\n`,
          solution: `lo, hi, mid = 0, 9, 4\nhi = mid - 1\n`,
          tests: [t.check('hi moved', 'assert hi == 3, f"hi is {hi}"'), t.check('lo unchanged', 'assert lo == 0')],
          hints: ['Which end moves when the answer is on the left?'],
          signature: 'recall:bs-move-hi',
          minutes: 1.5,
        }),
        code({
          id: 'd05-bs-body',
          title: 'Write the loop',
          skills: ['binary_search', 'mid_calc', 'search_invariant'],
          prompt: 'The setup and the final `return -1` are given. Write the while loop that returns the index of `target`.',
          starterCode: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    # while loop here

    return -1
`,
          solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          tests: [t.eq('search([-3, 0, 4, 8, 12], 8)', '3'), t.eq('search([-3, 0, 4, 8, 12], 5)', '-1'), t.hidden('search([-3, 0, 4, 8, 12], -3)', '0'), t.hidden('search([2], 1)', '-1')],
          hints: ['Loop while the range is non-empty.', 'Compute mid, compare three ways.', 'Too small → lo = mid + 1; too big → hi = mid - 1.'],
          signature: 'bs:write-loop',
          minutes: 7,
          important: true,
        }),
        reorder({
          id: 'd05-bs-reorder',
          title: 'Reassemble binary search',
          skills: ['binary_search', 'mid_calc'],
          prompt: 'Put the lines in order (indentation is shown).',
          lines: [
            'def search(nums, target):',
            '    lo, hi = 0, len(nums) - 1',
            '    while lo <= hi:',
            '        mid = (lo + hi) // 2',
            '        if nums[mid] == target:',
            '            return mid',
            '        elif nums[mid] < target:',
            '            lo = mid + 1',
            '        else:',
            '            hi = mid - 1',
            '    return -1',
          ],
          tests: [t.eq('search([1, 2, 3, 4, 5], 4)', '3'), t.eq('search([1, 2, 3, 4, 5], 0)', '-1')],
          signature: 'reorder:bs',
          minutes: 4,
        }),
        code({
          id: 'd05-bs-contains',
          title: 'Contains, no scaffolding',
          skills: ['binary_search', 'mid_calc', 'search_invariant'],
          prompt: 'Write `contains(nums, target)` that returns `True` or `False` in O(log n). `nums` is sorted ascending.',
          starterCode: `def contains(nums, target):\n    pass\n`,
          solution: `def contains(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return True
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
`,
          tests: [t.eq('contains([1, 4, 9, 16], 9)', 'True'), t.eq('contains([1, 4, 9, 16], 10)', 'False'), t.hidden('contains([], 1)', 'False'), t.hidden('contains([7], 7)', 'True'), t.hidden('contains([1, 4, 9, 16], 17)', 'False')],
          hints: ['Same loop as search.', 'Return True instead of mid, False after the loop.'],
          signature: 'bs:contains',
          minutes: 6,
        }),
        output({
          id: 'd05-bs-steps',
          title: 'How many steps?',
          skills: ['binary_search', 'complexity'],
          prompt: 'Predict the output: how many loop iterations to rule out a target bigger than everything in 16 items?',
          code: `nums = list(range(16))
target = 100
lo, hi = 0, len(nums) - 1
steps = 0
while lo <= hi:
    steps += 1
    mid = (lo + hi) // 2
    if nums[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
print(steps)`,
          expectedOutput: '5',
          explanation: 'About log2(16) + 1 = 5 steps. Doubling n adds one step: O(log n).',
          signature: 'trace:bs-step-count',
          minutes: 2,
        }),
      ],
    },

    // ───────────────────────────── Search variants ─────────────────────────────
    {
      id: 'd05-variants',
      title: 'Search variants',
      summary: 'Same skeleton, different question: insertion point, first/last, search on an answer.',
      exercises: [
        choice({
          id: 'd05-var-lo-meaning',
          title: 'What is lo at the end?',
          skills: ['search_invariant'],
          prompt: 'Standard binary search (`lo <= hi`, `lo = mid + 1`, `hi = mid - 1`) finishes **without** finding the target. What is `lo`?',
          options: ['The index where target would be inserted to keep the list sorted', 'Always 0', 'The index of the closest value', 'len(nums) - 1'],
          answer: 0,
          note: 'Everything left of lo is < target, everything right of hi is > target. When the loop ends, lo = hi + 1 is the boundary.',
          signature: 'choice:bs-lo-insert',
        }),
        output({
          id: 'd05-var-lo-trace',
          title: 'Insertion points',
          skills: ['search_invariant', 'binary_search'],
          prompt: 'Predict the output.',
          code: `def where(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo

nums = [2, 4, 6, 8, 10]
print(where(nums, 0), where(nums, 6), where(nums, 7), where(nums, 11))`,
          expectedOutput: '0 2 3 5',
          explanation: 'This version never returns early, so lo always lands on the first index whose value is >= target. 6 is at 2; 7 would go at 3; 11 goes at the end, 5.',
          signature: 'trace:bs-lower-bound',
          minutes: 2,
        }),
        code({
          id: 'd05-var-insert',
          title: 'Search insert position',
          ...pattern,
          skills: ['binary_search', 'search_invariant'],
          prompt: '`nums` is sorted with distinct values. Write `insert_at(nums, target)`: the index of `target` if present, otherwise the index where it would be inserted. O(log n).',
          starterCode: `def insert_at(nums, target):\n    pass\n`,
          solution: `def insert_at(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo
`,
          tests: [t.eq('insert_at([1, 3, 5, 6], 5)', '2'), t.eq('insert_at([1, 3, 5, 6], 2)', '1'), t.hidden('insert_at([1, 3, 5, 6], 7)', '4'), t.hidden('insert_at([1, 3, 5, 6], 0)', '0'), t.hidden('insert_at([], 4)', '0')],
          hints: ['Normal binary search.', 'What does lo mean after the loop?', 'Return lo instead of -1.'],
          signature: 'bs:insert-position',
          minutes: 7,
          important: true,
        }),
        code({
          id: 'd05-var-first',
          title: 'First occurrence',
          ...pattern,
          skills: ['binary_search', 'search_invariant'],
          prompt: '`nums` is sorted and may contain duplicates. Write `first_index(nums, target)` returning the **leftmost** index of `target`, or -1. O(log n).',
          starterCode: `def first_index(nums, target):\n    pass\n`,
          solution: `def first_index(nums, target):
    lo, hi = 0, len(nums) - 1
    ans = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            ans = mid
            hi = mid - 1
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
`,
          tests: [t.eq('first_index([1, 2, 2, 2, 3], 2)', '1'), t.eq('first_index([1, 2, 3], 4)', '-1'), t.hidden('first_index([5, 5, 5, 5], 5)', '0'), t.hidden('first_index([], 5)', '-1'), t.hidden('first_index([1, 1, 2], 2)', '2')],
          hints: ['Finding one copy is not enough; there may be more to the left.', 'Remember the match in a variable.', 'On a match: ans = mid, then keep searching left with hi = mid - 1.'],
          signature: 'bs:first-occurrence',
          minutes: 8,
        }),
        code({
          id: 'd05-var-last',
          title: 'Last occurrence',
          ...pattern,
          skills: ['binary_search', 'search_invariant'],
          prompt: 'Now the **rightmost** index: `last_index(nums, target)`, or -1.',
          starterCode: `def last_index(nums, target):\n    pass\n`,
          solution: `def last_index(nums, target):
    lo, hi = 0, len(nums) - 1
    ans = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            ans = mid
            lo = mid + 1
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
`,
          tests: [t.eq('last_index([1, 2, 2, 2, 3], 2)', '3'), t.eq('last_index([1, 2, 3], 0)', '-1'), t.hidden('last_index([5, 5, 5, 5], 5)', '3'), t.hidden('last_index([4], 4)', '0')],
          hints: ['Mirror of first occurrence.', 'On a match, record it and keep searching right.'],
          signature: 'bs:last-occurrence',
          minutes: 6,
        }),
        code({
          id: 'd05-var-sqrt',
          title: 'Search on the answer: floor sqrt',
          ...pattern,
          difficulty: 3,
          skills: ['binary_search', 'mid_calc', 'search_invariant'],
          prompt: 'Write `floor_sqrt(x)` for `x >= 0`: the largest integer `r` with `r * r <= x`. No `**0.5` or `math`. Binary search over the possible answers `0..x`.',
          starterCode: `def floor_sqrt(x):\n    pass\n`,
          solution: `def floor_sqrt(x):
    lo, hi = 0, x
    ans = 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
`,
          tests: [t.eq('floor_sqrt(16)', '4'), t.eq('floor_sqrt(15)', '3'), t.hidden('floor_sqrt(0)', '0'), t.hidden('floor_sqrt(1)', '1'), t.hidden('floor_sqrt(2147395599)', '46339')],
          hints: ['You are not searching a list; you are searching the numbers 0..x.', 'If mid * mid <= x, mid is a candidate and bigger might work.', 'Record ans = mid and go right; otherwise go left.'],
          signature: 'bs:answer-space',
          minutes: 9,
        }),
        code({
          id: 'd05-var-first-true',
          title: 'First True',
          ...pattern,
          skills: ['binary_search', 'search_invariant'],
          prompt: '`flags` is some `False` values followed by some `True` values (either part may be empty). Write `first_true(flags)` returning the index of the first `True`, or `len(flags)`. O(log n).',
          starterCode: `def first_true(flags):\n    pass\n`,
          solution: `def first_true(flags):
    lo, hi = 0, len(flags) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if flags[mid]:
            hi = mid - 1
        else:
            lo = mid + 1
    return lo
`,
          tests: [t.eq('first_true([False, False, True, True])', '2'), t.eq('first_true([True])', '0'), t.hidden('first_true([False, False])', '2'), t.hidden('first_true([])', '0'), t.hidden('first_true([False, True, True, True, True])', '1')],
          hints: ['This is the insertion-point idea with a yes/no test.', 'True at mid → the answer is at mid or left of it.', 'Return lo after the loop.'],
          explanation: 'Many "find the first bad version / smallest valid value" questions are this shape: a monotonic yes/no condition.',
          signature: 'bs:first-true',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────── Capstone: search ─────────────────────────────
    {
      id: 'd05-cap-search',
      title: 'Capstone: Binary Search',
      summary: 'Write it cold with edge cases, then explain it.',
      exercises: [
        capstone({
          id: 'cap-binary-search',
          problemId: 'binary-search',
          title: 'Binary Search',
          skills: ['binary_search', 'mid_calc', 'search_invariant', 'while_loop'],
          prompt: 'You get a list of distinct integers in increasing order and a value to look for. Return the position of that value in the list, or -1 if it is not there.\n\nYour solution must take O(log n) time, so a linear scan is not allowed.',
          starterCode: `def search(nums: List[int], target: int) -> int:\n    pass\n`,
          solution: `def search(nums: List[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          examples: [
            { input: 'nums = [-4, 0, 3, 8, 15], target = 8', output: '3' },
            { input: 'nums = [-4, 0, 3, 8, 15], target = 2', output: '-1' },
            { input: 'nums = [6], target = 6', output: '0' },
          ],
          tests: [
            t.eq('search([-4, 0, 3, 8, 15], 8)', '3'),
            t.eq('search([-4, 0, 3, 8, 15], 2)', '-1'),
            t.eq('search([6], 6)', '0'),
            t.hidden('search([], 1)', '-1'),
            t.hidden('search([6], 5)', '-1'),
            t.hidden('search([1, 2, 3, 4, 5, 6], 1)', '0'),
            t.hidden('search([1, 2, 3, 4, 5, 6], 6)', '5'),
            t.hidden('search([-10, -5, -2], -5)', '1'),
            t.hidden('search(list(range(0, 2000, 2)), 1998)', '999'),
            t.hidden('search(list(range(0, 2000, 2)), 7)', '-1'),
          ],
          hints: [
            'Sorted input + O(log n) means: rule out half the remaining range every step.',
            'Keep two indexes lo and hi; the target, if present, is always within nums[lo..hi].',
            'mid = (lo + hi) // 2. Too small → lo = mid + 1. Too big → hi = mid - 1.',
            'Loop while lo <= hi; return mid on a match; return -1 after the loop.',
          ],
          complexity: { time: 'O(log n)', space: 'O(1)' },
          explanation: 'Each iteration checks the middle of the live range and discards the half that cannot hold the target, so the range shrinks by half every step. The loop ends when lo passes hi, meaning the range is empty.',
          signature: 'capstone:binary-search',
          minutes: 25,
        }),
        explain({
          id: 'd05-explain-bs',
          title: 'Explain binary search',
          skills: ['explanation', 'search_invariant', 'complexity'],
          prompt: 'Explain your binary search out loud as you would to an interviewer: the approach, the invariant, why the loop ends, the complexity and the edge cases.',
          rubric: [
            'Uses the sorted order: one comparison with the middle rules out half',
            'States the invariant: if target exists it lies in nums[lo..hi], inclusive',
            'Explains lo <= hi and why lo/hi move past mid (mid + 1 / mid - 1), so the loop always ends',
            'O(log n) time, O(1) space',
            'Edge cases: empty list, one element, target at either end, target missing',
          ],
          minutes: 5,
          signature: 'explain:binary-search',
        }),
      ],
    },

    // ───────────────────────────── ListNode ─────────────────────────────
    {
      id: 'd05-listnode',
      title: 'ListNode + traversal',
      summary: 'Nodes, references, and walking with while node.',
      exercises: [
        choice({
          id: 'd05-ll-end',
          title: 'Where does a list end?',
          skills: ['listnode'],
          prompt: 'In a singly linked list built from `ListNode(val, next)`, what is `.next` of the last node?',
          options: ['None', '0', 'The head node', 'An empty ListNode'],
          answer: 0,
          note: 'class ListNode: val, next. `ListNode(1, ListNode(2))` is 1 -> 2 -> None. A list is just a reference to its head node (or None if empty).',
          signature: 'choice:listnode-end',
        }),
        output({
          id: 'd05-ll-build-trace',
          title: 'Follow the arrows',
          skills: ['listnode'],
          prompt: 'Predict the output. `ListNode` already exists.',
          code: `c = ListNode(3)
b = ListNode(2, c)
a = ListNode(1, b)
print(a.val, a.next.val, a.next.next.val)
print(c.next)`,
          expectedOutput: '1 2 3\nNone',
          explanation: 'a.next is b, a.next.next is c, and c was created without a next, so its next is None.',
          signature: 'trace:listnode-chain',
        }),
        output({
          id: 'd05-ll-alias',
          title: 'Names are references',
          skills: ['listnode', 'linked_list_reassignment'],
          prompt: 'Predict the output.',
          code: `a = ListNode(1)
b = a
b.val = 9
print(a.val)
b = ListNode(5)
print(a.val, b.val)`,
          expectedOutput: '9\n9 5',
          explanation: '`b = a` makes both names point at the same node, so changing b.val changes what a sees. Assigning `b = ...` again only moves the name b; the node a points at is untouched. Pointer code is all about this difference.',
          signature: 'trace:reference-alias',
          minutes: 2,
          important: true,
        }),
        output({
          id: 'd05-ll-walk',
          title: 'Walk the list',
          skills: ['linked_list_traversal'],
          prompt: 'Predict the output.',
          code: `head = build_list([4, 8, 15])
node = head
while node:
    print(node.val)
    node = node.next
print(node)`,
          expectedOutput: '4\n8\n15\nNone',
          explanation: '`while node:` stops when node becomes None, which happens right after the last node.',
          signature: 'trace:ll-walk',
        }),
        choice({
          id: 'd05-ll-while-next',
          title: 'while node.next',
          skills: ['linked_list_traversal'],
          prompt: 'What does this print for the list 4 -> 8 -> 15?',
          code: `node = head
while node.next:
    print(node.val)
    node = node.next`,
          options: ['4 and 8 (stops before printing the last node)', '4, 8 and 15', '8 and 15', 'AttributeError'],
          answer: 0,
          explanation: '`while node.next` stops *on* the last node instead of after it. Useful when you need the last node, but it skips its body and crashes on an empty list.',
          signature: 'choice:ll-while-next',
        }),
        fill({
          id: 'd05-ll-fill-advance',
          title: 'Fill: advance',
          skills: ['linked_list_traversal'],
          prompt: 'Fill in the step that moves to the next node.',
          starterCode: `def length(head):
    count = 0
    node = head
    while node:
        count += 1
        node = ____
    return count
`,
          solution: `def length(head):
    count = 0
    node = head
    while node:
        count += 1
        node = node.next
    return count
`,
          tests: [t.eq('length(build_list([1, 2, 3]))', '3'), t.hidden('length(None)', '0')],
          hints: ['Follow the arrow.'],
          signature: 'fill:ll-advance',
        }),
        code({
          id: 'd05-ll-one-line',
          title: 'One line: build 7 -> 8 -> 9',
          stage: 'recall',
          skills: ['listnode'],
          prompt: 'Write one line that sets `head` to the list 7 -> 8 -> 9 using nested `ListNode(...)` calls (no `build_list`).',
          starterCode: `head = None\n`,
          solution: `head = ListNode(7, ListNode(8, ListNode(9)))\n`,
          tests: [t.check('list is 7 -> 8 -> 9', 'assert list_to_array(head) == [7, 8, 9], list_to_array(head)')],
          hints: ['Build from the inside out: the innermost call is the last node.'],
          signature: 'recall:listnode-nested',
          minutes: 2,
        }),
        code({
          id: 'd05-ll-sum',
          title: 'Sum a list',
          skills: ['linked_list_traversal', 'accumulator'],
          prompt: 'Write `list_sum(head)` returning the sum of all values. Empty list → 0.',
          starterCode: `def list_sum(head):\n    pass\n`,
          solution: `def list_sum(head):
    total = 0
    while head:
        total += head.val
        head = head.next
    return total
`,
          tests: [t.eq('list_sum(build_list([1, 2, 3]))', '6'), t.eq('list_sum(None)', '0'), t.hidden('list_sum(build_list([-5, 5, 10]))', '10')],
          hints: ['while node: add node.val, then node = node.next.'],
          signature: 'll:sum',
          minutes: 4,
        }),
        code({
          id: 'd05-ll-kth',
          title: 'Value at position k',
          ...combine,
          skills: ['linked_list_traversal', 'while_loop', 'list_index'],
          prompt: 'Write `value_at(head, k)` returning the value of the node at 0-based position `k`, or `None` if the list is too short.',
          starterCode: `def value_at(head, k):\n    pass\n`,
          solution: `def value_at(head, k):
    node = head
    i = 0
    while node and i < k:
        node = node.next
        i += 1
    return node.val if node else None
`,
          tests: [t.eq('value_at(build_list([10, 20, 30]), 0)', '10'), t.eq('value_at(build_list([10, 20, 30]), 2)', '30'), t.hidden('value_at(build_list([10, 20, 30]), 3)', 'None'), t.hidden('value_at(None, 0)', 'None')],
          hints: ['No indexes on a linked list: you count steps instead.', 'Move k times, but stop if node becomes None.', 'After the loop, node might be None.'],
          signature: 'll:value-at-k',
          minutes: 6,
        }),
        code({
          id: 'd05-ll-last',
          title: 'Last value',
          skills: ['linked_list_traversal'],
          prompt: 'Write `last_value(head)` returning the value of the final node, or `None` for an empty list. Use `while node.next`.',
          starterCode: `def last_value(head):\n    pass\n`,
          solution: `def last_value(head):
    if head is None:
        return None
    node = head
    while node.next:
        node = node.next
    return node.val
`,
          tests: [t.eq('last_value(build_list([1, 2, 3]))', '3'), t.eq('last_value(build_list([8]))', '8'), t.hidden('last_value(None)', 'None')],
          hints: ['Guard the empty list first: None has no .next.', 'Stop on the node whose next is None.'],
          signature: 'll:last-node',
          minutes: 5,
        }),
        code({
          id: 'd05-ll-middle',
          title: 'Middle value',
          ...combine,
          difficulty: 3,
          skills: ['linked_list_traversal', 'while_loop', 'accumulator'],
          prompt: 'Write `middle_value(head)` for a non-empty list: the value at position `length // 2` (so for 4 nodes, the third one). Two passes is fine: count, then walk.',
          starterCode: `def middle_value(head):\n    pass\n`,
          solution: `def middle_value(head):
    n = 0
    node = head
    while node:
        n += 1
        node = node.next
    node = head
    for _ in range(n // 2):
        node = node.next
    return node.val
`,
          tests: [t.eq('middle_value(build_list([1, 2, 3]))', '2'), t.eq('middle_value(build_list([1, 2, 3, 4]))', '3'), t.hidden('middle_value(build_list([7]))', '7'), t.hidden('middle_value(build_list([1, 2]))', '2')],
          hints: ['First pass: count nodes.', 'Second pass: start again from head and step n // 2 times.', 'Reset node = head between the passes.'],
          signature: 'll:middle-two-pass',
          minutes: 8,
        }),
      ],
    },

    // ───────────────────────────── Pointer rewiring ─────────────────────────────
    {
      id: 'd05-rewire',
      title: 'Pointer rewiring',
      summary: 'Change .next safely: save what you need before you overwrite it.',
      exercises: [
        output({
          id: 'd05-rw-lost',
          title: 'Overwrite and lose',
          skills: ['linked_list_reassignment'],
          prompt: 'Predict the output.',
          code: `head = build_list([1, 2, 3])
rest = head.next
head.next = None
print(list_to_array(head))
print(list_to_array(rest))`,
          expectedOutput: '[1]\n[2, 3]',
          explanation: 'Setting head.next = None cuts the list. The nodes 2 -> 3 survive only because `rest` still points at them. That saved reference is the job of `nxt` in reversal.',
          signature: 'trace:ll-cut',
          important: true,
        }),
        output({
          id: 'd05-rw-insert-trace',
          title: 'Insert in the middle',
          skills: ['linked_list_reassignment'],
          prompt: 'Predict the output.',
          code: `head = build_list([1, 3])
new = ListNode(2)
new.next = head.next
head.next = new
print(list_to_array(head))`,
          expectedOutput: '[1, 2, 3]',
          explanation: 'Hook the new node onto the rest first (new.next = head.next), then point head at it.',
          signature: 'trace:ll-insert',
        }),
        choice({
          id: 'd05-rw-order',
          title: 'Wrong order',
          skills: ['linked_list_reassignment'],
          prompt: 'Same insert, lines swapped. What happens?',
          code: `head = build_list([1, 3])
new = ListNode(2)
head.next = new
new.next = head.next`,
          options: [
            'new.next points to new itself: a cycle, and 3 is lost',
            'The list becomes 1 -> 2 -> 3',
            'The list becomes 1 -> 3',
            'AttributeError',
          ],
          answer: 0,
          explanation: 'After `head.next = new`, `head.next` *is* new, so `new.next = head.next` makes new point at itself. Read before you overwrite.',
          signature: 'choice:ll-rewire-order',
        }),
        code({
          id: 'd05-rw-insert-after',
          title: 'Insert after head',
          skills: ['linked_list_reassignment', 'listnode'],
          prompt: 'Write `insert_second(head, val)` that puts a new node with `val` right after `head` (head is not None) and returns `head`.',
          starterCode: `def insert_second(head, val):\n    pass\n`,
          solution: `def insert_second(head, val):
    head.next = ListNode(val, head.next)
    return head
`,
          tests: [t.eq('list_to_array(insert_second(build_list([1, 3]), 2))', '[1, 2, 3]'), t.hidden('list_to_array(insert_second(build_list([5]), 6))', '[5, 6]')],
          hints: ['The new node’s next should be what head.next was.', 'ListNode(val, head.next) does both in one expression.'],
          signature: 'll:insert-after',
          minutes: 5,
        }),
        code({
          id: 'd05-rw-remove-second',
          title: 'Skip a node',
          skills: ['linked_list_reassignment'],
          prompt: 'Write `remove_second(head)` that removes the second node if there is one, and returns `head` (head is not None).',
          starterCode: `def remove_second(head):\n    pass\n`,
          solution: `def remove_second(head):
    if head.next:
        head.next = head.next.next
    return head
`,
          tests: [t.eq('list_to_array(remove_second(build_list([1, 2, 3])))', '[1, 3]'), t.eq('list_to_array(remove_second(build_list([1, 2])))', '[1]'), t.hidden('list_to_array(remove_second(build_list([4])))', '[4]')],
          hints: ['Removing = pointing past it.', 'head.next = head.next.next, but only if head.next exists.'],
          signature: 'll:skip-next',
          minutes: 5,
        }),
        output({
          id: 'd05-rw-reverse-trace',
          title: 'Trace a reversal',
          skills: ['linked_list_reassignment', 'linked_list_traversal'],
          prompt: 'Predict the output. After each step, `prev` is the reversed part and `curr` is what is left.',
          code: `prev = None
curr = build_list([1, 2, 3])
while curr:
    nxt = curr.next
    curr.next = prev
    prev = curr
    curr = nxt
    print(list_to_array(prev), list_to_array(curr))`,
          expectedOutput: '[1] [2, 3]\n[2, 1] [3]\n[3, 2, 1] []',
          explanation: 'Each step moves one node from the front of curr to the front of prev. When curr is None, prev is the whole list reversed.',
          signature: 'trace:ll-reverse',
          minutes: 2.5,
          important: true,
        }),
        fill({
          id: 'd05-rw-fill-link',
          title: 'Fill: flip the arrow',
          skills: ['linked_list_reassignment'],
          prompt: 'Fill in the line that turns the current node’s arrow around.',
          starterCode: `def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = ____
        prev = curr
        curr = nxt
    return prev
`,
          solution: `def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
`,
          tests: [t.eq('list_to_array(reverse(build_list([1, 2, 3])))', '[3, 2, 1]'), t.hidden('list_to_array(reverse(None))', '[]')],
          hints: ['It should point backwards.'],
          signature: 'fill:ll-reverse-link',
        }),
        reorder({
          id: 'd05-rw-reorder',
          title: 'Reassemble reversal',
          skills: ['linked_list_reassignment', 'linked_list_traversal'],
          prompt: 'Put the reversal in order. The four loop lines have exactly one valid order.',
          lines: [
            'def reverse(head):',
            '    prev, curr = None, head',
            '    while curr:',
            '        nxt = curr.next',
            '        curr.next = prev',
            '        prev = curr',
            '        curr = nxt',
            '    return prev',
          ],
          tests: [t.eq('list_to_array(reverse(build_list([1, 2, 3, 4])))', '[4, 3, 2, 1]'), t.eq('list_to_array(reverse(None))', '[]')],
          signature: 'reorder:ll-reverse',
          minutes: 3.5,
        }),
        code({
          id: 'd05-rw-reversed-copy',
          title: 'Reversed copy (push to front)',
          ...combine,
          skills: ['linked_list_traversal', 'listnode'],
          prompt: 'Write `reversed_copy(head)` that returns a **new** list with the values in reverse order, leaving the original untouched. Walk the original and keep pushing new nodes onto the front of the result.',
          starterCode: `def reversed_copy(head):\n    pass\n`,
          solution: `def reversed_copy(head):
    out = None
    node = head
    while node:
        out = ListNode(node.val, out)
        node = node.next
    return out
`,
          tests: [
            t.eq('list_to_array(reversed_copy(build_list([1, 2, 3])))', '[3, 2, 1]'),
            t.check('original untouched', 'h = build_list([1, 2, 3])\nreversed_copy(h)\nassert list_to_array(h) == [1, 2, 3]'),
            t.hidden('list_to_array(reversed_copy(None))', '[]'),
          ],
          hints: ['Pushing to the front of a list reverses order.', 'out = ListNode(node.val, out) adds one node at the front.'],
          explanation: 'A different route to the same answer: O(n) extra space but no rewiring. The in-place version (prev/curr/nxt) is what interviews expect, with O(1) space.',
          signature: 'll:reverse-copy',
          minutes: 6,
        }),
      ],
    },

    // ───────────────────────────── Capstone: reverse ─────────────────────────────
    {
      id: 'd05-cap-reverse',
      title: 'Capstone: Reverse Linked List',
      summary: 'prev/curr/nxt from memory, then explain it.',
      exercises: [
        capstone({
          id: 'cap-reverse-linked-list',
          problemId: 'reverse-linked-list',
          title: 'Reverse Linked List',
          skills: ['linked_list_traversal', 'linked_list_reassignment', 'listnode'],
          prompt: 'Given the first node of a singly linked list, turn the list around so the last node comes first, and return the new first node. Rewire the existing nodes in place; do not create new ones.',
          starterCode: `def reverse_list(head: Optional[ListNode]) -> Optional[ListNode]:\n    pass\n`,
          solution: `def reverse_list(head: Optional[ListNode]) -> Optional[ListNode]:
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
`,
          examples: [
            { input: '1 -> 2 -> 3 -> 4', output: '4 -> 3 -> 2 -> 1' },
            { input: '7 -> 8', output: '8 -> 7' },
            { input: 'empty list (None)', output: 'None' },
          ],
          tests: [
            t.eq('list_to_array(reverse_list(build_list([1, 2, 3])))', '[3, 2, 1]'),
            t.eq('list_to_array(reverse_list(build_list([7, 8])))', '[8, 7]'),
            t.eq('reverse_list(None)', 'None'),
            t.hidden('list_to_array(reverse_list(build_list([5])))', '[5]'),
            t.hidden('list_to_array(reverse_list(build_list([1, 1, 2, 2])))', '[2, 2, 1, 1]'),
            t.hidden('list_to_array(reverse_list(build_list([-1, 0, 1, 2, 3])))', '[3, 2, 1, 0, -1]'),
            t.hidden('list_to_array(reverse_list(build_list(list(range(500)))))', 'list(range(499, -1, -1))'),
            t.check('reuses the original nodes', 'h = build_list([1, 2, 3])\nfirst = h\nr = reverse_list(h)\nassert r.next.next is first and first.next is None', true),
          ],
          hints: [
            'Walk the list once and flip each arrow to point backwards.',
            'Keep three references: the reversed part (prev), the current node (curr), and the rest (nxt).',
            'Each step: save nxt = curr.next, set curr.next = prev, then advance prev and curr.',
            'Start prev = None, curr = head; loop while curr; return prev.',
          ],
          complexity: { time: 'O(n)', space: 'O(1)' },
          explanation: 'Each node is visited once and its next is turned to point at the node before it. Saving curr.next first keeps the unvisited part reachable. When curr runs off the end, prev is the old tail, the new head.',
          signature: 'capstone:reverse-linked-list',
          minutes: 25,
        }),
        explain({
          id: 'd05-explain-reverse',
          title: 'Explain reversal',
          skills: ['explanation', 'linked_list_reassignment', 'complexity'],
          prompt: 'Explain the in-place reversal: what prev and curr mean during the loop, why nxt is needed, what you return, and the complexity.',
          rubric: [
            'Invariant: prev is the already-reversed part, curr is the first node not yet processed',
            'nxt saves curr.next before it is overwritten, otherwise the rest of the list is lost',
            'Returns prev because curr is None when the loop ends',
            'O(n) time, O(1) extra space',
            'Edge cases: empty list and single node work without special code',
          ],
          minutes: 5,
          signature: 'explain:reverse-linked-list',
        }),
      ],
    },

    // ───────────────────────────── Dummy head ─────────────────────────────
    {
      id: 'd05-dummy',
      title: 'Dummy head',
      summary: 'Build result lists with dummy + tail, then merge.',
      exercises: [
        choice({
          id: 'd05-dummy-why',
          title: 'Why a dummy node?',
          skills: ['dummy_node'],
          prompt: 'Why do many linked-list solutions start with `dummy = ListNode()` and `tail = dummy`?',
          options: [
            'So appending the first node is the same code as appending any other; return dummy.next at the end',
            'Because ListNode needs a value of 0 at the front',
            'To make the list doubly linked',
            'To make traversal faster',
          ],
          answer: 0,
          note: 'dummy = ListNode(); tail = dummy; ... tail.next = node; tail = tail.next; return dummy.next',
          explanation: 'Without a dummy you need an `if head is None` special case for the first node. The dummy is a fake node in front that is never part of the answer.',
          signature: 'choice:dummy-why',
        }),
        output({
          id: 'd05-dummy-trace',
          title: 'dummy + tail',
          skills: ['dummy_node'],
          prompt: 'Predict the output.',
          code: `dummy = ListNode(0)
tail = dummy
for v in [5, 6, 7]:
    tail.next = ListNode(v)
    tail = tail.next
print(dummy.val, list_to_array(dummy.next), tail.val)`,
          expectedOutput: '0 [5, 6, 7] 7',
          explanation: 'dummy never moves; tail always sits on the last node so far. The real list starts at dummy.next.',
          signature: 'trace:dummy-build',
        }),
        fill({
          id: 'd05-dummy-fill',
          title: 'Fill: move the tail',
          skills: ['dummy_node'],
          prompt: 'Fill in the blank so the function builds a linked list of the squares of `values`.',
          starterCode: `def squares(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v * v)
        tail = ____
    return dummy.next
`,
          solution: `def squares(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v * v)
        tail = tail.next
    return dummy.next
`,
          tests: [t.eq('list_to_array(squares([1, 2, 3]))', '[1, 4, 9]'), t.eq('squares([])', 'None')],
          hints: ['Move onto the node you just attached.'],
          signature: 'fill:dummy-advance',
        }),
        code({
          id: 'd05-dummy-from-values',
          title: 'Write build_list yourself',
          skills: ['dummy_node', 'for_loop'],
          prompt: 'Write `from_values(values)` that turns a Python list into a linked list and returns its head (`None` if empty). Use a dummy node; do not call `build_list`.',
          starterCode: `def from_values(values):\n    pass\n`,
          solution: `def from_values(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next
`,
          tests: [t.eq('list_to_array(from_values([3, 1, 2]))', '[3, 1, 2]'), t.eq('from_values([])', 'None'), t.hidden('list_to_array(from_values([9]))', '[9]')],
          hints: ['dummy and tail start on the same fake node.', 'Attach, then advance tail. Return dummy.next.'],
          signature: 'dummy:from-values',
          minutes: 6,
          important: true,
        }),
        code({
          id: 'd05-dummy-evens',
          title: 'Keep the evens',
          ...combine,
          skills: ['dummy_node', 'linked_list_traversal', 'conditionals'],
          prompt: 'Write `keep_evens(head)` returning a **new** linked list holding only the even values, in order.',
          starterCode: `def keep_evens(head):\n    pass\n`,
          solution: `def keep_evens(head):
    dummy = ListNode()
    tail = dummy
    node = head
    while node:
        if node.val % 2 == 0:
            tail.next = ListNode(node.val)
            tail = tail.next
        node = node.next
    return dummy.next
`,
          tests: [t.eq('list_to_array(keep_evens(build_list([1, 2, 3, 4, 6])))', '[2, 4, 6]'), t.eq('keep_evens(build_list([1, 3]))', 'None'), t.hidden('keep_evens(None)', 'None'), t.hidden('list_to_array(keep_evens(build_list([0, -2, 5])))', '[0, -2]')],
          hints: ['Two lists at once: walk the input, build the output.', 'Input pointer always advances; tail only when you attach.'],
          signature: 'dummy:filter-copy',
          minutes: 7,
        }),
        code({
          id: 'd05-dummy-remove',
          title: 'Remove every x (in place)',
          ...combine,
          difficulty: 3,
          skills: ['dummy_node', 'linked_list_reassignment', 'linked_list_traversal'],
          prompt: 'Write `remove_all(head, x)` that unlinks every node whose value is `x` and returns the new head. The head itself may need removing, which is where a dummy helps.',
          starterCode: `def remove_all(head, x):\n    pass\n`,
          solution: `def remove_all(head, x):
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next:
        if prev.next.val == x:
            prev.next = prev.next.next
        else:
            prev = prev.next
    return dummy.next
`,
          tests: [t.eq('list_to_array(remove_all(build_list([1, 2, 6, 3, 6]), 6))', '[1, 2, 3]'), t.eq('list_to_array(remove_all(build_list([7, 7, 1]), 7))', '[1]'), t.hidden('remove_all(build_list([7, 7]), 7)', 'None'), t.hidden('remove_all(None, 1)', 'None'), t.hidden('list_to_array(remove_all(build_list([1, 2]), 5))', '[1, 2]')],
          hints: [
            'Put dummy in front of head: dummy = ListNode(0, head).',
            'Stand on the node *before* the one you inspect: look at prev.next.',
            'Match: prev.next = prev.next.next (do not advance). No match: prev = prev.next.',
            'Return dummy.next.',
          ],
          signature: 'dummy:remove-values',
          minutes: 10,
        }),
        code({
          id: 'd05-dummy-merge-arrays',
          title: 'Merge two sorted Python lists',
          ...combine,
          skills: ['two_pointer', 'list_append', 'while_loop'],
          prompt: 'Bridge to the capstone, with plain lists first. Write `merge_arrays(a, b)` for two sorted lists, returning one sorted list. Use two indexes, not `sorted()`.',
          starterCode: `def merge_arrays(a, b):\n    pass\n`,
          solution: `def merge_arrays(a, b):
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out
`,
          tests: [t.eq('merge_arrays([1, 4, 7], [2, 3, 9])', '[1, 2, 3, 4, 7, 9]'), t.eq('merge_arrays([], [1, 2])', '[1, 2]'), t.hidden('merge_arrays([1, 1], [1])', '[1, 1, 1]'), t.hidden('merge_arrays([5], [])', '[5]')],
          hints: ['Take the smaller front item each time.', 'Loop while both have items; afterwards one list has leftovers.', 'out.extend(a[i:]) and out.extend(b[j:]).'],
          signature: 'two-pointer:merge-arrays',
          minutes: 8,
        }),
        output({
          id: 'd05-dummy-merge-trace',
          title: 'Trace a node merge',
          skills: ['dummy_node', 'linked_list_reassignment'],
          prompt: 'Predict the output.',
          code: `a = build_list([1, 4])
b = build_list([2, 3])
dummy = ListNode()
tail = dummy
while a and b:
    if a.val <= b.val:
        tail.next = a
        a = a.next
    else:
        tail.next = b
        b = b.next
    tail = tail.next
    print(tail.val)
tail.next = a or b
print(list_to_array(dummy.next))`,
          expectedOutput: '1\n2\n3\n[1, 2, 3, 4]',
          explanation: 'After 3 is taken, b is None and the loop stops. `a or b` is whichever is not None, here the node 4, and the leftover chain is attached in one step.',
          signature: 'trace:merge-lists',
          minutes: 2.5,
          important: true,
        }),
        reorder({
          id: 'd05-dummy-reorder',
          title: 'Reassemble a node merge',
          skills: ['dummy_node', 'linked_list_reassignment'],
          prompt: 'Put the lines in order.',
          lines: [
            'def merge(a, b):',
            '    dummy = ListNode()',
            '    tail = dummy',
            '    while a and b:',
            '        if a.val <= b.val:',
            '            tail.next = a',
            '            a = a.next',
            '        else:',
            '            tail.next = b',
            '            b = b.next',
            '        tail = tail.next',
            '    tail.next = a or b',
            '    return dummy.next',
          ],
          tests: [t.eq('list_to_array(merge(build_list([1, 5]), build_list([2, 3, 8])))', '[1, 2, 3, 5, 8]'), t.eq('merge(None, None)', 'None')],
          signature: 'reorder:merge-lists',
          minutes: 4,
        }),
      ],
    },

    // ───────────────────────────── Capstone: merge ─────────────────────────────
    {
      id: 'd05-cap-merge',
      title: 'Capstone: Merge Two Lists',
      summary: 'Dummy head + two pointers on nodes, then explain it.',
      exercises: [
        capstone({
          id: 'cap-merge-two-lists',
          problemId: 'merge-two-lists',
          title: 'Merge Two Sorted Lists',
          skills: ['dummy_node', 'linked_list_traversal', 'linked_list_reassignment'],
          prompt: 'You get the heads of two linked lists, each already in non-decreasing order. Combine them into one sorted list by relinking the existing nodes, and return the head of the combined list.',
          starterCode: `def merge_two_lists(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n    pass\n`,
          solution: `def merge_two_lists(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode()
    tail = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next = l1
            l1 = l1.next
        else:
            tail.next = l2
            l2 = l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next
`,
          examples: [
            { input: 'l1 = 1 -> 3 -> 5, l2 = 2 -> 4', output: '1 -> 2 -> 3 -> 4 -> 5' },
            { input: 'l1 = empty, l2 = 0', output: '0' },
            { input: 'l1 = empty, l2 = empty', output: 'empty (None)' },
          ],
          tests: [
            t.eq('list_to_array(merge_two_lists(build_list([1, 3, 5]), build_list([2, 4])))', '[1, 2, 3, 4, 5]'),
            t.eq('list_to_array(merge_two_lists(None, build_list([0])))', '[0]'),
            t.eq('merge_two_lists(None, None)', 'None'),
            t.hidden('list_to_array(merge_two_lists(build_list([1, 2, 4]), build_list([1, 3, 4])))', '[1, 1, 2, 3, 4, 4]'),
            t.hidden('list_to_array(merge_two_lists(build_list([5]), None))', '[5]'),
            t.hidden('list_to_array(merge_two_lists(build_list([1, 2, 3]), build_list([7, 8])))', '[1, 2, 3, 7, 8]'),
            t.hidden('list_to_array(merge_two_lists(build_list([7, 8]), build_list([1, 2, 3])))', '[1, 2, 3, 7, 8]'),
            t.hidden('list_to_array(merge_two_lists(build_list([-3, -1]), build_list([-2, 0])))', '[-3, -2, -1, 0]'),
            t.check('relinks existing nodes', 'a = build_list([1]); b = build_list([2])\nr = merge_two_lists(a, b)\nassert r is a and r.next is b', true),
          ],
          hints: [
            'Like merging two sorted Python lists, but you move node references instead of indexes.',
            'A dummy node avoids a special case for choosing the first head; a tail pointer tracks the end of the result.',
            'While both lists have nodes, attach the smaller front node to tail.next and advance that list and tail.',
            'After the loop attach whatever is left (tail.next = l1 or l2) and return dummy.next.',
          ],
          complexity: { time: 'O(n + m)', space: 'O(1)' },
          explanation: 'Each step attaches the smaller of the two front nodes, so the result stays sorted. When one list runs out, the other is already sorted and can be attached whole. The dummy node means the first attachment needs no special case.',
          signature: 'capstone:merge-two-lists',
          minutes: 30,
        }),
        explain({
          id: 'd05-explain-merge',
          title: 'Explain the merge',
          skills: ['explanation', 'dummy_node', 'complexity'],
          prompt: 'Explain the merge: the role of dummy and tail, what is true after each step, how the leftovers are handled, and the complexity.',
          rubric: [
            'Dummy node removes the special case for the first node; answer is dummy.next',
            'Tail always points at the last node of the merged result so far',
            'Invariant: merged part is sorted and holds the smallest nodes seen so far',
            'Leftover list attached in one step because it is already sorted',
            'O(n + m) time, O(1) extra space (nodes are relinked, not copied); handles empty inputs',
          ],
          minutes: 5,
          signature: 'explain:merge-two-lists',
        }),
      ],
    },

    // ───────────────────────────── Cold reps ─────────────────────────────
    {
      id: 'd05-cold',
      title: 'Cold reps',
      summary: 'No scaffolding: today’s three primitives from a blank editor.',
      exercises: [
        code({
          id: 'd05-cold-index-of',
          title: 'Binary search, cold',
          ...cold,
          skills: ['binary_search', 'mid_calc', 'search_invariant'],
          prompt: 'Write `index_of(sorted_vals, x)`: the index of `x` or -1, in O(log n).',
          starterCode: ``,
          solution: `def index_of(sorted_vals, x):
    lo, hi = 0, len(sorted_vals) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if sorted_vals[mid] == x:
            return mid
        if sorted_vals[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
          tests: [t.eq('index_of([2, 5, 8, 12], 12)', '3'), t.eq('index_of([2, 5, 8, 12], 6)', '-1'), t.hidden('index_of([], 0)', '-1'), t.hidden('index_of([2, 5, 8, 12], 2)', '0')],
          hints: ['lo, hi, mid. Loop while lo <= hi.'],
          signature: 'bs:cold',
          minutes: 6,
        }),
        code({
          id: 'd05-cold-reverse',
          title: 'Reverse, cold',
          ...cold,
          skills: ['linked_list_reassignment', 'linked_list_traversal'],
          prompt: 'Write `flip(head)` that reverses a linked list in place and returns the new head.',
          starterCode: ``,
          solution: `def flip(head):
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev
`,
          tests: [t.eq('list_to_array(flip(build_list([1, 2, 3, 4])))', '[4, 3, 2, 1]'), t.hidden('flip(None)', 'None'), t.hidden('list_to_array(flip(build_list([1])))', '[1]')],
          hints: ['Save next, flip, advance both.'],
          signature: 'll:reverse-cold',
          minutes: 6,
        }),
        code({
          id: 'd05-cold-append',
          title: 'Append to the end',
          ...cold,
          skills: ['linked_list_traversal', 'listnode'],
          prompt: 'Write `append_value(head, val)` that adds a node at the end and returns the head. The list may be empty.',
          starterCode: ``,
          solution: `def append_value(head, val):
    node = ListNode(val)
    if head is None:
        return node
    cur = head
    while cur.next:
        cur = cur.next
    cur.next = node
    return head
`,
          tests: [t.eq('list_to_array(append_value(build_list([1, 2]), 3))', '[1, 2, 3]'), t.eq('list_to_array(append_value(None, 5))', '[5]')],
          hints: ['Empty list: the new node is the head.', 'Otherwise walk to the node whose next is None.'],
          signature: 'll:append-tail',
          minutes: 6,
        }),
        code({
          id: 'd05-cold-first-at-least',
          title: 'Lower bound, cold',
          ...cold,
          skills: ['binary_search', 'search_invariant'],
          prompt: 'Redo the slow rep from this morning in O(log n): `first_at_least(nums, target)` returns the first index with `nums[i] >= target`, or `len(nums)`. Duplicates allowed.',
          starterCode: ``,
          solution: `def first_at_least(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo
`,
          tests: [t.eq('first_at_least([1, 3, 3, 3, 7], 3)', '1'), t.eq('first_at_least([1, 3, 5], 9)', '3'), t.hidden('first_at_least([], 2)', '0'), t.hidden('first_at_least([4, 5], 0)', '0')],
          hints: ['Too small → go right. Otherwise go left. Return lo.'],
          signature: 'bs:lower-bound-cold',
          minutes: 7,
        }),
        code({
          id: 'd05-cold-merge',
          title: 'Merge, cold',
          ...cold,
          skills: ['dummy_node', 'linked_list_reassignment'],
          prompt: 'Write `merge(a, b)` merging two sorted linked lists by relinking nodes. Return the head.',
          starterCode: ``,
          solution: `def merge(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
`,
          tests: [t.eq('list_to_array(merge(build_list([2, 6]), build_list([1, 3, 9])))', '[1, 2, 3, 6, 9]'), t.hidden('merge(None, None)', 'None'), t.hidden('list_to_array(merge(build_list([4]), None))', '[4]')],
          hints: ['Dummy + tail; attach smaller; attach leftovers.'],
          signature: 'dummy:merge-cold',
          minutes: 8,
        }),
      ],
    },
  ],
  capstones: ['binary-search', 'reverse-linked-list', 'merge-two-lists'],
}
