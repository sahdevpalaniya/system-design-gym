import { Button, Card, Page, PageHeader } from '@/components/common/ui'
import { TRACKS } from '@/content/tracks'

export const metadata = { title: 'Page not found', robots: { index: false } }

export default function NotFound() {
  return (
    <Page>
      <PageHeader
        eyebrow="404"
        title="This page does not exist"
        lede="The link may be old, or the address mistyped. Use the search at the top of the page, or pick a track below."
      />
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {TRACKS.map((t) => (
          <Card key={t.id}>
            <div className="mb-3 text-[0.9688rem] font-semibold">
              {t.name}
              {t.alias && t.alias !== t.name ? ` (${t.alias})` : ''}
            </div>
            <Button href={t.href} variant="secondary" size="sm">
              Start {t.name} →
            </Button>
          </Card>
        ))}
      </div>
      <Button href="/">Go to the home page</Button>
    </Page>
  )
}
