import { test, expect, type Page } from '@playwright/test'
import { DAYS } from '@/data/curriculum'
import type { Exercise } from '@/lib/types'

const firstRep: Exercise = DAYS[0].sections[0].exercises[0]

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
  await page.getByTestId('start-today').click()
  await expect(page).toHaveURL(new RegExp(`/rep/${firstRep.id}`))
  await expect(page.getByRole('heading', { name: firstRep.title })).toBeVisible()

  await answer(page, firstRep)
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 60_000 })

  const skill = firstRep.skills[0]
  await page.goto(`/skills/${skill}`)
  const score = page.locator('section').filter({ hasText: 'Score' }).first()
  await expect(score).toContainText('accuracy 100%')
  await expect(page.getByText('Recent attempts')).toBeVisible()
  await expect(page.getByRole('link', { name: firstRep.title })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: firstRep.title })).toBeVisible()
  await page.goto('/')
  await expect(page.getByText(/Rep 2 of \d+/)).toBeVisible()
  // The next rep is now the starting point.
  await page.getByTestId('start-today').click()
  await expect(page).not.toHaveURL(new RegExp(`/rep/${firstRep.id}$`))
})

test('a code rep runs real Python in the browser and an infinite loop is stopped', async ({ page }) => {
  await page.goto('/rep/cap-two-sum')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText('def two_sum(nums, target):\n    while True:\n        pass\n')
  await page.getByRole('button', { name: /^Run/ }).click()
  await expect(page.getByText('Possible infinite loop')).toBeVisible({ timeout: 90_000 })
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText('def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n')
  await page.getByTestId('submit').click()
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })
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
