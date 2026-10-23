import type { DayModule } from '@/lib/types'
import { output, code, write, debug, capstone, explain, t } from '@/data/exercises/build'

// October 9: sorting with keys, heapq, top-k, intervals. Code-first: write, break, fix.

const warmup = [
  write({
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
  write({
    id: 'd9-warm-sorted-pair',
    title: 'Warm-up: pair in a sorted list',
    skills: ['two_pointer', 'pointer_update'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 6,
    prompt: "`nums` is sorted ascending. Write `pair_sum(nums, target)` that returns the **indexes** `[i, j]` (with `i < j`) of the first pair found by two pointers whose values add to `target`, or `[]` if none exists.",
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
  write({
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
  write({
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
  write({
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
  write({
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
  output({
    id: 'd9-sort-returns-none',
    title: 'What does .sort() return?',
    skills: ['sorting'],
    prompt: "Predict the three lines this prints. Watch what each sorting call hands back.",
    code: `nums = [3, 1, 2]
result = nums.sort()
print(result)
print(nums)
print(sorted([9, 7, 8]))`,
    expectedOutput: `None
[1, 2, 3]
[7, 8, 9]`,
    note: "`sorted(seq)` builds and returns a **new** list, smallest first (**ascending**), and leaves `seq` alone. `lst.sort()` sorts **in place**: it reorders `lst` itself and returns `None`. Both take `reverse=True` for largest first (**descending**).",
    explanation: '`.sort()` works in place and returns None. This is the most common sorting bug in interviews.',
    important: true,
    signature: 'trace:sort-returns-none',
  }),
  code({
    id: 'd9-sort-inplace-desc',
    title: 'Sort in place, largest first',
    skills: ['sorting'],
    stage: 'recall',
    difficulty: 1,
    minutes: 1.5,
    prompt: "`nums` is a list of numbers. Write one line that sorts `nums` **in place** from largest to smallest. In place means the list `nums` itself ends up reordered; you do not build a new list.",
    starterCode: `nums = [4, 1, 3, 1]
# one line: sort nums in place, largest first
`,
    solution: `nums = [4, 1, 3, 1]
nums.sort(reverse=True)`,
    tests: [t.check('nums sorted descending', 'assert nums == [4, 3, 1, 1]')],
    hints: ['`.sort()` takes the same `reverse=` keyword as `sorted`.'],
    signature: 'sorting:one-line-inplace-desc',
  }),
  write({
    id: 'd9-sort-second-largest',
    title: 'Second largest distinct value',
    skills: ['sorting', 'set_create'],
    difficulty: 2,
    minutes: 4,
    prompt: "`nums` is a list of integers. It may be empty and may contain repeats. Write `second_largest(nums)` that returns the second largest **distinct** value (repeats count once), or `None` if there are fewer than two distinct values.\n\n`[4, 1, 4, 3]` gives `3`. `[7, 7]` gives `None`. Use sorting.",
    starterCode: `def second_largest(nums):
    pass`,
    solution: `def second_largest(nums):
    distinct = sorted(set(nums), reverse=True)
    if len(distinct) < 2:
        return None
    return distinct[1]`,
    tests: [
      t.eq('second_largest([4, 1, 4, 3])', '3'),
      t.eq('second_largest([7, 7])', 'None'),
      t.hidden('second_largest([])', 'None'),
      t.hidden('second_largest([-1, -5])', '-5'),
    ],
    hints: ['Remove duplicates with set() first.', 'sorted() accepts any iterable, including a set, and returns a list.'],
    signature: 'sorting:second-largest-distinct',
  }),
  write({
    id: 'd9-sort-median',
    title: 'Median without touching the input',
    skills: ['sorting', 'list_index'],
    difficulty: 2,
    minutes: 5,
    prompt: "`nums` is a non-empty list of numbers in any order. Write `median(nums)`. Return the middle value once the numbers are sorted, or the average of the two middle values when the length is even. `[3, 1, 2]` gives `2`; `[4, 1, 3, 2]` gives `2.5`. Do not reorder the caller's list.",
    starterCode: `def median(nums):
    pass`,
    solution: `def median(nums):
    ordered = sorted(nums)
    n = len(ordered)
    mid = n // 2
    if n % 2 == 1:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2`,
    tests: [
      t.eq('median([3, 1, 2])', '2'),
      t.eq('median([4, 1, 3, 2])', '2.5'),
      t.hidden('median([5])', '5'),
      t.hidden('median([1, 1, 1, 9])', '1.0'),
      t.check('input unchanged', 's = [3, 1, 2]\nmedian(s)\nassert s == [3, 1, 2]', true),
    ],
    hints: ['sorted() gives you a copy to index into.', 'For even n the middle pair is at n // 2 - 1 and n // 2.'],
    signature: 'sorting:median',
  }),
  write({
    id: 'd9-sort-min-gap',
    title: 'Smallest gap between two values',
    skills: ['sorting', 'list_index'],
    difficulty: 2,
    minutes: 5,
    prompt: "`nums` is a list of at least two integers, in any order. Write `min_gap(nums)` returning the smallest difference between any two of its values (never negative). `[10, 3, 7, 1]` gives `2`, from 3 and 1.\n\nSort first: once the values are in order, the two closest values are always neighbours, so only neighbours need comparing.",
    starterCode: `def min_gap(nums):
    pass`,
    solution: `def min_gap(nums):
    ordered = sorted(nums)
    best = ordered[1] - ordered[0]
    for i in range(2, len(ordered)):
        best = min(best, ordered[i] - ordered[i - 1])
    return best`,
    tests: [
      t.eq('min_gap([10, 3, 7, 1])', '2'),
      t.eq('min_gap([5, 5])', '0'),
      t.hidden('min_gap([-4, 9, 0, 20])', '4'),
      t.hidden('min_gap([1, 100])', '99'),
    ],
    hints: ['Sort, then walk adjacent pairs i - 1, i.', 'Track the smallest difference seen.'],
    explanation: 'Sorting turns an O(n²) all-pairs check into one O(n) pass after an O(n log n) sort.',
    signature: 'sorting:min-adjacent-gap',
  }),
  debug({
    id: 'd9-sort-dbg-assign-none',
    title: 'Debug: consecutive run check',
    skills: ['sorting'],
    minutes: 3,
    prompt: "`nums` is a list of integers in any order. `is_consecutive(nums)` should return `True` when the values, put in order, form a run with no gaps or repeats (like `[6, 4, 5]`), otherwise `False`. It must not reorder the caller's list. Run it, read the error, fix it.",
    brokenCode: `def is_consecutive(nums):
    ordered = nums.sort()
    for i in range(1, len(ordered)):
        if ordered[i] != ordered[i - 1] + 1:
            return False
    return True`,
    solution: `def is_consecutive(nums):
    ordered = sorted(nums)
    for i in range(1, len(ordered)):
        if ordered[i] != ordered[i - 1] + 1:
            return False
    return True`,
    tests: [
      t.eq('is_consecutive([6, 4, 5])', 'True'),
      t.eq('is_consecutive([1, 2, 4])', 'False'),
      t.hidden('is_consecutive([])', 'True'),
      t.hidden('is_consecutive([2, 2, 3])', 'False'),
      t.check('input unchanged', 's = [3, 1, 2]\nis_consecutive(s)\nassert s == [3, 1, 2]', true),
    ],
    hints: ['What does the right-hand side of the first line evaluate to?'],
    explanation: '`.sort()` returns None, so `ordered` was None. `sorted(nums)` returns a new sorted list and leaves the input alone.',
    signature: 'debug:sort-returns-none',
  }),
  debug({
    id: 'd9-sort-dbg-discarded',
    title: 'Debug: duplicate check by sorting',
    skills: ['sorting'],
    minutes: 3,
    prompt: "`nums` is a list of numbers in any order. `has_duplicate(nums)` should return `True` if any value appears more than once, otherwise `False`. Its plan is to sort the values and then compare neighbours. It gives wrong answers. Fix it.",
    brokenCode: `def has_duplicate(nums):
    sorted(nums)
    for i in range(1, len(nums)):
        if nums[i] == nums[i - 1]:
            return True
    return False`,
    solution: `def has_duplicate(nums):
    nums = sorted(nums)
    for i in range(1, len(nums)):
        if nums[i] == nums[i - 1]:
            return True
    return False`,
    tests: [
      t.eq('has_duplicate([3, 1, 3])', 'True'),
      t.eq('has_duplicate([1, 2, 3])', 'False'),
      t.hidden('has_duplicate([])', 'False'),
      t.hidden('has_duplicate([5, 9, 2, 9, 1])', 'True'),
    ],
    hints: ['Where does the sorted list go?'],
    explanation: '`sorted()` returns a new list; calling it without keeping the result does nothing. Assign it.',
    signature: 'debug:sorted-discarded',
  }),
  write({
    id: 'd9-sort-group-anagrams',
    title: 'Group anagrams by sorted letters',
    skills: ['sorting', 'string_methods', 'dict_assign'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: "`words` is a list of strings. Two words are **anagrams** when one is a rearrangement of the other's letters, like `'eat'` and `'tea'`. Write `group_anagrams(words)` returning a list of groups (a list of lists), where each group holds the words that are anagrams of each other. Groups appear in the order their first word appears; words inside a group keep input order.\n\n`['eat', 'tea', 'tan', 'ate']` gives `[['eat', 'tea', 'ate'], ['tan']]`. An empty list gives `[]`.\n\nAnagrams have the same letters once those letters are sorted. `sorted('tea')` is the list `['a', 'e', 't']`, and `''.join(...)` glues it back into the string `'aet'`. Use `''.join(sorted(word))` as the dict key.",
    starterCode: `def group_anagrams(words):
    pass`,
    solution: `def group_anagrams(words):
    groups = {}
    for w in words:
        key = ''.join(sorted(w))
        if key not in groups:
            groups[key] = []
        groups[key].append(w)
    return list(groups.values())`,
    tests: [
      t.eq("group_anagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat'])", "[['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]"),
      t.eq('group_anagrams([])', '[]'),
      t.hidden("group_anagrams(['', 'a', ''])", "[['', ''], ['a']]"),
      t.hidden("group_anagrams(['ab', 'ba', 'abc'])", "[['ab', 'ba'], ['abc']]"),
    ],
    hints: ["sorted('tea') is ['a', 'e', 't']; join it back into a string so it can be a dict key.", 'Start an empty list the first time you see a key.'],
    explanation: 'Sorting the letters gives every anagram the same signature. Dicts keep insertion order, so groups come out in first-seen order.',
    signature: 'sorting:group-anagrams',
  }),
]

const keys = [
  output({
    id: 'd9-key-len-stable',
    title: 'Sorting by length, with ties',
    skills: ['sort_key'],
    prompt: "Predict the output. `key=len` means: compare the words by their length instead of by their letters. Python sorting is **stable**: items whose keys are equal keep their original order.",
    code: `words = ['pear', 'fig', 'banana', 'kiwi']
print(sorted(words, key=len))
print(sorted(words, key=len, reverse=True))`,
    expectedOutput: `['fig', 'pear', 'kiwi', 'banana']
['banana', 'pear', 'kiwi', 'fig']`,
    note: "`key=` takes a **key function**. Python calls it once on each item and orders the items by what it returns, but hands back the items themselves. `key=len` sorts by length. For anything custom write a `lambda`, a tiny unnamed function: `key=lambda w: w[-1]` means \"given `w`, compare by its last letter\".",
    explanation: "'pear' and 'kiwi' both have length 4, so they stay in input order, even with reverse=True.",
    minutes: 2,
    signature: 'trace:sort-key-len',
  }),
  output({
    id: 'd9-sort-tuples',
    title: 'How tuples sort',
    skills: ['sorting', 'tuples'],
    prompt: "`pairs` is a list of tuples. Predict the output.",
    code: `pairs = [(2, 'b'), (1, 'z'), (2, 'a')]
print(sorted(pairs))
print(max(pairs))`,
    expectedOutput: `[(1, 'z'), (2, 'a'), (2, 'b')]
(2, 'b')`,
    note: 'Tuples compare element by element: first items, and only on a tie the second items. So a key can return a tuple: `key=lambda p: (primary, tiebreak)`; negate a number to make just that part descending.',
    explanation: 'Tuples compare left to right. (2, "a") < (2, "b") because the first items tie and "a" < "b". This is why tuple keys and heaps of (priority, item) tuples work.',
    important: true,
    signature: 'trace:sort-tuples',
  }),
  code({
    id: 'd9-key-age-desc',
    title: 'Oldest first, in place',
    skills: ['sort_key', 'tuples'],
    stage: 'recall',
    difficulty: 2,
    minutes: 2.5,
    prompt: "`people` is a list of `(name, age)` tuples, so `p[1]` is one person's age. Write one line that sorts `people` in place (the list itself is reordered), oldest first.",
    starterCode: `people = [('ana', 31), ('ben', 19), ('cy', 45)]
# one line
`,
    solution: `people = [('ana', 31), ('ben', 19), ('cy', 45)]
people.sort(key=lambda p: p[1], reverse=True)`,
    tests: [t.check('oldest first', "assert people == [('cy', 45), ('ana', 31), ('ben', 19)]")],
    hints: ['.sort(key=lambda p: ..., reverse=True)'],
    important: true,
    signature: 'sort-key:one-line-inplace-second-desc',
  }),
  write({
    id: 'd9-key-len-then-alpha',
    title: 'Shortest words first, ties alphabetical',
    skills: ['sort_key', 'tuples'],
    difficulty: 2,
    minutes: 3,
    prompt: "`words` is a list of strings. Write `order_words(words)` that returns a new list with the words sorted by length (shortest first), and equal-length words in alphabetical order. `['pear', 'fig', 'kiwi']` gives `['fig', 'kiwi', 'pear']`.",
    note: "To sort by two things, make the key return a tuple: `key=lambda x: (main_thing, tie_breaker)`. Tuples are compared by their first items; the second items are only looked at when the first ones are equal.",
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
  write({
    id: 'd9-key-records',
    title: 'Names by age, then name',
    skills: ['sort_key', 'dict_lookup', 'list_comprehension'],
    difficulty: 2,
    minutes: 3.5,
    prompt: "`people` is a list of dicts like `{'name': 'ana', 'age': 31}`. Write `names_by_age(people)` that returns a list of just the names, youngest first; people of the same age go alphabetically by name.\n\ncy (40), bo (22), al (40) gives `['bo', 'al', 'cy']`. An empty list gives `[]`.",
    note: "To sort by two things, make the key return a tuple: `key=lambda x: (main_thing, tie_breaker)`. Tuples are compared by their first items; the second items are only looked at on a tie. To make just one numeric part go largest first, negate it: `(-score, name)`.",
    starterCode: `def names_by_age(people):
    pass`,
    solution: `def names_by_age(people):
    ordered = sorted(people, key=lambda p: (p['age'], p['name']))
    return [p['name'] for p in ordered]`,
    tests: [
      t.eq("names_by_age([{'name': 'cy', 'age': 40}, {'name': 'bo', 'age': 22}, {'name': 'al', 'age': 40}])", "['bo', 'al', 'cy']"),
      t.eq('names_by_age([])', '[]'),
      t.hidden("names_by_age([{'name': 'z', 'age': 1}])", "['z']"),
    ],
    hints: ["The key can read dict fields: lambda p: (p['age'], p['name']).", 'Sort the dicts, then pull out the names with a comprehension.'],
    signature: 'sort-key:records-then-project',
  }),
  write({
    id: 'd9-key-distance',
    title: 'Points by distance, with a named key',
    skills: ['sort_key', 'functions'],
    difficulty: 2,
    minutes: 4,
    prompt: "`points` is a list of `[x, y]` pairs. Write `by_distance(points)` that returns the points sorted by distance from `(0, 0)`, closest first. Compare by `x*x + y*y` (the squared distance: it orders points the same way the real distance does, with no square root). `[[3, 3], [1, 0], [-2, 1]]` gives `[[1, 0], [-2, 1], [3, 3]]`.\n\nThis time define a small helper `dist(p)` inside the function that returns `x*x + y*y`, and pass it as `key=dist` (no lambda). Equal distances keep input order.",
    starterCode: `def by_distance(points):
    pass`,
    solution: `def by_distance(points):
    def dist(p):
        return p[0] * p[0] + p[1] * p[1]
    return sorted(points, key=dist)`,
    tests: [
      t.eq('by_distance([[3, 3], [1, 0], [-2, 1]])', '[[1, 0], [-2, 1], [3, 3]]'),
      t.eq('by_distance([])', '[]'),
      t.hidden('by_distance([[0, 2], [2, 0], [0, 0]])', '[[0, 0], [0, 2], [2, 0]]'),
    ],
    hints: ['key= takes any one-argument function, not just a lambda.', 'Pass the function itself: key=dist, not key=dist(p).'],
    explanation: 'Squared distance preserves order and avoids floats. Sorting is stable, so ties stay in input order.',
    signature: 'sort-key:named-key-function',
  }),
  code({
    id: 'd9-key-dict-by-value',
    title: 'Dict keys by value, highest first',
    skills: ['sort_key', 'dict_items'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 3.5,
    prompt: "`counts` is a dict mapping names (strings) to numbers. Write `by_value_desc(counts)` that returns a list of the **keys** ordered by their value, largest value first. Break ties alphabetically by key. `{'a': 1, 'b': 5, 'c': 3}` gives `['b', 'c', 'a']`.",
    note: "Sorting a dict sorts its keys. In a tuple key, negate a number to make just that part go largest first: `(-value, name)` is \"value descending, then name ascending\".",
    starterCode: `def by_value_desc(counts):
    pass`,
    solution: `def by_value_desc(counts):
    return sorted(counts, key=lambda name: (-counts[name], name))`,
    tests: [
      t.eq("by_value_desc({'a': 1, 'b': 5, 'c': 3})", "['b', 'c', 'a']"),
      t.eq('by_value_desc({})', '[]'),
      t.hidden("by_value_desc({'z': 2, 'y': 2, 'x': 9})", "['x', 'y', 'z']"),
    ],
    hints: ['Sorting a dict gives its keys.', 'The key function can look up counts[name].', 'Use (-counts[name], name) for "value descending, then key".'],
    important: true,
    signature: 'sort-key:dict-by-value',
  }),
  debug({
    id: 'd9-key-dbg-wrong-index',
    title: 'Debug: rank by score',
    skills: ['sort_key', 'tuples'],
    minutes: 3,
    prompt: "`results` is a list of `(name, score)` tuples. `by_score(results)` should return a list of the names ordered by score, lowest score first: `[('zed', 1), ('amy', 9), ('kim', 5)]` gives `['zed', 'kim', 'amy']`. Fix it.",
    brokenCode: `def by_score(results):
    ordered = sorted(results, key=lambda r: r[0])
    return [name for name, score in ordered]`,
    solution: `def by_score(results):
    ordered = sorted(results, key=lambda r: r[1])
    return [name for name, score in ordered]`,
    tests: [
      t.eq("by_score([('zed', 1), ('amy', 9), ('kim', 5)])", "['zed', 'kim', 'amy']"),
      t.eq('by_score([])', '[]'),
      t.hidden("by_score([('b', -2), ('a', 3)])", "['b', 'a']"),
    ],
    hints: ['Which part of each pair is the key comparing?'],
    signature: 'debug:sort-key-wrong-index',
  }),
  debug({
    id: 'd9-key-dbg-reverse-ties',
    title: 'Debug: leaderboard ties',
    skills: ['sort_key', 'tuples'],
    minutes: 3.5,
    prompt: "`scores` is a list of `(name, points)` tuples. `leaderboard(scores)` should return the same tuples, highest points first; players with equal points must be listed A to Z. `[('bo', 5), ('al', 5), ('cy', 9)]` gives `[('cy', 9), ('al', 5), ('bo', 5)]`. Fix it.",
    brokenCode: `def leaderboard(scores):
    return sorted(scores, key=lambda p: (p[1], p[0]), reverse=True)`,
    solution: `def leaderboard(scores):
    return sorted(scores, key=lambda p: (-p[1], p[0]))`,
    tests: [
      t.eq("leaderboard([('bo', 5), ('al', 5), ('cy', 9)])", "[('cy', 9), ('al', 5), ('bo', 5)]"),
      t.eq('leaderboard([])', '[]'),
      t.hidden("leaderboard([('x', 1), ('w', 1), ('v', 1)])", "[('v', 1), ('w', 1), ('x', 1)]"),
    ],
    hints: ['reverse=True flips every part of the tuple, including the tie-breaker.', 'Make only the points descending.'],
    explanation: 'reverse=True reverses the whole comparison. To mix directions, negate the numeric part of the key and leave reverse off.',
    signature: 'debug:sort-key-reverse-ties',
  }),
]

const freqSort = [
  write({
    id: 'd9-freq-most-common',
    title: 'Most common character',
    skills: ['frequency_map', 'sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 5,
    prompt: "`s` is a non-empty string. Write `most_common(s)` that returns the character that appears most often in `s`. If several tie, return the alphabetically smallest of them. `'banana'` gives `'a'`; `'abab'` gives `'a'`.",
    note: "`min` and `max` take `key=` just like `sorted`: `max(words, key=len)` is the longest word. In a tuple key, negate a number to flip just that part: the smallest `(-count, ch)` belongs to the highest count, and among equal counts to the earliest letter.",
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
  write({
    id: 'd9-freq-topk-by-sort',
    title: 'Top k by sorting the counts',
    skills: ['frequency_map', 'sort_key', 'slicing'],
    difficulty: 2,
    minutes: 5,
    prompt: "`nums` is a list of integers and `k` is at most the number of distinct values. Write `top_k_by_sort(nums, k)` returning a list of the `k` most frequent values, most frequent first (no two values have the same count in the tests). `top_k_by_sort([4, 4, 4, 2, 2, 9], 2)` gives `[4, 2]`.\n\nCount with a dict, then sort its keys by count. This is the simple O(n log n) way; a faster tool for the same job comes later today.",
    starterCode: `def top_k_by_sort(nums, k):
    pass`,
    solution: `def top_k_by_sort(nums, k):
    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
    ordered = sorted(counts, key=lambda x: counts[x], reverse=True)
    return ordered[:k]`,
    tests: [
      t.eq('top_k_by_sort([4, 4, 4, 2, 2, 9], 2)', '[4, 2]'),
      t.eq('top_k_by_sort([7], 1)', '[7]'),
      t.hidden('top_k_by_sort([1, 2, 2, 3, 3, 3], 3)', '[3, 2, 1]'),
      t.hidden('top_k_by_sort([], 0)', '[]'),
    ],
    hints: ['Two phases: count, then order the distinct values.', 'sorted(counts, key=lambda x: counts[x], reverse=True)'],
    important: true,
    signature: 'freq-sort:top-k-by-sort',
  }),
  debug({
    id: 'd9-freq-dbg-pairs',
    title: 'Debug: most frequent values',
    skills: ['frequency_map', 'sort_key', 'dict_items'],
    minutes: 3.5,
    prompt: "`nums` is a list of integers. `most_frequent(nums, k)` should return a list of the `k` most frequent **values**, most frequent first: `most_frequent([4, 4, 4, 2, 2, 9], 2)` should give `[4, 2]`. Fix it.",
    brokenCode: `def most_frequent(nums, k):
    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    return ordered[:k]`,
    solution: `def most_frequent(nums, k):
    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    return [x for x, c in ordered[:k]]`,
    tests: [
      t.eq('most_frequent([4, 4, 4, 2, 2, 9], 2)', '[4, 2]'),
      t.eq('most_frequent([8], 1)', '[8]'),
      t.hidden('most_frequent([1, 3, 3], 1)', '[3]'),
    ],
    hints: ['Look at what .items() gives you, and what the caller wants back.'],
    signature: 'debug:freq-sort-returns-pairs',
  }),
  write({
    id: 'd9-freq-sort-chars',
    title: 'Rebuild a string by frequency',
    skills: ['frequency_map', 'sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: "`s` is a string (it may be empty). Write `by_frequency(s)` that returns a string with the same characters as `s`, regrouped so all copies of the most frequent character come first, then the next most frequent, and so on. Characters with equal counts go in plain string order, where capitals come before lowercase (`'A' < 'a'`).\n\n`'tree'` gives `'eert'`. `''` gives `''`.",
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
  output({
    id: 'd9-heap-push-trace',
    title: 'Pushing onto a heap',
    skills: ['heap_push_pop'],
    prompt: "Predict the output. `h` is an ordinary list that `heapq` keeps arranged as a **heap**: the smallest value is always at `h[0]`. `heappush` adds a value; `heappop` removes and returns the smallest one.",
    code: `import heapq
h = []
for x in [5, 2, 8, 1]:
    heapq.heappush(h, x)
print(h[0])
print(heapq.heappop(h))
print(heapq.heappop(h))
print(len(h))`,
    expectedOutput: `1
1
2
2`,
    note: "`import heapq`. A **heap** is a plain list kept arranged so its smallest item is always at index 0 (that makes it a **min-heap**); the rest is only partly ordered. `heapq.heappush(h, x)` adds `x`. `heapq.heappop(h)` removes and returns the smallest. Both cost O(log n); `h[0]` peeks in O(1). `heapq.heapify(lst)` rearranges an existing list into a heap in place and returns `None`.",
    explanation: 'h[0] peeks without removing. Each heappop removes the current smallest, so pops come out in ascending order.',
    important: true,
    signature: 'trace:heap-push-pop',
  }),
  write({
    id: 'd9-heap-smallest-k',
    title: 'k smallest by popping',
    skills: ['heap_push_pop'],
    difficulty: 2,
    minutes: 5,
    prompt: "`nums` is a list of numbers in any order and `0 <= k <= len(nums)`. Write `smallest_k(nums, k)` that returns a list of the `k` smallest values in ascending order. `smallest_k([5, 1, 4, 2], 2)` gives `[1, 2]`.\n\n`heapq.heapify(lst)` turns an existing list into a heap in place (it returns `None`). Copy `nums`, `heapify` the copy, then pop `k` times. Do not modify the input.",
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
    hints: ['nums[:] makes a copy.', 'heapify the copy (it returns None), then heappop k times.'],
    signature: 'heap:pop-k-smallest',
  }),
  write({
    id: 'd9-heap-sort',
    title: 'Heap sort with push and pop',
    skills: ['heap_push_pop'],
    difficulty: 2,
    minutes: 5,
    prompt: "`nums` is a list of numbers. Write `heap_sort(nums)` that returns a new ascending list by pushing every value onto an empty heap, then popping until the heap is empty. No `sorted` or `.sort()`. Nothing is pre-imported, so write `import heapq` yourself.",
    starterCode: `def heap_sort(nums):
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
    hints: ['import heapq first.', 'Two loops: one pushing, one popping while h is non-empty.'],
    explanation: 'n pushes and n pops at O(log n) each: O(n log n) total.',
    signature: 'heap:push-all-pop-all',
  }),
  write({
    id: 'd9-heap-ropes',
    title: 'Join ropes as cheaply as possible',
    skills: ['heap_push_pop', 'while_loop'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: "`lengths` is a list of positive integers, one per rope. Joining two ropes of lengths `a` and `b` costs `a + b` and leaves one rope of length `a + b`, which can be joined again. Write `join_cost(lengths)` returning the cheapest total cost to join all the ropes into one. Always joining the two shortest ropes is optimal. One rope or none costs `0`.\n\n`[4, 3, 2, 6]` gives `29`: join 2 + 3 (cost 5), then 4 + 5 (cost 9), then 6 + 9 (cost 15).\n\nNothing is pre-imported.",
    starterCode: `def join_cost(lengths):
    pass`,
    solution: `import heapq

def join_cost(lengths):
    h = list(lengths)
    heapq.heapify(h)
    total = 0
    while len(h) > 1:
        a = heapq.heappop(h)
        b = heapq.heappop(h)
        total += a + b
        heapq.heappush(h, a + b)
    return total`,
    tests: [
      t.eq('join_cost([4, 3, 2, 6])', '29'),
      t.eq('join_cost([5])', '0'),
      t.hidden('join_cost([])', '0'),
      t.hidden('join_cost([1, 1, 1, 1])', '8'),
      t.hidden('join_cost([10, 1])', '11'),
    ],
    hints: ['You repeatedly need the two smallest: a min-heap.', 'Pop two, add their sum to the total, push the sum back.', 'Stop when one rope is left: while len(h) > 1.'],
    explanation: 'Each round is O(log n) and removes one rope, so O(n log n) total.',
    signature: 'heap:min-heap-simulation',
  }),
  write({
    id: 'd9-heap-run-order',
    title: 'Run tasks by priority',
    skills: ['heap_push_pop', 'tuples'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 6,
    prompt: "`tasks` is a list of `(priority, name)` tuples; a lower priority number runs first, and equal priorities run alphabetically by name. Write `run_order(tasks)` that returns a list of the names in run order, using a heap. Tuples in a heap compare like tuples anywhere else: by the first item, then by the second on a tie.\n\n`[(3, 'c'), (1, 'a'), (2, 'b')]` gives `['a', 'b', 'c']`. Nothing is pre-imported.",
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
  debug({
    id: 'd9-heap-dbg-slice',
    title: 'Debug: three smallest',
    skills: ['heap_push_pop'],
    minutes: 3,
    prompt: "`nums` is a list of at least three numbers. `three_smallest(nums)` should return a list of the three smallest values in ascending order, without changing `nums`. Fix it.",
    brokenCode: `import heapq

def three_smallest(nums):
    h = nums[:]
    heapq.heapify(h)
    return h[:3]`,
    solution: `import heapq

def three_smallest(nums):
    h = nums[:]
    heapq.heapify(h)
    return [heapq.heappop(h) for _ in range(3)]`,
    tests: [
      t.eq('three_smallest([1, 5, 2, 6, 7, 3, 4])', '[1, 2, 3]'),
      t.eq('three_smallest([5, 4, 3, 2, 1])', '[1, 2, 3]'),
      t.hidden('three_smallest([9, 9, 9])', '[9, 9, 9]'),
    ],
    hints: ['Which positions of a heap are guaranteed to be in order?'],
    explanation: 'Only h[0] is guaranteed. A heap is not a sorted list; to read items in order you pop them.',
    signature: 'debug:heap-not-sorted',
  }),
]

const maxHeap = [
  output({
    id: 'd9-maxheap-trace',
    title: 'Negation trace',
    skills: ['heap_push_pop'],
    prompt: "Predict the output. Every value is pushed **negated**, so the largest original value becomes the smallest thing in the heap.",
    code: `import heapq
h = []
for x in [3, 10, 6]:
    heapq.heappush(h, -x)
print(h[0])
print(-heapq.heappop(h))
print(-heapq.heappop(h))`,
    expectedOutput: `-10
10
6`,
    note: "`heapq` only makes min-heaps: the smallest comes out first. To get the **largest** first (a max-heap), store every value negated. The biggest number becomes the most negative one, so it sits at `h[0]`. Push `-x`, and negate again when you pop: `largest = -heapq.heappop(h)`.",
    explanation: 'The heap stores -10, -6, -3. h[0] is -10; negating it gives back the original maximum.',
    important: true,
    minutes: 2,
    signature: 'trace:max-heap-negation',
  }),
  write({
    id: 'd9-maxheap-k-largest-desc',
    title: 'k largest, biggest first',
    skills: ['heap_push_pop'],
    difficulty: 2,
    minutes: 5,
    prompt: "`nums` is a list of numbers and `k <= len(nums)`. Write `largest_first(nums, k)` that returns a list of the `k` largest values, biggest first. `largest_first([4, 9, 1, 7], 2)` gives `[9, 7]`.\n\n`heapq` pops the smallest, so store every value negated (`-x`): then the biggest original value is the one popped first. Pop `k` times and negate each value back. Nothing is pre-imported.",
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
    important: true,
    signature: 'heap:negated-pop-k',
  }),
  debug({
    id: 'd9-maxheap-dbg-no-negate',
    title: 'Debug: heaviest items',
    skills: ['heap_push_pop', 'tuples'],
    minutes: 4,
    prompt: "`items` is a list of `(weight, name)` tuples. `heaviest(items, k)` should return a list of the names of the `k` heaviest items, heaviest first: with a box (3), a piano (9) and a desk (5), `k = 2` gives `['piano', 'desk']`. Fix it.",
    brokenCode: `import heapq

def heaviest(items, k):
    h = []
    for weight, name in items:
        heapq.heappush(h, (weight, name))
    out = []
    for _ in range(k):
        weight, name = heapq.heappop(h)
        out.append(name)
    return out`,
    solution: `import heapq

def heaviest(items, k):
    h = []
    for weight, name in items:
        heapq.heappush(h, (-weight, name))
    out = []
    for _ in range(k):
        weight, name = heapq.heappop(h)
        out.append(name)
    return out`,
    tests: [
      t.eq("heaviest([(3, 'box'), (9, 'piano'), (5, 'desk')], 2)", "['piano', 'desk']"),
      t.eq("heaviest([(1, 'pen')], 1)", "['pen']"),
      t.hidden("heaviest([(2, 'a'), (8, 'b'), (4, 'c'), (6, 'd')], 3)", "['b', 'd', 'c']"),
    ],
    hints: ['heapq always pops the smallest. What do you want popped first?'],
    explanation: 'Negating the priority turns the min-heap into a max-heap on weight. Only the name is used afterwards, so nothing needs un-negating.',
    signature: 'debug:max-heap-without-negation',
  }),
  write({
    id: 'd9-maxheap-smash',
    title: 'Smash the two heaviest',
    skills: ['heap_push_pop', 'while_loop'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 9,
    prompt: "`weights` is a list of positive integers, one per rock (it may be empty). Repeatedly take the two heaviest rocks. If they weigh the same, both vanish. Otherwise the lighter one vanishes and the heavier one goes back with weight `heavier - lighter`. Write `last_rock(weights)` returning the weight of the rock left at the end, or `0` if none are left.\n\n`[10, 4]` gives `6`. `[5, 5]` gives `0`. Nothing is pre-imported.",
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
    explanation: 'Same shape as joining ropes, mirrored: a max-heap via negation. Each round is O(log n) and removes at least one rock.',
    signature: 'heap:max-heap-simulation',
  }),
]

const topK = [
  output({
    id: 'd9-topk-trace',
    title: 'Size-k heap trace',
    skills: ['top_k', 'heap_push_pop'],
    prompt: "Predict the output. The heap is never allowed to keep more than `k` values: whenever it holds more, the smallest one is popped.",
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
    note: "A **size-k heap** keeps only the k largest values seen so far. Use a min-heap: push each x, and if `len(heap) > k`, `heappop`. That throws out the smallest, the one value that cannot be in the top k. What survives is the k largest, and the root `heap[0]` is the smallest of them: the **k-th largest**. O(n log k).",
    explanation: 'After each step the heap holds the 2 largest so far. heap[0] is the 2nd largest overall.',
    important: true,
    minutes: 2,
    signature: 'trace:top-k-heap',
  }),
  code({
    id: 'd9-topk-kth-by-sort',
    title: 'k-th largest, the sorting way',
    skills: ['sorting', 'list_index'],
    stage: 'recall',
    difficulty: 1,
    minutes: 2,
    prompt: "`nums` is a non-empty list of numbers and `1 <= k <= len(nums)`. The **k-th largest** is the value at position `k` when the list is written largest first: `k = 1` is the maximum, `k = 2` the next one down. Repeats each take a position: in `[2, 2, 3]` the 2nd and the 3rd largest are both `2`.\n\nWrite `kth_by_sort(nums, k)` in one line, by sorting. This O(n log n) version is the baseline to mention before the heap version.",
    starterCode: `def kth_by_sort(nums, k):
    pass`,
    solution: `def kth_by_sort(nums, k):
    return sorted(nums, reverse=True)[k - 1]`,
    tests: [t.eq('kth_by_sort([3, 2, 1, 5, 6, 4], 2)', '5'), t.hidden('kth_by_sort([1], 1)', '1'), t.hidden('kth_by_sort([2, 2, 3], 3)', '2')],
    hints: ['Sort descending; k is 1-based, indexes are 0-based.'],
    signature: 'top-k:kth-by-sort',
  }),
  write({
    id: 'd9-topk-optimize',
    title: 'Optimize: sort everything → size-k heap',
    skills: ['top_k', 'heap_push_pop'],
    style: 'optimize',
    difficulty: 3,
    minutes: 5,
    prompt: 'This works but sorts all `n` values: O(n log n). Rewrite `k_largest(nums, k)` so it keeps a min-heap of at most `k` items while scanning: O(n log k). Return the `k` largest values in any order. No `sorted` allowed (a test checks).',
    starterCode: `def k_largest(nums, k):
    return sorted(nums, reverse=True)[:k]`,
    solution: `import heapq

def k_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap`,
    tests: [
      t.eq('k_largest([3, 9, 1, 8, 2], 3)', '[9, 8, 3]', { compare: 'unordered' }),
      t.eq('k_largest([4], 1)', '[4]', { compare: 'unordered' }),
      t.hidden('k_largest([5, 5, 1], 2)', '[5, 5]', { compare: 'unordered' }),
      t.check(
        'no full sort',
        "def sorted(*args, **kwargs):\n    raise AssertionError('no full sort: keep a heap of size k')\ntry:\n    assert len(k_largest([5, 1, 9, 3, 7], 2)) == 2\nfinally:\n    del sorted",
      ),
    ],
    hints: ['Push every value; the moment the heap holds k + 1, pop the smallest.', 'What is left is the k largest.'],
    explanation: 'Each push and pop works on at most k + 1 items: O(log k), n times. With k much smaller than n, that beats sorting.',
    signature: 'top-k:optimize-sort-to-heap',
  }),
  debug({
    id: 'd9-topk-dbg-no-trim',
    title: 'Debug: sum of the k largest',
    skills: ['top_k', 'heap_push_pop'],
    minutes: 3.5,
    prompt: "`nums` is a list of numbers and `0 <= k <= len(nums)`. `top_k_sum(nums, k)` should return the sum of the `k` largest values (`0` when `k` is `0`), using a min-heap that never holds more than `k` items. `top_k_sum([5, 1, 9, 3], 2)` should give `14`. Fix it.",
    brokenCode: `import heapq

def top_k_sum(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
    return sum(heap)`,
    solution: `import heapq

def top_k_sum(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return sum(heap)`,
    tests: [
      t.eq('top_k_sum([5, 1, 9, 3], 2)', '14'),
      t.eq('top_k_sum([4], 1)', '4'),
      t.hidden('top_k_sum([-1, -5, 0], 2)', '-1'),
      t.hidden('top_k_sum([3, 1], 0)', '0'),
    ],
    hints: ['How big does the heap get?'],
    signature: 'debug:top-k-no-trim',
  }),
  write({
    id: 'd9-topk-closest',
    title: 'k closest points',
    skills: ['top_k', 'heap_push_pop', 'tuples'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 3,
    minutes: 10,
    prompt: "`points` is a list of `[x, y]` pairs and `1 <= k <= len(points)`. Write `k_closest(points, k)` that returns the `k` points nearest to the origin `(0, 0)`, as `[x, y]` lists in any order. Compare points by `x*x + y*y` (the squared distance; no square root needed). `k_closest([[1, 3], [-2, 2]], 1)` gives `[[-2, 2]]`, because 8 is less than 10.\n\nUse a heap that never holds more than `k` points. This time the point to throw out is the **farthest**, but `heappop` removes the smallest. So store the distance negated: the farthest point then has the smallest first item, and it is the one popped. Nothing is pre-imported.",
    note: "Keeping the k **smallest** is the mirror of keeping the k largest: you must evict the biggest, so the heap has to give you the biggest first. `heapq` cannot, so push the negated number as the first item of a tuple, like `(-distance, x, y)`.",
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
  write({
    id: 'd9-topk-keys-by-count',
    title: "The k keys with the highest counts",
    skills: ['top_k', 'heap_push_pop', 'dict_items'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 7,
    prompt: "`counts` is a dict that maps each item to a whole number: how many times it was seen. `k` is between 1 and the number of keys. Write `top_k_keys(counts, k)` that returns a list of the `k` keys with the highest counts, in any order. No two counts are tied at the cut-off, so the answer is unique.\n\n`top_k_keys({'a': 5, 'b': 1, 'c': 3}, 2)` gives `['a', 'c']` (or `['c', 'a']`).",
    transfer: true,
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
    hints: [
      "You do not need a full ranking of the keys, only the k strongest. What lets you throw out the weakest one so far cheaply?",
      "A min-heap that never holds more than k entries. Nothing is pre-imported, so import heapq.",
      "Loop over counts.items() and push (count, key), so the heap orders by count.",
      "Evict when len(heap) > k; at the end return the keys still in the heap.",
    ],
    signature: 'top-k:keys-by-count',
  }),
  debug({
    id: 'd9-topk-dbg-tuple-order',
    title: 'Debug: busiest users',
    skills: ['top_k', 'frequency_map', 'tuples'],
    minutes: 4,
    prompt: "`log` is a list of usernames, one entry per action, so a name appears once for every action that user took. `busiest(log, k)` should return a list of the `k` users with the most actions, in any order: `busiest(['bo', 'al', 'bo', 'cy', 'bo', 'al'], 2)` should give `bo` and `al`. Fix it.",
    brokenCode: `import heapq

def busiest(log, k):
    counts = {}
    for user in log:
        counts[user] = counts.get(user, 0) + 1
    heap = []
    for user, c in counts.items():
        heapq.heappush(heap, (user, c))
        if len(heap) > k:
            heapq.heappop(heap)
    return [user for user, c in heap]`,
    solution: `import heapq

def busiest(log, k):
    counts = {}
    for user in log:
        counts[user] = counts.get(user, 0) + 1
    heap = []
    for user, c in counts.items():
        heapq.heappush(heap, (c, user))
        if len(heap) > k:
            heapq.heappop(heap)
    return [user for c, user in heap]`,
    tests: [
      t.eq("busiest(['bo', 'al', 'bo', 'cy', 'bo', 'al'], 2)", "['bo', 'al']", { compare: 'unordered' }),
      t.eq("busiest(['zz'], 1)", "['zz']", { compare: 'unordered' }),
      t.hidden("busiest(['a', 'b', 'b', 'c', 'c', 'c'], 1)", "['c']", { compare: 'unordered' }),
    ],
    hints: ['A heap of tuples orders by the first element. What is first here?'],
    signature: 'debug:top-k-tuple-order',
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
  code({
    id: 'd9-iv-overlaps-line',
    title: 'Overlap test in one line',
    skills: ['interval_overlap'],
    stage: 'recall',
    difficulty: 1,
    minutes: 2,
    prompt: "An **interval** is a `[start, end]` pair with `start <= end`, like a booking from 1 to 4. `cur` and `nxt` are two intervals, and `cur` starts first (`cur[0] <= nxt[0]`). Write `overlaps(cur, nxt)` in one line: `True` if they share at least one point, otherwise `False`.\n\nTouching counts here: `[1, 4]` and `[4, 6]` overlap, because both contain 4. `[1, 3]` and `[5, 6]` do not.",
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
    note: "An **interval** is `[start, end]`. Two intervals **overlap** when they share at least one point. When you already know which one starts first, one comparison decides it: does the later one start before the earlier one has ended? Whether touching ends count (`[1, 4]` and `[4, 6]`) changes from problem to problem, so always check. Here they count.",
    hints: ['Compare the next start with the current end.'],
    signature: 'interval:overlap-line',
  }),
  write({
    id: 'd9-iv-intersection',
    title: 'Where two ranges overlap',
    skills: ['interval_overlap'],
    difficulty: 2,
    minutes: 4,
    prompt: "`a` and `b` are intervals, each a `[start, end]` list; either one may start first. Write `intersection(a, b)` that returns the part both cover as `[start, end]`, or `None` if they do not overlap. `[1, 6]` and `[4, 9]` give `[4, 6]`. Touching intervals share a single point: `[3, 5]` and `[5, 8]` give `[5, 5]`.",
    starterCode: `def intersection(a, b):
    pass`,
    solution: `def intersection(a, b):
    start = max(a[0], b[0])
    end = min(a[1], b[1])
    if start > end:
        return None
    return [start, end]`,
    tests: [
      t.eq('intersection([1, 6], [4, 9])', '[4, 6]'),
      t.eq('intersection([3, 5], [5, 8])', '[5, 5]'),
      t.eq('intersection([7, 9], [1, 2])', 'None'),
      t.hidden('intersection([1, 10], [3, 4])', '[3, 4]'),
    ],
    hints: ['The overlap starts at the later start and ends at the earlier end.', 'If that start is past that end, there is no overlap.'],
    signature: 'interval:intersection',
  }),
  output({
    id: 'd9-iv-merge-trace',
    title: 'Trace the merge loop',
    skills: ['interval_overlap', 'list_index'],
    prompt: "To **merge** intervals is to combine every group that overlaps or touches into one interval covering all of it: `[1, 3]` and `[2, 6]` become `[1, 6]`. The intervals below are already sorted by start. Predict the output; the loop prints once per step.",
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
    note: "Merge loop: sort by start, then compare each interval only with the last merged one, `merged[-1]`. If it overlaps, extend that block's end with `max()`; otherwise append it as a new block.",
    explanation: '[9, 9] sits inside [8, 10]; max keeps the end at 10 instead of shrinking it to 9.',
    minutes: 3,
    important: true,
    signature: 'trace:interval-merge',
  }),
  write({
    id: 'd9-iv-merge-sorted',
    title: 'Merge, input already sorted',
    skills: ['interval_overlap', 'list_index'],
    difficulty: 2,
    minutes: 5,
    prompt: "`intervals` is a list of `[start, end]` pairs, already sorted by start. It may be empty. Write `merge_sorted(intervals)` returning a list in which every group of overlapping or touching intervals has been combined into one.\n\n`[[1, 3], [2, 6], [8, 10]]` gives `[[1, 6], [8, 10]]`. `[[1, 2], [2, 3]]` gives `[[1, 3]]`. `[]` gives `[]`.\n\nStart from an empty `merged` list and compare each interval with the last one in it.",
    starterCode: `def merge_sorted(intervals):
    pass`,
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
      t.hidden('merge_sorted([[1, 2], [2, 3], [5, 5]])', '[[1, 3], [5, 5]]'),
    ],
    hints: ['`if merged and ...` guards the very first interval.', 'Extend merged[-1][1] with max(); otherwise append a new [start, end].'],
    important: true,
    signature: 'interval:merge-sorted',
  }),
  debug({
    id: 'd9-iv-dbg-overwrite-end',
    title: 'Debug: nested ranges',
    skills: ['interval_overlap'],
    minutes: 3.5,
    prompt: "`intervals` is a list of `[start, end]` ranges sorted by start. `merge_sorted(intervals)` should combine every overlapping or touching group into one range and return the list of combined ranges. It fails when one range sits inside another. Fix it.",
    brokenCode: `def merge_sorted(intervals):
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = end
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
      t.eq('merge_sorted([[1, 10], [2, 3]])', '[[1, 10]]'),
      t.eq('merge_sorted([[1, 3], [2, 6]])', '[[1, 6]]'),
      t.hidden('merge_sorted([[0, 9], [1, 2], [3, 4], [10, 11]])', '[[0, 9], [10, 11]]'),
    ],
    hints: ['Can a later range end before the current block does?'],
    signature: 'debug:interval-overwrite-end',
  }),
  debug({
    id: 'd9-iv-dbg-strict',
    title: 'Debug: back-to-back bookings',
    skills: ['interval_overlap', 'sort_key'],
    minutes: 3.5,
    prompt: "`bookings` is a list of `[start, end]` pairs in any order. `combine(bookings)` should merge bookings that overlap **or touch** (a booking ending at 4 and one starting at 4 become one block), returning the blocks sorted by start. Fix it.",
    brokenCode: `def combine(bookings):
    merged = []
    for start, end in sorted(bookings, key=lambda b: b[0]):
        if merged and start < merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    solution: `def combine(bookings):
    merged = []
    for start, end in sorted(bookings, key=lambda b: b[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    tests: [
      t.eq('combine([[4, 6], [1, 4]])', '[[1, 6]]'),
      t.eq('combine([[1, 2], [5, 7]])', '[[1, 2], [5, 7]]'),
      t.hidden('combine([[1, 3], [3, 5], [5, 7]])', '[[1, 7]]'),
    ],
    hints: ['What happens when start equals the current end?'],
    signature: 'debug:interval-strict-compare',
  }),
  debug({
    id: 'd9-iv-dbg-unsorted',
    title: 'Debug: ranges in any order',
    skills: ['interval_overlap', 'sort_key'],
    minutes: 3.5,
    prompt: "`ranges` is a list of `[start, end]` ranges in **any order**. `merge_ranges(ranges)` should combine every overlapping or touching group into one range and return the combined ranges sorted by start: `[[8, 10], [1, 3], [2, 6]]` gives `[[1, 6], [8, 10]]`. Fix it.",
    brokenCode: `def merge_ranges(ranges):
    merged = []
    for start, end in ranges:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    solution: `def merge_ranges(ranges):
    merged = []
    for start, end in sorted(ranges, key=lambda r: r[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    tests: [
      t.eq('merge_ranges([[8, 10], [1, 3], [2, 6]])', '[[1, 6], [8, 10]]'),
      t.eq('merge_ranges([[1, 2]])', '[[1, 2]]'),
      t.hidden('merge_ranges([[5, 6], [1, 2]])', '[[1, 2], [5, 6]]'),
    ],
    hints: ['The loop only ever compares with merged[-1]. When is that enough?'],
    signature: 'debug:interval-unsorted',
  }),
  write({
    id: 'd9-iv-can-attend',
    title: 'Can one person attend every meeting?',
    skills: ['interval_overlap', 'sort_key'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 2,
    minutes: 6,
    prompt: "`meetings` is a list of `[start, end]` times, in any order. It may be empty. Two meetings **clash** when one of them starts while the other is still going on. A meeting ending at 10 and another starting at 10 do **not** clash. Write `can_attend(meetings)` returning `True` if no two meetings clash, otherwise `False`.\n\n`[[0, 30], [5, 10], [15, 20]]` gives `False`, because 5 to 10 falls inside 0 to 30. `[[7, 10], [2, 4]]` gives `True`. No meetings gives `True`.",
    transfer: true,
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
    hints: [
      "Checking every pair of meetings works but is slow. What ordering would put any two clashing meetings next to each other?",
      "Sort by start so only neighbours can clash.",
      "Here touching is allowed, so the clash test is strict: start < previous end.",
    ],
    explanation: 'After sorting, it is enough to compare each meeting with the one just before it. The strict < is the only change from the merge rule.',
    signature: 'interval:any-overlap',
  }),
  write({
    id: 'd9-iv-covered-length',
    title: 'Total length covered',
    skills: ['interval_overlap', 'sort_key', 'accumulator'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    minutes: 8,
    prompt: "`intervals` is a list of `[start, end]` pairs in any order (it may be empty). The length of `[start, end]` is `end - start`. Write `covered(intervals)` returning the total length of the number line they cover. Overlapping parts count once. `[[1, 4], [2, 6], [8, 9]]` covers 1 to 6 and 8 to 9: `5 + 1 = 6`.",
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
  write({
    id: 'd9-iv-write-test',
    title: 'Write the tests that catch merge bugs',
    skills: ['interval_overlap', 'edge_cases'],
    style: 'write-test',
    difficulty: 3,
    minutes: 5,
    prompt: "Write `test_merge(merge)`. Its argument `merge` is a function that merges intervals. It takes `[start, end]` ranges in any order. It combines overlapping or touching ranges and returns them sorted by start. Your job is to call it and `assert` on what it returns.\n\nA correct `merge` must pass your asserts. Three buggy versions must each trip at least one assert: one uses `<` instead of `<=`, one sets the end to `end` instead of `max(...)`, and one forgets to sort.",
    starterCode: `def test_merge(merge):
    pass`,
    solution: `def test_merge(merge):
    assert merge([[1, 4], [4, 6]]) == [[1, 6]]
    assert merge([[1, 10], [2, 3]]) == [[1, 10]]
    assert merge([[5, 6], [1, 2]]) == [[1, 2], [5, 6]]`,
    tests: [
      t.check(
        'a correct merge passes',
        "def _good(ivs):\n    out = []\n    for s, e in sorted(ivs):\n        if out and s <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], e)\n        else:\n            out.append([s, e])\n    return out\ntest_merge(_good)",
      ),
      t.check(
        'catches < instead of <=',
        "def _strict(ivs):\n    out = []\n    for s, e in sorted(ivs):\n        if out and s < out[-1][1]:\n            out[-1][1] = max(out[-1][1], e)\n        else:\n            out.append([s, e])\n    return out\ntry:\n    test_merge(_strict)\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('the strict < version passed your tests: add touching ranges')",
      ),
      t.check(
        'catches end overwritten',
        "def _overwrite(ivs):\n    out = []\n    for s, e in sorted(ivs):\n        if out and s <= out[-1][1]:\n            out[-1][1] = e\n        else:\n            out.append([s, e])\n    return out\ntry:\n    test_merge(_overwrite)\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('the version without max() passed your tests: add a range nested inside another')",
      ),
      t.check(
        'catches missing sort',
        "def _unsorted(ivs):\n    out = []\n    for s, e in ivs:\n        if out and s <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], e)\n        else:\n            out.append([s, e])\n    return out\ntry:\n    test_merge(_unsorted)\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('the version that never sorts passed your tests: add unsorted input')",
      ),
    ],
    hints: ['One assert per bug: what input exposes each one?', 'Touching: [[1, 4], [4, 6]]. Nested: [[1, 10], [2, 3]]. Unsorted: put a later range first.'],
    explanation: 'Interviewers love asking "how would you test this?". Each edge case maps to one classic bug.',
    signature: 'interval:write-tests',
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
  write({
    id: 'd9-fu-touching-apart',
    title: 'Follow-up: touching stays apart',
    style: 'modify',
    skills: ['interval_overlap', 'sort_key'],
    prompt: '**Interviewer follow-up.** Your merge-intervals solution is in the editor, already renamed `merge_strict`. It combines ranges that only touch (`[1, 4]` and `[4, 6]` become `[1, 6]`). The rule changes: touching ranges now stay **separate**, and only ranges that truly overlap combine.',
    starterCode: `def merge_strict(intervals):
    merged = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
`,
    solution: `def merge_strict(intervals):
    merged = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if merged and start < merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
`,
    tests: [t.eq('merge_strict([[1, 4], [4, 6]])', '[[1, 4], [4, 6]]'), t.eq('merge_strict([[1, 3], [2, 6], [8, 10]])', '[[1, 6], [8, 10]]'), t.hidden('merge_strict([])', '[]'), t.hidden('merge_strict([[5, 7], [1, 5], [2, 3]])', '[[1, 5], [5, 7]]'), t.hidden('merge_strict([[1, 10], [2, 3], [10, 12]])', '[[1, 10], [10, 12]]')],
    hints: ['Only the overlap test changes. Which comparison decides "touching"?'],
    explanation: 'The whole rule lives in one comparison: `<=` merges touching ranges, `<` keeps them apart. Saying this out loud is exactly the clarifying question to ask up front.',
    signature: 'followup:merge-touching-apart',
    minutes: 3,
  }),
]

const cold = [
  write({
    id: 'd9-cold-sort-second-desc',
    title: 'Cold: rank names by points',
    skills: ['sort_key', 'tuples'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 4,
    prompt: 'Write `rank_names(pairs)` that takes `(name, points)` pairs and returns just the names, highest points first; equal points ordered by name A to Z.',
    starterCode: `def rank_names(pairs):
    pass`,
    solution: `def rank_names(pairs):
    ordered = sorted(pairs, key=lambda p: (-p[1], p[0]))
    return [name for name, _ in ordered]`,
    tests: [
      t.eq("rank_names([('b', 2), ('a', 2), ('c', 5)])", "['c', 'a', 'b']"),
      t.hidden('rank_names([])', '[]'),
      t.hidden("rank_names([('x', -1), ('y', 0)])", "['y', 'x']"),
    ],
    signature: 'cold:sort-key-tuple',
  }),
  write({
    id: 'd9-cold-kth-smallest',
    title: 'Cold: k-th smallest with a heap',
    skills: ['top_k', 'heap_push_pop'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
    prompt: "Write `kth_smallest(nums, k)` using a heap of size `k` (the mirror of k-th largest). Return the k-th smallest value: `k = 1` is the minimum. Assume `1 <= k <= len(nums)`.",
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
  write({
    id: 'd9-cold-any-overlap',
    title: 'Cold: any overlap?',
    skills: ['interval_overlap', 'sort_key'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 2,
    minutes: 5,
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
  write({
    id: 'd9-cold-top-words',
    title: 'Cold: top k words, ordered',
    skills: ['frequency_map', 'sort_key'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
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
  write({
    id: 'd9-cold-last-rock',
    title: 'Cold: smash the two heaviest',
    skills: ['heap_push_pop', 'while_loop'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    minutes: 6,
    prompt: 'From memory: `last_rock(weights)`. Repeatedly smash the two heaviest rocks; equal weights both vanish, otherwise the difference goes back. Return the last weight, or `0`.',
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
      t.hidden('last_rock([])', '0'),
      t.hidden('last_rock([4, 4, 9])', '1'),
    ],
    signature: 'cold:max-heap-simulation',
  }),
]

export const day: DayModule = {
  date: '2026-10-09',
  short: 'Heaps',
  title: 'Heaps, sorting + intervals',
  focus: 'Write, break and fix sorted/key=lambda, heapq push/pop/negation, size-k heaps and the interval merge loop until they are automatic.',
  sections: [
    { id: 'd9-warmup', title: 'Warm-up', summary: 'Cold reps on dicts, pointers, windows, binary search, trees and graphs.', exercises: warmup },
    { id: 'd9-sorting', title: 'Sorting', summary: 'sorted() vs .sort(), reverse=True, and the bugs they cause.', exercises: sorting },
    { id: 'd9-keys', title: 'Sort keys', summary: 'key=lambda by field, by tuple, named key functions.', exercises: keys },
    { id: 'd9-freq-sort', title: 'Frequency + sort', summary: 'Count with a dict, then order the counts.', exercises: freqSort },
    { id: 'd9-heapq', title: 'heapq', summary: 'heappush, heappop, heapify, heap[0], tuples in heaps.', exercises: heapBasics },
    { id: 'd9-max-heap', title: 'Max-heap', summary: 'Negate on the way in and out.', exercises: maxHeap },
    { id: 'd9-top-k', title: 'Top-k', summary: 'Size-k heaps, then the k-th largest and top-k frequent capstones.', exercises: topK },
    { id: 'd9-intervals', title: 'Intervals', summary: 'Overlap test, the merge loop, its three classic bugs, then merge intervals.', exercises: intervals },
    { id: 'd9-cold', title: 'Cold reps', summary: 'From a signature, no scaffolding.', exercises: cold },
  ],
  capstones: ['top-k-frequent', 'kth-largest', 'merge-intervals'],
}
