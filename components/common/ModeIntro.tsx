import { Prose } from '@/components/common/ui'

/**
 * Server-rendered "how this works" copy for a practice page whose interactive part
 * only builds in the browser, so the static HTML explains the mode before it
 * hydrates.
 *
 * Prefer `inPage`: render it inside the page's <Page>, in every branch including
 * the Suspense fallback (which is all the static HTML contains), so the copy sits
 * in <main> where crawlers and reviewers look for the content. Without `inPage` it
 * draws its own outer padding, for use from a layout below the page.
 */
export function ModeIntro({ paragraphs, inPage = false }: { paragraphs: string[]; inPage?: boolean }) {
  const body = (
    <>
      <h2 className="mb-3 text-[1rem] font-semibold">How this works</h2>
      <Prose paragraphs={paragraphs} className="text-[0.9062rem]" />
    </>
  )
  if (inPage)
    return (
      <section aria-label="How this works" className="mt-12 max-w-3xl border-t pt-6">
        {body}
      </section>
    )
  return (
    <section aria-label="How this works" className="w-full px-5 pb-16 sm:px-8 lg:pl-10">
      <div className="max-w-3xl border-t pt-6">{body}</div>
    </section>
  )
}
