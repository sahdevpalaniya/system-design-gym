import type { MetadataRoute } from 'next'
import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LESSONS } from '@/content/system-design/foundations'
import { ARCHETYPES } from '@/content/system-design/archetypes'
import { COMPANIES, COMPANY_QUESTIONS } from '@/content/system-design/companies'
import { DEEP_DIVES } from '@/content/system-design/deep'
import { SITE_URL } from '@/lib/seo'
import { CONTENT_MODIFIED } from '@/lib/content-dates'
import { LANGUAGES } from '@/content/languages'

/** Static System Design routes worth indexing. Excludes /admin and /progress,
 *  which robots.ts also disallows. Language tracks are added below. */
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
  // the content date, not the build date: a lastmod that changes on every
  // deploy tells Google every page changed, and it learns to ignore it
  const lastModified = new Date(CONTENT_MODIFIED)
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
    ...COMPANY_QUESTIONS.map((q) => at(`/company/${q.company}/${q.id}`, 0.6)),
    ...['check', 'daily', 'mock', 'blitz'].map((t) => at(`/practice/${t}`, 0.6)),
    at('/languages', 0.5),
    ...LANGUAGES.flatMap((l) => [
      at(`/languages/${l.id}`, 0.9),
      at(`/languages/${l.id}/revise`, 0.6),
      ...(l.quizzes?.length ? [at(`/languages/${l.id}/quiz`, 0.6)] : []),
      ...(l.quizzes ?? []).map((q) => at(`/languages/${l.id}/quiz/${q.id}`, 0.5)),
      ...l.sections.map((sec) => at(`/languages/${l.id}/topics/${sec.id}`, 0.7)),
      ...l.lessons.map((t) => at(`/languages/${l.id}/${t.slug}`, 0.8)),
    ]),
  ]
}
