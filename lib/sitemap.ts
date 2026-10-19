import { SITE_URL } from '@/lib/seo'
import { CONTENT_MODIFIED } from '@/lib/content-dates'
import { SITEMAP_SECTIONS, sitemapRoutes, type SitemapSection } from '@/lib/sitemap-routes'
import DATES from '@/lib/content-dates.json'

/**
 * The sitemap, split in two levels: /sitemap.xml is an index of one child
 * sitemap per section (/sitemaps/concepts.xml and so on). Search Console then
 * reports submitted vs indexed per section, which a single 260-URL file hides.
 */

const dates: Record<string, string> = DATES

/** The real last-changed date from lib/content-dates.json; a page added since
 *  the script last ran falls back to the site-wide content date. */
function lastmod(path: string): string {
  return dates[path] ?? CONTENT_MODIFIED
}

export const sitemapUrl = (section: SitemapSection) => `${SITE_URL}/sitemaps/${section}.xml`

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function xmlResponse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}

export function sitemapIndexXml(): string {
  const routes = sitemapRoutes()
  const entries = SITEMAP_SECTIONS.map((s) => {
    // a child sitemap changed when its newest page did
    const newest = routes.filter((r) => r.section === s).map((r) => lastmod(r.path)).sort().at(-1) ?? CONTENT_MODIFIED
    return `<sitemap>\n<loc>${escape(sitemapUrl(s))}</loc>\n<lastmod>${newest}</lastmod>\n</sitemap>`
  })
  return `${XML_HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`
}

export function sectionSitemapXml(section: SitemapSection): string {
  const entries = sitemapRoutes()
    .filter((r) => r.section === section)
    .map(
      (r) =>
        `<url>\n<loc>${escape(`${SITE_URL}${r.path}`)}</loc>\n<lastmod>${lastmod(r.path)}</lastmod>\n<priority>${r.priority}</priority>\n</url>`,
    )
  return `${XML_HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
}
