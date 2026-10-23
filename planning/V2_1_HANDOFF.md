# Reps V2.1 — handoff (read this first)

Last updated: Oct 23, 2026 (evening), during Phase A. Spec: `planning/REPS_2_1_SPEC.md` (the V2.1 request, verbatim in substance). V2 architecture: `docs/reps-2.md`. Original V2 spec: `REPS_2_MASTER_SPEC.md`.

**Do not merge anything into `main`.** `main` = `e3ae928` is V2, live on Vercel (https://reps-five-jade.vercel.app). The course switches Today/Plan/Progress to course mode on **Mon Oct 26, 2026** automatically.

---

## 1. Where the work is

| | Path | Branch | State |
|---|---|---|---|
| Worktree with all V2.1 work | `/Users/ruggudile/Desktop/Projects/reps-v21` | `v21-work` | commit `fcd16b4` (Phase A part 1) + this handoff + `planning/v21-artifacts/` |
| Main checkout (left untouched while audits read it) | `/Users/ruggudile/Desktop/Projects/reps` | `reps-2.1` (= `e3ae928`, no commits) | has an untracked copy of `planning/REPS_2_1_SPEC.md`; its dev server runs on port 3210 |

Worktree setup notes (already done; redo only if recreating):
- `node_modules` in the worktree is a **symlink** to `../reps/node_modules`; `.env.local` was copied.
- Before `tsc` works in a fresh worktree run `npx next typegen` (generates `PageProps` route types).
- To continue in the main checkout instead: `cd ../reps && git checkout v21-work` (after `git worktree remove ../reps-v21`), or just keep working in the worktree.
- Playwright reuses an existing server on port 3210 (`playwright.config.ts`), which is the MAIN checkout's dev server. Before running e2e from the worktree, stop that server or run with `E2E_PORT=3211 npx playwright test`.

## 2. Commits

| Commit | Branch | What |
|---|---|---|
| `fcd16b4` | `v21-work` | V2.1 phase A (part 1): credit, outside-problem semantics, routing without the Day 2 stall, stricter labs, schedule types, the spec file |
| `e3953df` | `v21-work` | this handoff + `planning/v21-artifacts/` (workflow outputs) |
| `29f7e42` | `v21-work` | `lib/course/contract.ts` (the authoritative day/week contract, §9.2) + `lib/course/contract.test.ts` (5 tests) + `data/course/capstones.ts` (`CAPSTONE_LC`). Not yet wired into the UI. |
| `ba80f69` | `v21-work` | Readiness rewritten per §9.3 (seven dimensions, exact evidence, contract-derived track, lab evidence, stricter final decision) + `lib/course/readiness.test.ts` (6 tests); `use-course-day` builds contracts (streak, flame = blaze only when contract complete, week status, readiness); Today's Day complete reads `dayContract.complete` and shows a "Done for today when" list (`still-due`). |

## 3. Phases

| Phase (spec §28) | Status |
|---|---|
| Audit (spec §27) | **Done** (9 auditors, 148 findings). Adversarial verification was ~25% through (30 verdicts) when this was written — see §6. |
| A — truth and curriculum math | **In progress.** Done: credit semantics, outside-problem model + UI, routing deadlock, curated-path model, stricter labs, schedule types. Not done: curation integration (paths + schedule), the authoritative day/week contract, readiness evidence rewrite, Progress/Today wiring of the contract, tests for daily/week completion and curriculum fit. |
| B — Today command center | Not started (design in §9). |
| C — interactive demo engine + visualizers | Not started (design in §9). |
| D — worked examples Weeks 3–12 | Not started. |
| E — Progress V2 | Not started (audit lists every legacy section to remove). |
| F — readiness + labs | Design done (§9), not implemented. |
| G — motivation / gamification wiring | Not started. |
| H — QA | Not started. |

## 4. Files changed so far (in `fcd16b4`)

- `lib/course/credit.ts` — rewritten. New: `EVIDENCE_RANK`, `creditReason()` (`counts | not-passed | solution-shown | rebuilt-same-day | not-production | lab | unknown-rep`), `qualifies(a, ex, history)`, `bestEvidence()`, `OutsideEvidence` (`outside-unaided | outside-cold | outside-hinted | outside-reconstructed`), `outsideCredit(entry)`, `dailyCredits()` now one credit per problem per day.
- `lib/course/credit.test.ts` — 4 new tests (same-day rebuild, explain/choice/lab, outside semantics, best-evidence upgrade).
- `lib/solve-log.ts` — `SolveResult` gains `'solution'`; `SolveEntry.rebuiltOn?: string`.
- `components/leetcode-list.tsx` — four result buttons (Unaided / Small hint / Saw solution / Not finished, testids `lc-unaided|lc-hinted|lc-solution|lc-failed`), outcome copy that matches the credit logic (`lc-outcome`), rebuild items with an "I rebuilt it from blank" button (`lc-rebuilt`, only enabled on a later day than the solve).
- `components/solve-log-view.tsx` — labels/options for the new results.
- `lib/course/resolves.ts` — seen-solution entries come back as `rebuild` items from the next training day; redos skip `solution` results.
- `lib/course/routing.ts` — rewritten: `unitPath()` (curated `unit.path`, falls back to all section reps until curated), `unitInventory()`, attempts indexed per rep, routes `full | placement | maintenance` (no `focused` filter — that was the Day 2 deadlock), `ready` = gates cleared (if any live gate) else path passed, `purposeOf()` returns `gate` only for real gate variants (`retrieve` for other cold reps), queue items carry `required`, extras (inventory, readiness targets) appended after all required work, `GateStatus` gains `failedOn` and `repairPlan`.
- `lib/course/routing.test.ts` — filters by `required`.
- `data/course/units.ts` — `LearningUnit` gains `path?`, `stretch?`, `retrieval?`; doc comments define `targets` = REQUIRED targets, `readinessTargets` = optional.
- `data/course/schedule.ts` — NEW: `DayPlan`, `WeekPlan`, `SCHEDULE`, `DAY_PLAN`, `GATE_DUE`, `LAB_DUE`, `TARGET_DUE`; `CURATED` is empty, so every week uses `derived()` (units spread over days; all gates and targets on the last training day; labs mid-week and last day). **Not yet consumed anywhere.**
- `lib/course/labs.ts` — `labProgress(lab, state, attempts)` (was `passed: Set`); design answers need ≥ 20 chars; builds must be own work (`builtOwnWork`: not revealed, not reconstructed); `doneOn`.
- `components/course/lab-view.tsx`, `components/course/readiness-report.tsx`, `components/use-course-day.ts` — call sites updated.
- `components/use-today-plan.ts` — `COURSE_KIND` has `retrieve`, `extra` (this hook is to be replaced by the contract/stack planner).
- `planning/REPS_2_1_SPEC.md` — the V2.1 spec.

## 5. Tests

In the worktree at the contract commit: `npm run lint` clean, `npx tsc --noEmit -p .` clean, `npm test` **284 / 284 pass** (incl. `lib/course/contract.test.ts`, run against the DERIVED schedule — re-check after curation fills `CURATED`). Not run on this commit yet: `verify:content`, `verify:pyodide`, `audit:curriculum`, `audit:migration` (may need updating: it imports `unitReps`, still exported), e2e, build.

Known test gaps the spec requires (§29) that do not exist yet: curriculum fit per week, daily/week completion contract, readiness classification + upgrade + lab evidence, Today visibility/CTA, demo determinism, Week 13 leakage on Today titles.

## 6. Workflows (outputs saved in `planning/v21-artifacts/`)

| Workflow | Run id | Script (copy) | Saved output | Status |
|---|---|---|---|---|
| Audit (9 auditors → verify each finding → completeness critic) | `wf_5717e09e-a38` | `planning/v21-artifacts/audit-workflow.js` | `audit-journal.json` (raw journal), **`AUDIT_FINDINGS.md`** (readable: every finding, evidence, suggested fix, verdict if reached) | All 9 audits done; verification ~30/148; critic not run |
| Curation (per week: curate → review → revise) | `wf_721590a7-2c9` | `planning/v21-artifacts/curate-workflow.js` | `curate-journal.json`; inputs in `inventories/inventory-w1..w14.json` | 8 curators running (weeks 1–8), 0 finished when written; weeks 9–14 not started |

**Resuming:** `Workflow({ scriptPath, resumeFromRunId })` only works in the SAME Claude session. A new session must re-run instead:
- Curation: copy `planning/v21-artifacts/curate-workflow.js`, change `REPO` to the repo path and `INV` to `<repo>/planning/v21-artifacts/inventories` (the scratchpad path in the script will not exist), run it with the Workflow tool. Integrate its output as described in §8.
- Audit: no need to re-run the auditors (findings are in `AUDIT_FINDINGS.md`). Optionally re-run only the verify stage on UNVERIFIED critical/major findings; most are independently confirmed by reading the code (several were re-checked by hand, see §7).

If the workflows finish in this session, their final outputs are written to `planning/v21-artifacts/` (curation as `CURATION.json` + summary) and this file is updated.

## 7. Audit findings that matter (full list: `planning/v21-artifacts/AUDIT_FINDINGS.md`)

Confirmed by hand while implementing (true regardless of verifier status):
1. **Day 2 deadlock** (routing): gateless units on the `focused` route required reps the focused path hid → never ready → course stalls. FIXED in `fcd16b4`.
2. **Curriculum math**: Week 1 required ≈ 1.46× its 50, Week 2 ≈ 3.55× its 60 (w2-hashing alone 125 required reps); Week 8 over 75; nothing classifies reps as path/optional/repair/retrieval/placement/stretch. Model FIXED (`unit.path`), DATA pending curation.
3. **w2-testing** pulls `o11-edges` reps on binary search, stacks, intervals, grids, linked lists (later topics) and labels cold reps "Checkpoint". Label FIXED (purposeOf); data pending curation (curators were told to move those reps).
4. **Day complete = reps only**; labs/checkpoints/targets never assigned to a day; Saturday says "nothing owed" with builds outstanding; week status ignores labs/gates in the UI; 8 day-level and 6 week-level deciders disagree. NOT FIXED — the contract module (§9.2) is the fix.
5. **LeetCode "Needed help" earned full credit** while the UI said "Not finished". FIXED.
6. **Readiness**: evidence grid merges independent+retrieval+cold-independent as "Cold, independent"; first passing attempt anchors evidence (no upgrade); 63 gate variants excluded; labs absent; Independent transfer / Interview execution rows never wired; finalDecision says Ready on thin evidence; mock gating cosmetic (/interview always open); track contradicts week status. Partly addressed (`bestEvidence`); rewrite pending (§9.3).
7. **Progress** still V1: working-days streak, Days practiced, 90-day minute heatmap, time-vs-plan, Day 30/60/90 checkpoints with mock quotas, pattern readiness, header rail % on the V1 calendar (3% after a perfect Week 1). Two readiness models on one page. NOT FIXED (Phase E).
8. **Today UX**: no contract, no "done for today when", labs only as week links, checkpoints only if they fall in today's N items, targets invisible until open, lessons/demos/examples not steps, generic CTA, repair not prioritised; Feb 1 onward falls back to Week 1. NOT FIXED (Phase B).
9. **Rep page** shows "+1 rep" even when the pass earns nothing. NOT FIXED (use `creditReason` in the pass panel).
10. **Labs could be marked done** after revealing the solution with placeholder design text. FIXED.
11. **Learning**: no demo engine; Weeks 3–12 have zero worked examples; Markdown renderer has no tables/ordered lists (Week 1 variable tables, the Solve Map's 9 steps, 46 lab specs render as run-on text). NOT FIXED (Phases C/D; the Markdown fix is small and high value).
12. **Explain reps** counted on a self-ticked rubric. FIXED (not production).
13. **Week 13**: titles on Today are neutral for c13 reps (verify), approach note exists; transferGrade depends on array order and memorizedRisk is inert (durationSeconds often missing). NOT FIXED.

## 8. Week curation — status and how to integrate

Status: weeks 1–8 curating, 9–14 queued (none finished at writing time). Nothing integrated.

Budget rule (curators and the tests must use exactly this):
- `allowance = ceil(0.15 × weekTarget)` reserved for warm-ups, retrieval, re-solves.
- `requiredLoad = Σ |unit.path| + Σ gate.need (week's gates) + |required outside targets|` (a target solved by a capstone rep already in a path does not count again).
- **Constraint:** `requiredLoad + allowance ≤ weekTarget` (W1 50 → ≤ 42; W2 60 → ≤ 51; normal 75 → ≤ 63; W9 60 → ≤ 51; W10 45 → ≤ 38; W13 60 → ≤ 51).
- Per day: `capacity_d = dailyTarget − ceil(0.15 × dailyTarget) − gateNeedsDue_d − targetsDue_d`; cumulative capacity through d ≥ total path of units whose gate/lab/target is due by d.
- Path reps: only kinds `code | output | reorder`; never gate variants; teach-before-test for every gate skill; no later-week topics; keep `rebuild` reps; W13 path ⊆ `c13-t-*`; W14 `o11-*` (no choice/explain).

Integration steps:
1. For each unit: set `path` (ordered ids), `optional` (sections), `stretch` (sections), `retrieval` (sections), `targets` (= requiredTargets), `readinessTargets`. Remove sections that contributed nothing and belong elsewhere (curators' `otherWeekReps`), adding them to the right unit's inventory if sensible.
2. Fill `CURATED` in `data/course/schedule.ts` from each week's `schedule` (date, focusUnits, gatesDue, labsDue, targetsDue, theme).
3. Add `lib/course/curriculum-fit.test.ts`: for every week, the budget constraint above; every week gate/required lab/target scheduled exactly once; path ids exist, are production kinds, not gate variants, unique across units; and a **perfect-learner simulation** (each training day: take the day plan, pass everything prescribed, finish due labs) ending with every week complete.
4. Re-run `npm run audit:migration` (update it to report path / inventory / optional / stretch / retrieval / placement per rep — spec §8 classification).

## 9. Designs already decided (implement exactly; do not re-derive)

### 9.1 Credit (implemented)
See §4. Pre-course legacy: `components/use-capacity.ts` (`useDayRecords`) and `use-today-plan.ts` (`doneToday` for LC entries) still count every LC entry — change both to `outsideCredit(e)` (minor; pre-course only).

### 9.2 The authoritative day/week contract — `lib/course/contract.ts` (NEXT TASK)
One module; every surface (Today, week card, streak, flame, Progress, readiness, Saturday copy) reads it.

```ts
interface ContractInput { attempts; entries: SolveEntry[]; mastery; labStates: Record<labId, LabState|undefined>; exercises; sections }
dayContract(date, input) -> {
  date, week, type: 'training'|'recovery'|'rest', plan?: DayPlan,
  reps: { done, target, met },
  labs:    { id, title, state: 'done'|'open', dueDate, carried }[],
  gates:   { id, title, unitId, state: 'cleared'|'open'|'locked'|'repair'|'handled', dueDate, carried }[],
  targets: { lc, title, unitId, state: 'done'|'open'|'locked', dueDate, carried }[],
  repair:  { gateId, reps: string[], remaining }[],
  complete: boolean, remaining: string[]
}
weekContract(week, date, input) -> { output {done,target}, labs, gates, targets, daysComplete, trainingDays, shortfall, overdue[], complete, status: 'upcoming'|'on-track'|'recoverable'|'off-track'|'complete' }
```
Rules:
- Evaluate "as of the end of `date`": filter attempts to `date ≤ d`, entries by credit date, labs by `doneOn ≤ d`; statuses = `courseStatus` on the filtered attempts with `today = d`. Memoise per date (routing is now indexed, so ~70 evaluations are fine).
- Training day: reps target = `dailyTarget(week)`; due items = schedule items with due date ≤ d in this week **plus carried items from earlier weeks still not done** (`carried: true`; no hidden backlog).
- Gate state: `cleared` (clearedOn ≤ d); `repair` (failed, repair outstanding); `handled` (failed ON d and its repair done → retry next day; satisfies today); `locked` (unit locked or its path not done — still required, blocks completion, CTA points at the path); `open`.
- Target state: `done` if solved (outside credit or capstone pass) by d; `locked` if its unit is not ready (does not block the day; the week contract still requires it); `open` blocks.
- Repair outstanding on any gate → required today ("Do repair first").
- `complete` = reps met ∧ due labs done ∧ due gates ∈ {cleared, handled} ∧ open targets done ∧ no outstanding repair. Rest day: complete, nothing due. Saturday (recovery): nothing required; show optional shortfall + open items as optional; never "nothing owed" while week items are open.
- Week `complete` = output ≥ target ∧ required (non-optional) labs done ∧ week gates (live) cleared ∧ required targets solved. In progress: on-track (no shortfall, nothing overdue) / recoverable (shortfall ≤ dailyTarget and ≤ 1 overdue item) / off-track. After the week: complete or off-track (recoverable through Saturday/Sunday if small).
- Streak = consecutive training days whose dayContract was complete (rest/recovery skipped; today counts once complete). Flame: unlit / ember (>0 reps) / burning (≥ half reps) / **blaze only when the contract is complete**.
- After Jan 31 (Feb 1 onward) Today must show the final decision, not fall back to Week 1 (`courseWeekOf` returns 15).

### 9.3 Readiness rewrite — `lib/course/readiness.ts`
- Evidence: per rep `bestEvidence`; separate buckets independent / cold-independent / self-corrected / assisted / reconstructed / retrieval; full-problem reps = capstones, transfer, pattern/interview stages, **all gate variants (`GATE_OF_EXERCISE`)**; plus outside buckets (unaided, cold re-solve, hinted, rebuilt). `recentAssistance` = share of the last 10 days' **credits** that were assisted/reconstructed/outside-hinted/outside-reconstructed.
- Dimensions (spec §18): Programming Foundations (W1 units), Problem Solving (W2 units except hashing), Core DSA (hashing + W3–W12; keep the 15 sub-domains as detail), Independent Transfer (transferGrade; not tested before W13 attempts), Software Building (non-AI labs: done vs due-so-far, change requests, design answers), Applied AI/FDE (AI labs only; never blocks a general SWE "ready"), Interview Execution (mocks done + W14 interview evidence). Each: status + why; no percentages.
- Track derives from week contracts (last finished week status, current week status), blocked gates, cold evidence, assistance — never "on track" when the current week is off track.
- `transferGrade`: sort attempts by time; `memorizedRisk`: fall back to `completedAt − startedAt` when `durationSeconds` is missing.
- `finalDecision`: `ready` needs green transfer, ≥ 1 mock, Foundations + Problem Solving ready and ≤ 1 Core DSA sub-domain not ready; `ready-with-gaps` needs ≥ yellow and Foundations + Problem Solving ready; else `not-yet-ready`.
- Mock gating must be real: `/interview` (course mode) locks mocks unless `mockPolicy(grade).mocksAllowed > 0`.

### 9.4 Today command center (Phase B)
Ordered stack for the day: REPAIR (if any, first) → LEARN (lesson of the focus unit) → WATCH IT MOVE (demo) → REBUILD (worked example + its reconstruction rep) → DRILL → COMBINE → RETRIEVE → LAB (due) → CHECKPOINT (due; shows lock state) → TARGET (due; "opens after checkpoint"). Header: today's topic (focus units from `DAY_PLAN`), why (unit purpose), contract (reps x/y, labs x/y, checkpoints x/y, targets), "Done for today when" checklist from the contract. ONE primary CTA, deterministic: DAY COMPLETE → DO REPAIR FIRST → START TODAY (first stack step; lesson first for a new unit) → CONTINUE TODAY (remaining rep blocks) → START LAB → START CHECKPOINT → START TARGET. Learning steps are tracked in study state (`lesson:<id>`, `demo:<id>`, `example:<id>` with date) and are recommended, not required for completion. The rep session launched by CONTINUE covers drill/combine/retrieve reps; checkpoint variants get their own session from START CHECKPOINT. Gate variants due today count toward the day's reps (prescription reserves slots for them as `required`).

### 9.5 Demo engine (Phase C)
`lib/demos/*.ts` pure step generators (`(input) => DemoStep[]`, each step: state snapshot, highlighted code line(s), narration "why", optional prediction prompt {question, choices, answer}), tested with node:test for determinism, reset and custom input. `components/demos/`: shared `DemoPlayer` (play/pause/next/prev/reset/speed/try another input, reduced-motion aware — no autoplay when reduced motion), `CodePanel` (line highlight), `StatePanel` (variables), views: ArrayPointers, Window, BinarySearch, LinkedList (nodes + arrows), CallStack, Tree (DFS + BFS queue), Graph (modeling → adjacency → DFS/BFS frontier/visited), DecisionTree (backtracking), DP (recursion tree → memo → table), Heap (tree + array), Timeline (intervals). Required list: spec §14.

### 9.6 Other decisions
- Rest = Sundays + Dec 25, Dec 26, Dec 31, Jan 1, Jan 18; Saturday optional recovery. Contract: 10/12/15 a day; 950 total.
- Labs never count as reps; lab parts (`lab: true`) earn no credit.
- Choice and explain reps never count and never sit in a required path.
- Week 13 required path ⊆ the 48 `c13-t-*` transfer reps; October `o11-*` interview reps live in Week 14.
- `main` is untouched; deliver V2.1 as a branch and ask before merging.

## 10. Exact next task

1. Wait for (or re-run) the curation workflow; write its output to `planning/v21-artifacts/CURATION.json`.
2. Integrate curation into `data/course/units.ts` (`path`, `optional`, `stretch`, `retrieval`, `targets`, `readinessTargets`) and `data/course/schedule.ts` (`CURATED`).
3. DONE: `lib/course/contract.ts` (`createContracts(input)` → `dayContract(date)`, `weekContract(week, date)`, `streak(date)`, memoised snapshots as of each date) + tests. STILL TO DO: `lib/course/curriculum-fit.test.ts` (§8 step 3, incl. the perfect-learner simulation) once paths are curated.
4. DONE (`ba80f69`): readiness per §9.3 + tests. Still to do for F: real mock gating on `/interview` (course mode).
5. Wire Today/week card/streak/flame/Saturday copy to the contract (Phase B), then E, C, D, F, G, H.
6. Update this file at each phase boundary.
