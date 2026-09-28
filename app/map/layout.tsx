import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design curriculum map — what to learn next',
  'The whole system design syllabus on one page: foundations, concept tiers, problems, and the next thing to read.',
  '/map',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
