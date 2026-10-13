# 90-Day Interview Plan, ladder edition: Stefen Ewers (Mon Oct 12, 2026 → Sat Jan 9, 2027)

**Target:** full-time **SWE I (new-grad)** interview loops, in Python. Not internships.
**The method is the one that worked for dictionaries.** A LeetCode problem is the final integration test of a prerequisite graph: every pattern is learned from the ground up in Reps and checked, and every problem is reached through the building blocks it needs.
**Day 1 is Monday, October 12.** Everything passed before then stays as it is and counts.

> **You come first.** You have just lost someone. The hours below are a ceiling, never a quota.
> - Any day can be a **minimum day**: the re-solves, the next few ladder reps, stop. That is a full day's credit.
> - A missed day is never made up on a Sunday. The two buffer weeks exist to absorb slips.
> - If you dread the desk, sleep under 7 hours three nights running, or two days in a row feel heavy: take minimum days, and tell Nadani.

## 1. How every pattern, and every problem, runs

```
primer → ladder → mastery check → [ bridge → problem ] for each problem → spaced re-solves
         (ground    (cold, no        (the moves the      (attempt,          (+3, +10 and
          up)        solution)        ladder did not      then log)          +30 days)
                                      teach)
```

1. **Primer.** One short page per idea: what it is, the lines you will type, the mistakes that happen. **The first time you meet an idea, it is shown before the question** (concept, mental model, a tiny example, then "Your rep"), not hidden behind a button. Once you have produced the idea yourself it stops appearing on its own and stays behind Basics.
2. **Ladder.** The pattern's reps in Reps, smallest idea first: trace it, write it, a different shape, break it, fix it, combine it, then its capstone.
3. **Mastery check.** Cold reps from a bare signature. Each must be passed **without opening the solution** before anything after it unlocks. Hints and Basics are fine. All 15 patterns have one.
4. **Unlabeled transfer.** Before each capstone, and at the end of each bridge, one small problem is stated cleanly and does **not** say which technique to use: recognising it is part of the rep. The page hides the skills it trains until you pass.
4a. **Bridge.** A pattern ladder is not enough: most problems need one or two moves the ladder never trained (prefix and suffix passes for Product of Array Except Self; which half is sorted for a rotated search). Each problem lists its **building blocks**, named moves like "spot where a run starts". Blocks the ladder already covers are ticked by the ladder reps; the rest are taught by the problem's bridge, 2–7 reps placed **directly before the problem**, ending on a miniature version written from a signature.
5. **The problem.** When every block is ready, the problem is those moves assembled. Attempt for up to 30 minutes, then log it.
6. **If it needed help, it is not finished.** Rebuild it from a blank editor, then go back down the ladder to the block that broke (Reps starts that block's reps as a repair set).
7. **Re-solves.** Every problem comes back three times, cold, about 15 minutes each: 3–4, 10–12 and 30–33 days after you first solve it.

A capstone you solve inside Reps **is** that LeetCode problem (Two Sum, Valid Palindrome, Number of Islands and 19 more); its building blocks are its ladder sections, and its re-solves happen on LeetCode.

**Two different questions, kept apart.** *Pattern mastery*: how reliably can I execute this technique? *Problem readiness*: have I demonstrated every block this problem needs? You can be strong at hashing and one move short of Product of Array Except Self. When a problem feels impossible, the Problems page names the missing block.

**Skill reviews and problem re-solves are also separate.** A skill ("can I still produce the move?") comes back as a cold rep +1, +3, +7, +14 and +30 days after you first write it. A problem ("can I still solve the whole thing?") comes back at +3, +10, +30.

**Videos.** Every scheduled LeetCode problem keeps its verified walkthrough, shown next to the problem with how to use it: after a real attempt, pause when the code starts, write it yourself, finish the video to compare, then rebuild from blank.

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
| Reps in Reps | **603**: 371 ladder, 70 mastery-check, 112 bridge, 50 mixed interview practice |
| Problems | **52**: 22 as Reps capstones + 30 on LeetCode, each of the 30 behind its bridge |
| Re-solves scheduled | **143**, each inside its window (28 more fall after Jan 9: the maintenance queue) |
| Ready for when you are ahead | **15 more problems with their bridges already written** (70 reps), in `stretch.csv` order |

| # | Pattern | Ladder | Check | Bridge | Problems (capstone + LeetCode) |
|---|---|---|---|---|---|
| 1 | Hashing | 25 | 8 | 12 | 2 + 3 |
| 2 | Strings + two pointers | 42 | 4 | 8 | 3 + 2 |
| 3 | Sliding window | 20 | 5 | 5 | 1 + 1 |
| 4 | Stacks | 19 | 5 | 0 | 1 + 0 |
| 5 | Binary search | 20 | 4 | 4 | 1 + 1 |
| 6 | Linked lists | 23 | 5 | 6 | 2 + 2 |
| 7 | Recursion + trees | 36 | 6 | 15 | 3 + 4 |
| 8 | Tries | 15 | 4 | 6 | 0 + 2 |
| 9 | BFS + grids | 37 | 3 | 0 | 2 + 0 |
| 10 | Graphs | 32 | 4 | 8 | 1 + 2 |
| 11 | Sorting + heaps | 35 | 5 | 0 | 2 + 0 |
| 12 | Intervals | 8 | 5 | 11 | 1 + 3 |
| 13 | Backtracking | 18 | 4 | 5 | 1 + 1 |
| 14 | Dynamic programming | 27 | 4 | 28 | 2 + 7 |
| 15 | Matrix | 14 | 4 | 4 | 0 + 2 |

**What changed from the first ladder edition, and the honest cost.** Six patterns had no mastery check and two (tries, matrix) had no ladder at all; they do now. And every LeetCode problem now has a bridge. Done in full, that is about 49 more hours than 90 days hold at your measured pace, so three things were trimmed, in this order, and the method was not one of them:

**Teaching is never what gets trimmed** (Oct 13 audit). Whatever the spine below removes, a ladder section always keeps the first rep to carry each skill (a first exposure), the unlabeled transfer rep before each capstone, and the lead-in reps a later rep, check or capstone relies on (the variable-window trace, the first count-dict window, max over a tree, in-degree before Kahn, the tuple-key trace, the decision-tree trace, the take-or-skip trace). Two small sections came back for the same reason: connected components (the Graphs check asks for a component count) and the max-heap section (later reps and the check need the negation trick). That added 15 reps and swapped one problem: Word Break is in, Search in Rotated Sorted Array waits.

1. **Redundant reps left the pattern ladders** (they stay in the app as extras): the explain-after-capstone reps (the solve log and the mocks train explanation) and variations beyond each section's spine. A section keeps its trace, up to 2 guided writes, up to 4 from-signature writes and 2 debugs; after the first month, 1 guided and 3 from-signature, because by then the Python underneath is owned.
2. **A capstone is costed like the problem it is** (25–40 minutes), not as authored minutes × 2.25: ladder-reached solves measured 3–13 minutes.
3. **Fifteen problems wait for when you are ahead**, with their bridges written: the three Hards (Minimum Window Substring, Merge k Sorted Lists, Maximum Path Sum) and the costliest or rarest Mediums (Encode and Decode Strings, Pacific Atlantic, Construct Tree, LCS, Graph Valid Tree, Reorder List, Longest Palindromic Substring, Word Search, Non-overlapping Intervals, Set Matrix Zeroes, Search in Rotated Sorted Array, Decode Ways).

So the 90 days hold **52 problems learned deeply, not 67 met quickly**. The other route to more problems is more minutes: about 30 more minutes of new work a day in the Full phase brings roughly 8 of the 15 back inside the 90 days. That is a decision about your days, so it is yours; change `BUDGETS` in `planning/gen.py` and rerun.

- **At most 2 new LeetCode problems a day.** When a day has its two, it carries on with the next bridge or the next pattern's ladder.
- Union-find is not taught: the two graph problems that are usually shown with it (Number of Connected Components, Graph Valid Tree) are bridged with the DFS you already ladder.

## 4. The three phases

| Phase | Dates | New work per day | Re-solves per day | Extra block | Ceiling |
|---|---|---|---|---|---|
| **Soft start** | Oct 12–17 | ~80 min | up to 2 | none | ~1.5–2 h |
| **Build** | Oct 19–Nov 7 | ~130 min (80 Sat) | up to 3 (2 Sat) | 30–45 min, Mon–Fri | ~3–3.5 h |
| **Full** | Nov 9–Jan 2 | ~155 min (95 Sat) | up to 5 (3 Sat) | 45–60 min, Mon–Fri | ~4–4.5 h |
| **Final week** | Jan 4–9 | ~100 min | up to 5 | mocks | ~4 h |

"New work" is ladder reps or new LeetCode problems, in real minutes at your pace. Sundays are off. Days off: Nov 26–27, Dec 24–25, Jan 1.
**Buffer weeks (7 and 11) carry no ladder work.** Week 7 has mixed interview practice in Reps; week 11 has re-solves only (up to 5 a day, 4 on Saturday). If you slip, they absorb it.

**The arc of the 90 days.** Days 1–30 build fluency: ladders, debugging, from-scratch code, bridges; few blind jumps. Days 31–60 are transfer: shorter ladders, more problem attempts, cold re-solves and mixed sets. Days 61–90 are interview execution: timed Mediums, mocks, follow-ups, complexity aloud; ladders mostly return as repair sets when a problem shows a weak block.

**A weekday in the Full phase**

| Block | Length | What |
|---|---|---|
| A. New work | ~2 h 30 m | Today's ladder and bridge reps in Reps, then the problem they lead to |
| Break + walk | 30–60 min | Away from screens |
| B. Re-solves | ~1 h 15 m | Up to 5 on LeetCode, cold, topics mixed. Plus any cold reps Reps says are due |
| C. Rotating block | 45–60 min | Mon design · Tue mock · Wed stories · Thu applications · Fri mock or timed set |
| D. Log | 5 min | Tap Unaided or Needed help on each LeetCode problem in Reps |

No studying at night.

## 5. Pacing, not daily goals

The 15 modules are one ordered queue: ladder, check, then bridge and problem, bridge and problem, pattern after pattern. **Next up is always the first thing you have not done, whatever the date.** The calendar is a gauge laid over that queue:

- **Pace:** on pace, N working days ahead, or N behind, measured against the original line. Today's own work never counts against you.
- **Today's stretch:** how far today's pace would take you. A suggestion; the queue continues past it.
- **Forecast:** every date from today on shows what the current pace reaches by then, and when the queue finishes. Past days are a record of what you did.
- **Re-solves** fall due 3, 10 and 30 days after you actually solved each problem.
- **Missing a day** moves the gauge. Nothing is rebuilt and nothing is dropped. The buffer weeks take up the slack first; beyond that the finish date moves later.

The dates in §7 and §8 are the original line the gauge measures against.

## 5a. Training sessions: the queue is the roadmap, the session is today's prescription

Reps does not open on "the next unfinished thing". It opens on **Today's training**: a goal, where your last session left off, and blocks in order.

| Block | When | What it is |
|---|---|---|
| **Reactivate** | Something today's work leans on has not been produced for a while | One small rep per stale skill, ones you have passed before, primitives first. "You already learned this; we are warming it back up." |
| **Learn** | A move you have never produced | See it once (primer, trace), then type it straight away |
| **Drill** | Understood, not automatic | Small productions and debugs until the mechanics stop costing attention |
| **Combine** | The pieces exist, the combination does not | Ladder combines and the problem's bridge |
| **Prove** | Every building block is in place | The mastery check, the capstone, the LeetCode problem. Offered only then |
| **Maintain** | Already proven | Cold reps and re-solves that are due. Never ahead of what you are building toward |

- **Mastery and freshness are different things.** Mastery is what you have demonstrated; it never decays. Freshness is whether a skill was *produced* recently enough to rely on today: 3 days after its last productive pass, longer with every clean cold rep behind it (6, 12, 21, 30). Opening the app, watching a video or answering a multiple-choice question does not refresh anything.
- **A problem shows both:** learned 5 of 5 building blocks, ready today 3 of 5. The two stale ones get a quick rep each before the attempt.
- **When a rep fails twice,** Reps names the smallest thing that looks broken (syntax, a Python operation, a data-structure operation, how the moves combine, a boundary, an edge case) and offers 1–3 reps on exactly that, then brings you straight back. Plain wrong code at the right level stays where it is: no stepping back.
- **When it comes back clean,** it moves faster: a warm-up rep is skipped once its skills have come back clean three times in the session.
- **None of this changes the queue.** Repeats add evidence and freshness; they never undo or duplicate what the plan counts as complete. After a warm-up or a repair you are back at the same place in the queue.
- **The session review** at the end says what changed: came back clean, improved today, still developing, and what the next session starts with.

## 5b. Where everything lives

- **Reps → Today** shows the next rep, the problem it is **building toward** with its blocks ticked off, and the day's LeetCode list with links, walkthroughs and the Unaided / Needed help buttons.
- **Reps → Problems** shows every target with its building blocks, what is missing, the first-solve result, re-solve status and the next review. **Target conversion** (first solves that needed no help, after the ladder) is the measure of whether this method is working.
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

| Wk | Dates | Patterns | Reps (ladder, check, bridge) | New on LeetCode | Re-solves | Mocks | Design · stories · applications |
|---|---|---|---|---|---|---|---|
| 1 | Oct 12–Oct 17 | Hashing | 42 | 49, 128 | 7 | — | — |
| 2 | Oct 19–Oct 24 | Hashing, Strings + two pointers | 53 | 238, 11 | 9 | 1 self (recorded) | Résumé final; list of SWE I postings open now |
| 3 | Oct 26–Oct 31 | Strings + two pointers, Sliding window, Stacks | 46 | 15, 424 | 10 | 1 self | Object design: Min Stack; stories 1–2; 5 applications |
| 4 | Nov 2–Nov 7 | Stacks, Binary search, Linked lists | 59 | 153 | 9 | 2 (self + Nadani) | Object design: parking lot; stories 3–4; 5 applications |
| 5 | Nov 9–Nov 14 | Linked lists, Recursion + trees | 64 | 141, 19, 572 | 15 | 2 | LRU cache design; story 5; 5 applications · **Day 30 = Tue Nov 10** |
| 6 | Nov 16–Nov 21 | Recursion + trees, Tries, BFS + grids | 47 | 235, 98, 230, 208, 211 | 17 | 2 | Rate limiter design; story 6; 5 applications |
| 7 | Nov 23–Nov 28 | Interview practice | 48 | — | 13 | 1 | **Buffer.** Mixed interview practice in Reps; catch up or rest (Nov 26–27 off) |
| 8 | Nov 30–Dec 5 | BFS + grids, Graphs | 57 | — | 7 | 2 + 1 timed set | System design primer; stories 7–8; 5 applications |
| 9 | Dec 7–Dec 12 | Graphs, Sorting + heaps, Intervals | 58 | 133, 323 | 11 | 2 | URL shortener; behavioral mock · **Day 60 = Thu Dec 10** |
| 10 | Dec 14–Dec 19 | Intervals, Backtracking, Dynamic programming | 54 | 57, 252, 253, 39 | 16 | 2 (1 AI-assisted) | Key-value store design; stories 9–10 |
| 11 | Dec 21–Dec 26 | Re-solves | 0 | — | 9 | 1 | **Buffer.** Re-solves only; rest (Dec 24–25 off) |
| 12 | Dec 28–Jan 2 | Dynamic programming | 45 | 213, 53, 55, 322, 139 | 7 | 2 | Code-review drill; stories 11–12 (Jan 1 off) |
| 13 | Jan 4–Jan 9 | Dynamic programming, Matrix | 30 | 300, 62, 48, 54 | 13 | 3–4 full loops | Final polish · **Day 90 = Sat Jan 9** |

Jan 10 is a rest and debrief day; it is not part of the 90.

**Mastery checks land on (about):** Hashing Oct 14–15 · Strings + two pointers Oct 23 · Sliding window Oct 29 · Stacks Nov 2–3 · Binary search Nov 5 · Linked lists Nov 10 · Recursion + trees Nov 14 · Tries Nov 19–20 · BFS + grids Dec 3 · Graphs Dec 8 · Sorting + heaps Dec 12–14 · Intervals Dec 14–15 · Backtracking Dec 18 · Dynamic programming Dec 29–30 · Matrix Jan 7.

**Applications:** five a week from week 3 (Thursday block), full-time new-grad / SWE I / "University Grad" roles only. Online assessments will arrive before you feel ready; take them.
**Optional, when you are able:** a two-line note to the Google recruiter about the internship interview. The internship is no longer the goal, but "family bereavement" is better than silence with a contact you may want for full-time roles.
**Mocks:** about 22. None in week 1; self-recorded in weeks 2–3; Nadani and peers from week 4, each ending with a follow-up that changes one constraint; full loops in week 13. Scored 1–4 on clarify, approach, code, test, complexity, communication, follow-up.

## 8. Checkpoints

| | Date | On track if… | If not |
|---|---|---|---|
| **Day 30** | Tue Nov 10 | 5 patterns finished (hashing, pointers, windows, stacks, binary search), genuinely owned; ~18 problems; ≥65% of re-solves unaided; every mastery check so far cleared; 5 mocks; 4 story drafts; 15 applications | Buffer week 7 becomes catch-up on the weakest pattern's ladder |
| **Day 60** | Thu Dec 10 | 10 patterns finished (plus linked lists, trees, tries, BFS + grids, graphs); ~34 problems; ≥75% unaided; a problem you have seen takes ≤20 min; new problems no longer feel structurally alien; mock average ≥2.5 of 4; 8 stories; 2 designs | Buffer week 11 becomes catch-up; the DP tail waits |
| **Day 90** | Sat Jan 9 | All 15 patterns; ~52 problems learned deeply (more if you ran ahead); ≥80% unaided; a new Medium in ≤35 min with the follow-up handled in 2 of the last 3 mocks; clean Python from blank, tests and edge cases, complexity aloud; 12 stories; 3 object designs and 1 system design | Maintenance mode (a few ladder reps + 3 re-solves a day) while interviewing |

Watch **target conversion** alongside these: of the problems attempted after their blocks were in place, how many needed no help the first time. Low conversion on a pattern means its bridges are too thin, not that you are.

**When to change the pace** (check on Fridays):
- **Speed up:** two weeks running with ≥80% unaided re-solves and ladder days finishing early → take the next problem from "When you are ahead" on the Problems page: do its bridge, then the problem.
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
- `planning/stretch.csv`: unscheduled problems, in priority order; the 15 with a bridge ready come first.
- `data/exercises/bridges/`: the bridge packs (new ladders, mastery checks, problem bridges). `data/problem-bridges.ts`: every target's building blocks.
- `planning/bridges.json`: what the generator knows about the bridges (exported by `scripts/export-ladders.ts`).
- `planning/weeks.md`: the weekly table, as generated.
- `planning/gen.py`: regenerates the schedule. Change the pace in one place (`BUDGETS`, `REVIEW_CAPS`, `REPS_FACTOR`) and rerun; what does not fit moves to "when ahead" in the `DEMOTE` order.
- `planning/reps-sections.json`, `planning/done.json`: the generator's inputs (authored reps; what you had passed on Oct 10).
- `data/schedule-90.ts`: generated; what the Reps app reads.
- `archive/first-plan/`: the first version of the plan, its problem list (still the generator's source for metadata and video links) and the app-rebuild prompt.
