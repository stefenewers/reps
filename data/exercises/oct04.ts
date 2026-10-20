import type { DayModule } from '@/lib/types'
import { output, code, write, debug, reorder, capstone, explain, t } from '@/data/exercises/build'

const cold = { stage: 'retrieval' as const, repType: 'cold' as const }

export const day: DayModule = {
  date: '2026-10-04',
  short: 'Windows',
  title: 'Sliding windows + stacks',
  focus: 'Move a window’s two edges while keeping a set or map in sync, then use a list as a stack to match openers with closers.',
  sections: [
    // ───────────────────────────────────────────── Warm-up
    {
      id: 'd4-warmup',
      title: 'Warm-up',
      summary: 'Yesterday from a bare signature: slicing, running min, pointers, sets.',
      exercises: [
        write({
          id: 'd4-warm-reverse-each',
          title: 'Reverse each word',
          skills: ['string_methods', 'slicing', 'list_append'],
          ...cold,
          prompt: 'Write `reverse_each(s)`: reverse every word but keep the word order. Words are separated by whitespace; output uses single spaces.\n\n`"abc de"` → `"cba ed"`',
          starterCode: `def reverse_each(s):
    pass`,
          solution: `def reverse_each(s):
    out = []
    for w in s.split():
        out.append(w[::-1])
    return " ".join(out)`,
          tests: [t.eq('reverse_each("abc de")', '"cba ed"'), t.eq('reverse_each("")', '""'), t.hidden('reverse_each("  hi  there ")', '"ih ereht"')],
          hints: ['split → reverse each with a slice → join.'],
          signature: 'string:split-map-join',
          minutes: 4,
        }),
        write({
          id: 'd4-warm-profit',
          title: 'Best profit from memory',
          skills: ['state_tracking'],
          ...cold,
          prompt: 'Write `max_profit(prices)`: `prices[i]` is the price on day `i`. Buy once, sell on a later day, return the best profit or `0` if no sale makes money.',
          starterCode: `def max_profit(prices):
    pass`,
          solution: `def max_profit(prices):
    lowest = float("inf")
    best = 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best`,
          tests: [t.eq('max_profit([7, 1, 5, 3, 6, 4])', '5'), t.eq('max_profit([5, 4, 3])', '0'), t.hidden('max_profit([])', '0'), t.hidden('max_profit([2, 9, 1, 3])', '7')],
          signature: 'running:min-profit',
          minutes: 5,
          important: true,
        }),
        write({
          id: 'd4-warm-palindrome',
          title: 'Valid Palindrome from memory',
          skills: ['two_pointer', 'pointer_update', 'string_methods'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `is_palindrome(s)`: ignoring case and non-alphanumeric characters, does `s` read the same both ways? Two pointers, no cleaned copy.',
          starterCode: `def is_palindrome(s):
    pass`,
          solution: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True`,
          tests: [t.eq('is_palindrome("Never odd or even.")', 'True'), t.eq('is_palindrome("0P")', 'False'), t.hidden('is_palindrome("")', 'True'), t.hidden('is_palindrome("!!")', 'True'), t.hidden('is_palindrome("ab")', 'False')],
          hints: ['Skip non-alphanumerics with inner while loops that also check left < right.'],
          signature: 'two-pointer:skip-chars',
          minutes: 8,
          important: true,
        }),
        write({
          id: 'd4-warm-first-repeat',
          title: 'First repeated character',
          skills: ['set_add', 'set_membership', 'string_iterate'],
          ...cold,
          prompt: 'Write `first_repeat(s)`: scanning left to right, return the first character you meet for the second time, or `""` if none repeats.\n\n`"abcbad"` → `"b"`',
          starterCode: `def first_repeat(s):
    pass`,
          solution: `def first_repeat(s):
    seen = set()
    for ch in s:
        if ch in seen:
            return ch
        seen.add(ch)
    return ""`,
          tests: [t.eq('first_repeat("abcbad")', '"b"'), t.eq('first_repeat("abc")', '""'), t.hidden('first_repeat("")', '""'), t.hidden('first_repeat("zz")', '"z"')],
          signature: 'set:seen-early-return',
          minutes: 4,
        }),
        write({
          id: 'd4-warm-two-sum-ii',
          title: 'Two Sum II from memory',
          skills: ['two_pointer', 'pointer_update'],
          ...cold,
          prompt: 'Write `two_sum_sorted(numbers, target)` for sorted input with exactly one answer. Return 1-based positions `[a, b]`. O(1) extra space.',
          starterCode: `def two_sum_sorted(numbers, target):
    pass`,
          solution: `def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]
        if total < target:
            left += 1
        else:
            right -= 1
    return []`,
          tests: [t.eq('two_sum_sorted([2, 7, 11, 15], 9)', '[1, 2]'), t.eq('two_sum_sorted([1, 3, 4, 6], 10)', '[3, 4]'), t.hidden('two_sum_sorted([-3, 0, 2], -1)', '[1, 3]')],
          signature: 'sorted-pair:indices',
          minutes: 6,
          important: true,
        }),
      ],
    },

    // ───────────────────────────────────────────── Windows
    {
      id: 'd4-windows',
      title: 'Windows',
      summary: 'A window is s[left..right]; slide it by moving its edges.',
      exercises: [
        output({
          id: 'd4-win-trace-slices',
          title: 'Trace fixed windows',
          skills: ['sliding_window', 'slicing', 'range'],
          prompt: 'Each line printed is one **window** of `s`: its left index, its right index, and the characters inside. What does this print?',
          code: `s = "abcde"
k = 3
for right in range(k - 1, len(s)):
    left = right - k + 1
    print(left, right, s[left:right + 1])`,
          expectedOutput: '0 2 abc\n1 3 bcd\n2 4 cde',
          note: 'A **window** is a stretch of neighbouring items in a list or string, from index `left` to index `right`, both included. It holds `right - left + 1` items; as a slice it is `s[left:right + 1]`.\n\nA **fixed-size** window always holds `k` items. **Sliding** it means moving both edges one step to the right.',
          explanation: 'The right edge drives the loop; for a fixed size k, left is always `right - k + 1`. The slice needs `right + 1` because the end is excluded.',
          signature: 'trace:fixed-window-slices',
          minutes: 2,
        }),
        write({
          id: 'd4-win-all-windows',
          title: 'List every window',
          skills: ['sliding_window', 'slicing', 'range'],
          prompt: '`s` is a string and `k` is a window size (a whole number, 1 or more). A **substring** is a run of neighbouring characters with none skipped. `"bc"` is a substring of `"abcd"`, but `"ac"` isn\'t.\n\nWrite `all_windows(s, k)`. Return a list of every substring of length `k`, from left to right. If `k` is bigger than `len(s)`, no window fits, so return `[]`.\n\n`all_windows("abcd", 2)` → `["ab", "bc", "cd"]`\n`all_windows("ab", 3)` → `[]` (a window of 3 doesn\'t fit in 2 characters)',
          starterCode: `def all_windows(s, k):
    pass`,
          solution: `def all_windows(s, k):
    out = []
    for left in range(len(s) - k + 1):
        out.append(s[left:left + k])
    return out`,
          tests: [t.eq('all_windows("abcd", 2)', '["ab", "bc", "cd"]'), t.eq('all_windows("ab", 3)', '[]'), t.hidden('all_windows("xyz", 3)', '["xyz"]')],
          hints: ['How many windows of size k fit? `len(s) - k + 1`.', 'A negative count makes `range` empty, which handles k > len(s).'],
          signature: 'window:enumerate-fixed',
          minutes: 4,
        }),
        write({
          id: 'd4-win-max-sum-k',
          title: 'Slide a running sum',
          skills: ['sliding_window', 'state_tracking'],
          style: 'optimize',
          prompt: '`nums` is a list of numbers. `max_sum_k(nums, k)` returns the largest sum of any `k` neighbouring values.\n\n`max_sum_k([1, 4, 2, 10], 2)` → `12` (`2 + 10`)\n`max_sum_k([-3, -1, -2], 1)` → `-1` (every value is negative, so the best is the biggest one)\n\nThis version adds up every window from scratch, O(n·k):\n\n```python\ndef max_sum_k(nums, k):\n    best = None\n    for i in range(len(nums) - k + 1):\n        total = sum(nums[i:i + k])\n        if best is None or total > best:\n            best = total\n    return best\n```\n\nRewrite it in O(n). Sum the first window once. Then slide it one step at a time. Add the value that enters on the right, and subtract the value that leaves on the left. Assume `1 <= k <= len(nums)`. Numbers can be negative.',
          starterCode: `def max_sum_k(nums, k):
    pass`,
          solution: `def max_sum_k(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right]
        window -= nums[right - k]
        best = max(best, window)
    return best`,
          tests: [t.eq('max_sum_k([1, 4, 2, 10, 2, 3, 1, 0, 20], 4)', '24'), t.eq('max_sum_k([5], 1)', '5'), t.hidden('max_sum_k([-1, -2, -3], 2)', '-3'), t.hidden('max_sum_k([3, 3, 3], 3)', '9')],
          hints: ['Start with `window = sum(nums[:k])`.', 'Loop `right` from `k` to the end.', 'The new window is `nums[right - k + 1 .. right]`, so `nums[right - k]` just left.'],
          note: 'Sliding a fixed window: keep one running total. Each step, add the item entering on the right and subtract the item leaving on the left. That is O(1) per step instead of adding up `k` items again.',
          signature: 'window:fixed-sum',
          minutes: 7,
          important: true,
        }),
        debug({
          id: 'd4-win-debug-leaving',
          title: 'Fix the smallest window sum',
          skills: ['sliding_window', 'state_tracking'],
          prompt: '`nums` is a list of numbers. `min_sum_k(nums, k)` should return the smallest sum of any `k` neighbouring values. It keeps a running sum and slides it one step at a time.\n\n`min_sum_k([3, 1, 2, 5], 2)` → `3` (`1 + 2`)\n\nAssume `1 <= k <= len(nums)`. Make the tests pass.',
          brokenCode: `def min_sum_k(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right]
        window -= nums[right - k + 1]
        best = min(best, window)
    return best`,
          solution: `def min_sum_k(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right]
        window -= nums[right - k]
        best = min(best, window)
    return best`,
          tests: [t.eq('min_sum_k([3, 1, 2, 5], 2)', '3'), t.eq('min_sum_k([4], 1)', '4'), t.hidden('min_sum_k([5, -2, 4, -6, 1], 3)', '-4')],
          hints: ['Write out the window before and after one step for the first test.', 'Which index is in the old window but not the new one?'],
          explanation: 'When right reaches index `right`, the item that falls out is at `right - k`. Subtracting `right - k + 1` removes an item that is still inside.',
          signature: 'debug:window-leaving-index',
          minutes: 4,
        }),
        write({
          id: 'd4-win-max-vowels',
          title: 'Most vowels in k letters',
          skills: ['sliding_window', 'window_state', 'conditionals'],
          difficulty: 3,
          prompt: '`s` is a string of lowercase letters. Write `max_vowels(s, k)`. Return the largest number of vowels (`a e i o u`) in any substring of length `k`. Assume `1 <= k <= len(s)`.\n\n`max_vowels("abciiidef", 3)` → `3` (`"iii"`)\n`max_vowels("xyz", 2)` → `0` (no vowels at all)\n\nKeep one vowel count for the current window. Update it when a letter enters and when a letter leaves. Don\'t recount each window.',
          note: '**Window state** is whatever you keep track of about the items currently inside the window: a sum, a count, a set. When the window slides, update the state for the one item that enters and the one that leaves. Never rebuild it.',
          starterCode: `def max_vowels(s, k):
    pass`,
          solution: `def max_vowels(s, k):
    count = 0
    for ch in s[:k]:
        if ch in "aeiou":
            count += 1
    best = count
    for right in range(k, len(s)):
        if s[right] in "aeiou":
            count += 1
        if s[right - k] in "aeiou":
            count -= 1
        best = max(best, count)
    return best`,
          tests: [t.eq('max_vowels("abciiidef", 3)', '3'), t.eq('max_vowels("rhythms", 4)', '0'), t.hidden('max_vowels("aeiou", 2)', '2'), t.hidden('max_vowels("leetcode", 3)', '2'), t.hidden('max_vowels("b", 1)', '0')],
          hints: ['Count the first window, then slide.', 'Entering char at `right`, leaving char at `right - k`.', 'Add 1 if the entering char is a vowel, subtract 1 if the leaving one is.'],
          signature: 'window:fixed-count',
          minutes: 7,
        }),
        output({
          id: 'd4-win-trace-variable',
          title: 'Trace grow and shrink',
          skills: ['sliding_window', 'while_loop'],
          difficulty: 2,
          prompt: 'The window `nums[left..right]` must keep its total at most `limit`. Each loop adds `nums[right]`, then shrinks the window from the left until the total fits again. Then it prints `right`, `left` and the total. What does this print?',
          code: `nums = [2, 1, 3, 2, 4]
limit = 6
left = 0
total = 0
for right in range(len(nums)):
    total += nums[right]
    while total > limit:
        total -= nums[left]
        left += 1
    print(right, left, total)`,
          expectedOutput: '0 0 2\n1 0 3\n2 0 6\n3 1 6\n4 3 6',
          note: 'A **variable** window has no set size. `right` grows it by one item per loop. The window is **valid** when it obeys the rule (here: total ≤ limit). `while` it is not valid: remove `nums[left]`, then `left += 1`. After the `while` it is valid, so that is where you record an answer.',
          explanation: 'At right = 4 the total is 10, so the while loop removes 1 and then 3 before the window is valid again.',
          signature: 'trace:variable-window-sum',
          minutes: 2.5,
        }),
        write({
          id: 'd4-win-longest-under',
          title: 'Longest run under a limit',
          skills: ['sliding_window', 'state_tracking', 'while_loop'],
          difficulty: 3,
          style: 'optimize',
          prompt: '`nums` is a list of **positive** numbers and `limit` is a number. `longest_under(nums, limit)` returns the length of the longest stretch of neighbouring values whose sum is at most `limit`. If not even one value fits, it returns `0`.\n\n`longest_under([2, 1, 3, 2, 4], 6)` → `3` (`2 + 1 + 3`)\n`longest_under([7, 8], 5)` → `0` (every value is over the limit)\n\nThis version tries every start, O(n²):\n\n```python\ndef longest_under(nums, limit):\n    best = 0\n    for i in range(len(nums)):\n        total = 0\n        for j in range(i, len(nums)):\n            total += nums[j]\n            if total > limit:\n                break\n            best = max(best, j - i + 1)\n    return best\n```\n\nRewrite it in O(n) with one **variable-size** window `nums[left..right]`. Call the window **valid** when its sum is at most `limit`. For each `right`, add `nums[right]` to the sum. While the window isn\'t valid, take `nums[left]` out and move `left` forward. The window is now valid, so record its size.',
          note: 'Variable window: its size changes. `right` moves every loop (grow). `left` moves only `while` the window breaks the rule (shrink). Measure `right - left + 1` after the shrinking, when the window is **valid** again.',
          starterCode: `def longest_under(nums, limit):
    pass`,
          solution: `def longest_under(nums, limit):
    left = 0
    total = 0
    best = 0
    for right in range(len(nums)):
        total += nums[right]
        while total > limit:
            total -= nums[left]
            left += 1
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_under([2, 1, 3, 2, 4], 6)', '3'), t.eq('longest_under([7], 5)', '0'), t.hidden('longest_under([], 3)', '0'), t.hidden('longest_under([1, 1, 1, 1], 10)', '4'), t.hidden('longest_under([5, 1, 1, 5], 2)', '2')],
          hints: ['Grow by adding `nums[right]`.', 'While too big, subtract `nums[left]` and move left.', 'After shrinking the window is valid: `best = max(best, right - left + 1)`.'],
          explanation: 'If the window is empty (left = right + 1), its size is 0, so a single item larger than the limit is handled with no special case.',
          signature: 'window:longest-valid-sum',
          minutes: 8,
          important: true,
        }),
        debug({
          id: 'd4-win-debug-shrink',
          title: 'Fix the shortest window',
          skills: ['sliding_window', 'while_loop'],
          prompt: '`nums` is a list of positive numbers. `shortest_at_least(nums, goal)` should return the length of the shortest stretch of neighbouring values whose sum is at least `goal`, or `0` if no stretch reaches it.\n\n`shortest_at_least([2, 3, 1, 2, 4, 3], 7)` → `2` (`4 + 3`)\n\nMake the tests pass.',
          brokenCode: `def shortest_at_least(nums, goal):
    left = 0
    total = 0
    best = float("inf")
    for right in range(len(nums)):
        total += nums[right]
        if total >= goal:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return best if best != float("inf") else 0`,
          solution: `def shortest_at_least(nums, goal):
    left = 0
    total = 0
    best = float("inf")
    for right in range(len(nums)):
        total += nums[right]
        while total >= goal:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return best if best != float("inf") else 0`,
          tests: [t.eq('shortest_at_least([2, 3, 1, 2, 4, 3], 7)', '2'), t.eq('shortest_at_least([1, 1], 5)', '0'), t.hidden('shortest_at_least([1, 4, 4], 4)', '1'), t.hidden('shortest_at_least([1, 1, 1, 10], 10)', '1')],
          hints: ['After one item leaves, could the window still be valid?', 'Shrinking has to continue as long as the window stays valid.'],
          explanation: 'An `if` shrinks by at most one item per step, so the window can stay longer than needed. A `while` keeps shrinking and recording until the window stops being valid.',
          signature: 'debug:window-if-vs-while',
          minutes: 5,
        }),
      ],
    },

    // ───────────────────────────────────────────── Window state
    {
      id: 'd4-window-state',
      title: 'Window state',
      summary: 'A set or count map that mirrors what is inside the window, updated on both edges.',
      exercises: [
        output({
          id: 'd4-ws-trace-set',
          title: 'Trace a set window',
          skills: ['window_state', 'sliding_window', 'set_add'],
          difficulty: 2,
          prompt: 'The set `seen` is the **window state**: it should always hold exactly the characters inside the window `s[left..right]`. Each line prints `right`, `left` and the set. What does this print?',
          code: `s = "abca"
seen = set()
left = 0
for right in range(len(s)):
    while s[right] in seen:
        seen.remove(s[left])
        left += 1
    seen.add(s[right])
    print(right, left, sorted(seen))`,
          expectedOutput: "0 0 ['a']\n1 0 ['a', 'b']\n2 0 ['a', 'b', 'c']\n3 1 ['a', 'b', 'c']",
          note: 'The window state must always match the window. Something enters → add it. Something leaves → remove it **before** the edge moves past it. A set is enough while the window never holds two copies of the same thing; use a count dict when it can.',
          explanation: 'At right = 3, "a" is already inside, so the old "a" at index 0 is removed and left moves to 1. Then the new "a" is added.',
          signature: 'trace:window-set',
          minutes: 2.5,
        }),
        write({
          id: 'd4-ws-remove-one',
          title: 'Decrement and delete',
          skills: ['window_state', 'dict_lookup', 'dict_assign'],
          prompt: '`counts` is a dict used as window state. It maps each item in the window to how many copies of it are inside. `key` is an item that is leaving the window, so it is always in `counts`.\n\nWrite `remove_one(counts, key)`. Lower `counts[key]` by one. If the count reaches 0, delete the key. Return `counts`.\n\n`remove_one({"a": 2, "b": 1}, "b")` → `{"a": 2}` (`"b"` hit 0, so it is gone)\n`remove_one({"a": 2}, "a")` → `{"a": 1}`\n\nDeleting at 0 keeps `len(counts)` equal to the number of different items in the window.',
          starterCode: `def remove_one(counts, key):
    pass`,
          solution: `def remove_one(counts, key):
    counts[key] -= 1
    if counts[key] == 0:
        del counts[key]
    return counts`,
          tests: [t.eq('remove_one({"a": 2, "b": 1}, "a")', '{"a": 1, "b": 1}'), t.eq('remove_one({"a": 2, "b": 1}, "b")', '{"a": 2}'), t.hidden('remove_one({"x": 1}, "x")', '{}')],
          hints: ['`del counts[key]` removes a key.'],
          note: 'Count map in a window: entering `counts[c] = counts.get(c, 0) + 1`; leaving `counts[c] -= 1` and `del` at 0, so `len(counts)` = distinct values.',
          signature: 'window:count-decrement',
          minutes: 4,
        }),
        write({
          id: 'd4-ws-nearby-dup',
          title: 'Duplicate within k',
          skills: ['window_state', 'set_add', 'enumerate'],
          difficulty: 3,
          prompt: '`nums` is a list of numbers and `k` is a whole number, 0 or more. Write `has_nearby_duplicate(nums, k)`: return `True` if two equal values sit at different indexes that are at most `k` apart, otherwise `False`.\n\n`has_nearby_duplicate([1, 2, 3, 1], 3)` → `True` (the 1s are at indexes 0 and 3)\n\nKeep a set holding only the last `k` values; as you move on, remove the one that falls out. With `k = 0` nothing can match.',
          starterCode: `def has_nearby_duplicate(nums, k):
    pass`,
          solution: `def has_nearby_duplicate(nums, k):
    window = set()
    for i, x in enumerate(nums):
        if x in window:
            return True
        window.add(x)
        if len(window) > k:
            window.remove(nums[i - k])
    return False`,
          tests: [t.eq('has_nearby_duplicate([1, 2, 3, 1], 3)', 'True'), t.eq('has_nearby_duplicate([1, 2, 3, 1, 2, 3], 2)', 'False'), t.hidden('has_nearby_duplicate([1, 0, 1, 1], 1)', 'True'), t.hidden('has_nearby_duplicate([], 2)', 'False'), t.hidden('has_nearby_duplicate([1, 1], 0)', 'False')],
          hints: ['Check membership before adding.', 'After adding index i, the window should be indexes i-k+1..i.', 'Once the set is larger than k, remove `nums[i - k]`.'],
          signature: 'window:set-fixed',
          minutes: 7,
        }),
        write({
          id: 'd4-ws-longest-run',
          title: 'Longest run of one character',
          skills: ['sliding_window', 'string_index', 'state_tracking'],
          prompt: 'Write `longest_run(s)`: the length of the longest block of one character repeated side by side in the string `s`. An empty string gives `0`.\n\n`"aaabbbbcc"` → `4`\n\nThe window is the current block. When the character changes, the window restarts at that position.',
          starterCode: `def longest_run(s):
    pass`,
          solution: `def longest_run(s):
    best = 0
    left = 0
    for right in range(len(s)):
        if s[right] != s[left]:
            left = right
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_run("aaabbbbcc")', '4'), t.eq('longest_run("abc")', '1'), t.hidden('longest_run("")', '0'), t.hidden('longest_run("zzzz")', '4'), t.hidden('longest_run("abba")', '2')],
          hints: ['The window is valid when every character equals `s[left]`.', 'When `s[right] != s[left]`, jump `left = right`.'],
          explanation: 'Sometimes the left edge can jump straight to a new spot instead of stepping one at a time.',
          signature: 'window:jump-left',
          minutes: 5,
        }),
        debug({
          id: 'd4-ws-debug-size',
          title: 'Fix the rising run',
          skills: ['sliding_window', 'state_tracking'],
          prompt: '`nums` is a list of numbers. `longest_rising(nums)` should return the length of the longest stretch of neighbouring values where each is strictly bigger than the one before it. A single value is a stretch of 1; an empty list gives 0.\n\n`longest_rising([1, 2, 3, 1, 2])` → `3` (`1, 2, 3`)\n\nMake the tests pass.',
          brokenCode: `def longest_rising(nums):
    if not nums:
        return 0
    best = 1
    left = 0
    for right in range(1, len(nums)):
        if nums[right] <= nums[right - 1]:
            left = right
        best = max(best, right - left)
    return best`,
          solution: `def longest_rising(nums):
    if not nums:
        return 0
    best = 1
    left = 0
    for right in range(1, len(nums)):
        if nums[right] <= nums[right - 1]:
            left = right
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_rising([1, 2, 3, 1, 2])', '3'), t.eq('longest_rising([])', '0'), t.hidden('longest_rising([5])', '1'), t.hidden('longest_rising([3, 3, 3])', '1')],
          hints: ['How many items are in the window when `left == right`?'],
          explanation: 'An inclusive window `[left, right]` holds `right - left + 1` items. Forgetting the `+ 1` undercounts every window by one.',
          signature: 'debug:window-size-off-by-one',
          minutes: 4,
        }),
        write({
          id: 'd4-ws-distinct-windows',
          title: 'Distinct values per window',
          skills: ['window_state', 'frequency_map', 'sliding_window'],
          difficulty: 4,
          stage: 'combine',
          repType: 'combine',
          prompt: '`nums` is a list of numbers. Write `distinct_per_window(nums, k)`. For each window of size `k`, from left to right, count how many **distinct** (different) values it holds. Return those counts as a list. If `k > len(nums)`, there are no windows, so return `[]`.\n\n`distinct_per_window([1, 2, 1, 3, 4, 2, 3], 4)` → `[3, 4, 4, 3]`\n`distinct_per_window([1, 2], 3)` → `[]`\n\nKeep a count dict (value → copies inside the window). Update it at both edges as the window slides. Don\'t rebuild a set for each window.',
          starterCode: `def distinct_per_window(nums, k):
    pass`,
          solution: `def distinct_per_window(nums, k):
    counts = {}
    out = []
    for right, x in enumerate(nums):
        counts[x] = counts.get(x, 0) + 1
        if right >= k:
            old = nums[right - k]
            counts[old] -= 1
            if counts[old] == 0:
                del counts[old]
        if right >= k - 1:
            out.append(len(counts))
    return out`,
          tests: [t.eq('distinct_per_window([1, 2, 1, 3, 4, 2, 3], 4)', '[3, 4, 4, 3]'), t.eq('distinct_per_window([1, 1, 1], 2)', '[1, 1]'), t.hidden('distinct_per_window([1, 2], 3)', '[]'), t.hidden('distinct_per_window([5, 6, 7], 1)', '[1, 1, 1]'), t.hidden('distinct_per_window([], 2)', '[]')],
          hints: [
            'A set cannot tell you whether another copy of a value is still inside.',
            'Use a count map: add the entering value, decrement the leaving one.',
            'Delete keys that hit 0, so `len(counts)` is the distinct count.',
            'Loop right over all indexes; remove `nums[right - k]` once `right >= k`; record once `right >= k - 1`.',
          ],
          signature: 'window:count-map-fixed',
          minutes: 11,
          important: true,
        }),
        debug({
          id: 'd4-ws-debug-no-del',
          title: 'Fix the distinct counter',
          skills: ['window_state', 'frequency_map'],
          prompt: '`nums` is a list of numbers. `max_distinct(nums, k)` should return the largest number of **distinct** (different) values in any window of `k` neighbouring items. It keeps its window state in `counts`, a dict from each value to how many copies are inside the window right now.\n\n`max_distinct([1, 2, 3, 3, 3], 2)` → `2`\n\nAssume `1 <= k <= len(nums)`. Make the tests pass.',
          brokenCode: `def max_distinct(nums, k):
    counts = {}
    best = 0
    for right, x in enumerate(nums):
        counts[x] = counts.get(x, 0) + 1
        if right >= k:
            old = nums[right - k]
            counts[old] -= 1
        if right >= k - 1:
            best = max(best, len(counts))
    return best`,
          solution: `def max_distinct(nums, k):
    counts = {}
    best = 0
    for right, x in enumerate(nums):
        counts[x] = counts.get(x, 0) + 1
        if right >= k:
            old = nums[right - k]
            counts[old] -= 1
            if counts[old] == 0:
                del counts[old]
        if right >= k - 1:
            best = max(best, len(counts))
    return best`,
          tests: [t.eq('max_distinct([1, 2, 3, 3, 3], 2)', '2'), t.eq('max_distinct([4, 4, 4], 3)', '1'), t.hidden('max_distinct([1, 2, 1, 3], 3)', '3')],
          hints: ['Print `counts` after each step of the first test.', 'What does `len(counts)` count when a value’s count is 0?'],
          explanation: 'A key with count 0 is still a key, so `len(counts)` keeps counting values that already left the window. Delete at 0.',
          signature: 'debug:count-map-zero-key',
          minutes: 5,
        }),
        write({
          id: 'd4-ws-anagram-window',
          title: 'Hidden anagram',
          skills: ['window_state', 'frequency_map', 'sliding_window', 'dict_get'],
          difficulty: 4,
          stage: 'combine',
          repType: 'combine',
          prompt: '`pattern` and `s` are strings of lowercase letters. Write `has_anagram(pattern, s)`: return `True` if some substring of `s` with length `len(pattern)` uses exactly the same letters as `pattern` (same counts, any order). If `pattern` is longer than `s`, return `False`.\n\n`has_anagram("ab", "eidbaooo")` → `True` (`"ba"`)\n\nSlide a fixed window with a count dict; compare dicts with `==`.',
          starterCode: `def has_anagram(pattern, s):
    pass`,
          solution: `def has_anagram(pattern, s):
    k = len(pattern)
    if k > len(s):
        return False
    need = {}
    for ch in pattern:
        need[ch] = need.get(ch, 0) + 1
    window = {}
    for right, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1
        if right >= k:
            old = s[right - k]
            window[old] -= 1
            if window[old] == 0:
                del window[old]
        if window == need:
            return True
    return False`,
          tests: [
            t.eq('has_anagram("ab", "eidbaooo")', 'True'),
            t.eq('has_anagram("ab", "eidboaoo")', 'False'),
            t.hidden('has_anagram("abc", "ab")', 'False'),
            t.hidden('has_anagram("a", "a")', 'True'),
            t.hidden('has_anagram("aab", "abaa")', 'True'),
            t.hidden('has_anagram("aab", "abbb")', 'False'),
          ],
          hints: [
            'Two strings are anagrams when their frequency maps are equal (Valid Anagram).',
            'Build the pattern’s map once; keep a window map of the last k characters.',
            'Add the entering character, remove the leaving one (`del` at 0 so the maps compare equal).',
            'After each update, `if window == need: return True`.',
          ],
          explanation: 'Comparing two maps over a fixed alphabet is O(26), so the whole scan is O(n). Deleting zero counts matters: `{"a": 0, "b": 1} != {"b": 1}`.',
          signature: 'window:fixed-count-map-compare',
          minutes: 11,
        }),
        write({
          id: 'd4-ws-flip-zeros',
          title: 'Longest ones with k flips',
          skills: ['sliding_window', 'state_tracking', 'while_loop'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`bits` is a list of 0s and 1s. You may change at most `k` of the zeros into ones. Write `longest_ones(bits, k)` returning the length of the longest unbroken stretch of ones you can end up with. An empty list gives `0`.\n\n`longest_ones([1, 1, 0, 0, 1, 1, 1, 0, 1], 1)` → `5` (flip the zero at index 7)',
          starterCode: `def longest_ones(bits, k):
    pass`,
          solution: `def longest_ones(bits, k):
    left = 0
    zeros = 0
    best = 0
    for right in range(len(bits)):
        if bits[right] == 0:
            zeros += 1
        while zeros > k:
            if bits[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
          tests: [
            t.eq('longest_ones([1, 1, 0, 0, 1, 1, 1, 0, 1], 1)', '5'),
            t.eq('longest_ones([0, 0, 0], 0)', '0'),
            t.hidden('longest_ones([], 2)', '0'),
            t.hidden('longest_ones([0, 0, 1], 2)', '3'),
            t.hidden('longest_ones([1, 0, 1, 0, 1], 1)', '3'),
            t.hidden('longest_ones([1, 1, 1], 0)', '3'),
          ],
          hints: [
            'Rephrase: the longest window containing at most k zeros.',
            'Window state is a single counter: zeros inside.',
            'While `zeros > k`, move left and decrement if a zero leaves.',
          ],
          explanation: 'Reframing the question as "longest window with at most k bad items" turns it into the standard grow/shrink template with an integer as the state.',
          signature: 'window:count-bad-items',
          minutes: 10,
        }),
        write({
          id: 'd4-ws-two-kinds',
          title: 'Longest with at most two kinds',
          skills: ['window_state', 'sliding_window', 'frequency_map', 'state_tracking'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`s` is a string. Write `longest_two_kinds(s)`. Return the length of the longest substring (neighbouring characters, none skipped) that uses **at most two different characters**. An empty string gives `0`.\n\n`longest_two_kinds("ccaabbb")` → `5` (`"aabbb"`)\n\n`longest_two_kinds("eceba")` → `3` (`"ece"`)',
          transfer: true,
          starterCode: `def longest_two_kinds(s):
    pass`,
          solution: `def longest_two_kinds(s):
    counts = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        while len(counts) > 2:
            out = s[left]
            counts[out] -= 1
            if counts[out] == 0:
                del counts[out]
            left += 1
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_two_kinds("eceba")', '3'), t.eq('longest_two_kinds("ccaabbb")', '5'), t.hidden('longest_two_kinds("")', '0'), t.hidden('longest_two_kinds("a")', '1'), t.hidden('longest_two_kinds("abaccc")', '4'), t.hidden('longest_two_kinds("aaaa")', '4')],
          hints: [
            'You want the longest stretch that obeys a rule. When a stretch breaks the rule, do you have to start over, or can you trim it from the left?',
            'This is a variable window. It is not valid when it holds more than two different characters; a count dict tells you how many it holds.',
            'While `len(counts) > 2`: lower the count of `s[left]`, delete the key at 0, `left += 1`.',
            'Add the right character, shrink while not valid, then `best = max(best, right - left + 1)`.',
          ],
          explanation: 'This is the general shape: count map as window state, `len(counts)` as the validity test, shrink on the left until valid.',
          signature: 'window:count-map-variable',
          minutes: 10,
        }),
        write({
          id: 'd4-ws-k-kinds',
          title: 'At most k kinds',
          skills: ['window_state', 'sliding_window', 'frequency_map'],
          difficulty: 3,
          stage: 'reconstruct',
          prompt: '`s` is a string and `k` is a whole number, 0 or more. Write `longest_k_kinds(s, k)`. Return the length of the longest substring of `s` that uses at most `k` different characters. When `k` is 0, the answer is `0`.\n\n`longest_k_kinds("eceba", 2)` → `3` (`"ece"`)\n`longest_k_kinds("abc", 0)` → `0`',
          starterCode: `def longest_k_kinds(s, k):
    pass`,
          solution: `def longest_k_kinds(s, k):
    counts = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        while len(counts) > k:
            out = s[left]
            counts[out] -= 1
            if counts[out] == 0:
                del counts[out]
            left += 1
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_k_kinds("eceba", 2)', '3'), t.eq('longest_k_kinds("aa", 1)', '2'), t.hidden('longest_k_kinds("abc", 0)', '0'), t.hidden('longest_k_kinds("", 3)', '0'), t.hidden('longest_k_kinds("abaccc", 3)', '6')],
          hints: [
            'The rule for a valid window now depends on `k`. Everything else is the same grow-and-shrink loop.',
          ],
          signature: 'window:count-map-variable',
          minutes: 8,
        }),
      ],
    },

    // ───────────────────────────────────────────── Longest Substring
    {
      id: 'd4-longest-substring',
      title: 'Longest Substring',
      summary: 'Variable window with a set: no repeated characters inside.',
      exercises: [
        capstone({
          id: 'cap-longest-substring',
          title: 'Longest Substring Without Repeating Characters',
          problemId: 'longest-substring',
          skills: ['sliding_window', 'window_state', 'set_membership', 'state_tracking'],
          prompt:
            '`s` is a string. Return the length of the longest stretch of consecutive characters in which no character appears twice.\n\nThe stretch must be unbroken. In `"pwwkew"`, `"pwke"` doesn\'t count because it skips a character.\n\n`longest_unique("pwwkew")` → `3` (`"wke"`)\n`longest_unique("")` → `0`\n\nAim for O(n).',
          starterCode: `def longest_unique(s: str) -> int:
    pass`,
          solution: `def longest_unique(s: str) -> int:
    seen = set()
    left = 0
    best = 0
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best`,
          examples: [
            { input: 's = "abcabcbb"', output: '3', note: '"abc"' },
            { input: 's = "bbbbb"', output: '1', note: '"b"' },
            { input: 's = "pwwkew"', output: '3', note: '"wke"' },
          ],
          tests: [
            t.eq('longest_unique("abcabcbb")', '3'),
            t.eq('longest_unique("bbbbb")', '1'),
            t.eq('longest_unique("pwwkew")', '3'),
            t.hidden('longest_unique("")', '0'),
            t.hidden('longest_unique(" ")', '1'),
            t.hidden('longest_unique("au")', '2'),
            t.hidden('longest_unique("dvdf")', '3'),
            t.hidden('longest_unique("abba")', '2'),
            t.hidden('longest_unique("tmmzuxt")', '5'),
            t.hidden('longest_unique("abcdef")', '6'),
          ],
          hints: [
            'Checking every substring is O(n²) or worse. Keep one window and slide it.',
            'Window `s[left..right]` with no repeats; a set holds exactly its characters.',
            'When `s[right]` is already in the set, remove `s[left]` and advance left until it is not.',
            'For each right: shrink while duplicate, add `s[right]`, `best = max(best, right - left + 1)`.',
          ],
          complexity: { time: 'O(n)', space: 'O(k), k = distinct characters' },
          explanation: 'Each index enters the window once (right) and leaves at most once (left), so total work is O(n) even with the inner while loop. The set always equals the characters in the window, which is what makes the duplicate check O(1).',
          signature: 'capstone:longest-substring',
          minutes: 30,
        }),
        explain({
          id: 'd4-explain-longest-substring',
          title: 'Explain Longest Substring',
          skills: ['explanation', 'complexity', 'sliding_window', 'edge_cases'],
          prompt: 'Explain the window: what is always true about it (its **invariant**), why the nested loop is still O(n), and which inputs you would test.',
          rubric: [
            'Invariant: s[left..right] has no repeated characters and the set holds exactly those characters.',
            'Right grows every step; left only moves forward to remove the duplicate.',
            'O(n) time because each character is added once and removed at most once (amortized), despite the inner while.',
            'Space O(min(n, alphabet size)) for the set.',
            'Edge cases: empty string, all the same character, "abba" (duplicate far back), spaces count as characters.',
          ],
          signature: 'explain:longest-substring',
          minutes: 5,
        }),
        debug({
          id: 'd4-ls-debug-shrink',
          title: 'Fix the unique window',
          skills: ['sliding_window', 'window_state', 'set_membership'],
          prompt: '`longest_unique(s)` should return the length of the longest substring with no repeated characters. Make the tests pass.',
          brokenCode: `def longest_unique(s):
    seen = set()
    left = 0
    best = 0
    for right in range(len(s)):
        if s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best`,
          solution: `def longest_unique(s):
    seen = set()
    left = 0
    best = 0
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_unique("abba")', '2'), t.eq('longest_unique("abcabcbb")', '3'), t.hidden('longest_unique("")', '0'), t.hidden('longest_unique("dvdf")', '3')],
          hints: ['Trace "abba". When the second "b" arrives, which "b" is still in the window after one removal?', 'The duplicate may sit several places to the left.'],
          explanation: 'One removal only drops `s[left]`, which may not be the duplicate. The window must keep shrinking until the duplicate is gone.',
          signature: 'debug:window-not-shrinking',
          minutes: 5,
        }),
        write({
          id: 'd4-ls-last-seen',
          title: 'Jump with a last-seen map',
          skills: ['sliding_window', 'index_map', 'state_tracking'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `longest_unique_jump(s)`. Return the length of the longest substring of `s` with no repeated character.\n\n`longest_unique_jump("abcabcbb")` → `3` (`"abc"`)\n`longest_unique_jump("abba")` → `2`\n\nThis time keep a dict `last` from each character to the index where it last appeared. If the character at `right` already has a copy inside the window, don\'t step `left` forward one at a time. **Jump** it to just past that copy.\n\nCareful: `left` must never move backwards. The `"abba"` example checks this.',
          starterCode: `def longest_unique_jump(s):
    pass`,
          solution: `def longest_unique_jump(s):
    last = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_unique_jump("abcabcbb")', '3'), t.eq('longest_unique_jump("abba")', '2'), t.hidden('longest_unique_jump("")', '0'), t.hidden('longest_unique_jump("tmmzuxt")', '5'), t.hidden('longest_unique_jump("dvdf")', '3')],
          hints: [
            'If ch was seen inside the window, the new window must start just after that copy.',
            '`left = last[ch] + 1`, but only if that copy is inside the window.',
            'Check `last[ch] >= left` (or use `left = max(left, last[ch] + 1)`).',
          ],
          explanation: 'In "abba", the final "a" was last seen at 0, which is already outside the window [2, 3]. Without the guard left would jump back to 1.',
          signature: 'window:index-map-jump',
          minutes: 10,
        }),
        code({
          id: 'd4-ls-break-jump',
          title: 'Break the jump',
          skills: ['sliding_window', 'index_map', 'edge_cases'],
          style: 'write-test',
          prompt: '`longest_unique_jump(s)` should return the length of the longest substring with no repeated character. It keeps `last`, a dict from each character to the index where it last appeared. When it sees a repeat, it jumps `left` to just past the earlier copy. A teammate wrote it like this, and it is wrong on some strings:\n\n```python\ndef longest_unique_jump(s):\n    last = {}\n    left = 0\n    best = 0\n    for right, ch in enumerate(s):\n        if ch in last:\n            left = last[ch] + 1\n        last[ch] = right\n        best = max(best, right - left + 1)\n    return best\n```\n\nWrite `breaking_input()`. It takes nothing and returns one string on which the code above gives the wrong length.',
          starterCode: `def breaking_input():
    pass`,
          solution: `def breaking_input():
    return "abba"`,
          tests: [
            t.check(
              'your input breaks it',
              'def _buggy(s):\n    last = {}\n    left = 0\n    best = 0\n    for right, ch in enumerate(s):\n        if ch in last:\n            left = last[ch] + 1\n        last[ch] = right\n        best = max(best, right - left + 1)\n    return best\ndef _good(s):\n    seen = set()\n    left = 0\n    best = 0\n    for right in range(len(s)):\n        while s[right] in seen:\n            seen.remove(s[left])\n            left += 1\n        seen.add(s[right])\n        best = max(best, right - left + 1)\n    return best\nx = breaking_input()\nassert isinstance(x, str), "return a string"\nassert _buggy(x) != _good(x), "the buggy version is right on this input"',
            ),
          ],
          hints: ['The bug needs a repeat whose earlier copy is already outside the window.', 'Make the window move past one character, then repeat that character.'],
          explanation: 'Any input where a character repeats after the window has already moved past its first copy, like "abba", sends `left` backwards.',
          signature: 'write-test:window-jump-guard',
          minutes: 3,
        }),
        code({
          id: 'd4-ls-return-substring',
          title: 'Return the substring itself',
          skills: ['sliding_window', 'window_state', 'slicing'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          style: 'modify',
          prompt: 'This code returns the **length** of the longest substring with no repeated characters. Change `longest_unique_text(s)` to return the substring itself. If several tie for longest, return the one that starts first. An empty `s` gives `""`.\n\n`longest_unique_text("pwwkew")` → `"wke"`\n`longest_unique_text("abab")` → `"ab"` (`"ab"` and `"ba"` tie; `"ab"` starts first)',
          starterCode: `def longest_unique_text(s):
    seen = set()
    left = 0
    best = 0
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best`,
          solution: `def longest_unique_text(s):
    seen = set()
    left = 0
    best_start, best_len = 0, 0
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        if right - left + 1 > best_len:
            best_start, best_len = left, right - left + 1
    return s[best_start:best_start + best_len]`,
          tests: [t.eq('longest_unique_text("abcabcbb")', '"abc"'), t.eq('longest_unique_text("pwwkew")', '"wke"'), t.hidden('longest_unique_text("")', '""'), t.hidden('longest_unique_text("bbbb")', '"b"'), t.hidden('longest_unique_text("abcdab")', '"abcd"')],
          hints: ['Remember where the best window starts, not just its length.', 'Use a strict `>` so the first of equal-length windows wins; slice at the end.'],
          signature: 'window:best-span',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────────────────────── Stacks
    {
      id: 'd4-stacks',
      title: 'Stacks',
      summary: 'A list as a stack: append pushes, pop removes the top, stack[-1] peeks.',
      exercises: [
        output({
          id: 'd4-st-trace',
          title: 'Trace push and pop',
          skills: ['stack_push_pop'],
          prompt: 'The list `stack` is used as a stack: items go on and come off at the end of the list only. What does this print?',
          code: `stack = []
stack.append("a")
stack.append("b")
stack.append("c")
top = stack.pop()
print(top, stack)
stack.append("d")
print(stack[-1], len(stack))`,
          expectedOutput: "c ['a', 'b']\nd 3",
          note: 'A **stack** is a pile: you add and remove only at one end, called the **top**. So the last item in is the first one out (**LIFO**).\n\nWith a list, the top is the end: **push** = `stack.append(x)`, **pop** = `stack.pop()` (removes the top and gives it back), peek = `stack[-1]` (looks, removes nothing). `pop()` and `[-1]` raise IndexError on an empty list, so check `if stack:` first.',
          explanation: 'Last in, first out: "c" was pushed last, so it pops first. Peeking with `stack[-1]` does not remove anything.',
          signature: 'trace:stack-push-pop',
          minutes: 2,
        }),
        write({
          id: 'd4-st-reverse',
          title: 'Reverse with a stack',
          skills: ['stack_push_pop', 'string_iterate', 'while_loop'],
          prompt: 'Write `reverse_with_stack(s)`. Return the string `s` backwards, without slicing. Use a list as a stack. Push every character with `append`. Then pop until the stack is empty, and join the popped characters in the order they came off.\n\n`reverse_with_stack("abc")` → `"cba"`\n`reverse_with_stack("")` → `""`',
          starterCode: `def reverse_with_stack(s):
    pass`,
          solution: `def reverse_with_stack(s):
    stack = []
    for ch in s:
        stack.append(ch)
    out = []
    while stack:
        out.append(stack.pop())
    return "".join(out)`,
          tests: [t.eq('reverse_with_stack("abc")', '"cba"'), t.eq('reverse_with_stack("")', '""')],
          hints: ['`while stack:` keeps popping until empty.'],
          signature: 'stack:reverse',
          minutes: 4,
        }),
        write({
          id: 'd4-st-backspace',
          title: 'Apply backspaces',
          skills: ['stack_push_pop', 'conditionals', 'string_methods'],
          difficulty: 3,
          prompt: '`s` is a string of keys typed in order. The key `#` is a backspace: it deletes the most recent character still on screen, or does nothing if the screen is empty. Write `type_out(s)` returning the final text.\n\n`"ab#c"` → `"ac"`, `"a##b"` → `"b"`',
          starterCode: `def type_out(s):
    pass`,
          solution: `def type_out(s):
    stack = []
    for ch in s:
        if ch == "#":
            if stack:
                stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)`,
          tests: [t.eq('type_out("ab#c")', '"ac"'), t.eq('type_out("a##b")', '"b"'), t.hidden('type_out("###")', '""'), t.hidden('type_out("abc")', '"abc"'), t.hidden('type_out("")', '""')],
          hints: ['The text typed so far behaves like a stack.', 'On `#`, pop only if the stack is non-empty.'],
          signature: 'stack:backspace',
          minutes: 6,
        }),
        debug({
          id: 'd4-st-debug-empty-pop',
          title: 'Fix the star remover',
          skills: ['stack_push_pop', 'conditionals'],
          prompt: '`remove_stars(s)` takes a string of letters and `*`. Read it left to right. Each `*` removes the nearest letter to its left that is still there. A `*` with nothing to remove does nothing. The function should return the letters that are left, as a string.\n\n`remove_stars("ab*c")` → `"ac"`\n\nMake the tests pass.',
          brokenCode: `def remove_stars(s):
    stack = []
    for ch in s:
        if ch == "*":
            stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)`,
          solution: `def remove_stars(s):
    stack = []
    for ch in s:
        if ch == "*":
            if stack:
                stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)`,
          tests: [t.eq('remove_stars("ab*c")', '"ac"'), t.eq('remove_stars("*a")', '"a"'), t.hidden('remove_stars("**")', '""'), t.hidden('remove_stars("abc**")', '"a"')],
          hints: ['Read the error on the second test.', 'What does `.pop()` do on an empty list?'],
          explanation: '`[].pop()` raises IndexError. Guard every pop (and every `stack[-1]`) with `if stack:` unless you know the stack is non-empty.',
          signature: 'debug:stack-empty-pop',
          minutes: 3,
        }),
        write({
          id: 'd4-st-adjacent-pairs',
          title: 'Cancel adjacent twins',
          skills: ['stack_push_pop', 'conditionals'],
          difficulty: 3,
          prompt: '`s` is a string. Write `cancel_pairs(s)`. Whenever two equal characters sit next to each other, remove both. Removing a pair can bring two more equal characters together. Keep going until no such pair is left, and return what remains.\n\n`cancel_pairs("abbaca")` → `"ca"` (remove `"bb"` to get `"aaca"`, then remove `"aa"`)\n`cancel_pairs("abba")` → `""` (`"bb"` goes, then `"aa"`)\n\nOne pass is enough if you keep the characters that have survived so far on a stack.',
          starterCode: `def cancel_pairs(s):
    pass`,
          solution: `def cancel_pairs(s):
    stack = []
    for ch in s:
        if stack and stack[-1] == ch:
            stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)`,
          tests: [t.eq('cancel_pairs("abbaca")', '"ca"'), t.eq('cancel_pairs("aa")', '""'), t.hidden('cancel_pairs("abc")', '"abc"'), t.hidden('cancel_pairs("azxxzy")', '"ay"'), t.hidden('cancel_pairs("aaa")', '"a"')],
          hints: [
            'After a pair cancels, the characters on either side become neighbours. What structure remembers "the previous survivor"?',
            'Compare each character with the stack top.',
            '`if stack and stack[-1] == ch: stack.pop()` else push.',
          ],
          explanation: 'The stack top is always the nearest surviving character to the left, which is exactly what a new character might cancel with. One pass, O(n).',
          signature: 'stack:cancel-adjacent',
          minutes: 6,
          important: true,
        }),
        write({
          id: 'd4-st-round-balanced',
          title: 'Balanced round brackets',
          skills: ['stack_push_pop', 'conditionals', 'early_return'],
          prompt: '`s` contains only `(` and `)`. It is **balanced** when every `(` is closed by a later `)`, and no `)` shows up while nothing is open. Write `balanced(s)`. Return `True` or `False`. An empty string is balanced.\n\n`balanced("(())()")` → `True`\n`balanced(")(")` → `False` (the `)` comes before anything is open)\n`balanced("(((")` → `False` (nothing gets closed)\n`balanced("")` → `True`\n\nUse a stack. Push on `(` and pop on `)`. If a `)` has nothing to pop, the string isn\'t balanced. It also isn\'t balanced if anything is left on the stack at the end.',
          starterCode: `def balanced(s):
    pass`,
          solution: `def balanced(s):
    stack = []
    for ch in s:
        if ch == "(":
            stack.append(ch)
        else:
            if not stack:
                return False
            stack.pop()
    return not stack`,
          tests: [t.eq('balanced("(())()")', 'True'), t.eq('balanced(")(")', 'False'), t.hidden('balanced("")', 'True'), t.hidden('balanced("(((")', 'False'), t.hidden('balanced("())")', 'False')],
          hints: ['Two ways to fail: a closer with an empty stack, or openers left over.', 'Return `not stack` at the end (True only if empty).'],
          signature: 'stack:balanced-one-kind',
          minutes: 5,
        }),
        write({
          id: 'd4-st-max-depth',
          title: 'Deepest nesting',
          skills: ['stack_push_pop', 'state_tracking'],
          prompt: '`s` is a string with round brackets mixed in with other characters. The brackets are balanced: every `(` is closed by a later `)`. The **nesting depth** at any point is how many brackets are open and not yet closed. Write `max_depth(s)` returning the deepest it gets, or `0` if there are no brackets.\n\n`"(1+(2*3)+((8)/4))+1"` → `3` (the `8` sits inside three open brackets)\n\nKeep the open brackets on a stack.',
          starterCode: `def max_depth(s):
    pass`,
          solution: `def max_depth(s):
    stack = []
    best = 0
    for ch in s:
        if ch == "(":
            stack.append(ch)
            best = max(best, len(stack))
        elif ch == ")":
            stack.pop()
    return best`,
          tests: [t.eq('max_depth("(1+(2*3)+((8)/4))+1")', '3'), t.eq('max_depth("abc")', '0'), t.hidden('max_depth("()()")', '1'), t.hidden('max_depth("")', '0')],
          hints: ['The stack height is the current depth.', 'Update the best right after a push.'],
          explanation: 'With one bracket type the stack only stores its height, so a counter works too. Mixed types are where you need the actual stack contents.',
          signature: 'stack:depth',
          minutes: 5,
        }),
        debug({
          id: 'd4-st-debug-postfix',
          title: 'Fix the postfix calculator',
          skills: ['stack_push_pop', 'conditionals', 'string_methods'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`expr` is a string of tokens separated by spaces. The tokens are whole numbers (possibly negative) and the operators `+ - *`. They come in **postfix** order: each operator comes after the two values it works on. `eval_postfix(expr)` should return the result as an int.\n\nAn operator works on the two most recent values. The older of the two goes on its left.\n\n`eval_postfix("9 2 -")` → `7` (`9 - 2`)\n`eval_postfix("3 4 + 2 *")` → `14` (`(3 + 4) * 2`)\n\nMake the tests pass.',
          brokenCode: `def eval_postfix(expr):
    stack = []
    for tok in expr.split():
        if tok in ("+", "-", "*"):
            a = stack.pop()
            b = stack.pop()
            if tok == "+":
                stack.append(a + b)
            elif tok == "-":
                stack.append(a - b)
            else:
                stack.append(a * b)
        else:
            stack.append(int(tok))
    return stack[-1]`,
          solution: `def eval_postfix(expr):
    stack = []
    for tok in expr.split():
        if tok in ("+", "-", "*"):
            b = stack.pop()
            a = stack.pop()
            if tok == "+":
                stack.append(a + b)
            elif tok == "-":
                stack.append(a - b)
            else:
                stack.append(a * b)
        else:
            stack.append(int(tok))
    return stack[-1]`,
          tests: [
            t.eq('eval_postfix("9 2 -")', '7'),
            t.eq('eval_postfix("3 4 + 2 *")', '14'),
            t.hidden('eval_postfix("5 1 2 + 4 * + 3 -")', '14'),
            t.hidden('eval_postfix("7")', '7'),
            t.hidden('eval_postfix("-3 4 *")', '-12'),
          ],
          hints: ['Which value is on top of the stack after "9 2"?', 'The first pop gives the right-hand operand.'],
          explanation: 'The most recent value is on top, and it is the right operand. Order does not matter for `+` and `*`, which is why only subtraction exposes the bug.',
          signature: 'debug:stack-pop-order',
          minutes: 5,
        }),
        write({
          id: 'd4-st-simplify-path',
          title: 'Simplify a file path',
          skills: ['stack_push_pop', 'string_methods', 'conditionals'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `simplify(path)` for an absolute Unix-style path. `.` means stay, `..` means go up one folder (staying at `/` if already there), and repeated slashes act like one. Return the clean path starting with `/` and with no trailing slash.\n\n`"/a/./b/../../c/"` → `"/c"`',
          starterCode: `def simplify(path):
    pass`,
          solution: `def simplify(path):
    stack = []
    for part in path.split("/"):
        if part == "" or part == ".":
            continue
        if part == "..":
            if stack:
                stack.pop()
        else:
            stack.append(part)
    return "/" + "/".join(stack)`,
          tests: [
            t.eq('simplify("/a/./b/../../c/")', '"/c"'),
            t.eq('simplify("/home//user/")', '"/home/user"'),
            t.hidden('simplify("/../")', '"/"'),
            t.hidden('simplify("/")', '"/"'),
            t.hidden('simplify("/a/b/c/../..")', '"/a"'),
          ],
          hints: [
            'Folders you are "inside" form a stack.',
            '`path.split("/")` gives the parts; empty strings come from repeated slashes.',
            'Skip "" and "."; on ".." pop if non-empty; otherwise push. Join with "/" and prefix "/".',
          ],
          signature: 'stack:path-simplify',
          minutes: 7,
        }),
        write({
          id: 'd4-st-next-greater',
          title: 'Next greater value',
          skills: ['stack_push_pop', 'enumerate', 'while_loop'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Stretch. `nums` is a list of numbers. Write `next_greater(nums)`. Return a list of the same length. Entry `i` is the first value to the right of `nums[i]` that is strictly larger than it. If there is none, entry `i` is `-1`.\n\n`next_greater([2, 1, 3, 2])` → `[3, 3, -1, -1]`\n`next_greater([5, 5])` → `[-1, -1]` (equal isn\'t larger)\n\nAim for O(n). Keep a stack of the **indexes** that are still waiting for their answer.',
          starterCode: `def next_greater(nums):
    pass`,
          solution: `def next_greater(nums):
    out = [-1] * len(nums)
    waiting = []
    for i, x in enumerate(nums):
        while waiting and nums[waiting[-1]] < x:
            out[waiting.pop()] = x
        waiting.append(i)
    return out`,
          tests: [
            t.eq('next_greater([2, 1, 3, 2])', '[3, 3, -1, -1]'),
            t.eq('next_greater([5, 4, 3])', '[-1, -1, -1]'),
            t.hidden('next_greater([])', '[]'),
            t.hidden('next_greater([1, 2, 3])', '[2, 3, -1]'),
            t.hidden('next_greater([2, 2, 3])', '[3, 3, -1]'),
          ],
          hints: [
            'Items still waiting for a bigger value are in decreasing order. Why?',
            'Keep a stack of indexes whose answer is unknown.',
            'For each new x: while the top’s value is smaller than x, pop it and set its answer to x.',
            'Then push the current index. Anything left at the end keeps -1.',
          ],
          explanation: 'Each index is pushed once and popped once, so the while loop is O(n) in total. This "monotonic stack" shape appears in many interview problems.',
          signature: 'stack:monotonic-next-greater',
          minutes: 10,
        }),
      ],
    },

    // ───────────────────────────────────────────── Matching pairs
    {
      id: 'd4-matching',
      title: 'Matching pairs',
      summary: 'A closer→opener dict plus the stack top decides every closer.',
      exercises: [
        output({
          id: 'd4-mp-trace',
          title: 'Trace a closer lookup',
          skills: ['matching_pairs', 'stack_push_pop', 'dict_membership'],
          difficulty: 2,
          prompt: '`pairs` maps each closing bracket to the opening bracket it needs. What does this print?',
          code: `pairs = {")": "(", "]": "[", "}": "{"}
stack = []
for ch in "([]{":
    if ch in pairs:
        print(ch, "needs", pairs[ch], "top is", stack[-1])
        stack.pop()
    else:
        stack.append(ch)
print(stack)`,
          expectedOutput: "] needs [ top is [\n['(', '{']",
          note: 'An **opener** is `(`, `[` or `{`; a **closer** is `)`, `]` or `}`. A closer **matches** only the opener of its own kind: `]` matches `[`.\n\n`pairs = {")": "(", "]": "[", "}": "{"}` has closers as keys, so `ch in pairs` tells you `ch` is a closer, and `pairs[ch]` is the opener that must be on top of the stack.',
          explanation: 'Openers are pushed. The single closer "]" finds "[" on top and pops it. "(" and "{" are left unclosed.',
          signature: 'trace:bracket-stack',
          minutes: 2.5,
        }),
        code({
          id: 'd4-mp-one-line-lookup',
          title: 'Look up the opener',
          skills: ['matching_pairs', 'dict_get', 'dict_lookup'],
          prompt: '`pairs` is a dict from each closing bracket to the opening bracket that matches it. Write two lines below the given code:\n\n- `opener`: the opening bracket that `ch` needs\n- `missing`: the opening bracket that `other` needs. `other` isn\'t a closing bracket, so this must come out as `None`, with no KeyError',
          starterCode: `pairs = {")": "(", "]": "[", "}": "{"}
ch = "]"
other = "x"
# opener = ...
# missing = ...`,
          solution: `pairs = {")": "(", "]": "[", "}": "{"}
ch = "]"
other = "x"
opener = pairs[ch]
missing = pairs.get(other)`,
          tests: [t.check('opener', 'assert opener == "["'), t.check('missing', 'assert missing is None')],
          hints: ['`.get(key)` returns None for a missing key.'],
          signature: 'dict:lookup-vs-get',
          minutes: 3,
        }),
        write({
          id: 'd4-mp-closes-top',
          title: 'Does it close the top?',
          skills: ['matching_pairs', 'stack_push_pop', 'dict_lookup'],
          prompt: '`stack` is a list of opening brackets still waiting to be closed. Its top is the last item. `ch` is one closing bracket: `)`, `]` or `}`.\n\nWrite `closes_top(stack, ch)`. Return `True` only when the stack isn\'t empty and its top is the opener that matches `ch`. Otherwise return `False`. Don\'t change `stack`. Build the closer → opener dict inside the function.\n\n`closes_top(["(", "["], "]")` → `True`\n`closes_top([], ")")` → `False` (nothing is open)',
          starterCode: `def closes_top(stack, ch):
    pass`,
          solution: `def closes_top(stack, ch):
    pairs = {")": "(", "]": "[", "}": "{"}
    return len(stack) > 0 and stack[-1] == pairs[ch]`,
          tests: [t.eq('closes_top(["(", "["], "]")', 'True'), t.eq('closes_top([], ")")', 'False'), t.hidden('closes_top(["{"], ")")', 'False'), t.hidden('closes_top(["{"], "}")', 'True')],
          hints: ['Keys are closers, values are openers.', 'Check the stack is non-empty before reading `stack[-1]`; `and` short-circuits.'],
          explanation: '`and` short-circuits: on an empty stack, `stack[-1]` is never evaluated.',
          signature: 'stack:closer-matches-top',
          minutes: 4,
        }),
        code({
          id: 'd4-mp-first-bad',
          title: 'First bad closer',
          skills: ['matching_pairs', 'stack_push_pop', 'enumerate', 'early_return'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          style: 'finish',
          prompt: '`s` is a string made only of the brackets `()[]{}`. A closer is **bad** if nothing is open for it to close. It is also bad if the most recently opened bracket is a different kind. Finish `first_bad(s)`. Return the index of the first bad closer, or `-1` if there is none. Openers that never get closed are fine here.\n\n`first_bad("([)]")` → `2` (the `)` arrives while `[` is the most recent opener)\n`first_bad("((")` → `-1` (unclosed openers don\'t count)',
          starterCode: `def first_bad(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    pass`,
          solution: `def first_bad(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for i, ch in enumerate(s):
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return i
            stack.pop()
        else:
            stack.append(ch)
    return -1`,
          tests: [t.eq('first_bad("([)]")', '2'), t.eq('first_bad("())")', '2'), t.hidden('first_bad("(]")', '1'), t.hidden('first_bad("((")', '-1'), t.hidden('first_bad("")', '-1'), t.hidden('first_bad("]")', '0')],
          hints: ['Openers go on the stack.', 'A closer is bad if the stack is empty or the top is not `pairs[ch]`.', 'Check the empty case first: `if not stack or stack[-1] != pairs[ch]`.'],
          signature: 'stack:first-bad-closer',
          minutes: 7,
        }),
        write({
          id: 'd4-mp-pair-positions',
          title: 'Where does each pair close?',
          skills: ['matching_pairs', 'stack_push_pop', 'enumerate', 'dict_assign'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          prompt: '`s` is a balanced string of `(` and `)`: every opener is closed later, and no closer comes early. Write `pair_positions(s)`. Return a dict from the index of each opener to the index of the closer that matches it. An empty string gives `{}`.\n\n`pair_positions("(())")` → `{0: 3, 1: 2}`\n`pair_positions("()()")` → `{0: 1, 2: 3}`\n\nUse a stack, but push **indexes**, not characters.',
          starterCode: `def pair_positions(s):
    pass`,
          solution: `def pair_positions(s):
    stack = []
    match = {}
    for i, ch in enumerate(s):
        if ch == "(":
            stack.append(i)
        else:
            match[stack.pop()] = i
    return match`,
          tests: [t.eq('pair_positions("(())")', '{0: 3, 1: 2}'), t.eq('pair_positions("()()")', '{0: 1, 2: 3}'), t.hidden('pair_positions("")', '{}'), t.hidden('pair_positions("(()())")', '{0: 5, 1: 2, 3: 4}')],
          hints: ['The stack can hold where an opener was, not just what it was.', 'On ")", the popped index is its partner: `match[stack.pop()] = i`.'],
          explanation: 'Storing indexes on the stack is a common upgrade: you still get LIFO matching, plus positions for lengths or spans.',
          signature: 'stack:index-matching',
          minutes: 6,
        }),
        debug({
          id: 'd4-mp-debug-peek',
          title: 'Fix the widest pair',
          skills: ['matching_pairs', 'stack_push_pop', 'enumerate'],
          prompt: '`s` is a balanced string of `(` and `)`. Each opener is matched by the closer that closes it. The **width** of a pair is how many characters it spans, both brackets included: closer index − opener index + 1. `widest_pair(s)` should return the width of the widest pair, or `0` for an empty string.\n\n`widest_pair("()(())")` → `4` (the pair from index 2 to index 5)\n\nMake the tests pass.',
          brokenCode: `def widest_pair(s):
    stack = []
    best = 0
    for i, ch in enumerate(s):
        if ch == "(":
            stack.append(i)
        else:
            start = stack[-1]
            best = max(best, i - start + 1)
    return best`,
          solution: `def widest_pair(s):
    stack = []
    best = 0
    for i, ch in enumerate(s):
        if ch == "(":
            stack.append(i)
        else:
            start = stack.pop()
            best = max(best, i - start + 1)
    return best`,
          tests: [t.eq('widest_pair("(())")', '4'), t.eq('widest_pair("()")', '2'), t.hidden('widest_pair("()(())")', '4'), t.hidden('widest_pair("")', '0')],
          hints: ['Trace "(())": which opener does the second ")" get?', 'Once an opener is matched, should it stay on the stack?'],
          explanation: 'Peeking leaves the matched opener on the stack, so the next closer matches it again. Matching consumes the opener: `pop()`.',
          signature: 'debug:stack-peek-vs-pop',
          minutes: 4,
        }),
        write({
          id: 'd4-mp-min-to-fix',
          title: 'Brackets to add',
          skills: ['stack_push_pop', 'accumulator', 'conditionals'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`s` contains only `(` and `)`. It is **balanced** when every `(` is closed by a later `)` and every `)` closes an earlier `(`. Write `min_to_fix(s)`. Return the smallest number of brackets you would have to insert, anywhere in the string, to make it balanced. A string that is already balanced needs `0`, and so does the empty string.\n\n`min_to_fix("())")` → `1`\n`min_to_fix("(((")` → `3`\n`min_to_fix("()))((")` → `4`\n`min_to_fix("")` → `0`',
          transfer: true,
          starterCode: `def min_to_fix(s):
    pass`,
          solution: `def min_to_fix(s):
    stack = []
    unmatched_closers = 0
    for ch in s:
        if ch == "(":
            stack.append(ch)
        elif stack:
            stack.pop()
        else:
            unmatched_closers += 1
    return unmatched_closers + len(stack)`,
          tests: [t.eq('min_to_fix("())")', '1'), t.eq('min_to_fix("(((")', '3'), t.hidden('min_to_fix("()))((")', '4'), t.hidden('min_to_fix("")', '0'), t.hidden('min_to_fix("()()")', '0')],
          hints: [
            'Read left to right. At each `)`, is there an unclosed `(` waiting for it?',
            'Two kinds of trouble: closers with nothing to match, and openers never closed. A stack of the open brackets tracks both.',
            'Count the closers that arrive when the stack is empty; at the end add `len(stack)`.',
          ],
          signature: 'stack:min-insertions',
          minutes: 7,
        }),
        reorder({
          id: 'd4-mp-reorder',
          title: 'Rebuild the bracket checker',
          skills: ['matching_pairs', 'stack_push_pop'],
          prompt: 'Put the lines in order. `brackets_ok(s)` takes a string of `()[]{}` and returns `True` when every bracket is closed by the right kind in the right order, otherwise `False`.',
          lines: [
            'def brackets_ok(s):',
            '    pairs = {")": "(", "]": "[", "}": "{"}',
            '    stack = []',
            '    for ch in s:',
            '        if ch in pairs:',
            '            if not stack or stack.pop() != pairs[ch]:',
            '                return False',
            '        else:',
            '            stack.append(ch)',
            '    return not stack',
          ],
          tests: [t.eq('brackets_ok("{[]}")', 'True'), t.eq('brackets_ok("([)]")', 'False'), t.hidden('brackets_ok("((")', 'False'), t.hidden('brackets_ok("")', 'True')],
          explanation: '`stack.pop() != pairs[ch]` pops and compares in one step; `not stack` is checked first so pop never runs on an empty list.',
          signature: 'reorder:bracket-stack',
          minutes: 3,
        }),
      ],
    },

    // ───────────────────────────────────────────── Valid Parentheses
    {
      id: 'd4-valid-parentheses',
      title: 'Valid Parentheses',
      summary: 'Stack of openers, closer→opener map, empty-stack checks.',
      exercises: [
        capstone({
          id: 'cap-valid-parentheses',
          title: 'Valid Parentheses',
          problemId: 'valid-parentheses',
          skills: ['stack_push_pop', 'matching_pairs', 'dict_lookup'],
          prompt:
            '`s` is a string made only of the six characters `( ) [ ] { }`. Return `True` if `s` is well formed, otherwise `False`. It is well formed when all of these hold:\n\n- every opening bracket is closed by a bracket of the same kind\n- brackets close in the reverse order they opened (inner pairs close first)\n- no closing bracket appears without a matching opener\n\nThe empty string counts as well formed.\n\n`is_valid("([]{})")` → `True`\n`is_valid("([)]")` → `False` (the `)` closes before the inner `[` does)',
          starterCode: `def is_valid(s: str) -> bool:
    pass`,
          solution: `def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack`,
          examples: [
            { input: 's = "()[]{}"', output: 'True' },
            { input: 's = "([)]"', output: 'False', note: '")" arrives while "[" is still open' },
            { input: 's = "{[]}"', output: 'True' },
          ],
          tests: [
            t.eq('is_valid("()[]{}")', 'True'),
            t.eq('is_valid("(]")', 'False'),
            t.eq('is_valid("{[]}")', 'True'),
            t.hidden('is_valid("")', 'True'),
            t.hidden('is_valid("(")', 'False'),
            t.hidden('is_valid(")")', 'False'),
            t.hidden('is_valid("([)]")', 'False'),
            t.hidden('is_valid("([{}])")', 'True'),
            t.hidden('is_valid("((")', 'False'),
            t.hidden('is_valid("){")', 'False'),
            t.hidden('is_valid("{[]}()")', 'True'),
          ],
          hints: [
            'The most recent unclosed opener must be the next one closed. Which structure gives you "most recent"?',
            'A stack of openers, plus a dict from each closer to its opener.',
            'On a closer: fail if the stack is empty or `stack[-1] != pairs[ch]`, else pop.',
            'Push openers; check closers against the top; at the end return `not stack` so leftovers fail.',
          ],
          complexity: { time: 'O(n)', space: 'O(n)' },
          explanation: 'The stack holds the openers still waiting to be closed, innermost on top. Each closer must match that top. Three failure modes: a wrong kind, a closer with an empty stack, and openers left at the end.',
          signature: 'capstone:valid-parentheses',
          minutes: 25,
        }),
        explain({
          id: 'd4-explain-valid-parentheses',
          title: 'Explain Valid Parentheses',
          skills: ['explanation', 'complexity', 'edge_cases', 'matching_pairs'],
          prompt: 'Explain why a stack is the right structure, list every way the input can fail, and give the complexity.',
          rubric: [
            'Last opened must be first closed: last in, first out, so a stack.',
            'Dict from closer to opener; `ch in pairs` identifies closers.',
            'Three failures: wrong kind on top, closer with an empty stack, leftovers at the end.',
            'Why a counter is not enough with several bracket kinds ("([)]").',
            'O(n) time, O(n) space for the stack in the worst case (all openers).',
          ],
          signature: 'explain:valid-parentheses',
          minutes: 5,
        }),
        debug({
          id: 'd4-vp-fix-bug',
          title: 'Fix the bracket checker',
          skills: ['matching_pairs', 'stack_push_pop', 'edge_cases'],
          difficulty: 3,
          prompt: 'A teammate’s `is_valid(s)` takes a string of `()[]{}`. It should return `True` exactly when every bracket is closed by the same kind in the right order, otherwise `False`. It passes `"()[]"` but fails on other inputs. Make the tests pass.',
          brokenCode: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return True`,
          solution: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack`,
          tests: [t.eq('is_valid("()[]")', 'True'), t.eq('is_valid("((")', 'False'), t.eq('is_valid(")")', 'False'), t.hidden('is_valid("([)]")', 'False'), t.hidden('is_valid("{}")', 'True')],
          hints: ['Run each failing test. One raises, one returns the wrong answer.', 'Think about the three ways brackets fail.'],
          explanation: 'Two missing checks: the empty stack before peeking, and leftovers at the end. These are exactly the bugs interviewers look for.',
          signature: 'stack:fix-valid-brackets',
          minutes: 6,
        }),
        write({
          id: 'd4-vp-with-text',
          title: 'Brackets inside code',
          skills: ['matching_pairs', 'stack_push_pop', 'conditionals'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: '`s` is a line of code, so its brackets are mixed in with letters, spaces and punctuation. Write `code_brackets_ok(s)`. Return `True` when each bracket `()[]{}` is closed by the same kind in the right order, otherwise `False`. Ignore every other character. A line with no brackets is fine.\n\n`code_brackets_ok("f(a[i], {k: v})")` → `True`\n`code_brackets_ok("print(x])")` → `False` (the `]` tries to close the open `(`)\n`code_brackets_ok("x = 1")` → `True` (no brackets)',
          starterCode: `def code_brackets_ok(s):
    pass`,
          solution: `def code_brackets_ok(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack`,
          tests: [t.eq('code_brackets_ok("f(a[i], {k: v})")', 'True'), t.eq('code_brackets_ok("print(x])")', 'False'), t.hidden('code_brackets_ok("no brackets")', 'True'), t.hidden('code_brackets_ok("if (a:")', 'False'), t.hidden('code_brackets_ok("")', 'True')],
          hints: ['Now "not a closer" no longer means "an opener". Test openers explicitly.'],
          explanation: 'When the string holds only brackets, `else: push` is safe because everything that is not a closer is an opener. With other characters you need an explicit opener check, or letters end up on the stack.',
          signature: 'stack:brackets-ignore-other',
          minutes: 7,
        }),
        debug({
          id: 'd4-vp-debug-map-direction',
          title: 'Fix the bracket map',
          skills: ['matching_pairs', 'dict_lookup', 'dict_membership'],
          prompt: '`brackets_ok(s)` takes a string of `()[]{}` and should return `True` when every bracket is closed by the same kind in the right order. Make the tests pass.',
          brokenCode: `def brackets_ok(s):
    pairs = {"(": ")", "[": "]", "{": "}"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack`,
          solution: `def brackets_ok(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack`,
          tests: [t.eq('brackets_ok("([]){}")', 'True'), t.eq('brackets_ok("(]")', 'False'), t.hidden('brackets_ok("")', 'True'), t.hidden('brackets_ok("]")', 'False')],
          hints: ['On the very first character "(", which branch runs?', 'When you read a closer, you need to look up the opener it needs.'],
          explanation: 'The lookup happens when a closer arrives, so the keys must be closers: `{")": "(", ...}`. Reversed, `ch in pairs` treats openers as closers.',
          signature: 'debug:closer-opener-direction',
          minutes: 5,
        }),
      ],
    },

    // ───────────────────────────────────────────── Cold reps
    {
      id: 'd4-cold',
      title: 'Cold reps',
      summary: 'Windows and stacks once more: a signature and nothing else.',
      exercises: [
        write({
          id: 'd4-cold-longest-unique',
          title: 'Longest unique, from a signature',
          skills: ['sliding_window', 'window_state', 'set_membership'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `longest_unique(s)`. Return the length of the longest substring with no repeated characters.',
          starterCode: `def longest_unique(s):
    pass`,
          solution: `def longest_unique(s):
    seen = set()
    left = 0
    best = 0
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best`,
          tests: [t.eq('longest_unique("abcabcbb")', '3'), t.eq('longest_unique("")', '0'), t.hidden('longest_unique("abba")', '2'), t.hidden('longest_unique("dvdf")', '3')],
          signature: 'window:longest-unique',
          minutes: 8,
          important: true,
        }),
        write({
          id: 'd4-cold-valid',
          title: 'Brackets, from a signature',
          skills: ['matching_pairs', 'stack_push_pop'],
          ...cold,
          difficulty: 3,
          prompt: '`s` is a string of `()[]{}`. Write `is_valid(s)`. Return `True` if every bracket is closed by the same kind in the right order, otherwise `False`.',
          starterCode: `def is_valid(s):
    pass`,
          solution: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return not stack`,
          tests: [t.eq('is_valid("([]){}")', 'True'), t.eq('is_valid("(]")', 'False'), t.hidden('is_valid("]")', 'False'), t.hidden('is_valid("[")', 'False'), t.hidden('is_valid("")', 'True')],
          signature: 'stack:valid-brackets',
          minutes: 8,
          important: true,
        }),
        write({
          id: 'd4-cold-shortest',
          title: 'Shortest run, from a signature',
          skills: ['sliding_window', 'while_loop', 'state_tracking'],
          ...cold,
          difficulty: 3,
          prompt: '`nums` holds positive numbers. Write `shortest_at_least(nums, goal)`. Return the length of the shortest run of neighbouring values whose sum is at least `goal`, or `0` if there is none.',
          starterCode: `def shortest_at_least(nums, goal):
    pass`,
          solution: `def shortest_at_least(nums, goal):
    left = 0
    total = 0
    best = float("inf")
    for right in range(len(nums)):
        total += nums[right]
        while total >= goal:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return best if best != float("inf") else 0`,
          tests: [t.eq('shortest_at_least([2, 3, 1, 2, 4, 3], 7)', '2'), t.eq('shortest_at_least([1, 1], 5)', '0'), t.hidden('shortest_at_least([1, 4, 4], 4)', '1'), t.hidden('shortest_at_least([], 1)', '0')],
          signature: 'window:shortest-valid-sum',
          minutes: 8,
        }),
        write({
          id: 'd4-cold-backspace-equal',
          title: 'Same after backspaces?',
          skills: ['stack_push_pop', 'functions'],
          ...cold,
          prompt: '`a` and `b` are strings of typed keys, where `#` is a backspace. A backspace with nothing to delete does nothing. Write `same_typed(a, b)`. Return `True` if both strings produce the same final text.',
          starterCode: `def same_typed(a, b):
    pass`,
          solution: `def same_typed(a, b):
    def build(s):
        stack = []
        for ch in s:
            if ch == "#":
                if stack:
                    stack.pop()
            else:
                stack.append(ch)
        return stack

    return build(a) == build(b)`,
          tests: [t.eq('same_typed("ab#c", "ad#c")', 'True'), t.eq('same_typed("a#c", "b")', 'False'), t.hidden('same_typed("a##c", "#a#c")', 'True'), t.hidden('same_typed("", "#")', 'True')],
          signature: 'stack:backspace',
          minutes: 7,
        }),
        write({
          id: 'd4-cold-avg-window',
          title: 'Count good runs',
          skills: ['sliding_window', 'state_tracking'],
          ...cold,
          prompt: 'Write `count_windows(nums, k, threshold)`. Return how many stretches of `k` neighbouring values have a sum of at least `threshold`. If `k > len(nums)`, return `0`.',
          starterCode: `def count_windows(nums, k, threshold):
    pass`,
          solution: `def count_windows(nums, k, threshold):
    if k > len(nums):
        return 0
    window = sum(nums[:k])
    count = 1 if window >= threshold else 0
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]
        if window >= threshold:
            count += 1
    return count`,
          tests: [t.eq('count_windows([2, 2, 2, 2, 5, 5, 5, 8], 3, 12)', '3'), t.eq('count_windows([1, 1], 3, 1)', '0'), t.hidden('count_windows([4], 1, 4)', '1'), t.hidden('count_windows([1, 2, 3], 2, 10)', '0')],
          signature: 'window:fixed-count-threshold',
          minutes: 7,
        }),
      ],
    },
  ],
  capstones: ['longest-substring', 'valid-parentheses'],
}
