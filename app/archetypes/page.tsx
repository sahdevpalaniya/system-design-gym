import { ARCHETYPES } from '@/content/system-design/archetypes'
import { CATEGORY_INFO } from '@/content/system-design/followups'
import { AXES, AXIS_LABEL } from '@/lib/types'
import { Callout } from '@/components/common/visuals'
import { Badge, Bullets, Card, Page, PageHeader, Rich } from '@/components/common/ui'
import { ArchetypeDrill, CurrentArchetype, PractiseButton } from './drill'

/**
 * One guide to all six interviewer styles. Each used to have its own page,
 * which repeated the same structure six times; they are sections here now and
 * the old /archetypes/<id> addresses redirect to this page.
 */

function Marked({ items, ok }: { items: string[]; ok: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((f, i) => (
        <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed">
          <svg className="mt-1 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={ok ? 'var(--ok)' : 'var(--bad)'} strokeWidth="2" aria-hidden>
            {ok ? <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />}
          </svg>
          <span>
            <Rich text={f} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 mb-3 text-[1.0625rem] font-semibold">{children}</h3>
}

export default function ArchetypesPage() {
  const names = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a.name]))
  return (
    <Page>
      <PageHeader
        eyebrow="Interview guide"
        title="System design interviewer types, and how to handle each"
        lede="Six **styles of interviewer**, described by behaviour rather than by company: how each one behaves, what a failing answer looks like under them, how to hold up, how they weight the rubric, and a three-question drill in their voice."
      />

      <div
        className="mb-8 rounded-xl border px-5 py-4 text-[0.9062rem] leading-relaxed"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        Learning &ldquo;the answer a particular company wants&rdquo; falls apart once an interviewer goes off script.
        Learning to recognise <em>how someone is testing you</em> carries over to any interview, and the same design gets
        graded very differently by a Cost Auditor and a Scale Breaker. Most real interviewers are a mix of two of these;
        read all six once, then set the one you find hardest as your practice interviewer.
      </div>

      <CurrentArchetype names={names} />

      <nav aria-label="Interviewer types" className="mb-10">
        <ol className="grid gap-2 sm:grid-cols-2">
          {ARCHETYPES.map((a, i) => (
            <li key={a.id}>
              <a href={`#${a.id}`} className="card block p-3 transition hover:-translate-y-px">
                <span className="text-[0.875rem] font-semibold">
                  {i + 1}. {a.name}
                </span>
                <span className="mt-0.5 block text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
                  {a.tagline}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {ARCHETYPES.map((a, i) => {
        const maxWeight = Math.max(...AXES.map((x) => a.weights[x] ?? 1))
        return (
          <section key={a.id} id={a.id} className="mb-14 scroll-mt-20 border-t pt-8">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="tabular text-[0.8125rem] font-bold" style={{ color: 'var(--accent)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="text-[1.375rem] leading-tight font-bold tracking-[-0.01em]">{a.name}</h2>
            </div>
            <p className="mb-5 text-[0.9375rem]" style={{ color: 'var(--muted)' }}>
              {a.tagline}
            </p>

            <PractiseButton id={a.id} name={a.name} />

            <H3>How they behave</H3>
            <Bullets items={a.behaviour} />

            <H3>What a failing answer looks like</H3>
            <Card>
              <Marked items={a.failing} ok={false} />
            </Card>

            <H3>How to hold up</H3>
            <Card>
              <Marked items={a.surviving} ok />
            </Card>
            <Callout variant="say-this">
              <Rich text={a.sayThis} />
            </Callout>

            <H3>How they weight the rubric</H3>
            <Card>
              <div className="space-y-2.5">
                {AXES.map((axis) => {
                  const w = a.weights[axis] ?? 1
                  return (
                    <div key={axis} className="flex items-center gap-3">
                      <span className="w-[96px] shrink-0 text-[0.8125rem] font-medium">{AXIS_LABEL[axis]}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(w / maxWeight) * 100}%`, background: w >= 1.3 ? 'var(--accent)' : 'var(--border-strong)' }}
                        />
                      </div>
                      <span className="tabular w-11 shrink-0 text-right text-[0.7812rem]" style={{ color: 'var(--muted)' }}>
                        ×{w.toFixed(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <span className="text-[0.8125rem] font-semibold">They reach for:</span>
                {a.categories.map((c) => (
                  <Badge key={c} tone="accent">
                    {CATEGORY_INFO[c].name}
                  </Badge>
                ))}
              </div>
            </Card>

            <H3>Three-question drill, in their voice</H3>
            <p className="mb-4 text-[0.875rem]" style={{ color: 'var(--muted)' }}>
              Same rule as everywhere else: you answer before you see anything.
            </p>
            <ArchetypeDrill archetype={a} />
          </section>
        )
      })}
    </Page>
  )
}
