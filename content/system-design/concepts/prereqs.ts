/**
 * What you must already understand before a concept makes sense.
 *
 * This is the source of truth for the teaching order. PATH is derived from it
 * by a topological sort (see prereqs.test.ts), so the sequence cannot silently
 * drift into teaching something before the thing it depends on.
 *
 * An edge belongs here only if it is *load-bearing* — the explanation does not
 * work without it. A passing mention is not a prerequisite; "DNS answers are
 * cached all over the internet" does not require the caching page.
 */
export const PREREQS: Record<string, string[]> = {
  // --- measuring: the vocabulary of "how fast" and "how many"
  'performance-vs-scalability': [],
  'latency-vs-throughput': ['performance-vs-scalability'],
  'latency-numbers': ['latency-vs-throughput'],
  'back-of-envelope': ['latency-numbers'],

  // --- one request, front to back
  dns: [],
  'communication-protocols': [],
  'api-design': ['communication-protocols'],
  'reverse-proxy': ['communication-protocols'],
  'load-balancing': ['reverse-proxy'],
  'availability-patterns': ['load-balancing'],

  // --- where the truth lives
  'sql-vs-nosql': [],
  indexes: ['sql-vs-nosql'],
  'transactions-and-locking': ['sql-vs-nosql'],
  'connection-pooling': ['sql-vs-nosql', 'latency-numbers'],
  'object-storage': ['sql-vs-nosql'],

  // caching before CDN: the CDN page is entirely TTLs, cache keys and
  // invalidation, which is what the caching page teaches.
  caching: ['latency-numbers'],
  cdn: ['caching', 'dns'],

  // --- more than one machine
  replication: ['sql-vs-nosql', 'availability-patterns'],
  partitioning: ['replication', 'indexes'],
  'consistency-models': ['replication'],
  'cap-pacelc': ['consistency-models', 'availability-patterns'],
  consensus: ['consistency-models', 'cap-pacelc'],
  'clocks-and-ordering': ['consistency-models'],
  'multi-region': ['replication', 'consistency-models', 'latency-numbers'],

  // --- doing work later
  'message-queues': ['latency-vs-throughput'],
  idempotency: ['message-queues', 'api-design'],
  'fan-out': ['message-queues'],
  'distributed-transactions': ['transactions-and-locking', 'message-queues', 'idempotency'],
  'write-ahead-log': ['transactions-and-locking', 'replication'],
  'change-data-capture': ['write-ahead-log', 'message-queues'],
  'batch-vs-stream': ['message-queues'],

  // --- named patterns, each built from the machinery above
  'rate-limiting': ['reverse-proxy'],
  'consistent-hashing': ['partitioning', 'caching'],
  'bloom-filters': ['caching', 'indexes'],
  'distributed-counter': ['partitioning', 'caching'],
  'geospatial-indexing': ['indexes'],
  'search-indexing': ['indexes'],
  'realtime-transports': ['communication-protocols'],
  'circuit-breakers': ['availability-patterns'],

  // --- running it for real
  'auth-and-security': ['api-design'],
  observability: ['latency-numbers'],
  'deploys-and-releases': ['availability-patterns'],
  'backups-and-recovery': ['replication', 'object-storage'],
  'capacity-and-cost': ['back-of-envelope'],
}
