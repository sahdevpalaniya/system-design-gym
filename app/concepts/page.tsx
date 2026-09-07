'use client'

import Link from 'next/link'
import { CONCEPTS, TIER_INFO, conceptsByTier } from '@/content/concepts'
import { conceptState, useProgress } from '@/lib/store'
import type { Tier } from '@/lib/types'
import { Page, PageHeader, STATE_INFO, StateDot } from '@/components/ui'

export default function ConceptsPage() {
  const { state, ready } = useProgress()

  return (
    <Page wide>
      <PageHeader
        eyebrow="Track A"
        title="Fundamentals"
        lede="Short pages, always the same shape: what problem it solves, **what it costs you**, when to use it and when not to, a visual, the follow-up an interviewer will ask, and a 60-second self-check you answer before you see ours."
        meta={
          <>
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              {CONCEPTS.length} concepts
            </span>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            {(['untouched', 'attempted', 'solid', 'review'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                <StateDot state={s} size={7} />
                {STATE_INFO[s].label}
              </span>
            ))}
          </>
        }
      />

      {([1, 2, 3] as Tier[]).map((tier) => {
        const list = conceptsByTier(tier)
        return (
          <section key={tier} className="mb-12">
            <h2 className="text-[20px] font-bold tracking-[-0.01em]">{TIER_INFO[tier].name}</h2>
            <p className="mt-2 mb-5 max-w-2xl text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {TIER_INFO[tier].blurb}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const st = ready ? conceptState(state, c.slug) : 'untouched'
                return (
                  <Link key={c.slug} href={`/concepts/${c.slug}`} className="card block p-4 transition hover:-translate-y-px">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-[15.5px] leading-snug font-semibold">{c.title}</h3>
                      <span className="mt-1.5">
                        <StateDot state={st} />
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {c.oneLine}
                    </p>
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
