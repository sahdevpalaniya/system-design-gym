import type { MetadataRoute } from 'next'
import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LESSONS } from '@/content/system-design/foundations'
import { ARCHETYPES } from '@/content/system-design/archetypes'
import { COMPANIES } from '@/content/system-design/companies'
import { DEEP_DIVES } from '@/content/system-design/deep'
import { SITE_URL } from '@/lib/seo'

/** Static System Design routes worth indexing. Excludes /admin, /progress and
 *  the language track, which robots.ts also disallows. */
const STATIC = [
  '/',
  '/learn',
  '/concepts',
  '/problems',
  '/solutions',
  '/archetypes',
  '/company',
  '/map',
  '/revise',
  '/drills',
  '/practice',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const at = (path: string, priority: number) => ({ url: `${SITE_URL}${path}`, lastModified, priority })

  return [
    ...STATIC.map((p) =>
      at(p, p === '/' ? 1 : ['/about', '/privacy', '/terms', '/contact'].includes(p) ? 0.3 : 0.7),
    ),
    ...LESSONS.map((l) => at(`/learn/${l.slug}`, 0.8)),
    ...CONCEPTS.map((c) => at(`/concepts/${c.slug}`, 0.8)),
    ...Object.keys(DEEP_DIVES).map((s) => at(`/concepts/${s}/deep`, 0.6)),
    ...PROBLEMS.flatMap((p) => [at(`/problems/${p.slug}`, 0.9), at(`/problems/${p.slug}/solution`, 0.8)]),
    ...ARCHETYPES.map((a) => at(`/archetypes/${a.id}`, 0.5)),
    ...COMPANIES.map((c) => at(`/company/${c.id}`, 0.6)),
  ]
}
