import Link from 'next/link'
import { Byline, ReviewedLine } from '@/components/common/Byline'
import { notFound } from 'next/navigation'
import { LESSONS, getLesson } from '@/content/system-design/foundations'
import { GUIDES, getGuide } from '@/content/system-design/guides'
import { Table } from '@/components/system-design/DeepDive'
import type { Guide } from '@/lib/types'
import { PATH, getConcept } from '@/content/system-design/concepts'
import { ConceptVisualBlock } from '@/components/system-design/ConceptCheck'
import { Bullets, Card, Page, PageHeader, Prose, Rich } from '@/components/common/ui'
import { MarkRead } from '@/components/common/MarkRead'
import { articleJsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { pageDates } from '@/lib/content-dates'
import { WorkedExampleBlock } from '@/components/system-design/DeepDive'

export function generateStaticParams() {
  return [...LESSONS, ...GUIDES].map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const g = getGuide(slug)
  if (g) return pageMeta(g.searchTitle, g.description, `/learn/${g.slug}`, true, true)
  const l = getLesson(slug)
  if (!l) return {}
  return pageMeta(
    // the lesson titles already say "system design"; do not say it twice
    l.searchTitle ??
    (/^What is system design/.test(l.title)
      ? 'What is system design? A beginner\u2019s introduction'
      : `${l.navTitle ?? l.title} — system design basics`),
    l.description ?? `${l.oneLine} ${l.body[0] ?? ''}`,
    `/learn/${l.slug}`,
    true,
    true, // own opengraph-image
  )
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = getGuide(slug)
  if (g) return <GuidePage g={g} />
  const l = getLesson(slug)
  if (!l) notFound()

  const i = LESSONS.findIndex((x) => x.slug === slug)
  const prev = i > 0 ? LESSONS[i - 1] : null
  const next = i < LESSONS.length - 1 ? LESSONS[i + 1] : null
  const firstConcept = getConcept(PATH.find((s) => s.concepts?.length)?.concepts?.[0] ?? '')

  return (
    <Page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Start from scratch', path: '/learn' },
              { name: l.navTitle ?? l.title, path: `/learn/${l.slug}` },
            ]),
            articleJsonLd({
              headline: l.title,
              description: l.oneLine,
              path: `/learn/${l.slug}`,
              ...pageDates(`/learn/${l.slug}`),
              section: 'System design basics',
            }),
          ]),
        }}
      />
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
      <ReviewedLine path={`/learn/${l.slug}`} />

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

      {l.example ? (
        <div className="mb-10">
          <WorkedExampleBlock example={l.example} />
        </div>
      ) : null}

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
      <Byline title={l.title} path={`/learn/${l.slug}`} />
    </Page>
  )
}

/** A standalone guide: answer first, then question-style sections. */
function GuidePage({ g }: { g: Guide }) {
  const path = `/learn/${g.slug}`
  const others = GUIDES.filter((x) => x.slug !== g.slug)
  return (
    <Page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Start from scratch', path: '/learn' },
              { name: g.navTitle, path },
            ]),
            articleJsonLd({
              headline: g.title,
              description: g.description,
              path,
              ...pageDates(path),
              section: 'System design interview guides',
            }),
          ]),
        }}
      />
      <PageHeader
        eyebrow={
          <>
            <Link href="/learn" className="hover:opacity-70">
              Start from scratch
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>Interview guide</span>
          </>
        }
        title={g.title}
        lede={g.answer}
      />
      <ReviewedLine path={path} />

      {g.sections.map((s) => (
        <section key={s.heading} className="mb-8">
          <h2 className="mb-3 text-[1.375rem] font-bold tracking-[-0.01em]">{s.heading}</h2>
          {s.body.length ? <Prose paragraphs={s.body} /> : null}
          {s.points?.length ? (
            <div className="mt-4">
              <Bullets items={s.points} />
            </div>
          ) : null}
          {s.table ? <Table table={s.table} /> : null}
        </section>
      ))}

      <Card className="my-8">
        <div
          className="mb-3 text-[0.6875rem] font-bold tracking-[0.07em] uppercase"
          style={{ color: 'var(--faint)' }}
        >
          The short version
        </div>
        <Bullets items={g.keyPoints} />
      </Card>

      <div
        className="mb-10 rounded-xl px-5 py-4 text-[1rem] leading-relaxed"
        style={{ background: 'var(--say-bg)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--say)' }}>
          Remember:{' '}
        </span>
        <Rich text={g.remember} />
      </div>

      <nav className="grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="More interview guides">
        {others.map((o) => (
          <Link key={o.slug} href={`/learn/${o.slug}`} className="card p-4 transition hover:-translate-y-px">
            <span className="block text-[0.7188rem]" style={{ color: 'var(--faint)' }}>Interview guide</span>
            <span className="block text-[0.875rem] font-semibold">{o.title}</span>
          </Link>
        ))}
      </nav>
      <Byline title={g.title} path={path} />
    </Page>
  )
}
