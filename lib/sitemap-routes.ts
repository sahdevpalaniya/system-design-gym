import { CONCEPTS } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LESSONS } from '@/content/system-design/foundations'
import { GUIDES } from '@/content/system-design/guides'
import { ARCHETYPES } from '@/content/system-design/archetypes'
import { COMPANIES, COMPANY_QUESTIONS } from '@/content/system-design/companies'
import { DEEP_DIVES } from '@/content/system-design/deep'
import { LANGUAGES } from '@/content/languages'
import { isNoindexPath } from '@/lib/noindex'
import { SECTION_HUB_TARGET } from '@/lib/redirects'

/**
 * Every URL the sitemap lists, grouped into the child sitemaps it is split
 * into, with the files its content comes from. Shared by app/sitemap.xml (which
 * publishes it) and scripts/content-dates.ts (which dates it from git), so the
 * two cannot drift apart.
 *
 * Left out on purpose: /admin and /api (blocked in robots.ts), /progress and
 * /practice/blank (personal, noindex), and the mixed final Go test (noindex,
 * because it repeats every question from the section tests word for word),
 * plus everything matched by lib/noindex.ts (tools, quizzes, roll-ups, hubs).
 */

/** One child sitemap each, so Search Console reports indexing per section. */
export const SITEMAP_SECTIONS = ['pages', 'concepts', 'problems', 'companies', 'go-lessons', 'go-projects'] as const
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number]

/**
 * Where a page's content lives. A string is a file path from the repo root. An
 * object means "the file in `dir` that declares `slug: '<key>'` or `id: '<key>'`",
 * resolved by the dates script so content can move between files freely.
 */
export type Source = string | { dir: string; key: string }

export interface SitemapRoute {
  path: string
  section: SitemapSection
  priority: number
  sources: Source[]
}

/** Go sections that are hands-on projects rather than topic lessons. */
const GO_PROJECT_SECTIONS = new Set(['practice', 'project-shortener', 'project-expenses', 'project-shop'])

/** The quiz set left out of the sitemap (and marked noindex on its page). */
export const UNINDEXED_QUIZ_SETS = new Set(['all'])

const page = (route: string) => `app${route === '/' ? '' : route}/page.tsx`

export function sitemapRoutes(): SitemapRoute[] {
  const r: SitemapRoute[] = []
  // noindexed pages (lib/noindex.ts) never go in the sitemap
  const add = (path: string, section: SitemapSection, priority: number, sources: Source[]) => {
    if (!isNoindexPath(path)) r.push({ path, section, priority, sources })
  }

  // hubs and site pages
  add('/', 'pages', 1, ['app/page.tsx', 'app/dashboard.tsx'])
  for (const p of ['/learn', '/concepts', '/cheat-sheet', '/problems', '/archetypes', '/company', '/revise', '/drills', '/practice'])
    add(p, 'pages', 0.7, [page(p)])
  for (const p of ['/about', '/changelog', '/privacy', '/terms', '/contact']) add(p, 'pages', 0.3, [page(p)])
  for (const l of LESSONS) add(`/learn/${l.slug}`, 'pages', 0.8, ['content/system-design/foundations.ts'])
  for (const g of GUIDES) add(`/learn/${g.slug}`, 'pages', 0.8, ['content/system-design/guides.ts'])
  for (const t of ['check', 'daily', 'mock', 'blitz'])
    add(`/practice/${t}`, 'pages', 0.6, [page(`/practice/${t}`), `app/practice/${t}/layout.tsx`])

  // system design concepts, with their "view more" deep dives
  // (the in-depth material is a section of the concept page itself)
  for (const c of CONCEPTS)
    add(`/concepts/${c.slug}`, 'concepts', 0.8, [
      { dir: 'content/system-design/concepts', key: c.slug },
      ...(c.slug in DEEP_DIVES ? [{ dir: 'content/system-design/deep', key: c.slug }] : []),
    ])

  // system design problems and their solutions
  for (const p of PROBLEMS) {
    const src: Source[] = [`content/system-design/problems/${p.slug}.ts`]
    add(`/problems/${p.slug}`, 'problems', 0.9, src)
    add(`/problems/${p.slug}/solution`, 'problems', 0.8, src)
  }

  // company pages
  for (const c of COMPANIES) add(`/company/${c.id}`, 'companies', 0.6, ['content/system-design/companies.ts'])
  for (const q of COMPANY_QUESTIONS) // merged questions are excluded already
    add(`/company/${q.company}/${q.id}`, 'companies', 0.6, ['content/system-design/companies.ts'])

  // language tracks
  for (const l of LANGUAGES) {
    const dir = `content/${l.id === 'go' ? 'golang' : l.id}`
    const lessonSrc = (slug: string): Source => ({ dir, key: slug })
    add(`/languages/${l.id}`, 'go-lessons', 0.9, [`${dir}/index.ts`])
    add(`/languages/${l.id}/revise`, 'go-lessons', 0.6, [`${dir}/index.ts`, 'app/languages/[lang]/revise/page.tsx'])
    if (l.quizzes?.length) {
      add(`/languages/${l.id}/quiz`, 'go-lessons', 0.6, [`${dir}/quiz.ts`])
      for (const q of l.quizzes)
        if (!UNINDEXED_QUIZ_SETS.has(q.id)) add(`/languages/${l.id}/quiz/${q.id}`, 'go-lessons', 0.5, [`${dir}/quiz.ts`])
    }
    for (const sec of l.sections) {
      const section: SitemapSection = GO_PROJECT_SECTIONS.has(sec.id) ? 'go-projects' : 'go-lessons'
      // a section hub shows its lessons' objectives, so it changes when they do;
      // project hubs redirect to their first lesson and are not listed
      if (!(sec.id in SECTION_HUB_TARGET)) add(`/languages/${l.id}/topics/${sec.id}`, section, 0.7, [
        'app/languages/[lang]/topics/[section]/page.tsx',
        ...sec.lessons.map(lessonSrc),
      ])
      for (const slug of sec.lessons) add(`/languages/${l.id}/${slug}`, section, 0.8, [lessonSrc(slug)])
    }
  }
  return r
}
