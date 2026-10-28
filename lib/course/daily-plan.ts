import { COURSE_END, COURSE_START, dailyTarget, dayType } from '@/data/course/calendar'
import { DAY_PLAN, SCHEDULE } from '@/data/course/schedule'
import { transferGrade } from '@/lib/course/readiness'
import { UNIT_BY_ID } from '@/data/course/units'
import { createContracts, type ContractInput } from '@/lib/course/contract'
import { creditReason, dailyCredits, validAttempt } from '@/lib/course/credit'
import { courseStatus, purposeOf, unitInventory, type CourseQueueItem } from '@/lib/course/routing'

/** The course prescription shared by Today and the full-course simulation.
 * Scheduled teaching precedes its checkpoint. Due work takes precedence over
 * optional practice, and flex slots retrieve material already introduced.
 */
export function courseDailyPlan(date: string, input: ContractInput): CourseQueueItem[] {
  if (date < COURSE_START || date > COURSE_END || dayType(date) === 'rest') return []
  input = { ...input, attempts: input.attempts.filter((a) => validAttempt(a) && a.date <= date), entries: input.entries.filter((e) => e.date <= date) }
  const contract = createContracts(input).dayContract(date)
  const ctx = { ...input, today: date }
  const statuses = courseStatus(ctx)
  const introduced = new Set(
    SCHEDULE.flatMap((w) => w.days)
      .filter((d) => d.date <= date)
      .flatMap((d) => d.focusUnits)
  )
  // A checkpoint already taken (placement) opens its unit early, so the reps it routes are never hidden behind the calendar.
  for (const s of statuses) if (s.gates.some((g) => g.attempted)) introduced.add(s.unit.id)
  const done = new Set(dailyCredits(date, input.attempts, input.entries, input.exercises).map((c) => c.key))
  const passed = new Set(input.attempts.filter((a) => a.passed && a.completedAt && !a.solutionViewed).map((a) => a.exerciseId))
  const active = statuses.find((s) => !s.locked && introduced.has(s.unit.id) && s.state !== 'ready' && s.state !== 'maintenance')
  const out: CourseQueueItem[] = []
  const seen = new Set<string>()
  const add = (q: CourseQueueItem) => {
    if (!done.has(q.key) && !seen.has(q.key)) {
      seen.add(q.key)
      out.push(q)
    }
  }
  const rep = (id: string, unitId: string, required: boolean, purpose = purposeOf(input.exercises[id])) =>
    add({ key: id, exerciseId: id, unitId, required, purpose })
  for (const r of contract.repair) for (const id of r.reps) rep(id, statuses.find((s) => s.gates.some((g) => g.gate.id === r.gateId))!.unit.id, true, 'repair')
  // Pre-course evidence opens placement; progress through today's teaching does not.
  for (const s of statuses) {
    if (s.locked || s.unit.week > (active?.unit.week ?? contract.week) || !introduced.has(s.unit.id) || s.gates.some((g) => g.failed && g.repair.length))
      continue
    if (s.state === 'ready' || s.state === 'maintenance') continue
    if (s.route === 'placement') {
      for (const g of s.gates) for (const id of g.next) rep(id, s.unit.id, true, 'gate')
    } else for (const e of s.path) if (!passed.has(e.id)) rep(e.id, s.unit.id, true)
  }
  for (const g of contract.gates)
    if (g.state === 'open' && statuses.find((s) => s.unit.id === g.unitId)?.done === statuses.find((s) => s.unit.id === g.unitId)?.total)
      for (const id of g.next) rep(id, g.unitId, true, 'gate')
  for (const t of contract.targets) if (t.state === 'open') add({ key: `lc:${t.lc}:new`, lc: t.lc, unitId: t.unitId, purpose: 'problem', required: true })

  const target = contract.type === 'training' ? dailyTarget(contract.week) : Math.max(0, createContracts(input).weekContract(contract.week, date).shortfall)
  const remaining = Math.max(0, target - done.size)
  // Reserve slots for checkpoints/targets due today even while their paths are
  // still being completed. Otherwise flex practice can consume the day first.
  // A missed week can leave many locked checkpoints behind. Reserving slots
  // for all of them would leave zero room for the prerequisite that unlocks
  // any of them. Reserve only the current reachable unit's checkpoints.
  const reserved =
    contract.gates.filter((g) => g.unitId === active?.unit.id && !['cleared', 'handled'].includes(g.state)).reduce((n, g) => n + g.next.length, 0) +
    contract.targets.filter((t) => t.state === 'open').length

  const pathIds = new Set(statuses.flatMap((s) => s.path.map((e) => e.id)))
  const pathDoneToday = input.attempts.filter(
    (a) => a.date === date && pathIds.has(a.exerciseId) && creditReason(a, input.exercises[a.exerciseId], input.attempts) === 'counts'
  )
  const pathCount = new Set(pathDoneToday.map((a) => a.exerciseId)).size
  const pathSlots = Math.max(0, Math.min(remaining - reserved, target - Math.ceil(0.15 * target) - reserved - pathCount))
  const required = out.filter((q) => q.purpose === 'repair' || q.purpose === 'gate' || q.purpose === 'problem')
  const paths = out.filter((q) => !required.includes(q)).slice(0, pathSlots)
  const placementGates = required.filter((q) => q.purpose === 'gate' && statuses.some((s) => s.unit.id === q.unitId && s.route === 'placement'))
  const selected = [
    ...out.filter((q) => q.purpose === 'repair'),
    ...placementGates,
    ...paths,
    ...required.filter((q) => q.purpose !== 'repair' && !placementGates.includes(q))
  ]
  if (selected.length >= remaining) return selected

  // Optional inventory is limited to introduced units and earlier skills.
  // Due retrieval precedes fresh practice. A repeated rep needs three calendar
  // days of spacing; a first exposure is labeled practice, never cold retrieval.
  const focus = new Set(DAY_PLAN[date]?.focusUnits ?? [])
  const eligible = statuses.filter((s) => !s.locked && s.unit.week <= (active?.unit.week ?? contract.week) && introduced.has(s.unit.id))
  const ordered = [...eligible.filter((s) => focus.has(s.unit.id)), ...eligible.filter((s) => !focus.has(s.unit.id)).reverse()]
  const flex = ordered.flatMap((s) =>
    [...unitInventory(s.unit, ctx), ...(s.unit.retrieval ?? []).flatMap((id) => input.sections[id]?.exercises ?? []), ...s.path]
      .filter(
        (e) => ['code', 'output', 'reorder'].includes(e.kind) && !e.lab && !e.gate && !statuses.some((u) => u.gates.some((g) => g.gate.pool.includes(e.id)))
      )
      .map((e) => ({ key: e.id, exerciseId: e.id, unitId: s.unit.id, purpose: 'retrieve' as const, required: false }))
  )
  // Week 14 keeps weak transfer evidence in practice rather than using mocks
  // as a substitute for learning. Timed singles remain in the required path.
  const transferBank = input.sections['c13-transfer']?.exercises ?? []
  const grade = transferGrade(
    input.attempts,
    input.exercises,
    transferBank.map((e) => e.id)
  ).grade
  const transferPractice: CourseQueueItem[] =
    contract.week === 14 && active?.unit.week === 14 && grade !== 'green'
      ? transferBank
          .filter((e) => ['code', 'output', 'reorder'].includes(e.kind) && !passed.has(e.id))
          .map((e) => ({ key: e.id, exerciseId: e.id, unitId: 'w13-transfer', purpose: 'transfer', required: false }))
      : []
  const selectedKeys = new Set(selected.map((q) => q.key))
  const lastPass = new Map<string, string>()
  for (const a of input.attempts)
    if (passed.has(a.exerciseId) && a.passed && (!lastPass.has(a.exerciseId) || a.date > lastPass.get(a.exerciseId)!)) lastPass.set(a.exerciseId, a.date)
  const due = flex
    .filter((q) => lastPass.has(q.key) && Date.parse(date) - Date.parse(lastPass.get(q.key)!) >= 3 * 86_400_000)
    .sort((a, b) => lastPass.get(a.key)!.localeCompare(lastPass.get(b.key)!))
  const fresh = flex.filter((q) => !passed.has(q.key)).map((q) => ({ ...q, purpose: 'extra' as const }))
  for (const q of [...transferPractice, ...due, ...fresh]) {
    if (selected.length >= Math.max(0, remaining - reserved + required.length)) break
    if (done.has(q.key) || selectedKeys.has(q.key)) continue
    // Do not pull a later required path rep into an earlier flex slot.
    if (pathIds.has(q.key) && !passed.has(q.key)) continue
    const unit = UNIT_BY_ID[q.unitId]
    if (!unit) continue
    selected.push(q)
    selectedKeys.add(q.key)
  }
  return selected
}
