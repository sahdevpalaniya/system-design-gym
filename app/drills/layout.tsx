import { pageMeta } from '@/lib/seo'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design follow-up questions — defence drills',
  'Practise the seven kinds of follow-up an interviewer uses to break your system design, one drill at a time.',
  '/drills',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
