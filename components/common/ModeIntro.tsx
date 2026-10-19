import { Prose, Rich } from '@/components/common/ui'

/** A titled block of explanation below "How this works". */
export type ModeSection = { heading: string; paragraphs: string[] }
export type ModeFaq = { q: string; a: string }

/**
 * Server-rendered "how this works" copy for a practice page whose interactive part
 * only builds in the browser, so the static HTML explains the mode before it
 * hydrates.
 *
 * Prefer `inPage`: render it inside the page's <Page>, in every branch including
 * the Suspense fallback (which is all the static HTML contains), so the copy sits
 * in <main> where crawlers and reviewers look for the content. Without `inPage` it
 * draws its own outer padding, for use from a layout below the page.
 *
 * `sections` and `faq` carry the rest of the explanation (who the mode is for, a
 * worked example, common questions), so a page that is mostly an interactive
 * tool still says in plain text what it is and how to use it.
 */
export function ModeIntro({
  paragraphs,
  sections = [],
  faq = [],
  inPage = false,
}: {
  paragraphs: string[]
  sections?: ModeSection[]
  faq?: ModeFaq[]
  inPage?: boolean
}) {
  const body = (
    <>
      <h2 className="mb-3 text-[1rem] font-semibold">How this works</h2>
      <Prose paragraphs={paragraphs} className="text-[0.9062rem]" />
      {sections.map((s) => (
        <div key={s.heading} className="mt-8">
          <h2 className="mb-3 text-[1rem] font-semibold">{s.heading}</h2>
          <Prose paragraphs={s.paragraphs} className="text-[0.9062rem]" />
        </div>
      ))}
      {faq.length ? (
        <div className="mt-8">
          <h2 className="mb-3 text-[1rem] font-semibold">Common questions</h2>
          <dl className="space-y-4 text-[0.9062rem] leading-relaxed">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1" style={{ color: 'var(--muted)' }}>
                  <Rich text={f.a} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
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
