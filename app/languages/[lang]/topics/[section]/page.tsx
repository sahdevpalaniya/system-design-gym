import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { Card, Page, PageHeader, Rich } from '@/components/common/ui'
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
    r.s.metaDescription ?? `${r.s.blurb.replace(/\*\*/g, '')} ${n} lessons with runnable examples.`,
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
  // This section's test (quiz ids equal section ids), then any checkpoints that
  // come straight after it in the quiz list: they are placed where they fall due.
  const quizzes = l.quizzes ?? []
  const qi = quizzes.findIndex((q) => q.id === s.id)
  const tests = qi < 0 ? [] : [quizzes[qi]]
  for (let j = qi + 1; qi >= 0 && j < quizzes.length; j++) {
    const q = quizzes[j]
    if (q.id === 'all' || l.sections.some((x) => x.id === q.id)) break
    tests.push(q)
  }

  return (
    <Page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
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

      {s.intro ? (
        <div className="mb-8 max-w-3xl space-y-3 text-[0.9375rem] leading-relaxed">
          {s.intro.about.map((p) => (
            <p key={p}>
              <Rich text={p} />
            </p>
          ))}
        </div>
      ) : null}

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

      {s.intro ? (
        <section className="mb-10 max-w-3xl space-y-8">
          <div>
            <h2 className="mb-3 text-[1.25rem] font-bold tracking-[-0.01em]">What you will be able to do</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-[0.9062rem] leading-relaxed">
              {s.intro.outcomes.map((o) => (
                <li key={o}>
                  <Rich text={o} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-[1.25rem] font-bold tracking-[-0.01em]">The order to study it in</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-[0.9062rem] leading-relaxed">
              {s.intro.order.map((o) => (
                <li key={o}>
                  <Rich text={o} />
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* The cards above are navigation. This is the substance: what each lesson
          teaches, in the lesson's own words, so the hub is worth reading (and
          worth indexing) on its own rather than being a list of links. */}
      <section className="mb-10 max-w-3xl">
        <h2 className="mb-1 text-[1.25rem] font-bold tracking-[-0.01em]">What each lesson covers</h2>
        <p className="mb-6 text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          By the end of this section you will be able to do everything below. Each lesson has runnable{' '}
          {l.name} examples you can edit and run in the browser.
        </p>
        <ol className="space-y-7">
          {lessons.map((t, n) => (
            <li key={t.slug}>
              <h3 className="text-[1rem] font-semibold">
                <Link href={`/languages/${l.id}/${t.slug}`} className="hover:opacity-70">
                  {n + 1}. {t.title}
                </Link>
              </h3>
              {t.objectives?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9062rem] leading-relaxed">
                  {t.objectives.map((o) => (
                    <li key={o}>
                      <Rich text={o} />
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Remember:</strong> <Rich text={t.remember} />
              </p>
            </li>
          ))}
        </ol>
      </section>

      {tests.length ? (
        <section className="mb-10 max-w-3xl">
          <h2 className="mb-3 text-[1.25rem] font-bold tracking-[-0.01em]">Test yourself</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {tests.map((q) => (
              <li key={q.id}>
                <Card href={`/languages/${l.id}/quiz/${q.id}`}>
                  <div className="text-[0.9375rem] font-semibold">
                    {q.name} · {q.questions.length} questions
                  </div>
                  <div className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {q.blurb}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
