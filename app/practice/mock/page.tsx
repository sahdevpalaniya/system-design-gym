'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { getGroup } from '@/content/system-design/method'
import { getArchetype } from '@/content/system-design/archetypes'
import { problemState, useProgress } from '@/lib/store'
import type { StageId } from '@/lib/types'
import { StageEngine } from '@/components/system-design/StageEngine'
import { Badge, Button, Card, Page, PageHeader, StateDot } from '@/components/common/ui'
import { ModeIntro, type ModeFaq, type ModeSection } from '@/components/common/ModeIntro'

/** server-rendered in every branch (and the Suspense fallback), so the static HTML explains the tool */
const INTRO = [
  "The timed mock is a 45-minute system design interview on one problem, under interview conditions. It covers all five stages, from requirements to the deep dive, and each stage has its own timer. The timers keep running past zero instead of cutting you off, because going over is useful information, not a failure.",
  "Pick a problem, read the rules, then start. Nothing is revealed until all five stages are submitted: no model answers, checklists or hints along the way. At the end you read the model answers, mark honestly what you actually had, and get a report card across six axes. If you have chosen an [interviewer archetype](/archetypes), it decides which follow-up you face at the end."
]

const SECTIONS: ModeSection[] = [
  {
    heading: 'Who it is for',
    paragraphs: [
      "Someone close to a real interview who has already worked a few [problems](/problems) stage by stage and now wants to rehearse the whole thing at full pace, with nobody to lean on. The mock tests whether you can manage the clock as well as the content: knowing when to stop asking questions and start drawing is a skill of its own.",
      "If you have not tried any problems yet, start gentler. The [daily rep](/practice/daily) covers the first two stages in fifteen minutes, and a problem's own page lets you see each model answer as soon as you submit that stage.",
    ],
  },
  {
    heading: 'How the 45 minutes are split',
    paragraphs: [
      "Requirements get 5 minutes, actors and lifecycle 6, numbers 6, the high-level design 12, and the deep dive and tradeoffs 14. That is 43 minutes of stages, with the last couple left for the follow-up question. The split is deliberate: the design and the deep dive get the most time, but only after the requirements and numbers have told you what the design has to do.",
    ],
  },
  {
    heading: 'An example: the first five minutes',
    paragraphs: [
      'On the link shortener, a strong first stage states its assumptions in one breath: global users, a few hundred million links, far more reads than writes, links that last until someone deletes them. It asks a question that would change the design, such as whether users can pick their own short code, and says what it will assume if nobody answers. Then it proposes a scope (create a link, follow a link, rough click counts) and names what is left out on purpose. No boxes or databases yet: those wait for stage 4.',
    ],
  },
]

const FAQ: ModeFaq[] = [
  {
    q: 'What happens when a stage timer reaches zero?',
    a: 'It keeps counting, and shows how far over you are. You are never cut off. Overrunning one stage is a useful thing to learn about yourself before the real interview.',
  },
  {
    q: 'What is on the report card?',
    a: 'A score on each of six axes: requirements, lifecycle, numbers, design, tradeoffs and defence. It comes from you ticking, stage by stage, the checklist points your answer actually covered, so it is only as good as your honesty. Your past mocks are listed on this page with their average.',
  },
  {
    q: 'How is this different from a problem page?',
    a: 'On a problem page you see the model answer for each stage as soon as you submit it. In the mock nothing is shown until all five stages are done, which is closer to an interview, where nobody tells you how you are doing until it is over.',
  },
]

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
        <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
      </Page>
    )
  }

  if (problem) {
    return (
      <Page>
        <PageHeader eyebrow="Timed mock" title={problem.title} lede={problem.prompt} />
        <Card>
          <h2 className="text-[1.125rem] font-semibold">Before you start</h2>
          <ul className="mt-4 space-y-3">
            {[
              'Forty-five minutes, five stages, each with its own timer. The timers keep running past zero rather than cutting you off — going over is information, not a failure.',
              'Nothing is revealed until all five stages are submitted. No model answers, no checklists, no hints along the way. That is the point of a mock.',
              'At the end you read all five model answers, mark honestly what you actually had, and get a full report card across all six axes.',
              'Write the way you would speak. Your reasoning is graded — never your grammar or spelling.',
              'If you get stuck, write down that you are stuck and what you would ask. That is what you would do in the room.',
            ].map((t, i) => (
              <li key={i} className="flex gap-3 text-[0.9062rem] leading-relaxed">
                <span style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                <span style={{ color: 'var(--muted)' }}>{t}</span>
              </li>
            ))}
          </ul>

          {archetype ? (
            <div className="mt-5 rounded-lg px-4 py-3.5" style={{ background: 'var(--accent-soft)' }}>
              <div className="mb-1 text-[0.7188rem] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--accent)' }}>
                Your interviewer today
              </div>
              <p className="text-[0.875rem] leading-relaxed">
                <strong>{archetype.name}</strong> — {archetype.tagline} The follow-up at the end will come from
                their categories.
              </p>
            </div>
          ) : (
            <p className="mt-5 text-[0.8438rem]" style={{ color: 'var(--faint)' }}>
              No interviewer archetype selected. Pick one on the{' '}
              <a href="/archetypes" className="underline">
                interviewers page
              </a>{' '}
              to change which follow-ups fire and which part of the rubric the interviewer leans on.
            </p>
          )}

          <div className="mt-6 border-t pt-5">
            <Button onClick={() => setStarted(true)} size="lg" full>
              Start the mock
            </Button>
          </div>
        </Card>
        <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
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
                <h3 className="text-[0.9688rem] leading-snug font-semibold">{p.title}</h3>
                <span className="mt-1.5">
                  <StateDot state={st} />
                </span>
              </div>
              <p className="mb-2 text-[0.7812rem]" style={{ color: 'var(--muted)' }}>
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
          <h2 className="mb-3 text-[1.125rem] font-semibold">Your past mocks</h2>
          <div className="space-y-2">
            {state.mocks.slice(0, 8).map((m) => {
              const p = getProblem(m.problemSlug)
              const avg =
                Object.values(m.scores).reduce((a, b) => a + b, 0) / Object.values(m.scores).length
              return (
                <div key={m.id} className="card flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="text-[0.9062rem] font-semibold">{p?.title ?? m.problemSlug}</div>
                    <div className="text-[0.7812rem]" style={{ color: 'var(--faint)' }}>
                      {new Date(m.at).toLocaleDateString()}
                      {m.archetype ? ` · ${getArchetype(m.archetype)?.name}` : ''}
                    </div>
                  </div>
                  <span className="tabular text-[1.1875rem] font-bold" style={{ color: 'var(--accent)' }}>
                    {avg.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
      <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
    </Page>
  )
}

export default function MockPage() {
  return (
    <Suspense
      fallback={
        <Page>
          {/* the static HTML is this fallback alone (the page reads the URL in the
              browser), so it carries the page's one <h1>; the dev server streams both */}
          <PageHeader eyebrow={'Timed mock'} title={'Timed mock · 45 minutes'} lede={'A full problem under interview conditions, timed, with the clock visible.'} />
          <div className="py-16 text-center text-[0.875rem]" style={{ color: 'var(--faint)' }}>
            Loading…
          </div>
          <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
        </Page>
      }
    >
      <MockInner />
    </Suspense>
  )
}
