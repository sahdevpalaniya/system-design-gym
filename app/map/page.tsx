'use client'

import Link from 'next/link'
import { CONCEPTS, TIER_INFO, conceptsByTier } from '@/content/concepts'
import { GROUPS } from '@/content/method'
import { PROBLEMS } from '@/content/problems'
import { conceptState, problemState, useProgress } from '@/lib/store'
import type { NodeState, Tier } from '@/lib/types'
import { Card, Page, PageHeader, STATE_INFO, StateDot } from '@/components/ui'

function Node({ href, label, state }: { href: string; label: string; state: NodeState }) {
  const info = STATE_INFO[state]
  return (
    <Link
      href={href}
      title={`${label} — ${info.label}`}
      className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[12.5px] leading-tight font-medium transition hover:-translate-y-px"
      style={{
        borderColor: state === 'untouched' ? 'var(--border)' : info.color,
        background: state === 'untouched' ? 'var(--surface)' : 'var(--surface)',
        color: state === 'untouched' ? 'var(--muted)' : 'var(--text)',
      }}
    >
      <StateDot state={state} size={7} />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export default function MapPage() {
  const { state, ready } = useProgress()

  const cs = (slug: string): NodeState => (ready ? conceptState(state, slug) : 'untouched')
  const ps = (slug: string): NodeState => (ready ? problemState(state, slug) : 'untouched')

  const counts = {
    concepts: CONCEPTS.filter((c) => cs(c.slug) !== 'untouched').length,
    solid: CONCEPTS.filter((c) => cs(c.slug) === 'solid').length,
    problems: PROBLEMS.filter((p) => ps(p.slug) !== 'untouched').length,
    groups: new Set(PROBLEMS.filter((p) => ps(p.slug) !== 'untouched').map((p) => p.group)).size,
  }

  return (
    <Page wide>
      <PageHeader
        eyebrow="Curriculum map"
        title="Everything, and where you are in it"
        lede="Glance at this and you should instantly see what is solid, what needs review, and — more usefully — what is completely untouched."
        meta={
          <>
            {(['untouched', 'attempted', 'solid', 'review'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                <StateDot state={s} size={7} />
                {STATE_INFO[s].label}
              </span>
            ))}
          </>
        }
      />

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [`${counts.concepts}/${CONCEPTS.length}`, 'concepts started'],
          [`${counts.solid}/${CONCEPTS.length}`, 'concepts solid'],
          [`${counts.problems}/${PROBLEMS.length}`, 'problems attempted'],
          [`${counts.groups}/${GROUPS.length}`, 'shapes covered'],
        ].map(([v, l]) => (
          <Card key={l} className="text-center">
            <div className="tabular text-[24px] leading-none font-bold" style={{ color: 'var(--accent)' }}>
              {v}
            </div>
            <div className="mt-1.5 text-[12px]" style={{ color: 'var(--muted)' }}>
              {l}
            </div>
          </Card>
        ))}
      </div>

      {/* ---- track A ---- */}
      <section className="mb-12">
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Track A — Fundamentals</h2>
        <p className="mb-5 text-[14px]" style={{ color: 'var(--muted)' }}>
          Three tiers. Tier 1 is used by everything; Tier 2 decides senior interviews; Tier 3 is the specific
          answers that keep coming up.
        </p>
        <div className="space-y-5">
          {([1, 2, 3] as Tier[]).map((tier) => {
            const list = conceptsByTier(tier)
            const done = list.filter((c) => cs(c.slug) === 'solid').length
            return (
              <div key={tier}>
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{TIER_INFO[tier].name}</h3>
                  <span className="tabular text-[12.5px]" style={{ color: 'var(--faint)' }}>
                    {done}/{list.length} solid
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((c) => (
                    <Node key={c.slug} href={`/concepts/${c.slug}`} label={c.title} state={cs(c.slug)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- track B ---- */}
      <section className="mb-12">
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Track B — Problem shapes</h2>
        <p className="mb-5 text-[14px]" style={{ color: 'var(--muted)' }}>
          Ten shapes. Covering a new shape teaches you more than a second problem inside one you already know.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {GROUPS.map((g) => {
            const list = PROBLEMS.filter((p) => p.group === g.id)
            const touched = list.filter((p) => ps(p.slug) !== 'untouched').length
            return (
              <div
                key={g.id}
                className="rounded-xl border p-4"
                style={{
                  borderColor: touched ? 'var(--border-strong)' : 'var(--border)',
                  background: touched ? 'var(--surface)' : 'transparent',
                }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h3 className="text-[14.5px] font-semibold">{g.name}</h3>
                  {touched ? (
                    <span className="tabular text-[11.5px]" style={{ color: 'var(--faint)' }}>
                      {touched}/{list.length}
                    </span>
                  ) : (
                    <span className="text-[11.5px]" style={{ color: 'var(--faint)' }}>
                      untouched
                    </span>
                  )}
                </div>
                <p className="mb-3 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {g.shape}
                </p>
                <div className="grid gap-2">
                  {list.map((p) => (
                    <Node key={p.slug} href={`/problems/${p.slug}`} label={p.title} state={ps(p.slug)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- track C ---- */}
      <section>
        <h2 className="mb-1 text-[20px] font-bold tracking-[-0.01em]">Track C — Interviewers</h2>
        <p className="mb-5 text-[14px]" style={{ color: 'var(--muted)' }}>
          Six styles. Each weights the same rubric differently, so the same design scores differently.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            ['pressure-tester', 'The Pressure Tester'],
            ['cost-auditor', 'The Cost Auditor'],
            ['scale-breaker', 'The Scale Breaker'],
            ['domain-specialist', 'The Domain Specialist'],
            ['scope-shifter', 'The Scope Shifter'],
            ['constraint-setter', 'The Constraint Setter'],
          ].map(([id, name]) => (
            <Node
              key={id}
              href={`/archetypes/${id}`}
              label={name}
              state={ready && state.archetype === id ? 'solid' : 'untouched'}
            />
          ))}
        </div>
      </section>
    </Page>
  )
}
