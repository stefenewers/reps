import type { Brief } from '@/data/briefs'

/** Plain-English briefs for the oct10 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── Decision trees ─────────────────────────────────────────────────────────
  'd10-dt-all-sums': {
    task: 'The outer function is written. Write the body of the helper `go`, which makes one take-it-or-leave-it decision per call.',
    inputs: [
      { name: 'nums', is: 'a list of numbers, possibly empty' },
      { name: 'i', is: 'the index of the item `go` is deciding about right now' },
      { name: 'total', is: 'the sum of the items taken so far' },
    ],
    returns: 'a list of numbers: one sum for every subset of `nums`, in any order. An empty `nums` has one subset (nothing), so the answer is `[0]`.',
    catch: 'How does `go` know that every item has had its decision? That is the moment to record `total`.',
  },
  'd10-dt-bit-strings': {
    inputs: [{ name: 'n', is: 'a whole number, 0 or more: how long each string is' }],
    returns: 'a list of strings, each of length `n`, made only of `0` and `1`, with `0` tried before `1` at every position.',
    catch: '`n` can be `0`. There is exactly one string of length 0.',
  },
  'd10-dt-dbg-base': {
    task: 'It counts wrong. Look at when the recursion stops, and whether every item has had its decision by then.',
    inputs: [
      { name: 'nums', is: 'a list of integers, possibly empty' },
      { name: 'target', is: 'the sum to hit' },
    ],
    returns: 'a number: how many subsets of `nums` add up to exactly `target`. The empty subset adds up to 0.',
    catch: 'Try a one-item list by hand. Is that item ever taken?',
  },
  'd10-dt-can-reach': {
    inputs: [
      { name: 'nums', is: 'a list of integers. It may be empty and may hold negatives.' },
      { name: 'target', is: 'the sum to hit' },
    ],
    returns: '`True` if some subset of `nums` adds up to exactly `target`, otherwise `False`.',
    catch: 'The empty subset counts, and adds up to 0. And once one branch says yes, is there any reason to try the other?',
  },
  'd10-dt-signs': {
    inputs: [
      { name: 'nums', is: 'a list of integers. Every one must be used, with a `+` or a `-` in front.' },
      { name: 'target', is: 'the total to hit' },
    ],
    returns: 'a number: how many ways of choosing the signs give exactly `target`.',
    catch: 'A `0` in the list still gets a sign, and `+0` and `-0` count as two different choices.',
  },

  // ── Path state ─────────────────────────────────────────────────────────────
  'd10-ps-subsequences-finish': {
    task: 'The stopping rule is written. Fill in the part that takes one character, explores, puts things back, and explores without it.',
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: 'a list of strings: every subsequence of `s` (some of its characters, kept in their original order), in any order.',
    catch: 'After exploring with `s[i]` on `path`, what must be true of `path` before you explore without it?',
  },
  'd10-ps-dbg-alias': {
    task: 'It returns the right number of lists. Look at what is inside them, then fix it.',
    inputs: [{ name: 'n', is: 'a whole number, 0 or more: the length of each list' }],
    returns: 'a list of lists: every list of `n` values, each `0` or `1`, zeros first.',
    catch: 'How many different list objects end up inside `res`?',
  },
  'd10-ps-combos': {
    inputs: [
      { name: 'nums', is: 'a list of distinct values' },
      { name: 'k', is: 'how many to choose: a whole number, 0 or more' },
    ],
    returns: 'a list of groups (lists) of exactly `k` values. Each group appears once; the groups can come in any order.',
    catch: 'What stops `[2, 1]` from showing up when `[1, 2]` already did?',
  },
  'd10-ps-orderings': {
    inputs: [{ name: 'nums', is: 'a list of distinct values, possibly empty' }],
    returns: 'a list of lists: every ordering of all the values, in any order. An empty `nums` has one ordering, `[]`.',
    catch: 'At each position any value not yet placed can go next. How will you know which ones are already placed?',
  },
  'd10-ps-dbg-used': {
    task: 'It finds only some of the orderings. Find what is left behind when a branch finishes.',
    inputs: [{ name: 'items', is: 'a list of distinct values' }],
    returns: 'a list of lists: every ordering of `items`, in any order.',
    catch: 'Two things change before the recursive call. Count how many are changed back after it.',
  },
  'd10-ps-tree-paths': {
    inputs: [{ name: 'root', is: 'the top node of a binary tree, or `None` for an empty tree. Each node has `.val`, `.left` and `.right`.' }],
    returns: 'a list of paths. Each path is the list of values from the root down to one leaf (a node with no children). Left paths come before right ones. An empty tree gives `[]`.',
    catch: 'A node with one child is not a leaf, and its missing child is not a path.',
  },

  // ── Subsets ────────────────────────────────────────────────────────────────
  'd10-sub-loop-style': {
    inputs: [{ name: 'nums', is: 'a list of distinct values, possibly empty' }],
    returns: 'a list of lists: every subset of `nums`, including `[]` and all of `nums`, in any order.',
    catch: 'In this style you save on every call, not only at the bottom. Why is every partial path already a subset?',
  },
  'd10-sub-target-subsets': {
    inputs: [
      { name: 'nums', is: 'a list of distinct integers. It may be empty and may hold negatives.' },
      { name: 'target', is: 'an integer: the sum each chosen subset must have' },
    ],
    returns: 'a list of lists: every subset of `nums` whose values add up to exactly `target`, in any order. `[]` if there are none.',
    catch: 'The empty subset adds up to 0. When does it belong in the answer?',
  },
  'd10-sub-write-test': {
    task: 'You are the tester. Write `assert` lines that pass for a correct subsets function and fail for three broken ones.',
    inputs: [{ name: 'subsets', is: 'a **function**, not a list. `subsets(nums)` should return every subset of the list `nums`, as a list of lists.' }],
    returns: 'nothing. It just finishes quietly when `subsets` is right, and an `assert` fails when it is wrong.',
    catch: 'A correct version may list the subsets in a different order than you wrote them. Compare in a way that does not care.',
  },

  // ── Recurrences ────────────────────────────────────────────────────────────
  'd10-rec-fib-naive': {
    inputs: [{ name: 'n', is: 'a whole number, 0 or more' }],
    returns: 'the n-th Fibonacci number, counting from `n = 0`: 0, 1, 1, 2, 3, 5, 8, ...',
    catch: 'Which values of `n` are answered directly, without asking for smaller ones?',
  },
  'd10-rec-three-steps': {
    inputs: [{ name: 'n', is: 'the step to land on exactly. Inside the recursion it can reach 0 or go below it.' }],
    returns: 'a number: how many sequences of 1-, 2- and 3-step moves land exactly on step `n`.',
    catch: 'What should `n = 0` count as? And what about a move that overshoots?',
  },
  'd10-rec-grid-paths': {
    inputs: [
      { name: 'rows', is: 'how many rows the grid has, at least 1' },
      { name: 'cols', is: 'how many columns it has, at least 1' },
    ],
    returns: 'a number: how many right/down routes go from the top-left cell to the bottom-right cell.',
    catch: 'After the first move you are standing in the top-left of a smaller grid. Which two smaller grids are possible?',
  },
  'd10-rec-dbg-base': {
    task: 'The recurrence is right. The smallest cases are not. Fix them.',
    inputs: [{ name: 'n', is: 'how many steps to climb, 0 or more' }],
    returns: 'a number: how many sequences of 1- and 2-step moves climb exactly `n` steps.',
    catch: 'Work out the answers for 0 steps and for 1 step by hand before you look at the code.',
  },

  // ── Memoization ────────────────────────────────────────────────────────────
  'd10-memo-optimize': {
    task: 'The answers are right, but it repeats the same work over and over. Make it remember.',
    inputs: [
      { name: 'n', is: 'how many steps to climb, 0 or more' },
      { name: 'calls', is: 'a counter of how many times `climb` has run. Leave it in: a test reads it.' },
    ],
    returns: 'the same answers as before: the number of ways to climb `n` steps, 1 or 2 at a time.',
    catch: 'Where must the dict be created so that it is still there on the next call?',
  },
  'd10-memo-fib': {
    inputs: [{ name: 'n', is: 'a whole number, 0 or more, as large as 80' }],
    returns: 'the n-th Fibonacci number (0, 1, 1, 2, 3, 5, ...).',
    catch: 'How many times should the dict be created during one call of `fast_fib`?',
  },
  'd10-memo-dbg-inside': {
    task: 'It has a memo and still repeats all its work. Find out why nothing is ever found in it.',
    inputs: [
      { name: 'n', is: 'a whole number, 0 or more' },
      { name: 'calls', is: 'a counter of how many times `tri` has run. A test reads it.' },
    ],
    returns: 'the same numbers as now, in far fewer calls.',
    catch: 'How long does each `memo` dict live?',
  },
  'd10-memo-grid': {
    inputs: [
      { name: 'rows', is: 'how many rows the grid has, at least 1' },
      { name: 'cols', is: 'how many columns it has, at least 1' },
    ],
    returns: 'a number: how many right/down routes go from the top-left cell to the bottom-right cell.',
    catch: 'Two different grids must never share one stored answer. What identifies a grid?',
  },
  'd10-memo-dbg-key': {
    task: 'It remembers answers, but hands some of them back for the wrong question. Fix it.',
    inputs: [
      { name: 'rows', is: 'how many rows the grid has, at least 1' },
      { name: 'cols', is: 'how many columns it has, at least 1' },
    ],
    returns: 'a number: how many right/down routes cross the grid.',
    catch: 'Which different subproblems end up stored under the same key?',
  },
  'd10-memo-cache-ways3': {
    inputs: [{ name: 'n', is: 'the step to land on exactly, as large as 40. Inside the recursion it can go below 0.' }],
    returns: 'a number: how many sequences of 1-, 2- and 3-step moves land exactly on step `n`.',
    catch: '`@cache` is not built in: it has to be imported, and it sits on its own line directly above `def`.',
  },

  // ── Bottom-up DP ───────────────────────────────────────────────────────────
  'd10-bu-translate': {
    task: 'Same answers, no recursion: build the answers in a list, from the smallest up.',
    inputs: [{ name: 'n', is: 'how many steps to climb: 0 or more, as large as 3000' }],
    returns: 'a number: how many ways there are to climb `n` steps taking 1 or 2 at a time.',
    catch: 'Which entries can you write down before the loop starts? And which index must the loop reach?',
  },
  'd10-bu-three-steps': {
    inputs: [{ name: 'n', is: 'the step to land on exactly, 0 or more' }],
    returns: 'a number: how many sequences of 1-, 2- and 3-step moves land exactly on step `n`.',
    catch: 'For small `i`, some moves would have to start below step 0. They must add nothing, and must not read the list from the wrong end.',
  },
  'd10-bu-any-steps': {
    inputs: [
      { name: 'n', is: 'the step to land on exactly, 0 or more' },
      { name: 'steps', is: 'a list of distinct positive whole numbers: the move sizes you are allowed' },
    ],
    returns: 'a number: how many sequences of allowed moves land exactly on step `n`. `0` if none do.',
    catch: 'The same moves in a different order count separately. And what is the answer for `n = 0`?',
  },
  'd10-bu-dbg-range': {
    task: 'The rule is right, but the list is not completely filled in. Fix it.',
    inputs: [{ name: 'n', is: 'the length of the strip, 0 or more' }],
    returns: 'a number: how many ways there are to cover a 2 x `n` strip with dominoes.',
    catch: 'Which index does it return? Does the loop ever write that index?',
  },
  'd10-bu-min-cost': {
    inputs: [{ name: 'cost', is: 'a list of at least two non-negative numbers. `cost[i]` is what you pay for standing on step `i`.' }],
    returns: 'a number: the smallest total you can pay to get past the last step.',
    catch: 'The top is not one of the steps in the list. From which steps can you reach it?',
  },

  // ── Rolling state ──────────────────────────────────────────────────────────
  'd10-roll-fib': {
    inputs: [{ name: 'n', is: 'a whole number, 0 or more, as large as 80' }],
    returns: 'the n-th Fibonacci number (0, 1, 1, 2, 3, 5, ...).',
    catch: 'When the loop ends, which of your two variables holds the answer? Check it with `n = 0`.',
  },
  'd10-roll-dbg-two-lines': {
    task: 'Two variables are moved forward one after the other. Find what gets lost on the way.',
    inputs: [{ name: 'n', is: 'a whole number, 0 or more' }],
    returns: 'the n-th Fibonacci number (0, 1, 1, 2, 3, 5, ...).',
    catch: 'Trace both variables by hand for three rounds of the loop.',
  },
  'd10-roll-robber-memo': {
    inputs: [{ name: 'nums', is: 'a list of non-negative numbers, possibly empty' }],
    returns: 'a number: the largest total you can take without taking two values that are next to each other. `0` for an empty list.',
    catch: 'If you take the value at index `i`, which is the next index you are allowed to look at?',
  },
  'd10-roll-robber-table': {
    inputs: [{ name: 'nums', is: 'a list of non-negative numbers: `nums[i]` is the pay for day `i`. It may be empty.' }],
    returns: 'a number: the most you can earn without working two days in a row.',
    catch: 'Resting two days in a row is allowed. And check the lists with zero days and with one day.',
  },
  'd10-roll-dbg-adjacent': {
    task: 'It takes too much. Find which earlier total a newly taken value is being added to.',
    inputs: [{ name: 'nums', is: 'a list of non-negative numbers, possibly empty' }],
    returns: 'a number: the largest sum you can make without taking two values that are next to each other.',
    catch: 'If you take `x`, was the value just before it allowed to be taken as well?',
  },
}
