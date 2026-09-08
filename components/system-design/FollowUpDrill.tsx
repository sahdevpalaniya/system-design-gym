'use client'

import { useEffect, useRef, useState } from 'react'
import { CATEGORY_INFO } from '@/content/system-design/followups'
import { useProgress } from '@/lib/store'
import type { FollowUp } from '@/lib/types'
import { Badge, Button, Rich } from '@/components/common/ui'

const MIN_CHARS = 30
const SECONDS = 90

export function FollowUpDrill({
  followUp,
  onNext,
  autoStart = false,
}: {
  followUp: FollowUp
  onNext?: () => void
  autoStart?: boolean
}) {
  const { saveFollowUp } = useProgress()
  const [answer, setAnswer] = useState('')
  const [started, setStarted] = useState(autoStart)
  const [submitted, setSubmitted] = useState(false)
  const [rated, setRated] = useState<1 | 2 | 3 | null>(null)
  const [left, setLeft] = useState(SECONDS)
  const ref = useRef<HTMLTextAreaElement>(null)

  // reset when the question changes
  useEffect(() => {
    setAnswer('')
    setStarted(autoStart)
    setSubmitted(false)
    setRated(null)
    setLeft(SECONDS)
  }, [followUp.id, autoStart])

  useEffect(() => {
    if (!started || submitted) return
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [started, submitted])

  useEffect(() => {
    if (started && !submitted) ref.current?.focus()
  }, [started, submitted])

  const enough = answer.trim().length >= MIN_CHARS
  const over = left < 0
  const m = Math.floor(Math.abs(left) / 60)
  const s = Math.abs(left) % 60
  const info = CATEGORY_INFO[followUp.category]

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5" style={{ background: 'var(--surface-2)' }}>
        <Badge tone="accent">{info.name}</Badge>
        {started && !submitted ? (
          <span
            className="tabular text-[13px] font-semibold"
            style={{ color: over ? 'var(--bad)' : left < 20 ? 'var(--warn)' : 'var(--muted)' }}
          >
            {over ? 'over by ' : ''}
            {m}:{String(s).padStart(2, '0')}
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <p className="prose mb-5 text-[18px] leading-snug font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
          <Rich text={followUp.q} />
        </p>

        {!started ? (
          <div className="text-center">
            <p className="mx-auto mb-4 max-w-md text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Ninety seconds. Answer as if someone just said this to you and is waiting. Do not plan — talk.
            </p>
            <Button onClick={() => setStarted(true)} size="lg">
              Start the clock
            </Button>
          </div>
        ) : (
          <>
            <textarea
              ref={ref}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              readOnly={submitted}
              rows={submitted ? 4 : 7}
              placeholder="Defend it. Name the cost. Do not bluff — 'I would measure that' is a strong answer."
              className="w-full resize-y rounded-xl border px-4 py-3 text-[15px] leading-relaxed outline-none"
              style={{
                borderColor: 'var(--border-strong)',
                background: submitted ? 'var(--surface-2)' : 'var(--surface)',
              }}
            />

            {!submitted ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
                  {enough ? 'Ready.' : `${answer.trim().length} / ${MIN_CHARS} characters`}
                </span>
                <Button onClick={() => setSubmitted(true)} disabled={!enough}>
                  Submit and see all three
                </Button>
              </div>
            ) : null}
          </>
        )}

        {submitted ? (
          <div className="fade-up mt-6 space-y-3">
            <Reveal label="What a weak answer sounds like" tone="bad" text={followUp.weak} />
            <Reveal label="What a strong answer sounds like" tone="ok" text={followUp.strong} />
            <Reveal label="The trap hidden in the question" tone="warn" text={followUp.trap} />

            <div className="card mt-5 p-5">
              <h4 className="mb-1 text-[15px] font-semibold">Honestly — where was yours?</h4>
              <p className="mb-4 text-[13px]" style={{ color: 'var(--muted)' }}>
                This feeds the Defence axis and tells the app which categories keep catching you.
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    [1, 'Closer to weak'],
                    [2, 'Somewhere in between'],
                    [3, 'Closer to strong'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setRated(v)
                      saveFollowUp(followUp.id, followUp.category, answer, v)
                    }}
                    disabled={rated !== null}
                    className="rounded-lg border px-3.5 py-2 text-[13.5px] font-medium transition disabled:opacity-50"
                    style={{
                      borderColor: rated === v ? 'var(--accent)' : 'var(--border-strong)',
                      background: rated === v ? 'var(--accent-soft)' : 'var(--surface)',
                      color: rated === v ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {rated && onNext ? (
                <div className="mt-5 border-t pt-4">
                  <Button onClick={onNext} full size="lg">
                    Next question →
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Reveal({
  label,
  tone,
  text,
}: {
  label: string
  tone: 'bad' | 'ok' | 'warn'
  text: string
}) {
  const colors = { bad: 'var(--bad)', ok: 'var(--ok)', warn: 'var(--warn)' }
  return (
    <div className="rounded-xl border p-4" style={{ borderLeftWidth: 3, borderLeftColor: colors[tone] }}>
      <div className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: colors[tone] }}>
        {label}
      </div>
      <p className="prose text-[15px]">
        <Rich text={text} />
      </p>
    </div>
  )
}
