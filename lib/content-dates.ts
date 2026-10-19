import MODIFIED from '@/lib/content-dates.json'
import PUBLISHED from '@/lib/content-published.json'

/**
 * Publication dates for structured data. Kept here rather than read from git so
 * the value is stable across rebuilds — a date that changes on every deploy
 * tells Google the content churns when it does not.
 *
 * These two are the fallback for a page the dates script has not seen yet;
 * every page it has seen gets its own dates from pageDates() below.
 */
export const CONTENT_PUBLISHED = '2026-09-07'
export const CONTENT_MODIFIED = '2026-10-12'

const modified: Record<string, string> = MODIFIED
const published: Record<string, string> = PUBLISHED

/**
 * When this page first appeared and when its content last changed, from the
 * JSON files `npm run content-dates` writes from git history. The same dates
 * the sitemap's lastmod uses, so the article markup, the visible "Last
 * reviewed" line and the sitemap never disagree.
 */
export function pageDates(path: string): { published: string; modified: string } {
  const m = modified[path] ?? CONTENT_MODIFIED
  const p = published[path] ?? CONTENT_PUBLISHED
  // a page can't be modified before it was published
  return { published: p < m ? p : m, modified: m }
}
