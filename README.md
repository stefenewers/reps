# Reps

Build fluency through repetition.

A private, single-user practice system for full-time SWE I (new-grad) interview loops.
LeetCode problems are capstones of skill graphs, not the teaching material, so Reps
trains the Python primitives and patterns underneath them until they come out
automatically, then asks for the capstone.

It began as a ten-day sprint (Oct 2–10, 2026) and now runs a **90-day ladder plan**
(Oct 11, 2026 → Jan 8, 2027): every pattern is a ladder of reps from the ground up, a
mastery check passed without the solution, then that pattern's LeetCode problems with
spaced re-solves. The plan, its research basis and its generator are in `planning/`;
`python3 planning/gen.py` rewrites `data/schedule-90.ts`, which the app reads.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev                  # http://localhost:3000
```

With no keys at all, Reps works fully on one device: curriculum, Python execution,
tests, mastery, scheduling and progress are all local and cost nothing. Supabase adds
durable progress across devices. OpenAI adds the on-demand coach.

## What's where

| Path | What it is |
|---|---|
| `data/skills.ts` | The skill graph (granular skills + prerequisites) |
| `data/problems.ts` | Canonical LeetCode targets (links only, no copied statements) |
| `data/exercises/oct02.ts` … `oct11.ts` | The ten day modules, 635 reps, code-first |
| `data/mocks.ts` | Two 45-minute mock interviews |
| `data/program.ts` | The interview target, the finish line, and the ten Road to Ready stages (copy only; counts come from the curriculum) |
| `data/curriculum.ts` | Indexes the days |
| `docs/authoring.md` | How to write reps (read the Code-first section) |
| `lib/curriculum-audit.ts` | Classifies reps as active/guided/passive, models time, enforces guardrails |
| `public/python/harness.py` | The test harness, shared by the browser and the content verifier |
| `public/python/worker.js` | Pyodide in a module Web Worker |
| `lib/mastery.ts` | Deterministic mastery heuristic |
| `lib/schedule.ts` | Spaced cold reps, compressed into Oct 2–11 |
| `lib/progress.ts` | Progression, unlocking, readiness, end-of-day summary |
| `lib/storage/` | Persistence: `types`, `local` (IndexedDB), `remote` (Supabase), `sync`, `repository` |
| `lib/coach/` | Adaptive coach: schemas, verification, cache, dedupe, client |
| `app/api/coach/*` | Server routes for the coach (keys stay server-side) |
| `supabase/migrations/0005_reps.sql` | The Reps schema, additive to the stefenewers.com project |
| `components/winston-ambient.tsx` | Winston. Visual only. |

## Persistence

```
Reps UI ─ optimistic in-memory state
  └─ IndexedDB: instant reload, offline, pending-write outbox
      └─ Supabase (the existing stefenewers.com project, reps_* tables): durable source of truth
```

- Writes update the UI immediately, land in IndexedDB, and are pushed to Supabase after
  a short debounce (attempts ~0.3 s, drafts and location ~15 s). Failed pushes stay
  queued and retry with backoff; the header shows `Saved`, `Syncing` or
  `Offline · saved locally`.
- On load: cache first, then an incremental pull from Supabase (by server
  `updated_at`), reconcile, write back to the cache. A row with a pending local write
  wins; otherwise Supabase wins.
- Attempts are idempotent by id, and the database refuses to turn a finished attempt
  back into an unfinished one. Mastery and daily progress are recomputed from attempt
  history and persisted only when they change.
- Python never touches Supabase. Only meaningful events are stored: submissions,
  completions, hints, solution views, reviews, generated reps, mock results, drafts
  (debounced).

### Supabase setup (once)

Reps reuses the existing **stefenewers.com** Supabase project. Nothing existing is
changed: every Reps object is prefixed `reps_`, and the migration is additive and safe
to re-run.

1. **Apply the schema.** Run `supabase/migrations/0005_reps.sql` in the project's SQL
   editor, or copy it into the personal site's `supabase/migrations/` (it continues
   that numbering) and apply it with the CLI from there, so there is one migration
   history per project.
2. **Create your user** if you don't have one in that project: Authentication → Users →
   Add user (your email). Reps never creates accounts; sign-in uses
   `shouldCreateUser: false`.
3. **Make yourself the owner:**
   ```sql
   insert into public.reps_owners (user_id)
   select id from auth.users where email = 'you@example.com'
   on conflict do nothing;
   ```
   RLS on every `reps_*` table requires `user_id = auth.uid()` **and** membership in
   `reps_owners`, so other users of the project (InnaWords contributors, for example)
   can never read or write Reps data. `anon` has no grants.
4. **Allow the redirect:** Authentication → URL Configuration → add
   `http://localhost:3000` (and your deployed Reps URL) to Redirect URLs. This is
   additive and does not affect the site.
5. **Keys:** in `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` (same as the site) and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Settings → API Keys → Publishable key).
   Reps needs no secret or service-role key.
6. Open `/sign-in`, request a magic link, and progress already on the device syncs up.

### Export / import

`Export progress` and `Import progress` (footer of Today) write and read a JSON
bundle of attempts, mastery, daily progress, review queue, generated reps and study
state. Import validates the schema with Zod and merges without duplicating (attempts by
id, everything else newest-wins), then recomputes mastery.

## The coach (optional)

Set `OPENAI_API_KEY`, `OPENAI_DEFAULT_MODEL` (cheap/fast) and `OPENAI_REASONING_MODEL`
(stronger). Nothing calls a model unless you press a button: Another rep, Harder,
Easier, Hint (after the built-in hints run out), Explain mistake, Interview follow-up,
Check explanation, Challenge me (only when the request can't be parsed locally), and
the post-mock Review.

- Requests carry compact context (skill ids, scores, a few recent mistakes and
  signatures), never the history.
- Routing: fast model for micro reps, hints, plans, simple diagnosis; reasoning model
  for difficulty ≥ 4 or pattern generations, capstone/repeated-failure diagnosis, and
  interview review.
- Generated reps are validated with Zod, then **executed** in Pyodide: the canonical
  solution must pass every test, starter code must not, trace output must match. One
  regeneration is allowed; otherwise you're told it couldn't be generated.
- Before generating: local pool, then the Supabase pool, then the model. Spare reps
  are kept unused for next time. Structural signatures prevent "count fruits, then
  count animals".
- In production the routes require the signed-in Reps owner. For local dev without
  Supabase, `REPS_ALLOW_UNAUTHENTICATED_AI=1` (ignored in production).

## Code-first

Reps is for writing Python, not answering questions about it. `npm run audit:curriculum`
reports, per day, the mix of reps and the share of planned time spent actively coding
(writing, debugging, capstones), checked against both authored minutes and an
independent time model so estimates can't be padded. Tests enforce: ≥ 75% active time
overall, ≥ 65% per day, no more than 3 passive reps in a row, ≥ 4 Debug Reps per day,
and a from-scratch rep for every skill.

Current mix: 635 reps, 91% of planned time active (93% modeled), 80% of reps active,
127 Debug Reps, longest passive run 2.

## Mastery

Per skill, deterministic:

```
weight   = stage weight (recognize 0.5, trace 0.6 … debug 1.15, cold write 1.25, capstone 1.3) × retrieval (cold 1.5, run-it-back 0.6)
quality  = 0 if failed, else hint factor (−15% each, min 40%) × solution (30% if viewed) × retries (−10% each, min 50%)
accuracy = recency-weighted mean quality, last 15 attempts
evidence = 1 − e^(−Σ weight × quality / 4)
score    = 100 × accuracy × evidence     (capped at 55 with recognition-only evidence)
```

Status: `weak` (low accuracy, two misses in a row, or a failed cold rep) · `fluent`
(≥ 85, three clean reps in a row, and a clean cold rep) · `competent` ≥ 65 ·
`practicing` ≥ 30 · `introduced`.

## Checks

```bash
npm run lint
npm run type-check
npm test               # unit tests, including sync and the migration's RLS on real Postgres (PGlite)
npm run verify:content # every rep's solution and predicted output run through python3
npm run verify:pyodide # the same, in Pyodide (the browser's Python)
npm run audit:curriculum # code-first report and guardrails
npm run test:e2e       # Playwright: today → rep → submit → mastery → reload; Pyodide + infinite loop
npm run verify         # all of the above except e2e, plus a production build
```
