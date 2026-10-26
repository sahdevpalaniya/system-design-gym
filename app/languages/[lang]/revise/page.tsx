import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { pageMeta } from '@/lib/seo'
import { LangRevise, type ReviseData } from '@/components/golang/LangRevise'
import { Page, PageHeader } from '@/components/common/ui'
import type { Language } from '@/lib/types'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

/** Just what LangRevise renders. Passing the whole Language would serialise
 *  every lesson's full content into the page's flight data. */
function reviseData(l: Language): ReviseData {
  return {
    id: l.id,
    sections: l.sections.map((s) => ({ id: s.id, name: s.name, lessons: s.lessons })),
    lessons: l.lessons.map((t) => ({
      slug: t.slug,
      title: t.title,
      oneLine: t.oneLine,
      keyPoints: t.keyPoints,
      remember: t.remember,
    })),
  }
}

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = getLanguage((await params).lang)
  if (!l) return {}
  return { ...NOINDEX_ROBOTS, ...pageMeta(`${l.name} (${l.alias ?? l.name}) cheat sheet: quick revision`, `All ${l.lessons.length} ${l.alias ?? l.name} topics on one page: the key points and the one thing to remember from each lesson, for quick revision before an interview.`, `/languages/${l.id}/revise`, true) }
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
      <LangRevise lang={reviseData(l)} />
    </Page>
  )
}
