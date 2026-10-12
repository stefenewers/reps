import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { DAYS, DAY_BY_DATE, EXERCISE_BY_ID, FIRST_DAY, LAST_DAY, dayExercises } from '@/data/curriculum'
import { DEMO_REPS } from '@/data/demo'
import { PLAN_UNITS } from '@/data/schedule-90'
import { TARGET_BY_LC } from '@/data/problem-bridges'
import { readiness } from '@/lib/bridges'
import { PLAN_DAYS } from '@/data/curriculum'
import { REACTIVATION_REPS } from '@/data/reactivation'
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
  // Day 1 of the plan (a Monday). The seeded re-solves are waiting on Today.
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
  await expect(gauge).toContainText(/days? after Jan 9/)
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

test('a problem is reached through its bridge: last block rep → ready → attempt logged → rebuild and repair → the re-solve is queued', async ({ page }) => {
  // LC 128, Longest Consecutive Sequence: everything before the last rep of its bridge is done.
  const target = TARGET_BY_LC.get(128)!
  const order = PLAN_DAYS.flatMap((d) => d.planOrder ?? [])
  const bridge = target.blocks.flatMap((b) => b.reps ?? [])
  const last = bridge[bridge.length - 1]
  // What Stefen had already passed before the plan began (the sprint, with its dictionary checks), then the plan up to here.
  const sprint = (JSON.parse(readFileSync('planning/done.json', 'utf8')) as string[]).filter((id) => EXERCISE_BY_ID[id])
  const before = [...new Set([...sprint, ...order.slice(0, order.indexOf(last)).filter((k) => !k.startsWith('lc:')), ...target.blocks.flatMap((b) => b.evidence ?? [])])]
  const day = PLAN_DAYS.find((d) => d.planOrder?.includes('lc:128'))!.date
  const stamp = `${PLAN_DAYS[0].date}T15:00:00.000Z`
  const attempts = before.map((id, i) => {
    const e = EXERCISE_BY_ID[id]
    return { id: `e2e-${i}`, exerciseId: id, date: PLAN_DAYS[0].date, skills: e.skills, stage: e.stage, mode: 'learn', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: stamp, completedAt: stamp, retrievalType: 'first-exposure', updatedAt: stamp }
  })
  const state = readiness(target, new Set(before))
  expect(state.ready).toBe(false)
  expect(state.nextRep).toBe(last)

  await page.clock.setFixedTime(new Date(`${day}T10:00:00-04:00`))
  await page.goto('/')
  await page.getByLabel('Import progress file').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'reps', version: 1, exportedAt: stamp, attempts, skill_mastery: [], daily_progress: [], review_queue: [], generated_reps: [], study_state: [] })) })
  await expect(page.getByText(`Imported ${attempts.length} new attempts`)).toBeVisible()

  // The problem is a destination: its building blocks are listed, and exactly one is still open.
  await page.goto('/problems')
  const card = page.getByTestId('target-128')
  await expect(card.getByTestId('target-status')).toHaveText(`${state.readyCount} of ${state.total} blocks ready`)
  await expect(card.getByTestId('blocks').locator('li')).toHaveCount(target.blocks.length)

  // The last bridge rep says what it builds toward. Passing it makes the target ready.
  await page.goto(`/rep/${last}`)
  await expect(page.getByTestId('toward')).toContainText('Building toward LC 128')
  await answer(page, EXERCISE_BY_ID[last])
  await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })
  await page.goto('/problems')
  await expect(page.getByTestId('target-128').getByTestId('target-status')).toHaveText('Ready to attempt')

  // The next working day: the problem is on Today, ready, and its walkthrough is one click away (for after a real attempt).
  const next = PLAN_DAYS.find((d) => d.date > day && d.phase !== 'off')!.date
  await page.clock.setFixedTime(new Date(`${next}T10:00:00-04:00`))
  await page.goto('/')
  const item = page.getByTestId('lc-128')
  await expect(item.getByTestId('lc-readiness')).toContainText(`Ready: all ${state.total} building blocks in place`)
  await expect(item.getByRole('link', { name: 'Walkthrough' })).toHaveAttribute('href', /youtube\.com\/watch/)

  // The attempt needed help: that is not the end. Rebuild it, then go back down the ladder to the block that broke.
  await item.getByRole('button', { name: 'Needed help' }).click()
  const rebuild = item.getByTestId('lc-rebuild')
  await expect(rebuild).toContainText('rebuild it')
  await rebuild.getByRole('button', { name: 'I rebuilt it from blank' }).click()
  await expect(rebuild.getByRole('button', { name: 'Rebuilt from blank' })).toHaveAttribute('aria-pressed', 'true')
  const broke = target.blocks.findLast((b) => b.reps?.length)!
  await rebuild.getByRole('button', { name: broke.label }).click()
  await expect(page).toHaveURL(new RegExp(`/rep/${broke.reps![0]}\\?s=`))

  // The first solve is on the record, and the problem comes back cold: its re-solve is in the queue.
  await page.goto('/problems')
  const solved = page.getByTestId('target-128')
  await expect(solved.getByTestId('target-status')).toHaveText('Solved with help')
  await expect(solved).toContainText(/Re-solves 0 of 3 · next /)
  await page.goto('/log')
  await expect(page.locator('tbody tr').filter({ hasText: 'Longest Consecutive Sequence' })).toHaveCount(1)
})

test('reactivation: Today offers a warm-up session of existing reps, it runs end to end, and then the plan resumes', async ({ page }) => {
  test.setTimeout(300_000)
  // Monday Oct 12, with what Stefen had passed in the sprint (so the session really is a repeat).
  const sprint = (JSON.parse(readFileSync('planning/done.json', 'utf8')) as string[]).filter((id) => EXERCISE_BY_ID[id])
  const stamp = '2026-10-04T15:00:00.000Z'
  const attempts = sprint.map((id, i) => {
    const e = EXERCISE_BY_ID[id]
    return { id: `e2e-r${i}`, exerciseId: id, date: '2026-10-04', skills: e.skills, stage: e.stage, mode: 'learn', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: stamp, completedAt: stamp, retrievalType: 'first-exposure', updatedAt: stamp }
  })
  await page.clock.setFixedTime(new Date('2026-10-12T09:30:00-04:00'))
  await page.goto('/')
  await page.getByLabel('Import progress file').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'reps', version: 1, exportedAt: stamp, attempts, skill_mastery: [], daily_progress: [], review_queue: [], generated_reps: [], study_state: [] })) })
  await expect(page.getByText(`Imported ${attempts.length} new attempts`)).toBeVisible()

  // The card sits above the normal queue, and says where the plan resumes afterwards.
  const card = page.getByTestId('reactivate')
  await expect(card).toHaveAttribute('data-state', 'offer')
  await expect(card).toContainText("You've been away from coding practice")
  await expect(card).toContainText(`${REACTIVATION_REPS.length} reps`)
  await expect(card).toContainText('After this · Resume:')
  await expect(page.getByTestId('start-today')).toBeVisible()
  // Last time's answer is still saved as a draft on this device: starting the session must not hand it back.
  await page.evaluate(([id, code]) => window.localStorage.setItem(`reps-draft:${id}`, code), [REACTIVATION_REPS[0], EXERCISE_BY_ID[REACTIVATION_REPS[0]].solution!])
  await card.getByTestId('reactivate-start').click()

  // Every rep in order, each starting from its bare starter (never last time's answer), each run against its tests.
  for (const [i, id] of REACTIVATION_REPS.entries()) {
    await expect(page).toHaveURL(new RegExp(`/rep/${id}\\?s=`))
    const e = EXERCISE_BY_ID[id]
    // A line of the answer that the starter does not already have (debug reps share most lines with their fix).
    const tell = e.solution!.split('\n').map((l) => l.trim()).find((l) => l.length > 6 && !(e.starterCode ?? '').includes(l))
    await expect(page.locator('.cm-content')).toBeVisible()
    if (tell) await expect(page.locator('.cm-content')).not.toContainText(tell)
    await answer(page, e)
    await expect(page.getByTestId('rep-complete')).toBeVisible({ timeout: 90_000 })
    if (i === 3) {
      // Part-way through, Today offers to continue where the session stands.
      await page.goto('/')
      await expect(page.getByTestId('reactivate')).toContainText(`4 of ${REACTIVATION_REPS.length} done`)
      await page.getByTestId('reactivate-start').click()
    } else await page.getByTestId('next-rep').click()
  }

  // Finished cleanly: back on Today, pointed at the next normal item. LeetCode is not opened.
  await expect(page).toHaveURL(/\/$/)
  const done = page.getByTestId('reactivate')
  await expect(done).toHaveAttribute('data-state', 'done')
  await expect(done).toContainText('Reactivated. Resume the plan.')
  await expect(done.getByRole('link')).toHaveAttribute('href', /^\/rep\//)
})
