import type { Brief } from '@/data/briefs'

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'

/** Plain-English briefs for the oct09 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── Sorting ────────────────────────────────────────────────────────────────
  'd9-sort-returns-none': {
    task: PREDICT,
    catch: 'Two different tools sort here. For each one ask: does it hand back a list, or does it change the list it was given?',
  },
  'd9-sort-inplace-desc': {
    task: 'One line. After it runs, the list `nums` itself must be in the new order.',
    inputs: [{ name: 'nums', is: 'a list of numbers, already made on the first line' }],
    catch: 'Two tools sort a list. Only one of them changes the list it is given.',
  },
  'd9-sort-second-largest': {
    inputs: [{ name: 'nums', is: 'a list of integers. It can be empty, and values can repeat.' }],
    returns: 'one number: the second biggest of the **different** values in `nums`, or `None` when there are fewer than two different values.',
    catch: 'In `[4, 1, 4, 3]` the answer is `3`, not `4`. What has to happen to the repeats before you pick?',
  },
  'd9-sort-min-gap': {
    inputs: [{ name: 'nums', is: 'a list of at least two integers, in any order' }],
    returns: 'one number: the smallest difference between any two of the values. It is never negative, and it is `0` when a value repeats.',
    catch: 'Once the values are in order, which pairs can possibly be the closest?',
  },
  'd9-sort-dbg-assign-none': {
    task: 'It crashes. Read the error, find the line that causes it, and fix it without reordering the caller’s list.',
    inputs: [{ name: 'nums', is: 'a list of integers, in any order. It can be empty.' }],
    returns: '`True` if the values, put in order, go up by exactly 1 each step (like `[6, 4, 5]`), otherwise `False`. An empty list gives `True`.',
    catch: 'Print `ordered` right after the first line of the function. Is it what you expected?',
  },
  'd9-sort-dbg-discarded': {
    task: 'It runs without an error but gives wrong answers. Make it right.',
    inputs: [{ name: 'nums', is: 'a list of numbers, in any order. It can be empty.' }],
    returns: '`True` if some value appears more than once, otherwise `False`.',
    catch: 'Comparing neighbours only finds repeats when equal values sit side by side. Do they, at the moment the loop runs?',
  },
  'd9-sort-group-anagrams': {
    inputs: [{ name: 'words', is: "a list of strings, like `['eat', 'tea', 'tan']`. It can be empty." }],
    returns: 'a **list of lists**. Each inner list holds the words made of exactly the same letters. Groups come in the order their first word appeared; inside a group the words stay in input order.',
    catch: 'Every word of a group has to land under the same dict key. An empty string is a word too.',
  },

  // ── Sort keys ──────────────────────────────────────────────────────────────
  'd9-key-len-stable': {
    task: PREDICT,
    catch: 'Two of the words have the same length. Which of them was first in the original list?',
  },
  'd9-key-age-desc': {
    task: 'One line. After it runs, the list `people` itself must be reordered.',
    inputs: [{ name: 'people', is: 'a list of `(name, age)` tuples, already made on the first line' }],
    catch: 'Left alone, tuples sort by their first item, which is the name here. Which part do you want compared, and in which direction?',
  },
  'd9-key-records': {
    inputs: [{ name: 'people', is: "a list of dicts, each with a `'name'` (a string) and an `'age'` (a number). It can be empty." }],
    returns: 'a **list of names** (strings, not dicts): youngest first, and people of the same age in A→Z order.',
    catch: 'Two things decide the order. How does one key say "this first, then that on a tie"?',
  },
  'd9-key-distance': {
    inputs: [{ name: 'points', is: 'a list of `[x, y]` pairs, like `[[3, 3], [1, 0]]`. It can be empty.' }],
    returns: 'a new list with the same points, closest to `(0, 0)` first. Points that are equally far away keep their input order.',
    catch: '`key=` wants the function itself, not the result of calling it.',
  },
  'd9-key-dbg-wrong-index': {
    task: 'It returns the names, but in the wrong order. Fix the ordering.',
    inputs: [{ name: 'results', is: 'a list of `(name, score)` tuples' }],
    returns: 'a list of the names, lowest score first.',
    catch: 'Run the first test and look at the order you get. What is it sorted by?',
  },
  'd9-key-dbg-reverse-ties': {
    task: 'Run the first test: the big picture is right, one detail of the order is not. Fix it.',
    inputs: [{ name: 'scores', is: 'a list of `(name, points)` tuples' }],
    returns: 'the same tuples: highest points first, and players with equal points in A→Z order.',
    catch: 'This order goes down on one part and up on the other. What does `reverse=True` apply to?',
  },

  // ── Frequency + sort ───────────────────────────────────────────────────────
  'd9-freq-most-common': {
    inputs: [{ name: 's', is: 'a string with at least one character' }],
    returns: 'one character (a string of length 1): the one that appears most often. On a tie, the one that comes first alphabetically.',
    catch: "`'abab'` has a tie. The answer must be `'a'` every time, not whichever one you happened to meet first.",
  },
  'd9-freq-topk-by-sort': {
    inputs: [
      { name: 'nums', is: 'a list of integers. Values repeat.' },
      { name: 'k', is: 'how many values to return. Never more than the number of different values; it can be `0`.' },
    ],
    returns: 'a list of `k` **values** (not their counts), most frequent first.',
    catch: 'You are ordering the different values, but comparing them by something stored somewhere else.',
  },
  'd9-freq-dbg-pairs': {
    task: 'Run it and compare what comes back with what was asked for. Then fix it.',
    inputs: [
      { name: 'nums', is: 'a list of integers' },
      { name: 'k', is: 'how many values to return' },
    ],
    returns: 'a list of `k` plain **values**, most frequent first, like `[4, 2]`.',
    catch: 'Look at one element of the list it returns. What type is it?',
  },
  'd9-freq-sort-chars': {
    inputs: [{ name: 's', is: 'a string. It can be empty. Upper and lower case are different characters.' }],
    returns: 'a string with exactly the same characters, regrouped: every copy of the most frequent character first, then the next. Equal counts go in alphabetical order, capitals before lowercase.',
    catch: 'Each character must come back as many times as it went in.',
  },

  // ── heapq ──────────────────────────────────────────────────────────────────
  'd9-heap-push-trace': {
    task: PREDICT,
    catch: 'Do not try to work out the whole list. Only ask: which value is the smallest one still in `h` right now?',
  },
  'd9-heap-smallest-k': {
    inputs: [
      { name: 'nums', is: 'a list of numbers, in any order' },
      { name: 'k', is: 'how many to return: from `0` up to `len(nums)`' },
    ],
    returns: 'a new list of the `k` smallest values, smallest first. `nums` must be unchanged afterwards.',
    catch: 'Turning a list into a heap rearranges that very list. Whose list is it?',
  },
  'd9-heap-ropes': {
    inputs: [{ name: 'lengths', is: 'a list of positive whole numbers, one per rope. It can be empty or hold a single rope.' }],
    returns: 'one number: the total cost of all the joins, done in the cheapest order. `0` when there is nothing to join.',
    catch: 'A joined rope goes back into the pile and may be picked again. Also: nothing is imported for you.',
  },
  'd9-heap-run-order': {
    inputs: [{ name: 'tasks', is: 'a list of `(priority, name)` tuples. A lower priority number runs earlier. It can be empty.' }],
    returns: 'a list of the names only, in the order they run. Equal priorities run in A→Z order.',
    catch: 'Each thing you take off the heap is a whole tuple. Which part goes in the answer?',
  },
  'd9-heap-dbg-slice': {
    task: 'It returns three values, but not always the right three in the right order. Fix it.',
    inputs: [{ name: 'nums', is: 'a list of at least three numbers' }],
    returns: 'a list of the three smallest values, smallest first. `nums` itself must not change.',
    catch: 'Print the heap for `[1, 5, 2, 6, 7, 3, 4]`. Which positions can you be sure about?',
  },

  // ── Top-k ──────────────────────────────────────────────────────────────────
  'd9-topk-trace': {
    task: PREDICT,
    catch: 'After each round of the loop, write down which values are still in the heap. There are never more than `k`.',
  },
  'd9-topk-kth-by-sort': {
    inputs: [
      { name: 'nums', is: 'a list of numbers with at least one item' },
      { name: 'k', is: 'a position counted from 1: `1` means the largest, `2` the next one down. Never more than `len(nums)`.' },
    ],
    returns: 'one number: the value at position `k` when the list is written largest first. Repeats each take a position.',
    catch: '`k` counts from 1. List indexes do not.',
  },
  'd9-topk-dbg-no-trim': {
    task: 'It adds up too much. Make it the sum of only the `k` largest values.',
    inputs: [
      { name: 'nums', is: 'a list of numbers. They can be negative.' },
      { name: 'k', is: 'how many of the largest values to add up: from `0` up to `len(nums)`' },
    ],
    returns: 'one number: the sum of the `k` largest values. `0` when `k` is `0`.',
    catch: 'Print `len(heap)` just before the return. How big was it supposed to get?',
  },
  'd9-topk-closest': {
    inputs: [
      { name: 'points', is: 'a list of `[x, y]` pairs' },
      { name: 'k', is: 'how many points to return: from `1` up to `len(points)`' },
    ],
    returns: 'a list of `k` points as `[x, y]` lists: the ones nearest to `(0, 0)`. Any order.',
    catch: 'What you store while scanning is not what you return. Turn it back into `[x, y]` lists at the end.',
  },
  'd9-topk-keys-by-count': {
    inputs: [
      { name: 'counts', is: 'a dict: item → how many times it was seen (a whole number)' },
      { name: 'k', is: 'how many keys to return: from `1` up to the number of keys' },
    ],
    returns: 'a list of `k` **keys** (not counts): the ones with the highest counts. Any order.',
    catch: 'You choose by the count but hand back the key, so you need the two together.',
  },
  'd9-topk-dbg-tuple-order': {
    task: 'It returns `k` users, but not the busiest ones. Fix it.',
    inputs: [
      { name: 'log', is: 'a list of usernames (strings), one entry per action. A name appears once for every action that user took.' },
      { name: 'k', is: 'how many users to return' },
    ],
    returns: 'a list of the `k` usernames that appear most often in `log`. Any order.',
    catch: 'When two tuples are compared, which part is looked at first?',
  },

  // ── Intervals ──────────────────────────────────────────────────────────────
  'd9-iv-overlaps-line': {
    inputs: [
      { name: 'cur', is: 'an interval: a `[start, end]` list with `start <= end`. It starts first (or at the same time as `nxt`).' },
      { name: 'nxt', is: 'another interval `[start, end]`. It starts at or after the start of `cur`.' },
    ],
    returns: '`True` if the two share at least one point, otherwise `False`. Sharing just an endpoint counts.',
    catch: 'You already know which one starts first. So only one start and one end matter.',
  },
  'd9-iv-intersection': {
    inputs: [
      { name: 'a', is: 'an interval: a `[start, end]` list' },
      { name: 'b', is: 'another interval `[start, end]`. Either one may start first.' },
    ],
    returns: 'the part both of them cover, as `[start, end]`, or `None` if they share nothing. If they only touch, the shared part is a single point like `[5, 5]`.',
    catch: 'Does the shared part begin at the earlier start or at the later one?',
  },
  'd9-iv-merge-trace': {
    task: PREDICT,
    catch: 'Each round either stretches the last block in `merged` or adds a new block. Decide which before you write the line.',
  },
  'd9-iv-merge-sorted': {
    inputs: [{ name: 'intervals', is: 'a list of `[start, end]` pairs, already sorted by start. It can be empty.' }],
    returns: 'a list of `[start, end]` pairs in which every group that overlapped or touched has become one interval.',
    catch: 'An interval can sit completely inside the one before it: `[1, 10]` then `[2, 3]`.',
  },
  'd9-iv-dbg-overwrite-end': {
    task: 'It merges many inputs correctly. Find the shape of input that breaks it, then fix the code.',
    inputs: [{ name: 'intervals', is: 'a list of `[start, end]` ranges, sorted by start' }],
    returns: 'the merged list: overlapping or touching ranges combined into one.',
    catch: 'Trace `[[1, 10], [2, 3]]` by hand. Where should the block end?',
  },
  'd9-iv-dbg-unsorted': {
    task: 'It works on some inputs and not on others. Find what the loop takes for granted.',
    inputs: [{ name: 'ranges', is: 'a list of `[start, end]` ranges, in **any** order' }],
    returns: 'the merged ranges, sorted by start.',
    catch: 'Try `[[8, 10], [1, 3], [2, 6]]`. Which two ranges should have met, and did they?',
  },
  'd9-iv-can-attend': {
    inputs: [{ name: 'meetings', is: 'a list of `[start, end]` times, in any order. It can be empty.' }],
    returns: '`True` if no two meetings clash, otherwise `False`.',
    catch: 'One meeting ending at 10 and another starting at 10 is fine here. Which comparison says exactly that?',
  },
  'd9-maxheap-k-largest-desc': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'k', is: 'how many to return. Never more than the length of `nums`.' },
    ],
    returns: 'a **list** of the `k` largest values, biggest first.',
    catch: '`heapq` only ever hands back the smallest thing in the heap. What could you store so that the smallest stored thing is the biggest original number?',
  },
  'd9-maxheap-dbg-no-negate': {
    task: 'The function should return the names of the `k` heaviest items, heaviest first. It returns the wrong ones. Fix it.',
    inputs: [
      { name: 'items', is: 'a list of `(weight, name)` tuples' },
      { name: 'k', is: 'how many names to return' },
    ],
    returns: 'a **list** of names (strings), heaviest item first.',
    catch: 'Which item does a pop give you first as the code stands: the heaviest, or the lightest?',
  },
  'd9-maxheap-smash': {
    inputs: [{ name: 'weights', is: 'a list of positive integers, one per rock. It may be empty.' }],
    returns: 'the weight of the one rock left at the end, or `0` if no rock is left.',
    catch: 'You need the two heaviest again and again, and a new rock can come back in between. What happens when only one rock, or none, is left?',
  },
}
