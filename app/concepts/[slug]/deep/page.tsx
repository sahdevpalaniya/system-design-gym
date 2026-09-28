import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CONCEPTS, TIER_INFO, getConcept } from '@/content/system-design/concepts'
import { DEEP_DIVES, getDeepDive, getExample } from '@/content/system-design/deep'
import { DeepDiveBody, WorkedExampleBlock } from '@/components/system-design/DeepDive'
import { Page, PageHeader } from '@/components/common/ui'
import { MarkRead } from '@/components/common/MarkRead'
import { pageMeta } from '@/lib/seo'

export function generateStaticParams() {
  return Object.keys(DEEP_DIVES).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getConcept(slug)
  if (!c) return {}
  const short = c.navTitle ?? c.title
  return pageMeta(
    `${short} explained in depth — system design`,
    `How ${short.toLowerCase()} actually behaves under load: the mechanism, the failure modes, the numbers and a worked example.`,
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
