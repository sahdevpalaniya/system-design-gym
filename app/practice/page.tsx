import { Card, Page, PageHeader } from '@/components/common/ui'
import Link from 'next/link'

const MODES = [
  {
    href: '/practice/daily',
    name: 'Daily Rep',
    minutes: '15 min',
    tag: 'The default',
    body: 'One problem, stages 1 and 2 only — requirements and lifecycle. Never a full design. Small and daily beats long and rare, and requirements is the stage most people are worst at precisely because they rush past it.',
  },
  {
    href: '/practice/mock',
    name: 'Timed Mock',
    minutes: '45 min',
    tag: 'The real thing',
    body: 'All five stages with phase timers, follow-up questions injected at the end, and nothing revealed until you finish. Then a full report card across all six axes. The only thing here that takes over fifteen minutes, deliberately.',
  },
  {
    href: '/practice/blitz',
    name: 'Follow-up Blitz',
    minutes: '10 min',
    tag: 'Defence',
    body: 'Rapid-fire defence drills. Ninety seconds each, then weak answer, strong answer, and the trap. This is the mode that moves the Defence axis, and it is the axis most people never train.',
  },
  {
    href: '/practice/check',
    name: 'Concept Check',
    minutes: '5 min',
    tag: 'Spaced repetition',
    body: 'Concepts resurface on a schedule based on how you rated yourself. Always asks for the cost, never the definition — because knowing what something costs is the part that shows up in interviews.',
  },
  {
    href: '/practice/blank',
    name: 'Blank Page',
    minutes: 'Untimed',
    tag: 'Final week',
    body: 'An empty canvas with just the five-stage scaffold and no help at all. No nudges, no model answer, no checklist. For the last week before an interview, when you need to know you can produce it from nothing.',
  },
]

export default function PracticePage() {
  return (
    <Page wide>
      <PageHeader
        eyebrow="Practice modes"
        title="How do you want to work today?"
        lede="Nothing here takes more than fifteen minutes except the mock, which is meant to. **The daily habit is the product.**"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {MODES.map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            className={`card block p-6 transition hover:-translate-y-px ${i === 0 ? 'md:col-span-2' : ''}`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
                {m.tag}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--faint)' }}>
                · {m.minutes}
              </span>
            </div>
            <h2 className="text-[20px] font-bold tracking-[-0.01em]">{m.name}</h2>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {m.body}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <Card>
          <h2 className="mb-3 text-[17px] font-semibold">The five stages, in case you want them cold</h2>
          <ol className="space-y-3">
            {[
              ['Requirements', 'State assumptions, ask one or two questions that change a box, propose the scope yourself.'],
              ['Actors and lifecycle', 'Who touches it — including the system — then the main thing\'s life as a chain of states, with the failure branches.'],
              ['Numbers', 'Requests per second, storage, bandwidth. Then: "so the hard part here is ___."'],
              ['High-level design', 'Boxes and arrows, every box justified by a requirement or a number.'],
              ['Deep dive and tradeoffs', 'The two hardest parts, and after every decision, what it costs.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                <span className="text-[14.5px] leading-relaxed">
                  <strong>{t}.</strong> <span style={{ color: 'var(--muted)' }}>{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </Page>
  )
}
