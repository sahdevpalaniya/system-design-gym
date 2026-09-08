'use client'

import { useMemo, useState } from 'react'
import { parseSketch } from '@/lib/sketch'
import { Diagram } from '@/components/common/visuals'

const PLACEHOLDER = `client -> lb -> app -> db
app -> cache: hit 99%
app -> queue -> worker`

/**
 * Draw the design, not just describe it.
 *
 * Interviews happen on a whiteboard and everything else in this app is prose,
 * so this is the one place you have to make the boxes connect. Optional by
 * design — it is a rehearsal aid, not another thing to be graded on.
 */
export function Sketchpad({
  value,
  onChange,
  rows = 5,
  title = 'Sketchpad · optional',
  blurb = 'Type the arrows the way you would say them out loud and they get drawn. Not graded, not saved — it is here because a design that reads fine in a paragraph often does not connect up when you have to draw it.',
}: {
  /** controlled text — omit to let the component hold its own */
  value?: string
  onChange?: (v: string) => void
  rows?: number
  title?: string
  blurb?: string
} = {}) {
  const [own, setOwn] = useState('')
  const text = value ?? own
  const setText = onChange ?? setOwn
  const { spec, notes } = useMemo(() => parseSketch(text), [text])

  return (
    <div className="card mt-5 overflow-hidden">
      <div className="border-b px-5 py-3.5" style={{ background: 'var(--surface-2)' }}>
        <div
          className="text-[11.5px] font-bold tracking-[0.06em] uppercase"
          style={{ color: 'var(--accent)' }}
        >
          {title}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {blurb}
        </p>
      </div>

      <div className="p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={rows}
          spellCheck={false}
          placeholder={PLACEHOLDER}
          className="w-full resize-y rounded-xl border px-4 py-3 font-mono text-[13.5px] leading-relaxed outline-none"
          style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
        />
        <p className="mt-2 text-[12px]" style={{ color: 'var(--faint)' }}>
          One arrow chain per line. Add <code>: label</code> at the end to name the last arrow. Names
          containing cache, queue, db or user are drawn as that kind of box.
        </p>

        {spec ? (
          <div className="mt-4">
            <Diagram spec={spec} />
          </div>
        ) : null}

        {notes.length ? (
          <ul className="mt-3 space-y-1.5">
            {notes.map((n, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--cost)' }}>
                <span aria-hidden>·</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
