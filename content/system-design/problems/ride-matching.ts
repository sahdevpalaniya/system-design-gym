import type { Problem } from '@/lib/types'

export const RIDE_MATCHING: Problem = {
  slug: 'ride-matching',
  title: 'Ride matching',
  group: 'matching',
  difficulty: 'hard',
  concepts: [
    'geospatial-indexing',
    'consensus',
    'idempotency',
    'realtime-transports',
    'distributed-counter',
    'latency-vs-throughput',
    'clocks-and-ordering',
  ],
  prompt:
    'Design the matching part of a ride-hailing service. A rider requests a ride from where they are standing; the system finds a nearby driver, offers them the trip, and confirms the match. Drivers move continuously and can decline.',

  slack: {
    budget: 'Match: ~10 seconds, and every second is visible.',
    headline: 'A person is standing on a street with a phone in their hand. There is no cooking time, no processing window, nothing to hide latency inside. This is the group with the least slack in the entire app.',
    body: [
      'Compare this to food delivery, which looks like the same problem. There, a courier does not need to be assigned the moment the order is placed — the restaurant needs 15 minutes to cook, and the system can spend several of those minutes finding the best courier, batching orders together, and waiting for a better option to come free. That 15 minutes is slack, and it makes a fundamentally different design possible: batched optimisation rather than immediate assignment.',
      'Ride hailing has none of it. The rider is outside, possibly in the rain, watching a spinner. Ten seconds without a driver feels broken, thirty seconds and they open a competing app. So matching must be greedy and immediate — take a good driver now, not the best driver in forty seconds. That single fact rules out global optimisation, which is the elegant answer and the wrong one.',
      'There is one small pocket of slack, and it is worth naming because it is the only one: the few seconds between offering a trip to a driver and their tap. That window is what lets you sequence offers rather than blasting all candidates at once — but it is also the window in which the rider is waiting and other drivers are moving away, so it is measured in seconds and cannot be spent freely.',
      'Everything not on the matching path — receipts, ratings, driver earnings, analytics — has hours of slack and should be nowhere near this design.',
    ],
    consequence:
      'Zero slack means greedy immediate matching, not batch optimisation. It also means the failure branches — nobody accepts, everybody declines — are the design, because they happen while a human is watching.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'What is the one thing about this product that makes it different from a marketplace with no time pressure?',
        'Is one driver offered at a time, or several at once? That changes correctness, not just UX.',
        'Say the write:read ratio for location updates. It is surprising.',
      ],
      model: [
        'Assumptions: one city at a time as the unit of scale, so I design for a city and replicate the design rather than building one global matcher. Hundreds of thousands of active drivers per large city at peak. Drivers report location every 4 seconds. Payments and identity are elsewhere. Riders are impatient — a match must happen in under about 10 seconds.',
        'First question, and it changes correctness rather than polish: do we offer a trip to one driver at a time and wait, or broadcast to several and take the first to accept? Because broadcasting means two drivers can accept the same ride, which is a contested-resource problem needing a lock or a conditional write; sequential offering avoids that entirely but is slower when drivers ignore their phones. I will assume sequential offers with a short timeout, falling back to a small parallel batch if the first few time out.',
        'Second question: does the rider get to see drivers moving on the map before requesting? Because that turns a matching problem into a continuous streaming problem for every open app, which is a much larger read load than matching itself. I will assume yes, since every real product does it, and treat it as a separate lower-priority path.',
        'Scope: request a ride, find candidate drivers, offer and confirm, and handle nobody accepting. Out of scope: pricing and surge, routing and navigation, payments, and the trip itself once it has started.',
      ],
      checklist: [
        'Scoped to a city rather than designing one global matcher',
        'Stated the location update frequency — it drives the write load',
        'Asked sequential-versus-broadcast offering and explained it is a correctness question',
        'Named the rider patience budget as a hard constraint',
        'Proposed scope and excluded pricing, routing and payments explicitly',
      ],
      tradeoffs: [
        {
          decision: 'City as the unit of scale',
          cost: 'Cross-city trips and airport edges need special handling. In exchange, every shard is independent and a city outage is contained.',
        },
        {
          decision: 'Sequential offers',
          cost: 'Slower when drivers do not respond, since each timeout costs seconds from a 10-second budget. Avoids two drivers accepting the same ride.',
        },
      ],
      sayThis:
        '"Assuming I design for one city and replicate it — matching never needs to cross cities. Drivers ping every four seconds, so writes hugely outnumber reads. One question: do we offer to one driver at a time or broadcast? That is a correctness question, because broadcasting means two people can accept the same trip. I will assume sequential with a short timeout."',
      trap: 'Asking about car types, or ratings, or the pricing model. None of them change a box in the matching design. The offer protocol does.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write the trip request\'s life as a chain, and add the failure branches. The branches are the whole problem here.',
      nudges: [
        'The system makes several silent decisions per request. Name them.',
        'What if nobody accepts at all? That is not an edge case, it happens constantly.',
        'What if the driver accepts and then the rider cancels in the same second?',
      ],
      model: [
        'Actors: rider, driver, and the system — which here is unusually active. The system decides which drivers are candidates, in what order to offer, how long to wait for each, when to widen the search, when to give up, and whether a driver who ignores offers should keep receiving them.',
        'The chain: requested → candidates found → offered to a driver → accepted → driver en route → picked up. The design lives entirely in the first four states.',
        'Failure branches, and this is the substance of the problem. At candidates found: there are no drivers in range — widen the radius, then tell the rider honestly rather than spinning forever. At offered: the driver does not respond within the timeout — withdraw the offer and move to the next candidate, and note the offer must actually expire server-side, or a driver accepting late collides with a driver who already took it. At offered: the driver declines — next candidate, and record the decline, because a driver declining everything is a supply problem, not a matching one. At offered: every candidate declines or times out — this is the branch people never write, and it is common. The answer is to re-run the search, since the world has moved on in ten seconds, widen the radius, and after a bounded number of rounds tell the rider no driver is available and stop, because an infinite spinner is the worst outcome.',
        'At accepted: two drivers accept, which is only possible in the broadcast variant and is exactly why the accept must be a conditional write — first accept wins, second is told the trip is gone. At accepted: the rider cancels in the same moment the driver accepts, so both operations race — the trip state machine must have a single owner and reject invalid transitions, rather than two services each deciding. At en route: the driver goes offline or their app crashes — detect via missed heartbeats and re-match, which means a trip can go back to the offering state, and the rider must be told.',
        'One more the system owns silently: a driver whose location is 45 seconds stale should not be a candidate at all, because offering to a driver who is no longer where you think they are burns the rider\'s patience budget for nothing.',
      ],
      checklist: [
        'Named the system as an active decision maker and listed its decisions',
        'Wrote the request lifecycle as a chain of states',
        'Handled no drivers in range — widen, then be honest',
        'Handled driver timeout with a server-side offer expiry',
        'Handled the everybody-declines case with bounded rounds and a real "no drivers" outcome',
        'Handled two drivers accepting via a conditional write',
        'Handled the rider-cancels-while-driver-accepts race with a single state owner',
        'Handled the driver disappearing after accepting',
        'Excluded drivers with stale locations from candidacy',
      ],
      trap: 'Writing "request → match → ride" and calling it a lifecycle. Nobody accepting is not an edge case — at peak it is a large fraction of requests, and the interviewer is specifically listening for it.',
    },

    {
      id: 3,
      ask: 'Estimate location writes, matching reads, and storage. Then finish "So the hard part here is ___."',
      nudges: [
        'Drivers ping every 4 seconds. How many pings per second is that?',
        'How many ride requests per second, compared to pings?',
        'Do you need to store the location history? Ask what it is for.',
      ],
      model: [
        'Take a large city at peak: 100,000 active drivers, each reporting every 4 seconds. That is 25,000 location writes per second, from one city, continuously, all day.',
        'Ride requests in the same city at peak: perhaps 500 per second — fifty times fewer than the location writes. So this is a write-dominated system, which is the opposite of most products and is the fact that decides the storage choice.',
        'Each match reads the candidate drivers in a small area: maybe 50 to 200 drivers examined per request, so 500 requests a second is around 50,000 candidate reads a second. Significant, but small next to the writes.',
        'Storage: a live position is a driver id, a coordinate, a timestamp and a status — under 100 bytes. Current positions for 100,000 drivers is 10 MB. That fits in memory easily, which is the single most useful conclusion in this whole estimate: the live index is a memory-sized problem, so it should not be in a database at all.',
        'Historical positions are a different matter — 25,000 a second at 100 bytes is 2.5 MB a second, about 200 GB a day per city. That is a real data volume, and it exists for analytics and disputes, not for matching. So it goes to a completely separate append-only path and never touches the matching system.',
        'So the hard part here is a very high write rate against an index that must stay queryable by location — and doing it inside a rider\'s ten-second patience budget. Not storage, not read throughput, and not the matching algorithm, which is embarrassingly simple once the index is right.',
      ],
      checklist: [
        'Calculated location writes per second and noticed they dominate',
        'Compared them to ride requests — roughly 50:1',
        'Concluded the live position index fits in memory',
        'Separated historical position storage from the live index entirely',
        'Finished the sentence: high-frequency writes into a geo-queryable index, under a hard latency budget',
      ],
      sayThis:
        '"Twenty-five thousand location writes a second against five hundred ride requests a second — writes beat reads fifty to one, which is unusual. But all live positions are only ten megabytes, so the live index belongs in memory, not a database. So the hard part here is sustaining that write rate on a geo index while answering a match in seconds."',
      trap: 'Designing a durable, transactional store for driver locations. A position that is four seconds old is worthless and will be overwritten in four more seconds — durability here is spending money to protect data with no value.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and be specific about how "find nearby drivers" actually works.',
      nudges: [
        'Latitude and longitude are two dimensions. Indexes sort on one. How do you bridge that?',
        'What holds the live positions, physically?',
        'Where does the trip state machine live, and who owns it?',
      ],
      model: [
        'Location ingestion: drivers send positions over a persistent connection to a location service, which updates the in-memory geo index and separately fires the position onto a stream for the historical path. Justified by 25,000 writes a second — a persistent connection avoids per-ping HTTP overhead, and the two destinations have completely different requirements.',
        'The geo index, which is the heart of it. Encode each position as a geohash — 6 characters, roughly a square kilometre — and keep, per cell, a sorted set of drivers with their exact coordinates and last-seen time. Redis is the natural fit: in-memory, fast writes, and native support for this shape. A driver moving between cells is a remove and an add. Finding candidates means reading the rider\'s cell plus the eight neighbouring cells, because a driver 100 metres away can be just over a cell boundary and missing them is a real bug, not a theoretical one.',
        'Then filter and rank: drop anyone whose position is older than about 15 seconds, drop anyone not available, compute a real distance, and rank by estimated arrival time rather than straight-line distance — because a driver 200 metres away across a motorway with no crossing is further away in practice than one 600 metres down the same road. The routing call is on the hot path, so it is a batch call for the top handful of candidates only, not for all 200.',
        'Matching service: takes the ranked candidates and runs the offer protocol — offer to the top candidate, wait a few seconds, withdraw and move on, widening the search every couple of rounds, giving up after a bounded number. Greedy, not optimal, justified directly by the ten-second budget from Stage 1.',
        'Trip state machine: one service owns trip state, in a durable store, with transitions enforced as conditional updates. This is the one part that must be strongly consistent and durable, because it is the record of who is going where and who gets paid. Justified by the Stage 2 races: two accepts, and cancel-versus-accept.',
        'Push to drivers and riders: persistent connections, so an offer reaches a driver immediately and the rider sees status change without polling. Justified by the patience budget — polling every 2 seconds would waste a fifth of it.',
        'Historical positions: the stream feeds an append-only store for analytics and dispute resolution. Separate on purpose, with no coupling to matching, so a problem in the analytics pipeline cannot slow down a match.',
        'Partitioning: everything is sharded by city, and within a large city by geohash prefix, so a match only touches the shard covering that area. Justified by the numbers — 25,000 writes a second per city is fine on one node, and city isolation bounds the blast radius.',
      ],
      checklist: [
        'Explained why plain lat/lng columns do not work and named a geospatial approach',
        'Live positions in memory, not a durable database',
        'Searched neighbouring cells, not just the rider\'s cell',
        'Filtered out stale positions before ranking',
        'Ranked by estimated arrival time, not straight-line distance',
        'Offer protocol is greedy with timeouts, justified by the patience budget',
        'A single owner for trip state, with conditional transitions',
        'Persistent connections for offers rather than polling',
        'Historical position stream separated from the matching path',
        'Sharded by city and by geo cell',
      ],
      tradeoffs: [
        {
          decision: 'In-memory geo index',
          cost: 'A node restart loses all positions. Acceptable — drivers re-ping within 4 seconds, so it self-heals faster than any recovery process would.',
        },
        {
          decision: 'Greedy matching instead of batch optimisation',
          cost: 'Globally worse assignments — measurably longer average pickup times than a system that waits and optimises. Bought with the only currency that matters here, which is rider patience.',
        },
        {
          decision: 'Ranking by ETA, requiring a routing call',
          cost: 'A third-party dependency on the hot path, so it needs a timeout and a fallback to straight-line distance. Only called for the top few candidates.',
        },
      ],
      trap: 'Storing driver locations in the main transactional database with a lat/lng index. At 25,000 writes a second you have just made your most important database the busiest one in the system, for data that is worthless four seconds later.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'The offer protocol is where riders are lost. Go deep there.',
        'What happens at surge time when demand triples in fifteen minutes?',
        'What is the correctness guarantee on accept, exactly?',
      ],
      model: [
        'Hard part one: the offer protocol under a hard deadline. Sequential offers with a 5-second timeout mean three failed offers consume 15 seconds — already past the budget. So the protocol adapts: offer to one driver, and if the first two time out, switch to offering a small batch of three or four simultaneously and take the first accept. That converts a latency problem into a correctness problem, which I then solve explicitly: accept is a conditional update on trip state — assign the driver only if the trip is still unassigned — so the first accept wins and the others are told the trip is gone, with a clear message rather than an error. Cost: drivers occasionally tap accept and lose, which is a bad experience and needs handling in the app; and a batch offer means several drivers stop looking at other work for a few seconds.',
        'The offer must expire on the server, not just in the driver\'s app. If expiry lives only on the client, a driver with a frozen screen accepts 40 seconds later and collides with a completed match. Cost: server-side expiry means holding per-offer state with timers, which is more moving parts than a stateless design.',
        'Nobody accepting, in detail, because it is the most common real failure: after a bounded number of rounds — say three, with the radius widening each time — stop and tell the rider no drivers are available, with a retry option. Between rounds, re-run the search rather than reusing the candidate list, because in ten seconds drivers have moved and some have become free. Cost: re-running means more index reads per request, which is exactly the load I have capacity for.',
        'Hard part two: peak and hot cells. Demand is not uniform — a stadium emptying creates a single geohash cell with thousands of requests and few drivers. That cell\'s shard becomes hot for both reads and writes, and the index reads return the same overloaded candidate set to everyone. Defences: sub-partition hot cells so the load spreads; and more importantly, once a cell is starved, stop pretending — show honest wait times rather than searching endlessly, because a rider told "8 minutes" waits, and a rider shown a spinner leaves. Cost: this is a product-visible degradation, and it needs the pricing and supply systems to respond, which is outside this design but must be acknowledged.',
        'Driver disappearing after accepting: heartbeats every few seconds, and if they stop for more than about 30 seconds, move the trip back to offering and tell the rider we are finding another driver. Cost: a false positive on a bad network cancels a driver who was actually on their way, so the threshold must be generous and the driver must be able to reclaim the trip if they come back before it is reassigned.',
        'Idempotency, because mobile networks retry constantly: a ride request carries a client-generated key so a retry does not create two trips, and an accept carries the offer id so a duplicated accept is a no-op rather than a second assignment. Cost: an idempotency key store on the write path with a retention window — cheap, and mandatory here.',
        'Consistency per feature: driver positions are stale by seconds on purpose and that is fine. The candidate list is a best-effort snapshot. Trip state is strongly consistent and durable, because it decides who gets paid. Saying those three things separately is the answer — one blanket consistency statement would be wrong for two of the three.',
        'What I would monitor: time-to-match at p50 and p95, the rate of requests ending in no-driver-found, and offer acceptance rate per area. Acceptance rate falling in one area is the earliest signal of a supply problem, and it shows up before riders start complaining.',
      ],
      checklist: [
        'Offer protocol adapts under the deadline — sequential then small batch',
        'Accept is a conditional write; losing drivers get a clear message',
        'Offers expire server-side, not just on the client',
        'Bounded rounds with re-search between them, then an honest failure',
        'Handled hot cells at peak and named the product-visible degradation',
        'Heartbeat detection for a vanished driver, with a generous threshold',
        'Idempotency keys on request and accept',
        'Gave a per-feature consistency answer',
        'Named what to monitor, and why acceptance rate is the leading indicator',
        'A cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Batch offers after two timeouts',
          cost: 'Several drivers can accept; all but one lose. Needs a clean in-app experience for losing, and it briefly occupies drivers who will not get the trip.',
        },
        {
          decision: 'Server-side offer expiry',
          cost: 'Per-offer state and timers to manage. The alternative is late accepts colliding with completed matches.',
        },
        {
          decision: 'Generous heartbeat threshold before re-matching',
          cost: 'A really vanished driver holds the trip for up to 30 seconds. Tightening it would cancel drivers who merely went through a tunnel.',
        },
      ],
      sayThis:
        '"Accept is a conditional update on the trip row — assign only if still unassigned — so when I batch offers, the first accept wins and the others get a clean \'this trip is taken\'. Cost: some drivers tap accept and lose, which needs real handling in the app. And offers expire server-side, because a frozen client accepting 40 seconds late would otherwise collide with a completed match."',
      trap: 'Designing a beautiful global optimiser that assigns drivers to riders to minimise total wait. It is the better algorithm and the wrong product — the rider is standing outside, and there is no slack to run it in. Say why you rejected it; that scores.',
    },
  ],

  lifecycle: {
    caption:
      'The trip request. Every branch below happens routinely at peak — "nobody accepted" is not an edge case, it is a daily occurrence.',
    states: [
      { id: 'req', label: 'Requested', by: 'rider' },
      { id: 'cand', label: 'Candidates found', by: 'system' },
      { id: 'off', label: 'Offered', by: 'system' },
      { id: 'acc', label: 'Accepted', by: 'driver' },
      { id: 'enr', label: 'En route', by: 'driver' },
    ],
    failures: [
      { after: 'cand', label: 'No drivers in range', handling: 'widen radius, then say so honestly — never spin forever' },
      { after: 'off', label: 'Driver times out', handling: 'server-side expiry, withdraw, next candidate' },
      { after: 'off', label: 'Everyone declines', handling: 'bounded rounds, re-search each round, then a real no-driver result' },
      { after: 'acc', label: 'Two drivers accept', handling: 'conditional write on trip state — first wins, second told clearly' },
      { after: 'acc', label: 'Rider cancels simultaneously', handling: 'single owner of trip state rejects the invalid transition' },
      { after: 'enr', label: 'Driver goes offline', handling: 'missed heartbeats for 30s → back to offering, tell the rider' },
    ],
  },

  architecture: {
    caption:
      'Live positions live in memory and are never durable. Trip state is durable and strongly consistent. The two are separate systems on purpose.',
    nodes: [
      { id: 'd', label: 'Driver app', sub: 'ping / 4s', kind: 'client', col: 0, row: 0 },
      { id: 'ls', label: 'Location svc', kind: 'service', col: 1, row: 0 },
      { id: 'gi', label: 'Geo index', sub: 'in-memory, by cell', kind: 'cache', col: 2, row: 0 },
      { id: 'st', label: 'Position stream', kind: 'queue', col: 1, row: 1 },
      { id: 'hist', label: 'History store', sub: 'analytics only', kind: 'store', col: 2, row: 1 },
      { id: 'r', label: 'Rider app', kind: 'client', col: 0, row: 2 },
      { id: 'm', label: 'Matching svc', sub: 'offer protocol', kind: 'service', col: 2, row: 2 },
      { id: 'ts', label: 'Trip state', sub: 'durable, conditional', kind: 'store', col: 3, row: 2 },
      { id: 'rt', label: 'Routing', sub: 'ETA, top N only', kind: 'external', col: 3, row: 0 },
    ],
    edges: [
      { from: 'd', to: 'ls' },
      { from: 'ls', to: 'gi' },
      { from: 'ls', to: 'st' },
      { from: 'st', to: 'hist' },
      { from: 'r', to: 'm' },
      { from: 'm', to: 'gi', label: 'candidates' },
      { from: 'm', to: 'rt', label: 'rank by ETA' },
      { from: 'm', to: 'ts', label: 'accept = conditional' },
    ],
  },

  numbers: {
    caption: 'One large city at peak. Writes beat reads fifty to one — the opposite of most systems.',
    items: [
      { label: 'Driver location pings', value: 25000, display: '~25,000 / sec', tone: 'accent' },
      { label: 'Candidate reads', value: 50000, display: '~50,000 / sec (200 per request)', tone: 'muted' },
      { label: 'Ride requests', value: 500, display: '~500 / sec', tone: 'muted' },
      { label: 'All live positions in memory', value: 10, display: '~10 MB', tone: 'muted' },
    ],
    note: 'All live positions fit in 10 MB. That single number says the live index belongs in memory, not in a database — and that durability for a position that expires in 4 seconds is money spent protecting nothing.',
  },

  flow: {
    scenario: 'sharding',
    caption: 'Positions are routed to the shard owning their geo cell. A match reads its own cell plus the eight neighbours — a driver just over a boundary is still 100 metres away.',
  },

  compare: {
    caption: 'The design fork that separates ride hailing from every other matching problem.',
    a: {
      title: 'Greedy immediate matching',
      points: [
        'Offer to the best available driver right now and commit.',
        'Match in seconds, which is the only budget that exists here.',
        'Globally worse assignments — measurably longer average pickups.',
        'Simple to reason about and to debug during an incident.',
      ],
    },
    b: {
      title: 'Batched optimisation',
      points: [
        'Collect requests for 30–60 seconds, then assign the whole set optimally.',
        'Noticeably better assignments overall, and it can pair trips going the same way.',
        'Requires slack that ride hailing does not have — the rider is outside, waiting.',
        'Right for food delivery, where 15 minutes of cooking hides the delay completely.',
      ],
    },
    verdict:
      'Greedy, because there is no slack to optimise inside. This is the clearest example in the whole curriculum of the same-shaped problem getting opposite designs: food delivery has 15 minutes of cooking to hide latency in, so batching wins there. Ask "where is the slack?" before choosing.',
  },

  followUps: [
    'scale-hot-key',
    'kill-region',
    'consistency-simultaneous',
    'choice-database',
    'ops-alert-first',
    'scope-scheduled',
    'kill-cache',
    'cost-cheaper-slower',
  ],
}
