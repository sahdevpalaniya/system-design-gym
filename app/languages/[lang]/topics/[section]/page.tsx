import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { Card, Page, PageHeader } from '@/components/common/ui'
import { humanMinutes, sectionMinutes } from '@/lib/estimate'
import { breadcrumbJsonLd, itemListJsonLd, pageMeta } from '@/lib/seo'

/**
 * One indexable page per course section ("DSA in Go", "Concurrency in Go"),
 * built from the section data, so every track gets section hubs for free.
 */
export function generateStaticParams() {
  return LANGUAGES.flatMap((l) => l.sections.map((s) => ({ lang: l.id, section: s.id })))
}

function lookup(lang: string, section: string) {
  const l = getLanguage(lang)
  const s = l?.sections.find((x) => x.id === section)
  return l && s ? { l, s } : null
}

function heading(l: { name: string; alias?: string }, s: { name: string; searchTitle?: string }) {
  return s.searchTitle ?? `${s.name} in ${l.name} (${l.alias ?? l.name})`
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang, section } = await params
  const r = lookup(lang, section)
  if (!r) return {}
  const n = r.s.lessons.length
  return pageMeta(
    heading(r.l, r.s),
    `${r.s.blurb.replace(/\*\*/g, '')} ${n} lessons with runnable examples.`,
    `/languages/${r.l.id}/topics/${r.s.id}`,
    true,
  )
}

export default async function SectionHub({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang, section } = await params
  const r = lookup(lang, section)
  if (!r) notFound()
  const { l, s } = r
  const bySlug = new Map(l.lessons.map((x) => [x.slug, x]))
  const lessons = s.lessons.map((slug) => bySlug.get(slug)).filter((t) => t !== undefined)
  const path = `/languages/${l.id}/topics/${s.id}`
  const i = l.sections.findIndex((x) => x.id === s.id)
  const prev = l.sections[i - 1]
  const next = l.sections[i + 1]

  return (
    <Page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: l.name, path: `/languages/${l.id}` },
              { name: s.name, path },
            ]),
            itemListJsonLd(
              heading(l, s),
              lessons.map((t) => ({ name: t.title, path: `/languages/${l.id}/${t.slug}` })),
            ),
          ]),
        }}
      />
      <PageHeader
        eyebrow={
          <>
            <Link href={`/languages/${l.id}`} className="hover:opacity-70">
              {l.name}
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>
              Section {i + 1} of {l.sections.length} · {lessons.length} lessons · about {humanMinutes(sectionMinutes(s, l.lessons))}
            </span>
          </>
        }
        title={heading(l, s)}
        lede={s.blurb.replace(/\*\*/g, '')}
      />

      <ol className="mb-10 grid gap-2.5 sm:grid-cols-2">
        {lessons.map((t, n) => (
          <li key={t.slug}>
            <Card href={`/languages/${l.id}/${t.slug}`}>
              <div className="text-[0.9375rem] font-semibold">
                <span className="tabular mr-1.5" style={{ color: 'var(--dim)' }}>
                  {String(n + 1).padStart(2, '0')}
                </span>
                {t.title}
              </div>
              <div className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {t.oneLine}
              </div>
              {t.challenge ? (
                <div className="mt-1.5 text-[0.75rem] font-semibold" style={{ color: 'var(--accent)' }}>
                  Graded challenge
                </div>
              ) : null}
            </Card>
          </li>
        ))}
      </ol>

      <nav aria-label="Other sections" className="tap-children flex flex-wrap justify-between gap-3 text-[0.875rem]">
        {prev ? (
          <Link href={`/languages/${l.id}/topics/${prev.id}`} className="hover:opacity-70" style={{ color: 'var(--accent)' }}>
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/languages/${l.id}/topics/${next.id}`} className="hover:opacity-70" style={{ color: 'var(--accent)' }}>
            {next.name} →
          </Link>
        ) : null}
      </nav>
    </Page>
  )
}
