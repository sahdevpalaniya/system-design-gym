'use client'

import { useState } from 'react'
import { useProgress } from '@/lib/store'
import type { CompanyQuestion } from '@/lib/types'
import { Callout } from './visuals'
import { GapLog } from './GapLog'
import { Badge, Button, Prose, Rich } from './ui'

const MIN_CHARS = 60

/**
 * Same gate as everywhere else: no model answer until you have written
 * something. Hints are available before submitting — they are nudges that make
 * you think, never the answer itself.
 */
export function CompanyDrill({ question }: { question: CompanyQuestion }) {
  const { saveStage, addGap, ready } = useProgress()
  const [answer, setAnswer] = useState('')
  const [shown, setShown] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [checked, setChecked] = useState<number[]>([])
  const [showFollowUp, setShowFollowUp] = useState(false)

  const enough = answer.trim().length >= MIN_CHARS
  const score = Math.round((checked.length / question.checklist.length) * 10)

  function toggle(i: number) {
    setChecked((c) => {
      const next = c.includes(i) ? c.filter((x) => x !== i) : [...c, i]
      saveStage(
        `company:${question.id}`,
        4,
        answer,
        next,
        question.checklist.length,
        'design',
        `${question.title} (company practice)`,
      )
      return next
    })
  }

  if (!ready) return null

  return (
    <div>
      {/* ---- what they are really testing ---- */}
      <div
        className="mb-6 rounded-xl border px-5 py-4"
        style={{ background: 'var(--surface-2)' }}
      >
        <div
          className="mb-1.5 text-[11px] font-bold tracking-[0.06em] uppercase"
          style={{ color: 'var(--accent)' }}
        >
          What they are actually testing
        </div>
        <p className="text-[14.5px] leading-relaxed">
          <Rich text={question.whatTheyWant} />
        </p>
      </div>

      {/* ---- your answer ---- */}
      <div className="mb-5">
        <label htmlFor="answer" className="mb-2 block text-[14px] font-semibold">
          Your answer
        </label>
        <textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={submitted}
          rows={submitted ? 6 : 14}
          placeholder="Work through it the way you would out loud. Requirements, then the lifecycle, then the numbers, then the design. Use the hints below if you get stuck — they will not give you the answer."
          className="w-full resize-y rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none"
          style={{
            borderColor: 'var(--border-strong)',
            background: submitted ? 'var(--surface-2)' : 'var(--surface)',
          }}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
            {submitted
              ? 'Submitted and saved.'
              : enough
                ? 'Ready. Reasoning is graded, never grammar.'
                : `${answer.trim().length} / ${MIN_CHARS} characters`}
          </span>
          {!submitted ? (
            <Button onClick={() => setSubmitted(true)} disabled={!enough}>
              Submit and compare
            </Button>
          ) : null}
        </div>
      </div>

      {/* ---- progressive hints, before the answer ---- */}
      {!submitted ? (
        <div className="card mb-6 p-5">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15.5px] font-semibold">Stuck? Take one hint at a time</h3>
            <span className="tabular text-[12.5px]" style={{ color: 'var(--faint)' }}>
              {shown} of {question.hints.length} used
            </span>
          </div>
          <p className="mb-4 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Each one is a question to ask yourself, not an answer. Think about it before taking the
            next — the point is to get further on your own each time.
          </p>

          <div className="space-y-2.5">
            {question.hints.slice(0, shown).map((h, i) => (
              <div
                key={i}
                className="fade-up rounded-xl border-l-2 py-2.5 pr-3 pl-4"
                style={{ borderLeftColor: 'var(--accent)', background: 'var(--accent-soft)' }}
              >
                <div className="mb-1 text-[11.5px] font-bold" style={{ color: 'var(--accent)' }}>
                  Hint {i + 1} — {h.label}
                </div>
                <p className="text-[14.5px] leading-relaxed">
                  <Rich text={h.text} />
                </p>
              </div>
            ))}
          </div>

          {shown < question.hints.length ? (
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={() => setShown((s) => s + 1)}>
                {shown === 0 ? 'Give me a nudge' : 'I am still stuck — next hint'}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-[13px]" style={{ color: 'var(--faint)' }}>
              That is every hint. Write what you have — an incomplete answer you reasoned your way to
              is worth far more than reading ours.
            </p>
          )}
        </div>
      ) : null}

      {!submitted ? (
        <div
          className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px]"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--faint)' }}
        >
          The model answer is locked until you submit.
        </div>
      ) : null}

      {/* ---- revealed ---- */}
      {submitted ? (
        <div className="fade-up">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span
              className="text-[11.5px] font-bold tracking-[0.07em] uppercase"
              style={{ color: 'var(--accent)' }}
            >
              A model answer
            </span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          <div className="card mb-6 p-5">
            <Prose paragraphs={question.model} />
          </div>

          <div className="card mb-6 p-5">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-[15px] font-semibold">Which of these did you have?</h4>
              <span className="tabular text-[14px] font-bold" style={{ color: 'var(--accent)' }}>
                {checked.length} / {question.checklist.length} → {score}/10
              </span>
            </div>
            <p className="mb-4 text-[13px]" style={{ color: 'var(--muted)' }}>
              Be honest. Half-having it does not count.
            </p>
            <div className="space-y-1">
              {question.checklist.map((c, i) => {
                const on = checked.includes(i)
                return (
                  <label
                    key={i}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition"
                    style={{ background: on ? 'var(--surface-2)' : 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(i)}
                      className="mt-[3px] h-4 w-4 shrink-0"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span
                      className="text-[14px] leading-relaxed"
                      style={{ color: on ? 'var(--text)' : 'var(--muted)' }}
                    >
                      {c}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ---- the follow-up, gated again ---- */}
          <div className="card mb-6 p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">Follow-up</Badge>
              <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                They will ask this next.
              </span>
            </div>
            <p className="mb-4 text-[16.5px] leading-snug font-semibold">
              <Rich text={question.followUp.q} />
            </p>
            {showFollowUp ? (
              <div className="fade-up rounded-xl border-l-2 p-4" style={{ borderLeftColor: 'var(--ok)' }}>
                <div
                  className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] uppercase"
                  style={{ color: 'var(--ok)' }}
                >
                  What a strong answer sounds like
                </div>
                <p className="prose text-[15px]">
                  <Rich text={question.followUp.answer} />
                </p>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowFollowUp(true)}>
                Think about it first, then reveal
              </Button>
            )}
          </div>

          <GapLog source={`company:${question.id}`} onAdd={addGap} />
        </div>
      ) : null}
    </div>
  )
}
