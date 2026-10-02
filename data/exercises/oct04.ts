import type { DayModule } from '@/lib/types'
import { choice, output, fill, code, reorder, capstone, explain, t } from '@/data/exercises/build'

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
      summary: 'Cold recall: pointers, running min, slicing, sets and maps.',
      exercises: [
        output({
          id: 'd4-warm-trace-pointers',
          title: 'Trace a sorted pair search',
          skills: ['two_pointer', 'pointer_update'],
          ...cold,
          prompt: 'What does this print?',
          code: `nums = [1, 2, 5, 7, 10]
target = 12
left, right = 0, len(nums) - 1
while left < right:
    total = nums[left] + nums[right]
    if total == target:
        break
    if total < target:
        left += 1
    else:
        right -= 1
print(left, right, nums[left] + nums[right])`,
          expectedOutput: '1 4 12',
          explanation: '1 + 10 = 11 is too small, so left moves; 2 + 10 = 12 matches.',
          signature: 'trace:sorted-pair-sum',
          minutes: 2,
        }),
        code({
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
        code({
          id: 'd4-warm-profit',
          title: 'Best profit from memory',
          skills: ['state_tracking'],
          ...cold,
          prompt: 'Write `max_profit(prices)`: buy once, sell on a later day, return the best profit or `0`.',
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
          minutes: 4,
          important: true,
        }),
        code({
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
          minutes: 7,
          important: true,
        }),
        code({
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
        code({
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
          minutes: 4,
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
        choice({
          id: 'd4-win-size',
          title: 'Window size',
          skills: ['sliding_window'],
          prompt: 'A window covers indexes `left` through `right`, **both included**. How many items does it hold?',
          options: ['right - left + 1', 'right - left', 'right + left', 'right - left - 1'],
          answer: 0,
          note: 'Inclusive window `[left, right]`: size is `right - left + 1`; as a slice it is `s[left:right + 1]`.',
          explanation: 'With left = right the window holds one item, and `right - left + 1` gives 1.',
          signature: 'recognize:window-size',
          minutes: 1,
        }),
        output({
          id: 'd4-win-trace-slices',
          title: 'Trace fixed windows',
          skills: ['sliding_window', 'slicing', 'range'],
          prompt: 'What does this print?',
          code: `s = "abcde"
k = 3
for right in range(k - 1, len(s)):
    left = right - k + 1
    print(left, right, s[left:right + 1])`,
          expectedOutput: '0 2 abc\n1 3 bcd\n2 4 cde',
          explanation: 'The right edge drives the loop; for a fixed size k, left is always `right - k + 1`. The slice needs `right + 1` because the end is excluded.',
          signature: 'trace:fixed-window-slices',
          minutes: 2,
        }),
        code({
          id: 'd4-win-all-windows',
          title: 'List every window',
          skills: ['sliding_window', 'slicing', 'range'],
          prompt: 'Write `all_windows(s, k)` returning every substring of length `k`, left to right. If `k > len(s)` return `[]`.',
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
        fill({
          id: 'd4-win-fill-slide-sum',
          title: 'Slide a running sum',
          skills: ['sliding_window', 'state_tracking'],
          prompt: 'Fill the blank: when the window moves right by one, which value leaves it?',
          starterCode: `def max_sum_k(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right]
        window -= ____
        best = max(best, window)
    return best`,
          solution: `def max_sum_k(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right]
        window -= nums[right - k]
        best = max(best, window)
    return best`,
          tests: [t.eq('max_sum_k([1, 4, 2, 10, 2, 3, 1, 0, 20], 4)', '24'), t.eq('max_sum_k([5], 1)', '5'), t.hidden('max_sum_k([-1, -2, -3], 2)', '-3')],
          hints: ['The new window is `nums[right - k + 1 .. right]`. Which index just fell off?'],
          note: 'Fixed window: add the item entering on the right, subtract the item leaving on the left. O(1) per step instead of re-summing.',
          signature: 'fill:fixed-window-sum',
          minutes: 2,
        }),
        code({
          id: 'd4-win-max-vowels',
          title: 'Most vowels in k letters',
          skills: ['sliding_window', 'window_state', 'conditionals'],
          difficulty: 3,
          prompt: 'Write `max_vowels(s, k)`: the largest number of vowels (`aeiou`) in any substring of length `k`. Assume `1 <= k <= len(s)`. Update a count on both edges instead of recounting each window.',
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
        choice({
          id: 'd4-win-when-shrink',
          title: 'When does left move?',
          skills: ['sliding_window'],
          prompt: 'In a **variable-size** window where right advances every iteration, when should `left` move?',
          options: ['While the window breaks the rule', 'Every iteration, together with right', 'Only once the loop has finished', 'Whenever right is even'],
          answer: 0,
          note: 'Variable window: `for right in ...:` add `right`; `while invalid:` remove `left`, `left += 1`; then the window is valid, so record the answer.',
          explanation: 'Grow on the right greedily; shrink on the left only as much as needed to make the window valid again.',
          signature: 'recognize:window-shrink-when',
          minutes: 1,
        }),
        output({
          id: 'd4-win-trace-variable',
          title: 'Trace grow and shrink',
          skills: ['sliding_window', 'while_loop'],
          difficulty: 2,
          prompt: 'What does this print?',
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
          explanation: 'At right = 4 the total is 10, so the while loop removes 1 and then 3 before the window is valid again.',
          signature: 'trace:variable-window-sum',
          minutes: 2.5,
        }),
        code({
          id: 'd4-win-longest-under',
          title: 'Longest run under a limit',
          skills: ['sliding_window', 'state_tracking', 'while_loop'],
          difficulty: 3,
          prompt: 'Write `longest_under(nums, limit)`. All numbers are positive. Return the length of the longest contiguous run whose sum is at most `limit` (0 if none).',
          starterCode: `def longest_under(nums, limit):
    left = 0
    total = 0
    best = 0
    for right in range(len(nums)):
        # grow, shrink while invalid, record
        pass
    return best`,
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
          minutes: 7,
          important: true,
        }),
        reorder({
          id: 'd4-win-reorder',
          title: 'Rebuild the variable window',
          skills: ['sliding_window', 'while_loop'],
          prompt: 'Put the lines in order: shortest run (in a list of positive numbers) whose sum is at least `goal`, or 0.',
          lines: [
            'def shortest_at_least(nums, goal):',
            '    left = 0',
            '    total = 0',
            '    best = float("inf")',
            '    for right in range(len(nums)):',
            '        total += nums[right]',
            '        while total >= goal:',
            '            best = min(best, right - left + 1)',
            '            total -= nums[left]',
            '            left += 1',
            '    return best if best != float("inf") else 0',
          ],
          tests: [t.eq('shortest_at_least([2, 3, 1, 2, 4, 3], 7)', '2'), t.eq('shortest_at_least([1, 1], 5)', '0'), t.hidden('shortest_at_least([1, 4, 4], 4)', '1')],
          explanation: 'Here the answer is recorded inside the shrink loop: the window is valid while it is being shrunk, and we want the smallest valid one.',
          signature: 'reorder:window-shortest',
          minutes: 3,
        }),
      ],
    },

    // ───────────────────────────────────────────── Window state
    {
      id: 'd4-window-state',
      title: 'Window state',
      summary: 'A set or count map that mirrors what is inside the window, updated on both edges.',
      exercises: [
        choice({
          id: 'd4-ws-set-remove',
          title: 'Leaving the window',
          skills: ['window_state', 'set_membership'],
          prompt: '`seen` holds exactly the characters in `s[left..right]`. You are about to do `left += 1`. What must happen first?',
          options: ['seen.remove(s[left])', 'seen.add(s[left])', 'seen.remove(s[right])', 'seen.clear()'],
          answer: 0,
          note: 'The window state must match the window. Something enters → add it. Something leaves → remove it, **before** the edge moves past it.',
          explanation: 's[left] is the character leaving the window, so it must leave the set too.',
          signature: 'recognize:window-set-remove',
          minutes: 1,
        }),
        output({
          id: 'd4-ws-trace-set',
          title: 'Trace a set window',
          skills: ['window_state', 'sliding_window', 'set_add'],
          difficulty: 2,
          prompt: 'What does this print?',
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
          explanation: 'At right = 3, "a" is already inside, so the old "a" at index 0 is removed and left moves to 1. Then the new "a" is added.',
          signature: 'trace:window-set',
          minutes: 2.5,
        }),
        fill({
          id: 'd4-ws-fill-nearby',
          title: 'Keep only the last k',
          skills: ['window_state', 'set_add', 'enumerate'],
          difficulty: 2,
          prompt: '`has_nearby_duplicate(nums, k)` returns `True` if two equal values are at most `k` positions apart. `window` holds the last `k` values. Fill the blank with the value that just fell out.',
          starterCode: `def has_nearby_duplicate(nums, k):
    window = set()
    for i, x in enumerate(nums):
        if x in window:
            return True
        window.add(x)
        if len(window) > k:
            window.remove(____)
    return False`,
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
          hints: ['After adding index i, the window should be indexes i-k+1..i. Which index is now too old?'],
          signature: 'fill:window-set-fixed',
          minutes: 3,
        }),
        code({
          id: 'd4-ws-remove-one',
          title: 'Decrement and delete',
          skills: ['window_state', 'dict_lookup', 'dict_assign'],
          prompt: 'Write `remove_one(counts, key)`: lower `counts[key]` by one and delete the key entirely when it reaches 0. Return `counts`.\n\nThat keeps `len(counts)` equal to the number of distinct items in the window.',
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
        choice({
          id: 'd4-ws-set-or-map',
          title: 'Set or count map?',
          skills: ['window_state', 'frequency_map'],
          prompt: 'A window may contain the same value several times. When the left edge drops one copy, you need to know whether another copy is still inside. What should the window state be?',
          options: ['A count map: value → how many are inside', 'A set of values', 'A single integer total', 'A list of the window items, searched each step'],
          answer: 0,
          explanation: 'A set forgets how many copies there are, so removing one copy would wrongly remove the value. A set is enough only when the window never holds duplicates.',
          signature: 'recognize:window-set-vs-map',
          minutes: 1,
        }),
        output({
          id: 'd4-ws-trace-map',
          title: 'Trace a count-map shrink',
          skills: ['window_state', 'frequency_map', 'while_loop'],
          difficulty: 3,
          prompt: 'What does this print? (At most two kinds of characters allowed in the window.)',
          code: `s = "abac"
counts = {}
left = 0
for right in range(len(s)):
    counts[s[right]] = counts.get(s[right], 0) + 1
    while len(counts) > 2:
        counts[s[left]] -= 1
        if counts[s[left]] == 0:
            del counts[s[left]]
        left += 1
    print(right, left, sorted(counts.items()))`,
          expectedOutput: "0 0 [('a', 1)]\n1 0 [('a', 1), ('b', 1)]\n2 0 [('a', 2), ('b', 1)]\n3 2 [('a', 1), ('c', 1)]",
          explanation: 'At right = 3 there are three kinds. Dropping the first "a" only lowers its count to 1, so left must keep going; dropping "b" deletes it and the window is valid at left = 2.',
          signature: 'trace:window-count-map-shrink',
          minutes: 2.5,
        }),
        code({
          id: 'd4-ws-longest-run',
          title: 'Longest run of one character',
          skills: ['sliding_window', 'string_index', 'state_tracking'],
          prompt: 'Write `longest_run(s)`: the length of the longest block of one repeated character. When the character changes, the window restarts at that position.\n\n`"aaabbbbcc"` → `4`',
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
          minutes: 4,
        }),
        code({
          id: 'd4-ws-distinct-windows',
          title: 'Distinct values per window',
          skills: ['window_state', 'frequency_map', 'sliding_window'],
          difficulty: 4,
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `distinct_per_window(nums, k)` returning, for each window of size `k` (left to right), how many distinct values it contains. Keep a count map and update it on both edges; do not rebuild a set per window.\n\n`[1, 2, 1, 3, 4, 2, 3], 4` → `[3, 4, 4, 3]`',
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
        code({
          id: 'd4-ws-anagram-window',
          title: 'Hidden anagram',
          skills: ['window_state', 'frequency_map', 'sliding_window', 'dict_get'],
          difficulty: 4,
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `has_anagram(pattern, s)`: `True` if some substring of `s` with length `len(pattern)` uses exactly the same letters as `pattern` (same counts, any order). Slide a fixed window with a count map; compare maps with `==`.\n\n`has_anagram("ab", "eidbaooo")` → `True` (`"ba"`)',
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
            'Two strings are anagrams when their frequency maps are equal (yesterday’s Valid Anagram).',
            'Build the pattern’s map once; keep a window map of the last k characters.',
            'Add the entering character, remove the leaving one (`del` at 0 so the maps compare equal).',
            'After each update, `if window == need: return True`.',
          ],
          explanation: 'Comparing two maps over a fixed alphabet is O(26), so the whole scan is O(n). Deleting zero counts matters: `{"a": 0, "b": 1} != {"b": 1}`.',
          signature: 'window:fixed-count-map-compare',
          minutes: 11,
        }),
        code({
          id: 'd4-ws-flip-zeros',
          title: 'Longest ones with k flips',
          skills: ['sliding_window', 'state_tracking', 'while_loop'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `longest_ones(bits, k)`: `bits` holds 0s and 1s. You may flip at most `k` zeros to ones. Return the length of the longest run of ones you can get.\n\n`[1, 1, 0, 0, 1, 1, 1, 0, 1], k = 1` → `5`',
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
          minutes: 11,
        }),
        code({
          id: 'd4-ws-two-kinds',
          title: 'Longest with at most two kinds',
          skills: ['window_state', 'sliding_window', 'frequency_map', 'state_tracking'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `longest_two_kinds(s)`: the length of the longest substring that uses **at most two different characters**.\n\n`"ccaabbb"` → `5` (`"aabbb"`)',
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
            'Variable window: what makes it invalid?',
            'More than two distinct characters inside; a count map tells you how many.',
            'While `len(counts) > 2`: decrement `s[left]`, delete at 0, `left += 1`.',
            'Add right, shrink while invalid, then `best = max(best, right - left + 1)`.',
          ],
          explanation: 'This is the general shape: count map as window state, `len(counts)` as the validity test, shrink on the left until valid.',
          signature: 'window:count-map-variable',
          minutes: 11,
        }),
        code({
          id: 'd4-ws-k-kinds',
          title: 'At most k kinds',
          skills: ['window_state', 'sliding_window', 'frequency_map'],
          difficulty: 3,
          stage: 'reconstruct',
          prompt: 'Generalize from memory: write `longest_k_kinds(s, k)`, the length of the longest substring using at most `k` different characters. `k` may be 0.',
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
          hints: ['Same template as two kinds; only the validity test changes.'],
          signature: 'window:count-map-variable',
          minutes: 7,
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
            'Given a string `s`, return the length of the longest stretch of consecutive characters in which no character appears twice.\n\nA stretch must be contiguous: "pwke" taken from "pwwkew" does not count because it skips a character. Aim for O(n).',
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
          prompt: 'Explain the window: what is always true about it, why the nested loop is still O(n), and which inputs you would test.',
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
        code({
          id: 'd4-ls-last-seen',
          title: 'Jump with a last-seen map',
          skills: ['sliding_window', 'index_map', 'state_tracking'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Rewrite the longest-unique length with a dict `last` mapping each character to its most recent index. Instead of stepping left one at a time, **jump** it past the previous copy. Careful: left must never move backwards (try `"abba"`).',
          starterCode: `def longest_unique_jump(s):
    last = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        pass
    return best`,
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
          minutes: 11,
        }),
        code({
          id: 'd4-ls-return-substring',
          title: 'Return the substring itself',
          skills: ['sliding_window', 'window_state', 'slicing'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `longest_unique_text(s)` returning the longest substring with no repeated characters. If several tie, return the one that starts first.',
          starterCode: `def longest_unique_text(s):
    pass`,
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
        choice({
          id: 'd4-st-pop-returns',
          title: 'What does pop return?',
          skills: ['stack_push_pop'],
          prompt: 'What is `x` after this runs?',
          code: `stack = [1, 2, 3]
x = stack.pop()`,
          options: ['3', '1', '[1, 2]', 'None'],
          answer: 0,
          note: 'Stack via list: push `stack.append(x)`, pop `stack.pop()` (removes and returns the last item), peek `stack[-1]`. All O(1).',
          explanation: '`.pop()` with no argument removes and returns the last item. The list becomes [1, 2].',
          signature: 'recognize:stack-pop',
          minutes: 1,
        }),
        output({
          id: 'd4-st-trace',
          title: 'Trace push and pop',
          skills: ['stack_push_pop'],
          prompt: 'What does this print?',
          code: `stack = []
stack.append("a")
stack.append("b")
stack.append("c")
top = stack.pop()
print(top, stack)
stack.append("d")
print(stack[-1], len(stack))`,
          expectedOutput: "c ['a', 'b']\nd 3",
          explanation: 'Last in, first out: "c" was pushed last, so it pops first. Peeking with `stack[-1]` does not remove anything.',
          signature: 'trace:stack-push-pop',
          minutes: 2,
        }),
        choice({
          id: 'd4-st-empty-pop',
          title: 'Popping an empty stack',
          skills: ['stack_push_pop'],
          prompt: 'What happens?',
          code: `stack = []
stack.pop()`,
          options: ['IndexError: pop from empty list', 'Returns None', 'Returns []', 'Nothing happens'],
          answer: 0,
          note: 'Guard before `pop()` or `stack[-1]`: `if stack:` (an empty list is falsy).',
          explanation: 'Both `stack.pop()` and `stack[-1]` raise IndexError on an empty list, so check `if stack` (or `if not stack`) first.',
          signature: 'recognize:stack-empty-pop',
          minutes: 1,
        }),
        output({
          id: 'd4-st-trace-peek',
          title: 'Peek, then empty it',
          skills: ['stack_push_pop', 'conditionals'],
          prompt: 'What does this print?',
          code: `stack = [4, 7]
print(stack[-1])
print(len(stack))
stack.pop()
stack.pop()
print(bool(stack), stack[-1] if stack else "empty")`,
          expectedOutput: '7\n2\nFalse empty',
          explanation: 'Peeking leaves the length at 2. After two pops the list is empty, so `bool(stack)` is False and the guard avoids `stack[-1]`.',
          signature: 'trace:stack-peek-empty',
          minutes: 2,
        }),
        fill({
          id: 'd4-st-fill-guard',
          title: 'Safe peek',
          skills: ['stack_push_pop', 'conditionals'],
          prompt: 'Fill the blank so `safe_top` returns the top item, or `None` for an empty stack.',
          starterCode: `def safe_top(stack):
    if ____:
        return stack[-1]
    return None`,
          solution: `def safe_top(stack):
    if stack:
        return stack[-1]
    return None`,
          tests: [t.eq('safe_top([1, 2])', '2'), t.eq('safe_top([])', 'None')],
          hints: ['An empty list is falsy.'],
          signature: 'fill:stack-guard',
          minutes: 2,
        }),
        code({
          id: 'd4-st-reverse',
          title: 'Reverse with a stack',
          skills: ['stack_push_pop', 'string_iterate', 'while_loop'],
          prompt: 'Write `reverse_with_stack(s)`: push every character, then pop them all into the result. (No slicing.)',
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
        code({
          id: 'd4-st-backspace',
          title: 'Apply backspaces',
          skills: ['stack_push_pop', 'conditionals', 'string_methods'],
          difficulty: 3,
          prompt: 'Write `type_out(s)`: `#` is a backspace that deletes the previous typed character (if there is one). Return the final text.\n\n`"ab#c"` → `"ac"`, `"a##b"` → `"b"`',
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
          minutes: 7,
        }),
        code({
          id: 'd4-st-adjacent-pairs',
          title: 'Cancel adjacent twins',
          skills: ['stack_push_pop', 'conditionals'],
          difficulty: 3,
          prompt: 'Write `cancel_pairs(s)`: repeatedly remove two equal neighbouring characters until none remain, and return what is left.\n\n`"abbaca"` → `"ca"` (remove "bb", then "aa")',
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
          minutes: 7,
          important: true,
        }),
        code({
          id: 'd4-st-round-balanced',
          title: 'Balanced round brackets',
          skills: ['stack_push_pop', 'conditionals', 'early_return'],
          prompt: 'Write `balanced(s)` for a string of only `(` and `)`. Use a stack: push on `(`, pop on `)`. A `)` with nothing to pop means unbalanced; so does anything left over at the end.',
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
          minutes: 4,
        }),
        code({
          id: 'd4-st-max-depth',
          title: 'Deepest nesting',
          skills: ['stack_push_pop', 'state_tracking'],
          prompt: 'Write `max_depth(s)`: `s` has balanced round brackets mixed with other characters. Return the deepest nesting level.\n\n`"(1+(2*3)+((8)/4))+1"` → `3`',
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
          minutes: 4,
        }),
        code({
          id: 'd4-st-postfix',
          title: 'Evaluate postfix',
          skills: ['stack_push_pop', 'conditionals', 'string_methods'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `eval_postfix(expr)`. `expr` is space-separated tokens in postfix order: numbers (possibly negative) and the operators `+ - *`. An operator applies to the two most recent values. Return the result.\n\n`"3 4 + 2 *"` → `14`',
          starterCode: `def eval_postfix(expr):
    pass`,
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
            t.eq('eval_postfix("3 4 + 2 *")', '14'),
            t.eq('eval_postfix("5 1 2 + 4 * + 3 -")', '14'),
            t.hidden('eval_postfix("7")', '7'),
            t.hidden('eval_postfix("2 9 -")', '-7'),
            t.hidden('eval_postfix("-3 4 *")', '-12'),
          ],
          hints: [
            'Numbers wait on a stack until an operator needs them.',
            'On an operator pop twice: the first pop is the right operand.',
            '`b = stack.pop(); a = stack.pop()` then push `a - b` (order matters).',
          ],
          explanation: 'The stack holds values not yet consumed. Popping order matters for `-`: the top is the second operand.',
          signature: 'stack:postfix-eval',
          minutes: 7,
        }),
        code({
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
        code({
          id: 'd4-st-next-greater',
          title: 'Next greater value',
          skills: ['stack_push_pop', 'enumerate', 'while_loop'],
          difficulty: 4,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Stretch: write `next_greater(nums)` returning a list where entry `i` is the first value to the right of `nums[i]` that is strictly larger, or `-1` if none. Aim for O(n) with a stack of **indexes** still waiting for an answer.\n\n`[2, 1, 3, 2]` → `[3, 3, -1, -1]`',
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
          minutes: 11,
        }),
      ],
    },

    // ───────────────────────────────────────────── Matching pairs
    {
      id: 'd4-matching',
      title: 'Matching pairs',
      summary: 'A closer→opener dict plus the stack top decides every closer.',
      exercises: [
        choice({
          id: 'd4-mp-dict-direction',
          title: 'Which way does the dict map?',
          skills: ['matching_pairs', 'dict_lookup'],
          prompt: 'When you read a closing bracket, you need to know which opener must be on top of the stack. Which dict makes that one lookup?',
          options: [
            '{")": "(", "]": "[", "}": "{"}',
            '{"(": ")", "[": "]", "{": "}"}',
            '{"(": 1, "[": 2, "{": 3}',
            '["()", "[]", "{}"]',
          ],
          answer: 0,
          note: '`pairs = {")": "(", "]": "[", "}": "{"}`: `ch in pairs` tells you ch is a closer, and `pairs[ch]` is the opener it needs.',
          explanation: 'Keys are closers, so `ch in pairs` doubles as the "is this a closer?" test and `pairs[ch]` gives the required opener.',
          signature: 'recognize:closer-opener-map',
          minutes: 1,
        }),
        output({
          id: 'd4-mp-trace',
          title: 'Trace a closer lookup',
          skills: ['matching_pairs', 'stack_push_pop', 'dict_membership'],
          difficulty: 2,
          prompt: 'What does this print?',
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
          explanation: 'Openers are pushed. The single closer "]" finds "[" on top and pops it. "(" and "{" are left unclosed.',
          signature: 'trace:bracket-stack',
          minutes: 2.5,
        }),
        code({
          id: 'd4-mp-one-line-lookup',
          title: 'Look up the opener',
          skills: ['matching_pairs', 'dict_get', 'dict_lookup'],
          prompt: 'Write two lines below the given code:\n\n- `opener`: the opener that `ch` needs\n- `missing`: the opener that `other` needs, or `None` because it is not a closer (no KeyError)',
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
          minutes: 4,
        }),
        fill({
          id: 'd4-mp-fill-closes-top',
          title: 'Does it close the top?',
          skills: ['matching_pairs', 'stack_push_pop'],
          prompt: 'Fill the blank so `closes_top` is `True` only when the stack is non-empty and its top is the opener `ch` needs.',
          starterCode: `def closes_top(stack, ch):
    pairs = {")": "(", "]": "[", "}": "{"}
    return len(stack) > 0 and stack[-1] == ____`,
          solution: `def closes_top(stack, ch):
    pairs = {")": "(", "]": "[", "}": "{"}
    return len(stack) > 0 and stack[-1] == pairs[ch]`,
          tests: [t.eq('closes_top(["(", "["], "]")', 'True'), t.eq('closes_top([], ")")', 'False'), t.hidden('closes_top(["{"], ")")', 'False')],
          hints: ['Which opener does `ch` need?'],
          explanation: '`and` short-circuits: on an empty stack, `stack[-1]` is never evaluated.',
          signature: 'fill:closer-matches-top',
          minutes: 2,
        }),
        code({
          id: 'd4-mp-first-bad',
          title: 'First bad closer',
          skills: ['matching_pairs', 'stack_push_pop', 'enumerate', 'early_return'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `first_bad(s)` for a string of brackets `()[]{}`. Return the index of the first closer that has nothing to close or closes the wrong kind. Return `-1` if no closer is bad (leftover openers are fine here).',
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
        code({
          id: 'd4-mp-pair-positions',
          title: 'Where does each pair close?',
          skills: ['matching_pairs', 'stack_push_pop', 'enumerate', 'dict_assign'],
          difficulty: 3,
          stage: 'combine',
          repType: 'combine',
          prompt: 'Write `pair_positions(s)` for a balanced string of `(` and `)`. Return a dict mapping each opener index to the index of the closer that matches it. Push **indexes**, not characters.\n\n`"(())"` → `{1: 2, 0: 3}`',
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
          minutes: 7,
        }),
        code({
          id: 'd4-mp-min-to-fix',
          title: 'Brackets to add',
          skills: ['stack_push_pop', 'accumulator', 'conditionals'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Write `min_to_fix(s)` for a string of `(` and `)`: the smallest number of brackets you must insert to make it balanced.\n\n`"())"` → `1`, `"((("` → `3`, `"()))(("` → `4`',
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
          hints: ['Two kinds of trouble: closers with nothing to match, and openers never closed.', 'Count closers that hit an empty stack; at the end add `len(stack)`.'],
          signature: 'stack:min-insertions',
          minutes: 7,
        }),
        reorder({
          id: 'd4-mp-reorder',
          title: 'Rebuild the bracket checker',
          skills: ['matching_pairs', 'stack_push_pop'],
          prompt: 'Put the lines in order to check that every bracket in `s` is closed by the right kind in the right order.',
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
            'A string contains only the six characters `( ) [ ] { }`. It is well formed when every opening bracket is closed by a bracket of the same kind, closings happen in the reverse order of openings (inner pairs close first), and no closing bracket appears without a matching opener. Return `True` if `s` is well formed, otherwise `False`. The empty string counts as well formed.',
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
        code({
          id: 'd4-vp-fix-bug',
          title: 'Fix the bracket checker',
          skills: ['matching_pairs', 'stack_push_pop', 'edge_cases'],
          difficulty: 3,
          stage: 'reconstruct',
          prompt: 'A teammate wrote this checker. It passes `"()[]"` but is wrong on some inputs. Find the inputs that break it (think about the three ways brackets fail) and fix the code.',
          starterCode: `def is_valid(s):
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
          tests: [t.eq('is_valid("()[]")', 'True'), t.eq('is_valid("((")', 'False'), t.hidden('is_valid(")")', 'False'), t.hidden('is_valid("([)]")', 'False'), t.hidden('is_valid("{}")', 'True')],
          hints: ['What happens on `")"` alone? On `"(("`?', 'One bug raises IndexError; the other returns True with openers left over.'],
          explanation: 'Two missing checks: the empty stack before peeking, and leftovers at the end. These are exactly the bugs interviewers look for.',
          signature: 'stack:fix-valid-brackets',
          minutes: 7,
        }),
        code({
          id: 'd4-vp-with-text',
          title: 'Brackets inside code',
          skills: ['matching_pairs', 'stack_push_pop', 'conditionals'],
          difficulty: 3,
          stage: 'pattern',
          repType: 'pattern',
          prompt: 'Variation: write `code_brackets_ok(s)` where `s` is a line of code. Only `()[]{}` matter; every other character is ignored.\n\n`"f(a[i], {k: v})"` → `True`',
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
          explanation: 'The capstone’s `else: push` assumed every non-closer is an opener. With other characters you need an explicit opener check, or letters end up on the stack.',
          signature: 'stack:brackets-ignore-other',
          minutes: 7,
        }),
      ],
    },

    // ───────────────────────────────────────────── Cold reps
    {
      id: 'd4-cold',
      title: 'Cold reps',
      summary: 'Windows and stacks once more, from a blank editor.',
      exercises: [
        choice({
          id: 'd4-cold-which-structure',
          title: 'Pick the structure',
          skills: ['stack_push_pop', 'sliding_window'],
          ...cold,
          prompt: 'You must undo the most recent edit first, then the one before it. Which structure fits?',
          options: ['A stack (list with append/pop)', 'A set', 'A sliding window', 'A sorted list with two pointers'],
          answer: 0,
          explanation: 'Most recent first is last in, first out.',
          signature: 'recognize:pick-stack',
          minutes: 1,
        }),
        output({
          id: 'd4-cold-trace-counts',
          title: 'Trace a count-map window',
          skills: ['window_state', 'frequency_map'],
          ...cold,
          difficulty: 2,
          prompt: 'What does this print?',
          code: `s = "aabc"
counts = {}
for ch in s[:3]:
    counts[ch] = counts.get(ch, 0) + 1
print(len(counts), counts["a"])
counts["a"] -= 1
counts["c"] = counts.get("c", 0) + 1
print(len(counts), counts["a"])
counts["a"] -= 1
if counts["a"] == 0:
    del counts["a"]
print(sorted(counts))`,
          expectedOutput: "2 2\n3 1\n['b', 'c']",
          explanation: 'Without the `del`, "a" would stay as a key with count 0 and `len(counts)` would overcount distinct values.',
          signature: 'trace:window-count-map',
          minutes: 2.5,
        }),
        code({
          id: 'd4-cold-longest-unique',
          title: 'Longest unique, from blank',
          skills: ['sliding_window', 'window_state', 'set_membership'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `longest_unique(s)`: the length of the longest substring with no repeated characters.',
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
          minutes: 7,
          important: true,
        }),
        code({
          id: 'd4-cold-valid',
          title: 'Brackets, from blank',
          skills: ['matching_pairs', 'stack_push_pop'],
          ...cold,
          difficulty: 3,
          prompt: 'Write `is_valid(s)` for a string of `()[]{}`: `True` if every bracket is closed by the same kind in the right order.',
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
          minutes: 7,
          important: true,
        }),
        code({
          id: 'd4-cold-backspace-equal',
          title: 'Same after backspaces?',
          skills: ['stack_push_pop', 'functions'],
          ...cold,
          prompt: 'Write `same_typed(a, b)`: `#` is a backspace. Return `True` if both strings produce the same final text.',
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
          minutes: 4,
        }),
        code({
          id: 'd4-cold-avg-window',
          title: 'Count good windows',
          skills: ['sliding_window', 'state_tracking'],
          ...cold,
          prompt: 'Write `count_windows(nums, k, threshold)`: how many windows of size `k` have a sum of at least `threshold`? Slide a running sum.',
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
          minutes: 4,
        }),
      ],
    },
  ],
  capstones: ['longest-substring', 'valid-parentheses'],
}
