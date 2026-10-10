import { test, expect, type Page } from '@playwright/test'
import { DAYS, DAY_BY_DATE, FIRST_DAY, LAST_DAY, dayExercises } from '@/data/curriculum'
import { clampDate, localDate } from '@/lib/dates'
import type { Exercise } from '@/lib/types'
import { blockingGate } from '@/lib/progress'

// "Start" opens the first rep of the earliest uncleared mastery check if one holds today (a fresh
// browser has cleared none), otherwise the first required rep of the real current study day.
const today = DAY_BY_DATE[clampDate(localDate(), FIRST_DAY, LAST_DAY)]
const firstRep: Exercise = blockingGate(today, 0, [])?.exercises[0] ?? dayExercises(today)[0]

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

test('today → first rep → correct answer → mastery updates → reload → progress persists', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: "Today's Reps" })).toBeVisible()
  // The header names the interview, not its date.
  const chip = page.getByTestId('interview-target-chip')
  await expect(chip).toContainText('SWE I')
  await expect(chip).not.toContainText(/Oct|October|days?\b/)
  await expect(chip).toHaveAttribute('href', '/interview')
  await expect(page.getByRole('heading', { name: 'Road to Ready' })).toBeVisible()
  const rail = page.getByRole('progressbar', { name: /Overall Reps curriculum progress/ })
  await expect(rail).toHaveAttribute('aria-valuenow', '0')
  await page.getByTestId('start-today').click()
  await expect(page).toHaveURL(new RegExp(`/rep/${firstRep.id}`))
  await expect(page.getByRole('heading', { name: firstRep.title })).toBeVisible()

  await answer(page, firstRep)
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 60_000 })
  // The whole-program rail moves immediately and animates for a genuine completion.
  await expect(rail).toHaveAttribute('aria-valuenow', '1')
  await expect(page.locator('.pp')).toHaveAttribute('data-advancing', 'true')

  const skill = firstRep.skills[0]
  await page.goto(`/skills/${skill}`)
  const score = page.locator('section').filter({ hasText: 'Score' }).first()
  await expect(score).toContainText('accuracy 100%')
  await expect(page.getByText('Recent attempts')).toBeVisible()
  await expect(page.getByRole('link', { name: firstRep.title })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: firstRep.title })).toBeVisible()
  await expect(rail).toHaveAttribute('aria-valuenow', '1')
  await expect(page.locator('.pp')).toHaveAttribute('data-advancing', 'false')
  await page.goto('/')
  await expect(page.getByText(blockingGate(today, 0, []) ? /Carried over · \d+ left to clear/ : /Rep 2 of \d+/)).toBeVisible()
  // The next rep is now the starting point.
  await page.getByTestId('start-today').click()
  await expect(page).not.toHaveURL(new RegExp(`/rep/${firstRep.id}$`))
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
  await page.keyboard.insertText('def contains_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return True\n        seen.add(n)\n    return False\n')
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

test('a re-solve that needed help is logged, and comes back as a redo on the next working day', async ({ page }) => {
  // Day 2 of the plan (a Monday). The re-solves from week 1 are waiting on Today.
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00-04:00'))
  await page.goto('/')
  const list = page.getByTestId('leetcode-list')
  await expect(list).toBeVisible()
  await list.getByRole('button', { name: 'Needed help' }).first().click()
  await expect(list.getByText(/1 of \d logged/)).toBeVisible()

  // It is in the solve log, with a redo queued for the next working day.
  await page.goto('/log')
  await expect(page.getByRole('heading', { name: 'Solve log' })).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr').first()).toContainText('Hinted')
  await expect(page.locator('tbody tr').first()).toContainText('Oct 13')
  await expect(page.getByRole('heading', { name: 'Re-solve queue' })).toBeVisible()
  await expect(page.getByText(/^Redo/).first()).toBeVisible()
})

test('pacing: a missed week changes the gauge, not the plan', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00-04:00'))
  await page.goto('/plan')
  const gauge = page.getByTestId('pace-gauge')
  await expect(gauge).toHaveAttribute('data-pace', 'behind')
  await expect(gauge).toContainText(/Behind by \d+ working days/)
  // Nothing was dropped: the first module is still where you are, and the forecast just runs later.
  await expect(page.getByText('you are here')).toBeVisible()
  await expect(gauge).toContainText(/days? after Jan 8/)
  // A past day is a record, not an unfinished to-do list.
  await page.goto('/day/2026-10-12')
  await expect(page.getByTestId('day-kind')).toContainText('A record of what you did')
})

test('the plan calendar links every day, and unknown reps are a real 404', async ({ page }) => {
  await page.goto('/plan')
  await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible()
  await expect(page.locator('section[aria-labelledby^="wk-"] a[href^="/day/"]')).toHaveCount(90)
  const res = await page.request.get('/rep/not-a-real-rep')
  expect(res.status()).toBe(404)
})
