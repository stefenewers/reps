import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { debug, output, write, t } from '@/data/exercises/build'

/**
 * Dynamic programming bridges. Every target here has a different state shape,
 * so each bridge teaches one shape: what the table (or the carried variables)
 * means, where it starts, and which earlier entries each new entry reads.
 */

const MODULE = '2026-10-10'

// ── LC 213 House Robber II: a circle as two lines ────────────────────────────
const br213 = [
  write({
    id: 'b213-two-lines',
    title: 'Cut a ring into two lines',
    skills: ['circular_split', 'slicing', 'tuples'],
    prompt: '`ring` is a list that loops round: its first and last items sit next to each other.\n\nWrite `two_lines(ring)` that returns a tuple of two lists: the ring **without its first** item, then the ring **without its last** item.\n\n`two_lines([4, 5, 6, 7])` → `([5, 6, 7], [4, 5, 6])`',
    note: 'A ring (a circular list) has no real ends: its first and last items are neighbours. When a rule says neighbours cannot both be used, no answer uses both of them, so a ring can be handled as two ordinary rows: one without the first item, one without the last.',
    starterCode: `def two_lines(ring):
    pass`,
    solution: `def two_lines(ring):
    without_first = ring[1:]
    without_last = ring[:-1]
    return without_first, without_last`,
    tests: [
      t.eq('two_lines([4, 5, 6, 7])', '([5, 6, 7], [4, 5, 6])'),
      t.eq('two_lines([9])', '([], [])'),
      t.hidden('two_lines([])', '([], [])'),
      t.hidden('two_lines([1, 2])', '([2], [1])'),
    ],
    hints: ['Two slices: one starts at index 1, the other stops before the last index.'],
    explanation: 'In a ring the first and last are neighbours, so no answer uses both. Dropping one of them, each way, leaves two ordinary lines.',
    signature: 'circular:two-slices',
    minutes: 3.5,
  }),
  debug({
    id: 'b213-dbg-single',
    title: 'Debug: a ring of one',
    skills: ['circular_split', 'slicing', 'edge_cases'],
    prompt: '`tips` is a list of non-negative numbers, one per table. The tables are set in a circle, so the first and last are neighbours. `ring_best(tips)` should return the largest total you can collect when no two of the tables you pick are neighbours (no tables at all gives `0`). `line_best` solves a straight row and is already correct. Make every test pass.',
    brokenCode: `def line_best(row):
    prev2, prev1 = 0, 0
    for x in row:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1


def ring_best(tips):
    return max(line_best(tips[1:]), line_best(tips[:-1]))`,
    solution: `def line_best(row):
    prev2, prev1 = 0, 0
    for x in row:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1


def ring_best(tips):
    if len(tips) == 1:
        return tips[0]
    return max(line_best(tips[1:]), line_best(tips[:-1]))`,
    tests: [
      t.eq('ring_best([2, 3, 2])', '3'),
      t.eq('ring_best([5])', '5'),
      t.hidden('ring_best([])', '0'),
      t.hidden('ring_best([1, 2, 3, 1])', '4'),
      t.hidden('ring_best([4, 9])', '9'),
    ],
    hints: ['Work out by hand what the two slices are when there is exactly one table.', 'Both slices come out empty, so the only table is never considered. Handle that length before slicing.'],
    explanation: 'With one item, dropping the first and dropping the last both leave nothing. That one case has to be answered before the split.',
    signature: 'debug:circular-single-item',
    minutes: 4,
  }),
  write({
    id: 'b213-ring-mini',
    title: 'Harvest around a pond',
    skills: ['circular_split', 'slicing', 'state_tracking', 'edge_cases'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: 'Fields lie in a ring around a pond; `yields` is a list of numbers and `yields[i]` is what field `i` would give (never negative). Two fields that touch cannot both be harvested, and the first and last fields touch.\n\nWrite `ring_harvest(yields)` returning the largest total harvest. A single field can be harvested on its own, and no fields gives `0`.\n\n`ring_harvest([6, 1, 2, 7, 3])` → `13` (fields 0 and 3)',
    starterCode: `def ring_harvest(yields):
    pass`,
    solution: `def ring_harvest(yields):
    if len(yields) == 1:
        return yields[0]

    def line(row):
        prev2, prev1 = 0, 0
        for x in row:
            prev2, prev1 = prev1, max(prev1, prev2 + x)
        return prev1

    return max(line(yields[1:]), line(yields[:-1]))`,
    tests: [
      t.eq('ring_harvest([6, 1, 2, 7, 3])', '13'),
      t.eq('ring_harvest([3, 8, 4])', '8'),
      t.eq('ring_harvest([5])', '5'),
      t.hidden('ring_harvest([])', '0'),
      t.hidden('ring_harvest([4, 9])', '9'),
      t.hidden('ring_harvest([2, 2, 2, 2])', '4'),
      t.hidden('ring_harvest([0, 0, 0])', '0'),
      t.hidden('ring_harvest([1, 2, 3])', '3'),
    ],
    hints: [
      'You already know how to solve a straight row of fields.',
      'Write that straight-row solver as a small helper inside the function.',
      'The first and last fields are never both used. What two straight rows does that leave?',
      'Answer the one-field ring first; otherwise return the better of the helper on the two slices.',
    ],
    explanation: 'The circle adds one rule: not both ends. Solving the row without the first and the row without the last covers every legal choice, and the larger of the two is the answer.',
    signature: 'circular:take-skip-ring',
    minutes: 10,
  }),
]

// ── LC 53 Maximum Subarray: best ending here ─────────────────────────────────
const br53 = [
  output({
    id: 'b53-trace-ending',
    title: 'Trace: the best sum ending here',
    skills: ['kadane', 'state_tracking'],
    prompt: 'Predict the output.',
    code: `nums = [4, -6, 3, 2, -1]
here = nums[0]
print(here)
for x in nums[1:]:
    here = max(x, here + x)
    print(here)`,
    expectedOutput: `4
-2
3
5
4`,
    note: 'A **run** is a stretch of numbers that sit next to each other in the list, with no gaps (interviewers call it a **subarray**). `here` is the best sum of a run that **ends at this number**. Each step it either extends the run so far (`here + x`) or starts fresh at `x`.',
    explanation: 'At 3 the run so far is worth -2, so extending gives 1 and starting fresh gives 3: start fresh. After that, extending wins.',
    signature: 'trace:kadane-ending-here',
    minutes: 2,
  }),
  write({
    id: 'b53-ending-sums',
    title: 'Best sum ending at each index',
    skills: ['kadane', 'list_append', 'state_tracking'],
    prompt: "`nums` is a list of numbers, and some can be negative. Write `ending_sums(nums)` returning a list the same length as `nums`. Entry `i` is the largest sum of consecutive values that **ends exactly at index `i`**. The run must include `nums[i]`.\n\n`ending_sums([4, -6, 3, 2, -1])` → `[4, -2, 3, 5, 4]`",
    starterCode: `def ending_sums(nums):
    pass`,
    solution: `def ending_sums(nums):
    out = []
    for x in nums:
        if out:
            out.append(max(x, out[-1] + x))
        else:
            out.append(x)
    return out`,
    tests: [
      t.eq('ending_sums([4, -6, 3, 2, -1])', '[4, -2, 3, 5, 4]'),
      t.eq('ending_sums([-2, -5])', '[-2, -5]'),
      t.hidden('ending_sums([])', '[]'),
      t.hidden('ending_sums([7])', '[7]'),
      t.hidden('ending_sums([1, 1, 1])', '[1, 2, 3]'),
      t.hidden('ending_sums([-1, 4, -9, 2])', '[-1, 4, -5, 2]'),
    ],
    hints: ['A run ending at index i is either just nums[i], or the best run ending at i - 1 with nums[i] added.', 'The first number has no earlier run to extend.'],
    explanation: 'Each entry needs only the entry before it: extend that run or start a new one, whichever is larger.',
    signature: 'kadane:ending-list',
    minutes: 6,
  }),
  debug({
    id: 'b53-dbg-reset-zero',
    title: 'Debug: a week of losses',
    skills: ['kadane', 'state_tracking', 'edge_cases'],
    prompt: '`changes` is a non-empty list of daily balance changes. `best_stretch(changes)` should return the largest total of any stretch of **one or more** days in a row. Make every test pass.',
    brokenCode: `def best_stretch(changes):
    best = 0
    here = 0
    for x in changes:
        here = max(0, here + x)
        best = max(best, here)
    return best`,
    solution: `def best_stretch(changes):
    best = changes[0]
    here = changes[0]
    for x in changes[1:]:
        here = max(x, here + x)
        best = max(best, here)
    return best`,
    tests: [
      t.eq('best_stretch([2, -5, 4, 3, -1])', '7'),
      t.eq('best_stretch([-3, -1, -2])', '-1'),
      t.hidden('best_stretch([-4])', '-4'),
      t.hidden('best_stretch([5])', '5'),
      t.hidden('best_stretch([1, 2, 3])', '6'),
      t.hidden('best_stretch([-2, 1, -3, 4, -1, 2, 1, -5, 4])', '6'),
    ],
    hints: ['What does the code return when every day is a loss? Which stretch of days has that total?', 'A total of 0 means "no days at all", which is not allowed. Starting fresh means starting at x.', 'Start both variables from the first day and loop over the rest.'],
    explanation: 'Resetting to 0 quietly allows an empty stretch. When every number is negative the true answer is the least bad single day, so both variables must start from a real value.',
    signature: 'debug:kadane-zero-reset',
    minutes: 4.5,
  }),
  write({
    id: 'b53-worst-stretch',
    title: 'The deepest dip',
    skills: ['kadane', 'state_tracking', 'accumulator'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: '`changes` is a non-empty list of hourly temperature changes (numbers, positive or negative). Write `deepest_dip(changes)` returning the **lowest** total of any stretch of one or more hours in a row.\n\n`deepest_dip([3, -4, 2, -5, 6])` → `-7` (the stretch `-4, 2, -5`)',
    starterCode: `def deepest_dip(changes):
    pass`,
    solution: `def deepest_dip(changes):
    worst = changes[0]
    here = changes[0]
    for x in changes[1:]:
        here = min(x, here + x)
        worst = min(worst, here)
    return worst`,
    tests: [
      t.eq('deepest_dip([3, -4, 2, -5, 6])', '-7'),
      t.eq('deepest_dip([2, 5, 1])', '1'),
      t.hidden('deepest_dip([8])', '8'),
      t.hidden('deepest_dip([-1, -2, -3])', '-6'),
      t.hidden('deepest_dip([4, -1, -1, 4])', '-2'),
      t.hidden('deepest_dip([0, 0])', '0'),
    ],
    hints: [
      'One pass, two variables: the lowest total ending at this hour, and the lowest seen anywhere.',
      'At each hour: carry on the stretch so far, or begin a new one here?',
      'Start both from the first value so an all-positive list still answers with a real hour.',
    ],
    explanation: 'The same carried state, mirrored: the lowest total ending here is the smaller of x alone and the previous lowest plus x, and the answer is the lowest of those over the whole pass.',
    signature: 'kadane:min-variant',
    minutes: 7,
  }),
]

// ── LC 55 Jump Game: farthest reach ──────────────────────────────────────────
const br55 = [
  write({
    id: 'b55-farthest',
    title: 'The farthest landing',
    skills: ['greedy_reach', 'enumerate', 'state_tracking'],
    prompt: 'Lily pads sit in a row, and `pads` is a list of whole numbers (0 or more), one per pad. From pad `i` a frog can hop forward up to `pads[i]` pads, so the farthest it can land from there is index `i + pads[i]`.\n\nWrite `farthest_landing(pads)` returning the largest landing index over **every** pad (pretend the frog can stand on all of them). An empty row gives `0`.\n\n`farthest_landing([1, 5, 0, 0])` → `6`',
    note: 'One number can sum up a whole left-to-right scan: the farthest index any pad seen so far could send the frog to. This rep builds only that number. The next reps add the other half: can the frog stand on this pad at all?',
    starterCode: `def farthest_landing(pads):
    pass`,
    solution: `def farthest_landing(pads):
    farthest = 0
    for i, hop in enumerate(pads):
        farthest = max(farthest, i + hop)
    return farthest`,
    tests: [
      t.eq('farthest_landing([1, 5, 0, 0])', '6'),
      t.eq('farthest_landing([2, 0, 1])', '3'),
      t.hidden('farthest_landing([])', '0'),
      t.hidden('farthest_landing([0])', '0'),
      t.hidden('farthest_landing([3, 0, 0, 0])', '3'),
      t.hidden('farthest_landing([0, 0, 9])', '11'),
    ],
    hints: ['You need the index and the value together on each step.', 'Keep one running maximum of index plus hop.'],
    explanation: 'One number summarises everything seen so far: the farthest index any pad could send you to.',
    signature: 'reach:max-landing',
    minutes: 4,
  }),
  debug({
    id: 'b55-dbg-no-stop',
    title: 'Debug: hopping from pads you never reached',
    skills: ['greedy_reach', 'enumerate', 'early_return'],
    prompt: '`pads` is a non-empty list of whole numbers (0 or more), one per lily pad in a row. The frog starts on pad 0 and can hop forward up to `pads[i]` pads from pad `i`. `last_reachable(pads)` should return the highest index the frog can actually get to. Make every test pass.',
    brokenCode: `def last_reachable(pads):
    farthest = 0
    for i, hop in enumerate(pads):
        farthest = max(farthest, i + hop)
    return min(farthest, len(pads) - 1)`,
    solution: `def last_reachable(pads):
    farthest = 0
    for i, hop in enumerate(pads):
        if i > farthest:
            break
        farthest = max(farthest, i + hop)
    return min(farthest, len(pads) - 1)`,
    tests: [
      t.eq('last_reachable([1, 0, 0, 5])', '1'),
      t.eq('last_reachable([2, 0, 1])', '2'),
      t.hidden('last_reachable([0])', '0'),
      t.hidden('last_reachable([0, 4])', '0'),
      t.hidden('last_reachable([3, 0, 0, 0, 0])', '3'),
      t.hidden('last_reachable([1, 1, 1, 1])', '3'),
    ],
    hints: ['In the first test, can the frog ever stand on pad 3? Does the code use pad 3 anyway?', 'A pad only counts if its index is within the reach so far. What should happen the moment the scan gets ahead of the reach?'],
    explanation: 'The reach may only be pushed forward from pads the frog can stand on. Once the index passes the reach, nothing later is reachable and the scan must stop.',
    signature: 'debug:reach-missing-stop',
    minutes: 4,
  }),
  write({
    id: 'b55-first-unreachable',
    title: 'Where the frog gets stuck',
    skills: ['greedy_reach', 'enumerate', 'early_return', 'state_tracking'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: '`pads` is a list of whole numbers (0 or more), one per lily pad in a row. A frog starts on pad 0, and from pad `i` it can hop forward up to `pads[i]` pads.\n\nWrite `first_unreachable(pads)` returning the index of the **first pad the frog can never stand on**, or `-1` if it can stand on every pad. An empty row gives `-1`.\n\n`first_unreachable([1, 0, 0, 5])` → `2`',
    starterCode: `def first_unreachable(pads):
    pass`,
    solution: `def first_unreachable(pads):
    farthest = 0
    for i, hop in enumerate(pads):
        if i > farthest:
            return i
        farthest = max(farthest, i + hop)
    return -1`,
    tests: [
      t.eq('first_unreachable([1, 0, 0, 5])', '2'),
      t.eq('first_unreachable([2, 0, 1])', '-1'),
      t.hidden('first_unreachable([])', '-1'),
      t.hidden('first_unreachable([0])', '-1'),
      t.hidden('first_unreachable([0, 1])', '1'),
      t.hidden('first_unreachable([3, 0, 0, 0, 0])', '4'),
      t.hidden('first_unreachable([2, 3, 1, 0, 0, 0, 0])', '5'),
    ],
    hints: ['Scan once, carrying the farthest index reachable so far.', 'Check the pad you are on against that reach before you use its hop.', 'The first index beyond the reach is the answer; finishing the loop means there was none.'],
    explanation: 'One pass and one number. The order inside the loop matters: test whether this pad is reachable first, and only then let it extend the reach.',
    signature: 'reach:first-gap',
    minutes: 6,
  }),
]

// ── LC 322 Coin Change: min over choices ─────────────────────────────────────
const br322 = [
  write({
    id: 'b322-makeable',
    title: 'Can this amount be made?',
    skills: ['dp_min_choice', 'dp_table', 'recurrence'],
    prompt: 'You have scoops of the sizes in `scoops` (positive whole litres) and may use each as many times as you like.\n\n`total` is a whole number, 0 or more. Write `can_fill(total, scoops)` returning `True` if exactly `total` litres can be measured out, else `False`. Use a table (a list called `dp`) where `dp[a]` says whether amount `a` can be made. Zero litres can always be made.\n\n`can_fill(11, [3, 5])` → `True` (3 + 3 + 5), `can_fill(7, [3, 5])` → `False`',
    note: 'Here the index of the list is an **amount**, not a position in an input: `dp[a]` is the answer for amount `a`. Each entry is worked out from the entries for smaller amounts, so fill it from small to large.',
    starterCode: `def can_fill(total, scoops):
    pass`,
    solution: `def can_fill(total, scoops):
    dp = [False] * (total + 1)
    dp[0] = True
    for a in range(1, total + 1):
        for s in scoops:
            if s <= a and dp[a - s]:
                dp[a] = True
    return dp[total]`,
    tests: [
      t.eq('can_fill(11, [3, 5])', 'True'),
      t.eq('can_fill(7, [3, 5])', 'False'),
      t.eq('can_fill(0, [4])', 'True'),
      t.hidden('can_fill(1, [2])', 'False'),
      t.hidden('can_fill(9, [3])', 'True'),
      t.hidden('can_fill(5, [])', 'False'),
      t.hidden('can_fill(13, [5, 7])', 'False'),
      t.hidden('can_fill(12, [5, 7])', 'True'),
    ],
    hints: ['Amount a can be made if some scoop s fits and the amount left over, a - s, can be made.', 'One entry per amount from 0 to total, so the list has total + 1 entries.', 'Only dp[0] starts as True.'],
    explanation: 'Every amount asks the same question of smaller amounts: is there a last scoop that leaves something already known to be makeable?',
    signature: 'dp:amount-reachable',
    minutes: 7,
  }),
  output({
    id: 'b322-trace-inf',
    title: 'Trace: fewest, with infinity',
    skills: ['dp_min_choice', 'dp_table'],
    prompt: 'Predict the output.',
    code: `INF = float('inf')
sizes = [3, 4]
dp = [0] + [INF] * 7
for a in range(1, 8):
    for s in sizes:
        if s <= a:
            dp[a] = min(dp[a], dp[a - s] + 1)
print(dp)`,
    expectedOutput: `[0, inf, inf, 1, 1, inf, 2, 2]`,
    note: '`dp[a]` is now a **number**: the fewest pieces that add up to `a`. `float("inf")` stands for "cannot be made", and `inf + 1` is still `inf`, so an impossible amount never wins a `min`.',
    explanation: 'Amount 5 looks at amounts 2 and 1, both impossible, so it stays inf. Amount 7 is 3 + 4: one more than amount 4 or amount 3.',
    signature: 'trace:dp-min-inf',
    minutes: 2.5,
  }),
  write({
    id: 'b322-fewest-each',
    title: 'Fewest scoops for every amount',
    skills: ['dp_min_choice', 'dp_table', 'range'],
    prompt: 'Change the question from "can it be made" to "with how few". `total` is a whole number (0 or more) and `scoops` is a list of positive scoop sizes, each usable any number of times.\n\nWrite `fewest_table(total, scoops)` returning the whole table: entry `a` is the fewest scoops that measure exactly `a` litres, and `float("inf")` where `a` cannot be measured.\n\n`fewest_table(4, [1, 3])` → `[0, 1, 2, 1, 2]`',
    starterCode: `def fewest_table(total, scoops):
    pass`,
    solution: `def fewest_table(total, scoops):
    dp = [float('inf')] * (total + 1)
    dp[0] = 0
    for a in range(1, total + 1):
        for s in scoops:
            if s <= a:
                dp[a] = min(dp[a], dp[a - s] + 1)
    return dp`,
    tests: [
      t.eq('fewest_table(4, [1, 3])', '[0, 1, 2, 1, 2]'),
      t.eq('fewest_table(7, [3, 4])', '[0, float("inf"), float("inf"), 1, 1, float("inf"), 2, 2]'),
      t.hidden('fewest_table(0, [2])', '[0]'),
      t.hidden('fewest_table(3, [])', '[0, float("inf"), float("inf"), float("inf")]'),
      t.hidden('fewest_table(6, [2, 2])', '[0, float("inf"), 1, float("inf"), 2, float("inf"), 3]'),
      t.hidden('fewest_table(6, [1, 5, 6])', '[0, 1, 2, 3, 4, 1, 1]'),
    ],
    hints: ['What should every entry hold before anything is known? It must lose every min().', 'Amount 0 needs zero scoops.', 'For each scoop that fits: one more than the fewest for what is left over. Keep the smallest.'],
    explanation: 'Same loops as the True/False table. Only the entry changed: a count instead of a flag, min instead of "any", and infinity instead of False.',
    signature: 'dp:min-choice-table',
    minutes: 7.5,
  }),
  debug({
    id: 'b322-dbg-zero-fill',
    title: 'Debug: every answer is zero',
    skills: ['dp_min_choice', 'dp_table', 'edge_cases'],
    prompt: '`total` is a whole number (0 or more) and `stamps` is a list of positive stamp values. `fewest_stamps(total, stamps)` should return the smallest number of stamps (each value may be used many times) whose values add up to exactly `total`, or `-1` when no combination does. Make every test pass.',
    note: '`dp[a]` should end up as the fewest stamps whose values add up to exactly `a`.',
    brokenCode: `def fewest_stamps(total, stamps):
    dp = [0] * (total + 1)
    for a in range(1, total + 1):
        for s in stamps:
            if s <= a:
                dp[a] = min(dp[a], dp[a - s] + 1)
    if dp[total] == float('inf'):
        return -1
    return dp[total]`,
    solution: `def fewest_stamps(total, stamps):
    dp = [float('inf')] * (total + 1)
    dp[0] = 0
    for a in range(1, total + 1):
        for s in stamps:
            if s <= a:
                dp[a] = min(dp[a], dp[a - s] + 1)
    if dp[total] == float('inf'):
        return -1
    return dp[total]`,
    tests: [
      t.eq('fewest_stamps(11, [5, 2])', '4'),
      t.eq('fewest_stamps(3, [2])', '-1'),
      t.hidden('fewest_stamps(0, [7])', '0'),
      t.hidden('fewest_stamps(7, [7])', '1'),
      t.hidden('fewest_stamps(6, [4, 3, 1])', '2'),
      t.hidden('fewest_stamps(5, [])', '-1'),
      t.hidden('fewest_stamps(1, [3, 4])', '-1'),
    ],
    hints: ['Print the table for a small total. What does each entry hold before the loops touch it?', 'A starting value that is already the smallest possible can never be improved by min().', 'Which single amount truly needs zero stamps?'],
    explanation: 'Zero is a real answer ("needs no stamps"), so it cannot also mean "not known yet". Unknown amounts start at infinity and only amount 0 starts at 0.',
    signature: 'debug:dp-min-missing-sentinel',
    minutes: 4.5,
  }),
  write({
    id: 'b322-cheapest-packs',
    title: 'Cheapest way to buy exactly n',
    skills: ['dp_min_choice', 'dp_table', 'tuples', 'edge_cases'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: 'A shop sells bolts only in packs. `packs` is a list of `(size, price)` tuples (positive whole numbers) and any pack can be bought many times.\n\nWrite `cheapest_exact(total, packs)` returning the lowest price for **exactly** `total` bolts, or `-1` if no mix of packs gives exactly that many. `total` is a whole number, 0 or more, and zero bolts cost `0`.\n\n`cheapest_exact(6, [(1, 3), (4, 8)])` → `14` (one pack of 4, two packs of 1)',
    starterCode: `def cheapest_exact(total, packs):
    pass`,
    solution: `def cheapest_exact(total, packs):
    dp = [float('inf')] * (total + 1)
    dp[0] = 0
    for a in range(1, total + 1):
        for size, price in packs:
            if size <= a:
                dp[a] = min(dp[a], dp[a - size] + price)
    if dp[total] == float('inf'):
        return -1
    return dp[total]`,
    tests: [
      t.eq('cheapest_exact(6, [(1, 3), (4, 8)])', '14'),
      t.eq('cheapest_exact(5, [(2, 5), (4, 7)])', '-1'),
      t.hidden('cheapest_exact(0, [(3, 2)])', '0'),
      t.hidden('cheapest_exact(4, [(4, 9), (2, 4)])', '8'),
      t.hidden('cheapest_exact(7, [(3, 1)])', '-1'),
      t.hidden('cheapest_exact(3, [])', '-1'),
      t.hidden('cheapest_exact(9, [(3, 5), (3, 2)])', '6'),
    ],
    hints: [
      'Say in words what dp[a] holds.',
      'The last pack you buy has some size; what is left over is a smaller amount you have already priced.',
      'Entries start as "cannot be done". Which value survives no min()?',
      'After the table is full, check whether the last entry was ever improved.',
    ],
    explanation: 'The table holds a price rather than a count, so each choice adds its own price instead of 1. Everything else is the same shape: infinity for impossible, min over the choices that fit, and a final check.',
    signature: 'dp:min-choice-weighted',
    minutes: 10,
  }),
]

// ── LC 139 Word Break: DP over prefixes ──────────────────────────────────────
const br139 = [
  write({
    id: 'b139-piece-starts',
    title: 'Where could the last piece start?',
    skills: ['dp_prefix_words', 'slicing', 'set_membership', 'range'],
    prompt: '`s` is a string, `i` is a length (so `s[:i]` is the first `i` characters) and `words` is a **set** of strings.\n\nWrite `piece_starts(s, i, words)` returning every index `j` below `i`, in increasing order, where the piece from `j` up to (not including) `i` is one of the words.\n\n`piece_starts("sunset", 6, {"set", "sunset", "t"})` → `[0, 3, 5]`',
    starterCode: `def piece_starts(s, i, words):
    pass`,
    solution: `def piece_starts(s, i, words):
    starts = []
    for j in range(i):
        if s[j:i] in words:
            starts.append(j)
    return starts`,
    tests: [
      t.eq('piece_starts("sunset", 6, {"set", "sunset", "t"})', '[0, 3, 5]'),
      t.eq('piece_starts("sunset", 3, {"set", "un"})', '[1]'),
      t.hidden('piece_starts("abc", 0, {"a"})', '[]'),
      t.hidden('piece_starts("aaa", 3, {"a", "aa", "aaa"})', '[0, 1, 2]'),
      t.hidden('piece_starts("abc", 2, {"c"})', '[]'),
    ],
    hints: ['Try every start j from 0 up to i - 1.', 'The piece is a slice that begins at j and stops before i.'],
    explanation: 'A prefix of length i always ends with some last piece. Its start j can be anywhere before i, so every j gets tried.',
    signature: 'prefix:last-piece-starts',
    minutes: 5,
  }),
  output({
    id: 'b139-trace-prefix',
    title: 'Trace: which prefixes split',
    skills: ['dp_prefix_words', 'dp_table', 'slicing'],
    prompt: 'Predict the output.',
    code: `s = 'abcab'
words = {'ab', 'c', 'bc'}
dp = [True] + [False] * len(s)
for i in range(1, len(s) + 1):
    for j in range(i):
        if dp[j] and s[j:i] in words:
            dp[i] = True
print(dp)`,
    expectedOutput: `[True, False, True, True, False, True]`,
    note: '`dp[i]` answers for the **first i characters** of `s`, which is the **prefix** `s[:i]`. It is True when some earlier `dp[j]` is True and the piece `s[j:i]` is a word. `dp[0]` is the empty prefix: nothing left to split, so True.',
    explanation: 'dp[4] ("abca") is False: none of "a", "ca", "bca", "abca" is a word. dp[5] is True from dp[3] plus the piece "ab".',
    signature: 'trace:dp-prefix-bool',
    minutes: 2.5,
  }),
  write({
    id: 'b139-prefix-table',
    title: 'The table of splittable prefixes',
    skills: ['dp_prefix_words', 'dp_table', 'slicing', 'set_create'],
    prompt: '`s` is a string and `words` is a **list** of allowed pieces (strings). Write `prefix_table(s, words)` returning a list of `len(s) + 1` booleans: entry `i` is `True` when the first `i` characters of `s` can be cut into allowed pieces (a piece may be used more than once).\n\n`prefix_table("inkpen", ["ink", "pen", "in"])` → `[True, False, True, True, False, False, True]`',
    starterCode: `def prefix_table(s, words):
    pass`,
    solution: `def prefix_table(s, words):
    word_set = set(words)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
    return dp`,
    tests: [
      t.eq('prefix_table("inkpen", ["ink", "pen", "in"])', '[True, False, True, True, False, False, True]'),
      t.eq('prefix_table("aab", ["b"])', '[True, False, False, False]'),
      t.hidden('prefix_table("", ["a"])', '[True]'),
      t.hidden('prefix_table("aaa", ["a", "a"])', '[True, True, True, True]'),
      t.hidden('prefix_table("xy", [])', '[True, False, False]'),
      t.hidden('prefix_table("abab", ["ab", "aba"])', '[True, False, True, True, True]'),
    ],
    hints: ['Turn the list into a set once, so each "is this piece allowed" check is fast.', 'Entry 0 is the empty prefix.', 'Entry i needs a j before it where entry j is True and the piece between j and i is allowed.'],
    explanation: 'The index of the table is a length, not a position: there is one more entry than there are characters, and entry i talks about s[:i].',
    signature: 'dp:prefix-bool-table',
    minutes: 8,
  }),
  debug({
    id: 'b139-dbg-no-base',
    title: 'Debug: nothing ever splits',
    skills: ['dp_prefix_words', 'dp_table', 'edge_cases'],
    prompt: '`clean_prefix(s, words)` should return the length of the **longest prefix** of the string `s` (a prefix is its first so-many characters) that can be cut entirely into pieces from the list `words` (0 if not even one piece fits at the front). Make every test pass.',
    note: '`dp[i]` should be `True` when the first `i` characters of `s` can be cut entirely into pieces from `words`.',
    brokenCode: `def clean_prefix(s, words):
    word_set = set(words)
    dp = [False] * (len(s) + 1)
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
    best = 0
    for i in range(len(s) + 1):
        if dp[i]:
            best = i
    return best`,
    solution: `def clean_prefix(s, words):
    word_set = set(words)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
    best = 0
    for i in range(len(s) + 1):
        if dp[i]:
            best = i
    return best`,
    tests: [
      t.eq('clean_prefix("inkpenx", ["ink", "pen"])', '6'),
      t.eq('clean_prefix("zzz", ["a"])', '0'),
      t.hidden('clean_prefix("", ["a"])', '0'),
      t.hidden('clean_prefix("aaaa", ["aa"])', '4'),
      t.hidden('clean_prefix("aaa", ["aa"])', '2'),
      t.hidden('clean_prefix("abc", ["abc", "ab"])', '3'),
    ],
    hints: ['For the very first piece, j is 0. What does the condition need from the table at that moment?', 'Which entry stands for "nothing has been used yet", and what should it say?'],
    explanation: 'Every True entry is built on an earlier True entry. Without the empty prefix marked True there is nothing for the first piece to stand on.',
    signature: 'debug:dp-prefix-missing-base',
    minutes: 4,
  }),
  write({
    id: 'b139-count-splits',
    title: 'How many ways to cut it',
    skills: ['dp_prefix_words', 'dp_table', 'slicing', 'accumulator'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: '`s` is a string and `words` is a list of strings. Write `count_splits(s, words)` returning **how many different ways** `s` can be cut into pieces that are all in the list `words` (pieces may repeat). The empty string can be cut in exactly one way: no pieces. A word listed twice in `words` is still one word.\n\n`count_splits("aaa", ["a", "aa"])` → `3` (`a|a|a`, `a|aa`, `aa|a`)',
    starterCode: `def count_splits(s, words):
    pass`,
    solution: `def count_splits(s, words):
    word_set = set(words)
    dp = [0] * (len(s) + 1)
    dp[0] = 1
    for i in range(1, len(s) + 1):
        for j in range(i):
            if s[j:i] in word_set:
                dp[i] += dp[j]
    return dp[len(s)]`,
    tests: [
      t.eq('count_splits("aaa", ["a", "aa"])', '3'),
      t.eq('count_splits("inkpen", ["ink", "pen", "in", "kpen"])', '2'),
      t.eq('count_splits("abc", ["ab"])', '0'),
      t.hidden('count_splits("", ["a"])', '1'),
      t.hidden('count_splits("aaaa", ["a", "aa", "aaa"])', '7'),
      t.hidden('count_splits("xyz", [])', '0'),
      t.hidden('count_splits("toto", ["to", "to"])', '1'),
    ],
    hints: [
      'Let each table entry be a number: the ways to cut the first i characters.',
      'Group the ways by where the last piece starts.',
      'If the last piece starts at j and is allowed, every way of cutting the first j characters gives one way here.',
      'What must the entry for the empty prefix be so that a single whole-word cut counts once?',
    ],
    explanation: 'The yes/no table becomes a counting table by changing three things: 0 instead of False, 1 for the empty prefix, and adding dp[j] instead of setting True.',
    signature: 'dp:prefix-count-ways',
    minutes: 9,
  }),
]

// ── LC 300 Longest Increasing Subsequence: look back at every earlier index ──
const br300 = [
  write({
    id: 'b300-best-before',
    title: 'The best earlier chain to join',
    skills: ['dp_lookback', 'range', 'state_tracking'],
    prompt: 'A **rising chain** picks numbers from a list left to right (skipping is fine), each strictly bigger than the one before.\n\n`nums` is a list of numbers and `dp` is a list of the same length. `dp[j]` is already filled in for every index `j` below `i`: the length of the longest rising chain that ends at `nums[j]`. Entries from index `i` on are not filled in yet, so ignore them.\n\nWrite `best_before(nums, dp, i)` returning the largest `dp[j]` among the earlier indexes whose number is **strictly smaller** than `nums[i]`, or `0` if there is none.\n\n`best_before([3, 1, 2, 5], [1, 1, 2, 0], 3)` → `2`',
    note: 'Interviewers call a pick like this a **subsequence**: keep the order, skipping allowed. A **subarray** (in a string, a **substring**) allows no skipping: its items sit next to each other.',
    starterCode: `def best_before(nums, dp, i):
    pass`,
    solution: `def best_before(nums, dp, i):
    best = 0
    for j in range(i):
        if nums[j] < nums[i] and dp[j] > best:
            best = dp[j]
    return best`,
    tests: [
      t.eq('best_before([3, 1, 2, 5], [1, 1, 2, 0], 3)', '2'),
      t.eq('best_before([3, 1, 2, 5], [1, 1, 0, 0], 2)', '1'),
      t.hidden('best_before([4], [0], 0)', '0'),
      t.hidden('best_before([5, 5], [1, 0], 1)', '0'),
      t.hidden('best_before([9, 8, 7], [1, 1, 0], 2)', '0'),
      t.hidden('best_before([1, 2, 3, 4], [1, 2, 3, 0], 3)', '3'),
    ],
    hints: ['Look at every index before i, not only the one just before it.', 'An earlier index counts only when its number is smaller than the number at i.'],
    explanation: 'The entry for i can depend on any earlier entry, so the lookback is a full inner loop over j < i with a condition.',
    signature: 'lookback:best-earlier',
    minutes: 5,
  }),
  write({
    id: 'b300-ending-lengths',
    title: 'Longest rising chain ending at each index',
    skills: ['dp_lookback', 'dp_table', 'range'],
    prompt: 'A rising chain picks numbers from left to right (skipping is fine), each strictly bigger than the one before.\n\nWrite `chain_lengths(nums)` returning a list the same length as `nums`: entry `i` is the length of the longest rising chain whose **last number is `nums[i]`**.\n\n`chain_lengths([3, 1, 2, 5, 4])` → `[1, 1, 2, 3, 3]`',
    starterCode: `def chain_lengths(nums):
    pass`,
    solution: `def chain_lengths(nums):
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return dp`,
    tests: [
      t.eq('chain_lengths([3, 1, 2, 5, 4])', '[1, 1, 2, 3, 3]'),
      t.eq('chain_lengths([5, 4, 3])', '[1, 1, 1]'),
      t.hidden('chain_lengths([])', '[]'),
      t.hidden('chain_lengths([7])', '[1]'),
      t.hidden('chain_lengths([2, 2, 2])', '[1, 1, 1]'),
      t.hidden('chain_lengths([1, 2, 3, 4])', '[1, 2, 3, 4]'),
      t.hidden('chain_lengths([1, 5, 2, 3])', '[1, 2, 2, 3]'),
    ],
    hints: ['Every number is a chain of length 1 on its own.', 'A chain ending at i is an earlier chain ending at some smaller number, plus one.', 'Two loops: i over every index, j over every index before i.'],
    explanation: 'Pinning the chain to END at index i is what makes the table fillable: to extend a chain you only need to know its last number.',
    signature: 'dp:lookback-lengths',
    minutes: 7,
  }),
  debug({
    id: 'b300-dbg-last-entry',
    title: 'Debug: the longest slide',
    skills: ['dp_lookback', 'dp_table', 'edge_cases'],
    prompt: '`prices` is a list of numbers. `longest_slide(prices)` should return the length of the longest **falling** chain in `prices`: prices picked from left to right (skipping is fine), each strictly lower than the one before. An empty list gives `0`. Make every test pass.',
    note: '`dp[i]` is the length of the longest falling chain that **ends at** `prices[i]`.',
    brokenCode: `def longest_slide(prices):
    if not prices:
        return 0
    dp = [1] * len(prices)
    for i in range(len(prices)):
        for j in range(i):
            if prices[j] > prices[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return dp[-1]`,
    solution: `def longest_slide(prices):
    if not prices:
        return 0
    dp = [1] * len(prices)
    for i in range(len(prices)):
        for j in range(i):
            if prices[j] > prices[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)`,
    tests: [
      t.eq('longest_slide([9, 7, 4, 8])', '3'),
      t.eq('longest_slide([5, 3, 9])', '2'),
      t.hidden('longest_slide([])', '0'),
      t.hidden('longest_slide([4])', '1'),
      t.hidden('longest_slide([1, 2, 3])', '1'),
      t.hidden('longest_slide([6, 6, 6])', '1'),
      t.hidden('longest_slide([10, 9, 8, 7])', '4'),
    ],
    hints: ['Say in words what one entry of the table means. Does the best chain have to finish on the final price?', 'Write the table out for the first test and compare it with what is returned.'],
    explanation: 'Each entry is the best chain ending at that index. The best chain overall can end anywhere, so the answer is the largest entry, not the last one.',
    signature: 'debug:lookback-last-not-max',
    minutes: 3.5,
  }),
  write({
    id: 'b300-rising-sum',
    title: 'The heaviest rising chain',
    skills: ['dp_lookback', 'dp_table', 'state_tracking', 'edge_cases'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: '`nums` is a list of positive numbers. Pick numbers from left to right (skipping is fine) so each is strictly bigger than the one before.\n\nWrite `best_rising_sum(nums)` returning the **largest total** such a pick can have. An empty list gives `0`.\n\n`best_rising_sum([1, 101, 2, 3, 100])` → `106` (1 + 2 + 3 + 100)',
    starterCode: `def best_rising_sum(nums):
    pass`,
    solution: `def best_rising_sum(nums):
    if not nums:
        return 0
    dp = nums[:]
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + nums[i])
    return max(dp)`,
    tests: [
      t.eq('best_rising_sum([1, 101, 2, 3, 100])', '106'),
      t.eq('best_rising_sum([10, 5, 4])', '10'),
      t.eq('best_rising_sum([3, 4, 1, 5])', '12'),
      t.hidden('best_rising_sum([])', '0'),
      t.hidden('best_rising_sum([8])', '8'),
      t.hidden('best_rising_sum([2, 2, 2])', '2'),
      t.hidden('best_rising_sum([5, 1, 2, 3])', '6'),
      t.hidden('best_rising_sum([1, 2, 3, 4])', '10'),
    ],
    hints: [
      'Let each entry be the best total of a pick that ends at that index.',
      'On its own, a number is a pick worth itself.',
      'Look back at every earlier index holding a smaller number: its best total plus this number.',
      'Where can the best pick end?',
    ],
    explanation: 'The same lookback with a different quantity in the table: a total instead of a length, so a chain grows by nums[i] rather than by 1. The answer is still the best entry anywhere.',
    signature: 'dp:lookback-sum',
    minutes: 9,
  }),
]

// ── LC 5 Longest Palindromic Substring: expand around a center ───────────────
const br5 = [
  write({
    id: 'b5-spread',
    title: 'Grow outward while the ends match',
    skills: ['expand_center', 'two_pointer', 'while_loop', 'slicing'],
    prompt: '`s` is a string. `left` and `right` are indexes into it: either the same index, or `right` is `left + 1`.\n\nWrite `spread(s, left, right)`. Starting from the two given indexes, keep stepping `left` down and `right` up for as long as both are inside `s` and the two characters are equal. Return the piece of `s` covered by the pairs that matched (the empty string if the starting characters already differ).\n\n`spread("racecar", 3, 3)` → `"racecar"`, `spread("xabbay", 2, 3)` → `"abba"`, `spread("abc", 0, 1)` → `""`',
    note: 'A palindrome (a piece that reads the same both ways) is symmetric about its middle. So start two indexes at the middle and step them **apart** while the characters match. It is the two-index walk you know, run outward instead of inward.',
    starterCode: `def spread(s, left, right):
    pass`,
    solution: `def spread(s, left, right):
    while left >= 0 and right < len(s) and s[left] == s[right]:
        left -= 1
        right += 1
    return s[left + 1:right]`,
    tests: [
      t.eq('spread("racecar", 3, 3)', '"racecar"'),
      t.eq('spread("xabbay", 2, 3)', '"abba"'),
      t.eq('spread("abc", 0, 1)', '""'),
      t.hidden('spread("xaby", 1, 1)', '"a"'),
      t.hidden('spread("z", 0, 0)', '"z"'),
      t.hidden('spread("aaaa", 0, 1)', '"aa"'),
      t.hidden('spread("noon!", 1, 2)', '"noon"'),
      t.hidden('spread("banana", 3, 3)', '"anana"'),
    ],
    hints: ['The loop needs three things to be true: left in bounds, right in bounds, characters equal. Check the bounds first.', 'When the loop stops, both pointers have gone one step too far.', 'Which slice covers the characters strictly between where the pointers stopped?'],
    explanation: 'The pointers move apart instead of together. The loop ends on the first pair that fails, so the palindrome is everything strictly between them.',
    signature: 'expand:spread-slice',
    minutes: 5.5,
  }),
  debug({
    id: 'b5-dbg-slice',
    title: 'Debug: one character too wide',
    skills: ['expand_center', 'slicing', 'while_loop'],
    prompt: '`s` is a non-empty string and `i` is an index into it. `widest_at(s, i)` should return the longest piece of `s` that reads the same both ways and has `s[i]` as its exact middle character. Make every test pass.',
    brokenCode: `def widest_at(s, i):
    left, right = i, i
    while left >= 0 and right < len(s) and s[left] == s[right]:
        left -= 1
        right += 1
    return s[left:right + 1]`,
    solution: `def widest_at(s, i):
    left, right = i, i
    while left >= 0 and right < len(s) and s[left] == s[right]:
        left -= 1
        right += 1
    return s[left + 1:right]`,
    tests: [
      t.eq('widest_at("xlevelq", 3)', '"level"'),
      t.eq('widest_at("abc", 1)', '"b"'),
      t.hidden('widest_at("a", 0)', '"a"'),
      t.hidden('widest_at("level", 2)', '"level"'),
      t.hidden('widest_at("aaa", 0)', '"a"'),
      t.hidden('widest_at("abcba", 4)', '"a"'),
    ],
    hints: ['What are left and right at the moment the loop stops? Do those two positions belong to the answer?', 'A slice includes its start index and excludes its end index.'],
    explanation: 'The loop exits after one step too many on each side. The good span is left + 1 through right - 1, and because a slice excludes its end, that is s[left + 1:right].',
    signature: 'debug:expand-slice-off-by-one',
    minutes: 3.5,
  }),
  write({
    id: 'b5-both-centers',
    title: 'Odd center, even center',
    skills: ['expand_center', 'two_pointer', 'slicing', 'len'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: 'A mirrored piece (a palindrome: it reads the same both ways) has either one middle character (`"aba"`) or a middle gap between two equal characters (`"abba"`).\n\n`s` is a non-empty string and `i` is an index into it. Write `longer_at(s, i)` returning the longer of: the widest mirrored piece whose middle is `s[i]`, and the widest one whose middle gap is between index `i` and `i + 1`. On a tie return the first. If `i` is the last index there is no such gap, and the second kind counts as empty.\n\n`longer_at("xabbay", 2)` → `"abba"`, `longer_at("racecar", 3)` → `"racecar"`',
    starterCode: `def longer_at(s, i):
    pass`,
    solution: `def longer_at(s, i):
    def spread(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]

    odd = spread(i, i)
    even = spread(i, i + 1)
    if len(even) > len(odd):
        return even
    return odd`,
    tests: [
      t.eq('longer_at("xabbay", 2)', '"abba"'),
      t.eq('longer_at("racecar", 3)', '"racecar"'),
      t.hidden('longer_at("a", 0)', '"a"'),
      t.hidden('longer_at("ab", 1)', '"b"'),
      t.hidden('longer_at("aab", 0)', '"aa"'),
      t.hidden('longer_at("abcd", 2)', '"c"'),
      t.hidden('longer_at("aaaa", 1)', '"aaaa"'),
    ],
    hints: ['Write the grow-outward loop once, as a helper, and call it twice.', 'The two calls differ only in where the right pointer starts.', 'Compare the lengths of the two results.'],
    explanation: 'An even-length palindrome has no middle character, so starting both pointers on i can never find it. Starting them on i and i + 1 covers that case with the same loop.',
    signature: 'expand:odd-and-even',
    minutes: 9,
  }),
  write({
    id: 'b5-count-mirrors',
    title: 'Count every mirrored piece',
    skills: ['expand_center', 'two_pointer', 'while_loop', 'accumulator'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: '`s` is a string. Write `count_mirrors(s)` returning how many substrings of `s` (pieces made of neighbouring characters, at least one long) read the same both ways. Pieces at different positions count separately even if they look alike. The empty string gives `0`.\n\n`count_mirrors("aba")` → `4` (`a`, `b`, `a`, `aba`), `count_mirrors("aaa")` → `6`',
    starterCode: `def count_mirrors(s):
    pass`,
    solution: `def count_mirrors(s):
    count = 0
    for i in range(len(s)):
        for left, right in ((i, i), (i, i + 1)):
            while left >= 0 and right < len(s) and s[left] == s[right]:
                count += 1
                left -= 1
                right += 1
    return count`,
    tests: [
      t.eq('count_mirrors("aba")', '4'),
      t.eq('count_mirrors("aaa")', '6'),
      t.eq('count_mirrors("abc")', '3'),
      t.hidden('count_mirrors("")', '0'),
      t.hidden('count_mirrors("z")', '1'),
      t.hidden('count_mirrors("abba")', '6'),
      t.hidden('count_mirrors("abab")', '6'),
    ],
    hints: [
      'Every mirrored piece has exactly one middle: a character or a gap.',
      'For each index, grow outward from both kinds of middle.',
      'Each successful step of the growing loop has just found one more mirrored piece.',
    ],
    explanation: 'Each palindrome is discovered exactly once, from its own center, while that center is expanding. Counting the successful steps over every odd and even center counts them all in O(n²) with no extra memory.',
    signature: 'expand:count-all-centers',
    minutes: 9,
  }),
]

// ── LC 62 Unique Paths: a 2-D table ──────────────────────────────────────────
const br62 = [
  write({
    id: 'b62-border-ones',
    title: 'A table with its edges filled',
    skills: ['dp_grid', 'grid_nested', 'list_comprehension', 'range'],
    prompt: 'Write `border_ones(rows, cols)` (both at least 1) returning a table of `rows` rows and `cols` columns that holds `1` everywhere in the first row and the first column, and `0` everywhere else. Each row must be its own list.\n\n`border_ones(2, 3)` → `[[1, 1, 1], [1, 0, 0]]`',
    note: 'A 2-D table is a list of rows, and each row is a list: `table[r][c]` is row `r`, column `c`. Build it with `[[0] * cols for _ in range(rows)]`, which makes a new row list each time round (`_` is a loop variable you never read).',
    starterCode: `def border_ones(rows, cols):
    pass`,
    solution: `def border_ones(rows, cols):
    table = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        table[r][0] = 1
    for c in range(cols):
        table[0][c] = 1
    return table`,
    tests: [
      t.eq('border_ones(2, 3)', '[[1, 1, 1], [1, 0, 0]]'),
      t.eq('border_ones(3, 3)', '[[1, 1, 1], [1, 0, 0], [1, 0, 0]]'),
      t.hidden('border_ones(1, 1)', '[[1]]'),
      t.hidden('border_ones(1, 4)', '[[1, 1, 1, 1]]'),
      t.hidden('border_ones(3, 1)', '[[1], [1], [1]]'),
      t.check('rows are separate lists', 'g = border_ones(3, 3)\ng[1][1] = 7\nassert g[2][1] == 0 and g[0][1] == 1', true),
    ],
    hints: ['Build one fresh row of zeros per row of the table.', 'The first column is index 0 of every row; the first row is every index of row 0.'],
    explanation: 'A 2-D table starts life like a 1-D one: build it at full size, then write the entries you know without looking at anything else.',
    signature: 'grid-dp:build-with-borders',
    minutes: 6.5,
  }),
  debug({
    id: 'b62-dbg-alias',
    title: 'Debug: every row is the last row',
    skills: ['dp_grid', 'grid_nested', 'list_comprehension'],
    prompt: '`step_table(rows, cols)` should return a table where the cell in row `r`, column `c` holds `r + c`: the number of moves from the top-left corner going only right or down. Make every test pass.',
    brokenCode: `def step_table(rows, cols):
    table = [[0] * cols] * rows
    for r in range(rows):
        for c in range(cols):
            table[r][c] = r + c
    return table`,
    solution: `def step_table(rows, cols):
    table = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            table[r][c] = r + c
    return table`,
    tests: [
      t.eq('step_table(2, 3)', '[[0, 1, 2], [1, 2, 3]]'),
      t.eq('step_table(1, 2)', '[[0, 1]]'),
      t.hidden('step_table(3, 1)', '[[0], [1], [2]]'),
      t.hidden('step_table(3, 3)', '[[0, 1, 2], [1, 2, 3], [2, 3, 4]]'),
      t.hidden('step_table(1, 1)', '[[0]]'),
    ],
    hints: ['The loops are right. Look at the returned table: what do you notice about its rows?', 'How many separate row lists does the first line actually create?'],
    explanation: '`[row] * rows` repeats a reference to ONE row list, so a write to any row shows up in all of them. A comprehension builds a new row each time round.',
    signature: 'debug:dp-grid-aliased-rows',
    minutes: 3.5,
  }),
  write({
    id: 'b62-fill-inside',
    title: 'Each cell from above and from the left',
    skills: ['dp_grid', 'grid_nested', 'range'],
    prompt: '`table` is a non-empty grid (a list of rows, all the same length) whose first row and first column are already filled in. Write `fill_inside(table)` that sets every other cell to the cell **above** it plus the cell to its **left**, working row by row, and returns the table.\n\n`fill_inside([[1, 1, 1], [1, 0, 0], [1, 0, 0]])` → `[[1, 1, 1], [1, 2, 3], [1, 3, 6]]`',
    starterCode: `def fill_inside(table):
    pass`,
    solution: `def fill_inside(table):
    for r in range(1, len(table)):
        for c in range(1, len(table[0])):
            table[r][c] = table[r - 1][c] + table[r][c - 1]
    return table`,
    tests: [
      t.eq('fill_inside([[1, 1, 1], [1, 0, 0], [1, 0, 0]])', '[[1, 1, 1], [1, 2, 3], [1, 3, 6]]'),
      t.eq('fill_inside([[1, 1], [1, 0]])', '[[1, 1], [1, 2]]'),
      t.hidden('fill_inside([[1]])', '[[1]]'),
      t.hidden('fill_inside([[1, 1, 1, 1]])', '[[1, 1, 1, 1]]'),
      t.hidden('fill_inside([[1], [1], [1]])', '[[1], [1], [1]]'),
      t.hidden('fill_inside([[2, 3, 4], [5, 0, 0]])', '[[2, 3, 4], [5, 8, 12]]'),
    ],
    hints: ['Which row and which column must the loops skip?', 'Above is one row up in the same column. Left is the same row, one column back.'],
    explanation: 'Filling row by row, left to right, guarantees the cell above and the cell to the left are already final when you read them.',
    signature: 'grid-dp:above-plus-left',
    minutes: 5.5,
  }),
  write({
    id: 'b62-cheapest-walk',
    title: 'The cheapest walk across a grid',
    skills: ['dp_grid', 'grid_nested', 'dp_table', 'range'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: '`costs` is a non-empty grid (a list of rows, all the same length) of non-negative numbers. You start on the top-left cell, finish on the bottom-right cell, and may only step right or down. You pay the cost of every cell you stand on, including the first and the last.\n\nWrite `cheapest_walk(costs)` returning the lowest total.\n\n`cheapest_walk([[1, 3, 1], [1, 5, 1], [4, 2, 1]])` → `7` (1, 3, 1, 1, 1)',
    starterCode: `def cheapest_walk(costs):
    pass`,
    solution: `def cheapest_walk(costs):
    rows, cols = len(costs), len(costs[0])
    dp = [[0] * cols for _ in range(rows)]
    dp[0][0] = costs[0][0]
    for c in range(1, cols):
        dp[0][c] = dp[0][c - 1] + costs[0][c]
    for r in range(1, rows):
        dp[r][0] = dp[r - 1][0] + costs[r][0]
    for r in range(1, rows):
        for c in range(1, cols):
            dp[r][c] = costs[r][c] + min(dp[r - 1][c], dp[r][c - 1])
    return dp[-1][-1]`,
    tests: [
      t.eq('cheapest_walk([[1, 3, 1], [1, 5, 1], [4, 2, 1]])', '7'),
      t.eq('cheapest_walk([[1, 2], [1, 1]])', '3'),
      t.hidden('cheapest_walk([[5]])', '5'),
      t.hidden('cheapest_walk([[1, 2, 3]])', '6'),
      t.hidden('cheapest_walk([[1], [2], [3]])', '6'),
      t.hidden('cheapest_walk([[1, 9, 9], [1, 9, 9], [1, 1, 1]])', '5'),
      t.hidden('cheapest_walk([[0, 0], [0, 0]])', '0'),
    ],
    hints: [
      'Let each table cell hold the cheapest total for a walk that ends on that cell.',
      'You can only arrive from above or from the left.',
      'Along the top row there is only one way to arrive; the same goes for the left column. Fill those first.',
      'Inside: this cell’s cost plus the cheaper of the two ways in. The answer sits in the last cell.',
    ],
    explanation: 'The table has the same shape as the grid. The edges have a single way in, so they are filled first; every inner cell then chooses the better of the cell above and the cell to the left.',
    signature: 'grid-dp:min-path-sum',
    minutes: 11,
  }),
]

// ── LC 1143 Longest Common Subsequence: a table over two sequences ───────────
const br1143 = [
  write({
    id: 'b1143-padded-table',
    title: 'One extra row, one extra column',
    skills: ['dp_two_sequences', 'grid_nested', 'list_comprehension', 'len'],
    prompt: '`a` and `b` are strings, and either can be empty. A **prefix** is the first so-many characters of a string.\n\nA table that compares two strings has a row for every **prefix length** of `a` (0 up to `len(a)`) and a column for every prefix length of `b`.\n\nWrite `padded_table(a, b)` returning that table filled with zeros. Each row must be its own list.\n\n`padded_table("ab", "xyz")` → 3 rows of `[0, 0, 0, 0]`',
    note: 'Row 0 and column 0 stand for "none of this string yet", which is why the table is one bigger than the strings in each direction. They stay `0` and give every real cell a neighbour above and to its left, so no edge checks are needed later.',
    starterCode: `def padded_table(a, b):
    pass`,
    solution: `def padded_table(a, b):
    rows = len(a) + 1
    cols = len(b) + 1
    return [[0] * cols for _ in range(rows)]`,
    tests: [
      t.eq('padded_table("ab", "xyz")', '[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]'),
      t.eq('padded_table("", "q")', '[[0, 0]]'),
      t.hidden('padded_table("", "")', '[[0]]'),
      t.hidden('padded_table("abc", "")', '[[0], [0], [0], [0]]'),
      t.check('rows are separate lists', 'g = padded_table("ab", "cd")\ng[0][0] = 5\nassert g[1][0] == 0', true),
    ],
    hints: ['Lengths 0, 1, ..., len(a) is one more value than len(a).', 'Rows come from the first string, columns from the second.'],
    explanation: 'Row 0 and column 0 stand for "none of this string yet". With them in place every real cell has a neighbour above, to the left and on the diagonal, so no bounds checks are needed.',
    signature: 'two-seq:padded-zeros',
    minutes: 4,
  }),
  write({
    id: 'b1143-match-cells',
    title: 'Mark where the characters match',
    skills: ['dp_two_sequences', 'grid_nested', 'string_index', 'range'],
    prompt: '`a` and `b` are strings. Write `match_table(a, b)` returning the padded table (`len(a) + 1` rows, `len(b) + 1` columns) where the cell in row `i`, column `j` is `1` when the **i-th character of `a`** and the **j-th character of `b`** (counting from 1) are the same, and `0` otherwise. Row 0 and column 0 stay all zeros.\n\n`match_table("ab", "ba")` → `[[0, 0, 0], [0, 0, 1], [0, 1, 0]]`',
    starterCode: `def match_table(a, b):
    pass`,
    solution: `def match_table(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = 1
    return dp`,
    tests: [
      t.eq('match_table("ab", "ba")', '[[0, 0, 0], [0, 0, 1], [0, 1, 0]]'),
      t.eq('match_table("aa", "a")', '[[0, 0], [0, 1], [0, 1]]'),
      t.hidden('match_table("", "x")', '[[0, 0]]'),
      t.hidden('match_table("x", "")', '[[0], [0]]'),
      t.hidden('match_table("abc", "abc")', '[[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]'),
      t.hidden('match_table("ab", "cd")', '[[0, 0, 0], [0, 0, 0], [0, 0, 0]]'),
    ],
    hints: ['Both loops start at 1 and run up to and including the length.', 'Row i is about the first i characters. At which index of the string does the i-th character live?'],
    explanation: 'Table indexes are lengths; string indexes are positions. Row i lines up with a[i - 1], column j with b[j - 1]. That one-step gap is the thing to get right in every two-sequence table.',
    signature: 'two-seq:index-offset',
    minutes: 7,
  }),
  write({
    id: 'b1143-common-run',
    title: 'The longest shared run',
    skills: ['dp_two_sequences', 'dp_grid', 'string_index', 'state_tracking'],
    stage: 'combine',
    repType: 'combine',
    difficulty: 3,
    prompt: '`a` and `b` are strings. Write `longest_shared_run(a, b)` returning the length of the longest stretch of **neighbouring** characters that appears in both strings (`0` if they share nothing).\n\nUse a padded table (`len(a) + 1` rows, `len(b) + 1` columns) and let the cell in row `i`, column `j` be the length of the shared run that ends with the i-th character of `a` and the j-th character of `b`.\n\n`longest_shared_run("sunday", "monday")` → `4` (`nday`)',
    starterCode: `def longest_shared_run(a, b):
    pass`,
    solution: `def longest_shared_run(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    best = 0
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                best = max(best, dp[i][j])
    return best`,
    tests: [
      t.eq('longest_shared_run("sunday", "monday")', '4'),
      t.eq('longest_shared_run("abc", "xyz")', '0'),
      t.eq('longest_shared_run("abxab", "ab")', '2'),
      t.hidden('longest_shared_run("", "a")', '0'),
      t.hidden('longest_shared_run("a", "a")', '1'),
      t.hidden('longest_shared_run("aaaa", "aa")', '2'),
      t.hidden('longest_shared_run("abcde", "cdxab")', '2'),
      t.hidden('longest_shared_run("banana", "anan")', '4'),
    ],
    hints: ['When the two characters match, the run they end is one longer than the run that ended just before both of them.', '"Just before both" is one row up AND one column back.', 'When they differ, the run is broken: the cell stays 0. Track the largest cell you ever write.'],
    explanation: 'A match extends whatever was true one step back in both strings at once: the diagonal cell. The padding row and column make that read safe for the first characters.',
    signature: 'two-seq:diagonal-extend',
    minutes: 9,
  }),
  debug({
    id: 'b1143-dbg-index',
    title: 'Debug: two playlists',
    skills: ['dp_two_sequences', 'dp_grid', 'list_index'],
    prompt: '`a` and `b` are two playlists (lists). `kept_in_order(a, b)` should return the largest number of songs that appear in **both** playlists in the same order (other songs may sit in between; interviewers call this the longest common **subsequence**). Make every test pass.',
    note: '`dp[i][j]` is the answer for the first `i` songs of `a` and the first `j` songs of `b`. Row 0 and column 0 mean "no songs yet".',
    brokenCode: `def kept_in_order(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i] == b[j]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]`,
    solution: `def kept_in_order(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]`,
    tests: [
      t.eq('kept_in_order(["x", "y", "z"], ["y", "q", "z"])', '2'),
      t.eq('kept_in_order([1, 2, 3], [3, 2, 1])', '1'),
      t.hidden('kept_in_order([], [1])', '0'),
      t.hidden('kept_in_order([4], [4])', '1'),
      t.hidden('kept_in_order([1, 2, 3, 4], [1, 2, 3, 4])', '4'),
      t.hidden('kept_in_order([1, 1, 2], [1, 2, 1])', '2'),
      t.hidden('kept_in_order([5, 6], [7, 8])', '0'),
    ],
    hints: ['Read the error. Which value of i causes it?', 'Row i of the table is about the first i songs. Where in the list is the i-th song?'],
    explanation: 'The table is one bigger than the lists in each direction, so its indexes run one ahead: cell (i, j) compares a[i - 1] with b[j - 1]. When they differ, the cell carries the better of dropping the last song of a (above) or of b (left).',
    signature: 'debug:two-seq-index-offset',
    minutes: 4,
  }),
  write({
    id: 'b1143-min-deletions',
    title: 'Delete until two words agree',
    skills: ['dp_two_sequences', 'dp_grid', 'string_index', 'len'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 4,
    prompt: '`a` and `b` are words (strings), and either can be empty. You may delete any characters from either word. Write `deletions_to_match(a, b)` returning the **fewest deletions in total** that leave the two words identical (both empty counts as identical).\n\n`deletions_to_match("sea", "eat")` → `2` (drop `s` and `t`, leaving `ea`)',
    starterCode: `def deletions_to_match(a, b):
    pass`,
    solution: `def deletions_to_match(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    shared = dp[-1][-1]
    return len(a) + len(b) - 2 * shared`,
    tests: [
      t.eq('deletions_to_match("sea", "eat")', '2'),
      t.eq('deletions_to_match("abc", "abc")', '0'),
      t.eq('deletions_to_match("ab", "cd")', '4'),
      t.hidden('deletions_to_match("", "abc")', '3'),
      t.hidden('deletions_to_match("", "")', '0'),
      t.hidden('deletions_to_match("a", "b")', '2'),
      t.hidden('deletions_to_match("leetcode", "etco")', '4'),
      t.hidden('deletions_to_match("aab", "aba")', '2'),
    ],
    hints: [
      'Whatever survives the deletions is in both words, in the same order. You want as much as possible to survive.',
      'Let a cell hold the most characters that can survive from the first i of a and the first j of b.',
      'Same last character: keep it, on top of the diagonal cell. Different: one of the two last characters has to go, so take the better of above and left.',
      'Every character that does not survive is one deletion, in each word.',
    ],
    explanation: 'The table measures what the two words can keep in common. Everything else in each word is deleted, so the answer is both lengths minus twice the kept amount.',
    signature: 'two-seq:keep-common-delete-rest',
    minutes: 10,
  }),
]

// ── LC 91 Decode Ways: counting over prefixes with 1- and 2-digit pieces ─────
const br91 = [
  write({
    id: 'b91-valid-piece',
    title: 'Is this piece a letter number?',
    skills: ['dp_prefix_words', 'string_index', 'conditionals'],
    prompt: 'Letters are numbered 1 to 26. `piece` is a string of one or two digits.\n\nWrite `is_code(piece)` returning `True` when the piece is a letter number written without a leading zero, else `False`.\n\n`is_code("7")` → `True`, `is_code("26")` → `True`, `is_code("06")` → `False`, `is_code("27")` → `False`',
    note: '`int(text)` turns a string of digits into a number: `int("26")` is `26`. A string of digits and the number it stands for are different things, and some questions can only be asked of one of them.',
    starterCode: `def is_code(piece):
    pass`,
    solution: `def is_code(piece):
    if piece[0] == '0':
        return False
    return 1 <= int(piece) <= 26`,
    tests: [
      t.eq('is_code("7")', 'True'),
      t.eq('is_code("26")', 'True'),
      t.eq('is_code("06")', 'False'),
      t.eq('is_code("27")', 'False'),
      t.hidden('is_code("0")', 'False'),
      t.hidden('is_code("10")', 'True'),
      t.hidden('is_code("1")', 'True'),
      t.hidden('is_code("30")', 'False'),
      t.hidden('is_code("00")', 'False'),
    ],
    hints: ['int("06") is 6, so the number alone cannot tell you about a leading zero.', 'Look at the first character before converting.'],
    explanation: 'The pieces here are not looked up in a word set; they are judged by a rule. A leading zero has to be rejected on the text, because converting to a number hides it.',
    signature: 'digits:valid-piece',
    minutes: 4,
  }),
  debug({
    id: 'b91-dbg-leading-zero',
    title: 'Debug: month numbers',
    skills: ['dp_prefix_words', 'dp_table', 'slicing', 'edge_cases'],
    prompt: 'A string of digits was made by writing month numbers (1 to 12, never with a leading zero) one after another with no gaps. `month_ways(digits)` should return how many different lists of months could have produced it. The empty string counts as one way. Make every test pass.',
    note: '`dp[i]` is the number of ways to read the **first i digits**. `digits[i - 1]` is the last of those digits and the slice `digits[i - 2:i]` is the last two, as text. `int(...)` turns that text into a number.',
    brokenCode: `def month_ways(digits):
    n = len(digits)
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        if digits[i - 1] != '0':
            dp[i] += dp[i - 1]
        if i >= 2 and 1 <= int(digits[i - 2:i]) <= 12:
            dp[i] += dp[i - 2]
    return dp[n]`,
    solution: `def month_ways(digits):
    n = len(digits)
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        if digits[i - 1] != '0':
            dp[i] += dp[i - 1]
        if i >= 2 and 10 <= int(digits[i - 2:i]) <= 12:
            dp[i] += dp[i - 2]
    return dp[n]`,
    tests: [
      t.eq('month_ways("112")', '3'),
      t.eq('month_ways("101")', '1'),
      t.eq('month_ways("13")', '1'),
      t.hidden('month_ways("")', '1'),
      t.hidden('month_ways("0")', '0'),
      t.hidden('month_ways("1201")', '0'),
      t.hidden('month_ways("1010")', '1'),
      t.hidden('month_ways("111")', '3'),
      t.hidden('month_ways("7")', '1'),
    ],
    hints: ['List by hand the ways to read "101". Which reading does the code count that you did not?', 'What two-character pieces does the second check accept that are not really two-digit numbers?'],
    explanation: 'A two-character piece like "01" converts to 1 and slips through a range that starts at 1. A genuine two-digit number is at least 10, so the range must start there.',
    signature: 'debug:digit-dp-leading-zero',
    minutes: 4,
  }),
  write({
    id: 'b91-route-ways',
    title: 'Bus routes run together',
    skills: ['dp_prefix_words', 'dp_table', 'slicing', 'edge_cases'],
    stage: 'pattern',
    repType: 'pattern',
    important: true,
    transfer: true,
    difficulty: 3,
    prompt: 'A city numbers its bus routes 1 to 35, never with a leading zero. Someone wrote down the routes they rode with no gaps between the numbers, which left one string of digit characters, `digits`.\n\nWrite `route_ways(digits)` returning how many different lists of routes that string of digits could stand for. The empty string counts as one way.\n\n`route_ways("123")` → `3` (`1|2|3`, `12|3`, `1|23`), `route_ways("305")` → `1`, `route_ways("40")` → `0`',
    starterCode: `def route_ways(digits):
    pass`,
    solution: `def route_ways(digits):
    n = len(digits)
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        if digits[i - 1] != '0':
            dp[i] += dp[i - 1]
        if i >= 2 and 10 <= int(digits[i - 2:i]) <= 35:
            dp[i] += dp[i - 2]
    return dp[n]`,
    tests: [
      t.eq('route_ways("123")', '3'),
      t.eq('route_ways("305")', '1'),
      t.eq('route_ways("40")', '0'),
      t.hidden('route_ways("")', '1'),
      t.hidden('route_ways("0")', '0'),
      t.hidden('route_ways("9")', '1'),
      t.hidden('route_ways("36")', '1'),
      t.hidden('route_ways("35")', '2'),
      t.hidden('route_ways("1001")', '0'),
      t.hidden('route_ways("2020")', '1'),
      t.hidden('route_ways("1111")', '5'),
    ],
    hints: [
      'Let entry i be the number of ways to read the first i digits.',
      'The last route read is either the final digit alone or the final two digits together.',
      'Each of those two pieces has its own rule for being a real route number. A valid piece adds the ways for what comes before it.',
      'The two-digit piece only exists from the second digit on.',
    ],
    explanation: 'It is the counting form of the prefix table, with only two possible last pieces instead of every j. Each valid piece adds the count from the prefix before it, and a digit that fits neither rule leaves the entry at 0, which then spreads.',
    signature: 'dp:prefix-count-digits',
    minutes: 9,
  }),
]

const sections: PackSection[] = [
  { id: 'br-213', module: MODULE, title: 'Toward House Robber II', summary: 'A ring is two lines: drop the first, drop the last, keep the better.', exercises: br213 },
  { id: 'br-53', module: MODULE, title: 'Toward Maximum Subarray', summary: 'Carry the best sum ending here: extend the run or start fresh.', exercises: br53 },
  { id: 'br-55', module: MODULE, title: 'Toward Jump Game', summary: 'One pass with the farthest index reachable so far.', exercises: br55 },
  { id: 'br-322', module: MODULE, title: 'Toward Coin Change', summary: 'From "can this amount be made" to "with how few", with infinity for cannot.', exercises: br322 },
  { id: 'br-139', module: MODULE, title: 'Toward Word Break', summary: 'A table over prefix lengths, built from an earlier prefix plus one last piece.', exercises: br139 },
  { id: 'br-300', module: MODULE, title: 'Toward Longest Increasing Subsequence', summary: 'Best chain ending at each index, looking back at every earlier one.', exercises: br300 },
  { id: 'br-5', module: MODULE, title: 'Toward Longest Palindromic Substring', summary: 'Grow outward from odd and even centers, then slice.', exercises: br5 },
  { id: 'br-62', module: MODULE, title: 'Toward Unique Paths', summary: 'A rows by cols table where each cell reads the cell above and the cell to the left.', exercises: br62 },
  { id: 'br-1143', module: MODULE, title: 'Toward Longest Common Subsequence', summary: 'A padded table over two strings: diagonal on a match, better neighbour otherwise.', exercises: br1143 },
  { id: 'br-91', module: MODULE, title: 'Toward Decode Ways', summary: 'Counting over prefixes when the last piece is one digit or two.', exercises: br91 },
]

const UNIT = 'Dynamic programming'

export const pack: Pack = {
  sections,
  bridges: [
    {
      lc: 213,
      title: 'House Robber II',
      unit: UNIT,
      section: 'br-213',
      mode: 'bridge-first',
      prerequisiteSkills: ['dp_table', 'recurrence', 'state_tracking', 'slicing', 'circular_split'],
      blocks: [
        { label: 'take or skip along a straight row', skills: ['dp_table', 'recurrence', 'state_tracking'], evidence: ['cap-house-robber', 'd10-roll-robber-table'] },
        { label: 'cut the ring into two lines', skills: ['circular_split', 'slicing'], reps: ['b213-two-lines'] },
        { label: 'answer a ring of one before splitting', skills: ['circular_split', 'edge_cases'], reps: ['b213-dbg-single'] },
        { label: 'solve both lines and keep the better', skills: ['circular_split', 'state_tracking'], reps: ['b213-ring-mini'] },
      ],
    },
    {
      lc: 53,
      title: 'Maximum Subarray',
      unit: UNIT,
      section: 'br-53',
      mode: 'bridge-first',
      prerequisiteSkills: ['state_tracking', 'accumulator', 'kadane'],
      blocks: [
        { label: 'carry a best-so-far through one pass', skills: ['state_tracking'], evidence: ['cap-best-time-stock', 'd3-rs-largest'] },
        { label: 'extend the run or start fresh', skills: ['kadane'], reps: ['b53-trace-ending', 'b53-ending-sums'] },
        { label: 'start from the first value, not from zero', skills: ['kadane', 'edge_cases'], reps: ['b53-dbg-reset-zero'] },
        { label: 'track the best run ending anywhere', skills: ['kadane', 'state_tracking'], reps: ['b53-worst-stretch'] },
      ],
    },
    {
      lc: 55,
      title: 'Jump Game',
      unit: UNIT,
      section: 'br-55',
      mode: 'bridge-first',
      prerequisiteSkills: ['enumerate', 'state_tracking', 'early_return', 'greedy_reach'],
      blocks: [
        { label: 'keep one running best in a single pass', skills: ['state_tracking'], evidence: ['cap-best-time-stock'] },
        { label: 'push the farthest reach forward', skills: ['greedy_reach', 'enumerate'], reps: ['b55-farthest'] },
        { label: 'stop when the scan passes the reach', skills: ['greedy_reach', 'early_return'], reps: ['b55-dbg-no-stop', 'b55-first-unreachable'] },
      ],
    },
    {
      lc: 322,
      title: 'Coin Change',
      unit: UNIT,
      section: 'br-322',
      mode: 'bridge-first',
      prerequisiteSkills: ['dp_table', 'recurrence', 'range', 'dp_min_choice'],
      blocks: [
        { label: 'fill a table from smaller amounts', skills: ['dp_table', 'recurrence'], evidence: ['d10-bu-any-steps', 'cap-climbing-stairs'] },
        { label: 'mark which amounts can be made', skills: ['dp_table', 'dp_min_choice'], reps: ['b322-makeable'] },
        { label: 'keep the fewest over every choice', skills: ['dp_min_choice'], reps: ['b322-trace-inf', 'b322-fewest-each'] },
        { label: 'let infinity stand for cannot', skills: ['dp_min_choice', 'edge_cases'], reps: ['b322-dbg-zero-fill'] },
        { label: 'turn infinity into -1 at the end', skills: ['dp_min_choice', 'edge_cases'], reps: ['b322-cheapest-packs'] },
      ],
    },
    {
      lc: 139,
      title: 'Word Break',
      unit: UNIT,
      section: 'br-139',
      mode: 'bridge-first',
      prerequisiteSkills: ['dp_table', 'slicing', 'set_membership', 'dp_prefix_words'],
      blocks: [
        { label: 'fill a table from earlier entries', skills: ['dp_table', 'recurrence'], evidence: ['d10-bu-any-steps'] },
        { label: 'test the last piece against the word set', skills: ['slicing', 'set_membership', 'dp_prefix_words'], reps: ['b139-piece-starts'] },
        { label: 'fill a table over prefix lengths', skills: ['dp_prefix_words', 'dp_table'], reps: ['b139-trace-prefix', 'b139-prefix-table'] },
        { label: 'mark the empty prefix as done', skills: ['dp_prefix_words', 'edge_cases'], reps: ['b139-dbg-no-base'] },
        { label: 'join an earlier split to one last piece', skills: ['dp_prefix_words', 'slicing'], reps: ['b139-count-splits'] },
      ],
    },
    {
      lc: 300,
      title: 'Longest Increasing Subsequence',
      unit: UNIT,
      section: 'br-300',
      mode: 'bridge-first',
      prerequisiteSkills: ['dp_table', 'recurrence', 'range', 'dp_lookback'],
      blocks: [
        { label: 'define each entry as the best ending at that index', skills: ['dp_table', 'recurrence'], evidence: ['d10-roll-robber-table'] },
        { label: 'look back at every earlier index that fits', skills: ['dp_lookback'], reps: ['b300-best-before', 'b300-ending-lengths'] },
        { label: 'answer with the best entry, not the last', skills: ['dp_lookback', 'edge_cases'], reps: ['b300-dbg-last-entry', 'b300-rising-sum'] },
      ],
    },
    {
      lc: 5,
      title: 'Longest Palindromic Substring',
      unit: UNIT,
      section: 'br-5',
      mode: 'bridge-first',
      prerequisiteSkills: ['two_pointer', 'string_index', 'slicing', 'while_loop', 'expand_center'],
      blocks: [
        { label: 'compare two ends with two pointers', skills: ['two_pointer', 'string_index'], evidence: ['cap-valid-palindrome', 'd3-tp-palindrome-plain'] },
        { label: 'grow outward while the ends match', skills: ['expand_center', 'while_loop'], reps: ['b5-spread'] },
        { label: 'turn the stopped pointers into a slice', skills: ['expand_center', 'slicing'], reps: ['b5-dbg-slice'] },
        { label: 'try an odd and an even center', skills: ['expand_center'], reps: ['b5-both-centers', 'b5-count-mirrors'] },
      ],
    },
    {
      lc: 62,
      title: 'Unique Paths',
      unit: UNIT,
      section: 'br-62',
      mode: 'bridge-first',
      prerequisiteSkills: ['recurrence', 'grid_nested', 'dp_table', 'dp_grid'],
      blocks: [
        { label: 'count routes from the cell above and the cell to the left', skills: ['recurrence', 'memoization'], evidence: ['d10-rec-grid-paths', 'd10-memo-grid'] },
        { label: 'build a table of separate rows', skills: ['dp_grid', 'grid_nested'], reps: ['b62-border-ones', 'b62-dbg-alias'] },
        { label: 'fill each cell from above and left', skills: ['dp_grid'], reps: ['b62-fill-inside'] },
        { label: 'fill the edges first, then the inside', skills: ['dp_grid', 'grid_nested'], reps: ['b62-cheapest-walk'] },
      ],
    },
    {
      lc: 1143,
      title: 'Longest Common Subsequence',
      unit: UNIT,
      section: 'br-1143',
      mode: 'bridge-first',
      prerequisiteSkills: ['dp_grid', 'grid_nested', 'string_index', 'dp_two_sequences'],
      blocks: [
        { label: 'fill a grid from above and left', skills: ['dp_grid'], evidence: ['b62-fill-inside', 'b62-cheapest-walk'] },
        { label: 'pad the table by one row and one column', skills: ['dp_two_sequences', 'grid_nested'], reps: ['b1143-padded-table'] },
        { label: 'read each string one index behind the table', skills: ['dp_two_sequences', 'string_index'], reps: ['b1143-match-cells', 'b1143-dbg-index'] },
        { label: 'extend the diagonal on a match', skills: ['dp_two_sequences'], reps: ['b1143-common-run'] },
        { label: 'carry the better neighbour on a mismatch', skills: ['dp_two_sequences', 'dp_grid'], reps: ['b1143-min-deletions'] },
      ],
    },
    {
      lc: 91,
      title: 'Decode Ways',
      unit: UNIT,
      section: 'br-91',
      mode: 'bridge-first',
      prerequisiteSkills: ['dp_table', 'slicing', 'recurrence', 'dp_prefix_words'],
      blocks: [
        { label: 'count the ways over prefix lengths', skills: ['dp_prefix_words', 'dp_table'], evidence: ['b139-count-splits', 'b139-prefix-table'] },
        { label: 'add the counts from one back and two back', skills: ['recurrence', 'dp_table'], evidence: ['cap-climbing-stairs'] },
        { label: 'judge a one- or two-digit piece', skills: ['dp_prefix_words', 'string_index'], reps: ['b91-valid-piece'] },
        { label: 'reject a piece with a leading zero', skills: ['dp_prefix_words', 'edge_cases'], reps: ['b91-dbg-leading-zero'] },
        { label: 'sum the ways from both piece sizes', skills: ['dp_prefix_words', 'dp_table'], reps: ['b91-route-ways'] },
      ],
    },
  ],
  briefs: {
    // ── LC 213 ──
    'b213-two-lines': {
      inputs: [{ name: 'ring', is: 'a list of items arranged in a circle, so the first and the last are next to each other' }],
      returns: 'a **tuple of two lists**: everything except the first item, then everything except the last item.',
      catch: 'What do the two lists look like when the ring has only one item?',
    },
    'b213-dbg-single': {
      task: 'The split into two rows is right for most rings. Find the ring size it gets wrong.',
      inputs: [{ name: 'tips', is: 'a list of non-negative amounts, one per table, arranged in a circle' }],
      returns: 'a number: the largest total from tables where no two are neighbours (the first and last are neighbours).',
      catch: 'Try the smallest rings by hand: no tables, one table, two tables.',
    },
    'b213-ring-mini': {
      inputs: [{ name: 'yields', is: 'a list of non-negative numbers, one per field, in order around the pond' }],
      returns: 'a number: the largest total harvest when no two touching fields are both picked.',
      catch: 'The first and last fields touch. How is that different from a straight row, and for which ring size does your split leave nothing at all?',
    },
    // ── LC 53 ──
    'b53-trace-ending': {
      task: 'Read the code top to bottom and write exactly what it prints, one number per line.',
      catch: 'At each number ask: is the run so far worth keeping, or is this number better on its own?',
    },
    'b53-ending-sums': {
      inputs: [{ name: 'nums', is: 'a list of numbers; some can be negative, and the list can be empty' }],
      returns: 'a **list** as long as `nums`: for each index, the largest sum of a run of neighbours that finishes on that index.',
      catch: 'The run must include the number at that index, even when that number is negative.',
    },
    'b53-dbg-reset-zero': {
      task: 'It is right whenever some stretch has a positive total. Make it right when none does.',
      inputs: [{ name: 'changes', is: 'a non-empty list of numbers, one per day; they can all be negative' }],
      returns: 'a number: the largest total of any stretch of one or more days in a row.',
      catch: 'A stretch has at least one day. Which stretch would have a total of exactly zero?',
    },
    'b53-worst-stretch': {
      inputs: [{ name: 'changes', is: 'a non-empty list of numbers, one per hour; positive means warmer, negative means colder' }],
      returns: 'a number: the lowest total of any stretch of one or more hours in a row.',
      catch: 'When every change is positive, the answer is still one real hour, not zero.',
    },
    // ── LC 55 ──
    'b55-farthest': {
      inputs: [{ name: 'pads', is: 'a list of whole numbers: `pads[i]` is the longest hop allowed from pad `i`' }],
      returns: 'a number: the largest index any pad could send the frog to, or `0` for an empty row.',
      catch: 'The landing index depends on where the pad is as well as on its hop.',
    },
    'b55-dbg-no-stop': {
      task: 'It gives the right answer when the frog can cross the whole row. Make it right when the frog gets stuck.',
      inputs: [{ name: 'pads', is: 'a non-empty list of whole numbers: the longest hop allowed from each pad' }],
      returns: 'a number: the highest index the frog can actually stand on, starting from pad 0.',
      catch: 'A big hop on a pad the frog never reaches should count for nothing.',
    },
    'b55-first-unreachable': {
      inputs: [{ name: 'pads', is: 'a list of whole numbers: the longest hop allowed from each pad. The frog starts on pad 0.' }],
      returns: 'the index of the first pad the frog can never stand on, or `-1` when it can stand on all of them.',
      catch: 'Inside the loop, which comes first: checking this pad, or using its hop?',
    },
    // ── LC 322 ──
    'b322-makeable': {
      inputs: [
        { name: 'total', is: 'the number of litres wanted: a whole number, 0 or more' },
        { name: 'scoops', is: 'a list of scoop sizes (positive whole numbers); each can be used any number of times' },
      ],
      returns: '`True` if the scoops can add up to exactly `total`, otherwise `False`.',
      catch: 'How many entries does a table need to cover every amount from 0 up to and including `total`?',
    },
    'b322-trace-inf': {
      task: 'Read the code top to bottom and write exactly the list it prints.',
      catch: 'Python prints infinity as `inf`. What is infinity plus one?',
    },
    'b322-fewest-each': {
      inputs: [
        { name: 'total', is: 'the largest amount to answer for: a whole number, 0 or more' },
        { name: 'scoops', is: 'a list of scoop sizes (positive whole numbers); each can be used any number of times' },
      ],
      returns: 'a **list** of `total + 1` entries: entry `a` is the fewest scoops that make exactly `a`, or infinity when `a` cannot be made.',
      catch: 'Before the loops run, which amounts do you already know the answer for?',
    },
    'b322-dbg-zero-fill': {
      task: 'The loops are fine. Find out why no answer ever comes out above zero.',
      inputs: [
        { name: 'total', is: 'the value to reach: a whole number, 0 or more' },
        { name: 'stamps', is: 'a list of stamp values (positive whole numbers); each can be used any number of times' },
      ],
      returns: 'a number: the fewest stamps that add up to exactly `total`, or `-1` if it cannot be done.',
      catch: 'In this table, how do you tell "needs no stamps" apart from "not worked out yet"?',
    },
    'b322-cheapest-packs': {
      inputs: [
        { name: 'total', is: 'how many bolts are wanted: a whole number, 0 or more' },
        { name: 'packs', is: 'a list of `(size, price)` tuples: how many bolts a pack holds and what it costs. Any pack can be bought many times.' },
      ],
      returns: 'a number: the lowest total price for exactly `total` bolts, or `-1` if no mix of packs gives exactly that many.',
      catch: 'Each choice adds its own price, not 1. And what does the table hold for an amount no mix can reach?',
    },
    // ── LC 139 ──
    'b139-piece-starts': {
      inputs: [
        { name: 's', is: 'a string' },
        { name: 'i', is: 'a length: the pieces you look at all stop just before index `i`' },
        { name: 'words', is: 'a **set** of allowed strings' },
      ],
      returns: 'a **list** of start indexes, smallest first: every place a piece could begin so that the piece ending at `i` is an allowed word.',
      catch: 'When `i` is 0 there is no room for any piece.',
    },
    'b139-trace-prefix': {
      task: 'Read the code top to bottom and write exactly the list it prints.',
      catch: 'Entry `i` is about the first `i` characters. Fill it in by hand, one entry at a time, before you answer.',
    },
    'b139-prefix-table': {
      inputs: [
        { name: 's', is: 'the string to cut up' },
        { name: 'words', is: 'a **list** of allowed pieces; a piece can be used more than once' },
      ],
      returns: 'a **list of booleans**, one longer than `s`: entry `i` says whether the first `i` characters can be cut entirely into allowed pieces.',
      catch: 'The table has one more entry than the string has characters. What is entry 0 about?',
    },
    'b139-dbg-no-base': {
      task: 'It returns 0 for every input. Find what the table is missing.',
      inputs: [
        { name: 's', is: 'a string' },
        { name: 'words', is: 'a list of allowed pieces' },
      ],
      returns: 'a number: the length of the longest prefix of `s` that can be cut entirely into allowed pieces.',
      catch: 'Follow the very first piece through the condition. What does it need to find in the table?',
    },
    'b139-count-splits': {
      inputs: [
        { name: 's', is: 'the string to cut up; it can be empty' },
        { name: 'words', is: 'a list of allowed pieces; a piece can be used more than once' },
      ],
      returns: 'a number: how many different ways there are to cut all of `s` into allowed pieces.',
      catch: 'Counting, not yes or no. How many ways are there to cut up nothing at all?',
    },
    // ── LC 300 ──
    'b300-best-before': {
      inputs: [
        { name: 'nums', is: 'a list of numbers' },
        { name: 'dp', is: 'a list as long as `nums`; the entries before index `i` are already filled in with chain lengths' },
        { name: 'i', is: 'the index being worked on' },
      ],
      returns: 'a number: the biggest filled-in entry belonging to an earlier, strictly smaller number, or `0` if there is none.',
      catch: 'An equal number is not smaller.',
    },
    'b300-ending-lengths': {
      inputs: [{ name: 'nums', is: 'a list of numbers; it can be empty and can contain repeats' }],
      returns: 'a **list** as long as `nums`: for each index, the length of the longest rising chain that finishes on that number.',
      catch: 'The number just before index `i` is not the only one a chain could come from.',
    },
    'b300-dbg-last-entry': {
      task: 'The table is filled in correctly. The mistake is in how the answer is read from it.',
      inputs: [{ name: 'prices', is: 'a list of numbers in time order; it can be empty' }],
      returns: 'a number: the length of the longest chain of prices, picked left to right, where each is strictly lower than the one before.',
      catch: 'Does the longest chain have to finish on the final price?',
    },
    'b300-rising-sum': {
      inputs: [{ name: 'nums', is: 'a list of positive numbers; it can be empty' }],
      returns: 'a number: the largest total of numbers picked left to right so that each is strictly bigger than the one before.',
      catch: 'A longer pick is not always a heavier one, and the best pick can end anywhere.',
    },
    // ── LC 5 ──
    'b5-spread': {
      inputs: [
        { name: 's', is: 'a string' },
        { name: 'left', is: 'the index to start the left pointer on' },
        { name: 'right', is: 'the index to start the right pointer on: the same as `left`, or one more' },
      ],
      returns: 'a **string**: the piece of `s` that was covered while the two ends kept matching (possibly empty).',
      catch: 'When the loop ends, are the pointers on the last matching pair or just past it?',
    },
    'b5-dbg-slice': {
      task: 'The loop is right. The piece handed back is not.',
      inputs: [
        { name: 's', is: 'a non-empty string' },
        { name: 'i', is: 'the index of the middle character' },
      ],
      returns: 'a **string**: the longest piece that reads the same both ways with `s[i]` exactly in the middle.',
      catch: 'Write down the two pointer values at the moment the loop stops, then look at which characters the slice takes.',
    },
    'b5-both-centers': {
      inputs: [
        { name: 's', is: 'a non-empty string' },
        { name: 'i', is: 'an index into `s`' },
      ],
      returns: 'a **string**: the longer of the widest mirrored piece centred on `s[i]` and the widest one centred on the gap just after it.',
      catch: 'A piece like "abba" has no middle character. Where do the two pointers have to start to find it?',
    },
    'b5-count-mirrors': {
      inputs: [{ name: 's', is: 'a string; it can be empty' }],
      returns: 'a number: how many runs of neighbouring characters read the same both ways. Single characters count.',
      catch: 'There are two kinds of middle. If you only try one kind, which pieces do you miss?',
    },
    // ── LC 62 ──
    'b62-border-ones': {
      inputs: [
        { name: 'rows', is: 'how many rows the table has (at least 1)' },
        { name: 'cols', is: 'how many columns the table has (at least 1)' },
      ],
      returns: 'a **list of lists**: ones along the top row and the left column, zeros everywhere else.',
      catch: 'Each row must be a separate list. Change one cell and check that no other row changed.',
    },
    'b62-dbg-alias': {
      task: 'The two loops are right, yet the rows all come out the same. Find out why.',
      inputs: [
        { name: 'rows', is: 'how many rows the table has' },
        { name: 'cols', is: 'how many columns the table has' },
      ],
      returns: 'a **list of lists** where each cell holds its row index plus its column index.',
      catch: 'How many different row lists exist after the first line has run?',
    },
    'b62-fill-inside': {
      inputs: [{ name: 'table', is: 'a list of lists whose top row and left column are already filled in' }],
      returns: 'the same table, with every other cell set to the cell above it plus the cell to its left.',
      catch: 'Leave the top row and the left column exactly as they were.',
    },
    'b62-cheapest-walk': {
      inputs: [{ name: 'costs', is: 'a non-empty grid (list of lists) of non-negative numbers: the price of standing on each cell' }],
      returns: 'a number: the lowest total for a walk from the top-left cell to the bottom-right cell, stepping only right or down.',
      catch: 'A cell on the top row or the left column can only be entered one way. Do those need the same rule as the inside cells?',
    },
    // ── LC 1143 ──
    'b1143-padded-table': {
      inputs: [
        { name: 'a', is: 'the first string: it decides the number of rows' },
        { name: 'b', is: 'the second string: it decides the number of columns' },
      ],
      returns: 'a **list of lists** of zeros with one more row than `a` has characters and one more column than `b` has.',
      catch: 'The rows are numbered by prefix length: 0 characters, 1 character, and so on. How many lengths is that?',
    },
    'b1143-match-cells': {
      inputs: [
        { name: 'a', is: 'the first string (rows)' },
        { name: 'b', is: 'the second string (columns)' },
      ],
      returns: 'the padded table with a `1` wherever the row’s character and the column’s character are the same, and `0` elsewhere.',
      catch: 'Row 1 is about the first character. At which index of the string does the first character live?',
    },
    'b1143-common-run': {
      inputs: [
        { name: 'a', is: 'a string' },
        { name: 'b', is: 'another string' },
      ],
      returns: 'a number: the length of the longest unbroken stretch of characters found in both strings.',
      catch: 'When two characters match, which earlier cell tells you how long the run already was?',
    },
    'b1143-dbg-index': {
      task: 'It crashes. Find the line that reads the lists in the wrong place.',
      inputs: [
        { name: 'a', is: 'a list of songs' },
        { name: 'b', is: 'another list of songs' },
      ],
      returns: 'a number: the most songs that appear in both lists in the same order, with other songs allowed in between.',
      catch: 'The table has one more row than `a` has songs. What does that do to the indexes?',
    },
    'b1143-min-deletions': {
      inputs: [
        { name: 'a', is: 'a word; it can be empty' },
        { name: 'b', is: 'another word; it can be empty' },
      ],
      returns: 'a number: the fewest characters to delete, counted across both words, so that what is left of each is the same.',
      catch: 'Think about what is **kept** rather than what is deleted. What must be true of the kept characters?',
    },
    // ── LC 91 ──
    'b91-valid-piece': {
      inputs: [{ name: 'piece', is: 'a string of one or two digit characters, like `"7"` or `"06"`' }],
      returns: '`True` if the piece is a number from 1 to 26 written without a leading zero, otherwise `False`.',
      catch: 'After converting to a number, can you still tell whether the text began with a zero?',
    },
    'b91-dbg-leading-zero': {
      task: 'It counts some readings that are not allowed. Find which pieces slip through.',
      inputs: [{ name: 'digits', is: 'a string of digit characters; it can be empty' }],
      returns: 'a number: how many lists of month numbers (1 to 12, no leading zeros) could have been written as that string.',
      catch: 'Is "01" a month number written the way the rules say?',
    },
    'b91-route-ways': {
      inputs: [{ name: 'digits', is: 'a string of digit characters; it can be empty' }],
      returns: 'a number: how many lists of route numbers (1 to 35, no leading zeros) could have been written as that string.',
      catch: 'A zero can never stand alone and can never lead. What does that do to the count around it?',
    },
  },
  primers: [
    {
      id: 'circle-as-two-lines',
      title: 'A circle as two lines',
      skills: ['circular_split'],
      what: 'Some problems are easy on a straight row and awkward on a ring, because in a ring the **first and last items are neighbours**. When the rule is "neighbours cannot both be used", no answer ever uses both ends. So solve the row **without the first** item, solve the row **without the last** item, and keep the better result. Each of those is an ordinary straight row.',
      model: 'Cut the ring open twice, once on each side of the awkward join, and solve two plain rows.',
      syntax: [
        { code: 'without_first = ring[1:]', note: 'Everything from index 1 on.' },
        { code: 'without_last = ring[:-1]', note: 'Everything up to, not including, the last.' },
        { code: 'if len(ring) == 1:\n    return ring[0]', note: 'A ring of one: both slices are empty, so answer it directly.' },
        { code: 'max(line(ring[1:]), line(ring[:-1]))', note: 'Same row solver on both; keep the better.' },
      ],
      example: {
        code: `# Guests at a round table: nobody may sit next to another guest.
def line_seats(chairs):          # a straight bench: every other chair
    return (len(chairs) + 1) // 2

ring = ['a', 'b', 'c', 'd', 'e']
without_first = ring[1:]
without_last = ring[:-1]
print(without_first, line_seats(without_first))
print(without_last, line_seats(without_last))
print(max(line_seats(without_first), line_seats(without_last)))`,
        output: `['b', 'c', 'd', 'e'] 2
['a', 'b', 'c', 'd'] 2
2`,
      },
      gotchas: [
        'With exactly one item, `ring[1:]` and `ring[:-1]` are both `[]`, so the only item is never looked at. Handle that length first.',
        '`ring[1:-1]` drops BOTH ends at once. That is a different (and wrong) question.',
        'The two rows overlap in the middle. That is fine: you take the better of the two answers, you do not add them.',
        'Slicing copies the list. For interview sizes that is fine; say so if asked about space.',
      ],
    },
    {
      id: 'best-ending-here',
      title: 'Best ending here',
      skills: ['kadane'],
      what: 'For "best run of neighbours" questions, carry one number through a single pass: the best total of a run that **ends at the current item**. A run ending here is either the previous run with this item added, or a brand new run that starts here. Keep whichever is better, and separately remember the best value this number ever reached.',
      model: 'At every item, one decision: carry the run on, or drop it and start again from here.',
      syntax: [
        { code: 'here = nums[0]', note: 'Best run ending at the first item: just that item.' },
        { code: 'best = nums[0]', note: 'Best run seen anywhere so far.' },
        { code: 'for x in nums[1:]:', note: 'Every item after the first.' },
        { code: '    here = max(x, here + x)', note: 'Start fresh at x, or extend the run.' },
        { code: '    best = max(best, here)', note: 'The best run can end at any index.' },
      ],
      example: {
        code: `gains = [5, -7, 4, -1, 3]
here = gains[0]
for x in gains[1:]:
    if here + x > x:
        here = here + x
        print('extend', here)
    else:
        here = x
        print('fresh ', here)`,
        output: `extend -2
fresh  4
extend 3
extend 6`,
      },
      gotchas: [
        'Starting `here` and `best` at 0 (or resetting to 0) allows an empty run. When every number is negative the answer must still be a real item.',
        '`here` alone is not the answer: it is only the best run ending at the LAST item. Track `best` as well.',
        'Starting fresh means starting AT `x`, not at 0.',
        'The run must be neighbours with no gaps. Picking scattered items is a different problem.',
      ],
    },
    {
      id: 'farthest-reach',
      title: 'Farthest reach',
      skills: ['greedy_reach'],
      what: 'When each position lets you move forward by up to some distance, you do not need to try every route. Scan left to right keeping **one number**: the farthest position reachable so far. A position inside that reach can push it further; a position beyond it can never be stood on, and neither can anything after it.',
      model: 'A flood line moving right: each spot under water may push the line on, and the first dry spot ends it.',
      syntax: [
        { code: 'farthest = 0', note: 'You start at index 0, so 0 is reachable.' },
        { code: 'for i, hop in enumerate(hops):', note: 'Index and value together.' },
        { code: '    if i > farthest:', note: 'This index is beyond the reach: stop.' },
        { code: '    farthest = max(farthest, i + hop)', note: 'From i you can get as far as i + hop.' },
      ],
      example: {
        code: `# A hiker can walk 3 km on a full bottle. Springs refill it: km mark -> extra km.
springs = {2: 4, 5: 1, 9: 6}
reach = 3
for pos in sorted(springs):
    if pos > reach:
        print('cannot get to the spring at', pos)
        break
    reach = max(reach, pos + springs[pos])
    print('at', pos, 'reach is now', reach)`,
        output: `at 2 reach is now 6
at 5 reach is now 6
cannot get to the spring at 9`,
      },
      gotchas: [
        'Check that the position is reachable BEFORE using its hop. Otherwise a big hop on an unreachable spot rescues a route that does not exist.',
        'The reach is `i + hop` (an index), not `hop` on its own.',
        'Use `max`: a short hop must never pull the reach backwards.',
        'Landing exactly on the last index counts as reaching it: compare with `>=`, or use `i > farthest` to detect failure.',
      ],
    },
    {
      id: 'dp-min-over-choices',
      title: 'Min over choices',
      skills: ['dp_min_choice'],
      what: 'For "fewest steps to reach exactly a target" questions, let `dp[a]` be the fewest steps to reach amount `a`. The last step was one of a few **choices**; whichever it was, what came before is a smaller amount already solved. So `dp[a]` is one more than the smallest of those earlier entries. Amounts that cannot be reached hold **infinity**, which loses every `min` and survives `+ 1`.',
      model: 'To price a target, try every possible last move and build on the cheapest spot it could have come from.',
      syntax: [
        { code: "INF = float('inf')", note: 'Stands for "cannot be reached".' },
        { code: 'dp = [INF] * (total + 1)', note: 'One entry per amount, 0 through total.' },
        { code: 'dp[0] = 0', note: 'The one amount known up front.' },
        { code: 'for a in range(1, total + 1):', note: 'Small amounts first.' },
        { code: '    if c <= a:\n        dp[a] = min(dp[a], dp[a - c] + 1)', note: 'For each choice c that fits.' },
        { code: 'dp[total] if dp[total] != INF else -1', note: 'Translate "still infinity" at the end.' },
      ],
      example: {
        code: `# Start at 1. A move is "add 3" or "double". Fewest moves to each number?
INF = float('inf')
target = 10
dp = [INF] * (target + 1)
dp[1] = 0                      # already there
for a in range(2, target + 1):
    if a - 3 >= 1:
        dp[a] = min(dp[a], dp[a - 3] + 1)
    if a % 2 == 0:
        dp[a] = min(dp[a], dp[a // 2] + 1)
print(dp[1:])
print(dp[10] if dp[10] != INF else -1)`,
        output: `[0, 1, inf, 1, 2, inf, 2, 2, inf, 3]
3`,
      },
      gotchas: [
        'Filling the table with 0 makes every `min` return 0. Zero means "needs no steps"; unknown must be infinity.',
        'Forgetting `dp[0] = 0` leaves the whole table at infinity: nothing has a finished spot to build on.',
        'Skip a choice that is bigger than the amount, or `dp[a - c]` reads a negative index (the END of the list).',
        'Returning `dp[total]` without checking hands back `inf` instead of the "impossible" value the question asked for.',
      ],
    },
    {
      id: 'dp-look-back',
      title: 'Looking back at every earlier index',
      skills: ['dp_lookback'],
      what: 'In some tables an entry does not depend on the one or two entries before it, but on **any earlier entry that satisfies a condition**. Define `dp[i]` as the best answer for something that **ends at index i**, then for each `i` scan every `j < i`, and where the condition holds, try to build on `dp[j]`. That is two nested loops, O(n²). The final answer is the best entry anywhere, because the best result can end at any index.',
      model: 'Each item asks every earlier item: "may I come after you, and how good were you?"',
      syntax: [
        { code: 'dp = [1] * len(nums)', note: 'Each item alone is a result of size 1.' },
        { code: 'for i in range(len(nums)):', note: 'The index the result ends at.' },
        { code: '    for j in range(i):', note: 'Every earlier index.' },
        { code: '        if fits(nums[j], nums[i]):', note: 'May i come after j?' },
        { code: '            dp[i] = max(dp[i], dp[j] + 1)', note: 'Build on j if that beats what i has.' },
        { code: 'max(dp)', note: 'The answer: the best entry, wherever it is.' },
      ],
      example: {
        code: `# Longest chain where each number divides exactly into the next one picked
nums = [1, 2, 4, 8, 3, 9]
dp = [1] * len(nums)
for i in range(len(nums)):
    for j in range(i):
        if nums[i] % nums[j] == 0:
            dp[i] = max(dp[i], dp[j] + 1)
print(dp)
print(max(dp), dp[-1])`,
        output: `[1, 2, 3, 4, 2, 3]
4 3`,
      },
      gotchas: [
        'Returning `dp[-1]` answers "best ending at the last item", which is often not the best overall. Return `max(dp)`.',
        '`max(dp)` on an empty list raises. Handle empty input first.',
        'Looking only at `j = i - 1` misses chains that skip items.',
        'Check the condition between the VALUES (`nums[j]` and `nums[i]`), then build on the TABLE (`dp[j]`). Mixing them up is the usual slip.',
      ],
    },
    {
      id: 'dp-over-prefixes',
      title: 'DP over string prefixes',
      skills: ['dp_prefix_words'],
      what: 'To decide whether a string can be cut into valid pieces (or count the ways), let `dp[i]` answer the question for the **first i characters**. A prefix of length `i` ends with some last piece `s[j:i]`; if that piece is valid and the shorter prefix `dp[j]` already works, then `dp[i]` works too. `dp[0]` is the empty prefix: nothing left to cut, so it is `True` (or 1 way).',
      model: 'Stand at position i and look back: is there a good place j to make the last cut?',
      syntax: [
        { code: 'dp = [False] * (len(s) + 1)', note: 'One entry per prefix LENGTH, 0 through len(s).' },
        { code: 'dp[0] = True', note: 'The empty prefix.' },
        { code: 'for i in range(1, len(s) + 1):', note: 'Each longer prefix.' },
        { code: '    for j in range(i):', note: 'Every place the last piece could start.' },
        { code: '        if dp[j] and valid(s[j:i]):', note: 'Good prefix before, good piece after.' },
        { code: 'dp[i] += dp[j]', note: 'Counting form: start from 0, dp[0] = 1, add instead of set.' },
      ],
      example: {
        code: `# Can s be cut so every piece is a mirrored piece of length 2 or more?
s = 'abbacc'
n = len(s)
dp = [True] + [False] * n
for i in range(1, n + 1):
    for j in range(i):
        piece = s[j:i]
        if dp[j] and len(piece) >= 2 and piece == piece[::-1]:
            dp[i] = True
print(dp)`,
        output: `[True, False, False, False, True, False, True]`,
      },
      gotchas: [
        'Leaving out `dp[0] = True` makes every entry False: the first piece has nothing to stand on.',
        'The table has `len(s) + 1` entries. `dp[i]` is about `s[:i]`, and the piece is `s[j:i]` (not `s[j:i + 1]`).',
        'Put the words in a `set` first; `in` on a list is slow inside two loops.',
        'When pieces are digits, a leading zero hides once you call `int()`: `int("06")` is 6. Check the text.',
      ],
    },
    {
      id: 'expand-around-center',
      title: 'Expand around a center',
      skills: ['expand_center'],
      what: 'A palindrome is symmetric about its middle, so instead of testing every start and end, pick a **middle** and grow outward: move `left` down and `right` up while both are in bounds and the two characters match. A middle is either one character (odd length, start both pointers on `i`) or the gap between two characters (even length, start on `i` and `i + 1`). When the loop stops, both pointers are one step too far.',
      model: 'Put two fingers on the middle and slide them apart until the letters under them differ.',
      syntax: [
        { code: 'left, right = i, i', note: 'Odd center: a single middle character.' },
        { code: 'left, right = i, i + 1', note: 'Even center: the gap after index i.' },
        { code: 'while left >= 0 and right < len(s) and s[left] == s[right]:', note: 'Bounds first, then the comparison.' },
        { code: '    left -= 1\n    right += 1', note: 'Grow one step on each side.' },
        { code: 's[left + 1:right]', note: 'After the loop: the matched span.' },
        { code: 'right - left - 1', note: 'Its length.' },
      ],
      example: {
        code: `# Tiles laid in a row: how wide is the symmetric pattern around the middle tile?
tiles = [3, 1, 4, 7, 4, 1, 5]
left, right = 3, 3
while left >= 0 and right < len(tiles) and tiles[left] == tiles[right]:
    left -= 1
    right += 1
print(left, right)
print(tiles[left + 1:right])
print(right - left - 1)`,
        output: `0 6
[1, 4, 7, 4, 1]
5`,
      },
      gotchas: [
        'After the loop the pointers sit on the first pair that FAILED (or out of bounds). The span is `s[left + 1:right]`, not `s[left:right + 1]`.',
        'Trying only odd centers misses every even-length palindrome, like "abba".',
        'Test the bounds before `s[left] == s[right]`. A negative `left` does not crash, it silently reads from the end.',
        'For the even center at the last index, `right` starts out of bounds and the loop simply does not run. No special case needed.',
      ],
    },
    {
      id: 'dp-two-dimensions',
      title: '2-D DP tables',
      skills: ['dp_grid', 'dp_two_sequences'],
      what: 'When the state needs **two numbers** (a row and a column, or how much of each of two strings has been used), the table is a list of lists. Fill it row by row, left to right, so the cell **above** and the cell to the **left** are finished before you read them. For two sequences the table is padded: `len(a) + 1` rows and `len(b) + 1` columns, where row 0 and column 0 mean "none of that sequence yet", and cell `[i][j]` looks at `a[i - 1]` and `b[j - 1]`.',
      model: 'A spreadsheet filled top-left to bottom-right, every cell a formula of its upper and left neighbours.',
      syntax: [
        { code: 'dp = [[0] * cols for _ in range(rows)]', note: 'A fresh row list for every row.' },
        { code: 'dp[r - 1][c]', note: 'The cell above.' },
        { code: 'dp[r][c - 1]', note: 'The cell to the left.' },
        { code: 'dp[i - 1][j - 1]', note: 'The diagonal: one step back in both.' },
        { code: 'dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]', note: 'Two sequences: one extra row and column.' },
        { code: 'if a[i - 1] == b[j - 1]:', note: 'Table index i is string index i - 1.' },
        { code: 'dp[-1][-1]', note: 'The answer usually sits in the last cell.' },
      ],
      example: {
        code: `# Running totals: each cell = everything above and to the left of it, inclusive
sales = [[1, 2, 3],
         [4, 5, 6]]
rows, cols = len(sales), len(sales[0])
total = [[0] * cols for _ in range(rows)]
for r in range(rows):
    for c in range(cols):
        above = total[r - 1][c] if r > 0 else 0
        left = total[r][c - 1] if c > 0 else 0
        corner = total[r - 1][c - 1] if r > 0 and c > 0 else 0
        total[r][c] = sales[r][c] + above + left - corner
for row in total:
    print(row)`,
        output: `[1, 3, 6]
[5, 12, 21]`,
      },
      gotchas: [
        '`[[0] * cols] * rows` makes ONE row and repeats a reference to it. Writing one cell changes every row. Use the comprehension.',
        'On row 0 or column 0, `r - 1` or `c - 1` is `-1`, which silently reads the LAST row or column. Fill the edges separately, start the loops at 1, or pad the table.',
        'In a padded two-sequence table the loops run `1..len` inclusive and compare `a[i - 1]` with `b[j - 1]`. Using `a[i]` goes one past the end.',
        'It is `dp[row][col]`. Sizing the table as cols x rows only shows up as a bug when the two differ.',
      ],
    },
  ],
}
