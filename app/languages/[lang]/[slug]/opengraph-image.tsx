import { LANGUAGES, getLanguage, sectionOf } from '@/content/languages'
import { OG_SIZE, ogCard } from '@/lib/og-card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A lesson from the Dev Skills Go (Golang) course'

export function generateStaticParams() {
  return LANGUAGES.flatMap((l) => l.lessons.map((t) => ({ lang: l.id, slug: t.slug })))
}

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  const l = getLanguage(lang)
  const t = l?.lessons.find((x) => x.slug === slug)
  if (!l || !t) return ogCard({ kicker: 'Go', title: 'Learn Go (Golang)' })
  const section = sectionOf(l, slug)
  return ogCard({
    kicker: `${l.name} (${l.alias ?? l.name})${section ? ` · ${section.name}` : ''}`,
    title: t.title,
    subtitle: t.oneLine,
    footer: ['Runnable examples', t.challenge ? 'Graded challenge' : 'Practice exercises', 'devskills.in'],
  })
}
