# Reps 2.0 design system

Reps is a training programme, not a dashboard. Every screen answers, in this order:

1. what to do now;
2. why;
3. how much remains;
4. where it fits: today → this week → the Road → February 1.

This document describes the system as built. Read it before adding UI. The audit and before/after captures that led to it are in `planning/reps-v2-ui-audit.md`.

## Principles

- **The state decides the look.** A training day, a completed day, rest, repair, placement, transfer and interview each look different at a glance (scene palette, headline, deck tile). Changing only text is not a state change.
- **Three levels, never one.**
  - Primary is what matters now: the hero headline, the deck and the primary action.
  - Secondary explains today: the session path, the week, readiness.
  - Tertiary is history and optional exploration: outside problems, More, telemetry.

  Tertiary content never sits beside primary content at the same weight.
- **One progress model.** Today → week → Road to Ready → Feb 1. Lifetime or legacy counts may appear only inside the surface they belong to and are never global. Do not reintroduce a global percentage rail.
- **Truthful gamification.** The flame, the streak and celebrations respond only to qualifying production and real course events (`lib/course/events.ts`). Reading, viewing and page visits never earn anything. Rest never looks like failure.
- **No single readiness percentage.** Readiness is seven domains, each a level with a reason.
- **Fewer boxes.** Use space, scale and tone before borders. A page usually has one raised deck; everything else sits on the canvas or on a tonal tile.

## Shell and navigation (`components/shell/app-shell.tsx`)

- **Desktop, at 1024px and wider:** a 232px navy sidebar.
  - Primary: Today, Road to Ready, Progress, Learn, Interview.
  - "Practice library": Skills, Problems, Solve log.
  - Footer: the flame and streak with the week, the interview target chip (never a date) and sync state.
- **Focus surfaces** (`/rep/*`, `/interview/<mock>`) collapse the sidebar to a 72px icon rail.
- **Mobile:** a 56px top bar (brand, flame and streak) and a bottom tab bar: Today, Road, Progress, Interview, More. More opens a sheet with Learn and the library. Focus surfaces hide the tab bar.
- **No shell** on `/demo` and `/sign-in`, which have their own minimal chrome.

## Colour (`app/globals.css`, `:root`)

The foundation is a warm off-white canvas (`--canvas`), near-black ink, and a navy shell (`--shell`, `--shell-2`, `--shell-3`, `--shell-ink`, `--shell-muted`). Colour is semantic, one meaning each:

| Token | Meaning |
|---|---|
| `--accent` (cobalt) | the primary action, the current step, selection |
| `--learn` (blue) | learning: lessons, demos, worked examples (never counted) |
| `--flame`, `--flame-2` | momentum: flame, streak, today's reps, completion warmth |
| `--pass` (green) | done, cleared, ready |
| `--cold` (violet) | cold or independent evidence: checkpoints, placement, transfer |
| `--repair` (amber-brown) | repair: a weak link found, the fix to do |
| `--rest` (warm grey) | planned rest |
| greys and `--faint` | locked or unavailable, always paired with a lock glyph or text |

Never use colour alone. Every state also carries a glyph (check, lock, repair, flame) or a word. Tags (`.tag-*`) are the single-word form of these meanings.

## Typography

- **Display:** Fraunces, the serif loaded in `app/layout.tsx` as `--font-display`. Used for:
  - `.headline` (34–58px, fluid): hero headlines that state the day;
  - `.display-xl` / `.display`: page titles;
  - `.section-title` (26px): section heads;
  - `.font-display`: deck and card titles, big numbers in story cards.
- **Text:** Geist; Geist Mono for code. Numbers use `.num` (tabular).
- **Eyebrows:** `.eyebrow` / `.label` (uppercase, tracked) carry context, never the main message.

## Space, surfaces, radius

- **Container:** 1180px, with 20px gutters (32px from `sm`). Sections are separated by 48–64px.
- **`.hero`:** the full-bleed scene. Its bottom corners are rounded (28px), and `.hero-veil` keeps type legible.
- **`.deck`:** the one raised panel per page, 20px radius with a deep soft shadow. It overlaps the hero foot with a negative top margin.
- **`.tile` + `.tile-learn|repair|cold|flame|pass|plain`:** tonal sub-areas inside a deck, 16px radius, no border.
- **`.glass`:** chips that sit on a scene.
- **Cards** elsewhere are 16px radius with a hairline shadow. Do not nest cards in cards.

## Signature patterns

- **Scene (`components/scene.tsx`):** a deterministic SVG landscape (ridges, snow line, pines, sun or moon, stars). Moods:
  - `dawn`: training;
  - `golden`: day complete or ready;
  - `dusk`: rest;
  - `repair`: repair;
  - `cold`: placement, Week 13, Week 14;
  - `night`: interview.
- **PageHero (`components/page-hero.tsx`):** the scene plus a serif title for every non-Today page.
- **Today:**
  - Hero: a headline by state, the unit and its purpose, and the momentum glass card (flame, streak, days to Feb 1).
  - Deck: tile 1 "what comes first", tile 2 the reps ring, tile 3 the goal checklist, then the primary action.
  - Session path (`.steps` / `.step[data-state=done|now|todo|locked|repair]`).
  - Then "Where today fits", including the mini Road (`components/course/road-mini.tsx`).
- **Road to Ready (`components/course/road-view.tsx`):**
  - A trail of 14 nodes (`.trail-node[data-state]`) over the scene, with the walked part drawn in flame and a Feb 1 flag.
  - The selected week in the deck, as unit cards with prerequisites.
  - A phase-grouped index (`data-testid=road-map`).
  - Mobile: two rows of seven nodes.
- **Progress (`components/course/course-progress.tsx`):**
  - An evidence deck: output chart, evidence-mix bar, consistency, position.
  - Readiness ladders (`components/course/readiness-report.tsx`).
  - Week story cards, mastery and freshness tiles, repairs with routes, and a builds grid.
- **Rep workspace (`components/rep/rep-workspace.tsx`, `components/rep/focus.css`):**
  - The dark navy editor is the default `CodeEditor` tone; light is opt-in.
  - The status chip says Independent, Assisted, Cold checkpoint, Cold · unlabeled or Interview conditions.
  - Cold work wears violet.
- **Interview (`components/interview-view.tsx`, `components/mock-session.tsx`):**
  - A night scene, with the Week 14 route as three Red / Yellow / Green columns.
  - The session is a night room: timer, problem, editor, run, scratch. Nothing else.
- **Learning (`components/demos/learn-hero.tsx`, `components/demos/learning.css`):**
  - A blueprint band heads every lesson, example, lab and demo.
  - Lessons have a table of contents, the mental model as a blue serif card, and numbered parts.
  - The demo player has a stage, a dark code panel with the running line lit, captions, a scrubber, and pointers and windows that move.
  - Labs are a four-stage path.
- **Ring (`components/ring.tsx`):** progress against a target. The SVG class is `.progress-ring`, because Tailwind owns `.ring`.

## Gamification

- **Training Flame** (`components/course/training-flame.tsx`) has four states:
  - `unlit`: nothing yet;
  - `ember`: started;
  - `burning`: most of the target;
  - `blaze`: the whole day contract complete, not just the rep count.

  It flickers gently and stops under reduced motion. It appears in the hero, the sidebar footer, the mobile top bar and Progress.
- **Streak:** required training days in a row. Planned rest protects it, and the rest day says so ("Streak protected").
- **Earned moments** (`components/course/earned-moment.tsx`) have one shape per kind:

  | Kind | Shape |
  |---|---|
  | Checkpoint cleared | violet lock badge with a green check stamp, unlock glow |
  | Repaired | repair badge, stamp |
  | Day complete | igniting flame with sparks |
  | Week complete | flag badge, stamp |
  | Milestone | serif number badge |
  | New evidence | spark |
  | Getting stronger | target |
  | Ready | green check |

  Only one appears per visit, imported history never produces a backlog, and they are dismissible.

## Motion

Motion is short and purposeful, on transform and opacity only:

- ring sweep (600ms);
- trail draw (1.1s, once);
- the current node breathing (3.2s, the only ambient loop besides the flame);
- the stamp for a completed deck or earned badge (520ms);
- sheet-in (220ms);
- rise-in for moments.

Nothing animates while typing. Nothing delays an action. `prefers-reduced-motion` turns every animation and transition off (global rule in `globals.css`), and states remain fully legible without motion.

## Winston

Winston is visual only: no text, no clicks, no knowledge of scores, readiness or routing. On Today he perches on the deck's top edge, with a mood of rest, awake or celebrate that comes from today's flame. Elsewhere at most one ambient Winston walks the bottom-right corner. Do not add him to more surfaces.

## Responsive

- **390px is designed, not compressed.**
  - Heroes stack: headline, then the glass card.
  - The deck tiles stack in priority order.
  - The primary action spans the width.
  - The Road trail becomes two rows of seven.
  - Bottom tabs replace the sidebar.
- **Tap targets:** at least 40px (tab cells are 60px tall).
- **No horizontal page scroll anywhere.**

## Accessibility

- **Headings:** one `h1` per page (the hero headline), then section `h2`s and step `h3`s.
- **Labels:** the flame has a text label ("Training flame: Blaze"), rings and bars have `role=progressbar` or adjacent numbers, and trail nodes are buttons with full labels ("Week 3, Pointers + State: Locked").
- **Focus:** visible focus everywhere (`:focus-visible` outline).
- **Never colour alone:** locks, checks and words accompany every state colour.
- **Contrast:** muted text stays at least 4.5:1 on canvas and tiles. Light type sits on dark scenes only with the dusk or night veil.

## When adding UI

- Find its level (primary, secondary or tertiary) first, and put it below everything of a higher level.
- Reuse `PageHero`, `.deck`, `.tile-*`, `.tag-*`, `Ring` and the step path before inventing a container.
- If a new state matters to the learner, give it a scene mood or a tile, not just a sentence.
- Never add a global metric, XP, or a celebration for something that is not qualifying production or a real course event.

## The training day (final UX pass)

Today is a training session with a finish line. It must answer, without the learner remembering the plan:

1. What am I learning?
2. Why?
3. What first?
4. What next?
5. How much counts?
6. What else is required?
7. When can I stop?

- **One product.** Before Oct 26, Today is Day 1 as a preview (`PreviewToday` in `components/reps-provider.tsx`).
  - Learning is open; reps, labs and checkpoints are not startable.
  - Every save keeps the real date, so nothing counts early. There is no separate pre-course homepage.
  - Plan and Progress are the course views at every date.
- **Hero.** It shows the state headline ("Learn first, then train.", "6 reps to go.", "Reps done. 1 item left.", "Training complete.") and "Week N · Title · Day D". It also shows the unit being trained:
  - "Today: …" when on schedule;
  - "Catching up: …" when the order has overtaken the calendar, naming what is scheduled and why it waits.
- **Today's training deck:**
  - **Status chip.** One of: Not started, In progress, Rep target met, Training complete, Optional day, Preview. A plain sentence follows ("Rep target complete. 2 required items remain.").
  - **Three kinds of progress, never one ring.**
    - Qualifying reps: the ring, the production.
    - Learn first: lessons, demos, worked examples; not counted.
    - Required milestones: labs, checkpoints, targets.
  - **One primary action, named for the behaviour:**
    - Start lesson: X
    - Watch it move: X
    - Rebuild the example
    - Start today's reps
    - Continue reps · N to go
    - Start lab: X
    - Start checkpoint: X
    - Start repair · N reps
    - Try placement checkpoint
    - Start transfer session
    - Start timed reps
    - Start mock interview
    - Stop for today

    Never a generic "Continue" or "Start". A one-line reason sits under it. On a phone, a copy of the action sticks above the tab bar only after the deck's own button has scrolled away.
  - **Today's finish line.** Every requirement of the day contract, ticked or not, with "N of M requirements complete". Carried-over items fold into their own group. "What counts as a qualifying rep?" is one tap away (`QUALIFYING` in `course-today.tsx`).
- **Today's path.** An ordered list of steps that exist that day (Repair → Prove what you know → Learn → Drill → Combine → Retrieve → Build → Prove → Target → Finish). Week 13 calls its practice "Independent transfer".
  - The current step is a raised card marked "You are here".
  - Done steps fold to one line.
  - Future steps stay readable but quiet.
  - Optional learning steps aside once the rep target is met.
- **Progressive disclosure.** Below the path: This week (strip with optional Saturday and rest Sunday, "N of 5 required training days complete", builds, checkpoints), then The bigger picture (Road preview, readiness), then outside problems and More.
- **Completion.** The scene turns golden, the headline reads "Training complete.", and the action is "Stop for today", with "Review what you learned" as the secondary. One quiet line names the next training day; nothing invites more grinding.

## The coach hand-off

Learning steps chain. Every lesson, demo and worked example ends in a completion card (`components/course/learning-complete.tsx`). Once marked done, it names the next step from today's sequence (`useTodayLearning`, the single source):

- Lesson → Watch it move → Rebuild the example → "Start your reps".
- "Start your reps" lands on `/?go=reps`, and Today starts the day's session directly.

Demos now record completion too, so the sequence can advance. Inside a session, each rep's completion bar shows "N / 10 qualifying reps today" next to Next rep.

## Road and Progress (final)

- **Road:** the focused week opens with what it asks for: Reps (and required days), Builds, Checkpoints, and Unlocks (the next week, "as this week's checkpoints clear"). Locked weeks in the index say in plain English what they wait on ("Opens after Two pointers (Week 3) clears its checkpoint.").
- **Progress order:**
  1. Interview readiness (ladders with reasons);
  2. What moved forward this week (checkpoints cleared, builds finished, skills newly solid);
  3. The evidence (output, how it was produced, consistency, position);
  4. Week by week;
  5. What needs work;
  6. Mastery and freshness;
  7. What you have built;
  8. Telemetry, folded away.

## Winston (final)

He perches on Today's deck with one small pixel prop:

- a dumbbell while training;
- a clipboard during repair;
- "z z" on a rest day;
- nothing on a completed day, in the preview, or in interview mode.

Props never appear while he walks and are decoration only.
