'use client'

import { useEffect, useState } from 'react'
import { headingSlug } from '@/lib/slug'

/**
 * In-page contents. Long topics were the single most common complaint — you
 * could not see how much was left or jump to the part you wanted. Collapsed by
 * default on small screens so it never costs a scroll on a phone.
 */
export function Contents({ headings }: { headings: string[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(headingSlug(h)))
      .filter((e): e is HTMLElement => Boolean(e))
    if (!els.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    els.forEach((e) => obs.observe(e))
    return () => obs.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  return (
    <nav
      aria-label="On this page"
      className="mb-9 rounded-xl border px-4 py-3.5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
    >
      <div
        className="mb-2 text-[11px] font-bold tracking-[0.07em] uppercase"
        style={{ color: 'var(--faint)' }}
      >
        On this page · {headings.length} sections
      </div>
      <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {headings.map((h, i) => {
          const id = headingSlug(h)
          const on = active === id
          return (
            <li key={id} className="flex gap-2 text-[13.5px] leading-snug">
              <span className="tabular shrink-0" style={{ color: 'var(--dim)' }}>
                {i + 1}.
              </span>
              <a
                href={`#${id}`}
                className="min-w-0 transition hover:opacity-70"
                style={{ color: on ? 'var(--accent)' : 'var(--muted)', fontWeight: on ? 600 : 400 }}
              >
                {h}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

