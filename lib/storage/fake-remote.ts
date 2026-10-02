import { TABLES, type GeneratedRepRow, type RemoteStore, type Row, type Table } from '@/lib/storage/types'

/**
 * In-memory stand-in for Supabase, for tests. Behaves like the real schema:
 * server-assigned updated_at (the sync cursor), upsert by id, and the
 * "a completed attempt is never un-completed" trigger. Can be taken offline.
 */
export class FakeRemoteStore implements RemoteStore {
  tables = new Map<Table, Map<string, Row>>()
  online = true
  signedIn = true
  upserts = 0
  private clock = Date.parse('2026-10-02T12:00:00Z')

  constructor() {
    for (const t of TABLES) this.tables.set(t, new Map())
  }

  private tick(): string {
    this.clock += 1000
    return new Date(this.clock).toISOString()
  }

  private check() {
    if (!this.online) throw new Error('network error: offline')
  }

  async ready(): Promise<boolean> {
    this.check()
    return this.signedIn
  }

  async upsert<T extends Table>(table: T, rows: Row<T>[]): Promise<void> {
    this.check()
    this.upserts++
    const m = this.tables.get(table)!
    for (const r of rows) {
      const prev = m.get(r.id) as (Row & { completedAt?: string }) | undefined
      if (table === 'attempts' && prev?.completedAt && !(r as { completedAt?: string }).completedAt) continue
      m.set(r.id, structuredClone({ ...r, updatedAt: this.tick() }))
    }
  }

  async pull<T extends Table>(table: T, since?: string): Promise<{ rows: Row<T>[]; cursor?: string }> {
    this.check()
    const rows = [...this.tables.get(table)!.values()].filter((r) => !since || r.updatedAt >= since).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    return { rows: structuredClone(rows) as Row<T>[], cursor: rows.length ? rows[rows.length - 1].updatedAt : since }
  }

  async findGenerated(cacheKey: string, excludeSignatures: string[]): Promise<GeneratedRepRow | null> {
    this.check()
    const ex = new Set(excludeSignatures)
    const hit = ([...this.tables.get('generated_reps')!.values()] as GeneratedRepRow[]).find((g) => g.cacheKey === cacheKey && g.validated && !g.usedAt && !ex.has(g.signature))
    return hit ? structuredClone(hit) : null
  }

  count(table: Table): number {
    return this.tables.get(table)!.size
  }
}
