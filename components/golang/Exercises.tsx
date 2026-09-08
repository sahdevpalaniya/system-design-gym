'use client'

import { useState } from 'react'
import type { LangExercise } from '@/lib/types'
import { Rich } from '@/components/common/ui'

/**
 * The drills at the end of a topic. Answers stay hidden until asked for —
 * seeing the answer before you have tried is the whole thing this site is
 * against, but having nowhere to check is how people quietly give up.
 */
export function Exercises({ items }: { items: (string | LangExercise)[] }) {
  const rows = items.map((x) => (typeof x === 'string' ? { task: x } : x))
  const [open, setOpen] = useState<Record<number, boolean>>({})

  return (
    <ol className="space-y-2.5">
      {rows.map((ex, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
          <span
            className="tabular mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            {i + 1}
          </span>

          <span className="min-w-0 flex-1">
            <Rich text={ex.task} />

            {ex.answer ? (
              open[i] ? (
                <span
                  className="mt-2 block rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed"
                  style={{ background: 'var(--say-bg)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--say)' }}>
                    What you should see:{' '}
                  </span>
                  <Rich text={ex.answer} />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [i]: true }))}
                  className="mt-1 block text-[12.5px] font-medium transition hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  Stuck? Show what you should see →
                </button>
              )
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  )
}
