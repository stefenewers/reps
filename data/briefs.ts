/**
 * "This question, in plain English": what each input is, what you hand back,
 * and the one thing to watch. Shown first when Basics opens on a rep.
 *
 * A brief explains the question, never the answer: no code from the
 * solution, and the catch is a pointer (often a question), not a fix.
 */
export interface Brief {
  /** For reps where the job itself needs saying (traces, fills, debugs). */
  task?: string
  /** Every input, in order, in plain words. */
  inputs?: { name: string; is: string }[]
  /** What the function hands back. */
  returns?: string
  /** The one thing that trips people up. */
  catch?: string
}

const PREDICT = 'Read the code top to bottom and write exactly what it prints.'

export const BRIEFS: Record<string, Brief> = {
  // ── Dictionaries ───────────────────────────────────────────────────────────
  'o2-dict-assign-trace': {
    task: PREDICT,
    catch: 'Keep a table of what `stock` holds after each line. When a key is assigned a second time, what happens to its old value?',
  },
  'o2-dict-squares-map': {
    inputs: [{ name: 'n', is: 'a whole number, like `3`' }],
    returns: 'a **dict**. Keys: the numbers 1 up to `n`. Values: each number times itself.',
    catch: '`n` can be `0`. Then there is nothing to store.',
  },
  'o2-dict-in-keys': {
    task: PREDICT,
    catch: 'For each `in`, ask: is this thing one of the **keys**, or is it a value?',
  },
  'o2-dbg-keyerror': {
    task: 'The code works for items that are listed. Make it work for items that are not.',
    inputs: [
      { name: 'stock', is: 'a dict: item name → how many are in stock' },
      { name: 'item', is: 'one item name (a string). It might not be in `stock`.' },
    ],
    returns: 'a number: how many of `item` there are, or `0` if it is not listed.',
    catch: 'Run it with an item that is not in `stock` and read the error.',
  },
  'o2-dict-safe-lookup': {
    inputs: [
      { name: 'd', is: 'a dictionary' },
      { name: 'key', is: 'the key to look for. It may or may not be in `d`.' },
      { name: 'fallback', is: 'what to hand back when `key` is not in `d`' },
    ],
    returns: 'the value stored under `key`, or `fallback` if there is none.',
    catch: 'Ask whether the key is there **before** you read it. Reading a missing key crashes.',
  },
  'o2-dbg-in-values': {
    task: 'It answers the wrong question. Make it answer the right one.',
    inputs: [
      { name: 'd', is: 'a dictionary' },
      { name: 'target', is: 'a value to look for' },
    ],
    returns: '`True` if `target` is one of the dict’s **values**, otherwise `False`.',
    catch: 'On a dict, what does `in` actually look at?',
  },
  'o2-dict-invert': {
    inputs: [{ name: 'd', is: 'a dict whose values are all different' }],
    returns: 'a **new** dict with every pair flipped: each old value becomes a key, and its old key becomes the value.',
    catch: 'In the new dict, what will you look things up by?',
  },

  // ── Dictionary check ───────────────────────────────────────────────────────
  'o2-drev-trace': {
    task: PREDICT,
    catch: 'Write the table first, line by line. Then answer each print from the table, not from memory.',
  },
  'o2-drev-crash': {
    task: 'Pick the one line that makes Python stop with an error.',
    catch: 'Three of these are safe even when the key is missing. Which one is not?',
  },
  'o2-drev-make-menu': {
    inputs: [
      { name: 'items', is: "a list of item names, like `['tea', 'cake']`" },
      { name: 'prices', is: 'a list of numbers, the same length. The price at position 0 goes with the item at position 0, and so on.' },
    ],
    returns: 'a **dict**: item name → its price.',
    catch: 'You are walking two lists in step. The same position in each belongs together.',
  },
  'o2-drev-bill': {
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'order', is: 'a list of item names. Names can repeat, and some may not be on the menu.' },
    ],
    returns: 'one number: the total price of everything in `order`.',
    catch: 'An item that is not on the menu must add nothing. It must not crash.',
  },
  'o2-drev-dbg-cheapest': {
    task: 'It crashes. Find what is being compared and make it compare the right things.',
    inputs: [{ name: 'menu', is: 'a dict: item name → price, with at least one item' }],
    returns: 'the **name** (a string) of the cheapest item.',
    catch: 'When you loop over a dict, what do you get each time round: a name or a price?',
  },
  'o2-drev-under': {
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'limit', is: 'a number' },
    ],
    returns: 'a **list of names**, sorted A→Z, of the items that cost `limit` or less.',
    catch: 'You test the price but keep the name, so you need both each time round.',
  },
  'o2-drev-seat-chart': {
    inputs: [{ name: 'seats', is: 'a dict: guest name → seat number. No two guests share a seat.' }],
    returns: 'a **new** dict going the other way: seat number → guest name.',
    catch: 'Same data, other direction. Ask: what will I look up by?',
  },
  'o2-drev-reprice': {
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'changes', is: 'a dict: item name → new price. It can mention items that are not on the menu.' },
    ],
    returns: 'a **new** dict: the menu with each change applied.',
    catch: 'Two rules: ignore changes for items not on the menu, and leave `menu` itself untouched.',
  },

  // ── .get() ─────────────────────────────────────────────────────────────────
  'o2-get-trace': {
    task: PREDICT,
    catch: '`.get` never crashes. What does it hand back for a missing key when you give it no default?',
  },
  'o2-get-line': {
    task: 'Write one line that sets `have` to how many `name`s are in `inventory`, or `0` if it is not there.',
    inputs: [
      { name: 'inventory', is: 'a dict: item name → how many' },
      { name: 'name', is: 'one item name. It might not be in `inventory`.' },
    ],
    catch: 'The second thing you pass to `.get` is what you get back when the key is missing.',
  },
  'o2-get-total-cost': {
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'order', is: 'a list of item names. Repeats allowed, and some may not be on the menu.' },
    ],
    returns: 'one number: the total price.',
    catch: 'Items not on the menu cost 0. Let `.get` supply that 0.',
  },
  'o2-dbg-get-args': {
    task: 'It runs, but the list it hands back is wrong.',
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'items', is: 'a list of item names' },
    ],
    returns: 'a **list** of prices in the same order as `items`, with `-1` for anything not on the menu.',
    catch: 'Run it and look at what is actually in the list. Is it prices?',
  },
  'o2-get-count-fill': {
    task: 'Fill the blank so that every time a letter is seen, its count goes up by one.',
    catch: 'The first time a letter is seen it is not in `counts` yet. What should its old count be?',
  },
  'o2-get-list-default': {
    inputs: [{ name: 'words', is: 'a list of words, none of them empty' }],
    returns: 'a **dict**: first letter → the list of words starting with that letter, in their original order.',
    catch: 'The first word for a letter needs a new, empty list to go into. Later words join that same list.',
  },

  // ── Iterating dicts ────────────────────────────────────────────────────────
  'o2-iter-items': {
    task: PREDICT,
    catch: '`.items()` gives you each key with its value, in the order they were added.',
  },
  'o2-iter-fill': {
    inputs: [{ name: 'scores', is: 'a dict: name → score' }],
    returns: "a **list of strings** like `'a=1'`, one per entry, in the dict’s order.",
    catch: 'Each string needs the name **and** the score, so you need both each time round.',
  },
  'o2-iter-keys-above': {
    inputs: [
      { name: 'd', is: 'a dict whose values are numbers' },
      { name: 'limit', is: 'a number' },
    ],
    returns: 'a **list of keys** whose value is greater than `limit`, in the dict’s order.',
    catch: '“Greater than” is strict: a value equal to `limit` does not count.',
  },
  'o2-dbg-items-unpack': {
    task: 'It crashes. Make it add up the scores.',
    inputs: [{ name: 'scores', is: 'a dict: name → score' }],
    returns: 'one number: the sum of all the scores.',
    catch: 'Run it and read the error. What does the loop hand you each time round?',
  },

  // ── Frequency maps ─────────────────────────────────────────────────────────
  'o2-freq-trace': {
    task: PREDICT,
    catch: 'Track `counts` in a table. A letter that has not been seen yet starts from 0.',
  },
  'o2-freq-fill': {
    inputs: [{ name: 's', is: "a string, like `'aab'`. It can be empty." }],
    returns: 'a **dict**: each character → how many times it appears.',
    catch: 'The first time you meet a character it has no count yet.',
  },
  'o2-dbg-freq-plus-eq': {
    task: 'It crashes. Make it count.',
    inputs: [{ name: 's', is: 'a string' }],
    returns: 'a **dict**: each character → how many times it appears.',
    catch: "Trace it with `'aba'`. Does it crash on a character's first appearance, or a repeat?",
  },
  'o2-dbg-freq-overwrite': {
    task: 'It runs, but the counts are wrong.',
    inputs: [{ name: 'nums', is: 'a list of numbers' }],
    returns: 'a **dict**: each number → how many times it appears.',
    catch: 'Trace `tally([2, 2, 5])`. Is the count for 2 right?',
  },
  'o2-freq-words': {
    inputs: [{ name: 'sentence', is: "a string of words separated by spaces. It can be `''`." }],
    returns: 'a **dict**: each word → how many times it appears.',
    catch: '`sentence.split()` gives you the list of words. An empty sentence gives an empty dict.',
  },
  'o2-dbg-get-no-default': {
    task: 'It crashes. Make it count.',
    inputs: [{ name: 'words', is: 'a list of words' }],
    returns: 'a **dict**: word length → how many words have that length.',
    catch: 'Run it and read the error message slowly. What type is the thing that cannot be added?',
  },
  'o2-freq-most-common': {
    inputs: [{ name: 'nums', is: 'a non-empty list of numbers. Exactly one value appears most often.' }],
    returns: 'that **value**, not its count.',
    catch: 'Find the biggest count, but hand back the value it belongs to.',
  },
  'o2-freq-same-counts': {
    task: 'Write a helper `counts_of(items)` too, and use it on both lists.',
    inputs: [
      { name: 'a', is: 'a list' },
      { name: 'b', is: 'another list' },
    ],
    returns: '`True` if both lists hold the same values the same number of times, in any order. Otherwise `False`.',
    catch: 'Same values and same counts. The order does not matter.',
  },
  'o2-freq-first-unique': {
    inputs: [{ name: 's', is: 'a string' }],
    returns: 'the **position** of the first character that appears exactly once, or `-1` if there is none.',
    catch: 'You cannot know a character is unique until you have seen the whole string. And you return a position, not the character.',
  },

  // ── Dictionaries from scratch (end-of-day check) ──────────────────────────
  'o2-dmas-trace': {
    task: PREDICT,
    catch: 'Keep a table of `plays` after every loop step. Does `.get` with a default ever add a key?',
  },
  'o2-dmas-count-plays': {
    inputs: [{ name: 'plays', is: 'a list of song names, one entry each time a song was played' }],
    returns: 'a **dict**: song name → how many times it was played.',
    catch: 'The first time you meet a song it has no count yet.',
  },
  'o2-dmas-dbg-minutes': {
    task: 'It crashes on some playlists. Make it add up the minutes.',
    inputs: [
      { name: 'lengths', is: 'a dict: song name → length in minutes' },
      { name: 'playlist', is: 'a list of song names. Some may not be in `lengths`.' },
    ],
    returns: 'one number: the total minutes, where unknown songs count as 0.',
    catch: 'Run it with a song that is not in `lengths`, and read the error.',
  },
  'o2-dmas-merge': {
    inputs: [
      { name: 'a', is: 'a dict: song name → number of plays' },
      { name: 'b', is: 'another dict like `a`, from a different phone' },
    ],
    returns: 'a **new** dict with every song from either one, its plays added together.',
    catch: 'A song might be in `a` only, `b` only, or both. And leave `a` and `b` untouched.',
  },
  'o2-dmas-by-artist': {
    inputs: [{ name: 'artist_of', is: 'a dict: song name → artist name' }],
    returns: 'a **dict**: artist name → a sorted list of that artist’s song names.',
    catch: 'The new dict goes the other way. What will you look up by, and what do you get back?',
  },
  'o2-dmas-top-song': {
    inputs: [{ name: 'plays', is: 'a non-empty list of song names, one per play. Exactly one song is played the most.' }],
    returns: 'the **name** of the most played song, not how many plays it had.',
    catch: 'You cannot know the winner until every play has been counted.',
  },

  // ── Dictionary ladder ──────────────────────────────────────────────────────
  'o2-dl-empty': { task: 'Pick the line that makes an empty dictionary.', catch: 'One of these looks right but makes a different kind of collection.' },
  'o2-dl-trace-basic': { task: PREDICT, catch: 'Keep a table of `ages` after every line. Does assigning `ana` again add a key or replace one?' },
  'o2-dl-add-line': {
    task: "Write one line that adds the entry `'grass'` → `'green'` to `colors`.",
    inputs: [{ name: 'colors', is: 'a dict: thing → its color' }],
    catch: 'Adding a new key uses the same shape as changing one.',
  },
  'o2-dl-in-trace': { task: PREDICT, catch: 'For each line ask: is this a key, or a value? `in` on its own only looks at keys.' },
  'o2-dl-crash': { task: 'Pick the one line that makes Python stop with an error.', catch: 'Reading, asking and adding behave differently when the key is missing.' },
  'o2-dl-price-or': {
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'item', is: 'an item name. It may not be on the menu.' },
    ],
    returns: "the price, or the string `'not on menu'`.",
    catch: 'Ask before you read.',
  },
  'o2-dl-get-trace': { task: PREDICT, catch: 'What does `.get` give back for a missing key with no default? And does it ever add a key?' },
  'o2-dl-sell': {
    inputs: [
      { name: 'stock', is: 'a dict: item name → how many are left. You change this dict itself.' },
      { name: 'item', is: 'the item someone wants to buy' },
    ],
    returns: '`True` if one was sold (and `stock` now has one fewer), otherwise `False` with `stock` unchanged.',
    catch: 'Two things must be true to sell: the item is listed, and there is at least one left.',
  },
  'o2-dl-loop-trace': { task: PREDICT, catch: 'Three loops: what does each one hand you, keys, values or both?' },
  'o2-dl-sum-values': {
    inputs: [{ name: 'stock', is: 'a dict: item name → how many are left' }],
    returns: 'one number: all the counts added together.',
    catch: 'The names do not matter here, only the numbers.',
  },
  'o2-dl-keys-for': {
    inputs: [
      { name: 'scores', is: 'a dict: student name → score' },
      { name: 'target', is: 'a score to match' },
    ],
    returns: 'a **sorted list of names** whose score equals `target`.',
    catch: 'You test the value and keep the key.',
  },
  'o2-dl-dbg-values': {
    task: 'It crashes. Make it count.',
    inputs: [
      { name: 'menu', is: 'a dict: item name → price' },
      { name: 'limit', is: 'a number' },
    ],
    returns: 'how many items cost more than `limit`.',
    catch: 'The loop variable is called `price`. Is it really a price?',
  },
  'o2-dl-max-key': {
    inputs: [{ name: 'scores', is: 'a non-empty dict: student name → score. One student has the top score.' }],
    returns: 'the **name** of the top student, not the score.',
    catch: 'Keep track of the best one so far as you go through.',
  },
  'o2-dl-flip': {
    inputs: [{ name: 'codes', is: 'a dict: country → dialing code. Every code is different.' }],
    returns: 'a **new** dict: dialing code → country.',
    catch: 'In the new dict, what will you look up by?',
  },
  'o2-dl-initials': {
    inputs: [{ name: 'names', is: 'a list of non-empty names' }],
    returns: 'a **dict**: each name → its first letter.',
    catch: 'Ask: what do I look up by, and what do I want back?',
  },
  'o2-dl-pair-up': {
    inputs: [
      { name: 'keys', is: 'a list' },
      { name: 'values', is: 'a list the same length. The item at each position goes with the key at that position.' },
    ],
    returns: 'a **dict** pairing them up.',
    catch: 'You need the position as you walk, to find the matching value.',
  },
  'o2-dl-letter-count': {
    inputs: [{ name: 'word', is: 'a string (can be empty)' }],
    returns: 'a **dict**: each letter → how many times it appears.',
    catch: 'The first time you meet a letter it has no count yet.',
  },
  'o2-dl-dbg-reset': {
    task: 'It runs, but every count comes out as 1.',
    inputs: [{ name: 'votes', is: 'a list of names, one per vote' }],
    returns: 'a **dict**: name → number of votes.',
    catch: 'Look at what happens to a name that has already been counted.',
  },
  'o2-dl-group-len': {
    inputs: [{ name: 'words', is: 'a list of words' }],
    returns: 'a **dict**: word length → the list of words with that length, in their original order.',
    catch: 'The value is a list that grows. It has to exist before you can add to it.',
  },
  'o2-dl-enum-trace': { task: PREDICT, catch: 'Keep a table of `i`, `w` and `where` per step. What happens when `up` comes round again?' },
  'o2-dl-first-index': {
    inputs: [{ name: 'nums', is: 'a list of numbers. Numbers can repeat.' }],
    returns: 'a **dict**: each number → the position where it **first** appears.',
    catch: 'Storing on every visit keeps the last position, not the first.',
  },
  'o2-dl-lookup-positions': {
    inputs: [
      { name: 'words', is: 'a list of words, no repeats' },
      { name: 'queries', is: 'a list of words to find' },
    ],
    returns: 'a **list**: the position of each query in `words`, or `-1` if it is not there.',
    catch: 'Build the lookup dict once, before you answer any query.',
  },
  'o2-dl-dbg-direction': {
    task: 'It runs, but the dict is the wrong way round.',
    inputs: [{ name: 'letters', is: 'a list of letters' }],
    returns: 'a **dict** where looking up a letter gives its position.',
    catch: "What should `position_map(['x', 'y'])['y']` give? What does it give now?",
  },
  'o2-dl-lc-two-sum': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number. Exactly one pair of different positions adds up to it.' },
    ],
    returns: 'a **list of two positions** `[i, j]` with `i < j`.',
    catch: 'A number must not pair with itself: think about when you store it.',
  },
  'o2-dl-lc-anagram': {
    inputs: [
      { name: 'a', is: 'a string' },
      { name: 'b', is: 'another string' },
    ],
    returns: '`True` if both use exactly the same letters the same number of times, otherwise `False`.',
    catch: 'Order does not matter, counts do.',
  },
  'o2-dl-lc-first-unique': {
    inputs: [{ name: 'words', is: 'a list of words' }],
    returns: 'the first word (in list order) that appears exactly once, or `None`.',
    catch: 'You cannot tell a word is unique until you have seen the whole list.',
  },
  'o2-dl-lc-ransom': {
    inputs: [
      { name: 'note', is: 'the string you want to write' },
      { name: 'letters', is: 'a string of the letters you have. Each one can be used once.' },
    ],
    returns: '`True` if the note can be written, otherwise `False`.',
    catch: 'Think of the letters as a budget that gets spent.',
  },
  'o2-dl-lc-majority': {
    inputs: [{ name: 'nums', is: 'a non-empty list. One value appears more than half the time.' }],
    returns: 'that value.',
    catch: '“More than half” of a list of length 5 means at least 3.',
  },
  'o2-dl-lc-close-dup': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'k', is: 'a whole number: the biggest allowed distance' },
    ],
    returns: '`True` if the same value appears at two positions at most `k` apart, otherwise `False`.',
    catch: 'Which earlier position of a value gives the smallest distance: the first or the latest?',
  },
  'o2-dl-lc-group-anagrams': {
    inputs: [{ name: 'words', is: 'a list of lowercase words' }],
    returns: 'a **list of groups** (lists of words that are anagrams of each other), each in original order, groups ordered by first appearance.',
    catch: 'Anagrams share something you can compute. That shared thing is the key.',
  },

  // ── Index maps ─────────────────────────────────────────────────────────────
  'o2-imap-trace': {
    task: PREDICT,
    catch: 'Keep a table of `where`. Each value is stored as a key, with its position as the value.',
  },
  'o2-imap-fill': {
    inputs: [{ name: 'nums', is: 'a list of numbers' }],
    returns: 'a **dict**: each number → its position. If a number repeats, keep its **last** position.',
    catch: 'You look up by number and get back a position. Which goes in the brackets?',
  },
  'o2-dbg-seen-direction': {
    task: 'It runs, but the dict is the wrong way round.',
    inputs: [{ name: 'nums', is: 'a list of numbers' }],
    returns: 'a **dict** where looking up a number gives its position (last one wins).',
    catch: 'What should `positions_of([7, 9])[9]` give back? What does it give now?',
  },
  'o2-imap-first-code': {
    inputs: [{ name: 'words', is: 'a list of words. Words can repeat.' }],
    returns: 'a **dict**: each word → the position where it **first** appears.',
    catch: 'Storing on every visit keeps the **last** position. You want the first one.',
  },
  'o2-imap-widest': {
    inputs: [{ name: 'nums', is: 'a list of numbers' }],
    returns: 'the biggest distance between two positions holding the same value, or `0` if nothing repeats.',
    catch: 'For the widest gap, which earlier position of a value do you want to remember: its first or its latest?',
  },
  'o2-dbg-closest-repeat': {
    task: 'It runs, but gives the wrong distance on some inputs.',
    inputs: [{ name: 'nums', is: 'a list of numbers' }],
    returns: 'the smallest distance between two positions holding the same value, or `-1` if nothing repeats.',
    catch: 'Trace `[1, 2, 1, 1]`. Which pair should win, and which earlier position is it measuring from?',
  },

  // ── Complements ────────────────────────────────────────────────────────────
  'o2-comp-write': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number' },
    ],
    returns: 'a **list**: for each number, what you would add to it to reach `target`. Same order.',
    catch: 'One result per number. For `9`, the number `2` needs `7`.',
  },
  'o2-comp-nested': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number' },
    ],
    returns: '`True` if two numbers at **different positions** add up to `target`, otherwise `False`.',
    catch: 'A number cannot pair with itself: the two positions must be different.',
  },
  'o2-comp-set-trace': {
    task: PREDICT,
    catch: 'Write down what is in the set at each step. The check happens before the add.',
  },
  'o2-comp-set-code': {
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number' },
    ],
    returns: 'the same `True`/`False` as before, using one pass and a set.',
    catch: 'As you walk, ask: have I already passed the number that would complete this one?',
  },
  'o2-dbg-comp-inverted': {
    task: 'It gives the wrong answer.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number' },
    ],
    returns: '`True` only if two numbers at different positions add up to `target`.',
    catch: 'Trace `has_pair([1, 2], 10)`. Why does it say `True`?',
  },
  'o2-dbg-comp-self-pair': {
    task: 'It gives the wrong answer for one kind of input.',
    inputs: [
      { name: 'nums', is: 'a list of numbers' },
      { name: 'target', is: 'a number' },
    ],
    returns: '`True` only if two numbers at **different positions** add up to `target`.',
    catch: 'Trace `has_pair([5], 10)`. A single 5 cannot pair with itself.',
  },
}
