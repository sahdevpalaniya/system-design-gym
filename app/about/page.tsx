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
        lede="Most system design material teaches you components. Almost none of it teaches you the order to think in, which is the part that actually fails under pressure."
      />

      <Section n="1" title="The problem it was built for">
        <Prose
          paragraphs={[
            'Read enough system design material and you end up knowing what a message queue is, what sharding is, and roughly how Instagram works. Then someone says "design a ride-hailing app" and none of it arrives in the right order.',
            'The gap is not knowledge. It is method: asking what the thing must do before drawing it, following one request through its failures, doing the arithmetic to find which part is genuinely hard, and naming what each decision costs. That is a practisable skill, and it is what this site drills.',
          ]}
        />
      </Section>

      <Section n="2" title="How it works">
        <Prose
          paragraphs={[
            `There are ${CONCEPTS.length} topics and ${PROBLEMS.length} worked problems. The topics are ordered as a dependency chain rather than a menu — caching before CDNs, replication before partitioning — so reading top to bottom never asks you to assume something you have not met.`,
            'Every page makes you write your own answer before it shows you one. That gap, between what you wrote and what you then read, is the only part that teaches. Hints are available throughout, and every one of them is a question to ask yourself rather than the answer.',
            'Every topic also states what the technique **costs** you, not just what it does. Naming the cost out loud is the thing that separates a senior answer from a junior one, so it is a required field on every page rather than an afterthought.',
          ]}
        />
      </Section>

      <Section n="3" title="Who writes it">
        <Prose
          paragraphs={[
            'One engineer, writing the material they wanted when they were preparing. There is no team and no company behind it.',
            'Every topic links out to the primary source — the RFC, the paper, the database documentation — rather than asking you to take its word for anything. Where this site and a specification disagree, the specification is right.',
          ]}
        />
      </Section>

      <Section n="4" title="Get in touch">
        <Prose
          paragraphs={[
            `Corrections are genuinely welcome, especially where something here is wrong. Email **${CONTACT_EMAIL}**.`,
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
