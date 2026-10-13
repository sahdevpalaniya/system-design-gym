import { LANGUAGES } from '@/content/languages'
import { Card, Page, PageHeader, Prose } from '@/components/common/ui'

export default function LanguagesPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Languages"
        title="Learn a language properly"
        lede="One topic at a time, starting from nothing. Each track builds toward real projects instead of a pile of small exercises."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGES.map((l) => (
          <Card key={l.id} href={`/languages/${l.id}`}>
            <div className="mb-1.5 flex items-baseline gap-2">
              <h2 className="text-[1.125rem] font-bold">{l.name}</h2>
              <span className="tabular text-[0.75rem]" style={{ color: 'var(--faint)' }}>
                {l.lessons.length} topics
              </span>
            </div>
            <p className="text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {l.tagline}
            </p>
          </Card>
        ))}
      </div>
      <section aria-label="How the courses work" className="mt-10 max-w-3xl border-t pt-6">
        <h2 className="mb-3 text-[1rem] font-semibold">How the courses work</h2>
        <Prose
          className="text-[0.9062rem]"
          paragraphs={[
            'Each course is split into sections that build on each other, and each section into short topics. A topic explains one idea with runnable examples, and some end in a graded coding challenge.',
            `Sections have their own multiple-choice tests, where every answer is explained. ${LANGUAGES.map((l) => `${l.name}: ${l.sections.length} sections, ${l.lessons.length} topics, ${(l.quizzes ?? []).length} tests`).join('; ')}.`,
          ]}
        />
      </section>
    </Page>
  )
}
