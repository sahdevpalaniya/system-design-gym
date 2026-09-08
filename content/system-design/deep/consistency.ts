import type { DeepDive, WorkedExample } from '@/lib/types'

export const CONSISTENCY_DEEP: DeepDive = {
  intro:
    'The summary said "precise words for how out of date a read is allowed to be". This page makes them precise. It covers the six models in the order of what they cost, how to pick one per feature rather than per system, the exact mechanics of read-your-own-writes, why eventual consistency lets reads go backwards, what strong consistency actually costs on a good day, and the sentence that turns this from vocabulary into a design.',
  minutes: 20,
  sections: [
    {
      heading: 'The six models, cheapest first',
      body: [
        'These are not a quality ladder where stronger is better. They are prices. Each one costs more than the one below it, and the skill is choosing the cheapest one that keeps users from seeing something wrong.',
      ],
      table: {
        caption: 'What each model promises, and what it costs to promise it.',
        headers: ['Model', 'Promise', 'Cost'],
        rows: [
          ['Eventual', 'Copies agree if writes stop', 'Reads can go backwards in time'],
          ['Monotonic reads', 'You never see an older value than one you saw', 'Pin a user to one replica'],
          ['Read-your-own-writes', 'You always see your own changes', 'Route that user\'s reads carefully'],
          ['Consistent prefix', 'Causes appear before effects', 'Route related writes through one partition'],
          ['Causal', 'Everything with a dependency appears in order', 'Track causality metadata'],
          ['Strong (linearizable)', 'Any read anywhere sees the last confirmed write', 'A majority round trip, forever'],
        ],
      },
      points: [
        'Read-your-own-writes covers most user-facing complaints for a fraction of the cost of strong consistency.',
        'Monotonic reads is nearly free and removes a whole class of "the page keeps flickering" bugs.',
        'Causal consistency is usually what people mean when they say a system "feels" correct.',
        'Strong consistency is the only one that costs you on every operation whether or not anything is broken.',
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Treating the list as a ladder and reaching for the top. Strong consistency on a like count means paying a majority round trip so nobody ever sees a number one lower than the true value for two seconds.',
        },
      ],
    },
    {
      heading: 'Eventual consistency lets reads go backwards',
      body: [
        'This is the property that surprises people, and it is legal rather than a bug. Under eventual consistency there is no promise about *when* copies agree, and no promise that a sequence of reads sees a non-decreasing view of the world.',
        'Concretely: you load a page and see a comment count of 42, served by a replica that is caught up. You refresh and see 41, because the load balancer sent you to a replica that is three seconds behind. Nothing failed. Both answers were legal.',
      ],
      points: [
        'The fix is monotonic reads: pin a user to one replica, usually by hashing their session id, so their view of history only moves forward.',
        'It costs almost nothing, and it means one slow replica affects a fixed set of users rather than randomly affecting everyone.',
        'A refresh producing an older value is one of the most reported and least understood bugs in replicated systems.',
        '"Eventually consistent" without a number is a phrase, not a design. Say how long eventual is, and what the user sees in the meantime.',
      ],
      visuals: [
        {
          type: 'diagram',
          diagram: {
            caption:
              'Two reads, two replicas, time moving backwards. Both answers are legal under eventual consistency — pinning the user to one replica is what makes their view monotonic.',
            nodes: [
              { id: 'u', label: 'User', kind: 'client', col: 0, row: 1 },
              { id: 'r1', label: 'Replica A', sub: 'caught up — 42', kind: 'store', col: 1, row: 0 },
              { id: 'r2', label: 'Replica B', sub: '3s behind — 41', kind: 'store', col: 1, row: 2 },
              { id: 'n', label: 'refresh lands on B, count drops, nothing is broken', kind: 'note', col: 2, row: 1, span: 2 },
            ],
            edges: [
              { from: 'u', to: 'r1', label: 'read 1' },
              { from: 'u', to: 'r2', label: 'read 2' },
            ],
          },
        },
      ],
    },
    {
      heading: 'Read-your-own-writes, mechanically',
      body: [
        'This is the single highest-value guarantee in a user-facing product, because almost every "the app lost my change" report is this and nothing else. It is also far cheaper than making the whole system strongly consistent, because you only have to be careful about one user\'s reads rather than about everybody\'s.',
        'There are three implementations, in increasing precision and increasing effort.',
      ],
      points: [
        '**Session pinning**: after a user writes, mark their session and send their reads to the leader for a fixed window — ten or thirty seconds. Two lines of code. The window is a guess, and leader read load rises with your most active users.',
        '**Write position tokens**: the write returns the log position it committed at, the client carries it, and a read waits for a replica that has reached at least that position. Precise, no guessed window, no unnecessary leader load — and reads can now block, which is a new latency risk.',
        '**Client-side rendering**: do not re-fetch at all. The client already has the value it just submitted, so render that. Free, and it only covers the exact thing they just wrote.',
        'Real systems use the third where they can and the first everywhere else, moving to the second when leader load becomes measurable.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"A user\'s reads go to the leader for ten seconds after they write, so they always see their own changes. Everyone else reads replicas with a second or two of lag. Cost: leader read load rises with exactly my most active users, and I would move to write-position tokens if that became the bottleneck."',
        },
      ],
    },
    {
      heading: 'What strong consistency actually costs',
      body: [
        'People choose strong consistency because it feels safe, and then are surprised that the system is slow when nothing is broken. That surprise comes from learning only the first half of PACELC.',
        'Strong consistency means a write is not confirmed until a majority agrees, and often that a read consults a majority too. That is a round trip added to every operation, permanently. Inside one datacenter it is about half a millisecond and really cheap. Across regions it is 80 milliseconds or more, and it applies on every good day, not just during failures.',
      ],
      visuals: [
        {
          type: 'numbers',
          numbers: {
            caption: 'The permanent price of strong consistency, by where your replicas live.',
            items: [
              { label: 'Local write, no coordination', value: 1, display: '~1 ms', tone: 'accent' },
              { label: 'Majority within one datacenter', value: 2, display: '~2 ms', tone: 'muted' },
              { label: 'Majority across regions', value: 80, display: '~80 ms, on every write, forever', tone: 'bad' },
            ],
            note: 'The last row is not a failure cost. It is what you pay on a completely healthy Tuesday, which is the half of PACELC most people never learn.',
          },
        },
      ],
      points: [
        'Strong consistency also means unavailability on the minority side of a network split. That is a choice you make on purpose, and for seats or balances it is the right one.',
        'It does not scale by adding nodes — a bigger majority is slower to convince.',
        'Use it on the specific operation that needs it, not on the whole system. The same product can have a strongly consistent checkout and an eventually consistent feed.',
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Choosing strong consistency for the whole system to avoid thinking about it per feature means every read of every like count pays for a guarantee only your payment path needed.',
        },
      ],
    },
    {
      heading: 'Choosing per feature — the sentence that scores',
      body: [
        'The move that turns this from vocabulary into design is going feature by feature, out loud, in one breath. It demonstrates that you understand these as prices rather than as qualities.',
        'A worked version for a social commerce product: "The like count is eventually consistent — a second of lag is invisible and I am not spending a round trip on it. A user\'s own posts are read-your-own-writes, or they will think it failed and post again. Comments under a post are causally consistent, so nobody sees a reply above the thing it replies to. The stock check at checkout is strongly consistent, and I accept the extra latency there because selling the same item twice costs real money."',
      ],
      points: [
        'Anything a human cannot tell is two seconds old: eventual.',
        'Anything the user just did: read-your-own-writes.',
        'Anything with a visible cause and effect: causal or consistent prefix.',
        'Anything contested and irreversible: strong, and say you accept the latency.',
        'Naming four features with four different answers is worth more than any definition you could recite.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Feed and counts eventual, own posts read-your-own-writes, comment threads causally ordered, checkout strong. Four features, four different prices — and the reason each one is different is what the failure costs, not what the database supports."',
        },
      ],
    },
    {
      heading: 'The mistakes that cost points',
      body: [
        'These come up repeatedly and each one is avoidable with a single extra sentence.',
      ],
      points: [
        'Saying "eventually consistent" with no number. How long is eventual, and what does the user see meanwhile?',
        'Applying one model to the whole system. Real products need four different answers and saying so is the signal.',
        'Forgetting that eventual consistency permits reads to go backwards, then being unable to explain the flickering count.',
        'Checking a value in application code and then writing — that gap is a race no consistency model closes for you.',
        'Confusing consistency with durability. A write can be strongly consistent and still lost if it was never fsynced.',
        'Confusing the C in ACID with the C in CAP. They are unrelated: the first means database constraints hold, the second means all replicas agree.',
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'The last one is a genuine trap rather than being fussy. Being able to say "those are two different words that happen to share a letter" is a small, reliable senior signal.',
        },
      ],
    },
  ],
}

export const CONSISTENCY_EXAMPLE: WorkedExample = {
  title: 'Four features, four different answers',
  scenario:
    'You are designing a marketplace. It has a product page with a view count, seller inventory, buyer reviews with replies, and a checkout. A junior engineer proposes making the whole system strongly consistent "to be safe". Your job is to price that proposal and then decide feature by feature.',
  steps: [
    {
      step: 'Price the blanket proposal',
      detail:
        'Strong consistency everywhere means a majority round trip on every read and write. The product page alone does about eight reads, so at 2 ms of added coordination each that is 16 ms added to a page nobody needed protected — and if replicas ever span regions it becomes 640 ms and the product is unusable. It also means the page goes down entirely on the minority side of a network split, including the parts that could have been served perfectly well. Safety was not free and it was not even safety.',
    },
    {
      step: 'View count: eventual',
      detail:
        'Nobody can tell a view count is two seconds old, and nobody makes a decision from it. Eventual consistency, sharded counters, cached total refreshed every few seconds. The cost is that the number can briefly go backwards on refresh, which I remove cheaply by pinning a user to one replica — monotonic reads for almost nothing.',
    },
    {
      step: 'Seller inventory: two answers, not one',
      detail:
        'This is the interesting one, because the same data needs different guarantees in different places. The "3 left" badge on the browse page can be eventually consistent and slightly wrong — the worst case is mild disappointment. The stock check inside checkout must be strongly consistent, and specifically must be a conditional update inside the transaction that reserves the item, not a read followed by a decision. Same field, two guarantees, chosen by what being wrong costs at that moment.',
    },
    {
      step: 'Reviews and replies: causal',
      detail:
        'A reply appearing above the review it answers is not slow, it is nonsense, and users report it as a bug. But full strong consistency is not needed — nobody minds if a review takes two seconds to appear, only that it appears in the right order relative to its parent. So route all writes for one review thread through one partition, and ordering is free with no coordination at all.',
    },
    {
      step: 'The seller\'s own listing: read-your-own-writes',
      detail:
        'A seller edits a price and reloads. If a lagging replica serves that read, they see the old price, assume it failed, and edit again — creating a support ticket and possibly a duplicate. Pin their reads to the leader for ten seconds after any write. This is the cheapest fix on the whole page and it prevents the most common complaint.',
    },
    {
      step: 'Say the whole thing in one breath',
      detail:
        '"Counts eventual with monotonic reads. Browse-page stock eventual, checkout stock strongly consistent via a conditional update. Review threads causally ordered by partitioning on thread id. A seller\'s own edits read-your-own-writes for ten seconds. Four features, four prices, each chosen by what being wrong costs."',
    },
  ],
  outcome:
    'The design pays for strong consistency on exactly one operation — the one where being wrong means selling stock you do not have — and pays nothing for it everywhere else. The blanket proposal would have cost 16 ms on every page load and taken the whole product down during a network split, in exchange for protecting a view counter nobody was going to complain about.',
  problemSlug: 'ticket-booking',
}
