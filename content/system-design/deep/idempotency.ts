import type { DeepDive, WorkedExample } from '@/lib/types'

export const IDEMPOTENCY_DEEP: DeepDive = {
  intro:
    'The summary said "make doing it twice the same as doing it once". This page is about actually building that. It covers why exactly-once delivery is impossible rather than merely hard, the three-state outcome people forget, how to implement a key store correctly and the crash windows in the naive version, choosing a key, what to return for a repeat, operations that are naturally safe, and the consumer-side version for queues.',
  minutes: 20,
  sections: [
    {
      heading: 'Why exactly-once delivery cannot exist',
      body: [
        'This is worth understanding rather than memorising, because the reasoning is what lets you answer follow-ups.',
        'A client sends a request. The network can drop the request, or deliver it and drop the response. From the client\'s side those two look identical: silence. So the client has exactly two options, and both are wrong some of the time. Retry, and you might do the work twice. Give up, and you might have done it zero times when the user thinks it happened.',
        'No protocol removes this, because any acknowledgement can itself be lost, and acknowledging the acknowledgement has the same problem one level up. What you can do is make the second attempt harmless, which converts an impossible problem into a solvable one.',
      ],
      points: [
        'At-most-once: send and forget. Can lose work.',
        'At-least-once: retry until acknowledged. Can duplicate work. This is what you get.',
        'Exactly-once *delivery* is impossible. Exactly-once *effect* is achievable: at-least-once delivery plus idempotent processing.',
        'Say it in that form. It is the difference between quoting a phrase and describing a system you have built.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Exactly-once delivery is not on offer, because a lost response is indistinguishable from a lost request. What I can build is at-least-once delivery with idempotent processing, which gives an exactly-once effect — and that is what people mean when they say exactly-once."',
        },
      ],
    },
    {
      heading: 'The third outcome people forget',
      body: [
        'Most designs handle success and failure. The outcome that produces real incidents is the third one: **unknown**. You called something, and you do not know what happened.',
        'This deserves to be a real state in your model, not an error path. A payment sitting in `unknown` is a different thing from a payment that failed, and treating them the same either double-charges someone or loses money.',
      ],
      points: [
        'On unknown, do not retry blindly. Query the downstream system by your own reference to find out what actually happened.',
        'That query is only possible if you generated and stored a reference *before* making the call. Generating it after is too late.',
        'A background job should resolve `unknown` records rather than leaving them for a human.',
        'The user-facing version of unknown is "processing", which is worse UX than a fast answer and far better than a double charge.',
        'If a retry arrives while the first attempt is still running, return "in progress, try shortly" rather than doing the work again or returning a wrong answer.',
      ],
      visuals: [
        {
          type: 'diagram',
          diagram: {
            caption:
              'Three outcomes, not two. The middle one is where double charges come from, and it needs a state of its own plus a resolver.',
            nodes: [
              { id: 'c', label: 'Call made', kind: 'service', col: 0, row: 1 },
              { id: 'ok', label: 'Success', sub: 'record and return', kind: 'store', col: 1, row: 0 },
              { id: 'un', label: 'Unknown', sub: 'no response', kind: 'external', col: 1, row: 1 },
              { id: 'no', label: 'Failure', sub: 'safe to retry', kind: 'store', col: 1, row: 2 },
              { id: 'q', label: 'Query by our reference', sub: 'never blind retry', kind: 'service', col: 2, row: 1 },
            ],
            edges: [
              { from: 'c', to: 'ok' },
              { from: 'c', to: 'un' },
              { from: 'c', to: 'no' },
              { from: 'un', to: 'q' },
            ],
          },
        },
      ],
    },
    {
      heading: 'Implementing it, and the crash windows in the naive version',
      body: [
        'The obvious implementation has a hole in it, and the hole is the whole reason the correct version looks the way it does.',
        'Naive: check whether you have seen this key; if not, do the work; then record the key. There are two crash windows. Between the check and the work, two concurrent requests can both pass the check. Between the work and the record, a crash means the work is done and unrecorded, so the retry does it again.',
        'The correct version removes both windows by making the claim and the work atomic: insert the key into a table with a unique constraint **inside the same transaction as the work**. Either both land or neither does, and a duplicate hits the constraint rather than passing a check.',
      ],
      points: [
        'The unique constraint is doing the real work here. It is the database serialising two concurrent requests for you, which application code cannot do.',
        'Store the response alongside the key, so a repeat returns the original answer rather than a bare "duplicate" the client cannot use.',
        'Store the request fingerprint too, and reject a reused key carrying different parameters — otherwise a client bug turns one key into a way to get the wrong answer.',
        'When the side effect is external and cannot join your transaction, the external call must carry its own idempotency key. Every serious payment provider supports this.',
        'Give keys a retention window — 24 hours to a few days — and expire them, or you have a growing table nobody prunes.',
      ],
      table: {
        caption: 'The two implementations, and where each one breaks.',
        headers: ['', 'Check-then-do', 'Claim in the same transaction'],
        rows: [
          ['Two concurrent requests', 'Both pass the check, both do the work', 'One inserts, the other hits the constraint'],
          ['Crash after work, before record', 'Retry does it again', 'Impossible — they committed together'],
          ['Repeat after success', 'Returns duplicate error', 'Returns the original stored response'],
          ['Complexity', 'Two statements', 'One transaction'],
        ],
      },
      callouts: [
        {
          variant: 'trap',
          text: 'Describing "check if seen, then process" as idempotency. It is the version that looks right and fails under exactly the conditions it exists for: concurrency and crashes.',
        },
      ],
    },
    {
      heading: 'Choosing the key',
      body: [
        'A bad key is worse than no key, because it creates confidence without protection. There are two failure directions and both are common.',
      ],
      points: [
        'Too specific and it changes between attempts, so duplicates are not caught. Anything containing a timestamp, an attempt number or a random value generated per attempt fails this way — and this is the most common real bug.',
        'Too broad and it blocks legitimate repeats. Hashing just the user id and amount means a customer who really buys the same coffee twice gets refused the second time.',
        'For user actions: a UUID generated by the client, once per logical operation, and reused across every retry of that operation. Generating it on the retry defeats the entire scheme.',
        'For queue consumers: the message id, or a hash of the meaningful content.',
        'For internal service calls: a deterministic key derived from the business event — order id plus step name — so any caller retrying reaches the same key.',
        'Write the key into the client\'s local state before sending, so a client crash and restart still reuses it.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"The client generates a UUID once per checkout attempt, stores it locally before sending, and reuses it on every retry. Regenerating it per attempt is the classic way this gets implemented wrongly and it silently removes all the protection."',
        },
      ],
    },
    {
      heading: 'Operations that are naturally safe',
      body: [
        'The cheapest idempotency is the kind you get from the shape of the operation, with no key store, no retention policy and nothing for anyone to forget. Reach for this first, and only fall back to keys when the work really cannot be reshaped.',
      ],
      points: [
        'Setting a value is safe: `status = SHIPPED` twice is the same as once. Incrementing is not.',
        'Upserting by a natural key is safe. Inserting is not.',
        'Deleting by id is safe — the second delete finds nothing and that is fine.',
        'Writing a whole document is safe, which is why indexers and derived stores are usually idempotent for free.',
        'Anything that computes a new state from the current one is unsafe, and that includes the innocuous-looking counter increment.',
        'Where you can convert an unsafe operation into a safe one — record events and derive the total, rather than incrementing — do that instead of adding a key store.',
      ],
      compare: {
        caption: 'Two ways to make a duplicate harmless, and which to reach for first.',
        a: {
          title: 'Reshape the operation',
          points: [
            'No extra storage, no retention window, no code path to forget.',
            'Cannot be broken by a future engineer who skips the check.',
            'Only possible when the work can be expressed as setting a value or upserting.',
            'Sometimes changes the data model, which is a real cost.',
          ],
        },
        b: {
          title: 'Idempotency key store',
          points: [
            'Works for anything, including calls to systems you do not control.',
            'Lets you return the original response to a repeat, which clients need.',
            'A table on the write path, plus a retention policy and a cleanup job.',
            'Only protects the paths that actually use it.',
          ],
        },
        verdict:
          'Reshape where you can, keys where you must. Money movement and external side effects almost always need keys; internal state changes usually do not, and choosing keys by reflex adds a table you did not need.',
      },
    },
    {
      heading: 'The consumer side',
      body: [
        'Every queue consumer needs this, without exception, because at-least-once is the only delivery on offer. The good news is that the consumer version is usually simpler than the API version.',
      ],
      points: [
        'Process the message and record its id as processed, committing both in one transaction. A duplicate hits the unique constraint and is discarded.',
        'Where the effect is external — sending an email, calling a partner — that call must carry its own idempotency key, because it cannot be in your transaction.',
        'A consumer crashing after doing the work and before acknowledging is not an edge case, it is a daily occurrence at any scale.',
        'Rebalances cause duplicates too: a partition reassigned mid-flight means the new consumer starts from the last committed position and reprocesses whatever was in flight.',
        'Derived stores get this almost free by writing whole documents, which is why CDC-driven indexers are naturally safe.',
        'Never try to solve this by making the queue deliver once. It cannot, and effort spent there is effort not spent making the consumer safe.',
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'The processed-ids table grows with throughput and needs pruning, and it is on the write path of every message. That is the price of at-least-once, and it is much cheaper than the alternative.',
        },
      ],
    },
  ],
}

export const IDEMPOTENCY_EXAMPLE: WorkedExample = {
  title: 'The retry that charged 300 customers twice',
  scenario:
    'Over one weekend, 300 customers were charged twice for the same order. The code has an idempotency key. The team is confident it was implemented correctly, because they tested it: sending the same request twice returns the original result. The double charges are all from mobile clients, and all during a period when the payment provider was slow.',
  steps: [
    {
      step: 'Confirm the mechanism works when tested',
      detail:
        'Send the same request with the same key twice: the second returns the stored result and does not charge again. So the server-side key store is correct. That narrows it — if the same key protects properly, then the two charges must have arrived under two different keys.',
    },
    {
      step: 'Look at the client, not the server',
      detail:
        'The mobile app generates the idempotency key inside the network layer, at the moment of sending. Its retry logic sits above that layer. So when a request times out and the app retries, it calls the network layer again — which generates a fresh UUID. Two attempts, two keys, two charges, and the server behaved perfectly both times. The protection was defeated one layer above where it was implemented.',
    },
    {
      step: 'Understand why it only happened that weekend',
      detail:
        'The provider was slow, so requests crossed the client timeout while succeeding on the server. That is the exact condition idempotency exists for, and the only condition under which this bug is visible. Every other weekend the responses came back in time, the retry never fired, and the bug sat there looking like working code.',
    },
    {
      step: 'Fix the key lifetime',
      detail:
        'Generate the key once per logical operation — when the user taps Pay — and store it in the client\'s local database before the first send. Every retry of that operation reuses it, including retries after the app is killed and reopened. The key now belongs to the intent, not to the network attempt, which is what it always should have meant.',
    },
    {
      step: 'Make the server able to catch it anyway',
      detail:
        'The server cannot detect a fresh key, but it can detect a suspicious pattern: the same customer, same amount, same order id, within a short window under two different keys. That should not create a second charge silently — it should be rejected or flagged. Defence in depth, because the client will get this wrong again eventually.',
    },
    {
      step: 'Test the condition, not the mechanism',
      detail:
        'The original test proved the key store works. It did not prove the system is safe, because it never exercised a client timeout on a request that succeeds. Add a test that delays the response past the client timeout and asserts exactly one charge — that is the scenario the whole feature exists for, and it was the one thing never tested.',
    },
  ],
  outcome:
    'The client fix removes the cause; the server-side duplicate detection catches the class of bug if it returns. The lasting lesson is where the key must live: an idempotency key generated per network attempt is not an idempotency key at all, and no amount of correct server code compensates for that.',
  problemSlug: 'payment-ledger',
}
