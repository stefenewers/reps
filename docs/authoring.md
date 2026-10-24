# Authoring Reps curriculum

Reps teaches the foundations coding interviews need, builds them into automatic
fluency through repetition, shows how they combine into patterns, gradually removes
the scaffolding, and only then uses LeetCode-style problems as tests of transfer:

```
teach → demonstrate → guided production → repetition → debugging → combination
      → unlabeled transfer → capstone → spaced retrieval
```

A learner can get problem statements anywhere. What Reps adds is the layer before
them. **Never assume a concept is understood because it appears in an interview
curriculum.** A learner should never fail a foundational rep because Reps did not
explain the prerequisite idea first. And once an idea has been learned, the
explanation goes away: the goal is progressive removal of scaffolding, not permanent
hand-holding.

The learner: building toward SWE I / new-grad coding interviews in Python. General
programming is understood; fluent Python, data structures, algorithms and pattern
recognition are still developing. Python only. The Reps 2.0 course runs Oct 26, 2026 →
Jan 31, 2027 (`docs/reps-2.md`).

Confusion about the **problem statement** is not desirable difficulty. Reasoning
about the **solution** is. The test every rep must pass, from a real question the
learner asked about `lookup_or(d, key, fallback)`: *"is `d` a dictionary? Is that an
assumption? Am I supposed to find that out?"*

## The model, as an operating standard

**1. Reps teaches when necessary.** A learner may meet a concept for the first time
here. On first exposure a rep (with its primer and `note`) establishes: what the
concept is, why it exists, the mental model, the vocabulary, the smallest Python
mechanics needed, and one concrete example. Then, immediately, a small production
rep. Not a lesson to read: the learner reaches the editor quickly.

**2. Reps drills what has been taught.** Once the idea exists, explanations shrink.
The learner types the mechanics repeatedly, in different shapes, until they are cheap.

**3. Reps combines known moves** into increasingly realistic tasks.

**4. Reps removes the labels.** Before a target problem the learner solves at least
one small problem where the pattern is not named for them (`transfer: true`).

**5. Capstones prove transfer.** The original problem is never the first place the
learner sees the underlying ideas. Every target has a prerequisite graph (see
"Problem bridges").

**6. Reps retrieves later.** Cold and maintenance reps are terse on purpose.

## Scaffolding by what the rep is for

The same task is a different rep at different stages. `lib/training-state.ts`
(`SCAFFOLDING`, `repPurpose`, `firstExposure`) is the rule the workspace, the planner
and the generated reps all follow; write prompts to match it.

| Purpose | Which reps | What the prompt carries |
|---|---|---|
| **Learn** | the first rep(s) to carry a skill | 2–5 sentences: what each input **is**, what to return, any new term in plain words; one tiny worked example; the edge behaviour the tests check. The concept goes in `note` (1–3 lines). Never the solution. |
| **Drill** | the reps that follow | Shorter. The contract is still unambiguous; no re-teaching. An example only if the contract needs one. Tracing, debugging, reconstruction, small transformations. |
| **Combine** | `stage: 'combine' / 'pattern'`, bridge reps | Inputs, output, constraints, edge behaviour. May name the technique early in a section; later ones name it less. |
| **Prove** | capstones, mastery checks, `transfer: true` reps | A clean, interview-quality problem. The technique is **not** named: recognising it is the test. |
| **Maintain** | warm-ups, `-cold` sections, the interview module | Terse. `Write count_evens(nums).` is good retrieval. Fix only a real ambiguity. |

`Write count_evens(nums).` is good Maintain content and poor Learn content. There is
no minimum prompt length, and no rule that every prompt needs an example: a short
prompt is right when it is short on purpose.

`nums`, `words`, `items`, `root`, `head`, `grid` are legitimate interview names. Do
not turn reps into story problems. The rule is only: **when a mechanic is first
learned, say what the variable represents.**

- Bad Learn: `Write count_nodes(root) from the signature.`
- Good Learn: `root` is the top node of a binary tree, or `None` if the tree is empty.
  Each node has `.left` and `.right`, themselves nodes or `None`. Write
  `count_nodes(root)` returning how many nodes the tree has. An empty tree has 0.

### What the learner sees

On a true first exposure (a skill of the rep has never been produced, and the rep is
not a check, capstone, cold or transfer rep) the workspace shows, **before** the
question and without anyone pressing Basics: the primer's concept, its mental model
and its example, the rep's `note`, then "Your rep", the prompt and the plain-English
brief. After the skill has been produced once, none of that is shown automatically;
it stays behind Basics. Drill, combine, prove and maintain reps never open with a
lecture.

### Vocabulary

A term is defined in plain words the first time it appears, in the prompt or `note`
of that rep, and in the skill's primer (`data/vocabulary.ts` lists the terms and the
skill that introduces each; a test checks the primer defines it). Examples: window,
pointer, invariant, lower bound, half-open range, stack, queue, deque, traversal,
preorder / inorder / postorder, BFS, DFS, adjacency list, visited set, connected
component, directed edge, in-degree, base case, recurrence, memoization, bottom-up,
DP state, rolling state, backtracking, interval, heap, size-k heap.

### Briefs

`data/briefs/<module>.ts` (and `data/briefs.ts` for the dictionary stretch): "this
question, in plain English". `task` (for traces, fills, debugs), `inputs` (every
input, in order: what it is), `returns`, `catch` (a pointer or a question, never the
fix). Every scheduled teaching rep and the first rep of every skill has one. Warm-up,
cold, mastery-check and capstone reps do not.

### Unlabeled transfer

"Use two pointers", "use a set", "use a heap" are right while teaching and must
eventually disappear. Before each capstone, and at the end of each problem bridge,
one from-signature rep is marked `transfer: true`: a small, clearly worded problem
whose title and prompt do not name the technique, the data structure or the
algorithm (`data/pattern-words.ts` holds the words; a test enforces it). Its hints
may still name the technique, progressively.

### Generated reps

The coach follows the same rule (`lib/coach/guidance.ts`). A **foundation** rep must
teach (a structured `teaching` field: concept and a tiny example that is not the
answer), define its inputs and include a worked example. A **combine** rep states a
clear contract with less instruction. A **pattern** rep does not name its pattern. A
**cold** rep carries no teaching and a one- or two-sentence prompt. These are checked
with the deterministic tests before a generated rep is ever shown.

## Files

- `lib/types.ts` – `Exercise`, `Section`, `DayModule`, `TestCase`.
- `data/exercises/build.ts` – builders: `choice`, `output`, `fill`, `code`, `reorder`,
  `capstone`, `explain`, and `t.eq / t.hidden / t.out / t.check` for tests.
- `data/skills.ts` – the only valid skill ids. Do not invent skills.
- `data/problems.ts` – canonical problems. A capstone's id is `cap-<problemId>` and it
  sets `problemId`.
- `public/python/harness.py` – how tests run. User code is `exec`'d into a fresh
  namespace that already contains `ListNode`, `TreeNode`, `build_list(values)`,
  `list_to_array(node)`, `build_tree(level_order_values)`, `tree_to_array(root)` and the
  `typing` names (`List`, `Optional`, …). Nothing else is pre-imported: if a rep needs
  `deque` or `heapq`, the solution imports it.

Each day file exports `day: DayModule`:

```ts
export const day: DayModule = {
  date: '2026-10-03',
  short: 'Pointers',               // one word for the date strip
  title: 'Strings + two pointers',  // the day subtitle
  focus: 'One sentence on what today trains.',
  sections: [ { id, title, summary, exercises: [...] }, ... ],
  capstones: ['valid-palindrome', ...],
}
```

Section titles form the visible learning path on the dashboard, so keep them short:
`Python recall`, `Dictionaries`, `.get()`, `Frequency maps`, `Two Sum`, `Cold reps`.

## Code-first (read this first)

Reps exists because courses don't give enough actual repetitions writing code. The
main activity is writing, running, breaking, fixing and rewriting Python. Choice and
trace reps are short on-ramps, never the bulk. Teaching is short and comes first;
it never replaces the typing.

`npm run audit:curriculum -- <date>` reports each day's mix. The guardrails (enforced
by tests) are:

- At least 75% of estimated time overall, and 65% per module (70% for the interview module), is
  **active** coding: write, debug, capstone. Measured on authored minutes *and* on a
  modeled estimate, so inflating minutes doesn't help.
- At most 3 passive reps (choice, trace, explain, tiny blank) in a row.
- At least 4 Debug Reps per day.
- Every skill has at least one from-scratch rep (bare signature or blank editor, 2+
  lines to write).
- Authored minutes must be justified by the work (see `inflated()`).

Aim higher than the guardrails: 75–85% active time per day, 60%+ of reps active,
passive runs of 2 or fewer, 8–12 debug reps per day.

The rhythm for each construct:

```
1 trace (first exposure only)
→ 1 tiny guided rep (optional)
→ 2–4 write reps (different shapes)
→ 1–2 debug reps
→ combine with earlier constructs
→ cold write from a signature
```

High-value formats (all are `code` reps run by tests; set `style`):

- `write(...)` – from a signature: `def count_unique(nums):` and nothing else.
- `debug(...)` – broken code preloaded: syntax slips (`for num of nums`), API misuse
  (`counts.get(ch) + 1`), wrong dict direction (`seen[i] = num`), inverted condition,
  off-by-one in binary search, pointer reassignment order, missing base case, marking
  visited too late. The prompt states the intended behaviour, never where the bug is.
  The broken code must fail at least one visible test.
- `style: 'finish'` – a meaningful partial implementation (several lines missing, not
  one blank).
- `style: 'modify'` – "this returns the values; change it to return their indexes."
- `style: 'optimize'` – working O(n²) code to rewrite with a set or dict.
- `style: 'translate'` – "rewrite this index loop with enumerate()".
- `style: 'write-test'` – encode the edge case that breaks a given function (e.g.
  return an input from `breaking_input()` checked with `t.check`).

Fill-in-the-blank is scaffolding: filling `counts.get(ch, ____)` does not prove you can
write `counts[ch] = counts.get(ch, 0) + 1`. Every primitive must later be produced
from memory. Cold reps are a signature and a blank body, never "which structure would
you use?", and never a re-explanation.

## The ladder

Move each primitive through:

recognize (choice) → trace (output) → fill (one blank) → write one line → write several
lines → combine with another primitive → reconstruct (reorder / rewrite from memory) →
apply (pattern rep) → capstone → interview explanation.

Rules:

- Do not jump from "here is a dict" to "solve Two Sum". Build the bridge.
- Weak primitives get several variations with different structure, not just different
  nouns. "Count fruits" then "count animals" is the same rep twice.
- Remove scaffolding progressively: later reps in a section have less starter code,
  fewer comments, harder edge cases.
- Interleave: a later section should reuse earlier primitives.
- Each day (from Oct 3) opens with a short **Warm-up** section of 4–6 cold reps on the
  previous days' key primitives, written fresh (stage `retrieval`, repType `cold`).
- After each capstone add one `explain` rep (approach, invariant, complexity, edge
  cases) with a 3–5 item rubric.
- Capstone prompts are written in your own words. Never paste LeetCode statements.
  Give a function signature in `starterCode`, 2–3 `examples`, 2–3 visible tests and
  5–8 hidden tests covering edge cases (empty, single item, duplicates, negatives,
  already-sorted, etc.), `complexity`, an `explanation`, and four hints.

## Fields

- `prompt`: markdown-lite. Paragraphs, `inline code`, **bold**, fenced ```python
  blocks. Keep prompts short and concrete. For `output`/`choice` reps put the code in
  `code`, not the prompt.
- `hints` (code reps): progressive. 1 conceptual nudge, 2 relevant structure or
  primitive, 3 the specific operation, 4 the algorithm outline. Never the full
  solution. Small foundation reps can have 1–2 hints.
- `note`: a 1–3 line concept reminder, shown in Learn mode. Can include a tiny code
  sample.
- `explanation`: shown after completion. 1–4 sentences. Why, not just what.
- `signature`: a structural tag used for deduplication, like `freq-map:count-chars`,
  `index-map:first-seen`, `trace:enumerate-print`. Same structure → same prefix.
- `difficulty` 1–5 and `minutes`, realistic for a learner who is still slow on syntax:
  choice 0.5–1, output 1–2, fill 1–2, write ≈ 1.5 + 0.8 × lines to write (×1.75 at
  most), debug 2–6, capstone 15–30, explain 3–5. `inflated()` flags anything beyond.
- `important: true` for reps whose skills must resurface as cold reps later
  (capstones are important by default).

## Tests

- Prefer function tests: `t.eq('count_evens([1, 2, 4])', '2')`. `expected` is a
  Python expression. Hidden tests: `t.hidden(...)`.
- For "write one line" reps, give starter code with the surrounding variables and use
  `t.check('name', 'assert counts == {"a": 2}')` — the user's variables are in scope.
- `t.out('...')` compares everything the user's code printed.
- `compare`: `'unordered'` when order does not matter, `'sorted-inner'` for lists of
  lists in any order (subsets), `'float'` for floats.
- Booleans are strict: `return 1` does not pass for `True`.
- Starter code for `code` reps must NOT already pass the tests (the verifier checks).
  Blanks in `fill` reps are written `____`.
- Avoid nondeterminism: no `input()`, randomness, time, or printing sets (print
  `sorted(s)` or `len(s)` instead).

## Problem bridges

The pattern ladder teaches the pattern. A target problem usually needs one or two moves
the ladder never trained (prefix and suffix passes for Product of Array Except Self,
which half is sorted for a rotated search, return-one-thing-record-another for Maximum
Path Sum). Those moves are taught by the problem's **bridge**, placed in the plan
immediately before the problem.

Bridges live in `data/exercises/bridges/<area>.ts`. Each file exports a `Pack`
(`data/exercises/bridges/types.ts`):

- `sections`: bridge sections (`br-<lc>`, title `Toward <Problem>`), plus any new
  pattern ladder (`tr-…`, `mx-…`) or mastery check (`gate: true`). Each names the topic
  `module` it belongs to.
- `bridges`: one entry per target: its `blocks` (named moves, in the order they are
  built), each with the bridge `reps` that teach it and/or `evidence` (existing ladder
  reps that already demonstrate it), `prerequisiteSkills`, and a `mode`.
- `units`: new ladders and checks, by plan unit.
- `briefs` (every code rep) and `primers` (every new skill).

Rules:

- Length follows the gap, not a quota: 1–2 transfer reps when the moves are already
  laddered, 3–6 for a new Medium move, 5–8 for a hard new sub-pattern.
- The Dictionary Ladder shape: at most one trace, then write the primitive, a variation
  of a different shape, a debug of the classic mistake, a combine, and last a
  **miniature analogue** from a bare signature. The analogue is never the target itself.
- A block is a move you can name in plain words ("spot where a run starts"). Every
  bridge rep sits in exactly one block.
- Evidence must be something the plan schedules before the target (or already passed).
  `lib/schedule-plan.test.ts` enforces that, and that no bridge depends on a later one.
- A mastery check is cold, from-signature code only: no choice, no trace.
- A new skill is added to `data/skills.ts` only when a scheduled problem needs it and
  it is something demonstrable in code; it needs a primer and a from-scratch rep.

`npx tsx scripts/verify-pack.ts <area>` verifies one pack on its own. After changing
packs: `npx tsx scripts/export-ladders.ts && python3 planning/gen.py`, then inspect the
plan (`npm run audit:curriculum`).

## Verify

```bash
npm run verify:content -- 2026-10-03
```

runs every solution and every predicted output through real Python with the same
harness the browser uses. Fix everything it reports. It prints rep counts and estimated
minutes per day.

## The Learn layer

Concept guides (`data/concepts.ts`) are composed from the primers, so they have one source of truth. Each covers what the idea is, why it matters, a mental model, core moves, the usual shape, common mistakes and concept videos (`data/concept-videos.ts`). Concept videos explain an idea and are never problem walkthroughs. On a rep the guide starts open on first exposure, is collapsed on drills and combines, is collapsed on anything that proves (opening it there counts as help), and is not shown in interview mode. The full guide lives at `/learn/<id>`. To teach a new pattern, add or extend a primer and list it in a concept spec. `lib/learn.test.ts` fails if a primer or a practised skill has no concept.

## How a prompt reads (plain English)

A learner should understand the task on the first read. Most of the confusion so far was the English, not the Python.

1. **Inputs, then the task as an instruction.** "`nums` is a list of numbers. Return the largest gap between …". Never "Write `f(x)`: a list where …" (a noun phrase the reader has to turn into a verb).
2. **One rule per sentence.** Stopping conditions, edge cases and constraints each get their own short sentence. Under 32 words, usually far fewer.
3. **Say the steps the way you would say them out loud.** "Count up from `start`. Stop at the first number that isn't in `seen`." beats "the unbroken run `start, start + 1, …` that are all in `seen`".
4. **"So" only for real consequences.** Do not join two separate rules with "so".
5. **Hints are plain.** "Use a dict from value to index." Not "a set cannot remember where a value was; something else can".
6. **New words get an example, not a definition.** "A streak is days in a row, like 4, 5, 6." Bold the word once.
7. **Two examples for anything you write from a description:** a normal case and an edge case, each with a short reason in parentheses when it is not obvious. Examples use `f(args)` → `value`; `npm run verify:content` runs every one against the solution.
8. **Plain words.** "isn't", "the rest", "the first one". No "respectively", "the former", "as long as it can be", "such that".
9. **Keep what the rep tests.** Rewording never changes the tests, the solution, the function name or the skill.

`lib/wording.ts` checks the mechanical part (the "Write `f()`:" form, sentence length, riddle hints, the two examples). Reps listed in `data/plain-english.ts` must pass it; `npm run audit:curriculum` reports how many others still need a pass.
