import Link from 'next/link'
import { Page, PageHeader, Rich } from '@/components/common/ui'
import { CHANGELOG } from '@/lib/changelog'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'Changelog: what changed on Dev Skills, and when',
  'Every significant content change on Dev Skills, newest first: new lessons and concepts, rewrites, corrections and merged pages, dated from the site history.',
  '/changelog',
  true,
)

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function ChangelogPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Changelog"
        title="What changed, and when"
        lede="Significant content changes, newest first, dated from the site's version history. Styling and infrastructure changes are left out."
      />
      <ol className="space-y-8">
        {CHANGELOG.map((e) => (
          <li key={e.date}>
            <h2 className="mb-2 text-[1.0625rem] font-semibold">
              <time dateTime={e.date}>{fmt(e.date)}</time>
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed">
              {e.items.map((it, i) => (
                <li key={i}>
                  <Rich text={it} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-[0.875rem]" style={{ color: 'var(--muted)' }}>
        Spotted a mistake? Every page has a &ldquo;Report a mistake&rdquo; link, or see{' '}
        <Link href="/contact" style={{ color: 'var(--accent)' }}>
          contact
        </Link>
        .
      </p>
    </Page>
  )
}
