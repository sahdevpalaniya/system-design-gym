import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design interview questions — 16 worked problems',
  'Practise the system design questions that actually get asked: URL shortener, chat, news feed, ride matching, rate limiter, payment ledger. Five stages each, you answer first.',
  '/problems',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
