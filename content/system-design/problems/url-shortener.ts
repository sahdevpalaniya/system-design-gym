import type { Problem } from '@/lib/types'

export const URL_SHORTENER: Problem = {
  slug: 'url-shortener',
  title: 'Link shortener',
  navTitle: 'URL shortener',
  group: 'read-heavy',
  difficulty: 'starter',
  concepts: [
    'caching',
    'back-of-envelope',
    'sql-vs-nosql',
    'cdn',
    'indexes',
    'latency-numbers',
    'api-design',
    'transactions-and-locking',
  ],
  prompt:
    'Design a service that turns a long URL into a short one, and sends anyone who visits the short link to the original. Anyone can create links; links do not expire by default.',

  slack: {
    budget: 'Reads: none. Writes: seconds.',
    headline: 'A person is standing in front of a blank browser tab waiting to be redirected. There is nowhere to hide latency on the read path.',
    body: [
      'The redirect has zero slack. It is the entire product, it happens before any page renders, and a human is watching a spinner. Two hundred milliseconds here is noticeable; a second feels broken. That is why this problem is a caching problem and nothing else.',
      'The write path has plenty of slack, and almost nobody uses it. Creating a link is a thing a person does once, on purpose, and waiting 300 ms for it is completely fine. So you can afford a database round trip, a uniqueness check, even a retry, on writes — and you must afford none of that on reads.',
      'Analytics has enormous slack. Nobody checks their click count within a second of the click. That means counting can be asynchronous, batched, approximate, and moved entirely off the redirect path — which is exactly what saves you, because otherwise every redirect becomes a write.',
    ],
    consequence:
      'The slack profile decides the whole design: redirect served from memory with no database on the path, creation allowed to be slow and careful, click counting fired into a queue and aggregated later. Get those three budgets right and the rest is bookkeeping.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'Which assumptions here actually change the design — and which are just settings?',
        'Is there a question about who owns the links, or about whether custom names are allowed?',
        'Say the read/write split as an assumption. It is the most load-bearing one.',
      ],
      model: [
        'Assumptions, said in one breath: global users, a few hundred million links total, reads massively outnumber writes, auth exists but is not what we are designing, and links are permanent unless someone deletes one.',
        'One question that changes a box: can users pick their own short code? Because if yes, I need a uniqueness check on a user-supplied string on the write path, and that is a completely different write design from generating a code myself. I will assume yes, custom codes are supported, because most real products need it and it is the more interesting version.',
        'A second question: does the click count need to be exact, or is close enough fine? Because exact means a synchronous write on every redirect, which is the one thing I do not want on that path. I will assume approximate is fine.',
        'Scope I propose: create a link, optionally with a custom code; follow a link; and rough click counts. Out of scope: editing links, expiry, link previews, spam and malware checking — I would flag that last one as a real production requirement I am setting aside on purpose.',
      ],
      checklist: [
        'Stated scale, region and read/write split as assumptions rather than asking about them',
        'Asked about custom short codes — it changes the write path',
        'Asked whether click counts must be exact — it decides whether redirects write to a database',
        'Proposed a scope without being asked',
        'Named at least one thing left out of scope on purpose',
      ],
      tradeoffs: [
        {
          decision: 'Allow custom codes',
          cost: 'Every creation needs a uniqueness check against user-supplied input, and I need a reserved-word list so nobody claims /login.',
        },
        {
          decision: 'Approximate click counts',
          cost: 'The number shown can be a minute behind and can lose a few clicks on a crash. In exchange the redirect path never writes to a database.',
        },
      ],
      sayThis:
        '"Assuming global, a few hundred million links, and reads beating writes by around a hundred to one. One question — can users choose their own code? That decides whether I need a uniqueness check on the write path. I will assume yes, and focus on the redirect being fast."',
      trap: 'Asking about the maximum URL length, or the character set of the code. Neither changes a box on the whiteboard. Assume and move on.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system itself — then write a link\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'Who touches this besides the person creating and the person clicking?',
        'What decisions does the platform make without being asked?',
        'At each state: what if this never finishes? What if the thing on the other end is gone?',
      ],
      model: [
        'Actors: the creator, the visitor who clicks, and the system itself. The system is the one worth naming — it generates codes, decides whether a code is available, decides what to do with a code that does not exist, and later decides when to stop counting a click as real rather than a bot.',
        'The chain: link requested → code chosen (generated or claimed) → link stored → link served, over and over → optionally deleted or expired.',
        'Failure branches, which is where the design actually lives. At code chosen: the generated code collides with an existing one — retry with a new code, and if custom, return "that name is taken" immediately. At stored: the write succeeds but the cache is not updated, so the very first click on a brand-new link misses — acceptable, it falls through to the database. At served: the code does not exist, so return a clean 404 rather than a redirect to nowhere; or the code exists but the destination is now dead, which is not our problem to fix but is our problem to not pretend about. At served, second branch: the destination turns out to be malware reported after creation, so we need the ability to disable a live link and have that take effect fast — which means the cache TTL is also a safety control, not just a performance one.',
        'One more the system owns: the click that arrives while the counting queue is backed up. It should still redirect. Counting is allowed to fail; redirecting is not.',
      ],
      checklist: [
        'Listed the system itself as an actor, not just the two humans',
        'Wrote the states as a chain from creation to serving',
        'Handled code collision on generation, and "taken" on custom codes',
        'Handled a code that does not exist — a clean 404, not a broken redirect',
        'Handled disabling a live link, and noticed the cache TTL is what bounds it',
        'Said that counting may fail but redirecting may not',
      ],
      trap: 'Writing only "create → redirect" and stopping. That is the happy path, and it is half a lifecycle. The collision case and the disable-a-bad-link case are what the interviewer is waiting for.',
    },

    {
      id: 3,
      ask: 'Estimate writes per second, reads per second, and storage. Then finish the sentence: "So the hard part here is ___."',
      nudges: [
        'Pick a daily creation number and say you picked it.',
        'Reads are a multiple of writes — choose the multiple and justify it.',
        'Storage: how many bytes is one link row, really?',
      ],
      model: [
        'Assume 100 million new links a month. That is roughly 3.3 million a day, divided by 100,000 seconds, so about 40 writes per second. Peak at 3x is 120. That is nothing — one modest database handles it without thinking.',
        'Reads: assume 100 clicks per link over its life, which gives about 4,000 reads per second average, call it 12,000 at peak. Also not enormous, but it is a hundred times the write rate, and that ratio is the whole story.',
        'Storage: a row is roughly a 7-character code, a URL averaging 100 bytes, a user id, a timestamp, a flag. Call it 200 bytes with overhead. 100 million a month is 20 GB a month, 240 GB a year. After five years that is about 1.2 TB — which fits on one machine. So this is not a storage problem either.',
        'So the hard part here is read latency, not throughput and not size. Everything I build should be aimed at answering a redirect from memory. And the second hard part is code generation without collisions, because that is the only place where correctness can actually break.',
      ],
      checklist: [
        'Produced a writes-per-second number with the assumption behind it stated',
        'Produced a reads-per-second number and named the read:write ratio',
        'Estimated storage and concluded it fits on one machine',
        'Explicitly said write sharding is not needed — the numbers ruled it out',
        'Finished the sentence: the hard part is read latency and code collision',
      ],
      tradeoffs: [
        {
          decision: 'Not sharding writes',
          cost: 'One primary is the write ceiling. At 120 writes a second I have three orders of magnitude of headroom, so I revisit this when writes approach 10,000/sec, not before.',
        },
      ],
      sayThis:
        '"Forty writes a second and four thousand reads a second, so reads are a hundred to one. A terabyte after five years, which is one machine. So the hard part here is read latency — I am going to spend everything on making the redirect never touch a database, and I am explicitly not going to design write sharding."',
      trap: 'Doing the maths, finding 40 writes a second, and then designing a sharded write pipeline anyway. That is ignoring your own answer, and it is the exact failure the numbers stage exists to prevent.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'Start at the click and follow it to storage and back.',
        'For each box, say the one number or requirement that put it there.',
        'How is the short code actually generated? That is a design decision, not a detail.',
      ],
      model: [
        'Read path: client → CDN or edge → redirect service → cache → database, with the cache expected to answer almost everything. Justification per box: the edge is there because clicks come from everywhere and a cross-region round trip is 150 ms, which is most of my latency budget. The cache is there because 4,000 reads a second against 40 writes a second means the same links are requested repeatedly and the data is tiny. The database is there because the cache is not durable.',
        'Write path: client → creation service → database, synchronously, then a cache write. Justified by the write rate being 40 a second — I do not need anything clever, and the user creating a link can wait 200 ms for a proper uniqueness check.',
        'Code generation, which is the real decision. Three options. Hash the URL and take the first 7 characters: same URL gives the same code, which is nice, but collisions must still be handled and two users cannot get different links to the same destination. Random 7 characters from a 62-character alphabet: 3.5 trillion possibilities, so at 100 million links a month, collisions are rare but real — insert with a unique constraint and retry on failure, which is simple and correct. Or a counter encoded in base62: no collisions at all by construction, but a single global counter is a coordination point, and sequential codes are guessable, which leaks how many links exist and lets someone enumerate them. I would take random-with-unique-constraint: the retry rate stays negligible, there is no coordination, and codes are not guessable. Cost: a tiny probability of a retry on write, which I have plenty of budget for.',
        'Data model: one table keyed by code, holding destination, owner, created time, disabled flag. The key is the code because every single read is a lookup by code. Custom codes and generated codes share the same namespace and the same unique constraint, which is what makes "that name is taken" fall out for free.',
        'Analytics: the redirect fires a click event onto a queue and returns immediately — it does not wait, and it does not write to the database. A consumer aggregates counts. This is justified by the Stage 1 assumption that counts can be approximate, and it is what keeps the redirect path read-only.',
        'A 301 versus 302 decision worth naming: 301 is permanent and browsers cache it hard, which makes repeat clicks free and means you can never count them or change the destination. 302 keeps every click coming to you. I would use 302, because click counting and the ability to disable a bad link are both requirements, and I am accepting the extra traffic that costs.',
      ],
      checklist: [
        'Every box has a stated reason — a requirement or a number',
        'Cache sits in front of the database on the read path',
        'Chose a code generation strategy and named the alternatives',
        'Handled collisions with a unique constraint and a retry, not with hope',
        'Data model keyed by the short code, because that is the only read pattern',
        'Click counting moved off the redirect path onto a queue',
        'Made the 301 vs 302 decision on purpose',
      ],
      tradeoffs: [
        {
          decision: 'Random codes with a unique constraint',
          cost: 'A small chance of a retry on insert, and no way to detect that two links point at the same URL. In exchange, no global counter and codes are not enumerable.',
        },
        {
          decision: '302 instead of 301',
          cost: 'Every repeat click comes back to my servers instead of being served from the browser cache — more traffic, and it is the price of counting clicks and being able to disable a link.',
        },
      ],
      trap: 'Adding a queue to the write path. Forty writes a second does not need one, and it turns a synchronous "your link is ready" into an awkward "we will let you know". Queues belong on the analytics path here, not the creation path.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'The numbers said read latency and collisions. Go there.',
        'What happens when the cache is empty or dies?',
        'What is the abuse story? This service is a gift to spammers.',
      ],
      model: [
        'Hard part one: making the redirect never wait on a database. The data is tiny — 200 bytes a row — so the working set of popular links fits in memory easily. Cache-aside in Redis, keyed by code, with a long TTL because links almost never change. On top of that, a small in-process cache on each redirect server for the hottest few thousand codes, which removes even the Redis hop for the links that matter most. Cost: a link disabled for malware stays live for as long as the longest TTL in the stack, so I would keep the in-process TTL short — 30 seconds — and publish an invalidation message on disable. That is a real tradeoff: I am accepting up to 30 seconds of a bad link being live in exchange for removing a network hop from the hot path.',
        'The empty-cache case, which is the one that actually takes services down. If Redis restarts, every redirect goes to the database at once — 12,000 a second at peak against a database sized for 40 writes. Two defences: coalesce misses so a thousand simultaneous requests for the same code produce one database read, and warm the cache from the top codes before taking traffic. Cost: coalescing adds a lock per key and a small latency penalty on the miss path.',
        'Also: a request for a code that does not exist cannot be cached normally, because there is nothing to store — so an attacker enumerating random codes drives every request to the database. Cache the negative result for a short window, or put a bloom filter of existing codes in front. Cost: a newly created link may be briefly reported as missing if the filter is stale, so the filter is updated on write and the negative cache TTL is kept to seconds.',
        'Hard part two: correctness on creation. The unique constraint on the code column is what actually guarantees no two links share a code — not application logic, which has a race between checking and inserting. Insert, catch the constraint violation, generate a new code, retry up to a few times. For custom codes, the same constraint gives "that name is taken" with no extra code. I also need a reserved list so nobody claims /api, /login or /settings. Cost: the reserved list is a maintenance item that will be forgotten and then discovered by an incident.',
        'Abuse, which a real interviewer will raise and which I would raise myself: this service is an excellent tool for hiding malicious destinations. Rate limit creation per account and per IP, check destinations against a reputation service asynchronously after creation, and make disabling a link fast and cache-aware. Cost: the async check means a bad link is live for a short window, which I accept because a synchronous check would put a third-party call on the creation path and make it fail whenever they do.',
        'Scaling later, said as a plan rather than a build: redirect servers are stateless so they scale horizontally behind a balancer; the database gets read replicas long before it needs partitioning; and if it ever does need partitioning, the code is a perfect shard key because every read and every write is keyed by it. Cost of that future move: nothing breaks, because I chose the key correctly on day one.',
      ],
      checklist: [
        'Layered cache with a stated TTL, and named what the TTL costs on the disable path',
        'Handled the empty or dead cache — coalescing and warming',
        'Handled lookups for codes that do not exist — negative caching or a bloom filter',
        'Uniqueness enforced by a database constraint, not by check-then-insert',
        'Reserved words for custom codes',
        'Named the abuse problem and the rate limit, unprompted',
        'Said what future partitioning would look like and why the key already works',
        'Named a cost after every decision',
      ],
      tradeoffs: [
        {
          decision: 'In-process cache in front of Redis',
          cost: 'Servers can briefly disagree, and a disabled link can stay live for the length of that TTL. Bounded to 30 seconds and paired with an invalidation broadcast.',
        },
        {
          decision: 'Asynchronous malware checking',
          cost: 'A malicious link is reachable for a minute or two after creation. The alternative puts a third-party call in the creation path and inherits their downtime.',
        },
        {
          decision: 'Negative caching for missing codes',
          cost: 'A link created in the last few seconds might briefly 404 for someone who guessed it. Worth it — otherwise enumeration attacks hit the database on every request.',
        },
      ],
      sayThis:
        '"I will cache redirects in Redis with a long TTL, plus a 30-second in-process cache for the hottest codes. Cost: disabling a bad link takes up to 30 seconds to take effect everywhere, so I pair it with an invalidation broadcast. And I will coalesce cache misses, because if Redis restarts, 12,000 reads a second land on a database built for 40 writes."',
      trap: 'Describing a beautiful cache and never saying what happens when it is empty. The cold-cache stampede is the outage in this design, and it is the question that gets asked.',
    },
  ],

  lifecycle: {
    caption:
      'A link\'s life. The solid path is what everyone draws; the branches below are where the design decisions actually are.',
    states: [
      { id: 'req', label: 'Requested', by: 'creator' },
      { id: 'code', label: 'Code chosen', by: 'system' },
      { id: 'stored', label: 'Stored', by: 'system' },
      { id: 'served', label: 'Served', by: 'visitor' },
      { id: 'gone', label: 'Disabled', by: 'creator or system' },
    ],
    failures: [
      { after: 'code', label: 'Collision', handling: 'unique constraint rejects it, generate again and retry' },
      { after: 'code', label: 'Custom code taken', handling: 'same constraint, return a clean error to the user' },
      { after: 'stored', label: 'Cache not warmed', handling: 'first click misses and falls through to the database' },
      { after: 'served', label: 'Code does not exist', handling: 'negative cache, then a clean 404 — never a redirect to nowhere' },
      { after: 'served', label: 'Destination is malicious', handling: 'disable, broadcast invalidation, accept the short TTL window' },
    ],
  },

  architecture: {
    caption:
      'Reads never touch the database in the normal case. Writes are synchronous and careful. Counting is entirely off the hot path.',
    nodes: [
      { id: 'v', label: 'Visitor', kind: 'client', col: 0, row: 0 },
      { id: 'e', label: 'Edge / LB', kind: 'service', col: 1, row: 0 },
      { id: 'r', label: 'Redirect svc', sub: 'stateless', kind: 'service', col: 2, row: 0 },
      { id: 'k', label: 'Cache', sub: 'code → URL', kind: 'cache', col: 3, row: 0 },
      { id: 'db', label: 'Database', sub: 'unique(code)', kind: 'store', col: 4, row: 0 },
      { id: 'c', label: 'Creator', kind: 'client', col: 0, row: 1 },
      { id: 'w', label: 'Create svc', kind: 'service', col: 2, row: 1 },
      { id: 'q', label: 'Click queue', kind: 'queue', col: 3, row: 1 },
      { id: 'a', label: 'Aggregator', kind: 'service', col: 4, row: 1 },
    ],
    edges: [
      { from: 'v', to: 'e' },
      { from: 'e', to: 'r' },
      { from: 'r', to: 'k', label: 'hit ~99%' },
      { from: 'k', to: 'db', label: 'miss', dashed: true },
      { from: 'c', to: 'w' },
      { from: 'w', to: 'db', label: 'insert' },
      { from: 'r', to: 'q', label: 'fire and forget' },
      { from: 'q', to: 'a' },
    ],
  },

  numbers: {
    caption: 'The estimate that decides the design. Reads beat writes a hundred to one.',
    items: [
      { label: 'Link creations', value: 40, display: '~40 / sec (120 peak)', tone: 'muted' },
      { label: 'Redirects', value: 4000, display: '~4,000 / sec (12,000 peak)', tone: 'accent' },
      { label: 'Storage after 5 years', value: 1200, display: '~1.2 TB — one machine', tone: 'muted' },
    ],
    note: 'So the hard part is read latency, not write throughput and not storage. Design the redirect to answer from memory; leave the write path simple and synchronous.',
  },

  flow: {
    scenario: 'cache-hit',
    caption: 'The normal redirect: answered from cache, the database never woken. This is what 99% of traffic should look like.',
  },

  compare: {
    caption: 'The one real decision on the write path.',
    a: {
      title: 'Random code + unique constraint',
      points: [
        '3.5 trillion possibilities at 7 characters, so collisions are rare.',
        'No global coordination — any server can generate one.',
        'Codes are not guessable, so nobody can enumerate your links.',
        'Needs a retry loop on the rare constraint violation.',
      ],
    },
    b: {
      title: 'Counter encoded in base62',
      points: [
        'No collisions at all, by construction.',
        'Shortest possible codes, since no space is wasted.',
        'The counter is a coordination point — a single sequence everyone needs.',
        'Sequential codes are enumerable, leaking both your links and your volume.',
      ],
    },
    verdict:
      'Random with a unique constraint. The retry cost is negligible at 40 writes a second, and not being enumerable is a genuine requirement for a service that redirects to arbitrary destinations. Take the counter only if you need the absolute shortest codes and can accept guessable ones.',
  },

  followUps: [
    'scale-10x',
    'kill-cache',
    'consistency-retry',
    'choice-database',
    'cost-monthly',
    'ops-debug-slow',
    'scope-multiregion',
    'kill-region',
  ],
}
