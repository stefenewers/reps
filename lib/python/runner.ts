import type { TestCase } from '@/lib/types'

/**
 * Client-side Python. Pyodide lives in a Web Worker and is loaded the first
 * time a rep actually needs Python. Each run has a timeout; on timeout the
 * worker is terminated (the only way to stop a runaway loop) and a fresh one
 * is started lazily on the next run.
 */

export const PYODIDE_VERSION = '314.0.7'
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
export const DEFAULT_TIMEOUT_MS = 5000
const LOAD_TIMEOUT_MS = 90_000

export interface TestResult {
  name: string
  passed: boolean
  hidden: boolean
  call: string | null
  expected: string | null
  actual: string | null
  error: string | null
  stdout: string
}

export interface RunResult {
  stdout: string
  error: string | null
  errorLine: number | null
  tests: TestResult[]
  timedOut?: boolean
  /** The worker crashed or Python failed to load. */
  infraError?: string
  durationMs: number
}

export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error'

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void }

/** Anything with the Worker surface we use, so tests can inject a fake. */
export interface WorkerLike {
  postMessage(msg: unknown): void
  terminate(): void
  onmessage: ((e: MessageEvent) => void) | null
  onerror: ((e: ErrorEvent) => void) | null
}

export class PythonRunner {
  private worker: WorkerLike | null = null
  private ready: Promise<void> | null = null
  private pending = new Map<number, Pending>()
  private nextId = 1
  private listeners = new Set<(s: RunnerStatus) => void>()
  status: RunnerStatus = 'idle'

  constructor(private createWorker: () => WorkerLike = () => new Worker('/python/worker.js', { type: 'module' }) as unknown as WorkerLike) {}

  onStatus(fn: (s: RunnerStatus) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private setStatus(s: RunnerStatus) {
    this.status = s
    for (const fn of this.listeners) fn(s)
  }

  private call<T>(msg: Record<string, unknown>): Promise<T> {
    const id = this.nextId++
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
      this.worker!.postMessage({ ...msg, id })
    })
  }

  /** Start loading Python (idempotent). */
  ensure(): Promise<void> {
    if (this.ready) return this.ready
    this.setStatus('loading')
    const worker = this.createWorker()
    this.worker = worker
    worker.onmessage = (e: MessageEvent) => {
      const { id, type, result, error } = e.data as { id: number; type: string; result?: unknown; error?: string }
      const p = this.pending.get(id)
      if (!p) return
      this.pending.delete(id)
      if (type === 'error') p.reject(new Error(error))
      else p.resolve(result)
    }
    worker.onerror = (e: ErrorEvent) => {
      const err = new Error(e.message || 'Python worker crashed')
      for (const p of this.pending.values()) p.reject(err)
      this.pending.clear()
      this.reset()
    }
    this.ready = withTimeout(this.call<void>({ type: 'init', indexURL: PYODIDE_INDEX_URL }), LOAD_TIMEOUT_MS, 'Loading Python timed out')
      .then(() => this.setStatus('ready'))
      .catch((e: Error) => {
        this.reset()
        this.setStatus('error')
        throw e
      })
    return this.ready
  }

  /** Kill the worker; the next run starts a fresh interpreter. */
  reset() {
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    for (const p of this.pending.values()) p.reject(new Error('Python restarted'))
    this.pending.clear()
  }

  async run(code: string, tests: TestCase[] = [], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RunResult> {
    const started = performance.now()
    try {
      await this.ensure()
    } catch (e) {
      return { stdout: '', error: null, errorLine: null, tests: [], infraError: (e as Error).message, durationMs: 0 }
    }
    this.setStatus('running')
    try {
      const result = await withTimeout(this.call<Omit<RunResult, 'durationMs'>>({ type: 'run', code, tests }), timeoutMs, 'TIMEOUT')
      this.setStatus('ready')
      return { ...result, durationMs: performance.now() - started }
    } catch (e) {
      const msg = (e as Error).message
      if (msg === 'TIMEOUT') {
        this.reset()
        this.setStatus('idle')
        return {
          stdout: '',
          error: `Stopped after ${Math.round(timeoutMs / 1000)}s. Possible infinite loop: check that every loop makes progress. Python was restarted.`,
          errorLine: null,
          tests: tests.map((t) => ({ name: t.name ?? t.call ?? 'test', passed: false, hidden: Boolean(t.hidden), call: t.call ?? null, expected: null, actual: null, error: 'Not run (timed out)', stdout: '' })),
          timedOut: true,
          durationMs: performance.now() - started,
        }
      }
      this.reset()
      this.setStatus('error')
      return { stdout: '', error: null, errorLine: null, tests: [], infraError: msg, durationMs: performance.now() - started }
    }
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    p.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

let shared: PythonRunner | null = null

export function getRunner(): PythonRunner {
  if (!shared) shared = new PythonRunner()
  return shared
}
