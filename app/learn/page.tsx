import Link from 'next/link'
import { LESSONS } from '@/content/system-design/foundations'
import { GUIDES } from '@/content/system-design/guides'
import { CONCEPTS, PATH, getConcept } from '@/content/system-design/concepts'
import { Card, Page, PageHeader } from '@/components/common/ui'

import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'System design for beginners: a step-by-step guide',
  'System design for beginners, from zero: what it is, how the interview works, the vocabulary and the five stages, then each concept in order.',
  '/learn',
  true,
)

export default function LearnPage() {
  const stages = PATH.filter((s) => s.concepts?.length)
  return (
    <Page wide>
      <PageHeader
        eyebrow="Start from scratch"
        title="System design for beginners"
        lede={`No prior knowledge assumed. Read these ${LESSONS.length} short lessons in order, then the concepts stage by stage. The core topics also have a **View more** deep dive and a worked example.`}
      />

      <section className="mb-12">
        <h2 className="mb-1 text-[1.25rem] font-bold tracking-[-0.01em]">First, the ground floor</h2>
        <p className="mb-5 text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
          {LESSONS.length} short lessons. After these, the vocabulary on the topic pages should be familiar.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LESSONS.map((l, i) => (
            <Card key={l.slug} href={`/learn/${l.slug}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[0.75rem] font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                <h3 className="text-[1rem] font-semibold">{l.title}</h3>
              </div>
              <p className="text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {l.oneLine}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-1 text-[1.25rem] font-bold tracking-[-0.01em]">Interview guides</h2>
        <p className="mb-5 text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
          Standalone answers to the questions people ask before a system design round.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {GUIDES.map((g) => (
            <Card key={g.slug} href={`/learn/${g.slug}`}>
              <h3 className="mb-1.5 text-[1rem] font-semibold">{g.title}</h3>
              <p className="text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {g.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* the order to read the concepts in, not the concepts themselves: the full
          list with every one-liner is /concepts, so it is linked rather than repeated */}
      <section>
        <h2 className="mb-1 text-[1.25rem] font-bold tracking-[-0.01em]">Then, the concepts in order</h2>
        <p className="mb-5 text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
          The {CONCEPTS.length} concept pages fall into {stages.length} stages, each building on the last. Start each
          stage with the topic named here, then read the rest of that stage before moving on. You can jump
          around, but this order assumes the least.
        </p>
        <ol className="mb-6 space-y-3">
          {stages.map((stage, si) => {
            const first = getConcept(stage.concepts?.[0] ?? '')
            return (
              <li key={stage.id} className="card p-4">
                <div className="mb-1 flex items-baseline gap-2.5">
                  <span className="tabular text-[0.75rem] font-bold" style={{ color: 'var(--accent)' }}>
                    {String(si + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-[1.0625rem] font-semibold">{stage.name}</h3>
                  <span className="text-[0.7812rem]" style={{ color: 'var(--faint)' }}>
                    {stage.concepts?.length} topics
                  </span>
                </div>
                <p className="text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {stage.blurb}
                  {first ? (
                    <>
                      {' '}
                      Start with{' '}
                      <Link href={`/concepts/${first.slug}`} className="font-semibold" style={{ color: 'var(--accent)' }}>
                        {first.title}
                      </Link>
                      .
                    </>
                  ) : null}
                </p>
              </li>
            )
          })}
        </ol>
        <Card href="/concepts">
          <div className="text-[1rem] font-semibold">Browse all {CONCEPTS.length} system design concepts →</div>
          <p className="mt-1 text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Every concept by tier, with a one-line summary of each and your progress marked.
          </p>
        </Card>
      </section>
    </Page>
  )
}
