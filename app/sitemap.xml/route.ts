import { sitemapIndexXml, xmlResponse } from '@/lib/sitemap'

export const dynamic = 'force-static'

/** The sitemap index Search Console and robots.txt point at. See lib/sitemap.ts. */
export function GET() {
  return xmlResponse(sitemapIndexXml())
}
