import Link from 'next/link'
import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LESSONS } from '@/content/system-design/foundations'
import { STAGES } from '@/content/system-design/method'
import { Page } from '@/components/common/ui'
import { TRACKS, trackList } from '@/content/tracks'
import { Newsletter } from '@/components/common/Newsletter'
import { LANGUAGES } from '@/content/languages'
import { Dashboard } from './dashboard'

/** Per track, the lessons with the most search demand (from Search Console and
 *  keyword research), linked straight from the home page. Unknown slugs are skipped. */
const POPULAR: Record<string, string[]> = {
  go: [
    'goroutines-vs-threads',
    'go-interview-questions',
    'goroutines',
    'channels-and-select',
    'context',
    'mutex-and-races',
    'interfaces',
    'http-server',
  ],
}

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
          Learn {trackList()} by writing your own answer first
        </h1>
        <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Every track here works the same way: a short explanation in plain English, then you write your
          own answer or code before you see ours. The gap between the two is where the learning happens.
          Free, no sign-in needed, and your progress is saved as you go.
        </p>
        <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          For system design interviews in particular: most material is a catalogue of components. You finish it knowing more words
          and still freeze when someone says &ldquo;design a ride-hailing app&rdquo;. What is usually
          missing is not the components. It is the order you make decisions in, and the habit of saying
          what each one costs. That is what this site drills.
        </p>

        {/* pick a goal: a newcomer is one click from doing something, rather
            than facing the whole sidebar. Language tracks come from the
            registry, so a new track gets its own start card here. */}
        <h2 className="mt-8 mb-3 text-[1.0625rem] font-semibold">Where do you want to start?</h2>
        <div className="grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: '/problems/url-shortener',
              title: 'Try one problem now',
              text: '10 minutes, no sign-in. Answer first, then compare with a worked answer.',
              primary: true,
            },
            {
              href: '/practice/daily',
              title: 'Interview soon?',
              text: 'A 15-minute daily rep: one problem, requirements and numbers only.',
            },
            {
              href: '/learn/what-is-system-design',
              title: 'New to system design',
              text: `Start at lesson 1. ${LESSONS.length} short lessons, then ${CONCEPTS.length} topics in order.`,
            },
            ...TRACKS.slice(1).map((t) => ({
              href: t.href,
              title: `Learn ${t.name}${t.alias && t.alias !== t.name ? ` (${t.alias})` : ''}`,
              text: 'From your first program, with examples you can run and challenges checked by tests.',
            })),
            {
              href: '/problems',
              title: `All ${PROBLEMS.length} problems`,
              text: 'URL shortener, chat, news feed, ride-hailing, ticket booking and more.',
            },
          ].map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="card block p-4 transition hover:opacity-90"
              style={g.primary ? { borderColor: 'var(--accent)', borderWidth: 2 } : undefined}
            >
              <div className="text-[0.9688rem] font-semibold" style={{ color: g.primary ? 'var(--accent)' : undefined }}>
                {g.title} →
              </div>
              <div className="mt-1 text-[0.8438rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {g.text}
              </div>
            </Link>
          ))}
        </div>

        <div className="max-w-2xl">
          <Newsletter />
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

        {/* each language track's map, from its own data: one link per section
            hub, plus the lessons people search for most. Without this the home
            page, the strongest page on the site, reached a track only through
            its first lesson. */}
        {LANGUAGES.map((lang) => {
          const popular = (POPULAR[lang.id] ?? [])
            .map((slug) => lang.lessons.find((t) => t.slug === slug))
            .filter((t) => t !== undefined)
          return (
            <div key={lang.id} className="mt-10">
              <h2 className="mb-1 text-[1.0625rem] font-semibold">
                <Link href={`/languages/${lang.id}`} className="hover:opacity-70">
                  Learn {lang.name}
                  {lang.alias && lang.alias !== lang.name ? ` (${lang.alias})` : ''}: {lang.lessons.length} lessons in{' '}
                  {lang.sections.length} sections
                </Link>
              </h2>
              <p className="mb-4 max-w-2xl text-[0.9062rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {lang.tagline} Every lesson has examples you can run in the browser, and the coding-round
                lessons come with challenges checked by real tests.
              </p>
              <ul className="grid max-w-4xl gap-x-6 gap-y-1.5 text-[0.9062rem] sm:grid-cols-2 lg:grid-cols-3">
                {lang.sections.map((s) => (
                  <li key={s.id}>
                    <Link href={`/languages/${lang.id}/topics/${s.id}`} className="hover:opacity-70" style={{ color: 'var(--accent)' }}>
                      {s.name}
                    </Link>{' '}
                    <span style={{ color: 'var(--faint)' }}>· {s.lessons.length}</span>
                  </li>
                ))}
              </ul>
              {popular.length ? (
                <>
                  <h3 className="mt-5 mb-2 text-[0.9375rem] font-semibold">Most read</h3>
                  <ul className="grid max-w-4xl gap-x-6 gap-y-1.5 text-[0.9062rem] sm:grid-cols-2">
                    {popular.map((t) => (
                      <li key={t.slug}>
                        <Link href={`/languages/${lang.id}/${t.slug}`} className="hover:opacity-70" style={{ color: 'var(--accent)' }}>
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )
        })}

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
