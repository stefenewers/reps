# Authoring Reps curriculum

Reps turns concepts the learner already understands into things they can recall and
type automatically under interview pressure. LeetCode problems are capstones of skill
graphs, not the teaching material. Every day module builds the bridge from single
Python primitives to the capstone, then takes the scaffolding away.

The learner: understands programming concepts, but Python syntax retrieval is not yet
automatic. Target: Google SWE internship technical interview, Oct 12 2026. ~8 hours a
day of study. Python only.

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
trace reps are short on-ramps, never the bulk.

`npm run audit:curriculum -- <date>` reports each day's mix. The guardrails (enforced
by tests) are:

- At least 75% of estimated time overall, and 65% per day (70% on Oct 11), is
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
you use?".

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

## Verify

```bash
npm run verify:content -- 2026-10-03
```

runs every solution and every predicted output through real Python with the same
harness the browser uses. Fix everything it reports. It prints rep counts and estimated
minutes per day.
