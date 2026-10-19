/**
 * Writes lib/content-dates.json: the date each sitemap URL's content last
 * changed, from git history. Run it after editing content, and commit the result:
 *
 *   npm run content-dates
 *
 * Why not compute this during the build: Vercel clones the repo shallowly, so
 * `git log` there would date every file to the latest commit, which is the same
 * "everything changed today" signal this replaces. Google ignores a sitemap
 * `lastmod` that is identical everywhere, and trusts one that tracks real edits.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { sitemapRoutes, type Source } from '../lib/sitemap-routes'

const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'lib', 'content-dates.json')

/** Files with uncommitted edits count as changed today. */
const dirty = new Set(
  execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim().replace(/\\/g, '/')),
)
const today = new Date().toISOString().slice(0, 10)

const dateCache = new Map<string, string>()
function lastChanged(file: string): string {
  const hit = dateCache.get(file)
  if (hit) return hit
  const d = dirty.has(file)
    ? today
    : execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim()
  if (!d) throw new Error(`no git history for ${file}`)
  dateCache.set(file, d)
  return d
}

/** Deep dives are keyed in deep/index.ts and imported from one file each. */
function deepDiveFile(key: string): string | undefined {
  const index = readFileSync(join(ROOT, 'content/system-design/deep/index.ts'), 'utf8')
  const name = index.match(new RegExp(`^\\s+'?${key}'?:\\s*(\\w+),`, 'm'))?.[1]
  const from = name && index.match(new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from '\\./([\\w-]+)'`))?.[1]
  return from ? `content/system-design/deep/${from}.ts` : undefined
}

function resolve(src: Source): string {
  if (typeof src === 'string') return src
  if (src.dir.endsWith('/deep')) {
    const f = deepDiveFile(src.key)
    if (f) return f
  }
  const decl = new RegExp(`^\\s+(slug|id):\\s*'${src.key}',`, 'm')
  for (const name of readdirSync(join(ROOT, src.dir))) {
    if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue
    const file = `${src.dir}/${name}`
    if (decl.test(readFileSync(join(ROOT, file), 'utf8'))) return file
  }
  throw new Error(`no file in ${src.dir} declares '${src.key}'`)
}

const dates: Record<string, string> = {}
for (const r of sitemapRoutes()) {
  // a page changes when any of its sources does
  dates[r.path] = r.sources.map((s) => lastChanged(resolve(s))).sort().at(-1)!
}

writeFileSync(OUT, `${JSON.stringify(dates, null, 2)}\n`)
const spread = Object.values(dates).reduce<Record<string, number>>((m, d) => ((m[d] = (m[d] ?? 0) + 1), m), {})
console.log(`wrote ${Object.keys(dates).length} dates to lib/content-dates.json`, spread)
