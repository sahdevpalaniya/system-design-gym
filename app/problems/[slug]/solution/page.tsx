import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { STAGES, getGroup } from '@/content/system-design/method'
import { getConcept } from '@/content/system-design/concepts'
import { getFollowUp } from '@/content/system-design/followups'
import {
  AnimatedFlow,
  Callout,
  CompareCards,
  Diagram,
  LifecycleChain,
  NumbersBar,
} from '@/components/common/visuals'
import { Badge, Bullets, Card, Page, PageHeader, Prose, Rich } from '@/components/common/ui'

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }))
}

/** what each stage is for, in one line a beginner can hold on to */
const WHY: Record<number, string> = {
  1: 'Because the question is deliberately vague, and every box you draw before this is a guess.',
  2: 'Because the happy path is the easy half. The failure branches are where the design actually lives.',
  3: 'Because one part of this is hard and the rest is easy, and they look identical until you do the arithmetic.',
  4: 'Because now — and only now — you have a reason for every box you are about to draw.',
  5: 'Because naming what a decision costs is the single clearest signal of seniority there is.',
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProblem(slug)
  if (!p) notFound()

  const group = getGroup(p.group)

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href={`/problems/${p.slug}`} className="hover:opacity-70">
              ← {p.title}
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>Worked solution</span>
          </>
        }
        title={`${p.title} — a full worked answer`}
        lede="The whole thing, start to finish, in the order you would actually say it. Read it to learn the shape of a strong answer — then go and produce one yourself, because reading is not the same skill as producing."
        meta={<Badge>{p.difficulty}</Badge>}
      />

      <Callout variant="trap">
        <strong>Read this second, not first.</strong> Reading a good answer feels like learning and only
        builds recognition. If you have not tried this problem yet, close this page and{' '}
        <Link href={`/problems/${p.slug}`} style={{ color: 'var(--accent)' }}>
          write your own answer first
        </Link>
        . It will feel worse and it is the part that works.
      </Callout>

      <section className="mb-10">
        <h2 className="mb-2 text-[19px] font-semibold tracking-[-0.01em]">The question</h2>
        <p className="prose mb-4 text-[16.5px] leading-relaxed">{p.prompt}</p>
        <Card>
          <div className="mb-1.5 text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
            What kind of problem this is
          </div>
          <p className="mb-2 text-[15px] leading-relaxed">
            <span className="font-semibold">{group.name}.</span> {group.shape}
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {group.tell}
          </p>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-[19px] font-semibold tracking-[-0.01em]">
          Before anything: where is the slack?
        </h2>
        <p className="mb-3 text-[14px]" style={{ color: 'var(--muted)' }}>
          How long the system has before a person notices. Ask this before you draw a single box — it
          decides more of the design than scale does.
        </p>
        <div className="card p-5">
          <div className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
            {p.slack.budget}
          </div>
          <p className="mb-3 text-[16px] leading-relaxed font-medium">{p.slack.headline}</p>
          <Prose paragraphs={p.slack.body} />
          <p className="mt-3 border-t pt-3 text-[14.5px] leading-relaxed">
            <span className="font-semibold">So: </span>
            {p.slack.consequence}
          </p>
        </div>
      </section>

      {p.stages.map((ps) => {
        const def = STAGES.find((s) => s.id === ps.id)!
        return (
          <section key={ps.id} className="mb-12">
            <div className="mb-2 flex flex-wrap items-baseline gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                {ps.id}
              </span>
              <h2 className="text-[21px] font-bold tracking-[-0.01em]">{def.name}</h2>
              <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
                about {def.minutes} min
              </span>
            </div>
            <p className="mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              <span className="font-semibold">Why this stage exists: </span>
              {WHY[ps.id]}
            </p>

            <div
              className="mb-4 rounded-xl px-4 py-3 text-[14.5px] leading-relaxed"
              style={{ background: 'var(--surface-2)' }}
            >
              <span className="font-semibold">What you are being asked for: </span>
              {ps.ask}
            </div>

            <div className="card mb-4 p-5">
              <div
                className="mb-3 text-[11.5px] font-bold tracking-[0.06em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                What a strong answer sounds like
              </div>
              <Prose paragraphs={ps.model} />
            </div>

            {ps.tradeoffs?.length ? (
              <div className="card mb-4 p-5">
                <div className="mb-3 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
                  The costs named here
                </div>
                <div className="space-y-2.5">
                  {ps.tradeoffs.map((t, i) => (
                    <div key={i} className="text-[14.5px] leading-relaxed">
                      <span className="font-semibold">{t.decision}</span>
                      <span style={{ color: 'var(--cost)' }}> → costs: </span>
                      <span style={{ color: 'var(--muted)' }}>{t.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {ps.sayThis ? (
              <Callout variant="say-this">
                <Rich text={ps.sayThis} />
              </Callout>
            ) : null}
            {ps.trap ? (
              <Callout variant="trap">
                <Rich text={ps.trap} />
              </Callout>
            ) : null}

            <details className="card overflow-hidden">
              <summary className="cursor-pointer px-5 py-3.5 text-[14px] font-semibold select-none">
                What an interviewer is ticking off in this stage
              </summary>
              <div className="border-t px-5 py-4">
                <Bullets items={ps.checklist} />
              </div>
            </details>

            {ps.id === 2 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-[15px] font-semibold">The lifecycle, drawn</h3>
                <LifecycleChain spec={p.lifecycle} />
              </div>
            ) : null}
            {ps.id === 3 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-[15px] font-semibold">The numbers, drawn</h3>
                <NumbersBar spec={p.numbers} />
              </div>
            ) : null}
            {ps.id === 4 ? (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-2 text-[15px] font-semibold">The architecture, drawn</h3>
                  <Diagram spec={p.architecture} />
                </div>
                {p.flow ? <AnimatedFlow scenario={p.flow.scenario} caption={p.flow.caption} /> : null}
              </div>
            ) : null}
            {ps.id === 5 && p.compare ? (
              <div className="mt-6">
                <h3 className="mb-2 text-[15px] font-semibold">The decision this turns on</h3>
                <CompareCards spec={p.compare} />
              </div>
            ) : null}
          </section>
        )
      })}

      <section className="mb-10 border-t pt-8">
        <h2 className="mb-1 text-[19px] font-semibold tracking-[-0.01em]">
          And then they push back
        </h2>
        <p className="mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          A complete answer is where the interview starts, not where it ends. These are the questions
          this design invites — the interview is decided here far more often than in the diagram.
        </p>
        <div className="space-y-3">
          {p.followUps.map((id) => {
            const f = getFollowUp(id)
            if (!f) return null
            return (
              <details key={id} className="card overflow-hidden">
                <summary className="cursor-pointer px-5 py-3.5 text-[14.5px] font-semibold select-none">
                  {f.q}
                </summary>
                <div className="space-y-3 border-t px-5 py-4">
                  <div>
                    <div className="mb-1 text-[11px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--bad)' }}>
                      A weak answer
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      <Rich text={f.weak} />
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--ok)' }}>
                      A strong answer
                    </div>
                    <p className="prose text-[14.5px]">
                      <Rich text={f.strong} />
                    </p>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-[19px] font-semibold tracking-[-0.01em]">The topics this answer used</h2>
        <div className="flex flex-wrap gap-2">
          {p.concepts.map((slug) => {
            const c = getConcept(slug)
            if (!c) return null
            return (
              <Link
                key={slug}
                href={`/concepts/${slug}`}
                className="rounded-lg border px-3 py-1.5 text-[13.5px] font-medium transition hover:opacity-70"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {c.title}
              </Link>
            )
          })}
        </div>
      </section>

      <div
        className="rounded-xl px-5 py-5"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
      >
        <div className="mb-1 text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
          Now do it yourself
        </div>
        <p className="mb-3 text-[15px] leading-relaxed">
          You have read a good answer. That is worth very little until you can produce one on a blank
          page — so go and write this problem without looking, and compare afterwards.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/problems/${p.slug}`}
            className="rounded-lg px-4 py-2 text-[14px] font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Write my own answer →
          </Link>
          <Link
            href="/practice/blank"
            className="rounded-lg border px-4 py-2 text-[14px] font-semibold"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Blank page + whiteboard
          </Link>
        </div>
      </div>
    </Page>
  )
}
