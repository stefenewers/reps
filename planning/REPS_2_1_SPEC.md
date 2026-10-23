# Reps V2.1 — upgrade specification

You are working in the `stefenewers/reps` repository.

Your task is to perform a focused V2.1 upgrade of Reps.

This is not a copywriting pass.
This is not a cosmetic pass.
This is not another architecture rewrite.

This is an engineering, product, and learning-experience pass intended to make Reps materially better at one thing:

> **Helping the learner become a software engineer through a clear, daily, evidence-based training path.**

Before changing anything, inspect the actual repository carefully.

Do not rely on summaries alone.

Audit the current V2 implementation against the requirements below, then make the smallest coherent changes needed to satisfy them.

---

# 1. Product goal

Reps should function like the learner's **daily operating system for becoming a software engineer**.

The experience should feel like:

> Open Reps
> See exactly what matters today
> Understand why it matters
> Learn it properly
> Practice it
> Build with it
> Prove it
> Get told when the day is complete
> Leave knowing the work moved the plan forward

The learner should not need to browse around the app to understand what success looks like for the day.

The product should feel: serious, warm, premium, interactive, motivating, engineered, trustworthy, focused.

It should not feel: text-heavy, fragmented, like a CMS, like a LeetCode tracker, like a collection of tabs, childish, gimmicky, like an Etsy productivity template, like a game that rewards clicks instead of skill.

---

# 2. Non-negotiable product principles

1. Live coding is the center of Reps.
2. LeetCode is a capstone, not teaching material.
3. The curriculum must teach prerequisites before testing them.
4. Output is the accountability metric. Hours are secondary telemetry.
5. Planned rest creates zero debt.
6. Assistance must not masquerade as independence.
7. Gates must genuinely block unmet prerequisites.
8. Failed work should trigger focused repair, not punishment.
9. The calendar may slide. Dependency order may not.
10. Mocks are readiness-gated.
11. Gamification rewards meaningful production, not app engagement.
12. The product must be truthful about progress.
13. The learner should rarely have to ask, "What am I supposed to do next?"

---

# 3. CRITICAL PRODUCT REQUIREMENT: Today becomes the daily command center

This is the highest-priority product change in this pass.

The current V2 still spreads important daily information across different surfaces. Labs can live behind Plan → Week → Unit → Lab. Lessons live in Learn. Checkpoints can be buried in unit detail. Readiness lives in Progress. LeetCode appears elsewhere. Repair logic may be hidden behind prior failures. That is too fragmented.

The learner should not need to understand Reps' information architecture in order to train correctly.

## Core requirement

The home page / Today page must become the complete daily operating system.

A learner should open Reps and immediately know:

> **"This is everything I need to do today, in this order, to successfully complete today's training."**

If something is required today, it must appear on Today. Other pages may provide exploration, history, or deeper context. They must not be the only place required work can be discovered.

---

# 4. Today page must answer these questions immediately

Without opening another page, the learner should know:

1. What am I learning today?
2. Why am I learning it?
3. What exactly must I complete?
4. What order should I do it in?
5. Is there a lesson?
6. Is there an interactive demonstration?
7. Is there a worked example?
8. How many qualifying reps are required?
9. Is there a lab?
10. Is there a checkpoint?
11. Is there a target problem?
12. Is there repair work?
13. Is there retrieval work?
14. How far through the day am I?
15. What remains?
16. When am I officially done?
17. Can I stop guilt-free once everything is complete?

If any answer requires hunting through Plan, Learn, Progress, Skills, or nested details, the home page has failed.

---

# 5. Build an explicit daily execution stack

Today should render the day's curriculum as an ordered execution stack. Example:

```text
TODAY
Two Pointers + Running State

WHY THIS MATTERS
Learn how to move two indexes safely and explain why discarded values cannot contain the answer.

TODAY'S CONTRACT
7 / 15 qualifying reps
0 / 1 lab
0 / 1 checkpoint

1. LEARN            Two-pointer movement · 8 min · [Start]
2. WATCH IT MOVE    Interactive pointer visualizer · [Open]
3. REBUILD          Guided worked example · 0 / 1 · [Start]
4. DRILL            3 / 5 · [Continue]
5. COMBINE          1 / 3
6. RETRIEVE         1 / 2
7. LAB              Sorted Match Engine · Required today · [Start]
8. CHECKPOINT       Pointer movement · Locked until earlier work is complete
9. TARGET           Two Sum II · Opens after checkpoint

DONE FOR TODAY WHEN
✓ 15 qualifying reps
✓ Sorted Match Engine
✓ Pointer Movement checkpoint
```

The implementation does not have to use these exact labels, but the product must achieve this level of clarity.

---

# 6. Today should orchestrate the training session

Today should not merely display links. Where practical, it should actively guide progression:

```text
Lesson complete → "Now rebuild the example without looking." [Start rebuild]
Rebuild complete → "Good. Now make the mechanics automatic." [Start drills]
Drills complete → "You're ready to combine the pieces." [Start combine block]
Lab complete → "Now prove the prerequisite cold." [Start checkpoint]
```

Each completed step should: update state, animate completion, give concise affirmation, unlock the next meaningful step, present one obvious next action.

There should not be multiple equally prominent CTAs forcing the learner to decide which surface matters. The main CTA should always be something like: START TODAY, CONTINUE TODAY, DO REPAIR FIRST, START LAB, START CHECKPOINT, START TARGET, DAY COMPLETE.

---

# 7. Define one authoritative daily completion contract

The app must have one truthful definition of "done for today." Daily completion must account for: qualifying rep target, required lab(s), required checkpoint(s), explicitly required target problem(s), required repair when applicable.

Do not show "DAY COMPLETE 15 / 15" if a required lab or checkpoint is still unfinished.

Likewise, week completion must require: weekly qualifying output, required labs, required checkpoints, required target problems.

The daily target and curriculum path must agree. This requirement is tightly connected to the curriculum-load fix below.

---

# 8. FIX 1: curriculum-to-workload math

The current V2 maps too many existing reps into required unit paths. This creates weeks where the visible weekly target says 50 or 60, but the underlying curriculum path requires far more than that. This is unacceptable.

If Reps tells the learner that 50 problems are enough for Week 1, then the required Week 1 curriculum must actually fit inside that contract.

## Required work

Audit every week, especially Weeks 1 and 2. For every exercise currently mapped into a course unit, classify it as one of: REQUIRED PATH, OPTIONAL, REPAIR INVENTORY, RETRIEVAL, PLACEMENT, STRETCH.

Do not simply inherit entire legacy sections as required curriculum. The new 14-week course must be curated.

### Requirements

- Week 1 required path must fit 50 qualifying problems.
- Week 2 required path must fit 60.
- Normal later weeks must fit ~75.
- Holiday weeks must fit their adjusted targets.
- Labs remain separate binary weekly output.
- Gates must fit the week's designed workload.
- Optional and repair inventory may be large, but must not silently block week completion.

### Acceptance

If the learner completes the prescribed daily work and required builds/gates, Reps must truthfully mark the week complete. No hidden backlog. No "50/50 but still not actually done."

---

# 9. FIX 2: replace the remaining V1 Progress experience

The current Progress page is only partially V2. It still includes legacy concepts such as 90-day minute heatmaps, weekly time-vs-plan, old checkpoint logic, old pattern readiness, old working-day streak calculations. This creates two competing models of progress.

## New Progress hierarchy

- **Course progress**: qualifying problems completed / course target; weeks completed; current week; units ready; units blocked.
- **Weekly output**: e.g. Week 5 · 54 / 75 · 1 / 2 builds · 2 / 4 checkpoints · ON TRACK.
- **Training consistency**: completed required training days; protected rest days; training streak.
- **Mastery and freshness**: clearly separate MASTERED·FRESH, MASTERED·STALE, DEVELOPING.
- **Cold evidence**: cold independent, self-corrected, retrieval, assisted, reconstructed.
- **Labs / building**: junior SWE builds completed; AI/FDE builds completed.
- **Readiness**: foundations, DSA, transfer, software building, Applied AI/FDE, interview execution.
- **Weak skills**: only actionable weaknesses.

Time can remain as optional supporting telemetry. It must not be the visual center of Progress. If a heatmap remains, intensity should represent qualifying output or meaningful completed work, not minutes.

---

# 10. FIX 3: outside LeetCode credit semantics

The current V2 can give daily credit for a LeetCode problem marked "Needed help." That conflicts with the UI, which correctly says the problem is not finished. Fix this.

## Outside problem evidence model

Prefer explicit distinctions such as UNAIDED, HINTED, SOLUTION_VIEWED, REBUILT, COLD_RESOLVE, FAILED. At minimum, distinguish: a small hint; material solution exposure; rebuild from blank; later cold solve.

## Daily credit rule

- Unaided solve → qualifies
- Hinted but independently completed → may qualify as assisted training evidence, depending on hint severity
- Solution viewed → does not qualify yet
- Solution viewed + later rebuild from blank → reconstruction credit
- Later cold re-solve → strongest evidence

The UI and the credit logic must agree. Do not tell the learner "Not finished yet" while also awarding the full credit.

---

# 11. FIX 4: readiness evidence classification

The readiness report must describe evidence accurately. Do not label "independent + retrieval + cold independent" as "Cold independent". Track them separately. Required categories: independent, cold-independent, self-corrected, assisted, reconstructed, retrieval.

Also make sure later stronger evidence can upgrade the report (first attempt: assisted; later cold solve: independent). The report should not remain permanently anchored to the first assisted result.

## Readiness principles

No opaque single percentage; no fake precision; no stronger language than the evidence supports; explanations should say why each domain has its status.

---

# 12. FIX 5: upgrade the learning system through engineering, not more prose

This is the most important instructional-quality upgrade. Current learning content still relies too heavily on text, static code, paragraphs, reading, and hoping the learner internalizes it. That is not sufficient.

A learner should be able to **see what code does**. The learning system must become much more visual, interactive, and demonstrative.

---

# 13. Build reusable interactive algorithm demonstrations

Create a reusable architecture for interactive concept demonstrations. Do not implement each as an unrelated one-off component if a shared system is reasonable. Possible shared concepts: DemoStep, DemoState, DemoControl, CodeHighlight, StatePanel, DataStructureView, AnimationTimeline, PredictionPrompt.

## Standard controls (where appropriate)

Play, Pause, Next step, Previous step, Reset, Speed, Try another input.

## Standard visual regions

VISUAL STATE, CODE / PSEUDOCODE, CURRENT STEP, STATE VARIABLES, WHY THIS STEP HAPPENS. The learner should see state evolve.

---

# 14. Required interactive concepts

- **Two pointers**: array; left pointer; right pointer; compared values; decision; pointer movement; discarded search region. The learner should visually understand why moving one pointer is safe.
- **Sliding window**: left/right boundaries; current window; incoming value; outgoing value; window state; validity condition. Animate ENTER → INVALID → SHRINK → VALID → MEASURE.
- **Binary search**: sorted search space; lo; mid; hi; active region; eliminated region. Explicitly display the invariant: "If the answer exists, it is still inside this region."
- **Linked lists**: actual nodes and arrows. Animate SAVE → REWIRE → ADVANCE. For reversal, show prev / current / next moving step by step. This should directly teach references and mutation.
- **Recursion**: a real call-stack visualizer: current call; local variables; call pushed; waiting caller; base case; return value; stack unwinding. Use DOWN / UP framing.
- **Trees**: current node; left subtree call; right subtree call; returned values; combine step. For BFS: queue; current level; children being enqueued.
- **Graphs**: real-world items → nodes; relationships → edges → adjacency list. Then animate DFS/BFS: current node; frontier; visited; neighbors.
- **Backtracking**: the decision tree. Animate CHOOSE → EXPLORE → UNDO → TRY NEXT. Show the current path changing.
- **Dynamic programming**: do not begin with a filled table. Show recursive tree → duplicate states highlighted → memo appears → repeated call becomes lookup → bottom-up table fills. Label STATE / BASE / RECURRENCE / ORDER.
- **Heaps**: tree shape; backing array if useful; push; bubble; pop; replacement. For top-k: heap contains the best k seen so far.
- **Intervals**: horizontal timeline; sorted intervals; overlap; merge expansion; no-overlap transition.

---

# 15. Interactive teaching requirements

Aim for some combination of animation, interaction, state tracing, code highlighting, prediction, learner-controlled stepping, editable input, before/after state, visual explanation.

## Predict the next step

Where useful, insert questions such as: Which pointer moves next? What enters the queue? What will this recursive call return? Which interval merges? What value should `dp[4]` become? Then reveal the animation.

---

# 16. Worked examples must become more substantial

Weeks 3–12 currently rely too much on existing guides and ladders. Add strong worked-example experiences for at least: two-pointer movement, sliding window, binary search, linked-list rewiring, recursion, tree recursion, BFS, graph traversal, backtracking, DP.

Each should use: PROBLEM → MANUAL REASONING → SUBGOALS → VISUAL DEMO → CODE → RECONSTRUCTION. The learner should not simply read a final solution. They should understand the sequence that produced it.

---

# 17. Learning pages should feel engineered

Avoid screens that look like heading / paragraph / paragraph / code block / paragraph / next button. Use diagrams, structured cards, animation, interactive examples, state visualizations, progressive disclosure, clear visual hierarchy, movement where it teaches. The UI should communicate concepts spatially.

---

# 18. FIX 6: labs and software building must affect readiness

The target is: strong junior software engineer + AI-native builder. Add readiness dimensions such as: Programming Foundations, Problem Solving, Core DSA, Independent Transfer, Software Building, Applied AI / FDE, Interview Execution.

- Software Building evidence: required lab completion; change-request completion; design/review artifacts.
- Applied AI/FDE evidence: only the relevant AI labs. Do not make AI completion a hard blocker for a general SWE interview-ready result unless the selected target role specifically requires it. Keep the scope junior.

---

# 19. FIX 7: wire motivational events into actual product moments

Surface motivation after real events:

- Gate cleared: "Checkpoint cleared: recursion. Trees are open now because you proved the prerequisite."
- Repair success: "You found the weak link and repaired it. Now prove it on a fresh checkpoint."
- Cold breakthrough: "Cold Medium solved independently. That's one of the strongest signals Reps can record."
- Week complete: "Week complete: 75 qualifying problems, both builds, every checkpoint. You're building the evidence required to become interview-ready."
- Long-term progress (when evidence supports it): "Two weeks ago this skill needed regular help. Today you cleared it cold. That's real movement."
- Day complete: "Good work today. This moved the needle."
- Readiness improvement: "Your independent transfer evidence improved this week. You're still on track for the February checkpoint."

Do not overuse messages. They should feel earned.

---

# 20. Gamification upgrade

Keep the Training Flame (UNLIT, EMBER, BURNING, BLAZE) and make transitions visually satisfying. Training streak counts consecutive required training days completed; planned rest protects it; never punish planned holidays. Surface momentum if it improves clarity; no farmable XP.

Celebrate milestones: first training day; 50; 250; 500; 750; 950; first clean gate; first independent Medium; first completed week; first mock; READY. Use tasteful flame animation, small spark bursts, progress ring fill, subtle celebratory motion. No confetti after every rep.

---

# 21. Animation quality

Microinteraction 150–250ms; progress state 300–500ms; milestone 600–1000ms. Use easing/spring appropriately. Avoid constant bouncing, flashing, excessive parallax, animations that distract during coding. Respect `prefers-reduced-motion`.

---

# 22. Visual product quality

Improve where useful: cards, progress transitions, learning visualizations, completion state, locked/unlocked state, checkpoint state, lab state, readiness transitions, empty states, hover/focus feedback, mobile flow. Keep the aesthetic premium and restrained.

---

# 23. Winston

Winston stays ambient. He may wake up when the training day begins, react to the flame, celebrate major completion, rest on off days. He should not become the instructional voice.

---

# 24. Week 13 transfer safeguards

Before attempt, hide: pattern, skill labels, lesson links, concept hints, related solved problems. Record: initial approach, chosen structure, whether the approach changed, independence, self-correction, assistance.

---

# 25. Week 14 interview safeguards

Green: timed singles, two mocks. Yellow: more transfer, selective mock. Red: no mock theater, more independent transfer and repair. Do not let calendar alone unlock mandatory mocks.

---

# 26. Required V2.1 Progress model

```text
TODAY      What do I do?
WEEK       Am I completing the required work?
COURSE     Am I progressing through the curriculum?
READINESS  Is the evidence strong enough for interviews?
```

Each level should derive from the level below it. There should not be contradictory systems.

---

# 27. Required technical audits before implementation

Inspect: `data/course/*`, course unit mapping, weekly target math, `lib/course/credit.ts`, outside solve log, `lib/course/readiness.ts`, `lib/course/routing.ts`, `components/course/course-dashboard.tsx`, `components/course/course-today.tsx`, `components/progress-view.tsx`, `components/plan-view.tsx`, lesson components, worked examples, lab views, rep workspace, animation CSS, mobile behavior. Do not assume the current implementation matches its comments.

---

# 28. Implementation strategy

Coherent phases, not one giant rewrite.

- **Phase A — truth and curriculum math**: weekly required-path counts; daily completion contract; week completion contract; outside problem credits; readiness evidence semantics. Tests first where possible.
- **Phase B — Today command center**: objective; completion contract; ordered training stack; active item; obvious next CTA; lab/checkpoint/target visibility; completion state.
- **Phase C — interactive learning engine**: reusable demo primitives, then the high-leverage algorithm visualizers.
- **Phase D — learning content integration**: visual worked examples for Weeks 3–12.
- **Phase E — Progress V2**: remove/de-emphasize legacy V1 tracking.
- **Phase F — readiness + labs**: software-building and AI/FDE evidence.
- **Phase G — motivation / gamification wiring**: earned events in the product.
- **Phase H — QA**: full desktop/mobile/product pass.

---

# 29. Testing requirements

- Curriculum math: Week 1 required work fits 50; Week 2 fits 60; each normal week fits 75; holiday weeks fit adjusted targets.
- Daily completion: a day cannot be complete if the rep target, a required lab, a required checkpoint or an explicitly required target is incomplete.
- Week completion: the same at week level.
- Outside solve: unaided credit; hinted behaviour; solution-viewed behaviour; reconstruction; cold re-solve.
- Readiness: correct evidence classification; later stronger evidence upgrades reporting; lab evidence appears.
- Today: every required daily item is visible; no required Lab exists only behind Plan; no required Gate exists only behind unit detail; current CTA is deterministic.
- Interactive demos: state stepping is deterministic; reset works; custom input works where offered; reduced motion supported.
- Rest: planned rest creates zero debt; streak protected.
- Week 13: no technique leakage.
- Week 14: mock gating still works.

---

# 30. Product acceptance test

A new tester should be able to open Reps on any training day and, without opening another navigation item, answer: What am I learning? Why? What do I do first? What do I do after that? How many reps count today? Is there a lab? Is there a checkpoint? Is there a target problem? Is there repair work? What remains? When am I done? They should then be able to execute the required training sequence from the Today flow.

---

# 31. Learning acceptance test

For two pointers, sliding window, linked lists, recursion, BFS, graphs and DP, a learner should be able to open the teaching experience and visually answer: What is changing? Why is it changing? What state is being remembered? What does the code do next? What rule determines the next step? If the page is mostly prose + code, it has failed.

---

# 32. Final product-quality bar

A coherent system that teaches, demonstrates, drills, builds, proves, and motivates. When the learner completes the work, Reps should make it clear: **You did enough today. This moved you closer to becoming a software engineer.**

---

# 33. Deliverables

A. Audit findings. B. Implementation summary (curriculum math; Today command center; credit semantics; readiness evidence; visual/interactive learning; Progress; Labs/readiness; motivation/gamification). C. Visual learning inventory (every interactive demo implemented). D. Remaining gaps (explicit). E. Validation (`npm run lint`, `type-check`, `test`, `verify:content`, `verify:pyodide`, `audit:curriculum`, `test:e2e`, `build`). F. Final commits.

---

# 34. Final implementation instruction

When a concept is difficult because the learner cannot mentally simulate what the code is doing: **build the simulation.** When the learner cannot find today's required work: **fix the product hierarchy.** When metrics disagree: **fix the underlying model.** When a message claims progress: **make sure the evidence supports it.**

Build Reps so the learner can open it every day and trust: **If I complete what this page tells me to do, I am doing the work required to become the software engineer I want to be.**
