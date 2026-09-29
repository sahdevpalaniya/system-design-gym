import Link from 'next/link'
import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { Page, PageHeader, Prose, Section } from '@/components/common/ui'
import { CONTACT_EMAIL } from '@/lib/legal'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'About this site',
  'Why this exists, who writes it, and how it differs from the usual system design catalogue.',
  '/about',
  true,
)

export default function AboutPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="About"
        title="Why this site exists"
        lede="Most system design material teaches you components. Much less of it teaches the order to think in, and that is the part that fails under pressure."
      />

      <Section n="1" title="The problem it was built for">
        <Prose
          paragraphs={[
            'Read enough system design material and you end up knowing what a message queue is, what sharding is, and roughly how Instagram works. Then someone says "design a ride-hailing app" and none of it arrives in the right order.',
            'The gap is not knowledge. It is method: asking what the thing must do before drawing it, following one request through its failures, doing the arithmetic to find which part is hard, and naming what each decision costs. That is a practisable skill, and it is what this site drills.',
          ]}
        />
      </Section>

      <Section n="2" title="How it works">
        <Prose
          paragraphs={[
            `There are ${CONCEPTS.length} topics and ${PROBLEMS.length} worked problems. The topics are ordered as a dependency chain rather than a menu (caching before CDNs, replication before partitioning), so reading top to bottom never asks you to assume something you have not met.`,
            'Every page makes you write your own answer before it shows you one. That gap, between what you wrote and what you then read, is where the learning happens. Hints are available throughout, and each one is a question to ask yourself rather than the answer.',
            'Every topic also states what the technique **costs** you, not just what it does. Naming the cost out loud is one of the clearest differences between a senior answer and a junior one, so every topic page is required to have it.',
          ]}
        />
      </Section>

      <Section n="3" title="Who writes it">
        <Prose
          paragraphs={[
            'One engineer, writing the material they wanted when they were preparing. There is no team and no company behind it.',
            'Every topic links out to its sources, such as the RFC, the paper or the database documentation, rather than asking you to take its word for anything. Where this site and a specification disagree, the specification is right.',
          ]}
        />
      </Section>

      <Section n="4" title="Get in touch">
        <Prose
          paragraphs={[
            `Corrections are welcome. Email **${CONTACT_EMAIL}**.`,
          ]}
        />
        <p className="text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          <Link href="/contact" style={{ color: 'var(--accent)' }}>Contact</Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms</Link>
        </p>
      </Section>
    </Page>
  )
}
