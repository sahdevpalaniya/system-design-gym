import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'Blank system design canvas',
    'A blank canvas for practising a system design answer from scratch.',
    '/practice/blank',
    true,
  ),
  // personal or JavaScript-only: nothing useful for a search result
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
