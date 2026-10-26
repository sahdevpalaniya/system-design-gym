import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { CONCEPTS } from '@/content/system-design/concepts'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...NOINDEX_ROBOTS,
  ...pageMeta(
    'System design concept check: spaced repetition quiz',
    `Test yourself on the ${CONCEPTS.length} system design concepts with spaced repetition: answer from memory, reveal, and the ones you miss come back sooner.`,
    '/practice/check',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // the "How this works" copy is rendered inside the page itself, so it sits in <main>
  return children
}
