import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/** Not crawled: admin and the API. Everything else is open, both tracks are in
 *  the sitemap, and personal pages (/progress, /practice/blank) carry `noindex`.
 *  To hide a page from search, give it `noindex` rather than adding it here: a
 *  crawler blocked by robots.txt never fetches the page, so it never sees the
 *  noindex and can still list the bare URL. */
const DISALLOW = [
  '/admin',
  '/api',
  // React Server Component payloads that Next.js fetches when it prefetches a
  // link. Googlebot followed them: in Search Console crawl stats (11–19 Oct
  // 2026) 84% of 8,060 requests were `?_rsc=` URLs, against 7% real pages.
  // Every page's HTML already embeds its own payload, so blocking these does
  // not change how Google renders a page; it only stops the wasted fetches.
  '/*?_rsc=',
  '/*&_rsc=',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },

      // Assistants that cite and link back are a traffic source, so they get
      // the same access as a search crawler. Flip these to disallow if you
      // would rather not appear in AI answers at all.
      { userAgent: 'GPTBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: DISALLOW },
      { userAgent: 'ClaudeBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Claude-Web', allow: '/', disallow: DISALLOW },
      { userAgent: 'PerplexityBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Google-Extended', allow: '/', disallow: DISALLOW },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: DISALLOW },

      // Bulk scrape for training corpora, with no link back. Nothing to gain.
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
