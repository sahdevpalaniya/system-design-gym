'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CONCEPTS, getConcept } from '@/content/concepts'
import { conceptState, dueConcepts, useProgress } from '@/lib/store'
import type { Concept } from '@/lib/types'
import { ConceptCheck } from '@/components/ConceptCheck'
import { Badge, Button, Card, Page, PageHeader } from '@/components/ui'

const ROUND = 5

export default function ConceptCheckPage() {
  const { state, ready } = useProgress()
  const [round, setRound] = useState<Concept[] | null>(null)
  const [i, setI] = useState(0)

  const { due, untouched } = useMemo(() => {
    if (!ready) return { due: [] as Concept[], untouched: [] as Concept[] }
    const dueSlugs = dueConcepts(state)
    return {
      due: dueSlugs.map(getConcept).filter(Boolean) as Concept[],
      untouched: CONCEPTS.filter((c) => conceptState(state, c.slug) === 'untouched'),
    }
  }, [state, ready])

  function start() {
    // due items first — that is what spaced repetition is for — then fill with new ones
    const picked = [...due, ...untouched].slice(0, ROUND)
    setRound(picked.length ? picked : CONCEPTS.slice(0, ROUND))
    setI(0)
  }

  if (!ready) {
    return (
      <Page>
        <div className="py-24 text-center text-[14px]" style={{ color: 'var(--faint)' }}>
          Loading…
        </div>
      </Page>
    )
  }

  if (!round) {
    return (
      <Page>
        <PageHeader
          eyebrow="Concept check · 5 min"
          title="Spaced repetition"
          lede="Always asks for **the cost**, never the definition. Knowing what a technique costs you is the part that shows up in interviews — anyone can recite what a cache is."
        />
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone={due.length ? 'bad' : 'ok'}>{due.length} due now</Badge>
            <Badge>{CONCEPTS.length - untouched.length} started</Badge>
            <Badge>{untouched.length} untouched</Badge>
          </div>

          {due.length ? (
            <>
              <p className="mb-4 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {due.length} concept{due.length === 1 ? '' : 's'} came back today. Rate yourself honestly — a
                low rating brings it back tomorrow, a high one pushes it out three weeks. The schedule only
                works if the ratings are true.
              </p>
              <div className="mb-5 flex flex-wrap gap-1.5">
                {due.slice(0, 8).map((c) => (
                  <Badge key={c.slug}>{c.title}</Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="mb-5 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Nothing is due right now — good. This round will pull in concepts you have not touched yet
              instead, so it still counts as work.
            </p>
          )}

          <Button onClick={start} size="lg" full>
            Start a round of {Math.min(ROUND, Math.max(1, due.length + untouched.length))}
          </Button>
        </Card>
      </Page>
    )
  }

  if (i >= round.length) {
    return (
      <Page>
        <PageHeader eyebrow="Concept check" title="Round finished" />
        <Card>
          <p className="mb-5 text-[15px] leading-relaxed">
            {round.length} concept{round.length === 1 ? '' : 's'} reviewed. Anything you rated low will come
            back tomorrow; anything you had cold will not bother you for three weeks.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={start}>Another round</Button>
            <Button href="/" variant="secondary">
              Back to today
            </Button>
          </div>
        </Card>
      </Page>
    )
  }

  const c = round[i]

  return (
    <Page>
      <PageHeader eyebrow={`Concept check · ${i + 1} of ${round.length}`} title={c.title} lede={c.oneLine} />

      <div className="mb-5 flex gap-1">
        {round.map((_, n) => (
          <div
            key={n}
            className="h-1 flex-1 rounded-full"
            style={{ background: n <= i ? 'var(--accent)' : 'var(--surface-2)' }}
          />
        ))}
      </div>

      <ConceptCheck key={c.slug} concept={c} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/concepts/${c.slug}`}
          className="text-[13.5px] font-medium hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Read the full page on {c.title.toLowerCase()} →
        </Link>
        <Button onClick={() => setI((x) => x + 1)}>
          {i === round.length - 1 ? 'Finish round' : 'Next concept →'}
        </Button>
      </div>
    </Page>
  )
}
