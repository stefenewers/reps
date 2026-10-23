export const meta = {
  name: 'reps-v21-audit',
  description: 'Audit the Reps V2 implementation against the V2.1 spec, then adversarially verify every finding',
  whenToUse: 'Before implementing the Reps V2.1 upgrade',
  phases: [
    { title: 'Audit', detail: 'nine read-only auditors, one per subsystem' },
    { title: 'Verify', detail: 'a skeptic per finding tries to refute it from the code' },
    { title: 'Critic', detail: 'what did the audit miss?' },
  ],
}

const REPO = '/Users/ruggudile/Desktop/Projects/reps'
const COMMON = `You are auditing the Reps repository at ${REPO} (Next.js 16 + TypeScript Python-interview-training app). READ ONLY: do not edit, create or delete any file in the repo, do not run git commands that change state, do not run the dev server or Playwright. You MAY run read-only commands and small throwaway scripts placed ONLY in /private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/audit/ (create it; run them with \`npx tsx <file>\` from ${REPO} — tsx resolves the @/ alias only for files inside the repo, so if you need repo imports, write the script to ${REPO}/scripts/_audit_<yourname>.ts, run it, and DELETE it immediately after). 
The spec to audit against is ${REPO}/planning/REPS_2_1_SPEC.md (read the sections named below in full). The V2 architecture is described in ${REPO}/docs/reps-2.md and the original V2 spec in ${REPO}/REPS_2_MASTER_SPEC.md.
Do not trust comments; verify behaviour by reading the code paths end to end (and computing numbers where asked).
Report concrete findings only: each with exact file paths and line numbers and a short quote of the code that shows the problem. Severity: critical = violates a non-negotiable principle or makes the product untruthful; major = materially fails a V2.1 requirement; minor = polish. Also report what is already correct (so we don't rebuild it) in "alreadyCorrect".`

const FINDINGS = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    data: { type: 'string', description: 'numbers, tables or inventories this dimension asked for, as plain text' },
    alreadyCorrect: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          specSection: { type: 'string' },
          evidence: { type: 'string', description: 'file:line references with short quotes' },
          detail: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['title', 'severity', 'specSection', 'evidence', 'detail', 'suggestedFix'],
      },
    },
  },
  required: ['summary', 'data', 'alreadyCorrect', 'findings'],
}

const VERDICT = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    severityAdjust: { type: 'string', enum: ['keep', 'raise', 'lower'] },
    reasoning: { type: 'string' },
    correctedDetail: { type: 'string', description: 'if partially right, the accurate version of the finding' },
  },
  required: ['refuted', 'severityAdjust', 'reasoning', 'correctedDetail'],
}

const DIMENSIONS = [
  {
    key: 'curriculum-math',
    prompt: `DIMENSION: curriculum-to-workload math (spec §7, §8, §29 curriculum math).
Read data/course/units.ts, data/course/gates.ts, data/course/calendar.ts, data/course/weeks.ts, data/course/index.ts, lib/course/routing.ts (unitReps, courseStatus, courseQueue) and lib/course/week-status.ts.
COMPUTE, with a throwaway script, for EVERY week 1-14: (a) the week target (weekTarget), (b) for each unit in the week: number of required path reps as routing actually treats them (unitReps: all reps of unit.sections minus gate variants), number of optional reps, number of gate clean passes needed (sum of gate.need for gates whose pool exists), number of unit.targets; (c) the total required load = path + gate needs + targets, and how it compares to the week target; (d) for Week 1 and Week 2, list each section in the unit paths with its rep count and whether it is new course content (c1-/c2-) or a legacy section. Also report how many required-path reps a learner with ZERO prior attempts would face in Weeks 1-2, versus a learner who already passed the October sprint (the routing 'focused' route drops lesson-level stages; compute both).
Also check: does anything make week completion depend on finishing the unit path? Does weekProgress know about paths at all? Is there any notion of required vs optional vs repair inventory vs retrieval vs placement vs stretch per exercise? Put the full per-week table in "data".`,
  },
  {
    key: 'completion-contract',
    prompt: `DIMENSION: the daily and weekly completion contract (spec §6, §7, §29 daily/week completion).
Read components/course/course-today.tsx, components/course/course-dashboard.tsx, components/use-course-day.ts, components/use-today-plan.ts, lib/today-plan.ts (prescribe), lib/course/week-status.ts (courseDay, weekProgress, trainingStreak, flameFor), data/course/motivation.ts (todayLine), components/course/course-cards.tsx (WeekCard), and components/course/readiness-report.tsx (week summaries).
Determine exactly when the UI says "Day complete" and when a week is considered complete/on-track. Can the day show complete while a lab, a checkpoint, a target problem or a repair is outstanding? Are labs, gates and target problems ever assigned to a DAY at all (is there any per-day schedule)? Does the streak count days whose labs/gates are pending? Does the 'Training complete'/'Day complete' message and the milestone fire on reps only? Is there a single authoritative function for day completion and week completion, or several that can disagree (list every place that decides 'complete')? Check Saturday recovery and rest handling for consistency with the contract.`,
  },
  {
    key: 'credit-outside',
    prompt: `DIMENSION: credit semantics, especially outside (LeetCode/NeetCode) problems (spec §10, §29 outside solve).
Read lib/course/credit.ts (qualifies, masteryEvidence, dailyCredits), lib/solve-log.ts (SolveResult, SolveEntry incl. 'rebuilt'), lib/course/resolves.ts, components/leetcode-list.tsx (the Unaided / Needed help buttons, what 'Needed help' records, any rebuild flow), components/solve-log-view.tsx (how 'rebuilt' is set and shown), components/use-credits.ts, and any place that counts LC solves toward the day (use-today-plan doneToday for LC entries, use-capacity useDayRecords).
Report: what result values exist; what the UI buttons write; how each result is credited by dailyCredits; whether the UI tells the learner a 'Needed help' problem is not finished while dailyCredits still credits it; whether solution-viewed is distinguishable from a small hint; whether a later rebuild from blank is recorded and credited as reconstruction; whether a later cold re-solve is distinguished as strongest evidence; whether redo items count. Also audit rep-level credit for edge cases: same-day repeats, revealed solution then later pass, gate passes, lab parts, choice reps, explain reps (does an explain rep 'pass' count?), and generated reps (gen-*).`,
  },
  {
    key: 'readiness',
    prompt: `DIMENSION: readiness evidence and labs in readiness (spec §11, §18, §26, §29 readiness).
Read lib/course/readiness.ts (evidenceSummary, transferGrade, mockPolicy, readiness, finalDecision, memorizedRisk), lib/course/credit.ts (masteryEvidence), components/course/readiness-report.tsx, components/course/course-cards.tsx (ReadinessCard, InterviewCard), components/use-course-day.ts, lib/mastery.ts (skill mastery/freshness), lib/course/labs.ts.
Report: exactly how evidenceSummary buckets evidence (does it merge independent + retrieval into 'cold independent'?); whether it uses only the FIRST passing attempt per rep (anchoring) so later stronger evidence can never upgrade; whether labs/change requests/design artifacts feed readiness at all; which readiness dimensions exist vs the spec's (Programming Foundations, Problem Solving, Core DSA, Independent Transfer, Software Building, Applied AI/FDE, Interview Execution); whether mastery and freshness are separated in any user-facing report; whether the overall track uses consistent inputs with week status (do Today/Week/Course/Readiness derive from each other or contradict?). Check finalDecision and mockPolicy logic for Week 14 gating correctness.`,
  },
  {
    key: 'routing-gates',
    prompt: `DIMENSION: routing, gates, placement, repair and the course queue (spec §2 principles 7-9, §8, §29).
Read lib/course/routing.ts in full, data/course/gates.ts, data/course/units.ts, lib/course/credit.ts (gateClean), components/use-course.ts, components/use-today-plan.ts (how course queue items become today's candidates and how many), lib/today-plan.ts (prescribe: shares, checks cap, required flag, headroom), and lib/course/routing.test.ts.
Find correctness bugs and spec gaps: Can a required gate be invisible on Today (e.g. because the queue only offers gates after the whole path, or prescribe drops them, or the 80-item slice cuts them off)? Does repair always get surfaced? Can a learner be stuck (gate with all variants failed; unit with gate whose pool is pending; prerequisite unit that is empty)? Does placement behave sensibly for Week 1 units for a learner who already passed many legacy reps (o2-loops, d05-while, d3-running-state)? Is the frontier/horizon rule sane? Do LC targets ever appear, and when? Is the 'gate-blocked' state recoverable? Any off-by-one in 'need' vs available variants? Evaluate also: the same rep appearing in two units, gate variants also listed in path sections, and the readinessTargets semantics.`,
  },
  {
    key: 'today-ux',
    prompt: `DIMENSION: Today as the daily command center (spec §3, §4, §5, §6, §30).
Read components/course/course-dashboard.tsx, components/course/course-today.tsx, components/course/course-cards.tsx, components/course/week-strip.tsx, components/course/training-flame.tsx, components/use-course-day.ts, components/leetcode-list.tsx, components/dashboard.tsx (how course mode is chosen), and the pages app/page.tsx.
Go through the 17 questions of spec §4 one by one and answer for each: does Today answer it without leaving the page? If yes cite the element; if no, say where the information lives instead (Plan, Learn, Progress, lab page...). Specifically: is the day's lab visible on Today with its status and a start action? Is today's checkpoint visible as a step (not just a row in the week card)? Is the target problem visible with its lock state? Is repair visible and prioritised? Is retrieval visible? Is there exactly one primary CTA, and is it deterministic? Are lessons/demos/worked examples shown as steps of an ordered stack? Is there any 'done for today when' contract list? Also evaluate mobile layout risks by reading the Tailwind classes (cramped rows, truncation, horizontal overflow) and hover/focus states.`,
  },
  {
    key: 'progress-plan',
    prompt: `DIMENSION: Progress and Plan pages (spec §9, §26).
Read components/progress-view.tsx in full (every section it renders and what data each uses), components/course/readiness-report.tsx, components/plan-view.tsx, components/course/road-map.tsx, app/progress/page.tsx, app/plan/page.tsx, and the libs they call (lib/progress-90.ts, lib/progress.ts, lib/program-progress if present, data/program-90day.ts).
Inventory every Progress section and classify each as V2-course-derived, legacy V1 (90-day minutes heatmap, weekly time-vs-plan, old checkpoints, old pattern readiness, old working-day streak), or mixed. Identify every place where two different models of progress are shown (e.g. two different streaks, two readiness models). For the Plan/Road map, check week state logic and whether it agrees with week status/readiness elsewhere. Recommend what to remove, what to keep as secondary telemetry, and what is missing from the spec's Progress hierarchy (course progress, weekly output, training consistency, mastery vs freshness, cold evidence categories, labs/building, readiness dimensions, actionable weak skills).`,
  },
  {
    key: 'learning-surfaces',
    prompt: `DIMENSION: the learning system and interactive demonstrations (spec §12-§17, §31).
Read components/course/lesson-body.tsx, components/course/worked-example.tsx, app/learn/page.tsx, app/learn/[id]/page.tsx, app/example/[id]/page.tsx, components/concept-guide.tsx, components/code-view.tsx, components/markdown.tsx, data/course/types.ts, data/course/lessons.ts, data/course/content/week1.ts and week2.ts (skim a lesson and a worked example), data/concepts.ts (what a concept guide contains), and components/course/lab-view.tsx. Search the codebase for any existing visualisation/animation/step-through components (grep for 'svg', 'animate', 'step', 'visual', 'trace').
Report: what fraction of the learning experience is prose + static code; whether any interactive stepping/visualisation exists; what reusable building blocks exist (CodeView with line highlighting? syntax highlighting? Markdown?); which concepts in the spec (two pointers, sliding window, binary search, linked lists, recursion, trees+BFS, graphs, backtracking, DP, heaps, intervals) have a lesson/concept page and worked example today and in which weeks; which units in Weeks 3-12 have no worked example. Propose (in suggestedFix of findings and in 'data') a concrete reusable demo architecture that fits this codebase (React 19 client components, Tailwind v4 tokens in app/globals.css, no new heavy dependencies): data model for steps/state, player controls, code highlighting, state panel, prediction prompts, reduced motion, deterministic step generators testable with node:test (tsx --test).`,
  },
  {
    key: 'workspace-safeguards',
    prompt: `DIMENSION: rep workspace, Week 13/14 safeguards, Winston, animation/motion CSS and mobile (spec §20-§25, §29 Week 13/14 and rest).
Read components/rep/rep-workspace.tsx (focus on checkpoint/bare/transferWeek/unlabeled/labOf logic, concept guide, hints, solution reveal, walkthrough, BuildingToward, title rendering), components/course/approach-note.tsx, lib/course/readiness.ts (transferGrade, mockPolicy, memorizedRisk), components/course/course-cards.tsx (InterviewCard), components/interview-view.tsx and mock components (are mocks gated by readiness anywhere in the interview page itself?), components/winston-ambient.tsx, components/winston-perch.tsx, components/winston-ambient.css, app/globals.css (keyframes, reduced-motion rules), components/course/training-flame.tsx.
Report: any path where a Week 13 rep leaks pattern/skills/lesson links/concept hints/related solved problems before attempt (titles in Today list, breadcrumbs, section names, 'Trains' chips, BuildingToward, walkthrough, Basics, concept guide, briefs, the rep page header/eyebrow, Problems page); whether approach/structure/changed/independence/self-correction/assistance are all recorded; whether the /interview page lets mocks be started regardless of readiness (and whether that matters per spec: 'Do not let calendar alone unlock mandatory mocks'); what Winston can currently do and how it could react to day start / flame / completion / rest; whether animations respect prefers-reduced-motion everywhere and whether any animation runs during coding; durations vs spec (150-250ms micro, 300-500ms progress, 600-1000ms milestone).`,
  },
]

phase('Audit')
const results = await pipeline(
  DIMENSIONS,
  (d) => agent(`${COMMON}\n\n${d.prompt}`, { label: `audit:${d.key}`, phase: 'Audit', schema: FINDINGS }),
  (res, d) => {
    if (!res) return null
    return parallel(
      res.findings.map((f, i) => () =>
        agent(
          `${COMMON}\n\nYou are a skeptical reviewer. Another auditor claims the following about the Reps repo. Try to REFUTE it by reading the cited code and anything related. If the claim is wrong, set refuted=true. If it is partly right, refuted=false and give the accurate version in correctedDetail. Judge severity against the spec section cited (critical = violates a non-negotiable principle or makes the product untruthful; major = materially fails a V2.1 requirement; minor = polish).\n\nCLAIM (${f.severity}, ${f.specSection}): ${f.title}\nEVIDENCE: ${f.evidence}\nDETAIL: ${f.detail}`,
          { label: `verify:${d.key}:${i + 1}`, phase: 'Verify', schema: VERDICT },
        ).then((v) => ({ ...f, verdict: v })),
      ),
    ).then((verified) => ({ key: d.key, summary: res.summary, data: res.data, alreadyCorrect: res.alreadyCorrect, findings: verified.filter(Boolean) }))
  },
)

const dims = results.filter(Boolean)
const confirmed = dims.flatMap((d) => d.findings.filter((f) => f.verdict && !f.verdict.refuted).map((f) => ({ dim: d.key, ...f })))
const refuted = dims.flatMap((d) => d.findings.filter((f) => f.verdict && f.verdict.refuted).map((f) => ({ dim: d.key, title: f.title, why: f.verdict.reasoning })))
log(`${confirmed.length} findings confirmed, ${refuted.length} refuted`)

phase('Critic')
const critic = await agent(
  `${COMMON}\n\nYou are the completeness critic for an audit of the Reps V2 implementation against ${REPO}/planning/REPS_2_1_SPEC.md. Read the spec in full. Below are the confirmed finding titles per dimension. Identify requirements in the spec (sections 3-29) that NO finding addresses but where the current code likely falls short, and verify each by reading the code. Return them as additional findings (same schema), plus in 'data' a checklist of every spec requirement from sections 3-29 marked COVERED-BY-FINDING / ALREADY-MET / GAP.\n\nCONFIRMED FINDINGS:\n${confirmed.map((f) => `- [${f.dim}] (${f.severity}) ${f.title}`).join('\n')}`,
  { label: 'critic', phase: 'Critic', schema: FINDINGS },
)

return { dims: dims.map((d) => ({ key: d.key, summary: d.summary, data: d.data, alreadyCorrect: d.alreadyCorrect })), confirmed, refuted, critic }
