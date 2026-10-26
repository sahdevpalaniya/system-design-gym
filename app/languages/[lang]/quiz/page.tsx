import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { pageMeta } from '@/lib/seo'
import { QuizIndex } from '@/components/golang/QuizIndex'
import { Page, PageHeader } from '@/components/common/ui'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

export function generateStaticParams() {
  return LANGUAGES.filter((l) => l.quizzes?.length).map((l) => ({ lang: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = getLanguage((await params).lang)
  if (!l) return {}
  return { ...NOINDEX_ROBOTS, ...pageMeta(`${l.name} (${l.alias ?? l.name}) quiz: ${l.quizzes?.length ?? 0} practice tests`, `Test your ${l.alias ?? l.name} knowledge: predict the output, spot the bug and pick what compiles. Every answer explained, with ${l.quizzes?.length ?? 0} tests to pick from.`, `/languages/${l.id}/quiz`, true) }
}

export default async function QuizPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const l = getLanguage(lang)
  if (!l?.quizzes?.length) notFound()

  return (
    <Page>
      <PageHeader
        eyebrow={`${l.name} · Tests`}
        title="Multiple choice, concept by concept"
        lede="Take a test after you finish reading that section. Every answer is explained, right or wrong, and a wrong one links back to the topic."
      />
      <QuizIndex
        lang={{
          id: l.id,
          quizzes: l.quizzes.map((s) => ({ id: s.id, name: s.name, blurb: s.blurb, count: s.questions.length })),
        }}
      />
    </Page>
  )
}
