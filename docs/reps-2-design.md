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
