import type { Metadata } from 'next'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devlearning-app.vercel.app'

/** Appended to every page title. Each page re-declares it so that nesting a
 *  titled layout (e.g. /concepts) does not strip the suffix from its children. */
export const TITLE_TEMPLATE = '%s · Dev Learning'

/** Trim to a length search results will actually show, without cutting a word. */
function clamp(text: string, max = 155): string {
  const s = text.replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  return s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '') + '…'
}

/**
 * Per-page title, description and canonical. Every indexable page gets one.
 *
 * `absolute` drops the " · Dev Learning" suffix. Worth doing when the title is
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
    title: absolute ? { absolute: title } : { default: title, template: TITLE_TEMPLATE },
    description: d,
    alternates: { canonical: path },
    // the images are repeated on purpose: declaring openGraph on a nested route
    // replaces the parent's object, so leaving them out drops the social card
    openGraph: {
      title,
      description: d,
      url: path,
      type: 'article',
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
    author: { '@type': 'Person', name: 'Dev Learning' },
    publisher: { '@type': 'Organization', name: 'Dev Learning', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${a.path}` },
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
    u.searchParams.set('utm_source', 'devlearning')
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
