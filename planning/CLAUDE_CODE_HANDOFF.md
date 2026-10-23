# Claude Code handoff — final Reps 2.0 completion pass

User requested wrapping up because only 7% usage remains. Continue from this
handoff; do not restart the audit or reimplement the completed V2.1 work.

## Repository and release boundary

- GitHub: `stefenewers/reps`; branch `v21-work`.
- This execution workspace: `/workspace/reps`. User's Mac checkout was
  `/Users/ruggudile/Desktop/Projects/reps-v21`; pull the branch there.
- NEVER merge/push main or deploy production without explicit authorization.
- The original handoff's main SHA is stale. Read-only inspection found main
  `8f2aa67` (PR #4 merging preceding V2.1), production READY at
  `https://reps-five-jade.vercel.app`. This completion pass did not change main.
- Read `AGENTS.md` and relevant installed Next.js 16 docs before coding.

## Read first

1. `REPS_2_MASTER_SPEC.md` (canonical; already fully reviewed during this pass).
2. `planning/reps-v2-final-audit.md` (baseline committed before product changes,
   then findings added from real browser journeys).
3. `docs/reps-2-completion.md` (implemented behaviors, decisions, 20-state
   verification map, explicit limits; final validation section needs final status).
4. `docs/reps-2.md` (updated architecture).

Older `planning/CODEX_HANDOFF.md` / `V2_1_HANDOFF.md` describe an earlier state.
The 14-week curation, visual demos and Today integration are already complete.
Do NOT rerun `work/integrate-curation.py`; it was a one-time migration.

## Completed commits in this pass

- `7a3e8e2`: audit recorded before product changes.
- `631f5e5`: reconstruction, timestamps, cold gates and imported evidence.
- `b1f344a`: placement, truthful spaced retrieval, early-gate repair continuity,
  readiness locks, outside-solve history, learner guidance, mock reservations.
- `0b1e8a3`: manually clarified 41 source prompts, covering 42 required prompts
  including a derived cold version. No tests/signatures/solutions changed.
- `c84cb9a`: seven additional browser cases (33 total), covering working placement,
  repair-to-fresh-variant, persisted labs, corrupt imports and green/yellow/red.
- `3452734`: fixes mobile outside-solve actions overflowing the pre-start page.

## Important implementation details

- `lib/course/contract.ts`: authoritative daily/weekly completion. Attempted
  uncleared checkpoints stay visible even before their scheduled due date.
- `lib/course/daily-plan.ts`: shared Today/simulation prescription. Placement
  uses pre-course evidence, not today's novice teaching. Due repeats precede
  fresh inventory after three calendar days; fresh practice is not called cold.
- `lib/course/credit.ts`: same-day solution reconstruction cannot earn credit;
  another same-day reconstruction cannot become independent; tied timestamps
  retain reveal evidence. Invalid dates/times earn nothing. Outside log entries
  cannot conceal a same-day reveal. Local study dates stay local across DST.
- `lib/course/labs.ts`: completion date includes own-work build/change evidence;
  a backdated imported marker cannot fabricate historical completion.
- `components/use-mock-gate.ts`, `mock-session.tsx`: a mock start reserves its
  allowance in study state `mock-start:<id>`; direct URLs respect allowances.
- Road names/links prerequisites; Today explains Week 14 and week completion;
  Progress historical work has action links; independent breadcrumbs hide labels.
- No database migration, dependency update or production credential changes.

## Validation already obtained

- Full unit run: 335 passed (includes actual-prescription all-14-week simulation,
  offline/reconnect/storage and executable database/RLS tests).
- Full initial browser suite: 26 passed. All seven new cases passed in targeted
  runs, including real Python submission and the repair journey.
- Full 33-case run was intentionally superseded after the last responsive fix:
  it had 27 passes before interruption. Do NOT count it as a complete final run.
- Content verification passed after the prompt edits.
- Pyodide passed: 1,214 runs across 1,169 exercises and 67 primers.
- Migration and curriculum audits passed; zero unmapped exercises.
- Build passed: Next.js 16.3.8, all 106 static pages generated.
- Built app reviewed at 1440px and 390px on Today, Plan, Progress, Lesson,
  Example, Lab, Rep and Demo: all 16 checks HTTP 200, no page errors/overflow.
- Additional built pre-start check after last fix: scroll width 390, viewport390.
- Production main: HTTP 200 and READY; eight read-only desktop/phone checks had
  no JS errors. The live pre-start page had mobile overflow; fixed on this branch,
  intentionally not released to production.

## Final verification running at handoff preparation

The final product code is frozen at `3452734`; only docs/audit report wording
remain uncommitted while results are collected. Two processes were started:

1. `node work/final-quality.mjs`, overall log `/tmp/reps-signed-off-quality.log`.
   Runs sequentially: lint, type-check, test, verify:content, verify:pyodide,
   audit:migration, audit:curriculum, build. Each script gets a separate
   `/tmp/reps-signed-off-<script>.log`; summary is `work/qa/final-validation.json`.
2. `PLAYWRIGHT_BROWSERS_PATH=/tmp/reps-browsers E2E_PORT=3231 npm run test:e2e -- --workers=2`
   log `/tmp/reps-signed-off-e2e.log`. This is the definitive fresh full suite.

At handoff preparation, final lint, types and all 335 unit tests passed;
remaining quality scripts and the full browser run were still in progress.
Read the final status appended below before assuming anything remains running.

Do not run lint simultaneously with Playwright startup: Playwright deletes
`test-results`, which can race ESLint directory traversal. The final sequential
lint already passed. Earlier ENOENT was a tooling race, not a product failure.

## Minimal remaining work

1. Collect final process exits and logs. Fix any actual failure, then rerun affected
   checks and the full browser suite if product code changes. Do not claim a
   partial or interrupted browser run is a full pass.
2. Fill final validation in `docs/reps-2-completion.md`, update audit checkboxes
   and clearly distinguish outstanding validation from implemented blockers.
3. Commit remaining docs/generated migration summaries and push `v21-work`.
4. Read-only inspect latest preview deployment, without production promotion.
5. Stop task-owned servers if this environment is retained.

The larger legacy wording checker reports 353 heuristic flags; migration's
reused subset has 166. Many are examples already present in structured fields
or prose. All 42 required-path verb/sentence findings were manually resolved.
Do not equate heuristic warning counts with 353 missing or broken course reps.
Live signed-in cross-device account verification remains an external limitation;
local/offline/sync and RLS tests passed. Optional paid AI is not required.

## Reproduction commands on another machine

```bash
npm install
npx next typegen
npm run lint
npm run type-check
npm test
npm run verify:content
npm run verify:pyodide
npm run audit:migration
npm run audit:curriculum
npx playwright install chromium
npm run test:e2e
npm run build
```

E2E starts a local test Pyodide server automatically. Normal production uses
its normal CDN. Local screenshots and read-only review scripts live under
`work/qa` / `work/`; work is ignored and is not needed to build the repository.
Cloud shell commands need network grants; `npm_config_cache=/tmp/reps-npm-cache`
avoids inaccessible home npm cache, and browsers here are in `/tmp/reps-browsers`.

## Latest status

Pending collection at the moment this handoff was drafted. The wrapping agent
will append an exact result before committing and pushing this file.

Final wrap status (user requested immediate handoff at 3% usage):

- All eight final quality commands passed, including 335 unit tests and build.
- Final full E2E is UNRESOLVED: 24 cases had passed and 2 had failed when
  interrupted for handoff. The failure is legacy reactivation at
  `e2e/reps.spec.ts:279`: navigation expected `/rep/o2-append-line?s=`, but
  remained on Today for the default 5-second expectation. This case passed in
  the earlier 26-case single-worker run. The failing run used two workers;
  contention/compilation timing is plausible but NOT proven.
- FIRST NEXT TASK: rerun `npx playwright test e2e/reps.spec.ts --grep reactivation --workers=1`,
  inspect whether navigation eventually occurs, then run the entire E2E suite
  with one worker. Increase an expectation timeout only after confirming timing,
  not to conceal a broken action. No product fix for this failure was attempted
  after the user's budget-stop request.
- Saved quality summary: `planning/v21-artifacts/FINAL_VALIDATION.json`.
- Saved browser failure: `planning/v21-artifacts/FINAL_E2E_FAILURE.md`.
- Do not claim final product sign-off until the full browser suite passes.
