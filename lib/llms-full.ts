import { CONCEPTS, getConcept } from '@/content/system-design/concepts'
import { PROBLEMS } from '@/content/system-design/problems'
import { getDeepDive, getExample } from '@/content/system-design/deep'
import { LANGUAGES, getLanguage } from '@/content/languages'
import { sitemapRoutes } from '@/lib/sitemap-routes'
import { SITE_URL } from '@/lib/seo'
import type { LangBlock } from '@/lib/types'

/**
 * llms-full.txt: the full text of the pages that are indexed, as one Markdown
 * file, for tools that want the content without crawling every page.
 *
 * Built from the same content modules as the pages and filtered through
 * sitemapRoutes(), so a noindexed page (problem workspaces, quizzes, section
 * hubs) can never appear here: a path is included only if it is in the sitemap.
 * Model answers appear only for problems whose /solution page is indexed.
 */

const url = (p: string) => `${SITE_URL}${p}`
const list = (items: string[]) => items.map((i) => `- ${i}`)
const table = (headers: string[], rows: string[][]) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((r) => `| ${r.map((c) => c.replace(/\|/g, '\|')).join(' | ')} |`),
]

function conceptSection(slug: string): string[] {
  const c = getConcept(slug)
  if (!c) return []
  const out: string[] = [`## ${c.heading ?? c.title}`, '', `Source: ${url(`/concepts/${slug}`)}`, '', c.oneLine, '']
  out.push('### The problem it solves', '', ...c.problem.flatMap((p) => [p, '']))
  if (c.body?.length) out.push(...c.body.flatMap((p) => [p, '']))
  out.push('### What it costs', '', c.cost, '')
  out.push('### Use it when', '', ...list(c.useWhen), '', '### Avoid it when', '', ...list(c.avoidWhen), '')
  if (c.table) out.push(`${c.table.caption}`, '', ...table(c.table.headers, c.table.rows), '')
  for (const e of c.examples ?? []) out.push(`${e.label}${e.note ? `: ${e.note}` : ''}`, '', '```', e.src, '```', '')
  if (c.traps?.length) out.push('### Common traps', '', ...list(c.traps), '')
  out.push('### Follow-up question', '', `Q: ${c.followUp.q}`, '', `A: ${c.followUp.answer}`, '')
  out.push('### Self-check', '', `Q: ${c.selfCheck.q}`, '', `A: ${c.selfCheck.answer}`, '')
  if (c.faq?.length) out.push('### FAQ', '', ...c.faq.flatMap((f) => [`Q: ${f.q}`, '', `A: ${f.a}`, '']))

  const deep = getDeepDive(slug)
  if (deep) {
    out.push('### In depth', '', deep.intro, '')
    for (const s of deep.sections) {
      out.push(`#### ${s.heading}`, '', ...s.body.flatMap((p) => [p, '']))
      if (s.points?.length) out.push(...list(s.points), '')
      if (s.table) out.push(s.table.caption, '', ...table(s.table.headers, s.table.rows), '')
      for (const k of s.callouts ?? []) out.push(`${k.variant}: ${k.text}`, '')
    }
  }
  const ex = getExample(slug)
  if (ex) {
    out.push(`### Worked example: ${ex.title}`, '', ex.scenario, '')
    out.push(...ex.steps.map((s, i) => `${i + 1}. ${s.step}: ${s.detail}`), '', ex.outcome, '')
  }
  return out
}

function solutionSection(slug: string): string[] {
  const p = PROBLEMS.find((x) => x.slug === slug)
  if (!p) return []
  const out: string[] = [
    `## ${p.solutionHeading ?? p.searchTitle ?? p.title}`,
    '',
    `Source: ${url(`/problems/${slug}/solution`)}`,
    '',
    p.prompt,
    '',
    '### Where is the slack?',
    '',
    p.slack.budget,
    '',
    p.slack.headline,
    '',
    ...p.slack.body.flatMap((x) => [x, '']),
    p.slack.consequence,
    '',
  ]
  for (const s of p.stages) {
    out.push(`### Stage ${s.id}`, '', s.ask, '', ...s.model.flatMap((m) => [m, '']))
    if (s.tradeoffs?.length) out.push(...list(s.tradeoffs.map((t) => `${t.decision} costs: ${t.cost}`)), '')
  }
  return out
}

function blockLines(b: LangBlock): string[] {
  const out: string[] = []
  if (b.heading) out.push(`#### ${b.heading}`, '')
  if (b.body) out.push(...b.body.flatMap((x) => [x, '']))
  if (b.bullets) out.push(...list(b.bullets), '')
  if (b.table) out.push(...table(b.table.headers, b.table.rows), '')
  if (b.callout) out.push(`${b.callout.tone}: ${b.callout.text}`, '')
  if (b.code) out.push(...(b.code.label ? [b.code.label, ''] : []), '```go', b.code.src, '```', ...(b.code.note ? ['', b.code.note] : []), '')
  return out
}

function lessonSection(langId: string, slug: string): string[] {
  const l = getLanguage(langId)?.lessons.find((x) => x.slug === slug)
  if (!l) return []
  const out: string[] = [`## ${l.title}`, '', `Source: ${url(`/languages/${langId}/${slug}`)}`, '', l.oneLine, '']
  if (l.objectives?.length) out.push('### Objectives', '', ...list(l.objectives), '')
  out.push(...l.blocks.flatMap(blockLines))
  out.push('### Key points', '', ...list(l.keyPoints), '', `Remember: ${l.remember}`, '')
  if (l.task) out.push('### Build this', '', l.task, '')
  return out
}

export function llmsFullText(): string {
  const paths = new Set(sitemapRoutes().map((r) => r.path))
  const lines: string[] = [
    '# Dev Skills: full text',
    '',
    '> The full text of the indexed concept, worked-solution and Go lesson pages on ' + SITE_URL + ', as one Markdown file. The index is at ' + url('/llms.txt') + '. Interactive practice pages are not included.',
    '',
    '# System design concepts',
    '',
    ...CONCEPTS.filter((c) => paths.has(`/concepts/${c.slug}`)).flatMap((c) => conceptSection(c.slug)),
    '# System design worked solutions',
    '',
    ...PROBLEMS.filter((p) => paths.has(`/problems/${p.slug}/solution`)).flatMap((p) => solutionSection(p.slug)),
  ]
  for (const lang of LANGUAGES) {
    lines.push(`# ${lang.name} lessons`, '')
    for (const sec of lang.sections)
      for (const slug of sec.lessons)
        if (paths.has(`/languages/${lang.id}/${slug}`)) lines.push(...lessonSection(lang.id, slug))
  }
  return lines.join('\n')
}
