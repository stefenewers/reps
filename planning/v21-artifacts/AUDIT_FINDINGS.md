# V2.1 audit findings (from workflow wf_5717e09e-a38)

All 9 audits finished; every finding has an adversarial verdict unless marked UNVERIFIED. The completeness critic did not run (workflow stopped for credit reasons).
Totals: 146 confirmed, 2 refuted.

## completion-contract

Day and week completion count reps only, and several places decide "complete" in different ways that can disagree. On Today, "Day complete · You did enough" shows exactly when the day is a training day (Mon–Fri, not a holiday) and credits.items[today].length ≥ dailyTarget (10/12/15). Labs, checkpoints, repairs and target problems are never checked. Once the count is met, Today also hides any required checkpoint or repair still queued, or offers it as "Bonus". Nothing assigns a lab, checkpoint or target problem to a day (no per-day schedule). Labs never enter the course queue at all. Gates enter only after a unit's whole path is passed, and only if they fit in the remaining slots. Week 2's target problems cannot be prescribed in Week 2. The week card only ever shows On track / Recoverable / Off track, from counts. The one lab/checkpoint check in weekProgress needs `today > Sunday`, and no screen ever calls it that way. So the card says "On track" on Saturday and Sunday with 0/2 builds, and Saturday says "week N is already covered". "Week N complete" exists only in Progress → Weeks so far, and the Road map uses yet another rule. The streak, the flame (blaze), the celebration and milestones all count reps only, and the Progress page shows a second, V1 streak. I also simulated a learner who does exactly what Today prescribes. That learner cannot complete Week 1: a routing deadlock in lib/course/routing.ts keeps the first unit from ever becoming ready, so no Week-1 checkpoint is ever offered. Today keeps saying "Day complete" and fills the days with Week-2 reps. Rest-day handling and zero debt for planned rest are mostly right.

**Already correct:**
- Planned rest creates zero debt in the targets: weekTarget = training days × daily rate, with holidays and Sundays excluded (data/course/calendar.ts:69-83). Week targets match the V2 table (50, 60, 75×6, 60, 45, 75, 75, 60, 75), and lib/course/course.test.ts:11 tests this.
- courseDay gives rest days and holidays target 0 and Saturday target 0, with only an optional shortfall (lib/course/week-status.ts:21-31). Missed days never raise the next day's target (lib/course/capacity.ts:37 uses the constant rate).
- trainingStreak skips rest and recovery days, and an unfinished today does not break it (week-status.ts:101-110), so planned rest protects the streak. Tests cover Christmas and New Year (week-status.test.ts:46-56). Saturday work counts toward the week's output but not the streak, which matches 'required training days'.
- The rest-day Today view is guilt-free: 'Rest day', 'Nothing is due. Your plan is intact.', 'rest day, streak protected', and no plan or CTA (course-today.tsx:130-145, motivation.ts:111-112). The week strip shows rest as ☾, not an empty failure circle (week-strip.tsx:38-39).
- One source of qualifying credits: lib/course/credit.ts dailyCredits, used through components/use-credits.ts by Today, the streak, week totals and the road map. A rep counts once per day. Revealed solutions, failures, multiple choice and lab parts do not count (credit.ts:62-67, 95-110).
- Today's count and the plan's done list agree: use-today-plan.ts:94-95 filters done items to credited keys, and CourseToday reads credits.items[today].
- The code already knows which queue items are required: gate and repair items carry required:true (use-today-plan.ts:65) and bypass the 30% checks cap in foundation weeks (today-plan.ts:120,125). Repairs come before the next gate variant (routing.ts:217-221). A contract can reuse this flag.
- weekProgress already accepts labsDone/labsRequired/gatesCleared/gatesRequired (week-status.ts:60,75-78), and use-course-day.ts:28-32 already computes the required (non-optional) labs and the live gates for the current week. The plumbing for a week contract exists.
- readiness-report.tsx:90 already combines count, required labs and cleared gates for finished weeks. It is the closest thing to the section 7 week contract and could be lifted into lib/course as the single function (adding target problems).
- Labs are binary through labProgress (lib/course/labs.ts:22-29), and lab parts never count as reps (credit.ts:64). The week's labs and checkpoints are at least visible on the Today dashboard in WeekCard (course-cards.tsx:53-86), not only behind Plan.
- 'Stop for today' is a real, visible choice once the count is met (course-today.tsx:318-327). The celebration fires once per day (course-today.tsx:76-92).
- Momentum counts met days rather than reps, so repeating trivial reps cannot farm it (week-status.ts:130-142).

**Data:**

```
EXACT RULES AS IMPLEMENTED
- "Day complete" (course-today.tsx:68): day.type==='training' && credits.items[today].length >= dailyTarget(week). Never true on Saturday (recovery), Sunday or holidays. The same count drives the copy (motivation.ts:164), the flame blaze (week-status.ts:118), the celebration (course-today.tsx:77-92) and the milestone (course-today.tsx:203).
- Week card status (week-status.ts:60-79): on-track if credits so far >= (training days before today + today only once its target is met) × rate. Recoverable if the shortfall is at most one day's rate, otherwise off-track. Labs and gates count only when today > the week's Sunday, which no screen ever passes. There is no 'complete' value.
- "Week N complete" (readiness-report.tsx:90, Progress page, finished weeks only): done >= target && every non-optional lab done && every live gate cleared. Target problems are ignored.
- Road map 'Complete' (road-map.tsx:24): every unit of the week is ready or maintenance. Counts, labs and targets are ignored.

EVERY PLACE THAT DECIDES "COMPLETE"
Day level:
1. course-today.tsx:68
2. motivation.ts:164 (todayLine)
3. week-status.ts:118 flameFor, used by use-course-day.ts:49 and week-strip.tsx:19/31-32 ("x/y, done")
4. week-status.ts:105 trainingStreak
5. week-status.ts:66 todayDone and :86 daysComplete (shown at readiness-report.tsx:100)
6. week-status.ts:132-134 momentum (computed but never rendered)
7. today-plan.ts:164 prescribe complete = repsDone >= N, which is true on rest days and covered Saturdays (N = 0)
8. progress-90.ts:38-47 via progress-view.tsx:70: the V1 "working days in a row" streak (any activity, 90-day calendar that ends 2027-01-09)
Pre-course only: today-training.tsx:132 "Training complete" and dashboard.tsx:189.
Week level:
1. week-status.ts:71-78 weekProgress.status
2. readiness-report.tsx:90 local `complete`
3. road-map.tsx:23-24 weekState
4. use-course-day.ts:34 finished-week statuses (counts only), which feed readiness.ts:148-152
5. motivation.ts:114-116 Saturday "already covered" (from week-status.ts:27)
6. course-cards.tsx:27-35 WeekCard pill and copy

PER-WEEK INVENTORY (computed from data/course with routing.unitReps for a fresh learner; columns: weekly target, required-path reps, gates with clean passes needed, required labs, target problems)
| Week | Target | Path reps | Gates (passes needed) | Required labs | Targets |
|---|---|---|---|---|---|
| W1 | 50 | 65 | 4 (8) | 2 | 0 |
| W2 | 60 | 197 | 5 (11) | 2 | 5 [217,242,1,49,128] |
| W3 | 75 | 38 | 3 (6) | 2 | 5 |
| W4 | 75 | 53 | 3 (4) | 2 | 3 |
| W5 | 75 | 46 | 2 (4) | 2 | 3 |
| W6 | 75 | 22 | 2 (4) | 2 | 2 |
| W7 | 75 | 51 | 1 (2) | 2 | 7 |
| W8 | 75 | 75 | 3 (6) | 2 | 4 |
| W9 | 60 (no recovery Saturday: Boxing Day) | 51 | 2 (4) | 1 (+1 optional) | 3 |
| W10 | 45 | 25 | 1 (2) | 1 | 4 |
| W11 | 75 | 58 | 2 (4) | 2 | 4 |
| W12 | 75 | 49 | 2 (4) | 1 | 8 |
| W13 | 60 | 48 | 0 | 1 | 0 |
| W14 | 75 | 55 | 0 | 0 | 0 |
- Lab parts in any unit path: 0, so labs never enter the course queue.
- Multiple-choice (non-crediting) reps in required paths: W2 5, W8 1, W14 7.

SCENARIO A: Week 3, exactly 15 credits Mon–Fri, labs 0/2, checkpoints 0/3
- Mon–Fri: "Day complete 15/15" with celebrate tone, flame blaze, streak 11→15, week card "on-track".
- Sat 11-14: optionalTarget 0, header "Nothing owed", 0 items, no CTA. Line: "Saturday is optional, and week 3 is already covered. Rest is part of the plan." Week card still on-track.
- Sun: on-track.
- Monday after: weekProgress with the lab/gate extras gives 'recoverable', but no screen calls it that way.
- The finished-week status fed to readiness is 'on-track'.
- 74/75 with every lab and gate done gives 'recoverable'.

SCENARIO B: prescribe() directly
- Capacity 10, 10 credited reps done, plan = [repair (required), gate (required)] → complete=true, undone items=[], optional=[repair, gate]. Today then shows "Day complete", "Tomorrow: <repair>" and "Bonus: <repair>".
- Capacity 0 (covered Saturday) → complete=true, 0 items.
- Gate at queue position 11 of a 10-rep day → not prescribed.

SCENARIO C: learner who does every prescribed item cleanly each training day (skips Saturdays, empty mastery)
| Day | Credits | Why |
|---|---|---|
| Oct 26 | 10/10 complete | |
| Oct 27 | 9/10 | o2-list-literal is multiple choice |
| Oct 28 | 10/10 | |
| Oct 29 | 9/10 | o2-set-empty is multiple choice |
| Oct 30 | 10/10 | |
- Once 40% of w1-state-while is passed, its route becomes 'focused'. d05-while-halve [trace] leaves the path but pathDone still requires it, so the unit never becomes ready.
- w1-loop-control, w1-running-state, w1-mutation-references and w1-integration stay locked. No Week-1 gate is ever queued. From Oct 27 the plan fills with Week-2 w2-hashing reps.
- Week 1 ends 48/50 'recoverable', gates 0/4, labs 0/2, 47 Week-1 path reps never offered.
- Week 2: placement on Nov 4. On Nov 5–6 Today prescribes 0 items on training days. Week 2 ends 26/60 off-track, gates 1/5.
- Week 3: only Week-2 target problems (2, 2, 1 per day), then nothing.
- Other gate-less units with lesson-level reps after the 40% mark: w2-improve (o2-comp-set-trace) and w7-bst (b230-trace-inorder).

Milestones: crossing 50 on a Saturday (for example 45 by Friday, then 5 on Saturday) is never shown. MILESTONES = [50, 250, 500, 750, 950], with no "first training day".
```

### 1. [CRITICAL] "Day complete" counts reps only; required checkpoints, repairs, labs and targets are ignored, then hidden or offered as "Bonus" — CONFIRMED (severity keep)
- Spec: §7 one authoritative daily completion contract; §29 Daily completion; principle 12
- Evidence: components/course/course-today.tsx:67-68 `const done = cd.doneToday` / `const complete = day.type === 'training' && done >= target`; :166-170 "Day complete" … `{done} / {target} · You did enough.`; :209 `{!complete && next && (` (CTA hidden); :252 `{!complete && plan.items.length > 0 && (` (stack hidden); :311 `plan.optional.find((o) => o.exerciseId)?.title` (Tomorrow); :332-334 `Bonus: {plan.optional.find((o) => o.exerciseId)!.title}`; lib/today-plan.ts:161-164 `const nextPlan = left(input.plan)` … `complete: repsDone >= N`; data/course/motivation.ts:164 `if (target && done >= target) return motivate('day-complete', c)`; components/use-course-day.ts:35 `const done = credits.items[today] ?? []`
- Detail: `done` is any qualifying credit earned today, not the prescribed items, and nothing in the rule mentions labs, gates, targets or repairs. Checked with prescribe(): capacity 10, 10 credited reps done, plan = [repair (required), gate (required)] gives complete=true, no undone items, optional=[repair, gate]. Today then shows "Day complete 10 / 10 · You did enough.", hides the list and the CTA, and shows the required repair as both "Tomorrow: X" and "Bonus: X". In the Week-3 scenario (15/day, labs 0/2, checkpoints 0/3), every day Mon–Fri shows "Day complete" in celebrate tone. This is exactly what §7 forbids ("Do not show DAY COMPLETE 15 / 15 if a required lab or checkpoint is still unfinished").
- Suggested fix: Add one pure function, for example lib/course/contract.ts `dayContract(date, {credits, queue, labs, gates, targets})`. It returns {repsDone, repsTarget, required: [{kind: 'lab'|'gate'|'repair'|'target', id, done}], complete, remaining}, with complete = reps met && every item required today done. Drive CourseToday's `complete`, todayLine, the flame blaze, the celebration, the milestone and the complete panel from it. Never move `required` items into `optional`/Bonus; keep them in the stack with their lock state.
- Verifier: I could not refute this claim, and every cited line checks out. In components/course/course-today.tsx:67-68, `done = cd.doneToday`, which comes from components/use-course-day.ts:35/54 as `(credits.items[today] ?? []).length`. So it counts any credited rep earned today, not today's prescribed items, and `complete = day.type === 'training' && done >= target` looks at nothing else. That one boolean switches to "Day complete / {done} / {target} · You did enough." (166-170). It also hides the CTA (209 `{!complete && next && (`), the learn-first panel and the item list (252), and it turns on the celebration in localStorage plus the flame. lib/today-plan.ts:164 does the same independently with `complete: repsDone >= N`. data/course/motivation.ts:164 uses the same rep-only test for the 'day-complete' celebrate line.

The routing claim is also correct. components/use-today-plan.ts:60-66 puts gate and repair queue items into `plan` with `required: true`. Once repsDone >= N, `fits()` fails because count < N is false, and `window` is empty, so nothing more is taken. The undone required gate or repair is left in `nextPlan` and becomes `lead`/`optional[0]` (today-plan.ts:161-163). Today then shows it as "Tomorrow: X" (311) and "Bonus: X" (332-334). Labs and target problems are never part of the daily test at all.

Related code that agrees: in lib/course/week-status.ts, `todayDone` (66), `daysComplete` (86) and trainingStreak also rest on credits only. This is a direct violation of §7: "Do not show 'DAY COMPLETE 15 / 15' if a required lab or checkpoint is still unfinished". It makes Today untruthful, so critical is the right severity. Corrected: The claim is correct in substance, with two small clarifications.

(1) Checkpoints are not completely hidden. The complete panel still shows a weekly count, "{cd.gatesCleared} of {cd.weekGates.length} checkpoints cleared" (course-today.tsx:300-302), but only as a minor caption under a "Day complete" headline. It is not a block on completion.

(2) Week completion is partly aware of labs and checkpoints. weekProgress (lib/course/week-status.ts:75-78) downgrades a finished week from 'on-track' to 'recoverable' when required labs or gates are missing. But this applies only after the week has ended; it does not cover target problems, and the per-day `todayDone`/`daysComplete`/streak values (66, 86) still use rep credits only.

The Week-3 "every day Mon-Fri shows Day complete" scenario holds only if the learner earns the full daily credit count each day. Under that condition it is accurate.

### 2. [CRITICAL] Labs, checkpoints and target problems are never assigned to a day; there is no per-day schedule — CONFIRMED (severity keep)
- Spec: §3 Today is the command center; §5 execution stack; §7; §29 Today (every required daily item visible)
- Evidence: lib/course/week-status.ts:10-19 CourseDay holds only {date, week, type, target, optionalTarget, holiday}; lib/course/routing.ts:178 `QueuePurpose = 'learn' | 'guided' | 'drill' | 'combine' | 'transfer' | 'gate' | 'repair' | 'capstone' | 'problem'` (no lab); routing.ts:220-221 gates only `if (s.path.every((e) => passed.has(e.id)))`; lib/today-plan.ts:120 `count < N`, :130 `!(c.kind === 'problem' && (foundation || !c.ready))`; components/use-course-day.ts:28 `LABS.filter((l) => l.week === week.number)` (used only by WeekCard); components/course/course-cards.tsx:80 gate rows are plain `<span className="text-ink">{g.gate.title}</span>`, not links
- Detail: Labs never enter the course queue: no unit section contains a lab part (computed: lab parts in unit paths = 0 for all 14 weeks), although weeks 1–13 each have 1–2 required labs. They appear only as links in the separate WeekCard, never in the Today stack and never in any completion rule. Gates reach the day only after the unit's entire path is passed, and only if they fit in the remaining N − done slots. Nothing ever says "checkpoint today". Target problems are filtered out of every foundation-week day. Week 2's five targets [217,242,1,49,128] cannot be prescribed during Week 2; in the simulation they first appear on Nov 9–11.
- Suggested fix: Add a per-day schedule derived from the week, for example `dayPlan(week, date, state)`. It assigns each required lab to a training day, places checkpoints when their unit path is due (or on a fixed day), places explicitly required targets, and marks each as required for that day. Render LAB / CHECKPOINT / TARGET rows in the Today stack with lock or unlock state, and make WeekCard rows actionable.
- Verifier: The core of the claim holds up.
- `CourseDay` (lib/course/week-status.ts:10-19) has no field for labs, checkpoints or targets, so nothing assigns them to a day.
- `QueuePurpose` (lib/course/routing.ts:178) has no lab value.
- `courseQueue` builds the path from `unit.sections` (routing.ts:74). I ran a throwaway script, since deleted, that checked every unit's sections against every `LABS` build and change-request exercise id. It found 0 hits across 23 labs (weeks 1-13, with week 9's second lab optional).
- `Unit.labIds` is only used by road-map.tsx and a content test. Routing and the Today plan never read it.
- Gates are queued only once the whole path is passed (routing.ts:220-221), except in the 'placement' state (routing.ts:212-214).
- Targets open only after a unit is ready (routing.ts:223-224). `prescribe` then removes every 'problem' when `foundation` is set (lib/today-plan.ts:130), and `phaseOfWeek` returns 'foundation' for weeks 1-2 (lib/course/capacity.ts:12). So the week-2 targets (w2-hashing) cannot be prescribed in Week 2, only from Week 3 (Nov 9) on.
- Daily completion is just `done >= target` (components/course/course-today.tsx:68). Labs and checkpoints play no part in it, which breaks §7.

Two parts of the evidence are overstated.
1. "Nothing ever says checkpoint today" / "never in the Today stack" is wrong for checkpoints. Gate variants do enter the Today stack as kind 'gate' with `required: true` (components/use-today-plan.ts:25 and :65). They are shown with the label "Checkpoint" (course-today.tsx:42 `gate: 'Checkpoint'`, styled at :288). They also appear without the path being finished when a unit is in 'placement' (routing.ts:212-214).
2. Labs are not "separate" from Today. WeekCard is rendered on the Today page itself (components/course/course-dashboard.tsx:73), showing week labs as links (course-cards.tsx:62) and week checkpoints as plain text rows (course-cards.tsx:80). Today's summary also shows "X of Y checkpoints cleared" (course-today.tsx:306). They are therefore visible on Today as weekly items, not hidden only behind Plan. The real failure is that labs and checkpoints are never scheduled into the day's ordered stack and never count toward day completion. Corrected: No per-day schedule exists. CourseDay (lib/course/week-status.ts:10-19) carries only the rep target. Labs never enter the course queue or the Today stack: QueuePurpose has no 'lab', no unit section contains a lab build or change-request exercise (0 of 23 labs), and Unit.labIds is not read by routing or by today-plan. Labs show on the Today page only as week-level rows in WeekCard (course-dashboard.tsx:73; course-cards.tsx:62). That card is on Today, but it is not a daily item and is not in the ordered stack.

Checkpoints can appear in the Today stack as 'Checkpoint' items (use-today-plan.ts:65 `required: q.purpose === 'gate'`; course-today.tsx:42). That happens only after the unit's whole path is passed (routing.ts:220-221), or in placement state, and only if the item fits within the remaining N - done slots. Otherwise they appear only as non-link week rows (course-cards.tsx:80) and the "X of Y checkpoints cleared" summary (course-today.tsx:306).

Target problems are removed on every foundation day (today-plan.ts:130 together with capacity.ts:12, weeks 1-2), so Week 2's targets cannot be prescribed until Week 3.

Day completion is `done >= target` (course-today.tsx:68), so it ignores labs, checkpoints and targets. This violates §5, §7 and §29.

### 3. [CRITICAL] Saturday says "week N is already covered" and "Nothing owed" while required builds and checkpoints are outstanding — CONFIRMED (severity lower)
- Spec: §7 week completion; §8 acceptance (no '50/50 but not done'); principle 12
- Evidence: lib/course/week-status.ts:27 `const short = Math.max(0, weekTarget(week) - weekDates(week).filter((d) => d < date).reduce((n, d) => n + (credits[d] ?? 0), 0))`; data/course/motivation.ts:116 `` `Saturday is optional, and week ${c.week ?? ''} is already covered. Rest is part of the plan.` ``; components/course/course-today.tsx:177 `(target ? `${target} reps would close the week` : 'Nothing owed')`; lib/course/capacity.ts:37 `requiredReps: day.type === 'training' ? rate : day.optionalTarget` (prescribe gets N = 0, so no items and no CTA)
- Detail: Week-3 scenario output for Sat 2026-11-14: week status on-track (75/75, labs 0/2, gates 0/3), line "Saturday is optional, and week 3 is already covered. Rest is part of the plan.", 0 items, no CTA. Saturday is the last open day of the week for the builds, and Today shows nothing to do and calls the week covered.
- Suggested fix: Derive the Saturday offer from the week contract: the count shortfall plus undone required labs, gates and targets. Say 'covered' only when weekContract.complete is true. Otherwise list the outstanding builds and checkpoints as the optional Saturday stack, keeping the no-debt wording.
- Verifier: The claim holds up. I checked every cited code path.
- lib/course/week-status.ts:26-28: on a recovery Saturday, `optionalTarget` is weekTarget minus the reps credited so far. It counts reps only, not labs or gates.
- data/course/motivation.ts:116: when `shortfall` is 0, the 'recovery-day' line is "Saturday is optional, and week N is already covered. Rest is part of the plan." It never looks at labs or gates.
- components/course/course-today.tsx:66: sets `target = day.optionalTarget`. Line 73 passes only `shortfall: day.optionalTarget` to todayLine, with no lab or gate data. Line 177 renders 'Nothing owed'.
- lib/course/capacity.ts:37: `requiredReps` = optionalTarget = 0. components/use-today-plan.ts:95 passes that to prescribe.
- lib/today-plan.ts:120: `fits` requires `count < N`. With N = 0 nothing fits, not even candidates marked `required` (gate or repair, use-today-plan.ts:65). So the plan is empty, `next` is undefined, and no CTA renders (course-today.tsx:206 `!complete && next`).
- weekProgress (week-status.ts:69-78) only downgrades for missing labs or gates once `today > dates[6]`, which is Sunday. On Saturday the status stays 'on-track' even with labs 0/2 and gates 0/3.
- The §7 week-completion contract requires weekly output plus labs, checkpoints and target problems. So "week N is already covered" and "Nothing owed" are false statements in the hero, and the learner gets no next action (principle 13).
Two things reduce the severity:
1. On the same dashboard, WeekCard (components/course/course-cards.tsx:53-88) lists each build as 'Not done' and shows 'Checkpoints 0 / 3' with its gate rows. The outstanding work is visible, just not in the hero, and not in the CTA.
2. Nothing marks the week "complete". The week-complete event is not fired, and once Sunday passes the status drops to 'recoverable'. This is not a false week-complete, and it is not the "50/50 but not done" hidden-backlog case from §8 (that case is the reverse: a count shown as done while hidden required work blocks completion).
So this is a real truthfulness and §7 failure in the Saturday hero copy and the plan, but it is better rated major than critical. Corrected: On a recovery Saturday with weekly reps met (for example week 3, 75/75) but required labs and gates outstanding:
- courseDay sets optionalTarget = 0, counting reps only (lib/course/week-status.ts:27).
- The hero shows 'Nothing owed' (components/course/course-today.tsx:177). The motivation line says "week 3 is already covered" (data/course/motivation.ts:116). Neither looks at labs or gates.
- capacity.requiredReps = 0 (lib/course/capacity.ts:37), and prescribe's `count < N` check (lib/today-plan.ts:120) then shuts out even `required` gate and repair candidates. The plan is empty and no Start or Checkpoint CTA renders (course-today.tsx:206).
- weekProgress keeps the status 'on-track' until the week has ended (week-status.ts:78 requires `ended`).
This contradicts the §7 week-completion contract and principles 12 and 13. Mitigating facts:
- WeekCard on the same page (components/course/course-cards.tsx:53-88) lists the builds as 'Not done' and shows Checkpoints 0/N.
- The week is never marked complete, and from Sunday the status becomes 'recoverable'.
That makes this a major issue: misleading Saturday hero copy and no prescription for the remaining required work. It is not a critical false week-completion.

### 4. [CRITICAL] Week status ignores labs and checkpoints on every screen; the only lab/checkpoint check can never fire — CONFIRMED (severity keep)
- Spec: §7 week completion; §29 Week completion; §26 no contradictory systems
- Evidence: lib/course/week-status.ts:69 `const ended = today > dates[6]`; :78 `if (ended && status === 'on-track' && ((extra.labsDone ?? 0) < labsRequired || (extra.gatesCleared ?? 0) < gatesRequired)) status = 'recoverable'`; components/use-course-day.ts:32 passes extras only for the current week (today ≤ its Sunday, so ended=false); :34 `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status` (Sunday as 'today', no extras); components/course/readiness-report.tsx:87 same; components/course/road-map.tsx:62 `weekProgress(w.number, today, byDate)` (no extras); lib/course/readiness.ts:148-152 consumes `lastFinishedWeek`
- Detail: No caller ever reaches `ended` with extras. The only exception is a bug path after the course ends, where Week 1 is shown. So WeekCard reads "On track" on Saturday and Sunday with 0/2 builds and 0/3 checkpoints, with copy "Week 3: 75 of 75. On track for February 1 if this output continues." The finished-week status sent to readiness is 'on-track' (computed), so a missing build never affects the track. Even if that line were reachable, it only downgrades to 'recoverable'. WeekStatus (:33) has no 'complete' value at all.
- Suggested fix: Add `weekContract(week, asOf, state)` returning {count, labs, gates, targets, complete, status}. Status must count overdue required labs and gates (for example, Saturday or Sunday with builds outstanding is not on track). Call it with the lab and gate state for finished weeks too, and add a 'complete' state.
- Verifier: The core mechanism is confirmed. In lib/course/week-status.ts, line 69 sets `const ended = today > dates[6]`, and the only lab/checkpoint check (line 78) runs only when `ended`. In components/use-course-day.ts, line 32 is the only caller that passes extras, and it does so for the current week, where today is never past that week's Sunday, so `ended` is false. Line 34 passes Sunday as `today` and gives no extras, so `ended` is false there too and labsRequired/gatesRequired default to 0. components/course/road-map.tsx:62 calls `weekProgress(w.number, today, byDate)` with no extras. components/course/readiness-report.tsx:87 calls it with Sunday and no extras. The bug path also holds: after the course ends, courseWeekOf returns COURSE_WEEKS+1 (calendar.ts:57), `WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[1]` falls back to Week 1, and today is past Week 1's Sunday, so ended=true with extras only in that wrong case. Readiness (lib/course/readiness.ts:148-152) uses `lastFinishedWeek` from statuses computed only from counts, so a missing required lab never changes the track. WeekStatus (:33) has no 'complete' value, and even a reachable line 78 only lowers the status to 'recoverable'. One overstatement: "ignores labs and checkpoints on every screen" is not quite right. readiness-report.tsx:90 computes its own completion check, `complete = p.done >= p.target && labs...every(done) && gates.every(cleared)`, and the "Week N complete" heading respects labs and checkpoints. That same card still shows `WEEK_STATUS_LABEL[p.status]` (:97), which reads "On track" next to a week that is not complete. So the screen contradicts itself (§26) rather than ignoring labs. Missing checkpoints do partly reach readiness through the separate `blocked` count of gate-blocked units (readiness.ts:147), but missing labs do not reach it at all. Corrected: The week-status calculation (`weekProgress().status`) never takes labs or checkpoints into account in practice. The check at lib/course/week-status.ts:78 needs `ended` plus extras, and no caller supplies both. The current-week call (use-course-day.ts:32) is never ended. The finished-week calls (use-course-day.ts:34, readiness-report.tsx:87) pass Sunday as today and no extras. road-map.tsx:62 passes no extras. The only exception is the post-course fallback to Week 1. As a result, WeekCard shows "On track" through Sunday with required builds and checkpoints undone, and the finished-week status given to readiness() as `lastFinishedWeek` counts problems only, so missing required labs never affect the track. Checkpoints do have a partial path into readiness through the `blocked` gate-blocked unit count. Even if line 78 could be reached, it only lowers the status to 'recoverable', and there is no 'complete' status. Correction to "every screen": readiness-report.tsx:90 has a separate completion check that does require labs and gates for its "Week N complete" heading. That same card still shows the status label from p.status (:97, "On track"), so the screen contradicts itself (§26) rather than ignoring labs and checkpoints entirely.

### 5. [CRITICAL] Following Today exactly cannot complete Week 1: focused-route deadlock in gate-less units (cross-dimension, routing.ts) — CONFIRMED (severity keep)
- Spec: §8 acceptance; §7; principles 7, 12, 13
- Evidence: lib/course/routing.ts:131 `if (path.length && path.filter((e) => passed.has(e.id)).length / path.length >= 0.4) return true`; :148 `const pathDone = full.every((e) => passed.has(e.id))`; :154 `const ready = liveGates.length ? gatesCleared : pathDone`; :157 `const path = route === 'focused' ? full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id)) : full`; :218 queue iterates `s.path`; :206-207 horizon from the frontier unit
- Detail: Simulated a learner who does every prescribed item cleanly. After 40% of w1-state-while (no gates) is passed, its route becomes 'focused' and d05-while-halve [trace] drops out of the queue, but pathDone still requires it, so the unit never becomes ready. w1-loop-control, w1-running-state, w1-mutation-references and w1-integration stay locked, and none of Week 1's 4 checkpoints is ever offered. From Oct 27 Today fills with Week-2 w2-hashing reps while still showing "Day complete" on Oct 26, 28 and 30. Week 1 ends 48/50 with gates 0/4, labs 0/2 and 47 Week-1 path reps never offered. From Nov 5 the course queue gives 0 items on training days. The same trap exists in w2-improve (o2-comp-set-trace, which blocks w2-solve-map) and w7-bst (b230-trace-inorder, which pins the frontier at week 7, so the horizon stops at week 8).
- Suggested fix: Compute pathDone from the route's path, or stop a focused route from dropping reps that readiness requires. Add a regression test that simulates 'do exactly what Today prescribes' through Weeks 1–2 and asserts every gate is reached.
- Verifier: I could not refute the core mechanism. I confirmed it by reading the code and by running a simulation.

How the deadlock happens, in lib/course/routing.ts:
- courseStatus works out `ready = liveGates.length ? gatesCleared : pathDone` (line 154). `pathDone = full.every((e) => passed.has(e.id))` (line 148) checks the FULL path.
- Once priorEvidence is true, the route becomes 'focused' (line 155). That happens when at least 40% of the path is passed (line 131).
- The focused route sets `path = full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id))` (line 157). LESSON_LEVEL = recognize/trace/recall/complete (line 66), so any unpassed lesson-level rep is removed from s.path.
- courseQueue only pushes reps from `s.path` (line 218: `for (const e of s.path) if (!passed.has(e.id)) ...`). A rep that was dropped is never queued.
- So a unit with no gate can never reach pathDone. It stays out of 'ready', and units that list it as a prerequisite stay locked (blockedBy, lines 149-152).

In course mode the Today plan is built only from course.queue (components/use-today-plan.ts:60-65, `today >= COURSE_START ? course.queue...`). Nothing else offers the dropped reps as plan work. Only the review or redo path could surface a rep, and those reps have never been passed.

Simulation: I wrote a throwaway script at scripts/_audit_skeptic_dl.ts, ran it and deleted it. It passed course-queue items in order, cleanly, with mastery set to {}.
- w1-state-while is 'full' at 0/18, then 'focused' from 10/16, then 16/16 'practicing'.
- The queue head then moves to w2-hashing (o2-list-literal).
- `c1-while-fill-change:complete` and `d05-while-halve:trace` stay unpassed in the full path.
- w1-loop-control is locked=true.

So the deadlock is real. It is also slightly wider than the claim says: c1-while-fill-change (a 'complete'-stage rep) is dropped as well, not only d05-while-halve.

The claim's other gate-less units are confirmed: data/course/units.ts has `gateIds: []` for w1-state-while (line 50), w2-improve (line 172) and w7-bst (line 371). The same trap applies to them whenever they hold an unpassed lesson-level rep after the 40% threshold. I did not re-derive the claim's downstream calendar figures (48/50, gates 0/4, labs 0/2, Nov 5 empty queue, horizon stopping at week 8). They follow plausibly from the frontier/horizon logic at lines 206-207, but I did not verify them. The core claim stands: following Today exactly blocks Week 1 and its gates are never offered.

Critical severity is justified: the product prescribes a path that can never complete, and it reports "Day complete" while course progress is stuck. Corrected: Confirmed, with one detail added. In lib/course/routing.ts, a unit with no gates becomes ready only when every rep in the FULL path is passed (line 148 `pathDone = full.every(...)`, line 154). Once 40% of the path is passed (priorEvidence, line 131), the route becomes 'focused' and line 157 removes unpassed lesson-level reps (recognize/trace/recall/complete) from s.path. courseQueue (line 218) only queues s.path, and in course mode Today uses only course.queue (components/use-today-plan.ts:60-65). The dropped reps are therefore never offered, the unit never becomes ready, and every unit that depends on it stays locked. In my simulation w1-state-while stalls at 16/16 focused with two reps never offered: c1-while-fill-change (stage 'complete') and d05-while-halve (stage 'trace'), not only d05-while-halve. w1-loop-control stays locked and the queue moves on to w2-hashing. w2-improve and w7-bst also have gateIds: [] and are exposed to the same trap. I did not re-derive the claim's downstream counts and dates (48/50, gates 0/4, labs 0/2, the Nov 5 empty queue, the week-8 horizon).

### 6. [MAJOR] No single authoritative completion function: 8 day-level and 6 week-level deciders that disagree — CONFIRMED (severity keep)
- Spec: §7 one truthful definition; §26 each level derives from the one below
- Evidence: Day: course-today.tsx:68; motivation.ts:164; week-status.ts:66,86,105,118,132-134; today-plan.ts:164 `complete: repsDone >= N`; components/progress-view.tsx:70 `streak(active, today, PLAN_DAYS)` (lib/progress-90.ts:38-47). Week: week-status.ts:71-78; readiness-report.tsx:90 `const complete = p.done >= p.target && labs.filter((x) => !x.l.optional).every((x) => x.done) && gates.every((g) => g.cleared)`; road-map.tsx:24 `if (units.length && units.every((u) => u.state === 'ready' || u.state === 'maintenance')) return 'complete'`; use-course-day.ts:34; motivation.ts:114-116; course-cards.tsx:27-35
- Detail: Concrete disagreements:
- prescribe() reports complete=true on every rest day and covered Saturday (N = 0), while CourseToday says not complete.
- The Road map marks a week 'Complete' once its gates are cleared (placement can clear them with a handful of reps), even with 0/75 problems and no labs. The WeekCard then says Off track.
- In Progress → Weeks so far, a week missing a lab is titled "Week 3 · Pointers + State" (not complete), yet its badge (readiness-report.tsx:97) says count-only "ON TRACK".
- The Progress page streak counts any activity on 90-day-plan working days ("working days in a row"; that calendar ends 2027-01-09). Today's streak counts met course training days. They will show different numbers.
- Suggested fix: Put dayContract and weekContract in lib/course as the only deciders. Rebuild WeekCard, the Road map week state, the readiness-report summaries, readiness() inputs, the streak and the flame on top of them. Remove the V1 streak from Progress or point it at trainingStreak.
- Verifier: The core claim holds: there is no single authoritative function for day or week completion, and the visible surfaces disagree, which goes against §7 and §26. The count of "8 day-level and 6 week-level deciders that disagree" is inflated, though, and one of the four listed disagreements cannot be seen in the course UI.

Checked against the code:

1. **prescribe() (not user-visible).** In lib/course/capacity.ts:37 the capacity is `requiredReps: day.type === 'training' ? rate : day.optionalTarget`. That is 0 on rest days and on a covered Saturday, so `complete: repsDone >= N` (lib/today-plan.ts:164) returns true. However, `plan.complete` is only read by components/today-training.tsx, which is mounted only by DashboardToday before the course starts (components/dashboard.tsx:52 `today >= COURSE_START ? <CourseDashboard /> : <DashboardToday />`). components/course/course-today.tsx never reads `plan.complete`. So this is a dormant second definition, not a contradiction on screen.

2. **Road map vs WeekCard (confirmed).** components/course/road-map.tsx:24 marks a week complete when every unit is `ready` or `maintenance`. In lib/course/routing.ts, `ready = liveGates.length ? gatesCleared : pathDone`, a mastery state that ignores weekly output and labs. The WeekCard uses weekProgress status, which is output only. The road map can say "Complete" while the WeekCard says Off track. Since the `complete` check runs before the `n <= current` check, a future week can also show Complete.

3. **Weeks so far (confirmed).** In components/course/readiness-report.tsx:89, `weekProgress(w.number, weekDates(w.number)[6], cd.credits)` is called without the labs/gates `extra`. So the badge at line 97 is count-only "On track", while the title (line 90) treats a missing lab or gate as not complete. The same count-only call appears in components/use-course-day.ts:34 (`finished` statuses), and that feeds `readiness()`. So readiness also ignores required labs and checkpoints in finished weeks.

4. **Progress streak (confirmed).** components/progress-view.tsx:70 uses `streak(active, today, PLAN_DAYS)` from lib/progress-90.ts:38-47. It counts any activity on 90-day-plan working days, which §9 names as a legacy concept to remove. Today uses `trainingStreak` (lib/course/week-status.ts:101), which counts met course training days. These produce different numbers.

**Overstated parts.** Several cited lines are not independent deciders. week-status.ts:66, 86, 105, 132 and 134 all repeat the same predicate, `credits[d] >= dailyTarget(week)`, consistently. course-cards.tsx:27-35 and motivation.ts:114-116 only render `progress.status`. flameFor (week-status.ts:116-118) is a momentum display, not a completion decision. The duplication is a maintainability risk, but these lines do not disagree with each other.

**More direct §7 violation the claim misses.** course-today.tsx:68 `const complete = day.type === 'training' && done >= target` drives "Day complete" (lines 164-167) on rep count alone. It ignores required labs, checkpoints, target problems and repairs, which §7 says must not happen ("Do not show DAY COMPLETE 15 / 15 if a required lab or checkpoint is still unfinished"). Also, weekProgress only downgrades a week for missing labs or gates after the week has ended (week-status.ts:78), and only to 'recoverable'. It has no "complete" notion at all. Corrected: There is no single authoritative function for day or week completion, and the surfaces users see contradict each other. The real problems are these:

(a) **Day complete ignores required work.** The day-level "Day complete" (components/course/course-today.tsx:68 `const complete = day.type === 'training' && done >= target`, shown at lines 164-167) counts reps only. It ignores required labs, checkpoints, target problems and repairs, which breaks §7 directly.

(b) **Road map uses a different definition of a complete week.** The road map's week "Complete" (components/course/road-map.tsx:24) is decided by unit mastery: all units ready or in maintenance, which in lib/course/routing.ts means all live gates cleared. Weekly output and labs play no part. Because the `complete` check runs first, it can say Complete while the WeekCard reports Off track for the same week, and it can do so for future weeks too.

(c) **Finished-week badges and readiness ignore labs and gates.** components/course/readiness-report.tsx:89 and components/use-course-day.ts:34 call `weekProgress` without labs/gates. So the "Weeks so far" badge is count-only ("On track") while the title next to it (readiness-report.tsx:90) treats the week as incomplete. The readiness read also takes these count-only finished-week statuses. Separately, weekProgress (lib/course/week-status.ts:78) only downgrades an ended week with missing labs or gates to 'recoverable'. No function returns "week complete" under the §7 definition.

(d) **Two streaks give different numbers.** The Progress page streak (components/progress-view.tsx:70 → lib/progress-90.ts:38-47) uses the legacy 90-day working-day activity calendar, while Today uses `trainingStreak` (week-status.ts:101).

**Not a live contradiction.** prescribe() does return `complete: true` when N = 0, on rest days and covered Saturdays (lib/course/capacity.ts:37, lib/today-plan.ts:164). But `plan.complete` is only rendered by the pre-course components/today-training.tsx. In the course it is a dormant duplicate definition, not something users see.

**Not separate deciders.** week-status.ts:66/86/105/132-134 all use the same consistent predicate, `credits >= dailyTarget`. course-cards.tsx:27-35 and motivation.ts:114-116 only display `progress.status`. They should not be counted as disagreeing deciders.

### 7. [MAJOR] Streak, flame, celebration and milestones count reps only; the streak counts days with pending checkpoints, repairs and labs — CONFIRMED (severity keep)
- Spec: §7; §20 gamification (streak = completed required training days; milestones); principle 11
- Evidence: lib/course/week-status.ts:105 `const met = (credits[d] ?? 0) >= dailyTarget(courseWeekOf(d))`; :118 `if (done >= target) return 'blaze'`; components/course/course-today.tsx:77-84 celebrate only `if (!complete) return false`; :93 `milestoneReached(cd.total - done, cd.total)`; :203 `{milestone && complete && (`; data/course/motivation.ts:171 `export const MILESTONES = [50, 250, 500, 750, 950]`
- Detail: In the Week-3 scenario the streak climbs 11→15 and the flame blazes and sparks every day with labs 0/2 and checkpoints 0/3. Milestones only show on a training day whose count is met. A crossing on Saturday (where complete is always false) or on a short day is lost for good: for example 9/day Mon–Fri (45) plus 5 on Saturday crosses 50 on Saturday, and on Monday `before` is already 50. The 'first training day' milestone (spec §20) is missing from MILESTONES, although motivate('milestone') has copy for it (motivation.ts:142); motivate('milestone') is never called.
- Suggested fix: Base the streak's 'met', the flame blaze and the celebration on dayContract.complete. Fire milestones from a persisted 'last celebrated' marker, not from a same-day crossing gated by `complete`. Add first training day, first completed week and first clean gate.
- Verifier: I read the cited code and the claim holds.

**Streak and flame count reps only.** `trainingStreak` (lib/course/week-status.ts:101-111) counts a training day when `(credits[d] ?? 0) >= dailyTarget(courseWeekOf(d))`. `credits` is `useCredits().byDate`, which is just the number of qualifying credit items per date (components/use-credits.ts). It never checks labs, checkpoints, repairs or target problems. `flameFor` (:116-121) takes only the done/target counts, and use-course-day.ts:49 passes it `done.length` and the rep target. Spec §20 says the streak counts "consecutive required training days completed". §7 says completion must include the required labs, checkpoints, target problems and repair. So a day with a pending lab or checkpoint still extends the streak and blazes the flame. Labs and gates only reach `momentum` as a small bonus (:136), and `weekProgress` uses them only after the week has ended (:78).

**Celebration uses the rep count only.** course-today.tsx:68 sets `complete = day.type === 'training' && done >= target`. That drives "Day complete" (:164-171), the celebration (:77-84) and the flame `ignite` sparks (:162). Labs and checkpoints are never consulted.

**Milestones.** `milestoneReached(cd.total - done, cd.total)` (:93) only compares totals before and after today, and the badge needs `milestone && complete` (:203). A crossing on Saturday (`dayType === 'recovery'`, so `complete` is always false), or on a training day that ends short of its target, is never shown: the next day `before` already includes those reps. `MILESTONES = [50, 250, 500, 750, 950]` (data/course/motivation.ts:171) has no first-training-day entry, though motivate('milestone') has copy for `c.milestone === 1` (:142). A grep shows motivate('milestone') is never called outside data/course/motivation.ts. The only callers of motivate are course-cards.tsx (week-progress, ready/not-ready), readiness-report.tsx (week-complete) and the tests.

**Not verified.** I did not recompute the exact Week-3 numbers (streak 11 to 15, labs 0/2, checkpoints 0/3). The mechanism behind them is confirmed. The other §20 milestones (first clean gate, first independent Medium, first completed week, first mock, READY) are not wired as milestone celebrations either; this is consistent with the claim.

**Severity.** Major is right. It materially fails §7 and §20, and it borders on principle 12 (truthful progress), because the streak and the blaze report a day as done when it is not. Corrected: Accurate as stated, with one note on coverage. Only the rep count drives the streak (lib/course/week-status.ts:105), the flame (:118, fed `done.length` at components/use-course-day.ts:49), "Day complete", the celebration and the sparks (components/course/course-today.tsx:68, :77-84, :162). Labs, checkpoints, repairs and target problems are ignored. The milestone badge only appears when today's rep target is met (:203). A crossing on Saturday, or on a training day that ends short, is lost, because `before = cd.total - done` (:93) is computed from today alone. MILESTONES (data/course/motivation.ts:171) has no first-day entry, and motivate('milestone') is never called in product code. Beyond the claim, the other §20 milestones (first clean gate, first independent Medium, first completed week, first mock, READY) are not wired as milestone celebrations either. I did not recompute the Week-3 figures (streak 11 to 15, labs 0/2, checkpoints 0/3), but the code does produce that kind of outcome.

### 8. [MAJOR] There is no notion of a required target problem; targets never count toward day or week completion — CONFIRMED (severity keep)
- Spec: §7 'explicitly required target problem(s)'; §29
- Evidence: data/course/units.ts:31-33 `targets: number[]` / `readinessTargets?: number[]` (no required flag); lib/course/week-status.ts:60 extras have no targets; components/course/readiness-report.tsx:90 complete ignores targets; lib/today-plan.ts:130 foundation filter
- Detail: Target problems per week (computed): W2 5, W3 5, W4 3, W5 3, W6 2, W7 7, W8 4, W9 3, W10 4, W11 4, W12 8. None of them appears in any completion rule. Week 2's targets cannot be prescribed in Week 2 (phaseOfWeek(2) = 'foundation'), so a Week-2 contract that required them could never be met.
- Suggested fix: Add an explicit `requiredTargets` per unit or week in data, schedule them on days that are not in the foundation phase (or relax the filter for required ones), and include them in dayContract and weekContract.
- Verifier: I checked the claim against the code, and it holds. data/course/units.ts:33-34 declares only `targets: number[]` and `readinessTargets?: number[]`. Neither has a required flag. A grep for requiredTarget, targetsDone, `.targets` and readinessTargets finds them read in only two places: lib/course/routing.ts:225 and components/course/road-map.tsx:120. routing.ts:225 puts them in the queue as purpose 'problem' items (`for (const lc of [...unit.targets, ...(unit.readinessTargets ?? [])]) ... out.push({ key: \`lc:${lc}:new\`, ... purpose: 'problem', lc })`). road-map.tsx:120 only displays them.

No completion rule looks at targets:
- lib/course/week-status.ts:60: weekProgress's `extra` takes only labsDone, labsRequired, gatesCleared and gatesRequired. Line 78 downgrades the status only for missing labs or gates.
- Day completion is credits >= rate (week-status.ts:66, 86, 105).
- components/course/readiness-report.tsx:90: `complete = p.done >= p.target && labs...every(done) && gates.every(cleared)`, with nothing for targets.

Per-week counts, read from units.ts with targets and readinessTargets combined: W2 5, W3 5, W4 3, W5 3, W6 2, W7 7, W8 4, W9 3, W10 4, W11 4, W12 8. These match the claim.

The Week 2 point is also correct. lib/course/capacity.ts:12 returns 'foundation' when week <= 2. lib/today-plan.ts:104 sets `foundation = input.phase === 'foundation'`. Line 130 filters out `c.kind === 'problem' && (foundation || !c.ready)`, so the W2 targets [217, 242, 1, 49, 128] (units.ts:205) are never prescribed in Week 2. They are only offered as optional.

One nuance: a solved target can still add a credit toward the rep count as a qualifying problem. It is just never a named requirement, so a day or week can be marked complete without it. This materially fails spec lines 166, 170 and 417 (the explicitly required target problem in day and week completion). Major is the right severity. Corrected: The claim is accurate. One nuance to add: a solved target can still count as one qualifying credit toward the daily and weekly rep count. It is never tracked as its own required item, so no day or week completion depends on it. The places that decide completion are lib/course/week-status.ts:60/78, components/course/readiness-report.tsx:90 and the credits >= rate check. In Week 2, lib/today-plan.ts:130 (`!(c.kind === 'problem' && (foundation || !c.ready))`) together with capacity.ts:12 (`week <= 2` → 'foundation') means the Week 2 targets (units.ts:205) are only ever offered as optional.

### 9. [MAJOR] Unfinished labs disappear from Today when the week rolls over (hidden backlog) — CONFIRMED (severity keep)
- Spec: §8 'No hidden backlog'; §3; §26
- Evidence: components/use-course-day.ts:28 `const labs = LABS.filter((l) => l.week === week.number)...`; components/course/course-cards.tsx:53 builds list rendered only from `labs`; :34 use-course-day.ts finished statuses ignore labs
- Detail: From Monday of week N+1, a required Week-N lab that was not done no longer appears on Today, WeekCard or the readiness track. Only Progress → Weeks so far lists "— <lab title>" (readiness-report.tsx:103-106). Missed gates carry over through the course queue; missed labs do not.
- Suggested fix: Carry incomplete required labs from earlier weeks into the Today stack, labelled honestly as 'from Week N' with no-guilt copy, and into the week and readiness contract.
- Verifier: I checked the claim against the code and it holds. components/use-course-day.ts:28 builds `labs` only from `LABS.filter((l) => l.week === week.number)`, and `week` comes from courseDay(today). That array is the only lab list on Today: WeekCard renders it at components/course/course-cards.tsx:53-67, and course-today.tsx has no lab list of its own. So from week N+1 on, an unfinished required lab from week N no longer appears on Today. Nothing else in the code carries it over. Gates are different: they stay in the course queue (the "gate" and "repair" item kinds in course-today), so missed checkpoints remain visible.

The readiness claim is also correct. use-course-day.ts:34 computes the finished weeks as `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status` with no `extra` argument. In lib/course/week-status.ts:75-78, `labsRequired` and `gatesRequired` then default to 0, so the downgrade "A finished week with a required build or checkpoint missing is not on track" never fires. readiness() (lib/course/readiness.ts:155) therefore sees a past week as 'on-track' even when its required lab or gate was missed. readiness.ts never mentions labs.

On Progress, readiness-report.tsx:88-106 does list each past week's labs with "—" and uses them in the `complete` headline. But line 87 calls weekProgress without labs or gates as well, so the status badge (line 97) can still say "On track" for a week with a missing build.

One point needs correcting. In §8, "No hidden backlog" means optional or repair inventory must not silently stop a week from completing. It is not about missed work disappearing. The requirements this actually breaks are:
- §7 (and §29): Today must show every required item, including labs, and week completion must include required labs.
- §3 (Today as the command center) and §29 ("no required Lab exists only behind Plan"): a missed lab is now reachable only through Plan, or as a muted "—" under Progress → Weeks so far.
- §18/§26: missed labs do not affect readiness or the week status.
Major severity is right. Corrected: Confirmed, but the cited spec clause is wrong: this breaks §7/§3/§29 (every required lab visible on Today; week completion includes labs), not §8's "No hidden backlog". Today lists only the current week's labs (components/use-course-day.ts:28 `LABS.filter((l) => l.week === week.number)`), and WeekCard (components/course/course-cards.tsx:53) is the only place Today shows labs. So a required lab left unfinished in week N disappears from Today from week N+1, while missed gates carry over through the course queue. It also skews readiness: use-course-day.ts:34 calls `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate)` with no labs or gates. The downgrade at lib/course/week-status.ts:78 then never applies, so readiness() gets 'on-track' for a past week whose required build (or gate) was missed. readiness-report.tsx:87 makes the same call, so the Progress "Weeks so far" status badge can read "On track" even while the row shows "— <lab title>" (lines 103-106). The row's `complete` headline (line 90) does include labs. Severity: major.

### 10. [MAJOR] No week-complete state on Today; closing the week on Saturday is never acknowledged, and the Saturday copy goes stale — CONFIRMED (severity keep)
- Spec: §7; §19 (Week complete message); §1 'Get told when the day is complete'
- Evidence: lib/course/week-status.ts:33 `export type WeekStatus = 'on-track' | 'recoverable' | 'off-track'`; components/course/course-cards.tsx:34-35 pill shows `WEEK_STATUS_LABEL[progress.status]`; motivate('week-complete') used only at components/course/readiness-report.tsx:114; course-today.tsx:68 requires 'training'; week-status.ts:27 Saturday shortfall uses `d < date`
- Detail: A fully finished week (75/75, both builds, every checkpoint) still reads "On track" on Today. The week-complete message appears only later, on the Progress page. On Saturday `complete` can never be true. Because optionalTarget leaves out Saturday's own credits, the header "N reps would close the week" and the line "N reps would close week W; nothing is owed." stay on screen after the learner has done those N reps. Meanwhile WeekCard flips to on-track.
- Suggested fix: Use weekContract.complete to add a 'Complete' state to WeekCard and fire the week-complete moment on Today, including on Saturday. Compute Saturday's remaining work from credits up to and including today.
- Verifier: I checked every part of the claim against the code and each part holds.

1. Today has no week-complete state. lib/course/week-status.ts:33 has only `'on-track' | 'recoverable' | 'off-track'`. WeekCard (components/course/course-cards.tsx:26-35) shows `WEEK_STATUS_LABEL[progress.status]`, and its line comes from motivate('week-progress'). For an on-track week that line reads "On track for February 1 if this output continues" (data/course/motivation.ts:121), even at 75/75 with both builds and every checkpoint done.

2. motivate('week-complete') is called in one place only, components/course/readiness-report.tsx:114. That code is inside the `finished` list (lines 80-90), which holds only weeks that have already ended. So the message shows on the Progress page after the week is over, never on Today.

3. CourseToday (components/course/course-today.tsx:68) has `const complete = day.type === 'training' && done >= target`, so `complete` can never be true on Saturday.

4. The Saturday copy goes stale. In week-status.ts:27, optionalTarget counts only `weekDates(week).filter((d) => d < date)`, so it never subtracts Saturday's own credits. As a result:
   - the header at course-today.tsx:177, "`${target} reps would close the week`", stays the same after those reps are done;
   - the line from todayLine/'recovery-day' (motivation.ts:115, "N reps would close week W; nothing is owed.") also stays;
   - the bar fills to N/N and the flame turns to blaze (use-course-day.ts:49).

   Meanwhile weekProgress (lines 64-74) counts `d <= today`, so on Saturday the shortfall drops to 0 and WeekCard switches to on-track. Today then shows two messages that contradict each other. The same frozen figure is used in lib/course/capacity.ts:27.

5. The week does not count as ended until after Sunday (`ended = today > dates[6]`). So Today never says the week is closed, even on Friday or Saturday when everything is done.

Severity stays major. This fails §8 Acceptance ("Reps must truthfully mark the week complete") and §19's "Week complete" event in the moment it happens. The product does not show false data: a learner who closes the week still sees "On track" plus a request for reps they have already done. That is stale and contradictory, but it falls short of critical. Corrected: The claim is accurate. Three details to add:

1. The week-complete message on Progress appears only for weeks that have fully ended, meaning after Sunday (readiness-report.tsx:80-90 through `finished`, and `ended = today > dates[6]`). So Today never says the week is complete, whether the last training day is Friday or the week is closed on Saturday.

2. On Saturday the progress bar does fill to N/N and the flame turns to blaze. Only the header ("N reps would close the week", course-today.tsx:177) and the motivation line ("N reps would close week W; nothing is owed.", motivation.ts:115) stay stale. They are stale because optionalTarget (week-status.ts:27) leaves out the current date with `d < date`. The same stale line is used in lib/course/capacity.ts:27.

3. The best spec anchor for severity is §8 Acceptance ("Reps must truthfully mark the week complete"), together with §7 and the §19 "Week complete" event. Severity: major.

### 11. [MAJOR] Today prescribes reps that never count, so finishing every listed item does not reach the target — CONFIRMED (severity keep)
- Spec: §7 'The daily target and curriculum path must agree'; §8
- Evidence: lib/course/credit.ts:37 `const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']`; :65 `if (!PRODUCTION.includes(exercise.kind)) return false`; lib/course/routing.ts:218 pushes every unpassed path rep regardless of kind; components/use-today-plan.ts:94-95 done filtered to credited keys
- Detail: Required unit paths contain multiple-choice reps: W2 5, W8 1, W14 7 (computed). In the simulation, the prescriptions for Oct 27 and Oct 29 each included one (o2-list-literal, o2-set-empty), so doing every item gives 9/10. In the live app the passed choice rep is neither 'done' (it earned no credit) nor still queued (it was passed). It disappears from the list and an 11th item takes its place.
- Suggested fix: Classify non-producing reps as OPTIONAL or RETRIEVAL (per the §8 classification) and keep them out of the required path, or label them clearly as 'does not count'. Never let an item the day's count requires be one that cannot count.
- Verifier: I traced the claimed mechanism end to end and it holds.

1. **Credit excludes multiple choice.** lib/course/credit.ts:37 reads `const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']`. At :65, `qualifies()` returns false for any kind not in that list. `dailyCredits` (:94-99) only emits passes that qualify, so a passed `choice` rep never becomes a credit item.

2. **Choice reps are on the required paths.** data/exercises/build.ts:68-69 builds `choice()` reps with `stage: 'recognize'` and `kind: 'choice'`. o2-list-literal (data/exercises/oct02.ts:27-28) and o2-set-empty (:565-566) are choice reps. They sit in sections 'o2-python-recall' and 'o2-sets', which are listed in a unit's `sections` at data/course/units.ts:201. The routing filter in lib/course/routing.ts:157 only drops LESSON_LEVEL stages ('recognize' among them, :66) on the 'focused' route. The 'full' route, which a fresh learner gets, keeps them.

3. **The queue prescribes them.** `courseQueue` (routing.ts:218) pushes every unpassed path rep with no check on its kind. components/use-today-plan.ts:62-67 turns each queue item into a plan Candidate. `prescribe()` (lib/today-plan.ts:120-150) gives that candidate one of the N capacity slots.

4. **Done only counts credited keys.** use-today-plan.ts:94-95 builds `counted` from `credits.items[today]` and filters `doneToday` to those keys. A passed choice rep is therefore not 'done'. `courseQueue` also drops it from the plan because it has passed (`!passed.has(e.id)`). It vanishes from the list and `prescribe` fills the free slot with the next queue item.

So finishing every listed item, when one of them is a choice rep, gives (N-1)/N credits, and the list then grows by one. Today's prescription and the credit rule disagree, which violates §7 "The daily target and curriculum path must agree". It also feeds the §8 workload math: required-path reps that can never count toward the weekly target. I did not recompute the per-week counts (W2 5, W8 1, W14 7) or the Oct 27/29 simulation. Those figures are unverified, but the mechanism and the two example reps are confirmed. Major is the right severity: it is a material V2.1 requirement failure, and the credit rule itself stays truthful. Corrected: The claim is accurate as stated. Precisely: on the 'full' route, unit paths include `kind: 'choice'` reps (stage 'recognize', e.g. o2-list-literal and o2-set-empty via data/course/units.ts:201). courseQueue (lib/course/routing.ts:218) prescribes them and prescribe() spends a capacity slot on each. credit.ts:65 never credits them, so use-today-plan.ts:94-95 never marks them done. Once passed they drop out of the queue and an extra item backfills. The focused route (routing.ts:157) avoids this only for unpassed lesson-level reps. The per-week counts of choice reps on required paths (W2 5, W8 1, W14 7) were not independently recomputed.

### 12. [MAJOR] Tests lock in the reps-only contract; the §29 daily and week completion tests are missing — CONFIRMED (severity keep)
- Spec: §29 Daily completion / Week completion
- Evidence: e2e/course.spec.ts:58-73 'ten qualifying reps complete the day' expects data-complete='true' and "10 / 10" while Week 1's 2 labs and 4 checkpoints are outstanding (:44-45); lib/capacity.test.ts:170-173 'ten reps done is “training complete”'; lib/course/motivation.test.ts:26-28; lib/course/week-status.test.ts:40-44 tests the ended-week lab/gate downgrade that no screen reaches
- Detail: No test asserts that a day or week is not complete while a lab, gate, target or repair is pending. No test follows the Today prescription across a week, which is how the routing deadlock went unnoticed.
- Suggested fix: Replace these with contract tests:
- A day is not complete with each required kind pending.
- A week is not complete without the count, each lab, each gate or each target.
- Saturday copy is checked against the contract.
- A 'follow Today for two weeks' simulation.
- Verifier: I checked every piece of cited evidence and it holds.

- e2e/course.spec.ts:58-73 imports ten Week 1 passes. It then expects `data-complete='true'` and `day-complete` to contain '10 / 10'. The same spec shows the week card with `lab-link` count 2 and `gate-row` count 4 (:44-45), and nothing clears those labs or gates first.
- That attribute comes from components/course/course-today.tsx:68, `const complete = day.type === 'training' && done >= target`. It counts reps only, so the e2e test fixes the reps-only rule in place.
- lib/capacity.test.ts:170 is 'ten reps done is “training complete”'. It asserts `[t.repsDone, t.complete]` equals `[10, true]` against the legacy today-plan `prescribe`.
- lib/course/motivation.test.ts:26-28 maps repsDone >= repsTarget straight to 'day-complete'.
- lib/course/week-status.test.ts:40-44 is the only test that passes labs or gates. It checks that a finished week missing a lab or checkpoint becomes 'recoverable'.
- That downgrade is unreachable from any screen:
  - lib/course/week-status.ts:78 applies it only when `ended` (`today > dates[6]`).
  - components/use-course-day.ts:32 passes the labs and gates only for the current week, which by definition has not ended.
  - The finished-week calls pass no extras: use-course-day.ts:34, road-map.tsx:62 and readiness-report.tsx:87.

I found no test in lib/**/*.test.ts or e2e/*.spec.ts asserting that a day is incomplete while a required lab, checkpoint, target problem or repair is pending. Nothing loops the Today prescription across the days of a week either:
- routing.test.ts covers unit locks, gates and repair routing one case at a time.
- course.test.ts covers the calendar and units.

§29 explicitly requires the daily and week completion tests, so major is the right severity. One small overstatement: there is a single week-level unit test with labs and gates (week-status.test.ts:40). But it only covers an ended week, which no screen reaches, and it does not cover target problems or repair. Corrected: The claim is accurate, with one nuance. lib/course/week-status.test.ts:40-44 does assert that a week missing a lab or checkpoint is not 'on-track'. It only covers the ended-week branch (week-status.ts:78, `if (ended && ...)`), and no screen ever reaches that branch. use-course-day.ts:32 passes labs and gates only for the current, unended week, while use-course-day.ts:34, road-map.tsx:62 and readiness-report.tsx:87 call weekProgress for finished weeks with no lab or gate extras. That test also leaves out target problems and repair. Day-level completion (course-today.tsx:68, `done >= target`) is tested only as reps-only, in e2e/course.spec.ts:58-73, lib/capacity.test.ts:170 and lib/course/motivation.test.ts:26-28. No test simulates the Today prescription across a week.

### 13. [MINOR] Week card off-track advice is wrong on Saturday and Sunday — CONFIRMED (severity keep)
- Spec: principle 5 (planned rest: no guilt); §19
- Evidence: data/course/motivation.ts:120 `` `Week ${c.week}: ${wd} of ${wt}. Behind what this week needs. The shortest way back is today's target, then Saturday. No guilt, just the next rep.` ``; components/course/course-dashboard.tsx:73 WeekCard is rendered on every day type
- Detail: On a Sunday rest day there is no target and Saturday has already passed. On Saturday, 'then Saturday' means today. The copy points to steps that do not exist.
- Suggested fix: Branch the copy on the day type: on Saturday, 'today can close part of it'; on Sunday or holidays, a neutral wrap-up with no instructions.
- Verifier: I read the code and the claim holds. data/course/calendar.ts:9 sets COURSE_START = '2026-10-26', which is a Monday. weekDates (line 64) builds Mon..Sun, so Saturday is dates[5] and Sunday is dates[6]. dayType (lines 39-45) makes Sunday 'rest', Saturday 'recovery' and holidays 'rest'. In lib/course/week-status.ts:71-74, `ended = today > dates[6]` is still false on that week's Sunday. The status therefore comes from `else if (shortfall > rate) status = 'off-track'`, and a week that is behind reads off-track on both Saturday and Sunday. WeekCard (components/course/course-cards.tsx:25-27) calls motivate('week-progress', {... weekStatus: progress.status ...}) without passing the day type. CourseDashboard (components/course/course-dashboard.tsx:73) renders `<WeekCard cd={cd} />` on every day. So when the week is off-track, the line at data/course/motivation.ts:120 ("The shortest way back is today's target, then Saturday.") shows on Sunday and on Saturday. On Sunday, courseDay gives target: 0 and Saturday has already passed. On Saturday, courseDay gives target: 0 and only an optionalTarget, so "today's target, then Saturday" points at the same day twice. The same wrong advice also shows on a weekday holiday, which is a rest day with no target. The tone is not guilt-inducing ("No guilt, just the next rep"), so this is wrong guidance rather than a guilt violation, and minor is right. Corrected: The claim is accurate. The week runs Mon-Sun (COURSE_START 2026-10-26 is a Monday), and `ended` (week-status.ts:71) only becomes true after Sunday. A behind week can therefore be 'off-track' on its own Saturday and Sunday. WeekCard (course-cards.tsx:27) does not pass the day type to motivate('week-progress'), so motivation.ts:120 tells the learner "today's target, then Saturday" on these days:
- Sunday: target 0, and Saturday has passed.
- Saturday: target 0 with only an optional top-up, so "then Saturday" means today.
- Weekday holidays: rest days with target 0.

The copy should branch on day type. On Saturday it could point to the optional top-up, and on Sunday or a holiday to next week, or it could drop the advice.

### 14. [MINOR] Contradictory rest-day copy when the streak is 0 — CONFIRMED (severity keep)
- Spec: §20 planned rest protects the streak; §15 (V2) planned rest
- Evidence: components/course/course-today.tsx:140 `'Rest protects nothing and costs nothing. Tomorrow starts fresh.'`
- Detail: 'Rest protects nothing' contradicts the streak rule ('planned rest protects it') shown in the same component.
- Suggested fix: Use 'Rest costs nothing. Your plan is intact.'
- Verifier: Line 140 of components/course/course-today.tsx is a ternary: `{cd.streak ? `🔥 ${cd.streak}-day streak · rest day, streak protected` : 'Rest protects nothing and costs nothing. Tomorrow starts fresh.'}`. The two messages can never appear together. The "protects nothing" text shows only when cd.streak is 0, and with no streak there really is nothing for rest to protect. The rest-day branch (lines 130-147) returns early, so the training-day streak copy ("Streak starts with today", line 153) is not on screen at the same time either. So the copy is not logically contradictory, and the product does not say anything untrue. The spec rule (§20, line 344: "planned rest protects it"; line 423: "streak protected") is met by the streak > 0 message. lib/course/week-status.ts:98 also skips rest days when counting the streak, so the behaviour is right too. One problem is left. Read on its own, "Rest protects nothing" sounds like a general rule that rest does not protect the streak, which clashes with the product's stated principle. That is a wording issue worth tidying, so minor severity is right. It does not break a requirement. Corrected: The two strings are exclusive branches of one ternary (course-today.tsx:140), so they never render together. The "protects nothing" text appears only when cd.streak === 0, where it is literally true, and the streak > 0 branch correctly says "rest day, streak protected", as §20 requires. This is not a contradiction. The issue is that the zero-streak wording, "Rest protects nothing and costs nothing", can be misread as a general rule that rest does not protect streaks. Suggested polish: rephrase to something like "Rest costs nothing. Your streak starts on the next training day." Severity stays minor.

### 15. [MINOR] After the course ends (from Feb 1, 2027) Today falls back to Week 1 — REFUTED
- Spec: §7; §26
- Evidence: components/use-course-day.ts:26 `const week = WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[1]`; data/course/calendar.ts:57 `return Math.min(COURSE_WEEKS + 1, Math.floor(days / 7) + 1)` (=15); components/course/course-dashboard.tsx:64 `Week {cd.week.number} of 14`
- Detail: On Feb 1, 2027, the interview checkpoint day, the header reads "Week 1 of 14" and WeekCard shows Week 1's labs and gates. dailyTarget(15)=15 is still demanded on weekdays.
- Suggested fix: Handle week > 14 explicitly: show a post-course state and no daily target, or the Week 14 summary.
- Verifier: The cited lines exist, and the fallback is real in isolation. courseWeekOf('2027-02-01') returns 15 (I checked this with a throwaway script). WEEK_BY_NUMBER only has weeks 1–14, so use-course-day.ts:26 `WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[1]` would pick Week 1.

That date never reaches the hook in production, though. `today` comes from studyToday() in components/reps-provider.tsx:79-81: `return devAsOf() ?? clampDate(localDate(now), FIRST_DAY, LAST_DAY > COURSE_END ? LAST_DAY : COURSE_END)`. LAST_DAY is '2027-01-09' (computed from data/curriculum.ts:219) and COURSE_END is '2027-01-31', so the real date is clamped to 2027-01-31 at most. devAsOf() returns null when NODE_ENV === 'production' (reps-provider.tsx:68). So in production courseWeekOf(today) is at most 14. Today never shows "Week 1 of 14", and it never asks for dailyTarget(15) on Feb 1 or later.

The Week 1 fallback can only be reached in development with ?asOf=2027-02-01 or later. In that case the header shows Week 1 of 14 and the Week 1 labs and gates. dailyTarget(15) also returns 15, but that is the same as weeks 3–14, so it is not a separate defect.

The scenario as claimed does not happen for real users, so I am treating the claim as refuted. A related but different issue does exist (see correctedDetail). Corrected: The real post-course behaviour is a freeze on Jan 31, not a fall back to Week 1. components/reps-provider.tsx:81 clamps the study day to COURSE_END ('2027-01-31'), because LAST_DAY is '2027-01-09'. From Feb 1, 2027 onward, production keeps reporting today as Sunday Jan 31, 2027: Week 14, a rest day. The countdown in course-dashboard.tsx:51 and :64 then reads "Feb 1 checkpoint in 1 day" forever. The Feb 1 checkpoint day and anything after it never appear, so there is no post-course or checkpoint state. Any credits logged after Jan 31 are attributed to a frozen 'today', which makes the date untruthful after the course ends. This is still minor, since it only affects dates after the course, against §7 and §26. The Week 1 fallback at use-course-day.ts:26 is reachable only through the dev-only ?asOf override (reps-provider.tsx:67-77). It is a latent robustness bug: the hook should handle week 0 and week 15 explicitly instead of defaulting to Week 1.

### 16. [MINOR] The day-complete panel leaves out builds — CONFIRMED (severity keep)
- Spec: §7; V2 §30 daily-completion state
- Evidence: components/course/course-today.tsx:302-306 `{progress.done} / {progress.target}` … `{cd.gatesCleared} of {cd.weekGates.length} checkpoints cleared`
- Detail: The panel shows the week's count and checkpoints, but not the week's required labs.
- Suggested fix: Add 'x / y builds' from the week contract.
- Verifier: The claim holds. In components/course/course-today.tsx:298-317, the complete-panel's "Week N" column shows only `{progress.done} / {progress.target}` (line 303) and `{cd.gatesCleared} of {cd.weekGates.length} checkpoints cleared` (line 306). Nothing in it shows labs or builds. The data is already available to the panel: components/use-course-day.ts:28-29 builds `labs` and `required` (the week's non-optional labs), feeds labsDone and labsRequired into weekProgress (line 32), and returns `labs` from the hook (line 45). The panel just never renders them.

Minor is the right severity. The V2 §30 example panel (REPS_2_MASTER_SPEC.md:1913-1935) lists only the week count, the checkpoints and tomorrow, so it never asked for labs. V2.1 §7 (planning/REPS_2_1_SPEC.md:164-172) is about the completion contract, meaning what has to be true before a day or week counts as done. It is not about what this summary panel displays. So leaving labs out of the panel is a polish and clarity gap, not a missed requirement.

There is a separate and more serious problem nearby, and it should not be folded into this minor finding. Line 68 sets `const complete = day.type === 'training' && done >= target`, which shows the panel based on the rep count alone. It ignores required labs, checkpoints and targets, and that is the §7 violation the spec calls out with "Do not show DAY COMPLETE 15 / 15 if a required lab or checkpoint is still unfinished". Corrected: The claim is accurate as stated. The day-complete panel (course-today.tsx:298-317) shows the week's rep progress and the checkpoints cleared, but not the week's required labs, even though useCourseDay already returns `labs` (use-course-day.ts:28-29 and 45) and passes labsDone and labsRequired into weekProgress (line 32). It is a minor display gap: the V2 §30 example panel doesn't list labs, and V2.1 §7 governs the completion contract, not what this panel shows. The related serious issue is separate: `complete = day.type === 'training' && done >= target` (course-today.tsx:68) shows the panel without checking required labs or checkpoints.

### 17. [MINOR] Dead and misleading week data: WEEKS[].requiredLabs includes the optional Week-9 lab, and WEEKS[].gates is unused — CONFIRMED (severity keep)
- Spec: §7 week completion (future implementation risk)
- Evidence: data/course/weeks.ts:57-58 `gates: units.flatMap((u) => u.gateIds)` / `requiredLabs: units.flatMap((u) => u.labIds)`; data/course/content/labs-w9w13.ts:52 `optional: true`
- Detail: Neither field is read anywhere. Week 9 lists 2 'requiredLabs' but only 1 is required. A week contract built from this field would wrongly require the optional build.
- Suggested fix: Derive requiredLabs from LABS with !optional (and live gates), or remove the fields.
- Verifier: I checked this against the code and the claim holds. data/course/weeks.ts:57-58 builds `gates: units.flatMap((u) => u.gateIds)` and `requiredLabs: units.flatMap((u) => u.labIds)`. For Week 9, units.ts:441 gives w9-cycles `labIds: ['lab-dependency-planner']` and units.ts:457 gives w9-heaps `labIds: ['lab-priority-queue']`. labs-w9w13.ts:48-52 marks lab-priority-queue as `optional: true`. So WEEK_BY_NUMBER[9].requiredLabs lists 2 labs, but only 1 is actually required.

A repo-wide grep finds no reader of `requiredLabs` outside its type declaration in weeks.ts:19 and REPS_2_MASTER_SPEC.md:443. The `.gates` hits in use-course-day.ts:30, readiness-report.tsx:89, readiness.ts:55, road-map.tsx:108 and routing.ts all read UnitStatus.gates from routing.ts:51, not CurriculumWeek.gates. Both week fields are dead today.

Spec §7 (line 170) says week completion must require the required labs. A future week contract built on this field would wrongly require the optional build. Since nothing reads the field now, no user sees a wrong result yet, so minor is the right severity. Corrected: Accurate as stated. One addition: the `.gates` reads elsewhere in the code (use-course-day.ts:30, readiness-report.tsx:89, lib/course/readiness.ts:55, road-map.tsx:108) are UnitStatus.gates from lib/course/routing.ts:51, not CurriculumWeek.gates. That confirms the week-level field is unused. Week 9's requiredLabs = ['lab-dependency-planner', 'lab-priority-queue'], built from units.ts:441 and :457, but lab-priority-queue is optional (labs-w9w13.ts:52). No other week has an optional lab in labs-w9w13.ts.

### 18. [MINOR] Rest days still list overdue re-solves under "Outside problems today" — CONFIRMED (severity keep)
- Spec: principle 5 planned rest creates zero debt; §29 Rest
- Evidence: components/course/course-dashboard.tsx:82-84 `<LeetcodeList items={listItems} heading="Outside problems today" />`; lib/course/resolves.ts:42 `if (due <= today && ...)`, :50 `if (nextTrainingDay(addDays(first.date, r.gap)) <= today)`
- Detail: A re-solve due on a training day stays due on the following Sunday or holiday and shows as today's work on a rest day. It costs no count, but it reads as owed work.
- Suggested fix: Hide or relabel due items on rest days ('next training day').
- Verifier: I could not refute the claim. The code paths check out end to end.

- **Which dashboard runs:** components/dashboard.tsx:52 renders `<CourseDashboard />` on every course day, rest days included.
- **Only the hero card knows about rest:** the rest branch in components/course/course-today.tsx:130 (`if (day.type === 'rest')`) replaces only the CourseToday card. course-dashboard.tsx:82-84 still renders `<LeetcodeList items={listItems} heading="Outside problems today" />` with no day-type check.
- **How the list is built:** `listItems` comes from `courseLeetcode(today, entries, prescribedLc, problemMeta)` at line 50. In lib/course/resolves.ts, a due date is always a training day, because `nextTrainingDay` skips rest days and Saturdays. The test is `due <= today` (line 42 for redos) and `nextTrainingDay(addDays(first.date, r.gap)) <= today` (line 50 for spaced rounds). An unlogged item from Friday therefore passes the test on Sunday or a holiday (`dayType` returns 'rest' for HOLIDAY or Sunday, data/course/calendar.ts:40-42).
- **What the user sees:** LeetcodeList returns null only when the list is empty (components/leetcode-list.tsx:46). Otherwise it shows the heading and "{done} of {items.length} logged".

So on a rest day an overdue re-solve or redo appears as "today" work with an "N of M logged" counter. The rest card at course-today.tsx:140 meanwhile says the streak is protected and "Rest ... costs nothing". Nothing is counted against the user (no rep debt, and the streak is protected), so this is about how the day reads. Minor is the right severity against principle 5 and §29 "Rest: planned rest creates zero debt".

Two small precision points:
1. The list on a rest day can only hold overdue items, never items newly due that day, because due dates always land on training days.
2. The same thing happens on Saturday recovery days (dayType 'recovery'), not only on Sundays and holidays. Corrected: The claim is accurate. components/course/course-dashboard.tsx:82-84 renders LeetcodeList with "Outside problems today" on every course day, rest days included. Only the CourseToday hero card has a rest branch (course-today.tsx:130). lib/course/resolves.ts:42 and :50 compare `<= today`, so any re-solve or redo still unlogged from an earlier training day stays in the list on a following Sunday, holiday or Saturday recovery day, along with an "N of M logged" counter (leetcode-list.tsx:72). Due dates themselves always land on training days (nextTrainingDay), so the list on a rest day only ever holds carried-over overdue items. No rep or streak penalty applies, so the problem is only the "owed work" wording and display. Severity stays minor.

## credit-outside

Outside-problem credit has not been fixed for V2.1, and the problem the spec names still exists. Tapping "Needed help" on Today writes result 'hinted'. dailyCredits gives that a full qualifying credit ('outside-hinted'), so the Today counter, the "Day complete … You did enough" hero, the week total, the streak and the flame all count it. Meanwhile the LeetCode card on the same page says "Not finished yet … that is the solve that counts", and the unit test (credit.test.ts:46-54) asserts that the bug is the intended behaviour. The data model has only three values (unaided | hinted | failed) plus a dateless boolean 'rebuilt'. Nothing separates seeing the solution from a small hint. The rebuild toggle is only offered on the day of the solve, and only for new problems that have a bridge target; credit.ts, the solve log and readiness never read it. A later cold re-solve (review1-3 or redo, unaided) is credited exactly like a first solve, and readiness ignores outside evidence entirely. Other credit holes: (a) the same LC problem logged N times on one day earns N credits, because credit is keyed by entry id and the /log form mints a new out:<uuid> id each time; the date field also accepts past and future dates. (b) "Run it back" right after a revealed solution earns full same-day credit. It then counts as a 'clean' pass, so the next day's cold pass is upgraded to 'retrieval' (cold evidence). (c) Explain reps count on a self-ticked rubric and land in readiness as cold-independent full-problem evidence. (d) The rep pass panel shows "+1 rep" on every pass, including choice, lab, revealed, same-day-repeat and generated reps, all of which earn 0. (e) 13 choice reps sit in required unit paths and never count; 7 of them (Week 14) are shown on Today as required "Checkpoint" items. What works: same-day repeat dedup, the 'revealed' → no-credit rule, lab and choice exclusion, the gate clean standard, the redo scheduling, and a single credit source in course mode.

**Already correct:**
- After COURSE_START there is one credit source: dailyCredits (via useCredits) drives the Today counter and Day complete (use-course-day.ts:25,35; course-today.tsx:67-68), the Today plan done-state (use-today-plan.ts:94-95 keeps only keys that earned credit), capacity (use-capacity.ts:61), week progress, streak, flame and momentum (week-status.ts), and Road to Ready totals (road-map.tsx:41-44). No second counter competes in course mode.
- A rep passed several times on the same day counts once: credit.ts:96-101 counts only the first qualifying pass per day (tested in credit.test.ts:39-44).
- A solution shown in the same attempt earns no credit and is classified 'revealed' (credit.ts:51, :66). Routing's passedIds also leaves revealed passes out of unit paths (routing.ts:69-71).
- A later pass after a reveal, with no run-it-back in between, is classified 'reconstructed': it is not cold evidence and not gate-clean (credit.ts:53-55; credit.test.ts:28-32).
- Labs never count (credit.ts:64). Every lab build and change-request exercise carries lab:true (0 missing), and no lab part sits in a required unit path.
- Multiple-choice recognition never earns credit (credit.ts:37, :65).
- Failed reps and failed LC entries never count in course mode (credit.ts:46, :105).
- The gate clean standard (credit.ts:77-80) rejects hints, revealed solutions, reconstructions and more than 2 failed runs. The checkpoint UI hides hints, the solution and the concept guide (rep-workspace.tsx:821-826, :1440, :1489). Every gate-pool variant is a production kind (119 code, 1 output), so a gate pass always earns daily credit.
- Help on reps is recorded: static hints, AI hints, the Basics panel on cold reps and the ConceptGuide onAssisted callback all increment hintsUsed (rep-workspace.tsx:567-608, :978). Watching the walkthrough of an in-app capstone sets solutionViewed (:610-615). Masterful evidence classification already separates assisted, reconstructed, self-corrected, retrieval and cold-independent for reps.
- Redo scheduling works and is tested: a re-solve that needed help comes back on the next training day (resolves.ts:36-43; resolves.test.ts:20-23). Spaced +3/+10/+30 re-solves are also correct (resolves.ts:44-53).
- The solve-log schema already separates first solve, re-solve and redo through kind (solve-log.ts:13, :16, :22) and already has a rebuilt field. Entries are stored in study_state under solve:<id>, so the evidence states V2.1 needs can be added without a storage migration.
- Rep credit and outside credit share one seen set in dailyCredits, and no exercise id collides with a solve-log id (lc:/redo:/out:).

**Data:**

```
RESULT VALUES (lib/solve-log.ts:12): SolveResult = 'unaided' | 'hinted' | 'failed'; SolveEntry.rebuilt?: boolean (no date; :28-29); SolveEntry.kind = 'new' | 'review1' | 'review2' | 'review3' | 'redo' | 'outside' (ids lc:<n>:<kind>, redo:<n>:<due>, out:<uuid>).

WHAT THE UI WRITES
- Today LeetcodeList (components/leetcode-list.tsx):
  - "Unaided" → result 'unaided' (:136).
  - "Needed help" → result 'hinted' (:139). The button also shows as pressed for 'failed', and tapping it over a 'failed' entry rewrites the entry to 'hinted', which makes it creditable.
  - Tapping the active button again deletes the entry (:52).
  - "I rebuilt it from blank" toggles rebuilt (:155). It appears only when the item is type 'new', has a bridge target state, and the result is hinted or failed (:83, :148).
  - The Walkthrough link records nothing (:131-134).
  - There is no Failed and no "saw solution" button.
- /log form (components/solve-log-view.tsx): Unaided / Hinted / Failed (:196-200). The date accepts any value (:188). Every manual log gets a new out:<uuid> id (:109). Edit can change the date and result of any entry (:110-120). There is no rebuilt field, and the history table never shows rebuilt.

dailyCredits OUTCOMES (run through the real functions)
- new unaided → 1 'outside-unaided'
- new hinted → 1 'outside-hinted'
- hinted + rebuilt:true → 1 'outside-hinted' (rebuilt ignored)
- failed → 0
- review1 or review3 unaided (later cold re-solve) → 1 'outside-unaided', identical to a first solve
- redo hinted → 1. Logged "Needed help" every day, LC 1 earned 1 credit on each of 6 consecutive training days (10-30, 11-02, 11-03, 11-04, 11-05, 11-06).
- Entry with no LC number (OA or mock) → 0
- LC 1 logged 4 times on one day (lc:1:new plus 3 out:<uuid>) → 4 credits
- Entry dated a past or future day → credited on that day

REP SCENARIOS
- Reveal at 10:00, then "Run it back" at 10:04 the same day → credited, evidence 'reconstructed'.
  - Next-day cold pass after that → evidence 'retrieval', coldEvidence true, gateClean true.
  - The same next-day cold pass without the run-it-back → 'reconstructed', false, false.
- Revealed attempt not passed, then passed 20 minutes later → credited 'reconstructed'.
- Same rep passed 3 times on one day → 1 credit.
- 4 hints (up to the outline level) → qualifies, 'assisted' (same as 1 hint).
- Choice → does not qualify. Explain (self-checked) → qualifies. Lab part → does not qualify. gen-* rep → 0 (not in the static EXERCISE_BY_ID passed by use-credits.ts:17).
- Gate pass after 3 failed runs → qualifies, but is not gateClean.

CONTENT
- Exercise kinds: code 1011, output 100, explain 32, choice 13, reorder 3.
- Explain reps: all 32 are in required unit paths (W2 4, W3 3, W4 2, W5 3, W7 3, W8 4, W9 3, W10 1, W11 3, W14 6). The default stage is 'interview', which makes them full-problem evidence in readiness.
- Choice reps in required unit paths: 13. W2 has 5 (o2-list-literal, o2-set-empty, o2-drev-crash, o2-dl-empty, o2-dl-crash), W8 has 1 (o7-dq-why-not-pop0), W14 has 7 (o11-speed-slicing, o11-cx-heap-k, -subsets, -memo, -tree-space, -grid-bfs, -pop-front). The 7 W14 reps have stage 'retrieval' and repType 'cold', so routing gives them purpose 'gate': Today shows them as required "Checkpoint" items, and they earn 0 credit.
- 92 output/trace reps in required paths are credited by credit.ts but count as "passive" under training-state.isProductive.
- Gate pools contain 119 code variants and 1 output variant, so every gate pass qualifies.
- Every lab build and change-request exercise has lab:true. No lab parts are in required paths.
- 48 course LC targets. 3 of them (LC 217, 1971, 547) have no bridge target, so they never get the "Not finished yet" or rebuild panel. Re-solves and redos never get it either.
- No exercise id collides with a solve-log id.

WHERE LC SOLVES COUNT TOWARD THE DAY
- Course mode: useCredits → dailyCredits feeds the Today counter and hero (use-course-day.ts:25,35), the plan done-state (use-today-plan.ts:94-95 keeps only keys that earned credit, so a hinted LC shows ✓ and struck through), capacity (use-capacity.ts:61), week, streak, flame and momentum (week-status.ts), and Road to Ready (road-map.tsx:41-44).
- Before course start, live until 2026-10-26: doneToday includes every LC entry logged today, failed ones too (use-today-plan.ts:91, counted=null), and useDayRecords counts every entry with an LC number as a rep whatever its result (use-capacity.ts:41-46).
```

### 1. [CRITICAL] 'Needed help' LeetCode solves still earn full daily credit while the same page says 'Not finished yet' — CONFIRMED (severity keep)
- Spec: §10 Daily credit rule ('The UI and the credit logic must agree'); §2 principles 6 and 12; §7
- Evidence: lib/course/credit.ts:105-107 `if (e.date !== date || !e.lc || e.result === 'failed' || seen.has(e.id)) continue` … `evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted'`; credit.ts:12 "an outside problem solved and logged (unaided or with hints) counts once"; components/leetcode-list.tsx:139-140 `onClick={() => set(i, 'hinted')}` … `Needed help`; leetcode-list.tsx:150-152 "Not finished yet: rebuild it, then go back down the ladder." … "It comes back cold in 3 days: that is the solve that counts."; components/use-today-plan.ts:91 `...entries.filter((e) => e.date === today && e.lc)` and :94-95 keeps entries in `counted`; lib/today-plan.ts:110,156 → `done: true`; components/course/course-today.tsx:68 `const complete = day.type === 'training' && done >= target`, :170 "You did enough."; lib/course/credit.test.ts:49,53 asserts `[217, 'outside-hinted']` is credited
- Detail: Every path that excludes only 'failed' credits a 'hinted' entry, and 'hinted' is the only thing the Today 'Needed help' button can write. Example: a Week 3 Monday with a target of 15. The learner passes 14 reps, attempts LC 128 for 30 minutes ('attempt for up to 30 min, then study', leetcode-list.tsx:35), watches the walkthrough and taps 'Needed help'. dailyCredits returns 15 items. The hero switches to 'Day complete 15 / 15 · You did enough.', LC 128 is ticked and struck through in the training list, and the streak, week total, flame and milestones all go up. The LeetCode card directly below says 'Not finished yet … that is the solve that counts'. Three days later the review1 earns another full credit. The unit test makes 'hinted counts' a requirement, so fixing the behaviour will break the suite. use-course-day.ts:36 does not even count 'outside-hinted' as assisted.
- Suggested fix: Put outside credit in credit.ts as an `outsideCredit(entry, entries)` that returns { credited: boolean, evidence, label }. Credit 'unaided' on the solve day. Credit a small hint as 'outside-assisted' only if the spec's severity rule allows it. Never credit solution exposure until a later rebuild or cold solve. Drive the LeetcodeList copy and the ✓ state from the same function, so 'Not finished yet' and 'not credited' are always produced together. Replace credit.test.ts:46-54 with the §29 outside-solve cases.
- Verifier: CONFIRMED: the credit defect. lib/course/credit.ts:105-107 (`if (e.date !== date || !e.lc || e.result === 'failed' || seen.has(e.id)) continue` … `evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted'`) gives one full credit to every outside entry that is not 'failed'. 'Needed help' (components/leetcode-list.tsx:139, `onClick={() => set(i, 'hinted')}`) can only write 'hinted'. lib/solve-log.ts:12 has only `'unaided' | 'hinted' | 'failed'`, so there is no solution-viewed, rebuilt or cold-resolve result, which §10 requires. The `rebuilt` flag (solve-log.ts:29, written at leetcode-list.tsx:155) is never read by credit.ts.

I ran the real modules in a throwaway script (scripts/_audit_skeptic_lchint.ts, deleted after the run). Setup: 2026-11-09, Week 3 Monday, target 15, 14 clean reps, then LC 128 marked 'Needed help'.
- dailyCredits goes from 14 to 15 (`lc:128:new:outside-hinted`).
- course-today.tsx:68 `complete` becomes true, showing "15 / 15".
- flameFor goes from burning to blaze, and the streak from 0 to 1.
- The motivation line uses the celebrate tone: "You completed 15 meaningful reps".
- courseDay, weekProgress, trainingStreak, momentum and milestoneReached all read credits.byDate (week-status.ts:27,64,86,105,132-134).
This breaks §10 ("Solution viewed → does not qualify yet") and principle 12. The new-problem instructions say "attempt for up to 30 min, then study" (leetcode-list.tsx:35) or "watch the explanation first" (:34), with a Walkthrough button (:131-134). Watching the solution and then tapping 'Needed help' still earns full credit.

REFUTED: the "same page says Not finished yet" part, for the course Today page.
- After the tap, use-course.ts:21 puts every 'new' entry in solvedLc, whatever its result.
- courseQueue then drops `lc:128:new` (routing.ts:225). The simulation shows the queue before as [217,242,1,49,128] and after as [217,242,1,49].
- prescribe() rebuilds the done item from doneToday without an `lc` field (today-plan.ts:110). The simulated item is `{"key":"lc:128:new","kind":"problem","done":true}`.
- So course-dashboard.tsx:49 `prescribedLc` is [], and courseLeetcode never adds it back (resolves.ts:54-57). "Outside problems today" is empty and LeetcodeList returns null (leetcode-list.tsx:46).
- The "Not finished yet" panel, the "I rebuilt it from blank" toggle and the "Which move broke?" repair buttons (leetcode-list.tsx:148-166) therefore never show on the course Today page. They only render where LeetcodeList gets a 90-day-plan day: /day/[date] (day-view.tsx:247) and the pre-course dashboard (dashboard.tsx:167).
- For re-solves and redos, `state` is undefined (leetcode-list.tsx:83), so they never show that text either.

Other details in the claim:
- "Ticked and struck through" only applies while the day is incomplete. Once complete, the training list is hidden (course-today.tsx:252 `!complete && plan.items.length > 0`).
- The review1 credit three days later is allowed by §10 ("Later cold re-solve → strongest evidence") when unaided. The real gap is that a hinted re-solve counts the same, with no hint-severity check.
- credit.test.ts:46-54 asserts that a hinted review1 counts. §10 allows hinted work "depending on hint severity", so a fix that adds a solution-viewed result would not have to break this test. "Will break the suite" is overstated.
- use-course-day.ts:36 does leave out 'outside-hinted'. This is minor: it only feeds the `leaned` check (motivation.ts:89).
- Extra edge case: on an entry saved as 'failed' from /log, the button shows as pressed (`aria-pressed={r === 'hinted' || r === 'failed'}`). Tapping it saves 'hinted', which turns zero credit into one.

Already correct: 'failed' earns no credit; credit is counted once per solve id; and CreditItem evidence labels hinted work 'outside-hinted', not unaided.

Severity stays critical. The product declares "Day complete · You did enough" and advances the streak, flame, week total and milestones on a solve where the solution was viewed. That makes progress untruthful (principle 12, §10). Corrected: Correct: a 'Needed help' solve earns one full daily credit. lib/course/credit.ts:105-107 credits every outside entry that is not 'failed'. 'Needed help' (leetcode-list.tsx:139) can only write 'hinted'. SolveResult (solve-log.ts:12) has no solution-viewed, rebuilt or cold-resolve state, and credit.ts ignores the `rebuilt` flag. So a learner who watched the walkthrough gets the same daily credit as an unaided solve. In a run of the real modules (Week 3 Monday, target 15, 14 reps plus LC 128 'Needed help'):
- dailyCredits rises from 14 to 15.
- The hero shows "Day complete 15 / 15 · You did enough".
- The flame goes from burning to blaze and the streak from 0 to 1.
- The motivation line celebrates.
- The week total, momentum and milestones all count it, because they read credits.byDate.

Wrong: the course Today page does not say "Not finished yet" next to the credit. Once the entry is logged:
- solvedLc drops LC 128 from the course queue (use-course.ts:21, routing.ts:225).
- prescribe() rebuilds the done item without `lc` (today-plan.ts:110), so `prescribedLc` is empty (course-dashboard.tsx:49).
- courseLeetcode (resolves.ts:54-57) never adds it back, so LeetcodeList returns null.
The problem silently disappears from "Outside problems today" while the hero celebrates. The "Not finished yet", "I rebuilt it from blank" and "Which move broke?" controls (leetcode-list.tsx:148-166) are unreachable on Today. They only render on 90-day-plan pages (/day/[date], the pre-course dashboard). The UI and the credit logic still disagree, because the problem was marked 'Needed help' and possibly the solution was viewed, but the conflict is a silent drop, not contradictory text.

Smaller points:
- The training-list strike-through only shows while the day is incomplete.
- Unaided review1 credit is allowed by §10. The real gap is that a hinted re-solve counts with no hint-severity distinction.
- credit.test.ts:46-54 tests a hinted review1, so a fix that separates solution-viewed need not break it.
- use-course-day.ts:36 ignoring 'outside-hinted' is minor.
- Tapping 'Needed help' on a 'failed' entry turns it into a credited 'hinted' entry.

### 2. [MAJOR] The outside evidence model cannot tell a small hint from solution exposure; Today offers only Unaided / Needed help — CONFIRMED (severity keep)
- Spec: §10 Outside problem evidence model (UNAIDED, HINTED, SOLUTION_VIEWED, REBUILT, COLD_RESOLVE, FAILED)
- Evidence: lib/solve-log.ts:12 `export type SolveResult = 'unaided' | 'hinted' | 'failed'`; components/leetcode-list.tsx:136-141 (two buttons only), :139 `aria-pressed={r === 'hinted' || r === 'failed'}`; leetcode-list.tsx:131-134 the Walkthrough `<a href={i.video} …>` records nothing (compare rep-workspace.tsx:610-615, where the walkthrough sets `solutionViewed: true` for in-app capstones); components/solve-log-view.tsx:196-200 options Unaided/Hinted/Failed; lib/course/credit.ts:88 `evidence: Evidence | 'outside-unaided' | 'outside-hinted'`; leetcode-list.tsx:50-54 tapping 'Needed help' on a 'failed' entry saves `result: 'hinted'`
- Detail: A small nudge, watching the full walkthrough and copying the editorial are all stored as 'hinted'. Today has no 'Failed' or 'saw the solution' button; 'failed' can only be set from /log. So any problem logged from Today is credited, and tapping 'Needed help' on a 'failed' entry upgrades it to a credited 'hinted'. The product's own flow for new problems ('attempt for up to 30 min, then study') leads straight to solution exposure, and the only honest button on Today then credits it.
- Suggested fix: Extend SolveResult to unaided | hinted (optionally with a hintLevel) | solution | failed. Add a 'Saw the solution' or 'Couldn't solve' button on Today. Mark the entry as solution-exposed when the Walkthrough link is opened before logging. Migrate existing 'hinted' entries conservatively, for example to hinted with an unknown severity.
- Verifier: I could not refute the claim. Every cited line matches the code, and I reproduced the behaviour end to end.

- lib/solve-log.ts:12 is exactly `export type SolveResult = 'unaided' | 'hinted' | 'failed'`. No value means "saw the solution".
- On Today, the course dashboard (components/course/course-dashboard.tsx:83) renders `<LeetcodeList items={listItems} heading="Outside problems today" />`. That list has only two result buttons: Unaided at leetcode-list.tsx:136-138 and "Needed help" at :139-141, which calls `set(i, 'hinted')` with `aria-pressed={r === 'hinted' || r === 'failed'}`.
- The Walkthrough link (:131-135) is a plain `<a href={i.video} target="_blank">` and records nothing. In-app capstones do record it: rep-workspace.tsx:610-615 `watchWalkthrough` sets `persist({ ...a, solutionViewed: true, ... })`.
- Only two components ever write solve entries: leetcode-list.tsx (via `set`) and solve-log-view.tsx (the /log form, options at :196-200). So 'failed' can only come from /log.
- Credit: credit.ts:105-107 skips only entries with `e.result === 'failed'` and pushes `'outside-unaided' : 'outside-hinted'` for the rest. use-credits.ts feeds that into `cd.doneToday` (use-course-day.ts:35,51), and that drives `complete = day.type === 'training' && done >= target` (course-today.tsx:68). So both Today buttons produce a full qualifying credit. The existing test lib/course/credit.test.ts:46-54 asserts this, and I ran it: it passes.
- The failed-to-hinted path: in `set` (leetcode-list.tsx:50-55), a prev result of 'failed' is not equal to 'hinted', so the code saves `{...prev, result: 'hinted'}` instead of toggling the entry off.
- I simulated the flow in a scratch script that imports the real `dailyCredits`. Needed help gives ['1:outside-hinted']. Changing it to Failed in /log gives []. Tapping the already-highlighted "Needed help" again gives 'hinted', credited. Failed plus rebuilt gives [].
- The step text for new problems is real: how() at :35 returns 'New · attempt for up to 30 min, then study'. Of 188 plan LeetCode items, 176 have a walkthrough video.

Severity stays major. §10 is the V2.1 "FIX 3" requirement, and the code materially fails its "at minimum, distinguish a small hint from material solution exposure" clause. The consequence, full daily credit for solution exposure while the same panel says "Not finished yet", also touches principles 6 and 12. But that part is the §10 credit-rule finding. As stated (evidence-model granularity plus Today's two buttons), the rubric's "materially fails a V2.1 requirement" fits. Corrected: The claim is accurate. Two precision notes and some supporting facts.

**Precision notes**
1. The spec asks for four minimum distinctions. Two of them do exist in the data. "Rebuild from blank" is the `rebuilt?: boolean` field (lib/solve-log.ts:29), toggled at leetcode-list.tsx:155. "Later cold solve" is the review1/review2/review3/redo kinds (solve-log.ts:38). The only distinction missing from the model is small hint vs material solution exposure, which matches the claim's headline.
2. "All stored as 'hinted'" holds for Today, where Needed help is the only help option. On /log a learner can choose 'Failed', which earns no credit. The Result select is not gated by `!editing` (solve-log-view.tsx:185-202), so a Today entry can be changed there too. There is still no 'solution viewed' value.

**Supporting facts the claim omits**
- **The UI contradicts the credit.** leetcode-list.tsx:148-152 shows "Not finished yet: rebuild it…" for hinted or failed new problems. Meanwhile credit.ts:105-107 gives 'hinted' a full credit toward `cd.doneToday` and "Day complete" (course-today.tsx:68).
- **No reconstruction credit.** `dailyCredits` ignores `rebuilt`. A 'failed' entry later marked rebuilt still earns nothing, and a 'hinted' entry earns full credit without a rebuild. The spec's ladder ("solution viewed: no credit; plus rebuild: reconstruction credit") does not exist. The rebuild toggle only appears for type 'new' items that have a target state (leetcode-list.tsx:83 and :148), never for re-solves or redos.
- **Help on outside problems isn't counted as help.** use-course-day.ts:36 counts only `'assisted' || 'reconstructed'` toward `assistedToday`. 'outside-hinted' credits are left out, so the "A lot of today needed help" Day-complete caveat (data/course/motivation.ts:89-91) never accounts for them.
- **The same event gets two meanings.** /log labels an in-app capstone with `solutionViewed` as 'Failed' (solve-log-view.tsx:91). Today sends a learner who watched the walkthrough to the credited 'hinted'.
- **The toggle behaves unexpectedly.** On a 'failed' entry, "Needed help" already shows as pressed (aria-pressed is true). Tapping it does not clear the entry: it re-saves the entry as a credited 'hinted'. A second tap removes the entry.

### 3. [MAJOR] 'Rebuilt from blank' is a dateless boolean, recordable only on the solve day, and never credited, shown or used as evidence — CONFIRMED (severity keep)
- Spec: §10 (Solution viewed + later rebuild from blank → reconstruction credit); §11 reconstructed category; §29 'reconstruction'
- Evidence: lib/solve-log.ts:28-29 `rebuilt?: boolean` (no date); components/leetcode-list.tsx:83 `const state = i.type === 'new' ? byLc.get(i.lc) : undefined`, :148 `{state && helped && entry && (`, :155 `save({ ...entry, rebuilt: !entry.rebuilt })`; lib/course/resolves.ts:56-57 a new item is listed only `if (!done || done.date === today)`; components/solve-log-view.tsx:39 and :172-214 have no rebuilt field and :58-71 never show it; `rebuilt` is referenced only in leetcode-list.tsx and solve-log.ts (credit.ts never reads it); components/course/readiness-report.tsx:69 'Rebuilt after a solution' = r.evidence.reconstructed (reps only); e2e/reps.spec.ts:231-232 only checks aria-pressed
- Detail: The panel and toggle exist only on the day of the first solve, because the next day the 'new' item leaves the list. They exist only for new problems with a bridge target: none of the 48 course targets get them on re-solves or redos, and LC 217, 1971 and 547 never get them. A rebuild done on a later day therefore cannot be recorded anywhere, since /log has no field for it. Toggling the flag changes no credit, no evidence and no readiness count. The heading still says 'Not finished yet' after 'Rebuilt from blank' is pressed (:150 is unconditional). The entry's `at` timestamp changes on any edit, so it cannot stand in for a rebuild date.
- Suggested fix: Record a rebuild as its own dated event, for example a `rebuild:<lc>:<date>` entry or `rebuiltOn: date`, that dailyCredits credits as 'reconstructed' on that date. Require it to be a different session or day from the solution exposure. Offer it from Today's re-solve list and from the /log form. Show it in the solve-log history and feed it into the readiness 'reconstructed' count.
- Verifier: Most of the claim holds up when checked against the code:
- lib/solve-log.ts:29 `rebuilt?: boolean` has no date.
- The only things that touch `rebuilt` are leetcode-list.tsx:155-156, solve-log.ts and the e2e button text.
- dailyCredits (credit.ts:104-108) credits outside entries by `result` alone.
- evidenceSummary (readiness.ts:71-90) counts reps attempts only, so readiness-report.tsx:69 'Rebuilt after a solution' = reconstructed reps.
- useTargets.firstSolve (use-targets.ts:50-52) reads `result` only.
- /log has no rebuilt field (solve-log-view.tsx:39, 172-214, 298-300) and does not show it in history (58-71).
- leetcode-list.tsx:150 'Not finished yet' is unconditional.
- save() resets `at` on every write (use-solve-log.ts:23).
- e2e/reps.spec.ts:231-232 only checks aria-pressed.
- 48 course targets confirmed (units.ts targets + readinessTargets). TARGET_BY_LC is missing 217, 1971 and 547, so those never get the panel. The panel is limited to type 'new' (leetcode-list.tsx:83).

The mechanism described ("recordable only on the solve day … cannot be recorded anywhere later") is wrong in both directions. I checked this with a throwaway tsx simulation using the real prescribe, courseLeetcode, dailyCredits, buildCalendar and leetcodeFor.

(1) On the course Today (CourseDashboard, from 2026-10-26) the panel never renders, not even on the solve day:
- Logging the problem puts its LC in solvedLc (use-course.ts:21: any kind:'new' entry, whatever the result).
- courseQueue then drops `lc:X:new` (routing.ts:225).
- useTodayPlan builds the done item without `lc` (use-today-plan.ts:91), and prescribe keeps it that way (today-plan.ts:110).
- So prescribedLc (course-dashboard.tsx:49 filters `i.lc`) loses X, and courseLeetcode (resolves.ts:54-57) never lists the row.
- Simulated with LC 128: before logging the list is [lc:128:new]; after 'Needed help' (hinted or failed) it is []. The row and its 'Add notes' link vanish.
- The `done.date === today` branch at resolves.ts:57 is dead in the app. Only resolves.test.ts:28 reaches it, by passing [125] as newToday by hand.

(2) The panel renders only on legacy surfaces:
- The 90-day Today before Oct 26. The e2e test runs on 2026-10-19, so it is pre-course, and the course path has no test.
- The legacy /day/<solve date> record page (day-view.tsx:247 → leetcodeFor on the pace-calendar record day, pace-calendar.ts:112). /progress still links to it from its '90 days' heatmap in course mode (progress-view.tsx:104).
- On that page the toggle can be pressed on any later day for 44 of the 48 course targets. The four exceptions are 217, 1971 and 547 (no bridge target) and 435 (no 90-day LC_META).

Minor: "never shown" overstates it, because the toggle's own label shows the state wherever the panel renders.

Severity stays major. §10/§29 require reconstruction credit (solution viewed, then later rebuilt). There is no SOLUTION_VIEWED or REBUILT distinction, the toggle can't be reached from the course Today, and it earns nothing. This under-credits rather than over-credits, so it is not critical. Corrected: The flag is a dateless boolean (lib/solve-log.ts:29). Nothing reads it: not credit (credit.ts:104-108 uses `result` only), not readiness evidence (readiness.ts:71-90 counts reps attempts only; readiness-report.tsx:69 shows reconstructed reps), not target status (use-targets.ts:50-52), and not /log (no form field at solve-log-view.tsx:39/172-214/298-300, not in rows 58-71; editing through /log keeps it only by spreading `...base`). The panel heading at leetcode-list.tsx:150 says 'Not finished yet' whether or not the flag is on. `at` is reset on every save (use-solve-log.ts:23). LC 217, 1971 and 547 have no bridge target, so they never get the panel. Re-solves and redos never get it either (leetcode-list.tsx:83).

Where the toggle can actually be used is not what the claim says:

(a) On the course Today (from 2026-10-26) the toggle can't be reached at all, not even on the solve day. Logging a new problem with any result adds its LC to solvedLc (components/use-course.ts:21). courseQueue then drops `lc:X:new` (lib/course/routing.ts:225). The done item is rebuilt without `lc` (components/use-today-plan.ts:91, lib/today-plan.ts:110), so `prescribedLc` (course-dashboard.tsx:49) loses it, and courseLeetcode (resolves.ts:54-57) never lists the row. Simulated with LC 128: the list is [lc:128:new] before 'Needed help' and [] after, for hinted or failed. The row, its 'Add notes' link and the rebuild panel disappear. The `done.date === today` branch at resolves.ts:57 is only reached by resolves.test.ts:28, which passes newToday in by hand.

(b) The panel renders only on legacy surfaces:
- The 90-day Today before Oct 26. This is what e2e/reps.spec.ts:181-237 tests, on 2026-10-19, so the course path has no test.
- The legacy /day/<solve date> record page (day-view.tsx:247 → pace-calendar.ts:112 → leetcodeFor), which /progress's '90 days' heatmap still links to in course mode (progress-view.tsx:104). There the flag can be toggled on any later day for 44 of the 48 course targets (all except 217, 1971, 547 and 435).

So a later rebuild can be recorded, but only through a legacy page, with no date, and it earns no reconstruction credit. The V2.1 §10/§29 reconstruction path is missing from the course product. Severity stays major.

### 4. [MAJOR] A later cold re-solve is credited exactly like a first solve, and outside evidence never reaches readiness — CONFIRMED (severity keep)
- Spec: §10 (Later cold re-solve → strongest evidence); §11 (later stronger evidence must upgrade the report)
- Evidence: lib/course/credit.ts:107 evidence depends only on `e.result` (`e.kind` is ignored); script: review1 and review3 'unaided' → 'outside-unaided', the same as a 'new' unaided solve; lib/course/readiness.ts:71 `export function evidenceSummary(attempts: Attempt[], exercises: Record<string, Exercise>, today: string)` takes no solve entries; components/use-course-day.ts:39 `evidenceSummary(attempts, EXERCISE_BY_ID, today)`; lib/solve-log.ts:94-99 unaidedRate is the only consumer that tells re-solves apart
- Detail: The data to identify a cold re-solve already exists (kind = review1, review2, review3 or redo), but the credit and evidence model collapses everything into 'outside-unaided' or 'outside-hinted'. A problem first logged with help and later re-solved cold three times never upgrades anywhere: the readiness report's evidence counts (Cold independent, Self-corrected, Assisted, 'Rebuilt after a solution') ignore every LeetCode outcome.
- Suggested fix: Map unaided review1-3 and redo entries to a distinct 'outside-cold' evidence, ranked strongest. Pass solve entries into evidenceSummary or readiness, and let a problem's best later evidence replace its first-attempt classification.
- Verifier: All cited lines match the code. I ran two throwaway scripts (both deleted) to check the behaviour.

Confirmed:
- lib/course/credit.ts:104-107 credits each logged outside entry once and picks its label only from the result: `evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted'`. Neither `e.kind` nor `e.rebuilt` is read anywhere in the credit or evidence code.
- In the script, a first solve logged with help and marked rebuilt (`rebuilt:true`) came out 'outside-hinted', a fresh unaided first solve came out 'outside-unaided', and three cold re-solves (review1, review2, review3) each came out 'outside-unaided', +1 per day. A cold re-solve is therefore credited exactly like a first unaided solve.
- The credit logic also disagrees with the UI. components/leetcode-list.tsx:150-152 tells the learner "Not finished yet ... It comes back cold in 3 days: that is the solve that counts", but the helped first solve already earned the same +1.
- `evidenceSummary` (lib/course/readiness.ts:71) takes no solve entries and is called with attempts only (components/use-course-day.ts:39). LeetCode outcomes never reach:
  - the report's four evidence counts (components/course/readiness-report.tsx:66-69; the label there is "Cold, independent", with a comma);
  - `recentAssistance` (readiness.ts:80-82);
  - domain statuses (`courseStatus`, called at components/use-course.ts:17-18, takes no entries);
  - `transferGrade`.
- With an empty attempts list the summary is all zeros, whatever the solve log contains.

Overstated:
1. "Outside evidence never reaches readiness" is not true as written. At use-course-day.ts:34 the finished-week statuses that `readiness()` reads come from `credits.byDate`, and that includes every outside credit. In the script, a Week 1 made up only of "Needed help" logs (63) made Week 1 'on-track'. The overall track went from off-track to at-risk, and the "Last week finished off track." reason disappeared, while every evidence count and `recentAssistance` stayed at 0. Outside work reaches readiness as raw output, with hinted counted the same as unaided, but never as evidence quality.
2. "unaidedRate is the only consumer that tells re-solves apart" and "never upgrades anywhere" are both too strong. `isResolve` also drives redo scheduling (lib/solve-log.ts:65, lib/course/resolves.ts:38). `unaidedRate` does rise with cold re-solves: 3 of 4 (75%) in the script. That figure is shown in four places:
   - the "Re-solves unaided" stat on Progress (components/progress-view.tsx:73);
   - the V1 checkpoint row (lib/progress-90.ts:111);
   - the LeetCode list header (components/leetcode-list.tsx:73);
   - the solve log (components/solve-log-view.tsx:133).

   What never upgrades is the credit label, the Feb 1 readiness report, and each target's first-solve and conversion status (components/use-targets.ts:49-52 reads only `lc:<n>:new`).

Severity stays major. This materially fails §10 ("later cold re-solve → strongest evidence") and the §11 upgrade rule. Crediting "Needed help" logs is the separate §10 headline problem.

Already correct, so not to rebuild:
- The solve log already records what is needed to tell re-solves apart: `kind` is review1, review2, review3 or redo, and `rebuilt` exists.
- `unaidedRate` already isolates re-solves.
- `masteryEvidence` (credit.ts:49-60) already classifies a later clean cold pass on an in-app rep as 'cold-independent' (checked in the script).
- Failed outside entries already earn no credit (credit.ts:105). Corrected: Accurate version (major): The credit model ignores the kind of outside solve, but outside work does reach readiness, as volume only.

1. A cold re-solve is credited exactly like a first solve, and "rebuilt" is ignored. lib/course/credit.ts:107 sets `evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted'`. Neither `e.kind` (review1, review2, review3, redo) nor `e.rebuilt` (lib/solve-log.ts:29, set at components/leetcode-list.tsx:155) is read anywhere in credit or evidence.
   - Verified: new+hinted+rebuilt → 'outside-hinted'; new+unaided → 'outside-unaided'; review1, review2 and review3 unaided → 'outside-unaided'. Each is +1 that day.
   - This contradicts components/leetcode-list.tsx:150-152: "Not finished yet ... It comes back cold in 3 days: that is the solve that counts."

2. The readiness evidence model is blind to LeetCode. `evidenceSummary(attempts, exercises, today)` (lib/course/readiness.ts:71) has no solve-log input and is called with attempts only (components/use-course-day.ts:39). LeetCode outcomes never reach:
   - the report's counts "Cold, independent", "Self-corrected", "Assisted" and "Rebuilt after a solution" (components/course/readiness-report.tsx:66-69);
   - `recentAssistance` (readiness.ts:80-82);
   - domain statuses (`courseStatus` takes no entries, components/use-course.ts:17-18);
   - `transferGrade`.

3. Correction to "never reaches readiness". Outside credits do reach `readiness()` through weekly output: use-course-day.ts:34 builds the finished-week statuses from `credits.byDate`, which includes every outside credit, hinted the same as unaided.
   - Verified with no attempts and today 2026-11-03: logging Week 1 only as "Needed help" (63 entries) turns Week 1 'on-track'.
   - The track moves from off-track to at-risk and drops the "Last week finished off track." reason.
   - All four evidence counts and `recentAssistance` stay 0.
   - So assisted LeetCode volume can improve the track while the assistance check never sees it.

4. Correction to "unaidedRate is the only consumer" and "never upgrades anywhere". `isResolve` also drives redo scheduling (lib/solve-log.ts:65, lib/course/resolves.ts:38). `unaidedRate` does rise with cold re-solves (three cold re-solves → 3 of 4, 75%). It is shown in four places:
   - the "Re-solves unaided" stat on Progress (components/progress-view.tsx:73);
   - the V1 checkpoint row (lib/progress-90.ts:111);
   - the LeetCode list header (components/leetcode-list.tsx:73);
   - the solve log (components/solve-log-view.tsx:133).

   What never upgrades: the credit label, the Feb 1 readiness report, and the per-target first-solve and conversion status (components/use-targets.ts:49-52 reads only `lc:<n>:new`).

5. The §11 upgrade failure is broader than outside evidence. `evidenceSummary` keeps only the first passed attempt it meets for each exercise (readiness.ts:74-78, the `seen` set).
   - Verified: an in-app capstone (cap-contains-duplicate) passed with hints and later passed cold gives assisted=1, coldIndependent=0 when attempts are in chronological order, and coldIndependent=1 only if the order is reversed.
   - The array is in Map insertion order. After a reload it follows IndexedDB key order of random-UUID attempt ids (lib/storage/local.ts:19,27; lib/sessions.ts:13-14), so which pass is kept is effectively arbitrary.
   - Feeding LeetCode outcomes into the report alone would therefore not satisfy §11's "later stronger evidence must upgrade the report".

### 5. [MAJOR] The rep pass panel always shows '+1 rep', even for passes that earn no credit — CONFIRMED (severity raise)
- Spec: §10 ('The UI and the credit logic must agree'); §2 principle 12; §19
- Evidence: components/rep/rep-workspace.tsx:1392-1394 unconditional `Rep complete{runItBack ? ' · reconstructed' : ''}` … `+1 rep`; rep-workspace.tsx:973 on lab parts: "Labs are done or not done; their builds are not counted as reps."; lib/course/credit.ts:64-66 (lab, non-production kinds and solutionViewed do not qualify) and :100 (same-day repeat); components/use-credits.ts:17 passes the static `EXERCISE_BY_ID`, while generated reps are resolved from `repo.generated()` (lib/sessions.ts:28-29), so script: 'gen-123' → 0 credits
- Detail: The badge appears on choice passes, lab build and change-request passes, passes after 'Show solution', second and later passes of the same rep that day, and every 'Another / Easier / Harder rep' (gen-*) pass. All of them earn 0 in dailyCredits, so the Today counter does not move. On a lab part the page says the build is not counted, then shows '+1 rep' on the same screen.
- Suggested fix: Compute the badge from credit.ts: `qualifies(attempt, exercise)` and not already credited for that exercise today. When the pass does not count, show the reason instead ('Not counted: solution shown', 'recognition', 'lab part', 'already counted today', 'generated practice'). Separately, decide whether generated drills should qualify and, if so, pass findExercise-resolved exercises into dailyCredits.
- Verifier: I read the code end to end and ran a throwaway credit simulation (written to scripts/, run, then deleted). The claim holds.

**What the pass panel does**
- In components/rep/rep-workspace.tsx the panel renders whenever `passed` (`phase === 'passed'`, lines 810 and 1381). The badge is unconditional: line 1392 `Rep complete{runItBack ? ' · reconstructed' : ''}` and line 1394 `+1 rep`.
- Nothing in the workspace consults lib/course/credit.ts. The V2 master spec §55 forbids this: "Do not let different pages independently invent what 'counts.'"

**What actually counts in the course**
- Today's counter is labelled in reps: "${target} reps", "{done} / {target}", aria "Today: X of Y reps" (components/course/course-today.tsx:177, 192–194).
- `done` is `cd.doneToday = credits.items[today].length` (components/use-course-day.ts:35, 51).
- The plan's done-set uses the same credit filter (components/use-today-plan.ts:93–95).
- So "+1 rep" uses the unit of the credit counter, and it is false whenever `dailyCredits` adds nothing.

**Each case, checked**
- **Multiple choice.** `PRODUCTION` excludes `'choice'` (credit.ts:37, 65). There are 13 choice reps, all on required course paths: Week 2 has 5, Week 8 has 1, Week 14 has 7. Credits: 0.
- **Labs.** credit.ts:64 `if (!exercise || exercise.lab) return false`. All 46 lab exercises (23 labs, build plus change request) carry `lab: true`. They open in the rep workspace via components/course/lab-view.tsx:69 and :78. The note at rep-workspace.tsx:967–975 is not gated on `!passed`. So after a pass, "Labs are done or not done; their builds are not counted as reps." and "+1 rep" are on screen together. Credits: 0.
- **Show solution.** `viewSolution` persists `solutionViewed: true` on the live attempt (617–624), and `qualifies` rejects it (credit.ts:66). Credits: 0. On checkpoint ("cleanPass") reps outside a session it gets worse:
  - the menu says "Show solution (won't count)" (1489);
  - the pass panel then shows "+1 rep" right next to "Not cleared yet: the solution was open…" (1436).
- **Same-day repeats.** credit.ts:100 skips an exercise already credited that day. The simulation gave clean pass then Run it back → 2 passes, 1 credit.
- **Generated reps.** "Another rep" (1427) and Another / Easier / Harder (1471–1479) create `gen-<uuid>` ids (lib/coach/client.ts:133). The workspace resolves these through `repo.generated()` (lib/sessions.ts:28–29). components/use-credits.ts:17 passes the static `EXERCISE_BY_ID`, which holds no `gen-` ids, so `qualifies` sees `undefined` and returns false. Credits: 0.

The project's own docs/reps-2.md:35 states: "A shown solution earns nothing… Labs and multiple choice never count." The badge contradicts it.

**Severity: raise to critical**
- The rubric makes "untruthful" or "violates a non-negotiable principle" critical.
- A "+1 rep" reward for work that earns nothing is a false statement about progress (§2 principle 12). It is also a gamified reward for non-production (principle 11).
- It fires on frequent paths. The panel itself pushes Run it back: the button gets accent styling after an assisted pass (1424, 1438), and an assisted pass has already been credited. "Another rep" is on every pass panel.
- It sits next to on-screen copy that says the opposite.
- This is the §10 failure ("The UI and the credit logic must agree") in reverse.
- Mitigating factor: the authoritative Today, week, streak and flame counters are correct, so stored progress is not corrupted. If critical is reserved for wrong authoritative state, major is the floor. Corrected: The claim is accurate. The badge is unconditional at components/rep/rep-workspace.tsx:1392–1394 (`Rep complete{runItBack ? ' · reconstructed' : ''}` … `+1 rep`), inside the `{passed ? (` branch at 1381. The workspace never asks lib/course/credit.ts whether the pass counts.

From COURSE_START (2026-10-26; components/dashboard.tsx:52 switches to CourseDashboard), Today's "N reps" counter is `credits.items[today].length` (components/use-course-day.ts:35, 51; components/course/course-today.tsx:177, 192–194). It does not move for any of these:
- **Multiple choice:** credit.ts:37, 65. 13 such reps, all on required paths (Week 2: 5, Week 8: 1, Week 14: 7).
- **Labs:** credit.ts:64. 46 lab build and change-request exercises, opened from components/course/lab-view.tsx:69 and :78.
- **Passes after Show solution or after watching the walkthrough:** rep-workspace.tsx:613–614 and 622–623 set `solutionViewed`; credit.ts:66 rejects it.
- **Repeat passes after an already-credited pass that day:** credit.ts:100.
- **Every `gen-*` rep:** ids come from lib/coach/client.ts:133; components/use-credits.ts:17 passes the static `EXERCISE_BY_ID`. The exclusion is a side effect of that map, not a stated rule; `qualifies` would return true if given the generated exercise.

**Where the claim needs narrowing**
1. **Repeats.** "Second and later passes earn 0" is too broad. A later pass earns 0 only when an earlier pass that day already qualified.
   - Revealed pass, then Run it back the same day: the run-it-back pass is credited as 'reconstructed'. That badge is truthful; the earlier revealed pass's badge was not.
   - The common false case is a clean or hinted pass followed by Run it back, which the panel encourages (1424, 1438). That shows "Rep complete · reconstructed +1 rep" for 0 credit. The "reconstructed" label is also wrong there: `runItBack` only sets retrievalType 'immediate-reconstruction' (lib/progress.ts:193), while `masteryEvidence` returns 'reconstructed' only after a reveal.
2. **Before the course.** "Today counter does not move" applies from 2026-10-26. Before then (today is 2026-10-23) the legacy DashboardToday counts the first pass of any rep per day (components/use-today-plan.ts:85–95, where `counted` is null). In that window the badge is wrong only for same-day repeats.

**Same-screen contradictions**
- **Lab parts:** the note at 967–975 is not gated on `!passed`, so it shows beside "+1 rep".
- **Checkpoint ("cleanPass") reps outside a session:** "Show solution (won't count)" (1489), then "+1 rep" beside "Not cleared yet: the solution was open…" (1436).

The badge also contradicts docs/reps-2.md:35 and the V2 master spec §13 and §55.

### 6. [MAJOR] 'Run it back' immediately after a revealed solution earns full credit the same day, then upgrades the next cold pass to 'retrieval' — CONFIRMED (severity keep)
- Spec: §10 (solution viewed does not qualify yet; reconstruction only on a later rebuild); REPS_2_MASTER_SPEC §13 ('copying a solution' does not count; 'later successful reconstruction' does), §55 (test immediate reconstruction)
- Evidence: components/rep/rep-workspace.tsx:628-636 doRunItBack: `attemptRef.current = null` … `setSolutionShown(false)` creates a new attempt with solutionViewed:false; lib/progress.ts:193 `if (opts.runItBack) return 'immediate-reconstruction'`; rep-workspace.tsx:1424 highlights 'Run it back' with btn-accent after help and :1438 prompts to use it; lib/course/credit.ts:63-67 `qualifies` ignores retrievalType; :47 `const clean = (a) => passedAttempt(a) && a.hintsUsed === 0 && !a.solutionViewed` counts the run-it-back as clean; :55 and :57; lib/course/credit.test.ts:26 claims "Immediate reconstruction in the same attempt is the revealed attempt itself: no credit"
- Detail: Script results: a reveal at 10:00 followed by Run it back at 10:04 is credited the same day as 'reconstructed'. Because that immediate copy is 'clean', a cold pass the next day is classified 'retrieval' with coldEvidence and gateClean both true. Without the run-it-back, the same pass is 'reconstructed' with both false. On capstones, which count as full problems in readiness.ts:72, this inflates the readiness bucket 'Cold, independent' (readiness.ts:84). The UI actively pushes this path, and no test covers it.
- Suggested fix: In qualifies(), deny credit to 'immediate-reconstruction' passes, or to any pass made the same day as or within N hours of a reveal on that exercise. In masteryEvidence, exclude immediate-reconstruction passes from `clean`, so the first later pass after a reveal stays 'reconstructed'. Add the §55 immediate-reconstruction and later-cold-reconstruction tests using a separate run-it-back attempt.
- Verifier: I could not refute the mechanism. Every cited line matches the code, and I reproduced the numbers with throwaway scripts that import lib/course/credit.ts and lib/course/readiness.ts.

Path through the code:
1. In components/rep/rep-workspace.tsx, doRunItBack (628-650) runs `attemptRef.current = null`, `startedAt.current = new Date()`, `setRunItBack(true)`, `setHintsShown(0)`, `setSolutionShown(false)` and `setCode(blankStarter(ex))`.
2. The retrievalType memo (310-315) becomes 'immediate-reconstruction' (lib/progress.ts:193).
3. ensureAttempt (389-409) then writes a new attempt with `hintsUsed: 0, solutionViewed: false`.
4. lib/course/credit.ts never reads 'immediate-reconstruction'. `qualifies` (63-67) is `passedAttempt(a) && !a.solutionViewed`, and `clean` (47) treats the run-it-back as clean.

Script results:
- Reveal and pass at 10:00, then Run it back at 10:04: dailyCredits gives `[{key:'cap',evidence:'reconstructed'}]`. Without the run-it-back there is no credit.
- A cold pass the next day: with the run-it-back it is 'retrieval' (coldEvidence true, gateClean true). Without it, it is 'reconstructed' (both false).
- credit.test.ts has no attempt with retrievalType 'immediate-reconstruction'. Line 26 is only a comment, so the "immediate reconstruction" test that master §55 requires is missing.
- The UI pushes this path. The button is accented at 1424 (`(assisted && !runItBack) ... 'btn-accent'`), and 1438 says "You used help. Close the explanation and run it back from memory."

Some parts of the claim are overstated:
- coldEvidence has no production caller; only credit.test.ts uses it.
- The gateClean upgrade cannot be reached for gates. Gate variants are `checkpoint` reps (825), and the Show solution item needs `!checkpoint` (1489). e2e/course.spec.ts:101 asserts there is no Show solution on a checkpoint. The walkthrough needs `!bare` (1045), and after a pass the menu is replaced by the passed panel.
- The 'Cold, independent' inflation depends on array order. evidenceSummary counts only the first passed attempt per exercise in array order (readiness.ts:74-77). That array is in Map insertion order (sync.ts:59), filled from IndexedDB keyed by random UUID (local.ts:19, sessions.ts:14). In chronological order the revealed pass is the one counted, which lands in no bucket. Only [cold, revealed, rb] gave coldIndependent 1; without the run-it-back that order gives reconstructed 1.
- Same-day credit for a rebuild from blank is arguably allowed by the spec text. Master §13 counts a "later successful reconstruction after a previously viewed solution". V2.1 §10 is about outside LeetCode problems, and it gives "rebuild from blank → reconstruction credit". The credit is labelled 'reconstructed' and is counted in assistedToday (use-course-day.ts:36).

Some effects are understated, and they come from the same cause:
- A second Run it back in the same sitting (10:07) comes out 'independent' with gateClean true.
- A hinted pass followed by Run it back comes out 'independent'.
- Run-it-backs dilute recentAssistance (readiness.ts:81-82). If every solution is revealed, one run-it-back each brings it from 1.00 (off-track) to 0.50 (at-risk), and two bring it to 0.33. The report at :156 then says "50%/33% of recent passes needed help" when all of them did.

Overall the claim is major: some effects are overstated (gates, coldEvidence) and others understated (dilution, the second run-it-back), so I am keeping the severity. Corrected: Root cause: lib/course/credit.ts ignores retrievalType 'immediate-reconstruction'. A Run it back attempt (rep-workspace.tsx:628-650 → progress.ts:193 → ensureAttempt at 389-409, which writes `hintsUsed:0, solutionViewed:false`) counts as an ordinary `clean` pass (credit.ts:47). An immediate rebuild a few minutes after reading the solution therefore uses up the "reconstruction" step that master §13 says must come later ("cannot immediately become independent mastery; the learner must later reconstruct"). The §55 "immediate reconstruction" case is never told apart from a later one, and no test covers it (credit.test.ts:26 is only a comment).

Verified effects:
(1) A reveal, then Run it back 4 minutes later, earns the day's single credit as 'reconstructed' (it would earn 0 otherwise). The spec text arguably allows this as a rebuild from blank, so it is not the core defect.
(2) The next-day cold pass becomes 'retrieval' instead of 'reconstructed', and its day-2 credit is labelled 'retrieval'. That pass therefore drops out of assistedToday (use-course-day.ts:36). It also contradicts the capstone copy at rep-workspace.tsx:1073 ("the cold re-solve in 3 days is the one that counts").
(3) Not in the claim: a second Run it back in the same sitting is 'independent', and a hinted pass followed by Run it back is 'independent'. This is assistance shown as independence.
(4) Not in the claim, and not order-dependent: run-it-back passes dilute readiness.ts:81-82 recentAssistance. A learner who reveals every solution shows 50% after one run-it-back each (at-risk, not off-track) and 33% after two, and :156 states that understated percentage.

Overstated parts of the claim:
- coldEvidence has no production caller.
- gateClean cannot be reached through this path, because checkpoints hide Show solution (rep-workspace.tsx:1489 `!checkpoint`, e2e/course.spec.ts:101) and the walkthrough (1045 `!bare`).
- The 'Cold, independent' inflation (readiness.ts:84) happens only when the later pass is first in the arbitrary attempts order: evidenceSummary keeps the first passed attempt per exercise in that order (readiness.ts:74-77; Map/IndexedDB UUID order, sync.ts:59, local.ts:19). In chronological order the revealed pass is counted, which lands in no bucket.

Adjacent untruthful UI, not part of this claim: the passed panel shows "+1 rep" unconditionally (1393-1395), even on a revealed pass that earns 0. The solution copy at 1194-1196 says "counts as assisted" / "reduced credit", but the credit logic gives none.

### 7. [MAJOR] Explain reps count as full qualifying production on a self-ticked rubric and are classified as cold-independent full-problem evidence — CONFIRMED (severity keep)
- Spec: §2 principles 6 and 11; §11 (no stronger language than evidence supports); REPS_2_MASTER_SPEC §13 (explanation counts only 'when explicitly authored as active production')
- Evidence: lib/course/credit.ts:37 `const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']`; components/rep/rep-workspace.tsx:538-541 `if (explainText.trim().length < 40) …` `const need = Math.ceil((ex.rubric?.length ?? 1) * 0.6)` `finish(covered >= need, …)`; the AI checkExplanation at :788-799 is optional and never gates the pass; data/exercises/build.ts:137-138 explain defaults to `stage: 'interview', repType: 'interview'`; lib/course/readiness.ts:72 `full` includes `e.stage === 'interview'`, and :84 folds 'independent' into coldIndependent
- Detail: Any 40 characters plus ticking 3 of 5 checkboxes passes. The pass earns a daily credit, gets masteryEvidence 'independent' (or 'cold-independent'), and counts as full-problem 'Cold, independent' evidence in the readiness report. There is no per-rep 'authored as active production' flag. All 32 explain reps are in required unit paths: W2 4, W3 3, W4 2, W5 3, W7 3, W8 4, W9 3, W10 1, W11 3, W14 6.
- Suggested fix: Credit an explain rep only when the rubric is verified, for example by requiring the AI check's `met` to clear the threshold, or by allowing it only on reps authored with an explicit `production: true`. Classify self-checked explanations as their own evidence type, separate from independence, and leave them out of the full-problem readiness counts.
- Verifier: I could not refute any part of the claim. I read each cited path end to end and checked the numbers with a throwaway script, which I deleted afterwards.

1. Credit: lib/course/credit.ts:37 has `const PRODUCTION ... = ['code', 'output', 'reorder', 'explain']`. qualifies() (:63-67) only checks lab, kind, passed and !solutionViewed. A simulated first pass of o2-cap-contains-duplicate-explain gave qualifies=true and one dailyCredits item with evidence 'independent'. When all 32 explain reps pass on one day, the result is 32 credits.

2. Pass rule: components/rep/rep-workspace.tsx:538-541 is the only gate: `if (explainText.trim().length < 40) return ...`, then `const need = Math.ceil((ex.rubric?.length ?? 1) * 0.6)`, then `finish(covered >= need, ...)`. `covered` counts the self-ticked boxes. The Submit button (:1505) is disabled only while running. checkExplanation (:788-800) only sets aiMet and aiFeedback. In answer-inputs.tsx:178 those are shown as '✓ covered' / '○ missing' labels and never change rubricChecked or the pass. Rubric sizes: 28 reps have 5 items (need 3) and 4 reps have 4 items (need 3).

3. Classification: all 32 explain reps keep the builder defaults (data/exercises/build.ts:137-138), so every one is stage 'interview' / repType 'interview' with no gate, transfer or lab flags. On a first attempt, retrievalTypeFor (lib/progress.ts:192-199) returns 'first-exposure', so masteryEvidence gives 'independent'. It gives 'cold-independent' only after a failed attempt at least 12h earlier, and 'self-corrected' if the first submit had too few ticks. readiness.ts:72 includes `e.stage === 'interview'` in `full`, and :84 folds independent and retrieval into coldIndependent. readiness-report.tsx:66 renders that number as 'Cold, independent', with the footnote at :77: 'Full problems only: capstones, checkpoints, unlabeled and interview problems.' In the simulation, one explain pass gave coldIndependent: 1 and all 32 gave coldIndependent: 32.

4. Flag: the Exercise type in lib/types.ts:81-134 has no field that marks a rep as active production. Every explain rep counts because of its kind.

5. Placement: the per-week counts are exactly right (W2 4, W3 3, W4 2, W5 3, W7 3, W8 4, W9 3, W10 1, W11 3, W14 6), all in unit.sections (the required path), with none in optional sections or gate pools.

Severity: major is right. It materially fails §11 ('no stronger language than the evidence supports') and principles 6 and 11. It is not critical, because readiness() (:141-161) and finalDecision() (:166-171) never read the evidence counts. The track, domain statuses and the Feb 1 decision are unchanged. The inflation is limited to the evidence tiles, daily and weekly credit (at most 6 per week, 32 in total), and skill mastery. Corrected: The claim is accurate. Corrections and additional evidence:

(a) "3 of 5" applies to 28 reps. The other 4 have 4-item rubrics and need 3 of 4. The text check is `trim().length < 40`, so any 40 characters pass it.

(b) On a first attempt the evidence is 'independent', not 'cold-independent'. It shows as "Cold, independent" only because readiness.ts:84 lumps 'independent' and 'retrieval' into that tile. That lumping is itself a separate §11 defect, and it makes this one worse.

(c) A stronger point the claim missed: the rubric is effectively the answer key, and it is visible before submission. answer-inputs.tsx:171-181 renders every rubric line (for example 'Improvement: dict from value to index; complement = target - num looked up in O(1)' in o2-cap-two-sum-explain, data/exercises/oct02.ts:3137-3143) next to the textarea, in every mode. A learner can paraphrase the answer key, tick 3 boxes and get '+1 rep' (rep-workspace.tsx:1394) plus "Cold, independent" full-problem evidence. That is close to "copying a solution", which REPS_2_MASTER_SPEC §13 says does not count.

(d) The repo contradicts itself:
- lib/curriculum-audit.ts:127 `if (b === 'choice' || b === 'output' || b === 'explain') return 'passive'` classifies all 32 as passive.
- data/curriculum.ts:63,71 (`return e.kind === 'explain' || index > lastCap`) made capstone explain reps extra in the legacy calendar. V2 units pull in the raw sections through SECTION_BY_ID, which turns them into required work.
- lib/sessions.ts:52,86 exclude `e.kind !== 'explain'` when picking "production reps".
Only credit.ts:37 treats them as production.

(e) Scale: explain reps are 32 of the 242 full-evidence reps that can be reached through unit paths and gate pools. In the required path for each week they make up 6/16 in W14, 3/9 in W9, 4/13 in W2 and 4/14 in W8.

(f) A further effect: lib/mastery.ts:52 gives stage 'interview' a weight of 1.2 (more than microbuild at 1.0 and debug at 1.15), and :127 lifts the recognition-only cap. So a self-ticked explanation raises skill mastery (for example hash_reasoning and complexity) more than writing code from a signature. That mastery feeds routing.ts:132-133 placement and priorEvidence.

(g) Limit on impact: readiness track, domain statuses and finalDecision do not read the evidence counts, so the Feb 1 verdict itself is not changed. That is why this is major and not critical.

Already correct:
- The AI check exists (requestExplanationCheck).
- Viewing the solution removes credit for that attempt (credit.ts:66).
- A hint taken from the More menu in interview mode is counted as assisted.
- Explain reps are never gate variants.

### 8. [MAJOR] Outside credits are keyed by entry id, not by problem, and dates are unbounded: duplicate and back- or future-dated credit — CONFIRMED (severity keep)
- Spec: §10; §2 principles 11 and 12; REPS_2_MASTER_SPEC §13 ('repeating the same completed rep multiple times on the same day' does not count)
- Evidence: lib/course/credit.ts:105-106 `seen.has(e.id)` / `seen.add(e.id)`; components/solve-log-view.tsx:109 `id: \`out:${crypto.randomUUID()}\`` for every manual log; :188 `<input className="input" type="date" required {...field('date')} />` with no min or max; :110-120 Edit rewrites `date` and `result` of any entry; lib/course/resolves.ts:34 `add` dedupes by solveId only
- Detail: Script results: LC 1 logged once from Today (lc:1:new) and three times from /log (out:<uuid>) on the same day earns 4 credits, enough to complete half of a Week 1 day with one problem. Logging a plan problem again on /log (instead of 'Add notes') double-counts it by accident. An entry dated a past day adds credit to that day, which can turn it 'complete' and repair the streak after the fact. A future-dated entry fills that day's credits in advance. Editing hinted to unaided, or failed to hinted, rewrites history. A redo:<lc>:<due> and a lc:<lc>:reviewK can also both be due and credited for the same LC on the same day.
- Suggested fix: Deduplicate outside credit by (date, lc) and keep the strongest evidence. Clamp the /log date to [COURSE_START, today]. Store entry creation separately from the solve date, and decide whether back-dated entries can change streaks. When a plan or target LC is logged manually, write it under its plan id instead of out:<uuid>.
- Verifier: I tried to refute this and couldn't. Every cited line is accurate, and a throwaway script reproduced each scenario. I ran it as scripts/_audit_skeptic_outside.ts and deleted it straight after. I did not touch scripts/_audit_routing_sim2.ts, which was already untracked.

How the code behaves:
- **Credit is counted per entry.** In lib/course/credit.ts:105-107, `if (e.date !== date || !e.lc || e.result === 'failed' || seen.has(e.id)) continue; seen.add(e.id)`. Each entry already has a unique id because it is stored as `solve:<id>`, so this check never removes a duplicate. Nothing checks for the same `lc` twice on one date. The module's own header (lines 12 and 92-93) says "an outside problem ... counts once" and "each logged outside problem once", so the code breaks its own rule. It also breaks REPS_2_MASTER_SPEC §13 (line 623), which says repeating the same completed rep multiple times on the same day does not count.
- **Every manual log creates a new entry.** In components/solve-log-view.tsx:109, `const base = editing ?? { id: \`out:${crypto.randomUUID()}\`, kind: 'outside' as const }`. Lines 112-115 save `lc`, `date: form.date` and `result: form.result` with no validation. Line 188 is `<input className="input" type="date" required {...field('date')} />` with no min or max, and use-solve-log.ts:23 and repository.ts:167 do not validate either. The only safeguard is the explanatory copy at lines 130 and 171.
- **Dates feed every past day.** components/use-credits.ts:17 computes `dailyCredits(d, ...)` for every date from COURSE_START to today. That feeds Today (course-today.tsx:67-68 `complete = day.type === 'training' && done >= target`), the streak (week-status.ts:101-110), `weekProgress` `daysComplete` and `status` (week-status.ts:64, 86), the road map, and the finished-week statuses that readiness uses (use-course-day.ts:34; readiness.ts:155).
- **Redo and re-solve can stack.** lib/course/resolves.ts:34 removes duplicates by `solveId` only, so a redo and a spaced re-solve of the same LC can both be listed and both credited.

Script results (Week 1 target is 10):
- **A.** `lc:1:new` plus three `out:` entries for LC 1 on one day gave 4 credits. Ten `/log` entries of LC 1 on 2026-10-28 gave 10/10, so the day was complete.
- **B.** On 2026-10-29, backfilling ten LC 7 entries dated 10-27 raised the streak from 1 to 3. Week 1 `daysComplete` went from 2 to 3 and status from recoverable to on-track.
- **C.** Ten entries dated 10-30 are invisible on 10-29, then count as 10 credits as soon as 10-30 arrives.
- **D.** With `lc:1:new` on 10-26 and review1 logged 'hinted' late on 11-04, the 11-05 list is `[redo:1:2026-11-05, lc:1:review2]` and logging both gives 2 credits. If review1 is logged on time and the redo is skipped, 11-05 lists `[redo:2:2026-10-30, lc:2:review2]`.
- **E.** Editing a failed entry to hinted on a past day changes that day's credit from 0 to 1.

There is also a path the auditor missed. 25 capstone reps map to LeetCode numbers, for example `cap-two-sum` is LC 1. Passing the capstone in Reps (key `cap-two-sum`) and logging LC 1 on the same day earns 2 credits for one problem.

I'm keeping the severity at major rather than raising it to critical. The main one-tap Today flow (leetcode-list.tsx:54) always uses today's date and one id per plan item. Inflation needs the manual `/log` path, an edit, or the redo/review overlap. Still, the problem is real: a day, a streak, a week's status and the readiness text can all be reached without real output. That goes against principles 11 and 12 and §7's single truthful definition of "done for today". Corrected: The claim is accurate, with these corrections.

1. **The arithmetic and the Week 1 example are slightly off.** 4 credits is 40% of a Week 1 day (target 10), not half. Also, Weeks 1-2 are the 'foundation' phase (lib/course/capacity.ts:12). In that phase, new LC problems are never offered on Today (lib/today-plan.ts:130), so `lc:1:new` cannot be logged from Today in Week 1. The correct example is that ten `/log` entries of LC 1 alone complete a Week 1 day.

2. **Same-problem credit is unbounded.** In lib/course/credit.ts:105-107, credit is counted per entry id. Any number of `out:<uuid>` entries for the same LC on the same date each count as 1. This breaks REPS_2_MASTER_SPEC §13 and the module's own "counts once" comment. Two more routes give the same LC two credits on one day:
   - a redo and a spaced re-solve both due (lib/course/resolves.ts:34 removes duplicates by `solveId` only), for example after a late hinted review1, or an overdue redo plus review2;
   - an in-app capstone pass (for example `cap-two-sum`, which is LC 1) plus a log of the same LC.

3. **Dates are unbounded, but only through /log.** The date input at components/solve-log-view.tsx:188 has no min or max, and `submit` (lines 109-120) does not validate. Today's buttons always use `today`. The effects:
   - Back-dating changes past days retroactively: completed days, the streak, week status, and the finished-week status in the readiness text. Nothing marks such an entry as logged late; the `at` timestamp is ignored.
   - Back-dating itself can be an honest late log. The defect is that it is unlimited and unmarked.
   - Future-dated entries do not show until their date, because use-credits.ts:17 only computes up to today. On that date they count straight away.

4. **The editing point is the weakest part.**
   - Changing hinted to unaided does not change the credit count, since both count. It changes the evidence label, removes the pending redo (lib/solve-log.ts:65 and resolves.ts:38 only create redos for non-unaided results), and raises the unaided rate. Today's own toggle (leetcode-list.tsx:50-55) also allows this flip for today's entries.
   - Changing failed to hinted, or moving an entry's date, does add or move credit.
   - Being able to correct a log is legitimate. The real gap is that edits have no limits and leave no audit trail.

### 9. [MAJOR] Choice reps sit in required unit paths but never earn credit; 7 Week 14 choice reps show on Today as required 'Checkpoint' items — CONFIRMED (severity keep)
- Spec: §7 daily completion contract; §8 (the required path must fit the qualifying contract)
- Evidence: lib/course/credit.ts:37/:65 (choice is not production); lib/course/routing.ts:148 `const pathDone = full.every((e) => passed.has(e.id))` and :218 queue path reps until passed; routing.ts:194 `if (e.repType === 'cold' || e.stage === 'retrieval') return 'gate'` with data/exercises/oct11.ts:19 `const R = { stage: 'retrieval', repType: 'cold' }` and :1221 `const BIG_O = { stage: 'retrieval', repType: 'cold' }`; components/use-today-plan.ts:65 `required: q.purpose === 'gate' || q.purpose === 'repair'`; components/course/course-today.tsx:42 `gate: 'Checkpoint'`; use-today-plan.ts:94-95 removes items that earned no credit from doneToday
- Detail: 13 choice reps are in required unit paths: W2 has o2-list-literal, o2-set-empty, o2-drev-crash, o2-dl-empty and o2-dl-crash; W8 has o7-dq-why-not-pop0; W14 has o11-speed-slicing, o11-cx-heap-k, o11-cx-subsets, o11-cx-memo, o11-cx-tree-space, o11-cx-grid-bfs and o11-cx-pop-front. Unit completion requires them, yet passing one does not move the day count. On Today the item disappears instead of being ticked (it leaves the queue once passed, and doneToday drops it), and the slot is refilled, so the learner silently does extra work. The 7 W14 reps are labeled 'Checkpoint' with the WHY copy 'Passing it unlocks what comes next', and are marked required, although they are not gates and never count.
- Suggested fix: Move recognition reps out of required paths into optional or lesson material. Alternatively, have the plan show them as non-counting 'learn' items that tick off without credit. In purposeOf, return 'gate' only for real gate-pool exercises (GATE_OF_EXERCISE), not for every repType 'cold' or stage 'retrieval' rep.
- Verifier: Every cited line checks out. lib/course/credit.ts:37 `const PRODUCTION = ['code','output','reorder','explain']` and :65 `if (!PRODUCTION.includes(exercise.kind)) return false` mean a choice rep never earns credit. A throwaway script found exactly the 13 choice reps the claim lists in unitReps() paths (W2 w2-hashing x5, W8 w8-queue-bfs x1, W14 w14-interview x7). There are no other non-production reps in any path, and no choice reps in gate pools or optional sections. The 7 W14 reps spread `...R` / `...BIG_O` (data/exercises/oct11.ts:19, :1221; stage 'retrieval', repType 'cold'), so purposeOf (lib/course/routing.ts:194) returns 'gate'. That flows to `required: true` (components/use-today-plan.ts:65) and the label 'Checkpoint' (components/course/course-today.tsx:42, rendered at :288).

I simulated Week 14 Monday (2027-01-25, capacity 15, W1-W13 done). Today lists o11-cx-pop-front and o11-speed-slicing as 'Checkpoint', required. Passing o11-cx-pop-front leaves credits at 0. The item drops out of the queue (routing.ts:218) and out of doneToday (use-today-plan.ts:94-95), and o11-bug-base-case takes the 15th slot. A passed code rep, by contrast, shows a tick and adds 1 credit. No copy on Today or on the rep page says a choice rep does not count.

The claim overstates the W2/W8 part. Those units have gates, so `ready = liveGates.length ? gatesCleared : pathDone` (routing.ts:154). Clearing g-hashing directly gave 'ready' with 0 of 125 path reps passed. priorEvidence also becomes true once 40% of the path is passed (routing.ts:131). The unit then switches to 'placement' (:164) and only gate variants are queued (:212-214); the focused route drops unpassed 'recognize'-stage reps anyway (:157). So only some of the W2/W8 choice reps are ever prescribed. The 'Checkpoint' mislabel is also wider than the 7 choice reps. Severity stays major: the W14 part (and the wider mislabel) materially fails §7 "the daily target and curriculum path must agree" and §4 Q10 "Is there a checkpoint?"; the W2/W8 part is smaller than claimed. Corrected: **What holds:**
- There are 13 choice reps in unit paths, none of which can earn credit (lib/course/credit.ts:37, :65).
- When one is passed it vanishes from Today instead of being ticked, and the next plan item fills its slot. The cause is lib/course/routing.ts:218 plus components/use-today-plan.ts:94-95 with lib/today-plan.ts:114-150. The simulated W14 day showed credits staying at 0/15 after o11-cx-pop-front was passed, with o11-bug-base-case added as the 15th item. No copy anywhere says a choice rep does not count.

**Correction 1 (W2/W8):** "Unit completion requires them" is only true for W14.
- w2-hashing and w8-queue-bfs have gates. Readiness is gate-only (routing.ts:154): clearing g-hashing made the unit ready at 0 of 125 path reps.
- Once 40% of a gated unit's path is passed, priorEvidence (routing.ts:131) switches the unit to 'placement' (:164). The queue then serves only gate variants (:212-214), and the focused route drops unpassed 'recognize'-stage reps (:157).
- Simulated fresh learner working in queue order:
  - w2-hashing switches after 50 of 125 reps. o2-list-literal (#1), o2-set-empty (#15) and o2-drev-crash (#37) are prescribed. o2-dl-empty (#69) and o2-dl-crash (#73) never are.
  - w8-queue-bfs switches after 7 of 17 reps. o7-dq-why-not-pop0 (#1) is prescribed.
  - These show as 'Learn' items (stage 'recognize'), not as required.
- So 11 non-counting items are actually prescribed (3 + 1 + 7), and only W14's 7 are strictly required.
- w14-interview has `gateIds: []`, so ready = pathDone over the full path (routing.ts:148, :154). With all 48 counting W14 reps passed, the unit stays 'practicing' at 48/55. Today's list is then only the 7 choice 'Checkpoint' items, which can never move the day count.
- Week completion is not blocked: weekProgress (lib/course/week-status.ts:60-78) uses credits, labs and gates, and W14 has no gates or labs.

**Correction 2 (scope of the mislabel):** It is broader than the 7 choice reps. purposeOf (routing.ts:194) turns every non-gate cold/retrieval path rep into 'gate'. That gives 55 path reps shown as 'Checkpoint' with `required: true`:

| Unit | Reps |
|---|---|
| W2 w2-testing | 10 (o11-edges code reps) |
| W10 | 2 |
| W12 | 4 |
| W14 | all 39 (30 code, 7 choice, 2 other) |

W14 has no gates at all, so Today's answer to "is there a checkpoint?" is false. The choice reps are the subset that is also never credited.

**Correction 3 (the required flag and the WHY copy):**
- The `required` flag is never rendered. It only exempts an item from the 30% foundation cap on checks (today-plan.ts:120, :125), which does not apply in W14 (phase 'interview').
- The WHY copy ('A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next.') appears on the rep page through the session blocks (course-today.tsx:119-120, rep-workspace.tsx:1022-1029). These reps are not gate variants, so `bare` is false (rep-workspace.tsx:824-828) and the lesson panel, hints and solution stay available (e.g. :976). The copy is therefore false on the page itself.

### 10. [MAJOR] The §29 outside-solve tests are missing, and the existing test locks in the bug — CONFIRMED (severity keep)
- Spec: §29 Testing requirements (outside solve: unaided credit; hinted behaviour; solution-viewed behaviour; reconstruction; cold re-solve); REPS_2_MASTER_SPEC §55
- Evidence: lib/course/credit.test.ts:46-54 `assert.deepEqual(credits.map((c) => [c.lc, c.evidence]), [[1, 'outside-unaided'], [217, 'outside-hinted']])`; credit.test.ts:26 immediate reconstruction exists only as a comment; e2e/reps.spec.ts:229-233 clicks 'Needed help' and 'I rebuilt it from blank' and asserts only aria-pressed
- Detail: No unit or e2e test covers solution-viewed, reconstruction after a rebuild, a cold re-solve as the strongest evidence, same-LC deduplication, or immediate run-it-back credit. The one outside test asserts the behaviour §10 says to remove.
- Suggested fix: Write the §29 cases before changing credit.ts: unaided → credit; small hint → assisted per policy; solution → 0; a later dated rebuild → 'reconstructed'; review1-3 unaided → strongest; the same LC twice in a day → 1. Add a rep test where a separate run-it-back attempt follows a reveal.
- Verifier: I could not refute the main claim. Most of the evidence checks out, but some of the wording overstates it.

What I checked:
- **The outside test.** The test at lib/course/credit.test.ts:46-54 builds LC 217 with `kind: 'review1', result: 'hinted'` (line 49) and asserts `[[1, 'outside-unaided'], [217, 'outside-hinted']]` (line 53). 'hinted' is the only value the "Needed help" button writes (components/leetcode-list.tsx:139 `onClick={() => set(i, 'hinted')}`). dailyCredits credits every entry that is not 'failed' (lib/course/credit.ts:105-107 `if (... e.result === 'failed' || seen.has(e.id)) continue` … `evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted'`). For new target problems the same UI says "Not finished yet: rebuild it…" (leetcode-list.tsx:150). So the test does encode the catch-all credit that §10 says to fix.
- **What the evidence model can record.** `SolveResult = 'unaided' | 'hinted' | 'failed'` (lib/solve-log.ts:12) has no solution-viewed, rebuilt or cold-re-solve state. `rebuilt?: boolean` (solve-log.ts:29) is read only by the toggle in leetcode-list.tsx:155-156. Nothing in credit, readiness or routing uses it.
- **A throwaway probe.** I ran a script (/private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/credit_probe.ts) against the real credit.ts. It confirmed:
  - "Needed help" on a new problem earns `outside-hinted` credit.
  - `hinted` with `rebuilt: true` gives the same credit, and `failed` with `rebuilt: true` gives none, so reconstruction credit does not exist.
  - An unaided `review1` gets the same `outside-unaided` label as a new solve, so a cold re-solve is not treated as stronger evidence.
  - The same LC logged on one day as `lc:1:new` (from Today) and as `out:<uuid>` (from the /log form) earns 2 credits, because dedup is by entry id, not by LC.
- **No other outside-credit tests.** Neither e2e file has an outside-credit test: course.spec.ts never touches outside problems. The e2e test the claim cites (reps.spec.ts:181-244) runs on the legacy 90-day plan. lc:128 falls on 2026-10-17 (data/schedule-90.ts:730/779), before `COURSE_START = '2026-10-26'` (data/course/calendar.ts:9), and useCredits only computes from COURSE_START (components/use-credits.ts:17). So that test cannot reach course credit at all. Around the rebuild click it asserts only the panel text and `aria-pressed` (lines 228-232).
- **Immediate reconstruction.** credit.test.ts:26 is a comment claiming "Immediate reconstruction in the same attempt is the revealed attempt itself: no credit". That is not how the app works. `doRunItBack` sets `attemptRef.current = null` (components/rep/rep-workspace.tsx:628-631), so `ensureAttempt` creates a new attempt with a new id and `solutionViewed: false` (lines 389-409). The probe showed this run-back earns same-day credit as 'reconstructed'. No test covers this path; progress.test.ts:66 only checks the retrievalType label.

Where the claim overstates:
1. "Missing" applies to 3 of the 5 §29 outside items. Unaided credit and hinted behaviour are tested, although the hinted test asserts the catch-all behaviour.
2. The DETAIL sentence is only true for outside problems. For in-app reps, the following are already covered:
   - solution-viewed earns no credit (credit.test.ts:23-25);
   - a later rebuild is classed as 'reconstructed', not cold (credit.test.ts:28-32);
   - a later cold pass after a clean pass is 'retrieval' (credit.test.ts:34-36);
   - the same rep on the same day counts once (credit.test.ts:39-44; e2e/course.spec.ts:58-69, which also checks that a pass with the solution open does not count).
3. Re-solve *scheduling* is tested: the +3/+10/+30 re-solves and the redo after a hinted re-solve (lib/course/resolves.test.ts:10-23, lib/solve-log.test.ts:18-42, e2e/reps.spec.ts:114-131). Only cold re-solve *as evidence* is untested.
4. §10 allows a solve with a small hint, completed independently, to count as assisted evidence. The core defect is therefore that there is no split by hint severity, plus the missing tests. Asserting that a 'hinted' solve counts is not wrong in itself.
5. The test name says "counts once", but the fixture has no duplicate LC, so that part is never actually tested.

Severity: major is right. §29 explicitly requires these outside-solve tests. Three of the five cannot even be written against the current model, and the one hinted test enshrines the behaviour §10 says to fix. Corrected: For outside problems, only 2 of the 5 §29 tests exist, both in lib/course/credit.test.ts:46-54: unaided credit, and a 'hinted' result earning `outside-hinted` credit.
- **The hinted test enshrines the §10 problem.** In the current model 'hinted' is the single catch-all that "Needed help" writes (components/leetcode-list.tsx:139). The same UI says "Not finished yet" (leetcode-list.tsx:150), yet credit.ts:105-107 credits it.
- **The other three outside tests are missing, and cannot be written yet.** These are solution-viewed, reconstruction (rebuild from blank) and cold re-solve as the strongest evidence. The model has no states for them: SolveResult is 'unaided'|'hinted'|'failed' (lib/solve-log.ts:12), and credit never reads `rebuilt`.
- **Probe results against the real credit.ts:**
  - `hinted` + `rebuilt` still gives `outside-hinted`;
  - `failed` + `rebuilt` gives no credit;
  - an unaided `review1` gets the same `outside-unaided` label as a new solve;
  - the same LC logged via Today (`lc:1:new`) and via /log (`out:<uuid>`) on one day earns 2 credits.

  The test name's "counts once" is never tested, because the fixture has no duplicate LC.
- **No e2e covers course outside credit.** The cited e2e (e2e/reps.spec.ts:181-244) runs on the legacy 90-day plan on 2026-10-17, before COURSE_START 2026-10-26 (data/course/calendar.ts:9; use-credits.ts:17). So it cannot exercise course credit. At the rebuild step (lines 228-232) it asserts only the panel text and aria-pressed. e2e/course.spec.ts has no outside-problem test.
- **Already covered for in-app reps (do not rebuild):**
  - a revealed solution earns nothing; a later rebuild counts as 'reconstructed', not cold; a later cold pass counts as 'retrieval' (credit.test.ts:22-37);
  - the same rep on the same day counts once (credit.test.ts:39-44; e2e/course.spec.ts:58-69);
  - re-solve and redo scheduling (resolves.test.ts:10-23; solve-log.test.ts:18-42; e2e/reps.spec.ts:114-131).
- **One in-app gap (MASTER §55 "immediate reconstruction"):** credit.test.ts:26 is only a comment, and it misdescribes the app. "Run it back" starts a new attempt (rep-workspace.tsx:628-631 nulls `attemptRef`; `ensureAttempt` at 389-409 issues a new id with solutionViewed false), and that attempt earns same-day credit as 'reconstructed'. No test covers it.

Severity stays major.

### 11. [MINOR] Two competing definitions of production — CONFIRMED (severity keep)
- Spec: §26 (no contradictory systems); REPS_2_MASTER_SPEC §55 ('Do not let different pages independently invent what counts')
- Evidence: lib/course/credit.ts:37 decides by kind: `['code', 'output', 'reorder', 'explain']`; lib/training-state.ts:27-32 decides by stage: `const PASSIVE: Stage[] = ['recognize', 'trace']` … `isProductive(a) … !PASSIVE.includes(a.stage)`
- Detail: Of the required-path reps, 92 output/trace reps earn daily credit but count as passive for freshness and practice, while 7 choice/retrieval reps count as productive but earn no credit. A rep can therefore count toward today and not count toward skill freshness, or the other way round.
- Suggested fix: Export a single `isProduction(exercise)` from credit.ts and use it in training-state.practiceBySkill.
- Verifier: I checked every factual part of the claim against the code and found nothing to refute.

- **Kind rule.** lib/course/credit.ts:37 is `const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']`. `qualifies()` at :63-67 gates daily credit on it.
- **Stage rule.** lib/training-state.ts:27 is `const PASSIVE: Stage[] = ['recognize', 'trace']`. `isProductive()` at :30-32 is `a.passed && Boolean(a.completedAt) && !PASSIVE.includes(a.stage)`. `practiceBySkill()` at :47 uses it, and so do `freshnessOf()` and `firstExposure()`.
- **Attempt stage.** An attempt's stage is copied from the exercise (components/rep/rep-workspace.tsx:397 `stage: ex.stage`), so each rep falls into exactly one class under each rule.
- **Counts.** I ran the real `qualifies()` and `isProductive()` on a passed attempt for every rep in the course paths (temporary script, since deleted).
  - Required path (`unitPath`, 885 reps, or `unitReps` without gate variants, 833): 92 reps earn credit but are not productive, all output/trace. 7 reps are productive but earn no credit, all choice/retrieval.
  - The 7 are all in `w14-interview`: o11-cx-pop-front, o11-speed-slicing, o11-cx-grid-bfs, o11-cx-subsets, o11-cx-memo, o11-cx-tree-space and o11-cx-heap-k.
  - 43 of the 92 output/trace reps are in Weeks 1-2.

Severity stays minor:
- The output/trace half matches a distinction the spec allows. Master spec §9 lists "predict state" under Guided Build and says "Guided work is training, not mastery evidence". §13 says "A guided learning rep may still count toward daily work".
- The choice/retrieval half affects 7 Week-14 multiple-choice reps, on skills already written as code in earlier weeks.
- Neither half changes daily credit, week completion or the readiness report. `evidenceSummary` only counts full problems (lib/course/readiness.ts:71). Corrected: The facts are accurate, but the two halves differ in kind.

**1. The 92 output/trace reps (credit but no freshness).** This behaviour is deliberate and defensible under master spec §9 and §13: it separates training volume from production evidence. The repo's own tests encode it:
- lib/training.test.ts:26 defines the fixture `ex('imap-trace', ['index_map'], { kind: 'output', stage: 'trace' })`.
- The test at :139-143 asserts that "only production refreshes a skill: a trace ... does not".
- lib/pedagogy.test.ts:58 says "Recognising or tracing it is not producing it".

What is incoherent is the vocabulary:
- credit.ts:8 calls daily credit "literal qualifying production" and counts output.
- training-state.ts:26 says tracing only shows recognition.
- mastery.ts:15 says "Recognition alone (choice/trace) caps at 55".

So the code calls the same rep type production in one place and recognition in another.

**2. The 7 choice/retrieval reps (freshness but no credit).** This is a real defect, not a design choice:
- The reps are o11-cx-* and o11-speed-slicing. They get stage 'retrieval' from the `R` and `BIG_O` spreads at data/exercises/oct11.ts:19 and :1221.
- training-state.ts:30-32 counts them as productive, so passing one refreshes freshness.
- lib/progress.ts:194 makes every stage-'retrieval' rep 'cold', so a clean pass also adds to `cleanCold` and lengthens the freshness window (training-state.ts:48,53).
- That contradicts training-state.ts:66-68 ("answering a multiple-choice question never refreshes a skill") and docs/reps-2.md:35 ("Labs and multiple choice never count").
- mastery.ts has the same blind spot. `RECOGNITION_STAGES` at :63 and :127 is stage-based, so these multiple-choice passes lift `recognitionOnly`, carry the highest mastery weight (1.25 × 1.5 = 1.875) and add to `coldCorrect`. `coldCorrect` feeds `isStrong` (lib/bridges.ts:59-61).

**3. Two related divergences the claim missed.**
- training-state.ts:48,53 defines its own "clean cold" rule, which disagrees with `coldEvidence` in credit.ts:70-74. It counts a pass rebuilt after an earlier revealed solution as clean cold, and it leaves out self-corrected passes. That is a second, independent definition of cold evidence, which §55 forbids.
- lib/schedule.ts:141 has a third list, `PRODUCTION_KINDS = ['code', 'reorder', 'output']`, without 'explain'. It is only used to pick reps for review sessions, so it does not decide what counts.

**Impact.** The effects stay within the session planner's warm-ups, `repPurpose`, `firstExposure` and the mastery internals. Daily credit, week completion and the readiness report's `evidenceSummary` (lib/course/readiness.ts:71, which counts only full problems) are unaffected. Minor is the right severity.

### 12. [MINOR] The 'Day complete' message ignores LeetCode help when judging whether the day leaned on assistance — CONFIRMED (severity keep)
- Spec: §2 principle 6; §19 (truthful motivational events)
- Evidence: components/use-course-day.ts:36 `done.filter((c) => c.evidence === 'assisted' || c.evidence === 'reconstructed').length` (no 'outside-hinted'); data/course/motivation.ts:89 `const leaned = (c.assistedCount ?? 0) > done / 2`
- Detail: Take a 15/15 day made of 6 'Needed help' LeetCode logs and 4 hinted reps. assistedToday is 4, so the hero shows the celebratory 'You completed 15 meaningful reps' instead of the line for a day that leaned on help.
- Suggested fix: Count every outside evidence below unaided (hinted, solution) as assisted, using the new outside evidence states.
- Verifier: I could not refute this. I traced the code path end to end and ran the numbers.

1. Credits. lib/course/credit.ts:104-107 gives every logged outside problem with an lc and a result other than 'failed' its own CreditItem, and tags it `evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted'`. The "Needed help" button sets `'hinted'` (components/leetcode-list.tsx:139-140: `onClick={() => set(i, 'hinted')}` ... `Needed help`). The course Today renders that list as "Outside problems today" (components/course/course-dashboard.tsx:83). A problem logged by hand on /log with "Hinted" (components/solve-log-view.tsx:198) also becomes 'outside-hinted'.

2. Count. components/use-course-day.ts:35-36: `const done = credits.items[today] ?? []` and `const assistedToday = done.filter((c) => c.evidence === 'assisted' || c.evidence === 'reconstructed').length`. Outside credits add to `doneToday: done.length` (line 51) but never to `assistedToday`. 'revealed' and 'failed' never reach the credit list, so 'outside-hinted' is the only help-type evidence the filter misses.

3. Message. components/course/course-today.tsx:73 passes `assistedCount: cd.assistedToday` into `todayLine`. data/course/motivation.ts:164 sends a met target to 'day-complete'. Line 89 then checks `const leaned = (c.assistedCount ?? 0) > done / 2`. If that is false, the message uses the 'celebrate' tone (lines 92-102) and course-today.tsx:200-202 shows it in the hero.

4. Calculation. I ran a throwaway tsx script against the real `dailyCredits` and `todayLine`, then deleted it; the repo is unchanged. The claim's day (4 hinted reps, 5 clean reps, 6 LeetCode logs marked "Needed help") produced doneToday=15, evidence {assisted:4, independent:5, outside-hinted:6}, assistedToday=4, so 4 > 7.5 is false and the tone is 'celebrate'. Counting outside-hinted gives 10 > 7.5, which picks the warm "A lot of today needed help" line. A more realistic day shows the same thing: 3 LeetCode "Needed help" logs, 5 hinted reps and 7 clean reps give assistedToday=5 against 8 real assisted items, and the line still celebrates. A control day with 8 hinted reps and 7 clean reps correctly gets the warm line.

Severity stays minor. The 15/15 count is truthful under the current credit rule. What goes wrong is which affirmation gets picked: a day that mostly needed help is celebrated as if it were clean, which goes against §2.6/§2.12 and §19's "should feel earned" in tone. The bigger truthfulness problem is that "Needed help" LeetCode logs earn full credit at all. That is §10 (credit.ts:107) and a separate, major finding. This one is a downstream symptom. Corrected: The claim is correct, with one small correction to its example text. The celebratory message is not always "You completed 15 meaningful reps". `pick()` chooses one of three 'celebrate' lines using the date as the seed (data/course/motivation.ts:95-101): "Good work today. You completed 15 meaningful reps…", "Day complete. You did the work the plan asked for today…", or "15/15. Another day of evidence, not just study time." I confirmed all three appear on different dates for the claim's day.

Accurate version: components/use-course-day.ts:36 counts only 'assisted' and 'reconstructed' credits as help. Each LeetCode or outside problem logged as "Needed help" or "Hinted" becomes an 'outside-hinted' credit (lib/course/credit.ts:107). That credit adds to doneToday but not to assistedToday. As a result, data/course/motivation.ts:89 (`(c.assistedCount ?? 0) > done / 2`) under-counts help and picks a celebratory day-complete line for days where most of the credits needed help. Examples of 15/15 days:
- 6 LeetCode "Needed help" + 4 hinted reps: real help is 10, the code counts 4.
- 3 LeetCode "Needed help" + 5 hinted reps: real help is 8, the code counts 5.

Notes for the fix:
- Count 'outside-hinted' as help, preferably through one shared "is assisted" predicate in lib/course/credit.ts rather than an inline filter. That way it keeps working once the §10 outside evidence model (hint, solution viewed, rebuilt) arrives.
- The 'leaned' line promises that "the next session starts with a short repair". For LeetCode, only re-solves that needed help get a redo on the next training day (lib/course/resolves.ts:38 skips 'new' kinds). A first solve that needed help does not, so that copy may need adjusting when outside help is counted.
- This is a symptom of the major §10 issue: "Needed help" LeetCode logs earn full daily credit at all.

### 13. [MINOR] Before course start, Today and capacity count failed LeetCode logs — CONFIRMED (severity keep)
- Spec: §10; §2 principle 12
- Evidence: components/use-today-plan.ts:91 `...entries.filter((e) => e.date === today && e.lc)` plus :94-95 `counted = today >= COURSE_START ? … : null`; components/use-capacity.ts:41-46 `for (const e of entries) { if (!e.lc) continue … r.reps++`
- Detail: Until 2026-10-26 (live today), any logged LC entry counts as a rep on Today and in the weekly capacity review, including Failed ones. So do revealed, choice, lab and generated passes, because the credit filter only applies from COURSE_START.
- Suggested fix: Apply dailyCredits (or at least result !== 'failed') in both paths, or accept and document that this is a legacy path that ends on Oct 26.
- Verifier: The claim is correct. I read the code paths end to end and ran a simulation (/private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/failed-lc.ts). No repo files were touched.

Today: components/use-today-plan.ts:91 `...entries.filter((e) => e.date === today && e.lc)` never checks `e.result`. At :94, `counted = today >= COURSE_START ? ... : null` (COURSE_START = '2026-10-26' in data/course/calendar.ts:9; today is 2026-10-23), so :95 hands the unfiltered list to prescribe. In lib/today-plan.ts, `repsDone = done.size` (:111) and `complete: repsDone >= N` (:164). The pre-course DashboardToday renders this through TodayTraining (dashboard.tsx:52, :165). Simulation: 7 passed reps + 2 failed LC logs + 1 hinted LC log gives repsDone 10/10 and complete=true. The course credit filter (lib/course/credit.ts:105, `e.result === 'failed'`) keeps only the hinted one.

Capacity: components/use-capacity.ts:41-46 does `r.reps++` and `r.minutes += e.minutes ?? 15` for every entry that has an lc, whatever its result. This feeds capacityFor only before COURSE_START (:61). reviewWeek uses d.reps for trained days, completedDays and completion (lib/training-capacity.ts:86-89). Simulation: six days of 8 clean passes + 2 failed LC logs reads "Week 1 at 10 reps was handled cleanly: 6 full days" and the load goes 10→12. Without the failed logs it reads "0 of 4 days at the full load ... Holding the load".

The extension also holds. doneToday (:86-90) and DayRecord.reps (use-capacity.ts:32-39) check only passed && completedAt, so revealed, choice, lab and generated passes all count before course start. The course filter `qualifies` drops these from Oct 26 (credit.ts:64, `!exercise || exercise.lab`, plus the PRODUCTION kind check and `!a.solutionViewed`).

Severity stays minor. In production this code stops running on 2026-10-26: `today` can't be overridden there (devAsOf returns null in production, reps-provider.tsx:68). The pre-course TodayTraining only shows on plan working days (dashboard.tsx:66 `live`), so it is visible on Oct 23–24 only; Oct 25 is 'off' in PLAN_DAYS. Any V2.1 fix would ship after that date, so there is nothing worth fixing. Corrected: Accurate, with these qualifications:
(1) 'failed' can only be set from the /log form (components/solve-log-view.tsx:199 `<option value="failed">`). The Today LeetCode list's "Needed help" button stores 'hinted' (components/leetcode-list.tsx:139), and for new problems it shows "Not finished yet" (:150). Those hinted entries also count before course start, which is the conflict §10 describes. But hinted entries still get daily credit after Oct 26 (lib/course/credit.ts:105-107 excludes only 'failed' and records 'outside-hinted'), so that part is a course-wide §10 issue, not a pre-course one.
(2) The capacity effect is limited. Today falls in week 2 of the 90-day ramp (PLAN_START 2026-10-12). Its 10 vs 12 load comes from the Oct 12–18 review, and that review's reason text is shown on Today (components/today-training.tsx:250 `{cap.reason}`). Week 2's own review would only set week 3, and from Oct 26 courseCapacity replaces it; courseCapacity uses credits only (lib/course/capacity.ts). The one way to still change the load is to backdate entries using the /log date field.
(3) Revealed passes are not entirely free in the review: they also add to `assisted` (use-capacity.ts:34), and reviewWeek holds the load when more than 35% of passes are assisted (training-capacity.ts:82,98). Failed LC logs add reps and a default 15 minutes without touching `passed` or `assisted`.
(4) Choice and lab exercises are not in the pre-course plan days (0 of the 102 exercises in the Oct 12–25 PLAN_DAYS), so they only count if done off-plan. Revealed and generated ("Another rep") passes are reachable on the plan. Generated reps are not in EXERCISE_BY_ID, so `qualifies` excludes them after course start.
(5) Exposure: in production the pre-course path stops running on 2026-10-26 (devAsOf is dev-only, components/reps-provider.tsx:68). The live TodayTraining only shows on Oct 23 and 24. Deleting or ignoring the path is better than fixing it.
Related issue that outlives Oct 26 (outside this claim): components/use-course.ts:21 builds solvedLc from any 'new' LC entry whatever its result. lib/course/routing.ts:225 then drops that target from the course queue. A failed first attempt comes back only as review1 at +3 training days (lib/course/resolves.ts:47-54), not as an immediate redo.

### 14. [MINOR] Failed and hinted first attempts are reported as 'solved' — CONFIRMED (severity raise)
- Spec: §2 principle 12; §9
- Evidence: lib/progress-90.ts:78 `for (const s of solves) if (s.lc && (!through || s.date <= through)) lc.add(s.lc)` behind components/progress-view.tsx:72 'Problems done … LeetCode problems, solved at least once'; components/use-course.ts:21 `entries.filter((e) => e.kind === 'new' && e.lc)` builds solvedLc; components/plan-view.tsx:31 does the same
- Detail: An LC logged as Failed on /log raises 'Problems done (solved at least once)' on the Progress page, which still renders in course mode. It also drops the target from the course queue as 'solved'.
- Suggested fix: Define 'solved' from the outside evidence (unaided, hinted per policy, rebuilt or cold), not from the mere existence of an entry.
- Verifier: The core claim holds, but two of the three supporting details are wrong or don't apply in course mode.

Method: I read the code end to end, then ran a throwaway tsx script against the real modules (written to scripts/_audit_skeptic_solved.ts and deleted right after the run).

What is correct:
- `problemsSolved` (lib/progress-90.ts:76-80) counts every LC number that has any solve-log entry, whatever its kind or result. It also counts passed capstones without checking `solutionViewed`.
- Simulated results:
  - an outside entry marked failed → 1
  - a 'new' entry marked hinted → 1
  - a failed review1 with nothing else logged → 1
  - the capstone for LC 242, passed with the solution shown → 1. The credit engine gives that same attempt 0.
- Its output drives the 'Problems done … solved at least once' stat and the Checkpoints rows. Both still render in course mode.

What does not hold:
1. The /log route: a problem logged through the 'Log a problem' form is saved as kind 'outside'. use-course only keeps kind 'new', so the target stays in the course queue (simulated).
2. Removing a target from the queue is never shown to the learner as 'solved'. Any logged 'new' entry, whatever its result, goes onto the +3/+10/+30 re-solve track. In the simulation, review1 came due on Oct 30.
3. plan-view.tsx:31 only affects the pre-course view. When today >= COURSE_START, PlanView returns RoadMap at line 48, so this code never renders in course mode.

Severity, raised from minor to major: this is not polish. A stat labelled 'solved' counts Failed work and solution-revealed passes, and the checkpoint rows can turn green ('met') on that work. Those checkpoint dates (Nov 10, Dec 10, Jan 9) fall inside the course. That breaks principle 12 and is the 'two competing models of progress' problem that §9 targets.

It is not critical. The course's main counters (daily credit, the Road to Ready 'qualifying problems' count, week status) already exclude failed and revealed work. And these are legacy V1 panels that the §9 rebuild should replace anyway. Corrected: Partly right.

CONFIRMED:
- What it counts: lib/progress-90.ts:78 `for (const s of solves) if (s.lc && (!through || s.date <= through)) lc.add(s.lc)` counts any solve-log entry: any kind (new, review, redo, outside) and any result, Failed included. Line 79 `if (a.passed && a.completedAt && capstoneNumber[a.exerciseId] ...)` has no `!a.solutionViewed` check.
- Simulated results:
  - outside entry marked failed → 1
  - 'new' entry marked hinted → 1
  - failed review1 on its own → 1
  - cap-valid-anagram (no cleanPass) passed with the solution shown → 1
- Contradictions: dailyCredits gives that capstone pass 0 (credit.ts:66 `!a.solutionViewed`), and the solve log labels it 'Failed' (solve-log-view.tsx:91 `a.solutionViewed ? 'failed'`).
- Where it shows:
  - the stat at progress-view.tsx:72 ('Problems done … LeetCode problems, solved at least once')
  - the Checkpoints 'Problems done' rows (progress-90.ts:101,110, `met: problems >= c.problems`, rendered at progress-view.tsx:140-164)
- Both render in course mode. COURSE_START is checked only at progress-view.tsx:61 (subtitle) and :63 (ReadinessReport).
- The V1 checkpoints (2026-11-10, 12-10, 2027-01-09, data/program-90day.ts:112-114) fall inside the course, so a row can show green 'met' on failed or revealed work.
- The rest of the course counts differently: Road to Ready shows 'qualifying problems' from credits (road-map.tsx:44,52), which skip failed entries (credit.ts:105 `e.result === 'failed'`). So two problem counts disagree.

NOT AS CLAIMED:
1. **Logging on /log does not remove the target.** 'Log a problem' saves `kind: 'outside'` (solve-log-view.tsx:109). use-course.ts:21 keeps only `e.kind === 'new'`, so that entry never enters solvedLc and the target stays in courseQueue (simulated: queue unchanged).
   - The queue drop does happen for any 'new' entry, whatever its result:
     - Today's 'Needed help', which saves 'hinted' (leetcode-list.tsx:139)
     - a 'new' entry edited to Failed via /log?edit
     - a capstone passed with the solution shown, because passedSet only excludes solutionViewed for cleanPass exercises (lib/progress.ts:17) and capstones have no cleanPass.
2. **The drop is never shown as 'solved'.** lib/course/resolves.ts:45-52 puts any logged 'new' entry on the +3/+10/+30 re-solve track. Simulated: a hinted or failed 'new' entry on Oct 27 brings lc:217:review1 due Oct 30.
   - The visible side effect: the row leaves 'Outside problems today' as soon as it is logged.
   - Cause: the done item that prescribe() builds has no `lc` (today-plan.ts:110), so prescribedLc (course-dashboard.tsx:49) drops it.
   - Result: the 'Not finished yet: rebuild it' panel (leetcode-list.tsx:148-165) is hidden.
3. **plan-view.tsx:31 does nothing in course mode.** PlanView returns `<RoadMap />` at lines 48-59 when today >= COURSE_START, so solvedLc only feeds the pre-course 90-day Modules list. The same applies to use-today-plan.ts:46/70.

Hinted first attempts counting as 'solved' is debatable, though it contradicts the product's own 'Not finished yet' copy. Failed entries and solution-shown passes counting as 'solved' are plainly wrong.

### 15. [MINOR] Hint severity is never considered: one nudge and a full outline are the same evidence — CONFIRMED (severity keep)
- Spec: §10 ('depending on hint severity'); §11
- Evidence: lib/course/credit.ts:56 `if (a.hintsUsed > 0) return 'assisted'`; lib/types.ts:106-107 hints are progressive ("conceptual nudge, structure, operation, outline"); script: hintsUsed 4 → qualifies, 'assisted'
- Detail: A rep passed after reading the outline-level fourth hint (or after AI hints up to level 4) earns the same credit and evidence as one passed after a single conceptual nudge. Outside entries cannot record severity at all.
- Suggested fix: Record the highest hint level used (a hintLevel on the Attempt and on SolveEntry). Treat outline-level help as material assistance: decide whether it earns credit, and either way never classify it alongside a small hint.
- Verifier: The claim is partly right. Its core is true for the V2 module that decides what counts. lib/course/credit.ts:56 has `if (a.hintsUsed > 0) return 'assisted'`, and qualifies() (credit.ts:63-67) ignores hints entirely.

I ran a throwaway script, scripts/_audit_hintsev.ts, which has since been deleted. For hintsUsed 1, 2 and 4, on both cold and first-exposure attempts, masteryEvidence returned 'assisted', qualifies returned true, coldEvidence returned false, and dailyCredits returned 1 each time. So a pass after the first conceptual nudge and a pass after the level-4 outline get the same evidence class and the same daily credit. The level-4 outline can come from static hint 4 or from an AI hint: app/api/coach/hint/route.ts:4 defines level 4 as 'an algorithm outline in 3-5 steps, no code', and rep-workspace.tsx:588 sets `level: Math.min(4, allHints.length + 1)`. The readiness report is binary too: lib/course/readiness.ts:82 has `helped = recent.filter((a) => a.hintsUsed > 0 || a.solutionViewed)`, which feeds the at-risk/off-track thresholds of >0.4/>0.6 at readiness.ts:151-152.

The headline "never considered" is wrong, though. Attempt stores only a count (lib/types.ts:237 `hintsUsed: number`, with no level field). Static hints are revealed in order, and several subsystems grade by that count as a stand-in for depth:
- lib/mastery.ts:76 `const hint = Math.max(0.4, 1 - 0.15 * a.hintsUsed)`. The script gave quality 0.85 for 1 hint and 0.4 for 4.
- lib/schedule.ts:73/103 `quality < 0.7` marks a pass as shaky, which means 3 or more hints.
- lib/training-state.ts:235 `passedWithHelp ... a.hintsUsed >= 2` drives the relearn trigger.
- components/use-capacity.ts:34 `a.hintsUsed >= 2` decides what counts as assisted in the capacity review.
- lib/session-planner.ts:120-121 ranks shaky reps by score and keeps those scoring 3 or more.

That matches master spec §13: "Assistance affects quality/mastery, not always daily volume."

Severity: minor is right for the in-app half.
- §10's "depending on hint severity" sits under "outside LeetCode credit semantics".
- §11 only requires the six categories, and all of them exist in the Evidence type in credit.ts.
- In-app solution exposure is already separated: 'revealed' earns no credit, and a later pass is classed as 'reconstructed'.

The outside half ("outside entries cannot record severity") is true, but it is not polish. It belongs with the major §10 defect. Corrected: Accurate version:

(1) Hint depth is ignored in the V2 evidence class, in daily credit and in readiness.
- lib/course/credit.ts:56 has `if (a.hintsUsed > 0) return 'assisted'`, and qualifies() at :63-67 never looks at hints.
- So a pass after one conceptual nudge and a pass after hint 4 or an AI level-4 'algorithm outline in 3-5 steps' (app/api/coach/hint/route.ts:4; rep-workspace.tsx:588) both get 'assisted' and 1 daily credit. This was verified by script for hintsUsed 1, 2 and 4, on cold and first-exposure attempts.
- lib/course/readiness.ts:82 counts any hint as 'needed help' (`a.hintsUsed > 0 || a.solutionViewed`) toward the at-risk/off-track thresholds of >0.4/>0.6.

(2) It is NOT true that severity is never considered. Attempt has only a count (lib/types.ts:237), but because hints are revealed in order, these places grade by it:
- lib/mastery.ts:76 `Math.max(0.4, 1 - 0.15 * a.hintsUsed)` gives quality 0.85 for 1 hint and 0.4 for 4.
- lib/schedule.ts:103 `quality < 0.7` marks 3 or more hints as shaky.
- lib/training-state.ts:235 `passedWithHelp` needs `hintsUsed >= 2`.
- components/use-capacity.ts:34 uses `hintsUsed >= 2`.
- lib/session-planner.ts:120-121 keeps reps scoring 3 or more.
These subsystems are internally inconsistent: one hint is 'help' in readiness but not in the relearn trigger or the capacity review.

(3) The count is a weak stand-in for depth anyway.
- Static hint ladders vary across code exercises: 165 have 0 hints, 196 have 1, 383 have 2, 147 have 3 and 120 have 4. On a 2-hint exercise, hint 2 may already be the most revealing.
- Opening Basics on a cold rep also calls countHint (rep-workspace.tsx:601-607), and so does opening the ConceptGuide (rep-workspace.tsx:978; concept-guide.tsx:109, which counts again on every re-open).
- No level is recorded, so not even the graded paths can reliably tell a nudge from an outline.

(4) Severity: minor is correct for in-app reps. The spec does not mandate hint grading there: §10's clause is in the outside-LeetCode section and §11's six categories all exist. Solution exposure is already separated as 'revealed' (no credit) and then 'reconstructed'.

The outside-entry part is accurate but under-rated:
- lib/solve-log.ts:12 has `SolveResult = 'unaided' | 'hinted' | 'failed'`.
- The LeetCode list offers only 'Unaided' / 'Needed help' (components/leetcode-list.tsx:136-141), and the /log form offers Unaided/Hinted/Failed (components/solve-log-view.tsx:196-199).
- So a small hint cannot be told apart from watching the Walkthrough (leetcode-list.tsx:131-134), which is material solution exposure. §10 explicitly requires that distinction 'at minimum'.
- Both are credited, because credit.ts:105 skips only 'failed', while the UI says 'Not finished yet' (leetcode-list.tsx:150). The `rebuilt` flag does not change credit.

That half should be merged into the major §10 finding about outside solution-viewed or 'Needed help' credit, not kept as a minor hint-severity item.

### 16. [MINOR] The same rep earns full credit every day it is re-passed; the momentum comment overclaims — CONFIRMED (severity raise)
- Spec: §2 principle 11 (reward meaningful production, not engagement)
- Evidence: lib/course/credit.ts:96-101 the `seen` set is per date only; lib/course/week-status.ts:127-129 "Repeating trivial reps cannot raise it: credits count once per rep per day"
- Detail: Nothing stops a learner from re-passing yesterday's ten easy reps today for ten credits. retrievalTypeFor marks them 'cold' after 12 hours, and dailyCredits has no novelty or prescription check. The spec allows cold reps to count, but the comment implies repetition cannot inflate momentum, which is true only within a single day.
- Suggested fix: Credit a re-pass of a rep already passed within the last N days only when it was prescribed (a warm-up, redo or due review), or cap repeat credits per day. Correct the comment.
- Verifier: The facts in the claim hold.

- **Credit is deduplicated per date only.** lib/course/credit.ts:97-100 creates `const seen = new Set<string>()` inside dailyCredits and filters `attempts.filter((a) => a.date === date)`. qualifies() (credit.ts:63-67) checks only that the exercise exists, is not a lab, is a production kind, passed, and had no solution shown. There is no novelty check, no prescription check, and no retrievalType check, so even a re-pass under 12 hours old counts on a new date.
- **Re-attempts become cold after 12 hours.** retrievalTypeFor (lib/progress.ts:192-200) returns 'cold' 12h after the last attempt. masteryEvidence then labels the re-pass 'retrieval' (credit.ts:57).
- **The tests confirm this is intended.** credit.test.ts:28-29 asserts a next-day re-pass qualifies. The test named "momentum cannot be farmed" (week-status.test.ts:58-64) feeds per-date numbers straight in and never checks whether they are distinct work.
- **The comment overclaims.** week-status.ts:127-128 says "Repeating trivial reps cannot raise it: credits count once per rep per day". That holds within one day only.
- **Simulation with the real modules** (/private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/farm-credit.ts):
  - Setup: the first 12 week-1 path reps passed on Mon 2026-10-26, then the same 12 re-passed on each of the next 9 training days.
  - Result: 12/day credits, flame 'blaze' every day, trainingStreak 10, momentum 'on-fire', week 1 at 60/50 and week 2 at 60/60, both 'on-track' by count.
  - Only 12 distinct reps were ever produced, yet they earned 120 credits.

Two corrections change the severity.

1. **Momentum itself is never shown.** momentum() is computed in components/use-course-day.ts:50, but no component reads it. The overclaiming comment therefore has no direct UI effect.
2. **The same per-date credits drive every visible reward, and farming them is nearly free, which the claim missed.** They feed:
   - the flame (use-course-day.ts:49)
   - the streak (course-today.tsx:152-153)
   - "Day complete … You did enough." (course-today.tsx:68, 164-170), with `complete = day.type === 'training' && done >= target`
   - the week card count (course-cards.tsx:42)
   - the course total and the 50/250/500/750/950 milestones (use-course-day.ts:38, course-today.tsx:93, motivation.ts:171)

   Why a re-pass costs almost nothing:
   - rep-workspace.tsx:219 starts the editor from the saved draft: `useState(() => repo.draft(ex.id) ?? localDraft(ex.id) ?? blankStarter(ex))`.
   - The draft is never cleared on a pass. The save effect just stops (`if (!isCode || phase === 'passed') return`, :380).
   - The editor is locked only within the current visit (`const locked = passed` where `passed = phase === 'passed'`, :810/:818).
   - onSubmit (:491-540) has no unchanged-code check.
   - Drafts are reset to starter only for warm/redo/cold items when the learner starts Today's session (course-today.tsx:107-115).
   - Yesterday's reps are linked directly from day-view.tsx:213 and skill-detail.tsx:118.

   So reopening yesterday's code reps shows the learner's own earlier passing code. One Submit per rep records a cold 'retrieval' pass and a full daily credit.

Severity: V2 §13 does let a genuine cold re-solve on a later day count. But one-click resubmission of pre-filled code earning BLAZE, the streak, "You did enough" and milestones rewards clicking rather than production. That materially fails V2.1 §20 ("no farmable XP") and principle 11, which is more than polish. It is not critical, because it needs deliberate self-gaming and the Today flow itself steers to new work and clears drafts for prescribed retrieval.

Readiness is not inflated: evidenceSummary counts only the first pass per exercise (readiness.ts:74-78). Skill mastery is, though. Each repeated cold pass adds to coldCorrect, evidenceSum and consecutiveCorrect (mastery.ts:125, 128, 132), and can reach 'fluent' (:162-163). Corrected: Accurate version (major, §2 principle 11 and §20 "no farmable XP"):

dailyCredits (lib/course/credit.ts:95-103) removes duplicates only within a date (`const seen = new Set<string>()`, :97; `a.date === date`, :98). qualifies() (:63-67) has no novelty, prescription or retrievalType check. A rep re-passed on any later date therefore earns a full credit again. After 12h it is also classified 'cold'/'retrieval' (progress.ts:199; credit.ts:57).

Simulated with the real modules: 12 week-1 reps re-passed every training day for two weeks give 12/day, BLAZE daily, streak 10, momentum 'on-fire', and weeks 1 and 2 on track by count (60/50 and 60/60), from only 12 distinct reps.

The comment at week-status.ts:127-128 ("Repeating trivial reps cannot raise it: credits count once per rep per day") is true only within one day. The momentum value it describes is computed (use-course-day.ts:50) but never rendered.

The real impact is on the visible rewards, which use the same per-date counts:
- Training Flame (use-course-day.ts:49)
- streak (course-today.tsx:152-153)
- "Day complete · You did enough" (course-today.tsx:68, 170)
- week card count (course-cards.tsx:42)
- course total and milestones (course-today.tsx:93; motivation.ts:171)

Farming is close to free for code reps:
- The workspace starts the editor from the saved draft: `repo.draft(ex.id) ?? localDraft(ex.id) ?? blankStarter(ex)` (rep-workspace.tsx:219).
- Drafts are not cleared after a pass (:380), and the editor is unlocked on reopen (:818).
- onSubmit has no unchanged-code guard.
- Drafts are reset only for Today-session warm/redo/cold items (course-today.tsx:107-115).

So reopening yesterday's reps from the day view or skill detail and pressing Submit re-earns each credit, labelled as cold retrieval. Repeats also raise skill mastery (mastery.ts:125, 128, 132, 162-163), but not readiness counts (readiness.ts:74-78 counts the first pass only).

Re-crediting a genuine cold re-solve on another day is allowed by V2 §13. The fix needed is either of these:
- open previously passed reps blank (clear the draft on pass), or
- cap or exclude self-selected re-passes of already-solved reps that were not prescribed for retrieval.

In addition, the momentum comment and its "cannot be farmed" test (week-status.test.ts:58-64) should be corrected.

## curriculum-math

The curriculum doesn't fit the workload contract, and the routing that should deliver it stalls. I verified this two ways. First, a static count of every week from data/course and routing.unitReps. Second, a day-by-day simulation that runs the repo's own courseStatus, courseQueue, prescribe, dailyCredits, weekProgress and readiness functions, with every prescribed rep passed clean on the first try.

1. **Weeks 1 and 2 are overloaded.** Week 1 requires 65 path reps plus 8 gate passes, or 73 against 50 (1.46x). Week 2 requires 197 path reps plus 11 gate passes plus 5 LeetCode targets, or 213 against 60 (3.55x). The w2-hashing unit alone carries 125 required reps: 149 of the 162 reps in the Oct 2 module are now required path. Week 8 is also over: 84 against 75.
2. **The course falls behind and only catches up in Week 13.** Cumulative required load runs 176 reps behind the cumulative target after Week 2.
3. **Ungated units deadlock (critical).** Routing switches an ungated unit to the "focused" route after 40% of its own reps are passed. That drops the unpassed lesson-level reps from what Today offers, but the unit's ready check still requires the full path. Affected units: w1-state-while, w2-improve and w7-bst.
   - w1-state-while is a prerequisite of 30 of the 33 units.
   - Run as coded, a zero-history learner gets 50/50 and 60/60 in Weeks 1–2, then 19 credits in Week 3 and 0 after that.
   - A learner with the October sprint plus the 90-day plan through Oct 25 runs out of course work after 11 reps on Oct 27.
4. **Week 2 tests later topics.** w2-testing includes the o11-edges reps on binary search, stacks, intervals, grids and linked lists, and Today shows them as "Checkpoint" items.
5. **Placement gives up after one checkpoint.** It starts in the middle of a unit's path, and after one checkpoint attempt it sends the learner back to the rest of the path.
6. **Week 13 can't be completed from Today.** Today can prescribe at most 5 transfer reps a day (11 with warm-ups and maintenance) against 15, and Week 14 stays locked until all 48 are done.
7. **weekProgress knows nothing about paths.** Its rule that a missing lab or checkpoint downgrades the week never fires in production: on Sunday, 50/50 with 0 of 2 labs and 0 of 4 checkpoints shows "On track".
8. **Four surfaces define "week complete" differently.** These are the week card, Road to Ready, the readiness report and readiness.
9. **No exercise is classified individually.** Nothing marks a rep as required path, optional, repair inventory, retrieval, placement or stretch.

The calendar math, the exclusion of labs and gate variants from credit, and gate pool sizes are correct. I created no files in the repo; all scripts are in /private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/ (math.ts, table.ts, w12.ts, sim.ts, deadlock.ts, placement.ts, cap.ts, leak.ts, purpose.ts, wkcheck.ts). There is a stray repo file, /Users/ruggudile/Desktop/Projects/reps/scripts/_audit_routing_sim2.ts, which another auditor created; it should be deleted.

**Already correct:**
- Calendar math is correct and tested. In data/course/calendar.ts:74-86, dailyTarget is 10, 12, then 15, and weekTarget = trainingDays x dailyTarget. Weekly targets are [50,60,75,75,75,75,75,75,60,45,75,75,60,75], COURSE_TARGET = 950, and Sundays plus the 5 holidays are rest with no debt. This matches master spec §16 and is asserted in lib/course/course.test.ts:7-13.
- Labs stay a separate, done-or-not-done output and never earn daily credit (lib/course/credit.ts:64, `if (!exercise || exercise.lab) return false`; lib/course/labs.ts:22-30). None of the 46 lab exercises sits in any unit path (computed: 0).
- Gate variants are excluded from unit paths (routing.ts:74, `.filter((e) => !GATE_OF_EXERCISE[e.id])`), so gate passes aren't double counted. All 30 gate pools exist and have at least `need` variants (computed; also asserted in lib/course/content.test.ts:24-36).
- No rep appears in two units' required paths (computed: 0 duplicates). LeetCode targets whose capstone rep is in a path are auto-satisfied once that capstone is passed (components/use-course.ts:20); 24 of the 39 targets are covered this way.
- Dependency order is enforced in the queue: locked units contribute nothing (routing.ts:210), and the prerequisite graph matches the spec's hard chain (course.test.ts:42-57).
- Holiday weeks 9, 10 and 13 already get the reduced targets 60, 45 and 60 from training days, and their required load fits on paper: 58, 31 and 48. Week 13 still fails in practice because of the load cap (see findings).
- The repo already has a per-exercise inventory to start the reclassification from. scripts/audit-migration.ts maps every legacy rep (0 unmapped) to a unit, purpose and action, and writes planning/reps-v2-migration.json.

**Data:**

```
=== PER-WEEK TABLE (static; path = routing.unitReps = all reps of unit.sections minus gate variants; focused = path minus lesson-level stages recognize/trace/recall/complete; gate passes = sum of gate.need for gates whose pool exists (all 30 pools exist, every pool >= need); targets = unit.targets) ===
Wk | target (days x rate) | path | focused | optional | gate passes | targets (+readinessTargets) | REQUIRED LOAD path+gates+targets | vs target | cumulative load / cumulative target (lag)
 1 | 50 (5x10)           |  65 |  46 |  0 |  8 | 0       |  73 | 1.46x (+23)  |  73 / 50  (+23)
 2 | 60 (5x12)           | 197 | 159 |  5 | 11 | 5       | 213 | 3.55x (+153) | 286 / 110 (+176)
 3 | 75                  |  38 |  36 | 10 |  6 | 4 (+1)  |  48 | 0.64x (-27)  | 334 / 185 (+149)
 4 | 75                  |  53 |  47 | 12 |  4 | 2 (+1)  |  59 | 0.79x (-16)  | 393 / 260 (+133)
 5 | 75                  |  46 |  41 | 13 |  4 | 3       |  53 | 0.71x (-22)  | 446 / 335 (+111)
 6 | 75                  |  22 |  19 | 11 |  4 | 2       |  28 | 0.37x (-47)  | 474 / 410 (+64)
 7 | 75                  |  51 |  47 | 12 |  2 | 5 (+2)  |  58 | 0.77x (-17)  | 532 / 485 (+47)
 8 | 75                  |  75 |  66 | 21 |  6 | 3 (+1)  |  84 | 1.12x (+9)   | 616 / 560 (+56)
 9 | 60 (4x15 Christmas) |  51 |  41 | 13 |  4 | 3       |  58 | 0.97x (-2)   | 674 / 620 (+54)
10 | 45 (3x15 New Year)  |  25 |  23 |  5 |  2 | 4       |  31 | 0.69x (-14)  | 705 / 665 (+40)
11 | 75                  |  58 |  49 | 14 |  4 | 3 (+1)  |  65 | 0.87x (-10)  | 770 / 740 (+30)
12 | 75                  |  49 |  45 | 38 |  4 | 5 (+3)  |  58 | 0.77x (-17)  | 828 / 815 (+13)
13 | 60 (4x15 MLK)       |  48 |  48 |  0 |  0 | 0       |  48 | 0.80x (-12)  | 876 / 875 (+1)
14 | 75                  |  55 |  55 |  0 |  0 | 0       |  55 | 0.73x (-20)  | 931 / 950 (-19)
Totals: path 833; gate passes 59; targets 39 (24 are auto-satisfied once their capstone rep in some path is passed); readinessTargets 9; required load 931 against COURSE_TARGET 950. No rep sits in two units' paths. No lab rep is in any path.

=== PER UNIT (path / focused / optional reps / gate passes [gate need/pool] / targets) ===
W1: w1-state-while 18/11/0/0/0 | w1-loop-control 20/15/0/4 [g-loop-control 2/4, g-index-scan 2/4]/0 | w1-running-state 12/9/0/2 [2/4]/0 | w1-mutation-references 10/6/0/2 [2/4]/0 | w1-integration 5/5/0/0/0
W2: w2-contract 7/6/0/2/0 | w2-manual 28/23/0/2/0 | w2-testing 17/17/0/2/0 | w2-improve 14/11/0/0/0 | w2-solve-map 6/6/0/2/0 | w2-hashing 125/96/5/3 [g-hashing 3/8]/5 [217,242,1,49,128] (3 covered by path capstones; 5 multiple-choice reps earn no credit)
W3: w3-two-pointers 26/24/0/4 [2/4, 2/3]/2 [125,167] + readiness [11] | w3-running-prefix 12/12/10/2/2 [121,238]
W4: w4-windows 30/26/12/3 [1/2, 2/6]/1 [3] + [424] | w4-stacks 23/21/0/1 [1/2]/1 [20]
W5: w5-binary-search 17/16/13/2/1 [704] | w5-linked-lists 29/25/0/2/2 [206,21]
W6: w6-fast-slow 6/6/5/2/2 [141,19] | w6-recursion 16/13/6/2/0
W7: w7-trees 39/36/0/2/4 [104,100,226,572] | w7-bst 12/11/12/0 (ungated)/1 [235] + [98,230]
W8: w8-queue-bfs 17/14/4/2/1 [102] (1 choice rep) | w8-grids 28/25/0/2/1 [200] | w8-graphs 30/27/17/2/1 [1971] + [547]
W9: w9-cycles 9/8/3/2/1 [207] | w9-heaps 42/33/10/2/2 [215,347] (its lab is optional)
W10: w10-intervals 25/23/5/2/4 [56,57,435,252]
W11: w11-backtracking 27/23/11/2/1 [78] + [39] | w11-dp 31/26/3/2/2 [70,198]
W12: w12-dp-greedy 12/10/25/2/3 [322,53,55] + [139,62] | w12-matrix-tries 37/35/13/2/2 [54,208] + [48]
W13: w13-transfer 48/48/0/0/0 (all transfer reps, internal load 2 each = 96)
W14: w14-interview 55/55/0/0/0 (7 multiple-choice reps earn no credit; 39 retrieval/cold reps are queued with purpose 'gate')

=== WEEK 1 AND WEEK 2 SECTIONS (reps; NEW = c1-/c2- course content; LEGACY = October module) ===
w1-state-while: c1-state 6 NEW; c1-while 8 NEW; d05-while 4 LEGACY (Oct 5)
w1-loop-control: c1-loop-control 7 NEW; o2-loops 13 LEGACY (Oct 2)
w1-running-state: c1-running-state 6 NEW; d3-running-state 6 LEGACY (Oct 3)
w1-mutation-references: c1-mutation 5 NEW; c1-references 5 NEW
w1-integration: c1-decompose 5 NEW
WEEK 1 = 42 NEW + 23 LEGACY = 65 path reps
w2-contract: c2-contract 7 NEW
w2-manual: c2-manual 8 NEW; d3-strings 6, d3-slicing 7, d3-methods 7 LEGACY (Oct 3)
w2-testing: c2-testing 7 NEW; o11-edges 10 LEGACY (Oct 11 interview module; all stage retrieval, repType cold; they test binary search, stacks, intervals, grids and linked lists)
w2-improve: c2-improve 8 NEW; o2-complements 6 LEGACY
w2-solve-map: c2-solve-map 6 NEW
w2-hashing: o2-python-recall 7, o2-enumerate 7, o2-sets 7, o2-contains-duplicate 7, o2-dictionaries 7, o2-dict-revision 8, o2-get 6, o2-iter-dicts 4, o2-frequency 9, o2-dict-mastery 6, o2-dict-ladder 30, o2-valid-anagram 6, o2-index-maps 6, o2-two-sum 8, br-49 2, br-128 5, all LEGACY = 125 (optional: br-271, 5 reps)
WEEK 2 = 36 NEW + 161 LEGACY = 197 path reps. 149 of the Oct 2 module's 162 reps are required path; only the o2-cold gate variants and the optional br-271 are left out.

=== ZERO PRIOR ATTEMPTS vs OCTOBER-SPRINT LEARNER (courseStatus at 2026-10-26, mastery computed with computeAllMastery) ===
Zero history: every unit on the full route. Week 1 = 65 path + 8 gate passes = 73. Week 2 = 197 path + 11 gate passes = 208, plus 5 LeetCode targets that are never prescribed in the foundation weeks. Weeks 1-2 total = 262 path reps + 19 gate passes, against 110.
If the focused route dropped every lesson-level rep (static): Week 1 46, Week 2 159.
October sprint (113 required reps of Oct 2-7 passed):
  - Placement: w1-loop-control, w1-mutation-references and w2-hashing.
  - Focused: w1-integration.
  - Full route: w1-state-while.
  - Route paths total 251. If every placement gate passes first try, the queue asks for Week 1 = 35 path + 8 gate passes = 43 and Week 2 = 68 path + 11 gate passes = 79, so 122 against 110.
Sprint plus 90-day plan days through Oct 25:
  - w2-hashing is already ready (its gate variants were in the plan).
  - Most Week 1-2 units are in placement, so only 28 path reps are asked for.
  - w1-state-while starts focused with 7 lesson-level reps that are never offered (deadlock).

=== SIMULATION (repo functions; every prescribed rep passed clean first try; no warm-up or maintenance competition = best case) ===
Zero history, as coded:
  - Week 1 50/50: days 2-5 were filled with w2-hashing reps because Week 1 units stayed locked.
  - Week 2 60/60, Week 3 19/75, Weeks 4-14 0.
  - w1-state-while stays 'practicing 16/16' forever; the never-offered reps are c1-while-fill-change [complete] and d05-while-halve [trace].
  - Readiness says "1 week behind" and climbs to "14 weeks behind".
October sprint, as coded:
  - Week 1 42/50 (Oct 29: 9, Oct 30: 3; the queue ran out).
  - Week 2 3/60, then roughly 0.
Sprint plus plan through Oct 25, as coded: the queue is exhausted after 11 reps on Oct 27.
Zero history with the hidden reps passed by hand (deadlock bypassed):
  - Week 1 units ready Nov 3 (66 reps); Week 2 units ready Nov 20 (about 194 reps, calendar Week 4).
  - Week 1 ends at 50/50 with 2/4 checkpoints; Week 2 ends at 60/60 with 2/5 checkpoints.
  - Readiness: "2 weeks behind" in Weeks 3-6.
  - Week 13 18/60, Week 14 25/75; w13-transfer never becomes ready.
  - Days Today could not fill: Nov 26 5/15, Dec 11 6/15, Dec 14 4/15, Jan 15 3/15.
October learner with the deadlock bypassed:
  - Week 1 units ready Nov 2 (51 reps); Week 2 units ready Nov 12 (106 reps).
  - Week 1: 50/50 and 4/4 checkpoints, but Road to Ready does not show it complete (w1-integration 4/5) and readiness says "1 week behind" (at risk).
  - Weeks 11-13 are throttled to 33/75, 25/75 and 20/60 because only heavy Week 13 transfer reps remain, so those weeks show off track.
Placement trace (zero history, w2-hashing):
  - After 50 passes the unit enters placement and the queue holds 3 gate variants.
  - After 1 clean variant it returns to learning/focused with 61 more path reps.
  - Then the 2 remaining variants: 114 reps in total.
prescribe() with only the c13-transfer bank at N=15: 5 items, 0 more once those are done. With 5 warm-ups and 5 cold reps also available: 11 items.
weekProgress(1, today, 50/50 credits, labs 0/2, gates 0/4) on Oct 30, Oct 31 and Nov 1 (Sunday): 'on-track' every time. Only Nov 2 returns 'recoverable', and no production caller passes that date together with the labs and gates.

=== EXPLICIT QUESTIONS ===
Does anything make week completion depend on finishing the unit path?
  - weekProgress: no.
  - Indirectly, yes, in three ways:
    1. Gate variants are queued only after the route path is done (routing.ts:219-221), so the checkpoint count shown next to the week depends on the path, except in placement.
    2. Road to Ready marks a week 'Complete' only when every unit is ready (road-map.tsx:24). For ungated units that means the full path; for gated units it means the gates.
    3. Readiness counts how many weeks behind the course is from the earliest unready unit (readiness.ts:146).
  - The week card status and Today's "Day complete" are credits only.
Does weekProgress know about paths? No. Its inputs are credits per date plus optional counts of labs and gates; it never sees units, paths or targets.
Is any exercise classified individually (required path, optional, repair inventory, retrieval, placement, stretch)? No. Classification is by section only:
  - unit.sections are all treated as required.
  - unit.optional is used only as the repair pool.
  - readinessTargets are queued exactly like targets.
  - courseQueue's purposeOf is derived from stage and repType.
  - The migration audit's per-exercise action and purpose live only in planning/reps-v2-migration.json, and nothing reads that file at runtime.
```

### 1. [CRITICAL] Ungated units deadlock on the 'focused' route: w1-state-while never becomes ready, so the whole course stalls on day 2 — CONFIRMED (severity keep)
- Spec: §8 FIX 1 (acceptance), §2 principles 12-13, §7
- Evidence: lib/course/routing.ts:131 `if (path.length && path.filter((e) => passed.has(e.id)).length / path.length >= 0.4) return true` (counts passes made inside the unit itself); routing.ts:148 `const pathDone = full.every((e) => passed.has(e.id))`; routing.ts:154 `const ready = liveGates.length ? gatesCleared : pathDone`; routing.ts:157 `const path = route === 'focused' ? full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id)) : full`; routing.ts:218 `for (const e of s.path) if (!passed.has(e.id)) out.push(...)` (the queue serves only the route path); data/course/units.ts:50, 172 and 371 `gateIds: [],` (w1-state-while, w2-improve, w7-bst); routing.ts:206-207 `const horizon = (frontier?.unit.week ?? 14) + 1`
- Detail: For an ungated unit, 'ready' requires every rep of the full path, but once 40% of the path is passed the route becomes 'focused'. From then on the queue never offers the unpassed lesson-level reps.

- **w1-state-while:** walking the queue one pass at a time, it flips after 8 of 18 passes. c1-while-fill-change [complete] and d05-while-halve [trace] are never offered, so the unit sits at 'practicing 16/16' forever.
- **w2-improve:** flips after 6 of 14; o2-comp-set-trace is never offered.
- **w7-bst:** flips after 5 of 12; b230-trace-inorder is never offered.

w1-state-while is a prerequisite of 30 of the 33 units. The stuck unit also pins the queue horizon at Week 2.

Full simulation with the repo's own functions, every rep passed clean:
- A zero-history learner gets 50/50 and 60/60 in Weeks 1-2. Week 1 days 2-5 are filled with w2-hashing reps.
- Then 19 credits in Week 3 and 0 for Weeks 4-14. Readiness says '2 weeks behind' and climbs to '14 weeks behind'.
- A learner with the October sprint plus the 90-day plan through Oct 25 starts with w1-state-while already focused (route path 11 of 18; 7 reps never offered). Today runs out after 11 reps on Oct 27.

No other surface exposes the dropped reps. UnitStatus.path is read only by courseQueue, and nextInOrder walks only the 90-day ORDER.
- Suggested fix: Decide readiness from the same list the queue serves. For an ungated unit on the focused route, ready should mean the focused path is passed; never drop a rep that pathDone still requires. Evaluate prior evidence only from attempts dated before the unit's first course attempt, so a unit cannot flip in the middle of itself. Add a test that walks every unit to 'ready' purely through courseQueue.
- Verifier: I checked the cited code and ran the repo's own courseStatus and courseQueue on a zero-history learner, always passing the first queued rep cleanly. The temporary script was deleted afterwards. The claim's central mechanism holds exactly.

1. **Readiness needs the full path.** In lib/course/routing.ts, an ungated unit is ready only when `pathDone = full.every(...)` is true (line 148, used at line 154).
2. **The route turns focused at 40%.** priorEvidence (line 131) counts passes inside the unit's own path, so the route becomes 'focused' once 40% of it is passed.
3. **The focused path drops lesson reps.** Line 157 removes unpassed LESSON_LEVEL reps (recognize, trace, recall, complete).
4. **The queue never offers them.** courseQueue (line 218) serves only `s.path`.

Simulation results for w1-state-while:
- Passes 0 to 7 run on the full route, with done/total going from 0/18 to 7/18.
- After the 8th pass the unit flips to 'practicing focused' at 8/16.
- It reaches 16/16 after 16 passes and stays 'practicing' (never ready).
- From then on the queue serves w2-hashing reps, and it is empty after 130 passes.

Final state:
- w1-state-while: practicing, focused, 16/16, never ready.
- w2-improve and w7-bst: never reached; the run ends with them unseen, 0/14 and 0/12, locked.
- 30 of the 33 units are locked.

So Today's course queue stalls permanently, which makes the course progression untruthful. Critical is justified.

One part of the claim is overstated: 'No other surface exposes the dropped reps.' The dropped reps can still be reached in other ways:
- Any rep opens directly at /rep/[id].
- components/day-view.tsx:149-195 offers 'sectionNext' links for the sections shown on a day. d05-while-halve is scheduled on a 90-day plan day (data/schedule-90.ts:1701), so a learner going through /day pages could pass it.

c1-while-fill-change (a course week-1 section) appears to have no guided surface apart from a direct URL.

The deadlock is therefore in the guided course queue, which is what Today and the horizon run on. It is not a strict impossibility: passing the hidden reps from another surface would unstick the unit. I did not independently re-run the October-sprint learner scenario or the week-by-week credit and readiness numbers. Corrected: Confirmed by simulation with the repo's own functions.

For an ungated unit:
- 'ready' needs every rep of the full path (lib/course/routing.ts:148 and 154).
- priorEvidence turns the route to 'focused' once 40% of the unit's own path is passed (routing.ts:131).
- The focused path then removes the unpassed lesson-level reps (routing.ts:157).
- courseQueue only serves `s.path` (routing.ts:218).

For w1-state-while, the route flips after 8 of 18 passes. The unit then sits at 'practicing focused 16/16' indefinitely; the two dropped reps are c1-while-fill-change and d05-while-halve. It never becomes ready.

Because of that:
- Its 30 dependent units stay locked. In the run, w2-improve and w7-bst were still unseen and locked at the end.
- The queue fills with w2-hashing reps and is empty after 130 passes.

Correction: 'no other surface exposes the dropped reps' is overstated. Every rep is reachable directly at /rep/[id]. The /day/[date] DayView also links each shown section's next unpassed rep (components/day-view.tsx:149-195), and d05-while-halve is on a 90-day plan day (data/schedule-90.ts:1701). A learner could therefore unstick the unit by finding these reps outside Today.

The guided course queue (Today, Road to Ready, and the horizon) still deadlocks with no way out inside the queue, so the critical severity stands. I did not re-check the October-sprint scenario or the week-by-week credit and readiness figures.

### 2. [CRITICAL] Week 1 and Week 2 required paths are 1.46x and 3.55x the 50/60 contract; w2-hashing alone is 125 required reps — CONFIRMED (severity keep)
- Spec: §8 FIX 1 (Week 1 fits 50, Week 2 fits 60; do not inherit whole legacy sections), §29 curriculum math
- Evidence: data/course/calendar.ts:74-83 `if (week <= 1) return 10 / if (week === 2) return 12 ... return trainingDays(n).length * dailyTarget(n)`; lib/course/routing.ts:73-75 `unitReps` = `unit.sections.flatMap(...).filter((e) => !GATE_OF_EXERCISE[e.id])` (every rep of an inherited section is required); data/course/units.ts:201 w2-hashing `sections: ['o2-python-recall', 'o2-enumerate', ... 'o2-dict-ladder', ... 'br-49', 'br-128']`; units.ts:197 purpose 'Sets and dictionaries are already yours: prove it cold, then keep them fresh.'; units.ts:198 `prerequisites: [],`; units.ts:141 `sections: ['c2-manual', 'd3-strings', 'd3-slicing', 'd3-methods']`; planning/reps-v2-migration.md:40 `| 2 | Problem Solving | 169 | 5 | 36 |` (the repo's own audit already showed this)
- Detail: **Week 1:** 65 path reps (42 new c1 + 23 legacy) + 8 gate passes = 73 against 50.

**Week 2:** 197 path reps (36 new c2 + 161 legacy) + 11 gate passes + 5 LeetCode targets = 213 against 60.

- 149 of the 162 reps in the Oct 2 module are required path.
- w2-hashing's own purpose describes retrieval ('already yours: prove it cold'), but it is encoded as 125 required reps.
- With `prerequisites: []` it is open and inside the queue horizon from Week 1 day 1.
- Even if the focused route dropped every lesson-level rep, Weeks 1-2 would still be 205 path reps.

**October-sprint learner:** routing at course start asks for Week 1 = 43 and Week 2 = 79 (122 against 110), even if every placement gate passes first try.

**Simulation, best case with the deadlock bypassed:**
- Zero history finishes Week 1 units on Nov 3 (66 reps) and Week 2 units on Nov 20, in calendar Week 4 (about 194 reps).
- The October learner finishes Week 2 units on Nov 12 (106 reps).
- Cumulative lag for zero history: 176 reps behind after Week 2, 56 after Week 8, caught up only in Week 13.

The learner is told 50 and 60 are enough while the required curriculum is not finished: the '50/50 but not done' case §8 forbids.
- Suggested fix: Curate each week's required path down to its target, after allowing for gate passes and roughly 20% warm-up and maintenance.

- **Week 1:** the 42 c1 reps plus 8 gate passes, with legacy o2-loops, d3-running-state and d05-while cut to 1-2 picked reps or moved to repair inventory.
- **Week 2:** the 36 c2 reps plus 11 gate passes.
- **w2-hashing:** make it placement-first (g-hashing cold) plus retrieval for every learner. Its 125 reps become repair inventory or optional, and it should not be served in Week 1 (give it a week floor or prerequisite).
- Verifier: I checked the core claim by running unitReps() and courseStatus() over the real UNITS, SECTION_BY_ID and EXERCISE_BY_ID with no attempts (throwaway script, since deleted).

- **Week 1:** 65 required path reps across w1-state-while (18), w1-loop-control (20), w1-running-state (12), w1-mutation-references (10) and w1-integration (5). Adding 8 gate passes from 4 gates gives 73. weekTarget(1) is 50, so the ratio is 1.46x.
- **Week 2:** 197 path reps plus 11 gate passes plus 5 LeetCode targets gives 213. weekTarget(2) is 60, so the ratio is 3.55x.
- **w2-hashing:** unitReps returns 125 reps. It inherits 16 whole legacy sections, and o2-dict-ladder alone holds 30.
- **Lesson-level reps:** Week 1 has 19 and Week 2 has 38. Dropping them all, as the focused route might, leaves 46 + 159 = 205. That matches the claim.
- **unitReps (lib/course/routing.ts:73-75):** it requires every non-gate rep in every listed section. courseStatus (routing.ts:148, `pathDone = full.every(...)`) only lets a gateless unit become ready once all of them are passed. Gated units become ready once their gates clear. courseQueue (routing.ts:221-223) still queues every unpassed path rep, and only offers gate variants after the whole path is done.
- **w2-hashing is open from day 1:** it has `prerequisites: []` (units.ts:198). courseStatus reports it unlocked at course start (locked=false, total=125). The frontier is in Week 1, so horizon = week + 1 = 2 includes it in the queue.
- **50/50 is reported as done:** weekProgress (lib/course/week-status.ts) decides week status only from credits >= weekTarget plus labs and gates counts. It never checks unit path completion. A learner can therefore be shown on track at 50/50 or 60/60 while the required unit paths are far from finished. That is exactly what §8's acceptance criterion forbids.

What I did not verify:
- The October-learner routing figures (43 and 79).
- The calendar simulation dates and lag figures (Nov 3, Nov 20, 176 reps behind, and so on).
- The "149 of 162" figure.

These depend on modelling assumptions such as the "deadlock bypass". They do not change the conclusion. Also, planning/reps-v2-migration.md:40 says 169 legacy reps are required for Week 2, while the live code computes 197 - 36 = 161. So that doc is slightly stale, but it is directionally the same.

Critical severity is warranted. This is the exact "50/50 but still not done" untruthfulness that §8 calls unacceptable. Corrected: The core numbers check out exactly. Week 1 needs 65 path reps plus 8 gate passes (73) against a target of 50. Week 2 needs 197 path reps plus 11 gate passes plus 5 targets (213) against 60. w2-hashing alone is 125 reps (unitReps over 16 inherited o2/br sections, including o2-dict-ladder with 30). With `prerequisites: []` it is unlocked and inside the queue horizon from day 1. Dropping all lesson-level reps still leaves 205 path reps across Weeks 1-2.

weekProgress (lib/course/week-status.ts) marks a week on track from credits, labs and gates alone, without checking unit path completion, so the forbidden "50/50 but not done" state really happens.

Minor caveats: the migration doc's 169 is stale (the code now gives 161 legacy reps in Week 2). The October-learner figures (43 and 79) and the simulation dates and lag figures were not independently checked and rest on modelling assumptions.

### 3. [CRITICAL] Week 2 w2-testing requires binary search, stacks, intervals, grids and linked-list reps before they are taught, shown as 'Checkpoint' — CONFIRMED (severity keep)
- Spec: §2 principle 3 (teach prerequisites before testing them), §8 (classify inherited legacy sections)
- Evidence: data/course/units.ts:156 `sections: ['c2-testing', 'o11-edges'],`. Reps and skills: o11-wt-bsearch {search_invariant, binary_search: Week 5}, o11-edge-bsearch-fix {binary_search: Week 5}, o11-dbg-brackets {stack_push_pop, matching_pairs: Week 4}, o11-dbg-touching {interval_overlap: Week 10}, o11-edge-kth-end {linked_list_traversal: Week 5, two_pointer: Week 3}, o11-dbg-empty-grid {grid_nested}. lib/course/routing.ts:194 `if (e.repType === 'cold' || e.stage === 'retrieval') return 'gate'`; components/use-today-plan.ts:65 `required: q.purpose === 'gate' || q.purpose === 'repair'`; components/course/course-today.tsx:42 `gate: 'Checkpoint'` and :54 'A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next.'
- Detail: The whole o11-edges section (10 retrieval/cold reps from the October interview module) is required path in Week 2. The heuristic check found 5 of them using skills the course first teaches in Weeks 3-10. o11-wt-two-sum also needs index maps from w2-hashing, which comes later in Week 2's teaching order.

Today labels these items 'Checkpoint', and they bypass the foundation-week checks cap as 'required'. In the zero-history simulation, Nov 9 prescribed 11 of these 'gate' items from w2-testing.

The same purposeOf rule labels 55 ordinary path reps as checkpoints across the course: w2-testing 10, w10-intervals 2, w12-matrix-tries 4, w14-interview 39.
- Suggested fix: Take o11-edges out of w2-testing and use it as Week 14 retrieval or interview inventory. Fill w2-testing with c2 testing reps on Week 1-2 skills only. Stop mapping repType cold / stage retrieval path reps to purpose 'gate'. Add a content test that no required rep in week w uses a gate or retrieval skill first owned by a later week.
- Verifier: I checked every part of the claim against the code and could not refute any of it. data/course/units.ts:156 sets w2-testing `sections: ['c2-testing', 'o11-edges']`. unitPath and unitReps use the whole o11-edges section as required path. None of its reps are gate variants: in w2-testing, GATE_OF_EXERCISE matches nothing. data/exercises/oct11.ts sets every edge rep to `stage: 'retrieval', repType: 'cold'` (lines 19 `const R` and 768 `const W`). That means purposeOf (lib/course/routing.ts:194) returns 'gate' for all 10. courseQueue (routing.ts:218) pushes them with that purpose. use-today-plan.ts:65 sets `required: true` for them. lib/today-plan.ts:120/125 then exempts them from the checks cap (`c.required || checks < checksMax`). course-today.tsx:42/54 labels them 'Checkpoint' and says "Passing it unlocks what comes next."

I ran a throwaway script, since deleted, that maps each skill to the first unit whose retrievalSkills includes it:
- o11-wt-bsearch: search_invariant, Week 5
- o11-edge-bsearch-fix: binary_search and search_invariant, Week 5
- o11-dbg-brackets: stack_push_pop and matching_pairs, Week 4
- o11-dbg-touching: interval_overlap, Week 10
- o11-edge-kth-end: linked_list_traversal, Week 5; two_pointer, Week 3
- o11-dbg-empty-grid: grid_nested, which no unit lists as a retrieval skill at all
- o11-wt-two-sum: index_map and complement from w2-hashing, which comes after w2-testing in UNITS order

The script also counted, course-wide, non-gate-variant path reps classed as 'gate', deduplicated by first unit. It got exactly the claimed 55: w2-testing 10, w10-intervals 2, w12-matrix-tries 4, w14-interview 39.

This breaks §2 principle 3 (teach prerequisites before testing them). It also fits §8's warning against inheriting whole legacy sections as required curriculum. The rule mislabels ordinary retrieval reps as checkpoints that "unlock" things, which is untruthful (principle 12). Critical is justified.

One part I did not reproduce: the Nov 9 zero-history simulation figure of 11 gate items. The queue mechanics make it plausible. Corrected: I confirmed the claim; the only thing I didn't re-run was the Nov 9 simulation count. In Week 2, w2-testing requires all of o11-edges (data/course/units.ts:156). That section has 10 retrieval/cold reps, from data/exercises/oct11.ts:768 (`const W = { stage: 'retrieval', repType: 'cold', ... }`) and :19 (`const R`). purposeOf (lib/course/routing.ts:194) classes them all as 'gate'. Today then marks them `required` (components/use-today-plan.ts:65), exempts them from the checks cap (lib/today-plan.ts:120,125) and labels them 'Checkpoint' (components/course/course-today.tsx:42,54).

Six of them test skills that are taught later, or never named in any unit's retrievalSkills:
- binary search / search_invariant: Week 5
- stack and matching pairs: Week 4
- interval_overlap: Week 10
- linked_list_traversal: Week 5
- two_pointer: Week 3
- grid_nested: no unit's retrievalSkills names it

A seventh, o11-wt-two-sum, needs index_map, taught in w2-hashing, which comes later in Week 2.

Across the course, purposeOf labels 55 path reps (gate variants excluded) as checkpoints: w2-testing 10, w10-intervals 2, w12-matrix-tries 4, w14-interview 39.

### 4. [MAJOR] Placement starts mid-path and ends after the first checkpoint attempt, then sends the learner back to the full path — CONFIRMED (severity keep)
- Spec: §8 (gates must fit the designed workload; PLACEMENT classification), §2 principle 8
- Evidence: lib/course/routing.ts:131 (the 40% rule counts in-unit passes); routing.ts:164 `else if (prior && liveGates.length && !liveGates.some((g) => g.attempted)) state = 'placement'`; routing.ts:212-214 placement queue = gate variants only; routing.ts:219-221 `// Gates once the path is done ... if (s.path.every((e) => passed.has(e.id)))`; docs/reps-2.md: 'Placement: earlier production evidence means the gate is offered first. Passing it skips the teaching.'
- Detail: Traced on w2-hashing for a zero-history learner, passing reps in queue order:

1. After 50 passes (40%) the unit becomes 'placement', and the queue holds 3 gate variants and no path reps.
2. After 1 clean variant, `g.attempted` ends placement. The unit goes back to learning/focused with 61 more path reps.
3. Only then are the remaining 2 variants offered: 114 reps in total.

That is neither placement (50 + 3) nor the full route (125 + 3).

- 'Passing it skips the teaching' is false for every gate with need >= 2 (28 of 30 gates) and for the units with two gates (w1-loop-control, w3-two-pointers, w4-windows).
- October learner on w1-loop-control: 4 placement variants become 1 + 5 path reps + 3 = 9.
- Suggested fix: Keep the unit in placement until every live gate is cleared or a placement variant fails. Fall back to the focused path only after a failure. Judge prior evidence only from attempts before the unit started.
- Verifier: I confirmed this by reading the code and by running a throwaway simulation that called the real courseStatus/courseQueue. The script was created in scripts/ and then deleted. In the simulation every prior unit was ready, and each rep was passed clean in queue order.

**What the code does**
- `priorEvidence` (lib/course/routing.ts:131) counts passes inside the unit's own path toward the 40% threshold. So a zero-history learner becomes "prior" partway through the unit.
- In routing.ts:164, state is 'placement' only while `!liveGates.some((g) => g.attempted)`. `attempted` is `tries.length > 0` (routing.ts:124), so a single gate try ends placement, pass or fail.
- After that the unit falls through to learning/practicing on the 'focused' route, because `prior` stays true.
- In that state courseQueue (routing.ts:216-221) queues the unpassed path reps. It offers further gate variants only when `s.path.every((e) => passed.has(e.id))`.

**Simulation on w2-hashing**
| Step | State | What happens |
|---|---|---|
| 0 | unseen | Full route, 125 path reps |
| 50 | placement | Focused route, path 111. The queue is `gate,gate,gate` with no path reps |
| 51 | learning | One clean variant done (clean 1/3); the gate is no longer offered |
| 57 | practicing | Grinding the path |
| 114 | ready | 111 path reps + 3 variants = 114 reps in total |

That is neither 50+3 (placement) nor 125+3 (full route).

**Simulation on w1-loop-control** (gates g-loop-control and g-index-scan, need 2 each, 4 available)
- Placement starts at step 8, and the queue holds 4 gate variants.
- One variant ends placement.
- The learner then does the remaining 9 focused path reps before the other 3 variants, reaching ready at step 22.

**Counts**
- 28 of 30 gates have need >= 2, as claimed.
- The units with two gates are w1-loop-control, w3-two-pointers and w4-windows, as claimed.

**The docs and the test**
- docs/reps-2.md:38 says 'Passing it skips the teaching.' That is false whenever a gate needs more than one variant, or a unit has more than one gate, and the learner takes the variants one at a time.
- The existing test (routing.test.ts 'placement: earlier evidence...') passes only because it records attempts on every queued variant at once. It never re-routes between variants, so it hides the bug.

**Caveats**
- I did not reproduce the exact 'October learner' figure (1 + 5 + 3 = 9), because it depends on real October history. The mechanism behind it is the same, and my zero-history w1-loop-control run shows the same pattern.
- Calling the post-placement path the 'full path' is slightly loose. The return is to the focused route, which drops unpassed lesson-level reps (125 becomes 111), not the full 125-rep path. The claim's own numbers already reflect this.

**Severity**
Major is right. Placement in this code cannot let a learner place out with production evidence, which is what master spec §11 'Strong: cold checkpoint → pass → ready' asks for. It also inflates the required workload, against §8 'Gates must fit the week's designed workload' and the truthfulness principle. Corrected: The claim is accurate. One small wording fix: after the first gate attempt the learner goes back to the focused route, not the full path. The focused route drops unpassed lesson-level reps, so w2-hashing is 111 path reps instead of 125.

The mechanism, in lib/course/routing.ts:
- Line 124: `attempted: tries.length > 0`.
- Line 164: `else if (prior && liveGates.length && !liveGates.some((g) => g.attempted)) state = 'placement'`. Placement ends after any one gate try.
- Lines 219-221: further gate variants are offered only `if (s.path.every((e) => passed.has(e.id)))`.

Verified traces:
- **w2-hashing:** placement at 50 passes (queue = 3 gate variants). After 1 clean variant the state becomes learning/focused, and 61 more path reps come before the last 2 variants. That is 114 reps to ready.
- **w1-loop-control (zero history):** placement at 8 passes (4 variants). After 1 variant come 9 more path reps, then 3 variants. That is 22 reps to ready.

28 of 30 gates have need >= 2, and three units have two gates, so 'passing it skips the teaching' (docs/reps-2.md:38; routing.ts header comment) is false whenever variants are taken one at a time. routing.test.ts misses this because it passes all queued variants in one batch. I did not verify the October-history '9' figure, but the same mechanism produces it.

### 5. [MAJOR] Week completion: weekProgress ignores paths, its lab/checkpoint rule never fires in production, and four surfaces disagree — CONFIRMED (severity keep)
- Spec: §7 (week completion requires output, labs, checkpoints, targets), §8 acceptance, §26 (no contradictory systems)
- Evidence: lib/course/week-status.ts:60 `weekProgress(week, today, credits, extra = {})`; :64 `const done = dates.filter((d) => d <= today).reduce((n, d) => n + (credits[d] ?? 0), 0)`; :69 `const ended = today > dates[6]`; :78 `if (ended && status === 'on-track' && ((extra.labsDone ?? 0) < labsRequired || ...)) status = 'recoverable'`; components/use-course-day.ts:32 passes the labs and gates only for the current week (today is never after Sunday); use-course-day.ts:34 and components/course/readiness-report.tsx:87 `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate)` (no extras, and today = Sunday, so ended is false); components/course/road-map.tsx:24 `if (units.length && units.every((u) => u.state === 'ready' || u.state === 'maintenance')) return 'complete'`; readiness-report.tsx:90 `const complete = p.done >= p.target && labs... && gates.every((g) => g.cleared)`; lib/course/readiness.ts:146 `const behindWeeks = frontier ? Math.max(0, week - frontier.unit.week) : 0`; components/course/course-today.tsx:68 `const complete = day.type === 'training' && done >= target`
- Detail: **weekProgress is path-blind.** It counts any qualifying credit from any unit, and never sees paths or targets.

**Its lab/checkpoint downgrade is dead code in production.** weekProgress(1, …) with 50/50 credits, 0/2 labs and 0/4 checkpoints returns 'on-track' on Oct 30, Oct 31 and Nov 1. Only a Monday-after call would return 'recoverable', and no caller passes extras with that date. The week card then reads 'Week 1: 50 of 50. On track for February 1 if this output continues.' (course-cards.tsx:35, motivation.ts:122).

**Four surfaces define a finished week differently:**
- The week card uses credits only.
- Road to Ready 'Complete' uses unit readiness (paths and gates) and ignores credits and labs.
- The readiness report's 'Week N complete' uses credits + labs + gates.
- Readiness counts how many weeks behind the course is from the earliest unready unit.

**The path still decides things indirectly.** Gate variants are queued only after the path (routing.ts:219-221).

**Simulation, deadlock bypassed:**
- October learner: Week 1 ends at 50/50 and 4/4 checkpoints with the week card 'On track', but Road to Ready shows it not complete (w1-integration 4/5) and readiness says 'The course is 1 week behind the calendar' (at risk).
- Zero history: 50/50 with 2/4 checkpoints, after Today said 'Day complete' every day.
- Required target problems are part of no contract; they are only queued (routing.ts:225).
- Suggested fix: Write one pure week-contract function covering credits, required labs, gate statuses, required targets and (after curation) the required path. Use it in the week card, Today, Road to Ready, the readiness report and readiness. Evaluate finished weeks with ended = true and pass the labs and gates for every week, not only the current one.
- Verifier: I read the code and the claim holds. In lib/course/week-status.ts:69, `ended = today > dates[6]`, and the lab/checkpoint downgrade at :78 runs only when `ended` is true. The only caller that passes extras is components/use-course-day.ts:32. It passes the current week (`courseWeekOf(today)`), so today can never be after that week's Sunday and the downgrade never fires. The other callers pass no extras, so the labs and gates they hand in are zero by default:
- use-course-day.ts:34 (`weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate)`, where today is Sunday, so `ended` is false anyway)
- readiness-report.tsx:87
- road-map.tsx (`weekProgress(w.number, today, byDate)`)

As a result, the `finished` statuses fed to readiness() come from credits alone. weekProgress counts any credit on the week's dates (:64) and knows nothing about paths or target problems.

The surfaces really do disagree:
- road-map.tsx:24 marks a week 'complete' only when every unit is ready or in maintenance, which brings in paths and gates indirectly and ignores credits and labs.
- readiness-report.tsx:90 requires credits, required labs and gates, but not target problems.
- readiness.ts:146 measures how far behind the course is from the earliest unready unit.
- The week card shows the credits-only status.

Spec line 170 requires week completion to include "required target problems". No surface checks them. routing.ts:224-225 only queues targets once a unit is ready, and only after the path; gate variants likewise come only after the path (:219-221).

Spec line 200 ("No '50/50 but still not actually done'") and line 389 ("There should not be contradictory systems") are both violated. I did not re-run the October and zero-history simulations numerically. They follow from the code paths above, but treat them as plausible rather than confirmed. Corrected: The claim is accurate. Two refinements:
1. readiness() takes its `finished` week statuses from credits only (use-course-day.ts:34 passes no extras). So the readiness read's "last week finished" signal also ignores labs and gates.
2. The readiness report's "Week N complete" (readiness-report.tsx:90) does check labs and gates. Like every other surface, it omits the required target problems that spec line 170 requires, so no surface implements the full four-part contract.

The October and zero-history simulations follow from the code but I did not reproduce them numerically.

### 6. [MAJOR] Week 13's transfer bank can't be prescribed at 15 a day; Week 14 stays locked behind all 48; learners who are ahead are throttled and shown off track — CONFIRMED (severity keep)
- Spec: §8 (holiday and normal weeks must fit their targets; daily target and path must agree), §7
- Evidence: lib/today-plan.ts:67 `export const LOAD_HEADROOM = 1.3`; today-plan.ts:120 `const fits = (c) => count < N && (c.units <= 1 || load + c.units + (N - count - 1) <= maxLoad) && ...`; today-plan.ts:171 `if (e.transfer) return 2`; data/course/units.ts:562 `sections: ['c13-transfer'],`; units.ts:576 w14-interview `prerequisites: ['w13-transfer'],` (w13-transfer is ungated, so all 48 reps must pass)
- Detail: Calling prescribe() with the 48-rep c13-transfer bank at N=15 gives 5 items, and 0 more once those are done. With 5 warm-ups and 5 cold reps also available it gives 11 (5 transfer + 3 + 3).

Week 13 therefore tops out at about 20 course credits (44 with full maintenance) against its 60 target. w14-interview cannot unlock for about 10 training days.

**Simulations:**
- Zero history: Week 13 18/60 and Week 14 25/75; w13-transfer never becomes ready.
- October learner, who is ahead: Weeks 11-13 at 33/75, 25/75 and 20/60 because only Week 13 transfer reps remain. Those weeks are shown 'off-track' although every offered item was done.
- Other days with only heavy or locked items also cannot be finished, e.g. Nov 26 at 5/15 and Dec 14 at 4/15 in the zero-history run.
- Suggested fix: Let the plan exceed the load headroom when no lighter required work exists, or count transfer reps as 1 for the cap. Make the Week 13 target agree with the bank, for example 48 transfer + 12 retrieval. Unlock Week 14 on the transfer grade rather than 48 of 48 passes.
- Verifier: I confirmed the core mechanism by reading the code and running prescribe() in a throwaway script, which I deleted afterwards.

- **Every Week 13 rep weighs 2.** data/exercises/course/week13.ts sets `const transfer = { transfer: true, repType: 'pattern' }` on the c13-transfer reps. repUnits (lib/today-plan.ts:171, `if (e.transfer) return 2`) therefore gives each of them load 2. components/use-today-plan.ts:53 builds course candidates with `units: repUnits(...)`.
- **The load check caps the day at 5.** `maxLoad = loadLimit(15) = Math.round(19.5) = 20`. The check at today-plan.ts:120 is `load + c.units + (N - count - 1) <= maxLoad`. After k transfer reps it becomes 2k + 2 + (14 - k) <= 20, so k <= 4 and only 5 reps are taken.
- **Simulation results.** A 48-rep transfer plan at N=15 gave 5 items. After those 5 were passed as doneToday it gave 0 new items and `complete=false`. With 5 warm and 5 cold candidates added it gave 11 (3 warm, 5 transfer, 3 cold), exactly as claimed.
- **Today then has nothing left to offer.** In components/today-training.tsx the CTA comes from `next` and is null with no item left. The Optional block only renders `{plan.complete && ...}`. So the Today card sits at 5/15 with no next step and no "keep going" link.
- **Week 14 waits on every transfer rep.** w13-transfer has `gateIds: []`, and routing.ts courseStatus sets `ready = liveGates.length ? gatesCleared : pathDone`, so all 48 reps must pass. w14-interview has `prerequisites: ['w13-transfer']`, and courseQueue skips locked units (`if (s.unit.week > horizon || s.locked) continue`). At about 5 reps a day that takes roughly 10 training days.
- **Week status follows credits only.** lib/course/week-status.ts:72-73 marks the week 'off-track' when `shortfall > rate` or an ended week has `target - done > rate`, using credits alone. dailyTarget(13) = 15, so a learner who does only what Today prescribes falls short and is shown off track.

What I did not verify, and one caveat:
- I did not re-run the per-date calendar simulations (18/60, 25/75, Oct-learner 33/75, Nov 26 5/15, Dec 14 4/15).
- The learner is not strictly blocked. Transfer reps opened from the Course page still earn credit through lib/course/credit.ts, which has no load throttle. So 'can't be prescribed' and 'shown off track although every offered item was done' are accurate, but the 60 is reachable off-Today.

This still breaks §7 (daily target and path must agree) and §8 Acceptance (doing the prescribed daily work must complete the week). Major is right. Corrected: The mechanism is confirmed, but four details need tightening:

1. **Units come from repUnits.** The Week 13 cap comes from repUnits returning 2 for any exercise with `transfer: true`, which covers all of c13-transfer. Load 2 is not tied to the 'transfer' kind label.
2. **Five is the most a day can take.** With LOAD_HEADROOM 1.3, maxLoad is 20 at N=15. Only 5 reps of load 2 fit (2k + 2 + (14 - k) <= 20 gives k <= 4).
3. **Today then has nothing to offer.** Once those 5 are done, prescribe() returns no new items and `complete` stays false. today-training.tsx shows neither a CTA nor the Optional "keep going" link, because Optional only renders when `plan.complete` is true.
4. **The off-track label applies to learners who stay on Today.** Transfer reps opened from the Course page still earn credit with no throttle. So the shortfall and the 'off-track' status (week-status.ts:72-73) hit learners who follow Today's prescription, not every learner.

The per-date simulation figures (18/60, 25/75, 33/75, Nov 26 5/15, Dec 14 4/15) were not independently re-run.

### 7. [MAJOR] Week 8 exceeds its 75 target, and the course's load is front-loaded: 176 reps behind after Week 2 — CONFIRMED (severity keep)
- Spec: §8 (normal later weeks must fit ~75), §29
- Evidence: data/course/units.ts:388 `sections: ['o7-deque', 'o7-tree-bfs', 'o7-cap-level-order']`; :404 `sections: ['o7-grids', 'o7-neighbors', 'o7-grid-bfs', 'o7-islands', 'o7-cold']`; :419 `sections: ['o8-adjacency', 'o8-dfs', 'o8-bfs', 'o8-cap-path-exists', 'o8-components', 'o8-cap-provinces']`
- Detail: **Week 8:** 75 path reps + 6 gate passes + 3 targets = 84 against 75. The path alone uses the whole week, leaving no room for checkpoints, warm-ups, maintenance or repairs.

**Distribution across the course:**
- Over target: Week 1 1.46x, Week 2 3.55x, Week 8 1.12x.
- Under target: Week 3 0.64x, Week 6 0.37x (28 of 75), Weeks 10-12 0.69-0.87x.

**Cumulative lag** (required load minus target): +23 after Week 1, +176 after Week 2, +149 after Week 3, +64 after Week 6, +56 after Week 8, +1 after Week 13. The total of 931 against 950 hides the imbalance.
- Suggested fix: Trim w8-grids and w8-graphs, for example by moving o7-islands or o8-components to optional or repair inventory. Rebalance so each week's required load is at most its target minus about 20%, and use the under-filled weeks (3, 6, 10-12) for retrieval and spaced review instead of spill-over.
- Verifier: I recomputed the load for every week using the repo's own helpers (unitPath, GATES, weekTarget) in a throwaway script, which I deleted afterwards. The auditor's numbers come out exactly when the path is counted the way lib/course/routing.ts:73 unitReps counts it, which drops reps that are gate variants (`.filter((e) => !GATE_OF_EXERCISE[e.id])`).

Week 8 is the three units at data/course/units.ts:388, :404 and :419, against weekTarget = 75:
- The sections hold 78 reps. 3 of them are gate variants, so 75 path reps remain.
- The gates need 6 clean passes in total (g-queue, g-grid, g-graph-traversal).
- There are 3 LeetCode targets (102, 200, 1971).
- 75 + 6 + 3 = 84, which is 1.12x the target.

Other weeks:
- Week 1: 65 + 8 = 73 against 50 (1.46x).
- Week 2: 197 + 11 + 5 = 213 against 60 (3.55x).
- Week 3: 48 against 75 (0.64x).
- Week 6: 28 against 75 (0.37x).
- Weeks 10 to 12: 31/45 (0.69x), 65/75 (0.87x), 58/75 (0.77x).

The running excess over target is +23 after Week 1, +176 after Week 2, +149 after Week 3, +64 after Week 6, +56 after Week 8 and +1 after Week 13. The course total is 931 against 950. All of these match the claim.

The path really does carry over from week to week. Units are ordered by prerequisites, and courseQueue serves each unit's path in order, so extra work in Weeks 1 and 2 pushes later work back. Meanwhile weekProgress (lib/course/week-status.ts:60) only checks credits against weekTarget, plus gates and labs. That is the hidden backlog that §8's acceptance rule forbids.

Three small corrections:
1. Not every path rep earns credit. qualifies() in lib/course/credit.ts:65 credits only code, output, reorder and explain reps. Week 2 has 5 path reps that earn nothing and Week 8 has 1, so the qualifying load is slightly lower (Week 2: 192 + 11 + 5).
2. For a unit with gates, routing.ts:154 sets `const ready = liveGates.length ? gatesCleared : pathDone`. Clearing the gates therefore makes a unit ready even when its path is unfinished. The path is the work the queue prescribes, not a hard condition for the unit's status. It still counts as required work for §8 and §29.
3. The 84 counts only the 75 non-gate reps. Counting the full sections gives 78 + 6 + 3 = 87 (1.16x).

On severity: Week 8 on its own is a mild overrun. Together with the front-loading it materially fails §8 ("Normal later weeks must fit ~75", "No hidden backlog") and the §29 curriculum-math test, so major is right. Corrected: The claim is correct as stated, with three small corrections:
- Counted the routing.ts:73 unitReps way (gate variants removed), Week 8 needs 75 path reps + 6 gate passes + 3 LeetCode targets = 84 against 75. Counting every rep in its sections (units.ts:388, :404, :419) gives 78 + 6 + 3 = 87, which is 1.16x.
- One Week 8 rep, and five Week 2 reps, are not credit-earning kinds under credit.ts:65 qualifies(). The qualifying load is therefore a little lower, for example Week 2 at 192 + 11 + 5 = 208 against 60.
- Gated units become ready once their gates clear, even with the path unfinished (routing.ts:154). The surplus is work the queue prescribes, not a hard condition for unit or week completion.

The weekly ratios (W1 1.46, W2 3.55, W3 0.64, W6 0.37, W8 1.12, W10–12 0.69–0.87) and the running excess (+23, +176, +149, +64, +56, +1; 931 against 950) all check out exactly. Severity stays major: this fails §8 "normal later weeks must fit ~75" and "no hidden backlog", and the §29 curriculum-math test.

### 8. [MAJOR] Exercises are not classified individually as required path, optional, repair inventory, retrieval, placement or stretch — CONFIRMED (severity keep)
- Spec: §8 Required work (classify every mapped exercise)
- Evidence: data/course/units.ts:28-29 `sections: string[]` / `optional?: string[]` (whole sections only); units.ts:10 '`optional`: sections offered when ahead, never required.', but the only runtime reader is lib/course/routing.ts:99 (the repair pool), so optional sections are never queued; units.ts:33 '/** Targets attempted only once their readiness is clean. */' vs routing.ts:225 `for (const lc of [...unit.targets, ...(unit.readinessTargets ?? [])])` with no readiness check; routing.ts:189-196 purposeOf derives purpose from stage and repType; scripts/audit-migration.ts:19-20 `type Action = 'keep' | 'move' | ... 'optional' | 'retire'` is written only to planning/reps-v2-migration.json and nothing imports it
- Detail: Every rep in a unit section is required. The only runtime distinctions are:

- unit.optional, which is effectively repair inventory and never 'offered when ahead';
- gate pools;
- the focused route's wholesale drop of lesson-level stages;
- purposeOf, which turns retrieval and cold path reps into 'gate' or Checkpoint (55 reps).

There is no retrieval, placement or stretch role. readinessTargets (9 'stretch' problems) are queued exactly like required targets. The per-exercise mapping that already exists in the migration audit is never used by routing.
- Suggested fix: Give each unit an explicit per-rep list (e.g., `path: repId[]`) or add data/course/roles.ts mapping every mapped exercise to REQUIRED, OPTIONAL, REPAIR, RETRIEVAL, PLACEMENT or STRETCH, seeded from planning/reps-v2-migration.json. unitReps should read only REQUIRED. Queue OPTIONAL when the learner is ahead, REPAIR only from gateStatus, and readinessTargets only after a readiness check.
- Verifier: I checked the cited code and the claim holds. data/course/units.ts:28-29 classifies only whole sections (`sections: string[]`, `optional?: string[]`). Nothing on an exercise records a REQUIRED/OPTIONAL/REPAIR/RETRIEVAL/PLACEMENT/STRETCH role. lib/course/routing.ts:73-74 `unitReps` returns every exercise in every unit section except gate-pool reps (`.filter((e) => !GATE_OF_EXERCISE[e.id])`). courseStatus (routing.ts:157) builds the path from those reps. On the focused route it drops lesson-level stages wholesale. courseQueue (routing.ts:218) then queues every unpassed path rep, so every rep in a section is effectively required.

The only runtime reader of `unit.optional` is routing.ts:99, where it is added to the repair candidate pool after a failed gate. A grep of lib/app/components found no other use. So the units.ts:10 comment, "offered when ahead, never required", is false: optional sections act as repair inventory only. capacity's `optional` is the queue overflow past the daily target and has nothing to do with unit.optional.

readinessTargets (I counted 9: 11, 424, 98, 230, 547, 39, 139, 62, 48) are pushed at routing.ts:225 in the same loop and under the same `open` condition as `unit.targets`. Neither gets a per-problem readiness check, which contradicts the units.ts:33 comment. purposeOf (routing.ts:189-196) derives purpose only from repType and stage; retrieval and cold reps become 'gate'.

scripts/audit-migration.ts:19 defines `Action = ... 'retrieval' | 'optional' | 'retire'` and writes it only to planning/reps-v2-migration.{json,md} (lines 124, 184). No lib/app/components/data file reads that output.

Spec §8 requires each mapped exercise to be classified and says not to inherit whole legacy sections as required, so this materially fails a V2.1 requirement. Major is correct.

One nuance: there is a coarse gate-pool distinction (gate variants are excluded from the path and act as placement/gate reps in the 'placement' state, routing.ts:212-214). That is a partial PLACEMENT role, but it is per gate, not a per-exercise classification. I did not verify the "55 reps" figure. Corrected: The claim is accurate. There is one small refinement. Gate-pool reps are excluded from the path by unitReps (routing.ts:74) and are queued as placement/gate variants (routing.ts:212-214, 220-221), so a coarse per-gate placement and gate role exists. No per-exercise required/optional/repair/retrieval/placement/stretch classification exists.

- `unit.optional` sections are used only as repair candidates (routing.ts:99) and are never offered when ahead.
- readinessTargets are queued under the same `open` condition as targets (routing.ts:224-225).
- The migration audit's per-rep Action is written only to planning/reps-v2-migration.json/.md and nothing at runtime reads it.

The "55 reps" count for purposeOf → gate was not verified.

### 9. [MAJOR] No test or audit checks that the curriculum fits the weekly targets; one test asserts the opposite — CONFIRMED (severity keep)
- Spec: §29 Curriculum math
- Evidence: lib/course/course.test.ts:11 asserts only the targets `[50, 60, 75, ...]`; course.test.ts:63 `assert.ok(path.length >= 20)` (requires a large path); scripts/audit-migration.ts:122-127 prints per-week 'Existing reps required' without comparing it to weekTarget (it showed Week 2 = 169 + 36 new); scripts/audit-curriculum.ts:8 audits only the October MODULES; lib/course/routing.test.ts uses `through()`, which passes full paths and never walks the queue
- Detail: §29 requires tests that Week 1 required work fits 50, Week 2 fits 60, each normal week fits 75 and holiday weeks fit their adjusted targets. None exist.

No test walks a learner through courseQueue to unit readiness, so the deadlock and placement bugs above are not caught either.
- Suggested fix: Add a test computing, per week, required path + gate needs + uncovered required targets <= weekTarget(n) (with a maintenance allowance). Add a simulation test, like the one used here, in which a clean learner doing exactly Today's prescription reaches every unit's 'ready' state and every week's contract on time.
- Verifier: The main claim holds. The §29 curriculum-math check (planning/REPS_2_1_SPEC.md:416, "Week 1 required work fits 50; Week 2 fits 60; each normal week fits 75; holiday weeks fit adjusted targets") is not tested anywhere.
- lib/course/course.test.ts:11 checks only the declared targets: `assert.deepEqual(WEEKS.map((w) => w.targetProblems), [50, 60, 75, ...])`. Lines 12-13 and 23 check COURSE_TARGET, dailyTarget and weekTarget(10)=45. None of these compares required unit work to the targets.
- Searching the lib/course/*.test.ts files and e2e for targetProblems, weekTarget, unitPath and capacity finds no test that sums required reps per week and compares the total to the target.
- content.test.ts:28 checks only that each gate pool has at least `need` variants.
- scripts/audit-migration.ts:126-127 builds a per-week table (existing, optional, fresh, gates, labs) and compares none of it to w.targetProblems.
- scripts/audit-curriculum.ts:8 imports `MODULES as DAYS` from '@/data/curriculum' (the legacy October modules) and runs auditDays/guardrailViolations, a code-first audit. It does not check the course weeks.
- e2e/course.spec.ts only checks the displayed '0 / 50' and '10 / 50' week counts.
- routing.test.ts:20-29 `through()` adds an attempt for every unitReps entry and every gate-pool id. Its tests call courseQueue only once per scenario (lines 37, 46, 67, 72, 79) and look at the first item or filter the result. No test walks the queue step by step until a unit is ready.

One part is overstated: "one test asserts the opposite". course.test.ts:63 `assert.ok(path.length >= 20)` sets a minimum for one unit (w3-two-pointers) and confirms the unit resolves to reps. A path of 20 or more does not contradict a 75-problem week. At most it shows the tests never set an upper bound. The deadlock and placement bugs mentioned at the end come from other findings and were not checked here. The point that no queue-walking test would catch them is correct.

Severity stays major: §29 lists this test explicitly, nothing covers it, and the audit scripts do not check fit against the weekly targets. Corrected: No test or audit checks that each week's required work fits its target (§29, REPS_2_1_SPEC.md:416). course.test.ts:11 checks only the declared targetProblems array. audit-migration.ts:126 prints per-week counts without comparing them to w.targetProblems. audit-curriculum.ts:8 audits only the legacy October MODULES. routing.test.ts's through() helper passes every unit up front, and courseQueue is called only for one-step checks, never walked to unit readiness. Correction: course.test.ts:63 `assert.ok(path.length >= 20)` is a minimum-size check for one unit (w3-two-pointers). It does not assert the opposite of fitting the week, though it confirms no upper-bound check exists.

### 10. [MINOR] Required paths include multiple-choice reps that never earn daily credit — CONFIRMED (severity keep)
- Spec: §8 (no hidden backlog), §7
- Evidence: lib/course/credit.ts:37 `const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']`; credit.ts:65 `if (!PRODUCTION.includes(exercise.kind)) return false`; routing.ts:148 `const pathDone = full.every((e) => passed.has(e.id))`
- Detail: Multiple-choice reps in required paths:

- w2-hashing: o2-list-literal, o2-set-empty, o2-drev-crash, o2-dl-empty, o2-dl-crash.
- w8-queue-bfs: o7-dq-why-not-pop0.
- w14-interview: o11-cx-pop-front, o11-speed-slicing, o11-cx-grid-bfs, o11-cx-subsets, o11-cx-memo, o11-cx-tree-space, o11-cx-heap-k.

w14-interview is ungated, so it cannot be ready until all 7 of its choice reps are passed. That work is invisible to the 75-problem count.
- Suggested fix: Move recognition-only reps out of required paths, into lessons or optional material, or count them in the contract.
- Verifier: I checked the claim against the code and ran courseStatus against the real data with a throwaway script (scripts/_audit_choice.ts, deleted after the run). The script imported SECTION_BY_ID from @/data/course and EXERCISE_BY_ID from @/data/curriculum, used empty attempts and today = 2026-10-23.

The basic facts are right:
- lib/course/credit.ts:37 has `const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']`.
- credit.ts:65 has `if (!PRODUCTION.includes(exercise.kind)) return false`. So a 'choice' rep never earns daily credit.
- The only units whose required path (routing.ts unitReps, which excludes gate pool items) contains choice reps are exactly the ones the claim lists:
  - w2-hashing: 5 recognize-stage choice reps, 125-rep path, 1 live gate.
  - w8-queue-bfs: o7-dq-why-not-pop0, 17-rep path, 1 live gate.
  - w14-interview: 7 retrieval-stage choice reps (o11-cx-*, o11-speed-slicing), 55-rep path, 0 live gates.

The claim overstates the impact:
1. In routing.ts:155, `const ready = liveGates.length ? gatesCleared : pathDone`. w2-hashing and w8-queue-bfs have live gates, so pathDone at routing.ts:148 does not decide their readiness, and their choice reps block nothing.
2. Week completion does not depend on unit paths at all. weekProgress in lib/course/week-status.ts:59-94 uses credits, labs and gates only. So these choice reps never hold back week completion, which is §8's acceptance criterion ("mark the week complete").
3. The real effect is limited to w14-interview. It is ungated, so it reaches 'ready' only when all 55 path reps are passed, the 7 credit-less choice reps included. Its non-ready state then feeds readiness.ts:48-52 (domain status) and :145 (frontier).
4. The 7 choice reps are a small share of a 55-rep path, so the bigger §8 workload problem lies elsewhere. Corrected: The choice-kind reps in required paths are exactly as listed: 5 in w2-hashing, 1 in w8-queue-bfs and 7 in w14-interview (ids confirmed with courseStatus on the real data). None of them can earn daily credit (credit.ts:37, :65). They only matter for w14-interview, which has no live gate. There `ready = pathDone` (routing.ts:148, :155), so the unit cannot become ready, and its readiness domain or frontier cannot clear (readiness.ts:48-52, :145), until all 7 uncredited choice reps are passed. w2-hashing and w8-queue-bfs are gated (`ready = gatesCleared`), so their choice reps block nothing. Week completion (week-status.ts weekProgress) uses only credits, labs and gates, so no choice rep holds back a week. The result is a small amount of uncounted work that can hold back w14-interview readiness. It does not create a backlog that blocks week completion. Minor severity is correct.

### 11. [MINOR] WEEKS.requiredLabs includes optional labs — CONFIRMED (severity keep)
- Spec: §7 (required labs)
- Evidence: data/course/weeks.ts:58 `requiredLabs: units.flatMap((u) => u.labIds),`, so Week 9 includes lab-priority-queue, which data/course/content/labs-w9w13.ts:52 marks `optional: true,`
- Detail: Nothing in the UI reads it today: components/use-course-day.ts:29 filters `!l.lab.optional` on its own. A future week contract built on WEEKS.requiredLabs would wrongly require an optional build in the holiday week.
- Suggested fix: `requiredLabs: units.flatMap((u) => u.labIds).filter((id) => !LAB_BY_ID[id]?.optional)`
- Verifier: The claim checks out and minor is the right severity. At data/course/weeks.ts:58, `requiredLabs: units.flatMap((u) => u.labIds)` takes every lab ID from a week's units and never looks at the lab's `optional` flag. data/course/units.ts:457 gives unit w9-heaps `labIds: ['lab-priority-queue']`, and data/course/content/labs-w9w13.ts:52 marks that lab `optional: true`. So WEEKS[8].requiredLabs lists an optional lab. It is the only lab marked optional anywhere in the course content, so Week 9 is the only week affected. Week 9 is also the holiday week: COURSE_START is 2026-10-26, so Week 9 runs from 2026-12-21 to 2026-12-27 and contains Christmas (12-25) and Boxing Day (12-26). Nothing uses the field: a grep of app/, components/, lib/, data/, tests/ and scripts/ finds `requiredLabs` only where it is declared (weeks.ts:19) and where it is assigned (weeks.ts:58). Week progress counts labs separately: components/use-course-day.ts:29 runs `labs.filter((l) => !l.lab.optional)` and passes the result to weekProgress as labsDone/labsRequired. Users therefore see nothing wrong today. The field just contradicts spec §7 (lines 170 and 196: week completion requires the required labs, and optional work must not silently block week completion), and that matters only if code starts reading it later. Corrected: Accurate as stated. data/course/weeks.ts:58 builds requiredLabs from unit.labIds without filtering `optional`, so WEEK_BY_NUMBER[9].requiredLabs contains 'lab-priority-queue', which labs-w9w13.ts:52 marks optional. That is the only optional lab in the course. No code outside weeks.ts reads `requiredLabs` (only weeks.ts:19 and :58 mention it). The live week and day completion path at components/use-course-day.ts:29 filters `!l.lab.optional` itself, so users see no wrong behaviour today. The field contradicts spec §7 (lines 170 and 196) and is a trap for future code. Fix it at the definition, for example by filtering through LAB_BY_ID to drop optional labs, or remove the unused field.

## learning-surfaces

The learning system in this repo is all prose and static code. I found no interactive demonstration, stepping, visualisation or diagram anywhere in it. There are 42 teaching pages (11 Week 1–2 lessons, 24 concept guides and 7 worked examples), with about 69k characters of prose (61%) and 44k characters of static code or printed output (39%). Nothing on them is visual state or an interactive demonstration. Interactivity stops at progressive reveal: the worked example's 'Next: goal N' button, the concept page's 'More examples' details block and the collapsible Learn panel. The only runnable editor ('Try it') is a non-exported component inside the rep Basics panel.

All 11 concepts in spec §14 have a concept-guide page, built from primer text, code and YouTube links. None of them has a Lesson object, a worked example or a demo. All 20 units in Weeks 3–12 have `workedExampleIds: []`. The 7 existing worked examples (Weeks 1–2) are correct but miss two of the six required phases: MANUAL REASONING and VISUAL DEMO. They also show the solution as one block with no link back to the subgoals.

The Markdown renderer supports neither tables nor ordered lists. As a result:
- the course's only state-tracing visual (the Week 1 variable table) renders as a line of pipes;
- the Week 2 Solve Map's nine steps run together as one paragraph;
- all 46 lab build/change specs run together the same way.

The pieces needed to build a demo engine exist but need extending:
- `highlightPython` uses lezer and can be split into lines, but `CodeView` has no line highlighting or line numbers.
- Motion tokens, keyframes and a global reduced-motion CSS switch exist, but there is no reduced-motion hook in JavaScript.
- The Pyodide runner exists.
- `node:test` runs only `*.test.ts` files under `lib/` and `supabase/`.
- Design tokens such as `--learn` and `--cold` are available.

I verified two things directly. All 42 lesson programs print exactly their declared output under python3. Every worked-example solution passes the examples stated in its problem. No script or test enforces either check.

The 'data' field contains the full inventory and a concrete demo architecture that fits this codebase.

**Already correct:**
- Lesson code is truthful: all 42 lesson code blocks in `data/course/content/week1.ts` and `week2.ts` print exactly their declared `output` under python3 3.14 (I ran every one).
- Worked-example solutions are correct. The 4 examples that state `f(args)` → value examples pass all 8 calls, and each reconstruction rep (stage 'reconstruct', from blank) exists and sits inside its unit's required path (enforced by `lib/course/content.test.ts:52-53`).
- The Week 1–2 worked examples already follow the V2 subgoal pattern (`worked-example.tsx`): problem, then one goal at a time with fragment code, then the whole solution, then a 'Rebuild it' handoff to a blank-editor rep. Keep this and extend it; do not rebuild it.
- Static Python highlighting exists, is cheap and is already in client bundles: `components/code-view.tsx` `highlightPython` via @lezer/highlight classHighlighter. Its putBreak callback (line 15) makes a line-aware CodeTrace a small change.
- The Markdown-lite renderer (`components/markdown.tsx`) is safe (no HTML) and handles paragraphs, bullets, fenced code via CodeView, inline code, bold and italic. It only needs ordered lists and tables.
- Concept guides exist for every §14 concept plus stacks, grids, tries, matrix and running-state (24 total). They are composed from primers, the single source of truth, and primer examples and recipes are verified against Python by `verifyPrimers` in `scripts/verify-content.ts`.
- The Learn-layer behaviour rules are right and demos should reuse them (`data/concepts.ts:293-312` guideMode / GUIDE_BEHAVIOUR): open on first exposure, collapsed on drills, counts as help on prove, absent in interview.
- Motion infrastructure is in place in `app/globals.css`: easing and duration tokens, rise-in, pop-in, draw and celebrate-in keyframes, and a global `prefers-reduced-motion` kill switch (lines 933-948).
- Learning-semantic colour tokens are already wired into Tailwind v4 through `@theme inline`: `--learn`, `--learn-soft`, `--cold`, `--repair`, `--pass`, `--fail`, the surfaces and the lines.
- A browser Python runtime (`lib/python/runner.ts`, Pyodide in a Worker with a timeout) and a 'Try it' editable runner pattern (`components/rep/basics-panel.tsx:256`) already exist and can be reused for editable input.
- The test infrastructure suits deterministic step generators: `node:test` through `tsx --test` (`scripts/run-tests.mjs`) over `lib/**/*.test.ts`, plus python3 and Pyodide content verifiers that can host a demo/code parity check.
- Lab view already uses a clear numbered, stateful phase structure (requirements → design → build → change → review, `components/course/lab-view.tsx:26-34`). This pattern can be reused for the six worked-example phases.
- The Week 13 no-leak rule is honoured on Today: lesson and concept suggestions are hidden in unlabeled weeks (`course-today.tsx:100-101` and 327). Demos must follow the same rule.

**Data:**

```
1) HOW MUCH OF THE LEARNING EXPERIENCE IS PROSE + STATIC CODE (computed with tsx over LESSONS, WORKED_EXAMPLES and CONCEPTS, counting what each component renders)
- 42 teaching pages: 11 lessons (/learn/l-*), 24 concept guides (/learn/<concept>), 7 worked examples (/example/we-*).
- Prose: 68,958 chars (60.8%). Static code and 'Prints' output: 44,384 chars (39.2%). Interactive or visual demonstration: 0 chars, 0 elements (0%).
- About 549 prose blocks and 383 code blocks. No SVG, image, diagram or step control on any learning page. `<svg>` appears only in brand-mark, concept-icons, training-flame, icons, motif, progress-ring and the rep-workspace check/python glyphs.
- Lessons plus worked examples: 35,632 prose / 11,701 code. Concept guides: 33,326 prose / 32,683 code (this includes the collapsed 'More examples').
- Interactivity is limited to:
  - the worked-example 'Next: goal N' reveal (forward only, no back or reset);
  - the concept 'More examples' `<details>` block;
  - the collapsible Learn panel inside reps (`GUIDE_BEHAVIOUR`);
  - the 'Try it' runnable editor, which exists only inside the rep Basics panel (`components/rep/basics-panel.tsx:256`, not exported).
- The only moving picture is off-site: 47 YouTube concept videos.
- `components/demo/*` and `app/demo` are the public marketing page, not algorithm demos. Avoid that namespace.
- Closest thing to prediction today: 49 of the 520 required-path reps in Week 3–12 units are kind 'output' trace reps (type what the code prints). These are static.

2) REUSABLE BUILDING BLOCKS THAT EXIST
- `components/code-view.tsx`:
  - `highlightPython()` does static Python highlighting (@lezer/highlight classHighlighter + @lezer/python).
  - It emits a newline Fragment from the putBreak callback (line 15), so it is trivially splittable into lines.
  - `CodeView` takes only `{code, className, label}`: no line numbers, no active line.
  - Token colours are hex in `globals.css:555-563`.
- `components/markdown.tsx`: paragraphs, `-`/`*` bullets, fenced code (via CodeView), inline code, bold, italic. No ordered lists, tables, headings or links. Single newlines inside a paragraph collapse to spaces.
- Motion: `globals.css` has `--ease-out`, `--dur-fast/--dur/--dur-slow` (120/180/220ms) and keyframes rise-in, fade-in, pop-in, draw (SVG stroke, `.draw`), celebrate-in (500ms), spark-burst and ring-sweep. A global `@media (prefers-reduced-motion: reduce)` rule zeroes all durations (lines 933-948). The only JavaScript reduced-motion checks are ad-hoc `matchMedia` calls in `winston-ambient.tsx:45` and `winston-perch.tsx:21`. The app is light-only (`globals.css:148` color-scheme: light).
- Colour tokens: `--learn/--learn-soft`, `--accent/--accent-soft`, `--cold/--cold-soft`, `--repair/--repair-soft`, `--pass/--pass-soft`, `--fail/--fail-soft`, `--surface/-2/-3`, `--line/--line-strong`, `--faint`, `--muted`, all exposed to Tailwind v4 through `@theme inline`.
- Step header: `lab-view.tsx:26-34` has a local numbered step header with a done state. It could be extracted for worked-example phases.
- Python runner: `lib/python/runner.ts` `getRunner().run(code, tests)` (Pyodide worker with a 5s timeout). `CodeEditor` is CodeMirror, loaded with dynamic ssr:false.
- Content checks: `lib/content-check.ts` `runPythonBatch`, `outputMatches` and `verifyPromptExamples` are reused by `scripts/verify-content.ts`.
- Tests: `scripts/run-tests.mjs:15` runs `tsx --test` only on `*.test.ts` under `lib/` and `supabase/`.
- Lint: eslint-plugin-react-hooks 7.1.1 (React Compiler rules). `program-progress.tsx:43` already needed an eslint-disable for set-state-in-effect.

3) COVERAGE OF THE SPEC §14 CONCEPTS (Lesson object / concept page / unit and week / worked example / demo)
| Concept | Lesson object | Concept page (prose/code chars) | Unit(s) | Worked example | Demo |
|---|---|---|---|---|---|
| Two pointers | none | /learn/two-pointers (1656/1223) | W3 w3-two-pointers | none | none |
| Sliding window | none | /learn/sliding-window (1520/1109) | W4 w4-windows | none | none |
| Binary search | none | /learn/binary-search (1775/919) | W5 w5-binary-search | none | none |
| Linked lists | none | /learn/linked-lists (1398/1531) | W5 w5-linked-lists; W6 w6-fast-slow reuses the same page | none | none |
| Recursion | none | /learn/recursion (1295/398) | W6 w6-recursion | none | none |
| Trees | none | /learn/trees (1594/4055) | W7 w7-trees, w7-bst | none | none |
| BFS | none | /learn/bfs (1178/875) | W8 w8-queue-bfs | none | none |
| Graphs | none | /learn/graphs (1736/2760), /learn/grids | W8 w8-graphs, w8-grids; W9 w9-cycles | none | none |
| Heaps | none | /learn/heaps (1296/935) | W9 w9-heaps | none | none |
| Intervals | none | /learn/intervals (1466/1853) | W10 w10-intervals | none | none |
| Backtracking | none | /learn/backtracking (1422/1706) | W11 w11-backtracking | none | none |
| DP | none | /learn/dynamic-programming (1777/2714) | W11 w11-dp; W12 w12-dp-greedy | none | none |

- Lessons and worked examples exist only for Weeks 1–2: 11 lessons and 7 worked examples (we-countdown, we-first-negative, we-best-so-far, we-shared-list, we-contract, we-manual, we-improve).
- Spec §31 acceptance (two pointers, sliding window, linked lists, recursion, BFS, graphs, DP) fails for all 7: each page is prose plus code, and none shows state changing over time.

4) UNITS WITH NO WORKED EXAMPLE (line of `workedExampleIds: []` in `data/course/units.ts`)
- Weeks 3–12, all 20 units:
  - w3-two-pointers :218
  - w3-running-prefix :234
  - w4-windows :252
  - w4-stacks :269
  - w5-binary-search :286
  - w5-linked-lists :302
  - w6-fast-slow :319
  - w6-recursion :335
  - w7-trees :353
  - w7-bst :368
  - w8-queue-bfs :387
  - w8-grids :403
  - w8-graphs :418
  - w9-cycles :437
  - w9-heaps :453
  - w10-intervals :471
  - w11-backtracking :489
  - w11-dp :506
  - w12-dp-greedy :524
  - w12-matrix-tries :541
- Weeks 1–2: w1-integration :108, w2-testing :155, w2-solve-map :185, w2-hashing :200. Weeks 13–14 have none by design.

5) TRUTH CHECKS I RAN (read-only; scripts in the scratchpad)
- All 42 lesson code blocks run under python3 3.14: 42/42 print exactly the declared output.
- Worked-example solutions against the examples in their problem text: 4 examples have examples (8 calls), all pass. we-contract, we-manual and we-improve state none.
- Every rebuild rep is in its unit path: we-countdown → c1-while-rebuild-countdown at path index 9 of 18; the others sit at indices 2–7.
- Subgoal fragments mapped to solution lines:
  - we-countdown: g1 2–3, g2 4, g3 5, g4 6–7.
  - we-first-negative, we-best-so-far, we-shared-list: map fully.
  - Asides that are not in the solution: we-contract g1/g2, we-manual g1, we-improve g1/g4.
  - Naive text matching maps we-manual g4 to line 11, but the correct line is 14.
- Markdown rendered with `renderToStaticMarkup`:
  - the l-state table becomes `<p>| pass | price | total | |---|---|---| ...</p>`;
  - the Solve Map becomes `<p>1. <strong>Contract</strong>: ... 9. <strong>Verify</strong>: ...</p>`;
  - 48 course rep prompts (46 lab parts plus c2-solve-plan and c2-solve-restock) contain numbered lists that collapse the same way.

6) PROPOSED REUSABLE DEMO ARCHITECTURE (React 19 client components, Tailwind v4 tokens, no new dependencies; zod is already present)

Files:
- `lib/demos/types.ts`: types only, no React.
- `lib/demos/anchors.ts`: resolves `#@name` line anchors in demo code and strips them for display.
- `lib/demos/player.ts`: pure player reducer.
- `lib/demos/layout.ts`: deterministic tree and graph layout.
- `lib/demos/registry.ts`
- `lib/demos/{two-pointers,sliding-window,binary-search,linked-list,recursion,tree,bfs,graph,backtracking,dp,heap,intervals,trace-table}.ts`, each with a sibling `*.test.ts`. These must live in `lib/` because `run-tests.mjs` only scans `lib/` and `supabase/`.
- `components/visual/demo-player.tsx` ('use client'): DemoControl plus AnimationTimeline.
- `components/visual/code-trace.tsx`: CodeHighlight.
- `components/visual/state-panel.tsx`
- `components/visual/prediction-prompt.tsx`
- `components/visual/use-reduced-motion.ts`
- `components/visual/views/{array,refs,stack,tree,graph,table,timeline}.tsx`: DataStructureView.

Data model (`lib/demos/types.ts`, JSON-serialisable only):
```ts
type DemoValue = number | string | boolean | null | DemoValue[] | { [k: string]: DemoValue }
type Tone = 'active' | 'left' | 'right' | 'window' | 'eliminated' | 'found' | 'invalid' | 'memo' | 'visited' | 'frontier' | 'undo'
type DemoView =
  | { kind: 'array'; values: DemoValue[]; pointers: { name: string; index: number; tone: Tone }[]; regions: { from: number; to: number; tone: Tone; label?: string }[]; compare?: [number, number] }
  | { kind: 'refs'; objects: { id: string; label: string; next?: string | null }[]; names: { name: string; target: string | null }[]; changed?: string[] } // linked lists and the Week 1 references lesson
  | { kind: 'stack'; frames: { id: string; call: string; locals: Record<string, DemoValue>; status: 'running' | 'waiting' | 'base' | 'returning'; returns?: DemoValue }[]; direction: 'down' | 'up' }
  | { kind: 'tree'; nodes: { id: string; label: string; x: number; depth: number; parent?: string; tone?: Tone; note?: string }[]; queue?: string[]; level?: number; path?: string[] } // binary tree, BFS, heap, backtracking decision tree, DP recursion tree
  | { kind: 'graph'; nodes: { id: string; label: string; x: number; y: number; tone?: Tone }[]; edges: { from: string; to: string; tone?: Tone }[]; directed: boolean; adjacency?: Record<string, string[]>; frontier: string[]; visited: string[] }
  | { kind: 'table'; columns: string[]; rows: { label: string; cells: (DemoValue | null)[] }[]; active?: [number, number]; reads?: [number, number][] } // Week 1–2 trace tables, DP tables, grids
  | { kind: 'timeline'; intervals: { start: number; end: number; label: string; tone: Tone }[]; merged: [number, number][]; cursor?: number }
  | { kind: 'split'; parts: DemoView[] } // DP tree + memo table, heap tree + backing array
interface Prediction { question: string; options: string[]; answer: number; reveal: string }
interface DemoStep {
  lines: number[]                   // CODE: 1-based display lines
  phase: string                     // e.g. ENTER | INVALID | SHRINK | VALID | MEASURE
  title: string                     // CURRENT STEP
  why: string                       // WHY THIS STEP HAPPENS
  vars: Record<string, DemoValue>   // STATE VARIABLES
  view: DemoView                    // VISUAL STATE
  invariant?: string
  predict?: Prediction
  result?: DemoValue
}
interface DemoSpec<I> {
  id: string
  title: string
  concept: string                   // a data/concepts.ts id
  code: string                      // real Python, with #@anchors
  phases: readonly string[]
  presets: { label: string; input: I }[]
  parse(text: string): { ok: true; input: I } | { ok: false; error: string }
  format(input: I): string
  pythonCall(input: I): string
  limits: { maxItems: number; maxSteps: number }
  generate(input: I): DemoStep[]
}
type DemoRef = { id: string; preset?: number; input?: string; caption?: string }
```

Player (`lib/demos/player.ts`, a pure reducer tested with `node:test`):
- State: `{ index, playing, speed: 0.5 | 1 | 2, awaiting: number | null, answers: Record<number, number> }`.
- Actions: next, prev, reset, seek, play, pause, tick, speed, answer.
- Rules:
  - next/tick stop before a step that has `predict` until it is answered;
  - tick on the last step stops playback;
  - reset returns to step 0 and clears answers;
  - seek clamps to the valid range.
- `DemoPlayer` takes serialisable props `{ demoId, preset?, input?, compact? }` and imports the registry on the client. Next 16 serialises props across the server/client boundary, so functions cannot cross (`node_modules/next/dist/docs/01-app/02-guides/server-and-client-boundary.md:160`). Server components such as LessonBody can still render it.
- Autoplay uses `setTimeout` in an effect, with setState inside the callback. This satisfies react-hooks v7 without eslint-disable.
- Cadence: 1600/900/450 ms per step at 0.5×/1×/2×.
- Keyboard handlers sit on the player root, not on window (rep-workspace binds window keydown at line 561): ←/→ step, Space play/pause, R reset.

Regions (spec §13):
- VISUAL STATE: the view, a phase chip and an invariant banner. It has role=img with an aria-label from a pure `describe(view)`.
- CODE: CodeTrace. STATE VARIABLES: StatePanel, which diffs against the previous step and marks changed values. Side by side on desktop, stacked on mobile.
- CURRENT STEP and WHY THIS STEP HAPPENS, in an aria-live=polite region.
- PredictionPrompt, shown when the player is awaiting an answer.
- Controls: Reset · Prev · Play/Pause · Next · speed · timeline. The timeline is a range input with phase-coloured ticks and 'Step 7 / 23'.
- 'Try another input': preset chips plus a parsed text field with an inline error. A deterministic 'shuffle' uses a seeded PRNG with a counter, never `Math.random` in render.
- Inputs stay at 12 items or fewer, so there is no horizontal scroll at phone width with 16px gutters.

CodeTrace:
- Export `highlightPythonLines(code): ReactNode[][]` from `code-view.tsx` by splitting at the putBreak callback.
- Render an `<ol>` of lines with `data-active`. The active line gets a `var(--learn-soft)` background with a 2px inset `var(--learn)` and faint line numbers.
- Keep `CodeView` unchanged for current callers.

Views and phases for each §14 concept:
- **two-pointers/pair-sum** (array): COMPARE → MOVE LEFT | MOVE RIGHT → FOUND. Discarded region is hatched. Example 'why': "nums[L]+nums[R] < target and nums[R] is the largest left, so nums[L] fits no pair". Prediction: 'Which pointer moves next?'
- **sliding-window/longest-unique** (array, counts in vars): ENTER → INVALID → SHRINK → VALID → MEASURE. Incoming and outgoing values are tagged.
- **binary-search/find and lower-bound** (array): lo/mid/hi with active vs eliminated regions. The banner reads 'If the answer exists, it is still inside this region.'
- **linked-list/reverse** (refs): SAVE → REWIRE → ADVANCE with prev/current/next tags. The same view serves l-mutation-references ('Two names, one list').
- **recursion/call-stack** (stack): CALL (DOWN) → BASE → RETURN (UP), showing waiting callers and return values.
- **tree/height and tree/bfs-levels** (tree): left call, right call, returned values, COMBINE. For BFS: a queue strip, the current level, and children being enqueued.
- **graph/model-then-traverse** (graph): items → nodes, relationships → edges → adjacency list, then VISIT, NEIGHBORS, ENQUEUE/PUSH with frontier and visited.
- **backtracking/subsets** (tree as a decision tree): CHOOSE → EXPLORE → UNDO → TRY NEXT, with the path in vars.
- **dp/climb-stairs** (split view: tree plus table): RECURSE → DUPLICATE STATES → MEMO → LOOKUP → TABLE FILL. A persistent STATE/BASE/RECURRENCE/ORDER legend. Prediction: 'What should dp[4] become?'
- **heap/top-k** (split view: tree plus backing array): PUSH → BUBBLE UP → POP → SIFT DOWN, with the banner 'the heap holds the best k so far'.
- **intervals/merge** (timeline): SORT → COMPARE → MERGE (expand end) | START NEW.
- **trace-table** (table): for l-state, l-while and l-manual. It replaces the broken Markdown table and the printed trace.

Seven views cover all 11 concepts plus Weeks 1–2.

Motion and tokens:
- Pointer moves use `transform 200ms var(--ease-out)` (§21 micro range).
- Region and state changes take 300–400ms. Add `--dur-state: 360ms`.
- Changed values flash for 200ms. No infinite animation.
- Under reduced motion: autoplay is off by default, steps swap with no transitions, and the global CSS rule already zeroes durations. Detect it with `useReducedMotion` built on `useSyncExternalStore` over `matchMedia`, with a server snapshot of false.
- Colours:
  - `--accent`: current pointer;
  - `--cold`: second pointer;
  - `--learn-soft`: window and active line;
  - `--surface-2` with `--faint` hatch: eliminated;
  - `--pass/--pass-soft`: found or valid;
  - `--fail-soft`: invalid;
  - `--repair-soft`: undo.

Determinism and tests (spec §29):
- Generators are pure: no `Math.random`, no `Date`, no globals. Their output is JSON-serialisable, so server and client produce identical first frames with no hydration mismatch.
- Generator tests in `lib/demos/*.test.ts`:
  - `deepEqual(gen(x), gen(clone(x)))`;
  - a JSON round-trip leaves the steps equal;
  - a deep-frozen input is not mutated;
  - the final result equals a brute-force reference on inputs from a seeded mulberry32 PRNG (seed inside the test).
- Invariant tests:
  - BS: the target index stays within [lo, hi] at every step;
  - two pointers: eliminated indices never belong to a valid pair;
  - window: valid at every VALID and MEASURE step;
  - reversal: no node becomes unreachable from prev or current;
  - stack: depth returns to 0;
  - DP: every LOOKUP reads a filled entry;
  - heap: the heap property holds after each operation;
  - merged intervals: sorted and disjoint.
- Bound tests:
  - steps ≤ `maxSteps` for every preset and at `maxItems`;
  - every entry in `lines` falls within the code;
  - phases ⊆ `spec.phases`;
  - `parse` rejects unsorted input (for BS and two pointers), too many items and non-numbers;
  - `format(parse(x))` round-trips.
- Player reducer tests:
  - reset gives the initial state;
  - prev/next respect the bounds;
  - tick stops at the end;
  - the prediction gate holds;
  - seek clamps;
  - the reduced-motion initial state is not playing.
- Python parity: add `verifyDemos` to `lib/content-check.ts`. It runs each spec's stripped code plus `pythonCall` on its presets through `runPythonBatch` and compares against the generator's final result. Call it from `verify-content.ts`, plus verify-pyodide for browser parity.
- Playwright:
  - /learn/two-pointers: Next ×3 → data-step=3, then Reset → 0;
  - a custom input;
  - `emulateMedia({ reducedMotion: 'reduce' })` → no auto-advance.

Integration and guardrails:
- `Lesson.sections[].demo?: DemoRef`.
- `ConceptSpec.demos?: DemoRef[]`, rendered first in ConceptBody as 'Watch it move'. This gives all 17 Week 3–12 concept pages a demo without new Lesson objects.
- WorkedExample gains `manual`, `demo` and `subgoals[].lines` / `aside`.
- `LearningUnit.demoIds`, used by the Today 'Watch it move' step (§5 #2) and the road-map unit detail.
- `Exercise.demo?: DemoRef` on trace reps, offered as 'Watch it run' only after the answer.
- Demos are never shown on gates, transfer reps, interview mode or Week 13 before an attempt, because demo titles name the technique.
- Opening a demo from a prove-mode rep counts as help, the same as the `GUIDE_BEHAVIOUR` rule at `data/concepts.ts:308-312`.
- Watching or predicting never earns reps, flame or readiness evidence (principle 11).

Rollout:
- **C1:** types, reducer, CodeTrace, StatePanel, ArrayView, PredictionPrompt and the reduced-motion hook, plus two-pointers, binary-search, sliding-window and trace-table.
- **C2:** refs, stack, tree, graph, table/split and timeline views.
- **D:** ten worked examples in this shape: PROBLEM → MANUAL (TraceTable) → SUBGOALS → DEMO → CODE (assembling CodeTrace) → RECONSTRUCTION.
  - w3-two-pointers, w4-windows, w5-binary-search, w5-linked-lists (rewiring), w6-recursion, w7-trees, w8-queue-bfs, w8-graphs, w11-backtracking, w11-dp;
  - then w9-heaps and w10-intervals.
  - Each gets a new from-blank reconstruction rep inserted into the unit path ahead of the drills. It must never be the unit's LeetCode target.

7) OBSERVATIONS FOR OTHER DIMENSIONS
- w3-running-prefix's required path opens with the LC 121 capstone (cap-best-time-stock, d3-stock section) before any new teaching or worked example. It relies on W1 running-state.
- Today's 'Learn first' strip, the only place a worked example is linked from Today, disappears after the unit's first rep (`course-today.tsx:101`, `done === 0`).
```

### 1. [MAJOR] No interactive demonstration engine exists; every learning surface is prose plus static code — CONFIRMED (severity keep)
- Spec: §12, §13, §14, §15, §29 (interactive demos), §31
- Evidence: `components/course/lesson-body.tsx:22-34`: `{lesson.sections.map((s, i) => (... <Markdown text={s.body} .../> {s.code && <CodeView code={s.code} className="mt-3" />} ... <pre className="code-view mt-1">{s.output}</pre>`. `components/concept-guide.tsx:16-97`: ConceptBody is Markdown, a mental-model <p>, 'Core moves' `<code className="mono ...">{x.code}</code>`, an <ol> shape, a mistakes <ul>, external video links and `<details>` 'More examples' with `<CodeView code={p.example.code} />`. `components/course/worked-example.tsx:25-37`: subgoal Markdown plus `<CodeView code={g.code} />`, then `<CodeView code={example.solution} />`. `components/code-view.tsx:20`: `export default function CodeView({ code, className = '', label })`, with no active-line or line-number support. `data/course/types.ts:16`: `sections: { heading: string; body: string; code?: string; output?: string }[]`, no demo or visual slot. `data/concepts.ts:18-28` (ConceptSpec) and `221-239` (Concept) have no demo slot. `data/course/units.ts:17-36`: LearningUnit has no demoIds. `grep -rl '<svg'` finds only brand-mark, concept-icons, training-flame, icons, motif, progress-ring and rep-workspace glyphs. `components/demo/*` is the public /demo marketing page.
- Detail: I counted every teaching page (11 lessons, 24 concept guides, 7 worked examples) as rendered. They hold 68,958 characters of prose (61%) and 44,384 of static code or output (39%). They contain zero visual-state elements, zero step controls and zero diagrams. Interactivity is only progressive disclosure. For all 11 concepts in spec §14, the only teaching surface is a concept guide of primer text, code and YouTube links. No page shows what changes, what state is remembered, what the code does next, or the rule behind the next step. §31 therefore fails for two pointers, sliding window, linked lists, recursion, BFS, graphs and DP. The §29 demo tests (deterministic stepping, reset, custom input, reduced motion) have nothing to test. Today cannot show a §5 'WATCH IT MOVE' step because no unit can reference a demo.
- Suggested fix: Build the shared engine set out in data §6.
- Pure, deterministic generators `DemoSpec<I>.generate(input) → DemoStep[]` and a pure player reducer, both in `lib/demos/*` so `scripts/run-tests.mjs` picks up their tests.
- Client UI in `components/visual/*`, avoiding the existing `components/demo` namespace:
  - DemoPlayer, which takes serialisable `{demoId, preset, input}` props so server components like LessonBody can embed it;
  - CodeTrace, built from a new `highlightPythonLines` split at code-view.tsx:15;
  - StatePanel, which diffs against the previous step;
  - PredictionPrompt;
  - `useReducedMotion` (useSyncExternalStore over matchMedia);
  - 7 views (array, refs, stack, tree, graph, table, timeline plus split) covering all 11 concepts and the Week 1–2 trace tables.
- Add `demo?: DemoRef` to Lesson sections, ConceptSpec (render it first as 'Watch it move'), WorkedExample, `LearningUnit.demoIds` (Today and road map) and Exercise (trace reps, after the answer only).
- Hide demos on gates, transfer reps, interview mode and Week 13 before an attempt. Opening one from a prove-mode rep counts as help. Watching never earns reps or evidence.
- Ship in order: ArrayView with two-pointers, binary-search, sliding-window and trace-table first, then the remaining views.
- Verifier: I checked the cited code and the claim holds. components/course/lesson-body.tsx:22-34 renders each section as Markdown, then an optional `<CodeView code={s.code} />`, then an optional `<pre className="code-view mt-1">{s.output}</pre>`. components/code-view.tsx:20-26 is read-only Lezer highlighting (`/** Read-only Python with static highlighting. No editor, no runtime cost. */`). It has no active-line, step or state support. data/course/types.ts:16 is `sections: { heading: string; body: string; code?: string; output?: string }[]`, with no demo slot.

A grep for demoId, DemoSpec, stepper, frames or visual across components/, app/, data/ and lib/ finds no demo engine. The only hits are CSS and one exercise data file. components/demo/ holds only demo-practice.tsx and demo-view.tsx, which belong to the public /demo page, not a teaching-demo system.

The nearest thing is data/walkthroughs.ts, but it is only a list of external YouTube links (NeetCode and others) that rep-workspace.tsx:331 and :1050 show as "Watch the walkthrough". Those are external videos, not in-app interactive demos. None of the §13 controls exist (play, pause, next, previous, reset, speed, try another input), and none of the visual regions (VISUAL STATE, CURRENT STEP, STATE VARIABLES, WHY THIS STEP). The §14 visuals (pointers, windows, node arrows, call stack, frontier, decision tree, DP tree to table, heap, interval timeline) are also missing. So the §31 learning acceptance test ("If the page is mostly prose + code, it has failed") fails as claimed.

I did not re-verify the exact character counts (68,958 / 44,384) or the page counts. They do not change the conclusion.

Severity stays major. §12 calls this "the most important instructional-quality upgrade", and §31 fails outright. It is not critical, because none of the §2 non-negotiable principles requires visual demos and the product does not misstate progress. Corrected: The claim is accurate, with three small additions.
(a) Some active and predictive learning already exists, but only as practice reps, not as teaching demos. There are `stage: 'trace'` / `kind: 'output'` reps (lib/types.ts:13, lib/schedule.ts:26 `const RECOGNITION: Stage[] = ['recognize', 'trace']`), and the rep workspace lets learners write and run their own code. A §15 "predict the next step" prompt could reuse that prediction pattern, but nothing steps through visual state.
(b) The only "watch it" content is external YouTube links in data/walkthroughs.ts:22-36 (`WALKTHROUGHS`), surfaced at components/rep/rep-workspace.tsx:331 and :1050 ("Watch the walkthrough"). These are not in-app demos. They also cover only capstones, and none of them shows backtracking, heaps or the DP tree-to-table progression.
(c) I did not re-verify the exact character and page counts.
Severity stays major (§12, §13, §14, §15, §29 demo tests, §31): the demo engine, its data slots (Lesson.sections, ConceptSpec, LearningUnit) and every §14 visualisation are absent.

### 2. [MAJOR] Weeks 3–12 have zero worked examples (20 of 20 units), and Today's copy promises one — CONFIRMED (severity keep)
- Spec: §16 (also §4 Q7, §5 REBUILD step, master-spec §9 learning sequence)
- Evidence: `data/course/units.ts`: `workedExampleIds: [],` at :218 w3-two-pointers, :234 w3-running-prefix, :252 w4-windows, :269 w4-stacks, :286 w5-binary-search, :302 w5-linked-lists, :319 w6-fast-slow, :335 w6-recursion, :353 w7-trees, :368 w7-bst, :387 w8-queue-bfs, :403 w8-grids, :418 w8-graphs, :437 w9-cycles, :453 w9-heaps, :471 w10-intervals, :489 w11-backtracking, :506 w11-dp, :524 w12-dp-greedy, :541 w12-matrix-tries. `data/course/lessons.ts:8`: `/** Course lessons (Weeks 1–2 foundations). Later weeks teach through the concept guides (data/concepts.ts). */`. `lessons.ts:12`: `export const WORKED_EXAMPLES: WorkedExample[] = [...week1Examples, ...week2Examples]`. `planning/reps-v2-content-gaps.md:13`: 'Worked examples for Weeks 3–12 | not written'. `components/course/course-today.tsx:235`: 'A new unit starts with the idea, then a worked example, then the reps.' This shows even when `examples` (line 99) is empty. `lib/course/content.test.ts:19` only checks that listed ids resolve, so empty arrays pass.
- Detail: All 10 worked examples that §16 requires are missing: two-pointer movement, sliding window, binary search, linked-list rewiring, recursion, tree recursion, BFS, graph traversal, backtracking and DP. So are heaps, intervals, stacks, fast/slow, cycles, grids, BST, prefix and matrix/tries. Week 1–2 units without one: w1-integration (:108), w2-testing (:155), w2-solve-map (:185), w2-hashing (:200). For Weeks 3–12, the learning sequence goes straight from a text concept guide to reps. In w3-running-prefix the first required rep is the LC 121 capstone. CI cannot detect the gap.
- Suggested fix: Add a new `data/course/content/worked-w3w12.ts` and merge it at lessons.ts:12.
- Write at least 10 worked examples for w3-two-pointers, w4-windows, w5-binary-search, w5-linked-lists, w6-recursion, w7-trees, w8-queue-bfs, w8-graphs, w11-backtracking and w11-dp, then w9-heaps and w10-intervals.
- Give each a demo ref and a new from-blank reconstruction rep (stage 'reconstruct', starter is the signature only) in `data/exercises/course`, placed in the unit path before the drills.
- A worked example must never be the unit's LeetCode target (principle 2).
- Extend content.test.ts so every Week 3–12 unit (except w13/w14) has at least 1 worked example with a demo, and every §14 concept has a demo.
- Make the Today copy conditional on `examples.length`.
- Verifier: I checked each citation and they hold up. In data/course/units.ts, all 20 Week 3–12 units (lines 218 through 541) have `workedExampleIds: []`. So do w1-integration (:108), w2-testing (:155), w2-solve-map (:185) and w2-hashing (:200), plus w13/w14 (:560, :578). data/course/lessons.ts:12 builds WORKED_EXAMPLES only from week1 and week2 content, and line 8's comment says later weeks teach through the concept guides. The ConceptSpec in data/concepts.ts holds only whyItMatters, shape[] and a single `example: { code, output }` (line 234). That is a runnable snippet, not the PROBLEM → MANUAL REASONING → SUBGOALS → VISUAL DEMO → CODE → RECONSTRUCTION sequence that §16 (spec line 303) asks for. None of the 10 required topics has a worked example.

In components/course/course-today.tsx, `learnFirst` (line 101) is true when `lessons.length > 0 || examples.length > 0`. Every W3–12 unit has a lessonId, so the line-235 copy "A new unit starts with the idea, then a worked example, then the reps." appears even though `examples` is empty. That promise is not true.

lib/course/content.test.ts:19 only checks that listed ids resolve, so an empty array passes. planning/reps-v2-content-gaps.md:13 admits the gap. The w3-running-prefix claim is also correct: its first section, d3-stock (data/exercises/oct03.ts:1331), opens with `capstone({ id: 'cap-best-time-stock' ...` (LC 121).

Major is the right severity: this materially fails §16 and spec Phase D (line 406). The false Today copy is a small truthfulness problem in its own right, but it doesn't make the product's progress or readiness claims untrue, so it doesn't reach critical. Corrected: The claim is accurate. Two clarifications:

1. The Week 3–12 concept guides do have a small runnable `example: {code, output}` (data/concepts.ts:233-234, :262). So the learner is not left with text alone. But that snippet has no subgoals, manual reasoning, visual demo or reconstruction rep, so it does not satisfy §16.

2. The Week 1 example we-best-so-far (unit w1-running-state) is relevant to w3-running-prefix but is not linked from that unit. Today's learn-first card (course-today.tsx:101, :235) shows the "then a worked example" copy for every W3–12 unit, because each has a lessonId even though `examples` is empty.

Missing worked-example units total 26: 20 in Weeks 3–12, 4 in Weeks 1–2, plus w13-transfer and w14-interview, which may be intentionally empty.

### 3. [MAJOR] Worked examples lack MANUAL REASONING and VISUAL DEMO, and the solution is shown as one static block cut off from the subgoals — CONFIRMED (severity keep)
- Spec: §16, §15
- Evidence: `data/course/types.ts:23-34`: `export interface WorkedExample { id; title; unitId; problem: string; subgoals: { title: string; explanation: string; code?: string }[]; solution: string; reconstructionExerciseId: string }`. `components/course/worked-example.tsx:16`: `const [shown, setShown] = useState(1)` is forward-only, with no back or reset. Lines 35-37: `<p className="label">All together</p> <CodeView code={example.solution} />`. The only manual reasoning in any worked example is a Python comment block inside a CodeView: `data/course/content/week2.ts:548` `# ch   current  count  pieces`.
- Detail: The current flow is PROBLEM → SUBGOALS → SOLUTION → rebuild link. §16 requires PROBLEM → MANUAL REASONING → SUBGOALS → VISUAL DEMO → CODE → RECONSTRUCTION. The final code appears all at once, so the learner never sees the sequence that produced it. I mapped subgoal fragments to solution lines. we-countdown maps as g1 2–3, g2 4, g3 5, g4 6–7. we-first-negative, we-best-so-far and we-shared-list map fully. Some fragments are deliberate asides that are not in the solution: we-contract g1/g2, we-manual g1 (the hand table) and we-improve g1/g4. Naive text matching mis-maps we-manual g4: `pieces.append(current + str(count))` appears at lines 11 and 14. So the mapping must be explicit and tested.
- Suggested fix: Extend WorkedExample with:
- `manual: { example: string; trace?: DemoRef; noticing: string[] }`;
- `demo: DemoRef`;
- `subgoals[].lines?: [from, to]` or `aside: true`;
- an optional `predict`.

Render six phases with a shared numbered phase header (extract the `step()` helper at `lab-view.tsx:26-34`) and support back and reset. In the CODE phase, show the solution assembling in CodeTrace with each goal's lines highlighted. Add a test that, for every non-aside subgoal, the trimmed solution lines [from..to] equal the trimmed fragment lines, and that every worked example has `manual` and `demo`.
- Verifier: I checked every piece of cited evidence and it holds. data/course/types.ts:23-34 defines WorkedExample with only these fields: id, title, unitId, problem, subgoals {title, explanation, code?}, solution and reconstructionExerciseId. There is no field for manual reasoning, no field for a demo or trace, and nothing links a subgoal to lines of the solution. In components/course/worked-example.tsx, line 16 is `const [shown, setShown] = useState(1)`. The only control (lines 47-49) is `setShown((n) => n + 1)`, with no previous, reset or replay. Once every subgoal has been shown, lines 35-37 render `<p className="label">All together</p>` and `<CodeView code={example.solution} />` as one static block. Nothing in that block highlights the lines that came from each subgoal. The only hand-worked table is the commented CodeView in we-manual's first subgoal (data/course/content/week2.ts:548, `# ch   current  count  pieces`). The week 1 subgoal titles contain no traces. components/demo/ is the public marketing demo (app/demo/page.tsx), not an algorithm visualiser, so no VISUAL DEMO step exists. The shipped flow is therefore PROBLEM → SUBGOALS (progressively revealed) → SOLUTION → Rebuild link, which fails §16's PROBLEM → MANUAL REASONING → SUBGOALS → VISUAL DEMO → CODE → RECONSTRUCTION. Two things the claim does not mention: RECONSTRUCTION already exists (the rebuild link at lines 41-43, through reconstructionExerciseId), and subgoals are revealed one at a time, so the problem is that the solution is not tied to the subgoals, not that it is shown up front. The claim also understates the gap. Only 7 worked examples exist and all are in weeks 1-2: we-countdown, we-first-negative, we-best-so-far and we-shared-list in week1.ts, and we-contract, we-manual and we-improve in week2.ts. data/course/lessons.ts:12 is `WORKED_EXAMPLES = [...week1Examples, ...week2Examples]`. None covers the ten topics §16 requires for weeks 3-12. Major is the right severity. This materially fails a V2.1 requirement, but it does not make the product untruthful. Corrected: The claim is largely accurate. The WorkedExample type (data/course/types.ts:23-34) and the view (components/course/worked-example.tsx) support only this flow: PROBLEM → progressively revealed SUBGOALS (forward-only, `setShown((n) => n + 1)`, line 47, with no back or reset) → one static `<CodeView code={example.solution} />` under "All together" (lines 35-37) → a Rebuild link (lines 41-43). The model has no MANUAL REASONING field, no VISUAL DEMO step or link to an interactive demo, and no explicit link from each subgoal to lines of the final solution. The only hand trace is a commented table inside a subgoal CodeView (week2.ts:548). RECONSTRUCTION already exists and should be kept, and so should subgoal-by-subgoal reveal. The gap is also larger than the claim says. All 7 worked examples are in weeks 1-2 (data/course/lessons.ts:12 `[...week1Examples, ...week2Examples]`), and none exists for any §16 topic: two pointers, sliding window, binary search, linked-list rewiring, recursion, tree recursion, BFS, graph traversal, backtracking or DP. V2.1 therefore needs a richer schema with explicit manualReasoning, a demo reference and subgoal→solution line mappings checked by a test. It also needs new worked-example content for weeks 3-12. Severity stays major.

### 4. [MAJOR] Markdown has no tables or ordered lists: the Week 1 variable table, the Solve Map's nine steps and all 46 lab specs render as run-on paragraphs — CONFIRMED (severity keep)
- Spec: §17, §22 (and §15 state tracing)
- Evidence: `components/markdown.tsx:53-76` handles only ``` fences, `/^\s*[-*] /` bullets and blank lines. Everything else goes through `para.push(line.trim())` and is joined with ' ' (line 38). `data/course/content/week1.ts:41` (`'| pass | price | total |\n|---|---|---|\n| before | – | 0 |...'`) renders via renderToStaticMarkup as `<p>| pass | price | total | |---|---|---| | before | – | 0 | | 1 | 4 | 4 | | 2 | 6 | 10 | | 3 | 5 | 15 |</p>`. `week2.ts:27` (Solve Map) renders as `<p>1. <strong>Contract</strong>: ... 2. <strong>Example</strong>: ... 9. <strong>Verify</strong>: ...</p>`. `week2.ts:246` and `week1.ts:419` render the same way. 48 course rep prompts (all 46 lab build/change parts plus c2-solve-plan and c2-solve-restock) render via `rep-workspace.tsx:995` `<Markdown text={ex.prompt} />`. For example, lab-sorted-match-build becomes `<p>1. <code>merge_prices(a, b)</code> returns ... 2. <code>shared_prices(a, b)</code> ... 3. <code>match_orders(buys, sells)</code> ...</p>`. Single newlines also collapse: the we-countdown problem renders '`countdown(3)` → `[3, 2, 1]` `countdown(0)` → `[]`' on one line.
- Detail: The only state-tracing visual in the course, the 'Keep a variable table' section of Week 1 Day 1's State lesson, is unreadable. Week 2's core framework (the nine-step Solve Map) and every lab's function-by-function spec are walls of text. That is worse than the heading/paragraph pattern §17 forbids.
- Suggested fix: In `markdown.tsx` (about 30 lines, still no HTML):
- render ordered lists (`/^\s*\d+\.\s/` → `<ol>`);
- render pipe tables (header row plus a `|---|` separator → `<table>`, with `.prose-reps table` styles in globals.css);
- render consecutive example lines that start with a backtick as separate lines.

Add a content test that rejects unsupported Markdown in lessons, worked examples, labs and prompts. Then replace the l-state table and the l-manual printed trace with the interactive trace-table demo, which uses the same TableView as DP.
- Verifier: The claim holds. In `components/markdown.tsx:53-76` the renderer only recognises ``` fences, lines matching `/^\s*[-*] /` and blank lines. Every other line goes through `para.push(line.trim())`, and `flushPara` joins those lines with `para.join(' ')` (line 38). There is no handling for `|` tables or `N.` ordered lists, and the header comment says as much: "paragraphs, bullet lists, fenced code blocks ... Nothing else". The `.prose-reps` CSS (`app/globals.css:507`) has no pre-wrap that would keep the line breaks.

What I checked:
- **Week 1 table:** The variable table at `data/course/content/week1.ts:41` is rendered through `components/course/lesson-body.tsx:25` (`<Markdown text={s.body} .../>`). It comes out as one `<p>` full of pipe characters.
- **Solve Map:** The section at `week2.ts:24-29` is built with `md(...)`, which is `lines.join('\n')`. Its lines start "1. **Contract**" through "9. **Verify**", so they collapse into one paragraph.
- **Lab prompts:** They render through `components/rep/rep-workspace.tsx:995` (`<Markdown text={ex.prompt} />`). Most of them have numbered function specs: `lab-sorted-match-build` at `data/exercises/course/labs-w3w8.ts:1375-1381`, and `labs-w1w2.ts:386-400` with its numbered `apply_month` and `simulate_savings` steps. All of these become run-on paragraphs.
- **Single newlines:** The `countdown` example at `week1.ts:492` (`\`countdown(3)\` → ...\n\`countdown(0)\` → ...`) also collapses onto one line.

Severity: §17 forbids flat heading/paragraph text and asks for state visualisations. §22 covers visual quality. The course's only state-tracing table and the main Week 2 framework are unreadable, so major is right. Corrected: The renderer behaviour is exactly as claimed. The one overstated part is the "all 46 lab specs" count. There are 46 lab build/change exercises (24 in labs-w3w8, 14 in labs-w9w13, 8 in labs-w1w2), and a grep finds lines starting with `'1. ` in 23 of the 24 w3w8 prompts and all 14 w9w13 prompts. The w1w2 prompts are template literals, and many of them contain numbered lines (49 lines match `^[0-9]\. `). Most lab prompts are affected, but I did not verify that every one of the 46 has a numbered list. Each place markdown is rendered (lesson sections, worked examples, lab briefs, rep prompts, mock-session prompts) uses the same `Markdown` component, so any table or ordered list anywhere in the course degrades the same way.

### 5. [MINOR] Worked examples are hard to reach, and concept guides (the only Week 3–12 teaching surface) are dead ends — CONFIRMED (severity keep)
- Spec: §4 (Q5–Q7), §6, principle 13
- Evidence: Only two places link to /example/:
- `components/course/course-today.tsx:243`, inside `learnFirst`, which requires `cd.course.current!.done === 0` (line 101);
- `app/learn/[id]/page.tsx:25-27`, `nextSteps()`, used for lessons only.

`components/course/road-map.tsx:100-120` lists lessons, checkpoints, labs and LC targets but no worked examples. `app/learn/page.tsx:20-43` lists LESSONS and CONCEPTS but no worked examples. The concept branch at `app/learn/[id]/page.tsx:51-67` renders `<ConceptBody concept={c} full />` with no next CTA. Its eyebrow at line 60, `{c.pattern ? ` · ${c.pattern}` : ''}`, shows the 90-day-plan pattern (e.g. 'Strings + two pointers') rather than the course week and unit.
- Detail: After the first rep of a unit, Today stops linking the lesson and worked example. A Week 3–12 learner who opens a concept guide reaches the end of the page with no 'rebuild', 'start the reps' or 'open the lab' step.
- Suggested fix: Give concept pages the same `nextSteps` treatment, finding the unit via `lessonIds.includes(id)`: demo → worked example → first rep → lab. List worked examples and demos in the road-map unit detail and on /learn. Keep the unit's lesson, demo and example visible on Today for the whole unit, not only while `done === 0`. Show 'Week N · unit title' in the concept eyebrow.
- Verifier: The claim is mostly accurate. I checked each point.
- The only links to /example/ in app, components and lib are components/course/course-today.tsx:243 and app/learn/[id]/page.tsx:27.
- The Today link sits inside learnFirst (line 101), which requires `cd.course.current!.done === 0`.
- nextSteps() is called only from the lesson branch (line 45).
- road-map.tsx:100-125 links lessons and labs and lists checkpoints and LC targets, but has no worked examples.
- app/learn/page.tsx lists LESSONS and CONCEPTS only.
- The concept branch (lines 51-67) renders `<ConceptBody concept={c} full />` with no next-step CTA.
- ConceptBody (components/concept-guide.tsx) ends with videos and a "More examples" primers disclosure. It has no link to reps or labs.
- The eyebrow uses `c.pattern`. data/concepts.ts:21 documents that field as "The plan unit it belongs to, when it is a pattern of the 90-day plan" (e.g. 'Strings + two pointers', 'Hashing'). It is not the course week or unit.

Two corrections:
(1) For Weeks 3-12, worked examples are not merely hard to reach; none exist. Every unit from data/course/units.ts:199 onward has `workedExampleIds: []`. Only 7 units, all in Weeks 1-2, have one. So for Weeks 3-12 this is a content gap (spec Phase D, line 406: "visual worked examples for Weeks 3–12"), not a linking problem. The "hard to reach" point applies only to the Weeks 1-2 examples.
(2) Today does still link a concept guide after a unit's first rep: the "Review a concept" link at course-today.tsx:327-330. That link appears only after the day is complete, and it leads to the dead-end concept page. So the dead-end point stands.

Minor fits as the severity for the navigation and eyebrow polish. The missing Week 3-12 examples are a separate Phase D content item. Corrected: Worked examples exist only for Weeks 1-2: 7 units have one, and every unit from data/course/units.ts:199 onward has `workedExampleIds: []`. For those Weeks 1-2 examples, the only entry points are Today's learnFirst block (course-today.tsx:243, gated on `done === 0` at line 101) and nextSteps() after a unit's last lesson (app/learn/[id]/page.tsx:27). Road map (road-map.tsx:100-125) and /learn (app/learn/page.tsx) do not list them.

For Weeks 3-12 the issue is absent content (spec Phase D), not reachability. In those weeks the concept guides are the only teaching surface. The concept branch of app/learn/[id]/page.tsx:51-67 renders `<ConceptBody concept={c} full />` with no "start the reps" or "open the lab" CTA, and ConceptBody ends with videos and primers, so the page is a dead end. Today's "Review a concept" link (course-today.tsx:327-330) leads there.

The eyebrow at line 60 shows `c.pattern`, which data/concepts.ts:21 documents as the 90-day-plan pattern (e.g. 'Hashing'), not the course week or unit. Severity: minor for the navigation and eyebrow. The missing Week 3-12 worked examples are a separate major content-gap item under Phase D.

### 6. [MINOR] Lesson code/output pairs and worked-example solutions are never verified, despite the file header's claim — CONFIRMED (severity keep)
- Spec: §29, principle 12
- Evidence: `data/course/content/week1.ts:5`: `* Every `code` block runs as written, and its `output` is exactly what it prints.` `scripts/verify-content.ts:15`: `const problems = [...verifyDays(days), ...verifyExercises(exercises), ...verifyPromptExamples(exercises), ...(... verifyPrimers(PRIMERS) ...)]` includes no LESSONS or WORKED_EXAMPLES. No script or test imports lesson section code or worked-example solutions (grep). `lib/course/content.test.ts:52-54` checks only reconstruction ids and section counts.
- Detail: Today the content holds: 42 of 42 lesson programs match their declared output under python3, and all 8 worked-example example calls pass. But nothing enforces it. Phase C/D will add at least 10 worked examples plus demo code whose displayed Python must match what the animation shows.
- Suggested fix: Add `verifyLessons`, `verifyWorkedExamples` (solution plus the problem's `f()` → value examples) and `verifyDemos` (stripped demo code plus `pythonCall` on each preset, compared with the generator's final result) to `lib/content-check.ts`, reusing `runPythonBatch`, `outputMatches` and `promptExamples`. Call them from `scripts/verify-content.ts`, and from verify-pyodide for browser parity.
- Verifier: The claim holds up. The header at data/course/content/week1.ts:5 says "Every `code` block runs as written, and its `output` is exactly what it prints", and data/course/types.ts:15 says the same ("`code` blocks are Python and must run"). Nothing enforces either statement.

- scripts/verify-content.ts:15 builds its problem list only from verifyDays, verifyExercises, verifyPromptExamples and verifyPrimers. The only exported checkers in lib/content-check.ts are runPythonBatch (line 36), verifyExercises (50), verifyDays (117), verifyPrimers (132) and verifyPromptExamples (155). There is no lesson or worked-example checker.
- A grep of scripts/, lib/, tests/, e2e/ and data/ finds LESSONS / WORKED_EXAMPLES imported in only two places:
  - scripts/audit-migration.ts:12, which only counts them (lines 118-119: `newLessons: LESSONS.length`).
  - lib/course/content.test.ts:52-54, which asserts reconstruction-exercise ids and section/mistake counts. It never runs any code.
- The `npm run verify` chain (package.json:14) therefore never executes lesson sections[].code / output pairs. The same goes for worked-example subgoals[].code (types.ts:29).

Severity: minor is right. §29's testing list does not explicitly require checking lesson code. Mismatched lesson output would only indirectly touch principle 12, which is about truthful progress, not teaching content. So this is a missing guard rail, not a current defect.

I did not re-run the auditor's "42/42 lessons match, 8/8 worked examples pass" result. It does not affect the claim, which is about missing enforcement. Corrected: Accurate as stated. Small precision: worked examples carry code in subgoals[].code (data/course/types.ts:29), and lessons carry sections[].code/output (types.ts:16). Neither is run by scripts/verify-content.ts or by any test. The only places that consume LESSONS / WORKED_EXAMPLES are lib/course/content.test.ts:52-54, which checks structure only, and scripts/audit-migration.ts:118-119, which only counts them. The fix would be a verifyLessons / verifyWorkedExamples check in lib/content-check.ts that reuses runPythonBatch, wired into verify-content.ts.

### 7. [MINOR] Runnable, editable examples exist only in the rep Basics panel; lesson and concept code can never be run — CONFIRMED (severity keep)
- Spec: §15 (editable input, before/after state)
- Evidence: `components/rep/basics-panel.tsx:256`: `function TryIt({ initial }: { initial: string })` is not exported and calls `getRunner().run(code, [])`. `components/course/lesson-body.tsx:26` `{s.code && <CodeView code={s.code} className="mt-3" />}` and `components/concept-guide.tsx:88` `<CodeView code={p.example.code} />` are static only.
- Detail: The learning pages offer no 'change the input and see what happens'. The runner and editor needed for it already exist but are locked inside the rep page.
- Suggested fix: Move TryIt to `components/try-it.tsx` (a client component using the dynamic CodeEditor with ssr:false). Let lesson sections and concept examples opt in with `runnable: true`. Demos keep their own structured input editor driven by `DemoSpec.parse`.
- Verifier: The claim checks out. The only place teaching code can be edited and run is the private `TryIt` component in components/rep/basics-panel.tsx:256. It calls `getRunner().run(code, [])` at line 263 and is only used inside the rep page's BasicsPanel (lines 120 and 193), which rep-workspace.tsx:21 imports. The learning routes only show static code:
- app/learn/[id]/page.tsx renders LessonBody, which uses `{s.code && <CodeView code={s.code} className="mt-3" />}` at lesson-body.tsx:26 and a static `<pre>` for the printed output.
- The same route renders ConceptBody, which uses `<CodeView code={p.example.code} />` at concept-guide.tsx:88.
- Worked examples (app/example/[id] -> components/course/worked-example.tsx:30 and :37) also use only CodeView.

The other places that use CodeEditor and getRunner are not teaching examples: mock-session.tsx and demo/demo-practice.tsx are practice and interview editors with tests. On the learn and example pages there is no editable input and no before/after state. §15 says only "Aim for some combination of ... editable input, before/after state", so this is a soft goal and minor is the right severity. Corrected: The claim is accurate, with one detail to add. Concept primer examples can be run, but only inside the rep page: BasicsPanel loads `p.example.code` into TryIt at basics-panel.tsx:148 and :193. The same primers are static on /learn/[id] (concept-guide.tsx:88). Lesson section code (lesson-body.tsx:26) and worked-example code (worked-example.tsx:30, :37) can't be run anywhere. TryIt (basics-panel.tsx:256) is not exported, so the learning pages can't use it until it is moved into a shared component.

### 8. [MINOR] No shared reduced-motion hook: CSS zeroes animation durations but cannot stop JavaScript-driven autoplay — REFUTED
- Spec: §21, §29 (reduced motion supported)
- Evidence: `app/globals.css:933-948`: `@media (prefers-reduced-motion: reduce) { ... *, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; animation-delay: 0ms !important; } }`. Ad-hoc checks: `components/winston-ambient.tsx:45` and `components/winston-perch.tsx:21`, both `const still = window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Detail: A demo player advances steps on a timer. The CSS rule removes transitions but the steps would still advance by themselves, so reduced-motion users get flashing state changes. §29 requires a test that reduced motion is supported.
- Suggested fix: Add `components/visual/use-reduced-motion.ts` using `useSyncExternalStore` (subscribe to `matchMedia` change events; server snapshot false). The player defaults autoplay off when it is true and swaps steps without transitions. Test this through the pure reducer's initial state and a Playwright `page.emulateMedia({ reducedMotion: 'reduce' })` check that `data-step` does not change without input.
- Verifier: The quoted evidence is accurate. The CSS block is at app/globals.css:933-948, and the only JS checks are in components/winston-perch.tsx:21 and components/winston-ambient.tsx:45. There is no shared useReducedMotion hook (the grep finds only those two plus components/winston-ambient.css:75). But the claimed defect does not exist. Nothing in the repo is a demo player that advances steps on a timer. components/demo/demo-view.tsx (234 lines) and components/demo/demo-practice.tsx (146 lines) contain no setTimeout, setInterval or autoplay at all. They only use Tailwind transition-colors/transition-transform classes, which the CSS rule already zeroes. Every setInterval in the repo is a clock or elapsed-time tick, not motion: components/today-blocks.tsx:36,41, components/mock-session.tsx:156, components/reps-provider.tsx:113 and components/rep/rep-workspace.tsx:357. The JS-driven motion that does exist is Winston's wander/stroll, and it already checks reduced motion: `if (!still.matches && document.visibilityState === 'visible')` in both Winston components. components/program-progress.tsx:37 runs timers that only toggle CSS classes (advancing, finale, justDone) and a toast, so the global CSS rule already removes their motion. So 'reduced-motion users get flashing state changes from an autoplaying demo' is invented. Having no shared hook is at most code-organization polish, not a §21 violation. Corrected: Reduced motion is respected wherever the code moves things today. CSS durations are zeroed globally (app/globals.css:933-948). The only JS-driven motion, Winston's wandering, is skipped under `still.matches` (components/winston-ambient.tsx:45-53, components/winston-perch.tsx:21-28). The demo components (components/demo/demo-view.tsx, demo-practice.tsx) have no timers or autoplay. The only accurate parts are these. (a) No shared useReducedMotion hook exists, so any future JS-timed demo stepping would need to remember to check it (minor/polish). (b) §29's 'Interactive demos: ... reduced motion supported' test does not exist, because no step-through interactive demo exists yet to test. That is a gap in V2.1's demo work, not a reduced-motion bug.

## progress-plan

After Oct 26 the Progress page (components/progress-view.tsx) has one V2 block (Feb 1 readiness plus finished-week summaries, via readiness-report.tsx) on top of five V1 blocks: a stat row with the V1 streak, days practiced and LeetCode-tracker numbers, a 90-day minutes heatmap, minutes measured against the old V1 plan, the Day 30/60/90 checkpoints and the 90-day pattern readiness. A mixed weak-skills table sits below them, and the V1 progress rail in the header shows on every page.

I simulated learners who do exactly what the course asks. The V1 blocks contradict the V2 model at every level:
- **Streak:** Progress shows 1 and Today shows 26 on Nov 30, because Saturdays and Dec 26/31 count as V1 working days.
- **Patterns vs domains:** V1 shows 0/15 patterns cleared while V2 shows 10/15 domains Ready on Dec 12.
- **Checkpoints:** every V1 checkpoint row fails, including quotas of 5/12/22 mocks that the course forbids.
- **Header %:** 3% after a perfect Week 1 and 89% after finishing all 14 weeks.

The V2 parts also disagree with each other:
- **Readiness ignores four inputs:** the current week (it says 'On track: Output … where the plan needs them' next to 'Week 3 OFF TRACK 0/75'), labs, the transfer grade and mocks.
- **Week completion has three definitions:** the Plan can show 'COMPLETE 27/50' for a week that Progress shows as OFF TRACK.
- **Road map states follow the calendar:** weeks with unlocked units are badged Locked, and six weeks can be Active at once.
- **Evidence grid:** it merges independent and retrieval into 'Cold, independent', and the pass each problem is counted from depends on the order attempts load in (UUID order).

Missing from the §9 hierarchy:
- course progress
- the current week's output
- V2 training consistency
- mastery vs freshness
- labs/building
- Software Building and Applied AI/FDE readiness
- actionable weak skills

All the V2 libraries needed already exist: credits, weekProgress, trainingStreak, courseStatus, gateStatus, masteryEvidence, labProgress/aiFde, transferGrade/mockPolicy and WeekStrip. So the fix is mostly removing the V1 blocks, then routing everything through one week-completion contract and one readiness input object. No test covers /progress.

**Already correct:**
- lib/course/week-status.ts:101-111 trainingStreak counts consecutive training days where the target was met. It skips Sundays, holidays and Saturdays, and an unfinished today does not break it; tests cover the New Year holidays (week-status.test.ts:49-55). This is the right streak for Progress.
- lib/course/week-status.ts:60-94 weekProgress (done/target/expectedByNow/shortfall/daysComplete, aware of rest days) and the calendar targets 50/60/75…45…60/75, which sum to COURSE_TARGET = 950 (data/course/calendar.ts:73-86), are the right inputs for weekly output. Only the timing of the lab/gate check is wrong.
- lib/course/credit.ts:49-60 masteryEvidence already separates cold-independent, independent, self-corrected, assisted, reconstructed, retrieval, revealed and failed. The six categories §9/§11 ask for already exist for each attempt; only the summary merges them.
- lib/course/readiness.ts:46-59 (domainOf) with readiness-report.tsx:40-51 gives each domain Ready/Developing/Not started with a reason and never a single percentage. A per-domain 'stale' flag (readiness.ts:51-52) is a starting point for mastered vs stale.
- components/course/readiness-report.tsx:86-116 already summarises each finished week: training days complete, x/target, a ✓/— for each required lab and live checkpoint, and a 'complete' flag that requires output + required labs + all live gates. The week-complete message only fires when that flag is true.
- components/course/course-cards.tsx:25-91 WeekCard already shows the §9 weekly-output line (done/target bar, builds, checkpoints n/m, status badge, week strip). It can be reused on Progress as is.
- components/course/week-strip.tsx shades each day by output via flameFor(done, dailyTarget), shows planned rest as ☾ and Saturday as optional, and never marks rest as a failure. It is the right building block for a V2 heatmap.
- components/course/road-map.tsx already has 14 week rows with dates, focus, target and holiday rest labels (e2e checks Christmas Day in W9). Each unit shows its state, real prerequisite locks ('Locked · needs N earlier units'), a gate ✓ and lesson/lab/target links. The header line 'X of 950 qualifying problems · Feb 1 checkpoint' (51-53) uses the same credits as Today.
- Plan and Today both switch to V2 at COURSE_START (plan-view.tsx:48-59, dashboard.tsx:52).
- lib/course/labs.ts labProgress treats a lab as done only when the design, build, change request and review are all complete, and data/course/types.ts:52-55 has the aiFde and optional flags. The data to count junior SWE builds and AI/FDE builds separately already exists.
- lib/course/readiness.ts:99-124 transferGrade and mockPolicy are based on evidence and gated on readiness (InterviewCard uses them correctly). They only need to be passed into readiness().
- lib/course/routing.ts:81-127 gateStatus exposes failed, failedRep, repair reps for the broken skills, and the next variants. That is the basis for actionable weak skills.
- lib/course/credit.ts:95-115 dailyCredits/creditsByDate count each rep once per day and exclude passes with the solution shown, labs and multiple choice. The Plan's course total is built on it.

**Data:**

```
PROGRESS PAGE INVENTORY (after Oct 26, components/progress-view.tsx, top to bottom)
1. Subtitle L60-62: V2 copy ('from what you actually produced') over a mostly minutes-based page.
2. Feb 1 readiness panel L63-67 -> components/course/readiness-report.tsx L28-78. V2-COURSE-DERIVED: track + why (finished weeks, frontier, blocked gates, assistance); 15 domains from unit/gate states; Independent transfer + Interview execution rows (V2 labels but NOT evidence-derived, fixed text); 4 evidence tiles (merged categories).
3. Weeks so far, readiness-report.tsx L80-120. V2: finished weeks only. The status badge ignores labs and gates.
4. Stat row L69-75:
   - Streak: V1 (PLAN_DAYS working days, any activity)
   - Days practiced: V1
   - Problems done: V1 LeetCode tracker (counts failed and solution-viewed)
   - Re-solves unaided: MIXED (V1 metric, fed by V2 courseLeetcode re-solve kinds)
   - Target conversion: V1 (bridge-ladder TARGETS built from PLAN_UNITS)
5. '90 days' heatmap L77-116. V1: minutes per V1 plan day (Oct 12-Jan 9), V1 off days, links to V1 /day pages.
6. 'Time each week, against the plan' L119-138. V1: minutes vs V1 block minutes, V1 week numbers.
7. 'Checkpoints' L140-164. V1: Day 30/60/90 patterns/problems/unaided/mocks.
8. 'Pattern readiness' L168-199. V1: 15 PLAN_UNITS ladders, links to V1 /day pages.
9. 'Weak skills, over the last week' L201-239. MIXED: skill-score model (lib/mastery.ts), not course-aware or actionable.
GLOBAL: header rail + % (components/header.tsx L55-109). V1 (DAYS canonical reps), visible on Progress and Plan.
Totals: 2 V2 blocks, 5 V1 blocks plus the V1 header, 2 mixed items.

PLAN PAGE (after Oct 26: plan-view.tsx L48-59 -> components/course/road-map.tsx)
- Course total 'X of 950 qualifying problems': V2.
- 14 week rows with weekState: MIXED (unit states + calendar week).
- Per-week x/target: V2 credits.
- Unit rows: V2 states and prerequisite locks. Gates show a check; labs and targets have no done state.
- The pre-course V1 plan code still runs on every render (plan-view.tsx L24-45).

PLACES WHERE TWO MODELS ARE SHOWN (computed with throwaway scripts against real repo data)
- Streak, Progress V1 vs Today V2. Learner who meets the V2 target on every V2 training day from Oct 26 and rests when V2 says rest:
  - Nov 6: 5 vs 10
  - Nov 30: 1 vs 26
  - Dec 24: 3 vs 44
  - Dec 28: 1 vs 45
  - Jan 4: 1 vs 48
  - Jan 15: 0 vs 57
  - Jan 29: 0 vs 66
  - 'Days practiced': '26 of 41 working days' on Nov 30; frozen at '52 of 73' from Jan 10 to Jan 31.
- Readiness, V1 patterns cleared vs V2 domains Ready. Learner who passes every V2 unit path rep and clears every gate:
  - Nov 14: 0/15 vs 4/15
  - Dec 12: 0/15 vs 10/15
  - Jan 9: 1/15 vs 13/15
  - Jan 16: 2/15 vs 15/15
- Checkpoints: V1 Day 30/60/90 (Nov 10, Dec 10, Jan 9 = course weeks 3, 7, 11) vs V2 gates and the Feb 1 checkpoint. The perfect V2 learner fails every row at every checkpoint (e.g. Day 90: patterns 1/15, problems 25/52, unaided -/80%, mocks 0/22).
- Week numbering: V1 'Wk 3' = course Week 1, and V1 Wk 13 = course week 11. The time chart ends on Jan 9.
- Week complete, three rules:
  - Road map: every unit ready
  - Weeks so far: output + required labs + live gates
  - Status badge: output pace only; the lab/gate rule never fires
  - Placement learner (23 V1 reps passed in October, then 27 credits in Week 1): Plan 'COMPLETE 27/50' vs Progress 'OFF TRACK 27/50, 0/5 training days complete'.
- Readiness vs current week: on Nov 11 (Wednesday of week 3, nothing done yet), Today's WeekCard says OFF TRACK 0/75 (30 behind) next to Feb 1 readiness ON TRACK 'Output, checkpoints and independence are where the plan needs them.'
- Transfer/interview: Today's InterviewCard (transferGrade, mocks done) vs the Progress rows (fixed 'Not tested yet' / 'Building').
- Overall progress: header V1 % (perfect Week 1 = 23/716 = 3%; all 14 weeks = 635/716 = 89%) vs Plan 'X of 950'.
- Freshness: Today's warm-ups treat a skill as stale after 3/6/12/21/30 days depending on its clean cold reps. Readiness marks a unit '· stale' after 14 days untouched, and failed attempts restart that clock.
- Mock counts: V1 checkpoints count the mock log plus in-app mocks; InterviewCard counts program.mocks (in-app only); readiness gets none.
- Evidence: the same 2 attempts on cap-contains-duplicate give {assisted:1} or {coldIndependent:1} depending on array (UUID) order.

CALENDAR OVERLAP, Oct 26-Jan 31 (98 days)
- V2 training and V1 working: 49
- V2 Saturday recovery but V1 working: 10 (Oct 31 … Jan 9)
- V2 rest but V1 working: 2 (Dec 26, Dec 31)
- V2 training but V1 off: 3 (Nov 26, Nov 27, Dec 24)
- V2 rest and V1 off: 12
- No V1 day at all: 22 (Jan 10-31: 14 training, 3 recovery, 5 rest)

V1 CHECKPOINT TARGETS vs V2
- Nov 10 (week 3): V1 wants 5 patterns, 18 problems, 65% unaided, 5 mocks. V2 has 10 LeetCode targets through week 3, and mocks only from Jan 25 on a green or yellow transfer grade.
- Dec 10 (week 7): V1 wants 10 / 33 / 75% / 12. V2 has 25 targets.
- Jan 9 (week 11): V1 wants 15 / 52 / 80% / 22. V2 has 40 targets.

WEEK TARGETS: 50, 60, 75 x6, 60, 45, 75, 75, 60, 75 = 950 (COURSE_TARGET).
Unit path + gate passes vs week target:
- W1 65+8 / 50
- W2 197+11 / 60 (w2-hashing alone 125)
- W3 38+6 / 75
- W4 53+4 / 75
- W5 46+4 / 75
- W6 22+4 / 75
- W7 51+2 / 75
- W8 75+6 / 75
- W9 51+4 / 60
- W10 25+2 / 45
- W11 58+4 / 75
- W12 49+4 / 75
- W13 48 / 60
- W14 55 / 75

LABS: 23 in total. 22 are required (lab-priority-queue is optional). 2 are AI/FDE (lab-support-router W12, lab-fde-workflow W13). So 20 required junior SWE builds and 2 AI/FDE builds.

HEADER RAIL: it counts 23 of the 65 Week 1 path reps, 0 of the 16 Week 1 gate reps and 0 of the 48 Week 13 reps.

V1 TIME CHART: planned minutes per week for course weeks 1-8 are 1125, 1130, 1375, 1430, 770, 1280, 1320, 1415. V1 blocks for Nov 10: New work 165, Re-solves 15, Mock 45, Log 5.

TEST COVERAGE: no e2e test visits /progress. The road map is checked only on Oct 26 (e2e/course.spec.ts L49-55).

RECOMMENDATIONS
REMOVE from Progress from COURSE_START:
- V1 Streak and Days practiced
- Problems done and Target conversion
- '90 days' minutes heatmap
- 'Time each week, against the plan'
- V1 Checkpoints
- V1 Pattern readiness
- all /day/<date> links
- the V1 header rail/% (replace with course credits / 950)

KEEP AS SECONDARY TELEMETRY (collapsed, at the bottom):
- minutes per course week, with no plan marker
- outside re-solves unaided %, shown inside cold evidence
- logged outside problems, unaided/hinted only (or move to Log/Problems)

REUSE:
- readiness domain table
- finished-week summaries (fix the badge)
- WeekCard
- WeekStrip
- Road map unit rows

ADD, in §26 order:
1. This week: x/target, builds, checkpoints, status (WeekCard data).
2. Course: credits/950, weeks completed n/14 through one contract, calendar week vs where the learner actually is (frontier), units ready / in progress / repair / locked.
3. Training consistency: trainingStreak, required days completed / training days so far, protected rest days, an output heatmap Oct 26-Jan 31 via flameFor.
4. Readiness dimensions:
   - Foundations
   - Problem solving
   - Core DSA (13 pattern domains nested)
   - Independent transfer (transferGrade)
   - Software building (labs + change requests)
   - Applied AI/FDE (aiFde labs, non-blocking)
   - Interview execution (mocks)
   - Track from the current week + last week + labs
5. Mastery and freshness: Mastered·fresh / Mastered·stale / Developing by unit, one freshness clock.
6. Cold evidence: 6 separate categories, strongest or latest pass per problem.
7. Labs/building: SWE x/20, change requests, AI/FDE y/2.
8. Actionable weak skills: broken skills from failed gates with a repair CTA; weak skills only from units already reached.
9. Telemetry, collapsed.

PLAN:
- One weekCompletion contract shared with Progress and Today.
- weekState = complete / repair / behind / active / available / locked, from the contract and dependencies.
- A 'you are here' marker for where the learner actually is (frontier unit).
- Lab and target checkmarks in the week detail.
```

### 1. [CRITICAL] Progress shows a V1 'working days' streak and 'Days practiced' that contradict Today's V2 training streak and penalise planned rest — CONFIRMED (severity keep)
- Spec: §9 Training consistency; §2 principles 5, 11, 12; §20; §26
- Evidence: components/progress-view.tsx:70 `<Stat label="Streak" value={`${streak(active, today, PLAN_DAYS)}`} sub="working days in a row" />`; components/progress-view.tsx:71 `of ${PLAN_DAYS.filter((d) => d.phase !== 'off' && d.date <= today).length} working days so far`; lib/progress-90.ts:31 `attempts.filter((a) => a.completedAt || a.attemptsBeforePass > 0)`; lib/progress-90.ts:39 `const working = planDays.filter((d) => d.phase !== 'off' && d.date <= today)`; components/course/course-today.tsx:153 `🔥 ${cd.streak} training day… in a row` (V2 trainingStreak, lib/course/week-status.ts:101-111)
- Detail: Two streak models appear on two pages. The V1 streak counts any activity (I checked that a single failed attempt, or a pass with the solution shown, counts as a practiced day). It runs on the V1 90-day calendar, where Saturdays, Dec 26 and Dec 31 are working days (in V2 they are optional recovery or rest), Nov 26-27 and Dec 24 are off days (in V2 they are training days), and nothing exists after Jan 9. I simulated a learner who meets the V2 target on every V2 training day from Oct 26 and rests whenever V2 says to rest. Progress vs Today: Nov 6 5 vs 10; Nov 30 1 vs 26; Dec 28 1 vs 45; Jan 15 0 vs 57; Jan 29 0 vs 66. 'Days practiced' reads '26 of 41 working days so far' on Nov 30, implying 15 missed days that V2 never asked for, and stays frozen at '52 of 73' from Jan 10 to Jan 31.
- Suggested fix: Remove both stats. Replace them with a Training consistency block built from V2 data: trainingStreak(today, credits) (cd.streak); required training days completed = the sum of weekProgress(w).daysComplete over weeks up to the current one, out of training days so far; and protected rest days so far (dates ≤ today whose dayType is rest or recovery), shown as protected, never as missed. Remove the streak and activeDates imports from progress-view.
- Verifier: I could not refute this. Every cited line is in the code as quoted, and each calendar fact checks out.

**The code**
- components/progress-view.tsx:70 shows `streak(active, today, PLAN_DAYS)` with the label "working days in a row".
- Line 71 shows "of N working days so far". Both render unconditionally, including when today >= COURSE_START, next to the V2 ReadinessReport.
- lib/progress-90.ts:31 (`activeDates`) counts any attempt with `completedAt || attemptsBeforePass > 0`, plus any solve-log entry. A failed attempt or an assisted pass therefore counts as a practiced day, with no V2 daily-target check.
- lib/progress-90.ts:38-47 (`streak`) walks the V1 PLAN_DAYS non-'off' days.
- Today uses `trainingStreak` from lib/course/week-status.ts:101-111. It counts only V2 'training' days where credits meet `dailyTarget`, and skips recovery and rest.

**The calendar (checked with a throwaway script, since deleted)**
- PLAN_DAYS runs from 2026-10-12 to 2027-01-09 (90 days).
- V1 'off' days are Sundays plus Nov 26, Nov 27, Dec 24, Dec 25 and Jan 1.
- Days where V1 and V2 disagree after COURSE_START:
  - Every Saturday is a V1 working day but V2 recovery.
  - Dec 26 and Dec 31 are V1 working days but V2 rest.
  - Nov 26, Nov 27 and Dec 24 are V1 off days but V2 training days.

**The numbers**
I hand-checked four of the cited figures and they match:
- Nov 6: V1 gives 5, because the rested Saturday Oct 31 breaks it. V2 gives 10.
- Nov 30: V1 gives 1, because the rested Sat Nov 28 breaks it. V2 gives 26.
- Dec 28: V1 gives 1, because Dec 26 is a V1 working day. V2 gives 45.
- Jan 15: V1 gives 0, because the list ends on Sat Jan 9 and that day was rested.

**Severity**
§9 names "old working-day streak calculations" as a V1 concept to remove. §9 Training consistency and §20 require a training streak that planned rest protects. §26 forbids contradictory systems. Showing "26 of 41 working days" for a learner who followed the plan exactly turns planned rest into visible debt (principle 5) and misstates progress (principle 12), so critical is justified. Corrected: The claim is accurate as stated. One clarification: the Progress page shows the V1 Streak and 'Days practiced' stats for every date, including after COURSE_START, right beside the V2 ReadinessReport. Also, the V1 'active' rule counts a day even when V2 credits fall short of the daily target, so the two streaks can disagree in either direction. For example, if a learner fails one rep on a V2 training day, the V1 streak grows while the V2 streak breaks.

### 2. [CRITICAL] Two readiness models on one page: V1 'Pattern readiness' (90-day ladders) vs V2 'Feb 1 readiness' (unit/gate domains) — CONFIRMED (severity keep)
- Spec: §9; §26 ('There should not be contradictory systems'); principle 12
- Evidence: components/progress-view.tsx:47 `const units = useMemo(() => unitReadiness(PLAN_UNITS, PLAN_DAYS, attempts), [attempts])`; components/progress-view.tsx:170-172 'Pattern readiness … A pattern is cleared when all of them are.'; lib/progress-90.ts:67-71 (cleared = every V1 PLAN_DAYS ladder rep passed); components/progress-view.tsx:63-67 also renders <ReadinessReport /> (lib/course/readiness.ts:26-59 domains from courseStatus)
- Detail: I simulated a learner who passes every V2 unit path rep and clears every gate:
- Nov 14: V2 4/15 domains Ready; V1 0/15 patterns cleared ('Strings + two pointers 44/46').
- Dec 12: V2 10/15 Ready vs V1 0/15.
- Jan 16: V2 15/15 Ready vs V1 2/15 cleared.

The same page tells a learner who did everything both 'every domain Ready' and '13 of 15 patterns not cleared'. The V1 pattern names also link to V1 day pages.
- Suggested fix: Delete the Pattern readiness panel and the unitReadiness/PLAN_UNITS imports from progress-view. Replace it with a course Units summary from useCourse().statuses: counts of ready, practising, gate-blocked and locked units, each unit linking to its Road map row.
- Verifier: The structural claim holds. components/progress-view.tsx:63-67 renders <ReadinessReport /> ('Feb 1 readiness', with domains from lib/course/readiness.ts:26-59 built on V2 unit and gate states) whenever today >= COURSE_START (2026-10-26). The same page also always renders the V1 'Pattern readiness' panel (lines 168-199). That panel is fed by unitReadiness(PLAN_UNITS, PLAN_DAYS, attempts) at line 47, and lib/progress-90.ts:63-72 defines 'cleared' as every non-optional V1 PLAN_DAYS ladder rep being passed. Its pattern names link to V1 day pages (`href={`/day/${u.start}`}`, line 180). §9 names 'old pattern readiness' outright as a legacy concept that 'creates two competing models of progress', and §26 says 'There should not be contradictory systems.' The V1 'Checkpoints' panel (line 49, checkpointStatus with a 'Patterns cleared' row) uses the same V1 metric, so the contradiction shows up twice.

The auditor's simulated numbers are wrong at the end of the course. I ran a throwaway script (since deleted) that marked every V2 unitPath rep for all UNITS as passed and called unitReadiness. Result: 13 of 15 V1 patterns cleared, not 2 of 15. Only 'Hashing 25/33' and 'Strings + two pointers 42/46' stay uncleared; the others reach 100%, e.g. Sliding window 25/25 and DP 31/31. So the learner who finishes everything sees 'every domain Ready' next to 2 patterns (Hashing; Strings + two pointers) that can never clear through V2 work. They do not see '13 of 15 not cleared'. I did not reproduce the mid-course dates (Nov 14 and Dec 12). Because unitReadiness ignores attempt dates and the V1 ladder order differs from V2 unit order, gaps mid-course are plausible, but the exact figures are unverified. Corrected: components/progress-view.tsx shows two competing readiness models on the Progress page after COURSE_START (2026-10-26). The first is V2 'Feb 1 readiness' (ReadinessReport, lines 63-67, domains from lib/course/readiness.ts:26-59). The second is V1 'Pattern readiness' (lines 168-199, unitReadiness at line 47, 'cleared' = every V1 PLAN_DAYS ladder rep passed per lib/progress-90.ts:63-72). The V1 Checkpoints 'Patterns cleared' row (line 49) repeats the V1 metric, and pattern names link to V1 /day/ pages (line 180). This is the exact legacy concept §9 says must be replaced and the kind of contradiction §26 forbids.

Corrected numbers: a learner who passes every V2 unit path rep ends with V1 showing 13/15 patterns cleared, not 2/15. Hashing (25/33) and Strings + two pointers (42/46) can never clear through V2 path work, so the page shows Hashing domain 'Ready' alongside the Hashing pattern 'not cleared'. The mid-course figures (Nov 14, Dec 12) were not reproduced and may be overstated.

### 3. [CRITICAL] The V1 'Checkpoints' panel (Day 30/60/90) fails a learner who did everything the course asked on every row, and sets mock quotas the course forbids — CONFIRMED (severity keep)
- Spec: §9 (old checkpoint logic); §2 principles 10, 12; §25
- Evidence: data/program-90day.ts:112-114 `{ date: '2026-11-10', label: 'Day 30', patterns: 5, problems: 18, unaided: 0.65, mocks: 5 }` … `mocks: 12` … `mocks: 22`; components/progress-view.tsx:49 `checkpointStatus(CHECKPOINTS, today, {…})` rendered at :140-164; lib/progress-90.ts:103 `const mocks = mockSummary(input.mocks, through).count + input.inAppMocks…`; lib/course/readiness.ts:120-123 mockPolicy (green 2, yellow ≤1, red 0)
- Detail: The checkpoint dates (Nov 10, Dec 10, Jan 9) are days 30/60/90 of the old V1 plan, which fall in course weeks 3, 7 and 11. They are not V2 milestones. V2's checkpoint is Feb 1, and mocks open only in Week 14 (Jan 25) and only on a green or yellow transfer grade.

For a simulated learner who passed every V2 path rep and cleared every gate, every row fails at every checkpoint:
- Day 30: patterns 0/5, problems 6/18, unaided -/65%, mocks 0/5.
- Day 90: patterns 1/15, problems 25/52, unaided -/80%, mocks 0/22.

The V1 problem quotas are also higher than the course's own LeetCode targets (10 through week 3, 25 through week 7, 40 through week 11, against 18/33/52). The page pushes for 22 mocks by Jan 9 while the course gates mocks behind readiness.
- Suggested fix: Remove the panel, the CHECKPOINTS import and the checkpointStatus call. Checkpoint progress belongs to the V2 gates (gatesCleared/weekGates per week, plus a course-wide 'gates cleared n/30') and the Feb 1 readiness report.
- Verifier: The main claim holds. data/program-90day.ts:111-115 defines CHECKPOINTS from the V1 plan. PLAN_START is '2026-10-12' and PLAN_END is '2027-01-09' (data/schedule-90.ts:28-29), so Nov 10, Dec 10 and Jan 9 are V1 days 30/60/90. Counted from COURSE_START '2026-10-26' (data/course/calendar.ts:9), they fall in course weeks 3, 7 and 11. They are not V2 milestones; V2's milestone is INTERVIEW_CHECKPOINT '2027-02-01'. components/progress-view.tsx:49 computes the panel and :140-164 renders it with no COURSE_START guard, so it shows next to the V2 ReadinessReport. Spec §9 (line 206) names this "old checkpoint logic" as a legacy concept that creates a second, competing progress model.

lib/progress-90.ts:94-114 scores patterns against the V1 PLAN_UNITS/PLAN_DAYS. It scores mocks as mockSummary(...).count plus in-app mocks against targets of 5/12/22. lib/course/readiness.ts:120-124 mockPolicy allows at most 2 mocks, only in Week 14, and only on a green transfer grade (1 on yellow). So the 22-mock quota contradicts the course.

I simulated a learner who passed every V2 unitPath rep and every gate-pool variant, each in its unit's week, using a throwaway repo-alias script that has since been deleted. Their checkpointStatus output:
- Day 30 (as of Nov 10): patterns 1/5, problems 3/18, unaided —/65%, mocks 0/5.
- Day 60 (as of Dec 10): patterns 6/10, problems 14/33, unaided —/75%, mocks 0/12.
- Day 90 (as of Jan 9): patterns 12/15, problems 25/52, unaided —/80%, mocks 0/22.
Every row fails at every checkpoint, which confirms the core of the claim. Some of the auditor's specific numbers are wrong, though, as listed in correctedDetail. Corrected: Confirmed: the Progress page always renders the V1 Checkpoints panel (components/progress-view.tsx:49, 140-164), including after COURSE_START. Its dates and targets come from the V1 plan (data/program-90day.ts:111-115; PLAN_START 2026-10-12 in data/schedule-90.ts:28), and lib/progress-90.ts:94-114 scores it against V1 PLAN_UNITS. A learner who passes every V2 path rep and gate variant on schedule still fails every row at every checkpoint. Simulated results:
- Day 30: patterns 1/5 (the claim said 0/5), problems 3/18 with nothing in the solve log (the claim said 6/18), unaided —, mocks 0/5.
- Day 60: patterns 6/10, problems 14/33, unaided —, mocks 0/12.
- Day 90: patterns 12/15 (the claim said 1/15), problems 25/52 (matches), unaided —, mocks 0/22.

Two caveats. First, the unaided row reads "—" only when nothing is in the solve log. A learner who logs re-solves could pass that row, so "every row fails" is certain only for the patterns, problems and mocks rows. Second, the V2 per-unit LeetCode targets (UNITS[].targets) add up to 9 through week 3, 21 through week 7 and 34 through week 11. That is lower than 18/33/52, but it is not the exact 10/25/40 the claim gave.

The mock targets (5/12/22) contradict mockPolicy (lib/course/readiness.ts:120-124), which allows at most 2 mocks, only in Week 14, and only on a green grade (1 on yellow). Severity stays critical: the panel tells an on-track learner they are failing, and §9 explicitly lists old checkpoint logic as legacy.

### 4. [CRITICAL] Feb 1 readiness says 'On track: Output, checkpoints and independence are where the plan needs them' while the current week is Off track — CONFIRMED (severity keep)
- Spec: §26 (each level derives from the level below); §11 readiness principles; principle 12; master spec §38
- Evidence: components/use-course-day.ts:34 `const finished = Array.from({ length: Math.max(0, courseWeekOf(today) - 1) }, (_, i) => weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status)`; lib/course/readiness.ts:148 `const lastFinishedWeek = weekStatuses.length ? weekStatuses[weekStatuses.length - 1] : undefined`; lib/course/readiness.ts:157 `if (!why.length) why.push('Output, checkpoints and independence are where the plan needs them.')`; components/course/course-dashboard.tsx:72-75 WeekCard + ReadinessCard side by side; components/course/course-cards.tsx:107 `{r.why[0]}`; components/course/readiness-report.tsx:33-39 (same on Progress)
- Detail: Readiness only looks at finished weeks, so the current week's shortfall never affects the track. Master spec §38 says ON TRACK requires that 'required weekly output is being met/recoverable'.

Computed case: weeks 1-2 complete, and on Wednesday of week 3 (Nov 11) nothing done this week yet. The WeekCard says 'off-track' (0/75, 30 behind), while Feb 1 readiness says 'on-track' with the explanation quoted in the title, shown right next to it on Today. Progress has no current-week card, so there the learner sees only the 'On track' claim. Labs are not an input to readiness at all.
- Suggested fix: Pass the current week's WeekProgress (including labs and gates) into readiness(). Treat a current 'recoverable' week as at-risk and a current 'off-track' week as at-risk or off-track, per §38. Build the why text from the real inputs (e.g. 'This week: 0 / 75 by Wednesday, 30 behind'). Only show 'Output … where the plan needs them' when both the current week and last week are on track.
- Verifier: I traced the code and it holds up. In components/use-course-day.ts:34, `finished` is built only from weeks 1..courseWeekOf(today)-1, and those calls pass no labs or gates `extra`. In lib/course/readiness.ts:141-157, the track uses only behindWeeks (the curriculum frontier), gate-blocked unit count, the status of the last finished week (line 148) and recentAssistance. The current week's progress is never passed in. Computed case: COURSE_START is 2026-10-26, so week 3 starts Mon Nov 9. On Wed Nov 11 the week-3 training days are Mon to Fri, with no holidays. dailyTarget(3)=15, so the week target is 75, expectedByNow is 2×15=30 and done is 0. Shortfall 30 > rate 15, so weekProgress returns 'off-track' (week-status.ts:73). If weeks 1-2 are complete, finished = [on-track, on-track]. The frontier is a week-3 unit, so behindWeeks=0, blocked=0 and assistance is 0. Readiness is therefore 'on-track' with why[0] = 'Output, checkpoints and independence are where the plan needs them.' course-dashboard.tsx:72-75 renders WeekCard and ReadinessCard side by side. ReadinessCard (course-cards.tsx:107) shows r.why[0], and readiness-report.tsx:33-39 shows the same on Progress. The Progress report lists only finished weeks (`WEEKS.filter((w) => w.number < current)`), so it has no current-week card. Labs: the finished-week weekProgress calls in use-course-day.ts:34 omit labsDone/labsRequired, so a finished week with a missing required lab still counts as on-track for readiness. Gates reach readiness only through unit 'gate-blocked' state. This breaks §26 ('each level should derive from the level below… no contradictory systems'). It also breaks master spec §38, where ON TRACK requires weekly output 'met/recoverable', and the master acceptance rule 'no "on track" when evidence says off track'. The on-track label and its explanation sentence are untruthful next to an off-track week card, so critical stands. Corrected: The claim is accurate, with one refinement about what the correct readiness state would be. Under master spec §38, readiness OFF TRACK is reserved for 'required output remains unfinished entering the next week'. A mid-week shortfall like 30 behind on Wednesday, with three training days and a Saturday left, is a 'recoverable output shortfall', which §38 lists under AT RISK. So the expected readiness here is at-risk, not off-track. The defect is that readiness.ts:141-157 never reads the current week's WeekProgress. A current week that is 'recoverable' or 'off-track' still yields 'on-track' plus the line 'Output, checkpoints and independence are where the plan needs them.' (readiness.ts:157). That is shown next to the off-track WeekCard on Today (course-dashboard.tsx:73-74) and alone on Progress, whose readiness-report.tsx only summarises finished weeks. Separately, labs are not a readiness input. use-course-day.ts:34 calls weekProgress without labs or gates extras for finished weeks, so even a finished week with a missing required lab counts as on-track. Gates reach readiness only through unit-level 'gate-blocked' state (readiness.ts:147).

### 5. [CRITICAL] Road to Ready marks a week 'Complete' from unit states alone, e.g. 'COMPLETE 27/50' while Progress says that week finished OFF TRACK — CONFIRMED (severity keep)
- Spec: §7 week completion; §8 acceptance; §26; principle 12
- Evidence: components/course/road-map.tsx:24 `if (units.length && units.every((u) => u.state === 'ready' || u.state === 'maintenance')) return 'complete'`; components/course/road-map.tsx:78-81 shows `{wp.done}/{w.targetProblems}` under the 'Complete' label; components/course/readiness-report.tsx:90 `const complete = p.done >= p.target && labs.filter((x) => !x.l.optional).every((x) => x.done) && gates.every((g) => g.cleared)`; lib/course/routing.ts:154 `const ready = liveGates.length ? gatesCleared : pathDone`
- Detail: Week completion is defined three different ways:
- Road map: every unit is ready. A gated unit counts as ready as soon as its gates clear; output, required labs and target problems are ignored.
- Progress 'Weeks so far': output ≥ target, plus required labs, plus live gates.
- Status badge: output pace only.

Simulated case, realistic for this user because their October history puts the Week 1 units straight into placement: 23 V1 reps passed in October, then in Week 1 only the gateless paths plus 8 gate passes (27 credits). The Plan shows Week 1 'COMPLETE' with '27/50'. Progress 'Weeks so far' shows 'Week 1 · Foundations', OFF TRACK, 27/50, 0 of 5 training days complete, both builds '—'.

The reverse also happens: a learner at 60/60 with both labs done stays 'Active' on the Plan until every unit's path and gates are done (the Week 2 path is 197 reps plus 11 gate passes against a target of 60).
- Suggested fix: Add one exported weekCompletion(week, today, {credits, labs, gates, targets}) to lib/course/week-status.ts and use it for the Today WeekCard, the Progress week summaries and the Road map. Road map 'complete' should follow that contract, with unit readiness shown separately as 'units ready n/m'. Add a unit test that the three surfaces agree.
- Verifier: I checked the code and the central claim holds. In components/course/road-map.tsx:23-31, weekState() decides 'complete' from unit states alone: `if (units.length && units.every((u) => u.state === 'ready' || u.state === 'maintenance')) return 'complete'`. It never looks at weekProgress, labs or the target problem count. Lines 78-81 still print `{wp.done}/{w.targetProblems}` whenever wp.done > 0, so a 'Complete' week can show a count below its target.

A unit's 'ready' state comes from lib/course/routing.ts:154, `const ready = liveGates.length ? gatesCleared : pathDone`:
- A gated unit is ready once its live gates clear, whatever its path progress or labs. Week 1 has gated units at data/course/units.ts:65, 80 and 95.
- A gateless unit is ready only once its whole path is passed (units.ts:50, 110 and 172 have no gates).

The Progress page uses a different rule. components/course/readiness-report.tsx (about line 90) says `p.done >= p.target && required labs done && every live gate cleared`. weekProgress's status (lib/course/week-status.ts) uses output pace, labs and gates instead. So the three displays can disagree in both directions:
- The Plan can say 'Complete' with output below target and labs not done.
- A learner who met the output target and finished the labs stays 'Active' or 'Repair' on the Plan until every gated unit's gates clear and every gateless unit's full path is done.

The spec requires week completion to mean output, required labs, checkpoints and target problems (REPS_2_1_SPEC.md:170). It also says Reps 'must truthfully mark the week complete', with no hidden backlog (line 200). The Road map breaks both rules, so critical is justified because the product shows an untruthful 'Complete'. I did not re-run the exact numbers in the scenario (27/50, a 197-rep Week 2 path, 11 gate passes). The code paths that would produce them are as described. Corrected: The claim is accurate. One refinement: on the Road map a week is 'complete' only when every unit in it is ready or maintenance. A gated unit is ready as soon as all its live gates clear (path, labs and output are ignored). A gateless unit is ready only when its full path is passed (routing.ts:154). Because of that, (a) a week can show 'Complete' with output below target and required labs missing, and (b) a week that meets output plus required labs can stay 'Active' or 'Repair' because of the full-path requirement on gateless units (e.g. data/course/units.ts:50, 110, 172) and any uncleared gates. Meanwhile readiness-report.tsx uses output ≥ target plus required labs plus live gates, and weekProgress status uses pace plus labs and gates. All three should use one shared week-completion function that matches spec line 170.

### 6. [CRITICAL] The 'Independent transfer' and 'Interview execution' readiness rows never use the evidence and contradict Today's Interview card — CONFIRMED (severity keep)
- Spec: §9 Readiness; §11; §24-25; §26; master spec §37 (mock evidence)
- Evidence: components/use-course-day.ts:40 `const ready = readiness(course.statuses, finished, ev, today)` (no `extra`); lib/course/readiness.ts:158 `const transfer: DomainStatus = extra.transferGrade ? … : week >= 13 ? 'building' : 'not-tested'`; lib/course/readiness.ts:159 `const interview: DomainStatus = (extra.mocksDone ?? 0) > 0 ? 'developing' : 'not-tested'`; components/course/readiness-report.tsx:55,60 fixed text 'Week 13: unlabeled problems, cold.' / 'Week 14: timed problems and mocks, once readiness allows.'; components/course/course-cards.tsx:139-142 InterviewCard computes transferGrade(…) and program.mocks.completed
- Detail: readiness() is called exactly once in the app (checked with grep) and never receives transferGrade or mocksDone. So on Progress, 'Independent transfer' reads 'Not tested yet' until Jan 18 and 'Building' after that, whatever the transfer bank shows, and 'Interview execution' reads 'Not tested yet' even after both Week 14 mocks.

Meanwhile Today, from week 13 on, shows the computed grade (Green/Yellow/Red) and 'N of M unlabeled problems solved independently'. The final Feb 1 report, the key deliverable, would say 'Interview execution: NOT TESTED YET' after two mocks. These two rows also show fixed text instead of explaining why they have their status.
- Suggested fix: In useCourseDay, compute transferGrade(attempts, EXERCISE_BY_ID, the c13-transfer ids) and one mocks count, and pass { transferGrade, mocksDone } to readiness(). Build the explanations from the numbers (e.g. '7 of 10 unlabeled solved cold; 6 full problems'). Have InterviewCard read the same object so both surfaces use one source.
- Verifier: The claim holds. The `readiness()` in lib/course/readiness.ts:141 takes `extra: { transferGrade?, mocksDone? } = {}`, but its only caller in the app is components/use-course-day.ts:40 `readiness(course.statuses, finished, ev, today)`, which passes no `extra`. The other `readiness(` calls (use-targets.ts, rep-workspace.tsx, training-state.ts) are a different function from lib/bridges.ts.

Because no `extra` is passed, line 158 always takes the fallback: `week >= 13 ? 'building' : 'not-tested'`. COURSE_START is 2026-10-26, so week 13 starts 2027-01-18. Line 159 always returns 'not-tested'.

Both rows are rendered from these values in two places:
- the Today ReadinessCard (course-cards.tsx:117,121)
- the Progress report (readiness-report.tsx:54,59). Its explanations are fixed strings at lines 55 and 60.

Meanwhile InterviewCard (course-cards.tsx:139-142) computes `transferGrade(...)` and `program.mocks.completed` on its own. course-dashboard.tsx:74 and :78 render it on the same Today dashboard as ReadinessCard, so the contradiction shows inside Today itself, not only between Progress and Today.

On Feb 1, courseWeekOf returns 15. Transfer would read 'Building' and Interview execution 'Not tested yet', even after mocks have been done.

finalDecision (line 166) uses the grade and mocksDone passed in directly, so the Ready / Ready-with-gaps verdict itself is computed from real evidence. Only the two rows and their explanations are wrong. Corrected: The claim is accurate, with two clarifications.

1. The contradiction is worse than claimed. Today's own ReadinessCard (course-cards.tsx:117-121) shows the stale `r.transfer`/`r.interview`. course-dashboard.tsx:74/78 renders it next to InterviewCard, which shows the real Green/Yellow/Red grade and the number of mocks done.

2. finalDecision (readiness.ts:166) is called with the real `t.grade` and `mocksDone`, so the final verdict is not corrupted. Only the 'Independent transfer' and 'Interview execution' rows are wrong:
- Transfer reads 'Not tested yet' until 2027-01-18, then 'Building'.
- Interview reads 'Not tested yet' throughout.
- Both rows show fixed explanation text (readiness-report.tsx:55,60).

Fix: compute transferGrade and program.mocks.completed in useCourseDay, pass them as `extra`, and make the explanation text reflect the evidence.

### 7. [CRITICAL] The cold-evidence grid labels non-cold passes 'Cold, independent', hides retrieval, and counts each problem from an arbitrary pass — CONFIRMED (severity keep)
- Spec: §9 Cold evidence; §11
- Evidence: lib/course/readiness.ts:84 `coldIndependent: counts['cold-independent'] + counts.independent + counts.retrieval,`; lib/course/readiness.ts:76-78 `if (!a.passed || !a.completedAt || seen.has(a.exerciseId) || !full(…)) continue; seen.add(a.exerciseId); counts[masteryEvidence(a, attempts)]++`; components/course/readiness-report.tsx:66-69 four tiles 'Cold, independent' / 'Self-corrected' / 'Assisted' / 'Rebuilt after a solution'; lib/storage/sync.ts:101-103 attempts loaded via local getAll (keyPath 'id', lib/storage/local.ts:19), ids are crypto.randomUUID (lib/sessions.ts:13-14, components/rep/rep-workspace.tsx:392)
- Detail: §11 explicitly forbids labelling independent + retrieval + cold-independent as 'Cold independent'. Here a first-try capstone pass (first exposure, not cold) is counted as 'Cold, independent', and retrieval and plain independent passes are never shown on their own.

Only the first pass in array order is counted for each problem. After a reload the array is in attempt-id (UUID) order, so which pass counts is effectively random. Computed: the same two attempts on cap-contains-duplicate (assisted on Nov 2, clean and cold on Nov 20) give {assisted:1, coldIndependent:0} in one order and {coldIndependent:1, assisted:0} in the other. The report can change on reload with no new work, and later stronger evidence does not reliably upgrade it.
- Suggested fix: Have evidenceSummary return all six categories separately (cold-independent, independent, self-corrected, retrieval, assisted, reconstructed) and render six tiles. For each problem, sort passes by completedAt and count the strongest (or latest) one, using an explicit ranking. Add a test that the order of the input does not change the summary.
- Verifier: I checked every part of the claim against the code and it holds.

1. **The 'Cold, independent' tile merges three categories.** lib/course/readiness.ts:84 sets `coldIndependent: counts['cold-independent'] + counts.independent + counts.retrieval`. In credit.ts:59, masteryEvidence returns 'independent' whenever `retrievalType !== 'cold'`, so a first-exposure pass is counted as 'Cold, independent'. readiness-report.tsx:66-69 shows only four tiles. Retrieval and independent never appear on their own, and EvidenceSummary (readiness.ts:61-68) has no field for either. §11 (spec line 245) forbids exactly this merge and requires all six categories to be tracked separately.

2. **Only one pass per problem is counted, and it is whichever comes first in the array.** readiness.ts:75-79 skips any exerciseId already in `seen`. It does not sort and does not take the strongest evidence. The array comes from use-course-day.ts:39, then useReps, then repo.attempts(), then engine.all('attempts') (sync.ts:56-59). That function returns the values of a Map in insertion order. On reload, loadCached (sync.ts:101-103) fills the Map from IndexedDB getAll on a store with keyPath 'id' (local.ts:19). getAll returns rows in key order. The ids come from newId() = crypto.randomUUID() (sessions.ts:13-14, rep-workspace.tsx:393). So after a reload the order is effectively random.

3. **The report can change and is not reliably upgraded.** Inside a single session the Map keeps insertion order, which is chronological, so the earliest pass is counted. That anchors the report to the first assisted result, which §11 explicitly forbids. After a reload the order is UUID order, so the counts can flip between {assisted:1} and {coldIndependent:1} with no new work. I did not rerun the auditor's numbers. The code path makes the two outcomes they describe the only possible ones.

**Severity: keep as critical.** The tile tells the learner they have cold evidence they do not have, and the counts can change on reload without new work. That makes the report untruthful. Corrected: The claim is accurate. Two details sharpen it.

First, during a single session (before any reload) the Map keeps insertion order, which is chronological. So the earliest pass is always the one counted. That breaks §11's requirement that later stronger evidence must upgrade the report: an assisted pass followed by a cold clean pass stays 'assisted'.

Second, the arbitrary ordering appears only after a reload. Then the attempts Map is filled from IndexedDB getAll in UUID key order (lib/storage/sync.ts:101-103, lib/storage/local.ts:19).

A fix needs to:
- add separate independent, cold-independent and retrieval fields to EvidenceSummary (readiness.ts:61-68) and to the tiles (readiness-report.tsx:66-69);
- for each problem, choose the strongest evidence across all of its passes, or the latest pass by completedAt, rather than the first in array order (readiness.ts:75-79).

### 8. [CRITICAL] The 'Problems done' stat counts logged failures and capstone passes with the solution shown as 'solved' — CONFIRMED (severity keep)
- Spec: §9; §10; principles 6, 12
- Evidence: lib/progress-90.ts:78 `for (const s of solves) if (s.lc && (!through || s.date <= through)) lc.add(s.lc)` (no result filter); lib/progress-90.ts:79 `for (const a of attempts) if (a.passed && a.completedAt && capstoneNumber[a.exerciseId] …)` (solutionViewed not excluded); components/progress-view.tsx:72 `sub="LeetCode problems, solved at least once"`; components/solve-log-view.tsx:199 `<option value="failed">Failed</option>`
- Detail: Computed: one 'Failed' log of LC 1 plus one pass of cap-contains-duplicate with the solution shown gives problemsSolved = 2. The same function feeds the V1 checkpoint 'Problems done' rows.

The rest of the stat row is also old LeetCode-tracker data:
- 'Target conversion' measures the V1 bridge-ladder TARGETS (data/problem-bridges.ts:90-95, built from PLAN_UNITS).
- 'Re-solves unaided' has a V1 label but is fed by the V2 re-solve kinds in lib/course/resolves.ts:15-20.
- Suggested fix: Remove 'Problems done' and 'Target conversion' from Progress. If a count of outside problems is kept as secondary telemetry, count only unaided and hinted entries and exclude passes with the solution shown, matching lib/course/credit.ts. Move 'Re-solves unaided' into the cold-evidence block as 'Outside re-solves: x of y unaided'.
- Verifier: Confirmed by reading the code. lib/progress-90.ts:76-80 `problemsSolved` adds every solve-log entry that has an `lc` (`for (const s of solves) if (s.lc && (!through || s.date <= through)) lc.add(s.lc)`). It never checks `s.result`, even though SolveResult is 'unaided' | 'hinted' | 'failed' (lib/solve-log.ts:12) and the form offers Failed (components/solve-log-view.tsx:199). For capstone attempts the only test is `a.passed && a.completedAt`, with no `!a.solutionViewed`. Other parts of the code do exclude solution-viewed passes: lib/progress.ts:17 passedSet (for cleanPass exercises), lib/pacing.ts:262 and lib/session-planner.ts:115. The solve-log view also turns that same capstone pass into a 'failed' row (`a.solutionViewed ? 'failed' : ...`, components/solve-log-view.tsx:91). So Reps calls the same event 'Failed' on the Solve log page and counts it under 'LeetCode problems, solved at least once' on the Progress page (components/progress-view.tsx:72). Worked example: one 'failed' log of LC 1 plus one passed attempt of cap-contains-duplicate with solutionViewed=true gives a set of size 2, so problemsSolved = 2. The same function feeds the checkpoint 'Problems done' row (lib/progress-90.ts:101 and :110), where it can mark a target as met. This breaks principle 12 (truthful progress) and principle 6 (assistance must not look like independence), and it contradicts the §10 credit rule that a viewed solution does not qualify. The stat row has no COURSE_START gate (progress-view.tsx:69-75), so V2 users see it too. Critical is the right severity. The side claims hold. 'Target conversion' comes from useTargets over TARGETS, which is built from PLAN_UNITS (data/problem-bridges.ts:90-95), so it is V1 90-day bridge-ladder data, which §9 says to replace. 'Re-solves unaided' uses unaidedRate (lib/solve-log.ts:95-99) over the kinds review1/review2/review3/redo. The V2 course scheduler in lib/course/resolves.ts:15-20 reuses exactly those kinds and ids. So 'fed by V2 kinds' is accurate, but these were also the V1 kinds and are shared, not new to V2. That is a legacy-presentation problem (major or minor under §9), not a truthfulness bug. One more point: problemsSolved also counts 'hinted' entries. Under §10 a hinted solve may still qualify as assisted evidence, so counting it is defensible as long as the label does not suggest the solve was unaided. Corrected: The claim is accurate. lib/progress-90.ts:78 counts every logged LC entry, failed ones included, and :79 counts capstone passes made with the solution shown. Components/solve-log-view.tsx:91 itself labels those capstone passes 'failed', so the Progress 'Problems done' figure (components/progress-view.tsx:72) and the checkpoint 'Problems done' rows (lib/progress-90.ts:101,110) overstate what was solved. One nuance on the side claims: 'Re-solves unaided' (lib/solve-log.ts:95-99) uses review1/2/3/redo, kinds that V1 and the V2 course (lib/course/resolves.ts:15-20) share. It is a legacy-label and §9 hierarchy issue, not a correctness bug. 'Target conversion' really is V1 PLAN_UNITS bridge-target data (data/problem-bridges.ts:90-95) and should be replaced under §9.

### 9. [CRITICAL] The header progress rail and '%' (shown on Progress and Plan) measure the V1 calendar: 3% after a perfect Week 1, 89% after finishing all 14 weeks — CONFIRMED (severity keep)
- Spec: §26; §9 Course progress; principle 12
- Evidence: components/header.tsx:55 `const program = useMemo(() => programProgress(DAYS, attempts), [attempts])`; components/header.tsx:89 `{pct}%<span className="sr-only"> of the whole program complete</span>`; components/header.tsx:109 `<ProgramProgress progress={program} …/>`; data/curriculum.ts:215-216 'the October sprint (Oct 2–11) followed by the 90-day ladder plan (Oct 12 → Jan 9)'; data/curriculum.ts:228-229 course content is 'outside the 90-day calendar'
- Detail: The rail counts the required reps of the V1 October sprint and 90-day plan (716 reps). Of the 65 reps in the Week 1 unit paths, only 23 are in the rail; none of the 16 Week 1 gate reps and none of the 48 Week 13 transfer reps count. A learner with no October history who completes Week 1 perfectly sees 3%; one who completes every unit path and gate in all 14 weeks sees 89%. Meanwhile the Plan says 'X of 950 qualifying problems'. That makes a third progress model, on every page, including V1 day tooltips and toasts.
- Suggested fix: From COURSE_START, drive the rail from course credits (cd.total / COURSE_TARGET) with markers at each week's target, or hide it. Keep programProgress only for dates before the course.
- Verifier: The core claim holds, but one of its numbers is wrong. In components/header.tsx:55, `programProgress(DAYS, attempts)` is computed from DAYS. data/curriculum.ts:215-216 defines DAYS as 'the October sprint (Oct 2–11) followed by the 90-day ladder plan (Oct 12 → Jan 9)': 100 days running from 2026-10-02 to 2027-01-09. lib/progress.ts:287-299 sets the denominator to every non-optional rep across those days, which comes to 716. Its docstring still says 'the whole Oct 2 – Oct 11 curriculum', so even the comment is stale. The 14-week course runs from COURSE_START 2026-10-26 to COURSE_END 2027-01-31 (data/course/calendar.ts) and is never consulted.

I checked the numbers with a throwaway script that imports the repo modules; it has since been deleted. A perfect Week 1 means 65 unit-path reps, of which 23 are in the rail, plus 16 gate-pool reps, of which 0 are in the rail. That gives 23/716 = 3%, as claimed. Week 13 has 48 path reps and none of them are in the rail, also as claimed.

The '89% after finishing all 14 weeks' figure is wrong. Completing every unit path alone gives 656/716 = 91.6%, shown as 92%. Paths plus the minimum clean passes per gate give about 92–92.5%. Paths plus every gate-pool variant give 667/716 = 93%. The display rounds with Math.round (header.tsx:57), so the rail never reaches 100% for a learner who completes the whole V2 course. When the bar is full, the toast in components/program-progress.tsx says 'Every rep in the plan is done.' Each day's toast is a V1 calendar date ('${shortDate(day.date)} complete · ${day.short}'), and the rail is described as 'how far through the calendar (the October sprint, then the 90-day ladder plan)' (program-progress.tsx:7-9).

The scope is slightly understated. The header is rendered from app/layout.tsx:22 on every page except /demo, not only on Progress and Plan. Plan's RoadMap (components/course/road-map.tsx:52) separately shows '{totalDone} of {COURSE_TARGET} qualifying problems', so there really are competing progress models side by side. This conflicts with spec principle 12 ('The product must be truthful about progress') and §9/§26 (course progress = qualifying problems / course target). Critical is the right severity. Corrected: The header '%' and the rail under it (components/header.tsx:55,88-90,109; lib/progress.ts:287-299; components/program-progress.tsx) measure the V1 calendar: 716 non-optional reps across the 100 DAYS from 2026-10-02 to 2027-01-09. They do not measure the V2 course (2026-10-26 to 2027-01-31, qualifying problems / COURSE_TARGET). Only 23 of the 65 Week 1 unit-path reps are in that denominator, along with 0 of the 16 Week 1 gate-pool reps and 0 of the 48 Week 13 transfer reps. A learner with no October history who completes Week 1 perfectly sees 3% (23/716).

Completing every unit path in all 14 weeks gives about 92% (656/716 = 91.6%). Adding the gate reps raises it to 92–93%, and passing every gate-pool variant gives 93% (667/716). It is not 89%, and in no case does it reach 100%, so the finale toast 'Every rep in the plan is done.' never fires for V2 work. Each day's toast names a V1 calendar date.

The header comes from app/layout.tsx and so appears on every non-demo page, not only Progress and Plan. Plan's RoadMap meanwhile shows 'X of COURSE_TARGET qualifying problems' (components/course/road-map.tsx:52). This conflicts with principle 12 and §9/§26, and it is critical.

### 10. [MAJOR] Minutes are still the visual centre: the '90 days' heatmap and 'Time each week, against the plan' both run on the V1 calendar — CONFIRMED (severity keep)
- Spec: §9 (time only as optional telemetry; heatmap intensity = output); principle 4
- Evidence: components/progress-view.tsx:26-28 `/** Heat by minutes … */ const heat = (min: number, active: boolean) => (min >= 180 ? 4 : …)`; components/progress-view.tsx:90 'One square a day, darker for more minutes practiced.'; components/progress-view.tsx:97 `{PLAN_DAYS.map((d) => {`; components/progress-view.tsx:121-123 'Time each week, against the plan … Minutes in Reps plus minutes you logged on LeetCode.'; components/progress-view.tsx:54 `const currentWeek = PLAN_DAYS.find((d) => d.date === today)?.planWeek`; lib/progress-90.ts:55 `w.planned += blocksFor(d).reduce((n, b) => n + b.minutes, 0)`; data/program-90day.ts:52 Tuesday block C 'Mock'
- Detail: Two of the page's large panels are about minutes, and both use the V1 PLAN_DAYS (Oct 12 to Jan 9):
- Wrong week numbers: V1 'Wk 3' is course Week 1, so the chart highlights 'Wk 3' while the readiness report says Week 1.
- Stops early: the chart ends at V1 Wk 13 (course week 11). Weeks 12-14 (14 training days) never appear, and nothing is highlighted after Jan 9.
- Old plan as the target: 'planned' minutes are the V1 blocks, e.g. Nov 10 = New work 165 + Re-solves 15 + Mock 45 + Log 5, and 770-1430 planned minutes per week for course weeks 1-8, including mock time the course no longer has.
- Rest looks like missing work: V2 recovery Saturdays and Dec 26/31 look exactly like missed training days, while Nov 26-27 and Dec 24 (V2 training days) are outlined as 'off'.
- It rewards time, not output: more time spent failing gives a darker square than fast qualifying work. The subtitle still claims the page is 'from what you actually produced'.
- Suggested fix: Replace the heatmap with a course heatmap for Oct 26-Jan 31 (weekDates(1..14)), shaded by flameFor(credits[d], dailyTarget(week)) the way WeekStrip already does, with ☾ for rest and Saturday shown as optional. Link squares to the Road map week, or not at all. Move minutes into a collapsed 'Time (telemetry)' list per course week, with no plan marker.
- Verifier: I checked every cited line, and a throwaway script (since deleted) gave the numbers below. Both panels render on every date. Only the subtitle and the ReadinessReport depend on `today >= COURSE_START` (line 61, line 63).

- **Heatmap colour comes from minutes.** components/progress-view.tsx:26-28 sets `heat = (min, active) => (min >= 180 ? 4 : ...)`. The `min` comes from lib/progress-90.ts:22-26 `activityByDate`, which is Reps attempt duration (capped at 30 per attempt) plus LeetCode `s.minutes`. Line 90 says "darker for more minutes practiced", and lines 97-113 loop over `PLAN_DAYS`.
- **The weekly chart uses the V1 plan.** It is `weeklyTime(activity, PLAN_DAYS)` (line 46). The script shows `PLAN_DAYS` runs from 2026-10-12 to 2027-01-09 (90 days, V1 weeks 1-13). The V2 course runs from COURSE_START 2026-10-26 to COURSE_END 2027-01-31 (data/course/calendar.ts).
- **Week numbers are off by two.** `courseWeekOf` puts V1 Wk 3 at course week 1 and V1 Wk 13 at course week 11. Course weeks 12-14 (Jan 10-31) are not on the page. `currentWeek` (line 54) is undefined after Jan 9, so no week is highlighted.
- **Planned minutes are the V1 blocks.** They come from `blocksFor`, whose block C on Tuesdays is 'Mock'. Nov 10 gives New work 165, Re-solves 15, Mock 45, Log 5. Planned totals for course weeks 1-8 are 1125, 1130, 1375, 1430, 770, 1280, 1320, 1415, so the 770-1430 range is right.
- **Day types disagree.** V1 marks Nov 26, Nov 27 and Dec 24 as 'off' (drawn outlined), but V2 `dayType` makes them training days. V1 treats V2 recovery Saturdays (Oct 31 to Jan 9) and the V2 rest days Dec 26 and Dec 31 as working days. With no activity those render `HEAT[0]`, which looks the same as a missed training day.

Severity: §9 (spec line 206) names "90-day minute heatmaps, weekly time-vs-plan" as legacy, and line 219 requires heatmap intensity to be output, not minutes. Principle 4 (line 52) says hours are secondary telemetry. The page header also claims "from what you actually produced". So this is at least major as claimed. It arguably touches the critical "untruthful" bar because the week labels and rest days are wrong, but major is fair.

One addition: the same `PLAN_DAYS`/V1 dependency also drives the Streak and Days practiced stats (lines 51-52, 70-71) and checkpoints/unitReadiness (lines 47, 49). That goes beyond this claim but has the same root cause.

Already correct: ReadinessReport is mounted when the course is running (lines 63-67), and calendar.ts has a correct V2 `dayType`/`courseWeekOf` that could replace `PLAN_DAYS` here. Corrected: Confirmed as stated. One addition: Streak, Days practiced, checkpoints and unit readiness on the same page (components/progress-view.tsx:47-52, 70-71) also run on the V1 PLAN_DAYS calendar, which has the same off-day and week mismatches.

### 11. [MAJOR] Progress lacks the COURSE and WEEK levels: no course total, weeks completed, current week, units ready/blocked, or current-week output — CONFIRMED (severity keep)
- Spec: §9 Course progress, Weekly output; §26
- Evidence: components/course/readiness-report.tsx:25 `const finished = WEEKS.filter((w) => w.number < current)` (current week left out); components/progress-view.tsx has no reference to COURSE_TARGET, cd.total, course.statuses or cd.progress; components/course/road-map.tsx:51-53 `{totalDone} of {COURSE_TARGET} qualifying problems` (Plan only); components/course/course-cards.tsx:25-91 WeekCard (Today only)
- Detail: §9 asks Progress to show course progress (qualifying problems out of 950, weeks completed, current week, units ready, units blocked) and weekly output ('Week 5 · 54/75 · 1/2 builds · 2/4 checkpoints · ON TRACK'). Progress shows neither, only summaries of finished weeks. The data already exists in useCourseDay (total, progress, labs, weekGates, gatesCleared) and useCourse (statuses).
- Suggested fix: Start Progress with 'This week' (reusing the WeekCard data), then 'Course': cd.total / COURSE_TARGET, weeks completed n/14 using the single week-completion contract, the calendar week next to the week the learner has actually reached (frontier unit), and counts of units ready / in progress / in repair / locked from statuses. Put readiness after these.
- Verifier: I checked the claim against the code and it holds. One detail needs correcting. /progress (app/progress/page.tsx) renders only ProgressView (components/progress-view.tsx). ProgressView embeds ReadinessReport (line ~67, `{today >= COURSE_START && (<ReadinessReport />)}`) and then V1 widgets: the 90-day minute heatmap, weekly time against plan, CHECKPOINTS from program-90day, unitReadiness from PLAN_UNITS, and a working-day streak. Neither file refers to COURSE_TARGET or cd.total, and neither shows a count of weeks completed, the current week, or units ready or blocked.

The 'Problems done' stat is not the course total either: `problemsSolved(entries, attempts, CAPSTONE_NUMBER)`, labelled 'LeetCode problems, solved at least once', is not qualifying problems out of 950. The 'Pattern readiness' panel uses the old PLAN_UNITS model, not the course statuses, so it does not show units ready or blocked.

ReadinessReport limits its weekly summaries to past weeks with `const finished = WEEKS.filter((w) => w.number < current)` (readiness-report.tsx:25). The current week therefore never appears on Progress. The course total appears only on the Plan page, in road-map.tsx:51-53 (`{totalDone} of {COURSE_TARGET} qualifying problems`).

The correction: the claim says Progress shows "only summaries of finished weeks", as if no weekly-output data were there. In fact each finished-week card in ReadinessReport (lines ~85-121) already shows nearly the §9 weekly-output line for that week. It has `{p.done} / {p.target} qualifying problems`, build/lab ticks, checkpoint ticks, the WEEK_STATUS_LABEL status and a 'Week N complete' flag. So the weekly-output format exists for past weeks. What is missing is the current week (the most important one), weeks shown as counts ('1 / 2 builds', '2 / 4 checkpoints') rather than tick lists, and every course-level item (course total out of COURSE_TARGET, weeks completed, current week, units ready, units blocked). Major is the right severity, because §9 and the §26 COURSE and WEEK levels are not met on Progress. Corrected: The claim is accurate apart from one point. Progress (components/progress-view.tsx plus the embedded components/course/readiness-report.tsx) has no course-level section. It shows no qualifying total against COURSE_TARGET; the 'Problems done' stat is `problemsSolved(...)`, 'LeetCode problems, solved at least once'. It also shows no count of weeks completed, no current week, and no units ready or blocked; the 'Pattern readiness' panel uses the V1 PLAN_UNITS and unitReadiness, not course.statuses. It also shows no weekly output for the current week, because readiness-report.tsx:25 keeps only `w.number < current`.

The correction: Progress does already show the weekly-output format for finished weeks. The 'Weeks so far' cards in readiness-report.tsx (~lines 85-121) give `{p.done} / {p.target} qualifying problems`, build and checkpoint ticks, the WEEK_STATUS_LABEL status and a 'complete' flag. The fix is therefore to add the current week, show builds and checkpoints as counts, and add a course-level section. The weekly-output card logic can be reused rather than built from scratch. Severity stays major.

### 12. [MAJOR] Labs and building are missing from Progress and from readiness; there is no Software Building or Applied AI/FDE dimension — CONFIRMED (severity keep)
- Spec: §9 Labs/building and Readiness; §18
- Evidence: lib/course/readiness.ts:26-42 DOMAINS (15 foundation/DSA domains, nothing for building or AI); lib/course/readiness.ts:141 `readiness(statuses, weekStatuses, evidence, today, extra: { transferGrade?, mocksDone? })` (no lab input); data/course/types.ts:52-55 `aiFde?: boolean` / `optional?: boolean`, with aiFde read only by components/course/lab-view.tsx:39 (a label); components/course/readiness-report.tsx:88 labs appear only per finished week as ✓/—
- Detail: There are 23 labs: 22 required (lab-priority-queue is optional), of which 2 are AI/FDE (lab-support-router in W12, lab-fde-workflow in W13). That is 20 required junior SWE builds plus 2 AI/FDE builds. Progress never totals them, and readiness can say 'On track' with every lab skipped. Both AI labs also currently count as required for 'Weeks so far' completion (readiness-report.tsx:90 `!x.l.optional`), which §18 says must not hard-block a general SWE result.
- Suggested fix: Add a Labs block: 'Junior SWE builds x/20 · change requests x/20 · AI/FDE builds y/2', computed from LABS and labProgress. Add Software Building (required non-AI labs + change requests + design/review) and Applied AI/FDE (aiFde labs only, not blocking unless the target role needs it) as readiness dimensions, and group the 13 DSA domains under Core DSA.
- Verifier: I checked the claim against the code and it holds. lib/course/readiness.ts:26-42 defines 15 domains, all foundation or DSA, with nothing for software building or Applied AI/FDE. readiness() at line 141 takes `extra: { transferGrade?; mocksDone? }` and has no lab input. Its return value (`{ track, domains, transfer, interview, evidence, why }`) has no building or AI dimension, although spec §18 (lines 319-322) and §9 (lines 215-216) require both.

The count is right. There are 23 `id: 'lab-` entries: 4 in labs-w1w2, 12 in labs-w3w8 and 7 in labs-w9w13. Only lab-priority-queue is `optional: true` (labs-w9w13.ts:52). Only lab-support-router (W12, line 205) and lab-fde-workflow (W13, line 248) have `aiFde: true`. The only component that reads aiFde is lab-view.tsx:39, and it only uses it to show a label.

Progress has no lab totals. app/progress/page.tsx renders ProgressView, and components/progress-view.tsx shows stats for streak, days practiced, problems, re-solves and conversion, but none for labs. readiness-report.tsx:88-90 lists labs only inside each finished week's summary. Line 90 treats every non-optional lab as required for `complete`, so both AI/FDE labs block a week from counting as complete. That goes against §18's rule that AI must not be a hard blocker for a general SWE result.

One more path closes off any indirect effect. weekProgress() in lib/course/week-status.ts can drop a week from on-track to recoverable when a required lab is missing. But the finished-week statuses passed to readiness() are computed in components/use-course-day.ts:34 as `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status`, with no labsDone or labsRequired. So skipped labs never reach the readiness track, not even through last week's status. Only the current week's Today card (use-course-day.ts:32) passes lab counts. The claim that readiness can say "On track" with every lab skipped is therefore correct.

Already correct: lab progress tracking (lib/course/labs.ts labProgress/labKey), the per-week lab list on Today (course-cards.tsx:53-65, which marks optional labs), the current week's status dropping to recoverable when a required lab is missing (week-status.ts and use-course-day.ts:32), and the aiFde and optional flags in the data. Corrected: The claim is accurate, with one refinement. Readiness ignores labs entirely, including indirectly: components/use-course-day.ts:34 computes the finished-week statuses fed into readiness() with `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate)` and no lab counts. Labs count only toward the current week's status on Today (use-course-day.ts:32). There are 23 labs: 22 required plus lab-priority-queue, which is optional. Two of them are AI/FDE (lab-support-router in W12, lab-fde-workflow in W13). readiness-report.tsx:90 counts both AI/FDE labs as required for a week to show as complete.

### 13. [MAJOR] The week status never applies its lab/checkpoint rule in the UI, so finished weeks with 0/2 builds show 'ON TRACK' — CONFIRMED (severity keep)
- Spec: §7 week completion; §26
- Evidence: lib/course/week-status.ts:69 `const ended = today > dates[6]`; lib/course/week-status.ts:78 `if (ended && status === 'on-track' && ((extra.labsDone ?? 0) < labsRequired || …)) status = 'recoverable'`; components/course/readiness-report.tsx:87 `const p = weekProgress(w.number, weekDates(w.number)[6], cd.credits)` (evaluated on the Sunday, so ended = false, and no extra) with the badge at :97 `{WEEK_STATUS_LABEL[p.status]}`; components/use-course-day.ts:34 same call feeding readiness; lib/course/week-status.test.ts:42 tests the rule only as of the following Monday
- Detail: Computed for Week 3 with 75/75 output, labs 0/2 and gates 0/4. Evaluated as of its Sunday, which is how Progress and readiness evaluate it, the result is on-track with or without the labs/gates input. Only an evaluation on the following Monday with that input, which the UI never makes, gives 'recoverable'.

docs/reps-2.md:41 promises 'A missing lab or checkpoint means a finished week is not on track.' Instead the week summary's title says the week is not complete while its badge says ON TRACK, and readiness inherits the on-track status. Required target problems are not part of any week contract (§7).
- Suggested fix: Evaluate finished weeks as of the following Monday (or count the last day as ended), and pass labs, gates and required targets everywhere. Better: use the single weekCompletion contract from the Road map finding.
- Verifier: I read the cited code and the claim holds. In lib/course/week-status.ts:69, `const ended = today > dates[6]`, and weekDates (data/course/calendar.ts:64) returns 7 dates starting on Monday, so dates[6] is that week's Sunday. The lab/checkpoint downgrade at :78 runs only when `ended` is true and an `extra` object is passed.

There are four production callers, and none of them meets both conditions:
(1) components/use-course-day.ts:32 passes `extra`, but only for the current week, where today <= Sunday, so `ended` is always false.
(2) components/use-course-day.ts:34 `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status` evaluates each finished week on its own Sunday with no `extra`. That status feeds readiness() through `finished` (lib/course/readiness.ts:155 "Last week finished ...").
(3) components/course/readiness-report.tsx:87 makes the same Sunday call with no `extra`. The badge at :97 renders WEEK_STATUS_LABEL[p.status] ('On track', in uppercase CSS). At :90 the same component works out `complete` from labs and gates on its own, so the title can drop "complete" while the badge still says ON TRACK.
(4) components/course/road-map.tsx:62 `weekProgress(w.number, today, byDate)` passes no `extra`, so the rule cannot fire there either.

On Sunday a week with full output has shortfall 0 and gets 'on-track'. The only test of the rule (lib/course/week-status.test.ts:42-44) evaluates it on the following Monday, '2026-11-16', with `extra`, which is a combination no UI path uses. So the rule is dead code in the product. That contradicts docs/reps-2.md:41 ("A missing lab or checkpoint means a finished week is not on track") and the §7 week-completion contract, and it makes the readiness week summary and the readiness read misleading. I keep it at major, not critical: the labs and gates are still listed with ✓/— beside the badge, and the title does not claim the week is complete. Corrected: The claim is accurate. One thing to add: road-map.tsx:62 also calls weekProgress without `extra`. It evaluates with the real `today`, so `ended` is true for past weeks, but the lab/gate rule still cannot fire without `extra`. The one caller that passes `extra` (use-course-day.ts:32) only ever covers the current, unfinished week. So no UI path ever applies week-status.ts:78. Finished weeks are judged on output alone (use-course-day.ts:34 feeding readiness(), and readiness-report.tsx:87/97 for the badge).

### 14. [MAJOR] Road map 'Locked' and 'Active' follow the calendar and contradict the unit locks and the course queue — CONFIRMED (severity keep)
- Spec: §26; principle 9 (the calendar may slide, dependency order may not); master spec §32
- Evidence: components/course/road-map.tsx:27 `if (n <= current) return 'active'`; components/course/road-map.tsx:29 `if (n === current + 1 && units.some((u) => !u.locked)) return 'ready'`; components/course/road-map.tsx:30 `return 'locked'`; components/course/road-map.tsx:94 per unit `{u.locked ? `Locked · needs …` : UNIT_LABEL[u.state]}`; lib/course/routing.ts:206-207 the queue reaches up to the frontier week + 1
- Detail: Computed cases:
(a) Weeks 1-2 complete, Monday of week 3: weeks 5, 6 and 9 are badged 'Locked', although w5-binary-search, w5-linked-lists, w6-recursion and w9-heaps are unlocked and their own rows say 'Not started'.
(b) A learner ahead of schedule (weeks 1-5 done by Nov 6): Week 6 is badged 'Locked' while the course queue (Today) is already serving Week 6 reps.
(c) No attempts, Monday of week 6: weeks 1-6 are all 'Active' with flame styling, although every unit in weeks 3-6 is locked behind prerequisites.

Nothing marks where the learner actually is (the frontier unit) as opposed to the calendar week.
- Suggested fix: Derive the week state from dependencies and the completion contract: complete (contract met), repair (a gate is blocked), behind (calendar week passed, not complete), active (calendar week or frontier week), available (some unit unlocked), locked (every unit locked by prerequisites). Show 'You are here: Week N, unit X' from useCourse().current. e2e/course.spec.ts:53-54 keeps passing, because W3 is locked by prerequisites on day 1.
- Verifier: I checked the claim against the code and it holds. In components/course/road-map.tsx:23-31, weekState() uses only completion, repair and the calendar index `current = Math.max(1, courseWeekOf(today))` (line 42). Rule 1 is `if (n <= current) return 'active'`. Rule 2 is `if (n === current + 1 && units.some((u) => !u.locked)) return 'ready'`. Every other week falls through to `return 'locked'`. It never reads the unit locks except for week current+1, and it never reads the frontier. Meanwhile each unit row on line 94 uses the real `u.locked` from courseStatus (routing.ts:149-167, where blockedBy means prerequisites not ready or in maintenance). courseQueue (routing.ts:204-207) serves every unlocked unit up to frontier week + 1, where the frontier is the first unit that is not ready. Today uses that queue through components/use-course.ts. RoadMap is shown on the Plan page (components/plan-view.tsx:4). COURSE_START is 2026-10-26.

I recomputed the three cases.
(a) Weeks 1-2 ready, Monday of week 3, so current=3. Week 4 is 'Ready' because w4-stacks only needs w1-mutation-references. Weeks 5, 6 and 9 are badged 'Locked', yet w5-binary-search (needs w1-loop-control), w5-linked-lists (needs w1-mutation-references), w6-recursion (needs w1-state-while) and w9-heaps (needs w2-hashing) are all unlocked. Their rows show 'Not started'. Confirmed.
(b) Nov 6 is day 11, so current=2. Weeks 3-5 count as complete. Week 6 has n=6 > current+1, so it is badged 'Locked'. But the frontier is w6-fast-slow, so the horizon is 7, and the queue serves w6-fast-slow and w6-recursion, both unlocked. Confirmed.
(c) No attempts, Monday of week 6, so current=6. Weeks 1-6 are all 'active' with flame styling. Every unit in weeks 3-6 depends on week-1 units that have gates, or on w5-linked-lists, so they are all locked. Confirmed.

Nothing in RoadMap marks the frontier unit. This breaks the 'no contradictory systems' rule in §26 and principle 9, because the week badges follow the calendar while the locks and the queue follow dependency order. The severity stays major: it is a misleading progress display on the Plan page, but Today's routing itself stays correct. Corrected: The claim is accurate as written. A few details to add: the 'ready' state does check unit locks, but only for week current+1. In case (a), Week 4 shows 'Ready' and Weeks 5, 6 and 9 show 'Locked'. Today's actual routing (courseQueue in lib/course/routing.ts:204-236) does respect locks and the frontier, so the contradiction exists only on the Road to Ready display in the Plan page (components/plan-view.tsx imports RoadMap). The fix should derive the week badge from the unit statuses and the frontier, for example: active = the week holding the frontier unit or any unlocked unfinished unit; ready = some unit unlocked but untouched; locked = every unit locked. The calendar week should be a separate 'scheduled' marker.

### 15. [MAJOR] 'Weak skills' lists the lowest scores, not actionable weaknesses — CONFIRMED (severity keep)
- Spec: §9 Weak skills; principle 8
- Evidence: lib/progress-90.ts:123-125 `.filter((x) => x.m.status !== 'unseen').sort((a, b) => a.m.score - b.m.score).slice(0, limit)`; components/progress-view.tsx:203-205 'Weak skills, over the last week … Your lowest-scoring practiced skills'
- Detail: Computed for a learner with zero failures (every Week 1-3 path rep and gate passed clean): the panel still lists 6 'weak skills' (stack_push_pop, matching_pairs, binary_search, linked_list_traversal, grid_nested, interval_overlap). Each has score 27, 1 attempt, 0 failures and status 'introduced'; they are topics from future units that came up once in passing. Nothing connects the list to failed gates, repair reps or a next step; the only link goes to the skill page.
- Suggested fix: Build the list from course evidence: failed gates (the broken skills that overlap gate.skills, with the repair reps from GateStatus.repair and a 'Do repair' CTA), skills with mastery status 'weak' in units already reached, and recent assisted or reconstructed passes in reached units. Hide skills from units not yet taught, and give every row a call to action.
- Verifier: Confirmed. lib/progress-90.ts:119-131 `weakSkillsOverTime` maps every skill through computeSkillMastery, keeps only `status !== 'unseen'`, sorts ascending by `m.score` and takes the first 6. Nothing in it looks at failures, failed gates, repair state, staleness or a next action. components/progress-view.tsx:48 calls it with SKILL_IDS, and the panel at lines 201-236 shows "Your lowest-scoring practiced skills". Each row links only to /skills/{id}. In lib/mastery.ts:94-147 the score is 100 × accuracy × evidence, with evidence = 1 − exp(−Σweight·quality / 4) (EVIDENCE_SCALE = 4, line 67). So one clean attempt gives accuracy 1 but evidence of only about 0.27 at weight ~1.25, and the score lands near 27. Skills that were touched once in passing therefore score lowest, even with 0 failures, and fill the list ahead of skills with real failures. The 27 / 1 attempt / 0 failures figures in the claim match this formula. Spec §9 (planning/REPS_2_1_SPEC.md:217) says "Weak skills: only actionable weaknesses", so this materially fails a V2.1 requirement. Major is the right severity. Corrected: The claim is accurate. The root cause is in lib/mastery.ts:136 and :67: the score is scaled by an evidence factor (1 − exp(−evidence/4)). A skill seen once cleanly scores about 27, which is lower than many skills that actually have failures. Sorting by raw score (lib/progress-90.ts:124) therefore ranks under-practiced skills as weak instead of failing ones. A fix needs a filter based on failures or repair, such as failures > 0, recent failed gates, or a stale mastered skill. It also needs each row to link to the next repair rep, not just the skill page.

### 16. [MAJOR] Mastery and freshness are not clearly separated, and three freshness rules disagree — CONFIRMED (severity keep)
- Spec: §9 Mastery and freshness; master spec §33
- Evidence: components/course/readiness-report.tsx:47 `{d.stale && <span className="ml-1 font-normal normal-case text-faint">· stale</span>}`; lib/course/readiness.ts:51 `const stale = ready.length === us.length && us.some((u) => u.state === 'maintenance')`; lib/course/routing.ts:160-162 lastActive taken from any attempt (failures included), then `daysBefore(lastActive, ctx.today) > 14 ? 'maintenance' : 'ready'`; lib/training-state.ts:61 `FRESH_DAYS = [3, 6, 12, 21, 30]` used by Today's warm-ups
- Detail: The only freshness display is a faint '· stale' suffix on a domain row. Computed: after a perfect Week 1, foundations shows 'Ready' until Nov 13 and 'Ready · stale' from Nov 14 (15 days). Today's warm-ups, by contrast, treat a skill as stale after just 3 days if it has no clean cold rep. A failed attempt on a unit rep also restarts the 14-day clock, although freshness should come only from productive passes. Neither Progress nor Skills groups anything into MASTERED·FRESH / MASTERED·STALE / DEVELOPING.
- Suggested fix: Add a Mastery and freshness block with three groups taken from unit states (ready, maintenance, and learning/practising/gate-blocked). Use one freshness function, counting productive passes only, shared by routing, readiness and the session planner.
- Verifier: I checked every cited line and the claim holds. The REPS_2_1_SPEC.md §9 Progress hierarchy (line 213) requires Progress to "clearly separate MASTERED·FRESH, MASTERED·STALE, DEVELOPING", and master spec §33 asks for mastery and freshness to be shown separately. The code does neither.

- **Progress:** The only freshness signal is in components/course/readiness-report.tsx:47, a faint `· stale` suffix after the domain status label. Progress shows it through ReadinessReport (components/progress-view.tsx:65).
- **Skills:** components/skills-view.tsx groups by SKILL_GROUPS and shows score and status only. The Skills page has no fresh or stale grouping.
- **Unit freshness rule:** lib/course/routing.ts:160 builds `lastActive` from every attempt on the unit's path or gate pool, with no `passed` filter. Line 162, `daysBefore(lastActive, ctx.today) > 14 ? 'maintenance' : 'ready'`, then turns it into staleness. So a failed attempt restarts the 14-day clock.
- **Skill freshness rule:** Today's warm-ups use a different rule. lib/training-state.ts sets `FRESH_DAYS = [3, 6, 12, 21, 30]`, counted only from productive passes and indexed by the number of clean cold reps, so with no clean cold rep a skill goes stale after 3 days. It reaches Today through lib/session-planner.ts:152 (`freshnessOf(...) === 'stale'`).
- **Date check:** COURSE_START is 2026-10-26, so a Week 1 that ends Fri Oct 30 turns into `maintenance` (shown as "· stale") on Nov 14, 15 days later. That matches the claim. Corrected: There are two freshness rules, not three. The `stale` flag in lib/course/readiness.ts:51 is not a separate rule: it is true when every unit in the domain is ready or in maintenance and at least one is in `maintenance`, so it simply follows the 14-day rule in routing.ts:162. The two rules are:
- **Unit level** (routing.ts:160-162): a 14-day clock that restarts on any attempt, failed ones included.
- **Skill level** (training-state.ts `FRESH_DAYS`): counts only productive passes and grows with clean cold reps, from 3 days up to 30.

These two rules are inconsistent: they measure different things and use different signals. The failure-resets-the-clock bug is in routing.ts:160, where `lastActive` uses `ctx.attempts.filter(...)` with no `a.passed` check. The only freshness display is the faint `· stale` suffix after the domain status label in readiness-report.tsx:47. Neither Progress nor Skills groups anything into MASTERED·FRESH, MASTERED·STALE or DEVELOPING, so the spec's line 213 bullet under §9 (FIX 2: replace the V1 Progress experience) is not met. Major is the right severity.

### 17. [MAJOR] Progress links into V1 day pages that show the old pace forecast during the course — CONFIRMED (severity keep)
- Spec: §3 (Today is the single command centre); principle 13
- Evidence: components/progress-view.tsx:104 `href={`/day/${d.date}`}` (every heat square); components/progress-view.tsx:180 `<Link href={`/day/${u.start}`}`; components/day-view.tsx:20-21 `const pace = usePacing(); const day = pace.dayFor(date)`; components/use-pacing.ts:24-40 builds the V1 calendar with no COURSE_START branch
- Detail: Clicking today's square on Progress opens a V1 'today's stretch' page listing V1 sections and LeetCode items that differ from Today's course prescription. The learner gets a second, different answer to 'what do I do today'.
- Suggested fix: Remove these links along with the V1 panels, or point course-date squares to '/' or '/plan' (the week's row).
- Verifier: The claim holds. In components/progress-view.tsx the only COURSE_START branches are the subtitle (line 61) and the extra <ReadinessReport/> (lines 63-67). Every V1 section after them still renders unconditionally once the course is running: the "90 days" minute heatmap, Time each week, Checkpoints and Pattern readiness. That includes line 104 `href={`/day/${d.date}`}` on every PLAN_DAYS square and line 180 `<Link href={`/day/${u.start}`}`. PLAN_START is '2026-10-12' (data/schedule-90.ts:28) and COURSE_START is '2026-10-26' (data/course/calendar.ts:9), so the 90 plan days cover the course dates, and today's square is a live link while the course runs. app/day/[date]/page.tsx has no course redirect. It renders DayView whenever DAY_BY_DATE[date] exists. DayView (components/day-view.tsx:20-21) calls usePacing().dayFor(date). components/use-pacing.ts:24-53 builds buildCalendar from PLAN_DAYS, PACE and RESOLVE_CAPS with no COURSE_START check. For dates in the course the page then shows V1 copy: line 60 "the stretch today's pace suggests" for today, and line 61 "A forecast: what the current pace reaches by this day" for future dates. The course Today, by contrast, goes through the COURSE_START branches in dashboard.tsx:52 and use-today-plan.ts:61. So Progress opens a second answer to "what do I do today", which conflicts with §3 and principle 13. Major is the right severity. The link is a secondary entry point, but it is a real competing daily prescription. Corrected: The claim is accurate. Some context sharpens it. The links sit inside V1 sections (minute heatmap, Pattern readiness) that progress-view.tsx never hides once COURSE_START has passed. Lines 61-67 only add ReadinessReport above them. Those sections are also what §9 says to replace, so fixing §9 removes these links as well. Other routes still lead to the V1 DayView during the course too: dashboard.tsx:298 and :494 (`/day/${today}`, which may be in the pre-course branch; not checked), rep-workspace.tsx:854 and day-view.tsx:97 (the nextWork link computed from pace.days). Already correct: the plan-view and dashboard entry surfaces do branch on COURSE_START (plan-view.tsx:48, dashboard.tsx:52).

### 18. [MINOR] Week 14 never 'finishes': the study date stops at Jan 31, so its summary never appears — CONFIRMED (severity keep)
- Spec: §9 Weekly output; §19 week-complete moment
- Evidence: components/reps-provider.tsx:81 `clampDate(localDate(now), FIRST_DAY, LAST_DAY > COURSE_END ? LAST_DAY : COURSE_END)`; components/course/readiness-report.tsx:24-25 `const current = courseWeekOf(today); const finished = WEEKS.filter((w) => w.number < current)`
- Detail: On Feb 1, the interview checkpoint, 'today' is still Jan 31 (week 14). So 'Weeks so far' stops at Week 13, the Week 14 'complete' message can never show, and the Road map keeps Week 14 'Active' for good.
- Suggested fix: Include the current week in the summaries once its last training day has passed, or let the reporting date run to INTERVIEW_CHECKPOINT.
- Verifier: The claim holds, except for the Road map part. components/reps-provider.tsx:81 clamps the study date to `LAST_DAY > COURSE_END ? LAST_DAY : COURSE_END`. LAST_DAY is the old V1 plan's last day (data/curriculum.ts:219, in October 2026), so the upper bound is COURSE_END = '2027-01-31' (data/course/calendar.ts:10). devAsOf() always returns null in production. courseWeekOf('2027-01-31') returns 14, and lib/course/course.test.ts:31 asserts this. So on Feb 1 (INTERVIEW_CHECKPOINT) and every day after it, `today` stays at Jan 31 and the current week stays at 14. readiness-report.tsx:25 `WEEKS.filter((w) => w.number < current)` therefore never includes Week 14. The only place that calls motivate('week-complete') is readiness-report.tsx:114, inside that finished-weeks list, so the Week 14 'complete' message can never show. use-course-day.ts:34 has the same gap: `length: Math.max(0, courseWeekOf(today) - 1)` means the readiness input `finished` never includes Week 14's status. The Road map part is overstated. road-map.tsx:23-27 `weekState` returns 'complete' when every unit in the week is ready or in maintenance, and 'repair' when any unit is gate-blocked. Only otherwise does it fall through to `n <= current` → 'active'. So Week 14 is not stuck on 'Active' for good: it can show Complete or Repair based on unit state. It stays 'Active' only when its units are neither all ready nor gate-blocked. Minor is the right severity: this is a missing end-of-course moment, not an untruthful state. Corrected: The study date is clamped to COURSE_END (2027-01-31) at components/reps-provider.tsx:81, so from Feb 1 onward courseWeekOf(today) stays at 14. That causes two things. (1) readiness-report.tsx:24-25 never adds Week 14 to 'Weeks so far', and the week-complete message, which is only produced at readiness-report.tsx:114, never fires for Week 14. (2) use-course-day.ts:34 never passes Week 14's status into readiness() as a finished week. The Road map does not keep Week 14 'Active' unconditionally. road-map.tsx:24-25 shows 'Complete' once all Week 14 units are ready or in maintenance, and 'Repair required' if any unit is gate-blocked. It falls back to 'Active' only otherwise, because of the date clamp. Severity stays minor.

### 19. [MINOR] Road map week details have no lab-done or target-solved state, and unit counters show full paths much larger than the week target — CONFIRMED (severity keep)
- Spec: §7; §8; §26 WEEK level
- Evidence: components/course/road-map.tsx:113-119 labs rendered as plain links (no done state); components/course/road-map.tsx:120-125 `LC {lc}` in muted text (no solved state); components/course/road-map.tsx:95 `` ` · ${u.done}/${u.total}` ``
- Detail: Gates get a ✓ but labs and targets do not, so the Plan cannot answer 'am I completing the required work?'. The unit counters show full path sizes: the Week 2 paths total 197 reps (plus 11 gate passes) against a 60 target, w2-hashing alone is 125, and Week 1 is 65 (plus 8) against 50. This puts the FIX 1 workload mismatch on screen.
- Suggested fix: Show a ✓ from labProgress(..).done and from solvedLc for each item, plus the week's contract line (output x/target · builds · checkpoints · targets). The counters should follow the curated required path once FIX 1 lands.
- Verifier: I checked this against the code and it holds. In components/course/road-map.tsx:
- Lines 108-111 put a check mark on gates: `{g.cleared ? '✓ ' : ''}Checkpoint: {g.gate.title}`.
- Lines 113-119 render labs as plain `<Link ...>Lab: {LAB_BY_ID[id].title}</Link>` with no done state.
- Lines 120-125 render targets as `<span className="text-muted">LC {lc}...` with no solved state.
- Line 95 shows `` ` · ${u.done}/${u.total}` ``. In lib/course/routing.ts:167, `total` is `path.length`, which is every non-gate rep in the unit's sections (unitReps, routing.ts:73-75). On the 'focused' route only, lesson-level reps are filtered out.

Lab done state does exist elsewhere: components/use-course-day.ts:32 computes `required.filter((l) => l.progress.done)` and passes labsDone to weekProgress. RoadMap does not use it. At road-map.tsx:62 it calls `weekProgress(w.number, today, byDate)` with no extras, and the week header (line 80) shows only `{wp.done}/{w.targetProblems}`.

I recomputed the numbers by running courseStatus with no attempts, using a temporary script that I then deleted:
- Week 1 paths total 65 reps plus 8 gate passes (sum of gate.need): w1-state-while 18, w1-loop-control 20, w1-running-state 12, w1-mutation-references 10, w1-integration 5.
- Week 2 paths total 197 plus 11: w2-contract 7, w2-manual 28, w2-testing 17, w2-improve 14, w2-solve-map 6, w2-hashing 125 (with 5 LC targets).

The spec sets the targets at 50 and 60 (§8). Every figure in the claim is exact. One caveat: a unit's counter only shows while that unit is unlocked and not yet ready or in maintenance. So the full mismatch shows unit by unit (for example, 0/125 on w2-hashing once it opens), never as a single week total. Minor fits, because this is a display gap on the Plan. The underlying workload mismatch is the separate §8 FIX 1 issue and carries its own (major) severity. Corrected: The claim is accurate. One extra detail: lab completion data already exists (use-course-day.ts:32, `l.progress.done`). RoadMap never reads it. At road-map.tsx:62 it calls weekProgress without the labs and gates extras, so the week header (line 80) shows only qualifying problems against the target. Unit counters (line 95) show only while a unit is unlocked and not ready. They show the full path size (Week 1: 65 reps plus 8 gate passes against 50; Week 2: 197 plus 11 against 60; w2-hashing alone 125), unit by unit rather than as a week total.

### 20. [MINOR] PlanView still builds the V1 pace calendar and module table after the course starts — CONFIRMED (severity keep)
- Spec: §28 Phase E
- Evidence: components/plan-view.tsx:26 `const pace = usePacing()` and :32-41 `const modules = PLAN_UNITS.map(…)` run before `if (today >= COURSE_START)` at :48
- Detail: Every Plan render does wasted V1 work (usePacing runs buildCalendar over all PLAN_DAYS), and the V2 page keeps its V1 imports alive.
- Suggested fix: Split it into separate PlanV1 and RoadMap components and choose between them at the top, so the V1 hooks only run before COURSE_START.
- Verifier: I confirmed the claim by reading the code. In components/plan-view.tsx, line 26 (`const pace = usePacing()`) and lines 28-45 run on every render: PLAN_DAYS = pace.days, passedSet, the module table built by `PLAN_UNITS.map(...)` at lines 32-41 (which flatMaps BASELINE and filters pace.days for each unit), the `rows` Set and the `checkpoint` Map. All of this happens before the guard `if (today >= COURSE_START)` at line 48. That branch renders only the heading and <RoadMap />, so none of the computed values are used after the course starts.

usePacing (components/use-pacing.ts:28-50) calls buildCalendar over every PLAN_DAYS entry inside a useMemo keyed on [attempts, entries, today, capacity]. It also calls useCapacity. So the V1 calendar is rebuilt whenever progress changes, though not on literally every render as the claim's detail says. The V1 imports at lines 7-15 (curriculum, schedule-90, PaceGauge, use-pacing, program-90day, solve-log) stay in the V2 page's bundle.

This matters for §28 Phase E ("remove/de-emphasize legacy V1 tracking") only as cleanup. The user never sees any of the V1 output after COURSE_START, so it is not a truthfulness problem, and minor is the right severity.

One caveat for whoever fixes it: usePacing (and useSolveLog) are hooks, so they cannot simply move below the early return. The fix is to split the V1 calendar into its own component, such as LegacyPlanView, and render it only when today < COURSE_START. Corrected: The claim is accurate. One correction: usePacing's buildCalendar is memoized on [attempts, entries, today, capacity] (components/use-pacing.ts:28-50), so it re-runs whenever progress changes, not on literally every render. The module table (plan-view.tsx:32-41), rows (line 44) and checkpoint map (line 45) are not memoized and do run on every render. After COURSE_START (line 48) none of this is used. Because usePacing is a hook it cannot be moved below the return; the fix is to move the V1 body into a separate component that renders only before COURSE_START. Severity stays minor (§28 Phase E cleanup, nothing user-visible).

### 21. [MINOR] No test covers the Progress page; the Road map is checked only on day 1 — CONFIRMED (severity keep)
- Spec: §29 Testing
- Evidence: e2e/course.spec.ts:49-55 (only the road-map states on Oct 26); no e2e test visits /progress (grep of e2e/ finds only the progress.json import fixture); lib/progress-90.test.ts tests only the V1 helpers
- Detail: None of the contradictions above would fail CI.
- Suggested fix: Add unit tests for the single progress model: week contract, readiness inputs, and an evidence summary that does not depend on input order. Add an e2e test that imports a progress file and checks that, after Oct 26, the Progress streak equals the Today streak, the week summary matches the Road map state, and no V1 panels render.
- Verifier: I checked the claim against the code and it holds, with one nuance. No e2e test opens /progress. Every "progress" hit in e2e/ is the progress.json import fixture, the "Import progress file" label, the training-progress test id, or `import { blockingGate } from '@/lib/progress'`. The Road map is asserted in exactly one place, e2e/course.spec.ts:50-55, with the clock fixed at 2026-10-26: 14 weeks, week 1 "active", week 3 "locked", week 9 contains "Christmas Day". The other /plan visits (e2e/reps.spec.ts:135 and :155) check the pace gauge, the ramp and the 90-day calendar links, not road-map. The week-state logic lives in a function private to the component, components/course/road-map.tsx:23-31 (`function weekState(units, n, current)`), so no unit test can reach the complete, repair or ready states. components/progress-view.tsx:17 imports the V1 helpers from '@/lib/progress-90', and lib/progress-90.test.ts tests only those (activityByDate, streak, weeklyTime, checkpointStatus, unitReadiness...). The nuance: the page also renders ReadinessReport (progress-view.tsx:3), and the readiness model behind it is unit-tested in lib/course/readiness.test.ts. So what is untested is how the page is put together and whether it agrees with V2 course state, not every piece of logic it shows. Minor is the right severity under section 29, which does not explicitly require a Progress-page test. Corrected: The claim is accurate. No Playwright test visits /progress. Road-map states are asserted only once, at 2026-10-26 (e2e/course.spec.ts:50-55). The week-state derivation is a function private to the component (components/course/road-map.tsx:23-31), so its complete, repair and ready states are never tested. lib/progress-90.test.ts covers only the V1 helpers that components/progress-view.tsx:17 imports. One correction: the readiness model behind the ReadinessReport on the Progress page is unit-tested in lib/course/readiness.test.ts. The gap is how the page is put together and whether it agrees with V2 course state, not the readiness math. Severity stays minor.

## readiness

The readiness evidence layer does not meet §11, §18 or §26. One function is sound: credit.ts masteryEvidence classifies a single attempt correctly. The problem is everything that aggregates it.

1. **Merged bucket.** evidenceSummary adds independent + retrieval + cold-independent into one tile labelled "Cold, independent", which is the exact thing §11 forbids. 215 of the 272 "full" reps start as first-exposure, so most of that tile is not cold evidence.
2. **First attempt only.** It counts only the first passing attempt per rep, in array order. That order is not chronological: after a reload, attempts load in IndexedDB key order, and the keys are random UUIDs. So later stronger evidence never upgrades the report, and the numbers can change after a reload.
3. **Revealed solutions block later evidence.** A pass made after viewing the solution (the app's built-in "rebuild from memory" flow) takes the rep's single slot, so its later rebuild and cold re-solve are never counted.
4. **Checkpoint evidence missing.** 63 of 120 checkpoint variants never reach the evidence panel because they lack the `gate` flag. All variants of 11 checkpoints are missing, including hashing, windows, stack, search, rewiring, trees, grid, heap, backtracking and matrix.

Labs, change requests and design or review artifacts do not feed readiness at all. There is no Software Building or Applied AI/FDE dimension.

The Independent transfer and Interview execution rows are never wired. useCourseDay calls readiness() without the transfer grade or mock count. In Weeks 13–14 Today shows "Building" and "Not tested yet" directly above an InterviewCard that shows the actual grade.

Mock gating is only the visibility of one link: /interview stays in the main nav and any mock can be started. finalDecision overclaims. For example, a yellow grade with Programming foundations, Problem decomposition, Graphs and DP not ready, and zero mocks, gets "Ready to start interviewing, with targeted gaps". A green grade gets READY after one mock, even one done in October.

Week, Course and Readiness each use different inputs, and there are three different definitions of a complete week. The rule "a missing lab or checkpoint means the week is not on track" cannot fire from any caller. Every week can show On track while Readiness says "Off track: 3 weeks behind".

Mastery and freshness are separated only by a "· stale" tag on fully-ready domains in the Progress report. That tag disappears if the learner merely views a solution. The Today readiness card shows the five earliest domains and hides weaker later ones.

**Already correct:**
- lib/course/credit.ts:49-60 masteryEvidence classifies one attempt correctly against the time-ordered history (revealed > reconstructed > assisted > retrieval > self-corrected > cold-independent/independent). Reuse it; only the aggregation around it is wrong.
- credit.ts:77-80 gateClean rejects hints, a shown solution, reconstructions and more than 2 failed runs. Checkpoint variants are repType 'cold', so they start cold (lib/progress.ts:194).
- routing.ts:69-71 passedIds excludes passes made with the solution shown, so a revealed solution never completes a unit path.
- Readiness is per domain with a 'why' string, has no single percentage, and is derived from attempts rather than stored (readiness.ts:46-59).
- mockPolicy (readiness.ts:120-124) maps green/yellow/red to 2/2, 0/1 and 0/0 as spec §25 asks, and the calendar never makes mocks required. Only enforcement is missing.
- transferGrade excludes assisted, reconstructed, revealed and fast-repeat passes from 'independent'. Its thresholds are explicit, and failed abandoned tries count as attempted.
- The readiness track implements master spec §38 signals with reasons: behind the calendar via the teaching-order frontier, blocked gates, last week's status, and assistance thresholds (readiness.ts:141-157).
- Domain-level staleness exists, and the full report shows 'READY · stale' (readiness.ts:51; readiness-report.tsx:47).
- labProgress (labs.ts:23-30) is binary: it needs every design answer, a build pass, a change-request pass, every review check, and an explicit doneAt. All 23 labs are linked to units through labIds, and the aiFde flag exists on 2 labs.
- The 'Weeks so far' completion check already combines output, required (non-optional) labs and live gates (readiness-report.tsx:90). It is a good basis for a single week contract.
- Every checkpoint pool rep exists (120/120), and no unit or domain shows as ready with zero evidence on day 1.
- A per-skill freshness model already exists in training-state.ts freshnessOf (productive passes only, 3/6/12/21/30 days). It can drive MASTERED·FRESH / MASTERED·STALE.
- There is one credit source (dailyCredits via useCredits) shared by Today, the Week card, 'Weeks so far' and the road map.

**Data:**

```
HOW evidenceSummary BUCKETS EVIDENCE (lib/course/readiness.ts:71-90)
- Input: attempts only. The solve log is never passed (use-course-day.ts:39).
- Which reps count: full(e) = capstone OR transfer OR gate flag OR stage 'pattern' OR stage 'interview'. That is 272 of 1159 exercises.
  - Only 57 of the 272 start cold. The other 215 are first-exposure on the first attempt (progress.ts:194-199).
  - 63 of the 120 checkpoint variants are excluded, because they have no gate flag (they are 'cold/retrieval' reps).
- Which attempt counts: one per rep, via `seen` (lines 74-79). It is the first attempt in array order with passed && completedAt, classified by masteryEvidence against the full history.
- What is displayed (readiness-report.tsx:64-77):
  - "Cold, independent" = cold-independent + independent + retrieval (line 84). This is a merge.
  - "Self-corrected" = self-corrected.
  - "Assisted" = assisted.
  - "Rebuilt after a solution" = reconstructed.
  - Never displayed: revealed (it still takes the rep's slot) and failed.
  - There are no separate independent or retrieval counts.
- recentAssistance: passes with hints or solutionViewed, divided by all passes of any rep kind, over today-9 to today (10 calendar days). Reconstructions are not counted as help.

ATTEMPT ORDER
- engine.all() returns Map insertion order (sync.ts:56-62).
- On reload the cache is filled from IndexedDB getAll (local.ts:26-28; sync.ts:103), which returns rows in key order.
- Keys are crypto.randomUUID() (sessions.ts:13-14; rep-workspace.tsx:393), so after a reload the order is effectively random in time.
- dailyCredits sorts by time. evidenceSummary and transferGrade do not.

SIMULATIONS (throwaway scripts, already deleted from scripts/)
- A. Same capstone: assisted pass, then a cold clean pass a week later. Chronological order gives assisted 1, cold 0. Reversed order gives cold 1, assisted 0.
- B. One capstone with [revealed, reconstructed, cold pass] (the cold pass classifies as retrieval). Every bucket stays 0.
- C. One clean first-exposure pass on cap-two-sum (classified independent) is shown as "Cold, independent: 1".
- D. A clean cold pass on o2-cold-two-sum (a g-hashing checkpoint variant) leaves every bucket at 0.
- E. A transfer rep with [assisted, later slow cold pass]. Chronological order gives independent 0; reversed gives independent 1 and freshFull 1.
- F. The first 12 bank reps solved clean grades yellow (freshFull 3, because only 12 of the 48 bank reps can count as full). Adding 8 abandoned failing tries raises attempted to 20.
- G. readiness() called the way useCourseDay calls it, on 2027-01-27: transfer is 'building' and interview is 'not-tested'. With the grade and mock count passed in: 'ready' and 'developing'.
- H. Week 3 with full output but labs 0/2 and gates 0/3:
  - today = Sunday gives on-track, with or without the extras;
  - the next Monday with the extras gives recoverable.
  - Every caller uses today ≤ Sunday or passes no extras, so the lab/gate rule never fires.
- I. finalDecision:
  - yellow, foundations + decomposition + graphs + dp not ready, 0 mocks → ready-with-gaps;
  - green, every domain stale, 1 mock → ready;
  - green, 1 mock (the green policy requires 2) → ready;
  - green, track off-track, 1 mock → ready;
  - green, 0 mocks → ready-with-gaps.
- J. Evidence {cold 0, assisted 40, reconstructed 20, recent help 0.39} gives on-track, with the why line "Output, checkpoints and independence are where the plan needs them."
- K. Weeks 1–3 output met only with reps outside every unit (74 such qualifying reps exist): every week is on-track, while the track is off-track with "The course is 3 weeks behind the calendar."
- L. Week 8, with units W1–7 ready except w6-recursion gate-blocked: ReadinessCard shows foundations, decomposition, hashing, pointers and windows, all READY. Recursion (DEVELOPING) is hidden.
- M. Hashing domain ready since Nov 5, today Nov 25, so it is stale. One unpassed attempt that only viewed a solution on a w2-hashing rep turns stale to false.

READINESS DIMENSIONS: CODE vs SPEC §18
- What the code has (readiness.ts:26-42 plus two extra rows):
  - 15 topic domains: Programming foundations, Problem decomposition, Hashing, Pointers and running state, Sliding window, Stacks, Binary search, Linked lists, Recursion, Trees, Graphs, Heaps and intervals, Backtracking, Basic DP and greedy, Matrix and tries.
  - An Independent transfer row (never wired to the grade).
  - An Interview execution row (never wired to mocks; it can never become 'ready').
- Against the spec:

| Spec dimension | In code |
|---|---|
| Programming Foundations | ≈ foundations |
| Problem Solving | ≈ decomposition |
| Core DSA | 13 separate topic rows, no aggregate |
| Independent Transfer | Row exists, unwired |
| Software Building | **Missing** |
| Applied AI/FDE | **Missing** |
| Interview Execution | Row exists, unwired |

- Master §37 inputs that are not used: skill mastery, mock evidence, interview behaviours. Freshness is used only as the unit "maintenance" state. Output is used only as the last finished week's status.

LABS
- 23 labs: 22 required, plus lab-priority-queue (optional).
- aiFde labs: lab-support-router (W12) and lab-fde-workflow (W13).
- 46 lab exercises. None is in any unit path, none has cleanPass, and all have solutions that can be revealed.
- Where labs feed in today: WeekCard builds list (use-course-day.ts:28-32), the weekProgress extras (dead rule), "Weeks so far" completion (readiness-report.tsx:88-90), and the momentum bonus (use-course-day.ts:50).
- Where they do not feed in: readiness(), domains, track, finalDecision.

MASTERY vs FRESHNESS
- lib/mastery.ts statuses never decay; only lastPracticed is stored.
- Skills page shows the mastery status only. Skill detail shows "Last practiced <date>" (skill-detail.tsx:83).
- The readiness report shows "READY · stale" only when every unit in a domain is ready and one is in maintenance (any attempt older than 14 days, routing.ts:160-162).
- ReadinessCard on Today drops the stale tag.
- training-state.ts freshnessOf (productive passes only, 3/6/12/21/30 days) is used only by the planner. It is a different rule from the unit maintenance rule.

HOW TODAY / WEEK / COURSE / READINESS DERIVE
- Today: the calendar daily target plus dailyCredits, which counts any production rep, outside LC entries, and repeats on later days.
- Week: weekProgress, from credits only.
- Course: courseStatus, from gates and paths.
- Readiness: domains come from Course. The track comes from the Course frontier, output-only finished-week statuses, and recentAssistance.
- InterviewCard computes the transfer grade separately.
- Three definitions of "week complete":
  - road-map.tsx:24 — every unit of the week ready;
  - readiness-report.tsx:90 — output + required labs + gates;
  - weekProgress — output only.

WEEK 14 GATING
- mockPolicy maps correctly: green 2/2, yellow 0/1, red 0/0.
- mocksRequired is never used. mocksAllowed only toggles one link (course-cards.tsx:161).
- /interview is a nav item (header.tsx:21) whose cards all have Start buttons (interview-view.tsx:61-62), with no check.
- mocksDone = distinct in-app mocks completed on any date (progress.ts:331-334).
- The final decision is shown only on Today when week ≥ 14, and never in the Progress report.
- Production clamps today to ≤ 2027-01-31, so Feb 1 itself is never "today". The cd.week fallback to Week 1 for course week 0 or 15 (use-course-day.ts:26) is reachable only through the dev ?asOf parameter.

Note: an untracked scripts/_audit_routing_sim2.ts appeared during this run. It is not mine (another auditor's) and I did not touch it.
```

### 1. [CRITICAL] Evidence report merges independent + retrieval + cold-independent under 'Cold, independent' — CONFIRMED (severity keep)
- Spec: §11 FIX 4; principles 6 and 12
- Evidence: lib/course/readiness.ts:84 `coldIndependent: counts['cold-independent'] + counts.independent + counts.retrieval,`; readiness.ts:61-68 EvidenceSummary has no independent or retrieval field; components/course/readiness-report.tsx:66 `['Cold, independent', r.evidence.coldIndependent],`; lib/course/credit.ts:59 `return a.retrievalType === 'cold' ? 'cold-independent' : 'independent'`
- Detail: §11 says exactly this must not happen. Six categories are required, but only four tiles exist, and one of them combines three kinds of evidence. 215 of the 272 'full' reps (capstones, transfer, pattern-stage and interview-stage reps) are 'first-exposure' on the first attempt (lib/progress.ts:194-199). A clean first try on them is 'independent' (credit.ts:59), yet the report calls it cold. Simulation: one clean first-exposure pass on cap-two-sum shows 'Cold, independent: 1'. The report overstates the strongest kind of evidence.
- Suggested fix: Return six separate counts from evidenceSummary (coldIndependent, independent, selfCorrected, assisted, reconstructed, retrieval) and render six labelled tiles. Update readiness.test.ts `calm` and add a test that a first-exposure pass is never counted as cold.
- Verifier: I could not refute the claim. Every cited line matches the code, and I reproduced the numbers and the simulation with a throwaway script, which I then deleted. git status is unchanged.

- lib/course/readiness.ts:84 is `coldIndependent: counts['cold-independent'] + counts.independent + counts.retrieval,`.
- readiness.ts:61-68 (EvidenceSummary) has only coldIndependent, selfCorrected, assisted, reconstructed and recentAssistance.
- components/course/readiness-report.tsx:65-70 renders exactly four tiles, the first being `['Cold, independent', r.evidence.coldIndependent]`.
- lib/course/credit.ts:59 returns 'independent' whenever retrievalType is not 'cold'.

The numbers hold:
- 272 unique exercises match the "full" test at readiness.ts:72.
- retrievalTypeFor (lib/progress.ts:192-200, `if (!prior.length) return 'first-exposure'`) gives 215 of them 'first-exposure' on the first attempt.
- The other 57 are gate reps (repType 'cold', stage 'retrieval'), which are always cold.
- One clean first pass on cap-two-sum: retrievalType 'first-exposure', then evidence 'independent', then evidenceSummary returns coldIndependent: 1.

§11 forbids exactly this merge by name and lists six required categories. The page has four.

Severity stays critical. The label calls passes "cold" when the code's own classification says they are not. That breaks principle 12 and §11's "no stronger language than the evidence supports", which the rubric treats as critical.

The overstatement is worse than the claim says:
- On a non-cold attempt, opening the Basics panel is free. rep-workspace.tsx:602-607 only counts it as a hint when `retrievalType === 'cold'`.
- The Basics button is shown on capstones and pattern reps outside checkpoints and Week 13 (rep-workspace.tsx:828, `bare = interview || checkpoint || transferWeek`).
- In 'learn' mode the concept guide opens by default and is not counted as help (data/concepts.ts:308-309).
- So some passes counted under "Cold, independent" had teaching material on screen.
- The rep page shows its "Cold" badge only when `retrievalType === 'cold'` (rep-workspace.tsx:927). The rep page and the readiness report describe the same pass differently.

Citing principle 6 is weak. Assisted, reconstructed and self-corrected passes are still counted separately. The defect is unaided non-cold passes, plus retrieval passes, being labelled cold.

The merged number feeds no decision. readiness() only reads evidence.recentAssistance (readiness.ts:151-156), and finalDecision ignores it. The harm is to the evidence panel, which is the product's only evidence display (Progress, via components/progress-view.tsx:65). The track and the final verdict are not affected. Corrected: The claim is accurate. Four refinements:

1. **The "full" set.** The test at readiness.ts:72 also includes gate reps (`e.gate`), which the claim leaves out. That adds 57 reps (repType 'cold', stage 'retrieval'), which are always 'cold'. The 215 first-exposure reps are exactly the non-gate full reps:
   - 92 transfer/pattern
   - 37 interview
   - 37 pattern
   - 25 capstone
   - 12 transfer/combine
   - 8 transfer/interview
   - 3 transfer/microbuild
   - 1 foundation/pattern

   'first-exposure' applies to the first attempt outside a 'review' session, and also to any re-attempt within 12 hours (progress.ts:194-199). Only o2-ts-find-pair is in the reactivation 'review' session.

2. **The overstatement goes beyond "not cold".** Some passes in the "Cold, independent" tile had teaching material on screen:
   - On a non-cold attempt, opening the Basics panel is free: rep-workspace.tsx:604 `if (!showBasics && retrievalType === 'cold' && !basicsCounted.current)`. Basics is available on capstones and pattern reps unless the page is bare (rep-workspace.tsx:828).
   - The 'learn' guide opens by default and is not counted as help (data/concepts.ts:309 `learn: { open: true, assisted: false }`).
   - The rep page shows "Cold" only when `retrievalType === 'cold'` (rep-workspace.tsx:927). It contradicts the report.

3. **Retrieval really does reach the tile.** evidenceSummary counts only the first passed attempt per rep, in array order (readiness.ts:74-78). That array comes from an IndexedDB store keyed by random UUID (lib/storage/local.ts:19,27; lib/sessions.ts:14). After a reload, the pass counted for each rep is therefore arbitrary, and it is sometimes a retrieval pass.

   The same ordering is a separate §11 "upgrade" defect. Assisted pass first, then a later clean cold pass: the report shows assisted: 1. Reverse the array order and it shows coldIndependent: 1.

4. **Scope.** coldIndependent is display-only. readiness() uses only evidence.recentAssistance (readiness.ts:151-156), so the track and finalDecision are unaffected. The harm is to the evidence panel on Progress. Principle 12 and §11's readiness principles are the right basis; principle 6 is only loosely involved. The test fixture `calm` (lib/course/readiness.test.ts:9) bakes in the merged four-category shape, and no test checks the six required categories.

### 2. [CRITICAL] Independent transfer and Interview execution rows are never wired; Today contradicts itself in Weeks 13–14 — CONFIRMED (severity keep)
- Spec: §26; §25; principle 12
- Evidence: components/use-course-day.ts:40 `const ready = readiness(course.statuses, finished, ev, today)` (no `extra`); readiness.ts:158 `extra.transferGrade ? ... : week >= 13 ? 'building' : 'not-tested'`; readiness.ts:159 `(extra.mocksDone ?? 0) > 0 ? 'developing' : 'not-tested'`; course-cards.tsx:115-122 render r.transfer / r.interview, while course-cards.tsx:139-142 compute `transferGrade(...)` and `program.mocks.completed` separately; readiness-report.tsx:52-61
- Detail: In Weeks 13–14 the ReadinessCard on Today and the Progress report always show 'Independent transfer: BUILDING' and 'Interview execution: NOT TESTED YET'. Directly below on Today, the InterviewCard shows the actual Green/Yellow/Red grade and the number of mocks done. Simulation on 2027-01-27: transfer 'building', interview 'not-tested'; when the extras are passed in: 'ready' / 'developing'. Even if wired, red and yellow both map to 'developing', and Interview execution can never become 'ready'. The Progress report never shows the grade, the mocks or the final decision.
- Suggested fix: Compute transferGrade and the mock results once, inside useCourseDay, and pass them to readiness(). Map red to a distinct 'not ready' status, derive interview status from completed and reviewed Week-14 mocks, and render the grade, mocks and decision in ReadinessReport. Remove the duplicate calculation from InterviewCard.
- Verifier: I checked every cited line and they all match the code.

- components/use-course-day.ts:40 calls `readiness(course.statuses, finished, ev, today)` with no 5th argument. A grep shows no other production caller of lib/course/readiness.ts `readiness()`. The other `readiness(` hits belong to the unrelated lib/bridges.ts function or to tests. So `extra` is always `{}` in the product.
- With `extra = {}`, readiness.ts:158 gives `transfer = week >= 13 ? 'building' : 'not-tested'`, and readiness.ts:159 always gives `interview = 'not-tested'`.
- Both surfaces read `cd.readiness` from that hook:
  - Today's ReadinessCard renders the two rows unconditionally at course-cards.tsx:115-122.
  - The Progress ReadinessReport renders them at readiness-report.tsx:52-61.
  - DOMAIN_LABEL plus the `uppercase` class make them display as "BUILDING" and "NOT TESTED YET".
- CourseDashboard (course-dashboard.tsx:72-80) renders InterviewCard below the WeekCard/ReadinessCard grid when `cd.week.number >= 13`. InterviewCard works out its own numbers at course-cards.tsx:138-142: `transferGrade` over the c13-transfer bank (48 reps), `program.mocks.completed` (distinct completed in-app mocks, reps-provider.tsx:127-129), and in Week 14 `finalDecision`.

I ran a simulation with a throwaway script in the repo, which I deleted afterwards. The script called the real courseStatus, evidenceSummary, transferGrade, readiness and finalDecision.
- 2027-01-27 (courseWeekOf = 14), every unit rep, gate variant and transfer rep passed cold, 2 mocks:
  - InterviewCard: heading "Interview execution", badge GREEN (48/48, freshFull 12), "2 done.", final decision "ready" (0 domains not ready).
  - ReadinessCard and report, as wired: transfer `building`, interview `not-tested`.
  - With extras passed: `ready` / `developing`.
- Yellow grade plus 1 mock: as wired `building` / `not-tested`; with extras `developing` / `developing`.
- Red grade in Week 13: as wired `building`; with extras `developing`.

The "even if wired" point also holds. Line 158 maps yellow and red both to `developing`. Line 159 can only return `developing` or `not-tested`. So even a correctly wired green learner with 2 mocks and finalDecision `ready` would see "Interview execution: DEVELOPING" next to "Ready.", which is still a contradiction.

The Progress readiness report renders only track, why, domains, the two rows and the evidence counts. It never shows the grade, the mock count or the final decision. Master spec §37 lists "cold independent transfer", "interview behaviors" and "mock evidence" as inputs to the report. The code appears to have frozen §37's example ("Independent transfer BUILDING / Interview execution NOT TESTED") as the permanent state rather than deriving it.

Severity stays critical. "NOT TESTED YET" after mocks were done, and "BUILDING" after a green grade, are untruthful (principle 12). The same screen gives two different verdicts under the same labels, so there are contradictory systems (§26). This happens in the two weeks when readiness matters most.

Tests do not catch it. readiness.test.ts:40-41 calls `readiness()` without extras and never checks the extras path or the wiring. The e2e test (e2e/course.spec.ts:47) only checks that `readiness-card` is visible. Corrected: The claim is accurate. Four refinements make it more precise:

1. **The contradictions.** The clearest ones on Today (and in the Progress report, which uses the same `cd.readiness`) are:
   - **Green grade vs "BUILDING".** In Week 13 the InterviewCard heading is "Independent transfer" with a GREEN badge, while the ReadinessCard row "Independent transfer" says BUILDING.
   - **Mocks done vs "NOT TESTED YET".** InterviewCard prints "N done." (course-cards.tsx:159), while the "Interview execution" row says NOT TESTED YET. Mocks can be done in Week 13 too: the "Open the mocks" link shows for yellow or green grades.
   - **Week 14 "Ready." vs "NOT TESTED YET".** The InterviewCard heading is literally "Interview execution", with the transfer grade as its badge and the final decision "Ready." (course-cards.tsx:148-172). The ReadinessCard row "Interview execution" still says NOT TESTED YET.

   For a red grade, "BUILDING" vs "RED" is a mismatch of terms rather than a direct contradiction. The verdicts disagree under the same labels most sharply when the evidence is good.

   Simulation on 2027-01-27 (Week 14), with everything passed cold and 2 mocks: InterviewCard shows GREEN, 48/48, freshFull 12, "2 done." and finalDecision `ready`. The ReadinessCard and report show transfer `building` and interview `not-tested`. With extras passed in they would show `ready` / `developing`.

2. **Persistence past Jan 31.** In production `studyToday()` clamps the date to 2027-01-31 (components/reps-provider.tsx:81; LAST_DAY 2027-01-09 is less than COURSE_END). So this Week 14 state stays on screen after the course ends, including on the Feb 1 checkpoint. It does not reset.

3. **Even if wired.** readiness.ts:158-159 maps red and yellow both to `developing`. Interview execution can never become `ready`, so a wired green learner with 2 mocks would see "Interview execution: DEVELOPING" next to "Ready." The fix needs three things:
   - pass `{ transferGrade, mocksDone }` at use-course-day.ts:40, ideally working out the grade once in the hook and sharing it with InterviewCard;
   - a mapping in which red is weaker than yellow, and interview execution reaches `ready` once green and the required mocks are met;
   - the grade, mocks and final decision shown in the readiness report.

4. **The Progress page.** The ReadinessReport component never shows the grade, the mocks or the final decision. The Progress page does have one other mock number: the legacy V1 "Checkpoints" panel (progress-view.tsx:140-163, lib/progress-90.ts:103,112) shows "Mocks logged X / 5|12|22" against the old 90-day plan's targets. It counts only through the V1 checkpoint dates (the last is 2027-01-09), so Week 14 mocks never appear there either. Its targets of up to 22 mocks also contradict the readiness-gated mock policy (§25), which is a further contradictory system rather than a correction.

No unit or e2e test exercises the `extra` path or the wiring.

### 3. [CRITICAL] Mock gating is cosmetic: /interview stays open regardless of the transfer grade — CONFIRMED (severity keep)
- Spec: Principle 10; §25; §29 'Week 14: mock gating still works'
- Evidence: course-cards.tsx:161-167 `{policy.mocksAllowed > 0 ? (<Link href="/interview" ...>Open the mocks</Link>) : (<p ...>Mocks open once the transfer evidence says they will be useful.</p>)}`; components/header.tsx:21 `{ href: '/interview', label: 'Interview', ... }`; components/interview-view.tsx:61-62 `<Link href={`/interview/${m.id}`} ...>{past.length ? 'Run it again' : 'Start'}`; a grep shows mocksRequired is used nowhere outside readiness.ts
- Detail: mockPolicy is only used to decide whether one card shows a link. Any learner, red-graded or in Week 1, can start every mock from the main nav, and neither interview-view nor mock-session checks readiness. The card's text 'Mocks open once the transfer evidence says they will be useful' is false. Yellow's 'one mock at most' is not enforced. Green's `mocksRequired: 2` is never shown on Today as required work.
- Suggested fix: Gate the /interview mock list and /interview/[mockId] on mockPolicy(transferGrade) and course week ≥ 14, and enforce mocksAllowed. For green learners, add the required mocks to Today's Week-14 contract. Add a test that a red grade cannot start a mock.
- Verifier: I read the code end to end and the claim holds.

(1) There is no access gate. app/interview/page.tsx and app/interview/[mockId]/page.tsx render InterviewView and MockSession with no readiness input, and there is no proxy.ts or middleware.ts. interview-view.tsx:41-63 turns every MOCKS entry into `<Link href={`/interview/${m.id}`} ...>{past.length ? 'Run it again' : 'Start'}`. mock-session.tsx:38-42 only checks that the mock id exists, then the 'ready' phase offers 'Start the clock' (203-213). Neither file imports anything from lib/course/readiness.

(2) The way in is always visible: the nav item at header.tsx:21, the chip at header.tsx:91-92, and Today's own InterviewTargetCompact (interview-target.tsx:15, rendered at course-dashboard.tsx:67) in every week.

(3) In production code, mockPolicy is only read by InterviewCard (course-cards.tsx:140, 161). That card renders only when week >= 13 (course-dashboard.tsx:76-78). All the policy does is choose between a link and the sentence 'Mocks open once the transfer evidence says they will be useful.' (course-cards.tsx:166). That sentence is false, because the mocks are already open. A throwaway tsx run confirmed that transferGrade([], ...) returns red and mockPolicy('red').mocksAllowed is 0. Nothing stops a learner from starting mock-1 anyway.

(4) Yellow's 'one mock at most' (readiness.ts:122) is never counted or enforced. The yellow card links to /interview, which offers both mocks with Start buttons.

(5) mocksRequired (readiness.ts:121) is read only in tests. course-today.tsx has no mock item kind, and neither the day contract nor the week contract includes mocks. So green's two mocks never become required work.

Severity: Principle 10 ('Mocks are readiness-gated') is non-negotiable. The card copy, and readiness-report.tsx:60 ('once readiness allows'), tell the learner something untrue, and ungated mocks feed credit and evidence (see correctedDetail). Critical stands. The refinements below do not weaken the finding. Corrected: The claim is accurate, with these refinements and additions:

(a) `mocksRequired` also appears in lib/course/readiness.test.ts:37,39, but only in tests. In production code, mockPolicy is used only at components/course/course-cards.tsx:140/161.

(b) The narrow rule in §25, 'Do not let calendar alone unlock mandatory mocks' (also master spec §59), is technically met, because no mock is ever mandatory for anyone. The real defect is that access is never gated and the grade's limits and requirements are never enforced or wired in. Green's note 'Two mocks, each followed by diagnosis and repair.' does appear as text on Today's InterviewCard (weeks 13 and 14 only). It is not an item in the Today stack and not part of the day or week completion contract.

(c) There are more ungated entry points than the claim cites:
- the header chip at components/header.tsx:91-92;
- the Today page's own InterviewTargetCompact (components/interview-target.tsx:15, rendered at components/course/course-dashboard.tsx:67) in every week;
- direct URLs /interview/mock-1 and /interview/mock-2. app/interview/[mockId]/page.tsx does no check, and the repo has no proxy.ts or middleware.ts.

(d) Ungated mocks have real effects. MOCK_EXERCISES are included in ALL_EXERCISES (data/curriculum.ts:227). mock-session.tsx:106-125 records each problem as an attempt with `mode: 'interview'` and `retrievalType: 'cold'`. A scratch run of `dailyCredits('2026-10-27', [passed mock-1-a])` returned one qualifying credit with evidence 'cold-independent', and `evidenceSummary` gave coldIndependent: 1. So a mock run by a Week 1 or red-graded learner inflates both the daily count and the readiness report's 'Cold, independent' figure.

(e) The transfer grade and mock count are not wired into readiness either. components/use-course-day.ts:40 calls `readiness(course.statuses, finished, ev, today)` without `extra`. As a result, lib/course/readiness.ts:158-159 always gives transfer 'building' (from week 13) and interview 'not-tested'. The same Today page can show InterviewCard 'Green … 2 done.' next to ReadinessCard 'Interview execution: Not tested yet'. components/course/readiness-report.tsx:60 also says 'Week 14: timed problems and mocks, once readiness allows.', which is just as untrue.

(f) `finalDecision` (lib/course/readiness.ts:168) declares 'ready' when mocksDone >= 1, which contradicts green's mocksRequired: 2. Also, mocksDone (course-cards.tsx:141, from mockProgress) counts mocks run before readiness allowed them.

(g) The §29 requirement 'Week 14: mock gating still works' is covered only by unit asserts on mockPolicy's return values (lib/course/readiness.test.ts:33-41). No e2e or component test checks access to /interview.

### 4. [CRITICAL] finalDecision declares 'Ready' or 'Ready with targeted gaps' on evidence that does not support it — CONFIRMED (severity keep)
- Spec: §11 'no stronger language than the evidence supports'; §25; master §17 Week 14, §18, §37
- Evidence: readiness.ts:166-171 `if (grade === 'green' && notReady <= 1 && mocksDone >= 1) return 'ready'` / `if (grade !== 'red' && notReady <= 4) return 'ready-with-gaps'`; course-cards.tsx:141 `const mocksDone = program.mocks.completed`; lib/progress.ts:331-333 mockProgress counts distinct mocks completed on any date; data/course/motivation.ts:151-152 'Ready to start interviewing, with targeted gaps.'
- Detail: Simulations:
- Yellow, with foundations + decomposition + graphs + dp not ready and 0 mocks → 'ready-with-gaps' ('Ready to start interviewing'), even though the yellow policy itself says 'More transfer'.
- Green with 1 mock → 'ready', although the green policy requires 2 mocks.
- mocksDone counts any in-app mock ever completed, including one from the pre-course October plan, so READY needs no Week-14 mock.
- Green, all domains stale → 'ready'.
- Green while the track is off-track → 'ready'.
All 15 domains count equally, ignoring the §18 Tier-A list. Labs, assistance dependence and freshness are ignored. The 'not-ready' text says 'the report says exactly why', but no reasons are shown anywhere.
- Suggested fix: Base the decision on Tier-A domains being ready and fresh, the transfer grade, Week-14 mocks completed after a green grade (and reviewed), an acceptable track and assistance level, and Software Building. Return the reasons with the decision and render them. Add tests for each of these cases.
- Verifier: I read every cited line and checked the scenarios with the real code. I ran a throwaway script (scripts/_audit_skeptic_final.ts, deleted right after) that used courseStatus, readiness, finalDecision, mockPolicy, mockProgress and transferGrade. Its attempts cleared the gates of chosen domains on Week 14 dates.

What finalDecision reads (lib/course/readiness.ts:166-171): only r.domains[].status as a plain count (`const notReady = r.domains.filter((d) => d.status !== 'ready').length`), the grade, and mocksDone. It never reads r.track, r.evidence (assistance), d.stale, or the §18 tiers. Labs are not part of readiness at all.

Results:
- Yellow; foundations, decomposition, graphs and dp all not-started; 0 mocks; track off-track ("13 weeks behind the calendar"): 'ready-with-gaps'.
- A more realistic case, yellow with heaps, backtracking, dp and matrix not-started, 5 weeks behind and off-track: also 'ready-with-gaps'. Five domains not ready gives 'not-yet-ready', so the cap is 4.
- Yellow needs only 6 transfer attempts with 3 independent (50%) (transferGrade, readiness.ts:115).
- Green with 1 mock: 'ready', although mockPolicy('green') has mocksRequired: 2 (readiness.ts:121 vs :168).
- Green with all 15 domains stale (attempts dated 2026-12-01, today 2027-01-28): 'ready'. Stale domains keep status 'ready' (readiness.ts:51-52).
- Green with last week off-track, or with 70% recent assistance (track off-track in both): 'ready'.
- Green with only foundations not-started (off-track, 13 weeks behind): 'ready'.
- Green with only graphs, a Tier-A domain, not-started: 'ready'.
- mockProgress (lib/progress.ts:331-333) has no date filter and checks only completedAt. One October mock (data/program.ts:118 has requiresMocks on the 2026-10-11 stage, and the course starts 2026-10-26) gives {completed: 1}.
- Worse than the claim says: the "End interview" button (components/mock-session.tsx:299) calls finish(), which saves completedAt no matter what (lines 117-143). A mock ended after 5 seconds with no problem passed still counts, and /interview has a Start link for every mock with no gate (components/interview-view.tsx:61).
- The decision shows on Today (course-dashboard.tsx:76-79 → course-cards.tsx:142, 168-173) next to the yellow note "More transfer and timed singles…". The copy is motivation.ts:150 "The evidence says you're ready to start interviewing…" and :152 "Ready to start interviewing, with targeted gaps."

One part of the claim is overstated. "No reasons are shown anywhere" is wrong: the readiness report (components/course/readiness-report.tsx:35-51) lists the track reasons (r.why) and a reason for each domain (d.why). What is really missing is a reason for the decision itself, and the report also contradicts the decision. use-course-day.ts:40 calls `readiness(course.statuses, finished, ev, today)` without the `extra` argument, so in the simulations above r.transfer stays 'building' and r.interview stays 'not-tested' (readiness.ts:158-159). The Today ReadinessCard (course-cards.tsx:115-122) and the report therefore say "Independent transfer: Building" and "Interview execution: Not tested yet" while the InterviewCard on the same page says "Ready".

Severity stays critical. The product states readiness that its own model contradicts: off-track, Tier-A domains not started, and no real interview evidence. That breaks principle 12 (truthful progress), V2.1 §11 (no stronger language than the evidence) and master §60 ("Does the final decision use multiple evidence dimensions?"). Corrected: The claim holds, with one overstatement corrected and two aggravating facts added.

What is confirmed in finalDecision (lib/course/readiness.ts:166-171):
- It counts not-ready domains, all 15 weighted equally, and checks the grade and mocksDone. Nothing else.
- It returns 'ready' for green with notReady ≤ 1 and at least 1 mock, even though mockPolicy('green') requires 2 mocks (line 121).
- It returns 'ready-with-gaps' for any non-red grade with up to 4 domains not ready, with 0 mocks.
- It ignores r.track, assistance (r.evidence.recentAssistance), staleness (d.stale), the §18 tiers and labs. Labs are not in readiness at all.

Results from the real routing code:
- Yellow; foundations, decomposition, graphs and dp not-started; off-track; 0 mocks: "Ready with targeted gaps". This is shown in the same card as the yellow policy note "More transfer…".
- Yellow; heaps, backtracking, dp and matrix not-started; 5 weeks behind; 0 mocks: "Ready with targeted gaps".
- Green with 1 mock: "Ready". This also holds when all 15 domains are stale, when the track is off-track (last week off-track, or 70% assistance), or when the single not-ready domain is foundations or graphs.

mocksDone is program.mocks.completed (components/course/course-cards.tsx:141), built by mockProgress (lib/progress.ts:331-333). It counts each distinct mock with a completedAt on any date, which includes the October pre-course plan.

Aggravating fact 1: a mock ended at once with "End interview" (components/mock-session.tsx:299) still gets completedAt, even with zero problems passed (lines 117-143). The /interview page lets anyone start any mock at any time (components/interview-view.tsx:61). So 'ready' needs no real Week-14 interview evidence.

Correction to "no reasons are shown anywhere": the readiness report (components/course/readiness-report.tsx:35-51) does show the track reasons and a reason for each domain. The real gaps are these:
- The report never shows the final decision, the transfer grade, the mock count, or which threshold decided the outcome.
- use-course-day.ts:40 calls readiness() without its `extra` argument. Because of that, the "Independent transfer" and "Interview execution" rows in both the report and the Today ReadinessCard (course-cards.tsx:115-122) stay at Building and Not tested yet. They contradict the "Ready" shown in the InterviewCard on the same page.
- So the 'not-ready' copy, "the report says exactly why" (motivation.ts:154), is untrue for the decision itself.

Aggravating fact 2, about when the decision appears: it renders from Monday of Week 14 (course-cards.tsx:142, `cd.week.number >= 14`). On Feb 1 itself, courseWeekOf returns 15, use-course-day.ts:26 falls back to Week 1, and the card is hidden.

Severity stays critical, because the product is untruthful about readiness.

### 5. [MAJOR] Evidence anchored to the first passing attempt in unsorted order; later stronger evidence never upgrades it — CONFIRMED (severity keep)
- Spec: §11 'later stronger evidence can upgrade the report'; §29 readiness tests
- Evidence: readiness.ts:74-79 `const seen = new Set<string>()` ... `if (!a.passed || !a.completedAt || seen.has(a.exerciseId) || ...) continue` `seen.add(a.exerciseId)`; lib/storage/local.ts:26-28 getAll; lib/storage/sync.ts:103 `for (const r of rows) if (!m.has(r.id)) m.set(r.id, r)`; lib/sessions.ts:13-14 crypto.randomUUID(); rep-workspace.tsx:617-623 viewSolution persists `solutionViewed: true`; rep-workspace.tsx:1178-1180 'Solution hidden while you rebuild it from memory.'
- Detail: Only one attempt per rep is ever counted. Within a session that is roughly the earliest; after a reload it is effectively random, because the cache loads in IndexedDB key order and the keys are random UUIDs.
- Simulation A: assisted pass, then a cold clean pass. Chronological order gives assisted 1; reversed order gives cold 1.
- Simulation B: a pass after viewing the solution is classified 'revealed' and takes the rep's slot. That category is never displayed, so the later reconstruction and cold re-solve of that rep never count ([revealed, reconstructed, retrieval] → every bucket 0).
The app's built-in flow is to rebuild in the same attempt after viewing a solution, so 'Rebuilt after a solution' is close to always 0.
- Suggested fix: Sort attempts by time. For each rep, report the strongest (or latest) evidence, and optionally the first-attempt evidence alongside it. Never let 'revealed' take the slot. Add tests for an upgrade (assisted, then cold) and for revealed → reconstructed → cold.
- Verifier: I read the code path from start to finish and ran the real functions; the claim holds. Repo files were left unchanged: the scripts live in the scratchpad audit folder, and `git status` shows only the untracked spec that was already there.

How the code behaves:
- `evidenceSummary` (lib/course/readiness.ts:74-79) counts only the first passing, completed full-problem attempt per rep, in whatever order the array arrives: `seen.has(a.exerciseId) ... continue; seen.add(a.exerciseId); counts[masteryEvidence(a, attempts)]++`. It never compares strengths or sorts by time.
- Its only caller is components/use-course-day.ts:39. That passes `useReps().attempts`, which is `repo.attempts()`, which is `engine.all('attempts')`. That is `[...Map.values()]` with no sort, so the order is the Map's insertion order.
- Inserts into that Map:
  - On load, `loadCached` (sync.ts:101-103) inserts rows from `IndexedDbLocalStore.getAll` (local.ts:26-28). Native IndexedDB `getAll` returns rows sorted by key, and the key is the attempt id.
  - Attempt ids come from `newId()`, which is `crypto.randomUUID()` (sessions.ts:13-14, called at rep-workspace.tsx:393).
  - New rows from the Supabase pull and from `save()` are added at the end. `Map.set` on a key that already exists keeps its position.

Verification with the real code (npx tsx), using real capstone `cap-contains-duplicate`:
- **Sim A** (hinted pass, then a cold clean pass 3 days later): in time order `assisted:1`; reversed `coldIndependent:1`.
- **Same scenario through the real `SyncEngine`**, with a store that returns rows in key order like IndexedDB:
  - Within the session the assisted result stayed counted in 400/400 runs.
  - After a simulated reload: 209/400 assisted and 191/400 cold.
- **Sim B** (pass in the same attempt as the reveal, then a Run-it-back pass, then a cold re-solve): the attempts classify as `revealed`, `reconstructed`, `retrieval`. In time order all four displayed tiles are 0.
- `revealed` is counted but never shown. `EvidenceSummary` has no field for it, and readiness-report.tsx:65-70 renders only 4 tiles.
- **The same-attempt flow is real:**
  - `viewSolution` (rep-workspace.tsx:617-623) and `watchWalkthrough` (610-614) save `{...a, solutionViewed: true}` on the current attempt.
  - `finish` spreads `...a` when it records the pass, so the flag stays.
  - Only `doRunItBack` (line 629: `attemptRef.current = null`) starts a fresh attempt.
- No test covers `evidenceSummary` or the upgrade behaviour: readiness.test.ts imports only `finalDecision`, `mockPolicy`, `readiness` and `transferGrade`. So §29's "later stronger evidence upgrades reporting" is untested.

Severity: §11 (FIX 4) explicitly requires that "later stronger evidence can upgrade the report", and §29 requires a test for it. Here the report stays tied to the first pass within a session and depends on arbitrary id order after a reload. That materially fails a V2.1 requirement, so major is correct for the evidence tiles as claimed. Corrected: Mostly correct. Three points need tightening, and one more affected path should be added.

1. **"Never upgrades" overstates it.** Which attempt counts depends on the order of the in-memory Map:
   - **Same session:** a later attempt made in the same session is added after the earlier one, so it never upgrades the result. My simulation through the real `SyncEngine` kept "assisted" in 400 of 400 runs.
   - **After a reload on a device with an IndexedDB cache:** the order is the sort order of the random UUID ids. That is unrelated to time, but it stays the same on later reloads. The stronger attempt is counted only by chance (191 of 400 runs).
   - **New device signed in to Supabase:** the rows arrive sorted by server `updated_at`, ascending, so the result is tied to the earliest-updated pass.
   - So the same history can show different tiles before and after a reload, and on different devices. Nothing implements "keep the strongest evidence".
2. **Sim A and Sim B are confirmed exactly.**
   - Sim A gives assisted 1 in time order and cold 1 in reverse order.
   - In Sim B the attempts classify as revealed, then reconstructed, then retrieval, and every displayed tile is 0, because `revealed` is counted but never shown.
3. **"Rebuilt after a solution is close to always 0" is too strong.** It is 0 in two cases:
   - The rebuild passes in the same attempt as the reveal. That is the flow the UI points to, at rep-workspace.tsx:617-623 and 610-614 together with the "Clear the editor and rebuild" button. That pass is `revealed`.
   - The learner uses Run it back in the same session. The revealed attempt was added first, so it takes the slot.

   It is not 0 when the reveal attempt never passed (abandoned, then a fresh attempt passed). That case gives `reconstructed:1`. It can also be non-zero by chance after a reload.

   The UI copy contradicts the scoring:
   - Line 1196 says "This rep now counts as assisted".
   - Line 1073 says "This pass earns partial credit; the cold re-solve in 3 days is the one that counts".
   - Line 1394 shows "+1 rep" on every pass.

   In practice, a pass made in the same attempt as the reveal is `revealed`. `qualifies()` returns false for it (credit.ts:66), so it earns no daily credit and appears in no readiness tile. The later cold re-solve is also dropped if the revealed pass comes first in the order.
4. **The same ordering problem affects mock gating.** `transferGrade` (readiness.ts:101-107) uses `as.find((a) => a.passed && a.completedAt)`, which is the first pass in array order. `InterviewCard` (course-cards.tsx:139-140) uses that grade to gate mocks.
   - I tested the 48 real `c13-transfer` reps, each with a hinted pass and then a slow clean pass a week later.
   - In time order the grade is red (0 of 48 independent).
   - In reverse order it is green (48 of 48 independent, `freshFull` 12).
   - So under principle 10 (mocks are readiness-gated), the gate can change on reload. Using the first attempt is defensible for transfer, but only if "first" means the earliest in time.
5. **Related §11 violation on the same lines.** readiness.ts:84 sets `coldIndependent: counts['cold-independent'] + counts.independent + counts.retrieval`, and readiness-report.tsx:66 shows it as 'Cold, independent'. §11 forbids exactly that merge.

**Already correct:**
- `masteryEvidence` (credit.ts:49-60) classifies each attempt correctly in isolation.
- `gateStatus` (routing.ts:81-94) sorts tries by time and accepts any clean pass, so gates, and the domain statuses built on them, do upgrade with later clean evidence.
- `recentAssistance` is computed over all recent passes, not just the first per rep.

### 6. [MAJOR] Most checkpoint evidence never reaches the evidence panel (63 of 120 checkpoint variants excluded) — CONFIRMED (severity keep)
- Spec: §11 'describe evidence accurately'
- Evidence: readiness.ts:72 `const full = (e?: Exercise) => Boolean(e && (e.repType === 'capstone' || e.transfer || e.gate || e.stage === 'pattern' || e.stage === 'interview'))`; readiness-report.tsx:77 'Full problems only: capstones, checkpoints, unlabeled and interview problems.'; data/course/gates.ts pools such as g-hashing `['o2-cold-letter-counts', ...]`
- Detail: The October cold reps used as checkpoint variants are 'cold/retrieval' reps without `gate: true`, so full() drops them. Every variant of g-hashing, g-fixed-window, g-variable-window, g-stack, g-search-invariant, g-safe-rewiring, g-tree-contract, g-grid, g-heap, g-backtracking and g-matrix is excluded, plus some variants of 8 others. Simulation: a clean cold pass on o2-cold-two-sum leaves every bucket at 0. The footnote claims checkpoints are included.
- Suggested fix: Count a rep as full when it is in a checkpoint pool: `|| Boolean(GATE_OF_EXERCISE[e.id])`. Alternatively, set `gate: true` on those pool reps. Add a test.
- Verifier: I could not refute this claim. I checked it against the code and by running the real functions.

1. The filter (lib/course/readiness.ts:72) is `const full = (e?: Exercise) => Boolean(e && (e.repType === 'capstone' || e.transfer || e.gate || e.stage === 'pattern' || e.stage === 'interview'))`. Line 76 then skips any pass where `!full(exercises[a.exerciseId])`. The only caller is components/use-course-day.ts:39, which passes `EXERCISE_BY_ID` from data/curriculum.ts:265. That map is built from MODULES, MOCK_EXERCISES and COURSE_SECTIONS (data/curriculum.ts:224-229). Nothing in it adds `gate: true` to pool members. The only flag it adds is `cleanPass`, for plan gate IDs, and `full()` ignores that flag.

2. I wrote a throwaway script (since deleted) that imported GATES, EXERCISE_BY_ID and the real `evidenceSummary`. It fed one clean cold pass on each of the 120 pool variants through the function:
   - total = 120, missing = 0, excluded = 63.
   - Every excluded variant is `repType=cold stage=retrieval gate=undefined transfer=undefined`.
   - All variants are excluded for 11 gates: g-hashing (8/8), g-fixed-window (2/2), g-variable-window (6/6), g-stack (2/2), g-search-invariant (6/6), g-safe-rewiring (3/3), g-tree-contract (5/5), g-grid (3/3), g-heap (7/7), g-backtracking (6/6) and g-matrix (4/4).
   - Some variants are excluded for 8 gates: g-pointer-mechanics 2/4, g-prefix-suffix 1/4, g-recursion 1/4, g-queue 1/3, g-graph-traversal 2/3, g-directed-cycle 1/3, g-intervals 1/3, g-dp 2/3.
   - A clean cold pass on o2-cold-two-sum returns `{"coldIndependent":0,"selfCorrected":0,"assisted":0,"reconstructed":0,"recentAssistance":0}`. The same pass on c1-g-countdown-steps (which has `gate: true`) returns coldIndependent 1.

3. Two texts say checkpoints are counted. The UI footnote at components/course/readiness-report.tsx:77 reads 'Full problems only: capstones, checkpoints, unlabeled and interview problems.' The doc comment at readiness.ts:70 says 'capstones, transfer reps, gate variants and Week 13 problems'. Both are false for 63 of the 120 variants.

4. The rest of the app does treat these reps as checkpoints. components/rep/rep-workspace.tsx:824-825 uses `const gateId = ex.gate || GATE_OF_EXERCISE[ex.id] ? ... ; const checkpoint = Boolean(ex.gate || gateId) && !passed`, so they run as bare checkpoints with no hints or solution. lib/course/routing.ts:82-92 (gateStatus) counts them toward clearing the gate. Only the evidence counters leave them out.

5. Routing makes the gap matter in practice. gateStatus serves never-tried variants in pool order (routing.ts:110, `available.indexOf(a)` tie-break). In 7 of the 8 mixed pools the October variant comes first. On the straight path where every attempt passes clean, 31 of the 59 clean passes needed to clear all 30 checkpoints never reach the counters.

Severity: major is right. This materially fails §11, 'The readiness report must describe evidence accurately', and the panel's own scope text is wrong. I did not raise it to critical. The error under-counts rather than inflating progress. The counters (`coldIndependent`, `selfCorrected`, `assisted`, `reconstructed`) are display-only: grep finds no consumer apart from readiness-report.tsx:66-69. The domain rows and the per-week checkpoint lists still reflect gate clearance through routing. Corrected: The claim is correct. Three points need tightening:

(a) Not every excluded variant is an October day rep. Several come from bridge packs that are attached to October modules: data/exercises/bridges/windows-search.ts (d4w-ck-*, d05s-ck-*), data/exercises/bridges/graphs-intervals.ts (d9h-c-*) and data/exercises/bridges/backtracking-matrix.ts (d10b-*, mx-c-*). In those packs the section carries `gate: true` (for example the 'd4w-check' section with `module: '2026-10-04'`), but the exercises themselves do not. All 63 excluded variants are older cold/retrieval reps without an exercise-level `gate: true`.

(b) The passes are missing only from the four counters. readiness.ts:81-82 computes `recentAssistance` over all passes without the `full()` filter, so these checkpoint attempts still feed the track's assistance ratio. Gate clearance in lib/course/routing.ts gateStatus also still drives the domain table and the per-week checkpoint lists in readiness-report.tsx:89-112.

(c) 'Most' is a bare majority: 63 of 120 variants (52.5%). On the routed straight path, 31 of the 59 clean passes needed to clear all 30 gates are dropped. The reason is that gateStatus serves untried variants in pool order and lists the October variant first in 7 of the 8 mixed pools.

Fix: test the gate pool in `full()`, e.g. `GATE_OF_EXERCISE[e.id]` from data/course/gates.ts:79, as rep-workspace.tsx:824 already does. Do not add `gate: true` to the old reps. Otherwise the footnote at readiness-report.tsx:77 and the comment at readiness.ts:70 have to stop saying checkpoints and gate variants are included.

### 7. [MAJOR] Labs, change requests and design artifacts never feed readiness; Software Building and Applied AI/FDE dimensions are missing — CONFIRMED (severity keep)
- Spec: §18 FIX 6; §9; §29 'lab evidence appears'
- Evidence: readiness.ts:26-42 DOMAINS (15 topic domains only); readiness.ts:141 `readiness(statuses, weekStatuses, evidence, today, extra: { transferGrade?, mocksDone? })` takes no lab input; use-course-day.ts:28 computes `labs` but line 40 does not pass them; lab-view.tsx:39 `{lab.aiFde && <p ...>Applied AI · FDE lane</p>}` is the only use of aiFde; data/course/content/labs-w9w13.ts:205,248 `aiFde: true`
- Detail: The code has 15 topic domains plus transfer and interview rows. Against §18: Programming Foundations ≈ foundations, Problem Solving ≈ decomposition, Core DSA is 13 separate rows with no aggregate, Software Building and Applied AI/FDE are missing, and Transfer and Interview are not wired. The lab build and change exercises are in no unit path, so labs do not affect unit or domain status even indirectly. Lab state (`lab:<id>` design answers, review checks, doneAt) is never read by readiness or finalDecision.
- Suggested fix: Add a Software Building dimension (required labs done, change requests passed, design and review artifacts present) and an Applied AI/FDE dimension (aiFde labs only, not blocking a general SWE result unless the target role requires it). Give each a why string, include them in the report and the card, and test that lab evidence appears.
- Verifier: Every cited line checks out. readiness.ts:26-42 defines exactly 15 topic DOMAINS. readiness.ts:141 takes no lab input. use-course-day.ts:28 builds `labs`, but line 40 calls `readiness(course.statuses, finished, ev, today)` with neither labs nor `extra`, and that is the only production call. finalDecision (readiness.ts:166-171) counts only `r.domains`. evidenceSummary's `full()` (readiness.ts:72) leaves out lab reps, which are stage/repType 'combine' with no gate or transfer flag. credit.ts:64 `if (!exercise || exercise.lab) return false` keeps labs out of credits, so they also stay out of the week statuses. In product code the only consumer of `aiFde` is lab-view.tsx:39; content.test.ts:49 also reads it. The 2 aiFde labs are at labs-w9w13.ts:205 and :248.

I ran a throwaway script through the real pipeline (computeAllMastery, courseStatus, evidenceSummary, readiness, finalDecision); it was deleted after running. 0 of the 46 lab build/change ids (23 labs) sit in a unit path or gate pool, and no unit references the sections 'labs-w1w2', 'labs-w3w8' or 'labs-w9w13'. With every path rep and gate variant passed, readiness comes out identical with no labs or with all 23 labs passed: track on-track, transfer 'building', interview 'not-tested', and finalDecision(green, 2) = 'ready'. So a learner can be told "Ready" with zero labs.

"Transfer and Interview not wired" is also confirmed. Because `extra` is never passed, r.transfer stays 'building' from Week 13 whatever the grade (readiness.ts:158). r.interview is always 'not-tested' (line 159), even after mocks. Meanwhile InterviewCard (course-cards.tsx:142) can show finalDecision 'Ready' next to those rows.

One sub-claim is wrong: "labs do not affect unit or domain status even indirectly". Lab attempts feed per-skill mastery, which has no lab exclusion (mastery.ts:94-96 `allAttempts.filter((a) => a.skills.includes(skillId) && countsAsEvidence(a))`). That mastery drives priorEvidence (routing.ts:132-133). From empty history, passing the labs moved 5 units to route 'focused' and 3 of them (w1-running-state, w2-contract, w2-testing) to state 'placement'. readiness.ts:49 treats 'placement' as untouched. Computed case: one rep touched in w2-contract plus the Week 1–2 labs flips the decomposition domain from developing ("4 checkpoints still to clear.") to not-started ("Not reached yet."). So labs do reach readiness, but only by accident and in the wrong direction.

Also, the readiness report does read lab state: readiness-report.tsx:88 calls labProgress, including doneAt, and lines 103-107 show ✓/— per lab for finished weeks. That is a weak form of "lab evidence appears", but it changes no readiness status. The claim stays major: §18's Software Building and Applied AI/FDE dimensions are absent and §29's "lab evidence appears" is unmet. That is a material V2.1 failure, not a violation of a non-negotiable principle. Corrected: Largely correct, with three corrections.

1. Lab completion never feeds readiness. readiness() (lib/course/readiness.ts:141) and finalDecision() (lines 166-171) take no lab input. The only production call, components/use-course-day.ts:40 `readiness(course.statuses, finished, ev, today)`, ignores the `labs` computed at line 28 and passes no `extra`. There is no Software Building or Applied AI/FDE row, only 15 topic domains (lines 26-42) plus fixed transfer and interview rows. finalDecision gives 'ready' with zero labs; computed: all path reps and gates passed, no labs, gives 'ready', the same as with all 23 labs passed. On the Progress page, components/progress-view.tsx:69-75 shows no builds-completed totals, junior SWE or AI/FDE. In product code `aiFde` is read only at components/course/lab-view.tsx:39 (also asserted in lib/course/content.test.ts:49).

2. Transfer and interview are not wired. Because `extra` is never passed, r.transfer is 'building' from Week 13 whatever the grade (readiness.ts:158), and r.interview is always 'not-tested' (line 159), even after mocks. Meanwhile InterviewCard (components/course/course-cards.tsx:142) can show finalDecision 'Ready' alongside them.

3. Two wrong statements in the claim:
   - "Labs do not affect unit/domain status even indirectly" is false. Lab build/change attempts feed skill mastery, which has no lab exclusion (lib/mastery.ts:94-96). That mastery drives priorEvidence (lib/course/routing.ts:132-133), which sets route 'focused' and state 'placement' (lines 155, 164). readiness.ts:49 treats 'placement' as untouched, so passing labs can push a domain backwards. Computed: one w2-contract rep plus the Week 1–2 labs turns decomposition from developing ("4 checkpoints still to clear.") into not-started ("Not reached yet.").
   - "Lab state is never read" is only true of readiness() and finalDecision(). The readiness report reads `lab:<id>` through labProgress (components/course/readiness-report.tsx:88) and shows ✓/— per lab for finished weeks (lines 103-107), but this feeds no status, track or decision.

The one V2 link from labs to a readiness input is also dead. week-status.ts:78 downgrades a finished week with a missing lab, but use-course-day.ts:34 passes no lab counts. Even with counts, `ended` (week-status.ts:69, `today > dates[6]`) is false when today = weekDates(n)[6]. Computed: Week 3 with 0/2 labs reads on-track as of 2026-11-15 and recoverable only from 2026-11-16.

### 8. [MAJOR] A lab can be marked 'done' after revealing the solution and writing placeholder design text — CONFIRMED (severity keep)
- Spec: §18 (evidence quality); principle 6
- Evidence: lib/progress.ts:17 passedSet keeps passes made with the solution shown unless the exercise has `cleanPass`, and none of the 46 lab exercises has it; rep-workspace.tsx:825 `const checkpoint = Boolean(ex.gate || gateId) && !passed` and :1489 `{!solutionShown && !checkpoint && <MenuItem onClick={viewSolution}>` so 'Show solution' is offered on lab reps; lib/course/labs.ts:24 `(state?.design[i] ?? '').trim().length >= 3`; lab-view.tsx:100-106 done message 'You designed it, built it and changed it'
- Detail: A lab can reach DONE when the build and change request were passed in attempts where the solution was shown, the design answers are 3 characters each, and the review boxes are ticked by the learner. Labs already count toward week completion and momentum. Wiring them into Software Building readiness as they stand would let assisted work look like independent work.
- Suggested fix: Classify lab build and change passes with masteryEvidence and require non-revealed passes to count as Software Building evidence, or record an assisted level. Add a minimal content check on design answers.
- Verifier: I could not refute the claim. Every cited line matches the code, and I reproduced the scenario with the repo's own functions.

1. Pass filter (lib/progress.ts:17). `passedSet` drops a solution-viewed pass only when the exercise has `cleanPass`: `!(a.solutionViewed && EXERCISE_BY_ID[a.exerciseId]?.cleanPass)`. In ALL_EXERCISES there are 46 `lab:true` exercises, which is 23 labs times one build and one change request. None of them has `cleanPass` or `gate`, none is in GATE_OF_EXERCISE, and all 46 ship a `solution`. Only plan-gate reps get `cleanPass` (data/curriculum.ts:226).

2. Solution offered on lab reps (components/rep/rep-workspace.tsx). Line 825 sets `checkpoint = Boolean(ex.gate || gateId) && !passed`, which is false for lab reps. So line 1489, `{!solutionShown && !checkpoint && <MenuItem onClick={viewSolution}>`, shows 'Show solution' in every mode, Interview included. `viewSolution` (lines 617-623) stores `solutionViewed: true` on the attempt. `finish` (around line 460) then spreads that attempt into a `passed:true, completedAt` row, and `recordAttempt` (lib/storage/repository.ts:103) keeps the flag. Nothing in the rep page treats labs differently: `labOf` at line 829 only renders a "Part of the lab" note.

3. Lab finish check (lib/course/labs.ts:24-29). A design answer counts once it is 3 non-blank characters (`trim().length >= 3`). The build and the change only need to be in `passedSet`. Review only needs every box ticked.

4. Reproduction. I ran a throwaway script, since deleted, through the real `passedSet` and `labProgress` on LABS[0]. The build and change passes had `solutionViewed:true`, every design answer was "abc", every review box was ticked and `doneAt` was set. The result was `{designDone:true, buildPassed:true, changePassed:true, reviewDone:true, canFinish:true, done:true}`. lab-view.tsx:101 then shows "Done. You designed it, built it and changed it when the requirements moved."

5. Downstream effects are real:
- **Course card:** shows "Done" with a check (course-cards.tsx:57-65).
- **Week status:** an ended week stays 'on-track' only if labs are done (week-status.ts:78, via use-course-day.ts:32).
- **Readiness report:** the "Week N complete" flag and the ✓ next to each lab depend on lab done (readiness-report.tsx:88-114).
- **Momentum:** each done lab adds 0.05, capped at 0.2 (week-status.ts:136, via use-course-day.ts:50).

6. This contradicts the product's own evidence rule. lib/course/credit.ts:51 returns 'revealed' for a solution-viewed pass, documented at line 32 as "No credit". `qualifies` requires `!a.solutionViewed` (line 66). The V2 master spec says a revealed solution "cannot immediately become independent mastery". The lab path skips all of this by using `passedSet`. No unit or e2e test covers it: e2e/course.spec.ts:105-119 only checks the not-done state.

Severity: major is right. The DONE banner and the week-complete flag present solution-assisted builds as finished composition, which touches principles 6 and 12, so this is close to critical. But today the effect is limited to lab, week and momentum displays. Labs do not yet feed any readiness verdict. lib/course/readiness.ts has no lab input. `evidenceSummary` (readiness.ts:72) ignores lab reps because they are stage 'combine', and credit.ts:64 gives lab reps no daily credit. So the readiness risk is about the §18 wiring that still has to be built, as the auditor says. Corrected: The claim is accurate. Minor corrections and additions:

(a) The done message is on lab-view.tsx:101. Lines 105-106 are the 'Mark the lab done' button, which needs `canFinish`. `done` is recomputed as `Boolean(state?.doneAt) && canFinish` (labs.ts:29).

(b) Assistance on lab reps goes beyond 'Show solution':
- The solution is rendered as a plain, selectable `<pre>` (code-view.tsx:22), so it can be copy-pasted.
- 'Look again' re-shows it as often as the learner likes (rep-workspace.tsx:1178-1184).
- Hints are unrestricted outside Interview mode, because `bare` is false, and `passedSet` ignores `hintsUsed`.

(c) Each lab has 6-8 design questions. Each answer passes at 3 trimmed characters, although the UI asks for "A sentence or two each" (lab-view.tsx:55). Review is pure self-attestation (lab-view.tsx:91), including items like "Edge cases tested: …" that the app never checks.

(d) 'Week completion' covers three effects:
- week-status.ts:78 keeps an ended week at 'on-track' rather than 'recoverable' only when labs are done.
- The readiness report's `complete` flag, its ✓ per lab and the 'week-complete' celebration all need labs done (readiness-report.tsx:88-114). The message text itself does not mention builds.
- Momentum gets a +0.05 bonus per done lab in the current week, capped at 0.2 (week-status.ts:136).

(e) Labs currently feed no readiness verdict and earn no daily credit (credit.ts:64, readiness.ts:72). The Software Building risk applies once §18 is implemented.

(f) This is inconsistent with lib/course/credit.ts:51/66, which classifies a solution-viewed pass as 'revealed', with no credit. A correct fix should judge the lab build and change by `masteryEvidence`/`gateClean`, or by a later reconstruction, rather than by `passedSet`. It should also show assisted lab completion as assisted, not as unqualified DONE.

### 9. [MAJOR] Today, Week, Course and Readiness use inconsistent inputs; the 'missing lab or checkpoint' rule never fires — CONFIRMED (severity raise)
- Spec: §26; §7; §8 acceptance
- Evidence: week-status.ts:69 `const ended = today > dates[6]` and :78 `if (ended && status === 'on-track' && (...labsDone < labsRequired || gatesCleared < gatesRequired)) status = 'recoverable'`; use-course-day.ts:34 `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status` (today = Sunday, no extras); readiness-report.tsx:87 same call, while :90 computes `complete` with labs and gates and :97 prints WEEK_STATUS_LABEL[p.status]; road-map.tsx:24 complete = every unit ready; road-map.tsx:62 `weekProgress(w.number, today, byDate)` (no extras); readiness.ts:145-152 track from the unit frontier
- Detail: There are three definitions of a complete week:
- road map: every unit of the week ready;
- 'Weeks so far': output + labs + gates;
- weekProgress: output only.
With the current callers, the lab/gate rule in weekProgress can never fire. Simulation H: a week with full output but 0/2 labs and 0/3 checkpoints is 'on-track'. 'Weeks so far' therefore shows 'ON TRACK' next to unfinished builds and checkpoints, and the readiness track never sees missed required work. Credits can also come from 74 qualifying reps outside every unit (and from repeats on later days). Simulation K: every week is On track while the readiness track is 'Off track: The course is 3 weeks behind the calendar.' The levels contradict each other instead of each deriving from the one below.
- Suggested fix: Write one week-contract function (output + required labs + required checkpoints + required targets). Use it for WeekCard, 'Weeks so far', the road map and readiness.finished. For finished weeks, evaluate it as ended (pass a date after the week's Sunday).
- Verifier: I could not refute the core of the claim. I read every caller end to end and computed the cases with throwaway scripts in scripts/_audit_skeptic_*.ts, each deleted straight after running. The working tree is clean.

1. Dead rule. week-status.ts:78 only runs when `ended` is true (:69 `const ended = today > dates[6]`).
   - use-course-day.ts:32 passes the labs and gates, but `today` is always inside the current week. Across the course I found 0 days where `ended` is true.
   - use-course-day.ts:34 and readiness-report.tsx:87 pass the week's own Sunday, `weekDates(n)[6]`, which makes `ended` false. They pass no labs or gates either.
   - road-map.tsx:62 passes nothing extra and only reads `wp.done`.
   - The unit test (week-status.test.ts:42) only passes because it uses the Monday after the week, which no caller does.
   - Sunday and Monday-after give the same status in every case without labs and gates (0 mismatches), so the only thing the Sunday date switches off is the lab/checkpoint rule.
   - One exception: from 2027-02-01, courseWeekOf returns 15 and use-course-day.ts:26 falls back to `WEEK_BY_NUMBER[1]`. Today then evaluates week 1 with `ended` true. This only happens after the course.

2. Simulation H reproduced. Weeks 3, 4 and 8 each have 2 required labs and 3 checkpoints that are live (their rep pools exist). With full output and none of them done, the status is 'on-track' as every caller computes it. Weeks 1 and 2 behave the same.

3. Simulation K reproduced exactly. With attempts=[], every training day at target and today=2026-11-16:
   - finished weeks: on-track, on-track, on-track;
   - readiness track: off-track, because 'The course is 3 weeks behind the calendar.'
   It also happens without unusual input. A learner who follows Today's course queue exactly and hits every daily target gets:
   - Week 1: 50/50 'On track', 0/5 units ready, 0/4 checkpoints;
   - Week 2: 60/60 'On track', 0/6 units ready, 0/5 checkpoints;
   - readiness 'at risk' (1 week behind) on Nov 2 and 'off track' (2 weeks behind) on Nov 9.
   On Today, the WeekCard says "On track for February 1 if this output continues" (motivation.ts:122) right next to a ReadinessCard that says 'Off track'.

Overstatements, corrected in correctedDetail:
- "The readiness track never sees missed required work" is wrong. It does see checkpoints that are not cleared, indirectly: through how far behind the earliest unfinished unit is, and through the count of failed checkpoints. That is why Simulation K reports '3 weeks behind'. What it never sees is missed labs: routing.ts and readiness.ts take no lab input.
- The "74" figure is inflated. 74 reps are outside every unit's sections and optional sections, but 68 of them are checkpoint variants that belong to a unit through its gate. Only 6 belong to no unit.
- road-map.tsx:62 does not affect the status; the road map's mismatch comes from weekState.

Severity: raise to critical. The product shows 'On track' for finished weeks whose required builds and checkpoints are missing, which breaks the code's own contract ('nothing required is overdue'), §7 and §8's "No '50/50 but still not actually done'". It also gives opposite Feb 1 verdicts on the same Today page. That falls under non-negotiable principle 12 (be truthful about progress) and the rubric's "makes the product untruthful".

Separate bug found while checking this (not part of this claim; please verify and file it):
- In routing.ts, a unit with no checkpoint switches to the 'focused' route once 40% of its reps are passed (:131, :155).
- The focused route drops lesson-level reps not yet passed from the path (:157), so courseQueue never offers them (:218).
- But the unit only counts as ready when the full rep list is passed (:148 `const pathDone = full.every(...)`, :154).
- Simulated, w1-state-while sticks at 16/16 forever: c1-while-fill-change and d05-while-halve are never offered. Everything that depends on it stays locked. Today then serves only w2-hashing reps until the queue runs dry in week 3 (19/75). Corrected: The claim is mostly correct. The accurate version:

(1) The lab/checkpoint rule in lib/course/week-status.ts:78 needs `ended` to be true (:69 `const ended = today > dates[6]`). With the current callers, it never fires during the course (2026-10-26 to 2027-01-31):
- components/use-course-day.ts:32 passes labs and checkpoints, but `today` is always inside the current week (0 course days have `ended` true).
- use-course-day.ts:34 and components/course/readiness-report.tsx:87 call `weekProgress(n, weekDates(n)[6], credits)`. Sunday makes `ended` false, and no labs or checkpoints are passed.
- The only exception is after the course: from 2027-02-01 Today falls back to `WEEK_BY_NUMBER[1]` (use-course-day.ts:26) and evaluates week 1 with `ended` true.
- The unit test at week-status.test.ts:42 only passes because it uses the Monday after the week, which no caller does.

(2) Computed results:
- Weeks 3, 4 and 8 (2 required labs and 3 checkpoints each), and weeks 1 and 2, with full output and 0 labs and 0 checkpoints, are 'on-track' as every caller computes them.
- Simulation K (no attempts, every training day at target, today 2026-11-16) gives finished weeks on-track, on-track, on-track and track 'off-track' with why = ['The course is 3 weeks behind the calendar.'].
- A learner who follows Today's queue exactly ends Week 1 at 50/50 'On track' with 0/4 checkpoints and 0/5 units ready, and Week 2 at 60/60 'On track' with 0/5 checkpoints and 0/6 units ready. Meanwhile readiness reads at-risk on Nov 2 and off-track on Nov 9.

(3) The pages disagree on what a finished week means:
- Road map (road-map.tsx:24): 'complete' when every unit is ready. A unit is ready when its live checkpoints are cleared, or when its whole rep path is passed if it has none (routing.ts:154). Output and labs are ignored.
- 'Weeks so far' (readiness-report.tsx:90): complete = output + required labs + all live checkpoints. It ignores the rep paths of units that have no checkpoint.
- Week status: output only.
- Today's 'Day complete' is also output only (course-today.tsx:68 `const complete = day.type === 'training' && done >= target`).
- readiness-report.tsx:97 prints 'On track' (shown upper-case) next to the '—' rows for unfinished labs and checkpoints (:103-112).
- On Today, WeekCard (course-cards.tsx:35; motivation.ts:122 "On track for February 1 if this output continues.") sits beside ReadinessCard showing 'Off track'.
- road-map.tsx:62 only reads `wp.done`. The road map's mismatch comes from weekState, not from the missing lab and checkpoint arguments.

(4) Overstated: readiness (readiness.ts:145-152) does see checkpoints that are not cleared, indirectly. It does this through behindWeeks (how far the earliest unfinished unit lags the calendar) and through the count of failed checkpoints, which is why Simulation K reports '3 weeks behind'. Two things it never sees:
- missed labs: there is no lab input in routing.ts or readiness.ts;
- any missed lab or checkpoint through its week input, because lastFinishedWeek is the output-only status.

(5) Overstated number: 74 qualifying reps are outside every unit's sections and optional sections. 68 of these are checkpoint variants that belong to a unit through gate.unitId. Only 6 are outside every unit: mock-1-a, mock-1-b, mock-2-a, mock-2-route, mock-2-routes and d3-cold-last-k. The underlying point still holds: credit (credit.ts:95-110) does not care which week the work belongs to. These all count:
- any unit's reps, for example w2-hashing, a 125-rep path with no prerequisites that is open from day one;
- warm-up and cold-review repeats on later days (the once-per-rep rule resets each day);
- logged outside LeetCode problems.

(6) Week 1 alone shows the mismatch: its required path is 65 reps plus 8 checkpoint passes against a target of 50, and checkpoints are only queued once a unit's path is done (routing.ts:220-221). So '50/50 On track' with checkpoints and labs unfinished is the normal outcome.

Severity: critical, under principle 12 and §7/§8 ('No "50/50 but still not actually done"').

### 10. [MAJOR] Readiness track ignores cold evidence; the assistance metric is mis-scoped and contradicts its own comment — CONFIRMED (severity keep)
- Spec: §11; master §38 (AT RISK: 'cold evidence is insufficient')
- Evidence: readiness.ts:151-152 use only `evidence.recentAssistance` from the evidence; :157 `why.push('Output, checkpoints and independence are where the plan needs them.')`; :66 comment 'Share of passes in the last 7 training days that needed hints or a reconstruction'; :80-82 `Date.parse(today) - 9 * 86_400_000` ... `recent.filter((a) => a.hintsUsed > 0 || a.solutionViewed)`; :148 only the last finished week
- Detail: Simulation J: 0 cold passes, 40 assisted, 20 reconstructed and 39% recent help gives 'on-track', and the why line claims independence is where the plan needs it. recentAssistance:
- counts every pass of any rep kind, including recognition and learn reps;
- covers 10 calendar days rather than 7 training days;
- does not count reconstructions. Simulation 3: viewing the solution, then rebuilding in a new attempt, gives recentAssistance 0.
Earlier off-track weeks are forgotten after one week.
- Suggested fix: Add a cold-evidence sufficiency check (cold independent full problems relative to course position) that sets at-risk. Compute assistance on full or production problems, counting reconstructions and revealed passes as help, over training days. Only claim independence when cold evidence supports it.
- Verifier: I read readiness.ts, credit.ts, routing.ts, week-status.ts, use-course-day.ts, course-cards.tsx, readiness-report.tsx and the reveal and run-back code in rep-workspace.tsx. I also ran a throwaway tsx script against the real modules; it was deleted straight after.

What holds:
- Lines 151-152 read only `evidence.recentAssistance` from the evidence summary. Setting coldIndependent to 100 or to 0 gives the same track.
- Simulation J reproduces at 2026-10-26 and at 2026-10-30. Both give on-track, with the why line 'Output, checkpoints and independence are where the plan needs them.' (:157). Zero evidence gives the same result.
- A realistic week-3 history also gives on-track with that line. In it, the week 1-2 gates are cleared clean, 18 of 26 recent full-problem passes were hinted or rebuilt after a reveal, and 15 learn reps were passed clean. recentAssistance comes out at 0.21.
- The Today ReadinessCard shows `{r.why[0]}` at course-cards.tsx:107. This breaks the §11 rule 'no stronger language than the evidence supports'. Nothing implements the master §38 AT RISK rule 'cold evidence is insufficient', even though the function's own doc comment at :138 promises 'or not enough cold evidence'.
- The recentAssistance code contradicts its comment at :66:
  - the window is 10 calendar days;
  - it counts every pass of every exercise;
  - its help test is `hintsUsed > 0 || solutionViewed`, which never counts a reconstruction pass.
- Simulation 3 reproduces: the pass is classed 'reconstructed', the summary shows reconstructed 1, and recentAssistance is 0.
- :148 looks only at the last finished week.

Severity: I keep it at major. It is close to critical, because the Today card states independence that has not been measured. But the curriculum position (behindWeeks) does depend on clean cold gate passes, so the headline is not entirely without evidence.

Where the claim is overstated or narrower than stated:
- 'Ignores cold evidence' is too strong. Cold evidence reaches the track indirectly, through gate clearance and failed gates.
- Simulation 3 needs the reveal attempt to have failed.
- 'Forgetting earlier weeks' is weak as a defect, because the spec's off-track rule is about entering the next week. Corrected: The claim stands, with these corrections.

1. **The track never reads the cold-evidence counts.**
   - coldIndependent, selfCorrected, assisted and reconstructed never affect the track (readiness.ts:151-152).
   - Nothing implements master §38's AT RISK 'cold evidence is insufficient', although the doc comment at :138 says 'or not enough cold evidence'.
   - Cold evidence does reach the track indirectly. Gates are cold reps with no hints and no solution, and they need gateClean passes. Cleared gates make units ready, which drives behindWeeks (:145-146); failed gates count as `blocked` (:147).
   - Simulation J reproduces at 2026-10-26 and 2026-10-30. A realistic week-3 history also gives on-track: week 1-2 gates cleared clean, 18 of 26 recent full-problem passes hinted or rebuilt after a reveal, plus 15 clean learn reps, so recentAssistance is 0.21.
   - Today shows the false why line through course-cards.tsx:107 `{r.why[0]}`.
   - A related undercount: 63 of the 120 gate-pool reps that exist are not 'full' (readiness.ts:72), so clean cold passes on them never reach coldIndependent.

2. **recentAssistance contradicts its comment at :66.**
   - **Window:** it covers today-9 through today, which is 10 calendar days, not 7 training days. That window holds 6-8 training days in a normal week (Mon 6, Tue 7, Wed-Fri 8, Sat 7, Sun 6). Around the holidays it holds 5 (on 2026-12-28) or 4 (on 2027-01-04).
   - **Scope:** it counts every passed attempt of every exercise: choice, recognize and trace reps, lab parts, and repeated passes of the same rep. The full-problem counts beside it are de-duplicated per rep.
   - **Dilution example:** 5 hinted full problems plus 10 clean learn reps gives 0.33, so the track says on-track while the full-problem help share is 100%.

3. **Reconstructions are never counted as help.**
   - The help test `hintsUsed > 0 || solutionViewed` only catches the attempt in which the solution was revealed.
   - Simulation 3 (result 0) holds only when that reveal attempt did not itself pass: reveal, leave, then pass in a new attempt.
   - In the normal in-page flow, viewSolution (rep-workspace.tsx:618-625) keeps the same attempt open and resets the editor. That attempt can pass with solutionViewed=true, so it counts as help.
   - Each 'Run it back' after that (:628-629 starts a new attempt) is counted as unassisted. The share drops from 1/2 = 0.5 to 1/3 = 0.33, and credit.ts:54-59 even classes the second run-back as 'independent'.
   - So reconstructions lower the metric rather than raise it.

4. **Only the last finished week counts (:148).**
   - It is true that an earlier off-track week stops mattering after one week. This is weak as a defect: §38's OFF TRACK is 'unfinished entering the next week', and the weekly model carries nothing over.
   - A sharper related bug: use-course-day.ts:34 builds finished-week statuses with `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate)`. It passes no labs or gates, and because today equals dates[6], `ended` is false.
   - So a finished week missing a required lab still reads on-track, contrary to docs/reps-2.md:41, and the why line 'Output … where the plan needs them' overstates that as well.

### 11. [MAJOR] Mastery and freshness are not separated in any user-facing report — CONFIRMED (severity keep)
- Spec: §9 'MASTERED·FRESH, MASTERED·STALE, DEVELOPING'; master §37 (mastery, freshness)
- Evidence: readiness.ts:51 `const stale = ready.length === us.length && us.some((u) => u.state === 'maintenance')`; readiness-report.tsx:47 `{d.stale && <span ...>· stale</span>}`; course-cards.tsx:109-113 (no stale shown); lib/training-state.ts:10-11 'Mastery ... never decays'; lib/mastery.ts:153-167 statusFor has no time component; skill-detail.tsx:83 'Last practiced'; routing.ts:160-162 lastActive = any attempt and `> 14 ? 'maintenance'`; training-state.ts:61-72 freshnessOf (productive passes only)
- Detail: The only signal is a '· stale' tag on fully-ready domains in the Progress report. Today's card drops it, the Skills pages show mastery with no freshness, and skill mastery is never used by readiness. Unit staleness follows a different rule from the skill freshness model: any attempt counts, including a failed one or one that only viewed a solution. Simulation M: a stale hashing domain becomes fresh when the learner merely views a solution on one rep. The stale 'why' text says 'it comes back as retrieval', but routing.ts:224-225 schedules only LeetCode targets for ready or maintenance units.
- Suggested fix: Derive freshness from training-state's freshnessOf (productive passes only) for skills and units. Show MASTERED·FRESH / MASTERED·STALE / DEVELOPING in Progress and in the readiness card. Schedule real retrieval for stale mastered units, or drop the claim.
- Verifier: Every code citation checks out. I also ran a simulation with a throwaway script, scripts/_audit_freshness_m.ts, deleted right after; git status is clean. Two parts of the claim go too far.

VERIFIED:
- readiness.ts:51 `const stale = ready.length === us.length && us.some((u) => u.state === 'maintenance')`.
- readiness-report.tsx:47 `{d.stale && <span ...>· stale</span>}`.
- The Today ReadinessCard (course-cards.tsx:109-114) renders only `DOMAIN_LABEL[d.status]`, with no stale marker.
- The Skills pages show no fresh/stale classification. skills-view.tsx:141-146 shows score, StatusLabel and evidence text. skill-detail.tsx:58-63 and 81-84 show the score plus the raw "Next review" and "Last practiced" dates.
- training-state.ts:10-11 says mastery "never decays". mastery.ts:153-167 statusFor has no time term.
- routing.ts:160-162 takes lastActive from ANY attempt on the unit's reps or gate pool and applies a fixed `> 14` day rule. freshnessOf (training-state.ts:44-73) counts only productive passes, with a window of 3 to 30 days that depends on clean cold reps.
- Domain status uses only unit states (readiness.ts:46-59). Skill mastery feeds only placement (routing.ts:130-134).

SIMULATION:
- Setup: all 125 w2-hashing path reps plus 3 g-hashing variants passed clean and cold on 2026-11-20. Checked on 2026-12-15 (25 days later).
- Result: unit = maintenance, hashing = ready, stale = true. All 4 hashing skills are stale by freshnessOf. The course queue for the unit holds only problem:217, 242, 1, 49 and 128.
- Simulation M: add one solution-view-only attempt today on o2-bookends. This is exactly what viewSolution() persists at rep-workspace.tsx:620-624: passed=false, no completedAt. The unit becomes ready and stale = false, with why = "Every checkpoint cleared, cold." All 4 skills are still stale by freshnessOf. Confirmed.
- The same flip happens with a failed-only attempt and with a hint-only attempt (countHint persists at rep-workspace.tsx:567-570).
- At 14 days the domain is not stale while all 4 skills already are. In the other direction, a clean cold frequency_map rep from outside the unit (d3-warm-char-counts) makes that skill fresh but leaves the domain stale. The two models disagree both ways.

WHERE THE CLAIM GOES TOO FAR:
1. The headline says mastery and freshness are "not separated in any user-facing report". In fact the readiness report does split each domain three ways: READY, READY · stale and DEVELOPING. The claim's own detail admits this. It is also wrong that this is "the only signal": the Plan page's Road to Ready (road-map.tsx:21 and 94, rendered by plan-view.tsx:48-55) labels units "Ready" or "Maintenance" using the same 14-day rule.
2. "Comes back as retrieval": courseQueue does add only LeetCode targets for ready or maintenance units (routing.ts:216-225), so the maintenance state triggers no retrieval. But retrieval does exist on Today through the separate spaced-review queue:
   - use-today-plan.ts:79 builds `cold` items via buildReviewSession(dueReviews(reviews)), shown as "Retrieve · Cold rep" (course-today.tsx:37-42 and 57).
   - The planner adds warm-ups for stale skills (session-planner.ts:145-171).
   - Neither reads the unit's staleness, and neither reliably clears it (the M5 case above).
   - The spaced-review queue retires a skill after 5 clean cold steps (schedule.ts:55-58 and 111-116). It schedules nothing after LAST_DAY = 2027-01-09 (curriculum.ts:219), although the course runs to 2027-01-31.
   So the copy makes a promise the unit-state logic doesn't keep, but retrieval itself is not entirely absent.
3. Minor nuance: isProductive (training-state.ts:30-32) does not exclude a pass made after viewing the solution in the same attempt.

SEVERITY: keep major. V2.1 §9 requires a separate MASTERED·FRESH / MASTERED·STALE / DEVELOPING view, and only a faint domain-level suffix exists. That suffix uses a rule that contradicts the code's own model ("only producing it does", training-state.ts:65-69), and non-productive activity can reset it. This is a truthfulness concern under principle 12, but a narrow one: READY itself is still backed by cleared gates. So it is not critical. Corrected: Mastery and freshness are split only at the domain level, and the freshness half is computed wrongly.

What exists:
- The Progress readiness report shows each domain as READY, READY · stale or DEVELOPING. The stale part is a faint suffix (readiness-report.tsx:45-47).
- The Plan page's Road to Ready labels units "Ready" or "Maintenance" (road-map.tsx:21 and 94).
- Both come from the same unit rule in routing.ts:160-162: a ready unit becomes 'maintenance' when its most recent attempt of ANY kind is more than 14 days old.

What is missing:
- There is no per-skill MASTERED·FRESH / MASTERED·STALE / DEVELOPING view anywhere, as V2.1 §9 and master §33/§37 require.
- Today's ReadinessCard drops the stale marker (course-cards.tsx:109-114).
- The Skills pages show mastery status and score, plus raw "Last practiced" and "Next review" dates, with no fresh/stale label (skills-view.tsx:141-146; skill-detail.tsx:58-63 and 81-84).
- Mastery has no time term (mastery.ts:153-167).
- Domain readiness ignores skill mastery and skill freshness (readiness.ts:46-59).

The unit rule contradicts the skill freshness model (training-state.ts:44-73, productive passes only, a 3 to 30 day window):
- Simulated (125 path reps plus 3 gate variants passed clean on 2026-11-20, checked on 2026-12-15): a stale hashing domain flips to non-stale, "Every checkpoint cleared, cold.", after one solution-view-only attempt, one failed-only attempt or one hint-only attempt on a unit rep. All four hashing skills stay 'stale' under freshnessOf.
- At 14 days the domain is not stale while all four skills already are.
- A clean cold frequency_map rep from outside the unit's sections makes that skill fresh but leaves the domain stale.

The domain's stale text promises "it comes back as retrieval", but the maintenance state schedules only LeetCode targets (routing.ts:216-225; simulated queue: LC 217, 242, 1, 49 and 128). Some retrieval does happen on Today, through a separate route:
- The spaced-review queue adds "Cold rep" items (use-today-plan.ts:79; course-today.tsx:37-42) and the planner adds stale-skill warm-ups (session-planner.ts:145-171).
- That route is not tied to unit or domain staleness.
- It retires a skill after 5 clean cold reviews (schedule.ts:111-116).
- It schedules nothing after LAST_DAY = 2027-01-09 (schedule.ts:55-62; curriculum.ts:219), although the course runs to 2027-01-31.

### 12. [MAJOR] Today's readiness card shows only the first five started domains and hides weaker later ones — CONFIRMED (severity keep)
- Spec: §11 readiness principles; principle 12
- Evidence: course-cards.tsx:96 `const shown = r.domains.filter((d) => d.status !== 'not-started').slice(0, 5)`; course-cards.tsx:107 `{r.why[0]}`
- Detail: Domains are listed in teaching order, so from Week 6 onward the card shows the oldest domains, which are the most likely to be ready. Simulation L (Week 8, recursion gate-blocked): the card shows five READY rows (foundations, decomposition, hashing, pointers, windows) and hides 'Recursion: DEVELOPING'. No per-domain reason is shown.
- Suggested fix: Show blocked and developing domains first (with their why text), then a count of ready domains. Alternatively, show the aggregate §18 dimensions.
- Verifier: The cited code is accurate. In /Users/ruggudile/Desktop/Projects/reps/components/course/course-cards.tsx:96, `const shown = r.domains.filter((d) => d.status !== 'not-started').slice(0, 5)`, and line 107 renders only `{r.why[0]}`. Lines 109-114 render `{d.title}` and `{DOMAIN_LABEL[d.status]}` only, so neither d.why nor d.stale appears on the card. The domains come from the DOMAINS constant in /Users/ruggudile/Desktop/Projects/reps/lib/course/readiness.ts:26-42, which is in teaching order (`const domains = DOMAINS.map(...)`, line 143). The card is rendered on Today unconditionally: course-dashboard.tsx:74 `<ReadinessCard cd={cd} />`, reached via dashboard.tsx:52 from COURSE_START onwards.

The other auditor's simulation (scratchpad audit/readiness_audit2.ts #5) set unit states by hand and marked w7-trees 'ready' while w6-recursion was gate-blocked. That cannot happen, because w7-trees has `prerequisites: ['w6-recursion']` (data/course/units.ts:351). I rebuilt the scenario from real attempts: clean cold gate passes for weeks 1-6, recursion's checkpoint passed only with hints, and today set to 2026-12-17 (Week 8). The script ran from scripts/ and was deleted; output is in /private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/skeptic_rcard_out.txt. The result matches the claim:
- Badge: OFF TRACK.
- Line shown: "The course is 2 weeks behind the calendar." The second reason, "1 checkpoint not yet cleared.", is r.why[1] and is not shown.
- Rows shown: foundations, decomposition, hashing, pointers and windows, all READY. All five are actually stale by Week 8, but the card drops the stale marker.
- Rows hidden: stacks, search and lists (READY) and recursion (DEVELOPING, "Needs one clean checkpoint: recursion.").

The truncation also starts earlier than the claim says. For a learner on pace, the card is cut off from mid-Week 4, when stacks (still developing) is hidden. From Week 5 on, the five rows are always the same five oldest domains, and every domain still in progress is hidden: search and lists in Week 5, lists and recursion in Week 6, trees in Week 7, graphs in Week 8. After Week 4, ten of the 15 domains can never appear on the Today card.

Some things soften the impact:
- The badge does turn At risk or Off track whenever any gate is blocked (readiness.ts:151-152).
- The full report at /progress#readiness (readiness-report.tsx:36-50) lists every domain with d.why and a "· stale" marker. So §11's requirement that each domain's status be explained is met by the report; the gap is in the Today summary.
- Today's header names the current unit (course-today.tsx:181-184; use-course.ts:23 picks w6-recursion in this scenario).

Even so, the card is a "Feb 1 readiness" read on Today, and §3 names "Readiness lives in Progress" as fragmentation that V2.1 must fix. For most of the course this card structurally favours the oldest, strongest domains, shows READY for stale domains, and hides the reason for being blocked. That works against §11's "no stronger language than the evidence supports" and principle 12 (truthful about progress). Each row is individually true and the badge is truthful, so this is major rather than critical. Corrected: The claim is correct, with two corrections and some added context.

ReadinessCard (/Users/ruggudile/Desktop/Projects/reps/components/course/course-cards.tsx:96) takes the first five started domains in teaching order (DOMAINS, lib/course/readiness.ts:26-42). The card is always on Today (course-dashboard.tsx:74).

**Correction 1: truncation starts in Week 4, not Week 6.** It begins as soon as a sixth domain is touched, which is w4-stacks. For an on-pace learner, rows are hidden as follows:
- Mid-Week 4: stacks (still developing) is hidden.
- From Week 5 on, the card is fixed to foundations, decomposition, hashing, pointers and windows, all READY. Every domain still in progress is hidden: search and lists in Week 5, lists and recursion in Week 6, trees in Week 7, graphs in Week 8.

**Correction 2: the simulation it relied on was impossible.** It set trees to 'ready' while recursion was gate-blocked, but w7-trees requires w6-recursion (units.ts:351). Rebuilt from real attempts with prerequisites respected (Week 8, 2026-12-17), the outcome is the same. The card shows:
- Badge: OFF TRACK.
- r.why[0]: "The course is 2 weeks behind the calendar." The reason "1 checkpoint not yet cleared." is why[1] and is never shown (course-cards.tsx:107).
- Five rows, all READY: foundations, decomposition, hashing, pointers, windows. All five are stale, but lines 109-114 render only DOMAIN_LABEL, so stale domains show as plain READY.
- Hidden: stacks, search, lists and "Recursion: Developing — Needs one clean checkpoint: recursion."

**Context that softens the impact but does not fix it:**
- Any blocked gate turns the badge At risk or Off track (readiness.ts:151-152).
- The full report at /progress#readiness (readiness-report.tsx:36-50) lists all 15 domains with per-domain reasons and "· stale", so §11's per-domain explanation requirement is met by the report and missing only from the Today card.
- Today's header names the current unit, w6-recursion (course-today.tsx:181-184, use-course.ts:23).

**Severity:** major. The Today readiness snapshot shows the oldest, strongest domains, drops staleness, and hides the blocked domain and the blocked-checkpoint reason, which works against §11 ("no stronger language than the evidence supports") and principle 12. It is not critical, because every row shown is true and the badge is truthful.

### 13. [MAJOR] Outside LeetCode evidence (unaided, hinted, rebuilt, cold re-solve) never reaches readiness — CONFIRMED (severity keep)
- Spec: §10 'later cold re-solve → strongest evidence'; §11
- Evidence: use-course-day.ts:39 `const ev = evidenceSummary(attempts, EXERCISE_BY_ID, today)`; readiness.ts:71 signature takes no SolveEntry list; lib/solve-log.ts SolveEntry has `result: 'unaided' | 'hinted' | 'failed'` and `rebuilt?: boolean`
- Detail: Real LeetCode solves and re-solves logged in the solve log are the most interview-like evidence, but they are not in the evidence panel, the track, the domains or the final decision. A later cold re-solve, the strongest evidence in §10, is invisible to readiness.
- Suggested fix: Pass solve entries to evidenceSummary and classify them into the same evidence categories (unaided first solve, hinted, solution viewed, rebuilt, cold re-solve). Map them to domains through the unit targets.
- Verifier: The claim is mostly right. One sub-claim is wrong: solve-log entries do reach the readiness track, but only as a count of problems.

What I checked in the code:
- components/use-course-day.ts:39-40 calls `evidenceSummary(attempts, EXERCISE_BY_ID, today)` and then `readiness(course.statuses, finished, ev, today)`. Neither function takes a SolveEntry list (lib/course/readiness.ts:71 and :141).
- Domains come from `courseStatus(ctx)` (lib/course/routing.ts:137). Its `CourseContext` (routing.ts:56-63) holds attempts, mastery, exercises, sections and today. It has no solve-log entries. `solvedLc` is used only by `courseQueue` (routing.ts:204/225) to choose what to queue next. It never changes a unit's state.
- `recentAssistance` (readiness.ts:81-82) counts only in-app attempts. A logged "Needed help" never counts as assistance.
- `transferGrade` (readiness.ts:99) uses attempts only. `finalDecision` (readiness.ts:166-170) uses domains, that grade, and `program.mocks.completed`. The InterviewCard call is at components/course/course-cards.tsx:139-142.
- The evidence panel (components/course/readiness-report.tsx:64-76) reads `r.evidence`, which comes from attempts only.
- `rebuilt` is never read anywhere except its own toggle at components/leetcode-list.tsx:155-156. credit.ts ignores it, and so does readiness.ts.

Where the claim overstates: lib/course/credit.ts:104-108 turns every unaided or hinted solve-log entry (failed ones excluded) into a daily credit (`outside-unaided` / `outside-hinted`). That flows through use-credits.ts:17 into `finished` at use-course-day.ts:34 (`weekProgress(..., credits.byDate).status`). From there it reaches `lastFinishedWeek` in readiness.ts:148-155, which drives the track and the "why" lines. The "Weeks so far" summary (readiness-report.tsx:87/100) also counts these solves in "qualifying problems".

Throwaway scenario, now deleted. Today 2026-11-04, with 45 in-app credits in Week 1:
- No outside solves: Week 1 is 45/50 and "recoverable", and the why list includes "Last week finished short but recoverable."
- Adding 5 logged solves (any result except failed) gives 50/50 "on-track", and that line disappears.
- Hinted, hinted+rebuilt, unaided, and unaided plus later `review1` cold re-solves all produced the same readiness output. The evidence panel stayed at all zeros, the domains did not change, and finalDecision was the same.

So the outside result type and any later cold re-solve change nothing in readiness. Only the count does, and a hinted solve counts the same as an unaided one.

On scope: outside problems are where the course's required target problems and spaced re-solves happen. course-today.tsx:127/223 links them out to LeetCode/NeetCode, and lib/course/resolves.ts schedules the re-solves at +3, +10 and +30 days. The strongest evidence named in §10, and the "later stronger evidence upgrades the report" rule in §11/§29, therefore never apply to them. The UI even says at leetcode-list.tsx:152, "It comes back cold in 3 days: that is the solve that counts", but that re-solve is worth the same +1 as a hinted first solve, and readiness ignores what kind of solve it was. Severity stays major. It is a material §10/§11 failure. It is not critical, because the report's footnote (readiness-report.tsx:77) scopes the evidence to "capstones, checkpoints, unlabeled and interview problems", so the report is not claiming to include LeetCode. Corrected: Readiness reads outside LeetCode solves only as a count of problems, never as evidence. credit.ts:104-108 turns each unaided or hinted solve-log entry into one daily credit. Those credits flow into the weekly totals behind `finished` (use-course-day.ts:34), and from there into `lastFinishedWeek` (readiness.ts:148-155). So outside solves can change the track and its "why" lines, for example "Last week finished short but recoverable". The "Weeks so far" qualifying count includes them too.

What a solve was never reaches readiness:
- **Evidence panel:** `evidenceSummary` (readiness.ts:71) takes attempts only.
- **Assistance check:** `recentAssistance` (readiness.ts:81-82) is attempts only, so a "Needed help" on LeetCode never counts as assistance in the track.
- **Domains:** `courseStatus` (routing.ts:56-63, 137) has no solve-log input.
- **Transfer grade and final decision:** both use attempts only (readiness.ts:99, 166; course-cards.tsx:139-142).
- **`rebuilt` flag:** nothing reads it except its own toggle (leetcode-list.tsx:155).

A scenario run confirmed it. Hinted, rebuilt, unaided and later cold `review1` re-solves all produce the same readiness output, and the evidence panel stays at zero. A hinted solve moves the weekly count exactly as much as an unaided one.

The course's required target problems and their +3/+10/+30-day re-solves happen outside (course-today.tsx:127/223, resolves.ts). So the strongest evidence in §10, a later cold re-solve, is invisible to readiness and can never upgrade it as §11/§29 require. The UI says the opposite at leetcode-list.tsx:152: "It comes back cold in 3 days: that is the solve that counts." The in-app capstone versions of problems (repType 'capstone') do count in `evidenceSummary`. What is missing is the outside solve log.

### 14. [MAJOR] transferGrade depends on array order, and memorizedRisk is effectively inert — CONFIRMED (severity keep)
- Spec: §24/§25; master §45 (memorized vs transfer)
- Evidence: readiness.ts:106 `const first = as.find((a) => a.passed && a.completedAt)` (unsorted); :109 `!(first && memorizedRisk(first, attempts))`; :180 `const solvedBefore = attempts.some((b) => b.exerciseId === a.exerciseId && b.passed && b.date < a.date)`
- Detail: Simulation E: the same two attempts on one transfer rep give independent 0 in chronological order and 1 (freshFull 1) in reversed order. After a reload the order is UUID order, so the grade, and with it mockPolicy and finalDecision, can change. When the attempts are in chronological order, the first passing attempt never has an earlier pass of the same exerciseId, so memorizedRisk(first) is always false. None of the 48 bank reps has a problemId, so recall of a known problem cannot be detected.
- Suggested fix: Sort by time and define the transfer attempt as the chronologically first attempt (pass or fail). Detect memorized risk by problem identity (LeetCode number or signature), not only by exerciseId.
- Verifier: I tried to refute the claim and could not. I read every code path the grade depends on and reran the simulations. Both scratch scripts are in /private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/. I wrote nothing to the repo.

1) The grade depends on array order. lib/course/readiness.ts:102 groups attempts per rep in array order, and :106 `const first = as.find((a) => a.passed && a.completedAt)` picks the first pass without sorting. masteryEvidence (lib/course/credit.ts:40-60) filters history by time, so the only order-dependent step is the choice of `first`. The caller is components/course/course-cards.tsx:137-142. It passes `useReps().attempts` unsorted into transferGrade, then calls mockPolicy(t.grade) and finalDecision(cd.readiness, t.grade, mocksDone). Line 157 shows "{t.independent} of {t.attempted} unlabeled problems solved independently · {t.freshFull} full problems cold".

2) After a reload the order is UUID order. The read path is reps-provider.tsx:122 → repository.ts:70-71 → sync.ts:56-62, which returns `[...Map.values()]` in insertion order. sync.ts:98-104 fills that Map from IndexedDB getAll. local.ts:19 creates the store with `{ keyPath: 'id' }`, so getAll returns rows in ascending key order. Attempt ids come from crypto.randomUUID() (lib/sessions.ts:13-14, rep-workspace.tsx:393). Within a session, new attempts are appended in creation order. On a fresh device the first load uses remote updated_at order (remote.ts:234). So the same history can be read chronologically in one session and in UUID order after a reload.

3) Reproduced with the real modules:
- Simulation E (c13-t-02: passed with 3 hints, then an unaided cold pass the next day at 600s): chronological gives {independent 0, freshFull 0}; reversed gives {1, 1}. Exactly as claimed.
- Threshold case (12 reps attempted: 8 clean and eligible, 1 hinted then redone, 3 failed): chronological is yellow (8/12), and mockPolicy allows 1 mock with 0 required. With the redo ordered first it is green (9/12, freshFull 9), and mockPolicy requires 2 mocks.

4) memorizedRisk is inert. In chronological order the first pass cannot have an earlier pass of the same rep, because both writers set completedAt on every pass (rep-workspace.tsx:463-468, mock-session.tsx:120). Across 19,777 random histories it returned true 0 times. It fires only when array order picks a later repeat as `first`.

5) The flow is realistic:
- shakyReps (session-planner.ts:112-130) takes any code rep passed with 3 or more hints or with the solution open (transfer reps qualify). use-today-plan.ts:58 puts it in Today as an "Again, cold" redo, which creates a second pass.
- Transfer reps can get hints in interview mode (rep-workspace.tsx:1480) and can show the solution (:1489), because they are not checkpoints.

Severity: major is right. The bug makes the §25 grade-driven mock policy and the Feb 1 decision non-deterministic, and memorizedRisk never does the master §45 job of telling known-problem recall from transfer. It only affects reps with two or more passes of different evidence classes, and the grade only flips near a threshold. That is a material failure of the requirement, not a product-wide falsehood, so I keep it at major. The worst case (H in correctedDetail: a rep whose solution was shown is counted as solved independently) needs a narrow timing window. Corrected: The claim is accurate. One part needs a more precise mechanism, and the bug is broader than stated.

(a) The order dependence goes both ways, not only upward:
- Simulation E (hinted pass, then an unaided cold pass ≥180s): 0 becomes 1, with freshFull 1. Confirmed.
- F (clean first pass, then a cold retrieval re-solve): 1 becomes 0, because 'retrieval' is excluded from `ok`.
- G (clean first pass, then a 100s repeat the next calendar day less than 12h later, classed 'first-exposure'): 1 becomes 0. memorizedRisk fires on the wrongly chosen repeat and deletes a real first solve.
- H (solution shown, run back, then a 5-minute redo the next morning less than 12h later): 0 becomes {independent 1, freshFull 1} when the redo sorts first. A rep whose solution was shown is then reported as "solved independently" (course-cards.tsx:157).
- Near a threshold the grade flips: yellow (8/12) becomes green (9/12, freshFull 9), and mockPolicy goes from 1 mock allowed with 0 required to 2 required. finalDecision changes with it.
- The order is UUID order only after a reload from IndexedDB (local.ts:19,26-28). Within a session new attempts are appended in creation order, and a fresh device first sees updated_at order (remote.ts:234). So the grade can change between the session where the work was done and the next reload.

(b) memorizedRisk (readiness.ts:178-182) is the only safeguard against recalled answers, and it is called only from readiness.ts:109. In chronological order it is always false (0 of 19,777 random histories). In any other order it only runs on the wrong attempt.

(c) The problemId point is true but is not the cause:
- 0 of the 48 bank reps have a problemId, and each `signature` falls back to its own id (data/exercises/build.ts:55 `signature: b.signature ?? b.id`).
- memorizedRisk compares only `b.exerciseId === a.exerciseId` (readiness.ts:180) and never reads problemId or signature, so adding problemIds alone would detect nothing.
- The concrete gap is that transferGrade has no date window, while bank reps are served before Week 13. With an empty history on 2026-11-10, Today's cold reviews (use-today-plan.ts:79 → buildReviewSession, schedule.ts:166-181) pick a bank rep for 18 of the bank's 59 skills, and skill sessions (sessions.ts:73-95) do so for 40 of 59.
- An early pass like that becomes `first` in chronological order and counts as Week 13 transfer evidence. The later Week 13 attempt (recall of a known problem) is never examined.

Fix direction: sort each rep's attempts by completedAt (or startedAt) before choosing `first`. Define transfer as the first passing attempt inside the Week 13 window, with no earlier pass of the same rep or a linked problem. Either apply memorizedRisk to repeats before that window or remove it.

### 15. [MAJOR] A second, legacy readiness model still renders under the V2 report on Progress — CONFIRMED (severity keep)
- Spec: §26 'no contradictory systems'; §9
- Evidence: components/progress-view.tsx:47 `unitReadiness(PLAN_UNITS, PLAN_DAYS, attempts)` rendered as 'Pattern readiness' at :170; :49 `checkpointStatus(CHECKPOINTS, ...)` rendered as 'Checkpoints' at :142; lib/progress-90.ts:63-71 cleared = every V1 ladder rep passed (passedSet, hinted passes included)
- Detail: Directly under 'Feb 1 readiness', V1 'Pattern readiness' can say 'Two pointers: Cleared' (ladder reps passed, even with hints) while the V2 domain says 'Pointers and running state: DEVELOPING – Needs one clean checkpoint'. The page also shows V1 checkpoints next to the V2 checkpoints.
- Suggested fix: Remove V1 Pattern readiness and V1 Checkpoints from the course-era Progress page, or derive them from the V2 domains and gates.
- Verifier: I checked the claim against the code and it holds. In components/progress-view.tsx, line 65 renders the V2 report (`<ReadinessReport />`, whose heading reads 'Feb 1 readiness') when `today >= COURSE_START`. The page then still renders three legacy V1 sections:
- 'Checkpoints' (lines 140-164) uses `checkpointStatus(CHECKPOINTS, ...)` from line 49, including a 'Patterns cleared' row built on the same V1 unitReadiness.
- 'Pattern readiness' (lines 168-199) uses `unitReadiness(PLAN_UNITS, PLAN_DAYS, attempts)` from line 47 and shows 'Cleared' at line 194.
- The 90-day minute heatmap, weekly time against plan, and the working-day streak.

In lib/progress-90.ts, lines 63-71 set `cleared: reps.length > 0 && done === reps.length`, where `done` counts reps in `passedSet(attempts)`. In lib/progress.ts line 17, passedSet is `a.passed && a.completedAt && !(a.solutionViewed && EXERCISE_BY_ID[a.exerciseId]?.cleanPass)`. It never looks at `hintsUsed`, so passes that used hints count toward 'Cleared'. The V2 model in lib/course/readiness.ts (line 30 defines 'Pointers and running state'; line 53 produces 'developing' with 'Needs one clean checkpoint: ...') measures something different, so the two models can disagree on the same page.

The spec names this exact problem. §9 says the Progress page 'still includes legacy concepts such as ... old checkpoint logic, old pattern readiness ... This creates two competing models of progress.' §26 says 'There should not be contradictory systems.' A major rating fits: this materially fails the §9 requirement, and the contradiction comes from the legacy model being shown alongside V2, not from the V2 readiness logic being wrong. Corrected: The claim is correct, with two clarifications:
1. passedSet does leave out passes where the solution was viewed, but only on exercises flagged cleanPass. Hinted passes always count, and so do solution-viewed passes on exercises without that flag.
2. The V2 ReadinessReport ('Feb 1 readiness') renders only when today >= COURSE_START, which is 2026-10-26. Before that date (today is 2026-10-23), Progress shows only the legacy V1 sections. From that date on, both models render on the same page and can contradict each other.

The legacy sections still on the page are the minute-intensity heatmap, the weekly time-against-plan chart and the working-day streak. The V1 'Checkpoints' panel also contains a 'Patterns cleared' row, computed with the same V1 unitReadiness. §9 explicitly lists all of these for removal.

### 16. [MINOR] The 'N checkpoints not yet cleared' reason counts gate-blocked units, not uncleared checkpoints — CONFIRMED (severity keep)
- Spec: §11 explanations
- Evidence: readiness.ts:147 `const blocked = statuses.filter((s) => s.state === 'gate-blocked').length`; :154 `why.push(`${blocked} checkpoint${...} not yet cleared.`)`
- Detail: The count covers units whose latest gate attempt failed. Unattempted checkpoints are left out, and a unit with two failed gates counts once. The text describes something else.
- Suggested fix: Count failed checkpoints (gates with failed = true) and say 'N checkpoints failed; repair, then retry', or count every uncleared live gate and say so.
- Verifier: I confirmed the claim. In lib/course/readiness.ts:147, `const blocked = statuses.filter((s) => s.state === 'gate-blocked').length` counts units, not gates. Line 154 then prints `${blocked} checkpoint(s) not yet cleared.` Here is how a unit gets that state. lib/course/routing.ts:163 sets `else if (anyGateFailed) state = 'gate-blocked'`, which only runs when the unit is not ready. anyGateFailed (routing.ts:146) means some live gate has `failed`. Per routing.ts:94, a gate is `failed` only when it is not cleared and its latest try was not clean: `const failed = !cleared && Boolean(last) && !gateClean(last, ctx.attempts)`. That leaves three gaps. (1) Checkpoints that were never attempted are not counted. (2) Some units have two gates: units.ts:65 `['g-loop-control', 'g-index-scan']`, :220 and :255. If both gates fail, the unit still counts once. (3) If a unit has one gate failed and another gate never tried, the untried one is not counted. So the sentence under-reports how many checkpoints are not yet cleared, and it is really a count of units with a failed checkpoint. domainOf (readiness.ts:55) already counts properly: `gatesLeft = us.flatMap((u) => u.gates.filter((g) => !g.cleared && g.available.length)).length`. So the per-domain why-text is accurate and only the overall why-line is wrong. §11 says explanations must state why each status holds and must not be stronger than the evidence. This wording is understated, not overstated, so minor is the right severity. Corrected: readiness.ts:147/154 counts units whose state is 'gate-blocked': not ready, with at least one live gate whose latest attempt failed (routing.ts:94, :163). The text calls that number "checkpoints not yet cleared". It leaves out checkpoints never attempted, and a unit with two failed gates counts once. Three units have two gates (units.ts:65, :220, :255). The wording should say something like "N units blocked at a failed checkpoint", or the code should count failed gates the way domainOf does at readiness.ts:55. Severity: minor.

### 17. [MINOR] Domain 'ready' text says 'Every checkpoint cleared, cold.' when some units have no checkpoint and their path may include hinted passes — CONFIRMED (severity keep)
- Spec: §11 'no stronger language than the evidence supports'
- Evidence: routing.ts:154 `const ready = liveGates.length ? gatesCleared : pathDone`; routing.ts:69-71 passedIds keeps hinted passes; readiness.ts:52 'Every checkpoint cleared, cold.'
- Detail: The units w1-state-while, w1-integration, w2-improve and w7-bst have no gate. They become ready when their path is done, and hinted passes count toward that. The foundations, decomposition and trees domains then claim cold checkpoints for work that was never checkpointed.
- Suggested fix: Word the reason from the evidence itself, for example 'Checkpoints cleared cold; <unit> completed through practice', or add gates to those units.
- Verifier: I checked every cited line and the claim holds.
- data/course/units.ts gives `gateIds: []` to w1-state-while (line 50), w1-integration (110), w2-improve (172) and w7-bst (371). Lines 563 and 580 are also empty, but those units are in no readiness domain.
- lib/course/routing.ts:154 says `const ready = liveGates.length ? gatesCleared : pathDone`, so a unit with no gate counts as ready once `pathDone` is true (line 148: `full.every((e) => passed.has(e.id))`).
- `passedIds` (routing.ts:69-71) drops only passes where the solution was viewed (`a.passed && a.completedAt && !a.solutionViewed`). It does not look at `hintsUsed`, so a pass that used hints still counts toward pathDone. Gated units are different: they go through gateStatus/gateClean.
- readiness.ts:48 counts a unit as ready when its state is 'ready' or 'maintenance'. Line 52 then says 'Every checkpoint cleared, cold.' (or 'Every checkpoint cleared; not practised lately…' when stale) as soon as every unit in the domain is ready.
- The domains at readiness.ts:27, 28 and 36 (foundations, decomposition, trees) each contain one of these gateless units. They can therefore claim cold checkpoints for work that never had a checkpoint and may have been passed with hints.
- The same fallback applies to a gated unit whose gate has no available variants: `liveGates` filters on `available.length`.

This breaks the §11 readiness principle 'no stronger language than the evidence supports'. The effect is limited to explanation text in three domains, and the gated units in those domains really were checkpointed, so minor is a fair severity. Corrected: The claim is accurate. One addition: the 'stale' wording on the same line (readiness.ts:52, 'Every checkpoint cleared; not practised lately…') overclaims in the same way. The `pathDone` fallback also covers any gated unit whose gates have no available variants (routing.ts:144, 154), not only the four units with no gate.

### 18. [MINOR] The readiness behaviours §29 requires are not tested — CONFIRMED (severity keep)
- Spec: §29 testing requirements (readiness, Week 14)
- Evidence: lib/course/readiness.test.ts:9 `calm` has the 4-bucket shape; tests cover track, transferGrade, mockPolicy and one red finalDecision only (:12-42); e2e/course.spec.ts:47 only checks that `readiness-card` is visible
- Detail: There are no tests for the six-way classification, an upgrade from later stronger evidence, revealed then reconstructed, checkpoint variants counting, lab evidence appearing, the transfer and interview rows being wired, finalDecision overclaim cases, or route-level mock gating.
- Suggested fix: Add unit tests for each of these, plus an e2e test that a red-graded learner cannot open /interview/[mockId].
- Verifier: The description of lib/course/readiness.test.ts is accurate. Its only tests are track/domains (:12-25), transferGrade, mockPolicy and a single red finalDecision (:31-42), and e2e/course.spec.ts:47 only checks `readiness-card` is visible. No unit or e2e test calls evidenceSummary (lib/course/readiness.ts:71) or memorizedRisk (:178), the code that aggregates evidence for readiness reporting; evidenceSummary is used only in components/use-course-day.ts:39. No test checks lab evidence in readiness, finalDecision ready/ready-with-gaps or overclaim cases, or mock gating at the route/UI level (no e2e mentions mocks). But the claim overstates the gap: lib/course/credit.test.ts does test evidence classification and the reveal-then-upgrade path. It asserts masteryEvidence returns 'independent', 'assisted' (:17-19), 'revealed' (:25), 'reconstructed' for a later rebuild after a reveal (:30, with coldEvidence/gateClean false at :31-32), 'retrieval' once a clean pass follows (:36), and 'cold-independent' and 'self-corrected' (:58-61). So "no tests for the six-way classification", "upgrade from later stronger evidence" and "revealed then reconstructed" are wrong at the per-attempt level. They are only true for the aggregated readiness report. Minor severity is right: this is a test-coverage gap, not a product-truthfulness defect. Corrected: Per-attempt evidence classification is tested in lib/course/credit.test.ts:13-65. That covers independent, assisted, revealed, reconstructed, retrieval, cold-independent and self-corrected, plus the revealed -> reconstructed -> retrieval upgrade (:22-37). What is untested is the readiness reporting layer: evidenceSummary (lib/course/readiness.ts:71) has no test, including whether later stronger evidence upgrades the reported buckets. Also untested: lab evidence appearing in readiness, the transfer and interview rows being wired via readiness(..., extra), finalDecision ready/ready-with-gaps/overclaim cases (only one red case at readiness.test.ts:41), and route- or UI-level Week 14 mock gating (no e2e test mentions mocks; e2e/course.spec.ts:47 only checks readiness-card is visible). Severity: minor.

## routing-gates

Routing gets the basic mechanics right: hard locks, the gate's clean standard, recycling variants after failures, and the `required` flag. But the course queue cannot serve as Today's source of truth. I found seven critical problems, all confirmed by running the real routing and prescribe code.

1. **Gateless units deadlock.** w1-state-while, w2-improve and w7-bst never become ready once their route turns 'focused'. A beginner who follows Today exactly is stuck in w1-state-while for good, and Today prescribes 0 reps from Nov 11 to Jan 31. A learner who has already passed d05-while and similar legacy reps is stuck from day 1.
2. **Placement fires mid-unit.** `priorEvidence` counts the learner's own progress through the unit and generic skills. Beginners get the cold checkpoint after 25–40% of a unit, before the unit teaches what the checkpoint tests (e.g. aliasing).
3. **Today's spaced-review slots ignore locks and gates.** They serve reps from locked units, gate variants, the Week 13 bank, mock problems and lab builds.
4. **Weeks 1 and 2 do not fit their contracts.** Week 1 needs 73 problems against a target of 50; Week 2 needs 208 against 60.
5. **Week 2 tests later material.** w2-testing requires cold interview reps on binary search, stacks, intervals, grids and linked lists.
6. **The load rule leaves days short.** Week 13 days can only reach 5/15. Days where the current unit is blocked on a failed checkpoint reach 3/15.
7. **A checkpoint can be passed with help.** Using "Explain mistake" (AI) or replaying the exact variant that failed still counts as clean.

Major issues:
- Day completion only counts reps; a required checkpoint or repair can stay undone at "Day complete", or be shown as "Bonus".
- Attempts from before the course clear 14 gates with no recency or cold requirement. They also turn off placement.
- A learner who is ahead pulls Week 13 into Week 2, then gets an empty Today.
- Repair reps passed earlier the same day show as done but are still pending.
- Ordinary cold reps are labelled "Checkpoint" and marked required.

**Already correct:**
- Hard locks are real: courseStatus derives blockedBy from prerequisite unit states (lib/course/routing.ts:149-152) and courseQueue skips locked units (routing.ts:210). The calendar never unlocks a unit, and the spec's dependency chain is encoded and tested (lib/course/course.test.ts:45-58; routing.test.ts:39-59).
- gateClean rejects hints, a revealed solution, a reconstruction after a reveal, and more than 2 failed runs (lib/course/credit.ts:77-80). The rep workspace puts every pool rep in checkpoint mode via GATE_OF_EXERCISE, including legacy pool reps without gate:true: no lesson panel, no hint button, no 'Show solution' (rep-workspace.tsx:824-828, 1443, 1489).
- A gate with every variant failed is not a dead end. After repairs, the next variant excludes the one that just failed and recycles the least recently tried (routing.ts:106-112). A run failing every first attempt still cleared all 30 gates.
- 'gate-blocked' is recoverable: repairs (from the unit's own and optional reps on the failed variant's skills) and then a fresh variant are queued (routing.ts:96-105, 217, 221). Today shows them with the Repair and Checkpoint tags.
- No off-by-one between need and available variants: cleared uses min(need, available) (routing.ts:92) and next slices need minus clean (routing.ts:113, 123). All 120 pool reps exist, so no gate currently depends on missing content.
- Gate variants that sit inside path sections are filtered out of paths (routing.ts:74), so they are never served twice. No rep appears in two units, no section is shared between units, and courseQueue dedupes by key (routing.ts:227-229).
- Gate and repair queue items carry required:true, so they bypass the 30% foundation checks cap in prescribe (use-today-plan.ts:65; today-plan.ts:120, 125). Gate variants weigh 1, so the load rule never drops them.
- The 80-item slice (use-today-plan.ts:62) never cut a required gate or repair in any simulated run (furthest index 33), because a unit's gates are queued at its front once its path is done.
- New LeetCode problems are held back during the foundation weeks and until bridge readiness (today-plan.ts:130), and are queued only after their unit is ready (routing.ts:224-225).
- The placement mechanism itself works when the evidence really is about the unit: o2-loops covers 65% of w1-loop-control and d3-running-state 50% of w1-running-state, giving 'placement' with only the cold gate offered and passing it skipping the teaching (routing.test.ts:61-73). The problem is what feeds priorEvidence and the gateless deadlock, not the placement branch.

**Data:**

```
METHOD: throwaway scripts that import the real repo modules (courseStatus/courseQueue/gateStatus/prescribe/computeAllMastery/buildReviewSession/scheduleAfterAttempt), replicating use-today-plan's mapping (queue.slice(0,80), COURSE_KIND, required flag, bridge readiness) and simulating each training day Oct 26 -> Jan 31 with the learner passing Today's next item first try. Repo left clean. Backups/outputs: /private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/ (sim2.ts.bak, sim-beginner.txt, sim2-unstick-verbose.txt, sim2-fail.txt, sim2-legacy-all.txt, sim2-legacy-some.txt, flip.txt, flip2.txt, review2.txt, misc6.txt, units.txt).

1) REQUIRED WORK PER WEEK. The full route is what a beginner must do. Gate variants are excluded from paths; the minimum gate passes = sum of min(need, pool).
Week: path reps (lesson-level) + gate passes = total vs target
W1: 65 (19) + 8 = 73 vs 50  OVER
W2: 197 (38) + 11 = 208 vs 60  OVER (w2-hashing alone: 125 reps + 3 gate passes)
W3: 38 + 6 = 44 vs 75
W4: 53 + 4 = 57 vs 75
W5: 46 + 4 = 50 vs 75
W6: 22 + 4 = 26 vs 75
W7: 51 + 2 = 53 vs 75
W8: 75 + 6 = 81 vs 75  OVER
W9: 51 + 4 = 55 vs 60
W10: 25 + 2 = 27 vs 45
W11: 58 + 4 = 62 vs 75
W12: 49 + 4 = 53 vs 75
W13: 48 + 0 = 48 vs 60, but Today can only prescribe 5 a day (see 4)
W14: 55 + 0 = 55 vs 75
W1+W2 = 281 required vs 110 contract, which pushes Week 2 content into calendar weeks 4–5.
No rep appears in two units' paths; no section is shared between units. All 30 gate pools exist in full (120 reps). 10 gates have a pool smaller than 2×need: g-pointer-movement, g-safe-rewiring, g-fast-slow, g-queue, g-grid, g-graph-traversal, g-directed-cycle, g-intervals, g-dp, g-dp-greedy.

2) DEADLOCK (beginner following Today exactly)
- w1-state-while route flips to 'focused' after 8 of 18 reps. It drops c1-while-fill-change and d05-while-halve, then sits at "Practising · 16/16" forever.
- Units stuck locked behind it: w1-loop-control, w1-running-state, w1-mutation-references, w3-two-pointers, w6-recursion (plus everything that depends on them).
- Today prescribes 0 reps on every training day from 2026-11-11 to 2027-01-31 (56 short days). Only w2-hashing (no prerequisites) ever becomes ready.
- Learner with o2-loops, d05-while and d3-running-state passed before the course: w1-state-while is 'focused' from day 1 and drops 6 lesson-level reps; Today is empty from 2026-11-10. Week-1 placement never gets a chance to run.
- When the dropped reps are passed by hand, the next deadlocks are w2-improve (c2-improve-count-work, c2-improve-pairs-trace, o2-comp-set-trace; freezes the horizon at week 3) and w7-bst (b230-trace-inorder; freezes it at week 8).

3) PLACEMENT FIRES MID-UNIT (beginner, previous unit complete)
- w1-loop-control becomes 'placement' after 8 of 20 reps (queue becomes gate:4 only).
- w1-running-state after 3 of 12.
- w1-mutation-references after 4 of 10, before c1-ref-trace-alias and c1-ref-trace-function are taught.
- After doing only w2-hashing reps: w1-mutation-references, w2-contract, w2-testing and w2-solve-map are in placement; w1-integration and w2-improve are on the focused route.
- Lesson-level reps that sit after the 40% mark (and are dropped for beginners): w2-hashing 14, w9-heaps 4, two each in w1-loop-control, w1-mutation-references, w2-manual, w5-linked-lists and w11-dp, one in most other units.

4) TODAY UNDER-FILL
- Week 13: every day 4–5 of 15. With N=15 the load limit is 20, and every transfer rep weighs 2.
- 2026-12-10: 4 of 15 (the last w7-trees rep, d06-mut-copy, weighs 2 and does not fit).
- Days where the current unit is blocked on a failed checkpoint and its dependants are locked: 3 of 15 (2027-01-07 and 01-08); 6–9 of 15 on several other days.
- Learner who passed all October content: 0 of 15 every day from 2026-12-02.

5) SPACED-REVIEW LEAK (beginner, day 2 = 2026-10-27, reviews due from day-1 passes)
- Today's cold candidates: d3-pu-count-below (w3, locked), d4-win-max-vowels (w4, locked), b238-best-rival (w3, locked, transfer), o2-append-line. Up to 2 of the 10 slots go to these.
- Eligible for review picks: 120 gate variants (57 have no calendar day, so they are eligible from day 1), 46 lab builds, 48 Week-13 reps, and mock problems.
- First pick per skill across all skills: Week-13 rep for 24 skills, gate variant for 13, mock problem for 11, lab build for 3.

6) LEGACY EVIDENCE (all October content passed cleanly)
- 14 gates are cleared on Oct 26 without a course checkpoint: g-hashing, g-pointer-mechanics, g-fixed-window, g-variable-window, g-stack, g-search-invariant, g-safe-rewiring, g-tree-contract, g-grid, g-graph-traversal, g-heap, g-backtracking, g-dp, g-matrix.
- 14 units are ready on day 1.
- The frontier reaches w13-transfer on 2026-11-05 (calendar week 2).
- A gate pass 86 days old still clears the gate (unit shows 'maintenance').
- Three first-exposure (not cold) passes clear g-hashing.
- 2 of 3 g-hashing variants passed in October: the unit is 'practicing', and the last variant only comes after 52 focused path reps.

7) LC TARGETS
They appear only when all of these hold:
- calendar week 3 or later (the foundation phase filters them out);
- the unit is ready, or it has no gates and its path is done;
- the problem is not logged and the unit's Reps capstone has not been passed;
- legacy bridge readiness is true (it defaults to true for 217, 1971 and 547, which are not in TARGETS).
Numbers:
- 25 of 48 target entries have their capstone in the unit path, so they never surface in the normal route (for example LC 167).
- Beginner simulation: 24 LCs queued, 16 prescribed. LC 128, 424, 39, 53, 139, 62, 54 and 48 were queued but never prescribed.
- readinessTargets are queued at the same moment as targets.

8) GATES AND REPAIRS ON TODAY
- Every gate was prescribed 0–2 days after it was queued.
- The furthest a required gate or repair item ever sat in the queue was index 33, so the 80-item slice never cut one.
- All variants failed: the least recently tried variants are recycled, and all 30 gates eventually cleared in the run that fails every first attempt.
- Repairs per failed variant: 3 everywhere, except g-prefix-suffix on d3-cold-sell-today (1) and g-dp-greedy b and c (2).
- One failed run of a checkpoint (still within the 2 allowed): failed=true, state 'gate-blocked', and the variant leaves the queue.
- Repairs passed that same morning show as DONE on Today while still pending.
```

### 1. [CRITICAL] Gateless units deadlock once their route turns 'focused': the whole course stays locked and Today prescribes nothing — CONFIRMED (severity keep)
- Spec: §2 principles 7, 12, 13; §8 acceptance; §29 Today/week completion
- Evidence: lib/course/routing.ts:148 `const pathDone = full.every((e) => passed.has(e.id))`; routing.ts:154 `const ready = liveGates.length ? gatesCleared : pathDone`; routing.ts:157 `const path = route === 'focused' ? full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id)) : full`; routing.ts:218 queue serves only `s.path`; data/course/units.ts:50, 172, 371 `gateIds: []` (w1-state-while, w2-improve, w7-bst); components/course/road-map.tsx:95 shows `${u.done}/${u.total}`
- Detail: A unit with no gates becomes ready only when its FULL path is done. Once prior evidence flips the route to 'focused', the queue only serves the focused path, which leaves out unpassed lesson-level reps, so the unit can never become ready. Simulation of a beginner following Today: w1-state-while flips after 8 of 18 reps, drops c1-while-fill-change and d05-while-halve, and stays at 'Practising · 16/16' forever. w1-loop-control, w1-running-state, w1-mutation-references, w3-two-pointers and w6-recursion stay locked. Once w2-hashing (no prerequisites) is used up, Today prescribes 0 reps on every training day from 2026-11-11 to 2027-01-31. A learner who passed o2-loops, d05-while and d3-running-state before the course is 'focused' from day 1 (6 lesson-level reps dropped) and Today is empty from 2026-11-10. The same trap catches w2-improve (3 trace reps dropped; horizon frozen at week 3) and w7-bst (b230-trace-inorder; horizon frozen at week 8). The tests miss this because routing.test.ts uses `mastery: {}` and `through()` passes every rep.
- Suggested fix: Make readiness agree with the path actually served: use the route's `path` for gateless units, or keep lesson-level reps in the focused path. Add a test that follows courseQueue rep by rep from an empty history with real computeAllMastery through Week 2. Assert that every unlocked unit that is not ready contributes at least one queue item.
- Verifier: I confirmed this by running the real courseStatus and courseQueue (the same calls components/use-course.ts:18-22 makes) with attempts that follow the queue. In lib/course/routing.ts, a unit with no gates becomes ready only when its full path is done: line 148 `const pathDone = full.every((e) => passed.has(e.id))` and line 154 `const ready = liveGates.length ? gatesCleared : pathDone`. Line 157 removes any lesson-level rep the learner has not passed from a 'focused' path. The queue at line 218 serves only `s.path`. Line 224 opens a gateless unit's targets on `s.path.every(...)`, which goes true even though `ready` stays false.

Simulation for w1-state-while (sections c1-state, c1-while, d05-while; 18 reps): after 8 passes the route turns 'focused', because priorEvidence at line 131 counts 8/18 ≥ 0.4. The path drops to 16 reps, removing c1-while-fill-change (complete) and d05-while-halve (trace). The learner reaches 'practicing focused 16/16', and then the queue has nothing more for that unit. The state never becomes 'ready', so every unit that lists it as a prerequisite stays locked (blockedBy, lines 149-152). After 16 passes the only unit left in the queue was w2-hashing.

use-today-plan.ts:59-69 builds Today from course.queue, so once w2-hashing runs out Today prescribes no new course work. I did not re-check the claimed dates or the w2-improve and w7-bst figures. Those units have `gateIds: []` (units.ts:172, 371) and contain lesson-level reps, so the same mechanism applies. w1-integration (units.ts:110) is also gateless.

Minor caveats that do not refute the claim: review items and the re-solve queue can still appear on Today, and a learner could open the section by hand, do a dropped rep and unlock the course. But nothing in the product directs them to do so. The statement that the tests miss this is consistent with the code. Corrected: The claim is accurate. One detail to add: the deadlock happens whenever priorEvidence or a mid-unit pass rate of 40% or more flips a gateless unit with unpassed lesson-level reps to 'focused'. Following Today's own queue is enough to trigger it, as the simulation shows: w1-state-while flips at 8/18 and stalls at 16/16. Line 224 opens that unit's LeetCode targets anyway, because it tests `s.path.every(...)` instead of `ready`. Review and re-solve items can still show on Today; only new course work dries up. The likely fix is to compute `ready` for gateless units on `path` (the routed path) instead of `full`, or to keep lesson-level reps in focused paths for gateless units.

### 2. [CRITICAL] priorEvidence turns a beginner's own progress and unrelated generic skills into 'placement', so the cold checkpoint replaces the rest of the unit's teaching — CONFIRMED (severity keep)
- Spec: §2 principle 3; REPS_2_MASTER_SPEC §11 (skip instruction only with production evidence), §12
- Evidence: routing.ts:131 `if (path.length && path.filter((e) => passed.has(e.id)).length / path.length >= 0.4) return true`; routing.ts:132-133 `unit.retrievalSkills ... m.attempts >= 3 && m.score >= 45`; routing.ts:164 `else if (prior && liveGates.length && !liveGates.some((g) => g.attempted)) state = 'placement'`; routing.ts:212-214 placement queues only `g.next` then `continue`; routing.ts:155 `prior || anyGateFailed ? 'focused'`; components/course/course-today.tsx:101 learnFirst requires `route === 'full' && ... done === 0`
- Detail: The 40% path-share test counts the learner's progress inside the unit, and retrievalSkills are generic (functions, list_append, edge_cases, complexity). For a beginner who has finished the previous unit: w1-loop-control switches to 'placement' (queue becomes gate items only) after 8 of 20 reps; w1-running-state after 3 of 12; w1-mutation-references after 4 of 10, so c1-ref-trace-alias and c1-ref-trace-function are never served before g-mutation-references tests aliasing. After doing only w2-hashing reps, w1-mutation-references, w2-contract, w2-testing and w2-solve-map are in placement with no exposure to their lessons. A pass skips 60–75% of the unit. A fail keeps the route 'focused' and drops the unpassed lesson-level reps for good. No worked example is surfaced for the focused route (§11 'Partial').
- Suggested fix: Compute prior evidence only from evidence that predates the learner starting the unit (before the first attempt on its course reps, or before COURSE_START). Base it on the unit's own legacy sections or gate skills instead of generic retrievalSkills. On a failed placement, keep the lesson-level reps and surface the unit's lesson and worked example on Today.
- Verifier: I read lib/course/routing.ts in full, along with data/course/units.ts, data/course/gates.ts, lib/mastery.ts, components/use-course.ts and components/course/course-today.tsx. I then ran a throwaway simulation (scripts/_audit_skeptic.ts, now deleted). It used the real EXERCISE_BY_ID, SECTION_BY_ID and computeAllMastery, and always took the first item courseQueue served, with every rep passing cleanly.

**The mechanism is as claimed.**
- `priorEvidence` (routing.ts:130-134) returns true in two cases. The first is when 40% of the unit's own full path is passed (line 131). The second is when every one of `unit.retrievalSkills` has `attempts >= 3 && score >= 45 && !recognitionOnly` (lines 132-133). Those skills are generic: w1-mutation-references uses `['list_append','functions']`, w2-contract and w2-testing use `['edge_cases']`, and w2-solve-map uses `['explanation','complexity']`.
- When prior is true and no gate has been attempted, state becomes 'placement' (line 164).
- In placement, courseQueue pushes only `g.next` gate variants and then `continue`s (lines 212-214), so no teaching reps are queued.
- route becomes 'focused' whenever `prior || anyGateFailed` (line 155). The focused path drops every unpassed recognize/trace/recall/complete rep (line 157).
- REPAIR_STAGES (line 67) excludes trace and recognize, so those dropped lesson reps never come back through repair either.
- course-today.tsx:101 shows the lesson and worked-example card (`learnFirst`) only when `route === 'full' && done === 0`. The focused route therefore never shows the worked example that §11's "Partial" path requires.

**The simulation confirms the numbers, with one difference.**

Starting from a learner who had finished w1-state-while:
- w1-loop-control went 'placement' at 8/20 reps, with 12 reps unserved, including the o2-range-basic and o2-early-return-trace traces.
- w1-mutation-references went 'placement' at 4/10. c1-ref-trace-alias and c1-ref-trace-function were never served before g-mutation-references.
- w2-contract went 'placement' at 3/7.
- w2-testing went 'placement' at 0/17 and w2-solve-map at 0/6, both while still locked.

Starting from nothing:
- After about 60 hashing reps, w1-mutation-references (0/10), w2-contract (0/7), w2-testing (0/17) and w2-solve-map (0/6) were all in 'placement', with no exposure to those units at all.

The difference: w1-running-state entered 'placement' at 0/12, not after 3 of 12. Its retrievalSkills `['state_tracking','accumulator']` were already satisfied by w1-state-while and w1-loop-control work. That makes the claim stronger, not weaker.

In practice a pass makes the unit 'ready' with lesson-level reps never done. In the simulation, loop-control was ready at 18/20 and running-state at 9/12.

**Severity: keep critical.** The gate tests material, such as aliasing, before the unit has taught it. That violates REPS_2_1_SPEC §2 principle 3 ("teach prerequisites before testing them"). It also violates MASTER_SPEC §11 ("skip instruction only with production evidence"): generic skill mastery from other units is not production evidence for this unit's material.

**Related defect found while testing (not in the claim).** Gate-less units deadlock. w1-state-while has `gateIds: []`, so its readiness check is `pathDone = full.every(passed)` (lines 148 and 154). Once 40% of its path is passed, prior becomes true and the route turns 'focused'. Line 157 then removes the unpassed lesson-level reps from `path`, and courseQueue only serves `s.path`. With the queue alone, `full` can never be completed. In the from-scratch simulation, w1-state-while stayed 'practicing focused 16/16' forever, never became ready, and every Week 1 unit after it stayed locked. The queue fell through to w2-hashing, which has no prerequisites. w1-integration has the same exposure. The only way out is for the learner to open those reps by hand outside the queue. Corrected: The claim is accurate, with one difference: w1-running-state enters 'placement' at 0/12, not 3/12. Its generic retrievalSkills (state_tracking, accumulator) are already satisfied by the previous units' reps (routing.ts:132-133 → :164 → :212-214), so it reaches the cold gate with no exposure at all. Every other figure reproduced in simulation:
- loop-control enters placement at 8/20.
- mutation-references enters placement at 4/10, and c1-ref-trace-alias and c1-ref-trace-function are never served.
- contract enters at 3/7.
- testing (0/17) and solve-map (0/6) enter placement while still locked.
- Hashing reps alone put mutation-references, contract, testing and solve-map into placement.

A failed gate leaves the route 'focused' (line 155). Line 157 drops the unpassed trace and recognize reps, and REPAIR_STAGES (line 67) excludes them, so they are never served. course-today.tsx:101 shows the worked example only on the 'full' route.

A worse related defect: a unit with no gates (w1-state-while, and w1-integration is exposed the same way) needs `full.every(passed)` to become ready (lines 148 and 154). But the focused path (line 157) stops queueing its unpassed lesson-level reps. Once 40% is done, the unit can never become ready through the queue, and all of Week 1 after it stays locked. A from-scratch simulation reproduced this as w1-state-while stuck at 'practicing focused 16/16' with 18 reps in its full path.

### 3. [CRITICAL] Today's spaced-review 'cold' slots ignore course locks and gates: locked-unit reps, gate variants, the Week 13 bank, mocks and lab builds get prescribed — CONFIRMED (severity keep)
- Spec: §2 principles 3, 7, 10; §24 Week 13 safeguards; §29 Week 13/Today tests
- Evidence: components/use-today-plan.ts:79 `const cold: Candidate[] = buildReviewSession(dueReviews(reviews), ALL_EXERCISES, DAY_OF_EXERCISE, attempts, today, new Date(), 4).map((id) => rep(id, 'cold'))`; lib/schedule.ts:167 `(exerciseDay[e.id] ?? today) <= today && !chosen.includes(e.id) && e.repType !== 'capstone'`; lib/today-plan.ts:135, 146-148 maintenance share; lib/course/routing.ts:83 any attempt on a pool rep is a gate try
- Detail: Reproduced with real scheduleAfterAttempt and buildReviewSession. For a beginner on day 2 of Week 1, the cold candidates are d3-pu-count-below (w3-two-pointers, locked), d4-win-max-vowels (w4-windows, locked), b238-best-rival (w3-running-prefix, locked, unlabeled transfer) and o2-append-line. Up to 2 of the day's 10 slots go to them, labelled 'Cold rep · Brought back before it fades' although they were never taught. Course reps have no calendar day, so they are always eligible, and untouched reps rank first. Across skills the first pick is a Week-13 transfer rep for 24 skills, a gate variant for 13 (c6-g-fast-slow-a, c8-g-graph-a, c10-g-interval-a), a mock problem for 11 and a lab build for 3. A gate variant attempted this way counts as a gate try: failing it marks a possibly locked unit 'gate-blocked' with a focused route, and passing it clears gates without the path. Week-13 problems get used up before Week 13.
- Suggested fix: Filter cold (and prep) candidates in useTodayPlan to reps of ready, maintenance or in-progress unlocked units (UNIT_OF_EXERCISE plus statuses). Exclude GATE_OF_EXERCISE reps, lab reps, transfer and Week-13 reps, mock reps and the interview bank. Better: pass a course eligibility predicate into buildReviewSession.
- Verifier: The claim holds. In components/use-today-plan.ts:79, `cold` is built from `buildReviewSession(dueReviews(reviews), ALL_EXERCISES, DAY_OF_EXERCISE, attempts, today, new Date(), 4)` with no course filter, and this runs even when the course queue is the plan (today >= COURSE_START). ALL_EXERCISES (data/curriculum.ts:224-230) includes MOCK_EXERCISES and every COURSE_SECTIONS exercise. Course reps are not in DAY_OF_EXERCISE (data/curriculum.ts:268, which only covers calendar DAYS), so in lib/schedule.ts:167 `(exerciseDay[e.id] ?? today) <= today` is always true for them. The pool has no unit-lock, gate-pool (GATE_OF_EXERCISE), transfer or mock exclusion; it only drops capstones. The ranking puts untouched reps first and prefers code over output.

prescribe (lib/today-plan.ts:135, 146-148) takes maintenance from `[...input.resolves, ...input.cold]` up to floor(N*0.2) slots, the first one at checks priority. The course dashboard (components/course/course-dashboard.tsx:48) uses this hook. The workspace lock (components/rep/rep-workspace.tsx:134) only applies to calendar lockDay, so a course gate variant or locked-unit rep opened from Today is not blocked.

gateStatus (lib/course/routing.ts:83) counts every attempt on a gate.pool id (`gate.pool.includes(a.exerciseId) && (a.completedAt || a.attemptsBeforePass > 0)`) without checking session kind or unit lock. A failed cold attempt therefore yields gate 'failed' with repairs, and passes count toward clearing.

I reproduced it by calling buildReviewSession on a single due skill review with no attempts, for each skill. Across 89 picks, 31 were transfer reps (many are Week-13 bank c13-t-*, plus b49/b128/b238/d3-vp/o2-dl ones), 13 were gate variants (c2-g-solve-a, c6-g-fast-slow-a, c8-g-graph-a, c10-g-interval-a/b, c11-g-dp-a, c12-g-dp-greedy-a/b/c, d3-cold-letter-pal), 14 were non-calendar course reps and 31 were calendar reps.

What I did not verify: the per-category counts the auditor gave (24/13/11/3). My mock/lab classification differed, since mock items showed up as transfer-flagged (e.g. o2-dl-lc-group-anagrams). I also did not re-run the exact 'beginner day 2' list. The mechanism is confirmed either way. Corrected: The finding is accurate in substance. Today's cold/maintenance slots come from buildReviewSession over ALL_EXERCISES, and the only filters are production kind, a calendar day (course reps have none, so they always pass), not already chosen, and non-capstone. Nothing excludes locked-unit reps, gate-pool variants, Week-13 transfer-bank reps (c13-t-*), unlabeled transfers or mock problems. Up to floor(N*0.2) of the day's slots can go to them, labelled 'cold', in course mode too. gateStatus counts any attempt on a pool id as a gate try, so a cold-slot gate attempt can fail a gate and trigger repairs, or clear it, outside the path. My per-skill reproduction found these first picks: 31 transfer (mostly c13-t-*), 13 gate variants, 14 other course reps and 31 calendar reps. The auditor's exact split (24 transfer / 13 gate / 11 mock / 3 lab) was not reproduced exactly; mocks show up in my run as transfer-flagged items. Severity stays critical: this breaks gates and untaught-content safeguards and spends the Week 13 bank early.

### 4. [CRITICAL] Week 1 and Week 2 required paths do not fit their contracts (73 vs 50, 208 vs 60; Week 8 81 vs 75); nothing classifies reps or tests the fit — CONFIRMED (severity keep)
- Spec: §8 FIX 1 (requirements and acceptance); §29 curriculum math; §2 principle 12
- Evidence: data/course/units.ts:49 `sections: ['c1-state', 'c1-while', 'd05-while']`, :64 `['c1-loop-control', 'o2-loops']`, :79 `['c1-running-state', 'd3-running-state']`; units.ts:201 w2-hashing 16 sections = 125 required reps; lib/course/week-status.ts:78 a finished week missing gates becomes `'recoverable'`; lib/course/course.test.ts:11 asserts only targets `[50, 60, 75, ...]`; planning/reps-v2-migration.md:39-40 itself lists 23+42 and 169+36 required
- Detail: Path reps plus minimum gate passes: W1 65+8=73 vs 50; W2 197+11=208 vs 60 (w2-hashing alone 125); W8 75+6=81 vs 75. Weeks 3–7 and 9–14 fit. Weeks 1–2 need 281 reps against a contract of 110, so a beginner doing exactly what is prescribed is still on Week-2 units in calendar weeks 4–5 (simulation agrees). weekProgress and WeekCard check the calendar week's gates, which the learner cannot reach yet, so every finished week is downgraded to 'recoverable' even though all prescribed work was done. This is the '50/50 but not actually done' case §8 forbids. Units have only sections/optional; there is no REQUIRED/OPTIONAL/REPAIR/RETRIEVAL/PLACEMENT/STRETCH classification, and whole legacy sections were inherited.
- Suggested fix: Add per-rep classification (or a curated required list) to units. Move the legacy bulk (w2-hashing's 125, o2-loops, d3-*, o11-edges) to optional, retrieval, repair or placement inventory. Add a test that required path plus gate need is at most weekTarget for every week, including holiday weeks.
- Verifier: The rep counts check out. I ran a throwaway script, now deleted, that used unitReps' own logic over SECTION_BY_ID with GATE_OF_EXERCISE variants excluded and added each gate's `need`. Week 1: 65 path reps + 8 gate passes = 73, against a target of 50. Week 2: 197 + 11 = 208, against 60, and w2-hashing alone has 125 path reps. Week 8: 75 + 6 = 81, against 75. Every other week fits. The rest of the claim also holds:
- `LearningUnit` (data/course/units.ts:17-35) only has `sections` and `optional`. There is no REQUIRED, REPAIR, RETRIEVAL, PLACEMENT or STRETCH classification.
- lib/course/course.test.ts:11 only asserts `targetProblems`. No test compares path size with the target.
- planning/reps-v2-migration.md:39-40 lists 23+42 and 169+36 required reps.
This is a critical problem, mainly because of Week 2.

Two parts of the evidence are wrong, though.

(1) The 'recoverable' downgrade never fires the way the claim says. In week-status.ts:78 it only applies when `ended`. components/use-course-day.ts:32 passes gates only for the current week, and the current week has never ended. Finished weeks (use-course-day.ts:34), the road map (road-map.tsx:62) and the readiness report (readiness-report.tsx:87) all call weekProgress with no gate or lab data. So a finished week is graded on its count alone and shows 'on-track' once the learner hits 50 or 60.

(2) The full-path sums overstate what a learner is forced to do. In lib/course/routing.ts:131, priorEvidence becomes true once 40% of a unit's path is passed. A gated unit whose gates have not been tried then switches to 'placement' (routing.ts:166), and courseQueue (routing.ts:208-210) offers only gate variants. Corrected: The rep counts are correct, and the claim is critical because Week 2 does not fit its contract.

**Counts (path reps + minimum gate passes):**
- Week 1: 65 + 8 = 73, against 50.
- Week 2: 197 + 11 = 208, against 60. w2-hashing alone is 125 reps (o2-* sections plus br-49 and br-128).
- Week 8: 75 + 6 = 81, against 75.
- All other weeks fit.

**What the claim leaves out:**
- **40% shortcut.** Once 40% of a gated unit's path is passed, `priorEvidence` (lib/course/routing.ts:131 `path.filter(...passed).length / path.length >= 0.4`) moves the unit to 'placement' (routing.ts:166). The queue then offers only gate variants (routing.ts:208-210).
- **Real minimum with the shortcut** (rounding up, assuming every gate passes first time):
  - Week 1 is about 48, which fits 50: 18 + (8+4) + (5+2) + (4+2) + 5. It only fits because of this accidental shortcut, since nothing defines a required path.
  - Week 8 is about 37, which fits.
  - Week 2 is about 100, still well over 60: 3+2 + 12+2 + 7+2 + 14 + 3+2 + 50+3. w2-hashing alone needs 53.
- **No classification and no test.** Nothing classifies reps into REQUIRED, OPTIONAL, REPAIR, RETRIEVAL, PLACEMENT or STRETCH. `LearningUnit` (units.ts:17-35) has only `sections` and `optional`, and whole legacy sections were inherited. No test checks fit; course.test.ts:11 only asserts the targets.

**The downgrade mechanism is wrong.** The claim says finished weeks drop to 'recoverable' because gates are missing. They don't:
- The gate and lab check in lib/course/week-status.ts:78 only runs when `ended`.
- components/use-course-day.ts:32 passes gates only for the current week, which has never ended.
- Finished weeks are graded on the count alone: use-course-day.ts:34 `weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate)`, road-map.tsx:62 and readiness-report.tsx:87 pass no gates.

**What actually goes wrong:**
- A learner who hits 60 in Week 2 sees that week as 'on-track'.
- The road map's weekState (road-map.tsx:24-27) still shows the week as 'active', not 'complete', because its units are not ready.
- readiness() (lib/course/readiness.ts:145-153) computes `behindWeeks = week - frontier.unit.week` and reports "The course is N weeks behind the calendar", rating the learner at-risk or off-track.

So the count says the week is done while the curriculum says it is not. That is the "50/50 but not actually done" contradiction that §8 forbids, and it breaks principle 12. It just shows up in the road map and the readiness rating, not through a 'recoverable' week status.

### 5. [CRITICAL] Week 2's required w2-testing path includes cold interview reps on binary search, stacks, intervals, grids and linked lists — CONFIRMED (severity keep)
- Spec: §2 principle 3; §8 classification
- Evidence: data/course/units.ts:156 `sections: ['c2-testing', 'o11-edges']`. Skills of the o11-edges reps (all stage retrieval, repType cold): o11-edge-bsearch-fix (binary_search, search_invariant), o11-wt-bsearch (search_invariant), o11-dbg-brackets (matching_pairs, stack_push_pop), o11-dbg-touching (interval_overlap, sorting), o11-dbg-empty-grid (grid_nested), o11-edge-kth-end (linked_list_traversal, two_pointer), o11-wt-two-sum (index_map, complement; w2-hashing is not a prerequisite)
- Detail: All 10 reps must be passed before w2-testing, and therefore w2-solve-map, can complete. About 7 of them test Week 3–10 material cold, long before it is taught. purposeOf turns them into 'gate' items labelled 'Checkpoint'; in the beginner simulation one Week-2 day held 11 'Checkpoint' items.
- Suggested fix: Move o11-edges to w14-interview or retrieval inventory and use edge-case reps on Week 1–2 material instead. Add a content test that every required path rep's skills are taught within the unit or its prerequisite closure.
- Verifier: The claim is substantially correct. Two details need fixing: the week range, and the description of how completion is blocked.

What I checked:
- data/course/units.ts:156 `sections: ['c2-testing', 'o11-edges']` with `gateIds: ['g-testing']`. The unit has no `optional` list. w2-solve-map has `prerequisites: ['w2-improve', 'w2-testing']` (units.ts:183).
- The o11-edges section (data/exercises/oct11.ts:2005) uses `exercises: edges`, defined at oct11.ts:770. It holds exactly 10 reps, each spread with `...W` (`{ stage: 'retrieval', repType: 'cold', style: 'write-test' }`, line 798) or `...R` (`{ stage: 'retrieval', repType: 'cold' }`, line 19). The reps and their skills:
  - o11-wt-profit, o11-dbg-profit, o11-edge-second: Week-1/2-appropriate.
  - o11-wt-bsearch and o11-edge-bsearch-fix: binary_search / search_invariant. Taught in w5-binary-search, Week 5.
  - o11-dbg-brackets: matching_pairs / stack_push_pop. Taught in w4-stacks, Week 4.
  - o11-dbg-touching: interval_overlap. Taught in w10-intervals, Week 10.
  - o11-dbg-empty-grid: grid_nested. Grids are taught in w8-grids, Week 8.
  - o11-edge-kth-end: linked_list_traversal + two_pointer. This is a from-scratch one-pass linked-list write (`kth_from_end(head, k)`, oct11.ts:1121ff). Taught in w5-linked-lists (Week 5) and w3-two-pointers.
  - o11-wt-two-sum: index_map / complement. Belongs to w2-hashing, which comes later in Week 2 and is not a prerequisite of w2-testing.
- lib/course/routing.ts:73 `unitReps` puts every o11-edges rep into the required path. Only gate-pool reps are excluded, and g-testing's pool is c2-g-test-a..d (data/course/gates.ts:40). A 'focused' route drops only the LESSON_LEVEL stages, and these reps are 'retrieval', so they stay in either route.
- routing.ts:194 `if (e.repType === 'cold' || e.stage === 'retrieval') return 'gate'` turns every one of them into a 'gate' purpose. components/course/course-today.tsx:42 and components/today-training.tsx:31 label that purpose 'Checkpoint'.

Corrections:
1. Week range. The later-week material is Weeks 4–10, not 3–10. Six reps cover later-week topics (2x binary search, brackets/stack, intervals, grid, linked list). A seventh (two-sum) tests same-week hashing before its unit. "About 7" is accurate only if two-sum is counted as untaught.
2. How completion is blocked. Readiness for a unit with a live gate is `ready = liveGates.length ? gatesCleared : pathDone` (routing.ts:154). Strictly, the path does not gate completion; clearing g-testing does. However, courseQueue only offers the gate variants `if (s.path.every((e) => passed.has(e.id)))` (routing.ts:220). So on the prescribed Today flow, all 10 o11-edges reps (plus c2-testing) must be passed before the g-testing checkpoint appears. That in turn blocks w2-solve-map. In practice, then, the claim holds.
3. Not verified. I did not run the simulation, so the "11 Checkpoint items on one Week-2 day" figure is unconfirmed. The labelling path that would produce it is confirmed.

Severity: critical stands. This directly violates §2 principle 3 ("teach prerequisites before testing them") and principle 7. It also inflates the Week-2 required path against the §8 classification requirement: these should be RETRIEVAL/STRETCH/OPTIONAL, not REQUIRED PATH. Corrected: w2-testing (data/course/units.ts:156) maps the whole legacy o11-edges section into its required path. That section has 10 reps, all `stage: 'retrieval', repType: 'cold'` (data/exercises/oct11.ts:19 `R`, :798 `W`). Six of them test topics first taught in Weeks 4–10:
- o11-wt-bsearch and o11-edge-bsearch-fix: binary search, w5
- o11-dbg-brackets: stack/matching pairs, w4
- o11-dbg-touching: intervals, w10
- o11-dbg-empty-grid: grids, w8
- o11-edge-kth-end: a from-scratch one-pass linked-list function, w5 linked lists plus w3 two pointers

A seventh, o11-wt-two-sum, tests index_map/complement from w2-hashing, which is not a prerequisite of w2-testing.

w2-testing's readiness formally depends on clearing g-testing (routing.ts:154). But courseQueue offers the g-testing variants only after every path rep has passed (routing.ts:220), so the learner must pass all 10 to progress. Until then w2-solve-map (prerequisite, units.ts:183) stays locked. purposeOf (routing.ts:194) classifies all of these as 'gate', and the Today UI labels that 'Checkpoint' (course-today.tsx:42, today-training.tsx:31). The "11 Checkpoint items in one day" simulation figure was not independently reproduced.

### 6. [CRITICAL] prescribe cannot fill the day when the rest of the queue is heavy or short: Week 13 caps at 5/15, blocked-checkpoint and end-of-unit days at 3–4/15 — CONFIRMED (severity keep)
- Spec: §7 truthful daily contract; §2 principles 5, 8, 13; §29 daily completion
- Evidence: lib/today-plan.ts:67 `export const LOAD_HEADROOM = 1.3`; today-plan.ts:120 `const fits = (c: Candidate) => count < N && (c.units <= 1 || load + c.units + (N - count - 1) <= maxLoad) && ...`; today-plan.ts:171 `if (e.transfer) return 2`; data/course/units.ts:562 `sections: ['c13-transfer']` (48 transfer reps); routing.ts:210 locked dependants contribute nothing; components/course/course-today.tsx:209 a CTA only when `next` exists
- Detail: With N=15, the load limit is 20 and every remaining item weighs 2, so at most 5 fit (2k + 15 - k <= 20). Simulated: every Week-13 day 4–5 of 15. 2026-12-10: 4 of 15, because the last w7-trees rep (d06-mut-copy, weight 2) does not fit. When the current unit is blocked on a failed checkpoint and its dependants are locked, the queue holds a few repairs and variants: 3 of 15 on 2027-01-07/08, 6–9 of 15 on other days. Once those few items are done Today has no next step, the day can never complete, the streak breaks and the week goes off track, so the learner is punished for following Today and for failing a checkpoint. Warm-ups and maintenance add at most 6 more. lib/capacity.test.ts:109-123 only covers queues that still contain light reps.
- Suggested fix: When no light candidate remains, accept heavy items up to N. When the course queue runs out, fill from retrieval of ready units within the horizon or from optional sections. If the day still cannot reach N, lower the day's requirement to what Today can actually prescribe, or show the gap explicitly.
- Verifier: I checked every link in the chain, and the core of the claim holds. Two details are wrong or overstated.

What I confirmed:
- `lib/course/capacity.ts` sets requiredReps to `dailyTarget(week)`, which is 15 from week 3 on (`data/course/calendar.ts`).
- `prescribe` sets `maxLoad = loadLimit(N) = round(15*1.3) = 20` (`lib/today-plan.ts:67`, line 70 and line 103).
- In `fits` (`lib/today-plan.ts:120`), a weight-2 rep is taken only if `load + 2 + (N - count - 1) <= 20`. Light items cancel out of this check: each one adds 1 to load and 1 to count. With h heavy reps already taken, the check reduces to h <= 4, so at most 5 heavy reps can ever be prescribed in a day.
- Week 13 has `sections: ['c13-transfer']` (`data/course/units.ts:562`). Every rep there is `transfer: true` (`data/exercises/course/week13.ts:11`), and `repUnits` gives it weight 2 (`today-plan.ts:171`).
- `courseQueue` (`lib/course/routing.ts:206-208`) skips locked units and anything past the horizon. Week 14 requires w13, so it stays locked. The only other plan items left are LeetCode targets, which weigh 3.
- Done reps keep counting toward load (line 116). So once 5 transfer reps are done (load 10), no more heavy reps fit for the rest of the day.
- In `course-today.tsx:68-70` and 209, `next = left[0]`, and the CTA renders only when `!complete && next`. The bonus/keep-going link (lines 323-336) appears only inside the `complete` panel. So when the prescribed items run out before 15, Today shows no next step at all.
- For the blocked-checkpoint case: `courseQueue` adds only repairs plus unpassed path items. Gate variants are added only when a gate has no repairs left (line 214). Dependant units are locked. So the queue can be very short. This part is caused by a shortage of queue items, not by the load cap.
- `capacity.test.ts:109-123` only tests queues that still contain light reps (`...plan`). It never tests an all-heavy queue.

What is inaccurate:
1. The Week-13 count is not strictly "4–5 of 15". Warm-ups and redos (`SHARE.prep`, floor(15*0.2) = 3) and maintenance (cold reps and re-solves, 3) can be added on top. When those exist, the day reaches up to 11, which is still short of 15. The auditor's own "add at most 6 more" says the same thing.
2. "The day can never complete" is too strong. `lib/course/credit.ts` (`dailyCredits`/`qualifies`) credits any qualifying pass, whether or not it was prescribed. A learner who leaves Today and opens Week-13 transfer reps from the course or unit pages can still reach 15. What is true is that Today, the command center, cannot get them there and offers nothing once its short list is done. That breaks principle 13 and the §7/§8 rule that the prescribed daily work and the target must agree.

Severity stays critical. If the learner follows Today exactly, they still miss the target on every Week-13 day and on days blocked by a checkpoint. This makes the daily contract untruthful (§7, §8 acceptance) and punishes the learner for a failed checkpoint (principle 8). Corrected: The structural bug is real, and it is in `lib/today-plan.ts:120` combined with `LOAD_HEADROOM = 1.3` (line 67). With N=15 the load limit is 20. A weight-2 rep is accepted only while load + 2 + (slots left - 1) <= 20. Light items cancel out of that check, so a day can never prescribe more than 5 heavy reps (weight >= 2). Done reps keep counting toward load (line 116), so after 5 heavy reps no further heavy rep is offered that day.

In Week 13 the required queue is only the 48 transfer reps (`data/course/units.ts:562`; `week13.ts:11` sets `transfer: true`; `repUnits` returns 2 at `today-plan.ts:171`). Week 14 is locked until Week 13 is done (`routing.ts:206-208`), and the only other plan items are weight-3 LeetCode targets. So Today prescribes 5 transfer reps, plus at most 3 warm-ups/redos and 3 cold reps or re-solves when those exist. That is roughly 5 to 11 of 15, never 15.

On a day blocked by a failed checkpoint the queue itself is short: repairs plus unpassed path items, gate variants only after the repairs (`routing.ts:210-215`), and dependants locked. The cause there is too few queue items, not the load cap.

When the list runs out, `course-today.tsx:209` (`!complete && next`) shows no CTA. The Bonus/keep-going link (lines 323-336) appears only after the day is complete, so Today gives no next step.

The day is not literally impossible to complete. `lib/course/credit.ts` credits any qualifying pass, so reps done from the course or unit pages still count. But following Today alone cannot reach the target. This violates §2 principles 8 and 13 and §7/§8: the prescribed work and the daily target do not match. The tests at `lib/capacity.test.ts:109-123` never cover an all-heavy or short queue.

### 7. [CRITICAL] A checkpoint can be cleared with AI help or by replaying the exact variant that failed — CONFIRMED (severity keep)
- Spec: §2 principles 6, 7; REPS_2_MASTER_SPEC §12 (a different variant after a failure)
- Evidence: lib/course/credit.ts:77-80 `return (e === 'cold-independent' || e === 'independent' || e === 'retrieval' || e === 'self-corrected') && a.attemptsBeforePass <= 2`; components/rep/rep-workspace.tsx:1449-1452 `{phase === 'failed' && (<button ... onClick={explainMistake}>` is not inside `!bare`, and explainMistake (704-726) never calls countHint; app/api/coach/diagnose/route.ts asks for 'the exact line/construct'; rep-workspace.tsx:731-732 the workspace's own repair panel after REPAIR_AFTER=2 has no checkpoint exclusion, and 742-748 `resume: here` returns to the same variant; rep-workspace.tsx:1471-1479 Another/Easier/Harder rep are available on checkpoints; routing.ts:86-88 a later clean pass of a previously failed variant counts
- Detail: On a cold checkpoint the learner can fail once, have the AI name the faulty line, fix it and pass. That is recorded as 'self-corrected', which counts as gate-clean and as coldEvidence. After 2 failed runs, the workspace offers its own repair set (different from gateStatus.repair) and sends the learner back to the same variant. A fresh attempt there passes as independent and counts, so the exact failed checkpoint is replayed even though gateStatus keeps it out of the queue.
- Suggested fix: On checkpoint reps, hide Explain mistake, Another/Easier/Harder rep and the workspace repair panel, or record them as assistance. In gateStatus, do not count a clean pass of a variant that has an earlier failed try until the other variants are used up.
- Verifier: I read the code paths and the claim's core holds.

1. **AI help on a checkpoint is not recorded.** In components/rep/rep-workspace.tsx:825-828 a checkpoint sets `bare` (`const checkpoint = Boolean(ex.gate || gateId) && !passed`; `const bare = interview || checkpoint || transferWeek`). The Hint button at line 1443 is wrapped in `{!bare && ...}`, but the "Explain mistake" button at lines 1449-1452 is only wrapped in `{phase === 'failed' && ...}`, so it shows on a cold checkpoint. `explainMistake` (lines 704-726) calls `requestDiagnosis` and then only does `persist({ ...a, mistakeType, mistakeNote })`. It never calls `countHint` and leaves `hintsUsed` at 0. The diagnosis is rendered at lines 1134-1137 with no `bare` check, and app/api/coach/diagnose/route.ts:14 tells the model to name "the exact line/construct".
   - When the learner fixes the code and passes, `attemptsBeforePass` is 1. In lib/course/credit.ts `masteryEvidence` then returns 'self-corrected' (hintsUsed is 0 and attemptsBeforePass > 0).
   - `gateClean` (credit.ts:77-80) accepts 'self-corrected' with `attemptsBeforePass <= 2`, and `coldEvidence` accepts it too. So an AI-guided fix clears the gate as clean, cold evidence. That breaks principle 6 ("Assistance must not masquerade as independence").

2. **The exact failed variant can be replayed and counted.** At rep-workspace.tsx:731-732 the repair memo is null only when `fails < REPAIR_AFTER` (REPAIR_AFTER = 2, lib/session-planner.ts:292), in interview mode, or in a repair session. Checkpoints are not excluded, and the panel shows at line 1114 (`repair && phase === 'failed'`). `startPlannedRepair` (lines 742-748) sets `resume: here = /rep/${ex.id}`, which is the same variant.
   - On return the workspace remounts and `ensureAttempt` (lines 389-410) builds a new attempt with `attemptsBeforePass: 0`. A pass there is 'independent' or 'cold-independent'.
   - `gateStatus` (lib/course/routing.ts:80-88) counts any `gateClean` attempt on a pool variant that is not already in `clean`, so a clean retry of the variant that just failed counts.
   - No guard on app/rep/page.tsx or the workspace stops a failed variant from being opened directly. The "never the one that just failed" ordering in gateStatus only affects which variant is queued next. This breaks REPS_2_MASTER_SPEC §12 (a different variant after a failure) and principle 7.

3. **Minor overstatement.** "Another/Easier/Harder rep" (lines 1471-1479) produce AI-generated exercises, not gate pool variants, so they cannot clear the gate themselves. They are only additional help on the checkpoint page. The workspace repair set also differs from `gateStatus.repair`, as the claim says, but the bug is the resume target, not the set itself.

Critical severity is justified: the checkpoint record is untruthful because assisted or replayed passes are counted as independent gate clears. Corrected: Accurate as stated, with one refinement: Another/Easier/Harder rep on a checkpoint only generate AI exercises outside the gate pool, so they are extra help rather than a way to clear the gate.

The two real bypasses:

(a) Fail once, then use "Explain mistake". It is shown on checkpoints at rep-workspace.tsx:1449 because it is not inside `!bare`. It never increments hintsUsed (lines 704-726), and the diagnose route names the exact faulty line. The fixed pass is then recorded as 'self-corrected', which `gateClean` (credit.ts:79) and `coldEvidence` both accept.

(b) After 2 failed runs, the workspace repair panel (rep-workspace.tsx:731-748) does not exclude checkpoints and resumes to `/rep/${ex.id}`, the same variant. The remount creates a new attempt with `attemptsBeforePass: 0`. Its clean pass counts in gateStatus (routing.ts:83-88) because nothing stops a previously failed variant from counting. The gateStatus ordering that avoids the failed variant only affects which variant is queued next. No route guard stops the learner from opening that variant directly.

### 8. [MAJOR] Daily completion only counts reps: a prescribed checkpoint or repair can stay undone at 'Day complete', then disappears or appears as 'Bonus' — CONFIRMED (severity keep)
- Spec: §7 one authoritative completion contract; §3; §29 daily completion and Today visibility
- Evidence: components/course/course-today.tsx:68 `const complete = day.type === 'training' && done >= target`; lib/today-plan.ts:164 `complete: repsDone >= N`; course-today.tsx:252 `{!complete && plan.items.length > 0 && (` hides the list; course-today.tsx:332-334 `Bonus: {plan.optional.find((o) => o.exerciseId)!.title}`; use-today-plan.ts:65 `required` only bypasses the 30% cap; components/course/course-cards.tsx:76-82 checkpoint rows are plain text
- Detail: Any qualifying credits, including other reps and logged outside LeetCode problems, complete the day while the prescribed checkpoint or repair is still undone. The training list is then hidden, and a checkpoint at the head of the queue that was not yet taken into today's items is offered through the ghost 'Bonus:' button. `required` is never consulted for completion. WeekCard lists the calendar week's checkpoints as plain text with no link, often for locked units, so a required checkpoint cannot be started from Today unless the queue has reached it.
- Suggested fix: Make complete mean N credits AND every required item prescribed today done. Keep unfinished required items visible in the complete state and never call them Bonus. Link checkpoint rows to their next variant, or to 'locked until X'.
- Verifier: I checked every cited line and the claim holds. In components/course/course-today.tsx:66-68, completion is `const done = cd.doneToday` / `const complete = day.type === 'training' && done >= target`. cd.doneToday is `done.length`, where `done = credits.items[today] ?? []` (components/use-course-day.ts, inside the useMemo). So it is a plain count of today's qualifying credits, and those include logged outside LeetCode solves. Nothing in it checks gates, repairs or labs. lib/today-plan.ts:164 `complete: repsDone >= N` is the same count, and the UI does not even use it. `required` is set only at components/use-today-plan.ts:65 (`required: q.purpose === 'gate' || q.purpose === 'repair'`). It is read only in prescribe's fits/take (today-plan.ts:120,125), where it bypasses the foundation checks cap, and never for completion.

Once complete is true, `{!complete && plan.items.length > 0 && (` (course-today.tsx:252) hides the training list, so an untaken gate or repair item disappears. In the complete panel, the 'Tomorrow' line and the `Bonus: {plan.optional.find((o) => o.exerciseId)!.title}` button (lines 311 and 332-334) both take the first open plan exercise. That is the queue head (`lead = [nextPlan.find((c) => c.exerciseId) ...]`, today-plan.ts:162-163). If the queue head is a gate or repair, it is offered as an optional 'Bonus' (the button is styled btn-ghost). Only the summary line '{gatesCleared} of {weekGates.length} checkpoints cleared' (line 306) hints that anything is still open.

WeekCard's checkpoint rows (course-cards.tsx:76-82) are plain `<span>{g.gate.title}</span>` with no link. weekGates is every gate with available variants for units in the calendar week (use-course-day.ts), with no filter for locked units. So a gate can be started from Today only once the queue reaches it.

This breaks §7 directly ('Do not show "DAY COMPLETE 15 / 15" if a required lab or checkpoint is still unfinished'), §29's daily-completion and Today-visibility tests, and §3. Severity stays major. It could be argued as critical under principle 12 ('truthful about progress'), but major is defensible as a direct V2.1 requirement failure. Corrected: The claim is accurate, and the gap is slightly wider than stated. In course-today.tsx:68, Today's 'Day complete' is `day.type === 'training' && cd.doneToday >= day.target`. cd.doneToday is `credits.items[today].length` (use-course-day.ts), not prescribe()'s `complete`. So completion ignores required checkpoints, required repairs and also required labs, even though cd.labs and cd.weekGates are computed right beside it and used only for the week display. `required` (use-today-plan.ts:65) only bypasses the 30% foundation checks cap in prescribe (today-plan.ts:120,125). After completion the item list is hidden (course-today.tsx:252). If the queue head is a gate or repair, it shows up as 'Tomorrow' and as a ghost 'Bonus:' button (course-today.tsx:311, 332-334, via today-plan.ts:162-163). WeekCard checkpoint rows (course-cards.tsx:76-82) are unlinked plain text and are not filtered for locked units. Minor precision: a gate becomes the 'Bonus' only when it is the first open exercise in the course queue. Otherwise an untaken gate is simply not shown on Today at all, apart from the 'X of Y checkpoints cleared' count (course-today.tsx:306).

### 9. [MAJOR] Attempts from before the course decide gates: no recency or cold requirement, gates already cleared on day 1, and any old attempt turns off placement — CONFIRMED (severity keep)
- Spec: REPS_2_MASTER_SPEC §43 (coldGateRecentlyClean), §11; §2 principle 12
- Evidence: routing.ts:83 `const tries = ctx.attempts.filter((a) => gate.pool.includes(a.exerciseId) && (a.completedAt || a.attemptsBeforePass > 0))` has no date bound; credit.ts:79 accepts 'independent' (not cold); data/course/gates.ts:42 `pool: ['o2-cold-letter-counts', 'o2-cold-tally', ...]` and the October-rep pools at gates.ts:44-73; routing.ts:164 placement requires `!liveGates.some((g) => g.attempted)`
- Detail: For a learner with all October content passed: 14 gates (g-hashing, g-pointer-mechanics, g-fixed-window, g-variable-window, g-stack, g-search-invariant, g-safe-rewiring, g-tree-contract, g-grid, g-graph-traversal, g-heap, g-backtracking, g-dp, g-matrix) are cleared on Oct 26, and 14 units are ready with no course checkpoint. A pass from 86 days earlier still clears (unit shows 'maintenance'). Three first-exposure passes clear g-hashing. The reverse also happens: with 2 of 3 g-hashing variants passed in October the unit is 'practicing' rather than placement, and the last variant waits behind 52 focused path reps. A failed October attempt starts the course 'gate-blocked' with repairs.
- Suggested fix: Count toward clearing or failing only gate tries made in checkpoint conditions (on or after COURSE_START, or within a recency window, cold). Treat older passes as prior evidence that triggers placement.
- Verifier: I read the code and the mechanism checks out. lib/course/routing.ts:83 picks gate attempts with `ctx.attempts.filter((a) => gate.pool.includes(a.exerciseId) && (a.completedAt || a.attemptsBeforePass > 0))`. Nothing in it checks the date, COURSE_START ('2026-10-26', data/course/calendar.ts:9) or ctx.today. Line 92 then marks the gate cleared once `clean.length >= need`. gateClean (lib/course/credit.ts:79-81) accepts 'cold-independent', 'independent', 'retrieval' and 'self-corrected' with at most 2 failed runs. It never asks for an earlier pass or for any recency, so first-exposure passes count. The g-hashing pool (data/course/gates.ts:42, need 3) and many week 3-12 pools (lines 44-73) are October rep ids (o2-*, d3-*, d4-*, d05-*, d06-*, o7/o8-*, d9-*, d10-*, mx-*), so October passes clear those gates outright. A cleared gate makes the unit ready, and line 162 only switches the label to 'maintenance' when the last activity is more than 14 days old. A stale pass still counts as cleared. That is the opposite of §43's coldGateRecentlyClean, and it also cuts against the unit's own wording ('prove it cold', units.ts:197).

The reverse cases hold too. Line 164 offers placement only when `!liveGates.some((g) => g.attempted)`, so any earlier gate attempt removes placement. Line 94 marks a gate failed when the last try was not clean, and line 163 then starts the unit as 'gate-blocked' with repairs. Line 220 queues gate variants only once `s.path.every((e) => passed.has(e.id))`, so a half-cleared gate waits behind the whole focused path.

Two parts I did not check. I did not reproduce the exact numbers ('14 gates', '52 reps', '86 days'); they depend on which content exists and the learner's data, though the mechanism behind them is real. And the master spec §11 does allow placement from earlier production evidence ('Strong: cold checkpoint → pass → ready/maintenance'). So the defect is not that October evidence counts at all. It is that a pass counts with no recency or in-course check, that it skips the placement checkpoint, and that an earlier gate attempt disables placement or blocks the unit. Major fits. Corrected: Accurate as stated, with one nuance. §11 allows earlier production evidence to place a learner, but only by passing a cold checkpoint. The code instead treats any old pass of a gate variant as clearing the gate. routing.ts:83 has no date, recency or COURSE_START filter. credit.ts:79-81 gateClean also accepts plain 'independent' and first-exposure passes. As a result, units whose gate pools use October reps (gates.ts:42-73) become ready or 'maintenance' before the course begins (routing.ts:162), however old the pass is. The reverse also happens. Any earlier attempt on a gate removes placement (routing.ts:164). A failed October attempt starts the unit 'gate-blocked' (routing.ts:94, 163). A partly cleared gate's remaining variants are queued only after the whole path is done (routing.ts:220). The specific counts (14 gates, 52 reps, 86 days) depend on the data and I did not verify them independently.

### 10. [MAJOR] Frontier/horizon: an ahead learner pulls Week 13 into Week 2, and once every unit is ready the queue empties and Today prescribes nothing — CONFIRMED (severity keep)
- Spec: §2 principles 10, 13; §24; §29 Today
- Evidence: routing.ts:206-207 `const frontier = statuses.find((s) => s.state !== 'ready' && s.state !== 'maintenance')` / `const horizon = (frontier?.unit.week ?? 14) + 1`; routing.ts:216-225 ready and maintenance units contribute only LC targets; course-today.tsx:327 `focusConcepts[0] && !week.unlabeled` uses the calendar week
- Detail: In the simulation with all October content passed, the frontier reached w13-transfer on 2026-11-05 (calendar week 2) and the unlabeled transfer bank was served from Week 2 (3–5 a day). Because unlabeled mode is keyed to the calendar, those items also get 'Review a concept' links. From 2026-12-02 the queue was empty and Today showed 0 of 15 on every training day until Jan 31. Units in maintenance generate no course work.
- Suggested fix: Do not open Week 13 and Week 14 units before their calendar week or readiness grade. When the frontier passes the calendar, fill from retrieval of ready units or stretch/optional sections. Key unlabeled mode to the item's unit, not the calendar.
- Verifier: I read the cited code and it matches the claim. In lib/course/routing.ts:206-207 the frontier is the first unit that is neither 'ready' nor 'maintenance', and horizon = frontier.week + 1, falling back to 14. Lines 210-225 show that ready and maintenance units add only the unsolved LC items `[...unit.targets, ...(unit.readinessTargets ?? [])]`. Units with no gates count as ready once their path is done (routing.ts:154 `const ready = liveGates.length ? gatesCleared : pathDone`), so the frontier can move ahead quickly. w13-transfer (data/course/units.ts:553-566) has `gateIds: []` and `targets: []`, and the units after it, including w14-interview, also have no targets. Once the whole path is passed and every LC target is solved, courseQueue returns []. use-today-plan.ts then builds `plan` from course.queue alone (the 90-day queue is used only before COURSE_START), and course-today.tsx has no fallback when the plan is empty. The calendar-keyed leak is also real. In course-today.tsx:97, focusConcepts comes from conceptFor(exercise.skills) on the plan items. Line 327 hides the 'Review a concept' link (href /learn/<conceptId>, which names the technique) only when `!week.unlabeled`, and data/course/weeks.ts:59 sets unlabeled only when calendar week n === 13. So Week 13 items served in Week 2 show a link that points at their concept. Two parts of the claim go too far. (1) "Today prescribes nothing" is not quite right. prescribe() in lib/today-plan.ts still fills slots from prep (warm-ups and redos), due LC re-solves and cold review reps. Prep is capped at floor(0.2N) and re-solves plus cold reps share a separate floor(0.2N) cap, so for N=15 that is at most about 6 items. That may be zero on a given day, so I could not confirm the simulation's literal "0 of 15", but either way the plan adds nothing and the day's target cannot be met. (2) Serving Week 13 early does not by itself break dependency order (principle 9). The horizon allows working ahead by design, and w13's prerequisites (w12-*) are ready. The real harm is that §24 safeguards are tied to the calendar: rep-workspace.tsx:812 correctly hides labels by unit (`UNIT_OF_EXERCISE[ex.id] === 'w13-transfer'`), but Today's link does not. A product that runs out of required work and leaves an impossible daily target is a material failure of principle 13 and §7/§29 (a deterministic current CTA, an honest daily contract), so major is the right severity. Corrected: The claim is confirmed, with two corrections. (a) When every unit is ready or in maintenance and all LC targets are solved, courseQueue (lib/course/routing.ts:204-229) returns an empty list, so the plan part of Today (components/use-today-plan.ts `plan = coursePlan ?? ...`) is empty. Ready and maintenance units add only unsolved LC targets (routing.ts:224) and never retrieval or maintenance reps. Today is not strictly empty, though: prescribe() (lib/today-plan.ts) still adds warm-ups and redos (capped at floor(0.2N)) and due re-solves and cold reviews (a separate floor(0.2N) cap), so about 6 or fewer of a 15-rep target for N=15. The daily target can then never be met, and course-today.tsx has no state for running out of course work. (b) Working ahead to w13-transfer comes from the horizon design (routing.ts:206-207: frontier = first non-ready unit, horizon = its week + 1). Ungated units count as ready once their path is done (routing.ts:154), and w13-transfer has no gates or targets (data/course/units.ts:553-566). This respects prerequisites, so it does not break dependency order. The confirmed §24 problem is narrower: course-today.tsx:327 shows the 'Review a concept' link (`/learn/${focusConcepts[0]}`, whose URL names the technique) based on the calendar week's `week.unlabeled` (data/course/weeks.ts:59, `n === 13`), so Week 13 transfer items served earlier get a concept link. rep-workspace.tsx:812 already hides labels correctly by unit membership. Severity stays major.

### 11. [MAJOR] Repair reps passed earlier the same day show as done but are still pending, so the failed checkpoint cannot be retried until tomorrow — CONFIRMED (severity keep)
- Spec: §2 principle 8; §4 Q12; §29 Today visibility
- Evidence: routing.ts:100 `const fresh = (id: string) => ctx.attempts.some((a) => ... && time(a) > time(last))`; routing.ts:221 `if (!g.repair.length) for (const id of g.next) ...`; lib/today-plan.ts:109 `const done = new Map(all.filter((c) => doneKeys.has(c.key))...` and :118 `open` excludes done keys
- Detail: Repairs are the 3 easiest unit reps for the broken skills, usually reps passed that morning on the path. Reproduced: g-loop-control fails after the morning path, giving repairs [c1-loop-fill-scan, c1-loop-dbg-past-end, c1-loop-rebuild-first-negative]. Today lists all three as DONE 'Repair' items, routing still has them pending, and no g-loop-control variant is offered for the rest of the day. In the failure simulation this left days blocked on a checkpoint at 3 of 15.
- Suggested fix: Choose repair reps not passed today, or give repair items their own key (for example repair:<gate>:<id>) so they are not merged with reps already done today.
- Verifier: I read the code path end to end and the mechanism holds.

1. In lib/course/routing.ts:100-104, repairs are the 3 easiest code reps in the unit's own pool (`.slice(0, 3)`). A repair only counts as finished when `fresh(id)` holds, which needs a clean pass with `time(a) > time(last)`, meaning a pass after the failed checkpoint attempt.
2. routing.ts:220-221 only queues a gate once `s.path.every(passed)`. So every repair candidate on the path has already been passed before the checkpoint can fail. When the checkpoint is tried on the same day the path was finished, those passes happened earlier that day.
3. routing.ts:217 pushes each pending repair with `key: id`, the bare exercise id. routing.ts:221 then holds back the next variant: `if (!g.repair.length) for (const id of g.next)`.
4. components/use-today-plan.ts:85-95 builds `doneToday` from every rep passed today, keyed by exerciseId, and filters it through credits. Credit is the first qualifying pass of the day (credit.ts dailyCredits), so the morning passes count.
5. lib/today-plan.ts:109 maps those keys onto the plan candidates, which now have kind 'repair', and marks them done. course-today.tsx:42 labels them 'Repair'. today-plan.ts:118 `open` excludes done keys, so they are left out of both `items` and `optional` (:156-157).

The result: Today shows the repairs as DONE, routing still lists them as pending, and no checkpoint variant is queued. The block only clears when the user re-passes the repair reps after the failure time. Today never offers them that day, so in practice that happens tomorrow, when `doneToday` resets and they show up again as open. The other way out is opening the reps by hand outside Today, which earns no extra credit because credit is once per rep per day.

I did not re-run the 3-of-15 simulation. The code makes the outcome follow directly. 'Major' is right: the product is wrong about the state (done in one place, pending in another) and the repair→fresh-checkpoint loop stalls for a day. Corrected: The claim is accurate, with one clarification: the failed checkpoint is not hard-blocked until tomorrow. It is blocked until each repair rep is passed again after the failure time. Today never offers those reps again that day, so in practice the block lasts until the next day, unless the user opens the repair reps by hand outside Today (which earns no credit because credit is once per rep per day). This always applies when the checkpoint fails on the same day the path was finished. Repairs are taken from the unit path (routing.ts:99-103), and the gate is only queued after the whole path is passed (routing.ts:220), so every repair candidate was passed before the failure. Root cause: routing.ts:217 queues repairs keyed by bare exerciseId, and Today's `doneToday` (components/use-today-plan.ts:85-95) uses the same keys. That lets today-plan.ts:109 mark them done and :118 drop them, while routing.ts:103 `fresh` still needs a pass with `time(a) > time(last)` and routing.ts:221 holds `g.next` back while `g.repair.length > 0`.

### 12. [MAJOR] Ordinary cold path reps are labelled 'Checkpoint' and marked required — CONFIRMED (severity keep)
- Spec: §2 principle 12; §4 Q10; §5
- Evidence: routing.ts:194 `if (e.repType === 'cold' || e.stage === 'retrieval') return 'gate'`; use-today-plan.ts:65 `required: q.purpose === 'gate' || q.purpose === 'repair'`; course-today.tsx:54 `gate: 'A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next.'`
- Detail: Path reps that are not gate variants get purpose 'gate': all 10 o11-edges reps (Week 2), the 4 tr-chk-* reps (w12), d9-cold-sort-second-desc and d9-cold-top-words (w10), and the Week-14 cold bank. Today calls them checkpoints and promises they unlock what comes next. The workspace treats them as normal reps with hints and solution, because they have no GATE_OF_EXERCISE entry. `required` lets them bypass the 30% foundation cap (a Week-2 day had 11 'Checkpoint' items).
- Suggested fix: Give purpose 'gate' only to queue items that have a gateId; give cold path reps a non-required 'retrieve' or 'prove' purpose.
- Verifier: I confirmed the claim by reading the code and running a throwaway script, which I deleted afterwards.

**How a path rep gets the 'gate' purpose.** `unitReps` (lib/course/routing.ts:73-74) removes every id listed in GATE_OF_EXERCISE, so `s.path` holds ordinary path reps only. `courseQueue` (routing.ts:218) still runs `purposeOf(e)` on each of them. `purposeOf` (routing.ts:189-196) returns 'gate' for any rep with `repType === 'cold' || stage === 'retrieval'` that is not a capstone, transfer, lesson-level or combine rep.

**How Today shows and schedules them.** In components/use-today-plan.ts:65, `COURSE_KIND.gate = 'gate'` (line 25) and `required: q.purpose === 'gate' || q.purpose === 'repair'`. components/course/course-today.tsx:42 then labels them `gate: 'Checkpoint'` and line 54 adds "A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next." The same text is in components/today-training.tsx:31 and :47. lib/today-plan.ts:120 has `(isCore(c.kind) || c.required || checks < checksMax)` and :125 has `if (!isCore(c.kind) && !c.required) checks++`, so required items skip the checks/foundation share.

**Which reps are affected (computed from UNITS, SECTION_BY_ID and EXERCISE_BY_ID).**
- w2-testing: 10 o11-* reps (wt/dbg/edge)
- w10-intervals: d9-cold-sort-second-desc and d9-cold-top-words
- w12-matrix-tries: the 4 tr-chk-* reps
- w14-interview: 39 reps (o11-speed-*, o11-bug-*, cold-*, o11-cx-*, o11-opt-common)

None of them has `ex.gate` or a GATE_OF_EXERCISE entry.

**What the workspace does with them.** components/rep/rep-workspace.tsx:824-828 sets `checkpoint = Boolean(ex.gate || gateId) && !passed` and `bare = interview || checkpoint || transferWeek`. For these reps that is false, so hints, the lesson panel and the solution all stay available. That contradicts the "no lesson panel, no solution" promise Today makes.

**Minor nuances.**
- The d9-cold-* and tr-chk-* reps have `cleanPass: true`, which hides their labels (line 812). Passing one with the solution open only flags it as "uncleared" (line 816); it still does not make them checkpoints.
- "Unlocks what comes next" is loosely true, because finishing the path lets the real gate variants into the queue (routing.ts:220-221). Each of these reps still unlocks nothing by itself.

This is a truthfulness failure on Today plus a bypass of the plan's share rule, so major is the right severity. Week 14 is the largest case at 39 reps. Corrected: The claim is accurate, and Week 14 is bigger than "the cold bank" suggests: 39 path reps in w14-interview get purpose 'gate'. They are o11-speed-*, o11-bug-*, cold-*, o11-cx-* and o11-opt-common.

The other affected path reps are:
- the 10 o11-* reps in w2-testing
- d9-cold-sort-second-desc and d9-cold-top-words in w10-intervals
- the 4 tr-chk-* reps in w12-matrix-tries

The cause is `purposeOf` in lib/course/routing.ts:194, which returns 'gate' for any `repType === 'cold' || stage === 'retrieval'` rep. Because of it, Today:
- labels these reps 'Checkpoint' (course-today.tsx:42 and :54; also today-training.tsx:31 and :47)
- marks them `required` (use-today-plan.ts:65)
- exempts them from the checks share (today-plan.ts:120 and :125)

rep-workspace.tsx:824-828 does not treat them as checkpoints, because they have no `ex.gate` and no GATE_OF_EXERCISE entry. So hints and the solution stay available.

Two nuances:
- The w10 and w12 reps have `cleanPass: true`, so their labels are hidden until they are passed.
- Finishing the path does release the real gate variants (routing.ts:220-221), so "unlocks what comes next" is only loosely true and does not apply to any one rep.

### 13. [MINOR] readinessTargets behave exactly like targets; 25 of 48 target entries never surface because passing the in-app capstone counts as solving them — CONFIRMED (severity keep)
- Spec: REPS_2_MASTER_SPEC §43-44; spec §5 TARGET step
- Evidence: routing.ts:225 `for (const lc of [...unit.targets, ...(unit.readinessTargets ?? [])])`; data/course/units.ts:33 `/** Targets attempted only once their readiness is clean. */`; components/use-course.ts:21 a capstone pass is added to solvedLc; use-today-plan.ts:64 `ready: Boolean(byLc.get(q.lc)?.ready ?? true)`
- Detail: LC targets appear only from calendar week 3, after the unit is ready, when the problem is not logged and the Reps capstone has not been passed, and when legacy bridge readiness holds (it defaults to true for 217, 1971 and 547). 25 of 48 entries have their capstone in the path (for example LC 167 via cap-two-sum-ii), so the spec's 'TARGET Two Sum II · Opens after checkpoint' never happens in the normal route. In the beginner simulation, LC 128, 424, 39, 53, 139, 62, 54 and 48 sat unready at the head of the queue for weeks.
- Suggested fix: Give readinessTargets a real condition (clean gate clearance plus recent cold evidence, per §44) or remove the field. Decide explicitly whether a capstone pass satisfies the LC target, and show either outcome on Today.
- Verifier: I checked the code and the main claim is correct.

1. Routing does not tell the two lists apart. lib/course/routing.ts:225 handles targets and readinessTargets the same way: `if (open) for (const lc of [...unit.targets, ...(unit.readinessTargets ?? [])]) if (!solvedLc.has(lc)) out.push(...)`. Nothing else in lib/, components/ or app/ reads readinessTargets. The comment at data/course/units.ts:33, "attempted only once their readiness is clean", is enforced only by the bridge-readiness filter, and that filter applies to every target.

2. Capstone passes count as solves. components/use-course.ts:21 adds `...Object.entries(CAPSTONE_NUMBER).filter(([id]) => passed.has(id)).map(([, lc]) => lc)` to solvedLc. I ran a throwaway script, scripts/_audit_skep2.ts, which I deleted straight after. It called courseStatus with no attempts. It found 48 entries across targets and readinessTargets, and for 25 of them the capstone sits inside that unit's own s.path (for example 167 → cap-two-sum-ii in w3-two-pointers; also 1, 217, 242, 125, 121, 3, 20, 704, 206, 21, 104, 100, 226, 102, 200, 1971, 547, 207, 215, 347, 56, 78, 70, 198). Targets only open after the unit is ready, or after its path is done for units without gates (routing.ts:224). Gates only appear once the path is passed (routing.ts:220). So the capstone is already passed before the target could open, and those 25 targets never appear as LC TARGET items. The spec line at REPS_2_1_SPEC.md:135, "TARGET Two Sum II · Opens after checkpoint", therefore does not happen on the normal route.

3. The readiness default is as described. use-today-plan.ts:64 `ready: Boolean(byLc.get(q.lc)?.ready ?? true)`: an LC with no entry in TARGETS counts as ready.

One detail is overstated. Unready problems do not sit visibly at the head of Today. lib/today-plan.ts:130 removes them: `input.plan.filter((c) => open(c) && !(c.kind === 'problem' && (foundation || !c.ready)))`. The same line hides all problems during the foundation weeks, which matches the "only from week 3" part. So LC 128, 424 and the others stay at the front of course.queue, but they are filtered out of the day's plan rather than shown and blocked. They still take up the front of the queue and the 80-item slice in use-today-plan.ts:63.

Minor is the right severity. A capstone in the path is real practice on the same problem, so nothing shown is untruthful. What the code lacks is the spec's TARGET step and a separate readiness-target behaviour. Corrected: The claim holds, with one correction about what the learner sees.

What is accurate:
- readinessTargets are routed exactly like targets (routing.ts:225), and nothing else in the code reads them.
- A capstone pass counts as a solve (use-course.ts:21).
- 25 of the 48 target and readinessTarget entries have their capstone inside that unit's own path, so they are marked solved before the target can open (open requires ready or path done, routing.ts:224). Those 25 never surface as LC TARGET items, including LC 167 via cap-two-sum-ii.
- LC targets that are not in TARGETS default to ready (use-today-plan.ts:64).
- Today shows no LC problems during the foundation weeks.

The correction: unready LC items (such as 128 and 424) are not shown at the head of Today. lib/today-plan.ts:130 removes them (`!(c.kind === 'problem' && (foundation || !c.ready))`). They only stay at the front of course.queue, inside its 80-item slice. They are hidden from the plan rather than shown as blocked.

### 14. [MINOR] The first failed run of a checkpoint already marks the gate failed, although 2 failed runs are allowed — CONFIRMED (severity keep)
- Spec: §2 principle 8
- Evidence: routing.ts:83 `(a.completedAt || a.attemptsBeforePass > 0)`; routing.ts:94 `const failed = !cleared && Boolean(last) && !gateClean(last, ctx.attempts)`; credit.ts:79 `a.attemptsBeforePass <= 2`
- Detail: Reproduced: one failed submission on c1-g-countdown-steps, with the attempt still open, gives failed=true, state 'gate-blocked', repairs computed, and the variant removed from the queue. Today swaps the checkpoint for repairs mid-attempt; passing on the next run reverses it.
- Suggested fix: Treat an open attempt as failed only once attemptsBeforePass > 2 or when it is abandoned.
- Verifier: I confirmed the mechanism by reading the code. In components/rep/rep-workspace.tsx:470-485, a failed submission saves the open attempt with `attemptsBeforePass: a.attemptsBeforePass + 1`, with passed=false and no completedAt. In lib/course/routing.ts:83, `tries` keeps any attempt where `(a.completedAt || a.attemptsBeforePass > 0)`, so an open attempt with one failure counts as a gate try. gateClean (credit.ts:77-79) calls masteryEvidence, which returns 'failed' at credit.ts:50 when the attempt has not passed. So routing.ts:94 sets `failed = true`. As a result, routing.ts:96-104 computes repairs, routing.ts:111 drops that variant from `next`, and courseStatus sets anyGateFailed, the route becomes 'focused' and the state becomes gate-blocked. If the learner then passes in the same attempt, the record is updated in place with completedAt and attemptsBeforePass=1, which is still within the ≤2 limit. gateClean then returns true and the failure goes away. So "failed" is true while the attempt is still open, even though the same attempt can still pass clean.

Two parts of the claim go too far:
1. The "2 failed runs allowed" rule (docs/reps-2.md:36, credit.ts:76) is about how a passing attempt is judged. It does not say an unfinished attempt with one failure should count as not-failed. An attempt abandoned after one failure arguably should count as a failed try.
2. The rep workspace does not read gateStatus. Only components/use-course.ts uses courseStatus. The "swap" therefore appears only if the learner leaves the rep and looks at Today or Plan with the attempt still open. It does not change the screen they are on.

The real effect is that an unfinished checkpoint shows as failed, which is premature. That is minor polish against §2 principle 8, not a broken gate. Corrected: lib/course/routing.ts:83 counts an unfinished gate attempt as soon as it has one failed submission (`a.completedAt || a.attemptsBeforePass > 0`). At routing.ts:94 gateClean returns false for any attempt that has not passed (credit.ts:50 'failed'), so after the first failed run GateStatus.failed becomes true while the attempt is still open. That makes the unit state gate-blocked, the route 'focused', computes repairs and drops the variant from `next`. The repair rule is not reached until the attempt either passes or is abandoned. The learner only sees this if they leave the rep (Today/Plan via components/use-course.ts). The rep workspace does not use gateStatus. Passing later in the same attempt with ≤2 failures gives gateClean=true and undoes the state. A fix would ignore open attempts (no completedAt) on gate variants until they finish or go stale, and treat a stale one as failed. Severity: minor.

### 15. [MINOR] Repair sets differ from the spec: at most 3, sometimes 1, code only, and the same reps every time — CONFIRMED (severity keep)
- Spec: REPS_2_MASTER_SPEC §12 (2–4 smallest repair reps), §43
- Evidence: routing.ts:101 `REPAIR_STAGES.includes(e.stage) && e.kind === 'code' && ...`; routing.ts:103 `.slice(0, 3)`
- Detail: Each failed variant gets 3 repairs, except g-prefix-suffix on d3-cold-sell-today (1) and g-dp-greedy b and c (2). Failing the output-kind variant c1-g-alias-trace still gets code-only repairs. The 'smallest broken skill' is taken as the variant's skills that the gate checks, not diagnosed from the actual failure, so each failure gets the same 3 reps.
- Suggested fix: Guarantee 2–4 repairs (fall back to optional or legacy sections), match the failed variant's kind, and use the failing test or mistakeType to choose the skill.
- Verifier: Not refuted. I read lib/course/routing.ts:93-104. Then I ran gateStatus once for every gate variant in GATE_BY_ID, each time with a single failed attempt. I used the real EXERCISE_BY_ID and SECTION_BY_ID, wrote the script to scripts/_audit_repair.ts and deleted it straight after.
(1) Cap of 3. routing.ts:103 has `.sort(... difficulty ... minutes).slice(0, 3)`, so there can never be 4 repairs, although MASTER_SPEC §12 and §43 say "2–4".
(2) Fewer than 2. The results match the claim exactly. Failing d3-cold-sell-today (g-prefix-suffix) gives 1 repair: d3-stock-debug-order. Failing c12-g-dp-greedy-b gives 2 (b53-dbg-reset-zero, b53-ending-sums). Failing c12-g-dp-greedy-c gives 2 (b55-farthest, b55-dbg-no-stop). Every other variant gives exactly 3.
(3) Code only. routing.ts:101 is `REPAIR_STAGES.includes(e.stage) && e.kind === 'code' && e.skills.some(...)`. Failing c1-g-alias-trace (kind 'output') still gives code reps: c1-mut-new-list, c1-ref-top-three, c1-ref-dbg-grid.
(4) No diagnosis. routing.ts:96 is `broken = new Set(exercise.skills.filter(s => gate.skills.includes(s)))`. That is a fixed property of the variant: it ignores mistakeType, runtimeErrors and the failing test. The comment "The smallest broken skill first" on line 102 really only sorts by difficulty and minutes. Many gates also give the same repair set whichever variant failed: all 4 g-loop-control variants, all 4 g-mutation-references variants, all 6 g-search-invariant variants, and others.
One nuance to add: the list is cut to 3 before the `fresh` filter removes reps already passed. So a learner who finishes the repairs and then fails another variant whose skills overlap gets fewer repairs, often 0. The app never moves on to the next-ranked candidates.
Severity stays minor under the cited sections. The count, kind and determinism differences are polish. The missing "classify smallest broken skill" step (§43) could reasonably be argued up to major. The V2.1 spec itself only says "Failed work should trigger focused repair, not punishment" (REPS_2_1_SPEC.md:56), and the code does meet that. Corrected: The claim is accurate. One refinement: lib/course/routing.ts:103 caps the ranked candidates at 3 before line 104 drops the reps passed since the failure (`ranked.filter((e) => !fresh(e.id))`). A second failure after the repairs are done therefore shows fewer repairs, often none, instead of the next candidates. Measured counts: 3 repairs for every variant except d3-cold-sell-today (1: d3-stock-debug-order), c12-g-dp-greedy-b (2) and c12-g-dp-greedy-c (2). c1-g-alias-trace (output kind) gets code-only repairs. The "broken" skill set (line 96) is the failed variant's skills that are also gate skills, so repairs are fixed per variant and often per gate. No mistakeType or test-failure diagnosis is involved.

### 16. [MINOR] The routing tests cannot catch real-flow failures — CONFIRMED (severity keep)
- Spec: §29 testing requirements
- Evidence: lib/course/routing.test.ts:16 `mastery: {}`; routing.test.ts:19-28 `through()` passes every unit rep and every pool rep; lib/course/content.test.ts:24-28 is titled 'at least two real variants per clean pass' but asserts `real.length >= g.need`
- Detail: Prior evidence from retrievalSkills never fires in tests, the focused-vs-full mismatch never shows, nothing follows the queue rep by rep, and nothing checks curriculum fit (§29) or Today's candidates (the review leak). 10 gates have a pool smaller than 2×need (g-pointer-movement, g-safe-rewiring, g-fast-slow, g-queue, g-grid, g-graph-traversal, g-directed-cycle, g-intervals, g-dp, g-dp-greedy).
- Suggested fix: Add a progression test with computeAllMastery that follows the queue, a weekly fit test, and a Today-candidates test. Make the content test assert 2×need or rename it.
- Verifier: I checked every piece of evidence and it holds. (1) In lib/course/routing.test.ts:16, the only context builder is `ctx = (attempts, today) => ({ attempts, mastery: {}, ... })`. lib/course/readiness.test.ts:10 also passes `mastery: {}`. So the second branch of priorEvidence (lib/course/routing.ts:132-133, `unit.retrievalSkills.map((s) => ctx.mastery[s]).filter(Boolean)` ... `skills.length > 0 && ...`) always returns false in tests. The placement test (routing.test.ts:61-73) reaches 'placement' only through the 40%-of-path branch at routing.ts:131. (2) `through()` (routing.test.ts:20-28) passes every rep of the full unitReps and every real pool variant for each gate. That clears gates with every variant, not the minimal `need`. (3) The focused route removes lesson-level reps (routing.ts:153: `route === 'focused' ? full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id)) : full`). No test asserts the difference between `path` and `full`, and none checks the done/total that results from it. (4) content.test.ts:24 has the title 'every gate has at least two real variants per clean pass it needs', but line 28 only asserts `real.length >= g.need`. (5) I loaded GATES and EXERCISE_BY_ID with a throwaway script, since deleted. Exactly 10 gates have pool < 2×need, and they are the ones the claim lists. Each has need 2 and pool 3: g-pointer-movement, g-safe-rewiring, g-fast-slow, g-queue, g-grid, g-graph-traversal, g-directed-cycle, g-intervals, g-dp, g-dp-greedy. Every other gate meets 2×need. (6) For curriculum fit, course.test.ts:11 asserts only the hardcoded weekly targets `[50, 60, 75, ...]`. No test checks that a week's required unit work fits its target, which §29 asks for under 'Curriculum math: Week 1 required work fits 50...'. No course test covers Today's candidates either. One small caveat: the placement and failed-gate tests do feed the queue output back in once (routing.test.ts:69, 86). 'Nothing follows the queue rep by rep' is still true in the sense that no test iterates the queue to completion. The claim is labelled minor, but the missing curriculum-fit test is a §29 requirement, so it could be argued major. I kept the claimed severity because these are gaps in test coverage, not product defects. Corrected: The claim is accurate, with one nuance. Two tests feed queue output back in once: placement at routing.test.ts:69 and repair at routing.test.ts:86. No test walks the queue rep by rep to completion. The 10-gate list is exact: each has need=2 and pool=3, and all other gates have pool >= 2×need. Unlike the other gaps, the missing curriculum-fit test (required work fits 50/60/75) is an explicit §29 bullet. course.test.ts:11 checks only the hardcoded targetProblems values.

### 17. [MINOR] Today's unit focus and learn-first come from course.current, not from today's items; foundation rules follow the calendar week — CONFIRMED (severity keep)
- Spec: §4 Q1-Q2; §30
- Evidence: components/use-course.ts:23 `const current = statuses.find((s) => !s.locked && s.state !== 'ready' && s.state !== 'maintenance')`; course-today.tsx:96, 101; components/use-course-day.ts:30 weekGates filtered by `s.unit.week === week.number`; lib/course/capacity.ts:11-16 phaseOfWeek uses the calendar week
- Detail: During the deadlock, the heading reads 'State and while loops' while every item is a hashing rep. Placement and focused units show no lesson or worked example. WeekCard checkpoints belong to the calendar week (often locked), not to the unit in progress. A learner still on Week-1 content in calendar week 3 loses the 30% foundation cap and becomes eligible for LC problems.
- Suggested fix: Take the focus unit from the first unfinished course item, and key the foundation and LC rules to that unit's week.
- Verifier: The code mostly matches the claim. components/use-course.ts:23 takes `current` as the first unlocked unit that is not ready. components/course/course-today.tsx:96-101 takes `unit`, the lessons, the worked examples and `learnFirst` from `cd.course.current`. Only `focusConcepts` (line 97) is computed from the actual items. The items come from course.queue (lib/course/routing.ts:204-226), which pulls reps from every unlocked, not-ready unit up to `frontier.unit.week + 1`. So today's items can belong to units other than the one named in the heading (course-today.tsx:183, `{unit.title} · {unit.purpose}`). The queue's frontier at line 206 also counts locked units, while `current` skips them. learnFirst requires `route === 'full'` and `done === 0` (line 101). The placement state needs prior evidence, and prior evidence sets the route to 'focused' (routing.ts:155, 164), so placement and focused units never show the lesson or worked-example strip. components/use-course-day.ts:30 filters weekGates by `s.unit.week === week.number`, where week comes from courseDay(today), the calendar week (lib/course/week-status.ts:22). lib/course/capacity.ts:11-16 and 38 set the phase from the calendar `day.week`, and lib/today-plan.ts:104/116/131 apply the foundation 30% checks cap and the LC block only when that phase is 'foundation'.

One part is overstated. Leaving the foundation phase does not make arbitrary LC problems eligible. LC targets enter the queue only for units that are ready or maintained, or that have no gates and a finished path (routing.ts:224-225). Each one is then also filtered by `c.ready` from byLc (use-today-plan.ts:63, today-plan.ts:131). The 'State and while loops' heading over hashing reps during a deadlock is plausible, since items and heading come from different sources. I did not reproduce that exact state. Corrected: Confirmed. The unit focus heading, the lessons and worked examples, and learnFirst come from course.current (use-course.ts:23; course-today.tsx:96-101, 183). The items come from course.queue, which mixes reps from every unlocked, not-ready unit up to frontier week + 1 (routing.ts:206-221). So the heading can name a unit other than the one today's reps belong to. Only focusConcepts (line 97) is derived from the items. learnFirst is limited to route 'full' with done === 0, and a placement state always has a 'focused' route, so placement and focused units never get the learn-first strip. WeekCard checkpoints (use-course-day.ts:30) and the capacity phase (capacity.ts:11-16, 38) follow the calendar week from courseDay (week-status.ts:22), not the unit in progress. A learner still on Week-1 units in calendar week 3 therefore loses the 30% foundation checks cap (today-plan.ts:116) and the foundation block on LC problems (today-plan.ts:131). Correction: LC problems still enter the queue only for units that are already ready or maintained, or that have no gates and a finished path (routing.ts:224-225), and each must also pass byLc `ready`. Leaving the foundation phase does not open LC problems for unfinished units. Minor severity is appropriate.

### 18. [MINOR] Gate variants housed in other units' sections are attributed to the wrong unit — CONFIRMED (severity keep)
- Spec: §8 (rep-to-unit mapping)
- Evidence: data/course/index.ts:23-25 UNIT_OF_EXERCISE maps every rep in a unit's sections (last one wins); routing.ts:74 filters variants out of paths; routing.ts:227-229 the queue keeps the first occurrence
- Detail: Examples: d06-cold-digits (g-recursion, w6) maps to w7-trees; o7-c-last-level (g-queue) to w8-grids; o8-cold-build, o8-cold-components and o8-cold-grid-steps to w9-cycles; d05-cold-index-of and d05-cold-first-at-least to w5-linked-lists; d4-cold-* to w4-stacks; d9-cold-kth-smallest and last-rock to w10; d10-cold-letter-subsets and pick-k to w11-dp. Harmless today, because only the Week-13 checks read UNIT_OF_EXERCISE and no rep is in two units, but any new consumer would misattribute these reps.
- Suggested fix: Map gate variants to GATE_BY_ID[...].unitId first, and add a test that no rep appears in two units.
- Verifier: I computed UNIT_OF_EXERCISE with a throwaway script and compared it with each gate's unitId. Every example in the claim holds: d06-cold-digits (g-recursion, w6-recursion) maps to w7-trees; o7-c-last-level (g-queue, w8-queue-bfs) to w8-grids; o8-cold-grid-steps (g-grid), o8-cold-build and o8-cold-components (g-graph-traversal) to w9-cycles; d05-cold-index-of and d05-cold-first-at-least (g-search-invariant, w5-binary-search) to w5-linked-lists; d4-cold-avg-window, d4-cold-longest-unique and d4-cold-shortest (w4-windows gates) to w4-stacks; d9-cold-kth-smallest and d9-cold-last-rock (g-heap, w9-heaps) to w10-intervals; d10-cold-letter-subsets and d10-cold-pick-k (g-backtracking, w11-backtracking) to w11-dp.

The code citations are also right. data/course/index.ts:23-25 builds the map from each unit's sections and optional sections. routing.ts:74 drops gate variants from paths (`.filter((e) => !GATE_OF_EXERCISE[e.id])`), and routing.ts:227-229 keeps the first queue entry for each key.

The impact claim holds too. The only runtime consumer is components/rep/rep-workspace.tsx:812, 826 and 966, and it only checks `=== 'w13-transfer'`. No gate belongs to w13, and no rep sits in two units (the script counted 0), so nothing misbehaves today. The other use is a test in lib/course/course.test.ts:66-67. Minor severity is right.

Two details need correcting. First, "last one wins" is not the cause. Object.fromEntries would let a later unit overwrite an earlier one, but since no rep is in two units this never happens. The variants are misattributed because they physically live in a section that a different unit owns. Second, the claim leaves out a bigger gap of the same kind: most gate variants (all the c*-g-* reps, and the o2-cold-* and d3-cold-* variants) are in no unit's sections at all, so UNIT_OF_EXERCISE returns undefined for them. The map is therefore not a reliable rep-to-gate-unit lookup. GATE_OF_EXERCISE plus GATE_BY_ID[...].unitId is the correct source for gate variants. Corrected: UNIT_OF_EXERCISE (data/course/index.ts:23-25) attributes a rep to whichever unit lists the section the rep is stored in. It does not use the gate that owns the rep. So the gate variants stored in a neighbouring unit's section are attributed to that neighbour:
- d06-cold-digits goes to w7-trees (it belongs to w6-recursion).
- o7-c-last-level goes to w8-grids (it belongs to w8-queue-bfs).
- o8-cold-grid-steps, o8-cold-build and o8-cold-components go to w9-cycles (they belong to w8-grids or w8-graphs).
- d05-cold-index-of and d05-cold-first-at-least go to w5-linked-lists (they belong to w5-binary-search).
- d4-cold-avg-window, d4-cold-longest-unique and d4-cold-shortest go to w4-stacks (they belong to w4-windows).
- d9-cold-kth-smallest and d9-cold-last-rock go to w10-intervals (they belong to w9-heaps).
- d10-cold-letter-subsets and d10-cold-pick-k go to w11-dp (they belong to w11-backtracking).

The cause is where the variants are stored, not "last one wins": no rep appears in two units. Most other gate variants (all c*-g-*, plus o2-cold-* and d3-cold-*) are in no unit section, so UNIT_OF_EXERCISE[id] is undefined for them.

This is harmless today. The only runtime consumer is rep-workspace.tsx:812, 826 and 966, which only compares the value to 'w13-transfer', and no gate belongs to w13. Any future consumer should get a gate variant's unit from GATE_BY_ID[GATE_OF_EXERCISE[id]].unitId. Severity: minor.

## today-ux

Today (from Oct 26, `CourseDashboard` → `CourseToday`) is a rep counter with an ordered list of reps. It is not a daily command center. It does show the day's target and live progress, a numbered list of reps with done/now/todo states, one accent CTA, retrieval rows, rest days that create no debt, and a guilt-free "Stop for today" button. Several required pieces are missing:
- Labs never enter the ordered list.
- Checkpoints and target problems appear as steps only when the queue happens to put them in today's N items. They never show as pending or locked steps.
- Lessons and worked examples sit in a side panel under the CTA and disappear after the first rep. Interactive demos don't exist.
- There is no "Today's contract" and no "Done for today when" list.
- "Day complete · You did enough" is based on the rep count alone.

A simulation using the real lib functions found two worse problems:
- **Following Today's own list dead-ends on Day 2.** Routing's 40% "prior evidence" rule switches `w1-state-while` to a focused path that drops lesson-level reps, but readiness still requires the full path. The first unit never becomes ready and the rest of the course stays locked. The unit line keeps saying "State and while loops", and from Nov 11 Today has no list and no CTA.
- **Checkpoints come before the teaching.** For units with checkpoints, the same rule pushes the checkpoint in at 40% of the path, and 60% of the teaching is never offered.

Also:
- 55 ordinary cold/retrieval reps are labelled "Checkpoint".
- From Feb 1 2027, Today falls back to "Week 1".
- Saturday copy ignores labs and checkpoints.
- On mobile, buttons with fixed one-line text get cut off at the card edge, row titles are truncated, and tap targets are small.

All paths are under /Users/ruggudile/Desktop/Projects/reps. The throwaway scripts were deleted after use; their outputs are in the scratchpad audit folder listed in data.

**Already correct:**
- /Users/ruggudile/Desktop/Projects/reps/components/dashboard.tsx:48-52 — Today renders only in the browser (avoids the prerender-date bug) and switches deterministically to CourseDashboard from COURSE_START.
- /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:209-228 — the hero has at most one accent (primary) CTA, chosen from left[0] of a deterministic prescription. Other actions are btn-sm, ghost or text links, so there are no competing equal CTAs.
- /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:176-198 — the day's rep target and live progress ('{done} / {target}', progressbar with aria-valuenow/max/label) sit at the top of the card. The Training Flame has a text label (training-flame.tsx:14).
- /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:254-292 — the ordered, numbered list has done/now/todo states, aria-current='step', screen-reader state prefixes, and per-group done/total chips. Together they answer 'how far through' and 'what remains' for reps.
- Retrieval is part of the prescription: cold reps (use-today-plan.ts:79) and due LC re-solves/redos (lib/course/resolves.ts:29-60), with a capped maintenance share (lib/today-plan.ts:135). Re-solve rows link to the outside-problems list (course-today.tsx:127).
- Gate repairs are queued before the failed unit's own path (lib/course/routing.ts:217) and labelled 'Repair' in the repair tone (course-today.tsx:288). LeetcodeList turns 'Needed help' into 'Not finished yet: rebuild it' plus block repair (leetcode-list.tsx:148-166).
- Rest days: a dedicated view with no debt language, a protected streak, and ☾ marks in the week strip instead of failure circles (course-today.tsx:130-145, week-strip.tsx:38-40). Covered by e2e/course.spec.ts:78-91.
- A guilt-free stop exists: an accent 'Stop for today' button and 'Good. See you tomorrow.' (course-today.tsx:318-327). The celebration plays once per device per day (course-today.tsx:76-92).
- Motion: flame ignite 600ms, celebrate-in 500ms, bar width 450ms, all inside the spec ranges. prefers-reduced-motion turns off all animations and transitions (app/globals.css:910-948).
- Focus: global :focus-visible outline (app/globals.css:172-176) and a .btn focus ring (app/globals.css:301-304). Keyboard focus is visible on buttons.
- Week 13: Today hides lesson links and 'Review a concept' (course-today.tsx:101, 327), so Today leaks no technique names.
- One credit source: Today's count, flame, streak, week strip and week card all read lib/course/credit.ts through useCredits (use-course-day.ts:35-38, use-today-plan.ts:94), so these numbers agree with each other.
- Most hero rows are mobile-safe: flex-wrap/min-w-0 on the header, CTA row and chip list, the complete panel stacks (course-today.tsx:150, 210, 254, 299), and week-card lab names truncate (course-cards.tsx:62).
- The lab page itself is a proper five-step, done-or-not-done flow (components/course/lab-view.tsx) that a Today lab step could link to. LabProgress already exposes designDone/buildPassed/changePassed/reviewDone (lib/course/labs.ts:23-30).

**Data:**

```
SPEC §4: THE 17 QUESTIONS. Does Today answer each one without leaving the page? (component paths are under /Users/ruggudile/Desktop/Projects/reps/components/course/)
1 What am I learning? PARTIAL. Shown by the unit-focus line "{unit.title} · {unit.purpose}" (course-today.tsx:181-185) and "Week N · title" (:156-158). The unit is cd.course.current, the first unlocked unit that isn't ready yet, not necessarily the unit of the listed reps. The line is hidden once the day is complete. In the simulation 115 of 131 steps came from a different unit than the one named.
2 Why? PARTIAL. Only unit.purpose. The per-kind WHY copy (course-today.tsx:45-58) is passed to the session and shown on the rep page (rep-workspace.tsx:1029), never on Today.
3 What exactly must I complete? PARTIAL/NO. "{target} reps" plus an N-item list. Completion counts any N credits, not that list. Labs are never included. Checkpoints appear only if they fall in the window.
4 What order? PARTIAL. Numbered <ol> (course-today.tsx:269-292). Lessons and worked examples sit outside the order, labs are absent, and a checkpoint can come before the teaching (40% placement).
5 Is there a lesson? PARTIAL. "Learn first" panel (:231-249) only when current.route==='full' && current.done===0. It is not a step and is never marked done. Otherwise the lesson lives in Learn (/learn/[id]) and in Plan → week detail (road-map.tsx:100-107).
6 Interactive demonstration? NO. No visualizer exists anywhere in the repo (searches for visualiz/DemoStep/AnimationTimeline/PredictionPrompt find nothing). /demo is the public marketing demo.
7 Worked example? PARTIAL. Only 7 units in Weeks 1-2 have one (learn-first panel). All 22 units from Week 3 on have workedExampleIds: [].
8 How many qualifying reps? YES for the count: day-target h2 and "{done} / {target}" bar (:176-198). "Qualifying" is never explained. The hero says "reps" while the week card says "problems".
9 Is there a lab? NO as a step. Only the week card's "Builds" list below the hero (course-cards.tsx:53-70): calendar-week labs, Done/Optional/Not done, title link, no lock state, no partial progress. Progress lives on /lab/[id]; per-unit labs are in Plan → week detail (road-map.tsx:113-118).
10 Is there a checkpoint? PARTIAL. A "Checkpoint" row appears only when gate variants are queued AND within today's N. Otherwise only week-card rows "Checkpoints X / Y" with no start action (course-cards.tsx:71-86). Plan shows plain "Checkpoint: title" text. 55 non-gate reps are mislabelled "Checkpoint".
11 Is there a target problem? PARTIAL, and never with a lock state. A target is queued only once its unit is ready, from Week 3 on, and only if its building blocks are ready. Locked targets appear only in Plan as plain "LC n title" text.
12 Is there repair work? PARTIAL. "Repair" rows (gate repairs) and "Again, cold" rows (shaky reps) appear when they fall in today's N. The CTA never prioritises them and the chip shows "Drill". LC rebuild/repair is in the "Outside problems today" section.
13 Is there retrieval work? YES when due. "Cold rep"/"Re-solve" rows and a "Retrieve" chip, capped at floor(0.2N) = 2 for N=10/12 and 3 for N=15.
14 How far through am I? YES. Progress bar, chips d/n, numbered checks, flame.
15 What remains? PARTIAL. Remaining rows plus "Next: …" (:226). Omits labs, checkpoints outside the window and locked targets. The list vanishes once the rep target is hit.
16 When am I officially done? PARTIAL/UNTRUTHFUL. Only implied by the rep target. Copy: "{n} more reps and today counts" (motivation.ts:85, 87). There is no "Done for today when" list.
17 Can I stop guilt-free? YES in the UI ("Day complete · You did enough" + "Stop for today", course-today.tsx:164-172, 318-327), but it is untruthful while labs or checkpoints are open.

SIMULATION (lib/course/routing courseStatus/courseQueue + lib/today-plan prescribe, re-prescribed after each pass; learner passes Today's items in order, clean, first try; mastery from computeAllMastery; LC readiness from lib/bridges.readiness; warm-ups, cold reviews and re-solves left empty):
- Day 1 (2026-10-26) list: learn 6, drill 3, combine 1 (w1-state-while). After 8 of 18 passes the route flips full→focused and drops c1-while-fill-change (complete, path position 9) and d05-while-halve (trace, position 15). With a Today session only d05-while-halve is dropped. The unit has no gate, so ready = all 18 'full' reps passed → never.
- From Oct 29 the list is w2-hashing reps (it has no prerequisites). Week 1 ends with 50/50 reps, 0/4 checkpoints cleared, and 0 labs ever listed.
- Nov 10: only 6 items available. Nov 11 to Jan 29: the course queue is empty, so Today has 0 plan items and no CTA.
- Across the whole course: lab exercises queued in any step = 0. A true checkpoint appears as a Today step on 2 of 66 training days.
- Placement check: with w1-state-while made ready, w1-loop-control flips to 'placement' after 8 of 20 path passes. The next 4 Today items become checkpoint variants; passing them marks the unit ready and 12 of 20 path reps are never offered.
- Non-gate path reps labelled "Checkpoint" by purposeOf: 55 (w2-testing 10, w10-intervals 2, w12-matrix-tries 4, w14-interview 39).

MOBILE ESTIMATES (Geist, ≈0.53em per character; 375px viewport → 287px content width inside main px-5 + card px-6; 320px → 232px):
- Row titles get about 21-23 characters at 375px (about 15 at 320px). Of 995 possible row titles, 52% are over 22 characters and 74% over 18. The longest is 55: "LC 235 · Lowest Common Ancestor of a Binary Search Tree".
- Buttons that won't wrap (.btn has white-space: nowrap) are cut off at the card edge (the card has overflow-hidden):
  - "Worked example: Countdown with a while loop" ≈ 300px
  - "Worked example: Cart history without a shared list" ≈ 355px
  - "Worked example: Brute force, then improve: the first repeated ticket" ≈ 470px
  - "Practice LC 1971 on NeetCode" (btn-lg) ≈ 275px, so it overflows at 320px.

Scratchpad outputs (in /private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/): sim.txt, verify.txt, placement.txt, titles.txt.
```

### 1. [CRITICAL] Following Today's own list dead-ends on Day 2 and puts checkpoints before the teaching (routing's 40% 'prior evidence' rule) — CONFIRMED (severity keep)
- Spec: §3, §4 Q1/Q4/Q10, §6, §29 'CTA deterministic', §30; principles 3, 7, 13
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/course/routing.ts:131 `if (path.length && path.filter((e) => passed.has(e.id)).length / path.length >= 0.4) return true`; :145 `const prior = priorEvidence(unit, full, passed, ctx)`; :148 `const pathDone = full.every((e) => passed.has(e.id))`; :154 `const ready = liveGates.length ? gatesCleared : pathDone`; :157 `const path = route === 'focused' ? full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id)) : full`; :164 `else if (prior && liveGates.length && !liveGates.some((g) => g.attempted)) state = 'placement'`; :212-215 placement pushes only `g.next` then `continue`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:96 `const unit = cd.course.current?.unit`; :209 `{!complete && next && (`; :252 `{!complete && plan.items.length > 0 && (`
- Detail: The rule treats the learner's own progress through a unit as 'prior evidence'. A learner who does exactly what Today lists (simulated with the real lib functions, clean first-try passes) hits this on Day 1. After 8 of 18 passes, w1-state-while switches to the focused route, which drops the unpassed lesson-level reps c1-while-fill-change and d05-while-halve. With a Today session only d05-while-halve is dropped. The unit has no gate, so 'ready' needs all 18 'full' reps, and they are never offered again. The unit never becomes ready, and w1-loop-control, w1-running-state, w1-mutation-references and everything after them stay locked.

What Today shows as a result:
- The unit line says 'State and while loops' for the rest of the course. 115 of 131 steps come from other units (w2-hashing has no prerequisites).
- Week 1 ends 50/50 reps with 0 of 4 checkpoints ever shown.
- Nov 10 offers 6 items. From Nov 11 to Jan 29 the course queue is empty. Today shows '15 reps', 0/15, no list and no CTA. In the real app only warm-up and maintenance shares, at most 6 items, could fill it, so no day can complete.

For units with checkpoints, the same rule sets state to 'placement'. Verified on w1-loop-control: after 8 of 20 path passes the next four Today items are checkpoint variants, and passing them marks the unit ready with 12 of 20 path reps never offered. Today's order therefore puts the checkpoint before the teaching.

Tests miss it: routing.test.ts `through()` passes every 'full' rep, and the e2e test covers Day 1 only.
- Suggested fix: Treat only evidence from before the unit first started (or before COURSE_START), or an explicit placement choice, as prior evidence. Compute pathDone against the path of the route actually in use, or keep unpassed lesson-level reps in the queue. Add a test that runs prescribe(courseQueue) day by day for all 14 weeks. It should assert that the queue never empties before the course ends, that every unit eventually becomes ready, and that gates come only after the unit's path.
- Verifier: The dead-end is real and I reproduced it. I wrote a throwaway script, ran it and deleted it. It used the real courseStatus and courseQueue with EXERCISE_BY_ID and SECTION_BY_ID, and passed the first item of the live queue cleanly, one at a time.

w1-state-while has 18 reps in `full` and gateIds: [] (data/course/units.ts:49-50). After 8 passes, 8/18 = 0.44, which clears the 0.4 test at routing.ts:131, so `prior` becomes true. The route at :155 turns 'focused' and the total drops from 18 to 16. Line :157 drops the two unpassed lesson-level reps, c1-while-fill-change (complete) and d05-while-halve (trace). courseQueue only offers `s.path` (:218), so those two are never queued again. For a unit with no gate, `ready` is `pathDone`, and pathDone is computed over `full` (:148, :154), so it can never become true. The simulation sat at 'practicing focused 16/16' from step 16 onward. After that every next item came from w2-hashing (o2-list-literal, ...). w1-loop-control stayed locked, and so did every other unit that needs w1-state-while (running-state and mutation-references). The plan does not stop this. use-today-plan.ts:60-66 takes coursePlan straight from course.queue and recomputes it live after every pass, and nothing else adds the two dropped reps back. So following Today's list exactly deadlocks the core foundation unit on Day 1 or 2. The product's main promise is that Today's list is the course, and that promise is untruthful here, so critical is right. The tests miss it because through() in routing.test.ts passes every rep in unitReps().

The checkpoint half is partly overstated. I simulated w1-loop-control after w1-state-while was fully passed. At 8/20, state becomes 'placement' (:164) and the queue for that unit is only gate variants (:212-215), so a checkpoint does appear before most of the teaching. The total also drops to 18, because two lesson-level reps are skipped. But the plan is recomputed live. After one gate variant is attempted, `liveGates.some(g => g.attempted)` is true, so placement ends and the state goes back to learning/practicing. The remaining path reps (o2-for-print-write ... o2-dbg-early-else) are then offered before the next gate variant, which only comes once the path is done (:220-221). The live flow therefore does not show four checkpoint variants in a row, and the unit is not marked ready with 12 path reps never offered. That only happens if the learner works from a stale snapshot of the list. Corrected: Confirmed (critical). In routing.ts, priorEvidence (:131) counts the learner's own passes through the current unit as 'prior evidence'. Once 40% of `full` is passed, the route turns 'focused' (:155), and the path filter at :157 permanently removes the unpassed lesson-level reps from `path`. That is the only thing courseQueue offers (:218). Readiness is still computed over `full` (:148, :154). For a unit with no gate like w1-state-while (units.ts:49-50, gateIds: []), this deadlocks. The simulation, following the live queue with clean passes, reached 'focused 16/16' with c1-while-fill-change and d05-while-halve never offered. The unit never becomes ready, and from then on the queue serves only w2-hashing (o2-*). w1-loop-control, w1-running-state, w1-mutation-references and everything downstream stay locked, and once the window's unlocked work runs out, Today runs dry. For units with a gate, the same rule turns on 'placement' (:164, :212-215) partway through the teaching. On w1-loop-control at 8/20, the queue jumps to a checkpoint variant (c1-g-countdown-steps), and two lesson-level reps are dropped (total 18). Because the plan is recomputed live (use-today-plan.ts:60-66), placement ends after the first gate attempt and the path resumes, with later gate variants only after the path is done (:220-221). So one checkpoint is put before the rest of the teaching. The claim that four checkpoint variants come in a row and the unit is marked ready with 12 path reps never offered does not happen in the live flow. Tests miss the deadlock because routing.test.ts through() passes every rep in unitReps().

### 2. [CRITICAL] 'Day complete · You did enough' is a rep count only, so required labs and checkpoints are ignored and drop off the list — CONFIRMED (severity keep)
- Spec: §7, §4 Q16/Q17, §5, §29 daily completion; principle 12
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:67-68 `const done = cd.doneToday` / `const complete = day.type === 'training' && done >= target`; :170 `{done} / {target} · You did enough.`; :252 the list renders only when `!complete`; /Users/ruggudile/Desktop/Projects/reps/lib/today-plan.ts:120 `const fits = (c: Candidate) => count < N && ...`, :164 `complete: repsDone >= N`; /Users/ruggudile/Desktop/Projects/reps/components/use-today-plan.ts:65 `required: q.purpose === 'gate' || q.purpose === 'repair'` (only lifts the foundation 30% cap); /Users/ruggudile/Desktop/Projects/reps/components/use-course-day.ts:35,49 `const done = credits.items[today] ?? []` … `flame: flameFor(done.length, …)`; /Users/ruggudile/Desktop/Projects/reps/e2e/course.spec.ts:58-76 expects 'Day complete' with '10 / 10'
- Detail: `done` counts any qualifying credits from any page. Labs are never part of the day. A checkpoint or repair row in today's list stops being prescribed once N other reps are credited: prescribe takes nothing when count ≥ N, so the row disappears. The whole list is also hidden on completion. Then the flame blazes, the streak counts and 'Stop for today' is offered. The complete panel shows the week's checkpoint count but says nothing about builds. The e2e test locks this behaviour in on Oct 26 while both Week 1 builds and four checkpoints are open.
- Suggested fix: Build one daily-contract function: rep target met AND every item required today done (lab step, checkpoint, repair, explicit target). Hero, flame, streak, week strip and week status should all use it. Keep unfinished required rows visible after the rep count is met. Update the e2e test so 'complete' needs the contract.
- Verifier: The claim is confirmed. In components/course/course-today.tsx:66-68, `done = cd.doneToday` and `complete = day.type === 'training' && done >= target`. cd.doneToday is `credits.items[today].length` (components/use-course-day.ts:35,52), so it is a count of qualifying credits and nothing else. No lab state or gate state goes into `complete`. When the day is complete, the header shows "Day complete" and `{done} / {target} · You did enough.` (:166-171), the item list is hidden (`!complete && plan.items.length > 0` at :252), and the panel offers "Stop for today" (:324). The flame uses the same count (`flameFor(done.length, …)`, use-course-day.ts:49; blaze when done >= target, week-status.ts:118). So does the streak (`trainingStreak`, week-status.ts:105: `(credits[d] ?? 0) >= dailyTarget`).

In lib/today-plan.ts, `fits` needs `count < N` (:120) and `count` starts at repsDone (:115). Once N reps are credited, nothing more is taken, including gate and repair rows marked `required`. `required` only lifts the 30% foundation cap on checks (:120, :125). It does not make an item mandatory for completion, and `complete: repsDone >= N` (:164) ignores it. Labs never become Candidates: use-today-plan.ts builds plan/prep/resolves/cold only from the queue, reps and LC solves, and its own comment says a lab "earns nothing".

The e2e test (e2e/course.spec.ts:58-76) does lock this in. On 2026-10-26 it imports 10 Week 1 passes and expects data-complete=true, '10 / 10', blaze and a 1-day streak. Week 1 has two non-optional labs at that point (lab-savings-goal and lab-inventory, data/course/content/labs-w1w2.ts:10-53) and four gates (g-loop-control, g-index-scan, g-running-state, g-mutation-references at data/course/gates.ts:33-36). None is cleared.

This directly breaks §7 ("Do not show 'DAY COMPLETE 15 / 15' if a required lab or checkpoint is still unfinished"), the §29 daily-completion test, and §4 Q16/Q17. It makes the product untruthful (principle 12), so critical is the right severity.

Small nuances, which do not change the verdict:
(a) Labs and checkpoints are not completely invisible on the home page. WeekCard (components/course/course-cards.tsx:53-85), rendered beside CourseToday in course-dashboard.tsx:73, lists the week's builds with Done/Not done and the checkpoints with cleared/need. They appear only as weekly status, never as part of today's contract or list.
(b) A gate inside the plan window is prioritised among checks before the day is complete (today-plan.ts:140), so it can show up in the list. It just isn't needed for completion and drops out once N is reached.
(c) There is no per-day lab or required-target model at all, so the fix needs one; patching the `complete` expression alone is not enough. Corrected: Accurate as stated. Daily completion is a credit count only, in four places: course-today.tsx:68 `complete = day.type === 'training' && done >= target`, today-plan.ts:164 `complete: repsDone >= N`, flameFor (use-course-day.ts:49) and trainingStreak (week-status.ts:105). Required labs, required checkpoints, required targets and repairs play no part in "Day complete · You did enough", the blaze flame, the streak or "Stop for today". The `required` flag (use-today-plan.ts:65) only lifts the 30% foundation cap. Once repsDone >= N, `fits` (today-plan.ts:120) prescribes nothing more, and on completion the list is hidden (course-today.tsx:252). The e2e test (course.spec.ts:58-76) marks Oct 26 complete at 10/10 while Week 1 still has two required labs open (lab-savings-goal, lab-inventory) and four uncleared gates.

One qualification: labs and checkpoints are still visible on the home page as weekly status in WeekCard (course-cards.tsx:53-85; complete-panel :306 shows only the checkpoint count). They are never part of today's list or contract. Also, there is no per-day lab or target assignment model, so a fix needs one.

### 3. [MAJOR] No 'Today's contract' and no 'Done for today when' list — CONFIRMED (severity keep)
- Spec: §5, §4 Q3/Q15/Q16, §30
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:176-178 `{… `${target} reps`}` and :189-198 (only `{done} / {target}`); /Users/ruggudile/Desktop/Projects/reps/data/course/motivation.ts:77 "Today's work is clear: ${target} meaningful reps.", :85 `${plural(left, 'more rep')} and today counts.`, :87 `… and the day is complete.`; a search of components/course for 'Done for today'/'contract' finds nothing
- Detail: Today never shows day-level counters such as '0 / 1 lab' or '0 / 1 checkpoint', and never lists the conditions for finishing. Its copy defines 'done' as the rep count. Terminology also drifts: the hero says 'reps' while the week card says 'problems' (course-cards.tsx:42), and 'qualifying' is never explained.
- Suggested fix: Under the objective, add a contract block ('7 / 15 qualifying reps · 0 / 1 lab · 0 / 1 checkpoint') and a 'Done for today when' checklist, both read from the same contract object as the completion fix.
- Verifier: The claim holds. In /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx, the hero shows only `${target} reps` (line 177) and a single `{done} / {target}` bar (lines 189-198). Line 68 defines completion as `const complete = day.type === 'training' && done >= target`, so the only finish condition is the rep count. Nothing on Today has a "contract" or "done for today when" block. There are no day-level counters for a lab or a checkpoint. ItemKind (lines 26-42) has no lab kind at all, so labs never appear on Today.

The copy in /Users/ruggudile/Desktop/Projects/reps/data/course/motivation.ts says the same thing. Line 77 reads "Today's work is clear: ${target} meaningful reps.", line 85 reads "...more rep and today counts." and line 87 reads "...and the day is complete." All three define "done" as the rep count. The terminology drift is real too. course-cards.tsx:42 says "/ {progress.target} problems" while the hero says "reps". "Qualifying" appears in course-today.tsx:205, road-map.tsx:52 and readiness-report.tsx:100, but nothing explains what it means.

Two partial mitigations exist, and neither satisfies §5. First, Today does list the planned items with per-block counts ("Drill 3/5", lines 254-268). Second, a checkpoint can appear as a plan item labelled "Checkpoint" (KIND.gate) in the ordered list. These answer part of Q14/Q15. They still give no explicit lab or checkpoint requirement and no finish conditions (Q16), and the "Day complete" panel (lines 297-307) shows only week-level "checkpoints cleared". The severity of major is right for the §5 presentation gap. The underlying completion logic (line 68) also breaks §7 by declaring the day complete while a lab or checkpoint is unfinished, which may deserve its own critical finding. Corrected: The claim is accurate, with one nuance. Today does list an ordered set of plan items with per-block done/total counts (course-today.tsx:254-292), and a gate item labelled "Checkpoint" can appear in that list. That partly answers "what remains". There is still no contract summary, no "0 / 1 lab" or "0 / 1 checkpoint" counter, no lab item kind on Today at all, and no list of finish conditions. Completion is defined only as `done >= target` (course-today.tsx:68), which matches the copy in motivation.ts:77-87.

### 4. [MAJOR] Labs never appear in Today's ordered list; they show only as a week-level link list with no status detail, lock state or start button — CONFIRMED (severity keep)
- Spec: §3, §4 Q9, §5 item 7, §29 'no required Lab exists only behind Plan', §30
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/course/routing.ts:178 `export type QueuePurpose = 'learn' | 'guided' | 'drill' | 'combine' | 'transfer' | 'gate' | 'repair' | 'capstone' | 'problem'` (no lab); no unit's `sections` in /Users/ruggudile/Desktop/Projects/reps/data/course/units.ts references 'labs-w1w2'/'labs-w3w8'/'labs-w9w13' (defined at data/exercises/course/labs-w1w2.ts:375 etc.); /Users/ruggudile/Desktop/Projects/reps/components/use-course-day.ts:28 `LABS.filter((l) => l.week === week.number)`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-cards.tsx:62 `<Link href={`/lab/${lab.id}`} className="min-w-0 truncate text-ink hover:underline" data-testid="lab-link">`, :65 `{p.done ? 'Done' : lab.optional ? 'Optional' : 'Not done'}`
- Detail: In the simulation, no lab exercise was ever queued at any point in the course. The only lab surface on Today is the week card below the hero, and it has these gaps:
- It lists the calendar week's labs, not the current unit's.
- Status is binary; labProgress's design/build/change/review progress is never shown.
- The start action is a text link.
- There is no lock state. In Week 4, lab-activity-window is listed while w4-windows is locked, and LabView has no lock check.
- Labs are never assigned to a day and never count toward the day.

Partial progress is visible only on /lab/[id]. Per-unit labs are listed in Plan → week detail (road-map.tsx:113-118).
- Suggested fix: Add a LAB step to the list for the current unit's build. Show stage progress (design n/8 · build · change · review), the unit's lock state and a START/CONTINUE LAB CTA. Count it in the daily and weekly contract.
- Verifier: I checked the claim against the code and it holds. Labs never enter Today's ordered queue.
- `QueuePurpose` at lib/course/routing.ts:178 has no lab member.
- `courseQueue` (routing.ts:203-232) only pushes gate, repair, path-exercise and LeetCode-target items.
- Lab build and change exercises are reached only through `labProgress` (lib/course/labs.ts:25), the "Build" link in components/course/lab-view.tsx:69, and rep-workspace.tsx:829.
- No unit's `sections` names a lab section. Units carry `labIds` instead (data/course/units.ts:31, e.g. :256 for 'lab-activity-window').

The CourseToday hero (components/course/course-today.tsx) never mentions labs. The only lab surface on Today is the "Builds" list inside `WeekCard` (components/course/course-cards.tsx:55-69), which is rendered below the hero in course-dashboard.tsx:73. That list has the gaps the claim describes:
- It is filtered by calendar week: `LABS.filter((l) => l.week === week.number)` with `week = WEEK_BY_NUMBER[day.week]` (components/use-course-day.ts:26-28), not by the current unit.
- Status is binary ('Done' / 'Optional' / 'Not done'). The design/build/change/review fields from `labProgress` are computed but not shown.
- The entry point is a text link, not a start button.
- There is no lock state. lab-view.tsx has no lock check, and the lab page (app/lab/[id]/page.tsx) renders any lab unconditionally. w4-windows has `prerequisites: ['w3-two-pointers']` and `labIds: ['lab-activity-window']`, so its lab is listed and openable while that unit is locked.
- Labs never count toward the day. They feed only `weekProgress` (lib/course/week-status.ts:78, week-end status only) and the momentum bonus (week-status.ts:136).

Plan lists per-unit labs at components/course/road-map.tsx:113-118.

Severity stays major. It plainly fails §3, §5 (the stack has no lab line and no START LAB) and §7 (daily completion ignores required labs). It is not critical, because labs are still visible on Today, though only in the secondary card. For the same reason, the letter of §29's 'no required Lab exists only behind Plan' is technically met. Its intent is not: the lab is not an ordered daily item, has no lock or progress state, and is missing from the daily contract. Corrected: The claim is accurate, with three small corrections.
1. The lab definitions (`id: 'lab-activity-window'` and the others) are in data/course/content/labs-w*.ts. data/exercises/course/labs-w*.ts holds only the build and change exercises.
2. Labs are not hidden only behind Plan. Today's WeekCard "Builds" list (course-cards.tsx:55-69) does show the calendar week's labs with a done check and a link. They are still absent from the ordered queue (routing.ts:178, 203-232) and from the daily completion contract, and they affect only the week-end status (week-status.ts:78) and the momentum bonus (:136).
3. The Week 4 lock example is conditional. lab-activity-window shows as available (with no lock check in lab-view.tsx or app/lab/[id]/page.tsx) only while w4-windows is locked because w3-two-pointers is not yet ready.

### 5. [MAJOR] Checkpoints become Today steps only if they happen to fall in today's N items; otherwise there is a week row with no way to start it — CONFIRMED (severity keep)
- Spec: §4 Q10, §5 item 8, §29 'no required Gate exists only behind unit detail', §22 locked state
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/course/routing.ts:220-221 `if (s.path.every((e) => passed.has(e.id))) for (const g of s.gates) if (!g.repair.length) for (const id of g.next) out.push({ … purpose: 'gate' …})`; /Users/ruggudile/Desktop/Projects/reps/lib/today-plan.ts:132 `const window = new Set(plan.slice(0, Math.max(0, N - repsDone)).map((c) => c.key))`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-cards.tsx:80-81 `<span className="text-ink">{g.gate.title}</span>` … `{g.cleared ? 'Cleared' : g.failed ? 'Repair, then retry' : `${g.clean.length}/${g.gate.need}`}` (no link); /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:35 `gate: 'prove'` (the chip says 'Prove'); /Users/ruggudile/Desktop/Projects/reps/components/use-course-day.ts:30 weekGates are taken from the calendar week's units whether or not they are locked
- Detail: Gate variants are queued only in placement or once the unit's path is done, and Today shows them only within the first N items. On every other day the checkpoint exists on Today only as a '0/2' week-card row, with no start action and no lock state. There is never a 'Checkpoint · locked until earlier work is complete' step.

No other page offers a start action for a gate variant or its repair. A search of components/ and app/ for g.next, gate.pool and .repair finds nothing outside rep-workspace, and Plan shows 'Checkpoint: title' as plain text (road-map.tsx:108-111). Today's list is therefore the only way in, and in the simulation a real checkpoint appeared there on 2 of 66 training days.
- Suggested fix: Always render the current unit's checkpoint as a list step. Its state should be Locked (with what is left before it), Ready (START CHECKPOINT), Failed (repair first) or Cleared. Make the week-card rows link to it.
- Verifier: The core mechanism checks out. lib/course/routing.ts:211-221 queues gate variants only in placement, or once every path rep is passed and the gate has no outstanding repair. Locked units add nothing (line 210: `if (s.unit.week > horizon || s.locked) continue`).

components/use-today-plan.ts:65 marks gate and repair items `required: true`. That only exempts them from the checks cap. `fits()` in lib/today-plan.ts still needs `count < N`. Gates get priority only when they fall in `window = plan.slice(0, N - repsDone)` (line 132). Otherwise they wait their turn in queue order (`for (const c of plan) if (open(c) && fits(c)) take(c)`), so a gate behind more than N earlier queue items never becomes a Today step.

components/use-course-day.ts:30 builds weekGates from every unit in the calendar week. It filters only on `g.available.length` and ignores `s.locked` and whether the path is done. components/course/course-cards.tsx:80-81 renders each one as plain text, with no link, no start action and no lock state. The only states are 'Cleared', 'Repair, then retry' and `${clean}/${need}`.

components/course/road-map.tsx:108-111 shows `Checkpoint: {g.gate.title}` as a plain span, while Labs and lessons next to it are Links. A grep of components/ and app/ found no other code that turns g.next or g.repair into a start link; the only hits are the queue plumbing (use-today-plan, course-today KIND chip) and rep-workspace's own checkpoint banner. No 'locked until…' checkpoint step exists anywhere. So the finding holds against §29 ('every required daily item is visible… no required Gate exists only behind unit detail') and the §4 Q10 answer of 'Is there a checkpoint?'. Major is the right severity.

Some details need correcting. Today's list is not literally the only way in. Once the plan's in-window items are done, course-today.tsx:332-335 links the first optional plan item with an exerciseId as `Bonus: {title}`. Because `lead` in lib/today-plan.ts takes `nextPlan.find((c) => c.exerciseId)`, this can be a queued gate variant or repair. That makes things slightly worse, not better: a required checkpoint is offered as a 'Bonus'. The 'Tomorrow' cell (line 311) can likewise name a gate as plain text. A user can also land on a gate rep by direct URL or rep-to-rep navigation (rep-workspace nextInOrder / session next), which then shows the 'Checkpoint · …' banner (rep-workspace.tsx:960). Not queuing a variant before the path is done is intended prerequisite behaviour under §7, not a bug. The defect is that the week-card row gives no lock or 'after X' state and no start action. I did not reproduce the '2 of 66 training days' simulation figure. Corrected: The defect is real. A checkpoint is a startable Today step only when its queued variant (or repair) falls within today's first N items of the course queue (lib/today-plan.ts:132, together with the count<N limit in fits). Gate variants are queued only during placement, or after the unit's path is passed with no repair outstanding. Locked units queue nothing (routing.ts:210-221).

The Today week card (course-cards.tsx:74-84) lists every gate of the calendar week's units. use-course-day.ts:30 does not filter on lock or path state. Each row is a non-link with only a 'Cleared', 'Repair, then retry' or 'n/need' label, no lock or 'opens after…' state, and no start action. Plan's road-map.tsx:108-111 likewise shows 'Checkpoint: title' as plain text while Labs are links.

Correction: Today's list is not the only way in. After the in-window items, course-today.tsx:332-335 can link the next queued gate variant or repair as 'Bonus: {title}'. That mislabels a required checkpoint as optional, which is a truthfulness problem on its own. The 'Tomorrow' cell can name it as plain text. A user can also reach a gate rep through rep-to-rep navigation or a direct /rep/<id> URL. Holding back variants until the path is done is intended prerequisite gating (§7). The gap is the missing locked/next-step presentation and the missing start action on the checkpoint rows. The 2-of-66-days figure was not verified.

### 6. [MAJOR] 55 ordinary cold/retrieval reps are labelled 'Checkpoint' and treated as required — CONFIRMED (severity keep)
- Spec: §4 Q10, principle 12 (truthful), §25 (Week 14)
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/course/routing.ts:194 `if (e.repType === 'cold' || e.stage === 'retrieval') return 'gate'` (applied to path reps at :218); /Users/ruggudile/Desktop/Projects/reps/components/use-today-plan.ts:25 `gate: 'gate'`, :65 `required: q.purpose === 'gate' || …`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:42 `gate: 'Checkpoint'`, :288 `i.kind === 'gate' ? 'font-medium text-cold'`; /Users/ruggudile/Desktop/Projects/reps/data/exercises/oct11.ts:768 `const W = { stage: 'retrieval', repType: 'cold', style: 'write-test' }` (o11-wt-profit 'Break it: profit')
- Detail: These path reps are not gate variants: w2-testing 10, w10-intervals 2, w12-matrix-tries 4, w14-interview 39. When they are listed, Today styles them as checkpoints. Week 14 has no gates, yet Today can list 'Checkpoint' rows while the week card shows none. The 'required' flag also exempts them from the 30% checks cap in the foundation weeks.
- Suggested fix: Give path cold/retrieval reps their own purpose and kind ('cold'/'retrieve'). Reserve 'gate'/'Checkpoint' for members of GATE_OF_EXERCISE.
- Verifier: I traced the code path and recomputed the numbers, and the claim holds. routing.ts:74 `unitReps` drops gate variants from the path (`.filter((e) => !GATE_OF_EXERCISE[e.id])`). Even so, `purposeOf` (routing.ts:189-196) still returns 'gate' for any remaining path rep with `repType === 'cold' || stage === 'retrieval'`, as long as no earlier branch (capstone, transfer/pattern, lesson-level, combine/reconstruct) catches it first. `courseQueue` applies this to every unpassed path rep at :218.

In use-today-plan.ts, `COURSE_KIND` maps gate→'gate' (line 25), and line 65 sets `required: q.purpose === 'gate' || q.purpose === 'repair'`. course-today.tsx:42 labels the 'gate' kind 'Checkpoint', line 54 explains it as "A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next.", and line 288 styles it `font-medium text-cold`.

In lib/today-plan.ts:120/125, `c.required` bypasses `checksMax = floor(N * 0.3)` in the 'foundation' phase (weeks 1-2), and 'gate' is not in CORE (line 69). So in week 2 these reps skip the 30% cap.

I ran courseStatus with no attempts, using the real EXERCISE_BY_ID and SECTION_BY_ID, and applied purposeOf's precedence. That gives exactly 55 distinct non-gate-variant path reps classified as 'gate': w2-testing 10, w10-intervals 2, w12-matrix-tries 4, w14-interview 39. o11-wt-profit is among them. w14-interview has `gateIds: []`, so Week 14 has no gates but Today can still list 'Checkpoint' rows. Telling the user something is a checkpoint that "unlocks what comes next" when nothing is unlocked is untruthful. Under §4 Q10 ("Is there a checkpoint?") and §166-170 (required checkpoints define done) this materially breaks the V2.1 checkpoint contract, so major is right. Corrected: The claim is accurate as stated. One refinement: the 'required' exemption from the 30% checks cap only matters in the 'foundation' phase (weeks 1-2, per RAMP in lib/capacity.test.ts:70). Of the 55 reps, only the 10 in w2-testing get that exemption. The other 45 (weeks 10, 12, 14) are only mislabelled and styled as Checkpoints, with misleading "unlocks what comes next" copy (course-today.tsx:54), and marked required in non-foundation weeks, where the cap does not apply anyway.

### 7. [MAJOR] The target problem is invisible until it opens and is never shown with a lock state — CONFIRMED (severity keep)
- Spec: §4 Q11, §5 item 9, §30
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/course/routing.ts:224-225 `const open = s.state === 'ready' || …` / `if (open) for (const lc of [...unit.targets, ...(unit.readinessTargets ?? [])]) … purpose: 'problem'`; /Users/ruggudile/Desktop/Projects/reps/lib/today-plan.ts:130 `!(c.kind === 'problem' && (foundation || !c.ready))`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-dashboard.tsx:49-50 `prescribedLc = plan.items.filter((i) => i.kind === 'problem' && i.lc)`; /Users/ruggudile/Desktop/Projects/reps/components/leetcode-list.tsx:106-127 (the 'N of M building blocks ready' branch); /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:36,42 `problem: 'prove'`, `problem: 'Problem'`
- Detail: A target such as LC 167 for w3-two-pointers enters the queue only when its unit is ready. In Weeks 1-2 it is filtered out entirely, so w2-hashing's targets (217, 242, 1, 49, 128) can only show from Week 3. Targets whose building blocks aren't ready are dropped. As a result the 'not ready' readiness line in 'Outside problems today' can never show for a course 'new' item. When a target does show, it is labelled 'Problem' under the 'Prove' chip. Locked targets appear only in Plan as plain 'LC n title' text (road-map.tsx:120-125).
- Suggested fix: Render the unit's target(s) as the last list step with state (Opens after <checkpoint> / Building blocks n/m / Ready → START TARGET / Done).
- Verifier: I traced the claim through the code and it holds.
- **Queue:** `lib/course/routing.ts:224-225` adds a unit's `targets` and `readinessTargets` only when `open`. That means the unit is ready or in maintenance, or it has no gates and its whole path is passed. Before that, no problem item exists for any target.
- **Prescription:** in `components/use-today-plan.ts:64` each course target becomes a candidate with `ready: byLc.get(lc)?.ready ?? true`. `lib/today-plan.ts:130` then removes every problem candidate when `foundation` is true or `!c.ready`. `foundation` comes from `phaseOfWeek(week)` in `lib/course/capacity.ts:12` (`week <= 2`). So in calendar Weeks 1-2 no target is prescribed, even w2-hashing's (217, 242, 1, 49, 128, set at `data/course/units.ts:205`). From Week 3, a target whose building blocks are not ready is dropped.
- **The "offered as optional" comment is wrong.** `plan.optional` (`today-plan.ts:163`) can hold problem candidates. But `course-today.tsx:311` and `:332-334` render only the optional item that has an `exerciseId` (the "Bonus" rep), so a waiting problem is never shown on Today.
- **Outside problems list:** `course-dashboard.tsx:49-50` builds `listItems` from `prescribedLc` alone, and `courseLeetcode` (`lib/course/resolves.ts:72-76`) adds 'new' items only from that list. Every 'new' row is therefore a ready, prescribed target, or one already logged today (where `r` is set). The `{state.readyCount} of {state.total} building blocks ready` branch in `leetcode-list.tsx:106-127` needs `state && !r && !state.ready`, so it cannot render for a course 'new' item. It is dead in the course.
- **Labels:** `course-today.tsx:36` puts `problem` under 'prove' and line 42 labels it 'Problem'. No 'Target' label exists, and no row says "opens after checkpoint" or shows a lock.
- **Elsewhere:** no other course component reads `unit.targets` (I grepped `components/course` and `app`). The only one is `road-map.tsx:120-125`, which prints plain muted `LC {lc} {title}` with no lock or open state, on the Plan page. `/problems` (`problems-view.tsx`) uses `byLc`, but it is a separate navigation page, so it does not meet §4 Q11 or §30 ("without opening another navigation item").

**Corrections, both small:**
1. "Targets whose building blocks aren't ready are dropped" happens at the prescription step (`today-plan.ts:130`), not the queue step. They stay in `course.queue`; they are just never shown.
2. The Weeks 1-2 suppression is the calendar-week `foundation` filter. It applies even when w2-hashing is already ready, on top of the unit-ready gating.

**Severity:** Today cannot answer "Is there a target problem?" or show a locked "opens after checkpoint" row (the §5 item 9 example). That materially fails a V2.1 requirement, so major stands. It does not make the product untruthful, so it is not critical. Corrected: Accurate, with two refinements.
1. **Two layers hide targets.** First, `courseQueue` (`lib/course/routing.ts:224-225`) adds a unit's targets only once the unit is ready or in maintenance, or has no gates and its path is fully passed. Second, `prescribe` (`lib/today-plan.ts:130`) drops every problem candidate in calendar Weeks 1-2 (`phaseOfWeek` week<=2 → 'foundation', `lib/course/capacity.ts:12`) and any candidate whose `byLc` readiness is false. Targets dropped at the second layer are still in `course.queue`.
2. **The "offered as optional" comment is false.** `plan.optional` can hold such problems, but `course-today.tsx:311,332-334` renders only the optional entry that has an `exerciseId`, so waiting targets never appear on Today.

**Knock-on effects:**
- `course-dashboard.tsx:49-50` feeds only prescribed LC numbers into `courseLeetcode` (`lib/course/resolves.ts:72-76`). Every course 'new' row is therefore ready or already logged today, and the "N of M building blocks ready" branch (`leetcode-list.tsx:106-127`, which needs `!r && !state.ready`) is dead in the course.
- Visible targets are labelled 'Problem' under the 'Prove' group (`course-today.tsx:36,42`). No Target row says "opens after checkpoint" or shows a lock.
- The only course surface that lists targets is `road-map.tsx:120-125` on Plan, as plain muted 'LC n title' with no lock state. `/problems` uses readiness, but it is a separate navigation page, so it does not satisfy §4 Q11 or §30.

Severity: major.

### 8. [MAJOR] Lessons, demos and worked examples are not list steps, and the primary CTA skips the lesson — CONFIRMED (severity keep)
- Spec: §5 items 1-3, §4 Q5-Q7, §6
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:101 `const learnFirst = !week.unlabeled && Boolean(unit) && cd.course.current!.route === 'full' && cd.course.current!.done === 0 && (…)`; :232-247 a separate panel 'Learn first · not counted, and that is fine' with btn-sm links; :217-218 primary CTA `onClick={start}` → :124 `router.push(`/rep/${reps[0].exerciseId}?s=${s.id}`)`; /Users/ruggudile/Desktop/Projects/reps/data/course/units.ts:218 `workedExampleIds: [],` (as for all 22 units from Week 3); a repo search for visualiz/DemoStep/AnimationTimeline/PredictionPrompt finds nothing
- Detail: - The learn panel sits below the CTA, is unnumbered and has no done state.
- It disappears as soon as one rep of the unit passes, and never shows for a focused or placement route.
- The accent CTA starts the reps, so 'learn first' is never the next action.
- No interactive demonstration exists for Today to show.
- Worked examples exist only for 7 units in Weeks 1-2.

Otherwise lessons live only in Learn and Plan → week detail.
- Suggested fix: Make LEARN / WATCH / REBUILD the first numbered steps, with tracked completion (lesson opened and read, demo stepped through, reconstruction rep passed). When the first open step is a lesson, the CTA should say START LESSON.
- Verifier: I checked every cited line and the claim holds.

1. In components/course/course-today.tsx:101, `learnFirst` requires `route === 'full' && done === 0`. In lib/course/routing.ts:155-158, `done` counts the passed reps on the unit's path. So the panel disappears once one path rep passes. It never shows on the 'focused' route, which is used when there is prior evidence or a gate has failed, and that covers the 'placement' state. It also never shows on 'maintenance'.

2. The panel at :232-249 is a separate `btn-sm` block between the CTA and the ordered list. It is not numbered and has no done state.

3. The accent CTA at :217-218 calls `start()`, and :124 sends the learner straight to `/rep/${reps[0].exerciseId}`. The lesson is never the main next action, which goes against §6 ("one obvious next action") and the §5 stack (LEARN, then WATCH IT MOVE, then REBUILD as steps 1-3).

4. One possible rebuttal fails. The list does have an ItemKind 'learn' (lib/today-plan.ts:18, rendered at :288). But those items are lesson-level exercises, picked by stage (recognize/trace/recall/complete) through routing.ts:192 `if (LESSON_LEVEL.includes(e.stage)) return 'learn'`. They are not LESSON_BY_ID lessons, demos or worked examples. So lessons and worked examples are still not list steps.

5. data/course/units.ts has filled `workedExampleIds` only at lines 48, 63, 78, 93, 125, 140 and 170, which is 7 units in Weeks 1-2. All 26 other entries are `[]`, including 4 in Weeks 1-2 (lines 108, 155, 185, 200) and all 22 units from Week 3 on (line 212 onward).

6. A search of app, components, lib and data for visualiz, DemoStep, AnimationTimeline and PredictionPrompt finds only one hit: the title of a YouTube link in data/concept-videos.ts:76. No interactive demonstration component exists, so §4 Q6 cannot be answered.

Small wording fix: 'placement' is a unit state, not a route. Placement implies prior evidence, though, so the unit is on the 'focused' route and the effect is the same. Severity stays major. The failure is concrete against §5, §6 and §4 Q5-Q7, but it does not make the product untruthful. Corrected: The claim is accurate, with two small corrections.

1. The lesson panel shows only when the unit is on the 'full' route and no rep on its path has passed yet. The 'placement' case is not a separate route: placement is a unit state whose units are on the 'focused' route, and the panel never shows there either.

2. The list's 'learn' items (ItemKind 'learn') are not lessons. They are lesson-stage exercises (recognize/trace/recall/complete), so lessons, demos and worked examples are still not list steps.

### 9. [MAJOR] The primary CTA is generic, can disappear, and starts a fixed session that doesn't re-route after a failed checkpoint — CONFIRMED (severity keep)
- Spec: §6 (one obvious next action), §29 'current CTA is deterministic'
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:213-223 the only labels are 'Continue' / 'Start' / `Practice LC ${next.lc} on …` / 'Go to the re-solves'; :104 `const reps = left.filter((i) => i.exerciseId)` + :122 `createSession(repo, 'day', "Today's training", reps.map(…))`; /Users/ruggudile/Desktop/Projects/reps/components/rep/rep-workspace.tsx:654-666 nextHref walks `session.exerciseIds` via nextInSession (lib/session-planner.ts:334-345); rep-workspace.tsx:962 copy '…a short repair comes next, then a fresh checkpoint'; course-today.tsx:209 `{!complete && next && (`; /Users/ruggudile/Desktop/Projects/reps/components/use-today-plan.ts:79 `buildReviewSession(dueReviews(reviews), …, new Date(), 4)`
- Detail: - The CTA never says DO REPAIR FIRST, START CHECKPOINT, START LAB or START TARGET.
- 'Start' freezes every remaining rep into one session. A failed checkpoint inside it sends Next to the next session item, which can be the second variant, not the repair Today now prescribes.
- When `next` is undefined but the day isn't complete (empty queue, all prescribed items done below target), the hero shows no action and no reason.
- Cold reviews are picked by clock time (`new Date()`), so rows can appear mid-day and change the list.
- For an LC problem the CTA opens NeetCode in a new tab, and the Unaided/Needed help logging needed for credit is several sections lower.
- Suggested fix: Derive a typed CTA from the first incomplete contract step (START LESSON / CONTINUE / DO REPAIR FIRST / START CHECKPOINT / START LAB / START TARGET / LOG RESULT / DAY COMPLETE). Re-plan the session after a failed checkpoint. Show an explicit empty state with the reason and an action. Evaluate due reviews once per day.
- Verifier: Checked against the code; the claim mostly holds.

1. Generic labels. course-today.tsx:209-223 shows the hero CTA only when `!complete && next`. Its labels are only 'Continue' / 'Start' (`{done ? 'Continue' : 'Start'}`), `Practice LC ${next.lc} on ${practiceSite(next.lc)}`, or 'Go to the re-solves'. The label never depends on `next.kind`, even when that item is a gate/checkpoint, repair, lab or target. That misses spec §6 line 160: "START TODAY, CONTINUE TODAY, DO REPAIR FIRST, START LAB, START CHECKPOINT, START TARGET, DAY COMPLETE".

2. Frozen session. start() at :103-125 does `createSession(repo,'day',"Today's training", reps.map(i=>i.exerciseId!))` over every undone item. In rep-workspace.tsx:654-666, nextHref walks `session.exerciseIds` through nextInSession (lib/session-planner.ts:334-345), which only skips finished items or extras. The routing logic does handle a failed checkpoint. lib/course/routing.ts:120-123 returns `next: queue.slice(0, still)`, so a `need: 2` gate puts two variants into the session. routing.ts:216-220 puts repairs first and holds back further variants until they are done (`if (!g.repair.length) for (const id of g.next)`). But that only applies when Today's plan is rebuilt. Inside the frozen session, a non-clean pass on variant 1 shows 'Next rep' (rep-workspace.tsx:1430), and 'Skip for now' (:1490) also follows nextHref. Both go to variant 2, not the repair. The checkpoint copy at :962 ("a short repair comes next, then a fresh checkpoint") is therefore untrue inside that session.

3. CTA can disappear. Nothing renders when `next` is undefined and the day is not complete. Only the motivation line stays, with no action and no reason given.

4. Cold reviews by clock. use-today-plan.ts:79 uses `dueReviews(reviews)` (default `now = new Date()`, lib/schedule.ts:132-134) and `buildReviewSession(..., new Date(), 4)`, which also uses a 12h cutoff. These are computed again on every memo recompute, for example after each attempt. So cold rows can appear mid-day and change the list, which conflicts with §29 "current CTA is deterministic".

5. LC CTA. For a `problem` item it opens an external site (`target: '_blank'`). I did not check the claim that the Unaided/Needed help logging sits lower on the page; it is plausible.

Severity 'major' is right. These materially fail §6 and §29, but they don't make progress or credit untruthful. Corrected: Mostly accurate, with one refinement. Re-routing after a failed checkpoint does exist, in courseQueue (lib/course/routing.ts:216-220: repairs first, next variants only `if (!g.repair.length)`), but only when Today's plan is rebuilt. Two things undo it:

- Inside an active 'day' session, nextHref (rep-workspace.tsx:654-666 → nextInSession) and 'Skip for now' (:1490) follow the frozen `session.exerciseIds`. For a `need: 2` gate the session already holds both variants (gateStatus `next: queue.slice(0, still)`, routing.ts:123), so after a non-clean first variant, 'Next rep' goes to the second variant instead of the repair.
- Back on Today, the CTA is still a generic 'Continue' (course-today.tsx:217, `{done ? 'Continue' : 'Start'}`). Clicking it builds a new session in which repair comes first. The label never names DO REPAIR FIRST, START CHECKPOINT, START LAB or START TARGET, even though `next.kind` is known.

The other points are confirmed:
- The hero action is absent when `next` is undefined and the day is incomplete (:209), with no reason shown.
- Cold reviews depend on wall-clock `new Date()` through dueReviews and buildReviewSession's 12h cutoff (use-today-plan.ts:79, lib/schedule.ts:132-154). Rows can appear or reorder whenever the memo recomputes.
- LC problems open an external site in a new tab.

### 10. [MAJOR] Repair work is not prioritised or explained — CONFIRMED (severity keep)
- Spec: §4 Q12, §6 'DO REPAIR FIRST', principle 8
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/today-plan.ts:155 `const rest = [...byList(input.prep), ...byList(input.plan), …]` (warm-ups listed before repairs); /Users/ruggudile/Desktop/Projects/reps/lib/course/routing.ts:209-218 repairs are pushed per unit in teaching order, after any earlier unfinished unit's path; /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:31 `repair: 'drill'` (chip); :50 the WHY.repair copy is never rendered on Today; /Users/ruggudile/Desktop/Projects/reps/components/course/course-cards.tsx:81 'Repair, then retry' with no link
- Detail: After a failed checkpoint in w1-mutation-references, its repairs queue behind the rest of w1-loop-control's path (up to 20 reps), so with N=10 they may not appear today at all. When they do appear, the CTA points to a warm-up first, the chip counts them as 'Drill', and Today never says why they are there. No other page offers the gate repairs.
- Suggested fix: When any current-week gate has failed, show a repair banner and put its repairs first, with a DO REPAIR FIRST CTA and the WHY line. Give repair its own chip.
- Verifier: The core claim holds: repair work is not given priority across the plan, and the main CTA can never lead with it.

Checked in the code:
- lib/course/routing.ts:209-218 builds the queue unit by unit in UNITS order (`for (const s of statuses)`). Repairs go first only within their own unit (`for (const g of s.gates) for (const id of g.repair) out.push(...purpose: 'repair'...)` before that unit's path). Any earlier unit that is not ready still puts its whole unfinished path ahead of them.
- data/course/units.ts:86-91: w1-mutation-references depends only on w1-state-while. It comes after w1-loop-control (sections c1-loop-control and o2-loops) and w1-running-state. So a learner can attempt and fail the mutation gate while loop-control's path is still unfinished. The mutation repairs then sit behind all of it.
- lib/today-plan.ts: repair is in CORE (`['learn','drill','combine','repair']`), so it is filled only by the final `for (const c of plan) if (open(c) && fits(c)) take(c)` loop, in queue order. `required` only lifts the foundation check cap and gives no priority. With N=10 the repairs can fall off the day.
- Display order is `[...byList(input.prep), ...byList(input.plan), ...]` (line 155). course-today.tsx:70 uses `next = left[0]`, and `start()` (lines 103-124) opens the session at `reps[0]`. When there is a warm-up (prep share is floor(0.2N)), the CTA starts with it. The CTA label is only 'Start' or 'Continue' (lines 213-218), never anything like 'DO REPAIR FIRST' (spec §6 line 160).
- course-today.tsx:31 `repair: 'drill'`: the group chip counts repairs under Drill.
- course-cards.tsx:81 shows 'Repair, then retry' as plain text with no link. road-map.tsx:21 shows 'Repair, then checkpoint' as a label only. No component in app/ or components/ reads `g.repair`, so Today is the only place gate repairs can be reached.

Overstated parts:
1. "Today never says why they are there" is too strong. Each item row shows `KIND[i.kind]` = 'Repair' in repair colour (course-today.tsx:288). WHY.repair is passed into the session blocks (lines 119-120) and shown on the rep page as `block.why` (components/rep/rep-workspace.tsx:1029). What is missing is an explanation on the Today screen itself: which checkpoint failed and why the repair matters. The Repair label is there.
2. The "behind loop-control's path" case needs the learner to work ahead into mutation-references. The normal queue would not send them to its gate before loop-control is finished. A failed gate in the frontier unit gets its repairs ahead of that unit's own path. The more common gap is that a non-frontier unit's repairs wait behind earlier units' remaining work and behind warm-ups.

Severity: major is right. This materially fails spec §4 Q12, the §6 'DO REPAIR FIRST' CTA and principle 8 (focused repair). It does not make the product untruthful. Corrected: Gate repairs are queued per unit in teaching order (lib/course/routing.ts:209-218). They come before their own unit's path but after every earlier not-ready unit's remaining path, and lib/today-plan.ts treats them as ordinary core plan items filled in queue order (`required` only lifts the foundation check cap). So a repair for a non-frontier unit can fall outside today's N reps. One way this happens: failing the w1-mutation-references gate while w1-loop-control is unfinished, which is possible because that unit depends only on w1-state-while.

When repairs are taken, they are shown after the prep warm-ups (today-plan.ts:155). The main CTA is a generic 'Start'/'Continue' that opens the session at left[0], which may be a warm-up (course-today.tsx:70, 103-124, 213-218), and there is no 'DO REPAIR FIRST' state. The group chip counts repairs as Drill (course-today.tsx:31).

Each row is labelled 'Repair' (course-today.tsx:288), and WHY.repair is shown on the rep page during the session (rep-workspace.tsx:1029). But Today never says which checkpoint failed or why the repair comes first.

No other surface links to gate repairs: course-cards.tsx:81 'Repair, then retry' and road-map.tsx:21 'Repair, then checkpoint' are plain labels, and nothing in app/ or components/ reads `g.repair`.

Severity: major.

### 11. [MAJOR] Today doesn't guide the learner from one step to the next — CONFIRMED (severity keep)
- Spec: §6, §19 (in-product moments)
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:45-58 WHY is used only at :119-120 (session payload); :200-202 the motivation line comes from todayLine (/Users/ruggudile/Desktop/Projects/reps/data/course/motivation.ts:159-168), which is count-only; motivate('gate-cleared') and motivate('repair-success') have no UI caller (a search of components/app/lib, excluding tests, finds only readiness-report.tsx:114 'week-complete'); course-today.tsx:274-276 a row completing only swaps the number for a check (`transition-colors`)
- Detail: Today never shows hand-offs like 'Lesson complete → now rebuild', 'Drills complete → combine' or 'Lab complete → prove it cold'. Clearing a checkpoint or finishing a repair gets no affirmation. Completed rows get no completion animation. Locked steps are never shown, so nothing visibly unlocks.
- Suggested fix: Add a 'Now' card driven by the completed step type, with one-line affirmation, the next step's WHY and the typed CTA. Show gate-cleared and repair-success lines once per event. Add a 150-250ms check-in animation on rows.
- Verifier: I could not refute the claim. I checked each part of the evidence against the code.

- **WHY copy:** The WHY map is defined at components/course/course-today.tsx:45-58. Its only use is when the session blocks are built at :119-120. The Today component never renders it.
- **Motivation line:** The line at :200-202 comes from `todayLine` (data/course/motivation.ts:159-168). That function only looks at day type and rep count, and only returns planned-rest, recovery-day, day-complete, day-start, day-halfway or day-progress.
- **No callers for the §19 events:** A grep of components, app and lib for `motivate(` finds only three non-test callers:
  - course-cards.tsx:27 (`week-progress`)
  - course-cards.tsx:171 (`ready`, `ready-with-gaps` or `not-ready`)
  - readiness-report.tsx:114 (`week-complete`)
  
  Nothing calls `gate-cleared` or `repair-success`. The rep workspace's checkpoint panel (rep-workspace.tsx:958-962) only shows before the checkpoint is passed. app/day/[date]/summary has no gate or repair messages either. So clearing a checkpoint or finishing a repair gets no affirmation anywhere.
- **Completed rows:** A row at :274-276 just swaps its number for an `IconCheck` inside `transition-colors` and gets a line-through. There is no completion animation on Today.
- **Locked steps:** `PlanItem` in lib/today-plan.ts:35-37 only has `done: boolean` and no locked state, so locked steps cannot be shown and nothing visibly unlocks.

Severity stays major. This misses the §6 hand-off and unlock requirement and the §19 gate-cleared and repair-success moments. No non-negotiable principle is broken: Today still gives one main CTA with a "Next:" label (:209-227), which partly meets principle 13. Corrected: The claim is accurate for the Today page itself, with three points of context.

1. **Hand-off text appears on the rep page, not on Today.** The WHY copy is passed into the session payload and shown inside an active training session at components/rep/rep-workspace.tsx:1029 (`{... : block.why}` in the `data-testid="toward"` strip). It is a fixed per-block explanation, not a "you finished X, now do Y" hand-off.
2. **Completing a rep is animated on the rep page.** At rep-workspace.tsx:1381-1433 a passed rep gets `success-in`, `pop-in`, `draw` and `evidence-in`, plus a single "Next rep"/"Finish the day" CTA. Today animates only day completion: `celebrate-in` at :166 and the `TrainingFlame ignite={celebrate}` at :162.
3. **Today does have one obvious next action.** It shows a single primary CTA (Start/Continue/Practice LC/Go to the re-solves) with "Next: {title}" at :209-227. However, the CTA labels are not step-specific, such as START CHECKPOINT or DO REPAIR FIRST.

What is confirmed missing:
- Today has no step-to-step hand-off messages.
- `motivate('gate-cleared')` and `motivate('repair-success')` have no UI caller anywhere, including the rep page and the day summary.
- Completed rows on Today get no completion animation.
- Today has no locked or unlocking steps, because `PlanItem` (lib/today-plan.ts:35-37) carries only `done`.

### 12. [MAJOR] From Feb 1 2027 (the checkpoint day) Today falls back to 'Week 1 · Foundations' and hides the final decision — CONFIRMED (severity lower)
- Spec: §3, §25, principle 12
- Evidence: /Users/ruggudile/Desktop/Projects/reps/data/course/calendar.ts:54-58 courseWeekOf returns 15 after Jan 31 (`Math.min(COURSE_WEEKS + 1, …)`); /Users/ruggudile/Desktop/Projects/reps/components/use-course-day.ts:26 `const week = WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[1]`; /Users/ruggudile/Desktop/Projects/reps/lib/course/capacity.ts:20 falls back to `WEEK_BY_NUMBER[14]` instead (inconsistent); /Users/ruggudile/Desktop/Projects/reps/components/course/course-dashboard.tsx:64 `Week {cd.week.number} of 14`, :76 `{cd.week.number >= 13 && (`; /Users/ruggudile/Desktop/Projects/reps/components/dashboard.tsx:52 always shows CourseDashboard from COURSE_START
- Detail: 2027-02-01 is a Monday, 98 days after the start, so courseWeekOf gives 15. On that day Today shows:
- 'Week 1 · Foundations' and 'Week 1 of 14'
- a 15-rep training target
- Week 1's builds and checkpoints in the week card

It also hides the InterviewCard that holds the final ready / ready-with-gaps / not-ready decision.
- Suggested fix: Add a post-course state (the checkpoint and decision view) for dates after COURSE_END. Use one shared week fallback, and never fall back to week 1.
- Verifier: The code the claim cites is accurate:
- calendar.ts:54-58 `courseWeekOf` returns `Math.min(COURSE_WEEKS + 1, …)`, so 2027-02-01 maps to week 15.
- use-course-day.ts:26 falls back with `WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[1]`. WEEK_BY_NUMBER only has weeks 1-14 (weeks.ts:64), so week 15 becomes week 1.
- capacity.ts:20 falls back to `WEEK_BY_NUMBER[14]` instead, which is inconsistent.
- course-dashboard.tsx:76 only shows the InterviewCard when `cd.week.number >= 13`.

With a date of 2027-02-01, Today would show 'Week 1 of 14' and Week 1's labs and gates, and would hide the InterviewCard and finalDecision (course-cards.tsx:142). Only the 15-rep target is wrong in the claim: `dailyTarget(15)` returns 15, the correct late-course rate, not a Week 1 number.

But production never reaches that date. The app's "today" comes from studyToday() in components/reps-provider.tsx:79-81:
`return devAsOf() ?? clampDate(localDate(now), FIRST_DAY, LAST_DAY > COURSE_END ? LAST_DAY : COURSE_END)`
- LAST_DAY is the last day of the 90-day plan, 2027-01-09 (data/curriculum.ts:216-219, schedule-90.ts:29). That is earlier than COURSE_END ('2027-01-31'), so the clamp's upper bound is 2027-01-31.
- devAsOf() returns null when NODE_ENV === 'production' (reps-provider.tsx:68).

So in production `today` can never be later than 2027-01-31, and courseWeekOf never returns 15. The week 1 fallback can only be triggered in dev with ?asOf=2027-02-01. It is a hidden bug that would surface if the clamp changes. It is not something a learner sees today. Corrected: The scenario described (Today showing "Week 1 · Foundations" and hiding the InterviewCard) only happens in dev with ?asOf=2027-02-01. In production, studyToday() (components/reps-provider.tsx:79-81) clamps the date to COURSE_END = 2027-01-31, because LAST_DAY is 2027-01-09. devAsOf() is disabled in production, so week 15 never occurs.

The week 1 fallback in use-course-day.ts:26 (`?? WEEK_BY_NUMBER[1]`) and its mismatch with capacity.ts:20 (`?? WEEK_BY_NUMBER[14]`) are still worth fixing as a minor, hidden defect. The claim also has one detail wrong: the target on that day would be 15, which is correct for late weeks, because dailyTarget(15) = 15.

There is a different problem in production. From Feb 1, 2027 onward the app's "today" freezes at Sunday, Jan 31:
- the header shows "Sunday, January 31";
- the subtitle shows "Week 14 of 14 · Feb 1 checkpoint in 1 days" (course-dashboard.tsx:51,64);
- it stays a rest day indefinitely;
- the actual checkpoint day never arrives in the UI.

The InterviewCard and finalDecision do stay visible, because week 14 is at least 13. So the final decision is not hidden, but the calendar is untruthful after the checkpoint. That is a principle 12 issue, best rated minor to major depending on whether use after Feb 1 matters. The "hides the final decision" part of the claim does not happen in production.

### 13. [MAJOR] Saturday copy says 'N reps would close the week' while labs and checkpoints are open, and never shows that the week is closed — CONFIRMED (severity keep)
- Spec: §7 week completion, §4 Q16, principle 12
- Evidence: /Users/ruggudile/Desktop/Projects/reps/lib/course/week-status.ts:26-28 `const short = Math.max(0, weekTarget(week) - weekDates(week).filter((d) => d < date).reduce(…))` (reps only); /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:177 `target ? `${target} reps would close the week` : 'Nothing owed'`; :68 `complete` requires 'training'; /Users/ruggudile/Desktop/Projects/reps/data/course/motivation.ts:114-116 '…week N is already covered. Rest is part of the plan.'; week-status.ts:78 the week ends 'recoverable' when labs or gates are missing
- Detail: Saturday promises that a rep count closes the week, or that the week is 'already covered', even when the week's required builds and checkpoints are unfinished. After the N reps are done, the headline and motivation are unchanged: optionalTarget excludes today's credits and 'complete' applies only to training days. There is no CTA and no week-complete moment.
- Suggested fix: Base Saturday on the week contract: list the open reps, labs and checkpoints, and show a week-complete state with the earned message when they are all done.
- Verifier: The core of the claim holds up. lib/course/week-status.ts:26-28 works out Saturday's optionalTarget from rep credits only: `weekTarget(week) - weekDates(week).filter((d) => d < date).reduce(...)`. It ignores labs and gates, and because of the `d < date` filter today's credits never reduce it. components/course/course-today.tsx:66 sets target = day.optionalTarget. Line 68 sets `complete = day.type === 'training' && done >= target`, so Saturday can never be marked complete. Line 177 renders `${target} reps would close the week` or 'Nothing owed'. data/course/motivation.ts:114-116 (the recovery-day case, reached through todayLine at :161) says 'N reps would close week W' or 'week W is already covered. Rest is part of the plan.' Neither line checks progress.labsDone/labsRequired or gatesCleared/gatesRequired, even though useCourseDay already computes them (components/use-course-day.ts:33). Once the learner has done the N reps, the headline and motivation text stay the same; only the progress bar fills and the flame changes. lib/course/capacity.ts:27 repeats the same copy ('N more would close week W; nothing is owed'). This breaks §7 ('week completion must require ... required labs, required checkpoints') and principle 12 (truthful progress). It also leaves Q16 ('When am I officially done?') unanswered on Today. week-status.ts:78 only downgrades a finished week to 'recoverable' after it has ended, which Saturday's Today view never uses.

Two parts of the claim go too far. First, the product does have a week-complete moment, just not on Today. components/course/readiness-report.tsx:89 computes `complete = p.done >= p.target && labs(required) all done && gates.every(cleared)`, then shows 'Week N complete' (:93) and motivate('week-complete') (:114). That screen is the Progress page (components/progress-view.tsx:65), and it only lists finished weeks, those before courseWeekOf(today) (use-course-day.ts:35). So the week-complete moment appears only after the week is over, never on Saturday. Second, Today on Saturday does still have a CTA: the Start/Continue button at :170-181 shows whenever plan items remain. What is missing is a CTA for the open lab or checkpoint that is closing the week, and any closing or celebration state. Corrected: On Saturday, Today (components/course/course-today.tsx:66,68,177; data/course/motivation.ts:114-116; also lib/course/capacity.ts:27) counts reps only. It says 'N reps would close the week' or 'week N is already covered' even when the week's required labs or checkpoints are open. optionalTarget (lib/course/week-status.ts:27) leaves out today's credits, and 'complete' applies only to training days, so the headline and motivation stay the same after the N reps are done. Today has no week-closed state and no CTA pointing to the open lab or checkpoint. A truthful week-complete message does exist: readiness-report.tsx:89-114 requires reps, labs and gates. It is on the Progress page, though, and only for weeks that have already finished, so it shows up after the week ends rather than on Saturday when the week actually closes. Severity: major (§7 week completion, Q16, principle 12).

### 14. [MINOR] The 'learning today' line names the unit at the front of the queue, not the work actually listed — CONFIRMED (severity keep)
- Spec: §4 Q1/Q2
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:96 `const unit = cd.course.current?.unit`, :181 `{unit && !complete && (`; /Users/ruggudile/Desktop/Projects/reps/components/use-course.ts:23 `statuses.find((s) => !s.locked && s.state !== 'ready' && s.state !== 'maintenance')`
- Detail: The list can span several units: at a unit boundary, or when a unit with no prerequisites (w2-hashing) fills in. The line still names only the first one, and the line is hidden once the day is complete. Combined with the dead-end above, it named the wrong unit for 115 of 131 simulated steps.
- Suggested fix: Derive the objective from the units of today's listed items (and the current week), and keep it visible in the complete state.
- Verifier: The citations are accurate. course-today.tsx:96 is `const unit = cd.course.current?.unit` and :181 is `{unit && !complete && (`, which renders `unit.title · unit.purpose` as data-testid="unit-focus". use-course.ts:23 sets current to the first status that is not locked and not ready or maintenance. The list comes from somewhere else. use-today-plan.ts:59-69 builds the day plan from `course.queue.slice(0, 80)`, and courseQueue (lib/course/routing.ts:204-230) walks every unlocked status up to `horizon = frontier.week + 1`. Along the way it adds placement gates, repairs, path reps and gates for each unit that is not ready, plus target LC problems (`lc:${lc}:new`, :224-225) for units that are ready or in maintenance. So one day's list can hold items from several units. Because the loop runs in unit order, target problems from an earlier unit that is already ready come before the current unit's reps, so the first listed item can belong to a unit other than the one the line names. The `!complete` guard also hides the line once the day is done. Two details are slightly off or unverified. First, the frontier in courseQueue (routing.ts:206) does not filter `locked`, but `current` does, so the two can disagree. Second, I could not reproduce the "115 of 131 simulated steps" figure, and it depends on a separate dead-end finding. Severity minor is reasonable: §4 Q1 is partly answered, by the current unit only, rather than wrong in a way that misleads. Corrected: The claim is confirmed. The Today 'unit-focus' line (components/course/course-today.tsx:96, :181-185) shows only `useCourse().current`, the first unlocked unit that is not ready (components/use-course.ts:23). The listed work is `course.queue.slice(0, 80)` (components/use-today-plan.ts:62), and courseQueue (lib/course/routing.ts:209-226) collects items from every unlocked unit up to frontier week + 1. That includes target LC problems from units already ready or in maintenance, and those come before the current unit's items in the list. So the list can span several units, and the item at the top can belong to a different unit than the one the line names. The line is also hidden once the day is complete. The '115 of 131 steps' figure was not verified and relies on a separate finding. Severity stays minor.

### 15. [MINOR] Mobile layout: fixed one-line buttons cut off at the card edge, truncated row titles, small tap targets, CTA pushed down — CONFIRMED (severity keep)
- Spec: §22 mobile flow, §4 'immediately'
- Evidence: /Users/ruggudile/Desktop/Projects/reps/app/globals.css:281 `.btn { … white-space: nowrap; }`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:148 `<section … className="mt-8 overflow-hidden …">`, :243-244 `Worked example: {w.title}`, :333-334 `Bonus: {…title}`, :222-223 btn-lg `Practice LC … on …`, :278 `<p className="min-w-0 truncate text-[14px] …">` (no title attribute), :274 `grid-cols-[26px_minmax(0,1fr)_auto]`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-dashboard.tsx:57,67 header contains InterviewTargetCompact (/Users/ruggudile/Desktop/Projects/reps/components/interview-target.tsx:17 `w-full max-w-[400px] … p-4`); /Users/ruggudile/Desktop/Projects/reps/components/course/week-strip.tsx:14,35,37 `grid-cols-7 gap-1.5` / `px-1` / `size-6`
- Detail: Estimates at a 375px viewport (287px content width):
- Buttons cut off by the card's overflow-hidden: 'Worked example: Countdown with a while loop' (≈300px, the Day 1 button the e2e test checks), '…Cart history without a shared list' (≈355px), '…the first repeated ticket' (≈470px), and 'Bonus: <title>'. 'Practice LC 1971 on NeetCode' (≈275px) overflows at 320px.
- Row titles get about 21-23 characters (about 15 at 320px). 52% of 995 possible titles are over 22 characters, with no tooltip and no way to expand.
- Row links and week-card lab links are tappable only on the text line, about 20px tall.
- The ≈160px interview-target card stacks above Today, so the CTA lands near or below the first screen.
- At 320px, week-strip cells have about 20px of content for a 24px icon box.
- Suggested fix: Let buttons wrap or truncate inside a max width (whitespace-normal, min-h instead of a fixed height). Make each whole row a link of at least 44px with a two-line clamp and a title attribute. On small screens, move InterviewTargetCompact below Today.
- Verifier: The cited code matches what the claim says. In app/globals.css:269-281, `.btn` sets `white-space: nowrap`. `.btn-sm` (globals.css:360) and `.btn-lg` (:366) only change the height, padding and font size, so labels never wrap.

The Today section (course-today.tsx:148) is `overflow-hidden`. Its inner blocks use `p-6` / `px-6` (24px), and the dashboard wrapper uses `px-5` (20px; course-dashboard.tsx:56). That gives 375 − 40 − 48 = 287px of content width at 375px, as the auditor estimated.

- **Learn-first buttons (:241-244):** they are `btn btn-sm` inside a `flex-wrap` row. Wrapping only moves a whole button to a new line, so any label wider than 287px is clipped by `overflow-hidden`.
- **Titles exist:** 'Cart history without a shared list' is at data/course/content/week1.ts:609, and 'Brute force, then improve: the first repeated ticket' is at week2.ts:606. 'Countdown with a while loop' is in week1.ts.
- **Text widths:** at 12.5px with 20px of padding, the Day 1 label comes to about 300px, which is plausible. Same for the 'Bonus:' button (:333-334) and the btn-lg 'Practice LC … on …' button at 320px (:222-223).
- **Row titles (:274, :278):** the grid is `[26px_minmax(0,1fr)_auto]`, and the title `<p>` has `truncate` with no `title` attribute. Only the inline `<a>` (14px text) is the link, so the tap target is roughly one line of text in a `py-2` row.
- **Interview card:** `InterviewTargetCompact` (interview-target.tsx:17, `w-full max-w-[400px] … p-4`, four lines of text) sits in the header above `CourseToday` (course-dashboard.tsx:57-67). On a phone it pushes the CTA down.
- **Week strip:** it is `grid-cols-7 gap-1.5` with `px-1` cells holding a `size-6` icon box (week-strip.tsx:14,35,37). It is used in WeekCard (course-cards.tsx:49) and on the rest-day view (course-today.tsx:142). At 320px each cell has about 20px of content for a 24px box, a small 2px overflow on each side.

I did not check the '52% of 995 titles over 22 characters' figure; treat it as approximate. The pixel widths are estimates from font metrics and have not been rendered.

Severity stays minor: this is §22 mobile-flow polish. Nothing is untruthful and no core requirement is broken, although the clipped Day 1 worked-example button is the most visible problem. Corrected: The claim is accurate, with two caveats. First, the pixel widths are estimates from font metrics (12.5px btn-sm text plus 20px padding against 287px of content width at 375px), not measured renders. Second, the figure '52% of 995 titles over 22 characters' was not checked. The confirmed issues:

- **Clipped buttons:** `.btn{white-space:nowrap}` (globals.css:281) inside the `overflow-hidden` Today section (course-today.tsx:148) clips long 'Worked example: …' and 'Bonus: …' btn-sm labels (:243-244, :333-334) at phone widths. It also clips the btn-lg 'Practice LC … on …' label (:222-223) at about 320px.
- **Truncated row titles:** titles use `truncate` with no `title` or tooltip (:278), and only the inline text `<a>` is tappable.
- **CTA pushed down:** the InterviewTargetCompact card in the header (course-dashboard.tsx:67) pushes the Today CTA down on mobile.
- **Week strip:** cells are cramped at 320px, with a 24px icon box in about 20px of content width (week-strip.tsx:14,35,37). The strip is used in WeekCard and on the rest-day view.

Severity: minor.

### 16. [MINOR] Hover/focus polish: row links cause full page reloads and their focus ring is cut off — CONFIRMED (severity keep)
- Spec: §22 hover/focus feedback, §21
- Evidence: /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx:281 `<a href={href} … className="hover:underline">` for internal /rep links, inside the `truncate` (overflow hidden) <p> at :278; /Users/ruggudile/Desktop/Projects/reps/app/globals.css:172-176 `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`; /Users/ruggudile/Desktop/Projects/reps/components/course/course-cards.tsx:76-82 checkpoint rows are not interactive
- Detail: Internal list links use a plain <a>, so each click reloads the whole app instead of navigating client-side. The global focus outline, offset 2px, is cut off by the truncating parent. Row hover is only an underline, and the 'now' row is marked only by bg-surface.
- Suggested fix: Use next/link, make the row the click and focus target with hover and focus-within styles, and keep the focus ring outside any overflow-clipped element.
- Verifier: Checked against the code; the claim mostly holds. In /Users/ruggudile/Desktop/Projects/reps/components/course/course-today.tsx line 127, hrefFor returns `/rep/${i.exerciseId}...` for exercise items. Line 281 renders it as a plain `<a href={href} ... className="hover:underline">`, not as next/link. The same file already imports Link (line 3) and uses it for the same href at line 213 ("Continue"). So clicking an exercise row does a full document navigation and re-boots the client app, while the primary button navigates client-side. The `#leetcode` re-solve anchor and the external LC links (target _blank) are correctly left as plain `<a>`. The parent `<p>` at line 278 has `min-w-0 truncate`, which sets overflow:hidden. The global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` (globals.css 172-176) draws the ring 2 to 4px outside the link. The link sits flush with the p's left edge (the sr-only span before it is absolutely positioned), so at least the left side of the ring is clipped, and probably the top and bottom too. Rows show hover only as an underline, and the 'now' row differs only by `bg-surface` plus the flame number badge and aria-current. This is polish under §22 (hover/focus feedback), so minor is the right severity. One correction: the checkpoint rows in course-cards.tsx 76-82 are status rows (plain spans), not broken links. Making them non-interactive is a design choice, not a defect, and should not count as evidence. Lab rows in the same card do use next/link correctly (course-cards.tsx line 62). Corrected: Confirmed (minor). In course-today.tsx:281, exercise rows link to internal `/rep/...` routes (hrefFor, line 127) with a plain `<a>`, so each click triggers a full page load. The same file already uses next/link for the identical href at line 213. These links sit inside a `truncate` (overflow:hidden) `<p>` at line 278, so the global 2px outline with 2px offset (globals.css:172-176) is clipped, at least on the left edge. Row hover is only an underline. The 'now' row is marked by bg-surface plus the flame badge and aria-current. The non-interactive checkpoint rows in course-cards.tsx:76-82 are a deliberate status display, not a defect. Lab rows already use next/link correctly (course-cards.tsx:62). Fix: switch internal rows to Link, and either move the truncation into the link or add inner padding / an inset focus ring.

## workspace-safeguards

The Week 13 rep page itself hides well. Bare mode removes Basics, the concept guide, the teach brief, Building toward, the walkthrough, the Hint button and the missing-prereq warning. The Trains chips stay hidden until a pass. All 48 c13 titles and prompts are free of technique words, and none of them carries hints, notes, briefs, problemIds or a complexity field. The problems are around the page, and in whether the evidence it records can be trusted.

1. **Help is recorded as independence.** "Explain mistake" (an AI diagnosis) and the repair detours are never recorded as help. A checkpoint or transfer rep passed after one counts as self-corrected or independent.
2. **Pre-attempt leaks.** The More menu offers Repair Reps, Another/Easier/Harder rep and Interview follow-up before any attempt. Each one exposes the technique.
3. **Week 13 problems are used up early.** The session builders (Skills "Do reps", Today's cold reviews, repair sets) pull c13 reps, and checkpoint variants, long before Week 13. Skills sessions are named after the skill, and that name shows in the rep page breadcrumb.
4. **The transfer grade is not stable.** transferGrade grades whichever pass comes first in array order. That order is random UUID order, so the same history can grade yellow or red. The memorized-risk check therefore does nothing in practice.
5. **The approach note is weak.** It is one optional free-text line. It can be written after coding, it is hidden in Interview mode, and nothing ever reads it.
6. **Week 13 cannot be completed from Today.** Transfer reps weigh 2 load units, so at most 5 fit per day and Today lists at most 11 items against a target of 15. Green is unreachable in Week 13, and the Week 14 unit stays locked until all 48 transfer reps pass.
7. **Week 14 is not readiness-adaptive, and mocks are open to all.** Week 14 work is the same whatever the grade. /interview lets anyone start a mock at any time, and every mock ever completed counts toward READY.
8. **The readiness card and report ignore the transfer grade and mocks.** They contradict the InterviewCard on the same page.

Also found: a leftover check lock from the October plan blocks 601 course reps when they are opened outside a session. Reloading a rep resets its failure count, which gets around the checkpoint rule of at most two failed submissions.

**Motion:** the global reduced-motion rule is solid. But Winston bobs constantly and strolls across Run/Submit on the coding page (at 1024px and wider). He has no awareness of rest, the flame or completion. Some durations fall outside the spec bands, and reduced motion has small gaps.

**Mobile:** the sticky Run/Submit bar does not stick, because its parent panel has overflow-hidden.

**Already correct:**
- Week 13 rep page (transferWeek -> bare, rep-workspace.tsx:826-828) hides the Basics button (930), the missing-prereq warning (949), the concept guide (976), the teach brief (999), the Building toward / block-why panel (1022), the walkthrough (1045) and the Hint button (1443). The Trains chips are replaced by an 'unlabeled' note until pass (812, 1204-1217).
- All 48 c13 titles and prompts are technique-free (content.test.ts:37-38 runs patternLeaks on every gate and transfer rep). c13 reps carry no hints, notes, briefs, walkthroughs, problemIds, complexity or targetOfRep, so the header (badge 'Pattern Rep'), the h1 title, the footer LC link and the Building toward block expose nothing.
- Today in Week 13 suppresses 'Learn first' and 'Review a concept' through week.unlabeled (course-today.tsx:101, 327). Items are labeled 'Unlabeled', the unit purpose copy is neutral, and Today sessions are titled "Today's training". The Plan road map and the Problems page do not list c13 reps.
- Checkpoints: 'Show solution' is hidden (rep-workspace.tsx:1489). No Basics, concept guide or Hint button in the action bar. Gate detection covers both gate:true reps and the 63 October reps reused as variants (GATE_OF_EXERCISE). An e2e test exists (e2e/course.spec.ts:93).
- Solution reveals in Week 13 are recorded (viewSolution sets solutionViewed). masteryEvidence then classifies the pass as revealed, and a later pass as reconstructed, and transferGrade excludes both (credit.ts:51-55, readiness.ts:109). An Interview-mode AI hint goes through countHint and is classed as assisted.
- The approach note persists to study_state as approach:<id> with initial text and changed flag (approach-note.tsx:12-21).
- mockPolicy follows the spec wording (green 2/2, yellow at most 1, red 0) and depends only on the grade, never on the calendar (readiness.ts:120-124). Unit-tested in readiness.test.ts:31-39. The InterviewCard hides its mocks link when mocksAllowed is 0. finalDecision requires green plus a mock for READY.
- Mock session room: plain editor, no hints. It records interview-mode attempts with hintsUsed 0 and covers the app chrome (fixed z-40), so Winston never shows during a mock.
- Lab parts are labelled 'Part of the lab … not counted as reps' (rep-workspace.tsx:967-975), and qualifies() excludes lab reps.
- Winston stays ambient and non-instructional: aria-hidden, pointer-events none, no text. Only one Winston at a time (perch detection). Hidden below 1024px, so never over mobile Run/Submit. Hidden in print. Strolls pause when the tab is hidden. Reduced motion is honoured in JS (matchMedia) and in CSS (static frame, no transitions).
- A global prefers-reduced-motion rule zeroes every CSS transition and animation duration and delay (globals.css:945-947), with explicit disables for flame, sparks, comet and shimmer. TrainingFlame always has a text equivalent (aria-label, data-flame).
- Most micro and progress durations are inside the spec bands (rep-in 180, fade-in 180, rise-in 220, success-in 220, evidence-in 200, bar 420, bar-flame 450). Milestone flame-ignite is 600 and the spark burst 700. Easing is a consistent ease-out curve. There is no confetti per rep, and the daily celebration fires once per device per day (course-today.tsx:76-92).
- Streak: Sundays, holidays and Saturdays are skipped, so planned rest never breaks it. An unfinished today does not break it either (week-status.ts:101-110). The rest-day card shows 'streak protected'.

**Data:**

```
SIMULATIONS (throwaway scripts run from scripts/_audit_w13motion*.ts with npx tsx, then deleted; verified deleted)

A. Week 13 bank (data/exercises/course/week13.ts, section c13-transfer)
- 48 reps, all transfer:true, repType pattern. Stages: 40 'pattern', 8 'interview'. No hints, notes, briefs, walkthroughs, problemIds or complexity. All 48 have primers and an explanation.
- Reps that count as "fresh full" (stage interview or minutes >= 15): 12 = t-02, t-06, t-10, t-14, t-17, t-19, t-23, t-29, t-33, t-35, t-41, t-44.
- The 59 distinct skills across the bank were used for the leak simulations below.

B. Week 13 reps served outside Week 13 (lib/sessions.ts, lib/schedule.ts)
- Skills "Do reps" (buildSkillSession) on 2026-10-26 with no history: 48 of 59 skills give a session containing c13 reps (e.g. bfs -> c13-t-14, c13-t-03; frequency_map -> c13-t-10, c13-t-35 plus gate o2-cold-letter-counts).
- Same at Week 12, with every Week 1–12 path passed: 34 of 59.
- Cold-review picks (buildReviewSession, used for Today's "Cold rep" items):
  - No history: 26 of 59 skills pick a c13 rep; 10 of 59 pick a checkpoint variant.
  - At Week 12: 12 of 59 pick a c13 rep.
- Repair sets (buildRepairSet) at Week 12: 22 of 59 contain c13 reps.

C. transferGrade depends on array order
- Setup: 12 c13 reps, each self-corrected on 2027-01-18, then re-solved cold and fast on 2027-01-25.
- Chronological order: {grade: yellow, independent: 12, attempted: 12, freshFull: 3}.
- Same attempts with the later re-solves first in the array: {grade: red, independent: 0, freshFull: 0}.
- memorizedRisk on the chronological first pass is false, and is always false by construction. It is true on the later fast re-solve.
- Attempts load in IndexedDB key order, and attempt ids are random UUIDs.

D. A remount resets checkpoint failures
- Variant c3-g-pointer-a (gate g-pointer-mechanics, need 2).
- Row A: 2 failed submissions. Row B: a new mount on the same variant, first submit passes.
- Result: masteryEvidence(B) = cold-independent, gateClean(B) = true, and the variant counts as clean.
- For comparison, one mount with 3 failures then a pass: gateClean = false (self-corrected).

E. Week 13 day fill (lib/today-plan.ts prescribe)
- N = 15, so the load cap is round(19.5) = 20. Transfer reps weigh 2 units, so at most 5 fit per day.
- With 5 warm-up and 4 cold candidates: 11 items (3 warm, 5 transfer, 3 cold).
- With only transfer reps available: 5 items.
- Week 13 has 4 training days (MLK Day Jan 18); Week 14 has 5.
- So Today reaches at most 20 transfer reps in Week 13, and only 6 fresh-full reps among t-01..t-20. Green (freshFull >= 8) is unreachable in Week 13.
- The w14-interview unit needs all 48 transfer reps passed. Today reaches at most 45 over Weeks 13–14 without Saturdays.

F. Leftover October-plan check lock (rep-workspace.tsx:133-135)
- Learner: no October history, has passed every earlier course unit's path and checkpoints in order.
- 601 course path reps hit "Pass the <October check> first" when opened outside a session.
- Examples:
  - w1-state-while: 4 of 18 (d05-while-halve -> Dictionary check)
  - w2-hashing: 80 of 125
  - w12-matrix-tries: 41 of 41
  - w14-interview: 36 of 55

WEEK 13 RECORDING MATRIX (spec §24)
- Initial approach / chosen structure: one optional free-text field, "what structure, and why?". Not required. Editable until pass, and after pass if it was empty. `at` is overwritten on every keystroke. Hidden in Interview mode. Shown above the prompt.
- Approach changed: self-reported checkbox, shown only after a pass and only if an initial approach exists.
- Independence: masteryEvidence returns cold-independent or independent.
- Self-correction: attemptsBeforePass > 0, counted within the same mount only. Visible-test Runs are never counted.
- Help that is recorded: hints (hintsUsed) and a shown solution (solutionViewed).
- Help that is not recorded: Explain mistake (AI), Interview follow-up (AI), Repair Reps detour, Another/Easier/Harder detours, the after-2-failures repair offer.
- Who reads it: nothing reads approach:<id>. memorizedRisk is never shown anywhere.

WEEK 14 / MOCKS
- mockPolicy: green 2/2, yellow 0/1, red 0/0. Its only consumer is the InterviewCard on Today (week >= 13), which hides its "Open the mocks" link.
- /interview (nav item plus header target chip) and /interview/[mockId] have no readiness check.
- mocksDone counts distinct mocks ever completed, with no date or grade window, and feeds finalDecision.
- mocksRequired and weeks.readinessAdaptive are never read.

WINSTON TODAY
- WinstonAmbient (app/layout.tsx):
  - A fixed sprite at the bottom-right on every route except /demo. Hidden below 1024px, in print, and when a perch exists.
  - Idle bob: frames 0–4, 1000ms, steps(5), infinite.
  - Every 14–36s he strolls up to 140px left at 60px/s, linear, then goes back home.
  - Paused when the tab is hidden or reduced motion is on.
- WinstonPerch (Today footer, course and October dashboards): strolls 80–300px every 6–18s at 55px/s.
- Neither has props, text, clicks or any state input.
- Sprite: 15 frames (idle 0–4, walk 5–14). No sit, sleep or cheer frames.

MOTION DURATIONS vs spec bands (micro 150–250, progress 300–500, milestone 600–1000)
- In band:
  - Micro: rep-in 180, fade-in 180, rise-in 220, success-in 220, evidence-in 200, pp-pop 240, pp-mark 220.
  - Progress: .bar 420, .bar-flame 450.
  - Milestone: flame-ignite 600, spark-burst 700 (+0–160 delay), pp-comet 900, success-wash 600 (fade).
- Out of band:
  - --dur-fast 120 (all button and icon hover transitions)
  - pp-tip-in 140
  - pop-in 260
  - draw 320+80
  - ProgressRing 520 (V1 day view only)
  - pp-fill 560
  - celebrate-in 500, used for the "Day complete" heading and the milestone pill
  - pp-shimmer 1400
- Infinite loops:
  - wa-idle 1s (Winston, every page including /rep)
  - flame-live 2.4s (Today only)
  - pulse 1.2s (Python loading and sync dots, transient)
  - skeleton shimmer 1.2s (transient)
- Unused: @keyframes ring-sweep.
- Reduced motion:
  - globals.css:945-947 zeroes every CSS animation and transition.
  - Flame, sparks and comet are explicitly off.
  - Winston's JS checks matchMedia.
  - Gaps: basics-panel smooth scrollIntoView (x3); pp-toast ends at opacity 0 and is never seen; spark spans stay as static dots.

MOBILE
- Winston ambient is hidden below 1024px.
- The rep action bar and success bar use max-lg:sticky, but sit inside .panel with overflow-hidden, so they do not stick.
- The confidence rating is hidden below xl (1280px).
- The header nav is a horizontally scrolling strip; "Interview" is last.
```

### 1. [CRITICAL] AI 'Explain mistake' and repair detours are never recorded as assistance, so checkpoints clear and Week 13 transfer counts as independent after AI help — CONFIRMED (severity keep)
- Spec: §2 principles 6 & 7; §24 (record assistance / self-correction)
- Evidence: components/rep/rep-workspace.tsx:1449-1450 `{phase === 'failed' && ( <button ... onClick={explainMistake}` (no bare/checkpoint guard); rep-workspace.tsx:722 `if (a) persist({ ...a, mistakeType: d.category, mistakeNote: d.diagnosis.slice(0, 200), ... })` (hintsUsed untouched); app/api/coach/diagnose/route.ts system prompt asks for a diagnosis 'naming the exact line/construct' plus a missingPrerequisite skill; lib/course/credit.ts:56-58 `if (a.hintsUsed > 0) return 'assisted' … if (a.attemptsBeforePass > 0) return 'self-corrected'`; credit.ts:79 gateClean accepts 'self-corrected'; lib/course/readiness.ts:109 transferGrade accepts 'self-corrected'
- Detail: On a checkpoint or an unlabeled Week 13 rep, after one failed submit the learner can press 'Explain mistake'. The AI coach names the faulty construct and the missing prerequisite skill, and its 'Repair Reps · pattern' button gives more. Only mistakeType and mistakeNote are stored. On the next pass masteryEvidence returns 'self-corrected'. gateClean then counts the variant as clean, and transferGrade counts the problem as independent transfer, which also gates mocks. The repair offer after two failures (planRepair, 1114-1132), which names the skill and runs repair reps, is not recorded either. This is help passing as independence, and it lets checkpoints clear with coaching.
- Suggested fix: Treat a diagnosis as help. Set hintsUsed += 1, or add an `aiAssisted` flag, in explainMistake, followUp and startPlannedRepair. Have masteryEvidence return 'assisted' when a.mistakeType is set or the flag is true. While checkpoint or transferWeek is true, hide 'Explain mistake', or make it explicitly end the clean attempt ('opening this counts as help').
- Verifier: The claim holds once the code is traced end to end.

1. **The button is shown when help should be hidden.** In components/rep/rep-workspace.tsx:828, `const bare = interview || checkpoint || transferWeek` hides only the Hint button (`{!bare && (` at 1443). The 'Explain mistake' button at 1449 is guarded only by `{phase === 'failed' && (`, so it appears on checkpoints, unlabeled Week 13 transfer reps and in interview mode.

2. **The help is never recorded.** `explainMistake` (704-727) calls the diagnose route. That route's prompt asks for a diagnosis "naming the exact line/construct", a missingPrerequisite and repairSkills. The panel at 1131-1148 shows the diagnosis, a "Likely missing: <skill>" line and a 'Repair Reps · syntax/pattern' button. The only write is `persist({ ...a, mistakeType: d.category, mistakeNote: ... })` (722). It does not change hintsUsed or set any assistance flag. The local `assisted` flag (817) counts only hintsShown, aiHints and solutionShown, so the "You used help" nudge does not appear either.

3. **The next pass reads as independent.** In lib/course/credit.ts:56-58, masteryEvidence checks only `a.hintsUsed > 0`, then returns `'self-corrected'` when `attemptsBeforePass > 0`. gateClean (77-79) accepts self-corrected with 2 or fewer failed runs. routing.ts:87 counts any clean attempt toward clearing the gate, including one on the same variant. In readiness.ts:109, transferGrade counts self-corrected as independent transfer. That grade feeds mockPolicy (mocks allowed or required) through course-cards.tsx:139.

4. **The repair offer also appears on checkpoints and transfer reps.** It is suppressed only in interview mode or inside a repair session: `if (fails < REPAIR_AFTER || interviewMode(mode) || session?.kind === 'repair') return null` (rep-workspace.tsx:732). It names the category and focus skill and runs repair reps. Nothing about that detour is recorded on the attempt.

This violates principle 6 (assistance must not masquerade as independence) and principle 7 (gates must block). It also makes Week 13 transfer evidence, and therefore mock gating, untruthful, so critical is the right severity. Corrected: The claim is accurate. Two refinements:

(a) **The repair detour is worse than described.** `startPlannedRepair` navigates away (router.push) and later returns to /rep/<id>. That mounts a fresh workspace, so `attemptRef` starts as null and ensureAttempt (390-409) creates a new attempt with `attemptsBeforePass: 0, hintsUsed: 0`. A pass after the detour is therefore graded 'independent' or 'cold-independent', not 'self-corrected'. That pass meets gateClean and transferGrade with no failures on record. routing.ts:87 accepts it even on the same checkpoint variant. This undercuts the "different variant next" rule described at routing.ts:15-16 and the "fresh checkpoint" promise in the copy at rep-workspace.tsx:962.

(b) **The button also appears in interview mode.** 'Explain mistake' is not guarded there either, because the guard at 1449 checks only `phase === 'failed'`. The planned repair offer, by contrast, is suppressed in interview mode (732).

The fix needed:
- Hide 'Explain mistake' and the repair offer when `bare`, or record their use as assistance (for example, increment hintsUsed or add an `assisted`/`diagnosed` flag that masteryEvidence treats as 'assisted').
- Make a pass after a repair detour on a gate or transfer rep count as not clean for that variant.

### 2. [CRITICAL] Mocks are not readiness-gated on /interview, and mocks completed at any time count toward READY — CONFIRMED (severity keep)
- Spec: §2 principle 10; §25 Week 14 (Red: no mock theater); §29 'Week 14: mock gating still works'
- Evidence: components/header.tsx:21 `{ href: '/interview', label: 'Interview', … }` (always in nav); components/interview-view.tsx:41-66 lists every MOCK with `<Link href={`/interview/${m.id}`} className="btn btn-primary self-start">` (line 61) and no grade check; components/mock-session.tsx:37-41 MockSession renders any mockId with no policy check; components/course/course-cards.tsx:161 `{policy.mocksAllowed > 0 ? ( <Link href="/interview"` is the only gate; components/reps-provider.tsx:129 + lib/progress.ts:332 `const done = new Set(results.filter((r) => r.completedAt && mockIds.includes(r.mockId))…` (all-time, no date window); lib/course/readiness.ts:168 `if (grade === 'green' && notReady <= 1 && mocksDone >= 1) return 'ready'`
- Detail: In any week, and with a Red grade, the learner can click Interview in the nav, then Start, and run a full mock. The InterviewCard is advisory only, and its link also stays visible after the allowed mock has been used (yellow allows 1; mocksDone is never compared). Every mock ever completed, including October V1 mocks or a Week 2 'mock theater' run, increments program.mocks.completed. That count satisfies finalDecision's mock requirement, so the Feb 1 READY verdict can rest on a mock taken before the evidence allowed one. 'Calendar alone never unlocks mandatory mocks' holds only trivially, because mocks are never mandatory at all.
- Suggested fix: Compute transferGrade and mockPolicy in a shared hook used by InterviewView and MockSession. Disable Start and redirect when mocksAllowed minus mocks done since the grade allowed them is 0 or less, and show policy.note. Count toward finalDecision and readiness only mocks completed on or after the date the grade permitted them. Add an e2e test: red grade means /interview/mock-1 cannot start, and green allows 2.
- Verifier: The core claim holds. Nothing gates a mock by readiness. app/interview/page.tsx and app/interview/[mockId]/page.tsx render InterviewView and MockSession with no policy check. The header always shows /interview (components/header.tsx:21). interview-view.tsx:41-63 maps every MOCK to a `<Link href={`/interview/${m.id}`}>` Start / 'Run it again' button with no grade check. MockSession (mock-session.tsx:37-41) only checks that the mock id exists. The only gate is the advisory link in InterviewCard (course-cards.tsx:161, `policy.mocksAllowed > 0`), and it never compares mocksDone with mocksAllowed. mockPolicy (readiness.ts:120-124) is called only from course-cards.tsx. program.mocks (reps-provider.tsx:126-131 -> progress.ts:331-334) counts completed results with no date or week window, and finalDecision (readiness.ts:168) accepts `mocksDone >= 1` for 'ready'. So a mock taken in a Red week, or before Week 14, still meets the READY mock requirement. Principle 10 is non-negotiable, so critical is the right severity. Two details are wrong. (1) mocks.completed counts DISTINCT mock ids, so its maximum is MOCKS.length = 2. It is not 'every mock ever completed'; re-running a mock does not raise it. (2) 'Mocks are never mandatory' is false. Road to Ready's final stage, 'Interview Execution' (data/program.ts:118 `requiresMocks: true`), is complete only when `mocks.completed >= mocks.total` (lib/progress.ts:356). The program stage therefore requires both mocks whatever the transfer grade, even Red. That is a second violation of §25 ('Do not let calendar alone unlock mandatory mocks' / Red: no mock theater), not a trivial pass. Corrected: Mocks are not readiness-gated anywhere. /interview is always in the nav (header.tsx:21). Every mock has a Start / 'Run it again' link with no grade check (interview-view.tsx:61). /interview/[mockId] renders MockSession with only an existence check (mock-session.tsx:38-40). mockPolicy is used only for the advisory InterviewCard link (course-cards.tsx:161), and that link stays visible after the allowed number of mocks is used, because mocksDone is never compared with mocksAllowed. program.mocks.completed is the number of DISTINCT mocks ever completed (maximum 2), with no date or week window (progress.ts:332). finalDecision accepts it for READY at mocksDone >= 1 (readiness.ts:168), so a mock run in a Red week or before Week 14 counts. Mocks are also mandatory in one place, regardless of grade: Road to Ready's 'Interview Execution' stage (data/program.ts:118, requiresMocks: true) is complete only when both mocks are done (progress.ts:356). That stage-level requirement ignores the Red/Yellow policy (Red: 0 mocks, Yellow: at most 1), which also violates §25.

### 3. [CRITICAL] Week 13 Today cannot fill its 15-rep contract: transfer reps weigh 2 load units, so at most 5 fit per day; green is unreachable in Week 13 and the Week 14 unit stays locked — CONFIRMED (severity keep)
- Spec: §7 daily contract; §8 curriculum math; §24/§25; §29 Week 13/14; principle 13
- Evidence: lib/today-plan.ts:67 `LOAD_HEADROOM = 1.3`, :80-81 `case 'transfer': return 2`, :120 `const fits = (c) => count < N && (c.units <= 1 || load + c.units + (N - count - 1) <= maxLoad) …`, :171 `if (e.transfer) return 2`; data/course/units.ts:562-565 w13 `sections: ['c13-transfer'], gateIds: []`, :576 w14 `prerequisites: ['w13-transfer']`; lib/course/routing.ts:154 `const ready = liveGates.length ? gatesCleared : pathDone`; lib/course/readiness.ts:111,115 freshFull >= 8 for green; components/course/course-today.tsx:209 CTA only `{!complete && next && (`
- Detail: Simulated with prescribe(): N=15 gives a load cap of 20. Transfer reps weigh 2 units, so after 5 the formula 2k+2+(15-k-1) exceeds 20. With warm-up and cold candidates Today lists 11 items (3 warm, 5 transfer, 3 cold); with only transfer reps, 5. Re-prescribing after they are done adds nothing. Once those items are done, `next` is undefined, so there is no CTA and the learner sits at 11/15. The day never completes, the flame never blazes, the streak resets, and Week 13 (4 training days, target 60) ends off track for a learner who followed Today exactly. Only t-01..t-20 are reached in Week 13, and they include only 6 fresh-full reps (t-02, 06, 10, 14, 17, 19). Green needs freshFull >= 8, so it is impossible in Week 13 (at most 7 with the optional Saturday). w14-interview unlocks only when all 48 transfer reps pass, but Today reaches at most 45 over Weeks 13–14, so the 'timed singles' week opens late in Week 14 or never. This overlaps the §8 workload audit but is Week 13-specific.
- Suggested fix: Weight unlabeled transfer reps as 1 unit in phase 'interview', or raise LOAD_HEADROOM for Weeks 13–14, so 15 items fit. Alternatively size the Week 13 contract to the load and say so. Unlock w14-interview from the transfer grade (green, or yellow after N attempts), not from all 48 passing. Interleave the 12 fresh-full reps early in c13 order. Add a test: a Week 13 day prescribes exactly dailyTarget items and can be completed.
- Verifier: I read the code paths and ran a throwaway prescribe() simulation (scripts/_audit_w13.ts, now deleted). The core claim holds.

1. Load cap. In lib/today-plan.ts:70 the cap is `loadLimit = Math.round(reps * LOAD_HEADROOM)`, which gives round(19.5) = 20 for N=15. The `fits` check at :120 is `load + c.units + (N - count - 1) <= maxLoad`. With w light reps and t transfer reps already taken, this reduces to t + 16 <= 20, so a 6th transfer rep never fits, whatever order the reps are taken in.

2. Week 13 has only heavy reps. All 48 reps in data/exercises/course/week13.ts are `transfer: true` (`const transfer = { transfer: true, repType: 'pattern' }`), so repUnits gives 2 for each (verified: the set of unit values is {2}). In components/use-today-plan.ts:50 `if (e.transfer) return 'transfer'`, and COURSE_KIND maps transfer to transfer, so these reps get units 2 and kind 'transfer'. They are core, so the 30% checks cap does not apply, but the load cap does.

3. Nothing light can fill the queue. In lib/course/routing.ts courseQueue uses `horizon = frontier.week + 1`, and w14 is `locked`, since its prerequisite `w13-transfer` is not ready (`ready = liveGates.length ? gatesCleared : pathDone`, and pathDone needs all 48 passed). So in Week 13 the queue holds only transfer reps, plus any LC targets, which weigh 3 and are heavier still.

4. Simulation results:
   - With 4 warm and 4 cold candidates: 11 items (warm×3, transfer×5, cold×3).
   - After marking those done and prescribing again: 0 new items, repsDone=11, complete=false.
   - With transfer reps only: 5 items.
   - dailyTarget(13) is 15.

5. UI. components/course/course-today.tsx:68-70 sets `complete = done >= target` and `next = left[0]`. The CTA at :209 is `{!complete && next && (`, and the Bonus/optional links (:323-336) render only inside `{complete && (`. So once the 11 items are done, Today offers nothing more.

6. Readiness. transferGrade (lib/course/readiness.ts:115) requires `attempted >= 10 && rate >= 0.7 && freshFull >= 8` for green. FreshFull reps (stage interview or minutes >= 15) are c13-t-02, 06, 10, 14, 17, 19, 23, 29, 33, 35, 41, 44. At 5 a day over 4 training days, Today reaches t-01..t-20, which holds 6 of them. An optional Saturday (5 more, reaching t-25) adds t-23 for 7. So green cannot be reached in Week 13 through Today.

Corrections:
(a) "The day never completes" holds only for a learner who stays on Today. Credit (lib/course/credit.ts `qualifies`) counts any qualifying rep, so reps done from the course or unit pages would still fill 15. The real defect is that Today stops at 11/15 with no CTA and no way forward, even though the comment in prescribe() promises "the day can always be finished".
(b) "At most 45 over Weeks 13–14" assumes no Saturdays. With both optional Saturdays it is up to 55, so all 48 could be passed by about the Week 14 Saturday. w14-interview therefore opens at the very end of Week 14 at best, and with no Saturdays it does not open in Week 14 at all. The conclusion (timed singles open late or never) still holds.
(c) The exact number of Week 13 training days (4) depends on the holiday calendar. I did not fully confirm the Jan 18 holiday, but it does not change the per-day cap of 5 transfer reps.

Severity: critical stands. The 15-a-day contract cannot be filled through Today for the whole of Week 13, and the streak and flame logic will report a shortfall for a learner who did everything Today offered, which makes the product untruthful. Corrected: Confirmed with one qualification. With N=15 the load cap is 20, and every Week 13 rep weighs 2, so prescribe() fits at most 5 transfer reps a day (t+16 <= 20). Because w14 stays locked until all 48 transfer reps pass, the queue holds nothing lighter. Today therefore lists at most 11 items (3 warm-ups, 5 transfer, 3 cold), or 5 if there are no warm-up or cold candidates, and prescribing again after those are done adds nothing. Since `next` is then undefined and the Bonus links render only when complete, Today offers no next step at 11/15. The learner can only reach 15 by doing reps outside Today, which credit still counts. So the claim "the day never completes" is literally true only for a learner who follows Today. Today reaches only t-01..t-20 in Week 13 (6 freshFull), or t-25 with Saturday (7), so green (freshFull >= 8) cannot be reached in Week 13 through Today. Over Weeks 13–14 Today reaches 45 transfer reps without Saturdays, or up to 55 with both, so w14-interview opens at the very end of Week 14 at best and never inside Week 14 without Saturday work.

### 4. [MAJOR] Week 13 problems (and checkpoint variants) are served before Week 13 by Skills 'Do reps', Today's cold reviews and repair sets, in sessions named after the skill — CONFIRMED (severity keep)
- Spec: §24 Week 13 transfer safeguards; §29 'Week 13: no technique leakage'
- Evidence: lib/sessions.ts:52 `const usable = (e) => … && (DAY_OF_EXERCISE[e.id] ?? today) <= today …` and :86 (same filter in buildSkillSession); lib/schedule.ts:167 `(exerciseDay[e.id] ?? today) <= today` in buildReviewSession; components/use-today-plan.ts:79 `const cold = buildReviewSession(dueReviews(reviews), ALL_EXERCISES, DAY_OF_EXERCISE, …)`; components/skill-detail.tsx:34 `createSession(repo, 'weakest', `${skill.name} reps`, ids)`; components/rep/rep-workspace.tsx:833 `const crumbTitle = session ? session.title : …`
- Detail: Course reps have no October-plan day, so `DAY_OF_EXERCISE[id] ?? today` admits every c13 rep, and every gate variant, on any date. Simulated on 2026-10-26 with no history: Skills 'Do reps' includes c13 reps for 48 of 59 skills (e.g. bfs gives c13-t-14 and c13-t-03), and cold-review picks are c13 reps for 26 of 59 skills and gate variants for 10. At Week 12, with every earlier path passed, the figures are 34/59 (Skills), 12/59 (cold review) and 22/59 (repair sets). Opening a c13 rep from Skills shows the breadcrumb '<Skill name> reps', which names the technique before the attempt. Whatever the context, the bank is used up weeks early, so the 'first' pass transferGrade grades happened in a labelled context, not in Week 13. A gate variant passed in such a session also counts toward its checkpoint (gateStatus counts any attempt on a pool rep).
- Suggested fix: Add a shared `practicePool` filter that excludes reps where UNIT_OF_EXERCISE is w13-transfer (unless the course week is 13 or later and the rep was already attempted), gate pool reps (GATE_OF_EXERCISE) and lab reps. Use it in buildSkillSession, buildRepairSet and buildReviewSession. Never put c13 reps into sessions titled after a skill.
- Verifier: I checked the claim against the code and it holds. DAY_OF_EXERCISE (data/curriculum.ts:268) is built only from DAYS. COURSE_SECTIONS reps, which include all 48 c13-t-* reps in data/exercises/course/week13.ts, are added to ALL_EXERCISES at curriculum.ts:229 but never to DAYS. A throwaway script confirmed that none of the c13 reps has a DAY_OF_EXERCISE entry. So the date filter `(DAY_OF_EXERCISE[e.id] ?? today) <= today` lets them through on any date. That filter appears in buildRepairSet (lib/sessions.ts:52), buildSkillSession (lib/sessions.ts:86) and buildReviewSession (lib/schedule.ts:167). None of those functions excludes `ex.transfer` or the w13-transfer unit.

I reran the simulation for 2026-10-26 with no history. Skills 'Do reps' (buildSkillSession with limit 6) returned at least one c13 rep for 48 skills, for example set_membership gave c13-t-19 and c13-t-23. A cold review of a single due skill picked a c13 rep for 26 skills. Both numbers match the claim. The denominator does not: SKILLS has 108 entries, not 59, so the claim's '59' must be some subset.

The label leak is real. skill-detail.tsx:34 names the session `${skill.name} reps`. rep-workspace.tsx:833 sets `crumbTitle = session ? session.title : …`, and that crumb is not suppressed when `transferWeek`/`unlabeled` is true (lines 812/826). The pre-gate lock (rep-workspace.tsx:133-134) only applies to DAYS-scheduled reps outside a session, so it does not protect these reps.

gateStatus (lib/course/routing.ts:83) counts any attempt whose exerciseId is in gate.pool, whatever the session context. So a variant passed cleanly in a Skills or review session does count toward its checkpoint.

I did not separately recompute the Week 12 figures (34/22/12) or the gate-variant count of 10. The mechanism behind them is confirmed.

Severity stays major, since this is a §24/§29 Week 13 requirement failure. The in-workspace hiding (unlabeled/bare) still applies, so the only direct label leak is the session breadcrumb. Corrected: The claim is accurate. One correction: the repo has 108 skills (SKILLS.length), so the counts should read 48 of 108 skills for Skills 'Do reps' with c13 reps and 26 of 108 for cold review on 2026-10-26, not 'of 59', unless 59 means a specific subset of skills.

Root cause: DAY_OF_EXERCISE (data/curriculum.ts:268) covers only DAYS, while course reps come in through COURSE_SECTIONS (curriculum.ts:229). That gives every c13 rep `?? today` in lib/sessions.ts:52, :86 and lib/schedule.ts:167, and none of those filters checks `ex.transfer` or UNIT_OF_EXERCISE === 'w13-transfer'.

The workspace does hide the skill label, hints and lesson links for transfer reps (rep-workspace.tsx:812-828). The leak is the session breadcrumb (`crumbTitle = session.title`, rep-workspace.tsx:833), which shows '<Skill> reps' from skill-detail.tsx:34. In any context, serving the reps early uses up the bank before Week 13. gateStatus (lib/course/routing.ts:83) credits pool attempts from any session.

I did not independently verify the Week 12 figures (34/22/12) or the count of 10 gate variants.

### 5. [MAJOR] Week 13 'More actions' menu offers pre-attempt technique leaks: Repair Reps, Another/Easier/Harder rep, Interview follow-up — CONFIRMED (severity keep)
- Spec: §24 (hide pattern, skill labels, concept hints before attempt; record assistance)
- Evidence: components/rep/rep-workspace.tsx:1460-1491 menu rendered regardless of bare; :1481 `<MenuItem onClick={startRepair}>Repair Reps</MenuItem>` and :764 `const weakest = [...ex.skills, ...ex.prerequisites]…` then buildRepairSet; :1471-1479 Another/Easier/Harder, which call :687 `skills: ex.skills.slice(0, 4)`; :1482 `(ex.repType === 'capstone' || ex.repType === 'pattern' || …) && ex.kind === 'code'` gives Interview follow-up via :779 `requestFollowUp({ title, prompt, code })`; the generated rep's page shows :938 `title={`The basics behind this rep: ${primers.map((x) => x.title).join(', ')}…`}` and components/concept-guide.tsx:117 `{concept.title}`
- Detail: Before any attempt on a c13 rep, three items leak:
- **Repair Reps** opens a session of reps on the rep's own skills. Those pages show Trains chips and concept guides, and the session returns to the transfer rep.
- **Another / Easier / Harder rep** generates a 'pattern' rep (transfer:true). It is not in the w13 unit, so its page is not bare: the Basics tooltip lists the primer titles, the collapsed concept guide shows the concept name, and the generator's hints are available.
- **Interview follow-up** asks the AI for questions about the problem.

None of these touches the transfer rep's attempt, so a later pass is still 'independent'. The same detours are open on checkpoints (Another rep / Repair Reps right before a cold variant).
- Suggested fix: While transferWeek or checkpoint is true, show only 'Show solution (counts as help)' and 'Skip for now' in the menu until the rep is passed or abandoned. If a detour must stay, call ensureAttempt() first and mark the attempt assisted. Pass `hidePattern: true` and the w13 context to generated reps so their pages are bare too.
- Verifier: I checked the claim against the code and it holds. The "More actions" menu in components/rep/rep-workspace.tsx:1459-1490 has no `bare` guard. Only the Hint button (:1443 `{!bare && (`) and Show solution (:1487 `!solutionShown && !checkpoint`) are gated. A c13 rep therefore gets the full menu before its first attempt, because :827 sets `transferWeek = UNIT_OF_EXERCISE[ex.id] === 'w13-transfer' && !passed`.

- **Another, Easier and Harder rep** (:679-701) send `skills: ex.skills.slice(0, 4)` with type 'pattern' (week13.ts:11 has `repType: 'pattern'`), which leads to lib/coach/schemas.ts:182 `transfer: true`. The generated rep is not in w13-transfer, so `bare` is false on its page. That page shows the Basics button, whose tooltip lists primer titles (:930-937), the ConceptGuide (:976 `concept && !bare`) and the Hint button. One correction: its Trains chips stay hidden, because :812 `unlabeled` is true when `ex.transfer` is set. The leak goes through Basics, the concept guide and hints, not the chips.
- **Repair Reps** (:758-776) builds a session from `[...ex.skills, ...ex.prerequisites]` (:765). Those are ordinary labelled reps, so they show Trains chips and concept guides.
- **Interview follow-up** appears because week-13 reps are repType 'pattern' with kind 'code' (:1482). It calls `requestFollowUp({ title, prompt, code })` (:779) and does not count it as help.

None of these paths changes `hintsShown` or `aiHints`, or marks the transfer rep's attempt as assisted (`assisted` at :817 counts only hints and the solution). So §24's "hide pattern, skill labels, concept hints before attempt; record assistance" is broken twice: the hiding can be bypassed in one click, and the detour is never recorded. Checkpoints are also affected, since the same menu shows Another rep and Repair Reps while the checkpoint is cold.

Related leaks the claim missed, in the same menu:
1. "Complexity" (:1489) opens a panel that shows the reference `time {ex.complexity.time} · space {ex.complexity.space}` (:1372) once the guess field has more than 3 characters. Week 13 has complexity data. That is a strong hint about the pattern before any attempt, and it is not counted as assistance.
2. "Show solution" stays available on transfer-week reps (it is hidden only for checkpoints, :1487). Viewing it does set solutionShown, so that one is recorded.

Severity stays major: it fails a V2.1 §24 requirement, but the user has to choose to open a detour. Corrected: Accurate except for one detail. The generated Another/Easier/Harder rep is created with `transfer: true` (lib/coach/schemas.ts:182), so rep-workspace.tsx:812 `unlabeled` hides its Trains chips. Its pre-attempt leaks are the Basics tooltip with primer titles (:937), the ConceptGuide (:976) and the Hint button (:1443), all shown because `bare` is false outside w13-transfer. Repair Reps sessions (:758-776) do show Trains chips and concept guides. Interview follow-up (:1482, :779) is offered because c13 reps are `repType: 'pattern'` (data/exercises/course/week13.ts:11). None of these detours is recorded as assistance on the transfer rep (`assisted` at :817 counts only hints and the solution).

Two more leaks in the same unguarded menu:
- "Complexity" (:1489, :1364-1372) shows the reference time/space complexity once the guess field has more than 3 characters. Week 13 reps have complexity data, and this is not recorded as assistance.
- "Show solution" (:1487) is hidden only on checkpoints, not on transfer-week reps. Using it is recorded through solutionShown.

The fix: gate the whole menu, or each of these items, on `!bare`. At minimum, record any use of them as assistance on the originating rep.

### 6. [MAJOR] transferGrade grades an arbitrary pass (array order), so the grade is non-deterministic and memorizedRisk is dead or inverted — CONFIRMED (severity keep)
- Spec: §24/§25 (the grade decides Week 14); §11 (later evidence semantics); principle 12
- Evidence: lib/course/readiness.ts:106 `const first = as.find((a) => a.passed && a.completedAt)`; :109 `… && !(first && memorizedRisk(first, attempts))`; :180 `const solvedBefore = attempts.some((b) => … b.passed && b.date < a.date)`; lib/storage/sync.ts:101-103 `const rows = await this.local.getAll(t) … m.set(r.id, r)` (IndexedDB key order, no sort); lib/sessions.ts:14 attempt ids are `crypto.randomUUID()`; same pattern in readiness.ts:74-79 evidenceSummary (`seen` set)
- Detail: Attempts arrive in UUID order after a reload, so 'first' is whichever pass happens to sort first. Simulated: 12 reps, each self-corrected on 01-18 and re-solved cold and fast on 01-25. Chronological order gives yellow (12/12 independent). Same data with the re-solves first gives red (0/12): the re-solve classifies as 'retrieval', which is not accepted, and memorizedRisk is true. The grade therefore flips across reloads, and it gates mocks. When 'first' really is the earliest pass, memorizedRisk can never be true, because it needs an earlier-day pass. The protection runs backwards: a c13 problem first solved in Week 5 inside a '<skill> reps' session (previous finding) is graded on that labelled pass. MEMORIZED-RISK, an evidence class in the master spec, is surfaced nowhere.
- Suggested fix: Sort each rep's attempts by completedAt or startedAt. Grade the first attempt made in a Week 13 context (course week 13 or later). Flag memorized risk when any earlier attempt on the rep exists, not just an earlier-day pass, and show it on the InterviewCard and the readiness report. Apply the same time-sorting in evidenceSummary.
- Verifier: I checked the claim against the code and it holds. In lib/course/readiness.ts:106, `as.find((a) => a.passed && a.completedAt)` takes the first passing attempt in whatever order the array happens to be in, and nothing sorts it. That array comes from InterviewCard: components/course/course-cards.tsx:139 calls transferGrade(attempts, …), which reads useReps().attempts. useReps().attempts is repo.attempts() (repository.ts:70), which is engine.all('attempts') (sync.ts:56-59), which is `[...this.data.get(table)!.values()]`, the Map in the order rows were inserted. On reload, loadCached (sync.ts:101-103) fills that Map from IndexedDB getAll. The store is keyed on 'id' (local.ts:19, keyPath: 'id'), so getAll returns rows sorted by id. Ids are crypto.randomUUID() (sessions.ts:14), so after a reload the order is random rather than chronological.

masteryEvidence (credit.ts:49-60) does look at timestamps when it decides which attempts came earlier. So when `first` happens to be the later re-solve, it is classed as 'retrieval' (cold, with an earlier clean pass), and transferGrade does not accept that (readiness.ts:109). memorizedRisk (readiness.ts:178-181) is also true for that re-solve. When `first` really is the earliest pass, memorizedRisk can never be true, because it needs a pass on an earlier date. In a chronological array the check does nothing.

I ran a simulation with the real transferGrade on 12 reps: each self-corrected on 2027-01-18 (attemptsBeforePass 2) and re-solved cold in 100s on 2027-01-25. In chronological order the result is {grade:'green', independent:12, freshFull:12}. With the re-solves first it is {grade:'red', independent:0}. The grade flips, and mockPolicy follows it.

A grep confirms that MEMORIZED-RISK (master spec line 1317) appears only inside readiness.ts. It is not surfaced in app/ or components/.

The existing test (readiness.test.ts:31-36) has only one attempt per rep, so it never exercises the ordering problem.

Severity: major is right. The grade is what decides Week 14 mocks, and it changes between reloads with identical data. Corrected: The claim is essentially right, with these corrections:
1. **Which grade the chronological order gives depends on the problems.** "Yellow" in the example only holds if the problems are short. With stage 'interview' or minutes >= 15, the same chronological data gives green (12/12 independent, freshFull 12), and the reversed order gives red. Either way the grade flips.
2. **Order is random only after a reload.** Within a session, attempts recorded live are appended in insertion order, which is roughly chronological. After a reload, loadCached in lib/storage/sync.ts rebuilds the list from IndexedDB getAll, which returns rows sorted by their UUID ids. A later pullRemote/reconcile only overwrites entries already in the Map and appends new ones, so it does not restore time order.
3. **evidenceSummary has the same flaw but a smaller effect.** At readiness.ts:74-79, the `seen` set keeps whichever pass of each exercise comes first in array order. This changes the coldIndependent, selfCorrected, assisted and reconstructed counts and can move them between categories. It does not gate mocks. Its recentAssistance value, the only one readiness() uses for the track, does not depend on order.
4. **Not verified here.** I did not check the claim about a c13 problem first solved in Week 5 inside a '<skill> reps' session. It depends on a separate finding.
5. **Suggested fix.** Before the find, sort each rep's attempts by completedAt and pick the earliest pass. memorizedRisk should then be applied to later passes, or to the latest one, rather than the earliest. The same sorting should be applied in evidenceSummary.

### 7. [MAJOR] Week 13 approach record is thin, unverifiable and unused — CONFIRMED (severity keep)
- Spec: §24 Record: initial approach, chosen structure, whether the approach changed
- Evidence: components/course/approach-note.tsx:25 single label 'Your approach, before you code: what structure, and why?'; :26 `onChange={(e) => save({ initial: e.target.value, changed: note?.changed, at: new Date().toISOString() })} … disabled={passed && Boolean(note?.initial)}`; :28 `{passed && note?.initial && (` changed checkbox; components/rep/rep-workspace.tsx:966 `{UNIT_OF_EXERCISE[ex.id] === 'w13-transfer' && !interview && <ApproachNoteField …/>}` (rendered above the prompt at :995); grep shows no reader of `approach:` outside approach-note.tsx
- Detail: Initial approach and chosen structure are merged into one optional free-text line. Nothing requires it before the first Run or Submit. It can be rewritten after failing, or written for the first time after passing, because the field is enabled after a pass when it is empty. `at` is overwritten on every keystroke, so nothing shows whether it preceded the attempt. Switching to Interview mode hides the field entirely. The field sits above the problem statement. 'Changed' is a self-reported checkbox shown only after a pass. Nothing reads approach:<id>: not transferGrade, readiness, the Week summary or Progress. Independence, self-correction and assistance are recorded only through the Attempt, and with the gaps described in the other findings.
- Suggested fix: Store {initialText, structure (enum of generic structures), firstWrittenAt, lockedAt (at the first Run or Submit), finalStructure, changed} per attempt. Require it before the first Run in Week 13, render it in every mode, and place it after the prompt and examples. Feed it to transferGrade and the readiness report, for example 'right approach first time' versus 'changed approach'.
- Verifier: I checked the claim against the code and it holds on every point. components/course/approach-note.tsx:25-26 has one free-text input labelled 'Your approach, before you code: what structure, and why?', so the initial approach and the chosen structure are a single field. Every keystroke calls `save({ initial: e.target.value, changed: note?.changed, at: new Date().toISOString() })`, which overwrites `at`. The field is disabled only when `passed && Boolean(note?.initial)`, so it can be edited freely after a failed attempt and filled in for the first time after a pass. At :28-31 the 'My approach changed while solving it' checkbox appears only after a pass, and the learner sets it themselves. components/rep/rep-workspace.tsx:966 renders the field only for `UNIT_OF_EXERCISE[ex.id] === 'w13-transfer' && !interview`, so it is gone in Interview mode. It sits above `<Markdown text={ex.prompt} />` at :995. A grep of lib, components, app, scripts and tests finds approachKey and ApproachNote only inside approach-note.tsx and that one import in rep-workspace.tsx. The only other 'approach' hits are the unrelated solve-log form. No Run or Submit handler checks for the note, and transferGrade, readiness, the summaries and Progress never read `approach:<id>`. Spec §24 (planning/REPS_2_1_SPEC.md:370) asks for a record of 'initial approach, chosen structure, whether the approach changed, independence, self-correction, assistance'. As built, the first three are an optional, editable, self-reported note that nothing reads, so the record cannot be trusted and has no effect. Major is the right severity: this is a V2.1 requirement that is materially unmet, but it does not make the product actively untruthful. Corrected: The claim is accurate as written. One clarification: the field records something, so §24 is not entirely unimplemented. It saves `{initial, changed, at}` under repo state `approach:<exerciseId>` (components/course/approach-note.tsx:12,20). The problem is how much that record can be relied on. It is optional, it can be rewritten after a failed attempt and first written after a pass, `at` changes on every keystroke, 'changed' is self-reported and appears only after a pass, it is hidden in Interview mode (rep-workspace.tsx:966), and nothing ever reads it.

### 8. [MAJOR] Readiness card and readiness report ignore the transfer grade and mocks, and contradict the InterviewCard — CONFIRMED (severity keep)
- Spec: §26 (no contradictory systems); §11 (accurate evidence language)
- Evidence: components/use-course-day.ts:40 `const ready = readiness(course.statuses, finished, ev, today)` (no `extra`); lib/course/readiness.ts:158 `const transfer = extra.transferGrade ? (… ) : week >= 13 ? 'building' : 'not-tested'`, :159 `const interview = (extra.mocksDone ?? 0) > 0 ? 'developing' : 'not-tested'`; components/course/course-cards.tsx:115-122 vs :139-152; components/course/readiness-report.tsx:53-60
- Detail: transferGrade is computed only inside the InterviewCard. On the same Today page the ReadinessCard shows 'Independent transfer: Building' while the InterviewCard shows Green, Yellow or Red. After mocks, 'Interview execution' still reads 'Not tested yet'. The /progress readiness report has the same problem. Even if wired, yellow and red would both map to 'developing'.
- Suggested fix: Compute transferGrade, and mocksDone within the allowed window, once in useCourseDay. Pass `{ transferGrade, mocksDone }` to readiness(). Render the grade, its reasons and the mock policy in both the card and the report, and keep red distinct from yellow.
- Verifier: I checked every part of the claim against the code and all of it holds. components/use-course-day.ts:40 calls `readiness(course.statuses, finished, ev, today)` without the optional `extra` argument, and no other caller of lib/course/readiness.ts readiness() exists. The other `readiness(` hits are a different function in lib/bridges.ts. Inside readiness() (lib/course/readiness.ts:158-159), `transfer` therefore always comes out as 'building' from week 13 on, or 'not-tested' before that. `interview` is always 'not-tested'. transferGrade() is called only at components/course/course-cards.tsx:139 inside InterviewCard, and the mock count (`program.mocks.completed`) is read only there. course-dashboard.tsx:72-79 renders ReadinessCard and InterviewCard together on Today from week 13. ReadinessCard (course-cards.tsx:115-122) shows 'Independent transfer: Building' and 'Interview execution: Not tested yet'. InterviewCard shows Green, Yellow or Red plus 'N done' for mocks, so the two cards contradict each other. readiness-report.tsx:53-60 renders r.transfer and r.interview from the same cd.readiness, so /progress has the same gap. Even if `extra` were passed, readiness.ts:158 maps both yellow and red to 'developing', and :159 can never produce 'ready' however many mocks are done. I found nothing that refutes the claim. Severity stays major: this materially fails the §26 rule against contradictory systems and the §11 principle on accurate evidence language. It does not falsify the core evidence. Corrected: Correct as stated, with one extra detail. transferGrade() (lib/course/readiness.ts:115) returns 'red' when no transfer problems have been attempted (`attempted >= 6 && ...` fails, so 'red'). So from day one of Week 13, before any evidence exists, InterviewCard shows 'Red' while ReadinessCard shows 'Building' for the same thing. That makes it a contradiction, and 'Red' claims more than zero evidence supports. A fix would compute transferGrade and mocksDone in useCourseDay (or pass them in) so both cards and the /progress report use one source. It would also map red and yellow to different statuses, let a green grade plus mocks reach 'ready' for interview execution, and show 'not-tested' while attempted == 0.

### 9. [MAJOR] Week 14 is not readiness-adaptive: same work for green, yellow and red; mocks never enter the day or week contract — CONFIRMED (severity keep)
- Spec: §25 Week 14 interview safeguards; master spec Week 14 green/yellow/red paths
- Evidence: lib/course/readiness.ts:121 `mocksRequired: 2` (never read anywhere); data/course/weeks.ts:60 `readinessAdaptive: n === 14 || undefined` (never read); data/course/units.ts:569-582 single w14-interview unit `sections: ['o11-speed', 'o11-debug', 'o11-cold', 'o11-mixed']`; components/course/course-cards.tsx:140-167 is the only consumer of mockPolicy
- Detail: The grade changes only one note and one link. Green does not schedule the two mocks with diagnose, repair and verify. Yellow gets no extra transfer. Red gets no 'more independent transfer and repair' and still receives the same Week 14 queue once the 48-rep bank is done. The bank of 48 is the only transfer content, so 'more transfer' has nothing to draw on.
- Suggested fix: Branch the Week 14 queue on the grade:
- **Green:** timed singles plus 2 mock items (with diagnosis and repair) inside the day and week contract.
- **Yellow:** more transfer (a reserve bank), timed singles and at most 1 mock.
- **Red:** a transfer and repair queue, no mocks.

Read weeks.readinessAdaptive and mocksRequired, and test each path.
- Verifier: I checked each part of the claim against the code and it holds.
- `mocksRequired` (lib/course/readiness.ts:121-123) is read only in lib/course/readiness.test.ts:39. No production code reads it.
- `readinessAdaptive` (data/course/weeks.ts:23 and :60) is declared and set, and nothing ever reads it.
- The w14-interview unit (data/course/units.ts:569-582) is one fixed unit for every grade: `sections: ['o11-speed','o11-debug','o11-cold','o11-mixed']`, with empty gateIds, labIds and targets.
- lib/course/routing.ts never looks at transfer grade. The only grade-related code there is the purpose label at :191 (`if (e.transfer || e.stage === 'pattern') return 'transfer'`). So the Week 14 queue is the same for green, yellow and red.
- `mockPolicy` and `transferGrade` are used in production only by InterviewCard (components/course/course-cards.tsx:136-176). There the grade changes three things: the `policy.note` text (:159), whether the 'Open the mocks' button shows (`policy.mocksAllowed > 0 ?` at :161), and the finalDecision text.
- Green gets no two scheduled mocks with diagnose, repair and verify steps. Yellow gets no extra transfer work. Red gets no additional transfer and repair work.
- The only transfer content is c13-transfer in data/exercises/course/week13.ts, which has 48 reps (c13-t-01 onward). There is no extra pool for "more transfer" to draw from.

The claim also understates the problem: the mock gating it describes is cosmetic.
- /interview is linked in the global header (components/header.tsx:21) for every user.
- InterviewView (components/interview-view.tsx) shows all MOCKS with no grade check, so a red learner can open mocks directly.
- The legacy V1 day model attaches mocks by calendar date: data/curriculum.ts:161 `mocks: modules.includes(INTERVIEW_MODULE) ? module0.mocks : undefined`, rendered in components/day-view.tsx:106-117. That is the "calendar alone" behaviour spec §25 forbids, though it is the old plan's day view, not the V2 course Today.

Rating it major is right for §25: the adaptive green, yellow and red paths that §25 requires do not exist. Corrected: The claim is accurate. Week 14 has a single unit (data/course/units.ts:569-582) and routing never reads the grade (lib/course/routing.ts), so green, yellow and red get the same queue. `mocksRequired` (lib/course/readiness.ts:121) is read only in a test, and `readinessAdaptive` (data/course/weeks.ts:60) is never read. The grade changes only InterviewCard (components/course/course-cards.tsx:139-176): the note text, whether the 'Open the mocks' button shows (`policy.mocksAllowed > 0`), and the finalDecision text.

The mock gating is also only cosmetic:
- /interview is always in the header nav (components/header.tsx:21).
- InterviewView lists every mock with no grade check.
- The legacy day model still attaches mocks to the Oct 11 interview module by date (data/curriculum.ts:161, rendered in components/day-view.tsx:109-117).

The only transfer content is the 48-rep c13-transfer bank, so there is nothing for "more transfer" to draw on.

### 10. [MAJOR] Remounting a rep starts a new attempt, so earlier failures are forgotten: a checkpoint variant failed twice and then passed counts as cold-independent — CONFIRMED (severity keep)
- Spec: §2 principles 6 & 7; §24 (self-correction)
- Evidence: components/rep/rep-workspace.tsx:389-393 `if (attemptRef.current) return attemptRef.current … id: newId()` (one row per mount); :745-747 planRepair `createSession(…, { resume: here })` returns to the same rep; lib/course/credit.ts:58 `if (a.attemptsBeforePass > 0) return 'self-corrected'` (this row only), :79 `a.attemptsBeforePass <= 2`; lib/course/routing.ts:86-89 gateStatus counts any clean row
- Detail: Verified: on c3-g-pointer-a, row A has 2 failed submits; row B is a reload or the in-page 'Do the repair reps' resume, and passes on its first submit. masteryEvidence(B) is cold-independent and gateClean(B) is true, so the variant counts toward clearing the checkpoint. In one mount, 3 failures then a pass gives gateClean false. A reload therefore gets around the 'at most two failed runs' rule and lets a learner clear the same variant they failed, while routing intends 'repair, then a different variant'. Week 13 is affected the same way: fail, take the repair offer (which names the skill), return and pass, and it records 'independent'. Visible-test Runs are never counted as failures, although credit.ts says 'failed runs'.
- Suggested fix: In masteryEvidence and gateClean, count failed attempts on the same exercise since the last clean pass: any earlier failed row makes the pass at best 'self-corrected', and gate failures accumulate across rows. After a gate failure, refuse a clean credit on the same variant until a different variant is passed.
- Verifier: I read the cited code paths and the claim holds, except for its Week 13 consequence.

1. **Each mount starts a new attempt.** `Workspace` is keyed by exercise (`rep-workspace.tsx:136`, `<Workspace key={exercise.id} …>`). `attemptRef` starts as `useRef<Attempt | null>(null)` (`:306`), and `ensureAttempt` (`:389-409`) always mints `id: newId()` with `attemptsBeforePass: 0`. Nothing reloads an unfinished attempt from history. The `fails` counter (`:349`) also starts again at 0.

2. **The planned repair brings the learner back to a fresh attempt.** `startPlannedRepair` (`:742-747`) pushes to `/rep/<repair rep>`, and the resume link `/rep/${ex.id}` comes back later. Because the key is the exercise id, the rep remounts and a new row is written.

3. **Gate variants are offered the repair.** Gate variants are `stage:'retrieval', repType:'cold'` (`data/exercises/course/gates-w3w12.ts:10`). That gives them `defaultMode` 'practice' (`:69-74`), not interview mode. So the repair offer (`:732`, `REPAIR_AFTER = 2` in `lib/session-planner.ts:292`) is shown on them.

4. **Earlier failures do not affect how the pass is classified.** `retrievalTypeFor` returns 'cold' for these variants (`lib/progress.ts:194`). `masteryEvidence` (`credit.ts:49-60`) looks at earlier rows only for reveals and clean passes, never for failures. Row B therefore gets 'cold-independent', and `gateClean` (`:78-80`, `a.attemptsBeforePass <= 2`) is true.

5. **The gate counts it.** `gateStatus` (`routing.ts:86-89`) pushes any `gateClean` row into `clean`. The 'not the one that just failed' rule (`:108`) only orders the queue. It does not stop the learner from passing the failed variant on a new row, which then counts. In a single mount, 3 failures and then a pass gives `gateClean` false, so a reload or a repair round-trip gets around the 'at most two failed runs' rule.

6. **Runs are not counted.** `onRun` (`:442-452`) never touches the attempt, so visible-test Runs never count as failures. The comment's 'failed runs' really means failed submits.

7. **Week 13 is overstated.** The pass is labelled 'independent' (or 'cold-independent' for cold reps) instead of 'self-corrected', and that does skew `evidenceSummary`. But `transferGrade` (`readiness.ts:109`) accepts 'self-corrected' on the same terms as independent, so the transfer grade itself does not change.

Major is the right severity. The checkpoint (gate) mechanism and the evidence labels report a false 'cold-independent' / 'independent' result for a variant the learner failed, but no non-negotiable is broken outright. Corrected: Confirmed for checkpoints. `Workspace` is keyed by exercise id (`components/rep/rep-workspace.tsx:136`), and `ensureAttempt` (`:389-409`) always creates a new row with `attemptsBeforePass: 0`. So a reload, or the 'Do the repair reps' round-trip (`:742-747`, which is offered on gate variants because they open in practice mode, `:69-74`, `:732`), starts a clean row. `masteryEvidence` (`lib/course/credit.ts:49-60`) ignores earlier failed rows, so on `c3-g-pointer-a` the new row is 'cold-independent'. It passes `gateClean` (`:78-80`) and counts toward clearing the checkpoint (`lib/course/routing.ts:86-89`), even though the learner failed that same variant before. This gets around the 'at most two failed runs' rule and the intended 'repair, then a different variant' path; routing only orders the queue (`:108`) and does not block the failed variant. The 'failed runs' count is really failed submits, because `onRun` (`:442-452`) never records anything.

Week 13 correction: the pass gets labelled 'independent' or 'cold-independent' instead of 'self-corrected', which inflates `coldIndependent` in `evidenceSummary` (`lib/course/readiness.ts:84`). But `transferGrade` (`readiness.ts:109`) counts 'self-corrected' the same way, so the Week 13 green, yellow or red grade is unaffected. Only the evidence breakdown is wrong.

### 11. [MAJOR] Leftover October-plan check lock blocks course reps opened outside a session (601 path reps) — CONFIRMED (severity keep)
- Spec: §2 principles 7 & 9; §3 Today command center; §27 rep workspace
- Evidence: components/rep/rep-workspace.tsx:133-135 `const lockDay = DAY_BY_DATE[DAY_OF_EXERCISE[exercise.id]]; const gate = !session && lockDay ? lockedByGate(lockDay, exercise.id, attempts) : undefined; if (gate) return <GateLock …/>`; :151 hard-coded 'Everything after it builds on dictionaries… Hints and Basics are fine.'; components/course/course-today.tsx:127 items link to `/rep/${id}` without `?s=` until Start; rep-workspace.tsx:668 `const inOrder = nextInOrder(fromId ?? ex.id)` (October-plan order)
- Detail: Simulation: a learner with no October history who passes every earlier course unit's path and checkpoints in order would still hit 'Pass the Dictionary check / Hashing check first' on 601 course path reps. That starts in Week 1 (d05-while-halve) and covers all 41 of w12-matrix-tries. This happens whenever a rep is opened outside a session: Today list links before Start, Bonus, Learn's 'Start the reps', Skills history and lab links. The lock sends the learner into October check reps that are not on the course path, and its copy says hints are fine, which contradicts V2 checkpoints. Outside a session, 'Next rep' also follows the October order, not the course queue.
- Suggested fix: Skip lockedByGate when today >= COURSE_START, so course routing alone owns locks. Derive nextHref from the course queue in course mode.
- Verifier: I checked the claim by running a simulation against the real data, and the core of it holds. The simulation used lockedByGate from lib/progress.ts:146, with DAY_BY_DATE and DAY_OF_EXERCISE from data/curriculum, the same way components/rep/rep-workspace.tsx:133-135 calls them. It walked every unit in UNITS in order, read each unit's path with unitPath(), and treated the learner as having clean passes on every earlier path rep and on the full pool of every course gate (GATES with unitId equal to the unit). No October-only history was given.

Result: the first locked rep is d05-while-halve in w1-state-while, locked behind o2-dict-revision. In total, 502 of the 885 path reps are locked when opened without a session. All 41 reps of w12-matrix-tries are locked, and so are all 36 of w14-interview. The gate shown is o2-dict-revision ('Dictionary check') through w2-improve. From there it is o2-cold (oct02 'Cold reps') for w2-hashing's 7 locked reps. From w3-running-prefix (3 reps) to the end it is d3-cold (oct03 'Cold reps').

Why it happens: gateBefore uses the October ORDER/POSITION. It finds October gate sections whose reps are not on the course path, or come later on it. Course-gate passes do not clear them.

The other points also check out:
- rep-workspace.tsx:151 is hard-coded: 'Everything after it builds on dictionaries… Hints and Basics are fine.' It appears even when the gate is a Cold reps section.
- course-today.tsx:127 hrefFor only adds ?s= when the rep is in the started session. Before Start, the list links have no session, so the lock applies.
- rep-workspace.tsx:668 uses nextInOrder (October ORDER) for 'Next rep' outside a session. Corrected: The lock leak is real, but the claim gets the numbers and gate names wrong. The code is rep-workspace.tsx:133-135, which uses lockedByGate/gateBefore over the October ORDER.

Simulation: a learner passes every earlier course path rep and every course gate pool cleanly, in course order, with no October-only history. When reps are opened without ?s=, 502 of the 885 course path reps show GateLock, not "601". It starts at d05-while-halve in w1-state-while. Every rep in w12-matrix-tries (41/41) and w14-interview (36/36) is locked.

The blocking gates are:
- 'Dictionary check' (o2-dict-revision) for w1-state-while through w2-improve.
- 'Cold reps' (o2-cold) for w2-hashing.
- 'Cold reps' (d3-cold) from w3-running-prefix onward.

There is no 'Hashing check'. The copy at :151 ('builds on dictionaries… Hints and Basics are fine') is hard-coded whichever gate it shows. Outside a session, Today list links before Start (course-today.tsx:127) and other links without a session lead to this lock. 'Next rep' follows the October nextInOrder (rep-workspace.tsx:668) instead of the course queue. Severity stays major.

### 12. [MAJOR] Winston animates on the coding page: constant idle bob and periodic strolls across the Run/Submit bar — CONFIRMED (severity keep)
- Spec: §21 (no constant bouncing, no animation that distracts during coding); §23
- Evidence: app/layout.tsx:24 `<WinstonAmbient />` on every route; components/winston-ambient.tsx:85-86 returns null only when perched or on `/demo`; :54 `const target = Math.max(EDGE, h - Math.random() * RANGE)` (RANGE 140, every 14–36 s); components/winston-ambient.css:60-61 `.wa-sprite--idle { animation: wa-idle 1000ms steps(5) infinite; }`; rep-workspace.tsx:1442 action bar reserves only `lg:pr-24` (96px)
- Detail: At 1024px and wider, on /rep, /lab, /example and /learn, Winston sits fixed at bottom-right (z-index 5) and bobs on a 1s loop forever. Every 14–36 s he walks up to 140px left, reaching about 224px from the right edge. That passes over the Submit and Run buttons, which sit about 112px from the right edge in the same 56–70px band, and he is drawn above the action bar. This is exactly the constant motion during coding the spec rules out. Reduced-motion users are protected.
- Suggested fix: In WinstonAmbient, return null (or a static frame with no strolls) when the pathname starts with /rep, /lab, /example or /interview. Replace the infinite idle loop with an occasional short bob, for example 2 cycles every 20–40 s.
- Verifier: I checked every piece of evidence in the claim, and it holds.
- app/layout.tsx mounts `<WinstonAmbient />` on every route.
- components/winston-ambient.tsx:85-86 hides him only when a `[data-winston-perch]` element exists or the path is /demo. Only the dashboard and course-dashboard render a WinstonPerch, so /rep/[id] gets the roaming corner Winston.
- He idles forever: winston-ambient.css:60-61 runs `animation: wa-idle 1000ms steps(5) infinite`.
- Every 14–36 s (`14_000 + Math.random() * 22_000`, line 67) he walks to `Math.max(EDGE, h - Math.random() * RANGE)` with RANGE = 140, then walks home on the next tick.

The geometry checks out:
- Home is left = W − 84, so he covers W−84 to W−20. At the furthest point he covers W−224 to W−160.
- He is fixed at bottom: 6px, 64px tall, so he spans 6–70px above the viewport bottom, at z-index 5.
- On lg screens the rep `<main>` is `lg:h-[calc(100dvh-56px)] lg:overflow-hidden` (rep-workspace.tsx:848), so the action bar sits on the viewport bottom.
- The action bar (rep-workspace.tsx:1442) has `lg:pr-24` and no z-index at lg (only `max-lg:z-10`). Its Run/Submit group is `ml-auto`, so its right edge is at W−96 and the buttons sit about 12–48px up.
- Result: during a stroll the sprite is drawn on top of Run/Submit, and the 1 s bob never stops while the user codes. That is the "constant bouncing / animations that distract during coding" §21 says to avoid.

Mitigations the claim leaves out:
- `pointer-events: none` (css:12), so clicks still reach the buttons.
- He is hidden below 1024px (css:100-103) and when printing.
- Wandering pauses while the tab is hidden.
- Under reduced motion both animation and transition are switched off.

The overstatement is the route list. Of the routes named, only /rep/[id] uses the edge-to-edge RepWorkspace with a bottom-pinned Run/Submit bar. /lab/[id] is a centred `max-w-[760px]` column, and per the claim /example and /learn use similar centred page layouts. On wide screens Winston bobs and strolls in the empty margin on those pages and does not cross their controls. The motion is still there, but the overlap is specific to /rep.

Severity stays major. §21 rules out exactly this behaviour on the main coding surface, but the issue is not critical: nothing becomes untruthful and the buttons stay clickable. It also sits uneasily with §23 ("stays ambient"): he does nothing tied to the training day, flame or completion, but he is not instructional either, so §23 is not clearly violated. Corrected: On screens 1024px and wider, the ambient Winston runs a 5-frame idle bob every second, forever (winston-ambient.css:60-61). Every 14–36 s he also walks up to 140px left from his home corner (winston-ambient.tsx:54, 67). This happens on every route except /demo and the two dashboards that render a WinstonPerch. On /rep/[id] the RepWorkspace main is fixed at viewport height (rep-workspace.tsx:848), so the action bar sits at the bottom. That bar reserves only `lg:pr-24` (96px) and has no z-index at lg (line 1442). The right-aligned Run/Submit group ends at W−96, and the strolling sprite (fixed at bottom 6px, 64px tall, z-index 5, reaching W−224) is drawn over those buttons. The buttons still work because the sprite has `pointer-events: none`. The idle loop never stops during coding, which §21 says to avoid. On /lab, /example and /learn the content is a centred narrow column, so Winston animates in the empty margin and overlaps nothing there. The problem is the constant motion, not the overlap. Narrow screens (<1024px) and reduced-motion users are already handled correctly.

### 13. [MAJOR] Proving reps that 'needed help twice' open the full concept guide for free, and the pass records as cold-independent — CONFIRMED (severity keep)
- Spec: §2 principle 6
- Evidence: components/rep/rep-workspace.tsx:336-337 `const relearn = … needsRelearn(ex.id, attempts)` / `const learnMode = guideMode(ex, { firstExposure: Boolean(teach) || relearn, … })`; data/concepts.ts:302 `if (opts.firstExposure) return 'learn'`, :309 `learn: { open: true, assisted: false }`; components/concept-guide.tsx:107-110 onAssisted only fires on toggle in an assisted mode
- Detail: For capstones, cold reps, transfer reps outside Week 13 and October-plan mastery checks: after hint-assisted passes on two different days, the next attempt opens with the concept guide fully expanded (mental model, core moves, usual shape), and it is not counted as help. If no hint is used, the pass is classified 'cold-independent', the strongest signal, and flows into the readiness 'Cold, independent' count.
- Suggested fix: For proving reps (guideMode would be 'prove'), set the attempt as assisted when the relearn guide is shown open. Alternatively, open it collapsed with 'Open (counts as help)'.
- Verifier: Verified end to end. components/rep/rep-workspace.tsx:336 `const relearn = useMemo(() => loaded && !teach && needsRelearn(ex.id, attempts), ...)` and :337 `guideMode(ex, { firstExposure: Boolean(teach) || relearn, interview: false })`. data/concepts.ts:302 `if (opts.firstExposure) return 'learn'` short-circuits before the `proving` check at :303, so capstone, cold, retrieval-stage, transfer and cleanPass reps all get 'learn'. GUIDE_BEHAVIOUR.learn is `{ open: true, assisted: false }` (:309). ConceptGuide (components/concept-guide.tsx:107-110) starts open and calls onAssisted only when you open it in a mode where assisted is true. So in learn mode countHint() never runs and the attempt keeps hintsUsed 0. The guide renders at rep-workspace.tsx:976-978 under `concept && !bare && learnMode !== 'hidden'`, with the label 'Needed help twice · read this first'. `bare` (:828) is `interview || checkpoint || transferWeek`, where checkpoint is `Boolean(ex.gate || gateId) && !passed` (:825) and transferWeek is `UNIT_OF_EXERCISE[ex.id] === 'w13-transfer' && !passed` (:826). That means only gate checkpoints, Week-13 transfer and interview mode are protected. Every other proving rep is exposed. needsRelearn (lib/training-state.ts:241-247) is true after passedWithHelp (`solutionViewed || hintsUsed >= 2`) on two distinct dates, with no clean pass since. In lib/course/credit.ts:48-60 masteryEvidence looks only at solutionViewed, earlier reveals, hintsUsed, retrievalType and attemptsBeforePass. The open guide is never recorded on the Attempt, so a clean pass is never marked 'assisted'. retrievalTypeFor (lib/progress.ts:192-200) returns 'cold' for cold reps and retrieval-stage reps. For any other rep it returns 'cold' once 12h or more have passed since the last attempt, which is the normal case on a later day. coldEvidence and gateClean both accept the result, and readiness.ts:84 adds it to the coldIndependent count. The finding is right and violates principle 6 (assistance masquerading as independence), so major is fair. I did not check the 'October-plan mastery checks' part. Corrected: The mechanism is confirmed, but the claim needs a few corrections. (1) Trigger: 'needed help twice' means a pass where the solution was viewed or 2+ hints were used, on two different calendar days, with no clean pass since (lib/training-state.ts:235,241-247). Any hint use is not enough. (2) Scope: gate checkpoints, Week-13 transfer reps and interview mode are excluded by `bare` (rep-workspace.tsx:825-828,976). Capstones, cold reps, retrieval-stage reps, cleanPass reps and transfer reps outside Week 13 that aren't gates all get the guide fully open, and it is not counted as help (data/concepts.ts:302,309; concept-guide.tsx:107-110). (3) Classification: the next unhinted pass is not always 'cold-independent'. masteryEvidence (lib/course/credit.ts:48-60) gives 'reconstructed' if a solution reveal hasn't yet been followed by a clean pass, which is likely here because the help days often involve solutionViewed. It gives 'retrieval' if an earlier clean pass came before the help days, 'self-corrected' if there were failed runs, and 'independent' if retrievalType isn't cold (a capstone re-opened within 12h, lib/progress.ts:197-199). Apart from 'reconstructed', every one of these counts as unassisted. 'cold-independent', 'retrieval' and 'self-corrected' pass coldEvidence (credit.ts:70-74). All four, independent included, pass gateClean (:77-80). readiness.ts:84 folds cold-independent, independent and retrieval into the 'Cold independent' count. The same unflagged-open-guide path also applies when `teach` (first exposure of a skill) is set on a proving rep. Core point stands: a pass done with the concept guide open is recorded as unassisted evidence, which violates §2 principle 6. Severity: major.

### 14. [MINOR] Outside Week 13, 'unlabeled' reps still name their technique (Basics tooltip, concept-guide title, walkthrough card) — CONFIRMED (severity keep)
- Spec: §24 consistency; lib/training-state.ts SCAFFOLDING.prove.namesTechnique=false
- Evidence: components/rep/rep-workspace.tsx:812 unlabeled = transfer|cleanPass|gate|w13|capstone but bare (828) excludes non-W13 transfer and capstones; :938 Basics `title={`The basics behind this rep: ${primers.map((x) => x.title).join(', ')}…`}`; components/concept-guide.tsx:117 collapsed header shows `{concept.title}`; rep-workspace.tsx:1059 capstone walkthrough label; footer :1206 'The skills it trains show once you pass.'
- Detail: There are 67 bridge transfer reps outside Week 13, all with primers (e.g. o2-dl-lc-group-anagrams: 'Dictionaries, Lists, Sorting and sort keys'). They show the technique before the attempt while the footer says the skills appear only after a pass. The same applies to generated 'pattern' reps reached from Week 13.
- Suggested fix: For unlabeled reps, show the Basics button without the primer-title tooltip and render the collapsed guide as 'Concept guide (counts as help)' without its title. Hide the walkthrough label until a failed attempt.
- Verifier: Confirmed in the code. In components/rep/rep-workspace.tsx:812, `unlabeled` covers transfer, cleanPass, gate, w13-transfer and capstone reps. But `bare` (line 828) is only `interview || checkpoint || transferWeek`, so transfer reps and capstones outside Week 13 are not bare. For those reps three things still show before the attempt:
(a) The Basics button, rendered when `!bare && primers.length > 0` (line 930). Its tooltip at line 938 lists the primer titles.
(b) The ConceptGuide, rendered when `concept && !bare && learnMode !== 'hidden'` (line 976). guideMode puts transfer reps and capstones in 'prove' mode (data/concepts.ts:303). That mode keeps the guide collapsed, but components/concept-guide.tsx:117 still prints `{concept.title}` in the collapsed header.
(c) The walkthrough card, rendered when `walk && !bare` (line 1040).
The footer at line 1206 still says "The skills it trains show once you pass." That contradicts SCAFFOLDING.prove.namesTechnique=false (lib/training-state.ts:163).
A throwaway script confirmed 67 transfer reps outside Week 13, and all 67 have primers and a concept. For o2-dl-lc-group-anagrams (unit w2-hashing) the primers are Dictionaries, Lists, and Sorting and sort keys, and the concept is "Dictionaries: key → value". All 25 non-gate capstones outside Week 13 also have primers.
Severity minor is right. Spec §24 is scoped to Week 13 only, and Week 13 reps are fully bare. So this is a consistency problem with the prove-state contract, not a breach of §24. Corrected: The claim is accurate, with three small corrections:
- The walkthrough label (rep-workspace.tsx:1059) shows the LeetCode problem name, e.g. "LC 3 · Longest Substring Without Repeating Characters", not a technique. It reveals the technique only indirectly, by linking the NeetCode video.
- Strictly, the Basics primer list appears only in the button's hover tooltip and in the panel once opened. The concept title, by contrast, is always visible on the collapsed Learn row ("Learn · Dictionaries: key → value").
- §24 itself is satisfied, because Week 13 reps are bare. The problem is that non-W13 transfer reps (67) and capstones (25) break SCAFFOLDING.prove.namesTechnique=false and contradict their own footer text.
I did not verify the claim about generated 'pattern' reps reached from Week 13.

### 15. [MINOR] Interview-mode toggle undermines checkpoint and Week 13 UI: Hint appears on checkpoints, and the approach note disappears — CONFIRMED (severity keep)
- Spec: §24; checkpoint banner promise
- Evidence: components/rep/rep-workspace.tsx:1480 `{interview && <MenuItem onClick={() => (setMoreOpen(false), void nextHint())}>Hint</MenuItem>}`; :961 banner 'Cold: no lesson panel, no hints, no solution.'; :966 `… && !interview && <ApproachNoteField`
- Detail: 36 gate variants have static hints, and they become reachable by switching to Interview mode. They are counted, so the gate is not cleared, but the checkpoint banner's promise is broken. On Week 13 reps, Interview mode removes the approach note, so nothing is recorded.
- Suggested fix: Hide the Hint menu item when checkpoint or transferWeek is true. Render the approach note in all modes.
- Verifier: I checked the claim against components/rep/rep-workspace.tsx and it holds up. Nothing stops the learner from switching modes: changeMode (lines 293-296) just calls setMode(m), with no check for a checkpoint or a Week 13 transfer rep. In the action bar, the Hint button is gated on `!bare` (line 1443), where `bare = interview || checkpoint || transferWeek` (line 828). The More menu instead shows `{interview && <MenuItem ...>Hint</MenuItem>}` (line 1480). That condition only looks at interview, so on a checkpoint the Hint item appears exactly when the learner switches to Interview mode. This breaks the promise in the banner at line 961: 'Cold: no lesson panel, no hints, no solution.' The hints are counted: nextHint calls countHint, which increments hintsUsed. So this is a UI-honesty gap, not a scoring leak. The solution item stays hidden on checkpoints (`!solutionShown && !checkpoint`, line 1487). The approach note is also confirmed: line 966 renders ApproachNoteField only when `!interview`. ApproachNoteField (components/course/approach-note.tsx) is the only place the Week 13 'initial approach' and 'approach changed' fields are recorded (§24 'Record: initial approach ... whether the approach changed'). In Interview mode it never renders, so nothing is captured. The claim is too narrow in two places. (1) It is not limited to the 36 gate variants that have static hints. When static hints run out or are absent, nextHint (lines 572-597) falls through to requestHint and returns an AI 'tailored hint', so every checkpoint gets a Hint in Interview mode. (2) The same menu item appears on Week 13 transfer reps in Interview mode. That breaks the §24 'before attempt, hide ... concept hints' rule as well as the checkpoint banner. Severity stays minor: the learner has to choose the mode, and any hint is counted as assistance, so the gate result stays truthful. The failure to record the approach note is the most substantive part. Corrected: Confirmed, and broader than claimed. Nothing stops a mode switch on checkpoints or Week 13 reps: changeMode at rep-workspace.tsx:293 is just `setMode(m)`. The More-menu Hint item at :1480 is gated only on `interview`, while the action-bar Hint at :1443 uses `!bare`. On any checkpoint, Interview mode therefore exposes Hint, which contradicts the banner at :961 ('no hints'). This is not limited to gate variants with static hints. nextHint (:572-597) falls back to an AI tailored hint via requestHint when static hints are empty or used up, so every checkpoint is affected. Hints are counted through countHint, which increments hintsUsed, so the gate is not falsely cleared, and Show solution stays hidden on checkpoints (:1487). The same Hint item also appears on Week 13 transfer reps in Interview mode, which breaks §24 'hide ... concept hints' before the attempt. In Interview mode, :966 (`... && !interview && <ApproachNoteField`) hides the only UI that records the §24 initial approach and the 'approach changed' flag (components/course/approach-note.tsx), so nothing is recorded for reps done in that mode. Fixes: gate the menu Hint on `interview && !checkpoint && !transferWeek` (or `!bare`), and render the approach note whatever the mode.

### 16. [MINOR] Transfer grade shows a RED verdict with zero evidence — CONFIRMED (severity keep)
- Spec: §11 (no stronger language than evidence supports); §25
- Evidence: lib/course/readiness.ts:113-115 `const attempted = byRep.size … : 'red'`; components/course/course-cards.tsx:150-152 `{GRADE[t.grade]}`
- Detail: On the first day of Week 13 (and in Week 14 if nothing was attempted) the Today InterviewCard shows a RED pill with '0 of 0'. RED is a verdict; with no attempts it is not yet a grade.
- Suggested fix: Add a 'not graded yet' state until attempted >= 6, for example 'Grade after 6 unlabeled problems'. Keep mocks closed in that state.
- Verifier: I confirmed the claim by reading the code.

- `lib/course/readiness.ts:113-115`: `const attempted = byRep.size; const rate = attempted ? independent / attempted : 0; const grade = attempted >= 10 && rate >= 0.7 && freshFull >= 8 ? 'green' : attempted >= 6 && rate >= 0.45 ? 'yellow' : 'red'`. With no transfer attempts, `attempted` is 0 and the grade is 'red'. There is no 'not-started' or 'insufficient' state, because `TransferGrade` (line 92) is only `'green' | 'yellow' | 'red'`.
- `components/course/course-dashboard.tsx:76-79` renders `InterviewCard` whenever `cd.week.number >= 13`, so it appears from the first day of Week 13, before any transfer work is possible.
- `components/course/course-cards.tsx:143`/`150-151` print the pill text "Red". Lines 153-155 add "0 of 0 unlabeled problems solved independently · 0 full problems cold".

§11 says there must be "no stronger language than the evidence supports". Giving a verdict when nothing has been attempted breaks that, and Week 13 has barely started at that point. The same branch also lumps "no evidence yet" together with "attempted 3 and failed". The failing case is the one the unit test at `readiness.test.ts:36` checks.

The claim needs two qualifications, and neither one refutes it:
1. The red pill uses neutral styling, `bg-surface-2 text-ink-2`, not an alarm colour (line 150). So the problem is the word "Red", not a red visual.
2. The behaviour that results is correct under §25. `mockPolicy('red')` gives `mocksRequired: 0`, `mocksAllowed: 0` and "No mock theatre yet: cold transfer and repair first.", so mocks stay gated.

The fault is only in the label and how it is shown. Minor severity is right. Corrected: Accurate. `transferGrade` (`lib/course/readiness.ts:113-115`) returns 'red' when `attempted === 0` because no state exists for "no evidence yet". `InterviewCard` is shown from the start of Week 13 (`course-dashboard.tsx:76`). It renders the pill text "Red" (`course-cards.tsx:143,151`) next to "0 of 0 unlabeled problems solved independently · 0 full problems cold". The pill uses neutral grey styling (`bg-surface-2 text-ink-2`), not a red colour. The mock gating that follows is correct under §25: none are required or allowed. So only the label overstates the evidence, which goes against §11's "no stronger language than the evidence supports". Suggested fix: add a 'not-yet-graded' state when `attempted` is 0, or below a minimum such as 3, and show it as "Not graded yet". Keep the red mock policy for that state.

### 17. [MINOR] Reduced-motion gaps: JS smooth scrolling, an invisible toast, and static spark dots — CONFIRMED (severity keep)
- Spec: §21 respect prefers-reduced-motion
- Evidence: components/rep/basics-panel.tsx:27, 113, 153 `scrollIntoView({ block: 'nearest', behavior: 'smooth' })`; app/globals.css:896-903 `.pp-toast { animation: pp-toast 2600ms … both }` with `100% { opacity: 0; }` plus :945-947 duration 0; globals.css:929 `.spark {… left: 50%; top: 50%; …}` and :934-937 `.spark { animation: none !important; }` with components/course/training-flame.tsx:32-43 sparks still rendered
- Detail: JS smooth scroll ignores the CSS media query. With duration 0 the toast jumps to its last keyframe (opacity 0), so reduced-motion users never see the 'Oct 12 complete…' or 'Every rep in the plan is done.' messages. Under reduced motion the five spark spans stay as a static orange dot on the flame while celebrate is true.
- Suggested fix: Use `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`. Under reduced motion, show the toast statically and remove it with JS. Don't render sparks when reduced motion is on, or set them to display: none.
- Verifier: I checked all three parts of the claim in the code, and all three are accurate.
(1) components/rep/basics-panel.tsx:27, 113 and 153 call scrollIntoView({ block: 'nearest', behavior: 'smooth' }). The file never checks matchMedia or prefers-reduced-motion. The reduced-motion block in globals.css (lines 933-947) only changes animation and transition durations. That does not affect scrolling started from JS with behavior:'smooth', and there is no scroll-behavior rule.
(2) In globals.css:896, .pp-toast uses `animation: pp-toast 2600ms ... both`, and its keyframes end at `100% { opacity: 0; }` (line 902). Under reduced motion, lines 943-947 set `animation-duration: 0ms !important`. With fill-mode `both`, the toast goes straight to its final keyframe and stays invisible. As a result, the 'Every rep in the plan is done.' message (program-progress.tsx:71) and the '<date> complete · <short>' message (line 78) are never seen. The <p> has role="status" (program-progress.tsx:144), so screen readers probably still announce the text. The failure is visual only.
(3) In globals.css:929, .spark has `position:absolute; left:50%; top:50%; width:5px; height:5px; background: var(--flame-2)`. Lines 934-937 set `animation: none !important` under reduced motion. That removes the spark-burst keyframes, so nothing fades the dots out or moves them by --dx/--dy. training-flame.tsx:32-43 still renders the five spans whenever ignite is true. course-today.tsx:162 passes ignite={celebrate}, and celebrate stays true for that mount (useMemo, lines 77-84). The five spans sit on top of each other and show as one static 5px orange dot. Because there is no translate(-50%,-50%), the dot sits slightly off-centre. This contradicts the component's own docstring ("it never animates under reduced motion"). It does not animate, but it leaves a stray dot behind.
Severity: §21 (spec line 352) says "Respect prefers-reduced-motion". These are real but cosmetic gaps that do not make the product untruthful. The toast content is a non-essential celebration, and progress is still shown in the bar, the aria-valuetext and the focus tip. Minor is correct. Corrected: The claim is accurate as stated, with two clarifications. First, the toast is visually invisible under reduced motion but keeps role="status" (components/program-progress.tsx:144), so assistive tech probably still announces it. Second, the stray spark dot is not centred on the flame: .spark has no translate(-50%,-50%), so its top-left corner sits at the centre. The dot stays for as long as course-today's `celebrate` is true for that mount (components/course/course-today.tsx:162 ignite={celebrate}).

### 18. [MINOR] Some motion durations fall outside the spec bands; ring-sweep is unused — CONFIRMED (severity keep)
- Spec: §21 micro 150–250 ms, progress 300–500 ms, milestone 600–1000 ms
- Evidence: app/globals.css:86 `--dur-fast: 120ms` (hover/focus transitions at :380, :414, :446, :469); :860 `pp-tip-in 140ms`; :671 `pop-in 260ms`; components/progress-ring.tsx:35 `stroke-dashoffset 520ms`; globals.css:732 `.pp-fill … 560ms`; :930 `.celebrate-in … 500ms` used for 'Day complete' and milestone pill (course-today.tsx:166, 204); :780 `pp-shimmer 1400ms`; :923 `@keyframes ring-sweep` never used
- Detail: Hover and focus feedback is below the micro floor. The progress rail and ring overshoot 500ms. Milestone moments ('Day complete', the 50/250… pill) use a 500ms rise, below the milestone band. The finale shimmer runs past 1000ms.
- Suggested fix: Set --dur-fast to 150ms. Bring pp-fill and the ring to 450ms or less. Add a 700ms celebrate-milestone class for 'Day complete' and the milestone pill. Cap pp-shimmer at 1000ms. Use or delete ring-sweep.
- Verifier: I checked every value the claim cites, and nearly all of it holds up. The §21 bands (planning/REPS_2_1_SPEC.md:352) are micro 150–250ms, progress 300–500ms and milestone 600–1000ms.
- app/globals.css:86 has `--dur-fast: 120ms`. It drives the hover and focus transitions at :380 (.icon-btn), :414 (.input), :446 (.seg buttons) and :469 (a.chip), so all of those sit below the 150ms floor.
- The tooltip uses `pp-tip-in 140ms` at :860 and :880, also below 150ms.
- `.pop-in` runs `260ms` (:671). It is used for the pass checkmarks in components/rep/results.tsx:28 and components/rep/rep-workspace.tsx:1385 and 1393, so it is 10ms over the micro band.
- The progress transitions overshoot 500ms: components/progress-ring.tsx:35 has `stroke-dashoffset 520ms` and globals.css:732 has `.pp-fill … transform 560ms`.
- The finale shimmer runs `pp-shimmer 1400ms` (:780, under `.pp[data-finale='true']`), which is past the 1000ms ceiling.
- `@keyframes ring-sweep` (:923) is not referenced anywhere in app/, components/ or lib/.
- `.celebrate-in` is `rise-in-soft 500ms` (:930). It is used on the 'Day complete' heading and the milestone pill.

Two parts need correcting. First, the file path is components/course/course-today.tsx:166 and :204, not components/course-today.tsx. Second, the claim that the milestone moments use only a sub-band 500ms rise overstates it. On Day complete, the same view renders TrainingFlame with `ignite={celebrate}` (course-today.tsx:161). That applies `.flame-ignite 600ms` and `.spark 700ms` (globals.css:928-929, components/course/training-flame.tsx:15 and :41), and both fall inside the milestone band. Only the text rise itself is below the band.

All of this is cosmetic and none of it affects whether the product is truthful, so minor is the right severity. Reduced motion is honoured: globals.css has a `prefers-reduced-motion` block that sets durations to 0 and hides the comet and shimmer. Corrected: Some durations do fall outside the §21 bands.
- Micro (150–250ms): the hover and focus transitions use --dur-fast at 120ms (globals.css:86, used at :380, :414, :446 and :469). The tooltip pp-tip-in is 140ms (:860, :880), also below the band. .pop-in is 260ms (:671), slightly above it.
- Progress (300–500ms): the ring is 520ms (components/progress-ring.tsx:35) and the rail .pp-fill is 560ms (globals.css:732), both above the band.
- Milestone (600–1000ms): the finale shimmer is 1400ms (:780), above the band. The .celebrate-in text rise is 500ms (:930, used at components/course/course-today.tsx:166 and :204), below it.

However, the Day-complete moment also fires flame-ignite at 600ms and sparks at 700ms (globals.css:928-929, through training-flame.tsx and course-today.tsx:161), so that milestone does have in-band motion. Only the heading and pill rise are short.

@keyframes ring-sweep (globals.css:923) is defined but never used. Reduced motion is handled correctly. Severity stays minor.

### 19. [MINOR] Flame state transitions are instant, and most milestone celebrations are not wired — CONFIRMED (severity keep)
- Spec: §20 Gamification (satisfying flame transitions; milestones)
- Evidence: components/course/training-flame.tsx:27 `<g transform={`translate(24 44) scale(${scale}) …`}>` and :28 fill swap (no transition); course-today.tsx:166 `celebrate-in` re-runs on every visit; data/course/motivation.ts:142 milestone-1 text exists but :171 `MILESTONES = [50, 250, 500, 750, 950]`; no motivate() call sites for 'gate-cleared', 'mock-complete', 'transfer-breakthrough', 'repair-success', 'streak-increment'
- Detail: UNLIT to EMBER to BURNING to BLAZE jumps size and colour with no transition. Only blaze ignites, once per device per day. 'First training day' can never fire. First clean gate, first independent Medium, first completed week, first mock and READY have no celebration, and no progress-ring fill is used in the course UI.
- Suggested fix: Animate scale with a CSS `transition: transform 400ms` on a CSS transform, and cross-fade the inner flame. Add 1 to MILESTONES, or fire 'First training day' separately. Derive first-gate, first-Medium, first-week, first-mock and READY events from attempts and show each once (localStorage flag) with flame and spark treatment.
- Verifier: I checked every part of the claim against the code, and each one holds.

Flame transitions (components/course/training-flame.tsx):
- Line 11 picks a fixed scale per state, from 0.55 to 1.
- Line 27 applies it as an SVG `transform` attribute, and line 28 swaps `fill` between `var(--line-strong)`, `url(#flame-warm)` and `url(#flame-hot)`.
- No CSS transition covers either one. Going from unlit to ember to burning jumps in size and colour.
- The only animations in globals.css are `.flame-live` (an endless flicker), `.flame-ignite` (600ms) and `.spark`.
- `ignite` is passed only from course-today.tsx:162 as `ignite={celebrate}`. `celebrate` (lines 76-92) is true only when `complete`, once per device per day, using the localStorage key `reps-celebrated:${today}`. So only the move to blaze or day-complete is celebrated.

Motivation events that are never triggered:
- Searching app/, components/ and lib/ finds no call sites for 'gate-cleared', 'mock-complete', 'transfer-breakthrough', 'repair-success', 'streak-increment', 'milestone' or 'trajectory'.
- The only events used are week-progress and ready/ready-with-gaps/not-ready (course-cards.tsx:27, :171), week-complete (readiness-report.tsx:114, shown as static report text, not a live celebration) and todayLine's day events.

Milestones:
- motivation.ts:171 sets `MILESTONES = [50, 250, 500, 750, 950]`, so the milestone===1 text 'First training day complete' at :153 is unreachable.
- The pill at course-today.tsx:203-206 shows only when `milestone && complete`. It uses `celebrate-in`, a CSS animation that plays again on every mount, so it re-animates on every visit to Today that day rather than once.

Progress ring:
- ProgressRing is imported only by the V1 components/day-view.tsx:80. The `ring-sweep` keyframe exists but nothing uses it. The course UI uses a linear bar (`.bar-flame`, width transition 450ms).

Severity: minor is reasonable against §20/§21. It is polish and celebration, and nothing makes the product untruthful. The case for raising it is that §19 explicitly requires these events to be wired in. Corrected: The claim holds. One addition: the one milestone that does fire is narrower than the claim says. It appears only on a completed training day (`milestone && complete`, course-today.tsx:203). Its `celebrate-in` animation plays again on every visit that day, unlike the flame ignite, which runs once per device per day through localStorage. Week-complete text exists, but only as static text in the readiness report (readiness-report.tsx:114), not as a celebration moment. The progress-ring component and the `ring-sweep` keyframe exist but are used only by the V1 day-view or not at all.

### 20. [MINOR] Winston has no state awareness (§23 reactions absent) — CONFIRMED (severity keep)
- Spec: §23 Winston
- Evidence: components/winston-ambient.tsx:7-12 'no awareness of progress'; components/winston-perch.tsx:6-11 'no knowledge of progress' and no props besides className; public/winston/winston-sprite.png has 15 frames (idle 0–4, walk 5–14) only
- Detail: Winston behaves the same on rest days, before the day starts, at 0/15, at blaze and at day complete. There are no sleep, sit or cheer frames to draw on.
- Suggested fix: Add a `mood` prop to WinstonPerch, computed in CourseDashboard from cd.day.type, cd.flame, `complete` and `celebrate`:
- **asleep** (rest day): frame 0, desaturated, no strolls, with a slow 'z' (static under reduced motion).
- **waking** (first Today view of a training day, flag `reps-woke:${today}`): a single 600ms hop.
- **watching** (ember or burning): stand beside the TrainingFlame facing it (--face), with stroll frequency scaled by flame.
- **cheer** (the existing `celebrate`, or week complete / gate cleared): a single 800ms double hop synced with flame-ignite.

Keep him aria-hidden, without text, and off coding routes.
- Verifier: I checked the claim against the code and it holds. components/winston-ambient.tsx takes no props. It reads only usePathname, which it uses to find a [data-winston-perch] element. Its only states are wandering and walking on random timers ('14_000 + Math.random() * 22_000'). components/winston-perch.tsx takes only `{ className = '' }`, and its call sites pass nothing else: components/dashboard.tsx:571 and components/course/course-dashboard.tsx:109 both have `<WinstonPerch className="mx-2" />`, and app/layout.tsx:24 has `<WinstonAmbient />`. Neither component reads day, flame, progress or rest-day state. public/winston/winston-sprite.png is 2880x192, which is 15 frames of 192px. components/winston-ambient.css:1-4 and its keyframes use only idle (0 to -320px, frames 0-4) and walk (-320 to -960px, frames 5-14), so there are no sleep, sit or cheer frames. Spec §23 (planning/REPS_2_1_SPEC.md:364) says he 'may wake up when the training day begins, react to the flame, celebrate major completion, rest on off days'. That wording is permissive, so the code does not meet §23, but this is polish rather than a material failure, and minor is the right severity. Already correct: Winston stays ambient and is never the instructional voice (no text, no clicks, aria-hidden), and he respects reduced motion. Small nuance: on screens narrower than 1024px the corner Winston is hidden (components/winston-ambient.css, max-width:1023px rule), so there he only appears where a perch is rendered. Corrected: The claim is accurate. WinstonAmbient (app/layout.tsx:24) and WinstonPerch (components/dashboard.tsx:571, components/course/course-dashboard.tsx:109) get no state: the perch takes only a className, and the ambient component uses only the pathname to find a perch. Their behaviour is random idle and walk loops. The sprite (2880x192, 15 frames) has only idle frames 0-4 and walk frames 5-14. The §23 reactions (wake at day start, react to the flame, celebrate completion, rest on off days) are therefore absent. Spec §23 says 'may', so this stays minor. The non-instructional, ambient part of §23 is already met.

### 21. [MINOR] Mobile: the sticky Run/Submit bar does not stick, and the confidence rating is hidden — CONFIRMED (severity keep)
- Spec: §22 mobile flow
- Evidence: components/rep/rep-workspace.tsx:1247 `className="rep-in panel flex min-h-0 flex-1 flex-col overflow-hidden"` is the parent of :1442 `max-lg:sticky max-lg:bottom-0 max-lg:z-10` (action bar) and :1382 (success bar); :1409 `hidden … xl:flex` for 'How solid?'
- Detail: position: sticky resolves against the nearest overflow-hidden ancestor, the non-scrolling panel, so on phones and tablets the Submit bar stays at the panel bottom, often off-screen below the instructions or keyboard. Confidence is never collected below 1280px.
- Suggested fix: Move the action bar out of the overflow-hidden panel on small screens (or use overflow: clip, which does not create a scroll container), or make it position: fixed below lg. Show the confidence rating at all widths.
- Verifier: I checked the code and the claim holds. In components/rep/rep-workspace.tsx:1247 the panel `rep-in panel flex min-h-0 flex-1 flex-col overflow-hidden` is the nearest ancestor of both bars. The action bar is at :1442 (`max-lg:sticky max-lg:bottom-0 max-lg:z-10`) and the success bar is at :1382. Any overflow value other than visible, hidden included, makes that ancestor the scroll container a sticky element sticks to. Below lg nothing limits the panel's height: <main> at :848 only gets `lg:h-[calc(100dvh-56px)] lg:overflow-hidden`, and the section at :1246 is `min-h-[520px] ... lg:min-h-0`. So on phones the document scrolls and the panel does not. The panel's height grows to fit its content, and the bars just sit at its bottom, so `sticky` has no effect. The .panel class in app/globals.css:238 only sets background, radius and shadow, so it doesn't change this. The 'How solid?' group at :1409 is `mr-1 hidden items-center gap-0.5 xl:flex`. It is the only UI that calls rate(n) (:1415; state at :240, persisted at :805), and a grep of app/components/lib found no other place that collects confidence. So confidence is never collected below 1280px, which also covers lg tablets and small laptops (1024–1279), not only phones. This is minor polish under §22's 'mobile flow' item. Corrected: The claim is accurate. On one point the evidence is stronger than stated: confidence is missing below xl (1280px), so it is also absent on small laptops and lg desktops (1024–1279px), not just on phones and tablets.

### 22. [MINOR] No tests cover Week 13 leakage on the rep page or Week 14 mock gating — CONFIRMED (severity keep)
- Spec: §29 'Week 13: no technique leakage', 'Week 14: mock gating still works'
- Evidence: e2e/course.spec.ts:93 only the checkpoint is cold; lib/course/content.test.ts:37-38 checks titles and prompts only; lib/course/readiness.test.ts:31-39 tests pure transferGrade/mockPolicy only
- Detail: No test opens a c13 rep, inspects its menu, breadcrumb or session sources, or tries /interview/mock-1 under a red grade. The 'cold' test does not cover Explain mistake or reload behaviour.
- Suggested fix: Add e2e tests:
- Open /rep/c13-t-03 and assert no concept-guide, Basics, Trains, walkthrough or Hint, no skill-named breadcrumb, and that the More menu lacks Repair/Another/Follow-up.
- Assert buildSkillSession and buildReviewSession never return c13 reps before Week 13.
- Assert that with a red grade /interview disables Start, and that with green two mocks are allowed and counted.

Add unit tests: transferGrade is order-independent, and a reload after failures does not give a clean gate pass.
- Verifier: I checked every *.test.ts file and both e2e specs, and the claim holds. In e2e/course.spec.ts the only test about technique leakage is the one at line 93, "a checkpoint is cold". It opens one Week 1 checkpoint (/rep/c1-g-countdown-steps) and checks that concept-guide, Hint, Basics and the "Show solution" menu item are absent and that `unlabeled` is visible. It does not open any c13 or transfer rep. It also does not check Explain mistake, the breadcrumb, session sources or what happens on reload. e2e/reps.spec.ts has no tests for /interview/mock-* or for gating.

lib/course/content.test.ts:37-38 only runs `patternLeaks` over title and prompt for `e.gate || e.transfer`. lib/course/readiness.test.ts:31-39 only tests the pure functions `transferGrade`, `mockPolicy` and `finalDecision`. In production code, `mockPolicy` is called only from components/course/course-cards.tsx:139-161, where `policy.mocksAllowed > 0` decides whether the mock link is shown. No test renders that card or opens the /interview mock route under a red grade. lib/mocks.test.ts checks only what is inside the mocks. lib/coach/coach.test.ts:159-180 checks the pedagogyProblem leak check on generated transfer reps, which is content-level, not the rep page.

So no unit or e2e test covers Week 13 leakage on the rep page or Week 14 mock gating at the route or UI level. "Minor" is right for a missing test. Corrected: The claim is correct, with one addition. There is some leak coverage at the content level beyond the title and prompt check of gate/transfer course reps in content.test.ts:37-38. lib/pedagogy.test.ts:138 and :169 also check checkpoint and pack-gate reps, and lib/coach/coach.test.ts:171-173 checks that generated transfer reps don't name their technique. But no test opens a c13 or transfer rep page. None checks its menu (Explain mistake, Show solution), breadcrumb, session sources or reload. And none checks that a red transferGrade hides or blocks /interview/mock-1. The only consumer of mockPolicy, components/course/course-cards.tsx:139-161, is never rendered by any test.
