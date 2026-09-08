import type { DeepDive, WorkedExample } from '@/lib/types'

export const QUEUES_DEEP: DeepDive = {
  intro:
    'The summary said "write the job down now, do it soon". This page is about everything that goes wrong between now and soon. It covers work queues against logs and when each is right, delivery guarantees stated precisely, ordering per key rather than globally, retries and poison messages, dead letter queues that actually get looked at, backpressure and what saying no really means, and the metrics that tell you a backlog is a problem before users do.',
  minutes: 20,
  sections: [
    {
      heading: 'Work queue or log — they are not the same thing',
      body: [
        'People say "queue" for two quite different systems, and choosing the wrong one shows up as a redesign six months later.',
        'A **work queue** hands each message to exactly one consumer, and the message is gone once it is acknowledged. You scale by adding consumers. Think jobs, tasks, sending an email.',
        'A **log** keeps an ordered, retained record. Many independent consumers read it at their own position, and any of them can go back and re-read from the beginning. Think Kafka, and think events several teams care about.',
      ],
      table: {
        caption: 'Which one you actually need.',
        headers: ['', 'Work queue', 'Log'],
        rows: [
          ['Consumers per message', 'Exactly one', 'Many, independently'],
          ['After processing', 'Gone', 'Retained for days'],
          ['Replay', 'Not possible', 'Core feature'],
          ['Scaling', 'Add consumers freely', 'Bounded by partition count'],
          ['Ordering', 'Usually none', 'Per partition'],
          ['Right for', 'Jobs and tasks', 'Events many teams consume'],
        ],
      },
      points: [
        'If a second team will ever want these events, you want a log — retrofitting replay onto a work queue is not possible.',
        'If you need to reprocess after fixing a bug, you want a log. This is the reason that decides it most often.',
        'Log consumers are bounded by partition count: 12 partitions means at most 12 parallel consumers in a group, so the partition count is a capacity decision made at creation time.',
        'Using a log for simple background jobs is over-building. A work queue is genuinely simpler to operate.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"A log rather than a work queue, because the search indexer, the warehouse and the fraud team all want these same events, and because I want to be able to replay a week after fixing a bug. Cost: partition count caps my consumer parallelism and I have to choose it up front."',
        },
      ],
    },
    {
      heading: 'Delivery guarantees, stated precisely',
      body: [
        'There are three, only two of them are real, and being precise here is a reliable signal.',
        '**At-most-once**: send and forget. Messages can be lost. Almost never what you want, though it is legitimate for high-volume metrics where losing a sample is cheaper than the machinery to avoid it.',
        '**At-least-once**: retry until acknowledged. Messages can be duplicated. This is what real systems give you.',
        '**Exactly-once delivery** is not achievable across a network that can drop messages, because you cannot distinguish a lost request from a lost response. What is achievable is at-least-once delivery plus processing that is safe to repeat, and that produces an exactly-once *effect*.',
      ],
      points: [
        'Say "exactly-once effect, achieved with at-least-once delivery plus idempotent consumers". That phrasing shows you have shipped this.',
        'Duplicates arrive for mundane reasons: a consumer crashed after doing the work and before acknowledging, or a rebalance reassigned a partition mid-flight.',
        'Some brokers offer "exactly-once semantics" within their own boundary — transactional writes back to the same system. That does not extend to an external side effect like charging a card.',
        'The consumer contract is therefore always the same: process, record that you processed it, and commit both together.',
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Adding a queue to a design and never mentioning idempotency. Duplicate delivery is guaranteed, not hypothetical, and the interviewer is waiting for you to say so.',
        },
      ],
    },
    {
      heading: 'Ordering — per key, not globally',
      body: [
        'Total ordering across an entire topic is expensive and almost never required. What you actually need is that events which relate to each other arrive in order, and events that do not can proceed in parallel.',
        'Partitioning by key gives you exactly that: all events for one order, one user, one conversation go to one partition and are processed in sequence, while different keys proceed independently. Say "ordered per user, not globally" and you have answered the question properly.',
      ],
      points: [
        'Choosing the partition key is the same decision as choosing a shard key, and it has the same failure: one hot key becomes one hot partition.',
        'Ordering only holds if a single consumer handles a partition at a time. Parallelising within a partition throws the guarantee away, which people do accidentally by processing messages concurrently inside a worker.',
        'Consumers should still be prepared for out-of-order arrival across partitions, because there is no ordering between them at all.',
        'If you genuinely need global order, you need a single partition, which means a single consumer and a hard throughput ceiling. Say that ceiling out loud.',
      ],
      visuals: [
        {
          type: 'diagram',
          diagram: {
            caption:
              'Ordering per key. Order 41\'s events stay in sequence on one partition; order 87 proceeds in parallel on another. No global ordering, no global bottleneck.',
            nodes: [
              { id: 'p', label: 'Producers', kind: 'client', col: 0, row: 1 },
              { id: 'h', label: 'hash(order_id)', kind: 'service', col: 1, row: 1 },
              { id: 'p1', label: 'Partition 0', sub: 'order 41: created → paid → shipped', kind: 'queue', col: 2, row: 0, span: 2 },
              { id: 'p2', label: 'Partition 1', sub: 'order 87, in parallel', kind: 'queue', col: 2, row: 2, span: 2 },
              { id: 'n', label: 'one consumer per partition — parallelism inside one throws ordering away', kind: 'note', col: 1, row: 3, span: 3 },
            ],
            edges: [
              { from: 'p', to: 'h' },
              { from: 'h', to: 'p1' },
              { from: 'h', to: 'p2' },
            ],
          },
        },
      ],
    },
    {
      heading: 'Retries, poison messages and the dead letter queue',
      body: [
        'A message that always fails will retry forever unless you stop it, and while it does it burns capacity and hides real work behind it. This is a poison message, and every queue design needs an answer for it.',
      ],
      points: [
        'Retry with growing delays, and add randomness. A thousand consumers that failed at the same moment will otherwise retry at the same moment.',
        'Cap the attempts — two or three for most things. Infinite retries are a decision to be down for longer.',
        'After the cap, move the message to a **dead letter queue** rather than dropping it, so a human can look at it.',
        'A dead letter queue nobody monitors is a silent data-loss machine. Alert on arrival rate, not on depth.',
        'Have a way to fix and replay from the dead letter queue. If the only option is to read it, it is a graveyard rather than a tool.',
        'Distinguish retryable from non-retryable failures: a timeout is worth retrying, malformed data never will be, and retrying it three times just wastes capacity before the inevitable.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Five attempts with exponential backoff and full jitter, then the dead letter queue, with an alert on arrival rate rather than depth — because one message arriving is a bug I want to know about today, not when the queue has ten thousand in it."',
        },
      ],
    },
    {
      heading: 'Backpressure — what saying no actually looks like',
      body: [
        'This is the section that separates a real answer from a diagram. If producers stay faster than consumers, the queue grows without bound. It does not fail gracefully at the end of that — it accepts work it can never do, and then falls over having promised everybody something.',
        'There are four honest responses, and every one of them means refusing someone. Choosing which someone is the design.',
      ],
      points: [
        '**Scale consumers on backlog**, not on CPU. And check what they are hitting — often the real ceiling is a database, and adding workers just moves the queue somewhere less visible.',
        '**Slow the producer**: reject or throttle at the edge, so the caller learns immediately rather than being told "accepted" for work that will never happen.',
        '**Shed low-value work deliberately**: drop the digest emails and keep the password resets. This requires having separated them, which is why priority queues exist.',
        '**Bound the queue**: set a maximum depth and reject when full. Harsh, honest, and it converts an eventual collapse into an immediate, visible error.',
        'The thing to never say is that the queue will absorb it. An unbounded queue is not capacity, it is failure postponed and made harder to diagnose.',
      ],
      visuals: [
        {
          type: 'numbers',
          numbers: {
            caption: 'A queue taking 5,000 a second and draining 4,000. It looks fine, right up until it does not.',
            items: [
              { label: 'After one hour', value: 3600000, display: '3.6M messages behind', tone: 'muted' },
              { label: 'Oldest message age', value: 900, display: '~15 minutes and growing', tone: 'bad' },
              { label: 'Time to drain once fixed', value: 3600, display: '1 hour at full capacity, with no new traffic', tone: 'bad' },
            ],
            note: 'A 20% shortfall is invisible for the first few minutes and unrecoverable within an hour. Which is why the alert is on the growth rate and on oldest-message age, not on depth crossing a threshold.',
          },
        },
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Every backpressure option makes something worse for somebody, on purpose. That is what makes it a design decision rather than a configuration one.',
        },
      ],
    },
    {
      heading: 'What to monitor, and the incident it prevents',
      body: [
        'Queue metrics are unusual in that the obvious one is the least useful. Depth crossing a threshold tells you about a problem that started an hour ago.',
      ],
      points: [
        '**Oldest message age** is the honest measure of user pain. Depth of 50,000 means nothing on its own; an oldest message of 40 minutes means somebody has been waiting 40 minutes.',
        '**Rate of change of backlog** is the leading indicator. Growing is an incident whether the depth is 100 or 100,000.',
        '**Dead letter arrival rate**, alerted from the first message.',
        '**Consumer error rate versus throughput** — the two failure shapes look identical on a depth graph and need opposite fixes. Healthy but outnumbered means add consumers. Failing and retrying means adding consumers makes it worse.',
        'Separate queues per priority, so you can see and alert on them independently. One queue means one number, and one number hides which work is being delayed.',
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Responding to a growing backlog by adding consumers before checking whether they are failing. If the cause is a poison message or a dead dependency, more consumers means a bigger retry storm against something already struggling.',
        },
      ],
    },
  ],
}

export const QUEUES_EXAMPLE: WorkedExample = {
  title: 'The digest run that broke login',
  scenario:
    'At 09:00 on Tuesday, support reports that password reset emails are not arriving. Nothing is down. The email service is healthy, the provider is healthy, and the queue consumers are all running and processing messages steadily. It has happened once before, three weeks ago, and resolved itself after about ninety minutes.',
  steps: [
    {
      step: 'Confirm what is actually late',
      detail:
        'Consumers are healthy and throughput is normal, which rules out a failure. Queue depth is 2.1 million and the oldest message is 74 minutes old. So nothing is broken — messages are simply being processed a long time after they were enqueued. The system is working exactly as designed and the design is wrong.',
    },
    {
      step: 'Find what filled it',
      detail:
        'At 08:55 the weekly digest job enqueued 2 million messages. Password resets go into the same queue. A work queue is first-in-first-out, so every reset submitted after 08:55 sits behind up to 2 million digests. Consumers drain at about 4,000 a second, so a reset enqueued at 09:00 will be sent around 10:30 — long after the user has given up and contacted support.',
    },
    {
      step: 'Mitigate before diagnosing further',
      detail:
        'Right now, get the resets out. Temporarily scale consumers up, which helps but does not reorder anything. Better and faster: publish new password resets to a separate temporary queue with its own consumers, so they bypass the backlog entirely. Ninety seconds of work, and the user-visible incident ends immediately while the digest backlog continues draining harmlessly.',
    },
    {
      step: 'Fix the structure, not the incident',
      detail:
        'Split the queues permanently by priority: urgent, transactional, bulk, each with its own consumers. Bulk consumers are capped so a campaign can never consume the workers that transactional messages need. This comes straight from the slack analysis — a password reset has a minute and a digest has hours, and putting work with a hundredfold difference in urgency into one queue guarantees this incident recurs.',
    },
    {
      step: 'Rate-shape the producer as well',
      detail:
        'Enqueuing 2 million messages in one burst is itself the problem. The digest job now expands its recipient list gradually, at a rate below what consumers drain, so the bulk queue never accumulates a large backlog in the first place. Marketing waits an hour instead of ten minutes, which nobody notices and nobody was promised otherwise.',
    },
    {
      step: 'Change the alert so this is caught in minutes',
      detail:
        'The alert had been on queue depth above 500,000, which never fired because depth is normally near zero and spikes are expected. Replace it with two alerts: oldest message age above five minutes on the transactional queue, and backlog growth sustained over ten minutes on any queue. The first would have fired at 09:04 and named exactly which work was being delayed.',
    },
  ],
  outcome:
    'The immediate incident ends in under two minutes with a bypass queue. The structural fix — priority separation plus producer rate-shaping — removes the entire class of failure. The lasting lesson is the metric: queue depth is not a measure of harm, and oldest-message age would have caught this ninety minutes earlier both times.',
  problemSlug: 'notification-system',
}
