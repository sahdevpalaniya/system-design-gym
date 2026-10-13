import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ModeIntro } from '@/components/common/ModeIntro'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'Timed system design mock interview (45 minutes)',
    'Run a timed 45-minute system design mock interview on a real problem, then compare your answer stage by stage with a worked solution.',
    '/practice/mock',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeIntro
        paragraphs={[
          "A timed mock interview on one problem: all five stages, each with its own timer. The timers keep running past zero instead of cutting you off.",
          "Nothing is revealed until all five stages are submitted: no model answers, checklists or hints along the way. At the end you read the model answers, mark honestly what you had, and get a report card. If you have chosen an interviewer archetype, it shapes the follow-ups.",
        ]}
      />
    </>
  )
}
