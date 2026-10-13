import type { Brief } from '@/data/briefs'

/** Plain-English briefs for the oct05 module: what each input is, what to hand back, the one thing to watch. */

const SORTED = 'a list of numbers sorted ascending (smallest first)'
const HEAD = 'the first node of a linked list, or `None` if the list is empty. Each node has `.val` (its value) and `.next` (the node after it, or `None` at the end).'
const HEAD_SHORT = 'the first node of a linked list, or `None` if the list is empty'

export const briefs: Record<string, Brief> = {
  // ── While + indexes ────────────────────────────────────────────────────────
  'd05-while-halvings': {
    inputs: [{ name: 'n', is: 'a whole number, 1 or larger, like `8`' }],
    returns: 'a whole number: how many times `n` can be halved (rounding down) before it reaches 1.',
    catch: '`n` can already be `1`. How many halvings is that?',
  },
  'd05-while-dbg-bounds': {
    task: 'It crashes on some lists. Make it work for every list, including an empty one.',
    inputs: [{ name: 'nums', is: 'a list of numbers. It may be empty, and it may hold no negative value at all.' }],
    returns: 'the index of the first negative value, or `-1` if there is none.',
    catch: 'Run it on `[1, 2]` in your head. What is `i` at the moment it crashes?',
  },
  'd05-while-first-at-least': {
    inputs: [
      { name: 'nums', is: `${SORTED}. Repeats are allowed, and it may be empty.` },
      { name: 'target', is: 'a number. It does not have to be in the list.' },
    ],
    returns: 'an index: the first position whose value is `target` or more. If every value is smaller, `len(nums)`.',
    catch: 'Two things can end the walk: a value that is big enough, or running out of list. Which one has to be checked first?',
  },

  // ── Binary search ──────────────────────────────────────────────────────────
  'd05-bs-body': {
    task: 'The first and last lines are written. You write the loop in between.',
    inputs: [
      { name: 'nums', is: SORTED },
      { name: 'target', is: 'the value to find. It may not be in the list.' },
    ],
    returns: 'the index of `target`, or `-1` if it is not in `nums`.',
    catch: 'When `lo` and `hi` are the same index there is still one item you have not looked at. Does your loop look at it?',
  },
  'd05-bs-contains': {
    inputs: [
      { name: 'nums', is: `${SORTED}. It may be empty.` },
      { name: 'target', is: 'the value to look for' },
    ],
    returns: '`True` if `target` is in `nums`, otherwise `False`. A boolean, not an index.',
    catch: 'With an empty list, where do your two ends start, and does the loop run at all?',
  },
  'd05-bs-dbg-lt': {
    task: 'It finds some targets and misses others that are in the list. Make it find all of them.',
    inputs: [
      { name: 'nums', is: SORTED },
      { name: 'target', is: 'the value to find' },
    ],
    returns: 'the index of `target`, or `-1` if it is not in `nums`.',
    catch: 'Trace it by hand on a list with exactly one item.',
  },
  'd05-bs-optimize': {
    task: 'The code is correct but slow. Rewrite it so it looks at only a handful of items.',
    inputs: [
      { name: 'nums', is: `${SORTED}, with no repeats. A hidden test uses 10,000 of them.` },
      { name: 'target', is: 'the value to find. It may not be in the list.' },
    ],
    returns: 'the same as now: the index of `target`, or `-1`.',
    catch: 'A `for` loop over the list reads every item. What does being sorted let you skip?',
  },
  'd05-bs-dbg-index': {
    task: 'It returns `-1` for values that are in the list. Make it find them.',
    inputs: [
      { name: 'nums', is: SORTED },
      { name: 'target', is: 'the value to find' },
    ],
    returns: 'the index of `target`, or `-1` if it is not in `nums`.',
    catch: 'Write down what kind of thing each name holds: a position in the list, or a value from it.',
  },
  'd05-bs-write-test': {
    task: 'You are not writing a search. You are writing the checks that tell a correct search from the broken one shown.',
    inputs: [{ name: 'search', is: 'a **function**, not a list: the search being tested. Call it like `search([2, 4], 4)` and compare what comes back.' }],
    returns: 'nothing. `test_search` only runs its `assert` lines; a failing assert is how it reports a bad search.',
    catch: 'You need an input where the broken version gives the wrong answer. When does its loop stop one step too early?',
  },

  // ── Search variants ────────────────────────────────────────────────────────
  'd05-var-insert': {
    inputs: [
      { name: 'nums', is: `${SORTED}, with no repeats. It may be empty.` },
      { name: 'target', is: 'a number. It may or may not be in the list.' },
    ],
    returns: 'an index: where `target` is, or, if it is missing, where it would have to be inserted to keep the list sorted. That can be `len(nums)`, one past the end.',
    catch: 'Trace a missing target until the loop stops. Where are your two ends standing?',
  },
  'd05-var-first': {
    inputs: [
      { name: 'nums', is: `${SORTED}. The same value can appear several times in a row.` },
      { name: 'target', is: 'the value to find' },
    ],
    returns: 'the index of the **leftmost** copy of `target`, or `-1` if there is none.',
    catch: 'Landing on a copy of `target` is not the end. Could there be another copy to its left?',
  },
  'd05-var-last': {
    task: 'The code finds the leftmost copy. Change it so it finds the rightmost one.',
    inputs: [
      { name: 'nums', is: `${SORTED}. The same value can appear several times in a row.` },
      { name: 'target', is: 'the value to find' },
    ],
    returns: 'the index of the **rightmost** copy of `target`, or `-1` if there is none.',
    catch: 'After a match, which side could still hold another copy?',
  },
  'd05-var-dbg-first': {
    task: 'It finds a copy of the target, but not always the first one. Make it return the leftmost.',
    inputs: [
      { name: 'nums', is: `${SORTED}. The same value can appear several times in a row.` },
      { name: 'target', is: 'the value to find' },
    ],
    returns: 'the index of the **leftmost** copy of `target`, or `-1` if there is none.',
    catch: 'Try `[4, 4, 4]`. Which copy does it land on first, and what does it do next?',
  },
  'd05-var-dbg-lower': {
    task: 'One kind of answer comes out wrong. Find which, and fix it.',
    inputs: [
      { name: 'nums', is: `${SORTED}. Repeats are allowed, and it may be empty.` },
      { name: 'target', is: 'a number. It does not have to be in the list.' },
    ],
    returns: 'the lower bound: the first index whose value is `target` or more. If every value is smaller, `len(nums)`.',
    catch: 'List every answer this function is allowed to return. Is there one the code can never reach?',
  },
  'd05-var-sqrt': {
    inputs: [{ name: 'x', is: 'a whole number, 0 or larger. It can be in the billions.' }],
    returns: 'a whole number: the largest `r` whose square is not more than `x`. For `15` that is `3`.',
    catch: 'A guess that fits might not be the largest one that fits. What do you do with a guess that fits?',
  },
  'd05-var-first-true': {
    inputs: [{ name: 'flags', is: 'a list of `True`/`False` values with every `False` before every `True`. It may be empty, all `False`, or all `True`.' }],
    returns: 'the index of the first `True`, or `len(flags)` if there is none.',
    catch: 'You may not check the items one by one. What does a single `True` tell you about everything to its right?',
  },
  'd05-fu-insert-position': {
    task: 'The search below gives up with `-1` when the target is missing. Change it to say where the target belongs instead.',
    inputs: [
      { name: 'nums', is: `${SORTED}, with no repeats. It may be empty.` },
      { name: 'target', is: 'a number. It may or may not be in the list.' },
    ],
    returns: 'the index of `target` if it is there; otherwise the index where it would be inserted to keep the list sorted.',
    catch: 'Trace a missing target to the end of the loop. What do you know about every value left of where `lo` stops?',
  },

  // ── ListNode + traversal ───────────────────────────────────────────────────
  'd05-ll-to-array': {
    inputs: [{ name: 'head', is: HEAD }],
    returns: 'a Python list of the values, first node first. `[]` for an empty list.',
    catch: 'A linked list has no indexes and no `len()`. How do you know you have reached the end?',
  },
  'd05-ll-dbg-max': {
    task: 'Some answers are wrong. Find the node it treats differently from the others.',
    inputs: [{ name: 'head', is: 'the first node of a linked list with at least one node' }],
    returns: 'the largest value in the list.',
    catch: 'Try a list whose largest value sits in the last node.',
  },
  'd05-ll-translate': {
    task: 'The top function is finished and works on a Python list. Write the bottom one so it gives the same count for a linked list.',
    inputs: [
      { name: 'head', is: HEAD },
      { name: 'x', is: 'the number to compare each value against' },
    ],
    returns: 'a whole number: how many nodes hold a value greater than `x`. `0` for an empty list.',
    catch: 'A `for` loop moves on by itself. On a linked list, what moves you to the next node, and does it happen on every pass?',
  },
  'd05-ll-last': {
    inputs: [{ name: 'head', is: HEAD_SHORT }],
    returns: 'the value of the last node (the tail), or `None` for an empty list.',
    catch: 'What happens if you ask `None` for its `.next`?',
  },
  'd05-ll-middle': {
    inputs: [{ name: 'head', is: 'the first node of a linked list with at least one node' }],
    returns: 'the value of the node at position `length // 2`, counting from 0. With 4 nodes that is the third one.',
    catch: 'After counting, where is your walking variable standing? Where does the second walk need to start?',
  },

  // ── Pointer rewiring ───────────────────────────────────────────────────────
  'd05-rw-insert-after': {
    inputs: [
      { name: 'head', is: 'the first node of a linked list. Never `None` here.' },
      { name: 'val', is: 'the value for the new node' },
    ],
    returns: '`head`, the same first node, with the new node now second in the chain.',
    catch: 'The node that used to be second must not be lost. What has to point at it afterwards?',
  },
  'd05-rw-remove-second': {
    inputs: [{ name: 'head', is: 'the first node of a linked list. Never `None` here, but it may be the only node.' }],
    returns: '`head`, with the old second node no longer in the chain. A one-node list comes back unchanged.',
    catch: 'There may be no second node. What would reaching past it do then?',
  },
  'd05-rw-dbg-insert-order': {
    task: 'The new node goes in, but the rest of the list is ruined. Make the insert keep every node.',
    inputs: [
      { name: 'head', is: HEAD_SHORT },
      { name: 'x', is: 'the value to look for. It may not be in the list.' },
      { name: 'val', is: 'the value for the new node' },
    ],
    returns: '`head`. The new node sits right after the first node holding `x`; if no node holds `x`, the list is unchanged.',
    catch: 'Draw the arrows after each assignment. After the first one, what still points at the old next node?',
  },
  'd05-rw-finish-reverse': {
    task: 'The first and last lines are written. You write the loop that turns every arrow around.',
    inputs: [{ name: 'head', is: HEAD_SHORT }],
    returns: 'the new first node (the old last one), or `None` for an empty list.',
    catch: 'The moment you turn a node’s arrow around, how will you reach the node that used to come after it?',
  },
  'd05-rw-reversed-copy': {
    inputs: [{ name: 'head', is: HEAD_SHORT }],
    returns: 'the first node of a **new** linked list with the same values in the opposite order. `None` for an empty list.',
    catch: 'A test reads the original list afterwards. It must still read the same, front to back.',
  },
  'd05-rw-dbg-return': {
    task: 'The reversing itself works, but callers get an empty list. Make it hand back the reversed list.',
    inputs: [{ name: 'head', is: HEAD_SHORT }],
    returns: 'the first node of the reversed list.',
    catch: 'When the loop stops, which variable is `None` and which one is standing on a node?',
  },

  // ── Dummy head ─────────────────────────────────────────────────────────────
  'd05-dummy-from-values': {
    inputs: [{ name: 'values', is: 'a Python list, like `[3, 1, 2]`. It may be empty.' }],
    returns: 'the first node of a linked list holding the same values in the same order. `None` for an empty list.',
    catch: 'The dummy is a helper, not part of the answer. Which node is the real first one?',
  },
  'd05-dummy-dbg-return': {
    task: 'The list it hands back is not quite the list it built. Make it return only the odd values.',
    inputs: [{ name: 'head', is: 'the first node of a linked list of whole numbers, or `None` if the list is empty' }],
    returns: 'the first node of a **new** list holding only the odd values, in order. `None` if there are none.',
    catch: 'Compare the first value you get back with the first odd value in the input.',
  },
  'd05-dummy-remove': {
    inputs: [
      { name: 'head', is: HEAD_SHORT },
      { name: 'x', is: 'the value to remove. It may appear many times, or not at all.' },
    ],
    returns: 'the first node of what remains, or `None` if every node was removed.',
    catch: 'The first node can be one of those removed, and so can the one after it. What will you return then?',
  },
  'd05-dummy-merge-arrays': {
    inputs: [
      { name: 'a', is: `${SORTED}. It may be empty.` },
      { name: 'b', is: 'another list of numbers, also sorted ascending. It may be empty.' },
    ],
    returns: 'one **new** sorted list holding every item from both. Repeats are kept.',
    catch: 'One list will run out first. What happens to what is left in the other?',
  },
  'd05-dummy-dbg-leftover': {
    task: 'Some nodes never make it into the result. Make the merge keep every node.',
    inputs: [
      { name: 'a', is: 'the first node of a linked list sorted ascending, or `None`' },
      { name: 'b', is: 'the first node of another sorted linked list, or `None`' },
    ],
    returns: 'the head of one sorted list made of all the nodes from both. `None` if both are empty.',
    catch: 'When the loop stops, one list may still have nodes. Where do they go?',
  },
}
