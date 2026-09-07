import Link from 'next/link'
import type { DeepDive, DeepSection, WorkedExample } from '@/lib/types'
import { AnimatedFlow, Callout, CompareCards, Diagram, NumbersBar } from './visuals'
import { Bullets, Prose, Rich } from './ui'

function Visual({ visual }: { visual: NonNullable<DeepSection['visuals']>[number] }) {
  if (visual.type === 'diagram' && visual.diagram) return <Diagram spec={visual.diagram} />
  if (visual.type === 'flow' && visual.flow)
    return <AnimatedFlow scenario={visual.flow.scenario} caption={visual.flow.caption} />
  if (visual.type === 'compare' && visual.compare) return <CompareCards spec={visual.compare} />
  if (visual.type === 'numbers' && visual.numbers) return <NumbersBar spec={visual.numbers} />
  return null
}

function Table({ table }: { table: NonNullable<DeepSection['table']> }) {
  return (
    <figure className="my-6">
      <div className="card overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  className="border-b px-4 py-2.5 text-left font-semibold"
                  style={{ color: 'var(--muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="border-b px-4 py-2.5 align-top last:border-0"
                    style={{
                      color: j === 0 ? 'var(--text)' : 'var(--muted)',
                      fontWeight: j === 0 ? 600 : 400,
                    }}
                  >
                    <Rich text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 px-1 text-[13px]" style={{ color: 'var(--faint)' }}>
        {table.caption}
      </figcaption>
    </figure>
  )
}

export function Section({ section, n }: { section: DeepSection; n: number }) {
  return (
    <section id={`s${n}`} className="mb-14 scroll-mt-20">
      <div className="mb-4 flex items-baseline gap-3">
        <span
          className="tabular shrink-0 text-[13px] font-bold"
          style={{ color: 'var(--accent)' }}
        >
          {String(n).padStart(2, '0')}
        </span>
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.01em]">
          {section.heading}
        </h2>
      </div>

      <Prose paragraphs={section.body} />

      {section.points?.length ? (
        <div className="my-5 rounded-xl border-l-2 py-1 pl-4" style={{ borderLeftColor: 'var(--accent-line)' }}>
          <div
            className="mb-2 text-[11px] font-bold tracking-[0.07em] uppercase"
            style={{ color: 'var(--faint)' }}
          >
            In short
          </div>
          <Bullets items={section.points} />
        </div>
      ) : null}

      {section.visuals?.map((v, i) => <Visual key={i} visual={v} />)}
      {section.compare ? <CompareCards spec={section.compare} /> : null}
      {section.table ? <Table table={section.table} /> : null}

      {section.callouts?.map((c, i) => (
        <Callout key={i} variant={c.variant}>
          <Rich text={c.text} />
        </Callout>
      ))}
    </section>
  )
}

export function DeepDiveBody({ deep }: { deep: DeepDive }) {
  return (
    <>
      {/* contents — a long page needs a way in */}
      <nav className="card mb-12 p-5" aria-label="On this page">
        <div
          className="mb-3 text-[11px] font-bold tracking-[0.07em] uppercase"
          style={{ color: 'var(--faint)' }}
        >
          What this covers · {deep.minutes} min read
        </div>
        <ol className="space-y-1.5">
          {deep.sections.map((s, i) => (
            <li key={i}>
              <a
                href={`#s${i + 1}`}
                className="flex gap-3 text-[14px] transition hover:opacity-70"
              >
                <span className="tabular shrink-0" style={{ color: 'var(--accent)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{s.heading}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {deep.sections.map((s, i) => (
        <Section key={i} section={s} n={i + 1} />
      ))}
    </>
  )
}

export function WorkedExampleBlock({ example }: { example: WorkedExample }) {
  return (
    <section className="border-t pt-10">
      <div
        className="mb-2 text-[12px] font-bold tracking-[0.06em] uppercase"
        style={{ color: 'var(--accent)' }}
      >
        Worked example
      </div>
      <h2 className="mb-3 text-[22px] font-bold tracking-[-0.01em]">{example.title}</h2>
      <p className="prose mb-6 text-[16px]">
        <Rich text={example.scenario} />
      </p>

      <ol className="mb-6 space-y-4">
        {example.steps.map((s, i) => (
          <li key={i} className="flex gap-4">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="mb-1 text-[15px] font-semibold">{s.step}</div>
              <p className="prose text-[15px]" style={{ color: 'var(--muted)' }}>
                <Rich text={s.detail} />
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div
        className="rounded-xl px-5 py-4 text-[15px] leading-relaxed"
        style={{ background: 'var(--say-bg)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--say)' }}>
          Result:{' '}
        </span>
        <Rich text={example.outcome} />
      </div>

      {example.problemSlug ? (
        <div className="mt-5">
          <Link
            href={`/problems/${example.problemSlug}`}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[14.5px] font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Now try the whole problem yourself →
          </Link>
        </div>
      ) : null}
    </section>
  )
}
