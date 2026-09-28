import { Page, PageHeader, Prose, Section } from '@/components/common/ui'
import { CONTACT_EMAIL } from '@/lib/legal'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'Contact',
  'How to report a mistake, ask a question, or have your account and stored answers deleted.',
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
        <Prose
          paragraphs={[
            '**Found a mistake?** Say which page and what is wrong. Technical corrections are the most useful mail this site gets, and they get fixed.',
            '**Want your data deleted?** Say so and it will be done — the account, the stored answers, all of it. No reason required.',
            '**Security problem?** See [/.well-known/security.txt](/.well-known/security.txt) for the reporting address.',
          ]}
        />
      </Section>
    </Page>
  )
}
