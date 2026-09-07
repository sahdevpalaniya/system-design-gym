'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_INFO, FOLLOW_UPS } from '@/content/followups'
import { getArchetype } from '@/content/archetypes'
import { failingCategories, useProgress } from '@/lib/store'
import type { FollowUp } from '@/lib/types'
import { FollowUpDrill } from '@/components/FollowUpDrill'
import { Badge, Button, Card, Page, PageHeader } from '@/components/ui'

const ROUND = 6

/** deterministic-enough shuffle so a round is stable while you work through it */
function pickRound(state: ReturnType<typeof useProgress>['state']): FollowUp[] {
  const archetype = state.archetype ? getArchetype(state.archetype) : null
  const weakCats = failingCategories(state)
    .filter((c) => c.n >= 2 && c.rate < 2.5)
    .map((c) => c.category)

  const seen = new Map<string, number>()
  for (const f of state.followUps) seen.set(f.id, (seen.get(f.id) ?? 0) + 1)

  const scored = FOLLOW_UPS.map((f) => {
    let s = Math.random()
    // prefer categories the user keeps failing, then the archetype's favourites
    if (weakCats.includes(f.category)) s += 1.5
    if (archetype?.categories.includes(f.category)) s += 0.8
    // and prefer questions not answered recently
    s -= (seen.get(f.id) ?? 0) * 0.6
    return { f, s }
  })

  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, ROUND)
    .map((x) => x.f)
}

export default function BlitzPage() {
  const { state, ready } = useProgress()
  const [round, setRound] = useState<FollowUp[] | null>(null)
  const [i, setI] = useState(0)

  const archetype = ready && state.archetype ? getArchetype(state.archetype) : null
  const weak = useMemo(
    () => (ready ? failingCategories(state).filter((c) => c.n >= 2 && c.rate < 2.5) : []),
    [state, ready],
  )

  if (!round) {
    return (
      <Page>
        <PageHeader
          eyebrow="Follow-up blitz · 10 min"
          title="Rapid-fire defence"
          lede="Six questions, ninety seconds each. Interviews are lost in follow-ups, not in the first diagram — and Defence is the axis almost nobody trains deliberately."
        />
        <Card>
          <h2 className="mb-3 text-[16px] font-semibold">This round will lean toward</h2>
          <div className="mb-5 flex flex-wrap gap-2">
            {weak.length ? (
              weak.slice(0, 3).map((c) => (
                <Badge key={c.category} tone="bad">
                  {CATEGORY_INFO[c.category].name} — {c.rate.toFixed(1)}/3
                </Badge>
              ))
            ) : (
              <span className="text-[13.5px]" style={{ color: 'var(--muted)' }}>
                A spread across all seven categories — you have not answered enough yet for the app to know
                where you are weak.
              </span>
            )}
            {archetype ? <Badge tone="accent">{archetype.name}&rsquo;s categories</Badge> : null}
          </div>
          <p className="mb-5 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Answer as if someone just said it to you and is waiting. Do not plan — talk. Then you see what a
            weak answer sounds like, what a strong one sounds like, and the trap hidden in the question.
          </p>
          <Button
            onClick={() => {
              setRound(pickRound(state))
              setI(0)
            }}
            size="lg"
            full
          >
            Start the blitz
          </Button>
        </Card>
      </Page>
    )
  }

  if (i >= round.length) {
    const done = state.followUps.slice(-round.length)
    const avg = done.length ? done.reduce((a, b) => a + b.rating, 0) / done.length : 0
    return (
      <Page>
        <PageHeader eyebrow="Follow-up blitz" title="Round finished" />
        <Card>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="tabular text-[36px] leading-none font-bold" style={{ color: 'var(--accent)' }}>
              {avg.toFixed(1)}
            </span>
            <span className="text-[14px]" style={{ color: 'var(--muted)' }}>
              average self-rating out of 3 across {round.length} questions
            </span>
          </div>
          <p className="mb-5 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {avg >= 2.5
              ? 'Strong. Push into the categories you have not touched yet rather than repeating this one.'
              : avg >= 2
                ? 'Middling — which is normal. The gap between "somewhere in between" and "closer to strong" is almost always naming the cost of your decision out loud.'
                : 'A lot of these landed closer to weak. That is useful information rather than a bad result — go back and read the strong answers again, and notice how many of them start by naming a number.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setRound(pickRound(state))
                setI(0)
              }}
            >
              Another round
            </Button>
            <Button href="/progress" variant="secondary">
              See your profile
            </Button>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow={`Follow-up blitz · ${i + 1} of ${round.length}`}
        title="Defend it"
      />
      <div className="mb-4 flex gap-1">
        {round.map((_, n) => (
          <div
            key={n}
            className="h-1 flex-1 rounded-full"
            style={{ background: n <= i ? 'var(--accent)' : 'var(--surface-2)' }}
          />
        ))}
      </div>
      <FollowUpDrill
        key={round[i].id}
        followUp={round[i]}
        autoStart
        onNext={() => setI((x) => x + 1)}
      />
    </Page>
  )
}
