import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design roadmap: what to learn, in order',
  'A system design roadmap on one page: the foundations first, then the concepts tier by tier, then the practice problems, with your progress marked on each.',
  '/map',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
