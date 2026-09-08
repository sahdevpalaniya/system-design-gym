'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { CATEGORY_INFO, FOLLOW_UPS, followUpsByCategory, getFollowUp } from '@/content/system-design/followups'
import { getArchetype } from '@/content/system-design/archetypes'
import { failingCategories, useProgress } from '@/lib/store'
import type { FollowUpCategory } from '@/lib/types'
import { FollowUpDrill } from '@/components/system-design/FollowUpDrill'
import { Badge, Card, Page, PageHeader } from '@/components/common/ui'

const CATEGORIES = Object.keys(CATEGORY_INFO) as FollowUpCategory[]

function DrillsInner() {
  const params = useSearchParams()
  const { state, ready } = useProgress()
  const qParam = params.get('q')
  const catParam = params.get('category') as FollowUpCategory | null

  const [category, setCategory] = useState<FollowUpCategory | 'all'>(catParam ?? 'all')
  const [index, setIndex] = useState(0)

  const attempts = useMemo(() => {
    const m = new Map<string, number[]>()
    for (const f of state.followUps) m.set(f.id, [...(m.get(f.id) ?? []), f.rating])
    return m
  }, [state.followUps])

  const pool = useMemo(() => {
    if (qParam) {
      const f = getFollowUp(qParam)
      if (f) return [f]
    }
    return category === 'all' ? FOLLOW_UPS : followUpsByCategory(category)
  }, [category, qParam])

  const current = pool[index % pool.length]
  const weak = ready ? failingCategories(state).filter((c) => c.n >= 2) : []
  const archetype = ready && state.archetype ? getArchetype(state.archetype) : null

  return (
    <Page wide>
      <PageHeader
        eyebrow="The follow-up engine"
        title="Defence drills"
        lede="Interviews are lost in follow-ups, not in the first diagram. Ninety seconds each: the question, your defence, then **what a weak answer sounds like, what a strong one sounds like, and the trap hidden in the question**."
        meta={
          <>
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              {FOLLOW_UPS.length} questions across {CATEGORIES.length} categories
            </span>
            {archetype ? <Badge tone="accent">{archetype.name} favours their categories</Badge> : null}
          </>
        }
      />

      {weak.length ? (
        <div
          className="mb-8 rounded-xl border px-5 py-4"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="mb-2 text-[13px] font-semibold">Where you are weakest so far</div>
          <div className="flex flex-wrap gap-2">
            {weak.slice(0, 3).map((c) => (
              <button
                key={c.category}
                type="button"
                onClick={() => {
                  setCategory(c.category)
                  setIndex(0)
                }}
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition hover:opacity-75"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {CATEGORY_INFO[c.category].name}
                <span
                  className="tabular text-[11.5px] font-bold"
                  style={{ color: c.rate < 2 ? 'var(--bad)' : 'var(--warn)' }}
                >
                  {c.rate.toFixed(1)}/3
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* category filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {(['all', ...CATEGORIES] as const).map((c) => {
          const active = category === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c)
                setIndex(0)
              }}
              className="rounded-lg border px-3 py-1.5 text-[13px] font-medium transition"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active ? 'var(--accent-soft)' : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {c === 'all' ? `All (${FOLLOW_UPS.length})` : `${CATEGORY_INFO[c].name} (8)`}
            </button>
          )
        })}
      </div>

      {category !== 'all' ? (
        <div className="mb-6 rounded-xl px-5 py-4" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[14.5px] leading-relaxed">{CATEGORY_INFO[category].blurb}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>
              The tell:{' '}
            </span>
            {CATEGORY_INFO[category].tell}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          {current ? (
            <FollowUpDrill
              key={current.id}
              followUp={current}
              onNext={() => setIndex((i) => i + 1)}
            />
          ) : null}
          <p className="mt-4 text-center text-[12.5px]" style={{ color: 'var(--faint)' }}>
            Question {(index % pool.length) + 1} of {pool.length}
            {category !== 'all' ? ` in ${CATEGORY_INFO[category].name}` : ''}
          </p>
        </div>

        <aside>
          <Card>
            <h3 className="mb-3 text-[14px] font-semibold">Your record</h3>
            <div className="space-y-2.5">
              {CATEGORIES.map((c) => {
                const done = state.followUps.filter((f) => f.category === c)
                const rate = done.length ? done.reduce((a, b) => a + b.rating, 0) / done.length : 0
                return (
                  <div key={c} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span style={{ color: 'var(--muted)' }}>{CATEGORY_INFO[c].name}</span>
                    <span
                      className="tabular font-semibold"
                      style={{
                        color: !done.length
                          ? 'var(--faint)'
                          : rate < 2
                            ? 'var(--bad)'
                            : rate < 2.5
                              ? 'var(--warn)'
                              : 'var(--ok)',
                      }}
                    >
                      {done.length ? `${rate.toFixed(1)}/3` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 border-t pt-3 text-[12.5px] leading-relaxed" style={{ color: 'var(--faint)' }}>
              {state.followUps.length} answered. Each one feeds the Defence axis on your profile.
            </p>
          </Card>

          <Card className="mt-4">
            <h3 className="mb-2 text-[14px] font-semibold">Answered before</h3>
            {attempts.has(current?.id ?? '') ? (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                You have answered this one {attempts.get(current.id)!.length} time
                {attempts.get(current.id)!.length === 1 ? '' : 's'}. Answering it again from scratch is worth
                more than rereading your old answer.
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                New question.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </Page>
  )
}

export default function DrillsPage() {
  return (
    <Suspense
      fallback={
        <Page wide>
          <div className="py-24 text-center text-[14px]" style={{ color: 'var(--faint)' }}>
            Loading drills…
          </div>
        </Page>
      }
    >
      <DrillsInner />
    </Suspense>
  )
}
