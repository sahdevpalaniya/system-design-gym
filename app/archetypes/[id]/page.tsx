import { notFound } from 'next/navigation'
import { ARCHETYPES, getArchetype } from '@/content/archetypes'
import { CATEGORY_INFO } from '@/content/followups'
import { AXES, AXIS_LABEL, type ArchetypeId } from '@/lib/types'
import { Callout } from '@/components/visuals'
import { ArchetypeDrill, PractiseButton } from './drill'
import { Badge, Bullets, Card, Page, PageHeader, Rich, Section } from '@/components/ui'

export function generateStaticParams() {
  return ARCHETYPES.map((a) => ({ id: a.id }))
}

export default async function ArchetypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = getArchetype(id as ArchetypeId)
  if (!a) notFound()

  const maxWeight = Math.max(...AXES.map((x) => a.weights[x] ?? 1))

  return (
    <Page>
      <PageHeader eyebrow="Interview archetype" title={a.name} lede={a.tagline} />

      <div className="mb-10">
        <PractiseButton id={a.id} name={a.name} />
      </div>

      <Section title="How they behave">
        <Bullets items={a.behaviour} />
      </Section>

      <Section title="What a failing answer looks like under this style">
        <Card>
          <ul className="space-y-3">
            {a.failing.map((f, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <svg
                  className="mt-1 shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="var(--bad)"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
                <span>
                  <Rich text={f} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="How to survive them">
        <Card>
          <ul className="space-y-3">
            {a.surviving.map((f, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <svg
                  className="mt-1 shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="var(--ok)"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  <Rich text={f} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Callout variant="say-this">
          <Rich text={a.sayThis} />
        </Callout>
      </Section>

      <Section title="How they weight the rubric" sub="Same design, graded differently. This is why the archetype changes your score.">
        <Card>
          <div className="space-y-2.5">
            {AXES.map((axis) => {
              const w = a.weights[axis] ?? 1
              const pct = (w / maxWeight) * 100
              return (
                <div key={axis} className="flex items-center gap-3">
                  <span className="w-[96px] shrink-0 text-[13px] font-medium">{AXIS_LABEL[axis]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: w >= 1.3 ? 'var(--accent)' : 'var(--border-strong)' }}
                    />
                  </div>
                  <span className="tabular w-11 shrink-0 text-right text-[12.5px]" style={{ color: 'var(--muted)' }}>
                    ×{w.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
            <span className="text-[13px] font-semibold">They reach for:</span>
            {a.categories.map((c) => (
              <Badge key={c} tone="accent">
                {CATEGORY_INFO[c].name}
              </Badge>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Three-question drill, in their voice" sub="Same rule as everywhere else: you answer before you see anything.">
        <ArchetypeDrill archetype={a} />
      </Section>
    </Page>
  )
}
