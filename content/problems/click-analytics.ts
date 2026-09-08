import type { Problem } from '@/lib/types'

export const CLICK_ANALYTICS: Problem = {
  slug: 'click-analytics',
  title: 'Click analytics pipeline',
  group: 'pipelines',
  difficulty: 'core',
  concepts: [
    'message-queues',
    'idempotency',
    'distributed-counter',
    'partitioning',
    'change-data-capture',
    'batch-vs-stream',
    'object-storage',
    'capacity-and-cost',
  ],
  prompt:
    'Design a system that ingests click and view events from a large website, and lets people query aggregates — clicks per page per hour, top referrers, conversion counts — over the last two years.',

  slack: {
    budget: 'Ingestion: must not drop. Aggregates: minutes to hours. Historical: rebuild whenever.',
    headline: 'Minutes, sometimes hours, of slack on every output — and this is the one group where the mistake is failing to use it.',
    body: [
      'Nobody makes a decision on a click count within seconds of the click. A marketing dashboard refreshed every five minutes is fine; a daily report tomorrow morning is fine. That is an enormous amount of slack, and the whole design should be built to spend it: batch aggressively, write in large chunks, and process on cheap capacity.',
      'The temptation is to build this like a request path — low latency, per-event processing, immediate consistency. That is how pipelines get built ten times more expensive than they need to be. Every second of latency you accept buys you a substantial reduction in cost and complexity, and here you have hundreds of them.',
      'The one thing with no slack is ingestion itself. The browser fires an event and moves on; if the endpoint is down or slow, that event is gone forever and no retry will recover it. So the accepting edge must be extremely available and extremely cheap, and it must do nothing but accept — every bit of processing pushed behind it.',
      'There is usually one narrow real-time carve-out: a "live visitors" counter that must be current within seconds. Treat it as a small separate approximate path, never as a reason to make the main pipeline real-time.',
    ],
    consequence:
      'Hours of slack means batch everything, and it means a wrong aggregate can be fixed by reprocessing rather than by a scramble — which is why the raw events must be kept. No slack on ingestion means the accepting edge does nothing but write to a durable log.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'Exact counts or approximate? Ask — it changes the storage design.',
        'What queries will people actually run? That decides the whole shape.',
        'What happens to an event if ingestion is down?',
      ],
      model: [
        'Assumptions: a large site, billions of events a day, global. Events are small — a page id, a user or session id, a timestamp, a referrer, a device, maybe 200 bytes. Queries come from dashboards and analysts, so query volume is low but query complexity is high. Two years of retention.',
        'First question, and it decides the storage design: must counts be exact, or is a small error acceptable? Because exact distinct-user counts require keeping every identifier, while approximate counts fit in kilobytes using a sketch. For revenue and conversions people want exact; for unique visitors, approximate is almost always fine. I will assume exact for money-related counters and approximate for distinct counts, and I would say so explicitly rather than picking one for everything.',
        'Second question: are the queries known in advance, or ad hoc? Because known queries mean I can precompute aggregates and serve them instantly, while ad hoc analysis means keeping the raw events and running real queries over them. I will assume both — precomputed rollups for dashboards, raw events retained for analysts — because that is what every real system converges on.',
        'Scope: accept events reliably, aggregate them, and serve both dashboard and ad hoc queries. Out of scope: the tracking client itself, identity resolution across devices, and privacy compliance mechanics — though I will note that retention and deletion requests are a real constraint on any design that keeps raw events for two years.',
      ],
      checklist: [
        'Asked exact versus approximate counts and split the answer by metric type',
        'Asked whether queries are known in advance or ad hoc',
        'Concluded both precomputed rollups and raw retention are needed',
        'Noted query volume is low but complexity is high',
        'Raised privacy and deletion as a real constraint on two-year retention',
        'Proposed a scope',
      ],
      tradeoffs: [
        {
          decision: 'Approximate distinct counts',
          cost: 'Unique-visitor numbers carry a small error and cannot be drilled into per user. In exchange they cost kilobytes instead of gigabytes and can be merged across any time window for free.',
        },
      ],
      sayThis:
        '"One question — exact or approximate? Because unique visitors as an exact count means storing every identifier, and as an approximation it is twelve kilobytes with about two percent error. I would go exact on anything touching money and approximate on distinct counts, and I would rather state that split than apply one answer to everything."',
      trap: 'Not asking about exactness. It is the question that decides your storage design here, and defaulting to exact for everything makes the system an order of magnitude more expensive for numbers nobody needs precisely.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write an event\'s life as a chain, and add the failure branches.',
      nudges: [
        'The event starts in a browser that may close at any moment.',
        'What happens when an aggregation job produces wrong numbers?',
        'What about events that arrive hours late?',
      ],
      model: [
        'Actors: the browser or app emitting events, the analyst querying, and the system — which decides what is a duplicate, which time bucket a late event belongs to, when an aggregate is final, and what to do with events that arrive after that.',
        'The chain: emitted by the client → accepted at the edge → written to a durable log → aggregated into rollups → queried → eventually expired.',
        'Failure branches. At emitted: the user closes the tab before the request completes, so the event is lost — mitigated by using a mechanism designed to survive page unload and by batching events client-side with a flush on unload. Some loss is unavoidable and should be acknowledged rather than pretended away. At emitted: the client retries after a timeout, producing duplicates — so each event carries a client-generated id, and deduplication happens downstream.',
        'At accepted: the ingestion endpoint is down. This is the branch with no recovery, which is why that endpoint must do almost nothing — accept, append to a log, return. No validation against a database, no enrichment, no synchronous processing. Anything that can fail is pushed behind the log.',
        'At aggregated: an event arrives three hours late, from a mobile client that was offline, after its hour has already been aggregated and reported. This is the defining problem of the group. The answer is that aggregates are not final — they are recomputed for a window of time, and dashboards must tolerate yesterday\'s number changing slightly. Alternatively, late events go into a correction bucket. Either way it is a design decision, not an edge case, and pretending events arrive in order is the most common failure here.',
        'At aggregated: the job has a bug and produces wrong numbers for a week. This is why raw events are retained — you fix the job and reprocess. A pipeline that only keeps aggregates has no way back, and that is the strongest argument for keeping raw data that exists.',
        'At aggregated: the job runs twice and double-counts, so aggregation must be idempotent — write the result for a time bucket as a replacement, not as an increment. That single choice makes reruns safe and is worth stating.',
        'At queried: someone asks for two years of data at full granularity and the query takes an hour — needs tiered granularity, with older data stored more coarsely.',
      ],
      checklist: [
        'Traced the event from browser to expiry',
        'Handled loss at emission and acknowledged some is unavoidable',
        'Handled client retries with an event id',
        'Made the ingestion edge do almost nothing, and said why',
        'Handled late-arriving events explicitly, with a stated policy',
        'Retained raw events so a buggy job can be fixed by reprocessing',
        'Made aggregation idempotent by replacing rather than incrementing',
        'Handled expensive historical queries with tiered granularity',
      ],
      trap: 'Assuming events arrive in order and on time. Mobile clients go offline and flush hours later. If your design has no answer for a late event, your numbers are wrong and you will not know.',
    },

    {
      id: 3,
      ask: 'Estimate ingestion rate, storage, and the aggregation reduction. Then finish "So the hard part here is ___."',
      nudges: [
        'Events per second — and what does that mean in bytes?',
        'Two years of raw events is how much?',
        'How much smaller is the aggregated data? That ratio is the design.',
      ],
      model: [
        'Ingestion: 10 billion events a day is roughly 115,000 per second average, and traffic is peaky, so call it 350,000 per second at peak. At 200 bytes an event that is 70 MB per second at peak — 2 TB of raw events a day.',
        'Raw storage: 2 TB a day for two years is about 1.5 PB. Compressed in a columnar format, realistically 150 to 300 TB, since this data compresses extremely well — repeated page ids, referrers and user agents. That is a real cost but an entirely ordinary one for object storage, and it is the price of being able to reprocess.',
        'Now the reduction, which is the number that changes my mind. Aggregating to hourly counts per page: if the site has a million distinct pages, that is 24 million rows a day instead of 10 billion. About 400 times smaller, and small enough that dashboard queries are instant. Roll up further to daily and it shrinks again.',
        'That ratio is the entire design. The raw data is expensive to store and impossible to query interactively; the aggregate is cheap and instant. So the system is fundamentally a funnel: keep everything, serve almost nothing from it directly.',
        'Query volume: perhaps 100 dashboard queries per second against rollups, and a handful of ad hoc analyst queries against raw data. The two have completely different profiles and should not share a system — one wants millisecond lookups on small tables, the other wants to scan terabytes.',
        'Compute: aggregating 10 billion events a day is a substantial batch job but a well-understood one, and it can run on interruptible capacity because of the slack.',
        'So the hard part here is ingestion reliability and the sheer volume reduction — accepting 350,000 events a second without losing them, and turning them into something a dashboard can query in milliseconds. Not query latency and not the aggregation logic.',
      ],
      checklist: [
        'Calculated events per second including peak',
        'Calculated raw storage over the retention period, with compression',
        'Calculated the aggregation reduction ratio — the key number',
        'Separated dashboard query volume from analyst query volume',
        'Noted compute can run on interruptible capacity',
        'Finished the sentence naming ingestion reliability and volume reduction',
      ],
      sayThis:
        '"Ten billion events a day, two terabytes raw, and hourly rollups per page are about four hundred times smaller. That ratio is the design: keep everything so I can reprocess when a job is wrong, but serve every dashboard from the rollup. So the hard part is accepting 350,000 events a second without losing them, and the reduction that follows."',
      trap: 'Estimating events per second and stopping. The number that shapes the design is the ratio between raw and aggregated volume, because it is what tells you the system is a funnel with two completely different storage tiers.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and be specific about the storage tiers.',
      nudges: [
        'What does the ingestion endpoint actually do? Keep it small.',
        'Where do raw events live, and where do aggregates live?',
        'How is the aggregation partitioned?',
      ],
      model: [
        'Ingestion edge: a tiny stateless service behind a CDN or load balancer that validates the shape of the event, appends it to a durable log, and returns. Nothing else — no database lookup, no enrichment, no synchronous processing. Justified directly by the Stage 2 branch: this is the one component whose failure loses data permanently, so it must have almost no dependencies and almost no reasons to fail. It should also be geographically distributed so clients hit a nearby endpoint, since a slow ingestion endpoint means dropped events from clients that navigate away.',
        'The log: a partitioned, durable, replayable stream — Kafka or an equivalent — partitioned by page id or site id so that events for the same key are ordered and so consumers can parallelise. Justified by 350,000 events a second and by the need to replay when a job is wrong. Retention of a few days on the stream, with everything also archived.',
        'Archive: raw events written from the stream into object storage in a columnar format, partitioned by date and hour. Justified by the reprocessing requirement and by the compression numbers — this is the cheapest possible place to keep 1.5 PB, and it is the safety net that makes every other part of the pipeline correctable.',
        'Aggregation: a stream processor computes rolling aggregates into time buckets, writing each bucket as a replacement rather than an increment so a rerun is idempotent. Justified by the Stage 2 double-run branch. Because the slack is hours, this can also be a batch job over the archive — and in practice a combination is common: a fast streaming path for near-real-time dashboards, and a batch recomputation over the archive that produces the authoritative numbers and corrects the streaming ones.',
        'Serving store: aggregates go into a columnar analytical database, keyed by dimension and time bucket. Small — millions of rows a day rather than billions — so dashboard queries are millisecond lookups. Justified by the 400x reduction: this is what makes the dashboard instant.',
        'Ad hoc queries run over the archive with a query engine that reads object storage directly. Deliberately separate from the dashboard store, justified by the two profiles being completely different — one wants small fast lookups, the other wants to scan terabytes occasionally.',
        'Tiered granularity: recent data kept hourly, older data rolled to daily, oldest to weekly. Justified by how people actually query — nobody asks for hourly data from eighteen months ago, and keeping it costs storage and slows queries.',
        'Late events: the streaming aggregation keeps a window open for a period, and the batch recomputation over the archive picks up anything later than that. So the batch path is not redundant, it is the correctness backstop for the streaming path.',
      ],
      checklist: [
        'Ingestion edge does almost nothing, justified by the no-recovery branch',
        'Ingestion geographically distributed',
        'Durable partitioned log, with the partition key stated',
        'Raw events archived in columnar format for reprocessing',
        'Aggregation writes replacements, not increments, so reruns are safe',
        'Streaming path for freshness plus batch path as the authoritative correction',
        'Separate serving store for dashboards, justified by the reduction ratio',
        'Ad hoc queries run against the archive, deliberately separate',
        'Tiered granularity over time',
        'Late events handled by the batch recomputation',
      ],
      tradeoffs: [
        {
          decision: 'Keeping raw events for two years',
          cost: 'Hundreds of terabytes of storage and a privacy surface that has to be managed. Buys the ability to fix any aggregation bug by reprocessing, which is the difference between a correctable system and a permanently wrong one.',
        },
        {
          decision: 'Streaming plus batch',
          cost: 'Two implementations of the same aggregation logic, which can disagree — a genuine maintenance burden. Buys freshness now and correctness later.',
        },
        {
          decision: 'Tiered granularity',
          cost: 'Old data cannot be re-examined at fine granularity from the rollups, though the archive still has it. Keeps the serving store small and fast.',
        },
      ],
      trap: 'Putting anything on the ingestion path that can fail — a database write, an enrichment lookup, a validation against another service. That endpoint has one job: accept and append. Everything else belongs behind the log where it can be retried.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'What happens when one page gets 90% of the traffic?',
        'Someone asks for exact unique visitors over a year. Walk through it.',
        'The aggregation job had a bug for a week. Now what?',
      ],
      model: [
        'Hard part one: skew. One page — a homepage, or a viral article — can be a large fraction of all events. Partitioning by page id puts all of it on one partition, which becomes a hot spot that limits the whole pipeline. The fix is to partition by page id plus a random suffix, spreading one page across N partitions, then sum the N partial aggregates at the end. Cost: reads must merge N partials instead of one, and N is a tuning parameter — a two-stage aggregation, which is more machinery than a single pass. This is the same pattern as a sharded counter, applied to a pipeline.',
        'Detecting skew automatically matters more than handling it, because the hot page changes daily. A count-min sketch over the stream identifies heavy hitters cheaply, and those keys get the suffix treatment automatically. Cost: a small amount of extra processing on every event to maintain the sketch, which is worth it because the alternative is a manual list that is always out of date.',
        'Hard part two: distinct counts, which are the genuinely hard aggregation. Counts are trivially additive — hourly counts sum to a daily count. Distinct users are not: you cannot add yesterday\'s uniques to today\'s, because the same person appears in both. Exact distinct counting over a year means keeping every identifier, which is the raw dataset all over again. HyperLogLog solves it: about 12 KB per sketch with roughly 2% error, and crucially the sketches merge — so an hourly sketch can be combined into a daily one, and daily into yearly, with no loss beyond the inherent error. Cost: about 2% error and no ability to drill into who those users were. For a "unique visitors" dashboard number that is exactly the right trade, and I would still offer exact counts for small, specific segments computed from the raw data on request.',
        'The wrong-job scenario, which is the real test of whether the design is sound: a bug produced wrong numbers for a week. Because raw events are retained and aggregation is idempotent — writing replacements per time bucket — the fix is to correct the job and reprocess that week, and the rollups are overwritten with correct values. That is only possible because of two decisions made earlier: keep the raw data, and make aggregation replace rather than increment. If either were different, the numbers would be permanently wrong. I would also version the aggregation logic so it is possible to say which version produced a given rollup. Cost: reprocessing consumes significant compute, and dashboards change retroactively, which needs to be communicated rather than surprising someone.',
        'Backpressure: if consumers fall behind, the log grows. Because the log has finite retention, a consumer down long enough loses data permanently — so the alert must be on consumer lag against retention, not just on lag. Cost: a monitoring requirement that is easy to overlook and expensive to discover.',
        'Privacy, raised unprompted because two years of raw event data makes it unavoidable: deletion requests must be satisfiable, which is genuinely hard when data is spread across immutable columnar files. Practical answers are storing identifiers in a form that can be broken — a keyed hash where destroying the key destroys the linkage — or periodically rewriting partitions. Cost: real engineering effort and a compaction process, and it is a requirement rather than a nice-to-have.',
        'Consistency per feature: the real-time dashboard is approximate and a few seconds behind. The hourly rollup is eventually consistent and may be corrected by the batch path. The daily authoritative numbers are exact for counts and approximate for distincts. Financial conversion counts are exact and reconciled against the transactional system, because a marketing number disagreeing with the revenue number is a conversation nobody wants.',
        'What I would monitor: ingestion success rate — the number that maps directly to lost data — consumer lag against retention, aggregation job duration and success, the count of late events arriving after their window closed, and a reconciliation check between rollups and a recomputation from raw for a sample of buckets.',
      ],
      checklist: [
        'Handled partition skew with key suffixing and two-stage aggregation',
        'Automatic heavy-hitter detection rather than a manual list',
        'Explained why distinct counts are not additive',
        'Chose an approximate sketch and named the error and the mergeability',
        'Walked through fixing a week of bad numbers, and tied it to earlier decisions',
        'Backpressure alerting on lag against retention',
        'Raised privacy and deletion unprompted, with a real mechanism',
        'Per-feature consistency answer',
        'Named what to monitor, including a reconciliation check',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Key suffixing for hot pages',
          cost: 'Two-stage aggregation and a tuning parameter. Without it, one viral page limits the throughput of the entire pipeline.',
        },
        {
          decision: 'HyperLogLog for distinct counts',
          cost: '~2% error and no drill-down to individuals. Makes a year of unique visitors answerable from kilobytes and mergeable across any window.',
        },
        {
          decision: 'Reprocessing to correct bad aggregates',
          cost: 'Significant compute, and historical dashboard numbers change retroactively. The alternative is being permanently wrong.',
        },
      ],
      sayThis:
        '"Aggregation writes a replacement per time bucket rather than incrementing, and I keep the raw events. Cost: hundreds of terabytes of storage and a real privacy surface. What it buys is that when a job turns out to have been wrong for a week — which happens — I fix the code and reprocess, and the numbers become correct. Without those two decisions they would be wrong forever."',
      trap: 'Treating distinct counts like ordinary counts. Counts add up; uniques do not. If your design sums hourly unique visitors into a daily figure, that number is wrong and it will be wrong in a way nobody notices for months.',
    },
  ],

  lifecycle: {
    caption:
      'An event, browser to dashboard. The late-arrival branch is the one that defines this group, and the "job was wrong" branch is what raw retention exists for.',
    states: [
      { id: 'em', label: 'Emitted', by: 'browser' },
      { id: 'acc', label: 'Accepted', by: 'edge' },
      { id: 'log', label: 'In the log', by: 'system' },
      { id: 'agg', label: 'Aggregated', by: 'job' },
      { id: 'qry', label: 'Queried', by: 'analyst' },
    ],
    failures: [
      { after: 'em', label: 'Tab closed mid-request', handling: 'unload-safe send and client batching — some loss is unavoidable' },
      { after: 'em', label: 'Client retries', handling: 'client-generated event id, deduplicated downstream' },
      { after: 'acc', label: 'Ingestion down', handling: 'no recovery — so the edge does nothing but append to the log' },
      { after: 'agg', label: 'Event arrives 3 hours late', handling: 'open window plus batch recomputation; aggregates are not final' },
      { after: 'agg', label: 'Job ran twice', handling: 'write replacements per bucket, never increments' },
      { after: 'agg', label: 'Job was buggy for a week', handling: 'fix and reprocess from the raw archive' },
      { after: 'qry', label: 'Two years at full granularity', handling: 'tiered granularity — hourly recent, daily older' },
    ],
  },

  architecture: {
    caption:
      'A funnel. Everything is kept cheaply so it can be reprocessed; almost nothing is served from it directly.',
    nodes: [
      { id: 'b', label: 'Browsers', kind: 'client', col: 0, row: 0 },
      { id: 'e', label: 'Ingest edge', sub: 'accept + append only', kind: 'service', col: 1, row: 0 },
      { id: 'log', label: 'Durable log', sub: 'partitioned, replayable', kind: 'queue', col: 2, row: 0 },
      { id: 'sp', label: 'Stream aggregator', sub: 'fresh, approximate', kind: 'service', col: 3, row: 0 },
      { id: 'arc', label: 'Raw archive', sub: 'columnar, 2 years', kind: 'store', col: 3, row: 1 },
      { id: 'bt', label: 'Batch recompute', sub: 'authoritative', kind: 'service', col: 4, row: 1 },
      { id: 'roll', label: 'Rollup store', sub: 'small, fast', kind: 'store', col: 4, row: 0 },
      { id: 'd', label: 'Dashboards', kind: 'client', col: 5, row: 0 },
      { id: 'an', label: 'Analysts', sub: 'ad hoc over raw', kind: 'client', col: 5, row: 1 },
    ],
    edges: [
      { from: 'b', to: 'e' },
      { from: 'e', to: 'log' },
      { from: 'log', to: 'sp' },
      { from: 'log', to: 'arc' },
      { from: 'sp', to: 'roll' },
      { from: 'arc', to: 'bt' },
      { from: 'bt', to: 'roll', label: 'corrects' },
      { from: 'd', to: 'roll' },
      { from: 'an', to: 'arc' },
    ],
  },

  numbers: {
    caption: 'The reduction ratio is the design.',
    items: [
      { label: 'Events ingested', value: 350000, display: '~350,000 / sec at peak', tone: 'accent' },
      { label: 'Raw data per day', value: 2000, display: '~2 TB / day', tone: 'muted' },
      { label: 'Hourly rollup rows per day', value: 5, display: '~24M rows — ~400x smaller', tone: 'muted' },
    ],
    note: 'Raw data is impossible to query interactively and essential to keep. Rollups are instant and 400x smaller. So the hard part is ingestion reliability and that reduction — everything else follows from the funnel shape.',
  },

  flow: {
    scenario: 'queue-drain',
    caption: 'Producers are faster than consumers, and the log absorbs it. With finite retention, the alert has to be on lag against retention — past that point, data is gone.',
  },

  compare: {
    caption: 'Streaming or batch. Real pipelines end up with both, and it is worth being able to say why.',
    a: {
      title: 'Stream processing',
      points: [
        'Aggregates are seconds fresh, which is what a live dashboard needs.',
        'Late events are hard — windows must close eventually, and something arrives after.',
        'A bug produces wrong numbers continuously until you notice.',
        'Runs continuously, so it costs continuously.',
      ],
    },
    b: {
      title: 'Batch over the archive',
      points: [
        'Sees all the data including late arrivals, so it is the correct answer.',
        'Trivially rerunnable — fix the code, reprocess, numbers become right.',
        'Hours behind, which is useless for anything live.',
        'Runs on interruptible capacity because nothing is waiting on it.',
      ],
    },
    verdict:
      'Both, with clear roles: streaming for freshness, batch as the authoritative correction that overwrites it. The cost is maintaining the same aggregation logic twice, which is a genuine burden — but the slack budget in this group makes batch correctness available, and refusing to use it is how pipelines end up permanently and quietly wrong.',
  },

  followUps: [
    'kill-queue',
    'scale-hot-key',
    'consistency-retry',
    'choice-queue',
    'cost-monthly',
    'scope-privacy',
    'ops-alert-first',
    'scale-10x',
  ],
}
