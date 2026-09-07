import { Pool } from 'pg'
import type { ProgressState } from './types'

/**
 * One row per user holding the whole ProgressState as JSON.
 *
 * There is no relational shape here on purpose: progress is read whole and
 * written whole, never queried by field, so a blob is the right fit and needs
 * no migrations as the state grows. If that ever changes — reporting across
 * users, say — this is where it would become real columns.
 */

declare global {
  // eslint-disable-next-line no-var
  var _sdgymPool: Pool | undefined
  // eslint-disable-next-line no-var
  var _sdgymSchemaReady: Promise<void> | undefined
}

function pool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — progress sync needs a Postgres connection string')
  }
  // reused across serverless invocations on the same instance; without this you
  // open a connection per request and exhaust the database's limit under load
  globalThis._sdgymPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  })
  return globalThis._sdgymPool
}

/** Created lazily and once per instance, so there is no migration step to run. */
function schemaReady(): Promise<void> {
  globalThis._sdgymSchemaReady ??= pool()
    .query(
      `create table if not exists progress (
         user_id    text primary key,
         data       jsonb not null,
         updated_at timestamptz not null default now()
       )`,
    )
    .then(() =>
      pool().query(
        `create table if not exists users (
           user_id      text primary key,
           name         text,
           email        text,
           created_at   timestamptz not null default now(),
           last_seen_at timestamptz not null default now(),
           login_count  integer not null default 1
         )`,
      ),
    )
    .then(() => undefined)
  return globalThis._sdgymSchemaReady
}

/**
 * Record a sign-in or an active request. `created_at` is only set on insert, so
 * it records registration; `last_seen_at` moves forward on every call.
 * `login_count` only increments on a real sign-in, not on every API request.
 */
export async function touchUser(
  userId: string,
  name: string | null,
  email: string | null,
  isNewLogin: boolean,
): Promise<void> {
  await schemaReady()
  await pool().query(
    `insert into users (user_id, name, email) values ($1, $2, $3)
     on conflict (user_id) do update set
       last_seen_at = now(),
       name  = coalesce(excluded.name, users.name),
       email = coalesce(excluded.email, users.email),
       login_count = users.login_count + case when $4 then 1 else 0 end`,
    [userId, name, email, isNewLogin],
  )
}

export async function loadProgress(userId: string): Promise<ProgressState | null> {
  await schemaReady()
  const res = await pool().query<{ data: ProgressState }>(
    'select data from progress where user_id = $1',
    [userId],
  )
  return res.rows[0]?.data ?? null
}

export async function saveProgress(userId: string, data: ProgressState): Promise<void> {
  await schemaReady()
  await pool().query(
    `insert into progress (user_id, data, updated_at) values ($1, $2, now())
     on conflict (user_id) do update set data = excluded.data, updated_at = now()`,
    [userId, data],
  )
}

export function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/* ---------- admin analytics ---------- */

export interface AdminStats {
  totalUsers: number
  newToday: number
  newThisWeek: number
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  totalLogins: number
  withProgress: number
  signupsByDay: { day: string; count: number }[]
  activityByDay: { day: string; count: number }[]
  recent: {
    name: string | null
    email: string | null
    createdAt: string
    lastSeenAt: string
    logins: number
  }[]
  usage: {
    problemsAttempted: number
    conceptsReviewed: number
    mocks: number
    gaps: number
    followUps: number
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  await schemaReady()
  const p = pool()

  const [counts, signups, activity, recent, progress] = await Promise.all([
    p.query(`select
        count(*)::int as total,
        count(*) filter (where created_at   >= current_date)::int               as new_today,
        count(*) filter (where created_at   >= now() - interval '7 days')::int  as new_week,
        count(*) filter (where last_seen_at >= current_date)::int               as active_today,
        count(*) filter (where last_seen_at >= now() - interval '7 days')::int  as active_week,
        count(*) filter (where last_seen_at >= now() - interval '30 days')::int as active_month,
        coalesce(sum(login_count), 0)::int as logins
      from users`),
    p.query(`select to_char(created_at, 'YYYY-MM-DD') as day, count(*)::int as count
             from users where created_at >= now() - interval '14 days'
             group by 1 order by 1`),
    p.query(`select to_char(last_seen_at, 'YYYY-MM-DD') as day, count(*)::int as count
             from users where last_seen_at >= now() - interval '14 days'
             group by 1 order by 1`),
    p.query(`select name, email, created_at, last_seen_at, login_count
             from users order by created_at desc limit 25`),
    p.query(`select
        count(*)::int as with_progress,
        coalesce(sum(jsonb_array_length(coalesce(data->'mocks','[]'::jsonb))),0)::int      as mocks,
        coalesce(sum(jsonb_array_length(coalesce(data->'gaps','[]'::jsonb))),0)::int       as gaps,
        coalesce(sum(jsonb_array_length(coalesce(data->'followUps','[]'::jsonb))),0)::int  as follow_ups,
        coalesce(sum((select count(*) from jsonb_object_keys(coalesce(data->'problems','{}'::jsonb)))),0)::int as problems,
        coalesce(sum((select count(*) from jsonb_object_keys(coalesce(data->'concepts','{}'::jsonb)))),0)::int as concepts
      from progress`),
  ])

  const c = counts.rows[0]
  const g = progress.rows[0]
  return {
    totalUsers: c.total,
    newToday: c.new_today,
    newThisWeek: c.new_week,
    activeToday: c.active_today,
    activeThisWeek: c.active_week,
    activeThisMonth: c.active_month,
    totalLogins: c.logins,
    withProgress: g.with_progress,
    signupsByDay: signups.rows,
    activityByDay: activity.rows,
    recent: recent.rows.map((r) => ({
      name: r.name,
      email: r.email,
      createdAt: new Date(r.created_at).toISOString(),
      lastSeenAt: new Date(r.last_seen_at).toISOString(),
      logins: r.login_count,
    })),
    usage: {
      problemsAttempted: g.problems,
      conceptsReviewed: g.concepts,
      mocks: g.mocks,
      gaps: g.gaps,
      followUps: g.follow_ups,
    },
  }
}
