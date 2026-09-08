import Link from 'next/link'
import { PROBLEMS } from '@/content/system-design/problems'
import { GROUPS } from '@/content/system-design/method'
import { Badge, Card, Page, PageHeader } from '@/components/common/ui'
import { Callout } from '@/components/common/visuals'

export const metadata = {
  title: 'Worked solutions — Dev Learning',
  description:
    'Every practice problem answered end to end, the way you would say it in an interview.',
}

export default function SolutionsPage() {
  return (
    <Page wide>
      <PageHeader
        eyebrow="Worked solutions"
        title="What a good answer actually looks like"
        lede="Every problem, answered start to finish in the order you would say it out loud — requirements, lifecycle, numbers, design, tradeoffs, and the follow-ups that come after. Written for someone who has never seen one of these before."
      />

      <Callout variant="trap">
        <strong>These work best second.</strong> Reading a good answer builds recognition — you will
        nod along and feel like you have learned it. Producing one on a blank page is a different
        skill, and it is the one being tested. Try the problem first, then come here and compare.
      </Callout>

      <div className="space-y-8">
        {GROUPS.map((g) => {
          const list = PROBLEMS.filter((p) => p.group === g.id)
          if (!list.length) return null
          return (
            <section key={g.id}>
              <h2 className="mb-1 text-[17px] font-semibold">{g.name}</h2>
              <p className="mb-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {g.shape}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <Card key={p.slug} href={`/problems/${p.slug}/solution`}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="text-[15.5px] leading-snug font-semibold">{p.title}</h3>
                      <Badge
                        tone={p.difficulty === 'hard' ? 'bad' : p.difficulty === 'core' ? 'accent' : 'neutral'}
                      >
                        {p.difficulty}
                      </Badge>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {p.slack.headline}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-12 border-t pt-6">
        <p className="text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          When you are ready to produce one instead of read one:{' '}
          <Link href="/practice/blank" className="font-semibold" style={{ color: 'var(--accent)' }}>
            the blank page and whiteboard →
          </Link>
        </p>
      </div>
    </Page>
  )
}
