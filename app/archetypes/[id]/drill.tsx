'use client'

import { useState } from 'react'
import { useProgress } from '@/lib/store'
import type { Archetype, ArchetypeId } from '@/lib/types'
import { Button, Rich } from '@/components/common/ui'

export function PractiseButton({ id, name }: { id: ArchetypeId; name: string }) {
  const { state, setArchetype, ready } = useProgress()
  const active = ready && state.archetype === id
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-4"
      style={{
        background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
        borderColor: active ? 'var(--accent-line)' : 'var(--border)',
      }}
    >
      <p className="text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {active
          ? `You are practising against ${name}. Problem pages and drills lean toward their style.`
          : `Set ${name} as your interviewer and the app will pick follow-ups in their categories and weight your rubric their way.`}
      </p>
      <Button variant={active ? 'secondary' : 'primary'} onClick={() => setArchetype(active ? null : id)}>
        {active ? 'Stop practising against them' : 'Practise against them'}
      </Button>
    </div>
  )
}

const MIN_CHARS = 30

export function ArchetypeDrill({ archetype }: { archetype: Archetype }) {
  return (
    <div className="space-y-4">
      {archetype.drill.map((d, i) => (
        <DrillCard key={i} n={i + 1} d={d} />
      ))}
    </div>
  )
}

function DrillCard({ n, d }: { n: number; d: Archetype['drill'][number] }) {
  const [answer, setAnswer] = useState('')
  const [open, setOpen] = useState(false)
  const enough = answer.trim().length >= MIN_CHARS

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3 border-b px-5 py-4" style={{ background: 'var(--surface-2)' }}>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          {n}
        </span>
        <p className="text-[16px] leading-snug font-semibold">
          <Rich text={d.q} />
        </p>
      </div>

      <div className="p-5">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={open}
          rows={open ? 4 : 6}
          placeholder="Answer it the way you would say it out loud."
          className="w-full resize-y rounded-xl border px-4 py-3 text-[15px] leading-relaxed outline-none"
          style={{
            borderColor: 'var(--border-strong)',
            background: open ? 'var(--surface-2)' : 'var(--surface)',
          }}
        />

        {!open ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
              {enough ? 'Ready.' : `${answer.trim().length} / ${MIN_CHARS} characters`}
            </span>
            <Button onClick={() => setOpen(true)} disabled={!enough}>
              Submit and compare
            </Button>
          </div>
        ) : (
          <div className="fade-up mt-5 space-y-3">
            {(
              [
                ['Weak', 'var(--bad)', d.weak],
                ['Strong', 'var(--ok)', d.strong],
                ['The trap', 'var(--warn)', d.trap],
              ] as const
            ).map(([label, color, text]) => (
              <div key={label} className="rounded-xl border p-4" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                <div className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color }}>
                  {label}
                </div>
                <p className="prose text-[15px]">
                  <Rich text={text} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
