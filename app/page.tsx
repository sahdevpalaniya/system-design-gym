import Link from 'next/link'
import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LESSONS } from '@/content/system-design/foundations'
import { STAGES } from '@/content/system-design/method'
import { Page } from '@/components/common/ui'
import { Dashboard } from './dashboard'

/**
 * The introduction is a server component on purpose. The dashboard below it is
 * personal, so it can only render once local progress has loaded — which used
 * to mean the prerendered home page was nothing but "Loading your progress…".
 * Everything that explains what this site is now renders without JavaScript.
 */
export default function Home() {
  return (
    <Page wide>
      <section className="mb-12">
        <h1 className="max-w-3xl text-[1.75rem] leading-tight font-bold tracking-[-0.015em] sm:text-[2.125rem]">
          System design interview preparation that makes you answer first
        </h1>
        <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Most system design material is a catalogue of components. You finish it knowing more words
          and still freeze when someone says &ldquo;design a ride-hailing app&rdquo;. What is usually
          missing is not the components. It is the order you make decisions in, and the habit of saying
          what each one costs. That is what this site drills.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/learn/what-is-system-design"
            className="rounded-lg px-5 py-2.5 text-[0.9375rem] font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Start from the beginning →
          </Link>
          <Link
            href="/problems"
            className="card px-5 py-2.5 text-[0.9375rem] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            Jump to the {PROBLEMS.length} problems
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="mb-1 text-[1.0625rem] font-semibold">The method, five stages, every time</h2>
          <p className="mb-4 max-w-2xl text-[0.9062rem]" style={{ color: 'var(--muted)' }}>
            Stages 1 to 3 take about a third of your time, and they are what make everything after
            them defensible. Every problem on this site is worked in this order.
          </p>
          <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => (
              <li key={s.id} className="card p-4">
                <div
                  className="mb-1 text-[0.6875rem] font-bold tracking-[0.07em] uppercase"
                  style={{ color: 'var(--accent)' }}
                >
                  Stage {s.id}
                </div>
                <div className="text-[0.9375rem] font-semibold">{s.name}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10">
          <h2 className="mb-1 text-[1.0625rem] font-semibold">How to use it</h2>
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Every topic and every problem asks you to write your own answer before it shows you ours.
            That gap, between what you wrote and what you read, is where the learning happens.
            If you are stuck, take a hint: each one is a question to ask yourself, never the answer,
            and you can take every hint and still have to write something yourself. The{' '}
            <Link href="/learn" className="font-medium" style={{ color: 'var(--accent)' }}>
              {LESSONS.length} foundation lessons
            </Link>{' '}
            and{' '}
            <Link href="/concepts" className="font-medium" style={{ color: 'var(--accent)' }}>
              {CONCEPTS.length} topics
            </Link>{' '}
            are ordered as a dependency chain (caching before CDNs, replication before partitioning),
            so reading top to bottom never asks you to assume something you have not met.
          </p>
        </div>
      </section>

      <Dashboard />
    </Page>
  )
}
