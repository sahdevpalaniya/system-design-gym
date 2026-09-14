import Link from 'next/link'
import { LESSONS } from '@/content/system-design/foundations'
import { PATH } from '@/content/system-design/concepts'
import { getConcept } from '@/content/system-design/concepts'
import { Card, Page, PageHeader } from '@/components/common/ui'

export default function LearnPage() {
  return (
    <Page wide>
      <PageHeader
        eyebrow="Start from scratch"
        title="Learn system design from nothing"
        lede="No prior knowledge assumed. Read these five in order, then work through the topics one at a time. Every topic has a **View more** deep dive and a worked example at the end."
      />

      <section className="mb-12">
        <h2 className="mb-1 text-[1.25rem] font-bold tracking-[-0.01em]">First, the ground floor</h2>
        <p className="mb-5 text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
          Five short lessons. After these, nothing on the topic pages will be a word you have never met.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LESSONS.map((l, i) => (
            <Card key={l.slug} href={`/learn/${l.slug}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[0.75rem] font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                <h3 className="text-[1rem] font-semibold">{l.title}</h3>
              </div>
              <p className="text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {l.oneLine}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-[1.25rem] font-bold tracking-[-0.01em]">Then, the topics in order</h2>
        <p className="mb-5 text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
          Grouped so each stage builds on the last. You can jump around, but this order assumes the least.
        </p>
        <div className="space-y-6">
          {PATH.filter((s) => s.concepts?.length).map((stage, si) => (
            <div key={stage.id}>
              <div className="mb-1 flex items-baseline gap-2.5">
                <span className="tabular text-[0.75rem] font-bold" style={{ color: 'var(--accent)' }}>
                  {String(si + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[1.125rem] font-semibold">{stage.name}</h3>
              </div>
              <p className="mb-3 text-[0.875rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {stage.blurb}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(stage.concepts ?? []).map((slug) => {
                  const c = getConcept(slug)
                  if (!c) return null
                  return (
                    <Link
                      key={slug}
                      href={`/concepts/${slug}`}
                      className="card p-3.5 transition hover:-translate-y-px"
                    >
                      <div className="text-[0.9062rem] leading-snug font-semibold">{c.title}</div>
                      <div className="mt-1 text-[0.7812rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {c.oneLine}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Page>
  )
}
