import type { Problem } from '@/lib/types'

export const WEB_CRAWLER: Problem = {
  slug: 'web-crawler',
  searchTitle: "Design a web crawler",
  title: 'Web crawler',
  group: 'crawling',
  difficulty: 'core',
  concepts: [
    'bloom-filters',
    'dns',
    'message-queues',
    'rate-limiting',
    'object-storage',
    'partitioning',
    'circuit-breakers',
  ],
  prompt:
    'Design a crawler that fetches a large portion of the web, stores the pages for later processing, and keeps them reasonably fresh. It must not overload the sites it visits and must not fetch the same content repeatedly.',

  slack: {
    budget: 'Per page: unlimited. Full recrawl: days. Freshness for news: minutes.',
    headline:
      'Nobody is waiting for any single page. This group has the most slack in the app, and most good decisions here come from spending it.',
    body: [
      'No human is watching a fetch. If one page takes thirty seconds, or fails and is retried in an hour, no user notices. So everything can be queued, batched, retried patiently and processed out of order: the opposite of a request path.',
      'What has no slack is politeness. A site you are crawling has a request path, and their users are waiting. Hitting one domain a thousand times a second is an accidental denial-of-service attack. It gets you blocked, and possibly sued. So your own generous budget has to be converted into a strict per-domain delay.',
      'Freshness has a range rather than a number, and that range is a design decision. A news homepage is stale in minutes. A 2011 blog post is unlikely to change again. Crawling both on the same schedule wastes most of your capacity re-fetching pages that have not changed.',
    ],
    consequence:
      'Everything is a queue, nothing is synchronous, and the scheduler is built around per-domain politeness rather than global throughput. Recrawl frequency is adaptive, because a uniform schedule spends most of its budget on pages that never change.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'What is this crawler for? Search, archiving and price monitoring are different systems.',
        'How much of the web, and how fresh? Both are dials, not facts.',
        'What are you allowed to fetch?',
      ],
      model: [
        'Assumptions: this feeds a search index, we want a broad crawl of a few billion pages, HTML only for now with media referenced but not fetched, and we obey robots.txt. That last one is a constraint that shapes the design.',
        'The question that changes a box: how fresh does this need to be? A one-off archive crawl is a much simpler system than one that keeps a few billion pages current. The second needs change detection, per-page recrawl scheduling, and a way to decide what is worth revisiting. I will assume continuous recrawling with adaptive frequency, because that is what a search product needs.',
        'Second question: do we need JavaScript rendering? That changes the cost per page by an order of magnitude or more, because a headless browser uses far more CPU and memory than an HTTP fetch. I will assume a hybrid: plain fetch by default, rendering only for pages where the plain fetch returns almost no content, which is a small fraction.',
        'Scope I propose: discovering URLs, scheduling politely, fetching, deduplicating content, storing raw pages, and extracting links to continue. Out of scope: the index itself, ranking, and interpreting the content. That is a separate system that consumes what this one produces.',
      ],
      checklist: [
        'Established the purpose, because it changes what "done" means',
        'Asked about freshness and tied it to recrawl scheduling',
        'Asked about JavaScript rendering and named the cost multiplier',
        'Committed to robots.txt as a design constraint, not an afterthought',
        'Proposed a scope that ends where the index begins',
      ],
      tradeoffs: [
        {
          decision: 'Adaptive recrawl rather than a fixed schedule',
          cost: 'Per-URL state and a scoring model to maintain. In exchange, most of the fetch budget goes to pages that change.',
        },
      ],
      sayThis:
        '"A few billion pages feeding a search index, continuously recrawled. One question: how fresh? Continuous recrawl needs per-page scheduling and change detection, a whole subsystem that a one-off archive crawl does not need."',
      trap: 'Diving into parsing HTML. The parser is not the interesting part, and it is not what fails at scale.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a URL\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'The websites are actors, and they have opinions about you.',
        'What silent decisions does the crawler make about each URL?',
        'A URL can fail in about six interesting ways. What are they?',
      ],
      model: [
        'Actors: the seed source that gives you starting URLs; every website you visit (millions of actors, each with its own rules, capacity and tolerance for you); the DNS system, which you will hit very hard; and the crawler itself. The crawler makes constant decisions that nobody sees: is this URL worth fetching, is it the same page as one I already have, how long until I look again, and should I give up on this domain entirely.',
        'The chain: discovered → normalised → deduplicated against what we know → checked against robots → scheduled by domain → fetched → content deduplicated → stored → links extracted, which feeds back to discovered → scheduled for recrawl.',
        'The failure branches are most of this system. At normalised: the same page has five URLs with different tracking parameters and a trailing slash, so without normalisation you crawl it and store it five times. At robots: fetching robots.txt is itself a request, so it is cached per domain with a TTL, or you double your traffic to every site. At fetch: timeouts, 404s, 500s, redirect chains that loop, and pages that are 40 MB of nothing. Each needs a limit and a give-up rule. At content dedup: two different URLs return byte-identical or near-identical content, which is common with mirrors and printer-friendly pages, so you need a content fingerprint as well as a URL check.',
        'The branches the system owns: a site that starts returning errors, where continuing to hammer it is both rude and pointless. A per-domain circuit breaker backs off entirely. And a **crawler trap**: a calendar page that generates an infinite sequence of links, or a site with a URL pattern that expands forever. Without a per-domain page cap and a depth limit, one such site can consume your crawler indefinitely.',
      ],
      checklist: [
        'URL normalisation before deduplication — the same page has many URLs',
        'robots.txt cached per domain, since fetching it is itself traffic',
        'Limits on redirect chains, response size and timeouts',
        'Content fingerprinting separate from URL deduplication',
        'A per-domain breaker for a site that starts failing',
        'Crawler traps named, with a depth limit and per-domain cap',
      ],
      trap: 'Deduplicating on URL only. Mirrors, print pages and tracking parameters mean the same content arrives under many URLs, and you will store it many times.',
    },

    {
      id: 3,
      ask: 'Estimate fetch rate, storage and the size of the "already seen" set. Then finish: "So the hard part here is ___."',
      nudges: [
        'Work backwards from a target: how many pages in how many days?',
        'What does a page cost to store, compressed?',
        'How much memory does it take just to remember which URLs you have seen?',
      ],
      model: [
        'Target: 4 billion pages, recrawled on average monthly. That is 4 billion fetches per month, divided by 2.6 million seconds, so about 1,500 pages per second sustained. Not extreme, but it has to run continuously for years.',
        'Storage: an HTML page is about 100 KB raw, roughly 25 KB compressed. 4 billion pages compressed is about 100 TB for one copy of the web. That goes to object storage, not a database. At list prices that is roughly a few hundred dollars a month in an infrequent-access archive tier and about two thousand in standard storage. Worth saying, because candidates often assume storage is the expensive part.',
        'The number that shapes the design: the seen-URL set. 4 billion URLs at 100 bytes each is 400 GB if stored as strings. That is too big to hold comfortably in memory on one machine, and link extraction means checking far more URLs than you fetch (perhaps 50,000 per second), which is a lot of random lookups for a disk-backed database. A bloom filter of 4 billion entries at a 1% error rate is about 5 GB, which fits in memory comfortably. The cost is that about 1% of new URLs are wrongly reported as already seen and never crawled, which is acceptable for a broad crawl.',
        'DNS: 1,500 fetches a second across many domains means a lot of lookups, and resolution becomes a bottleneck if uncached. Aggressive DNS caching is a specific, named component here rather than an implementation detail.',
        'So the hard part here is the seen-set at 4 billion entries and per-domain politeness, not fetch throughput. One is a membership problem and the other a scheduling problem; neither is about bandwidth.',
      ],
      checklist: [
        'Turned a target into a sustained pages-per-second number',
        'Estimated compressed storage and put it in object storage, not a database',
        'Calculated the seen-set size and showed why a plain set does not fit',
        'Chose a bloom filter and named the false-positive consequence',
        'Named DNS as a real bottleneck at this rate',
        'Finished the sentence: the seen-set and politeness, not throughput',
      ],
      tradeoffs: [
        {
          decision: 'Bloom filter for the seen-set',
          cost: 'About 1% of genuinely new URLs are never crawled. Acceptable for a broad crawl; unacceptable if someone needs a specific page guaranteed.',
        },
      ],
      sayThis:
        '"About 1,500 pages a second sustained, 100 TB compressed in cold object storage. But the number that matters is the seen-set: 4 billion URLs is 400 GB as strings and 5 GB as a bloom filter. So the hard part here is membership at that scale, and per-domain politeness."',
      trap: 'Estimating bandwidth and storage, and never estimating the seen-set. That is the number that decides which data structures appear on the board.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'How does the queue enforce a delay per domain rather than globally?',
        'Where does the seen-set live, and who can ask it?',
        'What is stored, and in what shape, for the next system to use?',
      ],
      model: [
        'The **frontier** is the core of the system, and it is not one queue. It is a set of per-domain queues, plus a scheduler that only releases a URL from a domain when that domain\'s politeness delay has elapsed. The unit of scheduling is the domain, not the URL. Workers ask the frontier for work and are handed URLs from domains that are ready, so no worker is ever waiting on a delay.',
        '**Partitioning by domain** follows from that. All URLs for one domain are handled by one frontier partition, so the politeness state (last fetch time, current delay, breaker status) lives in one place with no coordination. This is the same "partition by the thing that needs ordering" move as chat, applied to rate rather than sequence.',
        'The **seen-set service** holds the bloom filter, sharded by URL hash, and answers "have we seen this" for the tens of thousands of extracted links per second. New URLs are added and passed to the frontier. It is fronted by an exact store for the recently added, so the filter can be rebuilt periodically without losing the last hour.',
        '**Fetchers** are stateless and numerous. Each has a timeout, a response size cap, a redirect limit, and a per-domain breaker. They resolve DNS through a heavily cached resolver, fetch, and hand the raw response on. They never decide what to fetch next; the frontier does.',
        '**Content processing** computes a fingerprint of the normalised text, checks it against a content-seen store, and drops near-duplicates. The raw page goes to object storage keyed by content hash, which means identical content from ten URLs is stored once. Extracted links go back to the seen-set service. Metadata (URL, fetch time, status, content hash, change signal) goes into a database that the recrawl scheduler reads.',
        'The **recrawl scheduler** is what makes freshness affordable. Each page carries a next-fetch time, adjusted by whether the content changed last time: pages that change get revisited sooner, and pages that do not decay toward a long interval. Most pages fall into the second group, which is why this box earns its place.',
      ],
      checklist: [
        'The frontier is per-domain queues plus a scheduler, not one global queue',
        'Partitioned by domain, so politeness state needs no coordination',
        'Seen-set as a sharded bloom filter service with an exact recent layer',
        'Fetchers stateless, with timeouts, size caps and per-domain breakers',
        'Raw pages in object storage keyed by content hash, so duplicates store once',
        'Adaptive recrawl scheduling driven by observed change',
      ],
      tradeoffs: [
        {
          decision: 'Partition the frontier by domain',
          cost: 'One enormous domain becomes a hot partition, and its politeness delay caps how fast you can crawl it regardless of capacity. That is correct behaviour, not a flaw.',
        },
        {
          decision: 'Store by content hash',
          cost: 'You need a separate URL-to-hash mapping, and a page that changes creates a new object rather than replacing one. In exchange, mirrors cost nothing.',
        },
      ],
      sayThis:
        '"The frontier is per-domain queues with a scheduler that only releases a URL when that domain\'s delay has passed — the unit of scheduling is the domain, not the URL. Partitioning by domain means politeness state needs no coordination."',
      trap: 'One global priority queue. It cannot express "wait two seconds before touching this domain again", which is the hardest requirement in the system.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'What happens when one domain has 500 million pages?',
        'How do you decide what to recrawl when you cannot recrawl everything?',
        'What stops a crawler trap from consuming the entire fleet?',
      ],
      model: [
        '**Hard part one: politeness against throughput.** These are in direct conflict. My fleet can fetch 1,500 pages a second, but a single site might tolerate one request every two seconds. So a domain with 500 million pages would take 30 years at that rate. For large sites I need a middle position: honour crawl-delay where robots.txt specifies one, and otherwise adapt. Start conservative, watch response times and error rates, and speed up only while the site is answering quickly. If latency rises or errors appear, back off immediately. That is a control loop, not a constant. Cost: complexity in the scheduler, and I will never fully crawl the largest sites. So coverage is a decision, and I would prioritise by page importance rather than pretending completeness is possible.',
        '**Hard part two: what to recrawl.** I cannot refetch 4 billion pages daily, so priority has to be computed. Signals: how often this page changed in the past, how important it is by inbound links, and how important its site is. A news homepage that changed every one of the last ten fetches goes on a minutes-to-hours cycle. A page unchanged for two years decays to quarterly. Cheap change detection helps a lot. A conditional request (If-Modified-Since or If-None-Match with the stored ETag) gets a small 304 "not modified" response instead of the page from servers that support it, so many recrawls cost almost nothing in bandwidth. Cost: per-URL state for billions of URLs, which needs a proper database, and a scoring model that can be wrong. It will miss a page that suddenly starts changing, so I would keep a floor on recrawl frequency rather than letting anything decay to never.',
        '**Traps and hostile sites.** A calendar with infinite next-month links generates URLs forever. Defences: a maximum crawl depth, a per-domain page budget, and detection of URL patterns that keep producing near-identical content. Without these, one site can fill the frontier without any error being raised. Cost: legitimate deep sites get truncated, so the budget needs to scale with site importance rather than being fixed.',
        '**Operating it.** This runs for years, so the metrics that matter are pages per second by status code, frontier depth per partition, seen-set false-positive rate, and the ratio of not-modified to full fetches. That last one tells me whether my recrawl scheduling is working. Cost: small, and skipping it means never knowing that a scheduling change made things worse.',
      ],
      checklist: [
        'Named politeness against throughput as a direct conflict, with a control loop as the answer',
        'Accepted that the largest sites will never be fully crawled, and prioritised instead',
        'Adaptive recrawl driven by observed change, with a floor so nothing decays to never',
        'Conditional requests so unchanged pages cost almost no bandwidth',
        'Depth limits and per-domain budgets for crawler traps',
        'Named the metric that tells you whether recrawl scheduling is working',
      ],
      tradeoffs: [
        {
          decision: 'Adaptive politeness rather than a fixed delay',
          cost: 'A control loop that can misjudge a site and get you blocked. Safer than a constant that is either too slow everywhere or too fast somewhere.',
        },
        {
          decision: 'Per-domain page budget',
          cost: 'Legitimate large sites are truncated, so the budget scales with importance rather than being uniform.',
        },
      ],
      sayThis:
        '"Politeness and throughput are in direct conflict, so the delay is a control loop: start conservative, speed up while the site answers fast, and back off the moment latency or errors rise. And recrawl is adaptive with conditional requests, so an unchanged page costs a small header exchange rather than 100 KB."',
      trap: 'Claiming you will crawl everything. You will not. Saying which pages you are choosing to skip is a much stronger answer than pretending completeness.',
    },
  ],

  refs: [
    {
      label: "Percolator (Google, OSDI 2010)",
      href: "https://research.google/pubs/pub36726/",
      note: "How Google moved its index from batch rebuilds to incremental updates as pages are recrawled. Useful for the \"what happens after the fetch\" follow-up.",
    },
  ],
  lifecycle: {
    caption:
      'A URL\'s life. At this scale, most branches below happen many times a day, and each one is a limit you have to set explicitly.',
    states: [
      { id: 'disc', label: 'Discovered', by: 'link extraction' },
      { id: 'norm', label: 'Normalised + deduplicated', by: 'system' },
      { id: 'sched', label: 'Scheduled by domain', by: 'frontier' },
      { id: 'fetched', label: 'Fetched', by: 'fetcher' },
      { id: 'stored', label: 'Content deduplicated + stored', by: 'system' },
      { id: 'recrawl', label: 'Scheduled for recrawl', by: 'system' },
    ],
    failures: [
      { after: 'norm', label: 'Same page, five URLs', handling: 'normalise parameters and trailing slashes before the seen-set check' },
      { after: 'sched', label: 'robots.txt disallows it', handling: 'cached per domain with a TTL, or fetching it doubles your traffic' },
      { after: 'sched', label: 'Infinite calendar links', handling: 'depth limit and per-domain page budget, or one site eats the frontier' },
      { after: 'fetched', label: 'Timeout, 40 MB page, redirect loop', handling: 'explicit caps on time, size and redirect count — each is a separate limit' },
      { after: 'fetched', label: 'Site starts returning 500s', handling: 'per-domain breaker backs off entirely; hammering is rude and pointless' },
      { after: 'stored', label: 'Byte-identical to a mirror', handling: 'content fingerprint, stored once by content hash' },
    ],
  },

  architecture: {
    caption:
      'The frontier schedules domains, not URLs. The seen-set answers membership in memory. Pages land in object storage keyed by content hash, so mirrors cost nothing.',
    nodes: [
      { id: 'f', label: 'Frontier', sub: 'per-domain queues', kind: 'queue', col: 0, row: 0 },
      { id: 'sch', label: 'Scheduler', sub: 'politeness delay', kind: 'service', col: 1, row: 0 },
      { id: 'w', label: 'Fetchers', sub: 'stateless, breakers', kind: 'service', col: 2, row: 0 },
      { id: 'dns', label: 'DNS cache', kind: 'cache', col: 2, row: 1 },
      { id: 'web', label: 'The web', kind: 'external', col: 3, row: 0 },
      { id: 'proc', label: 'Processor', sub: 'fingerprint + links', kind: 'service', col: 2, row: 2 },
      { id: 'seen', label: 'Seen-set', sub: 'bloom, ~5 GB', kind: 'cache', col: 1, row: 2 },
      { id: 'obj', label: 'Object storage', sub: 'keyed by content hash', kind: 'store', col: 3, row: 2 },
      { id: 'meta', label: 'URL metadata', sub: 'drives recrawl', kind: 'store', col: 0, row: 1 },
    ],
    edges: [
      { from: 'sch', to: 'f', label: 'ready?' },
      { from: 'sch', to: 'w' },
      { from: 'w', to: 'dns' },
      { from: 'w', to: 'web' },
      { from: 'w', to: 'proc' },
      { from: 'proc', to: 'obj' },
      { from: 'proc', to: 'seen', label: 'new links' },
      { from: 'seen', to: 'f', label: 'unseen only' },
      { from: 'proc', to: 'meta' },
      { from: 'meta', to: 'f', label: 'recrawl due', dashed: true },
    ],
  },

  numbers: {
    caption: 'The seen-set, not the bandwidth, is what decides the data structures on this board.',
    items: [
      { label: 'Sustained fetch rate', value: 1500, display: '~1,500 pages / sec', tone: 'muted' },
      { label: 'Seen-set as plain strings', value: 400, display: '~400 GB — will not fit in memory', tone: 'bad' },
      { label: 'Seen-set as a bloom filter', value: 5, display: '~5 GB at 1% error — fits easily', tone: 'accent' },
    ],
    note: 'So the hard part is membership at 4 billion entries, plus per-domain politeness. Storage is 100 TB compressed in object storage, which costs less than candidates tend to expect and is not the constraint.',
  },

  followUps: [
    'scale-hot-key',
    'kill-dependency',
    'cost-storage-growth',
    'ops-capacity',
    'choice-simpler',
    'scope-scheduled',
    'kill-worker-mid-job',
    'scale-growth',
  ],
}
