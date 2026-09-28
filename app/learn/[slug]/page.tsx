import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LESSONS, getLesson } from '@/content/system-design/foundations'
import { PATH, getConcept } from '@/content/system-design/concepts'
import { ConceptVisualBlock } from '@/components/system-design/ConceptCheck'
import { Bullets, Card, Page, PageHeader, Prose, Rich } from '@/components/common/ui'
import { MarkRead } from '@/components/common/MarkRead'
import { pageMeta } from '@/lib/seo'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const l = getLesson((await params).slug)
  if (!l) return {}
  return pageMeta(
    // the lesson titles already say "system design"; do not say it twice
    /^What is system design/.test(l.title)
      ? 'What is system design? A beginner\u2019s introduction'
      : `${l.navTitle ?? l.title} — system design basics`,
    `${l.oneLine} ${l.body[0] ?? ''}`,
    `/learn/${l.slug}`,
    true,
  )
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

      <Prose paragraphs={l.body} />

      {l.visual ? <ConceptVisualBlock visual={l.visual} /> : null}

      <Card className="my-8">
        <div
          className="mb-3 text-[0.6875rem] font-bold tracking-[0.07em] uppercase"
          style={{ color: 'var(--faint)' }}
        >
          The short version
        </div>
        <Bullets items={l.keyPoints} />
      </Card>

      <div
        className="mb-10 rounded-xl px-5 py-4 text-[1rem] leading-relaxed"
        style={{ background: 'var(--say-bg)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--say)' }}>
          Remember:{' '}
        </span>
        <Rich text={l.remember} />
      </div>

      <div className="mb-8">
        <MarkRead id={`lesson:${slug}`} label="this lesson" />
      </div>

      <nav className="flex items-stretch justify-between gap-3 border-t pt-6" aria-label="Lesson order">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="card flex min-w-0 flex-1 items-center gap-3 p-4 transition hover:-translate-y-px">
            <span style={{ color: 'var(--accent)' }} aria-hidden>←</span>
            <span className="min-w-0">
              <span className="block text-[0.7188rem]" style={{ color: 'var(--faint)' }}>Previous</span>
              <span className="block truncate text-[0.875rem] font-semibold">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="card flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-px">
            <span className="min-w-0">
              <span className="block text-[0.7188rem]" style={{ color: 'var(--faint)' }}>Next</span>
              <span className="block truncate text-[0.875rem] font-semibold">{next.title}</span>
            </span>
            <span style={{ color: 'var(--accent)' }} aria-hidden>→</span>
          </Link>
        ) : firstConcept ? (
          <Link href={`/concepts/${firstConcept.slug}`} className="card flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-px" style={{ background: 'var(--accent-soft)' }}>
            <span className="min-w-0">
              <span className="block text-[0.7188rem]" style={{ color: 'var(--accent)' }}>Groundwork done — first topic</span>
              <span className="block truncate text-[0.875rem] font-semibold">{firstConcept.title}</span>
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
