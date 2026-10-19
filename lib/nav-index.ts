import 'server-only'
import { CONCEPTS, PATH } from '@/content/system-design/concepts'
import { LESSONS } from '@/content/system-design/foundations'
import { GROUPS } from '@/content/system-design/method'
import { PROBLEMS } from '@/content/system-design/problems'
import { ARCHETYPES } from '@/content/system-design/archetypes'
import { COMPANIES } from '@/content/system-design/companies'
import { LANGUAGES } from '@/content/languages'
import { TRACKS, type Track } from '@/content/tracks'
import { hasDeepDive } from '@/content/system-design/deep'

/**
 * The slim shape the sidebar, footer and dashboard need: slugs and titles
 * only. Built on the server and passed to client components, so the full
 * course content never ships in the shared JS bundle. Marked server-only:
 * client components may `import type` from here, never import a value.
 */
export interface NavLink {
  slug: string
  title: string
  navTitle?: string
}

export interface NavIndex {
  tracks: Track[]
  lessons: NavLink[]
  concepts: (NavLink & { deep: boolean })[]
  path: { id: string; name: string; concepts: string[] }[]
  groups: { id: string; name: string }[]
  problems: (NavLink & { group: string })[]
  companies: { id: string; name: string }[]
  archetypes: { id: string; name: string }[]
  languages: {
    id: string
    name: string
    hasQuizzes: boolean
    lessons: NavLink[]
    sections: { id: string; name: string; lessons: string[] }[]
  }[]
}

const link = (x: { slug: string; title: string; navTitle?: string }): NavLink =>
  x.navTitle ? { slug: x.slug, title: x.title, navTitle: x.navTitle } : { slug: x.slug, title: x.title }

export function buildNavIndex(): NavIndex {
  return {
    tracks: TRACKS,
    lessons: LESSONS.map(link),
    concepts: CONCEPTS.map((c) => ({ ...link(c), deep: hasDeepDive(c.slug) })),
    path: PATH.filter((st) => st.concepts?.length).map((st) => ({
      id: st.id,
      name: st.name,
      concepts: st.concepts ?? [],
    })),
    groups: GROUPS.map((g) => ({ id: g.id, name: g.name })),
    problems: PROBLEMS.map((p) => ({ ...link(p), group: p.group })),
    companies: COMPANIES.map((co) => ({ id: co.id, name: co.name })),
    archetypes: ARCHETYPES.map((a) => ({ id: a.id, name: a.name })),
    languages: LANGUAGES.map((l) => ({
      id: l.id,
      name: l.name,
      hasQuizzes: Boolean(l.quizzes?.length),
      lessons: l.lessons.map(link),
      sections: l.sections.map((s) => ({ id: s.id, name: s.name, lessons: s.lessons })),
    })),
  }
}

export interface SearchRow {
  title: string
  sub: string
  href: string
  group: string
  /** lowercase haystack, built once */
  hay: string
}

/** Every searchable page. Served as /search-index.json and fetched only when
 *  someone opens the search box. */
export function buildSearchRows(): SearchRow[] {
  return [
    ...LANGUAGES.flatMap((l) =>
      l.lessons.map((t) => ({
        title: t.title,
        sub: t.oneLine,
        href: `/languages/${l.id}/${t.slug}`,
        group: l.name,
        hay: `${t.title} ${t.oneLine} ${t.blocks.map((b) => b.heading ?? '').join(' ')}`.toLowerCase(),
      })),
    ),
    ...LESSONS.map((l) => ({
      title: l.title,
      sub: l.oneLine,
      href: `/learn/${l.slug}`,
      group: 'System Design · basics',
      hay: `${l.title} ${l.oneLine}`.toLowerCase(),
    })),
    ...CONCEPTS.map((c) => ({
      title: c.title,
      sub: c.oneLine,
      href: `/concepts/${c.slug}`,
      group: 'System Design · concepts',
      hay: `${c.title} ${c.oneLine}`.toLowerCase(),
    })),
    ...PROBLEMS.map((p) => ({
      title: p.title,
      sub: p.prompt,
      href: `/problems/${p.slug}`,
      group: 'System Design · problems',
      hay: `${p.title} ${p.prompt} ${p.concepts.join(' ')}`.toLowerCase(),
    })),
  ]
}
