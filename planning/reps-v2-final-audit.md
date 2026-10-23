# Reps 2.0 final completion audit

Audit baseline: `5eaab00` on `v21-work`, 2026-10-23. Canonical requirements:
`REPS_2_MASTER_SPEC.md`, with the later V2.1 strict-credit and curated-path
decisions preserved. This audit was recorded before product changes.

Evidence reviewed: the master specification; baseline, migration and content-gap
reports; all eight Reps 2.0 implementation commits on `origin/main`; V2.1
handoffs; course definitions, contracts, planner, routing, credit, labs,
readiness, Today, Road and Progress; existing browser and simulation tests.
Migration covers 1,169 exercises with zero unmapped IDs. Existing architecture,
content IDs, local-first persistence and optional AI remain valuable.

## COMPLETE

- Fourteen weeks, October 26–January 31, February 1 readiness checkpoint,
  10/12/15 output ramp, 950 scheduled production slots, Sundays/holidays off.
- Explicit curated paths, scheduled obligations, prerequisite gates, 23 labs,
  lessons, worked examples and eleven interactive algorithm demonstrations.
- Deterministic Python execution, local persistence, export/import, optional
  cloud sync and optional AI; neither cloud service is needed to study.
- Shared daily/weekly contracts supply Today, flame, streak, Road and Progress.
- Unlabeled transfer bank and readiness-gated mock policy already exist.
- Full-course simulation verifies every required path and obligation within
  the output budget. Keep this constraint throughout fixes.

## FUNCTIONALLY COMPLETE BUT NEEDS POLISH

| ID | Requirement/current → desired; implementation | Severity | Blocking |
|---|---|---|---|
| P1 | Road gives only a prerequisite count → name the prerequisite and make the route back obvious; link prerequisite units/learning. | Medium | Yes |
| P2 | Progress lists historical counts → connect historical checkpoint/build evidence to actions and next work; make summary links useful. | Medium | Yes |
| P3 | Documentation names superseded planner/state paths → document the actual contract, planner and saved learning state. | Medium | Yes |

## PARTIALLY IMPLEMENTED

| ID | Requirement/current → desired; implementation | Severity | Blocking |
|---|---|---|---|
| R1 | Strong learners have placement in routing but Today ignores it → expose a cold placement action and let a clean gate skip teaching; distinguish pre-unit evidence from progress through today's teaching. | High | Yes |
| R2 | Flex practice is labeled retrieval even when fresh; old work is not prioritized → schedule due repeats before fresh optional practice, use truthful purpose labels and avoid same-day repeats. | High | Yes |
| R3 | Week 14 mock policy adapts but Today does not explain it → display the evidence-based green/yellow/red route and direct learners to allowed transfer, repair and mock work. | High | Yes |

## MISSING

No missing foundational subsystem requires a rewrite. Missing behaviors are
tracked as R1–R3 and P1–P3; missing verification is tracked below.

## BUG / INCONSISTENCY

| ID | Requirement/current → desired; implementation | Severity | Blocking |
|---|---|---|---|
| C1 | A second clean reconstruction-day attempt can become independent → require an earlier calendar day of clean reconstruction before independence; test same-day retries. | High | Yes |
| C2 | Equal timestamps evade earlier-reveal checks → conservatively retain tied reveal evidence; test imports with tied timestamps. | High | Yes |
| C3 | Malformed completion timestamps can earn credit → validate calendar dates and timestamp ordering at the evidence boundary without deleting history. | High | Yes |
| C4 | Gate accepts non-cold evidence → require cold evidence, preserve self-correction allowance; verify real gate attempts are cold. | High | Yes |
| C5 | Target completion bypasses same-day reconstruction rules → derive capstone completion from the shared qualifying evidence. | High | Yes |
| C6 | Lab marked-done timestamp can precede its build passes in imported state → completion date must include actual qualifying build/change evidence. | High | Yes |

## PRODUCT EXPERIENCE GAP

P1/P2/R1/R2/R3 cover confirmed learner-facing gaps. Today already contains
learn/watch/rebuild/practice/lab/checkpoint blocks, completion and stop states.
Failed gates already diagnose skills, select short repairs and rotate variants.
Rest owes nothing; backlog returns to prerequisites rather than skipping ahead.

## CONTENT GAP

Required curated content exists for all weeks. AI/FDE labs include deterministic
model simulation, structured output validation, approval boundaries, error
handling, evaluation and change requests. Live API calls are intentionally
unnecessary. Legacy repair inventory still has editorial audit warnings; those
are not missing required course content and must remain visibly distinguished
from the curated required path. Content and Python checks must pass afresh.

## VALIDATION GAP

- [x] Initial full browser suite, before changes (26 passed, recorded before product changes).
- [x] Regression tests for C1–C6 and placement/retrieval behavior.
- [x] Learner states: pre-start, first day, partial/full day, Sunday/holiday,
  failed/repaired/passed gate, strong placement, lab completion, complete/
  recoverable/off-track week, Week 13, green/yellow/red Week 14, multiweek
  progress and stale return. Cover pure state transitions plus browser actions.
- [x] Fresh full lint, types, unit, content, Pyodide, migration, curriculum,
  browser and production build checks after implementation.
- [x] Desktop/phone review, persistence reload and runtime error inspection.
- [x] Read-only production deployment health; distinguish deployed main from
  local branch. No production deploy or merge authorized.

## Implementation checklist

- [x] C1–C5 strict evidence and target completion, with regressions.
- [x] C6 truthful lab completion date, with regression.
- [x] R1–R2 planner/placement and spaced retrieval, maintaining 14-week fit.
- [x] R3 and P1–P2 learner guidance and historical action links.
- [x] P3 updated operating documentation and final completion report.

This is the baseline checklist, not a completion claim. Final disposition and
validation evidence will be appended after implementation.

## Findings added during implementation walkthroughs

- C7 (high, blocking): a failed checkpoint attempted before its scheduled due
  date disappeared after repair. Fixed: attempted, uncleared gates join due
  obligations; same-day repair is handled, next-day fresh variants stay visible.
  Reproduced and verified by a browser repair journey and contract regression.
- C8 (high, blocking): a second outside solve entry could conceal a same-day
  solution reveal. Fixed across shared credit, targets, readiness and display;
  regression prevents that credit. Outside assistance also contributes to
  Today's assistance count.
- C9 (high, blocking): imported later-unit passes could report readiness while
  prerequisites were still locked. Ready now requires prerequisites as well as
  the unit's own evidence; future history is excluded from current routing.
- P4 (medium, blocking): 42 required-path prompts used noun-phrase instructions
  or long sentences. Manually revised 41 authored prompts plus the derived cold
  version. Structured/prose examples explain many remaining heuristic warnings;
  they are not all missing examples or optional-inventory warnings.

Implementation commits: `631f5e5` (evidence), `b1f344a` (learner routing and
completion), `0b1e8a3` (content), `c84cb9a` (browser journeys).

Remote-state correction: the original handoff's main SHA was stale. A read-only
Vercel inspection found production READY at main `8f2aa67` (PR #4 merge), which
already contains the preceding V2.1 work. This completion pass leaves main alone.

P5 (medium, blocking) found during deployed comparison: mobile outside-solve
actions overflowed the pre-start page. Fixed in `3452734`; built page verified
with scroll width 390 at viewport width 390. Production remains unchanged.

Scope closed at the user’s usage-budget request. `planning/CLAUDE_CODE_HANDOFF.md`
is the continuation entry point; final verification is distinguished from product
implementation completion below.

## Final validation disposition

All eight quality commands pass; final browser validation remains OPEN due to
the legacy reactivation navigation timeout in the two-worker run. The user
requested handoff at 3% usage. This is a validation blocker, not a claimed pass.
Continue from `planning/CLAUDE_CODE_HANDOFF.md`.
