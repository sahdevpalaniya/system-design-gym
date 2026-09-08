'use client'

import Link from 'next/link'
import type { Language } from '@/lib/types'
import { useProgress } from '@/lib/store'

/** The list of concept-wise tests, with your best score on each. */
export function QuizIndex({ lang }: { lang: Language }) {
  const { state, ready } = useProgress()
  const sets = lang.quizzes ?? []

  const totalQs = sets.reduce((n, s) => n + s.questions.length, 0)
  const taken = ready ? sets.filter((s) => state.quiz?.[`quiz:${lang.id}:${s.id}`]).length : 0

  return (
    <>
      <p className="mb-7 text-[14.5px]" style={{ color: 'var(--muted)' }}>
        {totalQs} questions across {sets.length} tests, one for each section. Every wrong option is a
        mistake people really make, so getting one wrong teaches you something.
        {ready && taken > 0 ? ` You have taken ${taken} of ${sets.length}.` : ''}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {sets.map((s) => {
          const r = ready ? state.quiz?.[`quiz:${lang.id}:${s.id}`] : undefined
          const pct = r ? Math.round((r.best / r.total) * 100) : 0
          const tone = !r ? 'var(--faint)' : pct >= 80 ? 'var(--ok)' : pct >= 55 ? 'var(--warn)' : 'var(--bad)'

          return (
            <Link key={s.id} href={`/languages/${lang.id}/quiz/${s.id}`} className="card p-5 transition hover:-translate-y-px">
              <div className="mb-1.5 flex items-baseline gap-2">
                <h2 className="min-w-0 flex-1 text-[16px] font-semibold">{s.name}</h2>
                <span className="tabular shrink-0 text-[13px] font-bold" style={{ color: tone }}>
                  {r ? `${r.best}/${r.total}` : `${s.questions.length} Q`}
                </span>
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {s.blurb}
              </p>
              {r ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
                </div>
              ) : null}
              {r && r.attempts > 1 ? (
                <div className="mt-1.5 text-[11.5px]" style={{ color: 'var(--faint)' }}>
                  {r.attempts} attempts
                </div>
              ) : null}
            </Link>
          )
        })}
      </div>
    </>
  )
}
