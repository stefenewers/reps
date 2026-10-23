import type { Section } from '@/lib/types'
import { code, t } from '@/data/exercises/build'

/**
 * Reps 2.0 labs, Weeks 3–8 (REPS_2_MASTER_SPEC.md §9 "Mini Lab", §17, §48).
 * Each lab is a build (`<lab id>-build`) plus a change request (`<lab id>-change`)
 * whose starter code is the reference build. Lab content lives in
 * data/course/content/labs-w3w8.ts. Labs are done / not done; never daily reps.
 */

const lab = { stage: 'combine' as const, repType: 'combine' as const, lab: true, difficulty: 3 as const }
const lines = (...xs: string[]) => xs.join('\n')

// ── Week 3: Trend Analyzer ──────────────────────────────────────────────────

const TREND_STARTER = `def running_best(values):
    """Return a list where item i is the highest value from day 0 to day i."""
    pass


def running_worst(values):
    """Return a list where item i is the lowest value from day 0 to day i."""
    pass


def longest_rise(values):
    """Return the length of the longest streak of days that each beat the day before."""
    pass


def prefix_totals(values):
    """Return [0, v0, v0 + v1, ...]: one more item than values."""
    pass


def range_totals(values, queries):
    """queries is a list of (start, end) day pairs, both ends included.
    Return the total for each query, in order."""
    pass
`

const TREND_BUILD = `def running_best(values):
    """Return a list where item i is the highest value from day 0 to day i."""
    out = []
    best = None
    for v in values:
        if best is None or v > best:
            best = v
        out.append(best)
    return out


def running_worst(values):
    """Return a list where item i is the lowest value from day 0 to day i."""
    out = []
    worst = None
    for v in values:
        if worst is None or v < worst:
            worst = v
        out.append(worst)
    return out


def longest_rise(values):
    """Return the length of the longest streak of days that each beat the day before."""
    if not values:
        return 0
    best = 1
    run = 1
    for i in range(1, len(values)):
        if values[i] > values[i - 1]:
            run += 1
        else:
            run = 1
        best = max(best, run)
    return best


def prefix_totals(values):
    """Return [0, v0, v0 + v1, ...]: one more item than values."""
    out = [0]
    for v in values:
        out.append(out[-1] + v)
    return out


def range_totals(values, queries):
    """queries is a list of (start, end) day pairs, both ends included.
    Return the total for each query, in order."""
    prefix = prefix_totals(values)
    return [prefix[end + 1] - prefix[start] for start, end in queries]
`

const TREND_CHANGE = `def running_best(values):
    """Return a list where item i is the highest reading from day 0 to day i."""
    out = []
    best = None
    for v in values:
        if v is not None and (best is None or v > best):
            best = v
        out.append(best)
    return out


def running_worst(values):
    """Return a list where item i is the lowest reading from day 0 to day i."""
    out = []
    worst = None
    for v in values:
        if v is not None and (worst is None or v < worst):
            worst = v
        out.append(worst)
    return out


def longest_rise(values):
    """Return the length of the longest streak of days that each beat the day before.
    A missing day (None) ends a streak."""
    best = 0
    run = 0
    prev = None
    for v in values:
        if v is None:
            run = 0
        elif prev is not None and v > prev:
            run += 1
        else:
            run = 1
        prev = v
        best = max(best, run)
    return best


def prefix_totals(values):
    """Return [0, v0, v0 + v1, ...]. A missing day counts as 0."""
    out = [0]
    for v in values:
        out.append(out[-1] + (0 if v is None else v))
    return out


def range_totals(values, queries):
    """queries is a list of (start, end) day pairs, both ends included.
    Return the total for each query, in order."""
    prefix = prefix_totals(values)
    return [prefix[end + 1] - prefix[start] for start, end in queries]
`

// ── Week 3: Sorted Match Engine ─────────────────────────────────────────────

const MATCH_STARTER = `def merge_prices(a, b):
    """a and b are sorted low to high. Return one sorted list with every price from both."""
    pass


def shared_prices(a, b):
    """a and b are sorted low to high. Return the prices found in both, each once, low to high."""
    pass


def match_orders(buys, sells):
    """buys and sells are sorted low to high. Return the (buy, sell) pairs the engine makes."""
    pass
`

const MATCH_BUILD = `def merge_prices(a, b):
    """a and b are sorted low to high. Return one sorted list with every price from both."""
    i = 0
    j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out


def shared_prices(a, b):
    """a and b are sorted low to high. Return the prices found in both, each once, low to high."""
    i = 0
    j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            if not out or out[-1] != a[i]:
                out.append(a[i])
            i += 1
            j += 1
        elif a[i] < b[j]:
            i += 1
        else:
            j += 1
    return out


def match_orders(buys, sells):
    """buys and sells are sorted low to high. Return the (buy, sell) pairs the engine makes."""
    i = 0
    j = 0
    out = []
    while i < len(buys) and j < len(sells):
        if sells[j] <= buys[i]:
            out.append((buys[i], sells[j]))
            i += 1
            j += 1
        else:
            i += 1
    return out
`

const MATCH_CHANGE = MATCH_BUILD + `

def fill_orders(buys, sells):
    """buys and sells are (price, quantity) pairs sorted by price, low to high.
    Return the (buy price, sell price, quantity) fills, in the order they happen."""
    buy_left = [q for _, q in buys]
    sell_left = [q for _, q in sells]
    i = 0
    j = 0
    out = []
    while i < len(buys) and j < len(sells):
        if buy_left[i] == 0:
            i += 1
        elif sell_left[j] == 0:
            j += 1
        elif sells[j][0] <= buys[i][0]:
            qty = min(buy_left[i], sell_left[j])
            out.append((buys[i][0], sells[j][0], qty))
            buy_left[i] -= qty
            sell_left[j] -= qty
        else:
            i += 1
    return out


def total_filled(buys, sells):
    """Return the total quantity that fill_orders trades."""
    return sum(qty for _, _, qty in fill_orders(buys, sells))
`

// ── Week 4: Activity Window Analyzer ────────────────────────────────────────

const ACTIVITY_STARTER = `def per_minute(times, n):
    """Return a list of n counts: item m is how many events happened in minute m."""
    pass


def busiest_window(counts, k):
    """Return (start, total) for the k-minute stretch with the most events."""
    pass


def longest_quiet(counts, limit):
    """Return the length of the longest stretch of minutes with at most limit events in total."""
    pass
`

const ACTIVITY_BUILD = `def per_minute(times, n):
    """Return a list of n counts: item m is how many events happened in minute m."""
    counts = [0] * n
    for t in times:
        if 0 <= t < n:
            counts[t] += 1
    return counts


def busiest_window(counts, k):
    """Return (start, total) for the k-minute stretch with the most events."""
    total = sum(counts[:k])
    best = (0, total)
    for right in range(k, len(counts)):
        total += counts[right] - counts[right - k]
        if total > best[1]:
            best = (right - k + 1, total)
    return best


def longest_quiet(counts, limit):
    """Return the length of the longest stretch of minutes with at most limit events in total."""
    left = 0
    total = 0
    best = 0
    for right in range(len(counts)):
        total += counts[right]
        while total > limit:
            total -= counts[left]
            left += 1
        best = max(best, right - left + 1)
    return best
`

const ACTIVITY_CHANGE = `def per_minute(events, n):
    """events holds minutes, or (minute, user) pairs.
    Return a list of n counts: item m is how many events happened in minute m."""
    counts = [0] * n
    for e in events:
        m = e[0] if isinstance(e, tuple) else e
        if 0 <= m < n:
            counts[m] += 1
    return counts


def busiest_window(counts, k):
    """Return (start, total) for the k-minute stretch with the most events."""
    total = sum(counts[:k])
    best = (0, total)
    for right in range(k, len(counts)):
        total += counts[right] - counts[right - k]
        if total > best[1]:
            best = (right - k + 1, total)
    return best


def longest_quiet(counts, limit):
    """Return the length of the longest stretch of minutes with at most limit events in total."""
    left = 0
    total = 0
    best = 0
    for right in range(len(counts)):
        total += counts[right]
        while total > limit:
            total -= counts[left]
            left += 1
        best = max(best, right - left + 1)
    return best


def busiest_unique(events, k):
    """events is a list of (minute, user) pairs sorted by minute.
    Return the most different users seen in any k-minute stretch."""
    users = {}
    left = 0
    best = 0
    for minute, user in events:
        users[user] = users.get(user, 0) + 1
        while events[left][0] <= minute - k:
            old = events[left][1]
            users[old] -= 1
            if users[old] == 0:
                del users[old]
            left += 1
        best = max(best, len(users))
    return best
`

// ── Week 4: Editor Undo/Redo Engine ─────────────────────────────────────────

const EDITOR_STARTER = `def apply(text, command):
    """Return the text after one 'type ...' or 'delete n' command."""
    pass


def snapshots(commands):
    """Run the commands from an empty document.
    Return the text after each command, in order."""
    pass


def run_editor(commands):
    """Run the commands from an empty document. Return the final text."""
    pass
`

const EDITOR_BUILD = `def apply(text, command):
    """Return the text after one 'type ...' or 'delete n' command."""
    action, _, arg = command.partition(' ')
    if action == 'type':
        return text + arg
    if action == 'delete':
        return text[:max(0, len(text) - int(arg))]
    return text


def snapshots(commands):
    """Run the commands from an empty document.
    Return the text after each command, in order."""
    text = ''
    undo = []
    redo = []
    out = []
    for command in commands:
        if command == 'undo':
            if undo:
                redo.append(text)
                text = undo.pop()
        elif command == 'redo':
            if redo:
                undo.append(text)
                text = redo.pop()
        else:
            undo.append(text)
            redo.clear()
            text = apply(text, command)
        out.append(text)
    return out


def run_editor(commands):
    """Run the commands from an empty document. Return the final text."""
    history = snapshots(commands)
    return history[-1] if history else ''
`

const EDITOR_CHANGE = `def apply(text, command):
    """Return the text after one 'type ...', 'delete n' or 'clear' command."""
    action, _, arg = command.partition(' ')
    if action == 'type':
        return text + arg
    if action == 'delete':
        return text[:max(0, len(text) - int(arg))]
    if action == 'clear':
        return ''
    return text


def snapshots(commands):
    """Run the commands from an empty document.
    Return the text after each command, in order."""
    text = ''
    undo = []
    redo = []
    out = []
    for command in commands:
        action, _, arg = command.partition(' ')
        if action in ('undo', 'redo'):
            times = int(arg) if arg else 1
            src, dst = (undo, redo) if action == 'undo' else (redo, undo)
            for _ in range(times):
                if not src:
                    break
                dst.append(text)
                text = src.pop()
        else:
            undo.append(text)
            redo.clear()
            text = apply(text, command)
        out.append(text)
    return out


def run_editor(commands):
    """Run the commands from an empty document. Return the final text."""
    history = snapshots(commands)
    return history[-1] if history else ''
`

// ── Week 5: Searchable Product Catalog ──────────────────────────────────────

const CATALOG_STARTER = `def first_at_least(products, budget):
    """products is a list of (price, name) sorted by price.
    Return the index of the first product priced at or above budget, or len(products)."""
    pass


def last_at_most(products, budget):
    """Return the index of the last product priced at or below budget, or -1."""
    pass


def count_in_range(products, low, high):
    """Return how many products cost from low to high, both ends included."""
    pass


def affordable(products, budget):
    """Return the names of the products priced at or below budget, cheapest first."""
    pass
`

const CATALOG_BUILD = `def first_at_least(products, budget):
    """products is a list of (price, name) sorted by price.
    Return the index of the first product priced at or above budget, or len(products)."""
    lo, hi = 0, len(products)
    while lo < hi:
        mid = (lo + hi) // 2
        if products[mid][0] >= budget:
            hi = mid
        else:
            lo = mid + 1
    return lo


def first_above(products, price):
    """Return the index of the first product priced above price, or len(products)."""
    lo, hi = 0, len(products)
    while lo < hi:
        mid = (lo + hi) // 2
        if products[mid][0] > price:
            hi = mid
        else:
            lo = mid + 1
    return lo


def last_at_most(products, budget):
    """Return the index of the last product priced at or below budget, or -1."""
    return first_above(products, budget) - 1


def count_in_range(products, low, high):
    """Return how many products cost from low to high, both ends included."""
    if low > high:
        return 0
    return first_above(products, high) - first_at_least(products, low)


def affordable(products, budget):
    """Return the names of the products priced at or below budget, cheapest first."""
    return [name for _, name in products[:first_above(products, budget)]]
`

const CATALOG_CHANGE = CATALOG_BUILD + `

def add_product(products, price, name):
    """Insert (price, name) into products in place, after any product with the same price.
    Return the index where it went."""
    i = first_above(products, price)
    products.insert(i, (price, name))
    return i


def cheapest_at_least(products, budget):
    """Return the name of the cheapest product priced at or above budget, or None."""
    i = first_at_least(products, budget)
    return products[i][1] if i < len(products) else None
`

// ── Week 5: Playlist Editor ─────────────────────────────────────────────────

const PLAYLIST_STARTER = `# ListNode(val, next) is provided. Each node's val is a song title.


def add_song(head, title):
    """Add a song to the end. Return the head."""
    pass


def remove_song(head, title):
    """Remove the first song with this title. Return the head."""
    pass


def position_of(head, title):
    """Return the 1-based position of the first song with this title, or -1."""
    pass


def reverse_range(head, left, right):
    """Reverse the songs from position left to position right (1-based, both included).
    Return the head."""
    pass
`

const PLAYLIST_BUILD = `# ListNode(val, next) is provided. Each node's val is a song title.


def add_song(head, title):
    """Add a song to the end. Return the head."""
    node = ListNode(title)
    if head is None:
        return node
    cur = head
    while cur.next is not None:
        cur = cur.next
    cur.next = node
    return head


def remove_song(head, title):
    """Remove the first song with this title. Return the head."""
    dummy = ListNode(None, head)
    prev = dummy
    while prev.next is not None:
        if prev.next.val == title:
            prev.next = prev.next.next
            break
        prev = prev.next
    return dummy.next


def position_of(head, title):
    """Return the 1-based position of the first song with this title, or -1."""
    pos = 1
    cur = head
    while cur is not None:
        if cur.val == title:
            return pos
        pos += 1
        cur = cur.next
    return -1


def reverse_range(head, left, right):
    """Reverse the songs from position left to position right (1-based, both included).
    Return the head."""
    dummy = ListNode(None, head)
    before = dummy
    for _ in range(left - 1):
        if before.next is None:
            return head
        before = before.next
    first = before.next
    if first is None:
        return head
    prev = None
    cur = first
    count = 0
    while cur is not None and count < right - left + 1:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
        count += 1
    before.next = prev
    first.next = cur
    return dummy.next
`

const PLAYLIST_CHANGE = PLAYLIST_BUILD + `

def move_song(head, title, position):
    """Move the first song with this title so it becomes song number position (1-based).
    Return the head."""
    dummy = ListNode(None, head)
    prev = dummy
    while prev.next is not None and prev.next.val != title:
        prev = prev.next
    if prev.next is None:
        return head
    node = prev.next
    prev.next = node.next
    spot = dummy
    for _ in range(position - 1):
        if spot.next is None:
            break
        spot = spot.next
    node.next = spot.next
    spot.next = node
    return dummy.next
`

// ── Week 6: Route Walker ────────────────────────────────────────────────────

const ROUTE_STARTER = `def route(next_stop, start):
    """Return the stops in order from start.
    Stop at the end of the line, or just before a stop would repeat."""
    pass


def has_loop(next_stop, start):
    """Return True if following next stops from start goes round forever."""
    pass


def middle_stop(next_stop, start):
    """The route from start has no loop. Return its middle stop."""
    pass


def last_stop(next_stop, start):
    """Return the final stop of the route, or None if the route loops."""
    pass
`

const ROUTE_BUILD = `def route(next_stop, start):
    """Return the stops in order from start.
    Stop at the end of the line, or just before a stop would repeat."""
    seen = set()
    out = []
    stop = start
    while stop is not None and stop not in seen:
        seen.add(stop)
        out.append(stop)
        stop = next_stop.get(stop)
    return out


def has_loop(next_stop, start):
    """Return True if following next stops from start goes round forever."""
    slow = start
    fast = start
    while fast is not None and next_stop.get(fast) is not None:
        slow = next_stop.get(slow)
        fast = next_stop.get(next_stop.get(fast))
        if slow == fast:
            return True
    return False


def middle_stop(next_stop, start):
    """The route from start has no loop. Return its middle stop."""
    slow = start
    fast = start
    while fast is not None and next_stop.get(fast) is not None:
        slow = next_stop.get(slow)
        fast = next_stop.get(next_stop.get(fast))
    return slow


def last_stop(next_stop, start):
    """Return the final stop of the route, or None if the route loops."""
    if has_loop(next_stop, start):
        return None
    stop = start
    while next_stop.get(stop) is not None:
        stop = next_stop[stop]
    return stop
`

const ROUTE_CHANGE = ROUTE_BUILD + `

def loop_info(next_stop, start):
    """Return (first stop on the loop, number of stops in the loop), or None if there is no loop."""
    slow = start
    fast = start
    while fast is not None and next_stop.get(fast) is not None:
        slow = next_stop.get(slow)
        fast = next_stop.get(next_stop.get(fast))
        if slow == fast:
            break
    else:
        return None
    entry = start
    while entry != slow:
        entry = next_stop[entry]
        slow = next_stop[slow]
    length = 1
    stop = next_stop[entry]
    while stop != entry:
        stop = next_stop[stop]
        length += 1
    return (entry, length)
`

// ── Week 6: Nested Structure Analyzer ───────────────────────────────────────

const NESTED_STARTER = `# A folder is a dict. A key is a name.
# The value is an int (a file and its size) or a dict (a folder inside it).


def total_size(folder):
    """Return the total size of every file inside folder, at any depth."""
    pass


def count_files(folder):
    """Return how many files are inside folder, at any depth."""
    pass


def max_depth(folder):
    """Return how many folder levels deep it goes. The top folder is level 1."""
    pass


def list_files(folder):
    """Return every file path, like 'src/main.py', sorted."""
    pass
`

const NESTED_BUILD = `# A folder is a dict. A key is a name.
# The value is an int (a file and its size) or a dict (a folder inside it).


def total_size(folder):
    """Return the total size of every file inside folder, at any depth."""
    total = 0
    for item in folder.values():
        if isinstance(item, dict):
            total += total_size(item)
        else:
            total += item
    return total


def count_files(folder):
    """Return how many files are inside folder, at any depth."""
    count = 0
    for item in folder.values():
        if isinstance(item, dict):
            count += count_files(item)
        else:
            count += 1
    return count


def max_depth(folder):
    """Return how many folder levels deep it goes. The top folder is level 1."""
    deepest = 0
    for item in folder.values():
        if isinstance(item, dict):
            deepest = max(deepest, max_depth(item))
    return 1 + deepest


def list_files(folder, path=''):
    """Return every file path, like 'src/main.py', sorted."""
    out = []
    for name, item in folder.items():
        full = path + '/' + name if path else name
        if isinstance(item, dict):
            out.extend(list_files(item, full))
        else:
            out.append(full)
    return sorted(out)
`

const NESTED_CHANGE = NESTED_BUILD + `

def folder_sizes(folder):
    """Return a dict from each folder path inside folder (not the top one) to its total size."""
    sizes = {}

    def walk(node, here):
        total = 0
        for name, item in node.items():
            if isinstance(item, dict):
                total += walk(item, here + '/' + name if here else name)
            else:
                total += item
        if here:
            sizes[here] = total
        return total

    walk(folder, '')
    return sizes


def folders_over(folder, limit):
    """Return the sorted paths of the folders whose total size is above limit."""
    return sorted(path for path, size in folder_sizes(folder).items() if size > limit)
`

// ── Week 7: Organization Hierarchy Analyzer ─────────────────────────────────

const ORG_GIVEN = `class Employee:
    def __init__(self, name, salary, reports=None):
        self.name = name
        self.salary = salary
        self.reports = reports if reports is not None else []


def build_org(spec):
    """Given (do not change): turns ('Ana', 300, [spec, ...]) into Employee objects."""
    name, salary, reports = spec
    return Employee(name, salary, [build_org(r) for r in reports])
`

const ORG_STARTER = ORG_GIVEN + `

def team_size(boss):
    """Return how many people are in boss's team, boss included."""
    pass


def levels(boss):
    """Return how many levels the team has. A boss with no reports is 1 level."""
    pass


def payroll(boss):
    """Return the total salary of boss's team, boss included."""
    pass


def top_earner(boss):
    """Return the name of the highest-paid person in boss's team, boss included."""
    pass
`

const ORG_BUILD = ORG_GIVEN + `

def team_size(boss):
    """Return how many people are in boss's team, boss included."""
    return 1 + sum(team_size(r) for r in boss.reports)


def levels(boss):
    """Return how many levels the team has. A boss with no reports is 1 level."""
    deepest = 0
    for r in boss.reports:
        deepest = max(deepest, levels(r))
    return 1 + deepest


def payroll(boss):
    """Return the total salary of boss's team, boss included."""
    return boss.salary + sum(payroll(r) for r in boss.reports)


def best_paid(boss):
    """Return the Employee with the highest salary; ties go to the one met first, top-down."""
    best = boss
    for r in boss.reports:
        candidate = best_paid(r)
        if candidate.salary > best.salary:
            best = candidate
    return best


def top_earner(boss):
    """Return the name of the highest-paid person in boss's team, boss included."""
    return best_paid(boss).name
`

const ORG_CHANGE = ORG_BUILD + `

def chain_of_command(boss, name):
    """Return the names from boss down to the person called name, or [] if they are not in the team."""
    if boss.name == name:
        return [boss.name]
    for r in boss.reports:
        path = chain_of_command(r, name)
        if path:
            return [boss.name] + path
    return []
`

const ORG = "('Ana', 300, [('Ben', 150, [('Dee', 90, []), ('Eli', 160, [])]), ('Cal', 200, [('Fay', 80, [('Gus', 70, [])])])])"
const ORG_TIE = "('Ana', 100, [('Ben', 150, []), ('Cal', 150, [])])"

// ── Week 7: Searchable Category Tree ────────────────────────────────────────

const CATEGORY_STARTER = `# TreeNode(val, left, right) is provided. Each node's val is a category id.


def insert(root, key):
    """Add key to the tree, keeping smaller ids on the left. Ignore a key that is already there.
    Return the root."""
    pass


def build_catalog(keys):
    """Insert the keys in order into an empty tree. Return the root."""
    pass


def contains(root, key):
    """Return True if key is in the tree."""
    pass


def in_range(root, low, high):
    """Return the ids from low to high (both included), smallest first."""
    pass
`

const CATEGORY_BUILD = `# TreeNode(val, left, right) is provided. Each node's val is a category id.


def insert(root, key):
    """Add key to the tree, keeping smaller ids on the left. Ignore a key that is already there.
    Return the root."""
    if root is None:
        return TreeNode(key)
    if key < root.val:
        root.left = insert(root.left, key)
    elif key > root.val:
        root.right = insert(root.right, key)
    return root


def build_catalog(keys):
    """Insert the keys in order into an empty tree. Return the root."""
    root = None
    for key in keys:
        root = insert(root, key)
    return root


def contains(root, key):
    """Return True if key is in the tree."""
    node = root
    while node is not None:
        if key == node.val:
            return True
        node = node.left if key < node.val else node.right
    return False


def in_range(root, low, high):
    """Return the ids from low to high (both included), smallest first."""
    out = []

    def walk(node):
        if node is None:
            return
        if node.val > low:
            walk(node.left)
        if low <= node.val <= high:
            out.append(node.val)
        if node.val < high:
            walk(node.right)

    walk(root)
    return out
`

const CATEGORY_CHANGE = CATEGORY_BUILD + `

def at_or_below(root, key):
    """Return the largest id that is at most key, or None."""
    best = None
    node = root
    while node is not None:
        if node.val <= key:
            best = node.val
            node = node.right
        else:
            node = node.left
    return best


def at_or_above(root, key):
    """Return the smallest id that is at least key, or None."""
    best = None
    node = root
    while node is not None:
        if node.val >= key:
            best = node.val
            node = node.left
        else:
            node = node.right
    return best
`

const CAT = 'build_catalog([50, 30, 70, 20, 40, 60, 80])'

// ── Week 8: Building Evacuation Map ─────────────────────────────────────────

const EVAC_STARTER = `from collections import deque

# grid is a list of strings. 'E' is an exit, '#' is a wall, '.' is a room.


def find_exits(grid):
    """Return the (row, col) of every exit, top row first, left to right."""
    pass


def steps_to_exit(grid):
    """Return a grid of numbers: steps from each cell to its nearest exit.
    Exits are 0, walls are None, and rooms with no way out are -1."""
    pass


def trapped_rooms(grid):
    """Return the (row, col) of every room with no way out, top row first."""
    pass


def longest_escape(grid):
    """Return the most steps any room needs to reach an exit (0 if no room can)."""
    pass
`

const EVAC_BUILD = `from collections import deque

# grid is a list of strings. 'E' is an exit, '#' is a wall, '.' is a room.


def find_exits(grid):
    """Return the (row, col) of every exit, top row first, left to right."""
    return [(r, c) for r in range(len(grid)) for c in range(len(grid[r])) if grid[r][c] == 'E']


def steps_to_exit(grid):
    """Return a grid of numbers: steps from each cell to its nearest exit.
    Exits are 0, walls are None, and rooms with no way out are -1."""
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    dist = [[None if grid[r][c] == '#' else -1 for c in range(cols)] for r in range(rows)]
    queue = deque()
    for r, c in find_exits(grid):
        dist[r][c] = 0
        queue.append((r, c))
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist


def trapped_rooms(grid):
    """Return the (row, col) of every room with no way out, top row first."""
    dist = steps_to_exit(grid)
    return [(r, c) for r in range(len(dist)) for c in range(len(dist[r])) if dist[r][c] == -1]


def longest_escape(grid):
    """Return the most steps any room needs to reach an exit (0 if no room can)."""
    best = 0
    for row in steps_to_exit(grid):
        for d in row:
            if d is not None and d > best:
                best = d
    return best
`

const EVAC_CHANGE = `from collections import deque

# grid is a list of strings. 'E' is an exit, '#' is a wall, '.' is a room.
# closed is a list of (row, col) exits that are locked. A locked exit acts like a wall.


def find_exits(grid, closed=()):
    """Return the (row, col) of every open exit, top row first, left to right."""
    locked = set(closed)
    return [(r, c) for r in range(len(grid)) for c in range(len(grid[r]))
            if grid[r][c] == 'E' and (r, c) not in locked]


def steps_to_exit(grid, closed=()):
    """Return a grid of numbers: steps from each cell to its nearest open exit.
    Open exits are 0, walls and locked exits are None, and rooms with no way out are -1."""
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    locked = {(r, c) for r, c in closed if 0 <= r < rows and 0 <= c < cols and grid[r][c] == 'E'}
    dist = [[None if grid[r][c] == '#' or (r, c) in locked else -1 for c in range(cols)] for r in range(rows)]
    queue = deque()
    for r, c in find_exits(grid, closed):
        dist[r][c] = 0
        queue.append((r, c))
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist


def trapped_rooms(grid, closed=()):
    """Return the (row, col) of every room with no way out, top row first."""
    dist = steps_to_exit(grid, closed)
    return [(r, c) for r in range(len(dist)) for c in range(len(dist[r])) if dist[r][c] == -1]


def longest_escape(grid, closed=()):
    """Return the most steps any room needs to reach an open exit (0 if no room can)."""
    best = 0
    for row in steps_to_exit(grid, closed):
        for d in row:
            if d is not None and d > best:
                best = d
    return best
`

const G = "['E..#', '.#..', '...E']"
const TRAP = "['E.#.', '..#.', '###.']"

// ── Week 8: Social Network Explorer ─────────────────────────────────────────

const SOCIAL_STARTER = `from collections import deque

# people is a list of names. pairs is a list of (a, b) friendships; friendship goes both ways.


def build_friends(people, pairs):
    """Return a dict from each person to a sorted list of their friends, each friend once."""
    pass


def reachable(people, pairs, person):
    """Return everyone person can reach through friends of friends, sorted, not person."""
    pass


def friend_groups(people, pairs):
    """Return each group of connected people as a sorted list. Sort the groups too."""
    pass


def degrees_apart(people, pairs, a, b):
    """Return the fewest friendship steps from a to b: 0 if a is b, -1 if there is no path."""
    pass
`

const SOCIAL_BUILD = `from collections import deque

# people is a list of names. pairs is a list of (a, b) friendships; friendship goes both ways.


def build_friends(people, pairs):
    """Return a dict from each person to a sorted list of their friends, each friend once."""
    friends = {p: set() for p in people}
    for a, b in pairs:
        if a != b:
            friends[a].add(b)
            friends[b].add(a)
    return {p: sorted(fs) for p, fs in friends.items()}


def reachable(people, pairs, person):
    """Return everyone person can reach through friends of friends, sorted, not person."""
    friends = build_friends(people, pairs)
    seen = {person}
    todo = [person]
    while todo:
        cur = todo.pop()
        for f in friends[cur]:
            if f not in seen:
                seen.add(f)
                todo.append(f)
    seen.discard(person)
    return sorted(seen)


def friend_groups(people, pairs):
    """Return each group of connected people as a sorted list. Sort the groups too."""
    friends = build_friends(people, pairs)
    seen = set()
    groups = []
    for p in people:
        if p in seen:
            continue
        seen.add(p)
        group = []
        todo = [p]
        while todo:
            cur = todo.pop()
            group.append(cur)
            for f in friends[cur]:
                if f not in seen:
                    seen.add(f)
                    todo.append(f)
        groups.append(sorted(group))
    return sorted(groups)


def degrees_apart(people, pairs, a, b):
    """Return the fewest friendship steps from a to b: 0 if a is b, -1 if there is no path."""
    friends = build_friends(people, pairs)
    steps = {a: 0}
    queue = deque([a])
    while queue:
        cur = queue.popleft()
        if cur == b:
            return steps[cur]
        for f in friends[cur]:
            if f not in steps:
                steps[f] = steps[cur] + 1
                queue.append(f)
    return -1
`

const SOCIAL_CHANGE = SOCIAL_BUILD + `

def suggestions(people, pairs, person):
    """Return the people exactly two steps from person.
    Most mutual friends first; ties in name order."""
    friends = build_friends(people, pairs)
    mine = set(friends[person])
    mutual = {}
    for f in friends[person]:
        for g in friends[f]:
            if g != person and g not in mine:
                mutual[g] = mutual.get(g, 0) + 1
    return sorted(mutual, key=lambda name: (-mutual[name], name))
`

const PEOPLE = "['ana', 'ben', 'cy', 'dee', 'eve', 'fay']"
const PAIRS = "[('ana', 'ben'), ('ben', 'cy'), ('cy', 'dee'), ('eve', 'fay')]"
const NET = `${PEOPLE}, ${PAIRS}`
const SQUARE = "['ana', 'ben', 'cy', 'dee', 'eve'], [('ana', 'ben'), ('ana', 'cy'), ('ben', 'dee'), ('cy', 'dee'), ('cy', 'eve')]"

// ── Sections ────────────────────────────────────────────────────────────────

export const sections: Section[] = [
  {
    id: 'labs-w3w8',
    title: 'Labs: Weeks 3–8',
    summary: 'Twelve small builds that compose pointers, windows, stacks, search, lists, recursion, trees, grids and graphs.',
    exercises: [
      // ── Trend Analyzer ──
      code({
        id: 'lab-trend-analyzer-build',
        title: 'Trend Analyzer',
        ...lab,
        style: 'from-signature',
        skills: ['state_tracking', 'prefix_suffix', 'accumulator'],
        minutes: 35,
        prompt: lines(
          'A dashboard shows one number per day, like sign-ups. `values` is that list, oldest day first.',
          'Build the five functions in the starter.',
          '',
          '1. `running_best(values)` returns the highest value so far at each day.',
          '2. `running_worst(values)` returns the lowest value so far at each day.',
          '3. `longest_rise(values)` returns the longest **streak**: days in a row that each beat the day before, like 4, 6, 9.',
          '4. `prefix_totals(values)` returns the running totals with a 0 in front.',
          '5. `range_totals(values, queries)` answers each `(start, end)` query with the total of those days, both ends included.',
          '',
          'Each function makes one pass. `range_totals` builds the totals once, then answers each query with one subtraction.',
          '',
          'Examples:',
          '- `running_best([3, 1, 4])` → `[3, 3, 4]`',
          '- `longest_rise([3, 4, 5, 2, 6])` → `3` (3, 4, 5)',
          '- `longest_rise([5, 5])` → `1` (an equal day is not a rise)',
          '- `range_totals([2, 3, 5, 1], [(1, 3)])` → `[9]`',
          '- `range_totals([], [])` → `[]`',
        ),
        starterCode: TREND_STARTER,
        solution: TREND_BUILD,
        tests: [
          t.eq('running_best([3, 1, 4, 1, 5])', '[3, 3, 4, 4, 5]'),
          t.eq('running_worst([3, 1, 4, 1, 5])', '[3, 1, 1, 1, 1]'),
          t.eq('longest_rise([3, 4, 5, 2, 6])', '3'),
          t.eq('longest_rise([5, 5, 5])', '1'),
          t.eq('prefix_totals([2, 3, 5])', '[0, 2, 5, 10]'),
          t.eq('range_totals([2, 3, 5, 1], [(0, 1), (1, 3), (2, 2)])', '[5, 9, 5]'),
          t.hidden('running_best([])', '[]'),
          t.hidden('running_worst([-2, -5, -1])', '[-2, -5, -5]'),
          t.hidden('longest_rise([])', '0'),
          t.hidden('longest_rise([1, 2, 3, 4])', '4'),
          t.hidden('range_totals([4, -2, 7], [(0, 2), (1, 1)])', '[9, -2]'),
          t.hidden('prefix_totals([])', '[0]'),
        ],
      }),
      code({
        id: 'lab-trend-analyzer-change',
        title: 'Trend Analyzer: missing days',
        ...lab,
        style: 'modify',
        skills: ['state_tracking', 'prefix_suffix', 'edge_cases'],
        minutes: 20,
        prompt: lines(
          'Change request: the sensor sometimes misses a day. A missing day is `None` in `values`.',
          'Your build from the lab is loaded. Update it.',
          '',
          '1. `running_best` and `running_worst` skip missing days. Before the first real reading, the answer is `None`.',
          '2. A missing day ends a rise streak. The next real day starts a new streak of 1.',
          '3. A missing day counts as 0 in `prefix_totals` and `range_totals`.',
          '4. Everything else works as before.',
          '',
          'Examples:',
          '- `running_best([None, 2, None, 5])` → `[None, 2, 2, 5]`',
          '- `longest_rise([1, 2, None, 3, 4, 5])` → `3`',
          '- `prefix_totals([2, None, 5])` → `[0, 2, 2, 7]`',
        ),
        starterCode: TREND_BUILD,
        solution: TREND_CHANGE,
        tests: [
          t.eq('running_best([3, None, 5])', '[3, 3, 5]'),
          t.eq('running_best([None, 2])', '[None, 2]'),
          t.eq('running_worst([4, None, 1])', '[4, 4, 1]'),
          t.eq('longest_rise([1, 2, None, 3, 4, 5])', '3'),
          t.eq('prefix_totals([2, None, 5])', '[0, 2, 2, 7]'),
          t.eq('range_totals([2, None, 5, 1], [(0, 1), (1, 3)])', '[2, 6]'),
          t.eq('running_best([3, 1, 4, 1, 5])', '[3, 3, 4, 4, 5]'),
          t.eq('longest_rise([3, 4, 5, 2, 6])', '3'),
          t.hidden('longest_rise([None, None])', '0'),
          t.hidden('longest_rise([5, None, 6])', '1'),
          t.hidden('running_worst([])', '[]'),
          t.hidden('range_totals([2, 3, 5, 1], [(1, 3)])', '[9]'),
        ],
      }),

      // ── Sorted Match Engine ──
      code({
        id: 'lab-sorted-match-build',
        title: 'Sorted Match Engine',
        ...lab,
        style: 'from-signature',
        skills: ['two_pointer', 'pointer_update', 'sorted_dedupe'],
        minutes: 35,
        prompt: lines(
          'A small market keeps buy prices and sell prices in two lists. Both are sorted from low to high.',
          'Build the three functions in the starter. Each walks both lists once and never calls `sort`.',
          '',
          '1. `merge_prices(a, b)` returns every price from both lists in one sorted list.',
          '2. `shared_prices(a, b)` returns the prices found in both lists. List each one once.',
          '3. `match_orders(buys, sells)` returns the `(buy, sell)` pairs the engine makes.',
          '',
          'How the engine matches:',
          '- Start at the cheapest buy and the cheapest sell.',
          '- If the sell price is at most the buy price, pair them. Move past both.',
          '- Otherwise this buy is too low for every sell left. Skip the buy.',
          '- Stop when either list runs out.',
          '',
          'Examples:',
          '- `merge_prices([1, 4], [2, 4])` → `[1, 2, 4, 4]`',
          '- `shared_prices([1, 2, 2, 5], [2, 2, 3])` → `[2]`',
          '- `match_orders([5, 8, 10], [6, 7, 12])` → `[(8, 6), (10, 7)]` (5 is too low)',
          '- `match_orders([1, 2], [5])` → `[]`',
        ),
        starterCode: MATCH_STARTER,
        solution: MATCH_BUILD,
        tests: [
          t.eq('merge_prices([1, 4, 9], [2, 4, 10])', '[1, 2, 4, 4, 9, 10]'),
          t.eq('merge_prices([], [3, 5])', '[3, 5]'),
          t.eq('shared_prices([1, 2, 2, 5, 8], [2, 2, 3, 8])', '[2, 8]'),
          t.eq('shared_prices([1, 3], [2, 4])', '[]'),
          t.eq('match_orders([5, 8, 10], [6, 7, 12])', '[(8, 6), (10, 7)]'),
          t.eq('match_orders([10, 10], [3])', '[(10, 3)]'),
          t.hidden('merge_prices([7], [])', '[7]'),
          t.hidden('shared_prices([], [1])', '[]'),
          t.hidden('shared_prices([4, 4, 4], [4, 4])', '[4]'),
          t.hidden('match_orders([1, 2], [5, 6])', '[]'),
          t.hidden('match_orders([], [1])', '[]'),
          t.hidden('match_orders([4, 6, 9], [4, 5, 6])', '[(4, 4), (6, 5), (9, 6)]'),
        ],
      }),
      code({
        id: 'lab-sorted-match-change',
        title: 'Sorted Match Engine: quantities',
        ...lab,
        style: 'modify',
        skills: ['two_pointer', 'pointer_update', 'edge_cases'],
        minutes: 25,
        prompt: lines(
          'Change request: orders now have a quantity. Each order is a `(price, quantity)` pair.',
          'Your build from the lab is loaded. Keep the old functions working and add two new ones.',
          '',
          '1. `fill_orders(buys, sells)` returns `(buy price, sell price, quantity)` fills, in the order they happen.',
          '2. `total_filled(buys, sells)` returns the total quantity traded.',
          '',
          'The matching rule is the same as before. Two things change:',
          '- A fill trades the smaller of the two quantities left. Both orders lose that much.',
          '- Move past an order only when it has nothing left. An order can fill in several parts.',
          '- Skip any order with quantity 0. Do not change the input lists.',
          '',
          'Examples:',
          '- `fill_orders([(10, 5)], [(8, 2), (9, 4)])` → `[(10, 8, 2), (10, 9, 3)]`',
          '- `total_filled([(1, 4)], [(2, 4)])` → `0` (no sell is cheap enough)',
        ),
        starterCode: MATCH_BUILD,
        solution: MATCH_CHANGE,
        tests: [
          t.eq('fill_orders([(10, 5)], [(8, 2), (9, 4)])', '[(10, 8, 2), (10, 9, 3)]'),
          t.eq('fill_orders([(5, 3), (9, 3)], [(6, 4)])', '[(9, 6, 3)]'),
          t.eq('fill_orders([(7, 2), (8, 2)], [(7, 3)])', '[(7, 7, 2), (8, 7, 1)]'),
          t.eq('total_filled([(10, 5)], [(8, 2), (9, 4)])', '5'),
          t.eq('total_filled([(1, 4)], [(2, 4)])', '0'),
          t.eq('match_orders([5, 8, 10], [6, 7, 12])', '[(8, 6), (10, 7)]'),
          t.eq('merge_prices([1, 4, 9], [2, 4, 10])', '[1, 2, 4, 4, 9, 10]'),
          t.hidden('fill_orders([(9, 0), (9, 2)], [(5, 1)])', '[(9, 5, 1)]'),
          t.hidden('fill_orders([], [(1, 1)])', '[]'),
          t.check('fill_orders leaves its inputs alone', "b = [[10, 5]]; s = [[8, 2]]; fill_orders(b, s); assert b == [[10, 5]] and s == [[8, 2]], 'inputs changed'", true),
          t.hidden('shared_prices([1, 2, 2, 5, 8], [2, 2, 3, 8])', '[2, 8]'),
        ],
      }),

      // ── Activity Window Analyzer ──
      code({
        id: 'lab-activity-window-build',
        title: 'Activity Window Analyzer',
        ...lab,
        style: 'from-signature',
        skills: ['sliding_window', 'window_state', 'accumulator'],
        minutes: 35,
        prompt: lines(
          'A server logs the minute of every request. `times` is that list of minutes.',
          'Build the three functions in the starter.',
          '',
          '1. `per_minute(times, n)` returns `n` counts. Item `m` is how many events happened in minute `m`. Ignore times outside 0 to `n - 1`.',
          '2. `busiest_window(counts, k)` returns `(start, total)` for the `k` minutes in a row with the most events. On a tie, use the earliest start.',
          '3. `longest_quiet(counts, limit)` returns the length of the longest run of minutes whose total is at most `limit`.',
          '',
          '`k` is between 1 and `len(counts)`. Counts are never negative.',
          'Both window functions make one pass over `counts`. Do not re-add a window from scratch at each step.',
          '',
          'Examples:',
          '- `per_minute([0, 1, 1, 4], 5)` → `[1, 2, 0, 0, 1]`',
          '- `busiest_window([0, 1, 3, 0, 4], 2)` → `(1, 4)` (a tie with start 3; the earlier start wins)',
          '- `longest_quiet([1, 0, 2, 0, 0, 1], 1)` → `3`',
          '- `longest_quiet([3, 3], 2)` → `0` (every minute is over the limit)',
        ),
        starterCode: ACTIVITY_STARTER,
        solution: ACTIVITY_BUILD,
        tests: [
          t.eq('per_minute([0, 1, 1, 4], 5)', '[1, 2, 0, 0, 1]'),
          t.eq('per_minute([2, 7, -1], 3)', '[0, 0, 1]'),
          t.eq('busiest_window([1, 2, 0, 0, 1], 2)', '(0, 3)'),
          t.eq('busiest_window([0, 1, 3, 0, 4], 2)', '(1, 4)'),
          t.eq('longest_quiet([1, 0, 2, 0, 0, 1], 1)', '3'),
          t.eq('longest_quiet([3, 3], 2)', '0'),
          t.hidden('per_minute([], 2)', '[0, 0]'),
          t.hidden('busiest_window([5], 1)', '(0, 5)'),
          t.hidden('busiest_window([2, 0, 0, 2, 3], 3)', '(2, 5)'),
          t.hidden('longest_quiet([], 5)', '0'),
          t.hidden('longest_quiet([0, 0, 0], 0)', '3'),
          t.hidden('longest_quiet([1, 1, 1, 1], 2)', '2'),
        ],
      }),
      code({
        id: 'lab-activity-window-change',
        title: 'Activity Window Analyzer: unique visitors',
        ...lab,
        style: 'modify',
        skills: ['sliding_window', 'window_counts', 'tuples'],
        minutes: 25,
        prompt: lines(
          'Change request: the log now records who made each request. An event is a `(minute, user)` pair.',
          'Your build from the lab is loaded. Update it.',
          '',
          '1. `per_minute(events, n)` accepts plain minutes, as before, or `(minute, user)` pairs.',
          '2. Add `busiest_unique(events, k)`. It returns the most different users seen in any `k` minutes in a row.',
          '3. `events` is sorted by minute. A stretch of `k` minutes ending at minute `m` covers `m - k + 1` to `m`.',
          '4. Make one pass over `events`. Keep a count per user for the current stretch.',
          '',
          'Examples:',
          "- `per_minute([(0, 'ana'), (1, 'ben'), (1, 'ana')], 3)` → `[1, 2, 0]`",
          "- `busiest_unique([(0, 'ana'), (1, 'ben'), (1, 'ana'), (5, 'cy')], 2)` → `2`",
          '- `busiest_unique([], 3)` → `0`',
        ),
        starterCode: ACTIVITY_BUILD,
        solution: ACTIVITY_CHANGE,
        tests: [
          t.eq("per_minute([(0, 'ana'), (1, 'ben'), (1, 'ana')], 3)", '[1, 2, 0]'),
          t.eq('per_minute([0, 2], 3)', '[1, 0, 1]'),
          t.eq("busiest_unique([(0, 'ana'), (1, 'ben'), (1, 'ana'), (5, 'cy')], 2)", '2'),
          t.eq("busiest_unique([(0, 'a'), (0, 'a'), (0, 'a')], 1)", '1'),
          t.eq("busiest_unique([(0, 'a'), (3, 'b'), (4, 'c'), (6, 'd')], 4)", '3'),
          t.eq('busiest_window([0, 1, 3, 0, 4], 2)', '(1, 4)'),
          t.eq('longest_quiet([1, 0, 2, 0, 0, 1], 1)', '3'),
          t.hidden('busiest_unique([], 3)', '0'),
          t.hidden("busiest_unique([(2, 'x'), (9, 'y')], 1)", '1'),
          t.hidden("busiest_unique([(0, 'a'), (1, 'b'), (2, 'a'), (3, 'c')], 2)", '2'),
          t.hidden('longest_quiet([3, 3], 2)', '0'),
        ],
      }),

      // ── Editor Undo/Redo Engine ──
      code({
        id: 'lab-undo-redo-build',
        title: 'Editor Undo/Redo Engine',
        ...lab,
        style: 'from-signature',
        skills: ['stack_push_pop', 'string_methods', 'conditionals'],
        minutes: 35,
        prompt: lines(
          'A tiny text editor starts with an empty document. It runs a list of commands, one string each.',
          '',
          "- `'type hello'` adds `hello` to the end. Everything after the first space is typed, spaces included.",
          "- `'delete 3'` removes the last 3 characters. If there are fewer, the document becomes empty.",
          "- `'undo'` goes back to the text before the last type or delete that is not undone yet.",
          "- `'redo'` brings back the last undone change.",
          '- A new type or delete clears everything that could be redone.',
          '- An undo or redo with nothing to undo or redo does nothing.',
          '',
          'Build the three functions in the starter:',
          '1. `apply(text, command)` returns the text after one type or delete.',
          '2. `snapshots(commands)` returns the text after each command.',
          '3. `run_editor(commands)` returns the final text.',
          '',
          'Examples:',
          "- `apply('hello', 'delete 2')` → `'hel'`",
          "- `run_editor(['type ab', 'type c', 'undo'])` → `'ab'`",
          "- `run_editor(['undo', 'redo'])` → `''` (nothing to undo)",
        ),
        starterCode: EDITOR_STARTER,
        solution: EDITOR_BUILD,
        tests: [
          t.eq("apply('cat', 'type s')", "'cats'"),
          t.eq("apply('hello', 'delete 2')", "'hel'"),
          t.eq("apply('hi', 'delete 5')", "''"),
          t.eq("run_editor(['type ab', 'type c', 'undo'])", "'ab'"),
          t.eq("run_editor(['type ab', 'undo', 'redo'])", "'ab'"),
          t.eq("run_editor(['type a', 'type b', 'undo', 'type c', 'redo'])", "'ac'"),
          t.eq("snapshots(['type hi', 'delete 1', 'undo', 'undo', 'redo'])", "['hi', 'h', 'hi', '', 'hi']"),
          t.hidden("apply('', 'type hello world')", "'hello world'"),
          t.hidden("run_editor(['undo', 'redo'])", "''"),
          t.hidden('run_editor([])', "''"),
          t.hidden("run_editor(['type abc', 'delete 1', 'delete 1', 'undo', 'undo', 'undo', 'redo', 'redo'])", "'ab'"),
          t.hidden("snapshots(['type x', 'undo', 'undo'])", "['x', '', '']"),
        ],
      }),
      code({
        id: 'lab-undo-redo-change',
        title: 'Editor Undo/Redo Engine: counts and clear',
        ...lab,
        style: 'modify',
        skills: ['stack_push_pop', 'string_methods', 'edge_cases'],
        minutes: 20,
        prompt: lines(
          'Change request: users want to undo several steps at once and to clear the page.',
          'Your build from the lab is loaded. Update it.',
          '',
          "1. `'undo 3'` undoes up to 3 changes. `'redo 2'` redoes up to 2. A plain `'undo'` or `'redo'` still means 1.",
          '2. If there are fewer changes to undo or redo, do as many as there are.',
          "3. `'clear'` empties the document. It is a change like type or delete, so it can be undone.",
          '4. Everything else works as before.',
          '',
          'Examples:',
          "- `run_editor(['type a', 'type b', 'type c', 'undo 2'])` → `'a'`",
          "- `run_editor(['type hi', 'clear', 'undo'])` → `'hi'`",
          "- `run_editor(['type a', 'undo 5'])` → `''`",
        ),
        starterCode: EDITOR_BUILD,
        solution: EDITOR_CHANGE,
        tests: [
          t.eq("apply('abc', 'clear')", "''"),
          t.eq("run_editor(['type a', 'type b', 'type c', 'undo 2'])", "'a'"),
          t.eq("run_editor(['type a', 'type b', 'undo 5'])", "''"),
          t.eq("run_editor(['type a', 'type b', 'undo 2', 'redo 2'])", "'ab'"),
          t.eq("run_editor(['type hi', 'clear', 'undo'])", "'hi'"),
          t.eq("snapshots(['type ab', 'clear', 'type c', 'undo 2', 'redo'])", "['ab', '', 'c', 'ab', '']"),
          t.eq("run_editor(['type a', 'type b', 'undo', 'type c', 'redo'])", "'ac'"),
          t.hidden("run_editor(['type a', 'undo', 'redo 3'])", "'a'"),
          t.hidden("apply('hello', 'delete 2')", "'hel'"),
          t.hidden("snapshots(['type hi', 'delete 1', 'undo', 'undo', 'redo'])", "['hi', 'h', 'hi', '', 'hi']"),
          t.hidden('run_editor([])', "''"),
        ],
      }),

      // ── Searchable Product Catalog ──
      code({
        id: 'lab-product-catalog-build',
        title: 'Searchable Product Catalog',
        ...lab,
        style: 'from-signature',
        skills: ['binary_search', 'search_invariant', 'tuples'],
        minutes: 35,
        prompt: lines(
          'A shop keeps its catalog as a list of `(price, name)` pairs, sorted by price. Several products can share a price.',
          'Build the four functions in the starter. Each search must look at O(log n) products, not scan the list.',
          '',
          '1. `first_at_least(products, budget)` returns the index of the first product priced at or above `budget`. If there is none, return `len(products)`.',
          '2. `last_at_most(products, budget)` returns the index of the last product priced at or below `budget`, or -1.',
          '3. `count_in_range(products, low, high)` returns how many products cost from `low` to `high`, both included. If `low > high`, return 0.',
          '4. `affordable(products, budget)` returns the names of products priced at or below `budget`, cheapest first.',
          '',
          'Examples:',
          "- `first_at_least([(5, 'pen'), (12, 'mug'), (20, 'bag')], 13)` → `2`",
          "- `last_at_most([(5, 'pen'), (12, 'mug')], 4)` → `-1` (nothing is that cheap)",
          "- `count_in_range([(5, 'pen'), (12, 'mug'), (12, 'cap')], 10, 20)` → `2`",
        ),
        starterCode: CATALOG_STARTER,
        solution: CATALOG_BUILD,
        tests: (() => {
          const P = "[(5, 'pen'), (12, 'mug'), (12, 'cap'), (20, 'bag'), (45, 'lamp')]"
          return [
            t.eq(`first_at_least(${P}, 12)`, '1'),
            t.eq(`first_at_least(${P}, 13)`, '3'),
            t.eq(`first_at_least(${P}, 100)`, '5'),
            t.eq(`last_at_most(${P}, 12)`, '2'),
            t.eq(`last_at_most(${P}, 4)`, '-1'),
            t.eq(`count_in_range(${P}, 10, 20)`, '3'),
            t.eq(`affordable(${P}, 12)`, "['pen', 'mug', 'cap']"),
            t.hidden('first_at_least([], 3)', '0'),
            t.hidden(`last_at_most(${P}, 45)`, '4'),
            t.hidden(`count_in_range(${P}, 21, 44)`, '0'),
            t.hidden(`count_in_range(${P}, 30, 10)`, '0'),
            t.hidden(`affordable(${P}, 1)`, '[]'),
          ]
        })(),
      }),
      code({
        id: 'lab-product-catalog-change',
        title: 'Searchable Product Catalog: new arrivals',
        ...lab,
        style: 'modify',
        skills: ['binary_search', 'search_invariant', 'list_index'],
        minutes: 20,
        prompt: lines(
          'Change request: new products arrive during the day. The catalog must stay sorted without calling `sort`.',
          'Your build from the lab is loaded. Keep it working and add two functions.',
          '',
          '1. `add_product(products, price, name)` inserts `(price, name)` into `products` in place.',
          '2. It goes after any product with the same price. Return the index where it went.',
          '3. `cheapest_at_least(products, budget)` returns the name of the cheapest product priced at or above `budget`, or `None`.',
          '4. Both find their spot with the searches you already wrote.',
          '',
          'Examples:',
          "- `add_product([(5, 'pen'), (20, 'bag')], 12, 'mug')` → `1`",
          "- `cheapest_at_least([(5, 'pen'), (20, 'bag')], 6)` → `'bag'`",
          "- `cheapest_at_least([(5, 'pen')], 50)` → `None`",
        ),
        starterCode: CATALOG_BUILD,
        solution: CATALOG_CHANGE,
        tests: (() => {
          const P = "[(5, 'pen'), (12, 'mug'), (12, 'cap'), (20, 'bag'), (45, 'lamp')]"
          return [
            t.check('add_product puts it in order', "p = [(5, 'pen'), (20, 'bag')]; i = add_product(p, 12, 'mug'); assert i == 1, i; assert p == [(5, 'pen'), (12, 'mug'), (20, 'bag')], p"),
            t.check('add_product goes after equal prices', "p = [(12, 'mug')]; i = add_product(p, 12, 'cap'); assert i == 1, i; assert p == [(12, 'mug'), (12, 'cap')], p"),
            t.check('add_product at the front', "p = [(5, 'pen')]; i = add_product(p, 1, 'clip'); assert i == 0, i; assert p == [(1, 'clip'), (5, 'pen')], p"),
            t.eq(`cheapest_at_least(${P}, 13)`, "'bag'"),
            t.eq(`cheapest_at_least(${P}, 12)`, "'mug'"),
            t.eq(`cheapest_at_least(${P}, 50)`, 'None'),
            t.eq(`first_at_least(${P}, 13)`, '3'),
            t.eq(`count_in_range(${P}, 10, 20)`, '3'),
            t.check('add_product into an empty catalog', "p = []; i = add_product(p, 9, 'cup'); assert i == 0 and p == [(9, 'cup')], p", true),
            t.hidden('cheapest_at_least([], 1)', 'None'),
            t.hidden(`last_at_most(${P}, 4)`, '-1'),
          ]
        })(),
      }),

      // ── Playlist Editor ──
      code({
        id: 'lab-playlist-build',
        title: 'Playlist Editor',
        ...lab,
        style: 'from-signature',
        skills: ['linked_list_traversal', 'linked_list_reassignment', 'dummy_node'],
        minutes: 40,
        prompt: lines(
          'A music app stores a playlist as a linked list. Each `ListNode` holds one song title in `val`.',
          'Build the four functions in the starter. Rewire the nodes you are given; do not copy titles into a Python list.',
          '',
          '1. `add_song(head, title)` adds a song at the end and returns the head. The playlist may be empty.',
          '2. `remove_song(head, title)` removes the first song with that title and returns the head. A missing title changes nothing.',
          '3. `position_of(head, title)` returns the 1-based position of the first song with that title, or -1.',
          '4. `reverse_range(head, left, right)` reverses the songs from position `left` to `right`, both included. Return the head.',
          '',
          'For `reverse_range`, `left` is at least 1 and at most `right`. If `right` is past the end, reverse to the end.',
          'If `left` is past the end, change nothing.',
          '',
          'Examples (playlists written as their titles):',
          '- reversing a, b, c, d, e from 2 to 4 gives a, d, c, b, e.',
          "- `position_of(build_list(['a', 'b', 'c']), 'c')` → `3`",
          "- `position_of(build_list(['a']), 'z')` → `-1`",
        ),
        starterCode: PLAYLIST_STARTER,
        solution: PLAYLIST_BUILD,
        tests: [
          t.eq("list_to_array(add_song(build_list(['intro', 'hey']), 'outro'))", "['intro', 'hey', 'outro']"),
          t.eq("list_to_array(add_song(None, 'solo'))", "['solo']"),
          t.eq("list_to_array(remove_song(build_list(['a', 'b', 'c']), 'b'))", "['a', 'c']"),
          t.eq("list_to_array(remove_song(build_list(['a', 'b']), 'a'))", "['b']"),
          t.eq("position_of(build_list(['a', 'b', 'c']), 'c')", '3'),
          t.eq("list_to_array(reverse_range(build_list(['a', 'b', 'c', 'd', 'e']), 2, 4))", "['a', 'd', 'c', 'b', 'e']"),
          t.eq("list_to_array(reverse_range(build_list(['a', 'b', 'c', 'd', 'e']), 1, 5))", "['e', 'd', 'c', 'b', 'a']"),
          t.hidden("list_to_array(remove_song(build_list(['a', 'b']), 'z'))", "['a', 'b']"),
          t.hidden("list_to_array(remove_song(build_list(['a', 'b', 'a']), 'a'))", "['b', 'a']"),
          t.hidden("remove_song(None, 'x')", 'None'),
          t.hidden("position_of(None, 'a')", '-1'),
          t.hidden("list_to_array(reverse_range(build_list(['a', 'b', 'c']), 2, 9))", "['a', 'c', 'b']"),
          t.hidden("list_to_array(reverse_range(build_list(['a', 'b']), 3, 4))", "['a', 'b']"),
          t.check('reverse_range rewires the same nodes', "h = build_list(['a', 'b', 'c']); nodes = [h, h.next, h.next.next]; r = reverse_range(h, 1, 3); assert r is nodes[2] and r.next is nodes[1] and r.next.next is nodes[0], 'build no new nodes'", true),
        ],
      }),
      code({
        id: 'lab-playlist-change',
        title: 'Playlist Editor: move a song',
        ...lab,
        style: 'modify',
        skills: ['linked_list_reassignment', 'dummy_node', 'linked_list_traversal'],
        minutes: 25,
        prompt: lines(
          'Change request: users want to drag a song to a new spot.',
          'Your build from the lab is loaded. Keep it working and add one function.',
          '',
          '1. `move_song(head, title, position)` moves the first song with that title. Afterwards it is song number `position` (1-based).',
          '2. If `position` is past the end, the song goes last.',
          '3. If no song has that title, change nothing.',
          '4. Move the existing node. Do not create a new one. Return the head.',
          '',
          'Examples (playlists written as their titles):',
          '- moving d to position 1 in a, b, c, d gives d, a, b, c.',
          '- moving a to position 3 in a, b, c, d gives b, c, a, d.',
          '- moving b to position 10 in a, b, c gives a, c, b.',
        ),
        starterCode: PLAYLIST_BUILD,
        solution: PLAYLIST_CHANGE,
        tests: [
          t.eq("list_to_array(move_song(build_list(['a', 'b', 'c', 'd']), 'd', 1))", "['d', 'a', 'b', 'c']"),
          t.eq("list_to_array(move_song(build_list(['a', 'b', 'c', 'd']), 'a', 3))", "['b', 'c', 'a', 'd']"),
          t.eq("list_to_array(move_song(build_list(['a', 'b', 'c']), 'b', 10))", "['a', 'c', 'b']"),
          t.eq("list_to_array(move_song(build_list(['a', 'b']), 'z', 1))", "['a', 'b']"),
          t.eq("list_to_array(remove_song(build_list(['a', 'b', 'c']), 'b'))", "['a', 'c']"),
          t.eq("list_to_array(reverse_range(build_list(['a', 'b', 'c', 'd', 'e']), 2, 4))", "['a', 'd', 'c', 'b', 'e']"),
          t.hidden("list_to_array(move_song(build_list(['a', 'b', 'c']), 'a', 1))", "['a', 'b', 'c']"),
          t.hidden("list_to_array(move_song(build_list(['a']), 'a', 2))", "['a']"),
          t.hidden("move_song(None, 'a', 1)", 'None'),
          t.check('move_song moves the same node', "h = build_list(['a', 'b', 'c']); n = h.next.next; r = move_song(h, 'c', 1); assert r is n, 'move the node, do not make a new one'", true),
          t.hidden("list_to_array(add_song(build_list(['intro']), 'outro'))", "['intro', 'outro']"),
        ],
      }),

      // ── Route Walker ──
      code({
        id: 'lab-route-walker-build',
        title: 'Route Walker',
        ...lab,
        style: 'from-signature',
        skills: ['fast_slow', 'linked_list_traversal', 'dict_get'],
        minutes: 35,
        prompt: lines(
          'A transit map is a dict `next_stop` from each stop to the stop after it.',
          'A stop maps to `None` at the end of the line. A stop that is not a key also ends the line.',
          'A mistake in the map can send a route round in a loop forever.',
          '',
          'Build the four functions in the starter:',
          '1. `route(next_stop, start)` returns the stops in order from `start`. Stop at the end of the line, or just before a stop would repeat.',
          '2. `has_loop(next_stop, start)` returns `True` if the route from `start` never ends. Use O(1) extra memory: no set of stops.',
          '3. `middle_stop(next_stop, start)` returns the middle stop of a route with no loop. With two middles, return the second.',
          '4. `last_stop(next_stop, start)` returns the final stop, or `None` if the route loops.',
          '',
          'Examples:',
          "- `route({'A': 'B', 'B': 'C', 'C': 'A'}, 'B')` → `['B', 'C', 'A']`",
          "- `has_loop({'A': 'B', 'B': None}, 'A')` → `False`",
          "- `middle_stop({'A': 'B', 'B': 'C', 'C': 'D', 'D': None}, 'A')` → `'C'`",
          "- `last_stop({'A': 'A'}, 'A')` → `None`",
        ),
        starterCode: ROUTE_STARTER,
        solution: ROUTE_BUILD,
        tests: [
          t.eq("route({'A': 'B', 'B': 'C', 'C': None}, 'A')", "['A', 'B', 'C']"),
          t.eq("route({'A': 'B', 'B': 'C', 'C': 'A'}, 'B')", "['B', 'C', 'A']"),
          t.eq("has_loop({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'B'}, 'A')", 'True'),
          t.eq("has_loop({'A': 'B', 'B': 'C', 'C': None}, 'A')", 'False'),
          t.eq("middle_stop({'A': 'B', 'B': 'C', 'C': None}, 'A')", "'B'"),
          t.eq("middle_stop({'A': 'B', 'B': 'C', 'C': 'D', 'D': None}, 'A')", "'C'"),
          t.eq("last_stop({'A': 'B', 'B': 'C', 'C': None}, 'A')", "'C'"),
          t.eq("last_stop({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'B'}, 'A')", 'None'),
          t.hidden("route({'A': 'B'}, 'A')", "['A', 'B']"),
          t.hidden("has_loop({'A': 'A'}, 'A')", 'True'),
          t.hidden("has_loop({}, 'A')", 'False'),
          t.hidden("middle_stop({'A': None}, 'A')", "'A'"),
          t.hidden("last_stop({}, 'X')", "'X'"),
        ],
      }),
      code({
        id: 'lab-route-walker-change',
        title: 'Route Walker: where the loop starts',
        ...lab,
        style: 'modify',
        skills: ['fast_slow', 'while_loop', 'dict_lookup'],
        minutes: 25,
        prompt: lines(
          'Change request: the map team wants to fix broken routes. They need to know where each loop starts.',
          'Your build from the lab is loaded. Keep it working and add one function.',
          '',
          '1. `loop_info(next_stop, start)` returns `(entry, length)` when the route from `start` loops.',
          '2. `entry` is the first stop of the route that is on the loop. `length` is how many stops the loop has.',
          '3. If the route ends, return `None`.',
          '4. Use O(1) extra memory, like `has_loop`.',
          '',
          'Examples:',
          "- `loop_info({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'B'}, 'A')` → `('B', 3)`",
          "- `loop_info({'A': 'A'}, 'A')` → `('A', 1)`",
          "- `loop_info({'A': 'B', 'B': None}, 'A')` → `None`",
        ),
        starterCode: ROUTE_BUILD,
        solution: ROUTE_CHANGE,
        tests: [
          t.eq("loop_info({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'B'}, 'A')", "('B', 3)"),
          t.eq("loop_info({'A': 'A'}, 'A')", "('A', 1)"),
          t.eq("loop_info({'A': 'B', 'B': 'C', 'C': None}, 'A')", 'None'),
          t.eq("has_loop({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'B'}, 'A')", 'True'),
          t.eq("middle_stop({'A': 'B', 'B': 'C', 'C': 'D', 'D': None}, 'A')", "'C'"),
          t.eq("route({'A': 'B', 'B': 'C', 'C': 'A'}, 'B')", "['B', 'C', 'A']"),
          t.hidden("loop_info({'A': 'B', 'B': 'A'}, 'A')", "('A', 2)"),
          t.hidden("loop_info({'S': 'T', 'T': 'U', 'U': 'V', 'V': 'W', 'W': 'U'}, 'S')", "('U', 3)"),
          t.hidden("loop_info({}, 'Z')", 'None'),
          t.hidden("loop_info({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'E', 'E': 'F', 'F': 'A'}, 'C')", "('C', 6)"),
          t.hidden("last_stop({'A': 'B', 'B': 'C', 'C': 'D', 'D': 'B'}, 'A')", 'None'),
        ],
      }),

      // ── Nested Structure Analyzer ──
      code({
        id: 'lab-nested-analyzer-build',
        title: 'Nested Structure Analyzer',
        ...lab,
        style: 'from-signature',
        skills: ['recursion_base_case', 'recursion_return', 'dict_items'],
        minutes: 35,
        prompt: lines(
          'A backup tool describes a folder as a dict. Each key is a name.',
          'A value that is an `int` is a file and its size. A value that is a `dict` is a folder inside it.',
          'Folders can nest to any depth.',
          '',
          'Build the four functions in the starter:',
          '1. `total_size(folder)` returns the total size of every file, at any depth.',
          '2. `count_files(folder)` returns how many files there are, at any depth.',
          '3. `max_depth(folder)` returns how many folder levels deep it goes. The top folder is level 1, even when empty.',
          "4. `list_files(folder)` returns every file path, sorted. Join names with `/`, like `'src/util/io.py'`.",
          '',
          'Use `isinstance(item, dict)` to tell a folder from a file.',
          '',
          'Examples:',
          "- `total_size({'a.txt': 3, 'src': {'b.py': 10}})` → `13`",
          "- `max_depth({'a.txt': 1})` → `1`",
          "- `list_files({'b': {'z.txt': 1}, 'a.txt': 2})` → `['a.txt', 'b/z.txt']`",
          '- `count_files({})` → `0`',
        ),
        starterCode: NESTED_STARTER,
        solution: NESTED_BUILD,
        tests: (() => {
          const D = "{'readme.md': 3, 'src': {'main.py': 10, 'util': {'io.py': 4}}, 'docs': {}}"
          return [
            t.eq(`total_size(${D})`, '17'),
            t.eq('total_size({})', '0'),
            t.eq(`count_files(${D})`, '3'),
            t.eq(`max_depth(${D})`, '3'),
            t.eq("max_depth({'a.txt': 1})", '1'),
            t.eq(`list_files(${D})`, "['readme.md', 'src/main.py', 'src/util/io.py']"),
            t.hidden('max_depth({})', '1'),
            t.hidden("list_files({'b': {'z.txt': 1}, 'a.txt': 2})", "['a.txt', 'b/z.txt']"),
            t.hidden("list_files({'e': {}})", '[]'),
            t.hidden("count_files({'e': {'f': {}}})", '0'),
            t.hidden("total_size({'x': {'y': {'z': {'w.bin': 7}}}})", '7'),
            t.hidden("max_depth({'x': {'y': {'z': {}}}, 'k': {}})", '4'),
          ]
        })(),
      }),
      code({
        id: 'lab-nested-analyzer-change',
        title: 'Nested Structure Analyzer: big folders',
        ...lab,
        style: 'modify',
        skills: ['recursion_return', 'dict_assign', 'sorting'],
        minutes: 25,
        prompt: lines(
          'Change request: the backup tool must warn about big folders.',
          'Your build from the lab is loaded. Keep it working and add two functions.',
          '',
          '1. `folder_sizes(folder)` returns a dict from each folder path to its total size. Leave out the top folder.',
          '2. `folders_over(folder, limit)` returns the sorted paths of folders whose total size is above `limit`.',
          '3. Visit each file once. Do not call `total_size` again for every folder.',
          '',
          'Examples:',
          "- `folder_sizes({'a.txt': 5})` → `{}`",
          "- `folder_sizes({'src': {'b.py': 4, 'lib': {'c.py': 2}}})` → `{'src': 6, 'src/lib': 2}`",
          "- `folders_over({'src': {'b.py': 4, 'lib': {'c.py': 2}}}, 3)` → `['src']`",
        ),
        starterCode: NESTED_BUILD,
        solution: NESTED_CHANGE,
        tests: (() => {
          const D = "{'readme.md': 3, 'src': {'main.py': 10, 'util': {'io.py': 4}}, 'docs': {}}"
          return [
            t.eq(`folder_sizes(${D})`, "{'src': 14, 'src/util': 4, 'docs': 0}"),
            t.eq("folder_sizes({'a.txt': 5})", '{}'),
            t.eq(`folders_over(${D}, 3)`, "['src', 'src/util']"),
            t.eq(`folders_over(${D}, 14)`, '[]'),
            t.eq(`total_size(${D})`, '17'),
            t.eq(`list_files(${D})`, "['readme.md', 'src/main.py', 'src/util/io.py']"),
            t.hidden(`folders_over(${D}, -1)`, "['docs', 'src', 'src/util']"),
            t.hidden("folder_sizes({'a': {'b': {'c': {'d.txt': 2}}}})", "{'a': 2, 'a/b': 2, 'a/b/c': 2}"),
            t.hidden(`max_depth(${D})`, '3'),
            t.hidden('count_files({})', '0'),
          ]
        })(),
      }),

      // ── Organization Hierarchy Analyzer ──
      code({
        id: 'lab-org-hierarchy-build',
        title: 'Organization Hierarchy Analyzer',
        ...lab,
        style: 'from-signature',
        skills: ['tree_dfs', 'recursion_return', 'recursion_base_case'],
        minutes: 35,
        prompt: lines(
          'HR stores the company as a tree of `Employee` objects. Each one has a `name`, a `salary` and a list of direct `reports`.',
          "The starter gives `Employee` and `build_org`, which turns a spec like `('Ana', 300, [...])` into objects. Do not change them.",
          "A person's **team** is that person plus everyone below them, at any depth.",
          '',
          'Build the four functions in the starter. Each takes the boss of a team.',
          '1. `team_size(boss)` returns how many people are in the team.',
          '2. `levels(boss)` returns how many levels the team has. A boss with no reports is 1 level.',
          '3. `payroll(boss)` returns the total salary of the team.',
          '4. `top_earner(boss)` returns the name of the highest-paid person in the team.',
          '',
          'For `top_earner`, a tie goes to the person met first. Check the boss first, then each report in list order.',
          '',
          'Examples:',
          "- `team_size(build_org(('Ana', 300, [('Ben', 150, []), ('Cal', 200, [])])))` → `3`",
          "- `levels(build_org(('Solo', 50, [])))` → `1`",
          "- `top_earner(build_org(('Ana', 100, [('Ben', 150, []), ('Cal', 150, [])])))` → `'Ben'`",
        ),
        starterCode: ORG_STARTER,
        solution: ORG_BUILD,
        tests: [
          t.eq(`team_size(build_org(${ORG}))`, '7'),
          t.eq(`levels(build_org(${ORG}))`, '4'),
          t.eq(`payroll(build_org(${ORG}))`, '1050'),
          t.eq(`top_earner(build_org(${ORG}))`, "'Ana'"),
          t.eq(`top_earner(build_org(${ORG_TIE}))`, "'Ben'"),
          t.eq("team_size(build_org(('Solo', 50, [])))", '1'),
          t.hidden("levels(build_org(('Solo', 50, [])))", '1'),
          t.hidden("payroll(build_org(('Solo', 50, [])))", '50'),
          t.hidden("top_earner(build_org(('Ben', 150, [('Dee', 90, []), ('Eli', 160, [])])))", "'Eli'"),
          t.hidden("team_size(build_org(('Cal', 200, [('Fay', 80, [('Gus', 70, [])])])))", '3'),
          t.hidden("levels(build_org(('A', 1, [('B', 1, []), ('C', 1, []), ('D', 1, [])])))", '2'),
          t.hidden("top_earner(build_org(('A', 10, [('B', 5, [('C', 99, [])]), ('D', 99, [])])))", "'C'"),
        ],
      }),
      code({
        id: 'lab-org-hierarchy-change',
        title: 'Organization Hierarchy Analyzer: chain of command',
        ...lab,
        style: 'modify',
        skills: ['tree_dfs', 'recursion_return', 'list_append'],
        minutes: 20,
        prompt: lines(
          'Change request: HR wants to see who someone reports to, all the way up.',
          'Your build from the lab is loaded. Keep it working and add one function.',
          '',
          '1. `chain_of_command(boss, name)` returns the names from `boss` down to the person called `name`, in order.',
          '2. If nobody in the team has that name, return `[]`.',
          '3. Names are unique.',
          '',
          'Examples:',
          "- `chain_of_command(build_org(('Ana', 300, [('Ben', 150, [('Eli', 160, [])])])), 'Eli')` → `['Ana', 'Ben', 'Eli']`",
          "- `chain_of_command(build_org(('Ana', 300, [])), 'Ana')` → `['Ana']`",
          "- `chain_of_command(build_org(('Ana', 300, [])), 'Zed')` → `[]`",
        ),
        starterCode: ORG_BUILD,
        solution: ORG_CHANGE,
        tests: [
          t.eq(`chain_of_command(build_org(${ORG}), 'Gus')`, "['Ana', 'Cal', 'Fay', 'Gus']"),
          t.eq(`chain_of_command(build_org(${ORG}), 'Eli')`, "['Ana', 'Ben', 'Eli']"),
          t.eq(`chain_of_command(build_org(${ORG}), 'Ana')`, "['Ana']"),
          t.eq(`chain_of_command(build_org(${ORG}), 'Zed')`, '[]'),
          t.eq(`team_size(build_org(${ORG}))`, '7'),
          t.eq(`top_earner(build_org(${ORG_TIE}))`, "'Ben'"),
          t.hidden("chain_of_command(build_org(('Ben', 150, [('Dee', 90, []), ('Eli', 160, [])])), 'Gus')", '[]'),
          t.hidden("chain_of_command(build_org(('Solo', 50, [])), 'Solo')", "['Solo']"),
          t.hidden(`levels(build_org(${ORG}))`, '4'),
          t.hidden(`payroll(build_org(${ORG}))`, '1050'),
        ],
      }),

      // ── Searchable Category Tree ──
      code({
        id: 'lab-category-tree-build',
        title: 'Searchable Category Tree',
        ...lab,
        style: 'from-signature',
        skills: ['bst_property', 'tree_inorder', 'treenode'],
        minutes: 35,
        prompt: lines(
          'A store files its category ids in a binary search tree of `TreeNode`s. Each `val` is an id.',
          'Smaller ids go in the left subtree and larger ids go in the right subtree.',
          '',
          'Build the four functions in the starter:',
          '1. `insert(root, key)` adds `key` in the right place and returns the root. Ignore a key that is already there.',
          '2. `build_catalog(keys)` inserts the keys in order into an empty tree and returns the root.',
          '3. `contains(root, key)` returns `True` if `key` is in the tree. Walk down one path only.',
          '4. `in_range(root, low, high)` returns the ids from `low` to `high`, both included, smallest first.',
          '',
          'In `in_range`, skip a subtree when none of its ids can be in range.',
          'The tree may be empty (`None`).',
          '',
          'Examples:',
          '- `contains(build_catalog([50, 30, 70]), 30)` → `True`',
          '- `in_range(build_catalog([50, 30, 70, 20, 40, 60, 80]), 35, 65)` → `[40, 50, 60]`',
          '- `in_range(None, 1, 5)` → `[]`',
        ),
        starterCode: CATEGORY_STARTER,
        solution: CATEGORY_BUILD,
        tests: [
          t.eq(`tree_to_array(${CAT})`, '[50, 30, 70, 20, 40, 60, 80]'),
          t.eq('tree_to_array(build_catalog([5, 3, 8, 3]))', '[5, 3, 8]'),
          t.eq('tree_to_array(insert(None, 7))', '[7]'),
          t.eq(`contains(${CAT}, 40)`, 'True'),
          t.eq(`contains(${CAT}, 45)`, 'False'),
          t.eq(`in_range(${CAT}, 35, 65)`, '[40, 50, 60]'),
          t.eq(`in_range(${CAT}, 0, 100)`, '[20, 30, 40, 50, 60, 70, 80]'),
          t.hidden('tree_to_array(build_catalog([1, 2, 3]))', '[1, None, 2, None, 3]'),
          t.hidden('contains(None, 1)', 'False'),
          t.hidden(`in_range(${CAT}, 81, 90)`, '[]'),
          t.hidden('in_range(None, 1, 5)', '[]'),
          t.hidden(`in_range(${CAT}, 30, 30)`, '[30]'),
          t.hidden('build_catalog([])', 'None'),
        ],
      }),
      code({
        id: 'lab-category-tree-change',
        title: 'Searchable Category Tree: nearest id',
        ...lab,
        style: 'modify',
        skills: ['bst_property', 'while_loop', 'treenode'],
        minutes: 20,
        prompt: lines(
          'Change request: a typed id often does not exist. The store wants the nearest real one.',
          'Your build from the lab is loaded. Keep it working and add two functions.',
          '',
          '1. `at_or_below(root, key)` returns the largest id that is at most `key`, or `None`.',
          '2. `at_or_above(root, key)` returns the smallest id that is at least `key`, or `None`.',
          '3. Each walks down one path from the root. Do not list the whole tree.',
          '',
          'Examples:',
          '- `at_or_below(build_catalog([50, 30, 70, 20, 40]), 45)` → `40`',
          '- `at_or_above(build_catalog([50, 30, 70]), 71)` → `None`',
          '- `at_or_below(None, 5)` → `None`',
        ),
        starterCode: CATEGORY_BUILD,
        solution: CATEGORY_CHANGE,
        tests: [
          t.eq(`at_or_below(${CAT}, 45)`, '40'),
          t.eq(`at_or_below(${CAT}, 50)`, '50'),
          t.eq(`at_or_below(${CAT}, 10)`, 'None'),
          t.eq(`at_or_above(${CAT}, 45)`, '50'),
          t.eq(`at_or_above(${CAT}, 81)`, 'None'),
          t.eq(`in_range(${CAT}, 35, 65)`, '[40, 50, 60]'),
          t.eq(`contains(${CAT}, 40)`, 'True'),
          t.hidden(`at_or_below(${CAT}, 99)`, '80'),
          t.hidden(`at_or_above(${CAT}, 20)`, '20'),
          t.hidden('at_or_above(None, 5)', 'None'),
          t.hidden(`at_or_above(${CAT}, 61)`, '70'),
          t.hidden('tree_to_array(build_catalog([5, 3, 8, 3]))', '[5, 3, 8]'),
        ],
      }),

      // ── Building Evacuation Map ──
      code({
        id: 'lab-evacuation-map-build',
        title: 'Building Evacuation Map',
        ...lab,
        style: 'from-signature',
        skills: ['grid_neighbors', 'bfs', 'visited_set'],
        minutes: 45,
        prompt: lines(
          "A floor plan is a list of strings. `'E'` is an exit, `'#'` is a wall and `'.'` is a room.",
          'People move one cell up, down, left or right per step. They cannot pass through walls.',
          '',
          'Build the four functions in the starter:',
          '1. `find_exits(grid)` returns the `(row, col)` of every exit, top row first, left to right.',
          '2. `steps_to_exit(grid)` returns a grid of numbers: the steps from each cell to its nearest exit.',
          '3. In that grid, exits are 0 and walls are `None`. A room with no way out is -1.',
          '4. `trapped_rooms(grid)` returns the `(row, col)` of every room with no way out, top row first.',
          '5. `longest_escape(grid)` returns the most steps any room needs. If no room can get out, return 0.',
          '',
          'Start the search from every exit at once. Visit each cell once.',
          '',
          "Examples:",
          "- `find_exits(['E..#', '.#..', '...E'])` → `[(0, 0), (2, 3)]`",
          "- `steps_to_exit(['.#E'])` → `[[-1, None, 0]]` (the wall blocks the room)",
          "- `longest_escape(['E....'])` → `4`",
        ),
        starterCode: EVAC_STARTER,
        solution: EVAC_BUILD,
        tests: [
          t.eq(`find_exits(${G})`, '[(0, 0), (2, 3)]'),
          t.eq(`steps_to_exit(${G})`, '[[0, 1, 2, None], [1, None, 2, 1], [2, 2, 1, 0]]'),
          t.eq(`steps_to_exit(${TRAP})`, '[[0, 1, None, -1], [1, 2, None, -1], [None, None, None, -1]]'),
          t.eq(`trapped_rooms(${TRAP})`, '[(0, 3), (1, 3), (2, 3)]'),
          t.eq(`trapped_rooms(${G})`, '[]'),
          t.eq(`longest_escape(${G})`, '2'),
          t.eq("longest_escape(['E....'])", '4'),
          t.hidden("find_exits(['..'])", '[]'),
          t.hidden("steps_to_exit(['E'])", '[[0]]'),
          t.hidden("steps_to_exit(['.#E'])", '[[-1, None, 0]]'),
          t.hidden('steps_to_exit([])', '[]'),
          t.hidden("trapped_rooms(['..', '..'])", '[(0, 0), (0, 1), (1, 0), (1, 1)]'),
          t.hidden("longest_escape(['#', 'E'])", '0'),
          t.hidden("longest_escape(['..'])", '0'),
        ],
      }),
      code({
        id: 'lab-evacuation-map-change',
        title: 'Building Evacuation Map: locked exits',
        ...lab,
        style: 'modify',
        skills: ['grid_neighbors', 'bfs', 'set_membership'],
        minutes: 20,
        prompt: lines(
          'Change request: during a drill some exits are locked.',
          'Your build from the lab is loaded. Update it.',
          '',
          '1. Every function takes an extra argument `closed`: a list of `(row, col)` positions of locked exits. It defaults to empty.',
          '2. A locked exit acts like a wall. In `steps_to_exit` it is `None`.',
          '3. `find_exits` returns only the open exits.',
          '4. A position in `closed` that is not an exit changes nothing.',
          '5. Called without `closed`, everything works as before.',
          '',
          'Examples:',
          "- `steps_to_exit(['E.E'], [(0, 2)])` → `[[0, 1, None]]`",
          "- `longest_escape(['E..#', '.#..', '...E'], [(2, 3)])` → `4`",
          "- `steps_to_exit(['E.'], [(0, 1)])` → `[[0, 1]]` (not an exit)",
        ),
        starterCode: EVAC_BUILD,
        solution: EVAC_CHANGE,
        tests: [
          t.eq(`steps_to_exit(${G}, [(2, 3)])`, '[[0, 1, 2, None], [1, None, 3, 4], [2, 3, 4, None]]'),
          t.eq(`longest_escape(${G}, [(2, 3)])`, '4'),
          t.eq(`find_exits(${G}, [(0, 0)])`, '[(2, 3)]'),
          t.eq(`trapped_rooms(${G}, [(0, 0), (2, 3)])`, '[(0, 1), (0, 2), (1, 0), (1, 2), (1, 3), (2, 0), (2, 1), (2, 2)]'),
          t.eq("steps_to_exit(['E.E'], [(0, 2)])", '[[0, 1, None]]'),
          t.eq(`steps_to_exit(${G})`, '[[0, 1, 2, None], [1, None, 2, 1], [2, 2, 1, 0]]'),
          t.eq(`trapped_rooms(${TRAP})`, '[(0, 3), (1, 3), (2, 3)]'),
          t.hidden("steps_to_exit(['E.'], [(0, 1)])", '[[0, 1]]'),
          t.hidden(`find_exits(${G})`, '[(0, 0), (2, 3)]'),
          t.hidden("longest_escape(['E....'])", '4'),
          t.hidden("longest_escape(['E..'], [(0, 0)])", '0'),
        ],
      }),

      // ── Social Network Explorer ──
      code({
        id: 'lab-social-network-build',
        title: 'Social Network Explorer',
        ...lab,
        style: 'from-signature',
        skills: ['graph_adjacency', 'connected_components', 'graph_bfs'],
        minutes: 40,
        prompt: lines(
          '`people` is a list of names. `pairs` is a list of `(a, b)` friendships. A friendship goes both ways.',
          'A pair may appear twice. Ignore a pair of a person with themselves.',
          '',
          'Build the four functions in the starter:',
          '1. `build_friends(people, pairs)` returns a dict from every person to a sorted list of their friends, each once.',
          '2. `reachable(people, pairs, person)` returns everyone `person` can reach through friends of friends. Sort it and leave out `person`.',
          '3. `friend_groups(people, pairs)` returns each group of connected people as a sorted list. Sort the list of groups too.',
          '4. `degrees_apart(people, pairs, a, b)` returns the fewest friendship steps from `a` to `b`. Return 0 if `a` is `b` and -1 if there is no path.',
          '',
          'Examples:',
          "- `build_friends(['zed'], [])` → `{'zed': []}`",
          "- `reachable(['ana', 'ben', 'cy'], [('ana', 'ben')], 'ana')` → `['ben']`",
          "- `friend_groups(['b', 'a', 'c'], [('a', 'c')])` → `[['a', 'c'], ['b']]`",
          "- `degrees_apart(['ana', 'ben', 'cy'], [('ana', 'ben'), ('ben', 'cy')], 'ana', 'cy')` → `2`",
        ),
        starterCode: SOCIAL_STARTER,
        solution: SOCIAL_BUILD,
        tests: [
          t.eq("build_friends(['ana', 'ben', 'cy'], [('ana', 'ben'), ('cy', 'ben'), ('ben', 'ana')])", "{'ana': ['ben'], 'ben': ['ana', 'cy'], 'cy': ['ben']}"),
          t.eq("build_friends(['zed'], [])", "{'zed': []}"),
          t.eq(`reachable(${NET}, 'ana')`, "['ben', 'cy', 'dee']"),
          t.eq(`reachable(${NET}, 'fay')`, "['eve']"),
          t.eq(`friend_groups(${NET})`, "[['ana', 'ben', 'cy', 'dee'], ['eve', 'fay']]"),
          t.eq(`degrees_apart(${NET}, 'ana', 'dee')`, '3'),
          t.eq(`degrees_apart(${NET}, 'ana', 'eve')`, '-1'),
          t.hidden("build_friends(['a'], [('a', 'a')])", "{'a': []}"),
          t.hidden("reachable(['solo'], [], 'solo')", '[]'),
          t.hidden("friend_groups(['b', 'a', 'c'], [])", "[['a'], ['b'], ['c']]"),
          t.hidden(`degrees_apart(${NET}, 'cy', 'cy')`, '0'),
          t.hidden(`degrees_apart(${PEOPLE}, [('ana', 'ben'), ('ben', 'cy'), ('cy', 'dee'), ('ana', 'dee')], 'ana', 'dee')`, '1'),
          t.hidden("reachable(['a', 'b', 'c'], [('a', 'b'), ('b', 'c'), ('c', 'a')], 'a')", "['b', 'c']"),
        ],
      }),
      code({
        id: 'lab-social-network-change',
        title: 'Social Network Explorer: friend suggestions',
        ...lab,
        style: 'modify',
        skills: ['graph_adjacency', 'frequency_map', 'sort_key'],
        minutes: 25,
        prompt: lines(
          'Change request: the app wants a "people you may know" list.',
          'Your build from the lab is loaded. Keep it working and add one function.',
          '',
          '1. `suggestions(people, pairs, person)` returns the people exactly two steps from `person`.',
          '2. Leave out `person` and anyone who is already their friend.',
          '3. A **mutual friend** is a friend of both. Put the people with the most mutual friends first.',
          '4. Break ties by name, A to Z.',
          '',
          'Examples:',
          "- `suggestions(['a', 'b', 'c', 'd'], [('a', 'b'), ('b', 'd'), ('b', 'c')], 'a')` → `['c', 'd']`",
          "- `suggestions(['solo'], [], 'solo')` → `[]`",
        ),
        starterCode: SOCIAL_BUILD,
        solution: SOCIAL_CHANGE,
        tests: [
          t.eq(`suggestions(${SQUARE}, 'ana')`, "['dee', 'eve']"),
          t.eq(`suggestions(${SQUARE}, 'ben')`, "['cy']"),
          t.eq(`suggestions(${NET}, 'ana')`, "['cy']"),
          t.eq(`suggestions(${NET}, 'eve')`, '[]'),
          t.eq(`reachable(${NET}, 'ana')`, "['ben', 'cy', 'dee']"),
          t.eq(`friend_groups(${NET})`, "[['ana', 'ben', 'cy', 'dee'], ['eve', 'fay']]"),
          t.hidden("suggestions(['a', 'b', 'c', 'd'], [('a', 'b'), ('b', 'd'), ('b', 'c')], 'a')", "['c', 'd']"),
          t.hidden("suggestions(['solo'], [], 'solo')", '[]'),
          t.hidden(`suggestions(${SQUARE}, 'eve')`, "['ana', 'dee']"),
          t.hidden(`degrees_apart(${NET}, 'ana', 'dee')`, '3'),
          t.hidden(`degrees_apart(${NET}, 'ana', 'eve')`, '-1'),
        ],
      }),
    ],
  },
]
