import { test, expect, type Page } from '@playwright/test'
import { DAYS, EXERCISE_BY_ID } from '@/data/curriculum'
import { DEMO_REPS } from '@/data/demo'
import { PLAN_UNITS } from '@/data/schedule-90'
import type { Exercise } from '@/lib/types'

async function answer(page: Page, e: Exercise) {
  if (e.kind === 'choice') await page.getByRole('group', { name: 'Choose one answer' }).getByRole('radio').nth(e.answer!).check({ force: true })
  else if (e.kind === 'output') await page.getByTestId('output-input').fill(e.expectedOutput!)
  else if (e.kind === 'code') {
    await page.locator('.cm-content').click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('Backspace')
    await page.keyboard.insertText(e.solution!)
  }
  await page.getByTestId('submit').click()
}

test('before the course, Today previews Day 1: learning is open, reps wait; a rep still runs, persists and updates mastery', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-23T09:30:00-04:00'))
  await page.goto('/')
  // One product: the Reps 2.0 Day 1, labelled as a preview, not an older homepage.
  await expect(page.getByTestId('course-today')).toHaveAttribute('data-day', 'preview')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your training starts Monday.')
  await expect(page.getByTestId('day-status')).toHaveText('Preview')
  await expect(page.getByTestId('training-start')).toHaveText(/^Start lesson: State/)
  await expect(page.getByTestId('learn-first')).toContainText('Lesson: State')
  // The header names the interview, not its date. No global whole-program rail competes with the course.
  const chip = page.getByTestId('interview-target-chip')
  await expect(chip).toContainText('SWE I')
  await expect(chip).not.toContainText(/Oct|October|days?\b/)
  await expect(chip).toHaveAttribute('href', '/interview')
  await expect(page.getByRole('progressbar', { name: /Overall Reps curriculum progress/ })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  // Reps are not startable from the preview: nothing counts before Oct 26.
  await expect(page.getByTestId('training-items').locator('a[href^="/rep/"]')).toHaveCount(0)

  // A rep opened directly still runs, records mastery and survives a reload.
  const rep = EXERCISE_BY_ID['c1-g-countdown-steps']
  await page.goto(`/rep/${rep.id}`)
  await answer(page, rep)
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 60_000 })
  const skill = rep.skills[0]
  await page.goto(`/skills/${skill}`)
  await expect(page.getByText('Recent attempts')).toBeVisible()
  await expect(page.getByRole('link', { name: rep.title })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: rep.title })).toBeVisible()
  // Still a preview: an early rep is not course credit.
  await page.goto('/')
  await expect(page.getByTestId('course-today')).toHaveAttribute('data-day', 'preview')
})

test('a code rep runs real Python in the browser and an infinite loop is stopped', async ({ page }) => {
  await page.goto('/rep/cap-contains-duplicate')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText('def contains_duplicate(nums):\n    while True:\n        pass\n')
  await page.getByRole('button', { name: /^Run/ }).click()
  await expect(page.getByText('Possible infinite loop')).toBeVisible({ timeout: 90_000 })
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(
    'def contains_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return True\n        seen.add(n)\n    return False\n'
  )
  await page.getByTestId('submit').click()
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })
})

test('reps behind the Dictionary check are locked until it is cleared', async ({ page }) => {
  await page.goto('/rep/o2-get-trace')
  await expect(page.getByRole('heading', { name: 'Pass the Dictionary check first' })).toBeVisible()
  await expect(page.locator('.cm-content')).toHaveCount(0)
  await page.getByRole('link', { name: /Continue the check/ }).click()
  await expect(page).toHaveURL(/\/rep\/o2-drev-trace$/)
})

test('a debug rep loads broken code, shows failing tests, and accepts the fix', async ({ page }) => {
  const rep = DAYS[0].sections.flatMap((s) => s.exercises).find((e) => e.style === 'debug')!
  await page.goto(`/rep/${rep.id}`)
  await expect(page.getByText('Debug Rep').first()).toBeVisible()
  await expect(page.getByText(/tests? failing/i)).toBeVisible({ timeout: 90_000 })
  await expect(page.getByRole('button', { name: /Submit fix/ })).toBeVisible()
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(rep.solution!)
  await page.getByTestId('submit').click()
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 60_000 })
})

test('unknown reps are a real 404', async ({ page }) => {
  const res = await page.request.get('/rep/not-a-real-rep')
  expect(res.status()).toBe(404)
})

test('the public demo: no app chrome, a rep runs against its tests, the base plan lists every pattern', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('heading', { level: 1, name: 'Build fluency through repetition.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Interview' })).toHaveCount(0)

  const first = EXERCISE_BY_ID[DEMO_REPS[0].id]
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(first.solution!)
  await page.getByTestId('demo-run').click()
  await expect(page.getByRole('button', { name: 'Next rep' })).toBeVisible({ timeout: 90_000 })

  await expect(page.getByTestId('demo-plan').locator('details')).toHaveCount(PLAN_UNITS.length)
  // Nothing is stored: the demo leaves no drafts or progress behind.
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /draft|attempt|solve/.test(k)).length)).toBe(0)
})

test('learn mode teaches first: the concept comes before the question, then goes away once the skill has been produced', async ({ page }) => {
  // A brand-new learner on the very first rep: nothing has been produced yet.
  const first = EXERCISE_BY_ID['o2-list-literal']
  await page.goto(`/rep/${first.id}`)
  const teach = page.getByTestId('teach')
  await expect(teach).toBeVisible()
  await expect(teach).toContainText('read this first')
  await expect(teach.getByTestId('concept-guide')).toHaveAttribute('data-open', 'true')
  await expect(teach).toContainText('Mental model')
  await expect(teach).toContainText('Core moves')
  // It is part of the rep, above the question, not a drawer behind the Basics button.
  await expect(page.getByText('Your rep', { exact: true })).toBeVisible()
  const order = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="teach"]')!
    const label = [...document.querySelectorAll('p')].find((p) => p.textContent === 'Your rep')!
    return Boolean(t.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(order).toBe(true)

  // Produce the skill once (a written rep that builds and indexes a list).
  const write = EXERCISE_BY_ID['o2-bookends']
  await page.goto(`/rep/${write.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(write.title)
  await answer(page, write)
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })

  // Back on a rep that only uses what has now been produced: no automatic lesson. Basics is still one tap away.
  await page.goto(`/rep/${first.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title)
  await expect(page.getByRole('button', { name: /Basics/ })).toBeVisible()
  await expect(page.getByTestId('teach')).toHaveCount(0)
  // The concept is still there, collapsed, and opening it costs nothing on a drill.
  await expect(page.getByTestId('concept-guide')).toHaveAttribute('data-mode', 'practice')
  await expect(page.getByTestId('concept-guide')).toHaveAttribute('data-open', 'false')

  // The full guide has its own page, with the concept videos.
  await page.goto('/learn/index-maps')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Index maps')
  await expect(page.getByTestId('concept-video').first()).toHaveAttribute('href', /youtube\.com\/watch/)
})

test('a shown solution is for looking, then rebuilding: the editor starts over and the solution hides once you type; unclear wording is one tap to flag', async ({
  page
}) => {
  const e = EXERCISE_BY_ID['o2-bookends']
  await page.goto(`/rep/${e.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(e.title)
  await page.locator('.cm-content').click()
  await page.keyboard.insertText('# my first try')
  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: /Show solution/ }).click()
  // The solution shows, and the editor is back at the start (the half-written try is gone, so it cannot be patched up from the answer).
  await expect(page.getByTestId('solution')).toBeVisible()
  await expect(page.locator('.cm-content')).not.toContainText('my first try')
  // Typing hides it; it can be looked at again.
  await page.locator('.cm-content').click()
  await page.keyboard.insertText('x')
  await expect(page.getByTestId('solution')).toHaveCount(0)
  await expect(page.getByTestId('solution-hidden')).toBeVisible()
  await page.getByTestId('solution-hidden').getByRole('button', { name: 'Look again' }).click()
  await expect(page.getByTestId('solution')).toBeVisible()

  // Flag the wording, with a note; it is remembered.
  await page.getByTestId('wording-flag').click()
  await page.getByLabel('What was unclear').fill('the second sentence')
  await page.getByLabel('What was unclear').press('Enter')
  await page.reload()
  await expect(page.getByTestId('wording-flagged')).toBeVisible()
  await expect(page.getByLabel('What was unclear')).toHaveValue('the second sentence')
})
