import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/** Not ready to be indexed: admin, the language track, and personal or
 *  JavaScript-only pages that would be empty in a search result. */
const DISALLOW = ['/admin', '/api', '/languages', '/progress', '/practice/blank']

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
    host: SITE_URL,
  }
}
