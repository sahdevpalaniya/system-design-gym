import { CONCEPTS, getConcept } from '@/content/system-design/concepts'
import { OG_SIZE, ogCard } from '@/lib/og-card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A system design concept from Dev Skills'

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = getConcept((await params).slug)
  if (!c) return ogCard({ kicker: 'System design', title: 'System design concepts' })
  return ogCard({
    kicker: 'System design concept',
    title: c.title,
    subtitle: c.oneLine,
    footer: ['When to use it', 'What it costs', 'The interview follow-up'],
  })
}
