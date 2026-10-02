import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PythonRunner, type WorkerLike } from '@/lib/python/runner'

/**
 * Worker failure behaviour, with a fake worker. (Real Pyodide execution is
 * covered by the browser test and by the content verifier's python3 runs.)
 */
class FakeWorker implements WorkerLike {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  terminated = false
  constructor(private behaviour: { hang?: boolean; crash?: boolean; failLoad?: boolean }) {}
  postMessage(msg: { id: number; type: string; code?: string }) {
    setTimeout(() => {
      if (this.terminated) return
      if (msg.type === 'init') {
        if (this.behaviour.failLoad) return this.onmessage?.({ data: { id: msg.id, type: 'error', error: 'network down' } } as MessageEvent)
        return this.onmessage?.({ data: { id: msg.id, type: 'ready' } } as MessageEvent)
      }
      if (this.behaviour.crash) return this.onerror?.({ message: 'worker crashed' } as ErrorEvent)
      if (this.behaviour.hang || msg.code?.includes('while True')) return // never answers
      this.onmessage?.({ data: { id: msg.id, type: 'result', result: { stdout: 'ok\n', error: null, errorLine: null, tests: [] } } } as MessageEvent)
    }, 1)
  }
  terminate() {
    this.terminated = true
  }
}

test('a runaway loop times out, the worker is terminated, and the next run uses a fresh one', async () => {
  const workers: FakeWorker[] = []
  const r = new PythonRunner(() => {
    const w = new FakeWorker({})
    workers.push(w)
    return w
  })
  const res = await r.run('while True:\n    pass', [{ call: 'f()', expected: '1' }], 50)
  assert.equal(res.timedOut, true)
  assert.match(res.error!, /infinite loop/)
  assert.equal(res.tests[0].passed, false)
  assert.equal(workers[0].terminated, true)
  const ok = await r.run('print("ok")', [], 50)
  assert.equal(ok.stdout, 'ok\n')
  assert.equal(workers.length, 2)
})

test('a worker crash is reported, not thrown, and Python restarts on the next run', async () => {
  let n = 0
  const r = new PythonRunner(() => new FakeWorker({ crash: n++ === 0 }))
  const res = await r.run('x = 1', [], 200)
  assert.ok(res.infraError)
  const ok = await r.run('x = 1', [], 200)
  assert.equal(ok.infraError, undefined)
})

test('a failed load surfaces as an infra error and can be retried', async () => {
  let n = 0
  const r = new PythonRunner(() => new FakeWorker({ failLoad: n++ === 0 }))
  const res = await r.run('x = 1')
  assert.match(res.infraError!, /network down/)
  assert.equal(r.status, 'error')
  const ok = await r.run('x = 1')
  assert.equal(ok.stdout, 'ok\n')
})

test('Python is loaded lazily, only on first use', async () => {
  let created = 0
  const r = new PythonRunner(() => (created++, new FakeWorker({})))
  assert.equal(created, 0)
  await r.run('x = 1')
  await r.run('x = 2')
  assert.equal(created, 1)
})
