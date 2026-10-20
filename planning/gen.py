"""Builds the 90-day ladder plan: every pattern, and every problem, is learned the way dictionaries were.

    unit    = primer + ladder in Reps (ground up) -> mastery check (cold reps, no solution)
              -> for each target problem: its bridge (the moves the ladder did not teach) -> the problem
              -> spaced re-solves (+3 / +10 / +30 days)

A LeetCode problem is the final integration test of a prerequisite graph. No problem is scheduled
without one: a target needs a bridge in data/exercises/bridges (or is a Reps capstone, whose ladder
sections are its graph).

Run from the repo root:
    npx tsx scripts/export-ladders.ts     # refresh planning/reps-sections.json and planning/bridges.json
    python3 planning/gen.py

Inputs : archive/first-plan/problems.csv the original problem list (metadata + verified video links)
         planning/reps-sections.json     every authored Reps section and rep
         planning/bridges.json           each target's bridge section and mode; ladders and checks added by the packs
         planning/done.json              rep ids already passed (from Supabase, Oct 10)
Outputs: data/schedule-90.ts             what the app reads: per day, Reps reps + LeetCode problems
         planning/problems.csv           the LeetCode side, day by day
         planning/stretch.csv            unscheduled problems, in priority order
         planning/weeks.md               weekly summary for plan.md

Sized from measured pace (Oct 2-8): Reps reps take ~2.25-2.5x their authored minutes;
a LeetCode problem reached through a ladder took ~12 min, one reached cold 45-70 min.
"""
import csv, datetime as dt, collections, json, re, os

SOURCE_CSV = 'archive/first-plan/problems.csv'   # the first plan's problem list: metadata + verified video links

START = dt.date(2026, 10, 12)             # Day 1 (a Monday)
END = dt.date(2027, 1, 9)                # Day 90
OFF = {dt.date(2026, 11, 26), dt.date(2026, 11, 27), dt.date(2026, 12, 24), dt.date(2026, 12, 25), dt.date(2027, 1, 1)}
BUFFER = [(dt.date(2026, 11, 23), dt.date(2026, 11, 28)), (dt.date(2026, 12, 21), dt.date(2026, 12, 26))]
SOFT_END = dt.date(2026, 10, 17)
BUILD_END = dt.date(2026, 11, 7)
FINAL = dt.date(2027, 1, 4)
STEPS = [3, 10, 30]
# A re-solve may slide a little to miss a Sunday, a day off or a full day, but never outside its window (days after the first solve).
WINDOWS = {1: (3, 4), 2: (10, 12), 3: (30, 33)}
REVIEW_CAPS = {'off': (0, 0), 'soft': (2, 2), 'build': (3, 2), 'full': (5, 3), 'buffer': (5, 4), 'final': (5, 5)}   # (weekday, Saturday)

REPS_FACTOR = 2.25                      # real minutes per authored Reps minute (measured 2.5 on dictionaries; later ladders reuse earlier moves)
LC_COST = {'Easy': 25, 'Medium': 40, 'Hard': 60}
STUDY_FIRST_EXTRA = 10                  # a study-first problem: the walkthrough is part of the sequence
MAX_NEW_LC = 2                          # new LeetCode problems in one day, whatever the minute budget says
# A Reps capstone is a problem reached through its ladder: it costs what a LeetCode problem of its difficulty costs
# (measured: ladder-reached solves took 3-13 min), not its authored minutes times the rep factor.
# The ladders and bridges together are more than 90 days hold at this pace, so the plan is trimmed in this order:
#   1. redundant low-value reps leave the pattern ladders (they stay in the app as extras): explain reps (the solve
#      log and the mocks train explanation) and variations beyond each section's spine (SPINE_EARLY / SPINE_LATE);
#   2. the lowest-value target problems wait in the "when ahead" list with their bridges intact (DEMOTE, in order).
# The building-block method itself is never trimmed: no problem is scheduled without its bridge.
# Most reps of each kind a pattern-ladder section keeps. Ladders get shorter after the first month: by then the
# Python underneath is owned and each new pattern reuses earlier moves (EARLY = the units that start in days 1-30).
SPINE_EARLY = {'output': 1, 'choice': 1, 'reorder': 1, 'write': 2, 'scratch': 4, 'debug': 2, 'explain': 0}
SPINE_LATE = {'output': 1, 'choice': 1, 'reorder': 1, 'write': 1, 'scratch': 3, 'debug': 2, 'explain': 0}
EARLY_UNITS = 5
# Practice links: NeetCode, where solves sync to GitHub, from the one mapping the app also reads (data/problem-urls.json).
# A problem with no NeetCode page keeps its LeetCode link; the app labels it "LeetCode only".
PROBLEM_URLS = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'problem-urls.json')))
def problem_url(lc, title):
    m = PROBLEM_URLS.get(str(lc))
    if m is None: raise SystemExit(f'LC {lc} ({title}) has no entry in data/problem-urls.json')
    return m['neetcode'] or m['leetcode']
# Teaching comes before testing. Whatever the spine trims, a ladder section always keeps:
#   - the first rep to carry a skill (a first exposure: exported as `first`);
#   - the unlabeled transfer rep before a capstone (`transfer`);
#   - the lead-in reps below: the trace or first guided rep of a move that a later scheduled rep, a mastery check or a
#     capstone relies on. (Found by the Oct 13 teaching audit: each was being skipped, so its move was first met in a
#     debug rep, a check or the capstone itself.)
KEEP = {
    'd4-win-trace-variable',    # the variable window is traced before it is written
    'd4-ws-distinct-windows',   # count-dict window code is written before it is debugged
    'd4-st-round-balanced',     # the simplest stack rep before depth and pairs
    'd06-dfs-count',            # the first tree function written: this node plus both subtrees
    'd06-dfs-max',              # combining left and right with max, before Maximum Depth
    'o8-a-in-degree',           # in-degree on its own before Kahn's algorithm
    'd9-sort-tuples',           # the tuple key is traced before it is written
    'd10-dt-include-exclude',   # the decision tree is traced before it is walked
    'd10-roll-robber-trace',    # take-or-skip is traced before House Robber
}
DEMOTE = [76, 124, 23, 271, 417, 105, 1143, 211, 261, 143, 5, 79, 435, 73, 139, 33, 230, 57, 300, 62]

BLIND75 = {1,121,217,238,53,152,153,33,15,11,371,191,338,268,190,70,322,300,1143,139,39,198,213,91,62,55,133,207,417,200,128,269,261,323,57,56,435,252,253,206,141,21,23,19,143,73,54,48,79,3,424,76,242,49,20,125,5,647,271,104,100,226,124,102,297,572,105,98,230,235,208,211,212,347,295}
CORE_HARDS_TO_STRETCH = {269, 212, 297, 295}

# LeetCode number -> the Reps capstone that IS that problem. Solving the capstone is the first solve;
# its re-solves happen on LeetCode.
CAPSTONE_OF = {1: 'cap-two-sum', 242: 'cap-valid-anagram', 125: 'cap-valid-palindrome', 167: 'cap-two-sum-ii', 121: 'cap-best-time-stock',
               3: 'cap-longest-substring', 20: 'cap-valid-parentheses', 704: 'cap-binary-search', 206: 'cap-reverse-linked-list', 21: 'cap-merge-two-lists',
               104: 'cap-max-depth', 100: 'cap-same-tree', 226: 'cap-invert-tree', 102: 'cap-level-order', 200: 'cap-number-of-islands',
               207: 'cap-course-schedule', 215: 'cap-kth-largest', 347: 'cap-top-k-frequent', 56: 'cap-merge-intervals', 78: 'cap-subsets',
               70: 'cap-climbing-stairs', 198: 'cap-house-robber'}

# Units, in order. ladder = Reps sections; check = the mastery check; core/more = LeetCode numbers (more = tier 2, added only if they fit).
# planning/bridges.json adds the ladders and checks authored with the bridge packs (see apply_packs).
UNITS = [
    dict(name='Hashing', short='Hashing', ladder=['o2-dict-ladder', 'o2-valid-anagram', 'o2-index-maps', 'o2-complements', 'o2-two-sum'], check='o2-cold',
         core=[49, 128, 238, 271], more=[560, 36]),
    dict(name='Strings + two pointers', short='Pointers', ladder=['d3-strings', 'd3-slicing', 'd3-methods', 'd3-two-pointers', 'd3-pointer-updates', 'd3-running-state', 'd3-valid-palindrome', 'd3-stock', 'd3-two-sum-ii'], check='d3-cold',
         core=[11, 15], more=[283, 680]),
    dict(name='Sliding window', short='Windows', ladder=['d4-windows', 'd4-window-state', 'd4-longest-substring'], check=None,
         core=[424, 76], more=[209, 567, 1004]),
    dict(name='Stacks', short='Stacks', ladder=['d4-stacks', 'd4-matching', 'd4-valid-parentheses'], check='d4-cold',
         core=[], more=[155, 739, 150, 22, 1249]),
    dict(name='Binary search', short='Search', ladder=['d05-while', 'd05-bs', 'd05-variants', 'd05-cap-search'], check=None,
         core=[153, 33], more=[74, 875, 34, 981]),
    dict(name='Linked lists', short='Lists', ladder=['d05-listnode', 'd05-rewire', 'd05-cap-reverse', 'd05-dummy', 'd05-cap-merge'], check='d05-cold',
         core=[141, 19, 143, 23], more=[146, 2, 138, 287]),
    dict(name='Recursion + trees', short='Trees', ladder=['d06-functions', 'd06-recursion', 'd06-treenode', 'd06-dfs', 'd06-cap-depth', 'd06-pairs', 'd06-cap-same', 'd06-mutate', 'd06-cap-invert'], check='d06-cold',
         core=[572, 235, 98, 230, 105, 124], more=[543, 110, 236, 1448]),
    dict(name='Tries', short='Tries', ladder=[], check=None, core=[208, 211], more=[]),
    dict(name='BFS + grids', short='BFS', ladder=['o7-deque', 'o7-tree-bfs', 'o7-cap-level-order', 'o7-grids', 'o7-neighbors', 'o7-grid-bfs', 'o7-islands'], check='o7-cold',
         core=[], more=[199, 695, 994]),
    # o8-components is back (its capstone, Number of Provinces, is not): the Graphs check asks for a component count, so it is taught first.
    dict(name='Graphs', short='Graphs', ladder=['o8-adjacency', 'o8-dfs', 'o8-bfs', 'o8-cap-path-exists', 'o8-components', 'o8-cycles', 'o8-cap-course-schedule'], check='o8-cold',
         core=[133, 417, 261, 323], more=[210, 684, 743]),
    # d9-max-heap is back: later reps and the check need the negation trick, so it is taught first.
    dict(name='Sorting + heaps', short='Heaps', ladder=['d9-sorting', 'd9-keys', 'd9-freq-sort', 'd9-heapq', 'd9-max-heap', 'd9-top-k'], check=None,
         core=[], more=[703, 1046, 973, 621]),
    dict(name='Intervals', short='Intervals', ladder=['d9-intervals'], check='d9-cold',
         core=[57, 252, 435, 253], more=[]),
    dict(name='Backtracking', short='Backtracking', ladder=['d10-decisions', 'd10-path', 'd10-subsets'], check=None,
         core=[39, 79], more=[46, 17]),
    dict(name='Dynamic programming', short='DP', ladder=['d10-recurrence', 'd10-memo', 'd10-bottom-up', 'd10-rolling'], check='d10-cold',
         core=[213, 53, 55, 322, 139, 300, 5, 62, 1143], more=[91, 152, 647, 746, 416, 45, 763, 72]),
    dict(name='Matrix', short='Matrix', ladder=[], check=None, core=[48, 54, 73], more=[]),
]
# Interview practice (already authored), used in the buffer weeks and the final week.
# (o11-cold is left out on purpose: its cold capstones are the same problems as the LeetCode re-solves.)
INTERVIEW_QUEUE = ['o11-speed', 'o11-debug', 'o11-edges', 'o11-name-it', 'o11-mixed']
# Tier 2 priority: earlier = kept longer when time is short.
MORE_PRIORITY = [91, 152, 647, 146, 560, 739, 155, 994, 210, 695, 199, 543, 236, 703, 973, 46, 17, 74, 875, 209, 567, 283, 680, 110, 2, 138, 150, 22, 34,
                 621, 1004, 36, 287, 1448, 1046, 981, 684, 743, 746, 416, 45, 763, 1249, 72]
SEEDS = [(dt.date(2026, 10, 11), 217), (dt.date(2026, 10, 12), 387), (dt.date(2026, 10, 13), 169), (dt.date(2026, 10, 14), 383), (dt.date(2026, 10, 15), 219)]
SEED_META = {387: ('First Unique Character in a String', 'Frequency map + second pass', 'Easy'), 169: ('Majority Element', 'Frequency map', 'Easy'),
             383: ('Ransom Note', 'Frequency map as a budget', 'Easy'), 219: ('Contains Duplicate II', 'Value -> last index map', 'Easy')}

def is_buffer(d): return any(a <= d <= b for a, b in BUFFER)
def is_study(d): return START <= d <= END and d.weekday() != 6 and d not in OFF
def phase(d):
    if not is_study(d): return 'off'
    if d <= SOFT_END: return 'soft'
    if is_buffer(d): return 'buffer'
    if d >= FINAL: return 'final'
    return 'build' if d <= BUILD_END else 'full'
# Real minutes of NEW work (ladder reps or new LeetCode problems) a day's pace allows: (weekday, Saturday).
BUDGETS = {'off': (0, 0), 'soft': (80, 80), 'build': (130, 80), 'full': (155, 95), 'buffer': (100, 100), 'final': (100, 100)}
def budget(d):
    weekday, saturday = BUDGETS[phase(d)]
    return saturday if d.weekday() == 5 else weekday
def review_cap(d):
    weekday, saturday = REVIEW_CAPS[phase(d)]
    return saturday if d.weekday() == 5 else weekday
def week_of(d): return (d - START).days // 7 + 1
def slug(title):
    s = re.sub(r"[^a-z0-9 -]", '', title.lower())
    return re.sub(r'-+', '-', s.replace(' ', '-')).strip('-')

def spine(reps, caps, evidence=frozenset()):
    """The reps of a pattern-ladder section the plan keeps. Always: capstones, any rep a bridge cites as evidence, first
    exposures, transfer reps and the KEEP lead-ins. Then of each kind at most caps[kind] (kept reps count toward it),
    spread from the first (most scaffolded) to the last (least)."""
    kind = lambda r: 'scratch' if r['bucket'] == 'write' and r['scratch'] else r['bucket']
    by, cited = collections.OrderedDict(), collections.Counter()
    keep = set()
    for i, r in enumerate(reps):
        if r['capstone']: keep.add(i)
        elif r['id'] in evidence or r.get('first') or r.get('transfer') or r['id'] in KEEP:
            keep.add(i)
            # A kept write or debug takes one of its kind's places; a kept trace is cheap and takes none.
            if kind(r) != 'output': cited[kind(r)] += 1
        else: by.setdefault(kind(r), []).append(i)
    for k, idx in by.items():
        n = max(0, caps.get(k, len(idx) + cited[k]) - cited[k])
        if n >= len(idx): keep |= set(idx)
        elif n == 1: keep.add(idx[0])
        elif n > 1: keep |= {idx[round(j * (len(idx) - 1) / (n - 1))] for j in range(n)}
    return [r for i, r in enumerate(reps) if i in keep]

def load_bridges():
    b = json.load(open('planning/bridges.json'))
    return {int(x['lc']): x for x in b['bridges']}, b['units']

PACK_SECTIONS = set()

def apply_packs(pack_units):
    """Ladders and mastery checks authored with the bridge packs join their unit."""
    for u in UNITS:
        extra = pack_units.get(u['name'], {})
        PACK_SECTIONS.update(extra.get('ladder', []))
        for sid in extra.get('ladder', []):
            if sid not in u['ladder']: u['ladder'].append(sid)
        if extra.get('check'):
            assert not u['check'] or u['check'] == extra['check'], f"{u['name']} already has a check"
            u['check'] = extra['check']

def build(more_allowed, demoted=frozenset()):
    src = list(csv.DictReader(open(SOURCE_CSV)))
    meta = {}
    for r in src: meta.setdefault(int(r['lc']), r)
    for lc, (t, p, dff) in SEED_META.items():
        meta[lc] = dict(lc=str(lc), title=t, pattern=p, difficulty=dff, source='reps', reps_capstone='Y', neetcode_video='', video_length='')
    sections = {s['id']: s for s in json.load(open('planning/reps-sections.json'))}
    done = set(json.load(open('planning/done.json')))
    cap_to_lc = {v: k for k, v in CAPSTONE_OF.items()}
    bridges, _ = load_bridges()
    cited = frozenset(e for lc, x in bridges.items() if lc not in demoted for e in x['evidence'])

    # ---- the ordered work queue
    queue = []                           # dicts: kind rep|lc, unit, cost, ...
    for ui, u in enumerate(UNITS):
        for sid in u['ladder'] + ([u['check']] if u['check'] else []):
            # Sections authored with the packs (new ladders, checks) are already minimal; the older pattern ladders keep their spine.
            authored = sections[sid]['reps'] if sid in PACK_SECTIONS or sid == u['check'] else spine(sections[sid]['reps'], SPINE_EARLY if ui < EARLY_UNITS else SPINE_LATE, cited)
            for rep in authored:
                if rep['id'] in done: continue
                lc = cap_to_lc.get(rep['id'])
                queue.append(dict(kind='rep', unit=ui, section=sid, id=rep['id'], gate=(sid == u['check']),
                                  cost=LC_COST[meta[lc]['difficulty']] if lc else rep['minutes'] * REPS_FACTOR, lc=lc))
        for lc in [x for x in u['core'] if x not in demoted] + [x for x in u['more'] if x in more_allowed]:
            m = meta[lc]
            br = bridges[lc]                     # every target has a bridge: the reps that teach what its ladder did not
            for rep in sections[br['section']]['reps']:
                if rep['id'] in done: continue
                queue.append(dict(kind='rep', unit=ui, section=br['section'], id=rep['id'], gate=False, cost=rep['minutes'] * REPS_FACTOR, lc=None))
            queue.append(dict(kind='lc', unit=ui, lc=lc, mode=br['mode'],
                              cost=LC_COST[m['difficulty']] + (STUDY_FIRST_EXTRA if br['mode'] == 'study-first' else 0), tier=1 if lc in u['core'] else 2))
    iq = [dict(kind='rep', unit=-1, section=sid, id=rep['id'], gate=False, cost=rep['minutes'] * REPS_FACTOR, lc=None)
          for sid in INTERVIEW_QUEUE for rep in sections[sid]['reps'] if rep['id'] not in done]

    days = [START + dt.timedelta(n) for n in range((END - START).days + 1)]
    plan, reviews, lc_rows = [], [], []
    seeds = sorted(SEEDS)                # a seed due before the plan starts, or on a day off or a full day, rolls forward: never dropped
    def lc_row(d, lc, kind, mode='', tier=''):
        m = meta[lc]
        lc_rows.append(dict(week=week_of(d), day=d.strftime('%a'), date=d.isoformat(), lc=lc, title=m['title'], pattern=m['pattern'], difficulty=m['difficulty'],
                            source=m['source'], type=kind, reps_capstone='Y' if lc in CAPSTONE_OF or m['source'] == 'reps' else '',
                            neetcode_video=m['neetcode_video'], video_length=m['video_length'], tier=tier, mode=mode))
        return dict(lc=lc, title=m['title'], difficulty=m['difficulty'], pattern=m['pattern'], type=kind, mode=mode or None, video=m['neetcode_video'] or None,
                    url=problem_url(lc, m['title']))
    def after(d, lc, start=1):
        for i in range(start, len(STEPS) + 1):
            reviews.append((i, d, lc))          # (round, first-solve date, problem)
    def window(q):
        lo, hi = WINDOWS[q[0]]
        return q[1] + dt.timedelta(lo), q[1] + dt.timedelta(hi)

    for d in days:
        ph = phase(d)
        day = dict(date=d.isoformat(), week=week_of(d), phase=ph, unit='', short='', sections=[], leetcode=[], minutes=0, order=[])
        plan.append(day)
        if ph == 'off':
            continue
        used_rev = 0
        while seeds and seeds[0][0] <= d and used_rev < review_cap(d):   # problems already solved inside Reps: first cold re-solve on LeetCode
            _, lc = seeds.pop(0)
            day['leetcode'].append(lc_row(d, lc, 'review1', tier='seed'))
            after(d, lc, start=2)
            used_rev += 1
        # Most urgent first: the re-solve whose window closes soonest. One that cannot fit before its window closes is a bug in the plan.
        for q in reviews:
            assert window(q)[1] >= d or window(q)[1] > END, f'LC {q[2]} re-solve {q[0]} missed its window (closed {window(q)[1]})'
        due = sorted([q for q in reviews if window(q)[0] <= d <= window(q)[1]], key=lambda q: (window(q)[1], q[0], q[2]))
        room = max(0, review_cap(d) - used_rev)
        # Take what must go today (window closing, or no later study day inside it), then fill with the rest.
        def last_chance(q):
            return not any(is_study(d + dt.timedelta(n)) for n in range(1, (window(q)[1] - d).days + 1))
        must = [q for q in due if last_chance(q)]
        assert len(must) <= room, f'{d}: {len(must)} re-solves close today but the cap is {room}'
        for q in (must + [q for q in due if q not in must])[:room]:
            reviews.remove(q)
            day['leetcode'].append(lc_row(d, q[2], f'review{q[0]}'))
        # Buffer weeks carry interview practice only: they exist to absorb slips, so no ladder work is planned into them.
        src_q = iq if ph in ('buffer', 'final') and iq else ([] if ph == 'buffer' else queue)
        used, units = 0.0, []
        new_lc = 0
        def pick(q):
            # Next item to place: the front of the queue, or, once today's new LeetCode problems are used up,
            # the first ladder rep behind them (the next pattern's ladder starts while this one's problems finish).
            if not q: return None
            if q[0]['kind'] != 'lc' or new_lc < MAX_NEW_LC: return 0
            return next((j for j, x in enumerate(q) if x['kind'] == 'rep'), None)
        while True:
            j = pick(src_q)
            if j is None or not (used == 0 or used + src_q[j]['cost'] <= budget(d) * 1.1): break
            if src_q[j]['kind'] == 'lc': new_lc += 1
            it = src_q.pop(j)
            used += it['cost']
            day['order'].append(it['id'] if it['kind'] == 'rep' else f"lc:{it['lc']}")
            if it['unit'] >= 0 and it['unit'] not in units: units.append(it['unit'])
            if it['kind'] == 'rep':
                if day['sections'] and day['sections'][-1]['id'] == it['section']:
                    day['sections'][-1]['reps'].append(it['id'])
                else:
                    day['sections'].append(dict(id=it['section'], reps=[it['id']], gate=it['gate'], label=(f"{UNITS[it['unit']]['name']} check" if it['gate'] else None)))
                if it['lc']:              # a Reps capstone is the first solve of that LeetCode problem
                    after(d, it['lc'])
            else:
                day['leetcode'].append(lc_row(d, it['lc'], 'new', it['mode'], it['tier']))
                after(d, it['lc'])
        # The app reads the plan as one queue in date order. So on the last day before a buffer week, once the next ladder
        # item no longer fits, the small interview-practice reps that open the buffer week fill what is left of the day:
        # that is where the app's forecast would put them anyway.
        nxt = next((x for x in (d + dt.timedelta(n) for n in range(1, 8)) if is_study(x)), None)
        if ph not in ('buffer', 'final') and iq and nxt and phase(nxt) == 'buffer':
            while iq and used > 0 and used + iq[0]['cost'] <= budget(d) * 1.1:
                it = iq.pop(0); used += it['cost']
                day['order'].append(it['id'])
                if day['sections'] and day['sections'][-1]['id'] == it['section']: day['sections'][-1]['reps'].append(it['id'])
                else: day['sections'].append(dict(id=it['section'], reps=[it['id']], gate=False, label=None))
        # the final week also takes whatever new work is left once interview practice is placed
        if ph == 'final' and not iq:
            while True:
                j = pick(queue)
                if j is None or used + queue[j]['cost'] > budget(d) * 1.1: break
                if queue[j]['kind'] == 'lc': new_lc += 1
                it = queue.pop(j); used += it['cost']
                day['order'].append(it['id'] if it['kind'] == 'rep' else f"lc:{it['lc']}")
                if it['unit'] not in units: units.append(it['unit'])
                if it['kind'] == 'rep':
                    if day['sections'] and day['sections'][-1]['id'] == it['section']: day['sections'][-1]['reps'].append(it['id'])
                    else: day['sections'].append(dict(id=it['section'], reps=[it['id']], gate=it['gate'], label=(f"{UNITS[it['unit']]['name']} check" if it['gate'] else None)))
                    if it['lc']: after(d, it['lc'])
                else:
                    day['leetcode'].append(lc_row(d, it['lc'], 'new', it['mode'], it['tier'])); after(d, it['lc'])
        day['minutes'] = round(used)
        names = [UNITS[u]['name'] for u in units] or (['Interview practice'] if day['sections'] else (['Re-solves'] if day['leetcode'] else []))
        day['unit'] = ' → '.join(names)
        day['short'] = ' → '.join([UNITS[u]['short'] for u in units]) or ('Interview' if day['sections'] else 'Re-solves')
    assert not seeds, f'seed re-solves never placed: {seeds}'
    return plan, lc_rows, queue, iq, reviews, meta

def main():
    bridges, pack_units = load_bridges()
    apply_packs(pack_units)
    for u in UNITS:
        assert u['ladder'] and u['check'], f"{u['name']}: every pattern needs a ladder and a mastery check"
        for lc in u['core']: assert lc in bridges, f"LC {lc} ({u['name']}) has no bridge"
    # Add tier-2 problems (only ones with a bridge), best first, for as long as everything still fits before the end.
    allowed, demoted = set(), set()
    plan, lc_rows, left, iq_left, reviews, meta = build(allowed)
    for lc in DEMOTE:                    # too much for 90 days: the lowest-value targets wait in the "when ahead" list
        if not left: break
        demoted.add(lc)
        plan, lc_rows, left, iq_left, reviews, meta = build(allowed, frozenset(demoted))
    assert not left, f'core does not fit: {len(left)} items left; trim a ladder or raise the budgets'
    for lc in [x for x in reversed(DEMOTE) if x in demoted]:   # a cheaper one set aside earlier may still fit: most valuable first
        trial = build(allowed, frozenset(demoted - {lc}))
        if not trial[2]:
            demoted.discard(lc)
            plan, lc_rows, left, iq_left, reviews, meta = trial
    for lc in MORE_PRIORITY:
        if lc not in bridges or demoted: continue
        trial = build(allowed | {lc}, frozenset(demoted))
        if trial[2]:
            break
        allowed.add(lc)
        plan, lc_rows, left, iq_left, reviews, meta = trial

    scheduled_lc = {r['lc'] for r in lc_rows} | set(CAPSTONE_OF)
    cols = ['week', 'day', 'date', 'lc', 'title', 'pattern', 'difficulty', 'source', 'type', 'reps_capstone', 'neetcode_video', 'video_length', 'tier', 'mode']
    with open('planning/problems.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(lc_rows)
    order = list(dict.fromkeys(int(r['lc']) for r in csv.DictReader(open(SOURCE_CSV)) if r['type'] == 'new'))
    with open('planning/stretch.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['lc', 'title', 'pattern', 'difficulty', 'source', 'why_not_scheduled', 'neetcode_video'])
        # Problems that already have a bridge come first, most valuable first (the reverse of the order they were set aside in).
        rank = lambda x: (0, -DEMOTE.index(x)) if x in DEMOTE else (1, 0) if x in bridges else (2 if x in CORE_HARDS_TO_STRETCH else 3 if x in MORE_PRIORITY else 4, MORE_PRIORITY.index(x) if x in MORE_PRIORITY else order.index(x))
        for lc in sorted([x for x in order if x not in scheduled_lc], key=rank):
            m = meta[lc]
            why = 'bridge ready: first in when ahead' if lc in bridges else 'core Hard: do when ahead' if lc in CORE_HARDS_TO_STRETCH else ('next in when ahead' if lc in MORE_PRIORITY else 'extra depth')
            w.writerow([lc, m['title'], m['pattern'], m['difficulty'], m['source'], why, m['neetcode_video']])

    body = json.dumps([{k: v for k, v in d.items()} for d in plan], indent=1, ensure_ascii=False)
    open('data/schedule-90.ts', 'w').write(
        "// Generated by planning/gen.py. Do not edit by hand: change the generator and rerun it.\n"
        "export interface PlanLeetcode {\n  lc: number\n  title: string\n  difficulty: string\n  pattern: string\n  type: 'new' | 'review1' | 'review2' | 'review3'\n  mode: 'bridge-first' | 'study-first' | 'attempt-first' | null\n  video: string | null\n  url: string\n}\n"
        "export interface PlanDay {\n  date: string\n  week: number\n  phase: 'soft' | 'build' | 'full' | 'buffer' | 'final' | 'off'\n  /** The pattern(s) this day works on. */\n  unit: string\n  short: string\n  /** Reps reps for the day, grouped by their section. `gate` marks a mastery check. */\n  sections: { id: string; reps: string[]; gate: boolean; label: string | null }[]\n  leetcode: PlanLeetcode[]\n  /** Estimated real minutes of new work (ladder reps and new LeetCode problems). */\n  minutes: number\n  /** The day's new work in the order it is done: rep ids, and `lc:<number>` for new LeetCode problems. */\n  order: string[]\n}\n\n"
        f"export const PLAN_START = '{START.isoformat()}'\nexport const PLAN_END = '{END.isoformat()}'\n\n"
        "/** The fifteen patterns, in order: each one's ladder sections, its mastery check, and its LeetCode problems (each reached through its bridge). */\n"
        "export const PLAN_UNITS: { name: string; short: string; sections: string[]; check: string; leetcode: number[] }[] = "
        + json.dumps([dict(name=u['name'], short=u['short'], sections=u['ladder'], check=u['check'],
                           leetcode=[lc for lc in u['core'] + u['more'] if lc in {r['lc'] for r in lc_rows if r['type'] == 'new'}]) for u in UNITS], indent=1) + "\n\n"
        "/** LeetCode problems whose first solve is a Reps capstone: number -> exercise id. */\n"
        f"export const PLAN_CAPSTONES: Record<number, string> = {json.dumps({str(k): v for k, v in CAPSTONE_OF.items()})}\n\n"
        "/** Targets with a bridge that 90 days do not hold at the plan's pace: next in when you are ahead, most valuable first. */\n"
        "export const PLAN_WHEN_AHEAD: { lc: number; title: string; difficulty: string; pattern: string; unit: string; video: string | null; url: string }[] = "
        + json.dumps([dict(lc=lc, title=meta[lc]['title'], difficulty=meta[lc]['difficulty'], pattern=meta[lc]['pattern'], unit=bridges[lc]['unit'],
                           video=meta[lc]['neetcode_video'] or None, url=problem_url(lc, meta[lc]['title']))
                      for lc in sorted([x for x in bridges if x not in scheduled_lc], key=lambda x: -DEMOTE.index(x) if x in DEMOTE else 1)], indent=1) + "\n\n"
        "/** A re-solve lands this many days after the first solve (it slides only to miss a Sunday, a day off or a full day). */\n"
        f"export const RESOLVE_WINDOWS = {json.dumps({f'review{k}': list(v) for k, v in WINDOWS.items()})} as const\n\n"
        "/**\n * The pace model, shared with the app so it can forecast from where you actually are:\n"
        " * minutes of new work a day's pace allows by phase ([weekday, Saturday]), what a rep and a\n"
        " * LeetCode problem cost in real minutes, and the re-solve gaps.\n */\n"
        f"export const PACE = {json.dumps(dict(budgets={k: list(v) for k, v in BUDGETS.items()}, repsFactor=REPS_FACTOR, lcMinutes=LC_COST, capstoneMinutes=LC_COST, studyFirstExtra=STUDY_FIRST_EXTRA, maxNewLeetcode=MAX_NEW_LC, resolveGaps=STEPS, overfill=1.1))} as const\n\n"
        "/** The most re-solves a day may carry, by phase: [weekday, Saturday]. */\n"
        f"export const RESOLVE_CAPS = {json.dumps({k: list(v) for k, v in REVIEW_CAPS.items()})} as const\n\n"
        f"export const PLAN_90 = {body} as PlanDay[]\n")

    # ---- weekly summary
    wk = collections.OrderedDict()
    for d in plan:
        if d['phase'] == 'off': continue
        b = wk.setdefault(d['week'], dict(dates=[], units=[], reps=0, new=[], rev=0, mins=[]))
        b['dates'].append(d['date']); b['mins'].append(d['minutes'])
        for u in d['unit'].split(' → '):
            if u and u not in b['units']: b['units'].append(u)
        b['reps'] += sum(len(s['reps']) for s in d['sections'])
        b['new'] += [str(x['lc']) for x in d['leetcode'] if x['type'] == 'new']
        b['rev'] += sum(1 for x in d['leetcode'] if x['type'] != 'new')
    fmt = lambda s: dt.date.fromisoformat(s).strftime('%b %-d')
    lines = ['| Wk | Dates | Patterns | Reps reps | New LeetCode | LeetCode re-solves |', '|---|---|---|---|---|---|']
    for k, b in wk.items():
        lines.append(f"| {k} | {fmt(min(b['dates']))}–{fmt(max(b['dates']))} | {', '.join(b['units'])} | {b['reps']} | {', '.join(b['new']) or '—'} | {b['rev']} |")
    open('planning/weeks.md', 'w').write('\n'.join(lines) + '\n')

    new_lc = [r for r in lc_rows if r['type'] == 'new']
    reps_total = sum(len(s['reps']) for d in plan for s in d['sections'])
    print('set aside for when ahead:', sorted(demoted), '| tier 2 added:', sorted(allowed))
    print(f"Reps reps scheduled: {reps_total} | new LeetCode: {len(new_lc)} (core {sum(1 for r in new_lc if r['tier'] == 1)}, tier 2 {sum(1 for r in new_lc if r['tier'] == 2)}) + {len(CAPSTONE_OF)} as Reps capstones")
    print(f"LeetCode re-solves scheduled: {len(lc_rows) - len(new_lc)} | left for maintenance: {len(reviews)} | interview reps left over: {len(iq_left)}")
    last_new = max(d['date'] for d in plan if any(s['id'][:3] != 'o11' for s in d['sections']) or any(x['type'] == 'new' for x in d['leetcode']))
    print('last new ladder/LeetCode work lands on', last_new)
    for name, dd in [('day 30', START + dt.timedelta(29)), ('day 60', START + dt.timedelta(59)), ('day 90', END)]:
        solved = sum(1 for r in new_lc if r['date'] <= dd.isoformat()) + sum(1 for d in plan if d['date'] <= dd.isoformat() for s in d['sections'] for r in s['reps'] if r in CAPSTONE_OF.values())
        units_done = [UNITS[i]['name'] for i in range(len(UNITS)) if all(not (dy['date'] > dd.isoformat() and UNITS[i]['name'] in dy['unit']) for dy in plan)]
        print(f'{name} {dd}: LeetCode problems solved {solved} | units finished: {len(units_done)}')
    print('max new-work minutes in a day:', max(d['minutes'] for d in plan), '| max LeetCode items in a day:', max(len(d['leetcode']) for d in plan))
    print('unit start dates:', [(u['short'], next((d['date'][5:] for d in plan if u['name'] in d['unit']), '?')) for u in UNITS])

if __name__ == '__main__':
    main()
