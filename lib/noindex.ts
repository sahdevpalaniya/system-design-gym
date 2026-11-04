/**
 * Pages that stay up for readers but are kept out of search and carry no ad
 * tag: interactive tools (drills, practice modes, the practice workspaces of
 * each problem), quizzes, revision roll-ups that repeat lesson copy, and the Go
 * section hubs that only list lessons. Each one gets `noindex, follow`, is left
 * out of the sitemap, and does not load AdSense.
 *
 * No imports: the AdSense component is a client component and reads this too.
 */

/** Go section hubs that are only a list of their lessons. */
export const NOINDEX_GO_SECTIONS = [
  'basics',
  'core',
  'concurrency',
  'generics',
  'web',
  'tooling',
  'database',
  'production',
  'compare',
  'interview',
  // thin hub: a list of DSA lessons, no copy of its own
  'dsa',
]

/** Individual Go lessons kept out of search (thin or near-duplicate content). */
export const NOINDEX_GO_LESSONS = ['dsa-merge-sorted-lists', 'dsa-reverse-linked-list']

export const NOINDEX_PATTERNS: RegExp[] = [
  /^\/drills\/?$/,
  /^\/practice(\/.*)?$/,
  // the answer workspace of a problem; /problems/<slug>/solution stays indexed
  /^\/problems\/[^/]+\/?$/,
  /^\/revise\/?$/,
  /^\/languages\/[^/]+\/revise\/?$/,
  /^\/languages\/[^/]+\/quiz(\/.*)?$/,
  new RegExp(`^/languages/[^/]+/(${NOINDEX_GO_LESSONS.join('|')})/?$`),
  new RegExp(`^/languages/[^/]+/topics/(${NOINDEX_GO_SECTIONS.join('|')})/?$`),
]

export function isNoindexPath(path: string): boolean {
  return NOINDEX_PATTERNS.some((r) => r.test(path))
}

/** Spread into a page's metadata. */
export const NOINDEX_ROBOTS = { robots: { index: false, follow: true } } as const
