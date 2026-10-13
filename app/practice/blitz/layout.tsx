import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { ModeIntro } from '@/components/common/ModeIntro'

// the page itself is a client component, which cannot export metadata
export const metadata: Metadata = {
  ...pageMeta(
    'System design follow-up blitz: defend your design',
    'Rapid-fire interviewer follow-ups on your design decisions. Defend each choice in a sentence, then see the answer a strong candidate gives.',
    '/practice/blitz',
    true,
  ),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeIntro
        paragraphs={[
          "A round of six interviewer follow-up questions with ninety seconds each. Answer as if someone just asked and is waiting: talk, do not plan.",
          "After each answer you see what a weak answer sounds like, what a strong one sounds like, and the trap hidden in the question, then rate yourself out of 3. Rounds lean toward the categories you keep rating low and toward your chosen interviewer archetype's favourites.",
        ]}
      />
    </>
  )
}
