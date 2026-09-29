import type { Problem } from '@/lib/types'

export const NOTIFICATION_SYSTEM: Problem = {
  slug: 'notification-system',
  searchTitle: "Design a notification system",
  title: 'Notification system',
  group: 'write-heavy',
  difficulty: 'starter',
  concepts: [
    'message-queues',
    'idempotency',
    'circuit-breakers',
    'rate-limiting',
    'fan-out',
    'observability',
    'batch-vs-stream',
  ],
  prompt:
    'Design a service that other teams call to notify users. It should support push, email and SMS, respect user preferences and quiet hours, never send the same thing twice, and keep working when a provider goes down.',

  slack: {
    budget: 'Urgent: seconds. Transactional: a minute. Marketing: hours.',
    headline:
      'Almost every notification has slack. This system\'s value is that it takes the work off other teams\' request paths and spends that slack for them.',
    body: [
      'A password reset email has maybe a minute before someone tries again. A "your driver has arrived" push has seconds, and it is worthless late. A weekly digest has hours; going out at 09:04 instead of 09:00 makes no difference to anyone.',
      'That range drives the design. The slack varies by more than two orders of magnitude within one system, so you must not put all of it in the same queue. If you do, the digest run will sit in front of the password resets, and the outage will be reported as "login is broken" rather than "marketing is slow".',
      'The calling service has no slack at all, though. When checkout calls the notification service, the call must return immediately: it accepts the request, it does not deliver it. If sending an email is inside the checkout request, a slow SMTP server makes checkout slow. Removing that coupling is why this service exists.',
    ],
    consequence:
      'Accept and acknowledge in milliseconds, then do the work from priority-separated queues. Providers are wrapped in timeouts and breakers so a dead vendor degrades one channel instead of the whole service.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'Who calls this? One team or fifty? That changes the API and the abuse story.',
        'Is "we tried to send it" good enough, or must you prove delivery?',
        'What is the worst thing that happens if one notification is sent twice?',
      ],
      model: [
        'Assumptions: this is an internal platform service used by many teams, with three channels to start (push, email, SMS) and more later, tens of millions of users, and templates owned by the calling teams rather than by me.',
        'The question that changes a box: is duplicate sending unacceptable, or merely annoying? "Never send twice" needs a deduplication store on the write path with a retention window, and "rarely send twice" does not. For a marketing email a duplicate is embarrassing. For a two-factor code or a payment receipt it is a support ticket. I will assume it must not duplicate, which means every request carries an idempotency key.',
        'Second question: do callers need to know whether it was delivered, or only that it was accepted? Delivery status means storing per-notification state, ingesting webhooks from every provider, and exposing a status API. That is a much bigger system. I will assume accepted-plus-best-effort-status, with delivery events recorded for analytics but not promised.',
        'Scope I propose: a send API that accepts and queues, user preferences and quiet hours, per-channel provider integration with failover, deduplication, and rate limits per user so no one gets spammed. Out of scope: template authoring and localisation, in-app notification inboxes, and delivery guarantees stronger than best effort. Each can be built separately.',
      ],
      checklist: [
        'Established this is a platform service with many internal callers',
        'Asked whether duplicates are unacceptable, and tied that to an idempotency key',
        'Asked whether delivery status must be tracked, and named what it would cost',
        'Proposed a scope, and named something you left out on purpose',
        'Mentioned per-user rate limits as a product requirement, not just an abuse one',
      ],
      tradeoffs: [
        {
          decision: 'Accept-and-queue rather than send-and-confirm',
          cost: 'The caller learns nothing about whether it arrived. In exchange, their request path is never held up by a slow provider.',
        },
      ],
      sayThis:
        '"An internal platform service, three channels, tens of millions of users. One question: must it never duplicate? If yes, every request carries an idempotency key and I need a dedupe store on the write path. That box only exists because of the answer."',
      trap: 'Designing the template language. It was not asked for, it is a separate product, and it will eat ten minutes.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a notification\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'The provider is an actor you do not control. What does it do to you?',
        'What decisions does the platform make silently on the user\'s behalf?',
        'What happens to a notification that has been waiting three hours?',
      ],
      model: [
        'Actors: the calling service, the recipient, each provider (Apple, Google, an email vendor, an SMS aggregator) and the system itself. The system is the interesting actor. It decides whether the user wants this at all, whether it is a quiet hour where they live, whether they have had too many already today, and which provider to use right now.',
        'The chain: requested by a caller → accepted and deduplicated → user preferences and quiet hours evaluated → queued by priority → rendered → handed to a provider → provider accepts → delivered to the device → opened. My responsibility ends at "provider accepts". Everything after that is a report I receive, not an outcome I control.',
        'Failure branches. At accepted: the caller retried after a timeout, so the idempotency key catches it and returns the original result. Without this, a network timeout during a payment can send two receipts. At preferences: the user has unsubscribed, so it is dropped. Dropped is a normal outcome that must be recorded and countable, not an error. At queued: the provider is down, so it retries with growing delays, and after a few failures the breaker opens and sends to that provider stop rather than piling up. At handed to provider: the send succeeded but my write recording it failed, so a retry would send twice. That is why the provider call itself carries an idempotency key where the vendor supports one. Where it does not, a rare duplicate is possible, and I would say so.',
        'The branch the system owns, and the one that is easy to miss: a notification that has been stuck for three hours. A "your driver is arriving" push delivered three hours late is worse than not delivering it. So messages carry a time-to-live, and expired ones are dropped and counted rather than delivered.',
      ],
      checklist: [
        'Named providers as actors outside your control',
        'Named the system\'s silent decisions: preferences, quiet hours, frequency caps',
        'Ended your responsibility at "provider accepted" and said so',
        'Idempotency key on the inbound request, and on the provider call where supported',
        'Suppressed and unsubscribed are recorded outcomes, not errors',
        'Time-to-live, so a stale notification is dropped rather than delivered late',
      ],
      trap: 'Only drawing the happy path to the provider. The interviewer wants the dead vendor, the double send, and the three-hour-old push.',
    },

    {
      id: 3,
      ask: 'Estimate notifications per second, storage and provider load. Then finish: "So the hard part here is ___."',
      nudges: [
        'Average is not the story here. What does a campaign look like?',
        'What is the peak-to-average ratio when marketing presses send?',
        'How much do you have to store, and for how long?',
      ],
      model: [
        'Assume 50 million users receiving about 5 notifications a day. That is 250 million a day, divided by 100,000 seconds (a day is 86,400, rounded up), so roughly 2,500 per second on average. That is small.',
        'The average is misleading here. A marketing campaign to 20 million users is submitted as one API call and becomes 20 million sends. If I try to do that in ten minutes, that is 33,000 per second on top of the baseline: a thirteen-fold spike, self-inflicted, and likely more than my email vendor accepts. So the peak is driven by one person clicking a button, not by user behaviour.',
        'Storage: a notification record with status is maybe 500 bytes. 250 million a day is 125 GB a day, so I would keep detailed records for 30 days — about 4 TB — and roll older data into aggregates. Keeping every notification forever is a growing table nobody prunes.',
        'Provider limits are the binding constraint, and they are not mine to change. An SMS aggregator might accept a few hundred per second on my contract. I cannot design that away. It is a ceiling I have to shape traffic to fit.',
        'So the hard part here is burst absorption and provider limits, not throughput. The baseline is trivial. The design is about surviving a campaign without delaying a password reset, while staying inside a vendor rate limit I do not control.',
      ],
      checklist: [
        'Produced a baseline rate and called it small',
        'Identified that peak is driven by campaigns, not by users',
        'Quantified the campaign spike as a multiple of baseline',
        'Named provider rate limits as an external ceiling',
        'Finished the sentence: burst absorption and provider limits, not throughput',
      ],
      tradeoffs: [
        {
          decision: 'Spreading a campaign over an hour instead of ten minutes',
          cost: 'Marketing waits longer for their send to complete. In exchange, transactional notifications are unaffected and the vendor does not throttle us.',
        },
      ],
      sayThis:
        '"Baseline is about 2,500 a second, which is small. But one campaign button turns into 20 million sends, and my SMS vendor accepts a few hundred a second. So the hard part here is burst absorption against a provider limit I do not control."',
      trap: 'Reporting the average and moving on. In this system the average is the least interesting number on the page.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'What has to happen synchronously, and what must not?',
        'How do you stop the digest run from delaying a password reset?',
        'Where do preferences get checked — once, or per channel?',
      ],
      model: [
        'The **ingest API** does the smallest possible amount of work: validate, claim the idempotency key, write the request, put it on a queue, return 202. That path must stay in single-digit milliseconds, because every calling team\'s latency depends on it. Nothing about preferences, rendering or providers happens here.',
        '**Priority-separated queues** (urgent, transactional, bulk), each with its own consumers. This is the most important box on the board, and it comes straight from the slack analysis: the digest run must be unable to sit in front of a password reset. Bulk consumers are also capped, so a campaign cannot consume all the workers.',
        'A **preference and policy service** evaluates each notification before it is rendered: has the user opted out of this category, is it a quiet hour in their timezone, have they already had too many today. For anything non-urgent, quiet hours mean scheduling rather than dropping: hold it until 8am local. Frequency caps are a per-user rate limiter, the same mechanism as abuse protection, applied to the product.',
        '**Channel workers**, one pool per channel, render the message and call the provider. Each has its own connection pool, timeout and circuit breaker, so a dead SMS vendor cannot consume the workers that send push. That isolation is a bulkhead: one provider outage degrades one channel rather than the service.',
        '**Provider abstraction with failover**: two vendors per channel where it matters, so a breaker opening on the primary routes to the secondary. Cost is a second contract and reconciling two sets of delivery reports.',
        'Finally a **status store and event stream**: every state change is recorded, provider webhooks are ingested to update delivery status, and aggregates roll up for the dashboard. This is what makes the system debuggable when a team asks why their user did not get an email. Often the answer is "she unsubscribed in March", and you can only give it if suppression is recorded as data.',
      ],
      checklist: [
        'Ingest does almost nothing and returns 202 immediately',
        'Separate queues by priority, justified from the slack budgets',
        'Preferences, quiet hours and frequency caps evaluated in one place',
        'Per-channel worker pools with their own breakers — a bulkhead',
        'Two providers per channel with automatic failover',
        'Suppression and status recorded as queryable data, not just logs',
      ],
      tradeoffs: [
        {
          decision: 'Three priority queues instead of one',
          cost: 'More moving parts and a routing decision on every request. Worth it, because with one queue marketing can take down password resets.',
        },
        {
          decision: 'Second provider per channel',
          cost: 'A second contract, second integration and two sets of delivery reports to reconcile. Only worth it on channels where an outage is expensive.',
        },
      ],
      sayThis:
        '"Ingest claims an idempotency key and returns 202 in single-digit milliseconds. It does nothing else, because every caller\'s latency depends on it. Then priority-separated queues, because the weekly digest must be unable to queue in front of a password reset. Each channel has its own workers and its own breaker."',
      trap: 'One queue for everything. It works in the demo and fails the first time marketing sends a campaign, and the incident gets reported as "login is broken".',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'What happens in the first minute of a provider outage?',
        'How do you send 20 million campaign messages without hurting anyone else?',
        'What stops a bug in a calling service from sending a user 5,000 emails?',
      ],
      model: [
        '**Hard part one: a provider goes down.** Minute one, sends start timing out. Without protection, workers block on a dead vendor, the queue backs up, and because retries pile on, the vendor gets more traffic while it is trying to recover. So: a tight timeout on every provider call, retries with growing delays and randomness so a thousand workers do not retry in unison, and a breaker that opens on failure rate and stops calls to that provider. Then failover to the secondary provider for that channel, which is why you have one. Notifications keep queueing, and because they carry a time-to-live, anything that becomes worthless while we wait is dropped and counted rather than delivered stale. Cost: during the outage I am sending through a vendor with different deliverability and pricing, and my delivery reports come from two sources, so the analytics are messier for that period.',
        '**Hard part two: the campaign.** 20 million messages submitted as one call. First, it is accepted as a *campaign* rather than 20 million individual requests, so the API call is fast and the expansion happens in the background. Otherwise the caller times out. Second, the expansion writes into the bulk queue only, at a controlled rate, so it can never starve the other two. Third, the rate at which bulk workers drain is capped below what the provider accepts, so I am shaping traffic rather than getting throttled. Fourth, preferences are evaluated per recipient during expansion, not at submission, because the list can be an hour old by the time it is sent, and some recipients will have unsubscribed in between. Cost: marketing waits an hour rather than ten minutes, and I have to explain why that is on purpose.',
        '**Runaway protection.** A bug in a calling service that sends the same user a notification in a loop is a realistic incident. Per-user frequency caps stop it at the platform boundary rather than relying on every caller being correct. I would also cap per-caller volume, and alert on any sudden change in a caller\'s rate. Cost: a legitimate burst can be throttled, so the cap needs to be configurable per caller rather than a constant.',
        '**Debuggability.** A question this service will get often is "why did my user not get this?". Every plausible answer (unsubscribed, quiet hours, frequency cap, provider rejected it, still queued) has to be a recorded, queryable outcome. If suppression is only a log line, this service becomes a support burden. That observability decision has to be made at design time.',
      ],
      checklist: [
        'Timeout, jittered retries, breaker and failover, in that order',
        'Time-to-live so stale notifications are dropped rather than delivered late',
        'Campaigns accepted as one object and expanded in the background',
        'Bulk drain rate capped below the provider limit — shaping, not being throttled',
        'Preferences evaluated at send time, not at submission',
        'Per-user and per-caller caps to contain a buggy caller',
        'Every suppression reason recorded as queryable data',
      ],
      tradeoffs: [
        {
          decision: 'Dropping expired notifications',
          cost: 'Some messages are never delivered at all. Correct for "your driver is here"; I would exclude password resets from expiry.',
        },
        {
          decision: 'Per-user frequency caps',
          cost: 'A legitimate burst of important notifications can be suppressed, so the cap has to vary by category rather than being global.',
        },
      ],
      sayThis:
        '"Every provider call has a timeout, jittered retries and a breaker, then fails over to the secondary. One dead vendor degrades one channel, not the service. Campaigns are accepted as a single object and expanded into the bulk queue at a rate below the vendor limit. Cost: marketing waits an hour instead of ten minutes, and that is on purpose."',
      trap: 'No answer for "why did my user not receive it". If suppression reasons are not stored as data, every "missing" notification becomes a manual investigation.',
    },
  ],

  refs: [
    {
      label: "Avoiding insurmountable queue backlogs",
      href: "https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/",
      note: "What happens when the notification queue falls behind and never catches up.",
    },
  ],
  lifecycle: {
    caption:
      'Your responsibility ends at "provider accepted". Everything after that is a report you receive, not an outcome you control. Saying so is part of the answer.',
    states: [
      { id: 'requested', label: 'Requested by a caller', by: 'another service' },
      { id: 'accepted', label: 'Accepted + deduplicated', by: 'system' },
      { id: 'evaluated', label: 'Preferences evaluated', by: 'system' },
      { id: 'queued', label: 'Queued by priority', by: 'system' },
      { id: 'sent', label: 'Handed to provider', by: 'system' },
      { id: 'delivered', label: 'Delivered', by: 'provider' },
    ],
    failures: [
      { after: 'requested', label: 'Caller retried after a timeout', handling: 'idempotency key returns the original result — no second receipt' },
      { after: 'evaluated', label: 'User unsubscribed or in quiet hours', handling: 'suppressed or scheduled for 8am local, recorded as a queryable outcome' },
      { after: 'queued', label: 'Provider down', handling: 'timeout, jittered retries, breaker opens, fail over to the secondary vendor' },
      { after: 'queued', label: 'Stuck three hours', handling: 'time-to-live expires it — a late "driver arriving" is worse than none' },
      { after: 'sent', label: 'Sent but our status write failed', handling: 'provider-side idempotency key, so the retry does not send twice' },
      { after: 'delivered', label: 'Caller has a bug and loops', handling: 'per-user frequency cap stops it at the platform, not at the caller' },
    ],
  },

  architecture: {
    caption:
      'Ingest is trivial and fast. Priority queues keep the digest away from the password reset. Each channel is isolated behind its own breaker.',
    nodes: [
      { id: 'svc', label: 'Calling services', kind: 'client', col: 0, row: 0 },
      { id: 'api', label: 'Ingest API', sub: 'dedupe, 202', kind: 'service', col: 1, row: 0 },
      { id: 'pref', label: 'Preferences', sub: 'opt-out, quiet hours, caps', kind: 'service', col: 2, row: 1 },
      { id: 'qu', label: 'Urgent queue', kind: 'queue', col: 2, row: 0 },
      { id: 'qb', label: 'Bulk queue', sub: 'rate-capped', kind: 'queue', col: 2, row: 2 },
      { id: 'w', label: 'Channel workers', sub: 'own pool + breaker', kind: 'service', col: 3, row: 0 },
      { id: 'p1', label: 'Primary provider', kind: 'external', col: 4, row: 0 },
      { id: 'p2', label: 'Secondary provider', kind: 'external', col: 4, row: 1 },
      { id: 'st', label: 'Status store', sub: 'why it was not sent', kind: 'store', col: 3, row: 2 },
    ],
    edges: [
      { from: 'svc', to: 'api' },
      { from: 'api', to: 'qu' },
      { from: 'api', to: 'qb' },
      { from: 'qu', to: 'w' },
      { from: 'qb', to: 'w' },
      { from: 'w', to: 'pref', label: 'allowed?' },
      { from: 'w', to: 'p1' },
      { from: 'w', to: 'p2', label: 'breaker open', dashed: true },
      { from: 'w', to: 'st' },
    ],
  },

  numbers: {
    caption: 'The average is the least interesting number here. The campaign drives the design.',
    items: [
      { label: 'Baseline notifications', value: 2500, display: '~2,500 / sec', tone: 'muted' },
      { label: 'One campaign, if sent in 10 min', value: 33000, display: '~33,000 / sec — a 13x spike', tone: 'bad' },
      { label: 'SMS vendor contract limit', value: 300, display: '~300 / sec — not yours to change', tone: 'accent' },
    ],
    note: 'So the hard part is burst absorption against a provider ceiling you do not control. Baseline throughput is trivial; a marketing button is what breaks this system.',
  },

  followUps: [
    'kill-dependency',
    'consistency-retry',
    'scale-sale-day',
    'ops-noisy-neighbour',
    'scope-third-party',
    'ops-alert-first',
    'cost-per-user',
    'choice-queue',
  ],
}
