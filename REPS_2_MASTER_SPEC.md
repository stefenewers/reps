# Reps 2.0 — Master Product, Curriculum, Gamification & Implementation Specification

**Status:** Canonical implementation specification  
**Audience:** Claude Code / engineering implementation agent / product owner  
**Repository:** `stefenewers/reps`  
**Primary user:** Stefen  
**Target:** SWE I / junior / new-grad software engineering readiness in Python  
**Interview-start checkpoint:** **February 1, 2027**  
**Canonical training window:** **October 26, 2026 through January 31, 2027**  
**Required qualifying-problem volume:** **950 total**, adjusted for planned holidays  
**Core doctrine:** **Teach first. Practice deliberately. Remove scaffolding. Prove independently. Retrieve later.**

---

# 0. Purpose of this document

This document is the single source of truth for the next major evolution of Reps.

It consolidates:

- the existing Reps architecture and product philosophy;
- the historical evidence from Stefen's usage;
- the research synthesis across high-quality beginner programming curricula, bootcamps, interview-prep systems, learning science, and modern Applied AI / Forward Deployed Engineer expectations;
- the complete 14-week curriculum redesign;
- the product architecture required to deliver it;
- the migration strategy for the existing 925 authored reps;
- a stricter accountability and mastery model;
- adaptive placement and repair behavior;
- a new gamification layer;
- a new evidence-grounded affirmation and motivational-language system;
- the UI/UX upgrade;
- implementation phases;
- acceptance tests and validation criteria.

**Do not treat this as a request to rewrite Reps from scratch.**

The existing execution, persistence, mastery, retrieval, repair, problem-bridge, and session-planning infrastructure is valuable and should be preserved wherever possible.

The core strategic conclusion is:

> **Reps already has a strong practice engine. The missing layer is a complete course that feeds that engine, plus a warmer, more motivating product experience that makes progress feel alive.**

---

# 1. North Star

Reps should become the clearest and most reliable path between:

> **"I want to become a software engineer."**

and:

> **"I can independently perform the work expected of an entry-level software engineer and credibly interview for the role."**

Reps is not merely:

- a LeetCode tracker;
- a flashcard app;
- a coding streak app;
- an AI tutor;
- a bootcamp clone;
- a problem database.

It is a **training system**.

Its job is to repeatedly answer:

1. What should I learn next?
2. What prerequisite am I actually missing?
3. What should I do today?
4. How much work is enough today?
5. Did I produce the skill independently?
6. What should I repair?
7. Am I actually getting closer to becoming an engineer?
8. Am I ready to interview?

The product should make those answers emotionally legible as well as technically correct.

---

# 2. Product identity

## 2.1 Brand

**Reps.**

Primary brand idea:

> **You do not become fluent by seeing something once. You become fluent through reps.**

Secondary line:

> **Build fluency through repetition.**

Longer product belief:

> The path to software engineering should not feel like guessing what to learn next. Reps teaches the building blocks, gives you enough deliberate practice to make them usable, removes the scaffolding, and keeps bringing important skills back until they are yours.

---

# 3. The emotional promise

Reps should feel like a serious coach and training environment that genuinely expects the learner to succeed if they do the work.

The user should regularly feel:

- "I know exactly what to do next."
- "This is hard, but the path makes sense."
- "I can see evidence that I am improving."
- "Today counted."
- "I am not just watching tutorials."
- "I am becoming more capable."
- "The system is adapting to what I actually know."
- "I can see the road from where I am to software engineer."

The product should explicitly connect completed work to identity and trajectory when the evidence supports it.

Examples:

> **Good work today. You completed 15 meaningful reps. This is the kind of output that moves you toward becoming a software engineer.**

> **Two weeks in, you've built program-state control and a real problem-solving process. You're on track for February 1 if this output continues.**

> **Two weeks ago pointer movement required help. Today you cleared the movement checkpoint cold. That's real progress.**

> **You finished the week: 75 qualifying problems, both builds, and every checkpoint. You're not just spending time. You're building evidence.**

This language is not decoration. It is part of the product.

---

# 4. Affirmation must remain truthful

The system must be encouraging without becoming dishonest.

Reps should celebrate:

- completed qualifying work;
- clean mastery evidence;
- independent cold solves;
- self-correction;
- consistency;
- repairing a weakness;
- a cleared prerequisite;
- movement toward the February target.

It must not say:

> "You're crushing it!"

after the learner skipped most required work.

Instead:

> **You completed 11 of 15 today and exposed a specific recursion gap. The day is not complete yet, but the problem is now clear. Four problems on Saturday can recover the week.**

Or:

> **This was a hard training day. You needed help on four reps, so tomorrow starts with a smaller repair block before we move forward.**

Encouragement should be **evidence-grounded identity reinforcement**.

---

# 5. Non-negotiable product principles

1. **Live coding is the center of Reps.**
2. **LeetCode is a capstone, not teaching material.**
3. **Confusion about prerequisites is not desirable difficulty.**
4. **A curriculum must earn the right to ask a problem.**
5. **Teach → demonstrate → guide → drill → combine → transfer → prove → retrieve.**
6. **Mastery and freshness are separate.**
7. **A failed rep is diagnostic information.**
8. **One difficult problem must not consume an entire training day because a prerequisite is missing.**
9. **Output is the accountability metric. Hours are only planning capacity.**
10. **Planned rest produces zero debt.**
11. **Assistance must not masquerade as independent mastery.**
12. **The calendar may slide. Dependency order may not.**
13. **More topics are not automatically more progress.**
14. **Mocks are readiness-gated.**
15. **Gamification rewards real production, not app engagement.**

---

# 6. Research basis

The curriculum design synthesizes principles found in:

- CS50P / CS50x;
- freeCodeCamp's current structured Python curriculum;
- The Odin Project;
- CodeYourFuture;
- 100Devs;
- HackYourFuture;
- Full Stack Open;
- Rithm School public curriculum;
- NeetCode's beginner Python, DSA, and interview roadmaps;
- Tech Interview Handbook;
- Python Tutor;
- VisuAlgo;
- worked-example / cognitive-load research;
- faded scaffolding and expertise-reversal principles;
- current Applied AI / FDE role expectations at frontier AI and software companies.

The most important adopted principles are:

### Beginner programming

A learner must explicitly build mental models for:

- execution order;
- values and variables;
- state;
- mutation;
- references;
- functions and returns;
- loops;
- errors;
- debugging;
- tests;
- decomposition.

These cannot simply be assumed because a learner has already seen syntax.

### Learning science

Early novice learning benefits from:

> explicit instruction → worked example → guided completion → fading scaffolding → independent production.

As competence rises, excess guidance becomes harmful. Reps must remove it.

### Interview preparation

Pattern practice works best after language and core DSA comfort exists.

Interview roadmaps are not complete zero-to-programmer curricula.

### Applied AI / FDE

The target profile is:

> **strong software engineer first, AI-native builder second.**

The learner should understand small AI workflows, structured model output, tool calling, validation, failures, human approval, logging, evaluation, cost/latency awareness, and customer requirement changes.

Reps should not require advanced distributed-systems material for an SWE I / junior FDE checkpoint.

---

# 7. Evidence from the current Reps system

Historical data shows that repetition works when a concept receives enough deliberate, well-scaffolded production.

The strongest example is the **Dictionary Ladder**.

The learner progressed through:

1. foundations;
2. looping;
3. building;
4. positions;
5. LeetCode.

The result was materially stronger independent performance on problems reached through the ladder than on cold problems encountered without the same prerequisite preparation.

The current mastery profile reinforces the same conclusion:

- heavily drilled dictionary / hashing primitives are strong;
- newer pointer, while-loop, state, grouping, and prefix/suffix concepts are much weaker;
- high raw pass rates can hide assistance dependence.

The central diagnosis is:

> **The problem is not a lack of authored exercise volume. It is uneven instructional sequencing before the volume.**

For example, `while_loop`, `state_tracking`, and `two_pointer` already appear many times in the corpus. Weak mastery therefore should not trigger "write 50 more similar reps." It should trigger better teaching, worked examples, guided production, and targeted gates.

---

# 8. Existing architecture: preserve vs change

## 8.1 Preserve

Keep and build on:

- Next.js + TypeScript + Tailwind;
- CodeMirror Python editor;
- Pyodide Web Worker execution;
- deterministic tests;
- worker timeout/restart;
- Supabase persistence;
- IndexedDB offline queue;
- owner-only RLS;
- current attempt history;
- mastery engine;
- freshness / retrieval concepts;
- session planner;
- repair classification;
- problem bridges;
- canonical problem references;
- concept guides;
- deterministic content verification;
- coach as optional support;
- Winston as a visual/ambient character only;
- current `reps_` database namespace.

## 8.2 Change

The largest structural changes are:

1. Add a real curriculum/course layer above the queue.
2. Replace broad old stages with the 14-week program and finer learning units.
3. Add Lessons, Worked Examples, Guided Builds, Labs, and true curriculum Gates.
4. Change the capacity ramp from `10 → 12 → 15 → 18 → 20 → 22 → 25` to:
   - Week 1: 10/day;
   - Week 2: 12/day;
   - Week 3 onward: ~15/day;
   - increase difficulty and independence instead of raw count.
5. Tighten daily credit rules.
6. Make holiday/off-day handling explicit.
7. Change the main forecast from "finish N authored reps by date" to "February readiness."
8. Add first-class Week / Unit / Readiness status.
9. Upgrade Today, Progress, Plan, and completion states visually.
10. Add evidence-grounded motivational copy throughout the product.
11. Make Week 13 genuinely unlabeled.
12. Make Week 14 mocks readiness-gated.

---

# 9. Canonical learning sequence

Every major concept or pattern should be capable of using this sequence:

> **Learn → Worked Example → Guided Build → Reps → Mini Lab → Checkpoint → Transfer → Capstone → Retrieval**

Not every unit requires every object, but this is the default instructional grammar.

## Learn

First-principles explanation:

- what;
- why;
- mental model;
- execution model;
- common failure modes;
- one small visual or video when useful.

## Worked Example

Show a complete solution organized by **subgoals**, not merely line-by-line commentary.

Example:

> Goal 1: decide when the scan ends.  
> Goal 2: inspect current values.  
> Goal 3: change only the state that can improve the answer.

## Guided Build

Examples:

- reorder lines;
- fill the next operation;
- finish a function;
- predict state;
- repair one line;
- reconstruct after seeing an example.

Guided work is training, not mastery evidence.

## Reps

Many small productions until mechanics stop consuming attention.

## Mini Lab

20–60 minute composition exercise that is not LeetCode.

Examples:

- pricing engine;
- stateful simulator;
- undo history;
- support queue;
- playlist editor;
- dependency planner;
- AI tool workflow.

## Checkpoint

Cold, no lesson panel, no solution, no named technique.

Failed checkpoint triggers repair.

## Transfer

Small unfamiliar problem where the technique is not named.

## Capstone

Interview-style or canonical LeetCode/NeetCode target.

## Retrieval

Return after spacing.

---

# 10. New course object model

Prefer static curriculum content in TypeScript. Keep user history in the existing persistence system.

Recommended domain model:

```ts
type CurriculumPhase =
  | 'foundation'
  | 'problem-solving'
  | 'core-dsa'
  | 'patterns'
  | 'transfer'
  | 'interview'

interface Course {
  id: string
  title: string
  targetDate: string
  weeks: CurriculumWeek[]
}

interface CurriculumWeek {
  id: string
  number: number
  startsOn: string
  endsOn: string
  title: string
  purpose: string
  requiredTrainingDays: string[]
  plannedOffDays: PlannedOffDay[]
  targetProblems: number
  requiredLabs: string[]
  gates: string[]
  units: string[]
}

interface LearningUnit {
  id: string
  title: string
  phase: CurriculumPhase
  prerequisites: string[]
  lessonIds: string[]
  workedExampleIds: string[]
  guidedExerciseIds: string[]
  repIds: string[]
  labIds: string[]
  gateIds: string[]
  transferIds: string[]
  capstoneIds: string[]
  retrievalSkills: string[]
}

interface Lesson {
  id: string
  title: string
  concept: string
  mentalModel: string
  whyItMatters: string
  sections: LessonSection[]
  resources?: Resource[]
}

interface WorkedExample {
  id: string
  title: string
  unitId: string
  problem: string
  subgoals: {
    title: string
    explanation: string
    code?: string
  }[]
  reconstructionExerciseId: string
}

interface Lab {
  id: string
  title: string
  unitId: string
  requirements: string[]
  designQuestions: string[]
  acceptanceTests: string[]
  changeRequests: LabChangeRequest[]
}

interface MasteryGate {
  id: string
  title: string
  prerequisiteFor: string[]
  exerciseIds: string[]
  cleanRequired: boolean
  repairMap: GateRepairRule[]
}

interface PlannedOffDay {
  date: string
  label: string
  debt: false
}
```

Do not duplicate information already represented by `Exercise`, skills, attempts, or problem bridges.

The new course model should reference existing IDs whenever possible.

---

# 11. Placement and adaptive routing

A course must not force a learner to repeat everything simply because it exists.

For each unit, use evidence to select one of three paths.

## Strong

```text
cold checkpoint
→ pass
→ unit marked ready/maintenance
```

## Partial

```text
worked example
→ focused reps
→ checkpoint
```

## Weak or unseen

```text
lesson
→ worked example
→ guided build
→ reps
→ lab where applicable
→ checkpoint
```

A learner should only skip instruction when there is **production evidence**, not because they clicked "I know this."

---

# 12. Hard prerequisite gates

Gates become true dependency locks.

Examples:

```text
state + while
→ before pointer-heavy curriculum
```

```text
mutation + references
→ before linked-list rewiring
```

```text
recursion
→ before tree DFS
```

```text
queue
→ before BFS
```

```text
graph modeling + traversal
→ before cycle/dependency problems
```

If a gate fails:

```text
DIAGNOSE
→ 2–4 smallest repair reps
→ different equivalent checkpoint
```

Do not simply replay the exact failed checkpoint.

---

# 13. Strict credit rules

The visible daily target is literal qualifying work.

## Counts toward the daily target

- guided coding exercise successfully completed;
- drill successfully completed;
- debug exercise successfully fixed;
- combine exercise successfully completed;
- transfer successfully completed;
- cold rep successfully completed;
- explanation/test-writing exercise when explicitly authored as active production;
- independent outside interview problem;
- later successful reconstruction after a previously viewed solution.

## Does not count

- reading a lesson;
- watching a video;
- opening Reps;
- looking at a solution;
- copying a solution;
- merely attempting and failing;
- repeating the same completed rep multiple times on the same day;
- passive review;
- a lab as a whole.

## Assistance

Assistance affects **quality/mastery**, not always daily volume.

A guided learning rep may still count toward daily work.

However:

- a Gate requires the configured clean standard;
- a Cold solve requiring material assistance is assisted evidence;
- a problem whose solution was revealed cannot immediately become independent mastery;
- the learner must later reconstruct or solve an equivalent cold problem.

## Labs

Labs are binary:

```text
DONE
NOT DONE
```

They are required weekly output but are not inflated into 5, 10, or 15 problem credits.

---

# 14. Capacity model

Replace:

```ts
LOADS = [10, 12, 15, 18, 20, 22, 25]
```

with the curriculum contract:

```ts
Week 1: 10 qualifying problems / required training day
Week 2: 12
Week 3+: 15
```

After 15:

> **increase difficulty, independence, transfer, composition, and interview realism, not raw count.**

Keep hidden workload balancing if useful. A capstone may internally be "heavier" for scheduling without appearing as three visible reps.

---

# 15. Planned rest and holidays

Planned off days create **zero debt**.

Canonical exceptions:

- December 25, 2026 — Christmas Day — off;
- December 26, 2026 — Boxing Day — off;
- December 31, 2026 — New Year's Eve — off;
- January 1, 2027 — New Year's Day — off;
- January 18, 2027 — MLK Day observed — off;
- Sundays — generally off.

A planned off-day screen should say:

> **Rest day. Nothing is due. Your plan is intact.**

No streak-loss animation.

No backlog generated.

No guilt.

---

# 16. Correct 14-week workload

| Week | Dates | Focus | Required qualifying problems |
|---|---|---|---:|
| 1 | Oct 26–Nov 1 | State, while, mutation, references | 50 |
| 2 | Nov 2–8 | Problem-solving foundations | 60 |
| 3 | Nov 9–15 | Two pointers, running state, prefix/suffix | 75 |
| 4 | Nov 16–22 | Sliding window, stacks | 75 |
| 5 | Nov 23–29 | Binary search, linked lists | 75 |
| 6 | Nov 30–Dec 6 | Fast/slow, recursion | 75 |
| 7 | Dec 7–13 | Trees, BST | 75 |
| 8 | Dec 14–20 | BFS, grids, graph modeling | 75 |
| 9 | Dec 21–27 | Graph cycles, heaps | 60 |
| 10 | Dec 28–Jan 3 | Intervals | 45 |
| 11 | Jan 4–10 | Backtracking, basic DP | 75 |
| 12 | Jan 11–17 | DP consolidation, greedy, matrix, Tier-A cleanup | 75 |
| 13 | Jan 18–24 | Independent transfer | 60 |
| 14 | Jan 25–31 | Interview execution | 75* |

**Planned maximum = 950 qualifying problems.**

`*` Week 14 is readiness-adaptive. A Red path may replace mock-heavy work with more transfer and repair.

---

# 17. The 14-week curriculum

## Week 1 — Execution, State, While, Mutation, References

Purpose:

> Make program state, `while` loops, indexes, mutation, and references understandable enough that later pointer-based algorithms stand on solid ground.

Daily themes:

- Monday: state + while from first principles;
- Tuesday: controlling a loop;
- Wednesday: running state;
- Thursday: mutation + references;
- Friday: decomposition/integration + four cold gates.

Key mental models:

```text
STATE
→ CHECK
→ DO WORK
→ CHANGE STATE
→ CHECK AGAIN
```

and:

> **State is information the program remembers because something later depends on it.**

Labs:

- Savings Goal Simulator;
- Inventory Processor + change request.

Exit:

- 50 qualifying problems;
- both labs complete;
- loop-control gate;
- index-scan gate;
- running-state gate;
- mutation/reference gate.

Estimated genuinely new small reps: ~26.

---

## Week 2 — Problem-Solving Foundations

Purpose:

> Teach the missing bridge between knowing syntax and independently turning an unfamiliar prompt into code.

Permanent Solve Map:

```text
1. CONTRACT
2. EXAMPLE
3. SUBGOALS
4. STATE
5. SIMPLE SOLUTION
6. TEST
7. IMPROVE
8. IMPLEMENT
9. VERIFY
```

Daily themes:

- Monday: understand the contract;
- Tuesday: solve manually before code;
- Wednesday: learner-owned testing and edge cases;
- Thursday: brute force → repeated work → improve;
- Friday: complete independent Solve Map.

Labs:

- Pricing Engine;
- Shipping Eligibility Engine + rule change.

Exit:

- 60 qualifying problems;
- contract gate;
- decomposition gate;
- testing gate;
- Solve Map gate.

Estimated new small reps: ~25–30.

---

## Week 3 — Two Pointers, Running State, Prefix/Suffix

Purpose:

> Coordinate positions and retain only the history that future work actually needs.

Core pointer question:

> **Which pointer moves, and why is it safe to discard the region we just ruled out?**

Daily themes:

- Monday: two-pointer mental model;
- Tuesday: pointer movement reasoning;
- Wednesday: running state;
- Thursday: prefix/suffix;
- Friday: unlabeled integration.

Targets:

- Valid Palindrome;
- Best Time to Buy/Sell Stock;
- Two Sum II;
- Container With Most Water readiness-gated.

Labs:

- Trend Analyzer;
- Sorted Match Engine + quantity change request.

Gates:

- pointer mechanics;
- pointer movement;
- running state;
- prefix/suffix transfer.

Estimated new small reps: ~15–20.

---

## Week 4 — Sliding Window + Stack

Sliding-window derivation:

> **two pointers + maintained state + validity rule**

Canonical variable-window model:

```text
ENTER
→ REPAIR WHILE INVALID
→ MEASURE
```

Stack mental model:

> **The most recent unfinished item matters first.**

Daily themes:

- Monday: fixed windows;
- Tuesday: variable windows;
- Wednesday: window state;
- Thursday: Longest Substring + stack foundations;
- Friday: matching pairs + mixed transfer.

Targets:

- Longest Substring Without Repeating Characters;
- Valid Parentheses;
- Character Replacement readiness-gated.

Labs:

- Activity Window Analyzer;
- Editor Undo/Redo Engine.

Gates:

- fixed window;
- variable window;
- LIFO stack;
- mixed transfer.

Do not require Minimum Window Substring.

Estimated new small reps: ~15–20.

---

## Week 5 — Binary Search + Linked Lists

Binary-search mental model:

> **The answer, if it exists, is still inside this search region.**

Linked-list rewiring mental model:

> **Save what you still need → change the reference → advance.**

Daily themes:

- Monday: binary search as elimination;
- Tuesday: boundary variants;
- Wednesday: linked-list references/traversal;
- Thursday: rewiring and reversal;
- Friday: dummy nodes and merge.

Targets:

- Binary Search;
- Reverse Linked List;
- Merge Two Sorted Lists.

Labs:

- Searchable Product Catalog;
- Playlist Editor + move-song change request.

Gates:

- search invariant;
- traversal/reference model;
- safe rewiring;
- mixed transfer.

Fast/slow moves to Week 6.

Estimated new small reps: ~10–15.

---

## Week 6 — Fast/Slow Pointers + Recursion

Fast/slow:

> Two pointers applied to reference chains.

Recursion:

> Each call owns local work, may pause for a smaller call, and later uses the returned answer.

Key recursion model:

```text
DOWN
make smaller calls

UP
return answers
```

Daily themes:

- Monday: fast/slow;
- Tuesday: fixed pointer gap;
- Wednesday: call stack;
- Thursday: recursive returns;
- Friday: integration and gates.

Targets:

- Linked List Cycle;
- Remove Nth From End.

Labs:

- Loop Detector / Route Walker;
- Nested Structure Analyzer.

Gates:

- fast/slow;
- call-stack model;
- recursive return;
- fresh recursion.

Trees remain locked until recursion gate passes.

Estimated new small reps: ~12–18.

---

## Week 7 — Trees + BST

Tree mental model:

> **For any node, what does this function promise to return about the tree rooted there?**

BST mental model:

> **Ordering lets us discard entire subtrees.**

Daily themes:

- Monday: tree structure;
- Tuesday: subtree return contracts;
- Wednesday: comparing/transforming trees;
- Thursday: BST ordering/search/bounds;
- Friday: inorder + gates.

Targets:

- Maximum Depth;
- Same Tree;
- Invert Binary Tree;
- LCA BST if ready;
- Validate BST / Kth Smallest readiness-gated.

Labs:

- Organization Hierarchy Analyzer;
- Searchable Category Tree.

Do not require:

- max path sum;
- tree reconstruction;
- advanced tree-global-best patterns.

Estimated new small reps: ~10–15.

---

## Week 8 — Tree BFS → Grids → Graph Modeling

Dependency:

```text
Tree
→ level order
→ queue
→ BFS
→ grid cells as nodes
→ graph nodes
```

Graph-modeling questions:

```text
What is the node?
What is the edge?
Is it directed?
How are neighbors represented?
What counts as visited?
```

Daily themes:

- Monday: queue + tree BFS;
- Tuesday: grid modeling;
- Wednesday: visited + grid BFS/DFS;
- Thursday: graph representation and DFS;
- Friday: reachability + connected components.

Targets:

- Level Order Traversal;
- Number of Islands;
- Path Exists;
- Number of Provinces if gate clean.

Labs:

- Building Evacuation Map;
- Social Network Explorer.

Course Schedule moves to Week 9.

Estimated new small reps: ~12–16.

---

## Week 9 — Graph Dependencies/Cycles + Heaps

Holiday week: **60 required problems**.

Directed-cycle mental model:

```text
UNSEEN
VISITING
DONE
```

Heap mental model:

> **I do not need the entire collection sorted. I repeatedly need the next priority item.**

Top-k invariant:

> **The heap contains the best k candidates seen so far.**

Training days:

- Monday: dependency modeling;
- Tuesday: directed cycles + Course Schedule;
- Wednesday: Kahn/topological introduction + heap foundations;
- Thursday: heap/top-k;
- Friday December 25: off;
- Saturday December 26: off;
- Sunday: off.

Targets:

- Course Schedule;
- Kth Largest;
- Top K Frequent.

Required lab:

- Dependency Planner or Priority Support Queue.
- Second lab may be optional due holiday week.

Gates:

- directed cycle;
- dependency modeling;
- heap invariant;
- top-k transfer.

Do not require Dijkstra, MST, Union-Find mastery, streaming median.

Estimated new small reps: ~12–16.

---

## Week 10 — Intervals

New Year's week: **45 required problems**.

Purpose:

> Learn how sorting can convert a global relationship problem into local decisions.

Training days:

- Monday Dec 28: overlap + merge;
- Tuesday Dec 29: insert;
- Wednesday Dec 30: ordering + light interval greedy;
- Thursday Dec 31: off;
- Friday Jan 1: off;
- Saturday Jan 2: optional repair;
- Sunday: off.

Required target:

- Merge Intervals.

Lab:

- Calendar Conflict Engine.

Gates:

- overlap;
- merge/insert;
- sorting for structure;
- mixed interval transfer.

Backtracking is not squeezed into this holiday week.

---

## Week 11 — Backtracking + Basic DP

Backtracking:

```text
CHOOSE
→ EXPLORE
→ UNDO
```

DP derivation:

```text
correct recursion
→ repeated subproblem
→ memo
→ recurrence
→ bottom-up
```

Permanent DP questions:

```text
STATE
BASE
RECURRENCE
ORDER
```

Daily themes:

- Monday: reversible state;
- Tuesday: Subsets + constrained choices;
- Wednesday: memoization through repeated subproblems;
- Thursday: House Robber;
- Friday: minimum-choice DP + gates.

Targets:

- Subsets;
- Combination Sum if ready;
- Climbing Stairs;
- House Robber;
- Coin Change begin/complete as readiness supports.

Labs:

- Package Configurator;
- Minimum-Cost Plan.

Gates:

- backtracking state;
- choose/explore/undo;
- DP state + recurrence;
- DP transfer.

Estimated new/reworked reps: ~18–25.

---

## Week 12 — DP Consolidation + Greedy + Matrix + Tier-A Cleanup

This is the final major new-content week.

Daily themes:

- Monday: DP consolidation;
- Tuesday: greedy and running-state reasoning;
- Wednesday: matrix mechanics / Spiral Matrix;
- Thursday: adaptive Tier-A repair + first AI/FDE build;
- Friday: final curriculum gates and unlabeled selection.

Targets:

- Coin Change if unfinished;
- Jump Game;
- Maximum Subarray as running-state/Kadane;
- Spiral Matrix;
- Word Break / Unique Paths conditional;
- Rotate Image secondary.

AI/FDE lab:

- small tool-using Support Router or equivalent workflow;
- model proposes structured action;
- deterministic application validates and executes;
- failures, permissions, human approval, logging.

Gates:

- DP reasoning;
- greedy/running-state;
- matrix mechanics;
- Tier-A algorithm selection.

---

## Week 13 — Independent Transfer

Monday Jan 18: **MLK Day off**.

Required output: **60 problems** over Tue–Fri.

The learner sees:

- no pattern labels;
- no topic labels;
- no concept suggestions;
- no worked examples;
- no skill tags before attempt.

Daily composition approximately:

- 5 unlabeled transfer reps;
- 3 fresh full problems;
- 2 debugging/test-writing;
- 2 cold retrieval;
- 2 explanation/follow-up;
- 1 wildcard.

Across the week:

> **12 fresh full problems**, roughly 4 Easy and 8 Medium/Medium-equivalent, labels hidden.

Evidence classifications:

- COLD-INDEPENDENT;
- SELF-CORRECTED;
- ASSISTED;
- RECONSTRUCTED;
- RETRIEVAL;
- MEMORIZED-RISK.

Required build:

- FDE Customer Workflow + mid-build requirement change.

Final Week 13 states:

- GREEN;
- YELLOW;
- RED.

These determine Week 14.

---

## Week 14 — Interview Execution

Green path:

- Monday: generous-timer full problems;
- Tuesday: 45–50 minute timed singles;
- Wednesday: interviewer follow-ups + project/system explanation;
- Thursday: Mock #1 → diagnose → repair → verify;
- Friday: Mock #2 + final gates;
- Saturday: targeted repair only;
- Sunday: off.

Yellow path:

- more transfer;
- timed singles;
- one mock maximum until the first mock proves useful.

Red path:

- no mock theater;
- continue cold transfer and repair.

Interview rubric:

1. clarify;
2. reason;
3. choose structure;
4. implement;
5. test;
6. debug;
7. complexity;
8. communicate.

Final statuses:

- READY;
- READY WITH TARGETED GAPS;
- NOT YET READY.

February 1 is an **Interview Start Checkpoint**, not a claim of total mastery.

---

# 18. Priority taxonomy

## Must be interview-ready by February 1

- arrays / strings;
- hash maps / sets;
- frequency/index maps;
- two pointers;
- running state;
- prefix/suffix competence;
- sliding window competence;
- stacks;
- binary search;
- linked lists;
- recursion;
- trees;
- tree BFS;
- grid DFS/BFS;
- graph traversal;
- connected components;
- basic cycle/topological reasoning;
- heap / top-k;
- intervals;
- basic backtracking;
- complexity;
- testing;
- explanation.

## Must understand and solve canonical form

- tries;
- basic DP;
- greedy;
- matrix;
- BST variants;
- graph cycles/topological ordering.

## Stretch / after February

- Dijkstra;
- MST;
- Union-Find mastery;
- advanced graph algorithms;
- sophisticated 2D DP;
- LIS/LCS depth;
- hard sliding window;
- advanced monotonic structures;
- difficult tree-global-best patterns;
- complex tries;
- advanced heap/interval greedy;
- hard backtracking.

---

# 19. Gamification redesign

## 19.1 Objective

Gamification should make **real training progress feel visceral**.

It must not turn Reps into:

- a children's app;
- an Etsy-themed productivity dashboard;
- a casino;
- a badge farm;
- a dopamine loop rewarding meaningless clicks.

The visual references should feel closer to:

> **Strava + Duolingo energy + Linear/Vercel product restraint + a serious sports training app**

than:

> stickers, scrapbooks, gradients everywhere, badges for opening the app.

## 19.2 Core principle

> **Gamify output and mastery, not engagement.**

No points for:

- logging in;
- opening a lesson;
- watching a video;
- pressing Run repeatedly;
- maintaining the app open.

Celebrate:

- qualifying production;
- clean cold evidence;
- repaired weaknesses;
- completed training days;
- completed weeks;
- cleared checkpoints;
- fresh independent solves;
- readiness movement.

---

# 20. Flame / streak system

The user explicitly wants more flames, streaks, colors, involvement, animations, and warmth.

Implement a **Training Flame**.

## Daily Flame

A required training day has states:

```text
UNLIT
training not started

EMBER
some qualifying work completed

BURNING
meaningful progress toward target

BLAZE
daily qualifying target completed
```

The exact color/intensity can visually increase with progress.

The flame is not mastery.

It is **today's training momentum**.

## Training streak

Count consecutive **required training days completed**.

Planned off days:

> preserve the streak.

Example:

```text
🔥 8 training days in a row
```

If a planned Sunday or holiday occurs:

```text
🔥 8-day streak
Rest day — streak protected
```

Do not introduce paid/freezes, streak tokens, or punishment mechanics.

## Weekly flame

A small weekly heat strip:

```text
MON 🔥
TUE 🔥
WED 🔥
THU 🔥
FRI ◌
```

Planned rest displays a distinct neutral rest icon, not an empty/failure circle.

---

# 21. Momentum, not XP farming

Avoid a traditional XP currency unless a future design proves it useful.

Prefer a derived **Momentum** indicator.

Momentum can combine:

- required days completed;
- qualifying output;
- clean cold evidence;
- labs completed;
- gates cleared.

It should communicate:

```text
MOMENTUM
Building
Strong
On fire
```

or a restrained equivalent.

Do not allow the learner to "farm" momentum by repeating trivial exercises.

---

# 22. Milestone celebrations

Use celebration at meaningful moments only.

Examples:

- first completed training day;
- first 50 qualifying problems;
- first clean cold gate;
- first Medium-equivalent independent solve;
- first week complete;
- 250 / 500 / 750 qualifying problems;
- recursion gate cleared;
- first graph target solved cold;
- Week 12 curriculum complete;
- first Week 13 cold Medium;
- first mock completed;
- READY decision.

Animation recommendations:

- progress fill;
- flame ignition;
- small spark burst;
- gate ring sweep;
- subtle number tick;
- brief confetti only for truly major milestones.

Do not fire confetti after every rep.

Support `prefers-reduced-motion`.

---

# 23. Winston

Winston remains **ambient only**.

He can:

- visibly celebrate;
- wake up when the day begins;
- react when the flame ignites;
- look energized at daily completion;
- rest on planned off days.

He should **not** become the motivational coach or speak instructional advice.

The coach voice remains Reps itself.

---

# 24. Color system

Keep the premium, clean base UI.

Add semantic color more aggressively.

Recommended semantic roles:

```text
FLAME / STREAK
warm amber → orange

LEARNING / NEW
clear cool blue

MASTERY / CLEAN PASS
confident green

REPAIR / ATTENTION
gold / amber

COLD / PROVE
high-contrast ink / electric accent

INTERVIEW
dark / focused high-contrast mode

OFF DAY
warm neutral
```

Do not make every card a different candy color.

Use color to encode state, progress, and energy.

---

# 25. Motion system

Motion should feel purposeful and polished.

Recommended:

- 150–250 ms micro-interactions;
- 300–500 ms progress transitions;
- 600–1000 ms milestone celebration;
- subtle spring when a rep checks off;
- flame grows as daily progress rises;
- gate unlock animates once;
- weekly path node transitions from locked → active → complete;
- no constant bouncing UI;
- no fast anxiety-producing movement;
- no large parallax or novelty animation during coding.

---

# 26. Affirmation engine

Create a deterministic copy system, not an LLM requirement.

Suggested file:

```text
data/motivation.ts
```

It should select messages from **objective evidence**.

## Event types

```ts
type MotivationEvent =
  | 'day-start'
  | 'rep-clean'
  | 'repair-success'
  | 'day-halfway'
  | 'day-complete'
  | 'week-progress'
  | 'week-complete'
  | 'gate-cleared'
  | 'streak-increment'
  | 'milestone'
  | 'planned-rest'
  | 'recovery-needed'
  | 'transfer-breakthrough'
  | 'mock-complete'
  | 'ready'
  | 'ready-with-gaps'
```

## Message inputs

Use actual metrics:

```ts
interface MotivationContext {
  repsDone?: number
  repsTarget?: number
  week?: number
  streak?: number
  gateTitle?: string
  skillImproved?: string
  coldIndependentCount?: number
  assistedCount?: number
  targetDate?: string
  weekStatus?: 'on-track' | 'recoverable' | 'off-track'
}
```

---

# 27. Affirmation copy examples

## Day start

> **Today's work is clear: 15 meaningful reps. Finish the work, and you move the plan forward.**

> **You're building software-engineering fluency one production at a time. Today's target is 15.**

## Midday

> **7 of 15 done. You're past the warm-up. Keep the quality high.**

## Daily completion

> **Good work today. You completed 15 meaningful reps. This moves the needle toward becoming a software engineer.**

> **Day complete. You did the work the plan asked for today. That's how this becomes real.**

> **15/15. Another day of evidence, not just study time.**

## Two-week trajectory

Only show if evidence supports it:

> **Two weeks in, you've built stronger control over program state and a repeatable way to approach unfamiliar problems. You're on track for February 1 if this output continues.**

## Gate

> **Checkpoint cleared: recursion. You can now move into trees because the prerequisite is producing cold.**

> **You earned the next unit. This wasn't unlocked by time spent. You proved the skill.**

## Improvement

> **Two weeks ago this skill regularly needed help. Today's clean checkpoint is real movement.**

## Repair

> **You found the weak link and repaired it. That's better than hiding it behind another solution.**

## Difficult incomplete day

> **11/15 complete. Today exposed a clear gap in pointer movement. The week is still recoverable, and Saturday can close the remaining four.**

## Planned off day

> **Rest day. Nothing is due. Your plan is intact.**

## Week complete

> **Week complete: 75 qualifying problems, both builds, every checkpoint. You're building the evidence required to become interview-ready.**

## Independent Medium

> **Cold Medium solved independently. That's one of the strongest signals Reps can record.**

## Readiness

> **The evidence says you're ready to start interviewing. You won't know every problem, and you don't need to. You can now reason, implement, test, and recover independently enough for real loops to be useful.**

---

# 28. Tone rules for motivation

Do:

- connect effort to concrete output;
- connect output to becoming an engineer;
- mention objective progress;
- use direct language;
- sound warm;
- celebrate self-correction;
- frame repair as useful training;
- occasionally remind the learner of the February checkpoint.

Do not:

- claim certainty unsupported by evidence;
- use empty "you got this" language repeatedly;
- shame missed days;
- pretend all passes are equal;
- call the learner a software engineer solely for opening Reps;
- use childish badge language;
- create anxiety around streaks;
- say "falling behind" for planned rest.

---

# 29. Today page redesign

Today becomes the emotional center of Reps.

Recommended hierarchy:

## Header

```text
REPS
Road to SWE I
Feb 1 checkpoint
```

## Hero

```text
🔥 8 DAY TRAINING STREAK

TODAY
15 reps

7 / 15 complete
████████░░░░

Two Pointers + Running State

"You're past the warm-up. Eight more meaningful reps moves the plan forward."
```

## Today's path

Group the 15 into meaningful blocks:

```text
REACTIVATE
2

LEARN
3

DRILL
4

COMBINE
3

PROVE
1

RETRIEVE
2
```

Do not expose hidden internal workload units.

## Week card

```text
WEEK 3
42 / 75 problems
Trend Analyzer ✓
Sorted Match Engine —
Checkpoint 2 / 4

STATUS
ON TRACK
```

## Road-to-ready card

Show:

```text
FEB 1 READINESS
On track

Foundations         Ready
Transfer            Building
Interview execution Not tested yet
```

Do not show false precision like `73.41% ready`.

---

# 30. Daily-completion state

Daily completion deserves a distinct state, not merely a small check.

Example:

```text
🔥 DAY COMPLETE

15 / 15

Good work today.
You did enough.

This is the kind of output that moves you toward becoming a software engineer.

WEEK
47 / 75
2 checkpoints cleared

Tomorrow
Variable Sliding Windows
```

Then optional choices:

- Review a concept;
- Bonus challenge;
- Stop for today.

**Stop for today should be a valid, visible choice.**

---

# 31. Weekly-completion state

Example:

```text
WEEK 4 COMPLETE

🔥 5 training days
75 / 75 qualifying problems
✓ Activity Window Analyzer
✓ Undo / Redo Engine
✓ Fixed-window checkpoint
✓ Variable-window checkpoint
✓ Stack checkpoint
✓ Mixed-transfer checkpoint

YOU MOVED FORWARD
Sliding-window state and stack behavior are now producing cold.

ROAD TO FEB 1
ON TRACK
```

Then a warm short statement:

> **You don't need to do more tonight. The next week starts from a stronger baseline.**

---

# 32. Plan page redesign

The current plan should evolve into a **Road to Ready** map.

Show all 14 weeks as meaningful milestones:

```text
01 Foundations
02 Problem Solving
03 Pointers + State
04 Windows + Stacks
05 Search + Linked Lists
06 Recursion
07 Trees
08 Graph Modeling
09 Dependencies + Heaps
10 Intervals
11 Backtracking + DP
12 Consolidation
13 Independent Transfer
14 Interview Execution
```

Each week can show:

- locked;
- ready;
- active;
- complete;
- repair required;
- planned rest exceptions.

This should feel like progression through a training program without becoming a fantasy-game map.

---

# 33. Skills / mastery UX

Keep the underlying skill scores, but reduce emphasis on abstract percentages.

Prefer:

```text
while loops
READY

two-pointer movement
DEVELOPING
Needs one clean cold checkpoint

dictionary lookup
STRONG
Last cold evidence: 3 days ago
```

Separate:

- mastery;
- freshness.

A skill can be:

```text
MASTERED
but
STALE
```

This is more understandable than one decaying score.

---

# 34. Labs UX

Labs become first-class.

Lab screen structure:

```text
REQUIREMENTS

DESIGN
- inputs
- outputs
- state
- components
- data flow

IMPLEMENT

TESTS

CHANGE REQUEST

REVIEW
```

A lab ends with:

```text
DONE
```

not a fake "10 reps" reward.

Gamification can celebrate completion because it represents composition.

---

# 35. Worked-example UX

A Worked Example should not simply display an answer.

Use progressive subgoals:

```text
GOAL 1
Define the stopping condition.

GOAL 2
Inspect the current pair.

GOAL 3
Move only the pointer that can improve the result.
```

Then:

> **Rebuild it**

The example collapses or disappears while reconstruction happens.

---

# 36. Repair UX

A failure should feel diagnostic, not punitive.

Example:

```text
NOT READY YET

The failure came from:
Pointer movement

Before you retry:
1. Which pointer moves?
2. Why is the discarded region impossible?

REPAIR
3 short reps
```

After repair:

```text
REPAIR COMPLETE

Now prove it on a fresh checkpoint.
```

---

# 37. Readiness report

The readiness report should combine:

1. curriculum position;
2. qualifying output;
3. gate status;
4. mastery;
5. freshness;
6. cold independent transfer;
7. assistance dependence;
8. interview behaviors;
9. mock evidence.

Never reduce this to one opaque percentage.

Example:

```text
FEB 1 READINESS
ON TRACK

Programming foundations     READY
Problem decomposition       READY
Hashing                     READY
Pointers                    READY
Sliding window              DEVELOPING
Trees                       READY
Graphs                      READY
Basic DP                    DEVELOPING
Independent transfer        BUILDING
Interview execution         NOT TESTED

Evidence
7 cold-independent full problems
2 self-corrected
2 assisted
```

---

# 38. Readiness state logic

Recommended:

## ON TRACK

- current curriculum position is not materially behind;
- required weekly output is being met/recoverable;
- blocking gates are clearing;
- assistance trend is acceptable.

## AT RISK

- output shortfall is recoverable;
- one or two blocking prerequisites are weak;
- cold evidence is insufficient.

## OFF TRACK

- required output remains unfinished entering the next week;
- multiple required gates are blocked;
- assistance dependence is materially preventing independent transfer.

Use compassionate, precise copy.

---

# 39. Current architecture audit actions

## `lib/training-capacity.ts`

Change:

```ts
LOADS = [10, 12, 15, 18, 20, 22, 25]
```

to curriculum-based capacity.

The current ramp logic should not keep escalating after 15.

## `lib/today-plan.ts`

Keep:

- literal visible rep count;
- hidden workload units;
- daily headroom.

Change:

- qualifying-credit rules;
- week/day curriculum-aware composition;
- off-day handling;
- Labs and Gate requirements alongside rep target;
- Week 13 pattern-label hiding;
- Week 14 readiness modes.

## `lib/progress.ts`

Keep:

- deterministic progression;
- hard gate behavior;
- readiness primitives;
- mastery integration.

Extend:

- curriculum-unit completion;
- week status;
- lab completion;
- placement path;
- readiness evidence;
- cold-independent/self-corrected classification.

## `data/program.ts`

Replace old ten broad stages with:

- 14-week program;
- finish line;
- readiness states;
- phase definitions;
- interview-start checkpoint.

## `components/today-training.tsx`

Major visual and content upgrade:

- flame/streak;
- richer progress;
- week status;
- affirmation copy;
- warm completion state;
- readiness snapshot;
- unit context;
- more semantic color/motion.

Preserve its useful concept focus and session-launch behavior.

## `components/concept-guide.tsx`

Preserve.

Extend with:

- Lesson links;
- Worked Examples;
- reconstruction handoff;
- clearer placement-path behavior.

---

# 40. Data persistence strategy

Prefer **derivation** over new tables.

Most new state can be derived from:

- attempts;
- mastery;
- daily progress;
- study state;
- review queue;
- mock results;
- curriculum definitions.

Only add database tables if persistence cannot be represented cleanly.

Likely candidates:

```text
reps_lab_attempts
```

if labs need structured persisted design answers and completion status.

Possibly:

```text
reps_artifacts
```

for lab/system-design artifacts if a general abstraction is useful.

Avoid:

- storing derived readiness percentages;
- storing streak as mutable truth;
- storing week completion if it can be deterministically derived.

The current RLS/owner model must remain unchanged in spirit.

---

# 41. Existing-content migration audit

Every existing authored exercise should receive one migration classification:

```text
KEEP
MOVE
REWORD
RECLASSIFY
BRIDGE
RETRIEVAL
OPTIONAL
RETIRE
```

And a destination:

```text
week
unit
purpose
```

Recommended machine-readable manifest:

```ts
interface CurriculumMapping {
  exerciseId: string
  action:
    | 'keep'
    | 'move'
    | 'reword'
    | 'reclassify'
    | 'bridge'
    | 'retrieval'
    | 'optional'
    | 'retire'
  week: number
  unitId: string
  purpose:
    | 'learn'
    | 'guided'
    | 'drill'
    | 'combine'
    | 'transfer'
    | 'gate'
    | 'capstone'
    | 'retrieval'
}
```

Do not manually duplicate the full exercise content.

Reference IDs.

---

# 42. Content gap manifest

Current rough authoring estimate before the full mapping audit:

| Week | New / substantially rewritten small reps |
|---|---:|
| 1 | ~26 |
| 2 | ~25–30 |
| 3 | ~15–20 |
| 4 | ~15–20 |
| 5 | ~10–15 |
| 6 | ~12–18 |
| 7 | ~10–15 |
| 8 | ~12–16 |
| 9 | ~12–16 |
| 10 | ~8–12 |
| 11 | ~18–25 |
| 12 | ~15–20 |
| 13 | transfer bank + 12 full fresh problems |
| 14 | interview bank + follow-ups + two mock candidates |

These numbers are **estimates**.

The exact manifest must be generated after the existing 925 reps are mapped.

The migration audit should produce:

```text
Existing reps reused:
Existing reps moved:
Existing reps reworded:
Existing reps retired:
New reps required:
New lessons:
New worked examples:
New labs:
New gates:
New transfer problems:
New interview problems:
```

---

# 43. Adaptive curriculum logic

Pseudo-logic:

```ts
function routeUnit(unit, evidence) {
  if (coldGateRecentlyClean(unit, evidence)) {
    return 'maintenance'
  }

  if (partialEvidence(unit, evidence)) {
    return 'worked-example-focused'
  }

  return 'full-teaching'
}
```

For a blocked gate:

```ts
failure
→ classify smallest broken skill
→ route 2–4 repair reps
→ fresh equivalent gate
```

For a ready target problem:

```ts
prerequisites ready
→ target
→ first solve classification
→ spaced reviews
```

---

# 44. Problem readiness

Current mean-skill readiness is useful but insufficient by itself.

New problem readiness should account for:

- prerequisite skill mastery;
- prerequisite freshness;
- required gate clearance;
- relevant bridge evidence;
- recent assistance dependence.

Example result:

```text
Two Sum II
READY

Pointer mechanics       clean
Pointer movement        clean
while loop              fresh
sorted-array reasoning  clean
```

or:

```text
Container With Most Water
NOT YET

Missing:
Pointer movement checkpoint

Next:
3 repair reps
```

---

# 45. Week 13 transfer mode

Week 13 requires strict leakage controls.

Before attempt, hide:

- pattern;
- skills;
- concept;
- unit name that reveals technique;
- related videos;
- related solved problems;
- difficulty if possible.

Record:

- initial approach;
- structure chosen;
- approach change;
- independence;
- self-correction;
- assistance.

The system should distinguish memorized known-problem recall from genuine transfer where possible.

---

# 46. Interview mode

Interview mode should be a genuinely reduced environment:

- blank editor;
- timer;
- run tests;
- scratch area.

No:

- concept guide;
- hints;
- AI coding;
- pattern labels;
- prerequisite suggestions;
- solution.

Mock review happens **after** the interview.

---

# 47. Applied AI / FDE lane

This lane is parallel and application-oriented.

The target profile:

> **software engineer who can build, evaluate, integrate, validate, and deploy small AI workflows.**

Topics:

1. LLM API calls;
2. structured output;
3. tool/function calling;
4. deterministic validation;
5. simple RAG/data access;
6. workflows/agents;
7. evals;
8. logging;
9. retries/timeouts;
10. permissions/human approval;
11. cost/latency awareness;
12. customer discovery and requirement change.

The lane appears primarily through Labs and builds.

Do not create a second 14-week tree of extra homework.

---

# 48. Junior software/system design lane

Use:

> **DESIGN → BUILD → REVIEW → CHANGE REQUEST**

Level 1 — Program Design  
Deep.

Level 2 — Application Design  
Solid.

Level 3 — Production Awareness  
Basic.

Level 4 — AI System Awareness  
Basic.

Required design questions:

```text
inputs
outputs
state
functions/components
data flow
failure modes
validation
tradeoffs
```

Do not require:

- Kafka architecture;
- distributed consensus;
- sharding;
- multi-region failover;
- Kubernetes;
- advanced cache coherence;
- GPU serving architecture.

Hard guardrail:

> **If a topic cannot reasonably be expected of a strong SWE I or junior FDE candidate, it cannot become a required pre-February unit.**

---

# 49. Weekly accountability model

A normal week:

```text
75 qualifying problems
2 required labs/builds where specified
all blocking checkpoints
```

Statuses:

## ON TRACK

Target + builds + checkpoints satisfied.

## RECOVERABLE

Small shortfall can be repaired Saturday without distorting the next week.

## OFF TRACK

Meaningful required output remains unfinished entering the next week.

Do not use hours as the primary score.

Do not use app streak as the primary score.

The core question remains:

> **Did I do the work today that the plan says is sufficient to reach my February 1 goal?**

---

# 50. Weekly summary language

Example:

```text
WEEK 6 COMPLETE

75 / 75 qualifying problems
✓ Loop Detector
✓ Nested Structure Analyzer
✓ Fast/slow checkpoint
✓ Call-stack checkpoint
✓ Recursive-return checkpoint
✓ Fresh recursion checkpoint

PROGRESS
Recursion moved from Developing → Ready.

WHY THIS MATTERS
Trees now have a real prerequisite underneath them.

ROAD TO FEB 1
ON TRACK
```

---

# 51. Product Architecture Spec — action item 1

Implement the new course hierarchy **above** the current queue.

The queue remains the execution inventory.

New hierarchy:

```text
Course
→ Week
→ Unit
→ Learning sequence
→ Today prescription
→ Attempt evidence
→ Gate
→ Repair / advance
→ Retrieval
```

The queue should no longer define pedagogy by itself.

---

# 52. Repo Migration Audit — action item 2

Build a script/report that classifies all 925 existing exercises by:

- skill;
- current stage;
- current plan location;
- proposed Week;
- proposed Unit;
- purpose;
- action.

Output:

```text
planning/reps-v2-migration.json
planning/reps-v2-migration.md
```

The report must identify unmapped exercises.

No exercise is silently discarded.

---

# 53. Data Model / Schema Spec — action item 3

Implement static course definitions first.

Add DB only for information that must persist and is not already representable.

Before any migration, document:

```text
existing table
new requirement
can derive?
can store in reps_study_state?
requires dedicated table?
```

All migrations must be additive.

No destructive modification of the shared Supabase project.

---

# 54. Today / Learn / Progress UX — action item 4

Implement:

- Today Flame;
- training streak;
- daily target;
- unit context;
- richer block visualization;
- week scoreboard;
- affirmation line;
- completion celebration;
- Road-to-Ready progress;
- Labs;
- Gate state;
- Readiness report;
- planned rest UI;
- adaptive repair UI.

All should work with keyboard, reduced motion, and existing responsive layouts.

---

# 55. Credit / Mastery Rules — action item 5

Create a single module that answers:

```ts
qualifyingCredit(attempt, exercise)
masteryEvidence(attempt, exercise)
coldEvidence(attempt, exercise)
```

Do not let different pages independently invent what "counts."

Tests must cover:

- guided pass;
- hinted pass;
- solution view;
- immediate reconstruction;
- later cold reconstruction;
- repeated same-day completion;
- external LeetCode solve;
- planned rest;
- Gate clean-pass requirement.

---

# 56. Adaptive Curriculum — action item 6

Implement placement and unit routing.

Unit state should support:

```text
UNSEEN
PLACEMENT
LEARNING
PRACTICING
GATE_BLOCKED
READY
MAINTENANCE
```

Route based on evidence, not user self-report alone.

---

# 57. Content Gap Manifest — action item 7

After the migration map:

Generate the exact missing-content manifest.

Do not begin mass authoring before this report exists.

Prioritize:

1. Weeks 1–2;
2. new worked examples;
3. new gates;
4. labs;
5. Week 13 transfer bank;
6. Week 14 interview bank;
7. remaining small gaps.

---

# 58. Implementation Sequence — action item 8

Implement in safe phases.

## Phase 0 — Baseline

- create branch;
- run current full verification;
- capture current tests;
- document current data counts;
- do not change behavior.

## Phase 1 — Course model

- add 14-week static course objects;
- add planned off days;
- add unit definitions;
- adapter into current curriculum/queue;
- no major visual change yet.

Acceptance:
- existing tests still pass;
- course can be queried deterministically.

## Phase 2 — Capacity + credit

- cap daily ramp at 15;
- implement 10/12/15;
- implement planned-rest zero debt;
- implement qualifying-credit rules;
- preserve hidden workload headroom.

Acceptance:
- holiday tests;
- solution-view tests;
- same-day duplicate credit tests.

## Phase 3 — Lessons / Worked Examples / Labs / Gates

- add object types and rendering;
- connect concept guides;
- add true prerequisite locks;
- implement repair → fresh gate.

Acceptance:
- failing recursion gate prevents tree advancement;
- passing placement can skip lesson.

## Phase 4 — Gamified UI shell

- Today Flame;
- streak;
- semantic color;
- progress animations;
- week scoreboard;
- Road to Ready;
- warm daily-complete state;
- reduced-motion support.

Acceptance:
- no engagement-only rewards;
- planned off day preserves streak.

## Phase 5 — Affirmation engine

- deterministic motivation events;
- evidence-bound copy;
- daily/week/gate/readiness messages.

Acceptance:
- no "on track" when evidence says off track;
- no guilt copy on planned rest;
- incomplete-day copy remains truthful.

## Phase 6 — Progress + readiness

- week status;
- unit status;
- Labs;
- cold transfer evidence;
- Feb readiness report.

Acceptance:
- report can explain why a domain is Ready/Developing.

## Phase 7 — Existing-content migration

- map all existing reps;
- move/reclassify through references;
- preserve IDs, tests, solutions where possible;
- do not rewrite content needlessly.

## Phase 8 — Missing-content authoring

- author exact manifest;
- verify every new rep;
- add lessons/examples/labs/gates.

## Phase 9 — Transfer + interview

- Week 13 leakage controls;
- cold-independent/self-corrected classification;
- Week 14 Green/Yellow/Red behavior;
- readiness-gated mocks.

## Phase 10 — Full validation

Run:

```bash
npm run lint
npm run type-check
npm test
npm run verify:content
npm run verify:pyodide
npm run audit:curriculum
npm run test:e2e
npm run build
```

Add new curriculum-specific audits before declaring completion.

---

# 59. Validation Plan — action item 9

The implementation is not complete until these scenarios pass.

## Beginner path

A learner with no meaningful evidence can begin Week 1 without unexplained prerequisites.

## Placement

A strong existing skill can cold-check out of unnecessary beginner teaching.

## While prerequisite

Weak `while`/state cannot silently route into pointer-heavy training.

## Mutation/reference prerequisite

Linked-list rewiring requires prerequisite evidence.

## Recursion prerequisite

Trees remain locked behind recursion gate.

## Queue prerequisite

BFS does not precede queue understanding.

## Solution reveal

Viewing a solution cannot produce clean mastery.

## Reconstruction

A later successful reconstruction can count as training but remains distinct from first-time cold independence.

## Holiday

Christmas, Boxing Day, New Year's Eve, New Year's Day, MLK Day, and Sundays create zero debt.

## Streak

Planned rest does not break the training streak.

## Daily target

`15/15` means 15 qualifying productions, not 15 app interactions.

## Lab

Completing a Lab does not inflate daily problem count.

## Week 13

Pattern/skill metadata does not leak before attempt.

## Mock readiness

Mocks cannot become required solely because the calendar reached Week 14.

## Motivation

Affirmation copy accurately reflects the underlying evidence.

---

# 60. Validation Plan — action item 10: product-quality audit

Before final launch, perform a product audit answering:

### Course integrity

- Is every required concept taught before it is tested?
- Does every hard gate have a repair path?
- Does every target problem have prerequisites?
- Does the calendar ever override a failed dependency?

### UX integrity

- Does Today clearly tell the learner what enough looks like?
- Can the learner distinguish training, Gate, Lab, and optional work?
- Does completion feel rewarding?
- Are colors and motion semantic rather than decorative?
- Does the experience feel warm without looking juvenile?

### Motivation integrity

- Does Reps regularly connect work to the learner's goal?
- Are affirmations specific?
- Does the product acknowledge real progress over weeks?
- Does it avoid false reassurance?
- Does it handle bad days constructively?

### Metrics integrity

- Can daily credits be farmed?
- Can a solution-assisted pass masquerade as cold mastery?
- Can repeated same-day reps inflate output?
- Can a holiday create backlog?
- Can a large Lab fake 15 problems?

### Interview integrity

- Are fresh problems actually fresh/unlabeled?
- Does Interview Mode remove assistance?
- Are mocks readiness-gated?
- Does the final decision use multiple evidence dimensions?

---

# 61. Additional implementation guardrails

Claude Code must:

1. Inspect the current implementation before editing.
2. Reuse existing abstractions when reasonable.
3. Avoid broad rewrites.
4. Preserve existing exercise IDs wherever possible.
5. Preserve deterministic tests and Pyodide execution.
6. Preserve local/offline behavior.
7. Preserve owner RLS.
8. Never introduce a service-role client.
9. Keep the OpenAI coach optional.
10. Keep Winston visual-only.
11. Make additive migrations only.
12. Run verification after each phase.
13. Use separate commits for coherent phases.
14. Document every intentionally retired or remapped rep.
15. Treat this document as product intent, not permission to bypass repo invariants.

---

# 62. Suggested new file organization

One possible structure:

```text
data/course/
  index.ts
  weeks.ts
  units.ts
  lessons.ts
  worked-examples.ts
  labs.ts
  gates.ts
  holidays.ts
  motivation.ts

lib/course/
  placement.ts
  credit.ts
  week-status.ts
  readiness.ts
  routing.ts

planning/
  reps-v2-migration.json
  reps-v2-migration.md
  reps-v2-content-gaps.md
```

This is a suggestion, not a requirement.

Prefer the least disruptive structure after inspecting the repository.

---

# 63. Recommended UI component additions

Possible components:

```text
training-flame.tsx
training-streak.tsx
week-scoreboard.tsx
motivation-line.tsx
road-to-ready.tsx
unit-status.tsx
gate-card.tsx
lab-card.tsx
daily-celebration.tsx
week-celebration.tsx
readiness-report.tsx
planned-rest.tsx
worked-example.tsx
```

Again, consolidate if existing components can own the responsibility cleanly.

---

# 64. Accessibility and restraint

Gamification must not reduce usability.

Requirements:

- respect reduced motion;
- color is never the only status indicator;
- no flashing;
- no animation that interrupts typing;
- flame/streak information has text equivalents;
- completion celebration can be dismissed;
- no autoplay sound;
- no visual noise inside the editor.

---

# 65. Definition of done

Reps 2.0 is complete when:

1. The 14-week course exists as a first-class product model.
2. Existing relevant reps are mapped into it.
3. The 10 → 12 → 15 capacity model is enforced.
4. Holidays and planned rest create zero debt.
5. Lessons, Worked Examples, Labs, Gates, Transfer, Capstones, and Retrieval can be represented.
6. Placement can skip already-proven material.
7. Gates genuinely block unmet prerequisites.
8. Repair routes the smallest broken concept.
9. Daily qualifying-credit rules are deterministic and tested.
10. The Today experience is warmer, richer, more colorful, animated, and gamified without becoming childish.
11. A flame/streak system rewards completed required training days.
12. Motivational copy regularly connects real work to becoming a software engineer.
13. Week summaries communicate real movement.
14. Readiness is evidence-based.
15. Week 13 is unlabeled transfer.
16. Week 14 is readiness-gated interview execution.
17. Labs include junior SWE and Applied AI/FDE work.
18. Current local/offline/Supabase behavior remains safe.
19. The full verification suite passes.
20. The learner can open Reps and answer:
    - What should I do today?
    - Why am I doing it?
    - How much is enough?
    - What did I improve?
    - Am I on track to become interview-ready?

---

# 66. Claude Code execution directive

Use this document as the canonical specification.

**Do not implement the entire document in one giant uncontrolled rewrite.**

Work through the implementation phases in order.

For each phase:

1. inspect the relevant existing files;
2. state what will be preserved;
3. make the smallest coherent change;
4. add/update tests;
5. run the relevant verification;
6. commit the phase cleanly;
7. move to the next phase only when the current one is stable.

When this specification conflicts with old broad 90-day plan assumptions, this specification wins for the Reps 2.0 curriculum.

When this specification proposes a filename or implementation detail that conflicts with a cleaner existing abstraction, preserve the **behavioral requirement** and use the cleaner architecture.

Do not reduce scope by silently dropping:

- planned holidays;
- 10 → 12 → 15;
- strict qualifying credit;
- Labs;
- hard Gates;
- placement;
- Week 13 leakage controls;
- readiness-gated mocks;
- gamification;
- flame/streak;
- evidence-grounded affirmation;
- Road-to-Ready reporting.

---

# 67. Final product statement

Reps should ultimately feel like this:

> **I don't have to guess how to become a software engineer anymore.**
>
> **The system knows what I need to learn, teaches it before it tests me, gives me enough reps to make it real, catches the pieces I haven't earned yet, shows me the work that matters today, and gives me honest evidence that I am moving toward the person I want to become.**
>
> **And when I finish the work, it should feel good.**

That is Reps 2.0.
