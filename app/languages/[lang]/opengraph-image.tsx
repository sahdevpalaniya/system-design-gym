import { LANGUAGES, getLanguage } from '@/content/languages'
import { OG_SIZE, ogCard } from '@/lib/og-card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'The Dev Skills Go (Golang) course'

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: l.id }))
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const l = getLanguage((await params).lang)
  if (!l) return ogCard({ kicker: 'Courses', title: 'Programming language courses' })
  return ogCard({
    kicker: `${l.name} (${l.alias ?? l.name}) course`,
    title: `Learn ${l.name} from scratch`,
    subtitle: l.tagline,
    footer: [`${l.lessons.length} topics`, `${l.lessons.filter((t) => t.challenge).length} graded challenges`, 'Coding-round problems'],
  })
}
