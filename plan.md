# 90-Day Full-Time Interview Plan: Stefen Ewers (Mon Oct 12, 2026 → Sun Jan 10, 2027)
**Target:** New-grad / SWE I loops at big tech, AI labs, top startups and elite fintech, in Python.

**Mode:** Interview prep is the full-time job.
- **Weekdays:** 5–6 focused hours in fixed blocks.
- **Saturday:** lighter, about 3 hours.
- **Sunday:** off.
- **Buffer weeks:** week 7 (Thanksgiving) and week 11 (holidays).
- **Days off:** Nov 26–27, Dec 24–25 and Jan 1.

> **Grief and burnout guardrails.**
> - The hours are a ceiling, not a quota.
> - If two days in a row feel heavy, take a "minimum day": the review block plus one problem, nothing more.
> - Never make up a missed day on Sunday. Buffer weeks exist to absorb slips.
> - Watch for warning signs and tell Nadani if any appear: dreading the desk, sleep under 7 hours for 3 or more nights, or the unaided rate falling 2 weeks in a row. The response is a lighter week, not more hours.

## 0. Starting point (from your repos; I only read them)
- **`stefenewers/reps`** (last commit Oct 8) is your Next.js + Pyodide practice app. It has:
  - A skill graph of about 80 skills and 635 code-first reps across Oct 2–11.
  - 25 capstones and 2 mocks.
  - Mastery scoring and spaced cold re-solves (`STEP_DAYS = [1, 3, 5]`).
  - Supabase sync and an optional coach.
- **Commit history:** 7 re-plans, with real pace about 2.5–4× planned.
  - **Confirmed done:** Python basics, sets, dicts, frequency maps, and the dictionary ladder (26/30).
  - **Not verifiable from the repo:** whether the later capstones were finished (that data is in Supabase).
- **`stefenewers/neetcode-submissions`** has about 85 Python-basics lessons and 3 DSA problems: 217 (×4), 242 (×1), 485 (×12).
- **What this means [inference]:** Python is fluent; pattern practice is mostly ahead of you.
  - 217, 242 and 485 are scheduled as re-solves only.
  - The 21 problems that already have a Reps capstone are flagged `reps_capstone=Y` in problems.csv. Use your own capstone or walkthrough first, and the video only if needed.

## 1. Research basis (labeled; sources)
- **Google:** 45-minute rounds in a Google Doc with no code execution. Follow-ups that change constraints are common. 2026 reports mention an "AI fluency" question and a pilot "code comprehension" round for some junior US roles. [community / prep site]
  - https://www.reddit.com/r/leetcode/comments/1nquj0q/
  - https://www.tryexponent.com/guides/google-software-engineer-intern-interview
- **Meta:**
  - An AI-enabled 60-minute CoderPad round has been in the loop since Oct 2025: a multi-file codebase with failing tests, then a feature, then optimization. AI is optional, and you're judged on your own understanding. [prep sites quoting candidates]
    - https://www.hellointerview.com/blog/meta-ai-enabled-coding
    - https://www.coditioning.com/blog/13/meta-ai-enabled-coding-interview-guide
  - Tech screen: 2 problems in about 35 minutes. [prep site] https://igotanoffer.com/en/advice/meta-coding-interviews
- **Amazon SDE I:** OA (2 coding problems plus a work simulation), then Leadership Principle (LP) questions in every round, a Bar Raiser, and often light OOP design. [prep sites]
  - https://interviewchamp.ai/interview-questions/amazon/swe-new-grad
  - https://copilotinterview.com/blog/amazon-new-grad-interview-process
- **Microsoft:**
  - 3–4 coding rounds plus an "As Appropriate" round.
  - Some 2026 new-grad loops included LLD and HLD. [prep sites; varies by org]
  - https://www.finalroundai.com/blog/new-grad-software-engineer-interview
- **Apple:** team-specific, often a deep dive on one project. https://interviewchamp.ai/interview-questions/apple/swe-new-grad
- **AI labs and fintech:** I didn't confirm their formats from primary sources.
  - [inference] Prepare for practical multi-step implementation, code review, and OA platforms (CodeSignal, HackerRank).
- **Learning science:** practice testing (retrieval) and distributed (spaced) practice are rated high utility; interleaving and self-explanation moderate. **[stat]**
  - Dunlosky et al. 2013: https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html
  - 2021 meta-analysis (242 studies; spaced vs massed practice d ≈ 0.60): https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full
  - [inference] Hence: cold re-solves at +3/+10/+30 days, mixed-topic mocks, think-aloud, and fixed feedback loops.

## 2. Daily structure (weekdays, about 5.5 focused hours)
| Block | Time (ET) | Duration | What |
|---|---|---|---|
| **A. New problems, timed** | 9:00–11:45 | about 2h 30m including a 10-minute break | 3 problems (4 on Mon and Wed). For each: 45-minute timebox, think aloud (record yourself 1×/day), brute force → optimal, name the data structure and why, complexity aloud, code from blank, test 1 normal + 2 edge cases. Only then the video or your Reps walkthrough. |
| Lunch + walk | 11:45–12:45 | 60 min | Away from screens. |
| **B. Re-solves** | 12:45–2:30 | about 1h 45m | Up to 8 due re-solves, cold, about 12–15 minutes each. Stuck after 15 minutes → read your note card → retry. If it fails again it comes back in +3 days. Interleave topics; don't batch them. |
| Break | 2:30–2:45 | 15 min | |
| **C. Rotating afternoon block** | 2:45–4:15 | 90 min | Mon: design (LLD/HLD). Tue: mock #1. Wed: behavioral (draft + rehearse 2 stories). Thu: mock #2 or AI-assisted / code-comprehension drill. Fri: OA-style timed set (2 problems in 70 minutes on LeetCode or CodeSignal practice) or mock #3. |
| **D. Log + retro** | 4:15–4:35 | 20 min | Tracker rows, pattern note cards, tomorrow's plan. Friday: 30-minute weekly retro. |
| Off | 4:35 onward | | No study at night. Exercise, people, rest. |

**Saturday (about 3h, lighter):** 2 new problems (none in buffer weeks and week 13), up to 4 re-solves, and one light item: a story retell, design reading, or a peer mock. **Sunday:** off.

**Minimum day (any time you need it):** block B, plus one problem from block A, then stop.

## 3. Curriculum and volume
- **Order:** NeetCode 150 roadmap order, which matches your Reps skill graph, with Google/Meta-tagged extras slotted into each topic. The extras come from community company-tag lists such as https://github.com/liquidslr/leetcode-company-wise-problems and from reported intern and new-grad questions. Topic sequence:
  1. Arrays/hashing and prefix sums.
  2. Two pointers and sliding window.
  3. Stack.
  4. Binary search.
  5. Linked list.
  6. Trees.
  7. Tries, heaps and intervals.
  8. Backtracking.
  9. Graphs and advanced graphs.
  10. 1D DP and greedy.
  11. 2D DP.
  12. Matrix and math.
- **Volume:** **195 new + 3 already-solved = 198 unique problems in the 90 days.**
  - 141 NeetCode 150 problems plus 54 Google/Meta-tagged extras. With 217 and 242 already solved, that covers 143 of the NeetCode 150; the other 7 are the bit-manipulation stretch problems below.
  - **9 stretch problems are unscheduled** (bit manipulation 136/191/338/190/268/371/7, plus 1146 and 68). Pull them in early if you're ahead.
- **Re-solves:** each problem is scheduled at **+3, +10 and +30 days** (471 re-solve sessions in total).
  - The +3 and +10 re-solves take priority.
  - About 117 +30 re-solves (and the last few +3/+10 ones) fall after Jan 10 or beyond capacity. They become the maintenance queue (5 per day after Jan 10).
- **Video links:** every link in problems.csv was checked with YouTube oEmbed (title contains the LC number; channel NeetCode/NeetCodeIO). Lengths come from yt-dlp; a blank length means YouTube's bot check blocked it.
  - 474 of 666 rows have a link. Rows without one are the Google/Meta-tagged extras, LC 485 and LC 1046 (that video failed the check).
  - The 371 video is NeetCode's Java version.
- **Premium problems:** LC 271, 286, 261, 323, 252, 253 and 269 are LeetCode Premium. Solve them free on neetcode.io.

## 4. Weekly calendar
| Wk | Dates | Theme | New (LC) | Re-solves | Mocks | Design track | Behavioral |
|---|---|---|---|---|---|---|---|
| 1 | Oct 12–Oct 18 | Arrays, hashing, prefix sums, design-lite | 17: 1, 49, 347, 128, 238, 271, 36, 560, 724, 88, 283, 303, 13, 14, 380, 75, 528 | 12 | 1 self + 1 Nadani | OOP basics: classes, invariants (Min Stack/GetRandom) | Stories 1–2 |
| 2 | Oct 19–Oct 25 | Two pointers + sliding window | 19: 11, 15, 125, 167, 31, 680, 977, 3, 42, 121, 424, 209, 438, 567, 904, 1004, 1423, 76, 239 | 25 | 2 (self, Nadani) | LLD: parking lot | Stories 3–4 |
| 3 | Oct 26–Nov 01 | Stack, monotonic stack, binary search | 19: 20, 22, 150, 155, 739, 853, 1047, 71, 394, 735, 1249, 84, 227, 503, 74, 704, 875, 33, 153 | 37 | 2 (Nadani, peer) | LLD: LRU / rate limiter | Story 5 + LP map |
| 4 | Nov 02–Nov 08 | Binary search adv + linked lists · Day 30 = Tue Nov 10 | 19: 34, 162, 981, 1011, 4, 658, 1539, 21, 141, 143, 206, 2, 19, 138, 23, 146, 287, 25, 226 | 38 | 2 + OA set | LLD: library / elevator | Story 6 + retell 1–5 |
| 5 | Nov 09–Nov 15 | Trees DFS/BFS/BST | 19: 100, 104, 110, 543, 102, 235, 572, 98, 199, 230, 1448, 105, 236, 938, 129, 437, 863, 124, 987 | 43 | 2 (Nadani, peer) | HLD primer: client-server, APIs, DB choice | Story 7 |
| 6 | Nov 16–Nov 22 | Tries, heaps, intervals | 19: 208, 211, 297, 1268, 212, 703, 1046, 215, 355, 621, 973, 692, 767, 1094, 56, 57, 295, 252, 435 | 44 | 2 + 1 AI-assisted | HLD: URL shortener | Story 8 |
| 7 | Nov 23–Nov 29 | BUFFER (Thanksgiving): reviews, mocks, OA set; Nov 26–27 off | 0: — | 28 | 2 + OA set | Review designs; code-comprehension drill | Retell all |
| 8 | Nov 30–Dec 06 | Intervals adv, backtracking, grids | 19: 253, 452, 729, 986, 39, 78, 1851, 40, 46, 79, 90, 17, 131, 698, 51, 200, 695, 133, 286 | 44 | 3 (Nadani ×2, peer) | HLD: news feed / chat (simplified) | Stories 9–10 + "why X" ×3 |
| 9 | Dec 07–Dec 13 | Graphs: BFS, topo, union-find, Dijkstra, MST · Day 60 = Thu Dec 10 | 19: 130, 417, 542, 994, 752, 909, 1091, 207, 210, 261, 323, 399, 684, 721, 127, 743, 1584, 787, 1631 | 44 | 3 + OA set | LLD: in-memory KV store w/ snapshots; AI-assisted drill | Behavioral mock (Amazon LP) |
| 10 | Dec 14–Dec 20 | Adv graphs, 1D DP, greedy | 19: 70, 269, 332, 778, 198, 213, 746, 5, 91, 322, 647, 139, 152, 300, 53, 279, 416, 45, 55 | 44 | 3 (incl. AI-assisted) | HLD: rate limiter at scale, caching | Story 11–12 |
| 11 | Dec 21–Dec 27 | BUFFER (holidays): reviews + 2 mocks; Dec 24–25 off | 0: — | 28 | 2 | Light: 1 design write-up | Light retell |
| 12 | Dec 28–Jan 03 | Greedy, 2D DP (Jan 1 off) | 16: 134, 763, 846, 1899, 62, 678, 1143, 97, 309, 494, 518, 64, 221, 329, 72, 115 | 36 | 3 (incl. paid/anon if possible) | Debug/code-review drills; Knovel system deep-dive | Behavioral mock |
| 13 | Jan 04–Jan 10 | Hard DP, matrix/math, mock week · Day 90 = Sun Jan 10 | 10: 10, 312, 48, 54, 73, 202, 50, 66, 43, 2013 | 48 | 3–4 full loops | Mixed design mocks | Final polish |

Day-by-day list: `problems.csv`. Columns: week, day, date, LC, title, pattern, difficulty, source (NC150 or extra), type (new / review1–3), reps_capstone, neetcode_video, video_length.

## 5. Mock cadence (about 30 in total)
| Weeks | Per week | Mix |
|---|---|---|
| 1–2 | 2 | Self (recorded, 45 minutes, Google Doc) + Nadani |
| 3–7 | 2 | Nadani + a peer platform (Exponent peer mocks, formerly Pramp, or similar) |
| 8–10, 12 | 3 | Nadani ×2 + peer; one per fortnight is AI-assisted (see below) |
| 13 | 3–4 | Full mini-loops: 2 coding + 1 behavioral back to back; at least 1 paid/anonymous (e.g. interviewing.io) if the budget allows |

**Mock formats to rotate:**
- **Google-style:** Google Doc, no execution, 1 Medium + follow-up.
- **Meta-style:** 2 Mediums in 40 minutes.
- **Amazon-style:** 1 Medium + 2 LP questions.
- **OA:** 2 problems in 70 minutes, hidden tests.
- **AI-assisted (Meta-style):**
  - A small multi-file Python repo with a failing test (e.g. one of your own projects).
  - 60 minutes: fix the bug → add a feature → optimize, with an AI chat allowed.
  - You must explain and verify every line.

**Scoring:** Nadani scores 1–4 on clarify / approach / code / test / complexity / communication / follow-up. These are the INTERVIEW_BEHAVIOURS in `data/program.ts`. Log the scores.

## 6. Design track (from week 1, Mondays plus some Thursdays)
- **Weeks 1–4, OOP/LLD:** classes, invariants and APIs (Min Stack, GetRandom), parking lot, LRU and token-bucket rate limiter, library or elevator. Deliverables: class diagram, method contracts, tests, extension discussion.
- **Weeks 5–6, HLD primer:** client/server, REST, SQL vs NoSQL, indexes, caching, queues. Then a URL shortener end to end (API, schema, ID generation, cache, scaling).
- **Weeks 8–10:**
  - A simplified news feed and chat.
  - An in-memory KV store with snapshots (LLD + code).
  - A rate limiter at scale.
  - An AI-assisted refactor drill.
- **Weeks 12–13:**
  - Code review and debugging drills: read about 200 unfamiliar lines, find the bugs, explain them.
  - A deep dive on your Knovel system: architecture, tradeoffs, what you'd change.
  - Mixed design mocks.
- **Bar for SWE I [inference]:** clean classes and APIs, data modeling, sensible tradeoffs, and depth on your own work. No distributed-consensus depth.

## 7. Behavioral track (weekly)
- **Wednesday block C:** draft 2 stories, or rehearse aloud with a 2-minute timer. Use `behavioral_bank.md`.
- **Targets:**
  - 8 stories by Day 30 (drafts).
  - 12 polished stories by Day 60, mapped to Amazon LPs and generic themes.
  - "Why company X" answers for 5 target companies by Day 90.
- **Behavioral mocks:** weeks 9, 12 and 13 (Amazon LP style, with "why?" follow-ups).

## 8. Checkpoints (raised for full time)
| | Date | Ready if… | If not |
|---|---|---|---|
| **Day 30** | Tue Nov 10 | ~70 problems solved; ≥70% of re-solves unaided; Easy cold ≤12 min; seen Medium cold ≤20 min; first-attempt Medium solved in ≤45 min about 50% of the time; 8 mocks done, average ≥2.5/4; 2 LLD designs; 8 story drafts | Week 7 becomes catch-up on the weakest 2 patterns; drop to 3 new/day |
| **Day 60** | Thu Dec 10 | ~145 problems; ≥80% unaided re-solves; unseen Medium ≤35 min about 60% of the time; OA set: both problems passing in 70 min, 2 of the last 3; mock average ≥3/4; URL shortener and KV store designs explainable; 12 stories | Week 11 catch-up; push Hard DP to "stretch" |
| **Day 90** | Sun Jan 10 | ~198 problems; ≥85% unaided re-solves; unseen Medium in ≤30 min with a follow-up handled in 3 of the last 4 mocks; one Hard partially solved with an optimal approach explained; an AI-assisted mock passed; 2 HLD + 4 LLD designs; 12 polished stories + 5 "why X" answers | Maintenance mode (2 new + 5 re-solves/day) while applying; schedule easier-fit loops first |

**Track weekly** (from the tracker):
- Unaided re-solve rate.
- Median minutes per new Medium.
- Percentage of solves with complexity stated aloud.
- Mock average.
- Stories polished.
- Hours actually worked (a burnout signal).

## 9. Pattern cheat sheet (cue → technique)
| Cue | Technique |
|---|---|
| Seen before / pair / dedupe | set / dict |
| Count / group / anagram | Counter; tuple key |
| Subarray sum, negatives allowed | prefix sum + {prefix: count} |
| Sorted pair/triple, in-place | two pointers |
| Longest/shortest contiguous with a condition | sliding window (grow right, shrink left) |
| Window max/min | monotonic deque |
| Matching / nesting / undo / evaluate | stack |
| Next greater/smaller | monotonic stack of indices |
| Sorted or "min X that works" | binary search (monotonic ok(mid)) |
| List cycle / middle / kth from end | fast/slow, gap pointers; dummy head |
| O(1) LRU / insert-delete-random | hash map + DLL / array swap-pop |
| Tree property | DFS returning a value or a tuple |
| Level / nearest in tree or grid | BFS with deque, level snapshot |
| BST | in-order is sorted; (lo, hi) bounds |
| Prefix lookups | trie |
| Top-k / kth / stream median | heap(s) |
| Ranges / meetings | sort by start; heap of ends; sweep line |
| All combos / subsets / perms | backtracking choose → recurse → undo |
| Regions in a grid | DFS/BFS + visited |
| Spread over time / nearest source | multi-source BFS |
| Ordering with dependencies | Kahn topo sort |
| Dynamic connectivity | union-find |
| Weighted shortest path | Dijkstra; ≤k edges → Bellman-Ford / BFS by level |
| Connect all cheaply | MST (Prim/Kruskal) |
| Count ways / min cost with choices | DP: state → recurrence → memo → table |
| Two sequences | 2D DP dp[i][j] |
| Reach / jumps / partitions | greedy (farthest reach, last index) |

**Every round:** restate → clarify → examples and edge cases → brute force + complexity → optimal + why → code → trace → complexity → follow-up.

## 10. How this plugs into `reps`
- Proposed additive files are in `repo-additions/` (problem list, program/phases, design and story data shapes, a docs page).
- `rebuild_prompt.md` is a paste-ready prompt for Claude Code or Cursor. It rebuilds `reps` for this plan on branch `90-day-rebuild` with a PR, archives the October content, and uses additive migrations.

## Files
- `plan.md`
- `problems.csv`
- `gen.py` (regenerates problems.csv)
- `video_verification.tsv` (oEmbed/yt-dlp results that gen.py reads)
- `tracker_template.csv`
- `behavioral_bank.md`
- `rebuild_prompt.md`
- `repo-additions/`
