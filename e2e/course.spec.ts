import { test, expect, type Page } from '@playwright/test'
import { GATE_BY_ID } from '@/data/course/gates'
import { LAB_BY_ID } from '@/data/course/lessons'
import { UNITS } from '@/data/course/units'
import { MOCKS } from '@/data/mocks'
import { createContracts } from '@/lib/course/contract'
import { courseStatus } from '@/lib/course/routing'
import { DEMOS } from '@/lib/demos'
import { SECTION_BY_ID } from '@/data/course'
import { EXERCISE_BY_ID } from '@/data/curriculum'

/** Reps 2.0: the 14-week course, from Oct 26. */

async function at(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(iso))
}

function bundle(passes: { id: string; date: string; over?: Record<string, unknown> }[]) {
  const attempts = passes.map((p, i) => {
    const e = EXERCISE_BY_ID[p.id]
    const stamp = `${p.date}T14:${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z`
    return {
      id: `c-e2e-${i}`,
      exerciseId: p.id,
      date: p.date,
      skills: e.skills,
      stage: e.stage,
      mode: 'practice',
      passed: true,
      attemptsBeforePass: 0,
      hintsUsed: 0,
      solutionViewed: false,
      runtimeErrors: [],
      startedAt: stamp,
      completedAt: stamp,
      retrievalType: 'first-exposure',
      updatedAt: stamp,
      ...p.over
    }
  })
  return {
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        app: 'reps',
        version: 1,
        exportedAt: new Date().toISOString(),
        attempts,
        skill_mastery: [],
        daily_progress: [],
        review_queue: [],
        generated_reps: [],
        study_state: []
      })
    )
  }
}

const WEEK1 = ['c1-state', 'c1-while'].flatMap((id) => SECTION_BY_ID[id].exercises.map((e) => e.id))

test('before Oct 26 Today announces the course; on Oct 26 Today is the course day: 10 reps, learn first, the week and readiness', async ({ page }) => {
  await at(page, '2026-10-23T09:30:00-04:00')
  await page.goto('/')
  await expect(page.getByTestId('course-banner')).toContainText('Reps 2.0 starts Monday, Oct 26.')

  await at(page, '2026-10-26T09:30:00-04:00')
  await page.goto('/')
  const today = page.getByTestId('course-today')
  await expect(today).toHaveAttribute('data-day', 'training')
  await expect(page.getByTestId('day-target')).toHaveText('10 reps')
  await expect(page.getByTestId('course-week')).toContainText('Week 1 · Foundations')
  await expect(page.getByTestId('training-flame')).toHaveAttribute('data-flame', 'unlit')
  await expect(page.getByTestId('motivation')).not.toBeEmpty()
  // A new unit starts with the idea: lessons and a worked example, not counted.
  await expect(page.getByTestId('learn-first')).toContainText('Lesson: State')
  await expect(page.getByTestId('learn-first')).toContainText('Worked example')
  // The first reps are Week 1's own, in order.
  await expect(page.getByTestId('training-items').locator('li').first()).toContainText(EXERCISE_BY_ID[WEEK1[0]].title)
  // The week: 0 of 50, on track, two builds, four checkpoints, and a heat strip with Sunday as rest.
  const week = page.getByTestId('week-card')
  await expect(week.getByTestId('week-count')).toContainText('0 / 50')
  await expect(week.getByTestId('week-status')).toHaveText('On track')
  await expect(week.getByTestId('lab-link')).toHaveCount(2)
  await expect(week.getByTestId('gate-row')).toHaveCount(4)
  await expect(week.getByTestId('week-strip').locator('li[data-day="2026-11-01"]')).toHaveAttribute('data-state', 'rest')
  await expect(page.getByTestId('readiness-card')).toBeVisible()

  // The plan is the Road to Ready: 14 weeks, Week 1 active, later weeks locked behind it.
  await page.goto('/plan')
  const road = page.getByTestId('road-map')
  await expect(road.locator('li[data-week]')).toHaveCount(14)
  await expect(road.locator('li[data-week="1"]')).toHaveAttribute('data-state', 'active')
  await expect(road.locator('li[data-week="3"]')).toHaveAttribute('data-state', 'locked')
  await expect(road.locator('li[data-week="9"]')).toContainText('Christmas Day')
})

test('ten qualifying reps complete the day: the flame blazes, the streak starts, and stopping is a real choice', async ({ page }) => {
  await at(page, '2026-10-26T16:00:00-04:00')
  await page.goto('/')
  // Ten Week 1 reps passed today, plus the same rep again and a pass with the solution open: those two do not count.
  const passes = WEEK1.slice(0, 10).map((id) => ({ id, date: '2026-10-26' }))
  const file = bundle([...passes, { id: WEEK1[0], date: '2026-10-26' }, { id: WEEK1[11], date: '2026-10-26', over: { solutionViewed: true } }])
  await page.getByLabel('Import progress file').setInputFiles(file)
  await expect(page.getByText(/Imported/)).toBeVisible()
  await page.goto('/')
  const today = page.getByTestId('course-today')
  await expect(today).toHaveAttribute('data-complete', 'true')
  await expect(page.getByTestId('day-complete')).toContainText('10 / 10')
  await expect(page.getByTestId('training-flame')).toHaveAttribute('data-flame', 'blaze')
  await expect(page.getByTestId('streak')).toContainText('1 training day in a row')
  await expect(page.getByTestId('motivation')).toHaveAttribute('data-tone', /celebrate|warm/)
  await expect(page.getByTestId('week-count')).toContainText('10 / 50')
  await page.getByTestId('stop-today').click()
  await expect(page.getByTestId('stopped')).toHaveText('Good. See you tomorrow.')
})

test('planned rest: Sundays and Christmas ask for nothing, and say the plan is intact', async ({ page }) => {
  for (const [iso, label] of [
    ['2026-11-01T10:00:00-05:00', 'Sunday'],
    ['2026-12-25T10:00:00-05:00', 'Christmas Day']
  ]) {
    await at(page, iso)
    await page.goto('/')
    await expect(page.getByTestId('course-today')).toHaveAttribute('data-day', 'rest')
    await expect(page.getByTestId('rest-title')).toHaveText('Rest day')
    await expect(page.getByTestId('motivation')).toContainText('Nothing is due. Your plan is intact.')
    await expect(page.getByTestId('course-today')).toContainText(label)
    await expect(page.getByTestId('course-today')).not.toContainText(/behind|missed|owe/i)
  }
})

test('a checkpoint is cold: no lesson panel, no hints, no solution, no named technique', async ({ page }) => {
  await at(page, '2026-10-30T10:00:00-04:00')
  await page.goto('/rep/c1-g-countdown-steps')
  await expect(page.getByTestId('checkpoint')).toContainText('Checkpoint · Loop control')
  await expect(page.getByTestId('concept-guide')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Hint/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Basics/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'More actions' }).click()
  await expect(page.getByRole('menuitem', { name: /Show solution/ })).toHaveCount(0)
  await expect(page.getByTestId('unlabeled')).toBeVisible()
})

test('learning objects: a lesson, a worked example by subgoals that hands off to a rebuild, and a lab that is done or not done', async ({ page }) => {
  await at(page, '2026-10-26T10:00:00-04:00')
  await page.goto('/learn/l-while')
  await expect(page.getByTestId('lesson')).toContainText('Mental model')
  await page.goto('/example/we-countdown')
  await expect(page.getByTestId('subgoal')).toHaveCount(1)
  for (let i = 0; i < 6 && (await page.getByTestId('next-goal').count()); i++) await page.getByTestId('next-goal').click()
  await expect(page.getByTestId('rebuild')).toHaveAttribute('href', '/rep/c1-while-rebuild-countdown')
  await page.goto('/lab/lab-savings-goal')
  await expect(page.getByTestId('lab')).toHaveAttribute('data-done', 'false')
  await expect(page.getByTestId('lab-finish')).toBeDisabled()
  await expect(page.getByTestId('lab-build')).toHaveAttribute('href', '/rep/lab-savings-goal-build')
  // A lab part says so, and is not a rep that counts.
  await page.goto('/rep/lab-savings-goal-build')
  await expect(page.getByTestId('lab-part')).toContainText('Savings Goal Simulator')
})

test('Today exposes every due lab, checkpoint and target, including locked and carried work', async ({ page }) => {
  const input = { attempts: [], entries: [], mastery: {}, labStates: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID }
  for (const date of ['2026-10-27', '2026-10-28', '2026-12-02']) {
    await at(page, `${date}T12:00:00-05:00`)
    await page.goto('/')
    const expected = createContracts(input).dayContract(date)
    const today = page.getByTestId('course-today')
    await expect(today.getByTestId('today-lab')).toHaveCount(expected.labs.length)
    await expect(today.getByTestId('today-gate')).toHaveCount(expected.gates.length)
    await expect(today.getByTestId('today-target')).toHaveCount(expected.targets.length)
    for (const lab of expected.labs) await expect(today.getByRole('link', { name: lab.title, exact: true })).toHaveAttribute('href', `/lab/${lab.id}`)
    for (const gate of expected.gates) await expect(today.getByTestId('today-gate').filter({ hasText: gate.title })).toHaveAttribute('data-state', gate.state)
    if (expected.targets.length) await expect(today.getByTestId('today-target').first()).toContainText('Opens after checkpoint')
  }
})

test('the primary action starts learning first, then required labs when the rep target is met', async ({ page }) => {
  await at(page, '2026-10-26T12:00:00-04:00')
  await page.goto('/')
  await expect(page.getByTestId('training-start')).toHaveText('Start today')
  await expect(page.getByTestId('training-start')).toHaveAttribute('href', '/learn/l-state')
  await page.getByTestId('training-start').click()
  await page.getByRole('button', { name: 'Mark learning step complete' }).click()
  await page.getByRole('link', { name: 'Back to today' }).click()
  await expect(page.getByTestId('training-start')).toHaveAttribute('href', '/learn/l-while')
  await at(page, '2026-10-27T16:00:00-04:00')
  await page.goto('/')
  const qualifying = SECTION_BY_ID['c1-state'].exercises
    .concat(SECTION_BY_ID['c1-while'].exercises)
    .filter((e) => ['code', 'output', 'reorder'].includes(e.kind))
    .slice(0, 10)
  await page.getByLabel('Import progress file').setInputFiles(bundle(qualifying.map((e) => ({ id: e.id, date: '2026-10-27' }))))
  await page.goto('/')
  await expect(page.getByTestId('course-today')).toHaveAttribute('data-complete', 'false')
  await expect(page.getByTestId('training-start')).toHaveText('Start lab')
  await expect(page.getByTestId('training-start')).toHaveAttribute('href', '/lab/lab-savings-goal')
  await expect(page.getByTestId('training-flame')).not.toHaveAttribute('data-flame', 'blaze')
})

test('Saturday shows open work as optional and February shows the final decision', async ({ page }) => {
  await at(page, '2026-10-31T12:00:00-04:00')
  await page.goto('/')
  await expect(page.getByTestId('course-today')).toHaveAttribute('data-day', 'recovery')
  await expect(page.getByTestId('course-today')).toContainText('Open work, if you choose')
  await expect(page.getByTestId('course-today')).not.toContainText('Nothing owed')
  await at(page, '2027-02-01T12:00:00-05:00')
  await page.goto('/')
  await expect(page.getByTestId('course-finished')).toContainText('Not yet ready')
  await expect(page.getByTestId('course-finished')).not.toContainText('Week 1')
})

test('every interactive concept loads, steps and resets on a 390px screen with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const demo of DEMOS) {
    await page.goto(`/demo/${demo.id}`)
    await expect(page.getByTestId('demo-player')).toBeVisible()
    const next = page.getByRole('button', { name: /Next step/i })
    const prediction = page.getByTestId('predict-0')
    if (await prediction.isVisible()) await prediction.click()
    await next.click()
    await page.getByRole('button', { name: /Reset/i }).click()
    await expect(page.getByTestId('demo-player')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('a failed checkpoint makes focused repair the primary action', async ({ page }) => {
  await at(page, '2026-10-30T12:00:00-04:00')
  await page.goto('/')
  await page
    .getByLabel('Import progress file')
    .setInputFiles(bundle([{ id: 'c1-g-countdown-steps', date: '2026-10-30', over: { passed: false, attemptsBeforePass: 1, retrievalType: 'cold' } }]))
  await page.goto('/')
  await expect(page.getByTestId('training-start')).toHaveText('Do repair first')
  await expect(page.getByTestId('repair-step')).toBeVisible()
  await expect(page.getByTestId('today-gate').filter({ hasText: 'Loop control' })).toHaveAttribute('data-state', 'repair')
})

test('a seen outside solution earns credit only after a rebuild on a later training day', async ({ page }) => {
  await at(page, '2026-11-06T12:00:00-05:00')
  await page.goto('/')
  const stamp = '2026-11-05T16:00:00.000Z'
  const entry = { id: 'lc:141:new', lc: 141, title: 'Linked List Cycle', date: '2026-11-05', kind: 'new', result: 'solution', at: stamp }
  const data = {
    app: 'reps',
    version: 1,
    exportedAt: stamp,
    attempts: [],
    skill_mastery: [],
    daily_progress: [],
    review_queue: [],
    generated_reps: [],
    study_state: [{ id: 'solve:lc:141:new', value: entry, updatedAt: stamp }]
  }
  await page
    .getByLabel('Import progress file')
    .setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  await page.goto('/')
  const item = page.getByTestId('lc-141')
  await expect(item.getByTestId('lc-outcome')).toContainText('Not counted yet')
  await item.getByRole('button', { name: 'I rebuilt it from blank', exact: true }).click()
  await expect(item.getByTestId('lc-outcome')).toContainText('Counted: rebuilt from blank')
  await expect(page.getByTestId('today-contract')).toContainText('1 / 12')
})

test('placement is a working cold session, and a locked Road unit names its prerequisite', async ({ page }) => {
  const unit = UNITS[1]
  await at(page, '2026-10-27T12:00:00-04:00')
  await page.goto('/')
  const earlier = [...UNITS[0].path!, ...unit.path!.slice(0, Math.ceil(unit.path!.length * 0.4))]
  await page.getByLabel('Import progress file').setInputFiles(bundle(earlier.map((id) => ({ id, date: '2026-10-20' }))))
  await page.goto('/')
  await expect(page.getByTestId('placement-step')).toContainText('Prove what you already know')
  await expect(page.getByTestId('training-start')).toHaveText('Try placement checkpoint')
  await page.getByTestId('training-start').click()
  await expect(page).toHaveURL(/\/rep\//, { timeout: 30_000 })
  await expect(page.getByTestId('checkpoint')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Hint/ })).toHaveCount(0)
  await expect(page.getByLabel('Breadcrumb')).toHaveText('Independent practice')
  const id = new URL(page.url()).pathname.split('/').pop()!
  const e = EXERCISE_BY_ID[id]
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(e.solution!)
  await page.getByTestId('submit').click()
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })
  await page.goto('/plan')
  await page.locator('li[data-week="7"] > button').click()
  await expect(page.locator('[data-unit="w7-trees"]')).toContainText('First clear: Recursion')
})

test('lab design, build evidence, change evidence and review combine into persisted completion without rep credit', async ({ page }) => {
  const lab = LAB_BY_ID['lab-savings-goal']
  await at(page, '2026-10-27T16:00:00-04:00')
  await page.goto('/')
  await page
    .getByLabel('Import progress file')
    .setInputFiles(bundle([lab.buildExerciseId, lab.changeRequest.exerciseId].map((id) => ({ id, date: '2026-10-27' }))))
  await page.goto(`/lab/${lab.id}`)
  await expect(page.getByTestId('lab-finish')).toBeDisabled()
  for (let i = 0; i < lab.designQuestions.length; i++)
    await page.getByTestId(`design-${i}`).fill('The loop owns the balance and checks the goal before adding the next payment.')
  for (const box of await page.getByRole('checkbox').all()) await box.check()
  await expect(page.getByTestId('lab-finish')).toBeEnabled()
  await page.getByTestId('lab-finish').click()
  await expect(page.getByTestId('lab')).toHaveAttribute('data-done', 'true')
  await page.reload()
  await expect(page.getByTestId('lab')).toHaveAttribute('data-done', 'true')
  await page.goto('/')
  await expect(page.getByTestId('today-contract')).toContainText('0 / 10')
})

for (const grade of ['red', 'yellow', 'green'] as const) {
  test(`Week 14 ${grade} explains and enforces its mock allowance`, async ({ page }) => {
    const bank = SECTION_BY_ID['c13-transfer'].exercises
    const small = bank.filter((e) => e.stage !== 'interview' && e.minutes < 15)
    const chosen = grade === 'green' ? bank : grade === 'yellow' ? small.slice(0, 6) : []
    await at(page, '2027-01-25T12:00:00-05:00')
    await page.goto('/')
    if (chosen.length) {
      await page.getByLabel('Import progress file').setInputFiles(bundle(chosen.map((e) => ({ id: e.id, date: '2027-01-22' }))))
      await page.goto('/')
    }
    await expect(page.getByTestId('week14-route')).toHaveAttribute('data-grade', grade)
    await page.goto('/interview')
    await expect(page.getByTestId('mock-gate')).toContainText(`Transfer grade: ${grade}`)
    await page.goto(`/interview/${MOCKS[0].id}`)
    if (grade === 'red') await expect(page.getByTestId('mock-locked-page')).toBeVisible()
    else {
      await page.getByRole('button', { name: 'Start the clock' }).click()
      await expect(page.getByRole('button', { name: /Hint|Solution|Basics/i })).toHaveCount(0)
      await page.goto(`/interview/${MOCKS[1].id}`)
      if (grade === 'yellow') await expect(page.getByTestId('mock-locked-page')).toBeVisible()
      else await expect(page.getByRole('button', { name: 'Start the clock' })).toBeVisible()
    }
  })
}

test('a malformed progress file is rejected visibly and leaves saved progress intact', async ({ page }) => {
  await at(page, '2026-10-26T16:00:00-04:00')
  await page.goto('/')
  await page.getByLabel('Import progress file').setInputFiles(bundle([{ id: WEEK1[0], date: '2026-10-26' }]))
  // The import must land before the page is left, or "before" is read from an empty store.
  await expect(page.getByText(/Imported/)).toBeVisible()
  await page.goto('/')
  await expect(page.getByTestId('week-count')).toHaveText('1 / 50 problems')
  const before = await page.getByTestId('week-count').textContent()
  await page.getByLabel('Import progress file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') })
  await expect(page.getByRole('status').filter({ hasText: 'Import failed:' })).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('week-count')).toHaveText(before!)
})

test('a failed checkpoint routes real repair, then offers fresh cold variants on the next day', async ({ page }) => {
  const gate = GATE_BY_ID['g-loop-control']
  const failedId = gate.pool[0]
  const history = [...UNITS[0].path!, ...UNITS[1].path!].map((id) => ({ id, date: '2026-10-20' }))
  const file = bundle([
    ...history,
    { id: failedId, date: '2026-10-28', over: { passed: false, completedAt: undefined, attemptsBeforePass: 3, retrievalType: 'cold' } }
  ])
  const data = JSON.parse(file.buffer.toString())
  const status = courseStatus({ attempts: data.attempts, mastery: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID, today: '2026-10-28' })
  const repair = status.find((s) => s.unit.id === gate.unitId)!.gates.find((g) => g.gate.id === gate.id)!.repair
  expect(repair.length).toBeGreaterThanOrEqual(2)
  await at(page, '2026-10-28T16:00:00-04:00')
  await page.goto('/')
  await page.getByLabel('Import progress file').setInputFiles(file)
  await page.goto('/')
  await expect(page.getByTestId('repair-step')).toBeVisible()
  for (const id of repair) {
    await page.goto(`/rep/${id}`)
    await page.locator('.cm-content').click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.insertText(EXERCISE_BY_ID[id].solution!)
    await page.getByTestId('submit').click()
    await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })
  }
  await page.goto('/')
  await expect(page.getByTestId('repair-step')).toHaveCount(0)
  await at(page, '2026-10-29T12:00:00-04:00')
  await page.goto('/')
  const card = page.getByTestId('today-gate').filter({ hasText: gate.title }).first()
  await expect(card).toHaveAttribute('data-state', 'open')
  await card.getByRole('button', { name: 'Start checkpoint' }).click()
  await expect(page).toHaveURL(/\/rep\//, { timeout: 30_000 })
  expect(new URL(page.url()).pathname).not.toBe(`/rep/${failedId}`)
  await expect(page.getByTestId('checkpoint')).toBeVisible()
})

test('Reps 2.0 shell: Today leads, the Road trail focuses a week, mobile has tabs and More, a rep is a focus surface', async ({ page }) => {
  await at(page, '2026-10-26T09:30:00-04:00')
  await page.goto('/')
  const main = page.getByRole('navigation', { name: 'Main' })
  await expect(main.getByRole('link').first()).toHaveText('Today')
  await expect(main.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('today-hero')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Learn first, then train.')
  // The road: a node on the trail focuses its week, and the index shows every week.
  await page.goto('/plan')
  await page.getByTestId('road-trail').getByRole('button', { name: /^Week 3,/ }).click()
  await expect(page.getByTestId('week-focus')).toContainText('Week 3 —')
  await expect(page.getByTestId('road-map').locator('li[data-week]')).toHaveCount(14)
  // A rep: the sidebar collapses to a rail and no tab bar competes with the editor.
  await page.goto(`/rep/${WEEK1[0]}`)
  await expect(page.locator('[data-shell]')).toHaveAttribute('data-shell', 'focus')
  // Mobile: the tab bar, and More for the library.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const tabs = page.getByRole('navigation', { name: 'Tabs' })
  await expect(tabs).toBeVisible()
  await tabs.getByRole('button', { name: 'More' }).click()
  await page.getByRole('dialog', { name: 'More' }).getByRole('link', { name: 'Skills' }).click()
  await expect(page).toHaveURL(/\/skills$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
