import { pageMeta } from '@/lib/seo'
import { CONCEPTS } from '@/content/system-design/concepts'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  `System Design Concepts for Interviews: All ${CONCEPTS.length}, with Examples`,
  `All ${CONCEPTS.length} system design concepts interviews ask about, in dependency order from caching to consensus, each with its cost, when to use it and the follow-up.`,
  '/concepts',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
