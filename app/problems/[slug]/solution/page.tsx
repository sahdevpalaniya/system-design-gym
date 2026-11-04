import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { STAGES, getGroup } from '@/content/system-design/method'
import { getConcept } from '@/content/system-design/concepts'
import { CompanyQuestionLinks } from '@/components/system-design/CompanyQuestionLinks'
import { COMPANY_QUESTIONS, companyAnglesFor, getCompany } from '@/content/system-design/companies'
import { FOLLOWUP_HOME, getFollowUp } from '@/content/system-design/followups'
import {
  AnimatedFlow,
  Callout,
  CompareCards,
  Diagram,
  LifecycleChain,
  NumbersBar,
} from '@/components/common/visuals'
import { Badge, Bullets, Card, Page, PageHeader, Prose, Rich } from '@/components/common/ui'
import { articleJsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { pageDates } from '@/lib/content-dates'
import { ReviewedLine } from '@/components/common/Byline'

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProblem((await params).slug)
  if (!p) return {}
  const search = p.searchTitle ?? `Design ${(p.navTitle ?? p.title).toLowerCase()}`
  if (p.solutionTitle)
    return pageMeta(p.solutionTitle, p.solutionDescription ?? p.prompt, `/problems/${p.slug}/solution`, true)
  return pageMeta(
    // the generic tail goes when it would push the brand-name title past ~60 chars
    `${search} — full worked solution`.length > 60 ? `${search}: solution` : `${search} — full worked solution`,
    // the longest version that fits a search snippet, so it is never cut mid-sentence
    [
      `${search}: the complete answer stage by stage — requirements, lifecycle, capacity numbers, the architecture and every tradeoff named out loud.`,
      `${search}: the complete answer stage by stage — requirements, capacity numbers, the architecture and every tradeoff named out loud.`,
      `${search}: the complete answer stage by stage — requirements, numbers, architecture and every tradeoff.`,
    ].find((d) => d.length <= 155) ?? `${search}: the complete answer, stage by stage.`,
    `/problems/${p.slug}/solution`,
    true,
  )
}

/** generic stage-level lines shared by many solutions are left out; they live on /learn/the-five-stages */
const SHARED_MIN = 3
function sharedCount(stage: number, field: 'ask' | 'checklist', value: string) {
  return PROBLEMS.filter((q) =>
    q.stages.some((s) => s.id === stage && (field === 'ask' ? s.ask === value : s.checklist.includes(value))),
  ).length
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProblem(slug)
  if (!p) notFound()

  const group = getGroup(p.group)
  const angles = companyAnglesFor(p.slug)
  // a follow-up shared by several problems is printed on one solution only
  const printsHere = (id: string) => !(id in FOLLOWUP_HOME) || FOLLOWUP_HOME[id] === p.slug
  const ownFollowUps = p.followUps.filter(printsHere)
  const linkedFollowUps = p.followUps.filter((id) => !printsHere(id) && getFollowUp(id))

  return (
    <Page>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Problems', path: '/problems' },
              { name: p.navTitle ?? p.title, path: `/problems/${p.slug}` },
              { name: 'Solution', path: `/problems/${p.slug}/solution` },
            ]),
            articleJsonLd({
              headline: `${p.searchTitle ?? p.title} — worked solution`,
              description: p.prompt,
              path: `/problems/${p.slug}/solution`,
              ...pageDates(`/problems/${p.slug}/solution`),
              section: 'Worked solutions',
            }),
          ]),
        }}
      />
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
        title={p.solutionHeading ?? `${p.searchTitle ?? p.title}: a full worked answer`}
        lede={p.solutionDescription}
        meta={<Badge>{p.difficulty}</Badge>}
      />
      <ReviewedLine path={`/problems/${p.slug}/solution`} />

      <Callout variant="trap">
        Try it{' '}
        <Link href={`/problems/${p.slug}`} style={{ color: 'var(--accent)' }}>
          before reading
        </Link>
        . How the stages work:{' '}
        <Link href="/learn/the-five-stages" style={{ color: 'var(--accent)' }}>
          the five stages
        </Link>
        .
      </Callout>

      <section className="mb-10">
        <h2 className="mb-2 text-[1.1875rem] font-semibold tracking-[-0.01em]">The question</h2>
        <p className="prose mb-4 text-[1.0312rem] leading-relaxed">{p.prompt}</p>
        <Card>
          <div className="mb-1.5 text-[0.7188rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
            What kind of problem this is
          </div>
          <p className="mb-2 text-[0.9375rem] leading-relaxed">
            &ldquo;{p.searchTitle ?? p.title}&rdquo; is a {p.difficulty}-level problem in the{' '}
            <Link href={`/problems#${group.id}`} style={{ color: 'var(--accent)' }}>
              {group.name.toLowerCase()}
            </Link>{' '}
            family. {group.shape}
          </p>
          <p className="text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {group.tell}
          </p>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-[1.1875rem] font-semibold tracking-[-0.01em]">
          Before anything: where is the slack?
        </h2>
        <p className="mb-3 text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          <Link href="/learn/where-is-the-slack" style={{ color: 'var(--accent)' }}>
            What slack means
          </Link>
        </p>
        <div className="card p-5">
          <div className="mb-2 text-[0.8125rem] font-semibold" style={{ color: 'var(--accent)' }}>
            {p.slack.budget}
          </div>
          <p className="mb-3 text-[1rem] leading-relaxed font-medium">{p.slack.headline}</p>
          <Prose paragraphs={p.slack.body} />
          <p className="mt-3 border-t pt-3 text-[0.9062rem] leading-relaxed">
            <span className="font-semibold">So: </span>
            {p.slack.consequence}
          </p>
        </div>
      </section>

      {p.stages.map((ps) => {
        const def = STAGES.find((s) => s.id === ps.id)!
        const ownAsk = sharedCount(ps.id, 'ask', ps.ask) < SHARED_MIN
        const ownChecklist = ps.checklist.filter((c) => sharedCount(ps.id, 'checklist', c) < SHARED_MIN)
        return (
          <section key={ps.id} className="mb-12">
            <div className="mb-2 flex flex-wrap items-baseline gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-bold"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                {ps.id}
              </span>
              <h2 className="text-[1.3125rem] font-bold tracking-[-0.01em]">{def.name}</h2>
              <span className="text-[0.7812rem]" style={{ color: 'var(--faint)' }}>
                about {def.minutes} min
              </span>
            </div>
            {ownAsk ? (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-[0.9062rem] leading-relaxed"
                style={{ background: 'var(--surface-2)' }}
              >
                <span className="font-semibold">What you are being asked for: </span>
                {ps.ask}
              </div>
            ) : null}

            <div className="card mb-4 p-5">
              <div
                className="mb-3 text-[0.7188rem] font-bold tracking-[0.06em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                What a strong answer sounds like
              </div>
              <Prose paragraphs={ps.model} />
            </div>

            {ps.tradeoffs?.length ? (
              <div className="card mb-4 p-5">
                <div className="mb-3 text-[0.7188rem] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
                  The costs named here
                </div>
                <div className="space-y-2.5">
                  {ps.tradeoffs.map((t, i) => (
                    <div key={i} className="text-[0.9062rem] leading-relaxed">
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

            {ownChecklist.length ? (
              <details className="card overflow-hidden">
                <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
                  Stage checklist
                </summary>
                <div className="border-t px-5 py-4">
                  <Bullets items={ownChecklist} />
                </div>
              </details>
            ) : null}

            {ps.id === 2 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-[0.9375rem] font-semibold">The lifecycle, drawn</h3>
                <LifecycleChain spec={p.lifecycle} />
              </div>
            ) : null}
            {ps.id === 3 ? (
              <div className="mt-6">
                <h3 className="mb-2 text-[0.9375rem] font-semibold">The numbers, drawn</h3>
                <NumbersBar spec={p.numbers} />
              </div>
            ) : null}
            {ps.id === 4 ? (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-2 text-[0.9375rem] font-semibold">The architecture, drawn</h3>
                  <Diagram spec={p.architecture} />
                </div>
                {p.flow ? <AnimatedFlow scenario={p.flow.scenario} caption={p.flow.caption} /> : null}
              </div>
            ) : null}
            {ps.id === 5 && p.compare ? (
              <div className="mt-6">
                <h3 className="mb-2 text-[0.9375rem] font-semibold">The decision this turns on</h3>
                <CompareCards spec={p.compare} />
              </div>
            ) : null}
          </section>
        )
      })}

      <section className="mb-10 border-t pt-8">
        <h2 className="mb-1 text-[1.1875rem] font-semibold tracking-[-0.01em]">
          And then they push back
        </h2>
        <div className="space-y-3">
          {ownFollowUps.map((id) => {
            const f = getFollowUp(id)
            if (!f) return null
            return (
              <details key={id} className="card overflow-hidden">
                <summary className="cursor-pointer px-5 py-3.5 text-[0.9062rem] font-semibold select-none">
                  {f.q}
                </summary>
                <div className="space-y-3 border-t px-5 py-4">
                  <div>
                    <div className="mb-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--bad)' }}>
                      A weak answer
                    </div>
                    <p className="text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      <Rich text={f.weak} />
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--ok)' }}>
                      A strong answer
                    </div>
                    <p className="prose text-[0.9062rem]">
                      <Rich text={f.strong} />
                    </p>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
        {linkedFollowUps.length ? (
          <ul className="mt-4 space-y-1 text-[0.875rem]">
            {linkedFollowUps.map((id) => (
              <li key={id}>
                <Link href={`/drills?q=${id}`} style={{ color: 'var(--accent)' }}>
                  {getFollowUp(id)?.q}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-[1.1875rem] font-semibold tracking-[-0.01em]">The topics this answer used</h2>
        <div className="flex flex-wrap gap-2">
          {p.concepts.map((slug) => {
            const c = getConcept(slug)
            if (!c) return null
            return (
              <Link
                key={slug}
                href={`/concepts/${slug}`}
                className="rounded-lg border px-3 py-1.5 text-[0.8438rem] font-medium transition hover:opacity-70"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {c.title}
              </Link>
            )
          })}
        </div>
      </section>

      {angles.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-[1.1875rem] font-semibold tracking-[-0.01em]">How companies ask this one</h2>
          <p className="mb-4 text-[0.875rem]" style={{ color: 'var(--muted)' }}>
            The same design comes up in company rounds with a different emphasis. These are practice framings
            written for this site, not inside information.
          </p>
          <div className="space-y-4">
            {angles.map((q) => {
              const co = getCompany(q.company)
              return (
                <Card key={q.id}>
                  <h3 className="mb-1 text-[1rem] font-semibold">
                    At {co?.name ?? q.company}: {q.title.replace(/^Design /, 'design ')}
                  </h3>
                  <p className="mb-3 text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {q.prompt}
                  </p>
                  <div className="mb-1 text-[0.7188rem] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
                    What they are actually testing
                  </div>
                  <p className="prose mb-4 text-[0.9375rem]">
                    <Rich text={q.whatTheyWant} />
                  </p>
                  <div className="border-t pt-3">
                    <p className="mb-1 text-[0.9375rem] font-semibold">
                      Their follow-up: <Rich text={q.followUp.q} />
                    </p>
                    <p className="prose text-[0.9062rem]">
                      <Rich text={q.followUp.answer} />
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      ) : null}

      <CompanyQuestionLinks
        title="Asked in the style of"
        qs={COMPANY_QUESTIONS.filter((q) => q.relatedProblem === p.slug)}
      />

      <div
        className="rounded-xl px-5 py-5"
        style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
      >
        <div className="mb-1 text-[0.7188rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
          Now do it yourself
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/problems/${p.slug}`}
            className="rounded-lg px-4 py-2 text-[0.875rem] font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Write my own answer →
          </Link>
          <Link
            href="/practice/blank"
            className="rounded-lg border px-4 py-2 text-[0.875rem] font-semibold"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Blank page + whiteboard
          </Link>
        </div>
      </div>
    </Page>
  )
}
