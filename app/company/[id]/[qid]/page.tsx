import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPANY_QUESTIONS, getCompany, getQuestion } from '@/content/system-design/companies'
import { getConcept } from '@/content/system-design/concepts'
import { CompanyDrill } from '@/components/system-design/CompanyDrill'
import { Badge, Bullets, Page, PageHeader, Rich } from '@/components/common/ui'
import { pageMeta } from '@/lib/seo'

export function generateStaticParams() {
  return COMPANY_QUESTIONS.map((q) => ({ id: q.company, qid: q.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; qid: string }>
}) {
  const { id, qid } = await params
  const q = getQuestion(qid)
  const co = getCompany(id)
  if (!q || !co || q.company !== co.id) return {}
  return pageMeta(
    // drop the generic tail when it would push the title past what results show
    `${q.title} — ${co.name}${`${q.title} — ${co.name} system design`.length > 60 ? '' : ' system design'}`,
    `${q.prompt} How ${co.name} runs this round, and what a strong answer covers.`,
    `/company/${co.id}/${q.id}`,
    true,
  )
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

      {/* static copies so the page reads fully without JS; the model answers stay gated in the drill */}
      <div className="mt-8 space-y-3">
        <details className="card overflow-hidden">
          <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
            All {q.hints.length} hints
          </summary>
          <ol className="space-y-2.5 border-t px-5 py-4">
            {q.hints.map((h, i) => (
              <li key={i} className="text-[0.9062rem] leading-relaxed">
                <strong>
                  Hint {i + 1} — {h.label}:
                </strong>{' '}
                <Rich text={h.text} />
              </li>
            ))}
          </ol>
        </details>
        <details className="card overflow-hidden">
          <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
            The follow-up they will ask next
          </summary>
          <p className="border-t px-5 py-4 text-[0.9062rem] leading-relaxed">
            <Rich text={q.followUp.q} />
          </p>
        </details>
        <details className="card overflow-hidden">
          <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
            What a strong answer covers (the rubric)
          </summary>
          <div className="border-t px-5 py-4">
            <Bullets items={q.checklist} />
          </div>
        </details>
      </div>

      <p className="mt-6 text-[0.8125rem]" style={{ color: 'var(--faint)' }}>
        This question is written in the style of {co.name}&rsquo;s interview round. This site is not affiliated
        with or endorsed by {co.name}.
      </p>

      {q.relatedProblem ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <span className="text-[0.8438rem]" style={{ color: 'var(--muted)' }}>
            Want the full five-stage version of this problem?
          </span>
          <Link
            href={`/problems/${q.relatedProblem}`}
            className="rounded-lg border px-4 py-2 text-[0.875rem] font-semibold transition hover:opacity-75"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            Open the gated walkthrough →
          </Link>
        </div>
      ) : null}
    </Page>
  )
}
