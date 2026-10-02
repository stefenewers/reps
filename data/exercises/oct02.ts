import type { DayModule, Exercise, Section } from '@/lib/types'
import { capstone, choice, code, explain, fill, output, reorder, t } from './build'

/**
 * October 2 – Foundation day.
 * Python syntax retrieval first (lists, loops, range, enumerate), then the
 * hashing primitives (sets, dicts, .get, iteration, frequency and index maps,
 * complements), each bridged to a capstone: Contains Duplicate, Valid Anagram,
 * Two Sum. Ends with cold reps written from a bare signature.
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
print(len(nums))`,
    expectedOutput: `5
2
6
4`,
    note: 'Indexes start at 0. `nums[-1]` is the last item. `len(nums)` is the count of items.',
    explanation: 'Index 2 is the third item. The last valid index is `len(nums) - 1`, which `-1` reaches directly.',
    signature: 'trace:list-index',
  }),
  output({
    id: 'o2-negative-index',
    title: 'Trace: negative indexes',
    skills: ['list_index', 'len'],
    prompt: 'Predict the output. Negative indexes count from the end.',
    code: `letters = ['p', 'y', 't', 'h', 'o', 'n']
print(letters[-2])
print(letters[len(letters) - 1])
print(letters[-6])`,
    expectedOutput: `o
n
p`,
    explanation: '`-1` is the last item, `-2` the one before it. For a list of length 6, `-6` is the same as index 0.',
    signature: 'trace:list-negative-index',
  }),
  choice({
    id: 'o2-index-error',
    title: 'Index past the end',
    skills: ['list_index', 'len'],
    prompt: 'What happens when this runs?',
    code: `nums = [4, 7]
print(nums[2])`,
    options: ['Prints 7', 'Prints None', 'IndexError: list index out of range', 'Prints 4'],
    answer: 2,
    explanation: 'A list of length 2 has indexes 0 and 1 only. Reading `nums[2]` raises IndexError. The last valid index is always `len(nums) - 1`.',
    signature: 'recognize:index-error',
  }),
  output({
    id: 'o2-append-trace',
    title: 'Trace: append',
    skills: ['list_append', 'len'],
    prompt: 'Predict the output.',
    code: `items = []
items.append(3)
items.append(1)
items.append(3)
print(items)
print(len(items))`,
    expectedOutput: `[3, 1, 3]
3`,
    note: '`.append(x)` adds x at the end and returns None. Lists keep duplicates and order.',
    explanation: 'Each append adds one item at the end, duplicates included, so the list grows to length 3.',
    signature: 'trace:list-append',
  }),
  output({
    id: 'o2-list-write',
    title: 'Trace: write by index',
    skills: ['list_index'],
    prompt: 'Predict the output.',
    code: `nums = [10, 20, 30]
nums[1] = 99
nums[-1] = nums[0] + 1
print(nums)`,
    expectedOutput: '[10, 99, 11]',
    explanation: '`nums[i] = value` replaces the item at i. The right side is evaluated first, so `nums[0] + 1` is 11.',
    signature: 'trace:list-assign-index',
  }),
  fill({
    id: 'o2-fill-last',
    title: 'Fill: the last item',
    skills: ['list_index'],
    prompt: 'Fill the blank so `last` holds the last item of `nums`, without hard-coding the position.',
    starterCode: `nums = [8, 3, 12, 5]
last = nums[____]`,
    solution: `nums = [8, 3, 12, 5]
last = nums[-1]`,
    tests: [t.check('last is 5', 'assert last == 5')],
    hints: ['Negative indexes count from the end.'],
    explanation: '`nums[-1]` works for any non-empty list, no matter its length.',
    signature: 'fill:list-last',
    important: true,
  }),
  code({
    id: 'o2-append-line',
    title: 'Write one line: append',
    skills: ['list_append'],
    stage: 'recall',
    prompt: 'Write one line that adds `5` to the end of `nums`.',
    starterCode: `nums = [3, 8]
# append 5 to the end of nums
`,
    solution: `nums = [3, 8]
nums.append(5)`,
    tests: [t.check('nums is [3, 8, 5]', 'assert nums == [3, 8, 5]')],
    hints: ['Lists have a method that adds one item at the end.'],
    explanation: '`nums.append(5)` changes the list in place. Do not write `nums = nums.append(5)`: append returns None.',
    signature: 'recall:list-append',
    minutes: 1.5,
    difficulty: 1,
  }),
  output({
    id: 'o2-return-vs-print',
    title: 'Trace: return a value',
    skills: ['functions'],
    prompt: 'Predict the output.',
    code: `def double(x):
    return x * 2

result = double(4)
print(result)
print(double(double(1)))`,
    expectedOutput: `8
4`,
    note: '`return` hands a value back to the caller. Nothing is printed unless you print it.',
    explanation: 'Calling `double(4)` prints nothing by itself; the value 8 is stored in `result`. `double(double(1))` is `double(2)`, which is 4.',
    signature: 'trace:function-return',
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
  output({
    id: 'o2-range-basic',
    title: 'Trace: range(stop) and range(start, stop)',
    skills: ['range'],
    prompt: 'Predict the output. `list(...)` turns a range into a visible list.',
    code: `print(list(range(4)))
print(list(range(2, 6)))
print(list(range(3, 3)))`,
    expectedOutput: `[0, 1, 2, 3]
[2, 3, 4, 5]
[]`,
    note: '`range(stop)` starts at 0. `range(start, stop)` starts at start. The stop value is never included.',
    explanation: 'range stops *before* stop. When start equals stop the range is empty.',
    signature: 'trace:range-1-2',
    important: true,
  }),
  output({
    id: 'o2-range-step',
    title: 'Trace: range with a step',
    skills: ['range'],
    prompt: 'Predict the output.',
    code: `print(list(range(0, 10, 4)))
print(list(range(10, 0, -3)))
print(list(range(5, 0, -1)))`,
    expectedOutput: `[0, 4, 8]
[10, 7, 4, 1]
[5, 4, 3, 2, 1]`,
    note: '`range(start, stop, step)`. A negative step counts down; stop is still excluded.',
    explanation: 'Counting down with step -1 from 5 stops before 0, so 0 is not included. To include 0 use `range(5, -1, -1)`.',
    signature: 'trace:range-3',
  }),
  choice({
    id: 'o2-range-offbyone',
    title: 'range off-by-one',
    skills: ['range'],
    prompt: 'Which call produces exactly 1, 2, 3, 4, 5?',
    options: ['range(5)', 'range(1, 5)', 'range(1, 6)', 'range(0, 6)'],
    answer: 2,
    explanation: 'The stop value is excluded, so to include 5 the stop must be 6. `range(5)` gives 0..4.',
    signature: 'recognize:range-bounds',
  }),
  output({
    id: 'o2-range-index-trace',
    title: 'Trace: range(len(nums))',
    skills: ['range', 'len', 'list_index'],
    prompt: 'Predict the output.',
    code: `nums = [7, 4, 9]
for i in range(len(nums)):
    print(i, nums[i])`,
    expectedOutput: `0 7
1 4
2 9`,
    explanation: '`range(len(nums))` gives every valid index, 0 to len-1, exactly once.',
    signature: 'trace:range-len-index',
  }),
  fill({
    id: 'o2-countdown',
    title: 'Fill: count down with range',
    skills: ['range', 'list_append'],
    prompt: '`countdown(n)` should return `[n, n-1, ..., 1]`. Fill in the range arguments.',
    starterCode: `def countdown(n):
    out = []
    for i in range(____):
        out.append(i)
    return out`,
    solution: `def countdown(n):
    out = []
    for i in range(n, 0, -1):
        out.append(i)
    return out`,
    tests: [t.eq('countdown(3)', '[3, 2, 1]'), t.eq('countdown(1)', '[1]'), t.hidden('countdown(0)', '[]')],
    hints: ['Three arguments: start, stop, step.', 'Start at n, step -1. Stop is excluded, so which stop makes 1 the last value?'],
    explanation: '`range(n, 0, -1)` starts at n and stops before 0, so 1 is the last value.',
    signature: 'fill:range-countdown',
  }),
  output({
    id: 'o2-accum-trace',
    title: 'Trace: running total',
    skills: ['accumulator', 'for_loop'],
    prompt: 'Predict the output.',
    code: `total = 0
for num in [4, -1, 6]:
    total += num
    print(total)
print('final', total)`,
    expectedOutput: `4
3
9
final 9`,
    note: 'An accumulator starts before the loop and is updated inside it: `total += num`.',
    explanation: 'The print inside the loop runs once per item and shows the running total after each update.',
    signature: 'trace:accumulator-sum',
  }),
  fill({
    id: 'o2-sum-fill',
    title: 'Fill: sum with an accumulator',
    skills: ['accumulator', 'for_loop'],
    prompt: 'Fill in the one line that updates the accumulator.',
    starterCode: `def total(nums):
    result = 0
    for num in nums:
        ____
    return result`,
    solution: `def total(nums):
    result = 0
    for num in nums:
        result += num
    return result`,
    tests: [t.eq('total([1, 2, 3])', '6'), t.eq('total([])', '0'), t.hidden('total([-5, 5, 2])', '2')],
    explanation: 'The accumulator lives outside the loop so it survives between iterations; `result += num` adds each item.',
    signature: 'fill:accumulator-sum',
  }),
  code({
    id: 'o2-count-evens',
    title: 'Write: count the evens',
    skills: ['accumulator', 'conditionals', 'for_loop'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Complete `count_evens(nums)` so it returns how many numbers in `nums` are even.',
    starterCode: `def count_evens(nums):
    count = 0
    # your loop here
    return count`,
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
  code({
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
  code({
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
    important: true,
  }),
  choice({
    id: 'o2-early-return-bug',
    title: 'Spot the early-return bug',
    skills: ['early_return', 'conditionals'],
    prompt: 'What does `has_negative([3, -1])` return?',
    code: `def has_negative(nums):
    for num in nums:
        if num < 0:
            return True
        else:
            return False`,
    options: ['True', 'False', 'None', 'It raises an error'],
    answer: 1,
    explanation: 'The else returns on the very first item (3), so -1 is never checked. The `return False` must go after the loop.',
    signature: 'recognize:early-return-else-bug',
  }),
  reorder({
    id: 'o2-squares-reorder',
    title: 'Reorder: build a list in a loop',
    skills: ['range', 'list_append', 'functions'],
    prompt: 'Put the lines in order so `squares(n)` returns `[1, 4, ..., n*n]`.',
    lines: ['def squares(n):', '    out = []', '    for i in range(1, n + 1):', '        out.append(i * i)', '    return out'],
    tests: [t.eq('squares(3)', '[1, 4, 9]'), t.eq('squares(0)', '[]')],
    explanation: 'Create the result list before the loop, append inside it, return after it. `range(1, n + 1)` includes n.',
    signature: 'reorder:build-list',
  }),
])

// ---------------------------------------------------------------------------
// 3. enumerate
// ---------------------------------------------------------------------------

const enumerateSection = section('o2-enumerate', 'enumerate', 'Index and value together: for i, x in enumerate(seq).', [
  choice({
    id: 'o2-enum-choice',
    title: 'What enumerate gives you',
    skills: ['enumerate'],
    prompt: "In `for i, x in enumerate(['a', 'b']):`, what are `i` and `x` on the first pass?",
    options: ["i is 0 and x is 'a'", "i is 1 and x is 'a'", "i is 'a' and x is 0", 'i is 0 and x is 0'],
    answer: 0,
    note: '`enumerate(seq)` yields `(index, item)` pairs starting at index 0. Index comes first.',
    explanation: 'The index comes first, then the value, and the index starts at 0.',
    signature: 'recognize:enumerate',
  }),
  output({
    id: 'o2-enum-trace',
    title: 'Trace: enumerate',
    skills: ['enumerate'],
    prompt: 'Predict the output.',
    code: `for i, ch in enumerate(['x', 'y', 'z']):
    print(i, ch)`,
    expectedOutput: `0 x
1 y
2 z`,
    explanation: 'Each pass unpacks one (index, item) pair into i and ch.',
    signature: 'trace:enumerate-print',
  }),
  fill({
    id: 'o2-enum-fill',
    title: 'Fill: the enumerate call',
    skills: ['enumerate', 'tuples', 'list_append'],
    prompt: 'Fill the blank so the function returns a list of `(index, word)` tuples.',
    starterCode: `def with_index(words):
    pairs = []
    for i, word in ____(words):
        pairs.append((i, word))
    return pairs`,
    solution: `def with_index(words):
    pairs = []
    for i, word in enumerate(words):
        pairs.append((i, word))
    return pairs`,
    tests: [t.eq("with_index(['a', 'b'])", "[(0, 'a'), (1, 'b')]"), t.eq('with_index([])', '[]')],
    explanation: 'enumerate supplies the index so you do not need range(len(words)) and words[i].',
    signature: 'fill:enumerate-call',
  }),
  code({
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
    important: true,
  }),
  code({
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
  reorder({
    id: 'o2-last-index-reorder',
    title: 'Reorder: last index of a value',
    skills: ['enumerate', 'accumulator'],
    prompt: 'Put the lines in order so `last_index_of(nums, target)` returns the index of the **last** occurrence, or -1.',
    lines: [
      'def last_index_of(nums, target):',
      '    result = -1',
      '    for i, num in enumerate(nums):',
      '        if num == target:',
      '            result = i',
      '    return result',
    ],
    tests: [t.eq('last_index_of([1, 2, 1], 1)', '2'), t.eq('last_index_of([3], 4)', '-1'), t.hidden('last_index_of([], 4)', '-1')],
    explanation: 'For the last occurrence you keep overwriting result instead of returning early: each later match replaces the earlier one.',
    signature: 'reorder:enumerate-last-index',
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
    id: 'o2-set-dedupe',
    title: 'Trace: duplicates disappear',
    skills: ['set_create', 'len', 'sorting'],
    prompt: 'Predict the output.',
    code: `s = set([3, 1, 3, 2, 1])
print(len(s))
print(sorted(s))`,
    expectedOutput: `3
[1, 2, 3]`,
    note: 'A set holds each value at most once. `sorted(s)` returns a sorted list.',
    explanation: 'Five values but only three distinct ones. `sorted` gives a list, which is how to print a set in a predictable order.',
    signature: 'trace:set-dedupe',
  }),
  output({
    id: 'o2-set-add-trace',
    title: 'Trace: add is idempotent',
    skills: ['set_add', 'len'],
    prompt: 'Predict the output.',
    code: `seen = set()
for x in [5, 2, 5, 5, 9]:
    seen.add(x)
    print(len(seen))`,
    expectedOutput: `1
2
2
2
3`,
    explanation: 'Adding a value that is already present does nothing, so the size only grows on new values.',
    signature: 'trace:set-add',
  }),
  output({
    id: 'o2-set-membership',
    title: 'Trace: in and not in',
    skills: ['set_membership'],
    prompt: 'Predict the output.',
    code: `colors = {'red', 'blue'}
print('red' in colors)
print('green' in colors)
print('green' not in colors)`,
    expectedOutput: `True
False
True`,
    explanation: '`x in s` is a boolean test; `not in` is its opposite.',
    signature: 'trace:set-membership',
  }),
  fill({
    id: 'o2-set-add-fill',
    title: 'Fill: add to a set',
    skills: ['set_add', 'for_loop'],
    prompt: 'Fill in the line that puts each number into the set.',
    starterCode: `def unique_sorted(nums):
    seen = set()
    for num in nums:
        ____
    return sorted(seen)`,
    solution: `def unique_sorted(nums):
    seen = set()
    for num in nums:
        seen.add(num)
    return sorted(seen)`,
    tests: [t.eq('unique_sorted([3, 1, 3])', '[1, 3]'), t.eq('unique_sorted([])', '[]')],
    explanation: 'Sets use `.add`, lists use `.append`. Mixing them up is a common slip.',
    signature: 'fill:set-add',
    important: true,
  }),
  code({
    id: 'o2-set-unique-count',
    title: 'Write one line: count distinct',
    skills: ['set_create', 'len'],
    stage: 'recall',
    prompt: 'Write one line that sets `count` to the number of **distinct** words.',
    starterCode: `words = ['a', 'b', 'a', 'c', 'b']
# set count to the number of distinct words
`,
    solution: `words = ['a', 'b', 'a', 'c', 'b']
count = len(set(words))`,
    tests: [t.check('count is 3', 'assert count == 3')],
    hints: ['Turn the list into a set, then measure it.'],
    explanation: '`len(set(words))` removes duplicates then counts what is left.',
    signature: 'recall:len-set',
    minutes: 1.5,
    difficulty: 1,
  }),
  code({
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
  choice({
    id: 'o2-set-why',
    title: 'Why set membership is fast',
    skills: ['hash_reasoning', 'set_membership'],
    prompt: 'Why is `x in a_set` much faster than `x in a_list` when there are a million items?',
    options: [
      'A set hashes x and jumps straight to where it would be: O(1) on average',
      'A set keeps its items sorted and binary searches: O(log n)',
      'A list checks from the end first',
      'There is no real difference',
    ],
    answer: 0,
    note: 'Hashing turns a value into a position. Lookup does not scan, so it is O(1) on average.',
    explanation: 'A list has to compare item by item (O(n)). A set computes hash(x) and looks in one bucket. Sets are not sorted.',
    signature: 'recognize:hash-lookup-cost',
    important: true,
  }),
])

// ---------------------------------------------------------------------------
// 5. Contains Duplicate
// ---------------------------------------------------------------------------

const containsDuplicate = section('o2-contains-duplicate', 'Contains Duplicate', 'A seen-set with early return replaces a nested loop.', [
  choice({
    id: 'o2-dup-nested',
    title: 'Cost of the nested loop',
    skills: ['hash_reasoning', 'complexity', 'range'],
    prompt: 'What is the time complexity of this duplicate check?',
    code: `def has_dup(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`,
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'],
    answer: 2,
    explanation: 'Every pair (i, j) is compared, about n*n/2 comparisons. A set brings this down to one pass.',
    signature: 'recognize:nested-loop-cost',
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
  fill({
    id: 'o2-dup-fill',
    title: 'Fill: the membership check',
    skills: ['set_membership', 'early_return'],
    prompt: 'Fill the condition so the function returns True as soon as it sees a value for the second time.',
    starterCode: `def has_dup(nums):
    seen = set()
    for num in nums:
        if ____:
            return True
        seen.add(num)
    return False`,
    solution: `def has_dup(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`,
    tests: [t.eq('has_dup([1, 2, 1])', 'True'), t.eq('has_dup([1, 2, 3])', 'False'), t.hidden('has_dup([])', 'False')],
    explanation: 'Check first, then add. If you added first, every number would find itself.',
    signature: 'fill:seen-set-check',
    important: true,
  }),
  reorder({
    id: 'o2-dup-reorder',
    title: 'Reorder: duplicate check',
    skills: ['set_create', 'set_add', 'set_membership', 'early_return'],
    prompt: 'Put the lines in order. The function returns True if any value repeats.',
    lines: [
      'def has_repeat(items):',
      '    seen = set()',
      '    for item in items:',
      '        if item in seen:',
      '            return True',
      '        seen.add(item)',
      '    return False',
    ],
    tests: [t.eq("has_repeat(['a', 'b', 'a'])", 'True'), t.eq('has_repeat([1, 2])', 'False'), t.hidden('has_repeat([])', 'False')],
    explanation: 'The set is created once before the loop. `return False` sits after the loop, at function level.',
    signature: 'reorder:seen-set',
    minutes: 2.5,
  }),
  code({
    id: 'o2-dup-first',
    title: 'Write: first value to repeat',
    skills: ['set_membership', 'set_add', 'early_return'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `first_repeat(nums)` that scans left to right and returns the first value that is seen for a second time, or `None` if nothing repeats.\n\nFor `[3, 1, 4, 1, 3]` the answer is 1: its second copy (index 3) appears before the second 3 (index 4).',
    starterCode: `def first_repeat(nums):
    pass`,
    solution: `def first_repeat(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return num
        seen.add(num)
    return None`,
    tests: [t.eq('first_repeat([3, 1, 4, 1, 3])', '1'), t.eq('first_repeat([1, 2])', 'None'), t.hidden('first_repeat([])', 'None'), t.hidden('first_repeat([5, 5])', '5'), t.hidden('first_repeat([-2, 0, -2])', '-2')],
    hints: ['Same shape as the duplicate check.', 'Return the value itself instead of True.'],
    explanation: 'The seen-set pattern returns at the first moment a repeat is detected, which is the earliest second occurrence.',
    signature: 'seen-set:first-repeat',
    minutes: 5,
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
    minutes: 22,
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
    minutes: 5,
  }),
])

// ---------------------------------------------------------------------------
// 6. Dictionaries
// ---------------------------------------------------------------------------

const dictionaries = section('o2-dictionaries', 'Dictionaries', 'Create, assign, overwrite, look up, KeyError, and in (keys only).', [
  output({
    id: 'o2-dict-lookup-trace',
    title: 'Trace: lookup by key',
    skills: ['dict_create', 'dict_lookup', 'len'],
    prompt: 'Predict the output.',
    code: `ages = {'ana': 20, 'bo': 31, 'cy': 27}
print(ages['bo'])
print(ages['ana'] + ages['cy'])
print(len(ages))`,
    expectedOutput: `31
47
3`,
    note: '`{key: value, ...}` makes a dict. `d[key]` reads the value. `len(d)` counts keys.',
    explanation: 'Dict lookup is by key, never by position. len counts key-value pairs.',
    signature: 'trace:dict-lookup',
  }),
  output({
    id: 'o2-dict-assign-trace',
    title: 'Trace: assign and overwrite',
    skills: ['dict_create', 'dict_assign', 'len'],
    prompt: 'Predict the output.',
    code: `stock = {}
stock['apple'] = 3
stock['pear'] = 5
stock['apple'] = 10
print(stock)
print(len(stock))`,
    expectedOutput: `{'apple': 10, 'pear': 5}
2`,
    note: '`d[key] = value` adds the key if new, or **replaces** the old value if it exists. Keys are unique.',
    explanation: "Assigning to 'apple' again overwrites 3 with 10; it does not add a second 'apple'. The key keeps its original position.",
    signature: 'trace:dict-assign-overwrite',
    important: true,
  }),
  choice({
    id: 'o2-dict-keyerror',
    title: 'Missing key with []',
    skills: ['dict_lookup'],
    prompt: 'What happens when this runs?',
    code: `ages = {'ana': 20}
print(ages['zed'])`,
    options: ['Prints None', 'Prints 0', "KeyError: 'zed'", 'Prints an empty line'],
    answer: 2,
    note: '`d[key]` on a missing key raises KeyError. Check with `in` first or use `.get()`.',
    explanation: 'Square-bracket lookup never invents a value. Use `in` or `.get()` when a key might be missing.',
    signature: 'recognize:dict-keyerror',
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
    explanation: "1 is a value, not a key, so `1 in d` is False. Key checks are O(1); value checks scan.",
    signature: 'trace:dict-in-keys',
    important: true,
  }),
  choice({
    id: 'o2-dict-in-choice',
    title: 'Which in is True?',
    skills: ['dict_membership'],
    prompt: 'Which expression is `True`?',
    code: `pets = {'cat': 'Tom', 'dog': 'Rex'}`,
    options: ["'Tom' in pets", "'cat' in pets", "'Rex' in pets", "('cat', 'Tom') in pets"],
    answer: 1,
    explanation: "Only keys are tested by `in`: 'cat' and 'dog'. 'Tom' and 'Rex' are values.",
    signature: 'recognize:dict-in-keys',
  }),
  code({
    id: 'o2-dict-assign-line',
    title: 'Write: add a key, overwrite another',
    skills: ['dict_assign'],
    stage: 'recall',
    prompt: "Write two lines: store `4` under the key `'kiwi'`, and change the value for `'pear'` to `5`.",
    starterCode: `prices = {'apple': 2, 'pear': 3}
# add kiwi -> 4, then set pear -> 5
`,
    solution: `prices = {'apple': 2, 'pear': 3}
prices['kiwi'] = 4
prices['pear'] = 5`,
    tests: [t.check('prices updated', "assert prices == {'apple': 2, 'pear': 5, 'kiwi': 4}")],
    hints: ['Same syntax for adding and for overwriting: `d[key] = value`.'],
    explanation: 'There is no separate "insert" vs "update" in a dict: assignment does both.',
    signature: 'recall:dict-assign',
    minutes: 1.5,
    difficulty: 1,
  }),
  output({
    id: 'o2-dict-intkeys',
    title: 'Trace: integer keys from a loop',
    skills: ['dict_assign', 'range', 'dict_lookup'],
    prompt: 'Predict the output.',
    code: `squares = {}
for n in range(1, 4):
    squares[n] = n * n
print(squares)
print(squares[3])`,
    expectedOutput: `{1: 1, 2: 4, 3: 9}
9`,
    explanation: 'Keys can be numbers. `squares[3]` looks up the key 3, it is not a position.',
    signature: 'trace:dict-build-loop',
  }),
  code({
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
  code({
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
    minutes: 4,
  }),
])

// ---------------------------------------------------------------------------
// 7. .get()
// ---------------------------------------------------------------------------

const getSection = section('o2-get', '.get()', 'Read without crashing: d.get(key) and d.get(key, default), in many shapes.', [
  choice({
    id: 'o2-get-missing-choice',
    title: '.get on a missing key',
    skills: ['dict_get'],
    prompt: 'What is `x` after this runs?',
    code: `d = {'a': 1}
x = d.get('z')`,
    options: ['None', '0', 'A KeyError is raised', "'z'"],
    answer: 0,
    note: '`d.get(key)` returns None if the key is missing. `d.get(key, default)` returns default instead. It never raises.',
    explanation: 'Without a second argument, .get falls back to None.',
    signature: 'recognize:get-none',
    important: true,
  }),
  output({
    id: 'o2-get-trace',
    title: 'Trace: .get with and without default',
    skills: ['dict_get'],
    prompt: 'Predict the output.',
    code: `d = {'a': 3, 'b': 0}
print(d.get('a'))
print(d.get('z'))
print(d.get('z', 0))
print(d.get('a', 100))`,
    expectedOutput: `3
None
0
3`,
    explanation: 'The default is used only when the key is missing. If the key exists, the stored value wins.',
    signature: 'trace:get-default',
    important: true,
  }),
  output({
    id: 'o2-get-falsy',
    title: 'Trace: a stored 0 still wins',
    skills: ['dict_get'],
    prompt: 'Predict the output.',
    code: `d = {'a': 0}
print(d.get('a', 5))
print(d.get('b', 5))`,
    expectedOutput: `0
5`,
    explanation: "'a' exists with value 0, so .get returns 0, not the default. The default is about missing keys, not falsy values.",
    signature: 'trace:get-falsy-value',
  }),
  output({
    id: 'o2-get-no-insert',
    title: 'Trace: .get does not insert',
    skills: ['dict_get', 'dict_membership'],
    prompt: 'Predict the output.',
    code: `d = {'a': 1}
x = d.get('q', 7)
print(x)
print(d)
print('q' in d)`,
    expectedOutput: `7
{'a': 1}
False`,
    explanation: '.get only reads. The dict is unchanged; to store you still need `d[key] = ...`.',
    signature: 'trace:get-no-insert',
  }),
  choice({
    id: 'o2-get-vs-bracket',
    title: 'Which update works on an empty dict?',
    skills: ['dict_get', 'dict_lookup'],
    prompt: '`counts = {}`. Which line runs without error?',
    options: ["counts['a'] = counts['a'] + 1", "counts['a'] = counts.get('a', 0) + 1", "counts['a'] += 1", "counts.get('a') += 1"],
    answer: 1,
    explanation: "Both `counts['a'] + 1` and `+= 1` read the missing key first and raise KeyError. You cannot assign to a call like `counts.get('a')`.",
    signature: 'recognize:get-increment',
    important: true,
  }),
  fill({
    id: 'o2-get-default-fill',
    title: 'Fill: a non-zero default',
    skills: ['dict_get'],
    prompt: 'Unknown items cost `-1`. Fill the blank.',
    starterCode: `def price_of(menu, item):
    return menu.get(item, ____)`,
    solution: `def price_of(menu, item):
    return menu.get(item, -1)`,
    tests: [t.eq("price_of({'tea': 3}, 'tea')", '3'), t.eq("price_of({'tea': 3}, 'cake')", '-1'), t.hidden('price_of({}, 0)', '-1')],
    explanation: 'The default can be any value, not just 0.',
    signature: 'fill:get-default',
  }),
  fill({
    id: 'o2-get-count-fill',
    title: 'Fill: the counting default',
    skills: ['dict_get', 'dict_assign'],
    prompt: 'Fill the blank so `counts` ends up holding how many times each letter appears.',
    starterCode: `counts = {}
for ch in 'abca':
    counts[ch] = counts.get(ch, ____) + 1`,
    solution: `counts = {}
for ch in 'abca':
    counts[ch] = counts.get(ch, 0) + 1`,
    tests: [t.check('counts correct', "assert counts == {'a': 2, 'b': 1, 'c': 1}")],
    explanation: 'A letter seen for the first time has count 0 before this one, so the default is 0.',
    signature: 'fill:get-count-default',
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
  code({
    id: 'o2-get-rewrite',
    title: 'Rewrite: if/else into .get',
    skills: ['dict_get', 'dict_membership'],
    stage: 'reconstruct',
    prompt: 'This works, but it is four lines:\n\n```python\ndef lookup(d, key, default):\n    if key in d:\n        return d[key]\n    else:\n        return default\n```\n\nRewrite the body as a single `return` line using `.get`.',
    starterCode: `def lookup(d, key, default):
    pass`,
    solution: `def lookup(d, key, default):
    return d.get(key, default)`,
    tests: [t.eq("lookup({'a': 1}, 'a', 9)", '1'), t.eq("lookup({'a': 1}, 'b', 9)", '9'), t.hidden("lookup({}, 1, None)", 'None')],
    explanation: '`.get(key, default)` is exactly the "if key in d else default" pattern in one call.',
    signature: 'rewrite:in-else-to-get',
  }),
  code({
    id: 'o2-get-total-cost',
    title: 'Write: total with .get in a loop',
    skills: ['dict_get', 'accumulator', 'for_loop'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `total_cost(menu, order)`. `menu` maps item → price; `order` is a list of item names (repeats allowed). Items not on the menu cost 0.',
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
    minutes: 4,
  }),
  code({
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
    id: 'o2-iter-keys',
    title: 'Trace: looping a dict gives keys',
    skills: ['dict_items'],
    prompt: 'Predict the output.',
    code: `ages = {'ana': 20, 'bo': 31}
for name in ages:
    print(name)`,
    expectedOutput: `ana
bo`,
    note: '`for k in d` loops over keys, in insertion order. `.values()` gives values, `.items()` gives (key, value) pairs.',
    explanation: 'A plain for over a dict yields keys only, never values.',
    signature: 'trace:dict-iter-keys',
  }),
  output({
    id: 'o2-iter-values',
    title: 'Trace: .values()',
    skills: ['dict_items', 'accumulator'],
    prompt: 'Predict the output.',
    code: `ages = {'ana': 20, 'bo': 31, 'cy': 27}
total = 0
for age in ages.values():
    total += age
print(total)`,
    expectedOutput: '78',
    explanation: '`.values()` gives just the values, here summed: 20 + 31 + 27.',
    signature: 'trace:dict-iter-values',
  }),
  output({
    id: 'o2-iter-items',
    title: 'Trace: .items() with a condition',
    skills: ['dict_items', 'conditionals'],
    prompt: 'Predict the output.',
    code: `stock = {'apple': 3, 'pear': 0, 'kiwi': 5}
for fruit, n in stock.items():
    if n > 0:
        print(fruit, n)`,
    expectedOutput: `apple 3
kiwi 5`,
    explanation: '`.items()` yields (key, value) pairs which unpack into two loop variables.',
    signature: 'trace:dict-iter-items',
    important: true,
  }),
  fill({
    id: 'o2-iter-fill',
    title: 'Fill: the pairs method',
    skills: ['dict_items'],
    prompt: 'Fill the blank so the loop gets each name and score.',
    starterCode: `def describe(scores):
    lines = []
    for name, score in scores.____():
        lines.append(name + '=' + str(score))
    return lines`,
    solution: `def describe(scores):
    lines = []
    for name, score in scores.items():
        lines.append(name + '=' + str(score))
    return lines`,
    tests: [t.eq("describe({'a': 1, 'b': 2})", "['a=1', 'b=2']"), t.eq('describe({})', '[]')],
    explanation: 'Two loop variables need `.items()`. Without it, `for name, score in scores` tries to unpack each key.',
    signature: 'fill:dict-items',
    important: true,
  }),
  code({
    id: 'o2-iter-keys-above',
    title: 'Write: keys whose value passes a test',
    skills: ['dict_items', 'conditionals', 'list_append'],
    prompt: 'Write `keys_above(d, limit)` that returns a list of the keys whose value is greater than `limit`, in the dict\'s order.',
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
  }),
  code({
    id: 'o2-iter-best-key',
    title: 'Write: key with the largest value',
    skills: ['dict_items', 'accumulator', 'conditionals'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `best_key(d)` that returns the **key** whose value is largest. `d` is non-empty and the largest value is unique.',
    starterCode: `def best_key(d):
    pass`,
    solution: `def best_key(d):
    best = None
    best_value = None
    for key, value in d.items():
        if best_value is None or value > best_value:
            best = key
            best_value = value
    return best`,
    tests: [t.eq("best_key({'a': 3, 'b': 7, 'c': 5})", "'b'"), t.eq("best_key({'x': -2, 'y': -9})", "'x'"), t.hidden("best_key({'only': 0})", "'only'")],
    hints: ['Track two things: the best key and its value.', 'Values may be negative, so do not start best_value at 0.'],
    explanation: 'This is best-so-far over pairs: keep the winning key alongside the value you compare against.',
    signature: 'dict-iter:argmax',
    minutes: 5,
  }),
  output({
    id: 'o2-iter-sorted-keys',
    title: 'Trace: list() and sorted() on a dict',
    skills: ['dict_items', 'sorting'],
    prompt: 'Predict the output.',
    code: `d = {'pear': 1, 'apple': 4, 'fig': 2}
print(list(d))
print(sorted(d))
print(sorted(d.values()))`,
    expectedOutput: `['pear', 'apple', 'fig']
['apple', 'fig', 'pear']
[1, 2, 4]`,
    explanation: '`list(d)` and `sorted(d)` both work on keys. `list` keeps insertion order; `sorted` reorders.',
    signature: 'trace:dict-sorted-keys',
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
  choice({
    id: 'o2-freq-keyerror',
    title: 'Why not counts[ch] += 1?',
    skills: ['frequency_map', 'dict_lookup'],
    prompt: 'What happens?',
    code: `counts = {}
for ch in 'aa':
    counts[ch] += 1`,
    options: ["KeyError: 'a' on the first character", "counts becomes {'a': 2}", "counts becomes {'a': 1}", 'counts stays {}'],
    answer: 0,
    explanation: "`counts[ch] += 1` reads `counts['a']` first, which does not exist yet. `.get(ch, 0)` supplies the missing starting value.",
    signature: 'recognize:freq-keyerror',
  }),
  fill({
    id: 'o2-freq-fill',
    title: 'Fill: the counting line',
    skills: ['frequency_map', 'dict_get'],
    prompt: 'Fill the right-hand side of the counting line.',
    starterCode: `def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = ____
    return counts`,
    solution: `def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts`,
    tests: [t.eq("char_counts('aab')", "{'a': 2, 'b': 1}"), t.eq("char_counts('')", '{}'), t.hidden("char_counts('zz z')", "{'z': 3, ' ': 1}")],
    explanation: 'Read the old count (0 if new), add one, store it back.',
    signature: 'fill:freq-map-line',
    important: true,
  }),
  reorder({
    id: 'o2-freq-reorder',
    title: 'Reorder: count items',
    skills: ['frequency_map', 'dict_get', 'for_loop'],
    prompt: 'Put the lines in order so `count_items(items)` returns a frequency map.',
    lines: ['def count_items(items):', '    counts = {}', '    for item in items:', '        counts[item] = counts.get(item, 0) + 1', '    return counts'],
    tests: [t.eq('count_items([3, 1, 3])', '{3: 2, 1: 1}'), t.eq('count_items([])', '{}')],
    explanation: 'Empty dict before the loop, one counting line inside, return after.',
    signature: 'reorder:freq-map',
  }),
  code({
    id: 'o2-freq-ifelse',
    title: 'Write: count with in / else',
    skills: ['frequency_map', 'dict_membership', 'dict_assign'],
    prompt: 'Write `count_nums(nums)` returning a frequency map, but **without** `.get`: use `if num in counts:` to decide between incrementing and starting at 1.',
    starterCode: `def count_nums(nums):
    pass`,
    solution: `def count_nums(nums):
    counts = {}
    for num in nums:
        if num in counts:
            counts[num] += 1
        else:
            counts[num] = 1
    return counts`,
    tests: [t.eq('count_nums([2, 2, 5])', '{2: 2, 5: 1}'), t.eq('count_nums([])', '{}'), t.hidden('count_nums([-1, -1, -1])', '{-1: 3}')],
    hints: ['Existing key: add one. New key: set it to 1.'],
    explanation: 'This is the long form of `.get(num, 0) + 1`. Both are fine in interviews; knowing both helps when reading others\' code.',
    signature: 'freq-map:count-if-in',
  }),
  code({
    id: 'o2-freq-words',
    title: 'Write: word counts',
    skills: ['frequency_map', 'dict_get', 'string_methods'],
    prompt: "Write `word_counts(sentence)` that counts words separated by spaces. `sentence.split()` gives the list of words.",
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
  code({
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
  code({
    id: 'o2-freq-threshold',
    title: 'Write: values seen more than k times',
    skills: ['frequency_map', 'dict_items', 'sorting'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `frequent(nums, k)` that returns a **sorted** list of the values that appear **more than** `k` times.',
    starterCode: `def frequent(nums, k):
    pass`,
    solution: `def frequent(nums, k):
    counts = {}
    for num in nums:
        counts[num] = counts.get(num, 0) + 1
    out = []
    for num, count in counts.items():
        if count > k:
            out.append(num)
    return sorted(out)`,
    tests: [t.eq('frequent([4, 1, 4, 2, 4, 1], 1)', '[1, 4]'), t.eq('frequent([1, 2, 3], 1)', '[]'), t.hidden('frequent([], 0)', '[]'), t.hidden('frequent([9, 8], 0)', '[8, 9]'), t.hidden('frequent([5, 5, 5], 3)', '[]')],
    hints: ['Count first.', 'Then filter the (value, count) pairs with `count > k`.'],
    explanation: '"More than k" is `>`, not `>=`: off-by-one in the comparison is the usual mistake here.',
    signature: 'freq-map:threshold',
    minutes: 5,
  }),
  output({
    id: 'o2-freq-compare-trace',
    title: 'Trace: comparing two maps',
    skills: ['frequency_map', 'dict_create'],
    prompt: 'Predict the output.',
    code: `a = {'x': 1, 'y': 2}
b = {'y': 2, 'x': 1}
c = {'x': 1, 'y': 3}
print(a == b)
print(a == c)`,
    expectedOutput: `True
False`,
    explanation: 'Dict equality ignores insertion order: same keys with the same values means equal.',
    signature: 'trace:dict-equality',
  }),
  code({
    id: 'o2-freq-same-counts',
    title: 'Write: same items, same counts',
    skills: ['frequency_map', 'dict_get', 'functions'],
    stage: 'combine',
    repType: 'combine',
    prompt: 'Write `same_items(a, b)` that returns True if lists `a` and `b` contain the same values with the same counts, in any order. Write a small helper that builds a frequency map and use it twice.',
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
  code({
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
  choice({
    id: 'o2-anagram-choice',
    title: 'What makes an anagram',
    skills: ['frequency_map', 'len'],
    prompt: 'Two strings are anagrams exactly when...',
    options: [
      'they use the same characters, each the same number of times',
      'they have the same length',
      'they share at least one character',
      'one is the other reversed',
    ],
    answer: 0,
    explanation: 'Same length is necessary but not enough ("aab" vs "abb"). It is equal character counts, which is a frequency-map comparison.',
    signature: 'recognize:anagram-definition',
  }),
  output({
    id: 'o2-anagram-sorted-trace',
    title: 'Trace: sorted on strings',
    skills: ['sorting', 'string_iterate'],
    prompt: 'Predict the output.',
    code: `print(sorted('cab'))
print(sorted('listen') == sorted('silent'))
print(len('aab') == len('abb'), sorted('aab') == sorted('abb'))`,
    expectedOutput: `['a', 'b', 'c']
True
True False`,
    explanation: '`sorted` on a string returns a list of characters. Sorting is another anagram test, at O(n log n) instead of O(n).',
    signature: 'trace:sorted-string',
  }),
  fill({
    id: 'o2-anagram-fill',
    title: 'Fill: compare the two maps',
    skills: ['frequency_map', 'dict_get'],
    prompt: 'Both maps are built. Fill in the return.',
    starterCode: `def is_anagram(s, t):
    a = {}
    b = {}
    for ch in s:
        a[ch] = a.get(ch, 0) + 1
    for ch in t:
        b[ch] = b.get(ch, 0) + 1
    return ____`,
    solution: `def is_anagram(s, t):
    a = {}
    b = {}
    for ch in s:
        a[ch] = a.get(ch, 0) + 1
    for ch in t:
        b[ch] = b.get(ch, 0) + 1
    return a == b`,
    tests: [t.eq("is_anagram('rat', 'tar')", 'True'), t.eq("is_anagram('rat', 'car')", 'False'), t.hidden("is_anagram('a', 'aa')", 'False')],
    explanation: 'Equal maps mean every character has the same count in both strings.',
    signature: 'fill:anagram-compare',
  }),
  reorder({
    id: 'o2-anagram-decrement',
    title: 'Reorder: one map, count up then down',
    skills: ['frequency_map', 'dict_get', 'early_return', 'len'],
    prompt: 'Put the lines in order. This variant uses **one** map: count up for `s`, count down for `t`, and fail as soon as a count goes negative.',
    lines: [
      'def same_letters(s, t):',
      '    if len(s) != len(t):',
      '        return False',
      '    counts = {}',
      '    for ch in s:',
      '        counts[ch] = counts.get(ch, 0) + 1',
      '    for ch in t:',
      '        counts[ch] = counts.get(ch, 0) - 1',
      '        if counts[ch] < 0:',
      '            return False',
      '    return True',
    ],
    tests: [t.eq("same_letters('anagram', 'nagaram')", 'True'), t.eq("same_letters('aab', 'abb')", 'False'), t.hidden("same_letters('', '')", 'True'), t.hidden("same_letters('ab', 'a')", 'False')],
    explanation: 'With equal lengths, if no count ever goes below zero then every count ends at exactly zero, so the strings match.',
    signature: 'reorder:anagram-decrement',
    minutes: 3,
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
    minutes: 22,
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
    minutes: 5,
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
    code: `positions = {}
for i, ch in enumerate('cat'):
    positions[ch] = i
print(positions)`,
    expectedOutput: "{'c': 0, 'a': 1, 't': 2}",
    note: 'Index map: `seen[value] = i` while enumerating. The value is the key; the index is the value.',
    explanation: 'Each character becomes a key and its position becomes the stored value.',
    signature: 'trace:index-map',
    important: true,
  }),
  output({
    id: 'o2-imap-last',
    title: 'Trace: duplicates keep the last index',
    skills: ['index_map', 'dict_assign'],
    prompt: 'Predict the output.',
    code: `where = {}
for i, num in enumerate([5, 7, 5, 9, 7]):
    where[num] = i
print(where)`,
    expectedOutput: '{5: 2, 7: 4, 9: 3}',
    explanation: 'Assignment overwrites, so a repeated value ends up with its **last** index. Keys keep the position where they were first inserted.',
    signature: 'trace:index-map-last',
    minutes: 2,
  }),
  choice({
    id: 'o2-imap-first-choice',
    title: 'Keep the first index',
    skills: ['index_map', 'dict_membership'],
    prompt: 'Which loop body keeps the **first** index of each value in `first`?',
    options: ['if num not in first: first[num] = i', 'first[num] = i', 'first[i] = num', 'first.get(num, i)'],
    answer: 0,
    explanation: 'Only store when the key is new. Plain assignment keeps the last index; `first[i] = num` is backwards; `.get` stores nothing.',
    signature: 'recognize:index-map-first',
  }),
  output({
    id: 'o2-imap-first-trace',
    title: 'Trace: first occurrence',
    skills: ['index_map', 'dict_membership'],
    prompt: 'Predict the output. Compare with the previous trace.',
    code: `first = {}
for i, num in enumerate([5, 7, 5, 9, 7]):
    if num not in first:
        first[num] = i
print(first)`,
    expectedOutput: '{5: 0, 7: 1, 9: 3}',
    explanation: 'The `not in` guard means later copies of 5 and 7 are ignored.',
    signature: 'trace:index-map-first',
  }),
  fill({
    id: 'o2-imap-fill',
    title: 'Fill: store the index',
    skills: ['index_map', 'enumerate'],
    prompt: 'Fill the blank so the dict maps each number to its (last) index.',
    starterCode: `def index_map(nums):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = ____
    return seen`,
    solution: `def index_map(nums):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
    return seen`,
    tests: [t.eq('index_map([4, 8])', '{4: 0, 8: 1}'), t.eq('index_map([3, 3])', '{3: 1}'), t.hidden('index_map([])', '{}')],
    explanation: 'Key = the number, value = where it is. That direction lets you ask "where is X?" in O(1).',
    signature: 'fill:index-map',
    important: true,
  }),
  code({
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
  code({
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
    minutes: 7,
  }),
])

// ---------------------------------------------------------------------------
// 12. Complements
// ---------------------------------------------------------------------------

const complements = section('o2-complements', 'Complements', 'complement = target - num, and asking "have I seen it?" with a set.', [
  choice({
    id: 'o2-comp-choice',
    title: 'What completes the pair?',
    skills: ['complement'],
    prompt: 'You need two numbers that add to `target = 8`. The current number is `3`. Which value would complete the pair?',
    options: ['5', '11', '3', '-5'],
    answer: 0,
    note: '`complement = target - num`: the value that, added to num, gives target.',
    explanation: '3 + 5 = 8, so the complement is 8 - 3 = 5.',
    signature: 'recognize:complement',
  }),
  output({
    id: 'o2-comp-trace',
    title: 'Trace: complements in a loop',
    skills: ['complement', 'for_loop'],
    prompt: 'Predict the output.',
    code: `target = 9
for num in [2, 7, 4, 11]:
    print(num, target - num)`,
    expectedOutput: `2 7
7 2
4 5
11 -2`,
    explanation: 'Complements can be negative when num is larger than target. 2 and 7 are each other\'s complements.',
    signature: 'trace:complement-loop',
  }),
  code({
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
    minutes: 5,
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
  code({
    id: 'o2-comp-set-code',
    title: 'Write: pair check in one pass',
    skills: ['complement', 'set_membership', 'set_add', 'hash_reasoning'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'Write `has_pair(nums, target)` returning True if two different positions add up to target. One pass with a set: no nested loop.',
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
    minutes: 6,
    important: true,
  }),
])

// ---------------------------------------------------------------------------
// 13. Two Sum: bridge from enumerate + index map + complement
// ---------------------------------------------------------------------------

const twoSum = section('o2-two-sum', 'Two Sum', 'enumerate + index map + complement + membership, assembled step by step.', [
  output({
    id: 'o2-ts-enum',
    title: 'Bridge 1: enumerate the numbers',
    skills: ['enumerate'],
    prompt: 'Predict the output.',
    code: `nums = [8, 3, 12]
for i, num in enumerate(nums):
    print(i, num)`,
    expectedOutput: `0 8
1 3
2 12`,
    explanation: 'Two Sum returns indexes, so the scan needs both i and num: enumerate.',
    signature: 'trace:enumerate-print',
  }),
  output({
    id: 'o2-ts-seen-lookup',
    title: 'Bridge 2: read the index back',
    skills: ['dict_assign', 'dict_lookup'],
    prompt: 'What does `seen[11]` return? Predict the output.',
    code: `seen = {}
seen[7] = 0
seen[11] = 1
print(seen[11])`,
    expectedOutput: '1',
    explanation: '11 is the key; 1 is the value stored with it, the index where 11 was seen.',
    signature: 'trace:index-map-lookup',
  }),
  fill({
    id: 'o2-ts-complement-fill',
    title: 'Bridge 3: compute the complement',
    skills: ['complement'],
    prompt: 'Fill the blank using the variables (no hard-coded number) so `complement` is the value that pairs with `num` to make `target`.',
    starterCode: `target = 10
num = 6
complement = ____`,
    solution: `target = 10
num = 6
complement = target - num`,
    tests: [t.check('complement is 4', 'assert complement == 4')],
    explanation: '`target - num` works for any numbers, including negatives.',
    signature: 'fill:complement',
    important: true,
  }),
  output({
    id: 'o2-ts-build-index',
    title: 'Bridge 4: what does seen contain?',
    skills: ['index_map', 'enumerate', 'dict_assign'],
    prompt: 'Predict the output.',
    code: `nums = [4, 8, 2]
seen = {}
for i, num in enumerate(nums):
    seen[num] = i
print(seen)`,
    expectedOutput: '{4: 0, 8: 1, 2: 2}',
    explanation: 'Each number maps to its index: now "where is 8?" is a single lookup, `seen[8]`.',
    signature: 'trace:index-map',
  }),
  fill({
    id: 'o2-ts-membership-fill',
    title: 'Bridge 5: is the complement known?',
    skills: ['dict_membership', 'dict_lookup', 'complement'],
    prompt: 'Fill the condition so the function returns the index of the complement if it has been seen, else -1.',
    starterCode: `def partner_index(seen, target, num):
    complement = target - num
    if ____:
        return seen[complement]
    return -1`,
    solution: `def partner_index(seen, target, num):
    complement = target - num
    if complement in seen:
        return seen[complement]
    return -1`,
    tests: [t.eq('partner_index({4: 0, 8: 1}, 10, 6)', '0'), t.eq('partner_index({4: 0}, 10, 3)', '-1'), t.hidden('partner_index({}, 0, 0)', '-1')],
    explanation: '`in` checks keys, and the keys are the numbers already seen, exactly what you need. Then `seen[complement]` is safe.',
    signature: 'fill:dict-membership-complement',
    important: true,
  }),
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
  choice({
    id: 'o2-ts-check-before-store',
    title: 'Check before you store',
    skills: ['index_map', 'complement', 'edge_cases'],
    prompt: '`nums = [3, 5]`, `target = 6`. Suppose the loop does `seen[num] = i` **before** checking `target - num in seen`. What goes wrong at `num = 3`?',
    options: [
      'It finds 3 in seen and pairs index 0 with itself',
      'Nothing: the order never matters',
      'A KeyError is raised',
      'It skips the 5',
    ],
    answer: 0,
    explanation: 'Checking first means seen only contains earlier positions, so an element can never pair with itself.',
    signature: 'recognize:check-before-store',
  }),
  code({
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
    minutes: 6,
  }),
  reorder({
    id: 'o2-ts-reorder',
    title: 'Reorder: pair indexes with a dict',
    skills: ['index_map', 'enumerate', 'complement', 'dict_membership', 'dict_lookup'],
    prompt: 'Put the lines in order so `pair_indexes(nums, target)` returns `[i, j]` for the pair, or `[]`.',
    lines: [
      'def pair_indexes(nums, target):',
      '    seen = {}',
      '    for i, num in enumerate(nums):',
      '        complement = target - num',
      '        if complement in seen:',
      '            return [seen[complement], i]',
      '        seen[num] = i',
      '    return []',
    ],
    tests: [t.eq('pair_indexes([2, 7, 11], 9)', '[0, 1]'), t.eq('pair_indexes([1, 2], 9)', '[]'), t.hidden('pair_indexes([3, 3], 6)', '[0, 1]')],
    explanation: 'The store line sits after the check, at loop level, not inside the if.',
    signature: 'reorder:two-sum',
    minutes: 3,
    important: true,
  }),
  code({
    id: 'o2-ts-pattern-count',
    title: 'Pattern: replace the nested loop',
    skills: ['hash_reasoning', 'frequency_map', 'complement', 'dict_get'],
    stage: 'pattern',
    repType: 'pattern',
    difficulty: 4,
    prompt: 'This counts index pairs `i < j` with `nums[i] + nums[j] == target`, in O(n^2):\n\n```python\ndef count_pairs_slow(nums, target):\n    count = 0\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                count += 1\n    return count\n```\n\nWrite `count_pairs(nums, target)` in **one pass**. Hint of the pattern: instead of "is the complement seen?", ask "how many times has the complement been seen?"',
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
    minutes: 28,
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
    minutes: 5,
  }),
])

// ---------------------------------------------------------------------------
// 14. Cold reps: from a bare signature, no scaffolding
// ---------------------------------------------------------------------------

const cold = section('o2-cold', 'Cold reps', 'Write from scratch: no starter beyond a signature.', [
  code({
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
    minutes: 4.5,
  }),
  code({
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
    minutes: 6.5,
  }),
  code({
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
    minutes: 4.5,
  }),
  code({
    id: 'o2-cold-last-index',
    title: 'Cold: last index of each value',
    skills: ['index_map', 'enumerate', 'dict_assign'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return a dict mapping each value in `nums` to the index where it **last** appears.',
    starterCode: `def last_index(nums):
    pass`,
    solution: `def last_index(nums):
    last = {}
    for i, num in enumerate(nums):
        last[num] = i
    return last`,
    tests: [t.eq('last_index([9, 4, 9, 1])', '{9: 2, 4: 1, 1: 3}'), t.hidden('last_index([])', '{}'), t.hidden('last_index([5, 5, 5])', '{5: 2}')],
    signature: 'index-map:last-seen',
    minutes: 4,
  }),
  code({
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
    minutes: 4.5,
  }),
  code({
    id: 'o2-cold-common',
    title: 'Cold: common values',
    skills: ['set_create', 'set_membership', 'sorting'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return a sorted list of the distinct values that appear in both `a` and `b`.',
    starterCode: `def common(a, b):
    pass`,
    solution: `def common(a, b):
    in_b = set(b)
    out = set()
    for x in a:
        if x in in_b:
            out.add(x)
    return sorted(out)`,
    tests: [t.eq('common([4, 1, 4, 7], [7, 4, 0])', '[4, 7]'), t.hidden('common([], [1])', '[]'), t.hidden('common([2, 2], [2, 2])', '[2]')],
    signature: 'set:intersection-manual',
    minutes: 4.5,
  }),
  code({
    id: 'o2-cold-sum-to',
    title: 'Cold: sum 1 to n',
    skills: ['range', 'accumulator'],
    stage: 'retrieval',
    repType: 'cold',
    prompt: 'Return 1 + 2 + ... + n using a loop over `range` (no formula). For n = 0 return 0.',
    starterCode: `def sum_to(n):
    pass`,
    solution: `def sum_to(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total`,
    tests: [t.eq('sum_to(4)', '10'), t.hidden('sum_to(0)', '0'), t.hidden('sum_to(1)', '1'), t.hidden('sum_to(100)', '5050')],
    signature: 'accumulator:range-sum',
    minutes: 3.5,
  }),
  code({
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
  code({
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
  code({
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
    minutes: 6.5,
  }),
])

export const day: DayModule = {
  date: '2026-10-02',
  short: 'Foundation',
  title: 'Python fluency + hashing foundations',
  focus: 'Make list, loop, range, enumerate, set and dict syntax automatic, then build frequency maps, index maps and complements into Contains Duplicate, Valid Anagram and Two Sum.',
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
