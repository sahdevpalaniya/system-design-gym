'use client'

import Link from 'next/link'
import { ARCHETYPES } from '@/content/system-design/archetypes'
import { CATEGORY_INFO } from '@/content/system-design/followups'
import { useProgress } from '@/lib/store'
import { AXIS_LABEL, type Axis } from '@/lib/types'
import { Badge, Button, Card, Page, PageHeader } from '@/components/common/ui'

export default function ArchetypesPage() {
  const { state, setArchetype, ready } = useProgress()

  return (
    <Page wide>
      <PageHeader
        eyebrow="Track C"
        title="Interview archetypes"
        lede="Not company pages — six **styles of interviewer**, described by behaviour. Pick one and the app changes which follow-up questions fire and how the rubric is weighted."
      />

      <div
        className="mb-8 rounded-xl border px-5 py-4 text-[14.5px] leading-relaxed"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        Learning &ldquo;the answer a particular company wants&rdquo; falls apart the moment an interviewer goes off
        script. Learning to recognise <em>how someone is testing you</em> works everywhere — and the same design
        gets graded very differently by a Cost Auditor and a Scale Breaker.
      </div>

      {ready && state.archetype ? (
        <div
          className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-4"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}
        >
          <div className="text-[14.5px]">
            <strong>Currently practising against: </strong>
            {ARCHETYPES.find((a) => a.id === state.archetype)?.name}. Problem pages and drills will lean toward
            their style.
          </div>
          <Button variant="secondary" size="sm" onClick={() => setArchetype(null)}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {ARCHETYPES.map((a) => {
          const active = ready && state.archetype === a.id
          const topAxis = (Object.entries(a.weights).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0]?.[0] ??
            'design') as Axis
          return (
            <Card key={a.id} className={active ? 'ring-1' : ''}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <Link href={`/archetypes/${a.id}`} className="hover:opacity-70">
                  <h2 className="text-[18px] font-bold tracking-[-0.01em]">{a.name}</h2>
                </Link>
                {active ? <Badge tone="accent">Selected</Badge> : null}
              </div>
              <p className="mb-4 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {a.tagline}
              </p>

              <div className="mb-4 flex flex-wrap gap-1.5">
                <Badge tone="accent">Weights {AXIS_LABEL[topAxis]} most</Badge>
                {a.categories.slice(0, 2).map((c) => (
                  <Badge key={c}>{CATEGORY_INFO[c].name}</Badge>
                ))}
              </div>

              <div className="mb-4 rounded-lg px-3.5 py-3" style={{ background: 'var(--trap-bg)' }}>
                <div className="mb-1 text-[11px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--trap)' }}>
                  A failing answer here
                </div>
                <p className="text-[13.5px] leading-relaxed">{a.failing[0]}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button href={`/archetypes/${a.id}`} variant="secondary" size="sm">
                  Read and drill →
                </Button>
                <Button
                  size="sm"
                  variant={active ? 'ghost' : 'primary'}
                  onClick={() => setArchetype(active ? null : a.id)}
                >
                  {active ? 'Stop practising against them' : 'Practise against them'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </Page>
  )
}
