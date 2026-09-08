import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { QuizIndex } from '@/components/golang/QuizIndex'
import { Page, PageHeader } from '@/components/common/ui'

export function generateStaticParams() {
  return LANGUAGES.filter((l) => l.quizzes?.length).map((l) => ({ lang: l.id }))
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
      <QuizIndex lang={l} />
    </Page>
  )
}
