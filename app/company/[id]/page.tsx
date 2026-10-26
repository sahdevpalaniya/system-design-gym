import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPANIES, getCompany, questionsFor } from '@/content/system-design/companies'
import { getArchetype } from '@/content/system-design/archetypes'
import { Badge, Bullets, Card, Page, PageHeader, Prose, Rich, Section } from '@/components/common/ui'
import { pageMeta } from '@/lib/seo'

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const co = getCompany((await params).id)
  if (!co) return {}
  return pageMeta(
    `${co.name} system design interview — what they test`,
    metaDescription(co.name, co.style, questionsFor(co.id).length, !!co.guide?.plan.length),
    `/company/${co.id}`,
    true,
  )
}

/** Whole sentences of the style note that fit in 155 characters, so the
 *  description never ends mid-sentence, plus the question count if it fits. */
function metaDescription(name: string, style: string, questions: number, plan: boolean): string {
  const max = 155
  let d = `${name} system design interview:`
  // a sentence that does not fit is skipped, not cut, and a shorter one after
  // it may still fit
  for (const s of style.match(/[^.!?]+[.!?]+/g) ?? []) {
    const next = `${d} ${s.trim()}`
    if (next.length <= max) d = next
  }
  const n = `${questions} practice question${questions === 1 ? '' : 's'} with model answers`
  const tails = questions
    ? [
        ...(plan ? [` What candidates report about the round, ${n}, and a study plan.`, ` ${n[0].toUpperCase()}${n.slice(1)}, and a study plan.`] : []),
        ` ${n[0].toUpperCase()}${n.slice(1)}.`,
      ]
    : []
  return d + (tails.find((t) => d.length + t.length <= max) ?? '')
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const co = getCompany(id)
  if (!co) notFound()
  const qs = questionsFor(co.id)
  const arch = getArchetype(co.archetype)

  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link href="/company" className="hover:opacity-70">
            ← Company practice
          </Link>
        }
        title={co.name}
        lede={co.style}
      />

      <Card className="mb-8">
        <div className="mb-2 text-[0.7188rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--faint)' }}>
          How they weight it, based on public candidate reports
        </div>
        <p className="mb-4 text-[0.9375rem] leading-relaxed">{co.weights}</p>
        {arch ? (
          <div className="border-t pt-4">
            <p className="text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Closest interviewer archetype:{' '}
              <Link href={`/archetypes/${arch.id}`} className="font-semibold" style={{ color: 'var(--accent)' }}>
                {arch.name}
              </Link>{' '}
              — {arch.tagline}
            </p>
          </div>
        ) : null}
      </Card>

      {co.guide ? (
        <div className="max-w-3xl">
          <Section title={`The ${co.name} interview loop`}>
            <Prose paragraphs={co.guide.loop} className="text-[0.9375rem]" />
          </Section>
          <Section title="What interviewers emphasise" sub="As candidates report it. Teams and levels differ.">
            <Bullets items={co.guide.emphasis} />
          </Section>
          <Section title="Common pitfalls">
            <Bullets items={co.guide.pitfalls} />
          </Section>
          <Section title="A practice plan" sub="In order. Each step uses pages on this site.">
            <ol className="space-y-2.5">
              {co.guide.plan.map((step, i) => (
                <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                  <span className="tabular font-semibold" style={{ color: 'var(--accent)' }}>
                    {i + 1}.
                  </span>
                  <span>
                    <Rich text={step} />
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      ) : null}

      <h2 className="mb-3 text-[1.1875rem] font-semibold">Questions</h2>
      <div className="space-y-3">
        {qs.map((q) => (
          <Link key={q.id} href={`/company/${co.id}/${q.id}`} className="card block p-5 transition hover:-translate-y-px">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="text-[1.125rem] font-semibold">{q.title}</h3>
              <Badge tone={q.difficulty === 'hard' ? 'bad' : 'accent'}>{q.difficulty}</Badge>
            </div>
            <p className="mb-3 text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {q.prompt}
            </p>
            <span className="text-[0.8125rem] font-semibold" style={{ color: 'var(--accent)' }}>
              {q.hints.length} hints available · try it →
            </span>
          </Link>
        ))}
      </div>

      {co.guide?.sources.length ? (
        <div className="mt-8 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
          <h2 className="mb-2 text-[0.875rem] font-semibold" style={{ color: 'var(--text)' }}>
            Sources
          </h2>
          <ul className="space-y-1">
            {co.guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-6 text-[0.8125rem]" style={{ color: 'var(--faint)' }}>
        Format details come only from the public pages listed under Sources. What {co.name} tests is based on
        public candidate reports, not on any inside information, and formats change, so confirm yours with your
        recruiter. These questions
        are written in the style of {co.name}&rsquo;s interview round. This site is not affiliated with or endorsed
        by {co.name}.
      </p>
    </Page>
  )
}
