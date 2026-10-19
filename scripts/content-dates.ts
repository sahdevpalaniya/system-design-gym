/**
 * Writes lib/content-dates.json: the date each sitemap URL's content last
 * changed, from git history. Also writes lib/content-published.json: the date
 * each page first appeared, for article structured data. Run it after editing
 * content, and commit the result:
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
const OUT_PUBLISHED = join(ROOT, 'lib', 'content-published.json')

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

const git = (args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()

/** The first commit that added a `slug: '<key>',` or `id: '<key>',` line in
 *  `file` (following renames), or anywhere under content/ when no file is
 *  given, since content has moved between folders. Undefined if none has yet. */
function keyAdded(key: string, file?: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const where = file ? ['--follow', '--', file] : ['--', 'content']
  return git(['log', '--format=%cs', '-G', `^\\s+(slug|id):\\s*'${escaped}',`, ...where]).split('\n').at(-1) || undefined
}

/**
 * When a page first appeared, from its first source (the page's own content).
 * Lessons and concepts share files, so they are dated by the commit that added
 * their slug rather than by the file's age; anything else (deep dives, which
 * are keyed differently, included) by its file. Content that is not committed
 * yet counts as new today.
 */
function firstPublished(path: string, src: Source): string {
  if (typeof src !== 'string') {
    if (!src.dir.endsWith('/deep')) return keyAdded(src.key) ?? today
    src = resolve(src)
  }
  const key = path.split('/').at(-1)
  const byKey = key ? keyAdded(key, src) : undefined
  if (byKey) return byKey
  return git(['log', '--follow', '--format=%cs', '--', src]).split('\n').at(-1) || today
}

const dates: Record<string, string> = {}
const published: Record<string, string> = {}
for (const r of sitemapRoutes()) {
  // a page changes when any of its sources does
  dates[r.path] = r.sources.map((s) => lastChanged(resolve(s))).sort().at(-1)!
  const first = firstPublished(r.path, r.sources[0])
  published[r.path] = first < dates[r.path] ? first : dates[r.path]
}

writeFileSync(OUT, `${JSON.stringify(dates, null, 2)}\n`)
writeFileSync(OUT_PUBLISHED, `${JSON.stringify(published, null, 2)}\n`)
const spread = Object.values(dates).reduce<Record<string, number>>((m, d) => ((m[d] = (m[d] ?? 0) + 1), m), {})
console.log(`wrote ${Object.keys(dates).length} dates to lib/content-dates.json`, spread)
console.log(`wrote ${Object.keys(published).length} first-published dates to lib/content-published.json`)
