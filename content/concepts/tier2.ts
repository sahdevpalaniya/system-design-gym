import type { Concept } from '@/lib/types'

export const TIER2: Concept[] = [
  {
    slug: 'replication',
    title: 'Replication',
    tier: 2,
    oneLine: 'Keep the same data on several machines — and decide who is allowed to change it.',
    problem: [
      'One copy of your data means one machine whose failure loses everything, and one machine that must serve every read. Replication fixes both: extra copies survive a failure and can answer reads.',
      'The whole difficulty is writes. As soon as two copies can be written independently, they can disagree, and you have to decide in advance who wins.',
    ],
    cost: 'Copies take time to arrive, so a replica can serve data that is out of date — and the user who just wrote something is the one most likely to notice. You also pay for the extra machines, and failover between copies is genuinely hard to get right: promote too eagerly and you get two leaders, too slowly and you are down.',
    useWhen: [
      'You need to survive a machine or a whole datacenter dying.',
      'Reads outnumber writes and you want to spread them.',
      'You want users on another continent to read locally.',
    ],
    avoidWhen: [
      'You are adding replicas to fix write throughput. Replication does not help writes; every replica does every write. Partitioning is the tool for that.',
      'Your application cannot tolerate any staleness anywhere and you have not planned which reads must go to the leader.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'replication-lag',
        caption:
          'The write lands on the leader immediately. The copy takes time to reach the follower. A read in that gap sees the old value — this is replication lag, and it is the source of most "the app lost my change" reports.',
      },
    },
    body: [
      'Leader–follower is the default and the one to reach for. All writes go to one leader; followers copy from it and serve reads. Simple, no write conflicts by construction, and it is what a normal relational database does out of the box. The costs: the leader is a write bottleneck, and when the leader dies something has to notice and promote a follower, during which writes fail.',
      'Failover has a specific, nasty failure mode worth naming: split brain. The old leader was not dead, only unreachable, so now there are two leaders taking writes and they diverge. The defence is a majority — only a node that can talk to more than half the cluster may be leader — plus fencing, so the old leader is refused by the storage layer when it comes back. Also, whatever the old leader accepted and had not yet copied is simply gone, and someone must decide whether that is acceptable.',
      'Synchronous versus asynchronous replication is the real knob. Synchronous means the write is not confirmed until a follower has it — no data loss on failover, but writes now wait for the slowest follower, and if that follower is down writes stop. Asynchronous means fast writes and a window of loss. The common middle ground is semi-synchronous: one follower synchronous, the rest asynchronous. You get durability without depending on all of them.',
      'Multi-leader means several leaders accept writes, usually one per region. Local writes are fast everywhere, and now the same row can be edited in two places at once and you must resolve it: last-write-wins (simple, silently discards someone\'s work, and depends on clocks you cannot trust), application-defined merge, or a data type designed to merge cleanly. Use it when local write latency truly matters and conflicts are rare — collaborative editing, offline-first apps.',
      'Leaderless means the client writes to several nodes and reads from several. With N copies, if writes go to W nodes and reads to R nodes and W + R > N, any read overlaps at least one node that saw the latest write. Tunable, resilient, and it pushes conflict handling onto you — plus repairs happen lazily, so a node can serve stale data until it is fixed.',
    ],
    followUp: {
      q: '"Replica lag is 30 seconds and a user reads their own write. What do they see?"',
      answer:
        'Old data, and they will report it as a bug — they just posted a comment and it vanished. This is the read-your-own-writes problem, and the general answer is to route certain reads to the leader. Concretely: after a user writes, mark their session for a short window and send their reads to the leader during it. Or record the write position at commit time, and have the read wait until a replica has caught up to at least that position — more precise, and it means reads can block. A cheaper trick for lists: show the user their own item from what they just submitted rather than re-fetching it. Cost of all of this: leader read load goes up, exactly for the users who are most active. And I would alarm on lag, because 30 seconds is a symptom — usually a long transaction or a bulk write hogging the leader.',
    },
    selfCheck: {
      q: 'You add five read replicas. Your write throughput is still maxed out. Why did that not help?',
      answer:
        'Because every replica applies every write. Adding replicas multiplies read capacity and adds zero write capacity — in fact it adds a little load to the leader for shipping the log. The write ceiling is set by what one leader can commit. To raise it you have to split the data so different writes go to different machines, which is partitioning, not replication. Saying this out loud is worth a lot, because reaching for replicas to fix a write problem is one of the most common wrong turns in a design interview.',
    },
    traps: [
      'Assuming failover is automatic and instant. Somebody has to detect the failure, and detection has a timeout, and the timeout is downtime.',
      'Drawing async replication and then promising no data loss.',
      'Multi-leader with no conflict resolution story. That is the entire question.',
    ],
    sayThis:
      '"Single leader with two async followers, plus one semi-sync follower so a failover does not lose committed writes. Reads go to followers except within ten seconds of a user\'s own write, which go to the leader. Cost: the leader is still my write ceiling, and failover means a few seconds of write errors."',
    related: ['partitioning', 'consistency-models', 'cap-pacelc', 'consensus'],
  },

  {
    slug: 'partitioning',
    title: 'Partitioning (sharding)',
    tier: 2,
    oneLine: 'Split the data so different machines own different pieces — the only way to scale writes.',
    problem: [
      'When one machine can no longer hold the data or take the write rate, you split it. Each machine owns a slice, so ten machines take roughly ten times the writes.',
      'Everything then depends on one decision: what you split by. Pick well and the system scales quietly for years. Pick badly and you get a single overloaded machine while nine sit idle, and fixing it means moving all the data.',
    ],
    cost: 'You lose the things that were free on one machine. Queries that do not include the shard key must ask every shard and merge the results. Transactions across shards need a distributed protocol or a redesign. Joins across shards are painful. Unique constraints across shards are not free. And rebalancing when you add capacity is an operational project, not a config change.',
    useWhen: [
      'Write throughput exceeds what one machine can commit — you have the number.',
      'The dataset genuinely does not fit, or backups and recovery have become unmanageable.',
      'You need to isolate blast radius or keep certain data in certain countries.',
    ],
    avoidWhen: [
      'You have not filled one machine yet. Most systems never need this, and shipping it early costs you every future feature.',
      'Your access patterns are unpredictable and span everything. You will be doing scatter-gather on every query.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'sharding',
        caption:
          'The key decides the shard, every time, deterministically. Which means the key also decides whether your load is even — or whether one shard gets everything.',
      },
    },
    body: [
      'By range: shard A holds keys a–h, B holds i–p, and so on. Range queries are efficient because neighbours live together. The danger is skew — sharding by timestamp puts all of today\'s writes on one shard while the rest idle, which is the classic mistake.',
      'By hash: hash the key and take the remainder. Load spreads evenly, and you lose range queries entirely, because neighbouring keys land on unrelated machines. Plain modulo has a second problem: adding a machine changes almost every mapping, so nearly all the data has to move. Consistent hashing exists to fix that.',
      'Hot partitions are the failure everyone hits. Sharding a social product by user id is even until one user has 200 million followers and their shard melts. Defences: give the hot key extra sub-partitions by appending a small random suffix and fanning the reads — more read work for everyone in exchange for surviving the outlier; or detect the hot key and handle it on a separate path entirely, which is what most real systems end up doing. Say out loud that even distribution of keys does not mean even distribution of traffic.',
      'Choosing the key: it should be present in almost every query, so most requests hit one shard; it should have high cardinality; and its traffic should be roughly even. User id and tenant id are usually good. Timestamps are usually bad. A composite like (tenant_id, entity_id) is often the right shape.',
      'Resharding is where the difficulty is hiding. Doing it with no downtime means dual-writing to old and new layouts, backfilling history, verifying the two agree, switching reads over, then removing the old path — weeks of work. The way to avoid it is to start with far more logical partitions than machines, say 1024, and map many logical partitions to each physical machine. Then growing means moving whole logical partitions, no re-hashing at all. Mentioning this in an interview is a strong signal.',
    ],
    followUp: {
      q: '"One user has 200 million followers. What breaks?"',
      answer:
        'The shard holding that user, and then whatever depends on it. If I fan out writes to followers, one post from them creates 200 million writes, which floods the queue and delays everyone else\'s timeline, not just theirs. If I store their follower list on one shard, that shard is hot for reads too. The answer is to stop treating them like a normal user. Above a follower threshold, do not fan out — leave their posts in place and have readers pull them at read time, merging with their fan-out inbox. Most users get the cheap read; the handful of huge accounts get the expensive read, and there are few enough of them to cache aggressively. Cost: two code paths for the same feature, forever, plus a threshold that needs tuning, and timelines are now assembled from two sources so ordering needs care.',
    },
    selfCheck: {
      q: 'You shard a messaging system by message id, hashed. What query just became expensive, and what would you shard by instead?',
      answer:
        '"Give me this conversation\'s last 50 messages" — the single most common query in the product. Hashing by message id scatters one conversation across every shard, so that read becomes a scatter-gather over the whole cluster, then a merge and sort. Shard by conversation id instead, and sort by timestamp within it: one conversation lives on one shard, and the hot query is one sequential read. The trade is that a single enormous group chat becomes a hot partition, which is a much rarer problem and one you can handle specifically.',
    },
    traps: [
      'Sharding by timestamp. Every write goes to the newest shard.',
      'Choosing a key that is not in your main query, so every read hits every shard.',
      'Assuming rebalancing is easy. Plan the logical-partition trick up front or budget weeks later.',
    ],
    sayThis:
      '"Hash-partition by conversation id into 1024 logical partitions mapped onto 16 machines, so growing means moving partitions rather than re-hashing. Cost: any query that is not scoped to a conversation becomes a scatter-gather, and a very large group chat can still make one partition hot — I would handle those specifically rather than change the scheme."',
    related: ['consistent-hashing', 'replication', 'sql-vs-nosql'],
  },

  {
    slug: 'cap-pacelc',
    title: 'CAP and PACELC as real tradeoffs',
    tier: 2,
    oneLine: 'When the network breaks you must choose: refuse the write, or accept it and be inconsistent.',
    problem: [
      'Networks partition. Machines cannot tell "you are dead" from "I cannot reach you". When that happens a distributed system has exactly two options and no third one: keep answering with possibly-wrong data, or stop answering.',
      'CAP is that observation, and nothing more. It is genuinely useful once you stop treating it as a slogan and start applying it per operation.',
    ],
    cost: 'Using CAP as a label costs you accuracy. Real databases are not "CP" or "AP" in general — the same system is one thing for one operation and the other for another. And CAP only describes behaviour during a partition, which is rare. It says nothing about the normal case, which is where you actually live.',
    useWhen: [
      'Deciding what a specific operation should do when it cannot reach the machine that owns the truth.',
      'Justifying why the payment path and the like-count path can behave differently in the same product.',
    ],
    avoidWhen: [
      'Labelling a whole system. It is per-operation.',
      'Explaining ordinary latency. That is PACELC\'s second half, not CAP.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The partition has happened. You are already choosing — the only question is whether you chose deliberately.',
        a: {
          title: 'Refuse the write (consistency)',
          points: [
            'Only the side that can reach a majority accepts writes. The other side returns an error.',
            'Nobody ever sees two different truths. No merge to write, no apology to send.',
            'Users on the minority side are down, even though their machines are healthy.',
            'Right for: seats, stock, balances, unique names, anything you cannot un-sell.',
          ],
        },
        b: {
          title: 'Accept the write (availability)',
          points: [
            'Both sides keep taking writes and reconcile once the network heals.',
            'Everyone stays up. Nobody sees an error page.',
            'You now own a conflict resolution problem, and sometimes a business one.',
            'Right for: likes, view counts, drafts, presence, carts, anything where "we merged it" is fine.',
          ],
        },
        verdict:
          'Decide per operation, not per system. The same shopping app should refuse to confirm an order it cannot verify, and should happily accept an "add to cart" that it merges later. Saying that sentence in an interview is worth more than knowing what the letters stand for.',
      },
    },
    body: [
      'The precise statement: when the network partitions, you cannot have both consistency and availability. Not "pick two of three" — partitions are not optional, they happen to you. So the real choice is between the other two, and only while the partition lasts.',
      'PACELC completes it, and is the more useful half day to day. If there is a Partition, choose Availability or Consistency; Else — the 99.9% of the time when everything is fine — choose Latency or Consistency. That second clause is where systems actually differ. A store that confirms writes on one node is fast and can serve stale reads. A store that confirms only after a majority agrees is slower on every single write, forever, partition or not. Most people only learn the first half and then cannot explain why a strongly consistent database is slow on a good day.',
      'Worth being clear about: strong consistency costs latency permanently, not just during failures. That is the cost you name when you choose it.',
    ],
    followUp: {
      q: '"A whole region is down. What happens to your system?"',
      answer:
        'It depends which data, and I would answer per path. Reads: if I have replicas in other regions, reads keep working, possibly stale, and I would say how stale. Writes: if the leader was in the dead region, writes fail until something promotes a new leader elsewhere, which takes seconds to a minute depending on how aggressive the failover is — and being aggressive risks promoting during a brief network blip and ending up with two leaders. For contested resources like inventory I would rather be down for that region\'s writes than sell the same seat twice, so I accept the unavailability and say so. For non-contested things like posting a comment or recording a view, I would take the write locally and reconcile after. The thing I would not do is claim everything keeps working perfectly — that answer tells the interviewer I have not thought about it.',
    },
    selfCheck: {
      q: 'Your product has both "add to cart" and "confirm order". Should they make the same CAP choice? Explain in one sentence each.',
      answer:
        'No. Add to cart should stay available: if the network is broken, accept it locally and merge later, because the worst case is a cart with a duplicate item, which the user fixes in two seconds. Confirm order should refuse: if I cannot verify the stock and take payment against the real record, I return an error, because the worst case there is selling something we do not have, and that costs money, support time and trust. Same product, same request, opposite choice — driven by what the failure costs, not by which database we picked.',
    },
    traps: [
      'Reciting "pick two of three". Partitions are not something you pick.',
      'Calling a database "AP" or "CP" as if it were a fixed property. Most are configurable per operation.',
      'Forgetting the "else" half — that consistency costs latency even when nothing is broken.',
    ],
    sayThis:
      '"During a partition I would keep the browse and cart paths available and let them reconcile, and I would make checkout refuse rather than risk overselling. And even with no partition, that checkout path pays a few extra milliseconds per write for majority agreement — that is the price of never selling the same seat twice."',
    related: ['consistency-models', 'replication', 'consensus'],
  },

  {
    slug: 'consistency-models',
    title: 'Consistency models',
    tier: 2,
    oneLine: 'Precise words for how out of date a read is allowed to be.',
    problem: [
      'Once data lives on more than one machine, "is this current?" stops having one answer. Consistency models are the vocabulary for saying exactly how stale a read may be, so you can pick per feature instead of hand-waving.',
      'This is where interviews separate people. "It is eventually consistent" is a phrase. "A user sees their own comment immediately but sees other people\'s within about two seconds" is a design.',
    ],
    cost: 'Stronger guarantees cost latency on every operation and availability during failures. Weaker guarantees cost you correctness bugs that only appear under load, in production, and cannot be reproduced locally — and they move the difficulty into application code, where it is easy to get wrong quietly.',
    useWhen: [
      'Strong: money, inventory, seats, unique usernames, permission checks — anything where being wrong is not recoverable.',
      'Read-your-own-writes: anywhere a user edits something and immediately looks at it. This is most user-facing writes.',
      'Eventual: counts, feeds, search results, analytics, presence — anything a human cannot tell is two seconds old.',
    ],
    avoidWhen: [
      'Do not use strong consistency by default because it feels safer — you are paying latency on every read for a guarantee most of your features do not need.',
      'Do not use eventual consistency on a decision the user cannot undo.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Same write, three promises. Each row is a guarantee you can offer per feature — pick the cheapest one that keeps users from seeing something wrong.',
        nodes: [
          { id: 's', label: 'Strong', sub: 'read sees the write', kind: 'service', col: 0, row: 0 },
          { id: 's2', label: 'Always current', sub: 'costs latency always', kind: 'store', col: 1, row: 0 },
          { id: 'r', label: 'Read-your-writes', sub: 'you see yours', kind: 'service', col: 0, row: 1 },
          { id: 'r2', label: 'Others lag', sub: 'cheap, feels correct', kind: 'store', col: 1, row: 1 },
          { id: 'e', label: 'Eventual', sub: 'everyone lags', kind: 'service', col: 0, row: 2 },
          { id: 'e2', label: 'Converges later', sub: 'cheapest, most available', kind: 'store', col: 1, row: 2 },
        ],
        edges: [
          { from: 's', to: 's2' },
          { from: 'r', to: 'r2' },
          { from: 'e', to: 'e2', dashed: true },
        ],
      },
    },
    body: [
      'Strong (linearizable): once a write is confirmed, every later read anywhere returns it. The system behaves like one machine. Costs a majority round trip on writes and often on reads, and becomes unavailable on the minority side of a partition.',
      'Eventual: if writes stop, all copies converge. It promises nothing about when, and permits a read to go backwards in time — you refresh and see an older value than the one you just saw. That is legal and it surprises people.',
      'Read-your-own-writes: you always see your own changes; other people\'s may lag. This is the sweet spot for user-facing products and is much cheaper than strong consistency, because you only need to route one user\'s reads carefully rather than make the whole system agree. Implement by pinning a user to the leader briefly after a write, or by tracking the write position and reading from a replica that has caught up to it.',
      'Monotonic reads: you never see time go backwards. Achieved by keeping a user pinned to one replica, so they at least see one consistent timeline. Cheap, and it removes a whole class of "the page keeps flickering between two values" complaints.',
      'Causal consistency: things that depend on each other appear in order — nobody sees the reply before the comment. Weaker than strong, much cheaper, and usually what people actually mean when they say a system "feels" correct.',
      'The practical move in an interview: go feature by feature. "The like count is eventual, a second of lag is invisible. The comment you just posted is read-your-own-writes, or you will think it failed. The seat you just booked is strong, because two people cannot have it."',
    ],
    followUp: {
      q: '"Two users click at the same millisecond. What happens?"',
      answer:
        'It depends entirely on whether the thing they are clicking is contested. If it is a like button, both writes land, the count converges, and nobody cares — I would use an eventual counter and not spend a transaction on it. If it is the last seat, exactly one must win, and the way to guarantee that is to make the decision at a single point of serialisation: a conditional update in the database that only succeeds if the seat is still free, or a unique constraint on (event, seat) so the second insert simply fails. Notice I am not proposing to check-then-write in application code, because that is the race itself. The loser gets a clear message and a suggested alternative. Cost: that write path is now a strongly consistent operation, so it is slower and it becomes unavailable if the owning partition is unreachable — which I accept, because selling one seat twice is worse than an error message.',
    },
    selfCheck: {
      q: 'A user posts a comment and refreshes, and it is not there. Which consistency guarantee was missing, and what is the cheapest way to add it?',
      answer:
        'Read-your-own-writes. Their write went to the leader; their refresh was served by a replica that had not caught up. The cheapest fix is not to make the whole system strongly consistent — that would slow down every read for everyone. It is to route that one user\'s reads to the leader for a short window after they write, or to have the client pass the write position it saw and let the read wait for a replica at least that current. Cheaper still for this exact case: render the comment from what the client already has, and do not re-fetch at all. Cost of the leader-pinning approach: your most active users generate the most leader load.',
    },
    traps: [
      'Saying "eventually consistent" as if it were a design. How long is eventual, and what does the user see in the meantime?',
      'Applying one model to the whole system rather than per feature.',
      'Forgetting that eventual consistency lets reads go backwards.',
    ],
    sayThis:
      '"Feed and counts are eventually consistent, a couple of seconds of lag nobody notices. A user\'s own posts are read-your-own-writes, so I pin their reads to the leader for ten seconds after they write. The balance check at payment is strongly consistent, and I accept the extra latency there because being wrong costs real money."',
    related: ['replication', 'cap-pacelc', 'idempotency'],
  },

  {
    slug: 'consensus',
    title: 'Consensus, at concept level',
    tier: 2,
    oneLine: 'How a group of machines agrees on one answer when some of them are unreachable.',
    problem: [
      'Some decisions must have exactly one answer across the cluster: who is the leader, which config is live, who holds the lock. Ask each machine independently and they will disagree, especially during the failure you built this for.',
      'Consensus algorithms — Raft, Paxos — solve that. You will never implement one. You need to know what they give you, what they cost, and when to reach for something that already has one.',
    ],
    cost: 'Every decision needs a round trip to a majority, so it is slow compared to a local write and it gets slower the further apart the nodes are. The cluster stops accepting writes if it cannot reach a majority — that is deliberate. And it does not scale by adding nodes: more nodes means a larger majority to convince, so a 7-node cluster is slower than a 3-node one.',
    useWhen: [
      'Leader election and failover.',
      'Distributed locks and leases where two owners would be a disaster.',
      'Configuration and service membership that everyone must agree on.',
      'Small, critical metadata — which shard lives where.',
    ],
    avoidWhen: [
      'High-volume application data. Do not put a million writes a second through a consensus group; that is the wrong tool and it will not go.',
      'Anything where a slightly wrong answer is fine. Use a cheaper mechanism.',
      'When a single database with a unique constraint already gives you the guarantee — it does, and it is far simpler.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Five nodes. Three is a majority. The two on the minority side cannot make decisions — which is precisely what stops split brain.',
        nodes: [
          { id: 'c', label: 'Client', kind: 'client', col: 0, row: 1 },
          { id: 'l', label: 'Leader', sub: 'proposes', kind: 'service', col: 1, row: 1 },
          { id: 'f1', label: 'Follower', sub: 'ack', kind: 'store', col: 2, row: 0 },
          { id: 'f2', label: 'Follower', sub: 'ack', kind: 'store', col: 2, row: 1 },
          { id: 'f3', label: 'Follower', sub: 'unreachable', kind: 'external', col: 2, row: 2 },
          { id: 'n', label: 'leader + 2 acks = majority of 5, so the decision commits', kind: 'note', col: 0, row: 2, span: 2 },
        ],
        edges: [
          { from: 'c', to: 'l', label: 'decide' },
          { from: 'l', to: 'f1' },
          { from: 'l', to: 'f2' },
          { from: 'l', to: 'f3', dashed: true },
        ],
      },
    },
    body: [
      'What Raft actually does, in plain terms. One node is leader. All decisions go through it, and it appends them to an ordered log. It sends each entry to the others; once a majority has written it down, the entry is committed and can never be lost or reordered. If the leader stops sending heartbeats, the others wait a random moment and one of them stands for election; whoever gets votes from a majority becomes leader. Because a majority is more than half, two leaders cannot both be elected — that is the entire trick.',
      'What it guarantees: one ordered sequence of decisions that survives any minority failing, and no split brain. What it does not do: work when more than half are down; go faster with more nodes; or scale to high write volume.',
      'The practical version of all this is: do not build it. Use etcd, ZooKeeper, or the consensus already inside your database or orchestrator. The right answer to "how do you elect a leader" is usually "I would keep the leadership lease in etcd", not a description of an algorithm.',
      'Distributed locks deserve a warning. A lock held by a process that then pauses — garbage collection, a slow disk — can expire while that process still believes it holds it, and now two workers are doing the same job. Leases with expiry help but do not eliminate it. The robust pattern is a fencing token: every lock acquisition returns an increasing number, the process presents it with each write, and the storage layer rejects any write carrying an old number. If you cannot fence, make the operation idempotent so doing it twice is harmless — that is usually easier and it is the better answer in most interviews.',
    ],
    followUp: {
      q: '"Why not just use a lock in Redis?"',
      answer:
        'For many jobs that is genuinely fine, and I would say so rather than over-engineer. A single Redis with SET NX and an expiry gives you mutual exclusion cheaply, and if the worst case of two workers running is a duplicate email, take it. The reasons to reach for something stronger: a single Redis is a single point of failure, so if it dies the lock is gone; the multi-node variant makes assumptions about clocks that are debated; and expiry-based locks can be held by two processes at once when one pauses long enough for its lease to lapse without it noticing. So my rule is — if two holders means a duplicate side effect I can make idempotent, Redis is fine and simpler. If two holders means corrupted data or double-charging, I want a real consensus store and a fencing token, and I accept the extra latency and the extra system to operate.',
    },
    selfCheck: {
      q: 'You have a 5-node consensus cluster. Two nodes fail. Does it still work? What if three fail?',
      answer:
        'Two failing is fine: three remain, three is a majority of five, so decisions still commit — just with less headroom. Three failing stops it: the remaining two cannot form a majority, so the cluster refuses new decisions. It is still readable in a stale sense but it will not accept writes. That refusal is the feature, not a bug — the alternative is the two survivors making decisions while the other three do the same on the far side of a partition, and then you have two conflicting histories and no way to merge them. The rule of thumb: a cluster of 2f+1 tolerates f failures, so 3 nodes tolerate 1 and 5 tolerate 2, and you use odd numbers because 4 nodes tolerate the same single failure as 3 while being slower.',
    },
    traps: [
      'Proposing to implement Raft. Nobody wants that; they want to know you would use something that already has it.',
      'Putting application traffic through a consensus store.',
      'Trusting a lock without a fencing token or idempotency behind it.',
    ],
    sayThis:
      '"Leadership is a lease in etcd, renewed every few seconds. Only the lease holder runs the job. Cost: a majority round trip per renewal, and if etcd is unreachable nobody runs the job — which I prefer to two nodes running it. And the job itself is idempotent, so even a lease overlap is survivable."',
    related: ['replication', 'idempotency', 'cap-pacelc'],
  },

  {
    slug: 'idempotency',
    title: 'Idempotency, and why exactly-once is a myth',
    tier: 2,
    oneLine: 'Make doing it twice the same as doing it once, because it will happen twice.',
    problem: [
      'A request succeeds and the response is lost. The client cannot tell that from a failure, so it retries. If your handler charges a card, you have charged twice. This is not an edge case; at scale it happens constantly.',
      'You cannot prevent duplicate delivery — that is the myth. What you can do is make duplicates harmless, which is a solvable engineering problem.',
    ],
    cost: 'You need somewhere to remember what you have already done — a key store with a retention window — and that store is now on the critical path of every write. You have to decide how long to remember, and what to return for a repeat: the original result, ideally, which means storing the response too. And you have to pick a key carefully, because a bad key either misses real duplicates or blocks legitimate repeat requests.',
    useWhen: [
      'Payments, orders, transfers — anything that moves money or stock.',
      'Every consumer of a message queue, without exception. At-least-once delivery is the norm.',
      'Any endpoint a mobile client calls on a flaky network.',
      'Any operation with an external side effect: sending an email, calling a partner API.',
    ],
    avoidWhen: [
      'Naturally idempotent operations. Setting a value to X, or deleting by id, are already safe. Adding a key store there is pure cost.',
      'Pure reads.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Same key arrives twice. The first does the work and stores the result. The second never reaches the charge — it replays the stored response.',
        nodes: [
          { id: 'c', label: 'Client', sub: 'retries', kind: 'client', col: 0, row: 0 },
          { id: 's', label: 'Service', kind: 'service', col: 1, row: 0 },
          { id: 'k', label: 'Key store', sub: 'seen keys + result', kind: 'cache', col: 2, row: 0 },
          { id: 'p', label: 'Charge card', kind: 'external', col: 2, row: 1 },
          { id: 'n', label: 'second request stops here, returns the stored result', kind: 'note', col: 0, row: 1, span: 2 },
        ],
        edges: [
          { from: 'c', to: 's', label: 'Idempotency-Key' },
          { from: 's', to: 'k', label: 'claim key' },
          { from: 's', to: 'p', label: 'only if new' },
        ],
      },
    },
    body: [
      'The three delivery promises. At-most-once: send and forget, may be lost, almost never what you want. At-least-once: retry until acknowledged, may duplicate — this is what real systems give you. Exactly-once delivery is impossible in a network that can drop messages; you cannot distinguish a lost request from a lost response. What is achievable, and what people mean when they say exactly-once, is at-least-once delivery plus idempotent processing, which produces exactly-once effect. Say it that way and you will sound like you have shipped this.',
      'How to implement it. The client generates a key — a UUID per logical operation, generated once and reused across retries, not regenerated each attempt, which is the bug that quietly defeats the whole scheme. The server tries to insert that key into a table with a unique constraint, inside the same transaction as the work. If the insert fails, it is a duplicate, so return the stored response. Doing the key insert and the work in one transaction is what makes it airtight; two separate steps leave a window where you crash between them.',
      'Choosing the key. Client-generated UUIDs are best for user actions. For queue consumers, use the message id or a hash of the meaningful content. Avoid keys that include a timestamp or attempt number — those change per retry and defeat the purpose.',
      'Retention: keep keys long enough to cover the longest plausible retry, typically 24 hours to a few days, then expire them. Storing them forever is a growing table nobody prunes.',
      'The consumer version: process the message, record its id as done, and commit both together. If you cannot do it in one transaction — because the side effect is an external API — then make the external call carry its own idempotency key, and every serious payment provider supports exactly that.',
    ],
    followUp: {
      q: '"The write worked but the response was lost and the client retried. What happens?"',
      answer:
        'With idempotency keys, nothing bad: the retry carries the same key, the server finds it already claimed, and returns the original result — the client gets a success and the card is charged once. Without them, you charge twice and find out from a customer. The detail I would add is what happens if the retry arrives while the first request is still running — the key is claimed but there is no result yet. I would return a "in progress, retry shortly" status rather than either doing the work again or returning a wrong answer, so the client backs off and asks again. And I would make sure the client reuses the key across retries rather than generating a fresh one, because that is the most common way this gets implemented wrongly.',
    },
    selfCheck: {
      q: 'A queue delivers the same message twice. Name two ways to make that harmless, and say which you would prefer.',
      answer:
        'First: record processed message ids in a table with a unique constraint, and commit that record in the same transaction as the work — the duplicate hits the constraint and is discarded. Second: design the operation so repeating it changes nothing — set status to SHIPPED rather than increment a counter, upsert by a natural key rather than insert. I prefer the second when I can get it, because it needs no extra storage, no retention policy, and cannot be broken by someone forgetting to check. The first is the general fallback for when the work genuinely is not repeatable, like sending money. The one thing I would not do is try to guarantee the queue delivers once — that is not on offer.',
    },
    traps: [
      'Claiming a queue gives exactly-once delivery. It gives at-least-once and you supply the rest.',
      'Generating a fresh key on each retry attempt.',
      'Checking "have I seen this key" and doing the work in two separate steps, with a crash window between them.',
    ],
    sayThis:
      '"Every write endpoint takes an Idempotency-Key. I insert it with a unique constraint in the same transaction as the work, so a retry hits the constraint and I replay the stored response. Cost: an extra table on the write path and a retention window to manage — worth it, because at-least-once is the only delivery I can actually get."',
    related: ['message-queues', 'distributed-transactions', 'circuit-breakers'],
  },

  {
    slug: 'message-queues',
    title: 'Message queues and backpressure',
    tier: 2,
    oneLine: 'Write the job down now, do it soon, and survive the difference.',
    problem: [
      'When one part of a system is fast and the next is slow, calling directly means the fast part waits and users feel it. A queue lets the fast part hand over the work and return immediately.',
      'It also absorbs spikes: ten times the traffic for an hour becomes a longer queue rather than a broken service. And it decouples — the producer does not need the consumer to be up right now.',
    ],
    cost: 'The user gets "we received it", not "it is done", and your product has to be honest about that. You inherit duplicate delivery, so every consumer must be idempotent. You gain an unbounded backlog that can grow faster than you drain it. Ordering is not free. And debugging becomes harder, because the failure is now in a worker somewhere, minutes after the request that caused it.',
    useWhen: [
      'The work does not need to finish before you answer the user — emails, thumbnails, indexing, reports.',
      'You need to smooth a spiky load onto a fixed-capacity downstream.',
      'You are fanning one event out to several consumers who should not know about each other.',
      'The downstream is unreliable and you want retries handled in one place.',
    ],
    avoidWhen: [
      'The user is waiting for the result right now. A queue in a synchronous path adds latency and buys nothing.',
      'You need a definite yes-or-no answer before responding, like whether a seat was reserved.',
      'The work is trivial. A direct call is simpler and simpler is better.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'queue-drain',
        caption:
          'Four messages in, one out. The queue absorbs the difference — until it does not. The number to watch is not queue length, it is whether length is growing.',
      },
    },
    body: [
      'Two shapes. A work queue hands each message to exactly one consumer, and you scale by adding consumers — jobs, tasks, sending email. A log, like Kafka, keeps an ordered record that many independent consumers read at their own position, and can be re-read from the start. Use a log when several teams need the same events, or when replay matters.',
      'Ordering: total ordering across a whole topic is expensive and usually unnecessary. What you almost always want is ordering per key — all events for one order in sequence, while different orders proceed in parallel. That is what partitioning by key gives you. Say "ordered per user, not globally" and you have answered the question properly.',
      'Retries need a limit and a delay. Retry immediately and forever, and a message that always fails — bad data, a bug — spins forever, burns capacity and hides real work behind it. So: exponential backoff with jitter, a maximum attempt count, and then move it to a dead letter queue.',
      'The dead letter queue is where poison messages go to be looked at by a human. The thing to say, which people forget, is that a DLQ nobody monitors is a silent data loss machine. Alert on messages arriving in it, and have a way to fix and replay them.',
      'Backpressure is the concept that separates a real answer from a diagram. If producers are faster than consumers indefinitely, the queue grows without bound and eventually the whole system falls over, having accepted work it can never do. Real options: scale consumers automatically off the backlog; slow the producer down by refusing or throttling at the edge; shed low-value work deliberately; or set a bounded queue and reject when it is full. All of them mean saying no to someone. Choosing which someone is the design.',
      'What to monitor: consumer lag and its direction, oldest message age (the honest measure of user pain), and DLQ arrival rate.',
    ],
    followUp: {
      q: '"The queue is backed up by an hour. What do you do?"',
      answer:
        'First, work out which of two things it is, because the fixes are opposite. If consumers are healthy and simply outnumbered, scale them out — and check what they are hitting, because often the real ceiling is a database or a downstream API and adding workers just moves the queue there. If consumers are failing and retrying, adding more makes it worse; find the poison message or the broken dependency, and stop the retry storm. Second, triage the backlog rather than draining it in order: if password reset emails and weekly digests share a queue, the digests are now delaying something urgent — separate the queues by priority, which is a lesson worth taking into the design rather than the incident. Third, decide honestly what to drop. An hour-old "your driver is arriving" notification is worse than useless and I would discard it rather than deliver it. Fourth, tell users — a status message beats silence. And afterwards: alert on backlog growth rate, not just size, because size crossing a threshold tells you an hour too late.',
    },
    selfCheck: {
      q: 'Name one thing you should never put behind a queue in a checkout flow, and why.',
      answer:
        'The stock check and reservation. The user is standing there deciding whether they bought the thing, and a queue can only tell them "we will let you know" — so either you show a confirmation you cannot back up, or you make them wait for an async result, which is the same latency with more moving parts. Worse, if two people queue a purchase for the last item, both requests are accepted and one of them gets a cancellation email later, which is a far worse experience than an immediate "sorry, sold out". Take payment and reserve inventory synchronously against the real record; queue everything after it — the receipt email, the warehouse notification, the analytics event — because none of those need the user to be waiting.',
    },
    traps: [
      'Adding a queue and never mentioning idempotency. Duplicate delivery is guaranteed.',
      'No dead letter queue, or one nobody watches.',
      'Assuming global ordering. You almost certainly want per-key ordering.',
      'Treating an unbounded queue as infinite capacity. It is deferred failure.',
    ],
    sayThis:
      '"Order confirmation is synchronous because the user needs a real answer. Everything after it goes on a queue, partitioned by order id so one order\'s events stay in sequence. Consumers are idempotent on message id, five retries with backoff, then a DLQ with an alert. Cost: the receipt email can be a minute late, which is fine, and I need to watch backlog growth rather than size."',
    related: ['idempotency', 'distributed-transactions', 'circuit-breakers'],
  },

  {
    slug: 'distributed-transactions',
    title: 'Distributed transactions — 2PC, sagas, outbox',
    tier: 2,
    oneLine: 'When one action must change two systems, and there is no transaction that covers both.',
    problem: [
      'Inside one database, changing several rows together is solved — that is what a transaction is. Across two databases, or a database and a payment provider, there is no such thing, so you can succeed at one half and fail at the other.',
      'The result is money taken with no order, or an order with no stock. This is one of the most common real-world sources of data that is quietly wrong.',
    ],
    cost: 'Every option here is worse than a local transaction. Two-phase commit costs availability — a coordinator failure leaves participants holding locks. Sagas cost you atomicity — the system is briefly in a state where half the work is done and visible, and you must write and test compensating actions for every step. The outbox pattern costs an extra table and a relay process. There is no free version; the goal is to pick the compromise you can live with and say which.',
    useWhen: [
      'Any workflow spanning two services or two datastores where partial completion is not acceptable.',
      'Order placement touching payment, inventory and fulfilment.',
      'Anything that writes to a database and must then publish an event about it.',
    ],
    avoidWhen: [
      'Both writes could live in one database. Then just use a transaction — the best answer to a distributed transaction question is often "I would not have one".',
      'The second effect is harmless if it never happens, like an analytics ping.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The outbox: the event is written in the same transaction as the data, so it cannot be lost, and a relay publishes it afterwards.',
        nodes: [
          { id: 's', label: 'Order service', kind: 'service', col: 0, row: 0 },
          { id: 'db', label: 'Database', sub: 'orders + outbox', kind: 'store', col: 1, row: 0 },
          { id: 'r', label: 'Relay', sub: 'reads outbox', kind: 'service', col: 2, row: 0 },
          { id: 'q', label: 'Queue', kind: 'queue', col: 3, row: 0 },
          { id: 'n', label: 'one transaction covers both rows — no lost event, no phantom event', kind: 'note', col: 0, row: 1, span: 3 },
        ],
        edges: [
          { from: 's', to: 'db', label: 'one txn' },
          { from: 'r', to: 'db', label: 'poll' },
          { from: 'r', to: 'q', label: 'publish' },
        ],
      },
    },
    body: [
      'Two-phase commit. A coordinator asks everyone "can you commit?", and if all say yes it tells them to commit. It gives real atomicity, and it is blocking: participants hold locks while they wait, and if the coordinator dies after the prepare phase they are stuck holding those locks with no authority to decide. In practice it is used inside single-vendor systems and rarely across services, and saying "I would avoid 2PC across services because a coordinator failure blocks participants holding locks" is the answer people are listening for.',
      'Sagas. Break the workflow into local transactions, each with a compensating action that undoes it. Reserve stock, take payment, book courier; if the courier step fails, refund the payment and release the stock. Each step commits locally so nothing blocks. The costs are real: intermediate states are visible to users, compensation is not a true undo — you cannot un-send an email, and a refund is a new event rather than an erased one — and you must handle a compensation itself failing. Order the steps so the most likely failure happens earliest and the irreversible step happens last. Take payment after you have confirmed stock, not before.',
      'Orchestrated sagas have one component that knows the whole flow: easy to follow and to debug, and it is a component that must not lose its state. Choreographed sagas have services reacting to each other\'s events: no central piece, and no one place tells you what the process is, which becomes painful at about the fifth step.',
      'The outbox pattern solves a narrower, extremely common version of this: you updated the database and now need to publish an event. Do both directly and you can commit the row then crash before publishing (lost event), or publish then fail to commit (phantom event). Instead write the event into an outbox table in the same transaction as the data — now they cannot disagree — and let a relay read that table and publish. The relay may publish twice, so consumers must be idempotent, which they had to be anyway.',
      'Change data capture is the same idea driven from the database log rather than a table, and gets you the same guarantee with less application code.',
    ],
    followUp: {
      q: '"The payment succeeded but the order write failed. Now what?"',
      answer:
        'First, note that ordering the steps this way was a choice, and a poor one — I would take payment last, after stock is reserved and the order row exists in a pending state, because unwinding a payment is the most expensive compensation available. Given it has happened: the payment provider holds the truth, so I reconcile against it rather than against my own logs. The order row write should be retried, since I have the payment reference and can make it idempotent on that reference — most of the time the write failed transiently and the retry completes the order, which is the outcome the customer wants. If it cannot be completed — the item is genuinely gone — issue a refund as a compensating action and tell the customer what happened. Two things make this survivable rather than a scramble: an authorise-then-capture flow, so the money is only held until I know the order is real, and a periodic reconciliation job comparing payments to orders, because a system doing this at volume will always have a small number of stuck cases and you want to find them before the customer does.',
    },
    selfCheck: {
      q: 'You write a row and then publish an event about it. Name the two ways that can go wrong, and the pattern that fixes both.',
      answer:
        'One: the row commits and the process crashes before publishing, so downstream never learns about it — a lost event, and the worst kind because nothing is obviously broken. Two: you publish first and the transaction then rolls back, so consumers act on an order that does not exist — a phantom event. The outbox pattern fixes both by writing the event into a table in the same transaction as the row, which makes them atomic by construction, and having a separate relay publish from that table afterwards. The remaining cost is that the relay can publish the same event twice if it crashes between publishing and marking it sent, so consumers must be idempotent — which, given at-least-once delivery, they needed to be regardless.',
    },
    traps: [
      'Proposing 2PC across microservices without naming the blocking problem.',
      'A saga with no compensating actions written down. That is just a sequence of calls.',
      'Assuming compensation restores the previous state. It does not; it adds a correcting event.',
      'Doing the irreversible step first.',
    ],
    sayThis:
      '"I would avoid a distributed transaction. Reserve stock and create the order in one local transaction, write the event to an outbox in that same transaction, and let a relay publish it. Payment is a saga step after that, with a refund as compensation. Cost: for a few seconds an order exists that is not paid for, so the UI shows it as pending, and I need a reconciliation job for the stuck cases."',
    related: ['idempotency', 'message-queues', 'change-data-capture'],
  },
]
