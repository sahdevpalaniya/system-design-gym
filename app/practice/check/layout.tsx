import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'System design concept check: spaced repetition quiz',
    'Test yourself on the 44 system design concepts with spaced repetition: answer from memory, reveal, and the ones you miss come back sooner.',
    '/practice/check',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
