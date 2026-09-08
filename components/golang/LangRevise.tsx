'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Language } from '@/lib/types'
import { useProgress } from '@/lib/store'
import { Rich } from '@/components/common/ui'

type Filter = 'all' | 'todo' | 'done'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'todo', label: 'Still to read' },
  { id: 'done', label: 'Already read' },
]

/**
 * The 20-minutes-before-an-interview page: every topic's key points and its one
 * line to remember, in order, with nothing else on screen.
 */
export function LangRevise({ lang }: { lang: Language }) {
  const { state, ready } = useProgress()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const bySlug = new Map(lang.lessons.map((l) => [l.slug, l]))
  const isRead = (slug: string) => Boolean(state.read?.[`lang:${lang.id}:${slug}`])

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium transition"
            style={{
              background: filter === f.id ? 'var(--accent)' : 'var(--surface-2)',
              color: filter === f.id ? 'var(--on-accent)' : 'var(--muted)',
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const allOpen = lang.lessons.every((l) => open[l.slug])
            setOpen(allOpen ? {} : Object.fromEntries(lang.lessons.map((l) => [l.slug, true])))
          }}
          className="ml-auto rounded-full px-3 py-1.5 text-[13px] font-medium transition"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          Expand / collapse all
        </button>
      </div>

      <div className="space-y-8">
        {lang.sections.map((sec) => {
          const rows = sec.lessons
            .map((slug) => bySlug.get(slug))
            .filter(Boolean)
            .filter((l) => {
              if (!ready || filter === 'all') return true
              return filter === 'done' ? isRead(l!.slug) : !isRead(l!.slug)
            })
          if (!rows.length) return null

          return (
            <section key={sec.id}>
              <h2
                className="mb-2.5 text-[11.5px] font-bold tracking-[0.08em] uppercase"
                style={{ color: 'var(--faint)' }}
              >
                {sec.name}
              </h2>
              <div className="space-y-2.5">
                {rows.map((l) => {
                  const t = l!
                  const isOpen = Boolean(open[t.slug])
                  return (
                    <div key={t.slug} className="card overflow-hidden p-0">
                      <button
                        type="button"
                        onClick={() => setOpen((o) => ({ ...o, [t.slug]: !o[t.slug] }))}
                        className="flex w-full items-start gap-3 p-4 text-left transition"
                      >
                        <span
                          className="mt-[3px] shrink-0 text-[11px] transition-transform"
                          style={{
                            color: 'var(--accent)',
                            transform: isOpen ? 'rotate(90deg)' : 'none',
                          }}
                          aria-hidden
                        >
                          ▶
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold">{t.title}</span>
                          <span
                            className="mt-0.5 block text-[13px] leading-relaxed"
                            style={{ color: 'var(--muted)' }}
                          >
                            {t.oneLine}
                          </span>
                        </span>
                        {ready && isRead(t.slug) ? (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="var(--ok)"
                            strokeWidth="2.4"
                            className="mt-1 shrink-0"
                            aria-label="Read"
                          >
                            <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </button>

                      {isOpen ? (
                        <div className="border-t px-4 pt-3.5 pb-4">
                          <ul className="mb-4 space-y-1.5">
                            {t.keyPoints.map((k, i) => (
                              <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
                                <span style={{ color: 'var(--border-strong)' }}>·</span>
                                <span>
                                  <Rich text={k} />
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div
                            className="rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed"
                            style={{ background: 'var(--say-bg)' }}
                          >
                            <span className="font-semibold" style={{ color: 'var(--say)' }}>
                              Remember:{' '}
                            </span>
                            <Rich text={t.remember} />
                          </div>
                          <Link
                            href={`/languages/${lang.id}/${t.slug}`}
                            className="mt-3 inline-block text-[13px] font-medium hover:opacity-70"
                            style={{ color: 'var(--accent)' }}
                          >
                            Read the full topic →
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
