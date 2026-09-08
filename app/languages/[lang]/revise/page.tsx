import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { LangRevise } from '@/components/golang/LangRevise'
import { Page, PageHeader } from '@/components/common/ui'

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: l.id }))
}

export default async function RevisePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const l = getLanguage(lang)
  if (!l) notFound()

  return (
    <Page>
      <PageHeader
        eyebrow={`${l.name} · Quick revision`}
        title={`All ${l.lessons.length} ${l.name} topics, condensed`}
        lede="The main points from every topic, in the order you learnt them. Open the ones you want, or open everything and read straight down."
      />
      <LangRevise lang={l} />
    </Page>
  )
}
