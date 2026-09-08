import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPANY_QUESTIONS, getCompany, getQuestion } from '@/content/system-design/companies'
import { getConcept } from '@/content/system-design/concepts'
import { CompanyDrill } from '@/components/system-design/CompanyDrill'
import { Badge, Page, PageHeader } from '@/components/common/ui'

export function generateStaticParams() {
  return COMPANY_QUESTIONS.map((q) => ({ id: q.company, qid: q.id }))
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string; qid: string }>
}) {
  const { id, qid } = await params
  const q = getQuestion(qid)
  const co = getCompany(id)
  if (!q || !co || q.company !== co.id) notFound()

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href={`/company/${co.id}`} className="hover:opacity-70">
              ← {co.name}
            </Link>
          </>
        }
        title={q.title}
        lede={q.prompt}
        meta={
          <>
            <Badge tone={q.difficulty === 'hard' ? 'bad' : 'accent'}>{q.difficulty}</Badge>
            {q.concepts.map((c) => {
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

      <CompanyDrill question={q} />

      {q.relatedProblem ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <span className="text-[13.5px]" style={{ color: 'var(--muted)' }}>
            Want the full five-stage version of this problem?
          </span>
          <Link
            href={`/problems/${q.relatedProblem}`}
            className="rounded-lg border px-4 py-2 text-[14px] font-semibold transition hover:opacity-75"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Open the gated walkthrough →
          </Link>
        </div>
      ) : null}
    </Page>
  )
}
