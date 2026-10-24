# Reps

Build fluency through repetition.

A private, single-user practice system for full-time SWE I (new-grad) interview loops.
LeetCode problems are capstones of skill graphs, not the teaching material, so Reps
trains the Python primitives and patterns underneath them until they come out
automatically, then asks for the capstone.

**Reps 2.0** is a 14-week course, **Mon Oct 26, 2026 → Sun Jan 31, 2027**, ending at the
Feb 1 interview-start checkpoint. The product map is `docs/reps-2.md`, the design system
`docs/reps-2-design.md`, the release record `docs/reps-2-release.md`, and the canonical
intent `REPS_2_MASTER_SPEC.md`.

The doctrine: **a LeetCode problem is the final integration test of a prerequisite graph.**
Each unit is taught (lesson, a demo you can step through, a worked example you rebuild),
practised in qualifying reps, proven at a cold checkpoint, and only then unlocks what
depends on it. **The calendar can slide; the order cannot.** A failed checkpoint routes to
a short repair aimed at the smallest broken skill. Mastery and freshness are separate, and
spaced retrieval keeps earlier skills fresh.

**Today is the product.** It names the day's topic and why, the one next action, the
three kinds of progress (qualifying reps, learning, required milestones), and a finish
line that says exactly when the day is done. Before Oct 26 it previews Day 1 (learning
open, nothing counted).

Pages: **Today**, **Road to Ready** (`/plan`: the 14 weeks, each unit and what unlocks
it), **Progress** (readiness by domain, what moved forward, evidence, what needs work,
builds), **Learn** (lessons, demos, worked examples, labs), **Interview** (the Week 14
route, readiness-gated mocks), and the practice library: **Skills**, **Problems**,
**Solve log**. CI (`.github/workflows/ci.yml`) runs lint, tests, content verification and
the build.

`archive/first-plan/` and `data/schedule-90.ts` are the earlier 90-day plan: history. The
rep library and some engine code still come from it, but no page runs on it.

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
| `data/exercises/oct02.ts` … `oct11.ts` | The ten topic modules, 689 reps, code-first |
| `data/exercises/bridges/` | The bridge packs: new pattern ladders (tries, matrix), six mastery checks and 45 problem bridges, 236 reps (`types.ts` describes a pack) |
| `data/problem-bridges.ts` | Every target's prerequisite graph: its building blocks and the reps that demonstrate them |
| `lib/bridges.ts` | Problem readiness, repair after a failed attempt, target conversion |
| `lib/training-state.ts` | Training state (learn / drill / combine / prove / maintain), freshness, what a rep is for, failure classification. Derived, never stored |
| `lib/session-planner.ts` | Today's training session: ordered blocks over today's stretch of the queue, repair sets, in-session acceleration, the briefing and the session review |
| `data/briefs.ts`, `data/briefs/` | "This question, in plain English" for every scheduled teaching rep: what each input is, what to return, the one thing to watch |
| `data/vocabulary.ts`, `data/pattern-words.ts` | The terms Reps introduces (each defined by a primer), and the words that name a technique (kept out of transfer reps) |
| `lib/coach/guidance.ts` | How generated reps are scaffolded by purpose: foundation teaches, cold is terse, pattern does not name itself |
| `data/reactivation.ts` | The one-time return session of Oct 12 (existing reps only) |
| `data/mocks.ts` | Two 45-minute mock interviews |
| `data/program.ts` | The interview target, the finish line, and the ten Road to Ready stages (copy only; counts come from the curriculum) |
| `data/curriculum.ts` | Indexes the days |
| `docs/authoring.md` | How to write reps (read the Code-first section) |
| `lib/curriculum-audit.ts` | Classifies reps as active/guided/passive, models time, enforces guardrails |
| `public/python/harness.py` | The test harness, shared by the browser and the content verifier |
| `public/python/worker.js` | Pyodide in a module Web Worker |
| `lib/mastery.ts` | Deterministic mastery heuristic |
| `lib/schedule.ts` | Spaced cold reps of skills: +1/+3/+5 days in the sprint, +1/+3/+7/+14/+30 in the 90-day plan |
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

Current mix: 925 reps, 93% of planned time active (94% modeled), 83% of reps active,
182 Debug Reps, longest passive run 2.

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
