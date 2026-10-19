'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SearchRow as Row } from '@/lib/nav-index'

/* The rows (a few hundred, so no index is needed) are fetched from
 * /search-index.json the first time the box is used, not bundled. */
let cached: Promise<Row[]> | null = null
function loadRows(): Promise<Row[]> {
  cached ??= fetch('/search-index.json')
    .then((r) => (r.ok ? (r.json() as Promise<Row[]>) : Promise.reject(new Error(String(r.status)))))
    .catch((e) => {
      cached = null
      throw e
    })
  return cached
}

/** Every term must appear somewhere. Title matches rank above body matches. */
function search(rows: Row[], q: string): Row[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []

  const hits: { row: Row; score: number }[] = []
  for (const row of rows) {
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

  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const results = useMemo(() => (rows ? search(rows, q) : []), [rows, q])

  // fetch the index once the box is opened; after a failed load, the next
  // keystroke or open tries again
  useEffect(() => {
    if (!open || rows) return
    let live = true
    loadRows().then(
      (r) => {
        if (!live) return
        setFailed(false)
        setRows(r)
      },
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
  }, [open, rows, q])

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
        placeholder="Search…"
        aria-label="Search topics"
        // 16px on phones: anything smaller makes iOS zoom the page on focus
        className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none transition sm:py-1.5 sm:text-[0.8125rem]"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
      />

      {open && q.trim() ? (
        <div
          // the box is narrow on a phone, so results span the screen under the header there
          className="fixed top-[calc(var(--header-h)-2.6rem)] right-3 left-3 z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border shadow-lg sm:absolute sm:top-full sm:right-0 sm:left-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)' }}
        >
          {!rows ? (
            <div className="px-3.5 py-4 text-[0.8125rem]" style={{ color: 'var(--faint)' }}>
              {failed ? 'Search unavailable, try again' : 'Loading…'}
            </div>
          ) : results.length ? (
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
                <div className="text-[0.6562rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
                  {r.group}
                </div>
                <div className="mt-0.5 text-[0.8438rem] font-semibold">{r.title}</div>
                {r.sub ? (
                  <div className="mt-0.5 line-clamp-2 text-[0.75rem] leading-snug" style={{ color: 'var(--muted)' }}>
                    {r.sub}
                  </div>
                ) : null}
              </Link>
            ))
          ) : (
            <div className="px-3.5 py-4 text-[0.8125rem]" style={{ color: 'var(--faint)' }}>
              Nothing matches “{q}”.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
