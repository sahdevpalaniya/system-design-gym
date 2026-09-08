import type { DeepDive, WorkedExample } from '@/lib/types'

export const CACHING_DEEP: DeepDive = {
  intro:
    'The summary said "keep a copy near whoever keeps asking". That is the easy half. This page covers the five places a cache can live and what each one costs you, the four write strategies and when each is right, invalidation done honestly, the three ways an empty cache takes down a database, hot keys, and how to decide what your hit rate actually needs to be.',
  minutes: 20,
  sections: [
    {
      heading: 'Where the cache lives, and what each location costs',
      body: [
        'A cache is not one thing. There are five places to put one, and they differ in speed, in how many copies exist, and in whether you can ever take something back.',
        'The instinct is to reach for Redis. Often the right answer is two layers — a small in-process cache in front of a shared one — and being able to explain why is worth more than naming a product.',
      ],
      table: {
        caption: 'The five layers, from closest to furthest.',
        headers: ['Layer', 'Speed', 'Copies', 'The catch'],
        rows: [
          ['Browser', 'Free, zero latency', 'One per user', 'You cannot recall it. A wrong long-TTL response lives on that device.'],
          ['CDN edge', '~10 ms', 'Hundreds', 'Purging is not instant. Private data here is a disclosure, not a bug.'],
          ['In-process', '~100 ns', 'One per server', 'Servers drift apart, so two users can get different answers.'],
          ['Shared (Redis)', '~0.5 ms', 'One', 'A network hop, plus a dependency that can fail and take everything with it.'],
          ['Database buffer pool', 'Fast', 'One per node', 'Real, and you do not control it. Do not count on it in a design.'],
        ],
      },
      points: [
        'In-process is a thousand times faster than a shared cache — but every server has its own copy, so consistency between servers is gone.',
        'The two-layer pattern — small in-process cache in front of Redis — absorbs hot keys and survives Redis being down. That is the answer to "what if the cache dies".',
        'A CDN is a cache. Treat it as part of this decision rather than a separate topic.',
        'The browser is the only layer you genuinely cannot invalidate, which is why versioned filenames exist.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Two layers: a 5-second in-process cache for the hottest keys, and Redis behind it with a five minute TTL. The in-process layer means servers can briefly disagree, which I accept for this data, and it means Redis going down degrades us instead of killing us."',
        },
      ],
    },
    {
      heading: 'The four write strategies',
      body: [
        'Reading from a cache is obvious. What happens on a write is where the designs differ, and this is the part interviewers probe.',
      ],
      points: [
        '**Cache-aside** (the default): the application checks the cache, and on a miss reads the database, writes the value into the cache, and returns it. Simple, and the cache failing degrades you rather than breaking you.',
        '**Read-through**: the cache itself fetches on a miss. Cleaner application code, and now the cache is on the critical path for correctness rather than just for speed.',
        '**Write-through**: write to cache and database together. The cache is never stale, every write pays both costs, and you cache things nobody will read.',
        '**Write-behind**: write the cache now, the database shortly after. Fast writes, and you can lose data in the gap. Only acceptable when the data is genuinely disposable.',
      ],
      compare: {
        caption: 'The two you will actually choose between.',
        a: {
          title: 'Cache-aside',
          points: [
            'Application controls everything, so failure behaviour is obvious.',
            'The cache going down means slow, not broken.',
            'Only requested data is cached, so nothing is wasted.',
            'Every read path must remember to do it, and one that forgets is a silent bug.',
            'There is a window on a miss where two requests both fetch from the database.',
          ],
        },
        b: {
          title: 'Write-through',
          points: [
            'The cache is never stale, so no invalidation logic at all.',
            'Every write pays cache latency as well as database latency.',
            'You cache everything written, including data nobody ever reads.',
            'A cache write failing means either a failed write or an inconsistency.',
          ],
        },
        verdict:
          'Cache-aside for almost everything, because degrading rather than breaking is worth more than avoiding invalidation. Write-through only where the read-after-write pattern is guaranteed and staleness is genuinely unacceptable.',
      },
      callouts: [
        {
          variant: 'trap',
          text: 'Describing write-behind without saying you can lose data. That is the entire trade, and omitting it reads as not knowing.',
        },
      ],
    },
    {
      heading: 'Invalidation, honestly',
      body: [
        'There are exactly two mechanisms, both are compromises, and real systems use both together. Anyone who tells you invalidation is solved has not run a cache.',
        '**TTL**: the data is wrong for at most that long, and you never have to think about it again. **Explicit deletion on write**: it is right almost always, and every code path that writes has to remember.',
        'The reason to use both is that they fail differently. A TTL fails by being slightly stale. Explicit deletion fails by being permanently wrong when someone forgets, and that bug is unreproducible. So the TTL is the safety net that bounds the damage from a forgotten delete.',
      ],
      points: [
        'TTL alone: simple, and your staleness window is the TTL. Fine for most things.',
        'Explicit deletion alone: correct until someone adds a write path and forgets. There is no test that catches this.',
        'Both: explicit deletion for freshness, TTL as the bound on how wrong you can be. This is the answer to give.',
        'Jitter the TTL. A million keys written together will otherwise all expire in the same second.',
        'Deleting the key is safer than updating it — an update from a stale read writes stale data back into the cache and it stays.',
      ],
      visuals: [
        {
          type: 'numbers',
          numbers: {
            caption: 'What a hit rate is actually worth. The last few percent matter far more than they look.',
            items: [
              { label: '90% hit rate — database load', value: 10, display: '10% of reads reach the database', tone: 'bad' },
              { label: '99% hit rate', value: 1, display: '1% — ten times less', tone: 'muted' },
              { label: '99.9% hit rate', value: 0.1, display: '0.1% — a hundred times less', tone: 'accent' },
            ],
            note: 'Going from 90% to 99% removes 90% of the remaining database load. That is why "we have a cache" is not an answer and the hit rate is — and why a cache that drops from 99% to 90% is a tenfold traffic increase to your database, not a 9% one.',
          },
        },
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Five minute TTL with jitter, plus explicit deletion on write. The deletion keeps it fresh; the TTL bounds how wrong I can be when a new write path forgets to delete — and one eventually will."',
        },
      ],
    },
    {
      heading: 'The three ways an empty cache kills you',
      body: [
        'This is the section that separates a design from a diagram. A cache does not fail by being slow, it fails by being empty at the wrong moment, and the database behind it was never sized for the traffic it was protecting.',
      ],
      points: [
        '**Stampede** (also called dog-piling): one popular key expires, and the thousand requests that were being served from it all miss at once and all query the database. The fix is request coalescing — the first miss fetches, the other 999 wait for that result.',
        '**Cold start**: the cache is restarted or a new node joins, so the whole hot set is missing and every request goes to the database at once. The fix is warming before taking traffic, and adding nodes during quiet periods.',
        '**Penetration**: requests for keys that do not exist anywhere cannot be cached, because there is nothing to store. Someone probing random ids drives your miss rate to 100%. The fix is caching the "not found" result briefly, or a bloom filter of existing ids.',
        'All three have the same shape: your database suddenly receives the traffic your cache was absorbing, and at the ratios that justified adding a cache, it will not survive it.',
      ],
      visuals: [
        {
          type: 'diagram',
          diagram: {
            caption:
              'Request coalescing. A thousand simultaneous misses on the same key become one database read, and the other 999 wait for its answer.',
            nodes: [
              { id: 'r', label: '1,000 requests', sub: 'same key, same moment', kind: 'client', col: 0, row: 0 },
              { id: 's', label: 'Service', sub: 'in-flight map', kind: 'service', col: 1, row: 0 },
              { id: 'k', label: 'Cache', sub: 'key just expired', kind: 'cache', col: 2, row: 0 },
              { id: 'db', label: 'Database', sub: 'sees 1 query, not 1,000', kind: 'store', col: 3, row: 0 },
              { id: 'n', label: 'without coalescing this is 1,000 identical queries in one millisecond', kind: 'note', col: 1, row: 1, span: 3 },
            ],
            edges: [
              { from: 'r', to: 's' },
              { from: 's', to: 'k', label: 'miss' },
              { from: 's', to: 'db', label: 'one leader wins' },
            ],
          },
        },
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Coalescing means 999 requests wait on one — so if that one is slow, all of them are slow, and a timeout on the leader must fail all the waiters rather than hanging them forever.',
        },
        {
          variant: 'trap',
          text: 'Designing a cache and never answering "what happens when it is empty". That is where the outage lives, and it is the follow-up you should expect.',
        },
      ],
    },
    {
      heading: 'Hot keys, and why sharding does not help',
      body: [
        'A hot key is one item everybody wants at once: a viral post, a flash-sale product, the configuration blob every request reads. Consistent hashing spreads *keys* evenly, and a hot key is one key, so it lands on one node no matter how elegantly you assigned it.',
        'The answer is replication of that key rather than better placement, and there are three levels of it.',
      ],
      points: [
        'Level one: an in-process cache in front of the shared cache. The hottest key is answered from local memory on every server, so the shared cache sees a trickle. This alone solves most hot key problems.',
        'Level two: write the hot key under several suffixed names and have readers pick one at random, spreading it across nodes. Costs a fan-out on invalidation.',
        'Level three: detect hot keys at runtime — a count-min sketch is the standard tool — and promote them automatically rather than hard-coding a list.',
        'Say out loud that even key distribution does not mean even traffic distribution. That sentence is the whole insight.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Consistent hashing balances keys, not traffic, so one viral post still lands on one node. I would put a short in-process cache in front, which absorbs the hot key entirely at the cost of servers briefly disagreeing by a few seconds."',
        },
      ],
    },
    {
      heading: 'Deciding what to cache, and admitting when not to',
      body: [
        'Caching everything is a real failure mode: memory spent on items requested once, invalidation complexity for data nobody reads, and a hit rate that looks fine while the useful keys are being evicted by useless ones.',
      ],
      points: [
        'Cache what is read far more often than it is written, and expensive to produce. Both conditions, not either.',
        'Do not cache the value a commit decision is based on when people compete for it. Seats, stock and balances must be read inside the transaction that changes them.',
        'Check your eviction policy matches the access pattern. Least-recently-used is right for most things and wrong for a workload that scans everything periodically, since the scan evicts your entire hot set.',
        'Measure hit rate per key pattern, not overall. An aggregate of 95% can hide one important pattern sitting at 20%.',
        'A cache that never gets a hit is pure cost plus a new failure mode. Be willing to say a cache is not needed here.',
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Every cache adds a component that can fail, a consistency question, and an invalidation path someone will forget. It has to earn that, and the way it earns it is a hit rate you have measured.',
        },
      ],
    },
  ],
}

export const CACHING_EXAMPLE: WorkedExample = {
  title: 'The cache that took down the database at 9am every Monday',
  scenario:
    'Every Monday at 09:00 the site slows to a crawl for about four minutes, then recovers on its own. Database CPU hits 100%, application error rate spikes, and by the time anyone opens a dashboard it is already fixing itself. Redis is healthy throughout. This has happened for six weeks.',
  steps: [
    {
      step: 'Find what is special about 09:00 Monday',
      detail:
        'It is not traffic — Monday peak is only slightly above other days, and nothing like a fourfold spike. The clue is that Redis is healthy but the database is saturated, which means requests are missing the cache. So the question is not "why is there more traffic" but "why did the hit rate collapse".',
    },
    {
      step: 'Graph the hit rate, not the traffic',
      detail:
        'Hit rate is 99.2% all week and drops to 61% for four minutes every Monday at 09:00. That is the whole incident: at 99% the database sees 1% of reads, and at 61% it sees 39% — a fortyfold increase in database traffic with no change in user traffic at all.',
    },
    {
      step: 'Find why the keys expired together',
      detail:
        'A weekly job repopulates product data on Sunday night, writing about two million keys with a fixed 12-hour TTL. They were all written within a few minutes of each other, so they all expire within a few minutes of each other — at roughly 09:00 on Monday. A synchronised mass expiry, created by the cache-filling job itself.',
    },
    {
      step: 'Fix it in the cheapest place',
      detail:
        'Add jitter: the TTL becomes 12 hours plus a random 0 to 90 minutes. The same two million keys now expire spread over an hour and a half instead of over four minutes, and the database never notices. One line of code, and it removes the incident entirely.',
    },
    {
      step: 'Then make the class of failure survivable',
      detail:
        'Jitter fixes this occurrence; it does not fix the next mass eviction. So also add request coalescing, so a thousand simultaneous misses on the same key become one database read. And add a short in-process cache in front, so even a completely empty Redis does not send full read load to the database. Now the database is protected from an empty cache generally, rather than from this specific Monday.',
    },
    {
      step: 'Alert on the leading indicator',
      detail:
        'The alert had been on database CPU, which fires when the damage is already happening. Add an alert on cache hit rate dropping below a threshold, which fires before the database is in trouble and points directly at the cause instead of at the symptom.',
    },
  ],
  outcome:
    'The Monday incident stops immediately. The general lesson is the arithmetic: a hit rate falling from 99% to 61% is a fortyfold increase in database load, not a 38% one — which is why hit rate, not traffic, is the number to watch on any cached path.',
  problemSlug: 'url-shortener',
}
