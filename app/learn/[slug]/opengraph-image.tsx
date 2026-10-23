import { LESSONS, getLesson } from '@/content/system-design/foundations'
import { GUIDES, getGuide } from '@/content/system-design/guides'
import { OG_SIZE, ogCard } from '@/lib/og-card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A system design lesson from Dev Skills'

export function generateStaticParams() {
  return [...LESSONS, ...GUIDES].map((l) => ({ slug: l.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const g = getGuide(slug)
  if (g) return ogCard({ kicker: 'System design interview guide', title: g.title, footer: ['Dev Skills', 'Free'] })
  const l = getLesson(slug)
  if (!l) return ogCard({ kicker: 'System design', title: 'Start from scratch' })
  const i = LESSONS.findIndex((x) => x.slug === l.slug)
  return ogCard({
    kicker: 'System design basics',
    title: l.title,
    subtitle: l.oneLine,
    footer: [`Lesson ${i + 1} of ${LESSONS.length}`, 'Beginner friendly'],
  })
}
