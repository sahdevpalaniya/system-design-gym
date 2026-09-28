import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design interviewer types and how to handle them',
  'Five kinds of system design interviewer, what each scores hardest, and how to hold your answer up under their particular pressure.',
  '/archetypes',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
