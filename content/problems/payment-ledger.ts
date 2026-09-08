import type { Problem } from '@/lib/types'

export const PAYMENT_LEDGER: Problem = {
  slug: 'payment-ledger',
  title: 'Payments and ledger',
  group: 'money',
  difficulty: 'hard',
  concepts: [
    'transactions-and-locking',
    'idempotency',
    'distributed-transactions',
    'auth-and-security',
    'observability',
    'backups-and-recovery',
    'deploys-and-releases',
    'message-queues',
  ],
  prompt:
    'Design the payment system behind a marketplace. Customers pay, money is held, sellers are paid out, refunds happen, and the books must balance exactly. An external payment provider holds the real money.',

  slack: {
    budget: 'Authorisation: seconds. Capture: minutes. Settlement and payout: hours to days.',
    headline:
      'A person is waiting to find out whether their payment worked, and that is the only part with no slack. Everything behind it — capture, ledgers, payouts, reconciliation — has hours, and using that is what makes the system correct.',
    body: [
      'Authorisation has seconds of slack at most. A customer is on the checkout page and every second past about three feels broken, so this call is synchronous, it has a hard timeout, and it must give a definite yes or no. This is one of the rare cases where a queue is the wrong answer, because "we will let you know" is not an acceptable response to "did I buy it".',
      'Capture — actually taking the authorised money — usually has minutes or more, and often should not happen until the seller confirms the order. Payouts to sellers are on a schedule measured in days. Reconciliation against the provider runs nightly. All of that is background work, and it can retry patiently, because nobody is watching any single one.',
      'The thing with zero slack and no way to buy any is **correctness**. A payment recorded twice, or money moved with no matching ledger entry, is not a latency problem that resolves itself. It is a permanent discrepancy that someone finds weeks later during an audit, and every hour it exists makes it harder to explain.',
    ],
    consequence:
      'A short synchronous authorisation path with a hard timeout, and everything after it asynchronous, idempotent and reconciled. The ledger is append-only so history cannot be rewritten, and a nightly job compares our books against the provider\'s.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'Are you holding the money, or is a provider? That changes everything.',
        'One currency or many? Multi-currency is a whole extra system.',
        'What is the worst acceptable outcome — losing money, or refusing a valid payment?',
      ],
      model: [
        'Assumptions: a marketplace with buyers and sellers, an external provider like Stripe or Adyen actually moving the money and holding the regulated relationship, one currency to start, and we hold funds briefly between the buyer paying and the seller being paid out.',
        'The question that changes a box: are we a regulated money transmitter, or is the provider? Because if we hold customer funds ourselves, we need segregated accounts, regulatory reporting and a compliance surface that dwarfs the engineering. I will assume the provider is the regulated party and we are recording our view of what they did — and I will say clearly that our ledger is a mirror, not the source of truth. The provider\'s records are the truth, which changes how we resolve every disagreement.',
        'Second question: is it acceptable to occasionally decline a valid payment, or to occasionally accept an invalid one? They are not symmetric. Declining a good payment costs a sale. Accepting a bad one costs the money plus a chargeback fee plus investigation time. I will assume we err toward declining, which means when in doubt we fail closed.',
        'Scope I propose: authorising and capturing a payment, recording it in a double-entry ledger, refunds, seller payouts, and reconciliation against the provider. Out of scope: fraud scoring, tax calculation, and multi-currency conversion — each is a separate system, and I would flag fraud in particular as something a real design would not omit.',
      ],
      checklist: [
        'Established who is the regulated party, and that our ledger mirrors the provider',
        'Named the provider\'s records as the source of truth for disputes',
        'Asked which error direction is acceptable, and chose fail-closed',
        'Proposed a scope and named fraud as a deliberate, flagged omission',
        'Did not claim to be building a bank',
      ],
      tradeoffs: [
        {
          decision: 'Provider holds the money',
          cost: 'We depend on their availability and their fee structure, and we cannot see the money directly. In exchange we avoid becoming a regulated institution, which is not an engineering trade at all.',
        },
      ],
      sayThis:
        '"The provider is the regulated party and holds the money — our ledger is our view of what they did, and their records win any disagreement. One question: do we ever hold funds ourselves? That answer decides whether this is a payments integration or a bank."',
      trap: 'Designing card number storage and PCI scope. If the provider tokenises cards, you never touch a card number, and saying so is worth more than describing an encryption scheme.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a payment\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'The provider is an actor with its own outages and its own opinions.',
        'What does the system decide silently on everyone\'s behalf?',
        'What happens when you call the provider and never get a reply?',
      ],
      model: [
        'Actors: the buyer, the seller, the payment provider, the buyer\'s bank behind the provider, and the system itself — which decides when to capture, when a hold expires, when a payout is due, and when a discrepancy needs a human. The buyer\'s bank matters because it can reverse a payment months later through a chargeback, which means "settled" is never truly final.',
        'The chain: initiated → authorised, meaning the money is held but not taken → captured, meaning it is actually taken → recorded in the ledger → funds held pending → paid out to the seller → reconciled. Branching off it: refunded, and separately disputed by chargeback, which can arrive up to 120 days later and reverses a payment we already paid out on.',
        'Failure branches, and this is where the whole design is. **The timeout on the provider call is the worst case in the system**: we sent an authorisation, got no response, and do not know whether it succeeded. We must never simply retry, because that risks a double charge. The answer is that every request carries an idempotency key, so a retry with the same key returns the original result rather than creating a second charge — and if we are still unsure, we query the provider by our own reference rather than sending anything new.',
        'More branches. Authorised but never captured: holds expire after days, so an order stuck in review silently loses its authorisation and the payment must be re-taken. Captured but our database write failed: the money moved and our books do not show it, which reconciliation must catch — and this is exactly why the provider is the source of truth. Refund requested for a payout already made: we are now trying to claw back money the seller has, which is a business rule, not a technical one, and the design must surface it rather than silently fail. Chargeback 90 days later: reverses a settled payment, and the ledger must express that as a new correcting entry rather than editing history.',
      ],
      checklist: [
        'Separated authorise from capture and said why they are different states',
        'The provider timeout named as the worst case, with idempotency keys as the answer',
        'Query rather than retry when the outcome is unknown',
        'Authorisation expiry as a real branch that loses the payment',
        'Chargebacks arriving months later, reversing something already paid out',
        'Corrections are new entries, never edits to history',
      ],
      trap: 'Treating the provider call as either success or failure. The third outcome — no answer — is the one that produces double charges, and it is what the interviewer is waiting for.',
    },

    {
      id: 3,
      ask: 'Estimate transaction volume, ledger growth and the cost of getting it wrong. Then finish: "So the hard part here is ___."',
      nudges: [
        'Payment volume is small compared to almost anything else. Say so.',
        'How many ledger rows does one payment create?',
        'What does one incorrect transaction actually cost to resolve?',
      ],
      model: [
        'Assume a marketplace doing 10 million transactions a month. That is about 4 per second on average, maybe 40 at peak on a sale day. That is a genuinely tiny number, and saying it out loud early is important, because it tells me throughput is not the problem and I should not spend a minute on sharding.',
        'Ledger growth: double-entry means each event writes at least two rows, and a single payment produces several events — authorise, capture, fee, payout, and possibly refund. Call it 10 rows per transaction, so 100 million rows a month, about 1.2 billion a year. At 200 bytes each that is around 240 GB a year. One database handles this comfortably for years, and I would partition by time for archival rather than for load.',
        'The cost of being wrong is the number that actually matters here, and it is not a technical one. One incorrect transaction costs a support contact, an investigation, possibly a refund plus a chargeback fee, and if it is systematic, an audit. Ten thousand wrong transactions is an existential event for a marketplace. So the acceptable error rate is effectively zero, and I would spend throughput freely to get correctness.',
        'That reframes everything. At 40 transactions a second I can afford a strongly consistent single-primary database, synchronous replication, full audit logging on every write, and a nightly reconciliation that reads every row — none of which would be affordable at a million a second.',
        'So the hard part here is exactly-once effects and reconciliation, not scale. The volume is trivial. Making sure that every movement of money appears exactly once in our books and matches the provider\'s is the entire job.',
      ],
      checklist: [
        'Stated the transaction rate and called it small, explicitly',
        'Ruled out sharding based on the number, rather than by habit',
        'Estimated ledger rows per transaction, not just transactions',
        'Quantified the cost of an error as the real constraint',
        'Used the low volume to justify expensive correctness measures',
        'Finished the sentence: exactly-once and reconciliation, not scale',
      ],
      tradeoffs: [
        {
          decision: 'Single primary, strongly consistent',
          cost: 'A write ceiling of a few thousand a second and unavailability during failover. At 40 a second I have two orders of magnitude of headroom, so this is the correct trade for years.',
        },
      ],
      sayThis:
        '"Forty transactions a second at peak, about 240 GB of ledger a year. That is small, so I will not shard, and I will happily spend throughput on correctness — synchronous replication, full audit trail, nightly full reconciliation. So the hard part here is exactly-once effects, not scale."',
      trap: 'Designing for scale that is not there. Reaching for sharding and eventual consistency on a system doing 40 transactions a second is the clearest possible signal that you did not read your own numbers.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'What does a double-entry ledger actually look like as a table?',
        'How does one action change our database and the provider together?',
        'What runs nightly, and what does it compare?',
      ],
      model: [
        'The **payment service** owns the synchronous path. It takes the checkout request, creates a payment record in `pending` with a generated idempotency key, calls the provider with that key, and records the outcome. The database write claiming the key happens in the same transaction as creating the payment record, so a retry cannot create a second payment.',
        'The **ledger** is the heart, and it is append-only double-entry. Every movement writes at least two rows that sum to zero: taking 100 from a buyer credits a buyer-funds account and debits a holding account. Nothing is ever updated or deleted — a refund is new rows that reverse the original, not an edit. That gives two properties worth stating: the sum of all rows for any account is its balance at any point in time, and the full history is reconstructable for an audit. The one invariant to assert continuously is that every transaction\'s rows sum to zero.',
        '**Balances** are derived from the ledger, and a running balance is a materialised total updated in the same transaction as the entries — never a separate counter that could drift. A periodic job recomputes balances from the raw entries and compares, because a materialised value that is never checked will eventually be wrong.',
        '**Crossing the boundary** to the provider is a distributed transaction problem with no distributed transaction available. So: a saga with an outbox. Reserving the order and writing the ledger entry happen in one local transaction, which also writes an outbox row. A relay publishes from the outbox, and a worker calls the provider. If the provider call fails permanently, a compensating entry reverses the ledger. Crucially, the irreversible step — taking the money — is ordered last, after everything reversible has succeeded.',
        '**Reconciliation** runs nightly against the provider\'s settlement report. Every payment they report is matched against our ledger, and both directions are checked: things they have that we do not, and things we have that they do not. Mismatches go to a queue for a human, and the count of unresolved mismatches is a metric with an alert, because a slow leak is far more dangerous than a sudden break.',
        '**Payouts** run on a schedule, aggregating a seller\'s earned balance minus fees and holds, and are themselves idempotent on a payout id so a retried run cannot pay twice. Every payout is a ledger entry like everything else.',
      ],
      checklist: [
        'Idempotency key claimed in the same transaction as the payment record',
        'Append-only double-entry ledger — corrections are new rows, never edits',
        'Invariant that every transaction\'s entries sum to zero',
        'Balances derived, materialised in the same transaction, and periodically recomputed',
        'Outbox plus saga for crossing to the provider, irreversible step ordered last',
        'Nightly two-way reconciliation with unresolved mismatches as an alerting metric',
        'Payouts idempotent on a payout id',
      ],
      tradeoffs: [
        {
          decision: 'Append-only ledger',
          cost: 'Storage only grows, and a simple "current balance" needs a materialised total rather than a column. In exchange, history cannot be quietly rewritten, which is the entire point for money.',
        },
        {
          decision: 'Saga rather than two-phase commit',
          cost: 'There are moments where the ledger and the provider disagree, visible in the UI as pending. Better than a coordinator failure leaving locks held across systems.',
        },
      ],
      sayThis:
        '"Append-only double-entry ledger where every transaction\'s rows sum to zero and a refund is new reversing rows rather than an edit. The provider call goes through an outbox and a saga, with taking the money ordered last. And a nightly two-way reconciliation, because our books are a mirror of theirs."',
      trap: 'A balance column that gets updated. It will drift, you will not know when it started, and reconstructing the truth means replaying every transaction you no longer have.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'The provider call timed out. Walk through exactly what happens next.',
        'Reconciliation finds 14 mismatches this morning. What now?',
        'How do you deploy a change to this safely?',
      ],
      model: [
        '**Hard part one: the unknown outcome.** We called the provider and got nothing back. The money may or may not have moved. Retrying blindly risks a double charge; giving up risks having taken money we do not record. The design has to make this survivable rather than clever. Every request carries an idempotency key generated by us and stored before the call, so a retry with that same key returns the original outcome from the provider rather than creating a second charge — every serious provider supports exactly this. If we are still unsure, we do not send anything; we query by our own reference. Meanwhile the payment sits in an `unknown` state, which the UI shows as processing, and a background job resolves it by querying. Cost: a customer can see "processing" for a minute, which is worse UX than a fast answer and dramatically better than a double charge. And `unknown` is a real state in the model, which people forget to include.',
        '**Hard part two: reconciliation mismatches.** Fourteen this morning. First, categorise, because the categories have different urgency: in their report and not in ours means we took money without recording it, which is the most serious and usually points at a crash between the provider call and our write. In ours and not theirs usually means an optimistic write we should never have made. Amount mismatches are usually fee handling or rounding. Second, resolve mechanically where possible — for the first category, the provider is the truth, so we write the missing ledger entries with a correcting reference and record why. Third, anything not mechanically resolvable goes to a human with full context. What matters most is the trend rather than the number: fourteen is a normal Tuesday, fourteen thousand is an incident, and a slow rise from two to fourteen over a month is a bug someone shipped. So the alert is on the rate of change and on unresolved age, not on a threshold.',
        '**Deploying to this safely.** Money code is where a bad release is most expensive, so: canary at 1% with automatic rollback on error rate, schema changes strictly expand-and-contract so nothing is ever renamed in place, and a rule that ledger schema changes are additive only. Every write carries the code version, so a discrepancy can be traced to a release. Cost: a change takes days instead of hours, which is correct for this system and would be excessive elsewhere.',
        '**Access and audit.** Nobody has write access to the ledger in production, including engineers — corrections go through a tool that writes correcting entries with an operator id and a reason. Every read of payment data is logged. Cost: fixing a data problem is slower and more bureaucratic, which is exactly what you want when the data is money.',
      ],
      checklist: [
        'An explicit unknown state, resolved by querying rather than retrying',
        'Idempotency keys stored before the provider call, not after',
        'Mismatches categorised, with the provider as the truth',
        'Alerting on the rate of change and unresolved age, not a fixed threshold',
        'Canary with automatic rollback, and additive-only ledger schema changes',
        'No direct write access in production; corrections through an audited tool',
      ],
      tradeoffs: [
        {
          decision: 'Query rather than retry on an unknown outcome',
          cost: 'The customer waits longer and sees a processing state. Vastly better than a double charge, which costs a refund, a fee and trust.',
        },
        {
          decision: 'No direct production write access',
          cost: 'Incident resolution is slower and needs tooling built in advance. Correct for money, excessive almost anywhere else.',
        },
      ],
      sayThis:
        '"The worst case is not failure, it is an unknown outcome — so every provider call carries an idempotency key stored before we send it, and when we are unsure we query rather than retry. Payments sit in an explicit unknown state that a background job resolves. And reconciliation alerts on the rate of change, because a slow leak is more dangerous than a sudden break."',
      trap: 'No reconciliation. Without it, a discrepancy that starts today is discovered by an accountant next quarter, and by then nobody can reconstruct what happened.',
    },
  ],

  lifecycle: {
    caption:
      'A payment\'s life. Note the unknown branch and the chargeback arriving months after settlement — both are states, not errors, and both must exist in the model.',
    states: [
      { id: 'init', label: 'Initiated', by: 'buyer' },
      { id: 'auth', label: 'Authorised (held)', by: 'provider' },
      { id: 'cap', label: 'Captured', by: 'system' },
      { id: 'ledger', label: 'Recorded in ledger', by: 'system' },
      { id: 'payout', label: 'Paid out to seller', by: 'system' },
      { id: 'recon', label: 'Reconciled', by: 'system' },
    ],
    failures: [
      { after: 'init', label: 'Provider call times out', handling: 'unknown state — query by our reference, never blindly retry' },
      { after: 'init', label: 'Client retried checkout', handling: 'idempotency key claimed in the same transaction — one payment, not two' },
      { after: 'auth', label: 'Hold expires before capture', handling: 'authorisation lost; the payment must be re-taken, and the order state says so' },
      { after: 'cap', label: 'Money taken, our write failed', handling: 'nightly reconciliation finds it; provider is the truth, we write the missing entries' },
      { after: 'payout', label: 'Refund after payout', handling: 'clawback is a business rule — surface it, never silently fail' },
      { after: 'recon', label: 'Chargeback 90 days later', handling: 'new correcting ledger entries; history is never edited' },
    ],
  },

  architecture: {
    caption:
      'A short synchronous path to the provider, then everything asynchronous through an outbox. The ledger is append-only and reconciled nightly against the provider.',
    nodes: [
      { id: 'b', label: 'Buyer', kind: 'client', col: 0, row: 0 },
      { id: 'p', label: 'Payment svc', sub: 'idempotency key', kind: 'service', col: 1, row: 0 },
      { id: 'db', label: 'Ledger', sub: 'append-only, double entry', kind: 'store', col: 2, row: 0 },
      { id: 'ob', label: 'Outbox', sub: 'same transaction', kind: 'store', col: 2, row: 1 },
      { id: 'rel', label: 'Relay + workers', kind: 'service', col: 3, row: 1 },
      { id: 'prov', label: 'Provider', sub: 'holds the money', kind: 'external', col: 4, row: 0 },
      { id: 'rec', label: 'Reconciler', sub: 'nightly, two-way', kind: 'service', col: 3, row: 2 },
      { id: 'h', label: 'Human queue', sub: 'unresolved mismatches', kind: 'external', col: 4, row: 2 },
    ],
    edges: [
      { from: 'b', to: 'p' },
      { from: 'p', to: 'db', label: 'one txn' },
      { from: 'p', to: 'ob' },
      { from: 'p', to: 'prov', label: 'authorise' },
      { from: 'ob', to: 'rel' },
      { from: 'rel', to: 'prov', label: 'capture, payout' },
      { from: 'prov', to: 'rec', label: 'settlement file' },
      { from: 'rec', to: 'db', label: 'compare' },
      { from: 'rec', to: 'h', dashed: true },
    ],
  },

  numbers: {
    caption: 'The volume is trivial. That is the finding, and it licenses expensive correctness everywhere else.',
    items: [
      { label: 'Transactions at peak', value: 40, display: '~40 / sec — very small', tone: 'muted' },
      { label: 'Ledger rows per year', value: 1200, display: '~1.2 billion rows, ~240 GB', tone: 'muted' },
      { label: 'Acceptable error rate', value: 0, display: 'effectively zero', tone: 'bad' },
    ],
    note: 'So the hard part is exactly-once effects and reconciliation, not scale. At 40 a second I can afford a single strongly consistent primary, synchronous replication and a nightly full reconciliation — none of which would be affordable at a million a second.',
  },

  followUps: [
    'consistency-double-charge',
    'consistency-two-systems',
    'kill-dependency',
    'scope-audit',
    'ops-rollback',
    'ops-migration',
    'choice-sql-for-scale',
    'kill-worker-mid-job',
  ],
}
