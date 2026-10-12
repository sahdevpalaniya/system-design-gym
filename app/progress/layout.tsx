import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'Your progress',
    'Your saved progress on this site.',
    '/progress',
    true,
  ),
  // personal or JavaScript-only: nothing useful for a search result
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
