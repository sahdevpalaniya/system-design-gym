'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { CONCEPTS, TIER_INFO, conceptsByTier } from '@/content/concepts'
import { GROUPS } from '@/content/method'
import { PROBLEMS } from '@/content/problems'
import { ARCHETYPES } from '@/content/archetypes'
import { conceptState, problemState, streakCount, useProgress } from '@/lib/store'
import type { Tier } from '@/lib/types'
import { AccountButton } from './Account'

/* ---------- sidebar open/close, shared with the header button ---------- */

const SidebarCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
})

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarCtx.Provider value={{ open, setOpen }}>
      <Header />
      <div className="flex w-full flex-1">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarCtx.Provider>
  )
}

/* ---------- header: logo, theme, account. Nothing else. ---------- */

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

function Header() {
  const { open, setOpen } = useContext(SidebarCtx)
  const { state, ready } = useProgress()
  const streak = ready ? streakCount(state) : 0

  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: 'var(--surface)' }}>
      <div className="flex w-full items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
          className="flex h-8 w-8 items-center justify-center rounded-lg lg:hidden"
          style={{ color: 'var(--muted)' }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            {open ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2 4.5h12M2 8h12M2 11.5h12" />}
          </svg>
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="1.5" y="4" width="8" height="6" rx="1.6" stroke="var(--accent)" strokeWidth="1.7" />
            <rect x="14.5" y="4" width="8" height="6" rx="1.6" stroke="var(--border-strong)" strokeWidth="1.7" />
            <rect x="8" y="14.5" width="8" height="6" rx="1.6" stroke="var(--border-strong)" strokeWidth="1.7" />
            <path d="M9.5 7h5M6 10v2.5a2 2 0 0 0 2 2h.5M18.5 10v2.5a2 2 0 0 1-2 2H16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] font-bold tracking-[-0.01em] whitespace-nowrap">
            System Design Gym
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
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
          <AccountButton />
        </div>
      </div>
    </header>
  )
}

/* ---------- sidebar: every page, listed plainly ---------- */

function Item({
  href,
  children,
  dot,
}: {
  href: string
  children: ReactNode
  dot?: string
}) {
  const pathname = usePathname()
  const { setOpen } = useContext(SidebarCtx)
  const active = pathname === href
  return (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="flex items-center gap-2 border-l-2 py-[5px] pr-2 pl-3 text-[13.5px] leading-snug transition"
      style={{
        borderLeftColor: active ? 'var(--accent)' : 'transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {dot ? (
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: dot }}
          aria-hidden
        />
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <div
        className="mb-1 px-3 text-[11px] font-bold tracking-[0.08em] uppercase"
        style={{ color: 'var(--faint)' }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

const STATE_COLOR: Record<string, string | undefined> = {
  untouched: undefined,
  attempted: 'var(--warn)',
  solid: 'var(--ok)',
  review: 'var(--bad)',
}

function Sidebar() {
  const { open, setOpen } = useContext(SidebarCtx)
  const { state, ready } = useProgress()
  const pathname = usePathname()

  // close the drawer whenever the route changes on mobile
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default lg:hidden"
          style={{ background: 'rgba(0,0,0,.35)' }}
        />
      ) : null}

      <nav
        aria-label="All pages"
        className={`fixed top-0 bottom-0 left-0 z-40 w-[250px] shrink-0 overflow-y-auto border-r py-4 transition-transform lg:sticky lg:top-[49px] lg:z-0 lg:h-[calc(100vh-49px)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--surface)' }}
      >
        <div className="mb-4 px-3 lg:hidden">
          <span className="text-[14px] font-bold">Menu</span>
        </div>

        <Group title="Start">
          <Item href="/">Today</Item>
          <Item href="/practice/daily">Daily rep · 15 min</Item>
          <Item href="/practice/mock">Timed mock · 45 min</Item>
          <Item href="/practice/blitz">Follow-up blitz · 10 min</Item>
          <Item href="/practice/check">Concept check · 5 min</Item>
          <Item href="/practice/blank">Blank page</Item>
        </Group>

        {([1, 2, 3] as Tier[]).map((tier) => (
          <Group key={tier} title={TIER_INFO[tier].name.replace(/^Tier \d+ — /, `Tier ${tier}: `)}>
            {conceptsByTier(tier).map((c) => (
              <Item
                key={c.slug}
                href={`/concepts/${c.slug}`}
                dot={ready ? STATE_COLOR[conceptState(state, c.slug)] : undefined}
              >
                {c.title}
              </Item>
            ))}
          </Group>
        ))}

        <Group title="Problems by shape">
          {GROUPS.map((g) => {
            const p = PROBLEMS.find((x) => x.group === g.id)
            if (!p) return null
            return (
              <Item
                key={p.slug}
                href={`/problems/${p.slug}`}
                dot={ready ? STATE_COLOR[problemState(state, p.slug)] : undefined}
              >
                {p.title}
              </Item>
            )
          })}
        </Group>

        <Group title="Interviewers">
          {ARCHETYPES.map((a) => (
            <Item key={a.id} href={`/archetypes/${a.id}`}>
              {a.name.replace(/^The /, '')}
            </Item>
          ))}
        </Group>

        <Group title="Your progress">
          <Item href="/drills">Defence drills</Item>
          <Item href="/map">Curriculum map</Item>
          <Item href="/progress">Progress &amp; gap log</Item>
        </Group>

        <div className="px-3 pt-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--faint)' }}>
          {ready
            ? `${CONCEPTS.filter((c) => conceptState(state, c.slug) === 'solid').length} of ${CONCEPTS.length} concepts solid`
            : ''}
        </div>
      </nav>
    </>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto border-t px-5 py-6">
      <div
        className="flex w-full flex-col gap-2 text-[12.5px] sm:flex-row sm:items-center sm:justify-between"
        style={{ color: 'var(--faint)' }}
      >
        <p>Write your own answer before you read ours.</p>
        <Link href="/progress" className="font-medium hover:opacity-70" style={{ color: 'var(--muted)' }}>
          Export or clear your data →
        </Link>
      </div>
    </footer>
  )
}
