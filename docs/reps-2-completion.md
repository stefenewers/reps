# Reps 2.0 completion record

Completion work is on `v21-work`, based on `5eaab00`, with the final audit in
`planning/reps-v2-final-audit.md`. The master specification remains canonical;
V2.1's curated paths and stricter credit rules are preserved. No merge to main
or production release was performed.

## Completed product behavior

The 14-week course contains curated required paths, daily teaching and practice,
checkpoints, target problems and software/AI labs. The complete-course simulation
follows the actual Today prescription and finishes every training day and week
within 10/12/15 qualifying reps. Optional inventory cannot become hidden homework.

Today connects learning, visual demonstration, reconstruction, practice, due labs,
checkpoints and recovery. It explains its completion contract and offers a real
stop state, week completion and a route to the progress record. Road names the
prerequisites behind locks and opens the corresponding earlier week. Progress
keeps historical output, builds, checkpoints, evidence quality and freshness,
with links back to work and the current recovery plan.

This completion pass additionally closes these gaps:

- Earlier production evidence offers a working cold placement session; passing
  skips teaching. Today's own novice drills do not silently become placement.
- Flex slots prioritize the oldest due repeats after at least three calendar
  days. Fresh inventory is labeled practice. Yesterday's completed rep is not
  prescribed as a spaced repeat.
- Failed checkpoints produce focused repair. Even an early checkpoint remains
  visible after repair, with a different variant available the next day.
- Week 14 explains green/yellow/red transfer routes and enforces two/one/zero
  mock allowances, reserving an allowance when a mock starts. Weak transfer
  evidence receives additional transfer practice alongside timed singles.
- Reconstruction cannot turn into independent evidence through another retry
  that day. Tied timestamps retain reveal evidence; malformed/reversed timestamps
  and invalid dates cannot earn credit. Study dates remain local across DST.
- Outside solve entries cannot conceal a same-day solution reveal. Capstone
  target completion follows the same reveal restrictions as daily credit.
- Checkpoints require cold evidence. Imported later-unit evidence cannot bypass
  prerequisite readiness. Future attempts cannot change an earlier prescription.
- A lab cannot be completed before its qualifying build/change work exists.
  Missing imported lab fields are handled without crashing the lab view.
- Independent practice hides technique-bearing breadcrumb metadata. Checkpoint,
  transfer and interview assistance restrictions remain in force.
- Forty-one source prompts were manually rewritten; the derived cold prompt
  inherits the change, covering 42 required-path prompts. These changes clarify
  verbs and shorten sentences without changing signatures, tests or solutions.

## Decisions retained

Daily output counts production rather than time or self-graded explanation.
Hints can earn assisted daily credit; a shown solution cannot. A later-day
rebuild is reconstruction, and independence requires a subsequent day. Labs
require design, an own-work build, a change request and review; their parts do
not inflate the rep count. Gates allow up to two failed runs without assistance.

History is preserved. Malformed evidence is excluded from derived credit rather
than deleting imported attempts. Dates recorded on attempts are local study
calendar dates; they are not recomputed from UTC. Historical weekly output
records what happened that week; later repair does not fabricate past output.

AI/FDE labs use deterministic simulated model output and real Python tests.
They teach validation, tool boundaries, approval, failures, evaluation and
changing requirements without requiring paid model access. Live model services
and cloud sync remain optional. AI/FDE readiness does not block general SWE
readiness.

## Learner-state coverage

| State | Verification |
|---|---|
| Pre-start October 23 | Browser: course announcement, existing training intact |
| First day October 26 | Browser: 10 reps, learning CTA, Road and readiness |
| Partial day | Contract tests: target shortfall and remaining obligations |
| Complete day | Browser: contract, flame, streak, stop and persisted progress |
| Sunday | Browser and contract: no obligation or debt |
| Holiday | Christmas browser; holiday-week capacity and streak tests |
| Failed checkpoint | Browser: repair becomes primary action |
| Repaired early checkpoint | Browser + regression: repair works, retry stays visible |
| Clean checkpoint pass | Routing tests and complete-course simulation unlock dependants |
| Strong placement | Browser: start cold session and execute Python; routing skips path |
| Lab completion | Browser: design/build/change/review, reload persistence, zero rep credit |
| Complete week | Actual-prescription simulation: all fourteen weeks |
| Recoverable week | Week-status and readiness tests |
| Off-track week | Contract/readiness tests, missed-week prescription regression |
| Week 13 | Transfer grading, approach state, cold/unlabeled workspace restrictions |
| Green Week 14 | Browser: two mock slots and working start |
| Yellow Week 14 | Browser: first start reserves only slot; second direct URL blocked |
| Red Week 14 | Browser: explanation and direct mock URL blocked |
| Multiweek progress | Simulation, historical summaries and built-app Progress review |
| Stale return | Browser reactivation and freshness/retrieval tests |

Additional coverage includes same-day reveal abuse, tied/malformed imported
history, UTC rollover/DST, corrupt-file rejection, offline/reconnect sync queues,
worker timeout/recovery, direct gate restrictions, learning completion, mobile
reduced-motion demos and actual Python execution.

## Final validation

All eight final quality commands passed on the frozen implementation:

| Check | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run type-check` | Pass |
| `npm test` | 335 passed, zero failed |
| `npm run verify:content` | All content verified against Python |
| `npm run verify:pyodide` | 1,214 runs / 1,169 reps / 67 primers, all pass |
| `npm run audit:migration` | Every rep mapped; zero unmapped |
| `npm run audit:curriculum` | All guardrails pass |
| `npm run build` | Pass; 106 static pages generated |

The definitive fresh 33-case browser run is tracked in the handoff's latest
status. Earlier targeted runs passed all seven added cases. An interrupted
partial run is not claimed as full verification.

The production build was browser-reviewed on eight screens at 1440px and 390px:
16 HTTP 200 results, zero page errors and zero root overflow. The separate
pre-start mobile check also passed after the responsive fix. Production main
is READY and responds HTTP 200, but its pre-start mobile overflow remains live
until an authorized release of this branch. No production deploy was performed.

## Intentional future work and limits

This is a focused new-grad SWE preparation course, not an exhaustive advanced
DSA curriculum. Stretch content stays optional. Generalized user-authored graph
and tree editors, real paid model calls and automated semantic grading of prose
are outside this course's required scope.

The legacy wording checker still reports heuristic warnings across the larger
inventory, including required problems whose examples already exist in structured
fields or prose. The 42 required-path verb/sentence findings were resolved; a
heuristic warning count is not a missing-content count. Existing Python content
and prompt-example verification remain mandatory.

A live signed-in cross-device account session is not reproduced in this isolated
environment. Offline/reconnect, reconciliation, ownership and RLS behavior are
covered by the repository's executable storage/database tests. No credentials,
production learner records or database policies were changed.

## Handoff status

Implementation and all eight quality checks are complete. Final browser sign-off
is still open: the two-worker run hit a 5-second navigation timeout in legacy
reactivation. Earlier single-worker coverage passed that flow. See
`planning/CLAUDE_CODE_HANDOFF.md` for the exact first task and failure evidence.
