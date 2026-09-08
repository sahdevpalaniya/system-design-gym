import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LANGUAGES, getLanguage, orderedLessons, sectionOf } from '@/content/languages'
import type { LangBlock } from '@/lib/types'
import { CodeBlock } from '@/components/golang/Code'
import { FolderTree } from '@/components/golang/FolderTree'
import { Exercises } from '@/components/golang/Exercises'
import { Contents } from '@/components/golang/Contents'
import { headingSlug } from '@/lib/slug'
import { humanMinutes, practiceMinutes, readMinutes } from '@/lib/estimate'
import { Bullets, Card, Page, PageHeader, Prose, Rich } from '@/components/common/ui'
import { MarkRead } from '@/components/common/MarkRead'

export function generateStaticParams() {
  return LANGUAGES.flatMap((l) => l.lessons.map((t) => ({ lang: l.id, slug: t.slug })))
}

const CALLOUT = {
  warn: { bg: 'var(--trap-bg)', fg: 'var(--trap)', label: 'Watch out' },
  ok: { bg: 'var(--say-bg)', fg: 'var(--say)', label: 'Worth knowing' },
  note: { bg: 'var(--cost-bg)', fg: 'var(--cost)', label: 'Note' },
} as const

function Block({ b }: { b: LangBlock }) {
  return (
    <section className="mb-7">
      {b.heading ? (
        <h2
          id={headingSlug(b.heading)}
          className="mt-9 mb-3 scroll-mt-24 text-[19px] font-bold tracking-[-0.01em]"
        >
          {b.heading}
        </h2>
      ) : null}

      {b.body ? <Prose paragraphs={b.body} className="text-[16.5px]" /> : null}

      {b.tree ? <FolderTree tree={b.tree} /> : null}

      {b.code ? <CodeBlock label={b.code.label} src={b.code.src} note={b.code.note} run={b.code.run} canRun={b.code.canRun} /> : null}

      {b.bullets ? (
        <div className="my-5">
          <Bullets items={b.bullets} />
        </div>
      ) : null}

      {b.table ? (
        <div className="my-6 overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-strong)' }}>
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {b.table.headers.map((h, i) => (
                  <th
                    key={i}
                    className="border-b px-3.5 py-2.5 text-left text-[12px] font-bold tracking-[0.05em] uppercase"
                    style={{ color: 'var(--faint)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.table.rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-b-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3.5 py-2.5 align-top leading-relaxed">
                      <Rich text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {b.callout ? (
        <div
          className="my-6 rounded-xl px-5 py-4 text-[15.5px] leading-relaxed"
          style={{ background: CALLOUT[b.callout.tone].bg }}
        >
          <span className="font-semibold" style={{ color: CALLOUT[b.callout.tone].fg }}>
            {CALLOUT[b.callout.tone].label}:{' '}
          </span>
          <Rich text={b.callout.text} />
        </div>
      ) : null}
    </section>
  )
}

export default async function LangLessonPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const l = getLanguage(lang)
  const t = l?.lessons.find((x) => x.slug === slug)
  if (!l || !t) notFound()

  const order = orderedLessons(l)
  const i = order.findIndex((x) => x.slug === slug)
  const prev = i > 0 ? order[i - 1] : null
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null
  const section = sectionOf(l, slug)

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Link href={`/languages/${l.id}`} className="hover:opacity-70">
              {l.name}
            </Link>
            {section ? (
              <>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <Link href={`/languages/${l.id}#${section.id}`} className="hover:opacity-70" style={{ color: 'var(--faint)' }}>
                  {section.name}
                </Link>
              </>
            ) : null}
          </>
        }
        title={t.title}
        lede={t.oneLine}
        meta={
          <span className="tabular text-[12.5px]" style={{ color: 'var(--faint)' }}>
            Topic {i + 1} of {order.length} · {humanMinutes(readMinutes(t))} to read
            {practiceMinutes(t) ? ` · ${humanMinutes(practiceMinutes(t))} to build` : ''}
          </span>
        }
      />

      <Contents headings={t.blocks.map((b) => b.heading).filter((h): h is string => Boolean(h))} />

      {t.blocks.map((b, bi) => (
        <Block key={bi} b={b} />
      ))}

      <Card className="my-8">
        <div className="mb-3 text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--faint)' }}>
          The short version
        </div>
        <Bullets items={t.keyPoints} />
      </Card>

      <div className="mb-8 rounded-xl px-5 py-4 text-[16px] leading-relaxed" style={{ background: 'var(--say-bg)' }}>
        <span className="font-semibold" style={{ color: 'var(--say)' }}>
          Remember:{' '}
        </span>
        <Rich text={t.remember} />
      </div>

      {t.task ? (
        <div
          className="mb-8 rounded-xl border-l-[3px] px-5 py-4 text-[15.5px] leading-relaxed"
          style={{ background: 'var(--surface-2)', borderLeftColor: 'var(--accent)' }}
        >
          <div className="mb-1.5 text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--accent)' }}>
            Build this before moving on
          </div>
          <Rich text={t.task} />
        </div>
      ) : null}

      {t.exercises?.length ? (
        <div className="mb-8">
          <div
            className="mb-2.5 text-[11px] font-bold tracking-[0.07em] uppercase"
            style={{ color: 'var(--faint)' }}
          >
            Then try these in your own editor
          </div>
          <Exercises items={t.exercises} />
        </div>
      ) : null}

      {t.refs?.length ? (
        <div className="mb-8">
          <div className="mb-2 text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--faint)' }}>
            Official documentation
          </div>
          <ul className="space-y-1.5">
            {t.refs.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[14.5px] font-medium hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  {r.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-8">
        <MarkRead id={`lang:${l.id}:${slug}`} label="this topic" />
      </div>

      {section && l.quizzes?.some((q) => q.id === section.id) ? (
        <Link
          href={`/languages/${l.id}/quiz/${section.id}`}
          className="mb-8 flex items-center gap-3 rounded-xl px-5 py-4 transition hover:-translate-y-px"
          style={{ background: 'var(--accent-soft)' }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--accent)' }}>
              Check yourself
            </span>
            <span className="block text-[14.5px] font-semibold">
              Take the {section.name} test
            </span>
          </span>
          <span style={{ color: 'var(--accent)' }} aria-hidden>
            →
          </span>
        </Link>
      ) : null}

      <nav className="flex items-stretch justify-between gap-3 border-t pt-6" aria-label="Topic order">
        {prev ? (
          <Link
            href={`/languages/${l.id}/${prev.slug}`}
            className="card flex min-w-0 flex-1 items-center gap-3 p-4 transition hover:-translate-y-px"
          >
            <span style={{ color: 'var(--accent)' }} aria-hidden>
              ←
            </span>
            <span className="min-w-0">
              <span className="block text-[11.5px]" style={{ color: 'var(--faint)' }}>
                Previous
              </span>
              <span className="block truncate text-[14px] font-semibold">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/languages/${l.id}/${next.slug}`}
            className="card flex min-w-0 flex-1 items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-px"
          >
            <span className="min-w-0">
              <span className="block text-[11.5px]" style={{ color: 'var(--faint)' }}>
                Next
              </span>
              <span className="block truncate text-[14px] font-semibold">{next.title}</span>
            </span>
            <span style={{ color: 'var(--accent)' }} aria-hidden>
              →
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </Page>
  )
}
