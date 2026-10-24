import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/** Visual audit captures (planning/ui-audit): `SHOTS=before npx playwright test -c playwright.shots.config.ts`. */
export default defineConfig({
  ...base,
  testDir: './scripts/ui-shots',
  timeout: 180_000,
  workers: 2,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }]
})
