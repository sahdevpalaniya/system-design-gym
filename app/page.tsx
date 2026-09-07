'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { CONCEPTS, getConcept } from '@/content/concepts'
import { PROBLEMS, getProblem } from '@/content/problems'
import { GROUPS } from '@/content/method'
import { CATEGORY_INFO } from '@/content/followups'
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
import { AXIS_EARNS, AXIS_LABEL } from '@/lib/types'
import { Badge, Button, Card, Empty, Page, Radar, StateDot, Stat } from '@/components/ui'

export default function Home() {
  const { state, ready } = useProgress()

  const view = useMemo(() => {
    const due = dueConcepts(state)
    const conceptsSolid = CONCEPTS.filter((c) => conceptState(state, c.slug) === 'solid').length
    const conceptsTouched = CONCEPTS.filter((c) => conceptState(state, c.slug) !== 'untouched').length
    const problemsTouched = PROBLEMS.filter((p) => problemState(state, p.slug) !== 'untouched').length
    const problemsDone = Object.values(state.problems).filter((p) => p.completedAt).length
    const scores = axisScores(state)
    const before = axisScoresBefore(state)
    const gaps = gapPatterns(state)
    const weakCats = failingCategories(state).filter((c) => c.n >= 2 && c.rate < 2.4)

    // untouched problems, preferring a group the user has never seen
    const seenGroups = new Set(
      PROBLEMS.filter((p) => problemState(state, p.slug) !== 'untouched').map((p) => p.group),
    )
    const nextProblem =
      PROBLEMS.find((p) => problemState(state, p.slug) === 'untouched' && !seenGroups.has(p.group)) ??
      PROBLEMS.find((p) => problemState(state, p.slug) === 'untouched') ??
      PROBLEMS.find((p) => problemState(state, p.slug) === 'review') ??
      PROBLEMS[0]

    const nextConcept =
      CONCEPTS.find((c) => conceptState(state, c.slug) === 'untouched') ?? CONCEPTS[0]

    // one action for today, in priority order
    const action =
      due.length > 0
        ? {
            title: 'Concept check',
            minutes: 5,
            body: `${due.length} concept${due.length === 1 ? '' : 's'} ${due.length === 1 ? 'is' : 'are'} due for review. Spaced repetition works because you do it on the day it asks, not when you feel like it.`,
            href: '/practice/check',
            cta: 'Start concept check',
          }
        : conceptsTouched < 3
          ? {
              title: 'Start with a concept',
              minutes: 5,
              body: `Begin with ${nextConcept.title.toLowerCase()}. Every concept page ends with a self-check you answer before you see ours — that is the whole method, on the smallest possible scale.`,
              href: `/concepts/${nextConcept.slug}`,
              cta: 'Read and self-check',
            }
          : {
              title: 'Daily rep',
              minutes: 15,
              body: `${nextProblem.title} — stages 1 and 2 only. Requirements and lifecycle, fifteen minutes, no full design. Small and daily beats long and rare.`,
              href: `/practice/daily?problem=${nextProblem.slug}`,
              cta: 'Start daily rep',
            }

    return {
      due,
      conceptsSolid,
      conceptsTouched,
      problemsTouched,
      problemsDone,
      scores,
      before,
      gaps,
      weakCats,
      action,
      streak: streakCount(state),
      mocks: state.mocks.length,
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

  const fresh = view.conceptsTouched === 0 && view.problemsTouched === 0

  return (
    <Page wide>
      {fresh ? <Welcome /> : null}

      {/* ---- what to do today ---- */}
      <section className="mb-10">
        <div className="card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.5fr_1fr]">
            <div className="p-6 sm:p-8">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
                  Today
                </span>
                <Badge>{view.action.minutes} min</Badge>
              </div>
              <h1 className="text-[26px] leading-tight font-bold tracking-[-0.015em] sm:text-[30px]">
                {view.action.title}
              </h1>
              <p className="mt-3 mb-6 max-w-md text-[15.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {view.action.body}
              </p>
              <Button href={view.action.href} size="lg">
                {view.action.cta} →
              </Button>
            </div>

            <div
              className="flex flex-row items-center justify-around gap-4 border-t px-6 py-6 md:flex-col md:items-start md:justify-center md:border-t-0 md:border-l"
              style={{ background: 'var(--surface-2)' }}
            >
              <Stat
                value={
                  <span style={{ color: view.streak > 0 ? 'var(--accent)' : 'var(--faint)' }}>
                    {view.streak}
                  </span>
                }
                label={view.streak === 1 ? 'day streak' : 'day streak'}
              />
              <Stat value={`${view.conceptsSolid}/${CONCEPTS.length}`} label="concepts solid" />
              <Stat value={`${view.problemsTouched}/${PROBLEMS.length}`} label="problems attempted" />
              <Stat value={view.mocks} label="mocks completed" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- skill profile ---- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[19px] font-semibold">Your six-axis profile</h2>
            <Link href="/progress" className="text-[13px] font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
              Full progress →
            </Link>
          </div>
          <Card>
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="shrink-0">
                <Radar scores={view.scores} compare={view.before} size={240} />
              </div>
              <div className="min-w-0 flex-1">
                {view.problemsTouched === 0 ? (
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    Empty until you attempt something. Each stage of a problem feeds one axis — requirements,
                    lifecycle, numbers, design, tradeoffs — and follow-up drills feed defence.
                  </p>
                ) : (
                  <WeakestNote scores={view.scores} />
                )}
                {view.before ? (
                  <p className="mt-3 text-[12.5px]" style={{ color: 'var(--faint)' }}>
                    The dashed outline is where you were earlier. Watching one axis move is the point.
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </section>

        {/* ---- gap log patterns ---- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[19px] font-semibold">Your recurring gaps</h2>
            <Link href="/progress#gaps" className="text-[13px] font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
              Gap log →
            </Link>
          </div>
          <Card>
            {view.gaps.length ? (
              <div className="space-y-4">
                {view.gaps.map((g) => (
                  <div key={g.tag}>
                    <p className="text-[15.5px] leading-snug font-semibold">
                      You missed <span style={{ color: 'var(--accent)' }}>{g.tag}</span> in {g.count} of your last{' '}
                      {g.total} attempts.
                    </p>
                    {g.recent[0] ? (
                      <p className="mt-1 text-[13px] italic" style={{ color: 'var(--muted)' }}>
                        &ldquo;{g.recent[0]}&rdquo;
                      </p>
                    ) : null}
                  </div>
                ))}
                <p className="border-t pt-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Nobody can fix &ldquo;I am bad at system design&rdquo;. Anybody can fix &ldquo;I always forget
                  idempotency&rdquo;.
                </p>
              </div>
            ) : (
              <Empty>
                After each attempt you write one line about what you missed. Once there are a few, the pattern
                shows up here — and a vague weakness becomes a checklist.
              </Empty>
            )}
          </Card>
        </section>
      </div>

      {/* ---- due for review ---- */}
      {view.due.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-[19px] font-semibold">Due for review</h2>
          <Card>
            <div className="flex flex-wrap gap-2">
              {view.due.slice(0, 10).map((slug) => {
                const c = getConcept(slug)
                if (!c) return null
                return (
                  <Link
                    key={slug}
                    href={`/concepts/${slug}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[13.5px] font-medium transition hover:opacity-75"
                    style={{ borderColor: 'var(--border-strong)' }}
                  >
                    <StateDot state="review" />
                    {c.title}
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 border-t pt-4">
              <Button href="/practice/check" variant="secondary" size="sm">
                Run them as a concept check →
              </Button>
            </div>
          </Card>
        </section>
      ) : null}

      {/* ---- weak follow-up categories ---- */}
      {view.weakCats.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-[19px] font-semibold">Follow-up categories that keep catching you</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {view.weakCats.slice(0, 3).map((c) => (
              <Card key={c.category} href={`/drills?category=${c.category}`}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{CATEGORY_INFO[c.category].name}</h3>
                  <Badge tone="bad">{c.rate.toFixed(1)}/3</Badge>
                </div>
                <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {CATEGORY_INFO[c.category].tell}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---- shortcuts ---- */}
      <section className="mt-10">
        <h2 className="mb-3 text-[19px] font-semibold">Other ways in</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/practice/mock', t: 'Timed mock', d: '45 minutes, all five stages, nothing revealed until the end.' },
            { href: '/practice/blitz', t: 'Follow-up blitz', d: '10 minutes of rapid-fire defence drills.' },
            { href: '/map', t: 'Curriculum map', d: 'Everything at a glance, coloured by where you are.' },
            { href: '/practice/blank', t: 'Blank page', d: 'Empty canvas, five-stage scaffold, no help.' },
          ].map((s) => (
            <Card key={s.href} href={s.href}>
              <h3 className="text-[15px] font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {s.d}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- group reminder ---- */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[19px] font-semibold">Problems are grouped by shape, not by product</h2>
          <Link href="/problems" className="text-[13px] font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
            All problems →
          </Link>
        </div>
        <Card>
          <p className="mb-4 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Two different-looking products are often the same problem. Ride hailing and food delivery look
            identical and get opposite designs — because one has fifteen minutes of cooking to hide latency
            inside and the other has a person standing on a street.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => {
              const ps = PROBLEMS.filter((p) => p.group === g.id)
              const touched = ps.filter((p) => problemState(state, p.slug) !== 'untouched').length
              return (
                <Link
                  key={g.id}
                  href={`/problems#${g.id}`}
                  className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition hover:opacity-75"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <StateDot state={touched > 0 ? 'attempted' : 'untouched'} size={7} />
                  {g.name}
                </Link>
              )
            })}
          </div>
        </Card>
      </section>
    </Page>
  )
}

function WeakestNote({ scores }: { scores: ReturnType<typeof axisScores> }) {
  const entries = Object.entries(scores).filter(([, v]) => v > 0) as [keyof typeof scores, number][]
  if (!entries.length) return null
  const weakest = entries.reduce((m, e) => (e[1] < m[1] ? e : m), entries[0])
  return (
    <div>
      <p className="text-[15px] leading-relaxed">
        <strong>Weakest axis: {AXIS_LABEL[weakest[0]]}</strong> at {weakest[1].toFixed(1)} out of 10.
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Earns points for: {AXIS_EARNS[weakest[0]].toLowerCase()}
      </p>
      <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Most people have one axis that is always red, and just seeing that is most of the fix.
      </p>
    </div>
  )
}

function Welcome() {
  return (
    <section className="mb-8">
      <div
        className="rounded-2xl border px-6 py-6 sm:px-8"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
      >
        <h2 className="text-[20px] font-bold tracking-[-0.01em]">One rule, above all others</h2>
        <p className="mt-2.5 max-w-2xl text-[15.5px] leading-relaxed">
          You write your own answer before you see ours. Every screen works that way, and none of them will show
          you a model answer until you have submitted something.
        </p>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Reading solutions feels like learning but only builds recognition. Writing first, then comparing,
          builds the thing you actually need — the ability to produce an answer on a blank whiteboard. Your
          thinking is what gets graded here. Never your grammar or your spelling.
        </p>
      </div>
    </section>
  )
}
