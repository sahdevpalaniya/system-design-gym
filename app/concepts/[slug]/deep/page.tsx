import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CONCEPTS, TIER_INFO, getConcept } from '@/content/concepts'
import { DEEP_DIVES, getDeepDive, getExample } from '@/content/deep'
import { DeepDiveBody, WorkedExampleBlock } from '@/components/DeepDive'
import { Page, PageHeader } from '@/components/ui'

export function generateStaticParams() {
  return Object.keys(DEEP_DIVES).map((slug) => ({ slug }))
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

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <span className="text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Back to the summary and the self-check.
        </span>
        <Link
          href={`/concepts/${c.slug}`}
          className="rounded-lg border px-4 py-2 text-[14px] font-semibold transition hover:opacity-75"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          ← {c.title}
        </Link>
      </div>
    </Page>
  )
}
