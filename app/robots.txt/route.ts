import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

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

/**
 * Content-Signal (Cloudflare Content Signals Policy, an IETF draft): a stated
 * preference about what may be done with content after it is fetched. It does
 * not allow or block anything, crawlers may ignore it, and Google does not act
 * on it. The training answer matches public/ai.txt (reading to answer and cite
 * is fine, training corpora are not).
 */
const SIGNAL_OPEN = 'search=yes, ai-input=yes, ai-train=no'
const SIGNAL_CLOSED = 'search=no, ai-input=no, ai-train=no'

/**
 * Hand-written rather than app/robots.ts because the MetadataRoute.Robots type
 * has no field for Content-Signal lines. The Allow/Disallow rules are the same.
 */
const OPEN_AGENTS = [
  '*',
  // Assistants that cite and link back are a traffic source, so they get
  // the same access as a search crawler. Flip these to disallow if you
  // would rather not appear in AI answers at all.
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
]
// Bulk scrape for training corpora, with no link back. Nothing to gain.
const CLOSED_AGENTS = ['CCBot', 'Bytespider']

export function GET() {
  const groups = [
    ...OPEN_AGENTS.map((ua) =>
      [`User-Agent: ${ua}`, 'Allow: /', ...DISALLOW.map((d) => `Disallow: ${d}`), `Content-Signal: ${SIGNAL_OPEN}`].join('\n'),
    ),
    ...CLOSED_AGENTS.map((ua) => [`User-Agent: ${ua}`, 'Disallow: /', `Content-Signal: ${SIGNAL_CLOSED}`].join('\n')),
  ]
  const body = `${groups.join('\n\n')}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}
