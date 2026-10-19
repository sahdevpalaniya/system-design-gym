'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CONCEPTS, getConcept } from '@/content/system-design/concepts'
import { conceptState, dueConcepts, useProgress } from '@/lib/store'
import type { Concept } from '@/lib/types'
import { ConceptCheck } from '@/components/system-design/ConceptCheck'
import { Badge, Button, Card, Page, PageHeader } from '@/components/common/ui'
import { ModeIntro, type ModeFaq, type ModeSection } from '@/components/common/ModeIntro'

/** server-rendered in every branch (including the loading state), so the static HTML explains the tool */
const INTRO = [
  "The concept check is a five-minute spaced-repetition quiz over the system design concepts on this site. Each round takes five concepts: the ones due for review come first, then concepts you have not tried yet. For each one you answer from memory with **what the technique costs you**, not its definition, then compare with the concept's own answer.",
  "Then rate how close you were. That rating schedules the concept: **missed it** brings it back tomorrow, **partly** in three days, **mostly** in a week or more, and **had it** in three weeks or more; those two gaps keep stretching each time you get the concept right. The schedule only works if the ratings are honest."
]

const SECTIONS: ModeSection[] = [
  {
    heading: 'Who it is for',
    paragraphs: [
      `People who have read the [concept pages](/concepts) and want them to stay put until the interview. Reading a page once feels like learning it, but a week later most of it has gone. Recalling the answer from memory, at growing intervals, is what makes it stick. There are ${CONCEPTS.length} concepts in the pool.`,
      "It is not the place to meet a concept for the first time. If a card comes up that you have never read, follow the link under it to the full page, read that, and let the concept come back in a later round.",
    ],
  },
  {
    heading: 'An example',
    paragraphs: [
      'Say the round shows **caching**. The definition, "a cache keeps frequently used data close to whoever needs it", earns almost nothing, because anyone can recite it. The question is what caching costs you. A good answer: you now have two copies of the truth and they can disagree, so users may see old data; the cache is one more part that can fail, and when it does, the database takes every request at once; and from then on you have to decide when each cached item stops being true.',
      'If you named two of those three, **mostly** is an honest rating. If you only gave the definition, rate it **missed it** and the concept will be back tomorrow.',
    ],
  },
]

const FAQ: ModeFaq[] = [
  {
    q: 'Why ask for the cost instead of the definition?',
    a: 'Because that is what interviewers press on. Saying what a technique gives up, and when that matters, is the clearest sign you have chosen it rather than copied it.',
  },
  {
    q: 'What if nothing is due?',
    a: 'The round fills up with concepts you have not tried yet, so it is still useful work. Once everything has been seen, a round with nothing due simply starts from the first concepts again.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. Your schedule is saved in this browser. If you sign in, it is saved to your account as well, so it follows you to another device.',
  },
]

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
        <PageHeader
          eyebrow="Practice"
          title="Concept check"
          lede="Spaced repetition over every concept you have read. Answer from memory, then compare."
        />
        <div className="py-16 text-center text-[0.875rem]" style={{ color: 'var(--faint)' }}>
          Loading…
        </div>
        <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
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
              <p className="mb-4 text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
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
            <p className="mb-5 text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Nothing is due right now — good. This round will pull in concepts you have not touched yet
              instead, so it still counts as work.
            </p>
          )}

          <Button onClick={start} size="lg" full>
            Start a round of {Math.min(ROUND, Math.max(1, due.length + untouched.length))}
          </Button>
        </Card>
        <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
      </Page>
    )
  }

  if (i >= round.length) {
    return (
      <Page>
        <PageHeader eyebrow="Concept check" title="Round finished" />
        <Card>
          <p className="mb-5 text-[0.9375rem] leading-relaxed">
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
        <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
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
          className="text-[0.8438rem] font-medium hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Read the full page on {c.title.toLowerCase()} →
        </Link>
        <Button onClick={() => setI((x) => x + 1)}>
          {i === round.length - 1 ? 'Finish round' : 'Next concept →'}
        </Button>
      </div>
      <ModeIntro inPage paragraphs={INTRO} sections={SECTIONS} faq={FAQ} />
    </Page>
  )
}
