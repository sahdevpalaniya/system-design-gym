import { LANGUAGES } from '@/content/languages'
import { Card, Page, PageHeader } from '@/components/common/ui'

export default function LanguagesPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Languages"
        title="Learn a language properly"
        lede="One topic at a time, starting from nothing. Each track ends with one real project instead of a pile of small exercises."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGES.map((l) => (
          <Card key={l.id} href={`/languages/${l.id}`}>
            <div className="mb-1.5 flex items-baseline gap-2">
              <h2 className="text-[17px] font-bold">{l.name}</h2>
              <span className="tabular text-[12px]" style={{ color: 'var(--faint)' }}>
                {l.lessons.length} topics
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {l.tagline}
            </p>
          </Card>
        ))}
      </div>
    </Page>
  )
}
