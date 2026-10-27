/**
 * Search titles for concept pages, written per concept. They replace the
 * generated "<topic> in system design: explained for interviews" pattern,
 * which gave most concept pages the same title shape. Each says what the page
 * covers and stays under 60 characters. A concept's own `metaTitle` wins.
 */
export const CONCEPT_TITLES: Record<string, string> = {
  'latency-numbers': 'Latency numbers every engineer should know, and why',
  'back-of-envelope': 'Back-of-the-envelope estimation, worked out loud',
  'sql-vs-nosql': 'SQL vs NoSQL: choosing by access pattern, not hype',
  indexes: 'Database indexes: how they work and why queries slow down',
  'availability-patterns': 'High availability: nines, failover and redundancy',
  dns: 'How DNS works: resolution, TTLs and DNS failover',
  'reverse-proxy': 'What a reverse proxy does: TLS, routing, rate limits',
  'communication-protocols': 'HTTP vs TCP vs UDP vs RPC: picking a protocol',
  'object-storage': 'Object storage like S3: presigned uploads and big files',
  'api-design': 'API design basics: pagination, versioning and errors',
  replication: 'Database replication: leaders, followers and lag',
  consensus: 'Consensus explained: Raft, majorities and split brain',
  idempotency: 'Idempotency keys: making retries safe',
  'transactions-and-locking': 'Transactions and row locks: preventing double booking',
  'clocks-and-ordering': 'Clocks and ordering: why timestamps lie',
  'multi-region': 'Multi-region architecture: latency, data laws, cost',
  'bloom-filters': 'Bloom filters: "definitely not" in a few bits',
  'write-ahead-log': 'Write-ahead log (WAL): how databases survive crashes',
  cdn: 'How a CDN works: edge caching, TTLs and purging',
  'geospatial-indexing': 'Geospatial indexing: geohash, quadtrees and "near me"',
  'realtime-transports': 'WebSockets vs SSE vs long polling: costs at scale',
  'change-data-capture': 'Change data capture (CDC): streaming the database log',
  'search-indexing': 'Inverted indexes: how full-text search works',
  'auth-and-security': 'Authentication vs authorization: sessions, tokens, keys',
  observability: 'Observability: metrics, logs and traces in practice',
  'deploys-and-releases': 'Safe deploys: canaries, feature flags and rollbacks',
  'backups-and-recovery': 'Backups and disaster recovery: RPO and RTO explained',
  'capacity-and-cost': 'Capacity planning and cloud cost for a design',
  'batch-vs-stream': 'Batch vs stream processing: when each one fits',
}
