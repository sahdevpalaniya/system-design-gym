import Link from 'next/link'
import { PATH, getConcept } from '@/content/system-design/concepts'
import { STAGES } from '@/content/system-design/method'
import { Byline, ReviewedLine } from '@/components/common/Byline'
import { Page, PageHeader, Rich, Section } from '@/components/common/ui'
import { articleJsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { pageDates } from '@/lib/content-dates'

export const metadata = pageMeta(
  'System design cheat sheet: numbers, patterns and tradeoffs',
  'A one-page system design cheat sheet: the interview stages, the numbers to remember, which pattern fixes which problem, and every core concept in one line.',
  '/cheat-sheet',
  true,
)

/* Symptom → the tool that fixes it → what it costs. Hand-written, because the
   mapping is the judgement; everything below it is generated from the concepts. */
const PICKS: { need: string; use: string[]; cost: string }[] = [
  { need: 'Reads far outnumber writes', use: ['caching', 'replication'], cost: 'Stale data; you own invalidation and replica lag.' },
  { need: 'Static files or media for users far away', use: ['cdn', 'object-storage'], cost: 'Purging is slow; private content needs signed URLs.' },
  { need: 'One machine cannot hold the data or the writes', use: ['partitioning', 'consistent-hashing'], cost: 'Cross-shard queries and transactions get hard; hot keys still exist.' },
  { need: 'Spread traffic over many servers', use: ['load-balancing'], cost: 'Servers must be stateless, or sessions must live elsewhere.' },
  { need: 'The database refuses connections or times out while idle', use: ['connection-pooling'], cost: 'A full pool queues requests; size it, and time out the wait.' },
  { need: 'A slow query on a large table', use: ['indexes'], cost: 'Every index slows writes and takes space.' },
  { need: 'Slow or bursty work that the user need not wait for', use: ['message-queues'], cost: 'Eventual results, retries, and duplicates to handle.' },
  { need: 'Retries must not charge or create twice', use: ['idempotency'], cost: 'A key store, and a third outcome: unknown.' },
  { need: 'Protect a service from abuse or overload', use: ['rate-limiting', 'circuit-breakers'], cost: 'Some legitimate requests get rejected.' },
  { need: 'Push updates to clients as they happen', use: ['realtime-transports'], cost: 'Long-lived connections are stateful and hard to balance.' },
  { need: 'One write must update many feeds or followers', use: ['fan-out'], cost: 'Push is write-heavy for celebrities; pull is read-heavy for everyone.' },
  { need: 'Full-text or nearby-location search', use: ['search-indexing', 'geospatial-indexing'], cost: 'A second store that lags behind the source of truth.' },
  { need: 'Keep other systems in sync with the database', use: ['change-data-capture', 'distributed-transactions'], cost: 'Ordering, replays and schema changes to manage.' },
  { need: 'Count something huge, approximately or fast', use: ['distributed-counter', 'bloom-filters'], cost: 'Approximate answers or delayed totals.' },
]

/* Orders of magnitude, not benchmarks: what matters is the ratio between rows. */
const NUMBERS: [string, string][] = [
  ['Read from main memory', '~100 ns'],
  ['Random read from an SSD', '~100 µs'],
  ['Round trip inside one data centre', '~0.5 ms'],
  ['Round trip across a continent', '~50–100 ms'],
  ['Round trip between continents', '~150 ms'],
  ['Seconds in a day', '86,400 ≈ 10⁵'],
  ['1 million requests a day', '≈ 12 per second on average'],
  ['1 KB × 1 million a day for a year', '≈ 365 GB'],
]

const firstSentence = (s: string) => s.match(/^[^.!?]+[.!?]/)?.[0] ?? s

export default function CheatSheetPage() {
  const stages = PATH.filter((s) => s.concepts?.length)
  return (
    <Page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'System design cheat sheet', path: '/cheat-sheet' },
            ]),
            articleJsonLd({
              headline: 'System design cheat sheet',
              description: 'The interview stages, key numbers, which pattern fixes which problem, and every core concept in one line.',
              path: '/cheat-sheet',
              ...pageDates('/cheat-sheet'),
              section: 'System design',
            }),
          ]),
        }}
      />
      <PageHeader
        eyebrow="Cheat sheet"
        title="System design cheat sheet"
        lede="Everything on one page for the last hour before an interview: how to run the hour, the numbers to know, which pattern fixes which problem, and the price of each. Every row links to the full explanation."
      />
      <ReviewedLine path={"/cheat-sheet"} />

      <Section n="1" title="How to run the interview">
        <ol className="space-y-3">
          {STAGES.map((s) => (
            <li key={s.id} className="text-[0.9375rem] leading-relaxed">
              <strong>
                {s.id}. {s.name}
              </strong>{' '}
              <span style={{ color: 'var(--faint)' }}>({s.minutes} min)</span> — <Rich text={s.ask} />
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          The full method, with examples: <Link href="/learn/the-five-stages" style={{ color: 'var(--accent)' }}>the five stages</Link>.
        </p>
      </Section>

      <Section n="2" title="Numbers worth knowing">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.875rem]">
            <tbody>
              {NUMBERS.map(([k, v]) => (
                <tr key={k} className="border-b">
                  <td className="py-2 pr-4">{k}</td>
                  <td className="tabular py-2 font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          Why these matter and how to use them: <Link href="/concepts/latency-numbers" style={{ color: 'var(--accent)' }}>latency numbers</Link> and{' '}
          <Link href="/concepts/back-of-envelope" style={{ color: 'var(--accent)' }}>back-of-envelope estimation</Link>.
        </p>
      </Section>

      <Section n="3" title="Which pattern for which problem">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.875rem]">
            <thead>
              <tr className="border-b" style={{ color: 'var(--faint)' }}>
                <th className="py-2 pr-4 font-semibold">When you need to…</th>
                <th className="py-2 pr-4 font-semibold">Reach for</th>
                <th className="py-2 font-semibold">What it costs</th>
              </tr>
            </thead>
            <tbody>
              {PICKS.map((p) => (
                <tr key={p.need} className="border-b align-top">
                  <td className="py-2 pr-4">{p.need}</td>
                  <td className="py-2 pr-4">
                    {p.use.map((slug, i) => {
                      const c = getConcept(slug)
                      return c ? (
                        <span key={slug}>
                          {i ? ', ' : ''}
                          <Link href={`/concepts/${slug}`} style={{ color: 'var(--accent)' }}>
                            {c.navTitle ?? c.title}
                          </Link>
                        </span>
                      ) : null
                    })}
                  </td>
                  <td className="py-2" style={{ color: 'var(--muted)' }}>
                    {p.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n="4" title="Every concept in one line">
        {stages.map((s) => (
          <div key={s.id} className="mb-8">
            <h3 className="mb-3 text-[1rem] font-semibold">{s.name}</h3>
            <ul className="space-y-3">
              {s.concepts!.map((slug) => {
                const c = getConcept(slug)
                if (!c) return null
                return (
                  <li key={slug} className="text-[0.9375rem] leading-relaxed">
                    <Link href={`/concepts/${slug}`} className="font-semibold" style={{ color: 'var(--accent)' }}>
                      {c.navTitle ?? c.title}
                    </Link>{' '}
                    — <Rich text={c.oneLine} />{' '}
                    <span style={{ color: 'var(--muted)' }}>
                      Cost: <Rich text={firstSentence(c.cost)} />
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        <p className="text-[0.875rem]" style={{ color: 'var(--muted)' }}>
          Want to test yourself rather than read? <Link href="/revise" style={{ color: 'var(--accent)' }}>Revise</Link> tracks what you have
          covered, and the <Link href="/problems" style={{ color: 'var(--accent)' }}>practice problems</Link> make you use all of this at once.
        </p>
      </Section>

      <Byline title="System design cheat sheet" path="/cheat-sheet" />
    </Page>
  )
}
