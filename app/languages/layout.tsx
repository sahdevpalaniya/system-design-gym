import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// Without this every language page inherits the root's System Design title and
// `canonical: '/'`, which tells search engines each lesson is the homepage.
// Each page below overrides it with its own title and canonical.
export const metadata: Metadata = pageMeta(
  'Programming language courses',
  'Programming language courses that start from nothing and build toward real projects. Go (Golang) first: syntax to a working JSON API, with runnable examples.',
  '/languages',
)

export default function LanguagesLayout({ children }: { children: React.ReactNode }) {
  return children
}
