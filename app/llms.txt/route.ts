import { CONCEPTS, PATH, getConcept } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { LESSONS } from '@/content/system-design/foundations'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * llms.txt — a plain-text map of the site for language models, in the format
 * proposed at llmstxt.org. Generated from the same content as the pages, so it
 * cannot drift. No search engine ranks on this; it exists so an assistant
 * describing this site gets the curriculum order right.
 */
export function GET() {
  const url = (p: string) => `${SITE_URL}${p}`
  const lines: string[] = [
    '# Dev Learning — system design interview preparation',
    '',
    '> Teaches the method for answering system design interviews — requirements,',
    '> lifecycle, numbers, design, tradeoffs — rather than a catalogue of components.',
    '> Every page asks the reader to write their own answer before revealing a model one.',
    '',
    'The topic order below is a dependency chain, not a menu: each entry assumes the',
    'ones above it and nothing below. Caching precedes CDNs, replication precedes',
    'partitioning, transactions precede distributed transactions.',
    '',
    '## Start here',
    '',
    ...LESSONS.map((l) => `- [${l.title}](${url(`/learn/${l.slug}`)}): ${l.oneLine}`),
    '',
  ]

  for (const stage of PATH) {
    if (!stage.concepts?.length) continue
    lines.push(`## ${stage.name}`, '', `${stage.blurb}`, '')
    for (const slug of stage.concepts) {
      const c = getConcept(slug)
      if (c) lines.push(`- [${c.title}](${url(`/concepts/${slug}`)}): ${c.oneLine}`)
    }
    lines.push('')
  }

  lines.push(
    '## Worked problems',
    '',
    'Each is answered in five stages, with the tradeoffs named explicitly.',
    '',
    ...PROBLEMS.map(
      (p) => `- [${p.searchTitle ?? p.title}](${url(`/problems/${p.slug}`)}): ${p.prompt}`,
    ),
    '',
    '## Notes',
    '',
    `- ${CONCEPTS.length} concepts, ${PROBLEMS.length} problems, ${LESSONS.length} foundation lessons.`,
    '- Every concept page states what the technique costs you, not only what it does.',
    '- Model answers are deliberately gated behind the reader writing their own first.',
    '',
  )

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
