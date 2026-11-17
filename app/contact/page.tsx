import Link from 'next/link'
import { Page, PageHeader, Prose, Section } from '@/components/common/ui'
import { CONTACT_EMAIL } from '@/lib/legal'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'Contact Dev Skills: questions and feedback',
  'Email the person who writes Dev Skills to report a mistake on a page, ask a question, report a security problem, or have your account and answers deleted.',
  '/contact',
  true,
)

export default function ContactPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        lede="One inbox, read by the person who writes the site."
      />

      <Section n="1" title="Email">
        <p className="mb-4 text-[1.0625rem] font-semibold">
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent)' }}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="mb-4 text-[0.9375rem]" style={{ color: 'var(--muted)' }}>
          Expect a reply within three working days. Corrections to a page are usually made in the same window, and
          significant ones are listed in the <Link href="/changelog" style={{ color: 'var(--accent)' }}>changelog</Link>.
        </p>
        <Prose
          paragraphs={[
            '**Found a mistake?** Say which page and what is wrong. Technical corrections are the most useful mail this site gets, and they get fixed.',
            '**Want your data deleted?** Say so and it will be done: the account, the stored answers, all of it. No reason required.',
            '**Security problem?** See [/.well-known/security.txt](/.well-known/security.txt) for the reporting address.',
          ]}
        />
      </Section>

      <Section n="2" title="Who you are writing to">
        <Prose
          paragraphs={[
            'Dev Skills is a small, independent site run by one maintainer, who writes and reviews every page. [About](/about) explains why the site exists, how pages are written and checked, and how AI assistance is used.',
            'The site is free to read and is supported by advertising (Google AdSense). No company it mentions has paid for or reviewed any page. It is not affiliated with any company whose interviews it describes.',
          ]}
        />
      </Section>

      <Section n="3" title="Before you write">
        <Prose
          paragraphs={[
            'What is stored about you, and how to remove it: [Privacy policy](/privacy).',
            'The rules for using the site and its code examples: [Terms of use](/terms).',
            'What changed on the site recently, and which corrections were made: [Changelog](/changelog).',
          ]}
        />
      </Section>
    </Page>
  )
}
