'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { PROBLEMS, getProblem } from '@/content/problems'
import { getGroup } from '@/content/method'
import { problemState, useProgress } from '@/lib/store'
import type { StageId } from '@/lib/types'
import { StageEngine } from '@/components/StageEngine'
import { Badge, Button, Card, Page, PageHeader, StateDot } from '@/components/ui'

const DAILY_STAGES: StageId[] = [1, 2]

function DailyInner() {
  const params = useSearchParams()
  const { state, ready } = useProgress()
  const [chosen, setChosen] = useState<string | null>(params.get('problem'))

  const suggestion = useMemo(() => {
    if (!ready) return PROBLEMS[0]
    const seen = new Set(
      PROBLEMS.filter((p) => problemState(state, p.slug) !== 'untouched').map((p) => p.group),
    )
    return (
      PROBLEMS.find((p) => problemState(state, p.slug) === 'untouched' && !seen.has(p.group)) ??
      PROBLEMS.find((p) => problemState(state, p.slug) === 'untouched') ??
      PROBLEMS[0]
    )
  }, [state, ready])

  const problem = chosen ? getProblem(chosen) : null

  if (problem) {
    return (
      <Page>
        <PageHeader
          eyebrow={
            <>
              Daily Rep · 15 min · stages 1 and 2 only
            </>
          }
          title={problem.title}
          lede={problem.prompt}
          meta={<Badge tone="accent">{getGroup(problem.group).name}</Badge>}
        />

        <div
          className="mb-8 rounded-xl border px-5 py-4 text-[14.5px] leading-relaxed"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          <strong style={{ color: 'var(--text)' }}>Requirements and lifecycle only.</strong> No numbers, no
          architecture, no deep dive — those are for a full session. These two stages are where most people are
          weakest, because in a real interview they rush past them to get to the drawing.
        </div>

        <StageEngine problem={problem} stageIds={DAILY_STAGES} />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <span className="text-[13.5px]" style={{ color: 'var(--muted)' }}>
            Want the whole thing instead?
          </span>
          <Button href={`/problems/${problem.slug}`} variant="secondary" size="sm">
            Open all five stages →
          </Button>
        </div>
      </Page>
    )
  }

  return (
    <Page wide>
      <PageHeader
        eyebrow="Daily Rep · 15 min"
        title="One problem, stages 1 and 2"
        lede="Requirements and lifecycle. Never a full design. **Small and daily beats long and rare** — and these are the two stages people skip when they are nervous."
      />

      {ready ? (
        <Card className="mb-8">
          <div className="mb-2 text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
            Suggested for you
          </div>
          <h2 className="text-[20px] font-bold">{suggestion.title}</h2>
          <p className="mt-2 mb-4 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {getGroup(suggestion.group).name} — a shape you have not worked yet. Covering a new shape teaches
            you more than a second problem in a shape you already know.
          </p>
          <Button onClick={() => setChosen(suggestion.slug)}>Start this one →</Button>
        </Card>
      ) : null}

      <h2 className="mb-3 text-[17px] font-semibold">Or pick another</h2>
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
                <h3 className="text-[15px] leading-snug font-semibold">{p.title}</h3>
                <span className="mt-1.5">
                  <StateDot state={st} />
                </span>
              </div>
              <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
                {getGroup(p.group).name}
              </p>
            </button>
          )
        })}
      </div>
    </Page>
  )
}

export default function DailyPage() {
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
      <DailyInner />
    </Suspense>
  )
}
