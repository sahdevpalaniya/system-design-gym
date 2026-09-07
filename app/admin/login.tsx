'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.refresh()
        return
      }
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Sign-in failed.')
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-5 py-16">
      <form onSubmit={submit} className="card p-6">
        <div className="mb-1 text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
          Admin
        </div>
        <h1 className="mb-5 text-[22px] font-bold tracking-[-0.01em]">Sign in</h1>

        <label htmlFor="admin-user" className="mb-1.5 block text-[13px] font-semibold">
          Username
        </label>
        <input
          id="admin-user"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          className="mb-4 w-full rounded-lg border px-3.5 py-2.5 text-[15px] outline-none"
          style={{ borderColor: 'var(--border-strong)' }}
        />

        <label htmlFor="admin-pass" className="mb-1.5 block text-[13px] font-semibold">
          Password
        </label>
        <input
          id="admin-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mb-5 w-full rounded-lg border px-3.5 py-2.5 text-[15px] outline-none"
          style={{ borderColor: 'var(--border-strong)' }}
        />

        {error ? (
          <p className="mb-4 text-[13.5px]" style={{ color: 'var(--bad)' }}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full rounded-lg px-4 py-2.5 text-[14.5px] font-semibold transition disabled:opacity-40"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export function AdminLogout() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.refresh()
      }}
      className="rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold transition hover:opacity-75"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      Sign out
    </button>
  )
}
