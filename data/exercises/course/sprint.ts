import type { Section, TestCase } from '@/lib/types'
import { code, debug, output, t, write } from '@/data/exercises/build'

/**
 * Sprint content: "design a class" (LRU cache, time-keyed store, hit counter,
 * bank, randomized set), queue checkpoints, and Course Schedule with a queue.
 * Gate variants are cold: a bare signature, a plain prompt, no hints, and the
 * technique is never named.
 */

const gate = { stage: 'retrieval' as const, repType: 'cold' as const, gate: true }
const cap = { stage: 'capstone' as const, repType: 'capstone' as const, difficulty: 3 as const, minutes: 20, important: true }

/**
 * A scripted session against a class. A line `expr -> value` checks that `expr`
 * gives exactly `value` (same type too, so `1` is not `True`); any other line just runs.
 */
function session(name: string, lines: string[], hidden = false): TestCase {
  const body = lines
    .map((line) => {
      const m = line.match(/^(.*?) -> (.*)$/)
      if (!m) return line
      const [, expr, want] = m
      return [
        `_got = ${expr}`,
        `_want = ${want}`,
        `assert _got == _want and type(_got) is type(_want), ${JSON.stringify(`${expr} returned `)} + repr(_got) + ", expected " + repr(_want)`,
      ].join('\n')
    })
    .join('\n')
  return t.check(name, body, hidden)
}

/**
 * Checks a returned order: a list holding every item once, each requirement before
 * the thing that needs it. `pairs` are [item, needs].
 */
function validOrder(name: string, callExpr: string, items: string, pairs: string, hidden = false): TestCase {
  return t.check(
    name,
    [
      `_order = ${callExpr}`,
      `assert isinstance(_order, list), "expected a list, got " + repr(_order)`,
      `assert sorted(_order) == sorted(${items}), "every item exactly once; got " + repr(_order)`,
      `_pos = {x: i for i, x in enumerate(_order)}`,
      `for _item, _need in ${pairs}:`,
      `    assert _pos[_need] < _pos[_item], repr(_need) + " must come before " + repr(_item) + "; got " + repr(_order)`,
    ].join('\n'),
    hidden
  )
}

// ───────────────────────────── shared code ─────────────────────────────

const LRU_STARTER = `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()  # oldest key at the front, newest at the end

    def get(self, key):
        pass

    def put(self, key, value):
        pass
`

const LRU_SOLUTION = `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()  # oldest key at the front, newest at the end

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
`

const LRU_BROKEN = `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()  # oldest key at the front, newest at the end

    def get(self, key):
        if key not in self.data:
            return -1
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
`

const TIMEMAP_SOLUTION = `from bisect import bisect_right


class TimeMap:
    def __init__(self):
        self.times = {}   # key -> list of timestamps, increasing
        self.values = {}  # key -> list of values, same positions

    def set(self, key, value, timestamp):
        if key not in self.times:
            self.times[key] = []
            self.values[key] = []
        self.times[key].append(timestamp)
        self.values[key].append(value)

    def get(self, key, timestamp):
        if key not in self.times:
            return ""
        i = bisect_right(self.times[key], timestamp)
        if i == 0:
            return ""
        return self.values[key][i - 1]
`

const LRU_TESTS_VISIBLE = [
  session('capacity 2: get(1) makes key 1 recent, so put(3) drops key 2', [
    'c = LRUCache(2)',
    'c.put(1, 1)',
    'c.put(2, 2)',
    'c.get(1) -> 1',
    'c.put(3, 3)',
    'c.get(2) -> -1',
    'c.get(3) -> 3',
    'c.get(1) -> 1',
  ]),
  session('a missing key gives -1', ['c = LRUCache(1)', 'c.get(5) -> -1', 'c.put(5, 50)', 'c.get(5) -> 50']),
  session('put on an existing key updates it and makes it recent', [
    'c = LRUCache(2)',
    'c.put(1, 1)',
    'c.put(2, 2)',
    'c.put(1, 10)',
    'c.put(3, 3)',
    'c.get(2) -> -1',
    'c.get(1) -> 10',
  ]),
]

// ───────────────────────────── Design a class ─────────────────────────────

const designClass: Section = {
  id: 's-design-class',
  title: 'Design a class',
  summary: 'Classes that hold state across calls: a dict for lookups plus one structure that keeps order.',
  exercises: [
    output({
      id: 's-dc-lru-trace',
      title: 'Trace an OrderedDict',
      skills: ['dict_assign', 'dict_items'],
      prompt:
        'An `OrderedDict` is a dict that remembers the order keys were added. `move_to_end(key)` moves a key to the end. `popitem(last=False)` removes and returns the **first** (oldest) pair.\n\nWhat prints?',
      code: `from collections import OrderedDict

d = OrderedDict()
d["a"] = 1
d["b"] = 2
d["c"] = 3
d.move_to_end("a")
print(list(d))
d["b"] = 20
print(list(d))
oldest = d.popitem(last=False)
print(oldest)
print(list(d.items()))
`,
      expectedOutput: "['b', 'c', 'a']\n['b', 'c', 'a']\n('b', 20)\n[('c', 3), ('a', 1)]",
      note: 'Think of the order as "oldest at the front, newest at the end". Assigning to a key that already exists changes its value but **not** its place. Only `move_to_end` moves it.',
      explanation:
        'move_to_end("a") puts a last. Setting d["b"] = 20 updates the value but leaves b at the front. popitem(last=False) removes the front pair, (\'b\', 20). This is exactly what an LRU cache needs: the front is the least recently used key.',
      signature: 'trace:ordereddict-move-pop',
      minutes: 2,
    }),
    write({
      id: 's-dc-lru-build',
      title: 'Build an LRU cache',
      skills: ['dict_lookup', 'dict_assign', 'dict_membership'],
      difficulty: 3,
      minutes: 8,
      prompt:
        'An **LRU cache** holds at most `capacity` keys. When it is full, adding a new key drops the **least recently used** key. Both `get` and `put` count as a use.\n\nFinish `LRUCache`:\n- `get(key)` returns the value, or `-1` if the key is not there.\n- `put(key, value)` adds or updates the key. If that makes more than `capacity` keys, remove the least recently used one.\n\nUse the `OrderedDict` from the starter.\n\n```python\nc = LRUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nc.get(1)      # 1, and key 1 is now the most recent\nc.put(3, 3)   # full: drops key 2\nc.get(2)      # -1\n```',
      starterCode: LRU_STARTER,
      solution: LRU_SOLUTION,
      tests: [...LRU_TESTS_VISIBLE, session('capacity 1 keeps only the last key', ['c = LRUCache(1)', 'c.put(1, 1)', 'c.put(2, 2)', 'c.get(1) -> -1', 'c.get(2) -> 2'], true)],
      hints: [
        'The cache needs two things: each key\'s value, and which key was used longest ago.',
        'Keep the OrderedDict in use order: the least recently used key at the front, the newest at the end.',
        'Every time a key is used (a get that finds it, or a put), call `self.data.move_to_end(key)`. When `len(self.data) > self.capacity`, call `self.data.popitem(last=False)`.',
        'get: if missing return -1; else move_to_end and return the value. put: if present move_to_end; set the value; if too big, popitem(last=False).',
      ],
      explanation:
        'The OrderedDict gives O(1) lookup by key and keeps keys in use order. move_to_end marks a key as just used, and popitem(last=False) evicts the oldest. Both get and put are O(1).',
      complexity: { time: 'O(1) per call', space: 'O(capacity)' },
      signature: 'design:lru-ordereddict',
    }),
    debug({
      id: 's-dc-lru-dbg',
      title: 'Debug: the cache that forgets reads',
      skills: ['dict_lookup', 'dict_membership'],
      prompt:
        '`LRUCache(capacity)` should hold at most `capacity` keys and drop the **least recently used** one when it overflows. Both `get` and `put` count as using a key. `get` returns `-1` for a missing key. Make the tests pass.',
      brokenCode: LRU_BROKEN,
      solution: LRU_SOLUTION,
      tests: [
        session('get(1) makes key 1 recent, so put(3) drops key 2', [
          'c = LRUCache(2)',
          'c.put(1, 1)',
          'c.put(2, 2)',
          'c.get(1) -> 1',
          'c.put(3, 3)',
          'c.get(1) -> 1',
          'c.get(2) -> -1',
        ]),
        session('a missing key gives -1', ['c = LRUCache(2)', 'c.get(9) -> -1']),
        session('reading keeps a key alive through two evictions', [
          'c = LRUCache(2)',
          'c.put("a", 1)',
          'c.put("b", 2)',
          'c.get("a") -> 1',
          'c.put("c", 3)',
          'c.get("a") -> 1',
          'c.put("d", 4)',
          'c.get("a") -> 1',
          'c.get("c") -> -1',
        ], true),
      ],
      hints: [
        'Run the first test by hand. Which key does put(3) drop, and which should it drop?',
        'The order of the OrderedDict is the use order. Which method changes that order?',
        'put moves a key to the end when it is used. Does get?',
        'In get, after the missing-key check, call `self.data.move_to_end(key)` before returning the value.',
      ],
      explanation:
        'get read the value but never marked the key as used, so the cache evicted by insertion order instead of use order. One move_to_end in get fixes it.',
      signature: 'debug:lru-get-no-refresh',
      minutes: 4,
    }),
    code({
      id: 's-dc-cap-lru',
      title: 'LRU Cache',
      skills: ['dict_lookup', 'dict_assign', 'dict_membership', 'hash_reasoning'],
      ...cap,
      prompt:
        'Design `LRUCache(capacity)` for a cache that holds at most `capacity` keys (`capacity >= 1`).\n- `get(key)` returns the value for `key`, or `-1` if it is not there.\n- `put(key, value)` sets the value. If the cache then holds more than `capacity` keys, remove the least recently used key.\n\nA successful `get` and any `put` both count as using that key. Both methods must run in O(1) on average.\n\n```python\nc = LRUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nc.get(1)      # 1\nc.put(3, 3)   # drops key 2\nc.get(2)      # -1\nc.put(4, 4)   # drops key 1\nc.get(1)      # -1\nc.get(3)      # 3\n```',
      starterCode: `class LRUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        pass

    def put(self, key, value):
        pass
`,
      solution: LRU_SOLUTION,
      tests: [
        session('the worked example', [
          'c = LRUCache(2)',
          'c.put(1, 1)',
          'c.put(2, 2)',
          'c.get(1) -> 1',
          'c.put(3, 3)',
          'c.get(2) -> -1',
          'c.put(4, 4)',
          'c.get(1) -> -1',
          'c.get(3) -> 3',
          'c.get(4) -> 4',
        ]),
        LRU_TESTS_VISIBLE[1],
        LRU_TESTS_VISIBLE[2],
        session('capacity 1', ['c = LRUCache(1)', 'c.put(2, 1)', 'c.get(2) -> 1', 'c.put(3, 2)', 'c.get(2) -> -1', 'c.get(3) -> 2'], true),
        session('a failed get does not change the order', [
          'c = LRUCache(2)',
          'c.put(1, 1)',
          'c.put(2, 2)',
          'c.get(7) -> -1',
          'c.put(3, 3)',
          'c.get(1) -> -1',
          'c.get(2) -> 2',
        ], true),
        session('overwriting at capacity does not evict', [
          'c = LRUCache(2)',
          'c.put(1, 1)',
          'c.put(2, 2)',
          'c.put(2, 20)',
          'c.get(1) -> 1',
          'c.get(2) -> 20',
        ], true),
        session('many calls stay correct', [
          'c = LRUCache(3)',
          'for k in range(100):',
          '    c.put(k, k * k)',
          'c.get(97) -> 9409',
          'c.get(96) -> -1',
          'c.put(100, 0)',
          'c.get(98) -> -1',
          'c.get(97) -> 9409',
          'c.get(99) -> 9801',
        ], true),
      ],
      hints: [
        'You need O(1) lookup by key and O(1) "which key was used longest ago". A plain dict alone gives only the first.',
        '`collections.OrderedDict` gives both: keys stay in order, and you can move one to the end or remove from the front in O(1).',
        'On each use call `move_to_end(key)`. When the size passes capacity, `popitem(last=False)` removes the least recently used key.',
        '__init__: store capacity and an OrderedDict. get: missing → -1; else move_to_end, return value. put: if present move_to_end; assign; if over capacity popitem(last=False).',
      ],
      explanation:
        'An OrderedDict is a hash map plus a linked order of keys. Keeping it in use order means the front key is always the one to evict. Every operation is O(1). In an interview you may be asked to build the same thing with a dict and your own doubly linked list.',
      complexity: { time: 'O(1) per call', space: 'O(capacity)' },
      signature: 'capstone:lru-cache',
    }),
    output({
      id: 's-dc-timemap-trace',
      title: 'Trace bisect_right',
      skills: ['binary_search', 'list_index'],
      prompt:
        '`bisect_right(a, x)` searches the sorted list `a` and returns how many items are `<= x`. That is also the index where `x` would go after any equal items.\n\nSo `i - 1` is the position of the last item `<= x`, when `i > 0`. What prints?',
      code: `from bisect import bisect_right

times = [1, 4, 9]
values = ["red", "green", "blue"]
for when in [0, 1, 5, 9, 12]:
    i = bisect_right(times, when)
    print(when, i, repr(values[i - 1] if i > 0 else ""))
`,
      expectedOutput: "0 0 ''\n1 1 'red'\n5 2 'green'\n9 3 'blue'\n12 3 'blue'",
      note: '`bisect_right` is a binary search from the standard library: O(log n) on a sorted list. It returns an index, never a value.',
      explanation:
        'Nothing in times is <= 0, so i is 0 and there is no value. For 5, two items (1 and 4) are <= 5, so i is 2 and values[1] is green. For 9, the equal item counts too, so i is 3.',
      signature: 'trace:bisect-right-floor',
      minutes: 2,
    }),
    write({
      id: 's-dc-timemap-build',
      title: 'Build a time-keyed store',
      skills: ['binary_search', 'dict_get', 'dict_membership'],
      difficulty: 3,
      minutes: 8,
      prompt:
        '`TimeMap` keeps every value a key has had, each with a timestamp.\n- `set(key, value, timestamp)` stores `value` for `key` at that time.\n- `get(key, timestamp)` returns the value set at the largest timestamp `<= timestamp`, or `""` if there is none.\n\nFor each key, `set` is called with increasing timestamps. Use `bisect_right` so `get` is O(log n).\n\n```python\ntm = TimeMap()\ntm.set("k", "a", 1)\ntm.set("k", "b", 4)\ntm.get("k", 3)   # \'a\'\ntm.get("k", 4)   # \'b\'\ntm.get("k", 0)   # \'\'\n```',
      starterCode: `from bisect import bisect_right


class TimeMap:
    def __init__(self):
        self.times = {}   # key -> list of timestamps, increasing
        self.values = {}  # key -> list of values, same positions

    def set(self, key, value, timestamp):
        pass

    def get(self, key, timestamp):
        pass
`,
      solution: TIMEMAP_SOLUTION,
      tests: [
        session('latest value at or before the time', [
          'tm = TimeMap()',
          'tm.set("k", "a", 1)',
          'tm.set("k", "b", 4)',
          'tm.get("k", 1) -> "a"',
          'tm.get("k", 3) -> "a"',
          'tm.get("k", 4) -> "b"',
          'tm.get("k", 100) -> "b"',
        ]),
        session('before the first set, or an unknown key, gives ""', ['tm = TimeMap()', 'tm.get("k", 5) -> ""', 'tm.set("k", "a", 2)', 'tm.get("k", 1) -> ""', 'tm.get("other", 2) -> ""']),
        session('keys do not mix', ['tm = TimeMap()', 'tm.set("x", "x1", 1)', 'tm.set("y", "y5", 5)', 'tm.get("x", 9) -> "x1"', 'tm.get("y", 4) -> ""'], true),
      ],
      hints: [
        'For one key, the timestamps arrive in increasing order, so a list of them is already sorted.',
        'Keep two lists per key: the timestamps and the values, in the same positions. set just appends to both.',
        '`i = bisect_right(times, timestamp)` counts the timestamps `<= timestamp`. The answer is at index `i - 1`.',
        'get: unknown key → "". Find i with bisect_right. If i == 0 return "", else return values[key][i - 1].',
      ],
      explanation:
        'Appending keeps each key\'s timestamps sorted for free. bisect_right then finds the last timestamp <= the query in O(log n), and the value sits at the same index.',
      complexity: { time: 'set O(1), get O(log n)', space: 'O(total sets)' },
      signature: 'design:timemap-bisect',
    }),
    write({
      id: 's-dc-hit-counter',
      title: 'Build a hit counter',
      skills: ['queue_deque', 'while_loop'],
      difficulty: 2,
      minutes: 6,
      prompt:
        '`HitCounter` counts hits over the last 5 minutes.\n- `hit(timestamp)` records one hit at that second.\n- `get_hits(timestamp)` returns the number of hits in the last 300 seconds: those with time `> timestamp - 300`.\n\nTimestamps never go down between calls. Keep the hits in a `deque` and remove old ones from the left.\n\n```python\nh = HitCounter()\nh.hit(1)\nh.hit(2)\nh.hit(300)\nh.get_hits(300)   # 3\nh.get_hits(301)   # 2 (the hit at 1 is too old)\n```',
      starterCode: `from collections import deque


class HitCounter:
    def __init__(self):
        self.hits = deque()

    def hit(self, timestamp):
        pass

    def get_hits(self, timestamp):
        pass
`,
      solution: `from collections import deque


class HitCounter:
    def __init__(self):
        self.hits = deque()

    def hit(self, timestamp):
        self.hits.append(timestamp)

    def get_hits(self, timestamp):
        while self.hits and self.hits[0] <= timestamp - 300:
            self.hits.popleft()
        return len(self.hits)
`,
      tests: [
        session('old hits fall out after 300 seconds', [
          'h = HitCounter()',
          'h.hit(1)',
          'h.hit(2)',
          'h.hit(3)',
          'h.get_hits(4) -> 3',
          'h.hit(300)',
          'h.get_hits(300) -> 4',
          'h.get_hits(301) -> 3',
          'h.get_hits(599) -> 1',
          'h.get_hits(600) -> 0',
        ]),
        session('no hits yet', ['h = HitCounter()', 'h.get_hits(10) -> 0']),
        session('several hits in the same second', ['h = HitCounter()', 'h.hit(5)', 'h.hit(5)', 'h.hit(5)', 'h.get_hits(304) -> 3', 'h.get_hits(305) -> 0'], true),
      ],
      hints: [
        'Hits arrive in time order, so the oldest hit is always the first one stored.',
        'Append each hit to the right of the deque. Old hits are all at the left end.',
        'In get_hits, while the leftmost hit is `<= timestamp - 300`, remove it with `popleft()`.',
        'hit: self.hits.append(timestamp). get_hits: loop popleft while too old, then return len(self.hits).',
      ],
      explanation:
        'Because time only moves forward, expired hits are always at the front. popleft is O(1), and each hit is removed at most once, so the work per call is O(1) on average.',
      complexity: { time: 'O(1) amortized per call', space: 'O(hits in the last 300 s)' },
      signature: 'design:hit-counter-deque',
    }),
    write({
      id: 's-dc-bank-build',
      title: 'Build a tiny bank',
      skills: ['dict_membership', 'dict_assign', 'conditionals'],
      difficulty: 2,
      minutes: 7,
      prompt:
        'Every account starts with balance `0`.\n- `create_account(account_id)` returns `True`, or `False` if that account already exists.\n- `deposit(account_id, amount)` adds money and returns the new balance, or `None` for an unknown account.\n- `transfer(src, dst, amount)` moves money and returns `True`.\n\n`transfer` returns `False` and changes nothing if either account is unknown, `src == dst`, or `src` has less than `amount`.\n\n```python\nb = Bank()\nb.create_account("a")      # True\nb.deposit("a", 50)         # 50\nb.create_account("b")      # True\nb.transfer("a", "b", 80)   # False\nb.transfer("a", "b", 30)   # True\nb.deposit("b", 0)          # 30\n```',
      starterCode: `class Bank:
    def __init__(self):
        self.balances = {}  # account_id -> balance

    def create_account(self, account_id):
        pass

    def deposit(self, account_id, amount):
        pass

    def transfer(self, src, dst, amount):
        pass
`,
      solution: `class Bank:
    def __init__(self):
        self.balances = {}  # account_id -> balance

    def create_account(self, account_id):
        if account_id in self.balances:
            return False
        self.balances[account_id] = 0
        return True

    def deposit(self, account_id, amount):
        if account_id not in self.balances:
            return None
        self.balances[account_id] += amount
        return self.balances[account_id]

    def transfer(self, src, dst, amount):
        if src not in self.balances or dst not in self.balances:
            return False
        if src == dst or self.balances[src] < amount:
            return False
        self.balances[src] -= amount
        self.balances[dst] += amount
        return True
`,
      tests: [
        session('the worked example', [
          'b = Bank()',
          'b.create_account("a") -> True',
          'b.deposit("a", 50) -> 50',
          'b.create_account("b") -> True',
          'b.transfer("a", "b", 80) -> False',
          'b.transfer("a", "b", 30) -> True',
          'b.deposit("b", 0) -> 30',
          'b.deposit("a", 0) -> 20',
        ]),
        session('duplicates and unknown accounts', [
          'b = Bank()',
          'b.create_account("a") -> True',
          'b.create_account("a") -> False',
          'b.deposit("zz", 10) -> None',
          'b.transfer("a", "zz", 0) -> False',
          'b.transfer("zz", "a", 0) -> False',
        ]),
        session('a transfer to yourself fails and changes nothing', ['b = Bank()', 'b.create_account("a") -> True', 'b.deposit("a", 10) -> 10', 'b.transfer("a", "a", 5) -> False', 'b.deposit("a", 0) -> 10']),
        session('moving the exact balance is allowed', ['b = Bank()', 'b.create_account(1) -> True', 'b.create_account(2) -> True', 'b.deposit(1, 7) -> 7', 'b.transfer(1, 2, 7) -> True', 'b.deposit(1, 0) -> 0', 'b.deposit(2, 0) -> 7'], true),
        session('a failed transfer changes nothing', ['b = Bank()', 'b.create_account("x") -> True', 'b.create_account("y") -> True', 'b.deposit("x", 5) -> 5', 'b.transfer("x", "y", 6) -> False', 'b.deposit("x", 0) -> 5', 'b.deposit("y", 0) -> 0'], true),
      ],
      hints: [
        'All the state is one mapping from account id to balance.',
        'Each method checks its failure cases first and returns early. Only then does it change anything.',
        'Use `account_id in self.balances` to test whether an account exists. Compare `self.balances[src] < amount` for funds.',
        'create: exists → False, else set 0, True. deposit: unknown → None, else add and return. transfer: unknown, same, or short → False; else subtract, add, True.',
      ],
      explanation:
        'A dict of balances gives O(1) lookups. Checking every failure case before touching any balance means a failed transfer never leaves money half-moved.',
      complexity: { time: 'O(1) per call', space: 'O(accounts)' },
      signature: 'design:bank-accounts',
    }),
    write({
      id: 's-dc-randomized-set',
      title: 'Build a randomized set',
      skills: ['index_map', 'list_index', 'hash_reasoning'],
      difficulty: 3,
      minutes: 10,
      prompt:
        '`RandomizedSet` stores distinct values. Every method must be O(1) on average.\n- `insert(val)` adds `val` and returns `True`, or `False` if it was already there.\n- `remove(val)` removes `val` and returns `True`, or `False` if it was not there.\n- `get_random()` returns a random stored value, each equally likely. It is only called when the set is not empty.\n\nKeep the values in a list and their positions in a dict. To remove, move the last value into the removed slot.\n\n```python\nrs = RandomizedSet()\nrs.insert(1)     # True\nrs.insert(1)     # False\nrs.insert(2)     # True\nrs.remove(1)     # True\nrs.get_random()  # 2\n```',
      starterCode: `import random


class RandomizedSet:
    def __init__(self):
        self.values = []  # the stored values
        self.pos = {}     # value -> its index in self.values

    def insert(self, val):
        pass

    def remove(self, val):
        pass

    def get_random(self):
        pass
`,
      solution: `import random


class RandomizedSet:
    def __init__(self):
        self.values = []  # the stored values
        self.pos = {}     # value -> its index in self.values

    def insert(self, val):
        if val in self.pos:
            return False
        self.pos[val] = len(self.values)
        self.values.append(val)
        return True

    def remove(self, val):
        if val not in self.pos:
            return False
        i = self.pos[val]
        last = self.values[-1]
        self.values[i] = last
        self.pos[last] = i
        self.values.pop()
        del self.pos[val]
        return True

    def get_random(self):
        return random.choice(self.values)
`,
      tests: [
        session('insert and remove report what happened', [
          'rs = RandomizedSet()',
          'rs.insert(1) -> True',
          'rs.insert(1) -> False',
          'rs.insert(2) -> True',
          'rs.remove(3) -> False',
          'rs.remove(1) -> True',
          'rs.remove(1) -> False',
          'rs.get_random() -> 2',
        ]),
        session('get_random only returns stored values, and can return each one', [
          'rs = RandomizedSet()',
          'for v in [10, 20, 30, 40]:',
          '    rs.insert(v)',
          'rs.remove(20) -> True',
          '{rs.get_random() for _ in range(300)} -> {10, 30, 40}',
        ]),
        session('removing the last value, then reinserting', [
          'rs = RandomizedSet()',
          'rs.insert(5) -> True',
          'rs.insert(6) -> True',
          'rs.remove(6) -> True',
          'rs.remove(5) -> True',
          'rs.insert(6) -> True',
          'rs.get_random() -> 6',
        ]),
        session('positions stay right after many swaps', [
          'rs = RandomizedSet()',
          'for v in range(10):',
          '    rs.insert(v)',
          'for v in [0, 3, 9, 4, 1]:',
          '    rs.remove(v)',
          'rs.remove(4) -> False',
          'rs.insert(3) -> True',
          'rs.insert(7) -> False',
          '{rs.get_random() for _ in range(400)} -> {2, 3, 5, 6, 7, 8}',
        ], true),
      ],
      hints: [
        'A list gives O(1) random choice, and a dict gives O(1) "is it here, and where?". Use both.',
        'insert: record the new index in `self.pos`, then append. remove: removing from the middle of a list is slow, so avoid it.',
        'Copy the last value into the removed value\'s slot, update that value\'s index in `self.pos`, then `pop()` the end of the list and delete the removed value from `self.pos`.',
        'get_random is just `random.choice(self.values)`. Check membership with `val in self.pos` at the top of insert and remove.',
      ],
      explanation:
        'The list holds values packed together so random.choice works in O(1). The dict finds any value\'s index in O(1). Swapping the last value into the hole means removal only ever pops the end of the list, which is O(1).',
      complexity: { time: 'O(1) average per call', space: 'O(n)' },
      signature: 'design:randomized-set',
    }),
    code({
      id: 's-dc-cap-timemap',
      title: 'Time Based Key-Value Store',
      skills: ['binary_search', 'dict_get', 'dict_membership'],
      ...cap,
      prompt:
        'Design `TimeMap`, a key-value store that keeps every version of a value.\n- `set(key, value, timestamp)` stores `value` for `key` at `timestamp`.\n- `get(key, timestamp)` returns the value whose timestamp is the largest one `<= timestamp`. Return `""` if there is none.\n\nFor any one key, `set` is called with strictly increasing timestamps. Make `get` faster than a scan through every version.\n\n```python\ntm = TimeMap()\ntm.set("foo", "bar", 1)\ntm.get("foo", 1)    # \'bar\'\ntm.get("foo", 3)    # \'bar\'\ntm.set("foo", "bar2", 4)\ntm.get("foo", 4)    # \'bar2\'\ntm.get("foo", 5)    # \'bar2\'\n```',
      starterCode: `class TimeMap:
    def __init__(self):
        pass

    def set(self, key, value, timestamp):
        pass

    def get(self, key, timestamp):
        pass
`,
      solution: TIMEMAP_SOLUTION,
      tests: [
        session('the worked example', [
          'tm = TimeMap()',
          'tm.set("foo", "bar", 1)',
          'tm.get("foo", 1) -> "bar"',
          'tm.get("foo", 3) -> "bar"',
          'tm.set("foo", "bar2", 4)',
          'tm.get("foo", 4) -> "bar2"',
          'tm.get("foo", 5) -> "bar2"',
          'tm.get("foo", 2) -> "bar"',
        ]),
        session('too early or unknown gives ""', ['tm = TimeMap()', 'tm.set("a", "x", 10)', 'tm.get("a", 9) -> ""', 'tm.get("b", 10) -> ""']),
        session('several keys at once', [
          'tm = TimeMap()',
          'tm.set("love", "high", 10)',
          'tm.set("love", "low", 20)',
          'tm.set("hate", "meh", 15)',
          'tm.get("love", 5) -> ""',
          'tm.get("love", 10) -> "high"',
          'tm.get("love", 15) -> "high"',
          'tm.get("love", 20) -> "low"',
          'tm.get("hate", 25) -> "meh"',
        ], true),
        session('the same value at different times', ['tm = TimeMap()', 'tm.set("k", "v", 1)', 'tm.set("k", "w", 2)', 'tm.set("k", "v", 3)', 'tm.get("k", 2) -> "w"', 'tm.get("k", 3) -> "v"'], true),
        session('many versions, every lookup lands right', [
          'tm = TimeMap()',
          'for ts in range(0, 2000, 2):',
          '    tm.set("k", "v" + str(ts), ts)',
          'all(tm.get("k", q) == "v" + str(min(q - q % 2, 1998)) for q in range(0, 2100)) -> True',
          'tm.get("k", -1) -> ""',
        ], true),
      ],
      hints: [
        'For one key, the timestamps arrive in increasing order. A list of them is always sorted.',
        'Keep, per key, a list of timestamps and a list of values at the same positions. set appends to both.',
        'Binary search the timestamps for the last one `<= timestamp`. `bisect.bisect_right(times, timestamp) - 1` is that index.',
        'get: unknown key → "". i = bisect_right(times[key], timestamp). i == 0 → "". Otherwise values[key][i - 1].',
      ],
      explanation:
        'Appends keep each key\'s timestamps sorted without any sorting. A binary search (bisect_right) finds the floor timestamp in O(log n), so get never scans all versions.',
      complexity: { time: 'set O(1), get O(log n)', space: 'O(total sets)' },
      signature: 'capstone:time-map',
    }),
  ],
}

// ───────────────────────────── Design a class: checkpoints ─────────────────────────────

const DESIGN_GATE_SKILLS = ['dict_assign', 'dict_membership', 'hash_reasoning']

const designGates: Section = {
  id: 's-design-class-gates',
  title: 'Design a class checkpoints',
  summary: 'Cold variants: a small class that needs fast lookup by name plus something that keeps order.',
  exercises: [
    write({
      id: 's-dc-g-a',
      title: 'Recently viewed items',
      skills: DESIGN_GATE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 8,
      prompt:
        '`RecentlyViewed(limit)` tracks the last `limit` different items a user looked at.\n- `view(item)` records a view. Viewing an item again makes it the most recent. If more than `limit` different items are tracked, forget the one viewed longest ago.\n- `recent()` returns the tracked items as a list, most recent first.\n\n`view` must be O(1) on average.\n\n```python\nr = RecentlyViewed(2)\nr.view("a")\nr.view("b")\nr.view("a")\nr.view("c")   # forgets "b"\nr.recent()    # [\'c\', \'a\']\n```',
      starterCode: `class RecentlyViewed:
    def __init__(self, limit):
        pass

    def view(self, item):
        pass

    def recent(self):
        pass
`,
      solution: `from collections import OrderedDict


class RecentlyViewed:
    def __init__(self, limit):
        self.limit = limit
        self.items = OrderedDict()

    def view(self, item):
        if item in self.items:
            self.items.move_to_end(item)
        self.items[item] = True
        if len(self.items) > self.limit:
            self.items.popitem(last=False)

    def recent(self):
        return list(reversed(self.items))
`,
      tests: [
        session('the worked example', ['r = RecentlyViewed(2)', 'r.view("a")', 'r.view("b")', 'r.view("a")', 'r.view("c")', 'r.recent() -> ["c", "a"]']),
        session('nothing viewed yet', ['r = RecentlyViewed(3)', 'r.recent() -> []']),
        session('repeats do not take extra room', ['r = RecentlyViewed(3)', 'r.view("x")', 'r.view("x")', 'r.view("y")', 'r.recent() -> ["y", "x"]']),
        session('limit 1', ['r = RecentlyViewed(1)', 'r.view(1)', 'r.view(2)', 'r.recent() -> [2]'], true),
        session('a long run', ['r = RecentlyViewed(3)', 'for x in [1, 2, 3, 1, 4, 2, 5, 1]:', '    r.view(x)', 'r.recent() -> [1, 5, 2]'], true),
      ],
      signature: 'gate:recently-viewed',
    }),
    write({
      id: 's-dc-g-b',
      title: 'Leaderboard',
      skills: DESIGN_GATE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 8,
      prompt:
        '`Leaderboard` keeps a running total score per player. A new player starts at `0`.\n- `add_score(player, score)` adds `score` to that player\'s total.\n- `top(k)` returns the sum of the `k` highest totals. If there are fewer than `k` players, sum them all.\n- `reset(player)` removes the player from the board.\n\n```python\nlb = Leaderboard()\nlb.add_score("a", 73)\nlb.add_score("b", 56)\nlb.add_score("c", 39)\nlb.top(2)          # 129\nlb.reset("a")\nlb.top(2)          # 95\n```',
      starterCode: `class Leaderboard:
    def __init__(self):
        pass

    def add_score(self, player, score):
        pass

    def top(self, k):
        pass

    def reset(self, player):
        pass
`,
      solution: `class Leaderboard:
    def __init__(self):
        self.totals = {}

    def add_score(self, player, score):
        self.totals[player] = self.totals.get(player, 0) + score

    def top(self, k):
        return sum(sorted(self.totals.values(), reverse=True)[:k])

    def reset(self, player):
        self.totals.pop(player, None)
`,
      tests: [
        session('the worked example', ['lb = Leaderboard()', 'lb.add_score("a", 73)', 'lb.add_score("b", 56)', 'lb.add_score("c", 39)', 'lb.top(2) -> 129', 'lb.reset("a")', 'lb.top(2) -> 95']),
        session('scores add up per player', ['lb = Leaderboard()', 'lb.add_score("a", 5)', 'lb.add_score("b", 7)', 'lb.add_score("a", 4)', 'lb.top(1) -> 9']),
        session('fewer players than k', ['lb = Leaderboard()', 'lb.top(3) -> 0', 'lb.add_score("x", 2)', 'lb.top(3) -> 2']),
        session('a reset player can come back from zero', ['lb = Leaderboard()', 'lb.add_score("a", 50)', 'lb.add_score("b", 10)', 'lb.reset("a")', 'lb.add_score("a", 1)', 'lb.top(1) -> 10', 'lb.top(2) -> 11'], true),
        session('ties all count', ['lb = Leaderboard()', 'for p in "abcd":', '    lb.add_score(p, 10)', 'lb.add_score("e", 3)', 'lb.top(3) -> 30', 'lb.top(5) -> 43'], true),
      ],
      signature: 'gate:leaderboard',
    }),
    write({
      id: 's-dc-g-c',
      title: 'Per-user rate limiter',
      skills: DESIGN_GATE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 9,
      prompt:
        '`RateLimiter(limit, seconds)` lets each user make at most `limit` requests in any `seconds`-long stretch.\n\n`allow(user, timestamp)` returns `True` and records the request if `user` has fewer than `limit` allowed requests with time `> timestamp - seconds`. Otherwise it returns `False` and records nothing.\n\nTimestamps never go down. Users are limited separately.\n\n```python\nrl = RateLimiter(2, 10)\nrl.allow("u", 1)    # True\nrl.allow("u", 5)    # True\nrl.allow("u", 8)    # False\nrl.allow("v", 8)    # True\nrl.allow("u", 11)   # True (the request at 1 is too old)\n```',
      starterCode: `class RateLimiter:
    def __init__(self, limit, seconds):
        pass

    def allow(self, user, timestamp):
        pass
`,
      solution: `from collections import deque


class RateLimiter:
    def __init__(self, limit, seconds):
        self.limit = limit
        self.seconds = seconds
        self.recent = {}  # user -> times of their allowed requests, oldest first

    def allow(self, user, timestamp):
        if user not in self.recent:
            self.recent[user] = deque()
        times = self.recent[user]
        while times and times[0] <= timestamp - self.seconds:
            times.popleft()
        if len(times) >= self.limit:
            return False
        times.append(timestamp)
        return True
`,
      tests: [
        session('the worked example', ['rl = RateLimiter(2, 10)', 'rl.allow("u", 1) -> True', 'rl.allow("u", 5) -> True', 'rl.allow("u", 8) -> False', 'rl.allow("v", 8) -> True', 'rl.allow("u", 11) -> True']),
        session('refused requests do not count', ['rl = RateLimiter(1, 5)', 'rl.allow("u", 0) -> True', 'rl.allow("u", 4) -> False', 'rl.allow("u", 5) -> True', 'rl.allow("u", 9) -> False']),
        session('a burst in one second', ['rl = RateLimiter(3, 60)', 'rl.allow("a", 7) -> True', 'rl.allow("a", 7) -> True', 'rl.allow("a", 7) -> True', 'rl.allow("a", 7) -> False']),
        session('limit 1 per second', ['rl = RateLimiter(1, 1)', 'rl.allow("x", 1) -> True', 'rl.allow("x", 1) -> False', 'rl.allow("x", 2) -> True'], true),
        session('many users stay separate', [
          'rl = RateLimiter(2, 100)',
          'all([rl.allow(u, 0) for u in range(50)]) -> True',
          'all([rl.allow(u, 1) for u in range(50)]) -> True',
          'any([rl.allow(u, 2) for u in range(50)]) -> False',
          'rl.allow(3, 100) -> True',
        ], true),
      ],
      signature: 'gate:rate-limiter',
    }),
  ],
}

// ───────────────────────────── Queue checkpoints ─────────────────────────────

const QUEUE_GATE_SKILLS = ['queue_deque', 'accumulator']

const queueGates: Section = {
  id: 's-queue-gates',
  title: 'First in, first out checkpoints',
  summary: 'Cold variants: keep items in arrival order and take the oldest one off cheaply.',
  exercises: [
    write({
      id: 's-q-g-a',
      title: 'Average of the last k',
      skills: QUEUE_GATE_SKILLS,
      ...gate,
      difficulty: 2,
      minutes: 6,
      prompt:
        '`MovingAverage(size)` reads a stream of numbers.\n\n`next(val)` adds `val` and returns the average of the last `size` values seen, as a float. Before `size` values have arrived, average all of them. Each call must be O(1).\n\n```python\nm = MovingAverage(3)\nm.next(1)    # 1.0\nm.next(10)   # 5.5\nm.next(4)    # 5.0\nm.next(7)    # 7.0\n```',
      starterCode: `class MovingAverage:
    def __init__(self, size):
        pass

    def next(self, val):
        pass
`,
      solution: `from collections import deque


class MovingAverage:
    def __init__(self, size):
        self.size = size
        self.vals = deque()
        self.total = 0

    def next(self, val):
        self.vals.append(val)
        self.total += val
        if len(self.vals) > self.size:
            self.total -= self.vals.popleft()
        return self.total / len(self.vals)
`,
      tests: [
        session('the worked example', ['m = MovingAverage(3)', 'm.next(1) -> 1.0', 'm.next(10) -> 5.5', 'm.next(4) -> 5.0', 'm.next(7) -> 7.0', 'm.next(1) -> 4.0']),
        session('size 1 is just the latest value', ['m = MovingAverage(1)', 'm.next(3) -> 3.0', 'm.next(-5) -> -5.0']),
        session('a long stream', ['m = MovingAverage(4)', 'for v in range(1, 101):', '    last = m.next(v)', 'last -> 98.5'], true),
        session('negatives and zeros', ['m = MovingAverage(2)', 'm.next(0) -> 0.0', 'm.next(-4) -> -2.0', 'm.next(4) -> 0.0'], true),
      ],
      signature: 'gate:moving-average',
    }),
    write({
      id: 's-q-g-b',
      title: 'Take turns on the processor',
      skills: QUEUE_GATE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 7,
      prompt:
        '`tasks` is a list of `[name, work]` pairs in arrival order. The processor takes turns. On each turn it takes the task that has waited longest and runs it for up to `turn` units.\n\nIf the task still has work left, it goes behind every other waiting task. Return the task names in the order they finish.\n\n`finish_order(tasks=[["a", 3], ["b", 1], ["c", 5]], turn=2)` → `[\'b\', \'a\', \'c\']`\n\n`finish_order(tasks=[], turn=3)` → `[]`',
      starterCode: 'def finish_order(tasks, turn):\n    pass\n',
      solution: `from collections import deque


def finish_order(tasks, turn):
    waiting = deque((name, work) for name, work in tasks)
    done = []
    while waiting:
        name, work = waiting.popleft()
        work -= turn
        if work > 0:
            waiting.append((name, work))
        else:
            done.append(name)
    return done
`,
      tests: [
        t.eq('finish_order([["a", 3], ["b", 1], ["c", 5]], 2)', "['b', 'a', 'c']"),
        t.eq('finish_order([], 3)', '[]'),
        t.eq('finish_order([["x", 4], ["y", 4]], 10)', "['x', 'y']"),
        t.eq('finish_order([["x", 4], ["y", 1], ["z", 2]], 1)', "['y', 'z', 'x']"),
        t.hidden('finish_order([["solo", 7]], 2)', "['solo']"),
        t.hidden('finish_order([["p", 2], ["q", 3], ["r", 1]], 2)', "['p', 'r', 'q']"),
        t.hidden('len(finish_order([[str(i), i] for i in range(1, 2001)], 1))', '2000'),
      ],
      signature: 'gate:round-robin-finish',
    }),
    write({
      id: 's-q-g-c',
      title: 'Count recent calls',
      skills: QUEUE_GATE_SKILLS,
      ...gate,
      difficulty: 2,
      minutes: 6,
      prompt:
        '`RecentCounter` counts calls in the last 3000 milliseconds.\n\n`ping(t)` records a call at time `t` and returns how many calls, including this one, happened in the range `[t - 3000, t]`. Every `t` is larger than the one before. Old calls should not slow later pings.\n\n```python\nrc = RecentCounter()\nrc.ping(1)      # 1\nrc.ping(100)    # 2\nrc.ping(3001)   # 3\nrc.ping(3002)   # 3\n```',
      starterCode: `class RecentCounter:
    def __init__(self):
        pass

    def ping(self, t):
        pass
`,
      solution: `from collections import deque


class RecentCounter:
    def __init__(self):
        self.calls = deque()

    def ping(self, t):
        self.calls.append(t)
        while self.calls[0] < t - 3000:
            self.calls.popleft()
        return len(self.calls)
`,
      tests: [
        session('the worked example', ['rc = RecentCounter()', 'rc.ping(1) -> 1', 'rc.ping(100) -> 2', 'rc.ping(3001) -> 3', 'rc.ping(3002) -> 3']),
        session('a long gap clears everything', ['rc = RecentCounter()', 'rc.ping(5) -> 1', 'rc.ping(6) -> 2', 'rc.ping(10000) -> 1']),
        session('exactly 3000 ms ago still counts', ['rc = RecentCounter()', 'rc.ping(1000) -> 1', 'rc.ping(4000) -> 2', 'rc.ping(4001) -> 2'], true),
        session('a steady stream', ['rc = RecentCounter()', 'for t in range(0, 100000, 10):', '    n = rc.ping(t)', 'n -> 301'], true),
      ],
      signature: 'gate:recent-counter',
    }),
  ],
}

// ───────────────────────────── Course Schedule with a queue ─────────────────────────────

const SCHEDULE_SKILLS = ['cycle_detection', 'queue_deque', 'graph_adjacency']

const FIND_ORDER = `from collections import deque


def find_order(num_courses, prerequisites):
    unlocks = {c: [] for c in range(num_courses)}
    waiting = [0] * num_courses  # how many prerequisites each course still needs
    for course, pre in prerequisites:
        unlocks[pre].append(course)
        waiting[course] += 1
    ready = deque(c for c in range(num_courses) if waiting[c] == 0)
    order = []
    while ready:
        c = ready.popleft()
        order.append(c)
        for nxt in unlocks[c]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)
    if len(order) < num_courses:
        return []
    return order
`

const courseSchedule: Section = {
  id: 's-course-schedule',
  title: 'Course Schedule with a queue',
  summary: "Kahn's algorithm: count each node's in-degree, start from the zeros, and a short order means a cycle.",
  exercises: [
    output({
      id: 's-cs-kahn-trace',
      title: "Trace Kahn's algorithm",
      skills: SCHEDULE_SKILLS,
      difficulty: 2,
      prompt:
        'Each pair `[course, pre]` means `pre` must be taken before `course`. A course\'s **in-degree** is how many prerequisites it still waits on.\n\n**Kahn\'s algorithm** puts every course with in-degree 0 in a queue. It takes courses from the front, and each one lowers the in-degree of the courses it unlocks. A course joins the back of the queue when its in-degree hits 0.\n\nWhat prints?',
      code: `from collections import deque

n = 6
prereqs = [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3], [4, 5]]
unlocks = {i: [] for i in range(n)}
indegree = [0] * n
for course, pre in prereqs:
    unlocks[pre].append(course)
    indegree[course] += 1
print("start", indegree)

queue = deque(i for i in range(n) if indegree[i] == 0)
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for nxt in unlocks[node]:
        indegree[nxt] -= 1
        if indegree[nxt] == 0:
            queue.append(nxt)
    print(node, list(queue))
print(order)
`,
      expectedOutput: 'start [0, 1, 1, 2, 2, 0]\n0 [5, 1, 2]\n5 [1, 2]\n1 [2]\n2 [3]\n3 [4]\n4 []\n[0, 5, 1, 2, 3, 4]',
      note: 'The edge goes from the prerequisite to the course it unlocks: `[course, pre]` becomes `unlocks[pre].append(course)`. If the final order is shorter than `n`, some courses never reached in-degree 0: they sit on a cycle.',
      explanation:
        '0 and 5 start at in-degree 0. Taking 0 frees 1 and 2. Taking 5 only lowers 4 from 2 to 1. Course 3 needs both 1 and 2, so it joins only after 2. Every course came out, so there is no cycle.',
      signature: 'trace:kahn-queue',
      minutes: 3,
    }),
    code({
      id: 's-cap-course-schedule-ii',
      title: 'Course Schedule II',
      skills: SCHEDULE_SKILLS,
      ...cap,
      prompt:
        'There are `num_courses` courses, numbered `0` to `num_courses - 1`. Each pair `[course, pre]` in `prerequisites` means you must take `pre` before `course`.\n\nReturn a list of all the courses in an order you can take them. Many orders may work; return any one. If no order works, return `[]`.\n\n`find_order(num_courses=2, prerequisites=[[1, 0]])` → `[0, 1]`\n\n`find_order(num_courses=2, prerequisites=[[0, 1], [1, 0]])` → `[]`',
      starterCode: 'def find_order(num_courses, prerequisites):\n    pass\n',
      solution: FIND_ORDER,
      tests: [
        validOrder('4 courses, two middle courses in either order', 'find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])', 'list(range(4))', '[[1, 0], [2, 0], [3, 1], [3, 2]]'),
        t.eq('find_order(2, [[1, 0]])', '[0, 1]'),
        t.eq('find_order(2, [[0, 1], [1, 0]])', '[]'),
        validOrder('no prerequisites at all', 'find_order(3, [])', '[0, 1, 2]', '[]'),
        t.hidden('find_order(1, [])', '[0]'),
        t.hidden('find_order(4, [[1, 0], [2, 1], [3, 2], [1, 3]])', '[]', { name: 'a cycle behind a free course' }),
        t.hidden('find_order(3, [[0, 0], [1, 2]])', '[]', { name: 'a course that needs itself' }),
        validOrder('repeated pairs and separate groups', 'find_order(6, [[1, 0], [1, 0], [3, 2], [4, 3], [4, 1], [5, 4]])', 'list(range(6))', '[[1, 0], [1, 0], [3, 2], [4, 3], [4, 1], [5, 4]]', true),
        validOrder('a long chain', 'find_order(2000, [[i + 1, i] for i in range(1999)])', 'list(range(2000))', '[[i + 1, i] for i in range(1999)]', true),
      ],
      hints: [
        'A course can be taken once all its prerequisites are taken. Count, for each course, how many it still waits on (its in-degree).',
        'Build `unlocks[pre]` = the courses that `pre` helps unlock, and an in-degree list. Put every course with in-degree 0 in a `deque`.',
        'Pop from the left, add the course to the order, and lower the in-degree of each course it unlocks. Append a course when its count hits 0.',
        'After the loop, if the order has fewer than `num_courses` courses, some are stuck on a cycle: return []. Otherwise return the order.',
      ],
      explanation:
        "Kahn's algorithm only takes a course once everything before it is done, so the order is always valid. Courses on a cycle never reach in-degree 0, which is why a short order means no answer. Each course and each pair is handled once: O(V + E).",
      complexity: { time: 'O(V + E)', space: 'O(V + E)' },
      signature: 'capstone:course-schedule-ii',
    }),
  ],
}

// ───────────────────────────── Course Schedule checkpoints ─────────────────────────────

const scheduleGates: Section = {
  id: 's-course-schedule-gates',
  title: 'Dependency checkpoints',
  summary: 'Cold variants: steps that wait on other steps, and whether everything can finish.',
  exercises: [
    write({
      id: 's-cs-g-a',
      title: 'Can the build finish',
      skills: SCHEDULE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 9,
      prompt:
        'A build has `n` steps, numbered `0` to `n - 1`. Each pair `[step, needs]` in `rules` means `step` can only run after `needs` has finished.\n\nReturn `True` if every step can eventually run, and `False` if some steps wait on each other forever.\n\n`can_finish(n=3, rules=[[1, 0], [2, 1]])` → `True`\n\n`can_finish(n=2, rules=[[0, 1], [1, 0]])` → `False`',
      starterCode: 'def can_finish(n, rules):\n    pass\n',
      solution: `from collections import deque


def can_finish(n, rules):
    unlocks = {s: [] for s in range(n)}
    waiting = [0] * n
    for step, needs in rules:
        unlocks[needs].append(step)
        waiting[step] += 1
    ready = deque(s for s in range(n) if waiting[s] == 0)
    done = 0
    while ready:
        s = ready.popleft()
        done += 1
        for nxt in unlocks[s]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)
    return done == n
`,
      tests: [
        t.eq('can_finish(3, [[1, 0], [2, 1]])', 'True'),
        t.eq('can_finish(2, [[0, 1], [1, 0]])', 'False'),
        t.eq('can_finish(4, [])', 'True'),
        t.eq('can_finish(4, [[1, 0], [2, 1], [3, 2], [1, 3]])', 'False'),
        t.hidden('can_finish(1, [[0, 0]])', 'False'),
        t.hidden('can_finish(5, [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3]])', 'True'),
        t.hidden('can_finish(3000, [[i + 1, i] for i in range(2999)])', 'True'),
      ],
      signature: 'gate:can-finish-build',
    }),
    write({
      id: 's-cs-g-b',
      title: 'How many tasks can ever run',
      skills: SCHEDULE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 9,
      prompt:
        'There are `n` tasks, numbered `0` to `n - 1`. Each pair `[task, needs]` in `deps` means `task` can only start after `needs` has finished.\n\nSome tasks may wait on each other in a loop, so they never run. Neither does anything that waits on them. Return how many tasks can ever run.\n\n`runnable_count(n=4, deps=[[1, 0], [2, 3], [3, 2]])` → `2`\n\n`runnable_count(n=3, deps=[])` → `3`',
      starterCode: 'def runnable_count(n, deps):\n    pass\n',
      solution: `from collections import deque


def runnable_count(n, deps):
    unlocks = {s: [] for s in range(n)}
    waiting = [0] * n
    for task, needs in deps:
        unlocks[needs].append(task)
        waiting[task] += 1
    ready = deque(s for s in range(n) if waiting[s] == 0)
    count = 0
    while ready:
        s = ready.popleft()
        count += 1
        for nxt in unlocks[s]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)
    return count
`,
      tests: [
        t.eq('runnable_count(4, [[1, 0], [2, 3], [3, 2]])', '2'),
        t.eq('runnable_count(3, [])', '3'),
        t.eq('runnable_count(5, [[1, 0], [2, 1], [1, 2], [3, 2], [4, 0]])', '2'),
        t.eq('runnable_count(2, [[0, 1], [1, 0]])', '0'),
        t.hidden('runnable_count(0, [])', '0'),
        t.hidden('runnable_count(3, [[2, 0], [2, 1], [2, 2]])', '2'),
        t.hidden('runnable_count(2000, [[i + 1, i] for i in range(1999)])', '2000'),
      ],
      signature: 'gate:runnable-count',
    }),
    write({
      id: 's-cs-g-c',
      title: 'An install order',
      skills: SCHEDULE_SKILLS,
      ...gate,
      difficulty: 3,
      minutes: 10,
      prompt:
        '`packages` is a list of distinct package names. Each pair `[pkg, needs]` in `deps` means `needs` must be installed before `pkg`.\n\nReturn a list of every package in an order that installs each one after what it needs. Any valid order is fine. Return `[]` if no order works.\n\n`install_order(packages=["app", "lib", "util"], deps=[["app", "lib"], ["lib", "util"]])` → `[\'util\', \'lib\', \'app\']`\n\n`install_order(packages=["a", "b"], deps=[["a", "b"], ["b", "a"]])` → `[]`',
      starterCode: 'def install_order(packages, deps):\n    pass\n',
      solution: `from collections import deque


def install_order(packages, deps):
    unlocks = {p: [] for p in packages}
    waiting = {p: 0 for p in packages}
    for pkg, needs in deps:
        unlocks[needs].append(pkg)
        waiting[pkg] += 1
    ready = deque(p for p in packages if waiting[p] == 0)
    order = []
    while ready:
        p = ready.popleft()
        order.append(p)
        for nxt in unlocks[p]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)
    if len(order) < len(packages):
        return []
    return order
`,
      tests: [
        t.eq('install_order(["app", "lib", "util"], [["app", "lib"], ["lib", "util"]])', "['util', 'lib', 'app']"),
        t.eq('install_order(["a", "b"], [["a", "b"], ["b", "a"]])', '[]'),
        validOrder('two packages share a need', 'install_order(["web", "api", "core", "log"], [["web", "core"], ["api", "core"], ["web", "log"]])', '["web", "api", "core", "log"]', '[["web", "core"], ["api", "core"], ["web", "log"]]'),
        validOrder('nothing depends on anything', 'install_order(["x", "y", "z"], [])', '["x", "y", "z"]', '[]'),
        t.hidden('install_order([], [])', '[]'),
        t.hidden('install_order(["a", "b", "c", "d"], [["b", "a"], ["c", "b"], ["d", "c"], ["b", "d"]])', '[]', { name: 'a loop behind a free package' }),
        validOrder('a wider graph', 'install_order(list("abcdefg"), [["b", "a"], ["c", "a"], ["d", "b"], ["d", "c"], ["e", "d"], ["f", "e"], ["f", "g"]])', 'list("abcdefg")', '[["b", "a"], ["c", "a"], ["d", "b"], ["d", "c"], ["e", "d"], ["f", "e"], ["f", "g"]]', true),
      ],
      signature: 'gate:install-order',
    }),
  ],
}

export const sections: Section[] = [designClass, designGates, queueGates, courseSchedule, scheduleGates]
