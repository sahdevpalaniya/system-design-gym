/**
 * Significant content changes, newest first, taken from the site's git
 * history (`git log --date=short`). Only changes a reader would notice are
 * listed: new pages, rewrites, corrections and merges, not styling or
 * infrastructure. Add an entry when you ship one.
 */
export interface ChangelogEntry {
  date: string // YYYY-MM-DD, the commit date
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-10-27',
    items: [
      'Merged thin pages into fuller ones: each concept’s in-depth material is now a section of the concept page, the six interviewer types are one [interviewer guide](/archetypes), and company questions that repeated a main problem now appear as “How companies ask this one” on that problem’s worked solution. Old addresses redirect.',
      'Rewrote the titles of 61 Go lessons and 29 concept pages so each says what that page covers.',
      'Practice tools, quizzes and revision roll-ups stay available but are no longer listed for search engines.',
      'Worked examples added to [The five stages](/learn/the-five-stages) and [Where’s the slack?](/learn/where-is-the-slack); fuller model answers for the Amazon flash sale and Microsoft collaborative editor questions; runnable examples, pitfalls and complexity tables added to the Go lessons on constants and iota, valid parentheses, cycle detection, sliding windows and the final interview checklist; the concepts index now shows what each concept costs and the order to read them in.',
      'Added this changelog, an editorial and AI-use policy on the [about page](/about), and a “Last reviewed” date at the top of lessons.',
    ],
  },
  {
    date: '2026-10-26',
    items: [
      'New concept pages: API gateway vs load balancer vs reverse proxy, cache write strategies, Redis vs Memcached, isolation levels, and optimistic vs pessimistic locking.',
      'New Go lessons: worker pools, the sync package, mutex vs RWMutex, and interview questions for experienced developers. New problem: a distributed message queue.',
      'Added answers to commonly searched questions on existing concept pages.',
      'Model answers on problem pages are now part of the page rather than loaded afterwards, and each problem has an introduction.',
    ],
  },
  {
    date: '2026-10-24',
    items: ['New interview guides in the Learn section, and title fixes across the site.'],
  },
  {
    date: '2026-10-20',
    items: ['Revision pages show their answers in the page, and every quiz set is linked from its section.'],
  },
  {
    date: '2026-10-19',
    items: [
      'Added the [system design cheat sheet](/cheat-sheet).',
      'Expanded the connection pooling concept, the company pages, the practice modes and the Go topic overviews.',
    ],
  },
  {
    date: '2026-10-13',
    items: [
      'Accuracy pass: current Go install and go.mod versions, and corrected wording on AfterFunc, write-through caching, Retry-After, consistent hashing, semi-synchronous replication and queues.',
      'Company questions now link to their related problem, worked solution and concepts.',
      'Improved ten Go and system design pages that readers were searching for.',
    ],
  },
  {
    date: '2026-10-12',
    items: [
      'Launched the Go track: reviewed lessons, runnable examples, and coding challenges checked by tests.',
      'The site was renamed Dev Skills, matching the domain.',
    ],
  },
  {
    date: '2026-09-29',
    items: ['Copy-edited all learning content and fixed technical errors found in review.'],
  },
  {
    date: '2026-09-28',
    items: ['Added the privacy policy, terms and contact pages.'],
  },
  {
    date: '2026-09-08',
    items: [
      'Rewrote the content in plain English and filled coverage gaps in the concepts.',
      'Added a worked solution for every problem, and a whiteboard for the blank-page practice mode.',
      'Started the Go track.',
    ],
  },
  {
    date: '2026-09-07',
    items: ['First version: the five-stage system design method, concepts in learning order, practice problems and company-style questions.'],
  },
]
