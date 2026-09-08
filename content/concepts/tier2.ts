import type { Concept } from '@/lib/types'

/**
 * Tier 2 — distributed systems.
 *
 * House style: short sentences, everyday words, one idea per sentence.
 */
export const TIER2: Concept[] = [
  {
    slug: 'replication',
    title: 'Replication',
    tier: 2,
    oneLine: 'Keep the same data on several machines, and decide who is allowed to change it.',
    problem: [
      'One copy of your data means one machine whose failure loses everything, and one machine that has to serve every read. Replication fixes both. Extra copies survive a failure, and they can answer reads.',
      'All the difficulty is in writes. As soon as two copies can be written to on their own, they can disagree. So you have to decide in advance who wins.',
    ],
    cost: 'Copies take time to arrive, so a replica can serve data that is out of date. The user who just wrote something is the most likely person to notice. You also pay for the extra machines. And failing over between copies is genuinely hard: promote too eagerly and you get two leaders, too slowly and you are down.',
    useWhen: [
      'You need to survive a machine, or a whole datacenter, dying.',
      'Reads outnumber writes and you want to spread them out.',
      'You want users on another continent to read from a copy near them.',
    ],
    avoidWhen: [
      'You are adding replicas to take more writes. Replication does not help writes. Every replica does every write. Partitioning is the tool for that.',
      'Your application cannot tolerate old data anywhere, and you have not decided which reads must go to the leader.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'replication-lag',
        caption:
          'The write lands on the leader straight away. The copy takes time to reach the follower. A read in that gap sees the old value. This is replication lag, and it causes most "the app lost my change" reports.',
      },
    },
    body: [
      'Leader and follower is the default, and the one to reach for. All writes go to one leader. Followers copy from it and serve reads. It is simple, write conflicts cannot happen by design, and it is what a normal relational database does out of the box. The costs: the leader is a limit on writes, and when the leader dies something has to notice and promote a follower. Writes fail while that happens.',
      'Failover has one nasty failure worth naming: split brain. The old leader was not dead, only unreachable. Now there are two leaders taking writes, and they drift apart. The defence is a majority rule, where only a node that can talk to more than half the cluster may be leader. Add fencing, so the storage layer refuses the old leader when it comes back. Also, whatever the old leader accepted but had not yet copied is simply gone, and someone has to decide whether that is acceptable.',
      'The real knob is synchronous versus asynchronous replication. Synchronous means the write is not confirmed until a follower has it. No data is lost on failover, but writes now wait for the slowest follower, and if that follower is down, writes stop. Asynchronous means fast writes and a window where data can be lost. The usual middle ground is semi-synchronous: one follower synchronous, the rest asynchronous. You get safety without depending on all of them.',
      'Multi-leader means several leaders accept writes, usually one per region. Local writes are fast everywhere. But now the same row can be edited in two places at once, and you have to resolve that. Options: last-write-wins, which is simple but silently throws away someone\'s work and depends on clocks you cannot trust. Or a merge rule written by your application. Or a data type designed to merge cleanly. Use multi-leader when local write speed genuinely matters and conflicts are rare: collaborative editing, offline-first apps.',
      'Leaderless means the client writes to several nodes and reads from several. With N copies, if writes go to W nodes and reads to R nodes, and W + R > N, then any read touches at least one node that saw the latest write. It is tunable and survives failures well, and it pushes conflict handling onto you. Repairs also happen lazily, so a node can serve old data until it is fixed.',
    ],
    followUp: {
      q: '"Replica lag is 30 seconds and a user reads their own write. What do they see?"',
      answer:
        'Old data, and they will report it as a bug. They just posted a comment and it vanished. This is the read-your-own-writes problem, and the general fix is to send certain reads to the leader. In practice: after a user writes, mark their session for a short window and send their reads to the leader during it. Or record the write position at commit time, and make the read wait until a replica has caught up to that position. That is more precise, and it means reads can block. A cheaper trick for lists: show the user their own item from what they just submitted, instead of fetching it again. The cost of all of this is more read load on the leader, coming exactly from your most active users. And I would alarm on lag, because 30 seconds is a symptom, usually a long transaction or a bulk write hogging the leader.',
    },
    selfCheck: {
      q: 'You add five read replicas. Your write throughput is still maxed out. Why did that not help?',
      answer:
        'Because every replica applies every write. Adding replicas multiplies read capacity and adds zero write capacity. It actually adds a little load to the leader, which now has to ship the log to more machines. The write ceiling is set by what one leader can commit. To raise it you have to split the data so different writes go to different machines. That is partitioning, not replication. Saying this out loud is worth a lot, because reaching for replicas to fix a write problem is one of the most common wrong turns in a design interview.',
    },
    traps: [
      'Assuming failover is automatic and instant. Somebody has to notice the failure, noticing has a timeout, and that timeout is downtime.',
      'Drawing async replication and then promising no data loss.',
      'Multi-leader with no plan for conflicts. That plan is the entire question.',
    ],
    sayThis:
      '"Single leader with two async followers, plus one semi-sync follower so a failover does not lose committed writes. Reads go to followers, except within ten seconds of a user\'s own write, which go to the leader. Cost: the leader is still my write ceiling, and failover means a few seconds of write errors."',
    related: ['partitioning', 'consistency-models', 'cap-pacelc', 'consensus'],
  },

  {
    slug: 'partitioning',
    title: 'Partitioning (sharding)',
    tier: 2,
    oneLine: 'Split the data so different machines own different pieces. It is the only way to scale writes.',
    problem: [
      'When one machine can no longer hold the data, or take the write rate, you split it. Each machine owns a slice, so ten machines take roughly ten times the writes.',
      'Everything then rests on one decision: what you split by. Pick well and the system grows quietly for years. Pick badly and you get one overloaded machine while nine sit idle, and fixing it means moving all the data.',
    ],
    cost: 'You lose the things that were free on one machine. A query that does not include the shard key has to ask every shard and merge the results. Transactions across shards need a special protocol, or a redesign. Joins across shards are painful. Uniqueness across shards is not free. And rebalancing when you add machines is a project, not a config change.',
    useWhen: [
      'Write volume is past what one machine can commit, and you have the number to prove it.',
      'The data genuinely does not fit, or backups and recovery have become unmanageable.',
      'You need to limit blast radius, or keep certain data inside certain countries.',
    ],
    avoidWhen: [
      'You have not filled one machine yet. Most systems never need this, and doing it early costs you on every future feature.',
      'Your queries are unpredictable and touch everything. You will be asking every shard on every query.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'sharding',
        caption:
          'The key decides the shard, the same way every time. Which means the key also decides whether your load is even, or whether one shard gets everything.',
      },
    },
    body: [
      'By range: shard A holds keys a–h, shard B holds i–p, and so on. Range queries are efficient, because neighbouring keys live together. The danger is uneven load. Sharding by timestamp puts all of today\'s writes on one shard while the rest sit idle. That is the classic mistake.',
      'By hash: hash the key and take the remainder. Load spreads evenly, and you lose range queries completely, because neighbouring keys land on unrelated machines. Plain modulo has a second problem. Adding a machine changes almost every mapping, so nearly all the data has to move. Consistent hashing exists to fix exactly that.',
      'Hot partitions are the failure everyone meets. Sharding a social product by user id is even, until one user has 200 million followers and their shard melts. There are two defences. Give the hot key extra sub-partitions by adding a small random suffix, then read from all of them. That is more read work for everyone, in exchange for surviving the outlier. Or detect the hot key and handle it on a completely separate path, which is what most real systems end up doing. Say out loud that spreading keys evenly does not mean spreading traffic evenly.',
      'Choosing the key. It should appear in almost every query, so most requests hit one shard. It should have many different values. And its traffic should be roughly even. User id and tenant id are usually good. Timestamps are usually bad. A combined key like (tenant_id, entity_id) is often the right shape.',
      'Resharding is where the real difficulty hides. Doing it with no downtime means writing to both old and new layouts, backfilling history, checking the two agree, switching reads over, then removing the old path. That is weeks of work. The way to avoid it is to start with far more logical partitions than machines, say 1024, and map many logical partitions onto each physical machine. Then growing means moving whole logical partitions, with no re-hashing at all. Mentioning this in an interview is a strong signal.',
    ],
    followUp: {
      q: '"One user has 200 million followers. What breaks?"',
      answer:
        'The shard holding that user, and then everything that depends on it. If I copy each post out to every follower, one post from them creates 200 million writes. That floods the queue and delays everyone else\'s timeline, not just theirs. If I keep their follower list on one shard, that shard is hot for reads too. The answer is to stop treating them like a normal user. Above a follower threshold, do not copy the post out. Leave it in place and have readers pull it when they load their timeline, merging it with the posts that were copied to them. Most users get the cheap read. The handful of huge accounts get the expensive read, and there are few enough of them to cache heavily. Cost: two code paths for the same feature, forever, plus a threshold that needs tuning. And timelines now come from two sources, so ordering needs care.',
    },
    selfCheck: {
      q: 'You shard a messaging system by message id, hashed. What query just became expensive, and what would you shard by instead?',
      answer:
        '"Give me this conversation\'s last 50 messages", which is the most common query in the whole product. Hashing by message id scatters one conversation across every shard, so that read has to ask the whole cluster, then merge and sort the answers. Shard by conversation id instead, and sort by timestamp inside it. Then one conversation lives on one shard, and the hot query is a single continuous read. The trade is that one enormous group chat becomes a hot partition. That is a much rarer problem, and one you can handle on its own.',
    },
    traps: [
      'Sharding by timestamp. Every write goes to the newest shard.',
      'Choosing a key that is not in your main query, so every read hits every shard.',
      'Assuming rebalancing is easy. Plan the logical-partition trick up front, or budget weeks later.',
    ],
    sayThis:
      '"Hash-partition by conversation id into 1024 logical partitions mapped onto 16 machines, so growing means moving partitions rather than re-hashing. Cost: any query not scoped to a conversation has to ask every shard, and a very large group chat can still make one partition hot — I would handle those specifically rather than change the scheme."',
    related: ['consistent-hashing', 'replication', 'sql-vs-nosql'],
  },

  {
    slug: 'cap-pacelc',
    title: 'CAP and PACELC as real tradeoffs',
    tier: 2,
    oneLine: 'When the network breaks you must choose: refuse the write, or accept it and be inconsistent.',
    problem: [
      'Networks break apart. A machine cannot tell "you are dead" from "I cannot reach you". When that happens, a distributed system has exactly two options and no third one. Keep answering, with data that may be wrong. Or stop answering.',
      'CAP is that observation, and nothing more. It becomes genuinely useful once you stop treating it as a slogan and start applying it to one operation at a time.',
    ],
    cost: 'Using CAP as a label makes you less accurate. Real databases are not "CP" or "AP" overall. The same system is one thing for one operation and the other for another. And CAP only describes what happens during a network split, which is rare. It says nothing about the normal case, which is where you actually live.',
    useWhen: [
      'Deciding what one specific operation should do when it cannot reach the machine that owns the truth.',
      'Explaining why the payment path and the like-count path behave differently in the same product.',
    ],
    avoidWhen: [
      'Labelling a whole system. It is per operation.',
      'Explaining ordinary slowness. That is the second half of PACELC, not CAP.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The network has split. You are already choosing — the only question is whether you chose on purpose.',
        a: {
          title: 'Refuse the write (consistency)',
          points: [
            'Only the side that can reach a majority accepts writes. The other side returns an error.',
            'Nobody ever sees two different truths. No merge to write, no apology to send.',
            'Users on the minority side are down, even though their machines are fine.',
            'Right for: seats, stock, balances, unique names, anything you cannot un-sell.',
          ],
        },
        b: {
          title: 'Accept the write (availability)',
          points: [
            'Both sides keep taking writes and sort it out once the network heals.',
            'Everyone stays up. Nobody sees an error page.',
            'You now own a merge problem, and sometimes a business problem.',
            'Right for: likes, view counts, drafts, presence, carts — anything where "we merged it" is fine.',
          ],
        },
        verdict:
          'Decide per operation, not per system. The same shopping app should refuse to confirm an order it cannot verify, and should happily accept an "add to cart" that it merges later. Saying that sentence in an interview is worth more than knowing what the letters stand for.',
      },
    },
    body: [
      'The exact statement: when the network splits, you cannot have both consistency and availability. It is not "pick two of three". Splits are not optional, they happen to you. So the real choice is between the other two, and only while the split lasts.',
      'PACELC finishes the thought, and its second half is the more useful one day to day. If there is a Partition, choose Availability or Consistency. Else — the 99.9% of the time when nothing is broken — choose Latency or Consistency. That second part is where systems actually differ. A store that confirms a write on one node is fast, and can serve old reads. A store that confirms only after a majority agrees is slower on every single write, forever, split or no split. Most people learn only the first half, and then cannot explain why a strongly consistent database is slow on a good day.',
      'Be clear about this: strong consistency costs speed permanently, not only during failures. That is the cost you name when you choose it.',
    ],
    followUp: {
      q: '"A whole region is down. What happens to your system?"',
      answer:
        'It depends which data, and I would answer path by path. Reads: if I have replicas in other regions, reads keep working, possibly with old data, and I would say how old. Writes: if the leader was in the dead region, writes fail until something promotes a new leader elsewhere. That takes seconds to a minute, depending on how eager the failover is. Being eager risks promoting during a brief network hiccup and ending up with two leaders. For contested things like stock, I would rather be down for that region\'s writes than sell the same seat twice, so I accept being unavailable and say so. For uncontested things like posting a comment or recording a view, I would take the write locally and reconcile afterwards. What I would not do is claim everything keeps working perfectly. That answer tells the interviewer I have not thought about it.',
    },
    selfCheck: {
      q: 'Your product has both "add to cart" and "confirm order". Should they make the same CAP choice? Explain in one sentence each.',
      answer:
        'No. Add to cart should stay available: if the network is broken, accept it locally and merge later, because the worst case is a cart with a duplicate item, which the user fixes in two seconds. Confirm order should refuse: if I cannot check stock and take payment against the real record, I return an error, because the worst case there is selling something we do not have, which costs money, support time and trust. Same product, same request, opposite choice. It is driven by what the failure costs, not by which database we picked.',
    },
    traps: [
      'Reciting "pick two of three". Network splits are not something you pick.',
      'Calling a database "AP" or "CP" as if it were fixed. Most are configurable per operation.',
      'Forgetting the "else" half — that consistency costs speed even when nothing is broken.',
    ],
    sayThis:
      '"During a network split I would keep browse and cart available and let them reconcile, and I would make checkout refuse rather than risk overselling. And even with no split, that checkout path pays a few extra milliseconds per write for majority agreement — that is the price of never selling the same seat twice."',
    related: ['consistency-models', 'replication', 'consensus'],
  },

  {
    slug: 'consistency-models',
    title: 'Consistency models',
    tier: 2,
    oneLine: 'Exact words for how out of date a read is allowed to be.',
    problem: [
      'Once data lives on more than one machine, "is this current?" stops having one answer. Consistency models give you the words to say exactly how old a read may be, so you can choose per feature instead of waving your hands.',
      'This is where interviews separate people. "It is eventually consistent" is a phrase. "A user sees their own comment immediately, and sees other people\'s within about two seconds" is a design.',
    ],
    cost: 'Stronger promises cost speed on every operation, and availability during failures. Weaker promises cost you correctness bugs that only appear under load, in production, and cannot be reproduced on your laptop. They also move the difficulty into application code, where it is easy to get quietly wrong.',
    useWhen: [
      'Strong: money, stock, seats, unique usernames, permission checks. Anything where being wrong cannot be undone.',
      'Read-your-own-writes: anywhere a user edits something and then immediately looks at it. That is most user-facing writes.',
      'Eventual: counts, feeds, search results, analytics, presence. Anything a person cannot tell is two seconds old.',
    ],
    avoidWhen: [
      'Do not use strong consistency by default because it feels safer. You are paying on every read for a promise most of your features do not need.',
      'Do not use eventual consistency for a decision the user cannot undo.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Same write, three promises. Each row is a promise you can offer per feature — pick the cheapest one that keeps users from seeing something wrong.',
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
      'Strong (linearizable): once a write is confirmed, every later read anywhere returns it. The system behaves like a single machine. It costs a majority round trip on writes, and often on reads too, and it goes unavailable on the smaller side of a network split.',
      'Eventual: if writes stop, all copies end up the same. It promises nothing about when. It also allows a read to go backwards in time. You refresh and see an older value than the one you just saw. That is allowed, and it surprises people.',
      'Read-your-own-writes: you always see your own changes, and other people\'s may lag behind. This is the sweet spot for user-facing products, and it is far cheaper than strong consistency, because you only have to route one user\'s reads carefully instead of making the whole system agree. You get it by pinning a user to the leader briefly after a write, or by tracking the write position and reading from a replica that has caught up to it.',
      'Monotonic reads: you never see time run backwards. You get it by keeping a user on one replica, so they at least see one steady version of history. It is cheap, and it removes a whole class of "the page keeps flipping between two values" complaints.',
      'Causal consistency: things that depend on each other show up in the right order. Nobody sees the reply before the comment. It is weaker than strong and much cheaper, and it is usually what people mean when they say a system "feels" correct.',
      'The practical move in an interview is to go feature by feature. "The like count is eventual, a second of lag is invisible. The comment you just posted is read-your-own-writes, or you will think it failed. The seat you just booked is strong, because two people cannot have it."',
    ],
    followUp: {
      q: '"Two users click at the same millisecond. What happens?"',
      answer:
        'It depends entirely on whether the thing they are clicking is contested. If it is a like button, both writes land, the count settles, and nobody cares. I would use an eventual counter and not spend a transaction on it. If it is the last seat, exactly one must win, and the way to guarantee that is to make the decision at a single point. That means a conditional update in the database that only succeeds if the seat is still free, or a unique constraint on (event, seat) so the second insert simply fails. Notice I am not suggesting we check and then write in application code, because that is the race itself. The loser gets a clear message and a suggested alternative. Cost: that write path is now strongly consistent, so it is slower, and it goes unavailable if the owning partition is unreachable. I accept that, because selling one seat twice is worse than an error message.',
    },
    selfCheck: {
      q: 'A user posts a comment and refreshes, and it is not there. Which consistency guarantee was missing, and what is the cheapest way to add it?',
      answer:
        'Read-your-own-writes. Their write went to the leader, and their refresh was served by a replica that had not caught up. The cheapest fix is not to make the whole system strongly consistent, because that slows every read for everyone. It is to send that one user\'s reads to the leader for a short window after they write. Or have the client pass the write position it saw, and make the read wait for a replica that is at least that current. Cheaper still for this exact case: show the comment from what the client already has, and do not fetch it again. The cost of the leader-pinning approach is that your most active users create the most leader load.',
    },
    traps: [
      'Saying "eventually consistent" as if it were a design. How long is eventual, and what does the user see in the meantime?',
      'Applying one model to the whole system instead of per feature.',
      'Forgetting that eventual consistency lets reads go backwards.',
    ],
    sayThis:
      '"Feed and counts are eventually consistent, a couple of seconds of lag nobody notices. A user\'s own posts are read-your-own-writes, so I pin their reads to the leader for ten seconds after they write. The balance check at payment is strongly consistent, and I accept the extra latency there, because being wrong costs real money."',
    related: ['replication', 'cap-pacelc', 'idempotency'],
  },

  {
    slug: 'consensus',
    title: 'Consensus, at concept level',
    tier: 2,
    oneLine: 'How a group of machines agrees on one answer when some of them cannot be reached.',
    problem: [
      'Some decisions must have exactly one answer across the whole cluster. Who is the leader. Which config is live. Who holds the lock. Ask each machine on its own and they will disagree, especially during the failure you built this for.',
      'Consensus algorithms — Raft, Paxos — solve that. You will never implement one. You need to know what they give you, what they cost, and when to reach for something that already has one built in.',
    ],
    cost: 'Every decision needs a round trip to a majority, so it is slow compared to a local write, and it gets slower the further apart the machines are. The cluster stops accepting writes if it cannot reach a majority, and that is deliberate. And it does not get faster with more machines. More machines means a bigger majority to convince, so a 7-node cluster is slower than a 3-node one.',
    useWhen: [
      'Electing a leader, and failing over.',
      'Distributed locks and leases, where two owners would be a disaster.',
      'Configuration and cluster membership that everyone must agree on.',
      'Small, critical metadata, like which shard lives where.',
    ],
    avoidWhen: [
      'High-volume application data. Do not push a million writes a second through a consensus group. It is the wrong tool and it will not work.',
      'Anything where a slightly wrong answer is fine. Use something cheaper.',
      'When a single database with a unique constraint already gives you the guarantee. It does, and it is far simpler.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Five nodes. Three is a majority. The two on the minority side cannot make decisions — which is exactly what stops split brain.',
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
      'Here is what Raft actually does, in plain terms. One node is the leader. All decisions go through it, and it adds them to an ordered log. It sends each entry to the others. Once a majority has written it down, the entry is committed and can never be lost or reordered. If the leader stops sending heartbeats, the others wait a random moment, and one of them stands for election. Whoever gets votes from a majority becomes leader. Because a majority is more than half, two leaders cannot both be elected. That is the whole trick.',
      'What it gives you: one ordered list of decisions that survives any minority failing, and no split brain. What it does not do: work when more than half are down, go faster with more machines, or handle high write volume.',
      'The practical version of all this is: do not build it. Use etcd, ZooKeeper, or the consensus already inside your database or your orchestrator. The right answer to "how do you elect a leader" is usually "I would keep the leadership lease in etcd", not a description of an algorithm.',
      'Distributed locks deserve a warning. A lock held by a process that then pauses, for garbage collection or a slow disk, can expire while that process still believes it holds it. Now two workers are doing the same job. Leases with an expiry help, but they do not remove the problem. The solid pattern is a fencing token. Every time the lock is taken, it returns a number that only goes up. The process sends that number with each write, and the storage layer rejects any write carrying an old number. If you cannot fence, make the operation safe to repeat, so doing it twice is harmless. That is usually easier, and it is the better answer in most interviews.',
    ],
    followUp: {
      q: '"Why not just use a lock in Redis?"',
      answer:
        'For many jobs that is genuinely fine, and I would say so rather than over-build. A single Redis with SET NX and an expiry gives you cheap mutual exclusion, and if the worst case of two workers running is a duplicate email, take it. Here are the reasons to reach for something stronger. A single Redis is a single point of failure, so if it dies the lock is gone. The multi-node version makes assumptions about clocks that people argue about. And expiry-based locks can be held by two processes at once, when one pauses long enough for its lease to run out without it noticing. So my rule is this. If two holders means a duplicate side effect I can make safe to repeat, Redis is fine and simpler. If two holders means corrupted data or a double charge, I want a real consensus store and a fencing token, and I accept the extra latency and the extra system to run.',
    },
    selfCheck: {
      q: 'You have a 5-node consensus cluster. Two nodes fail. Does it still work? What if three fail?',
      answer:
        'Two failing is fine. Three remain, and three is a majority of five, so decisions still commit. There is just no spare capacity left. Three failing stops it. The remaining two cannot form a majority, so the cluster refuses new decisions. You can still read old data from it, but it will not accept writes. That refusal is the feature, not a bug. The alternative is the two survivors making decisions while the other three do the same on the far side of a split, and then you have two conflicting histories and no way to merge them. The rule of thumb: a cluster of 2f+1 survives f failures, so 3 nodes survive 1 and 5 survive 2. Use odd numbers, because 4 nodes survive the same single failure as 3 while being slower.',
    },
    traps: [
      'Offering to implement Raft. Nobody wants that. They want to know you would use something that already has it.',
      'Pushing application traffic through a consensus store.',
      'Trusting a lock with no fencing token and no idempotency behind it.',
    ],
    sayThis:
      '"Leadership is a lease in etcd, renewed every few seconds. Only the lease holder runs the job. Cost: a majority round trip per renewal, and if etcd is unreachable nobody runs the job — which I prefer to two nodes running it. And the job itself is safe to repeat, so even an overlapping lease is survivable."',
    related: ['replication', 'idempotency', 'cap-pacelc'],
  },

  {
    slug: 'idempotency',
    title: 'Idempotency, and why exactly-once is a myth',
    tier: 2,
    oneLine: 'Make doing it twice the same as doing it once, because it will happen twice.',
    problem: [
      'A request succeeds and the response is lost on the way back. The client cannot tell that apart from a failure, so it retries. If your handler charges a card, you have now charged twice. This is not a rare edge case. At scale it happens constantly.',
      'You cannot stop duplicate delivery. That is the myth. What you can do is make duplicates harmless, and that is a solvable engineering problem.',
    ],
    cost: 'You need somewhere to remember what you have already done: a key store with a retention window. That store is now on the path of every write. You have to decide how long to remember, and what to return for a repeat. Ideally the original result, which means storing the response too. And you have to pick the key carefully, because a bad key either misses real duplicates or blocks requests that were meant to repeat.',
    useWhen: [
      'Payments, orders, transfers. Anything that moves money or stock.',
      'Every consumer of a message queue, with no exceptions. At-least-once delivery is normal.',
      'Any endpoint a mobile client calls over a shaky network.',
      'Any operation with an outside effect: sending an email, calling a partner API.',
    ],
    avoidWhen: [
      'Operations that are already safe to repeat. Setting a value to X, or deleting by id, are already fine. Adding a key store there is pure cost.',
      'Plain reads.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The same key arrives twice. The first does the work and stores the result. The second never reaches the charge — it replays the stored response.',
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
      'There are three delivery promises. At-most-once: send and forget. It may be lost, and it is almost never what you want. At-least-once: retry until acknowledged. It may duplicate, and this is what real systems give you. Exactly-once delivery is impossible on a network that can drop messages, because you cannot tell a lost request from a lost response. What you can achieve, and what people mean when they say exactly-once, is at-least-once delivery plus processing that is safe to repeat. That produces an exactly-once effect. Say it that way and you will sound like you have shipped this.',
      'How to build it. The client makes a key: one UUID per logical operation, created once and reused across every retry. Not regenerated on each attempt, which is the bug that quietly defeats the whole scheme. The server tries to insert that key into a table with a unique constraint, inside the same transaction as the work. If the insert fails, it is a duplicate, so return the stored response. Doing the key insert and the work in one transaction is what makes it airtight. Two separate steps leave a window where you crash in between.',
      'Choosing the key. Client-generated UUIDs are best for user actions. For queue consumers, use the message id, or a hash of the meaningful content. Avoid keys containing a timestamp or an attempt number, because those change on each retry and defeat the point.',
      'Retention: keep keys long enough to cover the longest retry you can imagine, usually 24 hours to a few days, then expire them. Keeping them forever gives you a growing table nobody prunes.',
      'The consumer version: do the work, record the message id as done, and commit both together. If you cannot do it in one transaction, because the side effect is an external API, then make that external call carry its own idempotency key. Every serious payment provider supports exactly that.',
    ],
    followUp: {
      q: '"The write worked but the response was lost and the client retried. What happens?"',
      answer:
        'With idempotency keys, nothing bad. The retry carries the same key, the server sees it is already claimed, and returns the original result. The client gets a success and the card is charged once. Without them, you charge twice and hear about it from a customer. The detail I would add is what happens if the retry arrives while the first request is still running. The key is claimed but there is no result yet. I would return an "in progress, retry shortly" status, rather than doing the work again or returning a wrong answer, so the client backs off and asks again. And I would make sure the client reuses the key across retries instead of generating a fresh one, because that is the most common way this gets built wrongly.',
    },
    selfCheck: {
      q: 'A queue delivers the same message twice. Name two ways to make that harmless, and say which you would prefer.',
      answer:
        'First: record processed message ids in a table with a unique constraint, and commit that record in the same transaction as the work. The duplicate hits the constraint and gets thrown away. Second: design the operation so repeating it changes nothing. Set the status to SHIPPED rather than adding one to a counter. Upsert by a natural key rather than insert. I prefer the second when I can get it, because it needs no extra storage, no retention policy, and it cannot be broken by someone forgetting to check. The first is the general fallback for work that genuinely cannot be repeated, like sending money. The one thing I would not do is try to make the queue deliver exactly once. That is not on offer.',
    },
    traps: [
      'Claiming a queue gives exactly-once delivery. It gives at-least-once, and you supply the rest.',
      'Generating a fresh key on each retry.',
      'Checking "have I seen this key" and doing the work as two separate steps, with a crash window in between.',
    ],
    sayThis:
      '"Every write endpoint takes an Idempotency-Key. I insert it with a unique constraint in the same transaction as the work, so a retry hits the constraint and I replay the stored response. Cost: an extra table on the write path and a retention window to manage — worth it, because at-least-once is the only delivery I can actually get."',
    related: ['message-queues', 'distributed-transactions', 'circuit-breakers'],
  },

  {
    slug: 'message-queues',
    title: 'Message queues and backpressure',
    tier: 2,
    oneLine: 'Write the job down now, do it soon, and survive the gap in between.',
    problem: [
      'When one part of a system is fast and the next is slow, calling directly means the fast part waits, and users feel it. A queue lets the fast part hand the work over and return straight away.',
      'It also soaks up spikes. Ten times the traffic for an hour becomes a longer queue instead of a broken service. And it separates the two sides: the producer does not need the consumer to be up right now.',
    ],
    cost: 'The user gets "we received it", not "it is done", and your product has to be honest about that. You inherit duplicate delivery, so every consumer must be safe to repeat. You gain a backlog with no limit, which can grow faster than you drain it. Ordering is not free. And debugging gets harder, because the failure is now in a worker somewhere, minutes after the request that caused it.',
    useWhen: [
      'The work does not have to finish before you answer the user: emails, thumbnails, indexing, reports.',
      'You need to smooth spiky load onto something with fixed capacity.',
      'You are sending one event to several consumers who should not know about each other.',
      'The thing downstream is unreliable and you want retries handled in one place.',
    ],
    avoidWhen: [
      'The user is waiting for the result right now. A queue in that path adds delay and buys nothing.',
      'You need a definite yes or no before responding, like whether a seat was reserved.',
      'The work is tiny. A direct call is simpler, and simpler is better.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'queue-drain',
        caption:
          'Four messages in, one out. The queue absorbs the difference, until it cannot. The number to watch is not queue length, it is whether the length is growing.',
      },
    },
    body: [
      'There are two shapes. A work queue hands each message to exactly one consumer, and you scale by adding consumers. Use it for jobs, tasks, sending email. A log, like Kafka, keeps an ordered record that many independent consumers read at their own position, and can be read again from the start. Use a log when several teams need the same events, or when replay matters.',
      'Ordering. Putting a whole topic in one global order is expensive and usually unnecessary. What you almost always want is ordering per key: all events for one order in sequence, while different orders move in parallel. That is what partitioning by key gives you. Say "ordered per user, not globally" and you have answered the question properly.',
      'Retries need a limit and a delay. Retry immediately and forever, and a message that always fails, from bad data or a bug, spins forever, burns capacity and hides real work behind it. So use exponential backoff with jitter, a maximum number of attempts, and then move it aside.',
      'Where it moves to is the dead letter queue, where poison messages wait for a human. The thing people forget to say is that a dead letter queue nobody watches is a silent data-loss machine. Alert when messages arrive in it, and have a way to fix and replay them.',
      'Backpressure is what separates a real answer from a diagram. If producers stay faster than consumers, the queue grows without limit, and eventually the whole system falls over, having accepted work it can never do. The real options are: scale consumers automatically based on the backlog. Slow the producer down by refusing or throttling at the edge. Deliberately drop low-value work. Or set a maximum queue size and reject when it is full. Every one of them means saying no to someone. Choosing which someone is the design.',
      'What to monitor: how far consumers are behind and whether that is growing, the age of the oldest message (the honest measure of user pain), and how fast messages arrive in the dead letter queue.',
    ],
    followUp: {
      q: '"The queue is backed up by an hour. What do you do?"',
      answer:
        'First, work out which of two things it is, because the fixes are opposite. If consumers are healthy and just outnumbered, add more. And check what they are hitting, because often the real limit is a database or a downstream API, and adding workers just moves the queue there. If consumers are failing and retrying, adding more makes it worse. Find the poison message or the broken dependency, and stop the retry storm. Second, sort the backlog instead of draining it in order. If password reset emails and weekly digests share a queue, the digests are now delaying something urgent. Split the queues by priority, which is a lesson worth taking into the design rather than the incident. Third, decide honestly what to throw away. An hour-old "your driver is arriving" notification is worse than useless, and I would drop it rather than deliver it. Fourth, tell users. A status message beats silence. And afterwards, alert on how fast the backlog is growing, not just its size, because size crossing a threshold tells you an hour too late.',
    },
    selfCheck: {
      q: 'Name one thing you should never put behind a queue in a checkout flow, and why.',
      answer:
        'The stock check and reservation. The user is standing there wanting to know whether they bought the thing, and a queue can only say "we will let you know". So either you show a confirmation you cannot back up, or you make them wait for an async result, which is the same delay with more moving parts. Worse, if two people queue a purchase for the last item, both requests are accepted and one of them gets a cancellation email later. That is a far worse experience than an immediate "sorry, sold out". Take payment and reserve stock synchronously against the real record. Queue everything after it: the receipt email, the warehouse notification, the analytics event. None of those need the user to be waiting.',
    },
    traps: [
      'Adding a queue and never mentioning idempotency. Duplicate delivery is guaranteed.',
      'No dead letter queue, or one nobody watches.',
      'Assuming global ordering. You almost certainly want ordering per key.',
      'Treating a queue with no size limit as infinite capacity. It is failure, postponed.',
    ],
    sayThis:
      '"Order confirmation is synchronous, because the user needs a real answer. Everything after it goes on a queue, partitioned by order id so one order\'s events stay in sequence. Consumers are idempotent on message id, five retries with backoff, then a dead letter queue with an alert. Cost: the receipt email can be a minute late, which is fine, and I need to watch backlog growth rather than size."',
    related: ['idempotency', 'distributed-transactions', 'circuit-breakers'],
  },

  {
    slug: 'distributed-transactions',
    title: 'Distributed transactions — 2PC, sagas, outbox',
    tier: 2,
    oneLine: 'When one action must change two systems, and no transaction covers both.',
    problem: [
      'Inside one database, changing several rows together is a solved problem. That is what a transaction is. Across two databases, or a database and a payment provider, there is no such thing. So you can succeed at one half and fail at the other.',
      'The result is money taken with no order, or an order with no stock. This is one of the most common real-world sources of data that is quietly wrong.',
    ],
    cost: 'Every option here is worse than a local transaction. Two-phase commit costs availability, because a coordinator failure leaves the others holding locks. Sagas cost you all-or-nothing, because the system is briefly in a state where half the work is done and visible, and you have to write and test an undo action for every step. The outbox pattern costs an extra table and a relay process. There is no free version. The goal is to pick the compromise you can live with, and say which one you picked.',
    useWhen: [
      'Any workflow crossing two services or two datastores, where finishing halfway is not acceptable.',
      'Placing an order that touches payment, stock and delivery.',
      'Anything that writes to a database and then has to publish an event about it.',
    ],
    avoidWhen: [
      'Both writes could live in one database. Then just use a transaction. The best answer to a distributed transaction question is often "I would not have one".',
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
      'Two-phase commit. A coordinator asks everyone "can you commit?" If they all say yes, it tells them to commit. It gives you real all-or-nothing behaviour, and it blocks. The participants hold locks while they wait, and if the coordinator dies after asking, they are stuck holding those locks with no authority to decide. In practice it is used inside single-vendor systems and rarely across services. Saying "I would avoid 2PC across services, because a coordinator failure leaves participants blocked holding locks" is the answer people are listening for.',
      'Sagas. Break the workflow into local transactions, each with an undo action. Reserve stock, take payment, book the courier. If the courier step fails, refund the payment and release the stock. Each step commits locally, so nothing blocks. The costs are real. Users can see the in-between states. The undo is not a true undo: you cannot un-send an email, and a refund is a new event, not an erased one. And you have to handle an undo itself failing. Order the steps so the most likely failure comes first, and the step you cannot take back comes last. Take payment after you have confirmed stock, not before.',
      'An orchestrated saga has one component that knows the whole flow. It is easy to follow and to debug, and it is a component that must not lose its state. A choreographed saga has services reacting to each other\'s events. There is no central piece, and no single place that tells you what the process is, which gets painful around the fifth step.',
      'The outbox pattern solves a narrower and extremely common version of this. You updated the database, and now you need to publish an event. Do both directly and you can commit the row then crash before publishing, which loses the event. Or publish first and then fail to commit, which creates an event about something that never happened. Instead, write the event into an outbox table in the same transaction as the data, so the two cannot disagree. Then let a relay read that table and publish. The relay may publish twice, so consumers must be safe to repeat, which they had to be anyway.',
      'Change data capture is the same idea, driven from the database log instead of a table. It gives you the same guarantee with less application code.',
    ],
    followUp: {
      q: '"The payment succeeded but the order write failed. Now what?"',
      answer:
        'First, note that ordering the steps this way was a choice, and a poor one. I would take payment last, after stock is reserved and the order row exists in a pending state, because undoing a payment is the most expensive undo available. Given it has happened: the payment provider holds the truth, so I reconcile against it, not against my own logs. The order row write should be retried, because I have the payment reference and can make the retry safe on that reference. Most of the time the write failed for a temporary reason, and the retry completes the order, which is the outcome the customer wants. If it cannot be completed, because the item is genuinely gone, issue a refund as the undo step and tell the customer what happened. Two things make this survivable rather than a scramble. An authorise-then-capture flow, so the money is only held until I know the order is real. And a regular reconciliation job comparing payments to orders, because a system doing this at volume will always have a few stuck cases, and you want to find them before the customer does.',
    },
    selfCheck: {
      q: 'You write a row and then publish an event about it. Name the two ways that can go wrong, and the pattern that fixes both.',
      answer:
        'One: the row commits and the process crashes before publishing, so nothing downstream ever learns about it. That is a lost event, and it is the worst kind, because nothing looks broken. Two: you publish first and the transaction then rolls back, so consumers act on an order that does not exist. That is a phantom event. The outbox pattern fixes both. Write the event into a table in the same transaction as the row, which makes them all-or-nothing by design, and have a separate relay publish from that table afterwards. The remaining cost is that the relay can publish the same event twice, if it crashes between publishing and marking it sent. So consumers must be safe to repeat, which, given at-least-once delivery, they needed to be anyway.',
    },
    traps: [
      'Proposing 2PC across microservices without naming the blocking problem.',
      'A saga with no undo actions written down. That is just a list of calls.',
      'Assuming an undo restores the previous state. It does not. It adds a correcting event.',
      'Doing the step you cannot take back first.',
    ],
    sayThis:
      '"I would avoid a distributed transaction. Reserve stock and create the order in one local transaction, write the event to an outbox in that same transaction, and let a relay publish it. Payment is a saga step after that, with a refund as the undo. Cost: for a few seconds an order exists that is not paid for, so the UI shows it as pending, and I need a reconciliation job for the stuck cases."',
    related: ['idempotency', 'message-queues', 'change-data-capture'],
  },
]
