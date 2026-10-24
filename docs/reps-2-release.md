# Reps 2.0 release record

- **Launch:** Monday, October 26, 2026 (Week 1, Day 1), America/New_York.
- **Release commit:** the commit that adds this file, on `main` (`git log -1 -- docs/reps-2-release.md`). It builds on `3cd9c70` (final UX pass).

## What the release-candidate pass fixed

- **A blocking Python bug on Day 1.** Rep 8 of Day 1 is a debug rep whose broken starter loops forever ("Debug: the run that never ends"). The workspace's automatic "how many tests fail" run was cancelled by its own status change and relaunched every time Python became ready again. A submitted fix queued behind it was killed with each restart and reported "Python could not run". Two fixes:
  - The starter now runs once per rep, with a 4s cap.
  - A run interrupted by a restart retries once on the fresh interpreter (`lib/python/runner.ts`, with a unit test).
- **Next rep followed the retired plan.** Outside a session, "Next rep" followed the old 90-day order, and Today's rep rows opened reps without a session.
  - Rows now start today's session from the clicked rep.
  - A rep outside a session returns to Today ("Back to Today").
  - The breadcrumb links to Today, not the legacy day page.
- **Legacy routes removed.** `/day/[date]` and `/day/[date]/summary`, with `day-view`, `day-summary` and the unused old `road-to-ready`, are deleted. No route or conditional shows the 90-day product any more.
- **Saturday read as done.** The finish line ticked "22 optional reps" at 0 / 22. It now shows what was actually done, under "Open work, all optional", and the action is "Start optional reps".
- **Feb 1:** the week card no longer appears after the course has ended.
- **Week 1–2 content.** 141 required exercises were reviewed: unit paths, checkpoint variants, repair reps, lab parts and worked-example rebuilds. 12 genuinely unclear prompts were reworded (examples added, undefined terms defined, untaught syntax such as `raise ValueError` explained). No ids, tests, solutions or semantics changed.
- **Stale language removed.** Learner-facing: the Problems page no longer refers to "the 90 days", "the gauge" or "day pages". Engineer-facing: the README, `docs/reps-2.md` and `docs/authoring.md` now describe the course, and `docs/today-ux-refactor.md` is marked superseded.

## Validation

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run type-check` | clean |
| `npm test` | 336 passed, 0 failed |
| `npm run verify:content` | all guardrails pass; all content verified against Python |
| `npm run verify:pyodide` | 1,214 runs across 1,169 reps and 67 primers, identical |
| `npm run audit:migration` / `npm run audit:curriculum` | pass |
| `npm run test:e2e` (`--workers=1`) | 29 passed, 0 failed |
| `npm run build` | success |

`verify:content` also prints advisory plain-English flags from `lib/wording.ts`. They are heuristics, not guardrail failures. The required Weeks 1–2 path was reviewed by hand, and only genuinely unclear prompts were changed.

## Browser journeys verified

- **Day 1, end to end, with no console or page errors** (`e2e/course.spec.ts`, "Monday, Day 1, end to end"):
  - Today → Start lesson: State → While loops → worked example.
  - Start your reps → all 10 reps solved through the session, including the never-ending-loop debug rep.
  - Back to Today → "Training complete." with the flame at blaze → Stop for today.
- **Day 1 coach hand-off and status at every step** ("Day 1 as one coached journey").
- **Capture matrix** (`scripts/ui-shots`, 1440px and 390px, failing on any console or page error). First-screen captures are in `planning/ui-audit/rc/`.

  | | |
  |---|---|
  | Pre-course preview | Day 1 |
  | Partial day | Rep target met with a lab due |
  | Complete day | Planned rest |
  | Saturday recovery | Failed checkpoint → repair |
  | Placement | Week 3 |
  | Mid-course Today, Road and Progress | Week 13 |
  | Week 14 red, yellow and green, Today and /interview | Interview session |
  | Feb 1 final decision | Lesson |
  | Worked example | Demo |
  | Rep | Cold checkpoint |
  | Lab | Skills, Problems, Log |

- **Behaviour tests:**
  - lab completion and persistence;
  - cold checkpoint with no scaffolding;
  - repair routing and fresh variants;
  - outside rebuild credit;
  - malformed import leaves progress intact;
  - Week 14 mock allowance per grade;
  - rest days owe nothing;
  - the shell, tabs and More sheet with no horizontal overflow.
- **Calendar in America/New_York:**
  - Oct 23–25 are a preview; Oct 26 is Day 1, at 00:01 but not at 23:59 on Oct 25.
  - Saturdays are optional and Sundays are rest; the Nov 1 daylight-saving change maps correctly.
  - Dec 25, 26 and 31, Jan 1 and Jan 18 are rest.
  - Jan 31 is the last day, and Feb 1 shows the final decision.
  - All 98 course days are walked with no gaps or repeats.

## Accepted, non-blocking

- **Lab tests are lambdas.** Lab build tests are written as `(lambda s: …)` expressions. They are correct, but terse if the learner opens the test details. Changing them means changing tests, so it is left for after launch.
- **Bare hashing checkpoints.** The eight `o2-cold-*` hashing checkpoint variants have no worked examples. This is intentional: a checkpoint is a bare cold test.
- **Before/after captures add size.** The captures add about 26 MB to the repository.
