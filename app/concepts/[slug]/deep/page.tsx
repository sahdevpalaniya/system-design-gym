import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CONCEPTS, TIER_INFO, getConcept } from '@/content/system-design/concepts'
import { DEEP_DIVES, getDeepDive, getExample } from '@/content/system-design/deep'
import { DeepDiveBody, WorkedExampleBlock } from '@/components/system-design/DeepDive'
import { Page, PageHeader } from '@/components/common/ui'
import { MarkRead } from '@/components/common/MarkRead'
import { articleJsonLd, breadcrumbJsonLd, pageMeta, subject } from '@/lib/seo'
import { pageDates } from '@/lib/content-dates'

export function generateStaticParams() {
  return Object.keys(DEEP_DIVES).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getConcept(slug)
  if (!c) return {}
  const short = c.navTitle ?? c.title
  const deep = getDeepDive(slug)
  return pageMeta(
    `${short} explained in depth — system design`,
    deep?.description ??
    // the concept page's subject, so the verb agrees with `plural`
    // ("a stronger consistency model ... behaves", "CDNs ... behave")
    `How ${c.subject ?? subject(short)} actually ${c.plural ? 'behave' : 'behaves'} under load: the mechanism, the failure modes, the numbers and a worked example.`,
    `/concepts/${slug}/deep`,
    true,
  )
}

export default async function DeepDivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getConcept(slug)
  const deep = getDeepDive(slug)
  if (!c || !deep) notFound()

  const example = getExample(slug)

  return (
    <Page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Concepts', path: '/concepts' },
              { name: c.navTitle ?? c.title, path: `/concepts/${c.slug}` },
              { name: 'In depth', path: `/concepts/${c.slug}/deep` },
            ]),
            articleJsonLd({
              headline: `${c.title} — in depth`,
              description: deep.intro.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|`/g, ''),
              path: `/concepts/${c.slug}/deep`,
              ...pageDates(`/concepts/${c.slug}/deep`),
              section: TIER_INFO[c.tier].name,
            }),
          ]),
        }}
      />
      <PageHeader
        eyebrow={
          <>
            <Link href={`/concepts/${c.slug}`} className="hover:opacity-70">
              ← {c.title}
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>{TIER_INFO[c.tier].name}</span>
          </>
        }
        title={`${c.title} — in depth`}
        lede={deep.intro}
      />

      <DeepDiveBody deep={deep} />

      {example ? <WorkedExampleBlock example={example} /> : null}

      <div className="mt-10">
        <MarkRead id={`deep:${slug}`} label="this deep dive" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <span className="text-[0.8438rem]" style={{ color: 'var(--muted)' }}>
          Back to the summary and the self-check.
        </span>
        <Link
          href={`/concepts/${c.slug}`}
          className="rounded-lg border px-4 py-2 text-[0.875rem] font-semibold transition hover:opacity-75"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          ← {c.title}
        </Link>
      </div>
    </Page>
  )
}
