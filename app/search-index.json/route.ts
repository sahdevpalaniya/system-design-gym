import { buildSearchRows } from '@/lib/nav-index'

export const dynamic = 'force-static'

/** The header search box's data, fetched on first use instead of being
 *  bundled into every page's JavaScript. */
export function GET() {
  return Response.json(buildSearchRows(), { headers: { 'X-Robots-Tag': 'noindex' } })
}
