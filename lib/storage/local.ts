import { openDB, type IDBPDatabase } from 'idb'
import { TABLES, type LocalStore, type OutboxOp, type Row, type Table } from '@/lib/storage/types'

/**
 * The local cache. It gives instant reads and survives offline periods, and
 * holds the outbox of writes not yet confirmed by Supabase. It is not the
 * durable record: that is Supabase.
 */

const DB_NAME = 'reps'
const DB_VERSION = 1

export class IndexedDbLocalStore implements LocalStore {
  private db: Promise<IDBPDatabase>

  constructor(name = DB_NAME) {
    this.db = openDB(name, DB_VERSION, {
      upgrade(db) {
        for (const t of TABLES) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: 'id' })
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'key' })
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
      },
    })
  }

  async getAll<T extends Table>(table: T): Promise<Row<T>[]> {
    return (await this.db).getAll(table) as Promise<Row<T>[]>
  }

  async putMany<T extends Table>(table: T, rows: Row<T>[]): Promise<void> {
    if (!rows.length) return
    const tx = (await this.db).transaction(table, 'readwrite')
    await Promise.all([...rows.map((r) => tx.store.put(r)), tx.done])
  }

  async enqueue(ops: OutboxOp[]): Promise<void> {
    if (!ops.length) return
    const tx = (await this.db).transaction('outbox', 'readwrite')
    await Promise.all([...ops.map((o) => tx.store.put(o)), tx.done])
  }

  async outbox(): Promise<OutboxOp[]> {
    return (await this.db).getAll('outbox') as Promise<OutboxOp[]>
  }

  async ack(ops: Pick<OutboxOp, 'key' | 'queuedAt'>[]): Promise<void> {
    if (!ops.length) return
    const tx = (await this.db).transaction('outbox', 'readwrite')
    for (const o of ops) {
      const cur = (await tx.store.get(o.key)) as OutboxOp | undefined
      if (cur && cur.queuedAt === o.queuedAt) await tx.store.delete(o.key)
    }
    await tx.done
  }

  async getMeta<V>(key: string): Promise<V | undefined> {
    return (await this.db).get('meta', key) as Promise<V | undefined>
  }

  async setMeta<V>(key: string, value: V): Promise<void> {
    await (await this.db).put('meta', value, key)
  }

  async clear(): Promise<void> {
    const db = await this.db
    for (const s of [...TABLES, 'outbox', 'meta']) await db.clear(s)
  }
}

/** In-memory implementation for tests and for browsers that block IndexedDB. */
export class MemoryLocalStore implements LocalStore {
  tables = new Map<Table, Map<string, Row>>()
  box = new Map<string, OutboxOp>()
  meta = new Map<string, unknown>()

  private t(table: Table) {
    let m = this.tables.get(table)
    if (!m) this.tables.set(table, (m = new Map()))
    return m
  }

  async getAll<T extends Table>(table: T): Promise<Row<T>[]> {
    return [...this.t(table).values()].map((r) => structuredClone(r)) as Row<T>[]
  }
  async putMany<T extends Table>(table: T, rows: Row<T>[]): Promise<void> {
    for (const r of rows) this.t(table).set(r.id, structuredClone(r))
  }
  async enqueue(ops: OutboxOp[]): Promise<void> {
    for (const o of ops) this.box.set(o.key, structuredClone(o))
  }
  async outbox(): Promise<OutboxOp[]> {
    return [...this.box.values()].map((o) => structuredClone(o))
  }
  async ack(ops: Pick<OutboxOp, 'key' | 'queuedAt'>[]): Promise<void> {
    for (const o of ops) if (this.box.get(o.key)?.queuedAt === o.queuedAt) this.box.delete(o.key)
  }
  async getMeta<V>(key: string): Promise<V | undefined> {
    return this.meta.get(key) as V | undefined
  }
  async setMeta<V>(key: string, value: V): Promise<void> {
    this.meta.set(key, value)
  }
  async clear(): Promise<void> {
    this.tables.clear()
    this.box.clear()
    this.meta.clear()
  }
}

export function createLocalStore(): LocalStore {
  try {
    if (typeof indexedDB !== 'undefined') return new IndexedDbLocalStore()
  } catch {
    /* blocked: fall through */
  }
  return new MemoryLocalStore()
}
