import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ModeIntro } from '@/components/common/ModeIntro'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'Daily system design practice: one problem in 15 minutes',
    'A 15-minute daily system design rep: one interview problem, requirements and numbers only, written before you see the model answer.',
    '/practice/daily',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeIntro
        paragraphs={[
          "A short daily rep on one system design problem, covering only the first two stages: **requirements** and the **request lifecycle**. No numbers, no architecture and no deep dive; those belong to a full session.",
          "The page suggests a problem in a shape you have not worked yet, or you can pick any problem from the list. Write your own answer for each stage first; the model answer and checklist appear only after you submit.",
        ]}
      />
    </>
  )
}
