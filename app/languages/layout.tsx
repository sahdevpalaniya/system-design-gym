import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

// Without this every language page inherits the root's System Design title and
// `canonical: '/'`, which tells search engines each lesson is the homepage.
// Each page below overrides it with its own title and canonical.
export const metadata: Metadata = pageMeta(
  'Programming courses: learn Go (Golang) from scratch',
  'Programming language courses that start from nothing and build toward real projects. Go (Golang) first: from syntax to a JSON API, with runnable code.',
  '/languages',
  true,
)

export default function LanguagesLayout({ children }: { children: React.ReactNode }) {
  return children
}
