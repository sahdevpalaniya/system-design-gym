import { Prose } from '@/components/common/ui'

/**
 * Server-rendered "how this works" copy under a client-only practice page, so the
 * static HTML explains the mode before the interactive part hydrates.
 */
export function ModeIntro({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section aria-label="How this works" className="w-full px-5 pb-16 sm:px-8 lg:pl-10">
      <div className="max-w-3xl border-t pt-6">
        <h2 className="mb-3 text-[1rem] font-semibold">How this works</h2>
        <Prose paragraphs={paragraphs} className="text-[0.9062rem]" />
      </div>
    </section>
  )
}
