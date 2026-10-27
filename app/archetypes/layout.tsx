import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design interviewer types and how to handle them',
  'Six kinds of system design interviewer: how each behaves, what they score hardest, how to hold your answer up under their pressure, and a drill for each.',
  '/archetypes',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
