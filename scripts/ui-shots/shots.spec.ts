import { test, expect, type Page } from '@playwright/test'
import { SECTION_BY_ID } from '@/data/course'
import { UNITS } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { DEMOS } from '@/lib/demos'

/**
 * The visual audit: the same learner states, captured at 1440px and 390px.
 * Output: planning/ui-audit/<SHOTS>/<name>-<desktop|mobile>.png
 */

const OUT = `planning/ui-audit/${process.env.SHOTS ?? 'before'}`
const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 }
]

type Pass = { id: string; date: string; over?: Record<string, unknown> }

function bundle(passes: Pass[]) {
  const attempts = passes.map((p, i) => {
    const e = EXERCISE_BY_ID[p.id]
    const stamp = `${p.date}T14:${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z`
    return {
      id: `shot-${i}`,
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
  const data = { app: 'reps', version: 1, exportedAt: new Date().toISOString(), attempts, skill_mastery: [], daily_progress: [], review_queue: [], generated_reps: [], study_state: [] }
  return { name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) }
}

const qualifying = (ids: string[]) =>
  ids
    .flatMap((id) => SECTION_BY_ID[id].exercises)
    .filter((e) => ['code', 'output', 'reorder'].includes(e.kind))
    .map((e) => e.id)
const WEEK1 = qualifying(['c1-state', 'c1-while'])

/** A believable learner: Week 1 and most of Week 2 done, day by day. */
function history(until: string): Pass[] {
  const days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05']
  const pool = UNITS.slice(0, 4).flatMap((u) => u.path ?? [])
  return days.filter((d) => d < until).flatMap((d, i) => pool.slice(i * 10, i * 10 + 10).map((id) => ({ id, date: d })))
}

async function load(page: Page, iso: string, passes: Pass[] = []) {
  await page.clock.setFixedTime(new Date(iso))
  await page.goto('/')
  if (passes.length) {
    await page.getByLabel('Import progress file').setInputFiles(bundle(passes))
    await expect(page.getByText(/Imported/)).toBeVisible()
  }
}

async function snap(page: Page, name: string, path: string, opts: { click?: string } = {}) {
  for (const v of VIEWPORTS) {
    await page.setViewportSize({ width: v.width, height: v.height })
    await page.goto(path)
    await page.waitForLoadState('networkidle').catch(() => {})
    if (opts.click) await page.getByRole('button', { name: opts.click }).click().catch(() => {})
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/${name}-${v.tag}-fold.jpg`, quality: 72 })
    await page.screenshot({ path: `${OUT}/${name}-${v.tag}.jpg`, quality: 72, fullPage: true })
  }
}

test.use({ reducedMotion: 'reduce' })

// A release candidate is quiet: every captured state must render without console or page errors.
let errors: string[] = []
test.beforeEach(({ page }) => {
  errors = []
  page.on('pageerror', (e) => errors.push(`pageerror ${page.url()}: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console ${page.url()}: ${m.text()}`)
  })
})
test.afterEach(() => {
  expect(errors, errors.join('\n')).toEqual([])
})

test('pre-course', async ({ page }) => {
  await load(page, '2026-10-23T09:30:00-04:00')
  await snap(page, '01-today-precourse', '/')
})

test('first training day, lesson, example, rep, lab, checkpoint', async ({ page }) => {
  await load(page, '2026-10-26T09:30:00-04:00')
  await snap(page, '02-today-day1', '/')
  await snap(page, '10-plan-day1', '/plan')
  await snap(page, '20-lesson', '/learn/l-while')
  await snap(page, '21-worked-example', '/example/we-countdown')
  await snap(page, '22-demo', `/demo/${DEMOS.find((d) => d.id.includes('window'))?.id ?? DEMOS[0].id}`)
  await snap(page, '30-rep', `/rep/${WEEK1[0]}`)
  await snap(page, '31-checkpoint', '/rep/c1-g-countdown-steps')
  await snap(page, '32-lab', '/lab/lab-savings-goal')
  await snap(page, '40-skills', '/skills')
  await snap(page, '41-problems', '/problems')
  await snap(page, '42-log', '/log')
})

test('partial day', async ({ page }) => {
  await load(page, '2026-10-26T13:00:00-04:00', WEEK1.slice(0, 4).map((id) => ({ id, date: '2026-10-26' })))
  await snap(page, '03-today-partial', '/')
})

test('completed day', async ({ page }) => {
  await load(page, '2026-10-26T18:00:00-04:00', WEEK1.slice(0, 10).map((id) => ({ id, date: '2026-10-26' })))
  await snap(page, '04-today-complete', '/')
})

test('rep target met, required work open', async ({ page }) => {
  await load(page, '2026-10-27T16:00:00-04:00', WEEK1.slice(0, 10).map((id) => ({ id, date: '2026-10-27' })))
  await snap(page, '04b-today-reps-met', '/')
})

test('week 3 normal day', async ({ page }) => {
  await load(page, '2026-11-10T10:00:00-05:00')
  await snap(page, '09-today-week3', '/')
})

test('saturday recovery', async ({ page }) => {
  await load(page, '2026-10-31T11:00:00-04:00', history('2026-10-31'))
  await snap(page, '05b-today-saturday', '/')
})

test('feb 1 final decision', async ({ page }) => {
  await load(page, '2027-02-01T09:00:00-05:00')
  await snap(page, '17-today-feb1', '/')
})

test('applied thread: lessons, Week 12 Today, the retrieval mini-build', async ({ page }) => {
  await load(page, '2027-01-11T09:00:00-05:00')
  await snap(page, '18-today-week12', '/')
  await snap(page, '23-applied-lesson-design', '/learn/sd-program-design')
  await snap(page, '24-applied-lesson-tools', '/learn/ae-tools-workflows')
  await snap(page, '33-lab-grounded-answer', '/lab/lab-grounded-answer')
})

test('rest day', async ({ page }) => {
  await load(page, '2026-11-01T10:00:00-05:00', history('2026-11-01'))
  await snap(page, '05-today-rest', '/')
})

test('failed checkpoint, repair', async ({ page }) => {
  await load(page, '2026-10-30T12:00:00-04:00', [
    ...history('2026-10-30'),
    { id: 'c1-g-countdown-steps', date: '2026-10-30', over: { passed: false, attemptsBeforePass: 1, retrievalType: 'cold' } }
  ])
  await snap(page, '06-today-repair', '/')
})

test('placement', async ({ page }) => {
  const earlier = [...UNITS[0].path!, ...UNITS[1].path!.slice(0, Math.ceil(UNITS[1].path!.length * 0.4))]
  await load(page, '2026-10-27T12:00:00-04:00', earlier.map((id) => ({ id, date: '2026-10-20' })))
  await snap(page, '07-today-placement', '/')
})

test('mid-course road and progress', async ({ page }) => {
  await load(page, '2026-11-06T12:00:00-05:00', history('2026-11-06'))
  await snap(page, '08-today-midcourse', '/')
  await snap(page, '11-plan-midcourse', '/plan')
  await snap(page, '12-progress-midcourse', '/progress')
})

test('week 13 transfer', async ({ page }) => {
  await load(page, '2027-01-12T12:00:00-05:00')
  await snap(page, '13-today-week13', '/')
})

for (const grade of ['red', 'yellow', 'green'] as const) {
  test(`week 14 ${grade}`, async ({ page }) => {
    const bank = SECTION_BY_ID['c13-transfer'].exercises
    const small = bank.filter((e) => e.stage !== 'interview' && e.minutes < 15)
    const chosen = grade === 'green' ? bank : grade === 'yellow' ? small.slice(0, 6) : []
    await load(
      page,
      '2027-01-25T12:00:00-05:00',
      chosen.map((e) => ({ id: e.id, date: '2027-01-22' }))
    )
    await snap(page, `14-today-week14-${grade}`, '/')
    await snap(page, `15-interview-${grade}`, '/interview')
    if (grade === 'green') await snap(page, '16-interview-session', '/interview/mock-1', { click: 'Start the clock' })
  })
}
