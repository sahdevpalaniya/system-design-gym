/**
 * Pages merged into a fuller page, each with a permanent (HTTP 301) redirect.
 * Plain data with no imports, so next.config.ts can read it and a test can
 * check that no internal link still points at an old address.
 */

/** Go section hubs that were only a list of lessons; the first lesson of the
 *  section already introduces it, so the hub sends readers there. */
export const SECTION_HUB_TARGET: Record<string, string> = {
  practice: 'project-layouts',
  'project-shortener': 'shortener-overview',
  'project-expenses': 'expenses-overview',
  'project-shop': 'shop-overview',
}

/** Go lessons folded into a fuller lesson: old slug -> new slug. */
export const MERGED_LESSONS: Record<string, string> = {
  packages: 'packages-in-code',
}

/** Company questions that were the same design as a main problem. */
export const MERGED_COMPANY_QUESTIONS: Record<string, { company: string; problem: string }> = {
  'g-typeahead': { company: 'google', problem: 'typeahead' },
  'g-crawler': { company: 'google', problem: 'web-crawler' },
  'a-notification': { company: 'amazon', problem: 'notification-system' },
  'm-newsfeed': { company: 'meta', problem: 'social-timeline' },
  'n-video': { company: 'netflix', problem: 'video-platform' },
  'u-matching': { company: 'uber', problem: 'ride-matching' },
}

export interface Redirect {
  source: string
  destination: string
  statusCode: 301
}

export const REDIRECTS: Redirect[] = [
  // the in-depth material is now a section of the concept page
  { source: '/concepts/:slug/deep', destination: '/concepts/:slug', statusCode: 301 },
  { source: '/solutions', destination: '/problems', statusCode: 301 },
  // six interviewer pages became one guide
  { source: '/archetypes/:id', destination: '/archetypes', statusCode: 301 },
  { source: '/map', destination: '/learn', statusCode: 301 },
  { source: '/languages', destination: '/languages/go', statusCode: 301 },
  ...Object.entries(MERGED_LESSONS).map(([from, to]) => ({
    source: `/languages/go/${from}`,
    destination: `/languages/go/${to}`,
    statusCode: 301 as const,
  })),
  ...Object.entries(SECTION_HUB_TARGET).map(([sec, lesson]) => ({
    source: `/languages/go/topics/${sec}`,
    destination: `/languages/go/${lesson}`,
    statusCode: 301 as const,
  })),
  ...Object.entries(MERGED_COMPANY_QUESTIONS).map(([qid, t]) => ({
    source: `/company/${t.company}/${qid}`,
    destination: `/problems/${t.problem}/solution`,
    statusCode: 301 as const,
  })),
]

/** True when `path` is the source of one of the redirects above. */
export function isRedirected(path: string): boolean {
  const p = path.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  return REDIRECTS.some((r) => new RegExp(`^${r.source.replace(/:[a-z]+/g, '[^/]+')}$`).test(p))
}

/** Where a Go section's overview link should point. */
export function sectionHref(lang: string, sectionId: string): string {
  const lesson = SECTION_HUB_TARGET[sectionId]
  return lesson ? `/languages/${lang}/${lesson}` : `/languages/${lang}/topics/${sectionId}`
}
