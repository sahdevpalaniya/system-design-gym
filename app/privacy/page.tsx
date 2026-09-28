import Link from 'next/link'
import { Page, PageHeader, Prose, Section } from '@/components/common/ui'
import { CONTACT_EMAIL, POLICY_UPDATED } from '@/lib/legal'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'Privacy policy',
  'What this site stores, where it stores it, and how to get it deleted. Signed out, your progress never leaves your browser.',
  '/privacy',
  true,
)

export default function PrivacyPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        lede={`What this site stores about you, and how to get rid of it. Last updated ${POLICY_UPDATED}.`}
      />

      <Section n="1" title="If you are signed out, nothing leaves your browser">
        <Prose
          paragraphs={[
            'You can use every part of this site without an account. When you are signed out, your progress — which topics you have read, the answers you type, your self-ratings and your gap log — is written to **localStorage in your own browser** and nowhere else. It is not sent to us, we cannot read it, and it does not exist on any server.',
            'Clearing your browser data deletes it permanently. There is no copy for us to restore, which is the trade for not having to trust us with it.',
          ]}
        />
      </Section>

      <Section n="2" title="If you sign in with Google, we store this">
        <Prose
          paragraphs={[
            'Signing in is optional, and exists so your progress survives a cleared browser and follows you between devices. If you do sign in with Google, we store the following in a PostgreSQL database:',
          ]}
        />
        <ul className="prose mb-5 list-disc pl-5">
          <li>
            <strong>Your Google account id</strong> — an opaque identifier Google gives us, used as
            the key your progress hangs off.
          </li>
          <li>
            <strong>Your name and email address</strong>, as Google reports them.
          </li>
          <li>
            <strong>When you first signed in, when you were last seen, and how many times you have
            signed in.</strong>
          </li>
          <li>
            <strong>Your progress</strong> — including the free-text answers you write in the
            practice boxes. Treat those as stored, and do not put anything confidential in them.
          </li>
        </ul>
        <Prose
          paragraphs={[
            'We never receive your Google password. We do not sell or share any of this, we do not use it to build an advertising profile of you, and nobody outside this site is given access to it.',
          ]}
        />
      </Section>

      <Section n="3" title="Cookies">
        <Prose
          paragraphs={[
            'Your theme choice and progress live in localStorage, which is not a cookie and is not transmitted anywhere.',
            '**Google Analytics** sets its own cookies (`_ga`, `_ga_*`) to count visits and see which pages are read. It records pages viewed, rough location, device and browser — never your answers or progress. You can block it with any tracker blocker and the site works the same. See [how Google uses information from sites that use its services](https://policies.google.com/technologies/partner-sites).',
            'Signed in, there is one session cookie so the site knows it is still you between page loads. It is strictly necessary for sign-in to work and does nothing else.',
          ]}
        />
      </Section>

      <Section n="4" title="Getting your data back, or deleted">
        <Prose
          paragraphs={[
            `You can export or clear everything from the [progress page](/progress) at any time. To have a signed-in account and all of its stored answers deleted from the database, email **${CONTACT_EMAIL}** and say so — no reason needed, and it will be done rather than talked you out of.`,
            'If you are in the UK or EU, the GDPR gives you the right to access, correct, export and erase your personal data, and to complain to your data protection authority. Those rights apply here.',
          ]}
        />
      </Section>

      <Section n="5" title="Who else is involved">
        <Prose
          paragraphs={[
            '**Vercel** hosts the site and processes standard server request logs, including IP addresses, as any web host does. **Google** provides sign-in, if you choose to use it, and Google Analytics for anonymous usage statistics. **Neon or an equivalent PostgreSQL host** stores the database.',
            'If advertising is ever added to this site, this section will name the provider and say what it collects **before** any ad is served, and a cookie banner will ask for your consent first where the law requires it.',
          ]}
        />
      </Section>

      <Section n="6" title="Contact">
        <Prose paragraphs={[`Questions or requests: **${CONTACT_EMAIL}**.`]} />
        <p className="text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          See also the <Link href="/terms" style={{ color: 'var(--accent)' }}>terms of use</Link>.
        </p>
      </Section>
    </Page>
  )
}
