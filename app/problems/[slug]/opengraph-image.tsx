import { PROBLEMS, getProblem } from '@/content/system-design/problems'
import { OG_SIZE, ogCard } from '@/lib/og-card'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A system design interview problem from Dev Skills'

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProblem((await params).slug)
  if (!p) return ogCard({ kicker: 'System design', title: 'System design interview problems' })
  return ogCard({
    kicker: 'System design interview problem',
    title: p.searchTitle ?? p.title,
    subtitle: p.prompt,
    footer: ['Requirements', 'Numbers', 'Design and tradeoffs'],
  })
}
