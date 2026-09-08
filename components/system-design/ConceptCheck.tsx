'use client'

import { useState } from 'react'
import { useProgress } from '@/lib/store'
import type { Concept, ConceptVisual } from '@/lib/types'
import { AnimatedFlow, CompareCards, Diagram, NumbersBar } from '@/components/common/visuals'
import { Button, Rich } from '@/components/common/ui'

/* ---------- render whichever visual a concept declared ---------- */

export function ConceptVisualBlock({ visual }: { visual: ConceptVisual }) {
  if (visual.type === 'diagram' && visual.diagram) return <Diagram spec={visual.diagram} />
  if (visual.type === 'flow' && visual.flow)
    return <AnimatedFlow scenario={visual.flow.scenario} caption={visual.flow.caption} />
  if (visual.type === 'compare' && visual.compare) return <CompareCards spec={visual.compare} />
  if (visual.type === 'numbers' && visual.numbers) return <NumbersBar spec={visual.numbers} />
  return null
}

/* ---------- the gated 60-second self-check ---------- */

const MIN_CHARS = 25

export function ConceptCheck({ concept }: { concept: Concept }) {
  const { saveConcept, state } = useProgress()
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [rated, setRated] = useState<1 | 2 | 3 | 4 | null>(null)
  const enough = answer.trim().length >= MIN_CHARS
  const prev = state.concepts[concept.slug]

  return (
    <div className="card overflow-hidden">
      <div className="border-b px-5 py-3.5" style={{ background: 'var(--surface-2)' }}>
        <div className="text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
          60-second self-check
        </div>
      </div>

      <div className="p-5">
        <p className="prose mb-5 text-[17px] leading-snug font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
          <Rich text={concept.selfCheck.q} />
        </p>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={revealed}
          rows={revealed ? 4 : 6}
          placeholder="Answer from memory before you look. This is the whole point."
          className="w-full resize-y rounded-xl border px-4 py-3 text-[15px] leading-relaxed outline-none"
          style={{
            borderColor: 'var(--border-strong)',
            background: revealed ? 'var(--surface-2)' : 'var(--surface)',
          }}
        />

        {!revealed ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
              {enough ? 'Ready.' : `${answer.trim().length} / ${MIN_CHARS} characters`}
            </span>
            <Button onClick={() => setRevealed(true)} disabled={!enough}>
              Submit and compare
            </Button>
          </div>
        ) : (
          <div className="fade-up mt-5">
            <div className="rounded-xl border p-4" style={{ borderLeftWidth: 3, borderLeftColor: 'var(--ok)' }}>
              <div className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--ok)' }}>
                A good answer
              </div>
              <p className="prose text-[15px]">
                <Rich text={concept.selfCheck.answer} />
              </p>
            </div>

            <div className="mt-5 border-t pt-4">
              <h4 className="mb-1 text-[15px] font-semibold">How close were you?</h4>
              <p className="mb-3.5 text-[13px]" style={{ color: 'var(--muted)' }}>
                This decides when this concept comes back. Rate it low and it returns tomorrow.
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    [1, 'Missed it', 'back tomorrow'],
                    [2, 'Partly', 'back in 3 days'],
                    [3, 'Mostly', 'back in a week'],
                    [4, 'Had it', 'back in 3 weeks'],
                  ] as const
                ).map(([v, label, when]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setRated(v)
                      saveConcept(concept.slug, v, answer)
                    }}
                    disabled={rated !== null}
                    className="rounded-lg border px-3.5 py-2 text-left transition disabled:opacity-45"
                    style={{
                      borderColor: rated === v ? 'var(--accent)' : 'var(--border-strong)',
                      background: rated === v ? 'var(--accent-soft)' : 'var(--surface)',
                    }}
                  >
                    <div className="text-[13.5px] font-semibold" style={{ color: rated === v ? 'var(--accent)' : 'var(--text)' }}>
                      {label}
                    </div>
                    <div className="text-[11.5px]" style={{ color: 'var(--faint)' }}>
                      {when}
                    </div>
                  </button>
                ))}
              </div>
              {rated ? (
                <p className="fade-up mt-4 text-[13.5px]" style={{ color: 'var(--ok)' }}>
                  Saved. Scheduled for review — you will find it on your home screen when it is due.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {prev && !revealed ? (
          <p className="mt-4 border-t pt-3 text-[12.5px]" style={{ color: 'var(--faint)' }}>
            You have done this {prev.reps} time{prev.reps === 1 ? '' : 's'}. Last time you rated yourself{' '}
            {['', 'missed it', 'partly', 'mostly', 'had it'][prev.lastRating]}.
          </p>
        ) : null}
      </div>
    </div>
  )
}
