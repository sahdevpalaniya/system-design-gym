import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design concepts — all 44, in order',
  'Every system design concept an interview asks about, ordered as a dependency chain: caching, load balancing, replication, partitioning, consistency, consensus. Each with its cost and its trap.',
  '/concepts',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
