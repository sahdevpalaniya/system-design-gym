'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useProgress, streakCount } from '@/lib/store'

const LINKS = [
  { href: '/', label: 'Today' },
  { href: '/practice', label: 'Practice' },
  { href: '/concepts', label: 'Concepts' },
  { href: '/problems', label: 'Problems' },
  { href: '/drills', label: 'Drills' },
  { href: '/archetypes', label: 'Interviewers' },
  { href: '/map', label: 'Map' },
  { href: '/progress', label: 'Progress' },
]

function ThemeToggle() {
  const { state, setTheme } = useProgress()
  const next = state.theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
      style={{ color: 'var(--muted)' }}
    >
      {state.theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="3.2" />
          <path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1M12.9 12.9l-1.1-1.1M4.2 4.2 3.1 3.1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13.5 9.6A5.9 5.9 0 0 1 6.4 2.5a5.9 5.9 0 1 0 7.1 7.1z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export function Nav() {
  const pathname = usePathname()
  const { state, ready } = useProgress()
  const [open, setOpen] = useState(false)
  const streak = ready ? streakCount(state) : 0

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="1.5" y="4" width="8" height="6" rx="1.6" stroke="var(--accent)" strokeWidth="1.7" />
            <rect x="14.5" y="4" width="8" height="6" rx="1.6" stroke="var(--border-strong)" strokeWidth="1.7" />
            <rect x="8" y="14.5" width="8" height="6" rx="1.6" stroke="var(--border-strong)" strokeWidth="1.7" />
            <path d="M9.5 7h5M6 10v2.5a2 2 0 0 0 2 2h.5M18.5 10v2.5a2 2 0 0 1-2 2H16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] font-bold tracking-[-0.01em] whitespace-nowrap">
            System Design Gym
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium transition"
              style={{
                color: isActive(l.href) ? 'var(--text)' : 'var(--muted)',
                background: isActive(l.href) ? 'var(--surface-2)' : 'transparent',
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          {streak > 0 ? (
            <span
              className="tabular hidden items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold sm:flex"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              title={`${streak} day streak`}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 0.5s1.2 3 3.2 4.7C13 6.7 14 8.3 14 10.2A6 6 0 0 1 2 10.2c0-2 1.4-3.7 2.6-5 .3 1 .9 1.7 1.6 2 0-2.2.7-4.6 1.8-6.7z" />
              </svg>
              {streak}
            </span>
          ) : null}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center rounded-lg lg:hidden"
            style={{ color: 'var(--muted)' }}
          >
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2 4.5h12M2 8h12M2 11.5h12" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t px-5 py-2 lg:hidden" style={{ background: 'var(--surface)' }}>
          <div className="grid grid-cols-2 gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium"
                style={{
                  color: isActive(l.href) ? 'var(--accent)' : 'var(--text)',
                  background: isActive(l.href) ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto border-t px-5 py-8 sm:px-7">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-[12.5px] sm:flex-row sm:items-center sm:justify-between" style={{ color: 'var(--faint)' }}>
        <p className="max-w-md leading-relaxed">
          Write your own answer before you read ours. Everything here is stored in your browser only — no account,
          no server, nothing leaves this device.
        </p>
        <Link href="/progress" className="font-medium hover:opacity-70" style={{ color: 'var(--muted)' }}>
          Export or clear your data →
        </Link>
      </div>
    </footer>
  )
}
