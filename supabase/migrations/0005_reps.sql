-- Reps: private study progress, added to the existing stefenewers.com Supabase
-- project.
--
-- Additive only. Every object this file creates is prefixed `reps_`. It does not
-- touch any existing table, policy, function, trigger or auth setting, and it
-- can be re-run safely (if not exists / or replace / drop-if-exists on its
-- own objects only).
--
-- Access model
--   * Each reps_* table is keyed by (user_id, <id>); user_id defaults to auth.uid().
--   * RLS on every table: a row is visible and writable only when
--       user_id = auth.uid()  AND  auth.uid() is listed in reps_owners.
--     Other users of this project (e.g. InnaWords contributors) can sign in for
--     their own features but can never read or write Reps data.
--   * anon has no grants on anything here. No service-role key is needed.
--
-- One-time setup after applying (SQL editor), with your own account's email:
--   insert into public.reps_owners (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;

-- ── owners ──────────────────────────────────────────────────────────────────

create table if not exists public.reps_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.reps_owners enable row level security;
revoke all on public.reps_owners from anon, authenticated;
-- No policies: the owner list is managed from the SQL editor only.

create or replace function public.reps_is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.reps_owners where user_id = auth.uid());
$$;
revoke all on function public.reps_is_owner() from public, anon;
grant execute on function public.reps_is_owner() to authenticated;

-- ── helpers ─────────────────────────────────────────────────────────────────

-- updated_at is always server time: it is the incremental sync cursor.
create or replace function public.reps_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- A finished attempt is history: a replayed write of the unfinished version
-- must never overwrite it.
create or replace function public.reps_keep_completed_attempt()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.completed_at is not null and new.completed_at is null then
    return old;
  end if;
  return new;
end;
$$;

-- ── reps_attempts: the canonical evidence ───────────────────────────────────

create table if not exists public.reps_attempts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  exercise_id text not null,
  study_date date not null,
  skills text[] not null default '{}',
  stage text not null,
  mode text not null check (mode in ('learn', 'practice', 'interview')),
  code text,
  answer text,
  passed boolean not null default false,
  attempts_before_pass integer not null default 0 check (attempts_before_pass >= 0),
  hints_used integer not null default 0 check (hints_used >= 0),
  solution_viewed boolean not null default false,
  runtime_errors text[] not null default '{}',
  duration_seconds integer check (duration_seconds >= 0),
  confidence smallint check (confidence between 1 and 5),
  mistake_type text,
  mistake_note text,
  retrieval_type text not null check (retrieval_type in ('first-exposure', 'immediate-reconstruction', 'cold')),
  session_kind text,
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists reps_attempts_user_updated on public.reps_attempts (user_id, updated_at);
create index if not exists reps_attempts_user_exercise on public.reps_attempts (user_id, exercise_id);

drop trigger if exists reps_attempts_keep_completed on public.reps_attempts;
create trigger reps_attempts_keep_completed before update on public.reps_attempts
  for each row execute function public.reps_keep_completed_attempt();

-- ── reps_skill_mastery: deterministic snapshot, recomputable from attempts ──

create table if not exists public.reps_skill_mastery (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  skill_id text not null,
  mastery_score integer not null check (mastery_score between 0 and 100),
  status text not null check (status in ('unseen', 'introduced', 'practicing', 'competent', 'fluent', 'weak')),
  attempts integer not null default 0,
  correct_attempts integer not null default 0,
  incorrect_attempts integer not null default 0,
  consecutive_correct integer not null default 0,
  cold_correct integer not null default 0,
  hints_used integer not null default 0,
  solution_views integer not null default 0,
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create index if not exists reps_skill_mastery_user_updated on public.reps_skill_mastery (user_id, updated_at);

-- ── reps_daily_progress ─────────────────────────────────────────────────────

create table if not exists public.reps_daily_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  study_date date not null,
  completed_reps integer not null default 0,
  total_reps integer not null default 0,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  sections_completed text[] not null default '{}',
  completed boolean not null default false,
  time_spent_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, study_date)
);
create index if not exists reps_daily_progress_user_updated on public.reps_daily_progress (user_id, updated_at);

-- ── reps_review_queue ───────────────────────────────────────────────────────

create table if not exists public.reps_review_queue (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null, -- 'skill:<skill_id>' or 'ex:<exercise_id>'
  review_type text not null check (review_type in ('skill', 'exercise')),
  skill_id text,
  exercise_id text,
  due_at timestamptz not null,
  step integer not null default 0,
  reason text not null check (reason in ('scheduled', 'failed', 'shaky')),
  status text not null default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists reps_review_queue_user_due on public.reps_review_queue (user_id, status, due_at);
create index if not exists reps_review_queue_user_updated on public.reps_review_queue (user_id, updated_at);

-- ── reps_generated_reps: the reusable pool that keeps model spend low ───────

create table if not exists public.reps_generated_reps (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  cache_key text not null, -- sorted skills | difficulty | type
  signature text not null,
  type text not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  skills text[] not null default '{}',
  payload jsonb not null,
  validated boolean not null default false,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists reps_generated_reps_unused on public.reps_generated_reps (user_id, cache_key) where used_at is null and validated;
create index if not exists reps_generated_reps_user_updated on public.reps_generated_reps (user_id, updated_at);

-- ── reps_study_state: drafts, current location, mock results, sessions ──────

create table if not exists public.reps_study_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists reps_study_state_user_updated on public.reps_study_state (user_id, updated_at);

-- ── timestamps, RLS, grants (Reps tables only) ──────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'reps_attempts', 'reps_skill_mastery', 'reps_daily_progress',
    'reps_review_queue', 'reps_generated_reps', 'reps_study_state'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.reps_touch_updated_at()', t || '_touch', t);

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists %I on public.%I', t || '_owner_rows', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (user_id = (select auth.uid()) and (select public.reps_is_owner()))
         with check (user_id = (select auth.uid()) and (select public.reps_is_owner()))',
      t || '_owner_rows', t
    );
  end loop;
end;
$$;
