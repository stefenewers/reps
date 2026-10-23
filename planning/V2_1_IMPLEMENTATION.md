# Reps V2.1 implementation

Work stays on `v21-work`. `main` and the production deployment are untouched.

## Curriculum and completion

`planning/v21-artifacts/CURATION.json` contains all 14 plans, including the hand-curated Weeks 3 and 4, corrected gate skills for `g-contract`, and the corrected Week 10 rep ID. Every unit has an explicit required path and section classifications. Later topics in mixed sections are deferred; `o11-edges` is offered in Week 14 rather than Week 2. The migration audit classifies every authored exercise, including mocks and lab parts, as REQUIRED PATH, OPTIONAL, REPAIR INVENTORY, RETRIEVAL, PLACEMENT or STRETCH. Labs retain their separate binary obligations and receive no problem credit.

| Week | Path | Gate passes | Outside targets | Required load | Reserve | Weekly target |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 31 | 8 | 0 | 39 | 8 | 50 |
| 2 | 37 | 11 | 0 | 48 | 9 | 60 |
| 3 | 19 | 6 | 0 | 25 | 12 | 75 |
| 4 | 24 | 4 | 0 | 28 | 12 | 75 |
| 5 | 40 | 4 | 0 | 44 | 12 | 75 |
| 6 | 14 | 4 | 2 | 20 | 12 | 75 |
| 7 | 45 | 2 | 1 | 48 | 12 | 75 |
| 8 | 54 | 6 | 0 | 60 | 12 | 75 |
| 9 | 38 | 4 | 0 | 42 | 9 | 60 |
| 10 | 20 | 2 | 0 | 22 | 7 | 45 |
| 11 | 51 | 4 | 0 | 55 | 12 | 75 |
| 12 | 39 | 4 | 5 | 48 | 12 | 75 |
| 13 | 48 | 0 | 0 | 48 | 9 | 60 |
| 14 | 42 | 0 | 0 | 42 | 12 | 75 |

The new `lib/course/daily-plan.ts` is consumed by the actual Today hook and the full-course simulation. It reserves room for reachable checkpoints, respects prerequisites and scheduled introduction dates, and uses earlier practice for flex slots. An overdue backlog cannot reserve every slot for locked checkpoints and stall prerequisite learning. Reconstruction reps stay inside these budgets; one redundant Week 8 grid drill was moved to repair inventory to preserve daily capacity after adding two reconstructions.

`lib/course/curriculum-fit.test.ts` checks weekly and cumulative daily capacity, valid/unique production paths, gate-skill exposure, schedule completeness, missed-week recovery, and a perfect learner completing every path and obligation across all 14 weeks at exactly the daily rep targets.

The authoritative contract now also drives the week card, Plan's completion badges, the weekly flame strip and header completion markers. Lab study-state edits invalidate the live contract immediately. Pre-course outside credit now uses the same explicit solve semantics.

## Today

Today shows the scheduled topic and purpose, contract counts, recommended learning steps, repair, practice blocks, every due/carried lab, checkpoint and outside target, their lock states, and the remaining completion checklist. One primary action prioritizes repair, learning, practice, labs, checkpoints, then targets. Checkpoint variants launch a separate session. Learning completion is stored under `lesson:`, `demo:` and `example:` keys and never earns rep credit. Saturday shows open work as optional. February 1 onward shows the final readiness decision instead of falling back to Week 1.

The provider now initializes consistently across server and client to avoid calendar hydration errors, and no longer clamps the real date to January 31.

## Visual learning inventory

All demos share stepping, previous/reset/play/speed, prediction pauses, editable numeric input, state variables and reduced-motion behavior.

| Demo route | Visible mechanism |
|---|---|
| `/demo/two-pointers` | Sorted values, left/right, safe discarded region |
| `/demo/sliding-window` | Enter, invalid, shrink, valid, measure; incoming/outgoing sum |
| `/demo/binary-search` | lo/mid/hi, inclusive region, eliminated values and invariant |
| `/demo/linked-list` | Actual nodes and directed references; save, rewire, advance |
| `/demo/recursion` | Owned call frames, waiting callers, base case and return values |
| `/demo/trees` | Child heights and combine; BFS queue snapshots by level |
| `/demo/graphs` | Rooms, relationships, adjacency, BFS and stack DFS, visited/frontier |
| `/demo/backtracking` | Include/skip decision tree, current path, copied answers and undo |
| `/demo/dynamic-programming` | Recursive duplicates, memo lookups, base/recurrence/order and table |
| `/demo/heaps` | Tree plus backing array, push/bubble/pop/replacement and top k |
| `/demo/intervals` | Sorted timeline, overlap, expansion and gap transitions |

Ten new worked examples cover two pointers, windows, search, rewiring, recursion, tree recursion, BFS, graph traversal, backtracking and DP. Each includes manual reasoning, subgoals, an embedded demo, code and a new tested reconstruction exercise in its unit's required path. Concept pages embed their matching demos; Today links them as WATCH IT MOVE steps.

Correctness tests cover each new algorithm in addition to shared determinism, preset, parser and input-immutability tests.

## Earned motivation

Stable event identities connect gate clears, completed repairs, independent transfer, week/day completion, evidence improvement, mocks, readiness and output milestones to real state. A single restrained card is shown per visit; localStorage remembers handled events. First-day, clean-gate, independent Medium and mock milestones are included. Winston rests before training and on off days, wakes with qualifying output and gets a quiet glow for a complete contract. Existing reduced-motion styles remain in effect.

## Audit areas addressed

The original 146-confirmed/2-refuted audit remains the source record in `planning/v21-artifacts/AUDIT_FINDINGS.md`; it has not been re-run or overwritten. This continuation addresses the remaining curriculum-load integration, schedule/prescription fit, Today orchestration and required-item visibility, inconsistent completion badges, remaining demos, visual worked examples and motivation wiring. The prior branch's credit, readiness, Progress and mock-gating work is retained. This document does not claim a new per-finding adversarial closure of all 146 findings.

## Validation and remaining limits

Final validation:

| Check | Result |
|---|---|
| `npm run lint` | Pass, no warnings |
| `npm run type-check` | Pass |
| `npm test` | 324 tests passed; the final daily-capacity assertions and updated demo were also checked with focused runs |
| `npm run verify:content` | Pass against CPython |
| `npm run verify:pyodide` | 1,214 runs passed across 1,169 reps and 67 primers |
| `npm run audit:curriculum` | Pass; existing broad wording backlog remains reported |
| `npm run audit:migration` | Pass; all 1,169 authored exercises classified, zero unmapped |
| `E2E_PORT=3221 npm run test:e2e` | 25 scenarios passed in the full run; its one stale-label assertion was corrected and passed on targeted rerun. All 26 scenarios verified. Mobile demos were also rechecked on that rerun. |
| `npm run build` | Pass; optimized production build and static generation complete |
| Desktop / phone review | No page errors or horizontal overflow on reviewed screens |

 Browser tests use the installed real Pyodide runtime through a small localhost test server instead of relying on the CDN. Normal application builds continue using the CDN unless `NEXT_PUBLIC_PYODIDE_INDEX_URL` is explicitly configured.

Desktop (1440px) and phone (390px) review covered Today, Plan, Progress, a rep, a lab, DP and linked-list demos: no page errors or horizontal overflow were observed. New browser coverage checks due-item visibility, CTA ordering/repair, contract completion, optional Saturday, the post-course decision, all demos at phone width with reduced motion, and later-day outside reconstruction credit.

Remaining limits: the legacy broad wording backlog reported by `audit:curriculum` is not rewritten in this pass. Demo custom inputs deliberately stay small; graph topology is generated from room values, trees use level-order positions and the interval demo uses a common configurable width. These are teaching simulations rather than arbitrary graph/tree editors. No live-account synchronization or production deployment was exercised, and no main merge or deployment was performed.
