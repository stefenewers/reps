export const meta = {
  name: 'reps-v21-curate',
  description: 'Curate each course week: a required path that fits the weekly target, a per-day schedule, and a classification of everything else',
  whenToUse: 'Phase A of the Reps V2.1 upgrade (curriculum-to-workload math)',
  phases: [
    { title: 'Curate', detail: 'one curator per week proposes path, schedule and budget' },
    { title: 'Review', detail: 'an independent reviewer checks pedagogy and arithmetic' },
    { title: 'Revise', detail: 'proposals that fail review are revised once' },
  ],
}

const REPO = '/Users/ruggudile/Desktop/Projects/reps-v21'
const INV = '/private/tmp/claude-501/-Users-ruggudile-Desktop-Projects-reps/63c3f883-21bf-4f72-bf73-894f272876ce/scratchpad/v21'

const RULES = `You are curating one week of the Reps 2.0 course (a 14-week Python interview course; learner: a new-grad SWE candidate; weak on while loops, state, pointer movement; strong on dictionaries). Repo (read only, do NOT edit anything): ${REPO}. Read ${REPO}/planning/REPS_2_1_SPEC.md §7 and §8 (the problem you are fixing), ${REPO}/REPS_2_MASTER_SPEC.md §13 (credit) and §17 (the week-by-week curriculum and its DAILY THEMES), and the week's inventory JSON (given below). The inventory lists every unit of the week: its sections and every rep in them (id, title, kind, stage, repType, minutes, skills, gateVariantOf, capstoneFor, prompt excerpt), its gates (id, need, skills, pool), labs, targets (LeetCode numbers; solvedInRepsBy = the Reps capstone rep that counts as solving it) and readinessTargets.

THE PROBLEM: today every rep in every unit section is required, so Week 1 requires ~1.5x and Week 2 ~3.5x their targets. You must CURATE.

DEFINITIONS (exact):
- weekTarget = inventory.weekTarget; dailyTarget = inventory.dailyTarget; trainingDays = inventory.trainingDays (Mon-Fri minus holidays).
- allowance = ceil(0.15 * weekTarget): reserved for warm-ups, retrieval and outside re-solves.
- gateNeeds = sum of gate.need over the week's gates whose pool reps exist (all do).
- requiredTargets = the OUTSIDE problems (LeetCode numbers) the learner must solve this week. A target whose solvedInRepsBy is a capstone rep you put in the path does NOT count again here (it is solved by the path rep). Keep requiredTargets small and only where the unit genuinely exists for that problem (the spec's "Targets" for the week; "readiness-gated" ones go to readinessTargets; Weeks 1-2 have none).
- requiredLoad = (number of path reps over all units of the week) + gateNeeds + requiredTargets.length. CONSTRAINT: requiredLoad + allowance <= weekTarget.
- Per day d (each training day): capacity_d = dailyTarget - ceil(0.15*dailyTarget) - (sum of need of gates due on d) - (number of requiredTargets due on d). The prescription takes path reps in unit order, so cumulative path capacity through day d must be >= the total path size of every unit whose gate, lab or target is due on or before d (a checkpoint can only be attempted once its unit's path is done). Every unit's path must fit within the week's cumulative capacity by the last training day.

PATH RULES:
1. The path is an ORDERED list of rep ids taken from the unit's sections (never from gate pools: reps with gateVariantOf are checkpoint variants, never path).
2. Only kinds 'code', 'output' and 'reorder' may be in the path. Exclude 'choice' (recognition never earns credit) and 'explain' (self-graded).
3. Teach before test: every skill a gate checks (gate.skills) must be produced by path reps of this week or of earlier weeks, with a first exposure (trace/output or fill) before drills/debug/combine. A path must start with the unit's teaching reps.
4. No later-week topics: a path rep must not require skills the course teaches in a later week. For reference: Week 1 state/while/loop control/running state/mutation/references/decomposition; Week 2 contracts/manual solving/testing/brute force->improve/strings basics/hashing; Week 3 two pointers/running state/prefix-suffix; Week 4 sliding window/stacks; Week 5 binary search/linked lists; Week 6 fast-slow/recursion; Week 7 trees/BST; Week 8 queue/BFS/grids/graphs; Week 9 cycles/heaps/sorting keys; Week 10 intervals; Week 11 backtracking/basic DP; Week 12 DP+greedy/matrix/tries; Week 13 transfer; Week 14 interview. If a section mixes topics (e.g. o11-edges), take only the reps that fit and say where the others belong (otherWeekReps).
5. Prefer the course's own new content (ids c1-*, c2-*, c13-*) for Weeks 1, 2 and 13; for legacy ladders keep: the first exposure of each skill, one or two drills, one debug, one combine, and the unit's Reps capstone if the unit has one. Reps already in another unit's path must not be repeated.
6. The worked-example reconstruction reps (ids containing 'rebuild') stay in the path.
7. Week 13: the path is a subset of c13-t-* (no gates, no targets). Week 14: o11-* interview reps (no choice/explain).

CLASSIFY the rest of each unit's sections (sections, not reps): every section that contributes no path rep is 'optional' (offered when ahead), 'stretch' (beyond the Feb 1 scope: e.g. tree construction, max path sum, minimum window, LIS/LCS, rotated search, advanced), or 'retrieval' (warm-ups and cold sections that are not gates). Reps of path sections not chosen for the path become REPAIR INVENTORY automatically (do not list them).

SCHEDULE: for each training day give focusUnits (the unit(s) being taught that day, in order), gatesDue, labsDue (every non-optional lab of the week exactly once; at most one lab per day where possible; a lab is due no earlier than the day its unit starts), targetsDue (every requiredTarget exactly once, on or after its unit's gate day). Every gate of the week exactly once. Follow the spec's daily themes where the arithmetic allows; say where you deviate and why.

Show your arithmetic in 'budget' and 'days'. Be exact: count ids.`

const PLAN = {
  type: 'object',
  properties: {
    week: { type: 'number' },
    units: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          unitId: { type: 'string' },
          path: { type: 'array', items: { type: 'string' } },
          pathRationale: { type: 'string' },
          optionalSections: { type: 'array', items: { type: 'string' } },
          stretchSections: { type: 'array', items: { type: 'string' } },
          retrievalSections: { type: 'array', items: { type: 'string' } },
          requiredTargets: { type: 'array', items: { type: 'number' } },
          readinessTargets: { type: 'array', items: { type: 'number' } },
          otherWeekReps: { type: 'array', items: { type: 'object', properties: { repId: { type: 'string' }, belongsToWeek: { type: 'number' }, why: { type: 'string' } }, required: ['repId', 'belongsToWeek', 'why'] } },
        },
        required: ['unitId', 'path', 'pathRationale', 'optionalSections', 'stretchSections', 'retrievalSections', 'requiredTargets', 'readinessTargets', 'otherWeekReps'],
      },
    },
    schedule: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          focusUnits: { type: 'array', items: { type: 'string' } },
          gatesDue: { type: 'array', items: { type: 'string' } },
          labsDue: { type: 'array', items: { type: 'string' } },
          targetsDue: { type: 'array', items: { type: 'number' } },
          theme: { type: 'string' },
        },
        required: ['date', 'focusUnits', 'gatesDue', 'labsDue', 'targetsDue', 'theme'],
      },
    },
    budget: {
      type: 'object',
      properties: {
        weekTarget: { type: 'number' },
        allowance: { type: 'number' },
        pathTotal: { type: 'number' },
        gateNeeds: { type: 'number' },
        requiredTargets: { type: 'number' },
        requiredLoad: { type: 'number' },
        fits: { type: 'boolean' },
      },
      required: ['weekTarget', 'allowance', 'pathTotal', 'gateNeeds', 'requiredTargets', 'requiredLoad', 'fits'],
    },
    days: { type: 'string', description: 'the per-day capacity arithmetic, one line per day' },
    deviations: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
  },
  required: ['week', 'units', 'schedule', 'budget', 'days', 'deviations', 'concerns'],
}

const REVIEW = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    violations: { type: 'array', items: { type: 'string' } },
    pedagogyNotes: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'violations', 'pedagogyNotes'],
}

const weeks = Array.from({ length: 14 }, (_, i) => i + 1)

const out = await pipeline(
  weeks,
  (w) => agent(`${RULES}\n\nYOUR WEEK: ${w}. Inventory: ${INV}/inventory-w${w}.json (also look at inventory-w${w - 1 > 0 ? w - 1 : 1}.json to know what earlier units teach). Return the plan for EVERY unit of the week.`, { label: `curate:w${w}`, phase: 'Curate', schema: PLAN }),
  (plan, w) =>
    plan &&
    agent(
      `${RULES}\n\nYou are the independent REVIEWER for Week ${w}. Inventory: ${INV}/inventory-w${w}.json. Check the proposed plan below against every rule, mechanically and pedagogically: (1) recount every path and the budget (requiredLoad + allowance <= weekTarget); (2) per-day capacity feasibility of the schedule; (3) only code/output/reorder kinds in paths; no gate variants in paths; ids exist in the inventory; no rep repeated across units; (4) teach-before-test for every gate skill (look up each path rep's skills); (5) no later-week topics in paths; (6) every gate, every non-optional lab and every required target scheduled exactly once and not before its unit's path can be complete; (7) the path still teaches the unit properly (first exposures kept, sensible order, not gutted); (8) spec daily themes followed or deviations justified. pass=false if ANY hard rule (1-6) is broken; list each violation precisely.\n\nPROPOSED PLAN:\n${JSON.stringify(plan)}`,
      { label: `review:w${w}`, phase: 'Review', schema: REVIEW },
    ).then((r) => ({ plan, review: r })),
  (pr, w) => {
    if (!pr || !pr.review || pr.review.pass) return pr && { week: w, plan: pr.plan, review: pr.review, revised: false }
    return agent(
      `${RULES}\n\nYour Week ${w} plan failed review. Inventory: ${INV}/inventory-w${w}.json. Fix EVERY violation below and return the complete corrected plan (same schema). Keep what was right.\n\nVIOLATIONS:\n${pr.review.violations.map((v) => `- ${v}`).join('\n')}\n\nPEDAGOGY NOTES:\n${pr.review.pedagogyNotes.map((v) => `- ${v}`).join('\n')}\n\nYOUR PREVIOUS PLAN:\n${JSON.stringify(pr.plan)}`,
      { label: `revise:w${w}`, phase: 'Revise', schema: PLAN },
    ).then((p) => ({ week: w, plan: p ?? pr.plan, review: pr.review, revised: Boolean(p) }))
  },
)

const done = out.filter(Boolean)
log(`${done.length} weeks curated; ${done.filter((d) => d.revised).length} revised after review`)
return done
