'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { QuizQuestion, QuizSet } from '@/lib/types'
import { useProgress } from '@/lib/store'
import { Button, Rich } from '@/components/common/ui'

/** Fisher-Yates. A fresh order each attempt so you learn the answer, not its position. */
function shuffled<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Answered {
  q: QuizQuestion
  picked: number
}

export function Quiz({
  set,
  langID,
  nextSet,
}: {
  set: QuizSet
  langID: string
  /** the test after this one, so the results screen is not a dead end */
  nextSet?: { id: string; name: string }
}) {
  const { saveQuiz, state, ready } = useProgress()
  // Shuffle only after mount. Shuffling during render would give the server and
  // the client different orders, which is a hydration mismatch.
  const [questions, setQuestions] = useState(set.questions)
  useEffect(() => {
    setQuestions(shuffled(set.questions))
  }, [set.questions])

  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [log, setLog] = useState<Answered[]>([])
  const [done, setDone] = useState(false)

  const prev = ready ? state.quiz?.[`quiz:${langID}:${set.id}`] : undefined
  const q = questions[i]
  const correct = log.filter((a) => a.picked === a.q.answer).length

  function commit(choice: number) {
    if (picked !== null) return
    setPicked(choice)
    setLog((l) => [...l, { q, picked: choice }])
  }

  function next() {
    if (i + 1 >= questions.length) {
      const finalCorrect = log.filter((a) => a.picked === a.q.answer).length
      saveQuiz(`quiz:${langID}:${set.id}`, finalCorrect, questions.length)
      setDone(true)
      return
    }
    setI(i + 1)
    setPicked(null)
  }

  function restart() {
    setQuestions(shuffled(set.questions))
    setI(0)
    setPicked(null)
    setLog([])
    setDone(false)
  }

  /* ---------- results ---------- */
  if (done) {
    const wrong = log.filter((a) => a.picked !== a.q.answer)
    const pct = Math.round((correct / questions.length) * 100)
    const tone = pct >= 80 ? 'var(--ok)' : pct >= 55 ? 'var(--warn)' : 'var(--bad)'

    return (
      <div>
        <div className="card mb-6 p-6 text-center">
          <div className="tabular text-[44px] leading-none font-bold" style={{ color: tone }}>
            {correct}/{questions.length}
          </div>
          <div className="mt-2 text-[14.5px]" style={{ color: 'var(--muted)' }}>
            {pct >= 80
              ? 'Solid. Reread anything you got wrong and move on.'
              : pct >= 55
                ? 'Halfway. The misses below are the topics to reread.'
                : 'Worth another pass through these topics before you retake it.'}
          </div>
          {prev && prev.best > correct ? (
            <div className="mt-2 text-[13px]" style={{ color: 'var(--faint)' }}>
              Your best on this set is still {prev.best}/{prev.total}.
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={restart}>Retake</Button>
            {nextSet ? (
              <Link
                href={`/languages/${langID}/quiz/${nextSet.id}`}
                className="card px-4 py-2 text-[14px] font-semibold transition hover:-translate-y-px"
              >
                Next test: {nextSet.name} →
              </Link>
            ) : null}
            <Link
              href={`/languages/${langID}/quiz`}
              className="px-3 py-2 text-[13.5px] font-medium transition hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              All tests
            </Link>
          </div>
        </div>

        {wrong.length ? (
          <>
            <h2 className="mb-3 text-[17px] font-bold">What you missed</h2>
            <div className="space-y-3">
              {wrong.map((a) => (
                <div key={a.q.id} className="card p-4">
                  <p className="mb-2 text-[15px] leading-snug font-semibold">
                    <Rich text={a.q.q} />
                  </p>
                  <p className="mb-1 text-[14px]" style={{ color: 'var(--bad)' }}>
                    You picked: <Rich text={a.q.options[a.picked]} />
                  </p>
                  <p className="mb-2.5 text-[14px]" style={{ color: 'var(--ok)' }}>
                    Correct: <Rich text={a.q.options[a.q.answer]} />
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    <Rich text={a.q.why} />
                  </p>
                  {a.q.from ? (
                    <Link
                      href={`/languages/${langID}/${a.q.from}`}
                      className="mt-2.5 inline-block text-[13px] font-medium hover:opacity-70"
                      style={{ color: 'var(--accent)' }}
                    >
                      Reread the topic →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-[15px]" style={{ color: 'var(--ok)' }}>
            Every one correct.
          </p>
        )}
      </div>
    )
  }

  /* ---------- a question ---------- */
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(i / questions.length) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
        <span className="tabular shrink-0 text-[12.5px]" style={{ color: 'var(--faint)' }}>
          {i + 1} / {questions.length}
        </span>
      </div>

      <p className="mb-5 text-[19px] leading-snug font-semibold">
        <Rich text={q.q} />
      </p>

      <div className="space-y-2">
        {q.options.map((opt, oi) => {
          const isAnswer = oi === q.answer
          const isPicked = oi === picked
          const show = picked !== null

          let border = 'var(--border-strong)'
          let bg = 'var(--surface)'
          if (show && isAnswer) {
            border = 'var(--ok)'
            bg = 'var(--say-bg)'
          } else if (show && isPicked) {
            border = 'var(--bad)'
            bg = 'var(--trap-bg)'
          }

          return (
            <button
              key={oi}
              type="button"
              onClick={() => commit(oi)}
              disabled={show}
              className="flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-relaxed transition"
              style={{ borderColor: border, background: bg, cursor: show ? 'default' : 'pointer' }}
            >
              <span
                className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
                style={{ borderColor: border, color: 'var(--muted)' }}
              >
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="min-w-0 flex-1">
                <Rich text={opt} />
              </span>
            </button>
          )
        })}
      </div>

      {picked !== null ? (
        <div className="mt-5">
          <div
            className="rounded-xl px-4 py-3.5 text-[14.5px] leading-relaxed"
            style={{ background: 'var(--surface-2)' }}
          >
            <span
              className="font-semibold"
              style={{ color: picked === q.answer ? 'var(--ok)' : 'var(--bad)' }}
            >
              {picked === q.answer ? 'Correct. ' : 'Not quite. '}
            </span>
            <Rich text={q.why} />
            {q.from ? (
              <Link
                href={`/languages/${langID}/${q.from}`}
                className="mt-2 block text-[13px] font-medium hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                Read the topic →
              </Link>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="tabular text-[13px]" style={{ color: 'var(--faint)' }}>
              {correct} correct so far
            </span>
            <Button onClick={next}>{i + 1 >= questions.length ? 'See results' : 'Next question'}</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
