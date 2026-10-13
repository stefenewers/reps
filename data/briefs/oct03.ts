import type { Brief } from '@/data/briefs'

const SORTED = 'a list of numbers sorted from smallest to largest'

/** Plain-English briefs for the oct03 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── Warm-up ────────────────────────────────────────────────────────────────
  'd3-warm-most-common': {
    inputs: [{ name: 'items', is: "a list of values that can be dict keys (numbers or strings), like `['a', 'b', 'a']`. It may be empty." }],
    returns: 'the one item that appears most often. On a tie, the tied item that showed up first in the list. `None` for an empty list.',
    catch: 'Two jobs: count everything, then find the winner. When two counts are equal, which one should keep the title?',
  },

  // ── Strings ────────────────────────────────────────────────────────────────
  'd3-str-count-vowels': {
    inputs: [{ name: 's', is: 'a string of lowercase letters, like `"banana"`. It may be empty.' }],
    returns: 'a whole number: how many characters of `s` are one of `a e i o u`.',
    catch: 'You look at one character at a time. How do you ask whether that one character is a vowel?',
  },
  'd3-str-same-ends': {
    inputs: [{ name: 's', is: 'a string, like `"level"`. It may be empty.' }],
    returns: '`True` if the first character and the last character are the same, otherwise `False`. An empty string gives `False`.',
    catch: 'What happens when you ask an empty string for its first character?',
  },
  'd3-str-debug-immutable': {
    task: 'The code crashes. Read the error, then make it hand back a new string instead.',
    inputs: [{ name: 's', is: 'a string, like `"hello"`. It may be empty.' }],
    returns: 'a string: the same text with its first character upper-cased. `""` stays `""`.',
    catch: 'A string cannot be edited once it exists. What can you build out of pieces of it?',
  },
  'd3-str-first-digit': {
    inputs: [{ name: 's', is: 'a string that may mix letters and digits, like `"abc4d5"`. It may be empty.' }],
    returns: 'a whole number: the index (position, counted from 0) of the first digit, or `-1` if `s` has no digit.',
    catch: 'You test the character but hand back its position, so you need both each time round.',
  },
  'd3-str-mirror-pairs': {
    inputs: [{ name: 's', is: 'a string, like `"abcd"`. It may be empty.' }],
    returns: 'a list of tuples. Each tuple holds one character from the first half and the character the same distance from the other end. First with last, second with second-to-last, and so on.',
    catch: 'If you are standing at index `i`, what is the index of its partner? Try it on paper for `"abcd"`. And the middle character of an odd-length string has no partner.',
  },

  // ── Slicing ────────────────────────────────────────────────────────────────
  'd3-slice-split-halves': {
    inputs: [{ name: 's', is: 'a string, like `"abcde"`. It may be empty.' }],
    returns: 'a tuple of two strings `(front, back)`: the first `len(s) // 2` characters and the last `len(s) // 2` characters. An odd middle character is left out.',
    catch: 'Try your idea on a one-character string, where each half has length 0. Does the back half really come out empty?',
  },
  'd3-slice-debug-reverse': {
    task: 'It keeps the wrong words. Find out what the comparison is really comparing.',
    inputs: [{ name: 'words', is: 'a list of strings, like `["level", "abc", "noon"]`' }],
    returns: 'a new list with only the words that read the same backwards, in their original order.',
    catch: 'Take the slice out of the code and try it on one word by hand. What does it give you?',
  },
  'd3-slice-rotate': {
    inputs: [
      { name: 's', is: 'a string, like `"abcde"`. It may be empty.' },
      { name: 'k', is: 'a whole number, 0 or more: how many characters to move from the front to the back. It can be bigger than the length of `s`.' },
    ],
    returns: 'a new string: `s` with its first `k` characters moved to the end.',
    catch: 'Rotating a 5-character string 5 times brings it back to where it started. So what does rotating it 7 times equal? And what goes wrong with that arithmetic on an empty string?',
  },
  'd3-slice-debug-middle': {
    task: 'It returns too few characters. Fix the slice.',
    inputs: [{ name: 's', is: 'a string with an odd length of at least 3, like `"abcde"`' }],
    returns: 'a string of exactly three characters: the middle one and its two neighbors.',
    catch: 'Count the characters between the start and the stop of the slice. Which of the two ends is left out?',
  },
  'd3-slice-break-last-k': {
    task: 'You are the tester. `breaking_input` takes nothing; it hands back one input on which the teammate’s `last_k` gives the wrong answer.',
    returns: 'a tuple `(s, k)`: a string and a whole number that is 0 or more.',
    catch: 'Bugs hide at the edges. What are the smallest and largest values `k` could sensibly take?',
  },

  // ── String methods ─────────────────────────────────────────────────────────
  'd3-meth-clean': {
    inputs: [{ name: 's', is: 'a string that may hold letters, digits, spaces and punctuation, like `"A man, a plan"`' }],
    returns: 'a new string: only the letters and digits of `s`, in order, all lowercase.',
    catch: 'Two decisions per character: does it stay, and what does it look like when it stays?',
  },
  'd3-meth-debug-isalnum': {
    task: 'It counts every character, even punctuation. Find out why the test in the `if` always says yes.',
    inputs: [{ name: 's', is: 'a string, like `"a1, b2!"`' }],
    returns: 'a whole number: how many characters of `s` are letters or digits.',
    catch: 'Naming a method and running a method are two different things. Look closely at how the test is written.',
  },
  'd3-meth-word-counts': {
    inputs: [{ name: 's', is: 'a string of words separated by spaces, like `"The cat the hat"`. It may be empty.' }],
    returns: 'a **dict**: each word in lowercase → how many times it appears, ignoring case.',
    catch: '`"The"` and `"the"` must land on the same key. When do you make them look the same?',
  },
  'd3-meth-clean-mirror': {
    inputs: [{ name: 's', is: 'a string that may hold letters, digits, spaces and punctuation, like `"Step on no pets!"`' }],
    returns: '`True` if the letters and digits of `s`, ignoring case, read the same backwards. Otherwise `False`. Nothing left to compare counts as `True`.',
    catch: 'Two steps, in order: first strip `s` down to what counts, then check that.',
  },

  // ── Two pointers ───────────────────────────────────────────────────────────
  'd3-tp-debug-step': {
    task: 'On some inputs this gives the wrong answer. Trace the two index variables by hand to see where they go.',
    inputs: [{ name: 's', is: 'a string, like `"abba"`. It may be empty.' }],
    returns: '`True` if `s` reads the same backwards (compared exactly), otherwise `False`.',
    catch: 'Write down `left` and `right` after each pass of the loop for `"abca"`. Do both of them move?',
  },
  'd3-tp-swap-reverse': {
    inputs: [{ name: 'nums', is: 'a list, like `[1, 2, 3]`. It may be empty.' }],
    returns: 'the **same** list, now in reverse order. No new list is built: the caller’s list itself is changed.',
    catch: 'When the two positions you are swapping meet in the middle, you are done. What happens if you keep going?',
  },
  'd3-tp-mismatches': {
    task: 'The starter stops and says `False` at the first pair that differs. Change it to keep going and count.',
    inputs: [{ name: 's', is: 'a string, like `"abca"`. It may be empty.' }],
    returns: 'a whole number: how many mirror pairs (first with last, second with second-to-last…) hold two different characters.',
    catch: 'Both the early exit and the final answer have to change. What should the function hand back when nothing differs?',
  },
  'd3-tp-reverse-of': {
    inputs: [
      { name: 'a', is: 'a string, like `"abc"`' },
      { name: 'b', is: 'another string, like `"cba"`. It may be a different length from `a`.' },
    ],
    returns: '`True` if `a` is exactly `b` read backwards, otherwise `False`.',
    catch: 'Where does each pointer start, and which way does each one walk? Decide what to do about different lengths before you read any characters.',
  },

  // ── Move one pointer ───────────────────────────────────────────────────────
  'd3-pu-has-pair': {
    inputs: [
      { name: 'nums', is: `${SORTED}, like \`[1, 2, 4, 7]\`. It may be empty.` },
      { name: 'target', is: 'the sum you are looking for' },
    ],
    returns: '`True` if two numbers at different positions add up to `target`, otherwise `False`.',
    catch: 'Add the smallest and the largest. If that is too small, which of the two is worth replacing, and with what?',
  },
  'd3-pu-debug-swapped': {
    task: 'It misses pairs that are there. Trace the first test by hand and watch which way the pointers go.',
    inputs: [
      { name: 'nums', is: `${SORTED}, like \`[1, 2, 4, 7]\`` },
      { name: 'target', is: 'the sum you are looking for' },
    ],
    returns: 'a tuple `(small, big)` of the two values that add up to `target`, or `None` if no two do.',
    catch: 'When a sum comes out too small, should the next sum be bigger or smaller? Which move makes it so?',
  },
  'd3-pu-count-pairs': {
    inputs: [
      { name: 'nums', is: `${SORTED}, with no value repeated, like \`[1, 2, 3, 4, 5, 6]\`. It may be empty.` },
      { name: 'target', is: 'the sum each pair must add up to' },
    ],
    returns: 'a whole number: how many pairs of values (from two different positions) add up to `target`. `0` if none.',
    catch: 'Once two values have made a pair, can either of them be part of another pair?',
  },
  'd3-pu-skip-spaces': {
    task: 'The starter sets up the two pointers and sketches the loop in comments. Write the loop.',
    inputs: [{ name: 's', is: 'a string that may contain spaces, like `"taco cat"`. It may be empty or all spaces.' }],
    returns: '`True` if `s` reads the same backwards when spaces are skipped (everything else compared exactly), otherwise `False`.',
    catch: 'While a pointer is stepping over spaces, what stops it from walking past the other pointer, or off the string?',
  },
  'd3-pu-count-below': {
    inputs: [
      { name: 'nums', is: `${SORTED}, like \`[1, 2, 3, 4]\`. Values may repeat; it may be empty.` },
      { name: 'target', is: 'a number. A pair counts when its sum is strictly less than this.' },
    ],
    returns: 'a whole number: how many pairs of positions `i < j` have a sum below `target`.',
    catch: 'If the smallest value plus the largest is already below `target`, what does that tell you about the smallest plus everything in between?',
  },

  // ── Running min/max ────────────────────────────────────────────────────────
  'd3-rs-largest': {
    inputs: [{ name: 'nums', is: 'a list of numbers with at least one item, like `[3, 9, 2]`. They may all be negative.' }],
    returns: 'one number: the biggest value in the list.',
    catch: 'Your best-so-far needs a starting value before the loop. What is a safe one when every number is below zero?',
  },
  'd3-rs-debug-init': {
    task: 'It is right for some lists and wrong for others. Find the lists it gets wrong and ask why.',
    inputs: [{ name: 'nums', is: 'a list of numbers with at least one item, like `[3, 9, 2]`' }],
    returns: 'a tuple `(smallest, largest)`.',
    catch: 'The answer it gives for `[3, 9, 2]` contains a number that is not in the list. Where did it come from?',
  },
  'd3-rs-prefix-mins': {
    inputs: [{ name: 'nums', is: 'a list of numbers, like `[4, 6, 2, 5, 1]`. It may be empty.' }],
    returns: 'a new list, the same length: entry `i` is the smallest value among `nums[0]` up to and including `nums[i]`.',
    catch: 'You do not need to look back over the earlier items each time. What single number can you carry forward?',
  },
  'd3-rs-records': {
    inputs: [{ name: 'scores', is: 'a list of numbers in the order they happened, like `[3, 1, 4, 1, 5]`. It may be empty, and scores may be negative.' }],
    returns: 'a whole number: how many scores are strictly higher than every score before them. The first score counts.',
    catch: 'Equal to the best so far is not a new record. And what starting value lets the very first score count, even a negative one?',
  },
  'd3-rs-biggest-drop': {
    inputs: [{ name: 'values', is: 'a list of numbers in time order, like `[5, 9, 3, 6, 1]`. It may be empty.' }],
    returns: 'one number: the largest fall from an earlier value to a later one, or `0` if the values never fall.',
    catch: 'The high has to come **before** the low. Standing on one value as the low, which earlier value is the only one that matters?',
  },

  // ── Valid Palindrome follow-ups ────────────────────────────────────────────
  'd3-vp-debug-case': {
    task: 'It rejects phrases it should accept. Find the pair of characters where it gives up.',
    inputs: [{ name: 's', is: 'a string that may hold letters, digits, spaces and punctuation, like `"Was it a car or a cat I saw?"`' }],
    returns: '`True` if the letters and digits of `s`, ignoring case, read the same both ways. Otherwise `False`.',
    catch: 'Which two characters does it compare first on the failing test? Are they equal as far as Python is concerned?',
  },
  'd3-vp-debug-guard': {
    task: 'It crashes on some strings. Run it on the failing test and read the error.',
    inputs: [{ name: 's', is: 'a string that may hold letters, digits, spaces and punctuation. It may hold nothing but punctuation, like `".,"`.' }],
    returns: '`True` if the letters and digits of `s`, ignoring case, read the same both ways. Otherwise `False`. Nothing to compare counts as `True`.',
    catch: 'Follow `left` through a string with no letters or digits at all. Where does it end up?',
  },
  'd3-vp-one-deletion': {
    inputs: [{ name: 's', is: 'a string, like `"abca"`. It may be empty. Characters are compared exactly.' }],
    returns: '`True` if `s` already reads the same backwards, or would after removing one character. Otherwise `False`.',
    catch: 'You do not have to try deleting every character. At the first place the string stops matching, how many deletions could possibly fix it?',
  },

  // ── Stock follow-ups ───────────────────────────────────────────────────────
  'd3-stock-debug-order': {
    task: 'It reports a profit on days when no profit is possible. Find what it forgets about time.',
    inputs: [{ name: 'prices', is: 'a list of numbers: the price on day 0, day 1, and so on, like `[7, 1, 5, 3, 6, 4]`. It may be empty.' }],
    returns: 'one number: the best profit from buying on one day and selling on a later day, or `0` if no trade makes money.',
    catch: 'In `[7, 6, 4, 3, 1]`, on which day is the highest price, and on which day the lowest? Could you really make that trade?',
  },
  'd3-stock-days': {
    inputs: [{ name: 'prices', is: 'a list of numbers: the price on day 0, day 1, and so on, like `[7, 1, 5, 3, 6, 4]`. It may be empty.' }],
    returns: 'a tuple `(buy_day, sell_day)` of two day indexes, buy before sell, for the trade with the largest profit. `None` if no trade makes money.',
    catch: 'The answer is two **positions**, not two prices. What do you have to remember as you go so you can still name the day later?',
  },

  // ── Two Sum II follow-ups ──────────────────────────────────────────────────
  'd3-tsii-debug-positions': {
    task: 'The search finds the right pair but reports it wrongly. Compare what it returns with what is expected.',
    inputs: [
      { name: 'numbers', is: `${SORTED}, like \`[2, 7, 11, 15]\`. Exactly one pair adds up to \`target\`.` },
      { name: 'target', is: 'the sum the pair adds up to' },
    ],
    returns: 'a list `[a, b]` of the pair’s two positions, counted from **1** (the first number is position 1), smaller position first.',
    catch: 'How does Python number the first item of a list? How does this problem number it?',
  },
  'd3-tsii-optimize-diff': {
    inputs: [
      { name: 'nums', is: `${SORTED}, like \`[1, 3, 5, 8]\`. Values may repeat; it may be empty.` },
      { name: 'k', is: 'a number, 0 or more: the gap you are looking for' },
    ],
    returns: '`True` if two values at different positions differ by exactly `k`, otherwise `False`.',
    catch: 'Both pointers walk left to right. Which one do you move to make the gap bigger, and which to make it smaller? And when `k` is 0, the two positions must still be different.',
  },
  'd3-tsii-triplet': {
    inputs: [
      { name: 'nums', is: 'a list of numbers in no particular order, like `[4, 1, -3, 2]`. It may have fewer than three items.' },
      { name: 'target', is: 'the sum three numbers must add up to' },
    ],
    returns: '`True` if three numbers at three different positions add up to `target`, otherwise `False`.',
    catch: 'Suppose you have already picked the first of the three. What smaller problem, one you have solved today, is left?',
  },
}
