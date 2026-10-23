import { test, expect, type Page } from '@playwright/test'
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
    return { id: `c-e2e-${i}`, exerciseId: p.id, date: p.date, skills: e.skills, stage: e.stage, mode: 'practice', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: stamp, completedAt: stamp, retrievalType: 'first-exposure', updatedAt: stamp, ...p.over }
  })
  return { name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'reps', version: 1, exportedAt: new Date().toISOString(), attempts, skill_mastery: [], daily_progress: [], review_queue: [], generated_reps: [], study_state: [] })) }
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
    ['2026-12-25T10:00:00-05:00', 'Christmas Day'],
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
