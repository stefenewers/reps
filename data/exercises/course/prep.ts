import type { Section } from '@/lib/types'
import { code, debug, t } from '@/data/exercises/build'

/**
 * Interview format prep: the take-home and live-round shapes that are not
 * LeetCode. API integration (fully offline: canned responses and a fake
 * `fetch`) and debugging a module you did not write.
 */

// ---------------------------------------------------------------------------
// API integration, offline
// ---------------------------------------------------------------------------

const PARSE_FIXTURE = `import json

# Canned responses: url -> (status_code, body_text). Nothing here touches the network.
RESPONSES = {
    "/users/1": (200, '{"id": 1, "name": "Ada", "email": "ada@example.com", "plan": "pro", "beta": true}'),
    "/users/2": (200, '{"id": 2, "name": "Grace", "plan": "free"}'),
    "/users/3": (500, '{"error": "internal"}'),
    "/users/4": (200, 'not json at all'),
}


def fetch(url):
    """A fake HTTP GET. Returns (status_code, body_text). Unknown urls are a 404."""
    return RESPONSES.get(url, (404, '{"error": "not found"}'))
`

const PAGINATE_FIXTURE = `import io
import json

# Canned responses: url -> (status_code, body_text). Nothing here touches the network.
RESPONSES = {
    "/orders?page=1": (200, '{"items": [{"id": 101, "total": 25.0, "status": "paid"}, {"id": 102, "total": 40.5, "status": "refunded"}], "next_page": 2}'),
    "/orders?page=2": (200, '{"items": [{"id": 103, "total": 12.25, "status": "paid"}], "next_page": 3}'),
    "/orders?page=3": (200, '{"items": [{"id": 104, "total": 8, "status": "paid"}], "next_page": null}'),
    "/empty?page=1": (200, '{"items": [], "next_page": null}'),
    "/flaky?page=1": (200, '{"items": [{"id": 201, "total": 5.0, "status": "paid"}], "next_page": 2}'),
    "/flaky?page=2": (503, '{"error": "try later"}'),
}


def fetch(url):
    """A fake HTTP GET. Returns (status_code, body_text). Unknown urls are a 404."""
    return RESPONSES.get(url, (404, '{"error": "not found"}'))
`

const CHAIN_FIXTURE = `import json

# Canned responses: url -> (status_code, body_text). Nothing here touches the network.
RESPONSES = {
    "/users/ada": (200, '{"id": 7, "name": "Ada"}'),
    "/users/7/orders": (200, '{"orders": [{"id": 1, "product_id": "p1", "qty": 2}, {"id": 2, "product_id": "p2", "qty": 1}, {"id": 5, "product_id": "p1", "qty": 1}]}'),
    "/users/bob": (200, '{"id": 8, "name": "Bob"}'),
    "/users/8/orders": (200, '{"orders": []}'),
    "/users/cy": (200, '{"id": 9, "name": "Cy"}'),
    "/users/9/orders": (200, '{"orders": [{"id": 3, "product_id": "p1", "qty": 1}, {"id": 4, "product_id": "gone", "qty": 5}]}'),
    "/users/dee": (200, '{"id": 10, "name": "Dee"}'),
    "/users/10/orders": (500, '{"error": "db down"}'),
    "/products/p1": (200, '{"id": "p1", "price": 3.5}'),
    "/products/p2": (200, '{"id": "p2", "price": 10.0}'),
}


def fetch(url):
    """A fake HTTP GET. Returns (status_code, body_text). Unknown urls are a 404."""
    return RESPONSES.get(url, (404, '{"error": "not found"}'))
`

const raises = (call: string, message: string) => `try:
    ${call}
    raised = None
except ValueError as exc:
    raised = str(exc)
assert raised == ${JSON.stringify(message)}, raised`

const api: Section = {
  id: 'prep-api',
  title: 'API integration, offline',
  summary: 'Request, parse, validate, handle errors, write a summary, chain a second call. A fake fetch stands in for the network.',
  exercises: [
    code({
      id: 'prep-api-parse',
      title: 'Fetch and validate a user',
      skills: ['dict_membership', 'functions', 'edge_cases'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      minutes: 15,
      prompt: `The starter has a fake HTTP client: \`fetch(url)\` returns \`(status_code, body_text)\` from a dict of canned responses, so this works offline. Leave the fixtures alone and write two functions.

\`get_user(user_id)\` requests \`/users/<user_id>\` and returns a dict with exactly the keys \`id\`, \`name\`, \`email\`, \`plan\` (drop any other fields). Raise \`ValueError\` with these messages:
- \`"HTTP <status>"\` when the status is not 200, e.g. \`"HTTP 500"\`
- \`"bad json"\` when the body is not valid JSON
- \`"missing <field>"\` for the first required field that is absent, checked in the order id, name, email, plan

\`load_users(ids)\` calls \`get_user\` for each id and returns \`(users, errors)\`: the good user dicts in order, and a dict mapping each failed id to its error message. One bad user must not stop the rest.`,
      starterCode: `${PARSE_FIXTURE}

def get_user(user_id):
    # request -> check status -> json.loads -> validate -> keep only the fields you need
    pass


def load_users(ids):
    pass
`,
      solution: `${PARSE_FIXTURE}
REQUIRED = ("id", "name", "email", "plan")


def get_user(user_id):
    status, body = fetch(f"/users/{user_id}")
    if status != 200:
        raise ValueError(f"HTTP {status}")
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise ValueError("bad json")
    for field in REQUIRED:
        if field not in data:
            raise ValueError(f"missing {field}")
    return {field: data[field] for field in REQUIRED}


def load_users(ids):
    users, errors = [], {}
    for user_id in ids:
        try:
            users.append(get_user(user_id))
        except ValueError as exc:
            errors[user_id] = str(exc)
    return users, errors
`,
      tests: [
        t.eq('get_user(1)', '{"id": 1, "name": "Ada", "email": "ada@example.com", "plan": "pro"}'),
        t.check('a 500 raises ValueError("HTTP 500")', raises('get_user(3)', 'HTTP 500')),
        t.check('a missing field raises ValueError("missing email")', raises('get_user(2)', 'missing email')),
        t.check('an unknown user raises ValueError("HTTP 404")', raises('get_user(99)', 'HTTP 404'), true),
        t.check('a body that is not JSON raises ValueError("bad json")', raises('get_user(4)', 'bad json'), true),
        t.hidden('load_users([1, 2, 3, 99])', '([{"id": 1, "name": "Ada", "email": "ada@example.com", "plan": "pro"}], {2: "missing email", 3: "HTTP 500", 99: "HTTP 404"})'),
        t.hidden('load_users([])', '([], {})'),
      ],
      hints: [
        'Treat every step as something that can fail: the status, the parse, the shape. Check them in that order and stop at the first failure.',
        '`status, body = fetch(url)`; if the status is not 200, raise. Then parse, then loop over the required field names.',
        '`json.loads` raises `json.JSONDecodeError` on bad input; catch it and raise your own `ValueError("bad json")`. In `load_users`, wrap each call in `try/except ValueError as exc` and store `str(exc)`.',
        'get_user: fetch → if status != 200 raise → try json.loads except raise "bad json" → for field in REQUIRED: if missing raise → return {f: data[f] for f in REQUIRED}. load_users: users, errors = [], {} → loop with try/except.',
      ],
      explanation: 'Validate in the order the data arrives: transport (status), format (JSON), then shape (fields). Turning each failure into one clear error type lets the caller (`load_users`) collect errors per item instead of crashing the whole batch, which is exactly what interviewers probe for.',
      signature: 'prep:api-parse',
    }),
    code({
      id: 'prep-api-paginate',
      title: 'Follow pages, write a report',
      skills: ['while_loop', 'accumulator', 'edge_cases'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      minutes: 20,
      prompt: `The starter has a fake paginated API. \`fetch(f"{base}?page={n}")\` returns \`(status_code, body_text)\`; each body is JSON like \`{"items": [...], "next_page": 2}\`, and \`next_page\` is \`null\` on the last page. Pages start at 1.

Write \`fetch_all(base)\` so it follows the pages and returns every item in order. On a non-200 page raise \`RuntimeError(f"page {n}: HTTP {status}")\`.

Write \`write_report(base, out)\` so it writes a report to \`out\`, a file-like object (the tests pass \`io.StringIO()\`, the same calls work on a real open file). Write one line per **paid** order, \`order <id>: <total>\` with the total to 2 decimals, then a final line \`paid total: <sum>\` (2 decimals). Every line ends with a newline. Return the number of paid orders.

If fetching fails, write only the line \`error: <message>\` and return 0, so a half-fetched report is never written.`,
      starterCode: `${PAGINATE_FIXTURE}

def fetch_all(base):
    pass


def write_report(base, out):
    pass
`,
      solution: `${PAGINATE_FIXTURE}

def fetch_all(base):
    items = []
    page = 1
    while page is not None:
        status, body = fetch(f"{base}?page={page}")
        if status != 200:
            raise RuntimeError(f"page {page}: HTTP {status}")
        data = json.loads(body)
        items.extend(data["items"])
        page = data["next_page"]
    return items


def write_report(base, out):
    try:
        orders = fetch_all(base)
    except RuntimeError as exc:
        out.write(f"error: {exc}\\n")
        return 0
    paid = [o for o in orders if o["status"] == "paid"]
    for order in paid:
        out.write(f"order {order['id']}: {order['total']:.2f}\\n")
    total = sum(o["total"] for o in paid)
    out.write(f"paid total: {total:.2f}\\n")
    return len(paid)
`,
      tests: [
        t.eq('[o["id"] for o in fetch_all("/orders")]', '[101, 102, 103, 104]'),
        t.check('write_report("/orders", out) writes the paid lines and the total', `out = io.StringIO()
n = write_report("/orders", out)
assert out.getvalue() == "order 101: 25.00\\norder 103: 12.25\\norder 104: 8.00\\npaid total: 45.25\\n", out.getvalue()
assert n == 3, n`),
        t.check('a failing page raises RuntimeError("page 2: HTTP 503")', `try:
    fetch_all("/flaky")
    raised = None
except RuntimeError as exc:
    raised = str(exc)
assert raised == "page 2: HTTP 503", raised`),
        t.check('a failing page writes only the error line', `out = io.StringIO()
n = write_report("/flaky", out)
assert out.getvalue() == "error: page 2: HTTP 503\\n", out.getvalue()
assert n == 0, n`, true),
        t.check('an empty feed still writes the total line', `out = io.StringIO()
n = write_report("/empty", out)
assert out.getvalue() == "paid total: 0.00\\n", out.getvalue()
assert n == 0, n`, true),
        t.hidden('fetch_all("/empty")', '[]'),
      ],
      hints: [
        'You do not know how many pages there are, so the loop is driven by the response itself: keep going while there is a next page.',
        '`page = 1`, then `while page is not None:` fetch, check the status, parse, collect the items, and set `page = data["next_page"]` (JSON `null` becomes `None`).',
        'Fetch everything first and only then write, so an error never leaves a partial report. Format with `f"{x:.2f}"` and write each line with a trailing newline via `out.write(...)`.',
        'fetch_all: items, page = [], 1 → while page is not None: status/body → raise on non-200 → items.extend → page = next_page. write_report: try fetch_all except RuntimeError → write error, return 0 → filter paid → write lines → write total → return count.',
      ],
      explanation: 'Pagination is a while loop whose stop condition comes from the server (`next_page`). Separating fetching from writing means a failure on page 2 produces one clean error line rather than a half-written file. Writing to a file-like `out` keeps the function testable with `io.StringIO`, and the same code works with `open(path, "w")`.',
      signature: 'prep:api-paginate',
    }),
    code({
      id: 'prep-api-chain',
      title: 'Chain calls: user → orders → products',
      skills: ['dict_lookup', 'dict_assign', 'dict_membership', 'edge_cases'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      minutes: 25,
      prompt: `The starter has a fake API with three endpoints, each answering \`(status_code, body_text)\` through \`fetch(url)\`:
- \`/users/<username>\` gives \`{"id": ..., "name": ...}\`
- \`/users/<id>/orders\` gives \`{"orders": [{"id", "product_id", "qty"}, ...]}\`
- \`/products/<product_id>\` gives \`{"id", "price"}\`

Write \`fetch_json(url)\` so it returns the parsed body on a 200, otherwise \`None\`.

Write \`spend_for(username)\`, which chains the calls, using the id from the first response to build the second url:
- unknown user (non-200): return \`None\`
- orders call fails: raise \`RuntimeError(f"orders for {user_id}: HTTP {status}")\`
- look up each product's price; if a product lookup fails, skip that order and record its order id in \`skipped\`
- fetch each distinct product **at most once**, even if several orders share it

Return \`{"name": ..., "orders": <number of orders>, "total": <sum of price * qty, rounded to 2>, "skipped": [order ids]}\`.`,
      starterCode: `${CHAIN_FIXTURE}

def fetch_json(url):
    pass


def spend_for(username):
    pass
`,
      solution: `${CHAIN_FIXTURE}

def fetch_json(url):
    status, body = fetch(url)
    if status != 200:
        return None
    return json.loads(body)


def spend_for(username):
    user = fetch_json(f"/users/{username}")
    if user is None:
        return None
    user_id = user["id"]
    status, body = fetch(f"/users/{user_id}/orders")
    if status != 200:
        raise RuntimeError(f"orders for {user_id}: HTTP {status}")
    orders = json.loads(body)["orders"]

    prices = {}  # product_id -> price, or None if the lookup failed
    total = 0
    skipped = []
    for order in orders:
        pid = order["product_id"]
        if pid not in prices:
            product = fetch_json(f"/products/{pid}")
            prices[pid] = None if product is None else product["price"]
        if prices[pid] is None:
            skipped.append(order["id"])
            continue
        total += prices[pid] * order["qty"]
    return {"name": user["name"], "orders": len(orders), "total": round(total, 2), "skipped": skipped}
`,
      tests: [
        t.eq('spend_for("ada")', '{"name": "Ada", "orders": 3, "total": 20.5, "skipped": []}'),
        t.eq('spend_for("nobody")', 'None'),
        t.check('a failed orders call raises RuntimeError("orders for 10: HTTP 500")', `try:
    spend_for("dee")
    raised = None
except RuntimeError as exc:
    raised = str(exc)
assert raised == "orders for 10: HTTP 500", raised`),
        t.hidden('spend_for("cy")', '{"name": "Cy", "orders": 2, "total": 3.5, "skipped": [4]}'),
        t.hidden('spend_for("bob")', '{"name": "Bob", "orders": 0, "total": 0, "skipped": []}'),
        t.hidden('fetch_json("/products/p2")', '{"id": "p2", "price": 10.0}'),
        t.hidden('fetch_json("/products/gone")', 'None'),
        t.check('each product is fetched at most once', `calls = []
real_fetch = fetch
def counting_fetch(url):
    calls.append(url)
    return real_fetch(url)
fetch = counting_fetch
try:
    spend_for("ada")
finally:
    fetch = real_fetch
assert calls.count("/products/p1") == 1, calls`, true),
      ],
      hints: [
        'The second request depends on the first: you cannot build the orders url until you have read the user id out of the user response.',
        'Write `fetch_json` first and use it for the user and product calls. Call `fetch` directly for orders, because that error needs the status code in its message.',
        'Keep a dict `prices` from product id to price (or `None` when the lookup failed). Check `if pid not in prices` before fetching, so a shared product costs one request.',
        'user = fetch_json → None? return None → status/body for orders → raise on non-200 → loop orders: fill prices cache → None? skipped.append, continue → total += price * qty → return the dict with round(total, 2).',
      ],
      explanation: 'Chained calls are the heart of most API take-homes: read a field from one response, use it to build the next request, and decide per step whether a failure is fatal (orders) or local (one product). The cache is the usual follow-up question: repeated lookups of the same resource should cost one request.',
      signature: 'prep:api-chain',
    }),
  ],
}

// ---------------------------------------------------------------------------
// Debug an unfamiliar module
// ---------------------------------------------------------------------------

const INVENTORY_FIXED = `class Inventory:
    """Stock for a small shop. Reserved units are held for open carts."""

    def __init__(self):
        self.stock = {}     # sku -> units on the shelf
        self.reserved = {}  # sku -> units held for carts

    def add(self, sku, qty):
        if qty <= 0:
            raise ValueError("qty must be positive")
        self.stock[sku] = self.stock.get(sku, 0) + qty

    def available(self, sku):
        """Units that can still be reserved."""
        return self.stock.get(sku, 0) - self.reserved.get(sku, 0)

    def reserve(self, sku, qty):
        """Hold qty units for a cart. Returns False if there are not enough."""
        if qty > self.available(sku):
            return False
        self.reserved[sku] = self.reserved.get(sku, 0) + qty
        return True

    def release(self, sku, qty):
        """A cart was abandoned: let go of its held units."""
        held = self.reserved.get(sku, 0)
        self.reserved[sku] = max(0, held - qty)

    def ship(self, sku, qty):
        """Ship qty reserved units: they leave the shelf and the hold."""
        if qty > self.reserved.get(sku, 0):
            raise ValueError("not reserved")
        self.stock[sku] -= qty
        self.reserved[sku] -= qty

    def low_stock(self, threshold):
        """SKUs whose available count is at or below threshold, sorted."""
        return sorted(sku for sku in self.stock if self.available(sku) <= threshold)
`

const SCHEDULER_FIXED = `def to_minutes(hhmm):
    hours, minutes = hhmm.split(":")
    return int(hours) * 60 + int(minutes)


def fmt(total):
    return f"{total // 60:02d}:{total % 60:02d}"


def overlaps(a, b):
    """Half-open intervals [start, end): a meeting may start when another ends."""
    return a[0] < b[1] and b[0] < a[1]


class Scheduler:
    """One meeting room, one day."""

    def __init__(self, open_at="09:00", close_at="17:00"):
        self.open = to_minutes(open_at)
        self.close = to_minutes(close_at)
        self.bookings = []  # (start, end, who), kept sorted by start

    def book(self, who, start, end):
        s, e = to_minutes(start), to_minutes(end)
        if s >= e or s < self.open or e > self.close:
            return False
        for booking in self.bookings:
            if overlaps((s, e), booking):
                return False
        self.bookings.append((s, e, who))
        self.bookings.sort()
        return True

    def free_slots(self, min_length=30):
        """Gaps of at least min_length minutes, as ("HH:MM", "HH:MM") pairs in order."""
        out = []
        cursor = self.open
        for s, e, _ in self.bookings:
            if s - cursor >= min_length:
                out.append((fmt(cursor), fmt(s)))
            cursor = e
        if self.close - cursor >= min_length:
            out.append((fmt(cursor), fmt(self.close)))
        return out
`

const PARSER_FIXED = `def convert(value):
    """'true'/'false' (any case) become bools, all digits become an int, anything else stays a string."""
    if value.lower() in ("true", "false"):
        return value.lower() == "true"
    if value.isdigit():
        return int(value)
    return value


def parse_config(text):
    """Parse an INI-style config into {section: {key: value}}.

    - blank lines and lines starting with '#' are ignored
    - keys before any [section] go under "default"
    - each setting is 'key = value'; the value may itself contain '='
    - a later duplicate key overwrites the earlier one
    - a line without '=' raises ValueError("line N: expected key = value"), N counted from 1
    """
    result = {"default": {}}
    section = "default"
    for n, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            section = line[1:-1].strip()
            result.setdefault(section, {})
            continue
        if "=" not in line:
            raise ValueError(f"line {n}: expected key = value")
        key, value = line.split("=", 1)
        result[section][key.strip()] = convert(value.strip())
    return result
`

/** Applies a bug to working code, failing loudly if the snippet is not found (so a starter can never silently equal its solution). */
function breakCode(src: string, ...swaps: [string, string][]): string {
  let out = src
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`prep: bug snippet not found: ${from}`)
    out = out.replace(from, to)
  }
  return out
}

const debugSection: Section = {
  id: 'prep-debug',
  title: 'Debug an unfamiliar module',
  summary: 'A realistic module you did not write, two subtle bugs, failing tests. Read before you change anything.',
  exercises: [
    debug({
      id: 'prep-debug-inventory',
      title: 'Debug: shop inventory',
      skills: ['dict_get', 'conditionals', 'edge_cases'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      minutes: 15,
      prompt: `This \`Inventory\` class tracks shelf stock and units held for open carts. The docstrings describe the intended behaviour. Customers report two problems: the last unit of an item can never be bought, and after shipping, the shop shows fewer units available than it really has.

Read the module, find both bugs, and make the tests pass. Change as little as you can.`,
      brokenCode: breakCode(
        INVENTORY_FIXED,
        ['if qty > self.available(sku):', 'if qty >= self.available(sku):'],
        ['        self.stock[sku] -= qty\n        self.reserved[sku] -= qty\n', '        self.stock[sku] -= qty\n'],
      ),
      solution: INVENTORY_FIXED,
      tests: [
        t.check('reserving every unit on the shelf succeeds', `inv = Inventory()
inv.add("mug", 5)
assert inv.reserve("mug", 5) is True
assert inv.available("mug") == 0, inv.available("mug")`),
        t.check('reserving more than is available fails', `inv = Inventory()
inv.add("mug", 2)
assert inv.reserve("mug", 3) is False
assert inv.available("mug") == 2`),
        t.check('shipping reserved units frees the hold', `inv = Inventory()
inv.add("mug", 5)
inv.reserve("mug", 2)
inv.ship("mug", 2)
assert inv.stock["mug"] == 3, inv.stock
assert inv.available("mug") == 3, inv.available("mug")`),
        t.check('release, ship and low_stock together', `inv = Inventory()
inv.add("a", 4)
inv.add("b", 10)
inv.reserve("a", 3)
inv.release("a", 1)
inv.ship("a", 2)
assert inv.available("a") == 2, inv.available("a")
assert inv.low_stock(2) == ["a"], inv.low_stock(2)`, true),
        t.check('shipping more than reserved raises', `inv = Inventory()
inv.add("a", 4)
inv.reserve("a", 1)
try:
    inv.ship("a", 2)
    ok = False
except ValueError:
    ok = True
assert ok`, true),
      ],
      hints: [
        'Run the tests and read the failures before reading the whole file. Each failing test points at one method; the docstrings say what that method should do.',
        'Two invariants: `available = stock - reserved`, and a reservation should succeed when you ask for exactly what is available. Check each method against them.',
        'Look at the comparison in `reserve` with qty equal to available. Then trace `ship`: which of the two dicts does it update, and which should it update?',
        'Fix 1: `reserve` should refuse only when `qty > available`. Fix 2: `ship` must subtract from `self.reserved[sku]` as well as `self.stock[sku]`.',
      ],
      explanation: 'Bug 1 was a boundary: `>=` refused a request for exactly the available amount, so the last unit was unsellable. Bug 2 was a missing state update: shipping took units off the shelf but left the hold in place, so they were subtracted twice from `available`. Both are found faster by stating the invariant (available = stock − reserved) than by reading line by line.',
      signature: 'prep:debug-inventory',
    }),
    debug({
      id: 'prep-debug-scheduler',
      title: 'Debug: meeting room scheduler',
      skills: ['interval_overlap', 'sorting', 'string_methods'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      minutes: 20,
      prompt: `This module books one meeting room for one day. Times are \`"HH:MM"\` strings; a booking runs from its start up to (not including) its end, so a 10:00–11:00 meeting and an 11:00–12:00 meeting do not clash. \`free_slots\` lists the gaps of at least \`min_length\` minutes between opening and closing, in time order.

Users say back-to-back meetings are rejected, and that the free-slot list is sometimes nonsense. Find the two bugs and make the tests pass.`,
      brokenCode: breakCode(
        SCHEDULER_FIXED,
        ['return a[0] < b[1] and b[0] < a[1]', 'return a[0] <= b[1] and b[0] <= a[1]'],
        ['        self.bookings.sort()\n', ''],
      ),
      solution: SCHEDULER_FIXED,
      tests: [
        t.check('back-to-back meetings are allowed', `s = Scheduler()
assert s.book("ana", "10:00", "11:00") is True
assert s.book("ben", "11:00", "12:00") is True`),
        t.check('a real overlap is rejected', `s = Scheduler()
assert s.book("ana", "10:00", "11:00") is True
assert s.book("ben", "10:30", "11:30") is False`),
        t.check('free slots come out in order when bookings are made out of order', `s = Scheduler()
s.book("ana", "14:00", "15:00")
s.book("ben", "09:30", "10:00")
assert s.free_slots() == [("09:00", "09:30"), ("10:00", "14:00"), ("15:00", "17:00")], s.free_slots()`),
        t.check('outside opening hours or empty bookings are rejected', `s = Scheduler()
assert s.book("ana", "08:30", "09:30") is False
assert s.book("ana", "16:30", "17:30") is False
assert s.book("ana", "12:00", "12:00") is False`, true),
        t.check('gaps shorter than min_length are left out', `s = Scheduler()
s.book("ana", "12:00", "13:00")
s.book("ben", "09:00", "09:15")
s.book("cy", "09:30", "11:40")
assert s.free_slots(20) == [("11:40", "12:00"), ("13:00", "17:00")], s.free_slots(20)
assert s.free_slots(30) == [("13:00", "17:00")], s.free_slots(30)`, true),
        t.eq('Scheduler().free_slots()', '[("09:00", "17:00")]', { hidden: true }),
      ],
      hints: [
        'Start with the docstrings and comments: "half-open" and "kept sorted by start" are both promises. Test each one against the code.',
        'Two places to check: the comparison in `overlaps` (what happens when one meeting ends exactly when the next starts?), and what `free_slots` assumes about the order of `self.bookings`.',
        'With `[10:00, 11:00)` and `[11:00, 12:00)`, is `11:00 <= 11:00`? It should not count as a clash. And `free_slots` walks a cursor forward, which only works if bookings are in start order; does anything keep them that way?',
        'Fix 1: use strict `<` on both sides in `overlaps`. Fix 2: sort `self.bookings` after appending in `book` (tuples sort by start first).',
      ],
      explanation: 'Bug 1 is the classic closed vs half-open interval slip: `<=` made touching meetings overlap. Bug 2 is a broken invariant: the comment said the list stays sorted, `free_slots` relied on it, but nothing sorted it, so bookings made out of order produced wrong gaps. When a function relies on an invariant, find the code that maintains it.',
      signature: 'prep:debug-scheduler',
    }),
    debug({
      id: 'prep-debug-parser',
      title: 'Debug: config file parser',
      skills: ['string_methods', 'enumerate', 'edge_cases'],
      stage: 'combine',
      repType: 'combine',
      difficulty: 3,
      minutes: 15,
      prompt: `\`parse_config\` reads an INI-style config into a dict of sections. The docstring is the spec. Two bug reports came in: a database url like \`url = postgres://h/db?ssl=true\` crashes the parser, and the error message for a malformed line points at the wrong line number.

Find both bugs and make the tests pass.`,
      brokenCode: breakCode(
        PARSER_FIXED,
        ['enumerate(text.splitlines(), start=1)', 'enumerate(text.splitlines())'],
        ['line.split("=", 1)', 'line.split("=")'],
      ),
      solution: PARSER_FIXED,
      tests: [
        t.eq('parse_config("[db]\\nurl = postgres://h/db?ssl=true")', '{"default": {}, "db": {"url": "postgres://h/db?ssl=true"}}'),
        t.check('a malformed line reports its 1-based line number', `try:
    parse_config("name = app\\njust some words")
    raised = None
except ValueError as exc:
    raised = str(exc)
assert raised == "line 2: expected key = value", raised`),
        t.eq('parse_config("# app\\ndebug = TRUE\\n\\n[server]\\nport = 8080\\nhost = example.com")', '{"default": {"debug": True}, "server": {"port": 8080, "host": "example.com"}}'),
        t.hidden('parse_config("a = 1\\na = 2")', '{"default": {"a": 2}}'),
        t.hidden('parse_config("")', '{"default": {}}'),
        t.check('the line number counts blank and comment lines too', `try:
    parse_config("# top\\n\\n[x]\\nbroken")
    raised = None
except ValueError as exc:
    raised = str(exc)
assert raised == "line 4: expected key = value", raised`, true),
      ],
      hints: [
        'Reproduce each bug report with a one-line input before reading the loop. The traceback for the url case tells you which line breaks.',
        'One bug is in how a line is split into key and value; the other is in how lines are counted.',
        '`"a=b=c".split("=")` gives three parts, so unpacking into two names fails. `split` takes a second argument that limits how many splits it makes. `enumerate` counts from 0 unless told otherwise.',
        'Fix 1: `line.split("=", 1)`. Fix 2: `enumerate(text.splitlines(), start=1)`.',
      ],
      explanation: 'Splitting on the first separator only (`split("=", 1)`) is the standard fix whenever the value may contain the separator: urls, base64, query strings. Line numbers for humans are 1-based, while `enumerate` starts at 0; `start=1` fixes it without touching the arithmetic elsewhere.',
      signature: 'prep:debug-parser',
    }),
  ],
}

export const sections: Section[] = [api, debugSection]
