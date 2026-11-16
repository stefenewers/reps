import type { LabScaffold } from '@/data/course/types'
import { t } from '@/data/exercises/build'
import { sections } from '@/data/exercises/course/labs-w9w13'

/** The build exercise's reference solution, so a scaffold's reference can never drift from it. */
function buildSolution(id: string): string {
  const ex = sections.flatMap((s) => s.exercises).find((e) => e.id === id)
  if (!ex?.solution) throw new Error(`scaffolds/w9w13: no solution for ${id}`)
  return ex.solution
}

// ───────────────────────────── Priority Support Queue ─────────────────────────────

const priorityQueue: LabScaffold = {
  workedExample: {
    problem: [
      'An emergency room keeps a waiting list. Each patient has a name, a severity (1 is the most serious) and an arrival time.',
      '',
      'Build `Triage` with `add(name, severity, arrival)`, `next_patient()` (remove and return the most serious patient, earliest arrival first on a tie, `None` when empty) and `waiting(k)` (the next `k` names, without removing them).',
      '',
      'There is no closing or cancelling here: every patient who arrives is eventually seen.',
    ].join('\n'),
    walkthrough: [
      {
        step: 'Store tuples `(severity, arrival, name)` in a list and use `heapq` on it.',
        why: 'Python compares tuples left to right, so the heap orders by severity, then arrival, then name. The tie rules come for free from the tuple order.',
        code: 'self.heap = []\nheapq.heappush(self.heap, (severity, arrival, name))',
      },
      {
        step: '`next_patient` pops the smallest tuple and returns its name.',
        why: '`heappop` is O(log n). Sorting the whole list on every call would be O(n log n) each time.',
        code: 'if not self.heap:\n    return None\nreturn heapq.heappop(self.heap)[2]',
      },
      {
        step: '`waiting(k)` uses `heapq.nsmallest` on the heap list.',
        why: '`nsmallest` returns a new sorted list and leaves the heap untouched, so peeking does not change who is next.',
        code: 'return [entry[2] for entry in heapq.nsmallest(k, self.heap)]',
      },
    ],
    solution: `import heapq


class Triage:
    def __init__(self):
        self.heap = []  # tuples (severity, arrival, name)

    def add(self, name, severity, arrival):
        heapq.heappush(self.heap, (severity, arrival, name))

    def next_patient(self):
        if not self.heap:
            return None
        return heapq.heappop(self.heap)[2]

    def waiting(self, k):
        return [entry[2] for entry in heapq.nsmallest(k, self.heap)]


er = Triage()
er.add("Ann", 2, 0)
er.add("Bo", 1, 5)
er.add("Cy", 2, 3)
print(er.waiting(2))       # ['Bo', 'Ann']
print(er.next_patient())   # Bo
print(er.next_patient())   # Ann (same severity as Cy, arrived earlier)
print(er.next_patient(), er.next_patient())  # Cy None
`,
  },
  steps: [
    {
      title: 'State, add and size',
      instruction:
        'In `__init__`, create `self.heap = []` and `self.open = {}` (ticket id to its heap entry). Write `add`: raise `ValueError` if the id is already in `self.open`; otherwise build the entry `[priority, arrival, ticket_id]`, store it in `self.open` and `heapq.heappush` it. Write `size` as `len(self.open)`.',
      checkpoint: {
        description: '`add` opens tickets, rejects an open duplicate, and `size` counts open tickets.',
        tests: [
          t.eq(`run([("add", "a", 2, 0), ("add", "b", 1, 1), ("size",)])`, `[2]`),
          t.eq(`run([("size",)])`, `[0]`),
          t.check(
            'adding an open id twice raises ValueError and keeps one ticket',
            `q = SupportQueue()
q.add("T1", 1, 0)
try:
    q.add("T1", 2, 1)
    raise AssertionError("expected ValueError for a duplicate open ticket")
except ValueError:
    pass
assert q.size() == 1, q.size()`,
          ),
        ],
      },
      hints: [
        'Two questions need fast answers: "which ticket is most urgent?" (a heap) and "is this id open?" (a dict).',
        'The heap entry is a list `[priority, arrival, ticket_id]`. The dict maps `ticket_id` to that same list object.',
        'Check `if ticket_id in self.open: raise ValueError(...)` before you push anything.',
        'add: duplicate check → entry = [priority, arrival, ticket_id] → self.open[ticket_id] = entry → heapq.heappush(self.heap, entry). size: return len(self.open).',
      ],
    },
    {
      title: 'Serve the most urgent ticket',
      instruction:
        'Write `serve`: while the heap is not empty, `heapq.heappop` an entry, delete its id from `self.open` and return the id. Return `None` when the heap runs out. The entry order `[priority, arrival, ticket_id]` already gives the tie rules.',
      checkpoint: {
        description: '`serve` returns ids by priority, then arrival, then id, and `None` when empty. A served id can be added again.',
        tests: [
          t.eq(`run([("add", "T1", 2, 0), ("add", "T2", 1, 5), ("serve",), ("serve",), ("serve",)])`, `['T2', 'T1', None]`),
          t.eq(`run([("add", "B", 1, 3), ("add", "A", 1, 1), ("serve",)])`, `['A']`),
          t.eq(`run([("add", "Z", 1, 1), ("add", "Y", 1, 1), ("serve",)])`, `['Y']`),
          t.eq(`run([("add", "T1", 1, 0), ("serve",), ("add", "T1", 3, 9), ("size",), ("serve",)])`, `['T1', 1, 'T1']`),
        ],
      },
      hints: [
        'The smallest entry in the heap is the most urgent ticket. Lists compare item by item, so ties fall through to arrival and then id.',
        'Pop from the heap, then forget the id in `self.open` so `size` and `add` stay correct.',
        '`entry = heapq.heappop(self.heap)`; `del self.open[entry[2]]`; `return entry[2]`.',
        'serve: while self.heap: pop → del self.open[id] → return id. After the loop: return None. (The loop matters in the next step.)',
      ],
    },
    {
      title: 'Close a ticket lazily',
      instruction:
        'Write `close`: if the id is not in `self.open`, return `False`; otherwise delete it from `self.open` and return `True`. Leave its entry in the heap. Then make `serve` skip dead entries: an entry is live only if `self.open.get(entry[2]) is entry`. Pop and ignore entries that are not live.',
      checkpoint: {
        description: 'Closed tickets are never served, even if the same id is reopened with a different priority.',
        tests: [
          t.eq(`run([("add", "T1", 1, 0), ("add", "T2", 2, 0), ("close", "T1"), ("serve",)])`, `[True, 'T2']`),
          t.eq(`run([("close", "nope")])`, `[False]`),
          t.eq(`run([("add", "a", 1, 0), ("close", "a"), ("close", "a"), ("size",)])`, `[True, False, 0]`),
          t.eq(
            `run([("add", "T1", 1, 0), ("add", "T2", 2, 0), ("close", "T1"), ("add", "T1", 3, 5), ("serve",), ("serve",), ("serve",)])`,
            `[True, 'T2', 'T1', None]`,
            { name: 'a reopened id is served at its new priority, not its old one' },
          ),
        ],
      },
      hints: [
        'Removing an item from the middle of a heap is slow. Instead, make the heap entry "dead" and throw it away when it reaches the top.',
        'The dict is the truth about what is open. The heap may hold stale entries that the dict no longer points to.',
        'Use identity, not just the id: `self.open.get(entry[2]) is entry`. A reopened id has a new entry, so its old one is still dead.',
        'close: if id not in open → False; del open[id] → True. serve: while heap: entry = heappop; if open.get(entry[2]) is entry: del and return entry[2]. Then return None.',
      ],
    },
    {
      title: 'Peek with top_k',
      instruction:
        'Write `top_k(k)`: return `[]` if `k <= 0`. Otherwise collect the live entries from `self.heap` (same `is` test as `serve`) and return the ids of `heapq.nsmallest(k, live)`. Do not pop anything.',
      checkpoint: {
        description: '`top_k` lists up to k open ids in serve order and leaves the queue unchanged.',
        tests: [
          t.eq(`run([("add", "a", 3, 0), ("add", "b", 1, 0), ("add", "c", 2, 0), ("top", 2), ("size",)])`, `[['b', 'c'], 3]`),
          t.eq(`run([("add", "a", 3, 0), ("top", 5), ("top", 0)])`, `[['a'], []]`),
          t.eq(`run([("add", "a", 1, 0), ("add", "b", 2, 0), ("close", "a"), ("top", 3)])`, `[True, ['b']]`),
          t.eq(`run([("add", "a", 1, 0), ("add", "b", 2, 0), ("top", 1), ("serve",), ("size",)])`, `[['a'], 'a', 1]`),
        ],
      },
      hints: [
        'Peeking must not change the queue, so popping is out. You need the k smallest live entries without touching the heap.',
        'Filter first (only live entries), then pick the smallest k.',
        '`heapq.nsmallest(k, live)` returns a new sorted list of the k smallest items.',
        'if k <= 0: return [] → live = [e for e in self.heap if self.open.get(e[2]) is e] → return [e[2] for e in heapq.nsmallest(k, live)].',
      ],
    },
  ],
  referenceSolution: buildSolution('lab-priority-queue-build'),
  explainBack: [
    'Why does `close` leave the entry in the heap instead of removing it? What does that cost later, and when is it paid?',
    'Your live check compares heap entries with `is`, not just by id. Describe a sequence of operations that would serve the wrong ticket if you only checked whether the id is open.',
    'How do the tie rules (priority, then arrival, then id) come out of the entry you push, without any extra comparison code?',
  ],
}

// ───────────────────────────── Calendar Conflict Engine ─────────────────────────────

const calendarConflicts: LabScaffold = {
  workedExample: {
    problem: [
      'A meeting room keeps a list of bookings `(start, end)` in minutes. A booking covers `start` up to, but not including, `end`.',
      '',
      '1. `overlaps(a, b)` returns `True` if two bookings share at least one minute.',
      '2. `booked_minutes(bookings)` returns how many minutes of the day the room is booked. Overlapping bookings count once.',
    ].join('\n'),
    walkthrough: [
      {
        step: 'Two half-open intervals overlap when each starts before the other ends.',
        why: 'Use strict `<`. `(540, 600)` and `(600, 660)` touch at 600 but share no minute, and strict comparison gets that right.',
        code: 'return a[0] < b[1] and b[0] < a[1]',
      },
      {
        step: 'Sort the bookings by start.',
        why: 'After sorting, a booking can only overlap the block you are currently building. You never need to look further back.',
        code: 'for start, end in sorted(bookings):',
      },
      {
        step: 'Grow the current block, or close it and start a new one.',
        why: 'If the next booking starts inside (or at the end of) the current block, the block grows to the later end. Otherwise the block is finished and its length is added.',
        code: 'if cur_end is not None and start <= cur_end:\n    cur_end = max(cur_end, end)\nelse:\n    ...',
      },
      {
        step: 'Add the last block after the loop.',
        why: 'The loop only adds a block when a new one starts, so the final block is still open when the loop ends.',
      },
    ],
    solution: `def overlaps(a, b):
    return a[0] < b[1] and b[0] < a[1]


def booked_minutes(bookings):
    total = 0
    cur_start = cur_end = None
    for start, end in sorted(bookings):
        if cur_end is not None and start <= cur_end:
            cur_end = max(cur_end, end)  # extend the current block
        else:
            if cur_end is not None:
                total += cur_end - cur_start  # close the finished block
            cur_start, cur_end = start, end
    if cur_end is not None:
        total += cur_end - cur_start
    return total


print(overlaps((540, 600), (600, 660)))  # False: they only touch
print(overlaps((540, 600), (590, 620)))  # True
print(booked_minutes([(600, 660), (540, 600), (630, 700), (800, 810)]))  # 170
print(booked_minutes([]))  # 0
`,
  },
  steps: [
    {
      title: 'Reject impossible meetings',
      instruction:
        'Write a helper `check(meetings)` that raises `ValueError` for any meeting with `end <= start`. Call it on the first line of `conflicts` and `busy_blocks`.',
      checkpoint: {
        description: 'A zero-length or backwards meeting raises `ValueError` in `conflicts` and `busy_blocks`.',
        tests: [
          t.check(
            'conflicts and busy_blocks reject end <= start',
            `for fn in (conflicts, busy_blocks):
    for bad in ([(10, 10)], [(540, 600), (5, 1)]):
        try:
            fn(bad)
            raise AssertionError(fn.__name__ + " should raise ValueError for " + str(bad))
        except ValueError:
            pass`,
          ),
        ],
      },
      hints: [
        'Validate input once, at the edge, so the rest of the code can trust it.',
        'One small helper that loops over the meetings, called from each public function.',
        '`for start, end in meetings: if end <= start: raise ValueError(...)`.',
        'def check(meetings): loop → if end <= start: raise ValueError("meeting must end after it starts"). Then `check(meetings)` at the top of conflicts and busy_blocks.',
      ],
    },
    {
      title: 'Find conflicting pairs',
      instruction:
        'Write `conflicts`: sort the positions `range(len(meetings))` by their meeting. For each position, compare it with the later ones in that order and stop as soon as a later meeting starts at or after this one ends. Record each overlapping pair as `(min(i, j), max(i, j))` and return the pairs sorted.',
      checkpoint: {
        description: 'Every overlapping pair, by original position, sorted. Touching meetings do not conflict.',
        tests: [
          t.eq(`conflicts([(540, 600), (570, 630), (700, 730)])`, `[(0, 1)]`),
          t.eq(`conflicts([(540, 600), (600, 660)])`, `[]`),
          t.eq(`conflicts([(100, 200), (50, 150)])`, `[(0, 1)]`),
          t.eq(`conflicts([(1, 10), (2, 3), (4, 5)])`, `[(0, 1), (0, 2)]`, { name: 'a long meeting conflicts with everything inside it' }),
        ],
      },
      hints: [
        'Two meetings overlap when each starts before the other ends. The answer uses original positions, so sort positions, not the meetings themselves.',
        '`order = sorted(range(len(meetings)), key=lambda i: meetings[i])`, then a double loop over `order`.',
        'Inside the inner loop: if `meetings[j][0] >= meetings[i][1]`, break. Sorted by start, no later meeting can overlap `i` either.',
        'check → order → for a: i = order[a]; for b after a: j = order[b]; break if no overlap; else append (min, max) → return sorted(pairs).',
      ],
    },
    {
      title: 'Merge busy time',
      instruction:
        "Write `busy_blocks`: walk `sorted(meetings)`. If the list of blocks is not empty and this meeting starts at or before the last block's end, replace the last block with `(its start, max(its end, this end))`. Otherwise append the meeting as a new block.",
      checkpoint: {
        description: 'Overlapping or touching meetings merge into one block; the result is sorted by start.',
        tests: [
          t.eq(`busy_blocks([(570, 630), (540, 600), (700, 730)])`, `[(540, 630), (700, 730)]`),
          t.eq(`busy_blocks([(1, 2), (2, 3)])`, `[(1, 3)]`),
          t.eq(`busy_blocks([])`, `[]`),
          t.eq(`busy_blocks([(1, 10), (2, 3)])`, `[(1, 10)]`, { name: 'a meeting inside another does not shrink the block' }),
        ],
      },
      hints: [
        'This is the worked example, except you keep the blocks instead of adding up their lengths.',
        'After sorting by start, each meeting only needs comparing with the last block so far.',
        'Use `<=` to merge touching meetings, and `max` for the end so a short meeting inside a long one does not cut it off.',
        'check → blocks = [] → for start, end in sorted(meetings): if blocks and start <= blocks[-1][1]: extend last; else: append → return blocks.',
      ],
    },
    {
      title: 'List free slots inside the day',
      instruction:
        'Write `free_slots`: keep a `cursor` starting at `day_start`. For each busy block, if `start - cursor >= d`, append `(cursor, start)`; then move `cursor` to `max(cursor, end)`. After the loop, add `(cursor, day_end)` if it is at least `d` long. Call `busy_blocks` so bad meetings still raise.',
      checkpoint: {
        description: 'Gaps of at least `d` minutes between busy blocks and the day edges. A gap exactly `d` long counts.',
        tests: [
          t.eq(`free_slots([(540, 600), (630, 660)], 540, 720, 30)`, `[(600, 630), (660, 720)]`),
          t.eq(`free_slots([], 540, 600, 60)`, `[(540, 600)]`),
          t.eq(`[free_slots([(540, 600)], 540, 630, 30), free_slots([(540, 600)], 540, 630, 31)]`, `[[(600, 630)], []]`),
          t.check(
            'free_slots rejects a bad meeting too',
            `try:
    free_slots([(600, 590)], 540, 720, 30)
    raise AssertionError("expected ValueError")
except ValueError:
    pass`,
          ),
        ],
      },
      hints: [
        'Free time is whatever sits between busy blocks. You already have the busy blocks, merged and sorted.',
        'A cursor marks "free from here". Each block either leaves a gap before it or not, and then pushes the cursor forward.',
        'Compare lengths with `>=`, because a gap exactly `d` minutes long fits the meeting.',
        'slots = [] → cursor = day_start → for start, end in busy_blocks(meetings): gap check → cursor = max(cursor, end) → final gap to day_end → return slots.',
      ],
    },
    {
      title: 'Clip meetings to the day',
      instruction:
        'Inside the `free_slots` loop, clip each block first: `start = max(start, day_start)`, `end = min(end, day_end)`. If `start >= end` after clipping, the block is outside the day: `continue`.',
      checkpoint: {
        description: 'Busy time before or after the day is ignored.',
        tests: [
          t.eq(`free_slots([(480, 560), (1000, 1100)], 540, 1020, 30)`, `[(560, 1000)]`),
          t.eq(`free_slots([(500, 1100)], 540, 1020, 15)`, `[]`),
          t.eq(`free_slots([(100, 200), (1200, 1300)], 540, 600, 30)`, `[(540, 600)]`, { name: 'meetings wholly outside the day change nothing' }),
        ],
      },
      hints: [
        'A meeting at 08:00 should not create a "free slot" that starts before the day does.',
        'Only the part of a block inside `[day_start, day_end)` matters. Cut each block down to that range.',
        '`max` with the day start and `min` with the day end. An empty result means the block is entirely outside.',
        'for start, end in busy_blocks(...): start = max(start, day_start); end = min(end, day_end); if start >= end: continue; then the gap check as before.',
      ],
    },
  ],
  referenceSolution: buildSolution('lab-calendar-conflicts-build'),
  explainBack: [
    'Why do `(540, 600)` and `(600, 660)` not conflict, yet merge into one busy block? Say which comparison makes each answer come out right.',
    'In `conflicts`, why is it safe to `break` the inner loop as soon as one later meeting starts after the current one ends?',
    'Why does `free_slots` build on `busy_blocks` instead of walking the raw meetings? What would go wrong with overlapping meetings otherwise?',
  ],
}

// ───────────────────────────── Dependency Planner ─────────────────────────────

const dependencyPlanner: LabScaffold = {
  workedExample: {
    problem: [
      'A recipe has steps, and some steps must happen before others. You get a list of steps and a list of `(before, after)` pairs.',
      '',
      '`order_steps(steps, edges)` returns any order in which every step comes after the steps it waits for, or `None` if the pairs form a loop.',
      '',
      "Use **Kahn's algorithm**: count what each step waits for, start with the steps that wait for nothing, and release the others as their count reaches zero.",
    ].join('\n'),
    walkthrough: [
      {
        step: "Count each step's in-degree: how many steps it still waits for.",
        why: 'A step can run exactly when its count is zero. Also record, for each step, which steps it unlocks, so finishing it can lower their counts.',
        code: 'indegree = {s: 0 for s in steps}\nunlocks = {s: [] for s in steps}\nfor before, after in edges:\n    unlocks[before].append(after)\n    indegree[after] += 1',
      },
      {
        step: 'Put every step with in-degree 0 into a deque of ready steps.',
        why: 'These can run now. A deque gives O(1) `popleft` and `append`.',
        code: 'ready = deque(s for s in steps if indegree[s] == 0)',
      },
      {
        step: 'Pop a ready step, output it, and lower the count of everything it unlocks. Append any step whose count hits 0.',
        why: 'A step only becomes ready once all its prerequisites have been output, so the order is always valid.',
        code: 'while ready:\n    step = ready.popleft()\n    order.append(step)\n    for nxt in unlocks[step]:\n        indegree[nxt] -= 1\n        if indegree[nxt] == 0:\n            ready.append(nxt)',
      },
      {
        step: 'If fewer steps were output than there are steps, there is a cycle.',
        why: 'Steps on a loop wait for each other, so their counts never reach 0 and they are never output.',
        code: 'if len(order) < len(steps):\n    return None',
      },
    ],
    solution: `from collections import deque


def order_steps(steps, edges):
    """edges are (before, after) pairs. Return a valid order of steps, or None on a cycle."""
    indegree = {s: 0 for s in steps}  # how many steps each one still waits for
    unlocks = {s: [] for s in steps}   # step -> steps waiting on it
    for before, after in edges:
        unlocks[before].append(after)
        indegree[after] += 1
    ready = deque(s for s in steps if indegree[s] == 0)
    order = []
    while ready:
        step = ready.popleft()
        order.append(step)
        for nxt in unlocks[step]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                ready.append(nxt)
    if len(order) < len(steps):
        return None  # some steps never became ready: they sit on a cycle
    return order


print(order_steps(["eat", "bake", "shop", "mix"], [("shop", "mix"), ("mix", "bake"), ("bake", "eat")]))
# ['shop', 'mix', 'bake', 'eat']
print(order_steps(["a", "b", "c"], [("a", "b"), ("b", "a")]))
# None: a and b wait for each other
`,
  },
  steps: [
    {
      title: 'Check for unknown prerequisites',
      instruction:
        'Write `check_tasks`: for each task and each name in its list, if the name is not a key of `tasks`, add the string `task + " needs unknown " + need`. Return `sorted(set(problems))`.',
      checkpoint: {
        description: 'One sorted problem per unknown prerequisite; `[]` when clean; a repeated unknown counts once.',
        tests: [
          t.eq(`check_tasks({"deploy": ["build"], "build": []})`, `[]`),
          t.eq(`check_tasks({"deploy": ["test", "build"]})`, `['deploy needs unknown build', 'deploy needs unknown test']`),
          t.eq(`check_tasks({"a": ["x", "x"], "x2": []})`, `['a needs unknown x']`, { name: 'a repeated unknown prerequisite is reported once' }),
        ],
      },
      hints: [
        'A prerequisite is valid only if it is itself a task, that is, a key of the dict.',
        "Two nested loops: over `tasks.items()`, then over each task's list.",
        '`if need not in tasks:` build the message. A set removes duplicates, `sorted` fixes the order.',
        'problems = [] → for task, needs in tasks.items(): for need in needs: if need not in tasks: append → return sorted(set(problems)).',
      ],
    },
    {
      title: "Kahn's algorithm: an order",
      instruction:
        'Write `plan_order` as in the worked example, with the dict turned around. In-degree: `waiting = {task: len(set(needs)) for task, needs in tasks.items()}`. Unlocks: for each task and each need in `set(needs)`, `unlocks[need].append(task)`. Seed a `deque` with the tasks whose count is 0, then pop, append to `order`, and lower the counts of what it unlocks. Return `order` for now.',
      checkpoint: {
        description: 'Every task comes once, after all of its prerequisites. A prerequisite listed twice counts once.',
        tests: [
          t.eq(`plan_order({"deploy": ["build", "test"], "test": ["build"], "build": []})`, `['build', 'test', 'deploy']`),
          t.eq(`plan_order({})`, `[]`),
          t.eq(`plan_order({"b": ["a", "a"], "a": []})`, `['a', 'b']`, { name: 'a duplicated prerequisite is counted once' }),
          t.check(
            'every task comes after its prerequisites',
            `tasks = {"e": ["d", "b"], "d": ["c"], "c": ["a"], "b": ["a"], "a": [], "f": []}
order = plan_order(tasks)
assert sorted(order) == sorted(tasks), "every task appears exactly once"
for task, needs in tasks.items():
    for need in needs:
        assert order.index(need) < order.index(task), need + " should come before " + task`,
          ),
        ],
      },
      hints: [
        'A task is ready when the number of prerequisites it still waits for is zero. Count first, then release tasks as their count drops.',
        'Two dicts: `waiting[task]` (its in-degree) and `unlocks[need]` (tasks that list `need`). Use `set(needs)` in both so duplicates count once.',
        'Loop: `task = ready.popleft()`, `order.append(task)`, then for each `nxt` in `unlocks[task]`: `waiting[nxt] -= 1`, and `ready.append(nxt)` when it hits 0.',
        'waiting → unlocks → ready = deque(tasks with waiting 0) → while ready: popleft, append to order, lower counts, append newly ready → return order.',
      ],
    },
    {
      title: 'Detect a cycle by counting',
      instruction:
        'At the end of `plan_order`, compare lengths: if `len(order) < len(tasks)`, return `None`. Tasks on a cycle never reach in-degree 0, so they are never output.',
      checkpoint: {
        description: '`plan_order` returns `None` when a cycle makes an order impossible, including a task that needs itself.',
        tests: [
          t.eq(`plan_order({"a": ["b"], "b": ["a"]})`, `None`),
          t.eq(`plan_order({"a": ["a"]})`, `None`),
          t.eq(`plan_order({"a": ["b"], "b": ["c"], "c": ["a"], "d": []})`, `None`, { name: 'a cycle is caught even when other tasks are fine' }),
          t.eq(`plan_order({"deploy": ["build"], "build": []})`, `['build', 'deploy']`),
        ],
      },
      hints: [
        'What happens to the counts of two tasks that wait for each other? Does either one ever become ready?',
        "Kahn's loop simply stops early on a cycle. You only need to notice that it stopped early.",
        'Compare how many tasks came out with how many went in.',
        'After the while loop: if len(order) < len(tasks): return None. Else return order.',
      ],
    },
    {
      title: 'Alphabetical among ready tasks',
      instruction:
        "The lab wants the alphabetically smallest ready task first. A deque gives first-in, first-out instead. Keep Kahn's algorithm exactly, but hold the ready tasks in a heap: build the list, `heapq.heapify(ready)`, take with `heapq.heappop(ready)` and add with `heapq.heappush(ready, nxt)`.",
      checkpoint: {
        description: 'Whenever several tasks are ready, the alphabetically smallest is output next.',
        tests: [
          t.eq(`plan_order({"c": [], "b": [], "a": []})`, `['a', 'b', 'c']`),
          t.eq(`plan_order({"b": [], "c": [], "a": ["b"]})`, `['b', 'a', 'c']`, { name: 'a task released later still jumps ahead of a bigger ready task' }),
          t.eq(`plan_order({"deploy": ["build", "test"], "test": ["build"], "build": [], "docs": []})`, `['build', 'docs', 'test', 'deploy']`),
        ],
      },
      hints: [
        'In `{"b": [], "c": [], "a": ["b"]}`, after `b` runs both `a` and `c` are ready. Which should come next, and which does a deque give you?',
        "You need the smallest of the ready tasks every time, while tasks keep arriving. That is a heap's job.",
        'Swap the three deque operations: seed → `heapify`, `popleft` → `heappop`, `append` → `heappush`. The counting does not change.',
        'ready = [tasks with waiting 0]; heapq.heapify(ready); while ready: task = heapq.heappop(ready) ... heapq.heappush(ready, nxt) when its count hits 0.',
      ],
    },
    {
      title: 'Name the cycle',
      instruction:
        "Write `find_cycle` with the same counting loop (pull it into a helper that returns the order, and reuse it in `plan_order`). The leftovers, the tasks not in the order, each have at least one leftover prerequisite. Start at the alphabetically smallest leftover and keep stepping to its alphabetically smallest leftover prerequisite, recording the path, until you reach a task already on the path. Return the path from that task's first position, plus the task again. Return `[]` when nothing is left over.",
      checkpoint: {
        description: 'One cycle that starts and ends with the same task, or `[]`.',
        tests: [
          t.eq(`find_cycle({"a": ["b"], "b": ["a"]})`, `['a', 'b', 'a']`),
          t.eq(`find_cycle({"a": ["b"], "b": []})`, `[]`),
          t.eq(`find_cycle({"a": ["a"]})`, `['a', 'a']`),
          t.eq(`find_cycle({"start": ["x"], "x": ["y"], "y": ["x"]})`, `['x', 'y', 'x']`, { name: 'a task that only leads into a cycle is not part of it' }),
          t.eq(`find_cycle({"a": ["b"], "b": ["c"], "c": ["a"], "d": []})`, `['a', 'b', 'c', 'a']`),
        ],
      },
      hints: [
        "Kahn's algorithm already tells you which tasks are stuck: the ones it never output. A cycle is hiding among them.",
        'Every stuck task waits for at least one other stuck task. So if you keep following stuck prerequisites, you can never run out, and you must eventually repeat a task.',
        'Keep a `path` list. Each step: `nxt = min(n for n in tasks[current] if n in leftover)`. If `nxt` is already in `path`, slice from `path.index(nxt)`.',
        'order = helper(tasks) → leftover = set of tasks not in order → if empty: return [] → current = min(leftover); path = [] → while current not in path: path.append(current); current = smallest leftover need → return path[path.index(current):] + [current].',
      ],
    },
    {
      title: 'Put it together in plan',
      instruction:
        'Write `plan`: if `check_tasks` finds problems, return `("error", problems)`. Otherwise, if `find_cycle` finds one, return `("cycle", cycle)`. Otherwise return `("ok", plan_order(tasks))`.',
      checkpoint: {
        description: 'Errors beat cycles, cycles beat an order, and an empty dict is a valid empty plan.',
        tests: [
          t.eq(`plan({"x": ["y"]})`, `('error', ['x needs unknown y'])`),
          t.eq(`plan({"a": ["b"], "b": ["a"]})`, `('cycle', ['a', 'b', 'a'])`),
          t.eq(`plan({"deploy": ["build"], "build": []})`, `('ok', ['build', 'deploy'])`),
          t.eq(`plan({})`, `('ok', [])`),
          t.eq(`plan({"a": ["a", "zz"]})`, `('error', ['a needs unknown zz'])`, { name: 'an unknown prerequisite is reported before a cycle' }),
        ],
      },
      hints: [
        'Each check guards the next one: a cycle search on tasks with unknown names, or an order on a cyclic graph, makes no sense.',
        'Three early returns, in priority order.',
        'An empty list or empty cycle is falsy, so `if problems:` and `if cycle:` read naturally.',
        'problems = check_tasks(tasks); if problems: return ("error", problems) → cycle = find_cycle(tasks); if cycle: return ("cycle", cycle) → return ("ok", plan_order(tasks)).',
      ],
    },
  ],
  referenceSolution: buildSolution('lab-dependency-planner-build'),
  explainBack: [
    "In your own words, how does Kahn's algorithm know a cycle exists? Why do tasks on a cycle never get output?",
    'Why do the in-degree counts use `set(needs)`? What would happen to `{"b": ["a", "a"], "a": []}` without it?',
    'Your `find_cycle` follows leftover prerequisites until a task repeats. Why can that walk never get stuck at a task with no leftover prerequisite?',
  ],
}

// ───────────────────────────── Support Router (AI/FDE) ─────────────────────────────

const supportRouter: LabScaffold = {
  workedExample: {
    problem: [
      'A review site asks a model to label each review. The model should reply with JSON like `{"label": "positive", "confidence": 0.9}`. It is a **deterministic fake** (no network), and it is sometimes wrong.',
      '',
      '`classify(review, model=fake_model)` returns the label when the reply is valid. Retry once if the reply is not JSON. Otherwise return `"needs_review: ..."` with the reason.',
      '',
      'Valid means: `label` is one of `LABELS`, and `confidence` is a float from 0 to 1.',
    ].join('\n'),
    walkthrough: [
      {
        step: 'Parse the text into a dict, or `None`.',
        why: 'The model returns text. `json.loads` raises `ValueError` on bad text, and valid JSON could still be a list or a number, so check the type too.',
        code: 'try:\n    data = json.loads(text)\nexcept ValueError:\n    return None\nreturn data if isinstance(data, dict) else None',
      },
      {
        step: 'Validate the shape into a list of problems.',
        why: 'Parsed JSON is still untrusted. A list of problems (empty means fine) says exactly what was wrong, which is better for logs than a bare `False`.',
        code: 'if data.get("label") not in LABELS:\n    found.append("bad label")',
      },
      {
        step: 'Retry once on unreadable output, passing the attempt number.',
        why: 'Malformed output is often a one-off. A bounded retry recovers it without looping forever. The fake model takes `attempt` so tests are repeatable.',
        code: 'for attempt in range(2):\n    data = parse(model(review, attempt))\n    if data is not None:\n        break',
      },
      {
        step: 'Only a parsed and validated reply becomes an answer. Everything else goes to a human.',
        why: 'The model proposes; your code decides. Wrong labels and string confidences never leak into the result.',
      },
    ],
    solution: `import json

LABELS = ["positive", "negative", "neutral"]


def fake_model(review, attempt=0):
    """Stands in for an LLM call. Deterministic, and sometimes wrong."""
    text = review.lower()
    if "???" in text and attempt == 0:
        return "Hmm, hard to say!"
    if "love" in text:
        return json.dumps({"label": "positive", "confidence": 0.9})
    if "refund" in text:
        return json.dumps({"label": "angry", "confidence": 0.8})
    if "late" in text:
        return json.dumps({"label": "negative", "confidence": "high"})
    return json.dumps({"label": "neutral", "confidence": 0.5})


def parse(text):
    try:
        data = json.loads(text)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def problems(data):
    found = []
    if data.get("label") not in LABELS:
        found.append("bad label")
    confidence = data.get("confidence")
    if type(confidence) is not float or not 0 <= confidence <= 1:
        found.append("bad confidence")
    return found


def classify(review, model=fake_model):
    data = None
    for attempt in range(2):  # one try plus one retry
        data = parse(model(review, attempt))
        if data is not None:
            break
    if data is None:
        return "needs_review: unreadable"
    found = problems(data)
    if found:
        return "needs_review: " + ", ".join(found)
    return data["label"]


print(classify("I love it"))             # positive
print(classify("??? it was fine"))       # neutral (the retry worked)
print(classify("I want a refund"))       # needs_review: bad label
print(classify("Arrived late"))          # needs_review: bad confidence
print(classify("x", model=lambda r, a: "nope"))  # needs_review: unreadable
`,
  },
  steps: [
    {
      title: "Parse the model's structured output",
      instruction:
        'Write `parse_action(text)`: `json.loads` inside `try`/`except ValueError` (return `None` on failure). Return `None` unless the result is a dict whose `"tool"` is a `str` and whose `"args"` is a `dict`. Return a new dict with just those two keys.',
      checkpoint: {
        description: 'Well-formed replies become `{"tool", "args"}`; anything else is `None`.',
        tests: [
          t.eq(`parse_action('{"tool": "lookup_order", "args": {"order_id": "A1"}}')`, `{"tool": "lookup_order", "args": {"order_id": "A1"}}`),
          t.eq(
            `[parse_action("not json"), parse_action("[1, 2]"), parse_action('{"tool": "x"}'), parse_action('{"tool": 5, "args": {}}')]`,
            `[None, None, None, None]`,
          ),
          t.eq(`parse_action('{"tool": "x", "args": {}, "note": "hi"}')`, `{"tool": "x", "args": {}}`, { name: 'extra top-level keys are dropped' }),
          t.eq(`[parse_action(fake_model("broken")), parse_action(fake_model("Where is A1?"))]`, `[None, {"tool": "lookup_order", "args": {"order_id": "A1"}}]`),
        ],
      },
      hints: [
        'The model returns text. Turn it into data, and treat any surprise as "malformed" rather than crashing.',
        'Two gates: did it parse at all, and does it have the right shape?',
        '`isinstance(data, dict)`, `isinstance(data.get("tool"), str)`, `isinstance(data.get("args"), dict)`. Catch only `ValueError`.',
        'try: data = json.loads(text) except ValueError: return None → shape checks → return None if any fails → return {"tool": data["tool"], "args": data["args"]}.',
      ],
    },
    {
      title: 'Validate against the tool registry',
      instruction:
        'Write `validate(action)`. If the tool is not in `TOOLS`, return only `["unknown tool: " + tool]`. Otherwise take the spec `TOOLS[tool][1]` and, in spec order, add `"missing arg: NAME"` or `"bad type: NAME"` (use `type(value) is not kind`). Then add `"unexpected arg: NAME"` for each extra arg in sorted order.',
      checkpoint: {
        description: 'A parsed action is checked against the registry: unknown tool, missing, wrongly typed and unexpected arguments.',
        tests: [
          t.eq(`validate({"tool": "delete_account", "args": {}})`, `["unknown tool: delete_account"]`),
          t.eq(`validate({"tool": "issue_refund", "args": {"amount": "50", "note": "hi"}})`, `["missing arg: order_id", "bad type: amount", "unexpected arg: note"]`),
          t.eq(`validate({"tool": "issue_refund", "args": {"order_id": "A1", "amount": 30}})`, `[]`),
          t.eq(`validate({"tool": "issue_refund", "args": {"order_id": "A1", "amount": True}})`, `["bad type: amount"]`, { name: 'True is not an int here' }),
        ],
      },
      hints: [
        'Valid JSON can still ask for the wrong thing. The registry `TOOLS` is the contract: which tools exist, and which arguments of which type they take.',
        'Return early for an unknown tool. Otherwise loop over the spec, then loop over the args.',
        '`isinstance(True, int)` is `True` in Python, so use `type(args[name]) is not kind` instead.',
        'if tool not in TOOLS: return [...] → spec = TOOLS[tool][1] → for name, kind in spec.items(): missing / bad type → for name in sorted(args): if name not in spec: unexpected → return problems.',
      ],
    },
    {
      title: 'Reject and retry bad output',
      instruction:
        'Start `handle`. Make `log = []`. For `attempt` in `range(2)`: log `"model:" + str(attempt)`, call `parse_action(model(message, attempt))`, and stop if it is not `None`; otherwise log `"malformed"`. If both attempts fail, log `"status:failed"` and return `{"status": "failed", "result": None, "log": log}`. A small `finish(status, result, log)` helper keeps this tidy.',
      checkpoint: {
        description: 'Malformed output gets exactly one retry; two failures give status `failed`.',
        tests: [
          t.eq(`handle("broken")`, `{"status": "failed", "result": None, "log": ["model:0", "malformed", "model:1", "malformed", "status:failed"]}`),
          t.check(
            'the model is called with attempt 0, then 1, and never a third time',
            `calls = []
out = handle("hi", model=lambda message, attempt: calls.append(attempt) or "nope")
assert calls == [0, 1], calls
assert out["status"] == "failed", out`,
          ),
        ],
      },
      hints: [
        'A model can return junk once and be fine the next time. Retry, but bound it: an unbounded retry is an outage waiting to happen.',
        'A `for attempt in range(2)` loop with `break` on success. After the loop, the action is either parsed or still `None`.',
        'Pass `attempt` to the model: `model(message, attempt)`. That is how the fake model gives a different answer on the retry.',
        'log = [] → action = None → for attempt in range(2): log model:N; action = parse_action(...); if action is not None: break; log malformed → if action is None: return finish("failed", None, log).',
      ],
    },
    {
      title: 'Route: validate, then run the tool',
      instruction:
        'Continue `handle` after a successful parse: log `"proposed:" + tool`. If `validate` returns problems, log `"invalid"` and finish with status `invalid` and the problems as the result. Otherwise get the function `TOOLS[tool][0]`, call it with `**action["args"]`, log `"ran:" + tool` and finish with `done` and its return value.',
      checkpoint: {
        description: 'Valid actions run and return the tool result; invalid ones stop with their problems; a retried reply runs normally.',
        tests: [
          t.eq(`handle("Where is A1?")`, `{"status": "done", "result": "shipped", "log": ["model:0", "proposed:lookup_order", "ran:lookup_order", "status:done"]}`),
          t.eq(
            `handle("delete my account")`,
            `{"status": "invalid", "result": ["unknown tool: delete_account"], "log": ["model:0", "proposed:delete_account", "invalid", "status:invalid"]}`,
          ),
          t.eq(`handle("Refund $50 on A1")["result"]`, `["bad type: amount"]`),
          t.eq(`handle("garbled question about A1")["log"]`, `["model:0", "malformed", "model:1", "proposed:lookup_order", "ran:lookup_order", "status:done"]`),
          t.eq(`handle("Please refund 30 on A1")["result"]`, `"refunded 30 on A1"`),
        ],
      },
      hints: [
        'The order is the safety: parse, then validate, and only then run. Nothing the model says runs until it has passed both.',
        'The registry holds `(function, spec)` pairs. After validation you know the args match the spec exactly.',
        '`function(**action["args"])` turns `{"order_id": "A1"}` into `lookup_order(order_id="A1")`.',
        'log proposed → problems = validate(action); if problems: log invalid, finish("invalid", problems, log) → function = TOOLS[tool][0] → result = function(**args) → log ran → finish("done", result, log).',
      ],
    },
    {
      title: 'Ask a human for risky actions',
      instruction:
        'Write `needs_approval(action)`: `True` only for `issue_refund` with `amount > REFUND_APPROVAL_OVER`. In `handle`, after validation and before running: if approval is needed, it is granted only when `approve` is not `None` and `approve(action) is True`. Log `"approved"` or `"denied"`; on denied, finish with `denied` and result `None`.',
      checkpoint: {
        description: 'Large refunds wait for a human; no approver means no; the approver sees the exact action.',
        tests: [
          t.eq(
            `[needs_approval({"tool": "issue_refund", "args": {"order_id": "A2", "amount": 150}}), needs_approval({"tool": "issue_refund", "args": {"order_id": "A2", "amount": 100}}), needs_approval({"tool": "lookup_order", "args": {"order_id": "A2"}})]`,
            `[True, False, False]`,
          ),
          t.eq(`handle("Refund 150 on A2")`, `{"status": "denied", "result": None, "log": ["model:0", "proposed:issue_refund", "denied", "status:denied"]}`),
          t.eq(`handle("Refund 150 on A2", approve=lambda action: True)["log"]`, `["model:0", "proposed:issue_refund", "approved", "ran:issue_refund", "status:done"]`),
          t.check(
            'the approver sees the action, and anything but True is a no',
            `seen = []
out = handle("Refund 120 on A2", approve=lambda action: seen.append(action) or "yes")
assert seen == [{"tool": "issue_refund", "args": {"order_id": "A2", "amount": 120}}], seen
assert out["status"] == "denied", out`,
          ),
        ],
      },
      hints: [
        "Some valid actions are still too risky to run on the model's say-so. A human gate sits between validation and execution.",
        'Fail closed: a missing approver, or any answer other than exactly `True`, means denied.',
        '`approved = approve is not None and approve(action) is True`. The threshold is strictly greater than 100.',
        'if needs_approval(action): approved = ...; log "approved" if approved else "denied"; if not approved: return finish("denied", None, log). Then run as before.',
      ],
    },
    {
      title: 'Contain tool errors',
      instruction:
        'Wrap the tool call in `try`/`except Exception as error`. On an error, log `"tool_error:" + type(error).__name__` and finish with status `error` and result `None`.',
      checkpoint: {
        description: 'A tool that raises gives status `error` and a logged exception name instead of a crash.',
        tests: [
          t.eq(`handle("Where is A9?")`, `{"status": "error", "result": None, "log": ["model:0", "proposed:lookup_order", "tool_error:KeyError", "status:error"]}`),
          t.eq(`handle("Refund 60 on A1")["log"]`, `["model:0", "proposed:issue_refund", "tool_error:ValueError", "status:error"]`, { name: 'a refund bigger than the order is caught by the tool' }),
        ],
      },
      hints: [
        'A valid-looking action can still fail against real data: an order that does not exist, a refund larger than the order.',
        'The router must always return a result dict and a complete log, even when the tool blows up.',
        'Here a broad `except Exception` is right: you are at the boundary, and you record the exception name instead of hiding it.',
        'try: result = function(**action["args"]) except Exception as error: log tool_error:Name; return finish("error", None, log) → log ran → finish("done", result, log).',
      ],
    },
  ],
  referenceSolution: buildSolution('lab-support-router-build'),
  explainBack: [
    'Walk through the order parse → validate → approve → run. What could go wrong if validation came after approval, or if the tool ran before validation?',
    'Why does `parse_action` catch only `ValueError`, while the tool call catches every `Exception`? What is different about those two boundaries?',
    'Why is the fake model deterministic and given an `attempt` number? How does that make the retry testable, and what would you lose with a real, random model?',
  ],
}

/** Lab scaffolds (data/course/types.ts LabScaffold), keyed by lab id. Merged into LABS by data/course/lessons.ts. */
export const scaffolds: Record<string, LabScaffold> = {
  'lab-priority-queue': priorityQueue,
  'lab-calendar-conflicts': calendarConflicts,
  'lab-dependency-planner': dependencyPlanner,
  'lab-support-router': supportRouter,
}
