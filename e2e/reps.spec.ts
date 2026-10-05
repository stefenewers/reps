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
  await expect(chip).toContainText('Google SWE')
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
  await page.goto('/rep/cap-two-sum')
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
