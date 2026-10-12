import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { Quiz } from '@/components/golang/Quiz'
import { Page, PageHeader } from '@/components/common/ui'
import { pageMeta } from '@/lib/seo'

export function generateStaticParams() {
  return LANGUAGES.flatMap((l) => (l.quizzes ?? []).map((q) => ({ lang: l.id, set: q.id })))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; set: string }> }) {
  const { lang, set } = await params
  const l = getLanguage(lang)
  const s = l?.quizzes?.find((q) => q.id === set)
  if (!l || !s) return {}
  return pageMeta(
    `${s.name}: ${l.name} (${l.alias ?? l.name}) quiz, ${s.questions.length} questions`,
    `${s.blurb} ${s.questions.length} ${l.alias ?? l.name} questions, every answer explained.`,
    `/languages/${l.id}/quiz/${s.id}`,
    true,
  )
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
      </div>
    </Page>
  )
}
