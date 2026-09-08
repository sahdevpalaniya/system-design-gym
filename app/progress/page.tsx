'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CONCEPTS, getConcept } from '@/content/system-design/concepts'
import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { getStage } from '@/content/system-design/method'
import { CATEGORY_INFO, getFollowUp } from '@/content/system-design/followups'
import {
  axisScores,
  axisScoresBefore,
  conceptState,
  dueConcepts,
  failingCategories,
  gapPatterns,
  problemState,
  streakCount,
  useProgress,
} from '@/lib/store'
import { AXES, AXIS_EARNS, AXIS_LABEL } from '@/lib/types'
import { AxisBars, Badge, Button, Card, Empty, Page, PageHeader, Radar, StateDot } from '@/components/common/ui'
import { AccountPanel } from '@/components/common/Account'

export default function ProgressPage() {
  const { state, ready, exportJson, clearAll } = useProgress()
  const [confirmClear, setConfirmClear] = useState(false)

  const v = useMemo(() => {
    const scores = axisScores(state)
    return {
      scores,
      before: axisScoresBefore(state),
      gaps: gapPatterns(state),
      due: dueConcepts(state),
      cats: failingCategories(state),
      streak: streakCount(state),
      conceptsTouched: CONCEPTS.filter((c) => conceptState(state, c.slug) !== 'untouched').length,
      conceptsSolid: CONCEPTS.filter((c) => conceptState(state, c.slug) === 'solid').length,
      problemsTouched: PROBLEMS.filter((p) => problemState(state, p.slug) !== 'untouched').length,
      problemsDone: Object.values(state.problems).filter((p) => p.completedAt).length,
      answers: Object.entries(state.problems)
        .flatMap(([slug, p]) =>
          Object.entries(p.stages).map(([stageId, att]) => ({
            slug,
            stageId: Number(stageId) as 1 | 2 | 3 | 4 | 5,
            ...att,
          })),
        )
        .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)),
    }
  }, [state])

  if (!ready) {
    return (
      <Page wide>
        <div className="py-24 text-center text-[14px]" style={{ color: 'var(--faint)' }}>
          Loading your progress…
        </div>
      </Page>
    )
  }

  return (
    <Page wide>
      <PageHeader
        eyebrow="Progress"
        title="Where you actually are"
        lede="Signed out, this lives only in this browser. Sign in and it moves to your account, so it survives logging out and follows you between devices."
      />

      {/* ---- headline stats ---- */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          [v.streak, 'day streak'],
          [`${v.conceptsSolid}/${CONCEPTS.length}`, 'concepts solid'],
          [`${v.problemsTouched}/${PROBLEMS.length}`, 'problems attempted'],
          [state.mocks.length, 'mocks completed'],
          [state.followUps.length, 'follow-ups drilled'],
        ].map(([val, label]) => (
          <Card key={String(label)} className="text-center">
            <div className="tabular text-[24px] leading-none font-bold" style={{ color: 'var(--accent)' }}>
              {val}
            </div>
            <div className="mt-1.5 text-[12px]" style={{ color: 'var(--muted)' }}>
              {label}
            </div>
          </Card>
        ))}
      </div>

      {/* ---- rubric ---- */}
      <section className="mb-12">
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Six-axis skill profile</h2>
        <p className="mb-4 text-[14px]" style={{ color: 'var(--muted)' }}>
          The same rubric is used everywhere in the app. Most people have one axis that is always red, and just
          seeing that is most of the fix.
        </p>
        <Card>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <div className="shrink-0">
              <Radar scores={v.scores} compare={v.before} size={280} />
              {v.before ? (
                <p className="mt-2 text-center text-[12px]" style={{ color: 'var(--faint)' }}>
                  Dashed = your earlier average
                </p>
              ) : null}
            </div>
            <div className="w-full min-w-0 flex-1">
              <AxisBars scores={v.scores} />
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {AXES.map((a) => (
              <div key={a}>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-[13.5px] font-semibold">{AXIS_LABEL[a]}</span>
                  <span className="tabular text-[12px]" style={{ color: 'var(--faint)' }}>
                    {v.scores[a] > 0 ? v.scores[a].toFixed(1) : '—'}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {AXIS_EARNS[a]}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ---- gap log ---- */}
      <section id="gaps" className="mb-12 scroll-mt-20">
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">The gap log</h2>
        <p className="mb-4 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          One line after every attempt about what you missed, in your own words. Nobody can fix &ldquo;I am bad
          at system design&rdquo;. Anybody can fix &ldquo;I always forget idempotency&rdquo;.
        </p>

        {v.gaps.length ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {v.gaps.map((g) => (
              <Card key={g.tag}>
                <div className="tabular mb-1 text-[26px] leading-none font-bold" style={{ color: 'var(--accent)' }}>
                  {g.count}/{g.total}
                </div>
                <p className="text-[14px] leading-snug font-semibold">
                  attempts missed <span style={{ color: 'var(--accent)' }}>{g.tag}</span>
                </p>
              </Card>
            ))}
          </div>
        ) : null}

        {state.gaps.length ? (
          <Card>
            <div className="space-y-4">
              {state.gaps.slice(0, 25).map((g) => (
                <div key={g.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <p className="text-[14.5px] leading-relaxed">{g.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {g.tags
                      .filter((t) => t !== 'unfiled')
                      .map((t) => (
                        <Badge key={t} tone="accent">
                          {t}
                        </Badge>
                      ))}
                    <span className="text-[12px]" style={{ color: 'var(--faint)' }}>
                      {getProblem(g.source)?.title ?? g.source} · {new Date(g.at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Empty>
            Nothing logged yet. Finish any problem attempt and you will be asked for one line about what you
            missed.
          </Empty>
        )}
      </section>

      {/* ---- follow-up categories ---- */}
      <section className="mb-12">
        <h2 className="mb-4 text-[20px] font-bold tracking-[-0.01em]">Follow-up categories</h2>
        {v.cats.length ? (
          <Card>
            <div className="space-y-3">
              {v.cats.map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-[150px] shrink-0 text-[13.5px] font-medium">
                    {CATEGORY_INFO[c.category].name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.rate / 3) * 100}%`,
                        background: c.rate < 2 ? 'var(--bad)' : c.rate < 2.5 ? 'var(--warn)' : 'var(--ok)',
                      }}
                    />
                  </div>
                  <span className="tabular w-16 shrink-0 text-right text-[12.5px]" style={{ color: 'var(--muted)' }}>
                    {c.rate.toFixed(1)}/3 · {c.n}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t pt-4">
              <Button href="/practice/blitz" variant="secondary" size="sm">
                Drill the weakest ones →
              </Button>
            </div>
          </Card>
        ) : (
          <Empty>
            No follow-ups answered yet. Defence is the axis most people never train — it is where interviews are
            actually lost. <Link href="/practice/blitz" className="underline">Start a blitz.</Link>
          </Empty>
        )}
      </section>

      {/* ---- due for review ---- */}
      {v.due.length ? (
        <section className="mb-12">
          <h2 className="mb-4 text-[20px] font-bold tracking-[-0.01em]">Due for review</h2>
          <Card>
            <div className="flex flex-wrap gap-2">
              {v.due.map((slug) => {
                const c = getConcept(slug)
                return c ? (
                  <Link
                    key={slug}
                    href={`/concepts/${slug}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[13.5px] font-medium transition hover:opacity-75"
                    style={{ borderColor: 'var(--border-strong)' }}
                  >
                    <StateDot state="review" />
                    {c.title}
                  </Link>
                ) : null
              })}
            </div>
          </Card>
        </section>
      ) : null}

      {/* ---- answer history ---- */}
      <section className="mb-12">
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Answer history</h2>
        <p className="mb-4 text-[14px]" style={{ color: 'var(--muted)' }}>
          Every answer you have submitted, side by side with the model answer. Watching your own writing improve
          is the only measure of progress that means anything.
        </p>
        {v.answers.length ? (
          <div className="space-y-3">
            {v.answers.slice(0, 30).map((a) => {
              const problem = getProblem(a.slug)
              const stage = problem?.stages.find((s) => s.id === a.stageId)
              if (!problem || !stage) return null
              return (
                <details key={`${a.slug}-${a.stageId}`} className="card overflow-hidden">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 select-none">
                    <span>
                      <span className="text-[15px] font-semibold">{problem.title}</span>
                      <span className="ml-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                        Stage {a.stageId} — {getStage(a.stageId).name}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ color: 'var(--faint)' }}>
                        {new Date(a.submittedAt).toLocaleDateString()}
                      </span>
                      <Badge tone={a.score >= 7 ? 'ok' : a.score >= 5 ? 'warn' : 'bad'}>{a.score}/10</Badge>
                    </span>
                  </summary>
                  <div className="grid gap-5 border-t px-5 py-5 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--accent)' }}>
                        What you wrote
                      </div>
                      <p className="prose text-[14.5px] whitespace-pre-wrap">{a.answer}</p>
                    </div>
                    <div>
                      <div className="mb-2 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
                        A model answer
                      </div>
                      <div className="prose text-[14.5px]">
                        {stage.model.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        ) : (
          <Empty>No submitted answers yet.</Empty>
        )}
      </section>

      {/* ---- follow-up history ---- */}
      {state.followUps.length ? (
        <section className="mb-12">
          <h2 className="mb-4 text-[20px] font-bold tracking-[-0.01em]">Follow-up answers</h2>
          <div className="space-y-2">
            {state.followUps
              .slice()
              .reverse()
              .slice(0, 15)
              .map((f, i) => {
                const q = getFollowUp(f.id)
                return (
                  <details key={`${f.id}-${i}`} className="card overflow-hidden">
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3.5 select-none">
                      <span className="text-[14px] font-medium">{q?.q ?? f.id}</span>
                      <Badge tone={f.rating === 3 ? 'ok' : f.rating === 2 ? 'warn' : 'bad'}>
                        {['', 'weak', 'in between', 'strong'][f.rating]}
                      </Badge>
                    </summary>
                    <div className="border-t px-5 py-4">
                      <p className="prose text-[14.5px] whitespace-pre-wrap">{f.answer}</p>
                      {q ? (
                        <div className="mt-4 border-t pt-3">
                          <div className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--ok)' }}>
                            Strong answer
                          </div>
                          <p className="prose text-[14px]">{q.strong}</p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                )
              })}
          </div>
        </section>
      ) : null}

      {/* ---- data ---- */}
      <section className="border-t pt-8">
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Your account</h2>
        <p className="mb-4 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Signing in moves your progress off this browser and onto your Google account, so it
          survives signing out and follows you to any device.
        </p>
        <div className="mb-8">
          <AccountPanel />
        </div>

        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Your data</h2>
        <p className="mb-5 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          A copy is always kept in this browser&rsquo;s local storage so the app works offline. Signed out,
          that copy is the only one — clearing browser data deletes it. Clearing below wipes the local copy;
          if you are signed in, sign out first if you want the account copy left alone.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={exportJson}>
            Export everything as JSON
          </Button>
          {confirmClear ? (
            <>
              <Button
                onClick={() => {
                  clearAll()
                  setConfirmClear(false)
                }}
              >
                Yes, delete all of it
              </Button>
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear all data
            </Button>
          )}
        </div>
        {confirmClear ? (
          <p className="fade-up mt-3 text-[13.5px]" style={{ color: 'var(--bad)' }}>
            This deletes every answer, score, gap and streak. It cannot be undone. Export first if you are not
            certain.
          </p>
        ) : null}
      </section>
    </Page>
  )
}
