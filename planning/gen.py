"""Builds the 90-day ladder plan: every pattern is learned the way dictionaries were.

    unit = ladder in Reps (ground up) -> mastery check (cold reps, no solution)
           -> that pattern's LeetCode problems -> spaced re-solves (+3 / +10 / +30 days)

Run from the repo root:
    npx tsx scripts/export-ladders.ts     # refresh planning/reps-sections.json
    python3 planning/gen.py

Inputs : problems.csv                    the original problem list (metadata + verified video links)
         planning/reps-sections.json     every authored Reps section and rep
         planning/done.json              rep ids already passed (from Supabase, Oct 10)
Outputs: data/schedule-90.ts             what the app reads: per day, Reps reps + LeetCode problems
         planning/problems.csv           the LeetCode side, day by day
         planning/stretch.csv            unscheduled problems, in priority order
         planning/weeks.md               weekly summary for plan.md

Sized from measured pace (Oct 2-8): Reps reps take ~2.25-2.5x their authored minutes;
a LeetCode problem reached through a ladder took ~12 min, one reached cold 45-70 min.
"""
import csv, datetime as dt, collections, json, re, os

START = dt.date(2026, 10, 11)
END = dt.date(2027, 1, 8)
OFF = {dt.date(2026, 11, 26), dt.date(2026, 11, 27), dt.date(2026, 12, 24), dt.date(2026, 12, 25), dt.date(2027, 1, 1)}
BUFFER = [(dt.date(2026, 11, 23), dt.date(2026, 11, 28)), (dt.date(2026, 12, 21), dt.date(2026, 12, 26))]
SOFT_END = dt.date(2026, 10, 17)
BUILD_END = dt.date(2026, 11, 7)
FINAL = dt.date(2027, 1, 4)
STEPS = [3, 10, 30]

REPS_FACTOR = 2.25                      # real minutes per authored Reps minute (measured 2.5 on dictionaries; later ladders reuse earlier moves)
LC_COST = {'Easy': 25, 'Medium': 40, 'Hard': 60}
STUDY_FIRST_EXTRA = 10                  # the walkthrough comes first on a pattern's first problem

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
    dict(name='Graphs', short='Graphs', ladder=['o8-adjacency', 'o8-dfs', 'o8-bfs', 'o8-cap-path-exists', 'o8-cycles', 'o8-cap-course-schedule'], check='o8-cold',
         core=[133, 417, 261, 323], more=[210, 684, 743]),
    dict(name='Sorting + heaps', short='Heaps', ladder=['d9-sorting', 'd9-keys', 'd9-freq-sort', 'd9-heapq', 'd9-top-k'], check=None,
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
def is_study(d): return d == START or (START <= d <= END and d.weekday() != 6 and d not in OFF)
def phase(d):
    if not is_study(d): return 'off'
    if d <= SOFT_END: return 'soft'
    if is_buffer(d): return 'buffer'
    if d >= FINAL: return 'final'
    return 'build' if d <= BUILD_END else 'full'
def budget(d):                           # real minutes of NEW work (ladder reps or new LeetCode problems)
    sat = d.weekday() == 5
    return {'off': 0, 'soft': 80, 'build': 80 if sat else 130, 'full': 95 if sat else 155, 'buffer': 100, 'final': 100}[phase(d)]
def review_cap(d):
    sat = d.weekday() == 5
    return {'off': 0, 'soft': 2, 'build': 2 if sat else 3, 'full': 3 if sat else 5, 'buffer': 4 if sat else 6, 'final': 5}[phase(d)]
def week_of(d): return 1 if d <= SOFT_END else (d - dt.date(2026, 10, 12)).days // 7 + 1
def slug(title):
    s = re.sub(r"[^a-z0-9 -]", '', title.lower())
    return re.sub(r'-+', '-', s.replace(' ', '-')).strip('-')

def build(more_allowed):
    src = list(csv.DictReader(open('problems.csv')))
    meta = {}
    for r in src: meta.setdefault(int(r['lc']), r)
    for lc, (t, p, dff) in SEED_META.items():
        meta[lc] = dict(lc=str(lc), title=t, pattern=p, difficulty=dff, source='reps', reps_capstone='Y', neetcode_video='', video_length='')
    sections = {s['id']: s for s in json.load(open('planning/reps-sections.json'))}
    done = set(json.load(open('planning/done.json')))
    cap_to_lc = {v: k for k, v in CAPSTONE_OF.items()}

    # ---- the ordered work queue
    queue = []                           # dicts: kind rep|lc, unit, cost, ...
    for ui, u in enumerate(UNITS):
        for sid in u['ladder'] + ([u['check']] if u['check'] else []):
            for rep in sections[sid]['reps']:
                if rep['id'] in done: continue
                queue.append(dict(kind='rep', unit=ui, section=sid, id=rep['id'], gate=(sid == u['check']), cost=rep['minutes'] * REPS_FACTOR,
                                  lc=cap_to_lc.get(rep['id'])))
        first = True
        for lc in u['core'] + [x for x in u['more'] if x in more_allowed]:
            m = meta[lc]
            study = first and not u['ladder']    # no ladder for this pattern (tries, matrix): the walkthrough is the ladder
            first = False
            queue.append(dict(kind='lc', unit=ui, lc=lc, mode='study-first' if study else 'attempt-first',
                              cost=LC_COST[m['difficulty']] + (STUDY_FIRST_EXTRA if study else 0), tier=1 if lc in u['core'] else 2))
    iq = [dict(kind='rep', unit=-1, section=sid, id=rep['id'], gate=False, cost=rep['minutes'] * REPS_FACTOR, lc=None)
          for sid in INTERVIEW_QUEUE for rep in sections[sid]['reps'] if rep['id'] not in done]

    days = [START + dt.timedelta(n) for n in range((END - START).days + 1)]
    plan, reviews, lc_rows = [], [], []
    seeds = dict(SEEDS)
    def lc_row(d, lc, kind, mode='', tier=''):
        m = meta[lc]
        lc_rows.append(dict(week=week_of(d), day=d.strftime('%a'), date=d.isoformat(), lc=lc, title=m['title'], pattern=m['pattern'], difficulty=m['difficulty'],
                            source=m['source'], type=kind, reps_capstone='Y' if lc in CAPSTONE_OF or m['source'] == 'reps' else '',
                            neetcode_video=m['neetcode_video'], video_length=m['video_length'], tier=tier, mode=mode))
        return dict(lc=lc, title=m['title'], difficulty=m['difficulty'], pattern=m['pattern'], type=kind, mode=mode or None, video=m['neetcode_video'] or None,
                    url=f"https://leetcode.com/problems/{slug(m['title'])}/")
    def after(d, lc, start=1):
        for i, gap in enumerate(STEPS[start - 1:], start=start):
            reviews.append((i, d + dt.timedelta(gap), lc))

    for d in days:
        ph = phase(d)
        day = dict(date=d.isoformat(), week=week_of(d), phase=ph, unit='', short='', sections=[], leetcode=[], minutes=0)
        plan.append(day)
        if ph == 'off':
            continue
        used_rev = 0
        if d in seeds:                    # problems already solved inside Reps: first cold re-solve on LeetCode
            day['leetcode'].append(lc_row(d, seeds[d], 'review1', tier='seed'))
            after(d, seeds[d], start=2)
            used_rev += 1
        due = sorted([q for q in reviews if q[1] <= d], key=lambda q: (q[0], q[1]))
        for q in due[: max(0, review_cap(d) - used_rev)]:
            reviews.remove(q)
            day['leetcode'].append(lc_row(d, q[2], f'review{q[0]}'))
        # Buffer weeks carry interview practice only: they exist to absorb slips, so no ladder work is planned into them.
        src_q = iq if ph in ('buffer', 'final') and iq else ([] if ph == 'buffer' else queue)
        used, units = 0.0, []
        while src_q and (used == 0 or used + src_q[0]['cost'] <= budget(d) * 1.1):
            it = src_q.pop(0)
            used += it['cost']
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
        # the final week also takes whatever new work is left once interview practice is placed
        if ph == 'final' and not iq:
            while queue and used + queue[0]['cost'] <= budget(d) * 1.1:
                it = queue.pop(0); used += it['cost']
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
    return plan, lc_rows, queue, iq, reviews, meta

def main():
    # Add tier-2 problems, best first, for as long as everything still fits before the end.
    allowed = set()
    plan, lc_rows, left, iq_left, reviews, meta = build(allowed)
    assert not left, f'core does not fit: {len(left)} items left; trim a ladder or raise the budgets'
    for lc in MORE_PRIORITY:
        trial = build(allowed | {lc})
        if trial[2]:
            break
        allowed.add(lc)
        plan, lc_rows, left, iq_left, reviews, meta = trial

    scheduled_lc = {r['lc'] for r in lc_rows} | set(CAPSTONE_OF)
    cols = ['week', 'day', 'date', 'lc', 'title', 'pattern', 'difficulty', 'source', 'type', 'reps_capstone', 'neetcode_video', 'video_length', 'tier', 'mode']
    with open('planning/problems.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(lc_rows)
    order = list(dict.fromkeys(int(r['lc']) for r in csv.DictReader(open('problems.csv')) if r['type'] == 'new'))
    with open('planning/stretch.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['lc', 'title', 'pattern', 'difficulty', 'source', 'why_not_scheduled', 'neetcode_video'])
        rank = lambda x: (0 if x in CORE_HARDS_TO_STRETCH else 1 if x in MORE_PRIORITY else 2, MORE_PRIORITY.index(x) if x in MORE_PRIORITY else order.index(x))
        for lc in sorted([x for x in order if x not in scheduled_lc], key=rank):
            m = meta[lc]
            why = 'core Hard: do when ahead' if lc in CORE_HARDS_TO_STRETCH else ('next in when ahead' if lc in MORE_PRIORITY else 'extra depth')
            w.writerow([lc, m['title'], m['pattern'], m['difficulty'], m['source'], why, m['neetcode_video']])

    body = json.dumps([{k: v for k, v in d.items()} for d in plan], indent=1, ensure_ascii=False)
    open('data/schedule-90.ts', 'w').write(
        "// Generated by planning/gen.py. Do not edit by hand: change the generator and rerun it.\n"
        "export interface PlanLeetcode {\n  lc: number\n  title: string\n  difficulty: string\n  pattern: string\n  type: 'new' | 'review1' | 'review2' | 'review3'\n  mode: 'study-first' | 'attempt-first' | null\n  video: string | null\n  url: string\n}\n"
        "export interface PlanDay {\n  date: string\n  week: number\n  phase: 'soft' | 'build' | 'full' | 'buffer' | 'final' | 'off'\n  /** The pattern(s) this day works on. */\n  unit: string\n  short: string\n  /** Reps reps for the day, grouped by their section. `gate` marks a mastery check. */\n  sections: { id: string; reps: string[]; gate: boolean; label: string | null }[]\n  leetcode: PlanLeetcode[]\n  /** Estimated real minutes of new work (ladder reps and new LeetCode problems). */\n  minutes: number\n}\n\n"
        f"export const PLAN_START = '{START.isoformat()}'\nexport const PLAN_END = '{END.isoformat()}'\n\n"
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
