import type { Section } from '@/lib/types'
import { code, t } from '@/data/exercises/build'

/**
 * Reps 2.0 labs, Weeks 9–13 (REPS_2_MASTER_SPEC.md §9 "Mini Lab", §17, §34, §47).
 * Each lab has a build (`<id>-build`) and a change request (`<id>-change`) whose
 * starter code is the reference build. The Lab objects live in
 * data/course/content/labs-w9w13.ts.
 */

const lab = { stage: 'combine' as const, repType: 'combine' as const, lab: true, difficulty: 3 as const }
const p = (lines: string[]) => lines.join('\n')

// ───────────────────────────── Dependency Planner (Week 9) ─────────────────────────────

const PLANNER_STARTER = `import heapq


def check_tasks(tasks):
    """Return a sorted list of problems, like "deploy needs unknown test". [] when clean."""
    pass


def find_cycle(tasks):
    """Return one cycle like ['a', 'b', 'a'], or [] if there is none."""
    pass


def plan_order(tasks):
    """Return every task after its prerequisites (ready tasks alphabetically), or None on a cycle."""
    pass


def plan(tasks):
    """Return ("error", problems), ("cycle", cycle) or ("ok", order)."""
    pass
`

const PLANNER_BUILD = `import heapq


def check_tasks(tasks):
    """Return a sorted list of problems, like "deploy needs unknown test". [] when clean."""
    problems = []
    for task, needs in tasks.items():
        for need in needs:
            if need not in tasks:
                problems.append(task + " needs unknown " + need)
    return sorted(set(problems))


def find_cycle(tasks):
    """Return one cycle like ['a', 'b', 'a'], or [] if there is none."""
    state = {}  # missing = unseen, "visiting" = on the current path, "done" = finished
    path = []

    def visit(task):
        state[task] = "visiting"
        path.append(task)
        for need in sorted(set(tasks.get(task, []))):
            if state.get(need) == "visiting":
                return path[path.index(need):] + [need]
            if need not in state:
                found = visit(need)
                if found:
                    return found
        path.pop()
        state[task] = "done"
        return []

    for task in sorted(tasks):
        if task not in state:
            found = visit(task)
            if found:
                return found
    return []


def plan_order(tasks):
    """Return every task after its prerequisites (ready tasks alphabetically), or None on a cycle."""
    waiting = {task: len(set(needs)) for task, needs in tasks.items()}
    unlocks = {task: [] for task in tasks}
    for task, needs in tasks.items():
        for need in set(needs):
            unlocks[need].append(task)
    ready = [task for task, count in waiting.items() if count == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        task = heapq.heappop(ready)
        order.append(task)
        for nxt in unlocks[task]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                heapq.heappush(ready, nxt)
    if len(order) < len(tasks):
        return None
    return order


def plan(tasks):
    """Return ("error", problems), ("cycle", cycle) or ("ok", order)."""
    problems = check_tasks(tasks)
    if problems:
        return ("error", problems)
    cycle = find_cycle(tasks)
    if cycle:
        return ("cycle", cycle)
    return ("ok", plan_order(tasks))
`

const PLANNER_CHANGE = `${PLANNER_BUILD}

def plan_batches(tasks):
    """Return batches of tasks that can run at the same time, or None if there is no valid plan."""
    if check_tasks(tasks) or find_cycle(tasks):
        return None
    done = set()
    batches = []
    while len(done) < len(tasks):
        batch = sorted(task for task, needs in tasks.items() if task not in done and all(n in done for n in needs))
        batches.append(batch)
        done.update(batch)
    return batches
`

const PIPELINE = `{"deploy": ["build", "test"], "test": ["build"], "build": [], "docs": []}`

const plannerOldTests = [
  t.eq(`plan_order({"deploy": ["build", "test"], "test": ["build"], "build": []})`, `['build', 'test', 'deploy']`),
  t.eq(`plan({"a": ["b"], "b": ["a"]})`, `('cycle', ['a', 'b', 'a'])`),
  t.eq(`plan({"x": ["y"]})`, `('error', ['x needs unknown y'])`),
  t.hidden(`plan({})`, `('ok', [])`),
]

// ───────────────────────────── Priority Support Queue (Week 9, optional) ─────────────────────────────

const QUEUE_RUN = `def run(ops):
    """Run a list of operations. Return what serve, close, top and size gave back, in order."""
    q = SupportQueue()
    out = []
    for op in ops:
        if op[0] == "add":
            q.add(op[1], op[2], op[3])
        elif op[0] == "serve":
            out.append(q.serve())
        elif op[0] == "close":
            out.append(q.close(op[1]))
        elif op[0] == "top":
            out.append(q.top_k(op[1]))
        elif op[0] == "size":
            out.append(q.size())
    return out
`

const QUEUE_STARTER = `import heapq


class SupportQueue:
    def __init__(self):
        """Choose your state: a heap of entries, plus something that knows which tickets are open."""
        pass

    def add(self, ticket_id, priority, arrival):
        """Open a ticket. Raise ValueError if ticket_id is already open."""
        pass

    def serve(self):
        """Remove and return the most urgent open ticket id, or None when nothing is open."""
        pass

    def close(self, ticket_id):
        """Close an open ticket without serving it. Return True if it was open, else False."""
        pass

    def top_k(self, k):
        """Return up to k open ticket ids in serve order, without removing them."""
        pass

    def size(self):
        """Return how many tickets are open."""
        pass


${QUEUE_RUN}`

const QUEUE_CLASS = `import heapq


class SupportQueue:
    def __init__(self):
        self.heap = []  # entries [priority, arrival, ticket_id]; closed ones are skipped later
        self.open = {}  # ticket_id -> its live heap entry

    def add(self, ticket_id, priority, arrival):
        """Open a ticket. Raise ValueError if ticket_id is already open."""
        if ticket_id in self.open:
            raise ValueError("ticket already open: " + ticket_id)
        entry = [priority, arrival, ticket_id]
        self.open[ticket_id] = entry
        heapq.heappush(self.heap, entry)

    def _live(self, entry):
        return self.open.get(entry[2]) is entry

    def serve(self):
        """Remove and return the most urgent open ticket id, or None when nothing is open."""
        while self.heap:
            entry = heapq.heappop(self.heap)
            if self._live(entry):
                del self.open[entry[2]]
                return entry[2]
        return None

    def close(self, ticket_id):
        """Close an open ticket without serving it. Return True if it was open, else False."""
        if ticket_id not in self.open:
            return False
        del self.open[ticket_id]
        return True

    def top_k(self, k):
        """Return up to k open ticket ids in serve order, without removing them."""
        if k <= 0:
            return []
        live = [entry for entry in self.heap if self._live(entry)]
        return [entry[2] for entry in heapq.nsmallest(k, live)]

    def size(self):
        """Return how many tickets are open."""
        return len(self.open)
`

const QUEUE_BUILD = `${QUEUE_CLASS}

${QUEUE_RUN}`

const QUEUE_CHANGE = `${QUEUE_CLASS}
    def escalate(self, ticket_id, priority):
        """Make an open ticket more urgent. Return True if it changed, else False."""
        entry = self.open.get(ticket_id)
        if entry is None or priority >= entry[0]:
            return False
        new_entry = [priority, entry[1], ticket_id]
        self.open[ticket_id] = new_entry
        heapq.heappush(self.heap, new_entry)
        return True


def run(ops):
    """Run a list of operations. Return what serve, close, top, size and escalate gave back, in order."""
    q = SupportQueue()
    out = []
    for op in ops:
        if op[0] == "add":
            q.add(op[1], op[2], op[3])
        elif op[0] == "serve":
            out.append(q.serve())
        elif op[0] == "close":
            out.append(q.close(op[1]))
        elif op[0] == "top":
            out.append(q.top_k(op[1]))
        elif op[0] == "size":
            out.append(q.size())
        elif op[0] == "escalate":
            out.append(q.escalate(op[1], op[2]))
    return out
`

// ───────────────────────────── Calendar Conflict Engine (Week 10) ─────────────────────────────

const CALENDAR_STARTER = `def conflicts(meetings):
    """Return sorted pairs (i, j), i < j, of meetings that overlap."""
    pass


def busy_blocks(meetings):
    """Return the merged busy blocks, sorted by start."""
    pass


def free_slots(meetings, day_start, day_end, d):
    """Return the free gaps inside the day that last at least d minutes."""
    pass
`

const CALENDAR_BUILD = `def check(meetings):
    for start, end in meetings:
        if end <= start:
            raise ValueError("meeting must end after it starts: " + str((start, end)))


def conflicts(meetings):
    """Return sorted pairs (i, j), i < j, of meetings that overlap."""
    check(meetings)
    order = sorted(range(len(meetings)), key=lambda i: meetings[i])
    pairs = []
    for a in range(len(order)):
        i = order[a]
        for b in range(a + 1, len(order)):
            j = order[b]
            if meetings[j][0] >= meetings[i][1]:
                break  # sorted by start: no later meeting can overlap i either
            pairs.append((min(i, j), max(i, j)))
    return sorted(pairs)


def busy_blocks(meetings):
    """Return the merged busy blocks, sorted by start."""
    check(meetings)
    blocks = []
    for start, end in sorted(meetings):
        if blocks and start <= blocks[-1][1]:
            blocks[-1] = (blocks[-1][0], max(blocks[-1][1], end))
        else:
            blocks.append((start, end))
    return blocks


def free_slots(meetings, day_start, day_end, d):
    """Return the free gaps inside the day that last at least d minutes."""
    slots = []
    cursor = day_start
    for start, end in busy_blocks(meetings):
        start = max(start, day_start)
        end = min(end, day_end)
        if start >= end:
            continue  # the block is outside the day
        if start - cursor >= d:
            slots.append((cursor, start))
        cursor = max(cursor, end)
    if day_end - cursor >= d:
        slots.append((cursor, day_end))
    return slots
`

const CALENDAR_CHANGE = `def check(meetings):
    for start, end in meetings:
        if end <= start:
            raise ValueError("meeting must end after it starts: " + str((start, end)))


def conflicts(meetings):
    """Return sorted pairs (i, j), i < j, of meetings that overlap."""
    check(meetings)
    order = sorted(range(len(meetings)), key=lambda i: meetings[i])
    pairs = []
    for a in range(len(order)):
        i = order[a]
        for b in range(a + 1, len(order)):
            j = order[b]
            if meetings[j][0] >= meetings[i][1]:
                break
            pairs.append((min(i, j), max(i, j)))
    return sorted(pairs)


def busy_blocks(meetings):
    """Return the merged busy blocks, sorted by start."""
    check(meetings)
    blocks = []
    for start, end in sorted(meetings):
        if blocks and start <= blocks[-1][1]:
            blocks[-1] = (blocks[-1][0], max(blocks[-1][1], end))
        else:
            blocks.append((start, end))
    return blocks


def free_slots(meetings, day_start, day_end, d, buffer=0):
    """Return the free gaps inside the day that last at least d minutes. Each meeting blocks buffer extra minutes after it."""
    padded = [(start, end + buffer) for start, end in meetings]
    slots = []
    cursor = day_start
    for start, end in busy_blocks(padded):
        start = max(start, day_start)
        end = min(end, day_end)
        if start >= end:
            continue
        if start - cursor >= d:
            slots.append((cursor, start))
        cursor = max(cursor, end)
    if day_end - cursor >= d:
        slots.append((cursor, day_end))
    return slots


def common_free(calendars, day_start, day_end, d, buffer=0):
    """Return the gaps where everyone in calendars is free for at least d minutes."""
    everyone = []
    for meetings in calendars:
        everyone.extend(meetings)
    return free_slots(everyone, day_start, day_end, d, buffer)
`

const calendarOldTests = [
  t.eq(`conflicts([(540, 600), (570, 630), (700, 730)])`, `[(0, 1)]`),
  t.eq(`busy_blocks([(570, 630), (540, 600), (700, 730)])`, `[(540, 630), (700, 730)]`),
  t.eq(`free_slots([(540, 600), (630, 660)], 540, 720, 30)`, `[(600, 630), (660, 720)]`),
  t.hidden(`free_slots([(480, 560), (1000, 1100)], 540, 1020, 30)`, `[(560, 1000)]`),
]

// ───────────────────────────── Package Configurator (Week 11) ─────────────────────────────

const CONFIG_STARTER = `def is_compatible(chosen, item, banned):
    """Return False if item and anything in chosen form a banned pair, else True."""
    pass


def configurations(options, banned, prices, budget):
    """Return every valid configuration (one item per category) in search order."""
    pass


def cheapest(options, banned, prices, budget):
    """Return the cheapest valid configuration (the first one on a tie), or None."""
    pass
`

const CONFIG_HELPERS = `def is_compatible(chosen, item, banned):
    """Return False if item and anything in chosen form a banned pair, else True."""
    for a, b in banned:
        if a == item and b in chosen:
            return False
        if b == item and a in chosen:
            return False
    return True


def cost_of(config, prices):
    return sum(prices.get(item, 0) for item in config)
`

const CONFIG_BUILD = `${CONFIG_HELPERS}

def configurations(options, banned, prices, budget):
    """Return every valid configuration (one item per category) in search order."""
    categories = list(options)
    results = []
    chosen = []

    def explore(i, cost):
        if i == len(categories):
            results.append(list(chosen))
            return
        for item in options[categories[i]]:
            new_cost = cost + prices.get(item, 0)
            if new_cost > budget or not is_compatible(chosen, item, banned):
                continue  # prune: nothing below this choice can be valid
            chosen.append(item)      # choose
            explore(i + 1, new_cost)  # explore
            chosen.pop()             # undo

    explore(0, 0)
    return results


def cheapest(options, banned, prices, budget):
    """Return the cheapest valid configuration (the first one on a tie), or None."""
    best = None
    for config in configurations(options, banned, prices, budget):
        if best is None or cost_of(config, prices) < cost_of(best, prices):
            best = config
    return best
`

const CONFIG_CHANGE = `${CONFIG_HELPERS}

def meets_requirements(config, requires):
    for item in config:
        if item in requires and requires[item] not in config:
            return False
    return True


def configurations(options, banned, prices, budget, requires=None):
    """Return every valid configuration (one item per category) in search order."""
    requires = requires or {}
    categories = list(options)
    results = []
    chosen = []

    def explore(i, cost):
        if i == len(categories):
            if meets_requirements(chosen, requires):
                results.append(list(chosen))
            return
        for item in options[categories[i]]:
            new_cost = cost + prices.get(item, 0)
            if new_cost > budget or not is_compatible(chosen, item, banned):
                continue
            chosen.append(item)
            explore(i + 1, new_cost)
            chosen.pop()

    explore(0, 0)
    return results


def cheapest(options, banned, prices, budget, requires=None):
    """Return the cheapest valid configuration (the first one on a tie), or None."""
    best = None
    for config in configurations(options, banned, prices, budget, requires):
        if best is None or cost_of(config, prices) < cost_of(best, prices):
            best = config
    return best
`

const LAPTOP = `{"cpu": ["i5", "i7"], "ram": ["8gb", "16gb"], "case": ["slim", "tower"]}`
const LAPTOP_PRICES = `{"i5": 200, "i7": 350, "8gb": 40, "16gb": 90, "slim": 60, "tower": 30}`

const configOldTests = [
  t.eq(`configurations({"size": ["S", "L"], "color": ["red"]}, [], {}, 0)`, `[['S', 'red'], ['L', 'red']]`),
  t.eq(`configurations(${LAPTOP}, [("i7", "slim")], ${LAPTOP_PRICES}, 400)`, `[['i5', '8gb', 'slim'], ['i5', '8gb', 'tower'], ['i5', '16gb', 'slim'], ['i5', '16gb', 'tower']]`),
  t.eq(`cheapest(${LAPTOP}, [], ${LAPTOP_PRICES}, 1000)`, `['i5', '8gb', 'tower']`),
  t.hidden(`cheapest({"size": ["S"]}, [], {"S": 10}, 5)`, `None`),
]

// ───────────────────────────── Minimum-Cost Plan (Week 11) ─────────────────────────────

const COST_STARTER = `def fewest_packs(sizes, n):
    """Return the fewest packs (any size, any number of each) that add up to exactly n units, or -1."""
    pass


def cheapest_cost(packs, n):
    """packs is a list of (units, price). Return the lowest total price for exactly n units, or -1."""
    pass


def cheapest_plan(packs, n):
    """Return the sorted pack indexes of one cheapest plan for exactly n units, or None."""
    pass
`

const COST_FEWEST = `def fewest_packs(sizes, n):
    """Return the fewest packs (any size, any number of each) that add up to exactly n units, or -1."""
    INF = float("inf")
    best = [0] + [INF] * n  # best[a] = fewest packs that make exactly a units
    for amount in range(1, n + 1):
        for size in sizes:
            if 0 < size <= amount and best[amount - size] + 1 < best[amount]:
                best[amount] = best[amount - size] + 1
    return best[n] if best[n] != INF else -1
`

const COST_BUILD = `${COST_FEWEST}

def solve(packs, n):
    INF = float("inf")
    cost = [0] + [INF] * n    # cost[a] = cheapest price for exactly a units
    last = [None] * (n + 1)   # last[a] = index of the last pack in that cheapest plan
    for amount in range(1, n + 1):
        for i, (units, price) in enumerate(packs):
            if 0 < units <= amount and cost[amount - units] + price < cost[amount]:
                cost[amount] = cost[amount - units] + price
                last[amount] = i
    return cost, last


def cheapest_cost(packs, n):
    """packs is a list of (units, price). Return the lowest total price for exactly n units, or -1."""
    cost, _ = solve(packs, n)
    return cost[n] if cost[n] != float("inf") else -1


def cheapest_plan(packs, n):
    """Return the sorted pack indexes of one cheapest plan for exactly n units, or None."""
    cost, last = solve(packs, n)
    if cost[n] == float("inf"):
        return None
    plan = []
    amount = n
    while amount > 0:
        i = last[amount]
        plan.append(i)
        amount -= packs[i][0]
    return sorted(plan)
`

const COST_CHANGE = `${COST_FEWEST}

def solve(packs, n):
    """Cheapest price and plan for every amount 0..n. A pack is (units, price) or (units, price, stock)."""
    INF = float("inf")
    cost = [0] + [INF] * n
    plan = [[]] + [None] * n

    def use(i, units, price, amounts):
        for amount in amounts:
            if cost[amount - units] + price < cost[amount]:
                cost[amount] = cost[amount - units] + price
                plan[amount] = plan[amount - units] + [i]

    for i, pack in enumerate(packs):
        units, price = pack[0], pack[1]
        if units <= 0:
            continue
        if len(pack) == 2:
            use(i, units, price, range(units, n + 1))  # upward: the same pack can be used again
        else:
            for _ in range(pack[2]):
                use(i, units, price, range(n, units - 1, -1))  # downward: each copy used at most once
    return cost, plan


def cheapest_cost(packs, n):
    """Return the lowest total price for exactly n units, or -1."""
    cost, _ = solve(packs, n)
    return cost[n] if cost[n] != float("inf") else -1


def cheapest_plan(packs, n):
    """Return the sorted pack indexes of one cheapest plan for exactly n units, or None."""
    cost, plan = solve(packs, n)
    if cost[n] == float("inf"):
        return None
    return sorted(plan[n])
`

const planCheck = (name: string, packs: string, n: number, hidden = false) =>
  t.check(
    name,
    `packs = ${packs}
plan = cheapest_plan(packs, ${n})
assert plan is not None, "expected a plan"
assert plan == sorted(plan), "indexes should be sorted"
assert sum(packs[i][0] for i in plan) == ${n}, "the plan should add up to exactly ${n} units"
assert sum(packs[i][1] for i in plan) == cheapest_cost(packs, ${n}), "the plan should cost the cheapest price"`,
    hidden,
  )

const PACKS = `[(1, 3), (5, 10), (10, 18)]`

const costOldTests = [
  t.eq(`fewest_packs([1, 3, 4], 6)`, `2`),
  t.eq(`cheapest_cost(${PACKS}, 12)`, `24`),
  t.eq(`cheapest_cost([(3, 5)], 4)`, `-1`),
  planCheck('old: a cheapest plan still adds up and costs the cheapest price', PACKS, 12),
  t.hidden(`cheapest_plan([(4, 1)], 6)`, `None`),
]

// ───────────────────────────── Support Router (Week 12, AI/FDE) ─────────────────────────────

const ROUTER_TOOLS = `import json

# ---- Given: the tool registry. Plain Python functions; no network. ----

ORDERS = {
    "A1": {"status": "shipped", "total": 40},
    "A2": {"status": "processing", "total": 250},
}
REFUND_APPROVAL_OVER = 100


def lookup_order(order_id):
    return ORDERS[order_id]["status"]


def issue_refund(order_id, amount):
    if amount > ORDERS[order_id]["total"]:
        raise ValueError("refund is larger than the order")
    return "refunded " + str(amount) + " on " + order_id


def escalate_to_human(reason):
    return "ticket opened: " + reason


TOOLS = {
    # tool name -> (function, {argument name: required type})
    "lookup_order": (lookup_order, {"order_id": str}),
    "issue_refund": (issue_refund, {"order_id": str, "amount": int}),
    "escalate_to_human": (escalate_to_human, {"reason": str}),
}


# ---- Given: a simulated model. Same message and attempt, same reply. ----

def fake_model(message, attempt=0):
    """Stands in for an LLM call. Returns JSON text proposing one action. Sometimes it is wrong."""
    text = message.lower()
    order_id = ""
    amount = None
    for word in message.replace("?", " ").replace(",", " ").split():
        if word[0] == "A" and word[1:].isdigit():
            order_id = word
        elif word.isdigit():
            amount = int(word)
        elif word.startswith("$") and word[1:].isdigit():
            amount = word[1:]  # a model bug: the amount comes back as text
    if "broken" in text:
        return '{"tool": "lookup_order", "args": '
    if "garbled" in text and attempt == 0:
        return "Sure! I will look up that order for you."
    if "delete" in text:
        return json.dumps({"tool": "delete_account", "args": {"order_id": order_id}})
    if "cancel" in text:
        return json.dumps({"tool": "cancel_order", "args": {"order_id": order_id}})
    if "refund" in text:
        return json.dumps({"tool": "issue_refund", "args": {"order_id": order_id, "amount": amount}})
    if order_id:
        return json.dumps({"tool": "lookup_order", "args": {"order_id": order_id}})
    return json.dumps({"tool": "escalate_to_human", "args": {"reason": message}})
`

const ROUTER_STARTER = `${ROUTER_TOOLS}

# ---- Yours. ----

def parse_action(text):
    """Return {"tool": str, "args": dict} parsed from the model's text, or None if it is malformed."""
    pass


def validate(action):
    """Return a list of problems with a parsed action. [] means it is safe to run."""
    pass


def needs_approval(action):
    """Return True if a human must approve this valid action before it runs."""
    pass


def handle(message, model=fake_model, approve=None):
    """Run one customer message end to end. Return {"status", "result", "log"}."""
    pass
`

const ROUTER_PARSE = `def parse_action(text):
    """Return {"tool": str, "args": dict} parsed from the model's text, or None if it is malformed."""
    try:
        data = json.loads(text)
    except ValueError:
        return None
    if not isinstance(data, dict):
        return None
    if not isinstance(data.get("tool"), str) or not isinstance(data.get("args"), dict):
        return None
    return {"tool": data["tool"], "args": data["args"]}


def validate(action):
    """Return a list of problems with a parsed action. [] means it is safe to run."""
    tool = action["tool"]
    if tool not in TOOLS:
        return ["unknown tool: " + tool]
    spec = TOOLS[tool][1]
    args = action["args"]
    problems = []
    for name, kind in spec.items():
        if name not in args:
            problems.append("missing arg: " + name)
        elif type(args[name]) is not kind:  # type(), not isinstance: True must not pass as an int
            problems.append("bad type: " + name)
    for name in sorted(args):
        if name not in spec:
            problems.append("unexpected arg: " + name)
    return problems
`

const ROUTER_BUILD = `${ROUTER_TOOLS}

# ---- Yours. ----

${ROUTER_PARSE}

def needs_approval(action):
    """Return True if a human must approve this valid action before it runs."""
    return action["tool"] == "issue_refund" and action["args"]["amount"] > REFUND_APPROVAL_OVER


def finish(status, result, log):
    log.append("status:" + status)
    return {"status": status, "result": result, "log": log}


def handle(message, model=fake_model, approve=None):
    """Run one customer message end to end. Return {"status", "result", "log"}."""
    log = []
    action = None
    for attempt in range(2):  # one try plus one retry
        log.append("model:" + str(attempt))
        action = parse_action(model(message, attempt))
        if action is not None:
            break
        log.append("malformed")
    if action is None:
        return finish("failed", None, log)
    log.append("proposed:" + action["tool"])
    problems = validate(action)
    if problems:
        log.append("invalid")
        return finish("invalid", problems, log)
    if needs_approval(action):
        approved = approve is not None and approve(action) is True  # no approver means no
        log.append("approved" if approved else "denied")
        if not approved:
            return finish("denied", None, log)
    function = TOOLS[action["tool"]][0]
    try:
        result = function(**action["args"])
    except Exception as error:
        log.append("tool_error:" + type(error).__name__)
        return finish("error", None, log)
    log.append("ran:" + action["tool"])
    return finish("done", result, log)
`

const ROUTER_CHANGE = `${ROUTER_TOOLS}
REFUND_BLOCK_OVER = 500


def cancel_order(order_id):
    if ORDERS[order_id]["status"] == "shipped":
        raise ValueError("a shipped order cannot be cancelled")
    return "cancelled " + order_id


TOOLS["cancel_order"] = (cancel_order, {"order_id": str})


# ---- Yours. ----

${ROUTER_PARSE}

def is_blocked(action):
    """Return True if this valid action is never allowed, even with approval."""
    return action["tool"] == "issue_refund" and action["args"]["amount"] > REFUND_BLOCK_OVER


def needs_approval(action):
    """Return True if a human must approve this valid action before it runs."""
    if action["tool"] == "cancel_order":
        return True
    return action["tool"] == "issue_refund" and action["args"]["amount"] > REFUND_APPROVAL_OVER


def finish(status, result, log):
    log.append("status:" + status)
    return {"status": status, "result": result, "log": log}


def handle(message, model=fake_model, approve=None):
    """Run one customer message end to end. Return {"status", "result", "log"}."""
    log = []
    action = None
    for attempt in range(2):
        log.append("model:" + str(attempt))
        action = parse_action(model(message, attempt))
        if action is not None:
            break
        log.append("malformed")
    if action is None:
        return finish("failed", None, log)
    log.append("proposed:" + action["tool"])
    problems = validate(action)
    if problems:
        log.append("invalid")
        return finish("invalid", problems, log)
    if is_blocked(action):
        log.append("blocked")
        return finish("blocked", None, log)
    if needs_approval(action):
        approved = approve is not None and approve(action) is True
        log.append("approved" if approved else "denied")
        if not approved:
            return finish("denied", None, log)
    function = TOOLS[action["tool"]][0]
    try:
        result = function(**action["args"])
    except Exception as error:
        log.append("tool_error:" + type(error).__name__)
        return finish("error", None, log)
    log.append("ran:" + action["tool"])
    return finish("done", result, log)
`

const routerOldTests = [
  t.eq(`handle("Where is A1?")`, `{"status": "done", "result": "shipped", "log": ["model:0", "proposed:lookup_order", "ran:lookup_order", "status:done"]}`),
  t.eq(`handle("Refund 150 on A2")["status"]`, `"denied"`),
  t.eq(`handle("garbled question about A1")["log"]`, `["model:0", "malformed", "model:1", "proposed:lookup_order", "ran:lookup_order", "status:done"]`),
  t.eq(`handle("delete my account")["result"]`, `["unknown tool: delete_account"]`),
  t.hidden(`handle("broken")["status"]`, `"failed"`),
]

// ───────────────────────────── FDE Customer Workflow (Week 13, AI/FDE) ─────────────────────────────

const FDE_MODEL = `import json

# ---- Given: a simulated extraction model. Deterministic, and sometimes wrong. ----

def fake_model(message):
    """Stands in for an LLM that reads 'From: Name <email> | body' and returns JSON text."""
    if "???" in message:
        return "Sorry, I could not read that message."
    head, _, body = message.partition("|")
    words = head.split()[1:]  # drop "From:"
    fields = {}
    name = [w for w in words if "@" not in w]
    if name:
        fields["name"] = " ".join(name)
    for w in words:
        if "@" in w:
            fields["email"] = w.strip("<>")
    text = body.lower()
    if "password" in text or "hacked" in text:
        fields["category"] = "security"
    elif "pricing" in text or "demo" in text or "quote" in text:
        fields["category"] = "sales"
    elif "invoice" in text or "charge" in text or "refund" in text:
        fields["category"] = "billing"
    elif "error" in text or "crash" in text or "bug" in text:
        fields["category"] = "technical"
    fields["urgency"] = "high" if ("urgent" in text or "asap" in text or " down" in text) else "low"
    for w in body.replace(",", " ").replace(".", " ").split():
        if w.startswith("ACC-"):
            fields["account_id"] = w
    return json.dumps(fields)
`

const FDE_CONFIG = `CATEGORIES = ["billing", "technical", "sales"]
QUEUES = {"billing": "finance", "technical": "support", "sales": "sales"}
REQUIRED = ["name", "email", "category"]

LABELLED = [
    ("From: Ana Lee <ana@shop.com> | My invoice is wrong", "finance"),
    ("From: Bo <bo@corp.io> | The app shows an error on login, urgent", "support_urgent"),
    ("From: Cy <cy@web.org> | Can I get a demo?", "sales"),
    ("From: Di <di@shop.com> | Question about pricing on my invoice", "finance"),
    ("From: Ed | Refund please", "manual_review"),
    ("From: Flo <flo@x.com> | ???", "manual_review"),
]
`

const FDE_STARTER = `${FDE_MODEL}

# ---- The customer's configuration. ----

${FDE_CONFIG}

# ---- Yours. ----

def extract(text):
    """Return the dict of fields in the model's JSON text, or None if it is not a JSON object."""
    pass


def validate(fields):
    """Return a list of problems with the fields. [] means the ticket can be routed."""
    pass


def route(fields):
    """Return the queue name for valid fields, or "manual_review"."""
    pass


def process(message, model=fake_model):
    """Run one message through model, extract, validate and route. Return {"queue", "fields", "errors"}."""
    pass


def evaluate(labelled, model=fake_model):
    """Score routing on (message, expected_queue) pairs. Return {"accuracy", "misses"}."""
    pass
`

const FDE_PIPELINE = `def extract(text):
    """Return the dict of fields in the model's JSON text, or None if it is not a JSON object."""
    try:
        data = json.loads(text)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def route(fields):
    """Return the queue name for valid fields, or "manual_review"."""
    if validate(fields):
        return "manual_review"
    queue = QUEUES[fields["category"]]
    if fields.get("urgency") == "high":
        queue += "_urgent"
    return queue


def process(message, model=fake_model):
    """Run one message through model, extract, validate and route. Return {"queue", "fields", "errors"}."""
    fields = extract(model(message))
    if fields is None:
        return {"queue": "manual_review", "fields": {}, "errors": ["unparseable"]}
    return {"queue": route(fields), "fields": fields, "errors": validate(fields)}


def evaluate(labelled, model=fake_model):
    """Score routing on (message, expected_queue) pairs. Return {"accuracy", "misses"}."""
    if not labelled:
        return {"accuracy": 0.0, "misses": []}
    misses = []
    for i, (message, expected) in enumerate(labelled):
        if process(message, model)["queue"] != expected:
            misses.append(i)
    correct = len(labelled) - len(misses)
    return {"accuracy": round(correct / len(labelled), 2), "misses": misses}
`

const FDE_VALIDATE = `def validate(fields):
    """Return a list of problems with the fields. [] means the ticket can be routed."""
    problems = []
    for name in REQUIRED:
        if not fields.get(name):
            problems.append("missing: " + name)
    email = fields.get("email")
    if email and ("@" not in email or "." not in email.split("@")[-1]):
        problems.append("bad email")
    category = fields.get("category")
    if category and category not in CATEGORIES:
        problems.append("unknown category: " + category)
    return problems
`

const FDE_BUILD = `${FDE_MODEL}

# ---- The customer's configuration. ----

${FDE_CONFIG}

# ---- Yours. ----

${FDE_VALIDATE}

${FDE_PIPELINE}`

const FDE_CHANGE = `${FDE_MODEL}

# ---- The customer's configuration (changed). ----

CATEGORIES = ["billing", "technical", "sales", "security"]
QUEUES = {"billing": "finance", "technical": "support", "sales": "sales", "security": "security"}
REQUIRED = ["name", "email", "category", "account_id"]

LABELLED = [
    ("From: Ana Lee <ana@shop.com> | My invoice is wrong, ACC-12", "finance"),
    ("From: Gus <gus@web.org> | Someone hacked my account ACC-77", "security_urgent"),
    ("From: Hal <hal@corp.io> | I forgot my password", "manual_review"),
]


# ---- Yours. ----

def valid_account(value):
    return value.startswith("ACC-") and value[4:].isdigit()


def validate(fields):
    """Return a list of problems with the fields. [] means the ticket can be routed."""
    problems = []
    for name in REQUIRED:
        if not fields.get(name):
            problems.append("missing: " + name)
    email = fields.get("email")
    if email and ("@" not in email or "." not in email.split("@")[-1]):
        problems.append("bad email")
    category = fields.get("category")
    if category and category not in CATEGORIES:
        problems.append("unknown category: " + category)
    account = fields.get("account_id")
    if account and not valid_account(account):
        problems.append("bad account_id")
    return problems


def route(fields):
    """Return the queue name for valid fields, or "manual_review". Security is always urgent."""
    if validate(fields):
        return "manual_review"
    queue = QUEUES[fields["category"]]
    if fields.get("urgency") == "high" or fields["category"] == "security":
        queue += "_urgent"
    return queue


def extract(text):
    """Return the dict of fields in the model's JSON text, or None if it is not a JSON object."""
    try:
        data = json.loads(text)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def process(message, model=fake_model):
    """Run one message through model, extract, validate and route. Return {"queue", "fields", "errors"}."""
    fields = extract(model(message))
    if fields is None:
        return {"queue": "manual_review", "fields": {}, "errors": ["unparseable"]}
    return {"queue": route(fields), "fields": fields, "errors": validate(fields)}


def evaluate(labelled, model=fake_model):
    """Score routing on (message, expected_queue) pairs. Return {"accuracy", "misses"}."""
    if not labelled:
        return {"accuracy": 0.0, "misses": []}
    misses = []
    for i, (message, expected) in enumerate(labelled):
        if process(message, model)["queue"] != expected:
            misses.append(i)
    correct = len(labelled) - len(misses)
    return {"accuracy": round(correct / len(labelled), 2), "misses": misses}
`

// ───────────────────────────── Section ─────────────────────────────

export const sections: Section[] = [
  {
    id: 'labs-w9w13',
    title: 'Labs: Weeks 9–13',
    summary: 'Composition builds: dependency planning, a support queue, calendars, configurators, cost plans and two AI/FDE workflows.',
    exercises: [
      // ── Dependency Planner ──
      code({
        id: 'lab-dependency-planner-build',
        title: 'Dependency Planner: build',
        ...lab,
        skills: ['graph_adjacency', 'cycle_detection', 'graph_dfs'],
        minutes: 40,
        signature: 'lab:dependency-planner',
        prompt: p([
          "You are building the planner for a release pipeline. `tasks` is a dict from a task name to the list of tasks it needs first.",
          "For example, `{'deploy': ['build'], 'build': []}` means build runs before deploy.",
          '',
          '1. `check_tasks(tasks)` returns a sorted list of problems, one per unknown prerequisite. A problem reads `"deploy needs unknown test"`. Return `[]` when every prerequisite is a task.',
          '2. `find_cycle(tasks)` returns one cycle, or `[]`. A cycle starts and ends with the same task, like `[\'a\', \'b\', \'a\']`.',
          '3. In `find_cycle`, follow each task to its prerequisites. Start from tasks in alphabetical order. Visit prerequisites in alphabetical order too.',
          '4. `plan_order(tasks)` returns every task, each one after all of its prerequisites. When several tasks are ready, take the alphabetically smallest first.',
          '5. `plan_order` returns `None` if a cycle makes an order impossible.',
          '6. `plan(tasks)` returns `("error", problems)` if there are problems. Otherwise it returns `("cycle", cycle)` if there is one. Otherwise it returns `("ok", order)`.',
          '',
          "Examples: `plan_order({'deploy': ['build'], 'build': []})` → `['build', 'deploy']`. `plan({'a': ['b'], 'b': ['a']})` → `('cycle', ['a', 'b', 'a'])` (a needs b and b needs a).",
        ]),
        hints: [
          'Mark each task unseen, visiting or done. Reaching a visiting task again means a cycle.',
          'For the order, count how many prerequisites each task still waits on. Keep the ready tasks in a heap.',
        ],
        starterCode: PLANNER_STARTER,
        solution: PLANNER_BUILD,
        tests: [
          t.eq(`check_tasks({"deploy": ["build"], "build": []})`, `[]`),
          t.eq(`check_tasks({"deploy": ["test", "build"]})`, `['deploy needs unknown build', 'deploy needs unknown test']`),
          t.eq(`find_cycle({"a": ["b"], "b": ["a"]})`, `['a', 'b', 'a']`),
          t.eq(`find_cycle({"a": ["b"], "b": []})`, `[]`),
          t.eq(`plan_order({"deploy": ["build", "test"], "test": ["build"], "build": []})`, `['build', 'test', 'deploy']`),
          t.eq(`plan_order({"c": [], "b": [], "a": []})`, `['a', 'b', 'c']`),
          t.eq(`plan_order({"a": ["b"], "b": ["a"]})`, `None`),
          t.eq(`plan({"x": ["y"]})`, `('error', ['x needs unknown y'])`),
          t.hidden(`plan({})`, `('ok', [])`),
          t.hidden(`find_cycle({"a": ["a"]})`, `['a', 'a']`),
          t.hidden(`plan({"a": ["b"], "b": ["c"], "c": ["a"], "d": []})`, `('cycle', ['a', 'b', 'c', 'a'])`),
          t.hidden(`find_cycle({"start": ["x"], "x": ["y"], "y": ["x"]})`, `['x', 'y', 'x']`),
          t.hidden(`plan_order({"b": ["a", "a"], "a": []})`, `['a', 'b']`),
          t.check(
            'every task comes after its prerequisites',
            `tasks = {"e": ["d", "b"], "d": ["c"], "c": ["a"], "b": ["a"], "a": [], "f": []}
order = plan_order(tasks)
assert sorted(order) == sorted(tasks), "every task appears exactly once"
for task, needs in tasks.items():
    for need in needs:
        assert order.index(need) < order.index(task), need + " should come before " + task`,
            true,
          ),
        ],
      }),
      code({
        id: 'lab-dependency-planner-change',
        title: 'Dependency Planner: change request',
        ...lab,
        skills: ['graph_adjacency', 'cycle_detection'],
        minutes: 20,
        signature: 'lab:dependency-planner-change',
        prompt: p([
          'Change request: the team can now run independent tasks at the same time. The starter code is the working planner.',
          '',
          'Add `plan_batches(tasks)`. It returns a list of batches, and each batch is a sorted list of tasks.',
          '1. The first batch holds every task that needs nothing.',
          '2. Each later batch holds every task whose prerequisites are all in earlier batches.',
          '3. Return `None` if `check_tasks` finds problems or there is a cycle.',
          'Everything that already worked must keep working.',
          '',
          "Examples: `plan_batches({'deploy': ['build', 'test'], 'test': ['build'], 'build': [], 'docs': []})` → `[['build', 'docs'], ['test'], ['deploy']]`. `plan_batches({'a': ['a']})` → `None` (a needs itself).",
        ]),
        hints: ['Repeat: collect every task not yet done whose prerequisites are all done. That set is the next batch.'],
        starterCode: PLANNER_BUILD,
        solution: PLANNER_CHANGE,
        tests: [
          t.eq(`plan_batches(${PIPELINE})`, `[['build', 'docs'], ['test'], ['deploy']]`),
          t.eq(`plan_batches({"c": [], "b": [], "a": []})`, `[['a', 'b', 'c']]`),
          t.eq(`plan_batches({"a": ["b"], "b": ["a"]})`, `None`),
          t.eq(`plan_batches({"x": ["y"]})`, `None`),
          t.hidden(`plan_batches({})`, `[]`),
          t.hidden(`plan_batches({"d": ["c"], "c": ["b"], "b": ["a"], "a": []})`, `[['a'], ['b'], ['c'], ['d']]`),
          t.hidden(`plan_batches({"a": ["a"]})`, `None`),
          ...plannerOldTests,
        ],
      }),

      // ── Priority Support Queue ──
      code({
        id: 'lab-priority-queue-build',
        title: 'Priority Support Queue: build',
        ...lab,
        skills: ['heap_push_pop', 'top_k', 'dict_assign'],
        minutes: 35,
        signature: 'lab:priority-queue',
        prompt: p([
          'You are building the queue behind a support desk. Each ticket has an id, a priority and an arrival time.',
          'Priority 1 is the most urgent. Use `heapq`; do not sort the whole queue on every call.',
          '',
          'Fill in `SupportQueue`:',
          '1. `add(ticket_id, priority, arrival)` opens a ticket. Raise `ValueError` if that id is already open.',
          '2. `serve()` removes and returns the most urgent open ticket id. Return `None` when nothing is open.',
          '3. On equal priority, the earlier arrival goes first. On equal arrival too, the smaller id goes first.',
          '4. `close(ticket_id)` closes an open ticket without serving it. Return `True` if it was open, else `False`.',
          '5. `top_k(k)` returns up to `k` open ids in the order `serve` would give them. It removes nothing.',
          '6. `size()` returns how many tickets are open. A served or closed id can be added again.',
          '',
          '`run(ops)` is given. It replays a list of operations and collects what they return.',
          "Examples: `run([('add', 'T1', 2, 0), ('add', 'T2', 1, 5), ('serve',), ('serve',), ('serve',)])` → `['T2', 'T1', None]`. `run([('add', 'T1', 1, 0), ('close', 'T1'), ('serve',)])` → `[True, None]`.",
        ]),
        hints: [
          'Push lists like [priority, arrival, ticket_id]: the heap orders them by priority, then arrival, then id.',
          'Closing in the middle of a heap is slow. Forget the ticket in a dict instead, and skip its heap entry when it reaches the top.',
        ],
        starterCode: QUEUE_STARTER,
        solution: QUEUE_BUILD,
        tests: [
          t.eq(`run([("add", "T1", 2, 0), ("add", "T2", 1, 5), ("serve",), ("serve",), ("serve",)])`, `['T2', 'T1', None]`),
          t.eq(`run([("add", "B", 1, 3), ("add", "A", 1, 1), ("serve",)])`, `['A']`),
          t.eq(`run([("add", "Z", 1, 1), ("add", "Y", 1, 1), ("serve",)])`, `['Y']`),
          t.eq(`run([("add", "T1", 1, 0), ("add", "T2", 2, 0), ("close", "T1"), ("serve",)])`, `[True, 'T2']`),
          t.eq(`run([("close", "nope",)])`, `[False]`),
          t.eq(`run([("add", "a", 3, 0), ("add", "b", 1, 0), ("add", "c", 2, 0), ("top", 2), ("size",)])`, `[['b', 'c'], 3]`),
          t.eq(`run([("add", "a", 3, 0), ("top", 5), ("top", 0)])`, `[['a'], []]`),
          t.check(
            'adding an open id twice raises ValueError',
            `q = SupportQueue()
q.add("T1", 1, 0)
try:
    q.add("T1", 2, 1)
    raise AssertionError("expected ValueError for a duplicate open ticket")
except ValueError:
    pass
assert q.size() == 1`,
          ),
          t.hidden(`run([("add", "a", 1, 0), ("add", "b", 2, 0), ("close", "a"), ("top", 3)])`, `[True, ['b']]`),
          t.hidden(`run([("add", "T1", 1, 0), ("serve",), ("add", "T1", 3, 9), ("size",), ("serve",)])`, `['T1', 1, 'T1']`),
          t.hidden(`run([("add", "T1", 1, 0), ("close", "T1"), ("add", "T1", 1, 0), ("top", 5), ("serve",), ("serve",)])`, `[True, ['T1'], 'T1', None]`),
          t.hidden(`run([("serve",), ("size",), ("top", 3)])`, `[None, 0, []]`),
        ],
      }),
      code({
        id: 'lab-priority-queue-change',
        title: 'Priority Support Queue: change request',
        ...lab,
        skills: ['heap_push_pop', 'dict_assign'],
        minutes: 20,
        signature: 'lab:priority-queue-change',
        prompt: p([
          'Change request: agents need to escalate a ticket that has become more urgent. The starter code is the working queue.',
          '',
          '1. Add `escalate(ticket_id, priority)` to `SupportQueue`.',
          '2. It gives an open ticket a smaller (more urgent) priority. The ticket keeps its arrival time.',
          '3. Return `True` if the ticket changed.',
          '4. Return `False` and change nothing if the ticket is not open or the new priority is not smaller.',
          '5. Teach `run` the operation `("escalate", ticket_id, priority)`. It records what `escalate` returned.',
          'Serving, closing and `top_k` must keep working, and an escalated ticket must never be served twice.',
          '',
          "Examples: `run([('add', 'a', 3, 0), ('add', 'b', 2, 1), ('escalate', 'a', 1), ('serve',)])` → `[True, 'a']`. `run([('add', 'a', 1, 0), ('escalate', 'a', 2)])` → `[False]` (2 is less urgent).",
        ]),
        hints: ['Push a fresh entry and point the dict at it. The old entry is now stale and gets skipped, like a closed ticket.'],
        starterCode: QUEUE_BUILD,
        solution: QUEUE_CHANGE,
        tests: [
          t.eq(`run([("add", "a", 3, 0), ("add", "b", 2, 1), ("escalate", "a", 1), ("serve",)])`, `[True, 'a']`),
          t.eq(`run([("add", "a", 1, 0), ("escalate", "a", 2)])`, `[False]`),
          t.eq(`run([("escalate", "ghost", 1)])`, `[False]`),
          t.eq(`run([("add", "a", 3, 0), ("add", "b", 3, 1), ("escalate", "b", 1), ("serve",), ("serve",), ("serve",)])`, `[True, 'b', 'a', None]`),
          t.hidden(`run([("add", "a", 3, 5), ("add", "b", 1, 9), ("escalate", "a", 1), ("top", 2)])`, `[True, ['a', 'b']]`),
          t.hidden(`run([("add", "a", 3, 0), ("escalate", "a", 2), ("escalate", "a", 1), ("size",), ("serve",), ("serve",)])`, `[True, True, 1, 'a', None]`),
          t.hidden(`run([("add", "a", 3, 0), ("close", "a"), ("escalate", "a", 1)])`, `[True, False]`),
          t.eq(`run([("add", "T1", 2, 0), ("add", "T2", 1, 5), ("serve",), ("serve",), ("serve",)])`, `['T2', 'T1', None]`),
          t.eq(`run([("add", "a", 3, 0), ("add", "b", 1, 0), ("add", "c", 2, 0), ("top", 2), ("size",)])`, `[['b', 'c'], 3]`),
          t.hidden(`run([("add", "T1", 1, 0), ("add", "T2", 2, 0), ("close", "T1"), ("serve",)])`, `[True, 'T2']`),
        ],
      }),

      // ── Calendar Conflict Engine ──
      code({
        id: 'lab-calendar-conflicts-build',
        title: 'Calendar Conflict Engine: build',
        ...lab,
        skills: ['interval_overlap', 'sorting', 'edge_cases'],
        minutes: 40,
        signature: 'lab:calendar-conflicts',
        prompt: p([
          'You are building the scheduling engine for a team calendar. A meeting is a tuple `(start, end)` in minutes after midnight.',
          'A meeting covers `start` up to, but not including, `end`. So `(540, 600)` and `(600, 660)` do not overlap.',
          '',
          '1. Every function raises `ValueError` if a meeting has `end <= start`.',
          '2. `conflicts(meetings)` returns every pair of positions `(i, j)` with `i < j` whose meetings overlap. Sort the pairs.',
          '3. `busy_blocks(meetings)` merges the meetings into busy blocks, sorted by start. Blocks that overlap or touch become one block.',
          '4. `free_slots(meetings, day_start, day_end, d)` returns the free gaps inside the day that last at least `d` minutes.',
          '5. Ignore any part of a meeting outside the day. `d` is at least 1.',
          '',
          'Examples: `free_slots([(540, 600), (630, 660)], 540, 720, 30)` → `[(600, 630), (660, 720)]`. `busy_blocks([(1, 2), (2, 3)])` → `[(1, 3)]` (touching blocks merge).',
        ]),
        hints: [
          'Sort by start first. Then each meeting only needs to be compared with the block before it.',
          'For free slots, walk the busy blocks with a cursor at the end of the last busy time.',
        ],
        starterCode: CALENDAR_STARTER,
        solution: CALENDAR_BUILD,
        tests: [
          t.eq(`conflicts([(540, 600), (570, 630), (700, 730)])`, `[(0, 1)]`),
          t.eq(`conflicts([(540, 600), (600, 660)])`, `[]`),
          t.eq(`conflicts([(100, 200), (50, 150)])`, `[(0, 1)]`),
          t.eq(`busy_blocks([(570, 630), (540, 600), (700, 730)])`, `[(540, 630), (700, 730)]`),
          t.eq(`busy_blocks([(1, 2), (2, 3)])`, `[(1, 3)]`),
          t.eq(`busy_blocks([])`, `[]`),
          t.eq(`free_slots([(540, 600), (630, 660)], 540, 720, 30)`, `[(600, 630), (660, 720)]`),
          t.eq(`free_slots([], 540, 600, 60)`, `[(540, 600)]`),
          t.hidden(`conflicts([(1, 10), (2, 3), (4, 5)])`, `[(0, 1), (0, 2)]`),
          t.hidden(`busy_blocks([(1, 10), (2, 3)])`, `[(1, 10)]`),
          t.hidden(`free_slots([(500, 1100)], 540, 1020, 15)`, `[]`),
          t.hidden(`free_slots([(480, 560), (1000, 1100)], 540, 1020, 30)`, `[(560, 1000)]`),
          t.hidden(`free_slots([(540, 600)], 540, 630, 31)`, `[]`),
          t.check(
            'a meeting that ends before it starts raises ValueError',
            `for bad in ([(10, 10)], [(5, 1)]):
    try:
        busy_blocks(bad)
        raise AssertionError("expected ValueError for " + str(bad))
    except ValueError:
        pass`,
            true,
          ),
        ],
      }),
      code({
        id: 'lab-calendar-conflicts-change',
        title: 'Calendar Conflict Engine: change request',
        ...lab,
        skills: ['interval_overlap', 'sorting'],
        minutes: 25,
        signature: 'lab:calendar-conflicts-change',
        prompt: p([
          'Change request: people want a break after meetings, and they want to book a slot that works for a whole group. The starter code is the working engine.',
          '',
          '1. `free_slots` takes a new last argument, `buffer`, with default `0`.',
          '2. Each meeting blocks `buffer` extra minutes after its end. A meeting `(540, 600)` with buffer 10 blocks 540 to 610.',
          '3. Add `common_free(calendars, day_start, day_end, d, buffer=0)`. `calendars` is a list of meeting lists, one per person.',
          '4. It returns the gaps where everyone is free for at least `d` minutes, using the same buffer rule.',
          'Calls without `buffer` must give exactly what they gave before.',
          '',
          'Examples: `free_slots([(540, 600)], 540, 720, 30, 15)` → `[(615, 720)]`. `common_free([[(540, 600)], [(630, 700)]], 540, 720, 30)` → `[(600, 630)]` (700 to 720 is too short).',
        ]),
        hints: ['Pad each meeting first, then reuse what you already have. A group is free only where the merged calendar of everyone is free.'],
        starterCode: CALENDAR_BUILD,
        solution: CALENDAR_CHANGE,
        tests: [
          t.eq(`free_slots([(540, 600)], 540, 720, 30, 15)`, `[(615, 720)]`),
          t.eq(`free_slots([(540, 600), (620, 660)], 540, 720, 10, 25)`, `[(685, 720)]`),
          t.eq(`common_free([[(540, 600)], [(630, 700)]], 540, 720, 30)`, `[(600, 630)]`),
          t.eq(`common_free([[], []], 540, 600, 60)`, `[(540, 600)]`),
          t.hidden(`common_free([[(540, 600)], [(600, 660)]], 540, 720, 20, 10)`, `[(670, 720)]`),
          t.hidden(`common_free([], 540, 600, 30)`, `[(540, 600)]`),
          t.hidden(`free_slots([(990, 1010)], 540, 1020, 30, 30)`, `[(540, 990)]`),
          ...calendarOldTests,
        ],
      }),

      // ── Package Configurator ──
      code({
        id: 'lab-package-configurator-build',
        title: 'Package Configurator: build',
        ...lab,
        skills: ['backtracking_state', 'edge_cases'],
        minutes: 40,
        signature: 'lab:package-configurator',
        prompt: p([
          'You are building the configurator for a laptop store. A configuration picks exactly one item from every category.',
          '`options` is a dict from a category to its items, like `{\'cpu\': [\'i5\', \'i7\'], \'case\': [\'slim\', \'tower\']}`.',
          '`banned` is a list of item pairs that cannot be in the same configuration. `prices` maps an item to its price; a missing item costs 0.',
          '',
          '1. `is_compatible(chosen, item, banned)` returns `False` if `item` forms a banned pair with anything in `chosen`. Pairs work in both directions.',
          '2. `configurations(options, banned, prices, budget)` returns every valid configuration as a list of items.',
          '3. A valid configuration has no banned pair and costs at most `budget`.',
          '4. Go through categories in dict order and items in list order. Return configurations in the order you find them.',
          '5. Stop exploring a partial configuration as soon as it breaks a rule. Prices are never negative.',
          '6. `cheapest(options, banned, prices, budget)` returns the cheapest valid configuration, or `None`. On a tie, return the first one found.',
          '',
          "Examples: `configurations({'size': ['S', 'L'], 'color': ['red']}, [], {}, 0)` → `[['S', 'red'], ['L', 'red']]`. `configurations({'size': ['S'], 'color': ['red']}, [('S', 'red')], {}, 0)` → `[]` (the only pick is banned).",
        ]),
        hints: [
          'Choose an item for the current category, explore the next category, then undo the choice.',
          'Carry the running cost as an argument, so the budget check is one comparison.',
        ],
        starterCode: CONFIG_STARTER,
        solution: CONFIG_BUILD,
        tests: [
          t.eq(`is_compatible(["i7"], "slim", [("i7", "slim")])`, `False`),
          t.eq(`is_compatible(["slim"], "i7", [("i7", "slim")])`, `False`),
          t.eq(`is_compatible(["i5"], "slim", [("i7", "slim")])`, `True`),
          t.eq(`configurations({"size": ["S", "L"], "color": ["red"]}, [], {}, 0)`, `[['S', 'red'], ['L', 'red']]`),
          t.eq(`configurations({"size": ["S"], "color": ["red"]}, [("S", "red")], {}, 0)`, `[]`),
          t.eq(`configurations(${LAPTOP}, [("i7", "slim")], ${LAPTOP_PRICES}, 400)`, `[['i5', '8gb', 'slim'], ['i5', '8gb', 'tower'], ['i5', '16gb', 'slim'], ['i5', '16gb', 'tower']]`),
          t.eq(`cheapest(${LAPTOP}, [], ${LAPTOP_PRICES}, 1000)`, `['i5', '8gb', 'tower']`),
          t.hidden(`configurations({}, [], {}, 0)`, `[[]]`),
          t.hidden(`configurations({"cpu": ["i5"], "ram": []}, [], {}, 100)`, `[]`),
          t.hidden(`len(configurations(${LAPTOP}, [], ${LAPTOP_PRICES}, 1000))`, `8`),
          t.hidden(`configurations(${LAPTOP}, [("i5", "16gb"), ("i7", "tower")], ${LAPTOP_PRICES}, 480)`, `[['i5', '8gb', 'slim'], ['i5', '8gb', 'tower'], ['i7', '8gb', 'slim']]`),
          t.hidden(`cheapest({"size": ["S"]}, [], {"S": 10}, 5)`, `None`),
          t.hidden(`cheapest({"a": ["x", "y"]}, [], {"x": 5, "y": 5}, 10)`, `['x']`),
        ],
      }),
      code({
        id: 'lab-package-configurator-change',
        title: 'Package Configurator: change request',
        ...lab,
        skills: ['backtracking_state'],
        minutes: 20,
        signature: 'lab:package-configurator-change',
        prompt: p([
          'Change request: some items only work with another item. The starter code is the working configurator.',
          '',
          '1. `configurations` and `cheapest` take a new last argument, `requires`, with default `None`.',
          '2. `requires` is a dict from an item to the item it needs, like `{\'i7\': \'16gb\'}`.',
          '3. A configuration that contains an item from `requires` must also contain the item it needs.',
          '4. A later category can still supply the needed item. Check this rule once the configuration is complete.',
          'Calls without `requires` must give exactly what they gave before.',
          '',
          "Examples: `configurations({'cpu': ['i5', 'i7'], 'ram': ['8gb', '16gb']}, [], {}, 0, {'i7': '16gb'})` → `[['i5', '8gb'], ['i5', '16gb'], ['i7', '16gb']]`. `cheapest({'cpu': ['i7']}, [], {}, 0, {'i7': '16gb'})` → `None` (16gb is not on offer).",
        ]),
        hints: ['The banned check can prune early, but a requirement can only be judged once every category is chosen.'],
        starterCode: CONFIG_BUILD,
        solution: CONFIG_CHANGE,
        tests: [
          t.eq(`configurations({"cpu": ["i5", "i7"], "ram": ["8gb", "16gb"]}, [], {}, 0, {"i7": "16gb"})`, `[['i5', '8gb'], ['i5', '16gb'], ['i7', '16gb']]`),
          t.eq(`cheapest({"cpu": ["i7"]}, [], {}, 0, {"i7": "16gb"})`, `None`),
          t.eq(`configurations({"ram": ["8gb", "16gb"], "cpu": ["i7"]}, [], {}, 0, {"i7": "16gb"})`, `[['16gb', 'i7']]`),
          t.eq(`cheapest(${LAPTOP}, [], ${LAPTOP_PRICES}, 1000, {"i5": "slim"})`, `['i5', '8gb', 'slim']`),
          t.hidden(`len(configurations(${LAPTOP}, [], ${LAPTOP_PRICES}, 1000, {"i7": "16gb", "16gb": "tower"}))`, `4`),
          t.hidden(`configurations({"cpu": ["i7"], "ram": ["16gb"]}, [("i7", "16gb")], {}, 0, {"i7": "16gb"})`, `[]`),
          t.hidden(`configurations({"a": ["x"]}, [], {}, 0, {})`, `[['x']]`),
          ...configOldTests,
        ],
      }),

      // ── Minimum-Cost Plan ──
      code({
        id: 'lab-minimum-cost-build',
        title: 'Minimum-Cost Plan: build',
        ...lab,
        skills: ['dp_min_choice', 'dp_table', 'recurrence'],
        minutes: 40,
        signature: 'lab:minimum-cost',
        prompt: p([
          'You are building the order planner for a supplier that sells units in packs. A customer needs exactly `n` units. You may buy any number of each pack.',
          '',
          '1. `fewest_packs(sizes, n)` returns the fewest packs that add up to exactly `n` units. `sizes` is a list of pack sizes.',
          '2. `packs` is a list of `(units, price)` tuples. `cheapest_cost(packs, n)` returns the lowest total price for exactly `n` units.',
          '3. `cheapest_plan(packs, n)` returns one cheapest plan as a sorted list of pack indexes. Buying pack 0 twice puts 0 in the list twice.',
          '4. When `n` cannot be reached, `fewest_packs` and `cheapest_cost` return `-1`. `cheapest_plan` returns `None`.',
          '5. `n = 0` needs no packs: return `0`, `0` and `[]`.',
          'Taking the biggest pack first is not always best. Work it out for every amount from 0 up to `n`.',
          '',
          'Examples: `fewest_packs([1, 3, 4], 6)` → `2` (3 + 3, not 4 + 1 + 1). `cheapest_cost([(3, 5)], 4)` → `-1` (packs of 3 never make 4).',
        ]),
        hints: [
          'State: best[a] is the answer for exactly a units. Base: best[0] = 0. Recurrence: try every pack as the last one bought.',
          'To rebuild the plan, remember which pack was last for each amount, then walk back from n.',
        ],
        starterCode: COST_STARTER,
        solution: COST_BUILD,
        tests: [
          t.eq(`fewest_packs([1, 3, 4], 6)`, `2`),
          t.eq(`fewest_packs([1, 5, 10], 12)`, `3`),
          t.eq(`fewest_packs([4, 6], 7)`, `-1`),
          t.eq(`fewest_packs([2], 0)`, `0`),
          t.eq(`cheapest_cost(${PACKS}, 12)`, `24`),
          t.eq(`cheapest_cost([(3, 5)], 4)`, `-1`),
          t.eq(`cheapest_cost([(1, 2), (6, 15)], 6)`, `12`),
          planCheck('a cheapest plan adds up to n and costs the cheapest price', PACKS, 12),
          t.hidden(`cheapest_plan([(4, 1)], 6)`, `None`),
          t.hidden(`cheapest_plan(${PACKS}, 0)`, `[]`),
          t.hidden(`cheapest_plan([(2, 3), (3, 4)], 7)`, `[0, 0, 1]`),
          t.hidden(`fewest_packs([], 5)`, `-1`),
          planCheck('a larger plan is still exact and cheapest', `[(7, 20), (3, 9), (2, 5)]`, 23, true),
        ],
      }),
      code({
        id: 'lab-minimum-cost-change',
        title: 'Minimum-Cost Plan: change request',
        ...lab,
        skills: ['dp_min_choice', 'dp_table'],
        minutes: 30,
        signature: 'lab:minimum-cost-change',
        prompt: p([
          'Change request: the warehouse is running low, so some packs now have limited stock. The starter code is the working planner.',
          '',
          '1. A pack can now be `(units, price, stock)` as well as `(units, price)`.',
          '2. A pack with `stock` can be bought at most `stock` times. A pack without it is still unlimited.',
          '3. `cheapest_cost` and `cheapest_plan` must respect stock. `fewest_packs` does not change.',
          'Old calls with only two-item packs must give the same answers.',
          '',
          'Examples: `cheapest_cost([(5, 6, 1), (1, 2)], 10)` → `16` (one cheap 5-pack, then five 1-packs). `cheapest_cost([(4, 1, 1)], 8)` → `-1` (only one 4-pack in stock).',
        ]),
        hints: [
          'Go pack by pack instead of amount by amount. An unlimited pack updates amounts upward, so it can be reused.',
          'Each copy of a limited pack updates amounts downward, so one copy is used at most once.',
        ],
        starterCode: COST_BUILD,
        solution: COST_CHANGE,
        tests: [
          t.eq(`cheapest_cost([(5, 6, 1), (1, 2)], 10)`, `16`),
          t.eq(`cheapest_cost([(4, 1, 1)], 8)`, `-1`),
          t.eq(`cheapest_cost([(4, 1, 2)], 8)`, `2`),
          t.eq(`cheapest_plan([(5, 6, 1), (1, 2)], 7)`, `[0, 1, 1]`),
          t.hidden(`cheapest_plan([(3, 1, 0), (1, 1)], 3)`, `[1, 1, 1]`),
          t.hidden(`cheapest_cost([(10, 5, 1), (5, 4, 1), (1, 1)], 16)`, `10`),
          planCheck('a stocked plan still adds up and costs the cheapest price', `[(5, 6, 1), (3, 2, 2), (1, 2)]`, 12, true),
          ...costOldTests,
        ],
      }),

      // ── Support Router (AI/FDE) ──
      code({
        id: 'lab-support-router-build',
        title: 'Support Router: build',
        ...lab,
        skills: ['dict_get', 'edge_cases', 'state_tracking'],
        minutes: 45,
        signature: 'lab:support-router',
        prompt: p([
          'You are building a support router. A model reads a customer message and proposes one tool call as JSON text. Your code decides whether it runs.',
          'The starter gives you the tools, the `TOOLS` registry and `fake_model(message, attempt)`. The fake model is deterministic and sometimes wrong. No network.',
          '',
          '1. `parse_action(text)` returns `{"tool": ..., "args": ...}` from the JSON text. Return `None` unless it is an object with a string `tool` and a dict `args`.',
          '2. `validate(action)` returns a list of problems. An unknown tool gives only `["unknown tool: NAME"]`.',
          '3. Otherwise check each registry argument in order: `"missing arg: NAME"` or `"bad type: NAME"`. Then add `"unexpected arg: NAME"` for extras, sorted. Use `type(x) is int`, so `True` is not an int.',
          '4. `needs_approval(action)` is `True` for `issue_refund` with an amount over `REFUND_APPROVAL_OVER`.',
          '5. `handle(message, model=fake_model, approve=None)` calls `model(message, attempt)` with attempt 0. If the reply is malformed, it retries once with attempt 1.',
          '6. Then it validates, asks `approve(action)` when approval is needed, and runs the tool. No approver means no.',
          '7. It returns `{"status": ..., "result": ..., "log": [...]}`. Status is `done`, `failed`, `invalid`, `denied` or `error` (the tool raised).',
          '8. The result is the tool\'s return value for `done`, the problem list for `invalid`, and `None` otherwise.',
          'The log records, in order: `model:0`, `malformed`, `model:1`, `proposed:TOOL`, `invalid`, `approved` or `denied`, `tool_error:ExceptionName`, `ran:TOOL`. Only the events that happen appear. The last entry is `status:STATUS`.',
          '',
          "Examples: `validate({'tool': 'lookup_order', 'args': {}})` → `['missing arg: order_id']`. `parse_action('not json')` → `None`.",
        ]),
        hints: [
          'Treat everything the model says as untrusted input: parse, then validate, then check permission, then run.',
          'json.loads raises ValueError on bad text. Catch only that, not everything.',
        ],
        starterCode: ROUTER_STARTER,
        solution: ROUTER_BUILD,
        tests: [
          t.eq(`parse_action('{"tool": "lookup_order", "args": {"order_id": "A1"}}')`, `{"tool": "lookup_order", "args": {"order_id": "A1"}}`),
          t.eq(`[parse_action("not json"), parse_action("[1, 2]"), parse_action('{"tool": "x"}')]`, `[None, None, None]`),
          t.eq(`validate({"tool": "delete_account", "args": {}})`, `["unknown tool: delete_account"]`),
          t.eq(`validate({"tool": "issue_refund", "args": {"amount": "50", "note": "hi"}})`, `["missing arg: order_id", "bad type: amount", "unexpected arg: note"]`),
          t.eq(`[needs_approval({"tool": "issue_refund", "args": {"order_id": "A2", "amount": 150}}), needs_approval({"tool": "issue_refund", "args": {"order_id": "A2", "amount": 100}})]`, `[True, False]`),
          t.eq(`handle("Where is A1?")`, `{"status": "done", "result": "shipped", "log": ["model:0", "proposed:lookup_order", "ran:lookup_order", "status:done"]}`),
          t.eq(`handle("Please refund 30 on A1")["result"]`, `"refunded 30 on A1"`),
          t.eq(`handle("Refund 150 on A2")`, `{"status": "denied", "result": None, "log": ["model:0", "proposed:issue_refund", "denied", "status:denied"]}`),
          t.eq(`handle("Refund 150 on A2", approve=lambda action: True)["log"]`, `["model:0", "proposed:issue_refund", "approved", "ran:issue_refund", "status:done"]`),
          t.eq(`handle("garbled question about A1")["log"]`, `["model:0", "malformed", "model:1", "proposed:lookup_order", "ran:lookup_order", "status:done"]`),
          t.hidden(`handle("broken")`, `{"status": "failed", "result": None, "log": ["model:0", "malformed", "model:1", "malformed", "status:failed"]}`),
          t.hidden(`handle("delete my account")["result"]`, `["unknown tool: delete_account"]`),
          t.hidden(`handle("Refund $50 on A1")["result"]`, `["bad type: amount"]`),
          t.hidden(`handle("Where is A9?")`, `{"status": "error", "result": None, "log": ["model:0", "proposed:lookup_order", "tool_error:KeyError", "status:error"]}`),
          t.check(
            'True is not an amount, and the approver sees the action',
            `assert validate({"tool": "issue_refund", "args": {"order_id": "A1", "amount": True}}) == ["bad type: amount"]
seen = []
out = handle("Refund 120 on A2", approve=lambda action: seen.append(action) or False)
assert seen == [{"tool": "issue_refund", "args": {"order_id": "A2", "amount": 120}}], seen
assert out["status"] == "denied"`,
            true,
          ),
        ],
      }),
      code({
        id: 'lab-support-router-change',
        title: 'Support Router: change request',
        ...lab,
        skills: ['dict_get', 'edge_cases'],
        minutes: 25,
        signature: 'lab:support-router-change',
        prompt: p([
          'Change request: the customer wants order cancellation, and a hard limit on refunds. The starter code is the working router.',
          '',
          '1. Add a tool `cancel_order(order_id)`. It raises `ValueError` if the order is `shipped`. Otherwise it returns `"cancelled " + order_id`.',
          '2. Register it in `TOOLS` with one `str` argument, `order_id`. The fake model already proposes it for messages that say "cancel".',
          '3. `cancel_order` always needs human approval.',
          '4. Add `REFUND_BLOCK_OVER = 500` and `is_blocked(action)`. It is `True` for a refund over that limit.',
          '5. In `handle`, check `is_blocked` right after validation. A blocked action never asks for approval and never runs.',
          '6. A blocked action logs `blocked` and returns status `blocked` with result `None`.',
          'Everything else must behave as before.',
          '',
          "Examples: `is_blocked({'tool': 'issue_refund', 'args': {'order_id': 'A2', 'amount': 600}})` → `True`. `needs_approval({'tool': 'cancel_order', 'args': {'order_id': 'A2'}})` → `True`.",
        ]),
        hints: ['Order matters: parse, validate, block, approve, run. A rule that can never be overridden goes before the human.'],
        starterCode: ROUTER_BUILD,
        solution: ROUTER_CHANGE,
        tests: [
          t.eq(`handle("Please cancel A2", approve=lambda action: True)`, `{"status": "done", "result": "cancelled A2", "log": ["model:0", "proposed:cancel_order", "approved", "ran:cancel_order", "status:done"]}`),
          t.eq(`handle("Please cancel A2")["status"]`, `"denied"`),
          t.eq(`handle("Please cancel A1", approve=lambda action: True)["log"]`, `["model:0", "proposed:cancel_order", "approved", "tool_error:ValueError", "status:error"]`),
          t.eq(`handle("Refund 600 on A2", approve=lambda action: True)`, `{"status": "blocked", "result": None, "log": ["model:0", "proposed:issue_refund", "blocked", "status:blocked"]}`),
          t.eq(`[is_blocked({"tool": "issue_refund", "args": {"order_id": "A2", "amount": 500}}), is_blocked({"tool": "lookup_order", "args": {"order_id": "A2"}})]`, `[False, False]`),
          t.check(
            'a blocked refund never reaches the approver',
            `calls = []
handle("Refund 900 on A2", approve=lambda action: calls.append(action) or True)
assert calls == [], "the approver should not be asked"`,
            true,
          ),
          t.hidden(`validate({"tool": "cancel_order", "args": {"order_id": 2}})`, `["bad type: order_id"]`),
          t.hidden(`handle("Refund 150 on A2", approve=lambda action: True)["result"]`, `"refunded 150 on A2"`),
          ...routerOldTests,
        ],
      }),

      // ── FDE Customer Workflow (AI/FDE) ──
      code({
        id: 'lab-fde-workflow-build',
        title: 'FDE Customer Workflow: build',
        ...lab,
        skills: ['dict_get', 'edge_cases', 'accumulator'],
        minutes: 45,
        signature: 'lab:fde-workflow',
        prompt: p([
          'A customer wants their intake emails routed to the right team. A model reads each email and returns the fields it found as JSON text.',
          'The starter gives you `fake_model(message)`, the customer\'s `CATEGORIES`, `QUEUES`, `REQUIRED` and a labelled set, `LABELLED`. The model is deterministic and sometimes wrong.',
          '',
          '1. `extract(text)` returns the dict in the JSON text. Return `None` if the text is not a JSON object.',
          '2. `validate(fields)` returns a list of problems. First `"missing: NAME"` for each required field that is absent or empty, in `REQUIRED` order.',
          '3. Then `"bad email"` if the email has no `@`, or no `.` after the `@`. Then `"unknown category: NAME"` for a category not in `CATEGORIES`.',
          '4. `route(fields)` returns `"manual_review"` if there are problems. Otherwise it returns `QUEUES[category]`, plus `"_urgent"` when `urgency` is `"high"`.',
          '5. `process(message, model=fake_model)` returns `{"queue": ..., "fields": ..., "errors": ...}`. Unreadable model text gives queue `"manual_review"`, fields `{}` and errors `["unparseable"]`.',
          '6. `evaluate(labelled, model=fake_model)` takes `(message, expected_queue)` pairs. It returns `{"accuracy": ..., "misses": ...}`.',
          '7. `accuracy` is the share routed correctly, rounded to 2 places. `misses` lists the positions routed wrongly. An empty set scores `0.0`.',
          '',
          "Examples: `route({'name': 'Ana', 'email': 'ana@shop.com', 'category': 'billing', 'urgency': 'high'})` → `'finance_urgent'`. `validate({'name': 'Ed', 'category': 'billing'})` → `['missing: email']`.",
        ]),
        hints: [
          'Never trust the model: every field it returns goes through validate before anything is routed.',
          'Pass the model in as an argument. Then a test can swap in a different fake.',
        ],
        starterCode: FDE_STARTER,
        solution: FDE_BUILD,
        tests: [
          t.eq(`extract('{"name": "Ana"}')`, `{"name": "Ana"}`),
          t.eq(`[extract("Sorry, I could not read that."), extract("[1, 2]")]`, `[None, None]`),
          t.eq(`validate({"name": "Ana", "email": "ana@shop.com", "category": "billing"})`, `[]`),
          t.eq(`validate({"name": "", "email": "ana@shop", "category": "legal"})`, `["missing: name", "bad email", "unknown category: legal"]`),
          t.eq(`route({"name": "Bo", "email": "bo@corp.io", "category": "technical", "urgency": "low"})`, `"support"`),
          t.eq(`process("From: Ana Lee <ana@shop.com> | My invoice is wrong")`, `{"queue": "finance", "fields": {"name": "Ana Lee", "email": "ana@shop.com", "category": "billing", "urgency": "low"}, "errors": []}`),
          t.eq(`process("From: Flo <flo@x.com> | ???")`, `{"queue": "manual_review", "fields": {}, "errors": ["unparseable"]}`),
          t.eq(`evaluate(LABELLED)`, `{"accuracy": 0.83, "misses": [3]}`),
          t.hidden(`evaluate([])`, `{"accuracy": 0.0, "misses": []}`),
          t.hidden(`process("From: Ed | Refund please")["errors"]`, `["missing: email"]`),
          t.hidden(`process("From: Gus <gus@web.org> | Someone hacked my account")["queue"]`, `"manual_review"`),
          t.hidden(`evaluate([("From: A <a@b.co> | demo", "sales"), ("From: B <b@c.co> | bug", "sales")], model=lambda m: '{"name": "X", "email": "x@y.z", "category": "sales"}')`, `{"accuracy": 1.0, "misses": []}`),
          t.hidden(`evaluate([("x", "finance"), ("y", "finance"), ("z", "manual_review")], model=lambda m: "nope")`, `{"accuracy": 0.33, "misses": [0, 1]}`),
        ],
      }),
      code({
        id: 'lab-fde-workflow-change',
        title: 'FDE Customer Workflow: change request',
        ...lab,
        skills: ['dict_get', 'edge_cases'],
        minutes: 25,
        signature: 'lab:fde-workflow-change',
        prompt: p([
          'Mid-build change from the customer: they have a new security team, and every ticket must now carry an account id. The starter code is the working workflow.',
          '',
          '1. Add the category `"security"`. It routes to the queue `"security"`.',
          '2. Security tickets are always urgent: they go to `"security_urgent"` whatever `urgency` says.',
          '3. Add `"account_id"` to the end of `REQUIRED`.',
          '4. An account id looks like `ACC-` followed by digits, like `ACC-77`. Any other value adds the problem `"bad account_id"` after the other checks.',
          '5. Replace `LABELLED` with the new labelled set from the customer:',
          "`('From: Ana Lee <ana@shop.com> | My invoice is wrong, ACC-12', 'finance')`, `('From: Gus <gus@web.org> | Someone hacked my account ACC-77', 'security_urgent')`, `('From: Hal <hal@corp.io> | I forgot my password', 'manual_review')`.",
          'Extraction, the unparseable case and `evaluate` must keep working.',
          '',
          "Examples: `route({'name': 'Gus', 'email': 'gus@web.org', 'category': 'security', 'urgency': 'low', 'account_id': 'ACC-77'})` → `'security_urgent'`. `validate({'name': 'Ana', 'email': 'ana@shop.com', 'category': 'billing', 'account_id': 'ACC-x'})` → `['bad account_id']`.",
        ]),
        hints: ['Most of this is configuration. Change the data first, then the one rule that is not data: security is always urgent.'],
        starterCode: FDE_BUILD,
        solution: FDE_CHANGE,
        tests: [
          t.eq(`route({"name": "Gus", "email": "gus@web.org", "category": "security", "urgency": "low", "account_id": "ACC-77"})`, `"security_urgent"`),
          t.eq(`validate({"name": "Ana", "email": "ana@shop.com", "category": "billing"})`, `["missing: account_id"]`),
          t.eq(`validate({"name": "Ana", "email": "ana@shop.com", "category": "billing", "account_id": "ACC-x"})`, `["bad account_id"]`),
          t.eq(`process("From: Gus <gus@web.org> | Someone hacked my account ACC-77")["queue"]`, `"security_urgent"`),
          t.eq(`process("From: Ana Lee <ana@shop.com> | My invoice is wrong")["queue"]`, `"manual_review"`),
          t.eq(`evaluate(LABELLED)`, `{"accuracy": 1.0, "misses": []}`),
          t.hidden(`validate({"email": "x", "category": "legal", "account_id": "12"})`, `["missing: name", "bad email", "unknown category: legal", "bad account_id"]`),
          t.hidden(`process("From: Bo <bo@corp.io> | The app shows an error on login, urgent ACC-5")["queue"]`, `"support_urgent"`),
          t.hidden(`process("From: Flo <flo@x.com> | ??? ACC-1")`, `{"queue": "manual_review", "fields": {}, "errors": ["unparseable"]}`),
          t.hidden(`evaluate([])`, `{"accuracy": 0.0, "misses": []}`),
          t.hidden(`len(LABELLED)`, `3`),
        ],
      }),
    ],
  },
]
