# Reps 2.0 UI audit

The training engine (contract, credit, routing, readiness, labs, transfer, mock gating) was finished in V2.1. The interface still looked like the old Reps: a flat top nav, a thin global progress rail, and white cards of equal weight. This audit records what the old surfaces did wrong, then what the redesign changed.

Captures come from `scripts/ui-shots/shots.spec.ts`:

```
SHOTS=before|after E2E_PORT=3240 npx playwright test -c playwright.shots.config.ts
```

The same learner states are captured at 1440px and 390px. Each capture has a full-page shot and a `-fold` shot of the first screen (JPEG, quality 72). They are saved under `planning/ui-audit/before/` and `planning/ui-audit/after/`.

| # | State | How it is reached |
|---|---|---|
| 01 | Pre-course Today | clock Oct 23 |
| 02 | Day 1 | clock Oct 26, empty |
| 03 | Partial day | Oct 26, 4 of 10 reps |
| 04 | Completed day | Oct 26, 10 of 10 |
| 05 | Planned rest | Sun Nov 1, with a week of history |
| 06 | Failed checkpoint, repair | Oct 30, a failed cold checkpoint attempt |
| 07 | Placement | Oct 27, earlier evidence on Week 2 |
| 08, 11, 12 | Mid-course Today, Road, Progress | Nov 6, nine days of history |
| 10 | Road on Day 1 | Oct 26 |
| 13 | Week 13 transfer | Jan 12 |
| 14, 15 | Week 14 red / yellow / green, Today and /interview | Jan 25 with transfer evidence |
| 16 | Interview session | mock 1, clock started |
| 20–22 | Lesson, worked example, demo | Oct 26 |
| 30–32 | Rep, cold checkpoint, lab | Oct 26 |
| 40–42 | Skills, Problems, Log | Oct 26 |

---

## Before: what belonged to old Reps

### Global shell

- **Seven top-level destinations at equal weight:** Today, Plan, Skills, Problems, Log, Progress, Interview. Today was one tab among seven. On mobile the row scrolled sideways and hid Progress and Interview.
- **A competing progress model.** A permanent rail under the header said "0%" or "3%" of "the whole program". It measured qualifying output against 950 during the course and old curriculum reps (716) before it. Next to it, Today said "Week 1 of 14", Plan said "28 of 950" and Progress said "28 qualifying problems". There were three framings of progress and none of them was explained.
- **The interview chip and sync state sat at the same weight as navigation.** Neither is something you do.
- **Kept:** the brand mark, sync semantics, and the interview chip's no-date rule.

### Today (01–08)

- **It read as a dashboard, not training.** A generic "Today's Reps" title sat above an interview-target card. Then came a panel with a four-cell stats table (Qualifying reps / Labs / Checkpoints / Targets, mostly "0 / 0"), a thin bar and a small button. The answer to "what do I do next" was a small blue button below the fold of the first panel.
- **The day's state was underrepresented.** A training day, a completed day, a repair day and a placement day all used the same white panel with different small text. The completed day changed only a tint. Rest was a beige panel.
- **Learn first was not first in practice.** Lessons appeared as three pale blue boxes below the button, at the same weight as the rep list.
- **The rep list was undifferentiated text.** "DRILL · 0/9" followed by nine plain lines, then "COMBINE · 0/1", then a grey "Done for today when" box. There was no order, no path, and no sense of "now".
- **Week, readiness, outside problems and More competed with today's work.** They were equal panels directly below it.
- **Weak emotional moments.** The day-complete state was "Day complete / 10 / 10 · You did enough." in body type. The earned-moment card was the same pale box for every event.
- **Winston stood on a line at the bottom of the page**, unconnected to anything.
- **Kept:** every rule (contract, primary action order, learn-first, repair-first, placement), the training flame, the week strip, and all copy that states facts.

### Road to Ready (10, 11)

- **Fourteen accordion rows with a number badge.** Week 1 and Week 2 were both outlined in orange as "ACTIVE". The other twelve were identical grey "LOCKED" rows.
- **Dependency was invisible.** "First clear: …" lines existed only inside an expanded week.
- **Nothing showed a journey.** It had no sense of altitude, no destination (Feb 1) and no view of what was earned.
- **The page title was "Plan".**

### Progress (12)

- **A grid of identical stat boxes** (Qualifying problems 28, Weeks complete 0, Current week 2, Units ready 1, Units blocked 0), then three more boxes, then a long readiness table, then chip groups and a two-column list of 22 builds as plain text rows.
- **Evidence by kind was shown as six "0" boxes** at the bottom of the readiness table. The story of how reps were earned was the least prominent thing on the page.
- **Nothing showed change over time.**

### Lesson, worked example, demo (20–22)

- **A lesson was one long white card of prose and code blocks.** The mental model, the core idea of the lesson, was a pale box that leaked raw `**` markdown (content/render bug, see below).
- **The demo player and the worked example were functional but visually generic.** They used the same card language as everything else.

### Rep workspace and checkpoint (30, 31)

- **The workspace sat under the full app header.** That meant two rows of chrome (nav, plus breadcrumb and mode switch) before the prompt.
- **The editor was a light canvas** almost indistinguishable from the prompt pane.
- **Cold checkpoints differed from practice mostly by missing buttons.**

### Interview (15, 16)

- **The /interview page was a long single column:** target card, mock cards, cold-solve chips, mock log form, design track and stories. The Week 14 grade appeared in one sentence of grey text.
- **The session already drained colour**, but sat in the same light room as practice.

### Mobile (all, 390px)

- **The top nav scrolled sideways**, and the program percentage and the chip competed for the right edge.
- **Today's primary action sat below** the stats table and the bar.
- **Road rows wrapped the date and focus line** into three lines of small grey text.

---

## Design problems, ranked

1. **No single answer to "what now".** The primary action was small and late.
2. **Competing progress metaphors:** the global % rail, week counts and course totals.
3. **Everything at one visual priority:** panels, cards, borders.
4. **Course states drawn identically:** training, complete, rest, repair, placement, transfer and interview.
5. **Road to Ready was an accordion,** not a journey.
6. **Progress was a stat grid,** not evidence.
7. **Navigation gave seven destinations equal weight,** with mobile as a compressed desktop.

---

## Before vs After

The after captures are in `planning/ui-audit/after/` and have the same names as the before captures.

### Shell and navigation

- **What changed:** a dark navy sidebar holds the primary destinations in order: Today, Road to Ready, Progress, Learn, Interview. A labelled "Practice library" group holds Skills, Problems and Solve log. The footer shows the streak flame, the week, the interview target and sync. On mobile, a slim top bar shows the flame and streak, and a bottom tab bar shows Today, Road, Progress, Interview and More. More opens a sheet with Learn and the library. On the rep workspace and in a mock, the sidebar collapses to a 72px icon rail and the tab bar disappears.
- **Old pattern removed:** the global "N% of the whole program" rail (`components/program-progress.tsx`) and the seven-tab top nav (`components/header.tsx`).
- **Why it is better:** there is one progress model, Today → week → Road → Feb 1, and it is visible in the sidebar footer (streak, week). Today is first and unmistakable. Secondary tools are still one click away without competing.

### Today (02–08, 13, 14)

- **What changed:** Today is a full-bleed scene whose palette is the day's state:
  - dawn for training;
  - golden for a completed day;
  - dusk with a moon for planned rest;
  - overcast amber for repair;
  - crisp violet for placement, Week 13 and Week 14.

  A large serif headline says what the day is: "Learn first, then train." / "6 to go." / "Repair first." / "Prove what you already know." / "You did enough today." / "Rest day". The unit and its purpose sit under it, and the streak, flame and days to Feb 1 sit on a glass card.
- **The training deck:** a raised panel overlaps the scene. Winston perches on its edge. It holds three tiles that answer the day's questions in order:
  1. **What comes first:** Learn first with the next lesson in serif, or Repair first, placement, the Week 14 route, or the earned summary.
  2. **The reps:** a ring of done against target, with Drill / Combine / Retrieve checks.
  3. **Today's goal:** the contract as a checklist, the bar, and "Done for today when".

  The single primary action sits large at the deck's foot.
- **Today's session:** an ordered path. Numbered steps are joined by a line, the first open step is marked Now, and each step has a check, lock or repair state. The steps are Learn (not counted) → Drill → Combine → Retrieve (counts) → Build → Checkpoint (cold) → Target.
- **Context below:** "Where today fits" holds the week card and readiness, then a dark mini Road to Ready (14 milestones and what's next), then outside problems and More.
- **Old patterns removed:** the four-cell 0/0 stats table, the plain rep list, the stack of equal panels, and the floating Winston line.
- **Why it is better:** within five seconds the learner can read what the day is, what comes first, how much remains, and when to stop. Completing a day changes the whole page: palette, headline, a full flame ring and a large "Stop for today". Rest looks restful and says nothing is owed.

### Road to Ready (10, 11)

- **What changed:** a mountain scene with a winding trail of 14 milestone nodes rising to a Feb 1 flag. The walked part of the trail is drawn in flame orange; the rest is a dotted line.
  - Nodes show complete (green check), current (orange, breathing ring), unfinished, ready, repair and locked (lock).
  - Clicking a node focuses its week in a raised panel. That panel shows unit cards (index, progress ring or lock, state, "First clear: …" with a jump to the prerequisite, and lesson, checkpoint, lab and target tags), plus a "Milestone ahead" banner that explains what unlocks the next week.
  - Below, "All fourteen weeks" lists the weeks grouped by phase, each phase with a one-line reason the order exists.
  - On mobile, the trail becomes two rows of seven nodes in the scene.
- **Old pattern removed:** fourteen accordion cards with two "ACTIVE" outlines.
- **Why it is better:** the page answers where I am, what I have earned, what is ahead, why it is locked and what unlocks it, without reading every row.

### Progress (12)

- **What changed:** a scene with "Your progress" and an overlapping deck of four tiles:
  1. Qualifying reps, with a 21-day bar chart;
  2. How you got there: a stacked evidence bar (cold-independent → retrieval → independent → self-corrected → assisted → rebuilt);
  3. Consistency: flame, streak, required days, planned rest;
  4. On the road: units ring, checkpoints, builds, repairs.

  Below the deck:
  - "What you can do: Feb 1 readiness": seven domains as four-step level ladders, each with its reason. There is no percentage anywhere.
  - "Week by week" story cards.
  - Mastery and freshness as three tinted tiles.
  - "What to repair", where each item has a route ("Fix on Today").
  - "What you have built" as a grid of build tiles.
  - Time per week, folded away.
- **Old pattern removed:** the stat-box grid and the plain build list.
- **Why it is better:** the first screen shows production, how it was produced, consistency and position. The story of becoming capable is legible, and weaknesses come with a route.

### Rep workspace and checkpoint (30, 31)

- **What changed:**
  - The workspace fills the full height beside a 72px icon rail. No app header and no ambient Winston.
  - The editor is a dark navy coding canvas with its own syntax palette. The tests and actions sit in a light strip beneath it, so results are distinct from code.
  - The prompt has a serif title, a "The task" label, and examples as INPUT / OUTPUT cards.
  - A status chip in the top bar names the conditions: Independent, Assisted · help used, Cold checkpoint, Cold · unlabeled, or Interview conditions.
  - Cold work gets a violet underline on the top bar and a strong violet checkpoint card. Submit is the accent action.
- **Old pattern removed:** the two rows of chrome above the prompt, and an editor indistinguishable from the prompt pane.
- **Why it is better:** the editor dominates, independent and assisted work look different, and a checkpoint looks like a test, not like practice with buttons missing.

### Interview (15, 16)

- **What changed:**
  - /interview is a night scene headed "The scaffolding comes off." with a Route chip. A "Your Week 14 route" deck shows Red, Yellow and Green side by side, with the policy and mock allowance for each and "You are here" on the current grade.
  - Mock cards are dark when they can be started and greyed when locked.
  - The session is a night room: a big timer, problem tabs, the problem, a dark editor with Run / Run examples / Submit, and the scratchpad. There are no training breadcrumbs, hints, pattern labels or lesson panels.
- **Old pattern removed:** a long single column where the grade was one grey sentence.
- **Why it is better:** the route is understood before entering, and the session feels like the moment the scaffolding disappears.

### Lesson, worked example, demo, lab (20–22, 32)

- **What changed:** every learning page opens with a blueprint band: breadcrumb, a kind tag, a serif title and a faint structure drawing.
  - **Lessons:** a sticky "On this page" list and an "Up next" card. The mental model is a bold blue serif card, and each part is numbered. Printed output is a dark strip under the code, "Watch out for" is a grid of warning cards, and finishing is a card of its own.
  - **Demo player:** the structure sits on a dotted stage with a step badge, beside a dark code panel with the running line lit. Each step has a caption, and changed variables flash. The controls are round buttons, a speed switch and a scrubber that respects predictions.
  - **Demo views:** pointers slide, windows and search ranges glide as one band, and active cells lift while ruled-out cells fade. Trees and graphs mark the active node with a halo and visited nodes in green. Heaps are drawn as a tree, call frames push in, and the DP table lights the newest cell.
  - **Worked examples:** a numbered path of goals that hands off to a dark "Rebuild it" panel.
  - **Labs:** Design → Build → Change → Review as one path with Done, Now and Not done states, and the disabled finish names exactly what is missing.
- **Old pattern removed:** the lesson as a single long white card of prose and code, and generic card chrome around the demo.
- **Why it is better:** the learner can see the algorithm change state, and the reasoning stays next to the picture.

### Library pages (40–42), pre-course Today (01)

- **What changed:** the shared page hero (scene, serif title) and the 1180px container. Pre-course Today shows the course-start countdown as a glass card on the scene.

---

## "Same as before" test

An old Reps user opening the new build sees:

- a dark sidebar instead of a top tab row;
- a full-width landscape with a serif headline instead of "Today's Reps";
- a raised three-tile deck with a ring instead of a stats table;
- a numbered path instead of a list;
- a mountain trail instead of accordion rows;
- an evidence deck instead of stat boxes.

No surface keeps the old composition with rearranged text. **Pass.**

## Product-clarity test (five seconds)

| State | Question | Where it is answered |
|---|---|---|
| Today | What do I do next? | Headline and the large primary action at the deck's foot |
| Training day | How much remains? | Ring (done / target), "Done for today when", step meta |
| New concept | What do I learn first? | Tile 1 "Learn first" with the lesson title in serif; step 1 "Learn" |
| Repair | What failed, what do I fix? | Headline "Repair first."; tile names the checkpoint and the count of focused reps |
| Rest | Do I owe anything? | Dusk scene, "Rest day", "Nothing is due. Your plan is intact.", "Streak protected" |
| Completed | Am I done? | Golden scene, "You did enough today.", full flame ring, "Stop for today" |
| Road | Where am I? | Orange breathing node on the trail; glass "Week N of 14" |
| Locked unit | Why is it locked? | Lock on the card, "First clear: X" with a jump to X |
| Progress | What am I getting better at? | Evidence bar, Mastery · fresh tile, week story cards |
| Readiness | Why ready or not? | Ladder plus the reason for each domain; the track with reasons |
| Week 13 | Independent, without leakage? | "Solve it on your own.", "No pattern names" tile, reps shown as "Independent practice" |
| Week 14 | Repair, transfer or mocks, and why? | Tile 1 is the interview route, coloured by grade, with the note and the mock allowance |

## Content problems found (flagged, not rewritten)

- **Literal markdown in mental models.** Several lesson mental models (for example `l-while`) contain `**…**` markdown that the old UI showed as literal asterisks. The new lesson renderer renders it, and card previews strip it. The source text is unchanged.
- **Raw backticks in lab design questions.** They now render as code. The source text is unchanged.
- **Wording flags.** `verify:content` still reports 353 reps flagged by `lib/wording.ts` for plain-English review (unchanged by this pass).

## Validation (final)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run type-check` | clean |
| `npm test` | 335 passed, 0 failed |
| `npm run verify:content` | all guardrails pass |
| `npm run verify:pyodide` | 1,214 runs across 1,169 reps and 67 primers, all identical |
| `npm run audit:migration`, `npm run audit:curriculum` | pass |
| `npm run test:e2e` (`--workers=1`) | 34 passed, 0 failed, including the new shell test |
| `npm run build` | success |

**E2E changes:**
- The whole-program rail assertions in `reps.spec.ts` now assert that no global rail exists and that Today is the current nav item.
- A new test in `course.spec.ts` covers the shell: Today first, a trail node focusing its week, the 14-week index, the rep as a focus surface, and the mobile tabs and More sheet with no horizontal overflow.

**Training-engine code:** none of the contract, credit, routing, readiness, lab, transfer, mock gating, persistence or Pyodide logic changed.

---

## Final UX pass: following the day

The redesign made Reps look new. This pass made the day followable. The captures are in `planning/ui-audit/ux/`, under the same names as `before/` and `after/`. New states:

- `04b-today-reps-met`: rep target met, lab still due;
- `09-today-week3`: a Week 3 day that is behind.

| Problem found in the browser | Change |
|---|---|
| Oct 23–25 showed the old 90-day homepage, then switched products on Oct 26 | One product: Day 1 as a labelled preview. Learning is open, nothing is startable that would count, and real dates are kept. Plan and Progress are course views at every date. The legacy homepage, pace gauge and reactivation card were removed. |
| "Start today" did not say what would happen | The button names the behaviour (Start lesson: State, Continue reps · 4 to go, Start lab: Savings Goal Simulator, Start repair · 3 reps, Stop for today) with a one-line reason. |
| 10/10 looked like done when a lab was still due | A status chip and sentence ("Rep target complete. 1 required item remains."), separate Learn / Reps / Milestones meters, and a finish line that ticks every requirement with "N of M requirements complete". |
| Learning materials sat in a list under the panel | Learning is step 1 on the path, with each item's kind and minutes; the next one is highlighted and is the primary action. |
| After a lesson the learner had to navigate back and choose | Each learning page hands off to the next; the last one starts today's reps directly. The rep-complete bar shows the day's count. |
| Demos could never be marked done, so Learn first could stick on a demo all day | Demos record completion. |
| Steps all looked the same | The current step is a raised "You are here" card, done steps fold away, and optional learning steps aside after the target. |
| A day that is behind said "Today: Two pointers" while teaching State | "Catching up: State and while loops", naming the scheduled unit and why it waits. |
| Carried work made a 15-line finish line | Carried items fold into one group. |
| Readiness analytics competed with the first lesson | Order: Today's training → path → This week → The bigger picture → optional. |
| Road said little about what to do this week | Reps / Builds / Checkpoints / Unlocks summary on the focused week; locked weeks name what they wait on. |
| Progress led with volume | Readiness first, then what moved forward, then evidence, needs work, built, telemetry. |

**Day 1 journey, verified end to end** (browser test "Day 1 as one coached journey"):

1. Today shows "Not started", the finish line "Solve 10 qualifying reps", Learn 0 / 3, and Learn as "You are here".
2. "Start lesson: State" is the action.
3. Mark complete, then "Next: Lesson · While loops".
4. Mark complete, then the worked example; step through its goals and mark complete.
5. "Start your reps" starts a session on the first rep.
6. Back on Today: Learn 3 / 3, "In progress", and the action is "Start today's reps".

**Other journeys checked** (browser tests plus captures): completed day ("Training complete.", Stop for today), rep target met with a lab due, repair, placement, planned rest, Saturday optional, Week 13, Week 14 red / yellow / green, and the interview session.
