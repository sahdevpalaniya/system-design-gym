import type { Concept } from '@/lib/types'

export const TIER1: Concept[] = [
  {
    slug: 'latency-numbers',
    title: 'Latency numbers worth memorising',
    tier: 1,
    oneLine: 'Four numbers that tell you where the time actually goes.',
    problem: [
      'When you move a piece of work from one box to another, you pay for the distance. Most designs are slow for one reason: something crosses a boundary far more often than anyone noticed.',
      'You do not need a table of thirty numbers. You need four, and you need to feel the gaps between them, because the gaps are what change designs.',
    ],
    cost: 'Memorising numbers can make you sound confident about a system you have not measured. Real machines vary by a lot. Use these to pick between two designs, never to promise a latency figure to a room.',
    useWhen: [
      'You are deciding whether to make a call in a loop or fetch in one batch.',
      'You are choosing between a cache, a disk read, and a network hop.',
      'You are asked "is this fast enough?" and want to answer with arithmetic instead of a feeling.',
      'You need to justify a cross-region decision.',
    ],
    avoidWhen: [
      'You have a real profiler and real traffic. Then measure — the numbers are a stand-in for measurement, not a replacement.',
      'Someone wants an SLA number. Do not quote these as a promise.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Same four operations, drawn to scale. The bars are why the last one keeps ruining designs.',
        items: [
          { label: 'Read from memory', value: 100, display: '~100 ns', tone: 'muted' },
          { label: 'Read from SSD', value: 100_000, display: '~100 µs (1,000x memory)', tone: 'muted' },
          { label: 'Round trip inside one datacenter', value: 500_000, display: '~0.5 ms', tone: 'accent' },
          { label: 'Round trip across the world', value: 150_000_000, display: '~150 ms (300,000x memory)', tone: 'bad' },
        ],
        note: 'The jump that matters is the last one. Anything that crosses an ocean, you get to do once per user action — not once per item in a list.',
      },
    },
    body: [
      'Four numbers, in nanoseconds so they compare cleanly. Memory read: about 100 ns. SSD read: about 100 µs, so a thousand times slower. A round trip between two machines in the same datacenter: about 0.5 ms, so five thousand times slower than memory. A round trip between continents: about 150 ms, because light in fibre is only so fast and the route is never straight.',
      'The last one has a floor you cannot engineer away. London to Sydney and back is roughly 17,000 km each way; light in glass covers about 200,000 km per second. That is already 170 ms of pure physics before a single machine does any work. No amount of money removes it. You can only move the data closer, or stop needing the round trip.',
      'This is where the practical rule comes from: one cross-region hop per user action is a design. Ten is a bug. If you find yourself doing a remote call inside a loop over 50 items, that loop is your whole latency budget.',
    ],
    followUp: {
      q: 'Your page makes 30 backend calls and users on the other side of the world complain. Where do you look first?',
      answer:
        'At whether those 30 calls are sequential and whether any of them cross a region. 30 sequential calls at 0.5 ms each inside one datacenter is 15 ms — invisible. The same 30 calls where each one waits on a 150 ms cross-region hop is 4.5 seconds. So the fix is not "make the calls faster", it is "stop making them one after another, and stop making them travel". Batch them, run them in parallel, or put a read replica near the user. Name the cost too: a replica near the user can be stale, and batching makes one slow item delay the whole batch.',
    },
    selfCheck: {
      q: 'Roughly how many times slower is a cross-world round trip than a read from memory — 100x, 1,000x, or a million times? And what does that ratio actually stop you from doing?',
      answer:
        'Roughly a million times (100 ns versus 150 ms is about 1.5 million). What it stops you doing: treating a remote call like a function call. In memory you can happily do a hundred thousand lookups in a request. Across the world you get one, maybe two, before a human notices. That single ratio is why caches, CDNs and read replicas exist at all.',
    },
    traps: [
      'Quoting numbers with false precision. "About half a millisecond" is right; "0.47 ms" is a story you cannot back up.',
      'Forgetting that a round trip is two crossings. People quote the one-way distance and end up half wrong.',
    ],
    sayThis:
      '"A round trip inside one datacenter is well under a millisecond, so I am not going to worry about chattiness there. Across regions it is over 100 ms, so I will allow exactly one of those per request and design around it."',
    related: ['back-of-envelope', 'caching', 'cdn'],
  },

  {
    slug: 'back-of-envelope',
    title: 'Back-of-envelope estimation',
    tier: 1,
    oneLine: 'Rough maths, done out loud, that tells you which problem you actually have.',
    problem: [
      'Every design has one hard part and several easy parts, and they do not look different until you do the arithmetic. Without numbers you spend your best ten minutes on the easy part.',
      'The point is not the number. The point is the sentence the number lets you say: "so the hard part here is ___". If your estimate did not change what you were about to build, you either did the sum wrong or you ignored the answer.',
    ],
    cost: 'Time, and the risk of anchoring. Two minutes spent estimating is two minutes not spent designing, and a number you picked badly early on will quietly shape everything after it. Say your assumptions out loud so a wrong one can be corrected instead of compounding.',
    useWhen: [
      'Right after requirements, before you draw a single box.',
      'When you feel yourself about to say "we will shard it" — check first whether you need to.',
      'When choosing between two designs and the argument is going in circles. Numbers end arguments.',
    ],
    avoidWhen: [
      'The interviewer says "assume it is huge, skip the maths". Take the offer, say the one conclusion you would have drawn, and move on.',
      'You are estimating something with no effect on the design, like exact monthly bytes of logs. Do not perform arithmetic for its own sake.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'The classic result: a link shortener does 100x more reads than writes.',
        items: [
          { label: 'Writes — new links created', value: 40, display: '~40 / sec', tone: 'muted' },
          { label: 'Reads — links being followed', value: 4000, display: '~4,000 / sec', tone: 'accent' },
        ],
        note: 'So the hard part is reads. Write sharding, batched inserts, a write-optimised store — all of that would have been ten wasted minutes. One cache and a read replica solve the real problem.',
      },
    },
    body: [
      'A method that fits in your head. First, users: pick daily active users, and be explicit that you picked it. Second, actions per user per day. Multiply, then divide by 100,000 — that is close enough to the 86,400 seconds in a day, and it makes the division easy. That is your average per second.',
      'Third, peak. Traffic is never flat. Multiply the average by 2 to 10 depending on the product — a work tool spikes hard on weekday mornings, a global chat app barely spikes at all. Say which one you assumed and why.',
      'Fourth, storage: bytes per record times records per day times days retained. Fifth, and this is the step people skip, read the answer back to yourself and finish the sentence: "so the hard part here is ___."',
      'Useful anchors: one million seconds is about 11 days. 86,400 seconds in a day, call it 100,000. A kilobyte of text is a paragraph. A megabyte is a small photo. A terabyte fits on one disk you can hold, so "a few terabytes" is not a scale problem — it is a normal database.',
    ],
    followUp: {
      q: 'You estimated 500 GB of data. The interviewer asks: "so how many machines?"',
      answer:
        'The honest answer is one, and that is the interesting part. 500 GB fits comfortably on a single ordinary server, so the storage size is not what forces you to distribute. What forces you to distribute is something else — request rate that one box cannot serve, availability that one box cannot promise, or a blast radius you cannot accept. Name which one applies. If none of them do, say so: "at this size I would run one primary with a replica for failover, and I would revisit when we are 20x bigger." Choosing not to distribute, out loud, with a reason, scores better than distributing by reflex.',
    },
    selfCheck: {
      q: 'A service has 10 million daily active users, each doing 20 actions a day. What is the rough average requests per second, and what is a reasonable peak?',
      answer:
        '10M × 20 = 200 million actions a day. Divide by 100,000 (the rounded seconds in a day) = about 2,000 requests per second average. Peak at 3x gives roughly 6,000 per second. That is a real number but not a frightening one — a handful of application servers handle it. The thing to say next is which of those 20 actions are reads and which are writes, because that split decides the design far more than the total does.',
    },
    traps: [
      'Doing the maths and then designing as if you had not. The estimate has to change a decision or it was decoration.',
      'Precision theatre. "1,847 requests per second" from assumptions you invented is worse than "roughly two thousand".',
      'Forgetting peak entirely, then being surprised by the sale-day question later.',
    ],
    sayThis:
      '"Ten million daily users, twenty actions each, so about two thousand per second average and call it six thousand at peak. Reads are maybe fifty to one against writes. So the hard part here is read fan-out, not durability."',
    related: ['latency-numbers', 'caching', 'partitioning'],
  },

  {
    slug: 'caching',
    title: 'Caching',
    tier: 1,
    oneLine: 'Keep a copy of the answer near whoever keeps asking for it.',
    problem: [
      'Databases are good at storing things and comparatively slow at being asked the same question ten thousand times a second. A cache keeps the answer somewhere faster and closer, so most requests never reach the database at all.',
      'It is the single highest-leverage move in read-heavy systems, and it is also where most stale-data bugs are born.',
    ],
    cost: 'You now have two copies of the truth and they can disagree. Users may see old data. You have added a component that can fail, and when it fails everything it was protecting gets hit at once. And you have to decide, forever, when each cached thing stops being true.',
    useWhen: [
      'Reads massively outnumber writes — this is the main one.',
      'The same items are requested over and over (a popular product, a hot post).',
      'The answer is expensive to compute and slightly stale is genuinely fine.',
    ],
    avoidWhen: [
      'The data must be exactly right this instant: account balances at the moment of payment, remaining seats, stock counts.',
      'Every request asks for something different. A cache that never gets a hit is pure cost.',
      'Write rate is close to read rate — you will spend all your time invalidating.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'cache-miss',
        caption:
          'A miss costs more than no cache at all: you check the cache, fail, then go to the database anyway. Caches only pay off when hits are common.',
      },
    },
    body: [
      'Where to put it. Browser — free, closest, and you cannot recall it once sent. CDN — great for anything shared between users. In the application process — fastest of all, but every server has its own copy so they drift. A shared cache like Redis or Memcached — one copy all servers agree on, at the price of a network hop. Inside the database itself — real, but you do not control it.',
      'Cache-aside is the default and the one to describe. The application asks the cache; on a miss it reads the database, writes the answer into the cache, and returns it. Simple, and the cache going down degrades you rather than breaking you.',
      'Write-through writes to cache and database together, so the cache is never stale, but every write pays both costs and you cache things nobody will read. Write-behind writes the cache immediately and the database soon after — fast, and you can lose data in the gap. Say which you picked and why.',
      'Invalidation, honestly: there are two ways and both are compromises. A TTL means the data is wrong for at most that long and you never have to think about it. Explicit deletion on write means it is right almost always, but every code path that writes must remember, and one that forgets creates a bug nobody can reproduce. Most real systems use a TTL as the backstop and explicit deletion as the optimisation.',
      'The empty-cache problem has a name worth knowing: a cold start or a mass eviction sends every request to the database at the same moment, and the database falls over, and when it comes back the cache is still empty. Three defences. Request coalescing: when a hundred requests miss on the same key, let one go to the database and make the other ninety-nine wait for it. Jittered TTLs, so a million keys written together do not all expire in the same second. And warming the cache before you take traffic.',
      'A related one: a request for a key that does not exist anywhere hits the database every single time, because there is nothing to cache. If those are common — an attacker probing random IDs — cache the "not found" too, briefly, or put a bloom filter in front.',
    ],
    followUp: {
      q: '"Your cache just died. What happens?"',
      answer:
        'Every read that was being served from memory now goes to the database at once. So the honest answer starts with: does the database survive that? Usually not, at the ratios that made me add a cache. So I would not rely on the cache being up. I would coalesce requests so one miss on a key means one database read, not ten thousand. I would put a small in-process cache on each application server as a second layer, so even with the shared cache gone we absorb the hottest keys. I would rate-limit or shed load at the edge rather than let the database die, because a slow site beats a dead one. And I would bring the cache back warm rather than empty. The cost of all that: more moving parts, and the in-process layer means servers can briefly disagree with each other.',
    },
    selfCheck: {
      q: 'Name one thing you should never cache in a booking system, and say exactly why.',
      answer:
        'Remaining seat or room availability at the moment of booking. Everything else about caching is a latency trade, but this one is a correctness trade: if two people read a cached "1 seat left" that is two seconds old, they both book, and you have sold a seat twice. The general rule: never cache the value that a decision to commit is based on when that value is contested. You can cache the search results page showing roughly what is available — being slightly wrong there is a mild annoyance — but the final check must read the real thing, inside the transaction that reserves it.',
    },
    traps: [
      'Saying "add a cache" without saying what invalidates it. That is the follow-up, every time.',
      'Assuming a cache improves writes. It does not; it usually makes them slightly worse.',
      'Ignoring what happens when it is empty. That is where the outage lives.',
    ],
    sayThis:
      '"Cache-aside in Redis, five minute TTL with jitter, and I delete the key explicitly on write. Cost: a user can see up to five minutes stale data on the rare path where the delete fails, and if Redis dies the database takes the full read load — so I will coalesce misses so one key means one database read."',
    related: ['latency-numbers', 'cdn', 'bloom-filters', 'consistency-models'],
  },

  {
    slug: 'load-balancing',
    title: 'Load balancing',
    tier: 1,
    oneLine: 'One address in front, many machines behind, and a way to stop sending traffic to a broken one.',
    problem: [
      'One server can only do so much, and it will eventually restart or die. A load balancer lets you put several servers behind a single address, spread requests across them, and quietly stop using any server that stops answering.',
      'It is also what makes deploys boring: take one server out, update it, put it back, repeat.',
    ],
    cost: 'It is another hop (a fraction of a millisecond) and another thing that can fail, so it must be redundant itself. It also pushes you to make your servers stateless — because if a server holds a user session in memory, every request has to come back to that same server, and you have lost half the benefit.',
    useWhen: [
      'You have more than one server. That is the whole condition.',
      'You want deploys and restarts without downtime.',
      'You need health checks to remove bad instances automatically.',
    ],
    avoidWhen: [
      'You genuinely have one machine and downtime is acceptable — then it is complexity for nothing.',
      'The thing being balanced holds essential in-memory state per connection and cannot be made stateless. Solve that first, or accept sticky routing and its costs.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'load-balancer',
        caption:
          'Requests arriving at one address and landing on whichever server is free. Remove a server from the pool and traffic simply stops going there.',
      },
    },
    body: [
      'Layer 4 balances on IP and port — it does not read the request, so it is fast and works for any protocol. Layer 7 reads the HTTP request, so it can route by path or header, terminate TLS, and retry a failed request on another server. Layer 7 is the default for web traffic; layer 4 is for raw throughput and non-HTTP protocols.',
      'Algorithms, in order of how often you should reach for them. Round robin: fine when requests are similar. Least connections: better when some requests take much longer than others, which is most real systems. Consistent hashing on a key: use when you want the same user or key to keep landing on the same server, usually for cache locality.',
      'Health checks are the part that actually earns its keep. A passive check notices failing responses. An active check calls an endpoint every couple of seconds. The endpoint should test something real — can it reach the database? — but not so real that one slow dependency makes every server mark itself unhealthy at once and takes down the entire fleet. That failure mode is common and embarrassing.',
      'Sticky sessions pin a user to one server. It solves in-memory session state, and it costs you: uneven load, a bad rebalancing story, and users losing state when a server restarts. Prefer putting session state in a shared store and keeping servers interchangeable.',
      'Above the load balancer there is DNS, which spreads traffic across regions or across several balancers. DNS is cached by clients for minutes, so it is a poor failover mechanism on its own — say that if someone proposes it.',
    ],
    followUp: {
      q: '"How do you deploy a new version with zero downtime?"',
      answer:
        'Rolling deploy through the load balancer. Take one instance out of the pool, wait for its in-flight requests to finish — that is connection draining, and forgetting it is how you drop live traffic during a "zero downtime" deploy — then update it, wait for its health check to pass, put it back, move to the next. Keep enough instances in the pool to carry the traffic throughout. The two things that make this actually work: the new version has to tolerate the old version running beside it, which means database migrations get split into add-column, deploy, backfill, then remove-old-column across separate releases; and you need a fast way back, so I would rather roll forward to a known-good build than try to undo a migration. Cost: every schema change now takes three deploys instead of one.',
    },
    selfCheck: {
      q: 'Your health check endpoint queries the database. The database gets slow. What happens to your fleet, and what would you do differently?',
      answer:
        'Every health check times out at once, so the balancer marks every server unhealthy and removes them all. Now nothing is serving, including the requests that did not need the database. A slow dependency became a total outage. The fix: the liveness check answers "is this process alive", cheap and dependency-free, and a separate readiness check may look at dependencies. Balancers should also refuse to drain the last healthy instances — if everything looks unhealthy, keep sending traffic anyway, because degraded service beats none.',
    },
    traps: [
      'Drawing one load balancer and calling the design highly available. That box is now the single point of failure.',
      'Forgetting connection draining and dropping requests on every deploy.',
      'Reaching for sticky sessions instead of making servers stateless.',
    ],
    sayThis:
      '"Layer 7 balancer, least-connections, active health checks on a cheap endpoint that does not touch the database. Servers hold no session state so any server can take any request. Cost: an extra hop and I need at least two balancers, or the balancer is the single point of failure I just drew."',
    related: ['circuit-breakers', 'consistent-hashing', 'rate-limiting'],
  },

  {
    slug: 'sql-vs-nosql',
    title: 'SQL vs NoSQL — and why, not just names',
    tier: 1,
    oneLine: 'Pick by access pattern and by what must never be wrong, not by which word sounds bigger.',
    problem: [
      'Relational databases give you a fixed schema, joins, and real transactions across rows. Non-relational ones give up some of that in exchange for spreading across machines more easily and being shaped exactly like your query.',
      'The choice matters because it is very hard to undo. Everything else in your design can be swapped in an afternoon; the data model cannot.',
    ],
    cost: 'Choosing relational costs you effort when a single machine is no longer enough — you have to shard yourself, and cross-shard joins and transactions get painful. Choosing non-relational costs you flexibility: you must know your queries before you store the data, and any question you did not plan for means rewriting the data or copying it into a second system.',
    useWhen: [
      'Relational: money, inventory, anything needing a transaction across several rows; queries you cannot predict; moderate scale, which is most systems.',
      'Non-relational: one dominant, known access pattern; huge write volume; data with no natural joins; the shape of the data varies per row.',
    ],
    avoidWhen: [
      'Do not pick non-relational because of scale you have not estimated. Do the arithmetic first — a single well-indexed relational database handles more than most people think.',
      'Do not pick relational and then use it as a key-value store with a JSON blob column, and act as if you chose carefully.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The honest version of the comparison — it is about what you give up.',
        a: {
          title: 'Relational (Postgres, MySQL)',
          points: [
            'Transactions across many rows, so "take payment and reserve the seat" is one atomic step.',
            'Ask questions you did not plan for. Joins and ad hoc queries just work.',
            'Constraints live in the database, so bad data cannot get in even through a buggy service.',
            'Scaling reads is easy (replicas). Scaling writes past one machine is real work you do by hand.',
            'A schema change on a huge table needs care and a plan.',
          ],
        },
        b: {
          title: 'Non-relational (Dynamo, Cassandra, Mongo)',
          points: [
            'Spreads across machines by design, so write throughput grows by adding boxes.',
            'You store data in the shape you will read it, so reads are one lookup with no joins.',
            'Rows can differ, so evolving fields is cheap.',
            'Transactions are limited — usually one item, or one partition, with awkwardness beyond that.',
            'A new access pattern means a new table and a backfill, not a new query.',
          ],
        },
        verdict:
          'Start relational unless you can name the specific thing it cannot do for you. "We will have 50,000 writes a second on one table and only ever read by user id" is a reason. "It is web scale" is not. And you are allowed to use both — the transactional core in Postgres, the huge append-only stream in something else.',
      },
    },
    body: [
      'The question that actually decides it: what is the one query this system does ten thousand times a second, and does anything here have to be exactly right under contention?',
      'If the hot query is "give me everything for this one key", non-relational is a natural fit and its limits will not hurt you. If the system involves seats, stock, balances or unique names, you want real transactions, and getting them yourself on top of a store that does not have them is much harder than it looks.',
      'Two things people get wrong. First, non-relational is not automatically faster; it is faster for the pattern you designed it around, and often much worse for anything else. Second, relational databases have grown a lot — replicas, partitioning, JSON columns, and hosted options that shard for you. The gap you may be imagining is a decade out of date.',
      'For big scale, be concrete about the shard key rather than the brand name. "Cassandra" tells the interviewer nothing. "Partition by user id, cluster by timestamp descending, so one user\'s recent items are one contiguous read" tells them you understand the machine.',
    ],
    followUp: {
      q: '"Why this database and not Postgres?"',
      answer:
        'The answer has to be a number or a pattern, not a preference. Something like: "The write rate is around 80,000 per second, sustained, on one logical table, and it is append-only with no cross-row transactions. One Postgres primary will not take that, so I would be sharding it myself — which means I would be hand-building what a distributed store already does, including rebalancing and failover. The read pattern is a single key lookup, so I am giving up joins I do not need." Then name what it costs: no cross-partition transactions, so any invariant spanning partitions has to be handled in application logic, and analytics queries need a separate copy of the data. If you cannot produce a sentence like that, the correct answer is that Postgres is fine, and saying so is a strong answer.',
    },
    selfCheck: {
      q: 'You are designing a system that records payments. Which do you pick, and what is the one word that decided it?',
      answer:
        'Relational. The word is "transaction" — not the database feature, the business event. Recording a payment means several rows have to change together or not at all: the ledger entry, the order status, the balance. If half of that lands you have a support ticket about missing money, which is the most expensive kind of bug there is. Money is also low-volume compared to almost anything else in a product, so the scale argument for the other choice usually is not there. And regulators like being able to query the data in ways nobody planned for.',
    },
    traps: [
      'Naming a database instead of naming an access pattern.',
      'Claiming non-relational stores "cannot do transactions" — many do, within a partition. Know the limit you are describing.',
      'Choosing for write scale you never estimated.',
    ],
    sayThis:
      '"Postgres for the core, because bookings need a real transaction. The event stream is 50k writes a second and only ever read by device id, so that goes in a partitioned key-value store. Cost: two systems to operate, and no transaction spans both — so I will make the stream idempotent instead."',
    related: ['indexes', 'partitioning', 'distributed-transactions'],
  },

  {
    slug: 'indexes',
    title: 'Indexes and what makes a query slow',
    tier: 1,
    oneLine: 'A sorted lookup table so the database stops reading every row.',
    problem: [
      'Without an index, answering "find the rows where email is this" means reading the whole table. At a thousand rows nobody notices. At fifty million it is the reason your page takes nine seconds.',
      'An index is a second structure, kept sorted, that turns that scan into a handful of jumps.',
    ],
    cost: 'Every index makes writes slower, because each insert, update and delete must update the index too. Indexes take disk and memory. And an index the planner does not use is pure cost with no benefit — surprisingly common.',
    useWhen: [
      'A column appears in a WHERE, JOIN or ORDER BY on a table big enough to care.',
      'You need uniqueness enforced — a unique index is how you actually stop duplicate emails.',
      'A query reads only a few columns and you can serve it entirely from the index (a covering index), skipping the table.',
    ],
    avoidWhen: [
      'The table is small. Reading 5,000 rows is fast and the planner may ignore your index anyway.',
      'The column has very few distinct values, like a true/false flag, and the query matches most rows — a scan is cheaper.',
      'The table is write-heavy and the index is rarely used. You are taxing every write to speed up a query nobody runs.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Same query, same table of 50 million rows, one index added.',
        items: [
          { label: 'No index — read every row', value: 50_000_000, display: '50,000,000 rows examined', tone: 'bad' },
          { label: 'B-tree index — a few jumps', value: 26, display: '~26 rows examined', tone: 'accent' },
        ],
        note: 'A B-tree roughly halves the search space at every level, so doubling the table adds one step, not double the work. This is why an index feels like magic and why the absence of one is invisible until the table grows.',
      },
    },
    body: [
      'The default index is a B-tree: sorted, so it serves equality, ranges, and ORDER BY from the same structure. A hash index only does equality. An inverted index maps each word to the documents containing it, which is how text search works. A geospatial index arranges by location so "near me" is answerable.',
      'Composite indexes and the rule that catches people out: an index on (country, city, name) can answer a query filtering on country, or country and city, or all three — but not one filtering on city alone. It works like a phone book sorted by surname then first name: useless for finding everyone called James. Put the column you always filter on first, and put equality columns before range columns.',
      'The usual reasons a query is slow, in the order to check them. There is no index on the filtered column. There is one, but the query hides it — wrapping the column in a function, or comparing different types, stops the planner using it. The filter matches most of the table, so a scan really is correct. You are sorting a large result that the index cannot supply in order. You are paging with a large OFFSET, which makes the database walk and throw away everything before it. Or the query is fine and returns 100,000 rows over the network, which is a payload problem, not a database one.',
      'The N+1 query is worth naming because it is so common: fetch 100 orders, then loop and fetch each order\'s customer. 101 round trips where one join or one batched lookup would do. It is invisible in development and fatal in production.',
      'When asked how you would debug it, say EXPLAIN. Read the plan, look for a sequential scan on a large table, check whether the row estimate matches reality — a plan built on stale statistics picks badly.',
    ],
    followUp: {
      q: '"One user reports a slow request. How do you debug it?"',
      answer:
        'Work down the stack rather than guessing. First, is it slow for everyone or just them? A dashboard of the endpoint\'s p50 and p99 answers that in seconds — if p99 is bad but p50 is fine, it is data-dependent, meaning that user has far more rows than the median user. Second, get a trace of the request and find where the time went: one slow call, or two hundred fast ones. Two hundred fast ones is the N+1. Third, if it is one slow query, run EXPLAIN on it with their parameters, not with typical ones — the plan can differ. Common outcome: they are a heavy account, the query has no index for their filter combination, and the planner switched to a scan once their row count crossed a threshold. The fix is usually an index or a pagination change, and the cost of the index is slower writes on that table.',
    },
    selfCheck: {
      q: 'You have an index on (user_id, created_at). Which of these two queries uses it — filtering by user_id alone, or filtering by created_at alone? Why?',
      answer:
        'user_id alone uses it. created_at alone does not. The index is sorted by user_id first, and only sorted by created_at within each user. So all of one user\'s rows sit together and are easy to find, but rows from last Tuesday are scattered across every user in the index. Same as a phone book sorted by surname: finding all the Patels is trivial, finding everyone named Priya means reading the whole book. If you need created_at alone, that is a second index, and it costs you on every write.',
    },
    traps: [
      'Adding an index for every column "to be safe". You have now made every write slower for queries nobody runs.',
      'Assuming an index exists because the column is important. It exists because someone created it.',
      'Missing the N+1 because each individual query looks fast in the log.',
    ],
    sayThis:
      '"That query filters by user and sorts by time, so a composite index on (user_id, created_at desc) serves both the filter and the sort. Cost: another index to maintain on a write-heavy table, and it will not help any query that filters on time alone."',
    related: ['sql-vs-nosql', 'search-indexing', 'geospatial-indexing'],
  },

  {
    slug: 'connection-pooling',
    title: 'Connection pooling',
    tier: 1,
    oneLine: 'Reuse a small set of open database connections instead of opening one per request.',
    problem: [
      'Opening a database connection is expensive — a TCP handshake, TLS, authentication, and on some databases a whole new process. Doing that per request wastes more time than the query itself.',
      'Worse, databases have a hard limit on concurrent connections. Blow through it and new connections are refused, which looks like a total outage even though the database is barely working.',
    ],
    cost: 'The pool is a queue, so when it is full requests wait — and a pool that is too small becomes your bottleneck while the database sits idle. Pools also hold state; a connection returned to the pool mid-transaction, or with a session variable still set, causes bugs that appear in unrelated requests later.',
    useWhen: [
      'Always, for any service talking to a relational database. This is a default, not a decision.',
      'Especially when you autoscale application servers — each new server multiplies your connection count.',
    ],
    avoidWhen: [
      'Serverless functions that scale to hundreds of instances, each with its own pool. There you need an external pooler sitting between them and the database, or you will exhaust the limit instantly.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Twenty app servers with a pool of 20 each is 400 connections. A default Postgres allows 100. Multiply before you deploy.',
        nodes: [
          { id: 'a1', label: 'App server', sub: 'pool of 20', kind: 'service', col: 0, row: 0 },
          { id: 'a2', label: 'App server', sub: 'pool of 20', kind: 'service', col: 0, row: 1 },
          { id: 'p', label: 'Pooler', sub: 'pgbouncer', kind: 'service', col: 1, row: 0 },
          { id: 'db', label: 'Database', sub: 'max 100 conns', kind: 'store', col: 2, row: 0 },
          { id: 'n', label: 'without the pooler, connections multiply by server count', kind: 'note', col: 1, row: 1, span: 2 },
        ],
        edges: [
          { from: 'a1', to: 'p' },
          { from: 'a2', to: 'p' },
          { from: 'p', to: 'db', label: 'few, reused' },
        ],
      },
    },
    body: [
      'Sizing is the part worth knowing. The instinct is a big pool; the right answer is usually a small one. A database with 8 cores cannot truly do more than a couple of dozen things at once, so 500 connections do not run in parallel — they queue inside the database, where you cannot see them, and every query gets slower together. A common starting point is a few times the core count, then measure.',
      'The failure signature is worth recognising: response times climb across every endpoint at once, the database CPU is not high, and errors say "timed out waiting for connection". That is pool exhaustion, and the cause is almost always one slow query holding connections, not too much traffic. One endpoint doing a 10-second report can starve the whole service.',
      'Set a timeout on acquiring a connection. Waiting forever turns a slow dependency into an unbounded pile of stuck requests. Failing fast lets you shed load and stay up.',
      'For serverless or very high instance counts, put a dedicated pooler in front. In transaction mode it hands a real connection to a request only for the duration of a transaction, so hundreds of clients share a handful of connections — at the cost of losing anything that spans transactions, like session-level settings and some prepared-statement behaviour.',
    ],
    followUp: {
      q: '"You added more application servers and the database got slower. Why?"',
      answer:
        'Because each new server brought its own pool, so total connections went up while the database\'s ability to do concurrent work stayed the same. Past a point, more connections means more contention inside the database — context switching, lock waits, memory per connection — so everything slows down together. Adding capacity made things worse, which is why it is a good interview question. The fix is a pooler in front, so the database sees a fixed small number of connections regardless of how many app servers exist, and the queueing happens somewhere you can observe and control. The cost: the pooler is another hop and another thing to run, and transaction-mode pooling quietly breaks session-scoped features.',
    },
    selfCheck: {
      q: 'Your service times out under load, but database CPU is only 30%. What is the most likely cause?',
      answer:
        'Requests are waiting for a connection, not for the database. The pool is exhausted — either it is too small, or something is holding connections far longer than it should: a slow query, a transaction left open across a network call to another service, or a leak where connections are never returned. The clue is the mismatch: a saturated database shows high CPU or high disk wait. Idle database plus timing-out application means the queue is in your process. Check pool wait time and the count of active versus idle connections, and look for the endpoint holding a connection while it waits on something else.',
    },
    traps: [
      'Fixing timeouts by making the pool bigger. That usually moves the queue into the database and makes it worse.',
      'Holding a database connection while calling an external API. Never do work you do not control while holding a scarce resource.',
      'Forgetting that pool size multiplies by the number of application instances.',
    ],
    sayThis:
      '"Pooled connections, sized at roughly four times the database core count, with a two-second acquire timeout so we fail fast instead of piling up. With autoscaling I would put pgbouncer in front so total connections stay flat no matter how many app servers we run."',
    related: ['load-balancing', 'circuit-breakers', 'indexes'],
  },
]
