import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { getGroup } from '@/content/system-design/method'
import { getConcept } from '@/content/system-design/concepts'
import { getFollowUp } from '@/content/system-design/followups'
import { AnimatedFlow, Callout, CompareCards, Diagram, LifecycleChain, NumbersBar } from '@/components/common/visuals'
import { StageEngine } from '@/components/system-design/StageEngine'
import { Badge, Card, Page, PageHeader, Prose, Rich, Section } from '@/components/common/ui'
import type { StageId } from '@/lib/types'

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }))
}

const ALL_STAGES: StageId[] = [1, 2, 3, 4, 5]

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProblem(slug)
  if (!p) notFound()

  const group = getGroup(p.group)

  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link href={`/problems#${group.id}`} className="hover:opacity-70">
            {group.name}
          </Link>
        }
        title={p.title}
        lede={p.prompt}
        meta={
          <>
            <Badge tone={p.difficulty === 'hard' ? 'bad' : p.difficulty === 'core' ? 'accent' : 'neutral'}>
              {p.difficulty}
            </Badge>
            {p.concepts.map((c) => {
              const con = getConcept(c)
              return con ? (
                <Link key={c} href={`/concepts/${c}`}>
                  <Badge>{con.title}</Badge>
                </Link>
              ) : null
            })}
          </>
        }
      />

      {/* ---------- where's the slack ---------- */}
      <section className="mb-12">
        <div
          className="rounded-2xl border px-6 py-6"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-bold tracking-[-0.01em]">Where&rsquo;s the slack?</h2>
            <Badge tone="accent">{p.slack.budget}</Badge>
          </div>
          <p className="mb-4 text-[16.5px] leading-snug font-semibold">{p.slack.headline}</p>
          <Prose paragraphs={p.slack.body} className="text-[15px]" />
          <p className="mt-4 border-t pt-4 text-[14.5px] leading-relaxed" style={{ borderColor: 'var(--accent-line)' }}>
            <strong>So: </strong>
            {p.slack.consequence}
          </p>
        </div>
      </section>

      {/* ---------- the gated walkthrough ---------- */}
      <section className="mb-14">
        <div className="mb-5">
          <h2 className="text-[22px] font-bold tracking-[-0.01em]">Work it through</h2>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Five stages, gated. You write your answer for each stage before the model answer unlocks — that is
            the entire method, and it is the only thing this app will not let you skip.
          </p>
        </div>
        <StageEngine problem={p} stageIds={ALL_STAGES} />
      </section>

      {/* ---------- reference material, after the work ---------- */}
      <section className="border-t pt-10">
        <p className="mb-8 text-[13.5px]" style={{ color: 'var(--faint)' }}>
          Reference material for this problem. The diagrams below are here to check your own against once you
          have drawn it — not to read first.
        </p>

        <Section title="The lifecycle">
          <LifecycleChain spec={p.lifecycle} />
        </Section>

        <Section title="The numbers">
          <NumbersBar spec={p.numbers} />
        </Section>

        <Section title="The architecture">
          <Diagram spec={p.architecture} />
        </Section>

        {p.flow ? (
          <Section title="The mechanism">
            <AnimatedFlow scenario={p.flow.scenario} caption={p.flow.caption} />
          </Section>
        ) : null}

        {p.compare ? (
          <Section title="The decision this turns on">
            <CompareCards spec={p.compare} />
          </Section>
        ) : null}

        <Section title="Follow-ups you should expect" sub="Interviews are lost in follow-ups, not in the first diagram.">
          <div className="space-y-2">
            {p.followUps.map((id) => {
              const f = getFollowUp(id)
              if (!f) return null
              return (
                <Link
                  key={id}
                  href={`/drills?q=${id}`}
                  className="card flex items-center justify-between gap-4 p-4 transition hover:-translate-y-px"
                >
                  <span className="text-[15px] font-medium">
                    <Rich text={f.q} />
                  </span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--faint)" strokeWidth="1.6" className="shrink-0" aria-hidden>
                    <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )
            })}
          </div>
        </Section>

        <Section title="Same shape, other products">
          <Card>
            <p className="text-[15px] leading-relaxed">{group.shape}</p>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {group.tell}
            </p>
            <p className="mt-3 text-[13.5px]" style={{ color: 'var(--faint)' }}>
              Others with this shape: {group.examples.join(' · ')}
            </p>
          </Card>
        </Section>

        <Callout variant="say-this" title="Before you leave">
          Try this problem again in a week without reading anything. The gap between what you write then and
          what you wrote today is the only measure of progress that means anything.
        </Callout>

        <Link
          href={`/problems/${p.slug}/solution`}
          className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5 transition hover:-translate-y-px"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <span className="min-w-0">
            <span className="mb-1 block text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
              Stuck, or new to this?
            </span>
            <span className="block text-[17px] font-semibold">Read the full worked solution</span>
            <span className="mt-1 block text-[13.5px]" style={{ color: 'var(--muted)' }}>
              All five stages end to end, with every diagram and every cost named — written out the way you
              would actually say it. Best read after you have had a go.
            </span>
          </span>
          <span
            className="shrink-0 rounded-lg border px-4 py-2.5 text-[14px] font-semibold"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Read it →
          </span>
        </Link>
      </section>
    </Page>
  )
}
