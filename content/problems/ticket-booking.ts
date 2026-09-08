import type { Problem } from '@/lib/types'

export const TICKET_BOOKING: Problem = {
  slug: 'ticket-booking',
  title: 'Ticket booking',
  group: 'contested',
  difficulty: 'core',
  concepts: [
    'consistency-models',
    'sql-vs-nosql',
    'caching',
    'idempotency',
    'distributed-transactions',
    'transactions-and-locking',
    'cap-pacelc',
    'connection-pooling',
  ],
  prompt:
    'Design a system for booking seats at events. Seats are specific and numbered. Popular events sell out in under a minute, with far more people trying than there are seats. Nobody may ever end up with a seat somebody else also has.',

  slack: {
    budget: 'Browsing: minutes. Holding a seat: minutes. The commit: zero.',
    headline: 'Almost everything here has generous slack — except one operation, which has none at all, and that one operation is the entire problem.',
    body: [
      'Browsing has minutes of slack. The event listing, the seat map, the price — all of it can be cached hard and served stale, and it must be, because at on-sale time a hundred thousand people load that page in ten seconds. A seat map that is five seconds out of date is fine; someone clicks a seat that was just taken and gets told so at the next step. That is a normal, acceptable experience.',
      'The hold has minutes of slack by design — you deliberately give the user 10 minutes to enter card details, and that window is itself a design decision about how much inventory you are willing to make unavailable to other people.',
      'The commit has zero slack and zero tolerance for being wrong. At the instant a seat is assigned, the decision must be exact, serialised, and durable. There is no eventual consistency available here, no cache, no approximation. If two commits succeed for one seat, you have sold something twice and no amount of speed makes up for it.',
      'Everything after — the confirmation email, the ticket PDF, the analytics, the reconciliation with the venue — has minutes or hours of slack and belongs on a queue.',
    ],
    consequence:
      'The slack profile splits the system cleanly in two: a massively cacheable read tier that can be stale, and a small, strictly serialised commit path that cannot. The skill is keeping the second one small — most designs fail by letting the strict path grow.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'What is the one question that decides whether you need locking at all?',
        'Assigned seats versus general admission — does it change the design?',
        'What is the traffic shape? It is not steady.',
      ],
      model: [
        'Assumptions: global, but each event belongs to one venue with a fixed, known number of seats — typically thousands, not millions. Traffic is extremely spiky: an event goes on sale at a fixed moment and receives its entire year of demand in about sixty seconds. Payments happen through a provider. Reads massively outnumber writes even during a sale, because most people are looking rather than committing.',
        'First question, and it is the one that decides whether I need any locking at all: are seats specific and numbered, or is it general admission where only the count matters? Because numbered seats mean the contended resource is one row per seat and uniqueness is naturally enforceable; general admission means a single counter that everyone contends on, which is a harder concurrency problem. I will assume numbered seats, because it is the more common product and the more interesting design.',
        'Second question: do we hold a seat while the user pays, and for how long? Because a hold is inventory made unavailable to everybody else, so the window length is a direct business tradeoff, and it introduces expiry, which is a whole subsystem. I will assume yes, 10 minutes.',
        'Scope: browse events and seat availability, hold a seat, pay, confirm. Out of scope: pricing and dynamic pricing, seat recommendations, refunds and resale, and fraud — though I will note that a sale like this attracts bots, and the queueing mechanism is partly an anti-bot control.',
      ],
      checklist: [
        'Stated the traffic shape as extremely spiky, not steady',
        'Asked numbered seats versus general admission and said why it changes the concurrency model',
        'Asked about the hold and its duration, and framed it as a business tradeoff',
        'Noted that reads dominate even during a sale',
        'Proposed a scope and excluded pricing, refunds and resale',
      ],
      tradeoffs: [
        {
          decision: 'Holding seats for 10 minutes',
          cost: 'Inventory is unavailable to other buyers while someone dithers, and holds that are abandoned must expire reliably or the event shows as sold out while seats sit unsold.',
        },
      ],
      sayThis:
        '"Assuming a fixed seat count per event, and traffic that arrives entirely in the first sixty seconds. One question — are seats numbered, or is it general admission? Numbered means each seat is its own contended row and a unique constraint does most of the work. General admission means one counter everyone fights over, which is harder. I will assume numbered."',
      trap: 'Asking about the seat map UI or the ticket format. Neither changes a box. Whether seats are numbered, and whether there is a hold, both do.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a seat\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'Follow the seat, not the user. The seat is the contended thing.',
        'What expires, and who expires it?',
        'What happens if payment succeeds but the confirmation write fails?',
      ],
      model: [
        'Actors: the buyer, the event organiser who defines inventory, the payment provider, and the system — which decides who gets into the sale, when a hold expires, and what to do about a payment that lands after a hold has already lapsed.',
        'Track the seat, not the user, because the seat is the contested resource. Its life: available → held → paid → confirmed → possibly released back to available.',
        'Failure branches, which are the design. At held: two users try to hold the same seat in the same millisecond — exactly one must succeed, enforced by a conditional update or a unique constraint, never by check-then-write. At held: the user abandons the checkout — the hold must expire, and the mechanism matters: a background job sweeping for expired holds can lag, so I prefer holds carrying an expiry timestamp that is checked on read, so an expired hold is effectively released instantly even if the sweeper is behind. At held: the hold expires while the user is mid-payment, which is the nastiest branch — their money is about to move for a seat they no longer have.',
        'At paid: the payment succeeds and the confirmation write fails. This is the classic distributed transaction failure, and the answer is ordering plus reconciliation — authorise the payment while the hold is valid, confirm the seat, then capture. If the confirmation cannot be written, void the authorisation, which is far cheaper and cleaner than refunding a completed charge.',
        'At paid: the payment provider times out and the client retries — without an idempotency key that is two charges. At confirmed: the event is cancelled, so every seat needs a bulk release-and-refund path.',
        'And one the system owns silently: a user who holds seats, never pays, and does it repeatedly at scale is a bot denying inventory to real buyers. Holds need per-user limits, which is a design requirement, not a policy afterthought.',
      ],
      checklist: [
        'Tracked the seat rather than the user',
        'Wrote the seat lifecycle as a chain',
        'Handled two simultaneous holds with a conditional write, not check-then-write',
        'Handled hold expiry, and preferred timestamp-checked expiry over a sweeper alone',
        'Handled the hold expiring during payment',
        'Handled payment succeeding while confirmation fails, with ordering and reconciliation',
        'Handled duplicate payment attempts via idempotency',
        'Noted the bot-holding-inventory problem',
      ],
      trap: 'Following the user\'s journey instead of the seat\'s. The user\'s journey is a happy path with a payment step. The seat\'s life is where every contention failure lives.',
    },

    {
      id: 3,
      ask: 'Estimate the traffic shape, the write rate on the contended path, and storage. Then finish "So the hard part here is ___."',
      nudges: [
        'What does the traffic graph look like in the first minute?',
        'How many seats actually exist? Compare that to how many people want them.',
        'What fraction of requests are reads?',
      ],
      model: [
        'The shape is the story. A 50,000-seat event with 500,000 people trying to buy in the first minute. That is not "high traffic", it is a wall — roughly 100,000 requests per second arriving in a burst against a system whose steady state is a few hundred.',
        'But look at what those requests are. The overwhelming majority are page loads and availability checks — reads. Actual hold attempts might be 20,000 per second at the very start, and successful holds are capped by physics at 50,000 total, ever, for this event. The contended write path processes at most 50,000 operations in the entire sale.',
        'That is the number that changes my mind. The write path is not a throughput problem at all — 50,000 writes total is nothing. It is a contention problem: 20,000 attempts a second aimed at a few thousand rows that are rapidly being taken. Almost every one of those attempts must fail, quickly and cheaply.',
        'Reads: at 100,000 requests a second of mostly identical data — the event page, the seat map — this is an almost perfect caching problem, because everyone wants exactly the same bytes at exactly the same moment.',
        'Storage: 50,000 seats per event at a couple of hundred bytes is 10 MB per event. Even a hundred thousand events a year is a few hundred gigabytes. Storage is not a consideration.',
        'So the hard part here is contention, not volume — and specifically, rejecting the 90% of attempts that must fail without letting them touch the database at all. The second hard part is that the small part which must be exact stays exact under that pressure.',
      ],
      checklist: [
        'Described the traffic as a burst, not a rate',
        'Separated read volume from contended write volume',
        'Noticed total successful writes are bounded by the seat count',
        'Concluded this is a contention problem, not a throughput problem',
        'Noted storage is irrelevant here',
        'Finished the sentence naming contention and cheap rejection',
      ],
      sayThis:
        '"A hundred thousand requests a second, but only fifty thousand seats exist — so the contended write path handles fifty thousand operations in total, ever. That is nothing. So the hard part here is not throughput, it is contention: rejecting the ninety-odd percent of hold attempts that must fail, cheaply, before they reach the database."',
      trap: 'Reporting 100,000 requests per second and designing a massively sharded write tier. Look at what those requests are — almost all reads, and the writes are bounded by the seat count. The maths says the write path is small.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and be exact about how a seat is actually claimed.',
      nudges: [
        'Which parts can be stale, and which cannot? Draw that line first.',
        'What exactly makes it impossible for two people to get one seat?',
        'How do you stop 100,000 people hitting the database at once?',
      ],
      model: [
        'The first move is drawing the line between the stale tier and the exact tier, and keeping the exact tier as small as possible. Everything about browsing — event pages, seat maps, prices — is served from a CDN and a cache with a short TTL. Justified by the read numbers: everyone requests identical bytes simultaneously, so the hit rate is near perfect. The seat map being a few seconds stale is fine and I would say so explicitly, because a user clicking a taken seat is a normal, cheap rejection.',
        'A waiting room in front of the sale. At on-sale, users are given a queue position and admitted at a controlled rate. This is the single most effective component in the design: it converts an uncontrolled 100,000-per-second burst into a steady, known rate the real system can serve, it makes the experience honest — a position and an estimate rather than an error — and it is also the main anti-bot control. Justified directly by the burst shape from Stage 3.',
        'The claim itself, which must be exact. Seats live as rows in a relational database, one row per seat, with a status and a hold expiry. Claiming is a single conditional update: set this seat to held by me with an expiry, where the seat is currently available or its hold has expired. If it updates one row, I have it; if zero rows, someone else does. That one statement is the entire correctness guarantee — it is atomic in the database, so there is no window between checking and taking. I would say plainly that I am not doing a read then a write in application code, because that is the race itself.',
        'Justification for a relational database here: the contended write volume is tiny — bounded by the seat count — so I do not need a distributed store, and I do need a real transaction to tie the seat to the order. This is a case where the numbers permit the simple, correct choice, and I would say so rather than reaching for something distributed.',
        'Partitioning by event: seats for one event live together, so a hot event is one partition and other events are unaffected. Justified by blast radius — a sold-out stadium should not slow down everything else on the platform.',
        'Payment as a saga, ordered deliberately: hold the seat, authorise the card, confirm the seat, capture the payment. Authorise-then-capture matters because voiding an authorisation is cheap and clean, while refunding a capture is slow, visible to the customer, and sometimes costs a fee. Every step carries an idempotency key.',
        'After confirmation, everything else goes on a queue — the email, the ticket generation, the analytics, the organiser reporting. Justified by the slack analysis: none of it needs the user waiting.',
        'Hold expiry: each hold row carries an expiry timestamp, and the claim query treats an expired hold as available. So expiry is effectively instantaneous at the point it matters, and a background sweeper is only there to tidy up rather than being on the correctness path. That distinction is worth stating — designs that depend on a sweeper running on time have a window where seats are wrongly unavailable.',
      ],
      checklist: [
        'Drew the line between the cacheable stale tier and the exact tier, and kept the exact tier small',
        'Included a waiting room and justified it by the burst shape',
        'Claim is a single conditional update — explicitly not check-then-write',
        'Justified a relational store using the bounded write volume',
        'Partitioned by event to contain blast radius',
        'Payment ordered as authorise → confirm → capture, with a reason',
        'Idempotency keys on the payment path',
        'Post-confirmation work moved to a queue',
        'Expiry checked in the claim query, not dependent on a sweeper',
      ],
      tradeoffs: [
        {
          decision: 'Waiting room',
          cost: 'Users wait, and it must be visibly fair or it feels rigged. In exchange the real system sees a rate it can actually serve, instead of falling over and serving nobody.',
        },
        {
          decision: 'Stale seat map',
          cost: 'Users sometimes click a seat that is already gone. Cheap to handle and unavoidable — a live-accurate map for 100,000 concurrent viewers would cost more than the whole rest of the system.',
        },
        {
          decision: 'Relational database on the claim path',
          cost: 'One write ceiling per event partition. The seat count guarantees I never approach it, so I take the correctness for free.',
        },
      ],
      trap: 'Caching seat availability and using the cached value to decide whether a claim succeeds. Two users read "available" from a two-second-old cache and both proceed. Cache the display; never cache the decision.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'What happens when 20,000 people all try for the same front-row seat?',
        'The hold expires while the card is being charged. Walk through it.',
        'Is a distributed lock needed here? Justify your answer either way.',
      ],
      model: [
        'Hard part one: contention on the same rows. Twenty thousand people want the front row. The conditional update means 19,999 of them get zero rows updated, which is correct but means the database is processing 20,000 write attempts against a handful of rows, all serialising on the same locks. Several things help. The waiting room is the biggest — it caps arrival rate so this is thousands rather than tens of thousands. "Best available seat" as the default flow rather than seat picking spreads attempts across the inventory instead of concentrating them, and most users take it. And I can reject early: if the cached view says a seat has been taken, reject before the database, accepting that this is advisory and the database remains the authority. Cost: early rejection can occasionally reject a seat that just became available again through an expiry, so it must never be the only check.',
        'On distributed locks, since the interviewer usually pushes here: I do not need one, and I would say why. A distributed lock is for coordinating across systems that have no shared point of serialisation. I have one — the database row — and a conditional update on it is atomic, faster, and cannot suffer the failure mode where a lock holder pauses, its lease expires, and two workers believe they hold it. Adding a lock on top would be strictly worse: more moving parts, one more thing to fail, and no additional guarantee. Choosing the simpler mechanism and explaining the rejection is worth more than demonstrating I know what Redlock is.',
        'Hard part two: the payment boundary, in detail. Authorise while the hold is valid. If the authorisation is slow and the hold lapses mid-payment, do not silently extend it — attempt to re-claim the seat, and if it has gone, void the authorisation and tell the user clearly that their seat was released and they have not been charged. That is a bad experience, so I would shorten it: extend the hold once when payment begins, since the user has demonstrated intent. Cost: a slightly longer worst-case hold, and a small amount of inventory held by people who ultimately fail to pay.',
        'If the payment succeeds and the confirmation write fails, the reconciliation job is what saves you: it compares authorisations against confirmed orders and either completes the order — using the payment reference as the idempotency key — or voids. Cost: a background job to build and monitor, and a small number of customers in an ambiguous state for minutes. Any system doing this at volume will have those cases; the choice is whether you find them or the customer does.',
        'Fairness, which is a real requirement here and often forgotten: the queue must be first-come-first-served in an observable way, or users believe it is rigged, and for high-demand events that becomes a public problem. Cost: strict ordering in the queue is more expensive than approximate ordering, and it is worth paying for on this product specifically.',
        'Bots: the waiting room, per-account hold limits, and payment verification do most of the work. Cost: legitimate buyers occasionally get blocked, so there must be a support path — the false-positive cost here is a furious customer who missed the sale.',
        'Consistency per feature, stated separately: the seat map is eventually consistent and visibly a few seconds stale. The claim is strictly serialised. The order record is strongly consistent and durable. The organiser dashboard is eventually consistent and minutes behind, which nobody minds.',
        'What I would monitor: hold-to-purchase conversion, the rate of claim attempts that fail because the seat is gone, expired holds per minute, and the count of orders in an ambiguous payment state — that last one being the number that tells you whether the saga is actually working.',
      ],
      checklist: [
        'Addressed same-row contention with several specific mitigations',
        'Explicitly rejected a distributed lock and explained why the database row is better here',
        'Walked through hold expiry during payment and chose a specific behaviour',
        'Reconciliation job for the payment-succeeded-confirmation-failed case',
        'Named fairness as a requirement, not a nicety',
        'Named the bot problem and the false-positive cost of blocking',
        'Per-feature consistency answer',
        'Named what to monitor, including ambiguous-state orders',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Early rejection from cached availability',
          cost: 'Can wrongly reject a seat freed by an expiry moments earlier. Only ever an optimisation in front of the authoritative check.',
        },
        {
          decision: 'Extending the hold once when payment starts',
          cost: 'Slightly more inventory held by people who will not complete. Avoids the worst outcome, which is losing a seat while paying for it.',
        },
        {
          decision: 'Strict queue ordering',
          cost: 'More expensive than approximate ordering. Worth it here because perceived unfairness on a high-demand sale becomes a public incident.',
        },
      ],
      sayThis:
        '"Claiming a seat is one conditional update — set held where status is available or the hold has expired. If it updates a row, they have it; if not, they do not. I am deliberately not adding a distributed lock: I already have a single point of serialisation in that row, and a lock would add a failure mode where a paused holder\'s lease expires and two people think they own it."',
      trap: 'Reaching for a distributed lock because the problem sounds like it needs one. A single database row already serialises this, atomically and without lease-expiry risk. Explaining why you do not need the lock scores higher than implementing one.',
    },
  ],

  lifecycle: {
    caption:
      'Follow the seat, not the buyer. The seat is the contested resource, and every interesting failure is a branch off its life.',
    states: [
      { id: 'avail', label: 'Available', by: 'system' },
      { id: 'held', label: 'Held', by: 'buyer' },
      { id: 'paid', label: 'Paid', by: 'provider' },
      { id: 'conf', label: 'Confirmed', by: 'system' },
    ],
    failures: [
      { after: 'avail', label: 'Two claim at once', handling: 'conditional update — exactly one row updated, one winner' },
      { after: 'held', label: 'Buyer abandons', handling: 'expiry timestamp checked in the claim query, not by a sweeper' },
      { after: 'held', label: 'Hold lapses mid-payment', handling: 'extend once on payment start; else void the authorisation' },
      { after: 'paid', label: 'Confirmation write fails', handling: 'void the authorisation; reconciliation job catches the rest' },
      { after: 'paid', label: 'Client retries payment', handling: 'idempotency key — one charge, replayed response' },
      { after: 'conf', label: 'Event cancelled', handling: 'bulk release and refund path' },
    ],
  },

  architecture: {
    caption:
      'The line down the middle is the design: everything left of the claim can be stale and cached; the claim itself is one exact conditional write.',
    nodes: [
      { id: 'u', label: 'Buyer', kind: 'client', col: 0, row: 0 },
      { id: 'cdn', label: 'CDN', sub: 'event page, seat map', kind: 'cache', col: 1, row: 0 },
      { id: 'wr', label: 'Waiting room', sub: 'admits at a fixed rate', kind: 'service', col: 2, row: 0 },
      { id: 'bs', label: 'Booking svc', kind: 'service', col: 3, row: 0 },
      { id: 'db', label: 'Seats + orders', sub: 'conditional update', kind: 'store', col: 4, row: 0 },
      { id: 'pay', label: 'Payments', sub: 'auth → capture', kind: 'external', col: 4, row: 1 },
      { id: 'q', label: 'Post-purchase queue', kind: 'queue', col: 3, row: 1 },
      { id: 'w', label: 'Email, tickets, reporting', kind: 'service', col: 2, row: 1 },
    ],
    edges: [
      { from: 'u', to: 'cdn', label: 'browse (stale ok)' },
      { from: 'u', to: 'wr', label: 'buy' },
      { from: 'wr', to: 'bs' },
      { from: 'bs', to: 'db', label: 'claim' },
      { from: 'bs', to: 'pay' },
      { from: 'bs', to: 'q' },
      { from: 'q', to: 'w' },
    ],
  },

  numbers: {
    caption: 'The number that changes your mind: the contended path is tiny.',
    items: [
      { label: 'Requests in the first minute', value: 100000, display: '~100,000 / sec (mostly reads)', tone: 'bad' },
      { label: 'Hold attempts', value: 20000, display: '~20,000 / sec', tone: 'accent' },
      { label: 'Successful claims — for the whole sale', value: 50000, display: '50,000 total, ever', tone: 'muted' },
    ],
    note: 'Only 50,000 writes will ever succeed, because there are only 50,000 seats. So the hard part is not write throughput — it is rejecting the ~90% of attempts that must fail, cheaply, before they reach the database.',
  },

  flow: {
    scenario: 'rate-limit',
    caption: 'The waiting room in one picture: admit at a rate the exact tier can actually serve, and reject the rest at the door where rejecting is cheap.',
  },

  compare: {
    caption: 'How you claim a seat. This is the decision the whole problem turns on.',
    a: {
      title: 'Conditional update on the seat row',
      points: [
        'One statement: set held where still available. Atomic, no gap between check and write.',
        'The database is already a single point of serialisation — use it.',
        'No lease to expire, so no scenario where two holders both believe they won.',
        'Write ceiling per partition, which the seat count guarantees you never reach.',
      ],
    },
    b: {
      title: 'Distributed lock (Redis or similar)',
      points: [
        'Familiar pattern, and genuinely right when there is no shared serialisation point.',
        'Adds a component that can fail, on the most correctness-critical path you have.',
        'A paused process can lose its lease without noticing — two holders, one seat.',
        'Needs fencing tokens to be actually safe, which is more machinery than the alternative.',
      ],
    },
    verdict:
      'The conditional update. You already have exactly one place where the truth lives, and making it decide is simpler and safer than adding a lock in front of it. Being able to explain why you rejected the lock is worth more here than being able to implement one.',
  },

  followUps: [
    'consistency-simultaneous',
    'scale-sale-day',
    'kill-cache',
    'choice-database',
    'consistency-retry',
    'ops-deploy',
    'cost-monthly',
    'scope-privacy',
  ],
}
