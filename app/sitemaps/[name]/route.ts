import { notFound } from 'next/navigation'
import { sectionSitemapXml, xmlResponse } from '@/lib/sitemap'
import { SITEMAP_SECTIONS, type SitemapSection } from '@/lib/sitemap-routes'

export const dynamic = 'force-static'
export const dynamicParams = false

/** One child sitemap per section: /sitemaps/concepts.xml, /sitemaps/go-lessons.xml, … */
export function generateStaticParams() {
  return SITEMAP_SECTIONS.map((s) => ({ name: `${s}.xml` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const section = name.replace(/\.xml$/, '') as SitemapSection
  if (!name.endsWith('.xml') || !SITEMAP_SECTIONS.includes(section)) notFound()
  return xmlResponse(sectionSitemapXml(section))
}
