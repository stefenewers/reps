// Runs every unit test file with tsx's test runner.
// Lists the files itself so it works on Node 20, where `node --test` does not expand globs.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function find(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? find(p) : p.endsWith('.test.ts') ? [p] : []
  })
}

const files = [...find('lib'), ...find('supabase')].sort()
if (!files.length) {
  console.error('No test files found.')
  process.exit(1)
}
const r = spawnSync('npx', ['tsx', '--test', ...files], { stdio: 'inherit', shell: process.platform === 'win32' })
process.exit(r.status ?? 1)
