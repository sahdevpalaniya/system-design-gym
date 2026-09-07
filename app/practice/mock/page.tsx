'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { PROBLEMS, getProblem } from '@/content/problems'
import { getGroup } from '@/content/method'
import { getArchetype } from '@/content/archetypes'
import { problemState, useProgress } from '@/lib/store'
import type { StageId } from '@/lib/types'
import { StageEngine } from '@/components/StageEngine'
import { Badge, Button, Card, Page, PageHeader, StateDot } from '@/components/ui'

const ALL: StageId[] = [1, 2, 3, 4, 5]

function MockInner() {
  const params = useSearchParams()
  const { state, ready } = useProgress()
  const [chosen, setChosen] = useState<string | null>(params.get('problem'))
  const [started, setStarted] = useState(false)

  const problem = chosen ? getProblem(chosen) : null
  const archetype = ready && state.archetype ? getArchetype(state.archetype) : null

  if (problem && started) {
    return (
      <Page>
        <PageHeader
          eyebrow="Timed mock · 45 min · nothing revealed until the end"
          title={problem.title}
          lede={problem.prompt}
          meta={
            <>
              <Badge tone="accent">{getGroup(problem.group).name}</Badge>
              {archetype ? <Badge>{archetype.name}</Badge> : null}
            </>
          }
        />
        <StageEngine problem={problem} stageIds={ALL} revealMode="end" timed />
      </Page>
    )
  }

  if (problem) {
    return (
      <Page>
        <PageHeader eyebrow="Timed mock" title={problem.title} lede={problem.prompt} />
        <Card>
          <h2 className="text-[18px] font-semibold">Before you start</h2>
          <ul className="mt-4 space-y-3">
            {[
              'Forty-five minutes, five stages, each with its own timer. The timers keep running past zero rather than cutting you off — going over is information, not a failure.',
              'Nothing is revealed until all five stages are submitted. No model answers, no checklists, no hints along the way. That is the point of a mock.',
              'At the end you read all five model answers, mark honestly what you actually had, and get a full report card across all six axes.',
              'Write the way you would speak. Your reasoning is graded — never your grammar or spelling.',
              'If you get stuck, write down that you are stuck and what you would ask. That is what you would do in the room.',
            ].map((t, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed">
                <span style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                <span style={{ color: 'var(--muted)' }}>{t}</span>
              </li>
            ))}
          </ul>

          {archetype ? (
            <div className="mt-5 rounded-lg px-4 py-3.5" style={{ background: 'var(--accent-soft)' }}>
              <div className="mb-1 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--accent)' }}>
                Your interviewer today
              </div>
              <p className="text-[14px] leading-relaxed">
                <strong>{archetype.name}</strong> — {archetype.tagline} The follow-up at the end will come from
                their categories.
              </p>
            </div>
          ) : (
            <p className="mt-5 text-[13.5px]" style={{ color: 'var(--faint)' }}>
              No interviewer archetype selected. Pick one on the{' '}
              <a href="/archetypes" className="underline">
                interviewers page
              </a>{' '}
              to change which follow-ups fire and how the rubric is weighted.
            </p>
          )}

          <div className="mt-6 border-t pt-5">
            <Button onClick={() => setStarted(true)} size="lg" full>
              Start the mock
            </Button>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page wide>
      <PageHeader
        eyebrow="Timed mock · 45 min"
        title="Pick a problem"
        lede="All five stages, phase timers, **nothing revealed until the end**, then a full report card. This is the one thing here that takes over fifteen minutes, and it is meant to."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((p) => {
          const st = ready ? problemState(state, p.slug) : 'untouched'
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => setChosen(p.slug)}
              className="card p-4 text-left transition hover:-translate-y-px"
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <h3 className="text-[15.5px] leading-snug font-semibold">{p.title}</h3>
                <span className="mt-1.5">
                  <StateDot state={st} />
                </span>
              </div>
              <p className="mb-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                {getGroup(p.group).name}
              </p>
              <Badge tone={p.difficulty === 'hard' ? 'bad' : p.difficulty === 'core' ? 'accent' : 'neutral'}>
                {p.difficulty}
              </Badge>
            </button>
          )
        })}
      </div>

      {ready && state.mocks.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-[17px] font-semibold">Your past mocks</h2>
          <div className="space-y-2">
            {state.mocks.slice(0, 8).map((m) => {
              const p = getProblem(m.problemSlug)
              const avg =
                Object.values(m.scores).reduce((a, b) => a + b, 0) / Object.values(m.scores).length
              return (
                <div key={m.id} className="card flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="text-[14.5px] font-semibold">{p?.title ?? m.problemSlug}</div>
                    <div className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
                      {new Date(m.at).toLocaleDateString()}
                      {m.archetype ? ` · ${getArchetype(m.archetype)?.name}` : ''}
                    </div>
                  </div>
                  <span className="tabular text-[19px] font-bold" style={{ color: 'var(--accent)' }}>
                    {avg.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </Page>
  )
}

export default function MockPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <div className="py-24 text-center text-[14px]" style={{ color: 'var(--faint)' }}>
            Loading…
          </div>
        </Page>
      }
    >
      <MockInner />
    </Suspense>
  )
}
