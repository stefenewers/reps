# 90-Day Interview Plan, ladder edition: Stefen Ewers (Sun Oct 11, 2026 → Fri Jan 8, 2027)

**Target:** full-time **SWE I (new-grad)** interview loops, in Python. Not internships.
**The method is the one that worked for dictionaries.** Every pattern is learned from the ground up in Reps, checked, and only then applied on LeetCode.

> **You come first.** You have just lost someone. The hours below are a ceiling, never a quota.
> - Any day can be a **minimum day**: the re-solves, the next few ladder reps, stop. That is a full day's credit.
> - A missed day is never made up on a Sunday. The two buffer weeks exist to absorb slips.
> - If you dread the desk, sleep under 7 hours three nights running, or two days in a row feel heavy: take minimum days, and tell Nadani.

## 1. How every pattern runs

```
ladder in Reps  →  mastery check  →  LeetCode problems  →  spaced re-solves
(ground up)        (cold, no           (that pattern,        (+3, +10 and
                   solution)           attempt-first)        +30 days)
```

1. **Ladder.** The pattern's reps in Reps, smallest idea first: trace it, write it, break it, fix it, then its capstone. Basics, plain-English briefs and walkthrough videos are one tap away.
2. **Mastery check.** That pattern's cold reps, from a blank editor. Each must be passed **without opening the solution** before anything after it unlocks. Hints and Basics are fine.
3. **LeetCode problems.** By now they are applications of something you can already do. Attempt for up to 30 minutes, then study.
4. **Re-solves.** Every LeetCode problem comes back three times, cold, about 15 minutes each.

A capstone you solve inside Reps **is** that LeetCode problem (Two Sum, Valid Palindrome, Number of Islands and 19 more). Its re-solves happen on LeetCode.

**Why this and not "problem + video":** your own data. Problems you reached through the dictionary ladder took 3–13 minutes and you solved them unaided. Problems you met cold took 24, 47 and 71 minutes with the solution open.

## 2. Starting point (measured, Oct 10)

- **Reps done:** 114 of 689. Solid on Python basics, sets, dictionaries and frequency maps.
- **LeetCode-style problems passed:** 7 (4 unaided).
- **Focused time per active day:** two long days (7.9 h and 6 h); every other day under 2 hours.
- **Pace:** a Reps rep takes you about 2.5× its planned minutes. The plan uses 2.25×, because later ladders reuse moves you already have.
- **Not started:** sliding window, stacks, binary search, linked lists, trees, graphs, heaps, DP. Each has an authored ladder waiting.

## 3. Volume

| | Count |
|---|---|
| Ladder reps in Reps | **499** across 15 patterns |
| LeetCode problems | **66**: 44 solved on LeetCode + 22 as Reps capstones |
| LeetCode re-solves scheduled | **165** (48 more fall after Jan 8: the maintenance queue, 3 a day) |
| Left for when you are ahead | `stretch.csv`, in priority order |

- The 66 are **62 Blind 75 problems** plus four other Reps capstones (Two Sum II, Binary Search, Kth Largest Element, Subsets). The Blind 75 problems not scheduled are its four hardest Hards, three DP problems and the bit-manipulation set; they lead `stretch.csv`.
- Fewer LeetCode problems than the first plan (198), on purpose: 499 ladder reps are where the skill gets built. A pattern you own makes the next ten problems fast.
- Three low-yield ladders are left out: extra pointer patterns, the separate max-heap drill, and the second components drill (Number of Islands teaches it).
- Tries and matrix problems have no ladder in Reps, so their first problem is **study-first**: watch the walkthrough, then write it from blank.

## 4. The three phases

| Phase | Dates | New work per day | Re-solves per day | Extra block | Ceiling |
|---|---|---|---|---|---|
| **Soft start** | Oct 11–17 | ~80 min | up to 2 | none | ~1.5–2 h |
| **Build** | Oct 19–Nov 7 | ~130 min (80 Sat) | up to 3 (2 Sat) | 30–45 min, Mon–Fri | ~3–3.5 h |
| **Full** | Nov 9–Jan 2 | ~155 min (95 Sat) | up to 5 (3 Sat) | 45–60 min, Mon–Fri | ~4–4.5 h |
| **Final week** | Jan 4–8 | ~100 min | up to 5 | mocks | ~4 h |

"New work" is ladder reps or new LeetCode problems, in real minutes at your pace. Sundays are off after tomorrow. Days off: Nov 26–27, Dec 24–25, Jan 1.
**Buffer weeks (7 and 11) carry no ladder work.** Week 7 has mixed interview practice in Reps; week 11 has re-solves only. If you slip, they absorb it.

**A weekday in the Full phase**

| Block | Length | What |
|---|---|---|
| A. New work | ~2 h 30 m | Today's ladder reps in Reps, or today's new LeetCode problems |
| Break + walk | 30–60 min | Away from screens |
| B. Re-solves | ~1 h 15 m | Up to 5 on LeetCode, cold, topics mixed. Plus any cold reps Reps says are due |
| C. Rotating block | 45–60 min | Mon design · Tue mock · Wed stories · Thu applications · Fri mock or timed set |
| D. Log | 5 min | Tap Unaided or Needed help on each LeetCode problem in Reps |

No studying at night.

## 5. Where everything lives

- **Reps → Today** shows the day's ladder reps and, under them, the day's LeetCode list with links, walkthroughs and the Unaided / Needed help buttons.
- **A re-solve you needed help on:** redo it tomorrow before it rejoins the schedule.
- **The mastery checks lock what follows.** If one is blocking you for more than a day, that is information: do its ladder reps again, don't skip it.
- `planning/problems.csv` is the LeetCode side, day by day. `data/schedule-90.ts` is what the app reads. Both are generated by `planning/gen.py`.

## 6. Research basis

- **Spacing.** Cepeda et al. (2008, 1,350+ people): the best gap between reviews grows with how long you need to remember, about 20–40% of a one-week delay and 5–10% of a one-year delay. → re-solves at +3, +10, +30 days. [PubMed](https://pubmed.ncbi.nlm.nih.gov/19076480/)
- **Worked examples and building up.** A University of Delaware meta-analysis in mathematics found about half a standard deviation of benefit from studying worked examples; programming studies are smaller and mixed, showing less wasted time and lower mental load. → ladders, Basics and walkthroughs before the hard problem. [Poster](https://www.cehd.udel.edu/wp-content/uploads/2022/02/Worked-Examples-Meta-Poster_022722_SC.pdf) · [NSF study](https://par.nsf.gov/biblio/10598698-impact-connecting-worked-examples-completion-problems-introductory-programming-practice)
- **Trying before being taught** helps once you have the knowledge to make real attempts; there is no fixed number of minutes. → attempt-first with a 30-minute cap, after the ladder. [Kapur summary](https://www.schoolbag.edu.sg/story/parents-let-your-child-struggle-first)
- **Grief** can blunt concentration and working memory for a while; the solid studies are in older adults and show modest effects. → a small first week. [Adelaide study](https://drmc.library.adelaide.edu.au/dspace/handle/2440/44337?mode=full)
- **Hiring calendar** (job-board guides, not company pages): main new-grad window August–October, second wave January–March. → apply from week 3. [Simplify](https://simplify.jobs/blog/microsoft-aspire-new-grad-swe-guide) · [2027 timeline](https://www.applybolt.app/guide/2027-new-grad-jobs)
- **Formats** (prep sites quoting candidates): 45-minute rounds with a follow-up that changes one constraint; Meta's 60-minute AI-enabled round on a multi-file project. → follow-up reps in the ladders; one AI-assisted drill in week 10. [interviewing.io](https://interviewing.io/blog/how-to-use-ai-in-meta-s-ai-assisted-coding-interview-with-real-prompts-and-examples)

## 7. Weekly calendar

| Wk | Dates | Patterns | Ladder reps (in Reps) | New on LeetCode | Re-solves | Mocks | Design · stories · applications |
|---|---|---|---|---|---|---|---|
| 1 | Oct 11–Oct 17 | Hashing | 35 | 49, 128, 238 | 7 | — | — |
| 2 | Oct 19–Oct 24 | Hashing, Strings + two pointers | 44 | 271 | 10 | 1 self (recorded) | Résumé final; list of SWE I postings open now |
| 3 | Oct 26–Oct 31 | Strings + two pointers, Sliding window, Stacks | 34 | 11, 15, 424, 76 | 10 | 1 self | Object design: Min Stack; stories 1–2; 5 applications |
| 4 | Nov 2–Nov 7 | Stacks, Binary search, Linked lists | 52 | 153, 33 | 9 | 2 (self + Nadani) | Object design: parking lot; stories 3–4; 5 applications |
| 5 | Nov 9–Nov 14 | Linked lists, Recursion + trees | 58 | 141, 19, 143, 23 | 16 | 2 | LRU cache design; story 5; 5 applications · **Day 30 = Mon Nov 9** |
| 6 | Nov 16–Nov 21 | Recursion + trees, Tries, BFS + grids | 35 | 572, 235, 98, 230, 105, 124, 208, 211 | 17 | 2 | Rate limiter design; story 6; 5 applications |
| 7 | Nov 23–Nov 28 | Interview practice | 50 | — | 19 | 1 | **Buffer.** Interview practice in Reps; catch up or rest (Nov 26–27 off) |
| 8 | Nov 30–Dec 5 | BFS + grids, Graphs | 54 | — | 13 | 2 + 1 timed set | System design primer; stories 7–8; 5 applications |
| 9 | Dec 7–Dec 12 | Graphs, Sorting + heaps | 47 | 133, 417, 261, 323 | 10 | 2 | URL shortener; behavioral mock · **Day 60 = Wed Dec 9** |
| 10 | Dec 14–Dec 19 | Sorting + heaps, Intervals, Backtracking | 51 | 57, 252, 435, 253 | 15 | 2 (1 AI-assisted) | Key-value store design; stories 9–10 |
| 11 | Dec 21–Dec 26 | Re-solves | 0 | — | 18 | 1 | **Buffer.** Re-solves only; rest (Dec 24–25 off) |
| 12 | Dec 28–Jan 2 | Backtracking, Dynamic programming | 39 | 39, 79, 213, 53 | 10 | 2 | Code-review drill; stories 11–12 (Jan 1 off) |
| 13 | Jan 4–Jan 8 | Dynamic programming, Matrix | 0 | 55, 322, 139, 300, 5, 62, 1143, 48, 54, 73 | 11 | 3–4 full loops | Final polish · **Day 90 = Fri Jan 8** |

**Mastery checks land on:** Hashing Oct 15–16 · Strings + two pointers Oct 26 · Windows + stacks Nov 4 · Binary search + linked lists Nov 11 · Trees Nov 18 · BFS + grids Dec 4 · Graphs Dec 9–10 · Heaps + intervals Dec 16–17 · Backtracking + DP Dec 31.

**Applications:** five a week from week 3 (Thursday block), full-time new-grad / SWE I / "University Grad" roles only. Online assessments will arrive before you feel ready; take them.
**Optional, when you are able:** a two-line note to the Google recruiter about the internship interview. The internship is no longer the goal, but "family bereavement" is better than silence with a contact you may want for full-time roles.
**Mocks:** about 22. None in week 1; self-recorded in weeks 2–3; Nadani and peers from week 4, each ending with a follow-up that changes one constraint; full loops in week 13. Scored 1–4 on clarify, approach, code, test, complexity, communication, follow-up.

## 8. Checkpoints

| | Date | On track if… | If not |
|---|---|---|---|
| **Day 30** | Mon Nov 9 | 5 patterns finished (hashing, pointers, windows, stacks, binary search); ~18 LeetCode problems; ≥65% of re-solves unaided; every mastery check so far cleared; 5 mocks; 4 story drafts; 15 applications | Buffer week 7 becomes catch-up on the weakest pattern's ladder |
| **Day 60** | Wed Dec 9 | 9 patterns finished (plus linked lists, trees, tries, BFS + grids); ~38 problems; ≥75% unaided; a problem you have seen takes ≤20 min; mock average ≥2.5 of 4; 8 stories; 2 designs | Buffer week 11 becomes catch-up; the DP tail moves to stretch |
| **Day 90** | Fri Jan 8 | All 15 patterns; ~66 problems; ≥80% unaided; a new Medium in ≤35 min with the follow-up handled in 2 of the last 3 mocks; 12 stories; 3 object designs and 1 system design | Maintenance mode (a few ladder reps + 3 re-solves a day) while interviewing |

**When to change the pace** (check on Fridays):
- **Speed up:** two weeks running with ≥80% unaided re-solves and ladder days finishing early → add one problem a day from the top of `stretch.csv`.
- **Slow down:** unaided rate under 60%, or more than 4.5 hours on three days in a week → halve the ladder reps for a week. The buffer weeks absorb it, and I can regenerate the schedule from where you are.

## 9. Pattern cheat sheet (cue → technique)

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

## 10. Files

- `planning/plan.md`: this plan.
- `planning/problems.csv`: the LeetCode side, day by day.
- `planning/stretch.csv`: unscheduled problems, in priority order.
- `planning/weeks.md`: the weekly table, as generated.
- `planning/gen.py`: regenerates the schedule. Change the pace in one place (`budget`, `review_cap`, `REPS_FACTOR`) and rerun.
- `planning/reps-sections.json`, `planning/done.json`: the generator's inputs (authored reps; what you had passed on Oct 10).
- `data/schedule-90.ts`: generated; what the Reps app reads.
- `plan.md`, `problems.csv`, `rebuild_prompt.md` in the repo root: the first version, left untouched.
