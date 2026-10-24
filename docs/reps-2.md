# Reps 2.0 — how the course works

The canonical intent is `REPS_2_MASTER_SPEC.md`. This is the map of how the code delivers it. From **Oct 26, 2026** Today, the Road (Plan) and Progress run on the course. Before that date Today previews Day 1 (learning open, nothing counted; the real date is kept for every save), and the Road and Progress already show the course. The 90-day plan no longer drives any page.

## Layers

```
Course (data/course)  → Week → Unit → learning sequence
   ↓ derived from attempts, never stored
Routing (lib/course/routing.ts)   unit states, placement, gates, repairs, locks → the course queue
Credit  (lib/course/credit.ts)    what counts today, and what kind of evidence a pass is
Contract (lib/course/contract.ts) daily/weekly completion, streak and obligation history
Today   (lib/course/daily-plan.ts) teaching, placement, due obligations and spaced retrieval
UI      (components/course/*)     Today, Road to Ready, labs, worked examples, readiness
```

The old queue (`lib/pacing.ts`) is still the execution inventory for dates before the course. The course queue replaces it from Oct 26. Exercise ids, tests, attempts and storage are unchanged.

## Static content (`data/course`, `data/exercises/course`)

| File | What |
|---|---|
| `calendar.ts` | Oct 26 → Jan 31. Sundays and five holidays are rest. Saturdays are optional recovery. The contract is 10 / 12 / then 15 a day, which makes 950 problems. |
| `weeks.ts` | The 14 weeks: title, focus, purpose, targets and rest days (derived). |
| `units.ts` | 30 learning units in teaching order. They reference sections by id and carry hard prerequisites. |
| `gates.ts` | 30 checkpoints. Each has a pool of equivalent cold variants and needs `need` clean passes of different variants. |
| `lessons.ts` | Lessons (Weeks 1–2), worked examples and labs. Later weeks teach through `data/concepts.ts`. |
| `motivation.ts` | The deterministic affirmation engine. It is evidence-bound and has tests. |
| `data/exercises/course/*` | New reps: Week 1–2 teaching reps, gate variants, the Week 13 transfer bank, and lab builds (`lab: true`). |

## Rules, with where they live

| Rule | Where |
|---|---|
| A rep counts once per day, only when passed. A shown solution earns nothing; a later rebuild counts as a reconstruction. Labs and multiple choice never count. | `lib/course/credit.ts` |
| A gate pass must be cold: no hints, no solution, not a reconstruction, and at most two failed runs. | `gateClean` |
| A unit stays locked until its prerequisite units are ready. The calendar never overrides that. | `courseStatus` |
| Placement: earlier production evidence means the gate is offered first. Passing it skips the teaching. | `courseStatus` / `courseQueue` |
| A failed gate gets 2–4 repair reps on the broken skill, then a different variant. | `gateStatus` |
| Planned rest creates no debt and keeps the streak alive. | `createContracts().streak` |
| Week status is on track, recoverable or off track, from output. A missing lab or checkpoint means a finished week is not on track. | `createContracts().weekContract` |
| Readiness is reported per domain with reasons, never as one percentage. | `lib/course/readiness.ts` |
| Week 13 shows no labels before an attempt and records the approach. A fast repeat of a known answer is "memorized risk". | `rep-workspace.tsx`, `approach-note.tsx`, `memorizedRisk` |
| Week 14 mocks follow the transfer grade (green / yellow / red), not the calendar. | `transferGrade`, `mockPolicy` |

## State (no new tables)

Everything is derived from attempts and the solve log. User-entered learning and lab state is stored in `reps_study_state`:

- `lab:<id>`: design answers, review checks, and `doneAt`.
- `approach:<id>`: the Week 13 approach note.
- `lesson:<id>`, `demo:<id>`, `example:<id>`: completed learning steps.
- `mock-start:<id>` and `mock:<id>:<resultId>`: mock reservations and results.

A seen solution blocks same-day reconstruction credit, including tied imported timestamps. A later-day rebuild counts as reconstruction; only a subsequent day can establish independence. Invalid calendar dates and reversed or malformed timestamps remain in history but earn no course evidence. Local study dates remain local across DST. Labs cannot be completed before their qualifying build/change passes.

Placement uses production evidence recorded before the course rather than converting today's novice drills into a shortcut. Due retrieval uses at least three calendar days of spacing; fresh inventory is labeled practice. Required paths and obligations keep priority. Week 14 explains and enforces green (two), yellow (one) and red (zero) mock allowances, including started mocks.

Streaks, week completion and readiness are never stored.

## Checks

```bash
npm test                     # includes lib/course/*.test.ts (credit, week status, routing, readiness, motivation, content integrity)
npm run audit:migration      # every existing rep mapped to week/unit/purpose/action; fails on any unmapped rep
npx tsx scripts/verify-reps.ts --prefix c1- c2- lab-   # a slice: tests vs Python, prompt examples, plain English
npx playwright test e2e/course.spec.ts
```

Final completion evidence: `docs/reps-2-completion.md` and `planning/reps-v2-final-audit.md`.

Reports: `planning/reps-v2-baseline.md`, `planning/reps-v2-migration.{md,json}`, `planning/reps-v2-content-gaps.md`.
