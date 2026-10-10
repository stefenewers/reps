# Paste-ready prompt: rebuild `stefenewers/reps` for the full-time 90-day plan

Copy everything below the line into Claude Code or Cursor (agent mode), opened on a local clone of `stefenewers/reps`. Before you start, put these files in the repo's `planning/` folder (create it):
- `plan.md`, `problems.csv`, `gen.py`, `tracker_template.csv` and `behavioral_bank.md`, from `/workspace/interview-90day/`.
- The contents of `repo-additions/`.

---

You are working in `stefenewers/reps`: a Next.js + TypeScript app with a Pyodide Python runner, Supabase sync (`reps_*` tables, RLS through `reps_owners`), a deterministic mastery model and spaced review. It was built for a 10-day sprint ending Oct 12, 2026. Rebuild it to run a **full-time 90-day interview program (Mon Oct 12, 2026 → Sun Jan 10, 2027)** for new-grad / SWE I loops. Extend the existing conventions; don't replace them.

## Ground rules
1. **Read first:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/authoring.md`, `data/*.ts`, `lib/schedule.ts`, `lib/mastery.ts`, `lib/progress.ts`, `lib/storage/*`, `supabase/migrations/0005_reps.sql`, and everything in `planning/`. Follow AGENTS.md and CLAUDE.md.
2. **Branch:** `git checkout -b 90-day-rebuild`. Work in small, reviewable commits. Each commit message should say what changed and why, in the repo's existing commit style.
3. **Never** force-push, rewrite history, or touch `main` directly. Finish by opening a PR (`gh pr create --draft`) titled "90-day full-time program". The PR body should include a summary, screenshots of Today and Progress, the test results, and a migration note. Do not merge.
4. **Archive, don't delete.** The October sprint (`data/exercises/oct*.ts`, `data/schedule.ts`, `data/mocks.ts`, `data/program.ts`) stays byte-for-byte loadable as the program `oct-sprint`. Existing attempts, mastery and review data must still load and display. Existing tests must still pass. Only update a test where it hard-codes a single program, and explain each such change in the PR.
5. **Supabase changes are additive only.** Add `supabase/migrations/0006_reps_90day.sql`: new columns and tables only, no drops or renames, the `reps_` prefix, the same RLS pattern (`user_id = auth.uid()` and membership in `reps_owners`), no grants to `anon`, safe to re-run. Extend `supabase/migration.test.ts` (PGlite) to cover it, including RLS denial for a non-owner.
6. No new paid services. The OpenAI coach stays optional and button-triggered. No secrets in code.
7. Python solutions and LeetCode statements: never copy LeetCode problem text (see `data/problems.ts`); link out instead.

## What to build
### 1. Program abstraction
- Add `lib/programs.ts` with a `Program` type: `id`, `title`, `start`, `end`, `restDays`, `bufferWeeks`, `stepDays`, `reviewCaps`, `stages`, `target`, `finishLine`, `dayBlocks`, `checkpoints`.
- Register two programs: `oct-sprint` (wraps the existing exports unchanged) and `ninety-day` (from `planning/repo-additions/data/program-90day.ts`).
- Set the active program in settings, persisted locally and synced. Default to `ninety-day` from 2026-10-12.
- `data/curriculum.ts` and `lib/schedule.ts` read parameters from the active program instead of module-level constants (`INTERVIEW_DATE`, `LAST_DAY`, `STEP_DAYS`).

### 2. Problems and calendar
- Add `data/problems-90day.ts` (provided).
- Add the `// TODO skill:` ids to `data/skills.ts` with definitions and prerequisites from the existing graph: `prefix_sum`, `monotonic_stack`, `monotonic_queue`, `trie`, `union_find`, `dijkstra`, `mst`, `bellman_ford`, `kadane`, `sweep_line`, `class_design`. Then use them in the 90-day problems.
- Add `scripts/import-plan.ts`. It reads `planning/problems.csv` and emits `data/schedule-90day.ts`: per date, `new` problem ids and `review` problem ids, plus video links.
- Add a test: the generated schedule matches the CSV row for row, and every LC number exists in `PROBLEMS` or `PROBLEMS_90`.
- Problems that already have October capstones (`REUSED_LC`) map to their existing `cap-<id>` exercises.

### 3. Scheduler (`lib/schedule.ts`): keep it deterministic
- Program-specific `stepDays`: `[3, 10, 30]` for `ninety-day`.
- Daily caps: weekday 8 whole-problem re-solves, Saturday 4, buffer-week day 8, rest days 0.
- +3 and +10 re-solves take priority over +30. Overflow rolls to the next study day. Nothing is scheduled on Sundays (except `end`), rest days, or after `end`; those go to a `maintenance` queue shown after Jan 10.
- Keep the existing failure rule (+1 h) and the "shaky" rule. For whole-problem re-solves, "shaky" means the next study day.
- **Tests** (vitest, alongside `lib/schedule.test.ts`):
  - Rest days and Sundays are never scheduled.
  - Caps are respected.
  - Priority order holds.
  - It's deterministic for the same input.
  - It reproduces `planning/gen.py`'s placement for the first 4 weeks (fixture).
  - October-sprint behavior is unchanged (the existing tests pass untouched).

### 4. Solve log (external attempts)
- Extend `Attempt` with `source: 'reps' | 'neetcode' | 'leetcode' | 'mock' | 'oa'`, `block`, `minutesTaken`, `unaided`, `watchedSolution`, `complexityAloud`, `edgeCasesTested` and `mistakeTags[]`. Add a daily `DayLog` with `hoursWorked`, `energy` (1–5) and a note. These match `planning/tracker_template.csv`.
- Add a "Log a solve" form (keyboard-first, under 20 seconds to fill). An external solve feeds `scheduleAfterAttempt` as a cold whole-problem attempt.
- CSV import and export compatible with `tracker_template.csv`. Extend the existing JSON export/import and its Zod schema.

### 5. Today view with time blocks
- `app/page.tsx` / `components/day-view.tsx` show the active program's `dayBlocks` for today:
  - **A:** today's new problems, with a 45-minute timer per problem, the video link (or the Reps capstone if one exists) and a "Log" button.
  - **Lunch.**
  - **B:** due re-solves (cold, about 15-minute timer each, interleaved order).
  - **C:** the block-C rotation item for the weekday (design / mock / behavioral / mock or AI-assisted / OA set).
  - **D:** the log and retro checklist.
- Show a "Minimum day" toggle: when on, Today hides everything except block B and one problem from block A.
- Burnout guard: if `energy ≤ 2` on 2 consecutive days, or hours above 6.5 for 3 days, show a gentle banner suggesting a minimum day. Never block anything.
- Saturdays show the lighter layout; Sundays and rest days show "Rest day."

### 6. Mocks and stories
- Extend `MockInterview` with `partner: 'self' | 'nadani' | 'peer' | 'paid'`, `format: 'google-doc' | 'meta-2q' | 'amazon-lp' | 'oa' | 'ai-assisted' | 'design' | 'behavioral'`, and a rubric scoring the 8 `INTERVIEW_BEHAVIOURS` plus `follow-up` from 1 to 4.
- Add a mock log page (`app/interview`) that records results, shows the cadence target from the plan (2 per week, rising to 3–4 in week 13), and shows the trend.
- Add `data/stories.ts` and `app/stories` with fields `{ id, experience, themes, lps, status: draft | polished, lastRehearsed, seconds }`. Show the prompts from `planning/behavioral_bank.md`. **Do not generate story content**; Stefen writes his own.

### 7. Design track
- `data/design-track.ts` (provided) plus `app/design` listing items by week, each with a deliverables checklist, a notes field (markdown, synced) and a status.
- AI-assisted items link to a practice-repo checklist: failing test → feature → optimize → explain.

### 8. Progress and checkpoints
- Extend Road to Ready / `lib/progress.ts` with `checkpoints` from the program (Day 30 Nov 10, Day 60 Dec 10, Day 90 Jan 10). Each checkpoint shows actual vs target for:
  - problems solved,
  - unaided re-solve rate,
  - median minutes for a new Medium,
  - percentage of solves with complexity stated aloud,
  - mocks and mock average,
  - stories polished,
  - designs done.
- Add a weekly retro page (Friday): auto-filled stats plus 3 free-text fields.
- Add tests for the metric calculations.

## Quality bar
- Run `npm run verify` (lint, type-check, unit tests, content verification, Pyodide verification, curriculum audit, build) and `npm run test:e2e`; all must pass.
- Add an e2e path: Today → log a NeetCode solve → the re-solve appears on +3 → mark a mock → the checkpoint updates.
- Keep the code-first audit guardrails for authored reps. The 90-day program mostly links out to NeetCode/LeetCode, so audit only the modules that exist.
- Update `README.md` ("What's where", programs, Supabase migration 0006 steps) and `docs/authoring.md` (how to add a 90-day capstone).
- Finish with a short PR description of what changed, what is archived, how to roll back (switch the active program to `oct-sprint`), and the remaining TODOs.
