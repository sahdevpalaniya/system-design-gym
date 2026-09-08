import type { Concept } from '@/lib/types'

/**
 * Tier 1 — the basics.
 *
 * House style: short sentences, everyday words, one idea per sentence. A reader
 * who is not a native English speaker should never have to re-read a line.
 */
export const TIER1: Concept[] = [
  {
    slug: 'latency-numbers',
    title: 'Latency numbers worth memorising',
    tier: 1,
    oneLine: 'Four numbers that tell you where the time actually goes.',
    problem: [
      'When work moves from one machine to another, you pay for the distance. Most slow designs are slow for one reason. Something crosses a boundary far more often than anyone noticed.',
      'You do not need a table of thirty numbers. You need four. And you need to feel the gaps between them, because the gaps are what change your design.',
    ],
    cost: 'Memorising numbers can make you sound sure about a system you have never measured. Real machines vary a lot. Use these numbers to choose between two designs. Never use them to promise a speed to a room full of people.',
    useWhen: [
      'You are deciding whether to make a call inside a loop, or fetch everything in one go.',
      'You are choosing between a cache, a disk read, and a network call.',
      'Someone asks "is this fast enough?" and you want to answer with maths instead of a feeling.',
      'You need to explain a decision about serving users in another region.',
    ],
    avoidWhen: [
      'You have a real profiler and real traffic. Then measure. These numbers stand in for measurement, they do not replace it.',
      'Someone wants a number for an SLA. Do not quote these as a promise.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'The same four operations, drawn to scale. The bars show why the last one keeps ruining designs.',
        items: [
          { label: 'Read from memory', value: 100, display: '~100 ns', tone: 'muted' },
          { label: 'Read from SSD', value: 100_000, display: '~100 µs (1,000x memory)', tone: 'muted' },
          { label: 'Round trip inside one datacenter', value: 500_000, display: '~0.5 ms', tone: 'accent' },
          { label: 'Round trip across the world', value: 150_000_000, display: '~150 ms (300,000x memory)', tone: 'bad' },
        ],
        note: 'The jump that matters is the last one. Anything that crosses an ocean, you get to do once per user action. Not once per item in a list.',
      },
    },
    body: [
      'Four numbers, all in nanoseconds so they compare cleanly. Reading from memory: about 100 ns. Reading from an SSD: about 100 µs, so a thousand times slower. A round trip between two machines in the same datacenter: about 0.5 ms, so five thousand times slower than memory. A round trip between continents: about 150 ms, because light in fibre only moves so fast and the cable never runs straight.',
      'That last number has a floor you cannot remove. London to Sydney and back is about 17,000 km each way. Light in glass covers about 200,000 km per second. So that is already 170 ms of pure physics, before any machine does any work. No amount of money removes it. You can only move the data closer, or stop needing the round trip at all.',
      'This gives you a simple rule. One cross-region hop per user action is a design. Ten is a bug. If you are making a remote call inside a loop over 50 items, that loop is your whole time budget.',
    ],
    followUp: {
      q: 'Your page makes 30 backend calls, and users on the other side of the world complain. Where do you look first?',
      answer:
        'Look at two things. Are those 30 calls one after another? And do any of them cross a region? 30 calls at 0.5 ms each inside one datacenter is 15 ms, which nobody notices. The same 30 calls, each waiting on a 150 ms hop across the world, is 4.5 seconds. So the fix is not "make the calls faster". The fix is "stop making them one after another, and stop making them travel". Group them into one call, run them at the same time, or put a read replica near the user. Name the cost too. A replica near the user can be out of date, and grouping calls means one slow item delays the whole group.',
    },
    selfCheck: {
      q: 'Roughly how many times slower is a round trip across the world than a read from memory — 100x, 1,000x, or a million times? And what does that ratio stop you doing?',
      answer:
        'Roughly a million times. 100 ns against 150 ms is about 1.5 million. What it stops you doing is treating a remote call like a normal function call. In memory you can do a hundred thousand lookups inside one request. Across the world you get one, maybe two, before a person notices. That one ratio is the reason caches, CDNs and read replicas exist at all.',
    },
    traps: [
      'Quoting numbers with fake precision. "About half a millisecond" is right. "0.47 ms" is a claim you cannot back up.',
      'Forgetting that a round trip crosses the distance twice. People quote the one-way number and end up half wrong.',
    ],
    sayThis:
      '"A round trip inside one datacenter is well under a millisecond, so I am not worried about lots of small calls there. Across regions it is over 100 ms, so I will allow exactly one of those per request and design around it."',
    related: ['back-of-envelope', 'caching', 'cdn'],
  },

  {
    slug: 'back-of-envelope',
    title: 'Back-of-envelope estimation',
    tier: 1,
    oneLine: 'Rough maths, done out loud, that tells you which problem you actually have.',
    problem: [
      'Every design has one hard part and several easy parts. They look the same until you do the maths. Without numbers you spend your best ten minutes on the easy part.',
      'The point is not the number. The point is the sentence the number lets you say: "so the hard part here is ___". If your estimate did not change what you were about to build, you did the maths wrong or you ignored the answer.',
    ],
    cost: 'It takes time, and an early number can anchor you. Two minutes estimating is two minutes not designing. And a number you picked badly at the start will quietly shape everything after it. Say your assumptions out loud, so a wrong one gets corrected instead of growing.',
    useWhen: [
      'Right after requirements, before you draw a single box.',
      'When you feel yourself about to say "we will shard it". Check first whether you need to.',
      'When two designs are being argued about in circles. Numbers end arguments.',
    ],
    avoidWhen: [
      'The interviewer says "assume it is huge, skip the maths". Take the offer. Say the one conclusion you would have drawn, then move on.',
      'The number changes nothing, like the exact bytes of logs per month. Do not do maths for its own sake.',
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
      'Here is a method that fits in your head. First, users: pick a number of daily active users, and say clearly that you picked it. Second, actions per user per day. Multiply those, then divide by 100,000. A day has 86,400 seconds, and 100,000 is close enough and much easier to divide by. That gives you the average per second.',
      'Third, peak traffic. Traffic is never flat. Multiply the average by 2 to 10, depending on the product. A work tool spikes hard on weekday mornings. A worldwide chat app barely spikes at all. Say which one you assumed, and why.',
      'Fourth, storage: bytes per record, times records per day, times days you keep them. Fifth, and this is the step people skip: read your answer back and finish the sentence "so the hard part here is ___."',
      'Useful anchors. One million seconds is about 11 days. A day has 86,400 seconds, call it 100,000. A kilobyte of text is a paragraph. A megabyte is a small photo. A terabyte fits on one disk you can hold in your hand, so "a few terabytes" is not a scale problem. That is a normal database.',
    ],
    followUp: {
      q: 'You estimated 500 GB of data. The interviewer asks: "so how many machines?"',
      answer:
        'The honest answer is one, and that is the interesting part. 500 GB fits easily on a single normal server. So the size of the data is not what forces you to split it up. Something else does: a request rate one machine cannot serve, an uptime promise one machine cannot keep, or a blast radius you cannot accept. Say which one applies. If none of them do, say that: "at this size I would run one primary with a replica for failover, and I would look again when we are 20 times bigger." Choosing not to split, out loud, with a reason, scores better than splitting out of habit.',
    },
    selfCheck: {
      q: 'A service has 10 million daily active users, each doing 20 actions a day. What is the rough average requests per second, and what is a reasonable peak?',
      answer:
        '10M × 20 = 200 million actions a day. Divide by 100,000 (the rounded seconds in a day) and you get about 2,000 requests per second on average. At 3x peak that is roughly 6,000 per second. That is a real number, but not a scary one. A handful of application servers handle it. The next thing to say is which of those 20 actions are reads and which are writes, because that split decides the design far more than the total does.',
    },
    traps: [
      'Doing the maths and then designing as if you had not. The estimate has to change a decision, or it was decoration.',
      'Fake precision. "1,847 requests per second" from made-up assumptions is worse than "roughly two thousand".',
      'Forgetting peak traffic, then being caught out by the sale-day question later.',
    ],
    sayThis:
      '"Ten million daily users, twenty actions each, so about two thousand per second on average and call it six thousand at peak. Reads are maybe fifty to one against writes. So the hard part here is read fan-out, not durability."',
    related: ['latency-numbers', 'caching', 'partitioning'],
  },

  {
    slug: 'caching',
    title: 'Caching',
    tier: 1,
    oneLine: 'Keep a copy of the answer near whoever keeps asking for it.',
    problem: [
      'Databases are good at storing things. They are slow at answering the same question ten thousand times a second. A cache keeps that answer somewhere faster and closer, so most requests never reach the database at all.',
      'It is the single biggest win in read-heavy systems. It is also where most stale-data bugs come from.',
    ],
    cost: 'You now have two copies of the truth, and they can disagree. Users may see old data. You have added a part that can fail, and when it fails, everything it was protecting gets hit at once. And from now on you have to decide, for every item, when it stops being true.',
    useWhen: [
      'Reads are far more common than writes. This is the main reason.',
      'The same items get asked for again and again (a popular product, a hot post).',
      'The answer is expensive to work out, and slightly old data is genuinely fine.',
    ],
    avoidWhen: [
      'The data must be exactly right this instant: account balances at payment time, remaining seats, stock counts.',
      'Every request asks for something different. A cache that never gets a hit is pure cost.',
      'Writes happen almost as often as reads. You will spend all your time clearing the cache.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'cache-miss',
        caption:
          'A miss costs more than having no cache at all. You check the cache, find nothing, then go to the database anyway. Caches only pay off when hits are common.',
      },
    },
    body: [
      'Where to put it. In the browser: free and closest, but you cannot take it back once you have sent it. In a CDN: great for anything shared between users. Inside the application process: fastest of all, but every server has its own copy, so they drift apart. In a shared cache like Redis or Memcached: one copy every server agrees on, at the cost of a network hop. Inside the database itself: real, but you do not control it.',
      'Cache-aside is the default, and the one to describe. The application asks the cache. If it is not there, the app reads the database, writes the answer into the cache, and returns it. It is simple. And if the cache goes down you get slower, not broken.',
      'Write-through writes to the cache and the database together. The cache is never stale, but every write pays both costs, and you cache things nobody will ever read. Write-behind writes the cache now and the database shortly after. That is fast, and you can lose data in the gap. Say which one you picked, and why.',
      'Now, clearing the cache, honestly. There are two ways and both are compromises. A TTL means the data is wrong for at most that long, and you never have to think about it. Deleting the key on every write means it is right almost always, but every piece of code that writes has to remember. One that forgets creates a bug nobody can reproduce. Most real systems use a TTL as the safety net and explicit deletion on top of it.',
      'The empty-cache problem is worth knowing by name. On a cold start, or after a mass eviction, every request goes to the database at the same moment. The database falls over. And when it comes back, the cache is still empty. There are three defences. Request coalescing: when a hundred requests miss on the same key, let one go to the database and make the other ninety-nine wait for that answer. Jittered TTLs, so a million keys written together do not all expire in the same second. And warming the cache before you send traffic to it.',
      'A related problem: a request for a key that does not exist anywhere hits the database every single time, because there is nothing to cache. If that is common, say because someone is probing random IDs, cache the "not found" answer too, briefly. Or put a bloom filter in front.',
    ],
    followUp: {
      q: '"Your cache just died. What happens?"',
      answer:
        'Every read that was being served from memory now goes to the database at once. So the honest answer starts with a question: does the database survive that? Usually not, at the ratios that made me add a cache in the first place. So I would not depend on the cache being up. I would coalesce requests, so one miss on a key means one database read and not ten thousand. I would put a small in-process cache on each application server as a second layer, so even with the shared cache gone we absorb the hottest keys. I would rate-limit or drop traffic at the edge instead of letting the database die, because a slow site beats a dead one. And I would bring the cache back warm, not empty. The cost of all that: more moving parts, and the in-process layer means servers can briefly disagree with each other.',
    },
    selfCheck: {
      q: 'Name one thing you should never cache in a booking system, and say exactly why.',
      answer:
        'Remaining seats or rooms, at the moment of booking. Most caching decisions trade speed against freshness. This one trades correctness. If two people both read a cached "1 seat left" that is two seconds old, they both book, and you have sold the same seat twice. The general rule: never cache the value a commit decision is based on, when other people are competing for that value. You can cache the search page that shows roughly what is available, because being slightly wrong there is a small annoyance. But the final check must read the real thing, inside the transaction that reserves it.',
    },
    traps: [
      'Saying "add a cache" without saying what clears it. That is the follow-up question, every time.',
      'Assuming a cache makes writes faster. It does not. It usually makes them slightly slower.',
      'Ignoring what happens when it is empty. That is where the outage lives.',
    ],
    sayThis:
      '"Cache-aside in Redis, five minute TTL with jitter, and I delete the key on write. Cost: on the rare path where the delete fails, a user can see data up to five minutes old. And if Redis dies the database takes the full read load, so I will coalesce misses to make one key mean one database read."',
    related: ['latency-numbers', 'cdn', 'bloom-filters', 'consistency-models'],
  },

  {
    slug: 'load-balancing',
    title: 'Load balancing',
    tier: 1,
    oneLine: 'One address in front, many machines behind, and a way to stop sending traffic to a broken one.',
    problem: [
      'One server can only do so much, and one day it will restart or die. A load balancer lets you put several servers behind a single address, spread requests between them, and quietly stop using any server that stops answering.',
      'It is also what makes deploys boring. Take one server out, update it, put it back, repeat.',
    ],
    cost: 'It is one more hop (a fraction of a millisecond) and one more thing that can fail, so it needs a backup of its own. It also pushes you to keep no user state on your servers. If a server holds a session in memory, every request from that user has to come back to that same server, and you have lost half the benefit.',
    useWhen: [
      'You have more than one server. That is the whole condition.',
      'You want deploys and restarts with no downtime.',
      'You want broken machines removed automatically by health checks.',
    ],
    avoidWhen: [
      'You really do have one machine and downtime is acceptable. Then it is complexity for nothing.',
      'The thing behind it keeps important state per connection and cannot be changed. Fix that first, or accept sticky routing and what it costs.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'load-balancer',
        caption:
          'Requests arrive at one address and land on whichever server is free. Remove a server from the pool and traffic simply stops going there.',
      },
    },
    body: [
      'Layer 4 balancing looks only at IP and port. It does not read the request, so it is fast and works for any protocol. Layer 7 reads the HTTP request, so it can route by path or header, handle TLS, and retry a failed request on another server. Layer 7 is the default for web traffic. Layer 4 is for raw speed and for protocols that are not HTTP.',
      'The algorithms, in the order you should reach for them. Round robin: fine when all requests are similar. Least connections: better when some requests take much longer than others, which is most real systems. Consistent hashing on a key: use it when you want the same user or key to keep landing on the same server, usually so its cache stays useful.',
      'Health checks are the part that really earns its place. A passive check notices failing responses. An active check calls an endpoint every couple of seconds. That endpoint should test something real, like whether it can reach the database. But not so real that one slow dependency makes every server mark itself broken at the same time and takes down the whole fleet. That failure is common and embarrassing.',
      'Sticky sessions pin a user to one server. It solves in-memory session state, and it costs you: uneven load, a messy story when you add machines, and users losing their state when a server restarts. It is better to put session state in a shared store and keep every server interchangeable.',
      'Above the load balancer sits DNS, which spreads traffic across regions or across several balancers. Clients cache DNS for minutes, so DNS on its own is a poor way to fail over. Say that if someone suggests it.',
    ],
    followUp: {
      q: '"How do you deploy a new version with zero downtime?"',
      answer:
        'A rolling deploy through the load balancer. Take one instance out of the pool. Wait for the requests it is already handling to finish. That waiting step is called connection draining, and forgetting it is how you drop live traffic during a "zero downtime" deploy. Then update it, wait for its health check to pass, put it back, and move to the next one. Keep enough instances in the pool the whole time to carry the traffic. Two things make this actually work. First, the new version has to run happily beside the old one, which means database changes get split across releases: add the column, deploy, backfill, then remove the old column. Second, you need a fast way out, and rolling forward to a known-good build is safer than trying to undo a migration. Cost: every schema change now takes three deploys instead of one.',
    },
    selfCheck: {
      q: 'Your health check endpoint queries the database. The database gets slow. What happens to your fleet, and what would you do differently?',
      answer:
        'Every health check times out at the same time. The balancer marks every server broken and removes them all. Now nothing is being served, including requests that never needed the database. A slow dependency became a full outage. The fix: make the liveness check cheap and dependency-free, answering only "is this process alive". Keep a separate readiness check that may look at dependencies. Balancers should also refuse to remove the last healthy instances. If everything looks broken, keep sending traffic anyway, because a degraded service beats no service.',
    },
    traps: [
      'Drawing one load balancer and calling the design highly available. That box is now the single point of failure.',
      'Forgetting connection draining, and dropping requests on every deploy.',
      'Reaching for sticky sessions instead of taking state off the servers.',
    ],
    sayThis:
      '"Layer 7 balancer, least-connections, active health checks on a cheap endpoint that does not touch the database. Servers hold no session state, so any server can take any request. Cost: an extra hop, and I need at least two balancers, or the balancer is the single point of failure I just drew."',
    related: ['circuit-breakers', 'consistent-hashing', 'rate-limiting'],
  },

  {
    slug: 'sql-vs-nosql',
    title: 'SQL vs NoSQL — and why, not just names',
    tier: 1,
    oneLine: 'Choose by how you read the data, and by what must never be wrong. Not by which word sounds bigger.',
    problem: [
      'Relational databases give you a fixed schema, joins, and real transactions across many rows. Non-relational ones give some of that up. In return they spread across machines more easily, and they store data in exactly the shape you read it.',
      'This choice matters because it is very hard to undo. Almost everything else in your design can be swapped in an afternoon. The data model cannot.',
    ],
    cost: 'Choosing relational costs you work once one machine is not enough. You have to split the data yourself, and joins and transactions across those splits get painful. Choosing non-relational costs you flexibility. You must know your queries before you store the data, and any new question means rewriting the data or copying it into a second system.',
    useWhen: [
      'Relational: money, stock, anything that needs a transaction across several rows. Also queries you cannot predict, and normal scale, which covers most systems.',
      'Non-relational: one main, well-known way of reading the data. Very heavy writes. Data with no natural joins. Rows whose shape varies.',
    ],
    avoidWhen: [
      'Do not pick non-relational for scale you have not estimated. Do the maths first. One well-indexed relational database handles more than people think.',
      'Do not pick relational, then use it as a key-value store with one big JSON column, and pretend you chose carefully.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The honest version of the comparison — it is about what you give up.',
        a: {
          title: 'Relational (Postgres, MySQL)',
          points: [
            'Transactions across many rows, so "take payment and reserve the seat" is one all-or-nothing step.',
            'Ask questions you never planned for. Joins and one-off queries just work.',
            'Rules live in the database, so bad data cannot get in even through a buggy service.',
            'Scaling reads is easy (replicas). Scaling writes past one machine is real work you do by hand.',
            'Changing the schema of a huge table needs care and a plan.',
          ],
        },
        b: {
          title: 'Non-relational (Dynamo, Cassandra, Mongo)',
          points: [
            'Spreads across machines by design, so write capacity grows by adding boxes.',
            'You store data in the shape you will read it, so a read is one lookup with no joins.',
            'Rows can differ from each other, so adding fields is cheap.',
            'Transactions are limited, usually to one item or one partition. Past that it gets awkward.',
            'A new way of reading means a new table and a backfill, not just a new query.',
          ],
        },
        verdict:
          'Start relational, unless you can name the exact thing it cannot do for you. "We will have 50,000 writes a second on one table, and we only ever read by user id" is a reason. "It is web scale" is not. You are also allowed to use both: the transactional core in Postgres, the huge append-only stream somewhere else.',
      },
    },
    body: [
      'Here is the question that actually decides it. What is the one query this system runs ten thousand times a second? And does anything here have to be exactly right when many people compete for it?',
      'If the hot query is "give me everything for this one key", non-relational fits well and its limits will not hurt you. If the system involves seats, stock, balances or unique names, you want real transactions. Building those yourself on top of a store that lacks them is much harder than it looks.',
      'Two things people get wrong. First, non-relational is not automatically faster. It is faster for the pattern you designed it around, and often much slower for anything else. Second, relational databases have improved a lot: replicas, partitioning, JSON columns, and hosted versions that split the data for you. The gap you may be imagining is ten years out of date.',
      'For large scale, be specific about the shard key instead of the brand name. "Cassandra" tells the interviewer nothing. "Partition by user id, sort by timestamp descending, so one user\'s recent items are one continuous read" tells them you understand the machine.',
    ],
    followUp: {
      q: '"Why this database and not Postgres?"',
      answer:
        'The answer has to be a number or a pattern, not a preference. Something like: "The write rate is around 80,000 per second, all day, on one logical table. It is append-only with no transactions across rows. One Postgres primary will not take that, so I would be splitting it by hand, which means building what a distributed store already gives me, including rebalancing and failover. The read pattern is a single key lookup, so I am giving up joins I do not need." Then name the cost: no transactions across partitions, so any rule that spans partitions has to live in application code, and analytics queries need a separate copy of the data. If you cannot produce a sentence like that, then Postgres is fine, and saying so is a strong answer.',
    },
    selfCheck: {
      q: 'You are designing a system that records payments. Which do you pick, and what is the one word that decided it?',
      answer:
        'Relational. The word is "transaction" — not the database feature, the business event. Recording a payment means several rows must change together or not at all: the ledger entry, the order status, the balance. If only half of that lands, you get a support ticket about missing money, which is the most expensive kind of bug there is. Money is also low-volume compared to almost anything else in a product, so the scale argument for the other choice usually is not there. And regulators like being able to query the data in ways nobody planned for.',
    },
    traps: [
      'Naming a database instead of naming how you will read the data.',
      'Claiming non-relational stores "cannot do transactions". Many can, within one partition. Know the limit you are describing.',
      'Choosing for write volume you never estimated.',
    ],
    sayThis:
      '"Postgres for the core, because bookings need a real transaction. The event stream is 50k writes a second and only ever read by device id, so that goes in a partitioned key-value store. Cost: two systems to run, and no transaction covers both — so I will make the stream safe to repeat instead."',
    related: ['indexes', 'partitioning', 'distributed-transactions'],
  },

  {
    slug: 'indexes',
    title: 'Indexes and what makes a query slow',
    tier: 1,
    oneLine: 'A sorted lookup table, so the database stops reading every row.',
    problem: [
      'Without an index, answering "find the rows where email is this" means reading the whole table. At a thousand rows nobody notices. At fifty million rows it is why your page takes nine seconds.',
      'An index is a second structure, kept in sorted order, that turns that full scan into a few jumps.',
    ],
    cost: 'Every index makes writes slower, because each insert, update and delete has to update the index too. Indexes use disk and memory. And an index the database never chooses to use is pure cost with no benefit, which is more common than you would think.',
    useWhen: [
      'A column shows up in a WHERE, JOIN or ORDER BY, on a table big enough to matter.',
      'You need to enforce uniqueness. A unique index is how you actually stop duplicate emails.',
      'A query reads only a few columns, and you can answer it entirely from the index without touching the table.',
    ],
    avoidWhen: [
      'The table is small. Reading 5,000 rows is fast, and the database may ignore your index anyway.',
      'The column has very few different values, like a true/false flag, and the query matches most rows. A full scan is cheaper.',
      'The table takes heavy writes and the index is rarely used. You are taxing every write to speed up a query nobody runs.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Same query, same table of 50 million rows, one index added.',
        items: [
          { label: 'No index — read every row', value: 50_000_000, display: '50,000,000 rows examined', tone: 'bad' },
          { label: 'B-tree index — a few jumps', value: 26, display: '~26 rows examined', tone: 'accent' },
        ],
        note: 'A B-tree cuts the search area roughly in half at every level. So doubling the table adds one step, not double the work. That is why an index feels like magic, and why missing one is invisible until the table grows.',
      },
    },
    body: [
      'The default index is a B-tree. It is sorted, so it handles exact matches, ranges and ORDER BY from the same structure. A hash index only handles exact matches. An inverted index maps each word to the documents that contain it, which is how text search works. A geospatial index sorts by location, so "near me" becomes answerable.',
      'Composite indexes have one rule that catches people out. An index on (country, city, name) can answer a query that filters on country, or on country and city, or on all three. It cannot answer one that filters on city alone. Think of a phone book sorted by surname then first name: it is useless for finding everyone called James. So put the column you always filter on first, and put exact-match columns before range columns.',
      'Here are the usual reasons a query is slow, in the order to check them. There is no index on the column you filter by. There is one, but the query hides it: wrapping the column in a function, or comparing two different types, stops the database using it. The filter matches most of the table, so a full scan really is the right plan. You are sorting a large result the index cannot give you in order. You are paging with a large OFFSET, which makes the database walk past and throw away everything before it. Or the query is fine and it returns 100,000 rows over the network, which is a payload problem, not a database one.',
      'The N+1 query is worth naming because it is so common. You fetch 100 orders, then loop and fetch each order\'s customer one at a time. That is 101 round trips where one join, or one batched lookup, would do. It is invisible while you develop and fatal in production.',
      'When asked how you would debug it, say EXPLAIN. Read the plan. Look for a full scan on a large table, and check whether the estimated row count matches reality. A plan built on out-of-date statistics chooses badly.',
    ],
    followUp: {
      q: '"One user reports a slow request. How do you debug it?"',
      answer:
        'Work down the stack instead of guessing. First: is it slow for everyone, or only for them? A chart of that endpoint\'s p50 and p99 answers this in seconds. If p99 is bad but p50 is fine, it depends on the data, which means that user has far more rows than a typical user. Second: get a trace of the request and see where the time went. Was it one slow call, or two hundred fast ones? Two hundred fast ones is the N+1. Third: if it is one slow query, run EXPLAIN with their parameters, not with typical ones, because the plan can be different. The common outcome is that they are a heavy account, the query has no index for their combination of filters, and the database switched to a full scan once their row count passed a threshold. The fix is usually an index or a change to paging. The cost of that index is slower writes on the table.',
    },
    selfCheck: {
      q: 'You have an index on (user_id, created_at). Which of these two queries uses it — filtering by user_id alone, or filtering by created_at alone? Why?',
      answer:
        'user_id alone uses it. created_at alone does not. The index is sorted by user_id first, and only sorted by created_at inside each user. So all of one user\'s rows sit together and are easy to find. But rows from last Tuesday are scattered across every user in the index. It is like a phone book sorted by surname: finding all the Patels is easy, finding everyone named Priya means reading the whole book. If you need created_at on its own, that is a second index, and it costs you on every write.',
    },
    traps: [
      'Adding an index on every column "to be safe". You have now made every write slower, for queries nobody runs.',
      'Assuming an index exists because the column is important. It exists because someone created it.',
      'Missing the N+1, because each single query looks fast in the log.',
    ],
    sayThis:
      '"That query filters by user and sorts by time, so a composite index on (user_id, created_at desc) serves both the filter and the sort. Cost: another index to maintain on a write-heavy table, and it will not help any query that filters on time alone."',
    related: ['sql-vs-nosql', 'search-indexing', 'geospatial-indexing'],
  },

  {
    slug: 'connection-pooling',
    title: 'Connection pooling',
    tier: 1,
    oneLine: 'Reuse a small set of open database connections, instead of opening one per request.',
    problem: [
      'Opening a database connection is expensive. There is a TCP handshake, TLS, a login, and on some databases a whole new process. Doing that for every request wastes more time than the query itself.',
      'Worse, databases have a hard limit on how many connections they allow at once. Go past it and new connections are refused, which looks like a total outage even though the database is barely doing any work.',
    ],
    cost: 'The pool is a queue, so when it is full, requests wait. A pool that is too small becomes your bottleneck while the database sits idle. Pools also carry state. A connection handed back mid-transaction, or with a session setting still on, causes bugs that show up in unrelated requests later.',
    useWhen: [
      'Always, for any service that talks to a relational database. This is a default, not a decision.',
      'Especially when your application servers scale up and down. Each new server multiplies your connection count.',
    ],
    avoidWhen: [
      'Serverless functions that scale to hundreds of instances, each with its own pool. There you need a separate pooler sitting between them and the database, or you will hit the limit immediately.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Twenty app servers with a pool of 20 each is 400 connections. A default Postgres allows 100. Do the multiplication before you deploy.',
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
      'Sizing is the part worth knowing. Your instinct says a big pool. The right answer is usually a small one. A database with 8 cores cannot truly do more than a couple of dozen things at once. So 500 connections do not run side by side. They queue inside the database, where you cannot see them, and every query gets slower together. A common starting point is a few times the core count. Then measure.',
      'The failure has a recognisable shape. Response times climb on every endpoint at once. Database CPU is not high. Errors say "timed out waiting for connection". That is pool exhaustion, and the cause is almost always one slow query holding connections, not too much traffic. One endpoint running a 10-second report can starve the whole service.',
      'Set a timeout on getting a connection. Waiting forever turns a slow dependency into an endless pile of stuck requests. Failing fast lets you drop traffic and stay up.',
      'For serverless, or for a very large number of instances, put a dedicated pooler in front. In transaction mode it lends a real connection to a request only for the length of one transaction, so hundreds of clients share a handful of connections. The cost is that anything spanning transactions breaks, including session-level settings and some prepared-statement behaviour.',
    ],
    followUp: {
      q: '"You added more application servers and the database got slower. Why?"',
      answer:
        'Because each new server brought its own pool. Total connections went up, while the database\'s ability to do work at the same time stayed the same. Past a point, more connections means more fighting inside the database: context switching, waiting on locks, memory per connection. So everything slows down together. Adding capacity made things worse, which is why it is a good interview question. The fix is a pooler in front, so the database sees a fixed small number of connections no matter how many app servers exist, and the waiting happens somewhere you can see and control. The cost: the pooler is another hop and another thing to run, and transaction-mode pooling quietly breaks session-scoped features.',
    },
    selfCheck: {
      q: 'Your service times out under load, but database CPU is only 30%. What is the most likely cause?',
      answer:
        'Requests are waiting for a connection, not for the database. The pool is exhausted. Either it is too small, or something is holding connections far longer than it should: a slow query, a transaction left open while calling another service, or a leak where connections are never given back. The clue is the mismatch. A busy database shows high CPU or high disk wait. An idle database plus a timing-out application means the queue is inside your own process. Check pool wait time and the count of active against idle connections, and look for the endpoint that holds a connection while waiting on something else.',
    },
    traps: [
      'Fixing timeouts by making the pool bigger. That usually moves the queue into the database and makes it worse.',
      'Holding a database connection while calling an external API. Never do work you do not control while holding something scarce.',
      'Forgetting that pool size multiplies by the number of application instances.',
    ],
    sayThis:
      '"Pooled connections, sized at roughly four times the database core count, with a two-second timeout on getting one so we fail fast instead of piling up. With autoscaling I would put pgbouncer in front, so total connections stay flat no matter how many app servers we run."',
    related: ['load-balancing', 'circuit-breakers', 'indexes'],
  },
]
