import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...NOINDEX_ROBOTS,
  ...pageMeta(
    'Daily system design practice: one problem in 15 minutes',
    'A 15-minute daily system design rep: one interview problem, requirements and numbers only, written before you see the model answer.',
    '/practice/daily',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // the "How this works" copy is rendered inside the page itself, so it sits in <main>
  return children
}
