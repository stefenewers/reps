import type { Section } from '@/lib/types'
import { code, debug, explain, output, reorder, t, write } from '@/data/exercises/build'

/**
 * Week 2 (Nov 2–8): problem-solving foundations. The bridge between knowing the
 * syntax and turning an unfamiliar prompt into code on your own, organised by
 * the permanent Solve Map (REPS_2_MASTER_SPEC.md §17): contract, example,
 * subgoals, state, simple solution, test, improve, implement, verify.
 *
 * Lessons and worked examples: data/course/content/week2.ts.
 */

/** A prompt written line by line. */
const p = (...lines: string[]) => lines.join('\n')

const gate = { stage: 'retrieval' as const, repType: 'cold' as const, gate: true, difficulty: 3 as const }

/**
 * Checks for a `test_x(fn)` rep: the learner's test must pass a correct version
 * (defined as `_good`) and fail on each wrong one (each defined as `_bad`).
 * An error inside the learner's test counts as failing.
 */
function catches(testFn: string, good: string, bads: { name: string; code: string }[]) {
  return [
    t.check('passes on a correct version', `${good}\n${testFn}(_good)`),
    ...bads.map((b) =>
      t.check(
        b.name,
        `${b.code}\ntry:\n    ${testFn}(_bad)\nexcept Exception:\n    pass\nelse:\n    raise AssertionError('every assert passed on this wrong version')`,
      ),
    ),
  ]
}

/** Checks for a `breaking_input()` rep: the input must make `_bad` crash or disagree with `_right`. */
function breaks(setup: string, typeCheck: string, what: string) {
  return t.check(
    'your input breaks it',
    `${setup}\nx = breaking_input()\n${typeCheck}\ntry:\n    broke = _bad(x) != _right(x)\nexcept Exception:\n    broke = True\nassert broke, '${what} gets this input right'`,
  )
}

export const sections: Section[] = [
  // ───────────────────────────── Monday: the contract
  {
    id: 'c2-contract',
    title: 'The contract',
    summary: 'Before code: what goes in, what comes out, and what happens at the edges.',
    exercises: [
      output({
        id: 'c2-contract-trace',
        title: 'What the contract promises',
        skills: ['edge_cases', 'functions'],
        prompt: p(
          "`average(scores)` has a contract. A list of scores goes in. Their average comes out. An empty list gives `0`.",
          '',
          'Predict exactly what this prints. Watch the type of each answer.',
        ),
        note: 'A **contract** is what a function takes, what it returns, and what it does at the edges: empty input, ties, nothing found. Read it before you write code.',
        code: `def average(scores):
    if len(scores) == 0:
        return 0
    return sum(scores) / len(scores)

print(average([80, 90]))
print(average([70]))
print(average([]))`,
        expectedOutput: '85.0\n70.0\n0',
        explanation: '`/` always gives a float, so 85.0 and 70.0. The empty case returns the int 0 because the contract says so: the formula would have crashed with a division by zero.',
        signature: 'trace:contract-edge',
        minutes: 1.5,
      }),
      code({
        id: 'c2-contract-examples',
        title: 'Examples before code',
        skills: ['edge_cases'],
        style: 'write-test',
        prompt: p(
          '`cheapest(prices)` takes a list of prices in cents. It returns the smallest price. An empty list returns `None`.',
          '',
          "Don't write `cheapest`. Write its examples first. Make `examples()` return a list of pairs `(prices, answer)`, like `([300, 120, 450], 120)`.",
          '',
          'Include at least 4 pairs.',
          '- One uses an empty list.',
          '- One uses a list with one price.',
          '- One has two prices tied for cheapest.',
          '',
          'Every answer must be what `cheapest` should return for that list.',
        ),
        note: 'Examples are the contract made concrete. Writing the edge-case examples first tells you what the code must handle before you write it.',
        starterCode: `def examples():
    # Each pair is (prices, the answer cheapest should give).
    return [
        ([300, 120, 450], 120),
    ]`,
        solution: `def examples():
    # Each pair is (prices, the answer cheapest should give).
    return [
        ([300, 120, 450], 120),
        ([], None),
        ([999], 999),
        ([250, 100, 100], 100),
    ]`,
        tests: [
          t.check('at least 4 pairs', "pairs = examples()\nassert isinstance(pairs, list), 'return a list of pairs'\nassert len(pairs) >= 4, f'only {len(pairs)} pairs'"),
          t.check(
            'every answer is right',
            "def _cheapest(prices):\n    return min(prices) if prices else None\nfor prices, want in examples():\n    assert want == _cheapest(prices), f'for {prices} the answer is {_cheapest(prices)!r}, not {want!r}'",
          ),
          t.check('has an empty list', "assert any(len(prices) == 0 for prices, _ in examples()), 'no pair uses an empty list'"),
          t.check('has a one-price list', "assert any(len(prices) == 1 for prices, _ in examples()), 'no pair uses a list with one price'"),
          t.check('has a tie for cheapest', "assert any(prices and prices.count(min(prices)) > 1 for prices, _ in examples()), 'no pair has two prices tied for cheapest'"),
        ],
        hints: ['An empty list is `[]`. Its answer comes straight from the contract.', 'A tie: the smallest price appears twice, like `[250, 100, 100]`.'],
        explanation: 'Each edge case you wrote is a question the code has to answer. Writing them first means the empty list and the tie are decided before any loop exists.',
        signature: 'contract:examples-first',
        minutes: 3,
      }),
      write({
        id: 'c2-contract-first-late',
        title: 'Honour the contract: first late order',
        skills: ['edge_cases', 'early_return'],
        prompt: p(
          '`days` is a list of how many days each order took to arrive, in order. `limit` is the promised number of days.',
          '',
          'Return the index of the first order that took longer than `limit`. Taking exactly `limit` days is on time. If no order is late, return `-1`.',
          '',
          '`first_late([2, 5, 1, 7], 4)` → `1`',
          '`first_late([3, 4], 4)` → `-1` (4 days is on time)',
        ),
        note: 'List the edge cases before you write: an empty list, an order exactly on the limit, and no late order at all.',
        starterCode: `def first_late(days, limit):
    pass`,
        solution: `def first_late(days, limit):
    for i in range(len(days)):
        if days[i] > limit:
            return i
    return -1`,
        tests: [
          t.eq('first_late([2, 5, 1, 7], 4)', '1'),
          t.eq('first_late([3, 4], 4)', '-1'),
          t.eq('first_late([], 3)', '-1'),
          t.eq('first_late([9], 3)', '0'),
          t.hidden('first_late([1, 2, 6, 6], 5)', '2'),
          t.hidden('first_late([5, 5, 5], 5)', '-1'),
          t.hidden('first_late([0, 8], 0)', '1'),
        ],
        hints: ['Return as soon as you find a late order.', 'Late means `>`, not `>=`.', 'Only after the loop do you know nothing was late.'],
        explanation: 'The loop is easy. The contract is the work: `>` because exactly on the limit is on time, the index rather than the value, and `-1` only after every order was checked.',
        signature: 'contract:first-over',
        minutes: 3,
      }),
      write({
        id: 'c2-contract-top-seller',
        title: 'Honour the contract: ties',
        skills: ['edge_cases', 'dict_items', 'state_tracking'],
        prompt: p(
          '`sales` is a dict from product name to units sold.',
          '',
          "Return the product with the most units sold. On a tie, return the name that comes first alphabetically. An empty dict returns `''`.",
          '',
          "Python compares strings alphabetically with `<`: `'bag' < 'tee'` is `True`.",
          '',
          "`top_seller({'mug': 4, 'cap': 9, 'pen': 2})` → `'cap'`",
          "`top_seller({'tee': 5, 'bag': 5})` → `'bag'` (a tie: 'bag' comes first)",
        ),
        starterCode: `def top_seller(sales):
    pass`,
        solution: `def top_seller(sales):
    best = ''
    for name, units in sales.items():
        if best == '' or units > sales[best] or (units == sales[best] and name < best):
            best = name
    return best`,
        tests: [
          t.eq("top_seller({'mug': 4, 'cap': 9, 'pen': 2})", "'cap'"),
          t.eq("top_seller({'tee': 5, 'bag': 5})", "'bag'"),
          t.eq('top_seller({})', "''"),
          t.eq("top_seller({'hat': 0})", "'hat'"),
          t.hidden("top_seller({'zip': 3, 'ant': 3, 'cow': 1})", "'ant'"),
          t.hidden("top_seller({'b': 1, 'a': 1, 'c': 2})", "'c'"),
        ],
        hints: ['Keep the best name so far. Start it at `\'\'`.', 'Replace it on more units, or on equal units with a smaller name.', 'Strings compare alphabetically with `<`.'],
        explanation: 'Dict order is the order products were added, not alphabetical. The tie rule needs its own comparison, and the empty case falls out of starting `best` at `\'\'`.',
        signature: 'contract:argmax-tie-alpha',
        minutes: 5,
      }),
      debug({
        id: 'c2-contract-type-debug',
        title: 'Debug: the wrong kind of answer',
        skills: ['edge_cases', 'list_append'],
        prompt: p(
          '`names` is a list of customer names, one per order. `repeat_customers(names)` should return a **list** of the names that appear more than once.',
          '',
          'Each name appears once in the answer, in the order it first appeared in `names`. No repeats returns `[]`.',
          '',
          "`repeat_customers(['ana', 'bo', 'ana', 'cy', 'bo'])` → `['ana', 'bo']`",
          '',
          'The code returns the wrong kind of answer. Fix it so it keeps the contract.',
        ),
        brokenCode: `def repeat_customers(names):
    counts = {}
    for name in names:
        counts[name] = counts.get(name, 0) + 1
    repeats = set()
    for name in names:
        if counts[name] > 1:
            repeats.add(name)
    return repeats`,
        solution: `def repeat_customers(names):
    counts = {}
    for name in names:
        counts[name] = counts.get(name, 0) + 1
    repeats = []
    for name in counts:
        if counts[name] > 1:
            repeats.append(name)
    return repeats`,
        tests: [
          t.eq("repeat_customers(['ana', 'bo', 'ana', 'cy', 'bo'])", "['ana', 'bo']"),
          t.eq("repeat_customers(['bo', 'ana', 'bo', 'ana'])", "['bo', 'ana']"),
          t.eq('repeat_customers([])', '[]'),
          t.eq("repeat_customers(['x'])", '[]'),
          t.hidden("repeat_customers(['a', 'a', 'a'])", "['a']"),
          t.hidden("repeat_customers(['c', 'b', 'a', 'b', 'c'])", "['c', 'b']"),
        ],
        hints: ['A set has no order, and it never equals a list.', 'Loop over `counts`: a dict keeps the order keys were first added.'],
        explanation: 'The contract fixed the output type (a list) and its order (first appearance). Looping over the dict gives each name once, in first-seen order.',
        signature: 'contract:output-type',
        minutes: 3,
      }),
      debug({
        id: 'c2-contract-gap-debug',
        title: 'Debug: the edge the code forgot',
        skills: ['edge_cases', 'state_tracking'],
        prompt: p(
          '`times` is a sorted list of the minutes at which support tickets arrived. `longest_wait(times)` should return the longest gap between two tickets in a row.',
          '',
          'With fewer than two tickets, return `0`.',
          '',
          '`longest_wait([3, 10, 12])` → `7`',
          '`longest_wait([5])` → `0`',
        ),
        brokenCode: `def longest_wait(times):
    best = times[1] - times[0]
    for i in range(2, len(times)):
        gap = times[i] - times[i - 1]
        if gap > best:
            best = gap
    return best`,
        solution: `def longest_wait(times):
    best = 0
    for i in range(1, len(times)):
        gap = times[i] - times[i - 1]
        if gap > best:
            best = gap
    return best`,
        tests: [
          t.eq('longest_wait([3, 10, 12])', '7'),
          t.eq('longest_wait([5])', '0'),
          t.eq('longest_wait([])', '0'),
          t.eq('longest_wait([0, 4, 9, 30])', '21'),
          t.hidden('longest_wait([1, 2])', '1'),
          t.hidden('longest_wait([7, 7, 7])', '0'),
        ],
        hints: ['What is `times[1]` when the list has one item?', 'Start `best` at the answer for "no gaps", and let the loop begin at index 1.'],
        explanation: 'Reading `times[1]` before checking the length breaks the contract on short lists. Starting at 0 and looping from index 1 makes the short cases fall out with no special code.',
        signature: 'contract:short-list',
        minutes: 3,
      }),
      write({
        id: 'c2-contract-rebuild',
        title: 'Rebuild: the best sales day',
        skills: ['edge_cases', 'state_tracking'],
        stage: 'reconstruct',
        prompt: p(
          '`sales` is a list of daily sales totals, one per day.',
          '',
          'Return the index of the day with the highest sales. On a tie, return the earlier day. An empty list returns `-1`.',
          '',
          'Write the contract as comments first, then the code.',
          '',
          '`best_day([120, 340, 90, 340])` → `1` (a tie: day 1 comes first)',
          '`best_day([])` → `-1`',
        ),
        starterCode: `def best_day(sales):
    pass`,
        solution: `def best_day(sales):
    # in:  list of numbers (can be empty, can repeat)
    # out: index of the highest; the earlier day on a tie; -1 if empty
    if len(sales) == 0:
        return -1
    best = 0
    for i in range(1, len(sales)):
        if sales[i] > sales[best]:
            best = i
    return best`,
        tests: [
          t.eq('best_day([120, 340, 90, 340])', '1'),
          t.eq('best_day([])', '-1'),
          t.eq('best_day([50])', '0'),
          t.eq('best_day([-3, -1, -2])', '1'),
          t.hidden('best_day([0, 0, 0])', '0'),
          t.hidden('best_day([1, 2, 3])', '2'),
        ],
        hints: ['Handle the empty list first.', 'Keep the index of the best day, not its value.', 'Use `>` so a later equal day does not win.'],
        explanation: 'Every rule in the contract shows up as one line: the empty check, the index instead of the value, and `>` for the tie.',
        signature: 'contract:argmax-index',
        minutes: 4,
      }),
    ],
  },

  // ───────────────────────────── Tuesday: by hand first
  {
    id: 'c2-manual',
    title: 'By hand first',
    summary: 'Work the example on paper, then turn each step into a line of code.',
    exercises: [
      output({
        id: 'c2-manual-table',
        title: 'A hand table, printed',
        skills: ['state_tracking', 'conditionals'],
        prompt: 'A shop has 5 units in stock and fills orders in turn. An order it cannot fill is skipped. Write the table by hand, one row per order, then check it against what this prints.',
        note: 'Solving by hand means one row per step, with a column for every value that changes. Those columns become your variables.',
        code: `stock = 5
for order in [2, 4, 1, 2]:
    if order <= stock:
        stock -= order
        print(order, 'filled', stock)
    else:
        print(order, 'skipped', stock)`,
        expectedOutput: '2 filled 3\n4 skipped 3\n1 filled 2\n2 filled 0',
        explanation: 'The only column that carries from row to row is `stock`: that is the state. `order` is just the item you are looking at.',
        signature: 'trace:hand-table',
        minutes: 1.5,
      }),
      write({
        id: 'c2-manual-stamps',
        title: 'From the table to code',
        skills: ['state_tracking', 'conditionals', 'accumulator'],
        prompt: p(
          '`purchases` is a list of coffee purchase amounts in dollars, in order. A purchase of $5 or more earns one stamp. When you reach 4 stamps, you earn a free coffee and your stamps go back to 0.',
          '',
          'Return how many free coffees the list earns. Here is `[6, 3, 5, 7, 9]` worked by hand:',
          '',
          '```',
          'amount  stamp?  stamps  free',
          '6       yes     1       0',
          '3       no      1       0',
          '5       yes     2       0',
          '7       yes     3       0',
          '9       yes     0       1',
          '```',
          '',
          'Each column you tracked is a variable. Each row is one turn of the loop.',
          '',
          '`free_coffees([6, 3, 5, 7, 9])` → `1`',
          '`free_coffees([])` → `0`',
        ),
        starterCode: `def free_coffees(purchases):
    pass`,
        solution: `def free_coffees(purchases):
    stamps = 0
    free = 0
    for amount in purchases:
        if amount >= 5:
            stamps += 1
        if stamps == 4:
            free += 1
            stamps = 0
    return free`,
        tests: [
          t.eq('free_coffees([6, 3, 5, 7, 9])', '1'),
          t.eq('free_coffees([])', '0'),
          t.eq('free_coffees([5, 5, 5, 5, 5, 5, 5, 5])', '2'),
          t.eq('free_coffees([4.99, 4, 1])', '0'),
          t.hidden('free_coffees([5, 5, 5, 5, 5, 5, 5])', '1'),
          t.hidden('free_coffees([10, 2, 10, 10, 10, 10])', '1'),
        ],
        hints: ['Two columns change from row to row: `stamps` and `free`.', 'After adding a stamp, check whether you reached 4.'],
        explanation: 'The table had two changing columns, so the code has two variables. The reset in the last row is the step people forget when they skip the table.',
        signature: 'manual:table-to-code',
        minutes: 4,
      }),
      code({
        id: 'c2-manual-split-bill',
        title: 'Finish the subgoals',
        skills: ['functions', 'accumulator', 'list_append'],
        stage: 'complete',
        style: 'finish',
        prompt: p(
          '`total` is a bill in cents. `people` is how many people split it, at least 1.',
          '',
          'Each person pays `total // people`. The leftover cents go one each to the first people in line. Return a list of what each person pays.',
          '',
          'By hand, 1000 cents for 3 people: a base share of 333 and 1 cent left over. So the first person pays 334.',
          '',
          'The subgoals are written as comments. Finish each one.',
          '',
          '`split_bill(1000, 3)` → `[334, 333, 333]`',
          '`split_bill(0, 2)` → `[0, 0]`',
        ),
        starterCode: `def split_bill(total, people):
    # 1. Everyone's base share.
    base = ____
    # 2. How many cents are left over.
    leftover = ____
    # 3. One entry per person: base, plus 1 cent for the first \`leftover\` people.
    shares = []
    for i in range(people):
        ____
    return shares`,
        solution: `def split_bill(total, people):
    # 1. Everyone's base share.
    base = total // people
    # 2. How many cents are left over.
    leftover = total % people
    # 3. One entry per person: base, plus 1 cent for the first \`leftover\` people.
    shares = []
    for i in range(people):
        if i < leftover:
            shares.append(base + 1)
        else:
            shares.append(base)
    return shares`,
        tests: [
          t.eq('split_bill(1000, 3)', '[334, 333, 333]'),
          t.eq('split_bill(0, 2)', '[0, 0]'),
          t.eq('split_bill(5, 1)', '[5]'),
          t.eq('split_bill(7, 4)', '[2, 2, 2, 1]'),
          t.hidden('split_bill(2, 5)', '[1, 1, 0, 0, 0]'),
          t.hidden('split_bill(900, 3)', '[300, 300, 300]'),
        ],
        hints: ['`%` gives what is left after dividing.', 'Person `i` gets the extra cent when `i < leftover`.'],
        explanation: 'Each comment is one subgoal from the hand calculation. Writing them first turns a vague task into three small ones.',
        signature: 'manual:subgoal-comments',
        minutes: 4,
      }),
      debug({
        id: 'c2-manual-parking-debug',
        title: 'Debug: the step the code skips',
        skills: ['conditionals', 'edge_cases'],
        prompt: p(
          '`minutes` is how long a car stayed in a garage. The fee is $3 for every started hour: 61 minutes counts as 2 hours. 0 minutes costs $0. One stay never costs more than $15.',
          '',
          '`parking_fee(minutes)` should return the fee in dollars.',
          '',
          '`parking_fee(61)` → `6`',
          '`parking_fee(400)` → `15`',
          '',
          'Work `parking_fee(400)` by hand first: 400 minutes is 7 started hours, which is $21, which is more than $15. Which step from your hand calculation is the code missing?',
        ),
        brokenCode: `def parking_fee(minutes):
    hours = minutes // 60
    if minutes % 60 > 0:
        hours += 1
    return hours * 3`,
        solution: `def parking_fee(minutes):
    hours = minutes // 60
    if minutes % 60 > 0:
        hours += 1
    return min(hours * 3, 15)`,
        tests: [
          t.eq('parking_fee(60)', '3'),
          t.eq('parking_fee(61)', '6'),
          t.eq('parking_fee(0)', '0'),
          t.eq('parking_fee(400)', '15'),
          t.hidden('parking_fee(299)', '15'),
          t.hidden('parking_fee(240)', '12'),
          t.hidden('parking_fee(1)', '3'),
        ],
        hints: ['Your hand calculation had three steps. Count the steps in the code.', '`min(a, b)` returns the smaller of two numbers.'],
        explanation: 'By hand you would never write $21 for a stay capped at $15. The table catches the missing step; reading the code rarely does.',
        signature: 'manual:missing-step',
        minutes: 3,
      }),
      write({
        id: 'c2-manual-helpers',
        title: 'Steps as helper functions',
        skills: ['functions', 'string_methods', 'dict_get'],
        prompt: p(
          "Each line of a packing list looks like `'mug:3'`: an item name, a colon, then a quantity. `lines` is a list of such lines. An item can appear on more than one line.",
          '',
          "By hand, `['mug:3', 'pen:2', 'mug:1']` goes like this. Read mug and 3, add 3 to mug. Read pen and 2, add 2 to pen. Read mug and 1, add 1 to mug.",
          '',
          'Each step you repeated is a helper. Write two functions:',
          '- `parse_line(line)` returns the pair `(name, quantity)`, with quantity as an int.',
          '- `item_totals(lines)` returns a dict from each item name to its total quantity. It uses `parse_line`.',
          '',
          "`parse_line('mug:3')` → `('mug', 3)`",
          "`item_totals(['mug:3', 'pen:2', 'mug:1'])` → `{'mug': 4, 'pen': 2}`",
          '`item_totals([])` → `{}`',
        ),
        note: 'A step you can name ("read one line") is a function you can write and test on its own. Then the main function reads like the hand steps.',
        starterCode: `def parse_line(line):
    pass

def item_totals(lines):
    pass`,
        solution: `def parse_line(line):
    name, qty = line.split(':')
    return (name, int(qty))

def item_totals(lines):
    totals = {}
    for line in lines:
        name, qty = parse_line(line)
        totals[name] = totals.get(name, 0) + qty
    return totals`,
        tests: [
          t.eq("parse_line('mug:3')", "('mug', 3)"),
          t.eq("parse_line('desk lamp:10')", "('desk lamp', 10)"),
          t.eq("item_totals(['mug:3', 'pen:2', 'mug:1'])", "{'mug': 4, 'pen': 2}"),
          t.eq('item_totals([])', '{}'),
          t.hidden("item_totals(['a:0'])", "{'a': 0}"),
          t.hidden("item_totals(['x:1', 'y:1', 'x:1', 'y:5'])", "{'x': 2, 'y': 6}"),
        ],
        hints: ["`'mug:3'.split(':')` gives `['mug', '3']`.", '`int(...)` turns `\'3\'` into `3`.', 'In `item_totals`, call `parse_line` on each line and add to a dict with `.get(name, 0)`.'],
        explanation: '`parse_line` is the "read" step and `item_totals` is the "add" step. Testing `parse_line` alone finds parsing bugs before they hide inside the totals.',
        signature: 'manual:helpers-parse-total',
        minutes: 5,
      }),
      reorder({
        id: 'c2-manual-reorder',
        title: 'Put the subgoals in order',
        skills: ['functions', 'conditionals'],
        prompt: p(
          "`scores` is a list of test scores from 0 to 100. `letter_counts(scores)` returns a dict counting the letter grades. 90 and up is `'A'`, 80 and up is `'B'`, 70 and up is `'C'`, and anything lower is `'F'`.",
          '',
          'Every letter appears in the dict, even with a count of 0. Put the lines in order: first the helper that grades one score, then the function that counts.',
        ),
        lines: [
          'def letter(score):',
          '    if score >= 90:',
          "        return 'A'",
          '    if score >= 80:',
          "        return 'B'",
          '    if score >= 70:',
          "        return 'C'",
          "    return 'F'",
          'def letter_counts(scores):',
          "    counts = {'A': 0, 'B': 0, 'C': 0, 'F': 0}",
          '    for score in scores:',
          '        counts[letter(score)] += 1',
          '    return counts',
        ],
        tests: [
          t.eq('letter_counts([95, 85, 72, 40, 90])', "{'A': 2, 'B': 1, 'C': 1, 'F': 1}"),
          t.eq('letter_counts([])', "{'A': 0, 'B': 0, 'C': 0, 'F': 0}"),
          t.eq('letter(80)', "'B'"),
          t.hidden('letter(69)', "'F'"),
          t.hidden('letter_counts([100, 70])', "{'A': 1, 'B': 0, 'C': 1, 'F': 0}"),
        ],
        explanation: 'The checks go from the highest grade down. A score of 95 is also at least 80, so the order of the `if`s is part of the logic.',
        signature: 'reorder:grade-helper',
        minutes: 3,
      }),
      write({
        id: 'c2-manual-tickets',
        title: 'Hand steps to helpers, on your own',
        skills: ['functions', 'conditionals', 'accumulator'],
        prompt: p(
          'A cinema prices tickets by age. Under 12 pays $8. 65 and over pays $9. Everyone else pays $14. A group of 5 or more people gets $10 off the total.',
          '',
          '`ages` is a list of the ages in one group. Write two functions:',
          '- `ticket_price(age)` returns the price of one ticket.',
          '- `group_total(ages)` returns what the whole group pays. It uses `ticket_price`.',
          '',
          'Work `[30, 8, 70, 40, 10]` by hand before you code: 14 + 8 + 9 + 14 + 8 is 53, and 5 people get $10 off.',
          '',
          '`group_total([30, 8, 70, 40, 10])` → `43`',
          '`group_total([])` → `0`',
        ),
        starterCode: `def ticket_price(age):
    pass

def group_total(ages):
    pass`,
        solution: `def ticket_price(age):
    if age < 12:
        return 8
    if age >= 65:
        return 9
    return 14

def group_total(ages):
    total = 0
    for age in ages:
        total += ticket_price(age)
    if len(ages) >= 5:
        total -= 10
    return total`,
        tests: [
          t.eq('group_total([30, 8, 70, 40, 10])', '43'),
          t.eq('group_total([])', '0'),
          t.eq('ticket_price(12)', '14'),
          t.eq('ticket_price(65)', '9'),
          t.hidden('ticket_price(11)', '8'),
          t.hidden('group_total([20, 20, 20, 20])', '56'),
          t.hidden('group_total([5, 5, 5, 5, 5, 5])', '38'),
        ],
        hints: ['Check the edges of each age rule: 11, 12, 64, 65.', 'The discount depends on the group size, so apply it after the loop.'],
        explanation: 'Your hand work had two kinds of step: price one person, then adjust the total. Each became a function, and the boundary ages became tests.',
        signature: 'manual:helpers-price-total',
        minutes: 5,
      }),
      write({
        id: 'c2-manual-rebuild',
        title: 'Rebuild: compress a string',
        skills: ['string_iterate', 'state_tracking', 'edge_cases'],
        stage: 'reconstruct',
        prompt: p(
          '`s` is a string. Return a compressed version: each run of the same letter becomes the letter followed by how long the run is. An empty string returns `\'\'`.',
          '',
          'Work `\'aaabcc\'` by hand in a table first. Then write the code from your table.',
          '',
          "`compress('aaabcc')` → `'a3b1c2'`",
          "`compress('')` → `''`",
        ),
        starterCode: `def compress(s):
    pass`,
        solution: `def compress(s):
    if s == '':
        return ''
    pieces = []
    current = s[0]
    count = 0
    for ch in s:
        if ch == current:
            count += 1
        else:
            pieces.append(current + str(count))
            current = ch
            count = 1
    pieces.append(current + str(count))
    return ''.join(pieces)`,
        tests: [
          t.eq("compress('aaabcc')", "'a3b1c2'"),
          t.eq("compress('')", "''"),
          t.eq("compress('z')", "'z1'"),
          t.eq("compress('abab')", "'a1b1a1b1'"),
          t.hidden("compress('wwwwwwwwwwww')", "'w12'"),
          t.hidden("compress('xyy')", "'x1y2'"),
        ],
        hints: ['Track the current letter and how many times in a row you have seen it.', 'On a new letter, write down the old run and start a new one.', 'After the loop, the last run has not been written yet.'],
        explanation: 'The table shows the step people forget: the last run is written after the loop, because no new letter comes along to trigger it.',
        signature: 'manual:run-compress',
        minutes: 6,
      }),
    ],
  },

  // ───────────────────────────── Wednesday: your own tests
  {
    id: 'c2-testing',
    title: 'Testing your own code',
    summary: 'Pick the inputs that would break it, and prove it before anyone else does.',
    exercises: [
      write({
        id: 'c2-test-break-boundary',
        title: 'Break it: the boundary',
        skills: ['edge_cases', 'conditionals'],
        style: 'write-test',
        stage: 'debug',
        prompt: p(
          'An order ships free when its total is $50 or more. This check is in the editor:',
          '',
          '```python',
          'def ships_free(total):',
          '    return total > 50',
          '```',
          '',
          'Leave `ships_free` as it is. Make `breaking_input()` return a total on which it gives the **wrong** answer.',
        ),
        note: 'Bugs hide at the edges: exactly on a boundary, an empty list, one item, a tie. Try those first.',
        starterCode: `def ships_free(total):
    return total > 50

def breaking_input():
    pass`,
        solution: `def ships_free(total):
    return total > 50

def breaking_input():
    return 50`,
        tests: [breaks('def _bad(total):\n    return total > 50\ndef _right(total):\n    return total >= 50', "assert isinstance(x, (int, float)), 'return a number'", 'ships_free')],
        hints: ['Which total does "$50 or more" include that `> 50` leaves out?'],
        explanation: '"Or more" means `>=`. Exactly on the boundary is the only place `>` and `>=` disagree, so it is the first value to test.',
        signature: 'write-test:boundary',
        minutes: 2,
      }),
      write({
        id: 'c2-test-break-empty',
        title: 'Break it: the empty list',
        skills: ['edge_cases'],
        style: 'write-test',
        stage: 'debug',
        prompt: p(
          '`lowest_stock(counts)` should return the smallest stock count in the list. An empty list should return `None`.',
          '',
          '```python',
          'def lowest_stock(counts):',
          '    lowest = counts[0]',
          '    for c in counts:',
          '        if c < lowest:',
          '            lowest = c',
          '    return lowest',
          '```',
          '',
          'Leave it as it is. Make `breaking_input()` return a list on which it crashes or gives the wrong answer.',
        ),
        starterCode: `def lowest_stock(counts):
    lowest = counts[0]
    for c in counts:
        if c < lowest:
            lowest = c
    return lowest

def breaking_input():
    pass`,
        solution: `def lowest_stock(counts):
    lowest = counts[0]
    for c in counts:
        if c < lowest:
            lowest = c
    return lowest

def breaking_input():
    return []`,
        tests: [
          breaks(
            'def _bad(counts):\n    lowest = counts[0]\n    for c in counts:\n        if c < lowest:\n            lowest = c\n    return lowest\ndef _right(counts):\n    return min(counts) if counts else None',
            "assert isinstance(x, list), 'return a list'",
            'lowest_stock',
          ),
        ],
        hints: ['What does `counts[0]` do when there is no item 0?'],
        explanation: 'Any line that reads `counts[0]` before checking the length is a crash waiting for an empty list. The empty input is the cheapest test there is.',
        signature: 'write-test:empty',
        minutes: 2,
      }),
      write({
        id: 'c2-test-break-ties',
        title: 'Break it: the tie',
        skills: ['edge_cases', 'dict_items'],
        style: 'write-test',
        stage: 'debug',
        prompt: p(
          '`votes` is a dict from a menu item to how many votes it got. `winner(votes)` should return the item with the most votes. On a tie, it should return the name that comes first alphabetically.',
          '',
          '```python',
          'def winner(votes):',
          "    best = ''",
          '    for item in votes:',
          "        if best == '' or votes[item] > votes[best]:",
          '            best = item',
          '    return best',
          '```',
          '',
          'Leave it as it is. Make `breaking_input()` return a non-empty dict on which it gives the wrong answer.',
        ),
        starterCode: `def winner(votes):
    best = ''
    for item in votes:
        if best == '' or votes[item] > votes[best]:
            best = item
    return best

def breaking_input():
    pass`,
        solution: `def winner(votes):
    best = ''
    for item in votes:
        if best == '' or votes[item] > votes[best]:
            best = item
    return best

def breaking_input():
    return {'tacos': 3, 'pasta': 3}`,
        tests: [
          breaks(
            "def _bad(votes):\n    best = ''\n    for item in votes:\n        if best == '' or votes[item] > votes[best]:\n            best = item\n    return best\ndef _right(votes):\n    top = max(votes.values())\n    return min(k for k in votes if votes[k] == top)",
            "assert isinstance(x, dict) and len(x) > 0, 'return a non-empty dict'",
            'winner',
          ),
        ],
        hints: ['The code keeps the first item it sees with the most votes. When is the first one not the alphabetical one?'],
        explanation: 'With a tie, the code keeps whichever item came first in the dict. Putting the later-alphabet name first exposes it.',
        signature: 'write-test:tie',
        minutes: 3,
      }),
      write({
        id: 'c2-test-write-asserts',
        title: 'Write the test that catches it',
        skills: ['edge_cases'],
        style: 'write-test',
        prompt: p(
          '`count_late(days, limit)` should count the orders that took **more than** `limit` days. Someone wrote it with `>=`:',
          '',
          '```python',
          'def count_late(days, limit):',
          '    count = 0',
          '    for d in days:',
          '        if d >= limit:',
          '            count += 1',
          '    return count',
          '```',
          '',
          'Write `test_count_late(count_late)`. Its argument is the function being tested. The checker calls your test twice: once with a correct `count_late`, once with the version above.',
          '',
          'Inside, write at least three lines like `assert count_late([1, 5], 3) == 1`. An `assert` raises an error when its condition is false.',
          '',
          'Every assert must pass for the correct version. At least one must fail for the version above.',
        ),
        note: 'A test function takes the function it tests as an argument. That way one test can be run against many versions: the right one and the broken ones.',
        starterCode: `def test_count_late(count_late):
    pass`,
        solution: `def test_count_late(count_late):
    assert count_late([1, 5, 9], 4) == 2
    assert count_late([4, 4], 4) == 0
    assert count_late([], 4) == 0`,
        tests: catches(
          'test_count_late',
          'def _good(days, limit):\n    count = 0\n    for d in days:\n        if d > limit:\n            count += 1\n    return count',
          [{ name: 'fails on the >= version', code: 'def _bad(days, limit):\n    count = 0\n    for d in days:\n        if d >= limit:\n            count += 1\n    return count' }],
        ),
        hints: ['Which value of `d` makes `>` and `>=` disagree?', 'Include a day exactly equal to `limit`.'],
        explanation: 'Your test is the contract written as code. The day exactly on the limit is the one input where the two versions disagree.',
        signature: 'test:boundary-assert',
        minutes: 4,
      }),
      write({
        id: 'c2-test-weak-test',
        title: 'A test that misses the bug',
        skills: ['edge_cases'],
        style: 'write-test',
        prompt: p(
          '`average_rating(ratings)` should return the average of a list of ratings, rounded to 1 decimal place. An empty list should return `0.0`.',
          '',
          'The test in the editor passes for a correct version. It also passes for this buggy one:',
          '',
          '```python',
          'def average_rating(ratings):',
          '    return round(sum(ratings) / len(ratings), 1)',
          '```',
          '',
          'Add asserts so the test still passes for a correct version and fails for the buggy one. An error inside your test counts as failing.',
        ),
        starterCode: `def test_average_rating(average_rating):
    assert average_rating([4, 5]) == 4.5
    assert average_rating([3, 3, 4]) == 3.3`,
        solution: `def test_average_rating(average_rating):
    assert average_rating([4, 5]) == 4.5
    assert average_rating([3, 3, 4]) == 3.3
    assert average_rating([]) == 0.0
    assert average_rating([2]) == 2.0`,
        tests: catches(
          'test_average_rating',
          'def _good(ratings):\n    if len(ratings) == 0:\n        return 0.0\n    return round(sum(ratings) / len(ratings), 1)',
          [{ name: 'fails on the buggy version', code: 'def _bad(ratings):\n    return round(sum(ratings) / len(ratings), 1)' }],
        ),
        hints: ['Both existing asserts are normal cases. Which case in the contract do they skip?'],
        explanation: 'The test only checked the cases the code was written for. The edge case named in the contract is the one that finds the crash.',
        signature: 'test:add-edge-assert',
        minutes: 3,
      }),
      debug({
        id: 'c2-test-dupes-debug',
        title: 'Debug: let the tests point',
        skills: ['edge_cases', 'list_append'],
        prompt: p(
          '`skus` is a list of product codes from today\'s orders. `sold_once(skus)` should return the codes that appear exactly once, in the order they appear.',
          '',
          "`sold_once(['a', 'b', 'a'])` → `['b']`",
          '',
          'Run the tests, read which one fails, and fix the function.',
        ),
        brokenCode: `def sold_once(skus):
    result = []
    for i in range(len(skus)):
        if skus[i] not in skus[i + 1:]:
            result.append(skus[i])
    return result`,
        solution: `def sold_once(skus):
    result = []
    for sku in skus:
        if skus.count(sku) == 1:
            result.append(sku)
    return result`,
        tests: [
          t.eq("sold_once(['a', 'b', 'a'])", "['b']"),
          t.eq('sold_once([])', '[]'),
          t.eq("sold_once(['x'])", "['x']"),
          t.eq("sold_once(['p', 'q', 'r'])", "['p', 'q', 'r']"),
          t.hidden("sold_once(['z', 'z', 'z'])", '[]'),
          t.hidden("sold_once(['a', 'b', 'b', 'c', 'a'])", "['c']"),
        ],
        hints: ["For the last 'a' in `['a', 'b', 'a']`, what is `skus[i + 1:]`?", 'The code only looks forward. A repeat can also be behind you.'],
        explanation: 'Looking only at later items treats the last copy of a repeat as unique. The failing test with a repeat at the end shows it at once; `skus.count(sku)` looks at the whole list.',
        signature: 'test:debug-from-failure',
        minutes: 3,
      }),
      write({
        id: 'c2-test-catch-three',
        title: 'Catch three hidden bugs',
        skills: ['edge_cases'],
        style: 'write-test',
        difficulty: 3,
        prompt: p(
          '`second_best(scores)` returns the second-highest **different** score in the list. With fewer than two different scores, it returns `None`.',
          '',
          '`[90, 70, 90, 80]` gives `80`. 90 is the highest, and the second 90 does not count.',
          '',
          'Write `test_second_best(second_best)`. The checker runs it on a correct version and on three wrong versions you can\'t see. Each wrong version makes a common mistake.',
          '',
          'Your asserts must pass on the correct version and fail on each wrong one. An error inside your test also counts as failing.',
          '',
          'Choose inputs from the contract: repeats, too few scores, and the order of the list.',
        ),
        starterCode: `def test_second_best(second_best):
    pass`,
        solution: `def test_second_best(second_best):
    assert second_best([90, 70, 90, 80]) == 80
    assert second_best([5]) is None
    assert second_best([]) is None
    assert second_best([70, 90]) == 70
    assert second_best([90, 70]) == 70`,
        tests: catches(
          'test_second_best',
          'def _good(scores):\n    distinct = sorted(set(scores))\n    if len(distinct) < 2:\n        return None\n    return distinct[-2]',
          [
            { name: 'catches the version that counts repeats', code: 'def _bad(scores):\n    s = sorted(scores)\n    if len(s) < 2:\n        return None\n    return s[-2]' },
            { name: 'catches the version that fails on short lists', code: 'def _bad(scores):\n    distinct = sorted(set(scores))\n    return distinct[-2]' },
            {
              name: 'catches the version that depends on order',
              code: 'def _bad(scores):\n    best = None\n    second = None\n    for s in scores:\n        if best is None or s > best:\n            best = s\n        elif s != best and (second is None or s > second):\n            second = s\n    return second',
            },
          ],
        ),
        hints: ['One assert per edge case: a repeated top score, a list with one score, and a list where the highest comes last.', 'What should `[70, 90]` give?'],
        explanation: 'Three edge cases, three bugs. You did not need to see the wrong code: the contract told you where bugs hide.',
        signature: 'test:hidden-bugs',
        minutes: 6,
      }),
    ],
  },

  // ───────────────────────────── Thursday: brute force, then improve
  {
    id: 'c2-improve',
    title: 'Brute force, then improve',
    summary: 'Write the simple version, count its work, find what repeats, and remove it.',
    exercises: [
      output({
        id: 'c2-improve-count-work',
        title: 'Count the pair checks',
        skills: ['complexity', 'for_loop'],
        prompt: 'A brute-force solution often compares every pair of items. Predict how many pairs this checks for 4, 8 and 16 items.',
        note: 'Doubling the input roughly quadruples the pair checks. That growth is **O(n²)**: fine for 10 items, slow for 100,000.',
        code: `def pair_checks(n):
    checks = 0
    for i in range(n):
        for j in range(i + 1, n):
            checks += 1
    return checks

print(pair_checks(4))
print(pair_checks(8))
print(pair_checks(16))`,
        expectedOutput: '6\n28\n120',
        explanation: 'Each item is paired with every item after it: n × (n − 1) / 2 pairs. Twice the items, about four times the work.',
        signature: 'trace:count-pairs',
        minutes: 2,
      }),
      write({
        id: 'c2-improve-avg-once',
        title: 'Compute it once',
        skills: ['complexity', 'accumulator'],
        style: 'optimize',
        prompt: p(
          '`scores` is a list of numbers. This counts the scores above the average. It is correct, but it adds up the whole list again for every score:',
          '',
          '```python',
          'def above_average_slow(scores):',
          '    count = 0',
          '    for s in scores:',
          '        if s > sum(scores) / len(scores):',
          '            count += 1',
          '    return count',
          '```',
          '',
          'The average never changes inside the loop. Write `above_average(scores)` that computes it once, before the loop. An empty list returns `0`.',
          '',
          '`above_average([60, 80, 100])` → `1`',
          '`above_average([])` → `0`',
        ),
        starterCode: `def above_average(scores):
    pass`,
        solution: `def above_average(scores):
    if len(scores) == 0:
        return 0
    avg = sum(scores) / len(scores)
    count = 0
    for s in scores:
        if s > avg:
            count += 1
    return count`,
        tests: [
          t.eq('above_average([60, 80, 100])', '1'),
          t.eq('above_average([])', '0'),
          t.eq('above_average([5, 5, 5])', '0'),
          t.eq('above_average([1, 2, 3, 10])', '1'),
          t.hidden('above_average([7])', '0'),
          t.hidden('above_average([-2, 0, 2, 4])', '2'),
        ],
        hints: ['Move `sum(scores) / len(scores)` above the loop and store it.', 'Check the empty list before you divide.'],
        explanation: '`sum` is itself a loop. Inside another loop it made the function O(n²); computed once it is O(n). Anything that does not change inside a loop belongs outside it.',
        signature: 'improve:precompute',
        complexity: { time: 'O(n)', space: 'O(1)' },
        minutes: 3,
      }),
      write({
        id: 'c2-improve-pairs-brute',
        title: 'Brute force: matching sizes',
        skills: ['complexity', 'for_loop'],
        prompt: p(
          '`sizes` is a list of shoe sizes returned to a store. Two returns **match** when they have the same size.',
          '',
          'Return how many matches there are: count every pair of positions `i < j` with the same size. Write it the simple way first and check every pair.',
          '',
          '`same_size_pairs([9, 10, 9, 9])` → `3` (three 9s make three pairs)',
          '`same_size_pairs([8])` → `0`',
        ),
        starterCode: `def same_size_pairs(sizes):
    pass`,
        solution: `def same_size_pairs(sizes):
    count = 0
    for i in range(len(sizes)):
        for j in range(i + 1, len(sizes)):
            if sizes[i] == sizes[j]:
                count += 1
    return count`,
        tests: [
          t.eq('same_size_pairs([9, 10, 9, 9])', '3'),
          t.eq('same_size_pairs([8])', '0'),
          t.eq('same_size_pairs([])', '0'),
          t.eq('same_size_pairs([7, 7])', '1'),
          t.hidden('same_size_pairs([1, 2, 3])', '0'),
          t.hidden('same_size_pairs([5, 5, 5, 5])', '6'),
          t.hidden('same_size_pairs([4, 6, 4, 6, 4])', '4'),
        ],
        hints: ['Two loops: `i` over every position, `j` over every position after `i`.'],
        explanation: 'The brute force is easy to trust: it checks every pair exactly once. It is O(n²), and it is your answer key for the faster version.',
        signature: 'improve:brute-pairs',
        complexity: { time: 'O(n²)', space: 'O(1)' },
        minutes: 3,
      }),
      output({
        id: 'c2-improve-pairs-trace',
        title: 'Remember instead of rescanning',
        skills: ['complexity', 'frequency_map'],
        prompt: p(
          'The brute force rescans every earlier shoe for each new one. Instead, keep a count of each size seen so far. A new shoe makes one new pair with each earlier shoe of its size.',
          '',
          'Predict what this prints.',
        ),
        code: `sizes = [9, 10, 9, 9]
seen = {}
pairs = 0
for s in sizes:
    pairs += seen.get(s, 0)
    seen[s] = seen.get(s, 0) + 1
    print(s, pairs, seen)`,
        expectedOutput: '9 0 {9: 1}\n10 0 {9: 1, 10: 1}\n9 1 {9: 2, 10: 1}\n9 3 {9: 3, 10: 1}',
        explanation: 'The third 9 pairs with the two 9s before it. The dict already knows there were two, so no rescan is needed.',
        signature: 'trace:count-seen-pairs',
        minutes: 2,
      }),
      write({
        id: 'c2-improve-pairs-fast',
        title: 'Improve: matching sizes in one pass',
        skills: ['complexity', 'frequency_map', 'dict_get'],
        style: 'optimize',
        prompt: p(
          '`sizes` is a list of shoe sizes. Return how many pairs of positions `i < j` have the same size.',
          '',
          "Do it in one pass. Keep a dict from each size to how many times you've seen it so far. Each new shoe adds one pair per earlier shoe of its size.",
          '',
          '`fast_pairs([9, 10, 9, 9])` → `3`',
          '`fast_pairs([])` → `0`',
        ),
        starterCode: `def fast_pairs(sizes):
    pass`,
        solution: `def fast_pairs(sizes):
    seen = {}
    pairs = 0
    for s in sizes:
        pairs += seen.get(s, 0)
        seen[s] = seen.get(s, 0) + 1
    return pairs`,
        tests: [
          t.eq('fast_pairs([9, 10, 9, 9])', '3'),
          t.eq('fast_pairs([])', '0'),
          t.eq('fast_pairs([8])', '0'),
          t.eq('fast_pairs([5, 5, 5, 5])', '6'),
          t.hidden('fast_pairs([4, 6, 4, 6, 4])', '4'),
          t.hidden('fast_pairs([1] * 2000)', '1999000'),
        ],
        hints: ['Add the count of earlier same sizes before you count the current shoe.', '`pairs += seen.get(s, 0)`, then update `seen[s]`.'],
        explanation: 'The brute force asked "how many earlier shoes match?" by rescanning. The dict keeps that answer, so each shoe costs one lookup: O(n) time, O(k) space for k sizes.',
        signature: 'improve:count-pairs-dict',
        complexity: { time: 'O(n)', space: 'O(k)' },
        minutes: 4,
      }),
      write({
        id: 'c2-improve-refunds',
        title: 'Improve: replace the inner scan',
        skills: ['complexity', 'dict_create', 'dict_lookup'],
        style: 'optimize',
        prompt: p(
          '`orders` is a list of `(order_id, amount)` pairs, with no id repeated. `returned` is a list of order ids that were sent back.',
          '',
          'Return the total refund: the sum of the amounts of the returned orders. Ignore ids that match no order. This works, but scans all of `orders` for every returned id:',
          '',
          '```python',
          'def refund_total_slow(orders, returned):',
          '    total = 0',
          '    for rid in returned:',
          '        for oid, amount in orders:',
          '            if oid == rid:',
          '                total += amount',
          '    return total',
          '```',
          '',
          'Write `refund_total(orders, returned)`. Build a dict from order id to amount once. Then look up each returned id.',
          '',
          '`refund_total([(1, 30), (2, 45), (3, 10)], [3, 1])` → `40`',
          '`refund_total([(1, 30)], [7])` → `0` (there is no order 7)',
        ),
        starterCode: `def refund_total(orders, returned):
    pass`,
        solution: `def refund_total(orders, returned):
    amounts = {}
    for oid, amount in orders:
        amounts[oid] = amount
    total = 0
    for rid in returned:
        if rid in amounts:
            total += amounts[rid]
    return total`,
        tests: [
          t.eq('refund_total([(1, 30), (2, 45), (3, 10)], [3, 1])', '40'),
          t.eq('refund_total([(1, 30)], [7])', '0'),
          t.eq('refund_total([], [])', '0'),
          t.eq('refund_total([(5, 12)], [])', '0'),
          t.hidden('refund_total([(10, 5), (11, 6)], [11])', '6'),
          t.hidden('refund_total([(1, 1), (2, 2), (3, 3)], [1, 2, 3, 4])', '6'),
        ],
        hints: ['First loop: fill the dict. Second loop: look up each returned id.', 'Check `rid in amounts` before reading `amounts[rid]`.'],
        explanation: 'The inner loop searched for one id at a time. A dict answers "what is the amount for this id?" in one step, so O(n × m) becomes O(n + m).',
        signature: 'improve:nested-to-dict',
        complexity: { time: 'O(n + m)', space: 'O(n)' },
        minutes: 4,
      }),
      debug({
        id: 'c2-improve-debug-lookup',
        title: 'Debug: the lookup points the wrong way',
        skills: ['dict_assign', 'dict_lookup', 'complexity'],
        prompt: p(
          '`catalog` is a list of `(sku, price)` pairs. `cart` is a list of skus, and a sku can appear more than once. Every sku in `cart` is in `catalog`.',
          '',
          '`cart_total(catalog, cart)` should return the total price of the cart. It builds a dict once, then looks up each sku. It crashes on most carts.',
          '',
          "`cart_total([('A1', 4), ('B2', 10)], ['A1', 'B2', 'A1'])` → `18`",
        ),
        brokenCode: `def cart_total(catalog, cart):
    prices = {}
    for sku, price in catalog:
        prices[price] = sku
    total = 0
    for sku in cart:
        total += prices[sku]
    return total`,
        solution: `def cart_total(catalog, cart):
    prices = {}
    for sku, price in catalog:
        prices[sku] = price
    total = 0
    for sku in cart:
        total += prices[sku]
    return total`,
        tests: [
          t.eq("cart_total([('A1', 4), ('B2', 10)], ['A1', 'B2', 'A1'])", '18'),
          t.eq("cart_total([('A1', 4)], [])", '0'),
          t.eq("cart_total([('Z', 3)], ['Z'])", '3'),
          t.hidden("cart_total([('X', 1), ('Y', 2), ('W', 7)], ['W', 'W'])", '14'),
          t.hidden("cart_total([], [])", '0'),
        ],
        hints: ['What do you look up by, and what do you want back?', 'The key is what you search with.'],
        explanation: 'A dict lookup goes from key to value. You search by sku and want a price, so the sku is the key.',
        signature: 'improve:dict-direction',
        minutes: 3,
      }),
      write({
        id: 'c2-improve-rebuild',
        title: 'Rebuild: the first repeated ticket',
        skills: ['complexity', 'set_membership', 'set_add'],
        stage: 'reconstruct',
        prompt: p(
          '`ids` is a list of ticket ids in the order they were scanned.',
          '',
          'Return the first id that is scanned a second time: the repeat that happens earliest. If nothing repeats, return `None`. Write the simple version in your head, find its repeated work, then write the improved one.',
          '',
          '`first_repeat([4, 7, 2, 7, 4])` → `7` (the second 7 comes before the second 4)',
          '`first_repeat([1, 2, 3])` → `None`',
        ),
        starterCode: `def first_repeat(ids):
    pass`,
        solution: `def first_repeat(ids):
    seen = set()
    for x in ids:
        if x in seen:
            return x
        seen.add(x)
    return None`,
        tests: [
          t.eq('first_repeat([4, 7, 2, 7, 4])', '7'),
          t.eq('first_repeat([1, 2, 3])', 'None'),
          t.eq('first_repeat([])', 'None'),
          t.eq('first_repeat([5, 5])', '5'),
          t.hidden("first_repeat(['a', 'b', 'a'])", "'a'"),
          t.hidden('first_repeat([3, 1, 1, 3])', '1'),
          t.hidden('first_repeat(list(range(3000)) + [2999])', '2999'),
        ],
        hints: ['The simple version checks `ids[:j]` for every `j`. That rescans the same ids again and again.', 'Keep the ids you have already scanned.', 'Check before you add.'],
        explanation: 'The simple version checks each id against the slice `ids[:j]` of ids before it, and that slice rescans everything the last step already looked at. A set remembers it, so each check is one step: O(n) time instead of O(n²), for O(n) space.',
        signature: 'improve:first-repeat',
        complexity: { time: 'O(n)', space: 'O(n)' },
        minutes: 4,
      }),
    ],
  },

  // ───────────────────────────── Friday: the whole map
  {
    id: 'c2-solve-map',
    title: 'The Solve Map',
    summary: 'Small unfamiliar problems, end to end: contract, example, subgoals, state, simple, test, improve, implement, verify.',
    exercises: [
      explain({
        id: 'c2-solve-plan',
        title: 'Plan before you code',
        skills: ['explanation', 'edge_cases'],
        prompt: p(
          '`codes` is a list of discount codes used at checkout today. The task: return the codes used more than twice, sorted alphabetically.',
          '',
          "Don't write code yet. Write steps 1 to 5 of the Solve Map in plain words:",
          '1. **Contract**: inputs, output and its type, edge cases.',
          '2. **Example**: one small input worked by hand.',
          '3. **Subgoals**: the steps your hands took.',
          '4. **State**: what you keep while you go.',
          '5. **Simple solution**: the plainest approach, and its cost.',
        ),
        note: 'The Solve Map: 1 contract, 2 example, 3 subgoals, 4 state, 5 simple solution, 6 test, 7 improve, 8 implement, 9 verify. Steps 1 to 5 happen before real code.',
        rubric: [
          'Contract: a list of strings in, a sorted list of strings out. An empty list gives `[]`.',
          'Edge cases named: empty list, nothing used more than twice, a code used exactly twice (not included).',
          "A hand-worked example with counts, like `['A', 'B', 'A', 'A']` gives `['A']`.",
          'Subgoals: count each code, keep the ones with a count over 2, sort them.',
          'State: a dict from code to count. Cost: O(n) to count plus sorting the kept codes.',
        ],
        explanation: 'Five short answers turn a vague task into a plan you can type. The edge case "exactly twice" is the one most people only find after a failed test.',
        signature: 'solve-map:plan',
        minutes: 4,
      }),
      write({
        id: 'c2-solve-restock',
        title: 'Solve Map: what to restock',
        skills: ['edge_cases', 'dict_items', 'sorting'],
        prompt: p(
          '`stock` is a dict from item name to how many are on the shelf. `minimum` is the lowest count allowed.',
          '',
          'Return the names of the items below `minimum`, sorted alphabetically. Work through the map:',
          '1. **Contract.** What comes back for an empty dict? Is a count of exactly `minimum` below it?',
          "2. **Example.** Do `{'soap': 2, 'rice': 9, 'salt': 0}` with minimum 3 by hand.",
          '3. **Subgoals.** Pick out the low items, then sort them.',
          '4. **Test** the edge cases before you call it done.',
          '',
          "`restock({'soap': 2, 'rice': 9, 'salt': 0}, 3)` → `['salt', 'soap']`",
          "`restock({'tea': 3}, 3)` → `[]` (3 is not below 3)",
        ),
        starterCode: `def restock(stock, minimum):
    pass`,
        solution: `def restock(stock, minimum):
    low = []
    for name, count in stock.items():
        if count < minimum:
            low.append(name)
    return sorted(low)`,
        tests: [
          t.eq("restock({'soap': 2, 'rice': 9, 'salt': 0}, 3)", "['salt', 'soap']"),
          t.eq("restock({'tea': 3}, 3)", '[]'),
          t.eq('restock({}, 5)', '[]'),
          t.eq("restock({'a': 1, 'b': 1}, 2)", "['a', 'b']"),
          t.hidden("restock({'z': 0, 'y': 0, 'x': 10}, 1)", "['y', 'z']"),
          t.hidden("restock({'k': -1}, 0)", "['k']"),
        ],
        hints: ['Below means `<`.', '`sorted(names)` returns a new sorted list.'],
        explanation: 'Two subgoals, two steps in code: filter, then sort. The contract question about exactly `minimum` decided `<` before any typing.',
        signature: 'solve-map:filter-sort',
        minutes: 4,
      }),
      write({
        id: 'c2-solve-on-time',
        title: 'Solve Map: the on-time streak',
        skills: ['state_tracking', 'edge_cases'],
        prompt: p(
          '`delays` is a list of how many minutes late each delivery was, in order. A delay of 0 means on time.',
          '',
          'Return the length of the longest streak of on-time deliveries in a row.',
          '',
          'Before code, work `[0, 0, 5, 0, 0, 0, 2]` by hand in a table with columns `delay`, `current` and `best`. The columns are your state. Then write it, and test an empty list and a list that ends on time.',
          '',
          '`longest_on_time([0, 0, 5, 0, 0, 0, 2])` → `3`',
          '`longest_on_time([4, 0, 0])` → `2` (the streak runs to the end)',
        ),
        starterCode: `def longest_on_time(delays):
    pass`,
        solution: `def longest_on_time(delays):
    best = 0
    current = 0
    for d in delays:
        if d == 0:
            current += 1
            if current > best:
                best = current
        else:
            current = 0
    return best`,
        tests: [
          t.eq('longest_on_time([0, 0, 5, 0, 0, 0, 2])', '3'),
          t.eq('longest_on_time([4, 0, 0])', '2'),
          t.eq('longest_on_time([])', '0'),
          t.eq('longest_on_time([3, 3])', '0'),
          t.hidden('longest_on_time([0])', '1'),
          t.hidden('longest_on_time([0, 1, 0, 1, 0, 0])', '2'),
        ],
        hints: ['A late delivery sets `current` back to 0.', 'Update `best` every time `current` grows, so a streak at the end still counts.'],
        explanation: 'The table had three columns, so the code has three names. Updating `best` as the streak grows handles the streak that runs to the end.',
        signature: 'solve-map:streak',
        minutes: 4,
      }),
      write({
        id: 'c2-solve-busiest-hour',
        title: 'Solve Map: the busiest hour',
        skills: ['frequency_map', 'string_methods', 'edge_cases'],
        prompt: p(
          "`times` is a list of order times written as `'HH:MM'` strings, like `'09:45'`.",
          '',
          'Return the hour, as an int, with the most orders. On a tie, return the earlier hour. An empty list returns `-1`.',
          '',
          'Use the map: state the contract, work an example by hand, then pick your state. The hour is the part before the colon.',
          '',
          "`busiest_hour(['09:45', '13:10', '09:05'])` → `9`",
          "`busiest_hour(['18:00', '07:30'])` → `7` (a tie: 7 is earlier)",
        ),
        starterCode: `def busiest_hour(times):
    pass`,
        solution: `def busiest_hour(times):
    counts = {}
    for t in times:
        hour = int(t.split(':')[0])
        counts[hour] = counts.get(hour, 0) + 1
    best = -1
    for hour in counts:
        if best == -1 or counts[hour] > counts[best] or (counts[hour] == counts[best] and hour < best):
            best = hour
    return best`,
        tests: [
          t.eq("busiest_hour(['09:45', '13:10', '09:05'])", '9'),
          t.eq("busiest_hour(['18:00', '07:30'])", '7'),
          t.eq('busiest_hour([])', '-1'),
          t.eq("busiest_hour(['00:15'])", '0'),
          t.hidden("busiest_hour(['23:59', '23:00', '01:00', '01:30', '01:45'])", '1'),
          t.hidden("busiest_hour(['12:00', '11:59', '12:30'])", '12'),
        ],
        hints: ["`int('09:45'.split(':')[0])` is `9`.", 'Count orders per hour first. Then pick the best hour with the tie rule.'],
        explanation: 'Subgoals: read the hour, count per hour, choose the best with the tie rule. Each is a few lines, and the empty list is handled by starting at `-1`.',
        signature: 'solve-map:busiest-hour',
        minutes: 6,
      }),
      write({
        id: 'c2-solve-first-unique',
        title: 'Solve Map: the first unique ticket',
        skills: ['frequency_map', 'complexity', 'edge_cases'],
        prompt: p(
          '`ids` is a list of ticket ids. Return the first id that appears exactly once in the whole list. If every id repeats, return `None`.',
          '',
          'The simple solution checks `ids.count(x)` for each id. That rescans the list every time. Find that repeated work, then improve it: count everything in one pass first.',
          '',
          '`first_unique([4, 7, 4, 9, 7])` → `9`',
          '`first_unique([2, 2])` → `None`',
        ),
        starterCode: `def first_unique(ids):
    pass`,
        solution: `def first_unique(ids):
    counts = {}
    for x in ids:
        counts[x] = counts.get(x, 0) + 1
    for x in ids:
        if counts[x] == 1:
            return x
    return None`,
        tests: [
          t.eq('first_unique([4, 7, 4, 9, 7])', '9'),
          t.eq('first_unique([2, 2])', 'None'),
          t.eq('first_unique([])', 'None'),
          t.eq('first_unique([5])', '5'),
          t.hidden("first_unique(['a', 'b', 'c', 'a', 'b'])", "'c'"),
          t.hidden('first_unique([1] * 1000 + [3])', '3'),
        ],
        hints: ['Two passes: count, then find.', 'The second pass goes over `ids`, not the dict, so "first" means first in the list.'],
        explanation: '`ids.count` inside a loop is O(n²). Counting once and then scanning is O(n) time and O(n) space, with the same answers on every test.',
        signature: 'solve-map:first-unique',
        complexity: { time: 'O(n)', space: 'O(n)' },
        minutes: 5,
      }),
      write({
        id: 'c2-solve-report',
        title: 'Solve Map, on your own: grade report',
        skills: ['dict_items', 'edge_cases', 'functions'],
        difficulty: 3,
        prompt: p(
          '`scores` is a dict from student name to test score. Return a dict with three keys:',
          "- `'count'`: how many students there are.",
          "- `'average'`: the average score, rounded to 1 decimal place.",
          "- `'top'`: the names with the highest score, sorted alphabetically.",
          '',
          "An empty dict returns `{'count': 0, 'average': 0.0, 'top': []}`. Use the whole map on your own.",
          '',
          "`report({'ana': 90, 'bo': 72, 'cy': 90})` → `{'count': 3, 'average': 84.0, 'top': ['ana', 'cy']}`",
          "`report({})` → `{'count': 0, 'average': 0.0, 'top': []}`",
        ),
        starterCode: `def report(scores):
    pass`,
        solution: `def report(scores):
    if len(scores) == 0:
        return {'count': 0, 'average': 0.0, 'top': []}
    total = 0
    for name in scores:
        total += scores[name]
    high = max(scores.values())
    top = []
    for name in scores:
        if scores[name] == high:
            top.append(name)
    return {'count': len(scores), 'average': round(total / len(scores), 1), 'top': sorted(top)}`,
        tests: [
          t.eq("report({'ana': 90, 'bo': 72, 'cy': 90})", "{'count': 3, 'average': 84.0, 'top': ['ana', 'cy']}"),
          t.eq('report({})', "{'count': 0, 'average': 0.0, 'top': []}"),
          t.eq("report({'zed': 55})", "{'count': 1, 'average': 55.0, 'top': ['zed']}"),
          t.hidden("report({'a': 1, 'b': 2, 'c': 2})", "{'count': 3, 'average': 1.7, 'top': ['b', 'c']}"),
          t.hidden("report({'yu': 100, 'al': 0})", "{'count': 2, 'average': 50.0, 'top': ['yu']}"),
        ],
        hints: ['Three subgoals, one per key.', 'Find the highest score first, then collect every name that has it.'],
        explanation: 'Three keys, three subgoals, each a few lines. The empty dict is decided by the contract before `max` can crash on it.',
        signature: 'solve-map:report',
        minutes: 7,
      }),
    ],
  },

  // ───────────────────────────── Gates (cold, equivalent variants)
  {
    id: 'c2-gates',
    title: 'Week 2 gates',
    summary: 'Cold checks: contract, decomposition, testing, and the whole map on your own.',
    exercises: [
      // g-contract
      write({
        id: 'c2-g-contract-a',
        title: 'Cheapest in stock',
        skills: ['edge_cases', 'state_tracking'],
        ...gate,
        prompt: p(
          '`items` is a list of `(name, price, quantity)` tuples.',
          '',
          'Return the name of the cheapest item with at least one in stock. On a tie, return the one that comes first in `items`. If nothing is in stock, return `None`.',
          '',
          "`cheapest_in_stock([('pen', 3, 0), ('cup', 5, 2), ('pad', 4, 1)])` → `'pad'`",
          '`cheapest_in_stock([])` → `None`',
        ),
        starterCode: `def cheapest_in_stock(items):
    pass`,
        solution: `def cheapest_in_stock(items):
    best = None
    best_price = 0
    for name, price, qty in items:
        if qty > 0 and (best is None or price < best_price):
            best = name
            best_price = price
    return best`,
        tests: [
          t.eq("cheapest_in_stock([('pen', 3, 0), ('cup', 5, 2), ('pad', 4, 1)])", "'pad'"),
          t.eq('cheapest_in_stock([])', 'None'),
          t.eq("cheapest_in_stock([('a', 2, 1), ('b', 2, 1)])", "'a'"),
          t.hidden("cheapest_in_stock([('a', 1, 0), ('b', 2, 0)])", 'None'),
          t.hidden("cheapest_in_stock([('x', 0, 5)])", "'x'"),
          t.hidden("cheapest_in_stock([('a', 9, 1), ('b', 1, 0), ('c', 9, 3), ('d', 5, 1)])", "'d'"),
        ],
        signature: 'gate:contract-min-filter',
        minutes: 5,
      }),
      write({
        id: 'c2-g-contract-b',
        title: 'Oldest open ticket',
        skills: ['edge_cases', 'state_tracking'],
        ...gate,
        prompt: p(
          "`tickets` is a list of `(ticket_id, status, age_days)` tuples. `status` is `'open'` or `'closed'`.",
          '',
          'Return the id of the open ticket with the largest age. On a tie, return the one that comes first in `tickets`. If no ticket is open, return `-1`.',
          '',
          "`oldest_open([(7, 'open', 3), (8, 'closed', 9), (9, 'open', 5)])` → `9`",
          "`oldest_open([(1, 'closed', 2)])` → `-1`",
        ),
        starterCode: `def oldest_open(tickets):
    pass`,
        solution: `def oldest_open(tickets):
    best = -1
    best_age = 0
    for tid, status, age in tickets:
        if status == 'open' and (best == -1 or age > best_age):
            best = tid
            best_age = age
    return best`,
        tests: [
          t.eq("oldest_open([(7, 'open', 3), (8, 'closed', 9), (9, 'open', 5)])", '9'),
          t.eq("oldest_open([(1, 'closed', 2)])", '-1'),
          t.eq('oldest_open([])', '-1'),
          t.hidden("oldest_open([(4, 'open', 6), (5, 'open', 6)])", '4'),
          t.hidden("oldest_open([(3, 'open', 0)])", '3'),
          t.hidden("oldest_open([(1, 'open', 2), (2, 'closed', 50), (3, 'open', 8), (4, 'open', 8)])", '3'),
        ],
        signature: 'gate:contract-max-filter',
        minutes: 5,
      }),
      write({
        id: 'c2-g-contract-c',
        title: 'Top passing student',
        skills: ['edge_cases', 'state_tracking'],
        ...gate,
        prompt: p(
          '`grades` is a list of `(name, score)` pairs. A score passes when it is at least `minimum`.',
          '',
          "Return the name with the highest passing score. On a tie, return the name that comes first alphabetically. If nobody passes, return `''`.",
          '',
          "`top_passing([('lee', 72), ('ana', 91), ('kim', 55)], 60)` → `'ana'`",
          "`top_passing([('bo', 40)], 50)` → `''`",
        ),
        starterCode: `def top_passing(grades, minimum):
    pass`,
        solution: `def top_passing(grades, minimum):
    best = ''
    best_score = 0
    for name, score in grades:
        if score >= minimum:
            if best == '' or score > best_score or (score == best_score and name < best):
                best = name
                best_score = score
    return best`,
        tests: [
          t.eq("top_passing([('lee', 72), ('ana', 91), ('kim', 55)], 60)", "'ana'"),
          t.eq("top_passing([('bo', 40)], 50)", "''"),
          t.eq('top_passing([], 50)', "''"),
          t.hidden("top_passing([('zoe', 80), ('max', 80)], 70)", "'max'"),
          t.hidden("top_passing([('jo', 50)], 50)", "'jo'"),
          t.hidden("top_passing([('a', 49), ('b', 50), ('c', 49)], 50)", "'b'"),
        ],
        signature: 'gate:contract-max-tie-alpha',
        minutes: 5,
      }),
      write({
        id: 'c2-g-contract-d',
        title: 'Heaviest allowed parcel',
        skills: ['edge_cases', 'state_tracking'],
        ...gate,
        prompt: p(
          '`parcels` is a list of `(label, weight)` pairs, with weight in kg. A parcel is allowed when its weight is at most `limit`.',
          '',
          'Return the label of the heaviest allowed parcel. On a tie, return the one that comes first in `parcels`. If none is allowed, return `None`.',
          '',
          "`heaviest_allowed([('A', 12), ('B', 7), ('C', 9)], 10)` → `'C'`",
          "`heaviest_allowed([('A', 12)], 10)` → `None`",
        ),
        starterCode: `def heaviest_allowed(parcels, limit):
    pass`,
        solution: `def heaviest_allowed(parcels, limit):
    best = None
    best_weight = 0
    for label, weight in parcels:
        if weight <= limit and (best is None or weight > best_weight):
            best = label
            best_weight = weight
    return best`,
        tests: [
          t.eq("heaviest_allowed([('A', 12), ('B', 7), ('C', 9)], 10)", "'C'"),
          t.eq("heaviest_allowed([('A', 12)], 10)", 'None'),
          t.eq('heaviest_allowed([], 10)', 'None'),
          t.hidden("heaviest_allowed([('A', 10), ('B', 3)], 10)", "'A'"),
          t.hidden("heaviest_allowed([('A', 5), ('B', 5)], 8)", "'A'"),
          t.hidden("heaviest_allowed([('A', 0.5), ('B', 11), ('C', 2)], 2)", "'C'"),
        ],
        signature: 'gate:contract-max-under',
        minutes: 5,
      }),

      // g-decomposition
      write({
        id: 'c2-g-decompose-a',
        title: 'Shipping total',
        skills: ['functions', 'conditionals'],
        ...gate,
        prompt: p(
          "A parcel's cost has two parts. The weight fee is 5 for up to 1 kg, 9 for up to 5 kg, and 15 for anything heavier. The zone fee is 0 for `'local'`, 3 for `'national'` and 12 for `'international'`.",
          '',
          "`parcels` is a list of `(weight, zone)` pairs. By hand, `[(0.5, 'local'), (3, 'international')]` costs 5 + 0, then 9 + 12: 26 in total.",
          '',
          'Write three functions:',
          '- `weight_fee(weight)` returns the weight fee.',
          '- `zone_fee(zone)` returns the zone fee.',
          '- `shipping_total(parcels)` returns the total cost of all parcels. It uses the other two.',
          '',
          "`shipping_total([(0.5, 'local'), (3, 'international')])` → `26`",
          '`shipping_total([])` → `0`',
        ),
        starterCode: `def weight_fee(weight):
    pass

def zone_fee(zone):
    pass

def shipping_total(parcels):
    pass`,
        solution: `def weight_fee(weight):
    if weight <= 1:
        return 5
    if weight <= 5:
        return 9
    return 15

def zone_fee(zone):
    if zone == 'local':
        return 0
    if zone == 'national':
        return 3
    return 12

def shipping_total(parcels):
    total = 0
    for weight, zone in parcels:
        total += weight_fee(weight) + zone_fee(zone)
    return total`,
        tests: [
          t.eq("shipping_total([(0.5, 'local'), (3, 'international')])", '26'),
          t.eq('shipping_total([])', '0'),
          t.eq('weight_fee(1)', '5'),
          t.eq('weight_fee(5)', '9'),
          t.hidden('weight_fee(5.5)', '15'),
          t.hidden("zone_fee('national')", '3'),
          t.hidden("shipping_total([(6, 'national'), (1, 'local')])", '23'),
        ],
        signature: 'gate:decompose-two-fees',
        minutes: 6,
      }),
      write({
        id: 'c2-g-decompose-b',
        title: 'Grade points',
        skills: ['functions', 'conditionals'],
        ...gate,
        prompt: p(
          "A score of 90 or more is an `'A'`, 80 or more a `'B'`, 70 or more a `'C'`, and anything lower an `'F'`. Grade points are 4 for A, 3 for B, 2 for C and 0 for F.",
          '',
          '`scores` is a list of test scores. By hand, `[95, 82, 60]` is A, B, F, which is 4, 3 and 0 points: an average of 2.33.',
          '',
          'Write three functions:',
          '- `letter(score)` returns the letter.',
          '- `points(grade)` returns the grade points for a letter.',
          '- `average_points(scores)` returns the average grade points, rounded to 2 decimal places. An empty list returns `0.0`.',
          '',
          '`average_points([95, 82, 60])` → `2.33`',
          '`average_points([])` → `0.0`',
        ),
        starterCode: `def letter(score):
    pass

def points(grade):
    pass

def average_points(scores):
    pass`,
        solution: `def letter(score):
    if score >= 90:
        return 'A'
    if score >= 80:
        return 'B'
    if score >= 70:
        return 'C'
    return 'F'

def points(grade):
    if grade == 'A':
        return 4
    if grade == 'B':
        return 3
    if grade == 'C':
        return 2
    return 0

def average_points(scores):
    if len(scores) == 0:
        return 0.0
    total = 0
    for s in scores:
        total += points(letter(s))
    return round(total / len(scores), 2)`,
        tests: [
          t.eq('average_points([95, 82, 60])', '2.33'),
          t.eq('average_points([])', '0.0'),
          t.eq('letter(80)', "'B'"),
          t.eq("points('C')", '2'),
          t.hidden('letter(69)', "'F'"),
          t.hidden('average_points([90, 90])', '4.0'),
          t.hidden('average_points([70, 89, 100])', '3.0'),
        ],
        signature: 'gate:decompose-grade-points',
        minutes: 6,
      }),
      write({
        id: 'c2-g-decompose-c',
        title: 'Bike rental total',
        skills: ['functions', 'conditionals'],
        ...gate,
        prompt: p(
          'A bike rental bills by started half hours: 31 minutes is 2 blocks, and 0 minutes is 0 blocks. Each block costs 2, and one ride never costs more than 20.',
          '',
          '`rides` is a list of ride lengths in minutes. By hand, `[45, 400]` is 2 blocks and 14 blocks. The first costs 4. The second would cost 28, but the cap makes it 20. That is 24 in total.',
          '',
          'Write three functions:',
          '- `blocks(minutes)` returns the number of started half hours.',
          '- `ride_fee(n)` returns the fee for `n` blocks.',
          '- `rental_total(rides)` returns the total fee for all rides. It uses the other two.',
          '',
          '`rental_total([45, 400])` → `24`',
          '`rental_total([])` → `0`',
        ),
        starterCode: `def blocks(minutes):
    pass

def ride_fee(n):
    pass

def rental_total(rides):
    pass`,
        solution: `def blocks(minutes):
    n = minutes // 30
    if minutes % 30 > 0:
        n += 1
    return n

def ride_fee(n):
    return min(n * 2, 20)

def rental_total(rides):
    total = 0
    for minutes in rides:
        total += ride_fee(blocks(minutes))
    return total`,
        tests: [
          t.eq('rental_total([45, 400])', '24'),
          t.eq('rental_total([])', '0'),
          t.eq('blocks(30)', '1'),
          t.eq('blocks(31)', '2'),
          t.hidden('blocks(0)', '0'),
          t.hidden('ride_fee(10)', '20'),
          t.hidden('rental_total([1, 60, 301])', '26'),
        ],
        signature: 'gate:decompose-capped-fee',
        minutes: 6,
      }),
      write({
        id: 'c2-g-decompose-d',
        title: 'Low stock lines',
        skills: ['functions', 'conditionals'],
        ...gate,
        prompt: p(
          "Each line of a stock sheet looks like `'mug:3'`: an item name, a colon, then a count. An item is low when its count is below `minimum`.",
          '',
          "`lines` is a list of such lines. By hand, with minimum 5, `['mug:3', 'pen:12', 'cap:0']` reads mug 3 (low), pen 12 (fine), cap 0 (low).",
          '',
          'Write three functions:',
          '- `parse(line)` returns the pair `(name, count)`, with count as an int.',
          '- `is_low(count, minimum)` returns `True` when the count is below the minimum.',
          '- `low_items(lines, minimum)` returns the names of the low items, in the order of `lines`. It uses the other two.',
          '',
          "`low_items(['mug:3', 'pen:12', 'cap:0'], 5)` → `['mug', 'cap']`",
          '`low_items([], 5)` → `[]`',
        ),
        starterCode: `def parse(line):
    pass

def is_low(count, minimum):
    pass

def low_items(lines, minimum):
    pass`,
        solution: `def parse(line):
    name, count = line.split(':')
    return (name, int(count))

def is_low(count, minimum):
    return count < minimum

def low_items(lines, minimum):
    low = []
    for line in lines:
        name, count = parse(line)
        if is_low(count, minimum):
            low.append(name)
    return low`,
        tests: [
          t.eq("low_items(['mug:3', 'pen:12', 'cap:0'], 5)", "['mug', 'cap']"),
          t.eq('low_items([], 5)', '[]'),
          t.eq("parse('desk lamp:7')", "('desk lamp', 7)"),
          t.eq('is_low(5, 5)', 'False'),
          t.hidden('is_low(4, 5)', 'True'),
          t.hidden("low_items(['a:5', 'b:4'], 5)", "['b']"),
          t.hidden("low_items(['x:10'], 1)", '[]'),
        ],
        signature: 'gate:decompose-parse-filter',
        minutes: 6,
      }),

      // g-testing
      write({
        id: 'c2-g-test-a',
        title: 'Test: over budget',
        skills: ['edge_cases'],
        ...gate,
        style: 'write-test',
        prompt: p(
          '`count_over(costs, budget)` returns how many costs are strictly greater than `budget`.',
          '',
          'Write `test_count_over(count_over)`. The checker runs it on a correct version and on three wrong versions you can\'t see. Your asserts must pass on the correct version and fail on each wrong one. An error inside your test also counts as failing.',
        ),
        starterCode: `def test_count_over(count_over):
    pass`,
        solution: `def test_count_over(count_over):
    assert count_over([10, 20, 30], 15) == 2
    assert count_over([15], 15) == 0
    assert count_over([], 15) == 0
    assert count_over([20, 1, 1], 15) == 1
    assert count_over([1, 1, 20], 15) == 1`,
        tests: catches(
          'test_count_over',
          'def _good(costs, budget):\n    n = 0\n    for c in costs:\n        if c > budget:\n            n += 1\n    return n',
          [
            { name: 'catches wrong version 1', code: 'def _bad(costs, budget):\n    n = 0\n    for c in costs:\n        if c >= budget:\n            n += 1\n    return n' },
            { name: 'catches wrong version 2', code: 'def _bad(costs, budget):\n    n = 0\n    for i in range(1, len(costs)):\n        if costs[i] > budget:\n            n += 1\n    return n' },
            { name: 'catches wrong version 3', code: 'def _bad(costs, budget):\n    n = 0\n    for i in range(len(costs) - 1):\n        if costs[i] > budget:\n            n += 1\n    return n' },
          ],
        ),
        signature: 'gate:test-count-over',
        minutes: 6,
      }),
      write({
        id: 'c2-g-test-b',
        title: 'Test: cheapest price',
        skills: ['edge_cases'],
        ...gate,
        style: 'write-test',
        prompt: p(
          '`cheapest(prices)` returns the smallest price in the list. An empty list returns `None`. Prices are positive.',
          '',
          'Write `test_cheapest(cheapest)`. The checker runs it on a correct version and on three wrong versions you can\'t see. Your asserts must pass on the correct version and fail on each wrong one. An error inside your test also counts as failing.',
        ),
        starterCode: `def test_cheapest(cheapest):
    pass`,
        solution: `def test_cheapest(cheapest):
    assert cheapest([5, 3, 8]) == 3
    assert cheapest([]) is None
    assert cheapest([7]) == 7
    assert cheapest([9, 8, 2]) == 2`,
        tests: catches(
          'test_cheapest',
          'def _good(prices):\n    if not prices:\n        return None\n    best = prices[0]\n    for x in prices:\n        if x < best:\n            best = x\n    return best',
          [
            { name: 'catches wrong version 1', code: 'def _bad(prices):\n    best = prices[0]\n    for x in prices:\n        if x < best:\n            best = x\n    return best' },
            { name: 'catches wrong version 2', code: 'def _bad(prices):\n    if not prices:\n        return None\n    best = 0\n    for x in prices:\n        if x < best:\n            best = x\n    return best' },
            { name: 'catches wrong version 3', code: 'def _bad(prices):\n    if not prices:\n        return None\n    best = prices[0]\n    for i in range(len(prices) - 1):\n        if prices[i] < best:\n            best = prices[i]\n    return best' },
          ],
        ),
        signature: 'gate:test-cheapest',
        minutes: 6,
      }),
      write({
        id: 'c2-g-test-c',
        title: 'Test: last position',
        skills: ['edge_cases'],
        ...gate,
        style: 'write-test',
        prompt: p(
          '`last_index(items, target)` returns the last position of `target` in `items`. If `target` is not there, it returns `-1`.',
          '',
          'Write `test_last_index(last_index)`. The checker runs it on a correct version and on three wrong versions you can\'t see. Your asserts must pass on the correct version and fail on each wrong one. An error inside your test also counts as failing.',
        ),
        starterCode: `def test_last_index(last_index):
    pass`,
        solution: `def test_last_index(last_index):
    assert last_index(['a', 'b', 'a'], 'a') == 2
    assert last_index(['a', 'b'], 'z') == -1
    assert last_index([], 'a') == -1
    assert last_index(['x', 'y'], 'x') == 0`,
        tests: catches(
          'test_last_index',
          'def _good(items, target):\n    for i in range(len(items) - 1, -1, -1):\n        if items[i] == target:\n            return i\n    return -1',
          [
            { name: 'catches wrong version 1', code: 'def _bad(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1' },
            { name: 'catches wrong version 2', code: 'def _bad(items, target):\n    for i in range(len(items) - 1, -1, -1):\n        if items[i] == target:\n            return i' },
            { name: 'catches wrong version 3', code: 'def _bad(items, target):\n    for i in range(len(items) - 1, 0, -1):\n        if items[i] == target:\n            return i\n    return -1' },
          ],
        ),
        signature: 'gate:test-last-index',
        minutes: 6,
      }),
      write({
        id: 'c2-g-test-d',
        title: 'Test: longest streak',
        skills: ['edge_cases'],
        ...gate,
        style: 'write-test',
        prompt: p(
          '`longest_streak(days)` takes a list of `True` and `False` values, one per day. `True` means the goal was met. It returns the length of the longest run of `True` days in a row.',
          '',
          'Write `test_longest_streak(longest_streak)`. The checker runs it on a correct version and on three wrong versions you can\'t see. Your asserts must pass on the correct version and fail on each wrong one. An error inside your test also counts as failing.',
        ),
        starterCode: `def test_longest_streak(longest_streak):
    pass`,
        solution: `def test_longest_streak(longest_streak):
    assert longest_streak([True, True, False, True]) == 2
    assert longest_streak([False, True, True, True]) == 3
    assert longest_streak([True, False, True]) == 1
    assert longest_streak([]) == 0
    assert longest_streak([False]) == 0`,
        tests: catches(
          'test_longest_streak',
          'def _good(days):\n    best = 0\n    run = 0\n    for d in days:\n        if d:\n            run += 1\n            best = max(best, run)\n        else:\n            run = 0\n    return best',
          [
            { name: 'catches wrong version 1', code: 'def _bad(days):\n    best = 0\n    run = 0\n    for d in days:\n        if d:\n            run += 1\n        else:\n            best = max(best, run)\n            run = 0\n    return best' },
            { name: 'catches wrong version 2', code: 'def _bad(days):\n    best = 0\n    run = 0\n    for d in days:\n        if d:\n            run += 1\n            best = max(best, run)\n    return best' },
            { name: 'catches wrong version 3', code: 'def _bad(days):\n    best = 1\n    run = 0\n    for d in days:\n        if d:\n            run += 1\n            best = max(best, run)\n        else:\n            run = 0\n    return best' },
          ],
        ),
        signature: 'gate:test-streak',
        minutes: 6,
      }),

      // g-solve-map
      write({
        id: 'c2-g-solve-a',
        title: 'Repeat buyers',
        skills: ['complexity', 'edge_cases'],
        ...gate,
        prompt: p(
          '`orders` is a list of customer names, one per order, in time order.',
          '',
          'Return the names of the customers who ordered at least twice. List them in the order of their second order.',
          '',
          "`repeat_buyers(['ana', 'bo', 'cy', 'bo', 'ana', 'bo'])` → `['bo', 'ana']`",
          '`repeat_buyers([])` → `[]`',
        ),
        starterCode: `def repeat_buyers(orders):
    pass`,
        solution: `def repeat_buyers(orders):
    counts = {}
    result = []
    for name in orders:
        counts[name] = counts.get(name, 0) + 1
        if counts[name] == 2:
            result.append(name)
    return result`,
        tests: [
          t.eq("repeat_buyers(['ana', 'bo', 'cy', 'bo', 'ana', 'bo'])", "['bo', 'ana']"),
          t.eq('repeat_buyers([])', '[]'),
          t.eq("repeat_buyers(['a', 'b', 'c'])", '[]'),
          t.hidden("repeat_buyers(['x', 'x', 'x', 'x'])", "['x']"),
          t.hidden("repeat_buyers(['a', 'b', 'b', 'a'])", "['b', 'a']"),
          t.hidden("repeat_buyers([f'c{i % 50}' for i in range(3000)])", "[f'c{i}' for i in range(50)]"),
        ],
        signature: 'gate:solve-second-order',
        minutes: 7,
      }),
      write({
        id: 'c2-g-solve-b',
        title: 'Popular items',
        skills: ['complexity', 'edge_cases'],
        ...gate,
        prompt: p(
          '`sold` is a list of item names, one per sale. `k` is at least 1.',
          '',
          'Return the items sold at least `k` times. List them in the order of their first sale.',
          '',
          "`popular_items(['tea', 'mug', 'tea', 'pen', 'mug', 'tea'], 2)` → `['tea', 'mug']`",
          "`popular_items([], 1)` → `[]`",
        ),
        starterCode: `def popular_items(sold, k):
    pass`,
        solution: `def popular_items(sold, k):
    counts = {}
    for item in sold:
        counts[item] = counts.get(item, 0) + 1
    result = []
    for item in counts:
        if counts[item] >= k:
            result.append(item)
    return result`,
        tests: [
          t.eq("popular_items(['tea', 'mug', 'tea', 'pen', 'mug', 'tea'], 2)", "['tea', 'mug']"),
          t.eq('popular_items([], 1)', '[]'),
          t.eq("popular_items(['a', 'b'], 1)", "['a', 'b']"),
          t.hidden("popular_items(['a', 'b', 'b', 'a'], 3)", '[]'),
          t.hidden("popular_items(['x', 'y', 'y', 'x', 'y'], 3)", "['y']"),
          t.hidden("popular_items([f'i{i % 40}' for i in range(4000)], 100)", "[f'i{i}' for i in range(40)]"),
        ],
        signature: 'gate:solve-at-least-k',
        minutes: 7,
      }),
      write({
        id: 'c2-g-solve-c',
        title: 'Single-use codes',
        skills: ['complexity', 'edge_cases'],
        ...gate,
        prompt: p(
          '`codes` is a list of discount codes, one per checkout.',
          '',
          'Return the codes used exactly once, sorted alphabetically.',
          '',
          "`single_use(['SAVE5', 'FREE', 'SAVE5', 'VIP'])` → `['FREE', 'VIP']`",
          "`single_use(['A', 'A'])` → `[]`",
        ),
        starterCode: `def single_use(codes):
    pass`,
        solution: `def single_use(codes):
    counts = {}
    for c in codes:
        counts[c] = counts.get(c, 0) + 1
    result = []
    for c in counts:
        if counts[c] == 1:
            result.append(c)
    return sorted(result)`,
        tests: [
          t.eq("single_use(['SAVE5', 'FREE', 'SAVE5', 'VIP'])", "['FREE', 'VIP']"),
          t.eq("single_use(['A', 'A'])", '[]'),
          t.eq('single_use([])', '[]'),
          t.hidden("single_use(['Z', 'Y', 'X'])", "['X', 'Y', 'Z']"),
          t.hidden("single_use(['B', 'A', 'B', 'B', 'C'])", "['A', 'C']"),
          t.hidden("single_use([f'K{i}' for i in range(3000)] + ['K7'])", "sorted(f'K{i}' for i in range(3000) if i != 7)"),
        ],
        signature: 'gate:solve-exactly-once',
        minutes: 7,
      }),
      write({
        id: 'c2-g-solve-d',
        title: 'Busiest customer',
        skills: ['complexity', 'edge_cases'],
        ...gate,
        prompt: p(
          '`orders` is a list of customer names, one per order.',
          '',
          "Return the customer with the most orders. On a tie, return the name that comes first alphabetically. An empty list returns `''`.",
          '',
          "`busiest(['bo', 'ana', 'bo', 'cy'])` → `'bo'`",
          "`busiest(['cy', 'ana'])` → `'ana'` (a tie)",
        ),
        starterCode: `def busiest(orders):
    pass`,
        solution: `def busiest(orders):
    counts = {}
    for name in orders:
        counts[name] = counts.get(name, 0) + 1
    best = ''
    for name in counts:
        if best == '' or counts[name] > counts[best] or (counts[name] == counts[best] and name < best):
            best = name
    return best`,
        tests: [
          t.eq("busiest(['bo', 'ana', 'bo', 'cy'])", "'bo'"),
          t.eq("busiest(['cy', 'ana'])", "'ana'"),
          t.eq('busiest([])', "''"),
          t.hidden("busiest(['zed'])", "'zed'"),
          t.hidden("busiest(['b', 'a', 'b', 'a', 'c'])", "'a'"),
          t.hidden("busiest([f'n{i % 30}' for i in range(3000)] + ['n29'])", "'n29'"),
        ],
        signature: 'gate:solve-most-tie',
        minutes: 7,
      }),
    ],
  },
]
