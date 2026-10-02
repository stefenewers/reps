import { TABLES, type LocalStore, type OutboxOp, type RemoteStore, type Row, type SyncStatus, type Table } from '@/lib/storage/types'

/**
 * The sync engine.
 *
 *   save()   → in-memory state updates synchronously (the UI never waits)
 *            → local cache + outbox (IndexedDB)
 *            → debounced flush to Supabase; failures stay queued and retry
 *
 *   start()  → load local cache (instant), then pull from Supabase, reconcile,
 *              write back to the cache, and flush anything pending.
 *
 * Conflicts are kept simple for a single user: a row with a pending local
 * write wins (it is newer and about to be pushed); otherwise Supabase wins.
 */

export interface SyncOptions {
  /** Debounce before pushing, per table. Drafts wait longer than attempts. */
  flushDelayMs?: Partial<Record<Table, number>>
  retryDelaysMs?: number[]
}

const DEFAULT_DELAY = 400
const DEFAULT_RETRY = [2_000, 5_000, 15_000, 60_000]

type Listener = () => void

export class SyncEngine {
  private data = new Map<Table, Map<string, Row>>()
  private snapshots = new Map<Table, Row[]>()
  private pending = new Map<string, string>() // outbox key → queuedAt
  private listeners = new Set<Listener>()
  private flushTimer: ReturnType<typeof setTimeout> | undefined
  private flushDueAt = Infinity
  private flushing: Promise<void> | null = null
  private failures = 0
  private seq = 0
  private writes: Promise<void> = Promise.resolve()
  version = 0
  status: SyncStatus
  lastError: string | null = null
  loaded = false
  pulled = false

  constructor(
    private local: LocalStore,
    private remote: RemoteStore | null,
    private opts: SyncOptions = {},
  ) {
    for (const t of TABLES) this.data.set(t, new Map())
    this.status = remote ? 'signed-out' : 'local-only'
  }

  // ── reading ────────────────────────────────────────────────────────────────

  all<T extends Table>(table: T): Row<T>[] {
    let snap = this.snapshots.get(table)
    if (!snap) {
      snap = [...this.data.get(table)!.values()]
      this.snapshots.set(table, snap)
    }
    return snap as Row<T>[]
  }

  get<T extends Table>(table: T, id: string): Row<T> | undefined {
    return this.data.get(table)!.get(id) as Row<T> | undefined
  }

  pendingCount(): number {
    return this.pending.size
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(changed: Table[] = []) {
    for (const t of changed) this.snapshots.delete(t)
    this.version++
    for (const fn of this.listeners) fn()
  }

  private setStatus(s: SyncStatus) {
    if (this.status === s) return
    this.status = s
    this.emit()
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────

  /** Local cache first (fast), then remote. Never throws. */
  async start(): Promise<void> {
    await this.loadCached()
    await this.pullRemote()
  }

  async loadCached(): Promise<void> {
    try {
      for (const t of TABLES) {
        const rows = await this.local.getAll(t)
        const m = this.data.get(t)!
        for (const r of rows) if (!m.has(r.id)) m.set(r.id, r)
      }
      for (const op of await this.local.outbox()) this.pending.set(op.key, op.queuedAt)
    } catch (e) {
      this.lastError = `local cache unavailable: ${(e as Error).message}`
    }
    this.loaded = true
    this.emit([...TABLES])
  }

  /** Fetch the durable state, reconcile into memory and the cache, then push pending writes. */
  async pullRemote(push = true): Promise<void> {
    if (!this.remote) return this.setStatus('local-only')
    const ready = await this.checkReady()
    if (ready !== true) return
    this.setStatus('syncing')
    try {
      const results = await Promise.all(
        TABLES.map(async (t) => {
          const since = await this.local.getMeta<string>(`cursor:${t}`)
          return { t, ...(await this.remote!.pull(t, since)) }
        }),
      )
      const changed: Table[] = []
      for (const { t, rows, cursor } of results) {
        const accepted = this.reconcile(t, rows)
        if (accepted.length) {
          changed.push(t)
          await this.local.putMany(t, accepted)
        }
        if (cursor) await this.local.setMeta(`cursor:${t}`, cursor)
      }
      this.pulled = true
      this.failures = 0
      this.emit(changed)
    } catch (e) {
      this.lastError = (e as Error).message
      this.setStatus('offline')
      this.scheduleRetry()
      return
    }
    if (push) await this.flush()
  }

  /** Remote rows replace local ones unless a local write for that row is still pending. */
  reconcile<T extends Table>(table: T, rows: Row<T>[]): Row<T>[] {
    const m = this.data.get(table)!
    const accepted: Row<T>[] = []
    for (const r of rows) {
      if (this.pending.has(`${table}:${r.id}`)) continue
      m.set(r.id, r)
      accepted.push(r)
    }
    return accepted
  }

  /** Take rows that came from the remote (outside a full pull) into memory and the cache. */
  async adopt<T extends Table>(table: T, rows: Row<T>[]): Promise<void> {
    const accepted = this.reconcile(table, rows)
    if (!accepted.length) return
    this.emit([table])
    await this.local.putMany(table, accepted)
  }

  /** The remote store, for read-only lookups such as the generated-rep pool. */
  remoteStore(): RemoteStore | null {
    return this.remote
  }

  // ── writing ────────────────────────────────────────────────────────────────

  /** Optimistic: memory now, cache + outbox next, remote after a debounce. */
  save<T extends Table>(table: T, rows: Row<T>[], opts: { flushDelayMs?: number } = {}): Promise<void> {
    if (!rows.length) return Promise.resolve()
    const m = this.data.get(table)!
    const ops: OutboxOp[] = []
    const now = new Date().toISOString()
    for (const r of rows) {
      m.set(r.id, r)
      const key = `${table}:${r.id}`
      const queuedAt = `${now}#${++this.seq}`
      this.pending.set(key, queuedAt)
      ops.push({ key, table, row: r, queuedAt, tries: 0 })
    }
    this.emit([table])
    const write = this.writes.then(async () => {
      try {
        await this.local.putMany(table, rows)
        await this.local.enqueue(ops)
      } catch (e) {
        this.lastError = `local cache write failed: ${(e as Error).message}`
      }
    })
    this.writes = write
    this.scheduleFlush(opts.flushDelayMs ?? this.opts.flushDelayMs?.[table] ?? DEFAULT_DELAY)
    return write
  }

  scheduleFlush(delayMs: number) {
    const due = Date.now() + delayMs
    if (this.flushTimer && due >= this.flushDueAt) return
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushDueAt = due
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined
      this.flushDueAt = Infinity
      void this.flush()
    }, delayMs)
  }

  private scheduleRetry() {
    const delays = this.opts.retryDelaysMs ?? DEFAULT_RETRY
    const d = delays[Math.min(this.failures, delays.length - 1)]
    this.failures++
    this.scheduleFlush(d)
  }

  /** Signed in and reachable? Unreachable means offline (retry later), not signed out. */
  private async checkReady(): Promise<boolean> {
    try {
      if (await this.remote!.ready()) return true
      this.setStatus('signed-out')
    } catch (e) {
      this.lastError = (e as Error).message
      this.setStatus('offline')
      this.scheduleRetry()
    }
    return false
  }

  /** Push the outbox. Safe to call any time; concurrent calls share one run. */
  flush(): Promise<void> {
    if (this.flushing) return this.flushing
    this.flushing = this.doFlush().finally(() => {
      this.flushing = null
    })
    return this.flushing
  }

  private async doFlush(): Promise<void> {
    await this.writes
    if (!this.remote) return this.setStatus('local-only')
    if ((await this.checkReady()) !== true) return
    if (!this.pulled) {
      // Never push before the first successful pull on this device.
      await this.pullRemote(false)
      if (!this.pulled) return
    }

    const ops = await this.local.outbox()
    if (!ops.length) {
      this.failures = 0
      return this.setStatus('saved')
    }
    this.setStatus('syncing')
    const byTable = new Map<Table, OutboxOp[]>()
    for (const o of ops) byTable.set(o.table, [...(byTable.get(o.table) ?? []), o])
    try {
      for (const [table, list] of byTable) {
        await this.remote.upsert(table, list.map((o) => o.row))
        await this.local.ack(list)
        for (const o of list) if (this.pending.get(o.key) === o.queuedAt) this.pending.delete(o.key)
      }
      this.failures = 0
      this.lastError = null
      const more = (await this.local.outbox()).length
      if (more) this.scheduleFlush(DEFAULT_DELAY)
      this.setStatus(more ? 'syncing' : 'saved')
    } catch (e) {
      this.lastError = (e as Error).message
      this.setStatus('offline')
      this.scheduleRetry()
    }
  }

  /** Drop everything local (used when switching accounts). */
  async reset(): Promise<void> {
    await this.local.clear()
    for (const t of TABLES) this.data.set(t, new Map())
    this.pending.clear()
    this.pulled = false
    this.emit([...TABLES])
  }

  dispose() {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.listeners.clear()
  }
}
