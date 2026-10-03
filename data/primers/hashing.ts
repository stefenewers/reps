import type { Primer } from '@/data/primers/types'
import { DICT_GET_ITEMS_RECIPES, DICT_RECIPES } from '@/data/primers/dict-recipes'

/** Sets, dictionaries and the hashing patterns built on them. */
export const HASHING_PRIMERS: Primer[] = [
  {
    id: 'sets',
    title: 'Sets',
    skills: ['set_create', 'set_add', 'set_membership'],
    what: 'A **set** is an unordered collection of *unique* values. Adding something that is already there does nothing. Its superpower is `x in s`, which answers "have I seen this?" instantly, no matter how big the set is.',
    model: 'A bag that refuses duplicates and can tell you in one step whether something is inside.',
    syntax: [
      { code: 'seen = set()', note: 'Empty set. (Not `{}`, that makes an empty dict.)' },
      { code: "colors = {'red', 'blue'}", note: 'A set literal with values in it.' },
      { code: "colors.add('green')", note: 'Add one value. Adding an existing value is a no-op.' },
      { code: "'red' in colors", note: '`True`/`False`. Fast: O(1) on average.' },
      { code: 'len(colors)', note: 'How many unique values.' },
      { code: 'set([3, 1, 3, 2])', note: 'Build a set from a list: duplicates collapse.' },
    ],
    example: {
      code: `seen = set()
for word in ['hi', 'yo', 'hi', 'hey', 'yo']:
    seen.add(word)

print(len(seen))
print('yo' in seen)
print('sup' in seen)
print(sorted(seen))`,
      output: `3
True
False
['hey', 'hi', 'yo']`,
    },
    gotchas: [
      '`{}` is an empty **dict**, not a set. Use `set()`.',
      'Sets have no order and no indexes: `s[0]` is an error. Use `sorted(s)` if you need an order.',
      '`s.add(x)` returns `None`. Don\'t write `s = s.add(x)`.',
      'Checking `x in some_list` scans the whole list (slow); `x in some_set` does not.',
    ],
  },
  {
    id: 'dicts',
    title: 'Dictionaries',
    skills: ['dict_create', 'dict_assign', 'dict_lookup', 'dict_membership'],
    what: 'A **dict** maps *keys* to *values*: give it a key, get its value back instantly. Keys are unique; assigning to an existing key overwrites its value.',
    model: 'A coat check: hand over a ticket (the key), get back that coat (the value). No ticket, no coat.',
    syntax: [
      { code: 'ages = {}', note: 'Empty dict.' },
      { code: "ages = {'ana': 31, 'ben': 27}", note: 'Literal: `key: value` pairs.' },
      { code: "ages['cy'] = 40", note: 'Add a key, or overwrite its value if it exists.' },
      { code: "ages['ana']", note: 'Read a value. A missing key raises `KeyError`.' },
      { code: "'ben' in ages", note: 'Checks **keys** only, not values.' },
      { code: 'len(ages)', note: 'Number of keys.' },
    ],
    example: {
      code: `stock = {'apples': 3}
stock['pears'] = 5
stock['apples'] = 4          # overwrites 3

print(stock['apples'])
print('pears' in stock)
print(5 in stock)            # 5 is a value, not a key
print(stock)`,
      output: `4
True
False
{'apples': 4, 'pears': 5}`,
    },
    gotchas: [
      '`d[key]` on a missing key crashes with `KeyError`. Check `key in d` first, or use `.get()`.',
      '`in` looks at keys, never values.',
      'Assigning to an existing key replaces the old value, it does not add a second one.',
      'Lists can\'t be keys (they change); strings, numbers and tuples can.',
    ],
    recipes: DICT_RECIPES,
  },
  {
    id: 'dict-get-items',
    title: '.get() and looping over a dict',
    skills: ['dict_get', 'dict_items'],
    what: '`d.get(key, default)` reads a value **without crashing** when the key is missing: you get the default instead. And you can loop over a dict\'s keys, its values, or both at once with `.items()`.',
    model: '`.get` is "look in the box, and if there is no box, hand me this instead".',
    syntax: [
      { code: "d.get('x')", note: 'Value, or `None` if missing. Never raises.' },
      { code: "d.get('x', 0)", note: 'Value, or `0` if missing. The default is your choice.' },
      { code: 'for key in d:', note: 'Loops over keys.' },
      { code: 'for value in d.values():', note: 'Loops over values.' },
      { code: 'for key, value in d.items():', note: 'Loops over (key, value) pairs together.' },
    ],
    example: {
      code: `prices = {'tea': 2, 'cake': 4}

print(prices.get('tea', 0))
print(prices.get('coffee', 0))
print(prices.get('coffee'))

for item, price in prices.items():
    print(item, price)`,
      output: `2
0
None
tea 2
cake 4`,
    },
    gotchas: [
      '`d.get(k) + 1` crashes on a missing key (`None + 1`). Give a default: `d.get(k, 0) + 1`.',
      '`.get()` only reads. It never stores anything in the dict.',
      'Looping `for x in d` gives keys only. Use `.items()` when you need both.',
    ],
    recipes: DICT_GET_ITEMS_RECIPES,
  },
  {
    id: 'frequency-maps',
    title: 'Frequency maps',
    skills: ['frequency_map'],
    what: 'A **frequency map** is a dict that counts how many times each thing appears: the thing is the key, its count is the value. It is the single most common dict pattern in interviews.',
    model: 'A tally sheet: one row per distinct item, a tick added each time you see it again.',
    syntax: [
      { code: 'counts = {}', note: 'Start empty.' },
      { code: 'for x in items:', note: 'Visit each item once.' },
      { code: '    counts[x] = counts.get(x, 0) + 1', note: 'Old count (0 if new) plus one, stored back.' },
      { code: "counts.get('z', 0)", note: 'How many of something, safely.' },
    ],
    example: {
      code: `votes = ['red', 'blue', 'red', 'green', 'red']
tally = {}
for v in votes:
    tally[v] = tally.get(v, 0) + 1

print(tally)
print(tally['red'])
print(tally.get('pink', 0))`,
      output: `{'red': 3, 'blue': 1, 'green': 1}
3
0`,
    },
    gotchas: [
      '`counts[x] += 1` crashes the first time you see `x`. Use `counts.get(x, 0) + 1`.',
      'Writing `counts[x] = 1` resets the count instead of incrementing it.',
      'Two collections have the same items in the same amounts exactly when their frequency maps are equal (`==`).',
    ],
  },
  {
    id: 'index-maps',
    title: 'Index maps and complements',
    skills: ['index_map', 'complement'],
    what: 'An **index map** remembers *where* you saw each value: the value is the key, its position is the dict value. Paired with a **complement** (what you still need, e.g. `target - num`), it lets you ask "have I already seen the other half?" in one step.',
    model: 'A guest list with seat numbers: look a name up and get where they are sitting.',
    syntax: [
      { code: 'where = {}', note: 'value → index.' },
      { code: 'for i, x in enumerate(nums):', note: 'You need both the index and the value.' },
      { code: '    where[x] = i', note: 'Remember the position. Later duplicates overwrite.' },
      { code: 'need = goal - x', note: 'The complement: what would complete `x`.' },
      { code: 'if need in where:', note: 'Have I already seen it? O(1).' },
    ],
    example: {
      code: `letters = ['c', 'a', 't', 'a']
first = {}
for i, ch in enumerate(letters):
    if ch not in first:      # keep the FIRST position only
        first[ch] = i
print(first)

budget = 10
price = 7
print(budget - price)        # the complement`,
      output: `{'c': 0, 'a': 1, 't': 2}
3`,
    },
    gotchas: [
      'Key and value the right way round: `where[value] = index`, not `where[index] = value`.',
      'Assigning unconditionally keeps the **last** position; guard with `if x not in where` to keep the first.',
      'Order matters when matching: check for the complement *before* storing the current value, or an item can pair with itself.',
    ],
  },
  {
    id: 'hashing',
    title: 'Why hashing is fast',
    skills: ['hash_reasoning'],
    what: 'Checking `x in some_list` looks at every element: O(n). A set or dict jumps straight to where `x` would be: O(1) on average. Swapping a nested loop ("for each item, scan all the others") for one pass plus a set/dict is the classic O(n²) → O(n) speed-up.',
    model: 'Trade a little memory for instant lookups.',
    syntax: [
      { code: 'for a in nums:\n    for b in nums: ...', note: 'Compare everything with everything: O(n²).' },
      { code: 'seen = set()', note: 'Remember what you have passed…' },
      { code: 'if x in seen: ...', note: '…and ask about it instantly: O(1).' },
      { code: 'seen.add(x)', note: 'One pass over the data: O(n) total, O(n) extra space.' },
    ],
    example: {
      code: `allowed = {'ana', 'ben', 'cy'}       # set: instant lookups
guests = ['ben', 'dee', 'cy', 'eve']

checked_in = 0
for g in guests:
    if g in allowed:                   # O(1) each time
        checked_in += 1
print(checked_in)`,
      output: '2',
    },
    gotchas: [
      'The speed comes from the set/dict, so build it once *outside* the loop, not inside it.',
      'The cost is memory: say "O(n) time, O(n) extra space" when you explain it.',
      'Converting a list to a set inside a loop (`if x in set(nums)`) rebuilds it every time: back to slow.',
    ],
  },
]
