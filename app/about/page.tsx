import Link from 'next/link'
import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LANGUAGES } from '@/content/languages'
import { Page, PageHeader, Prose, Section } from '@/components/common/ui'
import { CONTACT_EMAIL } from '@/lib/legal'
import { pageMeta } from '@/lib/seo'
import { AUTHOR } from '@/lib/author'

export const metadata = pageMeta(
  'About Dev Skills: who builds it and why',
  'Why Dev Skills exists, who writes it, and how it works: you write your own system design answer before you see one, and every topic names what it costs.',
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
            `System Design has ${CONCEPTS.length} topics and ${PROBLEMS.length} worked problems; ${LANGUAGES.map((l) => `${l.name} has ${l.lessons.length} lessons`).join(', ')}. Each track is ordered as a dependency chain rather than a menu (caching before CDNs, replication before partitioning), so reading top to bottom never asks you to assume something you have not met.`,
            'Every page makes you write your own answer before it shows you one. That gap, between what you wrote and what you then read, is where the learning happens. Hints are available throughout, and each one is a question to ask yourself rather than the answer.',
            'Every topic also states what the technique **costs** you, not just what it does. Naming the cost out loud is one of the clearest differences between a senior answer and a junior one, so every topic page is required to have it.',
          ]}
        />
      </Section>

      <Section n="3" title="Who writes it">
        <Prose
          paragraphs={[
            `**${AUTHOR.name}**, ${AUTHOR.role.toLowerCase()}. ${AUTHOR.bio}`,
            'Every topic links out to its sources, such as the RFC, the paper or the language documentation, rather than asking you to take its word for anything. Where this site and a specification disagree, the specification is right.',
            'Every Go example on the site is compiled and run automatically before each release, and every coding challenge is checked to make sure its tests catch a wrong answer.',
          ]}
        />
        <p className="mt-3 flex flex-wrap gap-4 text-[0.9375rem]">
          {AUTHOR.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer me" className="tap font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
              {l.label}
            </a>
          ))}
        </p>
        <p className="mt-3 text-[0.9375rem]" style={{ color: 'var(--muted)' }}>
          Found a mistake? Every page has a &ldquo;Report a mistake&rdquo; link, or write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section n="4" title="How content is written and reviewed">
        <Prose
          paragraphs={[
            'Each page starts from a question a learner or interviewer actually asks, and is written to one template: what problem the technique solves, what it costs, when to use it and when not to, how it works, and the follow-up question that usually comes next. A topic is not published without its cost section.',
            'Technical claims are checked against primary sources (specifications, papers, official documentation), and those sources are linked on the page under "Learn it from the source" or "Official documentation".',
            'Go code is checked by machine as well as by eye: before each release a script compiles every Go example with the Go toolchain and runs `go vet` on the runnable ones, and every coding challenge is tested against a known wrong answer to make sure its tests fail it.',
            'Company pages describe interview formats only from the company’s own public pages, listed as sources on each page. Anything else about a company’s round is labelled as what candidates report. This site has no inside information and is not affiliated with any company it names.',
          ]}
        />
      </Section>

      <Section n="5" title="How the site uses AI">
        <Prose
          paragraphs={[
            'Much of the drafting, editing and code on this site is done with the help of an AI assistant (Anthropic’s Claude). It is a writing and programming tool here, not the author: the topics, the method and the decisions about what each page says are the author’s, and AI-assisted text is published under his name only after he has reviewed it.',
            'AI output is treated like any first draft. Facts are checked against the linked sources, Go examples have to pass the compile checks above, and anything that cannot be verified is cut rather than published.',
            'If you find something that reads as wrong or invented, please report it. Corrections are fixed, and significant ones are recorded in the changelog.',
          ]}
        />
      </Section>

      <Section n="6" title="Updates and corrections">
        <Prose
          paragraphs={[
            'Pages are revised when a reader reports a mistake, when a language or tool release changes the right answer (for example a new Go version), and in periodic review passes across a whole track.',
            'Every lesson, concept and worked solution shows the date its content last changed, taken from the site’s version history, so the date moves only when the text does. The [changelog](/changelog) lists significant changes, newest first.',
            'Pages that turn out to repeat another page are merged into the fuller one, and the old address redirects there, rather than being left up as a thinner copy.',
          ]}
        />
      </Section>

      <Section n="7" title="Get in touch">
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
