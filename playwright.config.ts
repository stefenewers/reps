import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3210)

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: `node scripts/serve-test-pyodide.mjs ${PORT + 1}`,
      url: `http://localhost:${PORT + 1}/pyodide.mjs`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: `npm run dev -- --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { NEXT_PUBLIC_PYODIDE_INDEX_URL: `http://localhost:${PORT + 1}/` }
    }
  ]
})
