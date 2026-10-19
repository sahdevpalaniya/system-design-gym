import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'System design follow-up blitz: defend your design',
    'Rapid-fire interviewer follow-ups on your design decisions. Defend each choice in a sentence, then see the answer a strong candidate gives.',
    '/practice/blitz',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // the "How this works" copy is rendered inside the page itself, so it sits in <main>
  return children
}
