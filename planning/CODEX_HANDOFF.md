# Codex handoff — Reps V2.1

You are picking up a partly finished upgrade of **Reps**, a Next.js 16 + TypeScript app that trains one learner (Stefen) for SWE I / new-grad Python interviews through a 14-week course (Oct 26, 2026 → Jan 31, 2027). Read this file first, then `planning/V2_1_HANDOFF.md` (the detailed state and designs), then the spec `planning/REPS_2_1_SPEC.md`.

## 0. Ground rules

- **Branch: `v21-work`** (pushed to `origin`). Do all work there. **Never merge into `main`** and never push to `main`; `main` (`e3ae928`) is V2 and is live on Vercel. The user merges.
- `AGENTS.md`: this is Next.js 16 with breaking changes; read the guide in `node_modules/next/dist/docs/` before touching routing/APIs. Route params are async (`params: Promise<...>`).
- Do not touch the separate personal-site repo; never expose Supabase service keys; Supabase migrations additive only (none are needed for V2.1: new state lives in `reps_study_state` keys).
- Commit in coherent steps with clear messages; run the checks below before each commit.
- Plain-English rule for any learner-facing copy (`docs/authoring.md`, "How a prompt reads").

## 1. Setup

```bash
git clone git@github.com:stefenewers/reps.git && cd reps   # or use the existing checkout
git checkout v21-work
npm install
npx next typegen        # generates PageProps route types; tsc fails without it in a fresh checkout
```

Local paths on Stefen's machine: `/Users/ruggudile/Desktop/Projects/reps-v21` is a git worktree already on `v21-work` (its `node_modules` is a symlink to `../reps/node_modules`). `/Users/ruggudile/Desktop/Projects/reps` is the main checkout (branch `reps-2.1`, no commits; ignore its two untracked planning files — copies of files already on `v21-work`). Either works; the worktree is ready to go.

Checks (all must pass before committing):

```bash
npm run lint && npm run type-check && npm test          # 288 tests pass at f71f470
npm run verify:content && npm run audit:curriculum && npm run audit:migration
npm run verify:pyodide                                   # ~2 min, prints progress
E2E_PORT=3211 npm run test:e2e                           # use another port if a dev server holds 3210
npm run build
```

Slice checks for content: `npx tsx scripts/verify-reps.ts --prefix <id-prefix>` (tests vs Python, prompt examples, plain English); `npx tsx scripts/check-wording.ts <ids>`.

## 2. What exists (V2 + V2.1 so far)

- Course model: `data/course/{calendar,weeks,units,gates,lessons,schedule,capstones,motivation,types}.ts`, content in `data/exercises/course/` and `data/course/content/`. Architecture: `docs/reps-2.md`.
- **Done in V2.1** (commits on `v21-work` since `e3ae928`; details in `planning/V2_1_HANDOFF.md` §2–§4):
  - Credit semantics (`lib/course/credit.ts`): outside results unaided / hinted / solution / failed; seen solution counts only when rebuilt from blank on a later day; same-day rebuild after a reveal earns nothing; explain/choice/lab never count; best-evidence upgrade.
  - Routing (`lib/course/routing.ts`): curated paths (`unit.path`), no Day-2 deadlock, required vs extra queue items, only real gate variants are checkpoints.
  - **The authoritative contract** (`lib/course/contract.ts`): `createContracts(input)` → `dayContract(date)`, `weekContract(week, date)`, `streak(date)`. Every surface must read this; do not add new "complete" logic elsewhere.
  - Readiness (`lib/course/readiness.ts`): seven dimensions, exact evidence kinds, labs, contract-derived track, final decision; real mock gating (`components/use-mock-gate.ts`).
  - Progress V2 (`components/course/course-progress.tsx`), course header rail (`lib/course/rail.ts`).
  - Markdown tables + numbered lists; truthful "+1 rep" badge on the rep page.
  - Demo engine (`lib/demos/`, `components/demos/`), reference demo `two-pointers`, route `/demo/[id]`.
- Audit of V2 against the spec: `planning/v21-artifacts/AUDIT_FINDINGS.md` (148 findings, 146 confirmed). Use it as the checklist; don't redo the audit.

## 3. What to do next, in order

### 3.1 Finish curriculum curation (spec §8) — data work
`planning/v21-artifacts/CURATION_PARTIAL.json` has curated plans for weeks 1, 2, 5–14 (all fit their budgets; review notes per week). **Weeks 3 and 4 are missing.** Curate them by hand using the rules in Appendix A and the inventories `planning/v21-artifacts/inventories/inventory-w3.json` / `-w4.json` (every rep's id, kind, stage, skills, gate membership). Then integrate all 14 weeks:
1. `data/course/units.ts`: for every unit set `path` (ordered rep ids), `optional`, `stretch`, `retrieval` (section ids), `targets` (= required outside targets), `readinessTargets`. Remove sections that belong to other weeks (curators' `otherWeekReps`).
2. Fixes from review: week 2 — in `data/course/gates.ts` change `g-contract` skills to `['edge_cases', 'conditionals']` (no path rep produces `explanation`); week 10 — path id `d9-iv-fu-touching-apart` → `d9-fu-touching-apart`.
3. `data/course/schedule.ts`: fill `CURATED[week]` from each plan's `schedule` (date, focusUnits, gatesDue, labsDue, targetsDue, theme). Every gate of the week once, every non-optional lab once, every required target once.
4. New test `lib/course/curriculum-fit.test.ts`: per week `Σ|path| + Σ gate.need + |required targets| + ceil(0.15·weekTarget) ≤ weekTarget`; path ids exist, are `code|output|reorder`, not gate variants, unique across units; schedule completeness; and a **perfect-learner simulation**: for each training day, pass everything the day prescribes, finish the due labs (`labStates` with `doneAt` and 20+ char design answers), and assert every `weekContract` ends `complete`. Re-check `lib/course/contract.test.ts` (written against the derived schedule).
5. Update `scripts/audit-migration.ts` to classify every rep as REQUIRED PATH / OPTIONAL / REPAIR INVENTORY / RETRIEVAL / PLACEMENT (gate variant) / STRETCH and regenerate `planning/reps-v2-migration.*`.

### 3.2 Phase B — Today as the command center (spec §3–§7, §30)
Rebuild `components/course/course-today.tsx` on `useCourseDay()` (already returns `dayContract`, `weekContract`, `contracts`, `readiness`, `streak`, `flame`). Design is fixed in `planning/V2_1_HANDOFF.md` §9.4: header (today's topic from `DAY_PLAN[date].focusUnits`, why = unit purpose, contract counts), an ordered stack REPAIR → LEARN → WATCH IT MOVE (demo) → REBUILD (worked example + its reconstruction rep) → DRILL → COMBINE → RETRIEVE → LAB → CHECKPOINT (with lock state) → TARGET ("opens after checkpoint"), a "Done for today when" checklist from `dayContract.remaining`, and ONE deterministic primary CTA (DAY COMPLETE / DO REPAIR FIRST / START TODAY / CONTINUE TODAY / START LAB / START CHECKPOINT / START TARGET). Labs, checkpoints and targets must be visible and startable from Today. Track learning steps in study state (`lesson:<id>`, `demo:<id>` already written by `DemoEmbed`, `example:<id>`). Saturday: optional, never "nothing owed" while items are open. After Jan 31 show the final decision, not Week 1. Add e2e tests for: every due item visible on Today, CTA order, contract completion.

### 3.3 Phase C — remaining visualizers (spec §13–§15, §31)
Ten more demos, each mirroring `lib/demos/two-pointers.ts` + `components/demos/views/two-pointers-view.tsx`: sliding window (ENTER→INVALID→SHRINK→VALID→MEASURE), binary search (lo/mid/hi, eliminated region, the invariant), linked list reversal (prev/curr/next, SAVE→REWIRE→ADVANCE, nodes + arrows), recursion call stack (DOWN/UP, frames, returns), tree DFS + BFS (queue, levels), graph modeling → adjacency → DFS/BFS (frontier, visited), backtracking decision tree (CHOOSE→EXPLORE→UNDO), DP (recursion tree → duplicates → memo → table; STATE/BASE/RECURRENCE/ORDER), heap (tree + array, push/bubble/pop, top-k), intervals timeline (sort, overlap, merge). Register each in `lib/demos/index.ts` and `components/demos/registry.tsx`; the generic tests in `lib/demos/demos.test.ts` then cover determinism/presets/input, and add one correctness test per demo. Embed demos on concept pages (`app/learn/[id]`), worked examples and Today's WATCH step.

### 3.4 Phase D — worked examples for Weeks 3–12 (spec §16)
At least: two pointers, sliding window, binary search, linked-list rewiring, recursion, tree recursion, BFS, graph traversal, backtracking, DP. Extend `WorkedExample` (`data/course/types.ts`) with `manualReasoning` steps and `demoId`; render PROBLEM → MANUAL REASONING → SUBGOALS → VISUAL DEMO → CODE → RECONSTRUCTION in `components/course/worked-example.tsx`; each needs a reconstruction rep (new course rep, verified with `scripts/verify-reps.ts`) placed in the unit's path; set `workedExampleIds` on the units.

### 3.5 Phase G — motivation and gamification (spec §19–§23)
Wire `data/course/motivation.ts` events to real moments (gate cleared, repair success, cold breakthrough, week complete, long-term progress, day complete, readiness improvement), once each (remember shown events in localStorage). Milestones: first day, 50/250/500/750/950, first clean gate, first independent Medium, first completed week, first mock, READY. Winston (`components/winston-*`) stays ambient: wake on first rep of the day, react to blaze, rest on rest days. Respect reduced motion; no confetti per rep.

### 3.6 Phase H — QA
Run every check in §1, review Today / Plan / Progress / a rep / a lab / a demo on desktop and a 390px phone, fix, update `planning/V2_1_HANDOFF.md`, and report: audit findings fixed, implementation summary, demo inventory, remaining gaps, validation results, commits (spec §33).

## Appendix A — curation rules (verbatim from the curation workflow)

```text
You are curating one week of the Reps 2.0 course (a 14-week Python interview course; learner: a new-grad SWE candidate; weak on while loops, state, pointer movement; strong on dictionaries). Repo (read only, do NOT edit anything): ${REPO}. Read ${REPO}/planning/REPS_2_1_SPEC.md §7 and §8 (the problem you are fixing), ${REPO}/REPS_2_MASTER_SPEC.md §13 (credit) and §17 (the week-by-week curriculum and its DAILY THEMES), and the week's inventory JSON (given below). The inventory lists every unit of the week: its sections and every rep in them (id, title, kind, stage, repType, minutes, skills, gateVariantOf, capstoneFor, prompt excerpt), its gates (id, need, skills, pool), labs, targets (LeetCode numbers; solvedInRepsBy = the Reps capstone rep that counts as solving it) and readinessTargets.

THE PROBLEM: today every rep in every unit section is required, so Week 1 requires ~1.5x and Week 2 ~3.5x their targets. You must CURATE.

DEFINITIONS (exact):
- weekTarget = inventory.weekTarget; dailyTarget = inventory.dailyTarget; trainingDays = inventory.trainingDays (Mon-Fri minus holidays).
- allowance = ceil(0.15 * weekTarget): reserved for warm-ups, retrieval and outside re-solves.
- gateNeeds = sum of gate.need over the week's gates whose pool reps exist (all do).
- requiredTargets = the OUTSIDE problems (LeetCode numbers) the learner must solve this week. A target whose solvedInRepsBy is a capstone rep you put in the path does NOT count again here (it is solved by the path rep). Keep requiredTargets small and only where the unit genuinely exists for that problem (the spec's "Targets" for the week; "readiness-gated" ones go to readinessTargets; Weeks 1-2 have none).
- requiredLoad = (number of path reps over all units of the week) + gateNeeds + requiredTargets.length. CONSTRAINT: requiredLoad + allowance <= weekTarget.
- Per day d (each training day): capacity_d = dailyTarget - ceil(0.15*dailyTarget) - (sum of need of gates due on d) - (number of requiredTargets due on d). The prescription takes path reps in unit order, so cumulative path capacity through day d must be >= the total path size of every unit whose gate, lab or target is due on or before d (a checkpoint can only be attempted once its unit's path is done). Every unit's path must fit within the week's cumulative capacity by the last training day.

PATH RULES:
1. The path is an ORDERED list of rep ids taken from the unit's sections (never from gate pools: reps with gateVariantOf are checkpoint variants, never path).
2. Only kinds 'code', 'output' and 'reorder' may be in the path. Exclude 'choice' (recognition never earns credit) and 'explain' (self-graded).
3. Teach before test: every skill a gate checks (gate.skills) must be produced by path reps of this week or of earlier weeks, with a first exposure (trace/output or fill) before drills/debug/combine. A path must start with the unit's teaching reps.
4. No later-week topics: a path rep must not require skills the course teaches in a later week. For reference: Week 1 state/while/loop control/running state/mutation/references/decomposition; Week 2 contracts/manual solving/testing/brute force->improve/strings basics/hashing; Week 3 two pointers/running state/prefix-suffix; Week 4 sliding window/stacks; Week 5 binary search/linked lists; Week 6 fast-slow/recursion; Week 7 trees/BST; Week 8 queue/BFS/grids/graphs; Week 9 cycles/heaps/sorting keys; Week 10 intervals; Week 11 backtracking/basic DP; Week 12 DP+greedy/matrix/tries; Week 13 transfer; Week 14 interview. If a section mixes topics (e.g. o11-edges), take only the reps that fit and say where the others belong (otherWeekReps).
5. Prefer the course's own new content (ids c1-*, c2-*, c13-*) for Weeks 1, 2 and 13; for legacy ladders keep: the first exposure of each skill, one or two drills, one debug, one combine, and the unit's Reps capstone if the unit has one. Reps already in another unit's path must not be repeated.
6. The worked-example reconstruction reps (ids containing 'rebuild') stay in the path.
7. Week 13: the path is a subset of c13-t-* (no gates, no targets). Week 14: o11-* interview reps (no choice/explain).

CLASSIFY the rest of each unit's sections (sections, not reps): every section that contributes no path rep is 'optional' (offered when ahead), 'stretch' (beyond the Feb 1 scope: e.g. tree construction, max path sum, minimum window, LIS/LCS, rotated search, advanced), or 'retrieval' (warm-ups and cold sections that are not gates). Reps of path sections not chosen for the path become REPAIR INVENTORY automatically (do not list them).

SCHEDULE: for each training day give focusUnits (the unit(s) being taught that day, in order), gatesDue, labsDue (every non-optional lab of the week exactly once; at most one lab per day where possible; a lab is due no earlier than the day its unit starts), targetsDue (every requiredTarget exactly once, on or after its unit's gate day). Every gate of the week exactly once. Follow the spec's daily themes where the arithmetic allows; say where you deviate and why.

Show your arithmetic in 'budget' and 'days'. Be exact: count ids.
```
