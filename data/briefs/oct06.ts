import type { Brief } from '@/data/briefs'

const ROOT = 'the top node of a binary tree, or `None` for an empty tree'
const PAIR_A = 'the root of the first binary tree, or `None`'
const PAIR_B = 'the root of the second binary tree, or `None`'

/** Plain-English briefs for the oct06 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── Functions ──────────────────────────────────────────────────────────────
  'd06-fn-tuple': {
    inputs: [{ name: 'nums', is: 'a list of numbers with at least one item, like `[3, 9, 1, 4]`' }],
    returns: 'one **tuple** of two numbers: the smallest, then the largest. For `[3, 9, 1, 4]` that is `(1, 9)`.',
    catch: 'What should both be before you have looked at anything? Starting from 0 breaks on a list of negatives.',
  },
  'd06-fn-dbg-return': {
    task: 'The maths is right, but whoever calls the function gets `None`. Make the function hand its answer back.',
    inputs: [{ name: 'nums', is: 'a list of numbers. It can be empty.' }],
    returns: 'the mean of the numbers, or `0` for an empty list.',
    catch: 'Showing a value on the screen and handing it back to the caller are different things.',
  },
  'd06-fn-helper': {
    task: 'Fill in the inner function `visit`. Everything around it is already written.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'limit', is: 'a number to compare against' },
    ],
    returns: 'a list of the numbers greater than `limit`, in their original order. `[]` if there are none.',
    catch: '`visit` does not hand anything back. Where does it put the numbers it keeps?',
  },

  // ── Recursion ──────────────────────────────────────────────────────────────
  'd06-rec-sum-to': {
    inputs: [{ name: 'n', is: 'a whole number, 0 or more' }],
    returns: 'the sum `1 + 2 + ... + n`, as a number. For `4` that is `10`; for `0` it is `0`.',
    catch: 'The function must call itself. Which `n` can you answer without another call?',
  },
  'd06-rec-dbg-base': {
    task: 'It works for most numbers and crashes for one. Make it stop for every input it accepts.',
    inputs: [{ name: 'n', is: 'a whole number, 0 or more' }],
    returns: '`n` factorial: `n * (n - 1) * ... * 1`. For `0` the answer is `1`.',
    catch: 'Follow the calls for the smallest allowed `n`. Does it ever reach the line that stops?',
  },
  'd06-rec-dbg-no-return': {
    task: 'The sum is worked out and then lost. Make every call hand its answer back to the call that asked.',
    inputs: [{ name: 'nums', is: 'a list of numbers. It can be empty.' }],
    returns: 'the sum of the numbers, or `0` for an empty list.',
    catch: 'What does a function hand back when it reaches its last line without a `return`?',
  },
  'd06-rec-reverse-str': {
    inputs: [{ name: 's', is: 'a string, like `"abc"`. It can be empty.' }],
    returns: 'a new string with the same characters in the opposite order. `"abc"` gives `"cba"`; `""` gives `""`.',
    catch: 'Which strings are already their own reverse? Without that stopping point the calls never end.',
  },
  'd06-rec-pal': {
    inputs: [
      { name: 's', is: 'a string' },
      { name: 'i', is: 'the index of the leftmost character still to check' },
      { name: 'j', is: 'the index of the rightmost character still to check (included)' },
    ],
    returns: '`True` if the characters from `i` through `j` read the same forwards and backwards, otherwise `False`.',
    catch: 'There are two ways to stop: nothing left to compare, or two characters that differ. Which answer goes with which?',
  },

  // ── TreeNode ───────────────────────────────────────────────────────────────
  'd06-tn-is-leaf': {
    inputs: [{ name: 'node', is: 'one `TreeNode`, or `None`' }],
    returns: '`True` if `node` is a leaf (a real node whose `.left` and `.right` are both `None`), otherwise `False`. `None` gives `False`.',
    catch: 'Reading `.left` on `None` crashes. What do you have to ask first?',
  },
  'd06-tn-children-sum': {
    inputs: [{ name: 'node', is: 'one `TreeNode`, never `None`. Either of its children may be missing.' }],
    returns: 'a number: the value of its left child plus the value of its right child. A missing child adds `0`.',
    catch: 'A missing child is `None`, and `None` has no `.val`.',
  },
  'd06-tn-dbg-none': {
    task: 'It is right when there is a left child and crashes when there is not. Make it answer `False` there.',
    inputs: [{ name: 'node', is: 'one `TreeNode`, never `None`. Its left child may be missing.' }],
    returns: '`True` if `node` has a left child and that child has no children of its own, otherwise `False`.',
    catch: 'Run it on a node with no left child and read the error message.',
  },

  // ── Tree DFS ───────────────────────────────────────────────────────────────
  'd06-dfs-preorder': {
    task: 'Fill in the inner function `visit`. It is called once for the root and must reach every node below it.',
    inputs: [
      { name: 'root', is: ROOT },
      { name: 'node', is: 'the node `visit` is looking at right now. It is `None` when a child is missing.' },
    ],
    returns: 'a list of every value: each node’s own value first, then its whole left subtree, then its whole right subtree. `[]` for an empty tree.',
    catch: '`visit` gets called on missing children too. What should it do then?',
  },
  'd06-dfs-count': {
    inputs: [{ name: 'root', is: ROOT + '. Its `.left` and `.right` are each the top of a smaller tree, or `None`.' }],
    returns: 'a whole number: how many nodes the tree has. `0` for an empty tree.',
    catch: 'Calling the function on `root.left` gives the count for everything on the left. What is still uncounted after you have both sides?',
  },
  'd06-dfs-dbg-ignore': {
    task: 'It visits every node and still returns only one value. Make every node’s value reach the total.',
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'the sum of every value in the tree. `0` for an empty tree.',
    catch: 'The two calls on the children each hand back a number. Where does that number go?',
  },
  'd06-dfs-contains': {
    inputs: [
      { name: 'root', is: ROOT + '. The values are in no particular order.' },
      { name: 'x', is: 'the value to look for' },
    ],
    returns: '`True` if at least one node holds `x`, otherwise `False`. An empty tree gives `False`.',
    catch: 'The value can be anywhere, including deep on the right. How do you make sure both sides get asked?',
  },
  'd06-dfs-inorder-return': {
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'a **new list** of every value: the whole left subtree first, then the node’s own value, then the whole right subtree. `[]` for an empty tree.',
    catch: 'No outer list this time. Each call hands back a list, so what do you do with the two lists the children give you?',
  },
  'd06-dfs-dbg-depth': {
    task: 'It is right for some trees and one too small for others. Make it right whichever side is deeper.',
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'how many **nodes** are on the longest path from the root down to a leaf. `0` for an empty tree, `1` for a single node.',
    catch: 'Try a root whose only child is on the right. Does the root itself get counted?',
  },

  // ── Max depth follow-up ────────────────────────────────────────────────────
  'd06-fu-min-depth': {
    task: 'The code in the editor finds the deepest leaf. Change it to find the shallowest one.',
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'how many nodes are on the **shortest** path from the root down to a leaf (a node with no children). `0` for an empty tree.',
    catch: 'A missing child is not a leaf. What should a node with only one child answer?',
  },

  // ── Two trees at once ──────────────────────────────────────────────────────
  'd06-pair-lists': {
    inputs: [
      { name: 'a', is: 'the first node of one linked list, or `None` for an empty list' },
      { name: 'b', is: 'the first node of another linked list, or `None`' },
    ],
    returns: '`True` if both lists hold the same values in the same order and have the same length, otherwise `False`. Two empty lists give `True`.',
    catch: 'One list can run out before the other. Sort out the `None` cases before you read any `.val`.',
  },
  'd06-pair-dbg-order': {
    task: 'It answers `False` for everything, even two identical trees. Make matching shapes answer `True`.',
    inputs: [
      { name: 'a', is: PAIR_A },
      { name: 'b', is: PAIR_B },
    ],
    returns: '`True` if wherever one tree has a node the other has one too (values do not matter), otherwise `False`. Two empty trees give `True`.',
    catch: 'Every walk down the two trees ends at a pair of missing children. Which line answers for that pair?',
  },
  'd06-pair-bigger': {
    inputs: [
      { name: 'a', is: PAIR_A },
      { name: 'b', is: PAIR_B },
    ],
    returns: '`True` if the trees have the same shape and every value in `a` is strictly larger than the value in the same position in `b`. Otherwise `False`. Two empty trees give `True`.',
    catch: 'A node in one tree with nothing in the same spot in the other makes the answer `False`, and so do two equal values.',
  },
  'd06-pair-dbg-values': {
    task: 'It says `True` for some pairs of trees that are different. Make it say `True` only for identical trees.',
    inputs: [
      { name: 'a', is: PAIR_A },
      { name: 'b', is: PAIR_B },
    ],
    returns: '`True` only if both trees have the same shape and the same value in every matching position.',
    catch: 'Compare a tree with a copy of itself that has one node removed. What does the code say when only one side is missing?',
  },
  'd06-pair-mirror': {
    inputs: [
      { name: 'a', is: PAIR_A },
      { name: 'b', is: PAIR_B },
    ],
    returns: '`True` if `b` is `a` flipped left to right at every node, with the same values, otherwise `False`. Two empty trees give `True`.',
    catch: 'A tree with different values on its two sides is not its own mirror image. Which node of `b` should each node of `a` be compared with?',
  },

  // ── Changing trees ─────────────────────────────────────────────────────────
  'd06-mut-dbg-swap': {
    task: 'After the swap one child shows up twice and the other is gone. Make both survive.',
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'the same `root`, with its left and right children exchanged. Nothing deeper changes. `None` stays `None`.',
    catch: 'After the first assignment runs, where is the old left child?',
  },
  'd06-mut-add-one': {
    inputs: [{ name: 'root', is: ROOT + '. Every node holds a number.' }],
    returns: 'the same `root` you were given, after every value in the tree has gone up by 1. `None` for an empty tree.',
    catch: 'No new nodes: the existing ones change. Do not forget to hand the tree back.',
  },
  'd06-mut-copy': {
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'the root of a **new** tree with the same shape and values, made entirely of new nodes. `None` for an empty tree.',
    catch: 'If the copy reuses even one of the original nodes, changing the copy changes the original.',
  },
  'd06-mut-dbg-mirror': {
    task: 'One side of the tree ends up on both sides. Make every node’s two subtrees trade places without losing either.',
    inputs: [{ name: 'root', is: ROOT }],
    returns: 'the same `root`, with left and right exchanged at every node. `None` for an empty tree.',
    catch: 'When the second assignment runs, what is on the left by then?',
  },
  'd06-dfs-max': {
    inputs: [{ name: 'root', is: 'the top node of a binary tree, or `None` for an empty tree. Values can be negative.' }],
    returns: 'the largest value anywhere in the tree. For an empty tree: `float("-inf")`.',
    catch: 'Three numbers are in play at every node: its own value and one answer from each side. Why is 0 the wrong answer for an empty side?',
  },
}
