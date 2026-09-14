import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { Card, Page, PageHeader } from '@/components/common/ui'
import { humanMinutes, sectionMinutes, trackMinutes } from '@/lib/estimate'

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: l.id }))
}

export default async function LanguagePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const l = getLanguage(lang)
  if (!l) notFound()

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href="/languages" className="hover:opacity-70">
              Languages
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ color: 'var(--faint)' }}>
              {l.lessons.length} topics · about {humanMinutes(trackMinutes(l.sections, l.lessons))} in total
            </span>
          </>
        }
        title={l.name}
        lede={l.blurb}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <Card href={`/languages/${l.id}/revise`}>
          <div className="text-[0.9375rem] font-semibold">Quick revision</div>
          <div className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
            The main points from all {l.lessons.length} topics on one page. Good for a quick reread.
          </div>
        </Card>
        {l.quizzes?.length ? (
          <Card href={`/languages/${l.id}/quiz`}>
            <div className="text-[0.9375rem] font-semibold">Multiple choice tests</div>
            <div className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {l.quizzes.reduce((n, q) => n + q.questions.length, 0)} questions, one test per section
              plus a mixed final.
            </div>
          </Card>
        ) : null}
      </div>

      <p className="mb-8 text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
        Read the sections in order. Each one builds on the ones before it. There is no timetable, so go
        as fast or as slow as you like. Every topic ends with something to build, plus a few short tasks
        to try in your own editor. Official docs:{' '}
        <a href={l.home} target="_blank" rel="noreferrer" className="font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
          {l.home.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
      </p>

      <div className="space-y-8">
        {(() => {
          const bySlug = new Map(l.lessons.map((x) => [x.slug, x]))
          let n = 0
          return l.sections.map((s, si) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="mb-1 flex items-baseline gap-2.5">
                <span className="tabular text-[0.75rem] font-bold" style={{ color: 'var(--accent)' }}>
                  {String(si + 1).padStart(2, '0')}
                </span>
                <h2 className="text-[1.1875rem] font-bold tracking-[-0.01em]">{s.name}</h2>
                <span className="tabular shrink-0 text-[0.75rem]" style={{ color: 'var(--faint)' }}>
                  {humanMinutes(sectionMinutes(s, l.lessons))}
                </span>
              </div>
              <p className="mb-3.5 text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {s.blurb}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {s.lessons.map((slug) => {
                  const t = bySlug.get(slug)
                  if (!t) return null
                  n += 1
                  const step = n
                  return (
                    <Card key={slug} href={`/languages/${l.id}/${slug}`}>
                      <div className="flex gap-2.5">
                        <span
                          className="tabular mt-[1px] shrink-0 text-[0.75rem] font-bold"
                          style={{ color: 'var(--faint)' }}
                        >
                          {String(step).padStart(2, '0')}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.9062rem] leading-snug font-semibold">{t.title}</span>
                          <span
                            className="mt-1 block text-[0.7812rem] leading-relaxed"
                            style={{ color: 'var(--muted)' }}
                          >
                            {t.oneLine}
                          </span>
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))
        })()}
      </div>
    </Page>
  )
}
