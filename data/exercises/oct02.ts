import type { DayModule, Exercise, Section } from '@/lib/types'
import { capstone, choice, code, debug, explain, fill, output, t, write } from './build'

/**
 * October 2 – Foundation day.
 * Python syntax retrieval first (lists, loops, range, enumerate), then the
 * hashing primitives (sets, dicts, .get, iteration, frequency and index maps,
 * complements), each bridged to a capstone: Contains Duplicate, Valid Anagram,
 * Two Sum. Code-first: each construct gets at most one trace, then several
 * write reps in different shapes, debug reps, and a cold write at the end.
 */

function section(id: string, title: string, summary: string, exercises: Exercise[]): Section {
  return { id, title, summary, exercises }
}

// ---------------------------------------------------------------------------
// 1. Python recall: lists, indexing, len, append, return
// ---------------------------------------------------------------------------

const pythonRecall = section('o2-python-recall', 'Python recall', 'List literals, indexing (including negative), len, append and return.', [
  choice({
    id: 'o2-list-literal',
    title: 'Spot the list literal',
    skills: ['list_create'],
    prompt: 'Which line creates a **list** holding 4, 7 and 9?',
    options: ['nums = [4, 7, 9]', 'nums = (4, 7, 9)', 'nums = {4, 7, 9}', 'nums = list(4, 7, 9)'],
    answer: 0,
    note: 'Square brackets make a list: `[]` is empty, `[4, 7]` has two items.',
    explanation: 'Parentheses make a tuple, braces with bare values make a set, and `list(4, 7, 9)` is a TypeError because `list()` takes one iterable.',
    signature: 'recognize:list-literal',
    minutes: 0.5,
  }),
  output({
    id: 'o2-list-index-trace',
    title: 'Trace: indexing and len',
    skills: ['list_index', 'len'],
    prompt: 'Predict exactly what this prints.',
    code: `nums = [5, 9, 2, 6]
print(nums[0])
print(nums[2])
print(nums[-1])
print(nums[-2])
print(len(nums))`,
    expectedOutput: `5
2
6
2
4`,
    note: 'Indexes start at 0. `nums[-1]` is the last item, `nums[-2]` the one before. `len(nums)` is the count of items.',
    explanation: 'Index 2 is the third item. The last valid index is `len(nums) - 1`, which `-1` reaches directly.',
    signature: 'trace:list-index',
    minutes: 1.5,
  }),
  write({
    id: 'o2-bookends',
    title: 'Write: first and last',
    skills: ['list_create', 'list_index', 'len', 'conditionals'],
    prompt: 'Write `bookends(nums)` that returns a new list `[first, last]` holding the first and last items of `nums`. For an empty list return `[]`. A one-item list gives that item twice.',
    starterCode: `def bookends(nums):
    pass`,
    solution: `def bookends(nums):
    if len(nums) == 0:
        return []
    return [nums[0], nums[-1]]`,
    tests: [t.eq('bookends([4, 7, 9])', '[4, 9]'), t.eq('bookends([5])', '[5, 5]'), t.hidden('bookends([])', '[]'), t.hidden('bookends([-1, 0])', '[-1, 0]')],
    hints: ['Handle the empty list first: there is no item 0.', '`nums[0]` and `nums[-1]` inside a list literal.'],
    explanation: 'Guard the empty case before indexing; `nums[-1]` works for any non-empty length.',
    signature: 'list:first-last',
    minutes: 3.5,
    important: true,
  }),
  debug({
    id: 'o2-dbg-last-item',
    title: 'Debug: the last item',
    skills: ['list_index', 'len'],
    prompt: '`last_item(nums)` should return the last item of a non-empty list. Run it, read the error, fix it.',
    brokenCode: `def last_item(nums):
    return nums[len(nums)]`,
    solution: `def last_item(nums):
    return nums[-1]`,
    tests: [t.eq('last_item([3, 8, 1])', '1'), t.eq("last_item(['a'])", "'a'"), t.hidden('last_item([0, 0, 7])', '7')],
    hints: ['A list of length 3 has indexes 0, 1 and 2.', 'The last index is `len(nums) - 1`, or simply `-1`.'],
    explanation: '`nums[len(nums)]` is always one past the end: IndexError. Use `nums[-1]` (or `len(nums) - 1`).',
    signature: 'debug:index-past-end',
    minutes: 2.5,
  }),
  write({
    id: 'o2-append-line',
    title: 'Write: append in a loop',
    skills: ['list_append', 'for_loop', 'functions'],
    prompt: 'Write `add_all(nums, extra)` that appends every item of `extra` to the end of `nums` (changing `nums` in place) and returns `nums`. Do not use `+` or `.extend`.',
    starterCode: `def add_all(nums, extra):
    pass`,
    solution: `def add_all(nums, extra):
    for x in extra:
        nums.append(x)
    return nums`,
    tests: [
      t.eq('add_all([3, 8], [5])', '[3, 8, 5]'),
      t.eq('add_all([], [1, 2])', '[1, 2]'),
      t.check('changes nums in place', 'a = [1]\nadd_all(a, [2])\nassert a == [1, 2], "nums itself should change"'),
      t.hidden('add_all([1], [])', '[1]'),
    ],
    hints: ['Loop over `extra`.', '`nums.append(x)` adds one item at the end. Return `nums` after the loop.'],
    explanation: '`.append` changes the list in place and returns None, so it is a statement on its own line, never `nums = nums.append(x)`.',
    signature: 'list:append-loop',
    minutes: 3,
  }),
  debug({
    id: 'o2-dbg-append-none',
    title: 'Debug: building a doubled list',
    skills: ['list_append', 'list_create', 'for_loop'],
    prompt: '`doubled(nums)` should return a new list with every number doubled, in order.',
    brokenCode: `def doubled(nums):
    out = []
    for num in nums:
        out = out.append(num * 2)
    return out`,
    solution: `def doubled(nums):
    out = []
    for num in nums:
        out.append(num * 2)
    return out`,
    tests: [t.eq('doubled([1, 2, 3])', '[2, 4, 6]'), t.eq('doubled([])', '[]'), t.hidden('doubled([-1])', '[-2]')],
    hints: ['What does `.append` return?', '`.append` returns None; assigning that to `out` throws the list away.'],
    explanation: '`.append` mutates and returns None. After the first pass `out` is None, so the second append crashes.',
    signature: 'debug:append-returns-none',
    minutes: 3,
  }),
  debug({
    id: 'o2-dbg-print-return',
    title: 'Debug: print is not return',
    skills: ['functions'],
    prompt: '`area(width, height)` should give the area back to the caller, so that `area(2, 3) + 1` is `7`.',
    brokenCode: `def area(width, height):
    print(width * height)`,
    solution: `def area(width, height):
    return width * height`,
    tests: [t.eq('area(2, 3)', '6'), t.eq('area(2, 3) + 1', '7'), t.hidden('area(0, 5)', '0')],
    hints: ['Printing shows a value; it does not hand it back.'],
    explanation: 'A function without `return` returns None. Tests (and callers) see the return value, not what was printed.',
    signature: 'debug:print-vs-return',
    minutes: 2,
  }),
])

// ---------------------------------------------------------------------------
// 2. Loops & range: for, range(1/2/3 args), accumulators, early return
// ---------------------------------------------------------------------------

const loops = section('o2-loops', 'Loops & range', 'for over a list, range with 1/2/3 arguments, accumulators, conditions, early return.', [
  output({
    id: 'o2-for-trace',
    title: 'Trace: for over a list',
    skills: ['for_loop', 'list_iterate', 'len'],
    prompt: 'Predict the output.',
    code: `for word in ['red', 'green', 'blue']:
    print(word, len(word))`,
    expectedOutput: `red 3
green 5
blue 4`,
    note: '`for x in seq:` binds x to each item in order. `print(a, b)` separates with one space.',
    explanation: 'The loop variable takes each list item in turn; there is no index involved.',
    signature: 'trace:for-list',
  }),
  code({
    id: 'o2-for-print-write',
    title: 'Write: a printing loop',
    skills: ['for_loop', 'list_iterate'],
    prompt: 'Below the list, write a loop that prints each number and its square on one line:\n\n```\n3 9\n5 25\n8 64\n```',
    starterCode: `nums = [3, 5, 8]
`,
    solution: `nums = [3, 5, 8]
for num in nums:
    print(num, num * num)`,
    tests: [t.out('3 9\n5 25\n8 64')],
    hints: ['`for num in nums:` then an indented `print(a, b)`.'],
    explanation: 'Two lines: the for header ending in a colon, and an indented body.',
    signature: 'for:print-each',
    minutes: 2,
  }),
  debug({
    id: 'o2-dbg-for-of',
    title: 'Debug: total length of words',
    skills: ['for_loop', 'accumulator', 'len'],
    prompt: '`total_length(words)` should return the sum of the lengths of all words.',
    brokenCode: `def total_length(words):
    total = 0
    for word of words:
        total += len(word)
    return total`,
    solution: `def total_length(words):
    total = 0
    for word in words:
        total += len(word)
    return total`,
    tests: [t.eq("total_length(['ab', 'cde'])", '5'), t.eq('total_length([])', '0'), t.hidden("total_length(['', 'x'])", '1')],
    hints: ['Read the SyntaxError line carefully.', 'Python loops are `for x in seq:`.'],
    explanation: '`for ... of` is JavaScript. Python always uses `for x in seq:`.',
    signature: 'debug:for-of',
    minutes: 2,
  }),
  output({
    id: 'o2-range-basic',
    title: 'Trace: range with 1, 2 and 3 arguments',
    skills: ['range'],
    prompt: 'Predict the output. `list(...)` turns a range into a visible list.',
    code: `print(list(range(4)))
print(list(range(2, 6)))
print(list(range(0, 10, 4)))
print(list(range(5, 0, -1)))`,
    expectedOutput: `[0, 1, 2, 3]
[2, 3, 4, 5]
[0, 4, 8]
[5, 4, 3, 2, 1]`,
    note: '`range(stop)` starts at 0, `range(start, stop)` at start, `range(start, stop, step)` jumps by step. The stop value is never included.',
    explanation: 'range stops *before* stop, also when counting down: `range(5, 0, -1)` ends at 1.',
    signature: 'trace:range-1-2',
    minutes: 2,
    important: true,
  }),
  write({
    id: 'o2-countdown',
    title: 'Write: count down with range',
    skills: ['range', 'list_append'],
    prompt: 'Write `countdown(n)` that returns `[n, n-1, ..., 1]` using a `for` loop over a `range`. For `n = 0` return `[]`.',
    starterCode: `def countdown(n):
    pass`,
    solution: `def countdown(n):
    out = []
    for i in range(n, 0, -1):
        out.append(i)
    return out`,
    tests: [t.eq('countdown(3)', '[3, 2, 1]'), t.eq('countdown(1)', '[1]'), t.hidden('countdown(0)', '[]')],
    hints: ['Three arguments: start, stop, step.', 'Start at n, step -1. Stop is excluded, so which stop makes 1 the last value?'],
    explanation: '`range(n, 0, -1)` starts at n and stops before 0, so 1 is the last value.',
    signature: 'range:countdown',
    minutes: 3.5,
    important: true,
  }),
  debug({
    id: 'o2-dbg-squares-range',
    title: 'Debug: squares up to n',
    skills: ['range', 'list_append'],
    prompt: '`squares(n)` should return `[1, 4, 9, ..., n*n]`, the squares of 1 through n.',
    brokenCode: `def squares(n):
    out = []
    for i in range(1, n):
        out.append(i * i)
    return out`,
    solution: `def squares(n):
    out = []
    for i in range(1, n + 1):
        out.append(i * i)
    return out`,
    tests: [t.eq('squares(3)', '[1, 4, 9]'), t.eq('squares(1)', '[1]'), t.hidden('squares(0)', '[]')],
    hints: ['Which values does the range actually produce for n = 3?', 'The stop value is excluded.'],
    explanation: 'To include n, the stop must be `n + 1`. Off-by-one at the end of a range is the most common loop bug.',
    signature: 'debug:range-off-by-one',
    minutes: 3,
  }),
  write({
    id: 'o2-sum-fill',
    title: 'Write: sum with an accumulator',
    skills: ['accumulator', 'for_loop', 'list_iterate'],
    prompt: 'Write `total(nums)` that returns the sum of the numbers, without calling `sum()`.',
    starterCode: `def total(nums):
    pass`,
    solution: `def total(nums):
    result = 0
    for num in nums:
        result += num
    return result`,
    tests: [t.eq('total([1, 2, 3])', '6'), t.eq('total([])', '0'), t.hidden('total([-5, 5, 2])', '2')],
    hints: ['Start a variable at 0 before the loop.', 'Add each item to it inside the loop; return it after.'],
    explanation: 'The accumulator lives outside the loop so it survives between iterations; `result += num` adds each item.',
    signature: 'accumulator:sum',
    minutes: 3,
  }),
  write({
    id: 'o2-count-evens',
    title: 'Write: count the evens',
    skills: ['accumulator', 'conditionals', 'for_loop'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `count_evens(nums)` that returns how many numbers in `nums` are even.',
    starterCode: `def count_evens(nums):
    pass`,
    solution: `def count_evens(nums):
    count = 0
    for num in nums:
        if num % 2 == 0:
            count += 1
    return count`,
    tests: [t.eq('count_evens([1, 2, 4])', '2'), t.eq('count_evens([1, 3])', '0'), t.hidden('count_evens([])', '0'), t.hidden('count_evens([0, -2, 7])', '2')],
    hints: ['Loop over the numbers and only update the count sometimes.', '`num % 2 == 0` is True for even numbers.'],
    explanation: 'Condition inside the loop, accumulator outside it. Note that 0 and negative even numbers count too.',
    signature: 'accumulator:count-if',
    minutes: 4,
  }),
  write({
    id: 'o2-max-manual',
    title: 'Write: largest without max()',
    skills: ['accumulator', 'conditionals', 'list_index'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `largest(nums)` that returns the biggest number in a **non-empty** list, without calling `max()`.',
    starterCode: `def largest(nums):
    pass`,
    solution: `def largest(nums):
    best = nums[0]
    for num in nums:
        if num > best:
            best = num
    return best`,
    tests: [t.eq('largest([3, 9, 2])', '9'), t.eq('largest([-4, -1, -8])', '-1'), t.hidden('largest([5])', '5'), t.hidden('largest([1, 1, 1])', '1')],
    hints: ['Keep a "best so far" while you scan.', 'Start best at `nums[0]`, not 0: what if every number is negative?'],
    explanation: 'Starting at `nums[0]` is safe for all-negative lists; starting at 0 would wrongly return 0 for `[-4, -1]`.',
    signature: 'accumulator:best-so-far',
    minutes: 4,
  }),
  debug({
    id: 'o2-dbg-smallest-zero',
    title: 'Debug: smallest number',
    skills: ['accumulator', 'conditionals'],
    prompt: '`smallest(nums)` should return the smallest number in a non-empty list, without calling `min()`.',
    brokenCode: `def smallest(nums):
    best = 0
    for num in nums:
        if num < best:
            best = num
    return best`,
    solution: `def smallest(nums):
    best = nums[0]
    for num in nums:
        if num < best:
            best = num
    return best`,
    tests: [t.eq('smallest([4, 2, 9])', '2'), t.eq('smallest([-3, 5])', '-3'), t.hidden('smallest([7])', '7')],
    hints: ['Try it by hand on `[4, 2, 9]`. Which value does `best` start with?'],
    explanation: 'A best-so-far must start from a real item (`nums[0]`), not a made-up 0 that may beat every item.',
    signature: 'debug:accumulator-init',
    minutes: 3,
  }),
  output({
    id: 'o2-early-return-trace',
    title: 'Trace: early return',
    skills: ['early_return', 'functions'],
    prompt: 'Predict the output. Watch where the function stops.',
    code: `def first_big(nums):
    for num in nums:
        print('checking', num)
        if num > 10:
            return num
    return None

print(first_big([4, 15, 30]))
print(first_big([1, 2]))`,
    expectedOutput: `checking 4
checking 15
15
checking 1
checking 2
None`,
    note: '`return` inside a loop ends the whole function immediately. The line after the loop runs only if the loop finishes.',
    explanation: '30 is never checked: the function returned at 15. With no match the loop ends and `return None` runs.',
    signature: 'trace:early-return',
    minutes: 2,
  }),
  write({
    id: 'o2-contains-loop',
    title: 'Write: contains with early return',
    skills: ['early_return', 'for_loop', 'conditionals'],
    prompt: 'Write `contains(nums, target)` that returns `True` if target is in nums and `False` otherwise. Use a loop, not the `in` operator on the list.',
    starterCode: `def contains(nums, target):
    pass`,
    solution: `def contains(nums, target):
    for num in nums:
        if num == target:
            return True
    return False`,
    tests: [t.eq('contains([1, 5, 9], 5)', 'True'), t.eq('contains([1, 5, 9], 4)', 'False'), t.hidden('contains([], 1)', 'False'), t.hidden('contains([2, 3], 3)', 'True')],
    hints: ['Return True the moment you find it.', 'Only return False after the loop has checked everything, not in an else inside the loop.'],
    explanation: 'The False belongs after the loop: you can only say "not found" once every item was checked.',
    signature: 'early-return:search',
    minutes: 3.5,
    important: true,
  }),
  debug({
    id: 'o2-dbg-early-else',
    title: 'Debug: any negative?',
    skills: ['early_return', 'conditionals', 'for_loop'],
    prompt: '`has_negative(nums)` should return `True` if any number is below zero, otherwise `False`.',
    brokenCode: `def has_negative(nums):
    for num in nums:
        if num < 0:
            return True
        else:
            return False`,
    solution: `def has_negative(nums):
    for num in nums:
        if num < 0:
            return True
    return False`,
    tests: [t.eq('has_negative([3, -1])', 'True'), t.eq('has_negative([1, 2])', 'False'), t.hidden('has_negative([])', 'False'), t.hidden('has_negative([0, 0, -5])', 'True')],
    hints: ['How many items does the loop look at before returning?'],
    explanation: 'The else returns on the very first item, so later items are never checked. "Not found" belongs after the loop.',
    signature: 'debug:return-too-early',
    minutes: 3,
  }),
])

// ---------------------------------------------------------------------------
// 3. enumerate
// ---------------------------------------------------------------------------

const enumerateSection = section('o2-enumerate', 'enumerate', 'Index and value together: for i, x in enumerate(seq).', [
  output({
    id: 'o2-enum-trace',
    title: 'Trace: enumerate',
    skills: ['enumerate'],
    prompt: 'Predict the output.',
    code: `nums = [8, 3, 12]
for i, num in enumerate(nums):
    print(i, num)`,
    expectedOutput: `0 8
1 3
2 12`,
    note: '`enumerate(seq)` yields `(index, item)` pairs starting at index 0. Index comes first.',
    explanation: 'Each pass unpacks one (index, item) pair into i and num.',
    signature: 'trace:enumerate-print',
  }),
  code({
    id: 'o2-enum-print-write',
    title: 'Write: print index and value',
    skills: ['enumerate', 'for_loop'],
    prompt: 'Below the list, write a loop with `enumerate` that prints:\n\n```\n0 apple\n1 banana\n2 mango\n```',
    starterCode: `fruits = ['apple', 'banana', 'mango']
`,
    solution: `fruits = ['apple', 'banana', 'mango']
for i, fruit in enumerate(fruits):
    print(i, fruit)`,
    tests: [t.out('0 apple\n1 banana\n2 mango')],
    hints: ['`for i, fruit in enumerate(fruits):`'],
    explanation: 'Two loop variables, index first. No `range(len(...))` needed.',
    signature: 'enumerate:print',
    minutes: 2,
  }),
  write({
    id: 'o2-enum-fill',
    title: 'Write: (index, word) pairs',
    skills: ['enumerate', 'tuples', 'list_append'],
    prompt: "Write `with_index(words)` that returns a list of `(index, word)` tuples.\n\n`with_index(['a', 'b'])` → `[(0, 'a'), (1, 'b')]`",
    starterCode: `def with_index(words):
    pass`,
    solution: `def with_index(words):
    pairs = []
    for i, word in enumerate(words):
        pairs.append((i, word))
    return pairs`,
    tests: [t.eq("with_index(['a', 'b'])", "[(0, 'a'), (1, 'b')]"), t.eq('with_index([])', '[]'), t.hidden("with_index(['z'])", "[(0, 'z')]")],
    hints: ['enumerate gives you both parts.', 'A tuple needs its own parentheses inside append: `pairs.append((i, word))`.'],
    explanation: 'enumerate supplies the index so you do not need range(len(words)) and words[i].',
    signature: 'enumerate:pairs',
  }),
  write({
    id: 'o2-index-of',
    title: 'Write: first index of a value',
    skills: ['enumerate', 'early_return'],
    prompt: 'Write `index_of(nums, target)` that returns the index of the first occurrence of target, or `-1` if it is missing. Use enumerate.',
    starterCode: `def index_of(nums, target):
    pass`,
    solution: `def index_of(nums, target):
    for i, num in enumerate(nums):
        if num == target:
            return i
    return -1`,
    tests: [t.eq('index_of([5, 3, 5], 5)', '0'), t.eq('index_of([5, 3, 5], 3)', '1'), t.hidden('index_of([], 3)', '-1'), t.hidden('index_of([1, 2], 9)', '-1')],
    hints: ['enumerate gives you the index you need to return.', 'Return the index as soon as it matches; return -1 after the loop.'],
    explanation: 'Early return gives the first match automatically. The -1 goes after the loop.',
    signature: 'enumerate:first-index',
    minutes: 3.5,
    important: true,
  }),
  write({
    id: 'o2-enum-translate',
    title: 'Translate: index loop to enumerate',
    skills: ['enumerate', 'list_append'],
    style: 'translate',
    stage: 'reconstruct',
    prompt: "This works, but juggles `i` and `words[i]`:\n\n```python\ndef labels(words):\n    out = []\n    for i in range(len(words)):\n        out.append(str(i) + ':' + words[i])\n    return out\n```\n\nRewrite `labels(words)` with `enumerate` so the loop never indexes into `words`.",
    starterCode: `def labels(words):
    pass`,
    solution: `def labels(words):
    out = []
    for i, word in enumerate(words):
        out.append(str(i) + ':' + word)
    return out`,
    tests: [t.eq("labels(['a', 'b'])", "['0:a', '1:b']"), t.eq('labels([])', '[]'), t.hidden("labels(['x', 'y', 'z'])", "['0:x', '1:y', '2:z']")],
    hints: ['`for i, word in enumerate(words):` replaces both `range(len(words))` and `words[i]`.'],
    explanation: 'enumerate removes the index arithmetic, one less place for an off-by-one.',
    signature: 'enumerate:translate',
    minutes: 3.5,
  }),
  write({
    id: 'o2-all-indexes',
    title: 'Write: every index of a value',
    skills: ['enumerate', 'list_append', 'conditionals'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `indexes_of(nums, target)` that returns a list of **every** index where target appears.',
    starterCode: `def indexes_of(nums, target):
    pass`,
    solution: `def indexes_of(nums, target):
    out = []
    for i, num in enumerate(nums):
        if num == target:
            out.append(i)
    return out`,
    tests: [t.eq('indexes_of([7, 1, 7, 7], 7)', '[0, 2, 3]'), t.eq('indexes_of([1, 2], 3)', '[]'), t.hidden('indexes_of([], 1)', '[]'), t.hidden('indexes_of([4], 4)', '[0]')],
    hints: ['You cannot return early here: you need all of them.', 'Build a list and append the index each time it matches.'],
    explanation: 'Unlike index_of, this must scan everything, so it collects into a list instead of returning early.',
    signature: 'enumerate:collect-indexes',
    minutes: 4,
  }),
  debug({
    id: 'o2-dbg-enum-order',
    title: 'Debug: find the first match',
    skills: ['enumerate', 'early_return'],
    prompt: '`find_first(nums, target)` should return the index of the first occurrence of target, or `-1`.',
    brokenCode: `def find_first(nums, target):
    for num, i in enumerate(nums):
        if num == target:
            return i
    return -1`,
    solution: `def find_first(nums, target):
    for i, num in enumerate(nums):
        if num == target:
            return i
    return -1`,
    tests: [t.eq('find_first([5, 3, 9], 9)', '2'), t.eq('find_first([4, 0], 0)', '1'), t.hidden('find_first([], 1)', '-1')],
    hints: ['Print the two loop variables on the first pass.', 'enumerate yields (index, item), in that order.'],
    explanation: 'enumerate always gives the index first. Swapped names compile fine and silently compare the wrong thing.',
    signature: 'debug:enumerate-order',
    minutes: 3,
  }),
])

// ---------------------------------------------------------------------------
// 4. Sets
// ---------------------------------------------------------------------------

const sets = section('o2-sets', 'Sets', 'set(), .add, duplicates ignored, fast membership with in.', [
  choice({
    id: 'o2-set-empty',
    title: 'Empty set vs empty dict',
    skills: ['set_create', 'dict_create'],
    prompt: 'Which line creates an **empty set**?',
    options: ['seen = set()', 'seen = {}', 'seen = []', 'seen = set[]'],
    answer: 0,
    note: '`set()` is an empty set. `{}` is an empty **dict**. `{1, 2}` with values is a set.',
    explanation: '`{}` was taken by dicts first, so an empty set has to be written `set()`.',
    signature: 'recognize:empty-set',
    important: true,
  }),
  output({
    id: 'o2-set-add-trace',
    title: 'Trace: add ignores duplicates',
    skills: ['set_add', 'set_membership', 'len'],
    prompt: 'Predict the output.',
    code: `seen = set()
for x in [5, 2, 5, 5, 9]:
    seen.add(x)
    print(len(seen))
print(2 in seen, 7 in seen)`,
    expectedOutput: `1
2
2
2
3
True False`,
    note: 'A set holds each value at most once. `.add(x)` inserts; `x in s` checks in O(1) on average.',
    explanation: 'Adding a value that is already present does nothing, so the size only grows on new values.',
    signature: 'trace:set-add',
  }),
  write({
    id: 'o2-set-add-fill',
    title: 'Write: distinct values, sorted',
    skills: ['set_create', 'set_add', 'for_loop', 'sorting'],
    prompt: 'Write `unique_sorted(nums)` that returns the distinct values in ascending order. Build the set yourself with `.add` in a loop, then return `sorted(...)` of it.',
    starterCode: `def unique_sorted(nums):
    pass`,
    solution: `def unique_sorted(nums):
    seen = set()
    for num in nums:
        seen.add(num)
    return sorted(seen)`,
    tests: [t.eq('unique_sorted([3, 1, 3])', '[1, 3]'), t.eq('unique_sorted([])', '[]'), t.hidden('unique_sorted([-2, 5, -2, 0])', '[-2, 0, 5]')],
    hints: ['`seen = set()` before the loop.', 'Sets use `.add`, lists use `.append`.'],
    explanation: '`sorted` accepts any iterable and returns a list, which is how a set gets a predictable order.',
    signature: 'set:build-add',
    important: true,
  }),
  write({
    id: 'o2-set-unique-count',
    title: 'Write: count distinct words, ignoring case',
    skills: ['set_create', 'set_add', 'len', 'string_methods'],
    prompt: "Write `distinct_count(words)` that returns how many different words there are when case is ignored. `'Cat'` and `'cat'` are the same word.",
    starterCode: `def distinct_count(words):
    pass`,
    solution: `def distinct_count(words):
    seen = set()
    for word in words:
        seen.add(word.lower())
    return len(seen)`,
    tests: [t.eq("distinct_count(['Cat', 'cat', 'dog'])", '2'), t.eq('distinct_count([])', '0'), t.hidden("distinct_count(['A', 'b', 'B', 'a', 'c'])", '3')],
    hints: ['Put a normalized version of each word in a set.', '`word.lower()`, then `len` of the set.'],
    explanation: 'Normalize before adding so the set treats variants as one value.',
    signature: 'set:count-distinct',
  }),
  debug({
    id: 'o2-dbg-seen-list',
    title: 'Debug: distinct values in order',
    skills: ['set_create', 'set_add', 'set_membership', 'list_append'],
    prompt: '`unique_in_order(nums)` should return the distinct values in the order they first appear. The "already seen?" check should be O(1).',
    brokenCode: `def unique_in_order(nums):
    seen = []
    out = []
    for num in nums:
        if num not in seen:
            seen.add(num)
            out.append(num)
    return out`,
    solution: `def unique_in_order(nums):
    seen = set()
    out = []
    for num in nums:
        if num not in seen:
            seen.add(num)
            out.append(num)
    return out`,
    tests: [t.eq('unique_in_order([3, 1, 3, 2])', '[3, 1, 2]'), t.eq('unique_in_order([])', '[]'), t.hidden('unique_in_order([4, 4, 4])', '[4]')],
    hints: ['Which type has `.add`?', 'Membership in a list scans every item; a set does not.'],
    explanation: '`seen` needs to be a set: lists have no `.add`, and `in` on a list is O(n). The output list keeps the order; the set answers "seen?".',
    signature: 'debug:list-instead-of-set',
    minutes: 3,
  }),
  write({
    id: 'o2-set-common',
    title: 'Write: values in both lists',
    skills: ['set_create', 'set_add', 'set_membership', 'for_loop'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `shared(a, b)` that returns a **sorted list** of the distinct values that appear in both lists. Build a set from `b` so each membership check is fast.',
    starterCode: `def shared(a, b):
    pass`,
    solution: `def shared(a, b):
    in_b = set(b)
    both = set()
    for x in a:
        if x in in_b:
            both.add(x)
    return sorted(both)`,
    tests: [t.eq('shared([1, 2, 3], [2, 3, 4])', '[2, 3]'), t.eq('shared([1, 1], [1])', '[1]'), t.hidden('shared([], [1])', '[]'), t.hidden('shared([5, 6], [7])', '[]'), t.hidden('shared([3, -1, 3], [3, -1])', '[-1, 3]')],
    hints: ['Membership in a list is O(n); in a set it is O(1).', 'Make `set(b)` once, before the loop.', 'Collect matches in a set so duplicates in `a` appear once, then return `sorted(...)`.'],
    explanation: 'One pass over a with O(1) checks: O(len(a) + len(b)) instead of O(len(a) * len(b)).',
    signature: 'set:intersection-manual',
    minutes: 5,
  }),
  write({
    id: 'o2-set-optimize',
    title: 'Optimize: membership against a list',
    skills: ['set_create', 'set_membership', 'hash_reasoning', 'accumulator'],
    style: 'optimize',
    stage: 'pattern',
    prompt: "This is correct but slow when `allowed` is long: every `in` scans the list.\n\n```python\ndef count_allowed_slow(nums, allowed):\n    count = 0\n    for num in nums:\n        if num in allowed:\n            count += 1\n    return count\n```\n\nWrite `count_allowed(nums, allowed)` so each membership check is O(1).",
    starterCode: `def count_allowed(nums, allowed):
    pass`,
    solution: `def count_allowed(nums, allowed):
    ok = set(allowed)
    count = 0
    for num in nums:
        if num in ok:
            count += 1
    return count`,
    tests: [
      t.eq('count_allowed([1, 2, 3, 2], [2, 3])', '3'),
      t.eq('count_allowed([], [1])', '0'),
      t.hidden('count_allowed([5, 5], [])', '0'),
      t.hidden('count_allowed(list(range(1000)), list(range(0, 1000, 2)))', '500'),
    ],
    hints: ['Convert once, before the loop: `set(allowed)`.', 'Then the loop body is unchanged.'],
    explanation: 'Building the set is O(m) once; each check is then O(1), so O(n + m) instead of O(n * m).',
    signature: 'set:optimize-membership',
    minutes: 4,
  }),
])

// ---------------------------------------------------------------------------
// 5. Contains Duplicate
// ---------------------------------------------------------------------------

const containsDuplicate = section('o2-contains-duplicate', 'Contains Duplicate', 'Brute force first, then a seen-set with early return.', [
  write({
    id: 'o2-dup-brute',
    title: 'Write: duplicate check, brute force',
    skills: ['range', 'list_index', 'early_return', 'conditionals'],
    prompt: 'Write `has_dup_slow(nums)` that returns True if any value appears twice. Use two nested loops over indexes, comparing every pair `i < j`. This is the O(n²) baseline you will beat.',
    starterCode: `def has_dup_slow(nums):
    pass`,
    solution: `def has_dup_slow(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`,
    tests: [t.eq('has_dup_slow([1, 2, 1])', 'True'), t.eq('has_dup_slow([1, 2, 3])', 'False'), t.hidden('has_dup_slow([])', 'False'), t.hidden('has_dup_slow([7])', 'False')],
    hints: ['Inner loop starts at `i + 1` so an item is never compared with itself.'],
    explanation: 'About n²/2 comparisons. Every later rep in this section replaces the inner loop with one set lookup.',
    signature: 'dup:nested-loop',
    minutes: 4.5,
  }),
  output({
    id: 'o2-dup-trace',
    title: 'Trace: the seen-set',
    skills: ['set_membership', 'set_add', 'conditionals'],
    prompt: 'Predict the output.',
    code: `seen = set()
for num in [4, 1, 4, 7]:
    if num in seen:
        print('repeat', num)
    else:
        print('new', num)
        seen.add(num)
print(sorted(seen))`,
    expectedOutput: `new 4
new 1
repeat 4
new 7
[1, 4, 7]`,
    explanation: 'The set remembers every value already passed. The second 4 finds itself in it.',
    signature: 'trace:seen-set',
    minutes: 2,
  }),
  write({
    id: 'o2-dup-fill',
    title: 'Finish: the seen-set loop',
    skills: ['set_membership', 'set_add', 'early_return'],
    style: 'finish',
    stage: 'complete',
    prompt: 'The setup and the final return are written. Write the loop body: return True as soon as a value is seen for the second time, otherwise remember it.',
    starterCode: `def has_dup(nums):
    seen = set()
    for num in nums:
        pass  # check, then remember
    return False`,
    solution: `def has_dup(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`,
    tests: [t.eq('has_dup([1, 2, 1])', 'True'), t.eq('has_dup([1, 2, 3])', 'False'), t.hidden('has_dup([])', 'False'), t.hidden('has_dup([0, 0])', 'True')],
    hints: ['Check first, then add.', 'If you added first, every number would find itself.'],
    explanation: 'Check, then add: the set only ever contains values before the current one.',
    signature: 'seen-set:finish',
    important: true,
  }),
  capstone({
    id: 'cap-contains-duplicate',
    title: 'Capstone: Contains Duplicate',
    problemId: 'contains-duplicate',
    skills: ['set_create', 'set_add', 'set_membership', 'for_loop', 'early_return', 'hash_reasoning'],
    difficulty: 2,
    prompt: 'Given a list of integers `nums`, return `True` if any value appears at least twice, and `False` if every value is distinct.\n\nAim for one pass over the list.',
    starterCode: `def contains_duplicate(nums):
    pass`,
    solution: `def contains_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`,
    examples: [
      { input: 'nums = [1, 2, 3, 1]', output: 'True', note: '1 appears twice' },
      { input: 'nums = [1, 2, 3, 4]', output: 'False' },
      { input: 'nums = []', output: 'False', note: 'nothing can repeat' },
    ],
    tests: [
      t.eq('contains_duplicate([1, 2, 3, 1])', 'True'),
      t.eq('contains_duplicate([1, 2, 3, 4])', 'False'),
      t.hidden('contains_duplicate([])', 'False'),
      t.hidden('contains_duplicate([7])', 'False'),
      t.hidden('contains_duplicate([-1, -1])', 'True'),
      t.hidden('contains_duplicate([3, -3])', 'False'),
      t.hidden('contains_duplicate([0, 1, 2, 3, 0])', 'True'),
      t.hidden('contains_duplicate(list(range(1000)))', 'False'),
      t.hidden('contains_duplicate(list(range(1000)) + [999])', 'True'),
    ],
    hints: [
      'You need to remember which values you have already passed.',
      'A set gives O(1) "have I seen this?" checks.',
      'For each num: if it is in the set, you are done; otherwise add it.',
      'seen = set(); loop; check then add; return False after the loop.',
    ],
    complexity: { time: 'O(n)', space: 'O(n)' },
    explanation: 'One pass with a set: each check and add is O(1) on average, so the whole scan is O(n), trading O(n) memory for avoiding the O(n^2) pair comparison.',
    signature: 'capstone:contains-duplicate',
    minutes: 20,
  }),
  write({
    id: 'o2-dup-write-test',
    title: 'Write a test: break the adjacent check',
    skills: ['edge_cases', 'list_create'],
    style: 'write-test',
    stage: 'debug',
    prompt: "Someone wrote this duplicate check:\n\n```python\ndef has_dup_adjacent(nums):\n    for i in range(len(nums) - 1):\n        if nums[i] == nums[i + 1]:\n            return True\n    return False\n```\n\nIt is already in the editor. Make `breaking_input()` return a list on which it gives the **wrong** answer.",
    starterCode: `def has_dup_adjacent(nums):
    for i in range(len(nums) - 1):
        if nums[i] == nums[i + 1]:
            return True
    return False

def breaking_input():
    pass`,
    solution: `def has_dup_adjacent(nums):
    for i in range(len(nums) - 1):
        if nums[i] == nums[i + 1]:
            return True
    return False

def breaking_input():
    return [1, 2, 1]`,
    tests: [t.check('the input breaks has_dup_adjacent', 'nums = breaking_input()\nassert has_dup_adjacent(nums) != (len(set(nums)) < len(nums)), "has_dup_adjacent gets this input right"')],
    hints: ['It only compares neighbours.', 'Put the two equal values apart.'],
    explanation: 'Comparing neighbours only works on sorted input. A good test targets the assumption the code silently makes.',
    signature: 'write-test:adjacent-dup',
    minutes: 3,
  }),
  debug({
    id: 'o2-dbg-dup-add-first',
    title: 'Debug: duplicate check says True too often',
    skills: ['set_membership', 'set_add', 'early_return'],
    prompt: '`has_dup(nums)` should return True only if some value appears at least twice.',
    brokenCode: `def has_dup(nums):
    seen = set()
    for num in nums:
        seen.add(num)
        if num in seen:
            return True
    return False`,
    solution: `def has_dup(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`,
    tests: [t.eq('has_dup([1, 2, 3])', 'False'), t.eq('has_dup([4, 4])', 'True'), t.hidden('has_dup([])', 'False'), t.hidden('has_dup([9])', 'False')],
    hints: ['What is in `seen` at the moment of the check, on the very first number?'],
    explanation: 'Adding before checking means every number finds itself. Check first, then add.',
    signature: 'debug:add-before-check',
    minutes: 3,
  }),
  explain({
    id: 'o2-cap-contains-duplicate-explain',
    title: 'Explain: Contains Duplicate',
    skills: ['explanation', 'complexity', 'hash_reasoning', 'edge_cases'],
    prompt: 'Explain your Contains Duplicate solution as you would to an interviewer: the approach, why it is correct, its time and space complexity, and the edge cases you checked.',
    rubric: [
      'Names the brute force (compare every pair, O(n^2)) and why a set improves it',
      'States the invariant: seen holds exactly the values before the current index',
      'O(n) time, O(n) space, and why set membership is O(1) on average',
      'Mentions edge cases: empty list, single item, negatives',
      'Mentions the alternative len(set(nums)) != len(nums) and that it cannot stop early',
    ],
    signature: 'interview:contains-duplicate',
    minutes: 4,
  }),
])

// ---------------------------------------------------------------------------
// 6. Dictionaries
// ---------------------------------------------------------------------------

const dictionaries = section('o2-dictionaries', 'Dictionaries', 'Create, assign, overwrite, look up, KeyError, and in (keys only).', [
  output({
    id: 'o2-dict-assign-trace',
    title: 'Trace: assign, overwrite, look up',
    skills: ['dict_create', 'dict_assign', 'dict_lookup', 'len'],
    prompt: 'Predict the output.',
    code: `stock = {}
stock['apple'] = 3
stock['pear'] = 5
stock['apple'] = 10
print(stock)
print(stock['pear'])
print(len(stock))`,
    expectedOutput: `{'apple': 10, 'pear': 5}
5
2`,
    note: '`d[key] = value` adds the key if new, or **replaces** the old value. `d[key]` reads it. Keys are unique.',
    explanation: "Assigning to 'apple' again overwrites 3 with 10; it does not add a second 'apple'. The key keeps its original position.",
    signature: 'trace:dict-assign-overwrite',
    minutes: 2,
    important: true,
  }),
  write({
    id: 'o2-dict-squares-map',
    title: 'Write: build a dict in a loop',
    skills: ['dict_create', 'dict_assign', 'range'],
    prompt: 'Write `squares_map(n)` that returns a dict mapping each number 1..n to its square.\n\n`squares_map(3)` → `{1: 1, 2: 4, 3: 9}`',
    starterCode: `def squares_map(n):
    pass`,
    solution: `def squares_map(n):
    out = {}
    for k in range(1, n + 1):
        out[k] = k * k
    return out`,
    tests: [t.eq('squares_map(3)', '{1: 1, 2: 4, 3: 9}'), t.eq('squares_map(0)', '{}'), t.hidden('squares_map(1)', '{1: 1}')],
    hints: ['Start with `{}`.', 'Assign `out[k] = k * k` inside the loop.'],
    explanation: 'Empty dict, loop, assign by key: the shape of every dict you will build today.',
    signature: 'dict:build-loop',
    important: true,
  }),
  output({
    id: 'o2-dict-in-keys',
    title: 'Trace: in checks keys',
    skills: ['dict_membership'],
    prompt: 'Predict the output.',
    code: `d = {'x': 1, 'y': 2}
print('x' in d)
print(1 in d)
print(2 in d.values())`,
    expectedOutput: `True
False
True`,
    note: '`key in d` checks **keys only**. To search values, use `in d.values()` (slow: O(n)).',
    explanation: '1 is a value, not a key, so `1 in d` is False. Key checks are O(1); value checks scan.',
    signature: 'trace:dict-in-keys',
    important: true,
  }),
  debug({
    id: 'o2-dbg-keyerror',
    title: 'Debug: stock lookup',
    skills: ['dict_lookup', 'dict_membership'],
    prompt: '`stock_of(stock, item)` should return how many of `item` are in stock. Items that are not listed have 0.',
    brokenCode: `def stock_of(stock, item):
    return stock[item]`,
    solution: `def stock_of(stock, item):
    if item in stock:
        return stock[item]
    return 0`,
    tests: [t.eq("stock_of({'nut': 4}, 'nut')", '4'), t.eq("stock_of({'nut': 4}, 'bolt')", '0'), t.hidden("stock_of({}, 'x')", '0')],
    hints: ['What does `d[key]` do when the key is missing?', 'Guard it with `in` (or use `.get`).'],
    explanation: 'Square-bracket lookup never invents a value: a missing key is a KeyError. Check with `in` first.',
    signature: 'debug:dict-keyerror',
    minutes: 2.5,
  }),
  write({
    id: 'o2-dict-safe-lookup',
    title: 'Write: lookup guarded by in',
    skills: ['dict_membership', 'dict_lookup', 'conditionals'],
    prompt: 'Write `lookup_or(d, key, fallback)` that returns `d[key]` if the key exists, otherwise `fallback`. Use `in` (not `.get()`) this time.',
    starterCode: `def lookup_or(d, key, fallback):
    pass`,
    solution: `def lookup_or(d, key, fallback):
    if key in d:
        return d[key]
    return fallback`,
    tests: [t.eq("lookup_or({'a': 1}, 'a', 0)", '1'), t.eq("lookup_or({'a': 1}, 'b', 0)", '0'), t.hidden("lookup_or({}, 'x', 'none')", "'none'"), t.hidden("lookup_or({'a': None}, 'a', 5)", 'None')],
    hints: ['Check the key before using square brackets.'],
    explanation: 'Guarding `d[key]` with `key in d` avoids the KeyError. Note a stored None is still a present key.',
    signature: 'dict:guarded-lookup',
  }),
  debug({
    id: 'o2-dbg-in-values',
    title: 'Debug: does any value match?',
    skills: ['dict_membership', 'dict_items'],
    prompt: '`has_value(d, target)` should return True if some **value** in the dict equals target.',
    brokenCode: `def has_value(d, target):
    return target in d`,
    solution: `def has_value(d, target):
    return target in d.values()`,
    tests: [t.eq("has_value({'a': 1, 'b': 2}, 2)", 'True'), t.eq("has_value({'a': 1}, 'a')", 'False'), t.hidden('has_value({}, 0)', 'False')],
    hints: ['What does `in` test on a dict?'],
    explanation: '`in d` checks keys only. Values need `d.values()`, and that check scans: O(n).',
    signature: 'debug:in-keys-not-values',
    minutes: 2.5,
  }),
  write({
    id: 'o2-dict-invert',
    title: 'Write: swap keys and values',
    skills: ['dict_items', 'dict_assign', 'dict_create'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `invert(d)` that returns a new dict where each value becomes a key and each key becomes its value. Values in `d` are distinct.',
    starterCode: `def invert(d):
    pass`,
    solution: `def invert(d):
    out = {}
    for key, value in d.items():
        out[value] = key
    return out`,
    tests: [t.eq("invert({'a': 1, 'b': 2})", "{1: 'a', 2: 'b'}"), t.eq('invert({})', '{}'), t.hidden("invert({'x': 'y'})", "{'y': 'x'}")],
    hints: ['Loop over key-value pairs with `.items()`.', 'Assign into a new dict with the roles swapped.'],
    explanation: 'Building a new dict from `.items()` is the template for every "re-key this data" transformation.',
    signature: 'dict:invert',
    minutes: 3.5,
  }),
])

// ---------------------------------------------------------------------------
// 7. .get()
// ---------------------------------------------------------------------------

const getSection = section('o2-get', '.get()', 'Read without crashing: d.get(key) and d.get(key, default), in many shapes.', [
  output({
    id: 'o2-get-trace',
    title: 'Trace: .get with and without default',
    skills: ['dict_get'],
    prompt: 'Predict the output.',
    code: `d = {'a': 3, 'b': 0}
print(d.get('a'))
print(d.get('z'))
print(d.get('z', 0))
print(d.get('b', 5))
print(d)`,
    expectedOutput: `3
None
0
0
{'a': 3, 'b': 0}`,
    note: '`d.get(key)` returns None if the key is missing; `d.get(key, default)` returns default instead. It never raises and never inserts.',
    explanation: "The default is used only when the key is missing: 'b' exists with 0, so 0 wins over 5. The dict itself is unchanged.",
    signature: 'trace:get-default',
    minutes: 2,
    important: true,
  }),
  code({
    id: 'o2-get-line',
    title: 'Write one line: read with .get',
    skills: ['dict_get'],
    stage: 'recall',
    prompt: 'Write one line that sets `have` to how many of `name` are in the inventory, or `0` if it is not listed. Use `.get`.',
    starterCode: `inventory = {'bolt': 12, 'nut': 30}
name = 'screw'
# set have using .get
`,
    solution: `inventory = {'bolt': 12, 'nut': 30}
name = 'screw'
have = inventory.get(name, 0)`,
    tests: [t.check('have is 0', 'assert have == 0')],
    hints: ['`d.get(key, default)`'],
    explanation: '`inventory.get(name, 0)` reads safely: the variable `name`, not the string literal, is the key.',
    signature: 'recall:get-default',
    minutes: 1.5,
    difficulty: 1,
  }),
  write({
    id: 'o2-get-total-cost',
    title: 'Write: total with .get in a loop',
    skills: ['dict_get', 'accumulator', 'for_loop'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `total_cost(menu, order)`. `menu` maps item → price; `order` is a list of item names (repeats allowed). Items not on the menu cost 0. Use `.get`.',
    starterCode: `def total_cost(menu, order):
    pass`,
    solution: `def total_cost(menu, order):
    total = 0
    for item in order:
        total += menu.get(item, 0)
    return total`,
    tests: [
      t.eq("total_cost({'tea': 3, 'cake': 5}, ['tea', 'cake', 'tea'])", '11'),
      t.eq("total_cost({'tea': 3}, ['tea', 'soda'])", '3'),
      t.hidden("total_cost({'tea': 3}, [])", '0'),
      t.hidden("total_cost({}, ['x', 'y'])", '0'),
    ],
    hints: ['Accumulator over the order list.', 'Each item adds `menu.get(item, 0)`.'],
    explanation: '.get with a default removes the need for an if around every lookup, so unknown items just add 0.',
    signature: 'get:sum-lookups',
    minutes: 3.5,
  }),
  debug({
    id: 'o2-dbg-get-args',
    title: 'Debug: price list',
    skills: ['dict_get', 'list_append'],
    prompt: '`price_list(menu, items)` should return the price of each item, in order, using `-1` for items not on the menu.',
    brokenCode: `def price_list(menu, items):
    out = []
    for item in items:
        out.append(menu.get(-1, item))
    return out`,
    solution: `def price_list(menu, items):
    out = []
    for item in items:
        out.append(menu.get(item, -1))
    return out`,
    tests: [t.eq("price_list({'tea': 3}, ['tea', 'cake'])", '[3, -1]'), t.eq('price_list({}, [])', '[]'), t.hidden("price_list({'a': 0}, ['a'])", '[0]')],
    hints: ['Which argument of `.get` is the key and which is the default?'],
    explanation: '`.get(key, default)`: key first. Swapped, it looks up the key -1 and returns the item name as the "default".',
    signature: 'debug:get-arg-order',
    minutes: 3,
  }),
  fill({
    id: 'o2-get-count-fill',
    title: 'Fill: the counting default',
    skills: ['dict_get', 'dict_assign'],
    prompt: 'Fill the blank so `counts` ends up holding how many times each letter appears. (Next section you will write this line from memory.)',
    starterCode: `counts = {}
for ch in 'abca':
    counts[ch] = counts.get(ch, ____) + 1`,
    solution: `counts = {}
for ch in 'abca':
    counts[ch] = counts.get(ch, 0) + 1`,
    tests: [t.check('counts correct', "assert counts == {'a': 2, 'b': 1, 'c': 1}")],
    explanation: 'A letter seen for the first time has count 0 before this one, so the default is 0.',
    signature: 'fill:get-count-default',
    minutes: 1,
    important: true,
  }),
  write({
    id: 'o2-get-list-default',
    title: 'Write: group words by first letter',
    skills: ['dict_get', 'dict_membership', 'list_append', 'string_index'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: "Write `group_by_first(words)` that returns a dict mapping each first letter to the list of words starting with it, in input order. All words are non-empty.\n\n`group_by_first(['ant', 'bee', 'ape'])` → `{'a': ['ant', 'ape'], 'b': ['bee']}`",
    starterCode: `def group_by_first(words):
    pass`,
    solution: `def group_by_first(words):
    groups = {}
    for word in words:
        first = word[0]
        if first not in groups:
            groups[first] = []
        groups[first].append(word)
    return groups`,
    tests: [
      t.eq("group_by_first(['ant', 'bee', 'ape'])", "{'a': ['ant', 'ape'], 'b': ['bee']}"),
      t.eq('group_by_first([])', '{}'),
      t.hidden("group_by_first(['x'])", "{'x': ['x']}"),
      t.hidden("group_by_first(['cat', 'cow', 'cat'])", "{'c': ['cat', 'cow', 'cat']}"),
    ],
    hints: [
      'Each value in the dict is a list.',
      'Before appending, the key needs a list to append to.',
      "Either `if first not in groups: groups[first] = []` or `groups[first] = groups.get(first, []) + [word]`.",
    ],
    explanation: 'A list-valued dict needs the empty list created the first time a key appears, then `.append` on later visits. This is the adjacency-list shape used for graphs.',
    signature: 'get:group-into-lists',
    minutes: 6,
  }),
])

// ---------------------------------------------------------------------------
// 8. Iterating dicts
// ---------------------------------------------------------------------------

const iterDicts = section('o2-iter-dicts', 'Iterating dicts', 'Loop over keys, .values() and .items(); reason about key vs value.', [
  output({
    id: 'o2-iter-items',
    title: 'Trace: keys, values, items',
    skills: ['dict_items', 'conditionals'],
    prompt: 'Predict the output.',
    code: `stock = {'apple': 3, 'pear': 0, 'kiwi': 5}
for fruit in stock:
    print(fruit)
for n in stock.values():
    print(n)
for fruit, n in stock.items():
    if n > 0:
        print(fruit, n)`,
    expectedOutput: `apple
pear
kiwi
3
0
5
apple 3
kiwi 5`,
    note: '`for k in d` loops over keys, in insertion order. `.values()` gives values, `.items()` gives (key, value) pairs.',
    explanation: 'A plain for over a dict yields keys only. `.items()` pairs unpack into two loop variables.',
    signature: 'trace:dict-iter-items',
    minutes: 2,
    important: true,
  }),
  write({
    id: 'o2-iter-fill',
    title: 'Write: describe each pair',
    skills: ['dict_items', 'list_append'],
    prompt: "Write `describe(scores)` that returns a list of `'name=score'` strings, in the dict's order.\n\n`describe({'a': 1, 'b': 2})` → `['a=1', 'b=2']`",
    starterCode: `def describe(scores):
    pass`,
    solution: `def describe(scores):
    lines = []
    for name, score in scores.items():
        lines.append(name + '=' + str(score))
    return lines`,
    tests: [t.eq("describe({'a': 1, 'b': 2})", "['a=1', 'b=2']"), t.eq('describe({})', '[]'), t.hidden("describe({'zed': 0})", "['zed=0']")],
    hints: ['Two loop variables need `.items()`.', '`str(score)` turns the number into text.'],
    explanation: 'Two loop variables need `.items()`. Without it, `for name, score in scores` tries to unpack each key.',
    signature: 'dict-iter:items',
    important: true,
  }),
  write({
    id: 'o2-iter-keys-above',
    title: 'Write: keys whose value passes a test',
    skills: ['dict_items', 'conditionals', 'list_append'],
    prompt: "Write `keys_above(d, limit)` that returns a list of the keys whose value is greater than `limit`, in the dict's order.",
    starterCode: `def keys_above(d, limit):
    pass`,
    solution: `def keys_above(d, limit):
    out = []
    for key, value in d.items():
        if value > limit:
            out.append(key)
    return out`,
    tests: [t.eq("keys_above({'a': 5, 'b': 1, 'c': 9}, 4)", "['a', 'c']"), t.eq("keys_above({'a': 1}, 1)", '[]'), t.hidden('keys_above({}, 0)', '[]')],
    hints: ['You need the value for the test but return the key.', 'Loop with `.items()`.'],
    explanation: 'Test on the value, collect the key: the key/value split is the whole point of iterating `.items()`.',
    signature: 'dict-iter:filter-keys',
    minutes: 4,
  }),
  debug({
    id: 'o2-dbg-items-unpack',
    title: 'Debug: total score',
    skills: ['dict_items', 'accumulator'],
    prompt: '`total_score(scores)` should return the sum of all scores in a name → score dict.',
    brokenCode: `def total_score(scores):
    total = 0
    for name, score in scores:
        total += score
    return total`,
    solution: `def total_score(scores):
    total = 0
    for name, score in scores.items():
        total += score
    return total`,
    tests: [t.eq("total_score({'ann': 3, 'bo': 4})", '7'), t.eq('total_score({})', '0'), t.hidden("total_score({'x': -2})", '-2')],
    hints: ['What does a plain `for` over a dict give you?'],
    explanation: "Looping a dict yields keys. Unpacking the key 'ann' into two names fails; `.items()` yields the pairs.",
    signature: 'debug:missing-items',
    minutes: 3,
  }),
])

// ---------------------------------------------------------------------------
// 9. Frequency maps
// ---------------------------------------------------------------------------

const frequency = section('o2-frequency', 'Frequency maps', 'counts[x] = counts.get(x, 0) + 1, then use the counts.', [
  output({
    id: 'o2-freq-trace',
    title: 'Trace: a frequency map grows',
    skills: ['frequency_map', 'dict_get', 'string_iterate'],
    prompt: 'Predict the output.',
    code: `counts = {}
for ch in 'abca':
    counts[ch] = counts.get(ch, 0) + 1
    print(counts)`,
    expectedOutput: `{'a': 1}
{'a': 1, 'b': 1}
{'a': 1, 'b': 1, 'c': 1}
{'a': 2, 'b': 1, 'c': 1}`,
    note: 'Counting idiom: `counts[x] = counts.get(x, 0) + 1`. New keys start at 0, existing ones go up by 1.',
    explanation: "The second 'a' does not add a new key; it bumps the existing count to 2.",
    signature: 'trace:freq-map',
    minutes: 2,
    important: true,
  }),
  write({
    id: 'o2-freq-fill',
    title: 'Write: character counts',
    skills: ['frequency_map', 'dict_get', 'string_iterate'],
    prompt: "Write `char_counts(s)` that returns a dict mapping each character of `s` to how many times it appears. Write the counting line from memory.",
    starterCode: `def char_counts(s):
    pass`,
    solution: `def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts`,
    tests: [t.eq("char_counts('aab')", "{'a': 2, 'b': 1}"), t.eq("char_counts('')", '{}'), t.hidden("char_counts('zz z')", "{'z': 3, ' ': 1}")],
    hints: ['Empty dict, loop over the characters, one counting line, return.', '`counts[ch] = counts.get(ch, 0) + 1`'],
    explanation: 'Read the old count (0 if new), add one, store it back.',
    signature: 'freq-map:count-chars',
    important: true,
  }),
  debug({
    id: 'o2-dbg-freq-plus-eq',
    title: 'Debug: count letters',
    skills: ['frequency_map', 'dict_lookup'],
    prompt: '`count_letters(s)` should return a dict of how many times each character appears.',
    brokenCode: `def count_letters(s):
    counts = {}
    for ch in s:
        counts[ch] += 1
    return counts`,
    solution: `def count_letters(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts`,
    tests: [t.eq("count_letters('aba')", "{'a': 2, 'b': 1}"), t.eq("count_letters('')", '{}'), t.hidden("count_letters('xx')", "{'x': 2}")],
    hints: ['`+=` reads the old value first. What is the old value of a brand-new key?'],
    explanation: "`counts[ch] += 1` reads `counts[ch]` before writing, and a new key has no value yet: KeyError. `.get(ch, 0)` supplies the start.",
    signature: 'debug:plus-eq-new-key',
    minutes: 3,
  }),
  debug({
    id: 'o2-dbg-freq-overwrite',
    title: 'Debug: tally the numbers',
    skills: ['frequency_map', 'dict_assign'],
    prompt: '`tally(nums)` should return a dict mapping each number to how many times it appears.',
    brokenCode: `def tally(nums):
    counts = {}
    for num in nums:
        counts[num] = 1
    return counts`,
    solution: `def tally(nums):
    counts = {}
    for num in nums:
        counts[num] = counts.get(num, 0) + 1
    return counts`,
    tests: [t.eq('tally([2, 2, 5])', '{2: 2, 5: 1}'), t.eq('tally([7])', '{7: 1}'), t.hidden('tally([0, 0, 0])', '{0: 3}')],
    hints: ['What happens to the count the second time a number shows up?'],
    explanation: 'Plain assignment overwrites: every count is stuck at 1. Counting must read the old value and add to it.',
    signature: 'debug:count-overwrite',
    minutes: 2.5,
  }),
  write({
    id: 'o2-freq-words',
    title: 'Write: word counts',
    skills: ['frequency_map', 'dict_get', 'string_methods'],
    prompt: 'Write `word_counts(sentence)` that counts words separated by spaces. `sentence.split()` gives the list of words.',
    starterCode: `def word_counts(sentence):
    pass`,
    solution: `def word_counts(sentence):
    counts = {}
    for word in sentence.split():
        counts[word] = counts.get(word, 0) + 1
    return counts`,
    tests: [t.eq("word_counts('the cat the dog')", "{'the': 2, 'cat': 1, 'dog': 1}"), t.eq("word_counts('')", '{}'), t.hidden("word_counts('a a a')", "{'a': 3}")],
    hints: ['Split first, then count exactly as you count characters.'],
    explanation: 'Same counting line, different source of items: the frequency-map shape does not care what it counts.',
    signature: 'freq-map:count-words',
  }),
  debug({
    id: 'o2-dbg-get-no-default',
    title: 'Debug: count words by length',
    skills: ['frequency_map', 'dict_get', 'len'],
    prompt: '`count_by_length(words)` should return a dict mapping each word length to how many words have that length.',
    brokenCode: `def count_by_length(words):
    counts = {}
    for word in words:
        n = len(word)
        counts[n] = counts.get(n) + 1
    return counts`,
    solution: `def count_by_length(words):
    counts = {}
    for word in words:
        n = len(word)
        counts[n] = counts.get(n, 0) + 1
    return counts`,
    tests: [t.eq("count_by_length(['hi', 'yo', 'hey'])", '{2: 2, 3: 1}'), t.eq('count_by_length([])', '{}'), t.hidden("count_by_length(['a'])", '{1: 1}')],
    hints: ['What does `.get(key)` return for a missing key?'],
    explanation: '`.get(n)` without a default returns None for a new key, and `None + 1` is a TypeError. The default 0 is what makes counting work.',
    signature: 'debug:get-missing-default',
    minutes: 3,
  }),
  write({
    id: 'o2-freq-most-common',
    title: 'Write: most common value',
    skills: ['frequency_map', 'dict_items', 'accumulator'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `most_common(nums)` that returns the value that appears most often. `nums` is non-empty and exactly one value has the highest count.',
    starterCode: `def most_common(nums):
    pass`,
    solution: `def most_common(nums):
    counts = {}
    for num in nums:
        counts[num] = counts.get(num, 0) + 1
    best = None
    best_count = 0
    for num, count in counts.items():
        if count > best_count:
            best = num
            best_count = count
    return best`,
    tests: [t.eq('most_common([1, 3, 3, 2])', '3'), t.eq('most_common([7])', '7'), t.hidden('most_common([-1, -1, 4, 4, -1])', '-1'), t.hidden('most_common([5, 6, 6, 5, 6])', '6')],
    hints: ['Two phases: count, then pick.', 'Phase two is best-so-far over `counts.items()`.', 'Track both the best value and its count.'],
    explanation: 'Counting is O(n) and scanning the map is O(distinct), so the whole thing is O(n). Sorting would cost O(n log n).',
    signature: 'freq-map:argmax',
    minutes: 6,
    important: true,
  }),
  write({
    id: 'o2-freq-same-counts',
    title: 'Write: same items, same counts',
    skills: ['frequency_map', 'dict_get', 'functions'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `same_items(a, b)` that returns True if lists `a` and `b` contain the same values with the same counts, in any order. Write a small helper that builds a frequency map and use it twice. (Two dicts compare equal with `==` when they have the same keys and values, in any order.)',
    starterCode: `def counts_of(items):
    pass

def same_items(a, b):
    pass`,
    solution: `def counts_of(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts

def same_items(a, b):
    return counts_of(a) == counts_of(b)`,
    tests: [t.eq('same_items([1, 2, 2], [2, 1, 2])', 'True'), t.eq('same_items([1, 2, 2], [1, 1, 2])', 'False'), t.hidden('same_items([], [])', 'True'), t.hidden('same_items([1], [])', 'False'), t.hidden("same_items(['a', 'b'], ['b', 'a'])", 'True')],
    hints: ['Build one map per list.', 'Two dicts compare with `==`, regardless of key order.'],
    explanation: 'Factoring the counting into a helper keeps each piece tiny; comparing two frequency maps is the heart of Valid Anagram.',
    signature: 'freq-map:compare-two',
    minutes: 5,
    important: true,
  }),
  write({
    id: 'o2-freq-first-unique',
    title: 'Write: first character that appears once',
    skills: ['frequency_map', 'enumerate', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `first_unique(s)` that returns the index of the first character that appears exactly once in `s`, or `-1` if there is none.',
    starterCode: `def first_unique(s):
    pass`,
    solution: `def first_unique(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1`,
    tests: [t.eq("first_unique('leetcode')", '0'), t.eq("first_unique('aabbc')", '4'), t.hidden("first_unique('aabb')", '-1'), t.hidden("first_unique('')", '-1'), t.hidden("first_unique('z')", '0')],
    hints: ['One pass is not enough: you need the full counts first.', 'Pass 1 counts. Pass 2 walks the string with enumerate.', 'Return the first index whose count is 1.'],
    explanation: 'Two passes, both O(n). Counting first lets the second pass answer "does this appear once?" in O(1).',
    signature: 'freq-map:two-pass-first-unique',
    minutes: 6,
  }),
])

// ---------------------------------------------------------------------------
// 10. Valid Anagram
// ---------------------------------------------------------------------------

const validAnagram = section('o2-valid-anagram', 'Valid Anagram', 'Compare frequency maps; quick length check; the decrement variant.', [
  output({
    id: 'o2-anagram-sorted-trace',
    title: 'Trace: the sorting baseline',
    skills: ['sorting', 'string_iterate', 'len'],
    prompt: 'Predict the output.',
    code: `print(sorted('cab'))
print(sorted('listen') == sorted('silent'))
print(len('aab') == len('abb'), sorted('aab') == sorted('abb'))`,
    expectedOutput: `['a', 'b', 'c']
True
True False`,
    note: 'Anagrams use the same characters the same number of times. Same length is necessary, not sufficient.',
    explanation: '`sorted` on a string returns a list of characters. Sorting is one anagram test, at O(n log n); counting is O(n).',
    signature: 'trace:sorted-string',
  }),
  write({
    id: 'o2-anagram-fill',
    title: 'Finish: two maps, then compare',
    skills: ['frequency_map', 'dict_get', 'string_iterate'],
    style: 'finish',
    stage: 'complete',
    prompt: 'Two empty maps are set up. Count `s` into `a` and `t` into `b`, then return whether the strings are anagrams.',
    starterCode: `def is_anagram(s, t):
    a = {}
    b = {}
    # count s into a, t into b
    return False`,
    solution: `def is_anagram(s, t):
    a = {}
    b = {}
    for ch in s:
        a[ch] = a.get(ch, 0) + 1
    for ch in t:
        b[ch] = b.get(ch, 0) + 1
    return a == b`,
    tests: [t.eq("is_anagram('rat', 'tar')", 'True'), t.eq("is_anagram('rat', 'car')", 'False'), t.hidden("is_anagram('a', 'aa')", 'False'), t.hidden("is_anagram('', '')", 'True')],
    hints: ['Two counting loops, same line as before.', 'Equal maps mean every character has the same count.'],
    explanation: 'Equal maps mean every character has the same count in both strings.',
    signature: 'anagram:two-maps',
    minutes: 4,
  }),
  capstone({
    id: 'cap-valid-anagram',
    title: 'Capstone: Valid Anagram',
    problemId: 'valid-anagram',
    skills: ['frequency_map', 'dict_get', 'string_iterate', 'len', 'dict_items'],
    difficulty: 2,
    prompt: 'Given two strings `s` and `t`, return `True` if `t` uses exactly the same characters as `s`, each the same number of times (in any order), and `False` otherwise. Characters are case-sensitive.\n\nAim for O(n) time.',
    starterCode: `def is_anagram(s, t):
    pass`,
    solution: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in t:
        counts[ch] = counts.get(ch, 0) - 1
        if counts[ch] < 0:
            return False
    return True`,
    examples: [
      { input: "s = 'anagram', t = 'nagaram'", output: 'True' },
      { input: "s = 'rat', t = 'car'", output: 'False', note: "t has a 'c' that s does not" },
      { input: "s = 'aab', t = 'abb'", output: 'False', note: 'same letters, different counts' },
    ],
    tests: [
      t.eq("is_anagram('anagram', 'nagaram')", 'True'),
      t.eq("is_anagram('rat', 'car')", 'False'),
      t.hidden("is_anagram('', '')", 'True'),
      t.hidden("is_anagram('a', 'a')", 'True'),
      t.hidden("is_anagram('ab', 'a')", 'False'),
      t.hidden("is_anagram('aab', 'abb')", 'False'),
      t.hidden("is_anagram('listen', 'silent')", 'True'),
      t.hidden("is_anagram('aacc', 'ccac')", 'False'),
      t.hidden("is_anagram('abc', 'ABC')", 'False'),
    ],
    hints: [
      'Order does not matter; only how many of each character.',
      'A frequency map: character → count.',
      'Count s up and t down (or build two maps and compare with ==).',
      'Length check; count s; for each ch in t decrement and fail if below 0; return True.',
    ],
    complexity: { time: 'O(n)', space: 'O(k) for k distinct characters' },
    explanation: 'Counting characters is a single pass per string with O(1) dict updates. The length check plus "no count goes negative" guarantees every count ends at zero.',
    signature: 'capstone:valid-anagram',
    minutes: 20,
  }),
  write({
    id: 'o2-anagram-write-test',
    title: 'Write a test: break the set comparison',
    skills: ['edge_cases', 'tuples'],
    style: 'write-test',
    stage: 'debug',
    prompt: "This anagram check is in the editor:\n\n```python\ndef same_chars(s, t):\n    return set(s) == set(t)\n```\n\nMake `breaking_input()` return a pair `(s, t)` on which it gives the **wrong** answer.",
    starterCode: `def same_chars(s, t):
    return set(s) == set(t)

def breaking_input():
    pass`,
    solution: `def same_chars(s, t):
    return set(s) == set(t)

def breaking_input():
    return ('aab', 'ab')`,
    tests: [t.check('the pair breaks same_chars', "s, t = breaking_input()\nassert same_chars(s, t) != (sorted(s) == sorted(t)), 'same_chars gets this pair right'")],
    hints: ['A set forgets how many times each character appears.'],
    explanation: 'Sets keep which characters appear, not how many times. Anagrams need counts, which is why the frequency map is the right tool.',
    signature: 'write-test:anagram-set',
    minutes: 3,
  }),
  debug({
    id: 'o2-dbg-anagram-length',
    title: 'Debug: one map, count up then down',
    skills: ['frequency_map', 'dict_get', 'len', 'edge_cases'],
    prompt: '`is_anagram(s, t)` should return True exactly when `t` uses the same characters as `s`, each the same number of times. It counts `s` up and `t` down in one map.',
    brokenCode: `def is_anagram(s, t):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in t:
        counts[ch] = counts.get(ch, 0) - 1
        if counts[ch] < 0:
            return False
    return True`,
    solution: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in t:
        counts[ch] = counts.get(ch, 0) - 1
        if counts[ch] < 0:
            return False
    return True`,
    tests: [t.eq("is_anagram('ab', 'a')", 'False'), t.eq("is_anagram('listen', 'silent')", 'True'), t.hidden("is_anagram('', '')", 'True'), t.hidden("is_anagram('a', 'ab')", 'False')],
    hints: ['Try `s` longer than `t`. Does any count go negative?'],
    explanation: '"No count goes negative" only proves t ⊆ s. With equal lengths it also proves equality, so the length check is part of the algorithm.',
    signature: 'debug:anagram-length',
    minutes: 4,
  }),
  explain({
    id: 'o2-cap-valid-anagram-explain',
    title: 'Explain: Valid Anagram',
    skills: ['explanation', 'complexity', 'frequency_map', 'edge_cases'],
    prompt: 'Explain your Valid Anagram solution to an interviewer: approach, why it is correct, complexity, edge cases, and one alternative.',
    rubric: [
      'Describes counting characters with a dict (frequency map) and how .get(ch, 0) handles new keys',
      'Explains why the length check plus "no negative count" (or map equality) proves the answer',
      'O(n) time, O(k) space for k distinct characters',
      'Edge cases: empty strings, different lengths, same letters with different counts, case sensitivity',
      'Alternative: sorted(s) == sorted(t), O(n log n)',
    ],
    signature: 'interview:valid-anagram',
    minutes: 4,
  }),
])

// ---------------------------------------------------------------------------
// 11. Index maps
// ---------------------------------------------------------------------------

const indexMaps = section('o2-index-maps', 'Index maps', 'value → index while scanning; first vs last occurrence.', [
  output({
    id: 'o2-imap-trace',
    title: 'Trace: value → index',
    skills: ['index_map', 'enumerate'],
    prompt: 'Predict the output.',
    code: `where = {}
for i, num in enumerate([5, 7, 5, 9]):
    where[num] = i
print(where)
print(where[9])`,
    expectedOutput: `{5: 2, 7: 1, 9: 3}
3`,
    note: 'Index map: `seen[value] = i` while enumerating. The value is the key; the index is the stored value.',
    explanation: 'Assignment overwrites, so a repeated value ends with its **last** index. Keys keep the position where they were first inserted.',
    signature: 'trace:index-map',
    important: true,
  }),
  write({
    id: 'o2-imap-fill',
    title: 'Write: positions',
    skills: ['index_map', 'enumerate', 'dict_assign'],
    prompt: 'Write `positions(nums)` that returns a dict mapping each number to its index. If a number repeats, keep its **last** index.',
    starterCode: `def positions(nums):
    pass`,
    solution: `def positions(nums):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
    return seen`,
    tests: [t.eq('positions([4, 8])', '{4: 0, 8: 1}'), t.eq('positions([3, 3])', '{3: 1}'), t.hidden('positions([])', '{}'), t.hidden('positions([-1, 0, -1])', '{-1: 2, 0: 1}')],
    hints: ['enumerate for the index.', 'Key = the number, value = where it is.'],
    explanation: 'Key = the number, value = where it is. That direction lets you ask "where is X?" in O(1).',
    signature: 'index-map:last-seen',
    important: true,
  }),
  debug({
    id: 'o2-dbg-seen-direction',
    title: 'Debug: where is each number?',
    skills: ['index_map', 'enumerate', 'dict_assign'],
    prompt: '`positions_of(nums)` should return a dict so that `positions_of(nums)[x]` is the index where `x` appears (last occurrence wins).',
    brokenCode: `def positions_of(nums):
    seen = {}
    for i, num in enumerate(nums):
        seen[i] = num
    return seen`,
    solution: `def positions_of(nums):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
    return seen`,
    tests: [t.eq('positions_of([7, 9])', '{7: 0, 9: 1}'), t.eq('positions_of([7, 9])[9]', '1'), t.hidden('positions_of([5, 5])', '{5: 1}')],
    hints: ['Which one should be the key: the thing you look up, or the thing you get back?'],
    explanation: 'You look up by number, so the number is the key: `seen[num] = i`. The reverse map is just the list itself.',
    signature: 'debug:index-map-direction',
    minutes: 2.5,
  }),
  write({
    id: 'o2-imap-first-code',
    title: 'Write: first positions',
    skills: ['index_map', 'enumerate', 'dict_membership'],
    prompt: 'Write `first_positions(words)` that maps each word to the index where it **first** appears.',
    starterCode: `def first_positions(words):
    pass`,
    solution: `def first_positions(words):
    first = {}
    for i, word in enumerate(words):
        if word not in first:
            first[word] = i
    return first`,
    tests: [t.eq("first_positions(['a', 'b', 'a'])", "{'a': 0, 'b': 1}"), t.eq('first_positions([])', '{}'), t.hidden("first_positions(['x', 'x', 'x'])", "{'x': 0}")],
    hints: ['enumerate for the index.', 'Only assign when the word is not already a key.'],
    explanation: 'The `not in` guard turns "last occurrence" into "first occurrence".',
    signature: 'index-map:first-seen',
    important: true,
  }),
  write({
    id: 'o2-imap-widest',
    title: 'Write: widest gap between equal values',
    skills: ['index_map', 'enumerate', 'dict_membership', 'accumulator'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `widest_gap(nums)` that returns the largest `j - i` such that `nums[i] == nums[j]` and `i < j`. Return 0 if no value repeats. Do it in one pass.',
    starterCode: `def widest_gap(nums):
    pass`,
    solution: `def widest_gap(nums):
    first = {}
    best = 0
    for i, num in enumerate(nums):
        if num in first:
            best = max(best, i - first[num])
        else:
            first[num] = i
    return best`,
    tests: [t.eq('widest_gap([1, 2, 3, 1, 2])', '3'), t.eq('widest_gap([1, 2, 3])', '0'), t.hidden('widest_gap([])', '0'), t.hidden('widest_gap([7, 7, 7, 7])', '3'), t.hidden('widest_gap([4, 1, 1, 9, 4])', '4')],
    hints: [
      'For each value, the widest pair uses its first occurrence.',
      'Keep a first-index map.',
      'When you see a value again, `i - first[num]` is a candidate.',
      'Store only on first sight; update best on repeats.',
    ],
    explanation: 'The first-index map answers "how far back did this value start?" in O(1), turning an O(n^2) pair search into O(n).',
    signature: 'index-map:first-seen-distance',
    minutes: 6,
  }),
  debug({
    id: 'o2-dbg-closest-repeat',
    title: 'Debug: closest repeat',
    skills: ['index_map', 'enumerate', 'dict_membership'],
    prompt: '`closest_repeat(nums)` should return the smallest `j - i` with `i < j` and `nums[i] == nums[j]`, or `-1` if nothing repeats.',
    brokenCode: `def closest_repeat(nums):
    last = {}
    best = -1
    for i, num in enumerate(nums):
        if num in last:
            gap = i - last[num]
            if best == -1 or gap < best:
                best = gap
        else:
            last[num] = i
    return best`,
    solution: `def closest_repeat(nums):
    last = {}
    best = -1
    for i, num in enumerate(nums):
        if num in last:
            gap = i - last[num]
            if best == -1 or gap < best:
                best = gap
        last[num] = i
    return best`,
    tests: [t.eq('closest_repeat([1, 2, 1, 1])', '1'), t.eq('closest_repeat([1, 2, 3])', '-1'), t.hidden('closest_repeat([4, 0, 4, 0])', '2'), t.hidden('closest_repeat([])', '-1')],
    hints: ['Trace `[1, 2, 1, 1]`: which index is stored for 1 when you reach index 3?', 'For the closest pair you want the most recent occurrence.'],
    explanation: 'Widest gap wants the first index (store once); closest gap wants the latest (store every time). Same map, opposite update rule.',
    signature: 'debug:index-map-first-vs-last',
    minutes: 4,
  }),
])

// ---------------------------------------------------------------------------
// 12. Complements
// ---------------------------------------------------------------------------

const complements = section('o2-complements', 'Complements', 'complement = target - num, and asking "have I seen it?" with a set.', [
  write({
    id: 'o2-comp-write',
    title: 'Write: list the complements',
    skills: ['complement', 'list_append', 'for_loop'],
    prompt: 'Write `complements(nums, target)` that returns, for each number, the value that would complete it to `target`.\n\n`complements([2, 7, 4], 9)` → `[7, 2, 5]`',
    starterCode: `def complements(nums, target):
    pass`,
    solution: `def complements(nums, target):
    out = []
    for num in nums:
        out.append(target - num)
    return out`,
    tests: [t.eq('complements([2, 7, 4], 9)', '[7, 2, 5]'), t.eq('complements([], 1)', '[]'), t.hidden('complements([11], 9)', '[-2]')],
    hints: ['`target - num` is what is still needed.'],
    note: '`complement = target - num`: the value that, added to num, gives target. It can be negative.',
    explanation: 'Complements can be negative when num is larger than target. 2 and 7 are each other\'s complements.',
    signature: 'complement:list',
    minutes: 3,
  }),
  write({
    id: 'o2-comp-nested',
    title: 'Write: pair check, brute force',
    skills: ['range', 'for_loop', 'complement', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `pair_exists_slow(nums, target)` that returns True if two **different positions** i < j have `nums[i] + nums[j] == target`. Use two nested loops over indexes; this is the baseline to beat.',
    starterCode: `def pair_exists_slow(nums, target):
    pass`,
    solution: `def pair_exists_slow(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return True
    return False`,
    tests: [t.eq('pair_exists_slow([1, 4, 6], 10)', 'True'), t.eq('pair_exists_slow([5], 10)', 'False'), t.hidden('pair_exists_slow([5, 5], 10)', 'True'), t.hidden('pair_exists_slow([], 0)', 'False'), t.hidden('pair_exists_slow([1, 2, 3], 7)', 'False')],
    hints: ['Outer loop i over every index.', 'Inner loop j starts at `i + 1` so a number is never paired with itself.'],
    explanation: 'Starting j at i + 1 avoids using one element twice and checking pairs twice. It is O(n^2); the next reps make it O(n).',
    signature: 'pair-sum:nested-loop',
    minutes: 4.5,
  }),
  output({
    id: 'o2-comp-set-trace',
    title: 'Trace: complement against a seen-set',
    skills: ['complement', 'set_membership', 'set_add'],
    prompt: 'Predict the output.',
    code: `target = 10
seen = set()
for num in [3, 9, 7, 1]:
    need = target - num
    if need in seen:
        print('pair', need, num)
    seen.add(num)`,
    expectedOutput: `pair 3 7
pair 9 1`,
    explanation: 'At 7 the needed 3 is already in seen; at 1 the needed 9 is. Each pair is found when its second member arrives.',
    signature: 'trace:complement-set',
    minutes: 2,
    important: true,
  }),
  write({
    id: 'o2-comp-set-code',
    title: 'Optimize: pair check in one pass',
    skills: ['complement', 'set_membership', 'set_add', 'hash_reasoning'],
    style: 'optimize',
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Rewrite your `pair_exists_slow` as `has_pair(nums, target)`: same answer, one pass with a set, no nested loop.',
    starterCode: `def has_pair(nums, target):
    pass`,
    solution: `def has_pair(nums, target):
    seen = set()
    for num in nums:
        if target - num in seen:
            return True
        seen.add(num)
    return False`,
    tests: [t.eq('has_pair([1, 4, 6], 10)', 'True'), t.eq('has_pair([5], 10)', 'False'), t.hidden('has_pair([5, 5], 10)', 'True'), t.hidden('has_pair([], 0)', 'False'), t.hidden('has_pair([-3, 8, 3], 0)', 'True'), t.hidden('has_pair([1, 2, 3], 7)', 'False')],
    hints: [
      'For each num, which earlier value would complete it?',
      'Keep the earlier values in a set.',
      'Check `target - num in seen` before adding num.',
    ],
    explanation: 'Checking before adding means a single 5 cannot pair with itself for target 10, but two 5s can. O(n) time, O(n) space.',
    signature: 'pair-sum:seen-set',
    minutes: 5,
    important: true,
  }),
  debug({
    id: 'o2-dbg-comp-inverted',
    title: 'Debug: pair check finds pairs everywhere',
    skills: ['complement', 'set_membership', 'conditionals'],
    prompt: '`has_pair(nums, target)` should return True only if two different positions add up to target.',
    brokenCode: `def has_pair(nums, target):
    seen = set()
    for num in nums:
        if target - num not in seen:
            return True
        seen.add(num)
    return False`,
    solution: `def has_pair(nums, target):
    seen = set()
    for num in nums:
        if target - num in seen:
            return True
        seen.add(num)
    return False`,
    tests: [t.eq('has_pair([1, 2], 10)', 'False'), t.eq('has_pair([3, 7], 10)', 'True'), t.hidden('has_pair([], 4)', 'False')],
    hints: ['Read the condition out loud: "if the complement is NOT in seen, we found a pair"?'],
    explanation: 'An inverted membership test returns True on the first number. Say the condition in words before trusting it.',
    signature: 'debug:inverted-membership',
    minutes: 2.5,
  }),
  debug({
    id: 'o2-dbg-comp-self-pair',
    title: 'Debug: a number pairs with itself',
    skills: ['complement', 'set_membership', 'set_add'],
    prompt: '`has_pair(nums, target)` should return True only if two **different positions** add up to target.',
    brokenCode: `def has_pair(nums, target):
    seen = set()
    for num in nums:
        seen.add(num)
        if target - num in seen:
            return True
    return False`,
    solution: `def has_pair(nums, target):
    seen = set()
    for num in nums:
        if target - num in seen:
            return True
        seen.add(num)
    return False`,
    tests: [t.eq('has_pair([5], 10)', 'False'), t.eq('has_pair([5, 5], 10)', 'True'), t.hidden('has_pair([1, 3], 2)', 'False'), t.hidden('has_pair([2, 8], 10)', 'True')],
    hints: ['With `[5]` and target 10, what is in `seen` when 5 checks for its complement?'],
    explanation: 'Adding before checking lets a number find itself. Check first, then add: seen holds only earlier positions.',
    signature: 'debug:pair-self',
    minutes: 3,
  }),
])

// ---------------------------------------------------------------------------
// 13. Two Sum: bridge from enumerate + index map + complement
// ---------------------------------------------------------------------------

const twoSum = section('o2-two-sum', 'Two Sum', 'enumerate + index map + complement + membership, assembled step by step.', [
  output({
    id: 'o2-ts-trace-full',
    title: 'Trace: the whole algorithm',
    skills: ['index_map', 'complement', 'dict_membership', 'enumerate'],
    prompt: 'Predict every printed line.',
    code: `nums = [2, 11, 7, 15]
target = 9
seen = {}
for i, num in enumerate(nums):
    complement = target - num
    print(i, num, complement, complement in seen)
    if complement in seen:
        print('answer', [seen[complement], i])
        break
    seen[num] = i`,
    expectedOutput: `0 2 7 False
1 11 -2 False
2 7 2 True
answer [0, 2]`,
    explanation: 'At i = 2 the complement 2 is a key in seen (stored at index 0). The loop breaks, so 15 is never visited.',
    signature: 'trace:two-sum',
    minutes: 3,
    important: true,
  }),
  write({
    id: 'o2-ts-find-pair',
    title: 'Combine: find the pair of values',
    skills: ['complement', 'set_membership', 'set_add', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `find_pair(nums, target)` that returns `[earlier, later]`: the two **values** of the first pair (by the position of its second member) that sum to target, or `None` if there is none.',
    starterCode: `def find_pair(nums, target):
    pass`,
    solution: `def find_pair(nums, target):
    seen = set()
    for num in nums:
        complement = target - num
        if complement in seen:
            return [complement, num]
        seen.add(num)
    return None`,
    tests: [t.eq('find_pair([3, 9, 7, 1], 10)', '[3, 7]'), t.eq('find_pair([1, 2], 10)', 'None'), t.hidden('find_pair([5, 5], 10)', '[5, 5]'), t.hidden('find_pair([], 3)', 'None'), t.hidden('find_pair([-4, 2, 4], 0)', '[-4, 4]')],
    hints: ['You only need values, so a set is enough.', 'complement, membership check, then add.', 'Return `[complement, num]`: the complement came earlier.'],
    explanation: 'Values only need a set. The capstone wants indexes, which is why it upgrades the set to a dict: value → index.',
    signature: 'pair-sum:return-values',
    minutes: 5,
  }),
  write({
    id: 'o2-ts-modify',
    title: 'Modify: return indexes instead of values',
    skills: ['index_map', 'enumerate', 'complement', 'dict_membership', 'dict_lookup'],
    style: 'modify',
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'This returns the two **values** of the pair. Change it so it returns their **indexes** `[i, j]` with `i < j`, or `[]` if there is no pair. A set cannot remember where a value was; something else can.',
    starterCode: `def pair_indexes(nums, target):
    seen = set()
    for num in nums:
        complement = target - num
        if complement in seen:
            return [complement, num]
        seen.add(num)
    return []`,
    solution: `def pair_indexes(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    tests: [t.eq('pair_indexes([2, 7, 11], 9)', '[0, 1]'), t.eq('pair_indexes([1, 2], 9)', '[]'), t.hidden('pair_indexes([3, 3], 6)', '[0, 1]'), t.hidden('pair_indexes([5, 1, 4], 9)', '[0, 2]')],
    hints: ['You need the current index: enumerate.', 'Swap the set for a dict from value to index.', '`return [seen[complement], i]`, and store with `seen[num] = i`.'],
    explanation: 'Upgrading set → dict (value → index) is the only change between "is there a pair?" and Two Sum.',
    signature: 'pair-sum:modify-to-indexes',
    minutes: 4.5,
    important: true,
  }),
  capstone({
    id: 'cap-two-sum',
    title: 'Capstone: Two Sum',
    problemId: 'two-sum',
    skills: ['enumerate', 'index_map', 'dict_membership', 'dict_lookup', 'dict_assign', 'complement', 'hash_reasoning'],
    prompt: 'Given a list of integers `nums` and an integer `target`, return the indexes `[i, j]` (with `i < j`) of the two numbers that add up to target. Exactly one such pair exists, and you may not use the same position twice.\n\nAim for one pass.',
    starterCode: `def two_sum(nums, target):
    pass`,
    solution: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', note: '2 + 7 = 9' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', note: 'not [0, 0]: one position cannot be used twice' },
      { input: 'nums = [3, 3], target = 6', output: '[0, 1]' },
    ],
    tests: [
      t.eq('two_sum([2, 7, 11, 15], 9)', '[0, 1]'),
      t.eq('two_sum([3, 2, 4], 6)', '[1, 2]'),
      t.hidden('two_sum([3, 3], 6)', '[0, 1]'),
      t.hidden('two_sum([-3, 4, 3, 90], 0)', '[0, 2]'),
      t.hidden('two_sum([0, 4, 3, 0], 0)', '[0, 3]'),
      t.hidden('two_sum([1, 5], 6)', '[0, 1]'),
      t.hidden('two_sum([5, 75, 25], 100)', '[1, 2]'),
      t.hidden('two_sum([-1, -2, -3, -4, -5], -8)', '[2, 4]'),
    ],
    hints: [
      'For each number, the partner you need is fully determined.',
      'Remember where you saw each earlier number: a dict from value to index.',
      'complement = target - num; if complement in seen, return [seen[complement], i].',
      'enumerate; compute complement; check the dict; otherwise store seen[num] = i; check before storing.',
    ],
    complexity: { time: 'O(n)', space: 'O(n)' },
    explanation: 'The dict holds every earlier value with its index, so finding the partner is an O(1) lookup instead of an inner loop. Checking before storing guarantees the two indexes differ.',
    signature: 'capstone:two-sum',
    minutes: 25,
  }),
  write({
    id: 'o2-ts-write-test',
    title: 'Write a test: break store-before-check',
    skills: ['edge_cases', 'tuples'],
    style: 'write-test',
    stage: 'debug',
    prompt: "This Two Sum stores each number **before** checking for its complement:\n\n```python\ndef two_sum_store_first(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        seen[num] = i\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n    return []\n```\n\nMake `breaking_input()` return `(nums, target)` that has a valid answer but on which this function returns something wrong.",
    starterCode: `def two_sum_store_first(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
    return []

def breaking_input():
    pass`,
    solution: `def two_sum_store_first(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
    return []

def breaking_input():
    return ([3, 5, 1], 6)`,
    tests: [
      t.check(
        'the input breaks two_sum_store_first',
        "nums, target = breaking_input()\nassert any(nums[i] + nums[j] == target for i in range(len(nums)) for j in range(i + 1, len(nums))), 'pick an input that has a valid pair'\ngot = two_sum_store_first(nums, target)\nassert not (len(got) == 2 and got[0] < got[1] and nums[got[0]] + nums[got[1]] == target), 'it returned a valid pair for that input'",
      ),
    ],
    hints: ['When can a number be its own complement?', 'target = 2 * nums[0], with the real pair elsewhere.'],
    explanation: 'Storing first lets a number whose complement is itself (num * 2 == target) pair with its own index.',
    signature: 'write-test:store-before-check',
    minutes: 3,
  }),
  debug({
    id: 'o2-dbg-ts-store-indent',
    title: 'Debug: Two Sum never finds the pair',
    skills: ['index_map', 'dict_assign', 'enumerate'],
    prompt: '`two_sum(nums, target)` should return `[i, j]` (i < j) of the two numbers that add up to target, or `[]`.',
    brokenCode: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
            seen[num] = i
    return []`,
    solution: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    tests: [t.eq('two_sum([2, 7, 11], 9)', '[0, 1]'), t.eq('two_sum([1, 2], 9)', '[]'), t.hidden('two_sum([3, 3], 6)', '[0, 1]')],
    hints: ['Print `seen` at the end of each pass.', 'Which block does the store line belong to?'],
    explanation: 'Indented under the `if`, after a `return`, the store never runs, so `seen` stays empty. It belongs at loop level.',
    signature: 'debug:store-indentation',
    minutes: 3,
  }),
  explain({
    id: 'o2-cap-two-sum-explain',
    title: 'Explain: Two Sum',
    skills: ['explanation', 'complexity', 'hash_reasoning', 'edge_cases'],
    prompt: 'Explain your Two Sum solution as in an interview: brute force first, the improvement, the invariant, complexity and edge cases.',
    rubric: [
      'Brute force: check every pair with nested loops, O(n^2)',
      'Improvement: dict from value to index; complement = target - num looked up in O(1)',
      'Invariant: seen holds exactly the values (and indexes) before position i',
      'Why check before storing: an element cannot pair with itself; duplicates like [3, 3] still work',
      'O(n) time, O(n) space; mentions negatives and zeros work unchanged',
    ],
    signature: 'interview:two-sum',
    minutes: 4,
  }),
  write({
    id: 'o2-ts-pattern-count',
    title: 'Pattern: replace the nested loop',
    skills: ['hash_reasoning', 'frequency_map', 'complement', 'dict_get'],
    style: 'optimize',
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 4,
    prompt: 'This counts index pairs `i < j` with `nums[i] + nums[j] == target`, in O(n^2):\n\n```python\ndef count_pairs_slow(nums, target):\n    count = 0\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                count += 1\n    return count\n```\n\nWrite `count_pairs(nums, target)` in **one pass**. Instead of "is the complement seen?", ask "how many times has the complement been seen?"',
    starterCode: `def count_pairs(nums, target):
    pass`,
    solution: `def count_pairs(nums, target):
    counts = {}
    pairs = 0
    for num in nums:
        pairs += counts.get(target - num, 0)
        counts[num] = counts.get(num, 0) + 1
    return pairs`,
    tests: [
      t.eq('count_pairs([1, 5, 3, 3, 3], 6)', '4'),
      t.eq('count_pairs([2, 2, 2], 4)', '3'),
      t.hidden('count_pairs([], 5)', '0'),
      t.hidden('count_pairs([1, 2], 10)', '0'),
      t.hidden('count_pairs([0, 0], 0)', '1'),
      t.hidden('count_pairs([-1, 7, 1, -7], 0)', '2'),
    ],
    hints: [
      'Each later element pairs with every earlier element equal to its complement.',
      'A frequency map of the earlier elements answers "how many" in O(1).',
      '`pairs += counts.get(target - num, 0)`, then count num.',
      'Loop: add matches from the map, then record num. Order matters, same as Two Sum.',
    ],
    explanation: 'The hash-map pattern: whatever the inner loop searched for, store the earlier elements in a dict/set so the search becomes one lookup. O(n^2) becomes O(n) time with O(n) space.',
    signature: 'pattern:hash-replaces-nested-loop',
    minutes: 7,
    important: true,
  }),
])

// ---------------------------------------------------------------------------
// 14. Cold reps: from a bare signature, no scaffolding
// ---------------------------------------------------------------------------

const cold = section('o2-cold', 'Cold reps', 'Write from scratch: no starter beyond a signature.', [
  write({
    id: 'o2-cold-letter-counts',
    title: 'Cold: letter counts',
    skills: ['frequency_map', 'dict_get', 'string_iterate'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return a dict mapping each character of `s` to how many times it appears.',
    starterCode: `def letter_counts(s):
    pass`,
    solution: `def letter_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts`,
    tests: [t.eq("letter_counts('hello')", "{'h': 1, 'e': 1, 'l': 2, 'o': 1}"), t.hidden("letter_counts('')", '{}'), t.hidden("letter_counts('aaa')", "{'a': 3}")],
    signature: 'freq-map:count-chars',
    minutes: 4,
  }),
  write({
    id: 'o2-cold-tally',
    title: 'Cold: tally votes, then pick the winner',
    skills: ['frequency_map', 'dict_get', 'dict_items'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: '`votes` is a list of names. Return the name with the most votes. The winner is unique and the list is non-empty.',
    starterCode: `def winner(votes):
    pass`,
    solution: `def winner(votes):
    tally = {}
    for name in votes:
        tally[name] = tally.get(name, 0) + 1
    best = None
    for name, n in tally.items():
        if best is None or n > tally[best]:
            best = name
    return best`,
    tests: [t.eq("winner(['ann', 'bob', 'ann'])", "'ann'"), t.hidden("winner(['zed'])", "'zed'"), t.hidden("winner(['a', 'b', 'b', 'c', 'b', 'a'])", "'b'")],
    signature: 'freq-map:argmax',
    minutes: 6,
  }),
  write({
    id: 'o2-cold-first-index',
    title: 'Cold: first index of each value',
    skills: ['index_map', 'enumerate', 'dict_membership'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return a dict mapping each value in `nums` to the index where it first appears.',
    starterCode: `def first_index(nums):
    pass`,
    solution: `def first_index(nums):
    first = {}
    for i, num in enumerate(nums):
        if num not in first:
            first[num] = i
    return first`,
    tests: [t.eq('first_index([9, 4, 9, 1])', '{9: 0, 4: 1, 1: 3}'), t.hidden('first_index([])', '{}'), t.hidden('first_index([2, 2])', '{2: 0}')],
    signature: 'index-map:first-seen',
    minutes: 4,
  }),
  write({
    id: 'o2-cold-last-index',
    title: 'Cold: make an index',
    skills: ['index_map', 'enumerate', 'dict_assign'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return a dict mapping each value in `nums` to the index where it **last** appears.',
    starterCode: `def make_index(nums):
    pass`,
    solution: `def make_index(nums):
    index = {}
    for i, num in enumerate(nums):
        index[num] = i
    return index`,
    tests: [t.eq('make_index([9, 4, 9, 1])', '{9: 2, 4: 1, 1: 3}'), t.hidden('make_index([])', '{}'), t.hidden('make_index([5, 5, 5])', '{5: 2}')],
    signature: 'index-map:last-seen',
    minutes: 3.5,
  }),
  write({
    id: 'o2-cold-has-repeat',
    title: 'Cold: any repeats?',
    skills: ['set_create', 'set_add', 'set_membership', 'early_return'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return True if any item in `items` appears more than once. Stop as soon as you know.',
    starterCode: `def any_repeat(items):
    pass`,
    solution: `def any_repeat(items):
    seen = set()
    for item in items:
        if item in seen:
            return True
        seen.add(item)
    return False`,
    tests: [t.eq("any_repeat(['x', 'y', 'x'])", 'True'), t.hidden('any_repeat([])', 'False'), t.hidden('any_repeat([1, 2, 3])', 'False'), t.hidden('any_repeat([0, 0])', 'True')],
    signature: 'seen-set:has-duplicate',
    minutes: 4,
  }),
  write({
    id: 'o2-cold-over-k',
    title: 'Cold: words seen more than k times',
    skills: ['frequency_map', 'dict_get', 'dict_items', 'sorting'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return a sorted list of the words in `words` that appear more than `k` times.',
    starterCode: `def over_k(words, k):
    pass`,
    solution: `def over_k(words, k):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    out = []
    for w, n in counts.items():
        if n > k:
            out.append(w)
    return sorted(out)`,
    tests: [t.eq("over_k(['b', 'a', 'b', 'c', 'a', 'b'], 1)", "['a', 'b']"), t.hidden('over_k([], 0)', '[]'), t.hidden("over_k(['x'], 1)", '[]'), t.hidden("over_k(['y', 'x'], 0)", "['x', 'y']")],
    signature: 'freq-map:threshold',
    minutes: 5.5,
  }),
  write({
    id: 'o2-cold-anagram',
    title: 'Cold: same letters?',
    skills: ['frequency_map', 'dict_get', 'len'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return True if `a` and `b` contain exactly the same characters with the same counts.',
    starterCode: `def same_letters(a, b):
    pass`,
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
    return True`,
    tests: [t.eq("same_letters('below', 'elbow')", 'True'), t.hidden("same_letters('', '')", 'True'), t.hidden("same_letters('abc', 'abd')", 'False'), t.hidden("same_letters('aab', 'abb')", 'False')],
    signature: 'freq-map:anagram',
    minutes: 5.5,
  }),
  write({
    id: 'o2-cold-two-sum',
    title: 'Cold: pair indexes',
    skills: ['index_map', 'complement', 'enumerate', 'dict_membership'],
    stage: 'retrieval',
    repType: 'cold',
    difficulty: 3,
    prompt: 'Return `[i, j]` (i < j) where `nums[i] + nums[j] == target`. Exactly one answer exists. One pass.',
    starterCode: `def pair_sum(nums, target):
    pass`,
    solution: `def pair_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []`,
    tests: [t.eq('pair_sum([1, 8, 3, 6], 9)', '[0, 1]'), t.hidden('pair_sum([4, 4], 8)', '[0, 1]'), t.hidden('pair_sum([10, -2, 5, 7], 3)', '[1, 2]'), t.hidden('pair_sum([0, 9, 0], 0)', '[0, 2]')],
    signature: 'pair-sum:index-map',
    minutes: 6,
  }),
])

export const day: DayModule = {
  date: '2026-10-02',
  short: 'Foundation',
  title: 'Python fluency + hashing foundations',
  focus: 'Write list, loop, range, enumerate, set and dict code until it is automatic, then build frequency maps, index maps and complements into Contains Duplicate, Valid Anagram and Two Sum.',
  sections: [
    pythonRecall,
    loops,
    enumerateSection,
    sets,
    containsDuplicate,
    dictionaries,
    getSection,
    iterDicts,
    frequency,
    validAnagram,
    indexMaps,
    complements,
    twoSum,
    cold,
  ],
  capstones: ['contains-duplicate', 'valid-anagram', 'two-sum'],
}
