import type { Brief } from '@/data/briefs'

const TREE_ROOT = 'the top node of a binary tree, or `None` if the tree is empty. Every node has `.val`, `.left` and `.right`.'

/** Plain-English briefs for the oct07 module: what each input is, what to hand back, the one thing to watch. */
export const briefs: Record<string, Brief> = {
  // ── deque ──────────────────────────────────────────────────────────────────
  'o7-dq-drain': {
    inputs: [{ name: 'items', is: 'a list of anything, like `[3, 1, 2]`. It may be empty.' }],
    returns: 'a **list** of the same items, in the order they came out of the front of the deque.',
    catch: '`deque` is not built in. What line has to come before you can use it?',
  },
  'o7-dq-dbg-pop-end': {
    task: 'The numbers come out in the wrong order. Make them come out breadth-first: 1, then its children, then their children.',
    inputs: [{ name: 'limit', is: 'a positive whole number. Numbers bigger than this are left out.' }],
    returns: 'a list of the numbers 1 up to `limit`, in the order they were taken out of the queue.',
    catch: 'A queue hands back the item that has waited longest. Which end of the deque is that one at?',
  },
  'o7-dq-recent': {
    inputs: [
      { name: 'times', is: 'a list of whole numbers, smallest first (repeats allowed): when each event happened' },
      { name: 'window', is: 'a positive whole number: how far back an event still counts' },
    ],
    returns: 'a list the same length as `times`. Entry i is how many events happened from `t - window + 1` up to `t`, where `t` is the i-th time. That event counts itself.',
    catch: 'More than one old time can expire at once. Is one check enough, or do you keep checking?',
  },
  'o7-dq-rotate-elim': {
    inputs: [
      { name: 'names', is: 'a list of at least one name (strings). The first name is at the front of the queue.' },
      { name: 'k', is: 'a whole number, 1 or more: the k-th player in line is the one removed each round' },
    ],
    returns: 'one string: the name of the last player left.',
    catch: 'A player moved to the back is still in the game. Only the one you remove without putting back is out.',
  },

  // ── grids ──────────────────────────────────────────────────────────────────
  'o7-g-count': {
    inputs: [
      { name: 'grid', is: 'a list of rows; each row is a list of cells (numbers or strings). At least one row.' },
      { name: 'target', is: 'the value to count' },
    ],
    returns: 'a whole number: how many cells equal `target`. `0` if none do.',
    catch: 'Which `len` gives the number of rows, and which gives the number of cells in a row?',
  },
  'o7-g-dbg-dims': {
    task: 'It is right on grids with as many rows as columns and wrong on the rest. Make it right on every shape.',
    inputs: [{ name: 'grid', is: 'a list of rows of whole numbers. Rows can be longer or shorter than the grid is tall.' }],
    returns: 'a list with one number per row: the largest value in that row, top row first.',
    catch: 'Try a grid with 2 rows and 3 columns by hand. What do `rows` and `cols` hold?',
  },
  'o7-g-find-all': {
    inputs: [
      { name: 'grid', is: 'a list of rows; each row is a list of cells' },
      { name: 'ch', is: 'the value to look for' },
    ],
    returns: 'a list of `(row, column)` tuples, one per matching cell: top row first, left to right inside a row. `[]` if nothing matches.',
    catch: 'One position is two numbers. How do you add them to a list as a single item?',
  },
  'o7-g-dbg-alias': {
    task: 'The ones end up everywhere. Make each row its own list.',
    inputs: [{ name: 'n', is: 'a positive whole number: the grid has `n` rows and `n` columns' }],
    returns: 'a list of `n` rows of `n` numbers: `1` where the row number equals the column number, `0` everywhere else.',
    catch: 'Set a single cell and print the grid. How many rows changed, and why would that be?',
  },
  'o7-g-dbg-strings': {
    task: 'It always answers 0. Make it count the land.',
    inputs: [{ name: 'grid', is: 'a list of rows of one-character **strings**: `"1"` is land, `"0"` is water' }],
    returns: 'a whole number: how many cells are land.',
    catch: 'Look at what a cell actually holds. Is it the same kind of thing the code compares it to?',
  },

  // ── neighbors ──────────────────────────────────────────────────────────────
  'o7-n-list': {
    inputs: [
      { name: 'grid', is: 'a list of rows. Only its size matters here.' },
      { name: 'r', is: 'the row of the cell you are standing on (inside the grid)' },
      { name: 'c', is: 'its column' },
    ],
    returns: 'a list of `(row, column)` tuples: the cells directly up, down, left and right of `(r, c)`, in that order, leaving out any that are off the grid.',
    catch: 'A corner has two neighbors, an edge cell has three. What decides whether a neighbor is kept?',
  },
  'o7-n-land': {
    inputs: [
      { name: 'grid', is: 'a list of rows of strings: `"1"` is land, `"0"` is water' },
      { name: 'r', is: 'the row of a cell inside the grid' },
      { name: 'c', is: 'its column' },
    ],
    returns: 'a whole number from 0 to 4: how many of the cells directly up, down, left and right of `(r, c)` are land.',
    catch: 'You may only read a cell that exists. Which check has to come first?',
  },
  'o7-n-dbg-bounds': {
    task: 'It hands back cells that are not in the grid. Make it keep only real cells.',
    inputs: [
      { name: 'rows', is: 'how many rows the grid has' },
      { name: 'cols', is: 'how many columns it has' },
      { name: 'r', is: 'the row of a cell inside the grid' },
      { name: 'c', is: 'its column' },
    ],
    returns: 'a list of `(row, column)` tuples: the neighbors of `(r, c)` that are inside the grid, in the order up, down, left, right.',
    catch: 'In a grid with 2 rows, is row 2 a real row?',
  },
  'o7-n-dbg-dirs': {
    task: 'It miscounts for some cells. Make it look once in each of the four directions.',
    inputs: [
      { name: 'grid', is: 'a list of rows of strings: `"."` is open, `"#"` is blocked' },
      { name: 'r', is: 'the row of a cell inside the grid' },
      { name: 'c', is: 'its column' },
    ],
    returns: 'a whole number: how many of the cells directly up, down, left and right of `(r, c)` are open.',
    catch: 'Say what each pair in the directions list does to the row and to the column.',
  },
  'o7-n-perimeter': {
    inputs: [{ name: 'grid', is: 'a list of rows of whole numbers: `1` is land, `0` is water. All the land is one island.' }],
    returns: 'a whole number: how many cell sides lie on the outline of the island. A side is on the outline when the other side of it is water or the edge of the grid.',
    catch: 'Usually a neighbor that is off the grid is skipped. Here, what should it do to the total?',
  },

  // ── grid BFS ───────────────────────────────────────────────────────────────
  'o7-v-finish': {
    task: 'The start is already in the queue and in `visited`, and one cell has been popped. Write what happens to that cell’s neighbors.',
    inputs: [
      { name: 'grid', is: 'a list of rows of whole numbers: `1` is open, `0` is a wall' },
      { name: 'sr', is: 'the row of the start cell, which is open' },
      { name: 'sc', is: 'its column' },
    ],
    returns: 'a whole number: how many open cells can be reached from the start through open cells, counting the start.',
    catch: 'Three things must all be true before a neighbor joins the queue. When it does join, what else has to happen in the same breath?',
  },
  'o7-v-reachable-strings': {
    inputs: [
      { name: 'grid', is: 'a list of rows of strings: `"1"` is land, `"0"` is water. Leave it unchanged.' },
      { name: 'sr', is: 'the row of the start cell (inside the grid; it may be land or water)' },
      { name: 'sc', is: 'its column' },
    ],
    returns: 'a whole number: how many land cells can be walked to from the start over land (up, down, left, right), counting the start. `0` if the start is water.',
    catch: 'What goes into the queue and the visited set before the loop even begins?',
  },
  'o7-v-dbg-late-mark': {
    task: 'Some cells come out twice. Make every cell come out exactly once.',
    inputs: [{ name: 'grid', is: 'a list of rows of whole numbers: `1` is open, `0` is a wall. The top-left cell is open.' }],
    returns: 'a list of `(row, column)` tuples: each open cell reachable from the top-left, once, in the order the queue hands them out.',
    catch: 'While a cell is waiting in the queue, what stops another cell from adding it again?',
  },
  'o7-v-dbg-tuple': {
    task: 'It crashes. Read the error, then make the tests pass.',
    inputs: [
      { name: 'grid', is: 'a list of rows of strings: `"."` is open, `"#"` is blocked' },
      { name: 'sr', is: 'the row of the start cell, which is open' },
      { name: 'sc', is: 'its column' },
    ],
    returns: 'a whole number: how many open cells can be reached from the start, counting the start.',
    catch: 'Not everything can go in a set. What kind of thing is being added here?',
  },
  'o7-v-shortest': {
    inputs: [{ name: 'grid', is: 'a list of rows of whole numbers: `0` is open, `1` is a wall' }],
    returns: 'a whole number: the fewest up/down/left/right moves from the top-left cell to the bottom-right cell through open cells. `-1` if it cannot be done, including when either corner is a wall. `0` when the grid is a single open cell.',
    catch: 'BFS reaches cells in order of how far away they are. How does each cell in the queue know its own distance?',
  },
  'o7-v-flood-fill': {
    inputs: [
      { name: 'image', is: 'a list of rows of whole numbers; each number is a color' },
      { name: 'sr', is: 'the row of the clicked pixel' },
      { name: 'sc', is: 'its column' },
      { name: 'color', is: 'the new color (a whole number)' },
    ],
    returns: 'the same `image` list, changed: the clicked pixel and every pixel joined to it by a chain of same-colored pixels (up, down, left, right) now holds `color`.',
    catch: 'Once the start pixel is repainted, how will you still know which color you were replacing? And what if the new color is the old one?',
  },

  // ── tree BFS ───────────────────────────────────────────────────────────────
  'o7-t-flat': {
    inputs: [{ name: 'root', is: TREE_ROOT }],
    returns: 'one flat list of every value: the root, then the next level left to right, then the level under it, and so on. `[]` for an empty tree.',
    catch: 'A missing child is `None`. What happens if a `None` gets into the queue?',
  },
  'o7-t-dbg-none-child': {
    task: 'It crashes on any tree that has a leaf. Make it count the leaves.',
    inputs: [{ name: 'root', is: TREE_ROOT }],
    returns: 'a whole number: how many nodes have no children at all. `0` for an empty tree.',
    catch: 'After a leaf is popped, what gets added to the queue?',
  },
  'o7-t-sums': {
    inputs: [{ name: 'root', is: TREE_ROOT }],
    returns: 'a list with one number per level: the sum of the values on that level, top level first. `[]` for an empty tree.',
    catch: 'While you pop one level you are adding the next one to the same queue. How do you know where this level ends?',
  },
  'o7-t-dbg-snapshot': {
    task: 'Values from different levels are being compared together. Make each level get its own answer.',
    inputs: [{ name: 'root', is: TREE_ROOT }],
    returns: 'a list with one number per level: the smallest value on that level, top level first. `[]` for an empty tree.',
    catch: 'The queue grows while a level is being popped. When is its length exactly the size of one level?',
  },
  'o7-t-min-depth': {
    inputs: [{ name: 'root', is: TREE_ROOT }],
    returns: 'a whole number: how many nodes are on the shortest path from the root down to a leaf (a node with no children), counting the root and the leaf. `0` for an empty tree.',
    catch: 'A node with one child is not a leaf, so the path cannot stop there.',
  },
  'o7-fu-zigzag': {
    task: 'The code in the editor already returns the levels, each left to right. Change it so every second level comes out right to left.',
    inputs: [{ name: 'root', is: TREE_ROOT }],
    returns: 'a list of lists, one per level, top level first: the first left to right, the second right to left, the third left to right, and so on. `[]` for an empty tree.',
    catch: 'The order nodes are visited in does not have to change. How can you tell whether the level you just finished is an odd or an even one?',
  },

  // ── islands ────────────────────────────────────────────────────────────────
  'o7-i-sink-dfs': {
    inputs: [
      { name: 'grid', is: 'a list of rows of strings: `"1"` is land, `"0"` is water. You change it.' },
      { name: 'r', is: 'the row of a cell' },
      { name: 'c', is: 'its column' },
    ],
    returns: 'a whole number: how many land cells you turned into `"0"`. That is the cell `(r, c)` plus all land joined to it up, down, left or right. `0` if `(r, c)` is water.',
    catch: 'Two land cells side by side each lead to the other. What stops you going back and forth forever?',
  },
  'o7-i-sink-iter': {
    task: 'The recursive `sink` in the editor works. Write `sink_iter` to do the same job with a loop and a list instead of calling itself.',
    inputs: [
      { name: 'grid', is: 'a list of rows of strings: `"1"` is land, `"0"` is water. You change it.' },
      { name: 'r', is: 'the row of a cell inside the grid' },
      { name: 'c', is: 'its column' },
    ],
    returns: 'a whole number: how many land cells were turned into `"0"` (the whole island that `(r, c)` is part of). `0` if `(r, c)` is water.',
    catch: 'If a cell is only sunk when it is taken off the list, how many times can it be put on the list first?',
  },
  'o7-i-dbg-count-every': {
    task: 'It counts cells, not lakes. Make one lake count once however many cells it has.',
    inputs: [{ name: 'grid', is: 'a list of rows of strings: `"W"` is water, `"."` is dry ground' }],
    returns: 'a whole number: how many separate lakes there are. A lake is a group of `"W"` cells joined up, down, left or right.',
    catch: 'The scan reaches a `"W"` that an earlier search already covered. Should it start a new lake?',
  },
  'o7-i-max-area': {
    inputs: [{ name: 'grid', is: 'a list of rows of whole numbers: `1` is land, `0` is water' }],
    returns: 'a whole number: how many cells are in the biggest island (land cells joined up, down, left or right). `0` if there is no land.',
    catch: 'Each island needs its own count, started fresh. Where does that count begin, and where is it compared with the best so far?',
  },
  'o7-t-right-view': {
    inputs: [{ name: 'root', is: 'the top node of a binary tree, or `None` for an empty tree' }],
    returns: 'a **list** with one value per level, top level first: the value of the node furthest to the right on that level. `[]` for an empty tree.',
    catch: 'The furthest-right node of a level is not always a right child. What tells you a node is the last one of its level?',
  },
}
