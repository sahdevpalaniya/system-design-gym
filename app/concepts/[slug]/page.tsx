import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CONCEPTS, TIER_INFO, getConcept } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { Callout } from '@/components/common/visuals'
import { getDeepDive, getExample } from '@/content/system-design/deep'
import { WorkedExampleBlock } from '@/components/system-design/DeepDive'
import { ConceptCheck, ConceptVisualBlock } from '@/components/system-design/ConceptCheck'
import { AnimatedFlow } from '@/components/common/visuals'
import { Badge, Bullets, Card, Page, PageHeader, Prose, Rich, Section } from '@/components/common/ui'
import { MarkRead } from '@/components/common/MarkRead'
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, pageMeta, subject, withUtm } from '@/lib/seo'
import { CONTENT_MODIFIED, CONTENT_PUBLISHED } from '@/lib/content-dates'

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = getConcept((await params).slug)
  if (!c) return {}
  const short = c.searchTitle ?? c.navTitle ?? c.title
  // the searcher is not looking up "caching" — they are preparing for an
  // interview, so the intent modifier is the keyword that can actually rank
  return pageMeta(
    `${short} — system design interview`,
    `${short} explained for a system design interview: ${c.oneLine} What it costs you, when to use it, when not to, and the follow-up interviewers ask.`,
    `/concepts/${c.slug}`,
    true,
  )
}

export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getConcept(slug)
  if (!c) notFound()

  // headings name the topic, so they match how people actually search:
  // "when not to use caching" rather than a generic "when to use it"
  const subj = c.subject ?? subject(c.navTitle ?? c.title)
  const related = (c.related ?? []).map(getConcept).filter(Boolean)
  const usedIn = PROBLEMS.filter((p) => p.concepts.includes(c.slug))
  const deep = getDeepDive(c.slug)
  const example = getExample(c.slug)
  const i = CONCEPTS.findIndex((x) => x.slug === c.slug)
  const prev = i > 0 ? CONCEPTS[i - 1] : null
  const next = i < CONCEPTS.length - 1 ? CONCEPTS[i + 1] : null

  return (
    <Page>
      {/* the Q&A already on the page, in the shape Google reads for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [
              faqJsonLd([
                { q: c.followUp.q, a: c.followUp.answer },
                { q: c.selfCheck.q, a: c.selfCheck.answer },
              ]),
              breadcrumbJsonLd([
                { name: 'System design', path: '/' },
                { name: 'Concepts', path: '/concepts' },
                { name: c.navTitle ?? c.title, path: `/concepts/${c.slug}` },
              ]),
              articleJsonLd({
                headline: c.title,
                description: c.oneLine,
                path: `/concepts/${c.slug}`,
                published: CONTENT_PUBLISHED,
                modified: CONTENT_MODIFIED,
                section: TIER_INFO[c.tier].name,
              }),
            ],
          ),
        }}
      />
      <PageHeader
        eyebrow={
          <>
            <Link href="/concepts" className="hover:opacity-70">
              {TIER_INFO[c.tier].name}
            </Link>
          </>
        }
        title={c.title}
        lede={c.oneLine}
      />

      <Section n="1" title={`What problem does ${subj} solve?`}>
        <Prose paragraphs={c.problem} />
      </Section>

      <Section n="2" title={`What ${subj} costs you`}>
        <Callout variant="cost">
          <Rich text={c.cost} />
        </Callout>
        <p className="text-[0.8438rem] leading-relaxed" style={{ color: 'var(--faint)' }}>
          Every concept in here states a cost. A technique with no price is a technique you have not understood
          yet — and naming the cost out loud is most of what separates a senior answer from a junior one.
        </p>
      </Section>

      <Section n="3" title={`When to reach for ${subj}, and when not to`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-[0.875rem] font-semibold" style={{ color: 'var(--ok)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Use it when
            </h3>
            <Bullets items={c.useWhen} />
          </Card>
          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-[0.875rem] font-semibold" style={{ color: 'var(--bad)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
              Do not, when
            </h3>
            <Bullets items={c.avoidWhen} />
          </Card>
        </div>
      </Section>

      <Section n="4" title={`How ${subj} actually works`}>
        <ConceptVisualBlock visual={c.visual} />
        {c.body?.length ? <Prose paragraphs={c.body} /> : null}
        {c.animation ? (
          <div className="my-8">
            <AnimatedFlow scenario={c.animation.scenario} caption={c.animation.caption} />
          </div>
        ) : null}
        {c.traps?.length ? (
          <Callout variant="trap">
            <ul>
              {c.traps.map((t, i) => (
                <li key={i}>
                  <Rich text={t} />
                </li>
              ))}
            </ul>
          </Callout>
        ) : null}
        {c.sayThis ? (
          <Callout variant="say-this">
            <Rich text={c.sayThis} />
          </Callout>
        ) : null}
      </Section>

      {deep ? (
        <section className="mb-10">
          <Link
            href={`/concepts/${c.slug}/deep`}
            className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:-translate-y-px"
            style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
          >
            <span className="min-w-0">
              <span className="mb-1 block text-[0.7188rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
                Go deeper · {deep.minutes} min
              </span>
              <span className="block text-[1.125rem] font-semibold">
                View more — {c.title.toLowerCase()} in depth
              </span>
              <span className="mt-1 block text-[0.8438rem]" style={{ color: 'var(--muted)' }}>
                {deep.sections.length} sections, every sub-topic covered separately, with a worked example at the end.
              </span>
            </span>
            <span
              className="shrink-0 rounded-lg px-4 py-2.5 text-[0.875rem] font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              Read it →
            </span>
          </Link>
        </section>
      ) : null}

      <Section n="5" title={`The ${subj} follow-up an interviewer will ask`}>
        <Card>
          <p className="mb-4 text-[1.0625rem] leading-snug font-semibold">
            <Rich text={c.followUp.q} />
          </p>
          <div className="border-t pt-4">
            <div className="mb-2 text-[0.7188rem] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
              What a strong answer sounds like
            </div>
            <p className="prose text-[0.9375rem]">
              <Rich text={c.followUp.answer} />
            </p>
          </div>
        </Card>
      </Section>

      <Section n="6" title="Your turn">
        <ConceptCheck concept={c} />
      </Section>

      {example ? (
        <div className="mb-10">
          <WorkedExampleBlock example={example} />
        </div>
      ) : null}

      {c.refs?.length ? (
        <Section n="7" title="Learn it from the source">
          <p className="mb-4 text-[0.9375rem]" style={{ color: 'var(--muted)' }}>
            This page gets you interview-ready. These take you to where the idea
            is actually specified or measured — read them when you want the real depth.
          </p>
          <ul className="space-y-3">
            {c.refs.map((r) => (
              <li key={r.href}>
                <a
                  href={withUtm(r.href)}
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
        </Section>
      ) : null}

      <div className="mb-8">
        <MarkRead id={`concept:${c.slug}`} label="this topic" />
      </div>

      <nav className="mb-10 flex items-stretch justify-between gap-3 border-t pt-6" aria-label="Concept order">
        {prev ? (
          <Link
            href={`/concepts/${prev.slug}`}
            className="card flex min-w-0 flex-1 items-center gap-3 p-4 transition hover:-translate-y-px"
          >
            <span style={{ color: 'var(--accent)' }} aria-hidden>
              &larr;
            </span>
            <span className="min-w-0">
              <span className="block text-[0.7188rem]" style={{ color: 'var(--faint)' }}>
                Previous
              </span>
              <span className="block truncate text-[0.875rem] font-semibold">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/concepts/${next.slug}`}
            className="card flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-px"
          >
            <span className="min-w-0">
              <span className="block text-[0.7188rem]" style={{ color: 'var(--faint)' }}>
                Next
              </span>
              <span className="block truncate text-[0.875rem] font-semibold">{next.title}</span>
            </span>
            <span style={{ color: 'var(--accent)' }} aria-hidden>
              &rarr;
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>

      {(related.length || usedIn.length) > 0 ? (
        <section className="border-t pt-8">
          {related.length ? (
            <div className="mb-6">
              <h3 className="mb-3 text-[0.875rem] font-semibold">Related concepts</h3>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r!.slug}
                    href={`/concepts/${r!.slug}`}
                    className="rounded-lg border px-3 py-1.5 text-[0.8438rem] font-medium transition hover:opacity-70"
                    style={{ borderColor: 'var(--border-strong)' }}
                  >
                    {r!.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {usedIn.length ? (
            <div>
              <h3 className="mb-3 text-[0.875rem] font-semibold">Where you will use this</h3>
              <div className="flex flex-wrap gap-2">
                {usedIn.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/problems/${p.slug}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.8438rem] font-medium transition hover:opacity-70"
                    style={{ borderColor: 'var(--border-strong)' }}
                  >
                    {p.title}
                    <Badge>{p.difficulty}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </Page>
  )
}
