'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LESSONS } from '@/content/system-design/foundations'
import { PATH, getConcept } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { conceptState, dueConcepts, dueProblems, useProgress } from '@/lib/store'
import { Page, PageHeader, Rich } from '@/components/common/ui'

/* One flat list of everything worth revising, in the order you learn it. */
interface Row {
  id: string
  href: string
  title: string
  group: string
  oneLine: string
  /** the two or three lines you would want 10 minutes before an interview */
  points: string[]
  say?: string
}

function rows(): Row[] {
  const out: Row[] = []
  for (const l of LESSONS) {
    out.push({
      id: `lesson:${l.slug}`,
      href: `/learn/${l.slug}`,
      title: l.title,
      group: 'Start from scratch',
      oneLine: l.oneLine,
      points: l.keyPoints,
      say: l.remember,
    })
  }
  for (const stage of PATH) {
    for (const slug of stage.concepts ?? []) {
      const c = getConcept(slug)
      if (!c) continue
      out.push({
        id: `concept:${slug}`,
        href: `/concepts/${slug}`,
        title: c.title,
        group: stage.name,
        oneLine: c.oneLine,
        points: [`**What it costs you:** ${c.cost}`, ...(c.traps ?? [])],
        say: c.sayThis,
      })
    }
  }
  return out
}

const ALL = rows()

type Filter = 'all' | 'todo' | 'done' | 'due'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'todo', label: 'Still to read' },
  { id: 'done', label: 'Read' },
  { id: 'due', label: 'Due for review' },
]

export default function RevisePage() {
  const { state, ready } = useProgress()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [allOpen, setAllOpen] = useState(false)

  const due = new Set(ready ? dueConcepts(state).map((s) => `concept:${s}`) : [])
  const staleProblems = ready ? dueProblems(state) : []
  const isDone = (id: string) => Boolean(state.read?.[id])

  const shown = ALL.filter((r) => {
    if (filter === 'todo') return !isDone(r.id)
    if (filter === 'done') return isDone(r.id)
    if (filter === 'due') return due.has(r.id)
    return true
  })

  const doneCount = ALL.filter((r) => isDone(r.id)).length
  const groups = [...new Set(shown.map((r) => r.group))]

  return (
    <Page>
      <PageHeader
        eyebrow="Revision"
        title="Quick revision"
        lede="Every topic on one page, shortest version first. Read the one-liners top to bottom, open the ones that feel shaky, and go back to the full page only where you need to."
        meta={
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            {ready ? `${doneCount} of ${ALL.length} read` : ''}
          </span>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className="rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition hover:opacity-80"
            style={{
              borderColor: filter === f.id ? 'var(--accent)' : 'var(--border-strong)',
              background: filter === f.id ? 'var(--accent-soft)' : 'transparent',
              color: filter === f.id ? 'var(--accent)' : 'var(--text)',
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const next = !allOpen
            setAllOpen(next)
            setOpen(next ? Object.fromEntries(ALL.map((r) => [r.id, true])) : {})
          }}
          className="ml-auto text-[13px] font-semibold hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-[15px]" style={{ color: 'var(--muted)' }}>
          Nothing here right now. Try another filter.
        </p>
      ) : null}

      {groups.map((g) => (
        <section key={g} className="mb-8">
          <h2 className="mb-2 text-[12px] font-bold tracking-[0.08em] uppercase" style={{ color: 'var(--faint)' }}>
            {g}
          </h2>
          <div className="space-y-2">
            {shown
              .filter((r) => r.group === g)
              .map((r) => {
                const done = isDone(r.id)
                const isOpen = Boolean(open[r.id])
                const slug = r.id.split(':')[1]
                const cs = r.id.startsWith('concept:') && ready ? conceptState(state, slug) : null
                return (
                  <div key={r.id} className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
                      aria-expanded={isOpen}
                      className="flex w-full items-start gap-3 p-4 text-left"
                    >
                      {done ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--ok)" strokeWidth="2.4" className="mt-1 shrink-0" aria-label="Read">
                          <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="mt-[3px] inline-block h-3.5 w-3.5 shrink-0 rounded-full border" style={{ borderColor: 'var(--border-strong)' }} aria-label="Not read yet" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[15.5px] font-semibold">{r.title}</span>
                          {cs === 'review' ? (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'var(--bad)', color: '#fff' }}>
                              REVIEW
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {r.oneLine}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 text-[12px]" style={{ color: 'var(--faint)' }} aria-hidden>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="border-t px-4 py-4">
                        <ul className="mb-3 space-y-2">
                          {r.points.map((p, i) => (
                            <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
                              <span style={{ color: 'var(--accent)' }} aria-hidden>·</span>
                              <span>
                                <Rich text={p} />
                              </span>
                            </li>
                          ))}
                        </ul>
                        {r.say ? (
                          <p className="rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed" style={{ background: 'var(--say-bg)' }}>
                            <span className="font-semibold" style={{ color: 'var(--say)' }}>Say this: </span>
                            <Rich text={r.say} />
                          </p>
                        ) : null}
                        <Link href={r.href} className="mt-3 inline-block text-[13.5px] font-semibold hover:opacity-70" style={{ color: 'var(--accent)' }}>
                          Open the full page →
                        </Link>
                      </div>
                    ) : null}
                  </div>
                )
              })}
          </div>
        </section>
      ))}

      {staleProblems.length ? (
        <section className="mb-8 border-t pt-8">
          <h2 className="mb-1 text-[16px] font-semibold">Problems worth running again</h2>
          <p className="mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            You worked through these a while ago. A design you did once in March is a design you have
            forgotten by May — and the second attempt is where it sticks.
          </p>
          <div className="flex flex-wrap gap-2">
            {staleProblems.map((slug) => {
              const p = PROBLEMS.find((x) => x.slug === slug)
              if (!p) return null
              return (
                <Link
                  key={slug}
                  href={`/problems/${slug}`}
                  className="rounded-lg border px-3 py-1.5 text-[13.5px] font-medium transition hover:opacity-70"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  {p.title}
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <div className="border-t pt-6">
        <Link href="/practice/check" className="text-[14px] font-semibold hover:opacity-70" style={{ color: 'var(--accent)' }}>
          Now test yourself — concept check · 5 min →
        </Link>
      </div>
    </Page>
  )
}
