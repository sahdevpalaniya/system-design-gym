import { llmsFullText } from '@/lib/llms-full'

export const dynamic = 'force-static'

/**
 * llms-full.txt: the full text of the indexed pages as Markdown, the companion
 * of /llms.txt (the index). Built from the page content, see lib/llms-full.ts.
 */
export function GET() {
  return new Response(llmsFullText(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
