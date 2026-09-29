import { ADSENSE_CLIENT } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * ads.txt — declares Google as the only seller authorised to sell this site's
 * ad space. AdSense flags a site without one ("Earnings at risk"). Google's
 * certification-authority id f08c47fec0942fa0 is the same for every publisher.
 */
export function GET() {
  if (!ADSENSE_CLIENT) return new Response('Not found', { status: 404 })
  return new Response(`google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
