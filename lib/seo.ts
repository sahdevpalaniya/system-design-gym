import type { Metadata } from 'next'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.devskills.in'

/** AdSense publisher id (ca-pub-XXXXXXXXXXXXXXXX). Unset, no ad code, ads.txt
 *  or advertising section in the privacy policy is emitted at all. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

/** Appended to every page title by the root layout's template. Pages pass a
 *  plain string title (see pageMeta) so the template reaches them. */
export const SITE_NAME = 'Dev Skills'

export const TITLE_TEMPLATE = `%s · ${SITE_NAME}`

/** Trim to a length search results will actually show, without cutting a word. */
function clamp(text: string, max = 155): string {
  const s = text.replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  return s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '') + '…'
}

/**
 * Per-page title, description and canonical. Every indexable page gets one.
 *
 * `absolute` drops the " · Dev Skills" suffix. Worth doing when the title is
 * already carrying its target keyword: a search result truncates around 60
 * characters, and on a new domain the keyword earns the click, not the brand.
 */
export function pageMeta(
  title: string,
  description: string,
  path: string,
  absolute = false,
): Metadata {
  const d = clamp(description)
  return {
    // a plain string, so the nearest ancestor's template (the root's
    // TITLE_TEMPLATE) appends the brand. An object here would set this page's
    // own template, which Next applies only to children, never to the page
    // itself, and the suffix silently disappeared.
    title: absolute ? { absolute: title } : title,
    description: d,
    alternates: { canonical: path },
    // every field is repeated on purpose: declaring openGraph on a nested route
    // REPLACES the parent's object rather than merging into it, so anything
    // left out here is simply absent from the page
    openGraph: {
      title,
      description: d,
      url: path,
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_GB',
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
  }
}

/** FAQPage JSON-LD — the concept Q&A pairs are already in this shape. */
export function faqJsonLd(qa: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/**
 * Article schema. Evergreen content still needs dates — without them Google has
 * no way to judge freshness, and a 2019-looking page loses to a 2026-looking one
 * on the same query.
 */
export function articleJsonLd(a: {
  headline: string
  description: string
  path: string
  published: string
  modified?: string
  section?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: a.headline,
    description: a.description,
    url: `${SITE_URL}${a.path}`,
    datePublished: a.published,
    dateModified: a.modified ?? a.published,
    articleSection: a.section,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${a.path}` },
  }
}

/** Site-wide identity, on every page: who publishes this and what the site is.
 *  No SearchAction, because search is client-side and has no results URL. */
export const SITE_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en',
    description: 'System design interview preparation and a Go (Golang) course, with runnable examples.',
  },
]

/** Course schema for a language track, so it can show as a course result. */
export function courseJsonLd(c: { name: string; description: string; path: string; topics: number; minutes: number }) {
  const plain = c.description.replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.name,
    description: plain,
    url: `${SITE_URL}${c.path}`,
    inLanguage: 'en',
    isAccessibleForFree: true,
    educationalLevel: 'Beginner',
    numberOfLessons: c.topics,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free', availability: 'https://schema.org/InStock' },
    // from the same reading + practice estimate the track page shows
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: `PT${Math.max(1, Math.round(c.minutes / 60))}H` },
  }
}

/** Breadcrumbs, so a result shows "Concepts › Caching" instead of a bare URL. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  }
}

/**
 * Tag an outbound link so the destination's analytics can attribute the visit
 * back to us. Note this reports *to them* — it does nothing for our own SEO.
 */
export function withUtm(href: string, medium = 'concept', campaign = 'system-design'): string {
  try {
    const u = new URL(href)
    u.searchParams.set('utm_source', 'devskills')
    u.searchParams.set('utm_medium', medium)
    u.searchParams.set('utm_campaign', campaign)
    return u.toString()
  } catch {
    return href
  }
}

/**
 * A topic name that reads correctly mid-sentence, so headings can say
 * "When to use caching, and when not to" while leaving DNS, CDNs, SQL vs NoSQL
 * and WebSockets with the capitals they are supposed to have.
 */
export function subject(title: string): string {
  const [first, ...rest] = title.split(' ')
  const plainWord = /^[A-Z][a-z]+(-[a-z]+)*[,:]?$/.test(first)
  return [plainWord ? first.toLowerCase() : first, ...rest].join(' ')
}
