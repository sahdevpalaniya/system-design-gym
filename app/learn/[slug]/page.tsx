import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LESSONS, getLesson } from '@/content/foundations'
import { PATH, getConcept } from '@/content/concepts'
import { ConceptVisualBlock } from '@/components/ConceptCheck'
import { Bullets, Card, Page, PageHeader, Prose, Rich } from '@/components/ui'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = getLesson(slug)
  if (!l) notFound()

  const i = LESSONS.findIndex((x) => x.slug === slug)
  const prev = i > 0 ? LESSONS[i - 1] : null
  const next = i < LESSONS.length - 1 ? LESSONS[i + 1] : null
  const firstConcept = getConcept(PATH.find((s) => s.concepts?.length)?.concepts?.[0] ?? '')

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href="/learn" className="hover:opacity-70">
              Start from scratch
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>
              Lesson {i + 1} of {LESSONS.length}
            </span>
          </>
        }
        title={l.title}
        lede={l.oneLine}
      />

      <Prose paragraphs={l.body} className="text-[17px]" />

      {l.visual ? <ConceptVisualBlock visual={l.visual} /> : null}

      <Card className="my-8">
        <div
          className="mb-3 text-[11px] font-bold tracking-[0.07em] uppercase"
          style={{ color: 'var(--faint)' }}
        >
          The short version
        </div>
        <Bullets items={l.keyPoints} />
      </Card>

      <div
        className="mb-10 rounded-xl px-5 py-4 text-[16px] leading-relaxed"
        style={{ background: 'var(--say-bg)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--say)' }}>
          Remember:{' '}
        </span>
        <Rich text={l.remember} />
      </div>

      <nav className="flex items-stretch justify-between gap-3 border-t pt-6" aria-label="Lesson order">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="card flex min-w-0 flex-1 items-center gap-3 p-4 transition hover:-translate-y-px">
            <span style={{ color: 'var(--accent)' }} aria-hidden>←</span>
            <span className="min-w-0">
              <span className="block text-[11.5px]" style={{ color: 'var(--faint)' }}>Previous</span>
              <span className="block truncate text-[14px] font-semibold">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="card flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-px">
            <span className="min-w-0">
              <span className="block text-[11.5px]" style={{ color: 'var(--faint)' }}>Next</span>
              <span className="block truncate text-[14px] font-semibold">{next.title}</span>
            </span>
            <span style={{ color: 'var(--accent)' }} aria-hidden>→</span>
          </Link>
        ) : firstConcept ? (
          <Link href={`/concepts/${firstConcept.slug}`} className="card flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-px" style={{ background: 'var(--accent-soft)' }}>
            <span className="min-w-0">
              <span className="block text-[11.5px]" style={{ color: 'var(--accent)' }}>Groundwork done — first topic</span>
              <span className="block truncate text-[14px] font-semibold">{firstConcept.title}</span>
            </span>
            <span style={{ color: 'var(--accent)' }} aria-hidden>→</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </Page>
  )
}
