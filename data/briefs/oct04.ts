import type { Brief } from '@/data/briefs'

const BRACKETS_OK = '`True` if every bracket is closed by the same kind in the right order, otherwise `False`.'
const NO_REPEAT = 'a whole number: the length of the longest piece of `s` (neighbouring characters, none skipped) in which no character appears twice.'

/** Plain-English briefs for the oct04 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── Windows ────────────────────────────────────────────────────────────────
  'd4-win-all-windows': {
    inputs: [
      { name: 's', is: 'a string, like `"abcd"`' },
      { name: 'k', is: 'the window size: how many characters each piece has' },
    ],
    returns: 'a **list of strings**: every piece of `s` that is `k` neighbouring characters long, from left to right.',
    catch: 'How many windows fit? Count them by hand for `"abcd"` with `k = 2`, then with `k = 5`.',
  },
  'd4-win-max-sum-k': {
    inputs: [
      { name: 'nums', is: 'a list of numbers. They can be negative.' },
      { name: 'k', is: 'how many neighbouring values make one window. At least 1, never more than `len(nums)`.' },
    ],
    returns: 'one number: the biggest total of any `k` values that sit next to each other.',
    catch: 'When the window moves one step right, exactly one value comes in and one goes out. Which index goes out?',
  },
  'd4-win-debug-leaving': {
    task: 'The running sum drifts away from what is really in the window. Find out why and fix it.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'k', is: 'the window size, between 1 and `len(nums)`' },
    ],
    returns: 'one number: the smallest total of any `k` neighbouring values.',
    catch: 'Write down which indexes are in the window before a step and after it. Which one dropped out?',
  },
  'd4-win-max-vowels': {
    inputs: [
      { name: 's', is: 'a string of lowercase letters' },
      { name: 'k', is: 'the window size, between 1 and `len(s)`' },
    ],
    returns: 'a whole number: the most vowels found in any `k` letters in a row.',
    catch: 'The count describes the current window. What can change it when the window moves one step?',
  },
  'd4-win-longest-under': {
    inputs: [
      { name: 'nums', is: 'a list of positive numbers' },
      { name: 'limit', is: 'the biggest sum a stretch is allowed to have' },
    ],
    returns: 'a whole number: how many values are in the longest stretch of neighbours whose sum is `limit` or less. `0` if no value fits even on its own.',
    catch: 'After one value leaves on the left, is the window sure to be valid again?',
  },
  'd4-win-debug-shrink': {
    task: 'It finds a stretch that is long enough, but not always the shortest one. Fix it.',
    inputs: [
      { name: 'nums', is: 'a list of positive numbers' },
      { name: 'goal', is: 'the sum a stretch has to reach' },
    ],
    returns: 'a whole number: the length of the shortest stretch of neighbours that adds up to `goal` or more, or `0` if none does.',
    catch: 'Try `[1, 1, 1, 10]` with a goal of 10 by hand. How many values should leave on the left once the 10 arrives?',
  },

  // ── Window state ───────────────────────────────────────────────────────────
  'd4-ws-remove-one': {
    inputs: [
      { name: 'counts', is: 'a dict: item → how many copies of it are in the window' },
      { name: 'key', is: 'the item that is leaving. It is always in `counts`.' },
    ],
    returns: 'the same dict, with one copy of `key` taken out.',
    catch: 'A key whose count is 0 is still a key. What would `len(counts)` say then?',
  },
  'd4-ws-debug-size': {
    task: 'The answers come out too small. Find the count that is off.',
    inputs: [{ name: 'nums', is: 'a list of numbers, possibly empty' }],
    returns: 'a whole number: how many values are in the longest stretch where each is bigger than the one before it.',
    catch: 'How many items are there from index `left` to index `right` when both ends are included?',
  },
  'd4-ws-debug-no-del': {
    task: 'It reports more different values than the window really holds. Fix the bookkeeping.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'k', is: 'the window size, between 1 and `len(nums)`' },
    ],
    returns: 'a whole number: the most different values found in any `k` neighbouring items.',
    catch: 'Print `counts` after each step. Is everything in it really still inside the window?',
  },
  'd4-ws-flip-zeros': {
    inputs: [
      { name: 'bits', is: 'a list of 0s and 1s, possibly empty' },
      { name: 'k', is: 'how many zeros you are allowed to turn into ones. It can be 0.' },
    ],
    returns: 'a whole number: the length of the longest unbroken stretch of ones you could make.',
    catch: 'You never have to actually flip anything. What may a stretch contain for the flips to be enough?',
  },
  'd4-ws-two-kinds': {
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: 'a whole number: the length of the longest piece of `s` (neighbouring characters, none skipped) that uses no more than two different characters.',
    catch: 'The same character can appear many times in a piece. How will you know when its last copy has gone?',
  },
  'd4-ws-k-kinds': {
    inputs: [
      { name: 's', is: 'a string, possibly empty' },
      { name: 'k', is: 'how many different characters a piece may use. It can be 0.' },
    ],
    returns: 'a whole number: the length of the longest piece of `s` (neighbouring characters, none skipped) that uses no more than `k` different characters.',
    catch: 'What is the longest piece you can have when `k` is 0?',
  },

  // ── Longest Substring ──────────────────────────────────────────────────────
  'd4-ls-debug-shrink': {
    task: 'It is right on many strings but not all. Find one it gets wrong, then fix it.',
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: NO_REPEAT,
    catch: 'Trace `"abba"`. After one character has left on the left, is the repeat gone?',
  },
  'd4-ls-last-seen': {
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: NO_REPEAT,
    catch: 'A character’s earlier copy may sit at an index the window has already left behind. What should happen then?',
  },
  'd4-ls-break-jump': {
    task: 'You are the tester. Find a string that makes the code in the question give the wrong length, and return that string.',
    returns: 'a **string**, not a number. Any string the buggy code gets wrong will do.',
    catch: 'Run the buggy code by hand on short strings with a repeated letter. Does `left` ever end up somewhere it should not?',
  },
  'd4-ls-return-substring': {
    task: 'The code already finds the right length. Change what it remembers so it can hand back the text.',
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: 'a **string**: the longest piece of `s` with no repeated character. On a tie, the one that starts first.',
    catch: 'A length alone cannot tell you where the best window was. What else has to be remembered?',
  },

  // ── Stacks ─────────────────────────────────────────────────────────────────
  'd4-st-reverse': {
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: 'a string: `s` backwards.',
    catch: 'In what order do things come off a stack, compared with the order they went on?',
  },
  'd4-st-debug-empty-pop': {
    task: 'It crashes on some inputs. Make it handle them.',
    inputs: [{ name: 's', is: 'a string of letters and `*`' }],
    returns: 'a string: the letters that were never removed, in their original order.',
    catch: 'Run the second test and read the error. What was the stack holding at that moment?',
  },
  'd4-st-adjacent-pairs': {
    inputs: [{ name: 's', is: 'a string, possibly empty' }],
    returns: 'a string: what is left once no two equal characters sit side by side.',
    catch: 'After a pair goes, the characters on either side of it become neighbours. Which earlier character does the next one meet?',
  },
  'd4-st-max-depth': {
    inputs: [{ name: 's', is: 'a string with `(` and `)` mixed in with other characters. Every `(` is closed later.' }],
    returns: 'a whole number: the most brackets that are open at the same moment. `0` if there are none.',
    catch: 'Characters that are not brackets change nothing. When is the depth at its highest: just after a `(`, or just after a `)`?',
  },
  'd4-st-debug-postfix': {
    task: 'Most answers are right and one is wrong. Work out which operator shows the bug, and why.',
    inputs: [{ name: 'expr', is: 'a string of whole numbers and `+ - *` separated by spaces, like `"9 2 -"`' }],
    returns: 'a whole number: the result of the calculation.',
    catch: 'After reading `9` and then `2`, which of the two is on top of the stack?',
  },
  'd4-st-next-greater': {
    inputs: [{ name: 'nums', is: 'a list of numbers, possibly empty' }],
    returns: 'a **list** as long as `nums`. Entry `i` is the first bigger value to the right of `nums[i]`, or `-1` if there is none.',
    catch: 'One new value can settle the answer for several earlier positions at once.',
  },

  // ── Matching pairs ─────────────────────────────────────────────────────────
  'd4-mp-one-line-lookup': {
    task: 'Write two lines under the given code. Each one names a variable.',
    inputs: [
      { name: 'pairs', is: 'a dict: closing bracket → the opening bracket that matches it' },
      { name: 'ch', is: 'a closing bracket, so it is one of the keys of `pairs`' },
      { name: 'other', is: 'a character that is **not** a key of `pairs`' },
    ],
    returns: '`opener` should end up as `"["` and `missing` as `None`.',
    catch: 'Square brackets crash on a key that is not there. Which dict tool hands back `None` instead?',
  },
  'd4-mp-closes-top': {
    inputs: [
      { name: 'stack', is: 'a list of opening brackets still waiting to be closed. The last item is the top. It can be empty.' },
      { name: 'ch', is: 'one closing bracket: `)`, `]` or `}`' },
    ],
    returns: '`True` if the top of the stack is the opener that `ch` matches. `False` otherwise, including when the stack is empty.',
    catch: 'What happens if you look at the top of an empty list? Which question has to be asked first?',
  },
  'd4-mp-first-bad': {
    task: 'The dict and the empty stack are set up for you. Write the loop.',
    inputs: [{ name: 's', is: 'a string of brackets, like `"([)]"`' }],
    returns: 'a whole number: the index of the first closer that has nothing to close or closes the wrong kind. `-1` if every closer is fine.',
    catch: 'Openers still open at the end do not count as bad here. A closer can be bad in two different ways.',
  },
  'd4-mp-pair-positions': {
    inputs: [{ name: 's', is: 'a balanced string of `(` and `)`, like `"(())"`' }],
    returns: 'a **dict**: index of an opener → index of the closer that matches it.',
    catch: 'When a `)` arrives, which of the openers still waiting does it belong to?',
  },
  'd4-mp-debug-peek': {
    task: 'Nested pairs come out too narrow. Find out which opener each closer is being paired with.',
    inputs: [{ name: 's', is: 'a balanced string of `(` and `)`, possibly empty' }],
    returns: 'a whole number: the width of the widest pair, counting both of its brackets. `0` for an empty string.',
    catch: 'Trace `"(())"`. Once an opener has been matched, can it be matched again?',
  },
  'd4-mp-min-to-fix': {
    inputs: [{ name: 's', is: 'a string of `(` and `)` in any order, possibly empty' }],
    returns: 'a whole number: the fewest brackets you would need to add so that every bracket has a partner.',
    catch: 'A bracket can be left without a partner in two different ways. Does your count cover both?',
  },

  // ── Valid Parentheses ──────────────────────────────────────────────────────
  'd4-vp-fix-bug': {
    task: 'It passes the easy case. Run the failing tests: one crashes and one gives the wrong answer.',
    inputs: [{ name: 's', is: 'a string of `()[]{}`, possibly empty' }],
    returns: BRACKETS_OK,
    catch: 'A bracket string can be wrong in three ways. Which of them does this code check?',
  },
  'd4-vp-with-text': {
    inputs: [{ name: 's', is: 'a line of code: brackets mixed with letters, spaces and punctuation' }],
    returns: '`True` if the brackets, ignoring everything else, are each closed by the same kind in the right order. Otherwise `False`.',
    catch: 'A character that is not a closer is no longer sure to be an opener.',
  },
  'd4-vp-debug-map-direction': {
    task: 'It rejects strings that are fine. Follow the very first character through the code.',
    inputs: [{ name: 's', is: 'a string of `()[]{}`, possibly empty' }],
    returns: BRACKETS_OK,
    catch: 'When you look something up in `pairs`, what do you have in hand: an opener or a closer?',
  },
  'd4-ws-distinct-windows': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'k', is: 'the window size: how many neighbouring values each window holds' },
    ],
    returns: 'a **list**, one number per window from left to right: how many different values that window contains. `[]` when `k` is bigger than the list.',
    catch: 'When a value leaves the window, is it really gone from the window, or is another copy of it still inside?',
  },
  'd4-st-round-balanced': {
    inputs: [{ name: 's', is: 'a string made only of `(` and `)`. It may be empty.' }],
    returns: '`True` if every `(` is closed by a later `)` and no `)` arrives with nothing open, otherwise `False`.',
    catch: 'There are two different ways to fail: one shows up in the middle of the string, the other only at the end.',
  },
}
