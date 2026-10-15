> Superseded in part (Oct 15): the target/maintenance/bonus hero is replaced by *Today's training*, a fixed daily load in reps that grows week by week. See planning/plan.md §5c. The single-next-thing principle stays.

# Today: target, maintenance, bonus

An information-hierarchy refactor of the Today page. No change to the curriculum
engine, the pacing logic or the meaning of the 90-day plan.

## The problem

Today knew what to do but did not answer, at a glance:

1. What do I do next?
2. What exactly must I finish today to stay on target?
3. How much is left?
4. When am I done?

Several surfaces overlapped (Next up, "Today, in order", the pace gauge, the day by
the clock, the LeetCode list, cold reps, weakest skills, the roadmap, the session
review). The reader had to work out which of them were required, which were upkeep
and which were optional.

Two specific traps:

- **"On pace" read as "done".** `paceStatus()` only looks at work whose baseline is
  *before* today, on purpose: today's own work never counts against you. So you can
  be "On pace" at 9 am with a full day still ahead. The UI did not say so.
- **"Done for today" could appear with re-solves still due**, because finishing the
  training session and finishing everything due are different things.

## What already exists (reused, not rebuilt)

| Need | Source |
|---|---|
| The canonical queue and each item's baseline date and real minutes | `pace.queue` (`lib/pacing.ts` `buildQueue`) |
| Today's stretch: reps passed today plus what today's pace still reaches, and today's new problems | `pace.dayFor(today)` (`lib/pace-calendar.ts`) |
| Where you stood coming into today | `pace.status` (`paceStatus`) |
| Forecast finish and its distance from the plan's last day | `pace.finish`, `pace.finishDelta` |
| Re-solves and redos due today, and which are logged | `leetcodeFor(day, solves, …)` + the solve log |
| Cold reps due | `dueReviews(reviews)`; how many a day carries: `phaseEmphasis(planDay).maintain` |
| Warm-up and "again, cold" reps before today's work | the training plan's `reactivate` block and extra `drill` block (`lib/session-planner.ts`) |
| The session (start, continue, resume) | `useTraining`, existing sessions |

Nothing here schedules anything. `lib/today-target.ts` only *reads* these and
classifies them.

## Definitions

**Target**: the work that keeps you on the plan's line. It is today's stretch of
the canonical queue, limited to items the original schedule expected by today
(`baseline <= today`):

- the plan's reps in today's stretch (ladder, mastery-check and bridge reps);
- a new LeetCode problem when the queue reaches one today.

Finishing the target is exactly what `paceStatus()` will check tomorrow: everything
with a baseline up to today is done, or (when you came in behind) today's full pace
of new work is done.

**Prep**: warm-up and "again, cold" reps the planner puts in front of the target.
They are recommended first and shown at the top of the list, but they are *not*
counted in the target's percentage and are not needed to reach it. The plan never
required them, so the UI does not pretend it does.

**Maintenance**: retrieval that is due today and is not new work:

- LeetCode re-solves and redos due today (done when each is logged);
- cold reps: up to the phase's daily number (3 / 4 / 5) of the reviews that are due.

Maintenance never blocks the target and is never called required for pace.

**Bonus**: anything beyond the target: items in today's stretch whose baseline is
after today (you are ahead), and continuing down the queue once the target is
reached.

## Derived state (`lib/today-target.ts`)

```
todayTarget(input) → {
  day:        'rest' | 'target' | 'maintenance' | 'complete'
  start:      { state, label }           // "On track", "1 working day behind", "2 working days ahead"
  target:     { repsDone, repsTotal, problemsDone, problemsTotal, percent, minutesLeft, minutesTotal }
  maintenance:{ left, minutesLeft, summary }
  items:      ChecklistItem[]            // one ordered list; each has a category and a state
  next:       the first item that is not done, by category order
  message:    one sentence on what finishing the target means, from the forecast
}
```

Daily completion:

| `day` | When | Says |
|---|---|---|
| `rest` | off day, or nothing scheduled | "Rest day." No percentage. |
| `target` | target work remains | "X of today's target remaining" |
| `maintenance` | target complete, maintenance due | "Today's target reached." + what maintenance is left. Never "done". |
| `complete` | target and maintenance complete | "Everything due today is complete." Anything else is bonus. |

## Component hierarchy

```
Today
├─ header (date, Day N of 90)
├─ ReactivateCard            (one-time, first week only; unchanged)
├─ TodayTarget               hero: title, progress, remaining, Continue, completion state
├─ TodayChecklist            TARGET (prep, plan, problem) · MAINTENANCE · BONUS; "Target remaining"
├─ PaceStrip                 Starting today · Target remaining · Forecast finish · Maintenance
├─ LeetCode list             where problems are opened and logged (the checklist links here)
└─ More (collapsed)          session review, full pace gauge, plan my day (clock), roadmap card,
                             building blocks, Road to Ready, weakest skills, cold reps, Challenge me
```

On a phone the order is the same: target → Continue → checklist → pace strip → More.

## Files

- new: `lib/today-target.ts`, `lib/today-target.test.ts`, `components/today-target.tsx`
- changed: `components/dashboard.tsx` (order, More), `components/training-card.tsx`
  (keeps only the session review), `components/pace-gauge.tsx` ("Starting today:"
  wording), `components/today-blocks.tsx` (titled "Plan my day"), `e2e/reps.spec.ts`
- unchanged: `lib/pacing.ts`, `lib/pace-calendar.ts`, `lib/session-planner.ts`,
  storage, mastery, reviews, the solve log, gates, the generator and the plan.

## Risks

- **Bin-packing wobble.** Today's stretch is re-laid as you work, so the target's
  total can move by a rep near the end of the day. Counting done-today reps into the
  total keeps the percentage from going backwards.
- **Behind.** When you come in behind, the target is today's pace, not the whole
  backlog. The message says what that does to the finish date instead of implying
  you have caught up.
- **Cold reps are a capped slice of a long due list.** "Maintenance complete" means
  today's share is done, not that the review queue is empty.
- **Prep is not required.** Someone could skip the warm-up and still reach the
  target; that is intended, and stated on the row.
