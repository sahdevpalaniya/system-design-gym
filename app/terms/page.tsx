import Link from 'next/link'
import { Page, PageHeader, Prose, Section } from '@/components/common/ui'
import { CONTACT_EMAIL, POLICY_UPDATED } from '@/lib/legal'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'Terms of use',
  'The terms for using this site: what it is, what it is not, and what is and is not promised.',
  '/terms',
  true,
)

export default function TermsPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Legal"
        title="Terms of use"
        lede={`The short version: use it freely, do not copy it wholesale, and do not treat it as a guarantee of anything. Last updated ${POLICY_UPDATED}.`}
      />

      <Section n="1" title="What this site is">
        <Prose
          paragraphs={[
            'An educational site about system design interviews. It is free to read and use. There is no account requirement, no trial, and nothing to cancel.',
            'It is written by one person and is not affiliated with, endorsed by, or connected to any of the companies named on it. Company names are used to describe the style of their interviews, which is commentary, not a partnership.',
          ]}
        />
      </Section>

      <Section n="2" title="What it does not promise">
        <Prose
          paragraphs={[
            'This site will not get you a job. It is study material, written from published sources and experience, and it can be wrong or out of date. Interviews vary by company, team and interviewer.',
            'The content is provided as-is, without warranty. Do not rely on it for production engineering decisions without checking the primary sources — every topic page links to them for exactly that reason.',
          ]}
        />
      </Section>

      <Section n="3" title="Using the content">
        <Prose
          paragraphs={[
            'Read it, learn from it, quote a paragraph with a link back. That is all fine and welcome.',
            'Republishing pages wholesale, or feeding the site into a scraper to rebuild it somewhere else, is not. The writing is original work and remains the property of its author.',
          ]}
        />
      </Section>

      <Section n="4" title="Your account and your answers">
        <Prose
          paragraphs={[
            'If you sign in, keep your Google account secure — anyone with it can reach your progress. Do not paste confidential or employer-owned material into the answer boxes; they are stored, as the [privacy policy](/privacy) explains.',
            `An account can be deleted on request at **${CONTACT_EMAIL}**. Accounts that are used to abuse the site may be removed without notice.`,
          ]}
        />
      </Section>

      <Section n="5" title="Changes">
        <Prose
          paragraphs={[
            'These terms may change as the site grows. Material changes will be reflected in the date at the top of this page rather than applied quietly.',
          ]}
        />
        <p className="text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          See also the <Link href="/privacy" style={{ color: 'var(--accent)' }}>privacy policy</Link>.
        </p>
      </Section>
    </Page>
  )
}
