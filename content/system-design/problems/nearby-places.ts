import type { Problem } from '@/lib/types'

export const NEARBY_PLACES: Problem = {
  slug: 'nearby-places',
  title: 'Nearby places',
  group: 'location',
  difficulty: 'core',
  concepts: [
    'geospatial-indexing',
    'caching',
    'indexes',
    'cdn',
    'search-indexing',
    'partitioning',
    'latency-vs-throughput',
  ],
  prompt:
    'Design a service that answers "what is near me?" — restaurants, shops, stations — ranked by distance and quality, filtered by category and whether they are open now.',

  slack: {
    budget: 'Query: ~200 ms. Place data freshness: hours. Opening hours: minutes.',
    headline: 'Two hundred milliseconds to answer, and the underlying data barely changes — which makes this the most cacheable problem in the whole library, and the one people most often over-engineer.',
    body: [
      'The query budget is a normal mobile-app budget: about 200 ms, because the user has tapped a button and is looking at a loading state. Comfortable compared to typeahead, tight compared to a batch job.',
      'The freshness slack is the interesting part. Restaurants do not move. A place\'s location, name and category change perhaps once a year. Ratings shift slowly. So the vast majority of the data behind every answer is effectively static, and an index rebuilt daily would be indistinguishable from one rebuilt continuously.',
      'There is one fast-moving field mixed into an otherwise static dataset: whether somewhere is open right now. That changes on a schedule, plus irregular closures. It is tempting to let that one field force the whole system to be dynamic — and resisting that is the main design skill this problem teaches. Compute openness at read time from static opening hours, and keep the index static.',
      'The other really dynamic case is live availability — a table free tonight, a bike at a dock. If that is in scope it is a separate fast path, not a reason to make the place index live.',
    ],
    consequence:
      'Static data plus a hard query budget means aggressively precomputed and cached geographic tiles. The one dynamic field is computed at read time from static data rather than being allowed to invalidate everything.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'What is the read:write ratio when the data is places rather than user actions?',
        'Ranked by distance, or by something else? That question changes boxes.',
        'How dense is the data? It is not uniform.',
      ],
      model: [
        'Assumptions: global, hundreds of millions of places, mobile-first. Reads massively outnumber writes — places change rarely and are queried constantly, which is an unusually extreme ratio even for a read-heavy system. Density is wildly uneven: a city block can hold hundreds of places, a rural square kilometre none. Users query a small radius, typically a few kilometres.',
        'First question, and it changes the design more than it sounds: is the ranking by distance alone, or by relevance — rating, popularity, personal history? Because distance-only can be answered entirely from a geographic index, while relevance ranking needs place attributes and possibly per-user signals in the ranking step, which is a second system. I will assume distance combined with quality, with no per-user personalisation, because that keeps results shareable and therefore cacheable.',
        'Second question: does "open now" have to be exactly right? Because if a special closure must be reflected within seconds, the static-index approach needs a dynamic overlay. I will assume regular opening hours are computed at read time from static data, and irregular closures can lag by minutes.',
        'Scope: query by location, radius and category; rank by distance and quality; filter by open now. Out of scope: navigation and routing, reviews and photos, and live availability such as table booking.',
      ],
      checklist: [
        'Stated the extreme read:write ratio — places change rarely',
        'Noted density is wildly uneven and will matter',
        'Asked distance-only versus relevance ranking',
        'Asked how exact "open now" must be, and framed it as the dynamic-data question',
        'Avoided per-user personalisation to keep results cacheable',
        'Proposed a scope and excluded routing and reviews',
      ],
      tradeoffs: [
        {
          decision: 'No per-user personalisation in ranking',
          cost: 'Results are less tailored. In exchange every answer is identical for everyone in the same area, which makes the entire result set cacheable — the single biggest lever in this design.',
        },
      ],
      sayThis:
        '"Assuming no per-user personalisation, so two people standing in the same place get the same list. That is what makes results cacheable, and caching is the whole game here because places basically never change. One question — does \'open now\' need to be exact to the second? Because that is the only fast-moving field, and I would rather compute it at read time than let it make my index dynamic."',
      trap: 'Assuming personalised ranking without saying so. It quietly destroys the cacheability that makes this problem easy, and it is worth one sentence to check.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a place\'s life as a chain, and add the failure branches.',
      nudges: [
        'Who creates and edits place data? It is usually not one source.',
        'What does the system decide about which places to show?',
        'What happens where there are no places at all?',
      ],
      model: [
        'Actors: the searching user, the business owner who edits their own listing, third-party data providers, moderators, and the system — which decides which places qualify as candidates, how to rank them, when a listing is stale enough to demote, and how far to widen a search that finds nothing.',
        'A place\'s life: submitted or imported → validated and deduplicated → indexed → served in results → updated periodically → possibly closed permanently.',
        'Failure branches. At submitted: the same restaurant arrives from two data providers with slightly different names and coordinates, so without deduplication the results show it twice — this is a real and constant problem with place data, and it needs fuzzy matching on name and proximity. At validated: the coordinates are wrong, putting a shop in the sea, so results near that point are polluted — needs plausibility checks against the address.',
        'At indexed: the index build fails and places stop appearing, silently, because a slightly old index looks completely normal. Alert on index age, not just on job failure. At served: the area has no places within the radius — widen it progressively rather than returning an empty list, and be honest when there really is nothing rather than returning something 40 km away as if it were nearby.',
        'At served: the area is extremely dense, so the candidate set is thousands of places and ranking becomes expensive — cap the candidates and shrink the search radius in dense areas, which is the same problem in the opposite direction and needs the opposite fix.',
        'At served: a place is permanently closed but still in the index, which is the most visible failure of this product — a user travels somewhere that no longer exists. So closure reports need a fast path to demote or remove, faster than the normal index cycle.',
        'And the one the system owns silently: a place open 24 hours and a place that closed 10 minutes ago must be distinguishable at read time, using the user\'s local time and the place\'s time zone — which is a source of bugs entirely disproportionate to how simple it sounds.',
      ],
      checklist: [
        'Named multiple data sources and the system as actors',
        'Wrote the place lifecycle as a chain',
        'Handled duplicate places from multiple providers',
        'Handled invalid coordinates',
        'Handled a silent index build failure with an age alert',
        'Handled sparse areas by widening, and dense areas by capping',
        'Handled permanently closed places with a fast removal path',
        'Raised time zones in the open-now calculation',
      ],
      trap: 'Ignoring deduplication. Place data always comes from several sources, and duplicates are the most visible quality problem in this kind of product — far more noticeable to users than a slow query.',
    },

    {
      id: 3,
      ask: 'Estimate query rate, index size, and the candidate set per query. Then finish "So the hard part here is ___."',
      nudges: [
        'How many places, and how big is one?',
        'How many candidates does one query examine? It depends where you are standing.',
        'How often does the data actually change?',
      ],
      model: [
        'Places: 200 million globally. Each is a name, coordinates, category, hours, rating and address — call it 500 bytes. That is 100 GB in total, which fits on a single machine and comfortably into memory across a small cluster. Another problem where the data is smaller than people expect.',
        'Queries: 50,000 per second at peak. Each examines candidates within a radius, and this is where density bites — in a city centre, a 2 km radius can contain 5,000 places; in a rural area, three. So the candidate set varies by three orders of magnitude for the same query, which means a fixed radius is the wrong design.',
        'Writes: 200 million places changing perhaps once a year each is under 10 writes per second globally. That is essentially nothing, and it is the number that changes my mind — this is not a write system in any sense, so I should stop thinking about write paths and spend everything on read.',
        'Cache effectiveness: queries cluster heavily in populated areas, and a query from anywhere in a city block can return the same result set. Rounding location to a grid cell makes queries from many users identical, which turns an apparently per-user query into a cacheable one. That is the trick that makes 50,000 queries a second cheap.',
        'So the hard part here is uneven density — the same query costs a thousand times more in a city than in the countryside — combined with making an apparently location-unique query cacheable. Not write throughput, not storage, and not the geo maths.',
      ],
      checklist: [
        'Estimated total place data and noticed it is small',
        'Estimated query rate',
        'Identified that candidate set size varies by orders of magnitude with density',
        'Calculated the write rate and concluded it is negligible',
        'Spotted that rounding location to a grid makes queries cacheable',
        'Finished the sentence naming density and cacheability',
      ],
      sayThis:
        '"Ten writes a second globally and fifty thousand reads — the write path is not a design problem and I am going to say so and move on. So the hard part is density: the same two-kilometre query returns three places in a village and five thousand downtown. And if I round the user\'s position to a grid cell, everyone on that block shares one cached answer."',
      trap: 'Treating this as a high-write geospatial problem like live location tracking. Places do not move. Ten writes a second means the entire design should be about reads, and noticing that saves you from building the wrong system.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and be specific about how the geographic lookup works.',
      nudges: [
        'How do you turn "within 2 km" into an indexed lookup?',
        'What do you cache, and what is the cache key?',
        'Where does "open now" get computed?',
      ],
      model: [
        'The geographic index: every place is assigned a geohash — around 6 characters, roughly a square kilometre. Places are stored keyed by cell, so finding candidates is a lookup of the user\'s cell plus the eight neighbours, because a place 100 metres away can be just over a boundary and missing it is a visible bug. Justified by the fact that a normal two-column index on latitude and longitude cannot answer a proximity query efficiently — it can only narrow to a band around the earth.',
        'Adaptive precision, which is the direct answer to the density number: use a longer geohash — smaller cells — in dense areas and a shorter one in sparse areas, so the candidate count stays roughly constant regardless of where the user is standing. Alternatively, start at high precision and step down until enough candidates are found. Justified explicitly by the thousand-fold variation from Stage 3.',
        'Ranking: candidates are filtered by category and open-now, scored on distance and quality, and the top N returned. Because the index gives candidates rather than an answer, this step exists in every geospatial design and is where the product quality lives.',
        'Open-now is computed at read time from static opening hours plus the place\'s time zone. This is the key decision: it means the index does not need to change as places open and close through the day, so a static index serves a field that appears dynamic. Irregular closures are a small overlay checked at read time. Justified by the slack analysis — resisting the urge to make the index live.',
        'Caching, keyed by rounded location plus radius plus category plus a coarse time bucket. Rounding the location to a grid cell is what makes distinct users share a cache entry, and the time bucket — say 15 minutes — is what lets open-now be part of a cached answer without being wrong for long. Justified by the query clustering observed in Stage 3, and this box does more work than any other in the design.',
        'Serving: place data is small enough to hold in memory across a modest fleet, so a query is an in-memory cell lookup plus a scoring pass with no database round trip. Justified by the 100 GB figure.',
        'Index building: a batch pipeline ingests provider feeds and owner edits, deduplicates, validates coordinates, assigns cells, and produces a new index deployed by atomic swap. Runs daily, justified by the ten-writes-per-second figure. Urgent corrections — a permanently closed place — go through a small overlay applied at read time, so they do not have to wait for the next build.',
        'Partitioning: by geographic region, so a query touches only the shard covering that area, and a hot region is contained. Justified by blast radius and by the fact that queries are inherently local.',
      ],
      checklist: [
        'Explained why lat/lng columns do not answer proximity, and chose a geospatial encoding',
        'Searched neighbouring cells, not just the user\'s own',
        'Adaptive precision to handle uneven density, justified by the numbers',
        'Ranking as a separate step after candidate generation',
        'Open-now computed at read time so the index stays static',
        'Cache key includes rounded location, radius, category and a time bucket',
        'Index held in memory, justified by the size estimate',
        'Daily batch build with atomic swap, plus an overlay for urgent corrections',
        'Partitioned geographically',
      ],
      tradeoffs: [
        {
          decision: 'Rounding location for the cache key',
          cost: 'Distances are computed from the rounded point, so ordering can be slightly off for someone at the edge of a cell. Invisible at a few hundred metres, and it is what makes the cache work at all.',
        },
        {
          decision: 'Adaptive cell precision',
          cost: 'More complex index construction and query logic than a fixed grid. Without it, city queries return thousands of candidates and rural queries return none.',
        },
        {
          decision: 'Daily index builds plus a correction overlay',
          cost: 'Ordinary edits take up to a day to appear. Urgent corrections bypass it, which means two paths to maintain.',
        },
      ],
      trap: 'Storing latitude and longitude as two indexed columns and querying a bounding box. The database narrows on one column and scans a band around the planet — it works in a demo and collapses at scale, and it is the specific thing the geospatial index exists to fix.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'Density is the number that stood out. Go there.',
        'A place near a cell boundary — walk through what happens.',
        'What happens when a major event fills one small area with users?',
      ],
      model: [
        'Hard part one: density, in detail. In a dense city a 2 km radius contains thousands of candidates, so scoring them all per query is the cost driver. Adaptive precision reduces the candidate set, but the better move is to precompute per cell: for each geohash cell and each category, store the top N places by quality, so a dense-area query reads a short precomputed list instead of scoring thousands. Justified by the near-zero write rate — precomputing is cheap when the data barely changes. Cost: N times more index entries, and the precomputed list is by quality within a cell, so a nearby but slightly lower-rated place just over the boundary can be missed — which is why neighbour cells still get merged in.',
        'The boundary problem, in detail because it is the classic error in this design: a place 50 metres away but in the next cell shares no prefix with the user\'s cell. Querying the eight neighbours covers it. At the corner of four cells, or in a sparse area where the radius exceeds one cell, step down to a shorter prefix — larger cells — and widen. Cost: more cells read per query, and the candidate set grows, which is exactly the tension adaptive precision is managing.',
        'Hard part two: hot areas. A stadium, a festival, a transport hub at rush hour means one cell receives an enormous share of queries. Because results are cacheable and identical for everyone there, this is largely solved by the cache — and that is the payoff for the Stage 1 decision to avoid personalisation. But one cache key being extremely hot makes one cache node hot, so I would replicate hot keys across several nodes with a suffix and read a random one. Cost: N times the memory for those keys and a fanned-out invalidation, which is trivial for a small number of keys.',
        'Pre-warming known events is worth mentioning, because unlike most spikes these are predictable — a stadium\'s location and event time are both known in advance.',
        'Deduplication, revisited as an ongoing system rather than a one-off: matching places across providers by name similarity, proximity and category, with a confidence threshold, and merging below it. Two failure directions: merging two really different shops in the same building, and failing to merge one shop listed twice. The second is more visible to users, so I would tune toward merging and provide an unmerge path. Cost: some false merges, which need a correction mechanism and a human in the loop.',
        'Consistency per feature: place data is eventually consistent by up to a day, which is fine because places do not change. Permanent closures are near-real-time through the overlay, because showing a closed business is the most damaging error. Open-now is computed and correct at read time. Ratings are eventually consistent by hours. Four different answers, which is the right shape.',
        'Multi-region: the index is small enough to replicate in full to every region, so every query is served locally with no cross-region call. Cost: full replication of 100 GB per region, which is cheap and buys local latency everywhere — an easy trade to name.',
        'What I would monitor: query latency at p99 split by area density, since a global p99 hides the fact that city queries are the slow ones; cache hit rate; index age; the count of results returned per query, where a sudden rise in empty results is the earliest sign a build went wrong; and closure-report processing lag.',
      ],
      checklist: [
        'Precomputed top-N per cell per category, justified by the low write rate',
        'Explained the boundary problem and neighbour-cell merging',
        'Stepping down precision in sparse areas',
        'Handled hot areas with key replication, and connected it to the no-personalisation decision',
        'Mentioned pre-warming for predictable events',
        'Deduplication as an ongoing system with a tuning direction and an unmerge path',
        'Per-feature consistency answer with four different freshness levels',
        'Full index replication per region, with the cost named',
        'Monitoring split by density, not just globally',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Precomputed top-N per cell',
          cost: 'A much larger index, and a good place just over a boundary can be missed if neighbours are not merged in. Turns a dense-area query from scoring thousands into reading a short list.',
        },
        {
          decision: 'Tuning deduplication toward merging',
          cost: 'Occasionally merges two really different businesses. Chosen because a visible duplicate is the more common and more noticeable failure.',
        },
        {
          decision: 'Full index replication per region',
          cost: '100 GB held in every region. Cheap, and it removes every cross-region call from the query path.',
        },
      ],
      sayThis:
        '"Because there is no personalisation, everyone standing on the same block gets the same answer — so I round the location to a grid cell and cache the whole result set. Cost: distances are computed from the rounded point, so ordering can be marginally off at a cell edge. That single decision is what turns fifty thousand apparently-unique location queries a second into a handful of cache keys."',
      trap: 'Building this as if places moved. The write rate is ten a second globally — the correct instinct is to precompute aggressively and cache everything, and any design that treats this like a live tracking system has misread its own numbers.',
    },
  ],

  lifecycle: {
    caption:
      'A place, from ingestion to being served. Deduplication and the permanently-closed branch are the two that users notice most.',
    states: [
      { id: 'sub', label: 'Submitted', by: 'provider or owner' },
      { id: 'val', label: 'Validated', by: 'system' },
      { id: 'idx', label: 'Indexed', by: 'batch build' },
      { id: 'srv', label: 'Served', by: 'searcher' },
      { id: 'upd', label: 'Updated', by: 'owner' },
    ],
    failures: [
      { after: 'sub', label: 'Duplicate from two providers', handling: 'fuzzy match on name and proximity, merge with an unmerge path' },
      { after: 'val', label: 'Coordinates put a shop in the sea', handling: 'plausibility check against the address' },
      { after: 'idx', label: 'Build fails silently', handling: 'atomic swap keeps the old index; alert on index age' },
      { after: 'srv', label: 'Nothing within the radius', handling: 'widen progressively, then be honest about it' },
      { after: 'srv', label: 'Thousands of candidates downtown', handling: 'adaptive cell precision plus precomputed top-N' },
      { after: 'srv', label: 'Place permanently closed', handling: 'fast overlay path — do not wait for the daily build' },
    ],
  },

  architecture: {
    caption:
      'A daily batch build produces a static index. The one apparently-dynamic field, open now, is computed at read time so the index never has to change.',
    nodes: [
      { id: 'p', label: 'Providers', kind: 'external', col: 0, row: 0 },
      { id: 'o', label: 'Owner edits', kind: 'client', col: 0, row: 1 },
      { id: 'b', label: 'Build pipeline', sub: 'dedupe, validate, cell', kind: 'service', col: 1, row: 0, span: 2 },
      { id: 'idx', label: 'Geo index', sub: 'by cell, top-N', kind: 'store', col: 3, row: 0 },
      { id: 'ov', label: 'Correction overlay', sub: 'closures', kind: 'cache', col: 3, row: 1 },
      { id: 'u', label: 'User', kind: 'client', col: 0, row: 2 },
      { id: 'ca', label: 'Result cache', sub: 'rounded location', kind: 'cache', col: 1, row: 2 },
      { id: 's', label: 'Search svc', sub: 'rank + open now', kind: 'service', col: 2, row: 2 },
    ],
    edges: [
      { from: 'p', to: 'b' },
      { from: 'o', to: 'b' },
      { from: 'b', to: 'idx', label: 'atomic swap' },
      { from: 'u', to: 'ca' },
      { from: 'ca', to: 's', label: 'miss', dashed: true },
      { from: 's', to: 'idx' },
      { from: 's', to: 'ov' },
    ],
  },

  numbers: {
    caption: 'Ten writes a second, fifty thousand reads. And a candidate set that varies a thousandfold with density.',
    items: [
      { label: 'Place updates', value: 10, display: '~10 / sec globally', tone: 'muted' },
      { label: 'Queries', value: 50000, display: '~50,000 / sec', tone: 'accent' },
      { label: 'Candidates — city centre, 2 km', value: 5000, display: '~5,000 places', tone: 'bad' },
      { label: 'Candidates — rural, 2 km', value: 3, display: '~3 places', tone: 'muted' },
    ],
    note: 'So the hard part is density, not volume. The same query costs a thousand times more downtown than in a village — which is why cell precision has to adapt, and why fixed-radius designs fail at one end or the other.',
  },

  flow: {
    scenario: 'sharding',
    caption: 'Places are assigned to cells by their coordinates. A query reads its own cell plus the eight neighbours — a place 50 metres away can easily be over a boundary.',
  },

  compare: {
    caption: 'How you make the geographic lookup indexable.',
    a: {
      title: 'Geohash cells (fixed grid)',
      points: [
        'Simple: a string prefix, so an ordinary B-tree index answers proximity.',
        'Nearby things share a prefix, so the query is a range scan.',
        'Boundaries are arbitrary — you must always query the eight neighbours.',
        'One fixed cell size is wrong somewhere: too big downtown, too small in the countryside.',
      ],
    },
    b: {
      title: 'Quadtree (adaptive)',
      points: [
        'Cells subdivide where density is high, so candidate counts stay even.',
        'Handles the city-versus-countryside problem natively.',
        'A tree to build and maintain, rather than a string you compute.',
        'More work when points move — which, for places, they never do.',
      ],
    },
    verdict:
      'For places, geohash with adaptive precision gets you most of the quadtree\'s benefit for much less machinery, and the near-zero write rate means rebuilding the grid is cheap. Choose the quadtree when density varies extremely and you need the structure to handle it for you. For moving objects, neither — keep positions in memory keyed by cell and rebuild constantly.',
  },

  followUps: [
    'scale-hot-key',
    'kill-cache',
    'choice-database',
    'ops-debug-slow',
    'scope-multiregion',
    'scale-10x',
    'cost-monthly',
    'consistency-lag',
  ],
}
