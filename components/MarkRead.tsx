'use client'

import { useEffect } from 'react'
import { useProgress } from '@/lib/store'

/** page is counted as read once it has been open this long */
const AUTO_MS = 25_000

/**
 * The done/pending checkbox that drives the sidebar ticks.
 *
 * It ticks itself after you have had the page open for a while, so normal
 * reading is tracked without asking, and the button stays there to correct it
 * either way.
 */
export function MarkRead({ id, label = 'this page' }: { id: string; label?: string }) {
  const { state, setRead, ready } = useProgress()
  const done = Boolean(state.read?.[id])

  useEffect(() => {
    if (!ready || done) return
    const t = setTimeout(() => setRead(id, true), AUTO_MS)
    return () => clearTimeout(t)
  }, [ready, done, id, setRead])

  return (
    <button
      type="button"
      onClick={() => setRead(id, !done)}
      className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14.5px] transition hover:-translate-y-px"
      style={{
        borderColor: done ? 'var(--ok)' : 'var(--border-strong)',
        background: done ? 'var(--surface-2)' : 'var(--surface)',
      }}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
        style={{
          borderColor: done ? 'var(--ok)' : 'var(--border-strong)',
          background: done ? 'var(--ok)' : 'transparent',
        }}
        aria-hidden
      >
        {done ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.4">
            <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{done ? 'Done' : `Mark ${label} as done`}</span>
        <span className="block text-[12.5px]" style={{ color: 'var(--faint)' }}>
          {done ? 'Click again if you want to read it later.' : 'Ticks itself once you have read for a bit.'}
        </span>
      </span>
    </button>
  )
}
