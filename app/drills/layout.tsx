import { pageMeta } from '@/lib/seo'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

// the page itself is a client component, so its metadata lives here
export const metadata = {
  ...NOINDEX_ROBOTS,
  ...pageMeta(
  'System design follow-up questions — defence drills',
  'System design follow-up questions to practise: seven kinds an interviewer uses to break your design, each with a weak answer, a strong one and the trap.',
  '/drills',
  true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // the "How this works" copy is rendered inside the page itself, so it sits in <main>
  return children
}
