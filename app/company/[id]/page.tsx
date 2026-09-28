import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPANIES, getCompany, questionsFor } from '@/content/system-design/companies'
import { getArchetype } from '@/content/system-design/archetypes'
import { Badge, Card, Page, PageHeader } from '@/components/common/ui'
import { pageMeta } from '@/lib/seo'

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const co = getCompany((await params).id)
  if (!co) return {}
  return pageMeta(
    `${co.name} system design interview — what they test`,
    co.style,
    `/company/${co.id}`,
    true,
  )
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
          How they weight it
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
    </Page>
  )
}
