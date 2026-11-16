import type { LabScaffold } from '@/data/course/types'
import { t } from '@/data/exercises/build'
import { sections } from '@/data/exercises/course/labs-w3w8'

/** Lab scaffolds (data/course/types.ts LabScaffold), keyed by lab id. Merged into LABS by data/course/lessons.ts. */

const lines = (...xs: string[]) => xs.join('\n')

/** The build exercise's reference solution, read from the exercise itself so the two never drift. */
function solutionOf(id: string): string {
  for (const section of sections) {
    const ex = section.exercises.find((e) => e.id === id)
    if (ex?.solution) return ex.solution
  }
  throw new Error(`scaffolds/w3w8: no solution for ${id}`)
}

// ── Activity Window Analyzer ────────────────────────────────────────────────

const activityWindow: LabScaffold = {
  workedExample: {
    problem: lines(
      'A weather station records the rain in millimetres for each day: `rain = [0, 3, 0, 0, 5, 1, 0]`.',
      '',
      '1. `wettest(rain, k)` returns the most rain in any `k` days in a row.',
      '2. `longest_mostly_dry(rain)` returns the length of the longest run of days with at most one rainy day (a day with rain above 0).',
      '',
      'Each makes one pass over `rain`.',
    ),
    walkthrough: [
      {
        step: 'Sum the first window once.',
        why: 'A fixed-size window needs a starting total. After that you never add a whole window again.',
        code: 'total = sum(rain[:k])\nbest = total',
      },
      {
        step: 'Slide: add the day coming in, subtract the day going out.',
        why: 'Moving the window one day changes only its two ends, so the total updates in O(1).',
        code: 'for right in range(k, len(rain)):\n    total += rain[right] - rain[right - k]\n    best = max(best, total)',
      },
      {
        step: 'For the variable window, grow the right edge every day and track what the window holds.',
        why: 'Here the window holds a count of rainy days, not a sum. The right edge moves once per day.',
        code: 'for right in range(len(rain)):\n    if rain[right] > 0:\n        wet += 1',
      },
      {
        step: 'Shrink from the left while the window breaks the rule, then record its length.',
        why: 'The left edge only moves forward, so both edges together move at most 2n times: still O(n).',
        code: 'while wet > 1:\n    if rain[left] > 0:\n        wet -= 1\n    left += 1\nbest = max(best, right - left + 1)',
      },
    ],
    solution: `def wettest(rain, k):
    total = sum(rain[:k])
    best = total
    for right in range(k, len(rain)):
        total += rain[right] - rain[right - k]
        best = max(best, total)
    return best


def longest_mostly_dry(rain):
    left = 0
    wet = 0
    best = 0
    for right in range(len(rain)):
        if rain[right] > 0:
            wet += 1
        while wet > 1:
            if rain[left] > 0:
                wet -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


rain = [0, 3, 0, 0, 5, 1, 0]
print(wettest(rain, 2))           # 6 (days 4 and 5)
print(longest_mostly_dry(rain))   # 4 (days 0 to 3)
`,
  },
  steps: [
    {
      title: 'Count events per minute',
      instruction: lines(
        'Write `per_minute(times, n)`.',
        '',
        'Start with `counts = [0] * n`. For each time `t`, add 1 to `counts[t]`, but only when `0 <= t < n`. Return `counts`.',
      ),
      checkpoint: {
        description: '`per_minute` builds `n` counts and skips times outside 0 to `n - 1`.',
        tests: [
          t.eq('per_minute([0, 1, 1, 4], 5)', '[1, 2, 0, 0, 1]'),
          t.eq('per_minute([2, 7, -1], 3)', '[0, 0, 1]', { name: 'times outside the range are ignored' }),
          t.eq('per_minute([], 2)', '[0, 0]', { name: 'no events still gives n zeros' }),
        ],
      },
      hints: [
        'One slot per minute: a list of length n, all zeros to begin with.',
        'Loop over the times and use each time as an index into the list.',
        'A time of n would be a bad index, and -1 would silently count the last minute. Guard with `0 <= t < n`.',
        'counts = [0] * n\nfor t in times:\n    if 0 <= t < n:\n        counts[t] += 1\nreturn counts',
      ],
    },
    {
      title: 'The first window',
      instruction: lines(
        'Start `busiest_window(counts, k)`.',
        '',
        'Sum the first `k` counts once: `total = sum(counts[:k])`. Keep the best answer as a pair `best = (0, total)` and return it.',
        'For now this is only right when `k == len(counts)`. The next step slides the window.',
      ),
      checkpoint: {
        description: '`busiest_window` returns `(0, total)` when the window covers every minute.',
        tests: [
          t.eq('busiest_window([1, 2, 3], 3)', '(0, 6)'),
          t.eq('busiest_window([5], 1)', '(0, 5)', { name: 'a single minute' }),
        ],
      },
      hints: [
        'Every sliding window starts with one honest sum. That is the only time you add a whole window.',
        'Keep two things: the running `total` and the `best` (start, total) pair seen so far.',
        '`sum(counts[:k])` adds the first k counts.',
        'total = sum(counts[:k])\nbest = (0, total)\nreturn best',
      ],
    },
    {
      title: 'Slide the fixed window',
      instruction: lines(
        'Now slide. Loop `right` from `k` to `len(counts) - 1`. Each step, add `counts[right]` (coming in) and subtract `counts[right - k]` (going out).',
        '',
        'The new window starts at `right - k + 1`. Replace `best` only when `total > best[1]`, so a tie keeps the earlier start.',
      ),
      checkpoint: {
        description: '`busiest_window` finds the busiest `k` minutes in one pass, earliest start on a tie.',
        tests: [
          t.eq('busiest_window([1, 2, 0, 0, 1], 2)', '(0, 3)'),
          t.eq('busiest_window([0, 1, 3, 0, 4], 2)', '(1, 4)', { name: 'a tie goes to the earlier start' }),
          t.eq('busiest_window([2, 0, 0, 2, 3], 3)', '(2, 5)', { name: 'the best window is at the end' }),
        ],
      },
      hints: [
        'Moving the window one minute right changes only its two ends.',
        'One loop over the right edge. The minute leaving is k places behind it.',
        '`total += counts[right] - counts[right - k]`. Then compare with `>` (not `>=`) so ties keep the first start.',
        'for right in range(k, len(counts)):\n    total += counts[right] - counts[right - k]\n    if total > best[1]:\n        best = (right - k + 1, total)\nreturn best',
      ],
    },
    {
      title: 'Grow the quiet window',
      instruction: lines(
        'Start `longest_quiet(counts, limit)` with `left = 0`, `total = 0`, `best = 0`.',
        '',
        'Loop `right` over every minute: add `counts[right]` to `total` and set `best = max(best, right - left + 1)`. Return `best`.',
        'Leave out the shrinking for now. This is already right when the whole list fits under the limit.',
      ),
      checkpoint: {
        description: '`longest_quiet` measures the window as it grows; right when nothing breaks the limit.',
        tests: [
          t.eq('longest_quiet([1, 0, 1], 5)', '3'),
          t.eq('longest_quiet([0, 0, 0], 0)', '3', { name: 'a limit of 0 with all-quiet minutes' }),
          t.eq('longest_quiet([], 5)', '0', { name: 'no minutes at all' }),
        ],
      },
      hints: [
        'This window has no fixed size. The right edge moves every minute; the left edge moves only when it must.',
        'Three variables: where the window starts, what it adds up to, and the best length so far.',
        'The window from left to right inclusive has `right - left + 1` minutes.',
        'left = 0\ntotal = 0\nbest = 0\nfor right in range(len(counts)):\n    total += counts[right]\n    best = max(best, right - left + 1)\nreturn best',
      ],
    },
    {
      title: 'Shrink when it gets too loud',
      instruction: lines(
        'Inside the loop, after adding `counts[right]` and before measuring, shrink the window:',
        '',
        'while `total > limit`, subtract `counts[left]` and move `left` forward by one.',
        '',
        'If a single minute is over the limit, the window shrinks to empty (`left == right + 1`) and its length is 0. That is correct.',
      ),
      checkpoint: {
        description: '`longest_quiet` returns the longest run whose total is at most `limit`.',
        tests: [
          t.eq('longest_quiet([1, 0, 2, 0, 0, 1], 1)', '3'),
          t.eq('longest_quiet([1, 1, 1, 1], 2)', '2'),
          t.eq('longest_quiet([3, 3], 2)', '0', { name: 'every minute is over the limit' }),
        ],
      },
      hints: [
        'When the window breaks the rule, drop minutes from its left end until it obeys again.',
        'Use `while`, not `if`: one step left may not be enough.',
        'Shrinking means `total -= counts[left]` then `left += 1`. Measure only after the window is valid.',
        'for right in range(len(counts)):\n    total += counts[right]\n    while total > limit:\n        total -= counts[left]\n        left += 1\n    best = max(best, right - left + 1)',
      ],
    },
  ],
  referenceSolution: solutionOf('lab-activity-window-build'),
  explainBack: [
    'Why does `busiest_window` use `>` rather than `>=` when it compares a new total with the best one?',
    'In `longest_quiet`, why does the whole function stay O(n) even though there is a `while` loop inside the `for` loop?',
    'Why is `busiest_window` a fixed-size window while `longest_quiet` grows and shrinks?',
  ],
}

// ── Editor Undo/Redo Engine ─────────────────────────────────────────────────

const undoRedo: LabScaffold = {
  workedExample: {
    problem: lines(
      "A calculator starts at 0 and runs commands: `'add 5'`, `'sub 2'` and `'undo'`.",
      '',
      '`run_counter(commands)` returns the value after each command. `undo` goes back to the value before the last add or sub that is not undone yet. An undo with nothing to undo does nothing.',
      '',
      'This one has undo only, no redo.',
    ),
    walkthrough: [
      {
        step: 'Split each command into an action and an argument.',
        why: "`partition(' ')` splits at the first space only and never fails, even on a plain `'undo'`.",
        code: "action, _, arg = command.partition(' ')",
      },
      {
        step: 'Before a change, push the current value onto a stack.',
        why: 'The stack remembers every earlier state, newest on top. That is exactly the order undo needs.',
        code: "history.append(value)\nvalue = value + int(arg) if action == 'add' else value - int(arg)",
      },
      {
        step: 'Undo pops the newest saved value, but only if there is one.',
        why: 'An empty stack means nothing to undo. Checking first avoids an IndexError.',
        code: "if action == 'undo':\n    if history:\n        value = history.pop()",
      },
      {
        step: 'Record the value after every command, undo included.',
        why: 'A list of states after each step makes the behaviour easy to test and to read.',
        code: 'out.append(value)',
      },
    ],
    solution: `def run_counter(commands):
    value = 0
    history = []
    out = []
    for command in commands:
        action, _, arg = command.partition(' ')
        if action == 'undo':
            if history:
                value = history.pop()
        else:
            history.append(value)
            if action == 'add':
                value += int(arg)
            else:
                value -= int(arg)
        out.append(value)
    return out


print(run_counter(['add 5', 'sub 2', 'undo']))         # [5, 3, 5]
print(run_counter(['undo', 'add 1', 'undo', 'undo']))  # [0, 1, 0, 0]
`,
  },
  steps: [
    {
      title: 'Typing',
      instruction: lines(
        "Write `apply(text, command)` for the `'type ...'` command.",
        '',
        "Split with `action, _, arg = command.partition(' ')`. If `action == 'type'`, return `text + arg`. Otherwise return `text` for now.",
      ),
      checkpoint: {
        description: '`apply` adds typed text to the end, spaces included.',
        tests: [
          t.eq("apply('cat', 'type s')", "'cats'"),
          t.eq("apply('', 'type hello world')", "'hello world'", { name: 'spaces after the first one are typed' }),
        ],
      },
      hints: [
        'A command is an action word, a space, then everything else.',
        "`split()` would break `'type hello world'` into three pieces. You want exactly two.",
        "`command.partition(' ')` returns (before, ' ', after) and splits only at the first space.",
        "action, _, arg = command.partition(' ')\nif action == 'type':\n    return text + arg\nreturn text",
      ],
    },
    {
      title: 'Deleting',
      instruction: lines(
        "Add `'delete n'` to `apply`: remove the last `n` characters.",
        '',
        'Keep the first `len(text) - n` characters, but never fewer than 0: `text[:max(0, len(text) - int(arg))]`.',
      ),
      checkpoint: {
        description: '`apply` deletes from the end and never goes below an empty document.',
        tests: [
          t.eq("apply('hello', 'delete 2')", "'hel'"),
          t.eq("apply('hi', 'delete 5')", "''", { name: 'deleting more than there is' }),
          t.eq("apply('abc', 'delete 0')", "'abc'", { name: 'delete 0 changes nothing' }),
        ],
      },
      hints: [
        'Deleting from the end is the same as keeping a prefix.',
        'The prefix length is the old length minus n. It cannot be negative.',
        "Watch out: `text[:-0]` is `''`, not `text`. Slicing by a computed length avoids that trap.",
        "if action == 'delete':\n    return text[:max(0, len(text) - int(arg))]",
      ],
    },
    {
      title: 'Replay the edits',
      instruction: lines(
        'Write `snapshots(commands)`, ignoring undo and redo for now.',
        '',
        "Start with `text = ''` and `out = []`. For each command, set `text = apply(text, command)` and append `text` to `out`. Return `out`.",
      ),
      checkpoint: {
        description: '`snapshots` returns the text after each type or delete.',
        tests: [
          t.eq("snapshots(['type hi', 'type !', 'delete 1'])", "['hi', 'hi!', 'hi']"),
          t.eq('snapshots([])', '[]', { name: 'no commands' }),
        ],
      },
      hints: [
        'The editor is a loop that carries one piece of state: the current text.',
        'One list collects the text after each step.',
        'Reuse `apply` for the real editing; `snapshots` only drives it.',
        "text = ''\nout = []\nfor command in commands:\n    text = apply(text, command)\n    out.append(text)\nreturn out",
      ],
    },
    {
      title: 'Undo with a stack',
      instruction: lines(
        'Add an `undo = []` stack to `snapshots`.',
        '',
        '- Before a type or delete, push the current `text` onto `undo`.',
        "- On `'undo'`, if the stack is not empty, set `text = undo.pop()`. If it is empty, do nothing.",
        '- Either way, still append `text` to `out`.',
      ),
      checkpoint: {
        description: '`undo` restores the text before the last change, and does nothing when there is nothing to undo.',
        tests: [
          t.eq("snapshots(['type a', 'type b', 'undo'])", "['a', 'ab', 'a']"),
          t.eq("snapshots(['type x', 'undo', 'undo'])", "['x', '', '']", { name: 'an extra undo does nothing' }),
          t.eq("snapshots(['undo'])", "['']", { name: 'undo on an empty editor' }),
        ],
      },
      hints: [
        'Undo needs the most recent earlier state first: last in, first out.',
        'Store whole texts on the stack. Push before each change, pop on undo.',
        'Check `if undo:` before popping, or an empty stack raises IndexError.',
        "if command == 'undo':\n    if undo:\n        text = undo.pop()\nelse:\n    undo.append(text)\n    text = apply(text, command)\nout.append(text)",
      ],
    },
    {
      title: 'Redo, and forget it on a new edit',
      instruction: lines(
        'Add a `redo = []` stack.',
        '',
        '- On undo, push the current `text` onto `redo` before popping from `undo`.',
        "- On `'redo'`, if `redo` is not empty, push `text` onto `undo` and set `text = redo.pop()`.",
        '- On a new type or delete, call `redo.clear()`: those undone changes can no longer come back.',
      ),
      checkpoint: {
        description: 'Redo brings back undone changes, and a new edit clears what could be redone.',
        tests: [
          t.eq("snapshots(['type hi', 'delete 1', 'undo', 'undo', 'redo'])", "['hi', 'h', 'hi', '', 'hi']"),
          t.eq("snapshots(['type a', 'type b', 'undo', 'type c', 'redo'])", "['a', 'ab', 'a', 'ac', 'ac']", { name: 'a new edit clears redo' }),
          t.eq("snapshots(['undo', 'redo'])", "['', '']", { name: 'nothing to undo or redo' }),
        ],
      },
      hints: [
        'Undo and redo are mirror images: each moves the current text onto the other stack.',
        'Two stacks. Undo saves the current text on `redo` and restores from `undo`; redo does the reverse.',
        'Only a real edit pushes onto `undo` and clears `redo`. Undo and redo never clear anything.',
        "if command == 'undo':\n    if undo:\n        redo.append(text)\n        text = undo.pop()\nelif command == 'redo':\n    if redo:\n        undo.append(text)\n        text = redo.pop()\nelse:\n    undo.append(text)\n    redo.clear()\n    text = apply(text, command)",
      ],
    },
    {
      title: 'The final text',
      instruction: lines(
        'Write `run_editor(commands)` on top of `snapshots`.',
        '',
        "Call `snapshots(commands)` and return its last item. With no commands there is no last item, so return `''`.",
      ),
      checkpoint: {
        description: '`run_editor` returns the final text, reusing `snapshots`.',
        tests: [
          t.eq("run_editor(['type ab', 'type c', 'undo'])", "'ab'"),
          t.eq("run_editor(['type abc', 'delete 1', 'delete 1', 'undo', 'undo', 'undo', 'redo', 'redo'])", "'ab'"),
          t.eq('run_editor([])', "''", { name: 'no commands' }),
        ],
      },
      hints: [
        'Do not write the loop twice. The last snapshot is the final text.',
        '`history[-1]` is the last item, but it fails on an empty list.',
        "Guard the empty case: `history[-1] if history else ''`.",
        "history = snapshots(commands)\nreturn history[-1] if history else ''",
      ],
    },
  ],
  referenceSolution: solutionOf('lab-undo-redo-build'),
  explainBack: [
    'Your stacks hold whole texts rather than the edits. Why is that simpler, and what does it cost for a long document?',
    'Why must a new type or delete clear the redo stack? Give a short command list where not clearing it gives a wrong answer.',
    'Why does `run_editor` call `snapshots` instead of running its own loop?',
  ],
}

// ── Searchable Product Catalog ──────────────────────────────────────────────

const P = "[(5, 'pen'), (12, 'mug'), (12, 'cap'), (20, 'bag'), (45, 'lamp')]"

/** Counts how many products a search looks at, so a linear scan fails the checkpoint. */
const spyCheck = (call: string, expected: string) => `class Spy(list):
    reads = 0
    def __getitem__(self, i):
        Spy.reads += 1
        return list.__getitem__(self, i)
    def __iter__(self):
        Spy.reads += len(self)
        return list.__iter__(self)
ps = Spy([(i, 'item' + str(i)) for i in range(1024)])
result = ${call}
assert result == ${expected}, 'wrong answer: ' + repr(result)
assert Spy.reads <= 40, 'looked at ' + str(Spy.reads) + ' of 1024 products; a binary search needs about 11'`

const productCatalog: LabScaffold = {
  workedExample: {
    problem: lines(
      'A sorted list of exam scores: `scores = [40, 55, 55, 70, 90]`.',
      '',
      '`first_pass(scores, mark)` returns the index of the first score at or above `mark`, or `len(scores)` if none is. It must look at O(log n) scores.',
      '',
      'Then use it to count how many students passed.',
    ),
    walkthrough: [
      {
        step: 'Set up a half-open range `[lo, hi)` that surely contains the answer.',
        why: 'The answer can be any index from 0 to `len(scores)` (meaning "none"), so `hi` starts at `len(scores)`, not `len - 1`.',
        code: 'lo, hi = 0, len(scores)',
      },
      {
        step: 'Look at the middle and keep the half that still holds the answer.',
        why: 'If `scores[mid] >= mark`, mid might be the answer, so keep it (`hi = mid`). If not, the answer is strictly right of mid (`lo = mid + 1`).',
        code: 'mid = (lo + hi) // 2\nif scores[mid] >= mark:\n    hi = mid\nelse:\n    lo = mid + 1',
      },
      {
        step: 'Stop when the range is empty; `lo` is the answer.',
        why: 'Invariant: everything left of `lo` is below the mark, everything from `hi` on is at or above it. When `lo == hi` they meet at the edge.',
        code: 'while lo < hi:\n    ...\nreturn lo',
      },
      {
        step: 'Turn an index into a count.',
        why: 'Everything from the first passing index to the end passed, so the count is a subtraction. No scan needed.',
        code: 'len(scores) - first_pass(scores, mark)',
      },
    ],
    solution: `def first_pass(scores, mark):
    lo, hi = 0, len(scores)
    while lo < hi:
        mid = (lo + hi) // 2
        if scores[mid] >= mark:
            hi = mid
        else:
            lo = mid + 1
    return lo


def passed(scores, mark):
    return len(scores) - first_pass(scores, mark)


scores = [40, 55, 55, 70, 90]
print(first_pass(scores, 55))   # 1 (the first of the two 55s)
print(passed(scores, 60))       # 2
print(first_pass(scores, 99))   # 5 (nobody)
`,
  },
  steps: [
    {
      title: 'First product at or above a budget',
      instruction: lines(
        'Write `first_at_least(products, budget)` as a binary search.',
        '',
        '`lo, hi = 0, len(products)`. While `lo < hi`, take `mid = (lo + hi) // 2`. If `products[mid][0] >= budget`, set `hi = mid`; otherwise `lo = mid + 1`. Return `lo`.',
        '',
        'Compare the price (`[0]`), not the whole pair.',
      ),
      checkpoint: {
        description: '`first_at_least` lands on the first of a run of equal prices, in O(log n).',
        tests: [
          t.eq(`first_at_least(${P}, 12)`, '1', { name: 'the first of two products at 12' }),
          t.eq(`first_at_least(${P}, 13)`, '3'),
          t.eq(`first_at_least(${P}, 100)`, '5', { name: 'nothing is that expensive' }),
          t.eq('first_at_least([], 3)', '0', { name: 'empty catalog' }),
          t.check('first_at_least looks at O(log n) products', spyCheck('first_at_least(ps, 700)', '700')),
        ],
      },
      hints: [
        'Sorted means one comparison tells you which half to throw away.',
        'Keep a range `[lo, hi)` that always contains the answer. `hi` starts at `len(products)` because "none" is a valid answer.',
        'When `products[mid][0] >= budget`, mid could be the answer, so keep it: `hi = mid`. Otherwise `lo = mid + 1`.',
        'lo, hi = 0, len(products)\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if products[mid][0] >= budget:\n        hi = mid\n    else:\n        lo = mid + 1\nreturn lo',
      ],
    },
    {
      title: 'A second search: first product above a price',
      instruction: lines(
        'Add a helper `first_above(products, price)`: the index of the first product priced strictly above `price`, or `len(products)`.',
        '',
        'It is the same loop as `first_at_least` with one change: `>` instead of `>=`.',
      ),
      checkpoint: {
        description: '`first_above` skips past a whole run of equal prices.',
        tests: [
          t.eq(`first_above(${P}, 12)`, '3', { name: 'skips both products at 12' }),
          t.eq(`first_above(${P}, 4)`, '0', { name: 'everything is above' }),
          t.eq(`first_above(${P}, 45)`, '5', { name: 'nothing is above' }),
          t.check('first_above looks at O(log n) products', spyCheck('first_above(ps, 700)', '701')),
        ],
      },
      hints: [
        'Two searches cover every question here: "first at or above" and "first strictly above".',
        'Copy the loop shape. Only the comparison changes.',
        '`if products[mid][0] > price: hi = mid`, else `lo = mid + 1`.',
        'def first_above(products, price):\n    lo, hi = 0, len(products)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if products[mid][0] > price:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo',
      ],
    },
    {
      title: 'Last product at or below a budget',
      instruction: lines(
        'Write `last_at_most(products, budget)` with no new loop.',
        '',
        'The last product at or below `budget` sits just before the first product above it: `first_above(products, budget) - 1`. When nothing is cheap enough, that gives -1 for free.',
      ),
      checkpoint: {
        description: '`last_at_most` returns the last index at or below the budget, or -1.',
        tests: [
          t.eq(`last_at_most(${P}, 12)`, '2', { name: 'the last of two products at 12' }),
          t.eq(`last_at_most(${P}, 45)`, '4'),
          t.eq(`last_at_most(${P}, 4)`, '-1', { name: 'nothing is that cheap' }),
        ],
      },
      hints: [
        '"Last at most x" and "first above x" are neighbours in a sorted list.',
        'Reuse `first_above` and step one index back.',
        'If `first_above` returns 0, the answer is -1, which is exactly what the requirement asks for.',
        'return first_above(products, budget) - 1',
      ],
    },
    {
      title: 'Count a price range',
      instruction: lines(
        'Write `count_in_range(products, low, high)` as the difference of two searches.',
        '',
        'Products from `low` to `high` start at `first_at_least(products, low)` and end just before `first_above(products, high)`. Subtract. If `low > high`, return 0 first.',
      ),
      checkpoint: {
        description: '`count_in_range` counts prices from `low` to `high` inclusive.',
        tests: [
          t.eq(`count_in_range(${P}, 10, 20)`, '3'),
          t.eq(`count_in_range(${P}, 12, 12)`, '2', { name: 'a range of one price' }),
          t.eq(`count_in_range(${P}, 21, 44)`, '0', { name: 'a gap with no products' }),
          t.eq(`count_in_range(${P}, 30, 10)`, '0', { name: 'low above high' }),
        ],
      },
      hints: [
        'A range in a sorted list is a slice; its size is end minus start.',
        'Start: the first index at or above `low`. End (exclusive): the first index above `high`.',
        'Guard `low > high` before subtracting, or the difference can go negative.',
        'if low > high:\n    return 0\nreturn first_above(products, high) - first_at_least(products, low)',
      ],
    },
    {
      title: 'Names within budget',
      instruction: lines(
        'Write `affordable(products, budget)`.',
        '',
        'Everything before `first_above(products, budget)` is affordable. Slice up to there and keep only the names, in order.',
      ),
      checkpoint: {
        description: '`affordable` returns the names at or below the budget, cheapest first.',
        tests: [
          t.eq(`affordable(${P}, 12)`, "['pen', 'mug', 'cap']"),
          t.eq(`affordable(${P}, 100)`, "['pen', 'mug', 'cap', 'bag', 'lamp']"),
          t.eq(`affordable(${P}, 1)`, '[]', { name: 'nothing is affordable' }),
        ],
      },
      hints: [
        'The affordable products are one block at the front of the list.',
        'Find where the block ends with a search, then slice.',
        'Each product is `(price, name)`; unpack with `for _, name in ...`.',
        'return [name for _, name in products[:first_above(products, budget)]]',
      ],
    },
  ],
  referenceSolution: solutionOf('lab-product-catalog-build'),
  explainBack: [
    'State the loop invariant of your binary search in one sentence: what is true about everything left of `lo` and from `hi` onwards?',
    'Why does `hi` start at `len(products)` instead of `len(products) - 1`?',
    'How did two search helpers let you write `last_at_most`, `count_in_range` and `affordable` without any new loops?',
  ],
}

// ── Building Evacuation Map ─────────────────────────────────────────────────

const G = "['E..#', '.#..', '...E']"
const TRAP = "['E.#.', '..#.', '###.']"

const evacuationMap: LabScaffold = {
  workedExample: {
    problem: lines(
      "A maze is a list of strings: `'S'` is the start, `'T'` the target, `'#'` a wall, `'.'` open floor. You move one cell up, down, left or right per step.",
      '',
      '`fewest_steps(maze)` returns the fewest steps from S to T, or -1 if T cannot be reached.',
      '',
      'This is breadth-first search (BFS) from one cell. The lab does the same from many cells at once and keeps every distance.',
    ),
    walkthrough: [
      {
        step: 'Find the start, put it in a queue, and mark it seen with distance 0.',
        why: 'A queue (`deque`) hands cells back in the order they were added, so all cells 1 step away come out before any cell 2 steps away.',
        code: 'queue = deque([start])\ndist = {start: 0}',
      },
      {
        step: 'Take the oldest cell off the front with `popleft`.',
        why: 'Front-first is what makes it breadth-first. Using a stack (`pop`) would dive deep first and could find a long path before a short one.',
        code: 'r, c = queue.popleft()',
      },
      {
        step: 'Look at the four neighbours. Check bounds, walls, and whether it is already seen.',
        why: 'Bounds first, so you never index outside the grid.',
        code: "for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n    nr, nc = r + dr, c + dc\n    if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] != '#' and (nr, nc) not in dist:",
      },
      {
        step: 'Mark a neighbour as seen when you add it to the queue, with distance one more than the current cell.',
        why: 'Marking on enqueue means each cell enters the queue once. If you marked on dequeue, the same cell could be added several times by different neighbours.',
        code: 'dist[(nr, nc)] = dist[(r, c)] + 1\nqueue.append((nr, nc))',
      },
      {
        step: 'The first time the target comes off the queue, its distance is the shortest.',
        why: 'BFS reaches cells in order of distance: everything at distance d is processed before anything at d + 1.',
        code: "if maze[r][c] == 'T':\n    return dist[(r, c)]",
      },
    ],
    solution: `from collections import deque


def fewest_steps(maze):
    rows = len(maze)
    cols = len(maze[0]) if rows else 0
    start = None
    for r in range(rows):
        for c in range(cols):
            if maze[r][c] == 'S':
                start = (r, c)
    if start is None:
        return -1
    queue = deque([start])
    dist = {start: 0}
    while queue:
        r, c = queue.popleft()
        if maze[r][c] == 'T':
            return dist[(r, c)]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] != '#' and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1
                queue.append((nr, nc))
    return -1


print(fewest_steps(['S.#', '..#', '#.T']))  # 4
print(fewest_steps(['S#T']))                 # -1 (the wall blocks the way)
`,
  },
  steps: [
    {
      title: 'Find the exits',
      instruction: lines(
        "Write `find_exits(grid)`: loop over rows, then columns, and collect `(r, c)` wherever `grid[r][c] == 'E'`.",
        '',
        'Looping rows on the outside gives top row first, left to right, for free.',
      ),
      checkpoint: {
        description: '`find_exits` lists every exit in reading order.',
        tests: [
          t.eq(`find_exits(${G})`, '[(0, 0), (2, 3)]'),
          t.eq("find_exits(['..'])", '[]', { name: 'a floor with no exits' }),
        ],
      },
      hints: [
        'A grid is rows of characters; a cell is a (row, col) pair.',
        'Two nested loops: rows outside, columns inside.',
        '`range(len(grid))` for rows and `range(len(grid[r]))` for columns.',
        "return [(r, c) for r in range(len(grid)) for c in range(len(grid[r])) if grid[r][c] == 'E']",
      ],
    },
    {
      title: 'Set up the distance grid',
      instruction: lines(
        'Start `steps_to_exit(grid)`. Get `rows = len(grid)` and `cols = len(grid[0]) if rows else 0`.',
        '',
        'Build `dist`: `None` for a wall, `-1` for everything else (meaning "not reached yet"). Then, for every exit, set its distance to 0 and add it to a `deque` called `queue`. Return `dist` for now.',
        '',
        'This grid is also your visited marker: a cell is seen once its value is no longer -1.',
      ),
      checkpoint: {
        description: '`steps_to_exit` marks walls, exits and not-yet-reached rooms.',
        tests: [
          t.eq("steps_to_exit(['E#'])", '[[0, None]]'),
          t.eq("steps_to_exit(['#.'])", '[[None, -1]]', { name: 'no exits: the room stays -1' }),
          t.eq('steps_to_exit([])', '[]', { name: 'an empty grid' }),
        ],
      },
      hints: [
        'Before searching, decide what each cell starts as: wall, exit, or unknown.',
        'A nested list comprehension builds one row per grid row.',
        "`[[None if grid[r][c] == '#' else -1 for c in range(cols)] for r in range(rows)]`, then loop over `find_exits(grid)` to set the 0s.",
        "dist = [[None if grid[r][c] == '#' else -1 for c in range(cols)] for r in range(rows)]\nqueue = deque()\nfor r, c in find_exits(grid):\n    dist[r][c] = 0\n    queue.append((r, c))\nreturn dist",
      ],
    },
    {
      title: 'Spread out with BFS',
      instruction: lines(
        'Before `return dist`, run the search:',
        '',
        '- `while queue:` take `r, c = queue.popleft()`.',
        '- For each of the four moves `(1, 0), (-1, 0), (0, 1), (0, -1)`, compute `nr, nc`.',
        '- If it is inside the grid and `dist[nr][nc] == -1` (an unvisited room), set `dist[nr][nc] = dist[r][c] + 1` and append it to the queue.',
        '',
        'Set the distance when you add the cell, not when you take it off. Use `popleft`, not `pop`: a stack would give depth-first order and wrong distances.',
      ),
      checkpoint: {
        description: '`steps_to_exit` fills in the shortest distance from an exit to every reachable room.',
        tests: [
          t.eq("steps_to_exit(['E....'])", '[[0, 1, 2, 3, 4]]'),
          t.eq("steps_to_exit(['E..', '...', '...'])", '[[0, 1, 2], [1, 2, 3], [2, 3, 4]]', { name: 'shortest, not just any, path' }),
          t.eq("steps_to_exit(['.#E'])", '[[-1, None, 0]]', { name: 'a wall blocks the room' }),
        ],
      },
      hints: [
        'BFS processes cells in order of distance: all the 1s, then all the 2s. A first-in, first-out queue gives that order.',
        'Each cell popped looks at its four neighbours. A neighbour still at -1 has not been reached yet.',
        'Check bounds before reading `dist[nr][nc]`, and give the neighbour `dist[r][c] + 1` at the moment you append it.',
        'while queue:\n    r, c = queue.popleft()\n    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n        nr, nc = r + dr, c + dc\n        if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:\n            dist[nr][nc] = dist[r][c] + 1\n            queue.append((nr, nc))',
      ],
    },
    {
      title: 'Many exits at once',
      instruction: lines(
        'Make sure every exit went into the queue before the loop starts (step 2 did this if you looped over all of `find_exits`).',
        '',
        'Starting from all exits together means each room is reached first by its nearest exit. One search, each cell visited once.',
      ),
      checkpoint: {
        description: 'With several exits, each room gets the distance to its nearest one.',
        tests: [
          t.eq(`steps_to_exit(${G})`, '[[0, 1, 2, None], [1, None, 2, 1], [2, 2, 1, 0]]'),
          t.eq("steps_to_exit(['E...E'])", '[[0, 1, 2, 1, 0]]', { name: 'two exits meet in the middle' }),
          t.eq(`steps_to_exit(${TRAP})`, '[[0, 1, None, -1], [1, 2, None, -1], [None, None, None, -1]]', { name: 'sealed rooms stay -1' }),
        ],
      },
      hints: [
        'Think of all exits as one big starting point at distance 0.',
        'Seed the queue with every exit before the `while` loop, not just the first.',
        'Because the queue holds all distance-0 cells first, the first exit to reach a room is the nearest one.',
        'for r, c in find_exits(grid):\n    dist[r][c] = 0\n    queue.append((r, c))\nwhile queue:\n    ...',
      ],
    },
    {
      title: 'Rooms with no way out',
      instruction: lines(
        'Write `trapped_rooms(grid)`. Call `steps_to_exit(grid)` once, then collect `(r, c)` for every cell still at -1, top row first.',
      ),
      checkpoint: {
        description: '`trapped_rooms` lists the rooms the search never reached.',
        tests: [
          t.eq(`trapped_rooms(${TRAP})`, '[(0, 3), (1, 3), (2, 3)]'),
          t.eq(`trapped_rooms(${G})`, '[]'),
          t.eq("trapped_rooms(['..', '..'])", '[(0, 0), (0, 1), (1, 0), (1, 1)]', { name: 'no exits: every room is trapped' }),
        ],
      },
      hints: [
        'After BFS, -1 means "never reached", which is exactly "no way out".',
        'Compute the distance grid once and store it; do not call `steps_to_exit` inside the loop.',
        'Scan rows then columns, as in `find_exits`, testing `dist[r][c] == -1`.',
        'dist = steps_to_exit(grid)\nreturn [(r, c) for r in range(len(dist)) for c in range(len(dist[r])) if dist[r][c] == -1]',
      ],
    },
    {
      title: 'The longest escape',
      instruction: lines(
        'Write `longest_escape(grid)`: the largest number in `steps_to_exit(grid)`.',
        '',
        'Skip walls (`None`). Start `best` at 0, so trapped rooms (-1) and a grid with no reachable rooms give 0.',
      ),
      checkpoint: {
        description: '`longest_escape` returns the most steps any room needs, or 0.',
        tests: [
          t.eq(`longest_escape(${G})`, '2'),
          t.eq("longest_escape(['E....'])", '4'),
          t.eq("longest_escape(['#', 'E'])", '0', { name: 'no rooms at all' }),
          t.eq("longest_escape(['..'])", '0', { name: 'no room can get out' }),
        ],
      },
      hints: [
        'This is a max over the distance grid, with two kinds of cell to ignore.',
        '`None` cannot be compared with a number in Python 3, so skip it explicitly.',
        'Starting `best` at 0 makes -1 and an empty grid harmless.',
        'best = 0\nfor row in steps_to_exit(grid):\n    for d in row:\n        if d is not None and d > best:\n            best = d\nreturn best',
      ],
    },
  ],
  referenceSolution: solutionOf('lab-evacuation-map-build'),
  explainBack: [
    'Why does your search use a queue with `popleft` rather than a stack? What would go wrong with the distances otherwise?',
    "Why do you set a cell's distance when you add it to the queue instead of when you take it off?",
    'Why is starting from every exit at once better than running a search from each room?',
  ],
}

export const scaffolds: Record<string, LabScaffold> = {
  'lab-activity-window': activityWindow,
  'lab-undo-redo': undoRedo,
  'lab-product-catalog': productCatalog,
  'lab-evacuation-map': evacuationMap,
}
