import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'Timed system design mock interview (45 minutes)',
    'Run a timed 45-minute system design mock interview on a real problem, then compare your answer stage by stage with a worked solution.',
    '/practice/mock',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // the "How this works" copy is rendered inside the page itself, so it sits in <main>
  return children
}
