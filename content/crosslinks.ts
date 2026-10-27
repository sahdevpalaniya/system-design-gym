import { LANGUAGES } from './languages'
import { getConcept } from './system-design/concepts'
import { getProblem } from './system-design/problems'

/**
 * Pages in different tracks that teach the same idea from different sides:
 * design it (System Design) and build it (a language track). Each group is a
 * set of site paths; a page in a group links to the others. A new track joins
 * by adding its paths to a group, or a new group.
 */
const GROUPS: string[][] = [
  ['/problems/url-shortener', '/languages/go/shortener-overview', '/concepts/caching', '/concepts/idempotency'],
  ['/problems/rate-limiter', '/concepts/rate-limiting', '/languages/go/rate-limiting-cors-headers', '/languages/go/interview-concurrency'],
  ['/concepts/caching', '/languages/go/mutex-and-races', '/languages/go/dsa-lru-cache'],
  ['/concepts/message-queues', '/languages/go/channels-and-select', '/languages/go/concurrency-patterns', '/problems/notification-system'],
  ['/concepts/transactions-and-locking', '/languages/go/joins-transactions-n-plus-one', '/languages/go/shop-step-6-checkout', '/problems/payment-ledger'],
  ['/problems/ticket-booking', '/concepts/transactions-and-locking', '/languages/go/shop-step-6-checkout'],
  ['/concepts/api-design', '/languages/go/http-server', '/languages/go/json', '/languages/go/middleware-and-shutdown'],
  ['/concepts/auth-and-security', '/languages/go/expenses-step-3-login', '/languages/go/expenses-step-4-middleware'],
  ['/concepts/connection-pooling', '/languages/go/postgres-and-sql'],
  ['/concepts/indexes', '/languages/go/postgres-and-sql', '/languages/go/joins-transactions-n-plus-one'],
  ['/concepts/observability', '/languages/go/errors-and-logging', '/languages/go/profiling-and-shipping'],
  ['/concepts/deploys-and-releases', '/languages/go/docker-and-deployment'],
  ['/concepts/circuit-breakers', '/languages/go/context', '/languages/go/concurrency-patterns'],
  ['/concepts/object-storage', '/languages/go/shop-step-3-uploads', '/problems/file-sync'],
  ['/problems/key-value-store', '/concepts/consistent-hashing', '/concepts/replication', '/languages/go/maps'],
  ['/problems/web-crawler', '/languages/go/concurrency-patterns', '/languages/go/context', '/concepts/bloom-filters'],
  ['/problems/typeahead', '/concepts/search-indexing', '/languages/go/dsa-binary-search'],
  ['/problems/chat-messaging', '/concepts/realtime-transports', '/languages/go/channels-and-select'],
  // Go to Go: the concurrency lessons build on each other
  [
    '/languages/go/goroutines-vs-threads',
    '/languages/go/goroutines',
    '/languages/go/channels-and-select',
    '/languages/go/mutex-vs-channel',
    '/languages/go/interview-concurrency',
  ],
  ['/languages/go/dsa-sliding-window', '/concepts/rate-limiting'],
  // comparison pages and the broad page each one builds on
  ['/concepts/api-gateway-vs-load-balancer-vs-reverse-proxy', '/concepts/reverse-proxy', '/concepts/load-balancing', '/languages/go/middleware-and-shutdown'],
  ['/concepts/cache-write-strategies', '/concepts/caching', '/concepts/redis-vs-memcached', '/languages/go/dsa-lru-cache'],
  ['/concepts/optimistic-vs-pessimistic-locking', '/concepts/isolation-levels', '/concepts/transactions-and-locking', '/problems/ticket-booking', '/languages/go/joins-transactions-n-plus-one'],
  ['/problems/distributed-message-queue', '/concepts/message-queues', '/languages/go/worker-pool', '/languages/go/channels-and-select'],
  [
    '/languages/go/sync-package',
    '/languages/go/mutex-vs-rwmutex',
    '/languages/go/mutex-and-races',
    '/languages/go/worker-pool',
    '/languages/go/concurrency-patterns',
  ],
  ['/languages/go/interview-questions-experienced', '/languages/go/go-interview-questions', '/languages/go/interview-concurrency', '/languages/go/profiling-and-shipping'],
]

export type CrossLink = { path: string; title: string; track: string }

/** Title and track label for a path, from the content itself, so a link can
 *  never show a stale name. Unknown paths resolve to null and are skipped. */
function describe(path: string): CrossLink | null {
  let m = path.match(/^\/concepts\/([^/]+)$/)
  if (m) {
    const c = getConcept(m[1])
    return c ? { path, title: c.title, track: 'System design concept' } : null
  }
  m = path.match(/^\/problems\/([^/]+)\/solution$/)
  if (m) {
    const p = getProblem(m[1])
    return p ? { path, title: `${p.searchTitle ?? p.title}: worked solution`, track: 'System design solution' } : null
  }
  m = path.match(/^\/problems\/([^/]+)$/)
  if (m) {
    const p = getProblem(m[1])
    return p ? { path, title: p.searchTitle ?? p.title, track: 'System design problem' } : null
  }
  m = path.match(/^\/languages\/([^/]+)\/([^/]+)$/)
  if (m) {
    const l = LANGUAGES.find((x) => x.id === m![1])
    const t = l?.lessons.find((x) => x.slug === m![2])
    return l && t ? { path, title: t.title, track: `${l.name} lesson` } : null
  }
  return null
}

/** The other pages that share a group with `path`, most-shared first. */
export function crossLinksFor(path: string, max = 4): CrossLink[] {
  const score = new Map<string, number>()
  for (const g of GROUPS) {
    if (!g.includes(path)) continue
    for (const p of g) if (p !== path) score.set(p, (score.get(p) ?? 0) + 1)
  }
  return [...score]
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => describe(p))
    .filter((x): x is CrossLink => x !== null)
    .slice(0, max)
}

/** Every path in every group, for a check that none of them are dead. */
export const ALL_CROSSLINK_PATHS = [...new Set(GROUPS.flat())]
export const describeForCheck = describe
