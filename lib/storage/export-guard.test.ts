import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryLocalStore } from '@/lib/storage/local'
import { FakeRemoteStore } from '@/lib/storage/fake-remote'
import { SyncEngine } from '@/lib/storage/sync'
import { EXPORT_WARNING, RepsRepository, exportSchema } from '@/lib/storage/repository'
import { DAY_BY_DATE, LAST_DAY } from '@/data/curriculum'
import { SKILLS } from '@/data/skills'

const fast = { flushDelayMs: { attempts: 0, skill_mastery: 0, daily_progress: 0, review_queue: 0, generated_reps: 0, study_state: 0 }, retryDelaysMs: [20] }
const repoOf = (engine: SyncEngine) => new RepsRepository(engine, { skillIds: SKILLS.map((s) => s.id), dayFor: (d) => DAY_BY_DATE[d], lastDay: LAST_DAY })

test('export guard: an empty device that has not pulled warns before exporting, and says how many rows it has', async () => {
  const signedOut = new FakeRemoteStore()
  signedOut.signedIn = false
  for (const remote of [null, signedOut]) {
    const engine = new SyncEngine(new MemoryLocalStore(), remote, fast)
    await engine.start()
    const repo = repoOf(engine)
    const g = repo.exportGuard()
    assert.equal(engine.pulled, false)
    assert.equal(g.warn, true, `status ${g.status}`)
    assert.equal(g.message, EXPORT_WARNING)
    const bundle = repo.exportData()
    assert.equal(bundle.syncStatus, engine.status)
    assert.deepEqual(Object.values(bundle.rowCounts ?? {}), [0, 0, 0, 0, 0, 0])
  }
  // Signed in and pulled: no warning.
  const engine = new SyncEngine(new MemoryLocalStore(), new FakeRemoteStore(), fast)
  await engine.start()
  assert.equal(engine.pulled, true)
  assert.equal(repoOf(engine).exportGuard().warn, false)
})

test('export guard: a version-1 bundle without rowCounts or syncStatus still validates and imports', async () => {
  const old = { app: 'reps', version: 1, exportedAt: '2026-11-01T00:00:00Z', attempts: [], review_queue: [] }
  assert.doesNotThrow(() => exportSchema.parse(old))
  const engine = new SyncEngine(new MemoryLocalStore(), null, fast)
  await engine.start()
  await assert.doesNotReject(repoOf(engine).importData(old))
})
