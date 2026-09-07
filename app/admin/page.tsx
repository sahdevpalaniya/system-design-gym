import { adminConfigured, isAdmin } from '@/lib/admin'
import { getAdminStats, isConfigured } from '@/lib/db'
import { AdminLogin, AdminLogout } from './login'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// never let a crawler index the admin page
export const metadata = { robots: { index: false, follow: false } }

function Stat({ value, label, tone }: { value: number | string; label: string; tone?: string }) {
  return (
    <div className="card p-4">
      <div className="tabular text-[26px] leading-none font-bold" style={{ color: tone ?? 'var(--accent)' }}>
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  )
}

/** Tiny inline bar chart — no library, same approach as the rest of the app. */
function DayBars({ data, label }: { data: { day: string; count: number }[]; label: string }) {
  const days: { day: string; count: number }[] = []
  const byDay = new Map(data.map((d) => [d.day, d.count]))
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ day: key, count: byDay.get(key) ?? 0 })
  }
  const max = Math.max(1, ...days.map((d) => d.count))

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-[15px] font-semibold">{label}</h3>
      <div className="flex h-28 items-end gap-1.5">
        {days.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="tabular text-[10px]" style={{ color: 'var(--faint)' }}>
              {d.count || ''}
            </span>
            <div
              title={`${d.day}: ${d.count}`}
              className="w-full rounded-t"
              style={{
                height: `${Math.max(d.count === 0 ? 2 : 8, (d.count / max) * 88)}px`,
                background: d.count ? 'var(--accent)' : 'var(--surface-2)',
              }}
            />
            <span className="text-[9.5px]" style={{ color: 'var(--faint)' }}>
              {d.day.slice(8)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px]" style={{ color: 'var(--faint)' }}>
        Last 14 days
      </p>
    </div>
  )
}

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20">
        <div className="card p-6">
          <h1 className="mb-2 text-[20px] font-bold">Admin is not configured</h1>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD_HASH</code> and{' '}
            <code>AUTH_SECRET</code> in the environment to enable this page.
          </p>
        </div>
      </main>
    )
  }

  if (!(await isAdmin())) return <AdminLogin />

  if (!isConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20">
        <div className="card p-6">
          <h1 className="mb-2 text-[20px] font-bold">No database configured</h1>
          <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
            <code>DATABASE_URL</code> is not set, so there is nothing to report on.
          </p>
        </div>
      </main>
    )
  }

  let stats
  try {
    stats = await getAdminStats()
  } catch (err) {
    console.error(err)
    return (
      <main className="mx-auto max-w-lg px-5 py-20">
        <div className="card p-6">
          <h1 className="mb-2 text-[20px] font-bold">Could not load stats</h1>
          <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
            The database is configured but the query failed. Check the deployment logs.
          </p>
        </div>
      </main>
    )
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <main className="w-full px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
            Admin
          </div>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.015em]">Who is using this</h1>
        </div>
        <AdminLogout />
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-[17px] font-semibold">Accounts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={stats.totalUsers} label="registered users" />
          <Stat value={stats.totalLogins} label="total sign-ins" />
          <Stat value={stats.newToday} label="registered today" />
          <Stat value={stats.newThisWeek} label="registered this week" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[17px] font-semibold">Activity</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={stats.activeToday} label="active today" tone="var(--ok)" />
          <Stat value={stats.activeThisWeek} label="active this week" tone="var(--ok)" />
          <Stat value={stats.activeThisMonth} label="active this month" tone="var(--ok)" />
          <Stat
            value={
              stats.totalUsers ? `${Math.round((stats.withProgress / stats.totalUsers) * 100)}%` : '—'
            }
            label="have saved progress"
            tone="var(--ok)"
          />
        </div>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <DayBars data={stats.signupsByDay} label="New registrations per day" />
        <DayBars data={stats.activityByDay} label="Active users per day" />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[17px] font-semibold">What they are doing</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat value={stats.usage.problemsAttempted} label="problems attempted" tone="var(--text)" />
          <Stat value={stats.usage.conceptsReviewed} label="concepts reviewed" tone="var(--text)" />
          <Stat value={stats.usage.mocks} label="mocks completed" tone="var(--text)" />
          <Stat value={stats.usage.followUps} label="follow-ups drilled" tone="var(--text)" />
          <Stat value={stats.usage.gaps} label="gap-log entries" tone="var(--text)" />
        </div>
        <p className="mt-2 text-[12.5px]" style={{ color: 'var(--faint)' }}>
          Totals across all accounts. Counts only what has synced to the server — anonymous,
          signed-out use is never recorded anywhere.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-[17px] font-semibold">Most recent registrations</h2>
        {stats.recent.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr style={{ color: 'var(--muted)' }}>
                  <th className="border-b px-4 py-2.5 text-left font-semibold">Name</th>
                  <th className="border-b px-4 py-2.5 text-left font-semibold">Email</th>
                  <th className="border-b px-4 py-2.5 text-left font-semibold">Registered</th>
                  <th className="border-b px-4 py-2.5 text-left font-semibold">Last seen</th>
                  <th className="border-b px-4 py-2.5 text-right font-semibold">Sign-ins</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((u, i) => (
                  <tr key={i}>
                    <td className="border-b px-4 py-2.5">{u.name ?? '—'}</td>
                    <td className="border-b px-4 py-2.5" style={{ color: 'var(--muted)' }}>
                      {u.email ?? '—'}
                    </td>
                    <td className="border-b px-4 py-2.5" style={{ color: 'var(--muted)' }}>
                      {fmt(u.createdAt)}
                    </td>
                    <td className="border-b px-4 py-2.5" style={{ color: 'var(--muted)' }}>
                      {fmt(u.lastSeenAt)}
                    </td>
                    <td className="tabular border-b px-4 py-2.5 text-right">{u.logins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="rounded-xl border border-dashed px-5 py-10 text-center text-[14px]"
            style={{ color: 'var(--faint)', borderColor: 'var(--border-strong)' }}
          >
            Nobody has signed in yet.
          </div>
        )}
      </section>
    </main>
  )
}
