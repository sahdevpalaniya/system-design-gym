'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Language } from '@/lib/types'
import { CONCEPTS, PATH, getConcept } from '@/content/system-design/concepts'
import { LESSONS } from '@/content/system-design/foundations'
import { GROUPS } from '@/content/system-design/method'
import { PROBLEMS } from '@/content/system-design/problems'
import { ARCHETYPES } from '@/content/system-design/archetypes'
import { COMPANIES } from '@/content/system-design/companies'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { hasDeepDive } from '@/content/system-design/deep'
import { conceptState, dueConcepts, problemState, readCount, streakCount, useProgress } from '@/lib/store'
import { AccountButton } from './Account'
import { Search } from './Search'

/* ---------- sidebar open/close, shared with the header button ---------- */

const SidebarCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
})

/* ---------- tracks: the top tabs, w3schools style ---------- */

type Track = { id: string; name: string; href: string }

const TRACKS: Track[] = [
  { id: 'sd', name: 'System Design', href: '/' },
  ...LANGUAGES.map((l) => ({ id: l.id, name: l.name, href: `/languages/${l.id}` })),
]

/** The tab a path belongs to. Everything outside /languages is System Design. */
function trackFor(pathname: string): Track {
  const m = /^\/languages\/([^/]+)/.exec(pathname)
  return TRACKS.find((t) => t.id === m?.[1]) ?? TRACKS[0]
}

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
            Dev Learning
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
          <Search />
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

      <TrackTabs />
    </header>
  )
}

/** The row of track tabs. Clicking one swaps the entire sidebar. */
function TrackTabs() {
  const pathname = usePathname()
  const active = trackFor(pathname)

  return (
    <nav aria-label="Tracks" className="flex w-full gap-1 overflow-x-auto px-3">
      {TRACKS.map((t) => {
        const on = t.id === active.id
        return (
          <Link
            key={t.id}
            href={t.href}
            className="shrink-0 border-b-2 px-3 py-2 text-[13.5px] whitespace-nowrap transition"
            style={{
              borderBottomColor: on ? 'var(--accent)' : 'transparent',
              color: on ? 'var(--accent)' : 'var(--muted)',
              fontWeight: on ? 700 : 500,
            }}
            aria-current={on ? 'page' : undefined}
          >
            {t.name}
          </Link>
        )
      })}
    </nav>
  )
}

/* ---------- sidebar: every page, listed plainly ---------- */

function Item({
  href,
  children,
  dot,
  deep,
  done,
}: {
  href: string
  children: ReactNode
  dot?: string
  /** has a "view more" deep dive */
  deep?: boolean
  /** undefined = not a trackable topic; false = still to read; true = read */
  done?: boolean
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
      {done === undefined ? null : done ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--ok)"
          strokeWidth="2.4"
          className="shrink-0"
          aria-label="Done"
        >
          <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span
          className="inline-block h-[11px] w-[11px] shrink-0 rounded-full border"
          style={{ borderColor: 'var(--border-strong)' }}
          aria-label="Not read yet"
        />
      )}
      {dot ? (
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: dot }}
          aria-hidden
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {deep ? (
        <span
          className="shrink-0 rounded px-1 text-[9px] font-bold tracking-wide"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          title="Has an in-depth page"
        >
          +
        </span>
      ) : null}
    </Link>
  )
}

function Group({
  title,
  children,
  done,
  total,
}: {
  title: string
  children: ReactNode
  /** when given, shows a "3 / 7 done" counter next to the group name */
  done?: number
  total?: number
}) {
  return (
    <div className="mb-5">
      <div
        className="mb-1 flex items-baseline gap-2 px-3 text-[11px] font-bold tracking-[0.08em] uppercase"
        style={{ color: 'var(--faint)' }}
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {total ? (
          <span
            className="tabular shrink-0 tracking-normal"
            style={{ color: done === total ? 'var(--ok)' : 'var(--faint)' }}
          >
            {done}/{total}
          </span>
        ) : null}
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

/** The sidebar for one language track: sections, then topics. */
function LanguageMenu({ lang }: { lang: Language }) {
  const { state, ready } = useProgress()
  // topics are numbered straight through the track, not restarted per section
  const order = lang.sections.flatMap((s) => s.lessons)

  return (
    <>
      <Group
        title={lang.name}
        done={ready ? readCount(state, lang.lessons.map((t) => `lang:${lang.id}:${t.slug}`)) : 0}
        total={lang.lessons.length}
      >
        <Item href={`/languages/${lang.id}`}>All topics</Item>
        <Item href={`/languages/${lang.id}/revise`}>Quick revision</Item>
        {lang.quizzes?.length ? (
          <Item href={`/languages/${lang.id}/quiz`}>Tests</Item>
        ) : null}
      </Group>

      {lang.sections.map((sec) => (
        <Group
          key={sec.id}
          title={sec.name}
          done={ready ? readCount(state, sec.lessons.map((sl) => `lang:${lang.id}:${sl}`)) : 0}
          total={sec.lessons.length}
        >
          {sec.lessons.map((slug) => {
            const t = lang.lessons.find((x) => x.slug === slug)
            if (!t) return null
            const step = order.indexOf(slug) + 1
            return (
              <Item
                key={slug}
                href={`/languages/${lang.id}/${slug}`}
                done={ready ? Boolean(state.read?.[`lang:${lang.id}:${slug}`]) : false}
              >
                <span className="tabular mr-1.5" style={{ color: 'var(--dim)' }}>
                  {String(step).padStart(2, '0')}
                </span>
                {t.navTitle ?? t.title}
              </Item>
            )
          })}
        </Group>
      ))}
    </>
  )
}

function Sidebar() {
  const { open, setOpen } = useContext(SidebarCtx)
  const { state, ready } = useProgress()
  const pathname = usePathname()
  const due = ready ? dueConcepts(state).length : 0
  const lang = getLanguage(trackFor(pathname).id)
  // concepts numbered straight through the path, so the sidebar reads 01..NN
  const conceptOrder = PATH.flatMap((st) => st.concepts ?? [])

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
        className={`fixed top-0 bottom-0 left-0 z-40 w-[268px] shrink-0 overflow-y-auto border-r py-4 transition-transform lg:sticky lg:top-[86px] lg:z-0 lg:h-[calc(100vh-86px)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--surface)' }}
      >
        <div className="mb-4 px-3 lg:hidden">
          <span className="text-[14px] font-bold">Menu</span>
        </div>

        {lang ? (
          <LanguageMenu lang={lang} />
        ) : (
          <>
        <Group
          title="System Design"
          done={
            ready
              ? readCount(state, [
                  ...LESSONS.map((l) => `lesson:${l.slug}`),
                  ...CONCEPTS.map((c) => `concept:${c.slug}`),
                ])
              : 0
          }
          total={LESSONS.length + CONCEPTS.length}
        >
          <Item href="/learn">All topics</Item>
          <Item href="/revise">Quick revision</Item>
          <Item href="/practice/check">
            Concept check
            {due > 0 ? (
              <span
                className="tabular ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: 'var(--bad)', color: '#fff' }}
              >
                {due}
              </span>
            ) : null}
          </Item>
        </Group>

        <Group title="Today">
          <Item href="/">What to do today</Item>
          <Item href="/progress">Progress &amp; gap log</Item>
          <Item href="/map">Curriculum map</Item>
        </Group>

        <Group
          title="Start from scratch"
          done={ready ? readCount(state, LESSONS.map((l) => `lesson:${l.slug}`)) : 0}
          total={LESSONS.length}
        >
          {LESSONS.map((l, i) => (
            <Item
              key={l.slug}
              href={`/learn/${l.slug}`}
              done={ready ? Boolean(state.read?.[`lesson:${l.slug}`]) : false}
            >
              <span className="tabular mr-1.5" style={{ color: 'var(--dim)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {l.navTitle ?? l.title}
            </Item>
          ))}
        </Group>

        {PATH.filter((stage) => stage.concepts?.length).map((stage) => (
          <Group
            key={stage.id}
            title={stage.name}
            done={ready ? readCount(state, (stage.concepts ?? []).map((s) => `concept:${s}`)) : 0}
            total={(stage.concepts ?? []).length}
          >
            {(stage.concepts ?? []).map((slug) => {
              const c = getConcept(slug)
              if (!c) return null
              const step = LESSONS.length + conceptOrder.indexOf(slug) + 1
              return (
                <Item
                  key={slug}
                  href={`/concepts/${slug}`}
                  dot={ready ? STATE_COLOR[conceptState(state, slug)] : undefined}
                  deep={hasDeepDive(slug)}
                  done={ready ? Boolean(state.read?.[`concept:${slug}`]) : false}
                >
                  <span className="tabular mr-1.5" style={{ color: 'var(--dim)' }}>
                    {String(step).padStart(2, '0')}
                  </span>
                  {c.navTitle ?? c.title}
                </Item>
              )
            })}
          </Group>
        ))}

        <Group title="Practice">
          <Item href="/practice/daily">Daily rep · 15 min</Item>
          <Item href="/practice/mock">Timed mock · 45 min</Item>
          <Item href="/practice/blitz">Follow-up blitz · 10 min</Item>
          <Item href="/practice/blank">Blank page &amp; whiteboard</Item>
          <Item href="/solutions">Worked solutions</Item>
          <Item href="/company">Company questions</Item>
          {COMPANIES.map((co) => (
            <Item key={co.id} href={`/company/${co.id}`}>
              {'\u2007'}
              {co.name}
            </Item>
          ))}
        </Group>

        <Group title="Revision">
          <Item href="/drills">Defence drills</Item>
          <Item href="/map">Where I am</Item>
        </Group>

        {GROUPS.map((g) => {
          const ps = PROBLEMS.filter((x) => x.group === g.id)
          if (!ps.length) return null
          return (
            <Group
              key={g.id}
              title={g.name}
              done={ready ? ps.filter((p) => problemState(state, p.slug) !== 'untouched').length : 0}
              total={ps.length}
            >
              {ps.map((p) => (
                <Item
                  key={p.slug}
                  href={`/problems/${p.slug}`}
                  dot={ready ? STATE_COLOR[problemState(state, p.slug)] : undefined}
                >
                  {p.navTitle ?? p.title}
                </Item>
              ))}
            </Group>
          )
        })}

        <Group title="Interviewers">
          {ARCHETYPES.map((a) => (
            <Item key={a.id} href={`/archetypes/${a.id}`}>
              {a.name.replace(/^The /, '')}
            </Item>
          ))}
        </Group>

          </>
        )}

        <div className="px-3 pt-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--faint)' }}>
          {!ready
            ? ''
            : lang
              ? `${readCount(state, lang.lessons.map((t) => `lang:${lang.id}:${t.slug}`))} of ${lang.lessons.length} ${lang.name} topics read`
              : `${readCount(state, CONCEPTS.map((c) => `concept:${c.slug}`))} of ${CONCEPTS.length} topics read · ${CONCEPTS.filter((c) => conceptState(state, c.slug) === 'solid').length} solid`}
        </div>
      </nav>
    </>
  )
}

export function Footer() {
  const pathname = usePathname()
  const lang = getLanguage(trackFor(pathname).id)
  // concepts numbered straight through the path, so the sidebar reads 01..NN
  const conceptOrder = PATH.flatMap((st) => st.concepts ?? [])

  return (
    <footer className="mt-auto border-t px-5 py-6">
      <div
        className="flex w-full flex-col gap-2 text-[12.5px] sm:flex-row sm:items-center sm:justify-between"
        style={{ color: 'var(--faint)' }}
      >
        <p>
          {lang
            ? 'Type every example yourself. Reading code is not the same as writing it.'
            : 'Write your own answer before you read ours.'}
        </p>
        <Link href="/progress" className="font-medium hover:opacity-70" style={{ color: 'var(--muted)' }}>
          Export or clear your data →
        </Link>
      </div>
    </footer>
  )
}
