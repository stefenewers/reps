import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

/**
 * Applies supabase/migrations/0005_reps.sql to a real Postgres (PGlite) with a
 * minimal stand-in for Supabase's auth schema and roles, then checks the
 * security model: the owner reads and writes their rows, another signed-in
 * user of the shared project sees nothing and cannot write, anon has no access.
 */

const OWNER = '11111111-1111-1111-1111-111111111111'
const OTHER = '22222222-2222-2222-2222-222222222222'

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  -- An existing stefenewers.com table that must be left untouched.
  create table public.innawords_contributors (id uuid primary key);
`

async function setup() {
  const db = new PGlite()
  await db.exec(SUPABASE_STUB)
  await db.exec(readFileSync(path.join(process.cwd(), 'supabase/migrations/0005_reps.sql'), 'utf8'))
  await db.exec(`insert into auth.users values ('${OWNER}', 'owner@example.com'), ('${OTHER}', 'other@example.com');`)
  await db.exec(`insert into public.reps_owners (user_id) values ('${OWNER}');`)
  return db
}

async function as(db: PGlite, role: 'authenticated' | 'anon', sub: string | null, sql: string) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false); set role ${role};`)
  try {
    return await db.query(sql)
  } finally {
    await db.exec('reset role;')
  }
}

const attemptInsert = (id: string) => `insert into public.reps_attempts (id, exercise_id, study_date, stage, mode, retrieval_type, started_at, passed)
  values ('${id}', 'cap-two-sum', '2026-10-02', 'capstone', 'learn', 'first-exposure', now(), true)`

test('migration applies cleanly and is re-runnable', async () => {
  const db = await setup()
  await db.exec(readFileSync(path.join(process.cwd(), 'supabase/migrations/0005_reps.sql'), 'utf8'))
  const { rows } = await db.query<{ table_name: string }>(`select table_name from information_schema.tables where table_schema = 'public' order by 1`)
  const names = rows.map((r) => r.table_name)
  for (const t of ['reps_attempts', 'reps_skill_mastery', 'reps_daily_progress', 'reps_review_queue', 'reps_generated_reps', 'reps_study_state', 'reps_owners']) assert.ok(names.includes(t), t)
  assert.ok(names.includes('innawords_contributors'), 'existing tables untouched')
  const created = names.filter((n) => n !== 'innawords_contributors')
  assert.ok(created.every((n) => n.startsWith('reps_')), 'every new object is namespaced')
})

test('the owner can write and read their rows; user_id defaults to auth.uid()', async () => {
  const db = await setup()
  await as(db, 'authenticated', OWNER, attemptInsert('aaaaaaaa-0000-0000-0000-000000000001'))
  const { rows } = await as(db, 'authenticated', OWNER, 'select user_id, exercise_id from public.reps_attempts')
  assert.equal(rows.length, 1)
  assert.equal((rows[0] as { user_id: string }).user_id, OWNER)
})

test('another signed-in user of the shared project can neither read nor write Reps data', async () => {
  const db = await setup()
  await as(db, 'authenticated', OWNER, attemptInsert('aaaaaaaa-0000-0000-0000-000000000002'))
  const { rows } = await as(db, 'authenticated', OTHER, 'select * from public.reps_attempts')
  assert.equal(rows.length, 0)
  await assert.rejects(() => as(db, 'authenticated', OTHER, attemptInsert('aaaaaaaa-0000-0000-0000-000000000003')), /row-level security/)
  await assert.rejects(() => as(db, 'authenticated', OTHER, `select * from public.reps_owners`), /permission denied/)
})

test('anon has no access at all', async () => {
  const db = await setup()
  await assert.rejects(() => as(db, 'anon', null, 'select * from public.reps_attempts'), /permission denied/)
  await assert.rejects(() => as(db, 'anon', null, attemptInsert('aaaaaaaa-0000-0000-0000-000000000004')), /permission denied/)
})

test('a finished attempt cannot be reverted to unfinished', async () => {
  const db = await setup()
  const id = 'aaaaaaaa-0000-0000-0000-000000000005'
  await as(db, 'authenticated', OWNER, attemptInsert(id))
  await as(db, 'authenticated', OWNER, `update public.reps_attempts set completed_at = now() where id = '${id}'`)
  await as(db, 'authenticated', OWNER, `update public.reps_attempts set completed_at = null, passed = false where id = '${id}'`)
  const { rows } = await as(db, 'authenticated', OWNER, `select completed_at, passed from public.reps_attempts where id = '${id}'`)
  const r = rows[0] as { completed_at: string | null; passed: boolean }
  assert.ok(r.completed_at)
  assert.equal(r.passed, true)
})

test('upsert on (user_id, id) is idempotent, so retried writes never duplicate', async () => {
  const db = await setup()
  const id = 'aaaaaaaa-0000-0000-0000-000000000006'
  for (let i = 0; i < 3; i++) await as(db, 'authenticated', OWNER, `${attemptInsert(id)} on conflict (user_id, id) do update set hints_used = excluded.hints_used`)
  const { rows } = await as(db, 'authenticated', OWNER, 'select count(*)::int as n from public.reps_attempts')
  assert.equal((rows[0] as { n: number }).n, 1)
})

test('reps_is_owner() reflects the owner list', async () => {
  const db = await setup()
  const a = await as(db, 'authenticated', OWNER, 'select public.reps_is_owner() as ok')
  const b = await as(db, 'authenticated', OTHER, 'select public.reps_is_owner() as ok')
  assert.equal((a.rows[0] as { ok: boolean }).ok, true)
  assert.equal((b.rows[0] as { ok: boolean }).ok, false)
})
