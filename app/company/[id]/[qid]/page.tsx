import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPANY_QUESTIONS, getCompany, getQuestion } from '@/content/system-design/companies'
import { getConcept } from '@/content/system-design/concepts'
import { CompanyDrill, type DrillQuestion } from '@/components/system-design/CompanyDrill'
import type { CompanyQuestion } from '@/lib/types'
import { Badge, Bullets, Page, PageHeader, Prose, Rich } from '@/components/common/ui'
import { articleJsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { pageDates } from '@/lib/content-dates'

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
    describe(q.prompt, [
      ` How ${co.name} runs this round, and what a strong answer covers.`,
      ` How ${co.name} runs this round, step-by-step hints, and what a strong answer covers.`,
    ]),
    `/company/${co.id}/${q.id}`,
    true,
  )
}

/** The whole prompt plus the tail when it fits a snippet; otherwise the
 *  prompt's first sentence plus the tail, so the tail is never what gets cut. */
function describe(prompt: string, tails: string[]): string {
  // the shortest tail that reaches ~120 characters, so the snippet is not
  // half empty; a longer prompt keeps the plain tail
  const whole = tails.map((t) => prompt + t).filter((d) => d.length <= 155)
  if (whole.length) return whole.find((d) => d.length >= 120) ?? whole[whole.length - 1]
  const first = prompt.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? prompt
  return first + tails[0]
}

function withoutAnswers({ model, followUp, ...rest }: CompanyQuestion): DrillQuestion {
  void model
  return { ...rest, followUp: { q: followUp.q } }
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Companies', path: '/company' },
              { name: co.name, path: `/company/${co.id}` },
              { name: q.title, path: `/company/${co.id}/${q.id}` },
            ]),
            articleJsonLd({
              headline: q.title,
              description: q.prompt,
              path: `/company/${co.id}/${q.id}`,
              ...pageDates(`/company/${co.id}/${q.id}`),
            }),
          ]),
        }}
      />
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

      {/* server-rendered and closed, so the page reads fully without JS while
          the drill still asks for an attempt first */}
      <details className="card mb-6 overflow-hidden">
        <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
          What they are actually testing
        </summary>
        <p className="border-t px-5 py-4 text-[0.9062rem] leading-relaxed">
          <Rich text={q.whatTheyWant} />
        </p>
      </details>

      {/* the drill fetches its own copy of the answer after submit */}
      <CompanyDrill question={withoutAnswers(q)} />

      {/* static copies, closed by default: try the question first, open them after */}
      <div className="mt-8 space-y-3">
        <details className="card overflow-hidden">
          <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
            Show model answer
          </summary>
          <div className="border-t px-5 py-4">
            <Prose paragraphs={q.model} />
          </div>
        </details>
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
          <span className="flex flex-wrap items-center gap-3">
            <Link
              href={`/problems/${q.relatedProblem}/solution`}
              className="rounded-lg border px-4 py-2 text-[0.875rem] font-semibold transition hover:opacity-75"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              Open the full walkthrough →
            </Link>
          </span>
        </div>
      ) : null}
    </Page>
  )
}
