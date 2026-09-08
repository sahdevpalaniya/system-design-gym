'use client'

import Link from 'next/link'
import { GROUPS } from '@/content/system-design/method'
import { PROBLEMS } from '@/content/system-design/problems'
import { problemState, useProgress } from '@/lib/store'
import { Badge, Card, Page, PageHeader, STATE_INFO, StateDot } from '@/components/common/ui'

export default function ProblemsPage() {
  const { state, ready } = useProgress()

  return (
    <Page wide>
      <PageHeader
        eyebrow="Track B"
        title="Problem library"
        lede="Grouped by the **shape of the problem**, not by product name. This is the most important teaching move in the app — two different-looking products are usually the same problem, and two identical-looking ones are often not."
        meta={
          <>
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              {PROBLEMS.length} full walkthroughs · {GROUPS.length} shapes
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

      <div
        className="mb-10 rounded-xl border px-5 py-4 text-[14.5px] leading-relaxed"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        <strong style={{ color: 'var(--text)' }}>Every problem page answers &ldquo;where&rsquo;s the slack?&rdquo;</strong>{' '}
        — how much time the system has before a human notices. Food delivery has fifteen minutes of cooking to
        hide latency inside. Ride hailing has a person standing on a street with zero slack. Same-looking
        problems, completely different designs, and that one question is what separates them.
      </div>

      <div className="space-y-10">
        {GROUPS.map((g) => {
          const list = PROBLEMS.filter((p) => p.group === g.id)
          return (
            <section key={g.id} id={g.id} className="scroll-mt-20">
              <h2 className="text-[20px] font-bold tracking-[-0.01em]">{g.name}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed">{g.shape}</p>
              <p className="mt-2 mb-4 max-w-3xl text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  The tell:{' '}
                </span>
                {g.tell}
              </p>

              <div className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px]" style={{ color: 'var(--faint)' }}>
                <span className="font-semibold">Slack in this group:</span>
                {g.slackNote}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((p) => {
                  const st = ready ? problemState(state, p.slug) : 'untouched'
                  const done = ready
                    ? Object.keys(state.problems[p.slug]?.stages ?? {}).length
                    : 0
                  return (
                    <Card key={p.slug} href={`/problems/${p.slug}`}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-[16.5px] leading-snug font-semibold">{p.title}</h3>
                        <span className="mt-1.5">
                          <StateDot state={st} />
                        </span>
                      </div>
                      <p className="mb-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {p.slack.headline}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={p.difficulty === 'hard' ? 'bad' : p.difficulty === 'core' ? 'accent' : 'neutral'}>
                          {p.difficulty}
                        </Badge>
                        {done > 0 ? <Badge tone="ok">{done}/5 stages</Badge> : null}
                        <span className="text-[12px]" style={{ color: 'var(--faint)' }}>
                          {p.concepts.length} concepts
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {g.examples.length > list.length ? (
                <p className="mt-3 text-[13px]" style={{ color: 'var(--faint)' }}>
                  Same shape, different products: {g.examples.join(' · ')}. Once you can do one of these, the
                  others are the same five stages with different numbers.
                </p>
              ) : null}
            </section>
          )
        })}
      </div>

      <section className="mt-14 border-t pt-8">
        <h2 className="mb-3 text-[19px] font-semibold">Two problems that look the same and are not</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <h3 className="text-[15px] font-semibold">Ride hailing</h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              A person is standing on a street. Zero slack. So matching must be greedy and immediate — take a
              good driver now, not the best driver in forty seconds. Global optimisation is the better algorithm
              and the wrong product.
            </p>
          </Card>
          <Card>
            <h3 className="text-[15px] font-semibold">Food delivery</h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              The restaurant needs fifteen minutes to cook. That is fifteen minutes of slack to hide latency
              inside — so you can batch orders, wait for a better courier, and optimise across the whole set.
              Completely different design, same-looking problem.
            </p>
          </Card>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Ask &ldquo;where&rsquo;s the slack?&rdquo; before you draw anything. It decides sync versus async more than
          anything else.
        </p>
      </section>
    </Page>
  )
}
