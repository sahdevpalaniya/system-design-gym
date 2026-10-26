import { pageMeta } from '@/lib/seo'
import { NOINDEX_ROBOTS } from '@/lib/noindex'

// the page itself is a client component, so its metadata lives here
export const metadata = {
  ...NOINDEX_ROBOTS,
  ...pageMeta(
  'System design revision — every concept in one pass',
  'Last-minute system design revision: the one-line version of every concept and the cost it charges you, in learning order.',
  '/revise',
  true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
