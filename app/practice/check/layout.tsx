import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ModeIntro } from '@/components/common/ModeIntro'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'System design concept check: spaced repetition quiz',
    'Test yourself on the 44 system design concepts with spaced repetition: answer from memory, reveal, and the ones you miss come back sooner.',
    '/practice/check',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeIntro
        paragraphs={[
          "Each round takes five concepts: the ones due for review come first, then concepts you have not tried yet. For each one you answer from memory with **what the technique costs you**, not its definition, then compare with the topic's own answer.",
          "Then rate how close you were. That rating schedules the concept: **missed it** brings it back tomorrow, **partly** in three days, **mostly** in a week or more, and **had it** in three weeks or more; those two gaps keep stretching each time you get the concept right. The schedule only works if the ratings are honest.",
        ]}
      />
    </>
  )
}
