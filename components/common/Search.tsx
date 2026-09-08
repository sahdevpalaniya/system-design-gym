'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LANGUAGES } from '@/content/languages'
import { CONCEPTS } from '@/content/system-design/concepts'
import { LESSONS } from '@/content/system-design/foundations'
import { PROBLEMS } from '@/content/system-design/problems'

interface Row {
  title: string
  sub: string
  href: string
  group: string
  /** lowercase haystack, built once */
  hay: string
}

/* Built once at module load — a few hundred rows, so no index is needed. */
const ROWS: Row[] = [
  ...LANGUAGES.flatMap((l) =>
    l.lessons.map((t) => ({
      title: t.title,
      sub: t.oneLine,
      href: `/languages/${l.id}/${t.slug}`,
      group: l.name,
      hay: `${t.title} ${t.oneLine} ${t.blocks.map((b) => b.heading ?? '').join(' ')}`.toLowerCase(),
    })),
  ),
  ...LESSONS.map((l) => ({
    title: l.title,
    sub: l.oneLine,
    href: `/learn/${l.slug}`,
    group: 'System Design · basics',
    hay: `${l.title} ${l.oneLine}`.toLowerCase(),
  })),
  ...CONCEPTS.map((c) => ({
    title: c.title,
    sub: c.oneLine,
    href: `/concepts/${c.slug}`,
    group: 'System Design · concepts',
    hay: `${c.title} ${c.oneLine}`.toLowerCase(),
  })),
  ...PROBLEMS.map((p) => ({
    title: p.title,
    sub: p.prompt,
    href: `/problems/${p.slug}`,
    group: 'System Design · problems',
    hay: `${p.title} ${p.prompt} ${p.concepts.join(' ')}`.toLowerCase(),
  })),
]

/** Every term must appear somewhere. Title matches rank above body matches. */
function search(q: string): Row[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []

  const hits: { row: Row; score: number }[] = []
  for (const row of ROWS) {
    if (!terms.every((t) => row.hay.includes(t))) continue
    const title = row.title.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (title.startsWith(t)) score += 3
      else if (title.includes(t)) score += 2
      else score += 1
    }
    hits.push({ row, score })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 12).map((h) => h.row)
}

export function Search() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = useMemo(() => search(q), [q])

  // "/" focuses the box from anywhere, Escape closes it
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing) {
        e.preventDefault()
        input.current?.focus()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setActive(0), [q])

  function go(href: string) {
    setOpen(false)
    setQ('')
    router.push(href)
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1 sm:max-w-xs">
      <input
        ref={input}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!results.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % results.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i - 1 + results.length) % results.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            go(results[active].href)
          }
        }}
        placeholder="Search topics…"
        aria-label="Search topics"
        className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none transition"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
      />

      {open && q.trim() ? (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)' }}
        >
          {results.length ? (
            results.map((r, i) => (
              <Link
                key={r.href}
                href={r.href}
                onClick={() => {
                  setOpen(false)
                  setQ('')
                }}
                onMouseEnter={() => setActive(i)}
                className="block border-b px-3.5 py-2.5 last:border-b-0"
                style={{ background: i === active ? 'var(--accent-soft)' : 'transparent' }}
              >
                <div className="text-[10.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
                  {r.group}
                </div>
                <div className="mt-0.5 text-[13.5px] font-semibold">{r.title}</div>
                {r.sub ? (
                  <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
                    {r.sub}
                  </div>
                ) : null}
              </Link>
            ))
          ) : (
            <div className="px-3.5 py-4 text-[13px]" style={{ color: 'var(--faint)' }}>
              Nothing matches “{q}”.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
