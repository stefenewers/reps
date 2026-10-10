# 90-Day Interview Plan, rebuilt: Stefen Ewers (Sun Oct 11, 2026 → Fri Jan 8, 2027)

**Target:** full-time **SWE I (new-grad)** interview loops, in Python. Not internships.
**This version replaces the first plan.** It starts tomorrow, it is sized from your measured pace instead of a target, and it starts gently.

> **You come first.** You have just lost someone. The hours below are a ceiling, never a quota.
> - Any day can be a **minimum day**: the re-solves, one problem, stop. That is a full day's credit.
> - A missed day is never made up on a Sunday. The two buffer weeks exist to absorb slips.
> - If you dread the desk, sleep under 7 hours three nights running, or two days in a row feel heavy: take minimum days, and tell Nadani.

## What changed from the first version, and why

| First plan | This plan | Why |
|---|---|---|
| Starts Mon Oct 12 | Starts **Sun Oct 11** with one small day | You asked to start tomorrow. Day 1 is a re-solve of a problem you already own plus Two Sum. |
| 3–4 new problems a day, 198 total | **1 a day in week 1, then 2** (1 on Saturdays), **109 total** | Your data: 7 LeetCode-style problems ever passed, sustained focus of 2–3 h a day. See §1. |
| 5.5 focused hours from day 1 | **~1.5–2 h → ~3–3.5 h → ~4–4.5 h** | A ramp you can keep beats a pace you re-plan every three days. October had seven re-plans. |
| Every problem attempted cold for 45 min | **Study-first** for the first problem of each new pattern; **30-minute rule** after that | Research on worked examples and on attempting before instruction. See §2. |
| "Ready by Jan 10", then apply | **Apply from week 2**, 5 a week | New-grad hiring peaks Aug–Oct with a second wave Jan–Mar. Waiting until January misses the first wave. |
| All 150 + 54 extras | **All 64 core (Blind 75) + 45 high-yield**, 86 on a stretch list | Depth on the core list beats thin coverage of 200. |

## 1. Starting point (measured, from your Reps data on Oct 10)

- **LeetCode-style problems passed, ever: 7.**
  - Unaided: Contains Duplicate (217), Valid Anagram (242), First Unique Character (387), Majority Element (169).
  - With the solution open: Two Sum (1), Ransom Note (383), Contains Duplicate II (219).
- **Time on those:** 12–13 minutes when it clicked; 24, 47 and 71 minutes when it didn't.
- **Focused time per active day:** two long days (7.9 h and 6 h), every other day under 2 hours. Nothing since Oct 8.
- **Solid:** Python basics, sets, dictionaries, frequency maps, two pointers at trace level.
- **Not started:** sliding window, stacks, binary search, linked lists, trees, graphs, heaps, DP.
- **What this means:** the plan teaches patterns from first exposure. It does not assume October's later capstones were done; they were not.

## 2. Research basis (what it says, and how the plan uses it)

- **Spaced re-solving works, and the right gap grows with how long you need to remember.** Cepeda et al. (2008, 1,350+ people): the best gap was about 20–40% of a one-week delay, falling to about 5–10% of a one-year delay. For interviews one to three months out, that supports gaps of days, then about a week and a half, then about a month.
  → Every problem comes back at **+3, +10 and +30 days**. [PubMed](https://pubmed.ncbi.nlm.nih.gov/19076480/)
- **Studying a worked example first helps most when the material is new.** A University of Delaware meta-analysis in mathematics found about half a standard deviation of benefit. Programming studies are smaller and more mixed: they show less wasted time and lower mental load, not always higher final scores.
  → The **first problem of each new pattern is study-first** (26 of the 109): watch the walkthrough, then write it from a blank editor. [Meta-analysis poster](https://www.cehd.udel.edu/wp-content/uploads/2022/02/Worked-Examples-Meta-Poster_022722_SC.pdf) · [NSF: worked examples in intro programming](https://par.nsf.gov/biblio/10598698-impact-connecting-worked-examples-completion-problems-introductory-programming-practice)
- **Trying before being taught helps when you have the prior knowledge to make real attempts.** Kapur's "productive failure" work gives no magic number of minutes; the useful window runs from a couple of minutes to about an hour.
  → Once you know a pattern, **attempt first for up to 30 minutes**, then study. Not 45 minutes of staring. [Summary of Kapur's work](https://www.schoolbag.edu.sg/story/parents-let-your-child-struggle-first)
- **Grief can blunt concentration and working memory for a while.** The solid studies are in older adults and show modest effects on working memory and processing speed; claims about exact timelines are not well supported.
  → Week 1 is deliberately small, and the first two weeks carry no mocks with other people. [Adelaide study](https://drmc.library.adelaide.edu.au/dspace/handle/2440/44337?mode=full)
- **Hiring calendar.** Career-site guides (not company pages) put the main 2027 new-grad window at August–October 2026, with a smaller wave January–March 2027. Dates vary by company and team; check each careers page.
  → Applications start in week 2, not after day 90. [Simplify: Microsoft guide](https://simplify.jobs/blog/microsoft-aspire-new-grad-swe-guide) · [2027 timeline](https://www.applybolt.app/guide/2027-new-grad-jobs)
- **Interview formats** (prep sites quoting candidates, not the companies): Google runs 45-minute rounds where follow-ups change a constraint. Meta has replaced one coding round with a 60-minute AI-enabled round on a multi-file project, where you must explain and verify every line.
  → Follow-ups in every mock from week 4; one AI-assisted drill in week 10. [interviewing.io on Meta's AI round](https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples)

## 3. The three phases

| Phase | Dates | New per day | Re-solves per day | Extra block | Ceiling |
|---|---|---|---|---|---|
| **Soft start** | Oct 11–17 | 1 | up to 2 | none | ~1.5–2 h |
| **Build** | Oct 19–Nov 7 | 2 (1 Sat) | up to 4 (3 Sat) | 30–45 min, Mon–Fri | ~3–3.5 h |
| **Full** | Nov 9–Jan 8 | 2 (1 Sat; 1 in the final week) | up to 6 (3 Sat) | 45–60 min, Mon–Fri | ~4–4.5 h |

Sundays are off after tomorrow. Days off: Nov 26–27, Dec 24–25, Jan 1. Buffer weeks (7 and 11) have re-solves only.

**A weekday in the Full phase**

| Block | Length | What |
|---|---|---|
| A. New problems | ~1 h 45 m | 2 problems, using the method in §4 |
| Break + walk | 30–60 min | Away from screens |
| B. Re-solves | ~1 h 30 m | Up to 6, cold, about 15 minutes each, topics mixed |
| C. Rotating block | 45–60 min | Mon design · Tue mock · Wed stories · Thu applications · Fri mock or timed set |
| D. Log | 10 min | Tracker row for each problem, tomorrow's list |

No studying at night.

## 4. How to work a problem

**Study-first** (the first problem of a new pattern; marked in `problems.csv`):
1. Read the problem and write down the inputs, the output and two examples.
2. Watch the walkthrough's explanation. Pause when the code starts.
3. Write it yourself from a blank editor. Run it. Finish the video and compare.
4. Say the time and space complexity out loud.

**Attempt-first** (every other new problem):
1. Restate it, ask what you would clarify, write two examples and one edge case.
2. Say the brute force and its complexity. Then look for the repeated work a data structure could make cheap.
3. Code it. Test one normal case and two edge cases.
4. **At 30 minutes without a working idea, stop and study it**, then write it from blank.

**Re-solves:** cold, from a blank editor, 15 minutes.
- Solved unaided → it comes back at the next scheduled gap.
- Needed the notes or the video → **redo it tomorrow**, then it rejoins the schedule.

**Every problem you needed the solution for gets one line in the tracker:** the cue you missed. That line is what you read before the re-solve.

## 5. Problems and volume

- **109 new problems**, in NeetCode roadmap order, which matches your Reps skill graph.
  - **Tier 1, core (64):** the Blind 75 problems in your list, minus its four hardest (212, 269, 295, 297).
  - **Tier 2 (45):** the highest-yield others: LRU Cache, Subarray Sum Equals K, Daily Temperatures, Kth Largest, Rotting Oranges, Course Schedule II, Subsets, Permutations and similar.
- **Week 1 re-solves the six problems you already solved in Reps**, so the first days include things you can do.
- **302 re-solves** are scheduled inside the 90 days. 43 more (mostly +30s) fall after Jan 8 and become the maintenance queue: 3 a day.
- **`stretch.csv` holds the other 86**, in priority order: the four core Hards first, then tier 2, then extras.
- **From dynamic programming on, core problems are scheduled before tier 2**, so if you fall behind, what slips is optional. All core problems are scheduled by Jan 2.
- **Premium problems** (252, 253, 261, 323, 271): solve them free on neetcode.io.
- **Video links** were verified in the first plan against YouTube's API. Problems without one have no verified link, not a broken one.

## 6. Weekly calendar

| Wk | Dates | Theme | New | New problems (LC) | Re-solves | Mocks | Design · stories · applications |
|---|---|---|---|---|---|---|---|
| 1 | Oct 11–Oct 17 | Soft start: hashing | 7 | 1, 49, 347, 128, 238, 271, 36 | 10 | — | — |
| 2 | Oct 19–Oct 24 | Prefix sums, two pointers, sliding window | 11 | 560, 283, 11, 15, 125, 167, 680, 3, 121, 424, 209 | 16 | 1 self (recorded) | Résumé final; list of SWE I postings open now |
| 3 | Oct 26–Oct 31 | Sliding window, stack, monotonic stack, binary search | 11 | 567, 1004, 76, 20, 22, 150, 155, 739, 1249, 74, 704 | 22 | 1 self | OOP basics: Min Stack; stories 1–2; 5 applications |
| 4 | Nov 2–Nov 7 | Binary search, linked lists | 11 | 875, 33, 153, 34, 981, 21, 141, 143, 206, 2, 19 | 22 | 2 (self + Nadani) | LLD: parking lot; stories 3–4; 5 applications |
| 5 | Nov 9–Nov 14 | Linked lists, tree DFS/BFS | 11 | 138, 23, 146, 287, 226, 100, 104, 110, 543, 102, 235 | 30 | 2 | LLD: LRU cache; story 5; 5 applications · **Day 30 = Mon Nov 9** |
| 6 | Nov 16–Nov 21 | Trees, BST, tries, heaps | 11 | 572, 98, 199, 230, 1448, 105, 236, 124, 208, 211, 703 | 33 | 2 | LLD: rate limiter; story 6; 5 applications |
| 7 | Nov 23–Nov 28 | BUFFER (Thanksgiving, Nov 26–27 off): re-solves only | 0 | — | 22 | 1 | Catch-up or rest; retell stories |
| 8 | Nov 30–Dec 5 | Heaps, intervals, backtracking | 11 | 1046, 215, 621, 973, 56, 57, 252, 435, 253, 39, 78 | 29 | 2 + 1 OA set | HLD primer; stories 7–8; 5 applications |
| 9 | Dec 7–Dec 12 | Backtracking, grids, graphs, topological sort | 11 | 46, 79, 17, 200, 695, 133, 417, 994, 207, 210, 261 | 26 | 2 | HLD: URL shortener; behavioral mock · **Day 60 = Wed Dec 9** |
| 10 | Dec 14–Dec 19 | Union-find, Dijkstra, 1D DP | 11 | 323, 684, 743, 70, 198, 213, 5, 91, 322, 647, 139 | 33 | 2 (1 AI-assisted) | LLD: KV store; stories 9–10 |
| 11 | Dec 21–Dec 26 | BUFFER (holidays, Dec 24–25 off): re-solves only | 0 | — | 20 | 1 | Rest; light retell |
| 12 | Dec 28–Jan 2 | 1D DP, greedy, 2D DP, matrix (Jan 1 off) | 9 | 152, 300, 53, 55, 62, 1143, 48, 54, 73 | 16 | 2 | Code-review drill; stories 11–12 |
| 13 | Jan 4–Jan 8 | Mock week + last tier-2 problems | 5 | 746, 416, 45, 763, 72 | 23 | 3–4 full loops | Final polish · **Day 90 = Fri Jan 8** |

Day by day: `planning/problems.csv`. Columns: week, day, date, lc, title, pattern, difficulty, source, type (new / review1–3), reps_capstone, neetcode_video, video_length, tier, mode.

## 7. Applications (starts week 2)

- **This week, when you are able (optional):** a two-line note to the Google recruiter about the internship interview you are skipping. The internship is no longer the goal, but a recruiter who hears "family bereavement" rather than silence is a contact you can come back to for full-time roles.
- **Week 2:** résumé final and one page of project notes (Reps and Knovel).
- **Weeks 3–10:** five applications a week in the Thursday block, tracked in a simple sheet: company, role, date, status.
- **Roles:** full-time new-grad / SWE I / "University Grad" postings only.
- **Order:** companies whose windows are open now first; roles that interview in January–March next.
- Online assessments will arrive before you feel ready. Take them: they are practice with stakes.

## 8. Mocks, design, stories (scaled to the ramp)

- **Mocks, about 22 in total.** None in week 1. Self-recorded in weeks 2–3 (45 minutes, a document with no code execution, talk out loud). Nadani and peers from week 4. Three or four full loops in week 13.
  - Every mock from week 4 ends with a follow-up that changes one constraint.
  - Nadani scores 1–4 on: clarify, approach, code, test, complexity, communication, follow-up.
- **Design, Mondays from week 3.** Object-oriented design first (Min Stack, parking lot, LRU cache, rate limiter), then one end-to-end system (URL shortener) and a key-value store. The bar for SWE I is clean classes, a sensible data model and depth on your own projects.
- **Stories, Wednesdays from week 3.** Two a fortnight, written by you, rehearsed aloud to a 2-minute timer. Twelve by day 90.

## 9. Checkpoints (recalibrated)

| | Date | On track if… | If not |
|---|---|---|---|
| **Day 30** | Mon Nov 9 | ~42 problems done; ≥65% of re-solves unaided; an Easy you have seen takes ≤15 min; 5 mocks; 4 story drafts; résumé out and 15 applications sent | Use buffer week 7 to catch up on the two weakest patterns; stay at 2 a day |
| **Day 60** | Wed Dec 9 | ~79 problems; ≥75% unaided; a Medium you have seen takes ≤25 min; a new Medium solved inside 45 min about half the time; mock average ≥2.5 of 4; 8 stories; 2 designs | Use buffer week 11; move the remaining tier-2 problems to stretch |
| **Day 90** | Fri Jan 8 | ~109 problems including all 64 core; ≥80% unaided; a new Medium in ≤35 min with the follow-up handled in 2 of the last 3 mocks; 12 stories; 3 object designs and 1 system design | Maintenance mode (1 new + 3 re-solves a day) while interviewing |

**When to change the pace** (check on Fridays):
- **Speed up:** two weeks in a row with ≥80% unaided re-solves and a median new Medium under 35 minutes → add a third problem on Mondays and Wednesdays, taken from the top of `stretch.csv`.
- **Slow down:** unaided rate under 60%, or more than 4.5 hours on three days in a week → one new problem a day for the next week. The buffer weeks absorb it.

**Track weekly:** unaided re-solve rate, median minutes per new Medium, mocks and their average, applications sent, hours actually worked.

## 10. Pattern cheat sheet (cue → technique)

| Cue | Technique |
|---|---|
| Seen before / pair / dedupe | set / dict |
| Count / group / anagram | frequency dict; tuple or sorted-string key |
| Subarray sum, negatives allowed | prefix sum + {prefix: count} |
| Sorted pair/triple, in place | two pointers |
| Longest/shortest contiguous run with a condition | sliding window (grow right, shrink left) |
| Matching / nesting / undo | stack |
| Next greater / smaller | monotonic stack of indices |
| Sorted input, or "smallest X that works" | binary search |
| List cycle / middle / kth from end | fast and slow pointers; dummy head |
| O(1) LRU | hash map + doubly linked list |
| Tree property | DFS that returns a value |
| Level by level / nearest | BFS with a deque |
| BST | in-order is sorted; (low, high) bounds |
| Prefix lookups | trie |
| Top-k / kth / running median | heap |
| Ranges / meetings | sort by start; heap of end times |
| All subsets / combinations / permutations | backtracking: choose → explore → undo |
| Regions in a grid | DFS or BFS + visited |
| Spreads over time / nearest source | multi-source BFS |
| Order with dependencies | topological sort |
| "Are these connected?" as edges arrive | union-find |
| Weighted shortest path | Dijkstra |
| Count ways / best cost with choices | DP: state → recurrence → table |
| Two sequences | 2D DP |
| Reach / jumps / partitions | greedy |

**Every round:** restate → clarify → examples and edge cases → brute force and its cost → better idea and why → code → trace → complexity → follow-up.

## 11. Files

- `planning/plan.md`: this plan.
- `planning/problems.csv`: the day-by-day schedule (411 rows).
- `planning/stretch.csv`: the 86 unscheduled problems, in priority order.
- `planning/weeks.md`: the weekly table above, as generated.
- `planning/gen.py`: regenerates all of it from the original problem list. Change the pace in one place (`new_cap`, `review_cap`) and rerun.
- `plan.md` and `problems.csv` in the repo root are the first version, left untouched.
