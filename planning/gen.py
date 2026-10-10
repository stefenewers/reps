"""Rebuilds the 90-day schedule (planning/problems.csv) from the original problem list.

Run from the repo root:  python3 planning/gen.py

Inputs : problems.csv (the original plan's list: metadata + verified video links)
Outputs: planning/problems.csv   day-by-day schedule, Sun Oct 11 2026 -> Fri Jan 8 2027
         planning/stretch.csv    everything not scheduled, in priority order
         planning/weeks.md       the weekly table that plan.md embeds

Sized from measured data (Supabase, Oct 2-8 2026), not from a target:
  - 7 LeetCode-style problems ever passed, 4 unaided
  - sustained focused time ~2-3 h/day (two outlier days of 6-8 h)
So: 1 new problem a day in week 1, then 2 (1 on Saturdays), never 3-4.
"""
import csv, datetime as dt, collections, re, os

START = dt.date(2026, 10, 11)          # Sunday: day 1 is a deliberately small day
END = dt.date(2027, 1, 8)              # day 90
OFF = {dt.date(2026, 11, 26), dt.date(2026, 11, 27), dt.date(2026, 12, 24), dt.date(2026, 12, 25), dt.date(2027, 1, 1)}
BUFFER = [(dt.date(2026, 11, 23), dt.date(2026, 11, 28)), (dt.date(2026, 12, 21), dt.date(2026, 12, 26))]
SOFT_END = dt.date(2026, 10, 17)       # soft start: week 1
BUILD_END = dt.date(2026, 11, 7)       # build: weeks 2-4
FINAL = dt.date(2027, 1, 4)            # final week: mocks first
STEPS = [3, 10, 30]                    # re-solve gaps in days (Cepeda et al. 2008: gap grows with how long you need to remember)

BLIND75 = {1,121,217,238,53,152,153,33,15,11,371,191,338,268,190,70,322,300,1143,139,39,198,213,91,62,55,133,207,417,200,128,269,261,323,57,56,435,252,253,206,141,21,23,19,143,73,54,48,79,3,424,76,242,49,20,125,5,647,271,104,100,226,124,102,297,572,105,98,230,235,208,211,212,347,295}
CORE_HARDS_TO_STRETCH = {269, 212, 297, 295}   # the four hardest core problems wait until you are ahead
# Tier 2, in rough order of how early they would be dropped if capacity shrinks (last = first to go).
TIER2 = [146, 560, 167, 739, 704, 215, 994, 78, 46, 210, 543, 199, 155, 150, 22, 875, 74, 2, 138, 110, 695, 236,
         703, 973, 621, 17, 283, 680, 209, 1004, 34, 567, 36, 287, 1448, 1046, 981, 684, 743, 746, 416, 45, 763, 1249, 72, 202]
# Already solved inside Reps (Dictionary ladder): re-solves in week 1, no video needed.
SEEDS = [  # (date, lc, title, pattern, difficulty)
    (dt.date(2026, 10, 11), 217, None, None, None),
    (dt.date(2026, 10, 12), 242, None, None, None),
    (dt.date(2026, 10, 13), 387, 'First Unique Character in a String', 'Frequency map + second pass', 'Easy'),
    (dt.date(2026, 10, 14), 169, 'Majority Element', 'Frequency map', 'Easy'),
    (dt.date(2026, 10, 15), 383, 'Ransom Note', 'Frequency map as a budget', 'Easy'),
    (dt.date(2026, 10, 16), 219, 'Contains Duplicate II', 'Value -> last index map', 'Easy'),
]

FAMILIES = [  # first match wins; the first scheduled problem of each family is "study-first"
    ('prefix', 'prefix sums'), ('monotonic', 'monotonic stack / deque'), ('sliding window', 'sliding window'), ('window', 'sliding window'),
    ('stack', 'stack'), ('binary search', 'binary search'), ('trie', 'trie'), ('union-find', 'union-find'),
    ('topo', 'topological sort'), ('dijkstra', 'weighted shortest path'), ('bellman', 'weighted shortest path'), ('mst', 'minimum spanning tree'),
    ('backtracking', 'backtracking'), ('heap', 'heaps'), ('interval', 'intervals'),
    ('linked list', 'linked lists'), ('dummy head', 'linked lists'), ('fast/slow', 'linked lists'), ('floyd', 'linked lists'), ('two-gap', 'linked lists'), ('node copy', 'linked lists'),
    ('bst', 'binary search trees'), ('inorder', 'binary search trees'), ('tree bfs', 'tree BFS'), ('tree', 'tree DFS'), ('preorder', 'tree DFS'),
    ('multi-source', 'graph BFS'), ('bfs', 'graph BFS'), ('grid dfs', 'grid / graph DFS'), ('graph', 'grid / graph DFS'), ('dfs', 'grid / graph DFS'),
    ('2d dp', '2D DP'), ('knapsack', '1D DP'), ('1d dp', '1D DP'), ('dp', '1D DP'), ('kadane', '1D DP'), ('expand around', 'palindromes'),
    ('greedy', 'greedy'), ('matrix', 'matrix'), ('two pointers', 'two pointers'), ('pointers', 'two pointers'),
    ('hash', 'hashing'), ('frequency', 'hashing'), ('string', 'strings'),
]

def family(pattern):
    p = pattern.lower()
    for key, fam in FAMILIES:
        if key in p:
            return fam
    return 'other'

def is_buffer(d):
    return any(a <= d <= b for a, b in BUFFER)

def is_study(d):
    if d == START:
        return True
    return START <= d <= END and d.weekday() != 6 and d not in OFF

def new_cap(d):
    if not is_study(d) or is_buffer(d):
        return 0
    if d <= SOFT_END:
        return 1
    if d >= FINAL:
        return 1
    return 1 if d.weekday() == 5 else 2

def review_cap(d):
    if not is_study(d):
        return 0
    sat = d.weekday() == 5
    if d <= SOFT_END:
        return 2
    if is_buffer(d):
        return 4 if sat else 6
    if d <= BUILD_END:
        return 3 if sat else 4
    return 3 if sat else 6

def week_of(d):
    return 1 if d <= SOFT_END else (d - dt.date(2026, 10, 12)).days // 7 + 1

def main():
    src = list(csv.DictReader(open('problems.csv')))
    meta = {}
    for r in src:  # one metadata row per problem, in the original (NeetCode roadmap) order
        meta.setdefault(int(r['lc']), r)
    order = [int(r['lc']) for r in src if r['type'] == 'new']
    order = list(dict.fromkeys(order))

    def tier(lc):
        if lc in BLIND75 and lc not in CORE_HARDS_TO_STRETCH:
            return 1
        return 2 if lc in TIER2 else 3

    days = [START + dt.timedelta(n) for n in range((END - START).days + 1)]
    capacity = sum(new_cap(d) for d in days)
    chosen = [lc for lc in order if tier(lc) <= 2]
    drop = list(reversed(TIER2))
    while len(chosen) > capacity:           # never drop core; drop the lowest-priority tier 2 first
        chosen.remove(next(lc for lc in drop if lc in chosen))
    stretch = [lc for lc in order if lc not in chosen]
    # From dynamic programming on, core problems go first so a slip costs tier 2, not core.
    cut = chosen.index(70)
    tail = chosen[cut:]
    chosen = chosen[:cut] + [lc for lc in tail if tier(lc) == 1] + [lc for lc in tail if tier(lc) == 2]

    rows, queue, seen_family, placed = [], [], set(), {}
    seeds = collections.defaultdict(list)
    for d, lc, title, pattern, diff in SEEDS:
        seeds[d].append(lc)
        if title:
            meta[lc] = dict(lc=str(lc), title=title, pattern=pattern, difficulty=diff, source='reps', reps_capstone='Y', neetcode_video='', video_length='')
    it = iter(chosen)

    def emit(d, lc, kind, mode=''):
        m = meta[lc]
        rows.append(dict(week=week_of(d), day=d.strftime('%a'), date=d.isoformat(), lc=lc, title=m['title'], pattern=m['pattern'], difficulty=m['difficulty'],
                         source=m['source'], type=kind, reps_capstone=m['reps_capstone'], neetcode_video=m['neetcode_video'], video_length=m['video_length'],
                         tier=('seed' if m['source'] == 'reps' or lc in (217, 242) else tier(lc)), mode=mode))

    for d in days:
        if not is_study(d):
            continue
        used = 0
        for lc in seeds.get(d, []):         # already-solved problems: first cold re-solve, then the normal +10 / +30
            emit(d, lc, 'review1')
            used += 1
            for i, gap in enumerate(STEPS[1:], start=2):
                queue.append((i, d + dt.timedelta(gap), lc))
        due = sorted([q for q in queue if q[1] <= d], key=lambda q: (q[0], q[1]))
        for q in due[: max(0, review_cap(d) - used)]:
            queue.remove(q)
            emit(d, q[2], f'review{q[0]}')
        for _ in range(new_cap(d)):
            lc = next(it, None)
            if lc is None:
                break
            fam = family(meta[lc]['pattern'])
            mode = 'attempt-first' if fam in seen_family else 'study-first'
            seen_family.add(fam)
            emit(d, lc, 'new', mode)
            placed[lc] = d
            for i, gap in enumerate(STEPS, start=1):
                queue.append((i, d + dt.timedelta(gap), lc))

    rows.sort(key=lambda r: (r['date'], 0 if r['type'] != 'new' else 1))
    cols = ['week', 'day', 'date', 'lc', 'title', 'pattern', 'difficulty', 'source', 'type', 'reps_capstone', 'neetcode_video', 'video_length', 'tier', 'mode']
    os.makedirs('planning', exist_ok=True)
    with open('planning/problems.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    with open('planning/stretch.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['lc', 'title', 'pattern', 'difficulty', 'source', 'why_not_scheduled', 'neetcode_video'])
        for lc in sorted(stretch, key=lambda x: (tier(x) if x not in CORE_HARDS_TO_STRETCH else 0, order.index(x))):
            m = meta[lc]
            why = 'core Hard: do when ahead' if lc in CORE_HARDS_TO_STRETCH else ('tier 2: first in when ahead' if lc in TIER2 else 'tier 3: extra depth')
            w.writerow([lc, m['title'], m['pattern'], m['difficulty'], m['source'], why, m['neetcode_video']])

    # ---- summary for plan.md
    by_week = collections.defaultdict(lambda: dict(new=[], rev=0, dates=[]))
    for r in rows:
        b = by_week[r['week']]
        b['dates'].append(r['date'])
        if r['type'] == 'new':
            b['new'].append(str(r['lc']))
        else:
            b['rev'] += 1
    lines = ['| Wk | Dates | New | New problems (LC) | Re-solves |', '|---|---|---|---|---|']
    for wk in sorted(by_week):
        b = by_week[wk]
        a, z = min(b['dates']), max(b['dates'])
        fmt = lambda s: dt.date.fromisoformat(s).strftime('%b %-d')
        lines.append(f"| {wk} | {fmt(a)}–{fmt(z)} | {len(b['new'])} | {', '.join(b['new']) or '—'} | {b['rev']} |")
    open('planning/weeks.md', 'w').write('\n'.join(lines) + '\n')

    new_rows = [r for r in rows if r['type'] == 'new']
    def solved_by(d):
        return sum(1 for r in new_rows if r['date'] <= d.isoformat())
    print(f'capacity {capacity} new slots; scheduled {len(new_rows)} new + {len(rows) - len(new_rows)} re-solves; stretch {len(stretch)}')
    print('core (tier 1) scheduled:', sum(1 for r in new_rows if r['tier'] == 1), '| tier 2:', sum(1 for r in new_rows if r['tier'] == 2))
    print('study-first:', sum(1 for r in new_rows if r['mode'] == 'study-first'), '| families:', len(seen_family))
    print('re-solves left for maintenance after Jan 8:', len(queue), collections.Counter(q[0] for q in queue))
    for name, d in [('day 30', START + dt.timedelta(29)), ('day 60', START + dt.timedelta(59)), ('day 90', END)]:
        print(name, d, 'new problems done by then:', solved_by(d))
    per_day = collections.Counter((r['date'], r['type'] == 'new') for r in rows)
    print('max re-solves in a day:', max(v for (d, n), v in per_day.items() if not n), '| max new in a day:', max(v for (d, n), v in per_day.items() if n))
    last_core = max(r['date'] for r in new_rows if r['tier'] == 1)
    print('last core problem lands on', last_core)

if __name__ == '__main__':
    main()
