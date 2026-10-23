import { pageMeta } from '@/lib/seo'
import { PROBLEMS } from '@/content/system-design/problems'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  `System design interview questions and answers (${PROBLEMS.length})`,
  'System design interview questions with worked answers: URL shortener, chat, news feed, rate limiter, payments. Five stages each; you answer first.',
  '/problems',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
