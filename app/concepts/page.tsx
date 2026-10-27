'use client'

import Link from 'next/link'
import { CONCEPTS, TIER_INFO, conceptsByTier } from '@/content/system-design/concepts'
import { conceptState, useProgress } from '@/lib/store'
import type { Tier } from '@/lib/types'
import { PREREQS } from '@/content/system-design/concepts/prereqs'
import { Page, PageHeader, STATE_INFO, StateDot } from '@/components/common/ui'

/** The first sentence of a concept's cost, as plain text: the one-line
 *  takeaway shown on its card, so the index says what each idea charges you
 *  rather than repeating the definition only. */
function costLine(cost: string): string {
  const plain = cost.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*|`/g, '').trim()
  return plain.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? plain
}

const titleOf = (slug: string) => CONCEPTS.find((c) => c.slug === slug)?.navTitle ?? CONCEPTS.find((c) => c.slug === slug)?.title

export default function ConceptsPage() {
  const { state, ready } = useProgress()

  return (
    <Page wide>
      <PageHeader
        eyebrow="Track A"
        title="System design concepts for interviews"
        lede="Short pages, always the same shape: what problem it solves, **what it costs you**, when to use it and when not to, a visual, the follow-up an interviewer will ask, and a 60-second self-check you answer before you see ours."
        meta={
          <>
            <span className="text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
              {CONCEPTS.length} concepts
            </span>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <Link href="/cheat-sheet" className="text-[0.8125rem] font-semibold" style={{ color: 'var(--accent)' }}>
              All of them on one page: the cheat sheet
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            {(['untouched', 'attempted', 'solid', 'review'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[0.7812rem]" style={{ color: 'var(--muted)' }}>
                <StateDot state={s} size={7} />
                {STATE_INFO[s].label}
              </span>
            ))}
          </>
        }
      />

      <section className="mb-10 max-w-3xl text-[0.9375rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
        <h2 className="mb-2 text-[1.0625rem] font-semibold" style={{ color: 'var(--text)' }}>
          The order to read them in
        </h2>
        <p className="mb-2">
          The list is a dependency order, not a ranking. Tier 1 is what every design uses: how to measure speed and
          load, one request from DNS to the database, and caching. Tier 2 starts the moment data lives on more than one
          machine (replication, partitioning, consistency), and it does not make sense without tier 1. Tier 3 is the
          specific patterns that usually arrive as an interviewer&rsquo;s follow-up.
        </p>
        <p>
          Each card names the concept it builds on (&ldquo;Read after&rdquo;) and the cost it charges you. If you are
          new, go top to bottom. If you have an interview soon, read tier 1 quickly, then spend your time in tier 2.
        </p>
      </section>

      {([1, 2, 3] as Tier[]).map((tier) => {
        const list = conceptsByTier(tier)
        return (
          <section key={tier} className="mb-12">
            <h2 className="text-[1.25rem] font-bold tracking-[-0.01em]">{TIER_INFO[tier].name}</h2>
            <p className="mt-2 mb-5 max-w-2xl text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {TIER_INFO[tier].blurb}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const st = ready ? conceptState(state, c.slug) : 'untouched'
                return (
                  <Link key={c.slug} href={`/concepts/${c.slug}`} className="card block p-4 transition hover:-translate-y-px">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-[0.9688rem] leading-snug font-semibold">{c.title}</h3>
                      <span className="mt-1.5">
                        <StateDot state={st} />
                      </span>
                    </div>
                    <p className="text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {c.oneLine}
                    </p>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed">
                      <span className="font-semibold" style={{ color: 'var(--cost)' }}>
                        Costs you:{' '}
                      </span>
                      {costLine(c.cost)}
                    </p>
                    {PREREQS[c.slug]?.length ? (
                      <p className="mt-1.5 text-[0.75rem]" style={{ color: 'var(--faint)' }}>
                        Read after: {PREREQS[c.slug].map(titleOf).filter(Boolean).join(', ')}
                      </p>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </Page>
  )
}
