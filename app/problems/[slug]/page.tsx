import Link from 'next/link'
import { Byline } from '@/components/common/Byline'
import { CrossLinks } from '@/components/common/CrossLinks'
import { notFound } from 'next/navigation'
import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { getGroup, getStage } from '@/content/system-design/method'
import { getConcept } from '@/content/system-design/concepts'
import { Callout } from '@/components/common/visuals'
import { CompanyQuestionLinks } from '@/components/system-design/CompanyQuestionLinks'
import { COMPANY_QUESTIONS } from '@/content/system-design/companies'
import { StageEngine } from '@/components/system-design/StageEngine'
import { Badge, Bullets, Page, PageHeader } from '@/components/common/ui'
import type { Problem, StageId } from '@/lib/types'
import { articleJsonLd, breadcrumbJsonLd, pageMeta, withUtm } from '@/lib/seo'
import { pageDates } from '@/lib/content-dates'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProblem((await params).slug)
  if (!p) return {}
  // "design a url shortener" is the phrase people actually type, so it is
  // written out per problem rather than derived from the display title
  const search = p.searchTitle ?? `Design ${(p.navTitle ?? p.title).toLowerCase()}`
  // this page is where you answer; the solution page is where the answer is.
  // A practice-intent title stops the two competing for the same query, so
  // the solution page can rank for the plain "design a ..." search
  const task = search.charAt(0).toLowerCase() + search.slice(1)
  const full = `Practice: ${task} (mock interview workspace)`
  return { ...NOINDEX_ROBOTS, ...pageMeta(
    // the generic tail goes when it would push the title past ~60 chars
    p.practiceTitle ?? (full.length > 60 ? `Practice: ${task}` : full),
    `Mock interview practice: ${task}. Write your own answer stage by stage, then compare with the worked solution. ${p.prompt}`,
    `/problems/${p.slug}`,
    true,
    true, // own opengraph-image
  ) }
}

const ALL_STAGES: StageId[] = [1, 2, 3, 4, 5]

// the client gets only what StageEngine reads (prompts and rubric, no worked-solution text);
// it fetches the model answers after submit
function practiceOnly(p: Problem): Problem {
  return {
    slug: p.slug,
    title: p.title,
    followUps: p.followUps,
    stages: p.stages.map(({ id, ask, nudges, checklist }) => ({ id, ask, nudges, checklist, model: [] })),
  } as unknown as Problem
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProblem(slug)
  if (!p) notFound()

  const group = getGroup(p.group)

  return (
    <Page>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [
              breadcrumbJsonLd([
                { name: 'Home', path: '/' },
                { name: 'Problems', path: '/problems' },
                { name: p.navTitle ?? p.title, path: `/problems/${p.slug}` },
              ]),
              articleJsonLd({
                headline: p.searchTitle ?? p.title,
                description: p.prompt,
                path: `/problems/${p.slug}`,
                ...pageDates(`/problems/${p.slug}`),
                section: 'Worked problems',
              }),
            ],
          ),
        }}
      />
      <PageHeader
        eyebrow={
          <Link href={`/problems#${group.id}`} className="hover:opacity-70">
            {group.name}
          </Link>
        }
        // the H1 carries the phrase people search for, matching the <title>
        title={p.searchTitle ?? p.title}
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

      {/* ---------- what the problem is and what makes it hard, from the problem's own
          data; the slack consequence stays on /solution because it is the design ---------- */}
      <section className="mb-10">
        <h2 className="mb-2 text-[1.1875rem] font-bold tracking-[-0.01em]">About this problem</h2>
        <div className="prose">
          <p>
            &ldquo;{p.searchTitle ?? p.title}&rdquo; is a {p.difficulty}-level problem in the{' '}
            <Link href={`/problems#${group.id}`}>{group.name.toLowerCase()}</Link> family. {group.shape}
          </p>
          <p>
            <strong>The key challenge:</strong> {p.slack.headline}
          </p>
          <p>
            <strong>Time budgets:</strong> {p.slack.budget}
          </p>
          <p>
            The <Link href={`/problems/${p.slug}/solution`}>worked solution for {p.navTitle ?? p.title}</Link>{' '}
            goes through why those budgets shape the design, stage by stage.
          </p>
        </div>
      </section>

      {/* ---------- the brief: practice prompts only, the worked answer lives on /solution ---------- */}
      <section className="mb-12">
        <h2 className="mb-2 text-[1.1875rem] font-bold tracking-[-0.01em]">Before you start</h2>
        <p className="mb-5 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          You will work this in five timed stages. Here is what each one asks you to think about. None of it is
          the answer; the answers unlock in the workspace below once you have written your own.
        </p>
        <ol className="space-y-4">
          {p.stages.map((ps) => {
            const def = getStage(ps.id)
            return (
              <li key={ps.id} className="card p-5">
                <div className="mb-2 text-[0.75rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
                  Stage {ps.id} · {def.name} · {def.minutes} min
                </div>
                <Bullets items={ps.nudges} />
              </li>
            )
          })}
        </ol>
        <Link
          href={`/problems/${p.slug}/solution`}
          className="mt-5 inline-block text-[0.875rem] font-semibold hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Prefer to read first? The worked solution, end to end →
        </Link>
      </section>

      {/* ---------- the gated walkthrough ---------- */}
      <section className="mb-14">
        <div className="mb-5">
          <h2 className="text-[1.375rem] font-bold tracking-[-0.01em]">Work it through</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Five stages, gated. You write your answer for each stage before its model answer unlocks. That
            is the core of the method.
          </p>
        </div>
        <StageEngine problem={practiceOnly(p)} stageIds={ALL_STAGES} />
      </section>

      {/* ---------- reference material, after the work ---------- */}
      <section className="border-t pt-10">
        <p className="mb-8 text-[0.8438rem]" style={{ color: 'var(--faint)' }}>
          Done all five? The diagrams, numbers, trade-offs and follow-ups for this problem are on the worked
          solution page, to check your own design against.
        </p>

        <Callout variant="say-this" title="Before you leave">
          Try this problem again in a week without reading anything. Comparing what you write then with
          what you wrote today shows you what stuck.
        </Callout>

        <Link
          href={`/problems/${p.slug}/solution`}
          className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5 transition hover:-translate-y-px"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <span className="min-w-0">
            <span className="mb-1 block text-[0.7188rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
              Stuck, or new to this?
            </span>
            <span className="block text-[1.125rem] font-semibold">Read the full worked solution</span>
            <span className="mt-1 block text-[0.8438rem]" style={{ color: 'var(--muted)' }}>
              All five stages end to end, with the diagrams and the costs, written out the way you
              would say it. Best read after you have had a go.
            </span>
          </span>
          <span
            className="shrink-0 rounded-lg border px-4 py-2.5 text-[0.875rem] font-semibold"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Read it →
          </span>
        </Link>
      </section>
      {p.refs?.length ? (
        <section className="mb-10">
          <h2 className="mb-2 text-[1.0625rem] font-semibold">How it is really built</h2>
          <p className="mb-4 text-[0.9375rem]" style={{ color: 'var(--muted)' }}>
            Write your own answer first. Then read how teams who run this at scale describe it.
            Their constraints were real, and the write-ups often say what their choices cost.
          </p>
          <ul className="space-y-3">
            {p.refs.map((r) => (
              <li key={r.href}>
                <a
                  href={withUtm(r.href, 'problem')}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[0.9375rem] font-semibold hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  {r.label} ↗
                </a>
                {r.note ? (
                  <span className="mt-0.5 block text-[0.8438rem]" style={{ color: 'var(--muted)' }}>
                    {r.note}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CompanyQuestionLinks
        title="Asked in the style of"
        qs={COMPANY_QUESTIONS.filter((q) => q.relatedProblem === p.slug)}
      />
      <CrossLinks path={`/problems/${p.slug}`} />
      <Byline title={p.searchTitle ?? p.title} path={`/problems/${p.slug}`} />
    </Page>
  )
}
