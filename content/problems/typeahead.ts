import type { Problem } from '@/lib/types'

export const TYPEAHEAD: Problem = {
  slug: 'typeahead',
  title: 'Search typeahead',
  group: 'search',
  difficulty: 'core',
  concepts: ['search-indexing', 'caching', 'cdn', 'rate-limiting', 'change-data-capture'],
  prompt:
    'Design search suggestions that appear as the user types. Every keystroke should produce updated suggestions, ranked by what people actually search for.',

  slack: {
    budget: 'Per keystroke: ~100 ms. Index freshness: hours.',
    headline: 'A hundred milliseconds per keystroke, because a person types the next character in about 200 — and hours of slack on how fresh the suggestions are.',
    body: [
      'The latency budget is brutal and it is set by typing speed. A moderate typist produces a character every 150 to 250 ms, so a suggestion arriving after 300 ms is already answering a question the user has moved past. Anything above about 100 ms and the list visibly lags behind the cursor. That budget rules out almost every approach that involves searching at request time.',
      'But the freshness budget is enormous, and this is the asymmetry to exploit. Suggestions are derived from what people have searched for historically — and yesterday\'s popularity is a near-perfect predictor of today\'s. Rebuilding the suggestion index once an hour, or even once a day, produces results nobody can distinguish from real-time. So you have hours to precompute anything you like.',
      'The exception is trending: a breaking news event makes a term explode in minutes, and suggestions that ignore it feel broken. That is a narrow, high-value carve-out — a small fast-moving layer over a slow-moving base, rather than a reason to make the whole system real-time.',
      'Hours of build slack plus 100 ms of serve budget is the clearest precompute-versus-compute-on-read decision in the whole app.',
    ],
    consequence:
      'You precompute the answer for every prefix ahead of time and serve it from memory. You do not search at request time. The only live component is a small trending overlay.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'What are the suggestions actually drawn from? That is a real question.',
        'Personalised or global? It changes whether you can cache.',
        'How many requests does one search generate?',
      ],
      model: [
        'Assumptions: global, and suggestions come from historical search queries rather than from a product catalogue — the top queries starting with what has been typed. One search generates several requests, one per keystroke, so request volume is many times the search volume. Suggestions are short strings, so the data is small. Users type on mobile keyboards, with typos.',
        'First question, and it decides whether the answer can be shared: are suggestions personalised, or the same for everyone typing the same prefix? Because global suggestions can be precomputed once and cached at the edge for everybody, while personalised means a per-user computation inside a 100 ms budget and no shared caching at all. I will assume global, with light personalisation applied on the client from local history.',
        'Second question: do we need to handle typos and near-misses, or exact prefixes only? Because fuzzy matching is a fundamentally more expensive lookup and would change the data structure. I will assume exact prefix matching first, with a limited typo tolerance as a second layer.',
        'Scope: return ranked suggestions for a prefix, keep them reasonably fresh, and handle trending terms. Out of scope: the actual search results page, spelling correction on submitted queries, and multi-language handling, though I would flag the last as a real complication.',
      ],
      checklist: [
        'Stated that suggestions come from historical queries, not a catalogue',
        'Noted request volume is a multiple of search volume — one per keystroke',
        'Asked global versus personalised and named the caching consequence',
        'Asked about typo tolerance and deferred it as a second layer',
        'Proposed a scope and excluded the results page',
      ],
      tradeoffs: [
        {
          decision: 'Global suggestions, personalised on the client',
          cost: 'Loses server-side personalisation quality. In exchange every response is shareable and cacheable, which is what makes a 100 ms budget achievable at scale.',
        },
      ],
      sayThis:
        '"Assuming suggestions are global — the same prefix gives the same list for everyone — with personalisation applied client-side from local history. That assumption is what lets me cache everything at the edge. If they had to be personalised per user, this becomes a completely different and much harder system, so it is worth asking."',
      trap: 'Not noticing that one search means five to ten requests. The request rate is not the search rate, and that multiplier is the whole capacity story.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write the life of a suggestion as a chain, and add the failure branches.',
      nudges: [
        'A suggestion has a life: it gets born from queries and eventually dies. Trace it.',
        'What does the system decide silently about which suggestions to show?',
        'What happens when someone types faster than your responses arrive?',
      ],
      model: [
        'Actors: the person typing, the population of past searchers whose behaviour creates the rankings, and the system — which decides what qualifies as a suggestion, what to suppress, and what counts as trending.',
        'The chain: queries logged → aggregated by frequency → filtered and ranked → built into the prefix structure → served for a prefix → eventually decays out of the rankings.',
        'Failure branches. At logged: bot traffic inflates a query\'s count, so rankings reflect scripts rather than people — the system must filter obvious automation, or suggestions get poisoned. At filtered: an offensive or harmful query becomes popular, and because suggestions come from raw behaviour, the system will happily promote it. This is a real requirement, not a nicety: it needs a blocklist and a review path, and it is the branch most people never mention. At built: the index build job fails, so suggestions silently go stale — the failure mode is invisible, since a slightly old index looks completely normal, which means it needs explicit monitoring on index age.',
        'At served: the responses arrive out of order. The user typed "ca", then "cat", and the "ca" response arrives second, overwriting the more specific suggestions with less specific ones. This is a real and common bug, and the fix belongs in the design: every response carries the prefix it answers, and the client discards anything that does not match the current input.',
        'At served: the user types faster than the round trip, generating requests for prefixes they have already moved past — the client should debounce briefly and cancel in-flight requests.',
        'At served: no suggestions match at all. Return nothing cleanly rather than falling back to unrelated popular queries, which feels broken.',
        'And the decay branch: a query that was hugely popular last month should fade, so ranking must weight recency rather than all-time totals, or the suggestions become a museum.',
      ],
      checklist: [
        'Traced the suggestion from logged queries to being served',
        'Handled bot traffic poisoning the rankings',
        'Handled offensive suggestions — blocklist and review path',
        'Handled a failed index build, and noted the failure is silent',
        'Handled out-of-order responses by matching prefix to current input',
        'Debounced and cancelled in-flight requests on the client',
        'Handled the empty result case honestly',
        'Weighted ranking by recency so old queries decay',
      ],
      trap: 'Ignoring out-of-order responses. It is a client concern that shows up as "the suggestions flicker and show the wrong thing", and it is caused by the design, so it belongs in the design.',
    },

    {
      id: 3,
      ask: 'Estimate request rate, index size, and build cost. Then finish "So the hard part here is ___."',
      nudges: [
        'Requests per second — remember the keystroke multiplier.',
        'How many distinct queries are worth suggesting? Be realistic.',
        'How big is the precomputed answer for every prefix?',
      ],
      model: [
        'Requests: assume 100,000 searches per second at peak. At 6 keystrokes per search with debouncing, that is around 600,000 suggestion requests per second. That is a very high request rate for something with a 100 ms budget, and it is the number that rules out anything clever per request.',
        'Distinct queries: people search an enormous variety, but the tail is worthless as suggestions — a query searched twice ever should not be suggested. Take the top 10 million queries, which covers the overwhelming majority of what anyone would want suggested.',
        'Index size: 10 million queries at roughly 40 bytes each is 400 MB of raw text. Storing the top 10 completions at every prefix node inflates that — call it a few gigabytes with the structure and rankings. That fits in memory on a single machine, which is the conclusion that shapes everything: the entire suggestion index is a memory-sized object, so it can be replicated onto every serving node rather than sharded and queried over a network.',
        'Build cost: aggregating a day of query logs, maybe 10 billion entries, is a batch job of tens of minutes. Entirely affordable given hours of slack.',
        'Cache effectiveness: prefix popularity is extremely concentrated. The top few thousand prefixes account for a large share of all requests, because everyone types the same first two or three characters. So a small cache absorbs most traffic, and short prefixes — the most requested — are also the most cacheable.',
        'So the hard part here is request rate against a 100 ms budget, and the answer is precomputation plus caching. Not index size, not build cost, and not the ranking algorithm.',
      ],
      checklist: [
        'Applied the keystroke multiplier to get the real request rate',
        'Bounded the index to the top N queries and justified dropping the tail',
        'Concluded the whole index fits in memory on one machine',
        'Noted the build is a batch job that fits comfortably in the slack',
        'Noted prefix popularity is concentrated, making caching very effective',
        'Finished the sentence: request rate against a tight latency budget',
      ],
      sayThis:
        '"Six hundred thousand requests a second, and the whole index is a few gigabytes — it fits in memory on one machine. So the hard part is request rate against a hundred-millisecond budget, and the answer is precompute everything and replicate the index to every serving node. No network lookup on the hot path at all."',
      trap: 'Trying to suggest from all distinct queries. The tail is enormous and useless — nobody wants a suggestion that one person searched once. Bounding to the top N is what makes the index fit in memory, which changes the entire design.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and be specific about the data structure.',
      nudges: [
        'What structure answers "top 10 completions of this prefix" in microseconds?',
        'Where is the ranking computed — at build time or at request time?',
        'How does the index get updated without downtime?',
      ],
      model: [
        'The data structure is the design. A trie over the top 10 million queries, where each node stores the top 10 completions beneath it, precomputed at build time. Answering a request is then walking the prefix — six character steps — and reading a list that is already there. No search, no ranking, no scoring at request time. Justified directly by the 100 ms budget and the 600,000-per-second rate: anything computed per request would not fit.',
        'That precomputation is the central trade. Building it is expensive and takes hours; serving from it is close to free. With hours of slack on freshness and 100 ms on serving, that is exactly the right way round.',
        'Ranking happens at build time: score each query by frequency weighted toward recent days so popularity decays, apply blocklists, and store the ordered top 10 at each node. Justified by the Stage 2 branches on decay and offensive content — both are build-time concerns, which is convenient.',
        'Serving: the whole index is replicated to every serving node, held in memory. Nodes are stateless with respect to each other and scale horizontally behind a load balancer. Justified by the size estimate — a few gigabytes per node is cheap, and it removes any network hop from the lookup.',
        'Caching: an edge cache in front, keyed by prefix, with a TTL of minutes. Because short prefixes dominate traffic and are identical for everyone, the hit rate is very high, and most requests never reach a serving node at all. This is the single highest-leverage box in the design, justified by the concentration observed in Stage 3.',
        'Index building: a batch job reads query logs, aggregates, filters, ranks, and produces a new index artefact. Deployed by building the new index alongside the old one and switching an atomic pointer — never mutating in place, so there is no window where the index is half-updated. Justified by the Stage 2 branch about failed builds: an atomic switch means a failed build leaves the previous index serving, which is exactly the right failure behaviour.',
        'Trending overlay: a small, separately-updated layer of terms rising sharply in the last few minutes, merged into results at serve time. Kept small and separate deliberately, so the fast-moving part does not force the whole system to be real-time. Justified by the carve-out in the slack analysis.',
        'Client behaviour is part of the design, not an afterthought: debounce by about 50 ms, cancel superseded requests, discard responses whose prefix does not match the current input, and cache locally so backspacing does not re-request. That last one matters more than it sounds — backspacing is common and every one of those responses is already known.',
      ],
      checklist: [
        'Chose a trie with precomputed top-N at each node, and justified it with the latency budget',
        'All ranking done at build time, nothing at request time',
        'Index replicated to every node and held in memory',
        'Edge cache keyed by prefix, justified by prefix concentration',
        'Index deployed by atomic pointer switch, so a failed build is safe',
        'Trending handled as a small separate overlay',
        'Client-side debounce, cancellation, prefix matching and local cache',
      ],
      tradeoffs: [
        {
          decision: 'Precompute top-N at every trie node',
          cost: 'Much larger index and an expensive build. Buys a lookup with no ranking work at request time, which is the only way to hit the budget.',
        },
        {
          decision: 'Replicate the full index to every node',
          cost: 'Every node carries a few gigabytes and a full rebuild is deployed everywhere. Removes all network lookups from the hot path.',
        },
        {
          decision: 'Hourly rebuilds instead of real-time',
          cost: 'New queries take up to an hour to become suggestable. Invisible for almost everything, which is why trending gets its own small path.',
        },
      ],
      trap: 'Querying a general-purpose search engine per keystroke. It is built for a different job — scoring documents against a query — and it will not hold 100 ms at 600,000 requests a second. Precomputation is the answer here, and knowing when not to use the search engine is the signal.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'How do you handle typos without abandoning the trie?',
        'A breaking news term explodes. Walk through what happens.',
        'What does a rebuild actually cost you in memory?',
      ],
      model: [
        'Hard part one: freshness against precomputation, which is the tension the whole design carries. The base index rebuilds hourly, which is fine for the long tail. Trending is the exception, so I keep a separate small structure updated every minute or two from a stream of recent queries, holding terms whose rate has risen sharply. At serve time the two are merged, with trending items boosted. Keeping this small — thousands of terms, not millions — is what makes it affordable. Cost: two ranking sources merged at serve time, so the ordering logic is more complex and the results are harder to explain when someone asks why a suggestion appeared.',
        'Deploying a new index has a real memory cost worth naming: to switch atomically you hold both the old and new index in memory briefly, so peak memory is roughly double steady state. That has to be planned for, and it is the kind of detail that turns a clean design into an outage if missed. Cost: sizing every node for 2x, or accepting a brief window of reduced capacity while nodes rebuild in rotation.',
        'Hard part two: typo tolerance without abandoning the structure. A trie is exact by nature. Options: precompute common misspellings as additional entries pointing at the correct query, which is cheap and covers the majority of real typos since they cluster heavily; or fall back to a fuzzy search only when the exact prefix returns too few results, which is slower but rare. I would take both — precomputed misspellings for the common cases, fuzzy fallback when the exact lookup comes back nearly empty. Cost: a larger index, and the fallback path has a much worse latency profile, so it needs a tight timeout and must degrade to returning nothing rather than blowing the budget.',
        'Hot prefix protection: single-character prefixes are requested constantly. Those are pure cache hits at the edge, so they never reach a serving node — but I would make sure the very shortest prefixes have long TTLs, since their answers barely change. Cost: a trending term takes slightly longer to appear under a single-letter prefix, which nobody notices.',
        'Abuse and rate limiting: an automated client can generate enormous request volume cheaply here, since every keystroke is a request. Per-client rate limiting is needed, and it is one of the clearer cases where a limit protects real capacity. Cost: an aggressive typist on a shared network could hit a limit, so the limit must be generous and keyed carefully.',
        'Multi-language, raised because it is the thing that most complicates this in practice: tokenisation and prefix semantics differ by script, and languages without spaces do not have prefixes in the same sense. I would build per-language indexes and route by locale rather than pretend one structure handles everything. Cost: N indexes to build and hold, and ambiguity for multilingual users.',
        'Consistency per feature: suggestions are eventually consistent by up to an hour and that is by design. Trending is eventually consistent by a minute or two. Blocklists must apply immediately, which means they are checked at serve time as well as at build time — a filter that only runs at build time leaves an offensive suggestion live until the next rebuild, which is not acceptable. That asymmetry is worth stating clearly.',
        'What I would monitor: p99 latency per request, cache hit rate by prefix length, index age — the silent failure — trending pipeline lag, and the rate of empty-result responses, which is the earliest signal that an index build produced something wrong.',
      ],
      checklist: [
        'Trending handled as a small separate structure merged at serve time',
        'Noted the 2x memory cost of an atomic index swap',
        'Typo tolerance via precomputed misspellings plus a bounded fuzzy fallback',
        'Hot short prefixes handled by caching with long TTLs',
        'Rate limiting justified by the per-keystroke request pattern',
        'Raised multi-language as a real complication with a real answer',
        'Blocklists enforced at serve time, not only at build time',
        'Named what to monitor, including index age and empty-result rate',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Separate trending layer',
          cost: 'Two sources merged at serve time, harder to explain and to tune. Avoids making the entire pipeline real-time for a small slice of terms.',
        },
        {
          decision: 'Fuzzy fallback for near-empty results',
          cost: 'A much slower path, so it needs a tight timeout and must return nothing rather than exceed the budget.',
        },
        {
          decision: 'Blocklist enforced at serve time',
          cost: 'A check on every request, on the tightest budget in the system. Non-negotiable — the build-time-only alternative leaves bad suggestions live for an hour.',
        },
      ],
      sayThis:
        '"Everything is precomputed at build time and I do zero ranking per request — but blocklists are checked at serve time as well, because a build-time-only filter would leave an offensive suggestion live until the next rebuild. Cost: one extra check on my tightest latency path, which I accept because the alternative is an hour of exposure."',
      trap: 'Treating freshness as a single number for the whole system. The base index can be hours old, trending must be minutes, and blocklists must be immediate. Three different budgets, three different mechanisms.',
    },
  ],

  lifecycle: {
    caption:
      'A suggestion, from logged queries to a dropdown. The out-of-order response branch is a design problem that shows up as a UI bug.',
    states: [
      { id: 'log', label: 'Queries logged', by: 'searchers' },
      { id: 'agg', label: 'Aggregated', by: 'batch job' },
      { id: 'rank', label: 'Ranked + filtered', by: 'system' },
      { id: 'built', label: 'Index built', by: 'system' },
      { id: 'serve', label: 'Served', by: 'typist' },
    ],
    failures: [
      { after: 'log', label: 'Bot traffic inflates counts', handling: 'filter automation before aggregating' },
      { after: 'rank', label: 'Offensive query trends', handling: 'blocklist at build time AND at serve time' },
      { after: 'built', label: 'Build job fails silently', handling: 'atomic pointer switch keeps the old index; alert on index age' },
      { after: 'serve', label: 'Responses arrive out of order', handling: 'response carries its prefix; client discards mismatches' },
      { after: 'serve', label: 'User types faster than the round trip', handling: 'debounce ~50 ms and cancel superseded requests' },
      { after: 'serve', label: 'No matches at all', handling: 'return nothing cleanly — never unrelated popular queries' },
    ],
  },

  architecture: {
    caption:
      'The expensive work happens hourly, offline. The request path is a prefix walk in memory, and most requests never even get that far.',
    nodes: [
      { id: 'logs', label: 'Query logs', kind: 'store', col: 0, row: 0 },
      { id: 'b', label: 'Build job', sub: 'aggregate, rank, filter', kind: 'service', col: 1, row: 0 },
      { id: 'art', label: 'Index artefact', sub: 'trie, top-10 per node', kind: 'store', col: 2, row: 0 },
      { id: 'tr', label: 'Trending', sub: 'refreshed ~1 min', kind: 'cache', col: 2, row: 1 },
      { id: 'u', label: 'Typist', kind: 'client', col: 0, row: 2 },
      { id: 'cdn', label: 'Edge cache', sub: 'by prefix', kind: 'cache', col: 1, row: 2 },
      { id: 's', label: 'Suggest svc', sub: 'index in memory', kind: 'service', col: 2, row: 2 },
    ],
    edges: [
      { from: 'logs', to: 'b' },
      { from: 'b', to: 'art' },
      { from: 'art', to: 's', label: 'atomic swap' },
      { from: 'tr', to: 's', label: 'merge' },
      { from: 'u', to: 'cdn' },
      { from: 'cdn', to: 's', label: 'miss', dashed: true },
    ],
  },

  numbers: {
    caption: 'A huge request rate against a tiny budget — and an index small enough to hold everywhere.',
    items: [
      { label: 'Searches', value: 100000, display: '~100,000 / sec', tone: 'muted' },
      { label: 'Suggestion requests (6 keystrokes each)', value: 600000, display: '~600,000 / sec', tone: 'accent' },
      { label: 'Index size (top 10M queries)', value: 3, display: '~3 GB — fits in memory', tone: 'muted' },
    ],
    note: 'The index fits on one machine, so replicate it to every serving node and take the network out of the hot path entirely. So the hard part is request rate against a 100 ms budget — which precomputation solves and per-request search does not.',
  },

  flow: {
    scenario: 'cache-hit',
    caption: 'Short prefixes are requested constantly and are identical for everyone, so the edge answers almost all of them. Most requests never reach a serving node.',
  },

  compare: {
    caption: 'Precompute at build time, or search at request time. The budgets decide it.',
    a: {
      title: 'Precomputed trie, top-N per node',
      points: [
        'A request is a six-step walk plus a list read — microseconds.',
        'All ranking, filtering and decay happen offline where time is free.',
        'Index is a few GB, so every node can hold the whole thing.',
        'New queries are invisible until the next rebuild.',
      ],
    },
    b: {
      title: 'Query a search engine per keystroke',
      points: [
        'Fresh immediately, and fuzzy matching comes for free.',
        'No build pipeline, no artefact management, no atomic swaps.',
        'Scoring per request will not hold 100 ms at 600,000 requests/sec.',
        'Cost scales with request volume rather than with data size.',
      ],
    },
    verdict:
      'Precompute. You have hours of freshness slack and 100 ms of serving budget — that is the textbook signal to move work from read time to build time. Add a small trending layer for the one case where hours is genuinely too slow, rather than making everything real-time to serve a fraction of the terms.',
  },

  followUps: [
    'scale-10x',
    'kill-cache',
    'ops-debug-slow',
    'choice-database',
    'scope-multiregion',
    'cost-monthly',
    'ops-deploy',
    'consistency-lag',
  ],
}
