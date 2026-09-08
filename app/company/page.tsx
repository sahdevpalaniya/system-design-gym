import Link from 'next/link'
import { COMPANIES, COMPANY_QUESTIONS, questionsFor } from '@/content/system-design/companies'
import { getArchetype } from '@/content/system-design/archetypes'
import { Badge, Card, Page, PageHeader } from '@/components/common/ui'

export default function CompanyIndex() {
  return (
    <Page wide>
      <PageHeader
        eyebrow="Practice · company questions"
        title="Company-wise practice"
        lede="Real questions in the style each company actually asks. You write your answer first; **hints are available one at a time** if you get stuck, and the model answer only unlocks after you submit."
        meta={
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            {COMPANY_QUESTIONS.length} questions across {COMPANIES.length} companies
          </span>
        }
      />

      <div
        className="mb-8 rounded-xl border px-5 py-4 text-[14.5px] leading-relaxed"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        <strong style={{ color: 'var(--text)' }}>A warning about company-specific prep.</strong>{' '}
        Learning &ldquo;the answer Google wants&rdquo; falls apart the moment an interviewer goes off
        script. What actually transfers is recognising the <em>style</em> of the round — what this
        company pushes on, and which axis they weight. That is what these pages teach. The core
        curriculum stays deliberately company-agnostic.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {COMPANIES.map((co) => {
          const qs = questionsFor(co.id)
          const arch = getArchetype(co.archetype)
          return (
            <Card key={co.id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <Link href={`/company/${co.id}`} className="hover:opacity-70">
                  <h2 className="text-[19px] font-bold tracking-[-0.01em]">{co.name}</h2>
                </Link>
                <Badge>{qs.length} question{qs.length === 1 ? '' : 's'}</Badge>
              </div>
              <p className="mb-3 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {co.style}
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                <Badge tone="accent">{co.weights}</Badge>
                {arch ? <Badge>Closest archetype: {arch.name}</Badge> : null}
              </div>
              <div className="space-y-1.5 border-t pt-3">
                {qs.map((q) => (
                  <Link
                    key={q.id}
                    href={`/company/${co.id}/${q.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[14px] transition hover:opacity-70"
                  >
                    <span className="font-medium">{q.title}</span>
                    <Badge tone={q.difficulty === 'hard' ? 'bad' : 'accent'}>{q.difficulty}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </Page>
  )
}
