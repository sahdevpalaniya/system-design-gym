import { Card, Page, PageHeader } from '@/components/common/ui'
import Link from 'next/link'

import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  'Practice modes — daily reps to timed mocks',
  'Four ways to practise system design: a 15-minute daily rep, a 45-minute timed mock, a 10-minute follow-up blitz, and a blank page.',
  '/practice',
)

const MODES = [
  {
    href: '/practice/daily',
    name: 'Daily Rep',
    minutes: '15 min',
    tag: 'The default',
    body: 'One problem, stages 1 and 2 only — requirements and lifecycle. Never a full design. Small and daily beats long and rare. Requirements is also the stage people rush past, which is why it gets its own practice.',
  },
  {
    href: '/practice/mock',
    name: 'Timed Mock',
    minutes: '45 min',
    tag: 'The real thing',
    body: 'All five stages with phase timers, a follow-up question at the end, and nothing revealed until you finish. Then a report card. It is the only timed mode longer than fifteen minutes.',
  },
  {
    href: '/practice/blitz',
    name: 'Follow-up Blitz',
    minutes: '10 min',
    tag: 'Defence',
    body: 'Rapid-fire defence drills. Ninety seconds each, then weak answer, strong answer, and the trap. This is the mode that moves the Defence axis, which is easy to neglect when you practise alone.',
  },
  {
    href: '/practice/check',
    name: 'Concept Check',
    minutes: '5 min',
    tag: 'Spaced repetition',
    body: 'Concepts resurface on a schedule based on how you rated yourself. It asks for the cost, never the definition, because the cost is what interviewers press on.',
  },
  {
    href: '/practice/blank',
    name: 'Blank Page',
    minutes: 'Untimed',
    tag: 'Final week',
    body: 'An empty canvas with the five-stage scaffold and nothing else. No nudges, no model answer, no checklist. For the last week before an interview, when you need to know you can produce it from nothing.',
  },
]

export default function PracticePage() {
  return (
    <Page wide>
      <PageHeader
        eyebrow="Practice modes"
        title="How do you want to work today?"
        lede="Apart from the mock and the untimed blank page, nothing here takes more than fifteen minutes. **A short daily session beats an occasional long one.**"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {MODES.map((m, i) => (
          <Link
            key={m.href}
            href={m.href}
            className={`card block p-6 transition hover:-translate-y-px ${i === 0 ? 'md:col-span-2' : ''}`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[0.7188rem] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
                {m.tag}
              </span>
              <span className="text-[0.75rem]" style={{ color: 'var(--faint)' }}>
                · {m.minutes}
              </span>
            </div>
            <h2 className="text-[1.25rem] font-bold tracking-[-0.01em]">{m.name}</h2>
            <p className="mt-2 max-w-2xl text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {m.body}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <Card>
          <h2 className="mb-3 text-[1.125rem] font-semibold">The five stages, in case you want them cold</h2>
          <ol className="space-y-3">
            {[
              ['Requirements', 'State assumptions, ask one or two questions that change a box, propose the scope yourself.'],
              ['Actors and lifecycle', 'Who touches it (including the system itself), then the main thing\'s life as a chain of states, with the failure branches.'],
              ['Numbers', 'Requests per second, storage, bandwidth. Then: "so the hard part here is ___."'],
              ['High-level design', 'Boxes and arrows, every box justified by a requirement or a number.'],
              ['Deep dive and tradeoffs', 'The two hardest parts, and after every decision, what it costs.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                <span className="text-[0.9062rem] leading-relaxed">
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
