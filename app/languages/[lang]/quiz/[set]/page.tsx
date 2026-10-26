import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { Quiz } from '@/components/golang/Quiz'
import { Page, PageHeader, Rich } from '@/components/common/ui'
import { fillDescription, pageMeta } from '@/lib/seo'
import { UNINDEXED_QUIZ_SETS } from '@/lib/sitemap-routes'

export function generateStaticParams() {
  return LANGUAGES.flatMap((l) => (l.quizzes ?? []).map((q) => ({ lang: l.id, set: q.id })))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; set: string }> }) {
  const { lang, set } = await params
  const l = getLanguage(lang)
  const s = l?.quizzes?.find((q) => q.id === set)
  if (!l || !s) return {}
  return {
    ...pageMeta(
      `${s.name}: ${l.alias ?? l.name} quiz (${s.questions.length} questions)`,
      fillDescription([
        `${s.blurb} ${s.questions.length} ${l.alias ?? l.name} questions, every answer explained.`,
        'Multiple choice with one right answer each, and a link back to the lesson when you miss one.',
        'Multiple choice, one right answer each.',
      ]),
      `/languages/${l.id}/quiz/${s.id}`,
      true,
    ),
    // the mixed test repeats every section test word for word: useful to take,
    // but to Google it is one big duplicate of 18 other pages
    ...(UNINDEXED_QUIZ_SETS.has(s.id) ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function QuizSetPage({
  params,
}: {
  params: Promise<{ lang: string; set: string }>
}) {
  const { lang, set } = await params
  const l = getLanguage(lang)
  const sets = l?.quizzes ?? []
  const i = sets.findIndex((q) => q.id === set)
  const s = i >= 0 ? sets[i] : undefined
  if (!l || !s) notFound()
  const nextSet = sets[i + 1]

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href={`/languages/${l.id}/quiz`} className="hover:opacity-70">
              {l.name} tests
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>{s.questions.length} questions</span>
          </>
        }
        title={s.name}
        lede={s.blurb}
      />
      <div className="max-w-3xl">
        <Quiz set={s} langID={l.id} nextSet={nextSet ? { id: nextSet.id, name: nextSet.name } : undefined} />
        {/* collapsed static copy: crawlable, and a study sheet once you have taken the test */}
        <details className="card mt-10 overflow-hidden">
          <summary className="cursor-pointer px-5 py-3.5 text-[0.875rem] font-semibold select-none">
            All questions with explanations (answers shown)
          </summary>
          <ol className="space-y-5 border-t px-5 py-4">
            {s.questions.map((x, n) => (
              <li key={x.id} className="text-[0.9062rem] leading-relaxed">
                <p className="font-semibold">
                  {n + 1}. <Rich text={x.q} />
                </p>
                <p className="mt-1">
                  <span style={{ color: 'var(--ok)' }}>Answer:</span> <Rich text={x.options[x.answer]} />
                </p>
                <p className="mt-1" style={{ color: 'var(--muted)' }}>
                  <Rich text={x.why} />
                </p>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </Page>
  )
}
