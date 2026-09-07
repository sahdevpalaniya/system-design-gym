import type { Concept } from '@/lib/types'

export const TIER3: Concept[] = [
  {
    slug: 'rate-limiting',
    title: 'Rate limiting',
    tier: 3,
    oneLine: 'Say no cheaply, before the expensive part of your system finds out.',
    problem: [
      'Any public endpoint will be hit harder than you planned — by a buggy client in a retry loop, a scraper, or someone attacking you. Without a limit, one caller can consume everything and everyone else is down.',
      'A rate limiter rejects excess requests at the edge, where rejecting is cheap, instead of letting them reach a database where they are expensive.',
    ],
    cost: 'You will reject legitimate traffic sometimes, and the people it hits hardest are your biggest customers and anyone behind a shared IP — an office, a university, a mobile carrier. You need somewhere to keep counters, and if that store is shared it is now on every request\'s path; if it is per-server, your real limit is the configured limit times the number of servers.',
    useWhen: [
      'Every public API. This is a default.',
      'Expensive endpoints — search, exports, anything calling a paid third party.',
      'Login and password reset, where the limit is a security control, not a capacity one.',
      'Protecting a downstream that cannot scale as fast as you can.',
    ],
    avoidWhen: [
      'Internal calls between your own services, where a circuit breaker and a timeout fit better.',
      'When the real fix is capacity. A limiter should protect against abuse, not paper over a system that cannot serve its actual users.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'rate-limit',
        caption:
          'The bucket refills at a steady rate. A request takes a token or it is rejected — at the edge, before it costs anything.',
      },
    },
    body: [
      'Token bucket is the default, and it is worth being able to describe in one sentence: tokens are added at a fixed rate up to a maximum, each request removes one, and a request with no token available is rejected. The bucket size is how big a burst you tolerate; the refill rate is the sustained limit. That burst allowance is why it suits real traffic, which arrives in clumps.',
      'Fixed window — count per minute, reset on the minute — is the easiest to build and has an obvious flaw: a caller can spend the full allowance at 10:59:59 and the full allowance again at 11:00:00, so a 100-per-minute limit permits 200 in one second. Sliding window log keeps every request timestamp and is exact, at the cost of memory proportional to traffic. Sliding window counter blends the current and previous windows proportionally: nearly as accurate, a fraction of the memory, and it is what most production limiters actually use.',
      'Where to put it. At the edge or gateway, so rejected traffic never reaches your services — that is the point. Per-server counters are simple and let a distributed caller get N times the limit. A shared counter in Redis is accurate and adds a hop plus a dependency on every request, so it needs a fail-open decision: if Redis is down, do you reject everything or allow everything? Usually allow, because a limiter outage should not become a site outage — but say that out loud, because it is a deliberate choice with a security cost.',
      'What to limit by matters more than the algorithm. By API key or user id is the right answer for authenticated traffic. By IP is the fallback for anonymous, and it punishes shared networks. Layered limits work well: per user, per IP, and a global ceiling that protects the system regardless.',
      'Be a good citizen when rejecting: return 429, include a Retry-After header, and document the limits. A client that knows when to come back stops hammering you; one that gets a bare error retries immediately and makes it worse.',
    ],
    followUp: {
      q: '"A legitimate customer hits the limit during their busiest hour. What do you do?"',
      answer:
        'Short term, raise their limit — which means limits need to be per-key configuration, not a constant in code, and that is a design decision to make on day one. Then work out whether it was really abuse or whether my limit is simply wrong for how the product is used; if several customers hit it during a normal peak, the limit is the bug. Longer term I would rather shape than reject: queue their excess and process it slightly slower, or return a partial result, since a slow answer beats an error for most APIs. I would also separate the limits by cost — a cheap read endpoint and an expensive export should not share a budget, because one export burst locks them out of everything. And I would make the 429 useful: Retry-After, plus headers showing remaining quota, so a well-written client self-regulates instead of finding out by failing.',
    },
    selfCheck: {
      q: 'Your limit is 100 requests per minute using a fixed window. How can a caller legitimately send 200 requests in one second, and which algorithm fixes it?',
      answer:
        'By sending 100 at 10:59:59.5 and another 100 at 11:00:00.1. Both windows are separately within the limit, but the burst spans them, so the downstream sees 200 in under a second — which is exactly the thing the limit existed to prevent. A sliding window fixes it: either an exact log of request timestamps, or the counter version that weights the previous window by how much of it still overlaps the last 60 seconds. The counter version is the practical choice — close enough to exact, and its memory does not grow with traffic.',
    },
    traps: [
      'Limiting by IP only, then blocking an entire office.',
      'A shared counter with no answer for what happens when it is down.',
      'Returning a bare 429 with no Retry-After, teaching clients to retry immediately.',
    ],
    sayThis:
      '"Token bucket at the gateway, keyed by API key with a per-IP fallback, counters in Redis with a sliding window. Burst of 100, sustained 20 a second. If Redis is unavailable I fail open and rely on a coarse per-server limit — a limiter outage should not take the API down, and I am accepting the abuse window that creates."',
    related: ['load-balancing', 'circuit-breakers', 'distributed-counter'],
  },

  {
    slug: 'consistent-hashing',
    title: 'Consistent hashing',
    tier: 3,
    oneLine: 'Add or remove a machine and move only a small slice of the keys, not all of them.',
    problem: [
      'The obvious way to spread keys across servers is hash the key and take the remainder by server count. It is even, and it has a fatal property: change the server count and almost every key maps somewhere new.',
      'For a cache that means an almost total miss storm at the exact moment you were adding capacity. For a datastore it means moving nearly all your data. Consistent hashing makes the change proportional instead.',
    ],
    cost: 'It is more complex than modulo, and someone has to maintain the ring — which nodes exist, and getting that view agreed across clients. Plain consistent hashing also distributes unevenly, so you need virtual nodes to fix it, which means more bookkeeping. And it still does nothing about one key being hot; it balances keys, not traffic.',
    useWhen: [
      'A cache cluster whose size changes — this is the classic case.',
      'Sharded datastores where you want to add capacity without a full reshuffle.',
      'Routing users to a specific server for connection or cache affinity.',
    ],
    avoidWhen: [
      'A fixed set of shards that never changes. Modulo is simpler and simpler wins.',
      'When the pre-sized logical partition trick — 1024 partitions mapped onto N machines — is available, which is often easier to reason about and to operate.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Going from 4 servers to 5. How many keys have to move?',
        items: [
          { label: 'hash(key) % N', value: 80, display: '~80% of keys move', tone: 'bad' },
          { label: 'Consistent hashing', value: 20, display: '~20% of keys move (1/N)', tone: 'accent' },
        ],
        note: 'With modulo, a key that hashed to 7 goes from server 3 to server 2 for no reason except that the divisor changed. Consistent hashing only reassigns the slice the new server takes over.',
      },
    },
    body: [
      'The idea: imagine the hash space as a circle. Each server is placed on the circle at a few positions determined by hashing its name. A key is hashed onto the same circle and belongs to the first server clockwise from it. Add a server and it takes over only the arc immediately behind its positions; every other key keeps its home. Remove one and its arc goes to the next server clockwise.',
      'Virtual nodes are not optional. With one position per server the arcs come out badly uneven — some servers get twice the keys of others — and removing a server dumps its entire load onto exactly one neighbour. Give each server one or two hundred positions and both problems go away: load evens out, and a departing server\'s keys spread across all the remaining ones. It also lets you weight a bigger machine by giving it more positions.',
      'What it does not solve: a single key that everyone wants. Consistent hashing decides where a key lives, and if that one key gets a million requests a second, its server is hot no matter how elegantly you assigned it. That needs replication of the hot key or a separate path — and knowing this distinction is usually the follow-up.',
      'Real users: memcached client libraries, Cassandra and Dynamo-style stores for partition assignment, and layer 7 load balancers routing by session or cache affinity.',
    ],
    followUp: {
      q: '"You add a cache node. What happens to your database in the next minute?"',
      answer:
        'It takes a spike, and the size of the spike is the whole point of the question. With modulo hashing roughly every key just moved, so nearly every request is a miss and the database briefly takes full read load — which, at the ratios that made me add a cache, may take it down. That is a genuinely bad way to fail: your capacity increase caused the outage. With consistent hashing only about one-N-th of keys move, so I take a small, survivable miss spike. Either way I would not add the node bare: bring it in during low traffic, warm it first if I can, and make sure misses on the same key coalesce so one cold key means one database read rather than ten thousand.',
    },
    selfCheck: {
      q: 'Why are virtual nodes necessary? Name the specific failure they prevent.',
      answer:
        'Two failures. First, uneven distribution: with one position per server, the arcs between random points on a circle vary a lot, so some servers end up with far more keys than others and you get a hot machine for no reason but luck. Second, and worse, cascading failure on removal: with one position each, everything belonging to a dead server passes to the single next server clockwise, which now has double the load, which may kill it too, and its load passes on again. With a couple of hundred virtual positions per server, a dead server\'s keys are spread across every remaining server in small pieces, so the extra load is a manageable fraction rather than a doubling.',
    },
    traps: [
      'Describing the ring but omitting virtual nodes — that is where the real behaviour is.',
      'Claiming it solves hot keys. It does not.',
      'Using it where a fixed partition count would have been simpler.',
    ],
    sayThis:
      '"Consistent hashing with about 150 virtual nodes per server, so adding a cache node moves roughly a fifth of the keys instead of all of them, and losing one spreads its load across everyone rather than doubling its neighbour. Cost: a ring the clients must agree on, and it still does not help if one single key is hot."',
    related: ['partitioning', 'caching', 'load-balancing'],
  },

  {
    slug: 'bloom-filters',
    title: 'Bloom filters',
    tier: 3,
    oneLine: 'A tiny structure that says "definitely not here" or "probably here", and never the wrong way round.',
    problem: [
      'Sometimes the expensive part is discovering that something does not exist. Checking whether a username is taken, or whether a key is in a store, may mean a disk read or a network call for an answer that is usually "no".',
      'A bloom filter answers that in memory, in a few microseconds, using a fraction of the space the real data takes.',
    ],
    cost: 'It can say yes when the answer is no — false positives — so every yes must be verified against the real store. It can never say no when the answer is yes, which is what makes it safe. You cannot delete from a standard bloom filter, and you cannot list what is in it. And the false positive rate rises as you add elements, so a filter sized for a million entries degrades badly at ten million.',
    useWhen: [
      'Avoiding pointless lookups for keys that mostly do not exist.',
      'Stopping cache penetration, where requests for non-existent ids hit the database every time.',
      'Storage engines checking whether a key might be in a given file before reading it — this is standard in LSM-tree databases.',
      'Deduplicating a huge stream where an occasional false "seen this" is acceptable.',
    ],
    avoidWhen: [
      'A false positive is expensive or unsafe. Never use one as the final authority on anything.',
      'The set is small enough to hold in a normal hash set. Then just do that.',
      'You need deletion, counting, or to enumerate members. A counting bloom filter handles deletion, at more space.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Hash the key three ways. If any bit is 0, it is definitely absent — answered in memory, no disk touched. If all are 1, it is probably present, so go and check.',
        nodes: [
          { id: 'k', label: 'Lookup key', kind: 'client', col: 0, row: 0 },
          { id: 'b', label: 'Bloom filter', sub: '~1.2 MB for 1M keys', kind: 'cache', col: 1, row: 0 },
          { id: 'd', label: 'Database', kind: 'store', col: 2, row: 0 },
          { id: 'n', label: 'a 0 bit anywhere ends the lookup here — no network, no disk', kind: 'note', col: 1, row: 1, span: 2 },
        ],
        edges: [
          { from: 'k', to: 'b' },
          { from: 'b', to: 'd', label: 'only if maybe' },
        ],
      },
    },
    body: [
      'How it works: a bit array, all zeros, plus k independent hash functions. To add an element, hash it k ways and set those k bits to 1. To test, hash it k ways and look. Any bit still 0 means it was definitely never added. All bits 1 means it was probably added — or those bits happened to be set by other elements, which is the false positive.',
      'The size intuition worth remembering: about 10 bits per element gives roughly a 1% false positive rate. So a million keys cost around 1.2 MB. The full set of a million 20-byte usernames plus index overhead is tens of megabytes and lives on disk. That ratio is the entire value proposition.',
      'You choose two of three: expected element count, acceptable false positive rate, and memory. Fix two and the third follows. Size it for the count you expect at the end of its life, not the count today.',
      'The cache penetration case is the one to bring up unprompted. Requests for ids that do not exist cannot be cached — there is nothing to store — so each one reaches the database. An attacker probing random ids drives your miss rate to 100%. A bloom filter of all existing ids stops almost all of them in memory. Cost: the filter must be kept in step with new inserts, so a newly created id is briefly absent from the filter and gets rejected wrongly — which is why you add to the filter on write, and why deletions are awkward enough that most people rebuild the filter periodically instead.',
      'Cousins worth naming in one line: counting bloom filters support deletion by using small counters instead of bits; HyperLogLog estimates how many distinct items you have seen in a couple of kilobytes; a cuckoo filter supports deletion and is often smaller at low error rates.',
    ],
    followUp: {
      q: '"What happens when the bloom filter says yes but the item does not exist?"',
      answer:
        'You do the lookup you were trying to avoid, find nothing, and return not-found — so it costs you one wasted query and nothing else. That is the deal: the filter is an optimisation, never an authority, and the code path behind it must be correct on its own. At a 1% false positive rate, I have removed 99% of the pointless lookups, which is the win. The direction that would be dangerous is the other one — saying no about something that exists — and a bloom filter structurally cannot do that, because a present element always has its bits set. That asymmetry is the reason it is safe to put in front of a correctness-sensitive path at all.',
    },
    selfCheck: {
      q: 'Can a bloom filter ever say "not present" about something that is present? Why does the answer decide where you are allowed to use one?',
      answer:
        'No, never. Adding an element sets its bits and nothing ever clears them, so if it was added, all its bits are 1 and the test passes. The only error is a false positive. That one-sidedness is what makes it usable as a gate in front of expensive work: a "no" is trustworthy enough to skip the lookup entirely, and a "yes" just means do the work you would have done anyway. If it could produce false negatives you could not use it for anything real, because you would sometimes tell a user their data does not exist when it does. It also explains the deletion restriction — clearing bits for a removed element would clear bits shared with elements still present, and that is exactly how you would introduce false negatives.',
    },
    traps: [
      'Treating a positive as an answer instead of a hint.',
      'Sizing for today\'s data and watching the error rate climb.',
      'Trying to delete from a standard filter and creating false negatives.',
    ],
    sayThis:
      '"A bloom filter of existing ids in front of the cache, about 1.2 MB per million keys at a 1% error rate, so lookups for ids that never existed die in memory instead of hitting the database. Cost: 1% of real lookups do a pointless query, and new ids must be added to the filter on write."',
    related: ['caching', 'indexes', 'search-indexing'],
  },

  {
    slug: 'write-ahead-log',
    title: 'Write-ahead logs',
    tier: 3,
    oneLine: 'Write down what you are about to do, before you do it, so a crash cannot lose it.',
    problem: [
      'Updating data in place is not atomic. The machine can lose power halfway through, leaving a structure that is neither the old version nor the new one — corrupted rather than merely out of date.',
      'A write-ahead log fixes it by recording the intended change to an append-only file, and only then applying it. After a crash you replay the log and end up in a consistent state.',
    ],
    cost: 'Every write is written twice — once to the log, once to the data — so you pay in disk throughput and space. The log has to be truncated or checkpointed or it grows forever. Recovery time depends on how much log is unapplied, so infrequent checkpoints mean fast writes and slow restarts. And a durable write means an actual fsync, which is far slower than a write that only reached the operating system\'s buffer.',
    useWhen: [
      'Anything that must survive a crash without corruption — this is why every serious database has one.',
      'You want sequential writes instead of random ones, because appending is dramatically faster on both spinning disks and SSDs.',
      'You need a stream of changes for replication or for change data capture. The log already is that stream.',
    ],
    avoidWhen: [
      'Data you can afford to lose or rebuild — a cache, derived state, a scratch index. Paying twice for durability you do not need is waste.',
      'You are using a database. It already has one; you are not building this yourself.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The log is appended and flushed first. Only then is the change applied. A crash between the two is recoverable — a crash without the log is not.',
        nodes: [
          { id: 'w', label: 'Write', kind: 'client', col: 0, row: 0 },
          { id: 'l', label: 'Log', sub: 'append + fsync', kind: 'store', col: 1, row: 0 },
          { id: 'm', label: 'Memory', sub: 'apply', kind: 'cache', col: 2, row: 0 },
          { id: 'd', label: 'Data files', sub: 'checkpoint later', kind: 'store', col: 3, row: 0 },
          { id: 'n', label: 'confirm the user here, once the log is durable', kind: 'note', col: 1, row: 1, span: 3 },
        ],
        edges: [
          { from: 'w', to: 'l', label: '1' },
          { from: 'l', to: 'm', label: '2' },
          { from: 'm', to: 'd', label: '3, async' },
        ],
      },
    },
    body: [
      'The rule is in the name: the log entry must be durable before the change it describes is applied. Get that order wrong and the whole scheme is decoration.',
      'Recovery: on restart, find the last checkpoint, replay every log entry after it, discard any partial entry at the tail — which is why entries carry a checksum. Committed transactions are redone, uncommitted ones are discarded.',
      'Checkpointing is the knob. A checkpoint flushes current state to the data files and marks that point in the log, so everything before it can be dropped. Frequent checkpoints mean fast recovery and more constant disk work; rare ones mean fast steady-state writes and a restart that can take a long time. That tradeoff is worth naming, because "how long does recovery take" is a real operational question people forget.',
      'The word to be precise about is fsync. A normal write hands the data to the operating system, which may hold it in memory for a while — fast, and lost in a power cut. fsync forces it to the physical device and is orders of magnitude slower. Group commit is the standard trick: batch many transactions into one fsync, so throughput rises and each individual transaction waits a little longer.',
      'The log turns out to be more useful than just crash recovery, and this is the part worth carrying into designs. It is an ordered record of every change, so shipping it to another machine is replication, and reading it is change data capture. Event sourcing is the same idea promoted to the application level: store the events, derive the state. LSM-tree storage engines take it further — writes go to the log and an in-memory table, which is later flushed into sorted files, making writes sequential and fast at the cost of reads checking several files, which is what those bloom filters are for.',
    ],
    followUp: {
      q: '"How much data can you lose if the machine loses power right now?"',
      answer:
        'Whatever was acknowledged but not yet fsynced, and the honest answer depends on a setting rather than on the architecture. If I fsync the log on every commit, I lose nothing that was confirmed — at the cost of a real disk sync per transaction, which caps write throughput. If I fsync on a timer, say every 100 ms, writes are much faster and I can lose up to that window of confirmed writes in a power cut. Group commit gets me most of both: batch concurrent transactions into one fsync, so throughput is high and each commit still waits for a real sync. The point I would make in an interview is that this is a product decision, not a database one — for payments I take the fsync-per-commit cost, for view counts I absolutely do not. And on a single machine, an fsynced log still does not survive the disk failing; that needs the log replicated to another machine before acknowledging, which trades latency for surviving hardware loss rather than just power loss.',
    },
    selfCheck: {
      q: 'Why write everything twice? Explain the benefit in one sentence.',
      answer:
        'Because the first write is sequential, cheap and atomic-by-append, and the second can then be done lazily and in batches without risking correctness — so you get durability at the speed of an append rather than the speed of a safe in-place update. The crash-safety part is the headline: appending a complete entry with a checksum either lands or does not, whereas overwriting a page in place can leave it half-written and unreadable. The performance part is the reason people are happy to pay for it: many random updates become one sequential append plus a batched flush later.',
    },
    traps: [
      'Describing the log but applying the change first. That order is the whole mechanism.',
      'Confusing a write with a durable write. Without fsync, "committed" means "in memory somewhere".',
      'Forgetting checkpointing, and being surprised that recovery takes 40 minutes.',
    ],
    sayThis:
      '"Writes go to an append-only log, fsynced with group commit, then applied. Cost: every byte is written twice, and I have to checkpoint or recovery time grows without bound. The bonus is that the log is already the replication stream and the CDC feed."',
    related: ['replication', 'change-data-capture', 'bloom-filters'],
  },

  {
    slug: 'cdn',
    title: 'CDNs',
    tier: 3,
    oneLine: 'Put copies of your static content near users, so most requests never reach you.',
    problem: [
      'A user 15,000 km from your servers pays 150 ms per round trip no matter how fast your code is. For a page pulling 60 images, scripts and fonts, that is the entire experience.',
      'A CDN keeps copies at hundreds of locations worldwide, so those requests are answered a few milliseconds away — and your origin stops serving the vast majority of its traffic.',
    ],
    cost: 'You now have copies of your content everywhere and a purge is not instant, so a bad deploy or a wrong image can persist for minutes. Getting cache headers wrong produces the worst bug in this area: a private response cached and served to a different user. You pay for bandwidth, and debugging becomes harder because the answer depends on which edge location the user reached.',
    useWhen: [
      'Any static asset — images, video, CSS, JavaScript, fonts. This is not a decision, it is a default.',
      'Public API responses that are the same for everyone and change slowly.',
      'Large downloads, where origin bandwidth is the real cost.',
      'Absorbing traffic spikes and volumetric attacks before they reach you.',
    ],
    avoidWhen: [
      'Personalised or authenticated responses, unless you are extremely careful about cache keys and Vary headers.',
      'Data that must be current to the second.',
      'Write traffic. A CDN is a read optimisation.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The edge answers most requests locally. The origin only sees the misses — often under 5% of total traffic.',
        nodes: [
          { id: 'u1', label: 'User in Delhi', kind: 'client', col: 0, row: 0 },
          { id: 'u2', label: 'User in Berlin', kind: 'client', col: 0, row: 1 },
          { id: 'e1', label: 'Edge — Delhi', sub: '~10 ms', kind: 'cache', col: 1, row: 0 },
          { id: 'e2', label: 'Edge — Berlin', sub: '~10 ms', kind: 'cache', col: 1, row: 1 },
          { id: 'o', label: 'Origin', sub: 'sees the misses only', kind: 'service', col: 2, row: 0 },
        ],
        edges: [
          { from: 'u1', to: 'e1' },
          { from: 'u2', to: 'e2' },
          { from: 'e1', to: 'o', label: 'miss', dashed: true },
          { from: 'e2', to: 'o', label: 'miss', dashed: true },
        ],
      },
    },
    body: [
      'Cache headers are the part that decides whether this works. Cache-Control max-age says how long the edge and browser may serve it without asking. s-maxage applies to the CDN only, so you can let the edge hold something for an hour while browsers hold it for a minute. stale-while-revalidate lets the edge serve a slightly old copy while it fetches a new one in the background, which removes the latency spike at expiry and is the single most useful header most people do not use.',
      'The versioned-filename pattern solves invalidation properly and should be your default answer. Give every build asset a content hash in its name — app.9f3a2c.js — and set an immutable, one-year cache. The file never changes, so it never needs purging; a deploy publishes new filenames and the HTML that references them is the only thing with a short TTL. Purging becomes something you almost never do, which matters because purging worldwide takes time and is the slow path.',
      'Private data at the edge is the failure to watch for. If a response varies by user, the cache key must include whatever it varies by, or two users share a response. Mark authenticated responses private or no-store, and be deliberate about Vary — one wrong header here leaks one customer\'s data to another, and it is a real incident that happens to real companies.',
      'Beyond static files: most CDNs will also terminate TLS near the user, which removes a full handshake\'s worth of round trips; absorb volumetric attacks; and run small pieces of code at the edge for things like routing, authentication checks and A/B assignment, keeping the decision close to the user.',
      'For video, the CDN is not an optimisation but the delivery mechanism: the file is chopped into short segments at several bitrates, and the player picks a bitrate per segment based on measured bandwidth. Every one of those segments is a cacheable static file, which is precisely why this design is used.',
    ],
    followUp: {
      q: '"You deployed a bad image and it is cached worldwide. How fast can you fix it?"',
      answer:
        'Depends entirely on choices I made before the incident. If assets are content-hashed, this is not really an incident: the new deploy references a new filename, the HTML has a short TTL, and users get the correct asset within a minute without purging anything. If the file is at a stable path with a long TTL, I have to purge, which propagates across hundreds of locations and takes anywhere from seconds to minutes depending on the provider — and some clients will keep serving from their own browser cache regardless of what I do at the edge, which I cannot purge at all. That last part is why long browser TTLs on unversioned paths are a trap. The lesson I would carry into the design: version the assets, keep the HTML TTL short, and treat purging as an emergency tool rather than a normal workflow.',
    },
    selfCheck: {
      q: 'What is the one type of response you must be most careful about caching at the edge, and what specifically goes wrong?',
      answer:
        'Anything personalised or authenticated. What goes wrong is not staleness, it is disclosure: the edge stores the response for a URL, and the next person requesting that URL gets the first user\'s data — their name, their orders, their balance. The URL was the same, so the cache did exactly what it was told. The defences are to mark those responses private or no-store, and where you do want to cache per-user, to include the identity in the cache key deliberately rather than hoping Vary covers it. This is the CDN mistake with real consequences; the rest are performance bugs.',
    },
    traps: [
      'Assuming a purge is instant everywhere. It is not, and browser caches are beyond your reach entirely.',
      'Caching an authenticated response without a per-user cache key.',
      'Long TTLs on unversioned filenames, which makes every mistake expensive to fix.',
    ],
    sayThis:
      '"Static assets get a content hash in the filename and a one-year immutable cache, so I never purge. The HTML has a 60-second TTL with stale-while-revalidate. Authenticated responses are no-store. Cost: bandwidth, and any mistake on a non-versioned path takes minutes to undo worldwide."',
    related: ['caching', 'latency-numbers', 'realtime-transports'],
  },

  {
    slug: 'geospatial-indexing',
    title: 'Geospatial indexing',
    tier: 3,
    oneLine: 'Turn "near me" into a range query, because databases cannot sort by two dimensions at once.',
    problem: [
      'An index sorts on one axis. Location has two, and "everything within 3 km of here" is not a range on either of them — filter by latitude and you get a band around the whole planet.',
      'Geospatial indexes solve this by mapping two dimensions onto one in a way that keeps nearby things nearby, so proximity becomes a lookup you can actually index.',
    ],
    cost: 'The mapping is approximate at the edges: two points a metre apart can fall into different cells, so you must search neighbouring cells too and then filter by real distance. Cell size is a tuning problem that changes with density — a size that works in a village is wrong in a city centre. And the results need a final exact-distance pass, because cells are squares and your query is a circle.',
    useWhen: [
      'Find things near a point — drivers, restaurants, stores, users.',
      'Matching supply to demand geographically.',
      'Ingesting a stream of location updates and answering proximity queries over it.',
      'Region containment — is this point inside this delivery zone.',
    ],
    avoidWhen: [
      'Small datasets. Scanning ten thousand rows and computing distance is fast and vastly simpler.',
      'The result depends on travel time rather than straight-line distance — geospatial indexing narrows the candidates, then a routing service ranks them.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Geohash: the map is split into a grid, each cell gets a string, and nearby places share a prefix — so "near me" becomes a prefix scan.',
        nodes: [
          { id: 'p', label: 'lat, lng', kind: 'client', col: 0, row: 0 },
          { id: 'g', label: 'geohash', sub: 'tdr1y7', kind: 'service', col: 1, row: 0 },
          { id: 'i', label: 'Index', sub: 'prefix tdr1y*', kind: 'store', col: 2, row: 0 },
          { id: 'f', label: 'Exact distance', sub: 'filter + sort', kind: 'service', col: 3, row: 0 },
          { id: 'n', label: 'also scan the 8 neighbouring cells — a point near an edge is not in your cell', kind: 'note', col: 0, row: 1, span: 4 },
        ],
        edges: [
          { from: 'p', to: 'g' },
          { from: 'g', to: 'i' },
          { from: 'i', to: 'f' },
        ],
      },
    },
    body: [
      'Geohash is the one to explain, because it is simple and it is everywhere. Repeatedly halve the world — left or right of the middle, top or bottom — and record each choice as a bit. Encode those bits as characters. A longer string means a smaller box: 5 characters is about 5 km, 6 is about 1 km, 7 about 150 m. Because the prefix encodes the coarse position, points that share a prefix are in the same region, so a proximity search is a prefix range scan on an ordinary B-tree index.',
      'The catch you must mention, or the follow-up will find it: two points either side of a cell boundary can be 10 metres apart and share no prefix. So you always query your cell plus its eight neighbours, then compute real distances and filter. Skipping the neighbours produces a system that misses the closest result, which is a bad bug in a ride-hailing product.',
      'Quadtree splits space adaptively: a cell that gets too crowded divides into four. That handles wildly uneven density — city centre versus countryside — better than a fixed grid, at the price of a tree you must maintain, which is more work when points move constantly. S2 and H3 are the production-grade versions; H3 uses hexagons, which have the pleasant property that all six neighbours are equidistant, unlike a square\'s mix of edges and corners.',
      'For moving objects, the shape of the problem changes. Drivers report position every few seconds, so writes hugely outnumber reads, and a tree that rebalances on every update is the wrong choice. The common answer: keep current positions in memory keyed by cell — a Redis sorted set per cell works — accept that positions are a few seconds old, and treat the index as a filter that produces candidates rather than an answer.',
      'The last step is always the same: the index narrows millions to dozens; then you compute the real metric — actual distance, or estimated arrival time from a routing service — and rank. Do not let the index decide the ranking.',
    ],
    followUp: {
      q: '"A driver is 100 metres away but in a different geohash cell. Do you find them?"',
      answer:
        'Only if I search the neighbouring cells, which is exactly why that step is mandatory rather than an optimisation. A cell boundary is arbitrary, and the nearest driver is as likely to be just over it as inside it — so I query my cell plus the eight around it, union the candidates, then compute true distances and sort. If the passenger is right at a corner I might widen further, and in a sparse area I would step down to a shorter prefix, meaning bigger cells, until I have enough candidates. There is a second subtlety worth naming: I should rank by estimated arrival time, not straight-line distance, because a driver 100 metres away on the far side of a motorway with no crossing is much further away in practice than one 400 metres down the same road.',
    },
    selfCheck: {
      q: 'Why can you not just index latitude and longitude as two normal columns and query both?',
      answer:
        'Because a B-tree index on (lat, lng) is sorted by latitude first, so it can efficiently narrow to a horizontal band of the earth — and then within that band, longitude ordering is only useful per exact latitude value, which is useless for a continuous coordinate. In practice the database picks the latitude range, gets a band circling the globe, and scans it filtering on longitude. It works, and it is far too slow at scale because the intermediate result is enormous. The geospatial approach interleaves the two dimensions into one sortable value, so a single range scan corresponds to a compact area rather than a band.',
    },
    traps: [
      'Forgetting neighbouring cells and silently missing the nearest result.',
      'One fixed cell size everywhere, so city queries return 50,000 candidates and rural ones return none.',
      'Ranking by straight-line distance when the product needs arrival time.',
    ],
    sayThis:
      '"Geohash at 6 characters, roughly a kilometre, with current driver positions in a Redis sorted set per cell. A search reads my cell plus the eight neighbours, then ranks the candidates by estimated arrival time, not straight-line distance. Cost: positions are a few seconds stale, and I need to widen the search in sparse areas."',
    related: ['indexes', 'partitioning', 'caching'],
  },

  {
    slug: 'realtime-transports',
    title: 'Long polling vs WebSockets vs SSE',
    tier: 3,
    oneLine: 'Three ways to push data to a browser, with very different costs at scale.',
    problem: [
      'HTTP is built around the client asking. For anything live — a score, a message, a cursor moving — you need the server to speak first, and there is no single obvious way to do that.',
      'The three practical options differ mainly in how much they cost you per connected user, which is the thing that decides the design.',
    ],
    cost: 'All of them mean holding open connections, so your servers are now stateful in a way plain request-response is not: load balancers must handle long-lived connections, deploys drop everyone at once and they all reconnect together, and capacity is measured in concurrent connections rather than requests per second. Every option needs a reconnect story, and a way to catch up on what was missed while disconnected.',
    useWhen: [
      'Polling: updates are infrequent or the delay does not matter. Genuinely the right answer more often than people admit.',
      'SSE: server-to-client only — notifications, live scores, progress, streaming text. Plain HTTP, reconnects by itself.',
      'WebSockets: both directions and frequent — chat, collaborative editing, games, live cursors.',
      'Long polling: you need push and cannot use the others. Mostly a fallback now.',
    ],
    avoidWhen: [
      'WebSockets for a feed that updates every 30 seconds. You are paying for a persistent connection to send almost nothing.',
      'SSE when the client must send frequently too — it is one-directional.',
      'Any of them when a five-second poll would satisfy the user. Simplicity is worth real money here.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'Pick by direction and by frequency. Both of those change the cost per user.',
        a: {
          title: 'Server-Sent Events',
          points: [
            'One direction: server to client. The client still posts normally over HTTP.',
            'Plain HTTP, so proxies, compression and auth all behave.',
            'Automatic reconnect with a last-event-id, so catching up is built in.',
            'Text only, and old browsers cap parallel connections per domain.',
            'Right for: notifications, live scores, progress bars, streamed responses.',
          ],
        },
        b: {
          title: 'WebSockets',
          points: [
            'Both directions, low overhead per message once connected.',
            'Binary or text, and very low latency.',
            'You implement reconnect, resume and heartbeats yourself.',
            'More infrastructure care: sticky routing, proxy configuration, connection-count capacity.',
            'Right for: chat, collaborative editing, live cursors, games.',
          ],
        },
        verdict:
          'If the data only flows one way, use SSE — it is much less to operate and reconnection is free. Reach for WebSockets when the client genuinely needs to send frequently too. And check first whether a 5-second poll is fine, because it usually is and it costs you nothing to run.',
      },
    },
    body: [
      'Long polling: the client requests, the server holds the request open until there is something to say or a timeout hits, then the client immediately asks again. Works everywhere, and every message costs a full HTTP request cycle plus a reconnect.',
      'The scaling problem is the same for all of them and worth stating clearly: with a million connected users you are holding a million connections, and they are spread over servers that must find each other. When user A sends a message to user B on a different server, something has to route it — usually a pub/sub layer where each server subscribes to the channels its connected users care about. That layer becomes the thing that limits you, and it is the interesting part of any live-push design.',
      'Deploys are the operational trap. Restart the fleet and every client reconnects at once — a thundering herd on connection setup and authentication that can be worse than the traffic you normally serve. Defences: reconnect with exponential backoff and jitter on the client, and roll the fleet slowly rather than all at once.',
      'Missed messages while disconnected are a product requirement, not a transport feature. Whatever you choose, the client should reconnect with the last id it saw and receive what it missed, which means the server keeps a short buffer per channel. SSE gives you the id mechanism for free; with WebSockets you build it.',
      'A useful hybrid worth mentioning: keep the live connection for a notification that says "something changed", and have the client fetch the actual data over normal HTTP. The persistent connection carries tiny messages, the real payloads go over cacheable requests, and you get much of the benefit for much less complexity.',
    ],
    followUp: {
      q: '"You have a million concurrent connections. What breaks first?"',
      answer:
        'Almost never raw connection count on the machines — a tuned server handles a lot of idle sockets, and it is mostly memory per connection plus file descriptor limits, which is a capacity planning question. What breaks first is usually the fan-out layer: when one event has to reach 100,000 subscribers spread across 200 servers, the pub/sub system doing that routing is the bottleneck, and a popular channel makes it much worse. Second thing to break is deploys — restarting means a million reconnections and re-authentications inside a few seconds, which is a self-inflicted spike far bigger than normal traffic. Third is memory, if I am buffering per-connection state or missed messages. So I would shard connections by channel so a server holds the users interested in the same things, keep per-connection state tiny, put a hard cap on buffered messages per client and drop the slow ones rather than growing without bound, and make clients reconnect with jittered backoff. Cost: sharding by channel means a user in many channels touches several servers, which complicates routing.',
    },
    selfCheck: {
      q: 'A dashboard updates once a minute. Which transport, and why not the other two?',
      answer:
        'Plain polling every 30 to 60 seconds. Not WebSockets: you would hold a persistent connection per user, take on sticky routing, reconnect logic and a fan-out layer, all to deliver one small message a minute — the operational cost is enormous relative to the benefit. Not SSE either, for the same reason in a milder form: a held-open connection per viewer to send 60 bytes a minute, when a request every 30 seconds gets the same result with no new infrastructure, is cacheable at the edge, and fails in ways your existing monitoring already understands. The general rule I would state: persistent connections earn their cost when messages are frequent or latency matters to a human in the moment. Neither is true here.',
    },
    traps: [
      'Choosing WebSockets by default because it sounds more capable.',
      'No reconnect-and-catch-up story, so users silently miss messages.',
      'Forgetting that deploys disconnect everyone simultaneously.',
    ],
    sayThis:
      '"SSE, because updates only flow server to client and reconnection with last-event-id is built in. Connections are sharded by channel so one server holds the subscribers for a topic. Cost: I now have long-lived connections, so deploys need a slow roll and clients need jittered reconnect, or every restart is a self-inflicted spike."',
    related: ['load-balancing', 'message-queues', 'caching'],
  },

  {
    slug: 'change-data-capture',
    title: 'Change data capture',
    tier: 3,
    oneLine: 'Read the database\'s own log to find out what changed, instead of asking the application to tell you.',
    problem: [
      'Several systems usually need to know when data changes — a search index, a cache, a warehouse, another service. Making the application notify all of them means every write path remembers to, and one that forgets creates drift nobody notices for months.',
      'CDC takes the changes from the database\'s replication log instead. Nothing can be missed, because a change that is not in the log did not happen.',
    ],
    cost: 'The consumer sees database rows, so it is coupled to your schema — rename a column and downstream breaks. It is asynchronous, so consumers are always a little behind. Ordering is only guaranteed per key, not globally. And it is real infrastructure to run: connectors, offsets, schema handling, and a plan for when a consumer falls so far behind that the log it needs has been discarded.',
    useWhen: [
      'Keeping a search index in step with a database.',
      'Invalidating caches reliably, rather than hoping every write path remembers.',
      'Feeding a data warehouse without nightly full exports.',
      'Extracting events from a system you cannot modify — a legacy application, a vendor database.',
      'Migrating between databases with dual-running and no downtime.',
    ],
    avoidWhen: [
      'The consumer needs business events rather than row changes. "Order shipped" is a decision; three UPDATE statements are not, and reconstructing intent from row diffs is fragile.',
      'You need the change applied immediately and synchronously.',
      'One application owns the write path and can emit events cleanly via an outbox. That is simpler and expresses intent properly.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The connector reads the replication log — the same stream the database uses for its own replicas — so no change can be missed.',
        nodes: [
          { id: 'a', label: 'App', kind: 'service', col: 0, row: 0 },
          { id: 'db', label: 'Database', sub: 'WAL', kind: 'store', col: 1, row: 0 },
          { id: 'c', label: 'Connector', sub: 'reads the log', kind: 'service', col: 2, row: 0 },
          { id: 'q', label: 'Stream', kind: 'queue', col: 3, row: 0 },
          { id: 's', label: 'Search index', kind: 'store', col: 4, row: 0 },
          { id: 'w', label: 'Warehouse', kind: 'store', col: 4, row: 1 },
        ],
        edges: [
          { from: 'a', to: 'db', label: 'write' },
          { from: 'db', to: 'c' },
          { from: 'c', to: 'q' },
          { from: 'q', to: 's' },
          { from: 'q', to: 'w' },
        ],
      },
    },
    body: [
      'Log-based CDC is the good version: a connector pretends to be a replica and reads the write-ahead log, so it sees every change, including ones made by a script someone ran by hand. Low overhead on the database, and complete by construction.',
      'The alternatives are worse and worth being able to dismiss. Polling a modified-at column misses deletes entirely, misses rows updated twice between polls, and puts load on the database. Triggers that write to an audit table are synchronous, so they slow every write and can fail a transaction that would otherwise have succeeded.',
      'CDC versus the outbox pattern is the comparison interviewers like. The outbox gives you deliberate business events with a stable shape you control, and requires the application to write them. CDC gives you every change with no application involvement, at the price of exposing your schema and losing intent — you can see status change from PAID to SHIPPED, but the reason lives in application code. My default: outbox for events other services depend on, CDC for keeping derived stores like search indexes and warehouses in step.',
      'Two operational details that come up. First, the initial load: a new consumer needs the existing data as well as the changes, so you snapshot the table, note the log position at that moment, and stream from there — getting that boundary wrong means missing or duplicating a window of changes. Second, retention: the log is finite, so a consumer that is down for a day may find the data it needs has been discarded, and its only recovery is a fresh snapshot. Alert on consumer lag against retention, not just on lag.',
      'Since consumers may see a change twice after a restart, they must be idempotent — which for derived stores is usually easy, because writing the current value of a row again changes nothing.',
    ],
    followUp: {
      q: '"How do you keep a search index in sync with your database?"',
      answer:
        'Not by writing to both from the application, which is the tempting answer and the wrong one: the two writes are not atomic, so a crash between them leaves the index permanently wrong and nothing tells you. I would drive the index from CDC — the connector reads the database log, publishes changes to a stream, and an indexer consumes it. Since the change is in the log if and only if it committed, the index cannot miss anything, and the indexer is naturally idempotent because it writes the whole current document. The costs I would name: the index lags the database by a second or so, which is fine for search and not fine for a read-your-own-writes expectation, so if a user must see their own edit immediately I would merge their pending change client-side. And schema changes now affect the indexer, so it has to tolerate unknown and missing fields. I would also run a periodic reconciliation comparing counts and checksums, because any pipeline running for a year will have drifted somewhere, and finding it deliberately beats hearing about it from a user.',
    },
    selfCheck: {
      q: 'Your application writes to the database and then updates the search index directly. Name what goes wrong and what you would do instead.',
      answer:
        'The two writes can disagree. Commit the row, crash before indexing, and the item is invisible in search forever with nothing flagging it. Index first, then roll back, and search returns something that does not exist. It also breaks for any write that does not go through that code path — a migration, a manual fix, a second service — and those are exactly the changes nobody remembers to handle. Instead, make the change and its notification atomic: either write to an outbox table in the same transaction and relay from there, or drive indexing from the database log with CDC so the source of truth is the commit itself. I would take CDC here, because a search index is derived state that should follow every change regardless of who made it.',
    },
    traps: [
      'Dual writes to the database and a second system. They will drift.',
      'Treating row changes as business events and reconstructing intent from diffs.',
      'No plan for a consumer that falls behind log retention.',
    ],
    sayThis:
      '"The search index is fed by CDC off the database log, so it cannot miss a write, including ones made outside the application. Indexing is idempotent because it writes the whole document. Cost: about a second of lag, coupling to the schema, and I need a reconciliation job because any long-running pipeline eventually drifts."',
    related: ['write-ahead-log', 'distributed-transactions', 'search-indexing'],
  },

  {
    slug: 'circuit-breakers',
    title: 'Circuit breakers and retries with jitter',
    tier: 3,
    oneLine: 'Stop calling something that is already failing, and never retry in unison.',
    problem: [
      'When a dependency gets slow, every caller piles up waiting on it, holding threads and connections. Your service dies of someone else\'s outage — that is a cascading failure, and it is how one small problem takes down a whole platform.',
      'Retries make it worse. The dependency is struggling, so everyone retries, so it receives more traffic than before and cannot recover. The fix is to fail fast when things are bad, and to retry in a way that does not synchronise.',
    ],
    cost: 'A circuit breaker returns errors for requests that might have worked, so you deliberately trade some successful requests for system survival. It has thresholds to tune, and badly tuned ones either trip constantly or never trip at all. Retries multiply load — three retries means up to four times the traffic in exactly the moment you can least afford it — and any retry needs idempotency behind it or you get duplicate side effects.',
    useWhen: [
      'Every call to another service or an external API. Timeouts and breakers are defaults, not features.',
      'A dependency that is optional — recommendations, personalisation — where a fallback is better than an error.',
      'Anywhere you have seen threads pile up on a slow call.',
    ],
    avoidWhen: [
      'A single local database call where failure means you genuinely cannot answer. A breaker adds little; a timeout still matters.',
      'Non-idempotent operations without an idempotency key. Retrying a payment blindly is worse than failing.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Closed: calls pass. Open: fail immediately, no waiting. Half-open: let one through and see. The half-open state is what lets it heal on its own.',
        nodes: [
          { id: 'c', label: 'Closed', sub: 'calls pass', kind: 'service', col: 0, row: 0 },
          { id: 'o', label: 'Open', sub: 'fail fast', kind: 'service', col: 1, row: 0 },
          { id: 'h', label: 'Half-open', sub: 'one trial call', kind: 'service', col: 2, row: 0 },
          { id: 'n', label: 'trial succeeds → closed. trial fails → open again', kind: 'note', col: 1, row: 1, span: 2 },
        ],
        edges: [
          { from: 'c', to: 'o', label: 'failure rate high' },
          { from: 'o', to: 'h', label: 'after a cooldown' },
          { from: 'h', to: 'c', label: 'ok' },
        ],
      },
    },
    body: [
      'The single most valuable line here: a timeout on every remote call, always. Without one, a dependency that hangs holds your resources indefinitely, and no amount of clever breaker logic saves you. Set it from the real latency distribution — a bit above p99, not a round number someone guessed.',
      'The breaker states. Closed and calls flow while failures are counted. Once the failure rate crosses a threshold over a meaningful window, it opens and calls fail immediately without waiting — that is the point, you stop spending resources on something that will not answer. After a cooldown it goes half-open and permits one trial call: success closes it, failure opens it again. Use a failure rate over a window rather than a raw count, or a low-traffic endpoint takes an hour to trip and a busy one trips on a blip.',
      'Retries, done properly. Only retry things that are safe to repeat, or that carry an idempotency key. Only retry errors that might be transient — a timeout or a 503, never a 400. Cap the attempts at two or three. Use exponential backoff so gaps grow, and add jitter so callers do not synchronise: without it, a thousand clients that all failed at the same moment all retry at exactly the same moment, and the recovering service is knocked over by the retry wave. Jitter is one line of code and it is the difference between recovery and a second outage.',
      'A refinement worth mentioning: a retry budget, where the whole client is allowed to spend only a small percentage of its traffic on retries. It bounds the amplification no matter how many individual calls decide to retry, which is the real risk in a deep call chain — three services each retrying three times is 27 requests from one.',
      'Bulkheads are the companion idea: give each dependency its own limited pool of connections or threads, so a slow one exhausts only its own share and the rest of your service keeps working. Without it, one slow dependency consumes every thread and takes down endpoints that never called it.',
      'Then say what happens when the breaker is open, because that is the part that decides user experience: serve stale cached data, degrade to a simpler response, drop an optional feature, or return a clear error. Deciding this per dependency in advance is the difference between graceful degradation and a blank page.',
    ],
    followUp: {
      q: '"Your recommendation service is down. What does the user see?"',
      answer:
        'The page, without recommendations — and that has to be a deliberate decision made before the incident, not something the code falls into. Concretely: the call has a tight timeout, maybe 100 ms, because recommendations are not worth delaying the page for; a breaker opens after a burst of failures so we stop waiting at all; and the fallback is a cached or generic list, or the section simply is not rendered. The failure to avoid is the common one — the page waits three seconds for a dependency it did not need and then errors, so an optional feature caused a total outage. I would also isolate it with its own connection pool, so even while it is timing out it cannot consume the capacity the checkout path needs. The cost of all this is that recommendations quietly get worse during an incident and users are not told — which is the right trade here, but it means I need an alert, or nobody notices for a week.',
    },
    selfCheck: {
      q: 'Why add jitter to retry backoff? Describe the exact failure it prevents.',
      answer:
        'Because a thousand clients hit by the same outage fail at the same instant, and with pure exponential backoff they all wait the same 1, 2, and 4 seconds — so they retry in perfect unison. The struggling service gets a thousand simultaneous requests, falls over again, and the pattern repeats with the herd now even more synchronised. That is a retry storm, and it can keep a service down long after the original cause is fixed. Jitter randomises each client\'s wait — full jitter picks uniformly between zero and the backoff — so the same thousand retries spread smoothly over the window and the service gets a chance to recover. It costs nothing and it is the single most effective line in the whole retry story.',
    },
    traps: [
      'Retrying without idempotency and creating duplicate side effects.',
      'Backoff with no jitter, producing a synchronised retry wave.',
      'A breaker with no defined fallback — you fail fast into a blank page.',
      'No timeout at all, which makes everything else here irrelevant.',
    ],
    sayThis:
      '"Every outbound call gets a timeout just above p99, two retries with exponential backoff and full jitter, and a breaker that opens on a failure rate rather than a raw count. Recommendations have their own connection pool and fall back to a cached list. Cost: during an incident some requests that would have succeeded are rejected — I am trading a few requests to keep the service up."',
    related: ['idempotency', 'connection-pooling', 'rate-limiting'],
  },

  {
    slug: 'search-indexing',
    title: 'Search indexing basics',
    tier: 3,
    oneLine: 'An index from words to documents, so "find me things containing this" is not a full scan.',
    problem: [
      'Databases match values; search matches meaning, roughly. A LIKE query cannot use a normal index, cannot handle typos or word endings, and has no idea which result is better.',
      'A search engine builds an inverted index — for each word, the list of documents containing it — so a query becomes a few list intersections, and it ranks what comes back.',
    ],
    cost: 'A second copy of your data that can drift from the source, and now you own keeping it in step. Indexing is expensive at write time, and the index is near-real-time rather than immediate, so a user may search for something they just created and not find it. Relevance tuning is an ongoing job with no finish line, and analysis choices — how you split and normalise text — are baked in, so changing them means reindexing everything.',
    useWhen: [
      'Full-text search over meaningful amounts of text.',
      'Faceted search — filter by brand, price, rating, with counts.',
      'Typeahead and autocomplete.',
      'Log and event search, where the volume makes a database impractical.',
      'Ranking by relevance rather than by a column.',
    ],
    avoidWhen: [
      'Exact lookups by id or a known field. That is what your database does, better.',
      'Small datasets — most relational databases have decent built-in full-text search, and one system beats two.',
      'You need transactional guarantees. A search index is derived data and should never be the source of truth.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Text is split, normalised, and stored word to document list. A two-word query becomes an intersection of two short lists.',
        nodes: [
          { id: 'd', label: 'Document', sub: '"Running shoes"', kind: 'client', col: 0, row: 0 },
          { id: 'a', label: 'Analyse', sub: 'split, lowercase, stem', kind: 'service', col: 1, row: 0 },
          { id: 'i', label: 'Inverted index', sub: 'run → [3, 9]  shoe → [3, 7]', kind: 'store', col: 2, row: 0, span: 2 },
          { id: 'q', label: 'Query "run shoe"', kind: 'client', col: 0, row: 1 },
          { id: 'r', label: 'Intersect + rank', sub: 'doc 3 wins', kind: 'service', col: 1, row: 1 },
        ],
        edges: [
          { from: 'd', to: 'a' },
          { from: 'a', to: 'i' },
          { from: 'q', to: 'r' },
          { from: 'r', to: 'i' },
        ],
      },
    },
    body: [
      'Analysis is the step that decides quality and gets the least attention. Text is split into tokens, lowercased, optionally stripped of very common words, and reduced to a root form so "running", "runs" and "ran" all become "run". Both the document and the query go through the same analysis, which is why they match. Change the analyser and you must reindex, because the old index holds tokens in the old form.',
      'Ranking, at the level worth explaining: a word that appears often in this document is a stronger signal, and a word that appears in almost every document is a weaker one — that combination is TF-IDF, and BM25 is the refined version everyone actually uses. On top of the text score you add business signals: popularity, recency, stock, margin. Real product search is mostly this second part.',
      'For typeahead specifically, the general engine is often the wrong tool. Prefix matching on a few million terms is better served by a purpose-built structure — a trie with the top completions precomputed at each node, held in memory — giving single-digit millisecond responses. Precompute rather than search, because the user types another character in 200 ms and every keystroke is a query.',
      'Keeping it in step: drive indexing from the database log or an outbox rather than writing to both places from the application. Index whole documents so reindexing a record is idempotent. And plan for full reindex, because you will change the mapping — the standard approach is to build a new index alongside, then switch an alias over atomically, so there is no window with no index.',
      'Scale shape: search indexes are partitioned into shards and each shard replicated. A query fans out to every shard, each returns its top N, and the coordinator merges — so query cost grows with shard count, and having far more shards than you need makes every query slower. Deep pagination is genuinely expensive for the same reason: page 500 means each shard must produce 5,000 results to merge. Use a cursor instead of an offset.',
    ],
    followUp: {
      q: '"A user creates an item and immediately searches for it. Is it there?"',
      answer:
        'Probably not, and that is worth being upfront about rather than hoping nobody notices. Search indexes are near-real-time — the document has to be indexed and the index refreshed before it is visible, typically about a second, and longer if the indexing pipeline is behind. So the honest design is to not rely on search for that moment. If the user is looking at their own newly created item, serve that view from the database, which knows immediately. If they land on a search results page, I can merge their pending item into the results client-side, or force a refresh of just that document, which is expensive and fine at low volume. What I would avoid is the workaround of forcing a global refresh after every write, because that destroys indexing throughput. The general principle: search is derived, eventually consistent data, and any path where a user needs to see their own change immediately should read the source of truth instead.',
    },
    selfCheck: {
      q: 'Why can a search index find "running shoes" when the document says "run shoe", but a database LIKE query cannot?',
      answer:
        'Because both the document and the query passed through the same analysis before matching. The indexer split the text, lowercased it, and stemmed each word to a root, so the document was stored under "run" and "shoe". At query time the same steps turn "running shoes" into the same two tokens, and they match exactly. A LIKE query compares raw characters, so "running" and "run" are simply different strings — and worse, a leading-wildcard LIKE cannot use a B-tree index at all, so it degrades into scanning every row. The search engine also returns results ranked by how well they match, whereas LIKE gives you an unordered set of rows that happened to contain a substring.',
    },
    traps: [
      'Making the search index the source of truth. It is derived data and it will drift.',
      'Dual writes from the application to the database and the index.',
      'Deep pagination with large offsets, which gets quadratically worse across shards.',
      'Over-sharding a small index and making every query slower for nothing.',
    ],
    sayThis:
      '"Postgres stays the source of truth; the search index is fed by CDC and holds whole documents, so reindexing is idempotent. Ranking is BM25 plus popularity and stock. Cost: about a second of lag, so a user searching for something they just created may not find it — I read their own items from the database instead."',
    related: ['indexes', 'change-data-capture', 'caching'],
  },

  {
    slug: 'distributed-counter',
    title: 'Distributed counters',
    tier: 3,
    oneLine: 'Counting is easy until everyone counts the same thing at once.',
    problem: [
      'A view count, a like count, a rate meter. One row and an increment works fine — until thousands of writers hit the same row, and they all queue behind the same lock.',
      'The row becomes a hot spot, and the fix depends entirely on whether the number has to be exact.',
    ],
    cost: 'Every technique here trades exactness or freshness for throughput. Sharded counters make reads more expensive because you must sum the shards. Approximate structures give you a number that is close but wrong. Batching in memory means losing the last few seconds of counts if a process dies. Pick which of those you can live with and say so.',
    useWhen: [
      'Any counter with high write concurrency: views, likes, impressions, rate limits.',
      'Analytics aggregates where a small error is invisible.',
      'Distinct counts over huge streams — unique visitors — where exactness is not worth the memory.',
    ],
    avoidWhen: [
      'The count is a resource under contention — remaining seats, stock, account balance. That is not a counter problem, it is a transaction problem, and approximation is not on the table.',
      'Low write volume. One row and an increment is correct and simple.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'One row versus 100 shards, same 50,000 increments a second.',
        items: [
          { label: 'Single row — all writers queue on one lock', value: 500, display: '~500/sec before it collapses', tone: 'bad' },
          { label: '100 shard rows — contention divided', value: 50000, display: '~50,000/sec, reads sum 100 rows', tone: 'accent' },
        ],
        note: 'The write problem became a read problem. That is the trade: reads now sum 100 rows, so cache the total and refresh it every few seconds.',
      },
    },
    body: [
      'Sharded counters are the standard answer. Instead of one row, keep N rows for the same logical counter and have each writer increment a random one. Contention drops by roughly N. Reading means summing N rows, which you then cache — so the displayed number is a couple of seconds old, which for a view count nobody can tell.',
      'Write batching goes further: each application server keeps a local count in memory and flushes it every second or two as a single increment. A thousand increments become one write. The cost is explicit — if the process dies you lose whatever it had not flushed. For view counts that is fine; say it out loud rather than hoping nobody asks.',
      'For counts over time windows, a probabilistic structure is often right. HyperLogLog estimates distinct counts — unique visitors today — in about 12 KB with roughly 2% error, regardless of whether you saw a thousand items or a billion. Count-min sketch finds heavy hitters, which is how you detect a hot key or an abusive caller without tracking every one.',
      'The distinction that decides everything: is this number a display or a decision? A like count is a display, so approximate and slightly stale is correct engineering. Remaining tickets is a decision, and it must be exact at the moment of commit — enforced by a conditional update or a constraint, not by a counter you read and then trust. Systems get this wrong by treating inventory as a counter, and it is how things get oversold.',
      'A middle case worth knowing: something that is a decision but not per-item, like a rate limit. There an approximate count is usually acceptable — letting through 105 requests instead of 100 harms nobody — so you can shard or batch, as long as you are deliberate about the direction of the error.',
    ],
    followUp: {
      q: '"Your view counter is a single row and a post goes viral. What happens?"',
      answer:
        'Every increment for that post serialises on one row lock, so throughput collapses to what one lock can process, latency climbs, and connections pile up waiting — and because those connections come from a shared pool, the damage spreads to endpoints that have nothing to do with view counts. That is the part worth naming: a hot row does not just make counting slow, it takes down neighbouring features. The fix is to stop making them contend: batch increments in memory on each server and flush every second, and spread the persisted counter over N shard rows so writers do not queue on one. Reads sum the shards and get cached for a few seconds. The costs are that the number can be a few seconds stale and I lose unflushed counts if a server dies mid-flush — both entirely acceptable for views, and both things I would refuse to accept for inventory.',
    },
    selfCheck: {
      q: 'When is a sharded counter the wrong answer? Give the specific case.',
      answer:
        'When the number gates a decision that must be exact — remaining seats, stock on hand, an account balance. With sharded counters the true total is only knowable by summing all shards, and between reading the sum and acting on it the value can change, so two people can both see "1 left" and both proceed. Approximation is also not the real problem there; the real problem is that the check and the commit must be one atomic operation. So for those you use a single authoritative row with a conditional update — decrement where remaining is greater than zero — or a unique constraint on the specific seat, and you accept that this path has a throughput ceiling. That ceiling is usually fine, because there are only so many seats. Sharding is for numbers you display, not numbers you spend.',
    },
    traps: [
      'Treating inventory as a counter. It is a contended resource.',
      'Reading a total by summing shards on every request instead of caching it.',
      'Losing in-memory batches with no acknowledgement that it happens.',
    ],
    sayThis:
      '"View counts batch in memory per server, flush every second into one of 50 shard rows, and the displayed total is a cached sum refreshed every few seconds. Cost: the number is a couple of seconds stale and a crash loses under a second of counts. I would not use any of this for remaining tickets — that needs one row and a conditional update."',
    related: ['rate-limiting', 'partitioning', 'caching'],
  },
]
