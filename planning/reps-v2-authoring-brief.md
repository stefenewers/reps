# Reps 2.0 — authoring brief for course content

Shared by everyone writing new course content. The canonical intent is `REPS_2_MASTER_SPEC.md` (repo root); read §5 (principles), §9 (learning sequence), §13 (credit), §17 (your week) and §27–28 (tone) before writing.

## Read first

1. `REPS_2_MASTER_SPEC.md`: your week's section in §17 and §9.
2. `docs/authoring.md`: "Code-first", "Scaffolding by what the rep is for", "Fields", "Tests", and **"How a prompt reads (plain English)"**. The plain-English rule is enforced.
3. `data/exercises/build.ts`: the builders (`output`, `write`, `code`, `debug`, `fill`, `reorder`, `explain`, `t.eq`, `t.hidden`, `t.check`, `t.out`).
4. One existing module for the house style, e.g. `data/exercises/oct05.ts` (`d05-while`, `d05-bs`) and `data/exercises/oct03.ts`.
5. `data/course/units.ts`, `data/course/gates.ts`, `data/course/types.ts`: the ids you must produce.

## Rules

- **Python 3, standard library only.** It runs in Pyodide in the browser and in local `python3` for verification. No network, no files, no `input()`.
- **Teach before testing.** Week 1–2 reps assume only what earlier reps in the same week taught (plus basic Python the learner already knows: lists, for loops, `range`, `len`, `if`, functions, dicts, sets, strings).
- **Every rep is small.** 2–8 minutes. One idea per rep. A sequence inside a section goes: trace/predict → fill/complete → write → debug → combine.
- **Prompts follow the plain-English rule.** Inputs, then the task as an instruction ("Return …"), one rule per sentence, two examples (`f(args)` → `value`, a normal case and an edge case) for anything written from a description. No riddles. `npx tsx scripts/check-wording.ts <ids>` must pass.
- **Tests:** 3–6 visible `t.eq` cases plus 2–4 `t.hidden`, covering edge cases (empty, one item, duplicates, negatives, boundaries). The reference `solution` must pass them. `debug` reps: `brokenCode` must fail at least one test.
- **Skills:** only ids from `data/skills.ts`. Pick the 1–3 the rep actually trains.
- **Gate variants** (`gate: true`, `stage: 'retrieval'`, `repType: 'cold'`): a bare signature and plain prompt; no hints; no `note`; **never name the technique** (no "two pointers", "sliding window", "running state", "while loop" in the prompt or title of a gate). Variants in one gate's pool must be equivalent in difficulty and test the same thing in a different setting.
- **Lab exercises** (`lab: true`): larger (20–60 min), `stage: 'combine'`, `repType: 'combine'`, `minutes` 20–45, a real-world setting, 8–15 tests (acceptance tests). The change-request exercise is a separate exercise whose starter code is the reference build and whose tests cover the new requirement plus the old behaviour.
- **IDs are fixed** by `units.ts`, `gates.ts` and the spec of your task. Use them exactly. Never reuse an existing id.
- **Do not edit any file outside the files you were given.** Other agents work in parallel on other files.

## Verify (all must pass before you report)

```bash
npx tsx scripts/verify-reps.ts --prefix <your id prefixes>   # tests vs Python, prompt examples, plain English
npx tsx scripts/check-wording.ts <ids…>                       # optional, more detail on wording
npx tsc --noEmit -p .
npx tsx --test lib/pedagogy.test.ts                           # pattern-words leak check on cold/transfer reps
```

If another agent's file breaks `tsc` or a shared test, report it; do not fix their file.
