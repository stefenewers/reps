import type { DayModule } from '@/lib/types'
import { choice, output, fill, code, reorder, capstone, explain, t } from '@/data/exercises/build'

// October 9: sorting with keys, heapq, top-k, intervals.

const warmup = [
  code({
    id: 'd9-warm-word-counts',
    title: 'Warm-up: count words',
    skills: ['frequency_map', 'dict_get'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 1,
    minutes: 4,
    prompt: "Write `count_words(words)` that returns a dict mapping each word to how many times it appears. Use `.get()`.",
    starterCode: `def count_words(words):
    pass`,
    solution: `def count_words(words):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    return counts`,
    tests: [
      t.eq("count_words(['a', 'b', 'a'])", "{'a': 2, 'b': 1}"),
      t.eq('count_words([])', '{}'),
      t.hidden("count_words(['x', 'x', 'x'])", "{'x': 3}"),
    ],
    hints: ['counts[w] = counts.get(w, 0) + 1'],
    signature: 'freq-map:count-words',
  }),
  code({
    id: 'd9-warm-sorted-pair',
    title: 'Warm-up: pair in a sorted list',
    skills: ['two_pointer', 'pointer_update'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 6,
    prompt: "`nums` is sorted ascending. Write `pair_sum(nums, target)` that returns `[i, j]` (with `i < j`) for the first pair found by two pointers that adds to `target`, or `[]` if none exists.",
    starterCode: `def pair_sum(nums, target):
    pass`,
    solution: `def pair_sum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        if s < target:
            left += 1
        else:
            right -= 1
    return []`,
    tests: [
      t.eq('pair_sum([1, 3, 4, 6, 9], 10)', '[0, 4]'),
      t.eq('pair_sum([1, 2], 5)', '[]'),
      t.hidden('pair_sum([], 1)', '[]'),
      t.hidden('pair_sum([-3, 0, 2, 5], 2)', '[0, 3]'),
    ],
    hints: ['Start one pointer at each end.', 'Too small: move left up. Too big: move right down.'],
    signature: 'two-pointer:sorted-pair',
  }),
  code({
    id: 'd9-warm-window-sum',
    title: 'Warm-up: best window of size k',
    skills: ['sliding_window', 'window_state'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 6,
    prompt: "Write `max_window(nums, k)` that returns the largest sum of any `k` consecutive numbers. Assume `1 <= k <= len(nums)`. Keep a running window sum instead of re-summing.",
    starterCode: `def max_window(nums, k):
    pass`,
    solution: `def max_window(nums, k):
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        best = max(best, window)
    return best`,
    tests: [
      t.eq('max_window([1, 4, 2, 10, 2], 2)', '12'),
      t.eq('max_window([5], 1)', '5'),
      t.hidden('max_window([-1, -2, -3], 2)', '-3'),
      t.hidden('max_window([2, 2, 2, 2], 4)', '8'),
    ],
    hints: ['Add the entering element, subtract the leaving one: nums[i] - nums[i - k].'],
    signature: 'sliding-window:fixed-max-sum',
  }),
  code({
    id: 'd9-warm-lower-bound',
    title: 'Warm-up: first index at least target',
    skills: ['binary_search', 'mid_calc', 'search_invariant'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
    prompt: "`nums` is sorted. Write `first_at_least(nums, target)` that returns the first index whose value is `>= target`, or `len(nums)` if there is none. Use binary search.",
    starterCode: `def first_at_least(nums, target):
    pass`,
    solution: `def first_at_least(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    tests: [
      t.eq('first_at_least([1, 3, 3, 7], 3)', '1'),
      t.eq('first_at_least([1, 3, 3, 7], 8)', '4'),
      t.hidden('first_at_least([], 5)', '0'),
      t.hidden('first_at_least([2, 4, 6], 1)', '0'),
      t.hidden('first_at_least([2, 4, 6], 5)', '2'),
    ],
    hints: ['Use hi = len(nums) so "not found" is a valid answer.', 'If nums[mid] < target the answer is right of mid; otherwise mid might be the answer, so hi = mid.'],
    signature: 'binary-search:lower-bound',
  }),
  code({
    id: 'd9-warm-max-depth',
    title: 'Warm-up: tree depth',
    skills: ['tree_dfs', 'recursion_base_case', 'recursion_return'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 5,
    prompt: "Write `max_depth(root)` that returns the number of nodes on the longest root-to-leaf path. An empty tree has depth 0.",
    starterCode: `def max_depth(root):
    pass`,
    solution: `def max_depth(root):
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`,
    tests: [
      t.eq('max_depth(build_tree([3, 9, 20, None, None, 15, 7]))', '3'),
      t.eq('max_depth(None)', '0'),
      t.hidden('max_depth(build_tree([1, 2, None, 3, None, 4]))', '4'),
    ],
    hints: ['Base case: None has depth 0.'],
    signature: 'tree-dfs:max-depth',
  }),
  code({
    id: 'd9-warm-components',
    title: 'Warm-up: count components',
    skills: ['graph_adjacency', 'graph_dfs', 'connected_components', 'visited_set'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 8,
    prompt: "Nodes are `0..n-1` and `edges` is a list of undirected `[a, b]` pairs. Write `count_components(n, edges)` that returns the number of connected groups. Build an adjacency dict first.",
    starterCode: `def count_components(n, edges):
    pass`,
    solution: `def count_components(n, edges):
    graph = {i: [] for i in range(n)}
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    seen = set()
    count = 0
    for start in range(n):
        if start in seen:
            continue
        count += 1
        seen.add(start)
        stack = [start]
        while stack:
            node = stack.pop()
            for nxt in graph[node]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
    return count`,
    tests: [
      t.eq('count_components(5, [[0, 1], [1, 2], [3, 4]])', '2'),
      t.eq('count_components(3, [])', '3'),
      t.hidden('count_components(1, [])', '1'),
      t.hidden('count_components(4, [[0, 1], [1, 2], [2, 3], [3, 0]])', '1'),
    ],
    hints: ['Every unvisited start node begins a new component.', 'Explore from it with a stack and a seen set.'],
    signature: 'graph:count-components',
  }),
]

const sorting = [
  choice({
    id: 'd9-sort-new-vs-inplace',
    title: 'sorted() or .sort()?',
    skills: ['sorting'],
    prompt: "You need a sorted version of `nums` but must leave `nums` itself unchanged. Which line?",
    options: ['nums.sort()', 'result = sorted(nums)', 'result = nums.sort()', 'sort(nums)'],
    answer: 1,
    note: "`sorted(seq)` returns a new list. `lst.sort()` sorts in place and returns `None`.",
    explanation: '`sorted` copies and leaves the original alone. `.sort()` mutates and returns None, so `result = nums.sort()` stores None.',
    signature: 'sorting:recognize-new-vs-inplace',
  }),
  output({
    id: 'd9-sort-returns-none',
    title: 'What does .sort() return?',
    skills: ['sorting'],
    prompt: 'Predict the output.',
    code: `nums = [3, 1, 2]
result = nums.sort()
print(result)
print(nums)`,
    expectedOutput: `None
[1, 2, 3]`,
    explanation: '`.sort()` works in place and returns None. This is the most common sorting bug in interviews.',
    important: true,
    signature: 'trace:sort-returns-none',
  }),
  output({
    id: 'd9-sort-strings-reverse',
    title: 'sorted on strings and reverse=True',
    skills: ['sorting', 'string_methods'],
    prompt: 'Predict the output.',
    code: `word = 'dcab'
print(sorted(word))
print(''.join(sorted(word)))
nums = [5, 2, 9]
print(sorted(nums, reverse=True))
print(nums)`,
    expectedOutput: `['a', 'b', 'c', 'd']
abcd
[9, 5, 2]
[5, 2, 9]`,
    explanation: '`sorted` on a string returns a list of characters; join it back to get a string. `reverse=True` sorts descending, and `nums` is untouched.',
    minutes: 2,
    signature: 'trace:sorted-string-reverse',
  }),
  fill({
    id: 'd9-sort-fill-reverse',
    title: 'Sort descending into a new list',
    skills: ['sorting'],
    prompt: 'Fill the blank so `desc` holds the scores from highest to lowest and `scores` is unchanged.',
    starterCode: `scores = [70, 95, 82, 61]
desc = sorted(scores, ____)`,
    solution: `scores = [70, 95, 82, 61]
desc = sorted(scores, reverse=True)`,
    tests: [t.check('desc is descending', 'assert desc == [95, 82, 70, 61]'), t.check('scores unchanged', 'assert scores == [70, 95, 82, 61]')],
    hints: ['A keyword argument flips the order.'],
    signature: 'sorting:fill-reverse',
  }),
  code({
    id: 'd9-sort-inplace-desc',
    title: 'Sort in place, largest first',
    skills: ['sorting'],
    stage: 'recall',
    difficulty: 1,
    minutes: 1.5,
    prompt: 'Write one line that sorts `nums` in place from largest to smallest.',
    starterCode: `nums = [4, 1, 3, 1]
# one line: sort nums in place, largest first
`,
    solution: `nums = [4, 1, 3, 1]
nums.sort(reverse=True)`,
    tests: [t.check('nums sorted descending', 'assert nums == [4, 3, 1, 1]')],
    hints: ['`.sort()` takes the same `reverse=` keyword as `sorted`.'],
    signature: 'sorting:one-line-inplace-desc',
  }),
  code({
    id: 'd9-sort-top-three',
    title: 'Three best scores',
    skills: ['sorting', 'slicing'],
    difficulty: 1,
    minutes: 4,
    prompt: 'Write `top_three(scores)` that returns the three largest scores, highest first. If there are fewer than three, return all of them, highest first. Do not modify the input.',
    starterCode: `def top_three(scores):
    pass`,
    solution: `def top_three(scores):
    return sorted(scores, reverse=True)[:3]`,
    tests: [
      t.eq('top_three([50, 90, 70, 80])', '[90, 80, 70]'),
      t.eq('top_three([5])', '[5]'),
      t.hidden('top_three([])', '[]'),
      t.hidden('top_three([3, 3, 3, 3])', '[3, 3, 3]'),
      t.check('input unchanged', 's = [1, 2, 3, 4]\ntop_three(s)\nassert s == [1, 2, 3, 4]', true),
    ],
    hints: ['Sort descending, then slice.', 'Slicing past the end is safe: [1][:3] is [1].'],
    signature: 'sorting:slice-top',
  }),
  output({
    id: 'd9-sort-tuples',
    title: 'How tuples sort',
    skills: ['sorting', 'tuples'],
    prompt: 'Predict the output.',
    code: `pairs = [(2, 'b'), (1, 'z'), (2, 'a')]
print(sorted(pairs))
print(max(pairs))`,
    expectedOutput: `[(1, 'z'), (2, 'a'), (2, 'b')]
(2, 'b')`,
    note: 'Tuples compare element by element: first items, and only on a tie the second items.',
    explanation: 'Tuples compare left to right. (2, "a") < (2, "b") because the first items tie and "a" < "b". This is why heaps of (priority, item) tuples work.',
    important: true,
    signature: 'trace:sort-tuples',
  }),
  code({
    id: 'd9-sort-anagram',
    title: 'Anagram check by sorting',
    skills: ['sorting', 'string_methods'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 4,
    prompt: 'Write `same_letters(a, b)` that returns `True` if `b` is a rearrangement of `a`. Use sorting, not a dict.',
    starterCode: `def same_letters(a, b):
    pass`,
    solution: `def same_letters(a, b):
    return sorted(a) == sorted(b)`,
    tests: [
      t.eq("same_letters('listen', 'silent')", 'True'),
      t.eq("same_letters('rat', 'car')", 'False'),
      t.hidden("same_letters('', '')", 'True'),
      t.hidden("same_letters('aab', 'abb')", 'False'),
      t.hidden("same_letters('ab', 'abc')", 'False'),
    ],
    hints: ['Two strings are rearrangements of each other exactly when their sorted characters match.'],
    explanation: 'Sorting costs O(n log n) versus O(n) for a frequency map, but it is a one-liner and easy to explain.',
    signature: 'sorting:anagram',
  }),
]

const keys = [
  choice({
    id: 'd9-key-len',
    title: 'What does key= do?',
    skills: ['sort_key'],
    prompt: 'What does `sorted(words, key=len)` sort by?',
    options: [
      'Alphabetical order, then length',
      'The length of each word, shortest first',
      'The length of each word, longest first',
      'It returns the lengths, sorted',
    ],
    answer: 1,
    note: '`key` is a function applied to each item; items are ordered by its result. The items themselves are returned, not the keys.',
    explanation: 'key=len means "compare len(w) instead of w". The result still contains the words.',
    signature: 'sort-key:recognize-len',
  }),
  output({
    id: 'd9-key-len-stable',
    title: 'Sorting by length, with ties',
    skills: ['sort_key'],
    prompt: 'Predict the output. Python sorting is **stable**: items with equal keys keep their original order.',
    code: `words = ['pear', 'fig', 'banana', 'kiwi']
print(sorted(words, key=len))
print(sorted(words, key=len, reverse=True))`,
    expectedOutput: `['fig', 'pear', 'kiwi', 'banana']
['banana', 'pear', 'kiwi', 'fig']`,
    explanation: "'pear' and 'kiwi' both have length 4, so they stay in input order, even with reverse=True.",
    minutes: 2,
    signature: 'trace:sort-key-len',
  }),
  output({
    id: 'd9-key-abs',
    title: 'Sorting by absolute value',
    skills: ['sort_key'],
    prompt: 'Predict the output.',
    code: `print(sorted([-4, 1, -2, 3], key=abs))`,
    expectedOutput: `[1, -2, 3, -4]`,
    explanation: 'Any one-argument function works as a key, including built-ins like abs.',
    minutes: 1,
    signature: 'trace:sort-key-abs',
  }),
  fill({
    id: 'd9-key-second',
    title: 'Sort pairs by the second item',
    skills: ['sort_key', 'tuples'],
    prompt: 'Fill the blank so the pairs are ordered by their number (the second item), smallest first.',
    starterCode: `pairs = [('a', 3), ('b', 1), ('c', 2)]
by_second = sorted(pairs, key=____)`,
    solution: `pairs = [('a', 3), ('b', 1), ('c', 2)]
by_second = sorted(pairs, key=lambda p: p[1])`,
    tests: [t.check('ordered by second item', "assert by_second == [('b', 1), ('c', 2), ('a', 3)]")],
    hints: ['A lambda that takes one pair and returns the part to compare.', 'lambda p: p[...]'],
    important: true,
    signature: 'sort-key:fill-second',
  }),
  code({
    id: 'd9-key-age-desc',
    title: 'Oldest first, in place',
    skills: ['sort_key', 'tuples'],
    stage: 'recall',
    difficulty: 2,
    minutes: 2.5,
    prompt: '`people` holds `(name, age)` tuples. Write one line that sorts `people` in place, oldest first.',
    starterCode: `people = [('ana', 31), ('ben', 19), ('cy', 45)]
# one line
`,
    solution: `people = [('ana', 31), ('ben', 19), ('cy', 45)]
people.sort(key=lambda p: p[1], reverse=True)`,
    tests: [t.check('oldest first', "assert people == [('cy', 45), ('ana', 31), ('ben', 19)]")],
    hints: ['.sort(key=..., reverse=True)'],
    signature: 'sort-key:one-line-inplace-second-desc',
  }),
  output({
    id: 'd9-key-tuple-trace',
    title: 'Tuple keys: descending score, then name',
    skills: ['sort_key', 'tuples'],
    prompt: 'Predict the output. The key returns a tuple; negating the score flips that part to descending.',
    code: `scores = [('ann', 90), ('bob', 85), ('cat', 90), ('dan', 70)]
ranked = sorted(scores, key=lambda p: (-p[1], p[0]))
for name, s in ranked:
    print(name, s)`,
    expectedOutput: `ann 90
cat 90
bob 85
dan 70`,
    note: 'key=lambda x: (primary, secondary). Negate a number to make just that part descending.',
    explanation: 'The tuple (-90, "ann") < (-90, "cat") < (-85, "bob"): highest score first, ties alphabetical.',
    important: true,
    minutes: 2,
    signature: 'trace:sort-key-tuple',
  }),
  code({
    id: 'd9-key-len-then-alpha',
    title: 'Shortest words first, ties alphabetical',
    skills: ['sort_key', 'tuples'],
    difficulty: 2,
    minutes: 4,
    prompt: 'Write `order_words(words)` that returns the words sorted by length (shortest first), with equal-length words in alphabetical order.',
    starterCode: `def order_words(words):
    pass`,
    solution: `def order_words(words):
    return sorted(words, key=lambda w: (len(w), w))`,
    tests: [
      t.eq("order_words(['pear', 'fig', 'kiwi', 'apple'])", "['fig', 'kiwi', 'pear', 'apple']"),
      t.eq('order_words([])', '[]'),
      t.hidden("order_words(['bb', 'a', 'ab', 'b'])", "['a', 'b', 'ab', 'bb']"),
    ],
    hints: ['Return a tuple from the key: the first thing to compare, then the tie-breaker.'],
    signature: 'sort-key:tuple-two-ascending',
  }),
  code({
    id: 'd9-key-dict-by-value',
    title: 'Dict keys by value, highest first',
    skills: ['sort_key', 'dict_items'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 5,
    prompt: '`counts` maps names to numbers. Write `by_value_desc(counts)` that returns the **keys** ordered by their value, largest first. Break ties alphabetically by key.',
    starterCode: `def by_value_desc(counts):
    pass`,
    solution: `def by_value_desc(counts):
    return sorted(counts, key=lambda name: (-counts[name], name))`,
    tests: [
      t.eq("by_value_desc({'a': 1, 'b': 5, 'c': 3})", "['b', 'c', 'a']"),
      t.eq('by_value_desc({})', '[]'),
      t.hidden("by_value_desc({'z': 2, 'y': 2, 'x': 9})", "['x', 'y', 'z']"),
    ],
    hints: ['Iterating (or sorting) a dict gives its keys.', 'The key function can look up counts[name].', 'Use (-counts[name], name) for "value descending, then key".'],
    important: true,
    signature: 'sort-key:dict-by-value',
  }),
  code({
    id: 'd9-key-distance',
    title: 'Points by distance from origin',
    skills: ['sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `by_distance(points)` that returns the `[x, y]` points sorted by distance from `(0, 0)`, closest first. You do not need a square root: comparing `x*x + y*y` gives the same order. Points at equal distance keep their input order.',
    starterCode: `def by_distance(points):
    pass`,
    solution: `def by_distance(points):
    return sorted(points, key=lambda p: p[0] * p[0] + p[1] * p[1])`,
    tests: [
      t.eq('by_distance([[3, 3], [1, 0], [-2, 1]])', '[[1, 0], [-2, 1], [3, 3]]'),
      t.eq('by_distance([])', '[]'),
      t.hidden('by_distance([[0, 2], [2, 0], [0, 0]])', '[[0, 0], [0, 2], [2, 0]]'),
    ],
    hints: ['The key computes a number from each point.', 'lambda p: p[0] * p[0] + p[1] * p[1]'],
    explanation: 'Squared distance preserves order and avoids floats. Sorting is stable, so ties stay in input order.',
    signature: 'sort-key:computed-distance',
  }),
]

const freqSort = [
  output({
    id: 'd9-freq-sort-trace',
    title: 'Count, then sort the counts',
    skills: ['frequency_map', 'sort_key', 'dict_items'],
    prompt: 'Predict the output.',
    code: `counts = {}
for ch in 'banana':
    counts[ch] = counts.get(ch, 0) + 1
print(counts)
print(sorted(counts.items(), key=lambda kv: kv[1], reverse=True))`,
    expectedOutput: `{'b': 1, 'a': 3, 'n': 2}
[('a', 3), ('n', 2), ('b', 1)]`,
    explanation: 'Dicts keep insertion order. `.items()` gives (key, value) pairs, and kv[1] sorts by the count.',
    minutes: 2,
    signature: 'trace:freq-then-sort',
  }),
  code({
    id: 'd9-freq-most-common',
    title: 'Most common character',
    skills: ['frequency_map', 'sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 6,
    prompt: 'Write `most_common(s)` that returns the character that appears most often in the non-empty string `s`. If several tie, return the alphabetically smallest of them.',
    starterCode: `def most_common(s):
    pass`,
    solution: `def most_common(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return min(counts, key=lambda ch: (-counts[ch], ch))`,
    tests: [
      t.eq("most_common('banana')", "'a'"),
      t.eq("most_common('z')", "'z'"),
      t.hidden("most_common('abab')", "'a'"),
      t.hidden("most_common('ccbbb')", "'b'"),
    ],
    hints: ['Build a frequency map first.', 'min and max accept key= just like sorted.', 'Smallest (-count, ch) is the most frequent, alphabetically first.'],
    explanation: 'min(..., key=...) avoids sorting the whole dict: O(n) instead of O(n log n).',
    signature: 'freq-sort:most-common',
  }),
  reorder({
    id: 'd9-freq-topk-reorder',
    title: 'Rebuild: top k by sorting',
    skills: ['frequency_map', 'sort_key', 'slicing'],
    prompt: 'Put the lines in order: `top_k_by_sort(nums, k)` returns the `k` most frequent values.',
    lines: [
      'def top_k_by_sort(nums, k):',
      '    counts = {}',
      '    for x in nums:',
      '        counts[x] = counts.get(x, 0) + 1',
      '    ordered = sorted(counts, key=lambda x: counts[x], reverse=True)',
      '    return ordered[:k]',
    ],
    tests: [
      t.eq('top_k_by_sort([4, 4, 4, 2, 2, 9], 2)', '[4, 2]', { compare: 'unordered' }),
      t.eq('top_k_by_sort([7], 1)', '[7]'),
    ],
    explanation: 'This sort-based version is O(n log n). The heap version later today brings it to O(n log k).',
    minutes: 4,
    important: true,
    signature: 'freq-sort:top-k-reorder',
  }),
  code({
    id: 'd9-freq-sort-chars',
    title: 'Rebuild a string by frequency',
    skills: ['frequency_map', 'sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 9,
    prompt: "Write `by_frequency(s)` that returns a string with the same characters as `s`, grouped so the most frequent character comes first. Ties go alphabetically. Example: `'tree'` gives `'eert'`.",
    starterCode: `def by_frequency(s):
    pass`,
    solution: `def by_frequency(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    order = sorted(counts, key=lambda ch: (-counts[ch], ch))
    return ''.join(ch * counts[ch] for ch in order)`,
    tests: [
      t.eq("by_frequency('tree')", "'eert'"),
      t.eq("by_frequency('')", "''"),
      t.hidden("by_frequency('cccaaa')", "'aaaccc'"),
      t.hidden("by_frequency('Aabb')", "'bbAa'"),
    ],
    hints: ['Count first, then decide the order of distinct characters.', 'Sort keys by (-count, char).', "Repeat a char with ch * n and join everything with ''.join."],
    signature: 'freq-sort:rebuild-string',
  }),
]

const heapBasics = [
  choice({
    id: 'd9-heap-min-root',
    title: 'What lives at heap[0]?',
    skills: ['heap_push_pop'],
    prompt: 'After any sequence of `heapq.heappush` calls on a list `h`, what is always true?',
    options: ['h is sorted ascending', 'h[0] is the smallest item', 'h[-1] is the largest item', 'h[0] is the most recently pushed item'],
    answer: 1,
    note: '`import heapq`. A heap is a plain list where h[0] is always the minimum. heappush and heappop are O(log n); peeking at h[0] is O(1).',
    explanation: 'heapq maintains the min-heap property: each parent is <= its children. Only h[0] is guaranteed; the rest is partially ordered.',
    important: true,
    signature: 'heap:recognize-min-root',
  }),
  output({
    id: 'd9-heap-push-trace',
    title: 'Pushing onto a heap',
    skills: ['heap_push_pop'],
    prompt: 'Predict the output.',
    code: `import heapq
h = []
for x in [5, 2, 8, 1]:
    heapq.heappush(h, x)
print(h[0])
print(len(h))`,
    expectedOutput: `1
4`,
    explanation: 'Peeking at h[0] does not remove it. len(h) still counts all four items.',
    signature: 'trace:heap-push-peek',
  }),
  output({
    id: 'd9-heap-heapify-pop',
    title: 'heapify, then pop',
    skills: ['heap_push_pop'],
    prompt: 'Predict the output.',
    code: `import heapq
h = [7, 3, 9, 1, 4]
heapq.heapify(h)
print(heapq.heappop(h))
print(heapq.heappop(h))
print(h[0])
print(len(h))`,
    expectedOutput: `1
3
4
3`,
    note: '`heapq.heapify(lst)` rearranges an existing list into a heap in place, in O(n). It returns None.',
    explanation: 'Each heappop removes and returns the current smallest, so pops come out in ascending order.',
    minutes: 2,
    signature: 'trace:heapify-pop',
  }),
  choice({
    id: 'd9-heap-not-sorted',
    title: 'Is a heap sorted?',
    skills: ['heap_push_pop'],
    prompt: 'What can you rely on after this runs?',
    code: `import heapq
h = [5, 4, 3, 2, 1]
heapq.heapify(h)`,
    options: ['h == [1, 2, 3, 4, 5]', 'h[0] == 1, and the rest is only partly ordered', 'h[-1] == 5', 'heapify returned a new sorted list'],
    answer: 1,
    explanation: 'Never index a heap beyond h[0] expecting sorted order. To get items in order, pop them.',
    signature: 'heap:recognize-partial-order',
  }),
  fill({
    id: 'd9-heap-fill-push-peek',
    title: 'Push, then peek',
    skills: ['heap_push_pop'],
    prompt: 'Fill both blanks: push every value onto `h`, then read the smallest without removing it.',
    starterCode: `import heapq
h = []
for x in [6, 2, 9]:
    heapq.____(h, x)
smallest = ____`,
    solution: `import heapq
h = []
for x in [6, 2, 9]:
    heapq.heappush(h, x)
smallest = h[0]`,
    tests: [t.check('all pushed', 'assert sorted(h) == [2, 6, 9]'), t.check('peeked', 'assert smallest == 2 and len(h) == 3')],
    hints: ['heappush(heap, item). Peek is plain indexing.'],
    important: true,
    signature: 'heap:fill-push-peek',
  }),
  code({
    id: 'd9-heap-smallest-k',
    title: 'k smallest by popping',
    skills: ['heap_push_pop'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `smallest_k(nums, k)` that returns the `k` smallest values in ascending order (assume `k <= len(nums)`). Copy `nums`, `heapify` the copy, then pop `k` times. Do not modify the input.',
    starterCode: `import heapq

def smallest_k(nums, k):
    pass`,
    solution: `import heapq

def smallest_k(nums, k):
    h = nums[:]
    heapq.heapify(h)
    out = []
    for _ in range(k):
        out.append(heapq.heappop(h))
    return out`,
    tests: [
      t.eq('smallest_k([5, 1, 4, 2], 2)', '[1, 2]'),
      t.eq('smallest_k([3], 0)', '[]'),
      t.hidden('smallest_k([2, 2, 1, 1], 3)', '[1, 1, 2]'),
      t.hidden('smallest_k([-5, 0, -9], 3)', '[-9, -5, 0]'),
      t.check('input unchanged', 's = [3, 1, 2]\nsmallest_k(s, 1)\nassert s == [3, 1, 2]', true),
    ],
    hints: ['nums[:] makes a copy.', 'heapify the copy, then heappop k times.'],
    signature: 'heap:pop-k-smallest',
  }),
  code({
    id: 'd9-heap-sort',
    title: 'Heap sort with push and pop',
    skills: ['heap_push_pop'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `heap_sort(nums)` that returns a new ascending list by pushing every value onto an empty heap, then popping until it is empty. No `sorted` or `.sort()`.',
    starterCode: `import heapq

def heap_sort(nums):
    pass`,
    solution: `import heapq

def heap_sort(nums):
    h = []
    for x in nums:
        heapq.heappush(h, x)
    out = []
    while h:
        out.append(heapq.heappop(h))
    return out`,
    tests: [
      t.eq('heap_sort([3, 1, 2])', '[1, 2, 3]'),
      t.eq('heap_sort([])', '[]'),
      t.hidden('heap_sort([5, -1, 5, 0])', '[-1, 0, 5, 5]'),
    ],
    hints: ['Two loops: one pushing, one popping while h is non-empty.'],
    explanation: 'n pushes and n pops at O(log n) each: O(n log n) total.',
    signature: 'heap:push-all-pop-all',
  }),
  output({
    id: 'd9-heap-tuples',
    title: 'Heap of (priority, name) tuples',
    skills: ['heap_push_pop', 'tuples'],
    prompt: 'Predict the output.',
    code: `import heapq
tasks = []
heapq.heappush(tasks, (2, 'email'))
heapq.heappush(tasks, (1, 'deploy'))
heapq.heappush(tasks, (2, 'call'))
while tasks:
    priority, name = heapq.heappop(tasks)
    print(priority, name)`,
    expectedOutput: `1 deploy
2 call
2 email`,
    note: 'Push tuples to order by the first item; later items break ties.',
    explanation: 'Tuples compare by priority first, then name, so (2, "call") pops before (2, "email").',
    important: true,
    minutes: 2,
    signature: 'trace:heap-tuples',
  }),
  code({
    id: 'd9-heap-run-order',
    title: 'Run tasks by priority',
    skills: ['heap_push_pop', 'tuples'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 7,
    prompt: '`tasks` is a list of `(priority, name)` tuples; a lower number runs first, and equal priorities run alphabetically. Write `run_order(tasks)` that returns the names in run order using a heap.',
    starterCode: `def run_order(tasks):
    pass`,
    solution: `import heapq

def run_order(tasks):
    h = list(tasks)
    heapq.heapify(h)
    order = []
    while h:
        _, name = heapq.heappop(h)
        order.append(name)
    return order`,
    tests: [
      t.eq("run_order([(3, 'c'), (1, 'a'), (2, 'b')])", "['a', 'b', 'c']"),
      t.eq('run_order([])', '[]'),
      t.hidden("run_order([(1, 'zed'), (1, 'amy'), (0, 'kit')])", "['kit', 'amy', 'zed']"),
    ],
    hints: ['Remember: nothing is pre-imported. You need import heapq.', 'Copy, heapify, pop while non-empty, keep only the name.'],
    signature: 'heap:priority-order',
  }),
]

const maxHeap = [
  choice({
    id: 'd9-maxheap-negate',
    title: 'Max-heap in Python',
    skills: ['heap_push_pop'],
    prompt: '`heapq` only gives a min-heap. How do you get the largest item out first?',
    options: [
      'heapq.heappush(h, x, reverse=True)',
      'Push -x, and negate again when you pop',
      'Use heapq.heappop(h[::-1])',
      'Pop from the end with h.pop()',
    ],
    answer: 1,
    note: 'Max-heap trick: heappush(h, -x); largest = -heappop(h).',
    explanation: 'Negating flips the order, so the most negative value (the original largest) sits at h[0].',
    important: true,
    signature: 'heap:recognize-negation',
  }),
  output({
    id: 'd9-maxheap-trace',
    title: 'Negation trace',
    skills: ['heap_push_pop'],
    prompt: 'Predict the output.',
    code: `import heapq
h = []
for x in [3, 10, 6]:
    heapq.heappush(h, -x)
print(h[0])
print(-h[0])
print(-heapq.heappop(h))
print(-heapq.heappop(h))`,
    expectedOutput: `-10
10
10
6`,
    explanation: 'The heap stores -10, -6, -3. h[0] is -10; negating it gives back the original maximum.',
    minutes: 2,
    signature: 'trace:max-heap-negation',
  }),
  fill({
    id: 'd9-maxheap-fill',
    title: 'Pop the largest',
    skills: ['heap_push_pop'],
    prompt: 'The heap stores negated values. Fill the blank so `largest` is the original largest number (11).',
    starterCode: `import heapq
h = [-x for x in [4, 11, 7]]
heapq.heapify(h)
largest = ____`,
    solution: `import heapq
h = [-x for x in [4, 11, 7]]
heapq.heapify(h)
largest = -heapq.heappop(h)`,
    tests: [t.check('largest restored', 'assert largest == 11'), t.check('popped', 'assert len(h) == 2')],
    hints: ['Pop, then undo the negation.'],
    signature: 'heap:fill-negated-pop',
  }),
  code({
    id: 'd9-maxheap-k-largest-desc',
    title: 'k largest, biggest first',
    skills: ['heap_push_pop'],
    difficulty: 2,
    minutes: 5,
    prompt: 'Write `largest_first(nums, k)` that returns the `k` largest values, biggest first, using a negated heap and `k` pops. Assume `k <= len(nums)`.',
    starterCode: `def largest_first(nums, k):
    pass`,
    solution: `import heapq

def largest_first(nums, k):
    h = [-x for x in nums]
    heapq.heapify(h)
    return [-heapq.heappop(h) for _ in range(k)]`,
    tests: [
      t.eq('largest_first([4, 9, 1, 7], 2)', '[9, 7]'),
      t.eq('largest_first([5], 1)', '[5]'),
      t.hidden('largest_first([2, 8, 8, 3], 3)', '[8, 8, 3]'),
      t.hidden('largest_first([-1, -7, -3], 2)', '[-1, -3]'),
    ],
    hints: ['Build the negated list with a comprehension, then heapify.', 'Negate each popped value back.'],
    signature: 'heap:negated-pop-k',
  }),
  code({
    id: 'd9-maxheap-smash',
    title: 'Smash the two heaviest',
    skills: ['heap_push_pop', 'while_loop'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 10,
    prompt: 'You have rocks with positive weights. Repeatedly take the two heaviest. If they weigh the same, both vanish. Otherwise the lighter vanishes and the heavier one goes back with weight `heavier - lighter`. Write `last_rock(weights)` returning the weight of the rock left at the end, or `0` if none are left.',
    starterCode: `def last_rock(weights):
    pass`,
    solution: `import heapq

def last_rock(weights):
    h = [-w for w in weights]
    heapq.heapify(h)
    while len(h) > 1:
        a = -heapq.heappop(h)
        b = -heapq.heappop(h)
        if a != b:
            heapq.heappush(h, -(a - b))
    return -h[0] if h else 0`,
    tests: [
      t.eq('last_rock([2, 7, 4, 1, 8, 1])', '1'),
      t.eq('last_rock([3])', '3'),
      t.hidden('last_rock([])', '0'),
      t.hidden('last_rock([5, 5])', '0'),
      t.hidden('last_rock([10, 4])', '6'),
    ],
    hints: [
      'You need the largest twice per round: that is a max-heap.',
      'Store negated weights.',
      'Pop two, negate back, push -(a - b) if they differ.',
      'Loop while len(h) > 1; return -h[0] if anything remains, else 0.',
    ],
    explanation: 'Each round is O(log n) and removes at least one rock, so O(n log n) total.',
    signature: 'heap:max-heap-simulation',
  }),
]

const topK = [
  choice({
    id: 'd9-topk-which-heap',
    title: 'Keeping the k largest',
    skills: ['top_k', 'heap_push_pop'],
    prompt: 'You scan numbers one by one and want to keep only the `k` largest seen so far, in a heap of size `k`. Which heap, and what do you pop when it grows to `k + 1`?',
    options: [
      'A max-heap; pop the largest',
      'A min-heap; pop the smallest',
      'A min-heap; pop the largest',
      'A max-heap; pop the smallest',
    ],
    answer: 1,
    note: 'Top-k largest: min-heap of size k. Push each x; if len(heap) > k: heappop. Then heap[0] is the k-th largest.',
    explanation: 'The min-heap root is the weakest of the current top k, exactly the one to evict. Each step costs O(log k).',
    important: true,
    signature: 'top-k:recognize-min-heap-size-k',
  }),
  output({
    id: 'd9-topk-trace',
    title: 'Size-k heap trace',
    skills: ['top_k', 'heap_push_pop'],
    prompt: 'Predict the output.',
    code: `import heapq
heap = []
k = 2
for x in [5, 1, 7, 3, 6]:
    heapq.heappush(heap, x)
    if len(heap) > k:
        heapq.heappop(heap)
print(sorted(heap))
print(heap[0])`,
    expectedOutput: `[6, 7]
6`,
    explanation: 'After each step the heap holds the 2 largest so far. heap[0] is the 2nd largest overall.',
    minutes: 2,
    signature: 'trace:top-k-heap',
  }),
  fill({
    id: 'd9-topk-fill-evict',
    title: 'Evict when the heap is too big',
    skills: ['top_k', 'heap_push_pop'],
    prompt: 'Fill the blank so `k_largest` returns the `k` largest values, biggest first.',
    starterCode: `import heapq

def k_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            ____
    return sorted(heap, reverse=True)`,
    solution: `import heapq

def k_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True)`,
    tests: [t.eq('k_largest([3, 9, 1, 8, 2], 3)', '[9, 8, 3]'), t.eq('k_largest([4], 1)', '[4]'), t.hidden('k_largest([5, 5, 1], 2)', '[5, 5]')],
    hints: ['Remove the smallest of the k + 1.'],
    signature: 'top-k:fill-evict',
  }),
  code({
    id: 'd9-topk-kth-by-sort',
    title: 'k-th largest, the sorting way',
    skills: ['sorting', 'list_index'],
    stage: 'recall',
    difficulty: 1,
    minutes: 2,
    prompt: 'Write `kth_by_sort(nums, k)` in one line: return the k-th largest value (k = 1 means the maximum). This is the baseline to mention before the heap version.',
    starterCode: `def kth_by_sort(nums, k):
    pass`,
    solution: `def kth_by_sort(nums, k):
    return sorted(nums, reverse=True)[k - 1]`,
    tests: [t.eq('kth_by_sort([3, 2, 1, 5, 6, 4], 2)', '5'), t.hidden('kth_by_sort([1], 1)', '1'), t.hidden('kth_by_sort([2, 2, 3], 3)', '2')],
    hints: ['Sort descending; k is 1-based, indexes are 0-based.'],
    signature: 'top-k:kth-by-sort',
  }),
  reorder({
    id: 'd9-topk-reorder',
    title: 'Rebuild: k-th largest with a heap',
    skills: ['top_k', 'heap_push_pop'],
    prompt: 'Put the lines in order: `kth_from_top(nums, k)` keeps a size-k min-heap and returns its root.',
    lines: [
      'import heapq',
      'def kth_from_top(nums, k):',
      '    heap = []',
      '    for x in nums:',
      '        heapq.heappush(heap, x)',
      '        if len(heap) > k:',
      '            heapq.heappop(heap)',
      '    return heap[0]',
    ],
    tests: [t.eq('kth_from_top([3, 2, 1, 5, 6, 4], 2)', '5'), t.eq('kth_from_top([7], 1)', '7')],
    minutes: 4,
    important: true,
    signature: 'top-k:reorder-kth',
  }),
  code({
    id: 'd9-topk-closest',
    title: 'k closest points',
    skills: ['top_k', 'heap_push_pop', 'tuples'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    minutes: 12,
    prompt: 'Write `k_closest(points, k)` that returns the `k` points `[x, y]` nearest to the origin, in any order. Use a heap of size `k`. Hint: you want to evict the **farthest**, so the heap must be a max-heap on distance.',
    starterCode: `def k_closest(points, k):
    pass`,
    solution: `import heapq

def k_closest(points, k):
    heap = []
    for x, y in points:
        heapq.heappush(heap, (-(x * x + y * y), x, y))
        if len(heap) > k:
            heapq.heappop(heap)
    return [[x, y] for _, x, y in heap]`,
    tests: [
      t.eq('k_closest([[1, 3], [-2, 2]], 1)', '[[-2, 2]]', { compare: 'unordered' }),
      t.eq('k_closest([[3, 3], [5, -1], [-2, 4]], 2)', '[[3, 3], [-2, 4]]', { compare: 'unordered' }),
      t.hidden('k_closest([[0, 1]], 1)', '[[0, 1]]', { compare: 'unordered' }),
      t.hidden('k_closest([[1, 1], [2, 2], [3, 3], [0, 0]], 3)', '[[0, 0], [1, 1], [2, 2]]', { compare: 'unordered' }),
    ],
    hints: [
      'Keep the k best; the one to throw out is the farthest.',
      'Push (-distance, x, y) so the farthest sits at heap[0].',
      'After pushing, if len(heap) > k, heappop.',
      'Unpack the remaining tuples back into [x, y] lists.',
    ],
    explanation: 'O(n log k) time, O(k) space. Negating the distance turns the min-heap into a max-heap on distance.',
    signature: 'top-k:k-closest',
  }),
  code({
    id: 'd9-topk-keys-by-count',
    title: 'Top k keys from a count dict',
    skills: ['top_k', 'heap_push_pop', 'dict_items'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: '`counts` maps items to how often they appear. Write `top_k_keys(counts, k)` returning the `k` keys with the highest counts, in any order, using a size-k heap of `(count, key)` tuples. The answer is unique in the tests.',
    starterCode: `def top_k_keys(counts, k):
    pass`,
    solution: `import heapq

def top_k_keys(counts, k):
    heap = []
    for key, c in counts.items():
        heapq.heappush(heap, (c, key))
        if len(heap) > k:
            heapq.heappop(heap)
    return [key for _, key in heap]`,
    tests: [
      t.eq("top_k_keys({'a': 5, 'b': 1, 'c': 3}, 2)", "['a', 'c']", { compare: 'unordered' }),
      t.eq("top_k_keys({'x': 2}, 1)", "['x']", { compare: 'unordered' }),
      t.hidden('top_k_keys({1: 10, 2: 20, 3: 30, 4: 40}, 3)', '[2, 3, 4]', { compare: 'unordered' }),
    ],
    hints: ['Loop over counts.items().', 'Push (count, key) so the heap orders by count.', 'Evict when len(heap) > k; return the keys.'],
    signature: 'top-k:keys-by-count',
  }),
  capstone({
    id: 'cap-kth-largest',
    title: 'K-th largest value',
    problemId: 'kth-largest',
    skills: ['heap_push_pop', 'top_k'],
    difficulty: 3,
    minutes: 25,
    prompt: "Given a list of integers `nums` and an integer `k` (`1 <= k <= len(nums)`), return the value that would be at position `k` if the list were sorted from largest to smallest. Duplicates count separately: in `[3, 3, 1]` the 2nd largest is `3`.\n\nAim for better than sorting the whole list.",
    starterCode: `def find_kth_largest(nums: List[int], k: int) -> int:
    pass`,
    solution: `import heapq

def find_kth_largest(nums: List[int], k: int) -> int:
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
    examples: [
      { input: 'nums = [3, 2, 1, 5, 6, 4], k = 2', output: '5' },
      { input: 'nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4', output: '4', note: 'Sorted descending: 6, 5, 5, 4, ...' },
      { input: 'nums = [7], k = 1', output: '7' },
    ],
    tests: [
      t.eq('find_kth_largest([3, 2, 1, 5, 6, 4], 2)', '5'),
      t.eq('find_kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4)', '4'),
      t.hidden('find_kth_largest([7], 1)', '7'),
      t.hidden('find_kth_largest([2, 1], 2)', '1'),
      t.hidden('find_kth_largest([-1, -5, -3], 1)', '-1'),
      t.hidden('find_kth_largest([4, 4, 4, 4], 3)', '4'),
      t.hidden('find_kth_largest([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10)', '1'),
      t.hidden('find_kth_largest([10, 9, 8, 7, 6], 1)', '10'),
    ],
    hints: [
      'You do not need the whole list in order, only the top k.',
      'A min-heap of size k: its root is the smallest of the k largest.',
      'Push each value; when len(heap) > k, heappop the smallest.',
      'After the loop, heap[0] is the answer. O(n log k) time, O(k) space.',
    ],
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    explanation: 'The size-k min-heap always holds the k largest values seen so far; its root is the weakest of them, which after the full scan is the k-th largest. Sorting would be O(n log n).',
    signature: 'capstone:kth-largest',
  }),
  explain({
    id: 'd9-explain-kth-largest',
    title: 'Explain: k-th largest',
    minutes: 5,
    skills: ['explanation', 'complexity', 'top_k'],
    prompt: 'Explain your k-th largest solution as you would to an interviewer: the baseline, the heap approach, the invariant, the complexity, and edge cases.',
    rubric: [
      'Mentions the sorting baseline: O(n log n)',
      'Min-heap of size k; pop when it exceeds k',
      'Invariant: heap holds the k largest seen so far, root is the k-th largest',
      'O(n log k) time, O(k) space',
      'Duplicates count separately; k = len(nums) returns the minimum',
    ],
    signature: 'explain:kth-largest',
  }),
  capstone({
    id: 'cap-top-k-frequent',
    title: 'Most frequent k values',
    problemId: 'top-k-frequent',
    skills: ['frequency_map', 'heap_push_pop', 'top_k', 'sort_key'],
    difficulty: 3,
    minutes: 30,
    prompt: 'Given a list of integers `nums` and an integer `k`, return the `k` values that occur most often. Return them in any order. You may assume the answer is unique (no tie at the cut-off).\n\nTry to do better than sorting every distinct value.',
    starterCode: `def top_k_frequent(nums: List[int], k: int) -> List[int]:
    pass`,
    solution: `import heapq

def top_k_frequent(nums: List[int], k: int) -> List[int]:
    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
    heap = []
    for x, c in counts.items():
        heapq.heappush(heap, (c, x))
        if len(heap) > k:
            heapq.heappop(heap)
    return [x for _, x in heap]`,
    examples: [
      { input: 'nums = [1, 1, 1, 2, 2, 3], k = 2', output: '[1, 2]' },
      { input: 'nums = [5], k = 1', output: '[5]' },
      { input: 'nums = [4, 4, -1, -1, -1, 7], k = 1', output: '[-1]' },
    ],
    tests: [
      t.eq('top_k_frequent([1, 1, 1, 2, 2, 3], 2)', '[1, 2]', { compare: 'unordered' }),
      t.eq('top_k_frequent([5], 1)', '[5]', { compare: 'unordered' }),
      t.eq('top_k_frequent([4, 4, -1, -1, -1, 7], 1)', '[-1]', { compare: 'unordered' }),
      t.hidden('top_k_frequent([1, 2], 2)', '[1, 2]', { compare: 'unordered' }),
      t.hidden('top_k_frequent([3, 0, 1, 0], 1)', '[0]', { compare: 'unordered' }),
      t.hidden('top_k_frequent([6, 6, 6, 5, 5, 4, 4, 4, 4], 2)', '[4, 6]', { compare: 'unordered' }),
      t.hidden('top_k_frequent([9, 9, 8, 8, 8, 7, 7, 7, 7, 1], 3)', '[7, 8, 9]', { compare: 'unordered' }),
      t.hidden('top_k_frequent([-2, -2, -3], 1)', '[-2]', { compare: 'unordered' }),
    ],
    hints: [
      'Two steps: how often does each value appear, then which k counts are biggest?',
      'A frequency dict, then a size-k heap (or a sort) over its items.',
      'Push (count, value); when len(heap) > k, heappop the least frequent.',
      'Count with .get, loop counts.items() pushing (c, x) and evicting, return the values left in the heap.',
    ],
    complexity: { time: 'O(n + m log k), m distinct values', space: 'O(m)' },
    explanation: 'Counting is O(n). A size-k min-heap keyed on count keeps the k most frequent while evicting the least frequent, so only O(log k) per distinct value. Sorting the distinct values by count is a fine O(m log m) alternative to mention.',
    signature: 'capstone:top-k-frequent',
  }),
  explain({
    id: 'd9-explain-top-k-frequent',
    title: 'Explain: top k frequent',
    minutes: 5,
    skills: ['explanation', 'complexity', 'frequency_map', 'top_k'],
    prompt: 'Explain your top-k-frequent solution out loud: the two phases, why a heap of size k, and the trade-off with sorting.',
    rubric: [
      'Phase 1: frequency map with .get in O(n)',
      'Phase 2: size-k min-heap of (count, value), evict the least frequent',
      'O(n + m log k) time vs O(m log m) for sorting the distinct values',
      'Output order does not matter; ties at the cut-off are excluded by the problem',
      'Edge cases: k equals the number of distinct values, single element',
    ],
    signature: 'explain:top-k-frequent',
  }),
]

const intervals = [
  choice({
    id: 'd9-iv-sort-start',
    title: 'Sorting intervals by start',
    skills: ['sort_key', 'interval_overlap'],
    prompt: '`intervals` is a list of `[start, end]` lists. Which line sorts it in place by start?',
    options: [
      'intervals.sort(key=lambda iv: iv[1])',
      'intervals.sort(key=lambda iv: iv[0])',
      'intervals = intervals.sort()',
      'sorted(intervals, key=start)',
    ],
    answer: 1,
    note: 'Interval problems almost always begin with intervals.sort(key=lambda iv: iv[0]).',
    explanation: 'iv[0] is the start. Plain intervals.sort() also works here because lists compare by first element, but the explicit key states your intent.',
    signature: 'interval:recognize-sort-start',
  }),
  output({
    id: 'd9-iv-sort-trace',
    title: 'Sorted intervals',
    skills: ['sort_key', 'interval_overlap'],
    prompt: 'Predict the output.',
    code: `intervals = [[5, 7], [1, 3], [2, 4]]
intervals.sort(key=lambda iv: iv[0])
print(intervals)
print(intervals[0][1])
print(intervals[-1])`,
    expectedOutput: `[[1, 3], [2, 4], [5, 7]]
3
[5, 7]`,
    signature: 'trace:interval-sort',
  }),
  choice({
    id: 'd9-iv-touching',
    title: 'Do they overlap?',
    skills: ['interval_overlap'],
    prompt: 'Intervals are sorted by start. The current merged interval is `[1, 4]` and the next is `[4, 6]`. Using the rule `next_start <= cur_end`, what happens?',
    options: ['They do not overlap; append [4, 6]', 'They overlap; the merged interval becomes [1, 6]', 'They overlap; the merged interval becomes [1, 4]', 'They overlap; the merged interval becomes [4, 6]'],
    answer: 1,
    note: 'Sorted by start, the next interval overlaps the current one when next_start <= cur_end. Touching endpoints count.',
    explanation: '4 <= 4, so they merge, and the end becomes max(4, 6) = 6.',
    important: true,
    signature: 'interval:recognize-overlap',
  }),
  code({
    id: 'd9-iv-overlaps-line',
    title: 'Overlap test in one line',
    skills: ['interval_overlap'],
    stage: 'recall',
    difficulty: 1,
    minutes: 2,
    prompt: '`cur` and `nxt` are `[start, end]` lists with `cur[0] <= nxt[0]`. Write `overlaps(cur, nxt)` in one line: `True` if they overlap (touching counts).',
    starterCode: `def overlaps(cur, nxt):
    pass`,
    solution: `def overlaps(cur, nxt):
    return nxt[0] <= cur[1]`,
    tests: [
      t.eq('overlaps([1, 4], [4, 6])', 'True'),
      t.eq('overlaps([1, 3], [5, 6])', 'False'),
      t.hidden('overlaps([1, 10], [2, 3])', 'True'),
      t.hidden('overlaps([0, 0], [1, 1])', 'False'),
    ],
    hints: ['Compare the next start with the current end.'],
    signature: 'interval:overlap-line',
  }),
  output({
    id: 'd9-iv-merge-trace',
    title: 'Trace the merge loop',
    skills: ['interval_overlap', 'list_index'],
    prompt: 'The intervals are already sorted by start. Predict the output.',
    code: `intervals = [[1, 3], [2, 6], [8, 10], [9, 9]]
merged = [intervals[0]]
for start, end in intervals[1:]:
    if start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])
    print(merged)`,
    expectedOutput: `[[1, 6]]
[[1, 6], [8, 10]]
[[1, 6], [8, 10]]`,
    explanation: '[9, 9] sits inside [8, 10]; max keeps the end at 10 instead of shrinking it to 9.',
    minutes: 3,
    important: true,
    signature: 'trace:interval-merge',
  }),
  fill({
    id: 'd9-iv-fill-max-end',
    title: 'Extend with the max end',
    skills: ['interval_overlap', 'list_index'],
    prompt: 'The input is sorted by start. Fill the blank that extends the last merged interval.',
    starterCode: `def merge_sorted(intervals):
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = ____
        else:
            merged.append([start, end])
    return merged`,
    solution: `def merge_sorted(intervals):
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    tests: [
      t.eq('merge_sorted([[1, 3], [2, 6], [8, 10]])', '[[1, 6], [8, 10]]'),
      t.eq('merge_sorted([[1, 10], [2, 3]])', '[[1, 10]]'),
      t.hidden('merge_sorted([])', '[]'),
    ],
    hints: ['A contained interval must not shrink the end.'],
    important: true,
    signature: 'interval:fill-max-end',
  }),
  choice({
    id: 'd9-iv-why-max',
    title: 'Why max()?',
    skills: ['interval_overlap'],
    prompt: 'Sorted input `[[1, 10], [2, 3]]`. What goes wrong if you write `merged[-1][1] = end` instead of `max(merged[-1][1], end)`?',
    options: ['Nothing, the result is the same', 'The merged interval shrinks to [1, 3]', 'It raises an IndexError', 'It produces [[1, 10], [2, 3]]'],
    answer: 1,
    explanation: 'A later interval can be fully inside the current one. Its end is smaller, so you must keep the larger end.',
    signature: 'interval:recognize-max-end',
  }),
  code({
    id: 'd9-iv-can-attend',
    title: 'Can one person attend every meeting?',
    skills: ['interval_overlap', 'sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 7,
    prompt: 'Meetings are `[start, end]` in any order. A meeting ending at 10 and another starting at 10 do **not** clash. Write `can_attend(meetings)` returning `True` if no two meetings clash.',
    starterCode: `def can_attend(meetings):
    pass`,
    solution: `def can_attend(meetings):
    ordered = sorted(meetings, key=lambda m: m[0])
    for i in range(1, len(ordered)):
        if ordered[i][0] < ordered[i - 1][1]:
            return False
    return True`,
    tests: [
      t.eq('can_attend([[0, 30], [5, 10], [15, 20]])', 'False'),
      t.eq('can_attend([[7, 10], [2, 4]])', 'True'),
      t.hidden('can_attend([])', 'True'),
      t.hidden('can_attend([[1, 5], [5, 8]])', 'True'),
      t.hidden('can_attend([[3, 4], [1, 2], [2, 3]])', 'True'),
      t.hidden('can_attend([[1, 4], [2, 3]])', 'False'),
    ],
    hints: ['Sort by start so only neighbours can clash.', 'Here touching is allowed, so the clash test is strict: start < previous end.'],
    explanation: 'After sorting, it is enough to compare each meeting with the one just before it. The strict < is the only change from the merge rule.',
    signature: 'interval:any-overlap',
  }),
  code({
    id: 'd9-iv-covered-length',
    title: 'Total length covered',
    skills: ['interval_overlap', 'sort_key', 'accumulator'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 10,
    prompt: 'Given `[start, end]` intervals in any order, write `covered(intervals)` returning the total length of the number line they cover. Overlapping parts count once. Example: `[[1, 4], [2, 6], [8, 9]]` covers `5 + 1 = 6`.',
    starterCode: `def covered(intervals):
    pass`,
    solution: `def covered(intervals):
    merged = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return sum(end - start for start, end in merged)`,
    tests: [
      t.eq('covered([[1, 4], [2, 6], [8, 9]])', '6'),
      t.eq('covered([])', '0'),
      t.hidden('covered([[5, 7], [1, 2]])', '3'),
      t.hidden('covered([[1, 10], [2, 3], [4, 5]])', '9'),
      t.hidden('covered([[0, 2], [2, 4]])', '4'),
    ],
    hints: ['Merge first, then measure.', 'Sort by start, extend with max end.', 'Sum end - start over the merged list.'],
    signature: 'interval:merge-then-sum',
  }),
  reorder({
    id: 'd9-iv-merge-reorder',
    title: 'Rebuild: merge intervals',
    skills: ['interval_overlap', 'sort_key'],
    prompt: 'Put the lines in order: `merge_all(intervals)` sorts by start and merges overlaps.',
    lines: [
      'def merge_all(intervals):',
      '    intervals = sorted(intervals, key=lambda iv: iv[0])',
      '    merged = []',
      '    for start, end in intervals:',
      '        if merged and start <= merged[-1][1]:',
      '            merged[-1][1] = max(merged[-1][1], end)',
      '        else:',
      '            merged.append([start, end])',
      '    return merged',
    ],
    tests: [t.eq('merge_all([[8, 10], [1, 3], [2, 6]])', '[[1, 6], [8, 10]]'), t.eq('merge_all([[1, 4], [4, 5]])', '[[1, 5]]')],
    minutes: 4,
    signature: 'interval:reorder-merge',
  }),
  capstone({
    id: 'cap-merge-intervals',
    title: 'Merge overlapping ranges',
    problemId: 'merge-intervals',
    skills: ['sort_key', 'interval_overlap', 'list_index'],
    difficulty: 3,
    minutes: 28,
    prompt: 'You get a list of ranges, each `[start, end]` with `start <= end`, in no particular order. Combine every group of ranges that overlap (ranges that only touch at an endpoint also combine) and return the resulting ranges sorted by start.',
    starterCode: `def merge(intervals: List[List[int]]) -> List[List[int]]:
    pass`,
    solution: `def merge(intervals: List[List[int]]) -> List[List[int]]:
    merged = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    examples: [
      { input: '[[1, 3], [2, 6], [8, 10], [15, 18]]', output: '[[1, 6], [8, 10], [15, 18]]' },
      { input: '[[1, 4], [4, 5]]', output: '[[1, 5]]', note: 'Touching ranges combine.' },
      { input: '[[6, 8], [1, 2]]', output: '[[1, 2], [6, 8]]', note: 'Input is not sorted.' },
    ],
    tests: [
      t.eq('merge([[1, 3], [2, 6], [8, 10], [15, 18]])', '[[1, 6], [8, 10], [15, 18]]'),
      t.eq('merge([[1, 4], [4, 5]])', '[[1, 5]]'),
      t.eq('merge([[6, 8], [1, 2]])', '[[1, 2], [6, 8]]'),
      t.hidden('merge([])', '[]'),
      t.hidden('merge([[5, 5]])', '[[5, 5]]'),
      t.hidden('merge([[1, 10], [2, 3], [4, 5]])', '[[1, 10]]'),
      t.hidden('merge([[2, 3], [4, 5], [6, 7], [1, 10]])', '[[1, 10]]'),
      t.hidden('merge([[1, 2], [3, 4]])', '[[1, 2], [3, 4]]'),
      t.hidden('merge([[-5, -1], [-3, 0], [2, 2]])', '[[-5, 0], [2, 2]]'),
    ],
    hints: [
      'Overlaps are easy to spot if neighbours in the list are neighbours on the number line.',
      'Sort by start, then keep a merged list and only compare with merged[-1].',
      'If start <= merged[-1][1], extend with max(merged[-1][1], end); otherwise append a new [start, end].',
      'sort, loop with unpacking, merge-or-append, return merged.',
    ],
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    explanation: 'After sorting by start, any interval that overlaps the current merged block must come right after it, so a single pass with the last merged interval is enough. max() handles intervals contained in the current block.',
    signature: 'capstone:merge-intervals',
  }),
  explain({
    id: 'd9-explain-merge-intervals',
    title: 'Explain: merge intervals',
    minutes: 5,
    skills: ['explanation', 'complexity', 'interval_overlap'],
    prompt: 'Explain your merge-intervals solution: why sort, the overlap rule, why max, complexity, edge cases.',
    rubric: [
      'Sort by start so overlapping intervals are adjacent',
      'Overlap when start <= last merged end (touching counts)',
      'Extend with max(end) because an interval can be contained in the current one',
      'O(n log n) for the sort, O(n) for the output',
      'Edge cases: empty input, single interval, unsorted input, nested intervals',
    ],
    signature: 'explain:merge-intervals',
  }),
]

const cold = [
  choice({
    id: 'd9-cold-topk-complexity',
    title: 'Cold: cost of a size-k heap',
    skills: ['top_k', 'complexity'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'You push all `n` values through a min-heap that you trim back to size `k` each step. What is the time complexity?',
    options: ['O(n)', 'O(n log n)', 'O(n log k)', 'O(k log n)'],
    answer: 2,
    explanation: 'Each push and pop works on a heap of at most k + 1 items: O(log k), done n times.',
    signature: 'cold:top-k-complexity',
  }),
  code({
    id: 'd9-cold-sort-second-desc',
    title: 'Cold: sort by second, descending',
    skills: ['sort_key', 'tuples'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 4,
    prompt: 'Write `rank_pairs(pairs)` that returns `(name, points)` pairs sorted by points, highest first; equal points ordered by name A to Z.',
    starterCode: `def rank_pairs(pairs):
    pass`,
    solution: `def rank_pairs(pairs):
    return sorted(pairs, key=lambda p: (-p[1], p[0]))`,
    tests: [
      t.eq("rank_pairs([('b', 2), ('a', 2), ('c', 5)])", "[('c', 5), ('a', 2), ('b', 2)]"),
      t.hidden('rank_pairs([])', '[]'),
      t.hidden("rank_pairs([('x', -1), ('y', 0)])", "[('y', 0), ('x', -1)]"),
    ],
    signature: 'cold:sort-key-tuple',
  }),
  code({
    id: 'd9-cold-kth-smallest',
    title: 'Cold: k-th smallest with a heap',
    skills: ['top_k', 'heap_push_pop'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 7,
    prompt: 'Write `kth_smallest(nums, k)` using a heap of size `k` (the mirror of k-th largest). Assume `1 <= k <= len(nums)`.',
    starterCode: `def kth_smallest(nums, k):
    pass`,
    solution: `import heapq

def kth_smallest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, -x)
        if len(heap) > k:
            heapq.heappop(heap)
    return -heap[0]`,
    tests: [
      t.eq('kth_smallest([7, 10, 4, 3, 20, 15], 3)', '7'),
      t.eq('kth_smallest([1], 1)', '1'),
      t.hidden('kth_smallest([5, 5, 1], 2)', '5'),
      t.hidden('kth_smallest([-2, -8, 0], 1)', '-8'),
    ],
    hints: ['To keep the k smallest you must evict the largest: a max-heap via negation.'],
    signature: 'cold:kth-smallest-heap',
  }),
  code({
    id: 'd9-cold-any-overlap',
    title: 'Cold: any overlap?',
    skills: ['interval_overlap', 'sort_key'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 6,
    prompt: 'Write `has_overlap(intervals)` returning `True` if any two `[start, end]` ranges overlap. Here touching endpoints **do** count as overlap. Input is unsorted.',
    starterCode: `def has_overlap(intervals):
    pass`,
    solution: `def has_overlap(intervals):
    ordered = sorted(intervals, key=lambda iv: iv[0])
    for i in range(1, len(ordered)):
        if ordered[i][0] <= ordered[i - 1][1]:
            return True
    return False`,
    tests: [
      t.eq('has_overlap([[5, 6], [1, 5]])', 'True'),
      t.eq('has_overlap([[1, 2], [3, 4]])', 'False'),
      t.hidden('has_overlap([])', 'False'),
      t.hidden('has_overlap([[1, 9], [10, 12], [2, 3]])', 'True'),
    ],
    signature: 'cold:interval-any-overlap',
  }),
  code({
    id: 'd9-cold-top-words',
    title: 'Cold: top k words, ordered',
    skills: ['frequency_map', 'sort_key'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 7,
    prompt: 'Write `top_words(words, k)` returning the `k` most frequent words, most frequent first; words with equal counts go alphabetically. Order matters here.',
    starterCode: `def top_words(words, k):
    pass`,
    solution: `def top_words(words, k):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    return sorted(counts, key=lambda w: (-counts[w], w))[:k]`,
    tests: [
      t.eq("top_words(['a', 'b', 'a', 'c', 'b', 'a'], 2)", "['a', 'b']"),
      t.eq("top_words(['x', 'y'], 2)", "['x', 'y']"),
      t.hidden("top_words(['b', 'a', 'b', 'a', 'c'], 3)", "['a', 'b', 'c']"),
      t.hidden('top_words([], 1)', '[]'),
    ],
    signature: 'cold:top-k-words-sorted',
  }),
]

export const day: DayModule = {
  date: '2026-10-09',
  short: 'Heaps',
  title: 'Heaps, sorting + intervals',
  focus: 'Make sorted/key=lambda, heapq push/pop/negation, size-k heaps and the interval merge loop automatic.',
  sections: [
    { id: 'd9-warmup', title: 'Warm-up', summary: 'Cold reps on dicts, pointers, windows, binary search, trees and graphs.', exercises: warmup },
    { id: 'd9-sorting', title: 'Sorting', summary: 'sorted() vs .sort(), reverse=True, how tuples compare.', exercises: sorting },
    { id: 'd9-keys', title: 'Sort keys', summary: 'key=lambda by length, by second item, by tuple.', exercises: keys },
    { id: 'd9-freq-sort', title: 'Frequency + sort', summary: 'Count with a dict, then order the counts.', exercises: freqSort },
    { id: 'd9-heapq', title: 'heapq', summary: 'heappush, heappop, heapify, heap[0], tuples in heaps.', exercises: heapBasics },
    { id: 'd9-max-heap', title: 'Max-heap', summary: 'Negate on the way in and out.', exercises: maxHeap },
    { id: 'd9-top-k', title: 'Top-k', summary: 'Size-k heaps, then the k-th largest and top-k frequent capstones.', exercises: topK },
    { id: 'd9-intervals', title: 'Intervals', summary: 'Sort by start, overlap test, extend with max end, then merge intervals.', exercises: intervals },
    { id: 'd9-cold', title: 'Cold reps', summary: 'From memory, no scaffolding.', exercises: cold },
  ],
  capstones: ['top-k-frequent', 'kth-largest', 'merge-intervals'],
}
