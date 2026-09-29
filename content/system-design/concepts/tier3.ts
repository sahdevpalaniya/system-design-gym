import type { Concept } from '@/lib/types'

/**
 * Tier 3 — patterns that keep showing up.
 *
 * House style: short sentences, everyday words, one idea per sentence.
 */
export const TIER3: Concept[] = [
  {
    slug: 'rate-limiting',
    title: 'Rate limiting',
    tier: 3,
    oneLine: 'Say no cheaply, before the expensive part of your system finds out.',
    problem: [
      'Any public endpoint will be hit harder than you planned. It might be a buggy client stuck in a retry loop, a scraper, or someone attacking you. With no limit, one caller can use up everything and everyone else is down.',
      'A rate limiter rejects the extra requests at the edge, where rejecting is cheap, instead of letting them reach a database, where they are expensive.',
    ],
    cost: 'You will sometimes reject real traffic, and it hits your biggest customers hardest, along with anyone behind a shared IP address: an office, a university, a mobile network. You need somewhere to keep the counters. If that store is shared, it is now on the path of every request. If it is per server, your real limit is the configured limit times the number of servers.',
    useWhen: [
      'Every public API. This is a default.',
      'Expensive endpoints: search, exports, anything calling a paid third party.',
      'Login and password reset, where the limit is a security control, not a capacity one.',
      'Protecting something downstream that cannot grow as fast as you can.',
    ],
    avoidWhen: [
      'Calls between your own services, where a circuit breaker and a timeout fit better.',
      'When the real fix is more capacity. A limiter should stop abuse, not paper over a system that cannot serve its real users.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'rate-limit',
        caption:
          'The bucket refills at a steady rate. A request takes a token, or it is rejected at the edge, before it costs anything.',
      },
    },
    body: [
      'Token bucket is the default, and it is worth being able to describe in one sentence. Tokens are added at a fixed rate up to a maximum. Each request takes one. A request that finds no token is rejected. The bucket size is how big a burst you allow. The refill rate is the steady limit. That burst allowance is why it suits real traffic, which arrives in clumps.',
      'Fixed window means counting per minute and resetting on the minute. It is the easiest to build and it has an obvious flaw. A caller can spend the whole allowance at 10:59:59 and the whole allowance again at 11:00:00, so a 100-per-minute limit allows 200 in one second. A sliding window log keeps every request timestamp and is exact, at the cost of memory that grows with traffic. A sliding window counter blends the current and previous windows in proportion. It is nearly as accurate for a fraction of the memory, which makes it a common production choice.',
      'Where to put it: at the edge or the gateway, so rejected traffic never reaches your services. Per-server counters are simple, and they let a spread-out caller get N times the limit. A shared counter in Redis is accurate, and adds a hop plus a dependency to every request. That means you need a decision: if Redis is down, do you reject everything or allow everything? Usually allow, because a limiter outage should not become a site outage. Say that out loud. It is a deliberate choice, and it has a security cost.',
      'What you limit by matters more than the algorithm. By API key or user id is right for logged-in traffic. By IP is the fallback for anonymous traffic, and it punishes shared networks. Layered limits work well: one per user, one per IP, and a global ceiling that protects the system whatever happens.',
      'Be a good citizen when you reject. Return 429, include a Retry-After header, and document the limits. A client that knows when to come back stops hammering you. One that gets a bare error retries immediately and makes it worse.',
    ],
    followUp: {
      q: '"A legitimate customer hits the limit during their busiest hour. What do you do?"',
      answer:
        'Short term, raise their limit. Which means limits have to be per-key configuration, not a constant in the code, and that is a decision to make on day one. Then work out whether it was abuse, or whether my limit is simply wrong for how the product is used. If several customers hit it during a normal peak, the limit is the bug. Longer term I would rather shape traffic than reject it: queue the extra and process it slightly slower, or return a partial result, because a slow answer beats an error for most APIs. I would also split the limits by cost. A cheap read endpoint and an expensive export should not share a budget, or one burst of exports locks the customer out of everything. And I would make the 429 useful: Retry-After, plus headers showing how much quota is left, so a well-written client manages itself instead of finding out by failing.',
    },
    selfCheck: {
      q: 'Your limit is 100 requests per minute using a fixed window. How can a caller legitimately send 200 requests in one second, and which algorithm fixes it?',
      answer:
        'By sending 100 at 10:59:59.5 and another 100 at 11:00:00.1. Each window is separately within the limit, but the burst crosses the boundary, so the service downstream sees 200 in under a second: the burst the limit was there to prevent. A sliding window fixes it. Either keep an exact log of request timestamps, or use the counter version that weights the previous window by how much of it still overlaps the last 60 seconds. The counter version is the practical choice: close enough to exact, and its memory does not grow with traffic.',
    },
    traps: [
      'Limiting by IP only, then blocking an entire office.',
      'A shared counter with no answer for what happens when it is down.',
      'Returning a bare 429 with no Retry-After, which teaches clients to retry immediately.',
    ],
    sayThis:
      '"Token bucket at the gateway, keyed by API key with a per-IP fallback, counters in Redis with a sliding window. Burst of 100, sustained 20 a second. If Redis is unavailable I allow the traffic and rely on a rough per-server limit. A limiter outage should not take the API down, and I am accepting the abuse window that creates."',
    related: ['load-balancing', 'circuit-breakers', 'distributed-counter'],
    refs: [
      {
        label: "RFC 6585 \u2014 Additional HTTP Status Codes",
        href: "https://datatracker.ietf.org/doc/html/rfc6585",
        note: "Where 429 Too Many Requests is defined, along with Retry-After.",
      },
    ],
    hints: [
      "Draw the window boundary. Put requests at the very end of one window and the very start of the next.",
      "Both bursts are legal in their own window. How far apart in real time are they?",
      "The fix stops treating time as fixed buckets.",
    ],
  },

  {
    slug: 'consistent-hashing',
    title: 'Consistent hashing',
    tier: 3,
    oneLine: 'Add or remove a machine and move only a small slice of the keys, not all of them.',
    problem: [
      'The obvious way to spread keys across servers is to hash the key and take the remainder by the server count. It spreads evenly, and it has one fatal property. Change the server count and almost every key maps somewhere new.',
      'For a cache that means nearly every request misses, at the exact moment you were adding capacity. For a datastore it means moving nearly all your data. Consistent hashing makes the change proportional instead.',
    ],
    cost: 'It is more complex than a remainder, and someone has to maintain the ring: which nodes exist, and getting every client to agree on that view. Plain consistent hashing also spreads unevenly, so you need virtual nodes to fix it, which is more bookkeeping. And it still does nothing about one key being hot. It balances keys, not traffic.',
    useWhen: [
      'A cache cluster whose size changes. This is the classic case.',
      'Sharded datastores where you want to add machines without a full reshuffle.',
      'Sending users to a specific server, so their connection or their cached data stays put.',
    ],
    avoidWhen: [
      'A fixed set of shards that never changes. A plain remainder is simpler, and simpler wins.',
      'When you can use the pre-sized logical partition trick instead (1024 partitions mapped onto N machines), which is often easier to think about and to run.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Going from 4 servers to 5. How many keys have to move?',
        items: [
          { label: 'hash(key) % N', value: 80, display: '~80% of keys move', tone: 'bad' },
          { label: 'Consistent hashing', value: 20, display: '~20% of keys move (1/N)', tone: 'accent' },
        ],
        note: 'With a remainder, a key that hashed to 7 moves from server 3 to server 2 for no reason except that the divisor changed. Consistent hashing only reassigns the slice the new server takes over.',
      },
    },
    body: [
      'The idea: picture the hash space as a circle. Each server sits on the circle at a few positions, decided by hashing its name. A key is hashed onto the same circle, and belongs to the first server clockwise from it. Add a server and it takes over only the arc just behind its positions. Every other key keeps its home. Remove a server and its arc goes to the next server clockwise.',
      'Virtual nodes are not optional. With one position per server, the arcs come out badly uneven, and some servers get twice the keys of others. Worse, removing a server dumps its whole load onto one neighbour. Give each server one or two hundred positions and both problems go away. Load evens out, and a departing server\'s keys spread across all the remaining ones. It also lets you give a bigger machine more positions, and so more work.',
      'What it does not solve: one key that everyone wants. Consistent hashing decides where a key lives. If that one key gets a million requests a second, its server is hot no matter how neatly you assigned it. That needs the hot key copied to several places, or a separate path. This difference is a common follow-up question.',
      'Where you will meet it: memcached client libraries, Cassandra and Dynamo-style stores for assigning partitions, and layer 7 load balancers routing by session or by cache affinity.',
    ],
    followUp: {
      q: '"You add a cache node. What happens to your database in the next minute?"',
      answer:
        'It takes a spike, and the question is really about the size of that spike. With remainder hashing, roughly every key just moved, so nearly every request is a miss and the database briefly takes the full read load. At the ratios that made me add a cache in the first place, that may take it down. That is a painful way to fail: your capacity increase caused the outage. With consistent hashing, only about one in N keys moves, so I get a small, survivable spike of misses. Either way I would not just add the node and hope. Bring it in during quiet traffic, warm it first if I can, and make sure misses on the same key are coalesced, so one cold key means one database read instead of ten thousand.',
    },
    selfCheck: {
      q: 'Why are virtual nodes necessary? Name the specific failure they prevent.',
      answer:
        'They prevent two failures. First, uneven spread. With one position per server, the gaps between random points on a circle vary a lot, so some servers end up with far more keys than others, and you get a hot machine purely by luck. Second, and worse, a cascade when a server is removed. With one position each, everything belonging to a dead server passes to the single next server clockwise, which now has double the load, which may kill it too, and its load passes on again. With a couple of hundred virtual positions per server, a dead server\'s keys spread across every remaining server in small pieces, so the extra load is a manageable fraction instead of a doubling.',
    },
    traps: [
      'Describing the ring but leaving out virtual nodes. The balancing behaviour depends on them.',
      'Claiming it solves hot keys. It does not.',
      'Using it where a fixed partition count would have been simpler.',
    ],
    sayThis:
      '"Consistent hashing with about 150 virtual nodes per server, so adding a cache node moves roughly a fifth of the keys instead of all of them, and losing one spreads its load across everyone rather than doubling its neighbour. Cost: a ring the clients have to agree on, and it still does not help if one key is hot."',
    related: ['partitioning', 'caching', 'load-balancing'],
    refs: [
      {
        label: "Consistent hashing",
        href: "https://en.wikipedia.org/wiki/Consistent_hashing",
        note: "The original technique and the virtual-node refinement that makes it usable.",
      },
    ],
    animation: {
      scenario: "consistent-hash-ring",
      caption: "The ring: adding a node moves only the keys between it and its neighbour, instead of reshuffling everything.",
    },
    hints: [
      "Put three nodes on a ring by hashing their names. Are the gaps between them equal?",
      "Now remove one node. Who inherits all of its keys, and how loaded is that neighbour now?",
    ],
  },

  {
    slug: 'bloom-filters',
    title: 'Bloom filters',
    tier: 3,
    oneLine: 'A tiny structure that says "definitely not here" or "probably here", and never the wrong way round.',
    problem: [
      'Sometimes the expensive part is finding out that something does not exist. Checking whether a username is taken, or whether a key is in a store, can mean a disk read or a network call for an answer that is usually "no".',
      'A bloom filter answers that in memory, in a few microseconds, using a small fraction of the space the real data takes.',
    ],
    cost: 'It can say yes when the answer is no. Those are false positives, so every yes has to be checked against the real store. It can never say no when the answer is yes, which is what makes it safe. You cannot delete from a standard bloom filter, and you cannot list what is in it. And the false positive rate rises as you add items, so a filter sized for a million entries gets bad at ten million.',
    useWhen: [
      'Avoiding pointless lookups for keys that mostly do not exist.',
      'Stopping cache penetration, where requests for ids that do not exist hit the database every time.',
      'Storage engines checking whether a key might be in a given file before reading it. This is standard in LSM-tree databases.',
      'Removing duplicates from a huge stream, where an occasional wrong "seen this" is acceptable.',
    ],
    avoidWhen: [
      'A false positive is expensive or unsafe. Never use one as the final word on anything.',
      'The set is small enough to hold in a normal hash set. Then just do that.',
      'You need deletion, counting, or a list of members. A counting bloom filter handles deletion, using more space.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Hash the key three ways. If any bit is 0, it is definitely absent, answered in memory with no disk touched. If all are 1, it is probably present, so go and check.',
        nodes: [
          { id: 'k', label: 'Lookup key', kind: 'client', col: 0, row: 0 },
          { id: 'b', label: 'Bloom filter', sub: '~1.2 MB for 1M keys', kind: 'cache', col: 1, row: 0 },
          { id: 'd', label: 'Database', kind: 'store', col: 2, row: 0 },
          { id: 'n', label: 'a 0 bit anywhere ends the lookup here: no network, no disk', kind: 'note', col: 1, row: 1, span: 2 },
        ],
        edges: [
          { from: 'k', to: 'b' },
          { from: 'b', to: 'd', label: 'only if maybe' },
        ],
      },
    },
    body: [
      'How it works. You have an array of bits, all zero, plus k different hash functions. To add an item, hash it k ways and set those k bits to 1. To test an item, hash it k ways and look. If any bit is still 0, it was definitely never added. If all bits are 1, it was probably added, or those bits happened to be set by other items. That second case is the false positive.',
      'The size intuition worth remembering: about 10 bits per item gives roughly a 1% false positive rate. So a million keys cost around 1.2 MB. The real set of a million 20-byte usernames, plus index overhead, is tens of megabytes and lives on disk. That ratio is why the filter is worth having.',
      'You get to choose two of three: how many items you expect, the false positive rate you accept, and the memory. Fix two and the third follows. Size it for the number you expect at the end of its life, not the number today.',
      'The cache penetration case is the one to raise without being asked. Requests for ids that do not exist cannot be cached, because there is nothing to store, so each one reaches the database. Someone probing random ids drives your miss rate to 100%. A bloom filter of all existing ids stops almost all of them in memory. The cost is that the filter has to keep up with new inserts. A newly created id is briefly missing from the filter and gets wrongly rejected, which is why you add to the filter on write. Deleted ids stay in the filter and only cause false positives, so a common approach is to rebuild the filter now and then.',
      'Relatives worth naming in one line each. Counting bloom filters support deletion by using small counters instead of single bits. HyperLogLog estimates how many distinct items you have seen, in about 12 KB. A cuckoo filter supports deletion and is often smaller at low error rates.',
    ],
    followUp: {
      q: '"What happens when the bloom filter says yes but the item does not exist?"',
      answer:
        'You do the lookup you were trying to avoid, find nothing, and return not-found. So it costs you one wasted query and nothing else. That is the deal: the filter is a speed-up, never an authority, and the code behind it has to be correct on its own. At a 1% false positive rate, I have removed 99% of the pointless lookups, and that is the win. The dangerous direction would be the other one, saying no about something that exists, and a bloom filter, by design, cannot do that, because an item that was added always has its bits set. That one-sidedness is the reason it is safe to put in front of a correctness-sensitive path at all.',
    },
    selfCheck: {
      q: 'Can a bloom filter ever say "not present" about something that is present? Why does the answer decide where you are allowed to use one?',
      answer:
        'No. Adding an item sets its bits, and nothing ever clears them. So if it was added, all its bits are 1 and the test passes. The only error is a false positive. That one-sidedness is what makes it usable as a gate in front of expensive work. A "no" is trustworthy enough to skip the lookup completely, and a "yes" just means doing the work you would have done anyway. If it could produce false negatives you could not use it for anything real, because you would sometimes tell a user their data does not exist when it does. It also explains the deletion restriction. Clearing bits for a removed item would clear bits shared with items that are still there, and that is how you would create false negatives.',
    },
    traps: [
      'Treating a positive as an answer instead of a hint.',
      'Sizing for today\'s data, then watching the error rate climb.',
      'Trying to delete from a standard filter and creating false negatives.',
    ],
    sayThis:
      '"A bloom filter of existing ids in front of the cache, about 1.2 MB per million keys at a 1% error rate, so lookups for ids that never existed die in memory instead of hitting the database. Cost: 1% of real lookups do a pointless query, and new ids must be added to the filter on write."',
    related: ['caching', 'indexes', 'search-indexing'],
    refs: [
      {
        label: "Redis \u2014 Bloom filters",
        href: "https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/",
        note: "A production implementation, with the error-rate and capacity knobs exposed.",
      },
      {
        label: "Bloom filter",
        href: "https://en.wikipedia.org/wiki/Bloom_filter",
        note: "The maths for choosing size and hash count against a false-positive rate.",
      },
    ],
    hints: [
      "Think about what a set bit means, and whether a bit can ever be un-set by accident.",
      "One direction of the answer is certain and the other is a guess. Which is which decides whether you can use it as a gate.",
    ],
  },

  {
    slug: 'write-ahead-log',
    searchTitle: "Write-ahead log (WAL)",
    title: 'Write-ahead logs',
    tier: 3,
    oneLine: 'Write down what you are about to do, before you do it, so a crash cannot lose it.',
    problem: [
      'Changing data in place is not all-or-nothing. The machine can lose power halfway through, leaving something that is neither the old version nor the new one. That is corrupted, not merely out of date.',
      'A write-ahead log fixes it. You record the change you intend to make into an append-only file, and only then apply it. After a crash you replay the log and end up in a sensible state.',
    ],
    cost: 'Every write happens twice, once to the log and once to the data, so you pay in disk speed and space. The log has to be trimmed, or it grows forever. Recovery time depends on how much of the log is unapplied, so rare checkpoints mean fast writes and slow restarts. And a truly durable write means a real fsync, which is far slower than a write that only reached the operating system\'s buffer.',
    useWhen: [
      'Anything that must survive a crash without corruption. This is why every serious database has one.',
      'You want sequential writes instead of scattered ones. Appending is much faster on spinning disks, and still faster on SSDs.',
      'You need a stream of changes for replication or change data capture. The log already is that stream.',
    ],
    avoidWhen: [
      'Data you can afford to lose or rebuild: a cache, derived state, a scratch index. Paying twice for safety you do not need is waste.',
      'You are using a database. It already has one. You are not building this yourself.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The log is appended and flushed first. Only then is the change applied. A crash between the two is recoverable. A crash without the log is not.',
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
      'The rule is in the name. The log entry must be safely on disk before the change it describes is applied. Get that order wrong and the log protects nothing.',
      'Recovery works like this. On restart, find the last checkpoint, replay every log entry after it, and throw away any half-written entry at the end. That last part is why entries carry a checksum. Committed transactions are redone. Uncommitted ones are dropped.',
      'Checkpointing is the knob you turn. A checkpoint flushes the current state to the data files and marks that point in the log, so everything before it can be deleted. Frequent checkpoints mean fast recovery and steady disk work. Rare ones mean fast writes day to day, and a restart that can take a long time. Name that trade, because "how long does recovery take" is an operational question that is easy to forget.',
      'The word to be precise about is fsync. A normal write hands the data to the operating system, which may hold it in memory for a while. That is fast, and lost in a power cut. fsync forces it onto the physical device and is far slower. Group commit is the standard trick: batch many transactions into one fsync, so overall throughput rises and each individual transaction waits a little longer.',
      'The log is useful beyond crash recovery, and this is the part to carry into other designs. It is an ordered record of every change. Ship it to another machine and that is replication. Read it and that is change data capture. Event sourcing is the same idea moved up to the application level: store the events, work out the state from them. LSM-tree storage engines go further. Writes go to the log and to an in-memory table, which is later flushed into sorted files. That makes writes sequential and fast, at the cost of reads having to check several files. Per-file bloom filters let a read skip most of them.',
    ],
    followUp: {
      q: '"How much data can you lose if the machine loses power right now?"',
      answer:
        'Whatever was confirmed but not yet fsynced. So the answer depends on a setting, not on the architecture. If I fsync the log on every commit, I lose nothing that was confirmed, at the cost of a real disk sync per transaction, which limits write throughput. If I fsync on a timer, say every 100 ms, writes are much faster and I can lose up to that window of confirmed writes in a power cut. Group commit gets me most of both: batch the transactions happening at the same moment into one fsync, so throughput is high and each commit still waits for a real sync. The point I would make in an interview is that this is a product decision, not a database one. For payments I take the fsync-per-commit cost. For view counts I absolutely do not. And on a single machine, an fsynced log still does not survive the disk itself failing. That needs the log copied to another machine before confirming, which trades latency for surviving hardware loss instead of only power loss.',
    },
    selfCheck: {
      q: 'Why write everything twice? Explain the benefit in one sentence.',
      answer:
        'Because the first write is sequential, cheap, and easy to check for completeness, so the second one can then be done lazily and in batches without risking correctness. You get durability at the speed of an append, rather than at the speed of a safe in-place update. The crash-safety part is the headline: appending a complete entry with a checksum either lands or does not, whereas overwriting a page in place can leave it half written and unreadable. The speed part is why people are happy to pay for it: many scattered updates become one sequential append plus a batched flush later.',
    },
    traps: [
      'Describing the log but applying the change first. The mechanism depends on that order.',
      'Confusing a write with a durable write. Without fsync, "committed" means "in memory somewhere".',
      'Forgetting checkpointing, then being surprised that recovery takes 40 minutes.',
    ],
    sayThis:
      '"Writes go to an append-only log, fsynced with group commit, then applied. Cost: every byte is written twice, and I have to checkpoint or recovery time grows without limit. The bonus is that the log is already the replication stream and the CDC feed."',
    related: ['replication', 'change-data-capture', 'bloom-filters'],
    refs: [
      {
        label: "PostgreSQL \u2014 Write-Ahead Logging",
        href: "https://www.postgresql.org/docs/current/wal-intro.html",
        note: "WAL as actually implemented, including why it makes both durability and replication possible.",
      },
    ],
    hints: [
      "Ask what state the data file is in if the machine loses power halfway through updating it.",
      "The log is append-only and sequential. Why does that make it both faster and safer to write first?",
    ],
    animation: {
      scenario: "wal-append",
      caption: "Why writing twice is faster, not slower: the sequential log append is what makes the write durable, so the client is told yes long before the data file is touched.",
    },
  },

  {
    slug: 'cdn',
    searchTitle: "CDN (content delivery network)",
    title: 'CDNs',
    tier: 3,
    oneLine: 'Put copies of your static content near users, so most requests never reach you.',
    problem: [
      'A user 15,000 km from your servers pays 150 ms per round trip, no matter how fast your code is. For a page pulling 60 images, scripts and fonts, those round trips dominate the load time.',
      'A CDN keeps copies at hundreds of locations around the world, so those requests are answered a few milliseconds away. And your origin stops serving the great majority of its traffic.',
    ],
    cost: 'You now have copies of your content everywhere, and clearing them is not instant. A bad deploy or a wrong image can stay live for minutes. Getting cache headers wrong can produce the worst bug in this area: a private response cached and then served to a different user. You pay for bandwidth. And debugging is harder, because the answer depends on which edge location the user reached.',
    useWhen: [
      'Any static file: images, video, CSS, JavaScript, fonts. This is a default.',
      'Public API responses that are the same for everyone and change slowly.',
      'Large downloads, where the bandwidth out of your origin is the real cost.',
      'Soaking up traffic spikes and flood attacks before they reach you.',
    ],
    avoidWhen: [
      'Personalised or logged-in responses, unless you are extremely careful about cache keys and Vary headers.',
      'Data that has to be current to the second.',
      'Write traffic. A CDN only helps reads.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The edge answers most requests locally. The origin only sees the misses, often under 5% of total traffic for static content.',
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
      'Cache headers decide whether any of this works. Cache-Control max-age says how long the edge and the browser may serve it without asking again. s-maxage applies to the CDN only, so you can let the edge hold something for an hour while browsers hold it for a minute. stale-while-revalidate lets the edge serve a slightly old copy while it fetches a fresh one in the background. That removes the slow request at expiry time, and it is an often overlooked directive.',
      'The versioned-filename pattern solves invalidation properly, and it should be your default answer. Give every build file a content hash in its name, like app.9f3a2c.js, and set a one-year cache that never changes. The file never changes, so it never needs clearing. A deploy publishes new filenames, and the HTML that points at them is the only thing with a short TTL. Then clearing the cache becomes something you almost never do, which matters, because clearing worldwide takes time and is the slow path.',
      'Private data at the edge is the failure to watch for. If a response differs per user, the cache key must include whatever it differs by, or two users share one response. Mark logged-in responses private or no-store, and set Vary deliberately. One wrong header here leaks one customer\'s data to another.',
      'Beyond static files, most CDNs will also end TLS near the user, so the handshake round trips go to a nearby edge instead of the distant origin. They absorb flood attacks. And they run small pieces of code at the edge, for routing, login checks and A/B assignment, keeping those decisions close to the user.',
      'For video, the CDN is not a speed-up but the delivery method itself. The file is cut into short segments at several quality levels, and the player picks a level per segment based on the bandwidth it measures. Every one of those segments is a cacheable static file, which is why this design suits a CDN so well.',
    ],
    followUp: {
      q: '"You deployed a bad image and it is cached worldwide. How fast can you fix it?"',
      answer:
        'It depends on choices I made before the incident. If files are content-hashed, this is barely an incident. The new deploy points at a new filename, the HTML has a short TTL, and users get the right file within a minute without clearing anything. If the file sits at a fixed path with a long TTL, I have to purge it, and that spreads across hundreds of locations, taking anywhere from seconds to minutes depending on the provider. Some clients will also keep serving it from their own browser cache whatever I do at the edge, and I cannot purge that at all. That last part is why long browser TTLs on unversioned paths are a trap. The lesson I would carry into the design: version the files, keep the HTML TTL short, and treat purging as an emergency tool, not a normal workflow.',
    },
    selfCheck: {
      q: 'What is the one type of response you must be most careful about caching at the edge, and what specifically goes wrong?',
      answer:
        'Anything personalised or logged-in. What goes wrong is disclosure, which is far worse than old data. The edge stores the response for a URL, and the next person asking for that URL gets the first user\'s data: their name, their orders, their balance. The URL was the same, so the cache did what it was told. The defences are to mark those responses private or no-store, and where you do want to cache per user, to put the identity into the cache key on purpose rather than hoping Vary covers it. This is the CDN mistake with real consequences. The rest are just performance bugs.',
    },
    traps: [
      'Assuming a purge is instant everywhere. It is not, and browser caches are out of your reach entirely.',
      'Caching a logged-in response with no per-user cache key.',
      'Long TTLs on unversioned filenames, which makes every mistake expensive to fix.',
    ],
    sayThis:
      '"Static files get a content hash in the filename and a one-year immutable cache, so I never purge. The HTML has a 60-second TTL with stale-while-revalidate. Logged-in responses are no-store. Cost: bandwidth, and any mistake on a non-versioned path takes minutes to undo worldwide."',
    related: ['caching', 'latency-numbers', 'realtime-transports'],
    refs: [
      {
        label: "MDN \u2014 HTTP Caching",
        href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching",
        note: "Cache-Control, s-maxage and stale-while-revalidate explained header by header.",
      },
      {
        label: "RFC 9111 \u2014 HTTP Caching",
        href: "https://www.rfc-editor.org/rfc/rfc9111.html",
        note: "The specification behind those headers, for when a colleague insists otherwise.",
      },
    ],
    animation: {
      scenario: "cdn-pull",
      caption: "Pull CDN: the first request for an object misses and fetches from origin; every later request in that region is served at the edge.",
    },
    hints: [
      "Ask what the cache key is. Usually just the URL \u2014 so what happens when two different people request the same URL?",
      "The damage here is not staleness. Say out loud what the second user sees.",
    ],
  },

  {
    slug: 'geospatial-indexing',
    title: 'Geospatial indexing',
    tier: 3,
    oneLine: 'Turn "near me" into a range query, because databases cannot sort by two dimensions at once.',
    problem: [
      'An index sorts on one axis. Location has two, and "everything within 3 km of here" is not a range on either of them. Filter by latitude and you get a band that circles the whole planet.',
      'Geospatial indexes solve this by mapping two dimensions onto one, in a way that keeps nearby things nearby. Then closeness becomes a lookup you can index.',
    ],
    cost: 'The mapping is rough at the edges. Two points a metre apart can land in different cells, so you have to search the neighbouring cells too and then filter by real distance. Cell size is a tuning problem that changes with density: a size that works in a village is wrong in a city centre. And the results always need a final exact-distance pass, because cells are squares and your query is a circle.',
    useWhen: [
      'Find things near a point: drivers, restaurants, stores, users.',
      'Matching supply to demand by location.',
      'Taking in a stream of location updates and answering nearby queries over it.',
      'Checking whether a point is inside a region, like a delivery zone.',
    ],
    avoidWhen: [
      'Small datasets. Scanning ten thousand rows and computing distance is fast, and far simpler.',
      'The result depends on travel time rather than straight-line distance. Then geospatial indexing narrows the candidates, and a routing service ranks them.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Geohash: the map is split into a grid, each cell gets a string, and nearby places share a prefix, so "near me" becomes a prefix scan.',
        nodes: [
          { id: 'p', label: 'lat, lng', kind: 'client', col: 0, row: 0 },
          { id: 'g', label: 'geohash', sub: 'tdr1y7', kind: 'service', col: 1, row: 0 },
          { id: 'i', label: 'Index', sub: 'prefix tdr1y*', kind: 'store', col: 2, row: 0 },
          { id: 'f', label: 'Exact distance', sub: 'filter + sort', kind: 'service', col: 3, row: 0 },
          { id: 'n', label: 'also scan the 8 neighbouring cells: a point near an edge may not be in your cell', kind: 'note', col: 0, row: 1, span: 4 },
        ],
        edges: [
          { from: 'p', to: 'g' },
          { from: 'g', to: 'i' },
          { from: 'i', to: 'f' },
        ],
      },
    },
    body: [
      'Geohash is the one to explain, because it is simple and widely used. Repeatedly cut the world in half: left or right of the middle, top or bottom. Record each choice as a bit, then encode those bits as characters. A longer string means a smaller box. Five characters is about 5 km, six is about 1 km, seven about 150 m. Because the start of the string encodes the rough position, points that share a prefix are in the same region. So a nearby search is a prefix range scan on an ordinary B-tree index.',
      'There is a catch to mention before the follow-up finds it. Two points on either side of a cell boundary can be 10 metres apart and share no prefix. So you always query your cell plus its eight neighbours, then work out the real distances and filter. Skipping the neighbours gives you a system that misses the closest result, which is a bad bug in a ride-hailing product.',
      'A quadtree splits space as needed: a cell that gets too crowded divides into four. That handles very uneven density, city centre against countryside, better than a fixed grid. The price is a tree you have to maintain, which is more work when points move constantly. S2 and H3 are the production-grade versions. H3 uses hexagons, which have the nice property that all six neighbours are the same distance away, unlike a square with its mix of edges and corners.',
      'For moving objects the shape of the problem changes. Drivers report their position every few seconds, so writes hugely outnumber reads, and a tree that rebalances on every update is the wrong choice. The common answer is to keep current positions in memory, grouped by cell. A Redis sorted set per cell works. Accept that positions are a few seconds old, and treat the index as a filter that produces candidates, not as the answer.',
      'The last step is always the same. The index narrows millions down to dozens. Then you compute the real measure, actual distance or estimated arrival time from a routing service, and rank on that. Do not let the index decide the ranking.',
    ],
    followUp: {
      q: '"A driver is 100 metres away but in a different geohash cell. Do you find them?"',
      answer:
        'Only if I search the neighbouring cells, which is why that step is required and not an optimisation. A cell boundary is arbitrary, and the nearest driver is as likely to be just over it as inside it. So I query my cell plus the eight around it, combine the candidates, then compute true distances and sort. If the passenger is right at a corner I might widen further, and in an empty area I would step down to a shorter prefix, meaning bigger cells, until I have enough candidates. There is a second subtlety worth naming. I should rank by estimated arrival time, not straight-line distance, because a driver 100 metres away on the far side of a motorway with no crossing is much further away in practice than one 400 metres down the same road.',
    },
    selfCheck: {
      q: 'Why can you not just index latitude and longitude as two normal columns and query both?',
      answer:
        'Because a B-tree index on (lat, lng) is sorted by latitude first. It can narrow efficiently to a horizontal band of the earth, and within that band, the longitude ordering only helps for one exact latitude value, which is useless for a continuous coordinate. In practice the database picks the latitude range, gets a band circling the globe, and scans it filtering on longitude. It works, and it is far too slow at scale, because that middle result is enormous. The geospatial approach weaves the two dimensions into one sortable value, so a single range scan matches a compact area instead of a band.',
    },
    traps: [
      'Forgetting neighbouring cells and silently missing the nearest result.',
      'One fixed cell size everywhere, so city queries return 50,000 candidates and rural ones return none.',
      'Ranking by straight-line distance when the product needs arrival time.',
    ],
    sayThis:
      '"Geohash at 6 characters, roughly a kilometre, with current driver positions in a Redis sorted set per cell. A search reads my cell plus the eight neighbours, then ranks the candidates by estimated arrival time, not straight-line distance. Cost: positions are a few seconds old, and I need to widen the search in empty areas."',
    related: ['indexes', 'partitioning', 'caching'],
    refs: [
      {
        label: "H3 \u2014 Hexagonal hierarchical geospatial indexing",
        href: "https://h3geo.org/docs/",
        note: "Uber's grid system, built for exactly the matching problems this concept serves.",
      },
    ],
    hints: [
      "An index on two columns can narrow one range efficiently. What does it do with the second range?",
      "Picture the rows that satisfy the latitude range alone \u2014 a band across the whole world. How many are they?",
    ],
  },

  {
    slug: 'realtime-transports',
    searchTitle: "WebSockets vs SSE vs polling",
    subject: "WebSockets",
    title: 'Long polling vs WebSockets vs SSE',
    navTitle: 'Polling, WebSockets, SSE',
    tier: 3,
    oneLine: 'Three ways to push data to a browser, with very different costs at scale.',
    problem: [
      'HTTP is built around the client asking. For anything live (a score, a message, a cursor moving) you need the server to speak first, and there is no one obvious way to do that.',
      'The three practical options mostly differ in what they cost you per connected user, and that is the thing that decides the design.',
    ],
    cost: 'All of them mean holding connections open, so your servers now hold state in a way plain request-response does not. Load balancers have to handle long-lived connections. A deploy drops everyone at once, and they all reconnect together. And capacity is measured in connections at once, not requests per second. Every option needs a plan for reconnecting, and a way to catch up on what was missed while disconnected.',
    useWhen: [
      'Polling: updates are rare, or a delay does not matter. Often the right answer, and easy to overlook.',
      'SSE: server to client only. Notifications, live scores, progress, streaming text. It is plain HTTP and reconnects by itself.',
      'WebSockets: both directions and frequent. Chat, collaborative editing, games, live cursors.',
      'Long polling: you need push and cannot use the others. Mostly a fallback now.',
    ],
    avoidWhen: [
      'WebSockets for a feed that updates every 30 seconds. You are paying for a permanent connection to send almost nothing.',
      'SSE when the client also has to send often. It only goes one way.',
      'Any of them when a five-second poll would keep the user happy. Simplicity is worth real money here.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'Pick by direction and by frequency. Both of those change the cost per user.',
        a: {
          title: 'Server-Sent Events',
          points: [
            'One direction: server to client. The client still posts normally over HTTP.',
            'Plain HTTP, so proxies, compression and auth all behave normally.',
            'Reconnects by itself and sends Last-Event-ID, so the server can resume from where the client left off.',
            'Text only. Over HTTP/1.1, browsers allow about six connections per domain, shared across tabs. HTTP/2 lifts that limit.',
            'Right for: notifications, live scores, progress bars, streamed responses.',
          ],
        },
        b: {
          title: 'WebSockets',
          points: [
            'Both directions, and very little overhead per message once connected.',
            'Binary or text, and very low latency.',
            'You build reconnect, resume and heartbeats yourself.',
            'More infrastructure care: sticky routing, proxy config, capacity counted in connections.',
            'Right for: chat, collaborative editing, live cursors, games.',
          ],
        },
        verdict:
          'If the data only flows one way, use SSE. It is much less to run, and reconnection is free. Reach for WebSockets when the client also needs to send often. And check first whether a 5-second poll is fine. It often is, and it needs no new infrastructure.',
      },
    },
    body: [
      'Long polling works like this. The client makes a request. The server holds it open until there is something to say, or a timeout hits. Then the client immediately asks again. It works everywhere, and every message costs a full HTTP request cycle plus a reconnect.',
      'All three share the same scaling problem. With a million connected users you are holding a million connections, spread over servers that have to find each other. When user A sends a message to user B on a different server, something has to route it. That is usually a pub/sub layer, where each server subscribes to the channels its own users care about. That layer becomes your limit, and it is where the design work in live push goes.',
      'Deploys are the operational trap. Restart the fleet and every client reconnects at once. That is a stampede on connection setup and login, and it can be worse than the traffic you normally serve. The defences are reconnect with growing delays and randomness on the client, and rolling the fleet slowly instead of all at once.',
      'Messages missed while disconnected are a product requirement, not a transport feature. Whatever you choose, the client should reconnect with the last id it saw and get what it missed. That means the server keeps a short buffer per channel. SSE gives you the id mechanism for free. With WebSockets you build it.',
      'A useful hybrid: keep the live connection only for a small message saying "something changed", and have the client fetch the actual data over normal HTTP. The permanent connection carries tiny messages, the real payloads travel over cacheable requests, and you get most of the benefit for much less complexity.',
    ],
    followUp: {
      q: '"You have a million concurrent connections. What breaks first?"',
      answer:
        'Almost never the raw connection count on the machines. A tuned server handles a lot of idle sockets, and it comes down to memory per connection and file descriptor limits, which is a capacity planning question. What breaks first is usually the fan-out layer. When one event has to reach 100,000 subscribers spread over 200 servers, the pub/sub system doing that routing is the bottleneck, and one popular channel makes it much worse. The second thing to break is deploys. Restarting means a million reconnections and logins within a few seconds, a spike far bigger than normal traffic and entirely self-inflicted. Third is memory, if I am buffering per-connection state or missed messages. So I would group connections by channel, so a server holds users interested in the same things. Keep per-connection state tiny. Put a hard cap on buffered messages per client and drop the slow ones instead of growing without limit. And make clients reconnect with randomised, growing delays. Cost: grouping by channel means a user in many channels touches several servers, which makes routing more complex.',
    },
    selfCheck: {
      q: 'A dashboard updates once a minute. Which transport, and why not the other two?',
      answer:
        'Plain polling every 30 to 60 seconds. Not WebSockets: you would hold a permanent connection per user, take on sticky routing, reconnect logic and a fan-out layer, all to deliver one small message a minute. The operational cost is far out of proportion to the benefit. Not SSE either, for the same reason in a milder form. A held-open connection per viewer to send 60 bytes a minute, when a request every 30 seconds gets the same result with no new infrastructure, can be cached at the edge, and fails in ways your existing monitoring already understands. The general rule: permanent connections earn their cost when messages are frequent, or when latency matters to a person in the moment. Neither is true here.',
    },
    traps: [
      'Choosing WebSockets by default because it sounds more capable.',
      'No reconnect-and-catch-up story, so users silently miss messages.',
      'Forgetting that deploys disconnect everyone at the same moment.',
    ],
    sayThis:
      '"SSE, because updates only flow server to client and reconnection with last-event-id is built in. Connections are grouped by channel so one server holds the subscribers for a topic. Cost: I now have long-lived connections, so deploys need a slow roll and clients need randomised reconnect delays, or every restart is a self-inflicted spike."',
    related: ['load-balancing', 'message-queues', 'caching'],
    refs: [
      {
        label: "MDN \u2014 WebSockets API",
        href: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API",
        note: "The transport, its lifecycle, and what breaks through proxies.",
      },
      {
        label: "WHATWG \u2014 Server-sent events",
        href: "https://html.spec.whatwg.org/multipage/server-sent-events.html",
        note: "The SSE specification, including automatic reconnection and Last-Event-ID.",
      },
    ],
    hints: [
      "Once a minute is not a lot. Ask what a persistent connection is costing you between updates.",
      "Then ask which direction the data actually flows here. Do you ever need the client to push?",
    ],
  },

  {
    slug: 'change-data-capture',
    title: 'Change data capture',
    tier: 3,
    oneLine: 'Read the database\'s own log to find out what changed, instead of asking the application to tell you.',
    problem: [
      'Several systems usually need to know when data changes: a search index, a cache, a warehouse, another service. Making the application notify all of them means every write path has to remember, and one that forgets creates a mismatch that can go unnoticed for months.',
      'CDC takes the changes from the database\'s replication log instead. Nothing can be missed, because a change that is not in the log did not happen.',
    ],
    cost: 'The consumer sees database rows, so it is tied to your schema. Rename a column and something downstream breaks. It is asynchronous, so consumers are always a little behind. The log itself is ordered, but once changes are spread across stream partitions, ordering holds only per key. And it is real infrastructure to run: connectors, positions, schema handling, and a plan for a consumer that falls so far behind that the log it needs has already been deleted.',
    useWhen: [
      'Keeping a search index in step with a database.',
      'Clearing caches reliably, instead of hoping every write path remembers.',
      'Feeding a data warehouse without nightly full exports.',
      'Getting events out of a system you cannot change: an old application, a vendor database.',
      'Moving between databases, running both at once, with no downtime.',
    ],
    avoidWhen: [
      'The consumer needs business events rather than row changes. "Order shipped" is a decision. Three UPDATE statements are not, and working out the intent from row differences is fragile.',
      'You need the change applied immediately, in the same request.',
      'One application owns the write path and can emit clean events through an outbox. That is simpler, and it expresses intent properly.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The connector reads the replication log (the same stream the database uses for its own replicas), so no change can be missed.',
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
      'Log-based CDC is the good version. A connector pretends to be a replica and reads the write-ahead log, so it sees every change, including ones made by a script someone ran by hand. It puts little load on the database, and it is complete by design.',
      'The alternatives are worse, and worth being able to dismiss. Polling a modified-at column misses deletes completely, sees only the last version of a row updated twice between polls, and puts load on the database. Triggers that write to an audit table run inside the transaction, so they slow every write and can fail a transaction that would otherwise have succeeded.',
      'CDC against the outbox pattern is a common interview comparison. The outbox gives you planned business events, in a stable shape you control, and it needs the application to write them. CDC gives you every change with no application involvement, at the price of exposing your schema and losing intent. You can see status change from PAID to SHIPPED, but the reason lives in application code. My default: an outbox for events other services depend on, and CDC for keeping derived stores like search indexes and warehouses in step.',
      'Two operational details come up. First, the initial load. A new consumer needs the existing data as well as the changes, so you take a snapshot of the table, note the log position at that moment, and stream from there. Getting that boundary wrong means missing or duplicating a window of changes. Second, retention. The log is finite, so a consumer that has been down for a day may find the data it needs has been deleted, and its only way back is a fresh snapshot. Alert on how far consumers are behind compared to retention, not just on how far behind they are.',
      'Because consumers may see a change twice after a restart, they must be safe to repeat. For derived stores that is usually easy, because writing the current value of a row again changes nothing.',
    ],
    followUp: {
      q: '"How do you keep a search index in sync with your database?"',
      answer:
        'Not by writing to both from the application. That is the tempting answer, and it is wrong. The two writes are not all-or-nothing, so a crash between them leaves the index permanently wrong and nothing tells you. I would drive the index from CDC. The connector reads the database log, publishes changes to a stream, and an indexer consumes it. Since a change is in the log if and only if it committed, the index cannot miss anything, and the indexer is naturally safe to repeat, because it writes the whole current document. The costs I would name: the index lags the database by about a second, which is fine for search and not fine if a user expects to see their own edit immediately. For that case I would merge their pending change on the client. And schema changes now affect the indexer, so it has to cope with unknown and missing fields. I would also run a regular reconciliation job comparing counts and checksums, because long-running pipelines tend to drift somewhere, and finding it on purpose beats hearing about it from a user.',
    },
    selfCheck: {
      q: 'Your application writes to the database and then updates the search index directly. Name what goes wrong and what you would do instead.',
      answer:
        'The two writes can disagree. Commit the row, crash before indexing, and the item is invisible in search forever, with nothing flagging it. Index first and then roll back, and search returns something that does not exist. It also breaks for any write that does not go through that code path: a migration, a manual fix, a second service. Those are the changes that are easy to forget. Instead, make the change and its notification all-or-nothing together. Either write to an outbox table in the same transaction and relay from there, or drive indexing from the database log with CDC, so the source of truth is the commit itself. I would take CDC here, because a search index is derived data that should follow every change, whoever made it.',
    },
    traps: [
      'Writing to the database and a second system separately. They will drift.',
      'Treating row changes as business events and guessing the intent from differences.',
      'No plan for a consumer that falls behind the log retention.',
    ],
    sayThis:
      '"The search index is fed by CDC off the database log, so it cannot miss a write, including ones made outside the application. Indexing is safe to repeat because it writes the whole document. Cost: about a second of lag, a tie to the schema, and I need a reconciliation job, because long-running pipelines tend to drift."',
    related: ['write-ahead-log', 'distributed-transactions', 'search-indexing'],
    refs: [
      {
        label: "Debezium \u2014 Architecture",
        href: "https://debezium.io/documentation/reference/stable/architecture.html",
        note: "A widely used open-source CDC implementation, reading the database log directly.",
      },
    ],
    hints: [
      "Two systems, two writes, no transaction across them. What happens when the second one fails?",
      "Now ask who else might write to that database \u2014 a migration, an admin script, another service.",
    ],
    animation: {
      scenario: "cdc-stream",
      caption: "One write by the application. Everything downstream is derived from the database log, which is why the search index cannot silently drift out of step with the table.",
    },
  },

  {
    slug: 'circuit-breakers',
    title: 'Circuit breakers and retries with jitter',
    navTitle: 'Circuit breakers',
    tier: 3,
    oneLine: 'Stop calling something that is already failing, and never retry all at the same moment.',
    problem: [
      'When a dependency gets slow, every caller piles up waiting on it, holding threads and connections. Your service dies of someone else\'s outage. That is a cascading failure, and it is how one small problem can take down a whole platform.',
      'Retries make it worse. The dependency is struggling, so everyone retries, so it receives more traffic than before and cannot recover. The fix is to fail fast when things are bad, and to retry in a way that does not line everyone up together.',
    ],
    cost: 'A circuit breaker returns errors for requests that might have worked, so you trade away some successful requests on purpose for the survival of the system. It has thresholds to tune, and badly tuned ones either trip constantly or never trip at all. Retries multiply load: three retries means up to four times the traffic, at the moment you can least afford it. And any retry needs idempotency behind it, or you get duplicate side effects.',
    useWhen: [
      'Every call to another service or an external API. Timeouts and breakers are defaults, not features.',
      'A dependency that is optional, like recommendations or personalisation, where a fallback is better than an error.',
      'Anywhere you have seen threads pile up on a slow call.',
    ],
    avoidWhen: [
      'A single local database call, where failure means you cannot answer at all. A breaker adds little there. A timeout still matters.',
      'Operations that are not safe to repeat and carry no idempotency key. Blindly retrying a payment is worse than failing.',
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
      'Start with this: put a timeout on every remote call. Without one, a dependency that hangs holds your resources forever, and no amount of clever breaker logic saves you. Set the timeout from the real latency distribution, a bit above p99, not a round number someone guessed.',
      'The breaker states. Closed means calls flow while failures are counted. Once the failure rate crosses a threshold over a meaningful window, it opens, and calls fail immediately without waiting. You stop spending resources on something that will not answer. After a cooldown it goes half-open and allows one trial call. Success closes it. Failure opens it again. Use a failure rate over a window rather than a raw count, or a quiet endpoint takes an hour to trip and a busy one trips on a hiccup.',
      'Retries, done properly. Only retry things that are safe to repeat, or that carry an idempotency key. Only retry errors that might be temporary, like a timeout or a 503, never a 400. Cap the attempts at two or three. Use growing delays between attempts, and add randomness so callers do not line up. Without that randomness, a thousand clients that all failed at the same moment all retry at the same moment, and the recovering service is knocked over by the wave. The randomness is one line of code, and it can decide whether the service recovers or suffers a second outage.',
      'One refinement worth mentioning is a retry budget: the whole client is allowed to spend only a small percentage of its traffic on retries. That caps the amplification no matter how many individual calls decide to retry, which matters most in a deep chain of calls. Three layers that each make three attempts turn one user request into 27 at the bottom.',
      'Bulkheads are the companion idea. Give each dependency its own limited pool of connections or threads, so a slow one uses up only its own share and the rest of your service keeps working. Without that, one slow dependency eats every thread and takes down endpoints that never called it.',
      'Then say what happens when the breaker is open, because that is what decides the user experience. Serve old cached data, fall back to a simpler response, drop an optional feature, or return a clear error. Decide this per dependency in advance, or the default is a blank page.',
    ],
    followUp: {
      q: '"Your recommendation service is down. What does the user see?"',
      answer:
        'The page, without recommendations. And that has to be a decision you made on purpose, before the incident, not something the code stumbles into. In practice: the call has a tight timeout, maybe 100 ms, because recommendations are not worth delaying the page for. A breaker opens after a burst of failures, so we stop waiting at all. And the fallback is a cached or generic list, or the section simply is not shown. The failure to avoid is the page that waits three seconds for something it did not need and then errors, so an optional feature caused a total outage. I would also give it its own connection pool, so even while it is timing out it cannot eat the capacity the checkout path needs. The cost of all this is that recommendations quietly get worse during an incident and users are not told. That is the right trade here, but it means I need an alert, or nobody notices for a week.',
    },
    selfCheck: {
      q: 'Why add jitter to retry backoff? Describe the exact failure it prevents.',
      answer:
        'Because a thousand clients hit by the same outage fail at the same instant. With plain growing delays they all wait the same 1, 2 and 4 seconds, so they retry in perfect unison. The struggling service gets a thousand requests at once, falls over again, and the pattern repeats with the crowd now even more tightly synchronised. That is a retry storm, and it can keep a service down long after the original cause is fixed. Jitter randomises each client\'s wait (full jitter picks a random point between zero and the backoff), so the same thousand retries spread smoothly across the window and the service gets a chance to recover. It costs almost nothing to add.',
    },
    traps: [
      'Retrying without idempotency and creating duplicate side effects.',
      'Growing delays with no randomness, producing one synchronised retry wave.',
      'A breaker with no defined fallback. You fail fast into a blank page.',
      'No timeout at all, which makes everything else here irrelevant.',
    ],
    sayThis:
      '"Every outbound call gets a timeout just above p99, two retries with growing delays and full jitter, and a breaker that opens on a failure rate rather than a raw count. Recommendations have their own connection pool and fall back to a cached list. Cost: during an incident, some requests that would have succeeded are rejected. I am trading a few requests to keep the service up."',
    related: ['idempotency', 'connection-pooling', 'rate-limiting'],
    refs: [
      {
        label: "Martin Fowler \u2014 CircuitBreaker",
        href: "https://martinfowler.com/bliki/CircuitBreaker.html",
        note: "The pattern as originally written up, with the state machine drawn out.",
      },
      {
        label: "Timeouts, retries and backoff with jitter",
        href: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
        note: "Why retries without jitter turn a blip into an outage.",
      },
    ],
    animation: {
      scenario: "circuit-breaker",
      caption: "The breaker opens after repeated failures and fails fast instead of queueing. One probe request tests whether the dependency is back.",
    },
    hints: [
      "A thousand clients all fail at the same instant and all back off by exactly the same amount. When do they retry?",
      "Picture the traffic graph: not a recovery, but a series of spikes. Jitter breaks what property of that group?",
    ],
  },

  {
    slug: 'search-indexing',
    subject: "a search index",
    title: 'Search indexing basics',
    tier: 3,
    oneLine: 'An index from words to documents, so "find me things containing this" is not a full scan.',
    problem: [
      'Databases match values. Search matches meaning, roughly. A LIKE \'%shoe%\' query cannot use a normal index, cannot handle typos or word endings, and has no idea which result is better than another.',
      'A search engine builds an inverted index: for each word, the list of documents containing it. So a query becomes a few list intersections, and the results come back ranked.',
    ],
    cost: 'A second copy of your data that can drift from the source, and now you own keeping it in step. Indexing is expensive at write time, and the index is near-real-time rather than instant, so a user may search for something they just created and not find it. Relevance tuning is an ongoing job with no end. And how you split and normalise text is baked into the index, so changing it means rebuilding everything.',
    useWhen: [
      'Full-text search over a meaningful amount of text.',
      'Faceted search: filter by brand, price, rating, with counts.',
      'Typeahead and autocomplete.',
      'Searching logs and events, where the volume makes a database impractical.',
      'Ranking by relevance rather than by a column.',
    ],
    avoidWhen: [
      'Exact lookups by id or by a known field. Your database does that better.',
      'Small datasets. Most relational databases have decent built-in full-text search, and one system beats two.',
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
      'Analysis is the step that decides quality, and it gets the least attention. Text is split into words, lowercased, sometimes stripped of very common words, and cut back to a root form, so "running" and "runs" both become "run". Both the document and the query go through the same steps, which is why they match. Change the analyser and you must rebuild the index, because the old one holds words in the old form.',
      'Ranking, at the level worth explaining. A word that appears often in this document is a stronger signal. A word that appears in almost every document is a weaker one. That combination is TF-IDF. BM25 is the refined version, and the default scoring in Lucene-based engines. On top of the text score you add business signals: popularity, how recent it is, whether it is in stock, the margin. In product search, much of the tuning effort goes into that second part.',
      'For typeahead specifically, the general engine is often the wrong tool. Matching a prefix against a few million terms is better served by a purpose-built structure: a trie with the best completions worked out in advance at each node, held in memory. That gives single-digit millisecond responses. Prepare the answers rather than searching for them, because the user types another character in 200 ms and every keystroke is a query.',
      'Keeping it in step: drive indexing from the database log or from an outbox, rather than writing to both places from the application. Index whole documents, so re-indexing a record is safe to repeat. And plan for a full rebuild, because you will change the mapping. The standard approach is to build a new index alongside the old one, then switch an alias over in one step, so there is never a moment with no index.',
      'The shape at scale: search indexes are split into shards, and each shard is copied. A query goes to every shard, each returns its top N, and a coordinator merges them. So query cost grows with the number of shards, and having far more shards than you need makes every query slower. Deep pagination is expensive for the same reason. Page 500 means each shard has to produce 5,000 results to merge. Use a cursor instead of an offset.',
    ],
    followUp: {
      q: '"A user creates an item and immediately searches for it. Is it there?"',
      answer:
        'Probably not, and it is better to say so upfront. Search indexes are near-real-time. The document has to be indexed and the index refreshed before it is visible, usually about a second, and longer if the indexing pipeline is behind. So the design should not rely on search for that moment. If the user is looking at their own newly created item, serve that view from the database, which knows immediately. If they land on a search results page, I can merge their pending item into the results on the client, or force a refresh of just that one document, which is expensive and fine at low volume. What I would avoid is forcing a global refresh after every write, because that destroys indexing throughput. The general principle: search is derived, eventually consistent data, and any path where a user must see their own change immediately should read the source of truth instead.',
    },
    selfCheck: {
      q: 'Why can a search index find "running shoes" when the document says "run shoe", but a database LIKE query cannot?',
      answer:
        'Because both the document and the query went through the same analysis before matching. The indexer split the text, lowercased it, and cut each word back to a root, so the document was stored under "run" and "shoe". At query time the same steps turn "running shoes" into those same two words, and they match exactly. A LIKE query compares raw characters, so "running" and "run" are simply different strings. Worse, a LIKE with a wildcard at the front cannot use a B-tree index at all, so it turns into scanning every row. The search engine also returns results ranked by how well they match, whereas LIKE gives you an unordered set of rows that happened to contain a piece of text.',
    },
    traps: [
      'Making the search index the source of truth. It is derived data and it will drift.',
      'Writing separately from the application to both the database and the index.',
      'Deep pagination with large offsets, which gets much worse as shard count grows.',
      'Splitting a small index into too many shards, making every query slower for nothing.',
    ],
    sayThis:
      '"Postgres stays the source of truth. The search index is fed by CDC and holds whole documents, so re-indexing is safe to repeat. Ranking is BM25 plus popularity and stock. Cost: about a second of lag, so a user searching for something they just created may not find it, so I read their own items from the database instead."',
    related: ['indexes', 'change-data-capture', 'caching'],
    refs: [
      {
        label: "Apache Lucene \u2014 Documentation",
        href: "https://lucene.apache.org/core/documentation.html",
        note: "The inverted-index engine underneath Elasticsearch and Solr.",
      },
      {
        label: "Elasticsearch \u2014 Reference",
        href: "https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html",
        note: "Analysis, mapping and relevance scoring as operational concerns.",
      },
    ],
    hints: [
      "Ask what the index stores. Is it the original words, or something done to them first?",
      "LIKE compares characters. What would you have to do to the words before storing them to make these match?",
    ],
  },

  {
    slug: 'distributed-counter',
    subject: "a sharded counter",
    title: 'Distributed counters',
    tier: 3,
    oneLine: 'Counting is easy until everyone counts the same thing at once.',
    problem: [
      'A view count, a like count, a rate meter. One row and an increment works fine, until thousands of writers hit the same row and all queue behind the same lock.',
      'That row becomes a hot spot, and the fix depends entirely on whether the number has to be exact.',
    ],
    cost: 'Every technique here trades exactness or freshness for throughput. Sharded counters make reads more expensive, because you have to add the shards up. Approximate structures give you a number that is close but wrong. Batching in memory means losing the last few seconds of counts if a process dies. Pick which of those you can live with, and say so.',
    useWhen: [
      'Any counter with many writers at once: views, likes, impressions, rate limits.',
      'Analytics totals where a small error is invisible.',
      'Counting distinct things over huge streams, like unique visitors, where being exact is not worth the memory.',
    ],
    avoidWhen: [
      'The count is a resource people compete for: remaining seats, stock, an account balance. That is not a counter problem, it is a transaction problem, and approximation is not on the table.',
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
        note: 'The write problem became a read problem. That is the trade: reads now add up 100 rows, so cache the total and refresh it every few seconds.',
      },
    },
    body: [
      'Sharded counters are the standard answer. Instead of one row, keep N rows for the same logical counter, and have each writer increment a random one. Contention drops by roughly N. Reading means adding up N rows, which you then cache. So the number on screen is a couple of seconds old, which users cannot notice on a view count.',
      'Write batching goes further. Each application server keeps a count in its own memory and flushes it every second or two as a single increment. A thousand increments become one write. The cost: if the process dies, you lose whatever it had not flushed. For view counts that is fine, but say it out loud rather than hoping nobody asks.',
      'For counts over time windows, an approximate structure is often right. HyperLogLog estimates distinct counts, like unique visitors today, in about 12 KB with under 1% standard error, whether you saw a thousand items or a billion. A count-min sketch estimates how often each key appears, which is how you spot a hot key or an abusive caller without tracking every one of them.',
      'The distinction that decides the design: is this number a display, or a decision? A like count is a display, so approximate and slightly old is correct engineering. Remaining tickets is a decision, and it must be exact at the moment you commit. That is enforced by a conditional update or a constraint, not by a counter you read and then trust. Treat stock as a counter and you will oversell.',
      'There is a middle case worth knowing: something that is a decision, but not about one specific item, like a rate limit. There an approximate count is usually fine, because letting through 105 requests instead of 100 rarely matters. So you can shard or batch, as long as you choose which direction the error goes.',
    ],
    followUp: {
      q: '"Your view counter is a single row and a post goes viral. What happens?"',
      answer:
        'Every increment for that post queues on one row lock. Throughput collapses to what one lock can process, latency climbs, and connections pile up waiting. And because those connections come from a shared pool, the damage spreads to endpoints that have nothing to do with view counts. So a hot row does not just make counting slow. It can take down neighbouring features. The fix is to stop making them compete. Batch increments in memory on each server and flush every second, and spread the stored counter over N shard rows so writers do not queue on one. Reads add up the shards and get cached for a few seconds. The costs are that the number can be a few seconds old, and that I lose unflushed counts if a server dies mid-flush. Both are entirely acceptable for views, and both are things I would refuse to accept for stock.',
    },
    selfCheck: {
      q: 'When is a sharded counter the wrong answer? Give the specific case.',
      answer:
        'When the number decides something that must be exact: remaining seats, stock on hand, an account balance. With sharded counters the true total is only knowable by adding up all the shards, and between reading that total and acting on it the value can change. So two people can both see "1 left" and both go ahead. Approximation is not the core problem there either. The core problem is that the check and the commit have to be one operation. So for those you use one authoritative row with a conditional update (decrement where remaining is greater than zero), or a unique constraint on the specific seat. And you accept that this path has a throughput ceiling, which is usually fine, because there are only so many seats. Sharding is for numbers you display, not numbers you spend.',
    },
    traps: [
      'Treating stock as a counter. It is a resource people compete for.',
      'Adding up the shards on every request instead of caching the total.',
      'Losing in-memory batches without ever admitting that it happens.',
    ],
    sayThis:
      '"View counts batch in memory per server, flush every second into one of 50 shard rows, and the displayed total is a cached sum refreshed every few seconds. Cost: the number is a couple of seconds old, and a crash loses under a second of counts. I would not use any of this for remaining tickets. That needs one row and a conditional update."',
    related: ['rate-limiting', 'partitioning', 'caching'],
    refs: [
      {
        label: "Redis \u2014 Bloom filters and probabilistic types",
        href: "https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/",
        note: "The same family of structures used when an exact count is too expensive.",
      },
    ],
    hints: [
      "Sharding a counter means the true total is only known when you add the shards up.",
      "So ask what breaks when you must reject the very next request based on the exact current value.",
    ],
  },
]
