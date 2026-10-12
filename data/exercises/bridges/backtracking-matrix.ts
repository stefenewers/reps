import type { Pack, PackSection } from '@/data/exercises/bridges/types'
import { debug, output, write, t } from '@/data/exercises/build'

const BACKTRACKING = '2026-10-10'
const GRIDS = '2026-10-07'

/** An in-place test: build `m`, run the call, then compare what `m` holds now. */
const mut = (name: string, start: string, call: string, want: string, hidden = false) =>
  t.check(name, `m = ${start}\nresult = ${call}\nassert result is None, 'change the matrix itself and return nothing'\nassert m == ${want}, f'the matrix is now {m}'`, hidden)

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'

const sections: PackSection[] = [
  // ───────────────────────────── Backtracking check ─────────────────────────────
  {
    id: 'd10b-check',
    module: BACKTRACKING,
    title: 'Backtracking check',
    summary: 'Four cold reps: build a path, generate everything, order things, filter as you go.',
    gate: true,
    exercises: [
      write({
        id: 'd10b-step-plans',
        title: 'Check: ways up the steps',
        skills: ['backtracking_state', 'recursion_base_case'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 3,
        minutes: 10,
        prompt: 'You climb `n` steps, taking 1 or 2 at a time. Write `step_plans(n)` returning every plan as a list of step sizes, in any order.\n\n`step_plans(3)` gives `[[1, 1, 1], [1, 2], [2, 1]]`. `[1, 2]` and `[2, 1]` are different plans.',
        starterCode: `def step_plans(n):
    pass`,
        solution: `def step_plans(n):
    res = []
    path = []
    def dfs(left):
        if left == 0:
            res.append(path[:])
            return
        for step in (1, 2):
            if step <= left:
                path.append(step)
                dfs(left - step)
                path.pop()
    dfs(n)
    return res`,
        tests: [
          t.eq('step_plans(3)', '[[1, 1, 1], [1, 2], [2, 1]]', { compare: 'unordered' }),
          t.eq('step_plans(1)', '[[1]]', { compare: 'unordered' }),
          t.hidden('step_plans(0)', '[[]]', { compare: 'unordered' }),
          t.hidden('step_plans(2)', '[[1, 1], [2]]', { compare: 'unordered' }),
          t.hidden('len(step_plans(6))', '13'),
        ],
        hints: ['What is left to climb after each step you take, and what does a finished plan look like?'],
        explanation: 'The path holds the steps taken so far. A plan is finished when nothing is left to climb, and each step is popped before the other size is tried.',
      }),
      write({
        id: 'd10b-selections',
        title: 'Check: every selection',
        skills: ['backtracking_state', 'recursion_base_case', 'list_append'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 3,
        minutes: 9,
        prompt: "A stall sells some `extras` (distinct strings). Write `selections(extras)` returning every possible order a customer could place: any number of extras, each at most once, including none at all.\n\n`selections(['egg', 'jam'])` gives `[[], ['egg'], ['jam'], ['egg', 'jam']]` (any order).",
        starterCode: `def selections(extras):
    pass`,
        solution: `def selections(extras):
    res = []
    path = []
    def dfs(i):
        if i == len(extras):
            res.append(path[:])
            return
        path.append(extras[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return res`,
        tests: [
          t.eq("selections(['egg', 'jam'])", "[[], ['egg'], ['jam'], ['egg', 'jam']]", { compare: 'sorted-inner' }),
          t.eq("selections(['egg'])", "[[], ['egg']]", { compare: 'sorted-inner' }),
          t.hidden('selections([])', '[[]]', { compare: 'sorted-inner' }),
          t.hidden("selections(['a', 'b', 'c'])", "[[], ['a'], ['b'], ['c'], ['a', 'b'], ['a', 'c'], ['b', 'c'], ['a', 'b', 'c']]", { compare: 'sorted-inner' }),
          t.hidden("len(selections(['a', 'b', 'c', 'd']))", '16'),
        ],
        hints: ['Each extra is a yes-or-no decision. How many decisions until a selection is complete?'],
        explanation: 'Two branches per item: with it and without it. The copy `path[:]` is what gets saved, because the one path list keeps changing.',
      }),
      write({
        id: 'd10b-seatings',
        title: 'Check: every seating order',
        skills: ['backtracking_state', 'recursion_base_case', 'for_loop'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 3,
        minutes: 10,
        prompt: "Write `seatings(names)` returning every order in which the people in `names` (distinct strings) can sit along a bench. Each order is a list using every name once.\n\n`seatings(['ann', 'bo'])` gives `[['ann', 'bo'], ['bo', 'ann']]` (any order of orders).",
        starterCode: `def seatings(names):
    pass`,
        solution: `def seatings(names):
    res = []
    path = []
    def dfs():
        if len(path) == len(names):
            res.append(path[:])
            return
        for name in names:
            if name not in path:
                path.append(name)
                dfs()
                path.pop()
    dfs()
    return res`,
        tests: [
          t.eq("seatings(['ann', 'bo'])", "[['ann', 'bo'], ['bo', 'ann']]", { compare: 'unordered' }),
          t.eq("seatings(['zed'])", "[['zed']]", { compare: 'unordered' }),
          t.hidden('seatings([])', '[[]]', { compare: 'unordered' }),
          t.hidden("seatings(['a', 'b', 'c'])", "[['a', 'b', 'c'], ['a', 'c', 'b'], ['b', 'a', 'c'], ['b', 'c', 'a'], ['c', 'a', 'b'], ['c', 'b', 'a']]", { compare: 'unordered' }),
          t.hidden("len(seatings(['a', 'b', 'c', 'd']))", '24'),
        ],
        hints: ['Any person can take the next seat, as long as they are not already sitting.'],
        explanation: 'Here every position may take any unused item, so the loop always runs over all names and skips the ones already on the path.',
      }),
      write({
        id: 'd10b-quiet-codes',
        title: 'Check: codes with no double 1',
        skills: ['backtracking_state', 'recursion_base_case', 'conditionals'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 3,
        minutes: 11,
        prompt: "Write `quiet_codes(n)` returning every string of `'0'` and `'1'` of length `n` that never has two `'1'`s next to each other, in any order.\n\n`quiet_codes(2)` gives `['00', '01', '10']` (`'11'` is left out).",
        starterCode: `def quiet_codes(n):
    pass`,
        solution: `def quiet_codes(n):
    res = []
    path = []
    def dfs():
        if len(path) == n:
            res.append(''.join(path))
            return
        for bit in '01':
            if bit == '1' and path and path[-1] == '1':
                continue
            path.append(bit)
            dfs()
            path.pop()
    dfs()
    return res`,
        tests: [
          t.eq('quiet_codes(2)', "['00', '01', '10']", { compare: 'unordered' }),
          t.eq('quiet_codes(1)', "['0', '1']", { compare: 'unordered' }),
          t.hidden('quiet_codes(0)', "['']", { compare: 'unordered' }),
          t.hidden('quiet_codes(3)', "['000', '001', '010', '100', '101']", { compare: 'unordered' }),
          t.hidden('len(quiet_codes(5))', '13'),
        ],
        hints: ['Refuse a bad choice at the moment you would make it, instead of building every code and filtering afterwards.'],
        explanation: 'A filtered generation: the rule is checked before the choice is appended, so whole branches of bad codes are never built.',
      }),
    ],
  },

  // ───────────────────────────── LC 39 Combination Sum ─────────────────────────────
  {
    id: 'br-39',
    module: BACKTRACKING,
    title: 'Toward Combination Sum',
    summary: 'A start index that may stay put: reuse a number, never go backwards, stop when the total is overshot.',
    exercises: [
      output({
        id: 'b39-trace-start',
        title: 'Trace: the call passes i',
        skills: ['combination_start', 'backtracking_state'],
        prompt: 'You know `dfs(i + 1)`: move past the item just picked. Here the call passes `i` itself. Predict the output.',
        code: `nums = [1, 2, 3]
path = []

def dfs(start):
    if len(path) == 2:
        print(path)
        return
    for i in range(start, len(nums)):
        path.append(nums[i])
        dfs(i)
        path.pop()

dfs(0)`,
        expectedOutput: `[1, 1]
[1, 2]
[1, 3]
[2, 2]
[2, 3]
[3, 3]`,
        note: '`dfs(i)` lets the next pick be the same item again. It still cannot be an earlier one.',
        explanation: 'Passing `i` allows `[1, 1]` and `[2, 2]`. Nothing before `start` is ever looked at, so `[2, 1]` never appears.',
        minutes: 2.5,
      }),
      write({
        id: 'b39-scoops',
        title: 'Bowls of k scoops',
        skills: ['combination_start', 'backtracking_state', 'range'],
        difficulty: 3,
        minutes: 9,
        prompt: "Write `scoops(flavors, k)` returning every bowl of exactly `k` scoops. A flavor may be scooped more than once, and the order of scoops does not matter, so each bowl is listed once.\n\n`scoops(['van', 'choc'], 2)` gives `[['van', 'van'], ['van', 'choc'], ['choc', 'choc']]`.",
        starterCode: `def scoops(flavors, k):
    pass`,
        solution: `def scoops(flavors, k):
    res = []
    path = []
    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        for i in range(start, len(flavors)):
            path.append(flavors[i])
            dfs(i)
            path.pop()
    dfs(0)
    return res`,
        tests: [
          t.eq("scoops(['van', 'choc'], 2)", "[['van', 'van'], ['van', 'choc'], ['choc', 'choc']]", { compare: 'sorted-inner' }),
          t.eq("scoops(['van'], 3)", "[['van', 'van', 'van']]", { compare: 'sorted-inner' }),
          t.hidden("scoops(['a', 'b'], 0)", '[[]]', { compare: 'sorted-inner' }),
          t.hidden('scoops([], 1)', '[]', { compare: 'sorted-inner' }),
          t.hidden("len(scoops(['a', 'b', 'c'], 3))", '10'),
          t.hidden("scoops(['a', 'b', 'c'], 2)", "[['a', 'a'], ['a', 'b'], ['a', 'c'], ['b', 'b'], ['b', 'c'], ['c', 'c']]", { compare: 'sorted-inner' }),
        ],
        hints: [
          'It is the "groups of exactly k" shape, with one change to what the recursive call is given.',
          'Loop `i` from `start`. Which value lets the next scoop be the same flavor again?',
        ],
        explanation: 'The loop starts at `start`, so a bowl is only ever built in list order, and the call passes `i` so the same flavor stays available.',
      }),
      write({
        id: 'b39-exact-loads',
        title: 'Loads that weigh exactly the limit',
        skills: ['combination_start', 'backtracking_state', 'recursion_base_case'],
        stage: 'combine',
        repType: 'combine',
        difficulty: 3,
        minutes: 11,
        prompt: 'Write `exact_loads(weights, limit)` returning every group of crates whose weights add up to exactly `limit`. Each crate can be used **once**. Weights are distinct positive whole numbers.\n\nCarry the weight still allowed down the recursion, and give up on a branch as soon as it has gone over.\n\n`exact_loads([2, 3, 5, 7], 10)` gives `[[2, 3, 5], [3, 7]]`.',
        starterCode: `def exact_loads(weights, limit):
    pass`,
        solution: `def exact_loads(weights, limit):
    res = []
    path = []
    def dfs(start, left):
        if left == 0:
            res.append(path[:])
            return
        if left < 0:
            return
        for i in range(start, len(weights)):
            path.append(weights[i])
            dfs(i + 1, left - weights[i])
            path.pop()
    dfs(0, limit)
    return res`,
        tests: [
          t.eq('exact_loads([2, 3, 5, 7], 10)', '[[2, 3, 5], [3, 7]]', { compare: 'sorted-inner' }),
          t.eq('exact_loads([1, 2], 5)', '[]', { compare: 'sorted-inner' }),
          t.hidden('exact_loads([4], 4)', '[[4]]', { compare: 'sorted-inner' }),
          t.hidden('exact_loads([], 0)', '[[]]', { compare: 'sorted-inner' }),
          t.hidden('exact_loads([5, 1, 4, 2, 3], 6)', '[[5, 1], [1, 2, 3], [4, 2]]', { compare: 'sorted-inner' }),
          t.hidden('exact_loads([3, 6], 6)', '[[6]]', { compare: 'sorted-inner' }),
        ],
        hints: [
          'The recursion needs two things: where the loop may start, and how much weight is still allowed.',
          'Two ways for a branch to end: nothing left (save a copy), or less than nothing left (just return).',
          'Each crate once: which start value does the recursive call get?',
        ],
        explanation: 'The remaining total replaces re-summing the path. `left == 0` is a finished answer, `left < 0` is a dead end, and `i + 1` means a crate is never picked twice.',
      }),
      debug({
        id: 'b39-dbg-orders',
        title: 'Debug: the same bundle twice',
        skills: ['combination_start', 'backtracking_state'],
        difficulty: 3,
        minutes: 6,
        prompt: 'A shop sells packs of the given `sizes` and has plenty of each. `bundles(sizes, total)` should list every bundle of packs holding exactly `total` items. A size may be used several times. A bundle is a bag of packs: `[2, 3]` and `[3, 2]` are the same bundle and must be listed once.\n\n`bundles([2, 3], 5)` should give `[[2, 3]]`. Fix it.',
        brokenCode: `def bundles(sizes, total):
    res = []
    path = []
    def dfs(left):
        if left == 0:
            res.append(path[:])
            return
        if left < 0:
            return
        for i in range(len(sizes)):
            path.append(sizes[i])
            dfs(left - sizes[i])
            path.pop()
    dfs(total)
    return res`,
        solution: `def bundles(sizes, total):
    res = []
    path = []
    def dfs(start, left):
        if left == 0:
            res.append(path[:])
            return
        if left < 0:
            return
        for i in range(start, len(sizes)):
            path.append(sizes[i])
            dfs(i, left - sizes[i])
            path.pop()
    dfs(0, total)
    return res`,
        tests: [
          t.eq('bundles([2, 3], 5)', '[[2, 3]]', { compare: 'sorted-inner' }),
          t.eq('bundles([2, 3], 6)', '[[2, 2, 2], [3, 3]]', { compare: 'sorted-inner' }),
          t.hidden('bundles([1, 2], 3)', '[[1, 1, 1], [1, 2]]', { compare: 'sorted-inner' }),
          t.hidden('bundles([4], 6)', '[]', { compare: 'sorted-inner' }),
          t.hidden('bundles([5], 0)', '[[]]', { compare: 'sorted-inner' }),
          t.hidden('len(bundles([1, 2, 5], 5))', '4'),
        ],
        hints: [
          'Print the result for `bundles([2, 3], 5)`. What do the extra entries have in common with the right one?',
          'After picking a 3, which sizes should the next pick be allowed to look at?',
        ],
        explanation: 'Every level looped over all the sizes, so each bundle was built once per ordering. A start index fixes the order in which a bundle can be built, and passing `i` keeps reuse.',
      }),
      write({
        id: 'b39-count-ways',
        title: 'How many ways to pay',
        skills: ['combination_start', 'recursion_return', 'recursion_base_case'],
        stage: 'pattern',
        repType: 'pattern',
        important: true,
        difficulty: 3,
        minutes: 10,
        prompt: 'Write `count_ways(coins, amount)` returning **how many** different handfuls of coins add up to exactly `amount`. `coins` holds distinct positive coin values, and you have as many of each as you like. A handful has no order: with coins 1 and 2, the amount 3 can be paid 2 ways (`1+1+1` and `1+2`).\n\nNo list of handfuls is needed, only the count.',
        starterCode: `def count_ways(coins, amount):
    pass`,
        solution: `def count_ways(coins, amount):
    def dfs(start, left):
        if left == 0:
            return 1
        if left < 0:
            return 0
        total = 0
        for i in range(start, len(coins)):
            total += dfs(i, left - coins[i])
        return total
    return dfs(0, amount)`,
        tests: [
          t.eq('count_ways([1, 2], 3)', '2'),
          t.eq('count_ways([2, 5], 7)', '1'),
          t.hidden('count_ways([2], 3)', '0'),
          t.hidden('count_ways([1, 2, 5], 5)', '4'),
          t.hidden('count_ways([3], 0)', '1'),
          t.hidden('count_ways([], 4)', '0'),
          t.hidden('count_ways([5, 2, 1], 6)', '5'),
        ],
        hints: [
          'The recursion returns a number this time: how many ways there are from here.',
          'Two things travel down: where the loop may start, and how much is still to pay.',
          'Exactly paid counts as one way. Overpaid counts as none.',
        ],
        explanation: 'Same skeleton as listing the handfuls, without the path: each branch reports how many answers it found, and the start index stops `1+2` being counted again as `2+1`.',
      }),
    ],
  },

  // ───────────────────────────── LC 79 Word Search ─────────────────────────────
  {
    id: 'br-79',
    module: BACKTRACKING,
    title: 'Toward Word Search',
    summary: 'Backtracking on a grid: check the cell, mark it, try the four neighbours, unmark it on the way back.',
    exercises: [
      write({
        id: 'b79-cell-ok',
        title: 'Is this cell usable?',
        skills: ['grid_backtracking', 'grid_neighbors', 'set_membership'],
        difficulty: 2,
        minutes: 4,
        prompt: "`grid` is a list of equal-length strings. Write `fits(grid, r, c, ch, used)` returning `True` only when `(r, c)` is inside the grid, the cell holds the letter `ch`, and `(r, c)` is not in the set `used`.\n\nWith `grid = ['AB', 'CD']`: `fits(grid, 0, 1, 'B', set())` is `True`, `fits(grid, 0, -1, 'B', set())` is `False`.",
        starterCode: `def fits(grid, r, c, ch, used):
    pass`,
        solution: `def fits(grid, r, c, ch, used):
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
        return False
    return grid[r][c] == ch and (r, c) not in used`,
        tests: [
          t.eq("fits(['AB', 'CD'], 0, 1, 'B', set())", 'True'),
          t.eq("fits(['AB', 'CD'], 0, -1, 'B', set())", 'False'),
          t.eq("fits(['AB', 'CD'], 1, 1, 'D', {(1, 1)})", 'False'),
          t.hidden("fits(['AB', 'CD'], 2, 0, 'C', set())", 'False'),
          t.hidden("fits(['AB', 'CD'], -1, 0, 'C', set())", 'False'),
          t.hidden("fits(['AB', 'CD'], 1, 2, 'D', set())", 'False'),
          t.hidden("fits(['AB', 'CD'], 1, 0, 'A', set())", 'False'),
          t.hidden("fits(['AB', 'CD'], 1, 0, 'C', {(0, 0)})", 'True'),
        ],
        hints: ['Rule out the positions that are off the grid before you read the cell.', 'A negative index does not crash in Python. What does `row[-1]` give you?'],
        explanation: 'Bounds first, then the cell. A negative index silently reads from the other end, so it has to be refused explicitly.',
      }),
      write({
        id: 'b79-spell-right-down',
        title: 'Spell a word going right or down',
        skills: ['grid_backtracking', 'recursion_base_case', 'grid_nested'],
        difficulty: 3,
        minutes: 8,
        prompt: "`grid` is a list of equal-length strings. Write `spell_from(grid, r, c, word)` returning `True` if `word` can be read starting at cell `(r, c)`, moving one cell **right or down** for each next letter.\n\nWith `grid = ['CAT', 'ARE', 'TEN']`: `spell_from(grid, 0, 0, 'CAREN')` is `True` (down, right, right, down) and `spell_from(grid, 0, 0, 'CAB')` is `False`.\n\nAn empty word counts as spelled.",
        starterCode: `def spell_from(grid, r, c, word):
    pass`,
        solution: `def spell_from(grid, r, c, word):
    def dfs(r, c, k):
        if k == len(word):
            return True
        if r >= len(grid) or c >= len(grid[0]) or grid[r][c] != word[k]:
            return False
        return dfs(r + 1, c, k + 1) or dfs(r, c + 1, k + 1)
    return dfs(r, c, 0)`,
        tests: [
          t.eq("spell_from(['CAT', 'ARE', 'TEN'], 0, 0, 'CAREN')", 'True'),
          t.eq("spell_from(['CAT', 'ARE', 'TEN'], 0, 0, 'CAB')", 'False'),
          t.eq("spell_from(['CAT', 'ARE', 'TEN'], 0, 0, 'CAT')", 'True'),
          t.hidden("spell_from(['CAT', 'ARE', 'TEN'], 1, 1, 'RE')", 'True'),
          t.hidden("spell_from(['CAT', 'ARE', 'TEN'], 0, 2, 'TAC')", 'False'),
          t.hidden("spell_from(['CAT', 'ARE', 'TEN'], 0, 0, '')", 'True'),
          t.hidden("spell_from(['A'], 0, 0, 'A')", 'True'),
          t.hidden("spell_from(['A'], 0, 0, 'AA')", 'False'),
          t.hidden("spell_from(['CAT', 'ARE', 'TEN'], 0, 0, 'CATEN')", 'True'),
        ],
        hints: [
          'Add an inner function that also knows which letter of the word it is looking for.',
          'Finished when every letter has been matched. Dead end when the cell is off the grid or holds the wrong letter.',
          'Otherwise the answer is: does it work from the cell below, or from the cell to the right, for the next letter?',
        ],
        explanation: 'The recursion carries the position and the index of the letter wanted there. Moving only right and down can never return to a cell, so nothing needs marking yet.',
      }),
      debug({
        id: 'b79-dbg-no-unmark',
        title: 'Debug: the snake that gives up',
        skills: ['grid_backtracking', 'backtracking_state', 'visited_set'],
        difficulty: 3,
        minutes: 5,
        prompt: "`snake_from(grid, r, c, word)` should return `True` if `word` can be read starting at `(r, c)`, moving up, down, left or right for each next letter and never standing on the same cell twice.\n\nWith `grid = ['AB', 'BC', 'D.']`, `snake_from(grid, 0, 0, 'ABCBD')` should be `True` (right, down, left, down). Fix it.",
        brokenCode: `def snake_from(grid, r, c, word):
    used = set()
    def dfs(r, c, k):
        if k == len(word):
            return True
        if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
            return False
        if grid[r][c] != word[k] or (r, c) in used:
            return False
        used.add((r, c))
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            if dfs(r + dr, c + dc, k + 1):
                return True
        return False
    return dfs(r, c, 0)`,
        solution: `def snake_from(grid, r, c, word):
    used = set()
    def dfs(r, c, k):
        if k == len(word):
            return True
        if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
            return False
        if grid[r][c] != word[k] or (r, c) in used:
            return False
        used.add((r, c))
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            if dfs(r + dr, c + dc, k + 1):
                return True
        used.remove((r, c))
        return False
    return dfs(r, c, 0)`,
        tests: [
          t.eq("snake_from(['AB', 'BC', 'D.'], 0, 0, 'ABCBD')", 'True'),
          t.eq("snake_from(['AB', 'BA'], 0, 0, 'ABA')", 'True'),
          t.eq("snake_from(['AB'], 0, 0, 'ABA')", 'False'),
          t.hidden("snake_from(['A'], 0, 0, 'A')", 'True'),
          t.hidden("snake_from(['AB', 'BC', 'D.'], 0, 0, 'ABCD')", 'False'),
          t.hidden("snake_from(['XAB', 'DBC'], 0, 1, 'ABCBD')", 'True'),
          t.hidden("snake_from(['AB', 'BC', 'D.'], 1, 1, 'A')", 'False'),
        ],
        hints: [
          'The first route it tries goes down, then right, then up, and gets stuck. What does `used` hold at that moment?',
          'A cell that was part of a failed route is not part of the next route.',
        ],
        explanation: 'A cell is only "used" while the current route stands on it. Without the remove, cells from an abandoned route stay blocked and the real route cannot pass through them.',
      }),
      write({
        id: 'b79-longest-trail',
        title: 'Longest walk without reusing a cell',
        skills: ['grid_backtracking', 'grid_neighbors', 'backtracking_state', 'visited_set'],
        stage: 'combine',
        repType: 'combine',
        difficulty: 4,
        minutes: 12,
        prompt: "`grid` is a list of equal-length strings: `'.'` is open floor, `'#'` is a wall. Write `longest_trail(grid, r, c)` returning the largest number of cells a walk can cover starting on `(r, c)`, moving up, down, left or right, staying on open floor and never stepping on a cell twice.\n\n`longest_trail(['.#.', '...'], 0, 0)` is `5`. A start on a wall or off the grid gives `0`.",
        starterCode: `def longest_trail(grid, r, c):
    pass`,
        solution: `def longest_trail(grid, r, c):
    used = set()
    def dfs(r, c):
        if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
            return 0
        if grid[r][c] == '#' or (r, c) in used:
            return 0
        used.add((r, c))
        best = 0
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            best = max(best, dfs(r + dr, c + dc))
        used.remove((r, c))
        return best + 1
    return dfs(r, c)`,
        tests: [
          t.eq("longest_trail(['.#.', '...'], 0, 0)", '5'),
          t.eq("longest_trail(['...', '...'], 0, 1)", '6'),
          t.eq("longest_trail(['#'], 0, 0)", '0'),
          t.hidden("longest_trail(['.'], 0, 0)", '1'),
          t.hidden("longest_trail(['..#', '#..', '...'], 0, 0)", '7'),
          t.hidden("longest_trail(['...', '.#.', '...'], 0, 0)", '8'),
          t.hidden("longest_trail(['.....'], 0, 2)", '3'),
          t.hidden("longest_trail(['..', '..'], 5, 0)", '0'),
        ],
        hints: [
          'A walk from a cell is that cell plus the best walk from one of its four neighbours.',
          'Off the grid, a wall, or a cell already on the walk: all worth 0.',
          'Mark the cell before trying the neighbours and unmark it after all four have been tried.',
          'Return the best neighbour result plus one for this cell.',
        ],
        explanation: 'Every neighbour gets to try with this cell marked. The unmark comes after all four, so a different route arriving here later finds the cell free again.',
      }),
      write({
        id: 'b79-has-snake',
        title: 'A snake of k same-coloured cells',
        skills: ['grid_backtracking', 'grid_neighbors', 'early_return', 'visited_set'],
        stage: 'pattern',
        repType: 'pattern',
        important: true,
        difficulty: 4,
        minutes: 15,
        prompt: "`grid` is a list of equal-length strings, one colour letter per cell. A **snake** is a chain of different cells, each next to the one before (up, down, left or right), all of the same colour. Write `has_snake(grid, k)` returning `True` if the grid contains a snake of `k` cells. It may start anywhere. `k` is at least 1.\n\n`has_snake(['RG', 'RR'], 3)` is `True`. `has_snake(['RR', 'RR'], 5)` is `False`: there are only four cells.",
        starterCode: `def has_snake(grid, k):
    pass`,
        solution: `def has_snake(grid, k):
    rows, cols = len(grid), len(grid[0])
    used = set()
    def dfs(r, c, color, left):
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return False
        if grid[r][c] != color or (r, c) in used:
            return False
        if left == 1:
            return True
        used.add((r, c))
        found = False
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            if dfs(r + dr, c + dc, color, left - 1):
                found = True
                break
        used.remove((r, c))
        return found
    for r in range(rows):
        for c in range(cols):
            if dfs(r, c, grid[r][c], k):
                return True
    return False`,
        tests: [
          t.eq("has_snake(['RG', 'RR'], 3)", 'True'),
          t.eq("has_snake(['RR', 'RR'], 5)", 'False'),
          t.eq("has_snake(['RG', 'GR'], 2)", 'False'),
          t.hidden("has_snake(['A'], 1)", 'True'),
          t.hidden("has_snake(['A'], 2)", 'False'),
          t.hidden("has_snake(['RRR', 'RGR'], 5)", 'True'),
          t.hidden("has_snake(['GRG', 'RRR', 'GRG'], 4)", 'False'),
          t.hidden("has_snake(['RRR', 'RGR', 'RRR'], 8)", 'True'),
          t.hidden("has_snake(['RRG', 'RGR'], 3)", 'True'),
          t.hidden("has_snake(['RGR', 'RRR', 'GRG'], 6)", 'False'),
        ],
        hints: [
          'Solve it from one starting cell first, then try every cell as the start.',
          'The recursion needs the cell, the colour being followed, and how many cells are still needed.',
          'Off the grid, wrong colour or already on the snake: no. One cell still needed and this one fits: yes.',
          'Mark the cell, ask the four neighbours for one fewer, and unmark it before returning either answer.',
        ],
        explanation: 'Check, mark, try four neighbours, unmark, and an outer double loop that offers every cell as the head. Without the marking a snake could double back over its own cells.',
      }),
    ],
  },

  // ───────────────────────────── Matrix ladder ─────────────────────────────
  {
    id: 'mx-transform',
    module: GRIDS,
    title: 'Swap, transpose, reverse',
    summary: 'Rearranging a matrix inside itself: swap two cells, flip across the diagonal, reverse rows.',
    exercises: [
      write({
        id: 'mx-t-swap-cells',
        title: 'Swap two cells',
        skills: ['matrix_transform', 'grid_nested', 'tuples'],
        difficulty: 1,
        minutes: 2,
        prompt: 'Write `swap_cells(m, r1, c1, r2, c2)` that exchanges the values at `(r1, c1)` and `(r2, c2)` inside `m`. It changes `m` itself and returns nothing.\n\nWith `m = [[1, 2], [3, 4]]`, after `swap_cells(m, 0, 1, 1, 0)` the matrix is `[[1, 3], [2, 4]]`.',
        starterCode: `def swap_cells(m, r1, c1, r2, c2):
    pass`,
        solution: `def swap_cells(m, r1, c1, r2, c2):
    m[r1][c1], m[r2][c2] = m[r2][c2], m[r1][c1]`,
        tests: [
          mut('swap across the diagonal', '[[1, 2], [3, 4]]', 'swap_cells(m, 0, 1, 1, 0)', '[[1, 3], [2, 4]]'),
          mut('swap within a row', '[[1, 2, 3]]', 'swap_cells(m, 0, 0, 0, 2)', '[[3, 2, 1]]'),
          mut('a cell with itself', '[[1, 2], [3, 4]]', 'swap_cells(m, 1, 1, 1, 1)', '[[1, 2], [3, 4]]', true),
          mut('opposite corners', '[[1, 2], [3, 4], [5, 6]]', 'swap_cells(m, 0, 0, 2, 1)', '[[6, 2], [3, 4], [5, 1]]', true),
        ],
        hints: ['Python can swap two things in one line, with a pair on each side of the `=`.'],
        explanation: 'The right-hand side is read in full before anything is stored, so no temporary variable is needed.',
      }),
      write({
        id: 'mx-t-transpose',
        title: 'Flip across the diagonal',
        skills: ['matrix_transform', 'grid_nested', 'range'],
        difficulty: 2,
        minutes: 6,
        prompt: 'Write `transpose(m)` for a **square** matrix: the value at row `r`, column `c` trades places with the value at row `c`, column `r`. Rows become columns. Change `m` itself and return nothing.\n\n`[[1, 2], [3, 4]]` becomes `[[1, 3], [2, 4]]`. The diagonal (`1` and `4`) stays put.',
        starterCode: `def transpose(m):
    pass`,
        solution: `def transpose(m):
    n = len(m)
    for r in range(n):
        for c in range(r + 1, n):
            m[r][c], m[c][r] = m[c][r], m[r][c]`,
        tests: [
          mut('2 x 2', '[[1, 2], [3, 4]]', 'transpose(m)', '[[1, 3], [2, 4]]'),
          mut('3 x 3', '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]', 'transpose(m)', '[[1, 4, 7], [2, 5, 8], [3, 6, 9]]'),
          mut('1 x 1', '[[5]]', 'transpose(m)', '[[5]]', true),
          mut('already symmetric', '[[1, 7], [7, 1]]', 'transpose(m)', '[[1, 7], [7, 1]]', true),
          mut('4 x 4', '[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]', 'transpose(m)', '[[1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [4, 8, 12, 16]]', true),
        ],
        hints: [
          'Each cell above the diagonal has one partner below it. Swap each pair once.',
          'Above the diagonal means the column number is bigger than the row number.',
          'For row `r`, which column should the inner loop start from?',
        ],
        explanation: 'The inner loop starts at `r + 1`, so it only visits cells above the diagonal and each pair is swapped exactly once.',
      }),
      debug({
        id: 'mx-t-dbg-twice',
        title: 'Debug: the table that does not change',
        skills: ['matrix_transform', 'range'],
        difficulty: 2,
        minutes: 3,
        prompt: '`mirror_table(m)` should flip a square matrix across its diagonal in place, so rows become columns: `[[1, 2], [3, 4]]` should become `[[1, 3], [2, 4]]`. It runs without an error. Fix it.',
        brokenCode: `def mirror_table(m):
    n = len(m)
    for r in range(n):
        for c in range(n):
            m[r][c], m[c][r] = m[c][r], m[r][c]`,
        solution: `def mirror_table(m):
    n = len(m)
    for r in range(n):
        for c in range(r + 1, n):
            m[r][c], m[c][r] = m[c][r], m[r][c]`,
        tests: [
          mut('2 x 2', '[[1, 2], [3, 4]]', 'mirror_table(m)', '[[1, 3], [2, 4]]'),
          mut('3 x 3', '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]', 'mirror_table(m)', '[[1, 4, 7], [2, 5, 8], [3, 6, 9]]'),
          mut('1 x 1', '[[5]]', 'mirror_table(m)', '[[5]]', true),
          mut('letters', "[['a', 'b'], ['c', 'd']]", 'mirror_table(m)', "[['a', 'c'], ['b', 'd']]", true),
        ],
        hints: ['Follow one pair by hand, say `(0, 1)` and `(1, 0)`. How many times does the loop swap them?'],
        explanation: 'Looping over every `(r, c)` swaps each pair twice: once from above the diagonal and once from below, which puts everything back.',
      }),
      write({
        id: 'mx-t-reverse-rows',
        title: 'Mirror left to right',
        skills: ['matrix_transform', 'list_iterate'],
        difficulty: 2,
        minutes: 3.5,
        prompt: 'Write `mirror(m)` that reverses every row of `m` in place, like a mirror standing at the side. Return nothing. The matrix does not have to be square.\n\n`[[1, 2, 3], [4, 5, 6]]` becomes `[[3, 2, 1], [6, 5, 4]]`.',
        starterCode: `def mirror(m):
    pass`,
        solution: `def mirror(m):
    for row in m:
        row.reverse()`,
        tests: [
          mut('2 x 3', '[[1, 2, 3], [4, 5, 6]]', 'mirror(m)', '[[3, 2, 1], [6, 5, 4]]'),
          mut('2 x 2', '[[1, 2], [3, 4]]', 'mirror(m)', '[[2, 1], [4, 3]]'),
          mut('one column', '[[1], [2]]', 'mirror(m)', '[[1], [2]]', true),
          mut('one row', '[[1, 2, 3, 4]]', 'mirror(m)', '[[4, 3, 2, 1]]', true),
          t.check('the rows are the same list objects', 'm = [[1, 2], [3, 4]]\nfirst = m[0]\nmirror(m)\nassert first == [2, 1], "reverse the row list itself, not a copy of it"', true),
        ],
        hints: ['Each row is a list, and a list can reverse itself.', 'Assigning a reversed copy to the loop variable leaves `m` untouched. Use the method that changes the list.'],
        explanation: '`row.reverse()` changes the row that `m` holds. `row = row[::-1]` only points the loop variable at a new list.',
      }),
      write({
        id: 'mx-t-flip-rows',
        title: 'Turn it upside down',
        skills: ['matrix_transform', 'two_pointer', 'while_loop'],
        difficulty: 2,
        minutes: 5.5,
        prompt: 'Write `flip(m)` that reverses the **order of the rows** in place: the last row becomes the first. Return nothing.\n\nPractise the swap: keep a `top` index and a `bottom` index and exchange whole rows while walking them toward each other.\n\n`[[1, 2], [3, 4], [5, 6]]` becomes `[[5, 6], [3, 4], [1, 2]]`.',
        starterCode: `def flip(m):
    pass`,
        solution: `def flip(m):
    top, bottom = 0, len(m) - 1
    while top < bottom:
        m[top], m[bottom] = m[bottom], m[top]
        top += 1
        bottom -= 1`,
        tests: [
          mut('three rows', '[[1, 2], [3, 4], [5, 6]]', 'flip(m)', '[[5, 6], [3, 4], [1, 2]]'),
          mut('two rows', '[[1, 2], [3, 4]]', 'flip(m)', '[[3, 4], [1, 2]]'),
          mut('one row', '[[1, 2, 3]]', 'flip(m)', '[[1, 2, 3]]', true),
          mut('four rows', '[[1], [2], [3], [4]]', 'flip(m)', '[[4], [3], [2], [1]]', true),
        ],
        hints: ['`m[top]` is a whole row. Two rows swap the same way two numbers do.', 'Stop when the two indexes meet.'],
        explanation: 'A row is one item of the outer list, so swapping rows is an ordinary two-pointer reversal. `m.reverse()` does the same thing in one call.',
      }),
    ],
  },
  {
    id: 'mx-layers',
    module: GRIDS,
    title: 'Walking the edges',
    summary: 'Four bounds, one edge at a time: read an edge, then move the bound you just walked.',
    exercises: [
      output({
        id: 'mx-l-trace',
        title: 'Trace: two edges and two bounds',
        skills: ['matrix_layers', 'grid_nested'],
        prompt: 'Four variables fence in the part of the matrix not read yet. Predict the output.',
        code: `m = [[1, 2, 3],
     [4, 5, 6],
     [7, 8, 9]]
top, bottom, left, right = 0, 2, 0, 2
out = []
for c in range(left, right + 1):
    out.append(m[top][c])
top += 1
for r in range(top, bottom + 1):
    out.append(m[r][right])
right -= 1
print(out)
print(top, bottom, left, right)`,
        expectedOutput: `[1, 2, 3, 6, 9]
1 2 0 1`,
        note: 'After an edge is read, its bound moves one step inward.',
        explanation: 'The top row is read, then `top` moves down, so the right column starts at the 6 and the corner 3 is not read twice.',
        minutes: 2.5,
      }),
      write({
        id: 'mx-l-top-edge',
        title: 'Read the top edge',
        skills: ['matrix_layers', 'grid_nested', 'range'],
        difficulty: 2,
        minutes: 4,
        prompt: 'Write `top_edge(m, top, left, right)` returning the values of row `top` from column `left` to column `right`, both included, left to right.\n\nWith `m = [[1, 2, 3], [4, 5, 6]]`, `top_edge(m, 1, 0, 1)` is `[4, 5]`.',
        starterCode: `def top_edge(m, top, left, right):
    pass`,
        solution: `def top_edge(m, top, left, right):
    out = []
    for c in range(left, right + 1):
        out.append(m[top][c])
    return out`,
        tests: [
          t.eq('top_edge([[1, 2, 3], [4, 5, 6]], 1, 0, 1)', '[4, 5]'),
          t.eq('top_edge([[1, 2, 3], [4, 5, 6]], 0, 0, 2)', '[1, 2, 3]'),
          t.hidden('top_edge([[1, 2, 3], [4, 5, 6]], 0, 2, 2)', '[3]'),
          t.hidden('top_edge([[1, 2, 3], [4, 5, 6]], 0, 2, 1)', '[]'),
          t.hidden('top_edge([[9]], 0, 0, 0)', '[9]'),
        ],
        hints: ['The row stays fixed and the column moves.', '`right` is included, and `range` stops one before its end.'],
        explanation: 'Walking a row: the row index is the bound, the column runs over `range(left, right + 1)`.',
      }),
      write({
        id: 'mx-l-bottom-edge',
        title: 'Read the bottom edge backwards',
        skills: ['matrix_layers', 'grid_nested', 'range'],
        difficulty: 2,
        minutes: 4.5,
        prompt: 'Write `bottom_edge(m, bottom, left, right)` returning the values of row `bottom` from column `right` back to column `left`, both included, **right to left**.\n\nWith `m = [[1, 2, 3], [4, 5, 6]]`, `bottom_edge(m, 1, 0, 2)` is `[6, 5, 4]`.',
        starterCode: `def bottom_edge(m, bottom, left, right):
    pass`,
        solution: `def bottom_edge(m, bottom, left, right):
    out = []
    for c in range(right, left - 1, -1):
        out.append(m[bottom][c])
    return out`,
        tests: [
          t.eq('bottom_edge([[1, 2, 3], [4, 5, 6]], 1, 0, 2)', '[6, 5, 4]'),
          t.eq('bottom_edge([[1, 2, 3], [4, 5, 6]], 0, 1, 2)', '[3, 2]'),
          t.hidden('bottom_edge([[1, 2, 3], [4, 5, 6]], 1, 0, 0)', '[4]'),
          t.hidden('bottom_edge([[1, 2, 3], [4, 5, 6]], 1, 1, 0)', '[]'),
          t.hidden('bottom_edge([[7, 8]], 0, 0, 1)', '[8, 7]'),
        ],
        hints: ['A `range` can count down with a third argument.', 'Counting down, the stop value is one **below** the last column you want.'],
        explanation: 'A backwards range needs the step `-1` and a stop one past the end in the direction of travel: `left - 1`.',
      }),
      write({
        id: 'mx-l-left-edge',
        title: 'Read the left edge upwards',
        skills: ['matrix_layers', 'grid_nested', 'range'],
        difficulty: 2,
        minutes: 4.5,
        prompt: 'Write `left_edge(m, left, top, bottom)` returning the values of column `left` from row `bottom` up to row `top`, both included, **bottom to top**.\n\nWith `m = [[1, 2], [3, 4], [5, 6]]`, `left_edge(m, 0, 0, 2)` is `[5, 3, 1]`.',
        starterCode: `def left_edge(m, left, top, bottom):
    pass`,
        solution: `def left_edge(m, left, top, bottom):
    out = []
    for r in range(bottom, top - 1, -1):
        out.append(m[r][left])
    return out`,
        tests: [
          t.eq('left_edge([[1, 2], [3, 4], [5, 6]], 0, 0, 2)', '[5, 3, 1]'),
          t.eq('left_edge([[1, 2], [3, 4], [5, 6]], 1, 1, 2)', '[6, 4]'),
          t.hidden('left_edge([[1, 2], [3, 4], [5, 6]], 1, 1, 1)', '[4]'),
          t.hidden('left_edge([[1, 2], [3, 4], [5, 6]], 0, 2, 1)', '[]'),
          t.hidden('left_edge([[7], [8]], 0, 0, 1)', '[8, 7]'),
        ],
        hints: ['This time the column stays fixed and the row moves.', 'Which index goes in the first pair of brackets?'],
        explanation: 'Walking a column: the row is the loop variable and it goes in the first brackets, `m[r][left]`.',
      }),
      debug({
        id: 'mx-l-dbg-single-row',
        title: 'Debug: the border read twice',
        skills: ['matrix_layers', 'grid_nested', 'edge_cases'],
        difficulty: 3,
        minutes: 6,
        prompt: '`border(m)` should return the outside ring of a matrix, clockwise from the top-left cell, each cell once. For `[[1, 2, 3], [4, 5, 6], [7, 8, 9]]` that is `[1, 2, 3, 6, 9, 8, 7, 4]`, and for the single row `[[1, 2, 3]]` it is `[1, 2, 3]`. Fix it.',
        brokenCode: `def border(m):
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    out = []
    for c in range(left, right + 1):
        out.append(m[top][c])
    top += 1
    for r in range(top, bottom + 1):
        out.append(m[r][right])
    right -= 1
    for c in range(right, left - 1, -1):
        out.append(m[bottom][c])
    bottom -= 1
    for r in range(bottom, top - 1, -1):
        out.append(m[r][left])
    left += 1
    return out`,
        solution: `def border(m):
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    out = []
    for c in range(left, right + 1):
        out.append(m[top][c])
    top += 1
    for r in range(top, bottom + 1):
        out.append(m[r][right])
    right -= 1
    if top <= bottom:
        for c in range(right, left - 1, -1):
            out.append(m[bottom][c])
        bottom -= 1
    if left <= right:
        for r in range(bottom, top - 1, -1):
            out.append(m[r][left])
        left += 1
    return out`,
        tests: [
          t.eq('border([[1, 2, 3], [4, 5, 6], [7, 8, 9]])', '[1, 2, 3, 6, 9, 8, 7, 4]'),
          t.eq('border([[1, 2, 3]])', '[1, 2, 3]'),
          t.hidden('border([[1], [2], [3]])', '[1, 2, 3]'),
          t.hidden('border([[7]])', '[7]'),
          t.hidden('border([[1, 2], [3, 4]])', '[1, 2, 4, 3]'),
          t.hidden('border([[1, 2, 3], [4, 5, 6]])', '[1, 2, 3, 6, 5, 4]'),
        ],
        hints: [
          'Run it on the single row and write down `top` and `bottom` after the first edge has been read.',
          'After the top row is read and `top` has moved, is there still a row left for the bottom edge to read?',
          'The same question applies to the left edge once `right` has moved.',
        ],
        explanation: 'Reading the top row moves `top` past `bottom` when there is only one row, yet the bottom walk still ran over that same row. The bottom and left walks need the bounds checked again first.',
      }),
    ],
  },
  {
    id: 'mx-marking',
    module: GRIDS,
    title: 'Mark first, change after',
    summary: 'Note which rows and columns must change, and only then touch the cells.',
    exercises: [
      write({
        id: 'mx-m-lines-with',
        title: 'Which rows and columns hold it?',
        skills: ['matrix_marking', 'set_add', 'grid_nested'],
        difficulty: 2,
        minutes: 6.5,
        prompt: 'Write `lines_with(m, x)` returning two sets: the row numbers that contain the value `x` somewhere, and the column numbers that do.\n\n`lines_with([[1, 0], [1, 1]], 0)` is `({0}, {1})`: the only `0` sits in row 0, column 1.',
        starterCode: `def lines_with(m, x):
    pass`,
        solution: `def lines_with(m, x):
    rows, cols = set(), set()
    for r in range(len(m)):
        for c in range(len(m[0])):
            if m[r][c] == x:
                rows.add(r)
                cols.add(c)
    return rows, cols`,
        tests: [
          t.eq('lines_with([[1, 0], [1, 1]], 0)', '({0}, {1})'),
          t.eq('lines_with([[5, 5, 2], [2, 5, 5]], 2)', '({0, 1}, {0, 2})'),
          t.hidden('lines_with([[1, 2], [3, 4]], 9)', '(set(), set())'),
          t.hidden('lines_with([[7, 7], [7, 7]], 7)', '({0, 1}, {0, 1})'),
          t.hidden('lines_with([[4]], 4)', '({0}, {0})'),
          t.hidden('lines_with([[1, 2, 3], [4, 5, 3]], 3)', '({0, 1}, {2})'),
        ],
        hints: ['Two empty sets, one for rows and one for columns.', 'When a cell matches, its row number goes in one set and its column number in the other.'],
        explanation: 'One pass that only reads. Sets absorb repeats, so a row with three matches is still recorded once.',
      }),
      write({
        id: 'mx-m-wipe',
        title: 'Zero the listed rows and columns',
        skills: ['matrix_marking', 'set_membership', 'grid_nested'],
        difficulty: 2,
        minutes: 5.5,
        prompt: 'Write `wipe(m, rows, cols)`. `rows` and `cols` are sets of row numbers and column numbers. Set every cell that lies in one of those rows **or** one of those columns to `0`, in place. Return nothing.\n\nWith `m = [[1, 2], [3, 4]]`, `wipe(m, {0}, set())` leaves `[[0, 0], [3, 4]]`.',
        starterCode: `def wipe(m, rows, cols):
    pass`,
        solution: `def wipe(m, rows, cols):
    for r in range(len(m)):
        for c in range(len(m[0])):
            if r in rows or c in cols:
                m[r][c] = 0`,
        tests: [
          mut('one row', '[[1, 2], [3, 4]]', 'wipe(m, {0}, set())', '[[0, 0], [3, 4]]'),
          mut('a row and a column', '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]', 'wipe(m, {1}, {2})', '[[1, 2, 0], [0, 0, 0], [7, 8, 0]]'),
          mut('nothing listed', '[[1, 2], [3, 4]]', 'wipe(m, set(), set())', '[[1, 2], [3, 4]]', true),
          mut('one column', '[[1, 2], [3, 4], [5, 6]]', 'wipe(m, set(), {0})', '[[0, 2], [0, 4], [0, 6]]', true),
          mut('everything', '[[1, 2], [3, 4]]', 'wipe(m, {0, 1}, {0})', '[[0, 0], [0, 0]]', true),
        ],
        hints: ['Visit every cell and ask one question about its row number and its column number.'],
        explanation: 'The second pass never reads the cell values, only the two sets, so it does not matter what has already been overwritten.',
      }),
      debug({
        id: 'mx-m-dbg-flood',
        title: 'Debug: stars everywhere',
        skills: ['matrix_marking', 'set_add', 'grid_nested'],
        difficulty: 3,
        minutes: 7,
        prompt: "`m` is a matrix of `'.'` and `'*'`. `spread_stars(m)` should turn every cell that shares a row or a column with one of the **original** stars into a star, in place.\n\n`[['*', '.', '.'], ['.', '.', '.'], ['.', '.', '.']]` should become `[['*', '*', '*'], ['*', '.', '.'], ['*', '.', '.']]`. Fix it.",
        brokenCode: `def spread_stars(m):
    for r in range(len(m)):
        for c in range(len(m[0])):
            if m[r][c] == '*':
                for k in range(len(m[0])):
                    m[r][k] = '*'
                for k in range(len(m)):
                    m[k][c] = '*'`,
        solution: `def spread_stars(m):
    rows, cols = set(), set()
    for r in range(len(m)):
        for c in range(len(m[0])):
            if m[r][c] == '*':
                rows.add(r)
                cols.add(c)
    for r in range(len(m)):
        for c in range(len(m[0])):
            if r in rows or c in cols:
                m[r][c] = '*'`,
        tests: [
          mut('a star in the corner', "[['*', '.', '.'], ['.', '.', '.'], ['.', '.', '.']]", 'spread_stars(m)', "[['*', '*', '*'], ['*', '.', '.'], ['*', '.', '.']]"),
          mut('a star at the end', "[['.', '.'], ['.', '*']]", 'spread_stars(m)', "[['.', '*'], ['*', '*']]"),
          mut('no stars', "[['.', '.'], ['.', '.']]", 'spread_stars(m)', "[['.', '.'], ['.', '.']]", true),
          mut('a star in the middle', "[['.', '.', '.'], ['.', '*', '.'], ['.', '.', '.']]", 'spread_stars(m)', "[['.', '*', '.'], ['*', '*', '*'], ['.', '*', '.']]", true),
          mut('one row', "[['.', '*', '.']]", 'spread_stars(m)', "[['*', '*', '*']]", true),
          mut('two stars', "[['*', '.', '.'], ['.', '.', '.'], ['.', '.', '*']]", 'spread_stars(m)', "[['*', '*', '*'], ['*', '.', '*'], ['*', '*', '*']]", true),
        ],
        hints: [
          'After the corner star has spread, the scan moves on to the next cell. What does it find there?',
          'The scan cannot tell an original star from one it painted a moment ago.',
          'Finish looking before you start painting: two passes.',
        ],
        explanation: 'Painting while scanning turns painted cells into new sources, and the whole matrix fills. Recording rows and columns first keeps the decision based on the original values only.',
      }),
      write({
        id: 'mx-m-open-seats',
        title: 'Seats still open',
        skills: ['matrix_marking', 'set_membership', 'accumulator', 'grid_nested'],
        stage: 'combine',
        repType: 'combine',
        difficulty: 3,
        minutes: 10,
        prompt: "`hall` is a list of equal-length strings. `'X'` is a broken seat, `'.'` is a good one. For safety, every row and every column that has a broken seat in it is closed completely. Write `open_seats(hall)` returning how many seats are still open.\n\n`open_seats(['..', '.X'])` is `1`: only the top-left seat is in an untouched row and an untouched column.",
        starterCode: `def open_seats(hall):
    pass`,
        solution: `def open_seats(hall):
    rows, cols = set(), set()
    for r in range(len(hall)):
        for c in range(len(hall[0])):
            if hall[r][c] == 'X':
                rows.add(r)
                cols.add(c)
    count = 0
    for r in range(len(hall)):
        for c in range(len(hall[0])):
            if r not in rows and c not in cols:
                count += 1
    return count`,
        tests: [
          t.eq("open_seats(['..', '.X'])", '1'),
          t.eq("open_seats(['...', '...'])", '6'),
          t.hidden("open_seats(['X'])", '0'),
          t.hidden("open_seats(['X..', '.X.', '..X'])", '0'),
          t.hidden("open_seats(['.X.', '...', '...'])", '4'),
          t.hidden("open_seats(['XX..', '....', '....'])", '4'),
        ],
        hints: ['First find out which rows and which columns are closed.', 'Then a seat is open when its row is not closed and its column is not closed.'],
        explanation: 'The same two passes, with a count instead of a write: gather the closed rows and columns, then test each seat against both sets.',
      }),
    ],
  },

  // ───────────────────────────── Matrix check ─────────────────────────────
  {
    id: 'mx-check',
    module: GRIDS,
    title: 'Matrix check',
    summary: 'Four cold reps: rearrange in place, walk a border, change rows and columns safely.',
    gate: true,
    exercises: [
      write({
        id: 'mx-c-swap-axes',
        title: 'Check: players and rounds',
        skills: ['matrix_transform', 'grid_nested', 'range'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 3,
        minutes: 6,
        prompt: 'A square score table has one row per player and one column per round. Write `swap_axes(table)` that rearranges it in place so there is one row per **round** and one column per **player**: the score at row `r`, column `c` ends up at row `c`, column `r`. Return nothing.\n\n`[[1, 2], [3, 4]]` becomes `[[1, 3], [2, 4]]`.',
        starterCode: `def swap_axes(table):
    pass`,
        solution: `def swap_axes(table):
    n = len(table)
    for r in range(n):
        for c in range(r + 1, n):
            table[r][c], table[c][r] = table[c][r], table[r][c]`,
        tests: [
          mut('2 x 2', '[[1, 2], [3, 4]]', 'swap_axes(m)', '[[1, 3], [2, 4]]'),
          mut('3 x 3', '[[5, 1, 9], [2, 4, 8], [7, 3, 6]]', 'swap_axes(m)', '[[5, 2, 7], [1, 4, 3], [9, 8, 6]]'),
          mut('1 x 1', '[[0]]', 'swap_axes(m)', '[[0]]', true),
          mut('equal scores', '[[2, 2], [2, 2]]', 'swap_axes(m)', '[[2, 2], [2, 2]]', true),
          mut('4 x 4', '[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]', 'swap_axes(m)', '[[1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [4, 8, 12, 16]]', true),
        ],
        hints: ['Which cells keep their place, and how many times should each of the others move?'],
        explanation: 'A transpose in place: swap each pair once by visiting only the cells above the diagonal.',
      }),
      write({
        id: 'mx-c-half-turn',
        title: 'Check: a half turn',
        skills: ['matrix_transform', 'list_iterate'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 2,
        minutes: 5,
        prompt: 'Write `half_turn(m)` that rotates a matrix by 180 degrees in place, as if the sheet of paper were turned upside down on the desk. Return nothing. The matrix does not have to be square.\n\n`[[1, 2, 3], [4, 5, 6]]` becomes `[[6, 5, 4], [3, 2, 1]]`.',
        starterCode: `def half_turn(m):
    pass`,
        solution: `def half_turn(m):
    m.reverse()
    for row in m:
        row.reverse()`,
        tests: [
          mut('2 x 3', '[[1, 2, 3], [4, 5, 6]]', 'half_turn(m)', '[[6, 5, 4], [3, 2, 1]]'),
          mut('2 x 2', '[[1, 2], [3, 4]]', 'half_turn(m)', '[[4, 3], [2, 1]]'),
          mut('1 x 1', '[[8]]', 'half_turn(m)', '[[8]]', true),
          mut('one row', '[[1, 2, 3]]', 'half_turn(m)', '[[3, 2, 1]]', true),
          mut('one column', '[[1], [2], [3]]', 'half_turn(m)', '[[3], [2], [1]]', true),
          mut('3 x 3', '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]', 'half_turn(m)', '[[9, 8, 7], [6, 5, 4], [3, 2, 1]]', true),
        ],
        hints: ['Where does the top-left value end up? Try reaching that position with two simple moves you already know.'],
        explanation: 'A half turn is two reversals: the order of the rows, and the inside of every row. Either order works.',
      }),
      write({
        id: 'mx-c-frame',
        title: 'Check: around the frame, the other way',
        skills: ['matrix_layers', 'grid_nested', 'range', 'edge_cases'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 4,
        minutes: 12,
        prompt: 'Write `frame(m)` returning the outside ring of a matrix, each cell once, **anticlockwise** starting from the top-left cell: down the left side, along the bottom, up the right side, back along the top.\n\n`frame([[1, 2, 3], [4, 5, 6], [7, 8, 9]])` is `[1, 4, 7, 8, 9, 6, 3, 2]`. The matrix can be any size, including a single row or a single column.',
        starterCode: `def frame(m):
    pass`,
        solution: `def frame(m):
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    out = []
    for r in range(top, bottom + 1):
        out.append(m[r][left])
    for c in range(left + 1, right + 1):
        out.append(m[bottom][c])
    if left < right:
        for r in range(bottom - 1, top - 1, -1):
            out.append(m[r][right])
    if top < bottom:
        for c in range(right - 1, left, -1):
            out.append(m[top][c])
    return out`,
        tests: [
          t.eq('frame([[1, 2, 3], [4, 5, 6], [7, 8, 9]])', '[1, 4, 7, 8, 9, 6, 3, 2]'),
          t.eq('frame([[1, 2], [3, 4]])', '[1, 3, 4, 2]'),
          t.hidden('frame([[1, 2, 3]])', '[1, 2, 3]'),
          t.hidden('frame([[1], [2], [3]])', '[1, 2, 3]'),
          t.hidden('frame([[5]])', '[5]'),
          t.hidden('frame([[1, 2, 3, 4], [5, 6, 7, 8]])', '[1, 5, 6, 7, 8, 4, 3, 2]'),
          t.hidden('frame([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]])', '[1, 5, 9, 10, 11, 12, 8, 4, 3, 2]'),
        ],
        hints: ['Four walks, each ending where the next begins. What happens to the third and fourth when the matrix is one row tall or one column wide?'],
        explanation: 'Each corner belongs to exactly one walk, and the last two walks only run when there really is a second column or a second row to read.',
      }),
      write({
        id: 'mx-c-warm-up',
        title: 'Check: heaters',
        skills: ['matrix_marking', 'set_add', 'set_membership', 'grid_nested'],
        stage: 'retrieval',
        repType: 'cold',
        difficulty: 3,
        minutes: 11,
        prompt: 'A room is a matrix of temperatures, all positive, except that a `0` marks a heater. Write `warm_up(m)`: every cell that shares a row or a column with a heater goes up by 1. A cell goes up **once**, however many heaters it lines up with, and heaters stay `0`. Change `m` in place and return nothing.\n\n`[[0, 5], [5, 5]]` becomes `[[0, 6], [6, 5]]`.',
        starterCode: `def warm_up(m):
    pass`,
        solution: `def warm_up(m):
    rows, cols = set(), set()
    for r in range(len(m)):
        for c in range(len(m[0])):
            if m[r][c] == 0:
                rows.add(r)
                cols.add(c)
    for r in range(len(m)):
        for c in range(len(m[0])):
            if m[r][c] != 0 and (r in rows or c in cols):
                m[r][c] += 1`,
        tests: [
          mut('one heater', '[[0, 5], [5, 5]]', 'warm_up(m)', '[[0, 6], [6, 5]]'),
          mut('two heaters', '[[0, 5], [5, 0]]', 'warm_up(m)', '[[0, 6], [6, 0]]'),
          mut('no heater', '[[3, 4], [5, 6]]', 'warm_up(m)', '[[3, 4], [5, 6]]', true),
          mut('only a heater', '[[0]]', 'warm_up(m)', '[[0]]', true),
          mut('heaters in one row', '[[0, 2, 0], [1, 1, 1]]', 'warm_up(m)', '[[0, 3, 0], [2, 1, 2]]', true),
          mut('a heater in the middle', '[[1, 1, 1], [1, 0, 1], [1, 1, 1]]', 'warm_up(m)', '[[1, 2, 1], [2, 0, 2], [1, 2, 1]]', true),
        ],
        hints: ['Decide which rows and columns are heated before any temperature changes.'],
        explanation: 'Heating cells as heaters are found would warm some cells twice. Two sets recorded first make each cell a single yes-or-no question.',
      }),
    ],
  },

  // ───────────────────────────── LC 48 Rotate Image ─────────────────────────────
  {
    id: 'br-48',
    module: GRIDS,
    title: 'Toward Rotate Image',
    summary: 'A quarter turn is two flips you already own, done one after the other.',
    exercises: [
      output({
        id: 'b48-trace-two-flips',
        title: 'Trace: transpose, then reverse each row',
        skills: ['matrix_transform', 'grid_nested'],
        prompt: 'Two moves from the ladder, one after the other. Predict the output, then look at where the old top row `1 2 3` ended up.',
        code: `m = [[1, 2, 3],
     [4, 5, 6],
     [7, 8, 9]]
n = len(m)
for r in range(n):
    for c in range(r + 1, n):
        m[r][c], m[c][r] = m[c][r], m[r][c]
print(m[0])
for row in m:
    row.reverse()
for row in m:
    print(row)`,
        expectedOutput: `[1, 4, 7]
[7, 4, 1]
[8, 5, 2]
[9, 6, 3]`,
        note: 'Transpose turns rows into columns. A reversal then decides which way the picture has turned.',
        explanation: 'The old top row `1 2 3` now runs down the right-hand side: the matrix has turned a quarter turn clockwise, with no second matrix.',
        minutes: 2.5,
      }),
      write({
        id: 'b48-turn-left',
        title: 'A quarter turn to the left',
        skills: ['matrix_transform', 'grid_nested', 'range'],
        stage: 'pattern',
        repType: 'pattern',
        important: true,
        difficulty: 3,
        minutes: 8,
        prompt: 'Write `turn_left(m)` that rotates a square matrix a quarter turn **anticlockwise** in place, using no second matrix. Return nothing.\n\n`[[1, 2], [3, 4]]` becomes `[[2, 4], [1, 3]]`: the old top row now runs **up** the left-hand side.\n\nWork it out on paper with the two flips first: after the transpose, which reversal puts `2` in the top-left corner?',
        starterCode: `def turn_left(m):
    pass`,
        solution: `def turn_left(m):
    n = len(m)
    for r in range(n):
        for c in range(r + 1, n):
            m[r][c], m[c][r] = m[c][r], m[r][c]
    m.reverse()`,
        tests: [
          mut('2 x 2', '[[1, 2], [3, 4]]', 'turn_left(m)', '[[2, 4], [1, 3]]'),
          mut('3 x 3', '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]', 'turn_left(m)', '[[3, 6, 9], [2, 5, 8], [1, 4, 7]]'),
          mut('1 x 1', '[[4]]', 'turn_left(m)', '[[4]]', true),
          mut('4 x 4', '[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]', 'turn_left(m)', '[[4, 8, 12, 16], [3, 7, 11, 15], [2, 6, 10, 14], [1, 5, 9, 13]]', true),
          mut('all the same', '[[7, 7], [7, 7]]', 'turn_left(m)', '[[7, 7], [7, 7]]', true),
          t.check('four turns bring it home', 'm = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nfor _ in range(4):\n    turn_left(m)\nassert m == [[1, 2, 3], [4, 5, 6], [7, 8, 9]], f"after four turns the matrix is {m}"', true),
        ],
        hints: [
          'It is two in-place moves from the ladder, one after the other.',
          'Transpose `[[1, 2], [3, 4]]` by hand. Compare what you get with the answer you want.',
          'One kind of reversal gives the clockwise turn. The other kind gives this one.',
        ],
        explanation: 'After a transpose, reversing each row turns the picture clockwise, and reversing the order of the rows turns it anticlockwise.',
      }),
    ],
  },

  // ───────────────────────────── LC 54 Spiral Matrix ─────────────────────────────
  {
    id: 'br-54',
    module: GRIDS,
    title: 'Toward Spiral Matrix',
    summary: 'Ring after ring: repeat the four edge walks while the bounds have not crossed.',
    exercises: [
      debug({
        id: 'b54-dbg-centre',
        title: 'Debug: the missing middle',
        skills: ['matrix_layers', 'while_loop', 'accumulator'],
        difficulty: 3,
        minutes: 5,
        prompt: '`ring_sums(m)` should return the total of each ring of a matrix, from the outside ring inward. For `[[1, 2, 3], [4, 5, 6], [7, 8, 9]]` the outside ring adds up to 40 and the middle cell is a ring of its own, so the answer is `[40, 5]`. Fix it.',
        brokenCode: `def ring_sums(m):
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    sums = []
    while top < bottom and left < right:
        total = 0
        for c in range(left, right + 1):
            total += m[top][c]
        top += 1
        for r in range(top, bottom + 1):
            total += m[r][right]
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                total += m[bottom][c]
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                total += m[r][left]
            left += 1
        sums.append(total)
    return sums`,
        solution: `def ring_sums(m):
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    sums = []
    while top <= bottom and left <= right:
        total = 0
        for c in range(left, right + 1):
            total += m[top][c]
        top += 1
        for r in range(top, bottom + 1):
            total += m[r][right]
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                total += m[bottom][c]
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                total += m[r][left]
            left += 1
        sums.append(total)
    return sums`,
        tests: [
          t.eq('ring_sums([[1, 2, 3], [4, 5, 6], [7, 8, 9]])', '[40, 5]'),
          t.eq('ring_sums([[1, 2], [3, 4]])', '[10]'),
          t.eq('ring_sums([[1, 2, 3]])', '[6]'),
          t.hidden('ring_sums([[4]])', '[4]'),
          t.hidden('ring_sums([[1], [2], [3]])', '[6]'),
          t.hidden('ring_sums([[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]])', '[12, 4]'),
          t.hidden('ring_sums([[1, 1, 1, 1], [1, 2, 3, 1], [1, 1, 1, 1]])', '[10, 5]'),
        ],
        hints: [
          'What are `top`, `bottom`, `left` and `right` when only the middle cell is left?',
          'When two bounds are equal, is there still something between them to read?',
        ],
        explanation: 'The bounds are inclusive: `top == bottom` still fences in one row. The loop runs while the bounds have not crossed, which is `<=`.',
      }),
      write({
        id: 'b54-spiral-fill',
        title: 'Number the seats in a spiral',
        skills: ['matrix_layers', 'grid_nested', 'while_loop', 'list_comprehension'],
        stage: 'pattern',
        repType: 'pattern',
        important: true,
        difficulty: 4,
        minutes: 15,
        prompt: 'Write `spiral_fill(rows, cols)` that builds a new `rows` x `cols` matrix and writes the numbers 1, 2, 3, ... into it along a clockwise spiral that starts at the top-left cell and winds inward.\n\n`spiral_fill(3, 3)` is `[[1, 2, 3], [8, 9, 4], [7, 6, 5]]` and `spiral_fill(1, 3)` is `[[1, 2, 3]]`. `rows` and `cols` are at least 1.',
        starterCode: `def spiral_fill(rows, cols):
    pass`,
        solution: `def spiral_fill(rows, cols):
    m = [[0] * cols for _ in range(rows)]
    top, bottom = 0, rows - 1
    left, right = 0, cols - 1
    k = 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            m[top][c] = k
            k += 1
        top += 1
        for r in range(top, bottom + 1):
            m[r][right] = k
            k += 1
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                m[bottom][c] = k
                k += 1
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                m[r][left] = k
                k += 1
            left += 1
    return m`,
        tests: [
          t.eq('spiral_fill(3, 3)', '[[1, 2, 3], [8, 9, 4], [7, 6, 5]]'),
          t.eq('spiral_fill(1, 3)', '[[1, 2, 3]]'),
          t.eq('spiral_fill(2, 2)', '[[1, 2], [4, 3]]'),
          t.hidden('spiral_fill(1, 1)', '[[1]]'),
          t.hidden('spiral_fill(3, 1)', '[[1], [2], [3]]'),
          t.hidden('spiral_fill(2, 3)', '[[1, 2, 3], [6, 5, 4]]'),
          t.hidden('spiral_fill(3, 4)', '[[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]]'),
          t.hidden('spiral_fill(4, 4)', '[[1, 2, 3, 4], [12, 13, 14, 5], [11, 16, 15, 6], [10, 9, 8, 7]]'),
          t.hidden('spiral_fill(4, 3)', '[[1, 2, 3], [10, 11, 4], [9, 12, 5], [8, 7, 6]]'),
        ],
        hints: [
          'Build the empty matrix first, with a separate list for every row.',
          'Four bounds and one counter. Each trip round the loop writes one ring.',
          'Walk an edge, writing and counting, then move the bound for that edge inward.',
          'Before the bottom walk and before the left walk, make sure a row or a column is really still there.',
        ],
        explanation: 'The four edge walks sit inside a loop that runs while the bounds have not crossed, each walk followed by its own bound moving in. The two guards stop a last single row or column being written twice.',
      }),
    ],
  },

  // ───────────────────────────── LC 73 Set Matrix Zeroes ─────────────────────────────
  {
    id: 'br-73',
    module: GRIDS,
    title: 'Toward Set Matrix Zeroes',
    summary: 'Mark first with no extra sets: the first row and first column hold the marks, and two flags remember their own fate.',
    exercises: [
      write({
        id: 'b73-edge-flags',
        title: 'Do the first row and column hold a zero?',
        skills: ['matrix_marking', 'grid_nested', 'for_loop'],
        difficulty: 2,
        minutes: 5.5,
        prompt: 'Write `edge_flags(m)` returning two booleans: whether the **first row** of `m` contains a `0`, and whether the **first column** contains a `0`.\n\n`edge_flags([[1, 0], [1, 1]])` is `(True, False)`. `edge_flags([[0, 1], [1, 1]])` is `(True, True)`: the corner belongs to both.',
        starterCode: `def edge_flags(m):
    pass`,
        solution: `def edge_flags(m):
    row_zero = 0 in m[0]
    col_zero = False
    for r in range(len(m)):
        if m[r][0] == 0:
            col_zero = True
    return row_zero, col_zero`,
        tests: [
          t.eq('edge_flags([[1, 0], [1, 1]])', '(True, False)'),
          t.eq('edge_flags([[1, 1], [0, 1]])', '(False, True)'),
          t.eq('edge_flags([[0, 1], [1, 1]])', '(True, True)'),
          t.hidden('edge_flags([[1]])', '(False, False)'),
          t.hidden('edge_flags([[5, 5], [5, 0]])', '(False, False)'),
          t.hidden('edge_flags([[2, 3, 0]])', '(True, False)'),
          t.hidden('edge_flags([[2], [0], [4]])', '(False, True)'),
          t.hidden('edge_flags([[0]])', '(True, True)'),
        ],
        hints: ['The first row is one list, so one membership test covers it.', 'The first column is spread over every row: the first item of each.'],
        explanation: 'Two separate answers, because the first row and the first column can need different treatment even though they share the corner cell.',
      }),
      debug({
        id: 'b73-dbg-late-flags',
        title: 'Debug: paint that spills too far',
        skills: ['matrix_marking', 'grid_nested', 'state_tracking'],
        difficulty: 3,
        minutes: 5,
        prompt: 'A floor plan is a matrix of `0` (clean) and `1` (paint). `spill(m)` should turn every row and every column that contains an original `1` into all `1`s, in place, without building any extra sets: it uses the first row and first column of `m` as its notepad.\n\n`[[0, 0], [0, 1]]` should become `[[0, 1], [1, 1]]`. Fix it.',
        brokenCode: `def spill(m):
    rows, cols = len(m), len(m[0])
    for r in range(1, rows):
        for c in range(1, cols):
            if m[r][c] == 1:
                m[r][0] = 1
                m[0][c] = 1
    row_hit = 1 in m[0]
    col_hit = False
    for r in range(rows):
        if m[r][0] == 1:
            col_hit = True
    for r in range(1, rows):
        for c in range(1, cols):
            if m[r][0] == 1 or m[0][c] == 1:
                m[r][c] = 1
    if row_hit:
        for c in range(cols):
            m[0][c] = 1
    if col_hit:
        for r in range(rows):
            m[r][0] = 1`,
        solution: `def spill(m):
    rows, cols = len(m), len(m[0])
    row_hit = 1 in m[0]
    col_hit = False
    for r in range(rows):
        if m[r][0] == 1:
            col_hit = True
    for r in range(1, rows):
        for c in range(1, cols):
            if m[r][c] == 1:
                m[r][0] = 1
                m[0][c] = 1
    for r in range(1, rows):
        for c in range(1, cols):
            if m[r][0] == 1 or m[0][c] == 1:
                m[r][c] = 1
    if row_hit:
        for c in range(cols):
            m[0][c] = 1
    if col_hit:
        for r in range(rows):
            m[r][0] = 1`,
        tests: [
          mut('paint in the far corner', '[[0, 0], [0, 1]]', 'spill(m)', '[[0, 1], [1, 1]]'),
          mut('paint in the first row', '[[0, 1], [0, 0]]', 'spill(m)', '[[1, 1], [0, 1]]'),
          mut('paint in the middle', '[[0, 0, 0], [0, 1, 0], [0, 0, 0]]', 'spill(m)', '[[0, 1, 0], [1, 1, 1], [0, 1, 0]]'),
          mut('no paint', '[[0, 0], [0, 0]]', 'spill(m)', '[[0, 0], [0, 0]]', true),
          mut('paint in the top-left corner', '[[1, 0, 0], [0, 0, 0]]', 'spill(m)', '[[1, 1, 1], [1, 0, 0]]', true),
          mut('paint in the first column', '[[0, 0, 0], [1, 0, 0], [0, 0, 0]]', 'spill(m)', '[[1, 0, 0], [1, 1, 1], [1, 0, 0]]', true),
          mut('one cell', '[[1]]', 'spill(m)', '[[1]]', true),
          mut('two spills', '[[0, 0, 0], [0, 1, 0], [0, 0, 1]]', 'spill(m)', '[[0, 1, 1], [1, 1, 1], [1, 1, 1]]', true),
        ],
        hints: [
          'Print `m` right after the first pair of loops. Which cells did the notes land in?',
          '`row_hit` is meant to say whether the first row had paint to begin with. When is that still knowable?',
        ],
        explanation: 'Once notes are written into the first row and column, they can no longer be told apart from original paint. The two flags must be read before the first note is written.',
      }),
      write({
        id: 'b73-blackout',
        title: 'Blackout, with no notepad',
        skills: ['matrix_marking', 'grid_nested', 'state_tracking', 'edge_cases'],
        stage: 'pattern',
        repType: 'pattern',
        important: true,
        difficulty: 4,
        minutes: 15,
        prompt: 'A wall of lamps is a matrix of booleans: `True` is lit, `False` is a blown lamp. A blown lamp takes out its whole row and its whole column. Write `blackout(lights)` that switches off (`False`) every lamp in a row or column that had a blown lamp to begin with, in place. Return nothing.\n\n`[[True, True], [True, False]]` becomes `[[True, False], [False, False]]`.\n\nDo it without any sets or extra lists: only the matrix itself and a couple of single variables.',
        starterCode: `def blackout(lights):
    pass`,
        solution: `def blackout(lights):
    rows, cols = len(lights), len(lights[0])
    row_off = False in lights[0]
    col_off = False
    for r in range(rows):
        if not lights[r][0]:
            col_off = True
    for r in range(1, rows):
        for c in range(1, cols):
            if not lights[r][c]:
                lights[r][0] = False
                lights[0][c] = False
    for r in range(1, rows):
        for c in range(1, cols):
            if not lights[r][0] or not lights[0][c]:
                lights[r][c] = False
    if row_off:
        for c in range(cols):
            lights[0][c] = False
    if col_off:
        for r in range(rows):
            lights[r][0] = False`,
        tests: [
          mut('blown lamp in the far corner', '[[True, True], [True, False]]', 'blackout(m)', '[[True, False], [False, False]]'),
          mut('blown lamp in the first row', '[[True, False], [True, True]]', 'blackout(m)', '[[False, False], [True, False]]'),
          mut('blown lamp in the middle', '[[True, True, True], [True, False, True], [True, True, True]]', 'blackout(m)', '[[True, False, True], [False, False, False], [True, False, True]]'),
          mut('all lit', '[[True, True], [True, True]]', 'blackout(m)', '[[True, True], [True, True]]', true),
          mut('blown lamp in the top-left corner', '[[False, True, True], [True, True, True]]', 'blackout(m)', '[[False, False, False], [False, True, True]]', true),
          mut('blown lamp in the first column', '[[True, True, True], [False, True, True], [True, True, True]]', 'blackout(m)', '[[False, True, True], [False, False, False], [False, True, True]]', true),
          mut('one lit lamp', '[[True]]', 'blackout(m)', '[[True]]', true),
          mut('one blown lamp', '[[False]]', 'blackout(m)', '[[False]]', true),
          mut('a single row', '[[True, False, True]]', 'blackout(m)', '[[False, False, False]]', true),
          mut('two blown lamps', '[[True, True, True], [True, False, True], [True, True, False]]', 'blackout(m)', '[[True, False, False], [False, False, False], [False, False, False]]', true),
        ],
        hints: [
          'With sets you would note the bad rows and columns somewhere else. Here the notes go in the first cell of each row and the top cell of each column.',
          'Those cells are about to be overwritten with notes, so first remember what the first row and first column looked like on their own.',
          'Note-taking and switching off only look at the cells from row 1 and column 1 onward.',
          'The first row and the first column are dealt with last, each from its own remembered answer.',
        ],
        explanation: 'Four steps in a fixed order: remember the first row and column, write the notes into them, switch off the inner cells from the notes, and only then switch off the first row and column themselves.',
      }),
    ],
  },
]

export const pack: Pack = {
  sections,
  bridges: [
    {
      lc: 39,
      title: 'Combination Sum',
      unit: 'Backtracking',
      section: 'br-39',
      mode: 'bridge-first',
      prerequisiteSkills: ['backtracking_state', 'recursion_base_case', 'combination_start', 'range'],
      blocks: [
        { label: 'choose, recurse and un-choose with one path', skills: ['backtracking_state', 'recursion_base_case'], evidence: ['cap-subsets', 'd10b-step-plans'] },
        { label: 'keep picks from going backwards with a start index', skills: ['combination_start', 'backtracking_state'], evidence: ['d10-ps-combos', 'd10-sub-loop-style'] },
        { label: 'pass i to reuse a number, i + 1 to use it once', skills: ['combination_start'], reps: ['b39-trace-start', 'b39-scoops'] },
        { label: 'carry the remaining total and stop below zero', skills: ['combination_start', 'recursion_base_case'], reps: ['b39-exact-loads'] },
        { label: 'list each combination once, whatever the order', skills: ['combination_start'], reps: ['b39-dbg-orders', 'b39-count-ways'] },
      ],
    },
    {
      lc: 79,
      title: 'Word Search',
      unit: 'Backtracking',
      section: 'br-79',
      mode: 'bridge-first',
      prerequisiteSkills: ['grid_nested', 'grid_neighbors', 'backtracking_state', 'grid_backtracking', 'visited_set'],
      blocks: [
        { label: 'step to the four neighbours and stay in bounds', skills: ['grid_nested', 'grid_neighbors'], evidence: ['o7-n-list', 'o7-i-sink-dfs'] },
        { label: 'check a cell: in bounds, right letter, not used', skills: ['grid_backtracking', 'grid_neighbors'], reps: ['b79-cell-ok'] },
        { label: 'recurse from a cell for the next letter', skills: ['grid_backtracking', 'recursion_base_case'], reps: ['b79-spell-right-down'] },
        { label: 'mark the cell, try the neighbours, unmark it', skills: ['grid_backtracking', 'backtracking_state'], reps: ['b79-dbg-no-unmark', 'b79-longest-trail'] },
        { label: 'try every cell as the start', skills: ['grid_backtracking', 'grid_nested'], reps: ['b79-has-snake'] },
      ],
    },
    {
      lc: 48,
      title: 'Rotate Image',
      unit: 'Matrix',
      section: 'br-48',
      mode: 'bridge-first',
      prerequisiteSkills: ['grid_nested', 'matrix_transform', 'range'],
      blocks: [
        { label: 'transpose a square matrix in place', skills: ['matrix_transform', 'grid_nested'], evidence: ['mx-t-transpose', 'mx-c-swap-axes'] },
        { label: 'reverse each row, or the order of the rows', skills: ['matrix_transform'], evidence: ['mx-t-reverse-rows', 'mx-t-flip-rows'] },
        { label: 'see a quarter turn as two flips', skills: ['matrix_transform'], reps: ['b48-trace-two-flips', 'b48-turn-left'] },
      ],
    },
    {
      lc: 54,
      title: 'Spiral Matrix',
      unit: 'Matrix',
      section: 'br-54',
      mode: 'bridge-first',
      prerequisiteSkills: ['grid_nested', 'range', 'while_loop', 'matrix_layers'],
      blocks: [
        { label: 'walk one edge between two bounds', skills: ['matrix_layers', 'grid_nested'], evidence: ['mx-l-bottom-edge', 'mx-l-left-edge'] },
        { label: 'guard a single remaining row or column', skills: ['matrix_layers'], evidence: ['mx-l-dbg-single-row', 'mx-c-frame'] },
        { label: 'loop while the bounds have not crossed', skills: ['matrix_layers', 'while_loop'], reps: ['b54-dbg-centre'] },
        { label: 'chain the four walks, shrinking a bound after each', skills: ['matrix_layers', 'while_loop'], reps: ['b54-spiral-fill'] },
      ],
    },
    {
      lc: 73,
      title: 'Set Matrix Zeroes',
      unit: 'Matrix',
      section: 'br-73',
      mode: 'bridge-first',
      prerequisiteSkills: ['grid_nested', 'set_add', 'set_membership', 'matrix_marking'],
      blocks: [
        { label: 'collect the rows and columns to change, then change them', skills: ['matrix_marking', 'set_add', 'set_membership'], evidence: ['mx-m-lines-with', 'mx-c-warm-up'] },
        { label: 'remember whether the first row and column need changing', skills: ['matrix_marking', 'grid_nested'], reps: ['b73-edge-flags'] },
        { label: 'read those two answers before writing any marks', skills: ['matrix_marking'], reps: ['b73-dbg-late-flags'] },
        { label: 'use the first row and column as the marks', skills: ['matrix_marking', 'grid_nested'], reps: ['b73-blackout'] },
      ],
    },
  ],
  units: {
    Backtracking: { check: 'd10b-check' },
    Matrix: { ladder: ['mx-transform', 'mx-layers', 'mx-marking'], check: 'mx-check' },
  },
  briefs: {
    // ── Backtracking check ──
    'd10b-step-plans': {
      inputs: [{ name: 'n', is: 'how many steps there are to climb, `0` or more' }],
      returns: 'a **list of lists**. Each inner list is one plan: the step sizes (1s and 2s) in the order they are taken, adding up to `n`.',
      catch: 'With `n = 0` there is exactly one plan: take no steps at all. What does that plan look like as a list?',
    },
    'd10b-selections': {
      inputs: [{ name: 'extras', is: 'a list of different strings, possibly empty' }],
      returns: 'a **list of lists**: every possible choice of extras, from none of them to all of them. Order does not matter.',
      catch: 'One list is being built and un-built the whole time. What exactly do you store when a selection is complete?',
    },
    'd10b-seatings': {
      inputs: [{ name: 'names', is: 'a list of different strings, possibly empty' }],
      returns: 'a **list of lists**: every arrangement that uses each name exactly once.',
      catch: 'Unlike a selection, the first seat can go to anyone, not just the first name. How do you know who is already seated?',
    },
    'd10b-quiet-codes': {
      inputs: [{ name: 'n', is: 'the length of every code, `0` or more' }],
      returns: "a **list of strings** made of `'0'` and `'1'`, each of length `n`, none with two `'1'`s side by side.",
      catch: 'The rule only ever depends on the last character chosen. What if nothing has been chosen yet?',
    },
    // ── LC 39 ──
    'b39-trace-start': {
      task: PREDICT,
      catch: 'After picking the item at position `i`, which positions may the next pick come from?',
    },
    'b39-scoops': {
      inputs: [
        { name: 'flavors', is: 'a list of different flavor names' },
        { name: 'k', is: 'how many scoops go in a bowl' },
      ],
      returns: 'a **list of lists**: every bowl of `k` scoops. The same flavor may appear several times in a bowl. Two bowls with the same scoops in another order count as one.',
      catch: 'Two things must hold at once: a flavor can be picked again, and an earlier flavor can never be picked after a later one.',
    },
    'b39-exact-loads': {
      inputs: [
        { name: 'weights', is: 'a list of different positive whole numbers, one per crate' },
        { name: 'limit', is: 'the exact total weight wanted' },
      ],
      returns: 'a **list of lists**: every group of crates whose weights add up to exactly `limit`, each crate used at most once.',
      catch: 'A branch can end in two different ways. Which one is an answer, and which one is just a dead end?',
    },
    'b39-dbg-orders': {
      task: 'The code finds every right bundle but lists some of them more than once. Make each bundle appear exactly once.',
      inputs: [
        { name: 'sizes', is: 'a list of different positive pack sizes; each may be used any number of times' },
        { name: 'total', is: 'how many items the bundle must hold in all' },
      ],
      returns: 'a **list of lists**: every bundle of packs adding up to `total`, each listed once.',
      catch: 'Look at the repeated answers. They are the same packs in a different order: which line lets a pick go back to an earlier size?',
    },
    'b39-count-ways': {
      inputs: [
        { name: 'coins', is: 'a list of different positive coin values; use each as often as you like' },
        { name: 'amount', is: 'the total to pay, `0` or more' },
      ],
      returns: 'a **number**: how many different handfuls of coins add up to exactly `amount`.',
      catch: 'Paying nothing can be done in exactly one way. And `1 + 2` is the same handful as `2 + 1`: how do you avoid counting it twice?',
    },
    // ── LC 79 ──
    'b79-cell-ok': {
      inputs: [
        { name: 'grid', is: 'a list of strings, all the same length; each character is one cell' },
        { name: 'r', is: 'a row number, which may be off the grid' },
        { name: 'c', is: 'a column number, which may be off the grid' },
        { name: 'ch', is: 'the letter wanted in that cell' },
        { name: 'used', is: 'a set of `(row, column)` pairs that may not be stepped on' },
      ],
      returns: '`True` only when the position is on the grid, holds `ch`, and is not in `used`. Otherwise `False`.',
      catch: 'What does Python do with an index of `-1`? It is not an error.',
    },
    'b79-spell-right-down': {
      inputs: [
        { name: 'grid', is: 'a list of strings, all the same length' },
        { name: 'r', is: 'the row of the starting cell' },
        { name: 'c', is: 'the column of the starting cell' },
        { name: 'word', is: 'the word to read; its first letter must be on the starting cell' },
      ],
      returns: '`True` if the word can be read by stepping right or down for each next letter, otherwise `False`.',
      catch: 'The word can run off the bottom or the right edge before it is finished. Which do you test first: the cell, or whether it exists?',
    },
    'b79-dbg-no-unmark': {
      task: 'The search says no for some words that can be read. Make it find them, still without using a cell twice in one route.',
      inputs: [
        { name: 'grid', is: 'a list of strings, all the same length' },
        { name: 'r', is: 'the row of the starting cell' },
        { name: 'c', is: 'the column of the starting cell' },
        { name: 'word', is: 'the word to read, one neighbouring cell per letter' },
      ],
      returns: '`True` if some route spells the word, otherwise `False`.',
      catch: 'Follow the first route it tries until it gets stuck. Which cells does the code still believe are taken afterwards?',
    },
    'b79-longest-trail': {
      inputs: [
        { name: 'grid', is: "a list of strings: `'.'` is floor, `'#'` is a wall" },
        { name: 'r', is: 'the row of the starting cell' },
        { name: 'c', is: 'the column of the starting cell' },
      ],
      returns: 'a **number**: the most cells one walk can cover from the start, counting the start, with no cell stepped on twice.',
      catch: 'This is not "how many cells can be reached". A walk that turns into a dead end cannot come back out. So when is a cell free again?',
    },
    'b79-has-snake': {
      inputs: [
        { name: 'grid', is: 'a list of strings, all the same length; each character is the colour of one cell' },
        { name: 'k', is: 'how many cells the snake must have, at least 1' },
      ],
      returns: '`True` if some chain of `k` different neighbouring cells of one colour exists, otherwise `False`.',
      catch: 'A snake is not a blob: it cannot branch, and it cannot use a cell twice. A 2 x 2 block of one colour holds a snake of 4, not of 5.',
    },
    // ── Matrix ladder ──
    'mx-t-swap-cells': {
      inputs: [
        { name: 'm', is: 'a matrix: a list of rows, each row a list' },
        { name: 'r1', is: 'row of the first cell' },
        { name: 'c1', is: 'column of the first cell' },
        { name: 'r2', is: 'row of the second cell' },
        { name: 'c2', is: 'column of the second cell' },
      ],
      returns: 'nothing. Afterwards `m` itself has the two values exchanged.',
      catch: 'If you copy one value over the other first, what is left to copy back?',
    },
    'mx-t-transpose': {
      inputs: [{ name: 'm', is: 'a square matrix (as many rows as columns)' }],
      returns: 'nothing. Afterwards `m` itself is flipped across the diagonal that runs from top-left to bottom-right.',
      catch: 'Every cell off the diagonal has exactly one partner. How do you make sure each pair is swapped once and not twice?',
    },
    'mx-t-dbg-twice': {
      task: 'The function runs but the matrix comes out exactly as it went in. Make it flip across the diagonal.',
      inputs: [{ name: 'm', is: 'a square matrix' }],
      returns: 'nothing. Afterwards rows have become columns inside `m`.',
      catch: 'Each swap on its own is right. Count how many times one particular pair of cells gets swapped.',
    },
    'mx-t-reverse-rows': {
      inputs: [{ name: 'm', is: 'a matrix of any shape' }],
      returns: 'nothing. Afterwards every row of `m` reads backwards; the rows stay in the same order.',
      catch: 'Making a reversed copy of a row is not the same as reversing the row the matrix holds.',
    },
    'mx-t-flip-rows': {
      inputs: [{ name: 'm', is: 'a matrix of any shape' }],
      returns: 'nothing. Afterwards the rows of `m` are in the opposite order; each row is unchanged inside.',
      catch: 'With an odd number of rows, what should happen to the middle one?',
    },
    'mx-l-trace': {
      task: PREDICT,
      catch: 'The second loop starts from `top` after it has changed. Which cell does that skip?',
    },
    'mx-l-top-edge': {
      inputs: [
        { name: 'm', is: 'a matrix' },
        { name: 'top', is: 'the row to read' },
        { name: 'left', is: 'the first column to read' },
        { name: 'right', is: 'the last column to read (included)' },
      ],
      returns: 'a **list** of the values in that row from `left` to `right`, in that order. Empty if `left` is past `right`.',
      catch: 'Both ends are included. Where does a `range` stop?',
    },
    'mx-l-bottom-edge': {
      inputs: [
        { name: 'm', is: 'a matrix' },
        { name: 'bottom', is: 'the row to read' },
        { name: 'left', is: 'the last column to read (included)' },
        { name: 'right', is: 'the first column to read' },
      ],
      returns: 'a **list** of the values in that row from `right` back to `left`. Empty if `left` is past `right`.',
      catch: 'Counting down, which number is "one past the end"?',
    },
    'mx-l-left-edge': {
      inputs: [
        { name: 'm', is: 'a matrix' },
        { name: 'left', is: 'the column to read' },
        { name: 'top', is: 'the last row to read (included)' },
        { name: 'bottom', is: 'the first row to read' },
      ],
      returns: 'a **list** of the values in that column from `bottom` up to `top`. Empty if `top` is past `bottom`.',
      catch: 'A column is not a list you can loop over directly. Which of the two indexes changes as you go?',
    },
    'mx-l-dbg-single-row': {
      task: 'The border comes out right for a full square but some shapes get cells listed twice. Make every border cell appear once.',
      inputs: [{ name: 'm', is: 'a matrix with at least one row and one column' }],
      returns: 'a **list**: the outside ring, clockwise from the top-left cell.',
      catch: 'Try the thinnest shapes you can think of. After the first walks, do the later walks still have anything new to read?',
    },
    'mx-m-lines-with': {
      inputs: [
        { name: 'm', is: 'a matrix' },
        { name: 'x', is: 'the value to look for' },
      ],
      returns: 'two **sets** as a pair: the numbers of the rows that contain `x`, then the numbers of the columns that contain `x`.',
      catch: 'Nothing in `m` changes here. It is a pure look-and-note pass.',
    },
    'mx-m-wipe': {
      inputs: [
        { name: 'm', is: 'a matrix of numbers' },
        { name: 'rows', is: 'a set of row numbers to clear' },
        { name: 'cols', is: 'a set of column numbers to clear' },
      ],
      returns: 'nothing. Afterwards every cell of `m` in a listed row or a listed column is `0`.',
      catch: 'A cell qualifies through its row, or through its column. It does not need both.',
    },
    'mx-m-dbg-flood': {
      task: 'A single star ends up filling the whole matrix. Make stars spread only along the rows and columns of the stars that were there at the start.',
      inputs: [{ name: 'm', is: "a matrix of `'.'` and `'*'`" }],
      returns: 'nothing. Afterwards `m` has a star in every cell that lines up with an original star.',
      catch: 'When the scan meets a star, can it tell whether that star was there at the start?',
    },
    'mx-m-open-seats': {
      inputs: [{ name: 'hall', is: "a list of strings, all the same length: `'X'` is a broken seat, `'.'` a good one" }],
      returns: 'a **number**: how many seats sit in a row with no broken seat and a column with no broken seat.',
      catch: 'A good seat can still be closed because of a broken one far away in its row or column.',
    },
    // ── Matrix check ──
    'mx-c-swap-axes': {
      inputs: [{ name: 'table', is: 'a square matrix of scores: row = player, column = round' }],
      returns: 'nothing. Afterwards `table` itself has row = round and column = player.',
      catch: 'No new table: the scores move inside the one you were given.',
    },
    'mx-c-half-turn': {
      inputs: [{ name: 'm', is: 'a matrix of any shape' }],
      returns: 'nothing. Afterwards `m` itself is rotated by 180 degrees.',
      catch: 'The first value must end up last, in the last row. Rows and columns both take part.',
    },
    'mx-c-frame': {
      inputs: [{ name: 'm', is: 'a matrix with at least one row and one column' }],
      returns: 'a **list**: the cells on the outside edge, each once, going down the left side first and round anticlockwise.',
      catch: 'What do the four sides look like when the matrix is a single row, or a single column?',
    },
    'mx-c-warm-up': {
      inputs: [{ name: 'm', is: 'a matrix of whole numbers: `0` is a heater, everything else is a positive temperature' }],
      returns: 'nothing. Afterwards every non-heater cell of `m` that lines up with a heater is 1 higher.',
      catch: 'A cell in line with two heaters still goes up by only 1.',
    },
    // ── LC 48 ──
    'b48-trace-two-flips': {
      task: PREDICT,
      catch: 'Do the swaps on paper first: after the double loop the rows have become columns. Then each row is reversed.',
    },
    'b48-turn-left': {
      inputs: [{ name: 'm', is: 'a square matrix' }],
      returns: 'nothing. Afterwards `m` itself is turned a quarter turn anticlockwise: the old top row runs up the left side.',
      catch: 'The trace before this one turned the matrix the other way. Exactly one of its two moves has to change.',
    },
    // ── LC 54 ──
    'b54-dbg-centre': {
      task: 'Some matrices come back with their innermost ring missing. Make every ring appear in the answer.',
      inputs: [{ name: 'm', is: 'a matrix of numbers with at least one row and one column' }],
      returns: 'a **list** of numbers: the total of each ring, outermost first.',
      catch: 'A single cell, a single row or a single column in the middle is still a ring. What do the four bounds look like around it?',
    },
    'b54-spiral-fill': {
      inputs: [
        { name: 'rows', is: 'how many rows the new matrix has, at least 1' },
        { name: 'cols', is: 'how many columns it has, at least 1' },
      ],
      returns: 'a new **matrix** holding 1 up to `rows * cols`, laid along a clockwise spiral from the top-left cell.',
      catch: 'Test a matrix that is one row tall. Does any number get written over by a later one?',
    },
    // ── LC 73 ──
    'b73-edge-flags': {
      inputs: [{ name: 'm', is: 'a matrix of numbers with at least one row and one column' }],
      returns: 'a pair of **booleans**: does the first row contain a `0`, and does the first column contain a `0`.',
      catch: 'The top-left cell is in the first row and in the first column.',
    },
    'b73-dbg-late-flags': {
      task: 'Paint in the inner part of the floor wrongly floods the whole first row and first column. Make only the rows and columns with original paint fill up.',
      inputs: [{ name: 'm', is: 'a matrix of `0` and `1`' }],
      returns: 'nothing. Afterwards `m` has a `1` in every cell that lines up with an original `1`.',
      catch: 'Every step is there. Ask of each one: what does it read, and has something already written over that?',
    },
    'b73-blackout': {
      inputs: [{ name: 'lights', is: 'a matrix of booleans: `True` lit, `False` blown' }],
      returns: 'nothing. Afterwards `lights` has `False` in every cell that lines up with a lamp that was blown at the start.',
      catch: 'If the first row and column carry your notes, how will you later know whether they had a blown lamp of their own?',
    },
  },
  primers: [
    {
      id: 'combination-start',
      title: 'Start index and reuse',
      skills: ['combination_start'],
      what: 'When the **order of picks does not matter**, plain backtracking builds the same group many times (`[2, 3]` and `[3, 2]`). The cure is a **start index**: each level may only pick from position `start` onward, so every group is built in list order, once. What you pass down decides reuse: `i + 1` means "that item is spent", `i` means "it may be picked again". Carrying the amount still allowed lets a branch stop the moment it overshoots.',
      model: 'Walking along a buffet in one direction: you may take more from the dish in front of you, but you never walk back.',
      syntax: [
        { code: 'def dfs(start, left):', note: 'Where the loop may begin, and how much is still allowed.' },
        { code: 'if left == 0:\n    res.append(path[:])\n    return', note: 'Exactly used up: save a copy.' },
        { code: 'if left < 0:\n    return', note: 'Overshot: this branch is dead.' },
        { code: 'for i in range(start, len(nums)):', note: 'Never look before `start`.' },
        { code: 'dfs(i + 1, left - nums[i])', note: 'Each item at most once.' },
        { code: 'dfs(i, left - nums[i])', note: 'The same item may be picked again.' },
      ],
      example: {
        code: `# Every way to pack different weights without going over 6 kg
weights = [2, 3, 4]
bag = []

def pack(start, room):
    print(bag, 'room left', room)
    for i in range(start, len(weights)):
        if weights[i] > room:
            continue
        bag.append(weights[i])
        pack(i + 1, room - weights[i])   # i + 1: each weight once
        bag.pop()

pack(0, 6)`,
        output: `[] room left 6
[2] room left 4
[2, 3] room left 1
[2, 4] room left 0
[3] room left 3
[4] room left 2`,
      },
      gotchas: [
        'Looping from `0` at every level builds each group once per ordering. The loop starts at `start`.',
        'Passing `start` instead of `i` to the recursive call lets a pick go backwards again. Pass `i` or `i + 1`.',
        'With reuse (`i`) and no "overshot" check, the recursion never ends: the same item is taken forever.',
        'Reuse only terminates because every item is positive, so the remaining amount always shrinks.',
      ],
    },
    {
      id: 'grid-backtracking',
      title: 'Backtracking on a grid',
      skills: ['grid_backtracking'],
      what: 'Some grid questions ask for one **route** that may not use a cell twice. A plain visited set is wrong here: a cell on a failed route must be free again for the next route. So the cell is **marked** on the way in, its four neighbours are tried for the next step, and it is **unmarked** on the way back. The path list of ordinary backtracking has become the set of cells currently stood on.',
      model: 'Laying a rope through a maze: the rope lies on a cell while you explore beyond it, and you pick it up again as you retreat.',
      syntax: [
        { code: 'if r < 0 or r >= rows or c < 0 or c >= cols:\n    return False', note: 'Off the grid: test this before reading the cell.' },
        { code: 'if (r, c) in used:\n    return False', note: 'Already on the current route.' },
        { code: 'used.add((r, c))', note: 'Mark: choose this cell.' },
        { code: 'for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:', note: 'Try the four neighbours for the next step.' },
        { code: 'used.remove((r, c))', note: 'Unmark: the cell is free for other routes.' },
        { code: 'for r in range(rows):\n    for c in range(cols):', note: 'Outside the recursion: every cell gets a turn as the start.' },
      ],
      example: {
        code: `# How many routes go from the top-left to the bottom-right corner
# of an open 3 x 3 floor without stepping on a tile twice?
n = 3
used = set()

def routes(r, c):
    if r < 0 or r >= n or c < 0 or c >= n or (r, c) in used:
        return 0
    if (r, c) == (n - 1, n - 1):
        return 1
    used.add((r, c))                 # mark
    total = 0
    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        total += routes(r + dr, c + dc)
    used.remove((r, c))              # unmark
    return total

print(routes(0, 0))
print(used)`,
        output: `12
set()`,
      },
      gotchas: [
        'Never unmarking turns it into an ordinary flood fill: cells from abandoned routes stay blocked and real answers are missed.',
        'Returning early from inside the neighbour loop skips the unmark. That is fine when the answer is already `True`, but not when the search goes on.',
        'A negative index does not crash, it wraps to the other side. Check the bounds before `grid[r][c]`.',
        'Strings cannot be changed in place, so with a grid of strings keep a `used` set instead of overwriting the cell.',
      ],
    },
    {
      id: 'matrix-transform',
      title: 'Transpose and reverse in place',
      skills: ['matrix_transform'],
      what: 'A matrix can be rearranged **inside itself**, with no second matrix, using a few moves: swap two cells, **transpose** (flip across the top-left to bottom-right diagonal, so rows become columns), reverse every row, or reverse the order of the rows. Each is a handful of swaps, and bigger rearrangements are made by doing two of them in a row.',
      model: 'A sheet of squared paper you may flip over an edge or a diagonal, but never copy.',
      syntax: [
        { code: 'm[a][b], m[c][d] = m[c][d], m[a][b]', note: 'Swap two cells in one line.' },
        { code: 'for r in range(n):\n    for c in range(r + 1, n):', note: 'Only the cells above the diagonal.' },
        { code: 'm[r][c], m[c][r] = m[c][r], m[r][c]', note: 'Transpose: trade a cell with its mirror.' },
        { code: 'for row in m:\n    row.reverse()', note: 'Reverse every row (left becomes right).' },
        { code: 'm.reverse()', note: 'Reverse the order of the rows (top becomes bottom).' },
      ],
      example: {
        code: `# A seating chart: swap the two end columns, reverse the back row,
# then let the two rows trade places
seats = [['a', 'b', 'c'],
         ['d', 'e', 'f']]
for row in seats:
    row[0], row[-1] = row[-1], row[0]
print(seats)
seats[1].reverse()
print(seats)
seats[0], seats[1] = seats[1], seats[0]
print(seats)`,
        output: `[['c', 'b', 'a'], ['f', 'e', 'd']]
[['c', 'b', 'a'], ['d', 'e', 'f']]
[['d', 'e', 'f'], ['c', 'b', 'a']]`,
      },
      gotchas: [
        'Looping over **every** `(r, c)` in a transpose swaps each pair twice and leaves the matrix unchanged. Start the inner loop at `r + 1`.',
        '`row = row[::-1]` builds a new list and the matrix never sees it. `row.reverse()` changes the row itself.',
        'Transposing in place only works for a square matrix.',
        'Reversing each row and reversing the row order are different moves. Check on a 2 x 2 which one you need.',
      ],
    },
    {
      id: 'matrix-layers',
      title: 'Walking the boundaries',
      skills: ['matrix_layers'],
      what: 'To visit a matrix ring by ring, keep four bounds, `top`, `bottom`, `left` and `right`, that fence in the part not visited yet (all four included). Walk **one edge at a time**, and after each edge move **its** bound one step inward. Repeat while the bounds have not crossed. Every walk is a single `for` loop where one index is a bound and the other one runs.',
      model: 'Peeling an onion: take off the outside layer one side at a time, and the fence closes in around what is left.',
      syntax: [
        { code: 'top, bottom = 0, len(m) - 1\nleft, right = 0, len(m[0]) - 1', note: 'The fence starts around the whole matrix.' },
        { code: 'while top <= bottom and left <= right:', note: 'Something is still inside the fence.' },
        { code: 'for c in range(left, right + 1):', note: 'Along a row, left to right. Then `top += 1`.' },
        { code: 'for r in range(top, bottom + 1):', note: 'Down a column. Then `right -= 1`.' },
        { code: 'for c in range(right, left - 1, -1):', note: 'Along a row, right to left. Then `bottom -= 1`.' },
        { code: 'for r in range(bottom, top - 1, -1):', note: 'Up a column. Then `left += 1`.' },
        { code: 'if top <= bottom:', note: 'Re-check before the backward walks: the row or column may be gone.' },
      ],
      example: {
        code: `# Read the two outside columns of a table, then move both bounds inward
m = [[1, 2, 3, 4],
     [5, 6, 7, 8]]
left, right = 0, 3
while left <= right:
    down = [m[r][left] for r in range(2)]
    up = [m[r][right] for r in range(1, -1, -1)]
    print(left, right, down, up)
    left += 1
    right -= 1`,
        output: `0 3 [1, 5] [8, 4]
1 2 [2, 6] [7, 3]`,
      },
      gotchas: [
        'After the top row is read, a matrix with one row has nothing left, yet an unguarded bottom walk reads that same row again backwards.',
        'A backward `range` stops one **below** its last value: `range(right, left - 1, -1)`.',
        'Along a row the column runs (`m[top][c]`); along a column the row runs (`m[r][right]`). Mixing them up reads the wrong edge.',
        '`while top < bottom` gives up one layer too early: when the bounds are equal there is still a row or a cell inside.',
      ],
    },
    {
      id: 'matrix-marking',
      title: 'Mark first, change after',
      skills: ['matrix_marking'],
      what: 'When cells must change **because of values elsewhere in their row or column**, changing them while you scan corrupts the evidence: a cell you just changed looks like an original. So work in **two passes**. First only read, and record which rows and columns are affected (two sets). Then only write, deciding each cell from the record. To save the extra memory, the record can live in the first row and first column of the matrix itself, provided you remember beforehand what those held.',
      model: 'A building inspector: walk the whole site with a clipboard first, and only afterwards send in the crew.',
      syntax: [
        { code: 'rows, cols = set(), set()', note: 'The clipboard.' },
        { code: 'if m[r][c] == marker:\n    rows.add(r)\n    cols.add(c)', note: 'Pass 1: note it, change nothing.' },
        { code: 'if r in rows or c in cols:\n    m[r][c] = new_value', note: 'Pass 2: decide from the notes only.' },
        { code: 'first_row_hit = marker in m[0]', note: 'In-place version: remember the first row before using it for notes.' },
        { code: 'm[r][0] = marker\nm[0][c] = marker', note: 'In-place version: the note for row `r` and column `c`.' },
      ],
      example: {
        code: `# Close every aisle (column) that has a spill 'S' somewhere in it
floor = [['.', 'S', '.'],
         ['.', '.', '.'],
         ['S', '.', '.']]
closed = set()
for row in floor:
    for c in range(len(row)):
        if row[c] == 'S':
            closed.add(c)
print(sorted(closed))
for row in floor:
    for c in closed:
        row[c] = 'x'
for row in floor:
    print(''.join(row))`,
        output: `[0, 1]
xx.
xx.
xx.`,
      },
      gotchas: [
        'Changing cells during the scan makes the changed cells count as sources, and the change floods the whole matrix.',
        'Use `or` when a cell changes because of its row or its column. `and` only changes the crossing points.',
        'With notes kept in the first row and column, read "did the first row / first column have a marker?" **before** writing any note.',
        'In that version the first row and first column are changed last, after every inner cell has read its notes.',
      ],
    },
  ],
}
