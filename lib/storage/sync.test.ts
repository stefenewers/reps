import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryLocalStore } from '@/lib/storage/local'
import { FakeRemoteStore } from '@/lib/storage/fake-remote'
import { SyncEngine } from '@/lib/storage/sync'
import { RepsRepository } from '@/lib/storage/repository'
import { findCachedRep, cacheKey } from '@/lib/coach/cache'
import { computeSkillMastery } from '@/lib/mastery'
import { attempt, exercise, sleep } from '@/lib/test-helpers'
import { DAY_BY_DATE, LAST_DAY, EXERCISE_BY_ID } from '@/data/curriculum'
import { SKILLS } from '@/data/skills'
import type { GeneratedRepRow } from '@/lib/storage/types'

const fast = { flushDelayMs: { attempts: 0, skill_mastery: 0, daily_progress: 0, review_queue: 0, generated_reps: 0, study_state: 0 }, retryDelaysMs: [20, 20] }
const NOW = () => new Date(2026, 9, 2, 10)

function device(remote: FakeRemoteStore | null, local = new MemoryLocalStore()) {
  const engine = new SyncEngine(local, remote, fast)
  const repo = new RepsRepository(engine, { skillIds: SKILLS.map((s) => s.id), dayFor: (d) => DAY_BY_DATE[d], lastDay: LAST_DAY, now: NOW })
  return { engine, repo, local }
}

const rep = EXERCISE_BY_ID['cap-two-sum']
const done = (over = {}) => attempt({ exerciseId: rep.id, skills: rep.skills, stage: rep.stage, ...over })

async function settle(engine: SyncEngine) {
  await sleep(5)
  await engine.flush()
  await sleep(5)
}

test('local save: state updates immediately and lands in the local cache', async () => {
  const { engine, repo, local } = device(null)
  await engine.start()
  const a = done()
  const p = repo.recordAttempt(a, rep)
  assert.equal(repo.attempts().length, 1, 'optimistic, before any await')
  await p
  assert.equal((await local.getAll('attempts')).length, 1)
  assert.equal(engine.status, 'local-only')
})

test('remote sync: attempt, mastery, daily progress and reviews reach the durable store', async () => {
  const remote = new FakeRemoteStore()
  const { engine, repo } = device(remote)
  await engine.start()
  await repo.recordAttempt(done(), rep)
  await settle(engine)
  assert.equal(remote.count('attempts'), 1)
  assert.ok(remote.count('skill_mastery') >= rep.skills.length)
  assert.equal(remote.count('daily_progress'), 1)
  assert.ok(remote.count('review_queue') >= 1)
  assert.equal(engine.status, 'saved')
  assert.equal(engine.pendingCount(), 0)
})

test('offline: writes queue locally, nothing is lost, and they flush when back online', async () => {
  const remote = new FakeRemoteStore()
  const { engine, repo, local } = device(remote)
  await engine.start()
  remote.online = false
  await repo.recordAttempt(done(), rep)
  await repo.recordAttempt(done(), rep)
  await settle(engine)
  assert.equal(engine.status, 'offline')
  assert.ok((await local.outbox()).length >= 2, 'pending writes retained')
  assert.equal(remote.count('attempts'), 0)
  remote.online = true
  await sleep(40) // backoff retry fires
  await engine.flush()
  assert.equal(remote.count('attempts'), 2)
  assert.equal((await local.outbox()).length, 0)
  assert.equal(engine.status, 'saved')
})

test('restore: a reload reads the cache instantly, including pending writes', async () => {
  const remote = new FakeRemoteStore()
  const local = new MemoryLocalStore()
  const first = device(remote, local)
  await first.engine.start()
  remote.online = false
  await first.repo.recordAttempt(done(), rep)
  // "refresh": a new engine over the same local cache, still offline
  const second = device(remote, local)
  await second.engine.loadCached()
  assert.equal(second.repo.attempts().length, 1)
  assert.equal(second.engine.pendingCount() > 0, true)
  remote.online = true
  await second.engine.pullRemote()
  assert.equal(remote.count('attempts'), 1)
})

test('no duplicate attempts: retries and re-imports are idempotent by id', async () => {
  const remote = new FakeRemoteStore()
  const { engine, repo } = device(remote)
  await engine.start()
  const a = done()
  await repo.recordAttempt(a, rep)
  await repo.recordAttempt(a, rep)
  await settle(engine)
  await engine.flush()
  assert.equal(remote.count('attempts'), 1)
  const bundle = repo.exportData()
  const { added } = await repo.importData(JSON.parse(JSON.stringify(bundle)))
  assert.equal(added.attempts, 0)
  assert.equal(repo.attempts().length, 1)
})

test('a finished attempt is never overwritten by a stale unfinished version', async () => {
  const remote = new FakeRemoteStore()
  const { engine, repo } = device(remote)
  await engine.start()
  const a = done()
  await repo.recordAttempt(a, rep)
  await repo.recordAttempt({ ...a, completedAt: undefined, passed: false }, rep)
  await settle(engine)
  assert.ok(repo.attempts()[0].completedAt)
  await remote.upsert('attempts', [{ ...a, completedAt: undefined, passed: false }])
  assert.ok([...remote.tables.get('attempts')!.values()][0] && (remote.tables.get('attempts')!.get(a.id) as typeof a).completedAt)
})

test('mastery persistence: the stored snapshot equals a recomputation from attempts', async () => {
  const remote = new FakeRemoteStore()
  const { engine, repo } = device(remote)
  await engine.start()
  await repo.recordAttempt(done(), rep)
  await repo.recordAttempt(done({ hintsUsed: 2 }), rep)
  await settle(engine)
  for (const s of rep.skills) {
    const stored = remote.tables.get('skill_mastery')!.get(s) as { score: number; status: string }
    const fresh = computeSkillMastery(s, repo.attempts())
    assert.equal(stored.score, fresh.score)
    assert.equal(stored.status, fresh.status)
  }
})

test('device A → device B: durable progress is available on a fresh device', async () => {
  const remote = new FakeRemoteStore()
  const a = device(remote)
  await a.engine.start()
  await a.repo.recordAttempt(done(), rep)
  await a.repo.saveDraft('cap-valid-anagram', 'def is_anagram(s, t):\n    ...')
  await settle(a.engine)

  const b = device(remote) // empty cache
  await b.engine.start()
  assert.equal(b.repo.attempts().length, 1)
  assert.equal(b.repo.draft('cap-valid-anagram'), 'def is_anagram(s, t):\n    ...')
  assert.equal(b.repo.masteryRows().length, a.repo.masteryRows().length)
  assert.deepEqual(
    b.repo.dailyRows().map((r) => [r.studyDate, r.completedReps]),
    a.repo.dailyRows().map((r) => [r.studyDate, r.completedReps]),
  )
})

test('reconciliation on reload: remote wins unless a local write is still pending', async () => {
  const remote = new FakeRemoteStore()
  const a = device(remote)
  await a.engine.start()
  await a.repo.setState('location', { exerciseId: 'one' })
  await settle(a.engine)

  // Another device moves on.
  const b = device(remote)
  await b.engine.start()
  await b.repo.setState('location', { exerciseId: 'two' })
  await settle(b.engine)

  // A has an unsynced edit to a different key, and pulls.
  remote.online = false
  await a.repo.setState('draft:x', { code: 'local' })
  remote.online = true
  await a.engine.pullRemote(false)
  assert.deepEqual(a.repo.state('location'), { exerciseId: 'two' }, 'remote newer value adopted')
  assert.deepEqual(a.repo.state('draft:x'), { code: 'local' }, 'pending local write kept')
  await a.engine.flush()
  assert.deepEqual((remote.tables.get('study_state')!.get('draft:x') as { value: unknown }).value, { code: 'local' })
})

test('generated rep cache: local first, then the durable pool, before any model call', async () => {
  const remote = new FakeRemoteStore()
  const key = cacheKey(['dict_get'], 2, 'foundation')
  const row: GeneratedRepRow = {
    id: 'g1',
    cacheKey: key,
    signature: 'freq-map:count-items',
    type: 'foundation',
    difficulty: 2,
    skills: ['dict_get'],
    payload: exercise({ id: 'gen-g1' }),
    validated: true,
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-02T09:00:00Z',
  }
  // Device A generated it and left it unused.
  const a = device(remote)
  await a.engine.start()
  await a.repo.saveGenerated([row])
  await settle(a.engine)

  // Device B pulls nothing yet (simulate a cold cache by not starting), and finds it remotely.
  const b = device(remote)
  await b.engine.loadCached()
  const hit = await findCachedRep(b.repo, key, [])
  assert.equal(hit?.source, 'remote')
  assert.equal(hit?.row.id, 'g1')
  // Now it is cached locally too.
  assert.equal((await findCachedRep(b.repo, key, []))?.source, 'local')
  // A recent identical signature is skipped.
  assert.equal(await findCachedRep(b.repo, key, ['freq-map:count-items']), null)
  // Once used, it is no longer offered anywhere.
  await b.repo.markGeneratedUsed('g1')
  await settle(b.engine)
  assert.equal(await findCachedRep(b.repo, key, []), null)
})

test('signed out: progress stays local and nothing is pushed', async () => {
  const remote = new FakeRemoteStore()
  remote.signedIn = false
  const { engine, repo, local } = device(remote)
  await engine.start()
  await repo.recordAttempt(done(), rep)
  await settle(engine)
  assert.equal(engine.status, 'signed-out')
  assert.equal(remote.upserts, 0)
  assert.ok((await local.outbox()).length > 0)
  remote.signedIn = true
  await engine.pullRemote()
  assert.equal(remote.count('attempts'), 1)
})

test('import validates its schema before writing anything', async () => {
  const { engine, repo } = device(null)
  await engine.start()
  await assert.rejects(() => repo.importData({ app: 'reps', version: 1, attempts: [{ id: 'x' }] }))
  assert.equal(repo.attempts().length, 0)
})

test('derived rows that did not change are not re-synced', async () => {
  const remote = new FakeRemoteStore()
  const { engine, repo } = device(remote)
  await engine.start()
  await repo.recordAttempt(done(), rep)
  await settle(engine)
  const before = remote.upserts
  await repo.refreshDerived()
  await settle(engine)
  assert.equal(remote.upserts, before)
})
