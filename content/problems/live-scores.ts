import type { Problem } from '@/lib/types'

export const LIVE_SCORES: Problem = {
  slug: 'live-scores',
  title: 'Live score push',
  group: 'live-push',
  difficulty: 'core',
  concepts: ['realtime-transports', 'caching', 'message-queues', 'load-balancing', 'consistent-hashing'],
  prompt:
    'Design a service that pushes live sports scores to millions of people watching the same match at the same time. A score update should reach everyone within a second or two.',

  slack: {
    budget: 'Delivery: 1–2 seconds. Connection setup: seconds. Reconnect: seconds.',
    headline: 'A second of slack, and it is real — but it is bounded by something outside your system: the person in the next room shouting at their television.',
    body: [
      'The delivery budget here is not set by engineering taste, it is set by the physical world. If a neighbour with a TV feed shouts before your app updates, the product has failed in a way users notice viscerally. Broadcast feeds themselves run several seconds behind live, which gives you a little room, but not much. Call it one to two seconds end to end.',
      'That is genuinely more slack than it first appears, and it is worth spending deliberately. It means you do not need microsecond delivery, you can batch updates into small windows, and you can accept a message taking a couple of hundred milliseconds to traverse a fan-out layer.',
      'Connection setup has seconds of slack — nobody minds a moment on opening the app. This matters more than it sounds, because it is what lets you stagger reconnections after a deploy instead of accepting a million simultaneous handshakes.',
      'Historical data, statistics and commentary have minutes of slack and should be plain cached HTTP requests, not pushed. Mixing them into the live path is the most common way this design gets over-built.',
    ],
    consequence:
      'One to two seconds means you can batch updates into ~250 ms windows, which cuts fan-out work dramatically for a delay nobody perceives. And it means the live channel should carry only what is actually live — everything else is a cacheable request.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'What is the traffic shape for a sports app? It is not uniform.',
        'Does every viewer see the same data, or personalised data? That changes everything.',
        'How many distinct matches are live at once?',
      ],
      model: [
        'Assumptions: global, mobile-first. Traffic is wildly spiky and predictable — nothing happens for hours, then ten million people connect for one match final. Updates per match are infrequent: a football match has a few dozen meaningful events across ninety minutes, not thousands. Score data itself is tiny, a few hundred bytes.',
        'First question, and it is the one that decides whether this is easy or hard: does everyone watching a match see identical data, or is it personalised — their team highlighted, their bets, their notifications? Because identical data means one message fans out unchanged to millions and can be cached and broadcast; personalised means a per-user computation for every update, which is a completely different system. I will assume identical per match, with personalisation layered on the client.',
        'Second question: is the score feed something we own, or does it come from an external provider? Because an external provider means an ingestion path with deduplication, corrections and their outages, and provider corrections — a goal disallowed after review — are a real and interesting requirement. I will assume external providers.',
        'Scope: ingest score events, push them to everyone watching a match, and handle reconnection and catch-up. Out of scope: video streaming, betting, and the statistics pages, which are ordinary cached reads.',
      ],
      checklist: [
        'Described the traffic as spiky and predictable, not steady',
        'Noted that updates per match are infrequent but audience is enormous',
        'Asked identical-versus-personalised and named the consequence',
        'Asked where the feed comes from, and raised corrections as a requirement',
        'Proposed scope and excluded statistics and video',
      ],
      tradeoffs: [
        {
          decision: 'Identical payload per match, personalisation on the client',
          cost: 'Some features that would be easier server-side move to the client. In exchange one message serves millions of viewers unchanged, which is the entire reason this is affordable.',
        },
      ],
      sayThis:
        '"Assuming everyone watching a match gets the same payload, with personalisation on the client. That is the assumption the design lives or dies on — identical data means one message fans out unchanged to ten million people; personalised means ten million computations per goal. And the feed comes from an external provider, so I need to handle corrections."',
      trap: 'Assuming personalised payloads without saying so, then designing a per-user pipeline for data that is identical for everyone. State the assumption; it is the biggest lever in this problem.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write the life of a score event as a chain, and add the failure branches.',
      nudges: [
        'Follow the event from the provider to a phone.',
        'What happens to someone whose train goes into a tunnel?',
        'What if the provider sends the same goal twice, or takes one back?',
      ],
      model: [
        'Actors: the viewer, the data provider, and the system — which decides what is a duplicate, what is a correction, which connections care about which match, and what a reconnecting client has missed.',
        'The chain: event received from provider → validated and deduplicated → stored as the current match state → published to the fan-out layer → delivered to connected clients → rendered.',
        'Failure branches. At received: the provider sends the same event twice, so every event needs a provider event id and deduplication — otherwise the score goes to 2-1 and then 3-1. At received: the provider sends a correction, a goal disallowed after review. This is the branch that makes the problem interesting: it means updates are not append-only, so clients must be able to handle a value going backwards, and I should push full current state rather than increments. Pushing "score is now 1-1" is idempotent and self-correcting; pushing "add one goal" is not, and any missed or duplicated message corrupts the display permanently. That is a design decision, and it belongs in the lifecycle.',
        'At received: the provider goes down entirely — the app should show the last known state with a timestamp rather than a blank or a stale-looking score presented as live. At published: the fan-out layer is behind, so the score is late; because the payload is full state, a late message is still correct, just late.',
        'At delivered: the client is disconnected — a tunnel, an app backgrounded. They must reconnect and catch up, and because we push full current state, catching up is simply fetching the current state, which is the same cached endpoint everyone else uses. That is a large simplification and it falls directly out of the full-state decision.',
        'At delivered: a deploy restarts every server, so millions reconnect at once. Without jittered backoff this is a self-inflicted denial of service that is worse than the traffic being served.',
        'One the system owns silently: when a match ends, ten million connections should be released rather than held open for hours by clients that have stopped caring.',
      ],
      checklist: [
        'Named the system as an actor with real decisions',
        'Wrote the event lifecycle from provider to phone',
        'Handled duplicate events from the provider with an event id',
        'Handled corrections, and chose full-state pushes because of them',
        'Handled provider outage — last known state with a timestamp',
        'Handled client reconnect and catch-up, simplified by full-state',
        'Handled the deploy reconnection storm',
        'Handled connection cleanup when a match ends',
      ],
      trap: 'Designing incremental updates ("goal scored, add one"). One missed message and the client is permanently wrong, with no way to notice. Full current state makes every message idempotent and makes catch-up free.',
    },

    {
      id: 3,
      ask: 'Estimate concurrent connections, message rate, and total fan-out volume. Then finish "So the hard part here is ___."',
      nudges: [
        'How many events per match, really? Count them.',
        'Multiply events by viewers. That is the real number.',
        'How much memory does a connection cost?',
      ],
      model: [
        'Concurrency: a major final, 10 million simultaneous viewers. That is the headline number and it is about connections, not requests per second — which is a different capacity model from everything else in this app.',
        'Message rate from the provider: a football match generates maybe 100 meaningful events over 90 minutes, so roughly one event every minute. That is an absurdly low input rate, and noticing it matters.',
        'Fan-out volume: 100 events times 10 million viewers is a billion message deliveries per match. But they are not spread evenly — a goal means 10 million deliveries in one or two seconds, so the instantaneous fan-out rate is around 5 to 10 million messages per second, in bursts, separated by minutes of near silence.',
        'That contrast is the number that changes my mind. The input rate is one message a minute; the output rate is ten million a second in a burst. There is no throughput problem on ingestion at all — the entire system exists to multiply one tiny message across ten million sockets, quickly, and then be idle.',
        'Connections: at roughly 10 KB of memory per connection including buffers, 10 million connections is about 100 GB spread across the fleet. At, say, 100,000 connections per server that is 100 servers — a real but manageable number, and it is a memory and file-descriptor problem rather than a CPU one.',
        'Bandwidth: 300 bytes per update times 10 million is 3 GB per goal, delivered in a couple of seconds. Noticeable, and it is why the payload staying small actually matters.',
        'So the hard part here is burst fan-out, not ingestion, storage or throughput in the normal sense. And the second hard part is connection management: holding ten million idle connections cheaply and surviving the moment they all reconnect.',
      ],
      checklist: [
        'Stated concurrent connections as the primary capacity number',
        'Counted events per match and noticed the input rate is tiny',
        'Multiplied to get fan-out volume, and noted it arrives in bursts',
        'Estimated memory per connection and derived a server count',
        'Estimated burst bandwidth per event',
        'Finished the sentence: burst fan-out and connection management',
      ],
      sayThis:
        '"The provider sends me one message a minute. I have to turn that into ten million deliveries inside two seconds, then go quiet again. So the hard part here is burst fan-out and holding ten million mostly-idle connections — there is no ingestion problem at all, and saying that stops me designing one."',
      trap: 'Designing a high-throughput ingestion pipeline. The input is one message a minute. Every bit of engineering belongs on the output side.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and pick a transport with a reason.',
      nudges: [
        'Which transport, and why not the other two?',
        'How does a server know which of its connections care about this match?',
        'What happens between a message arriving and it hitting ten million sockets?',
      ],
      model: [
        'Transport: server-sent events. Data flows one way — server to client — and SSE gives me automatic reconnection with a last-event-id, which is exactly the catch-up mechanism I need, over plain HTTP that every proxy and load balancer already understands. WebSockets would work but I would be building reconnection and heartbeats myself for a bidirectional channel I do not need. Polling would mean ten million clients asking every two seconds, which is five million requests a second of mostly-unchanged responses — though I would note that polling a heavily cached endpoint is a genuinely reasonable fallback and is what I would ship first if I had a week. Justified by the Stage 1 assumption that the client only receives.',
        'Ingestion: a small service receiving provider events, deduplicating by provider event id, applying corrections, and writing the current match state. Tiny, because the input rate is one message a minute — and I would say out loud that this box does not need to scale.',
        'Fan-out: connection servers each hold a slice of the connections. When match state changes, the update is published once to a pub/sub layer, and every connection server subscribed to that match writes it to its connected sockets. The key decision is that servers subscribe per match rather than per user — so one published message becomes 100 server deliveries rather than 10 million pub/sub messages. That distinction is the whole design: the multiplication happens at the last hop, on the machine that already holds the sockets.',
        'Connection routing: clients are routed to connection servers by match, using consistent hashing, so viewers of the same match cluster onto the same servers. That maximises the value of each pub/sub delivery and keeps subscription counts low. Cost: a very popular match concentrates load onto its servers, so hot matches need to be spread across several, which means a small amount of routing intelligence rather than a pure hash.',
        'Current state cache: the current state of every live match sits in a cache and is also served over a plain cached HTTP endpoint. This does triple duty — it is what a newly connected client fetches to initialise, what a reconnecting client fetches to catch up, and the fallback if push fails entirely. Justified by the reconnection branch in Stage 2, and it is the highest-leverage box in the design because everyone wants identical bytes.',
        'Batching: updates are collected into ~250 ms windows before fan-out. At one event a minute that rarely matters, but during a chaotic period — a goal, then a VAR check, then a correction — it collapses several updates into one delivery. Justified directly by the one-to-two-second slack budget: 250 ms is invisible to a human and it cuts fan-out work meaningfully.',
      ],
      checklist: [
        'Chose a transport and rejected the other two with reasons',
        'Noted polling against a cached endpoint is a legitimate simpler fallback',
        'Ingestion service deliberately kept small, justified by the input rate',
        'Pub/sub subscription is per match, not per user',
        'Multiplication happens on the connection server that already holds the sockets',
        'Connections routed by match so viewers cluster',
        'Current-state cache serves initialisation, catch-up and fallback',
        'Batching window justified by the slack budget',
      ],
      tradeoffs: [
        {
          decision: 'SSE over WebSockets',
          cost: 'One-directional, so any future client-to-server feature needs a separate channel. Buys automatic reconnect and plain-HTTP compatibility.',
        },
        {
          decision: 'Routing connections by match',
          cost: 'A hugely popular match concentrates onto specific servers, so hot matches need spreading. Without it, every server subscribes to every match.',
        },
        {
          decision: '250 ms batching window',
          cost: 'A quarter second of added delay, which no human perceives, in exchange for collapsing bursts of updates into single deliveries.',
        },
      ],
      trap: 'Publishing one pub/sub message per connected user. Ten million pub/sub messages per goal will crush any broker. Publish once per match; multiply on the machine that already holds the sockets.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'Ten million people connect in the ninety seconds before kick-off. Walk through it.',
        'You need to deploy during a match. What happens?',
        'What does a slow client do to your server?',
      ],
      model: [
        'Hard part one: the connection storm. Traffic is not just spiky, it is scheduled — ten million people open the app in the two minutes before kick-off, so the peak is connection establishment, not steady-state delivery. Each connection costs a TLS handshake and an authentication check, and doing ten million of those in 120 seconds is roughly 80,000 per second of the most expensive operation in the system. Defences: terminate TLS at the edge with session resumption so returning clients skip the expensive handshake; keep the authentication check on connect as cheap as possible, ideally validating a token without a database call; and pre-scale, since kick-off time is known in advance, which is a luxury most systems do not have and should be used. Cost: pre-scaling means paying for idle capacity ahead of the match, which is the correct trade for a scheduled peak.',
        'Deploys during a match are the operational nightmare, because restarting a server drops its connections and they all reconnect at once. Roll slowly, a small percentage of the fleet at a time, and have clients reconnect with exponential backoff and full jitter so the returning herd is spread across tens of seconds instead of arriving together. Better still, do not deploy during a match — which is a real and legitimate answer, and saying it shows operational judgement rather than avoidance. Cost: a deployment freeze window that constrains the team.',
        'Slow clients are the subtle failure. A client on a bad connection cannot consume messages as fast as you write them, so per-connection buffers grow, and with enough slow clients the server runs out of memory and takes down everyone on it, including the healthy connections. The fix is a bounded buffer per connection, and when it is full, drop the client rather than the server. Because we push full current state, a dropped client reconnects and fetches current state, losing nothing — which is another benefit of that Stage 2 decision paying off. Cost: users on genuinely bad connections get disconnected more often, and their experience becomes reconnect-and-refresh, which is acceptable and honest.',
        'Hard part two: the hot match. Consistent hashing by match id clusters viewers usefully, but one match can be ten times the size of every other match combined. Spread a hot match across many connection servers by hashing on match id plus a bucket, so the match becomes N logical channels, each with its own set of servers. Cost: the fan-out layer publishes to N channels instead of one, which is a small multiplier and vastly better than one overloaded server.',
        'Provider failure and corrections, revisited as an operational matter: if the provider stops, the app shows last known state with a visible timestamp — never a stale score presented as current, because a confidently wrong score is worse than an honest "last updated 3 minutes ago". If a correction arrives, full-state pushes make it self-healing. Cost: a UI requirement, and the discipline to have designed for it.',
        'Multi-region: connection servers run in every region so viewers connect locally, and the score event is replicated to each region\'s pub/sub layer. The event is tiny, so cross-region replication is cheap and adds around 100 ms, which fits inside the budget. Cost: an extra hop for regions far from ingestion, and slightly different delivery times by region — which nobody notices at this granularity, but which I would state rather than pretend is uniform.',
        'What I would monitor: connections per server and their distribution, delivery latency from provider receipt to socket write at p99, reconnection rate, buffer-full disconnects, and pub/sub publish latency. Reconnection rate spiking is the earliest sign something is wrong, usually before delivery latency moves.',
      ],
      checklist: [
        'Addressed the scheduled connection storm and used its predictability',
        'TLS termination and session resumption to cut handshake cost',
        'Deploy strategy — slow roll, jittered reconnect, or a freeze window',
        'Bounded per-connection buffers, dropping slow clients rather than the server',
        'Connected that safely to the full-state push decision',
        'Spread a hot match across multiple logical channels',
        'Honest degradation when the provider fails',
        'Multi-region with the latency budget checked against it',
        'Named what to monitor, and the leading indicator',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Pre-scaling for a known kick-off',
          cost: 'Paying for idle capacity ahead of the peak. Correct for a scheduled event, since the alternative is failing during the only minutes that matter.',
        },
        {
          decision: 'Dropping slow clients when buffers fill',
          cost: 'Users on bad connections reconnect more often. Prevents a handful of slow clients from taking down every connection on that server.',
        },
        {
          decision: 'Cross-region replication of events',
          cost: '~100 ms extra for distant regions and slightly uneven delivery times. Fits inside a 1–2 second budget comfortably.',
        },
      ],
      sayThis:
        '"I push full current state rather than increments. Cost: slightly larger messages. What I get is that every message is idempotent, a correction works automatically, and a reconnecting client just fetches current state from the same cached endpoint everyone else uses — so catch-up needs no special machinery at all."',
      trap: 'Focusing on message delivery and ignoring connection establishment. The peak here is ten million people connecting in two minutes before kick-off, and a handshake is far more expensive than a message.',
    },
  ],

  lifecycle: {
    caption:
      'A score event, provider to phone. The correction branch is what forces full-state pushes — and that one decision simplifies three other branches.',
    states: [
      { id: 'recv', label: 'Received', by: 'provider' },
      { id: 'dedup', label: 'Deduplicated', by: 'system' },
      { id: 'state', label: 'State updated', by: 'system' },
      { id: 'pub', label: 'Published', by: 'fan-out' },
      { id: 'del', label: 'Delivered', by: 'connection server' },
    ],
    failures: [
      { after: 'recv', label: 'Duplicate event', handling: 'deduplicate on provider event id' },
      { after: 'recv', label: 'Provider goes down', handling: 'show last known state with a visible timestamp' },
      { after: 'state', label: 'Correction — goal disallowed', handling: 'push full current state, so it self-heals' },
      { after: 'del', label: 'Client in a tunnel', handling: 'reconnect with last-event-id, fetch current state to catch up' },
      { after: 'del', label: 'Deploy drops everyone', handling: 'slow roll plus jittered client backoff' },
      { after: 'del', label: 'Slow client fills its buffer', handling: 'bounded buffer — drop the client, never the server' },
    ],
  },

  architecture: {
    caption:
      'One message in, ten million out. The multiplication happens on the connection servers, which already hold the sockets — never in the pub/sub layer.',
    nodes: [
      { id: 'p', label: 'Score provider', kind: 'external', col: 0, row: 0 },
      { id: 'ing', label: 'Ingest svc', sub: 'dedupe, corrections', kind: 'service', col: 1, row: 0 },
      { id: 'st', label: 'Match state', sub: 'current, cached', kind: 'cache', col: 2, row: 0 },
      { id: 'ps', label: 'Pub/sub', sub: 'one channel per match', kind: 'queue', col: 3, row: 0 },
      { id: 'c1', label: 'Conn server', sub: '100k sockets', kind: 'service', col: 4, row: 0 },
      { id: 'c2', label: 'Conn server', sub: '100k sockets', kind: 'service', col: 4, row: 1 },
      { id: 'v', label: 'Viewers', sub: 'SSE', kind: 'client', col: 3, row: 2 },
      { id: 'http', label: 'Cached HTTP', sub: 'init + catch-up', kind: 'cache', col: 2, row: 2 },
    ],
    edges: [
      { from: 'p', to: 'ing' },
      { from: 'ing', to: 'st' },
      { from: 'st', to: 'ps' },
      { from: 'ps', to: 'c1' },
      { from: 'ps', to: 'c2' },
      { from: 'c1', to: 'v' },
      { from: 'c2', to: 'v' },
      { from: 'v', to: 'http', label: 'on connect', dashed: true },
    ],
  },

  numbers: {
    caption: 'One message a minute in. Ten million deliveries in two seconds out.',
    items: [
      { label: 'Provider events', value: 1, display: '~1 / minute', tone: 'muted' },
      { label: 'Concurrent connections', value: 10000000, display: '10,000,000', tone: 'accent' },
      { label: 'Deliveries in the 2s after a goal', value: 10000000, display: '~5–10M / sec, in a burst', tone: 'bad' },
    ],
    note: 'There is no ingestion problem here at all. So the hard part is burst fan-out and holding ten million mostly-idle connections — including the moment they all reconnect at once.',
  },

  flow: {
    scenario: 'fan-out-write',
    caption: 'Publish once per match; each connection server multiplies it across the sockets it already holds. Publishing per user would be ten million broker messages per goal.',
  },

  compare: {
    caption: 'What you put in the message. This choice quietly decides how hard three other problems are.',
    a: {
      title: 'Push full current state',
      points: [
        'Every message is idempotent — a duplicate changes nothing.',
        'A correction just works; the next message overwrites the wrong value.',
        'Catch-up after a disconnect is simply "fetch current state" — no replay log.',
        'Slightly larger messages, which at 300 bytes is irrelevant.',
      ],
    },
    b: {
      title: 'Push increments ("goal scored")',
      points: [
        'Smallest possible payload.',
        'One missed message and the client is permanently wrong, silently.',
        'Corrections need an explicit undo message and ordering guarantees.',
        'Catch-up needs a replay log with per-client positions.',
      ],
    },
    verdict:
      'Full current state. The payload difference is meaningless at this size, and it removes the need for ordering guarantees, a replay log, and correction handling — three subsystems deleted by one decision. When state is small, always push state.',
  },

  followUps: [
    'scale-10x',
    'kill-region',
    'ops-deploy',
    'choice-queue',
    'scale-sale-day',
    'ops-alert-first',
    'kill-queue',
    'cost-monthly',
  ],
}
