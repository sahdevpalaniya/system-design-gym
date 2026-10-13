'use client'

import { useEffect } from 'react'
import { Button, Page, PageHeader } from '@/components/common/ui'

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Page>
      <PageHeader
        eyebrow="Error"
        title="Something went wrong on this page"
        lede="Your progress is saved in your browser and is not affected. Try again, or go back to the home page."
      />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button href="/" variant="secondary">
          Go to the home page
        </Button>
      </div>
    </Page>
  )
}
