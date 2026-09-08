'use client'

import { signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useProgress, type SyncState } from '@/lib/store'

/**
 * Ask Auth.js what providers exist rather than trusting an env flag — if Google
 * credentials are missing the button would otherwise render and then fail on
 * click, which is a worse experience than not offering it at all.
 */
function useGoogleAvailable(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: Record<string, unknown>) => !cancelled && setOk(Boolean(p?.google)))
      .catch(() => !cancelled && setOk(false))
    return () => {
      cancelled = true
    }
  }, [])
  return ok
}

const SYNC_LABEL: Record<SyncState, string> = {
  off: 'Saved on this device only',
  syncing: 'Saving to your account…',
  synced: 'Saved to your account',
  error: 'Could not reach your account — still saved on this device',
}

function SyncDot({ sync }: { sync: SyncState }) {
  const color =
    sync === 'synced'
      ? 'var(--ok)'
      : sync === 'syncing'
        ? 'var(--warn)'
        : sync === 'error'
          ? 'var(--bad)'
          : 'var(--dim)'
  return (
    <span
      title={SYNC_LABEL[sync]}
      aria-label={SYNC_LABEL[sync]}
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  )
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

/** Compact sign-in control for the header. */
export function AccountButton() {
  const { signedIn, user, sync, ready } = useProgress()
  const [open, setOpen] = useState(false)
  const google = useGoogleAvailable()

  if (!ready || google === null) return null
  if (!signedIn && !google) return null

  if (!signedIn) {
    return (
      <button
        type="button"
        onClick={() => signIn('google')}
        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition hover:opacity-75"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <GoogleMark />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account"
        className="flex items-center gap-1.5 rounded-lg px-1 py-1 transition hover:opacity-75"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" width={24} height={24} className="rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {(user?.name ?? '?').slice(0, 1).toUpperCase()}
          </span>
        )}
        <SyncDot sync={sync} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="card fade-up absolute right-0 z-50 mt-2 w-64 p-4"
            style={{ background: 'var(--surface)' }}
          >
            <div className="mb-1 text-[14px] font-semibold">{user?.name ?? 'Signed in'}</div>
            <div className="mb-3 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
              <SyncDot sync={sync} />
              {SYNC_LABEL[sync]}
            </div>
            <p className="mb-3 text-[12.5px] leading-relaxed" style={{ color: 'var(--faint)' }}>
              Your progress follows this account, so it survives signing out and shows up on any
              browser you sign in from.
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="w-full rounded-lg border px-3 py-2 text-[13px] font-semibold transition hover:opacity-75"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

/** Fuller panel for the progress page. */
export function AccountPanel() {
  const { signedIn, user, sync, ready } = useProgress()
  const google = useGoogleAvailable()
  if (!ready || google === null) return null

  if (!signedIn && !google) {
    return (
      <div className="card p-5">
        <h3 className="mb-1 text-[16px] font-semibold">Sign-in is not configured</h3>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          This deployment has no Google credentials set, so progress stays in this browser only.
          Export it below if you want to keep it.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="mb-1 text-[16px] font-semibold">
        {signedIn ? 'Signed in' : 'Not signed in'}
      </h3>
      {signedIn ? (
        <>
          <div className="mb-3 flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>
            <SyncDot sync={sync} />
            {user?.name ? `${user.name} · ` : ''}
            {SYNC_LABEL[sync]}
          </div>
          <p className="mb-4 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Progress is stored against your account, so it survives signing out, clearing this
            browser, or moving to another machine. It is still mirrored locally, so the app keeps
            working if you go offline.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold transition hover:opacity-75"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="mb-4 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Right now your progress lives only in this browser — clearing site data loses it, and it
            does not follow you to another device. Sign in and it moves to your account instead.
            Anything you have done so far is merged in rather than overwritten.
          </p>
          <button
            type="button"
            onClick={() => signIn('google')}
            className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold transition hover:opacity-75"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <GoogleMark />
            Continue with Google
          </button>
        </>
      )}
    </div>
  )
}
