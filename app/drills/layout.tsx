import { pageMeta } from '@/lib/seo'
import { ModeIntro } from '@/components/common/ModeIntro'

// the page itself is a client component, so its metadata lives here
export const metadata = pageMeta(
  'System design follow-up questions — defence drills',
  'Practise the seven kinds of follow-up an interviewer uses to break your system design, one drill at a time.',
  '/drills',
  true,
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeIntro
        paragraphs={[
          "Practise follow-up questions one at a time, filtered by category or across all of them. Each question gives you ninety seconds to write your defence of a design decision.",
          "Then compare against a weak answer, a strong answer and the trap in the question, and rate yourself out of 3. Your ratings build a per-category record, so you can see which kind of follow-up you are weakest at and drill that category.",
        ]}
      />
    </>
  )
}
