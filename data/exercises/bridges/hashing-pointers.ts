import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { code, debug, output, write, t } from '@/data/exercises/build'

/**
 * Bridges for the Hashing unit (LC 49, 128, 238, 271) and the Strings + two
 * pointers unit (LC 11, 15). Each bridge teaches only the moves the pattern
 * ladder has not trained yet and ends on a miniature analogue of the target.
 */

const HASHING = '2026-10-02'
const POINTERS = '2026-10-03'

const sections: PackSection[] = [
  // ───────────────────────────────────────────── LC 49 Group Anagrams
  {
    id: 'br-49',
    module: HASHING,
    title: 'Toward Group Anagrams',
    summary: 'The grouping is already yours; the only new part is computing a key a dict will accept.',
    exercises: [
      debug({
        id: 'b49-dbg-list-key',
        title: 'Group numbers that share digits',
        skills: ['grouping_key', 'dict_membership', 'list_append', 'sorting'],
        note: '`str(321)` turns the number into the text `"321"`, so its digits can be handled like the letters of a word.',
        prompt:
          '`nums` is a list of whole numbers, none negative. `group_by_digits(nums)` should put numbers that are made of the same digits into one group, keeping the original order inside each group. The groups come out in the order their first number appears in `nums`.\n\n`group_by_digits([123, 45, 321, 54, 7])` → `[[123, 321], [45, 54], [7]]`\n\nIt crashes. Make it work.',
        brokenCode: `def group_by_digits(nums):
    groups = {}
    for n in nums:
        key = sorted(str(n))
        if key not in groups:
            groups[key] = []
        groups[key].append(n)
    return list(groups.values())`,
        solution: `def group_by_digits(nums):
    groups = {}
    for n in nums:
        key = ''.join(sorted(str(n)))
        if key not in groups:
            groups[key] = []
        groups[key].append(n)
    return list(groups.values())`,
        tests: [
          t.eq('group_by_digits([123, 45, 321, 54, 7])', '[[123, 321], [45, 54], [7]]'),
          t.eq('group_by_digits([])', '[]'),
          t.hidden('group_by_digits([10, 1, 100])', '[[10], [1], [100]]'),
          t.hidden('group_by_digits([22, 22])', '[[22, 22]]'),
          t.hidden('group_by_digits([908, 890, 89])', '[[908, 890], [89]]'),
        ],
        hints: ['Read the last line of the error. What type is `key`?', 'A dict key must be something that cannot change: a string or a tuple, never a list.'],
        explanation: '`sorted()` always hands back a list, and a list cannot be a dict key. Join it into a string or wrap it in `tuple()` and every number with the same digits lands on the same key.',
        signature: 'debug:group-key-unhashable',
        minutes: 3,
      }),
      write({
        id: 'b49-group-by-ends',
        title: 'Group words by both ends',
        skills: ['grouping_key', 'tuples', 'dict_membership', 'list_append'],
        transfer: true,
        stage: 'pattern',
        repType: 'pattern',
        difficulty: 3,
        prompt:
          '`words` is a list of non-empty words. A one-letter word starts and ends with that letter.\n\nWrite `group_by_ends(words)`: words that share **both** their first letter and their last letter go in the same group. Keep the original order inside each group; the groups come out in the order their first word appears in `words`. Return a list of groups (an empty list gives `[]`).\n\n`group_by_ends(["apple", "bob", "axle", "blob", "ant"])` → `[["apple", "axle"], ["bob", "blob"], ["ant"]]`',
        starterCode: `def group_by_ends(words):
    pass`,
        solution: `def group_by_ends(words):
    groups = {}
    for w in words:
        key = (w[0], w[-1])
        if key not in groups:
            groups[key] = []
        groups[key].append(w)
    return list(groups.values())`,
        tests: [
          t.eq('group_by_ends(["apple", "bob", "axle", "blob", "ant"])', '[["apple", "axle"], ["bob", "blob"], ["ant"]]'),
          t.eq('group_by_ends([])', '[]'),
          t.hidden('group_by_ends(["a", "aa", "ab"])', '[["a", "aa"], ["ab"]]'),
          t.hidden('group_by_ends(["on", "no"])', '[["on"], ["no"]]'),
          t.hidden('group_by_ends(["x", "x"])', '[["x", "x"]]'),
        ],
        hints: ['What single value is the same for every word in a group, and different for words in other groups?', 'Two facts can travel together as one key.', 'Then it is the grouping you know: new list on first sight, append every time, hand back the values.'],
        explanation: 'A tuple is a perfectly good dict key, so a key can carry two facts at once. Same grouping loop as always; only the key changed.',
        signature: 'group:tuple-key',
        minutes: 6,
        important: true,
      }),
    ],
  },

  // ───────────────────────────────────────────── LC 128 Longest Consecutive Sequence
  {
    id: 'br-128',
    module: HASHING,
    title: 'Toward Longest Consecutive Sequence',
    summary: 'Walk a run upward with while, find where runs begin, and only ever count from a beginning.',
    exercises: [
      output({
        id: 'b128-trace-extend',
        title: 'Trace: walking up a run',
        skills: ['sequence_start', 'while_loop', 'set_membership'],
        prompt: 'What does this print?',
        code: `nums = {4, 10, 5, 6, 11}
x = 4
length = 1
while x + 1 in nums:
    x += 1
    length += 1
print(x, length)`,
        expectedOutput: '6 3',
        note: '`while` keeps repeating its body for as long as the condition is true. Here the condition asks the set one question each time round: is the next number up present?',
        explanation: '5 is in the set, then 6 is, then 7 is not, so the loop stops with `x` on the last value of the run. 10 and 11 are never looked at.',
        signature: 'trace:while-extend-run',
        minutes: 1.5,
      }),
      write({
        id: 'b128-run-length',
        title: 'How long is the run from here',
        skills: ['sequence_start', 'while_loop', 'set_membership'],
        prompt:
          '`seen` is a set of whole numbers and `start` is one of them.\n\nWrite `run_length(seen, start)`: how many numbers are in the unbroken run `start, start + 1, start + 2, ...` that are all in `seen`.\n\n`run_length({4, 5, 6, 10}, 4)` → `3`',
        starterCode: `def run_length(seen, start):
    pass`,
        solution: `def run_length(seen, start):
    length = 1
    while start + length in seen:
        length += 1
    return length`,
        tests: [
          t.eq('run_length({4, 5, 6, 10}, 4)', '3'),
          t.eq('run_length({4, 5, 6, 10}, 10)', '1'),
          t.hidden('run_length({4, 5, 6, 10}, 5)', '2'),
          t.hidden('run_length({-2, -1, 0, 1}, -2)', '4'),
          t.hidden('run_length({7}, 7)', '1'),
        ],
        hints: ['`start` itself counts, so the length begins at 1.', 'Keep going while the next number up is in the set.'],
        explanation: 'Each trip round the loop is one O(1) set lookup, so measuring a run costs exactly its length.',
        signature: 'run:length-from-start',
        minutes: 4,
      }),
      write({
        id: 'b128-run-starts',
        title: 'Where do the runs begin',
        skills: ['sequence_start', 'set_create', 'set_membership', 'sorting'],
        prompt:
          '`nums` is a list of whole numbers in any order, possibly with repeats.\n\nA number **starts a run** when the number one below it is not in the list. Write `run_starts(nums)` returning every number that starts a run, smallest first, each one once.\n\n`run_starts([4, 10, 5, 6, 11])` → `[4, 10]`',
        starterCode: `def run_starts(nums):
    pass`,
        solution: `def run_starts(nums):
    seen = set(nums)
    starts = []
    for x in seen:
        if x - 1 not in seen:
            starts.append(x)
    return sorted(starts)`,
        tests: [
          t.eq('run_starts([4, 10, 5, 6, 11])', '[4, 10]'),
          t.eq('run_starts([])', '[]'),
          t.hidden('run_starts([1, 1, 2, 2])', '[1]'),
          t.hidden('run_starts([5, 3, 1])', '[1, 3, 5]'),
          t.hidden('run_starts([0, -1, -2])', '[-2]'),
          t.hidden('run_starts([9])', '[9]'),
        ],
        hints: ['Asking "is x - 1 present?" many times wants a set, not a list.', 'Loop over the set rather than the list and repeats take care of themselves.', 'Collect the ones whose lower neighbour is missing, then sort what you collected.'],
        explanation: 'One lookup per number tells you whether it is the bottom of a run. Looping over the set means a repeated value is asked about only once.',
        signature: 'run:find-starts',
        minutes: 5,
      }),
      debug({
        id: 'b128-dbg-every-number',
        title: 'One size per run',
        skills: ['sequence_start', 'while_loop', 'set_membership'],
        difficulty: 3,
        prompt:
          '`run_sizes(nums)` should return the size of every run of consecutive numbers in `nums`, smallest size first: **one** size per run.\n\n`run_sizes([4, 10, 5, 6, 11])` → `[2, 3]` (the run 10, 11 and the run 4, 5, 6)\n\nIt returns too many sizes. Fix it.',
        brokenCode: `def run_sizes(nums):
    seen = set(nums)
    sizes = []
    for x in seen:
        length = 1
        while x + length in seen:
            length += 1
        sizes.append(length)
    return sorted(sizes)`,
        solution: `def run_sizes(nums):
    seen = set(nums)
    sizes = []
    for x in seen:
        if x - 1 not in seen:
            length = 1
            while x + length in seen:
                length += 1
            sizes.append(length)
    return sorted(sizes)`,
        tests: [
          t.eq('run_sizes([4, 10, 5, 6, 11])', '[2, 3]'),
          t.eq('run_sizes([7])', '[1]'),
          t.hidden('run_sizes([])', '[]'),
          t.hidden('run_sizes([3, 2, 1, 2, 3])', '[3]'),
          t.hidden('run_sizes([1, 3, 5])', '[1, 1, 1]'),
          t.hidden('run_sizes([-1, 0, 8, 9, 10, 11])', '[2, 4]'),
        ],
        hints: ['Print `sizes` for the example. Which numbers produced the extra entries?', 'Measuring from 5 re-walks part of the run that 4 already covered.', 'Only measure from a number that begins a run.'],
        explanation: 'Without the start test every number measures the tail of its own run: wrong answers here, and O(n²) work on one long run. With it, each number is walked over once, so the whole thing is O(n).',
        signature: 'debug:run-count-from-every-number',
        minutes: 3.5,
      }),
      write({
        id: 'b128-long-streaks',
        title: 'Count the long streaks',
        skills: ['sequence_start', 'set_create', 'while_loop', 'accumulator'],
        transfer: true,
        stage: 'pattern',
        repType: 'pattern',
        difficulty: 3,
        prompt:
          '`days` lists the day numbers on which someone practised, in any order, possibly with repeats. A **streak** is a stretch of days in a row with none missing, as long as it can be.\n\nWrite `long_streaks(days, k)`: how many streaks are at least `k` days long. Do it without sorting.\n\n`long_streaks([4, 10, 5, 6, 11, 20], 2)` → `2` (4-5-6 and 10-11; day 20 alone is too short)',
        starterCode: `def long_streaks(days, k):
    pass`,
        solution: `def long_streaks(days, k):
    seen = set(days)
    count = 0
    for d in seen:
        if d - 1 not in seen:
            length = 1
            while d + length in seen:
                length += 1
            if length >= k:
                count += 1
    return count`,
        tests: [
          t.eq('long_streaks([4, 10, 5, 6, 11, 20], 2)', '2'),
          t.eq('long_streaks([4, 10, 5, 6, 11, 20], 3)', '1'),
          t.hidden('long_streaks([], 1)', '0'),
          t.hidden('long_streaks([8], 1)', '1'),
          t.hidden('long_streaks([3, 3, 4, 4, 5], 3)', '1'),
          t.hidden('long_streaks([1, 3, 5, 7], 2)', '0'),
          t.hidden('long_streaks([-1, 0, 1, 5, 6], 2)', '2'),
          t.hidden('long_streaks([2, 1, 4, 3], 5)', '0'),
        ],
        hints: ['Each streak must be counted once. What marks the one day in a streak you should count it from?', 'A set answers "did they practise on day d?" in one step.', 'For each day whose day-before is missing, walk upward to measure the streak, then compare it with `k`.'],
        explanation: 'Set, start test, while to measure: the three moves in a row. The inner while looks like a nested loop but only ever runs from a start, so every day is visited a constant number of times.',
        signature: 'run:count-long-runs',
        minutes: 9,
        important: true,
      }),
    ],
  },

  // ───────────────────────────────────────────── LC 238 Product of Array Except Self
  {
    id: 'br-238',
    module: HASHING,
    title: 'Toward Product of Array Except Self',
    summary: 'Record what came before each position, then what comes after, and combine the two in one list.',
    exercises: [
      write({
        id: 'b238-sums-before',
        title: 'The total before each position',
        skills: ['prefix_suffix', 'accumulator', 'list_append'],
        prompt:
          '`nums` is a list of numbers (it can be empty).\n\nWrite `sums_before(nums)`: a list the same length as `nums` where entry `i` is the sum of everything **before** position `i` (not including `nums[i]` itself).\n\n`sums_before([3, 1, 4])` → `[0, 3, 4]`',
        starterCode: `def sums_before(nums):
    pass`,
        solution: `def sums_before(nums):
    out = []
    running = 0
    for x in nums:
        out.append(running)
        running += x
    return out`,
        tests: [
          t.eq('sums_before([3, 1, 4])', '[0, 3, 4]'),
          t.eq('sums_before([])', '[]'),
          t.hidden('sums_before([5])', '[0]'),
          t.hidden('sums_before([2, 2, 2, 2])', '[0, 2, 4, 6]'),
          t.hidden('sums_before([-1, 4, -3])', '[0, -1, 3]'),
        ],
        hints: ['Keep one running total as you scan.', 'Two things happen per item: write the total down, and add the item in. The order of those two decides whether the item counts itself.'],
        explanation: 'Store first, then update: at the moment you store, the running total holds exactly the items to the left.',
        signature: 'prefix:sum-before',
        minutes: 5,
      }),
      debug({
        id: 'b238-dbg-products-before',
        title: 'The product before each position',
        skills: ['prefix_suffix', 'accumulator', 'list_append'],
        prompt:
          '`products_before(nums)` should return a list where entry `i` is everything **before** position `i` multiplied together. Nothing comes before position 0, and a product of nothing is `1`.\n\n`products_before([2, 3, 4])` → `[1, 2, 6]`\n\nFix it.',
        brokenCode: `def products_before(nums):
    out = []
    running = 1
    for x in nums:
        running *= x
        out.append(running)
    return out`,
        solution: `def products_before(nums):
    out = []
    running = 1
    for x in nums:
        out.append(running)
        running *= x
    return out`,
        tests: [
          t.eq('products_before([2, 3, 4])', '[1, 2, 6]'),
          t.eq('products_before([5])', '[1]'),
          t.hidden('products_before([])', '[]'),
          t.hidden('products_before([0, 7, 2])', '[1, 0, 0]'),
          t.hidden('products_before([-1, 2, -3])', '[1, -1, -2]'),
        ],
        hints: ['Compare what it returns with the example, entry by entry.', 'At the moment a value is written into `out`, which items has `running` already taken in?'],
        explanation: 'Same shape as the running sum, with two differences: it starts at 1 (the value that changes nothing when you multiply), and the store must still come before the update.',
        signature: 'debug:prefix-includes-self',
        minutes: 3,
      }),
      write({
        id: 'b238-products-after',
        title: 'The product after each position',
        skills: ['prefix_suffix', 'range', 'list_index', 'accumulator'],
        difficulty: 3,
        prompt:
          'Now from the other side. `nums` is a list of numbers. Write `products_after(nums)`: entry `i` is everything **after** position `i` multiplied together (`1` when nothing is after it).\n\n`products_after([2, 3, 4])` → `[12, 4, 1]`\n\nYou cannot append this time: the last entry is known first. Make the full-length list up front and fill it from the right.',
        starterCode: `def products_after(nums):
    pass`,
        solution: `def products_after(nums):
    out = [1] * len(nums)
    running = 1
    for i in range(len(nums) - 1, -1, -1):
        out[i] = running
        running *= nums[i]
    return out`,
        tests: [
          t.eq('products_after([2, 3, 4])', '[12, 4, 1]'),
          t.eq('products_after([5])', '[1]'),
          t.hidden('products_after([])', '[]'),
          t.hidden('products_after([7, 0, 2])', '[0, 2, 1]'),
          t.hidden('products_after([-1, 2, -3])', '[-6, -3, 1]'),
          t.hidden('products_after([1, 1, 1, 1])', '[1, 1, 1, 1]'),
        ],
        hints: ['`[1] * n` makes a list of n ones to write into.', '`range(start, stop, step)` can count down: begin at the last index, stop just past 0, step -1.', 'Inside the loop it is the same two lines as before, written with an index: store, then update.'],
        note: '`[1] * 4` makes `[1, 1, 1, 1]`: a list that already has its full length, ready to be written into by index. `range(n - 1, -1, -1)` gives `n - 1, n - 2, ..., 0`. The stop value is never produced, so stopping at `-1` is how you include index 0.',
        explanation: 'A suffix pass is a prefix pass walking the other way. Because you visit positions in reverse, you write by index into a list that already has its full length.',
        signature: 'suffix:product-after',
        minutes: 5.5,
      }),
      debug({
        id: 'b238-dbg-overwrite',
        title: 'The total of everything else',
        skills: ['prefix_suffix', 'list_index', 'range'],
        stage: 'combine',
        repType: 'combine',
        difficulty: 3,
        prompt:
          '`sum_of_others(nums)` should return a list where entry `i` is the sum of every value **except** `nums[i]`. It makes two passes over one list: first what is before each position, then what is after.\n\n`sum_of_others([3, 1, 4])` → `[5, 7, 4]`\n\nFix it without adding a third pass.',
        brokenCode: `def sum_of_others(nums):
    out = [0] * len(nums)
    running = 0
    for i in range(len(nums)):
        out[i] = running
        running += nums[i]
    running = 0
    for i in range(len(nums) - 1, -1, -1):
        out[i] = running
        running += nums[i]
    return out`,
        solution: `def sum_of_others(nums):
    out = [0] * len(nums)
    running = 0
    for i in range(len(nums)):
        out[i] = running
        running += nums[i]
    running = 0
    for i in range(len(nums) - 1, -1, -1):
        out[i] += running
        running += nums[i]
    return out`,
        tests: [
          t.eq('sum_of_others([3, 1, 4])', '[5, 7, 4]'),
          t.eq('sum_of_others([5, 5])', '[5, 5]'),
          t.hidden('sum_of_others([])', '[]'),
          t.hidden('sum_of_others([9])', '[0]'),
          t.hidden('sum_of_others([-2, 2, 6, 0])', '[8, 4, 0, 6]'),
        ],
        hints: ['After the first pass `out` is correct for "before". What is in it after the second pass?', 'The second pass should fold its value into what is already stored there.'],
        explanation: 'Everything except position i is the part before it plus the part after it. The second pass must combine with the first pass’s answer, not replace it. With sums you could also subtract from a grand total; that shortcut does not exist for every operation, which is why the two-pass shape is worth owning.',
        signature: 'debug:suffix-pass-overwrites',
        minutes: 3.5,
      }),
      write({
        id: 'b238-best-rival',
        title: 'The best of everyone else',
        skills: ['prefix_suffix', 'state_tracking', 'range', 'list_index'],
        transfer: true,
        note: '`float(\'-inf\')` is a value lower than every number. It is a safe thing to compare against before any real value has been seen, even when the values are negative.',
        stage: 'pattern',
        repType: 'pattern',
        difficulty: 3,
        prompt:
          '`scores` holds one score per player (at least two players).\n\nWrite `best_rival(scores)`: a list where entry `i` is the highest score among all the **other** players, leaving out player `i`. The list can be long: do not rescan it for every player.\n\n`best_rival([3, 9, 4, 7])` → `[9, 7, 9, 9]`',
        starterCode: `def best_rival(scores):
    pass`,
        solution: `def best_rival(scores):
    out = []
    best = float('-inf')
    for s in scores:
        out.append(best)
        best = max(best, s)
    best = float('-inf')
    for i in range(len(scores) - 1, -1, -1):
        out[i] = max(out[i], best)
        best = max(best, scores[i])
    return out`,
        tests: [
          t.eq('best_rival([3, 9, 4, 7])', '[9, 7, 9, 9]'),
          t.eq('best_rival([5, 2])', '[2, 5]'),
          t.hidden('best_rival([4, 4])', '[4, 4]'),
          t.hidden('best_rival([8, 8, 1])', '[8, 8, 8]'),
          t.hidden('best_rival([-5, -2, -9])', '[-2, -5, -2]'),
          t.hidden('best_rival([1, 2, 3, 4, 5])', '[5, 5, 5, 5, 4]'),
          t.hidden('best_rival([6, 1, 1, 1])', '[1, 6, 6, 6]'),
        ],
        hints: ['The other players are the ones to the left plus the ones to the right.', 'First pass: the best score to the left of each player. What is a safe "best so far" before anyone has been seen?', 'Second pass, right to left: combine the best to the right with what the first pass stored.'],
        explanation: 'There is no way to "take one score back out" of a maximum, so this cannot be done from a single grand total. Before-pass, after-pass, combine: O(n) time and nothing to undo.',
        signature: 'prefix-suffix:max-of-others',
        minutes: 9,
        important: true,
      }),
    ],
  },

  // ───────────────────────────────────────────── LC 271 Encode and Decode Strings
  {
    id: 'br-271',
    module: HASHING,
    title: 'Toward Encode and Decode Strings',
    summary: 'Why a separator is not enough, then write each length in front of its text and read it back.',
    exercises: [
      code({
        id: 'b271-break-join',
        title: 'Break the comma trick',
        skills: ['string_framing', 'string_methods', 'edge_cases'],
        note: '`\',\'.join(words)` glues the strings into one string with a comma between each pair. `text.split(\',\')` cuts a string at every comma and returns the list of pieces.',
        style: 'write-test',
        stage: 'debug',
        prompt:
          '`round_trip` glues a list of strings together with commas and splits it apart again. It looks like you always get the same list back:\n\n`round_trip(["ab", "c"])` → `["ab", "c"]`\n\nMake `breaking_input()` return a list of strings for which `round_trip` does **not** hand back the list it was given.',
        starterCode: `def round_trip(words):
    return ','.join(words).split(',')

def breaking_input():
    pass`,
        solution: `def round_trip(words):
    return ','.join(words).split(',')

def breaking_input():
    return ['a,b', 'c']`,
        tests: [
          t.check('breaking_input() returns a list of strings', "words = breaking_input()\nassert isinstance(words, list) and all(isinstance(w, str) for w in words), 'return a list of strings'"),
          t.check('the list does not survive the round trip', "words = breaking_input()\nassert isinstance(words, list) and all(isinstance(w, str) for w in words), 'return a list of strings'\nassert round_trip(words) != words, 'that list came back unchanged'", true),
        ],
        hints: ['The splitter cannot tell a comma you added from a comma that was already there.', 'What if one of the strings contains the separator?'],
        explanation: 'Any character you choose as a separator can also turn up inside the text, and then the split lands in the wrong place. (The empty list breaks too: it comes back as one empty string.) The cure is to say how long each piece is instead of marking where it ends.',
        signature: 'write-test:delimiter-collision',
        minutes: 2.5,
      }),
      write({
        id: 'b271-pack',
        title: 'Length, marker, text',
        skills: ['string_framing', 'string_methods', 'len', 'for_loop'],
        prompt:
          '`words` is a list of strings; any of them can be empty.\n\nWrite `pack(words)`: one string holding every word, each written as its length, then `#`, then the word itself, with nothing in between.\n\n`pack(["cat", "hi"])` → `"3#cat2#hi"`\n\nAn empty word is still written, as `0#`. An empty list gives `""`.',
        starterCode: `def pack(words):
    pass`,
        solution: `def pack(words):
    out = ''
    for w in words:
        out += str(len(w)) + '#' + w
    return out`,
        tests: [
          t.eq('pack(["cat", "hi"])', '"3#cat2#hi"'),
          t.eq('pack([])', '""'),
          t.hidden('pack([""])', '"0#"'),
          t.hidden('pack(["a#b", "7"])', '"3#a#b1#7"'),
          t.hidden('pack(["hello world!"])', '"12#hello world!"'),
          t.hidden('pack(["", ""])', '"0#0#"'),
        ],
        hints: ['A number cannot be glued to a string directly; turn it into text first.', 'Build the result up piece by piece: length, marker, word.'],
        explanation: 'The word may contain anything, even `#` or digits. That is fine: a reader that knows the length never has to look inside the word to find where it ends.',
        signature: 'frame:length-marker-text',
        minutes: 4,
      }),
      write({
        id: 'b271-read-one',
        title: 'Read one item back',
        skills: ['string_framing', 'slicing', 'while_loop', 'tuples'],
        difficulty: 3,
        prompt:
          '`data` is a packed string like `"3#cat2#hi"` and `i` is the index where one item begins (the first digit of its length).\n\nWrite `read_one(data, i)` returning a tuple `(text, next_i)`: the item’s text, and the index just past it, where the next item would begin.\n\n`read_one("3#cat2#hi", 0)` → `("cat", 5)`\n`read_one("3#cat2#hi", 5)` → `("hi", 9)`\n\nA length can have more than one digit.',
        starterCode: `def read_one(data, i):
    pass`,
        solution: `def read_one(data, i):
    j = i
    while data[j] != '#':
        j += 1
    length = int(data[i:j])
    start = j + 1
    return (data[start:start + length], start + length)`,
        tests: [
          t.eq('read_one("3#cat2#hi", 0)', '("cat", 5)'),
          t.eq('read_one("3#cat2#hi", 5)', '("hi", 9)'),
          t.hidden('read_one("0#", 0)', '("", 2)'),
          t.hidden('read_one("12#hello world!", 0)', '("hello world!", 15)'),
          t.hidden('read_one("3#a#b1#7", 0)', '("a#b", 5)'),
          t.hidden('read_one("3#a#b1#7", 5)', '("7", 8)'),
        ],
        hints: ['Three steps: find the marker, turn the digits before it into a number, take that many characters after it.', 'Walk a second index forward from `i` until it sits on the `#`.', 'The digits are the slice between the two indexes; the text starts one past the marker.'],
        note: '`s[a:b]` is the characters from index `a` up to but not including `b`, so `s[a:a + n]` is exactly `n` characters. `int("12")` turns digit text into the number 12.',
        explanation: 'Only the first `#` after `i` is a marker. Everything after it is counted, not searched, so a `#` inside the text is never mistaken for one.',
        signature: 'frame:read-length-slice-advance',
        minutes: 6,
      }),
      debug({
        id: 'b271-dbg-one-digit',
        title: 'Unpack every item',
        skills: ['string_framing', 'slicing', 'while_loop', 'list_append'],
        stage: 'combine',
        repType: 'combine',
        difficulty: 3,
        prompt:
          '`unpack(data)` should turn a packed string back into the list of its items.\n\n`unpack("3#cat2#hi")` → `["cat", "hi"]`\n`unpack("11#hello world2#hi")` → `["hello world", "hi"]`\n\nIt works on the first example only. Fix it.',
        brokenCode: `def unpack(data):
    out = []
    i = 0
    while i < len(data):
        length = int(data[i])
        start = i + 2
        out.append(data[start:start + length])
        i = start + length
    return out`,
        solution: `def unpack(data):
    out = []
    i = 0
    while i < len(data):
        j = i
        while data[j] != '#':
            j += 1
        length = int(data[i:j])
        start = j + 1
        out.append(data[start:start + length])
        i = start + length
    return out`,
        tests: [
          t.eq('unpack("3#cat2#hi")', '["cat", "hi"]'),
          t.eq('unpack("11#hello world2#hi")', '["hello world", "hi"]'),
          t.hidden('unpack("")', '[]'),
          t.hidden('unpack("0#0#")', '["", ""]'),
          t.hidden('unpack("3#a#b1#7")', '["a#b", "7"]'),
          t.hidden('unpack("10#0123456789")', '["0123456789"]'),
        ],
        hints: ['What is different about the item that goes wrong?', 'How many characters of the length does it read?', 'Find the marker first; the length is everything between `i` and the marker.'],
        explanation: 'Assuming a one-digit length works until a string reaches 10 characters. Reading up to the marker handles any length; then slice, then jump `i` to the start of the next item.',
        signature: 'debug:frame-single-digit-length',
        minutes: 6,
      }),
      write({
        id: 'b271-count-items',
        title: 'How many items are packed',
        skills: ['string_framing', 'slicing', 'while_loop', 'accumulator'],
        transfer: true,
        stage: 'pattern',
        repType: 'pattern',
        difficulty: 3,
        prompt:
          '`data` is a packed string: each item is written as its length, `#`, then its text. The texts can contain anything, including `#` and digits.\n\nWrite `count_items(data)`: how many items it holds. Only the count is wanted, not the items. An empty string holds `0` items.\n\n`count_items("3#cat2#hi")` → `2`\n`count_items("3#a#b1#7")` → `2`',
        starterCode: `def count_items(data):
    pass`,
        solution: `def count_items(data):
    count = 0
    i = 0
    while i < len(data):
        j = i
        while data[j] != '#':
            j += 1
        i = j + 1 + int(data[i:j])
        count += 1
    return count`,
        tests: [
          t.eq('count_items("3#cat2#hi")', '2'),
          t.eq('count_items("3#a#b1#7")', '2'),
          t.hidden('count_items("")', '0'),
          t.hidden('count_items("0#")', '1'),
          t.hidden('count_items("0#0#0#")', '3'),
          t.hidden('count_items("11#hello#world")', '1'),
          t.hidden('count_items("5#1#2#31#x")', '2'),
        ],
        hints: ['Counting the `#` characters is not safe. Why not?', 'Stand on the first digit of an item. Where does the next item begin?', 'Read the length up to the marker, then jump past the marker and that many characters. Count one per jump.'],
        explanation: 'The length tells you how far to jump, so the text is never inspected and nothing inside it can fool you. That jump is the whole of decoding; collecting the slices is the only thing left to add.',
        signature: 'frame:hop-and-count',
        minutes: 8,
        important: true,
      }),
    ],
  },

  // ───────────────────────────────────────────── LC 11 Container With Most Water
  {
    id: 'br-11',
    module: POINTERS,
    title: 'Toward Container With Most Water',
    summary: 'Measure the area between two indexes, decide which end to give up, and keep the best.',
    exercises: [
      write({
        id: 'b11-area',
        title: 'Area between two walls',
        skills: ['two_pointer', 'list_index', 'functions'],
        prompt:
          '`heights` holds the heights of walls standing one unit apart. `left` and `right` are the indexes of two of them, and `left < right`.\n\nWrite `area(heights, left, right)`. Return the area of the rectangle that fits between those two walls. Its width is the distance between the two indexes. Its height is the **shorter** of the two walls.\n\n`area([2, 5, 3, 6], 0, 3)` → `6` (width 3, height 2)\n`area([1, 8, 8, 1], 0, 3)` → `3` (the tall walls in between do not count)',
        starterCode: `def area(heights, left, right):
    pass`,
        solution: `def area(heights, left, right):
    width = right - left
    return width * min(heights[left], heights[right])`,
        tests: [
          t.eq('area([2, 5, 3, 6], 0, 3)', '6'),
          t.eq('area([2, 5, 3, 6], 1, 3)', '10'),
          t.hidden('area([4, 4], 0, 1)', '4'),
          t.hidden('area([0, 9, 9], 0, 2)', '0'),
          t.hidden('area([7, 1, 1, 1, 3], 0, 4)', '12'),
        ],
        hints: ['The width comes from the two indexes, not from the heights.', 'The walls in between do not matter. Only the two ends do, and the lower one sets the height.'],
        explanation: 'Width is a difference of indexes; height is limited by the lower end. Everything else about the problem is choosing which pairs to measure.',
        signature: 'area:width-times-shorter',
        minutes: 3,
      }),
      debug({
        id: 'b11-dbg-move-taller',
        title: 'Walk inward, giving up the shorter wall',
        skills: ['pointer_update', 'two_pointer', 'list_append'],
        difficulty: 3,
        prompt:
          '`walk_in(heights)` starts with the two outermost walls and steps inward until the indexes meet. At each step it records the area between the current pair, then moves the index standing at the **shorter** wall one step toward the other (on a tie, the right one moves). It returns the areas in the order they were measured.\n\n`walk_in([2, 5, 3, 6])` → `[6, 10, 3]`\n\nFix it.',
        brokenCode: `def walk_in(heights):
    areas = []
    left, right = 0, len(heights) - 1
    while left < right:
        width = right - left
        areas.append(width * min(heights[left], heights[right]))
        if heights[left] > heights[right]:
            left += 1
        else:
            right -= 1
    return areas`,
        solution: `def walk_in(heights):
    areas = []
    left, right = 0, len(heights) - 1
    while left < right:
        width = right - left
        areas.append(width * min(heights[left], heights[right]))
        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1
    return areas`,
        tests: [
          t.eq('walk_in([2, 5, 3, 6])', '[6, 10, 3]'),
          t.eq('walk_in([4, 1])', '[1]'),
          t.hidden('walk_in([])', '[]'),
          t.hidden('walk_in([7])', '[]'),
          t.hidden('walk_in([3, 3, 3])', '[6, 3]'),
          t.hidden('walk_in([1, 2, 3, 4])', '[3, 4, 3]'),
          t.hidden('walk_in([6, 1, 1, 2])', '[6, 2, 1]'),
        ],
        hints: ['Trace the example by hand: after the first area, which wall should be given up?', 'Which index does the code actually move when the left wall is the shorter one?'],
        explanation: 'Stepping inward always costs width. Keeping the shorter wall means the height can never rise above it, so every pair that still uses it is worse than the one just measured. Giving up the shorter wall is the only move that can lead to something bigger.',
        signature: 'debug:container-moves-taller-side',
        minutes: 3.5,
      }),
      write({
        id: 'b11-best-banner',
        title: 'The biggest banner',
        skills: ['two_pointer', 'pointer_update', 'state_tracking'],
        transfer: true,
        stage: 'pattern',
        repType: 'pattern',
        difficulty: 3,
        prompt:
          '`posts` holds the heights of fence posts standing one metre apart. You hang a rectangular banner between two posts. It is as wide as the gap between them and as tall as the **shorter** of the two.\n\nWrite `best_banner(posts)`. Return the largest banner area any two posts allow. With fewer than two posts, return `0`. Use one pass, with no nested loop.\n\n`best_banner([2, 5, 3, 6])` → `10` (the posts of height 5 and 6, two metres apart)\n`best_banner([9])` → `0` (one post, so no banner)',
        starterCode: `def best_banner(posts):
    pass`,
        solution: `def best_banner(posts):
    left, right = 0, len(posts) - 1
    best = 0
    while left < right:
        size = (right - left) * min(posts[left], posts[right])
        best = max(best, size)
        if posts[left] < posts[right]:
            left += 1
        else:
            right -= 1
    return best`,
        tests: [
          t.eq('best_banner([2, 5, 3, 6])', '10'),
          t.eq('best_banner([4, 1])', '1'),
          t.hidden('best_banner([])', '0'),
          t.hidden('best_banner([9])', '0'),
          t.hidden('best_banner([3, 3, 3])', '6'),
          t.hidden('best_banner([1, 2, 3, 4, 5])', '6'),
          t.hidden('best_banner([5, 4, 3, 2, 1])', '6'),
          t.hidden('best_banner([1, 9, 9, 1])', '9'),
          t.hidden('best_banner([6, 1, 1, 1, 1, 6])', '30'),
          t.hidden('best_banner([0, 0, 0])', '0'),
        ],
        hints: ['Start with the widest pair there is.', 'Every step inward loses width, so the step has to give the height a chance to grow. Which post is holding the height down?', 'Measure, keep the best so far, then move the index at the shorter post.'],
        explanation: 'Three moves you already own, in one loop: measure between two indexes, track the best, advance exactly one pointer chosen by a comparison. O(n) time, O(1) space.',
        signature: 'two-pointer:max-area-shorter-side',
        minutes: 8,
        important: true,
      }),
    ],
  },

  // ───────────────────────────────────────────── LC 15 3Sum
  {
    id: 'br-15',
    module: POINTERS,
    title: 'Toward 3Sum',
    summary: 'Sorted input puts equal values side by side: step past them so each answer is produced once.',
    exercises: [
      write({
        id: 'b15-next-different',
        title: 'Step past the repeats',
        skills: ['sorted_dedupe', 'while_loop', 'list_index'],
        prompt:
          '`nums` is sorted, so equal values sit next to each other. `i` is a valid index.\n\nWrite `next_different(nums, i)`. Start just after `i` and walk right. Return the first index whose value is different from `nums[i]`. If you reach the end first, return `len(nums)`.\n\n`next_different([1, 1, 1, 4, 4, 6], 0)` → `3`\n`next_different([2, 2, 2], 0)` → `3` (every value matches, so you reach the end)',
        starterCode: `def next_different(nums, i):
    pass`,
        solution: `def next_different(nums, i):
    j = i + 1
    while j < len(nums) and nums[j] == nums[i]:
        j += 1
    return j`,
        tests: [
          t.eq('next_different([1, 1, 1, 4, 4, 6], 0)', '3'),
          t.eq('next_different([1, 1, 1, 4, 4, 6], 3)', '5'),
          t.hidden('next_different([1, 1, 1, 4, 4, 6], 5)', '6'),
          t.hidden('next_different([2, 2, 2], 0)', '3'),
          t.hidden('next_different([2, 2, 2], 1)', '3'),
          t.hidden('next_different([-3, 0], 0)', '1'),
          t.hidden('next_different([8], 0)', '1'),
        ],
        hints: ['Walk a second index forward while it still sees the same value.', 'The walk can run off the end. Which of the two conditions has to be asked first?'],
        explanation: 'The bounds test goes first in the `and`: Python stops at the first false part, so `nums[j]` is never read once `j` has left the list.',
        signature: 'dedupe:while-skip-equal',
        minutes: 4,
      }),
      write({
        id: 'b15-distinct-sorted',
        title: 'Each value once, by sorting',
        skills: ['sorted_dedupe', 'sorting', 'range', 'list_append'],
        prompt:
          '`nums` is a list of numbers in any order, possibly empty.\n\nWrite `distinct_sorted(nums)`. Return each different value in `nums` once, smallest first.\n\nSort first, then compare each value with the one just before it. Do not use a set this time.\n\n`distinct_sorted([4, 1, 4, 1, 1, 6])` → `[1, 4, 6]`\n`distinct_sorted([])` → `[]`',
        starterCode: `def distinct_sorted(nums):
    pass`,
        solution: `def distinct_sorted(nums):
    nums = sorted(nums)
    out = []
    for i in range(len(nums)):
        if i == 0 or nums[i] != nums[i - 1]:
            out.append(nums[i])
    return out`,
        tests: [
          t.eq('distinct_sorted([4, 1, 4, 1, 1, 6])', '[1, 4, 6]'),
          t.eq('distinct_sorted([])', '[]'),
          t.hidden('distinct_sorted([7])', '[7]'),
          t.hidden('distinct_sorted([5, 5, 5])', '[5]'),
          t.hidden('distinct_sorted([3, 2, 1])', '[1, 2, 3]'),
          t.hidden('distinct_sorted([-1, 2, -1, 2, -1])', '[-1, 2]'),
          t.hidden('distinct_sorted([0, 9, 0])', '[0, 9]'),
        ],
        hints: ['After sorting, a repeat is always right next to its twin.', 'A value is new when it differs from the one before it. Which position has nothing before it?'],
        explanation: 'In sorted order, "have I used this value already?" becomes "is it the same as my left neighbour?": no set needed. The very first position has no left neighbour and is always new.',
        signature: 'dedupe:compare-with-previous',
        minutes: 5,
      }),
      debug({
        id: 'b15-dbg-first-index',
        title: 'Where each value begins',
        skills: ['sorted_dedupe', 'range', 'list_index'],
        prompt:
          '`nums` is sorted. `group_starts(nums)` should return the index where each different value first appears.\n\n`group_starts([2, 2, 5, 5, 5, 9])` → `[0, 2, 5]`\n`group_starts([4, 4, 4])` → `[0]`\n\nIt gets the first example right and the second wrong. Fix it.',
        brokenCode: `def group_starts(nums):
    starts = []
    for i in range(len(nums)):
        if nums[i] == nums[i - 1]:
            continue
        starts.append(i)
    return starts`,
        solution: `def group_starts(nums):
    starts = []
    for i in range(len(nums)):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        starts.append(i)
    return starts`,
        tests: [
          t.eq('group_starts([2, 2, 5, 5, 5, 9])', '[0, 2, 5]'),
          t.eq('group_starts([4, 4, 4])', '[0]'),
          t.hidden('group_starts([])', '[]'),
          t.hidden('group_starts([7])', '[0]'),
          t.hidden('group_starts([1, 2, 3])', '[0, 1, 2]'),
          t.hidden('group_starts([-2, -2, 0, 0])', '[0, 2]'),
          t.hidden('group_starts([3, 8, 8, 3])', '[0, 1, 3]'),
        ],
        hints: ['`continue` jumps straight to the next trip round the loop.', 'When `i` is 0, which element does `nums[i - 1]` read?'],
        note: '`continue` skips the rest of the loop body for this item and moves on to the next one.',
        explanation: 'At index 0, `nums[-1]` is the **last** element, so the first value gets skipped whenever it equals the last one. `i > 0 and ...` is the guard: the first position is never a repeat.',
        signature: 'debug:dedupe-missing-first-guard',
        minutes: 3,
      }),
      write({
        id: 'b15-unique-pairs',
        title: 'Every different pair, once',
        skills: ['sorted_dedupe', 'two_pointer', 'pointer_update', 'list_append'],
        stage: 'combine',
        repType: 'combine',
        difficulty: 4,
        prompt:
          '`nums` is sorted and may contain repeats.\n\nWrite `unique_pairs(nums, target)`. Return every **different** pair of values `[a, b]` that adds up to `target`. The two values come from two different positions, and `a <= b`. List each pair once, smallest `a` first.\n\n`unique_pairs([1, 1, 2, 3, 4, 4], 5)` → `[[1, 4], [2, 3]]`\n`unique_pairs([2, 2, 2, 2], 4)` → `[[2, 2]]` (many matches, but one pair)\n\nThis is the two-pointer pair search on a sorted list. Start at both ends. If the sum is too small, move `left`. If it is too big, move `right`. The new part: after a hit, keep going, and never report the same pair twice.',
        starterCode: `def unique_pairs(nums, target):
    pass`,
        solution: `def unique_pairs(nums, target):
    out = []
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total < target:
            left += 1
        elif total > target:
            right -= 1
        else:
            out.append([nums[left], nums[right]])
            left += 1
            right -= 1
            while left < right and nums[left] == nums[left - 1]:
                left += 1
    return out`,
        tests: [
          t.eq('unique_pairs([1, 1, 2, 3, 4, 4], 5)', '[[1, 4], [2, 3]]'),
          t.eq('unique_pairs([2, 2, 2, 2], 4)', '[[2, 2]]'),
          t.hidden('unique_pairs([], 3)', '[]'),
          t.hidden('unique_pairs([5], 5)', '[]'),
          t.hidden('unique_pairs([1, 2, 3], 10)', '[]'),
          t.hidden('unique_pairs([-2, -2, 0, 2, 2], 0)', '[[-2, 2]]'),
          t.hidden('unique_pairs([-3, -1, 0, 1, 3], 0)', '[[-3, 3], [-1, 1]]'),
          t.hidden('unique_pairs([1, 1, 1, 3, 3], 4)', '[[1, 3]]'),
          t.hidden('unique_pairs([0, 0, 0], 0)', '[[0, 0]]'),
          t.hidden('unique_pairs([1, 2, 2, 3], 4)', '[[1, 3], [2, 2]]'),
        ],
        hints: [
          'Too small moves the left pointer, too big moves the right: that part has not changed.',
          'After a hit both values are used up, so both pointers move. What if the new left value is the same as the one just used?',
          'After moving both, keep stepping `left` while it equals the value behind it.',
          'That inner walk needs the same `left < right` guard as the outer loop, or it can run off the end.',
        ],
        explanation: 'Skipping repeats on one side after a hit is enough: once the left value is new, the old right value cannot complete it. The skip compares with the value **behind** the pointer, the one just used.',
        signature: 'sorted-pair:unique-pairs-skip',
        minutes: 11,
        important: true,
      }),
      write({
        id: 'b15-count-baskets',
        title: 'Three prices, one gift card',
        skills: ['sorted_dedupe', 'two_pointer', 'sorting', 'pointer_update'],
        transfer: true,
        stage: 'pattern',
        repType: 'pattern',
        difficulty: 4,
        prompt:
          'A shop has one of each item on a shelf. `prices` lists their prices in any order, and prices can repeat. A gift card is worth exactly `budget`.\n\nWrite `count_baskets(prices, budget)`. A basket is three different items whose prices add up to exactly `budget`. Return how many **different** baskets there are. Two baskets with the same three prices count once.\n\n`count_baskets([3, 1, 4, 1, 6, 2], 9)` → `2` (1 + 2 + 6, whichever 1 you use, and 2 + 3 + 4)\n`count_baskets([4, 6], 10)` → `0` (fewer than three items)',
        starterCode: `def count_baskets(prices, budget):
    pass`,
        solution: `def count_baskets(prices, budget):
    prices = sorted(prices)
    count = 0
    for i in range(len(prices) - 2):
        if i > 0 and prices[i] == prices[i - 1]:
            continue
        left, right = i + 1, len(prices) - 1
        while left < right:
            total = prices[i] + prices[left] + prices[right]
            if total < budget:
                left += 1
            elif total > budget:
                right -= 1
            else:
                count += 1
                left += 1
                right -= 1
                while left < right and prices[left] == prices[left - 1]:
                    left += 1
    return count`,
        tests: [
          t.eq('count_baskets([3, 1, 4, 1, 6, 2], 9)', '2'),
          t.eq('count_baskets([1, 1, 1, 1], 3)', '1'),
          t.hidden('count_baskets([], 0)', '0'),
          t.hidden('count_baskets([4, 6], 10)', '0'),
          t.hidden('count_baskets([1, 2, 3], 7)', '0'),
          t.hidden('count_baskets([3, 3, 3], 9)', '1'),
          t.hidden('count_baskets([1, 2, 3, 4, 5], 9)', '2'),
          t.hidden('count_baskets([2, 2, 2, 2, 4, 4], 8)', '1'),
          t.hidden('count_baskets([-2, 0, 2, -2, 4, -2], 0)', '2'),
          t.hidden('count_baskets([2, 5, 3, 2, 5, 4], 10)', '1'),
          t.hidden('count_baskets([5, 1, 5, 1, 5, 1], 11)', '1'),
          t.hidden('count_baskets([1, 1, 2, 2, 3, 3, 2], 6)', '2'),
        ],
        hints: [
          'Choose the first price; the other two must add up to what is left. You have already written that search.',
          'Sort once at the top. Then for each index `i`, run the pair search on everything to its right.',
          'Two places can produce the same basket twice: the same first price chosen again, and the same pair found again after a hit.',
          'Skip `i` when it equals the price before it (never at `i == 0`); after a hit, move both pointers and step `left` past its repeats.',
        ],
        explanation: 'Sort, fix one index, pair-search the rest, and skip equal neighbours in both places. O(n²) time. Collecting the three values instead of counting them is the only change the full problem asks for.',
        signature: 'sorted-triple:count-unique',
        minutes: 15,
        important: true,
      }),
    ],
  },
]

export const pack: Pack = {
  sections,
  bridges: [
    {
      lc: 49,
      title: 'Group Anagrams',
      unit: 'Hashing',
      section: 'br-49',
      mode: 'attempt-first',
      prerequisiteSkills: ['dict_membership', 'list_append', 'sorting', 'grouping_key'],
      blocks: [
        { label: 'collect items under a key in a dict of lists', skills: ['dict_membership', 'list_append'], evidence: ['o2-dl-group-len'] },
        { label: 'turn each item into a key a dict accepts', skills: ['grouping_key', 'sorting'], reps: ['b49-dbg-list-key'], evidence: ['o2-dl-lc-group-anagrams'] },
        { label: 'group by a computed key and hand back the groups', skills: ['grouping_key', 'tuples'], reps: ['b49-group-by-ends'] },
      ],
    },
    {
      lc: 128,
      title: 'Longest Consecutive Sequence',
      unit: 'Hashing',
      section: 'br-128',
      mode: 'bridge-first',
      prerequisiteSkills: ['set_create', 'set_membership', 'while_loop', 'sequence_start'],
      blocks: [
        { label: 'put the numbers in a set', skills: ['set_create', 'set_membership'], evidence: ['o2-comp-set-code'] },
        { label: 'extend a run and measure it', skills: ['sequence_start', 'while_loop'], reps: ['b128-trace-extend', 'b128-run-length'] },
        { label: 'spot where a run starts', skills: ['sequence_start', 'set_membership'], reps: ['b128-run-starts'] },
        { label: 'only count from starts', skills: ['sequence_start'], reps: ['b128-dbg-every-number', 'b128-long-streaks'] },
      ],
    },
    {
      lc: 238,
      title: 'Product of Array Except Self',
      unit: 'Hashing',
      section: 'br-238',
      mode: 'bridge-first',
      prerequisiteSkills: ['accumulator', 'list_index', 'range', 'prefix_suffix'],
      blocks: [
        { label: 'carry a running total through a scan', skills: ['accumulator'], evidence: ['o2-dl-sum-values'] },
        { label: 'record what came before each position', skills: ['prefix_suffix', 'accumulator'], reps: ['b238-sums-before', 'b238-dbg-products-before'] },
        { label: 'walk from the right for what comes after', skills: ['prefix_suffix', 'range'], reps: ['b238-products-after'] },
        { label: 'combine both sides without overwriting', skills: ['prefix_suffix', 'list_index'], reps: ['b238-dbg-overwrite', 'b238-best-rival'] },
      ],
    },
    {
      lc: 271,
      title: 'Encode and Decode Strings',
      unit: 'Hashing',
      section: 'br-271',
      mode: 'bridge-first',
      prerequisiteSkills: ['string_methods', 'slicing', 'while_loop', 'string_framing'],
      blocks: [
        { label: 'see why a plain separator breaks', skills: ['string_framing', 'string_methods'], reps: ['b271-break-join'] },
        { label: 'write each item as length, marker, text', skills: ['string_framing', 'string_methods'], reps: ['b271-pack'] },
        { label: 'read a length up to the marker, slice, advance', skills: ['string_framing', 'slicing'], reps: ['b271-read-one'] },
        { label: 'hop through the whole string item by item', skills: ['string_framing', 'while_loop'], reps: ['b271-dbg-one-digit', 'b271-count-items'] },
      ],
    },
    {
      lc: 11,
      title: 'Container With Most Water',
      unit: 'Strings + two pointers',
      section: 'br-11',
      mode: 'bridge-first',
      prerequisiteSkills: ['two_pointer', 'pointer_update', 'state_tracking'],
      blocks: [
        { label: 'start at both ends and walk inward', skills: ['two_pointer'], evidence: ['cap-two-sum-ii', 'd3-pu-has-pair'] },
        { label: 'measure the area between two indexes', skills: ['two_pointer', 'list_index'], reps: ['b11-area'] },
        { label: 'move the shorter side', skills: ['pointer_update'], reps: ['b11-dbg-move-taller'] },
        { label: 'track the best area seen', skills: ['state_tracking', 'pointer_update'], reps: ['b11-best-banner'], evidence: ['cap-best-time-stock'] },
      ],
    },
    {
      lc: 15,
      title: '3Sum',
      unit: 'Strings + two pointers',
      section: 'br-15',
      mode: 'bridge-first',
      prerequisiteSkills: ['sorting', 'two_pointer', 'pointer_update', 'sorted_dedupe'],
      blocks: [
        { label: 'sort, fix one index and pair-search the rest', skills: ['sorting', 'two_pointer', 'pointer_update'], evidence: ['cap-two-sum-ii', 'd3-tsii-triplet'] },
        { label: 'step past equal neighbours', skills: ['sorted_dedupe'], reps: ['b15-next-different', 'b15-distinct-sorted'] },
        { label: 'skip a repeated fixed value safely', skills: ['sorted_dedupe'], reps: ['b15-dbg-first-index'] },
        { label: 'skip repeats after a hit', skills: ['sorted_dedupe', 'two_pointer'], reps: ['b15-unique-pairs'] },
        { label: 'count each triple once', skills: ['sorted_dedupe', 'two_pointer', 'sorting'], reps: ['b15-count-baskets'] },
      ],
    },
  ],
  briefs: {
    // ── LC 49 ────────────────────────────────────────────────────────────────
    'b49-dbg-list-key': {
      task: 'The grouping loop is fine. Make it run without crashing and return the groups.',
      inputs: [{ name: 'nums', is: 'a list of whole numbers, zero or more, none negative' }],
      returns: 'a **list of groups**. Each group is a list of the numbers that use exactly the same digits (the same digits the same number of times).',
      catch: 'Run it and read the error message. What kinds of value is a dict willing to use as a key?',
    },
    'b49-group-by-ends': {
      inputs: [{ name: 'words', is: 'a list of words. Every word has at least one letter; a one-letter word starts and ends with that letter.' }],
      returns: 'a **list of groups** (each a list of words). Two words share a group only when their first letters match **and** their last letters match.',
      catch: 'The key has to hold two facts at once. Is "starts with a, ends with e" the same key as "starts with e, ends with a"?',
    },

    // ── LC 128 ───────────────────────────────────────────────────────────────
    'b128-trace-extend': {
      task: 'Read the code top to bottom and write exactly what it prints.',
      catch: 'Each time round, ask the set the question in the `while` line. Stop the first time the answer is no.',
    },
    'b128-run-length': {
      inputs: [
        { name: 'seen', is: 'a set of whole numbers' },
        { name: 'start', is: 'one of the numbers in the set: the bottom of the run you are measuring' },
      ],
      returns: 'a number: how many values are in the unbroken run going **up** from `start`, counting `start` itself.',
      catch: 'Numbers below `start` are not your business here. What is the smallest answer this can ever give?',
    },
    'b128-run-starts': {
      inputs: [{ name: 'nums', is: 'a list of whole numbers in any order. It can be empty and can repeat values.' }],
      returns: 'a **sorted list** of the numbers that begin a run: the ones whose one-below neighbour is nowhere in the list. Each appears once.',
      catch: 'A number standing alone is a run of one, so it is a start too. And a repeated value should be reported once.',
    },
    'b128-dbg-every-number': {
      task: 'It should produce one size for each run. Make it stop producing extra ones.',
      inputs: [{ name: 'nums', is: 'a list of whole numbers in any order, possibly with repeats' }],
      returns: 'a **sorted list** of run sizes, one entry per run of consecutive values.',
      catch: 'For the example, write down which number each size in the wrong answer was measured from.',
    },
    'b128-long-streaks': {
      inputs: [
        { name: 'days', is: 'a list of day numbers (whole numbers, can be negative), in any order, possibly repeated' },
        { name: 'k', is: 'the smallest length that counts as a long streak (1 or more)' },
      ],
      returns: 'a number: how many separate streaks are `k` days or longer.',
      catch: 'A streak of 5 is one streak, not five. From which single day should each streak be measured?',
    },

    // ── LC 238 ───────────────────────────────────────────────────────────────
    'b238-sums-before': {
      inputs: [{ name: 'nums', is: 'a list of numbers (can be empty, can hold negatives)' }],
      returns: 'a list of the same length. Entry `i` is the total of the items to the **left** of position `i`.',
      catch: 'Entry 0 has nothing to its left. And should an item be part of its own entry?',
    },
    'b238-dbg-products-before': {
      task: 'Every entry should be the product of the items strictly to its left. Fix the one thing that is off.',
      inputs: [{ name: 'nums', is: 'a list of numbers (can be empty, can hold zeros and negatives)' }],
      returns: 'a list of the same length. Entry `i` is the items before position `i` multiplied together; entry 0 is `1`.',
      catch: 'Line the wrong answer up against the right one. Each entry is off by exactly one item: which?',
    },
    'b238-products-after': {
      inputs: [{ name: 'nums', is: 'a list of numbers (can be empty, can hold zeros and negatives)' }],
      returns: 'a list of the same length. Entry `i` is the items to the **right** of position `i` multiplied together; the last entry is `1`.',
      catch: 'The entry you know first is the last one. Can you append in that order, or does the list need its full length before you start?',
    },
    'b238-dbg-overwrite': {
      task: 'Two passes fill one list: the left side, then the right side. Make the final list hold both.',
      inputs: [{ name: 'nums', is: 'a list of numbers (can be empty)' }],
      returns: 'a list of the same length. Entry `i` is the total of every item except the one at position `i`.',
      catch: 'Print `out` between the two loops, then again at the end. What happened to the first pass’s work?',
    },
    'b238-best-rival': {
      inputs: [{ name: 'scores', is: 'a list of at least two numbers, one per player. Scores can repeat and can be negative.' }],
      returns: 'a list of the same length. Entry `i` is the highest score among everyone **except** player `i`.',
      catch: 'If the top score appears twice, each of those two players has the other as a rival. Does your "best so far" start low enough for negative scores?',
    },

    // ── LC 271 ───────────────────────────────────────────────────────────────
    'b271-break-join': {
      task: 'Find a list of strings that does not come back the same after being joined with commas and split again. Return it from `breaking_input`.',
      returns: 'a **list of strings** of your choosing for which `round_trip` gives back a different list.',
      catch: 'The split has no idea which commas were put there by the join.',
    },
    'b271-pack': {
      inputs: [{ name: 'words', is: 'a list of strings. A string can be empty and can contain any characters, including `#` and digits.' }],
      returns: 'one string: for each item its length as digits, then `#`, then the item, all run together. An empty list gives an empty string.',
      catch: 'An empty string still has to leave a trace, or it would vanish when the string is read back.',
    },
    'b271-read-one': {
      inputs: [
        { name: 'data', is: 'a packed string: each item is its length, then `#`, then its text' },
        { name: 'i', is: 'the index in `data` where one item begins (the first digit of its length)' },
      ],
      returns: 'a **tuple** of two things: the text of that item, and the index just after it.',
      catch: 'The text itself may contain `#`. Which `#` is the marker, and how do you know where the text stops?',
    },
    'b271-dbg-one-digit': {
      task: 'It unpacks short items correctly. Make it unpack items of any length.',
      inputs: [{ name: 'data', is: 'a packed string: each item is its length, then `#`, then its text. Can be empty.' }],
      returns: 'the **list** of item texts, in order.',
      catch: 'Compare the two examples. What is true of the item it gets wrong that is not true of the others?',
    },
    'b271-count-items': {
      inputs: [{ name: 'data', is: 'a packed string: each item is its length, then `#`, then its text. Can be empty. Texts can contain `#` and digits.' }],
      returns: 'a number: how many items are packed inside.',
      catch: 'A `#` inside a text is not a marker, and an item of length 0 is still an item.',
    },

    // ── LC 11 ────────────────────────────────────────────────────────────────
    'b11-area': {
      inputs: [
        { name: 'heights', is: 'a list of wall heights (zero or more each); neighbours are one unit apart' },
        { name: 'left', is: 'the index of one wall' },
        { name: 'right', is: 'the index of another wall, further along than `left`' },
      ],
      returns: 'a number: width times height of the rectangle between those two walls.',
      catch: 'A rectangle between a wall of 2 and a wall of 6 is only 2 high. And the width is about positions, not heights.',
    },
    'b11-dbg-move-taller': {
      task: 'It should step inward by giving up the shorter wall each time. Make the areas come out in the stated order.',
      inputs: [{ name: 'heights', is: 'a list of wall heights (can be empty or a single wall)' }],
      returns: 'a **list** of the areas measured, one per step, until the two indexes meet.',
      catch: 'Trace the example on paper for two steps and compare with what the code does on the very first move.',
    },
    'b11-best-banner': {
      inputs: [{ name: 'posts', is: 'a list of post heights (zero or more each), one metre apart. Can be empty or hold a single post.' }],
      returns: 'a number: the largest width × height any pair of posts allows, or `0` if no pair exists.',
      catch: 'The two tallest posts are not always the answer, and neither is the widest pair. After measuring a pair, which post is it pointless to keep?',
    },

    // ── LC 15 ────────────────────────────────────────────────────────────────
    'b15-next-different': {
      inputs: [
        { name: 'nums', is: 'a **sorted** list of numbers, at least one long' },
        { name: 'i', is: 'a valid index into `nums`' },
      ],
      returns: 'an index: the first position after `i` holding a different value, or the length of the list when everything after `i` is the same value.',
      catch: 'When the repeats run to the end of the list, what stops your loop before it reads past the last item?',
    },
    'b15-distinct-sorted': {
      inputs: [{ name: 'nums', is: 'a list of numbers in any order, possibly with repeats, possibly empty' }],
      returns: 'a **new sorted list** holding each different value once.',
      catch: 'The first item has no item before it. What does index `-1` mean in Python?',
    },
    'b15-dbg-first-index': {
      task: 'It should report the index where each new value begins. Make it right for every sorted list.',
      inputs: [{ name: 'nums', is: 'a **sorted** list of numbers (can be empty)' }],
      returns: 'a list of indexes: the first position of each different value, in order.',
      catch: 'Follow the very first trip round the loop on the failing example. Which two elements get compared?',
    },
    'b15-unique-pairs': {
      inputs: [
        { name: 'nums', is: 'a **sorted** list of numbers, possibly with repeats, possibly empty' },
        { name: 'target', is: 'the sum a pair must reach' },
      ],
      returns: 'a **list of pairs** `[a, b]` with `a <= b`, each different pair of values once. The two values must come from two different positions.',
      catch: '`[2, 2]` is a valid pair when the list holds two 2s. After a hit, how do you avoid landing on the same pair again without running off the list?',
    },
    'b15-count-baskets': {
      inputs: [
        { name: 'prices', is: 'a list of whole-number prices in any order, possibly repeated, possibly empty. Each entry is one item.' },
        { name: 'budget', is: 'the exact total three prices must add up to' },
      ],
      returns: 'a number: how many different sets of three prices reach `budget`. The same three prices in another order, or built from other copies, count once.',
      catch: 'The same price can be used twice only if two items carry it. There are two separate places where a repeat could make you count a basket twice: where?',
    },
  },
  primers: [
    {
      id: 'grouping-key',
      title: 'Grouping by a computed key',
      skills: ['grouping_key'],
      what: 'To put things that "belong together" in the same pile, compute a **key** from each item so that items in the same pile get the same key, then collect them in a dict of lists under that key. The key must be **hashable**: a string, a number or a tuple, never a list.',
      model: 'Each item fills in a label; items with identical labels go in the same box.',
      syntax: [
        { code: 'groups = {}', note: 'key → list of the items with that key.' },
        { code: "key = ''.join(sorted(word))", note: 'A string key: the letters in order.' },
        { code: 'key = tuple(sorted(nums))', note: 'A tuple key: a list frozen so a dict accepts it.' },
        { code: 'key = (a, b)', note: 'Two facts in one key.' },
        { code: 'if key not in groups:\n    groups[key] = []', note: 'First time this key is seen: start its list.' },
        { code: 'groups[key].append(item)', note: 'Every time: add the item to its list.' },
        { code: 'list(groups.values())', note: 'Just the piles, in the order their keys first appeared.' },
      ],
      example: {
        code: `nums = [12, 7, 22, 17, 5]
by_last = {}
for n in nums:
    key = n % 10             # the last digit
    if key not in by_last:
        by_last[key] = []
    by_last[key].append(n)
print(by_last)
print(list(by_last.values()))

print(''.join(sorted('pots')))
print(tuple(sorted([3, 1, 2])))`,
        output: `{2: [12, 22], 7: [7, 17], 5: [5]}
[[12, 22], [7, 17], [5]]
opst
(1, 2, 3)`,
      },
      gotchas: [
        '`sorted(...)` always returns a **list**, even for a string. Using it directly as a key raises `TypeError: unhashable type: \'list\'`.',
        'The key must be identical for everything in a group. If order should not matter, sort before making the key.',
        '`groups[key].append(x)` on a key that is not there yet raises `KeyError`. Create the empty list first.',
        '`groups.values()` is a view, not a list. Wrap it in `list(...)` when a list is asked for.',
      ],
    },
    {
      id: 'run-starts',
      title: 'Runs of consecutive numbers',
      skills: ['sequence_start'],
      what: 'To find stretches of consecutive numbers (5, 6, 7) in unsorted data without sorting, put everything in a **set**. A value `x` **starts** a run when `x - 1` is not in the set. From a start, walk upward with `while` for as long as the next number is present. Because you only walk from starts, each value is stepped over once: O(n) overall.',
      model: 'Find the first domino of each row, then count along the row. Never start counting from the middle.',
      syntax: [
        { code: 'seen = set(nums)', note: 'O(1) "is this number present?", and repeats disappear.' },
        { code: 'if x - 1 not in seen:', note: 'Nothing just below x: x begins a run.' },
        { code: 'length = 1', note: 'The start itself counts.' },
        { code: 'while x + length in seen:\n    length += 1', note: 'Extend while the next number up exists.' },
        { code: 'for x in seen:', note: 'Loop over the set, so a repeated value is handled once.' },
      ],
      example: {
        code: `taken = {3, 4, 5, 9, 12, 13}     # seat numbers
print(3 - 1 in taken)   # is there a seat just below 3?
print(4 - 1 in taken)   # and just below 4?

seat = 3
while seat + 1 in taken:
    seat += 1
print(seat)             # where the block that starts at 3 ends`,
        output: `False
True
5`,
      },
      gotchas: [
        'Measuring from every number instead of only from starts re-walks the same run again and again: O(n²) on one long run.',
        'The start test looks **down** (`x - 1`); the extension looks **up** (`x + 1`). Mixing the two directions gives runs of length 1.',
        'A `while` loop needs something to change each time round. Forget the `+= 1` and it never ends.',
        'Use the set for the membership questions, not the list: `in` on a list is O(n).',
      ],
    },
    {
      id: 'prefix-suffix',
      title: 'Prefix and suffix passes',
      skills: ['prefix_suffix'],
      what: 'When every position needs a summary of **everything else**, split "everything else" into what is to the left and what is to the right. One left-to-right pass carries a running value and records, at each position, what came **before** it. A second pass from the right does the same for what comes **after**. Combining the two gives the answer for every position in O(n), with no nested loop.',
      model: 'Walk the row once carrying a tally and leave a note at each seat before adding that seat in; then walk back and do the same.',
      syntax: [
        { code: 'running = 0', note: 'Start with the value that changes nothing: 0 for a sum, 1 for a product.' },
        { code: 'out.append(running)\nrunning += x', note: 'Store first, then update: the item is not part of its own entry.' },
        { code: 'out = [0] * len(nums)', note: 'A full-length list to write into by index.' },
        { code: 'for i in range(len(nums) - 1, -1, -1):', note: 'Indexes from the last one down to 0.' },
        { code: 'out[i] = running', note: 'First pass: record.' },
        { code: 'out[i] += running', note: 'Second pass: combine with what is already there.' },
      ],
      example: {
        code: `rain = [True, False, True, True]

before = []
count = 0
for wet in rain:
    before.append(count)     # store first: today is not counted
    if wet:
        count += 1
print(before)                # rainy days before each day

after = [0] * len(rain)
count = 0
for i in range(len(rain) - 1, -1, -1):
    after[i] = count
    if rain[i]:
        count += 1
print(after)                 # rainy days after each day`,
        output: `[0, 1, 1, 2]
[2, 2, 1, 0]`,
      },
      gotchas: [
        'Update-then-store includes the item in its own entry. Store, **then** update.',
        'A running product must start at `1`. Starting at `0` makes everything zero.',
        '`range(n - 1, 0, -1)` stops before index 0. The stop has to be `-1`.',
        'In the second pass, `out[i] = ...` throws away the first pass. Combine with it instead.',
        'Dividing a grand total by the item fails as soon as an item is zero, and has no equivalent for max or min. Two passes always work.',
      ],
    },
    {
      id: 'string-framing',
      title: 'Length-prefixed strings',
      skills: ['string_framing'],
      what: 'To pack several strings into one so they can be pulled apart again **whatever they contain**, a separator is not enough: the separator can also appear inside the text. Instead write each string as its **length**, a **marker** character, then the text. The reader finds the marker, reads the number before it, and takes exactly that many characters. It never searches inside the text, so nothing in the text can confuse it.',
      model: 'A label on each parcel saying how long it is, so you cut by measuring, not by looking for the join.',
      syntax: [
        { code: "str(len(s)) + '#' + s", note: 'Write: length, marker, text.' },
        { code: "while data[j] != '#':\n    j += 1", note: 'Read: walk from the item’s first digit to the marker.' },
        { code: 'length = int(data[i:j])', note: 'The digits between the start and the marker, as a number.' },
        { code: 'text = data[j + 1:j + 1 + length]', note: 'Exactly `length` characters after the marker.' },
        { code: 'i = j + 1 + length', note: 'Jump to where the next item begins.' },
      ],
      example: {
        code: `print('a,b'.split(','))      # a separator inside the text splits it

note = 'a,b#c'
framed = str(len(note)) + '#' + note
print(framed)

mark = framed.index('#')     # the FIRST '#': the marker
size = int(framed[:mark])
print(size)
print(framed[mark + 1:mark + 1 + size])`,
        output: `['a', 'b']
5#a,b#c
5
a,b#c`,
      },
      gotchas: [
        'A length can have several digits (`12#...`). Read up to the marker, never just one character.',
        '`str(len(s))` is needed when writing: a number cannot be added to a string. `int(...)` is needed when reading.',
        'Only the first marker after the start of an item is a marker. Any later `#` belongs to the text.',
        'The empty string is written `0#`. It takes up room, so it survives the trip.',
        'After reading an item, move the index past the **text**, not just past the marker.',
      ],
    },
    {
      id: 'sorted-dedupe',
      title: 'Skipping duplicates in sorted data',
      skills: ['sorted_dedupe'],
      what: 'Once data is **sorted**, equal values sit next to each other. So "have I already used this value?" needs no set: compare with the neighbour. If a position holds the same value as the one before it, starting from it again would only reproduce answers you already have, so step past it. This is how a search over sorted data reports each answer once.',
      model: 'In a sorted queue, twins stand together: deal with the first and wave the rest through.',
      syntax: [
        { code: 'nums.sort()', note: 'Nothing here works until equal values are adjacent.' },
        { code: 'if i > 0 and nums[i] == nums[i - 1]:\n    continue', note: 'In a for loop: same as the one before, skip this turn.' },
        { code: 'while left < right and nums[left] == nums[left - 1]:\n    left += 1', note: 'With a pointer: after moving it, step past copies of the value just used.' },
        { code: 'i > 0 and ...', note: 'Bounds test first; `and` stops before the index is read.' },
      ],
      example: {
        code: `sizes = sorted([8, 5, 8, 5, 5, 9])
print(sizes)
for i in range(1, len(sizes)):
    print(i, sizes[i] == sizes[i - 1])   # a repeat of its left neighbour?

right = 4                                # sitting on the second 8
while right > 0 and sizes[right] == sizes[right - 1]:
    right -= 1
print(right)                             # the first 8`,
        output: `[5, 5, 5, 8, 8, 9]
1 True
2 True
3 False
4 True
5 False
3`,
      },
      gotchas: [
        'Without `i > 0`, `nums[i - 1]` at index 0 is `nums[-1]`, the **last** element, and the first value may be skipped.',
        'Compare with the value **behind** you (already used), not the one ahead: comparing ahead skips the first copy and can lose answers that need two equal values.',
        'A skipping `while` must keep its bounds test (`left < right`) or it walks off the end of a list of equal values.',
        'It only works on sorted data. Sort first.',
      ],
    },
  ],
}
