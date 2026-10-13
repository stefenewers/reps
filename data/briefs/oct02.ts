import type { Brief } from '@/data/briefs'

/** Plain-English briefs for the oct02 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── Python recall ──────────────────────────────────────────────────────────
  'o2-bookends': {
    inputs: [{ name: 'nums', is: 'a list. It can be empty, or hold just one item.' }],
    returns: 'a **new list** of two items: the first item of `nums`, then the last. For an empty list, `[]`.',
    catch: 'What happens if you ask an empty list for its first item?',
  },
  'o2-append-line': {
    inputs: [
      { name: 'nums', is: 'a list. You change this list itself.' },
      { name: 'extra', is: 'another list: the items to add, in order' },
    ],
    returns: '`nums` itself, now with every item of `extra` on the end.',
    catch: 'Adding to a list is an action, not a value. What does `.append` hand back?',
  },

  // ── Loops & range ──────────────────────────────────────────────────────────
  'o2-dbg-for-of': {
    task: 'It does not run at all. Make it add up the word lengths.',
    inputs: [{ name: 'words', is: "a list of strings, like `['ab', 'cde']`. It can be empty." }],
    returns: 'one number: the lengths of all the words added together.',
    catch: 'Read the error message: which line, and which word on that line, is Python pointing at?',
  },

  // ── enumerate ──────────────────────────────────────────────────────────────
  'o2-enum-fill': {
    inputs: [{ name: 'words', is: "a list of strings, like `['a', 'b']`" }],
    returns: 'a **list of tuples**, one per word: `(position, word)`, with positions starting at 0.',
    catch: 'Each thing you add to the list is one pair, not two separate things.',
  },

  // ── Sets ───────────────────────────────────────────────────────────────────
  'o2-set-add-fill': {
    inputs: [{ name: 'nums', is: 'a list of numbers. Numbers can repeat.' }],
    returns: 'a **list** of the different values, each one once, smallest first.',
    catch: 'You collect into a set but hand back a list. A set adds with `.add`, not `.append`.',
  },
  'o2-set-unique-count': {
    inputs: [{ name: 'words', is: "a list of strings, like `['Cat', 'cat', 'dog']`" }],
    returns: 'one number: how many different words there are when capital letters are ignored.',
    catch: "`'Cat'` and `'cat'` must end up as the same thing before they are compared.",
  },
  'o2-set-optimize': {
    inputs: [
      { name: 'nums', is: 'a list of numbers to check, one by one' },
      { name: 'allowed', is: 'a list of the numbers that count. It can be long.' },
    ],
    returns: 'one number: how many items of `nums` are in `allowed`. A repeat in `nums` counts each time.',
    catch: 'Where should the conversion happen: once, or every time round the loop?',
  },

  // ── Contains Duplicate ─────────────────────────────────────────────────────
  'o2-dup-write-test': {
    task: 'You are not fixing `has_dup_adjacent`. You are choosing an input that shows it is wrong.',
    returns: 'from `breaking_input()`: one list for which the right answer and its answer differ.',
    catch: 'Which pairs of positions does it compare, and which does it never compare?',
  },

  // ── Valid Anagram ──────────────────────────────────────────────────────────
  'o2-anagram-fill': {
    task: 'Write the counting, and replace the placeholder `return False` with the real answer.',
    inputs: [
      { name: 's', is: 'a string' },
      { name: 't', is: 'another string' },
    ],
    returns: '`True` if `s` and `t` use the same characters the same number of times each, otherwise `False`.',
    catch: 'Once both dicts are full, what single comparison answers the question?',
  },
  'o2-anagram-write-test': {
    task: 'You are not fixing `same_chars`. You are choosing an input that shows it is wrong.',
    returns: 'from `breaking_input()`: a pair of strings `(s, t)` for which `same_chars` says one thing and the truth is the other.',
    catch: 'Turn a string into a set: what information about the string is lost?',
  },
  'o2-dbg-anagram-length': {
    task: 'It says `True` for some pairs that are not anagrams.',
    inputs: [
      { name: 's', is: 'a string' },
      { name: 't', is: 'another string' },
    ],
    returns: '`True` only when `t` uses the same characters as `s`, each the same number of times.',
    catch: "Trace `is_anagram('ab', 'a')`. Does any count ever go below zero?",
  },

  // ── Two Sum ────────────────────────────────────────────────────────────────
  'o2-ts-find-pair': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number: what the two numbers must add up to' },
    ],
    returns: 'a list of two **values**, `[earlier, later]`, in the order they appear in `nums`. If no two numbers add up to `target`, `None`.',
    catch: 'The two numbers must sit at different positions: a single 5 cannot make 10 on its own.',
  },
  'o2-ts-modify': {
    task: 'The code works, but hands back the wrong kind of thing: values. Make it hand back positions.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number: what the two numbers must add up to' },
    ],
    returns: 'a list of two **indexes** `[i, j]` with `i < j`, or `[]` if there is no pair.',
    catch: 'To hand back where a number was, you must have remembered where it was. What can hold a number together with its position?',
  },
  'o2-ts-write-test': {
    task: 'You are not fixing `two_sum_store_first`. You are choosing an input that shows it is wrong.',
    returns: 'from `breaking_input()`: a tuple `(nums, target)` that has a real pair, but for which the function hands back something that is not that pair.',
    catch: 'When is the number that a number needs equal to the number itself?',
  },
  'o2-dbg-ts-store-indent': {
    task: 'It runs, but hands back `[]` even when a pair exists.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number: what the two numbers must add up to' },
    ],
    returns: 'a list of two indexes `[i, j]` with `i < j`, or `[]` if there is no pair.',
    catch: 'Print `seen` at the end of each trip round the loop. Is anything ever stored?',
  },
  'o2-ts-pattern-count': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number: what each pair must add up to' },
    ],
    returns: 'one number: how many pairs of different positions `i < j` add up to `target`.',
    catch: 'With `[2, 2, 2]` and target 4 the answer is 3, not 1. One earlier number can be a partner more than once.',
  },
}
